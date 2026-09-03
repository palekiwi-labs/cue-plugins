---
name: cue
description: Manage context, memory and cross-session continuity using the cue protocol.
---

# Agent Memory System (cue)

This skill provides a structured protocol for managing context and continuity across agent sessions using a dedicated `.cue/` directory structure.

## Core Philosophy

The system is organized around five altitudes:

- **WHAT** - `task/`: the primary unit of work and kanban board card. Lives exclusively on the master branch.
- **WHY** - `spec/`: feature or project specification. Defines what should be true.
- **HOW** - `plan/`: technical approach. Subordinate to a `task`. Contains step-by-step progress checkboxes.
- **DEFER** - `todo/`: deferred actions, QA checklists, or decision points auxiliary to a `task` or `plan`. Must be resolved before task completion.
- **THINK** - `note/`: spontaneous idea capture and conversation anchors. Thoughts outside active work waiting to be examined. Dissolves into its outcome artifact once addressed.

## Frontmatter Management

Markdown artifacts in `cue` use YAML frontmatter as the single source of truth for metadata. Frontmatter MUST be preserved on edits.

### `status:`

Artifacts track lifecycle status: `status: inbox|open|in-progress|complete|closed`.

`inbox` is the intake/triage state: new tasks created through tooling
default to `inbox` and are promoted by the operator to `open` (accepted)
or `in-progress` (active work) once triaged. Other artifact types start
at `open`. Never auto-promote an `inbox` task; triage is an operator
decision.

### `priority:`

Bounded priority classification: `priority: critical|high|normal|low`.

### `kind:`

Task category classification: `kind: research|design|build|review|coord|learn` (see `task` contract below).

### `parent:`

Child artifacts declare their parent via a scalar path or slug: `parent: parent-slug-or-path` (e.g., child task `parent: auth-redesign`, or executive plan `parent: plan/index.md`). Relationships point upward (child -> parent).

### `refs:`

Flat list of relative repository paths linking related artifacts:

```yaml
refs:
  - .cue/master/spec/index.md
  - .cue/master/task/auth-login.md
```

## Directory & Context Structure

Memory artifacts live in a context directory `.cue/<scope>/`, where `<scope>` is `master` (the global context) or a task slug.

### Storage Layouts

1. **Root Artifacts** (`.cue/<context>/<type>/<filename>`): Stable, named anchor documents updated in-place over time.

   - `spec/index.md`: Scope, intent, requirements.
   - `plan/index.md`: Master plan outlining technical architecture and design choices.
   - `task/<slug>.md`: Kanban board card (stored flat exclusively in `.cue/master/task/`).
   - `note/<name>.md`: Root-level idea capture or thread directory (`note/<thread>/index.md`).

2. **Point-in-Time Artifacts** (`.cue/<context>/<type>/<timestamp>-<hash>/<filename>`): Moment-in-time snapshots anchored to git history.
   - `plan/.../<name>.md`: Executive plan for a specific implementation slice.
   - `todo/.../<name>.md`: Deferred actions, QA checklists, or decision points.
   - `trace/.../<name>`: Diagnostic output, error logs, and review artifacts.
   - `tmp/.../<name>`: Ephemeral session data.

### Active Context & Scope Resolution

Context scope determines where artifacts are read and written:

- **Active Context (`.cue/HEAD`)**: Plain-text file containing the active scope
  (`master` or task slug) used exclusively as a human interactive CLI and editor
  default.
- **Explicit Scope Override**: Operations target a specific task context scope
  without modifying `.cue/HEAD`.
- **Global Context (`master`)**: Cross-task shared artifacts. Tasks always
  reside on `master`.

### Agent Task Context Rules

Agents operate under strict task context isolation to prevent race conditions
and cross-task contamination during concurrent sessions:

1. **Explicit Task Parameter Required**: Agents MUST explicitly specify task
   slug on every cue tool call (`cue-add`, `cue-log`, `cue-plan`, etc.) and
   `--task <slug>` on CLI queries.
2. **Prohibition of `.cue/HEAD` Mutation**: `.cue/HEAD` is owned exclusively by
   the human operator.
3. **Subagent Scope Propagation**: When delegating work to subagents, the
   primary agent MUST include the task scope directive in the subagent prompt
   and set `$CUE_TASK` for child processes or sessions when supported.

## Artifact Contracts

### `task` (WHAT)

- Primary unit of work and context anchor; lives exclusively at `.cue/master/task/<slug>.md`.
- Contains high-level description, problem statement, or initiative context.
- Tracked on master across feature branches via `branch:` frontmatter list.

#### Task Categories (`kind:`)

Tasks declare operational expectations via `kind: research|design|build|review|coord|learn`:

- **`kind: research`**: Exploration & feasibility analysis.
- **`kind: design`**: Specification & context setup.
- **`kind: build`**: Feature implementation & test execution.
- **`kind: review`**: Code review & evaluation trace generation.
- **`kind: coord`**: Multi-component or cross-repository orchestration.
- **`kind: learn`**: Tutoring & capability growth for the user.

Each kind has a corresponding skill carrying its behavioural contract, expected
outputs, and completion rule. When working on a task, load the skill matching
its kind: `cue-research`, `cue-design`, `cue-build`, `cue-review`, `cue-coord`,
or `cue-learn`.

### `spec` (WHY)

- Captures intent, scope, and requirements.
- Lives at `.cue/<context>/spec/index.md` (root). Does not contain technical
  implementation details or code snippets.

### `plan` (HOW)

Tracks step-by-step progress using GFM checkboxes (`- [ ]` / `- [x]`).

- **Master Plan (`plan/index.md`)**: Root document establishing overall
  architecture, phases, and design decisions.
- **Executive Plan (`plan/<timestamp>-<hash>/<slice>.md`)**: Point-in-time slice
  linked to master plan via `parent: plan/index.md`.

### `todo` (DEFER)

- Point-in-time auxiliary container for deferred items, QA checklists, and
  decision points tied to execution.
- Must be resolved (`complete` or `closed`) before the parent task is marked
  complete. Standalone work should be elevated to a `task` on master.

### `note` (THINK)

- Root-level exploration anchors (`note/<name>.md` or `note/<thread>/index.md`).
- No `priority` field. Transitions `open` -> `in-progress` -> `closed`. When
  addressed, content migrates to a `task`, `spec`, or `doc`, and the note is
  `closed`.

## Artifact Lifecycle Operations

- **Creation**: Create new artifacts using available harness tools (`cue-add`,
  `cue-plan`, `cue-task`, etc.) or CLI helpers (`cue add`).
- **Critical Note - Harness Tool Preference**: Always prefer harness-specific
  integration tools (`cue-*`) over raw shell CLI commands when creating artifacts.
  Passing text containing code snippets, symbols, quotes, or backticks directly as
  bash arguments frequently leads to shell escaping failures and corrupted files.
- **Modification**: Update existing artifacts in-place using standard text
  editing tools (`edit`). Never use file overwrite tools that strip or corrupt
  YAML frontmatter.
- **Querying & Discovery**: Discover artifacts exclusively using `cue list` (or
  harness query tools).

## Querying & Discovery (`cue list`)

Always use `cue list` (or harness tools) to discover and inspect artifacts.

### Key Flags & Filtering

- **`--type <type>` / `-t`**: Filter by category (`task`, `plan`, `spec`, `todo`, `note`, `trace`).
- **`--task <slug>`**: Target a specific task scope without mutating `.cue/HEAD`.
- **`--all` / `-a`**: Search across all task context directories.
- **`--filter <EXPR>`**: Filter frontmatter expressions (`KEY=VALUE`, `KEY!=VALUE`, `KEY~=SUBSTRING`).
- **`--frontmatter`**: Output JSON containing parsed YAML frontmatter objects (implies `--json`).
- **`-C <PATH>`**: Query artifacts in another repository directory (mirrors `git -C`).

### Common Discovery Patterns

- **Tasks on master board**: `cue list --task master --type task`
- **Unfinished tasks (incl. inbox)**: `cue list --task master --type task --filter "status!=complete" --filter "status!=closed"`
- **Inbox (awaiting triage)**: `cue list --task master --type task --filter "status=inbox"`
- **Child tasks of a parent**: `cue list --task master --type task --filter "parent=<parent-slug>"`
- **High priority items**: `cue list --task master --type task --filter "priority=high" --frontmatter`

For complete command details and options, see `skills/cue/reference/cli.md`.

## History & Logging (`cue-log`)

Record durable milestones, architectural choices, non-obvious discoveries, and
dead-ends in `.cue/<context>/log.md`.

Log immediately after every git commit and whenever an unexpected discovery or
dead-end occurs during active work. Keep entries high-signal; offload deep
output to companion `trace` artifacts.

- **Title**: Concise summary of the milestone, commit, or discovery.
- **Trace**: Optional trace path (`trace/`) for deep evidence or hand-offs.
- **Found**: Surprising discoveries, edge cases, or system quirks (never test
  passes or linter output). Omit if empty.
- **Decided**: Architectural trade-offs, invariants, or abandoned dead-ends
  (never code diffs or renames). Omit if empty.
- **Open**: Unresolved domain ambiguities or external blockers (never plan/todo
  next steps). Omit if empty.

For routine commits with no new domain learnings or decisions, log only the
milestone title and omit all bullet arrays.

## Operational Discipline

- **Executive Plan Adherence**: Implement current steps in the active executive plan incrementally. Update checkboxes (`- [x]`) as steps complete.
- **Scope Compliance**: Implement requested scope only. Capture out-of-scope items in `todo` or `note` artifacts rather than performing unrequested work.
- **Context Awareness**: Verify active context at session start. Explicitly pass context scope during sub-agent handoffs.
- **Git Worktree Isolation**: Never attempt to include `.cue/` changes in Git
  commits. The store lives at the main Git root and is shared by linked
  worktrees; `.cue/HEAD` remains local to each worktree.

## DOs and DON'Ts

### Frontmatter & Artifact Hygiene

- **DO** use YAML frontmatter as the single source of truth for metadata (`status`, `priority`, `kind`, `parent`, `refs`).
- **DO** update frontmatter `status` to `complete` when all plan/task criteria are met.
- **DO** prefer harness-specific integration tools (`cue-*`) over shell CLI commands when creating artifacts.
- **DO** use the `edit` tool to update existing artifacts in-place.
- **DON'T** prepend markdown headers like `# Status: complete` above or below frontmatter.
- **DON'T** overwrite existing cue artifacts using destructive write tools that strip frontmatter.

### Task & Spec Content

- **DO** keep `task/<slug>.md` concise, focusing on problem context and objectives.
- **DO** keep `spec/index.md` focused purely on scope and project intent.
- **DON'T** include technical analysis, implementation details, or code snippets in `spec/index.md`.

### Task Placement & Hierarchy

- **DO** store task cards flat exclusively on master at `.cue/master/task/<slug>.md`.
- **DO** declare parent links using scalar `parent:` frontmatter fields.
- **DON'T** create `task` artifacts on feature branches.
- **DON'T** use numeric IDs or reserved names (`master`) for task slugs.

### Execution & Git Discipline

- **DO** discover and inspect artifacts using `cue list` instead of searching `.cue/` directly.
- **DO** pass `task: "<slug>"` explicitly on all cue tool calls (`cue-add`, `cue-log`, `cue-plan`).
- **DO** log after every commit and during active discovery; omit empty fields.
- **DO** resolve all open task-scoped `todo` artifacts before marking a task complete.
- **DON'T** log test passes, linter output, or transient plan next-steps in `log.md`.
- **DON'T** run `cue switch` or mutate `.cue/HEAD` (owned exclusively by the human operator).
- **DON'T** search `.cue/` directly with `grep` or `find` (use `cue list`)
- **DON'T** include changes in `.cue/` in `git commit` commands.
- **DON'T** fix unrelated out-of-scope issues during active task execution.

### Style & Formatting

- **DO** keep line lengths under 80 columns (132 columns maximum when readability requires it).
- **DON'T** use emojis in artifacts, code, or logs.
