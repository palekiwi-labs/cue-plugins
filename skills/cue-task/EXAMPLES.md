# Cue Task Examples

This document provides concrete examples of task cards, parent-child hierarchies, and CLI query commands.

---

## 1. Single-Repo Feature Progression

### Research Task (`kind: research`)

File: `.cue/master/task/worktree-store-research.md`

```yaml
---
title: "Research worktree store resolution options"
kind: research
status: complete
priority: high
refs:
  - .cue/master/spec/index.md
---

# Research worktree store resolution options

Evaluate mechanisms for auto-resolving git worktree stores to shared main repo cue stores.

## Acceptance Criteria

1. **Trade-offs documented.**
   - Verify by: review design doc
   - Evidence: doc created at .cue/master/doc/worktree-store-design.md
```

### Design Task (`kind: design`)

File: `.cue/master/task/worktree-store-design.md`

```yaml
---
title: "Design worktree store auto-resolution"
kind: design
status: complete
priority: high
parent: worktree-store-research
refs:
  - .cue/master/doc/worktree-store-design.md
---

# Design worktree store auto-resolution

Draft the feature specification and create implementation task context in cuelib.

## Acceptance Criteria

1. **Spec written.**
   - Verify by: check file existence
   - Evidence: .cue/master/spec/cue/worktree-auto-store-resolution.md

2. **Implementation task provisioned.**
   - Verify by: check task file existence
   - Evidence: .cue/master/task/worktree-store-resolution-impl.md
```

### Build Task (`kind: build`)

File: `.cue/master/task/worktree-store-resolution-impl.md`

```yaml
---
title: "Implement worktree store resolution in cuelib"
kind: build
status: complete
priority: high
parent: worktree-store-design
refs:
  - .cue/master/spec/cue/worktree-auto-store-resolution.md
---

# Implement worktree store resolution in cuelib

Implement store auto-resolution in store.rs and add unit tests.

## Acceptance Criteria

1. **Unit tests pass.**
   - Verify by: `cargo test --package cuelib`
   - Evidence: exit code 0
```

### Review Task (`kind: review`)

File: `.cue/master/task/worktree-store-resolution-review.md`

```yaml
---
title: "Review worktree store resolution implementation"
kind: review
status: open
priority: high
parent: worktree-store-resolution-impl
refs:
  - .cue/master/task/worktree-store-resolution-impl.md
---

# Review worktree store resolution implementation

Perform independent code review of worktree store resolution diff, capture pre/post diffs, review comments, and anti-patterns for review evals.

## Acceptance Criteria

1. **Pre-review diff & comments captured.**
   - Verify by: check trace artifacts
   - Evidence: .cue/worktree-store-resolution-review/trace/pre-review.diff and comments.json

2. **Review comments addressed & post-review diff verified.**
   - Verify by: check trace artifacts
   - Evidence: .cue/worktree-store-resolution-review/trace/post-review.diff and approval.log
```

---

## 2. Multi-Component Coordination Example

### Parent Coordination Task (`kind: coord`)

File: `.cue/master/task/cue-agent-review-release.md`

```yaml
---
title: "Coordinate cue-agent and cue-review release"
kind: coord
status: in-progress
priority: critical
---

# Coordinate cue-agent and cue-review release

Orchestrate child implementation and review tasks across cue-agent and cue-review crates.

## Acceptance Criteria

1. **Child tasks complete.**
   - Verify by: `cue list --type task --filter parent=cue-agent-review-release`
   - Evidence: (all status: complete)

2. **End-to-end integration verified.**
   - Verify by: `cargo test --workspace`
   - Evidence: (exit code 0)
```

### Child Build Task (`kind: build`)

File: `.cue/master/task/cue-agent-crate.md`

```yaml
---
title: "Implement cue-agent crate"
kind: build
status: in-progress
priority: high
parent: cue-agent-review-release
---

# Implement cue-agent crate

Implement cue-agent runner and CLI harness.

## Acceptance Criteria

1. **Tests pass.**
   - Verify by: `cargo test --package cue-agent`
   - Evidence: (exit code 0)
```

---

## 3. Querying Tasks with `cue list`

Filter tasks by `kind`:

```bash
cue list --type task --filter kind=research
cue list --type task --filter kind=design
cue list --type task --filter kind=build
cue list --type task --filter kind=review
cue list --type task --filter kind=coord
```

Filter child tasks by `parent` slug:

```bash
cue list --type task --filter parent=cue-agent-review-release
```

Combine filters:

```bash
cue list --type task --filter kind=review --filter parent=worktree-store-resolution-impl
```
