/* =============================================================================
 * Peer listening pairs (Language Page, class only). The teacher turns pairs on
 * and sets groups of 2-3 (auto or picked). A learner shares a short take with
 * their partner ONLY; the partner answers the take's one listener question and
 * taps one reaction from a fixed list (no free-text comments). The speaker sees
 * the answer and marks whether the message landed. The teacher sees and can
 * remove any take. Storage follows audio.js: D1 BLOBs under LIMITS.maxAudioBytes.
 * Takes expire after PEER_TAKE_DAYS, enforced on every read and on cleanup.
 *
 * Group membership is re-read on EVERY call: after a re-pair, an old partner
 * can no longer list, play or answer a take.
 *
 * Routes (/api/class/pairs/*):
 *   GET  state?code=                                   teacher: config, roster, all takes; student: partners, takes, inbox
 *   POST config { code, enabled?, groups? | auto? }    teacher
 *   POST take   { code, taskId, taskTitle, questionId, seconds, mime, data }   student (paired)
 *   GET  file?code=&takeId=                            speaker, current partner, or teacher
 *   POST reply  { code, takeId, answer, reaction }     current partner, once per take (resend replaces)
 *   POST landed { code, takeId, listenerId, landed }   speaker
 *   POST delete { code, takeId }                       speaker or teacher
 * ========================================================================== */

import {
  autoPair,
  MAX_LIVE_TAKES,
  PEER_TAKE_DAYS,
  partnersOf,
  validateGroups,
  validateReply,
  validateTakeMeta,
} from "../../../shared/class-platform/social.js";
import { decodeAudio } from "./audio.js";
import {
  guardHit,
  guardOver,
  parseJson,
  randomHex,
  studentFromRequest,
  teacherRole,
} from "./store.js";

export const TAKE_TTL_MS = PEER_TAKE_DAYS * 24 * 60 * 60 * 1000;
const TAKES_PER_HOUR = 20;
const REPLIES_PER_HOUR = 60;
const HOUR_MS = 60 * 60 * 1000;
const isTakeId = (id) => typeof id === "string" && /^p[a-f0-9]{12}$/.test(id);
const isStudentId = (id) => typeof id === "string" && /^s[a-f0-9]{10}$/.test(id);

async function loadPairing(db, code) {
  const row = await db
    .prepare(`SELECT enabled, groups_json FROM class_platform_pairing WHERE code = ?`)
    .bind(code)
    .first();
  const groups = parseJson(row?.groups_json, []);
  return { enabled: row?.enabled === 1, groups: Array.isArray(groups) ? groups : [] };
}

async function rosterOf(db, code) {
  const res = await db
    .prepare(`SELECT student_id, alias FROM class_platform_student WHERE code = ? ORDER BY alias`)
    .bind(code)
    .all();
  return res.results || [];
}

const takeRow = (r) => ({
  takeId: r.take_id,
  studentId: r.student_id,
  taskId: r.task_id,
  taskTitle: r.task_title,
  questionId: r.question_id,
  seconds: Number(r.seconds),
  size: Number(r.size),
  createdAt: Number(r.created_at),
  expiresAt: Number(r.expires_at),
});
const replyRow = (r) => ({
  studentId: r.student_id,
  answer: r.answer,
  reaction: r.reaction,
  landed: r.landed == null ? null : r.landed === 1,
  createdAt: Number(r.created_at),
});

const TAKE_COLS = `take_id, student_id, task_id, task_title, question_id, seconds, size, created_at, expires_at`;

async function repliesFor(db, takeIds) {
  if (!takeIds.length) return new Map();
  const res = await db
    .prepare(
      `SELECT take_id, student_id, answer, reaction, landed, created_at FROM class_platform_take_reply
       WHERE take_id IN (${takeIds.map(() => "?").join(",")})`,
    )
    .bind(...takeIds)
    .all();
  const map = new Map();
  for (const r of res.results || []) {
    if (!map.has(r.take_id)) map.set(r.take_id, []);
    map.get(r.take_id).push(replyRow(r));
  }
  return map;
}

export async function handlePairs(ctx, action) {
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
  const pairing = await loadPairing(db, cls.code);
  const me = student?.student_id;
  const partners = me && pairing.enabled ? partnersOf(pairing.groups, me) : [];

  if (key === "GET state") {
    const roster = await rosterOf(db, cls.code);
    const aliasOf = new Map(roster.map((s) => [s.student_id, s.alias]));
    if (teacher) {
      const takes = (
        (
          await db
            .prepare(
              `SELECT ${TAKE_COLS} FROM class_platform_take WHERE code = ? AND expires_at >= ? ORDER BY created_at DESC`,
            )
            .bind(cls.code, now)
            .all()
        ).results || []
      ).map(takeRow);
      const replies = await repliesFor(
        db,
        takes.map((t) => t.takeId),
      );
      return {
        ok: true,
        enabled: pairing.enabled,
        groups: pairing.groups,
        students: roster.map((s) => ({ studentId: s.student_id, alias: s.alias })),
        takes: takes.map((t) => ({
          ...t,
          alias: aliasOf.get(t.studentId) || "",
          replies: replies.get(t.takeId) || [],
        })),
        retentionDays: PEER_TAKE_DAYS,
      };
    }
    const ids = [me, ...partners];
    const takes = (
      (
        await db
          .prepare(
            `SELECT ${TAKE_COLS} FROM class_platform_take WHERE code = ? AND expires_at >= ?
           AND student_id IN (${ids.map(() => "?").join(",")}) ORDER BY created_at DESC`,
          )
          .bind(cls.code, now, ...ids)
          .all()
      ).results || []
    ).map(takeRow);
    const replies = await repliesFor(
      db,
      takes.map((t) => t.takeId),
    );
    const mine = takes.filter((t) => t.studentId === me);
    const inbox = takes.filter((t) => t.studentId !== me);
    return {
      ok: true,
      enabled: pairing.enabled,
      partners: partners.map((id) => ({ studentId: id, alias: aliasOf.get(id) || "" })),
      takes: mine.map((t) => ({
        ...t,
        replies: (replies.get(t.takeId) || []).map((r) => ({
          ...r,
          alias: aliasOf.get(r.studentId) || "",
        })),
      })),
      // A listener sees only their own reply on a partner's take, never another listener's.
      inbox: inbox.map((t) => ({
        ...t,
        alias: aliasOf.get(t.studentId) || "",
        myReply: (replies.get(t.takeId) || []).find((r) => r.studentId === me) || null,
      })),
      retentionDays: PEER_TAKE_DAYS,
    };
  }

  if (key === "POST config") {
    if (!teacher) return fail("unauthorized", 401);
    let { enabled, groups } = pairing;
    if (body?.enabled !== undefined) {
      if (typeof body.enabled !== "boolean") return fail("invalid-enabled");
      enabled = body.enabled;
    }
    if (body?.auto === true || body?.groups !== undefined) {
      const ids = (await rosterOf(db, cls.code)).map((s) => s.student_id);
      if (body.auto === true) groups = autoPair(ids);
      else {
        const checked = validateGroups(body.groups, ids);
        if (!checked.ok) return fail(checked.error);
        groups = checked.groups;
      }
    }
    await db
      .prepare(
        `INSERT INTO class_platform_pairing (code, enabled, groups_json, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(code) DO UPDATE SET enabled = excluded.enabled, groups_json = excluded.groups_json, updated_at = excluded.updated_at`,
      )
      .bind(cls.code, enabled ? 1 : 0, JSON.stringify(groups), now)
      .run();
    return { ok: true, enabled, groups };
  }

  if (key === "POST take") {
    if (!student) return fail("students-only", 403);
    if (!pairing.enabled) return fail("pairs-off", 409);
    if (!partners.length) return fail("no-partner", 409);
    const meta = validateTakeMeta(body);
    if (!meta.ok) return fail(meta.error);
    const audio = decodeAudio(body?.mime, body?.data);
    if (!audio.ok) return fail(audio.error, audio.error === "audio-too-large" ? 413 : 400);
    const bucket = `take:${cls.code}:${me}`;
    if (await guardOver(db, bucket, TAKES_PER_HOUR)) return fail("too-many-takes", 429);
    await db
      .prepare(
        `DELETE FROM class_platform_take WHERE code = ? AND student_id = ? AND expires_at < ?`,
      )
      .bind(cls.code, me, now)
      .run();
    const n = await db
      .prepare(`SELECT COUNT(*) AS n FROM class_platform_take WHERE code = ? AND student_id = ?`)
      .bind(cls.code, me)
      .first();
    if (Number(n?.n) >= MAX_LIVE_TAKES) return fail("too-many-takes", 409);
    const takeId = `p${randomHex(6)}`;
    await db.batch([
      db
        .prepare(
          `INSERT INTO class_platform_take (take_id, code, student_id, task_id, task_title, question_id, seconds, mime, bytes, size, created_at, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          takeId,
          cls.code,
          me,
          meta.taskId,
          meta.taskTitle,
          meta.questionId,
          meta.seconds,
          audio.mime,
          audio.bytes,
          audio.bytes.length,
          now,
          now + TAKE_TTL_MS,
        ),
    ]);
    await guardHit(db, bucket, now, HOUR_MS);
    return { ok: true, takeId, expiresAt: now + TAKE_TTL_MS };
  }

  const takeId = method === "GET" ? url.searchParams.get("takeId") : body?.takeId;
  if (!isTakeId(takeId)) return fail("invalid-take-id");
  const take = await db
    .prepare(`SELECT * FROM class_platform_take WHERE take_id = ? AND code = ? AND expires_at >= ?`)
    .bind(takeId, cls.code, now)
    .first();
  const isOwner = !!take && take.student_id === me;
  const isPartner = !!take && partners.includes(take.student_id);
  // A take that is not yours, not your current partner's, and you are not the teacher: it does not exist for you.
  if (!take || (!teacher && !isOwner && !isPartner)) return fail("not-found", 404);

  if (key === "GET file") {
    const bytes = new Uint8Array(take.bytes);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": take.mime,
        "Cache-Control": "private, no-store",
        "Content-Length": String(bytes.length),
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  if (key === "POST reply") {
    if (!isPartner) return fail("partners-only", 403);
    const reply = validateReply(body);
    if (!reply.ok) return fail(reply.error);
    const bucket = `reply:${cls.code}:${me}`;
    if (await guardOver(db, bucket, REPLIES_PER_HOUR)) return fail("too-many-replies", 429);
    await db
      .prepare(
        `INSERT INTO class_platform_take_reply (take_id, student_id, answer, reaction, landed, created_at) VALUES (?, ?, ?, ?, NULL, ?)
         ON CONFLICT(take_id, student_id) DO UPDATE SET answer = excluded.answer, reaction = excluded.reaction, landed = NULL, created_at = excluded.created_at`,
      )
      .bind(takeId, me, reply.answer, reply.reaction, now)
      .run();
    await guardHit(db, bucket, now, HOUR_MS);
    return { ok: true };
  }
  if (key === "POST landed") {
    if (!isOwner) return fail("speaker-only", 403);
    if (!isStudentId(body?.listenerId) || typeof body?.landed !== "boolean")
      return fail("invalid-landed");
    const res = await db
      .prepare(
        `UPDATE class_platform_take_reply SET landed = ? WHERE take_id = ? AND student_id = ?`,
      )
      .bind(body.landed ? 1 : 0, takeId, body.listenerId)
      .run();
    return res.meta?.changes ? { ok: true } : fail("not-found", 404);
  }
  if (key === "POST delete") {
    if (!teacher && !isOwner) return fail("not-found", 404);
    await db.batch([
      db.prepare(`DELETE FROM class_platform_take_reply WHERE take_id = ?`).bind(takeId),
      db.prepare(`DELETE FROM class_platform_take WHERE take_id = ?`).bind(takeId),
    ]);
    return { ok: true };
  }
  return fail("not-found", 404);
}
