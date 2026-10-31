import test from 'node:test';
import assert from 'node:assert/strict';
import { probe, checks, run } from './check-live.mjs';

test('accepts HTML and sends a bounded nonredirecting request', async () => {
  const result = await probe(checks[0], async (url, options) => {
    assert.equal(url, checks[0].url);
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal);
    return new Response('Jeff Kazzee', { headers: { 'content-type': 'text/html' } });
  });
  assert.equal(result.state, 'healthy');
});
test('rejects a 200 error page', async () => {
  assert.equal((await probe(checks[0], async () => new Response('Sign in', { headers: { 'content-type': 'text/html' } }))).reason, 'content-mismatch');
});
test('rejects HTML in place of Markdown', async () => {
  assert.equal((await probe(checks[1], async () => new Response('Markdown', { headers: { 'content-type': 'text/html' } }))).reason, 'content-type');
});
test('checks the content index structure', async () => {
  const fetcher = async () => Response.json({ site: 'https://jeffkazzee.dev', projects: [] });
  assert.equal((await probe(checks[2], fetcher)).reason, 'index-shape');
});
test('checks Arcade entry asset rather than accepting an empty shell', async () => {
  const urls = [];
  const result = await probe(checks[3], async url => {
    urls.push(url);
    return urls.length === 1
      ? new Response('LLM Arcade<script type="module" src="/assets/index-123.js"></script>', { headers: { 'content-type': 'text/html' } })
      : new Response('missing', { status: 404 });
  });
  assert.equal(result.reason, 'http-status');
  assert.equal(urls.length, 2);
});
test('does not expose network errors or secrets in output', async () => {
  const result = await probe(checks[0], async () => { throw new Error('private-token-and-response'); });
  assert.equal(result.reason, 'network-or-timeout');
  assert.ok(!JSON.stringify(result).includes('private-token'));
});

test('classifies valid JSON null and primitive values as invalid index shapes', async () => {
  for (const value of [null, 42, 'index', false]) {
    assert.equal((await probe(checks[2], async () => Response.json(value))).reason, 'index-shape');
  }
});

const arcadePage = () => new Response('LLM Arcade<script src="/assets/index-123.js"></script>', {
  headers: { 'content-type': 'text/html' },
});
const arcadeAsset = body => new Response(body, { headers: { 'content-type': 'text/javascript' } });
const arcadeFetcher = asset => async url => url.endsWith('.js') ? asset() : arcadePage();

test('requires a complete non-empty Arcade entry asset', async () => {
  assert.equal((await probe(checks[3], arcadeFetcher(() => arcadeAsset('export {};')))).state, 'healthy');
  assert.equal((await probe(checks[3], arcadeFetcher(() => arcadeAsset('  ')))).reason, 'empty-asset');
});

test('rejects an Arcade entry asset whose body fails during transfer', async () => {
  const asset = () => arcadeAsset(new ReadableStream({
    start(controller) { controller.error(new Error('private upstream detail')); },
  }));
  assert.equal((await probe(checks[3], arcadeFetcher(asset))).reason, 'body-read-failed');
});

test('enforces the Arcade asset byte limit', async () => {
  const asset = () => arcadeAsset(new Uint8Array(8 * 1024 * 1024 + 1));
  assert.equal((await probe(checks[3], arcadeFetcher(asset))).reason, 'body-too-large');
});

test('retries transient failures once without calling an agent', async () => {
  let homeAttempts = 0;
  let waits = 0;
  const results = await run(async url => {
    if (url === checks[0].url) {
      homeAttempts++;
      if (homeAttempts === 1) return new Response('unavailable', { status: 503 });
      return new Response('Jeff Kazzee', { headers: { 'content-type': 'text/html' } });
    }
    if (url === checks[1].url) return new Response('Markdown', { headers: { 'content-type': 'text/markdown' } });
    if (url === checks[2].url) return Response.json({ site: 'https://jeffkazzee.dev', projects: [{}] });
    return url.endsWith('.js') ? arcadeAsset('export {};') : arcadePage();
  }, async ms => { assert.equal(ms, 2000); waits++; });
  assert.equal(homeAttempts, 2);
  assert.equal(waits, 1);
  assert.ok(results.every(result => result.state === 'healthy'));
});
