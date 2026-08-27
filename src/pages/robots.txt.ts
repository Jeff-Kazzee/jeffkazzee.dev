import type { APIRoute } from 'astro';

import { SITE, contentSignals } from '../data/agent-surface.mjs';

const signals = Object.entries(contentSignals)
  .map(([key, value]) => `${key}=${value}`)
  .join(', ');

/**
 * Crawl rules, Content Signals, and the ARD Agentmap pointer.
 *
 * The Content-Signal directive has to sit inside the User-agent block it
 * applies to. Above the first User-agent line it belongs to nothing.
 */
export const GET: APIRoute = () =>
  new Response(
    `# jeffkazzee.dev
# Agents are welcome. Machine-readable entry points: ${SITE}/llms.txt
# Full interface documentation: ${SITE}/for-agents/

User-agent: *
Allow: /
Content-Signal: ${signals}

Sitemap: ${SITE}/sitemap-index.xml
Agentmap: ${SITE}/.well-known/ard.json
`,
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
