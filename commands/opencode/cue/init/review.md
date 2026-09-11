---
description: Create a new cue context for a review session (mode: review)
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

<existing-contexts>
!`cue context list`
</existing-contexts>

Load the `cue` and `cue-review` skills.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Check `<existing-contexts>` before creating anything. Review of work that
   already has a context belongs in that context, where the spec and plan it is
   being reviewed against already live. Only create a new one when the review
   has no home — an inherited codebase, an external contribution, a dependency.
 - Infer a concise kebab-case slug, a title, and a one-line description. Name
   the subject rather than the activity (`pr-42`, not `review-pr-42`): a
   context outlives the mode it was opened in.
 - Call `cue-context` with `mode: "review"` and `kind: "work"`.
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
