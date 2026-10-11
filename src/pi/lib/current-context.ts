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

/** Parse `cue context pins` output: one canonical address per line. */
export function parsePins(stdout: string): string[] {
  return stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "")
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
