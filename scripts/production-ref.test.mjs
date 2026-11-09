import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { productionRef } from '../.claude/skills/verify/scripts/production-ref.mjs';
import { answerKey } from '../.claude/skills/verify/scripts/answer-key.mjs';

const keyPath = '.claude/skills/verify/acceptance.md';
const git = (repo, ...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

test('production key follows main then prod and rejects missing, changed or task-branch keys', () => {
  const directory = mkdtempSync(join(tmpdir(), 'production-ref-'));
  const repo = join(directory, 'checkout');
  const override = process.env.VERIFY_ANSWER_KEY_REF;
  delete process.env.VERIFY_ANSWER_KEY_REF;
  try {
    execFileSync('git', ['clone', '--quiet', '--shared', '--no-checkout', process.cwd(), repo], { stdio: 'pipe' });
    const sha = git(repo, 'rev-parse', 'HEAD');
    mkdirSync(join(repo, '.claude/skills/verify'), { recursive: true });
    writeFileSync(join(repo, keyPath), readFileSync(keyPath));
    for (const branch of ['main', 'prod']) {
      git(repo, 'update-ref', `refs/remotes/origin/${branch}`, sha);
      git(repo, 'symbolic-ref', 'refs/remotes/origin/HEAD', `refs/remotes/origin/${branch}`);
      assert.equal(productionRef(repo), `origin/${branch}`);
      assert.equal(answerKey(repo).verdict, 'PASS');
    }
    // The stale main ref remains, but the selected production key is prod.
    assert.equal(answerKey(repo).note, 'read from origin/prod');
    process.env.VERIFY_ANSWER_KEY_REF = 'HEAD';
    assert.equal(answerKey(repo).verdict, 'FAIL');
    delete process.env.VERIFY_ANSWER_KEY_REF;
    writeFileSync(join(repo, keyPath), 'Changed by branch under test');
    assert.equal(answerKey(repo).verdict, 'FAIL');
    git(repo, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/dev');
    assert.throws(() => productionRef(repo), /origin\/main or origin\/prod/);
    git(repo, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/prod');
    git(repo, 'update-ref', '-d', 'refs/remotes/origin/prod');
    assert.equal(answerKey(repo).verdict, 'FAIL');
  } finally {
    if (override === undefined) delete process.env.VERIFY_ANSWER_KEY_REF;
    else process.env.VERIFY_ANSWER_KEY_REF = override;
    rmSync(directory, { recursive: true, force: true });
  }
});

test('fetch script discovers a renamed remote default and never selects dev', () => {
  const directory = mkdtempSync(join(tmpdir(), 'production-fetch-'));
  const remote = join(directory, 'remote.git'), repo = join(directory, 'checkout');
  const script = resolve('.claude/skills/verify/scripts/fetch-production.sh');
  const env = { ...process.env };
  delete env.VERIFY_PRODUCTION_BRANCH;
  try {
    execFileSync('git', ['clone', '--bare', '--shared', '--quiet', process.cwd(), remote], { stdio: 'pipe' });
    const sha = git(remote, 'rev-parse', 'HEAD');
    git(remote, 'update-ref', 'refs/heads/main', sha);
    git(remote, 'symbolic-ref', 'HEAD', 'refs/heads/main');
    execFileSync('git', ['clone', '--quiet', '--shared', '--no-checkout', remote, repo], { stdio: 'pipe' });
    execFileSync('bash', [script, repo], { env, stdio: 'pipe' });
    assert.equal(productionRef(repo), 'origin/main');
    git(remote, 'update-ref', 'refs/heads/prod', sha);
    git(remote, 'symbolic-ref', 'HEAD', 'refs/heads/prod');
    git(remote, 'update-ref', '-d', 'refs/heads/main');
    execFileSync('bash', [script, repo], { env, stdio: 'pipe' });
    assert.equal(productionRef(repo), 'origin/prod');
    assert.throws(() => execFileSync('bash', [script, repo], { env: { ...env, VERIFY_PRODUCTION_BRANCH: 'dev' }, stdio: 'pipe' }));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
