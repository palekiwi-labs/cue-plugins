---
description: Create a new cue context for a learning session (mode: learn)
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

<existing-contexts>
!`cue context list`
</existing-contexts>

Load the `cue` and `cue-learn` skills.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Check `<existing-contexts>` before creating anything. If one of them already
   covers this subject, say so and ask whether to resume it instead. A slug is
   immutable identity and cannot be renamed, so a near-duplicate context is
   permanent.
 - Infer a concise kebab-case slug, a title, and a one-line description. Name
   the subject rather than the activity (`async-rust`, not `learn-async-rust`):
   a context outlives the mode it was opened in.
 - Call `cue-context` with `mode: "learn"`. Use `kind: "work"` when the
   learning serves a goal that finishes, and `kind: "reference"` when the
   subject is durable material that goes cold rather than completing.
 - If the learning serves other work, pass that context or artifact address in
   `refs`.
 - Do **not** create a task named after the context. That was the old model, in
   which the task card was the context descriptor. Tasks are created
   deliberately as the work decomposes, each with its own goal and completion
   condition.
 - Pass `context: "<slug>"` explicitly on every cue call for the rest of this
   session. Binding the context to the branch is operator state: report
   `cue context switch <slug>` rather than running it.
 - Report back with a concise summary of the created context and await
   instructions unless explicit instructions are provided in
   `<user-instructions>`.
