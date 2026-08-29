---
name: cue-handoff
description: |
  Execute a clean hand-off to a successor agent when context saturation
  bounds are reached (EXCEEDED_SOFT or CRITICAL from cue-context-usage) or
  when ending a session mid-task. Use when stopping work that another
  agent will resume.
---

# Cue Hand-Off Protocol

A hand-off ends a session cleanly so a fresh agent can resume the task
with no lost context. Run this deterministic closing sequence in order;
do not start new work once the sequence begins.

## Trigger Conditions

- `cue-context-usage` reports `exceeded_soft` (hand-off mandatory) or
  `critical` (immediate halt; emergency variant below).
- The operator ends the session while a task is in progress.
- A checkpoint decision (see the `cue` skill) calls for hand-off.

## Closing Sequence

1. **Stop new work**: finish only the in-flight atomic commit and its
   `cue-log` entry. Start no new plan items.
1. **Reconcile plan and todo checkboxes**: mark completed items `- [x]`;
   ensure partially done items keep explicit remaining sub-items.
   Resolve or explicitly re-scope any open `todo` artifacts.
1. **Log the milestone (`cue-log`)**: record decisions, findings, dead
   ends, and open questions with the task scope set explicitly.
1. **Persist a hand-off trace** via `cue-add` (type `trace`):
   - Target task scope and active branch/worktree.
   - Exact file locations for in-flight changes (`path:line`).
   - Uncommitted state (staged, unstaged, untracked).
   - A "Next Steps for Successor Agent" list.
1. **Emit the final hand-off summary** to the operator: stopping point,
   state of the master plan (`plan/index.md`), committed vs uncommitted
   work, and the first action the successor should take.

## Emergency Variant (CRITICAL)

When saturation is `critical`: cease all edits immediately, write only
the log entry and hand-off trace (steps 3-4), skip everything else, and
stop. Do not attempt checkpoint reconciliation or cleanup.

## Hand-Off Trace Template

```markdown
# Hand-Off: <task slug>

- Branch / worktree: <branch> at <worktree path>
- Last commit: <hash> <subject>
- Uncommitted: <staged/unstaged/untracked summary>
- In-flight files:
  - <path>:<line> — <what changed, what remains>

## Next Steps for Successor Agent

1. <first action>
2. <second action>
```

## Success Criteria

A hand-off is complete when a fresh session, given only the task card,
log, and hand-off trace, can resume work without re-discovering context.
