/*
 * Neft Math Brain — Live Rooms Durable Object + Worker.
 *
 * GATED: this is a SEPARATE Cloudflare Worker deploy surface, NOT part of the
 * static Pages site (push-to-main). It is scaffolded and locally testable but
 * intentionally NOT deployed and NOT wired into any deploy config. Review against
 * the `durable-objects` and `workers-best-practices` skills before `wrangler deploy`.
 *
 * Transport + persistence only — all game rules live in room-state.js (pure, tested).
 */
import * as Room from "./room-state.js";

export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.room = null; // hydrated lazily from storage
    this.sockets = new Set();
  }

  async load() {
    if (!this.room) this.room = (await this.state.storage.get("room")) || null;
    return this.room;
  }
  async save() {
    await this.state.storage.put("room", this.room);
  }

  broadcast() {
    const msg = JSON.stringify({
      type: "state",
      state: Room.publicState(this.room),
    });
    for (const ws of this.sockets) {
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
      this.sockets.add(server);
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

    switch (url.pathname.split("/").pop()) {
      case "create":
        this.room = Room.makeRoom(body); // { code, standard, title, questions }
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
    this.sockets.delete(ws);
  }
  async webSocketError(ws) {
    this.sockets.delete(ws);
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
