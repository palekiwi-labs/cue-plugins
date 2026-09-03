import { type Plugin, tool } from "@opencode-ai/plugin"
import { isAbsolute, join, resolve } from "node:path"
import { homedir, tmpdir } from "node:os"
import { buildReport, contextNote, estimateContextTokens } from "./context-usage"

function resolveDir(dir: string | undefined, cwd: string): string[] {
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
  return ["--dir", resolve(cwd, expanded)]
}

export const CueLogPlugin: Plugin = async (input) => {
  // Append a one-line context state note to the tool output so agents
  // learn saturation level at natural checkpoints without a dedicated
  // query. Fails silent: a note is never worth failing the log over.
  async function contextStateLine(sessionID: string): Promise<string> {
    try {
      const res = await input.client.session.messages({
        path: { id: sessionID },
      })
      if (res.error) {
        return ""
      }
      const { tokens } = estimateContextTokens(res.data ?? [])
      return contextNote(buildReport(tokens).level)
    } catch {
      return ""
    }
  }

  return {
    tool: {
      "cue-log": tool({
        description: "Add a structured milestone, discovery, or post-commit log entry to the cue memory system.",
        args: {
          title: tool.schema.string().describe("Concise summary of the milestone, commit, or discovery."),
          trace: tool.schema.string().optional().describe(
            "Repository-relative or absolute reference to a trace artifact. " +
            "Attach one only when a successor needs context beyond the " +
            "found/decided/open bullets, such as at a hand-off."
          ),
          found: tool.schema.array(tool.schema.string()).optional().describe(
            "Discovered facts, unexpected behaviors, system quirks, or root causes. " +
            "Do NOT record passing test counts, linter outputs, or clean git statuses. Omit if empty."
          ),
          decided: tool.schema.array(tool.schema.string()).optional().describe(
            "Architectural choices, trade-offs made, or abandoned/rejected approaches. " +
            "Do NOT record mechanical code edits, routine renames, or commit actions. Omit if empty."
          ),
          open: tool.schema.array(tool.schema.string()).optional().describe(
            "Unresolved domain ambiguities, pending stakeholder decisions, or external blockers. " +
            "Do NOT record next-step plan items or workflow actions. Omit if empty."
          ),
          task: tool.schema.string().describe(
            "Task scope for this invocation. Use 'master' for global context."
          ),
          dir: tool.schema.string().optional().describe(
            "Run cue as if started in this directory instead of the session directory. " +
            "Mirrors the git -C convention; use to operate on another project's .cue/ directory."
          ),
        },
        async execute(args, context) {
          const tempPath = join(tmpdir(), `cue-log-${Date.now()}.json`)

          // Create the JSON payload for the cue CLI
          const payload = {
            title: args.title,
            trace: args.trace,
            found: args.found,
            decided: args.decided,
            open: args.open,
          }

          try {
            await Bun.write(tempPath, JSON.stringify(payload))
            const dirFlag = resolveDir(args.dir, context.directory)
            const taskFlag = args.task ? ["--task", args.task] : []
            await Bun.$`cue log add ${dirFlag} ${taskFlag} --file ${tempPath}`.cwd(context.directory).quiet()
            const note = await contextStateLine(context.sessionID)
            return note ? `Logged milestone: ${args.title}\n${note}` : `Logged milestone: ${args.title}`
          } finally {
            // Clean up the temporary file
            const file = Bun.file(tempPath)
            if (await file.exists()) {
              await Bun.$`rm ${tempPath}`.quiet()
            }
          }
        },
      }),
    },
  }
}
