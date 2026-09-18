---
description: Create a new cue context for a review session (mode: review)
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

Load the `cue` and `cue-review` skills.

**Mandatory Instructions:**

- Analyze user instructions in `<user-instructions>` if present.
- Infer a concise kebab-case slug, a title, and a one-line description.
- Call `cue-context` with `mode: "review"` and `kind: "work"`.
- Report back with a concise summary of the created context and await
  instructions unless explicit instructions are provided in
  `<user-instructions>`.
