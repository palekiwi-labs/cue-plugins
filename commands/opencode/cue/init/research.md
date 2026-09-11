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
 - Check `<existing-contexts>` before creating anything. If one of them already
   covers this work, say so and ask whether to resume it instead. A slug is
   immutable identity and cannot be renamed, so a near-duplicate context is
   permanent.
 - Infer a concise kebab-case slug, a title, and a one-line description. Name
   the subject rather than the activity (`sqlite-options`, not
   `eval-sqlite-options`): a context outlives the mode it was opened in.
 - Call `cue-context` with `mode: "research"` and `kind: "work"`, unless the
   material is durable reference that is never done, in which case use
   `kind: "reference"`.
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
