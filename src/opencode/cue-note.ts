import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { frontmatterFlags } from "./frontmatter"

const cueNoteTool = tool({
  description: "Create a new note artifact.",
  args: {
    filename: tool.schema.string().describe(
      "Name of the file (e.g., 'idea-auth.md'). " +
      "May include a subdirectory to group related notes into a thread " +
      "(e.g., 'auth-redesign/index.md', 'auth-redesign/references.md')"
    ),
    content: tool.schema.string().describe("Full content of the note"),
    status: tool.schema.enum(["open", "in-progress", "closed"]).optional().default("open").describe(
      "Status of the note"
    ),
    refs: tool.schema.array(tool.schema.string()).default([]).describe(
      "Artifact paths (relative to .cue/) this note links to. Emitted as a `refs:` YAML list."
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
      const frontmatter: Record<string, string | string[]> = {
        status: args.status ?? "open",
        refs: args.refs,
      }
      const fmFlags = frontmatterFlags(frontmatter)

      // Notes are root-level by default: nesting under <ts>-<hash> provides no
      // value for authored documents and prevents subdirectory organization.
      const output = await Bun.$`cue add ${dirFlag} ${branchFlag} --type note --root ${fmFlags} --file ${tempPath} ${args.filename}`
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
