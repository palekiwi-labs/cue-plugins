import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "node:path"
import { tmpdir } from "node:os"

const cuePlanTool = tool({
  description: "Create a new plan artifact.",
  args: {
    filename: tool.schema.string().describe("Name of the file (e.g., 'slice1.md')"),
    content: tool.schema.string().describe("Full content of the artifact"),
    root: tool.schema.boolean().default(false).describe(
      "Set to true for master plans (e.g. index.md). Set to false for executive plans " +
      "that reference a specific phase or slice from master plans."
    ),
    status: tool.schema.enum(["open", "in-progress", "complete", "closed"]).optional().default("open").describe(
      "Status of the plan"
    ),
  },
  async execute(args, context) {
    const tempPath = join(tmpdir(), `cue-plan-${Date.now()}.md`)
    try {
      await Bun.write(tempPath, args.content)

      const rootFlag = args.root ? ["--root"] : []
      const frontmatter = {
        status: args.status ?? "open",
      }
      const frontmatterFlags = Object.entries(frontmatter).flatMap(([k, v]) => ["--frontmatter", `${k}=${v}`])

      const output = await Bun.$`cue add --type plan ${rootFlag} ${frontmatterFlags} --file ${tempPath} ${args.filename}`
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

export const CuePlanPlugin: Plugin = async () => {
  return {
    tool: {
      "cue-plan": cuePlanTool,
    },
  }
}
