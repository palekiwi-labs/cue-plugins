---
description: Infer and create a new cue design task (kind: design)
---

PWD: !`pwd`

Load the `cue` and `cue-design` skills.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Infer a concise kebab-case slug (e.g. `design-auth-flow`), title, and problem statement. Acceptance criteria are provisional at this stage and will be refined through the session.
 - Include in the acceptance criteria that the task is complete only when the user and the agent explicitly agree the design has converged, and that producing a specification does not constitute completion.
 - Call `cue-task` to create the card with `kind: "design"` and `status: "in-progress"`.
 - Present the created card, follow the `cue-design` skill, and open the session. Do not draft a specification in this turn.

<user-instructions>
$ARGUMENTS
</user-instructions>
