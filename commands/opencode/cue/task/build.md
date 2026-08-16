---
description: Infer and create a new cue build task (kind: build)
---

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

Load the `cue` and `cue-build` skills.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Infer a concise kebab-case slug (e.g. `implement-jwt-auth`), title, and actionable acceptance criteria with evidence requirements.
 - Call `cue-task` to create the card with `kind: "build"` and `status: "in-progress"`.
 - Present the created card, follow the `cue-build` skill, and proceed with the build session.

<user-instructions>
$ARGUMENTS
</user-instructions>
