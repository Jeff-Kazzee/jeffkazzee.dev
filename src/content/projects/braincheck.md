---
title: Braincheck
description: A zero-dependency Python typechecker for Markdown knowledge bases and YAML front matter.
tags: [agents, tooling, open-source]
stack: [Python, Markdown, YAML]
repoUrl: https://github.com/Jeff-Kazzee/braincheck
date: 2026-06-13
status: alpha
order: 7
---

Braincheck checks Markdown knowledge bases before inconsistent front matter breaks scripts or confuses agents. It keeps metadata predictable for people and the tools that read it.

## What it does

- Checks YAML front matter across a Markdown workspace
- Flags front matter that drifts from the workspace schema
- Runs as a lightweight Python CLI
- Keeps agent-readable notes consistent without adding a runtime dependency
