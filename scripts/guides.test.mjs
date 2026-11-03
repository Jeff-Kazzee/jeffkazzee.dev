import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { guideMetadata, selectPublishedGuides, guideKindLabels, HARNESS_FUTURE } from '../src/lib/guide-policy.mjs';

const entry = (id, draft, kind = 'guide', time = 0) => ({
  id,
  data: { title: id, description: id + ' description', draft, kind, series: 'deepseek-harness', tags: [], pubDate: new Date(1793577600000 + time), verifiedDate: new Date('2026-11-02'), canonicalUrl: 'https://example.org/not-ours' },
});

test('publication policy excludes every non-approved value without mutating entries', () => {
  const states = [undefined, true, false, null, 0, 1, '', 'false'];
  for (let size = 0; size <= 80; size++) {
    const entries = Array.from({ length: size }, (_, i) => entry('deepseek-harness/guide-' + i, states[(i + size) % states.length], 'guide', i % 4));
    const original = [...entries];
    const selected = selectPublishedGuides(entries);
    assert.deepEqual(entries, original);
    assert.deepEqual(new Set(selected), new Set(entries.filter(({ data }) => data.draft === false)));
    assert.ok(selected.every(({ data }) => data.draft === false));
    assert.deepEqual(selectPublishedGuides([...entries].reverse()), selected);
  }
});

test('published IDs cannot escape the Harness section', () => {
  for (const id of ['other', '', 'deepseek-harness/', 'deepseek-harness/../escape', 'deepseek-harness/UPPER', 'deepseek-harness/a?b', 'deepseek-harness/a#b', 'deepseek-harness/a//b', 'deepseek-harness/./escape', 'deepseek-harness/a/../escape', 'deepseek-harness/%2e%2e/escape', '//evil.example/', 'deepseek-harness/a' + String.fromCharCode(92) + 'b']) {
    const invalid = entry(id, false);
    assert.deepEqual(selectPublishedGuides([invalid]), []);
    assert.throws(() => guideMetadata(invalid), /Guide ID must stay within/);
  }
  assert.equal(selectPublishedGuides([entry('deepseek-harness/nested/safe-guide', false)]).length, 1);
});

test('every kind uses owned canonical and Markdown URLs with a source-check date', () => {
  for (const kind of Object.keys(guideKindLabels)) {
    for (let i = 0; i < 32; i++) {
      const record = guideMetadata(entry('deepseek-harness/example-' + i, false, kind));
      assert.equal(record.canonicalUrl, 'https://jeffkazzee.dev/deepseek-harness/example-' + i + '/');
      assert.equal(record.url, record.canonicalUrl);
      assert.equal(record.markdownUrl, record.url.slice(0, -1) + '.md');
      assert.equal(record.verifiedDate, '2026-11-02');
      assert.equal(record.kindLabel, guideKindLabels[kind]);
      assert.equal(record.series, 'deepseek-harness');
      assert.ok(!JSON.stringify(record).includes('example.org'));
    }
  }
  assert.equal(new Set(Object.values(guideKindLabels)).size, 3);
  assert.equal(HARNESS_FUTURE, 'Some of this work may feed into Vivary. Those connections are ideas, not shipped features.');
});

test('schema fails closed and every guide reader uses the shared gate', async () => {
  const read = async (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');
  const config = await read('src/content.config.ts');
  assert.match(config.slice(config.indexOf('const guides =')), /draft: z.boolean\(\).default\(true\)/);
  const consumers = {
    'src/pages/deepseek-harness/index.astro': 'getGuides',
    'src/pages/deepseek-harness/[...slug].astro': 'getPublishedGuides',
    'src/pages/[...path].md.ts': 'getPublishedGuides',
    'src/pages/rss.xml.js': 'getGuides',
    'src/pages/api/content.json.ts': 'getGuides',
    'src/pages/llms.txt.ts': 'getGuides',
    'src/pages/llms-full.txt.ts': 'getGuides',
    'src/pages/blog/index.astro': 'getGuides',
  };
  for (const [path, helper] of Object.entries(consumers)) {
    const source = await read(path);
    assert.ok(source.includes(helper + '('), path + ' must call publication gate');
    assert.ok(!/getCollection\(['"]guides/.test(source), path + ' bypasses publication gate');
  }
});

test('no other source module directly reads the guides collection', async () => {
  async function walk(directory) {
    const paths = [];
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const url = new URL(item.name + (item.isDirectory() ? '/' : ''), directory);
      if (item.isDirectory()) paths.push(...await walk(url));
      else if (/\.(?:[cm]?[jt]s|astro)$/.test(item.name)) paths.push(url);
    }
    return paths;
  }
  for (const url of await walk(new URL('../src/', import.meta.url))) {
    if (url.pathname.endsWith('/lib/content-index.ts')) continue;
    assert.ok(!/getCollection\(\s*['"]guides['"]/.test(await readFile(url, 'utf8')), url.pathname);
  }
});

test('writing includes published guides, Harness questions route there, invoice fallback stays projects', async () => {
  const fetchBefore = globalThis.fetch;
  const published = selectPublishedGuides([entry('deepseek-harness/public-example', false), entry('SECRET_DRAFT', true)]).map(guideMetadata);
  globalThis.fetch = async () => Response.json({
    posts: [{ title: 'An essay', pubDate: '2026-10-01', description: 'Essay description', url: 'https://jeffkazzee.dev/blog/essay/' }],
    guides: published,
    projects: [{ title: 'LLM Arcade', description: 'Games', tags: [], stack: [], status: 'shipped', url: 'https://jeffkazzee.dev/projects/llm-arcade/' }],
  });
  try {
    const { runTool, answerQuestion } = await import('../src/lib/agent-answers.mjs?guide-properties');
    const writing = await runTool('list_writing', {}, 'https://jeffkazzee.dev');
    assert.ok(writing.indexOf('public-example') < writing.indexOf('An essay'));
    assert.match(writing, /\(Guide\)/);
    assert.ok(!writing.includes('SECRET_DRAFT'));
    for (const question of ['DeepSeek Harness', 'DSH', 'advisor-models', 'browser verification', 'team worktree', 'plugin lab', 'deepseek-harness/public-example']) {
      const answer = await answerQuestion(question, 'https://jeffkazzee.dev');
      assert.ok(answer.includes('/deepseek-harness/'), question);
      assert.ok(!answer.includes('SECRET_DRAFT'));
      assert.ok(!answer.includes('LLM Arcade'), question);
    }
    const fallback = await answerQuestion('Is there a guide for chasing invoices?', 'https://jeffkazzee.dev');
    assert.match(fallback, /LLM Arcade/);
  } finally {
    globalThis.fetch = fetchBefore;
  }
});
