# Cue Plugins

Plugins and skills that integrate the `cue` memory system with multiple
agent harnesses. One repository, two harnesses, one shared skill set:

- **pi**: a single extension (`src/pi/index.ts`) registering all cue
  tools, the cue commands, an acuity idle listener, and the cast MCP
  adapter. Installed via the `pi` manifest in `package.json`.
- **opencode**: individual plugin files (`src/opencode/*.ts`) plus
  markdown command templates (`commands/opencode/cue/`).

Both harnesses expose the same tool surface (same names, same arguments)
over the `cue` CLI, so prompts and workflows port between them unchanged.

## Prerequisites

- The `cue` CLI on `PATH` (the tools are thin bridges over it).
- [pi](https://github.com/earendil-works/pi-mono) 0.85+ or
  [opencode](https://github.com/opencode-ai/opencode), or both.
- [bun](https://bun.sh) for development (tests, typecheck).

## pi

### Install

From a local checkout (local paths are loaded in place, not copied):

```bash
git clone https://github.com/palekiwi-labs/cue-plugins.git
pi install /path/to/cue-plugins
```

This adds the package to user settings (`~/.pi/agent/settings.json`) and
loads, on every session:

- the extension `src/pi/index.ts` (all tools, commands, and listeners),
- every skill under `skills/`.

Use `pi install -l /path/to/cue-plugins` to write project settings
(`.pi/settings.json`) instead, and `pi remove /path/to/cue-plugins` to
uninstall. A git source also works:
`pi install git:github.com/palekiwi-labs/cue-plugins`.

### Try without installing

```bash
pi -e /path/to/cue-plugins
```

Or, from inside the repository, load just the extension entry:

```bash
pi -e ./src/pi/index.ts
```

### What registers

Tools (parity with opencode): `cue-add`, `cue-context`,
`cue-context-usage`, `cue-log`, `cue-plan`, `cue-review`, `cue-task`,
`save-branch-diff`.

Commands: `/cue:init` (plus `/cue:init:build`, `/cue:init:design`,
`/cue:init:learn`, `/cue:init:research`, `/cue:init:review`),
`/cue:resume`, `/cue:context <slug>`, `/cue:idea`, plus the pi-only
`/review:run` automated multi-agent branch-diff review workflow (delegates
reviewers and verifier to `cue-agent` agents via the `delegate` tool).

Listeners:

- **acuity idle**: on `agent_settled`, posts a `session_idle` event to
  the acuity server (`$ACUITY_HOST`, default `http://localhost:33222`).
- **cast MCP adapter**: inside a cast sandbox (detected by the
  `cast-mcp-client` binary on `PATH`), discovers the built-in cast MCP
  server and exposes its tools as pi tools named `mcp-cast_*` — the same
  names opencode derives for an MCP server keyed `cast`. Outside a
  sandbox the adapter stays inactive. Check or refresh it with
  `/mcp-cast status` and `/mcp-cast reconnect`.

## opencode

Clone the repository into your opencode configuration area:

```bash
mkdir -p ~/.config/opencode/plugin/palekiwi-labs
git clone https://github.com/palekiwi-labs/cue-plugins.git ~/.config/opencode/plugin/palekiwi-labs/cue-plugins
```

### Configuration

Add the plugin files to `opencode.json` (replace `<your-username>` with
your system username):

```json
{
  "plugin": [
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/acuity-plugin.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-add.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-context.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-context-usage.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-log.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-plan.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-review.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-task.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/save-branch-diff.ts"
  ],
  "skills": {
    "paths": ["/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/skills/"]
  }
}
```

Commands are markdown templates under `commands/opencode/cue/`; wire the
ones you want into `opencode.json`, e.g.:

```json
{
  "command": {
    "cue:resume": {
      "template": "{file:/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/commands/opencode/cue/resume.md}",
      "description": "Initialize session context and resume the active context"
    }
  }
}
```

The available templates are `init.md` (plus `init/build.md`,
`init/design.md`, `init/learn.md`, `init/research.md`,
`init/review.md`), `resume.md`, `context.md`, and `idea.md`.

## Tools

- **cue-add**: create any cue artifact (spec, plan, note, task, trace,
  bin, tmp) inside a context. Review artifacts are written with
  **cue-review** instead.
- **cue-context**: create cue contexts (`cue context create`).
- **cue-context-usage**: report the session's context token saturation
  against caution/soft/hard limits with proceed/hand-off guidance.
  Agents call it at milestones (post-commit, pre-task,
  post-investigation) per the `cue` skill checkpoint protocol; the
  `cue-handoff` skill covers the closing sequence when limits are
  reached. In opencode, thresholds are configurable via plugin options:
  ```json
  ["./src/opencode/cue-context-usage.ts", { "soft": 90000, "hard": 130000 }]
  ```
- **cue-log**: record milestones, decisions, and discoveries in the
  context log.
- **cue-plan**: create plan artifacts with status/refs frontmatter.
- **cue-review**: write JSON review artifacts (findings, manifests).
- **cue-task**: create task artifacts (goal + completion condition)
  inside a context.
- **save-branch-diff**: save `git diff <base>...HEAD` as a tmp artifact
  in the context, for review workflows.
- **acuity** (opencode plugin / pi listener): forwards agent lifecycle
  events to an [acuity](https://github.com/palekiwi-labs/cue/blob/master/docs/acuity.md)
  observability server. Acuity is the ingestion component of the cue
  ecosystem — an HTTP server that persists events to SQLite and
  optionally forwards notifications to Gotify. Both harnesses connect to
  `http://localhost:33222` by default; override with the `ACUITY_HOST`
  environment variable. The opencode plugin forwards session idle,
  agent turns, and tool calls; the pi listener forwards session idle.

## Skills

The `skills/` directory is shared by both harnesses and provides the
`cue` skill plus one skill per session mode and workflow:

`cue`, `cue-build`, `cue-design`, `cue-research`, `cue-review`,
`cue-learn`, `cue-handoff`, `cue-idea`, `cue-log-compact`.

## Development

```bash
bun install
bun run typecheck
bun test ./src
```

The pi implementation lives under `src/pi/` and the opencode
implementation under `src/opencode/`; helper modules mirror each other
one-to-one so the two harness implementations diff cleanly. Prompt text
for commands is duplicated between the opencode markdown templates and
exported TS constants in `src/pi/commands/`;
`src/pi/commands/prompt-sync.test.ts` fails when the two drift.
