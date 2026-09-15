/**
 * Shared cue CLI execution for the bridge tools.
 *
 * Lives apart from the plugin modules for the same reason as cue-args:
 * opencode's legacy plugin loader invokes every exported function of a
 * plugin module as if it were a plugin, so pure helpers must not be
 * exported from those files.
 */

/**
 * Build the message an agent sees when a cue invocation fails.
 *
 * cue prints its diagnostic to stderr ("Error: ..."). Bun's shell
 * rejects with a ShellError whose message is only "Failed with exit
 * code N": the stderr rides unread on the error object, and nothing
 * downstream reads it either, so agents saw a bare exit 1 and
 * misdiagnosed deterministic failures as flaky. This puts cue's own
 * text into the thrown message, names the subcommand, and names the
 * directory cue ran in — the scope cue resolved is derived from it, so
 * a context lookup in the wrong repository's scope becomes readable
 * instead of mysterious.
 */
export function cueFailureMessage(
  argv: string[],
  cwd: string,
  code: number,
  stderr: string,
  stdout: string,
): string {
  const command = argv.slice(0, 2).join(" ")
  const diagnostic = stderr.trim() || stdout.trim() || `exit code ${code}`
  return `cue ${command} failed in ${cwd}: ${diagnostic}`
}

/**
 * Run `cue <argv>` in cwd and return trimmed stdout.
 *
 * Bun.spawn passes argv natively (no shell), so arguments containing
 * spaces or metacharacters are safe, matching runGit in
 * save-branch-diff. Throws an Error whose message carries cue's own
 * diagnostic on any non-zero exit.
 */
export async function runCue(argv: string[], cwd: string): Promise<string> {
  // stdout/stderr must be piped explicitly: Bun.spawn inherits them by
  // default, which forwards cue's diagnostic to the server console and
  // delivers an empty string to the capture below.
  const proc = Bun.spawn(["cue", ...argv], { cwd, stdout: "pipe", stderr: "pipe" })
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  const code = await proc.exited
  if (code !== 0) {
    throw new Error(cueFailureMessage(argv, cwd, code, stderr, stdout))
  }
  return stdout.trim()
}
