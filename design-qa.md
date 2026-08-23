# Design QA: Orbiting Field Notes

Date: 2026-08-23

Final result: passed with focused captures as the evidence source

## Target

Jeff selected Option 1, Orbiting Field Notes. The implementation follows that
direction without mixing in the other concepts.

- Source image:
  `C:\Users\jeffk\.codex\generated_images\01a0302d-2a5f-7621-9f1e-aa027acb2b9e\exec-0043afb3-9804-438f-98d1-7a3a7f60a227.png`
- Source dimensions: 887 x 1774 pixels
- Source state: dark mode, full desktop concept
- Source shown in the QA browser at:
  `design/qa/reference-option-1-hero.png`

## Implementation evidence

Desktop checks used a 1280 x 720 CSS-pixel viewport. The in-app browser saved
the visible page area at 1265 x 712 pixels because its scrollbar and browser
surface are outside the capture.

- Dark hero: `design/qa/home-hero-dark-final.png`
- Light hero: `design/qa/home-hero-light-final.png`
- Project list: `design/qa/home-projects-dark-final.png`
- Writing cards: `design/qa/home-writing-dark-final.png`
- Paid-work call to action and footer: `design/qa/home-cta-dark-final.png`
- Full-page capture: `design/qa/home-full-dark-final-stitch.png`

The browser's full-page capture has a known high-DPI stitching artifact. It can
repeat a strip where the browser joins screenshots. DOM counts confirmed that
the page contains one project section, five project rows, one writing section,
and three post cards. The focused desktop captures above are the visual source
of truth.

Responsive checks requested a 390 x 844 browser viewport. The in-app browser's
captured content area measured 375 x 811 pixels after browser chrome.

- Mobile hero: `design/qa/home-mobile-dark-390x844.png`
- Mobile projects: `design/qa/home-mobile-projects-390x844.png`
- Mobile writing: `design/qa/home-mobile-writing-390x844.png`
- Mobile call to action: `design/qa/home-mobile-cta-390x844.png`

The desktop and source images were opened together in one comparison input at
the same 1280 x 720 browser viewport and in the same dark state. The focused
section captures then checked the rest of the page at readable scale.

## Comparison findings

The implementation retains the selected direction's defining choices:

- a near-black navy field with warm white type, jade actions, and amber status,
- an editorial serif headline beside an orbital project scene,
- five named projects, with Val marked coming soon and Vivary marked deprecated,
- thin-rule project rows with individual planet art,
- three recent writing cards,
- a Moon-horizon paid-work panel, and
- a restrained light mode that leaves the space imagery dark.

The orbit uses one optimized raster asset plus a small pointer-parallax script.
It gives the scene depth without adding a Three.js runtime or blocking the
content. Motion stops when reduced motion is requested.

## Iteration history

1. The first browser pass showed a headline that broke across six lines, rows
   that were too tall, and an oversized paid-work panel.
2. The headline measure was widened to match the source's four-line rhythm.
3. Planet rows, section spacing, the paid-work panel, and footer spacing were
   tightened to match the source's density.
4. Light-mode text on the Work with me page was moved onto the shared color
   tokens so it keeps readable contrast.
5. Desktop and narrow mobile passes showed no horizontal overflow.
6. The final review moved the orbital labels farther inside their safe area,
   clarified the canonical domain in the footer, and preserved a selected
   theme across Astro client-side navigation.

No P0, P1, or P2 visual issue remains in the checked states.

## Interaction and console checks

- Dark and Light controls update `data-theme` and their `aria-pressed` states.
- The stored preference survives Astro client-side navigation.
- Projects, Writing, Work with me, Val, Vivary, Zo 101, and Zo Deep Dive Guides
  all load with the expected title and H1.
- Every homepage anchor has an `href`.
- Homepage console check: zero warnings and zero errors.
- Desktop width check: no horizontal overflow.
- Narrow mobile width check: no horizontal overflow.

Final result: passed
