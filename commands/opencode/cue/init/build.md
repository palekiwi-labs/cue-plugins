---
description: Create a new cue context for a build session (mode: build)
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

Load the `cue`, `cue-build`, `git-commit` and `tdd` skills.

**Mandatory Instructions:**

- Analyze user instructions in `<user-instructions>`.
- Infer a concise kebab-case slug, a title, and a one-line description. Name
  the subject rather than the activity.
- Call `cue-context` with `mode: "build"` and `kind: "work"`.
- Report back with a concise summary of the created context and await
  instructions unless explicit instructions are provided in
  `<user-instructions>`.
