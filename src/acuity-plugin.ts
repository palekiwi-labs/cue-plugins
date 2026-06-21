import type { Plugin } from "@opencode-ai/plugin";
import type { Client } from "@opencode-ai/sdk";
import type { SessionIdle } from "./types";

const ACUITY_HOST = "http://172.17.0.1:33222";

const plugin: Plugin = {
  event: async (
    event: { type: string; properties: { sessionID: string } },
    context: { directory: string },
    client: Client,
  ) => {
    if (event.type !== "session.idle") return;

    const session = await client.session
      .get({ path: { id: event.properties.sessionID } })
      .catch(() => null);

    const payload: SessionIdle = {
      session_id: event.properties.sessionID,
      project_dir: context.directory,
      session_title: session?.title ?? null,
    };

    await fetch(`${ACUITY_HOST}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Acuity-Schema": "1",
      },
      body: JSON.stringify(payload),
    }).catch((err: unknown) => {
      console.error("[acuity-plugin] failed to post event:", err);
    });
  },
};

export default plugin;
