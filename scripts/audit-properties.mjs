/**
 * Measures how agent-ready each of Jeff's public sites is.
 *
 *     npm run audit:properties
 *
 * Written because the answer to "which site needs this most" was not the one
 * anyone guessed. Deep Dives looked behind and was furthest ahead. The
 * factbook looked fine and was serving one byte of HTML.
 *
 * Re-run it rather than trusting the numbers written down in
 * docs/agent-readiness-audit.md, which are a snapshot.
 */

const TIMEOUT_MS = 20000;

const SITES = [
  { name: 'jeffkazzee.dev', url: 'https://jeffkazzee.dev', note: 'reference implementation' },
  { name: 'Zo Deep Dives', url: 'https://deepdives.zocomputer101.wiki', note: '85 guides' },
  { name: 'Zo Computer 101', url: 'https://www.zocomputer101.wiki', note: '66 guides, 137 recipes' },
  { name: 'Zo Cookbook', url: 'https://www.zo-cookbook.space', note: '1,162 recipes' },
  { name: 'Open World Factbook', url: 'https://worldfactbook.xyz', note: '262 countries' },
  { name: 'LLM Arcade', url: 'https://www.llmarcade.fun', note: '11 games' },
];

const get = async (url, headers = {}) => {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
    return { ok: response.ok, status: response.status, headers: response.headers, response };
  } catch {
    return { ok: false, status: 0, headers: new Headers(), response: null };
  }
};

const sizeOf = async (url) => {
  const r = await get(url);
  if (!r.ok) return 0;
  return (await r.response.text()).length;
};

/** Text a crawler sees with no JavaScript. The number that matters most. */
async function crawlableText(url) {
  const r = await get(url);
  if (!r.ok) return 0;

  const html = await r.response.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}

/** Count page URLs, following one level of sitemap index. */
async function countSitemap(robotsBody, base) {
  const declared = [...robotsBody.matchAll(/^Sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  const candidates = declared.length > 0 ? declared : [`${base}/sitemap.xml`];
  let total = 0;

  for (const url of candidates) {
    const r = await get(url);
    if (!r.ok) continue;

    const body = await r.response.text();
    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

    if (/<sitemapindex/i.test(body)) {
      for (const child of locs) {
        const c = await get(child);
        if (!c.ok) continue;
        total += ((await c.response.text()).match(/<loc>/g) ?? []).length;
      }
    } else {
      total += locs.length;
    }
  }

  return total;
}

async function audit(site) {
  const robots = await get(`${site.url}/robots.txt`);
  const robotsBody = robots.ok ? await robots.response.text() : '';

  // Follow whatever robots.txt declares, and count nested sitemaps, rather
  // than assuming /sitemap.xml. jeffkazzee.dev publishes a sitemap index.
  const sitemapUrls = await countSitemap(robotsBody, site.url);

  const home = await get(`${site.url}/`);
  const md = await get(`${site.url}/`, { Accept: 'text/markdown' });

  return {
    ...site,
    robots: robots.ok,
    contentSignal: /Content-Signal:/i.test(robotsBody),
    agentmap: /Agentmap:/i.test(robotsBody),
    llms: await sizeOf(`${site.url}/llms.txt`),
    llmsFull: await sizeOf(`${site.url}/llms-full.txt`),
    sitemapUrls,
    linkHeader: Boolean(home.headers.get('link')),
    markdown: (md.headers.get('content-type') ?? '').includes('text/markdown'),
    text: await crawlableText(site.url),
  };
}

const results = [];
for (const site of SITES) results.push(await audit(site));

const yn = (v) => (v ? 'yes' : 'NO');
const kb = (n) => (n >= 1024 ? `${Math.round(n / 1024)}KB` : `${n}B`);

console.log('\nAgent readiness across the public sites\n');
console.log(
  `  ${'site'.padEnd(21)}${'robots'.padEnd(8)}${'signals'.padEnd(9)}${'llms'.padEnd(8)}` +
    `${'llms-full'.padEnd(11)}${'sitemap'.padEnd(9)}${'Link'.padEnd(6)}${'md'.padEnd(5)}crawlable`,
);
console.log(`  ${'-'.repeat(88)}`);

for (const r of results) {
  console.log(
    `  ${r.name.padEnd(21)}${yn(r.robots).padEnd(8)}${yn(r.contentSignal).padEnd(9)}` +
      `${kb(r.llms).padEnd(8)}${kb(r.llmsFull).padEnd(11)}${String(r.sitemapUrls).padEnd(9)}` +
      `${yn(r.linkHeader).padEnd(6)}${yn(r.markdown).padEnd(5)}${kb(r.text)}`,
  );
}

// A site whose content only exists after JavaScript runs is invisible to search
// engines and to any agent that does not drive a browser.
const invisible = results.filter((r) => r.text < 2000);

if (invisible.length > 0) {
  console.log('\n  Serving almost no crawlable HTML (content requires JavaScript):');
  for (const r of invisible) {
    console.log(`    ${r.name}: ${kb(r.text)} of text, ${r.note}`);
  }
  console.log('\n  Fix by rendering the content into the HTML, as Zo Deep Dives already does.');
}

console.log('\n  Full findings and priority order: docs/agent-readiness-audit.md\n');
