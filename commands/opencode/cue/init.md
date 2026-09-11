---
description: Infer and create a new cue context, then open a session in it
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

<existing-contexts>
!`cue context list`
</existing-contexts>

Load the `cue` skill.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Check `<existing-contexts>` before creating anything. If one of them already
   covers this work, say so and ask whether to resume it instead. A slug is
   immutable identity and cannot be renamed, so a near-duplicate context is
   permanent.
 - Infer a concise kebab-case slug, a title, and a one-line description. Name
   the subject rather than the activity (`auth-flow`, not `design-auth-flow`):
   a context outlives the mode it was opened in.
 - Infer the session `mode` (`research`, `design`, `build`, `review` or
   `learn`) from the work at hand, and say which you assumed.
 - Infer the context `kind`: `work` if it finishes when its goal is met,
   `coord` if it is a standing arrangement over child contexts or repositories,
   `reference` if it is durable material that is never done. Default to `work`.
   `kind` and `mode` are different axes — `kind` says what ends the context,
   `mode` says how this session behaves.
 - Call `cue-context` with that name, title, description, `kind` and `mode`.
 - Do **not** create a task named after the context. That was the old model, in
   which the task card was the context descriptor. Tasks are created
   deliberately as the work decomposes, each with its own goal and completion
   condition.
 - Pass `context: "<slug>"` explicitly on every cue call for the rest of this
   session. Binding the context to the branch is operator state: report
   `cue context switch <slug>` rather than running it.
 - Load the skill matching the inferred mode (`cue-<mode>`), report back with a
   concise summary of the created context, and await instructions unless
   explicit instructions are provided in `<user-instructions>`.
