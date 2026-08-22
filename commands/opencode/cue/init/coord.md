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
 - Call `cue-task` to create the card with `kind: "coord"` and `status: "in-progress"`.
 - Report back with a concise summary of the created card and await instructions unless explicit instructions are provided in `<user-instructions>`.
