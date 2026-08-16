---
description: Infer and create a new cue coordination task (kind: coord)
---

PWD: !`pwd`

Load the `cue` and `cue-coord` skills.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Infer a concise kebab-case slug (e.g. `coord-v2-release`), title, and high-level acceptance criteria for cross-boundary alignment.
 - Call `cue-task` to create the card with `kind: "coord"` and `status: "in-progress"`.
 - Present the created card, follow the `cue-coord` skill, and proceed with coordination.

<user-instructions>
$ARGUMENTS
</user-instructions>
