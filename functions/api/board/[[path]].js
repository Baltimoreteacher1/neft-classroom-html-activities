/* =============================================================================
 * Class Board backend — Cloudflare Pages Function (optional, opt-in)
 * -----------------------------------------------------------------------------
 * Powers the live "Student Board" at /math/student-board/. One editable board
 * per section that the teacher authors and students see (a digital classroom
 * board): weekly guide, learning targets, groupings, ALEKS minute goals,
 * announcements, and shout-outs. Auto-refreshes on the student side.
 *
 * Routes (catch-all under /api/board):
 *   GET  /api/board/get?board=main            -> { ok, board, state, updatedAt }
 *   PUT  /api/board/save?board=main  { state, updatedAt }  -> { ok, updatedAt, kept }
 *   POST /api/board/save?board=main  (alias of PUT)
 *   GET  /api/board/health                    -> { ok, d1 }
 *
 * Storage: Cloudflare D1, bound as `env.DB`. Board content is class-facing by
 * design (like a physical whiteboard), so READS are public. WRITES are gated by
 * env.TEACHER_KEY when it is configured (teacher enters it once in the editor;
 * it is stored only in the teacher's browser, never shipped in the page).
 *
 * GRACEFUL DEGRADATION: if the D1 binding is absent every data route returns
 * HTTP 503 and the board client silently falls back to its local default so the
 * page still renders. Nothing breaks.
 * ========================================================================== */

// Reflect the Origin only when same-origin (or an eduwonderlab / pages.dev
// host), matching functions/api/state.js — blocks other sites from scripting
// writes against the board.
function corsFor(request) {
  const origin = request.headers.get("Origin");
  let allow = "null";
  try {
    if (origin) {
      const originHost = new URL(origin).host;
      const requestHost = new URL(request.url).host;
      if (
        originHost === requestHost ||
        originHost.endsWith(".eduwonderlab.com") ||
        originHost.endsWith(".pages.dev") ||
        originHost === "eduwonderlab.com"
      ) {
        allow = origin;
      }
    }
  } catch {}
  return {
    "access-control-allow-origin": allow,
    "access-control-allow-methods": "GET,PUT,POST,OPTIONS",
    "access-control-allow-headers": "content-type,x-teacher-key",
    vary: "Origin",
  };
}

function json(data, status = 200, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(request ? corsFor(request) : {}),
    },
  });
}

// Board ids name a section's board. Keep them short, safe, and predictable
// (e.g. "main", "601", "period-2"). Anything else is rejected.
function boardId(raw) {
  const clean = String(raw || "main")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 32);
  return clean.length >= 1 ? clean : null;
}

async function ensureSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS class_board (
        board_id   TEXT PRIMARY KEY,
        state_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL DEFAULT 0,
        updated_by TEXT
      )`,
    )
    .run();
}

// Anonymous confidence check-in: one row per (board, local-day, device token),
// so a device can change its vote but each device counts once. No names — just
// how the class feels about today's target. Resets naturally each day.
async function ensureCheckinSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS board_checkin (
        board_id   TEXT NOT NULL,
        day        TEXT NOT NULL,
        token      TEXT NOT NULL,
        value      TEXT NOT NULL,
        updated_at INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (board_id, day, token)
      )`,
    )
    .run();
}

const CHECKIN_VALUES = ["ready", "almost", "stuck"];

// A stable local-day string (UTC date) for bucketing votes. Good enough for a
// classroom pulse; the exact rollover hour is not important.
function dayKey(now) {
  return new Date(now).toISOString().slice(0, 10);
}

async function checkinTally(db, id, day) {
  const rows = await db
    .prepare(
      `SELECT value, COUNT(*) AS n FROM board_checkin WHERE board_id = ? AND day = ? GROUP BY value`,
    )
    .bind(id, day)
    .all();
  const tally = { ready: 0, almost: 0, stuck: 0 };
  for (const r of rows.results || []) {
    if (tally[r.value] != null) tally[r.value] = r.n;
  }
  tally.total = tally.ready + tally.almost + tally.stuck;
  tally.day = day;
  return tally;
}

// Writes are allowed when TEACHER_KEY is unset (fresh project / local dev) so
// the board is usable out of the box; once the key is set, writes require it.
function authorizeWrite(request, env, url) {
  if (!env.TEACHER_KEY) return { ok: true, gated: false };
  const key = url.searchParams.get("key") || request.headers.get("x-teacher-key") || "";
  return { ok: key === env.TEACHER_KEY, gated: true };
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsFor(request) });
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  const seg = (params.path && params.path[0]) || "";

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsFor(request) });
  }

  // Health probes availability without needing D1.
  if (seg === "health") {
    return json(
      { ok: true, backend: "cloudflare", d1: !!env.DB, gated: !!env.TEACHER_KEY },
      200,
      request,
    );
  }

  if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503, request);

  // ---- GET /api/board/get -------------------------------------------------
  if (seg === "get" && method === "GET") {
    const id = boardId(url.searchParams.get("board"));
    if (!id) return json({ ok: false, error: "invalid board id" }, 400, request);
    try {
      await ensureSchema(env.DB);
      await ensureCheckinSchema(env.DB);
      const row = await env.DB.prepare(
        `SELECT state_json, updated_at, updated_by FROM class_board WHERE board_id = ?`,
      )
        .bind(id)
        .first();
      const tally = await checkinTally(env.DB, id, dayKey(Date.now()));
      if (!row)
        return json(
          { ok: true, board: id, state: null, updatedAt: 0, checkin: tally },
          200,
          request,
        );
      let state = null;
      try {
        state = JSON.parse(row.state_json);
      } catch {
        state = null;
      }
      return json(
        {
          ok: true,
          board: id,
          state,
          updatedAt: row.updated_at || 0,
          updatedBy: row.updated_by || null,
          checkin: tally,
        },
        200,
        request,
      );
    } catch (e) {
      return json(
        { ok: false, error: "read-failed", detail: String(e && e.message) },
        500,
        request,
      );
    }
  }

  // ---- PUT/POST /api/board/save ------------------------------------------
  if (seg === "save" && (method === "PUT" || method === "POST")) {
    const auth = authorizeWrite(request, env, url);
    if (!auth.ok) return json({ ok: false, error: "unauthorized" }, 401, request);

    const id = boardId(url.searchParams.get("board"));
    if (!id) return json({ ok: false, error: "invalid board id" }, 400, request);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "invalid body" }, 400, request);
    }
    if (!body || typeof body !== "object" || !body.state || typeof body.state !== "object") {
      return json({ ok: false, error: "missing state" }, 400, request);
    }

    // Clamp updatedAt so a client can't pin a poisoned copy far in the future.
    const now = Date.now();
    const updatedAt = Math.min(Number(body.updatedAt) || now, now + 60_000);

    const serialized = JSON.stringify(body.state);
    // Boards stay small; reject anything abusive (D1 row/statement limits).
    if (serialized.length > 500_000)
      return json({ ok: false, error: "payload too large" }, 413, request);

    try {
      await ensureSchema(env.DB);
      // Last-write-wins: keep the server copy if it is newer.
      const existing = await env.DB.prepare(`SELECT updated_at FROM class_board WHERE board_id = ?`)
        .bind(id)
        .first();
      if (existing && (existing.updated_at || 0) > updatedAt) {
        return json({ ok: true, kept: "server", updatedAt: existing.updated_at }, 200, request);
      }
      const by = String(body.updatedBy || "teacher").slice(0, 40);
      await env.DB.prepare(
        `INSERT INTO class_board (board_id, state_json, updated_at, updated_by)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(board_id) DO UPDATE SET
           state_json = excluded.state_json,
           updated_at = excluded.updated_at,
           updated_by = excluded.updated_by`,
      )
        .bind(id, serialized, updatedAt, by)
        .run();
      return json({ ok: true, kept: "client", updatedAt }, 200, request);
    } catch (e) {
      return json(
        { ok: false, error: "write-failed", detail: String(e && e.message) },
        500,
        request,
      );
    }
  }

  // ---- POST /api/board/checkin -------------------------------------------
  // Anonymous student confidence vote on today's target. No names; one vote per
  // device (token), changeable. Returns the updated class tally.
  if (seg === "checkin" && method === "POST") {
    const id = boardId(url.searchParams.get("board"));
    if (!id) return json({ ok: false, error: "invalid board id" }, 400, request);
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "invalid body" }, 400, request);
    }
    const value = String((body && body.value) || "").toLowerCase();
    if (!CHECKIN_VALUES.includes(value)) {
      return json({ ok: false, error: "invalid value" }, 400, request);
    }
    // Device token dedupes votes without identifying the student. Fall back to a
    // coarse IP-based token if the client didn't send one.
    let token = String((body && body.token) || "")
      .replace(/[^a-z0-9-]/gi, "")
      .slice(0, 40);
    if (token.length < 6) token = "ip-" + (request.headers.get("CF-Connecting-IP") || "anon");
    const now = Date.now();
    const day = dayKey(now);
    try {
      await ensureCheckinSchema(env.DB);
      await env.DB.prepare(
        `INSERT INTO board_checkin (board_id, day, token, value, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(board_id, day, token) DO UPDATE SET
           value = excluded.value, updated_at = excluded.updated_at`,
      )
        .bind(id, day, token, value, now)
        .run();
      const tally = await checkinTally(env.DB, id, day);
      return json({ ok: true, checkin: tally, you: value }, 200, request);
    } catch (e) {
      return json(
        { ok: false, error: "checkin-failed", detail: String(e && e.message) },
        500,
        request,
      );
    }
  }

  return json({ ok: false, error: "not-found" }, 404, request);
}
