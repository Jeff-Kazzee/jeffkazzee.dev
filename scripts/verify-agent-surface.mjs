/**
 * Verifies the agent surface against a real build.
 *
 * Serves dist/ over HTTP, then drives the MCP and A2A handlers the way a client
 * would and checks every discovery document. Run it after `npm run build`:
 *
 *     npm run verify
 *
 * This exercises the handlers, not the deployed middleware. After a deploy,
 * check the live origin too, as the agent-ready-site skill describes.
 */
import { createServer } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = process.argv[2] ?? fileURLToPath(new URL('../dist', import.meta.url));
const PORT = 4399;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(req.url.split('?')[0]);
  let file = join(ROOT, path);

  try {
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
    else if (!extname(file)) {
      const asDir = join(ROOT, path, 'index.html');
      if (await stat(asDir).catch(() => null)) file = asDir;
    }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  }
});

await new Promise((resolve) => server.listen(PORT, resolve));
const origin = `http://127.0.0.1:${PORT}`;

const SRC = resolvePath(ROOT, '..', 'src', 'lib');
const { handleMcp } = await import(pathToFileURL(join(SRC, 'mcp-server.mjs')).href);
const { handleA2a } = await import(pathToFileURL(join(SRC, 'a2a-server.mjs')).href);

let failures = 0;
const check = (name, condition, detail = '') => {
  const ok = Boolean(condition);
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? `\n        ${detail}` : ''}`);
};

const post = (handler, body, headers = {}) =>
  handler(
    new Request(`${origin}/api/x`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
    origin,
  );

/* ---------- MCP ---------- */
console.log('\n== MCP ==');

let r = await post(handleMcp, { jsonrpc: '2.0', id: 1, method: 'tools/list' });
let j = await r.json();
check('tools/list returns tools', j.result?.tools?.length === 4, JSON.stringify(j).slice(0, 300));
check('tools carry inputSchema', j.result?.tools?.every((t) => t.inputSchema?.type === 'object'));
check('no guide-library tool remains', !j.result?.tools?.some((t) => t.name === 'list_guide_libraries'));

r = await post(handleMcp, {
  jsonrpc: '2.0',
  id: 4,
  method: 'tools/call',
  params: { name: 'list_projects', arguments: { tag: 'agents' } },
});
j = await r.json();
check('list_projects(tag=agents) returns Bellamente', j.result?.content?.[0]?.text?.includes('Bellamente'));
check('list_projects(tag=agents) returns PS5 Agent Remote', j.result?.content?.[0]?.text?.includes('PS5 Agent Remote'));

r = await post(handleMcp, {
  jsonrpc: '2.0',
  id: 5,
  method: 'tools/call',
  params: { name: 'read_page', arguments: { path: '/projects/llm-arcade/' } },
});
j = await r.json();
check('read_page(/projects/llm-arcade/) returns the twin', j.result?.content?.[0]?.text?.includes('LLM Arcade'));

r = await post(handleMcp, { jsonrpc: '2.0', id: 6, method: 'initialize', params: { protocolVersion: '2025-06-18' } });
j = await r.json();
check('legacy initialize negotiates', j.result?.protocolVersion === '2025-06-18', JSON.stringify(j));
check('initialize points at list_projects', j.result?.instructions?.includes('list_projects'));

r = await post(handleMcp, { jsonrpc: '2.0', id: 7, method: 'nope/nope' });
check('unknown method is 404', r.status === 404);
j = await r.json();
check('unknown method is -32601', j.error?.code === -32601);

r = await handleMcp(new Request(`${origin}/api/mcp`, { method: 'GET' }), origin);
check('GET is 405', r.status === 405);

r = await post(handleMcp, { jsonrpc: '2.0', method: 'notifications/initialized' });
check('notification is 202 with no body', r.status === 202);

r = await post(
  handleMcp,
  { jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name: 'list_writing' } },
  { 'mcp-name': 'something_else' },
);
j = await r.json();
check('header mismatch is rejected', j.error?.code === -32020, JSON.stringify(j));

r = await post(handleMcp, { jsonrpc: '2.0', id: 10, method: 'tools/list' }, { 'mcp-protocol-version': '1999-01-01' });
j = await r.json();
check('unsupported protocol version is rejected', j.error?.code === -32602 && r.status === 400);

/* ---------- A2A ---------- */
console.log('\n== A2A ==');

r = await post(handleA2a, {
  jsonrpc: '2.0',
  id: 1,
  method: 'SendMessage',
  params: { message: { role: 'ROLE_USER', parts: [{ text: 'Is there a guide for chasing invoices?' }], messageId: 'm1' } },
});
j = await r.json();
check('unrouted question falls back to projects', j.result?.message?.parts?.[0]?.text?.includes('LLM Arcade'), JSON.stringify(j).slice(0, 300));
check('no answer mentions Zo', !/\bZo\b/.test(j.result?.message?.parts?.[0]?.text ?? ''));
check('SendMessage role is ROLE_AGENT', j.result?.message?.role === 'ROLE_AGENT');

r = await post(handleA2a, {
  jsonrpc: '2.0',
  id: 2,
  method: 'SendMessage',
  params: { message: { role: 'ROLE_USER', parts: [{ text: 'How do I contact him about hiring?' }], messageId: 'm2' } },
});
j = await r.json();
check('availability question routes to contact', j.result?.message?.parts?.[0]?.text?.includes('jeffkazzee@gmail.com'));

r = await post(handleA2a, {
  jsonrpc: '2.0',
  id: 3,
  method: 'SendMessage',
  params: { message: { role: 'ROLE_USER', parts: [{ text: 'tell me about the arcade' }], messageId: 'm3' } },
});
j = await r.json();
check('arcade question routes to projects', j.result?.message?.parts?.[0]?.text?.includes('LLM Arcade'));

r = await post(handleA2a, { jsonrpc: '2.0', id: 4, method: 'Nope' });
check('A2A unknown method is 404', r.status === 404);

/* ---------- static surface ---------- */
console.log('\n== static ==');
for (const [path, needle] of [
  ['/robots.txt', 'Content-Signal: ai-train=yes'],
  ['/robots.txt', 'Agentmap:'],
  ['/llms.txt', 'Machine interfaces'],
  ['/llms-full.txt', 'LLM Arcade'],
  ['/.well-known/api-catalog', 'linkset'],
  ['/.well-known/agent-card.json', 'supportedInterfaces'],
  ['/.well-known/mcp/server-card.json', 'streamable-http'],
  ['/.well-known/agent-skills/index.json', 'sha256:'],
  ['/.well-known/ard.json', 'representativeQueries'],
  ['/index.md', 'Selected work'],
  ['/for-agents.md', 'Markdown'],
  ['/projects.md', 'LLM Arcade'],
  ['/blog.md', '2026'],
  ['/auth.md', 'requires no authentication'],
]) {
  const res = await fetch(origin + path);
  const text = res.ok ? await res.text() : '';
  check(`${path} contains ${JSON.stringify(needle)}`, res.ok && text.includes(needle), `status ${res.status}`);
}

// Zo hosting ended in October 2026. No document may send a reader there.
const ZO_HOST = /zo\.space|zo\.computer|zocomputer|zo-cookbook|cello\.so/i;
for (const path of ['/llms.txt', '/llms-full.txt', '/index.md', '/projects.md', '/blog.md', '/api/content.json', '/.well-known/ard.json']) {
  const res = await fetch(origin + path);
  const text = res.ok ? await res.text() : '';
  check(`${path} links to no Zo host`, res.ok && !ZO_HOST.test(text), text.match(ZO_HOST)?.[0]);
}

/* ---------- guides: independent build-output checks ---------- */
console.log('\n== guides ==');
const indexResponse = await fetch(origin + '/api/content.json');
const contentIndex = await indexResponse.json();
const publishedGuides = contentIndex.guides ?? [];
check('content API includes a guides array', Array.isArray(contentIndex.guides));
// Independent approved-publication fixture, not derived from the API under test.
const approvedGuideIds = ['advisor-models', 'browser-verification', 'team-worktree', 'plugin-lab'].map((slug) => 'deepseek-harness/' + slug);
check('exact approved guides published', publishedGuides.length === approvedGuideIds.length && approvedGuideIds.every((slug) => publishedGuides.some((guide) => guide.slug === slug)));

async function* walk(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) yield* walk(path);
    else if (item.isFile()) yield path;
  }
}
const sourceRoot = resolvePath(ROOT, '..', 'src', 'content', 'guides');
const drafts = [];
for await (const file of walk(sourceRoot)) {
  if (!file.endsWith('.md')) continue;
  const text = await readFile(file, 'utf8');
  const frontMatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
  if (/^draft:\s*false\s*$/m.test(frontMatter)) continue;
  drafts.push({ slug: relative(sourceRoot, file).replaceAll('\\', '/').replace(/\.md$/, ''), text, frontMatter });
}
check('sentinel is a real draft collection entry', drafts.some(({ slug, frontMatter }) => slug === 'deepseek-harness/draft-sentinel' && /^draft:\s*true\s*$/m.test(frontMatter)));
// Astro 7 builds use cacheDir (default node_modules/.astro), not the dev .astro directory.
const store = await readFile(resolvePath(ROOT, '..', 'node_modules', '.astro', 'data-store.json'), 'utf8').catch(() => '');
check('Astro loaded the sentinel before publication filtering', store.includes('deepseek-harness/draft-sentinel') && store.includes('GUIDE_DRAFT_SENTINEL_TITLE_7e31b8'));
const needles = drafts.flatMap(({ slug, text, frontMatter }) => [
  '/' + slug,
  ...[...frontMatter.matchAll(/^(?:title|description):\s*(.+)$/gm)].map((match) => match[1].trim().replace(/^['"]|['"]$/g, '')),
  ...(text.match(/GUIDE_DRAFT_SENTINEL_[A-Z_0-9a-z]+/g) ?? []),
]);
let scanned = 0;
for await (const file of walk(ROOT)) {
  scanned++;
  const body = await readFile(file);
  check('draft exclusion: ' + relative(ROOT, file), needles.every((needle) => !body.includes(Buffer.from(needle))) && !drafts.some(({ slug }) => relative(ROOT, file).replaceAll('\\', '/').includes(slug)), 'A draft marker leaked into generated output');
}
check('draft output scan covered generated files', scanned > 0);
for (const { slug } of drafts) {
  check('draft missing from content API: ' + slug, !publishedGuides.some((guide) => guide.slug === slug));
  for (const path of ['/' + slug + '/', '/' + slug, '/' + slug + '.md', '/' + slug + '/index.html']) {
    const response = await fetch(origin + path);
    check('draft URL is not generated: ' + path, response.status === 404);
  }
}
const writingResponse = await post(handleMcp, { jsonrpc: '2.0', id: 31, method: 'tools/call', params: { name: 'list_writing' } });
const writingResult = await writingResponse.json();
const writingText = writingResult.result?.content?.[0]?.text ?? '';
check('MCP writing excludes drafts', needles.every((needle) => !writingText.includes(needle)));
const guideAnswerResponse = await post(handleA2a, { jsonrpc: '2.0', id: 32, method: 'SendMessage', params: { message: { role: 'ROLE_USER', parts: [{ text: 'Where are the DeepSeek Harness guides?' }], messageId: 'guides' } } });
const guideAnswerResult = await guideAnswerResponse.json();
const guideAnswerText = guideAnswerResult.result?.message?.parts?.[0]?.text ?? '';
check('A2A Harness question points to guides', guideAnswerText.includes('https://jeffkazzee.dev/deepseek-harness/'));
check('A2A Harness answer excludes drafts', needles.every((needle) => !guideAnswerText.includes(needle)));
const { HARNESS_DESCRIPTION, HARNESS_INTRODUCTION, HARNESS_LIMITS, HARNESS_NOTES, HARNESS_FUTURE } = await import(pathToFileURL(join(SRC, 'guide-policy.mjs')).href);
const decode = (text) => text.replaceAll('&#39;', "'").replaceAll('&#x27;', "'").replaceAll('&amp;', '&').replaceAll('&quot;', '"');
for (const path of ['/deepseek-harness/']) {
  const html = await (await fetch(origin + path)).text();
  const twin = await (await fetch(origin + path.replace(/\/$/, '.md'))).text();
  check('guide landing canonical: ' + path, html.includes('rel="canonical" href="https://jeffkazzee.dev' + path + '"'));
  check('guide landing Markdown canonical: ' + path, twin.includes('url: https://jeffkazzee.dev' + path));
  if (path.includes('deepseek-harness')) {
    for (const paragraph of [HARNESS_DESCRIPTION, HARNESS_INTRODUCTION, HARNESS_LIMITS, HARNESS_NOTES, HARNESS_FUTURE]) {
      check('approved hub paragraph matches HTML and Markdown', decode(html).includes(paragraph) && twin.includes(paragraph));
    }
  }
}
const publicOutputs = {};
for (const path of ['/deepseek-harness/', '/rss.xml', '/llms.txt', '/llms-full.txt', '/deepseek-harness.md', '/sitemap-0.xml']) {
  const response = await fetch(origin + path);
  check('guide derived output exists: ' + path, response.ok);
  publicOutputs[path] = await response.text();
}
for (const guide of publishedGuides) {
  const canonical = 'https://jeffkazzee.dev/' + guide.slug + '/';
  const twin = canonical.slice(0, -1) + '.md';
  check('published guide canonical metadata: ' + guide.slug, guide.url === canonical && guide.canonicalUrl === canonical && guide.markdownUrl === twin);
  const htmlResponse = await fetch(origin + new URL(canonical).pathname);
  const html = await htmlResponse.text();
  const mdResponse = await fetch(origin + new URL(twin).pathname);
  const markdown = await mdResponse.text();
  check('published guide HTML canonical: ' + guide.slug, htmlResponse.ok && html.includes('rel="canonical" href="' + canonical + '"') && !html.includes('originally on'));
  check('published guide source-check label: ' + guide.slug, html.includes('Source checked') && html.includes('not runtime verification'));
  check('published guide Markdown twin: ' + guide.slug, mdResponse.ok && markdown.includes('url: ' + canonical) && markdown.includes('Source checked ' + guide.verifiedDate));
  for (const [path, body] of Object.entries(publicOutputs)) {
    const expected = path === '/rss.xml' || path.startsWith('/sitemap') ? canonical : '/' + guide.slug + '/';
    check('published guide appears in ' + path + ': ' + guide.slug, body.includes(expected));
  }
  check('published guide appears in MCP writing: ' + guide.slug, writingText.includes(canonical));
  check('published guide appears in A2A Harness answer: ' + guide.slug, guideAnswerText.includes(canonical));
}

console.log('\n' + (failures === 0 ? 'all checks passed' : failures + ' FAILURES'));
server.close();
process.exit(failures === 0 ? 0 : 1);
