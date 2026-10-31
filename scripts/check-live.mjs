import { pathToFileURL } from 'node:url';

export const checks = [
  { id: 'portfolio-home', url: 'https://jeffkazzee.dev/', type: 'text/html', contains: 'Jeff Kazzee' },
  { id: 'portfolio-markdown', url: 'https://jeffkazzee.dev/for-agents/', accept: 'text/markdown', type: 'text/markdown', contains: 'Markdown' },
  { id: 'portfolio-index', url: 'https://jeffkazzee.dev/api/content.json', type: 'application/json', json: true },
  { id: 'arcade-home', url: 'https://www.llmarcade.fun/', type: 'text/html', contains: 'LLM Arcade', asset: true },
];

// Output only fixed identifiers and failure categories. Never log response bodies.
export async function probe(check, fetcher = fetch) {
  const request = async (url, headers = {}) => {
    const response = await fetcher(url, { headers, redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (response.status !== 200) throw new Error('http-status');
    return response;
  };
  try {
    const response = await request(check.url, { accept: check.accept ?? check.type });
    if (!response.headers.get('content-type')?.includes(check.type)) throw new Error('content-type');
    const body = await response.text();
    if (check.contains && !body.includes(check.contains)) throw new Error('content-mismatch');
    if (check.json) {
      let value;
      try { value = JSON.parse(body); } catch { throw new Error('invalid-json'); }
      if (value.site !== 'https://jeffkazzee.dev' || !Array.isArray(value.projects) || !value.projects.length) throw new Error('index-shape');
    }
    if (check.asset) {
      const path = body.match(/<script\b[^>]*\bsrc=["'](\/assets\/[^"']+\.js)["']/i)?.[1];
      if (!path) throw new Error('missing-entry');
      const asset = await request(new URL(path, check.url).href);
      if (!/javascript/.test(asset.headers.get('content-type') ?? '')) throw new Error('asset-type');
      await asset.body?.cancel();
    }
    return { id: check.id, state: 'healthy' };
  } catch (error) {
    const allowed = ['http-status', 'content-type', 'content-mismatch', 'invalid-json', 'index-shape', 'missing-entry', 'asset-type'];
    return { id: check.id, state: 'failed', reason: allowed.includes(error.message) ? error.message : 'network-or-timeout' };
  }
}

export async function run(fetcher = fetch) {
  const results = [];
  for (const check of checks) {
    let result = await probe(check, fetcher);
    if (result.state === 'failed') {
      await new Promise(resolve => setTimeout(resolve, 2000));
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
