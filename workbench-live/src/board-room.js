/* Math Workbench — Live Board sync Worker.
 *
 * One Durable Object instance per class code (idFromName(code)) coordinates a
 * room that supports two independent, one-directional flows:
 *
 *   BROADCAST (v1)  teacher → students
 *     A teacher broadcasts their board; every student on the code follows along
 *     live and view-only. Roles: "teacher" (sender), "student" (follower).
 *
 *   MONITOR (v2)    students → teacher
 *     Students share their own board; the teacher sees a live grid of the class
 *     (name + activity + ink thumbnail) and can open any one student's board to
 *     watch it live and full-fidelity. Roles: "sharer" (student), "monitor"
 *     (teacher). Only a student who opts in ever transmits their work.
 *
 * Privileged teacher/monitor sockets must also present a 256-bit host
 * capability generated on the teacher device. Knowing the short class code is
 * therefore not enough to watch, annotate, push, or broadcast.
 *
 * State is ephemeral (kept in the Durable Object; no KV/database). Per-sharer
 * snapshot + thumbnail live in DO storage so a late-joining monitor and a
 * freshly-watched board hydrate instantly, and are deleted when the sharer
 * leaves.
 *
 * WebSocket protocol (JSON text frames):
 *   BROADCAST
 *     teacher → server → students   { type:"board", snap }
 *     server  → teacher             { type:"count", students }
 *     server  → students            { type:"end" }
 *   MONITOR
 *     sharer  → server              { type:"share", name, s, o, snap?, thumb? }
 *     server  → monitors            { type:"roster", students:[{sid,name,s,o,thumb}] }
 *     server  → monitors            { type:"meta",  sid, name, s, o }
 *     server  → monitors            { type:"thumb", sid, thumb }
 *     server  → monitors            { type:"gone",  sid }
 *     monitor → server              { type:"watch", sid } | { type:"unwatch" }
 *     server  → watching monitor    { type:"board", sid, snap }
 *
 *   CLASS PLAY (v3)  teacher-hosted quiz round over the same room
 *     teacher → server → students   { type:"play-start", q:{qid,prompt,choices,index,of} }
 *     teacher → server → students   { type:"play-stop" }        (students get q:null)
 *     server  → students            { type:"play-state", q }    (also hydrates late joiners)
 *     student → server → teachers   { type:"play-answer", qid, choice, name }
 *     server  → teachers            { type:"play-score", qid, choice, name, at }
 *     The current question lives in DO storage ("play") so reconnecting
 *     students land mid-round. No answers are persisted — the tally is a live
 *     teacher-screen affordance, not a gradebook.
 *
 *   TWO-WAY INK (v4)  teacher → class
 *     A monitoring teacher annotates a watched student's board, and a teacher
 *     (monitor or broadcaster) pushes a page to the whole class. Both are
 *     ephemeral one-shot deliveries — nothing is stored.
 *     monitor → server               { type:"annotate", sid, strokes:[{tool,color,size,pts:[{x,y}]}] }
 *     server  → that sharer only     { type:"annotate", strokes }
 *     monitor → server               { type:"annotate-clear", sid }
 *     server  → that sharer only     { type:"annotate-clear" }
 *     monitor|teacher → server       { type:"push", snap }
 *     server  → sharers + students   { type:"push", snap }
 */

import { DurableObject } from "cloudflare:workers";

const MAX_SNAP = 3_000_000; // serialized multi-page board
const MAX_THUMB = 400_000; // small downscaled JPEG data URL
const MAX_PLAY = 8_000; // serialized Class Play question (text only)
const MAX_ANNOTATE = 150_000; // serialized teacher annotation strokes
const ROLES = new Set(["teacher", "student", "monitor", "sharer"]);
const HOST_ROLES = new Set(["teacher", "monitor"]);
const HOST_TOKEN_RE = /^[a-f0-9]{64}$/;
const ALLOWED_HOSTS = new Set([
  "eduwonderlab.com",
  "www.eduwonderlab.com",
  "neft-classroom-html-activities.pages.dev",
]);

function normCode(code) {
  return String(code || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 24);
}
function normRole(role) {
  return ROLES.has(role) ? role : "student";
}
function cleanName(v) {
  return String(v || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 32);
}
function allowedOrigin(value) {
  if (!value) return false;
  try {
    const origin = new URL(value);
    if (origin.protocol !== "https:" && origin.protocol !== "http:") return false;
    if (
      ALLOWED_HOSTS.has(origin.hostname) ||
      origin.hostname.endsWith(".neft-classroom-html-activities.pages.dev")
    ) {
      return origin.protocol === "https:";
    }
    return (
      origin.protocol === "http:" &&
      (origin.hostname === "127.0.0.1" || origin.hostname === "localhost")
    );
  } catch {
    return false;
  }
}
async function digestToken(token) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const headers = {
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Upgrade",
    Vary: "Origin",
  };
  if (allowedOrigin(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

export class BoardRoom extends DurableObject {
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected a WebSocket upgrade", { status: 426 });
    }
    const url = new URL(request.url);
    const role = normRole(url.searchParams.get("role"));

    if (HOST_ROLES.has(role)) {
      const token = String(url.searchParams.get("host") || "").toLowerCase();
      if (!HOST_TOKEN_RE.test(token)) {
        return new Response("host capability required", { status: 403 });
      }
      const digest = await digestToken(token);
      const authorized = await this.ctx.storage.transaction(async (txn) => {
        const current = await txn.get("host-token");
        if (current && current !== digest) return false;
        if (!current) await txn.put("host-token", digest);
        return true;
      });
      if (!authorized) return new Response("host capability rejected", { status: 403 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [role]);

    if (role === "student") {
      // Broadcast follower: hand over the teacher's current board immediately.
      let latest = this.latest;
      if (latest === undefined) {
        try {
          latest = await this.ctx.storage.get("latest");
        } catch {
          latest = null;
        }
        this.latest = latest || null;
      }
      if (this.latest) this.safeSend(server, { type: "board", snap: this.latest });
      // Class Play hydration: a reconnecting/late student lands mid-round.
      try {
        const play = await this.ctx.storage.get("play");
        if (play) this.safeSend(server, { type: "play-state", q: JSON.parse(play) });
      } catch {
        /* no active round */
      }
      this.broadcastCount();
    } else if (role === "teacher") {
      this.broadcastCount();
    } else if (role === "sharer") {
      const sid = crypto.randomUUID().slice(0, 12);
      const name = cleanName(url.searchParams.get("name")) || "Student";
      server.serializeAttachment({ sid, name, s: 0, o: 0 });
      // Tell every monitor a new student appeared.
      this.toMonitors({ type: "meta", sid, name, s: 0, o: 0 });
    } else if (role === "monitor") {
      server.serializeAttachment({ watching: null });
      const roster = await this.buildRoster();
      this.safeSend(server, { type: "roster", students: roster });
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  safeSend(ws, obj) {
    try {
      ws.send(JSON.stringify(obj));
    } catch {
      /* dead socket — reaped on close */
    }
  }
  monitors() {
    try {
      return this.ctx.getWebSockets("monitor");
    } catch {
      return [];
    }
  }
  toMonitors(obj) {
    const s = JSON.stringify(obj);
    for (const m of this.monitors()) {
      try {
        m.send(s);
      } catch {
        /* dead socket */
      }
    }
  }
  async buildRoster() {
    const list = [];
    let sharers = [];
    try {
      sharers = this.ctx.getWebSockets("sharer");
    } catch {
      sharers = [];
    }
    for (const w of sharers) {
      const a = w.deserializeAttachment() || {};
      if (!a.sid) continue;
      let thumb = null;
      try {
        thumb = await this.ctx.storage.get("thumb:" + a.sid);
      } catch {
        thumb = null;
      }
      list.push({
        sid: a.sid,
        name: a.name || "Student",
        s: a.s || 0,
        o: a.o || 0,
        thumb: thumb || null,
      });
    }
    return list;
  }

  broadcastCount() {
    let students = 0;
    try {
      students = this.ctx.getWebSockets("student").length;
    } catch {
      students = 0;
    }
    const msg = JSON.stringify({ type: "count", students });
    for (const t of this.teachers()) {
      try {
        t.send(msg);
      } catch {
        /* dead socket */
      }
    }
  }
  teachers() {
    try {
      return this.ctx.getWebSockets("teacher");
    } catch {
      return [];
    }
  }

  async webSocketMessage(ws, raw) {
    const tags = this.ctx.getTags(ws);
    const role = (tags && tags[0]) || "student";
    let msg;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
    } catch {
      return;
    }
    if (!msg || typeof msg !== "object") return;

    // ---- CLASS PLAY: teacher hosts a question round over the same room ----
    if (role === "teacher" && (msg.type === "play-start" || msg.type === "play-stop")) {
      let q = null;
      if (msg.type === "play-start") {
        q = this.cleanPlayQuestion(msg.q);
        if (!q) return;
      }
      try {
        if (q) await this.ctx.storage.put("play", JSON.stringify(q));
        else await this.ctx.storage.delete("play");
      } catch {
        /* still fans out below */
      }
      const out = JSON.stringify({ type: "play-state", q });
      for (const s of this.ctx.getWebSockets("student")) {
        try {
          s.send(out);
        } catch {
          /* dead socket */
        }
      }
      return;
    }

    // ---- TWO-WAY INK: teacher pushes a page to the whole class (one-shot) ----
    if ((role === "teacher" || role === "monitor") && msg.type === "push") {
      if (typeof msg.snap !== "string" || !msg.snap || msg.snap.length > MAX_SNAP) return;
      const out = JSON.stringify({ type: "push", snap: msg.snap });
      for (const tag of ["sharer", "student"]) {
        let socks = [];
        try {
          socks = this.ctx.getWebSockets(tag);
        } catch {
          socks = [];
        }
        for (const s of socks) {
          try {
            s.send(out);
          } catch {
            /* dead socket */
          }
        }
      }
      return;
    }

    // ---- BROADCAST: teacher pushes their board to followers ----
    if (role === "teacher") {
      if (msg.type !== "board" || typeof msg.snap !== "string" || msg.snap.length > MAX_SNAP)
        return;
      this.latest = msg.snap;
      try {
        await this.ctx.storage.put("latest", msg.snap);
      } catch {
        /* still fans out below */
      }
      const out = JSON.stringify({ type: "board", snap: msg.snap });
      for (const s of this.ctx.getWebSockets("student")) {
        try {
          s.send(out);
        } catch {
          /* dead socket */
        }
      }
      return;
    }

    // ---- MONITOR: a student shares their own board ----
    if (role === "sharer") {
      if (msg.type !== "share") return;
      const a = ws.deserializeAttachment() || {};
      if (!a.sid) return;
      if (msg.name) a.name = cleanName(msg.name) || a.name;
      a.s = Number(msg.s) || 0;
      a.o = Number(msg.o) || 0;
      ws.serializeAttachment(a);

      if (typeof msg.snap === "string" && msg.snap.length <= MAX_SNAP) {
        try {
          await this.ctx.storage.put("snap:" + a.sid, msg.snap);
        } catch {
          /* watchers just miss this frame */
        }
        // Forward the full board only to monitors currently watching this student.
        const out = JSON.stringify({ type: "board", sid: a.sid, snap: msg.snap });
        for (const m of this.monitors()) {
          const ma = m.deserializeAttachment() || {};
          if (ma.watching === a.sid) {
            try {
              m.send(out);
            } catch {
              /* dead socket */
            }
          }
        }
      }
      if (typeof msg.thumb === "string" && msg.thumb.length <= MAX_THUMB) {
        try {
          await this.ctx.storage.put("thumb:" + a.sid, msg.thumb);
        } catch {
          /* grid card just keeps its previous thumb */
        }
        this.toMonitors({ type: "thumb", sid: a.sid, thumb: msg.thumb });
      }
      // Lightweight activity update for every monitor's roster card.
      this.toMonitors({ type: "meta", sid: a.sid, name: a.name, s: a.s, o: a.o });
      return;
    }

    // ---- MONITOR controls: watch / unwatch a specific student ----
    if (role === "monitor") {
      const a = ws.deserializeAttachment() || {};
      if (msg.type === "watch" && typeof msg.sid === "string") {
        a.watching = msg.sid;
        ws.serializeAttachment(a);
        let snap = null;
        try {
          snap = await this.ctx.storage.get("snap:" + msg.sid);
        } catch {
          snap = null;
        }
        if (snap) this.safeSend(ws, { type: "board", sid: msg.sid, snap });
      } else if (msg.type === "unwatch") {
        a.watching = null;
        ws.serializeAttachment(a);
      } else if (msg.type === "annotate" && typeof msg.sid === "string" && msg.sid.length <= 16) {
        // TWO-WAY INK: forward sanitized teacher strokes to that sharer only.
        const strokes = this.cleanStrokes(msg.strokes);
        if (!strokes) return;
        const target = this.sharerBySid(msg.sid);
        if (target) this.safeSend(target, { type: "annotate", strokes });
      } else if (
        msg.type === "annotate-clear" &&
        typeof msg.sid === "string" &&
        msg.sid.length <= 16
      ) {
        const target = this.sharerBySid(msg.sid);
        if (target) this.safeSend(target, { type: "annotate-clear" });
      }
      return;
    }
    // ---- CLASS PLAY: a student answers the current question ----
    if (role === "student" && msg.type === "play-answer") {
      const qid = String(msg.qid || "").slice(0, 40);
      const choice = Number(msg.choice);
      if (!qid || !Number.isInteger(choice) || choice < 0 || choice > 11) return;
      const out = JSON.stringify({
        type: "play-score",
        qid,
        choice,
        name: cleanName(msg.name) || "Student",
        at: Date.now(),
      });
      for (const t of this.teachers()) {
        try {
          t.send(out);
        } catch {
          /* dead socket */
        }
      }
      return;
    }
    // students (broadcast followers) are otherwise view-only; ignore their frames
  }

  /** Validate + clamp a Class Play question to a safe text-only shape. */
  cleanPlayQuestion(q) {
    if (!q || typeof q !== "object") return null;
    const prompt = String(q.prompt || "").slice(0, 500);
    const choices = Array.isArray(q.choices)
      ? q.choices.slice(0, 8).map((c) => String(c).slice(0, 200))
      : [];
    if (!prompt || choices.length < 2) return null;
    const clean = {
      qid: String(q.qid || "").slice(0, 40) || crypto.randomUUID().slice(0, 12),
      prompt,
      choices,
      index: Number(q.index) || 0,
      of: Number(q.of) || 0,
    };
    return JSON.stringify(clean).length > MAX_PLAY ? null : clean;
  }

  /** Validate + rebuild teacher annotation strokes to a safe shape (never forwards raw fields). */
  cleanStrokes(strokes) {
    if (!Array.isArray(strokes) || strokes.length === 0 || strokes.length > 60) return null;
    const clean = [];
    for (const s of strokes) {
      if (!s || typeof s !== "object" || !Array.isArray(s.pts) || s.pts.length > 3000) continue;
      const pts = [];
      for (const p of s.pts) {
        const x = Number(p && p.x);
        const y = Number(p && p.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        pts.push({ x: Math.round(x), y: Math.round(y) });
      }
      if (pts.length === 0) continue;
      const size = Number(s.size);
      clean.push({
        tool: s.tool === "highlighter" ? "highlighter" : "pen",
        color: String(s.color || "").slice(0, 24),
        size: Math.min(40, Math.max(1, Number.isFinite(size) ? size : 3)),
        pts,
      });
    }
    if (clean.length === 0) return null;
    return JSON.stringify(clean).length > MAX_ANNOTATE ? null : clean;
  }

  /** Find the sharer socket whose attachment sid matches, or null. */
  sharerBySid(sid) {
    let sharers = [];
    try {
      sharers = this.ctx.getWebSockets("sharer");
    } catch {
      return null;
    }
    for (const w of sharers) {
      let a = {};
      try {
        a = w.deserializeAttachment() || {};
      } catch {
        a = {};
      }
      if (a.sid === sid) return w;
    }
    return null;
  }

  async webSocketClose(ws, code, reason) {
    const tags = this.ctx.getTags(ws);
    const role = (tags && tags[0]) || "student";
    const att = (() => {
      try {
        return ws.deserializeAttachment() || {};
      } catch {
        return {};
      }
    })();
    try {
      ws.close(code, reason);
    } catch {
      /* already closing */
    }

    if (role === "teacher") {
      // Last teacher out → tell followers the broadcast ended.
      let left = 0;
      try {
        left = this.ctx.getWebSockets("teacher").filter((s) => s !== ws).length;
      } catch {
        left = 0;
      }
      if (left === 0) {
        const end = JSON.stringify({ type: "end" });
        for (const s of this.ctx.getWebSockets("student")) {
          try {
            s.send(end);
          } catch {
            /* ignore */
          }
        }
        this.latest = null;
        try {
          await this.ctx.storage.delete(["latest", "play"]);
        } catch {
          /* best-effort expiry at the end of a broadcast */
        }
      }
    } else if (role === "student") {
      this.broadcastCount();
    } else if (role === "sharer" && att.sid) {
      // Student stopped sharing → drop their card and free their stored board.
      try {
        await this.ctx.storage.delete("snap:" + att.sid);
        await this.ctx.storage.delete("thumb:" + att.sid);
      } catch {
        /* best effort */
      }
      this.toMonitors({ type: "gone", sid: att.sid });
    }

    if (HOST_ROLES.has(role)) {
      let privilegedLeft = 0;
      try {
        privilegedLeft = ["teacher", "monitor"].reduce(
          (count, tag) =>
            count + this.ctx.getWebSockets(tag).filter((socket) => socket !== ws).length,
          0,
        );
      } catch {
        privilegedLeft = 0;
      }
      if (privilegedLeft === 0) {
        try {
          await this.ctx.storage.delete("host-token");
        } catch {
          /* a new host can claim the room after the prior host leaves */
        }
      }
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
      if (!allowedOrigin(request.headers.get("Origin"))) {
        return new Response("origin not allowed", { status: 403, headers: corsHeaders(request) });
      }
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
