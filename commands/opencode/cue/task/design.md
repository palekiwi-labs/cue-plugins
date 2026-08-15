---
description: Infer and create a new cue design task (kind: design) for specification and context setup
---

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

!`cue status 2>/dev/null || echo "(cue status unavailable)"`

Load the `cue` and `git-commit` skills.

**Mandatory Instructions:**

1. **Infer and Create Cue Design Task:**
   - Analyze user instructions in `<user-instructions>` alongside current project context.
   - Infer a concise kebab-case slug (e.g. `design-auth-flow`), title, description, and actionable acceptance criteria focused on feature specification and context setup.
   - Call `cue-task` to create the card with `kind: "design"` and `status: "in-progress"`.

2. **Execution Guidelines (`kind: design`):**
   - Translate requirements and research into structured feature specifications (`spec/index.md`).
   - Define project boundaries, architectural expectations, and acceptance criteria without implementing feature code.
   - Expected outputs: feature specifications (`spec/`), initialized implementation task cards (`.cue/master/task/`), and reference documents (`doc/` or `trace/`).
   - Design task completes when the spec and implementation context are fully provisioned. Present a concise summary and proceed with design execution.

<user-instructions>
$ARGUMENTS
</user-instructions>
