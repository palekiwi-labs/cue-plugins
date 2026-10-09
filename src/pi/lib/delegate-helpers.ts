/**
 * Pure helpers for the `delegate` tool: parsing cue-agent's JSON output,
 * building the model-facing tool description, and formatting batch
 * receipts for the calling agent. No process or filesystem access here.
 */

/** Per-call task cap enforced by cue-agent (no queue). */
export const MAX_TASKS = 4

export interface AgentInfo {
  name: string
  description: string | null
  model: string | null
}

export interface RunReceipt {
  agent: string
  model: string | null
  outcome: string
  exit_code: number | null
  duration_ms: number
  turns: number
  cost_usd: number
  response: string
  error: string | null
  stderr_excerpt: string | null
  trace: string | null
  trace_error: string | null
}

export interface BatchReceipt {
  batch_id: string
  runs: RunReceipt[]
}

/** Parse `cue-agent agents list --json` output into the agent roster. */
export function parseAgentList(stdout: string): AgentInfo[] {
  const parsed = JSON.parse(stdout) as { agents?: unknown }
  if (!Array.isArray(parsed.agents)) {
    throw new Error("cue-agent agents list: missing 'agents' array")
  }
  return parsed.agents.map((raw) => {
    const a = raw as Record<string, unknown>
    return {
      name: String(a.name),
      description: typeof a.description === "string" ? a.description : null,
      model: typeof a.model === "string" ? a.model : null,
    }
  })
}

/** The tool description: what it does, when to use it, and the roster. */
export function buildDescription(agents: AgentInfo[]): string {
  const roster = agents.length
    ? agents
        .map((a) => {
          const model = a.model ? ` (${a.model})` : ""
          const desc = a.description ? `: ${a.description}` : ""
          return `- ${a.name}${model}${desc}`
        })
        .join("\n")
    : "- (none configured; define agents in ~/.config/cue/cue-agent.json)"

  return [
    "Delegate work to named agents that run as separate pi processes.",
    "Each agent starts from scratch: it does NOT see this conversation,",
    "so every prompt must be self-contained (goal, relevant paths and",
    "facts, and what to return). Up to " + MAX_TASKS + " tasks run in",
    "parallel per call; the call returns when all have finished.",
    "",
    'Use it when the user says "delegate to <agent>", "ask <agent> to ...",',
    '"consult <agent>", or names an agent by its model (e.g. "ask opus"',
    "means the agent whose model is opus). Also use it to keep your own",
    "context small: hand off broad searches or second opinions and keep",
    "only the answer.",
    "",
    "Available agents:",
    roster,
  ].join("\n")
}

function formatDuration(ms: number): string {
  const s = ms / 1000
  return s < 60 ? `${s.toFixed(0)}s` : `${Math.floor(s / 60)}m${Math.round(s % 60)}s`
}

/** Format a batch receipt as markdown sections for the calling model. */
export function formatReceipt(batch: BatchReceipt): string {
  return batch.runs
    .map((run) => {
      const stats = [
        `${run.turns} turns`,
        formatDuration(run.duration_ms),
        `$${run.cost_usd.toFixed(4)}`,
      ].join(", ")
      const lines = [`## ${run.agent} - ${run.outcome} (${stats})`, ""]
      if (run.outcome === "completed") {
        lines.push(run.response.trim() || "(empty response)")
      } else {
        if (run.error) lines.push(`error: ${run.error}`)
        if (run.stderr_excerpt) lines.push("stderr:", run.stderr_excerpt.trim())
        if (run.response.trim()) lines.push("", "partial response:", run.response.trim())
      }
      if (run.trace) lines.push("", `trace: ${run.trace}`)
      if (run.trace_error) lines.push("", `trace error: ${run.trace_error}`)
      return lines.join("\n")
    })
    .join("\n\n")
}
