---
description: Infer and create a new cue coordination task (kind: coord) for multi-component orchestration and supervision
---

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

!`cue status 2>/dev/null || echo "(cue status unavailable)"`

Load the `cue` and `git-commit` skills.

**Mandatory Instructions:**

1. **Infer and Create Cue Coord Task:**
   - Analyze user instructions in `<user-instructions>` alongside current multi-repository or cross-module project context.
   - Infer a concise kebab-case slug (e.g. `coord-v2-release`), title, description, and high-level acceptance criteria for cross-boundary alignment.
   - Call `cue-task` to create the card with `kind: "coord"` and `status: "in-progress"`.

2. **Execution Guidelines (`kind: coord`):**
   - Oversee initiatives spanning multiple repositories, modules, or child sub-tasks.
   - Supervise child task execution, enforce interface contracts, and verify end-to-end integration.
   - Expected outputs: child task definitions (`.cue/master/task/`), cross-boundary verification logs, and milestone tracking.
   - Coordination task is satisfied when all child tasks are complete and end-to-end integration is verified.
   - Present a concise summary and proceed immediately with coordination execution.

<user-instructions>
$ARGUMENTS
</user-instructions>
