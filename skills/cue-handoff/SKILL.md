---
name: cue-handoff
description: |
  Execute a clean hand-off to a successor agent when context saturation bounds
  are reached or when ending a session mid-task. Use when stopping work that
  another agent will resume.
---

# Cue Hand-Off Protocol

A hand-off ends a session cleanly so a fresh agent can resume the task
with no lost context. Run this deterministic closing sequence in order;
do not start new work once the sequence begins.

## Closing Sequence

1. **Stop new work**: finish the current atomic step (commit and log), or
   safely back out of half-broken edits. Start nothing new.
2. **Reconcile plan and todos**: mark completed items `- [x]`; ensure
   partially done items state remaining sub-items. Resolve or explicitly
   re-scope open `todo` artifacts.
3. **Persist a hand-off trace**:
   - Reference existing artifacts (specs, plans, logs) by path instead of
     duplicating their content.
   - Record exact file locations for in-flight changes (`path:line`).
   - Detail uncommitted state (staged, unstaged, untracked).
   - List explicit "Next Steps for Successor Agent".
4. **Emit the final hand-off summary** to the operator: stopping point,
   state of the master plan, committed vs uncommitted
   work, and the first action the successor should take.
