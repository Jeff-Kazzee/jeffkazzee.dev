import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';

import { parseFeed } from '../src/lib/substack-feed.mjs';
import { draftPosts } from './draft-substack.mjs';
import { parse } from './lib/frontmatter.mjs';
import { htmlToMarkdown } from './lib/substack-markdown.mjs';

const CDN = 'https://substackcdn.com/image/fetch/$s_!FTP8!,w_1456/https%3A%2F%2Fexample.com%2Fa.png';
const md = (html) => htmlToMarkdown(html).markdown.trimEnd();

const dirs = [];
function blogDir(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'substack-draft-'));
  dirs.push(dir);
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
}
after(() => dirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const item = (slug, { title = `Title of ${slug}`, description = 'A subtitle', body = '<p>Body</p>' } = {}) => `<item>
  <title><![CDATA[${title}]]></title>
  <description><![CDATA[${description}]]></description>
  <link>https://jeffkazzee.substack.com/p/${slug}</link>
  <guid isPermaLink="false">https://jeffkazzee.substack.com/p/${slug}</guid>
  <pubDate>Fri, 09 Oct 2026 17:14:24 GMT</pubDate>
  ${body === null ? '' : `<content:encoded><![CDATA[${body}]]></content:encoded>`}
</item>`;
const feed = (...items) => `<?xml version="1.0"?><rss><channel>${items.join('')}</channel></rss>`;

test('paragraphs, emphasis, links and inline code', () => {
  assert.equal(
    md('<p>One <strong>bold</strong> and <em>soft</em> with <a href="https://a.test/x_(y)">a link</a> and <code>a_b</code>.</p><p>Two</p>'),
    'One **bold** and *soft* with [a link](https://a.test/x_%28y%29) and `a_b`.\n\nTwo',
  );
});

test('text that would be Markdown or HTML stays text', () => {
  assert.equal(md('<p>a *b* _c_ [d] &lt;script&gt; &amp;amp; \\</p>'), 'a \\*b\\* \\_c\\_ \\[d\\] \\<script> \\&amp; \\\\');
  assert.equal(md('<p># not a heading</p><p>- not a list</p><p>1. not a list</p><p>&gt; not a quote</p>'), '\\# not a heading\n\n\\- not a list\n\n1\\. not a list\n\n\\> not a quote');
});

test('headings start at h2 because the page title is the h1', () => {
  assert.equal(md('<h1>A</h1><h2><br>B</h2><h3>C</h3>'), '## A\n\n## B\n\n### C');
});

test('line breaks: one is a hard break, a run is a new paragraph, edge ones go', () => {
  assert.equal(md('<p><br>One<br>Two<br><br><br>Three<br></p>'), 'One  \nTwo\n\nThree');
});

test('lists, including paragraphs inside items and nesting', () => {
  assert.equal(md('<ul><li><p>One</p></li><li><p>Two</p><ul><li><p>Inner</p></li></ul></li></ul>'), '- One\n- Two\n\n  - Inner');
  assert.equal(md('<ol><li><p>A</p></li><li><p>B</p></li></ol>'), '1. A\n2. B');
});

test('quotes and code blocks', () => {
  assert.equal(md('<blockquote><p>One</p><p>Two</p></blockquote>'), '> One\n>\n> Two');
  assert.equal(md('<pre><code><code>a *b* &lt;c&gt;\n</code></code></pre>'), '```\na *b* <c>\n```');
  assert.equal(md('<pre><code>```</code></pre>'), '````\n```\n````');
});

test('a Substack figure becomes an image and a caption, with its buttons and sources gone', () => {
  const html = `<div class="captioned-image-container"><figure><a class="image-link image2" href="${CDN}"><div class="image2-inset"><picture><source srcset="x"><img src="${CDN}" alt="A [lone] person" width="1"></picture></div><div class="image-link-expand"><button><svg><polyline points="1"></polyline></svg></button></div></a><figcaption class="image-caption">Table 2 of GSA&#8217;s report</figcaption></figure></div>`;
  assert.equal(md(html), `![A lone person](${CDN})\n\n*Table 2 of GSA’s report*`);
});

test('the subscribe button is dropped', () => {
  assert.equal(md('<p>Keep</p><p class="button-wrapper"><a href="https://x.test/subscribe"><span>Subscribe</span></a></p>'), 'Keep');
});

test('anything it cannot carry is a visible note, never a silent loss', () => {
  for (const [html, note] of [
    ['<div class="twitter-embed" data-attrs="{}"></div>', 'an embedded X post'],
    ['<iframe src="https://x.test"></iframe>', 'a <iframe> element'],
    ['<table><tr><td>Cell</td></tr></table>', 'a <table> element'],
    ['<p><img src="https://evil.test/a.png" alt=""></p>', 'an image from https://evil.test/a.png'],
  ]) {
    const { markdown, notes } = htmlToMarkdown(html);
    assert.deepEqual(notes, [note]);
    assert.ok(markdown.includes(`**Not mirrored:** ${note}`), markdown);
  }
});

test('a link with an unsafe scheme keeps its text and loses the link', () => {
  assert.equal(md('<p><a href="javascript:alert(1)">click</a></p>'), 'click');
});

test('writes a draft with the fields the blog collection needs, and draft: true', () => {
  const dir = blogDir();
  const body = `<p>Hello</p><div class="captioned-image-container"><figure><img src="${CDN}" alt=""></figure></div>`;
  const { written } = draftPosts(feed(item('new-post', { title: 'Why: a "title"', description: 'Sub: title', body })), { blogDir: dir });
  assert.deepEqual(written, [{ id: 'new-post', notes: [] }]);

  const text = readFileSync(join(dir, 'new-post.md'), 'utf8');
  assert.equal(text.split('\n').find((line) => line.startsWith('title:')), 'title: "Why: a \\"title\\""');
  assert.ok(text.includes('\npubDate: 2026-10-09\n'));
  assert.ok(text.includes('\ncanonicalUrl: https://jeffkazzee.substack.com/p/new-post\n'));
  assert.ok(text.includes('\ntags: []\ndraft: true\n---\n'));
  assert.ok(text.endsWith(`Hello\n\n![](${CDN})\n`));
});

test('the draft line is always true: nothing the feed says can publish a post', () => {
  const dir = blogDir();
  draftPosts(feed(item('sneaky', { title: 'x\ndraft: false', description: 'draft: false', body: '<p>draft: false</p>' })), { blogDir: dir });
  const front = parse(readFileSync(join(dir, 'sneaky.md'), 'utf8'));
  assert.deepEqual(front.blocks.get('draft'), ['draft: true']);
});

test('skips a post already mirrored by slug, by canonicalUrl, or as a draft', () => {
  const dir = blogDir({
    'same-slug.md': '---\ntitle: x\n---\n',
    'other-name.md': '---\ntitle: x\ncanonicalUrl: "https://jeffkazzee.substack.com/p/moved/"\n---\n',
    'in-review.md': '---\ntitle: x\ndraft: true\ncanonicalUrl: https://jeffkazzee.substack.com/p/in-review\n---\nJeff is editing this.\n',
    '_note.txt': 'ignored',
  });
  const { written } = draftPosts(feed(item('same-slug'), item('moved'), item('in-review'), item('fresh')), { blogDir: dir });
  assert.deepEqual(written.map(({ id }) => id), ['fresh']);
  assert.equal(readFileSync(join(dir, 'in-review.md'), 'utf8').includes('Jeff is editing this.'), true);
});

test('a second run writes nothing', () => {
  const dir = blogDir();
  const xml = feed(item('once'));
  assert.equal(draftPosts(xml, { blogDir: dir }).written.length, 1);
  const first = readFileSync(join(dir, 'once.md'), 'utf8');
  assert.equal(draftPosts(xml, { blogDir: dir }).written.length, 0);
  assert.equal(readFileSync(join(dir, 'once.md'), 'utf8'), first);
});

test('named slugs limit the run and an unknown one is reported', () => {
  const dir = blogDir();
  const { written, notInFeed } = draftPosts(feed(item('one'), item('two')), { blogDir: dir, only: ['two', 'gone'] });
  assert.deepEqual(written.map(({ id }) => id), ['two']);
  assert.deepEqual(notInFeed, ['gone']);
  assert.deepEqual(readdirSync(dir), ['two.md']);
});

test('a post with no body in the feed is skipped, never written as a stub', () => {
  const dir = blogDir();
  assert.deepEqual(draftPosts(feed(item('empty', { body: null })), { blogDir: dir }).noBody, ['empty']);
  assert.deepEqual(readdirSync(dir), []);
});

test('a cut-off or empty feed throws and writes nothing', () => {
  const dir = blogDir();
  assert.throws(() => draftPosts(`<rss><channel>${item('cut')}`, { blogDir: dir }), /incomplete/);
  assert.throws(() => draftPosts('<rss></rss>', { blogDir: dir }), /no posts/);
  assert.deepEqual(readdirSync(dir), []);
});

test('the saved feed fixture drafts through the same parser the site uses', () => {
  const xml = readFileSync(new URL('./fixtures/substack-feed.xml', import.meta.url), 'utf8');
  const dir = blogDir();
  const { written, noBody } = draftPosts(xml, { blogDir: dir });
  assert.equal(written.length + noBody.length, parseFeed(xml).length);
});
