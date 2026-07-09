/**
 * Build the repeatable `--frontmatter KEY=VALUE` flag list from a frontmatter
 * object.
 *
 * - A string value emits a single flag: `["--frontmatter", "k=v"]`.
 * - An array value emits one flag per element:
 *   `["--frontmatter", "k=a", "--frontmatter", "k=b"]`. The `cue` CLI turns a
 *   repeated key into a YAML Sequence, so this is how a list-valued field
 *   (e.g. `refs`) is expressed.
 * - An empty array emits nothing (no flags -> no frontmatter value).
 *
 * This is field-agnostic: any key can be scalar or list.
 */
export function frontmatterFlags(
  fm: Record<string, string | string[]>,
): string[] {
  const flags: string[] = []
  for (const [k, v] of Object.entries(fm)) {
    if (Array.isArray(v)) {
      for (const el of v) {
        flags.push("--frontmatter", `${k}=${el}`)
      }
    } else {
      flags.push("--frontmatter", `${k}=${v}`)
    }
  }
  return flags
}
