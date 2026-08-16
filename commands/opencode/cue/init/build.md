---
description: Infer and create a new cue build task (kind: build)
---

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

Load the `cue`, `cue-build`, `git-commit` and `tdd` skills.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Infer a concise kebab-case slug (e.g. `implement-jwt-auth`), title, and actionable acceptance criteria with evidence requirements.
 - Call `cue-task` to create the card with `kind: "build"` and `status: "in-progress"`.
 - Report back with a concise summary of the created card and await instructions unless explicit instructions are provided in `<user-instructions>`.

<user-instructions>
$ARGUMENTS
</user-instructions>
