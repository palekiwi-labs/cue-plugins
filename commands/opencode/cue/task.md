---
description: Infer and create a new cue task from prompt and initialize context
---

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

!`cue status 2>/dev/null || echo "(cue status unavailable)"`

!`cue context render --profile default 2>/dev/null`

Load the `cue` skill and `git-commit` skill.

**Mandatory Instructions:**

1. **Infer and Create Cue Task:**
   - Analyze the user instructions in `<user-instructions>` along with current project state and context provided above.
   - Infer a concise, kebab-case slug (e.g. `add-feature-x`), a title, description, and actionable acceptance criteria.
   - Call the `cue-task` tool to create the new task card on `master` (`.cue/master/task/<slug>.md`) with `status: "in-progress"`.
   - Run `cue switch <slug>` via `bash` to set the active task context in `.cue/HEAD`.
   - Record the task creation using `cue-log`.

2. **Briefing and Execution:**
   - Present a concise summary of the created task card (slug, title, acceptance criteria).
   - Proceed directly to executing the task based on `<user-instructions>`.

<user-instructions>
$ARGUMENTS
</user-instructions>
