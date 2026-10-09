import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { contextChildren } from "../lib/context-children"
import { formatGitContext, gitContext } from "../lib/git-context"
import {
  composeMessage,
  cueBestEffort,
  sendPrompt,
  withoutCueSkillLoad,
} from "./common"

export const RESUME_INSTRUCTIONS = `Load the \`cue\` skill.

**Mandatory Instructions:**

1. Analyze the project intent and recent progress provided in the injected artifacts above.
2. Provide a lightning-fast, structured summary (Intent, Status, Next Steps).
3. **DO NOT** perform any further research, git commands, or file reads.
4. **DO NOT** engage in any other task.
5. Immediately report the summary to the user and await instructions unless provided in <user-instructions>.`

/**
 * Register `/cue:resume`: gather the full orientation (pwd, git context,
 * cue status, direct child contexts, recent log, spec+plan) and inject it
 * as the session-opening user message. Port of
 * `commands/opencode/cue/resume.md`.
 */
export function registerResumeCommand(pi: ExtensionAPI): void {
  pi.registerCommand("cue:resume", {
    description: "Initialize session context and resume the active context",
    handler: async (args, ctx) => {
      const cwd = ctx.cwd
      const git = formatGitContext(await gitContext(pi, cwd))
      const status = await cueBestEffort(pi, cwd, ["status"])
      const children = await contextChildren(pi, cwd)
      const log = await cueBestEffort(pi, cwd, [
        "log",
        "list",
        "--format",
        "md",
      ])
      const rendered = await cueBestEffort(pi, cwd, [
        "render",
        "spec/index.md",
        "plan/index.md",
      ])

      sendPrompt(
        pi,
        ctx,
        composeMessage([
          `<user-instructions>\n${args}\n</user-instructions>`,
          `PWD: ${cwd}`,
          git,
          `<status>\n${status}\n</status>`,
          children,
          `<log>\n${log}\n</log>`,
          rendered,
          withoutCueSkillLoad(RESUME_INSTRUCTIONS),
        ]),
      )
    },
  })
}
