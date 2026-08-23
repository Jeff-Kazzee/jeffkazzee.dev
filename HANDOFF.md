# jeffkazzee.dev redesign handoff

Date: 2026-08-23

## Live workspace

- Repository: `C:\Users\jeffk\big-projects\jeffkazzee.dev redesign`
- Branch: `release/orbiting-field-notes`
- State: release candidate awaiting final preview verification
- Remote actions: no production deployment or provider-dashboard change yet
- Canonical domain: `https://jeffkazzee.dev`

## Goal

Turn Jeff's personal site into a fast portfolio and first-party blog. Keep its
space ethos, update the real project record, improve search visibility, and
prepare truthful agent and commerce discovery surfaces. Do not copy The Little
AI Company's identity. Use that site only as a reference for editorial craft.

## Writing rule

Use the complete skill at
`C:\Users\jeffk\Downloads\clear-voice-writing\clear-voice-writing` for every
human-facing sentence. This includes site copy, documentation, UI labels,
prompts, handoffs, and chat responses. Preserve Jeff's direct voice and concrete
claims. Remove formulaic AI language without flattening the writing.

## Completed work

- Installed 44 pinned PStack skills under `.agents/skills` from
  `cursor/plugins` commit `fd6dd6f7276956a532bb78a748a8d2818b6eb5f4`.
- Added an idempotent adapter in `scripts/adapt-pstack-for-codex.ps1` and a
  policy-aware `skills-lock.json`.
- Listed Val as coming soon.
- Listed Vivary as deprecated.
- Removed Obscura from public project listings and kept its historical route as
  archived.
- Listed Zo 101 and Zo Deep Dive Guides as separate projects with their
  canonical URLs.
- Replaced the outdated Vivary and Zo screenshots with captures from
  2026-08-23.
- Rewrote the homepage, project copy, projects page, blog index, and commercial
  page around current work.
- Added a first-party blog template and publishing guide. Imported Substack
  posts keep their external canonical URLs. New posts can originate here.
- Fixed canonical Open Graph URLs and the RSS discovery link.
- Added `CreativeWork` schema to project pages and `BlogPosting` schema to blog
  pages. The licensed-guides post also keeps one `FAQPage` entity.
- Added `public/llms.txt`, security headers, and immutable hashed-asset caching in
  `vercel.json` for the site's actual host.
- Added truthful agent-readiness research in
  `docs/research/agent-readiness-2026-08-23.md`.
- Added future commerce boundaries in
  `docs/commerce-readiness-2026-08-23.md`.
- Updated Astro to 7.2.4, pinned Vite to 8.0.16 and Sharp to 0.35.3,
  and updated `@astrojs/rss` to 4.0.19.
- Added an Astro-environment dependency-optimizer rule for `picomatch`. Astro's
  content loader otherwise passed that CommonJS package through Vite's ESM
  runner on this Windows checkout.
- Built Option 1, Orbiting Field Notes, as a fast dark-first design with a warm
  light mode, generated space imagery, and reduced-motion-safe pointer parallax.
- Added a Cloudflare and Ahrefs visibility runbook with code work separated from
  post-deploy provider tasks.

## Agent-readiness boundary

Keep the Cloudflare and standards recommendations in the research document.
Do not publish placeholder Web Bot Auth, OAuth, Auth.md, API catalog, MCP,
WebMCP, ARD, x402, MPP, UCP, or ACP metadata. The static site does not provide
the services those files would claim.

Content Signals are a product-policy decision, not a technical default. Jeff
selected `search=yes, ai-input=yes, ai-train=no`, now published in
`public/robots.txt`.

## Design gate

Jeff selected Option 1, Orbiting Field Notes. It is implemented as the current
release candidate. The preview branch is the production gate.

Reference captures:

- `design/references/jeffkazzee-dev-current.png`
- `design/references/little-ai-company-current.png`

ImageGen saved the selected source outside the repo at
`C:\Users\jeffk\.codex\generated_images\01a0302d-2a5f-7621-9f1e-aa027acb2b9e\exec-0043afb3-9804-438f-98d1-7a3a7f60a227.png`.

The implementation uses optimized Astro images and a small pointer-parallax
script instead of a Three.js runtime. See `design-qa.md` and `design/qa/` for
the comparison evidence.

## Verification evidence

- `npm run build`: 30 pages, 0 errors, 0 warnings, 0 hints
- Ten consecutive content-sync runs and two clean sequential `npm run build`
  runs passed after the optimizer fix. Do not run build or install processes
  concurrently in this repository.
- `npm audit --omit=dev` reports zero known vulnerabilities.
- RSS and sitemap parse as XML
- All 17 project pages contain exactly one `CreativeWork` entity
- The licensed-guides post contains one `BlogPosting` and one `FAQPage`
- The canonical domain is `jeffkazzee.dev` throughout identity and metadata.
  `jeffkazzee.zo.space` remains only where it identifies Jeff's Zo Computer.
- All 44 PStack skills pass Codex `quick_validate.py`
- The PStack adapter repairs deleted generated metadata and makes no changes on
  the next run
- Technical writing lint passes every project document
- `git diff --check`: clean
- In-app browser checks passed for dark and light homepage states, the project
  and writing sections, exact mobile layout, project routes, the blog, and Work
  with me. No console errors or horizontal overflow were found.

## Known boundaries

- Vercel is the current host. Cloudflare-specific dashboard features are not in
  the serving path and should not be treated as completed work.
- No current product, price, checkout, fulfillment policy, or refund policy has
  been verified. The old coaching checkout and booking links were retired
  because coaching is not the current offer.
- Imported article images are self-hosted, optimized by Astro, and emitted with
  intrinsic dimensions, lazy loading, and asynchronous decoding.
- Hanken Grotesk and Literata are self-hosted as variable WOFF2 files. No Google
  Fonts requests remain.
- Content Signals permit search and AI input while reserving training rights.
- The new screenshots are current as of 2026-08-23. Recheck them when the source
  sites change materially.
- Ahrefs, Google Search Console, and Bing Webmaster Tools still need their
  authenticated post-deploy checks. The connected Ahrefs API returned
  `Insufficient plan` for project, site-audit, and domain-rating reads.

## Next action

Push this exact release candidate to the Vercel preview lane, verify the preview,
then fast-forward `main` and verify the production aliases.
