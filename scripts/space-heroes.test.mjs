import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spaceImageId, SPACE_IMAGE_IDS } from '../src/lib/space-selection.mjs';
const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('five Harness routes have distinct fixed local images', () => {
  const expected = {
    '/deepseek-harness/': 'pillars-miri',
    '/deepseek-harness/advisor-models/': 'arp142',
    '/deepseek-harness/browser-verification/': 'rho-ophiuchi',
    '/deepseek-harness/team-worktree/': 'stephans-quintet',
    '/deepseek-harness/plugin-lab/': 'pillars-nircam',
  };
  assert.equal(new Set(Object.values(expected)).size, 5);
  for (const [path, id] of Object.entries(expected)) {
    assert.equal(spaceImageId(path), id);
    assert.equal(spaceImageId(path + '?ignored=true#fragment'), id);
    assert.equal(spaceImageId(path.slice(0, -1)), id);
  }
});

test('the four main menu pages have distinct fixed images', () => {
  const menu = { '/projects/': 'pillars-nircam', '/blog/': 'arp142', '/for-agents/': 'stephans-quintet', '/work-with-me/': 'rho-ophiuchi' };
  assert.equal(new Set(Object.values(menu)).size, 4);
  for (const [path, id] of Object.entries(menu)) assert.equal(spaceImageId(path), id);
});

test('other routes select a stable varied image without runtime randomness', () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const path = '/projects/example-' + i + '/';
    const selected = spaceImageId(path);
    assert.equal(selected, spaceImageId(path));
    assert.ok(SPACE_IMAGE_IDS.includes(selected));
    seen.add(selected);
  }
  assert.equal(seen.size, 5);
});

test('all twelve inner templates explicitly move H1 into the shared hero', async () => {
  for (const path of ['projects/index', 'projects/[slug]', 'blog/index', 'blog/[slug]', 'deepseek-harness/index', 'deepseek-harness/[...slug]', 'for-agents', 'context-engine', 'work-with-me', '404', 'offline', 'contact-thanks']) {
    const text = await read('src/pages/' + path + '.astro');
    assert.ok(text.includes('hero={{ title:'), path);
    assert.ok(!/<h1(?:\s|>)/.test(text), path + ' must not duplicate the shared H1');
  }
  const layout = await read('src/layouts/BaseLayout.astro');
  assert.match(layout, /SpaceHero/);
  assert.match(layout, /name="hero-meta" slot="meta"/);
  const hero = await read('src/components/SpaceHero.astro');
  assert.equal((hero.match(/<h1(?:\s|>)/g) ?? []).length, 1);
  assert.ok(hero.includes("formats={['avif', 'webp']}"));
  assert.ok(hero.includes('Cropped for this banner'));
  assert.ok(hero.includes('https://creativecommons.org/licenses/by/4.0/'));
});

test('five credited source images are local and populated', async () => {
  const catalog = await read('src/lib/space-images.ts');
  for (const id of SPACE_IMAGE_IDS) {
    const info = await stat(new URL('../src/assets/space/' + id + '.jpg', import.meta.url));
    assert.ok(info.isFile() && info.size > 0, id);
    assert.ok(catalog.includes("../assets/space/" + id + '.jpg'), id);
  }
  for (const source of ['weic2218a', 'weic2420a', 'weic2216a', 'weic2208a', 'weic2316a']) assert.ok(catalog.includes('https://esawebb.org/images/' + source + '/'));
});

test('unapproved public content and homepage remain byte-identical', async () => {
  const frozen = JSON.parse(await read('scripts/fixtures/space-preserved-content.json'));
  assert.ok(Object.keys(frozen).length > 10);
  for (const [path, expected] of Object.entries(frozen)) {
    const bytes = await readFile(new URL('../' + path, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, path);
  }
});

test('only approved public Advisor copy and hub strings are exposed', async () => {
  const advisor = await read('src/content/guides/deepseek-harness/advisor-models.md');
  assert.match(advisor, /title: "Advisor Models"/);
  assert.ok(advisor.includes('actions/runs/41562213993'));
  assert.ok(advisor.includes('actions/runs/41563519067'));
  assert.ok(!advisor.includes('## Private editorial record'));
  assert.ok(!advisor.includes('private-prototype'));
  assert.ok(!advisor.includes('NOT APPROVED'));
  assert.ok(!/^# Advisor Models$/m.test(advisor), 'the title belongs to the hero, not the article body');
  const policy = await read('src/lib/guide-policy.mjs');
  for (const text of ['I build tools for my coding agents. DeepSeek Harness is where I put them to work.', 'Pick a guide to see what each tool does, how it works and what I have checked.', 'There is room here for small fixes, configuration changes and tests that went wrong.', 'Some of this work may feed into Vivary. Those connections are ideas, not shipped features.', 'These are my additions to DeepSeek Harness, separate from its official documentation. Each guide links the source and explains setup and testing limits.']) assert.ok(policy.includes(text));
});

test('hero dimensions and Harness composition retain the approved prototype', async () => {
  const hero = await read('src/components/SpaceHero.astro');
  assert.ok(hero.includes('min-height: 480px'));
  assert.ok(hero.includes('min-height: 430px'));
  assert.ok(hero.includes('clamp(2.25rem, 4.5vw, 3.5rem)'));
  assert.ok(hero.includes('max-width: 25rem'));
  assert.ok(hero.includes('font-size: .75rem'));
  assert.ok(hero.includes('font-size: .7rem'));
  assert.ok(hero.includes('.space-meta :global(a:not(.btn))'));
  assert.ok(!hero.includes('.space-meta :global(a)'));
  const hub = await read('src/pages/deepseek-harness/index.astro');
  assert.ok(hub.includes('<div class="wrap harness-intro"><p>{HARNESS_INTRODUCTION}</p><p>{HARNESS_GUIDANCE}</p></div>'));
  assert.ok(!hub.includes('slot="hero-meta"'));
  assert.ok(!hub.includes('tool-number'));
  assert.ok(hub.includes('>→</span>'));
  assert.ok(hub.includes('font-size: 1.35rem; font-weight: 540'));
  assert.ok(hub.indexOf('class="wrap harness-footer"') > hub.indexOf('</aside>'));
  const policy = await read('src/lib/guide-policy.mjs');
  assert.ok(policy.includes('HARNESS_DESCRIPTION = "Tools and working notes from my coding-agent setup."'));
  const guide = await read('src/pages/deepseek-harness/[...slug].astro');
  assert.ok(guide.indexOf('<footer class="source-check">') > guide.indexOf('<Content />'));
  const meta = guide.slice(guide.indexOf('slot="hero-meta"'), guide.indexOf('</div>', guide.indexOf('slot="hero-meta"')));
  assert.ok(!meta.includes('Source checked'));
});
