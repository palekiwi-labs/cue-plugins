import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "node:path"
import { tmpdir } from "node:os"

export const cueLogTool = tool({
  description: "Add a structured log entry to the memory system.",
  args: {
    title: tool.schema.string().describe("Title of the log entry"),
    body: tool.schema.string().optional().describe("Detailed description of the milestone"),
    found: tool.schema.array(tool.schema.string()).optional().describe("Findings discovered"),
    decided: tool.schema.array(tool.schema.string()).optional().describe("Decisions made"),
    open: tool.schema.array(tool.schema.string()).optional().describe("Remaining questions"),
  },
  async execute(args) {
    const tempPath = join(tmpdir(), `cue-log-${Date.now()}.json`)

    // Create the JSON payload for the cue CLI
    const payload = {
      title: args.title,
      body: args.body,
      found: args.found,
      decided: args.decided,
      open: args.open,
    }

    try {
      await Bun.write(tempPath, JSON.stringify(payload))
      await Bun.$`cue log add --file ${tempPath}`.quiet()
      return `Logged milestone: ${args.title}`
    } finally {
      // Clean up the temporary file
      const file = Bun.file(tempPath)
      if (await file.exists()) {
        await Bun.$`rm ${tempPath}`.quiet()
      }
    }
  },
})

const CueLogPlugin: Plugin = async () => {
  return {
    tool: {
      "cue-log": cueLogTool,
    },
  }
}

export default CueLogPlugin
