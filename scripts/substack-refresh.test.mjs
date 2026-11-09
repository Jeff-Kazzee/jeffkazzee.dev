import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseFeed } from '../src/lib/substack-feed.mjs';
import { checkRefresh, missingPosts, requestBuild } from './substack-refresh.mjs';

const xml = readFileSync(new URL('./fixtures/substack-feed.xml', import.meta.url), 'utf8');
const posts = parseFeed(xml);
const anchor = url => `<a href="${url}">Article</a>`;
const index = { posts: [] };

test('checks older missing posts even when the newest is already listed', () => {
  assert.deepEqual(missingPosts(posts, anchor(posts[0].url), index), posts.slice(1));
});

test('repeat checks are idempotent after all feed links appear', () => {
  const html = posts.map(post => anchor(post.url)).join('');
  assert.deepEqual(missingPosts(posts, html, index), []);
  assert.deepEqual(missingPosts(posts, html, index), []);
});

test('a linked mirror with a different slug counts by original canonical', () => {
  const local = { url: 'https://jeffkazzee.dev/blog/different-slug/', canonicalUrl: posts[0].url };
  assert.deepEqual(missingPosts([posts[0]], anchor('/blog/different-slug/'), { posts: [local] }), []);
  assert.deepEqual(missingPosts([posts[0]], '', { posts: [local] }), [posts[0]], 'index alone does not prove display');
});

test('a longer slug, unrelated page or text mention is not a displayed article', () => {
  const html = `${posts[0].url} ${anchor(`${posts[0].url}-longer`)} ${anchor('/deepseek-harness/')}`;
  assert.deepEqual(missingPosts([posts[0]], html, index), [posts[0]]);
});

test('checks real-shaped feed and deployed page inputs without making a build request', async () => {
  const seen = [];
  const fetchImpl = async url => {
    seen.push(url);
    if (url.endsWith('/feed')) return new Response(xml);
    if (url.endsWith('/blog/')) return new Response(anchor(posts[0].url));
    return Response.json(index);
  };
  assert.deepEqual(await checkRefresh({ fetchImpl }), { checked: posts.length, missing: posts.slice(1) });
  assert.equal(seen.length, 3);
});

test('feed outage and malformed success responses fail visibly', async () => {
  await assert.rejects(checkRefresh({ fetchImpl: async () => new Response('down', { status: 503 }) }), /HTTP 503/);
  await assert.rejects(checkRefresh({ fetchImpl: async () => new Response('<html>Site Unavailable</html>') }), /incomplete/);
});

test('a site read failure cannot be mistaken for a missing article', async () => {
  await assert.rejects(checkRefresh({ fetchImpl: async url => url.endsWith('/feed') ? new Response(xml) : new Response('down', { status: 503 }) }), /HTTP 503 reading/);
});

test('missing hook fails and build errors never disclose the hook', async () => {
  await assert.rejects(requestBuild(''), /Missing VERCEL_DEPLOY_HOOK_URL/);
  const hook = 'https://api.vercel.com/v1/integrations/deploy/test-private-hook';
  await assert.rejects(requestBuild(hook, { fetchImpl: async () => { throw new Error(hook); } }), error => !error.message.includes(hook) && /request failed/.test(error.message));
});

test('build request uses POST once and rejects unsuccessful responses', async () => {
  const hook = 'https://api.vercel.com/v1/integrations/deploy/test-private-hook';
  let calls = 0;
  await requestBuild(hook, { fetchImpl: async (url, init) => {
    calls++;
    assert.equal(url, hook);
    assert.equal(init.method, 'POST');
    assert.equal(init.redirect, 'error');
    return new Response('{}');
  } });
  assert.equal(calls, 1);
  await assert.rejects(requestBuild(hook, { fetchImpl: async () => new Response('no', { status: 403 }) }), /HTTP 403/);
});
