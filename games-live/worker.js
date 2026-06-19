/*
 * Neft Math Brain — Live Rooms Durable Object + Worker.
 *
 * SEPARATE Cloudflare Worker deploy surface (deployed standalone as `neft-live-rooms`,
 * NOT part of the static Pages site). Transport + persistence only — game rules live in
 * room-state.js (pure, tested). Questions + answer keys live server-side in
 * question-bank.js and are never sent to clients (only the chosen answer is revealed,
 * transiently, after a question closes).
 */
import * as Room from "./room-state.js";
import { questionsFor } from "./question-bank.js";

export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.room = null; // hydrated lazily from storage
  }

  async load() {
    if (!this.room) this.room = (await this.state.storage.get("room")) || null;
    return this.room;
  }
  async save() {
    await this.state.storage.put("room", this.room);
  }

  broadcast() {
    if (!this.room) return; // nothing to broadcast until a room exists
    const msg = JSON.stringify({
      type: "state",
      state: Room.publicState(this.room),
    });
    // Use the hibernation API, not an in-memory Set: sockets survive DO eviction.
    for (const ws of this.state.getWebSockets()) {
      try {
        ws.send(msg);
      } catch (_) {
        /* dropped socket */
      }
    }
  }

  async fetch(request) {
    const url = new URL(request.url);

    // host creates / controls a room over HTTP; players use WebSocket
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.state.acceptWebSocket(server);
      await this.load();
      if (this.room)
        server.send(
          JSON.stringify({ type: "state", state: Room.publicState(this.room) }),
        );
      return new Response(null, { status: 101, webSocket: client });
    }

    await this.load();
    const body =
      request.method === "POST" ? await request.json().catch(() => ({})) : {};
    const now = Date.now();
    let res = { ok: true };
    const op = url.pathname.split("/").pop();

    // Every op except "create" requires an existing room — guard against null
    // (e.g. /state on a fresh code) so we return a clean error, not a 500.
    if (op !== "create" && !this.room) {
      return Response.json({ ok: false, error: "no-room" }, { status: 404 });
    }

    switch (op) {
      case "create":
        // Client sends { code, standard, title } only. Questions (with answer keys)
        // come from the server-side bank so no answer key is exposed to clients.
        this.room = Room.makeRoom({
          code: body.code,
          standard: body.standard,
          title: body.title,
          questions: questionsFor(body.standard),
        });
        break;
      case "join":
        res = Room.addPlayer(this.room, body.id, body.name);
        break;
      case "start":
        res = Room.start(this.room, now);
        break;
      case "answer":
        res = Room.submitAnswer(this.room, body.id, body.choice, now);
        break;
      case "reveal":
        res = Room.reveal(this.room);
        break;
      case "next":
        res = Room.next(this.room, now);
        if (this.room.phase === "ended")
          res.results = Room.toResults(this.room, new Date(now).toISOString());
        break;
      case "state":
        res = { ok: true, state: Room.publicState(this.room) };
        break;
      default:
        return new Response("not found", { status: 404 });
    }

    if (this.room) await this.save();
    this.broadcast();
    return Response.json(res);
  }

  async webSocketMessage(ws, msg) {
    // players submit answers over the socket too; host actions go via HTTP
    let data;
    try {
      data = JSON.parse(msg);
    } catch (_) {
      return;
    }
    await this.load();
    if (data.type === "answer" && this.room) {
      Room.submitAnswer(this.room, data.id, data.choice, Date.now());
      await this.save();
      this.broadcast();
    }
  }
  async webSocketClose(ws) {
    // Hibernation API tracks sockets; just close cleanly.
    try {
      ws.close(1000, "closed");
    } catch (_) {}
  }
  async webSocketError(ws) {
    try {
      ws.close(1011, "error");
    } catch (_) {}
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const code = (url.searchParams.get("code") || "LOBBY").toUpperCase();
    const id = env.GAME_ROOM.idFromName(code);
    return env.GAME_ROOM.get(id).fetch(request);
  },
};
