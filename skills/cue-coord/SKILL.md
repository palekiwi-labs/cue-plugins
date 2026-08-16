---
name: cue-coord
description: Behavioural contract for cue tasks of kind coord. Use when working on a task whose kind is coord, or when orchestrating work that spans multiple repositories, modules or child tasks and needs end-to-end integration verified.
---

# Coordination Task Sessions (`kind: coord`)

A coordination task supervises work that crosses a boundary.

## Purpose and Outputs

- **Purpose**: Oversee initiatives spanning multiple repositories or
  modules, define and track child tasks, and enforce contracts between
  them.
- **Outputs**: Child task cards (`.cue/master/task/`), cross-boundary
  verification records, and milestone history (`log.md`).

## Completion

A coordination task is complete when all child tasks are complete and
end-to-end integration has been verified.

## Boundaries

- Unlike other kinds, a coordination task may create child task contexts.
  Child tasks declare it as `parent:`.
- Delegate implementation to child tasks rather than doing it inline.

<!-- Placeholder. Extend with behavioural guidance as this kind is
exercised in practice. -->
