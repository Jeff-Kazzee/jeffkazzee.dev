---
title: Bellamente
description: Local-first memory for AI agents. Durable facts stay on your own machine, and every recall is logged.
tags: [agents, memory, open-source]
stack: [TypeScript, Python, npm, PyPI]
repoUrl: https://github.com/The-Little-AI-Company/bellamente
liveUrl: https://the-little-ai-company.github.io/bellamente/
date: 2026-08-15
featured: false
order: 30
status: deprecated
verified: 2026-08-27
---

**Deprecated.** Bellamente still installs and runs, but it gets no further work. Treat it as a reference rather than something to build on.

A context window is not memory. It's a desk that gets cleared when the session ends.

Bellamente stores durable facts on your own machine instead of in a hosted vector database you can't see into. It recalls them by meaning rather than by keyword, and it logs every recall, so you can read what the agent actually looked at. It ships on npm and PyPI under the MIT license.

## Why I built it

The agents I use forget everything between sessions, and every hosted answer wanted my working notes on someone else's server. This was the smallest thing that fixed both problems.
