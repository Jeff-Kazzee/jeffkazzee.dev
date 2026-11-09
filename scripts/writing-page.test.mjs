import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createWritingPage } from '../src/lib/writing-page.mjs';
import { mergeWriting, renderWritingCard } from '../src/lib/writing-list.mjs';

const template = '<head><link rel="canonical" href="https://jeffkazzee.dev/blog/"></head><main><template id="writing-start" data-astro-cid-example></template>BUILD FALLBACK<template id="writing-end" data-astro-cid-example></template></main>';
const localPosts = [{ slug: 'local', title: 'Local', description: 'Saved', pubDate: '2026-01-01', canonicalUrl: 'https://jeffkazzee.substack.com/p/original' }];
const feed = (slug, title = slug) => `<rss><channel><item><title>${title}</title><link>https://jeffkazzee.substack.com/p/${slug}</link><pubDate>Mon, 09 Nov 2026 12:00:00 GMT</pubDate><description>New post</description></item></channel></rss>`;

test('new posts appear in crawlable server HTML after expiry without a build or git push', async () => {
  let clock = 0, latest = 'first', calls = 0;
  const page = createWritingPage({ template, localPosts, now: () => clock, fetchImpl: async () => { calls++; return new Response(feed(latest)); } });
  const first = await page();
  assert.match(first.html, /href="https:\/\/jeffkazzee.substack.com\/p\/first"/);
  latest = 'second'; clock = 59999;
  assert.equal((await page()).html, first.html);
  clock = 60001;
  const next = await page();
  assert.match(next.html, /href="https:\/\/jeffkazzee.substack.com\/p\/second"/);
  assert.match(next.html, /href="\/blog\/local\/"/);
  assert.match(next.html, /rel="canonical" href="https:\/\/jeffkazzee.dev\/blog\/"/);
  assert.equal(calls, 2);
  assert.ok(next.html.indexOf('>second</a>') < next.html.indexOf('>Local</a>'));
});

test('outages and invalid feeds preserve cold fallback and warm last-good HTML', async () => {
  for (const response of [() => new Response('down', { status: 503 }), () => new Response('<html>error</html>'), () => new Response('<rss></rss>'), () => new Response(feed('bad').replace('</rss>', '')), () => { throw new Error('offline'); }]) {
    let clock = 0, fail = true;
    const page = createWritingPage({ template, localPosts, now: () => clock, fetchImpl: async () => fail ? response() : new Response(feed('good')) });
    assert.deepEqual(await page(), { html: template, fresh: false });
    clock = 30001; fail = false;
    const good = await page();
    assert.equal(good.fresh, true);
    clock += 60001; fail = true;
    assert.deepEqual(await page(), { html: good.html, fresh: false });
  }
});

test('concurrent cache misses share one bounded feed request', async () => {
  let calls = 0, release;
  const gate = new Promise(resolve => { release = resolve; });
  const page = createWritingPage({ template, localPosts, fetchImpl: async (_url, options) => { calls++; assert.ok(options.signal instanceof AbortSignal); await gate; return new Response(feed('shared')); } });
  const results = [page(), page(), page()]; release();
  const html = await Promise.all(results);
  assert.equal(calls, 1);
  assert.equal(html[0].html, html[2].html);
});

test('mirror precedence, remote deduplication and escaping match static and runtime cards', () => {
  const posts = mergeWriting(localPosts, [
    { id: 'other', url: 'https://www.jeffkazzee.substack.com/p/original/?source=test', pubDate: '2026-02-01' },
    { id: 'local', url: 'https://jeffkazzee.substack.com/p/local', pubDate: '2026-02-01' },
    ...Array(2).fill({ id: 'new', url: 'https://jeffkazzee.substack.com/p/new', pubDate: '2026-03-01', title: '<img onerror="bad">', description: 'A & B' }),
  ]);
  assert.equal(posts.length, 2);
  const html = posts.map(renderWritingCard).join('');
  assert.match(html, /&lt;img onerror=&quot;bad&quot;&gt;/);
  assert.match(html, /A &amp; B/);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /href="\/blog\/local\/"/);
});

test('the built fallback is packaged and the real function renders HTML with bounded caching', async () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
  assert.deepEqual(config.rewrites, [{ source: '/blog', destination: '/api/writing' }, { source: '/blog/', destination: '/api/writing' }]);
  assert.equal(config.functions['api/writing.js'].includeFiles, 'dist/{blog/index.html,api/content.json}');
  const built = readFileSync('dist/blog/index.html', 'utf8');
  assert.match(built, /<template id="writing-start"[^>]*><\/template>/);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(feed('published-after-build'));
  try {
    const { default: handler } = await import('../api/writing.js');
    const response = { headers: {}, statusCode: 0, setHeader(name, value) { this.headers[name] = value; }, end(body) { this.body = body; } };
    await handler({ method: 'GET' }, response);
    assert.equal(response.statusCode, 200);
    assert.match(response.body, /href="https:\/\/jeffkazzee.substack.com\/p\/published-after-build"/);
    assert.equal(response.headers['X-Writing-Source'], 'live-feed');
    assert.equal(response.headers['Vary'], 'Accept');
    assert.equal(response.headers['Content-Type'], 'text/html; charset=utf-8');
    assert.equal(response.headers['Vercel-CDN-Cache-Control'], 'public, s-maxage=300, stale-while-revalidate=60');
    await handler({ method: 'POST' }, response);
    assert.equal(response.statusCode, 405);
  } finally { globalThis.fetch = originalFetch; }
});


test('a stalled feed read is aborted and returns the fallback', async () => {
  const page = createWritingPage({ template, localPosts, fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }) });
  // Keep the event loop alive because AbortSignal.timeout uses an unref timer.
  const keepAlive = setTimeout(() => {}, 3000);
  try { assert.deepEqual(await page(), { html: template, fresh: false }); }
  finally { clearTimeout(keepAlive); }
});


test('Writing middleware overrides static HTML while preserving Markdown negotiation and other routes', async () => {
  const { transpileModule, ModuleKind } = await import('typescript');
  const source = readFileSync('middleware.ts', 'utf8').replace(/from '([^']+)'/g, (_, specifier) => {
    const resolved = specifier.startsWith('.') ? new URL('../' + specifier, import.meta.url).href : import.meta.resolve(specifier);
    return `from '${resolved}'`;
  });
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.ESNext } });
  const { default: middleware } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response('# Writing'); };
  try {
    for (const path of ['/blog', '/blog/']) {
      for (const method of ['GET', 'HEAD']) {
        const response = await middleware(new Request('https://example.com' + path + '?verify=route', { method, headers: { accept: 'text/html, text/markdown' } }));
        assert.equal(response.headers.get('x-middleware-rewrite'), 'https://example.com/api/writing?verify=route');
      }
      const markdown = await middleware(new Request('https://example.com' + path, { headers: { accept: 'text/markdown' } }));
      assert.equal(markdown.headers.get('content-type'), 'text/markdown; charset=utf-8');
      assert.equal(await markdown.text(), '# Writing');
      assert.equal(markdown.headers.get('x-middleware-rewrite'), null);
    }
    assert.equal(calls, 2);
    for (const path of ['/', '/blog/local/', '/api/writing']) {
      const response = await middleware(new Request('https://example.com' + path));
      assert.equal(response.headers.get('x-middleware-rewrite'), null);
      assert.equal(response.headers.get('x-middleware-next'), '1');
    }
    globalThis.fetch = async () => new Response('', { status: 404 });
    const missingTwin = await middleware(new Request('https://example.com/blog/', { headers: { accept: 'text/markdown' } }));
    assert.equal(missingTwin.headers.get('x-middleware-rewrite'), 'https://example.com/api/writing');
  } finally { globalThis.fetch = originalFetch; }
});

test('the real function marks cold feed failure and HEAD fallback without claiming live data', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('unavailable', { status: 503 });
  try {
    const { default: handler } = await import('../api/writing.js?cold-fallback');
    const response = { headers: {}, setHeader(name, value) { this.headers[name] = value; }, end(body) { this.body = body; } };
    await handler({ method: 'GET' }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body, readFileSync('dist/blog/index.html', 'utf8'));
    assert.equal(response.headers['X-Writing-Source'], 'fallback');
    assert.equal(response.headers['Vercel-CDN-Cache-Control'], 'public, s-maxage=30');
    await handler({ method: 'HEAD' }, response);
    assert.equal(response.headers['X-Writing-Source'], 'fallback');
    assert.equal(response.body, undefined);
  } finally { globalThis.fetch = originalFetch; }
});
