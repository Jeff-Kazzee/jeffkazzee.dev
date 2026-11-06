/**
 * Drafts blog mirrors from the Substack feed.
 *
 * For each feed post with no file in src/content/blog/, this writes one with
 * draft: true, then copies its images into the repo. Nothing here publishes:
 * a person reads the draft and sets draft: false by hand. It never touches a
 * file that already exists.
 *
 *     npm run draft:substack                 every post not mirrored yet
 *     npm run draft:substack -- <slug> ...   only these posts
 *
 * The feed holds the 20 newest posts, so an older post still needs copying by
 * hand.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchFeed, parseBodies, parseFeed, postKey } from '../src/lib/substack-feed.mjs';
import { get, parse } from './lib/frontmatter.mjs';
import { htmlToMarkdown } from './lib/substack-markdown.mjs';

const BLOG = fileURLToPath(new URL('../src/content/blog', import.meta.url));
const LOCALIZE = fileURLToPath(new URL('./localize-remote-images.mjs', import.meta.url));

/** Slugs and post keys already taken, by published posts and by drafts alike. */
function mirrored(blogDir) {
  const taken = new Set();
  for (const name of readdirSync(blogDir).filter((n) => n.endsWith('.md'))) {
    taken.add(name.replace(/\.md$/, ''));
    const front = parse(readFileSync(join(blogDir, name), 'utf8'));
    const canonical = front && get(front, 'canonicalUrl')?.replace(/^['"]|['"]$/g, '');
    if (canonical) taken.add(postKey(canonical));
  }
  return taken;
}

function draftFile(post, markdown) {
  const head = [
    `title: ${JSON.stringify(post.title)}`,
    `description: ${JSON.stringify(post.description)}`,
    `pubDate: ${post.pubDate.slice(0, 10)}`,
    `canonicalUrl: ${post.url}`,
    'tags: []',
    'draft: true',
  ];
  return `---\n${head.join('\n')}\n---\n\n${markdown}`;
}

/**
 * Writes a draft for each feed post not mirrored yet.
 *
 * @param {string} xml the feed
 * @param {{ blogDir?: string, only?: string[] }} [options]
 * @returns {{ written: { id: string, notes: string[] }[], noBody: string[], notInFeed: string[] }}
 */
export function draftPosts(xml, { blogDir = BLOG, only = [] } = {}) {
  // Same test the site's feed loader uses for a cut-off answer.
  if (!xml.includes('</rss>')) throw new Error('the feed is incomplete');
  const posts = parseFeed(xml);
  if (posts.length === 0) throw new Error('no posts in the feed');

  const bodies = parseBodies(xml);
  const taken = mirrored(blogDir);
  const wanted = (post) => only.length === 0 || only.includes(post.id);
  const result = { written: [], noBody: [], notInFeed: only.filter((id) => !posts.some((post) => post.id === id)) };

  for (const post of posts.filter(wanted)) {
    if (taken.has(post.id) || taken.has(postKey(post.url))) continue;
    const html = bodies.get(post.id);
    if (!html) {
      result.noBody.push(post.id);
      continue;
    }
    const { markdown, notes } = htmlToMarkdown(html);
    // wx: a draft someone is editing must never be overwritten.
    writeFileSync(join(blogDir, `${post.id}.md`), draftFile(post, markdown), { flag: 'wx' });
    result.written.push({ id: post.id, notes });
  }
  return result;
}

async function main() {
  const { written, noBody, notInFeed } = draftPosts(await fetchFeed(undefined, { timeoutMs: 30000 }), {
    only: process.argv.slice(2),
  });

  for (const id of notInFeed) console.log(`Not in the feed: ${id}. The feed holds the 20 newest posts.`);
  for (const id of noBody) console.log(`Skipped ${id}: the feed has no body for it.`);
  // Runs with no new drafts too, so a rerun finishes images a failed run left remote.
  execFileSync(process.execPath, [LOCALIZE], { stdio: 'inherit' });
  if (written.length === 0) {
    console.log('No new posts to draft.');
    return;
  }

  for (const { id, notes } of written) {
    console.log(`Drafted src/content/blog/${id}.md`);
    for (const note of notes) console.log(`  Not mirrored: ${note}`);
  }
  console.log('\nEach draft stays off the site until a person reads it and sets draft: false.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
