/**
 * Build the task frontmatter object from tool args.
 *
 * `status` defaults to "inbox" so agent-created tasks enter as triage items
 * rather than immediately actionable work; inbox is a declared status
 * precisely because the absence of a triage decision cannot be derived.
 *
 * There is no `kind`: it describes what ends a container of work, which is a
 * property of the context, not of a task. A context may hold several tasks
 * sharing one log, spec and plan.
 *
 * Kept pure, and out of the plugin module, for unit testing.
 */
export function taskFrontmatter(args: {
  title: string
  status?: string
  priority?: string
  parent?: string
  refs: string[]
}): Record<string, string | string[]> {
  const fm: Record<string, string | string[]> = {
    title: args.title,
    status: args.status ?? "inbox",
    priority: args.priority ?? "normal",
    refs: args.refs,
  }
  if (args.parent) {
    fm.parent = args.parent
  }
  return fm
}
