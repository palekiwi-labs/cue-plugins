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
  await renameTmuxWindow(pi, slug, env)
}

/** Window name for a session with no cue context and no name of its own. */
export const DEFAULT_WINDOW_NAME = "pi"

/** Rename the tmux window holding this pane; no-op outside tmux. */
export async function renameTmuxWindow(
  pi: ExtensionAPI,
  name: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  if (!env.TMUX) return
  const target = env.TMUX_PANE ? ["-t", env.TMUX_PANE] : []
  try {
    await pi.exec("tmux", ["rename-window", ...target, name])
  } catch {
    // not fatal: naming is cosmetic
  }
}

/**
 * Re-apply the name whenever the current context may have changed
 * outside an injection: session start/resume/fork and tree navigation.
 * With no current context the session name is left alone and the tmux
 * window follows the session: its own name if it has one (e.g. /name),
 * else "pi" -- so switching to a new session does not keep the
 * previous session's window name.
 *
 * An explicit session rename (/name, RPC) is the user's intent and
 * always wins: the tmux window follows the new session name even when
 * a cue context had named it before.
 */
export function registerSessionNaming(
  pi: ExtensionAPI,
  env: NodeJS.ProcessEnv = process.env,
): void {
  const sync = async (ctx: {
    sessionManager: { getBranch(): readonly { type: string }[] }
  }) => {
    const address = currentContext(ctx.sessionManager.getBranch())
    if (address) await applyContextName(pi, address, env)
    else
      await renameTmuxWindow(
        pi,
        pi.getSessionName() || DEFAULT_WINDOW_NAME,
        env,
      )
  }
  pi.on("session_start", async (_e, ctx) => sync(ctx))
  pi.on("session_tree", async (_e, ctx) => sync(ctx))
  pi.on("session_info_changed", async (e) =>
    renameTmuxWindow(pi, e.name || DEFAULT_WINDOW_NAME, env),
  )
}
