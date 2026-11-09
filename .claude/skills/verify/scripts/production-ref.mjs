import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/** Use the fetched production branch, never HEAD or a guessed branch under test. */
export function productionRef(repo) {
  const ref = execFileSync('git', ['-C', repo, 'symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  if (!['origin/main', 'origin/prod'].includes(ref)) throw new Error('Production ref must be origin/main or origin/prod; run fetch-production.sh');
  execFileSync('git', ['-C', repo, 'rev-parse', '--verify', `${ref}^{commit}`], { stdio: 'ignore' });
  return ref;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(productionRef(process.argv[2] ?? process.cwd()));
}
