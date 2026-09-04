---
description: Recall a cue task from a fuzzy memory of a past discussion
---

<user-recollection>
$ARGUMENTS
</user-recollection>

PWD: !`pwd`

!`$HOME/.config/opencode/scripts/git-context.sh`

Task board (slug, status, kind, title):

!`cue list --task master --type task --frontmatter 2>/dev/null | jq -r '.[] | [(.name | sub("\\.md$"; "")), (.frontmatter.status // "-"), (.frontmatter.kind // "-"), (.frontmatter.title // "-")] | @tsv'`

Load the `cue` skill.

**Mandatory Instructions:**

1. The user remembers discussing a topic in some task context but cannot recall which task. Infer the subject from `<user-recollection>` and identify the task.
2. Start from the injected task board above: match the recollection against slugs, titles, kinds, and statuses. If the board is empty, run `cue list --task master --type task --frontmatter` yourself. Read the most promising task cards (`.cue/master/task/<slug>.md`) to confirm the match.
3. If the board alone is inconclusive, widen the search:
   - Run `cue list --all` to enumerate artifacts across all task scopes, then read plausible specs, plans, notes, and logs.
   - Content-search `.cue/` for distinctive keywords from the recollection (authorized for this command despite general skill guidance).
   - If the recollection clearly belongs to another project, query sibling workspaces with `cue -C <path> list --task master --type task`.
4. Rank candidates by confidence and report the best match: task slug, title, kind, status, card path, and a short summary of what the task was about and why it matches the recollection. List runner-up candidates with one-line rationales.
5. If nothing matches confidently, say so explicitly and present the nearest candidates instead of guessing.
6. **DO NOT** switch task context, mutate `.cue/HEAD`, create or modify artifacts, or start working on anything.
7. Suggest `/t <slug>` to open the identified task, then await instructions.
