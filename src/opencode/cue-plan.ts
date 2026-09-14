import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { contextFlag, dirFlag, storeFlag } from "./cue-args"
import { frontmatterFlags } from "./frontmatter"

const cuePlanTool = tool({
  description: "Create a new plan artifact.",
  args: {
    filename: tool.schema.string().describe(
      "Name of the file (e.g. 'lane-a-bridge.md'). Must not contain path separators."
    ),
    content: tool.schema.string().describe("Full content of the artifact"),
    status: tool.schema.enum(["open", "in-progress", "complete", "closed"]).optional().default("open").describe(
      "Status of the plan"
    ),
    parent: tool.schema.string().optional().describe(
      "Canonical address of the goal this plan serves, normally a task " +
      "(e.g. 'palekiwi/palekiwi/cue-review/task/scaffold-crate.md'). Omit only " +
      "for a context-level master plan, where the context has one overriding goal."
    ),
    refs: tool.schema.array(tool.schema.string()).default([]).describe(
      "Canonical addresses (<scope>/<context>/<type>/<name>) this plan links to. " +
      "Emitted as a `refs:` YAML list."
    ),
    context: tool.schema.string().describe(
      "Context slug to write into, within the repository's scope. Required: " +
      "cue has no default or fallback context and a write with none fails."
    ),
    dir: tool.schema.string().optional().describe(
      "Run cue as if started in this directory instead of the session directory. " +
      "Mirrors the git -C convention; use to write into another repository's scope."
    ),
    store: tool.schema.string().optional().describe(
      "Root of the cue store, overriding $CUE_STORE. Rarely needed."
    ),
  },
  async execute(args, context) {
    const tempPath = join(tmpdir(), `cue-plan-${Date.now()}.md`)
    try {
      await Bun.write(tempPath, args.content)

      const frontmatter: Record<string, string | string[]> = {
        status: args.status ?? "open",
        refs: args.refs ?? [],
      }
      if (args.parent) {
        frontmatter.parent = args.parent
      }
      const flags = [
        ...dirFlag(args.dir, context.directory),
        ...storeFlag(args.store),
        ...contextFlag(args.context),
        ...frontmatterFlags(frontmatter),
      ]

      const output = await Bun.$`cue add ${flags} --type plan --file ${tempPath} ${args.filename}`
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
