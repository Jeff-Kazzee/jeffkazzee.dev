/**
 * The answers behind every machine interface.
 *
 * MCP tool calls, A2A messages, and the in-page WebMCP tools all resolve
 * through this file, so an agent gets the same answer whichever door it came
 * through. Nothing here touches HTTP directly: the caller passes an `origin`
 * and the functions fetch site documents from it.
 *
 * The useful thing this site can give an agent is the free guide libraries.
 * Lead with those.
 */

import { availability } from '../data/agent-surface.mjs';
import { libraries, totalItems } from '../data/libraries.mjs';

/** Cache the content index for the life of the isolate. */
let contentCache = null;

async function loadContent(origin) {
  if (contentCache) return contentCache;

  const response = await fetch(new URL('/api/content.json', origin));
  if (!response.ok) throw new Error(`content index unavailable (${response.status})`);

  contentCache = await response.json();
  return contentCache;
}

/** Site path to the path of its Markdown twin. */
export function twinPath(pathname) {
  if (pathname === '/' || pathname === '') return '/index.md';
  return `${pathname.replace(/\/+$/, '')}.md`;
}

const bullet = (lines) => lines.filter(Boolean).join('\n');

/* ---------- tools ---------- */

function listGuideLibraries() {
  return bullet([
    `${totalItems.toLocaleString('en-US')} free guides and recipes for building real systems on Zo Computer.`,
    'No email gate. Every library is public and readable in full.',
    '',
    ...libraries.map((library) =>
      bullet([
        `## ${library.name} (${library.count})`,
        library.summary,
        `Read it: ${library.url}`,
        library.examples.length ? `For example: ${library.examples.join('; ')}` : '',
        `Count verified ${library.verified}.`,
        '',
      ]),
    ),
  ]);
}

async function listProjects({ tag, status } = {}, origin) {
  const { projects } = await loadContent(origin);

  const matching = projects.filter(
    (project) =>
      !project.archived &&
      (!tag || project.tags.includes(tag)) &&
      (!status || project.status === status),
  );

  if (matching.length === 0) return 'No projects match that filter.';

  return matching
    .map((project) => {
      const links = [project.repoUrl, project.liveUrl, project.releaseUrl].filter(Boolean).join(' ');
      return bullet([
        `## ${project.title} (${project.status})`,
        project.description,
        project.stack.length ? `Stack: ${project.stack.join(', ')}` : '',
        `Page: ${project.url}`,
        links ? `Links: ${links}` : '',
      ]);
    })
    .join('\n\n');
}

async function listWriting(_args, origin) {
  const { posts } = await loadContent(origin);

  return posts
    .map((post) => `- ${post.pubDate} ${post.title}\n  ${post.description}\n  ${post.url}`)
    .join('\n');
}

async function readPage({ path }, origin) {
  const requested = String(path ?? '/');
  if (!requested.startsWith('/')) return 'Path must begin with a slash, for example /projects/.';

  const response = await fetch(new URL(twinPath(requested), origin));
  if (!response.ok) return `No page at ${requested} (${response.status}).`;

  return response.text();
}

function contactDetails() {
  return bullet([
    'Open to:',
    ...availability.openTo.map((item) => `- ${item}`),
    '',
    'Contact:',
    ...availability.contact.map((item) => `- ${item.label}: ${item.href}`),
  ]);
}

/** @type {Record<string, (args: object, origin: string) => string | Promise<string>>} */
const handlers = {
  list_guide_libraries: listGuideLibraries,
  list_projects: listProjects,
  list_writing: listWriting,
  read_page: readPage,
  contact_details: contactDetails,
};

/** Run a tool and return its text. Throws only on a genuine failure. */
export async function runTool(name, args, origin) {
  if (!Object.hasOwn(handlers, name)) throw new Error(`Unknown tool: ${name}`);
  return handlers[name](args ?? {}, origin);
}

/**
 * Route a free-text question to the closest tool. Used by the A2A endpoint,
 * which receives sentences rather than tool calls.
 */
export async function answerQuestion(question, origin) {
  const text = String(question ?? '').toLowerCase();
  const asks = (...terms) => terms.some((term) => text.includes(term));

  if (asks('contact', 'hire', 'hiring', 'available', 'availability', 'reach', 'email', 'rate')) {
    return contactDetails();
  }

  if (asks('guide', 'tutorial', 'learn', 'how do i', 'how to', 'recipe', 'zo computer', 'deep dive')) {
    return listGuideLibraries();
  }

  if (asks('write', 'writing', 'blog', 'essay', 'post', 'article')) {
    return listWriting({}, origin);
  }

  if (asks('project', 'shipped', 'built', 'repo', 'portfolio', 'game', 'arcade', 'open source')) {
    return listProjects({}, origin);
  }

  return bullet([
    'I answer questions about the free guide libraries, the projects, the writing, and availability.',
    '',
    listGuideLibraries(),
    '',
    'Full index: https://jeffkazzee.dev/llms-full.txt',
  ]);
}
