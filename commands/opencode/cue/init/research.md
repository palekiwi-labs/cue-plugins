---
description: Infer and create a new cue research task (kind: research)
---

PWD: !`pwd`

Load the `cue` and `cue-research` skills.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Infer a concise kebab-case slug (e.g. `eval-sqlite-options`), title, and task description.
 - Call `cue-task` to create the card with `kind: "research"` and `status: "in-progress"`.
 - Report back with a concise summary of the created card and await instructions unless explicit instructions are provided in `<user-instructions>`.

<user-instructions>
$ARGUMENTS
</user-instructions>
