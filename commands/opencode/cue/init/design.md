---
description: Infer and create a new cue design task (kind: design)
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

Load the `cue` and `cue-design` skills.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Infer a concise kebab-case slug (e.g. `design-auth-flow`), title, and problem statement.
 - Note that the design task is complete only when the user and the agent explicitly agree the design has converged, and that producing a specification does not constitute completion.
 - Determine the initial status: use the status specified in `<user-instructions>` if present; otherwise ask the operator whether to start as `inbox` (triage later) or `in-progress` (start working now).
 - Call `cue-task` to create the card with `kind: "design"` and that status.
 - Report back with a concise summary of the created card and await instructions unless explicit instructions are provided in `<user-instructions>`.
