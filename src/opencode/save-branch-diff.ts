import { type Plugin, tool } from "@opencode-ai/plugin"
import { isAbsolute, join, resolve } from "node:path"
import { homedir, tmpdir } from "node:os"

/**
 * Flatten a git branch name into a single path segment suitable as a cue
 * artifact filename. Branch names may contain "/" (e.g. "feat/foo") which
 * cue rejects as a multi-segment filename, and a leading "-" would be
 * misparsed as a CLI flag by clap. Runs of unsafe characters collapse into
 * a single dash; leading/trailing separators are stripped.
 */
export function sanitizeBranchName(branch: string): string {
  return branch
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[-._]+/, "")
    .replace(/[-._]+$/, "")
}

/**
 * Artifact filename for a saved diff, derived from the sanitized branch
 * name so different branches keep separate files. An unknown branch
 * (detached HEAD) falls back to "branch".
 */
export function diffFilename(branch: string): string {
  const name = sanitizeBranchName(branch) || "branch"
  return `${name}.diff`
}

/**
 * Offline base-branch hierarchy: the git-pr-sync-written
 * `branch.<name>.base` config key, then origin/HEAD, then "master".
 * Blank values are treated as absent.
 */
export function resolveBase(
  configBase?: string,
  remoteHeadRef?: string,
): string {
  if (configBase?.trim()) {
    return configBase.trim()
  }
  if (remoteHeadRef?.trim().startsWith("origin/")) {
    return remoteHeadRef.trim().slice("origin/".length)
  }
  return "master"
}

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
    task: tool.schema.string().describe(
      "Task scope for this invocation. Use 'master' for global context.",
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

    // 5. Save to cue via a temp file (content never hits a shell);
    //    --task scopes explicitly instead of relying on .cue/HEAD
    const filename = diffFilename(branch)
    const tempPath = join(tmpdir(), `branch-diff-${Date.now()}.diff`)
    try {
      await Bun.write(tempPath, diffContent)

      const output = await Bun.$`cue add --type tmp --root --force --task ${args.task} --file ${tempPath} ${filename}`
        .cwd(targetDir)
        .quiet()
        .text()

      return {
        title: `Saved ${filename}`,
        output: output.trim(),
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
