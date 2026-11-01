// Usage: node browser.mjs <repo> <port> <chrome-port> <state-dir> <evidence-dir>
// Browser journeys A1 to A6 and A12 from acceptance.md, driven through headless
// Chrome over the DevTools protocol. Requests to Sentry ingest are intercepted,
// recorded and failed, so a run never reports to production. Chrome checks CSP
// before interception, so a CSP violation still shows (tested 2026-11-01).
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { answerKey, table as keyTable } from './answer-key.mjs';

const [repo, port, chromePort, state, evidence] = process.argv.slice(2);
const local = `http://127.0.0.1:${port}`;
const LIVE = 'https://jeffkazzee.dev';
const HALLOWEEN_CUTOFF_MS = Date.parse('2026-11-01T00:00:00-06:00');
const shots = join(evidence, 'screens');
mkdirSync(shots, { recursive: true });

const results = [];
const report = (id, verdict, name, detail = '') => {
  results.push({ id, verdict, name, detail });
  console.log(`${verdict.padEnd(7)} ${id} ${name}${detail ? `\n        ${detail.replaceAll('\n', '\n        ')}` : ''}`);
};

const key = answerKey(repo);
if (!key.text) {
  report('KEY', 'FAIL', 'browser journeys need the answer key', key.note);
  writeFileSync(join(evidence, 'browser.json'), JSON.stringify(results, null, 2));
  console.log('BROWSER_RESULT=fail failed=1 no answer key, no journey ran');
  process.exit(1);
}
const table = (heading) => keyTable(key.text, heading);
const nav = table('Main navigation').map(([label, path, heading]) => ({ label, path, heading }));
const home = Object.fromEntries(table('Home page'));
const reporting = Object.fromEntries(table('Error reporting'));

const chrome = spawn('google-chrome', [
  '--headless=new', `--remote-debugging-port=${chromePort}`, `--user-data-dir=${join(state, 'chrome-profile')}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1280,900',
  // Prerendered pages swap the DevTools target on click and drop this session.
  '--disable-features=Prerender2', 'about:blank',
], { detached: true, stdio: 'ignore' });
writeFileSync(join(state, 'chrome.pid'), String(chrome.pid));
const stopChrome = () => { try { process.kill(-chrome.pid, 'SIGTERM'); } catch {} };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50 && !targets; i++) {
  await sleep(200);
  targets = await fetch(`http://127.0.0.1:${chromePort}/json/list`).then((r) => r.json()).catch(() => null);
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const pending = new Map();
const listeners = [];
ws.addEventListener('message', ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.id) pending.get(msg.id)?.(msg);
  else listeners.forEach((fn) => fn(msg));
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, (msg) => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)));
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;

let page = { errors: [], requests: [], status: null };
const reports = [];
listeners.push(({ method, params }) => {
  if (method === 'Fetch.requestPaused') {
    const req = params.request;
    reports.push({ host: new URL(req.url).host, body: req.postData ?? (req.postDataEntries ?? []).map((e) => Buffer.from(e.bytes ?? '', 'base64').toString()).join('') });
    send('Fetch.failRequest', { requestId: params.requestId, errorReason: 'BlockedByClient' }).catch(() => {});
  }
  if (method === 'Runtime.exceptionThrown') page.errors.push(`exception: ${params.exceptionDetails.exception?.description ?? params.exceptionDetails.text}`);
  if (method === 'Runtime.consoleAPICalled' && params.type === 'error') page.errors.push(`console.error: ${params.args.map((a) => a.value ?? a.description).join(' ')}`);
  const ourBlock = /sentry\.io/.test(params?.entry?.url ?? '') && /ERR_BLOCKED_BY_CLIENT/.test(params.entry.text);
  if (method === 'Log.entryAdded' && params.entry.level === 'error' && !ourBlock) page.errors.push(`${params.entry.source}: ${params.entry.text}${params.entry.url ? ` (${params.entry.url})` : ''}`);
  if (method === 'Network.loadingFailed' && params.blockedReason === 'csp') page.errors.push(`csp blocked request ${params.requestId}`);
  if (method === 'Network.requestWillBeSent') page.requests.push(params.request.url);
  if (method === 'Network.responseReceived' && params.type === 'Document') page.status = params.response.status;
});
for (const domain of ['Page', 'Runtime', 'Log', 'Network']) await send(`${domain}.enable`);
await send('Fetch.enable', { patterns: [{ urlPattern: '*sentry.io*', requestStage: 'Request' }] });

async function settle(leaving) {
  for (let i = 0; i < 50; i++) {
    const s = await evaluate('[document.readyState, location.pathname]').catch(() => null);
    if (s?.[0] === 'complete' && (!leaving || s[1] !== leaving)) break;
    await sleep(100);
  }
  await sleep(400);
}
async function open(url, referrer) {
  page = { errors: [], requests: [], status: null };
  await send('Page.navigate', referrer ? { url, referrer } : { url });
  await settle();
}
async function click(selector, text) {
  const before = await evaluate('location.pathname');
  const box = await evaluate(`(() => {
    const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find((e) => e.textContent.trim() === ${JSON.stringify(text)});
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
  if (!box) return `no element ${selector} with text "${text}"`;
  page = { errors: [], requests: [], status: null };
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...box });
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, ...box, button: 'left', clickCount: 1 });
  await settle(before);
  return null;
}
const heading = () => evaluate("document.querySelector('h1')?.textContent.trim().replace(/\\s+/g, ' ') ?? ''");
const shot = async (name) => writeFileSync(join(shots, `${name}.png`), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
const errorsByPage = {};
const keepErrors = (path) => { if (page.errors.length) errorsByPage[path] = [...(errorsByPage[path] ?? []), ...page.errors]; };

try {
  // A1
  await open(`${local}/`);
  const h1 = await heading();
  await shot('home');
  report('A1', page.status === 200 && h1 === home.Heading ? 'PASS' : 'FAIL', 'home page loads with its heading', `status ${page.status}, heading "${h1}"`);
  keepErrors('/');

  // A2
  const navFails = [];
  for (const item of nav) {
    await open(`${local}/`);
    const missing = await click('nav[aria-label="Main"] a', item.label);
    const at = await evaluate('location.pathname');
    const h = await heading();
    await shot(`nav-${item.path.replaceAll('/', '') || 'home'}`);
    keepErrors(at);
    if (missing || at !== item.path || page.status !== 200 || !h.startsWith(item.heading)) {
      navFails.push(`${item.label}: ${missing ?? `landed on ${at} status ${page.status} heading "${h}", expected ${item.path} "${item.heading}"`}`);
    }
  }
  report('A2', navFails.length ? 'FAIL' : 'PASS', `${nav.length} main nav links reach their pages`, navFails.join('\n'));

  // A3
  await open(`${local}${home['Inner page for the mark check']}`);
  const markMissing = await click('header a.mark', 'Jeff Kazzee');
  const markAt = await evaluate('location.pathname');
  report('A3', !markMissing && markAt === '/' ? 'PASS' : 'FAIL', 'the name mark returns home', markMissing ?? `landed on ${markAt}`);

  // A4 and A6
  const sitemap = readFileSync(join(repo, 'dist/sitemap-0.xml'), 'utf8');
  const paths = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).concat(nav.map((n) => n.path)))];
  const seasonal = [];
  for (const path of paths) {
    await open(`${local}${path}`);
    keepErrors(path);
    const attr = await evaluate("document.documentElement.hasAttribute('data-halloween')");
    const halloweenRequests = page.requests.filter((u) => u.includes('/halloween/'));
    if (Date.now() >= HALLOWEEN_CUTOFF_MS && (attr || halloweenRequests.length)) seasonal.push(`${path}: ${attr ? 'data-halloween set ' : ''}${halloweenRequests.join(' ')}`);
  }
  const errorLines = Object.entries(errorsByPage).flatMap(([p, errs]) => errs.map((e) => `${p}: ${e}`));
  report('A4', errorLines.length ? 'FAIL' : 'PASS', `${paths.length} pages load with no console error, exception or CSP violation`, errorLines.slice(0, 20).join('\n'));
  report('A6', seasonal.length ? 'FAIL' : 'PASS', 'no Halloween requests or attribute after the cutoff', seasonal.join('\n'));

  // A5. Palette against live production, rendered in the same browser.
  const palette = `(() => { const b = getComputedStyle(document.body), r = getComputedStyle(document.documentElement);
    return { background: b.backgroundColor, color: b.color, bg: r.getPropertyValue('--bg').trim(), ink: r.getPropertyValue('--ink').trim() }; })()`;
  const paletteFails = [];
  for (const path of ['/', home['Inner page for the mark check']]) {
    await open(`${LIVE}${path}`);
    const expected = await evaluate(palette);
    await open(`${local}${path}`);
    const actual = await evaluate(palette);
    await shot(`palette-${path.replaceAll('/', '') || 'home'}`);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) paletteFails.push(`${path}: local ${JSON.stringify(actual)} live ${JSON.stringify(expected)}`);
  }
  report('A5', paletteFails.length ? 'FAIL' : 'PASS', 'rendered palette matches live production', paletteFails.join('\n'));

  // A12. The key says which reporter must ship. Clean page loads send nothing,
  // so only a thrown error proves the event reaches the ingest host past the
  // CSP without IP inference, query string or fragment. The pushState leaves a
  // navigation breadcrumb with both URLs, and a stackless throw makes the SDK
  // use the page URL as a frame filename, so markers can leak through either.
  // A relative fetch, a console line with the bare query and fragment, and a
  // message holding an upper-case URL, a fragment in ( ), a fragment with a
  // space in it and a bare query add the shapes reviews found or could have found.
  const THROWN = 'verify A12, thrown on purpose';
  const STACKLESS = 'verify A12, stackless';
  const URLS_IN_MESSAGE = 'HTTPS://EXAMPLE.TEST/P?verify=up-query-marker#up-fragment-marker https://a.test/p#(paren-fragment-marker@example.com) ?verify=bare-query-marker api/b.json#(spaced space-fragment-marker)';
  // Clear before navigating, so a report sent while the page loads is judged too.
  reports.length = 0;
  // A referrer with its own query, so a Referer header that survives is caught.
  await open(`${local}/?verify=query-marker#fragment-marker`, 'https://referrer.example/path?verify=ref-query-marker#ref-fragment-marker');
  const onPage = await evaluate("typeof globalThis.__SENTRY__ === 'object'");
  await evaluate("history.pushState(null, '', '/?verify=nav-query-marker#nav-fragment-marker'), true");
  // The fetch inputs from the Reviewer's probes: relative, bare-relative,
  // query-only, fragment-only, and a fragment holding a space.
  for (const input of [
    'api/verify-a12.json?verify=rel-query-marker#rel-fragment-marker',
    'search?verify=bare-query-marker#bare-fragment-marker',
    '?verify=only-query-marker#only-fragment-marker',
    '#lone-fragment-marker',
    'api/content.json#(Alice secret-fragment-marker@example.test)',
  ]) await evaluate(`fetch(${JSON.stringify(input)}).then(() => true, () => true)`);
  await evaluate('console.log(location.search, location.hash), true');
  await evaluate(`setTimeout(() => { throw new Error(${JSON.stringify(`${THROWN} ${URLS_IN_MESSAGE}`)}) }, 0), true`);
  // An inline handler's error names the page URL as its source.
  await evaluate(`document.body.insertAdjacentHTML('beforeend', '<img src="/verify-a12-missing.png" alt="" onerror="throw \\'${STACKLESS}\\'">'), true`);
  await sleep(3000);
  writeFileSync(join(evidence, 'reports.txt'), reports.map((r) => `${r.host}\n${r.body}`).join('\n----\n'));
  // An envelope is newline-separated JSON: a header, then item header and payload
  // pairs. Parsing it catches spacing and escapes that a string match would miss.
  const parsed = reports.map((r) => ({ ...r, lines: r.body.split('\n').map((l) => { try { return JSON.parse(l); } catch { return null; } }) }));
  const walk = (value, visit, key = '') => {
    visit(key, value);
    if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, visit, k);
  };
  const fails = [];
  if (reporting.Reporter === 'none') {
    if (onPage) fails.push('the key says no reporter, but the Sentry SDK is on the page');
    if (reports.length) fails.push(`${reports.length} report(s) left the page`);
  } else {
    const events = parsed.filter((r) => r.host === reporting['Ingest host'])
      .flatMap((r) => r.lines.flatMap((item, i) => (item?.type === 'event' ? [r.lines[i + 1]] : [])));
    const eventFor = (message) => events.some((e) => e?.exception?.values?.some((v) => v.value?.startsWith(message)));
    const csp = page.errors.filter((e) => /Content Security Policy|csp blocked/i.test(e));
    if (!onPage) fails.push(`the key requires ${reporting.Reporter}, but its SDK is not on the page`);
    fails.push(...csp.map((e) => `blocked by CSP: ${e}`));
    for (const message of [THROWN, STACKLESS]) {
      if (!eventFor(message)) fails.push(`no error event for "${message}" reached ${reporting['Ingest host']} (${reports.length} report(s) captured)`);
    }
    // Every report counts, events and sessions alike, from page load onward.
    for (const { body, lines } of parsed) {
      const found = new Set();
      // A line that is not JSON is checked as raw text instead.
      if (lines.includes(null)) {
        if (/"infer_ip"\s*:\s*"auto"|\{\{auto\}\}/.test(body)) found.add('a report asks Sentry to infer the IP');
        for (const marker of ['query-marker', 'fragment-marker']) if (body.includes(marker)) found.add(`a report contains the page URL's ${marker}`);
      }
      for (const line of lines) walk(line, (key, value) => {
        if (key === 'infer_ip' && value === 'auto') found.add('a report asks Sentry to infer the IP');
        if (key === 'ip_address' && value === '{{auto}}') found.add('a report asks Sentry to infer the IP');
        for (const marker of ['query-marker', 'fragment-marker']) {
          if ((typeof value === 'string' && value.includes(marker)) || key.includes(marker)) found.add(`a report contains the page URL's ${marker}`);
        }
        // sentry.ts cuts every token at its first ? or #, so any token still
        // holding one is a query or fragment that got through, marker or not.
        if (typeof value === 'string') {
          for (const token of value.split(/\s+/)) {
            if (token.length > 1 && /[?#]/.test(token)) found.add(`a report holds a query or fragment: ${token.slice(0, 80)}`);
          }
        }
      });
      fails.push(...found);
    }
  }
  report('A12', fails.length ? 'FAIL' : 'PASS', `the reporter the key names (${reporting.Reporter}) handles a thrown error correctly`,
    fails.join('\n') || `${reports.length} report(s) in reports.txt`);
} catch (error) {
  report('BROWSER', 'FAIL', 'browser journey crashed', error.stack);
} finally {
  ws.close();
  stopChrome();
}

writeFileSync(join(evidence, 'browser.json'), JSON.stringify(results, null, 2));
const failed = results.filter((r) => r.verdict === 'FAIL').length;
console.log(`BROWSER_RESULT=${failed ? 'fail' : 'pass'} failed=${failed} screenshots ${shots}`);
process.exit(failed ? 1 : 0);
