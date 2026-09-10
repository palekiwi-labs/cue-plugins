---
name: cue-review
description: Use when the session mode is review.
---

# Review Sessions

A review session evaluates work it did not produce.

## Purpose and Outputs

- **Purpose**: Inspect diffs, analyse quality and correctness, record
  findings, and verify fixes.
- **Outputs**: Review traces (`trace/`), anti-pattern reference notes
  (`note/`), and milestone history (the context log).

## Boundaries

- Operates separately from `build` to avoid self-review bias.
- Record findings; do not silently fix them.

<!-- Placeholder. Extend with behavioural guidance as this mode is
exercised in practice. -->
