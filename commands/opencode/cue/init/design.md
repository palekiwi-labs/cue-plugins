---
description: Create a new cue context for a design session (mode: design)
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

<existing-contexts>
!`cue context list`
</existing-contexts>

Load the `cue` and `cue-design` skills.

**Mandatory Instructions:**

- Analyze user instructions in `<user-instructions>`.
- Infer a concise kebab-case slug, a title, and a one-line description. Name
  the subject rather than the activitya.
- Call `cue-context` with `mode: "design"` and `kind: "work"`.
- Report back with a concise summary of the created context and await
  instructions unless explicit instructions are provided in
  `<user-instructions>`.
