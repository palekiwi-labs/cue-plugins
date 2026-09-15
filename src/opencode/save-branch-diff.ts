import { type Plugin, tool } from "@opencode-ai/plugin"
import { isAbsolute, join, resolve } from "node:path"
import { homedir, tmpdir } from "node:os"
import { diffFilename, resolveBase } from "./branch-diff-helpers"
import { runCue } from "./cue-exec"

// NOTE: this module must export ONLY the plugin. opencode's legacy plugin
// loader invokes every exported function with (input, options) as if it
// were a plugin; pure helpers live in ./branch-diff-helpers instead.

/**
 * Resolve the user-supplied directory against the session directory,
 * expanding "~" like the dir flag of the other cue tools. Returns null
 * when no directory was given (use the session directory as-is).
 */
function resolveTargetDir(
  dir: string | undefined,
  sessionDir: string,
): string | null {
  if (!dir?.trim()) {
    return null
  }
  let expanded = dir.trim()
  if (expanded.startsWith("~/") || expanded === "~") {
    expanded = homedir() + expanded.slice(1)
  }
  if (isAbsolute(expanded)) {
    return expanded
  }
  return resolve(sessionDir, expanded)
}

/**
 * Run git in cwd via Bun.spawn: argv is passed natively (no shell), so
 * branch names containing "/" are safe as arguments. Never throws; callers
 * decide whether a non-zero exit is meaningful. Stdout/stderr are captured.
 */
async function runGit(
  argv: string[],
  cwd: string,
): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(["git", ...argv], { cwd })
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  return { code: await proc.exited, stdout, stderr }
}

/** git stdout trimmed to empty on any non-zero exit (absence = ""). */
async function gitText(argv: string[], cwd: string): Promise<string> {
  const { code, stdout } = await runGit(argv, cwd)
  return code === 0 ? stdout.trim() : ""
}

const saveBranchDiffTool = tool({
  description:
    "Generate a diff of the current feature branch against its base branch " +
    "and save it to cue as a tmp artifact named after the branch. Defaults " +
    "to the session directory; pass dir to target another worktree of the " +
    "repository.",
  args: {
    context: tool.schema.string().describe(
      "Context slug to save the diff under, within the repository's scope. " +
      "Required: cue has no default or fallback context and a write with " +
      "none fails.",
    ),
    dir: tool.schema.string().optional().describe(
      "Directory whose branch should be diffed. Defaults to the session " +
      "directory. Relative paths resolve against the session directory; " +
      "~ expands to the home directory.",
    ),
  },
  async execute(args, context) {
    // 1. Pick the git tree to operate on
    const targetDir = resolveTargetDir(args.dir, context.directory) ??
      context.directory

    // 2. Current branch (empty string on detached HEAD)
    const branch = await gitText(["branch", "--show-current"], targetDir)

    // 3. Resolve the base branch offline
    const configBase = branch
      ? await gitText(["config", `branch.${branch}.base`], targetDir)
      : ""
    const remoteHeadRef = await gitText(
      ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"],
      targetDir,
    )
    const base = resolveBase(configBase, remoteHeadRef)

    // 4. Generate the diff (a bad base is a real error; surface git's stderr)
    const diff = await runGit(["diff", `${base}...HEAD`], targetDir)
    if (diff.code !== 0) {
      throw new Error(
        `git diff ${base}...HEAD failed: ${diff.stderr.trim()}`,
      )
    }
    const diffContent = diff.stdout

    if (!diffContent.trim()) {
      return {
        title: "No changes",
        output: `No diff between ${base} and HEAD`,
        metadata: { status: "no_changes", branch, base },
      }
    }

    // 5. Save to cue via a temp file (content never hits a shell); context
    //    is passed explicitly rather than resolved from the operator's
    //    branch association.
    //
    //    The diff stays a `tmp` artifact rather than becoming a `trace`,
    //    even though it is an artifact about a revision: cue prepends YAML
    //    frontmatter to every named artifact, which would corrupt the patch.
    //    tmp writes into a fresh tmp/<created_at>-<commit_hash>/ directory,
    //    so captures separate across commits by the hash component and
    //    reruns at one commit accumulate rather than overwrite.
    const filename = diffFilename(branch)
    const tempPath = join(tmpdir(), `branch-diff-${Date.now()}.diff`)
    try {
      await Bun.write(tempPath, diffContent)

      const output = await runCue(
        ["add", "--type", "tmp", "--context", args.context, "--file", tempPath, filename],
        targetDir,
      )

      return {
        title: `Saved ${filename}`,
        output,
        metadata: { status: "success", branch, base },
      }
    } finally {
      const file = Bun.file(tempPath)
      if (await file.exists()) {
        await Bun.$`rm ${tempPath}`.quiet()
      }
    }
  },
})

export const SaveBranchDiffPlugin: Plugin = async () => {
  return {
    tool: {
      "save-branch-diff": saveBranchDiffTool,
    },
  }
}
