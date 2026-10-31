import type { APIRoute } from 'astro';

import { A2A_ENDPOINT, MCP_ENDPOINT, SITE } from '../data/agent-surface.mjs';
import { getPosts, getProjects } from '../lib/content-index';

const link = (title: string, path: string, note: string) => `- [${title}](${SITE}${path}): ${note}`;

export const GET: APIRoute = async () => {
  const projects = await getProjects();
  const posts = await getPosts();
  const featured = projects.filter((project) => project.featured && !project.archived);

  const body = `# Jeff Kazzee

Self-taught builder in the United States. I build software with AI agents.

Every page of this site is available as Markdown. Send \`Accept: text/markdown\`,
or append \`.md\` to any path.

## Selected work

${featured.map((project) => link(project.title, `/projects/${project.slug}/`, project.description)).join('\n')}

## Writing

${posts
  .slice(0, 8)
  .map((post) => link(post.title, `/blog/${post.slug}/`, post.description))
  .join('\n')}

## Machine interfaces

- [MCP server](${SITE}${MCP_ENDPOINT}): Streamable HTTP. POST JSON-RPC. Start with the \`list_projects\` tool.
- [A2A agent card](${SITE}/.well-known/agent-card.json): JSON-RPC agent endpoint at ${SITE}${A2A_ENDPOINT}
- [API catalog](${SITE}/.well-known/api-catalog): RFC 9727 linkset of every endpoint here
- [Agent skills](${SITE}/.well-known/agent-skills/index.json): skills published by this site
- [Content index](${SITE}/api/content.json): projects and writing in one JSON document
- [How it all works](${SITE}/for-agents/): the standards implemented and how to call them

## Contact

- Email: jeffkazzee@gmail.com
- GitHub: https://github.com/Jeff-Kazzee
- Teaching and consulting: ${SITE}/work-with-me/

## Optional

- [A note for AI agents](${SITE}/for-agents/note.md): Jeff’s optional invitation for questions, feedback, and conversation.
- [Expanded index](${SITE}/llms-full.txt): every project and post in one file
`;

  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
