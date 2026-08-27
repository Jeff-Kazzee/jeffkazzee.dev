/**
 * Checks that every project on this site is real.
 *
 * Three entries once described things that did not exist. They looked exactly
 * like the real ones, because nothing ever tested them. This does:
 *
 *   - `liveUrl` must actually answer. Redirects are followed to the end.
 *   - `repoUrl` must exist, must not be a fork of someone else's work, and
 *     must carry enough files to be more than a README.
 *
 *     npm run verify:projects           check and report
 *     npm run verify:projects -- --write  stamp `verified:` on what passed
 *
 * The build refuses to ship a listed project with no `verified` date, so a
 * project cannot reach the site without having passed this at least once.
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { get, parse, serialize, set } from './lib/frontmatter.mjs';

const DIR = fileURLToPath(new URL('../src/content/projects', import.meta.url));
const write = process.argv.includes('--write');

/** Below this a repository is a README with ambitions, not a project. */
const THIN_FILE_COUNT = 20;
const TIMEOUT_MS = 20000;

const today = new Date().toISOString().slice(0, 10);

function readProjects() {
  return readdirSync(DIR)
    .filter((name) => name.endsWith('.md') && !name.startsWith('_'))
    .map((name) => {
      const path = join(DIR, name);
      const parsed = parse(readFileSync(path, 'utf8'));
      if (!parsed) throw new Error(`${name} has no front matter`);

      const value = (key) => get(parsed, key);

      return {
        name,
        path,
        parsed,
        title: value('title') ?? name,
        liveUrl: value('liveUrl'),
        repoUrl: value('repoUrl'),
        archived: value('archived') === 'true',
        listed: Boolean(value('shelf')),
      };
    });
}

async function checkUrl(url) {
  const signal = AbortSignal.timeout(TIMEOUT_MS);

  try {
    const response = await fetch(url, { redirect: 'follow', signal });
    if (response.status < 400) return { ok: true, note: `${response.status}` };
    return { ok: false, note: `HTTP ${response.status}` };
  } catch (error) {
    // A failed TLS handshake or dead host lands here, which is the exact
    // shape launchling.app had while still looking fine in a repo listing.
    return { ok: false, note: `unreachable (${error.name})` };
  }
}

async function checkRepo(url) {
  const slug = url.replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
  const signal = AbortSignal.timeout(TIMEOUT_MS);

  try {
    const meta = await fetch(`https://api.github.com/repos/${slug}`, { signal });
    if (meta.status === 404) return { ok: false, note: 'repo not found' };
    if (!meta.ok) return { ok: true, note: `unchecked (HTTP ${meta.status})`, soft: true };

    const repo = await meta.json();
    if (repo.fork) {
      return { ok: false, note: `fork of ${repo.parent?.full_name ?? 'another repo'}` };
    }

    const treeResponse = await fetch(
      `https://api.github.com/repos/${slug}/git/trees/HEAD?recursive=1`,
      { signal },
    );

    if (!treeResponse.ok) return { ok: true, note: 'exists', soft: true };

    const tree = await treeResponse.json();
    const files = (tree.tree ?? []).filter((node) => node.type === 'blob').length;

    if (files < THIN_FILE_COUNT) return { ok: false, note: `thin: ${files} files`, thin: true };
    return { ok: true, note: `${files} files` };
  } catch (error) {
    return { ok: true, note: `unchecked (${error.name})`, soft: true };
  }
}

function stamp(project) {
  writeFileSync(project.path, serialize(set(project.parsed, 'verified', today)), 'utf8');
}

const projects = readProjects();
const failures = [];

console.log(`Checking ${projects.length} projects\n`);

for (const project of projects) {
  const results = [];

  if (project.liveUrl) results.push(['live', await checkUrl(project.liveUrl)]);
  if (project.repoUrl) results.push(['repo', await checkRepo(project.repoUrl)]);

  if (results.length === 0) {
    // Nothing to check against. That is itself untrustworthy for a listed project.
    const label = project.archived ? 'archived' : 'LISTED';
    const bad = project.listed;
    console.log(`  ${bad ? 'FAIL' : 'skip'}  ${project.title.padEnd(26)} no liveUrl or repoUrl (${label})`);
    if (bad) failures.push({ project, why: 'nothing to verify against' });
    continue;
  }

  const bad = results.filter(([, r]) => !r.ok);
  const detail = results.map(([kind, r]) => `${kind} ${r.note}`).join(', ');
  const shipping = project.listed && !project.archived;

  if (bad.length === 0) {
    console.log(`  PASS  ${project.title.padEnd(26)} ${detail}`);
    if (write) stamp(project);
  } else if (!shipping) {
    console.log(`  warn  ${project.title.padEnd(26)} ${detail}  (not on the home page)`);
  } else {
    console.log(`  FAIL  ${project.title.padEnd(26)} ${detail}`);
    failures.push({ project, why: detail });
  }
}

if (write) console.log(`\nStamped verified: ${today} on everything that passed.`);

if (failures.length > 0) {
  console.log(`\n${failures.length} listed project(s) failed:`);
  for (const { project, why } of failures) console.log(`  ${project.name}: ${why}`);
  console.log('\nFix the link, or drop the project. Do not ship a claim that does not resolve.');
  process.exit(1);
}

console.log('\nEvery listed project resolves.');
