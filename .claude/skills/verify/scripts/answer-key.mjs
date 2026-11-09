// The answer key comes from the fetched production ref, never the branch under test.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { productionRef } from './production-ref.mjs';

const KEY = '.claude/skills/verify/acceptance.md';

export function answerKey(repo) {
  let ref;
  let text;
  try {
    ref = productionRef(repo);
    if (process.env.VERIFY_ANSWER_KEY_REF && process.env.VERIFY_ANSWER_KEY_REF !== ref) {
      return { text: null, verdict: 'FAIL', note: 'VERIFY_ANSWER_KEY_REF cannot override the independent production key' };
    }
    text = execFileSync('git', ['-C', repo, 'show', `${ref}:${KEY}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return { text: null, verdict: 'FAIL', note: `${ref ?? "Production ref"} has no readable ${KEY}. Run .claude/skills/verify/scripts/fetch-production.sh. Every check that needs the key is unverified` };
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
