/**
 * The machine-readable surface of jeffkazzee.dev.
 *
 * Everything an agent can discover about this site is declared here once:
 * the Link header set, the well-known documents, the MCP tools, and the A2A
 * skills. The build script writes the static documents from this file and the
 * middleware serves the headers from it, so the advertised surface and the
 * real surface cannot drift apart.
 */

export const SITE = 'https://jeffkazzee.dev';
export const OWNER = 'Jeff Kazzee';

/** Bumped when the machine surface changes shape, not on every content edit. */
export const SURFACE_VERSION = '1.0.0';

/** MCP protocol revision this server implements. */
export const MCP_PROTOCOL_VERSION = '2026-07-28';

/**
 * Earlier revisions that used an `initialize` handshake. The server answers
 * these too, because most deployed clients still open with `initialize`.
 */
export const MCP_LEGACY_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'];

export const A2A_PROTOCOL_VERSION = '1.0';

export const MCP_ENDPOINT = '/api/mcp';
export const A2A_ENDPOINT = '/api/a2a';

/**
 * Link response headers, per RFC 8288. Served on every HTML and Markdown
 * response by the middleware.
 *
 * @type {{ href: string, rel: string, type?: string }[]}
 */
export const LINK_HEADERS = [
  { href: '/.well-known/api-catalog', rel: 'api-catalog', type: 'application/linkset+json' },
  { href: '/.well-known/mcp/server-card.json', rel: 'service-desc', type: 'application/json' },
  { href: '/.well-known/agent-skills/index.json', rel: 'describedby', type: 'application/json' },
  { href: '/for-agents/', rel: 'service-doc', type: 'text/html' },
  { href: '/llms.txt', rel: 'service-doc', type: 'text/plain' },
];

/**
 * The documents an agent can fetch. This list is rendered on /for-agents/ and
 * drives the ARD catalog, so a document added here shows up in both.
 *
 * @typedef {object} SurfaceDoc
 * @property {string} path
 * @property {string} title
 * @property {string} description
 * @property {string} contentType
 * @property {string} spec        Human name of the standard it implements.
 * @property {string} specUrl
 * @property {'discovery' | 'content' | 'policy' | 'interface'} group
 *
 * @type {SurfaceDoc[]}
 */
export const documents = [
  {
    path: '/robots.txt',
    title: 'Crawl rules and content signals',
    description:
      'Standard crawl directives plus Content-Signal preferences for ai-train, search, and ai-input, and an Agentmap pointer to the ARD catalog.',
    contentType: 'text/plain',
    spec: 'RFC 9309 and Content Signals',
    specUrl: 'https://contentsignals.org/',
    group: 'policy',
  },
  {
    path: '/llms.txt',
    title: 'Site overview for language models',
    description: 'What this site is, what is on it, and where the machine interfaces live.',
    contentType: 'text/plain',
    spec: 'llmstxt.org',
    specUrl: 'https://llmstxt.org/',
    group: 'content',
  },
  {
    path: '/llms-full.txt',
    title: 'Expanded overview',
    description: 'Every guide library, project, and post, in one file.',
    contentType: 'text/plain',
    spec: 'llmstxt.org',
    specUrl: 'https://llmstxt.org/',
    group: 'content',
  },
  {
    path: '/auth.md',
    title: 'Authentication',
    description:
      'States that nothing here is behind a credential, and explains why no OAuth metadata is published. Read it instead of probing for a login.',
    contentType: 'text/markdown',
    spec: 'auth.md',
    specUrl: 'https://auth-md.com/',
    group: 'policy',
  },
  {
    path: '/.well-known/api-catalog',
    title: 'API catalog',
    description: 'A linkset naming every service endpoint on this domain and the document that describes it.',
    contentType: 'application/linkset+json',
    spec: 'RFC 9727',
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9727',
    group: 'discovery',
  },
  {
    path: '/.well-known/mcp/server-card.json',
    title: 'MCP server card',
    description: 'Where the MCP endpoint is, which transport it speaks, and what it can do.',
    contentType: 'application/json',
    spec: 'Model Context Protocol',
    specUrl: 'https://modelcontextprotocol.io/',
    group: 'discovery',
  },
  {
    path: '/.well-known/agent-card.json',
    title: 'A2A agent card',
    description: 'The agent identity for this site, its interfaces, and the skills it answers.',
    contentType: 'application/json',
    spec: 'Agent2Agent',
    specUrl: 'https://a2a-protocol.org/',
    group: 'discovery',
  },
  {
    path: '/.well-known/agent-skills/index.json',
    title: 'Agent skills index',
    description: 'Skills published by this site, each with a SKILL.md and a sha256 digest.',
    contentType: 'application/json',
    spec: 'Agent Skills discovery 0.2.0',
    specUrl: 'https://agentskills.io/',
    group: 'discovery',
  },
  {
    path: '/.well-known/ard.json',
    title: 'ARD catalog',
    description: 'Agentic Resource Discovery entries for the endpoints and documents on this domain.',
    contentType: 'application/json',
    spec: 'Agentic Resource Discovery',
    specUrl: 'https://agenticresourcediscovery.org/spec/',
    group: 'discovery',
  },
  {
    path: MCP_ENDPOINT,
    title: 'MCP endpoint',
    description:
      'Streamable HTTP. POST JSON-RPC. Tools for the free guide libraries, the projects, and the writing.',
    contentType: 'application/json',
    spec: `Model Context Protocol ${MCP_PROTOCOL_VERSION}`,
    specUrl: 'https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http',
    group: 'interface',
  },
  {
    path: A2A_ENDPOINT,
    title: 'A2A endpoint',
    description: 'JSON-RPC binding. SendMessage returns an answer about the guides, the work, or availability.',
    contentType: 'application/json',
    spec: `Agent2Agent ${A2A_PROTOCOL_VERSION}`,
    specUrl: 'https://a2a-protocol.org/latest/specification/',
    group: 'interface',
  },
];

/**
 * Tools exposed over MCP. The handlers live in `src/lib/agent-answers.mjs`
 * so that the MCP server, the A2A endpoint, and the in-page WebMCP tools all
 * answer from the same code.
 *
 * @typedef {object} ToolDef
 * @property {string} name
 * @property {string} title
 * @property {string} description
 * @property {object} inputSchema
 *
 * @type {ToolDef[]}
 */
export const tools = [
  {
    name: 'list_guide_libraries',
    title: 'List the free guide libraries',
    description:
      'List the free guide and recipe libraries Jeff Kazzee publishes for building real systems on Zo Computer, with how many are in each and where to read them. Use this first when a user wants to learn how to build something on their own machine.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'list_projects',
    title: 'List projects',
    description:
      'List the projects on this site with status, stack, and links, including LLM Arcade. Optionally filter by tag or status.',
    inputSchema: {
      type: 'object',
      properties: {
        tag: { type: 'string', description: 'Only return projects carrying this tag.' },
        status: {
          type: 'string',
          description: 'Only return projects with this status, for example shipped or alpha.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'read_page',
    title: 'Read a page as Markdown',
    description:
      'Fetch any page of this site as Markdown. Pass the path, for example / or /projects/llm-arcade/ or /blog/<slug>/.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Site path beginning with a slash.' },
      },
      required: ['path'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_writing',
    title: 'List writing',
    description: 'List the essays and field notes published on this site, newest first.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'contact_details',
    title: 'How to reach Jeff',
    description:
      'Return the ways to contact Jeff Kazzee and what he is currently open to. Use this when a user asks how to hire, brief, or reach him.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

/**
 * A2A skills. These mirror the MCP tools at a coarser grain, because an A2A
 * skill is a task an agent can delegate rather than a single function call.
 */
export const a2aSkills = [
  {
    id: 'find-a-guide',
    name: 'Find a guide',
    description:
      'Point a person at the right free guide for what they are trying to build on their own machine, drawn from 1,450 published guides and recipes.',
    tags: ['guides', 'how-to', 'zo computer', 'automation'],
    examples: [
      'How do I stop chasing invoices by hand?',
      'I want an AI system that keeps its sources.',
      'Is there a guide for triaging customer inquiries?',
    ],
    inputModes: ['text/plain'],
    outputModes: ['text/plain', 'text/markdown'],
  },
  {
    id: 'summarize-the-work',
    name: 'Summarize the work',
    description:
      'Summarize the projects and writing published at jeffkazzee.dev, including LLM Arcade, with status and links.',
    tags: ['portfolio', 'projects', 'games', 'writing'],
    examples: ['What has Jeff shipped?', 'Tell me about LLM Arcade.', 'What does he write about?'],
    inputModes: ['text/plain'],
    outputModes: ['text/plain', 'text/markdown'],
  },
  {
    id: 'availability-and-contact',
    name: 'Availability and contact',
    description: 'Report what Jeff is currently open to and how to reach him.',
    tags: ['contact', 'hiring', 'teaching'],
    examples: ['Is Jeff available for work?', 'How do I contact him about lessons?'],
    inputModes: ['text/plain'],
    outputModes: ['text/plain'],
  },
];

/** Content Signals declared in robots.txt. */
export const contentSignals = {
  'ai-train': 'yes',
  search: 'yes',
  'ai-input': 'yes',
};

/**
 * What Jeff is open to. Read by the contact tool and the A2A availability
 * skill. Keep this factual and let him edit it.
 */
export const availability = {
  openTo: [
    'Live one-to-one and small-group teaching on building with AI',
    'Contract work on agent-built software, agent skills, and agent-readable sites',
    'Full-time remote roles working with AI agents',
  ],
  contact: [
    { label: 'Email', href: 'mailto:jeffkazzee@gmail.com' },
    { label: 'GitHub', href: 'https://github.com/Jeff-Kazzee' },
    { label: 'X', href: 'https://x.com/jeffkazzee' },
    { label: 'Work with me', href: `${SITE}/work-with-me/` },
  ],
};
