/* =============================================================================
 * Student-made scenes (Language Page, class only). A learner authors a short
 * Real-Life Scenario (setting, character, situation, what the other person says,
 * 2-3 good replies and 1 not-so-polite reply with a why), optionally with one
 * recorded line of their own voice. It goes to the teacher FIRST: until the
 * teacher approves it, only its author and the teacher can read it. Approved
 * scenes form the class library. Rules: shared/class-platform/social.js.
 *
 * Status: "pending" (waiting for the teacher) -> "approved" | "returned" (with a
 * note; the author edits and resubmits, which makes it "pending" again).
 *
 * Routes (/api/class/scenes/*):
 *   GET  list?code=                                    teacher: every scene; student: own + approved library
 *   POST submit { code, sceneId?, scene, audio?: { mime, data }, dropAudio? }   student
 *   POST review { code, sceneId, action: approve|return, note? }               teacher
 *   POST delete { code, sceneId }                      author or teacher
 *   GET  audio?code=&sceneId=                          author or teacher; classmates once approved
 * ========================================================================== */

import {
  checkText,
  MAX_SCENES_CLASS,
  MAX_SCENES_OPEN,
  SCENE_LIMITS,
  validateScene,
} from "../../../shared/class-platform/social.js";
import { json } from "../http.js";
import { decodeAudio } from "./audio.js";
import {
  AUDIO_TTL_MS,
  guardHit,
  guardOver,
  parseJson,
  randomHex,
  studentFromRequest,
  teacherRole,
} from "./store.js";

const SUBMITS_PER_HOUR = 20;
const HOUR_MS = 60 * 60 * 1000;
const isSceneId = (id) => typeof id === "string" && /^c[a-f0-9]{12}$/.test(id);
const COLS = `c.scene_id, c.student_id, c.status, c.scene_json, c.note, c.audio_size, c.audio_expires_at, c.created_at, c.updated_at, s.alias`;

const sceneRow = (r, now, { withNote }) => ({
  sceneId: r.scene_id,
  studentId: r.student_id,
  alias: r.alias || "",
  status: r.status,
  scene: parseJson(r.scene_json, null),
  hasAudio: Number(r.audio_size) > 0 && Number(r.audio_expires_at) >= now,
  createdAt: Number(r.created_at),
  updatedAt: Number(r.updated_at),
  ...(withNote ? { note: r.note || "" } : {}),
});

export async function handleScenes(ctx, action) {
  const { db, body, url, now, method, fail, request, env } = ctx;
  const codeRaw = method === "GET" ? url.searchParams.get("code") : body?.code;
  const found = await ctx.requireClass(db, codeRaw, now);
  if (found.error) return found.error;
  const { cls } = found;
  if (cls.app !== "language") return fail("invalid-app");
  const teacher = await teacherRole(request, env, cls);
  const student = teacher ? null : await studentFromRequest(request, db, cls);
  if (!teacher && !student) return fail("unauthorized", 401);
  const me = student?.student_id;
  const key = `${method} ${action}`;
  const join = `FROM class_platform_scene c JOIN class_platform_student s ON s.code = c.code AND s.student_id = c.student_id`;

  if (key === "GET list") {
    if (teacher) {
      const res = await db
        .prepare(`SELECT ${COLS} ${join} WHERE c.code = ? ORDER BY c.updated_at DESC`)
        .bind(cls.code)
        .all();
      return {
        ok: true,
        scenes: (res.results || []).map((r) => sceneRow(r, now, { withNote: true })),
      };
    }
    const res = await db
      .prepare(
        `SELECT ${COLS} ${join} WHERE c.code = ? AND (c.student_id = ? OR c.status = 'approved') ORDER BY c.updated_at DESC`,
      )
      .bind(cls.code, me)
      .all();
    const rows = res.results || [];
    return {
      ok: true,
      mine: rows
        .filter((r) => r.student_id === me)
        .map((r) => sceneRow(r, now, { withNote: true })),
      library: rows
        .filter((r) => r.status === "approved")
        .map((r) => sceneRow(r, now, { withNote: false })),
    };
  }

  if (key === "POST submit") {
    if (!student) return fail("students-only", 403);
    const checked = validateScene(body?.scene);
    if (!checked.ok)
      return json({ ok: false, error: checked.error, field: checked.field || null }, 400);
    let audio = null;
    if (body?.audio != null) {
      audio = decodeAudio(body.audio?.mime, body.audio?.data);
      if (!audio.ok) return fail(audio.error, audio.error === "audio-too-large" ? 413 : 400);
    }
    const bucket = `scene:${cls.code}:${me}`;
    if (await guardOver(db, bucket, SUBMITS_PER_HOUR)) return fail("too-many-scenes", 429);
    const sceneJson = JSON.stringify(checked.scene);
    if (body?.sceneId !== undefined) {
      // Resubmit one of my own scenes that is not yet approved (approved scenes are final; delete and redo).
      if (!isSceneId(body.sceneId)) return fail("invalid-scene-id");
      const row = await db
        .prepare(
          `SELECT status FROM class_platform_scene WHERE scene_id = ? AND code = ? AND student_id = ?`,
        )
        .bind(body.sceneId, cls.code, me)
        .first();
      if (!row) return fail("not-found", 404);
      if (row.status === "approved") return fail("already-approved", 409);
      const audioSql = audio
        ? `, audio_mime = ?, audio = ?, audio_size = ?, audio_expires_at = ?`
        : body?.dropAudio === true
          ? `, audio_mime = NULL, audio = NULL, audio_size = 0, audio_expires_at = 0`
          : "";
      const audioArgs = audio
        ? [audio.mime, audio.bytes, audio.bytes.length, now + AUDIO_TTL_MS]
        : [];
      await db
        .prepare(
          `UPDATE class_platform_scene SET status = 'pending', scene_json = ?, note = '', updated_at = ?${audioSql} WHERE scene_id = ?`,
        )
        .bind(sceneJson, now, ...audioArgs, body.sceneId)
        .run();
      await guardHit(db, bucket, now, HOUR_MS);
      return { ok: true, sceneId: body.sceneId, status: "pending" };
    }
    const counts = await db
      .prepare(
        `SELECT COUNT(*) AS total, SUM(CASE WHEN student_id = ? AND status != 'approved' THEN 1 ELSE 0 END) AS open
         FROM class_platform_scene WHERE code = ?`,
      )
      .bind(me, cls.code)
      .first();
    if (Number(counts?.open) >= MAX_SCENES_OPEN) return fail("too-many-scenes", 409);
    if (Number(counts?.total) >= MAX_SCENES_CLASS) return fail("class-scenes-full", 409);
    const sceneId = `c${randomHex(6)}`;
    await db
      .prepare(
        `INSERT INTO class_platform_scene (scene_id, code, student_id, status, scene_json, note, audio_mime, audio, audio_size, audio_expires_at, created_at, updated_at)
         VALUES (?, ?, ?, 'pending', ?, '', ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        sceneId,
        cls.code,
        me,
        sceneJson,
        audio ? audio.mime : null,
        audio ? audio.bytes : null,
        audio ? audio.bytes.length : 0,
        audio ? now + AUDIO_TTL_MS : 0,
        now,
        now,
      )
      .run();
    await guardHit(db, bucket, now, HOUR_MS);
    return { ok: true, sceneId, status: "pending" };
  }

  const sceneId = method === "GET" ? url.searchParams.get("sceneId") : body?.sceneId;
  if (!isSceneId(sceneId)) return fail("invalid-scene-id");
  const row = await db
    .prepare(`SELECT * FROM class_platform_scene WHERE scene_id = ? AND code = ?`)
    .bind(sceneId, cls.code)
    .first();
  const isAuthor = !!row && row.student_id === me;
  // Before approval a scene exists only for its author and the teacher.
  if (!row || (!teacher && !isAuthor && row.status !== "approved")) return fail("not-found", 404);

  if (key === "GET audio") {
    if (!row.audio || Number(row.audio_expires_at) < now) return fail("not-found", 404);
    const bytes = new Uint8Array(row.audio);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": row.audio_mime,
        "Cache-Control": "private, no-store",
        "Content-Length": String(bytes.length),
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  if (key === "POST review") {
    if (!teacher) return fail("unauthorized", 401);
    if (body?.action === "approve") {
      await db
        .prepare(
          `UPDATE class_platform_scene SET status = 'approved', note = '', updated_at = ? WHERE scene_id = ?`,
        )
        .bind(now, sceneId)
        .run();
      return { ok: true, status: "approved" };
    }
    if (body?.action === "return") {
      const note = checkText(body?.note, SCENE_LIMITS.note, { required: false });
      if (!note.ok) return fail(note.error);
      await db
        .prepare(
          `UPDATE class_platform_scene SET status = 'returned', note = ?, updated_at = ? WHERE scene_id = ?`,
        )
        .bind(note.text, now, sceneId)
        .run();
      return { ok: true, status: "returned" };
    }
    return fail("invalid-action");
  }
  if (key === "POST delete") {
    if (!teacher && !isAuthor) return fail("not-found", 404);
    await db.prepare(`DELETE FROM class_platform_scene WHERE scene_id = ?`).bind(sceneId).run();
    return { ok: true };
  }
  return fail("not-found", 404);
}
