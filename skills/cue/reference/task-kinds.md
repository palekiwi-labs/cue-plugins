# Cue Task Kinds (`kind:`) Reference

The `kind:` frontmatter field explicitly defines the scope, operational expectations, and expected outputs of a `task` card.

```yaml
---
title: "Task title"
kind: build # research | design | build | review | coord
status: open
priority: normal
---
```

---

## Task Kinds

### 1. `kind: research` (Exploration & Feasibility)

- **Purpose**: Explore new ideas, evaluate third-party tools or crates, test hypotheses, and answer technical unknowns.
- **Goal**: Produce knowledge, findings, trade-off analysis, and feasibility assessments.
- **Outputs**:
  - Diagnostic traces (`trace/`)
  - Research documents (`doc/`)
  - Exploration notes (`note/`)
  - Milestone history entries (`log.md`)
- **Guidelines**: Focus strictly on answering research questions. Do not write feature implementation code or draft target repository specs during a research task.

### 2. `kind: design` (Specification & Context Setup)

- **Purpose**: Translate research findings into feature specifications and set up implementation contexts.
- **Goal**: Produce self-contained, actionable contexts that implementation agents can pick up independently.
- **Outputs**:
  - Feature specifications (`spec/`)
  - Initialized implementation task card(s) (`.cue/master/task/`)
  - Supporting reference documents (`doc/` or `trace/`)
- **Guidelines**: Do not implement feature code during a design task. A design task is complete when the implementation task is fully provisioned with spec and context.

### 3. `kind: build` (Implementation & Testing)

- **Purpose**: Construct features, fix bugs, write unit/integration tests, and execute implementation plans in a repository.
- **Goal**: Deliver working, verified code changes.
- **Outputs**:
  - Code diffs
  - Passing test suites
  - Executive plans (`plan/`)
  - Milestone history entries (`log.md`)
- **Guidelines**: Follow test-driven development (TDD) principles where applicable. Ensure all acceptance criteria evidence fields are populated before completing.

### 4. `kind: review` (Code Review & Eval Generation)

- **Purpose**: Inspect code diffs, perform static/dynamic analysis, record review feedback, capture anti-patterns, and verify review fixes.
- **Goal**: Ensure quality and correctness through unbiased evaluation while capturing structured review data for tool evaluation ("evals").
- **Outputs**:
  - Review traces (`trace/`)
  - Pre-review and post-review diff snapshots
  - Review comment payloads
  - Anti-pattern reference documents (`doc/`)
  - Approval attestations
- **Guidelines**: Operates independently from `build` to eliminate self-review bias. Completed review task contexts serve as immutable test scenarios and expected solutions for fine-tuning review tools.

### 5. `kind: coord` (Orchestration & Supervision)

- **Purpose**: Oversee initiatives that span multiple repositories, modules, or sub-tasks, enforce contracts, and supervise child tasks.
- **Goal**: Ensure end-to-end alignment and integration across boundaries.
- **Outputs**:
  - Child task definitions
  - Cross-boundary verification logs
  - High-level milestone tracking
- **Guidelines**: Satisfied when all child tasks are complete and end-to-end integration is verified.

---

## Lifecycle Flow & Handoffs

```
[ Research ] ──> [ Design ] ──> [ Build ] ──> [ Review ] ──> [ Coordinate ]
```

1. **Research** (`kind: research`): Explore unknowns and answer technical questions.
2. **Design** (`kind: design`): Write specifications and set up implementation task cards.
3. **Build** (`kind: build`): Implement and test code.
4. **Review** (`kind: review`): Perform code review, record feedback/anti-patterns, and verify fixes.
5. **Coordinate** (`kind: coord`): Oversee multi-component releases and verify end-to-end integration.

Projects can enter directly at `kind: build` for routine chores or bug fixes without preceding research/design tasks.
