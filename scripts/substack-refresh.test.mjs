import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseFeed } from '../src/lib/substack-feed.mjs';
import { checkRefresh, missingPosts } from './substack-refresh.mjs';

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

test('a linked same-slug mirror counts without canonical metadata, as getWriting does', () => {
  const local = { slug: posts[0].id, url: `https://jeffkazzee.dev/blog/${posts[0].id}/` };
  const html = anchor(`/blog/${posts[0].id}/`);
  assert.deepEqual(missingPosts([posts[0]], html, { posts: [local] }), []);
  assert.deepEqual(missingPosts([posts[0]], '', { posts: [local] }), [posts[0]], 'unlinked local content remains missing');
  assert.deepEqual(missingPosts([posts[0]], html, { posts: [] }), [posts[0]], 'a link alone does not establish a published mirror');
  assert.deepEqual(missingPosts([posts[0]], html, { posts: [{ ...local, canonicalUrl: 'https://example.com/other' }] }), [], 'slug matching agrees with the writing-page policy');
});

test('same-slug metadata cannot count an external or non-blog page as a local mirror', () => {
  for (const url of ['https://example.com/blog/other/', 'https://jeffkazzee.dev/projects/other/']) {
    assert.deepEqual(missingPosts([posts[0]], anchor(url), { posts: [{ slug: posts[0].id, url }] }), [posts[0]]);
  }
});
