---
description: Infer and create a new cue task from prompt and initialize context
---

<user-instructions>
$ARGUMENTS
</user-instructions>

PWD: !`pwd`

Load the `cue` skill.

**Mandatory Instructions:**

 - Analyze user instructions in `<user-instructions>` if present.
 - Infer a concise kebab-case slug (e.g. `add-feature-x`), title, task category (`kind: research|design|build|review|coord|learn`), and high-level context/description.
 - Determine the initial status: use the status specified in `<user-instructions>` if present; otherwise ask the operator whether to start as `inbox` (triage later) or `in-progress` (start working now).
 - Call `cue-task` to create the new task card with `kind` set (defaulting to `build` if ambiguous) and that status.
 - Load the skill corresponding to the inferred kind (`cue-<kind>`), report back with a concise summary of the created task card, and await instructions unless explicit instructions are provided in `<user-instructions>`.
