import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

// Keep package.json authoritative for both Vercel's npm and CI's pnpm graph.
const { overrides } = JSON.parse(readFileSync('package.json', 'utf8'));
const pnpmOverrides = Object.fromEntries(Object.entries(overrides).flatMap(([parent, value]) =>
  typeof value === 'string'
    ? [[parent, value]]
    : Object.entries(value).map(([child, version]) => [`${parent}>${child}`, version]),
));
copyFileSync('.github/ci-pnpm-lock.yaml', 'pnpm-lock.yaml');
writeFileSync('pnpm-workspace.yaml', JSON.stringify({
  nodeLinker: 'hoisted',
  ignoreScripts: true,
  overrides: pnpmOverrides,
}, null, 2) + '\n');
