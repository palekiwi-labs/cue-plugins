---
description: Create a new cue context for a build session (mode: build)
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

<existing-contexts>
!`cue context list`
</existing-contexts>

Load the `cue`, `cue-build`, `git-commit` and `tdd` skills.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Check `<existing-contexts>` before creating anything. If one of them already
   covers this work, say so and ask whether to resume it instead. A slug is
   immutable identity and cannot be renamed, so a near-duplicate context is
   permanent. Implementation of an already-designed thing usually belongs in
   the context that designed it.
 - Infer a concise kebab-case slug, a title, and a one-line description. Name
   the subject rather than the activity (`jwt-auth`, not `implement-jwt-auth`):
   a context outlives the mode it was opened in.
 - Call `cue-context` with `mode: "build"` and `kind: "work"`.
 - Do **not** create a task named after the context. That was the old model, in
   which the task card was the context descriptor. Tasks are created
   deliberately as the work decomposes, each with its own goal and completion
   condition. A build session works against a spec or a plan; create those with
   `cue-add` and `cue-plan` once the approach is agreed.
 - Pass `context: "<slug>"` explicitly on every cue call for the rest of this
   session. Binding the context to the branch is operator state: report
   `cue context switch <slug>` rather than running it.
 - Report back with a concise summary of the created context and await
   instructions unless explicit instructions are provided in
   `<user-instructions>`.
