---
description: Infer and create a new cue research task (kind: research) for exploration and feasibility analysis
---

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

!`cue status 2>/dev/null || echo "(cue status unavailable)"`

Load the `cue`, `cue-research`, and `git-commit` skills.

**Mandatory Instructions:**

1. **Infer and Create Cue Research Task:**
   - Analyze user instructions in `<user-instructions>` alongside current project context.
   - Infer a concise kebab-case slug (e.g. `eval-sqlite-options`), title, description, and actionable acceptance criteria focused on knowledge gathering and trade-off analysis.
   - Call `cue-task` to create the card with `kind: "research"` and `status: "in-progress"`.

2. **Execution Guidelines (`kind: research`):**
   - Focus strictly on answering research questions, gathering facts, evaluating tools/options, and analyzing trade-offs.
   - Do NOT write feature implementation code or draft target repository specs during a research task.
   - Expected outputs: diagnostic traces (`trace/`), research documents (`doc/`), exploration notes (`note/`), and milestone history entries (`log.md`).
   - Present a concise summary of the task card and proceed immediately with research execution.

<user-instructions>
$ARGUMENTS
</user-instructions>
