---
description: Infer and create a new cue design task (kind: design) and open a collaborative design session
---

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

!`cue status 2>/dev/null || echo "(cue status unavailable)"`

Load the `cue`, `cue-design`, and `git-commit` skills.

**Mandatory Instructions:**

1. **Create the design task container:**
   - Analyse the user instructions in `<user-instructions>` alongside the project context above.
   - Infer a concise kebab-case slug (e.g. `design-auth-flow`), a title, and a problem statement. Acceptance criteria are provisional at this stage and will be refined through the session.
   - Include in the acceptance criteria that the task is complete only when the user and the agent explicitly agree the design has converged, and that producing a specification does not constitute completion.
   - Call `cue-task` with `kind: "design"` and `status: "in-progress"`.
   - The card exists to give the discussion a context scope to record into and to make the session recoverable later. It is not a signal to begin producing deliverables.

2. **Open the session:**
   - Present the created card, then follow the `cue-design` skill.
   - Do not draft a specification in this turn.

<user-instructions>
$ARGUMENTS
</user-instructions>
