import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { canonicalSitemapFilter } from '../src/lib/sitemap-policy.mjs';
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

test('every published source article keeps its HTML and declared canonical', () => {
  const sources = readdirSync('src/content/blog').filter((file) => file.endsWith('.md') && !file.startsWith('_'));
  assert.ok(sources.length > 0);
  for (const file of sources) {
    const source = readFileSync(join('src/content/blog', file), 'utf8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
    assert.ok(frontmatter, file);
    if (/^draft:\s*true\s*$/m.test(frontmatter)) continue;
    const slug = file.slice(0, -3);
    const local = `${origin}/blog/${slug}/`;
    const declared = frontmatter.match(/^canonicalUrl:\s*(.+)$/m)?.[1].trim().replace(/^['"]|['"]$/g, '') ?? local;
    const html = readFileSync(join('dist/blog', slug, 'index.html'), 'utf8');
    const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
    assert.equal(canonical, declared, `canonical changed or missing: ${file}`);
    assert.equal(urls.includes(local), declared === local, `wrong sitemap membership: ${file}`);
  }
});

test('utility pages stay excluded and primary pages stay discoverable', () => {
  for (const path of ['/contact-thanks/', '/offline/']) assert.ok(!urls.includes(origin + path));
  for (const path of ['/', '/blog/', '/projects/', '/projects/ps5-agent-remote/']) {
    assert.ok(urls.includes(origin + path), path);
  }
});

test('future mirrors follow rendered canonicals without a pathname list', () => {
  const directory = mkdtempSync(join(tmpdir(), 'sitemap-policy-'));
  try {
    const pageDir = join(directory, 'blog', 'a-future-article');
    mkdirSync(pageDir, { recursive: true });
    const htmlPath = join(pageDir, 'index.html');
    const page = `${origin}/blog/a-future-article/`;
    const include = canonicalSitemapFilter(pathToFileURL(directory + '/'));
    writeFileSync(htmlPath, '<link href="https://jeffkazzee.substack.com/p/a-future-article" rel="canonical">');
    assert.equal(include(page), false);
    writeFileSync(htmlPath, `<link rel="canonical" href="${page}">`);
    assert.equal(include(page), true);
    writeFileSync(htmlPath, `<link rel="canonical" href="${page}"><meta content="noindex, follow" name="robots">`);
    assert.equal(include(page), false);
    writeFileSync(htmlPath, '<title>Missing canonical</title>');
    assert.throws(() => include(page), /Missing canonical/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
