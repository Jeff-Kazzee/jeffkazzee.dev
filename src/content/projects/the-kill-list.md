---
title: The Kill List
description: A privacy-first Zo tool that finds recurring subscription charges and stamps each bill KILL, KEEP, or TRIM.
tags: [finance, privacy, zo]
stack: [Built on Zo Computer, TypeScript, Bun, Gmail]
repoUrl: https://github.com/Jeff-Kazzee/kill-list-engine
liveUrl: https://kill-list-jeffkazzee.zocomputer.io/
screenshots:
  - src: ./_images/kill-list.webp
    alt: The Kill List subscription review tool
date: 2026-07-10
builtOn: zo
portfolioGroup: zo
status: shipped
order: 1
---

The Kill List helps you find recurring subscription charges without sending your inbox to somebody else's server. Your own Zo reads the receipts locally and stamps each bill **KILL**, **KEEP**, or **TRIM**.

## Privacy is part of the product

- Gmail access is read-only
- Dollar amounts are parsed and summed by deterministic code
- Personal receipt data stays on your machine
- The public site receives only fixed progress states
- Sharing a sanitized receipt is a separate, explicit choice

The engine is public so you can inspect the contract before connecting anything.
