---
description: Infer and create a new cue review task (kind: review) for code review, diff inspection, and eval generation
---

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

!`cue status 2>/dev/null || echo "(cue status unavailable)"`

Load the `cue`, `git-review-context`, `review-walkthrough`, and `git-commit` skills.

**Mandatory Instructions:**

1. **Infer and Create Cue Review Task:**
   - Analyze user instructions in `<user-instructions>` alongside current project context and branch diffs.
   - Infer a concise kebab-case slug (e.g. `review-pr-42`), title, description, and acceptance criteria focused on code quality, correctness, and evaluation traces.
   - Call `cue-task` to create the card with `kind: "review"` and `status: "in-progress"`.

2. **Execution Guidelines (`kind: review`):**
   - Inspect code diffs objectively to eliminate self-review bias.
   - Perform static/dynamic analysis, capture review feedback, record anti-patterns, and verify review fixes.
   - Expected outputs: review traces (`trace/`), pre/post-review diff snapshots, review comment payloads, anti-pattern docs (`doc/`), and approval attestations.
   - Completed review contexts serve as immutable scenario data for review tool evaluation.
   - Present a concise summary and proceed immediately with review execution.

<user-instructions>
$ARGUMENTS
</user-instructions>
