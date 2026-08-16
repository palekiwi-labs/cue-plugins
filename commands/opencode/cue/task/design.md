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
 - Report back with a concise summary of the created card and await instructions unless explicit instructions are provided in `<user-instructions>`.

<user-instructions>
$ARGUMENTS
</user-instructions>
