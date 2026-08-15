---
name: cue
description: Manage context, memory and and cross-session continuity using the cue protocol.
---

# Agent Memory System (cue)

This skill provides a structured protocol for managing context and continuity across agent sessions
using the `cue` CLI tool and a dedicated `.cue/` directory structure.

## Core Philosophy

The system is organized around five altitudes:

- **WHAT** — `task/`: the primary unit of work and the kanban board card. Lives exclusively
  on the master branch. Moves through a lifecycle until its outcome is verified.
- **WHY** — `spec/`: feature or project specification. Defines what should be true.
- **HOW** — `plan/`: the technical approach. Always subordinate to a `task`. Contains step-by-step
  progress checkboxes.
- **DEFER** — `todo/`: deferred actions, QA checklists, or decision points auxiliary to a
  `task` or `plan`. Must be resolved before the task is completed.
- **THINK** — `note/`: spontaneous idea capture and conversation anchors. Thoughts that
  arise outside active work, waiting to be examined. Dissolves into its outcome artifact
  (task, spec, doc) once addressed, then is `closed`.

## Frontmatter Management

Markdown artifacts in `cue` use YAML frontmatter as the single source of truth
for metadata.

### `status:`

Artifacts track status using `status: open|in-progress|complete|closed`.

### `priority:`

Artifacts track priority using `priority: critical|high|normal|low`.

### `parent:`

Child artifacts declare their parent artifact using the scalar `parent:` frontmatter
field (e.g., child tasks pointing to a parent task `parent: auth-redesign`, or executive
plans pointing to a master plan `parent: plan/index.md`). Relationships always point
upward (child -> parent). To find all child artifacts of a given parent, filter by parent:

```bash
cue list --filter parent=<parent-slug-or-path>
```

### `refs:`

Every artifact SHOULD declare the other artifacts it directly relates to via a
`refs:` frontmatter field — a flat list of paths relative to git root. These links
are what make the corpus traversable.

```yaml
refs:
  - .cue/master/spec/index.md
  - .cue/master/task/auth-login.md
```

- Paths are relative to git root (project root)
- Supply `refs:` whenever the artifact links to, derives from, or references
  another artifact. An artifact with no references simply omits the field.

## Directory Structure

Each context has an isolated directory at `.cue/<scope>/`, where `<scope>` is
`master` (the global context) or a task slug. The active scope is resolved from
`.cue/HEAD` (see *Active Context and Scope Resolution* below).
If the `.cue/` directory is missing, run `cue init` to initialize the repository.

### Root artifacts

Root artifacts live directly at `.cue/<context>/<type>/<filename>` — they have no timestamp subdir.
They are created with the `--root` flag and are intended for **stable, named documents** that are
updated in place over the lifetime of the branch.

Typical root documents:

- `spec/index.md`: The anchor document defining project scope, intent, and prerequisites.
- `spec/tickets/`: Source material for external reference (e.g., cached ticket text).
- `plan/index.md`: The master plan translating project scope into a technical architecture and approach.

### Point-in-time artifacts

By default (without `--root`), all artifacts are saved into a unique
`.cue/<context>/<type>/<timestamp>-<hash>/` subdirectory. Each artifact is tied to a specific
moment in git history, which allows correlation with commits and prevents conflicts when multiple
sessions run in parallel.

- `plan/<timestamp>-<hash>/<name>.md`: Executive plan for a specific implementation slice.
- `trace/<timestamp>-<hash>/<name>`: Artifacts tied to the current git state (error logs, etc.)
- `tmp/<timestamp>-<hash>/<name>`: Ephemeral per-session data not needed long-term.

## Active Context and Scope Resolution

Every artifact write and read is scoped to a **context directory** under
`.cue/`. The active context is determined by `.cue/HEAD` — a plain-text file
containing the currently default task slug (or `master`).

### Scope resolution precedence

When a command needs to know which context to write to or read from, it resolves
the scope in this order:

1. **`--task <slug>` flag**
2. **`.cue/HEAD`** — when no `--task` flag is given

### `cue switch <slug>`

Switches the active context by writing the slug to `.cue/HEAD`

```sh
cue switch auth-login                        # switch to the auth-login task
cue switch master                            # return to the global context
```

Add `--json` for structured output.

### `cue status`

Prints the active context.

Add `--json` for structured output:

## The `task` Artifact Type

`task` is the primary unit of work and the canonical kanban board card. Every
discrete piece of planned work must be represented as a `task` before a `plan`
is created or execution begins. For detailed task lifecycle categories (`kind:
research|design|build|review|coord`) and parent-child hierarchies (`parent:`),
see the `cue-task` skill.

### Location: master branch only

Tasks live exclusively at `.cue/master/task/`. They are authored, updated, and
closed there regardless of which feature branch performs the work. Because `.cue/`
is a single git worktree, any branch session can read and write `.cue/master/task/`
directly.

### Structure & Frontmatter

Every `task` artifact must begin with YAML frontmatter:

```yaml
---
status: open # open | in-progress | complete | closed
priority: normal # critical | high | normal | low
title: "Short display title"
kind: build # optional: research | design | build | review | coord
parent: parent-slug # optional: slug of the parent task
refs: # paths this task links to; see References
  - .cue/master/spec/index.md
branch: [] # list of branch names where this task is being worked on
---
```

### Body structure

```markdown
# <title>

<description: the outcome to be delivered>

## Acceptance Criteria

1. **Tests pass.**
   - Verify by: `pytest tests/`
   - Evidence: (paste exit code)

2. **Manual QA passed.**
   - Verify by: human attestation
   - Evidence: (who / when)
```

**Acceptance criteria rules:**

- Criteria describe _outcomes_ ("tests pass"), never _actions_ ("write tests").
- The Evidence field must be filled before a criterion is considered met.
- An agent MUST NOT fill the Evidence field for a human-attested criterion on
  its own authority. It must obtain explicit user attestation in the
  conversation, or leave the field blank and report it as blocking completion.
- A `task` may not transition to `complete` while any Evidence field is empty.

### Relationship to other artifact types

- **`spec`**: A `task` points up at the spec that defines its scope via
  `refs:`. The spec does not reference tasks. `spec` declares what should be
  true; a `task` is the work of making it true. Referencing a spec is
  recommended when applicable but not required for standalone chores.
- **`plan`**: A `plan` is subordinate to a `task`. The master plan describes
  HOW to address the task; executive plans track execution steps. The task
  defines the acceptance criteria (WHAT done looks like); the plan defines the
  steps (HOW to get there). These must not bleed into each other.
- **`todo`**: A `todo` holds auxiliary actions, QA checklists, or decision points associated
  with a `task`. If a `todo` represents standalone work beyond the task scope, elevate
  it to a `task` on master and mark the `todo` `closed`.

## The `plan` Artifact Type

The `plan` type has two distinct uses determined by whether it is a root or point-in-time artifact:

### Master Plan (root)

**Path:** `plan/index.md`

The master plan is a living document that describes the full technical solution for the branch. It is
created once and updated in place as the approach evolves. Contents include:

- Chosen architecture and approach
- Key design decisions
- Implementation phases and their scope

### Executive Plan (point-in-time, default)

**Path:** `plan/<timestamp>-<hash>/<name>.md`

An executive plan is a session- or slice-specific document that translates a portion of the master
plan into concrete, ordered steps.

Requirements:

- **Parent (`parent:`)**: Executive plans must link to their master plan (e.g. `parent: plan/index.md`) via the `parent:` frontmatter field.
- **Steps**: An ordered sequence of `[ ]` checkbox tasks with sufficient detail for an agent to execute step-by-step.

---

## The `todo` Artifact Type

`todo` artifacts are always point-in-time (never use `--root`). They capture
deferred actions, decision points, manual QA checklists, or secondary work
items that must be executed or resolved in the context of a task. They act as
an auxiliary to execution plans.

### Structure & Frontmatter

Every `todo` artifact must begin with YAML frontmatter:

```yaml
---
status: open # open | in-progress | complete | closed
priority: normal # critical | high | normal | low
---
```

Valid statuses for todos are:

- `open`: pending action or resolution.
- `in-progress`: actively being worked on or verified.
- `complete`: resolved or executed.
- `closed`: no longer relevant.

### Usage

Use `todo` for:

- QA checklists for manual testing of features
- Pending business decisions, consultations, or clarifications needed before task completion
- Deferred follow-up items or code review items
- Technical debt notes or refactors discovered during execution

`todo` artifacts live alongside the work that triggered them (tied to the same
git moment), making it easy to trace _why_ the todo was created. File naming is
caller-defined (e.g., `qa-checklist.md`, `review-items.md`).

If created within a task context, any open `todo` artifacts must be resolved
before the task can be marked `complete`. If a `todo` represents standalone
work beyond the current task scope, create a `task` on master and mark the
`todo` `closed`.

**Create with:** `cue-todo(filename: "qa-checklist.md", content: "# ...")`

## The `note` Artifact Type

`note` artifacts capture spontaneous ideas and conversation anchors — thoughts
that arise outside active work and require immediate persistence or they may
evaporate. A note is exploratory, not action-oriented: it exists to be examined
via discussion, research, or brainstorming. Once addressed, the note's content
takes shape as a new artifact (`task`, `spec`, `doc`, `todo`) and the note is
`closed`. A note does not `complete` — it *dissolves* into its outcome.

### Structure & Frontmatter

Every `note` artifact must begin with YAML frontmatter:

```yaml
---
status: open # open | in-progress | closed
---
```

Notes have **no `priority`** field. Ideas are not urgent; they require
persistence, not ranking.

Valid statuses for notes are:

- `open`: captured, not yet addressed.
- `in-progress`: actively being discussed, researched, or analyzed.
- `closed`: the conversation concluded; the outcome now lives in a different
  artifact. The note itself is deletable.

There is deliberately **no `complete` status**. A note does not finish — it is
addressed (discussed, analyzed, researched) and its valuable content migrates
to a more appropriate artifact. At that point the note is `closed`.

### Usage

Use `note` for:

- Feature ideas or improvements that arise spontaneously
- Design questions worth a conversation
- Research topics to investigate later
- Architectural thoughts that need examination before becoming specs or tasks
- Conversation threads between human and agent (a note is an anchor point for
  further exchange of opinions, like a forum thread)

A `note` is distinct from a `todo`:
- `todo` is **action-oriented**: "I have deferred actions, checklists, or questions that need resolution."
- `note` is **exploration-oriented**: "I had a thought that needs examining."

If a `note` is addressed and the outcome warrants tracked work, create the
appropriate artifact (`task`, `spec`, `doc`) and mark the `note` `closed`. The
note itself has no further value once its content has migrated.

### Task Placement

A `note` defaults to the active task context if triggered by current work, or to
`master` if the idea is project-global. Use the `task` parameter to override
placement explicitly.

### Storage: root-level by default

Notes are stored at **root level** (flat), not nested under
`<timestamp>-<hash>` directories. The nesting model serves generated artifacts
where collision protection and commit anchoring matter; neither applies to
authored documents with meaningful filenames.

This enables subdirectory grouping — a note can grow into a thread by
organizing related files under a named directory:

```
.cue/master/note/auth-redesign/index.md
.cue/master/note/auth-redesign/references.md
.cue/master/note/auth-redesign/follow-up.md
```

A note can start as a single flat file (`note/my-idea.md`) and organically
grow into a directory thread when the conversation develops. The `filename`
parameter of `cue-note` accepts subdirectory paths for this purpose.

**Create with:** `cue-note(filename: "idea-auth.md", content: "# ...")`
**Grouped:** `cue-note(filename: "auth-redesign/index.md", content: "# ...")`

## Managing Artifacts (cue-add & edit)

Artifacts within `.cue/` are created using specialized tool calls (`cue-plan`, `cue-task`, `cue-todo`, `cue-note`, or `cue-add`). Existing artifacts are updated using the standard `edit` tool.

### Artifact Hygiene

- **`log.md` history file**: Lives at the branch root (`.cue/<branch>/log.md`), managed by `cue log`,
  not `cue add`.
- **`spec/` directory**: Keep root artifacts focused on stable context and scope. No technical
  analysis. Use `--root` for `index.md` and `tickets/`.
- **`task/` artifacts**: Stored **flat** at `.cue/master/task/<slug>.md` (no
  timestamp subdirectory). Always written to the master context by `cue-task`
  (`--task master --root` is passed internally). Represent the primary unit
  of work. The slug `master` is reserved and rejected by `cue add`. Never
  create task artifacts outside the master context.
- **`plan/` directory**: Root artifact for `index.md` (master plan). All executive plans are
  point-in-time (default, no `--root`).
- **`todo/` artifacts**: Always point-in-time (never use `--root`). Represent
  deferred actions, QA checklists, or decision points auxiliary to a plan.
- **`note/` artifacts**: Root-level by default (not nested under
  `<timestamp>-<hash>`). Represent spontaneous ideas and conversation anchors,
  not work items or discoveries. Supports subdirectory grouping for note
  threads. Once addressed, the outcome migrates to a `task`, `spec`, or `doc`
  and the note is `closed`.
- **`trace/` vs `tmp/`**:
  - Use `type: "trace"` for information that should be preserved (error logs, analysis, review output).
    Always point-in-time (default).
  - Use `type: "tmp"` for disposable ephemeral data relevant only to the current sub-task.
    Always point-in-time (default).

### The `cue-add`, `cue-plan`, `cue-task`, `cue-todo`, and `cue-note` Tools

Use the `cue-add` tool to create generic artifacts, or use the specialized
`cue-plan`, `cue-task`, `cue-todo`, and `cue-note` tools for plans, tasks,
todos, and notes. These tools handle content safely without shell escaping issues.

#### `cue-plan`

Use `cue-plan` to create technical plans. It automatically sets the `status` frontmatter.

**Arguments:**

- `filename`: The name of the file (e.g., `index.md`, `slice1.md`).
- `content`: The full content of the plan.
- `root` (optional boolean): When `true`, saves as a master plan at `plan/index.md`. Default is `false`.
- `status` (optional): `open | complete`. Default is `open`.
- `parent` (optional): Parent master plan path (e.g. `plan/index.md`) for executive plans.
- `refs` (optional): Array of artifact paths this plan links to. Default is `[]`.

#### `cue-task`

Use `cue-task` to create primary work items (kanban cards). It automatically
sets `status`, `priority`, and `title` frontmatter and always writes to the
master context (passes `--task master` internally). Context placement is not
a caller decision — tasks always live on master.

**Arguments:**

- `filename`: Slug-based name (e.g., `auth-login.md`). No numeric ID.
- `content`: Full body of the task, including the Acceptance Criteria.
- `title`: Short display title for the board.
- `status` (optional): `open | in-progress | complete | closed`. Default is `open`.
- `priority` (optional): `critical | high | normal | low`. Default is `normal`.
- `refs` (optional): Array of artifact paths this task links to (e.g. the spec it implements). Default is `[]`.

#### `cue-todo`

Use `cue-todo` to capture informal out-of-scope notes. It automatically sets
the `status` and `priority` frontmatter.

**Arguments:**

- `filename`: The name of the file (e.g., `refactor-auth.md`).
- `content`: The note description.
- `status` (optional): `open | in-progress | complete | closed`. Default is `open`.
- `priority` (optional): `critical | high | normal | low`. Default is `normal`.
- `refs` (optional): Array of artifact paths this todo links to. Default is `[]`.

#### `cue-note`

Use `cue-note` to capture spontaneous ideas and conversation anchors. Notes
are root-level by default (not nested under `<timestamp>-<hash>`), which
enables subdirectory grouping for note threads. Notes have no `priority`.

**Arguments:**

- `filename`: The name of the file (e.g., `idea-auth.md`). May include a
  subdirectory to group related notes into a thread (e.g.,
  `auth-redesign/index.md`).
- `content`: Full content of the note.
- `status` (optional): `open | in-progress | closed`. Default is `open`.
  Note: there is no `complete` status — notes dissolve into their outcome,
  they do not complete.
- `refs` (optional): Array of artifact paths this note links to. Default is `[]`.
- `task` (optional): Override active task scope for this invocation. Use `"master"` for the global context.

#### `cue-add`

- `type`: The artifact type. Standard types: `spec`, `plan`, `task`, `todo`, `note`, `trace`, `tmp`, `ref`, `bin`, `doc`.
  Custom types may be configured in `cue.json`.
- `filename`: The name of the file (e.g., `slice1.md`, `research-auth.md`).
- `content`: The full content to write to the file.
- `root` (optional boolean): When `true`, saves flat at `<type>/<filename>` — the root of the type
  directory. Use for stable anchor documents that are updated in place. Default is `false` (nested
  under `<type>/<timestamp>-<hash>/`).
- `frontmatter` (optional): Object of frontmatter fields to prepend. Each value may be a string or
  an array of strings; an array becomes a YAML list (e.g. `{ refs: ["master/spec/index.md"] }`).
- `task` (optional): Override active task scope for this invocation (without modifying `.cue/HEAD`). Use `"master"` for the global context.
- `dir` (optional): Run cue as if started in this directory (mirrors `git -C`).

### Examples

- **Initialize the index**: `cue-add(type: "spec", filename: "index.md", root: true, content: "# My Goal")`
- **Create master plan**: `cue-plan(filename: "index.md", root: true, content: "...")`
- **Create executive plan**: `cue-plan(filename: "phase-1.md", content: "...")`
- **Create a task (board card)**: `cue-task(filename: "auth-login.md", title: "Implement login", content: "...")`
- **Create a deferred note**: `cue-todo(filename: "review-items.md", content: "...")`
- **Create a spontaneous idea**: `cue-note(filename: "idea-auth.md", content: "...")`
- **Save a trace**: `cue-add(type: "trace", filename: "build-error.log", content: "...")`
- **Save a research report**: `cue-add(type: "doc", filename: "research-auth-flow.md", content: "...")`
- **Add a reference**: `cue-add(type: "ref", filename: "documentation.md", root: true, content: "...")`
- **Cache external ticket text**: `cue-add(type: "spec", filename: "tickets/FEAT-1.md", root: true, content: "...")`

### The `cue list` API

```bash
cue list [FLAGS]
```

- **`--type <type>`**: Filters artifacts by category (e.g., `spec`, `plan`, `task`, `todo`, `note`, `trace`).
- **`--all`, `-a`**: Lists artifacts across all task contexts.
- **`--task <slug>`**: Lists artifacts for a specific task context (e.g. `master`).
- **`--json`, `-j`**: Outputs results in JSON format.

## Recording History (cue-log)

Use the `cue-log` tool whenever a meaningful milestone is reached, a decision is made,
an attempted solution has turned out to be a dead-end, or an investigation concludes.

**Tool Interface:**

```typescript
cue -
  log({
    title: "Entry title",
    body: "Detailed description of the milestone (optional)",
    found: ["Discovery 1", "Discovery 2"],
    decided: ["Decision 1", "Decision 2"],
    open: ["Remaining question 1"],
  });
```

**When to log:**

- **CRITICAL**: Always log immediately after making a git commit to summarize the impact.
- After changing a significant file or architecture.
- When making a non-obvious technical choice.
- **Dead Ends**: Always log abandoned approaches to prevent repetition.

## Operational Excellence

To ensure consistency and quality across sessions, follow these execution principles:

- **Adherence to Executive Plan**: Strictly implement the steps in the current pinned executive plan
  that correspond to the current user request. Do **NOT** jump ahead. Update the `[ ]` checkboxes
  incrementally as work is completed to reflect the current state.
- **Reporting & Continuation**: After completing the requested steps, report back to the user
  with a concise summary and await further instructions before proceeding.
- **Scope Compliance**: Strictly follow the scope defined by user instructions. Only implement
  features or changes that were explicitly requested.
- **Ambiguity & Clarification**: If any instruction is ambiguous or if you are in doubt about the
  intended behavior, ask the user for clarification immediately. Do not make assumptions.
- **Out-of-Scope Discoveries**: When you notice a problem or opportunity unrelated
  to the current task, do NOT fix it. Capture it for later: use a `todo` for
  out-of-scope work items (refactors, debt, review items) or a `note` for
  spontaneous ideas and thoughts worth examining. If either warrants tracked
  work on the board, create a `task` on master and mark the origin `closed`.

### Agent Context Discipline

The active context is pinned by `.cue/HEAD`. Be deliberate about which context
you write to:

1. **Orient at session start.** Call `cue status --json` (or read the output
   injected by `/cue:init`) to determine the active task context before writing
   anything. Acknowledge the active task in your opening summary.

2. **Write to the active context by default.** When your work belongs in the
   currently active task, omit `--task`; the CLI reads HEAD automatically.

3. **Use `--task <slug>` for cross-context writes.** When writing to a
   different context than the active one (e.g. logging to `master` from inside
   a task, or writing a task card which always targets `master`), pass `--task`
   explicitly and note why in a log entry.

4. **Sub-agent handoff: pass the context slug explicitly.** When spawning a
   sub-agent, include the task slug in the prompt so it does not need to infer
   context:

   > "Your cue task context is `auth-login`. Use `--task auth-login` on all
   > `cue add` and `cue log` calls unless you have a specific reason to write
   > to a different context."

## DOs and DON'Ts

### Frontmatter & Artifact Hygiene
- **DO** use YAML frontmatter as the single source of truth for metadata (e.g., `status`, `priority`, `kind`, `parent`, `refs`).
- **DO** update frontmatter `status` to `complete` when all steps in a plan are finished.
- **DO** use specialized tools (`cue-plan`, `cue-task`, `cue-todo`, `cue-note`, `cue-add`) to create **new** artifacts.
- **DO** use the `edit` tool to update **existing** artifacts.
- **DON'T** prepend markdown headers like `# Status: complete` above or below frontmatter.
- **DON'T** use manual file-writing tools (`write`, `bash echo`) to create files inside `.cue/`.

### Task & Spec Content
- **DO** write outcome-oriented acceptance criteria ("tests pass") rather than action steps ("write tests").
- **DO** keep `spec/index.md` focused purely on scope and project intent.
- **DON'T** include technical analysis, implementation details, or code snippets in `spec/index.md`.
- **DON'T** log progress or pending tasks in `plan/index.md` (master plan).
- **DON'T** use GFM checkboxes (`- [ ]`) in acceptance criteria (checkboxes belong in executive plans or `todo` checklists).
- **DON'T** fill Evidence fields for human-attested criteria without explicit user confirmation in conversation.
- **DON'T** mark a `task` as `complete` while any Evidence field remains empty.

### Task Placement & Hierarchy
- **DO** store task cards flat exclusively on master at `.cue/master/task/<slug>.md`.
- **DO** declare parent tasks using the scalar `parent: parent-slug` field on child task cards.
- **DON'T** create `task` artifacts on feature branches.
- **DON'T** use numeric IDs or reserved names (`master`) for task slugs.
- **DON'T** add numeric sub-ranks or integer priority fields to tasks.

### Execution & Git Discipline
- **DO** orient context at session start using `cue status --json`.
- **DO** log milestones, decisions, and dead-ends immediately using `cue-log`.
- **DO** resolve all open task-scoped `todo` artifacts before marking a task complete.
- **DON'T** attempt to include changes in `.cue/` in `git commit` commands (memory artifacts are managed in a separate git worktree).
- **DON'T** fix unrelated out-of-scope issues during active task execution (capture them in `todo` or `note` artifacts instead).

### Style & Formatting
- **DO** keep line lengths under 80 columns (132 columns maximum when readability requires it).
- **DON'T** use emojis in artifacts, code, or logs.
