---
description: Infer and create a new cue learn task (kind: learn)
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

Load the `cue` and `cue-learn` skills.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Infer a concise kebab-case slug (e.g. `learn-async-rust`), title, and task description.
 - Call `cue-task` to create the card with `kind: "learn"` and `status: "in-progress"`.
 - If the learning serves another task, link its card via `refs`.
 - Report back with a concise summary of the created card and await instructions unless explicit instructions are provided in `<user-instructions>`.
