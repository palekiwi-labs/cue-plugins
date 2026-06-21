import type { Plugin } from "@opencode-ai/plugin";
import type { Event } from "@opencode-ai/sdk";
import type { SessionIdle } from "./types";

const ACUITY_HOST = process.env.ACUITY_HOST ?? "http://localhost:33222";

const plugin: Plugin = async ({ client, directory }) => {
  return {
    event: async ({ event }: { event: Event }) => {
      if (event.type !== "session.idle") return;

      const sessionResponse = await client.session
        .get({ path: { id: event.properties.sessionID } })
        .catch(() => null);

      const session = sessionResponse?.data ?? null;

      const payload: SessionIdle = {
        session_id: event.properties.sessionID,
        project_dir: directory,
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
};

export default plugin;
