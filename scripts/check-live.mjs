import { pathToFileURL } from 'node:url';

export const checks = [
  { id: 'portfolio-home', url: 'https://jeffkazzee.dev/', type: 'text/html', contains: 'Jeff Kazzee' },
  { id: 'portfolio-markdown', url: 'https://jeffkazzee.dev/for-agents/', accept: 'text/markdown', type: 'text/markdown', contains: 'Markdown' },
  { id: 'portfolio-index', url: 'https://jeffkazzee.dev/api/content.json', type: 'application/json', json: true },
  { id: 'arcade-home', url: 'https://www.llmarcade.fun/', type: 'text/html', contains: 'LLM Arcade', asset: true },
];

/** Read a complete response within a byte limit, without logging its contents. */
async function readBounded(response, maxBytes) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      let chunk;
      try { chunk = await reader.read(); } catch { throw new Error('body-read-failed'); }
      if (chunk.done) return text + decoder.decode();
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new Error('body-too-large');
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

/** Check one fixed public endpoint and return only a sanitized failure category. */
export async function probe(check, fetcher = fetch) {
  const request = async (url, headers = {}) => {
    const response = await fetcher(url, { headers, redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (response.status !== 200) throw new Error('http-status');
    return response;
  };
  try {
    const response = await request(check.url, { accept: check.accept ?? check.type });
    if (!response.headers.get('content-type')?.includes(check.type)) throw new Error('content-type');
    const body = await readBounded(response, 2 * 1024 * 1024);
    if (check.contains && !body.includes(check.contains)) throw new Error('content-mismatch');
    if (check.json) {
      let value;
      try { value = JSON.parse(body); } catch { throw new Error('invalid-json'); }
      if (!value || typeof value !== 'object' || value.site !== 'https://jeffkazzee.dev' || !Array.isArray(value.projects) || !value.projects.length) throw new Error('index-shape');
    }
    if (check.asset) {
      const path = body.match(/<script\b[^>]*\bsrc=["'](\/assets\/[^"']+\.js)["']/i)?.[1];
      if (!path) throw new Error('missing-entry');
      const asset = await request(new URL(path, check.url).href);
      if (!/javascript/.test(asset.headers.get('content-type') ?? '')) throw new Error('asset-type');
      if (!(await readBounded(asset, 8 * 1024 * 1024)).trim()) throw new Error('empty-asset');
    }
    return { id: check.id, state: 'healthy' };
  } catch (error) {
    const allowed = ['http-status', 'content-type', 'content-mismatch', 'invalid-json', 'index-shape', 'missing-entry', 'asset-type', 'body-read-failed', 'body-too-large', 'empty-asset'];
    return { id: check.id, state: 'failed', reason: allowed.includes(error.message) ? error.message : 'network-or-timeout' };
  }
}

/** Check all endpoints sequentially, retrying a failed probe once after two seconds. */
export async function run(fetcher = fetch, wait = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  const results = [];
  for (const check of checks) {
    let result = await probe(check, fetcher);
    if (result.state === 'failed') {
      await wait(2000);
      result = await probe(check, fetcher);
    }
    results.push(result);
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = await run();
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }));
  process.exitCode = results.some(result => result.state === 'failed') ? 1 : 0;
}
