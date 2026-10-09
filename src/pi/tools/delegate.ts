import type { ToolDefinition } from "@earendil-works/pi-coding-agent"
import { execFileSync, spawn } from "node:child_process"
import { Type } from "typebox"
import {
  type AgentInfo,
  type BatchReceipt,
  MAX_TASKS,
  buildDescription,
  formatReceipt,
  parseAgentList,
} from "../lib/delegate-helpers"

const BINARY = "cue-agent"

function makeParameters(names: string[]) {
  return Type.Object({
    tasks: Type.Array(
      Type.Object({
        agent: Type.Unsafe<string>({
          type: "string",
          enum: names,
          description: "Name of an agent from the list in the tool description.",
        }),
        prompt: Type.String({
          description:
            "Self-contained instructions. The agent cannot see this " +
            "conversation; include the goal, paths, facts, and what to return.",
        }),
      }),
      {
        minItems: 1,
        maxItems: MAX_TASKS,
        description: `1 to ${MAX_TASKS} tasks, run in parallel.`,
      },
    ),
    context: Type.Optional(
      Type.String({
        description:
          "Optional canonical cue context address '<org>/<repo>/<context>' " +
          "(must already exist) to capture each run as a trace. Omit to " +
          "skip capture.",
      }),
    ),
  })
}

/** Read the merged agent roster once, at extension load. */
function loadAgents(cwd: string): { agents: AgentInfo[]; error?: string } {
  try {
    const stdout = execFileSync(BINARY, ["agents", "list", "--json"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    return { agents: parseAgentList(stdout) }
  } catch (err) {
    return { agents: [], error: (err as Error).message }
  }
}

/** Run `cue-agent run - --json` with the spec on stdin; abort kills it. */
function runBatch(
  spec: unknown,
  cwd: string,
  signal: AbortSignal | undefined,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(BINARY, ["run", "-", "--json"], {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (d) => (stdout += d))
    child.stderr.on("data", (d) => (stderr += d))
    const onAbort = () => child.kill("SIGTERM")
    signal?.addEventListener("abort", onAbort, { once: true })
    child.on("error", reject)
    child.on("close", (code) => {
      signal?.removeEventListener("abort", onAbort)
      resolvePromise({ code, stdout, stderr })
    })
    child.stdin.end(JSON.stringify(spec))
  })
}

export function delegateTool(cwd: string = process.cwd()) {
  const { agents, error } = loadAgents(cwd)
  const names = agents.map((a) => a.name)
  const parameters = makeParameters(names)
  let description = buildDescription(agents)
  if (error) description += `\n\n(cue-agent unavailable at load: ${error})`

  const tool: ToolDefinition<typeof parameters> = {
    name: "delegate",
    label: "delegate",
    description,
    promptSnippet:
      "Delegate self-contained prompts to named agents, run in parallel; " +
      "keeps your own context small.",
    parameters,
    async execute(_toolCallId, args, signal, _onUpdate, ctx) {
      // Hardcoded for v1: session cwd, no worktree, no env, no overrides.
      const spec = {
        tasks: args.tasks.map((t) => ({
          agent: t.agent,
          prompt: t.prompt,
          cwd: ctx.cwd,
          ...(args.context ? { context: args.context } : {}),
        })),
      }
      const { code, stdout, stderr } = await runBatch(spec, ctx.cwd, signal)

      let batch: BatchReceipt
      try {
        batch = JSON.parse(stdout) as BatchReceipt
      } catch {
        // Admission failures (unknown agent, bad context, ...) print no receipt.
        throw new Error(
          `cue-agent run failed (exit ${code}): ${stderr.trim() || stdout.trim()}`,
        )
      }
      return {
        content: [{ type: "text", text: formatReceipt(batch) }],
        details: batch,
      }
    },
  }
  return tool
}
