// Usage: node checks.mjs <repo> <port> <evidence-dir>
// HTTP and static journeys A7 to A11 from acceptance.md. Prints one line per
// check and exits 1 when any check fails. Writes checks.json and live/ to evidence,
// plus built/ with the local copy of every page A11 reports as changed.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { answerKey, table } from './answer-key.mjs';

const [repo, port, evidence] = process.argv.slice(2);
const dist = join(repo, 'dist');
const local = `http://127.0.0.1:${port}`;
const LIVE = 'https://jeffkazzee.dev';
const UA = 'jeffkazzee-verify/1 (+https://jeffkazzee.dev/for-agents/)';
const results = [];
const report = (id, verdict, name, detail = '') => {
  results.push({ id, verdict, name, detail });
  console.log(`${verdict.padEnd(7)} ${id} ${name}${detail ? `\n        ${detail.replaceAll('\n', '\n        ')}` : ''}`);
};

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);
const files = walk(dist);
const pages = files.filter((f) => f.endsWith('.html'));
const urlPath = (file) => '/' + relative(dist, file).replaceAll('\\', '/').replace(/index\.html$/, '').replace(/\.html$/, '');

async function pool(items, size, fn) {
  const out = [];
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]); }
  }));
  return out;
}

// A7 and A8. Links on every built page.
const links = new Map();
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  for (const [, attr, value] of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
    if (/^(#|mailto:|tel:|data:|javascript:)/.test(value)) continue;
    const url = new URL(value.replaceAll('&amp;', '&'), LIVE + urlPath(page));
    if (!/^https?:$/.test(url.protocol)) continue;
    url.hash = '';
    const key = url.origin === LIVE ? url.pathname : url.href;
    if (!links.has(key)) links.set(key, new Set());
    links.get(key).add(urlPath(page));
  }
}
const internal = [...links.keys()].filter((k) => k.startsWith('/'));
const external = [...links.keys()].filter((k) => !k.startsWith('/'));
const where = (key) => [...links.get(key)].slice(0, 3).join(', ');

const key = answerKey(repo);
report('KEY', key.verdict, 'answer key is independent of the branch under test', key.note);
// With no key nothing is known, so every broken link fails.
const known = new Set(key.text ? table(key.text, 'Known defects').map(([path]) => path) : []);
const internalBad = (await pool(internal, 8, async (path) => {
  const res = await fetch(local + path, { redirect: 'follow' }).catch(() => null);
  if (res?.status === 200) return null;
  // Vercel middleware serves /api/*, so the static server cannot. Ask live instead.
  if (path.startsWith('/api/')) {
    const live = await fetch(LIVE + path, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(12000) }).catch(() => null);
    if (live && live.status !== 404 && live.status < 500) return null;
  }
  return `${res?.status ?? 'no response'} ${path} (linked from ${where(path)})`;
})).filter(Boolean);
// Every known defect is a 404, so a known path that answers anything else is new.
const isKnown = (line) => line.startsWith('404 ') && known.has(line.split(' ')[1]);
report('A7', internalBad.some((l) => !isKnown(l)) ? 'FAIL' : 'PASS', `${internal.length} internal links return 200`, internalBad.filter((l) => !isKnown(l)).join('\n'));
if (internalBad.some(isKnown)) report('A7', 'KNOWN', 'defects listed in acceptance.md', internalBad.filter(isKnown).join('\n'));

async function probe(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(12000) });
      res.body?.cancel();
      if (method === 'HEAD' && res.status >= 400) continue;
      return res.status;
    } catch (error) {
      if (method === 'GET') return `network ${error.cause?.code ?? error.name}`;
    }
  }
}
const externalStatus = await pool(external, 6, async (url) => [url, await probe(url)]);
const is5xx = (s) => typeof s === 'number' && s >= 500 && s < 600;
const server = externalStatus.filter(([, s]) => is5xx(s));
// LinkedIn answers bots with 999, so anything else outside 2xx and 3xx is a warning.
const soft = externalStatus.filter(([, s]) => !is5xx(s) && (typeof s !== 'number' || s >= 400));
report('A8', server.length ? 'FAIL' : 'PASS', `${external.length} external links return no 5xx`,
  server.map(([u, s]) => `${s} ${u} (linked from ${where(u)})`).join('\n'));
if (soft.length) report('A8', 'WARN', `${soft.length} external links failed without a 5xx`, soft.map(([u, s]) => `${s} ${u}`).join('\n'));

// A9. The repo's own budget, the answer key the build agent did not write.
try {
  const out = execFileSync('node', ['scripts/check-budget.mjs'], { cwd: repo, encoding: 'utf8' });
  report('A9', 'PASS', 'home page budget', out.trim().split('\n').filter((l) => l.includes('code')).join(''));
} catch (error) {
  report('A9', 'FAIL', 'home page budget', `${error.stdout ?? ''}${error.stderr ?? ''}`.trim());
}

// A10. Every origin client code sends data to is allowed by the CSP in vercel.json.
const vercel = JSON.parse(readFileSync(join(repo, 'vercel.json'), 'utf8'));
const csp = vercel.headers?.flatMap((h) => h.headers).find((h) => h.key.toLowerCase() === 'content-security-policy')?.value ?? '';
const directives = Object.fromEntries(csp.split(';').map((d) => d.trim().split(/\s+/)).filter((d) => d[0]).map(([k, ...v]) => [k, v]));
const connect = directives['connect-src'] ?? directives['default-src'];
const allowed = (origin) => !connect ? true : connect.some((src) =>
  (src === "'self'" && origin === LIVE) || src === origin || src === new URL(origin).host ||
  (src.includes('*.') && new URL(origin).host.endsWith(src.split('*')[1])));
const clientCode = [
  ...files.filter((f) => f.endsWith('.js') && f.includes('/_astro/')).map((f) => readFileSync(f, 'utf8')),
  ...pages.flatMap((p) => [...readFileSync(p, 'utf8').matchAll(/<script(?![^>]*type="(?:application\/ld\+json|speculationrules)")[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])),
].join('\n');
const targets = new Set();
for (const [, host] of clientCode.matchAll(/https:\/\/[0-9a-f]{16,}@([a-z0-9.-]+)\/\d+/g)) targets.add(`https://${host}`);
for (const [, url] of clientCode.matchAll(/(?:fetch|sendBeacon|EventSource|WebSocket)\(\s*["'`](https?:\/\/[^"'`/]+)/g)) targets.add(new URL(url).origin);
const blocked = [...targets].filter((o) => !allowed(o));
// The Sentry SDK keeps its state on __SENTRY__. Shipping it with no DSN origin
// found means this check cannot see where reports go, which is not a pass.
const reporterBlind = /__SENTRY__/.test(clientCode) && ![...targets].some((o) => /sentry\.io$/.test(new URL(o).host));
report('A10', blocked.length || reporterBlind ? 'FAIL' : 'PASS',
  `${targets.size} client data origins allowed by connect-src (${connect?.join(' ') ?? 'no policy'})`,
  blocked.length ? `blocked: ${blocked.join(', ')}` : reporterBlind ? 'the bundle contains the Sentry SDK but no ingest origin was found' : [...targets].join(', '));

// A11. Byte parity with live production. A difference is CHANGED, not FAIL.
mkdirSync(join(evidence, 'live'), { recursive: true });
const parity = await pool(pages.filter((p) => !p.endsWith('404.html')), 4, async (page) => {
  const path = urlPath(page);
  const res = await fetch(LIVE + path, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) }).catch(() => null);
  if (res?.status !== 200) return [path, `live returned ${res?.status ?? 'nothing'}`];
  const live = Buffer.from(await res.arrayBuffer());
  const out = join(evidence, 'live', (path.slice(1) || 'home').replaceAll('/', '_') + '.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, live);
  const built = readFileSync(page);
  if (live.equals(built)) return [path, 'identical'];
  // Keep the local copy so a reviewer can read the actual difference.
  const builtOut = join(evidence, 'built', (path.slice(1) || 'home').replaceAll('/', '_') + '.html');
  mkdirSync(dirname(builtOut), { recursive: true });
  writeFileSync(builtOut, built);
  return [path, 'changed'];
});
const changed = parity.filter(([, s]) => s !== 'identical');
report('A11', changed.length ? 'CHANGED' : 'PASS', `${parity.length - changed.length} of ${parity.length} pages byte-identical to live`,
  changed.map(([p, s]) => `${s} ${p}`).join('\n'));

const liveCsp = (await fetch(LIVE + '/', { method: 'HEAD', headers: { 'user-agent': UA } }).catch(() => null))?.headers.get('content-security-policy');
report('A11', liveCsp === csp ? 'PASS' : 'CHANGED', 'vercel.json CSP equals the live CSP header', liveCsp === csp ? '' : `live:  ${liveCsp}\nlocal: ${csp}`);

writeFileSync(join(evidence, 'checks.json'), JSON.stringify(results, null, 2));
const failed = results.filter((r) => r.verdict === 'FAIL').length;
console.log(`CHECKS_RESULT=${failed ? 'fail' : 'pass'} failed=${failed} changed=${results.filter((r) => r.verdict === 'CHANGED').length}`);
process.exit(failed ? 1 : 0);
