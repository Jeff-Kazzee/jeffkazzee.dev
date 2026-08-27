/**
 * MCP server over Streamable HTTP.
 *
 * Revision 2026-07-28 removed the `initialize` handshake and protocol-level
 * sessions: protocol metadata rides in `_meta` and is mirrored into headers.
 * Most deployed clients still open with `initialize`, so this server answers
 * both eras from the one endpoint. A client that skips the handshake works,
 * and a client that sends one gets a valid negotiated response.
 */

import {
  MCP_LEGACY_VERSIONS,
  MCP_PROTOCOL_VERSION,
  SURFACE_VERSION,
  tools,
} from '../data/agent-surface.mjs';
import { runTool } from './agent-answers.mjs';

const SERVER_INFO = { name: 'jeffkazzee.dev', title: 'Jeff Kazzee', version: SURFACE_VERSION };
const SUPPORTED = [MCP_PROTOCOL_VERSION, ...MCP_LEGACY_VERSIONS];

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers':
    'content-type, mcp-protocol-version, mcp-method, mcp-name, mcp-session-id, authorization',
  'access-control-expose-headers': 'mcp-protocol-version',
};

const json = (body, status = 200, headers = {}) =>
  new Response(`${JSON.stringify(body)}\n`, {
    status,
    headers: { 'content-type': 'application/json', ...CORS, ...headers },
  });

const result = (id, value) => json({ jsonrpc: '2.0', id, result: value });

const failure = (id, code, message, status = 200, data) =>
  json({ jsonrpc: '2.0', id: id ?? null, error: { code, message, ...(data ? { data } : {}) } }, status);

const textResult = (id, text) => result(id, { content: [{ type: 'text', text }] });

export async function handleMcp(request, origin) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  // GET and DELETE carried the old SSE stream and session teardown. Neither
  // exists in this revision.
  if (request.method !== 'POST') {
    return json(
      { jsonrpc: '2.0', id: null, error: { code: -32601, message: 'Use POST for the MCP endpoint' } },
      405,
      { allow: 'POST, OPTIONS' },
    );
  }

  let message;
  try {
    message = await request.json();
  } catch {
    return failure(null, -32700, 'Parse error', 400);
  }

  if (Array.isArray(message)) {
    return failure(null, -32600, 'Batched requests are not supported', 400);
  }

  const { id, method, params = {} } = message ?? {};

  // A notification carries no id. Accept it and say nothing back.
  if (id === undefined || id === null) {
    if (typeof method === 'string' && method.startsWith('notifications/')) {
      return new Response(null, { status: 202, headers: CORS });
    }
    return failure(null, -32600, 'Invalid request: missing id', 400);
  }

  const requested =
    request.headers.get('mcp-protocol-version') ??
    params?._meta?.['io.modelcontextprotocol/protocolVersion'] ??
    params?.protocolVersion;

  if (requested && !SUPPORTED.includes(requested)) {
    return failure(id, -32602, `Unsupported protocol version: ${requested}`, 400, {
      supported: SUPPORTED,
    });
  }

  switch (method) {
    case 'initialize':
      // Legacy handshake. Echo a version both sides know.
      return result(id, {
        protocolVersion: SUPPORTED.includes(requested) ? requested : MCP_LEGACY_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          'Start with list_guide_libraries: 1,450 free guides and recipes for building real systems. Any page of jeffkazzee.dev can be fetched as Markdown with read_page.',
      });

    case 'ping':
      return result(id, {});

    case 'tools/list':
      return result(id, {
        tools: tools.map(({ name, title, description, inputSchema }) => ({
          name,
          title,
          description,
          inputSchema,
        })),
      });

    case 'tools/call': {
      const name = params?.name;

      if (!tools.some((tool) => tool.name === name)) {
        return failure(id, -32602, `Unknown tool: ${name}`);
      }

      // The header mirrors the body value and must agree with it.
      const mirrored = request.headers.get('mcp-name');
      if (mirrored && mirrored !== name && !mirrored.startsWith('=?base64?')) {
        return failure(
          id,
          -32020,
          `Header mismatch: Mcp-Name header value '${mirrored}' does not match body value '${name}'`,
          400,
        );
      }

      try {
        return textResult(id, await runTool(name, params?.arguments, origin));
      } catch (error) {
        // A tool that fails reports through the result, not the protocol.
        return result(id, {
          content: [{ type: 'text', text: `Tool failed: ${error.message}` }],
          isError: true,
        });
      }
    }

    case 'resources/list':
      return result(id, { resources: [] });

    case 'prompts/list':
      return result(id, { prompts: [] });

    default:
      // 404 plus -32601 is what tells a client this is a modern MCP endpoint
      // rather than a server that does not host one at all.
      return failure(id, -32601, `Method not found: ${method}`, 404);
  }
}
