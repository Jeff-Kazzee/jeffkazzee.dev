/**
 * Turns one Substack post's HTML into Markdown for a blog draft.
 *
 * No HTML library: Substack writes a small, regular set of tags, and this site
 * adds no dependency for a step a person reviews anyway. A tag this file does
 * not know becomes a visible note in the draft, so nothing goes missing
 * quietly.
 */

import { decodeEntities } from '../../src/lib/substack-feed.mjs';

const VOID = new Set(['br', 'hr', 'img', 'source', 'input', 'line', 'path', 'polyline']);
const TOKEN = /<!--[\s\S]*?-->|<\/([a-z][a-z0-9]*)\s*>|<([a-z][a-z0-9]*)((?:\s+[^\s=>/]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/gi;
const ATTRIBUTE = /([^\s=]+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;

const INLINE = new Set(['a', 'b', 'br', 'code', 'em', 'i', 'img', 'span', 'strong']);
const IGNORED = new Set(['button', 'picture', 'source', 'svg']);
/** Site CSP allows images from this origin only, and localize-remote-images copies only this host. */
const IMAGE_HOST = 'https://substackcdn.com/';

const HARD_BREAK = '  \n';

function attributesOf(text) {
  const attributes = {};
  for (const [, name, double, single, bare] of text.matchAll(ATTRIBUTE)) {
    attributes[name.toLowerCase()] = decodeEntities(double ?? single ?? bare);
  }
  return attributes;
}

function parse(html) {
  const root = { tag: 'root', attributes: {}, children: [] };
  const open = [root];
  const addText = (text) => {
    if (text) open.at(-1).children.push(decodeEntities(text));
  };

  let position = 0;
  for (const match of html.matchAll(TOKEN)) {
    addText(html.slice(position, match.index));
    position = match.index + match[0].length;
    const [, closing, opening, attributes, selfClosing] = match;
    if (opening) {
      const tag = opening.toLowerCase();
      const node = { tag, attributes: attributesOf(attributes), children: [] };
      open.at(-1).children.push(node);
      if (!selfClosing && !VOID.has(tag)) open.push(node);
    } else if (closing) {
      const at = open.findLastIndex((node) => node.tag === closing.toLowerCase());
      if (at > 0) open.length = at;
    }
  }
  addText(html.slice(position));
  return root;
}

const isText = (node) => typeof node === 'string';
const plainText = (node) => (isText(node) ? node : node.children.map(plainText).join(''));
const hasClass = (node, name) => (node.attributes.class ?? '').split(/\s+/).includes(name);

function find(node, tag) {
  if (isText(node)) return null;
  if (node.tag === tag) return node;
  for (const child of node.children) {
    const found = find(child, tag);
    if (found) return found;
  }
  return null;
}

function escapeText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\\`*_[\]<]/g, '\\$&')
    .replace(/&(?=#?\w+;)/g, '\\&');
}

/** A paragraph that happens to start like a heading, quote or list must stay a paragraph. */
function escapeLineStarts(text) {
  return text
    .split('\n')
    .map((line) => line.replace(/^(\s*)(#{1,6}\s|>|[-+]\s)/, '$1\\$2').replace(/^(\s*\d+)([.)]\s)/, '$1\\$2'))
    .join('\n');
}

const encodeUrl = (url) => url.replace(/\s/g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');

function wrap(marker, text) {
  const [, before, core, after] = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
  return core ? `${before}${marker}${core}${marker}${after}` : text;
}

function codeSpan(text) {
  const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
  const fence = '`'.repeat(longest + 1);
  return longest ? `${fence} ${text} ${fence}` : `${fence}${text}${fence}`;
}

/** Collapses runs of line breaks: Substack uses them as paragraph spacing. */
function tidy(text) {
  return text
    .replace(/(?: {2}\n\s*){2,}/g, '\n\n')
    .replace(/^(?: {2}\n\s*)+|(?: {2}\n\s*)+$/g, '')
    .trim();
}

export function htmlToMarkdown(html) {
  const notes = [];

  const unsupported = (name) => {
    notes.push(name);
    return `> **Not mirrored:** ${name}. Check the Substack post before publishing.`;
  };

  const image = (node) => {
    const source = node.attributes.src ?? '';
    if (!source.startsWith(IMAGE_HOST)) return unsupported(`an image from ${source || 'an unknown host'}`);
    const alt = (node.attributes.alt ?? '').replace(/[[\]\s]+/g, ' ').trim();
    return `![${alt}](${encodeUrl(source)})`;
  };

  function inline(node) {
    if (isText(node)) return escapeText(node);
    const inner = () => node.children.map(inline).join('');
    switch (node.tag) {
      case 'strong':
      case 'b':
        return wrap('**', inner());
      case 'em':
      case 'i':
        return wrap('*', inner());
      case 'code':
        return codeSpan(plainText(node));
      case 'br':
        return HARD_BREAK;
      case 'img':
        return image(node);
      case 'a': {
        const text = inner();
        const href = node.attributes.href ?? '';
        return text.trim() && /^(https?:|mailto:)/i.test(href) ? `[${text}](${encodeUrl(href)})` : text;
      }
      default:
        return IGNORED.has(node.tag) ? '' : inner();
    }
  }

  const inlineOf = (nodes) => tidy(nodes.map(inline).join(''));
  const paragraph = (nodes) => escapeLineStarts(inlineOf(nodes));

  function figure(node) {
    const picture = find(node, 'img');
    const caption = find(node, 'figcaption');
    const text = caption ? inlineOf(caption.children) : '';
    return [picture ? image(picture) : unsupported('a figure with no image'), text && wrap('*', text.replace(/\s*\n\s*/g, ' '))]
      .filter(Boolean)
      .join('\n\n');
  }

  function list(node, marker) {
    const items = node.children.filter((child) => !isText(child) && child.tag === 'li');
    return items
      .map((item, index) => {
        const lead = marker === 'ol' ? `${index + 1}. ` : '- ';
        const body = blocks(item.children).join('\n\n');
        return lead + body.replace(/\n(?=.)/g, `\n${' '.repeat(lead.length)}`);
      })
      .join('\n');
  }

  function block(node) {
    switch (node.tag) {
      case 'p':
        return hasClass(node, 'button-wrapper') ? '' : paragraph(node.children);
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        // The page title is the h1, so a heading in the body starts at h2.
        const level = Math.max(2, Number(node.tag[1]));
        const text = inlineOf(node.children).replace(/\s*\n\s*/g, ' ');
        return text && `${'#'.repeat(level)} ${text}`;
      }
      case 'ul':
      case 'ol':
        return list(node, node.tag);
      case 'blockquote':
        return blocks(node.children)
          .join('\n\n')
          .replace(/^/gm, '> ')
          .replace(/^> $/gm, '>');
      case 'pre': {
        const code = plainText(node).replace(/\n$/, '');
        const longest = Math.max(2, ...(code.match(/`+/g) ?? []).map((run) => run.length));
        const fence = '`'.repeat(longest + 1);
        return `${fence}\n${code}\n${fence}`;
      }
      case 'hr':
        return '---';
      case 'figure':
        return figure(node);
      case 'div':
        if (hasClass(node, 'twitter-embed')) return unsupported('an embedded X post');
        return blocks(node.children).join('\n\n');
      default:
        return IGNORED.has(node.tag) ? '' : unsupported(`a <${node.tag}> element`);
    }
  }

  /** Groups loose inline nodes into paragraphs between block elements. */
  function blocks(nodes) {
    const out = [];
    let loose = [];
    const flush = () => {
      if (loose.length) out.push(paragraph(loose));
      loose = [];
    };
    for (const node of nodes) {
      if (isText(node) || INLINE.has(node.tag)) {
        loose.push(node);
      } else {
        flush();
        out.push(block(node));
      }
    }
    flush();
    return out.filter(Boolean);
  }

  return { markdown: `${blocks(parse(html).children).join('\n\n')}\n`, notes };
}
