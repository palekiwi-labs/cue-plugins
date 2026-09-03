---
description: Intelligently summarize and compact the cue task log
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

!`cue status 2>/dev/null`

Load the `cue` skill.

**Mandatory Instructions:**

1. **Resolve Scope**:
   - If a task slug is specified in `<user-instructions>`, use that task scope (`--task <slug>`).
   - Otherwise, resolve the active task scope from `cue status` / `.cue/HEAD`.
   - The target log file is `.cue/<scope>/log.md`.

2. **Read the Full Log**:
   - Read `.cue/<scope>/log.md`.
   - If the log does not exist or has fewer than 2 entries, report that there is nothing to compact and stop.

3. **Intelligent Semantic Compaction**:
   Compact the log in-place following these strict rules:
   - **Prune ephemeral noise**: Strip all passing test suite counts (`Found: X specs pass`), linter statuses (`RuboCop 0 offenses`), clean git working tree assertions, and trivial commit confirmations (`Committed as <sha>`).
   - **Prune obsolete next-steps**: Remove all `Open:` bullet items that were transient workflow steps already completed in subsequent commits (e.g. `Open: switch branch`, `Open: run specs`, `Open: propagate changes to PR 2`). Keep ONLY genuinely unresolved domain questions, open stakeholder decisions, or external blockers.
   - **Coalesce micro-commit entries**: Combine sequential micro-commits or polish iterations on the same sub-task into a single clean milestone block with the consolidated decisions and discoveries.
   - **Preserve high-signal discoveries (`Found:`)**: Retain all non-obvious domain learnings, unexpected edge cases, bug root causes, and system quirks (e.g. database indexing quirks, third-party library behavior).
   - **Preserve architectural rationale (`Decided:`)**: Retain key architectural trade-offs, consensus decisions, design choices, invariants, and abandoned/rejected approaches (dead-ends).
   - **Preserve trace references**: Preserve all `[trace](...)` links associated with the milestones.
   - **Format Standard**: Maintain standard log formatting:
     ```markdown
     # Project Log

     ## [<hash>] <Milestone Title>

     [trace](trace/path/to/artifact.md)

     - **Found:** ...
     - **Decided:** ...
     - **Open:** ...
     ```

4. **Rewrite In-Place**:
   - Use the `edit` tool to update `.cue/<scope>/log.md` with the compacted markdown.

5. **Report to Operator**:
   - Provide a concise summary of the compaction: line count reduction (before vs after), number of entries consolidated, and the key durable insights and invariants preserved.
