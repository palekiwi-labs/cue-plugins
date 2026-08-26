---
description: Infer and create a new cue build task (kind: build)
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

Load the `cue`, `cue-build`, `git-commit` and `tdd` skills.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Infer a concise kebab-case slug (e.g. `implement-jwt-auth`), title, and task description.
 - Determine the initial status: use the status specified in `<user-instructions>` if present; otherwise ask the operator whether to start as `inbox` (triage later) or `in-progress` (start working now).
 - Call `cue-task` to create the card with `kind: "build"` and that status.
 - Report back with a concise summary of the created card and await instructions unless explicit instructions are provided in `<user-instructions>`.
