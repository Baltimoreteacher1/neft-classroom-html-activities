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
    "access-control-allow-methods": "GET,PUT,POST,DELETE,OPTIONS",
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

// Class-wide save-code locker: one row per (board, student, assignment) so a
// teacher can see/collect every student's code for a section in one place.
// Students submit their own code (public write, rate-limited); reads are
// TEACHER-gated.
async function ensureCodesSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS board_codes (
        board_id   TEXT NOT NULL,
        student    TEXT NOT NULL,
        assignment TEXT NOT NULL,
        code       TEXT NOT NULL,
        updated_at INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (board_id, student, assignment)
      )`,
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS board_codes_guard (
        ip     TEXT NOT NULL,
        bucket INTEGER NOT NULL,
        hits   INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (ip, bucket)
      )`,
    )
    .run();
}

// Per-IP write throttle (mirrors /api/supports): a whole class shares one NAT,
// so keep the window generous. 10-minute buckets, 240 writes each.
const CODES_GUARD_WINDOW_MS = 10 * 60 * 1000;
const CODES_GUARD_MAX = 240;
function codesGuardBucket() {
  return Math.floor(Date.now() / CODES_GUARD_WINDOW_MS);
}
function clientIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown"
  )
    .split(",")[0]
    .trim();
}
async function codesGuardOver(db, ip, bucket) {
  const row = await db
    .prepare(`SELECT hits FROM board_codes_guard WHERE ip = ? AND bucket = ?`)
    .bind(ip, bucket)
    .first();
  return (row && row.hits) >= CODES_GUARD_MAX;
}
async function codesGuardNote(db, ip, bucket) {
  await db
    .prepare(
      `INSERT INTO board_codes_guard (ip, bucket, hits) VALUES (?, ?, 1)
       ON CONFLICT(ip, bucket) DO UPDATE SET hits = hits + 1`,
    )
    .bind(ip, bucket)
    .run();
  // Opportunistically drop stale buckets so the table can't grow unbounded.
  await db
    .prepare(`DELETE FROM board_codes_guard WHERE bucket < ?`)
    .bind(bucket - 2)
    .run();
}
function cleanField(raw, max) {
  return String(raw == null ? "" : raw)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);
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
      const row = await env.DB.prepare(
        `SELECT state_json, updated_at, updated_by FROM class_board WHERE board_id = ?`,
      )
        .bind(id)
        .first();
      if (!row) return json({ ok: true, board: id, state: null, updatedAt: 0 }, 200, request);
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

  // ---- POST /api/board/codes --------------------------------------------
  // A student submits (or updates) their own save code for one assignment.
  // Public write, rate-limited. { board, student, assignment, code }.
  if (seg === "codes" && (method === "POST" || method === "PUT")) {
    const id = boardId(url.searchParams.get("board"));
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "invalid body" }, 400, request);
    }
    const board = id || boardId(body && body.board);
    const student = cleanField(body && body.student, 40);
    const assignment = cleanField(body && body.assignment, 120);
    const code = cleanField(body && body.code, 40).toUpperCase();
    if (!board || !student || !assignment || !code) {
      return json({ ok: false, error: "missing fields" }, 400, request);
    }
    try {
      await ensureCodesSchema(env.DB);
      const ip = clientIp(request);
      const bucket = codesGuardBucket();
      if (await codesGuardOver(env.DB, ip, bucket)) {
        return json({ ok: false, error: "rate-limited" }, 429, request);
      }
      await codesGuardNote(env.DB, ip, bucket);
      await env.DB.prepare(
        `INSERT INTO board_codes (board_id, student, assignment, code, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(board_id, student, assignment) DO UPDATE SET
           code = excluded.code,
           updated_at = excluded.updated_at`,
      )
        .bind(board, student, assignment, code, Date.now())
        .run();
      return json({ ok: true }, 200, request);
    } catch (e) {
      return json(
        { ok: false, error: "write-failed", detail: String(e && e.message) },
        500,
        request,
      );
    }
  }

  // ---- GET /api/board/codes ---------------------------------------------
  // TEACHER-gated: every submitted code for a section, newest first.
  if (seg === "codes" && method === "GET") {
    const auth = authorizeWrite(request, env, url);
    if (!auth.ok) return json({ ok: false, error: "unauthorized" }, 401, request);
    const id = boardId(url.searchParams.get("board"));
    if (!id) return json({ ok: false, error: "invalid board id" }, 400, request);
    try {
      await ensureCodesSchema(env.DB);
      const res = await env.DB.prepare(
        `SELECT student, assignment, code, updated_at FROM board_codes
         WHERE board_id = ? ORDER BY assignment COLLATE NOCASE, student COLLATE NOCASE`,
      )
        .bind(id)
        .all();
      const codes = (res.results || []).map((r) => ({
        student: r.student,
        assignment: r.assignment,
        code: r.code,
        updatedAt: r.updated_at || 0,
      }));
      return json({ ok: true, board: id, codes }, 200, request);
    } catch (e) {
      return json(
        { ok: false, error: "read-failed", detail: String(e && e.message) },
        500,
        request,
      );
    }
  }

  // ---- DELETE /api/board/codes ------------------------------------------
  // TEACHER-gated: clear one student's code or the whole section's codes.
  if (seg === "codes" && method === "DELETE") {
    const auth = authorizeWrite(request, env, url);
    if (!auth.ok) return json({ ok: false, error: "unauthorized" }, 401, request);
    const id = boardId(url.searchParams.get("board"));
    if (!id) return json({ ok: false, error: "invalid board id" }, 400, request);
    let body = {};
    try {
      body = (await request.json()) || {};
    } catch {}
    const student = cleanField(body.student, 40);
    const assignment = cleanField(body.assignment, 120);
    try {
      await ensureCodesSchema(env.DB);
      if (student && assignment) {
        await env.DB.prepare(
          `DELETE FROM board_codes WHERE board_id = ? AND student = ? AND assignment = ?`,
        )
          .bind(id, student, assignment)
          .run();
      } else {
        await env.DB.prepare(`DELETE FROM board_codes WHERE board_id = ?`).bind(id).run();
      }
      return json({ ok: true }, 200, request);
    } catch (e) {
      return json(
        { ok: false, error: "delete-failed", detail: String(e && e.message) },
        500,
        request,
      );
    }
  }

  return json({ ok: false, error: "not-found" }, 404, request);
}
