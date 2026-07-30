/* =============================================================================
 * Class Roster backend — Cloudflare Pages Function (optional, opt-in)
 * -----------------------------------------------------------------------------
 * Cross-device student identity: the teacher syncs a class list (first name +
 * last initial ONLY) under a short join code; any device fetches the list with
 * that code and the student picks their name. Because the picked name is
 * byte-identical on every device, the derived studentId (slugified name) is
 * stable across devices — save/resume, telemetry, and curriculum progress all
 * inherit continuity with no accounts and no logins.
 *
 * Routes (catch-all under /api/roster):
 *   GET  /api/roster/health                    -> { ok, d1, gated }
 *   GET  /api/roster/get?code=MK7Q9C           -> { ok, code, section, students }
 *   POST /api/roster/save   { code?, section, names:[...] }
 *        TEACHER-gated. No code -> creates one. With code -> replaces that
 *        roster (existing student ids are preserved by name match).
 *   DELETE /api/roster/save?code=              -> TEACHER-gated, removes roster.
 *
 * Storage: Cloudflare D1, bound as `env.DB` (same DB as student_progress).
 * Privacy: rows hold first name + last initial and a section label only.
 * Reads are public-but-rate-limited (a class shares one code the way it
 * shares a physical seating chart); writes require env.TEACHER_KEY once set.
 *
 * GRACEFUL DEGRADATION: if the D1 binding is absent every data route returns
 * HTTP 503 and clients silently fall back to typed names. Nothing breaks.
 * ========================================================================== */

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
    "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
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

// Join codes use the save-code alphabet: no 0/O/1/I/L so they survive being
// written on a whiteboard. 6 chars ≈ 887M combinations behind a rate limiter.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

function newCode() {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}

function cleanCode(raw) {
  const c = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z2-9]/g, "")
    .slice(0, 12);
  return c.length >= 4 ? c : null;
}

function cleanField(raw, max) {
  return String(raw == null ? "" : raw)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);
}

// Stable per-student id: slug of the roster name. Two students in one class
// with a colliding "First L." slug get a numeric suffix so ids stay unique.
function slugId(name) {
  return (
    String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "student"
  );
}

async function ensureSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS class_roster (
        code         TEXT NOT NULL,
        student_id   TEXT NOT NULL,
        student_name TEXT NOT NULL,
        section      TEXT NOT NULL,
        created_at   INTEGER NOT NULL DEFAULT 0,
        updated_at   INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (code, student_id)
      )`,
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS class_roster_guard (
        ip     TEXT NOT NULL,
        bucket INTEGER NOT NULL,
        hits   INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (ip, bucket)
      )`,
    )
    .run();
}

// Per-IP read throttle (a whole class shares one NAT — keep it generous):
// 10-minute buckets, 300 reads each. Blocks bulk code enumeration only.
const GUARD_WINDOW_MS = 10 * 60 * 1000;
const GUARD_MAX = 300;

function guardBucket() {
  return Math.floor(Date.now() / GUARD_WINDOW_MS);
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

async function guardOver(db, ip, bucket) {
  const row = await db
    .prepare(`SELECT hits FROM class_roster_guard WHERE ip = ? AND bucket = ?`)
    .bind(ip, bucket)
    .first();
  return (row && row.hits) >= GUARD_MAX;
}

async function guardNote(db, ip, bucket) {
  await db
    .prepare(
      `INSERT INTO class_roster_guard (ip, bucket, hits) VALUES (?, ?, 1)
       ON CONFLICT(ip, bucket) DO UPDATE SET hits = hits + 1`,
    )
    .bind(ip, bucket)
    .run();
  await db
    .prepare(`DELETE FROM class_roster_guard WHERE bucket < ?`)
    .bind(bucket - 2)
    .run();
}

// Writes are allowed when TEACHER_KEY is unset (fresh project / local dev);
// once the key is set, writes require it — same contract as /api/board.
function authorizeWrite(request, env, url) {
  // Fail CLOSED. An unbound TEACHER_KEY used to return ok:true, so a secret
  // that silently failed to bind at deploy left every student name, save code
  // and roster write world-open. Mirrors teacherAuthorized() in
  // functions/api/progress: no key -> 503 not-configured, wrong key -> 401.
  if (!env.TEACHER_KEY) return { ok: false, gated: true, configured: false };
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

  if (seg === "health") {
    return json(
      { ok: true, backend: "cloudflare", d1: !!env.DB, gated: !!env.TEACHER_KEY },
      200,
      request,
    );
  }

  if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503, request);

  // ---- GET /api/roster/get?code= ------------------------------------------
  // Public read (rate-limited): the class name list for a join code.
  if (seg === "get" && method === "GET") {
    const code = cleanCode(url.searchParams.get("code"));
    if (!code) return json({ ok: false, error: "invalid code" }, 400, request);
    try {
      await ensureSchema(env.DB);
      const ip = clientIp(request);
      const bucket = guardBucket();
      if (await guardOver(env.DB, ip, bucket)) {
        return json({ ok: false, error: "rate-limited" }, 429, request);
      }
      await guardNote(env.DB, ip, bucket);
      const res = await env.DB.prepare(
        `SELECT student_id, student_name, section FROM class_roster
         WHERE code = ? ORDER BY student_name COLLATE NOCASE`,
      )
        .bind(code)
        .all();
      const rows = res.results || [];
      if (!rows.length) return json({ ok: false, error: "not-found" }, 404, request);
      return json(
        {
          ok: true,
          code,
          section: rows[0].section || "",
          students: rows.map((r) => ({ id: r.student_id, name: r.student_name })),
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

  // ---- POST /api/roster/save ----------------------------------------------
  // TEACHER-gated. { code?, section, names:["Jane D.", ...] }. Creates a new
  // join code when none is given; with a code it replaces that roster while
  // preserving each returning student's id (matched by name, case-insensitive).
  if (seg === "save" && method === "POST") {
    const auth = authorizeWrite(request, env, url);
    if (auth.configured === false)
      return json({ ok: false, error: "not-configured" }, 503, request);
    if (!auth.ok) return json({ ok: false, error: "unauthorized" }, 401, request);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "invalid body" }, 400, request);
    }
    const section = cleanField(body && body.section, 40);
    const names = Array.isArray(body && body.names)
      ? body.names
          .map((n) => cleanField(n, 60))
          .filter(Boolean)
          .slice(0, 60)
      : [];
    if (!section || !names.length) {
      return json({ ok: false, error: "missing section or names" }, 400, request);
    }

    try {
      await ensureSchema(env.DB);
      let code = cleanCode(body && body.code);
      const existingIds = new Map(); // lower-name -> student_id (id stability)
      if (code) {
        const prior = await env.DB.prepare(
          `SELECT student_id, student_name FROM class_roster WHERE code = ?`,
        )
          .bind(code)
          .all();
        for (const r of prior.results || []) {
          existingIds.set(String(r.student_name).toLowerCase(), r.student_id);
        }
      } else {
        // Fresh code — retry on the (astronomically rare) collision.
        for (let i = 0; i < 5; i++) {
          code = newCode();
          const hit = await env.DB.prepare(`SELECT 1 AS x FROM class_roster WHERE code = ? LIMIT 1`)
            .bind(code)
            .first();
          if (!hit) break;
        }
      }

      const now = Date.now();
      const usedIds = new Set();
      const students = names.map((name) => {
        let id = existingIds.get(name.toLowerCase()) || slugId(name);
        let n = 2;
        while (usedIds.has(id)) id = `${slugId(name)}-${n++}`;
        usedIds.add(id);
        return { id, name };
      });

      const statements = [
        env.DB.prepare(`DELETE FROM class_roster WHERE code = ?`).bind(code),
      ].concat(
        students.map((s) =>
          env.DB.prepare(
            `INSERT INTO class_roster
               (code, student_id, student_name, section, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
          ).bind(code, s.id, s.name, section, now, now),
        ),
      );
      await env.DB.batch(statements);

      return json({ ok: true, code, section, students }, 200, request);
    } catch (e) {
      return json(
        { ok: false, error: "write-failed", detail: String(e && e.message) },
        500,
        request,
      );
    }
  }

  // ---- DELETE /api/roster/save?code= --------------------------------------
  if (seg === "save" && method === "DELETE") {
    const auth = authorizeWrite(request, env, url);
    if (auth.configured === false)
      return json({ ok: false, error: "not-configured" }, 503, request);
    if (!auth.ok) return json({ ok: false, error: "unauthorized" }, 401, request);
    const code = cleanCode(url.searchParams.get("code"));
    if (!code) return json({ ok: false, error: "invalid code" }, 400, request);
    try {
      await ensureSchema(env.DB);
      await env.DB.prepare(`DELETE FROM class_roster WHERE code = ?`).bind(code).run();
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
