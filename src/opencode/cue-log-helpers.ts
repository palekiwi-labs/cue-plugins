import { homedir } from "node:os"

/**
 * Reduce a trace reference to the form `cue log add --trace` accepts.
 *
 * cue resolves a relative trace against the *context directory* and then
 * requires the result to land inside that context's `trace/` directory
 * (crates/cue/src/log/mod.rs:213-263). So the only relative form it accepts is
 * context-relative: `trace/<name>.md`.
 *
 * Agents reach for the canonical address instead — `<scope>/<context>/trace/
 * <name>.md` — because that is what every other field in the bridge takes and
 * what `cue add` prints back. cue rejects it, and the bridge surfaced that as
 * a bare exit 1, which read as a flaky tool rather than a wrong argument.
 *
 * So: take the tail from the `trace/` segment onward. An absolute path is
 * passed through, since cue accepts those directly. Anything else is passed
 * through unchanged so cue's own error is what the agent sees.
 *
 * Kept pure, and out of the plugin module, for unit testing.
 */
export function traceReference(trace: string | undefined): string | undefined {
  const value = trace?.trim()
  if (!value) {
    return undefined
  }

  const expanded =
    value.startsWith("~/") || value === "~" ? homedir() + value.slice(1) : value

  if (expanded.startsWith("/")) {
    return expanded
  }

  const tail = expanded.match(/(?:^|\/)(trace\/.+)$/)
  return tail ? tail[1] : expanded
}
