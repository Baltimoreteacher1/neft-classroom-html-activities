/* =============================================================================
 * The class scoring queue (Language Page teacher tools). One queue of the
 * class's shared recordings (class_platform_audio, kind "recording") and shared
 * writing samples (class_platform_work), each with the teacher's review:
 * descriptor chips from the lab's own 4-point PRACTICE rubrics
 * (access-practice-lab/content/rubrics/*.json; original wording, never WIDA's)
 * plus a short comment. A review is practice feedback, never a level or score.
 *
 * Routes (/api/class/review/*):
 *   POST share  { code, label, text }                         student -> { workId }
 *   GET  queue?code=                                          teacher -> { items }
 *   POST mark   { code, itemId, rubric, chips, comment }      teacher -> { review }
 *   GET  mine?code=                                           student -> { reviews }
 * ========================================================================== */

import { cleanText } from "../../../shared/class-platform/contract.js";
import { AUDIO_TTL_MS, parseJson, randomHex, studentFromRequest, teacherRole } from "./store.js";

/**
 * Dimension ids of each practice rubric. tools/access-teacher-tools.test.mjs fails if these drift from
 * content/rubrics/*.json, so the server can validate chips strictly without reading the content tree.
 */
export const RUBRIC_DIMS = Object.freeze({
  "speaking-practice": [
    "task",
    "organization",
    "vocabulary",
    "sentences",
    "elaboration",
    "clarity",
    "academic",
  ],
  "writing-practice": [
    "task",
    "organization",
    "development",
    "vocabulary",
    "structures",
    "cohesion",
    "evidence",
    "clarity",
  ],
});
export const RATING_COUNT = 4;
export const MAX_COMMENT = 280;
export const MAX_WRITING = 4000;
const MAX_WORK_PER_STUDENT = 20;
const isAudioId = (id) => typeof id === "string" && /^a[a-f0-9]{12}$/.test(id);
const isWorkId = (id) => typeof id === "string" && /^w[a-f0-9]{12}$/.test(id);

/** Writing keeps its line breaks; control characters go, and the text is capped. */
export function cleanWriting(raw) {
  const text = String(raw ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!text || !/\p{L}/u.test(text)) return { ok: false, error: "empty-writing" };
  if (text.length > MAX_WRITING) return { ok: false, error: "writing-too-long" };
  return { ok: true, text };
}

/** @returns {{ ok: true, review: object } | { ok: false, error: string }} */
export function validateReview(body) {
  const dims = Object.hasOwn(RUBRIC_DIMS, body?.rubric) ? RUBRIC_DIMS[body.rubric] : null;
  if (!dims) return { ok: false, error: "invalid-rubric" };
  const chips = body.chips ?? {};
  if (!chips || typeof chips !== "object" || Array.isArray(chips))
    return { ok: false, error: "invalid-chips" };
  const out = {};
  for (const [dim, rating] of Object.entries(chips)) {
    if (!dims.includes(dim) || !Number.isInteger(rating) || rating < 0 || rating >= RATING_COUNT)
      return { ok: false, error: "invalid-chips" };
    out[dim] = rating;
  }
  if (typeof body.comment !== "undefined" && typeof body.comment !== "string")
    return { ok: false, error: "invalid-comment" };
  const comment = cleanText(body.comment, MAX_COMMENT + 1);
  if (comment.length > MAX_COMMENT) return { ok: false, error: "comment-too-long" };
  if (!Object.keys(out).length && !comment) return { ok: false, error: "empty-review" };
  return { ok: true, review: { rubric: body.rubric, chips: out, comment } };
}

const reviewOf = (r) =>
  r?.reviewed_at
    ? {
        rubric: r.rubric,
        chips: parseJson(r.chips_json, {}),
        comment: r.comment,
        reviewedAt: Number(r.reviewed_at),
      }
    : null;

async function classItems(db, code, now, studentId = null) {
  const own = studentId ? " AND a.student_id = ?" : "";
  const ownW = studentId ? " AND w.student_id = ?" : "";
  const extra = studentId ? [studentId] : [];
  const rev = `r.rubric, r.chips_json, r.comment, r.reviewed_at`;
  const audio = await db
    .prepare(
      `SELECT a.audio_id AS item_id, a.student_id, a.label, a.mime, a.created_at, s.alias, ${rev}
       FROM class_platform_audio a JOIN class_platform_student s ON s.code = a.code AND s.student_id = a.student_id
       LEFT JOIN class_platform_review r ON r.code = a.code AND r.item_id = a.audio_id
       WHERE a.code = ? AND a.kind = 'recording' AND a.expires_at >= ?${own}`,
    )
    .bind(code, now, ...extra)
    .all();
  const work = await db
    .prepare(
      `SELECT w.work_id AS item_id, w.student_id, w.label, w.body, w.created_at, s.alias, ${rev}
       FROM class_platform_work w JOIN class_platform_student s ON s.code = w.code AND s.student_id = w.student_id
       LEFT JOIN class_platform_review r ON r.code = w.code AND r.item_id = w.work_id
       WHERE w.code = ? AND w.expires_at >= ?${ownW}`,
    )
    .bind(code, now, ...extra)
    .all();
  const items = [
    ...(audio.results || []).map((r) => ({ kind: "recording", mime: r.mime, ...common(r) })),
    ...(work.results || []).map((r) => ({ kind: "writing", text: r.body, ...common(r) })),
  ];
  // Awaiting feedback first (oldest first, so nobody waits longest), then reviewed work newest first.
  return items.sort((a, b) =>
    !a.review !== !b.review
      ? a.review
        ? 1
        : -1
      : a.review
        ? b.review.reviewedAt - a.review.reviewedAt
        : a.createdAt - b.createdAt,
  );
}
const common = (r) => ({
  itemId: r.item_id,
  studentId: r.student_id,
  alias: r.alias,
  label: r.label,
  createdAt: Number(r.created_at),
  review: reviewOf(r),
});

export async function handleReview(ctx, action) {
  const { db, body, url, now, method, fail, request, env } = ctx;
  const found = await ctx.requireClass(
    db,
    method === "GET" ? url.searchParams.get("code") : body?.code,
    now,
  );
  if (found.error) return found.error;
  const { cls } = found;
  if (cls.app !== "language") return fail("invalid-app");
  const teacher = await teacherRole(request, env, cls);
  const student = teacher ? null : await studentFromRequest(request, db, cls);
  if (!teacher && !student) return fail("unauthorized", 401);
  const key = `${method} ${action}`;

  if (key === "POST share") {
    if (!student) return fail("students-only", 403);
    const writing = cleanWriting(body?.text);
    if (!writing.ok) return fail(writing.error, writing.error === "writing-too-long" ? 413 : 400);
    const n = await db
      .prepare(`SELECT COUNT(*) AS n FROM class_platform_work WHERE code = ? AND student_id = ?`)
      .bind(cls.code, student.student_id)
      .first();
    if (Number(n?.n) >= MAX_WORK_PER_STUDENT) return fail("too-many-samples", 409);
    const workId = `w${randomHex(6)}`;
    await db
      .prepare(
        `INSERT INTO class_platform_work (work_id, code, student_id, kind, label, body, created_at, expires_at)
         VALUES (?, ?, ?, 'writing', ?, ?, ?, ?)`,
      )
      .bind(
        workId,
        cls.code,
        student.student_id,
        cleanText(body?.label, 80),
        writing.text,
        now,
        now + AUDIO_TTL_MS,
      )
      .run();
    return { ok: true, workId };
  }

  if (key === "GET queue") {
    if (!teacher) return fail("unauthorized", 401);
    return { ok: true, items: await classItems(db, cls.code, now) };
  }

  if (key === "GET mine") {
    if (!student) return fail("students-only", 403);
    const items = await classItems(db, cls.code, now, student.student_id);
    return {
      ok: true,
      reviews: items
        .filter((i) => i.review)
        .map(({ itemId, kind, label, createdAt, review }) => ({
          itemId,
          kind,
          label,
          createdAt,
          ...review,
        })),
    };
  }

  if (key === "POST mark") {
    if (!teacher) return fail("unauthorized", 401);
    const itemId = body?.itemId;
    if (!isAudioId(itemId) && !isWorkId(itemId)) return fail("invalid-item");
    const checked = validateReview(body);
    if (!checked.ok) return fail(checked.error);
    const item = isAudioId(itemId)
      ? await db
          .prepare(
            `SELECT student_id FROM class_platform_audio WHERE audio_id = ? AND code = ? AND kind = 'recording' AND expires_at >= ?`,
          )
          .bind(itemId, cls.code, now)
          .first()
      : await db
          .prepare(
            `SELECT student_id FROM class_platform_work WHERE work_id = ? AND code = ? AND expires_at >= ?`,
          )
          .bind(itemId, cls.code, now)
          .first();
    if (!item) return fail("not-found", 404);
    const { rubric, chips, comment } = checked.review;
    await db
      .prepare(
        `INSERT INTO class_platform_review (code, item_id, student_id, rubric, chips_json, comment, reviewed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(code, item_id) DO UPDATE SET rubric = excluded.rubric, chips_json = excluded.chips_json,
           comment = excluded.comment, reviewed_at = excluded.reviewed_at`,
      )
      .bind(cls.code, itemId, item.student_id, rubric, JSON.stringify(chips), comment, now)
      .run();
    return { ok: true, review: { rubric, chips, comment, reviewedAt: now } };
  }

  return fail("not-found", 404);
}
