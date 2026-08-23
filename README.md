# jeffkazzee.dev

Personal portfolio with projects from [GitHub](https://github.com/Jeff-Kazzee), things built on my [Zo computer](https://jeffkazzee.zo.space), and writing published on this site.

Built with [Astro](https://astro.build), hand-rolled editorial CSS, and deployed on Vercel.

## Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Install dependencies                         |
| `npm run dev`     | Start dev server at `localhost:4321`         |
| `npm run build`   | Type-check + build production site to `dist/`|
| `npm run preview` | Preview the build locally                    |

## Content

- Project entries live in `src/content/projects/*.md`, with one file per project.
- Blog posts live in `src/content/blog/*.md`. Older Substack imports keep `canonicalUrl` pointing at the original edition.

## Deploy

Vercel deploys pushes to `main` through its GitHub integration. `vercel.json`
pins the Astro preset, `npm run build`, the `dist` output directory, and the
site's cache and security headers. Use a branch deployment as the preview gate
before merging to `main`.
