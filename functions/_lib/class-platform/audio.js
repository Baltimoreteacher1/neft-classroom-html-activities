/* =============================================================================
 * Shared recordings and teacher voice notes (Language Page #23), stored as D1
 * BLOBs: R2 is not enabled on this account, and a 700 KB cap keeps every row
 * well under D1's 2 MB row limit. Recordings expire after
 * LIMITS.audioRetentionDays and go with their class.
 *
 * A student SHARES one of their own practice recordings (it stays on the device
 * otherwise); the teacher listens and records a voice NOTE that answers it.
 *
 * Routes (/api/class/audio/*):
 *   POST share  { code, label, mime, data(base64) }      student -> { audioId }
 *   POST note   { code, parentId, label?, mime, data }   teacher -> { audioId }
 *   GET  list?code=                                       student: own + notes; teacher: all
 *   GET  file?code=&audioId=                              the bytes (owner or teacher)
 *   POST heard  { code, audioId }                         student marks a note heard
 *   POST delete { code, audioId }                         owner or teacher
 * ========================================================================== */

import { cleanText, LIMITS } from "../../../shared/class-platform/contract.js";
import { AUDIO_TTL_MS, randomHex, studentFromRequest, teacherRole } from "./store.js";

const MIME_RE = /^audio\/(webm|ogg|mp4|mpeg|wav|x-wav|aac)(;\s*codecs=[\w.,"' -]{1,40})?$/i;
const MAX_PER_STUDENT = 20;
const isAudioId = (id) => typeof id === "string" && /^a[a-f0-9]{12}$/.test(id);

export function decodeAudio(mime, data) {
  if (typeof mime !== "string" || !MIME_RE.test(mime)) return { ok: false, error: "invalid-mime" };
  if (typeof data !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(data))
    return { ok: false, error: "invalid-audio" };
  if (Math.floor((data.length * 3) / 4) > LIMITS.maxAudioBytes)
    return { ok: false, error: "audio-too-large" };
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  if (bytes.length < 64) return { ok: false, error: "invalid-audio" };
  return { ok: true, bytes, mime: mime.toLowerCase() };
}

const row = (r) => ({
  audioId: r.audio_id,
  studentId: r.student_id,
  kind: r.kind,
  parentId: r.parent_id || null,
  label: r.label,
  mime: r.mime,
  size: Number(r.size),
  heard: r.heard === 1,
  createdAt: Number(r.created_at),
  ...(r.alias ? { alias: r.alias } : {}),
});

export async function handleAudio(ctx, action) {
  const { db, body, url, now, method, fail, request, env } = ctx;
  const codeRaw = method === "GET" ? url.searchParams.get("code") : body?.code;
  const found = await ctx.requireClass(db, codeRaw, now);
  if (found.error) return found.error;
  const { cls } = found;
  if (cls.app !== "language") return fail("invalid-app");
  const teacher = await teacherRole(request, env, cls);
  const student = teacher ? null : await studentFromRequest(request, db, cls);
  if (!teacher && !student) return fail("unauthorized", 401);
  const key = `${method} ${action}`;

  const insert = (audioId, studentId, kind, parentId, label, audio) =>
    db
      .prepare(
        `INSERT INTO class_platform_audio (audio_id, code, student_id, kind, parent_id, label, mime, bytes, size, heard, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      )
      .bind(
        audioId,
        cls.code,
        studentId,
        kind,
        parentId,
        label,
        audio.mime,
        audio.bytes,
        audio.bytes.length,
        now,
        now + AUDIO_TTL_MS,
      );

  if (key === "POST share") {
    if (!student) return fail("students-only", 403);
    const audio = decodeAudio(body?.mime, body?.data);
    if (!audio.ok) return fail(audio.error, audio.error === "audio-too-large" ? 413 : 400);
    const n = await db
      .prepare(
        `SELECT COUNT(*) AS n FROM class_platform_audio WHERE code = ? AND student_id = ? AND kind = 'recording'`,
      )
      .bind(cls.code, student.student_id)
      .first();
    if (Number(n?.n) >= MAX_PER_STUDENT) return fail("too-many-recordings", 409);
    const audioId = `a${randomHex(6)}`;
    await insert(
      audioId,
      student.student_id,
      "recording",
      null,
      cleanText(body.label, 80),
      audio,
    ).run();
    return { ok: true, audioId };
  }

  if (key === "POST note") {
    if (!teacher) return fail("unauthorized", 401);
    if (!isAudioId(body?.parentId)) return fail("invalid-parent");
    const parent = await db
      .prepare(
        `SELECT student_id FROM class_platform_audio WHERE audio_id = ? AND code = ? AND kind = 'recording'`,
      )
      .bind(body.parentId, cls.code)
      .first();
    if (!parent) return fail("not-found", 404);
    const audio = decodeAudio(body?.mime, body?.data);
    if (!audio.ok) return fail(audio.error, audio.error === "audio-too-large" ? 413 : 400);
    const audioId = `a${randomHex(6)}`;
    await insert(
      audioId,
      parent.student_id,
      "note",
      body.parentId,
      cleanText(body.label, 80),
      audio,
    ).run();
    return { ok: true, audioId };
  }

  if (key === "GET list") {
    const cols = `a.audio_id, a.student_id, a.kind, a.parent_id, a.label, a.mime, a.size, a.heard, a.created_at, s.alias`;
    const res = teacher
      ? await db
          .prepare(
            `SELECT ${cols} FROM class_platform_audio a JOIN class_platform_student s ON s.code = a.code AND s.student_id = a.student_id
             WHERE a.code = ? AND a.expires_at >= ? ORDER BY a.created_at DESC`,
          )
          .bind(cls.code, now)
          .all()
      : await db
          .prepare(
            `SELECT ${cols} FROM class_platform_audio a JOIN class_platform_student s ON s.code = a.code AND s.student_id = a.student_id
             WHERE a.code = ? AND a.student_id = ? AND a.expires_at >= ? ORDER BY a.created_at DESC`,
          )
          .bind(cls.code, student.student_id, now)
          .all();
    return { ok: true, items: (res.results || []).map(row) };
  }

  const audioId = method === "GET" ? url.searchParams.get("audioId") : body?.audioId;
  if (!isAudioId(audioId)) return fail("invalid-audio-id");
  const item = await db
    .prepare(
      `SELECT * FROM class_platform_audio WHERE audio_id = ? AND code = ? AND expires_at >= ?`,
    )
    .bind(audioId, cls.code, now)
    .first();
  if (!item || (!teacher && item.student_id !== student.student_id)) return fail("not-found", 404);

  if (key === "GET file") {
    const bytes =
      item.bytes instanceof ArrayBuffer ? new Uint8Array(item.bytes) : new Uint8Array(item.bytes);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": item.mime,
        "Cache-Control": "private, no-store",
        "Content-Length": String(bytes.length),
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  if (key === "POST heard") {
    if (!student || item.kind !== "note") return fail("invalid-audio-id");
    await db
      .prepare(`UPDATE class_platform_audio SET heard = 1 WHERE audio_id = ?`)
      .bind(audioId)
      .run();
    return { ok: true };
  }
  if (key === "POST delete") {
    await db
      .prepare(`DELETE FROM class_platform_audio WHERE audio_id = ? OR parent_id = ?`)
      .bind(audioId, audioId)
      .run();
    return { ok: true };
  }
  return fail("not-found", 404);
}
