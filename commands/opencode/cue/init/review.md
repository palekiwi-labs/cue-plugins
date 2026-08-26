---
description: Infer and create a new cue review task (kind: review)
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

Load the `cue` and `cue-review` skills.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Infer a concise kebab-case slug (e.g. `review-pr-42`) and task title.
 - Determine the initial status: use the status specified in `<user-instructions>` if present; otherwise ask the operator whether to start as `inbox` (triage later) or `in-progress` (start working now).
 - Call `cue-task` to create the card with `kind: "review"` and that status.
 - Report back with a concise summary of the created card and await instructions unless explicit instructions are provided in `<user-instructions>`.
