---
title: Loam
description: A zero-dependency Python CLI that uses folder paths as types for Markdown knowledge bases.
tags: [agents, tooling, open-source]
stack: [Python, Markdown, YAML]
repoUrl: https://github.com/Jeff-Kazzee/loam
date: 2026-06-13
status: alpha
order: 6
---

Loam uses folder paths as types and validates the Markdown and YAML files inside them. This gives a file-based knowledge base a schema without adding a database or application.

It fits agent workspaces where the file tree needs to tell people and tools what kind of knowledge belongs in each folder.

## What it does

- Treats folder paths as knowledge types
- Validates Markdown/YAML structure
- Keeps the source files plain and portable
- Gives agents folder-level type information instead of one flat collection of notes
