/* Focus School — real-time sync Worker.
 *
 * A Durable Object cannot be defined inside a Cloudflare Pages project, so the
 * real-time hub lives here as its own Worker. It does two jobs per sync code:
 *
 *   1. Durability: last-write-wins persist of each device's state into the SAME
 *      KV namespace (NOAM_SCHOOL_KV) the Pages `/api/state` endpoint already
 *      uses — so the cloud copy is identical whether written over WebSocket or
 *      the plain KV PUT. This is also the snapshot a newly-connected device
 *      receives instantly on connect.
 *   2. Fan-out: broadcast every incoming state to the OTHER live devices on the
 *      same code, so a change on one screen appears on the others in well under
 *      a second — no polling, no KV read-consistency lag.
 *
 * The client treats this as a pure accelerator layered on top of the existing
 * KV sync: if this Worker (or the Pages binding to it) is not provisioned, the
 * `/api/live` endpoint returns 503 and every device silently keeps using KV
 * polling. Nothing regresses; real-time is additive.
 *
 * One Durable Object instance per sync code (idFromName(code)), so all of a
 * user's devices coordinate through a single strongly-consistent actor.
 */

import { DurableObject } from "cloudflare:workers";

const MAX_PAYLOAD = 2_000_000; // mirror the /api/state cap (KV value limit is 25MB)
const YEAR = 60 * 60 * 24 * 365;

// Normalize a raw sync code the same way functions/api/state.js does, so every
// device that resolves to the same room also shares the exact same KV key AND
// the exact same WebSocket tag (used below for native fan-out filtering).
function normCode(code) {
  return String(code || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 64);
}
function keyFor(code) {
  const clean = normCode(code);
  return clean.length >= 1 ? "sync:" + clean : null;
}

export class SyncRoom extends DurableObject {
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected a WebSocket upgrade", { status: 426 });
    }
    const url = new URL(request.url);
    const code = normCode(url.searchParams.get("code") || "");
    const key = keyFor(code);
    if (!key) return new Response("invalid code", { status: 400 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    // Hibernatable accept: the socket survives the DO being evicted while idle,
    // so a phone left open overnight stays connected without keeping the DO (and
    // its billable duration) resident. The normalized code tag lets us fan out
    // broadcasts to exactly this room via getWebSockets(code).
    this.ctx.acceptWebSocket(server, [code]);

    // Hand the newcomer the current cloud snapshot immediately so it is live the
    // instant it connects, without waiting for anyone else to push.
    try {
      const snap = await this.env.NOAM_SCHOOL_KV.get(key);
      if (snap) server.send(snap);
    } catch {
      /* KV hiccup — the client still has local data and will pull via KV */
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    let msg;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
    } catch {
      return; // ignore anything that isn't JSON
    }
    if (!msg || msg.type !== "push" || !msg.state) return;

    const tags = this.ctx.getTags(ws);
    const code = (tags && tags[0]) || "";
    const key = keyFor(code);
    if (!key) return;

    const now = Date.now();
    // Clamp updatedAt so a device can't pin a poisoned copy far in the future.
    const updatedAt = Math.min(Number(msg.updatedAt) || now, now + 60_000);
    const payload = JSON.stringify({ updatedAt, state: msg.state });
    if (payload.length > MAX_PAYLOAD) return;

    // Last-write-wins persist, matching the /api/state PUT semantics exactly.
    let store = true;
    try {
      const existing = await this.env.NOAM_SCHOOL_KV.get(key);
      if (existing) {
        const prev = JSON.parse(existing);
        if ((prev.updatedAt || 0) > updatedAt) store = false;
      }
    } catch {
      /* treat a read error as "no existing" — the write below is still safe */
    }
    if (store) {
      try {
        await this.env.NOAM_SCHOOL_KV.put(key, payload, { expirationTtl: YEAR });
      } catch {
        /* KV write failed — still broadcast so peers converge in memory */
      }
    }

    // Fan out to every OTHER device on the same code. getWebSockets(code) filters
    // by tag natively (no O(N) getTags scan). Each client runs the same
    // conflict-safe merge it uses for a KV pull, so ordering/races converge.
    for (const peer of this.ctx.getWebSockets(code)) {
      if (peer === ws) continue;
      try {
        peer.send(payload);
      } catch {
        /* a dead socket — hibernation/close handling will reap it */
      }
    }
  }

  async webSocketClose(ws, code, reason) {
    try {
      ws.close(code, reason);
    } catch {
      /* already closing */
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
  // Standalone entry so the Worker is deployable and (optionally) reachable
  // directly. The primary path is the Pages Function /api/live forwarding to the
  // SYNC_ROOM binding, but supporting a direct hit keeps local `wrangler dev`
  // and a cross-origin fallback URL working too.
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/live" || url.pathname === "/live") {
      if (!env.SYNC_ROOM) return new Response("realtime sync not configured", { status: 503 });
      const code = (url.searchParams.get("code") || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 64);
      if (!code) return new Response("invalid code", { status: 400 });
      const id = env.SYNC_ROOM.idFromName(code);
      return env.SYNC_ROOM.get(id).fetch(request);
    }
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response("focus-school sync worker: ok", { status: 200 });
    }
    return new Response("not found", { status: 404 });
  },
};
