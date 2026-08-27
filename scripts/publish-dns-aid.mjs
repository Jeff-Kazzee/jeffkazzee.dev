/**
 * Publishes DNS for AI Discovery (DNS-AID) records at Porkbun.
 *
 * Credentials come from `.env.local` in the project root, which git ignores.
 * Keep them in that file rather than on a command line, so they never reach
 * shell history or a terminal transcript. This script never prints them.
 *
 *     npm run dns:aid              dry run, shows what would change
 *     npm run dns:aid -- --apply   writes the records
 *
 * Re-running is safe: a record that is already correct is left alone, and one
 * with different content is edited rather than duplicated.
 *
 * See docs/dns-aid.md for what the records mean and how to verify them.
 */

import { readFileSync } from 'node:fs';

const NEWLINE = /\r?\n/;
const ENV_LINE = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/;
const QUOTES = /^["']|["']$/g;

/**
 * Load .env.local if it is there. Values already in the environment win, so a
 * one-off override still works without editing the file.
 */
function loadEnvFile() {
  let contents;

  try {
    contents = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  } catch {
    return; // No file. The environment may still carry the keys.
  }

  for (const line of contents.split(NEWLINE)) {
    const match = ENV_LINE.exec(line);
    if (!match) continue;

    const [, key, rawValue] = match;
    const value = rawValue.trim().replace(QUOTES, '');
    if (value && !process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

const API = 'https://api.porkbun.com/api/json/v3';
const DOMAIN = 'jeffkazzee.dev';
const TTL = '600'; // Porkbun's minimum.

const apikey = process.env.PORKBUN_API_KEY;
const secretapikey = process.env.PORKBUN_SECRET_API_KEY;
const apply = process.argv.includes('--apply');

if (!apikey || !secretapikey) {
  console.error(
    [
      'No Porkbun credentials found.',
      '',
      'Create a file called .env.local in the project root with two lines:',
      'one naming PORKBUN_API_KEY, one naming PORKBUN_SECRET_API_KEY, each',
      'followed by = and the value from https://porkbun.com/account/api',
      '',
      'Then switch on API access for the domain in its Porkbun settings.',
      'Without that per-domain toggle the API refuses otherwise valid keys.',
      '',
      'git ignores .env.local, so the keys stay off the record.',
    ].join('\n'),
  );
  process.exit(1);
}

if (apikey.startsWith('REPLACE_ME') || secretapikey.startsWith('REPLACE_ME')) {
  console.error(
    [
      '.env.local still holds the placeholder values.',
      '',
      'Open it and replace the text after each = with the real key from',
      'https://porkbun.com/account/api, then run this again.',
    ].join('\n'),
  );
  process.exit(1);
}

/**
 * The entrypoints, per draft-mozleywilliams-dnsop-dnsaid.
 *
 * `subdomain` is the part before the domain. Content is the SVCB RDATA:
 * priority, target, then parameters.
 *
 * The A2A entrypoint carries alpn="a2a" because that is the shape the draft's
 * own example uses for an A2A endpoint. The others are ordinary HTTPS.
 */
const records = [
  {
    subdomain: '_index._agents',
    type: 'SVCB',
    content: `1 ${DOMAIN}. alpn="h2" port=443`,
    why: 'Top-level entrypoint. Points agents at the origin serving the discovery documents.',
  },
  {
    subdomain: '_mcp._agents',
    type: 'SVCB',
    content: `1 ${DOMAIN}. alpn="h2" port=443`,
    why: 'MCP endpoint lives at https://jeffkazzee.dev/api/mcp',
  },
  {
    subdomain: '_a2a._agents',
    type: 'SVCB',
    content: `1 ${DOMAIN}. alpn="a2a" port=443`,
    why: 'A2A endpoint lives at https://jeffkazzee.dev/api/a2a',
  },
];

async function call(path, body = {}) {
  const response = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ apikey, secretapikey, ...body }),
  });

  const payload = await response.json().catch(() => ({}));

  if (payload.status !== 'SUCCESS') {
    throw new Error(`${path} failed: ${payload.message ?? `HTTP ${response.status}`}`);
  }

  return payload;
}

const ping = await call('/ping');
console.log(`Authenticated with Porkbun (request seen from ${ping.yourIp}).`);

const { records: existing } = await call(`/dns/retrieve/${DOMAIN}`);

let created = 0;
let edited = 0;
let unchanged = 0;

for (const record of records) {
  const fqdn = `${record.subdomain}.${DOMAIN}`;
  const current = existing.find((row) => row.name === fqdn && row.type === record.type);

  if (current && current.content === record.content) {
    console.log(`  unchanged  ${record.type} ${fqdn}`);
    unchanged++;
    continue;
  }

  const action = current ? 'edit' : 'create';
  console.log(`  ${action.padEnd(9)}  ${record.type} ${fqdn}`);
  console.log(`             ${record.content}`);
  console.log(`             ${record.why}`);

  if (!apply) continue;

  if (current) {
    await call(`/dns/edit/${DOMAIN}/${current.id}`, {
      name: record.subdomain,
      type: record.type,
      content: record.content,
      ttl: TTL,
    });
    edited++;
  } else {
    await call(`/dns/create/${DOMAIN}`, {
      name: record.subdomain,
      type: record.type,
      content: record.content,
      ttl: TTL,
    });
    created++;
  }
}

if (!apply) {
  console.log('\nDry run. Nothing was written. Re-run with --apply to publish.');
} else {
  console.log(`\nDone. ${created} created, ${edited} edited, ${unchanged} already correct.`);
  console.log('Verify once DNS propagates (a minute or two at TTL 600):');
  console.log(
    `  curl -s -H 'Accept: application/dns-json' 'https://cloudflare-dns.com/dns-query?name=_index._agents.${DOMAIN}&type=SVCB&do=1'`,
  );
}
