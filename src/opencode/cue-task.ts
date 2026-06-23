import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "node:path"
import { tmpdir } from "node:os"

const cueTaskTool = tool({
  description: "Create a new task artifact (kanban board card). Always saved to the master branch.",
  args: {
    filename: tool.schema.string().describe("Slug-based name (e.g., 'auth-login.md'). No numeric ID."),
    content: tool.schema.string().describe("Full body of the task, including the Acceptance Criteria table."),
    title: tool.schema.string().describe("Short display title for the board."),
    status: tool.schema.enum(["open", "in-progress", "complete", "closed"]).optional().default("open").describe(
      "Status of the task"
    ),
    priority: tool.schema.enum(["critical", "high", "normal", "low"]).optional().default("normal").describe(
      "Priority of the task"
    ),
    dir: tool.schema.string().optional().describe(
      "Run cue as if started in this directory instead of the session directory. " +
      "Mirrors the git -C convention; use to operate on another project's .cue/ directory."
    ),
  },
  async execute(args, context) {
    const tempPath = join(tmpdir(), `cue-task-${Date.now()}.md`)
    try {
      await Bun.write(tempPath, args.content)

      const dirFlag = args.dir ? ["--dir", args.dir] : []
      const frontmatter = {
        title: args.title,
        status: args.status ?? "open",
        priority: args.priority ?? "normal",
      }
      const frontmatterFlags = Object.entries(frontmatter).flatMap(([k, v]) => ["--frontmatter", `${k}=${v}`])

      const output = await Bun.$`cue add ${dirFlag} --type task --branch master ${frontmatterFlags} --file ${tempPath} ${args.filename}`
        .cwd(context.directory)
        .text()

      return output.trim()
    } finally {
      const file = Bun.file(tempPath)
      if (await file.exists()) {
        await Bun.$`rm ${tempPath}`.quiet()
      }
    }
  },
})

export const CueTaskPlugin: Plugin = async () => {
  return {
    tool: {
      "cue-task": cueTaskTool,
    },
  }
}
