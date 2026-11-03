export const SPACE_IMAGE_IDS = Object.freeze(['pillars-miri', 'arp142', 'pillars-nircam', 'stephans-quintet', 'rho-ophiuchi']);
const harness = Object.freeze({
  '/deepseek-harness/': 'pillars-miri',
  '/deepseek-harness/advisor-models/': 'arp142',
  '/deepseek-harness/browser-verification/': 'rho-ophiuchi',
  '/deepseek-harness/team-worktree/': 'stephans-quintet',
  '/deepseek-harness/plugin-lab/': 'pillars-nircam',
  // Main menu pages each get their own photo.
  '/projects/': 'pillars-nircam',
  '/blog/': 'arp142',
  '/for-agents/': 'stephans-quintet',
  '/work-with-me/': 'rho-ophiuchi',
});
/** Stable per-route imagery, without a browser request or runtime randomness. */
export function spaceImageId(pathname) {
  const path = '/' + String(pathname).split(/[?#]/)[0].split('/').filter(Boolean).join('/') + '/';
  if (Object.hasOwn(harness, path)) return harness[path];
  let hash = 0;
  for (const character of path) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  return SPACE_IMAGE_IDS[hash % SPACE_IMAGE_IDS.length];
}
