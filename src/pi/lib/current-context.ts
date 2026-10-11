/**
 * The session's current cue context: the context most recently injected
 * on the active branch of the session tree. Each injection is a
 * `custom_message` entry of type CUE_CONTEXT_TYPE whose `details` carry
 * the canonical address, so the session history is the only state store
 * and forks or tree navigation follow it naturally.
 */

export const CUE_CONTEXT_TYPE = "cue-context"

export interface CueContextDetails {
  address: string
}

/** Minimal entry shape read from `sessionManager.getBranch()`. */
interface BranchEntry {
  type: string
  customType?: string
  details?: unknown
}

/** Last segment of a canonical context address (`org/repo/slug`). */
export function slugOf(address: string): string {
  const parts = address.split("/").filter((p) => p !== "")
  return parts[parts.length - 1] ?? ""
}

export interface PinnedContext {
  slug: string
  address: string
  /** Canonical address of the parent context, when it has one. */
  parent?: string
  /** Newest log entry (Unix seconds); 0 when never logged. */
  lastLoggedAt: number
}

/**
 * Parse `cue context list --json --pinned --sort recency`: keep the CLI
 * order (newest log entry first, never-logged last) and drop malformed
 * rows.
 */
export function parsePinned(stdout: string): PinnedContext[] {
  let rows: unknown
  try {
    rows = JSON.parse(stdout || "[]")
  } catch {
    return []
  }
  if (!Array.isArray(rows)) return []
  const out: PinnedContext[] = []
  for (const r of rows as {
    context?: unknown
    scope?: unknown
    parent?: unknown
    last_logged_at?: unknown
  }[]) {
    if (typeof r?.context !== "string" || typeof r?.scope !== "string") continue
    const pin: PinnedContext = {
      slug: r.context,
      address: `${r.scope}/${r.context}`,
      lastLoggedAt:
        typeof r.last_logged_at === "number" ? r.last_logged_at : 0,
    }
    if (typeof r.parent === "string" && r.parent !== "") pin.parent = r.parent
    out.push(pin)
  }
  return out
}

/**
 * Canonical address of the last cue-context injection on the branch, or
 * undefined when none was injected.
 */
export function currentContext(
  branch: readonly BranchEntry[],
): string | undefined {
  for (let i = branch.length - 1; i >= 0; i--) {
    const e = branch[i]!
    if (e.type !== "custom_message" || e.customType !== CUE_CONTEXT_TYPE) {
      continue
    }
    const address = (e.details as Partial<CueContextDetails> | undefined)
      ?.address
    if (typeof address === "string" && address !== "") return address
  }
  return undefined
}
