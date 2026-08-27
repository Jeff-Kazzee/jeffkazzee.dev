import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';

import { SITE, availability, documents } from '../data/agent-surface.mjs';
import { libraries, totalItems } from '../data/libraries.mjs';

/**
 * A Markdown twin for every page.
 *
 * Built from the same content the HTML renders, never scraped back out of the
 * HTML. The middleware serves these when a request carries
 * `Accept: text/markdown`, and they are reachable directly by appending `.md`
 * to any path.
 */

type Twin = { path: string; title: string; description: string; canonical: string; body: string };

const frontMatter = (twin: Twin) =>
  `---
title: ${JSON.stringify(twin.title)}
description: ${JSON.stringify(twin.description)}
url: ${twin.canonical}
---

${twin.body.trim()}
`;

const link = (label: string, href: string) => `[${label}](${href})`;

function homeMarkdown(featured: { title: string; slug: string; description: string }[]): string {
  return `# I give away the guides, and build the things I'm learning on.

Field manuals for building real systems on a computer you own, an arcade where
AI agents wrote every line, and a few open tools. Self-taught, still learning in
public.

## Free guides

${totalItems.toLocaleString('en-US')} guides and recipes. No email gate, no upsell.

${libraries.map((l) => `- ${link(l.name, l.url)} (${l.count}): ${l.summary}`).join('\n')}

## Selected work

${featured.map((p) => `- ${link(p.title, `${SITE}/projects/${p.slug}/`)}: ${p.description}`).join('\n')}

## For agents

Every page here answers to \`Accept: text/markdown\`, and there is an MCP server
at ${SITE}/api/mcp. Documented at ${SITE}/for-agents/
`;
}

function forAgentsMarkdown(): string {
  const group = (name: string) =>
    documents
      .filter((doc) => doc.group === name)
      .map((doc) => `- ${link(doc.path, SITE + doc.path)} (${doc.spec}): ${doc.description}`)
      .join('\n');

  return `# For agents

Everything this site publishes for machine consumers, and how to call it.

The most useful thing here is the guide libraries: ${totalItems.toLocaleString('en-US')} free
guides and recipes. The \`list_guide_libraries\` tool returns them.

## Interfaces

${group('interface')}

## Discovery

${group('discovery')}

## Content

${group('content')}

## Policy

${group('policy')}

## Markdown for any page

Send \`Accept: text/markdown\` to any URL on this domain, or append \`.md\` to the
path. Responses carry \`Content-Type: text/markdown\` and an estimated
\`X-Markdown-Tokens\` count.

## Calling the MCP server

\`\`\`bash
curl -sX POST ${SITE}/api/mcp \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
\`\`\`

## What is deliberately not published

This site has no user accounts and issues no credentials, so it publishes no
\`auth.md\` and no OAuth metadata. Publishing a registration protocol for
registration that does not exist would send agents into a flow that cannot
complete.
`;
}

function contactMarkdown(): string {
  return `# Work with me

## Open to

${availability.openTo.map((item) => `- ${item}`).join('\n')}

## Contact

${availability.contact.map((item) => `- ${link(item.label, item.href)}`).join('\n')}
`;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const projects = await getCollection('projects');
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  const featured = projects
    .filter((project) => project.data.featured && !project.data.archived)
    .sort((a, b) => a.data.order - b.data.order)
    .map((project) => ({
      title: project.data.title,
      slug: project.id,
      description: project.data.description,
    }));

  const twins: Twin[] = [
    {
      path: 'index',
      title: 'Jeff Kazzee',
      description:
        'Free guides for building real systems on a computer you own, an arcade where AI agents wrote every line, and a few open tools.',
      canonical: `${SITE}/`,
      body: homeMarkdown(featured),
    },
    {
      path: 'for-agents',
      title: 'For agents',
      description: 'Every machine-readable interface this site publishes, and how to call it.',
      canonical: `${SITE}/for-agents/`,
      body: forAgentsMarkdown(),
    },
    {
      path: 'work-with-me',
      title: 'Work with me',
      description: 'What Jeff Kazzee is open to and how to make contact.',
      canonical: `${SITE}/work-with-me/`,
      body: contactMarkdown(),
    },
    {
      path: 'projects',
      title: 'Projects',
      description: 'Everything published, with status and links.',
      canonical: `${SITE}/projects/`,
      body: `# Projects\n\n${projects
        .sort((a, b) => a.data.order - b.data.order)
        .map(
          (project) =>
            `- ${link(project.data.title, `${SITE}/projects/${project.id}/`)} (${project.data.status})${
              project.data.archived ? ' [archived]' : ''
            }: ${project.data.description}`,
        )
        .join('\n')}\n`,
    },
    {
      path: 'blog',
      title: 'Writing',
      description: 'Essays and field notes on AI-assisted building.',
      canonical: `${SITE}/blog/`,
      body: `# Writing\n\n${posts
        .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
        .map(
          (post) =>
            `- ${link(post.data.title, `${SITE}/blog/${post.id}/`)} (${post.data.pubDate
              .toISOString()
              .slice(0, 10)}): ${post.data.description}`,
        )
        .join('\n')}\n`,
    },
  ];

  for (const project of projects) {
    twins.push({
      path: `projects/${project.id}`,
      title: project.data.title,
      description: project.data.description,
      canonical: `${SITE}/projects/${project.id}/`,
      body: `# ${project.data.title}

> ${project.data.description}

- Status: ${project.data.status}
${project.data.stack.length ? `- Stack: ${project.data.stack.join(', ')}\n` : ''}${
        project.data.repoUrl ? `- Source: ${project.data.repoUrl}\n` : ''
      }${project.data.liveUrl ? `- Live: ${project.data.liveUrl}\n` : ''}${
        project.data.releaseUrl ? `- Download: ${project.data.releaseUrl}\n` : ''
      }
${project.body ?? ''}`,
    });
  }

  for (const post of posts) {
    twins.push({
      path: `blog/${post.id}`,
      title: post.data.title,
      description: post.data.description,
      canonical: post.data.canonicalUrl ?? `${SITE}/blog/${post.id}/`,
      body: `# ${post.data.title}

> ${post.data.description}

Published ${post.data.pubDate.toISOString().slice(0, 10)}${
        post.data.canonicalUrl ? `. Originally at ${post.data.canonicalUrl}` : ''
      }

${post.body ?? ''}`,
    });
  }

  return twins.map((twin) => ({ params: { path: twin.path }, props: { twin } }));
};

export const GET: APIRoute = ({ props }) =>
  new Response(frontMatter(props.twin as Twin), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
