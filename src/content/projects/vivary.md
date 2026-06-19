---
title: Vivary
description: "The create-t3-app for agent workspaces: a CLI scaffold with a typed knowledge graph, a self-improving loop, and graph-aware review."
tags: [agents, tooling, open-source]
stack: [Python, npm, Markdown, YAML]
repoUrl: https://github.com/vivary-dev/vivary
liveUrl: https://vivary.vercel.app/
screenshots:
  - src: ./_images/vivary.png
    alt: Vivary landing page showing the agent-workspace scaffold and typed graph concept
date: 2026-06-15
featured: true
status: alpha
order: 2
---

Vivary is the installable workspace shell for serious agent work: run the scaffold, pick a preset, and get a small world with state, memory boundaries, gates, and a typed Markdown graph.

## Why it exists

Agents work better when the workspace itself has structure. Vivary gives them a place to stand: files they can find, rules they can follow, and verification steps they can run without turning the project into a giant framework.

## What it does

- Scaffolds agent-native workspaces with `create-vivary`
- Adds a typed knowledge graph through Tropo
- Adds graph-aware review through Ozone
- Adds coordination surfaces through Exo
- Keeps the underlying workspace plain Markdown and YAML

## The proof point

The important command is not just the initializer. It is `doctor`: the self-check that proves the workspace shell, privacy boundaries, and graph health are still intact.
