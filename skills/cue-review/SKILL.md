---
name: cue-review
description: Use when working on a task whose kind is review.
---

# Review Task Sessions

A review task evaluates work it did not produce.

## Purpose and Outputs

- **Purpose**: Inspect diffs, analyse quality and correctness, record
  findings, and verify fixes.
- **Outputs**: Review traces (`trace/`), anti-pattern reference documents
  (`doc/`), and milestone history (`log.md`).

## Boundaries

- Operates separately from `build` to avoid self-review bias.
- Record findings; do not silently fix them.

<!-- Placeholder. Extend with behavioural guidance as this kind is
exercised in practice. -->
