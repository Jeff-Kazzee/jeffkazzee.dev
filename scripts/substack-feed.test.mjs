import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { fetchFeed, parseFeed, postKey, slugFromUrl } from '../src/lib/substack-feed.mjs';

const xml = readFileSync(new URL('./fixtures/substack-feed.xml', import.meta.url), 'utf8');

test('parses posts newest first and drops items it cannot link', () => {
  const posts = parseFeed(xml);
  assert.deepEqual(
    posts.map((p) => p.id),
    ['weapons-of-mass-disruption', 'logingov-is-lying-to-you-about-your', 'plain-title'],
  );
});

test('keeps the fields the writing pages show', () => {
  const [newest, older] = parseFeed(xml);
  assert.deepEqual(older, {
    id: 'logingov-is-lying-to-you-about-your',
    title: 'Login.gov is Lying About Your Data',
    url: 'https://jeffkazzee.substack.com/p/logingov-is-lying-to-you-about-your',
    pubDate: '2026-09-15T16:52:36.000Z',
    description: 'Here are the receipts',
  });
  assert.equal(newest.url, 'https://jeffkazzee.substack.com/p/weapons-of-mass-disruption', 'query string dropped');
  assert.equal(newest.description, 'AI gets frighteningly fast at work a machine can check automatically & that matters.');
});

test('decodes plain XML text once and strips tags', () => {
  const plain = parseFeed(xml).find((p) => p.id === 'plain-title');
  assert.equal(plain.title, 'Plain &amp; escaped title');
});

test('clips a long description at a word', () => {
  const long = 'word '.repeat(100);
  const [post] = parseFeed(
    `<item><title>T</title><link>https://x.substack.com/p/t</link><pubDate>Mon, 01 Jun 2026 12:00:00 GMT</pubDate><description>${long}</description></item>`,
  );
  assert.ok(post.description.length <= 281);
  assert.ok(post.description.endsWith('word…'));
});

test('matches a feed link to a mirrored canonicalUrl', () => {
  assert.equal(
    postKey('https://jeffkazzee.substack.com/p/whose-computer-are-you-building-on'),
    postKey('https://www.jeffkazzee.substack.com/p/whose-computer-are-you-building-on/?utm_source=rss'),
  );
  assert.equal(slugFromUrl('https://jeffkazzee.substack.com/p/plain-title/'), 'plain-title');
});

test('fetchFeed throws on a non-2xx answer', async () => {
  const fetchImpl = async () => new Response('down', { status: 503 });
  await assert.rejects(fetchFeed('https://example.com/feed', { fetchImpl }), /HTTP 503/);
});

test('returns nothing for an empty or broken feed', () => {
  assert.deepEqual(parseFeed(''), []);
  assert.deepEqual(parseFeed('<html>not a feed</html>'), []);
});
