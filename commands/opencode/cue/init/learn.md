---
description: Create a new cue context for a learning session (mode: learn)
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

Load the `cue` and `cue-learn` skills.

**Mandatory Instructions:**

- Analyze user instructions in `<user-instructions>`.
- Infer a concise kebab-case slug, a title, and a one-line description. Name
  the subject rather than the activity.
- Call `cue-context` with `mode: "learn"`. Use `kind: "work"` when the
  learning serves a goal that finishes, and `kind: "reference"` when the
  subject is durable material that goes cold rather than completing.
- Report back with a concise summary of the created context and await
  instructions unless explicit instructions are provided in
  `<user-instructions>`.
