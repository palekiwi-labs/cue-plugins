# cue CLI Reference

The `cue` command-line tool manages file-based context and memory artifacts in
the main Git root's `.cue/` store. Linked worktrees share that store while each
keeps a local `.cue/HEAD` selection.

Scoped commands resolve context as `--task <SLUG>` > `$CUE_TASK` > local
`.cue/HEAD` > `master`. Agents should set `$CUE_TASK` for child processes and
sessions instead of changing the human-owned HEAD file.

## Primary Commands

### `cue status`
Prints the resolved context scope.

```bash
cue status
cue status --json
```

### `cue switch`
Switches the active context scope written to `.cue/HEAD`.

```bash
cue switch auth-login                        # switch to task context
cue switch master                            # return to global context
cue switch --branch feat/auth-login          # switch to task matching branch
```

### `cue list`
Queries, lists, and filters artifacts across context scopes. Always prefer `cue list` over raw `grep` or `find` on `.cue/`.

```bash
cue list [OPTIONS]
```

**Key Flags:**
- `--type <TYPE>`, `-t <TYPE>`: Filter by artifact category (`task`, `plan`, `spec`, `todo`, `note`, `trace`, `doc`).
- `--task <SLUG>`: Target a specific task scope without mutating `.cue/HEAD`;
  overrides `$CUE_TASK` and HEAD.
- `--all`, `-a`: Search across all task context directories in `.cue/`.
- `--json`, `-j`: Output a JSON array of `CueFile` objects.
- `--frontmatter`: Include parsed YAML frontmatter objects in JSON output (implies `--json`).
- `--filter <EXPR>`: Repeatable frontmatter filter expression (`KEY=VALUE`, `KEY!=VALUE`, `KEY~=SUBSTRING`).
- `-C <PATH>`, `--dir <PATH>`: Run as if started in `<PATH>` (mirrors `git -C` for cross-repo queries).

**Common Query Examples:**
```bash
# List all tasks on master board
cue list --task master --type task

# Find open/in-progress tasks
cue list --task master --type task --filter "status!=complete" --filter "status!=closed"

# Find child tasks of a parent
cue list --task master --type task --filter "parent=auth-redesign"

# Find high priority items with parsed frontmatter
cue list --task master --type task --filter "priority=high" --frontmatter

# Search artifacts across another repository
cue list -C /path/to/repo --all --type task
```

### `cue add`
Creates a new memory artifact in the active or target context scope.

```bash
cue add --type <TYPE> <FILENAME> [FLAGS]
```

**Flags:**
- `--root`: Save as flat/root document at `.cue/<context>/<type>/<filename>` (e.g. `spec/index.md`).
- `--task <SLUG>`: Override target context scope for this creation call.

### `cue log`
Appends a structured history entry to `.cue/<context>/log.md`.

```bash
cue log --title "Summary" --found "Discovery" --decided "Choice" --open "Question"
```
