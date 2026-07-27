---
title: Bellamente
description: Local-first long-term memory for AI agents. Every recall is traced, every correction is versioned, and the data stays on your machine.
tags: [memory, agents, open-source]
stack: [TypeScript, Bun, PGlite, pgvector, MCP]
repoUrl: https://github.com/The-Little-AI-Company/bellamente
liveUrl: https://the-little-ai-company.github.io/bellamente/
screenshots:
  - src: ./_images/bellamente.webp
    alt: Bellamente local-first memory product page
date: 2026-07-07
featured: true
portfolioGroup: studio
status: alpha
order: 2
---

Bellamente gives AI agents long-term memory that stays on your machine. It stores durable facts, recalls them semantically, and plugs into tools such as Codex, Claude Code, Cursor, and Cline through MCP.

## Why it matters

Agent memory should be inspectable. Bellamente logs every recall with its query, matches, and scores. Corrections create new versions instead of silently replacing the past, and forgetting is reversible.

## What it ships

- One local process with an embedded Postgres and pgvector store
- Local embeddings with no hosted memory account or telemetry
- MCP tools for recall, writing, correction, history, documents, and trace inspection
- A credential gate that redacts common secrets before storage
- Portable export and import

Version 0.1 is an early but working release for Windows and Linux. The public roadmap says what remains unfinished.
