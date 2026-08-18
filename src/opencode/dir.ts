import { homedir } from "node:os"
import { isAbsolute, resolve } from "node:path"
import { existsSync } from "node:fs"

/**
 * Resolve the `--dir` option for cue CLI invocations.
 *
 * - Returns `[]` if `dir` is undefined or empty.
 * - Handles `~` expansion (e.g. `~/code/project` -> `/home/user/code/project`).
 * - For absolute paths, returns `["--dir", expandedDir]`.
 * - For relative paths (e.g. `spabreaks` or `../spabreaks`):
 *   1. Resolves against `cwd`: `resolve(cwd, dir)`
 *   2. If that path exists, returns `["--dir", resolvedPath]`
 *   3. If not, checks if a sibling directory exists (`resolve(cwd, "..", dir)`),
 *      handling common multi-repo workspace patterns (e.g. passing `dir: "spabreaks"`
 *      when active directory is `spabreaks-org`).
 *   4. If neither exists, falls back to `resolve(cwd, dir)` so cue CLI returns
 *      a clear "path does not exist" error.
 */
export function resolveDir(dir?: string, cwd?: string): string[] {
  if (!dir) {
    return []
  }

  let expanded = dir
  if (expanded.startsWith("~/") || expanded === "~") {
    expanded = homedir() + expanded.slice(1)
  }

  if (isAbsolute(expanded)) {
    return ["--dir", expanded]
  }

  const baseCwd = cwd || process.cwd()
  const candidate = resolve(baseCwd, expanded)
  if (existsSync(candidate)) {
    return ["--dir", candidate]
  }

  // Fallback check for sibling directory in multi-repo workspaces
  const siblingCandidate = resolve(baseCwd, "..", expanded)
  if (existsSync(siblingCandidate)) {
    return ["--dir", siblingCandidate]
  }

  return ["--dir", candidate]
}
