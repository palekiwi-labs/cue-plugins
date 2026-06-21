import { type Plugin, tool } from "@opencode-ai/plugin"
import { cueAddTool } from "./cue-add"

export const cueTodoTool = tool({
  description: "Create a new todo artifact.",
  args: {
    filename: tool.schema.string().describe("Name of the file (e.g., 'review-items.md')"),
    content: tool.schema.string().describe("Full content of the artifact"),
    status: tool.schema.enum(["open", "in-progress", "complete", "closed"]).optional().default("open").describe(
      "Status of the todo"
    ),
    priority: tool.schema.enum(["critical", "high", "normal", "low"]).optional().default("normal").describe(
      "Priority of the todo"
    ),
  },
  async execute(args, context) {
    return await cueAddTool.execute({
      type: "todo",
      filename: args.filename,
      content: args.content,
      root: false,
      frontmatter: {
        status: args.status ?? "open",
        priority: args.priority ?? "normal",
      },
    }, context)
  },
})

const CueTodoPlugin: Plugin = async () => {
  return {
    tool: {
      "cue-todo": cueTodoTool,
    },
  }
}

export default CueTodoPlugin
