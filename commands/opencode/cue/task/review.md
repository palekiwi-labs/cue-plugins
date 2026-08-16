---
description: Infer and create a new cue review task (kind: review)
---

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

Load the `cue` and `cue-review` skills.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Infer a concise kebab-case slug (e.g. `review-pr-42`) and task title.
 - Call `cue-task` to create the card with `kind: "review"` and `status: "in-progress"`.
 - Report back with a concise summary.

<user-instructions>
$ARGUMENTS
</user-instructions>
