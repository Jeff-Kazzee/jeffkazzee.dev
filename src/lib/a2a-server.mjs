/**
 * A2A JSON-RPC binding.
 *
 * The agent card at /.well-known/agent-card.json advertises this endpoint.
 * It answers `SendMessage` immediately with a Message rather than opening a
 * Task, because every skill here is a read that completes in one turn.
 */

import { A2A_PROTOCOL_VERSION, SITE, a2aSkills } from '../data/agent-surface.mjs';
import { answerQuestion } from './agent-answers.mjs';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type, a2a-extensions, authorization',
};

const json = (body, status = 200, headers = {}) =>
  new Response(`${JSON.stringify(body)}\n`, {
    status,
    headers: { 'content-type': 'application/json', ...CORS, ...headers },
  });

const failure = (id, code, message, status = 200) =>
  json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }, status);

/** Pull the text out of an A2A message, whatever part shapes it carries. */
const messageText = (message) =>
  (message?.parts ?? [])
    .map((part) => part?.text ?? part?.data?.text ?? '')
    .filter(Boolean)
    .join(' ')
    .trim();

/** Deterministic id. The edge runtime has crypto.randomUUID available. */
const newId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

export async function handleA2a(request, origin) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  if (request.method !== 'POST') {
    return failure(null, -32600, 'Use POST for the A2A endpoint', 405);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return failure(null, -32700, 'Parse error', 400);
  }

  const { id, method, params = {} } = payload ?? {};

  switch (method) {
    case 'GetAgentCard':
      return json({
        jsonrpc: '2.0',
        id: id ?? null,
        result: { url: `${SITE}/.well-known/agent-card.json`, protocolVersion: A2A_PROTOCOL_VERSION },
      });

    case 'ListSkills':
      return json({ jsonrpc: '2.0', id: id ?? null, result: { skills: a2aSkills } });

    case 'SendMessage':
    case 'message/send': {
      const question = messageText(params?.message ?? params?.request?.message);

      if (!question) {
        return failure(id, -32602, 'params.message.parts must contain text');
      }

      return json({
        jsonrpc: '2.0',
        id: id ?? null,
        result: {
          message: {
            role: 'ROLE_AGENT',
            parts: [{ text: await answerQuestion(question, origin) }],
            messageId: newId('msg'),
            contextId: params?.message?.contextId ?? newId('ctx'),
          },
        },
      });
    }

    case 'SendStreamingMessage':
      return failure(id, -32601, 'Streaming is not supported. The agent card declares streaming: false.');

    default:
      return failure(id, -32601, `Method not found: ${method}`, 404);
  }
}
