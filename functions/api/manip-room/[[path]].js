/* =============================================================================
 * Shared manipulative room — a small append-only, room-scoped store so a whole
 * class can build one manipulative together (e.g. a shared dot plot). Each tap
 * adds a colored point to a room; everyone polls the room and sees the class's
 * data build in near-real-time (~2s).
 *
 * Routes (D1-backed):
 *   POST /api/manip-room/put?room=CODE   { x, color, author }  -> add a point
 *   GET  /api/manip-room/get?room=CODE                          -> recent points
 *   POST /api/manip-room/clear?room=CODE                        -> clear a room
 *   GET  /api/manip-room/health
 *
 * SAFETY: append-only and room-scoped like /api/scores/report (already an open
 * student-write endpoint here). No PII — author is at most a 2-char initial/emoji.
 * Payloads are strictly validated and capped; each room is capped at 400 points
 * and rows auto-expire after 6 hours; best-effort per-IP rate limiting.
 * ========================================================================== */

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const ROOM_CAP = 400;
const RATE = { windowMs: 10_000, max: 30, hits: new Map() };

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}
function clampNum(v, lo, hi, dflt) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
}
function roomId(v) {
  const s = String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 24);
  return s.length >= 3 ? s : "";
}
function clampStr(v, n) {
  return typeof v === "string" ? v.slice(0, n) : "";
}
function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "anon"
  );
}
function rateLimited(ip) {
  const now = Date.now();
  const cutoff = now - RATE.windowMs;
  let arr = RATE.hits.get(ip);
  if (!arr) {
    arr = [];
    RATE.hits.set(ip, arr);
  }
  while (arr.length && arr[0] < cutoff) arr.shift();
  if (arr.length >= RATE.max) return true;
  arr.push(now);
  if (RATE.hits.size > 5000) {
    for (const [k, v] of RATE.hits) if (!v.length || v[v.length - 1] < cutoff) RATE.hits.delete(k);
  }
  return false;
}

async function ensureSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS manip_points (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        room       TEXT NOT NULL,
        author     TEXT,
        color      TEXT,
        x          REAL NOT NULL,
        created_at INTEGER NOT NULL
      )`,
    )
    .run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_manip_room ON manip_points (room, id)`).run();
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();
  const url = new URL(request.url);

  if (method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });

  const seg = (params.path && params.path[0]) || "";
  if (seg === "health") return json({ ok: true, backend: "cloudflare", d1: !!env.DB });
  if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503);

  const room = roomId(url.searchParams.get("room"));
  if (!room) return json({ ok: false, error: "invalid-room" }, 400);

  try {
    await ensureSchema(env.DB);
    const now = Date.now();
    const sixHrsAgo = now - 6 * 3600 * 1000;

    if (method === "POST" && seg === "put") {
      if (rateLimited(clientIp(request))) return json({ ok: false, error: "rate-limited" }, 429);
      const body = await request.json().catch(() => null);
      if (!body) return json({ ok: false, error: "bad-payload" }, 400);
      const x = clampNum(body.x, 0, 1000, null);
      if (x == null) return json({ ok: false, error: "bad-x" }, 400);
      const color = clampStr(body.color, 12).replace(/[^#a-zA-Z0-9]/g, "") || "#1fa6a2";
      const author = clampStr(body.author, 2);

      await env.DB.prepare(
        `INSERT INTO manip_points (room, author, color, x, created_at) VALUES (?, ?, ?, ?, ?)`,
      )
        .bind(room, author, color, x, now)
        .run();

      // Keep each room bounded: drop the oldest beyond ROOM_CAP, and expire old rows.
      await env.DB.prepare(
        `DELETE FROM manip_points WHERE room = ? AND id NOT IN
           (SELECT id FROM manip_points WHERE room = ? ORDER BY id DESC LIMIT ?)`,
      )
        .bind(room, room, ROOM_CAP)
        .run();
      await env.DB.prepare(`DELETE FROM manip_points WHERE created_at < ?`).bind(sixHrsAgo).run();

      return json({ ok: true });
    }

    if (method === "GET" && seg === "get") {
      const { results } = await env.DB.prepare(
        `SELECT author, color, x, created_at FROM manip_points
           WHERE room = ? AND created_at >= ? ORDER BY id DESC LIMIT ?`,
      )
        .bind(room, sixHrsAgo, ROOM_CAP)
        .all();
      const points = (results || []).map((r) => ({
        author: r.author,
        color: r.color,
        x: r.x,
        t: r.created_at,
      }));
      return json({ ok: true, room, points });
    }

    if (method === "POST" && seg === "clear") {
      await env.DB.prepare(`DELETE FROM manip_points WHERE room = ?`).bind(room).run();
      return json({ ok: true, cleared: true });
    }

    return json({ ok: false, error: "not-found", route: seg }, 404);
  } catch (err) {
    return json({ ok: false, error: "server-error", detail: String(err && err.message) }, 500);
  }
}
