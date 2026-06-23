import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "node:path"
import { tmpdir } from "node:os"

const cueTodoTool = tool({
  description: "Create a new todo artifact.",
  args: {
    filename: tool.schema.string().describe("Name of the file (e.g., 'review-items.md')"),
    content: tool.schema.string().describe("Full content of the artifact"),
    status: tool.schema.enum(["open", "in-progress", "complete", "closed"]).optional().default("open").describe(
      "Status of the todo"
    ),
    priority: tool.schema.enum(["critical", "high", "normal", "low"]).optional().default("normal").describe(
      "Priority of the todo"
    ),
    dir: tool.schema.string().optional().describe(
      "Run cue as if started in this directory instead of the session directory. " +
      "Mirrors the git -C convention; use to operate on another project's .cue/ directory."
    ),
  },
  async execute(args, context) {
    const tempPath = join(tmpdir(), `cue-todo-${Date.now()}.md`)
    try {
      await Bun.write(tempPath, args.content)

      const dirFlag = args.dir ? ["--dir", args.dir] : []
      const frontmatter = {
        status: args.status ?? "open",
        priority: args.priority ?? "normal",
      }
      const frontmatterFlags = Object.entries(frontmatter).flatMap(([k, v]) => ["--frontmatter", `${k}=${v}`])

      const output = await Bun.$`cue add ${dirFlag} --type todo ${frontmatterFlags} --file ${tempPath} ${args.filename}`
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

export const CueTodoPlugin: Plugin = async () => {
  return {
    tool: {
      "cue-todo": cueTodoTool,
    },
  }
}
