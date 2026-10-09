import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { contextChildren } from "../lib/context-children"
import { formatGitContext, gitContext } from "../lib/git-context"
import {
  composeMessage,
  cueBestEffort,
  sendPrompt,
  withoutCueSkillLoad,
} from "./common"

export const CONTEXT_INSTRUCTIONS = `Load the \`cue\` skill.

**Mandatory Instructions:**

1. Analyze the project intent and recent progress provided in the injected artifacts above.
2. Provide a lightning-fast, structured summary (Intent, Status, Next Steps).
3. **DO NOT** perform any further research, git commands, or file reads.
4. **DO NOT** engage in any other task.
5. Immediately report the summary to the user and await instructions unless provided in <user-instructions>.`

/**
 * Split `/cue:context <slug> [instructions]` arguments: the first
 * whitespace-separated token is the context slug, the remainder is the
 * optional instruction text.
 */
export function splitContextArgs(
  args: string,
): { slug: string; instructions: string } {
  const trimmed = args.trim()
  const [slug, ...rest] = trimmed.split(/\s+/)
  return { slug: slug ?? "", instructions: rest.join(" ") }
}

/**
 * Register `/cue:context <slug> [instructions]`: the same orientation as
 * `/cue:resume` but scoped to a named context, rendering only its master
 * plan. Port of `commands/opencode/cue/context.md`.
 */
export function registerContextCommand(pi: ExtensionAPI): void {
  pi.registerCommand("cue:context", {
    description: "Initialize session context for a specified cue context",
    handler: async (args, ctx) => {
      const { slug, instructions } = splitContextArgs(args)
      if (!slug) {
        sendPrompt(pi, ctx, "Usage: /cue:context <slug> [instructions]")
        return
      }

      const cwd = ctx.cwd
      const git = formatGitContext(await gitContext(pi, cwd))
      const status = await cueBestEffort(pi, cwd, [
        "status",
        "--context",
        slug,
      ])
      const children = await contextChildren(pi, cwd, slug)
      const log = await cueBestEffort(pi, cwd, [
        "log",
        "list",
        "--context",
        slug,
        "--format",
        "md",
      ])
      const rendered = await cueBestEffort(pi, cwd, [
        "render",
        "--context",
        slug,
        "plan/index.md",
      ])

      sendPrompt(
        pi,
        ctx,
        composeMessage([
          `<user-instructions>\n${instructions}\n</user-instructions>`,
          `PWD: ${cwd}`,
          git,
          `<status>\n${status}\n</status>`,
          children,
          `<log>\n${log}\n</log>`,
          rendered,
          withoutCueSkillLoad(CONTEXT_INSTRUCTIONS),
        ]),
      )
    },
  })
}
