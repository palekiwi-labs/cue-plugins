import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { contextFlag, dirFlag, storeFlag } from "./cue-args"
import { runCue } from "./cue-exec"
import { frontmatterFlags } from "./frontmatter"

const cueAddTool = tool({
  description: "Create a new cue artifact (spec, plan, note, task, trace, review, bin, tmp).",
  args: {
    type: tool.schema
      .enum(["spec", "plan", "note", "task", "trace", "review", "bin", "tmp"])
      .default("spec")
      .describe(
        "Type of the artifact. spec is WHY, plan is HOW, task is WHAT, note " +
        "is idea capture; trace is a markdown artifact about a revision " +
        "(hand-offs, diagnostics, review walkthroughs), stamped with " +
        "repo_id and commit_hash; review is a JSON-object review payload " +
        "whose metadata is its own top-level keys; bin is an executable " +
        "script stored verbatim with the executable bit and carries no " +
        "metadata; tmp holds arbitrary files in a commit-pinned directory.",
      ),
    filename: tool.schema.string().describe(
      "Name of the file (e.g. 'migration-report.md', 'ideas/auth.md'). " +
      "Nested relative paths are allowed; absolute paths and '..' are not. " +
      "Extensionless names get '.md' appended for markdown types and " +
      "'.json' for review.",
    ),
    content: tool.schema.string().describe("Full content of the artifact"),
    frontmatter: tool.schema
      .record(tool.schema.string(), tool.schema.union([tool.schema.string(), tool.schema.array(tool.schema.string())]))
      .optional()
      .describe(
        "Metadata fields for the artifact. Markdown types carry them as a " +
        "YAML frontmatter block; a list value becomes a YAML list " +
        "(e.g. { refs: ['palekiwi/palekiwi/cue-review/spec/index.md'] }). " +
        "review merges them as top-level keys of the JSON object; bin " +
        "rejects metadata entirely. created_at is stamped by cue; never " +
        "set it here.",
      ),
    context: tool.schema.string().describe(
      "Context slug to write into, within the repository's scope. Required: " +
      "cue has no default or fallback context and a write with none fails. " +
      "Discover slugs with `cue context list`."
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
        ...(args.frontmatter ? frontmatterFlags(args.frontmatter) : []),
      ]

      return runCue(
        ["add", ...flags, "--type", args.type, "--file", tempPath, args.filename],
        context.directory,
      )
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
