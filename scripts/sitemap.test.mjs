import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Run after the build: check delivered URLs, not the filter's implementation.
const origin = 'https://jeffkazzee.dev';
const sitemap = readdirSync('dist')
  .filter((file) => /^sitemap-\d+\.xml$/.test(file))
  .map((file) => readFileSync(join('dist', file), 'utf8')).join('');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

test('the sitemap lists only self-canonical HTML pages', () => {
  assert.ok(urls.length > 0, 'build a nonempty sitemap first');
  for (const url of urls) {
    const path = new URL(url).pathname;
    const html = readFileSync(join('dist', path, 'index.html'), 'utf8');
    const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/);
    assert.equal(canonical?.[1], url, `sitemap canonical mismatch: ${url}`);
  }
});

test('published external-canonical blog mirrors remain available but leave the sitemap', () => {
  let mirrors = 0;
  for (const entry of readdirSync('dist/blog', { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const html = readFileSync(join('dist/blog', entry.name, 'index.html'), 'utf8');
    const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
    if (!canonical || new URL(canonical).origin === origin) continue;
    mirrors++;
    assert.ok(!urls.includes(`${origin}/blog/${entry.name}/`), entry.name);
  }
  assert.ok(mirrors > 0, 'expected published external-canonical mirrors');
});

test('utility pages stay excluded and primary pages stay discoverable', () => {
  for (const path of ['/contact-thanks/', '/offline/']) assert.ok(!urls.includes(origin + path));
  for (const path of ['/', '/blog/', '/projects/', '/projects/ps5-agent-remote/']) {
    assert.ok(urls.includes(origin + path), path);
  }
});
