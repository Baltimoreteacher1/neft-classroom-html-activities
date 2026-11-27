/* =============================================================================
 * Tour room — the live audience room for the presented tour of The Language Page
 * -----------------------------------------------------------------------------
 * The presenter opens a room from /tour/ and projects its code. People in the
 * audience open /tour/join/ on a phone, follow the stop on screen, answer the
 * stop's question and send reactions. The projector shows the tallies.
 *
 * Routes (catch-all under /api/tour-room):
 *   POST open    {}                                        -> { ok, code, token }
 *   POST state   { code, token, stop, build, prompt, from } presenter or phone remote -> { ok, version }
 *   GET  state?code=                                       -> { ok, stop, build, prompt, version, from, people }
 *   POST join    { code, device }                          -> { ok }   (also the 30-second "still here")
 *   POST answer  { code, device, prompt, value }           -> { ok }
 *   POST react   { code, device, kind }                    -> { ok }
 *   GET  results?code=                                     -> { ok, people, prompts, reactions }
 *
 * NOTHING ABOUT A PERSON, BY CONSTRUCTION
 *   - No names, no free text. Every answer and reaction is an id from the closed
 *     lists in shared/tour-live/prompts.js; anything else is refused, never stored.
 *     A revision typed into the phone's Upgrade Lab is checked on the phone and
 *     only the three pass/fail bits are sent.
 *   - A device is a random token the phone made for itself. It lets a person
 *     change their answer (one answer per device per question) and counts who is
 *     still in the room. It is not tied to anything else and dies with the room.
 *   - The presenter's token is stored only as a SHA-256 hash.
 *   - A room and everything in it is deleted 6 hours after it opens.
 *
 * Tables are created idempotently on first use, like /api/family-engagement.
 * Without the D1 binding every route answers 503 and the tour still runs as a
 * plain presentation.
 * ========================================================================== */

import {
  PROMPTS,
  STOP_COUNT,
  validAnswer,
  validReaction,
} from "../../../shared/tour-live/prompts.js";
import { handler, json } from "../../_lib/http.js";

export const ROOM_TTL_MS = 6 * 60 * 60 * 1000;
/** Someone counts as present while their phone has checked in within this window. */
export const PRESENT_MS = 75_000;
/** At most this many rooms opened from one network per hour. */
export const OPENS_PER_HOUR = 20;
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_RE = /^[A-HJKMNP-Z2-9]{5}$/;
const DEVICE_RE = /^[A-Za-z0-9_-]{16,64}$/;
const TOKEN_RE = /^[0-9a-f]{32}$/;

const fail = (error, status = 400) => json({ ok: false, error }, status);
const ACTIONS = new Set([
  "POST open",
  "GET state",
  "POST state",
  "POST join",
  "POST answer",
  "POST react",
  "GET results",
]);

function randomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}
const randomToken = () =>
  [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The presenter's state, cleaned. Unknown or out-of-range values fall back rather than being stored. */
export function cleanState(body) {
  const stop = Math.round(Number(body?.stop));
  const build = Math.round(Number(body?.build));
  const prompt =
    typeof body?.prompt === "string" && Object.hasOwn(PROMPTS, body.prompt) ? body.prompt : "";
  return {
    stop: Number.isFinite(stop) ? Math.min(Math.max(stop, 0), STOP_COUNT - 1) : 0,
    build: Number.isFinite(build) ? Math.min(Math.max(build, 0), 9) : 0,
    prompt,
    from: body?.from === "remote" ? "remote" : "deck",
  };
}

/** Raw answer rows -> { promptId: { total, counts: { value: n } } }, closed vocabulary only. */
export function tally(rows) {
  const out = {};
  for (const r of rows) {
    if (!validAnswer(r.prompt, r.value)) continue;
    const cell = (out[r.prompt] ||= { total: 0, counts: {} });
    const n = Number(r.n) || 0;
    cell.total += n;
    cell.counts[r.value] = (cell.counts[r.value] || 0) + n;
  }
  return out;
}

/** Same-origin writes only: another site must not be able to script answers into a room. */
function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/** Once per isolate and database: phones poll often, and four CREATE statements per poll would be waste. */
const schemaReady = new WeakSet();

async function ensureSchema(db) {
  if (schemaReady.has(db)) return;
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS tour_room (
         code TEXT PRIMARY KEY, token_hash TEXT NOT NULL, ip_hash TEXT NOT NULL,
         state_json TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
         created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL)`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS tour_seen (
         code TEXT NOT NULL, device TEXT NOT NULL, seen_at INTEGER NOT NULL,
         PRIMARY KEY (code, device))`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS tour_answer (
         code TEXT NOT NULL, device TEXT NOT NULL, prompt TEXT NOT NULL, value TEXT NOT NULL,
         at INTEGER NOT NULL, PRIMARY KEY (code, device, prompt))`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS tour_react (
         code TEXT NOT NULL, kind TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0,
         PRIMARY KEY (code, kind))`,
    ),
  ]);
  schemaReady.add(db);
}

/** Delete expired rooms and everything in them. Runs whenever a room is opened. */
async function sweep(db, now) {
  const gone = `SELECT code FROM tour_room WHERE expires_at < ?1`;
  await db.batch([
    db.prepare(`DELETE FROM tour_seen WHERE code IN (${gone})`).bind(now),
    db.prepare(`DELETE FROM tour_answer WHERE code IN (${gone})`).bind(now),
    db.prepare(`DELETE FROM tour_react WHERE code IN (${gone})`).bind(now),
    db.prepare(`DELETE FROM tour_room WHERE expires_at < ?1`).bind(now),
  ]);
}

async function liveRoom(db, code, now) {
  if (!CODE_RE.test(String(code || ""))) return null;
  const { results } = await db
    .prepare(
      `SELECT code, token_hash, state_json, version FROM tour_room WHERE code = ?1 AND expires_at >= ?2`,
    )
    .bind(code, now)
    .all();
  return results[0] || null;
}

async function people(db, code, now) {
  const { results } = await db
    .prepare(`SELECT COUNT(*) AS n FROM tour_seen WHERE code = ?1 AND seen_at >= ?2`)
    .bind(code, now - PRESENT_MS)
    .all();
  return Number(results[0]?.n) || 0;
}

export async function handleTourRoom({ request, env, body, action, now = Date.now() }) {
  const db = env?.DB;
  if (!db) return fail("rooms are not available", 503);
  await ensureSchema(db);
  const method = request.method.toUpperCase();
  const key = `${method} ${action}`;
  if (!ACTIONS.has(key)) return fail("not found", 404);
  if (method === "POST" && !sameOrigin(request)) return fail("forbidden", 403);

  if (key === "POST open") {
    await sweep(db, now);
    const ipHash = await sha256(`tour-room|${request.headers.get("CF-Connecting-IP") || "anon"}`);
    const { results } = await db
      .prepare(`SELECT COUNT(*) AS n FROM tour_room WHERE ip_hash = ?1 AND created_at >= ?2`)
      .bind(ipHash, now - 3_600_000)
      .all();
    if ((Number(results[0]?.n) || 0) >= OPENS_PER_HOUR) return fail("too many rooms", 429);
    const token = randomToken();
    const tokenHash = await sha256(token);
    const state = JSON.stringify({ stop: 0, build: 0, prompt: "", from: "deck" });
    for (let attempt = 0; attempt < 6; attempt++) {
      const code = randomCode();
      try {
        await db
          .prepare(
            `INSERT INTO tour_room (code, token_hash, ip_hash, state_json, version, created_at, expires_at)
             VALUES (?1, ?2, ?3, ?4, 1, ?5, ?6)`,
          )
          .bind(code, tokenHash, ipHash, state, now, now + ROOM_TTL_MS)
          .run();
        return { ok: true, code, token, expiresAt: now + ROOM_TTL_MS };
      } catch {
        /* a live room already has this code: draw again */
      }
    }
    return fail("could not open a room", 503);
  }

  const url = new URL(request.url);
  const code = String(
    (method === "GET" ? url.searchParams.get("code") : body?.code) || "",
  ).toUpperCase();
  const room = await liveRoom(db, code, now);
  if (!room) return fail("no such room", 404);

  if (key === "GET state") {
    const state = JSON.parse(room.state_json);
    return { ok: true, ...state, version: room.version, people: await people(db, code, now) };
  }

  if (key === "GET results") {
    const answers = await db
      .prepare(
        `SELECT prompt, value, COUNT(*) AS n FROM tour_answer WHERE code = ?1 GROUP BY prompt, value`,
      )
      .bind(code)
      .all();
    const reacts = await db
      .prepare(`SELECT kind, n FROM tour_react WHERE code = ?1`)
      .bind(code)
      .all();
    const reactions = {};
    for (const r of reacts.results) if (validReaction(r.kind)) reactions[r.kind] = Number(r.n) || 0;
    return {
      ok: true,
      people: await people(db, code, now),
      prompts: tally(answers.results),
      reactions,
    };
  }

  if (key === "POST state") {
    if (!TOKEN_RE.test(String(body?.token || ""))) return fail("presenter only", 401);
    if ((await sha256(body.token)) !== room.token_hash) return fail("presenter only", 401);
    const state = cleanState(body);
    await db
      .prepare(`UPDATE tour_room SET state_json = ?1, version = version + 1 WHERE code = ?2`)
      .bind(JSON.stringify(state), code)
      .run();
    return { ok: true, version: room.version + 1 };
  }

  const device = String(body?.device || "");
  if (!DEVICE_RE.test(device)) return fail("invalid device");

  if (key === "POST join") {
    await db
      .prepare(
        `INSERT INTO tour_seen (code, device, seen_at) VALUES (?1, ?2, ?3)
         ON CONFLICT (code, device) DO UPDATE SET seen_at = excluded.seen_at`,
      )
      .bind(code, device, now)
      .run();
    return { ok: true };
  }

  if (key === "POST answer") {
    const prompt = String(body?.prompt || "");
    const value = String(body?.value ?? "");
    if (!validAnswer(prompt, value)) return fail("invalid answer");
    await db.batch([
      db
        .prepare(
          `INSERT INTO tour_answer (code, device, prompt, value, at) VALUES (?1, ?2, ?3, ?4, ?5)
           ON CONFLICT (code, device, prompt) DO UPDATE SET value = excluded.value, at = excluded.at`,
        )
        .bind(code, device, prompt, value, now),
      db
        .prepare(
          `INSERT INTO tour_seen (code, device, seen_at) VALUES (?1, ?2, ?3)
           ON CONFLICT (code, device) DO UPDATE SET seen_at = excluded.seen_at`,
        )
        .bind(code, device, now),
    ]);
    return { ok: true };
  }

  if (key === "POST react") {
    const kind = String(body?.kind || "");
    if (!validReaction(kind)) return fail("invalid reaction");
    await db
      .prepare(
        `INSERT INTO tour_react (code, kind, n) VALUES (?1, ?2, 1)
         ON CONFLICT (code, kind) DO UPDATE SET n = n + 1`,
      )
      .bind(code, kind)
      .run();
    return { ok: true };
  }

  return fail("not found", 404);
}

export const onRequest = handler({
  methods: ["GET", "POST"],
  // A room is one network: a whole audience on school Wi-Fi shares an IP, so the IP cap is wide and the
  // per-phone cap (X-Anon-Token) does the real limiting. Phones poll every 3 s, the projector every 2 s.
  rateLimit: { max: 200, windowMs: 60_000, ipMax: 8000 },
  maxBodyBytes: 2_048,
  async handle(context) {
    const parts = context.params?.path;
    const action = Array.isArray(parts) ? parts.join("/") : String(parts || "");
    return handleTourRoom({ ...context, action });
  },
});
