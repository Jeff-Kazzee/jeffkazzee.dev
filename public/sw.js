/*
 * jeffkazzee.dev service worker.
 *
 * What it does:
 *   - Pages: network first. A fresh copy always wins when the network answers
 *     within 3 seconds. The copy is kept, so a reader who loses signal can still
 *     open any page they have seen. With nothing kept, they get /offline/.
 *   - /_astro/ files: cache first. Their names carry a content hash, so a
 *     cached copy can never be stale.
 *   - On install it quietly keeps the main pages, so they open offline too.
 *
 * What it never touches: anything that is not a GET to this origin, the agent
 * surface (/api/, /.well-known/), and raw files (.md, .txt, .json, .xml).
 * Markdown negotiation and the MCP and A2A endpoints always go to the network.
 *
 * To retire it: replace this file with one that calls
 * self.registration.unregister() and deletes its caches, then deploy.
 * Bump VERSION whenever the caching logic changes.
 */

const VERSION = 'v2';
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;

const PRECACHE = ['/', '/projects/', '/blog/', '/for-agents/', '/work-with-me/', '/offline/'];
const PAGE_LIMIT = 40;
const ASSET_LIMIT = 80;
const NETWORK_TIMEOUT_MS = 3000;

const SKIP = [/^\/api\//, /^\/\.well-known\//, /\.(md|txt|json|xml)$/];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined) // a failed precache must never block the worker
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== PAGES && k !== ASSETS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (SKIP.some((re) => re.test(url.pathname))) return;

  if (request.mode === 'navigate') {
    event.respondWith(page(request, event));
    return;
  }

  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(asset(request, event));
  }
});

async function page(request, event) {
  const cache = await caches.open(PAGES);
  try {
    const response = await withTimeout(fetch(request), NETWORK_TIMEOUT_MS);
    const type = response.headers.get('content-type') || '';
    if (response.ok && !response.redirected && type.includes('text/html')) {
      event.waitUntil(cache.put(request, response.clone()).then(() => trim(PAGES, PAGE_LIMIT)));
    }
    return response;
  } catch {
    // ignoreVary: the server sends "Vary: Accept" for Markdown negotiation,
    // and a saved page was fetched with a different Accept header than a
    // browser navigation sends. Only HTML pages are in this cache.
    return (
      (await cache.match(request, { ignoreSearch: true, ignoreVary: true })) ||
      (await cache.match('/offline/', { ignoreVary: true })) ||
      new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain' } })
    );
  }
}

async function asset(request, event) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) {
    event.waitUntil(cache.put(request, response.clone()).then(() => trim(ASSETS, ASSET_LIMIT)));
  }
  return response;
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function trim(name, limit) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - limit))) await cache.delete(key);
}
