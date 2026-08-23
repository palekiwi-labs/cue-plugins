import { type Plugin, tool } from "@opencode-ai/plugin"
import { isAbsolute, join, resolve } from "node:path"
import { homedir, tmpdir } from "node:os"

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

const cueLogTool = tool({
  description: "Add a structured log entry to the memory system.",
  args: {
    title: tool.schema.string().describe("Title of the log entry"),
    body: tool.schema.string().optional().describe("Detailed description of the milestone"),
    found: tool.schema.array(tool.schema.string()).optional().describe("Findings discovered"),
    decided: tool.schema.array(tool.schema.string()).optional().describe("Decisions made"),
    open: tool.schema.array(tool.schema.string()).optional().describe("Remaining questions"),
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
      body: args.body,
      found: args.found,
      decided: args.decided,
      open: args.open,
    }

    try {
      await Bun.write(tempPath, JSON.stringify(payload))
      const dirFlag = resolveDir(args.dir, context.directory)
      const taskFlag = args.task ? ["--task", args.task] : []
      await Bun.$`cue log add ${dirFlag} ${taskFlag} --file ${tempPath}`.cwd(context.directory).quiet()
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

export const CueLogPlugin: Plugin = async () => {
  return {
    tool: {
      "cue-log": cueLogTool,
    },
  }
}
