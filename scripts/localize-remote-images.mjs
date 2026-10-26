/**
 * Copies remote images in blog posts into the repo.
 *
 * Posts mirrored from Substack point at substackcdn.com. The site's Content
 * Security Policy only allows images from this origin, so those images were
 * blocked, and a third-party image is a second DNS lookup, a second TLS
 * handshake and no width or height, so the text jumps when it arrives.
 *
 * This downloads each one to src/content/blog/_images/ and rewrites the
 * Markdown to the local path. Astro then serves it from this origin as an
 * optimized, lazily loaded image with its dimensions set.
 *
 *     node scripts/localize-remote-images.mjs
 *
 * Run it after mirroring a new post. It skips images it has already copied.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOG = fileURLToPath(new URL('../src/content/blog', import.meta.url));
const OUT = join(BLOG, '_images');
const REMOTE = /!\[([^\]]*)\]\((https:\/\/substackcdn\.com\/[^)\s]+)\)/g;
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };

mkdirSync(OUT, { recursive: true });

let copied = 0;
for (const name of readdirSync(BLOG).filter((n) => n.endsWith('.md') && !n.startsWith('_'))) {
  const path = join(BLOG, name);
  const slug = name.replace(/\.md$/, '');
  const source = readFileSync(path, 'utf8');
  const matches = [...source.matchAll(REMOTE)];
  if (!matches.length) continue;

  let next = source;
  for (const [index, [whole, alt, url]] of matches.entries()) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${slug}: HTTP ${response.status} for ${url}`);
    const type = (response.headers.get('content-type') || '').split(';')[0];
    const ext = EXT[type];
    if (!ext) throw new Error(`${slug}: unexpected content type ${type} for ${url}`);

    const file = `${slug}-${index + 1}.${ext}`;
    if (!existsSync(join(OUT, file))) {
      writeFileSync(join(OUT, file), Buffer.from(await response.arrayBuffer()));
    }
    next = next.replace(whole, `![${alt}](./_images/${file})`);
    copied += 1;
    console.log(`  ${file}`);
  }
  writeFileSync(path, next);
}

console.log(`\n${copied} image(s) now served from this site.`);
