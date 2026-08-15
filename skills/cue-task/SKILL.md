---
name: cue-task
description: |
  Lifecycle, classification (kind), hierarchy (parent), and operational guidelines for cue task cards.
  Use when creating, structuring, or executing cue tasks.
---

# Cue Task Protocol

The `task` artifact is the central unit of work and kanban card in `cue`. Every
task lives on the master branch at `.cue/master/task/<slug>.md`.

## Task Frontmatter Schema

```yaml
---
title: "Short display title"
kind: build # research | design | build | review | coord
status: open # open | in-progress | complete | closed
priority: normal # critical | high | normal | low
parent: parent-slug # optional: slug of parent task
refs:
  - .cue/master/spec/index.md
branch: []
---
```

---

## Task Categories (`kind:`)

The `kind:` field explicitly defines the scope and operational expectations of a task.

### 1. `kind: research` (Exploration & Feasibility)

- **Purpose**: Explore new ideas, evaluate third-party tools or crates, test hypotheses, and answer technical unknowns.
- **Goal**: Produce knowledge, findings, and trade-off analysis.
- **Outputs**: Diagnostic traces (`trace/`), research documents (`doc/`), notes (`note/`), and history logs (`log.md`).
- **Guidelines**: Focus strictly on answering research questions. Do not write feature code or draft target repository specs during a research task.

### 2. `kind: design` (Specification & Context Setup)

- **Purpose**: Translate research findings into feature specifications and set up implementation contexts.
- **Goal**: Produce self-contained, actionable contexts that implementation agents can pick up independently.
- **Outputs**:
  - Feature specifications (`spec/`).
  - Initialized implementation task card(s) (`.cue/master/task/`).
  - Supporting reference documents (`doc/` or `trace/`).
- **Guidelines**: Do not implement feature code during a design task. A design task is complete when the implementation task is fully provisioned with spec and context.

### 3. `kind: build` (Implementation & Testing)

- **Purpose**: Construct features, fix bugs, write unit/integration tests, and execute implementation plans in a repository.
- **Goal**: Deliver working, verified code changes.
- **Outputs**: Code diffs, passing test suites, execution plans (`plan/`), and milestone logs (`log.md`).
- **Guidelines**: Follows test-driven development (TDD) where applicable.

### 4. `kind: review` (Code Review & Eval Generation)

- **Purpose**: Inspect code diffs, perform static/dynamic analysis, record review feedback, capture anti-patterns, and verify review fixes.
- **Goal**: Ensure quality and correctness through unbiased evaluation while capturing structured review data for tool evaluation ("evals").
- **Outputs**: Review traces (`trace/`), pre-review and post-review diff snapshots, review comment payloads, anti-pattern reference documents (`doc/`), and approval attestations.
- **Guidelines**: Operates independently from `build` to eliminate self-review bias. Completed review task contexts serve as immutable test scenarios and expected solutions for fine-tuning review tools.

### 5. `kind: coord` (Orchestration & Supervision)

- **Purpose**: Oversee initiatives that span multiple repositories, modules, or sub-tasks, enforce contracts, and supervise child tasks.
- **Goal**: Ensure end-to-end alignment and integration across boundaries.
- **Outputs**: Child task definitions, cross-boundary verification logs, high-level milestone tracking.
- **Guidelines**: Satisfied when all child tasks are complete and end-to-end integration is verified.

---

## Lifecycle Flow & Handoffs

1. **Research** (`kind: research`): Explore unknowns and answer questions.
2. **Design** (`kind: design`): Write specifications and set up implementation task cards.
3. **Build** (`kind: build`): Implement and test code.
4. **Review** (`kind: review`): Perform code review, record feedback/anti-patterns, and verify fixes.
5. **Coordinate** (`kind: coord`): Oversee multi-component releases and verify end-to-end integration.

Projects can enter directly at `kind: build` for simple chores or bug fixes without preceding research/design tasks.

---

## Examples

See [EXAMPLES.md](EXAMPLES.md) for concrete examples of task cards, parent-child hierarchies, and `cue list` query commands.
