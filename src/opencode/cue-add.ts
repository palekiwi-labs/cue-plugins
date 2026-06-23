import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "node:path"
import { tmpdir } from "node:os"

const cueAddTool = tool({
  description: "Create a new cue artifact (spec, doc, trace, etc.).",
  args: {
    type: tool.schema.string().default("spec").describe(
      "Type of the artifact. Standard types: spec, plan, todo, trace, tmp, ref, bin, doc. " +
      "Custom types may also be used if configured in cue.json."
    ),
    filename: tool.schema.string().describe("Name of the file (e.g., 'research-report.md')"),
    content: tool.schema.string().describe("Full content of the artifact"),
    root: tool.schema.boolean().optional().describe(
      "When true, saves flat at <type>/<filename> — the root of the type directory. " +
      "Use for stable anchor documents that are updated in place. " +
      "Default is false (nested under <type>/<timestamp>-<hash>/)."
    ),
    frontmatter: tool.schema.record(tool.schema.string(), tool.schema.string()).optional().describe(
      "Frontmatter fields to prepend to the artifact (e.g. { status: 'open', priority: '1' })"
    ),
    branch: tool.schema.string().optional().describe(
      "Save artifact to a specific branch instead of current"
    ),
    dir: tool.schema.string().optional().describe(
      "Run cue as if started in this directory instead of the session directory. " +
      "Mirrors the git -C convention; use to operate on another project's .cue/ directory."
    ),
  },
  async execute(args, context) {
    const tempPath = join(tmpdir(), `cue-add-${Date.now()}.md`)
    try {
      // 1. Write content directly to a temporary file (Safe, no shell involved)
      await Bun.write(tempPath, args.content)

      // 2. Tell cue to read from that file (Safe, content is not a CLI arg)
      const dirFlag = args.dir ? ["--dir", args.dir] : []
      const rootFlag = args.root ? ["--root"] : []
      const branchFlag = args.branch ? ["--branch", args.branch] : []
      const frontmatterFlags = args.frontmatter
        ? Object.entries(args.frontmatter).flatMap(([k, v]) => ["--frontmatter", `${k}=${v}`])
        : []

      const output = await Bun.$`cue add ${dirFlag} --type ${args.type} ${rootFlag} ${branchFlag} ${frontmatterFlags} --file ${tempPath} ${args.filename}`
        .cwd(context.directory)
        .text()

      return output.trim()
    } finally {
      // 3. Clean up the temporary file
      const file = Bun.file(tempPath)
      if (await file.exists()) {
        await Bun.$`rm ${tempPath}`.quiet()
      }
    }
  },
})

export const CueAddPlugin: Plugin = async () => {
  return {
    tool: {
      "cue-add": cueAddTool,
    },
  }
}
