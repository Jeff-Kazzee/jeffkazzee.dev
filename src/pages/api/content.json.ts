import type { APIRoute } from 'astro';

import { SITE } from '../../data/agent-surface.mjs';
import { getPosts, getProjects, libraryIndex } from '../../lib/content-index';

/**
 * A static snapshot of everything on this site, in one document.
 *
 * The middleware reads this to answer MCP and A2A calls, and it is listed in
 * the API catalog so an agent can skip the tool layer and take the whole index
 * in a single request.
 */
export const GET: APIRoute = async () => {
  const body = {
    site: SITE,
    owner: 'Jeff Kazzee',
    describes: 'Free guide libraries, projects, and writing published at jeffkazzee.dev',
    guides: libraryIndex(),
    projects: await getProjects(),
    posts: await getPosts(),
  };

  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
