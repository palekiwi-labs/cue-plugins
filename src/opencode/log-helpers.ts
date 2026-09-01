/**
 * Pure helpers for cue-log. Kept in a separate module so the plugin file
 * exports only the plugin function: opencode's legacy plugin loader calls
 * EVERY exported function with (input, options), so stray exports get
 * invoked as if they were plugins.
 */

export type LogEntry = {
  title: string
  trace?: string
  found?: string[]
  decided?: string[]
  open?: string[]
}

/**
 * Build the JSON payload handed to `cue log add --file`. It mirrors the
 * CLI's LogEntry schema exactly: a title, an optional trace reference and
 * the three bullet lists. There is no body — narrative detail belongs in a
 * trace artifact, referenced from the entry.
 *
 * The trace is forwarded verbatim; resolving it against the repository root
 * and checking that it exists is the CLI's job, since only it knows the
 * store layout.
 */
export function logPayload(args: LogEntry): LogEntry {
  return {
    title: args.title,
    trace: args.trace,
    found: args.found,
    decided: args.decided,
    open: args.open,
  }
}
