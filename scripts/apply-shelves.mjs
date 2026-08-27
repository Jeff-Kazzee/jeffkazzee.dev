/**
 * One-shot: apply the current home page grouping to the project files.
 *
 * Kept in the repo because it documents the grouping in one readable place,
 * and because doing this with ad-hoc regex twice already corrupted the
 * front matter. It goes through the shared block-preserving parser instead.
 *
 *     node scripts/apply-shelves.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse, serialize, set, remove } from './lib/frontmatter.mjs';

const DIR = fileURLToPath(new URL('../src/content/projects', import.meta.url));

/** [shelf, order, featured]. A null shelf keeps the project off the home page. */
const PLAN = {
  // Community resources: the Zo Computer libraries the community actually uses
  'zo-deep-dives.md': ['community', 1, true],
  'zo-computer-101.md': ['community', 2, true],
  'zo-cookbook.md': ['community', 3, true],
  // Open tools
  'bellamente.md': ['tools', 4, true],
  'sdlc-skills.md': ['tools', 5, true],
  'open-world-factbook.md': ['tools', 6, true],
  // Side projects, below everything else
  'llm-arcade.md': ['side', 7, true],
  'ukrainian-trainer.md': ['side', 8, false],
  'puckwork.md': ['side', 9, false],
  'neon-noir-detective-agency.md': ['side', 10, false],
  'dumpling-cafe.md': ['side', 11, false],
  // Kept on /projects/ only
  'braincheck.md': [null, 20, false],
  'loam.md': [null, 21, false],
  'throughline.md': [null, 22, false],
  'flywheel.md': [null, 23, false],
  'dreaming.md': [null, 24, false],
};

/** Earlier work, kept for the record. */
const ARCHIVED = new Set(['obscura.md', 'vivary.md']);

for (const [name, [shelf, order, featured]] of Object.entries(PLAN)) {
  const path = join(DIR, name);
  if (!existsSync(path)) {
    console.log(`  skip     ${name} (not present)`);
    continue;
  }

  const parsed = parse(readFileSync(path, 'utf8'));
  if (!parsed) throw new Error(`${name} has no front matter`);

  if (shelf) set(parsed, 'shelf', shelf);
  else remove(parsed, 'shelf');

  set(parsed, 'featured', String(featured));
  set(parsed, 'order', String(order));
  remove(parsed, 'archived');
  remove(parsed, 'layer'); // retired field

  writeFileSync(path, serialize(parsed), 'utf8');
  console.log(`  ${(shelf ?? 'unlisted').padEnd(9)} ${name.replace('.md', '')}  order ${order}`);
}

for (const name of ARCHIVED) {
  const path = join(DIR, name);
  if (!existsSync(path)) continue;

  const parsed = parse(readFileSync(path, 'utf8'));
  remove(parsed, 'shelf');
  remove(parsed, 'layer');
  set(parsed, 'featured', 'false');
  set(parsed, 'archived', 'true');
  set(parsed, 'order', '40');

  writeFileSync(path, serialize(parsed), 'utf8');
  console.log(`  archived  ${name.replace('.md', '')}`);
}

console.log('\nRun `npm run verify:projects -- --write` next to re-stamp the checks.');
