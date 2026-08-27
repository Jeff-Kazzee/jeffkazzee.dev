---
title: sdlc-skills
description: The software development lifecycle as installable agent skills. Plan, design, test, implement, review, and learn, on whatever coding agent you use.
tags: [agents, skills, open-source]
stack: [Markdown, agent skills]
repoUrl: https://github.com/Jeff-Kazzee/sdlc-skills
date: 2026-07-25
shelf: tools
featured: true
order: 5
status: shipped
verified: 2026-08-27
metric:
  value: "6"
  label: agent skills
screenshots:
  - src: ./_images/sdlc-skills.png
    alt: "The sdlc-skills mascot: a sharp-eyed ink-drawn owl holding a red pen, perched on a stack of index cards with one line circled"
---

Ask a coding agent to review your work carefully and you get a different review every time. Hand it the review procedure you actually use and you get the same one.

sdlc-skills writes the development lifecycle down as skills an agent loads when they apply: plan, design, test, implement, review, and learn. Each skill names its gates and its failure modes, so the agent follows a process instead of inventing one.

## Why skills instead of a product

A skill is a Markdown file. It runs on Claude Code, Codex, Cursor, or whatever you switch to next quarter, and you can read the whole thing before you trust it.

This site publishes its own skills in the same format, at [/.well-known/agent-skills/index.json](/.well-known/agent-skills/index.json).
