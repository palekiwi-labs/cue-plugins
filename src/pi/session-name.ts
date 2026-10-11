import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { currentContext, slugOf } from "./lib/current-context"

/**
 * Name the pi session, and the tmux window holding this pane, after the
 * slug of a cue context. tmux failures are ignored; the original window
 * name is not restored on exit.
 */
export async function applyContextName(
  pi: ExtensionAPI,
  address: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const slug = slugOf(address)
  if (!slug) return
  pi.setSessionName(slug)
  if (!env.TMUX) return
  const target = env.TMUX_PANE ? ["-t", env.TMUX_PANE] : []
  try {
    await pi.exec("tmux", ["rename-window", ...target, slug])
  } catch {
    // not fatal: naming is cosmetic
  }
}

/**
 * Re-apply the name whenever the current context may have changed
 * outside an injection: session start/resume/fork and tree navigation.
 * No current context leaves names untouched.
 */
export function registerSessionNaming(pi: ExtensionAPI): void {
  const sync = async (ctx: {
    sessionManager: { getBranch(): readonly { type: string }[] }
  }) => {
    const address = currentContext(ctx.sessionManager.getBranch())
    if (address) await applyContextName(pi, address)
  }
  pi.on("session_start", async (_e, ctx) => sync(ctx))
  pi.on("session_tree", async (_e, ctx) => sync(ctx))
}
