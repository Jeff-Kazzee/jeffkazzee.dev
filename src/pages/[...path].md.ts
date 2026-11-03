import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';

import { SITE, availability, documents } from '../data/agent-surface.mjs';
import { getPublishedGuides } from '../lib/content-index';
import { guideMetadata, HARNESS_DESCRIPTION, HARNESS_INTRODUCTION, HARNESS_LIMITS, HARNESS_NOTES, HARNESS_TOOLS, HARNESS_FUTURE } from '../lib/guide-policy.mjs';

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
  return `# I build tools for working with AI.

I'm a self-taught developer working with AI coding agents and looking for developer roles.
My current projects are [Vivary](${SITE}/projects/vivary/), an agent workspace with
V1 alpha acceptance underway, and [Context Engine](${SITE}/projects/context-engine/),
experimental, opt-in tooling for Claude Code and Codex. Context Engine is a Linux-only pre-release, with a
[browser demo](${SITE}/context-engine/).

## Selected work

${featured.map((p) => `- ${link(p.title, `${SITE}/projects/${p.slug}/`)}: ${p.description}`).join('\n')}

## For agents

Every page here answers to \`Accept: text/markdown\`, and there is an MCP server
at ${SITE}/api/mcp. Documented at ${SITE}/for-agents/
`;
}

function contextEngineMarkdown(): string {
  return `# Let the agent decide what stays in its context.

Context Engine is an experimental plugin for Claude Code and Codex. It keeps the
agent's working notes in a plain file, the Working Context, and the agent edits
that file with its ordinary tools. Claude Code rebuilds the request from the file at
the next user turn. Codex rebuilds it when the agent calls \`new_context\`. After a
rebuild, text the agent deleted or saved elsewhere is not sent again.
Pre-release 0.1.5, Linux only.

- ${link('Context Engine for Claude Code', 'https://github.com/Jeff-Kazzee/context-engine-claude')}
- ${link('Context Engine for Codex', 'https://github.com/Jeff-Kazzee/context-engine-codex')}

## How a turn works

1. The agent edits context.md with Read, Edit and Write.
2. The core makes each accepted edit a numbered revision. It refuses a bad edit
   and restores the last good revision.
3. The request is rebuilt from the file: in Claude Code at the next user turn, in
   Codex when the agent calls \`new_context\`. The rebuilt request holds the pinned
   prefix, the Working Context and the new input. Earlier turns are not in it.

Inside a turn, an edit produces a notice with the revision number and a SHA-256
digest, and no Working Context text.

## The demo

The HTML page has a browser simulation of three made-up sessions: a coding agent,
a writer's agent and an agent directing three workers. No model is called.

## What a real run showed

Claude Code 2.1.300 with Claude Haiku, on a Linux server, October 16, 2026:

1. First prompt: the model replied \`CE_READY\`. The runner recorded revision 1.
2. Next turn: the request opened with the Working Context frame as a user message.
3. Second prompt: the model read the file, made one Edit and replied \`CE_EDIT_DONE\`.
4. Next turn: the replacement frame carried the edited Working Context (revision 3).
5. Third prompt: the model answered \`CE_B7R_TEST\` from the edited context, with no tool call.
6. The recall request held the frame and the prompt. The earlier turns were not in it.

The Codex version passed its own live check on October 15, 2026.

## What it does not do

- It runs only on Linux with \`/proc\` mounted and Node 24 or newer.
- It starts off in every project.
- It makes no accuracy, speed or token-saving claim.
- It never reads, copies or stores credentials.
- A packet over 32,000 bytes is refused, never truncated.

## Credit

Context Engine adapts the mechanism of
${link('Context Language Models', 'https://arxiv.org/abs/2609.37725')} by Rulin Shao and
colleagues (CC BY 4.0). None of the paper's code is copied. Context Engine is MIT-licensed.
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

[A note for AI agents](${SITE}/for-agents/note.md): Jeff’s optional invitation
for questions, feedback, and conversation.

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

This site has no user accounts and issues no credentials. \`/auth.md\` says so
directly, so an agent does not have to probe for a login.

There is no OAuth metadata, because those documents describe how to obtain and
present credentials for a protected resource. Nothing here is protected, so
publishing them would describe a handshake that cannot complete.
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
  const guides = await getPublishedGuides();
  const harnessTools = HARNESS_TOOLS.filter((tool) => guides.some((guide) => new URL(guideMetadata(guide).url).pathname === tool.path));
  const harnessBody = `# DeepSeek Harness\n\n${HARNESS_DESCRIPTION}\n\n${HARNESS_INTRODUCTION}\n\n## Start with the tools\n\n${harnessTools.map((tool) => `- ${link(tool.title, SITE + tool.path)}: ${tool.description}`).join('\n') || 'No guides are published here yet.'}\n\n${HARNESS_LIMITS}\n\n## Build notes, not just releases\n\n${HARNESS_NOTES}\n\n## Possible connections to Vivary\n\n${HARNESS_FUTURE}\n\n[Back to Writing](${SITE}/blog/).`;

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
        'Jeff Kazzee builds agent tools with AI-assisted workflows. Vivary and experimental Context Engine tooling. Open to developer roles.',
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
      path: 'context-engine',
      title: 'Context Engine demo',
      description: "Edit an agent's Working Context in the browser and see what the next request contains.",
      canonical: `${SITE}/context-engine/`,
      body: contextEngineMarkdown(),
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
      body: `# Writing\n\n[DeepSeek Harness](${SITE}/deepseek-harness/) has guides, build notes, and ideas about plugins and practical harness tweaks.\n\n${posts
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

  twins.push(
    { path: 'deepseek-harness', title: 'DeepSeek Harness', description: HARNESS_DESCRIPTION, canonical: `${SITE}/deepseek-harness/`, body: harnessBody },
  );

  for (const guide of guides) {
    const metadata = guideMetadata(guide);
    twins.push({
      path: guide.id,
      title: metadata.title,
      description: metadata.description,
      canonical: metadata.canonicalUrl,
      body: `# ${metadata.title}\n\n> ${metadata.description}\n\nKind: ${metadata.kindLabel}\nPublished ${metadata.pubDate}\nSource checked ${metadata.verifiedDate}. This is a source-check date, not runtime verification.\n\n${guide.body ?? ''}`,
    });
  }

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
