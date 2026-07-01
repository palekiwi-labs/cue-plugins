import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { frontmatterFlags } from "./frontmatter"

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
    refs: tool.schema.array(tool.schema.string()).default([]).describe(
      "Artifact paths (relative to .cue/) this plan links to. Emitted as a `refs:` YAML list."
    ),
    dir: tool.schema.string().optional().describe(
      "Run cue as if started in this directory instead of the session directory. " +
      "Mirrors the git -C convention; use to operate on another project's .cue/ directory."
    ),
  },
  async execute(args, context) {
    const tempPath = join(tmpdir(), `cue-plan-${Date.now()}.md`)
    try {
      await Bun.write(tempPath, args.content)

      const dirFlag = args.dir ? ["--dir", args.dir] : []
      const rootFlag = args.root ? ["--root"] : []
      const frontmatter: Record<string, string | string[]> = {
        status: args.status ?? "open",
        refs: args.refs,
      }
      const fmFlags = frontmatterFlags(frontmatter)

      const output = await Bun.$`cue add ${dirFlag} --type plan ${rootFlag} ${fmFlags} --file ${tempPath} ${args.filename}`
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
