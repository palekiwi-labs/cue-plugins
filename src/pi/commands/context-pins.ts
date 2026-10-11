import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent"
import { contextChildren } from "../lib/context-children"
import {
  CUE_CONTEXT_TYPE,
  type CueContextDetails,
  parsePins,
  slugOf,
} from "../lib/current-context"
import { applyContextName } from "../session-name"
import { formatGitContext, gitContext } from "../lib/git-context"
import { composeMessage, cueBestEffort } from "./common"

/**
 * Gather the orientation block for a context: pwd, git, status, direct
 * children, log and master plan. Data only; no instructions, so the
 * operator's next prompt decides what to do with it.
 */
export async function contextOrientation(
  pi: ExtensionAPI,
  cwd: string,
  slug: string,
): Promise<string> {
  const git = formatGitContext(await gitContext(pi, cwd))
  const ctxArgs = ["--context", slug]
  const status = await cueBestEffort(pi, cwd, ["status", ...ctxArgs])
  const children = await contextChildren(pi, cwd, slug)
  const log = await cueBestEffort(pi, cwd, [
    "log",
    "list",
    ...ctxArgs,
    "--format",
    "md",
  ])
  const rendered = await cueBestEffort(pi, cwd, [
    "render",
    ...ctxArgs,
    "plan/index.md",
  ])
  return composeMessage([
    `Active cue context for this session: ${slug}`,
    `PWD: ${cwd}`,
    git,
    `<status>\n${status}\n</status>`,
    children,
    `<log>\n${log}\n</log>`,
    rendered,
  ])
}

/**
 * Inject a context into the session without starting a turn. Sent while
 * idle with no delivery options, pi persists it as a displayed
 * custom_message entry immediately (`deliverAs: "nextTurn"` would hold it
 * in memory, unseen and unpersisted, until the next prompt).
 */
export async function injectContext(
  pi: ExtensionAPI,
  cwd: string,
  address: string,
): Promise<void> {
  const details: CueContextDetails = { address }
  pi.sendMessage({
    customType: CUE_CONTEXT_TYPE,
    content: await contextOrientation(pi, cwd, slugOf(address)),
    display: true,
    details,
  })
  await applyContextName(pi, address)
}

async function handler(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<void> {
  if (!ctx.isIdle()) {
    ctx.ui.notify("cue: wait for the agent to finish first", "warning")
    return
  }
  const pins = parsePins(
    await cueBestEffort(pi, ctx.cwd, ["context", "pins"]),
  )
  if (pins.length === 0) {
    ctx.ui.notify("cue: no pinned contexts in this scope", "info")
    return
  }
  const picked = await ctx.ui.select("Inject cue context", pins)
  if (!picked) return
  await injectContext(pi, ctx.cwd, picked)
}

/** Register `/cue:context:pins`: pick a pinned context and inject it. */
export function registerContextPinsCommand(pi: ExtensionAPI): void {
  pi.registerCommand("cue:context:pins", {
    description: "Pick a pinned cue context and inject it into the session",
    handler: async (_args, ctx) => handler(pi, ctx),
  })
}
