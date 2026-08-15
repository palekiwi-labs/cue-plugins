---
description: Infer and create a new cue build task (kind: build) for feature implementation and test execution
---

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

!`cue status 2>/dev/null || echo "(cue status unavailable)"`

Load the `cue`, `tdd`, and `git-commit` skills.

**Mandatory Instructions:**

1. **Infer and Create Cue Build Task:**
   - Analyze user instructions in `<user-instructions>` alongside current project context.
   - Infer a concise kebab-case slug (e.g. `implement-jwt-auth`), title, description, and actionable acceptance criteria with evidence requirements.
   - Call `cue-task` to create the card with `kind: "build"` and `status: "in-progress"`.

2. **Execution Guidelines (`kind: build`):**
   - Follow test-driven development (TDD) principles: write failing tests first (red), implement code (green), and refactor.
   - Maintain executive plan checkboxes (`- [x]`) as work progresses.
   - Ensure all acceptance criteria evidence fields are populated and tests pass before task completion.
   - Expected outputs: code diffs, passing test suites, executive plans (`plan/`), and milestone history entries (`log.md`).
   - Present a concise summary of the task card and proceed immediately with build execution.

<user-instructions>
$ARGUMENTS
</user-instructions>
