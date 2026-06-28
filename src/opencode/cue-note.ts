import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "node:path"
import { tmpdir } from "node:os"

const cueNoteTool = tool({
  description: "Create a new note artifact.",
  args: {
    filename: tool.schema.string().describe("Name of the file (e.g., 'idea-auth.md')"),
    content: tool.schema.string().describe("Full content of the note"),
    status: tool.schema.enum(["open", "in-progress", "closed"]).optional().default("open").describe(
      "Status of the note"
    ),
    branch: tool.schema.string().optional().describe(
      "Write note to a specific branch instead of current"
    ),
    dir: tool.schema.string().optional().describe(
      "Run cue as if started in this directory instead of the session directory. " +
      "Mirrors the git -C convention; use to operate on another project's .cue/ directory."
    ),
  },
  async execute(args, context) {
    const tempPath = join(tmpdir(), `cue-note-${Date.now()}.md`)
    try {
      await Bun.write(tempPath, args.content)

      const dirFlag = args.dir ? ["--dir", args.dir] : []
      const branchFlag = args.branch ? ["--branch", args.branch] : []
      const frontmatter = {
        status: args.status ?? "open",
      }
      const frontmatterFlags = Object.entries(frontmatter).flatMap(([k, v]) => ["--frontmatter", `${k}=${v}`])

      const output = await Bun.$`cue add ${dirFlag} ${branchFlag} --type note ${frontmatterFlags} --file ${tempPath} ${args.filename}`
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

export const CueNotePlugin: Plugin = async () => {
  return {
    tool: {
      "cue-note": cueNoteTool,
    },
  }
}
