# Publish a post on jeffkazzee.dev

Write new posts on this site. Older imported posts can keep their Substack
canonical URL.

## Add a post

1. Copy `src/content/blog/_template.md` to a lowercase hyphenated filename.
2. Replace the title, description, date, tags, and body.
3. Keep `draft: true` while editing.
4. Run `npm run build` and open the generated post locally.
5. Set `draft: false` when the post is ready for the next deployment.

The filename becomes the public path. For example,
`src/content/blog/notes-from-building-val.md` becomes
`/blog/notes-from-building-val/`.

## Canonical URLs

Do not add `canonicalUrl` to a post written for jeffkazzee.dev. The site uses its
local URL as the canonical URL.

Keep `canonicalUrl` only when another site published that exact post first. The
current Substack imports use it so search engines can identify the original
edition.

## Before publishing

- Check every link.
- Add alt text for each image.
- Confirm the title and description match the post.
- Read the rendered page on desktop and mobile.
- Confirm the RSS item links to the local post.
