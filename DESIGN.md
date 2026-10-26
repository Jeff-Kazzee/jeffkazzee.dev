# Design

Mountains in deep space. The home page opens on the Cosmic Cliffs of the Carina Nebula, photographed by the James Webb Space Telescope: a ridge of gold and rust gas under a field of stars. The rest of the site is the dark sky around it. Bold, cold, and earned. Replaces the Earthrise night-gallery system on 2026-10-25 at Jeff's direction.

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

- Display: **Big Shoulders** 800 to 900. Headlines only. Uppercase on the home page. Never below 24px.
- Body and UI: **IBM Plex Sans** 400, 600, and 400 italic. `--font-serif` now points here so long-form pages keep working.
- Labels, metadata, nav, buttons: **JetBrains Mono** 400 and 500, uppercase with letter spacing. Mono is for labels and code, never for body copy.
- Google Fonts CDN with preconnect, `display=swap`. Self-hosting subset WOFF2 files is the next speed step.
- Home hero h1: `clamp(3.75rem, 10.5vw, 10.5rem)`, line height 0.86, max 12ch.
- Body: 1.125rem, line height 1.65, measure 68ch.

## Hero (home)

- Full-bleed `<Image>` of `src/assets/cosmic-cliffs.jpg` (3200px source). Astro writes WebP at 960, 1600, 2400 and 3200 wide, 68 to 418 KB. Loaded eagerly with `fetchpriority="high"`.
- The header sits over the image (`overlayHeader` on `BaseLayout`).
- A vertical scrim darkens the top for the header and fades to `--bg` at the bottom so the headline sits on dark rust, never the bright ridge.
- Content bottom-left: now line with the live dot, headline, lede, two buttons, image credit bottom-right.

## Home page sections

1. Now: Vivary as the feature. Screenshot in a framed panel, status, description, stack, links.
2. Work, "Things that load": four cards with screenshots that link to the live sites. Picked by slug in `src/pages/index.astro`. A card must have a screenshot and a `verified` stamp or the build fails.
3. Also: rows that link to project pages on this site.
4. Writing: the three newest posts.
5. For agents: the live site's agent note, kept word for word.
6. Hire band: developer roles, email, work with me.

The Zo-hosted libraries are off the home page while Zo Computer has them asleep (HTTP 503 on 2026-10-25). They stay on `/projects/`.

## Components

- Cards: no box. A 16:10 screenshot frame with a hairline border, a mono metadata row, a Big Shoulders title, a description. Hover brightens the screenshot and turns the title gold.
- Buttons: 48px tall, 2px radius, mono uppercase label. Primary is amber with space-black text. Secondary is a hairline outline.
- Rows: hairline-separated, display title, mono status, faint description.
- Radius: 4px at most. Square screenshot frames. No shadows.

## Motion

- Slow and heavy: `cubic-bezier(0.22, 1, 0.36, 1)`, 400 to 800ms. Things drift, they don't bounce.
- `.rise` on hero lines, `.reveal` on cards and the agent note. Both gated so no-JS readers see everything.
- Full `prefers-reduced-motion` support.

## Social card

`scripts/generate-og.mjs` builds `public/og-default.png` from the hero image.

## Bans

Gradient text, glow, glassmorphism, stock photos, decorative illustration, side-stripe borders, hard offset shadows, `$` prompts, glitch effects, marquee, em dashes in copy.
