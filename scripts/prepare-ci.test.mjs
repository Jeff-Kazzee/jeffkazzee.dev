import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('CI carries nested npm overrides into pnpm without changing the source manifest', () => {
  const directory = mkdtempSync(join(tmpdir(), 'portfolio-ci-'));
  const manifest = JSON.stringify({ overrides: {
    'yaml-language-server': { yaml: '2.9.0' },
    '@vercel/cli-config': { zod: '4.6.7' },
    esbuild: '0.28.1',
  } });
  try {
    mkdirSync(join(directory, '.github'));
    writeFileSync(join(directory, 'package.json'), manifest);
    writeFileSync(join(directory, '.github/ci-pnpm-lock.yaml'), 'fixture-lock');
    execFileSync(process.execPath, [fileURLToPath(new URL('./prepare-ci.mjs', import.meta.url))], { cwd: directory });
    const workspace = JSON.parse(readFileSync(join(directory, 'pnpm-workspace.yaml'), 'utf8'));
    assert.deepEqual(workspace.overrides, {
      'yaml-language-server>yaml': '2.9.0',
      '@vercel/cli-config>zod': '4.6.7',
      esbuild: '0.28.1',
    });
    assert.equal(workspace.nodeLinker, 'hoisted');
    assert.equal(workspace.ignoreScripts, true);
    assert.equal(readFileSync(join(directory, 'pnpm-lock.yaml'), 'utf8'), 'fixture-lock');
    assert.equal(readFileSync(join(directory, 'package.json'), 'utf8'), manifest);
  } finally {
    assert.equal(dirname(directory), resolve(tmpdir()));
    rmSync(directory, { recursive: true });
  }
});
