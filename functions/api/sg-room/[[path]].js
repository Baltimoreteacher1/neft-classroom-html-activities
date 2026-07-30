/* =============================================================================
 * Small-group ROOM backend — Cloudflare Pages Function
 * -----------------------------------------------------------------------------
 * Why this exists: the small-group studio is named for four students at a table,
 * but every social affordance in it was single-player. The studio simulated a
 * "Team consensus protocol" that unlocked at "0 of 3 voices ready" and asked
 * students to defend their reasoning to two canned skeptics — while three real
 * skeptics sat in the same room. This endpoint is the smallest thing that makes
 * the disagreement real: one code, up to six seats, private commits, simultaneous
 * reveal.
 *
 * The pedagogy depends on the ordering. Answers are WITHHELD until every seat has
 * committed, because a group where the fast student answers first is a group
 * where nobody else thinks. Once all seats are in, everyone sees everything at
 * once, and the disagreement is the lesson.
 *
 * Routes (catch-all under /api/sg-room):
 *   POST /api/sg-room/open    { lessonId }                  -> { code, seat }
 *   POST /api/sg-room/join    { code }                      -> { seat, lessonId, seats }
 *   POST /api/sg-room/commit  { code, seat, itemKey, answer }-> { committed, seats }
 *   GET  /api/sg-room/state?code=&itemKey=                  -> { seats, committed, revealed, answers }
 *   GET  /api/sg-room/health                                -> { ok, d1 }
 *
 * PRIVACY: seats are NUMBERS. No names, no student identifiers, no section, ever.
 * A room holds short math answers for a few hours and then expires. The studio's
 * own promise is "Private · saved on this device"; a shared room is necessarily
 * shared, so it is scoped to the narrowest thing that makes it work — an answer
 * and a seat number — and it expires on its own.
 *
 * GRACEFUL DEGRADATION: mirrors functions/api/state.js — if the D1 binding is
 * absent every data route returns 503 and the studio silently keeps its solo
 * behaviour (the canned skeptic). Nothing breaks, nothing blocks.
 * ========================================================================== */

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  // Room state is live by definition; a cached reveal would be a wrong reveal.
  "Cache-Control": "no-store",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

const ROOM_TTL_SEC = 4 * 60 * 60; // one school day's worth of rotations
const MAX_SEATS = 6; // a small group; past this it is a class, not a table
const MAX_ANSWER = 60; // short math answers only — never prose
const MAX_ITEM_KEY = 80;

// Unambiguous alphabet: no O/0, no I/1/L. Students read these off a board and
// type them on a Chromebook; a code that is hard to transcribe is a code that
// generates support requests instead of discussion.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function makeCode() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

const validCode = (code) => typeof code === "string" && /^[A-Z2-9]{4}$/.test(code);
const validLessonId = (id) =>
  typeof id === "string" && /^\d{1,2}-\d{1,2}-(group[12]|catchup)$/.test(id);
const validSeat = (seat) => Number.isInteger(seat) && seat >= 1 && seat <= MAX_SEATS;

async function ensureSchema(db) {
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS sg_room (
         code       TEXT PRIMARY KEY,
         lesson_id  TEXT NOT NULL,
         seats      INTEGER NOT NULL DEFAULT 1,
         created_at INTEGER NOT NULL,
         expires_at INTEGER NOT NULL
       )`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS sg_room_commit (
         code      TEXT NOT NULL,
         item_key  TEXT NOT NULL,
         seat      INTEGER NOT NULL,
         answer    TEXT NOT NULL,
         at        INTEGER NOT NULL,
         PRIMARY KEY (code, item_key, seat)
       )`,
    ),
    db.prepare(`CREATE INDEX IF NOT EXISTS sg_room_expires ON sg_room(expires_at)`),
  ]);
}

// Opportunistic pruning: expired rooms and their commits are deleted on the way
// past, so the table stays small without a scheduled job. Cheap enough to run on
// room creation only — the one route that is not on a polling path.
async function prune(db, now) {
  await db.batch([
    db
      .prepare(
        `DELETE FROM sg_room_commit WHERE code IN (SELECT code FROM sg_room WHERE expires_at < ?)`,
      )
      .bind(now),
    db.prepare(`DELETE FROM sg_room WHERE expires_at < ?`).bind(now),
  ]);
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function liveRoom(db, code, now) {
  const room = await db
    .prepare(`SELECT code, lesson_id, seats, expires_at FROM sg_room WHERE code = ?`)
    .bind(code)
    .first();
  if (!room || Number(room.expires_at) < now) return null;
  return room;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: JSON_HEADERS });

  const route = (
    Array.isArray(params.path) ? params.path.join("/") : params.path || ""
  ).toLowerCase();
  const db = env.DB;
  const now = Math.floor(Date.now() / 1000);

  if (route === "health") {
    return json({ ok: true, backend: "d1", d1: Boolean(db) });
  }
  if (!db) {
    // No binding → the studio stays solo. This is a supported state, not an error
    // the student should ever see.
    return json({ ok: false, error: "rooms-unavailable" }, 503);
  }

  try {
    await ensureSchema(db);

    if (route === "open" && request.method === "POST") {
      const body = await readBody(request);
      if (!validLessonId(body?.lessonId)) return json({ ok: false, error: "bad-lesson" }, 400);
      await prune(db, now);
      // Retry on the vanishingly unlikely collision with a live room rather than
      // handing back somebody else's table.
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = makeCode();
        if (await liveRoom(db, code, now)) continue;
        await db
          .prepare(
            `INSERT OR REPLACE INTO sg_room (code, lesson_id, seats, created_at, expires_at)
             VALUES (?, ?, 1, ?, ?)`,
          )
          .bind(code, body.lessonId, now, now + ROOM_TTL_SEC)
          .run();
        return json({ ok: true, code, seat: 1, seats: 1, lessonId: body.lessonId });
      }
      return json({ ok: false, error: "no-code" }, 503);
    }

    if (route === "join" && request.method === "POST") {
      const body = await readBody(request);
      if (!validCode(body?.code)) return json({ ok: false, error: "bad-code" }, 400);
      const room = await liveRoom(db, body.code, now);
      if (!room) return json({ ok: false, error: "no-room" }, 404);
      if (Number(room.seats) >= MAX_SEATS) return json({ ok: false, error: "room-full" }, 409);
      // Seats are handed out by incrementing under a guard, so two students
      // tapping Join at once cannot land on the same seat.
      const seat = Number(room.seats) + 1;
      const claimed = await db
        .prepare(`UPDATE sg_room SET seats = ? WHERE code = ? AND seats = ?`)
        .bind(seat, room.code, room.seats)
        .run();
      if (!claimed.meta?.changes) return json({ ok: false, error: "retry" }, 409);
      return json({ ok: true, code: room.code, seat, seats: seat, lessonId: room.lesson_id });
    }

    if (route === "commit" && request.method === "POST") {
      const body = await readBody(request);
      if (!validCode(body?.code)) return json({ ok: false, error: "bad-code" }, 400);
      if (!validSeat(body?.seat)) return json({ ok: false, error: "bad-seat" }, 400);
      const itemKey = String(body?.itemKey ?? "").slice(0, MAX_ITEM_KEY);
      const answer = String(body?.answer ?? "")
        .trim()
        .slice(0, MAX_ANSWER);
      if (!itemKey || !answer) return json({ ok: false, error: "bad-commit" }, 400);
      const room = await liveRoom(db, body.code, now);
      if (!room) return json({ ok: false, error: "no-room" }, 404);
      // The seat must actually exist at this table. Without this check a device
      // could commit as seats 4, 5 and 6 at a three-seat table and push the
      // commit count past the seat count — forcing the reveal while two real
      // students were still thinking. That is precisely the failure the reveal
      // gate exists to prevent, so it is enforced here and not only client-side.
      if (body.seat > Number(room.seats)) return json({ ok: false, error: "no-seat" }, 409);
      // A commit is final for that seat and item: the whole point is that you
      // cannot revise after seeing what everyone else said.
      await db
        .prepare(
          `INSERT OR IGNORE INTO sg_room_commit (code, item_key, seat, answer, at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(room.code, itemKey, body.seat, answer, now)
        .run();
      const count = await db
        .prepare(`SELECT COUNT(*) AS n FROM sg_room_commit WHERE code = ? AND item_key = ?`)
        .bind(room.code, itemKey)
        .first();
      return json({ ok: true, committed: Number(count?.n) || 0, seats: Number(room.seats) });
    }

    if (route === "state" && request.method === "GET") {
      const url = new URL(request.url);
      const code = (url.searchParams.get("code") || "").toUpperCase();
      const itemKey = String(url.searchParams.get("itemKey") || "").slice(0, MAX_ITEM_KEY);
      if (!validCode(code)) return json({ ok: false, error: "bad-code" }, 400);
      const room = await liveRoom(db, code, now);
      if (!room) return json({ ok: false, error: "no-room" }, 404);
      if (!itemKey) return json({ ok: true, seats: Number(room.seats), lessonId: room.lesson_id });
      const { results } = await db
        .prepare(
          `SELECT seat, answer FROM sg_room_commit WHERE code = ? AND item_key = ? ORDER BY seat`,
        )
        .bind(code, itemKey)
        .all();
      const commits = results || [];
      const seats = Number(room.seats);
      // The reveal gate. Two conditions, both required: everyone has committed,
      // and there is more than one person to disagree with. A "reveal" to a
      // single seat is just the studio showing you your own answer.
      const revealed = seats >= 2 && commits.length >= seats;
      return json({
        ok: true,
        seats,
        committed: commits.length,
        revealed,
        answers: revealed
          ? commits.map((row) => ({ seat: Number(row.seat), answer: row.answer }))
          : null,
      });
    }

    return json({ ok: false, error: "not-found" }, 404);
  } catch (error) {
    // Never surface a stack to a classroom. The studio treats any failure as
    // "rooms are unavailable" and continues solo.
    return json({ ok: false, error: "room-error", detail: String(error?.message || error) }, 500);
  }
}
