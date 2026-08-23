---
name: cue-coord
description: |
  Use when working on a task whose kind is coord, or when orchestrating work
  that spans multiple repositories, modules or child tasks and needs end-to-end
  integration verified.
---

# Coordination Task Sessions

A coordination task supervises work that crosses a boundary.

## Boundaries

- Unlike other kinds, a coordination task may create child task contexts.
  Child tasks declare it as `parent:`.
- Delegate implementation to child tasks rather than doing it inline.

<!-- Placeholder. Extend with behavioural guidance as this kind is
exercised in practice. -->
