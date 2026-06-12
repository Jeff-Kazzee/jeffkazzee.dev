# Design

Warm gallery. The site is a small, well-lit room where shipped work hangs on warm paper walls. Reference: Aesop-style warm-paper restraint, with one deep green accent carrying the old identity forward. Replaces the 2026-05 terminal/brutalist system.

## Visual Theme

- Register: brand (portfolio)
- Theme: light, warm. Daytime reading on a laptop; a hiring manager skimming between meetings.
- Color strategy: Restrained. Tinted warm neutrals everywhere; deep pine green is the single accent, used for links, primary actions, and the live-status wink.

## Color Palette (OKLCH)

| Token | Value | Role |
|---|---|---|
| `--paper` | `oklch(96.5% 0.012 92)` | page background |
| `--paper-deep` | `oklch(93.5% 0.016 90)` | recessed bands, code blocks |
| `--card` | `oklch(98.4% 0.007 95)` | raised surfaces |
| `--ink` | `oklch(26% 0.018 70)` | headings, body |
| `--ink-soft` | `oklch(42% 0.022 75)` | secondary text |
| `--ink-faint` | `oklch(55% 0.02 80)` | captions, metadata |
| `--line` | `oklch(86% 0.018 88)` | hairline borders (1px, never slabs) |
| `--pine` | `oklch(43% 0.085 158)` | accent: links, primary buttons, active nav |
| `--pine-deep` | `oklch(35% 0.075 160)` | accent hover |
| `--moss` | `oklch(64% 0.16 150)` | live-status dot only (the matured neon green) |
| `--moss-tint` | `oklch(93% 0.035 152)` | accent wash backgrounds |
| `--amber` | `oklch(58% 0.115 75)` | wip/demo status text |

Never `#000`/`#fff`. Every neutral is tinted warm (hue 70–95).

## Typography

- Display + prose: **Literata** (variable: opsz 7–72, wght). A book face: warm, exacting, humane. Headings wght 520–600, no uppercase, tracking -0.015em.
- UI + captions: **Hanken Grotesk** (variable). Nav, cards, badges, metadata, buttons.
- Loaded from Google Fonts CDN with preconnect; no npm font packages.
- Scale (fluid, ratio ≥1.3): h1 `clamp(2.4rem, 5.5vw, 3.75rem)`; h2 `clamp(1.6rem, 3.2vw, 2.2rem)`; h3 `1.25rem`; body `1.0625rem` sans / `1.125rem` serif prose, line-height 1.75.
- Measure: 66ch prose cap.
- Italics are seasoning (footer motto, image captions), not section grammar.

## Components

- **Section headings**: plain serif h2, generous space above (no kickers, no $ prompts, no rules).
- **Cards**: `--card` bg, 1px `--line` border, 10px radius, soft warm layered shadow on hover with 2px lift. Zo-shelf cards lead with their screenshot.
- **Buttons**: pill (999px radius), sans 600. Primary: pine bg, paper text. Quiet: 1px line border, ink text, pine border on hover.
- **Status**: small dot + sans label; shipped = pine, alpha/wip/demo = amber. Live dot (`--moss`) pulses softly; the one permitted wink on the home page.
- **Badges**: sans 0.72rem, `--paper-deep` bg, 999px radius, no borders, lowercase.
- **Images**: 10px radius, 1px line border. Screenshots are the exhibits; give them room.
- **Blockquotes**: Literata italic, indented, no colored border stripe.

## Layout & Spacing

- Site max 70rem, left-aligned hero, asymmetry over centered stacks.
- Spacing breathes: hero `clamp(4rem, 12vh, 7rem)` top; sections separated by `clamp(4rem, 10vh, 6rem)`; tight groupings inside cards.
- Featured work: spacious list rows (title, status, description, stack), not identical card grids. Zo shelf: image-led card grid (the screenshots justify cards there).

## Motion

- Ease: `cubic-bezier(0.22, 1, 0.36, 1)` (out-quint). Durations 200–500ms.
- One soft staggered fade-up on scroll (`.reveal`, IntersectionObserver). No typewriter, glitch, marquee, or hard-shadow physics.
- Full `prefers-reduced-motion` support: everything settles instantly.

## Bans carried from PRODUCT.md

Monospace as voice, `$` prompts, glitch, marquee, neon-on-black, hard offset shadows, side-stripe borders, uppercase headings, gradient text.
