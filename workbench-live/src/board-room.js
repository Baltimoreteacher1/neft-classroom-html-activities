/* Math Workbench — Live Board sync Worker.
 *
 * A teacher broadcasts their workbench board to a class code; every student on
 * that code follows along live on their own screen. One Durable Object instance
 * per code (idFromName(code)) coordinates the room.
 *
 * Direction of data is one-way by design: only the TEACHER's board is ever
 * transmitted. Students are pure view-only followers — nothing about a student
 * (name, work, identity) is sent to the room. This keeps the feature
 * classroom-safe and free of student PII.
 *
 * State is ephemeral: the latest board snapshot lives in the Durable Object so a
 * student who joins mid-lesson sees the current board instantly. There is no KV,
 * database, or long-term persistence — when the lesson ends the room empties.
 *
 * WebSocket protocol (JSON text frames):
 *   client → server (teacher only):  { type: "board", snap: "<serialized board>" }
 *   server → student:                { type: "board", snap: "..." }              (live + on connect)
 *   server → student:                { type: "end" }                            (teacher left)
 *   server → teacher:                { type: "count", students: <n> }            (presence)
 */

import { DurableObject } from "cloudflare:workers";

const MAX_SNAP = 3_000_000; // generous cap for a serialized multi-page board

function normCode(code) {
  return String(code || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 24);
}
function normRole(role) {
  return role === "teacher" ? "teacher" : "student";
}
function corsHeaders(request) {
  // The frontend connects cross-origin (eduwonderlab.com → *.workers.dev), so
  // echo the Origin back for the WebSocket handshake and any plain fetch.
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Upgrade",
  };
}

export class BoardRoom extends DurableObject {
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected a WebSocket upgrade", { status: 426 });
    }
    const url = new URL(request.url);
    const role = normRole(url.searchParams.get("role"));

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    // Hibernatable accept, tagged by role so we can fan out to just the students
    // (or just the teachers) natively via getWebSockets(role).
    this.ctx.acceptWebSocket(server, [role]);

    if (role === "student") {
      // Hand the newcomer the current board immediately so they're live at once.
      let latest = this.latest;
      if (latest === undefined) {
        try {
          latest = await this.ctx.storage.get("latest");
        } catch {
          latest = null;
        }
        this.latest = latest || null;
      }
      if (this.latest) {
        try {
          server.send(JSON.stringify({ type: "board", snap: this.latest }));
        } catch {
          /* dead socket — reaped on close */
        }
      }
    }
    // Let the teacher(s) know how many students are watching now.
    this.broadcastCount();

    return new Response(null, { status: 101, webSocket: client });
  }

  broadcastCount() {
    let students = 0;
    try {
      students = this.ctx.getWebSockets("student").length;
    } catch {
      students = 0;
    }
    const msg = JSON.stringify({ type: "count", students });
    for (const t of this.ctx.getWebSockets("teacher")) {
      try {
        t.send(msg);
      } catch {
        /* dead socket — reaped on close */
      }
    }
  }

  async webSocketMessage(ws, raw) {
    const tags = this.ctx.getTags(ws);
    const role = (tags && tags[0]) || "student";
    if (role !== "teacher") return; // students are view-only; ignore their frames

    let msg;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
    } catch {
      return;
    }
    if (!msg || msg.type !== "board" || typeof msg.snap !== "string") return;
    if (msg.snap.length > MAX_SNAP) return;

    this.latest = msg.snap;
    // Persist so a hibernated room can still hydrate a late-joining student.
    try {
      await this.ctx.storage.put("latest", msg.snap);
    } catch {
      /* storage hiccup — in-memory copy still fans out below */
    }

    const out = JSON.stringify({ type: "board", snap: msg.snap });
    for (const s of this.ctx.getWebSockets("student")) {
      try {
        s.send(out);
      } catch {
        /* dead socket — reaped on close */
      }
    }
  }

  async webSocketClose(ws, code, reason) {
    const tags = this.ctx.getTags(ws);
    const wasTeacher = tags && tags[0] === "teacher";
    try {
      ws.close(code, reason);
    } catch {
      /* already closing */
    }
    // If the last teacher left, tell students the broadcast ended so they can
    // drop out of follow-mode instead of freezing on a stale board.
    if (wasTeacher) {
      let teachersLeft = 0;
      try {
        // Exclude the socket that is closing now — during webSocketClose it may
        // still be present in getWebSockets, which would mask "last teacher left".
        teachersLeft = this.ctx.getWebSockets("teacher").filter((s) => s !== ws).length;
      } catch {
        teachersLeft = 0;
      }
      if (teachersLeft === 0) {
        const end = JSON.stringify({ type: "end" });
        for (const s of this.ctx.getWebSockets("student")) {
          try {
            s.send(end);
          } catch {
            /* ignore */
          }
        }
      }
    } else {
      this.broadcastCount();
    }
  }

  async webSocketError(ws) {
    try {
      ws.close(1011, "error");
    } catch {
      /* ignore */
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }
    if (url.pathname === "/live") {
      const code = normCode(url.searchParams.get("code"));
      if (!code)
        return new Response("invalid code", { status: 400, headers: corsHeaders(request) });
      const id = env.BOARD_ROOM.idFromName(code);
      return env.BOARD_ROOM.get(id).fetch(request);
    }
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, service: "workbench-live" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(request) },
      });
    }
    return new Response("not found", { status: 404, headers: corsHeaders(request) });
  },
};
