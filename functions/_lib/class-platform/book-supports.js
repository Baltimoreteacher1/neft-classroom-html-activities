/* =============================================================================
 * Book Studio language-support assignments (Language Page, class only).
 *
 * A teacher publishes an assignment book with LanguageSupports and a plan:
 *   plan = { default, groups: [{ id, name, plan }], students: { <alias>: { group?, plan? } }, log: [] }
 * Resolution order for one learner: their own override, then their group, then the class default.
 *
 * AUTHORIZATION IS HERE, NOT IN THE BROWSER. A student's `mine` answer contains only the supports resolved for them,
 * with `levels` removed and no profile number, other group, or classmate plan. Teacher routes need the class
 * passcode or site key; student routes need the student's own key. Proficiency labels never reach a peer.
 *
 * Routes (/api/class/bsupport/*):
 *   POST publish  { code, assignment: { id?, title, task, book, supports, plan } }          teacher
 *   POST adjust   { code, assignment, alias, plan, reason }  (reason required; logged)      teacher
 *   GET  roster?code=&assignment=                                                           teacher: aliases + where each sits
 *   GET  evidence?code=&assignment=                                                         teacher: use records + work
 *   GET  assignments?code=                                                                  student: titles only
 *   GET  mine?code=&assignment=                                                             student: book + OWN supports + OWN plan
 *   POST event    { code, assignment, events: [{ supportId, action, target?, at? }] }       student
 *   POST work     { code, assignment, work, texts }                                          student
 * ========================================================================== */

import { normalizePlan } from "../../../access-practice-lab/src/book/lang/profiles.js";
import {
  normalizeSupport,
  RECORD_ACTIONS,
  resolveSupports,
} from "../../../access-practice-lab/src/book/lang/supports.js";
import { normalizeWork } from "../../../access-practice-lab/src/book/lang/work.js";
import { normalizeBook } from "../../../access-practice-lab/src/book/model.js";
import { json } from "../http.js";
import { guardHit, guardOver, parseJson, randomHex } from "./store.js";

const MAX_BOOK_BYTES = 250_000;
const MAX_WORK_BYTES = 150_000;
const MAX_SUPPORTS = 400;
const MAX_EVENTS_PER_STUDENT = 2000;
const EVENTS_PER_CALL = 50;
const WRITES_PER_HOUR = 600;
const HOUR_MS = 60 * 60 * 1000;
const isAssignmentId = (v) => typeof v === "string" && /^[a-z0-9]{6,32}$/i.test(v);
const isSupportId = (v) => typeof v === "string" && /^[a-z0-9]{4,40}$/i.test(v);
const aliasKey = (a) =>
  String(a || "")
    .trim()
    .toLowerCase();
const clampText = (v, n) => String(v ?? "").slice(0, n);

/** Server-side plan normalization: every plan, group and override passes the same function the editor uses. */
export function normalizeAssignmentPlan(raw = {}) {
  const groups = (Array.isArray(raw.groups) ? raw.groups : []).slice(0, 12).map((g, i) => ({
    id: /^[a-z0-9]{3,40}$/i.test(g?.id || "") ? g.id : `g${i + 1}${randomHex(2)}`,
    name: clampText(g?.name, 40) || `Group ${i + 1}`,
    plan: normalizePlan(g?.plan),
  }));
  const students = {};
  for (const [alias, v] of Object.entries(
    raw.students && typeof raw.students === "object" ? raw.students : {},
  ).slice(0, 80)) {
    const entry = {};
    if (v?.group && groups.some((g) => g.id === v.group)) entry.group = v.group;
    if (v?.plan) entry.plan = normalizePlan(v.plan);
    if (entry.group || entry.plan) students[aliasKey(alias)] = entry;
  }
  return {
    default: normalizePlan(raw.default),
    groups,
    students,
    log: (Array.isArray(raw.log) ? raw.log : []).slice(-60).map((l) => ({
      at: Number(l?.at) || 0,
      alias: clampText(l?.alias, 20),
      from: clampText(l?.from, 40),
      to: clampText(l?.to, 40),
      reason: clampText(l?.reason, 300),
    })),
  };
}

/** The plan that applies to one learner (their override, else their group, else the class default). */
export function planFor(plan, alias) {
  const entry = plan.students[aliasKey(alias)];
  if (entry?.plan) return { plan: entry.plan, source: "student" };
  const g = entry?.group ? plan.groups.find((x) => x.id === entry.group) : null;
  if (g) return { plan: g.plan, source: "group", group: g.name };
  return { plan: plan.default, source: "class" };
}

/**
 * What ONE learner may receive. Pure. Supports the learner's plan never reaches (wrong profile) are absent; for the
 * ones that remain, `levels` is cleared so the browser can run the same resolver without ever learning the profile.
 */
export function deliverFor(book, plan) {
  const probe = { ...book, supports: book.supports };
  const reach = resolveSupports(probe, { profile: plan.profile, plan, mode: "student" });
  const ids = new Set(reach.map((r) => r.support.id));
  return {
    supports: book.supports.filter((s) => ids.has(s.id)).map((s) => ({ ...s, levels: [] })),
    plan: normalizePlan({
      profile: 0,
      intensity: plan.intensity,
      domains: plan.domains,
      auto: false,
    }),
  };
}

const stripBook = (book) => {
  const b = JSON.parse(JSON.stringify(book));
  b.supports = [];
  b.groups = [];
  b.planLog = [];
  b.work = undefined;
  b.plan = undefined;
  return b;
};

export async function handleBookSupports(ctx, action) {
  const { db, body, url, now, method, fail, request } = ctx;
  const codeRaw = method === "GET" ? url.searchParams.get("code") : body?.code;
  const found = await ctx.requireClass(db, codeRaw, now);
  if (found.error) return found.error;
  const code = found.cls.code;
  const aid =
    method === "GET"
      ? url.searchParams.get("assignment")
      : (body?.assignment?.id ?? body?.assignment);

  const loadAssignment = async (id) => {
    if (!isAssignmentId(id)) return null;
    return db
      .prepare(`SELECT * FROM class_platform_bassign WHERE code = ? AND assignment_id = ?`)
      .bind(code, id)
      .first();
  };

  // ── teacher ──
  if (action === "publish" && method === "POST") {
    const auth = await ctx.requireTeacher(ctx, code);
    if (auth.error) return auth.error;
    const a = body?.assignment;
    if (!a || typeof a !== "object") return fail("invalid-assignment");
    const supports = (Array.isArray(a.supports) ? a.supports : [])
      .slice(0, MAX_SUPPORTS)
      .map(normalizeSupport);
    const book = normalizeBook({ ...a.book, supports });
    const slim = JSON.stringify(stripBook(book));
    if (slim.length > MAX_BOOK_BYTES) return fail("book-too-large", 413);
    const id = isAssignmentId(a.id) ? a.id : `a${randomHex(6)}`;
    const plan = normalizeAssignmentPlan(a.plan);
    await db
      .prepare(
        `INSERT INTO class_platform_bassign (code, assignment_id, title, task, book_json, supports_json, plan_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(code, assignment_id) DO UPDATE SET title = excluded.title, task = excluded.task, book_json = excluded.book_json,
           supports_json = excluded.supports_json, plan_json = excluded.plan_json, updated_at = excluded.updated_at`,
      )
      .bind(
        code,
        id,
        clampText(a.title, 120) || "Assignment",
        clampText(a.task, 400),
        slim,
        JSON.stringify(supports),
        JSON.stringify(plan),
        now,
      )
      .run();
    return json({ ok: true, assignmentId: id, supports: supports.length });
  }

  if (action === "adjust" && method === "POST") {
    const auth = await ctx.requireTeacher(ctx, code);
    if (auth.error) return auth.error;
    const row = await loadAssignment(body?.assignment);
    if (!row) return fail("assignment-not-found", 404);
    const reason = clampText(body?.reason, 300).trim();
    if (!reason) return fail("reason-required");
    const alias = aliasKey(body?.alias);
    if (!alias) return fail("invalid-alias");
    const plan = normalizeAssignmentPlan(parseJson(row.plan_json, {}));
    const prev = planFor(plan, alias).plan;
    const entry = plan.students[alias] || {};
    if (body.group !== undefined) {
      if (body.group && plan.groups.some((g) => g.id === body.group)) entry.group = body.group;
      else delete entry.group;
    }
    if (body.plan)
      entry.plan = normalizePlan({ ...body.plan, reason, at: new Date(now).toISOString() });
    if (body.clearOverride) delete entry.plan;
    if (entry.group || entry.plan) plan.students[alias] = entry;
    else delete plan.students[alias];
    const next = planFor(plan, alias).plan;
    plan.log.push({ at: now, alias, from: `${prev.intensity}`, to: `${next.intensity}`, reason });
    plan.log = plan.log.slice(-60);
    await db
      .prepare(
        `UPDATE class_platform_bassign SET plan_json = ?, updated_at = ? WHERE code = ? AND assignment_id = ?`,
      )
      .bind(JSON.stringify(plan), now, code, row.assignment_id)
      .run();
    return json({ ok: true });
  }

  if (action === "roster" && method === "GET") {
    const auth = await ctx.requireTeacher(ctx, code);
    if (auth.error) return auth.error;
    const row = await loadAssignment(aid);
    if (!row) return fail("assignment-not-found", 404);
    const plan = normalizeAssignmentPlan(parseJson(row.plan_json, {}));
    const studs = await db
      .prepare(`SELECT student_id, alias FROM class_platform_student WHERE code = ? ORDER BY alias`)
      .bind(code)
      .all();
    return json({
      ok: true,
      plan,
      students: (studs.results || []).map((s) => {
        const r = planFor(plan, s.alias);
        return {
          studentId: s.student_id,
          alias: s.alias,
          source: r.source,
          group: r.group || "",
          profile: r.plan.profile,
          intensity: r.plan.intensity,
          domains: r.plan.domains,
        };
      }),
    });
  }

  if (action === "evidence" && method === "GET") {
    const auth = await ctx.requireTeacher(ctx, code);
    if (auth.error) return auth.error;
    const row = await loadAssignment(aid);
    if (!row) return fail("assignment-not-found", 404);
    const plan = normalizeAssignmentPlan(parseJson(row.plan_json, {}));
    const supports = parseJson(row.supports_json, []);
    const studs =
      (
        await db
          .prepare(`SELECT student_id, alias FROM class_platform_student WHERE code = ?`)
          .bind(code)
          .all()
      ).results || [];
    const events =
      (
        await db
          .prepare(
            `SELECT student_id, support_id, action, at FROM class_platform_bevent WHERE code = ? AND assignment_id = ?`,
          )
          .bind(code, row.assignment_id)
          .all()
      ).results || [];
    const works =
      (
        await db
          .prepare(
            `SELECT student_id, work_json, texts_json, updated_at FROM class_platform_bwork WHERE code = ? AND assignment_id = ?`,
          )
          .bind(code, row.assignment_id)
          .all()
      ).results || [];
    return json({
      ok: true,
      assignment: { id: row.assignment_id, title: row.title },
      students: studs
        .map((s) => {
          const mine = events.filter((e) => e.student_id === s.student_id);
          const w = works.find((x) => x.student_id === s.student_id);
          const work = w ? parseJson(w.work_json, null) : null;
          const r = planFor(plan, s.alias);
          return {
            studentId: s.student_id,
            alias: s.alias,
            plan: {
              source: r.source,
              group: r.group || "",
              profile: r.plan.profile,
              intensity: r.plan.intensity,
              domains: r.plan.domains,
            },
            usage: supports.map((sp) => {
              const m = mine.filter((e) => e.support_id === sp.id);
              const c = (act) => m.filter((e) => e.action === act).length;
              return {
                supportId: sp.id,
                title: sp.title,
                required: sp.required,
                opened: c("opened"),
                used: c("used"),
                completed: c("completed"),
                hidden: c("hidden"),
                independent: c("independent"),
              };
            }),
            attempts: work?.attempts?.length || 0,
            revisions: work?.revisions || [],
            texts: w ? parseJson(w.texts_json, []) : [],
            updatedAt: w ? Number(w.updated_at) : 0,
          };
        })
        .filter(
          (s) =>
            s.updatedAt ||
            s.usage.some((u) => u.opened || u.used || u.completed || u.hidden || u.independent),
        ),
    });
  }

  // ── student ──
  const student = await ctx.requireStudent(ctx, code);
  if (student.error) return student.error;
  const sid = student.student.student_id;
  const alias = student.student.alias;

  if (action === "assignments" && method === "GET") {
    const rows =
      (
        await db
          .prepare(
            `SELECT assignment_id, title, task, updated_at FROM class_platform_bassign WHERE code = ? ORDER BY updated_at DESC LIMIT 30`,
          )
          .bind(code)
          .all()
      ).results || [];
    return json({
      ok: true,
      assignments: rows.map((r) => ({
        id: r.assignment_id,
        title: r.title,
        task: r.task,
        updatedAt: Number(r.updated_at),
      })),
    });
  }

  const row = await loadAssignment(aid);
  if (!row) return fail("assignment-not-found", 404);

  if (action === "mine" && method === "GET") {
    const book = normalizeBook({
      ...parseJson(row.book_json, {}),
      supports: parseJson(row.supports_json, []),
    });
    const { plan } = planFor(normalizeAssignmentPlan(parseJson(row.plan_json, {})), alias);
    const out = deliverFor(book, plan);
    const slim = stripBook(book);
    return json({
      ok: true,
      assignment: {
        id: row.assignment_id,
        title: row.title,
        task: row.task,
        book: slim,
        updatedAt: Number(row.updated_at),
      },
      supports: out.supports,
      plan: out.plan,
    });
  }

  if (action === "event" && method === "POST") {
    if (await guardOver(db, `bs:${code}:${sid}`, WRITES_PER_HOUR)) return fail("too-many", 429);
    const supports = new Set(parseJson(row.supports_json, []).map((s) => s.id));
    const list = (Array.isArray(body?.events) ? body.events : [])
      .slice(0, EVENTS_PER_CALL)
      .filter(
        (e) =>
          isSupportId(e?.supportId) &&
          supports.has(e.supportId) &&
          RECORD_ACTIONS.includes(e?.action),
      );
    if (!list.length) return json({ ok: true, stored: 0 });
    await db.batch([
      ...list.map((e) =>
        db
          .prepare(
            `INSERT INTO class_platform_bevent (code, student_id, assignment_id, support_id, action, target, at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(code, sid, row.assignment_id, e.supportId, e.action, clampText(e.target, 40), now),
      ),
      db
        .prepare(
          `DELETE FROM class_platform_bevent WHERE code = ? AND student_id = ? AND assignment_id = ? AND event_id NOT IN (SELECT event_id FROM class_platform_bevent WHERE code = ? AND student_id = ? AND assignment_id = ? ORDER BY event_id DESC LIMIT ${MAX_EVENTS_PER_STUDENT})`,
        )
        .bind(code, sid, row.assignment_id, code, sid, row.assignment_id),
    ]);
    await guardHit(db, `bs:${code}:${sid}`, now, HOUR_MS);
    return json({ ok: true, stored: list.length });
  }

  if (action === "work" && method === "POST") {
    if (await guardOver(db, `bs:${code}:${sid}`, WRITES_PER_HOUR)) return fail("too-many", 429);
    const work = normalizeWork(body?.work);
    const texts = (Array.isArray(body?.texts) ? body.texts : []).slice(0, 40).map((t) => ({
      pageId: clampText(t?.pageId, 40),
      elementId: clampText(t?.elementId, 40),
      text: clampText(t?.text, 1200),
    }));
    const workJson = JSON.stringify(work);
    if (workJson.length > MAX_WORK_BYTES) return fail("work-too-large", 413);
    await db
      .prepare(
        `INSERT INTO class_platform_bwork (code, student_id, assignment_id, work_json, texts_json, updated_at) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(code, student_id, assignment_id) DO UPDATE SET work_json = excluded.work_json, texts_json = excluded.texts_json, updated_at = excluded.updated_at`,
      )
      .bind(code, sid, row.assignment_id, workJson, JSON.stringify(texts), now)
      .run();
    await guardHit(db, `bs:${code}:${sid}`, now, HOUR_MS);
    return json({ ok: true });
  }

  void request;
  return fail("not-found", 404);
}
