---
name: cue
description: Manage context, memory and and cross-session continuity using the cue protocol.
---

# Agent Memory System (cue)

This skill provides a structured protocol for managing context and continuity across agent sessions
using the `cue` CLI tool and a dedicated `.cue/` directory structure.

## Core Philosophy

The system is organized around five altitudes:

- **WHY** — `spec/`: stable, human-authored project intent. Defines what should be true.
  Does not move. Tasks point up at it.
- **WHAT** — `task/`: the primary unit of work and the kanban board card. Lives exclusively
  on the master branch. Moves through a lifecycle until its outcome is verified.
- **HOW** — `plan/`: the technical approach. Always subordinate to a `task`. The only place
  with `[ ]` progress checkboxes.
- **DEFER** — `todo/`: informal notes capturing out-of-scope discoveries so they are not
  lost. Optional feeder for `task` artifacts.
- **THINK** — `note/`: spontaneous idea capture and conversation anchors. Thoughts that
  arise outside active work, waiting to be examined. Dissolves into its outcome artifact
  (task, spec, doc) once addressed, then is `closed`.

## Frontmatter Management

Markdown artifacts in `cue` use YAML frontmatter to track metadata.
Agents MUST manage file characteristics (like status) by updating this block.

- **Source of Truth**: The YAML frontmatter is the only place for metadata.
- **No Headers**: NEVER prepend markdown headers like `# Status: complete`. This invalidates the file structure and breaks frontmatter parsing.
- **Updates**: When a file already exists, use the `edit` tool to update the `status` field within the `---` delimiters.

`status` should be tracked with: `open|in-progress|complete|closed`.
Type-specific enums are defined in each type section below.

**Markdown frontmatter is used for managing files in `cue`. Agents should never make changes that invalidate markdown frontmatter.**

**NOTE: Usage of `cue` commands and editing of cue files inside the cue directory is EXPLICITLY PERMITTED
during "plan mode" to allow for documentation and strategy refinement without leaving the planning phase.**

## Directory Structure

Each branch of work has an isolated directory at `.cue/<branch_name>/`.
If the `.cue/` directory is missing, run `cue init` to initialize the repository.

### Root artifacts

Root artifacts live directly at `.cue/<branch>/<type>/<filename>` — they have no timestamp subdir.
They are created with the `--root` flag and are intended for **stable, named documents** that are
updated in place over the lifetime of the branch. A root document is the "anchor" of its type:
it has a well-known path that other files, agents, and configs can reference reliably.

Typical root documents:

- `spec/index.md`: The anchor. Intent, scope, requirements, prerequisites (e.g., related
  branches/PRs). **MUST NOT** contain technical analysis, implementation details, or code snippets.
- `spec/log.md`: Cumulative history of findings and decisions (managed by `cue log`).
- `spec/tickets/`: Source material for external reference (e.g., cached
  ticket text). Not work items — link to these from `task` artifacts.
- `plan/index.md`: The master plan. Translates `spec/index.md` into a technical solution and
  chosen approach. Covers phases, architecture, and key design choices. May contain code snippets
  to clarify concepts. **MUST NOT** log progress or completed/pending tasks.

**Create root artifacts with the `--root` flag:**
`cue-plan(filename: "index.md", root: true, content: "...")`

### Point-in-time artifacts (default)

By default (without `--root`), all artifacts are saved into a unique
`.cue/<branch>/<type>/<timestamp>-<hash>/` subdirectory. Each artifact is tied to a specific
moment in git history, which allows correlation with commits and prevents conflicts when multiple
sessions run in parallel.

- `plan/<timestamp>-<hash>/<name>.md`: Executive plan for a specific session or implementation
  slice. Step-by-step sequence of tasks. Must begin with a foreword.
- `todo/<timestamp>-<hash>/<name>.md`: Informal deferred notes captured so
  they are not lost. Optional feeder for `task` artifacts.
- `trace/<timestamp>-<hash>/<name>`: Artifacts tied to the current git state (error logs, analysis
  results, code review output, audit trails).
- `tmp/<timestamp>-<hash>/<name>`: Ephemeral per-session data not needed long-term.

## The `plan` Artifact Type

The `plan` type has two distinct uses determined by whether it is a root or point-in-time artifact:

### Master Plan (root)

**Path:** `plan/index.md`

The master plan is a living document that describes the full technical solution for the branch. It is
created once and updated in place as the approach evolves. Contents include:

- The problem being solved and constraints
- Chosen architecture and approach (with alternatives considered)
- Implementation phases and their scope
- Key design decisions

Valid statuses for plans are:

- `open`: The plan is in progress.
- `complete`: All steps in the plan are finished.

**Create with:** `cue-plan(filename: "index.md", root: true, content: "...")`

### Executive Plan (point-in-time, default)

**Path:** `plan/<timestamp>-<hash>/<name>.md`

An executive plan is a session- or slice-specific document that translates a portion of the master
plan into concrete, ordered steps. It is created at the start of a work session or sub-task and
updated in place as steps are completed. Executive plans are retained after completion as a record
of what was done and when.

Structure requirements:

1. **Foreword** (mandatory): A brief section explaining what this plan covers, which phase of the
   master plan it addresses, and any prerequisites or context needed to execute it. This makes the
   plan semi-self-contained for handoffs to sub-agents.
2. **Steps**: An ordered sequence of `[ ]` checkbox tasks, with sufficient detail that a fresh agent
   can execute them from the foreword alone.

Executive plans also serve as the in-session task tracking mechanism. Use standard GFM checkboxes:
`- [ ]` for pending steps and `- [x]` for completed ones. Update checkboxes with the `Edit` tool
immediately after completing each step. Before editing, re-read the file to pick up any changes the
user may have made directly.

When all steps are complete, update the frontmatter `status` to `complete`.

**Create with:** `cue-plan(filename: "slice1.md", content: "...")`

The caller names the file. Choose names that are descriptive of the slice (e.g., `auth-wiring.md`,
`phase-2-db.md`, `slice1.md`). Multiple executive plans can coexist in the same timestamped subdirectory.

## The `task` Artifact Type

`task` is the primary unit of work and the canonical kanban board card. Every
discrete piece of planned work must be represented as a `task` before a `plan`
is created or execution begins.

### Location: master branch only

Tasks live exclusively at `.cue/master/task/`. They are authored, updated, and
closed there regardless of which feature branch performs the work. Because `.cue/`
is a single git worktree, any branch session can read and write `.cue/master/task/`
directly. This gives the board a single, always-complete, globally visible location.

Never create `task` artifacts on feature branches.

### Structure & Frontmatter

Every `task` artifact must begin with YAML frontmatter:

```yaml
---
status: open # open | in-progress | complete | closed
priority: normal # critical | high | normal | low
title: "Short display title"
refs: # optional; links up to spec or out to source material
  - spec/index.md
branch: "" # set to the working branch name when in-progress
---
```

**`status` values:**

- `open`: not yet started.
- `in-progress`: actively being worked on. Set `branch:` when transitioning here.
- `complete`: all acceptance criteria verified and Evidence cells filled.
- `closed`: no longer relevant (superseded, abandoned, or made obsolete).

**`priority` values** (bounded enum — do not use free integers):

- `critical`: blocks other work or the project cannot ship; do next.
- `high`: important and intended for the current focus; do soon.
- `normal`: real work, no urgency. **Default.**
- `low`: nice-to-have; address if convenient.

Within a priority band, ordering is a runtime judgment call. Do not add numeric
sub-ranks. If tasks must be sequenced, express that as a prose dependency note
in the body, not as a sub-priority field.

### Body structure

```markdown
# <title>

<description: the outcome to be delivered>

## Source

- <optional links to spec/index.md, spec/tickets/, traces, or other
  artifacts that provide context for this task>

## Acceptance Criteria

| #   | Criterion (outcome) | Verify by         | Evidence          |
| --- | ------------------- | ----------------- | ----------------- |
| 1   | Tests pass          | `pytest tests/`   | (paste exit code) |
| 2   | Manual QA passed    | human attestation | (who / when)      |
```

**Acceptance criteria rules:**

- Criteria describe _outcomes_ ("tests pass"), never _actions_ ("write tests").
  Actions belong in the `plan`.
- The Evidence column must be filled before a criterion is considered met.
- An agent MUST NOT fill the Evidence cell for a human-attested criterion on
  its own authority. It must obtain explicit user attestation in the
  conversation, or leave the cell blank and report it as blocking completion.
- A `task` may not transition to `complete` while any Evidence cell is empty.
- Do NOT use GFM checkboxes (`- [ ]`) in the criteria table. The executive
  plan is the only place with checkboxes.

### Relationship to other artifact types

- **`spec`**: A `task` points up at the spec that defines its scope via
  `refs:`. The spec does not reference tasks. `spec` declares what should be
  true; a `task` is the work of making it true. Referencing a spec is
  recommended when applicable but not required for standalone chores.
- **`plan`**: A `plan` is subordinate to a `task`. The master plan describes
  HOW to address the task; executive plans track execution steps. The task
  defines the acceptance criteria (WHAT done looks like); the plan defines the
  steps (HOW to get there). These must not bleed into each other.
- **`todo`**: An informal `todo` note may be the origin of a `task`. When a
  `todo` is elevated to a formal `task`, create the `task` on master and mark
  the `todo` `closed`. No further promotion protocol is required.

### Cross-branch workflow

Tasks stay on master throughout their lifetime. Feature branches reference
tasks; they never copy them.

When work begins on a feature branch:

1. Set `status: in-progress` and `branch: <feature-branch>` in the master
   task file.
2. Add a reference in the feature branch's `spec/index.md` or `plan/index.md`:
   `Implements: task/<filename>.md`.
3. When acceptance criteria are verified, set `status: complete` and clear
   `branch:` in the master task file.

Status updates are always made in place on the master task file, from any
branch session.

### Creating a task

`cue-task` always writes to the master branch directory (`.cue/master/task/`)
regardless of the current checkout, by passing `--branch master` internally.
Branch placement is not a caller decision for tasks.

**Create with:** `cue-task(filename: "auth-login.md", title: "...", content: "...")`

Tasks are always point-in-time artifacts. Never use `--root` for tasks.

---

## The `todo` Artifact Type

`todo` artifacts are always point-in-time (never use `--root`). They capture
informal notes about work discovered during a session that is out of scope —
to be addressed later. They are not primary work items; use `task` for that.

### Structure & Frontmatter

Every `todo` artifact must begin with YAML frontmatter:

```yaml
---
status: open # open | in-progress | complete | closed
priority: normal # critical | high | normal | low
---
```

Valid statuses for todos are:

- `open`: noted, not yet acted on.
- `in-progress`: being actively looked at.
- `complete`: resolved.
- `closed`: no longer relevant.

### Usage

Use `todo` for:

- Items from a code review that won't be addressed in the current PR
- Refactor opportunities in unrelated modules
- Feature ideas or improvements discovered incidentally
- Technical debt notes

`todo` artifacts live alongside the work that triggered them (tied to the same
git moment), making it easy to trace _why_ the todo was created. File naming is
caller-defined (e.g., `review-items.md`, `refactor-auth.md`).

If a `todo` warrants tracked work on the board, create a `task` on master and
mark the `todo` `closed`.

**Create with:** `cue-todo(filename: "review-items.md", content: "# ...")`

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
- `todo` is **action-oriented**: "I discovered work that needs doing eventually."
- `note` is **exploration-oriented**: "I had a thought that needs examining."

If a `note` is addressed and the outcome warrants tracked work, create the
appropriate artifact (`task`, `spec`, `doc`) and mark the `note` `closed`. The
note itself has no further value once its content has migrated.

### Branch Placement

A `note` defaults to the current branch if triggered by current work, or to
`master` if the idea is project-global. Use the `branch` parameter to control
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

Artifacts within the `.cue/` directory must be created using the `cue-add` tool. However, if the file
already exists, use the standard `edit` tool to make changes to it. This ensures they are correctly
versioned and placed according to their purpose.

**CRITICAL: Use the `cue-add` tool ONLY to create NEW files. For existing files, use the `edit` tool. Do not use
manual file-writing tools (like `write` or `bash echo`) to create files inside `.cue/`.**

### Artifact Hygiene

- **`spec/` directory**: Keep root artifacts focused on stable, human-authored context. No technical
  analysis. Use `--root` for `index.md`, `log.md`, and `tickets/`.
- **`task/` artifacts**: Always point-in-time (never use `--root`). Always written
  to the master branch by `cue-task` (`--branch master` is passed internally).
  Represent the primary unit of work. Never create on feature branches.
- **`plan/` directory**: Root artifact for `index.md` (master plan). All executive plans are
  point-in-time (default, no `--root`).
- **`todo/` artifacts**: Always point-in-time (never use `--root`). Represent
  informal deferred notes, not primary work items. Use `task` for tracked work.
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

#### `cue-task`

Use `cue-task` to create primary work items (kanban cards). It automatically
sets `status`, `priority`, and `title` frontmatter and always writes to the
master branch (passes `--branch master` internally). Branch placement is not
a caller decision — tasks always live on master.

**Arguments:**

- `filename`: Slug-based name (e.g., `auth-login.md`). No numeric ID.
- `content`: Full body of the task, including the Acceptance Criteria table.
- `title`: Short display title for the board.
- `status` (optional): `open | in-progress | complete | closed`. Default is `open`.
- `priority` (optional): `critical | high | normal | low`. Default is `normal`.

#### `cue-todo`

Use `cue-todo` to capture informal out-of-scope notes. It automatically sets
the `status` and `priority` frontmatter.

**Arguments:**

- `filename`: The name of the file (e.g., `refactor-auth.md`).
- `content`: The note description.
- `status` (optional): `open | in-progress | complete | closed`. Default is `open`.
- `priority` (optional): `critical | high | normal | low`. Default is `normal`.

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
- `branch` (optional): Write note to a specific branch instead of current.

#### `cue-add`

- `type`: The artifact type. Standard types: `spec`, `plan`, `task`, `todo`, `note`, `trace`, `tmp`, `ref`, `bin`, `doc`.
  Custom types may be configured in `cue.json`.
- `filename`: The name of the file (e.g., `slice1.md`, `research-auth.md`).
- `content`: The full content to write to the file.
- `root` (optional boolean): When `true`, saves flat at `<type>/<filename>` — the root of the type
  directory. Use for stable anchor documents that are updated in place. Default is `false` (nested
  under `<type>/<timestamp>-<hash>/`).

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
- **`--all`, `-a`**: Lists artifacts across all branches.
- **`--branch <branch>`**: Lists artifacts for a specific branch.
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

### No Automated Commits to .cue/

**CRITICAL: Agents MUST NOT attempt to commit changes to the `.cue/` directory.**
Memory artifacts are managed in a separate git worktree and should only be committed by humans.
If you modify files in `.cue/`, leave them staged or unstaged as appropriate, but do not include them
in any `git commit` command.

## Style & Formatting

- **Line Length**: Keep code under 80 columns. 132 columns is acceptable only if it significantly improves readability.
- Do **NOT** use any emojis
