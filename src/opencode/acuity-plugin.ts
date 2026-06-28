import type { Plugin } from "@opencode-ai/plugin";
import type { Event } from "@opencode-ai/sdk";
import type {
  AcuityEvent,
  AgentTurnCompleted,
  SessionIdle,
  ToolCallCompleted,
  ToolCallRequested,
} from "../generated/acuity/types";
import type { JsonValue } from "../generated/acuity/serde_json/JsonValue";

const ACUITY_HOST = process.env.ACUITY_HOST ?? "http://localhost:33222";

// Dedup state: Map<sessionID, { turns: Set<messageID>, calls: Set<callID> }>
// Cleared per session on session.idle to bound memory growth.
const dedup = new Map<
  string,
  { turns: Set<string>; calls: Set<string> }
>();

function sessionDedup(sessionID: string) {
  if (!dedup.has(sessionID)) {
    dedup.set(sessionID, { turns: new Set(), calls: new Set() });
  }
  return dedup.get(sessionID)!;
}

async function postEvent(
  event: AcuityEvent,
  log: (msg: string, extra?: Record<string, unknown>) => void,
): Promise<void> {
  try {
    const res = await fetch(`${ACUITY_HOST}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Acuity-Schema": "1",
      },
      body: JSON.stringify(event),
    });
    if (!res.ok) {
      log("acuity rejected event", {
        status: res.status,
        status_text: res.statusText,
        type: event.type,
      });
    }
  } catch (err: unknown) {
    log("failed to post event", { error: String(err), type: event.type });
  }
}

function makeLog(client: Parameters<Plugin>[0]["client"]) {
  return (msg: string, extra?: Record<string, unknown>) =>
    client.app.log({
      body: {
        service: "acuity-plugin",
        level: "error",
        message: msg,
        extra,
      },
    });
}

const plugin: Plugin = async ({ client, directory }) => {
  const log = makeLog(client);

  return {
    event: async ({ event }: { event: Event }) => {
      // --- session.idle ---
      if (event.type === "session.idle") {
        const sessionID = event.properties.sessionID;
        const sessionResponse = await client.session
          .get({ path: { id: sessionID } })
          .catch(() => null);
        const session = sessionResponse?.data ?? null;
        const payload: SessionIdle = {
          session_id: sessionID,
          project_dir: directory,
          harness: "opencode",
          session_title: session?.title ?? null,
        };
        await postEvent({ type: "session_idle", ...payload }, log);
        // Clear dedup state for this session — turns are settled.
        dedup.delete(sessionID);
        return;
      }

      // --- message.updated (AgentTurnCompleted) ---
      if (event.type === "message.updated") {
        const info = event.properties.info;
        if (info.role !== "assistant") return;
        if (info.time.completed === undefined) return;
        const d = sessionDedup(info.sessionID);
        if (d.turns.has(info.id)) return;
        d.turns.add(info.id);
        const payload: AgentTurnCompleted = {
          session_id: info.sessionID,
          turn_id: info.id,
          project_dir: directory,
          harness: "opencode",
          input_tokens: info.tokens?.input ?? null,
          output_tokens: info.tokens?.output ?? null,
        };
        await postEvent(
          { type: "agent_turn_completed", ...payload },
          log,
        );
        return;
      }

      // --- message.part.updated (ToolCallRequested / ToolCallCompleted) ---
      if (event.type === "message.part.updated") {
        const part = event.properties.part;
        if (part.type !== "tool") return;
        const sessionID = part.sessionID;
        const messageID = part.messageID; // turn_id
        const callID = part.callID;
        const d = sessionDedup(sessionID);

        if (
          part.state.status === "pending" &&
          !d.calls.has(`req:${callID}`)
        ) {
          d.calls.add(`req:${callID}`);
          const payload: ToolCallRequested = {
            session_id: sessionID,
            turn_id: messageID,
            project_dir: directory,
            harness: "opencode",
            tool_call_id: callID,
            tool_name: part.tool,
            args: part.state.input as JsonValue,
          };
          await postEvent(
            { type: "tool_call_requested", ...payload },
            log,
          );
        } else if (
          (part.state.status === "completed" ||
            part.state.status === "error") &&
          !d.calls.has(`done:${callID}`)
        ) {
          d.calls.add(`done:${callID}`);
          const payload: ToolCallCompleted = {
            session_id: sessionID,
            turn_id: messageID,
            project_dir: directory,
            harness: "opencode",
            tool_call_id: callID,
            tool_name: part.tool,
            is_error: part.state.status === "error",
            error_text:
              part.state.status === "error" ? part.state.error : null,
          };
          await postEvent(
            { type: "tool_call_completed", ...payload },
            log,
          );
        }
        return;
      }
    },
  };
};

export default plugin;
