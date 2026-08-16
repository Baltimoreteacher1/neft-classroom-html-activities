/* =============================================================================
 * /api/pacing/* — live persistence for the Live Pacing Planner.
 * -----------------------------------------------------------------------------
 * Routes (all teacher-gated except OPTIONS):
 *
 *   GET    health                bindings present? how many days are edited?
 *   GET    state                 the overlay + the recent operation log
 *   POST   writes                apply a batch of day writes as ONE operation
 *   POST   undo                  reverse the most recent operation
 *   GET    changes?date=…        the change history for one date, newest first
 *   DELETE day/<date>            drop one day's overlay, restoring the baseline
 *
 * WHY D1 AND NOT A GOOGLE SHEET. The planner needed authenticated, multi-device,
 * low-latency writes with no redeploy, over data that is curriculum-only. That
 * is exactly what /api/plan-notes already does on the DB binding, with the same
 * teacher key, in the same repo, behind the same gate. A Sheet would have added
 * an OAuth path, a second auth story, seconds of latency on every autosave, and
 * a document a teacher can edit into a shape the app cannot read. The Sheet's
 * real strength — a familiar editable grid — is served by the XLSX export
 * instead, which is a copy, not the source of truth.
 *
 * WHAT IS STORED HERE: only DELTAS from data/pacing-baseline-2026-27.json, plus
 * actuals, notes and locks. The 84 lessons, their titles, standards, objectives
 * and URLs are never copied here — they resolve from the curriculum manifest at
 * read time. A lesson renamed in the curriculum is renamed in the planner.
 *
 * NO STUDENT DATA. Not names, not ids, not scores, not IEP or WIDA records.
 * This endpoint stores curriculum pacing and nothing else, which is why it needs
 * no per-student privacy model.
 *
 * AUTH — env.TEACHER_KEY via ?key= or x-teacher-key, matching plan-notes and
 * forge.js: 503 when unset (a missing binding reads as "not configured", not
 * "wrong password"), 401 when wrong.
 * ========================================================================== */

import {
  effectiveOverlay,
  isValidSection,
  normalizeSection,
  SHARED,
} from "../../../shared/pacing/sections.js";
import { handler, json } from "../../_lib/http.js";
import { ensureSchema, SCHEMA_VERSION } from "../../_lib/pacing-schema.js";

const SCHOOL_YEAR = "2026-2027";
const MAX_WRITES_PER_OP = 220; // one op can touch at most a whole year of dates
const OP_LOG_LIMIT = 50;

const ALLOWED_ACTUAL = new Set([
  "not-yet-taught",
  "taught-as-planned",
  "continued",
  "moved",
  "skipped",
  "flex-catch-up",
  "assessment",
  "project",
  "no-instruction",
]);

const ALLOWED_DAY_TYPES = new Set([
  "Core Lesson",
  "Continued Lesson",
  "Catch-Up",
  "Review",
  "Assessment",
  "Project",
  "Flex",
  "MCAP / Testing",
  "Lost Day",
  "No Instruction",
]);

const isIsoDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

function teacherAuthorized(env, request, url) {
  if (!env.TEACHER_KEY) return "not-configured";
  const key = url.searchParams.get("key") || request.headers.get("x-teacher-key") || "";
  return key === env.TEACHER_KEY ? "ok" : "unauthorized";
}

function shortId() {
  const alphabet = "23456789abcdefghijkmnpqrstuvwxyz";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

/* ── Schema ────────────────────────────────────────────────────────────────── */

/**
 * Schema now lives in functions/_lib/pacing-schema.js, which owns the v1 -> v2
 * class-aware migration as well as the CREATE statements. Re-exported under the
 * old name because functions/api/pacing/pacing-api.test.mjs and the local dev
 * seeder both import `ensureTables`, and a rename would have been churn in
 * files this change has no other reason to touch.
 */
export const ensureTables = ensureSchema;

const parse = (v, fallback = null) => {
  if (v == null) return fallback;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};

function rowToOverlay(r) {
  const out = { updatedAt: r.updated_at };
  const plan = parse(r.plan);
  const actual = parse(r.actual);
  if (plan) out.plan = plan;
  if (actual) out.actual = actual;
  if (r.note) out.note = r.note;
  if (r.locked) out.locked = true;
  return out;
}

/* ── Validation ────────────────────────────────────────────────────────────────
 * Every field is checked against a closed list before it reaches D1. A planner
 * that accepts an arbitrary `dayType` string renders a day type the UI has no
 * label for, which looks like data loss to the teacher. Notes are free text by
 * design — they are the one field with no vocabulary. */
export function validateWrite(w) {
  if (!w || typeof w !== "object") return "each write must be an object";
  if (!isIsoDate(w.date)) return `bad date: ${JSON.stringify(w.date)}`;

  if ("plan" in w && w.plan !== null) {
    if (typeof w.plan !== "object") return `${w.date}: plan must be an object`;
    if (w.plan.dayType != null && !ALLOWED_DAY_TYPES.has(w.plan.dayType)) {
      return `${w.date}: unknown day type ${JSON.stringify(w.plan.dayType)}`;
    }
    if (w.plan.lessonId != null && typeof w.plan.lessonId !== "string") {
      return `${w.date}: lessonId must be a string`;
    }
    /* Lesson identity is an id, never free text — the planner offers canonical
     * lessons and nothing else, so a typo cannot become a scheduled lesson. */
    if (typeof w.plan.lessonId === "string" && !/^[a-z0-9-]{1,40}$/.test(w.plan.lessonId)) {
      return `${w.date}: lessonId is not a canonical id`;
    }
  }

  if ("actual" in w && w.actual !== null) {
    if (typeof w.actual !== "object") return `${w.date}: actual must be an object`;
    if (w.actual.status != null && !ALLOWED_ACTUAL.has(w.actual.status)) {
      return `${w.date}: unknown actual status ${JSON.stringify(w.actual.status)}`;
    }
  }

  if ("note" in w && w.note !== null && typeof w.note !== "string") {
    return `${w.date}: note must be text`;
  }
  if (typeof w.note === "string" && w.note.length > 4000) {
    return `${w.date}: note is too long (4000 character limit)`;
  }
  if ("locked" in w && typeof w.locked !== "boolean") return `${w.date}: locked must be true/false`;

  return null;
}

/* ── Applying a batch ──────────────────────────────────────────────────────────
 * One POST is one OPERATION. Every day it touches is written inside the same
 * D1 batch, and the inverse is stored alongside it before the writes land. That
 * ordering is what makes "Undo Last Adjustment" honest: an undo that has to be
 * reconstructed after the fact can only ever be a guess at what was there. */
export async function applyBatch(db, { writes, inverse, kind, summary, now, section = SHARED }) {
  const dates = writes.map((w) => w.date);
  const existing = new Map();
  if (dates.length) {
    const placeholders = dates.map(() => "?").join(",");
    // Scoped to the section: the prior value a write merges over is THIS class's
    // prior value, never another class's, and never the shared plan's. Reading
    // unscoped here is the single easiest way to leak one class into another.
    const { results } = await db
      .prepare(
        `SELECT * FROM pacing_day WHERE school_year = ? AND section = ? AND date IN (${placeholders})`,
      )
      .bind(SCHOOL_YEAR, section, ...dates)
      .all();
    for (const r of results || []) existing.set(r.date, r);
  }

  const opId = shortId();
  const statements = [
    db
      .prepare(
        `INSERT INTO pacing_op (id, school_year, section, ts, kind, summary, inverse)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(opId, SCHOOL_YEAR, section, now, kind, summary, JSON.stringify(inverse || [])),
  ];

  for (const w of writes) {
    const prior = existing.get(w.date) || null;
    const merged = {
      plan: "plan" in w ? w.plan : parse(prior?.plan),
      actual: "actual" in w ? w.actual : parse(prior?.actual),
      note: "note" in w ? w.note : (prior?.note ?? null),
      locked: "locked" in w ? (w.locked ? 1 : 0) : (prior?.locked ?? 0),
    };

    statements.push(
      db
        .prepare(
          `INSERT INTO pacing_day (school_year, section, date, plan, actual, note, locked, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (school_year, section, date) DO UPDATE SET
             plan = excluded.plan, actual = excluded.actual, note = excluded.note,
             locked = excluded.locked, updated_at = excluded.updated_at`,
        )
        .bind(
          SCHOOL_YEAR,
          section,
          w.date,
          merged.plan ? JSON.stringify(merged.plan) : null,
          merged.actual ? JSON.stringify(merged.actual) : null,
          merged.note,
          merged.locked,
          now,
        ),
    );

    /* The change log answers one question — "why did March 8 change?" — so it
     * records only fields that actually differ, one row per field. */
    for (const field of ["plan", "actual", "note", "locked"]) {
      if (!(field in w)) continue;
      const before =
        field === "locked" ? Boolean(prior?.locked) : (parseField(prior, field) ?? null);
      const after = field === "locked" ? Boolean(w.locked) : (w[field] ?? null);
      if (JSON.stringify(before) === JSON.stringify(after)) continue;
      statements.push(
        db
          .prepare(
            `INSERT INTO pacing_change (id, op_id, school_year, section, ts, date, field, prev, next)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            shortId(),
            opId,
            SCHOOL_YEAR,
            section,
            now,
            w.date,
            field,
            before == null ? null : JSON.stringify(before),
            after == null ? null : JSON.stringify(after),
          ),
      );
    }
  }

  await db.batch(statements);
  return opId;
}

function parseField(row, field) {
  if (!row) return null;
  if (field === "note") return row.note ?? null;
  return parse(row[field]);
}

/* ── Routes ────────────────────────────────────────────────────────────────── */

export const onRequest = handler({
  methods: ["GET", "POST", "DELETE"],
  rateLimit: { max: 120, windowMs: 60_000 },
  async handle({ request, env, body }) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/pacing\/?/, "").replace(/\/+$/, "");
    const auth = teacherAuthorized(env, request, url);

    if (auth === "not-configured") {
      return json(
        {
          ok: false,
          error: "not-configured",
          message:
            "TEACHER_KEY is not set on this deployment, so the planner cannot save. It still opens read-only on the published baseline.",
        },
        503,
      );
    }
    if (auth !== "ok") {
      return json({ ok: false, error: "unauthorized", message: "Teacher key required." }, 401);
    }

    const db = env.DB;
    if (!db) {
      return json(
        {
          ok: false,
          error: "no-database",
          message:
            "The D1 binding is missing on this deployment. Pacing changes cannot be saved until it is restored.",
        },
        503,
      );
    }
    /* SECTION SCOPE. Every route below is scoped to exactly one layer: '' is the
     * shared plan that all three classes inherit, '601'|'602'|'603' is one class.
     * Validated against the canonical list rather than accepted as free text —
     * an unrecognised section would otherwise create a silent fourth plan that
     * no teacher can ever see again. Absent means the shared plan, which is what
     * every pre-class-awareness caller sends. */
    const rawSection = url.searchParams.get("section") ?? body?.section ?? SHARED;
    if (!isValidSection(rawSection)) {
      return json(
        {
          ok: false,
          error: "bad-section",
          message: "Unknown class section. Expected 601, 602, 603, or none for the shared plan.",
        },
        400,
      );
    }
    const section = normalizeSection(rawSection);

    try {
      await ensureTables(db);
    } catch (err) {
      /* Fail CLOSED. A half-migrated or future-schema database must refuse to
       * serve rather than answer from a shape it does not understand. */
      return json(
        {
          ok: false,
          error: "schema",
          message: `The planner database is not in a readable state: ${err.message}`,
        },
        503,
      );
    }
    const now = Date.now();
    const method = request.method.toUpperCase();

    if (method === "GET" && path === "health") {
      const { results } = await db
        .prepare(
          `SELECT section, COUNT(*) AS n FROM pacing_day WHERE school_year = ? GROUP BY section`,
        )
        .bind(SCHOOL_YEAR)
        .all();
      const bySection = {};
      let total = 0;
      for (const r of results || []) {
        bySection[r.section === SHARED ? "shared" : r.section] = r.n;
        total += Number(r.n);
      }
      return {
        ok: true,
        schoolYear: SCHOOL_YEAR,
        schemaVersion: SCHEMA_VERSION,
        editedDays: total,
        editedDaysBySection: bySection,
        database: true,
      };
    }

    if (method === "GET" && (path === "state" || path === "")) {
      /* BOTH LAYERS, in one round trip. The client needs the shared plan and the
       * class plan separately — not just their merge — so it can label a day
       * "your class changed this" versus "this came from the shared plan", and
       * so switching class re-composes locally instead of re-fetching. Composing
       * server-side would be one less field and one more request per class. */
      const wantedSections = section === SHARED ? [SHARED] : [SHARED, section];
      const placeholders = wantedSections.map(() => "?").join(",");
      const [days, ops] = await Promise.all([
        db
          .prepare(
            `SELECT * FROM pacing_day WHERE school_year = ? AND section IN (${placeholders})`,
          )
          .bind(SCHOOL_YEAR, ...wantedSections)
          .all(),
        db
          .prepare(
            `SELECT id, section, ts, kind, summary, undone_at FROM pacing_op
             WHERE school_year = ? AND section = ? ORDER BY ts DESC LIMIT ?`,
          )
          .bind(SCHOOL_YEAR, section, OP_LOG_LIMIT)
          .all(),
      ]);
      const shared = {};
      const classOverlay = {};
      for (const r of days.results || []) {
        (r.section === SHARED ? shared : classOverlay)[r.date] = rowToOverlay(r);
      }
      return {
        ok: true,
        schoolYear: SCHOOL_YEAR,
        schemaVersion: SCHEMA_VERSION,
        section,
        serverTime: now,
        /* `overlay` is the EFFECTIVE overlay and keeps the v1 field name, so a
         * client that has not been updated still receives something correct for
         * the layer it asked for. */
        overlay: effectiveOverlay(shared, classOverlay),
        sharedOverlay: shared,
        classOverlay,
        operations: (ops.results || []).map((o) => ({
          id: o.id,
          section: o.section,
          ts: o.ts,
          kind: o.kind,
          summary: o.summary,
          undoneAt: o.undone_at,
        })),
      };
    }

    if (method === "GET" && path === "changes") {
      const date = url.searchParams.get("date");
      const stmt = date
        ? db
            .prepare(
              `SELECT * FROM pacing_change WHERE school_year = ? AND section = ? AND date = ?
               ORDER BY ts DESC LIMIT 200`,
            )
            .bind(SCHOOL_YEAR, section, date)
        : db
            .prepare(
              `SELECT * FROM pacing_change WHERE school_year = ? AND section = ?
               ORDER BY ts DESC LIMIT 200`,
            )
            .bind(SCHOOL_YEAR, section);
      const { results } = await stmt.all();
      return {
        ok: true,
        section,
        changes: (results || []).map((c) => ({
          id: c.id,
          opId: c.op_id,
          section: c.section,
          ts: c.ts,
          date: c.date,
          field: c.field,
          previous: parse(c.prev),
          next: parse(c.next),
        })),
      };
    }

    if (method === "POST" && path === "writes") {
      const writes = Array.isArray(body?.writes) ? body.writes : null;
      if (!writes || writes.length === 0) {
        return json({ ok: false, error: "writes must be a non-empty array" }, 400);
      }
      if (writes.length > MAX_WRITES_PER_OP) {
        return json(
          { ok: false, error: `an operation may touch at most ${MAX_WRITES_PER_OP} days` },
          400,
        );
      }
      for (const w of writes) {
        const problem = validateWrite(w);
        if (problem) return json({ ok: false, error: problem }, 400);
      }
      const inverse = Array.isArray(body?.inverse) ? body.inverse : [];
      for (const w of inverse) {
        const problem = validateWrite(w);
        if (problem) return json({ ok: false, error: `inverse: ${problem}` }, 400);
      }

      const opId = await applyBatch(db, {
        writes,
        inverse,
        kind: String(body?.kind || "edit").slice(0, 40),
        summary: String(body?.summary || "").slice(0, 300),
        now,
        section,
      });
      return { ok: true, opId, savedAt: now, section };
    }

    if (method === "POST" && path === "undo") {
      const { results } = await db
        /* Scoped: undoing in 602 reverses 602's last change, never 601's, and
         * never a shared-plan change the teacher cannot see from here. */
        .prepare(
          `SELECT * FROM pacing_op WHERE school_year = ? AND section = ? AND undone_at IS NULL
           ORDER BY ts DESC LIMIT 1`,
        )
        .bind(SCHOOL_YEAR, section)
        .all();
      const op = results?.[0];
      if (!op) return json({ ok: false, error: "nothing-to-undo" }, 404);

      const inverse = parse(op.inverse, []);
      if (!Array.isArray(inverse) || inverse.length === 0) {
        return json(
          {
            ok: false,
            error: "not-undoable",
            message: `"${op.summary}" was recorded without a reversal, so it cannot be undone automatically.`,
          },
          409,
        );
      }

      const undoId = await applyBatch(db, {
        writes: inverse,
        inverse: [],
        kind: "undo",
        summary: `Undo: ${op.summary}`,
        now,
        section,
      });
      await db.prepare(`UPDATE pacing_op SET undone_at = ? WHERE id = ?`).bind(now, op.id).run();
      return { ok: true, undoneOpId: op.id, opId: undoId, summary: op.summary, section };
    }

    if (method === "DELETE" && path.startsWith("day/")) {
      const date = path.slice(4);
      if (!isIsoDate(date)) return json({ ok: false, error: "bad date" }, 400);
      const { results } = await db
        .prepare(`SELECT * FROM pacing_day WHERE school_year = ? AND section = ? AND date = ?`)
        .bind(SCHOOL_YEAR, section, date)
        .all();
      const prior = results?.[0];
      if (!prior) return { ok: true, date, section, alreadyBaseline: true };

      /* Restoring the baseline is itself an operation, with the removed overlay
       * as its inverse — so "reset this day" is as undoable as any other edit. */
      const inverse = [
        {
          date,
          plan: parse(prior.plan),
          actual: parse(prior.actual),
          note: prior.note ?? null,
          locked: Boolean(prior.locked),
        },
      ];
      const opId = await applyBatch(db, {
        writes: [{ date, plan: null, actual: null, note: null, locked: false }],
        inverse,
        kind: "reset-day",
        /* Wording matters here: resetting a CLASS day drops that class's
         * override and returns it to the shared plan, which is not the same as
         * returning to the district baseline. */
        summary:
          section === SHARED
            ? `Restore ${date} to the original plan`
            : `Reset ${date} for Class ${section} to the shared plan`,
        now,
        section,
      });
      return { ok: true, date, section, opId };
    }

    return json({ ok: false, error: "not found" }, 404);
  },
});
