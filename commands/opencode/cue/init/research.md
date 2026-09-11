---
description: Create a new cue context for a research session (mode: research)
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

<existing-contexts>
!`cue context list`
</existing-contexts>

Load the `cue` and `cue-research` skills.

**Mandatory Instructions:**

- Analyze user instructions in `<user-instructions>` if present.
- Infer a concise kebab-case slug, a title, and a one-line description. Name
  the subject rather than the activity.
- Call `cue-context` with `mode: "research"` and `kind: "work"`, unless the
  material is durable reference that is never done, in which case use
  `kind: "reference"`.
- Report back with a concise summary of the created context and await
  instructions unless explicit instructions are provided in
  `<user-instructions>`.
