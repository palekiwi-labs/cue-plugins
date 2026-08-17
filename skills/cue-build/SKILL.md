---
name: cue-build
description: |
  Use when working on a task whose kind is build, or executing an implementation
  plan.
---

# Build Task Sessions

A build task delivers working, verified code.

## Purpose and Outputs

- **Purpose**: Implement features, fix bugs, and write tests against an
  agreed specification or plan.
- **Outputs**: Code changes, passing tests, executive plans (`plan/`),
  deferred items (`todo/`), and milestone history (`log.md`).

## Acceptance Criteria & Manual QA

When defining or executing acceptance criteria for a build task, evaluate
whether manual QA testing by a human operator is required alongside automated
tests.

- **Manual QA Criteria**: For user-facing features, CLI UX, editor plugins, or
  interactive tools, include manual QA in acceptance criteria (e.g., `Manual
  QA: User verifies flag in interactive shell`).
- **Evidence Attestation**: Never fill human-attested evidence autonomously.
  Await explicit user attestation before marking a manual QA criterion as
  passed.

## Completion

A build task is complete when every acceptance criterion on the card is
satisfied with evidence, and all task-scoped `todo` artifacts are resolved.

## Boundaries

- Implement the requested scope only. Capture out-of-scope discoveries as
  `todo` or `note` artifacts.
- Never include `.cue/` changes in a commit.

<!-- Placeholder. Extend with behavioural guidance as this kind is
exercised in practice. -->
