---
name: cue
description: Manage context, memory and cross-session continuity using the cue protocol.
---

# Agent Memory System (cue)

This skill provides a structured protocol for managing context and continuity across agent sessions using a dedicated `.cue/` directory structure.

## Core Philosophy

The system is organized around five altitudes:

- **WHAT** — `task/`: the primary unit of work and kanban board card. Lives exclusively on the master branch.
- **WHY** — `spec/`: feature or project specification. Defines what should be true.
- **HOW** — `plan/`: technical approach. Subordinate to a `task`. Contains step-by-step progress checkboxes.
- **DEFER** — `todo/`: deferred actions, QA checklists, or decision points auxiliary to a `task` or `plan`. Must be resolved before task completion.
- **THINK** — `note/`: spontaneous idea capture and conversation anchors. Thoughts outside active work waiting to be examined. Dissolves into its outcome artifact once addressed.

## Frontmatter Management

Markdown artifacts in `cue` use YAML frontmatter as the single source of truth for metadata. Frontmatter MUST be preserved on edits.

### `status:`

Artifacts track lifecycle status: `status: open|in-progress|complete|closed`.

### `priority:`

Bounded priority classification: `priority: critical|high|normal|low`.

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

- **Active Context (`.cue/HEAD`)**: Plain-text file containing the active scope (`master` or task slug).
- **Explicit Scope Override**: Operations can target a specific context scope without modifying `.cue/HEAD`.
- **Global Context (`master`)**: Cross-task shared artifacts. Tasks always reside on `master`.

## Artifact Contracts

### `task` (WHAT)

- Primary unit of work; lives exclusively at `.cue/master/task/<slug>.md`.
- Contains acceptance criteria detailing verified outcomes and required evidence.
- Tracked on master across feature branches via `branch:` frontmatter list.

### `spec` (WHY)

- Captures intent, scope, and requirements.
- Lives at `.cue/<context>/spec/index.md` (root). Does not contain technical implementation details or code snippets.

### `plan` (HOW)

Tracks step-by-step progress using GFM checkboxes (`- [ ]` / `- [x]`).

- **Master Plan (`plan/index.md`)**: Root document establishing overall architecture, phases, and design decisions.
- **Executive Plan (`plan/<timestamp>-<hash>/<slice>.md`)**: Point-in-time slice linked to master plan via `parent: plan/index.md`.

### `todo` (DEFER)

- Point-in-time auxiliary container for deferred items, QA checklists, and decision points tied to execution.
- Must be resolved (`complete` or `closed`) before the parent task is marked complete. Standalone work should be elevated to a `task` on master.

### `note` (THINK)

- Root-level exploration anchors (`note/<name>.md` or `note/<thread>/index.md`).
- No `priority` field. Transitions `open` -> `in-progress` -> `closed`. When addressed, content migrates to a `task`, `spec`, or `doc`, and the note is `closed`.

## Artifact Lifecycle Operations

- **Creation**: Create new artifacts using available harness tools (`cue-add`, `cue-plan`, `cue-task`, etc.) or CLI helpers (`cue add`).
  - **Critical Note — Harness Tool Preference**: Always prefer harness-specific integration tools (`cue-*`) over raw shell CLI commands when creating artifacts. Passing text containing code snippets, symbols, quotes, or backticks directly as bash arguments frequently leads to shell escaping failures and corrupted files.
- **Modification**: Update existing artifacts in-place using standard text editing tools (`edit`). Never use file overwrite tools that strip or corrupt YAML frontmatter.
- **Querying & Discovery**: Discover artifacts exclusively using `cue list` (or harness query tools).

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
- **Open/In-progress tasks**: `cue list --task master --type task --filter "status!=complete" --filter "status!=closed"`
- **Child tasks of a parent**: `cue list --task master --type task --filter "parent=<parent-slug>"`
- **High priority items**: `cue list --task master --type task --filter "priority=high" --frontmatter`

For complete command details and options, see `skills/cue/reference/cli.md`.

## History & Logging (`cue-log`)

Record milestones, technical decisions, dead-ends, and post-commit impacts as structured entries in `.cue/<context>/log.md`.

Standard Entry Schema:

- **Title**: Concise summary of the milestone or event.
- **Body**: Detailed narrative or context.
- **Found**: List of discovered facts or learnings.
- **Decided**: Technical decisions made.
- **Open**: Unresolved questions or follow-up items.

Always append a log entry immediately after making git commits, making important discoveries or abandoning failed approaches.

## Operational Discipline

- **Executive Plan Adherence**: Implement current steps in the active executive plan incrementally. Update checkboxes (`- [x]`) as steps complete.
- **Scope Compliance**: Implement requested scope only. Capture out-of-scope items in `todo` or `note` artifacts rather than performing unrequested work.
- **Context Awareness**: Verify active context at session start. Explicitly pass context scope during sub-agent handoffs.
- **Git Worktree Isolation**: Never attempt to include `.cue/` changes in `git commit` commands; memory artifacts are managed in a separate git worktree.

## DOs and DON'Ts

### Frontmatter & Artifact Hygiene

- **DO** use YAML frontmatter as the single source of truth for metadata (`status`, `priority`, `kind`, `parent`, `refs`).
- **DO** update frontmatter `status` to `complete` when all plan/task criteria are met.
- **DO** prefer harness-specific integration tools (`cue-*`) over shell CLI commands when creating artifacts.
- **DO** use the `edit` tool to update existing artifacts in-place.
- **DON'T** prepend markdown headers like `# Status: complete` above or below frontmatter.
- **DON'T** overwrite existing cue artifacts using destructive write tools that strip frontmatter.

### Task & Spec Content

- **DO** write outcome-oriented acceptance criteria ("tests pass") with evidence requirements.
- **DO** keep `spec/index.md` focused purely on scope and project intent.
- **DON'T** include technical analysis, implementation details, or code snippets in `spec/index.md`.
- **DON'T** use GFM checkboxes in acceptance criteria (checkboxes belong in executive plans or `todo` checklists).
- **DON'T** fill human-attested evidence without explicit user confirmation.

### Task Placement & Hierarchy

- **DO** store task cards flat exclusively on master at `.cue/master/task/<slug>.md`.
- **DO** declare parent links using scalar `parent:` frontmatter fields.
- **DON'T** create `task` artifacts on feature branches.
- **DON'T** use numeric IDs or reserved names (`master`) for task slugs.

### Execution & Git Discipline

- **DO** discover and inspect artifacts using `cue list` instead of searching `.cue/` directly.
- **DO** log milestones, decisions, and dead-ends immediately in `.cue/<context>/log.md`.
- **DO** resolve all open task-scoped `todo` artifacts before marking a task complete.
- **DON'T** search `.cue/` directly with `grep` or `find` (use `cue list` to handle frontmatter and proxy stores).
- **DON'T** include changes in `.cue/` in `git commit` commands.
- **DON'T** fix unrelated out-of-scope issues during active task execution.

### Style & Formatting

- **DO** keep line lengths under 80 columns (132 columns maximum when readability requires it).
- **DON'T** use emojis in artifacts, code, or logs.
