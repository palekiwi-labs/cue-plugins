---
description: Infer and create a new cue context, then open a session in it
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

Load the `cue` skill.

**Mandatory Instructions:**

- Analyze user instructions in `<user-instructions>` if present.
- Infer a concise kebab-case slug, a title, and a one-line description. Name
  the subject rather than the activity.
- Infer the session `mode` from the work at hand, and say which you assumed.
- Infer the context `kind`. Default to `work`.
- Call `cue-context` with that name, title, description, `kind` and `mode`.
- Load the skill matching the inferred mode (`cue-<mode>`), report back with a
  concise summary of the created context, and await instructions unless
  explicit instructions are provided in `<user-instructions>`.
