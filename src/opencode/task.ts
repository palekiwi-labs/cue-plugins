import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { spawn } from "node:child_process"
import { unlink } from "node:fs/promises"

const castAgentTaskTool = tool({
  description: `Launch a new agent to handle complex, multistep tasks autonomously.

You must specify a subagent_type parameter to select which agent type to use.

When NOT to use:
- To read a specific file path; use Read or Glob instead.
- To find a specific class or symbol definition; use Grep instead.
- To search code within a specific file or 2-3 files; use Read instead.
- If no available agent is a good fit; use other tools directly.

Usage notes:
- Launch multiple agents concurrently whenever possible by emitting multiple tool uses in one message.
- Once you have delegated work to an agent, do not duplicate that work yourself.
- Each invocation starts with a fresh context. Your prompt should contain a highly detailed task description and specify exactly what information the agent should return in its final message.
- Clearly tell the agent whether it should write code or only do research.
- The agent's output is not visible to the user; summarize the result back to the user yourself.`,
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

        const child = spawn("cast-agent", ["run", "--harness", "opencode", "--agent", args.subagent_type, "--file", tempPath], {
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
