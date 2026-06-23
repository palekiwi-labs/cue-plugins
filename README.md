# Cue Plugins for Opencode

This repository contains a set of plugins and skills for [Opencode](https://github.com/opencode-ai/opencode) that integrate with the `cue` memory system.

## Installation

To use these tools, clone the repository into your Opencode configuration directory:

```bash
mkdir -p ~/.config/opencode/plugin/palekiwi-labs
git clone https://github.com/palekiwi-labs/cue-plugins.git ~/.config/opencode/plugin/palekiwi-labs/cue-plugins
```

### Configuration

Add the following to your `opencode.json` configuration file (replace `<your-username>` with your actual system username):

```json
{
  "plugin": [
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/acuity-plugin.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-add.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-log.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-plan.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-task.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-todo.ts"
  ],
  "skills": {
    "paths": ["/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/skills/"]
  }
}
```

## Available Tools

- **cue-add**: Generic tool to create any cue artifact.
- **cue-log**: Record milestones, decisions, and discoveries.
- **cue-plan**: Create technical plans and executive slices.
- **cue-task**: Manage kanban tasks on the master branch.
- **cue-todo**: Capture informal deferred notes.
- **acuity-plugin**: Forwards agent lifecycle events (session idle, agent
  turns, tool calls) to an [acuity](https://github.com/palekiwi-labs/cue/blob/master/docs/acuity.md)
  observability server. Acuity is the ingestion component of the cue
  ecosystem — an HTTP server that persists events to SQLite and optionally
  forwards notifications to Gotify. The plugin connects to
  `http://localhost:33222` by default; override with the `ACUITY_HOST`
  environment variable. See the [acuity documentation](https://github.com/palekiwi-labs/cue/blob/master/docs/acuity.md)
  for server setup and configuration.
