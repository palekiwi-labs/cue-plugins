import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { contextFlag, dirFlag, storeFlag } from "./cue-args"
import { runCue } from "./cue-exec"
import { frontmatterFlags } from "./frontmatter"
import { taskFrontmatter } from "./cue-task-helpers"

const cueTaskTool = tool({
  description:
    "Create a new task artifact inside a context. A task is the only " +
    "artifact that can be done: it is defined by a goal and a completion " +
    "condition.",
  args: {
    filename: tool.schema.string().describe(
      "Slug-based name (e.g. 'auth-login.md'). No numeric ID, no path separators."
    ),
    content: tool.schema.string().describe("Full body of the task: the goal and its completion condition."),
    title: tool.schema.string().describe("Short display title."),
    status: tool.schema.enum(["open", "in-progress", "complete", "closed"]).optional().default("open").describe(
      "Status of the task. Defaults to \"open\": a task is created " +
      "deliberately with a defined goal, so it is triaged by the act of " +
      "writing it. Promote to \"in-progress\" while working, " +
      "\"complete\"/\"closed\" when done."
    ),
    priority: tool.schema.enum(["critical", "high", "normal", "low"]).optional().default("normal").describe(
      "Priority of the task. The only scheduling field."
    ),
    parent: tool.schema.string().optional().describe(
      "Canonical address of the parent task or context " +
      "(e.g. 'palekiwi/palekiwi/cue-platform-direction'). Emitted as `parent:` frontmatter."
    ),
    refs: tool.schema.array(tool.schema.string()).default([]).describe(
      "Canonical addresses (<scope>/<context>/<type>/<name>) this task links to, " +
      "such as the spec it implements. Emitted as a `refs:` YAML list."
    ),
    context: tool.schema.string().describe(
      "Context slug to file the task under, within the repository's scope. " +
      "Required: task identity is namespaced by its context and there is no " +
      "global board. Create the context first if it does not exist."
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
    const tempPath = join(tmpdir(), `cue-task-${Date.now()}.md`)
    try {
      await Bun.write(tempPath, args.content)

      const flags = [
        ...dirFlag(args.dir, context.directory),
        ...storeFlag(args.store),
        ...contextFlag(args.context),
        ...frontmatterFlags(taskFrontmatter(args)),
      ]

      return await runCue(
        ["add", ...flags, "--type", "task", "--file", tempPath, args.filename],
        context.directory,
      )
    } finally {
      const file = Bun.file(tempPath)
      if (await file.exists()) {
        await Bun.$`rm ${tempPath}`.quiet()
      }
    }
  },
})

export const CueTaskPlugin: Plugin = async () => {
  return {
    tool: {
      "cue-task": cueTaskTool,
    },
  }
}
