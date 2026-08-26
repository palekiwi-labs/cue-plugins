---
description: Infer and create a new cue coordination task (kind: coord)
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

Load the `cue` and `cue-coord` skills.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Infer a concise kebab-case slug (e.g. `coord-v2-release`), title, and task description for cross-boundary alignment.
 - Determine the initial status: use the status specified in `<user-instructions>` if present; otherwise ask the operator whether to start as `inbox` (triage later) or `in-progress` (start working now).
 - Call `cue-task` to create the card with `kind: "coord"` and that status.
 - Report back with a concise summary of the created card and await instructions unless explicit instructions are provided in `<user-instructions>`.
