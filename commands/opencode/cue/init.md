---
description: Get a quick summary of project state
---

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`
!`cue context render --profile default 2>/dev/null`

Load the `cue` skill.

**Mandatory Instructions:**
1. Analyze the project intent and recent progress provided in the injected artifacts above.
2. Provide a lightning-fast, structured summary (Intent, Status, Next Steps).
3. **DO NOT** perform any further research, git commands, or file reads.
4. **DO NOT** engage in any other task.
5. Immediately report the summary to the user and await instructions unless provided in <user-instructions>:

<user-instructions>
$ARGUMENTS
</user-instructions>
