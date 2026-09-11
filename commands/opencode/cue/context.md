---
description: Initialize session context for a specified cue context
---

<user-instructions>
$2
</user-instructions>

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

<status>
!`cue status --context "$1" 2>/dev/null`
</status>

<log>
!`cue log list --context "$1" --format md`
</log>

!`cue render --context "$1" plan/index.md`

Load the `cue` skill.

**Mandatory Instructions:**

1. Analyze the project intent and recent progress provided in the injected artifacts above.
2. Provide a lightning-fast, structured summary (Intent, Status, Next Steps).
3. **DO NOT** perform any further research, git commands, or file reads.
4. **DO NOT** engage in any other task.
5. Immediately report the summary to the user and await instructions unless provided in <user-instructions>.
