// The answer key is acceptance.md as origin/main has it, never the copy on the
// branch under test, so a branch cannot rewrite its own key. A missing key is a
// failure, not a reason to trust the branch. VERIFY_ANSWER_KEY_REF names
// another ref for audits.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const KEY = '.claude/skills/verify/acceptance.md';

export function answerKey(repo) {
  const ref = process.env.VERIFY_ANSWER_KEY_REF ?? 'origin/main';
  let text;
  try {
    text = execFileSync('git', ['-C', repo, 'show', `${ref}:${KEY}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return { text: null, verdict: 'FAIL', note: `${ref} has no readable ${KEY}. Run git fetch origin main. Every check that needs the key is unverified` };
  }
  // Deleting the key is a change to it too.
  const branchCopy = existsSync(join(repo, KEY)) ? readFileSync(join(repo, KEY), 'utf8') : null;
  if (branchCopy !== text) {
    const change = branchCopy === null ? 'deletes' : 'changes';
    return { text, verdict: 'FAIL', note: `this branch ${change} ${KEY}. The run uses the copy on ${ref}. A change to the key needs its own reviewed PR` };
  }
  return { text, verdict: 'PASS', note: `read from ${ref}` };
}

export function table(text, heading) {
  const section = text.split(`## ${heading}`)[1];
  if (!section) throw new Error(`the answer key has no "${heading}" table`);
  return section.split('\n## ')[0].split('\n')
    .filter((l) => l.startsWith('|') && !l.startsWith('|---')).slice(1)
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim().replace(/^`|`$/g, '')));
}
