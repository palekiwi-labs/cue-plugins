import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { spawn } from "node:child_process"
import { unlink } from "node:fs/promises"

const castAgentTaskTool = tool({
  description: `Launch a new agent to handle complex, multistep tasks autonomously.

When to use:
- For complex tasks requiring multiple steps, research, or cross-file changes.
- To explore a large or unfamiliar area of the codebase.
- To create a technical plan before implementation.
- To run a full build/test cycle and fix issues.

When NOT to use:
- For simple, single-file edits or direct tool calls.
- For information you already have in context.
- When you can easily do it yourself in 1-2 steps.

Guidance:
- Prefer 'explore' for codebase research to reduce context usage.
- Use 'plan' to break down complex features before building.
- You can launch multiple agents in parallel for faster discovery.`,
  args: {
    description: tool.schema.string().describe("A short (3-5 words) description of the task"),
    prompt: tool.schema.string().describe("The task for the agent to perform"),
    subagent_type: tool.schema.string().describe("The type of specialized agent to use for this task"),
  },
  async execute(args, context) {
    const tempPath = join(tmpdir(), `cast-task-${Date.now()}.md`)
    try {
      await Bun.write(tempPath, args.prompt)

      return await new Promise<string>((resolve, reject) => {
        if (context.abort.aborted) {
          reject(new Error("Aborted before start"))
          return
        }

        // TODO: pass --agent <subagent_type> once cast-agent supports it (Layer-1 dependency)
        const child = spawn("cast-agent", ["run", "--harness", "opencode", "--file", tempPath], {
          detached: true,
          stdio: ["ignore", "pipe", "pipe"],
          cwd: context.directory,
        })

        let stdoutString = ""
        let stderrString = ""

        child.stdout?.on("data", (data: Buffer) => {
          stdoutString += data.toString()
        })

        child.stderr?.on("data", (data: Buffer) => {
          stderrString += data.toString()
        })

        // Backstop timer handle; the primary teardown is cast-agent's own.
        let killTimer: ReturnType<typeof setTimeout> | undefined

        // cast-agent is DESIGNED to be interrupted via SIGINT/SIGTERM: its
        // supervisor catches the signal and gracefully tears down the child
        // harness, which runs in its OWN process group (cast-agent spawns it
        // with process_group(0)). A direct SIGKILL of cast-agent would bypass
        // that teardown and ORPHAN the opencode tree, so we SIGTERM cast-agent
        // (the process, not its group) and let it clean up its descendants.
        const onAbort = () => {
          try {
            child.kill("SIGTERM")
          } catch {
            // Already exited.
          }
          // Backstop: if cast-agent itself wedges past its own grace window,
          // SIGKILL its process group so cast-agent cannot linger. (By this
          // point cast-agent has already killed the opencode group.)
          killTimer = setTimeout(() => {
            if (child.pid) {
              try {
                process.kill(-child.pid, "SIGKILL")
              } catch {
                // Already dead.
              }
            }
          }, 10_000)
        }

        context.abort.addEventListener("abort", onAbort)
        // Guard the race where abort fired between spawn and listener setup.
        if (context.abort.aborted) onAbort()

        const cleanup = () => {
          context.abort.removeEventListener("abort", onAbort)
          if (killTimer) clearTimeout(killTimer)
        }

        child.on("error", (err) => {
          cleanup()
          reject(new Error(`Failed to start cast-agent: ${err.message}`))
        })

        child.on("close", (code) => {
          cleanup()
          if (context.abort.aborted) {
            reject(new Error("Task aborted"))
          } else if (code === 0) {
            resolve(stdoutString.trim())
          } else {
            reject(new Error(`cast-agent exited with code ${code}: ${stderrString.trim() || "No error output"}`))
          }
        })
      })
    } finally {
      try {
        await unlink(tempPath)
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  },
})

export const CastAgentTaskPlugin: Plugin = async () => {
  return {
    tool: {
      "task": castAgentTaskTool,
    },
  }
}
