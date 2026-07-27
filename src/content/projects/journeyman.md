---
title: Journeyman
description: An apprenticeship agent for career changers that plans real practice, reviews the work, and refuses to do the homework for you.
tags: [education, agents, open-source]
stack: [Next.js, PostgreSQL, Prisma, Codex CLI, Telegram]
repoUrl: https://github.com/The-Little-AI-Company/journeyman
liveUrl: https://the-little-ai-company.github.io/journeyman/
screenshots:
  - src: ./_images/journeyman.webp
    alt: Journeyman apprenticeship agent public demo
date: 2026-07-19
featured: true
portfolioGroup: studio
status: demo
order: 3
---

Journeyman is an AI mentor for adults changing careers. Give it the job you want and real job postings; it finds the gaps, builds a practice plan, reviews your attempts, and helps when you are stuck.

The core rule is simple: it will not do the work for you. Hoolio, the mentor, asks for evidence and unlocks deeper help only after you show your attempt.

## What makes it inspectable

- A public demo, transcript, and white paper
- A deterministic refusal gate instead of a model deciding when to refuse
- Versioned prompt contracts for every agent task
- Structured Codex runs with validation and persisted execution logs
- Local PostgreSQL as the source of truth, with optional Bellamente memory

The repository includes the build briefs, failed passes, reviews, and verification receipts behind the OpenAI Build Week project.
