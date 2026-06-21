import { type Plugin, tool } from "@opencode-ai/plugin"
import { cueAddTool } from "./cue-add"

export const cuePlanTool = tool({
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
    return await cueAddTool.execute({
      type: "plan",
      filename: args.filename,
      content: args.content,
      root: args.root,
      frontmatter: {
        status: args.status ?? "open",
      },
    }, context)
  },
})

const CuePlanPlugin: Plugin = async () => {
  return {
    tool: {
      "cue-plan": cuePlanTool,
    },
  }
}

export default CuePlanPlugin
