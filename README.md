# jeffkazzee.dev

Personal portfolio — projects from [GitHub](https://github.com/Jeff-Kazzee) and things built on my [Zo computer](https://jeffkazzee.zo.space), plus writing mirrored from [Substack](https://jeffkazzee.substack.com).

Built with [Astro](https://astro.build), hand-rolled brutalist CSS (no framework), deployed on Cloudflare Pages.

## Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Install dependencies                         |
| `npm run dev`     | Start dev server at `localhost:4321`         |
| `npm run build`   | Type-check + build production site to `dist/`|
| `npm run preview` | Preview the build locally                    |

## Content

- Projects: `src/content/projects/*.md` — one file per project
- Blog: `src/content/blog/*.md` — Substack mirrors carry `canonicalUrl` pointing at the original

## Deploy

Cloudflare Pages: framework preset **Astro**, build `npm run build`, output `dist`, `NODE_VERSION=22`.
