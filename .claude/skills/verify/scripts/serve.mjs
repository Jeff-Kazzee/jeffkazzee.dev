// Usage: node serve.mjs <dist> <port>
// Serves the build with the redirects and headers from vercel.json, so a browser
// enforces the real Content-Security-Policy. Vercel middleware does not run here.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const [dist, port] = [resolve(process.argv[2]), Number(process.argv[3])];
const vercel = JSON.parse(await readFile(join(dist, '..', 'vercel.json'), 'utf8'));
const pattern = (source) => new RegExp('^' + source.replace(/:\w+\(/g, '(') + '$');
const redirects = (vercel.redirects ?? []).map((r) => ({ ...r, re: pattern(r.source) }));
const headerRules = (vercel.headers ?? []).map((h) => ({ ...h, re: pattern(h.source) }));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

// path is already decoded. A bare prefix check would let /../dist-secret/ through.
async function resolveFile(path) {
  const file = resolve(dist, '.' + path);
  if (file !== dist && !file.startsWith(dist + sep)) return null;
  const info = await stat(file).catch(() => null);
  if (info?.isFile()) return file;
  const index = join(file, 'index.html');
  return (await stat(index).catch(() => null))?.isFile() ? index : null;
}

createServer(async (req, res) => {
  let path;
  try {
    path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400);
    return res.end();
  }
  for (const rule of headerRules) {
    if (rule.re.test(path)) for (const { key, value } of rule.headers) res.setHeader(key, value);
  }
  const redirect = redirects.find((r) => r.re.test(path));
  if (redirect) {
    res.writeHead(redirect.permanent ? 308 : 307, { location: redirect.destination });
    return res.end();
  }
  // Exercise the same native Writing handler as Vercel, not only its static fallback.
  if (path === '/blog' || path === '/blog/') {
    const { default: writing } = await import(pathToFileURL(join(dist, '..', 'api/writing.js')).href);
    return writing(req, res);
  }
  const file = await resolveFile(path);
  const served = file ?? join(dist, '404.html');
  const body = await readFile(served);
  // A Content-Type from vercel.json, such as the api-catalog linkset, wins.
  if (!res.hasHeader('content-type')) res.setHeader('content-type', TYPES[extname(served)] ?? 'application/octet-stream');
  res.writeHead(file ? 200 : 404);
  res.end(req.method === 'HEAD' ? undefined : body);
}).listen(port, '127.0.0.1', () => console.log(`SERVING ${dist} on http://127.0.0.1:${port}`));
