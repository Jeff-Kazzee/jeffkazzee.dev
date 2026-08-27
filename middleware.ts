import { next } from '@vercel/functions';

import { A2A_ENDPOINT, MCP_ENDPOINT } from './src/data/agent-surface.mjs';
import { twinPath } from './src/lib/agent-answers.mjs';
import { handleA2a } from './src/lib/a2a-server.mjs';
import { handleMcp } from './src/lib/mcp-server.mjs';

/**
 * The runtime half of the site.
 *
 * The static build produces the pages, the Markdown twins, and the well-known
 * documents. This handles the three things a static file cannot: content
 * negotiation on Accept, the MCP endpoint, and the A2A endpoint.
 *
 * Link and security headers live in vercel.json instead, so they survive even
 * if this function fails to deploy.
 */

export const config = {
  // Skip hashed assets, images, and anything already in a machine format.
  // Excluding .md matters: the Markdown twin is fetched from inside this
  // function, and a matched twin would re-enter negotiation.
  matcher: [
    '/((?!_astro|images/|favicon|.*\\.(?:md|json|txt|xml|svg|png|jpg|jpeg|avif|webp|ico|css|js|map)$).*)',
  ],
};

/** Rough token estimate. Four characters per token is close enough to be useful. */
const estimateTokens = (text: string) => Math.ceil(text.length / 4);

/**
 * True only when the caller asked for Markdown and did not also ask for HTML.
 * Browsers send long Accept lists that include text/html, and they must keep
 * getting HTML.
 */
function wantsMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const value = accept.toLowerCase();
  return value.includes('text/markdown') && !value.includes('text/html');
}

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === MCP_ENDPOINT) return handleMcp(request, url.origin);
  if (url.pathname === A2A_ENDPOINT) return handleA2a(request, url.origin);

  if (request.method === 'GET' && wantsMarkdown(request.headers.get('accept'))) {
    const twin = await fetch(new URL(twinPath(url.pathname), url.origin));

    if (twin.ok) {
      const body = await twin.text();

      return new Response(body, {
        status: 200,
        headers: {
          'content-type': 'text/markdown; charset=utf-8',
          'x-markdown-tokens': String(estimateTokens(body)),
          'cache-control': 'public, max-age=0, must-revalidate',
          vary: 'Accept',
        },
      });
    }
    // No twin for this path. Fall through and serve the HTML.
  }

  return next();
}
