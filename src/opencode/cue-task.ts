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

/**
 * Build the task frontmatter object from tool args.
 *
 * Omitted fields fall back to defaults; `status` defaults to "inbox" so
 * agent-created tasks enter the board as triage items rather than
 * immediately actionable "open" cards. Kept pure for unit testing.
 */
export function taskFrontmatter(args: {
  title: string
  status?: string
  priority?: string
  kind?: string
  parent?: string
  refs: string[]
}): Record<string, string | string[]> {
  const fm: Record<string, string | string[]> = {
    title: args.title,
    status: args.status ?? "inbox",
    priority: args.priority ?? "normal",
    refs: args.refs,
  }
  if (args.kind) {
    fm.kind = args.kind
  }
  if (args.parent) {
    fm.parent = args.parent
  }
  return fm
}

const cueTaskTool = tool({
  description: "Create a new task artifact (kanban board card). Always saved to the master branch.",
  args: {
    filename: tool.schema.string().describe("Slug-based name (e.g., 'auth-login.md'). No numeric ID."),
    content: tool.schema.string().describe("Full body of the task describing the problem, initiative, or summary."),
    title: tool.schema.string().describe("Short display title for the board."),
    status: tool.schema.enum(["inbox", "open", "in-progress", "complete", "closed"]).optional().default("inbox").describe(
      "Status of the task. Defaults to \"inbox\" (operator triage); promote to \"open\" or \"in-progress\" when work is accepted."
    ),
    priority: tool.schema.enum(["critical", "high", "normal", "low"]).optional().default("normal").describe(
      "Priority of the task"
    ),
    kind: tool.schema.enum(["research", "design", "build", "review", "coord", "learn"]).optional().describe(
      "Task category classification (e.g. research, design, build, review, coord, learn)"
    ),
    parent: tool.schema.string().optional().describe(
      "Parent task slug or path (e.g. 'parent-task-slug'). Emitted as `parent:` frontmatter."
    ),
    refs: tool.schema.array(tool.schema.string()).default([]).describe(
      "Artifact paths (relative to .cue/) this task links to (e.g. the spec it implements). " +
      "Emitted as a `refs:` YAML list."
    ),
    dir: tool.schema.string().optional().describe(
      "Run cue as if started in this directory instead of the session directory. " +
      "Mirrors the git -C convention; use to operate on another project's .cue/ directory."
    ),
  },
  async execute(args, context) {
    const tempPath = join(tmpdir(), `cue-task-${Date.now()}.md`)
    try {
      await Bun.write(tempPath, args.content)

      const dirFlag = resolveDir(args.dir, context.directory)
      const frontmatter = taskFrontmatter(args)
      const fmFlags = frontmatterFlags(frontmatter)

      const output = await Bun.$`cue add ${dirFlag} --type task --task master --root ${fmFlags} --file ${tempPath} ${args.filename}`
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

export const CueTaskPlugin: Plugin = async () => {
  return {
    tool: {
      "cue-task": cueTaskTool,
    },
  }
}
