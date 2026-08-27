/**
 * Writes the well-known discovery documents into public/.
 *
 * Runs before `astro build`. Everything it writes is derived from
 * src/data/agent-surface.mjs and src/data/libraries.mjs, so the advertised
 * surface and the declared surface stay in step.
 *
 * Content-derived documents (robots.txt, llms.txt, the Markdown twins) are
 * Astro endpoints instead, because those need the content collections.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  A2A_ENDPOINT,
  LINK_HEADERS,
  A2A_PROTOCOL_VERSION,
  MCP_ENDPOINT,
  MCP_PROTOCOL_VERSION,
  OWNER,
  SITE,
  SURFACE_VERSION,
  a2aSkills,
  documents,
  tools,
} from '../src/data/agent-surface.mjs';
import { libraries, totalItems } from '../src/data/libraries.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wellKnown = join(root, 'public', '.well-known');

const abs = (path) => new URL(path, SITE).href;

async function writeJson(relativePath, value) {
  const target = join(wellKnown, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return relativePath;
}

/* ---------- RFC 9727 API catalog ---------- */

async function apiCatalog() {
  const linkset = [
    {
      anchor: abs(MCP_ENDPOINT),
      'service-desc': [
        { href: abs('/.well-known/mcp/server-card.json'), type: 'application/json' },
      ],
      'service-doc': [{ href: abs('/for-agents/'), type: 'text/html' }],
    },
    {
      anchor: abs(A2A_ENDPOINT),
      'service-desc': [{ href: abs('/.well-known/agent-card.json'), type: 'application/json' }],
      'service-doc': [{ href: abs('/for-agents/'), type: 'text/html' }],
    },
    {
      anchor: abs('/api/content.json'),
      'service-doc': [{ href: abs('/llms-full.txt'), type: 'text/plain' }],
      describedby: [{ href: abs('/.well-known/ard.json'), type: 'application/json' }],
    },
  ];

  // The catalog is served without a file extension, so the content type comes
  // from vercel.json rather than from the filename.
  const target = join(wellKnown, 'api-catalog');
  await mkdir(wellKnown, { recursive: true });
  await writeFile(target, `${JSON.stringify({ linkset }, null, 2)}\n`, 'utf8');
  return '.well-known/api-catalog';
}

/* ---------- MCP server card ---------- */

const mcpServerCard = () =>
  writeJson('mcp/server-card.json', {
    serverInfo: { name: 'jeffkazzee.dev', version: SURFACE_VERSION },
    description:
      `Find free guides for building real systems on a computer you own (${totalItems.toLocaleString('en-US')} across three libraries), plus Jeff Kazzee's projects and writing. Every page is readable as Markdown through the read_page tool.`,
    url: abs(MCP_ENDPOINT),
    transport: { type: 'streamable-http' },
    protocolVersion: MCP_PROTOCOL_VERSION,
    capabilities: { tools: true },
    tools: tools.map(({ name, title, description }) => ({ name, title, description })),
    websiteUrl: SITE,
  });

/* ---------- A2A agent card ---------- */

const a2aAgentCard = () =>
  writeJson('agent-card.json', {
    name: `${OWNER} portfolio agent`,
    description:
      "Points people at the right free guide from Jeff Kazzee's published libraries, summarizes the projects and writing at jeffkazzee.dev, and reports what he is open to.",
    supportedInterfaces: [
      {
        url: abs(A2A_ENDPOINT),
        protocolBinding: 'JSONRPC',
        protocolVersion: A2A_PROTOCOL_VERSION,
      },
    ],
    provider: { organization: OWNER, url: SITE },
    version: SURFACE_VERSION,
    documentationUrl: abs('/for-agents/'),
    iconUrl: abs('/favicon.svg'),
    capabilities: { streaming: false, pushNotifications: false, extendedAgentCard: false },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'text/markdown'],
    skills: a2aSkills,
  });

/* ---------- Agent Skills discovery 0.2.0 ---------- */

async function agentSkillsIndex() {
  const skillsDir = join(wellKnown, 'agent-skills');
  const entries = await readdir(skillsDir, { withFileTypes: true });
  const skills = [];

  for (const entry of entries.filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(skillsDir, entry.name, 'SKILL.md');
    const body = await readFile(path, 'utf8');
    const description = /^description:\s*(.+)$/m.exec(body)?.[1]?.trim().replace(/^["']|["']$/g, '');

    if (!description) {
      throw new Error(`${entry.name}/SKILL.md has no description in its front matter`);
    }

    skills.push({
      name: entry.name,
      type: 'skill-md',
      description,
      url: `/.well-known/agent-skills/${entry.name}/SKILL.md`,
      digest: `sha256:${createHash('sha256').update(body).digest('hex')}`,
    });
  }

  if (skills.length === 0) throw new Error('No skills found under public/.well-known/agent-skills');

  return writeJson('agent-skills/index.json', {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills,
  });
}

/* ---------- Agentic Resource Discovery ---------- */

function ardEntries() {
  const entry = (id, displayName, type, url, representativeQueries, extra = {}) => ({
    identifier: `urn:air:jeffkazzee.dev:${id}`,
    displayName,
    type,
    url,
    representativeQueries,
    ...extra,
  });

  return [
    entry(
      'server:mcp',
      'jeffkazzee.dev MCP server',
      'application/mcp-server-card+json',
      abs('/.well-known/mcp/server-card.json'),
      [
        'find me a free guide for automating invoice follow-ups',
        'how do I build a personal chief of staff on my own server',
        'what has Jeff Kazzee built with AI agents',
      ],
      { capabilities: tools.map((tool) => tool.name), tags: ['guides', 'agents', 'portfolio'] },
    ),
    entry(
      'agent:a2a',
      'jeffkazzee.dev portfolio agent',
      'application/a2a-agent-card+json',
      abs('/.well-known/agent-card.json'),
      [
        'is Jeff Kazzee available for teaching or contract work',
        'summarize what Jeff Kazzee has shipped',
      ],
      { capabilities: a2aSkills.map((skill) => skill.id), tags: ['agents', 'hiring', 'portfolio'] },
    ),
    entry(
      'data:content',
      'Projects and writing index',
      'application/json',
      abs('/api/content.json'),
      ['list the projects on jeffkazzee.dev', 'what has Jeff Kazzee written about AI agents'],
      { tags: ['portfolio', 'index'] },
    ),
    ...libraries.map((library) =>
      entry(
        `library:${library.id}`,
        library.name,
        'text/html',
        library.url,
        [
          `free guides for building systems on Zo Computer`,
          `${library.name}: ${library.count}`,
        ],
        { tags: ['guides', 'how-to', 'zo computer'], description: library.summary },
      ),
    ),
  ];
}

async function ardCatalog() {
  const manifest = {
    '@context': 'https://agenticresourcediscovery.org/context/v1',
    // Required by the manifest envelope, and matches the v1 context above.
    specVersion: '1.0',
    version: SURFACE_VERSION,
    publisher: { name: OWNER, url: SITE },
    entries: ardEntries(),
  };

  // ard.json is the current path; ai-catalog.json is the predecessor and is
  // still what several scanners probe, so both are published.
  await writeJson('ard.json', manifest);
  await writeJson('ai-catalog.json', manifest);
  return '.well-known/ard.json + ai-catalog.json';
}

/* ---------- run ---------- */

const written = [
  await apiCatalog(),
  await mcpServerCard(),
  await a2aAgentCard(),
  await agentSkillsIndex(),
  await ardCatalog(),
];

console.log(`agent surface: wrote ${written.length} documents`);
for (const path of written) console.log(`  ${path}`);
console.log(`  (${documents.length} surface documents declared, ${tools.length} MCP tools)`);

/* ---------- drift check ---------- */

/**
 * vercel.json is read by the platform before the build runs, so it cannot be
 * generated. Instead, fail the build when its Link header stops matching the
 * declared surface.
 */
const vercelConfig = JSON.parse(await readFile(join(root, 'vercel.json'), 'utf8'));
const linkHeader = vercelConfig.headers
  ?.find((rule) => rule.source === '/(.*)')
  ?.headers?.find((header) => header.key === 'Link')?.value;

const expectedLink = LINK_HEADERS.map(
  ({ href, rel, type }) => `<${href}>; rel="${rel}"${type ? `; type="${type}"` : ''}`,
).join(', ');

if (linkHeader !== expectedLink) {
  throw new Error(
    `vercel.json Link header does not match LINK_HEADERS in src/data/agent-surface.mjs.\n\nExpected:\n${expectedLink}\n\nFound:\n${linkHeader}\n`,
  );
}

console.log('  vercel.json Link header matches the declared surface');
