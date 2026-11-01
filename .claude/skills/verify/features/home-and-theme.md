# Home page and theme

The home page loads fast on a phone, shows its heading, and the site keeps its
dark palette. The Halloween 2026 theme stays off after its cutoff.

## Sub-features

- `home-load` returns 200 with the heading from `acceptance.md` (A1).
- `home-budget` keeps the first phone visit inside `scripts/check-budget.mjs` limits (A9).
- `theme-palette` matches live production's body background, text color, `--bg` and `--ink` (A5).
- `theme-seasonal` makes no `/halloween/` request and sets no `data-halloween` attribute after 2026-11-01T00:00-06:00 (A6).
- `page-parity` keeps every page byte-identical to live unless the branch means to change it (A11).

## How to get to it (user POV)

- Open `https://jeffkazzee.dev/` on a phone or desktop.

## Driving it with browser.mjs and checks.mjs

Preconditions:

- Doctor passes and live production is reachable.

- **Load.** Open `/`. The document status is 200 and the first `h1` reads the Home page heading. Screen: `home.png`.
- **Budget.** `node scripts/check-budget.mjs` exits 0. Launch skips this step on purpose, so an oversized page fails here and the other journeys still run.
- **Palette.** Open `/` and `/projects/` on live, then locally, and read the computed body colors and the two custom properties. They must be equal. Screens: `palette-*.png`.
- **Seasonal.** Every sitemap page load is watched for `/halloween/` requests and the attribute.
- **Parity.** Each built page is compared byte for byte with the live page. Copies of the live pages are in `live/`.

## Gotchas

- Parity reports CHANGED, not FAIL. A changed page is fine only when the
  branch's intent explains it. Diff the built page with its copy in `live/`.
- Once the Halloween cleanup merges, every page on a branch without it shows
  CHANGED. That is expected.
- The site has no theme toggle. Theme means the rendered palette.
