/**
 * The session's current cue context: the context most recently
 * associated on the active branch of the session tree. Two entry kinds
 * of type CUE_CONTEXT_TYPE associate one, both carrying the canonical
 * address:
 *
 * - an injection: a `custom_message` (seen by the model), address in
 *   `details`;
 * - a link: a `custom` entry from `pi.appendEntry` (never sent to the
 *   model), address in `data`.
 *
 * The newest of either wins, so the session history is the only state
 * store and forks or tree navigation follow it naturally.
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
  data?: unknown
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
 * Canonical address of the last cue-context injection or link on the
 * branch, or undefined when there is none.
 */
export function currentContext(
  branch: readonly BranchEntry[],
): string | undefined {
  for (let i = branch.length - 1; i >= 0; i--) {
    const e = branch[i]!
    if (e.customType !== CUE_CONTEXT_TYPE) continue
    const payload =
      e.type === "custom_message"
        ? e.details
        : e.type === "custom"
          ? e.data
          : undefined
    const address = (payload as Partial<CueContextDetails> | undefined)
      ?.address
    if (typeof address === "string" && address !== "") return address
  }
  return undefined
}
