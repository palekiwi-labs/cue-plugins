import { tool } from "@opencode-ai/plugin"
import cueAdd from "./cue-add"
 
export default tool({
  description: "Create a new task artifact (kanban board card). Always saved to the master branch.",
  args: {
    filename: tool.schema.string().describe("Slug-based name (e.g., 'auth-login.md'). No numeric ID."),
    content: tool.schema.string().describe("Full body of the task, including the Acceptance Criteria table."),
    title: tool.schema.string().describe("Short display title for the board."),
    status: tool.schema.enum(["open", "in-progress", "complete", "closed"]).optional().default("open").describe(
      "Status of the task"
    ),
    priority: tool.schema.enum(["critical", "high", "normal", "low"]).optional().default("normal").describe(
      "Priority of the task"
    ),
  },
  async execute(args, context) {
    return await cueAdd.execute({
      type: "task",
      filename: args.filename,
      content: args.content,
      branch: "master",
      root: false,
      frontmatter: {
        title: args.title,
        status: args.status ?? "open",
        priority: args.priority ?? "normal",
      },
    }, context)
  },
})
