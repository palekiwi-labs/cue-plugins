---
description: Run project diagnostics to identify unaddressed reviews or issues
agent: cue-diagnostics
subtask: true
---

Perform a diagnostic check on the current state of the project.

!`$HOME/.config/opencode/scripts/git-context.sh`

1. **Artifact Audit**:
   - Run `cue list --type trace` and check for any artifacts that might contain code reviews or github review comments.
   - Read relevant files to identify raised issues or questions.

2. **Memory Consistency**:
   - Compare the findings with `spec/log.md` entries: have they been addressed?
   - Run `cue list --type plan` to locate any active executive plan and check for open `[ ]` steps related to the findings.
   - Run `cue list --type todo` to surface any backlog items that may be relevant.

3. **Code & Commit Verification**:
   - Check commits on the working branch (since the base branch) using `git log`: are any of them referring to issues or questions raised in the comments?
   - Optionally look at `git diff` against the base branch and confirm that issues have been addressed.

4. **Reporting**:
   - Respond with a summary of your findings.
   - Specifically highlight anything that looks like a known issue, feedback, or "dangling" question that hasn't been tackled or logged.
