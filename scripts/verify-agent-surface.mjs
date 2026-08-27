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
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve as resolvePath } from 'node:path';
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
check('tools/list returns tools', j.result?.tools?.length === 5, JSON.stringify(j).slice(0, 300));
check('tools carry inputSchema', j.result?.tools?.every((t) => t.inputSchema?.type === 'object'));

r = await post(handleMcp, {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: { name: 'list_guide_libraries' },
});
j = await r.json();
check(
  'list_guide_libraries names all three libraries',
  ['Zo Deep Dives', 'Zo Computer 101', 'Zo Cookbook'].every((n) =>
    j.result?.content?.[0]?.text?.includes(n),
  ),
  JSON.stringify(j).slice(0, 400),
);
check('list_guide_libraries states the total', j.result?.content?.[0]?.text?.includes('1,450'));

r = await post(handleMcp, {
  jsonrpc: '2.0',
  id: 4,
  method: 'tools/call',
  params: { name: 'list_projects', arguments: { tag: 'agents' } },
});
j = await r.json();
check('list_projects(tag=agents) returns Bellamente', j.result?.content?.[0]?.text?.includes('Bellamente'));
check('list_projects excludes archived Obscura', !j.result?.content?.[0]?.text?.includes('Obscura'));

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
check('SendMessage finds the guides', j.result?.message?.parts?.[0]?.text?.includes('Zo Deep Dives'), JSON.stringify(j).slice(0, 300));
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
  ['/llms-full.txt', 'Zo Deep Dives'],
  ['/.well-known/api-catalog', 'linkset'],
  ['/.well-known/agent-card.json', 'supportedInterfaces'],
  ['/.well-known/mcp/server-card.json', 'streamable-http'],
  ['/.well-known/agent-skills/index.json', 'sha256:'],
  ['/.well-known/ard.json', 'representativeQueries'],
  ['/index.md', 'Free guides'],
  ['/for-agents.md', 'Markdown'],
  ['/projects.md', 'LLM Arcade'],
  ['/blog.md', '2026'],
  ['/auth.md', 'requires no authentication'],
]) {
  const res = await fetch(origin + path);
  const text = res.ok ? await res.text() : '';
  check(`${path} contains ${JSON.stringify(needle)}`, res.ok && text.includes(needle), `status ${res.status}`);
}

console.log(`\n${failures === 0 ? 'all checks passed' : `${failures} FAILURES`}`);
server.close();
process.exit(failures === 0 ? 0 : 1);
