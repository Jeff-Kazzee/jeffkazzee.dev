import test from 'node:test';
import assert from 'node:assert/strict';
import { probe, checks } from './check-live.mjs';

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
