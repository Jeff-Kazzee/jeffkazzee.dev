# Cloudflare and Ahrefs visibility plan

Date: August 23, 2026

This plan separates work that lives in the repository from work that needs a
deployed site or access to a provider dashboard. Vercel is the current host.
No Cloudflare, Ahrefs, Google, or Bing dashboard setting changed in this pass.

## What the repository now handles

- The Astro sitemap includes pages that should appear in search results. It
  excludes `/contact-thanks/` and any blog post whose `canonicalUrl` points to
  another origin.
- `/contact-thanks/` sends a `robots` value of `noindex,follow`. Search engines
  can follow its links without treating the confirmation page as a search
  result.
- All 15 imported Substack images now live in the repository. Astro emits
  compressed WebP files with intrinsic dimensions, lazy loading, and async
  decoding. The separate first-party article image also has explicit dimensions
  and lazy loading.
- Three articles link to the relevant Zo project page in their main text. The
  links use the project name as the anchor instead of a generic phrase.
- `vercel.json` pins the Astro preset, build command, `dist` output directory,
  security headers, and cache rules. Hashed Astro assets receive a one-year
  immutable browser cache. Public images receive a one-day cache with seven
  days of stale reuse.

Google recommends listing the canonical URLs that a publisher wants in search
results. Ahrefs also warns that a canonicalized duplicate in a sitemap can send
mixed signals. The sitemap filter follows both recommendations.

## Checks for the first production deployment

Run these checks against `https://jeffkazzee.dev` after deployment:

1. Confirm that HTTP, `www`, and any old deployment hostname resolve or redirect
   to one HTTPS version of `jeffkazzee.dev`.
2. Open `/sitemap-index.xml` and its child sitemap. Confirm that neither
   `/contact-thanks/` nor any externally canonicalized article appears.
3. Open `/contact-thanks/` and confirm that its HTML contains
   `<meta name="robots" content="noindex,follow">`.
4. Confirm that every public page has one canonical link, one title, one meta
   description, and one visible `h1`.
5. Confirm that `/_astro/*` responses use the long immutable cache policy from
   `vercel.json`.
6. Confirm that the generated RSS and sitemap XML parse without errors.

Vercel branch deployments are the preview gate. Confirm that the preview URL
returns `X-Robots-Tag: noindex` before merging the release branch to `main`.

## Provider work after deployment

These tasks need account access. They remain undone until Jeff authorizes them.

1. Verify the Vercel production aliases for `jeffkazzee.dev` and
   `www.jeffkazzee.dev`, the certificate, and canonical redirect behavior.
2. Verify the domain in Google Search Console and Bing Webmaster Tools. Submit
   the production sitemap URL in both dashboards, then check the reported crawl
   and indexing state after the first fetch.
3. Do not move hosting or DNS solely to enable Cloudflare Crawler Hints. If the
   domain later uses Cloudflare as an active proxy, enable Crawler Hints only
   after sitemap and `noindex` checks pass. It does not replace the sitemap or
   canonical tags.
4. Verify `jeffkazzee.dev` in Ahrefs Free, formerly Ahrefs Webmaster Tools. Run
   Site Audit against the canonical HTTPS origin. Save the initial Health Score
   and issue export as the baseline for later releases.
5. In Ahrefs Site Audit, review broken links, redirect chains, canonical and
   sitemap conflicts, accidental `noindex` pages, missing metadata, oversized
   images, and orphaned pages before lower-value suggestions.
6. In Ahrefs Site Explorer, record the pages, queries, and backlinks that
   already bring search traffic. Use that evidence to choose future articles
   and internal links. Do not add links merely to hit a count.
7. Re-run Site Audit after each material release and after fixing a group of
   crawl errors. Compare the issue list, not only the aggregate score.

## Performance measurement and the no-tracker claim

Cloudflare Web Analytics can report Largest Contentful Paint, Interaction to
Next Paint, and Cumulative Layout Shift from real visits. Cloudflare says its
beacon does not use cookies, `localStorage`, or fingerprinting for these
metrics. It still adds a client-side analytics request.

The current site says it has no trackers. Do not enable Cloudflare Web
Analytics or Ahrefs Web Analytics until Jeff chooses whether that promise
includes privacy-focused analytics beacons. If he enables either product,
update the footer and privacy explanation in the same release. Ahrefs Site
Audit and Site Explorer do not require a visitor analytics script, so those
tools can be used first.

## Agent-readiness and commerce boundary

Search visibility does not require placeholder OAuth, MCP, API catalog, bot
identity, or payment files. Keep those routes absent until the corresponding
service exists and can honor what its metadata advertises. The protocol-by-
protocol decisions are in
[`agent-readiness-2026-08-23.md`](./agent-readiness-2026-08-23.md).

`robots.txt` now publishes `search=yes, ai-input=yes, ai-train=no`. This permits
search indexing and real-time AI grounding while reserving permission for model
training. The directive states a preference. It does not enforce one.

Commerce metadata should follow a real offer. Define the product, price,
currency, checkout provider, fulfillment, refund terms, and support path before
adding product schema or machine-payment discovery.

## Sources

- [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json)
- [Vercel cache-control headers](https://vercel.com/docs/caching/cache-control-headers)
- [Cloudflare Crawler Hints](https://developers.cloudflare.com/cache/advanced-configuration/crawler-hints/)
- [Cloudflare Core Web Vitals](https://developers.cloudflare.com/web-analytics/data-metrics/core-web-vitals/)
- [Ahrefs Free](https://ahrefs.com/webmaster-tools)
- [Ahrefs sitemap guide](https://ahrefs.com/blog/how-to-create-a-sitemap/)
- [Ahrefs internal linking guide](https://ahrefs.com/blog/internal-links-for-seo/)
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google image SEO guidance](https://developers.google.com/search/docs/appearance/google-images)
