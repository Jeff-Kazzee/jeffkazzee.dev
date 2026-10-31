# Design

Mountains in deep space, read calmly. The home page opens on the Cosmic Cliffs of the Carina Nebula, photographed by the James Webb Space Telescope: a ridge of gold and rust gas under a field of stars. The rest of the site is the dark sky around it. The image carries the drama, the type stays quiet. Replaces the Earthrise night-gallery system on 2026-10-25 at Jeff's direction.

## Visual Theme

- Register: brand (portfolio)
- Theme: dark only. Deep space background, star-white text, one amber accent taken from the nebula.
- Color strategy: restrained. Amber is the only loud color on any screen. The hero image carries the rest.

## Color Palette

| Token | Value | Role |
|---|---|---|
| `--bg` | `#0b0e1a` | page background (space-black) |
| `--bg-raised` | `#11152a` | code blocks |
| `--surface` | `#161b2e` | panels, cards, screenshot frames (ridge-night) |
| `--ink` | `#f4f1ea` | headings and body (star-white) |
| `--ink-soft` | `#c9c7c0` | secondary text |
| `--ink-faint` | `#8a8fa3` | captions, metadata, dates (5.9:1 on `--bg`) |
| `--line` | `rgb(123 156 194 / 0.22)` | hairline borders |
| `--accent` | `#e8a04c` | nebula-amber: links, primary buttons, active-work status, live dot |
| `--accent-bright` | `#f2c879` | dust-gold: hover, links over the hero |
| `--glacier` | `#7b9cc2` | shipped status (6.7:1 on `--bg`) |
| `--neutral` | `#b8bccb` | demo and deprecated status |
| `--rust` | `#b5532a` | large text and borders only. About 3.3:1, so never small text |

Status words are always printed. Color is never the only signal.

## Typography

Calm and readable on a laptop first. Revised 2026-10-26 after the first version read as too large and too loud.

- Headings and body: **IBM Plex Sans**. Headings 600, sentence case. Body 400 at 1.0625rem, line height 1.65, measure 66ch.
- Site name only: **Big Shoulders** 800, uppercase, 1.4rem.
- Metadata only (status, stack, hostnames, code): **JetBrains Mono** at 0.8rem. Never for buttons, nav, or section labels.
- Self-hosted, Latin subset, fallback faces scaled to the same width so nothing jumps when fonts load. Only the body font is preloaded.
- Sizes: page h1 `clamp(2rem, 3.6vw, 2.75rem)`, home h1 `clamp(2.1rem, 4vw, 3.1rem)`, h2 `clamp(1.5rem, 2.4vw, 1.875rem)`, card and post titles 1.1 to 1.2rem.
- No uppercase headings. No status lines above the headline.

## Hero (home)

- One `<Picture>` of `src/assets/cosmic-cliffs.jpg`, AVIF with WebP fallback. A phone downloads 33 KB.
- Height `clamp(30rem, 72vh, 42rem)`. Header sits over the image.
- Copy is left-aligned in a 34rem column on a dark left-side scrim, so it never runs across the bright ridge. On phones the scrim darkens the lower half instead.
- Headline, lede, two buttons. Image credit small, bottom right.

## Home page sections

1. Vivary: screenshot and text side by side.
2. Projects: four cards in a 2 by 2 grid, each linking to its live site, picked by slug in `src/pages/index.astro`. A card needs a screenshot and a `verified` stamp or the build fails. Then three rows linking to project pages.
3. Writing: the three newest posts as rows.
4. For agents: the agent note, kept word for word.
5. Get in touch.

## Components

- Cards: no box. A 16:10 screenshot frame, a 600-weight title, a short description, then a mono status and hostname. Hover brightens the screenshot and turns the title gold.
- Buttons: 44px tall, 4px radius, sentence-case label in Plex 600. Primary is amber with space-black text. Secondary is a hairline outline.
- Rows: hairline-separated, title, faint description, mono status.
- Radius: 4px. No shadows.

## Motion

- Little of it. `cubic-bezier(0.22, 1, 0.36, 1)`. Hover color changes, and `.reveal` fade-up on the project cards and agent note, gated so no-JS readers see everything. Nothing moves in the hero.
- Full `prefers-reduced-motion` support.

## Speed

Part of the design, not an afterthought. Details are in the README under Speed. In short: prerender on hover, inlined CSS, self-hosted subset fonts with width-matched fallbacks, AVIF hero, first image eager and the rest lazy, native view transitions, a network-first service worker with offline support, and a 240 KB first-visit budget enforced at build. Lighthouse on the 2026-10-26 build: 100 performance, 100 accessibility, 100 best practices on mobile and desktop. SEO reads 92 only because Lighthouse does not know the `Content-Signal` and `Agentmap` lines in robots.txt, which the agent-readiness checks need.

## Social card

`scripts/generate-og.mjs` builds `public/og-default.png` from the hero image.

## Bans

Gradient text, glow, glassmorphism, stock photos, decorative illustration, side-stripe borders, hard offset shadows, `$` prompts, glitch effects, marquee, em dashes in copy.
