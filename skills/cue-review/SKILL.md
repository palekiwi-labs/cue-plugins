---
name: cue-review
description: Behavioural contract for cue tasks of kind review. Use when working on a task whose kind is review, or when inspecting diffs, evaluating code quality, recording review feedback, and verifying that review fixes hold.
---

# Review Task Sessions (`kind: review`)

A review task evaluates work it did not produce.

## Purpose and Outputs

- **Purpose**: Inspect diffs, analyse quality and correctness, record
  findings, and verify fixes.
- **Outputs**: Review traces (`trace/`), anti-pattern reference documents
  (`doc/`), and milestone history (`log.md`).

## Completion

A review task is complete when every finding has been recorded and either
resolved, deferred to a `todo`, or explicitly accepted.

## Boundaries

- Operates separately from `build` to avoid self-review bias.
- Record findings; do not silently fix them.

<!-- Placeholder. Extend with behavioural guidance as this kind is
exercised in practice. -->
