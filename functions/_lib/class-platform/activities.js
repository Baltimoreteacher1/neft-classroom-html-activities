/* =============================================================================
 * Activity Studio storage (access-practice-lab/STUDIO.md "Server contract"). A teacher builds an activity in the
 * studio; with a class (code + teacher passcode) it is stored here, can be published at an unguessable student
 * link (/do/<id>), and collects anonymous per-question evidence.
 *
 * Rules:
 *   - Everything stored goes through the studio's own normalizeActivity (never raw input). Publishing re-validates
 *     with validateActivity and refuses on errors. Ids are `s` + 10 lowercase hex, created here, never trusted.
 *   - Saving is optimistic: body.baseRev must equal the stored rev (409 `conflict` otherwise). The rev, the state
 *     and the ownership come from the database, never from the client. A draft edit never changes what students
 *     see: publish stores a separate student copy (studentCopyFor). A worksheet copy carries no answers at all.
 *   - Student responses are anonymous totals per question (no text, names or ids). The session id only feeds a
 *     one-hour rate-limit bucket, hashed.
 *   - Deleting or expiring a class deletes its activities, revisions and counters (store.js purge/prune).
 *
 * Routes (/api/class/activity/*):
 *   GET  play?id=                      anyone  -> { id, title, kind, updatedAt, publishedRev, activity } (published + class live)
 *   POST response { id, session, answers:[{ q, first, final, hints, revised, wrongChoice? }] }  anyone, anonymous
 *   GET  list?code=                    teacher -> { activities: [meta] }
 *   GET  get?code=&id=                 teacher -> { ...meta, activity }
 *   POST save { code, activity, baseRev }       teacher -> meta (409 conflict | 403 not-yours)
 *   POST duplicate | delete | publish | unpublish { code, id }       teacher
 *   GET  revisions?code=&id=           teacher -> { revisions: [{ rev, savedAt, title }] }
 *   POST restore { code, id, rev, baseRev? }    teacher -> new revision from an old one
 *   GET  evidence?code=&id=            teacher -> aggregates per question + plain-language suggestions
 * ========================================================================== */

import {
  LIMITS,
  normalizeActivity,
  questionsOf,
  sizeOf,
} from "../../../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../../../access-practice-lab/src/studio/core/validate.js";
import { clientIp, json } from "../http.js";
import { studentCopyFor } from "../../../access-practice-lab/src/studio/core/student-copy.js";
import { choicesOf, evidence, MIN_EVIDENCE } from "./activity-evidence.js";
import { guardHit, guardOver, parseJson, randomHex, sha256Hex } from "./store.js";

export const ACTIVITY_LIMITS = Object.freeze({
  maxBytes: LIMITS.totalBytes,
  maxPerClass: 200,
  maxRevisions: 10,
  savesPerHour: 600,
  publishesPerHour: 60,
  responsesPerIpHour: 1500,
  responsesPerSessionHour: 6,
  maxAnswers: 80,
  maxHints: 20,
  maxWrongChoices: 12,
  minEvidence: MIN_EVIDENCE,
});
export const ACTIVITY_ID_RE = /^s[0-9a-f]{10}$/;
export { studentCopyFor };
export const activityPath = (id) => `/do/${id}`;

const HOUR_MS = 60 * 60 * 1000;
const STATUSES = new Set(["correct", "incorrect", "partial", "review", "empty"]);
const CHOICE_ID = /^[a-z][a-z0-9_-]{0,31}$/i;
const SESSION_ID = /^[A-Za-z0-9_-]{8,40}$/;

/** True when the bucket is over `max`; an expired bucket is cleared first (guard rows are only pruned lazily). */
export async function bucketOver(db, key, max, now) {
  await db
    .prepare(`DELETE FROM class_platform_guard WHERE bucket_key = ? AND expires_at < ?`)
    .bind(key, now)
    .run();
  return guardOver(db, key, max);
}
export const bucketHit = (db, key, now) => guardHit(db, key, now, HOUR_MS);

/* ── rows ──────────────────────────────────────────────────────────────────── */

const META_COLUMNS = `activity_id, title, kind, grade, subject, unit_id, rev, state, published_rev, created_at, updated_at, published_at`;

const meta = (r) => ({
  id: r.activity_id,
  title: r.title,
  kind: r.kind,
  grade: r.grade,
  subject: r.subject,
  unitId: r.unit_id,
  rev: Number(r.rev),
  state: r.state,
  publishedRev: Number(r.published_rev),
  // "Updated" = the draft is ahead of what students see.
  updated: Number(r.published_rev) > 0 && Number(r.rev) > Number(r.published_rev),
  createdAt: Number(r.created_at),
  updatedAt: Number(r.updated_at),
  publishedAt: r.published_at == null ? null : Number(r.published_at),
  ...(r.state === "published" ? { path: activityPath(r.activity_id) } : {}),
});

const findOwn = (db, code, id) =>
  db
    .prepare(`SELECT * FROM class_platform_activity WHERE code = ? AND activity_id = ?`)
    .bind(code, id)
    .first();

const activityFields = (a) => [
  a.title,
  a.kind,
  a.context.grade,
  a.context.subject,
  a.context.unitId,
];

/** The activity as it will be stored: normalized, with the server's id, rev and times. */
function draftOf(input, { id, rev, createdAt, now }) {
  const a = normalizeActivity(input);
  Object.assign(a, { id, rev, createdAt, updatedAt: now });
  return a;
}

/** Record a revision and keep the last ten. */
const revisionStatements = (db, code, id, rev, now, raw) => [
  db
    .prepare(
      `INSERT OR REPLACE INTO class_platform_activity_rev (code, activity_id, rev, saved_at, json) VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(code, id, rev, now, raw),
  db
    .prepare(
      `DELETE FROM class_platform_activity_rev WHERE code = ? AND activity_id = ? AND rev <= ?`,
    )
    .bind(code, id, rev - ACTIVITY_LIMITS.maxRevisions),
];

const conflict = (row) =>
  json(
    {
      ok: false,
      error: "conflict",
      current: { rev: Number(row.rev), updatedAt: Number(row.updated_at), title: row.title },
    },
    409,
  );

/** Write a new draft revision when the stored rev is still `fromRev`; the rev check makes concurrent saves safe. */
async function writeDraft(db, row, a, now) {
  const raw = JSON.stringify(a);
  const res = await db
    .prepare(
      `UPDATE class_platform_activity SET title = ?, kind = ?, grade = ?, subject = ?, unit_id = ?,
         draft_json = ?, rev = ?, updated_at = ? WHERE code = ? AND activity_id = ? AND rev = ?`,
    )
    .bind(...activityFields(a), raw, a.rev, now, row.code, row.activity_id, a.rev - 1)
    .run();
  if (!res.meta?.changes) return false;
  await db.batch(revisionStatements(db, row.code, row.activity_id, a.rev, now, raw));
  return true;
}

async function insertDraft(db, code, a, now) {
  const raw = JSON.stringify(a);
  await db.batch([
    db
      .prepare(
        `INSERT INTO class_platform_activity (code, activity_id, title, kind, grade, subject, unit_id, draft_json, rev, state, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
      )
      .bind(code, a.id, ...activityFields(a), raw, a.rev, now, now),
    ...revisionStatements(db, code, a.id, a.rev, now, raw),
  ]);
}

async function countOwned(db, code) {
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM class_platform_activity WHERE code = ?`)
    .bind(code)
    .first();
  return Number(row?.n || 0);
}

const metaOf = async (db, code, id) =>
  meta(
    await db
      .prepare(
        `SELECT ${META_COLUMNS} FROM class_platform_activity WHERE code = ? AND activity_id = ?`,
      )
      .bind(code, id)
      .first(),
  );

/* ── teacher routes ────────────────────────────────────────────────────────── */

async function save({ db, body, now, fail }, code) {
  const input = body?.activity;
  if (!input || typeof input !== "object" || Array.isArray(input)) return fail("invalid-activity");
  let size = 0;
  try {
    size = JSON.stringify(input).length;
  } catch {
    return fail("invalid-activity");
  }
  if (size > ACTIVITY_LIMITS.maxBytes) return fail("activity-too-large", 413);
  const baseRev = body.baseRev === undefined ? 0 : body.baseRev;
  if (!Number.isInteger(baseRev) || baseRev < 0) return fail("invalid-base-rev");
  if (await bucketOver(db, `as:${code}`, ACTIVITY_LIMITS.savesPerHour, now))
    return fail("too-many-saves", 429);

  const wanted = typeof input.id === "string" && ACTIVITY_ID_RE.test(input.id) ? input.id : "";
  const row = wanted
    ? await db
        .prepare(`SELECT * FROM class_platform_activity WHERE activity_id = ?`)
        .bind(wanted)
        .first()
    : null;
  // An id that belongs to another class is never overwritten.
  if (row && row.code !== code) return fail("not-yours", 403);

  if (row) {
    if (baseRev !== Number(row.rev)) return conflict(row);
    const a = draftOf(input, {
      id: row.activity_id,
      rev: Number(row.rev) + 1,
      createdAt: Number(row.created_at),
      now,
    });
    if (sizeOf(a) > ACTIVITY_LIMITS.maxBytes) return fail("activity-too-large", 413);
    if (!(await writeDraft(db, row, a, now)))
      return conflict(await findOwn(db, code, row.activity_id));
  } else {
    if ((await countOwned(db, code)) >= ACTIVITY_LIMITS.maxPerClass)
      return fail("too-many-activities", 409);
    const a = draftOf(input, { id: `s${randomHex(5)}`, rev: 1, createdAt: now, now });
    if (sizeOf(a) > ACTIVITY_LIMITS.maxBytes) return fail("activity-too-large", 413);
    await insertDraft(db, code, a, now);
    await bucketHit(db, `as:${code}`, now);
    return { ok: true, ...(await metaOf(db, code, a.id)) };
  }
  await bucketHit(db, `as:${code}`, now);
  return { ok: true, ...(await metaOf(db, code, row.activity_id)) };
}

async function duplicate({ db, now, fail }, code, row) {
  if ((await countOwned(db, code)) >= ACTIVITY_LIMITS.maxPerClass)
    return fail("too-many-activities", 409);
  if (await bucketOver(db, `as:${code}`, ACTIVITY_LIMITS.savesPerHour, now))
    return fail("too-many-saves", 429);
  const source = parseJson(row.draft_json, {});
  const a = draftOf(
    { ...source, title: `Copy of ${source.title || row.title}` },
    {
      id: `s${randomHex(5)}`,
      rev: 1,
      createdAt: now,
      now,
    },
  );
  await insertDraft(db, code, a, now);
  await bucketHit(db, `as:${code}`, now);
  return { ok: true, ...(await metaOf(db, code, a.id)), activity: a };
}

async function remove({ db }, code, id) {
  await db.batch([
    db
      .prepare(
        `DELETE FROM class_platform_activity_stat WHERE activity_id IN
         (SELECT activity_id FROM class_platform_activity WHERE code = ? AND activity_id = ?)`,
      )
      .bind(code, id),
    db
      .prepare(`DELETE FROM class_platform_activity_rev WHERE code = ? AND activity_id = ?`)
      .bind(code, id),
    db
      .prepare(`DELETE FROM class_platform_activity WHERE code = ? AND activity_id = ?`)
      .bind(code, id),
  ]);
  return { ok: true, id };
}

async function restore({ db, body, now, fail }, code, row) {
  const target = Number(body?.rev);
  if (!Number.isInteger(target) || target < 1) return fail("invalid-rev");
  if (body.baseRev !== undefined && body.baseRev !== Number(row.rev)) return conflict(row);
  const old = await db
    .prepare(
      `SELECT json FROM class_platform_activity_rev WHERE code = ? AND activity_id = ? AND rev = ?`,
    )
    .bind(code, row.activity_id, target)
    .first();
  if (!old) return fail("not-found", 404);
  const a = draftOf(parseJson(old.json, {}), {
    id: row.activity_id,
    rev: Number(row.rev) + 1,
    createdAt: Number(row.created_at),
    now,
  });
  if (!(await writeDraft(db, row, a, now)))
    return conflict(await findOwn(db, code, row.activity_id));
  return { ok: true, ...(await metaOf(db, code, row.activity_id)), activity: a };
}

async function publish({ db, body, now, fail }, code, row) {
  if (body.baseRev !== undefined && body.baseRev !== Number(row.rev)) return conflict(row);
  const bucket = `ap:${code}`;
  if (await bucketOver(db, bucket, ACTIVITY_LIMITS.publishesPerHour, now))
    return fail("too-many-publishes", 429);
  const draft = normalizeActivity(parseJson(row.draft_json, {}));
  const issues = validateActivity(draft);
  if (!issues.ok)
    return json(
      {
        ok: false,
        error: "invalid-activity",
        issues: { errors: issues.errors, warnings: issues.warnings },
      },
      422,
    );
  const copy = studentCopyFor(draft);
  const questionIds = questionsOf(copy).map((q) => q.id);
  const res = await db
    .prepare(
      `UPDATE class_platform_activity SET state = 'published', published_json = ?, published_rev = rev, published_at = ?
       WHERE code = ? AND activity_id = ? AND rev = ?`,
    )
    .bind(JSON.stringify(copy), now, code, row.activity_id, row.rev)
    .run();
  if (!res.meta?.changes) return conflict(await findOwn(db, code, row.activity_id));
  // Counters for questions the student copy no longer has would only confuse the evidence.
  await db
    .prepare(
      `DELETE FROM class_platform_activity_stat WHERE activity_id = ? AND question_id NOT IN (${questionIds.map(() => "?").join(",")})`,
    )
    .bind(row.activity_id, ...questionIds)
    .run();
  await bucketHit(db, bucket, now);
  return {
    ok: true,
    id: row.activity_id,
    path: activityPath(row.activity_id),
    state: "published",
    publishedRev: Number(row.rev),
    issues: { errors: [], warnings: issues.warnings },
  };
}

async function unpublish({ db, now, fail }, code, row) {
  if (row.state !== "published") return fail("not-published", 409);
  await db
    .prepare(
      `UPDATE class_platform_activity SET state = 'unpublished', published_json = NULL, updated_at = ?
       WHERE code = ? AND activity_id = ?`,
    )
    .bind(Math.max(now, Number(row.updated_at)), code, row.activity_id)
    .run();
  return { ok: true, ...(await metaOf(db, code, row.activity_id)) };
}

async function revisions({ db }, code, row) {
  const res = await db
    .prepare(
      `SELECT rev, saved_at, json FROM class_platform_activity_rev WHERE code = ? AND activity_id = ? ORDER BY rev DESC`,
    )
    .bind(code, row.activity_id)
    .all();
  return {
    ok: true,
    id: row.activity_id,
    rev: Number(row.rev),
    revisions: (res.results || []).map((r) => ({
      rev: Number(r.rev),
      savedAt: Number(r.saved_at),
      title: String(parseJson(r.json, {}).title || ""),
    })),
  };
}

/* ── anonymous evidence ────────────────────────────────────────────────────── */

function parseAnswers(raw) {
  const max = ACTIVITY_LIMITS.maxAnswers;
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > max) return null;
  const seen = new Set();
  const list = [];
  for (const a of raw) {
    if (!a || typeof a !== "object" || typeof a.q !== "string" || !CHOICE_ID.test(a.q)) return null;
    if (seen.has(a.q) || !STATUSES.has(a.first) || !STATUSES.has(a.final)) return null;
    const hints = a.hints === undefined ? 0 : a.hints;
    if (!Number.isInteger(hints) || hints < 0 || hints > ACTIVITY_LIMITS.maxHints) return null;
    if (a.revised !== undefined && typeof a.revised !== "boolean") return null;
    if (
      a.wrongChoice !== undefined &&
      !(typeof a.wrongChoice === "string" && CHOICE_ID.test(a.wrongChoice))
    )
      return null;
    seen.add(a.q);
    list.push({
      q: a.q,
      first: a.first,
      final: a.final,
      hints,
      revised: a.revised === true,
      wrong: a.wrongChoice,
    });
  }
  return list;
}

const UPSERT_STAT = `INSERT INTO class_platform_activity_stat (activity_id, question_id, n, first_correct, final_correct, revised, hints)
  VALUES (?, ?, 1, ?, ?, ?, ?)
  ON CONFLICT(activity_id, question_id) DO UPDATE SET n = n + 1, first_correct = first_correct + excluded.first_correct,
    final_correct = final_correct + excluded.final_correct, revised = revised + excluded.revised, hints = hints + excluded.hints`;
// One atomic statement: bump a wrong option's count, but never grow past maxWrongChoices distinct entries.
const BUMP_WRONG = `UPDATE class_platform_activity_stat SET wrong_json = json_set(wrong_json, ?, COALESCE(json_extract(wrong_json, ?), 0) + 1)
  WHERE activity_id = ? AND question_id = ?
    AND (json_extract(wrong_json, ?) IS NOT NULL OR (SELECT COUNT(*) FROM json_each(wrong_json)) < ?)`;

async function respond({ db, body, request, now, fail }) {
  const id = body?.id;
  const session = body?.session;
  if (typeof id !== "string" || !ACTIVITY_ID_RE.test(id)) return fail("invalid-id");
  if (typeof session !== "string" || !SESSION_ID.test(session)) return fail("invalid-session");
  const answers = parseAnswers(body.answers);
  if (!answers) return fail("invalid-answers");
  const row = await db
    .prepare(
      `SELECT a.published_json FROM class_platform_activity a JOIN class_platform_class c ON c.code = a.code
       WHERE a.activity_id = ? AND a.state = 'published' AND c.expires_at >= ?`,
    )
    .bind(id, now)
    .first();
  const copy = row ? parseJson(row.published_json, null) : null;
  if (!copy) return fail("not-found", 404);
  const ipKey = `ar:i:${(await sha256Hex(clientIp(request))).slice(0, 24)}`;
  const sessionKey = `ar:s:${(await sha256Hex(`${id}:${session}`)).slice(0, 24)}`;
  if (await bucketOver(db, ipKey, ACTIVITY_LIMITS.responsesPerIpHour, now))
    return fail("too-many-responses", 429);
  if (await bucketOver(db, sessionKey, ACTIVITY_LIMITS.responsesPerSessionHour, now))
    return fail("too-many-responses", 429);

  const known = new Map(questionsOf(copy).map((q) => [q.id, q]));
  const statements = [];
  let accepted = 0;
  for (const a of answers) {
    const q = known.get(a.q);
    if (!q || (a.first === "empty" && a.final === "empty")) continue;
    accepted++;
    statements.push(
      db
        .prepare(UPSERT_STAT)
        .bind(
          id,
          a.q,
          a.first === "correct" ? 1 : 0,
          a.final === "correct" ? 1 : 0,
          a.revised ? 1 : 0,
          a.hints,
        ),
    );
    if (a.wrong && a.first === "incorrect" && choicesOf(q).has(a.wrong)) {
      const path = `$."${a.wrong}"`;
      statements.push(
        db.prepare(BUMP_WRONG).bind(path, path, id, a.q, path, ACTIVITY_LIMITS.maxWrongChoices),
      );
    }
  }
  if (statements.length) await db.batch(statements);
  await Promise.all([bucketHit(db, ipKey, now), bucketHit(db, sessionKey, now)]);
  return { ok: true, accepted };
}

/* ── routes ────────────────────────────────────────────────────────────────── */

async function play({ db, url, now }) {
  const id = url.searchParams.get("id") || "";
  const unavailable = () =>
    json(
      {
        ok: false,
        error: "not-available",
        message:
          "This activity is not available right now. Ask your teacher for the link. / Esta actividad no está disponible ahora. Pide el enlace a tu maestro o maestra.",
      },
      404,
    );
  if (!ACTIVITY_ID_RE.test(id)) return unavailable();
  const row = await db
    .prepare(
      `SELECT a.published_json, a.published_rev, a.published_at FROM class_platform_activity a
       JOIN class_platform_class c ON c.code = a.code
       WHERE a.activity_id = ? AND a.state = 'published' AND c.expires_at >= ?`,
    )
    .bind(id, now)
    .first();
  const activity = row ? parseJson(row.published_json, null) : null;
  if (!activity) return unavailable();
  return {
    ok: true,
    id,
    title: activity.title,
    kind: activity.kind,
    updatedAt: Number(row.published_at),
    publishedRev: Number(row.published_rev),
    activity,
  };
}

const ROW_ROUTES = {
  "GET get": async (_ctx, _code, row) => ({
    ok: true,
    ...meta(row),
    activity: parseJson(row.draft_json, {}),
  }),
  "POST duplicate": duplicate,
  "POST publish": publish,
  "POST unpublish": unpublish,
  "POST restore": restore,
  "GET revisions": revisions,
  "GET evidence": evidence,
};

export async function handleActivities(ctx, action) {
  const { db, body, url, method, fail } = ctx;
  const key = `${method} ${action}`;
  if (key === "GET play") return play(ctx);
  if (key === "POST response") return respond(ctx);

  const auth = await ctx.requireTeacher(
    ctx,
    method === "GET" ? url.searchParams.get("code") : body?.code,
  );
  if (auth.error) return auth.error;
  const code = auth.cls.code;

  if (key === "GET list") {
    const res = await db
      .prepare(
        `SELECT ${META_COLUMNS} FROM class_platform_activity WHERE code = ? ORDER BY updated_at DESC`,
      )
      .bind(code)
      .all();
    return { ok: true, activities: (res.results || []).map(meta) };
  }
  if (key === "POST save") return save(ctx, code);

  const run = ROW_ROUTES[key] || (key === "POST delete" ? remove : null);
  if (!run) return fail("not-found", 404);
  const id = String((method === "GET" ? url.searchParams.get("id") : body?.id) || "");
  if (!ACTIVITY_ID_RE.test(id)) return fail("invalid-id");
  const row = await findOwn(db, code, id);
  if (!row) return fail("not-found", 404);
  if (key === "POST delete") return remove(ctx, code, id);
  return run(ctx, code, row);
}
