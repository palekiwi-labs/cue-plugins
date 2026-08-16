---
description: Infer and create a new cue task from prompt and initialize context
---

PWD: !`pwd`

Load the `cue` skill.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Infer a concise kebab-case slug (e.g. `add-feature-x`), title, task category (`kind: research|design|build|review|coord`), and acceptance criteria.
 - Call `cue-task` to create the new task card with `kind` set (defaulting to `build` if ambiguous) and `status: "in-progress"`.
 - Load the skill corresponding to the inferred kind (`cue-<kind>`), present a concise summary of the created task card, and proceed following that kind skill.

<user-instructions>
$ARGUMENTS
</user-instructions>
