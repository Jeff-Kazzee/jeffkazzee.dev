/**
 * Line-based front matter reading and writing.
 *
 * Index arithmetic on `---` markers kept going wrong: a stray blank line
 * shifted every offset, and an appended key landed past the closing marker
 * where YAML never saw it.
 *
 * Keys are stored as whole blocks, not single lines, because values like
 * `screenshots:` carry an indented list underneath them. A parser that keeps
 * only the key line silently deletes that list.
 */

const NEWLINE = /\r?\n/;
const TOP_LEVEL_KEY = /^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/;

/**
 * @typedef {object} FrontMatter
 * @property {string[]} keys           Keys in document order.
 * @property {Map<string, string[]>} blocks  Key to its raw lines, key line first.
 * @property {string} body
 */

/**
 * @param {string} raw
 * @returns {FrontMatter | null}
 */
export function parse(raw) {
  const lines = raw.split(NEWLINE);
  if (lines[0].trim() !== '---') return null;

  const close = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
  if (close === -1) return null;

  const keys = [];
  const blocks = new Map();
  let current = null;

  for (const line of lines.slice(1, close)) {
    const match = TOP_LEVEL_KEY.exec(line);

    if (match) {
      current = match[1];
      if (!blocks.has(current)) keys.push(current);
      blocks.set(current, [line]); // a repeated key replaces the earlier one
      continue;
    }

    // Indented continuation or blank line. Blank lines between keys are noise;
    // blank lines inside a block are kept so multi-line values survive.
    if (current && line.trim() !== '') blocks.get(current).push(line);
  }

  return { keys, blocks, body: lines.slice(close + 1).join('\n') };
}

/** Rebuild a file, trimming the body's leading blank lines. */
export function serialize({ keys, blocks, body }) {
  const head = keys.flatMap((key) => blocks.get(key)).join('\n');
  return `---\n${head}\n---\n${body.replace(/^\n+/, '')}`;
}

/** Read a scalar value. Returns undefined for block values and missing keys. */
export function get(parsed, key) {
  const block = parsed.blocks.get(key);
  if (!block) return undefined;

  const value = TOP_LEVEL_KEY.exec(block[0])?.[2].trim();
  return value === '' ? undefined : value;
}

/**
 * Quote a scalar when YAML would otherwise misread it. An unquoted value
 * containing ": " parses as a nested mapping and fails the build.
 */
function quoteIfNeeded(value) {
  const text = String(value);
  if (/^["'[{]/.test(text)) return text;

  // JSON string syntax is a subset of YAML's double-quoted style, so this
  // quotes and escapes correctly without hand-rolling the escape rules.
  const ambiguous = /: |:$/.test(text) || /^[@`*&!%>|#-]/.test(text);
  return ambiguous ? JSON.stringify(text) : text;
}

/** Set a scalar key, appending it at the end if it is new. Replaces any block. */
export function set(parsed, key, value) {
  if (!parsed.blocks.has(key)) parsed.keys.push(key);
  parsed.blocks.set(key, [`${key}: ${quoteIfNeeded(value)}`]);
  return parsed;
}

/** Remove a key entirely, block and all. */
export function remove(parsed, key) {
  parsed.keys = parsed.keys.filter((k) => k !== key);
  parsed.blocks.delete(key);
  return parsed;
}
