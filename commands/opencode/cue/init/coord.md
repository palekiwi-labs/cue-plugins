---
description: Create a new cue coordination context (kind: coord)
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

 - This command sets `kind`, not `mode`. `coord` is what ends the context — a
   standing arrangement that terminates only when its children do — and it
   selects no skill of its own. The session still has a mode, inferred below.
   There is no `cue-coord` skill.
 - Analyze user instructions in `<user-instructions>` if present.
 - Check `<existing-contexts>` before creating anything. If one of them already
   holds this arrangement, say so and ask whether to resume it instead. A slug
   is immutable identity and cannot be renamed, so a near-duplicate context is
   permanent.
 - Infer a concise kebab-case slug, a title, and a one-line description naming
   what is being coordinated across which boundaries.
 - Infer the session `mode` (usually `design` when setting the arrangement up,
   `research` when still working out what it spans) and say which you assumed.
 - Call `cue-context` with `kind: "coord"` and that mode.
 - Children are derived by scanning, never declared on the parent: a context
   joins this arrangement by carrying `parent: <scope>/<slug>` on its own
   record. This one needs no edit when children appear.
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
