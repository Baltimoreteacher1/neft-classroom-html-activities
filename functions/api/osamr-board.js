/* =============================================================================
 * OSAMR Case Clinic — shared gallery board (Cloudflare Pages Function)
 * -----------------------------------------------------------------------------
 * During the case clinic each of the 7 groups works on its own device. The
 * Gallery tab is only a "board" if every device shows every group's ruling, so
 * this endpoint holds one row per group and the page polls it.
 *
 * WHO WRITES HERE: adult participants in a facilitated professional-learning
 * session, writing their own professional analysis for colleagues in the same
 * room. That is a materially different risk profile from student work, so this
 * has no consent/moderation queue like /api/showcase. It is NOT a reason to
 * skip hygiene — the URL is public, so:
 *
 *   - Field text is clamped (control characters stripped, length capped) at
 *     ingest, and served as plain JSON strings. The gallery renders every value
 *     with textContent, never innerHTML.
 *   - Writes are rate limited per IP by the shared handler.
 *   - Only the 7 known group ids and the 7 known field names are accepted;
 *     anything else is dropped rather than stored.
 *   - No file uploads, no HTML, no links are required or interpreted.
 *
 * SINGLE FIXED BOARD, BY DESIGN. There is no room code: participants open one
 * URL and see one board, which is the whole point for a one-time activity.
 * The consequence is that a later session inherits the previous session's
 * rulings, so BOARD_ID is bumped by hand to start a clean board (or a teacher
 * -keyed DELETE clears the current one).
 *
 * ROUTES
 *   GET  /api/osamr-board            -> { ok, groups: { "1": {...}, ... } }
 *   POST /api/osamr-board            -> upsert one group's ruling
 *   DELETE /api/osamr-board          -> clear the board (TEACHER_KEY required)
 *   OPTIONS                          -> 204
 *
 * Storage: D1 bound as env.DB, idempotent CREATE TABLE IF NOT EXISTS per call,
 * mirroring functions/api/showcase.js. If DB is unbound the endpoint reports
 * ok:false with `unavailable`, and the page silently falls back to its local
 * gallery — a missing binding must never break the activity.
 * ========================================================================== */

import { badRequest, handler, unauthorized } from "../_lib/http.js";

/** Bump to start a fresh board; old rows stay behind under the old id. */
const BOARD_ID = "2026-osamr-clinic";

const GROUP_IDS = [1, 2, 3, 4, 5, 6, 7];
const FIELDS = ["barrier", "thinking", "action", "osamr", "evidence", "redflag", "fix"];

/** Per-field cap. Generous for a paragraph, small enough to bound the table. */
const MAX_FIELD = 1200;

/**
 * Strip control characters (except tab/newline) and clamp. Returns a string
 * always, so a malformed value degrades to "" rather than propagating a type.
 */
function clean(value) {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, MAX_FIELD);
}

function cleanFields(input) {
  const out = {};
  if (!input || typeof input !== "object") return out;
  for (const f of FIELDS) {
    const v = clean(input[f]);
    if (v) out[f] = v;
  }
  return out;
}

async function ensureSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS osamr_board (
        board_id   TEXT NOT NULL,
        group_id   INTEGER NOT NULL,
        fields_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (board_id, group_id)
      )`,
    )
    .run();
}

export const onRequest = handler({
  methods: ["GET", "POST", "DELETE"],
  rateLimit: { max: 120, windowMs: 60_000 },
  async handle({ request, env, body }) {
    const db = env?.DB;
    // Fail SOFT: the page keeps working from localStorage if the board is not
    // reachable. A PD session must not stop because a binding is missing.
    if (!db) return { ok: false, error: "unavailable" };

    await ensureSchema(db);

    if (request.method === "GET") {
      const { results } = await db
        .prepare(
          `SELECT group_id, fields_json, updated_at FROM osamr_board
           WHERE board_id = ? ORDER BY group_id`,
        )
        .bind(BOARD_ID)
        .all();

      const groups = {};
      for (const row of results || []) {
        let fields = {};
        try {
          fields = JSON.parse(row.fields_json) || {};
        } catch {
          fields = {};
        }
        groups[String(row.group_id)] = { fields, updatedAt: row.updated_at };
      }
      return { ok: true, boardId: BOARD_ID, groups };
    }

    if (request.method === "DELETE") {
      const key = request.headers.get("x-teacher-key");
      if (!env.TEACHER_KEY || key !== env.TEACHER_KEY) return unauthorized();
      await db.prepare("DELETE FROM osamr_board WHERE board_id = ?").bind(BOARD_ID).run();
      return { ok: true, cleared: BOARD_ID };
    }

    // POST — upsert one group's ruling.
    const groupId = Number(body?.group);
    if (!GROUP_IDS.includes(groupId)) return badRequest("group must be 1-7");

    const fields = cleanFields(body?.fields);
    const updatedAt = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO osamr_board (board_id, group_id, fields_json, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(board_id, group_id)
         DO UPDATE SET fields_json = excluded.fields_json, updated_at = excluded.updated_at`,
      )
      .bind(BOARD_ID, groupId, JSON.stringify(fields), updatedAt)
      .run();

    return { ok: true, group: groupId, updatedAt };
  },
});
