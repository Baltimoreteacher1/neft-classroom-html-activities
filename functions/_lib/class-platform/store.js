/* =============================================================================
 * Class platform storage + auth (D1 `env.DB`). Used by functions/api/class.
 * -----------------------------------------------------------------------------
 * The schema of record is migrations/0011_class_platform.sql; the endpoint also
 * creates it lazily (CREATE TABLE IF NOT EXISTS, the sg-room/class-data pattern)
 * and functions/api/class/class.test.mjs fails if the two differ.
 *
 * AUTH (AUTH_CONTRACT.md §3 extended per class, never per teacher):
 *   - Creating a class needs `x-teacher-key` == env.TEACHER_KEY.
 *   - That class's teacher routes accept TEACHER_KEY, or the class's own teacher
 *     passcode in `x-class-teacher` (so a projector or phone can open ONE class
 *     dashboard without the site-wide key). The passcode is stored hashed.
 *   - A student write needs `x-class-student: <studentId>.<studentKey>`; the key
 *     is stored hashed and shown once on join (the teacher can reset it).
 *   - A family digest link carries a read-only token derived from the student's
 *     key hash; it opens the digest and nothing else.
 * ========================================================================== */

import { codeFromBytes, LIMITS, SECRET_LENGTH } from "../../../shared/class-platform/contract.js";

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS class_platform_class (
    code TEXT PRIMARY KEY,
    app TEXT NOT NULL,
    title TEXT NOT NULL,
    salt TEXT NOT NULL,
    teacher_hash TEXT NOT NULL,
    settings_json TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    last_active_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS class_platform_class_expires ON class_platform_class (expires_at)`,
  `CREATE TABLE IF NOT EXISTS class_platform_student (
    code TEXT NOT NULL,
    student_id TEXT NOT NULL,
    alias TEXT NOT NULL COLLATE NOCASE,
    key_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL,
    PRIMARY KEY (code, student_id),
    UNIQUE (code, alias)
  )`,
  `CREATE TABLE IF NOT EXISTS class_platform_doc (
    code TEXT NOT NULL,
    student_id TEXT NOT NULL,
    doc TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    received_at INTEGER NOT NULL,
    data TEXT NOT NULL,
    summary_json TEXT NOT NULL DEFAULT '{}',
    PRIMARY KEY (code, student_id, doc)
  )`,
  `CREATE TABLE IF NOT EXISTS class_platform_guard (
    bucket_key TEXT PRIMARY KEY,
    hits INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS class_platform_room (
    room_id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    kind TEXT NOT NULL,
    state_json TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS class_platform_room_code ON class_platform_room (code, expires_at)`,
  `CREATE TABLE IF NOT EXISTS class_platform_response (
    room_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    item TEXT NOT NULL,
    response_json TEXT NOT NULL,
    correct INTEGER,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (room_id, student_id, item)
  )`,
  `CREATE TABLE IF NOT EXISTS class_platform_audio (
    audio_id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    student_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    parent_id TEXT,
    label TEXT NOT NULL DEFAULT '',
    mime TEXT NOT NULL,
    bytes BLOB NOT NULL,
    size INTEGER NOT NULL,
    heard INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS class_platform_audio_student ON class_platform_audio (code, student_id)`,
];

const ready = new WeakSet();
export async function ensureSchema(db) {
  if (ready.has(db)) return;
  await db.batch(SCHEMA.map((sql) => db.prepare(sql)));
  ready.add(db);
}

const DAY_MS = 24 * 60 * 60 * 1000;
export const RETENTION_MS = LIMITS.retentionDays * DAY_MS;
export const ROOM_TTL_MS = LIMITS.roomTtlHours * 60 * 60 * 1000;
export const AUDIO_TTL_MS = LIMITS.audioRetentionDays * DAY_MS;

export function randomSecret(length = SECRET_LENGTH) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return codeFromBytes(bytes, length);
}

export function randomHex(bytes) {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** Constant-time compare, so response time does not leak a key. */
export function sameKey(a, b) {
  const x = String(a);
  const y = String(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++)
    diff |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  return diff === 0;
}

export const hashSecret = (salt, secret) => sha256Hex(`${salt}:${secret}`);
export const familyToken = async (salt, studentId, keyHash) =>
  (await sha256Hex(`${salt}:family:${studentId}:${keyHash}`)).slice(0, 20);

export async function liveClass(db, code, now) {
  const row = await db
    .prepare(`SELECT * FROM class_platform_class WHERE code = ?`)
    .bind(code)
    .first();
  return row && Number(row.expires_at) >= now ? row : null;
}

export const touchClass = (db, code, now) =>
  db
    .prepare(`UPDATE class_platform_class SET last_active_at = ?, expires_at = ? WHERE code = ?`)
    .bind(now, now + RETENTION_MS, code);

/** Delete one class and everything that hangs off it. */
export function purgeStatements(db, code) {
  const rooms = `SELECT room_id FROM class_platform_room WHERE code = ?`;
  return [
    db.prepare(`DELETE FROM class_platform_response WHERE room_id IN (${rooms})`).bind(code),
    db.prepare(`DELETE FROM class_platform_room WHERE code = ?`).bind(code),
    db.prepare(`DELETE FROM class_platform_audio WHERE code = ?`).bind(code),
    db.prepare(`DELETE FROM class_platform_doc WHERE code = ?`).bind(code),
    db.prepare(`DELETE FROM class_platform_student WHERE code = ?`).bind(code),
    db.prepare(`DELETE FROM class_platform_class WHERE code = ?`).bind(code),
  ];
}

/** Retention sweep: expired classes, rooms, audio and rate-limit buckets. */
export async function pruneExpired(db, now) {
  const gone = `SELECT code FROM class_platform_class WHERE expires_at < ?`;
  const oldRooms = `SELECT room_id FROM class_platform_room WHERE expires_at < ? OR code IN (${gone})`;
  await db.batch([
    db.prepare(`DELETE FROM class_platform_response WHERE room_id IN (${oldRooms})`).bind(now, now),
    db
      .prepare(`DELETE FROM class_platform_room WHERE expires_at < ? OR code IN (${gone})`)
      .bind(now, now),
    db
      .prepare(`DELETE FROM class_platform_audio WHERE expires_at < ? OR code IN (${gone})`)
      .bind(now, now),
    db.prepare(`DELETE FROM class_platform_doc WHERE code IN (${gone})`).bind(now),
    db.prepare(`DELETE FROM class_platform_student WHERE code IN (${gone})`).bind(now),
    db.prepare(`DELETE FROM class_platform_class WHERE expires_at < ?`).bind(now),
    db.prepare(`DELETE FROM class_platform_guard WHERE expires_at < ?`).bind(now),
  ]);
}

/**
 * Durable failure counter (per-isolate limiters cannot stop a distributed guess
 * of a student key). Returns true when the bucket is already over `max`.
 */
export async function guardOver(db, key, max) {
  const row = await db
    .prepare(`SELECT hits FROM class_platform_guard WHERE bucket_key = ?`)
    .bind(key)
    .first();
  return Number(row?.hits || 0) >= max;
}

export const guardHit = (db, key, now, windowMs) =>
  db
    .prepare(
      `INSERT INTO class_platform_guard (bucket_key, hits, expires_at) VALUES (?, 1, ?)
       ON CONFLICT(bucket_key) DO UPDATE SET hits = hits + 1`,
    )
    .bind(key, now + windowMs)
    .run();

/**
 * @returns {"site" | "class" | null} which credential authorised the caller as
 * this class's teacher, or null.
 */
export async function teacherRole(request, env, cls) {
  const site = request.headers.get("x-teacher-key") || "";
  if (env.TEACHER_KEY && site && sameKey(site, env.TEACHER_KEY)) return "site";
  const pass = (request.headers.get("x-class-teacher") || "").toUpperCase();
  if (cls && pass && sameKey(await hashSecret(cls.salt, pass), cls.teacher_hash)) return "class";
  return null;
}

/** Resolve `x-class-student: <id>.<key>` to the student row, or null. */
export async function studentFromRequest(request, db, cls) {
  const raw = request.headers.get("x-class-student") || "";
  const [studentId, key] = raw.split(".");
  if (!studentId || !key) return null;
  const row = await db
    .prepare(`SELECT * FROM class_platform_student WHERE code = ? AND student_id = ?`)
    .bind(cls.code, studentId)
    .first();
  if (!row) return null;
  return sameKey(await hashSecret(cls.salt, key.toUpperCase()), row.key_hash) ? row : null;
}

export const parseJson = (text, fallback) => {
  try {
    return JSON.parse(text) ?? fallback;
  } catch {
    return fallback;
  }
};
