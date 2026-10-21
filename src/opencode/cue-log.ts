import { randomUUID } from "node:crypto"
import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { contextFlag, dirFlag, storeFlag } from "./cue-args"
import { runCue } from "./cue-exec"
import { buildReport, contextNote, estimateContextTokens } from "./context-usage"

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
            "Canonical address of a trace artifact " +
            "(e.g. 'palekiwi/palekiwi/cue-platform-direction/trace/handoff.md'), " +
            "resolved against the store root. Must name an existing file " +
            "inside the logged context's trace/ directory; any other " +
            "address is rejected. Attach one only when a " +
            "successor needs context beyond the found/decided/open bullets, " +
            "such as at a hand-off."
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
          context: tool.schema.string().describe(
            "Context slug to log against, within the repository's scope. " +
            "Required: cue has no default or fallback context and a write " +
            "with none fails. A context's recency is the newest entry in its " +
            "log, so logging is what keeps it findable."
          ),
          dir: tool.schema.string().optional().describe(
            "Run cue as if started in this directory instead of the session directory. " +
            "Mirrors the git -C convention; use to log against another repository's scope."
          ),
          store: tool.schema.string().optional().describe(
            "Root of the cue store, overriding $CUE_STORE. Rarely needed."
          ),
        },
        async execute(args, context) {
          const tempPath = join(tmpdir(), `cue-log-${randomUUID()}.json`)

          // Create the JSON payload for the cue CLI. Absent fields are
          // dropped by JSON.stringify rather than serialised as null, which
          // cue's entry reader rejects for the array fields.
          const payload = {
            title: args.title,
            trace: args.trace,
            found: args.found,
            decided: args.decided,
            open: args.open,
          }

          try {
            await Bun.write(tempPath, JSON.stringify(payload))
            const flags = [
              ...dirFlag(args.dir, context.directory),
              ...storeFlag(args.store),
              ...contextFlag(args.context),
            ]
            await runCue(["log", "add", ...flags, "--file", tempPath], context.directory)
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
