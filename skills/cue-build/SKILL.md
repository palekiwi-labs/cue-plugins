---
name: cue-build
description: Behavioural contract for cue tasks of kind build. Use when working on a task whose kind is build, or when implementing features, fixing bugs, writing tests, and executing an implementation plan.
---

# Build Task Sessions (`kind: build`)

A build task delivers working, verified code.

## Purpose and Outputs

- **Purpose**: Implement features, fix bugs, and write tests against an
  agreed specification or plan.
- **Outputs**: Code changes, passing tests, executive plans (`plan/`),
  deferred items (`todo/`), and milestone history (`log.md`).

## Completion

A build task is complete when every acceptance criterion on the card is
satisfied with evidence, and all task-scoped `todo` artifacts are resolved.

## Boundaries

- Implement the requested scope only. Capture out-of-scope discoveries as
  `todo` or `note` artifacts.
- Never include `.cue/` changes in a commit.

<!-- Placeholder. Extend with behavioural guidance as this kind is
exercised in practice. -->
