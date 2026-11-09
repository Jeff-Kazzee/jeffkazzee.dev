import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createWritingPage } from '../src/lib/writing-page.mjs';

let page;
/** Vercel-native HTML route; static build artifacts provide the cold/error fallback. */
export default async function handler(request, response) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.setHeader('Allow', 'GET, HEAD');
    response.statusCode = 405;
    return response.end();
  }
  page ??= createWritingPage({
    template: readFileSync(join(process.cwd(), 'dist/blog/index.html'), 'utf8'),
    localPosts: JSON.parse(readFileSync(join(process.cwd(), 'dist/api/content.json'), 'utf8')).posts,
  });
  const result = await page();
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('Vary', 'Accept');
  response.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  response.setHeader('Vercel-CDN-Cache-Control', result.fresh
    ? 'public, s-maxage=300, stale-while-revalidate=60'
    : 'public, s-maxage=30');
  response.statusCode = 200;
  response.end(request.method === 'HEAD' ? undefined : result.html);
}
