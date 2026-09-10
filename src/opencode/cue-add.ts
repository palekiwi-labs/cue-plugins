import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { contextFlag, dirFlag, groupFlag, storeFlag } from "./cue-args"
import { frontmatterFlags } from "./frontmatter"

const cueAddTool = tool({
  description: "Create a new cue artifact (spec, plan, note, task, trace, tmp).",
  args: {
    type: tool.schema.enum([
      "spec",
      "plan",
      "note",
      "task",
      "trace",
      "tmp",
      "bin",
    ]).default("spec").describe(
      "Type of the artifact. spec is WHY, plan is HOW, task is WHAT, note is " +
      "idea capture; trace is an artifact about a revision (reviews, " +
      "hand-offs, diagnostics) and is stamped with repo_id and commit_hash; " +
      "tmp holds arbitrary files and requires a group; bin holds JSON."
    ),
    filename: tool.schema.string().describe(
      "Name of the file (e.g. 'migration-report.md'). Must not contain path " +
      "separators. Extensionless names get '.md' appended for markdown types."
    ),
    content: tool.schema.string().describe("Full content of the artifact"),
    frontmatter: tool.schema.record(
      tool.schema.string(),
      tool.schema.union([tool.schema.string(), tool.schema.array(tool.schema.string())])
    ).optional().describe(
      "Frontmatter fields to prepend to the artifact (e.g. { status: 'open', priority: 'high' }). " +
      "A value may be a string or an array of strings; an array becomes a YAML list " +
      "(e.g. { refs: ['palekiwi/palekiwi/cue-review/spec/index.md'] }). " +
      "created_at is stamped by cue; never set it here."
    ),
    context: tool.schema.string().describe(
      "Context slug to write into, within the repository's scope. Required: " +
      "cue has no default or fallback context and a write with none fails. " +
      "Discover slugs with `cue context list`."
    ),
    group: tool.schema.string().optional().describe(
      "Group name for tmp artifacts, required when type is tmp. Files land in " +
      "tmp/<created_at>-<commit_hash>-<group>/, reusing an existing group at " +
      "the same commit."
    ),
    dir: tool.schema.string().optional().describe(
      "Run cue as if started in this directory instead of the session directory. " +
      "Mirrors the git -C convention; use to write into another repository's scope."
    ),
    store: tool.schema.string().optional().describe(
      "Root of the cue store, overriding $CUE_STORE. Rarely needed; the " +
      "devshell exports the store every sandbox shares."
    ),
  },
  async execute(args, context) {
    const tempPath = join(tmpdir(), `cue-add-${Date.now()}.md`)
    try {
      // 1. Write content directly to a temporary file (Safe, no shell involved)
      await Bun.write(tempPath, args.content)

      // 2. Tell cue to read from that file (Safe, content is not a CLI arg)
      const flags = [
        ...dirFlag(args.dir, context.directory),
        ...storeFlag(args.store),
        ...contextFlag(args.context),
        ...groupFlag(args.group),
        ...(args.frontmatter ? frontmatterFlags(args.frontmatter) : []),
      ]

      const output = await Bun.$`cue add ${flags} --type ${args.type} --file ${tempPath} ${args.filename}`
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
