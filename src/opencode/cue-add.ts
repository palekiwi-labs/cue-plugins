import { type Plugin, tool } from "@opencode-ai/plugin"
import { isAbsolute, join, resolve } from "node:path"
import { homedir, tmpdir } from "node:os"
import { frontmatterFlags } from "./frontmatter"

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

const ROOT_DEFAULT_TYPES = new Set(["spec", "note", "doc", "plan"])

export function shouldUseRoot(type: string, root?: boolean): boolean {
  if (typeof root === "boolean") {
    return root
  }
  return ROOT_DEFAULT_TYPES.has(type)
}

const cueAddTool = tool({
  description: "Create a new cue artifact (spec, doc, trace, etc.).",
  args: {
    type: tool.schema.string().default("spec").describe(
      "Type of the artifact. Standard types: spec, plan, todo, trace, tmp, bin, doc. " +
      "Custom types may also be used if configured in cue.json."
    ),
    filename: tool.schema.string().describe(
      "Name of the file (e.g., 'research-report.md'). Extensionless names get '.md' " +
      "appended for markdown types (doc, note, plan, spec, task, todo)."
    ),
    content: tool.schema.string().describe("Full content of the artifact"),
    root: tool.schema.boolean().optional().describe(
      "When true, saves flat at <type>/<filename> — the root of the type directory. " +
      "Use for stable anchor documents that are updated in place. " +
      "Default is type-aware: true for spec, note, doc, plan; false for todo, trace, tmp."
    ),
    frontmatter: tool.schema.record(
      tool.schema.string(),
      tool.schema.union([tool.schema.string(), tool.schema.array(tool.schema.string())])
    ).optional().describe(
      "Frontmatter fields to prepend to the artifact (e.g. { status: 'open', priority: '1' }). " +
      "A value may be a string or an array of strings; an array becomes a YAML list " +
      "(e.g. { refs: ['master/spec/index.md'] })."
    ),
    task: tool.schema.string().describe(
      "Task scope for this invocation. Use 'master' for global context."
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
      const dirFlag = resolveDir(args.dir, context.directory)
      const isRoot = shouldUseRoot(args.type, args.root)
      const rootFlag = isRoot ? ["--root"] : []
      const taskFlag = args.task ? ["--task", args.task] : []
      const fmFlags = args.frontmatter ? frontmatterFlags(args.frontmatter) : []

      const output = await Bun.$`cue add ${dirFlag} --type ${args.type} ${rootFlag} ${taskFlag} ${fmFlags} --file ${tempPath} ${args.filename}`
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
