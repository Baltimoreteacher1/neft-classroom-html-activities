/* =============================================================================
 * Our Class Investigation — anonymous, append-only class dataset
 * (Cloudflare Pages Function)
 * -----------------------------------------------------------------------------
 * One real question runs all year. Students add a measurement, each unit adds a
 * tool, and Unit 2 analyses the whole dataset. This endpoint is the store.
 *
 * Routes (catch-all under /api/class-data):
 *   GET  /health                                   -> { ok, d1 }
 *   GET  /info?code=                               -> the class's active investigation + counts
 *   GET  /entries?code=&template=                  -> the dataset: [{ id, v, s }]
 *   POST /contribute  { code, templateId, entryId, clientId, source, values }
 *
 *   Teacher-only (header `x-teacher-key` must equal env.TEACHER_KEY):
 *   POST /create      { templateId, options? }     -> { code }
 *   POST /activate    { code, templateId, options? }
 *   POST /close       { code, templateId }
 *   POST /reopen      { code, templateId }
 *   GET  /export?code=&template=&format=csv|json
 *   POST /purge       { code, templateId?, confirm } -> hard delete (see the privacy doc)
 *
 * ANONYMOUS BY CONSTRUCTION. There is no free-text field: a contribution is a
 * set of numbers in declared ranges and ids from fixed lists, and any other key
 * is a 400 (assets/class-investigation/contract.js, shared with the browser).
 * The only device identifier is `contributor`, a salted hash of a random id that
 * lives in one browser; the id itself is never stored or returned, and public
 * reads carry no contributor and no timestamp.
 *
 * APPEND-ONLY. A row is never updated. A retry after a lost response carries the
 * same `entryId` and is ignored, so the offline queue is safe to resend. The only
 * deletions are the teacher's `purge` and the retention sweep on `create`.
 *
 * GRACEFUL DEGRADATION. If the D1 binding is absent every data route is 503 and
 * the page silently keeps its solo (this-device-only) mode. Teacher routes are
 * 503 until TEACHER_KEY is configured: a missing credential never widens access.
 * ========================================================================== */

import {
  codeFromBytes,
  contributorHash,
  entriesToCsv,
  isClassCode,
  LIMITS,
  normalizeClassCode,
  randomHex,
  validateContributionShape,
  validateOptions,
  validateValues,
} from "../../../assets/class-investigation/contract.js";
import { getTemplate, resolveOptions } from "../../../assets/class-investigation/templates.js";
import {
  clientIp,
  createRateLimiter,
  handler,
  json,
  notFound,
  tooManyRequests,
  unauthorized,
} from "../../_lib/http.js";

/** The schema of record is migrations/0010_class_data.sql; a test keeps them equal. */
export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS class_data_class (
    code TEXT PRIMARY KEY,
    salt TEXT NOT NULL,
    active_template TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_active_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS class_data_class_expires ON class_data_class (expires_at)`,
  `CREATE TABLE IF NOT EXISTS class_data_investigation (
    code TEXT NOT NULL,
    template_id TEXT NOT NULL,
    options_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    opened_at INTEGER NOT NULL,
    closed_at INTEGER,
    PRIMARY KEY (code, template_id)
  )`,
  `CREATE TABLE IF NOT EXISTS class_data_entry (
    code TEXT NOT NULL,
    template_id TEXT NOT NULL,
    entry_id TEXT NOT NULL,
    contributor TEXT NOT NULL,
    values_json TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (code, template_id, entry_id)
  )`,
  `CREATE INDEX IF NOT EXISTS class_data_entry_contributor
    ON class_data_entry (code, template_id, contributor)`,
];

const RETENTION_SECS = LIMITS.retentionDays * 24 * 60 * 60;
const CODE_BYTES = 8;

// Per-IP throttles. A whole class shares one school IP, so the write ceiling is
// sized for ~30 students tapping Send inside a minute, not for one child. These
// are per-isolate and best-effort (see _lib/http.js); the durable bounds are the
// per-investigation and per-contributor caps enforced in SQL below.
const throttle = {
  read: createRateLimiter({ max: 600, windowMs: 60_000 }),
  write: createRateLimiter({ max: 150, windowMs: 60_000 }),
  teacher: createRateLimiter({ max: 20, windowMs: 60_000 }),
};

const ready = new WeakSet();
async function ensureSchema(db) {
  if (ready.has(db)) return;
  await db.batch(SCHEMA.map((sql) => db.prepare(sql)));
  ready.add(db);
}

const fail = (error, status = 400) => json({ ok: false, error }, status);

/** Constant-time string compare, so response time does not leak the key. */
function sameKey(supplied, expected) {
  const a = String(supplied);
  const b = String(expected);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** @returns {Response | null} null when the caller is an authorised teacher */
function teacherGate(env, request) {
  if (!env.TEACHER_KEY) return fail("teacher-not-configured", 503);
  const supplied = request.headers.get("x-teacher-key") || "";
  return sameKey(supplied, env.TEACHER_KEY) ? null : unauthorized();
}

const dayOf = (secs) => new Date(secs * 1000).toISOString().slice(0, 10);

async function liveClass(db, code, now) {
  if (!isClassCode(code)) return null;
  const row = await db
    .prepare(`SELECT code, salt, active_template, expires_at FROM class_data_class WHERE code = ?`)
    .bind(code)
    .first();
  return row && Number(row.expires_at) >= now ? row : null;
}

/** Stored options -> the template's full option set (defaults filled in). */
function parseOptions(templateId, optionsJson) {
  let stored = {};
  try {
    stored = JSON.parse(optionsJson) || {};
  } catch {
    stored = {};
  }
  const template = getTemplate(templateId);
  return template ? resolveOptions(template, stored) : {};
}

async function investigation(db, code, templateId) {
  const row = await db
    .prepare(
      `SELECT options_json, status FROM class_data_investigation
       WHERE code = ? AND template_id = ?`,
    )
    .bind(code, templateId)
    .first();
  if (!row) return null;
  return {
    templateId,
    status: row.status === "closed" ? "closed" : "open",
    options: parseOptions(templateId, row.options_json),
  };
}

const count = async (db, sql, ...binds) =>
  Number(
    (
      await db
        .prepare(sql)
        .bind(...binds)
        .first()
    )?.n,
  ) || 0;

const touch = (db, code, now) =>
  db
    .prepare(`UPDATE class_data_class SET last_active_at = ?, expires_at = ? WHERE code = ?`)
    .bind(now, now + RETENTION_SECS, code);

/** Retention sweep: classes unused for LIMITS.retentionDays are deleted whole. */
async function pruneExpired(db, now) {
  const gone = `SELECT code FROM class_data_class WHERE expires_at < ?`;
  await db.batch([
    db.prepare(`DELETE FROM class_data_entry WHERE code IN (${gone})`).bind(now),
    db.prepare(`DELETE FROM class_data_investigation WHERE code IN (${gone})`).bind(now),
    db.prepare(`DELETE FROM class_data_class WHERE expires_at < ?`).bind(now),
  ]);
}

/* ── public routes ─────────────────────────────────────────────────────────── */

async function routeInfo(db, url, now) {
  const code = normalizeClassCode(url.searchParams.get("code"));
  if (!code) return fail("bad-code");
  const klass = await liveClass(db, code, now);
  if (!klass) return notFound("no-class");
  const { results } = await db
    .prepare(
      `SELECT i.template_id, i.options_json, i.status,
              (SELECT COUNT(*) FROM class_data_entry e
                WHERE e.code = i.code AND e.template_id = i.template_id) AS n
       FROM class_data_investigation i WHERE i.code = ? ORDER BY i.rowid`,
    )
    .bind(code)
    .all();
  const investigations = (results || []).map((r) => ({
    templateId: r.template_id,
    status: r.status === "closed" ? "closed" : "open",
    options: parseOptions(r.template_id, r.options_json),
    count: Number(r.n) || 0,
  }));
  return { ok: true, code, active: klass.active_template, investigations };
}

async function routeEntries(db, url, now) {
  const code = normalizeClassCode(url.searchParams.get("code"));
  if (!code) return fail("bad-code");
  const templateId = url.searchParams.get("template") || "";
  if (!getTemplate(templateId)) return fail("bad-template");
  const klass = await liveClass(db, code, now);
  if (!klass) return notFound("no-class");
  const inv = await investigation(db, code, templateId);
  if (!inv) return notFound("no-investigation");
  const { results } = await db
    .prepare(
      `SELECT entry_id, values_json, source FROM class_data_entry
       WHERE code = ? AND template_id = ? ORDER BY rowid LIMIT ?`,
    )
    .bind(code, templateId, LIMITS.maxEntriesPerRead)
    .all();
  // Public shape: id (random, client-made), values, source. No contributor, no
  // timestamp: neither is needed to draw a chart, and each narrows who is who.
  const entries = [];
  for (const r of results || []) {
    try {
      entries.push({ id: r.entry_id, v: JSON.parse(r.values_json), s: r.source });
    } catch {
      /* a corrupt row is skipped, never fatal to the whole read */
    }
  }
  return {
    ok: true,
    templateId,
    status: inv.status,
    active: klass.active_template === templateId,
    options: inv.options,
    total: entries.length,
    entries,
  };
}

async function routeContribute(db, env, body, now) {
  const shape = validateContributionShape(body);
  if (!shape.ok) return fail(shape.error);
  const { code, templateId, entryId, clientId, source, values } = shape.value;

  const klass = await liveClass(db, code, now);
  if (!klass) return notFound("no-class");
  if (klass.active_template !== templateId) return fail("not-active", 409);
  const inv = await investigation(db, code, templateId);
  if (!inv) return notFound("no-investigation");
  if (inv.status === "closed") return fail("closed", 409);

  const checked = validateValues(templateId, inv.options, values);
  if (!checked.ok) return json({ ok: false, error: checked.error, field: checked.field }, 400);

  const template = getTemplate(templateId);
  const contributor = await contributorHash(klass.salt, env.CLASS_DATA_PEPPER || "", clientId);

  // One statement does both cap checks and the insert, so two simultaneous
  // contributions cannot both slip under a limit that only one of them fits.
  const inserted = await db
    .prepare(
      `INSERT OR IGNORE INTO class_data_entry
         (code, template_id, entry_id, contributor, values_json, source, created_at)
       SELECT ?, ?, ?, ?, ?, ?, ?
       WHERE (SELECT COUNT(*) FROM class_data_entry WHERE code = ? AND template_id = ?) < ?
         AND (SELECT COUNT(*) FROM class_data_entry
              WHERE code = ? AND template_id = ? AND contributor = ?) < ?`,
    )
    .bind(
      code,
      templateId,
      entryId,
      contributor,
      JSON.stringify(checked.values),
      source,
      now,
      code,
      templateId,
      LIMITS.maxEntriesPerInvestigation,
      code,
      templateId,
      contributor,
      template.maxPerContributor,
    )
    .run();

  const total = await count(
    db,
    `SELECT COUNT(*) AS n FROM class_data_entry WHERE code = ? AND template_id = ?`,
    code,
    templateId,
  );
  if (inserted.meta?.changes) {
    await touch(db, code, now).run();
    return { ok: true, duplicate: false, count: total };
  }
  // Nothing inserted: a resend of an entry we already hold is success; otherwise
  // say which cap said no.
  const held = await db
    .prepare(
      `SELECT 1 AS yes FROM class_data_entry WHERE code = ? AND template_id = ? AND entry_id = ?`,
    )
    .bind(code, templateId, entryId)
    .first();
  if (held) return { ok: true, duplicate: true, count: total };
  if (total >= LIMITS.maxEntriesPerInvestigation) return fail("class-full", 409);
  return fail("contributor-limit", 409);
}

/* ── teacher routes ────────────────────────────────────────────────────────── */

async function routeCreate(db, body, now) {
  const templateId = body?.templateId;
  const opts = validateOptions(templateId, body?.options);
  if (!opts.ok) return fail(opts.error);
  await pruneExpired(db, now);
  const salt = randomHex(16);
  for (let attempt = 0; attempt < 6; attempt++) {
    const bytes = new Uint8Array(CODE_BYTES);
    crypto.getRandomValues(bytes);
    const code = codeFromBytes(bytes);
    const made = await db
      .prepare(
        `INSERT OR IGNORE INTO class_data_class
           (code, salt, active_template, created_at, last_active_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(code, salt, templateId, now, now, now + RETENTION_SECS)
      .run();
    if (!made.meta?.changes) continue;
    await db
      .prepare(
        `INSERT INTO class_data_investigation (code, template_id, options_json, status, opened_at)
         VALUES (?, ?, ?, 'open', ?)`,
      )
      .bind(code, templateId, JSON.stringify(opts.options), now)
      .run();
    return { ok: true, code, templateId, options: opts.options };
  }
  return fail("no-code", 503);
}

async function routeActivate(db, body, now) {
  const code = normalizeClassCode(body?.code);
  if (!code) return fail("bad-code");
  const opts = validateOptions(body?.templateId, body?.options);
  if (!opts.ok) return fail(opts.error);
  const klass = await liveClass(db, code, now);
  if (!klass) return notFound("no-class");
  const existing = await investigation(db, code, body.templateId);
  if (!existing) {
    const held = await count(
      db,
      `SELECT COUNT(*) AS n FROM class_data_investigation WHERE code = ?`,
      code,
    );
    if (held >= LIMITS.maxInvestigationsPerClass) return fail("too-many-investigations", 409);
    await db
      .prepare(
        `INSERT INTO class_data_investigation (code, template_id, options_json, status, opened_at)
         VALUES (?, ?, ?, 'open', ?)`,
      )
      .bind(code, body.templateId, JSON.stringify(opts.options), now)
      .run();
  } else if (
    body.options !== undefined &&
    JSON.stringify(opts.options) !== JSON.stringify(existing.options)
  ) {
    // Switching an option after people have contributed would change what the
    // stored rows mean, so it is only allowed while the investigation is empty.
    // Re-sending the options it already has is not a change.
    const n = await count(
      db,
      `SELECT COUNT(*) AS n FROM class_data_entry WHERE code = ? AND template_id = ?`,
      code,
      body.templateId,
    );
    if (n > 0) return fail("options-locked", 409);
    await db
      .prepare(
        `UPDATE class_data_investigation SET options_json = ? WHERE code = ? AND template_id = ?`,
      )
      .bind(JSON.stringify(opts.options), code, body.templateId)
      .run();
  }
  await db.batch([
    db
      .prepare(`UPDATE class_data_class SET active_template = ? WHERE code = ?`)
      .bind(body.templateId, code),
    touch(db, code, now),
  ]);
  return { ok: true, code, active: body.templateId };
}

async function routeStatus(db, body, now, status) {
  const code = normalizeClassCode(body?.code);
  if (!code) return fail("bad-code");
  if (!getTemplate(body?.templateId)) return fail("bad-template");
  if (!(await liveClass(db, code, now))) return notFound("no-class");
  const inv = await investigation(db, code, body.templateId);
  if (!inv) return notFound("no-investigation");
  await db.batch([
    db
      .prepare(
        `UPDATE class_data_investigation SET status = ?, closed_at = ?
         WHERE code = ? AND template_id = ?`,
      )
      .bind(status, status === "closed" ? now : null, code, body.templateId),
    touch(db, code, now),
  ]);
  return { ok: true, code, templateId: body.templateId, status };
}

async function routeExport(db, url, now) {
  const code = normalizeClassCode(url.searchParams.get("code"));
  if (!code) return fail("bad-code");
  const templateId = url.searchParams.get("template") || "";
  if (!getTemplate(templateId)) return fail("bad-template");
  if (!(await liveClass(db, code, now))) return notFound("no-class");
  const inv = await investigation(db, code, templateId);
  if (!inv) return notFound("no-investigation");
  const { results } = await db
    .prepare(
      `SELECT values_json, source, created_at FROM class_data_entry
       WHERE code = ? AND template_id = ? ORDER BY rowid`,
    )
    .bind(code, templateId)
    .all();
  const entries = [];
  for (const r of results || []) {
    try {
      entries.push({
        values: JSON.parse(r.values_json),
        source: r.source,
        day: dayOf(r.created_at),
      });
    } catch {
      /* skip a corrupt row */
    }
  }
  if (url.searchParams.get("format") === "json") {
    return { ok: true, templateId, options: inv.options, status: inv.status, entries };
  }
  return new Response(entriesToCsv(templateId, inv.options, entries), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="class-investigation-${templateId}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

async function routePurge(db, body, now) {
  const code = normalizeClassCode(body?.code);
  if (!code) return fail("bad-code");
  // Deleting is irreversible, so the caller must repeat the code it means.
  if (normalizeClassCode(body?.confirm) !== code) return fail("confirm-required");
  if (!(await liveClass(db, code, now))) return notFound("no-class");
  if (body.templateId !== undefined) {
    if (!getTemplate(body.templateId)) return fail("bad-template");
    const removed = await count(
      db,
      `SELECT COUNT(*) AS n FROM class_data_entry WHERE code = ? AND template_id = ?`,
      code,
      body.templateId,
    );
    await db
      .prepare(`DELETE FROM class_data_entry WHERE code = ? AND template_id = ?`)
      .bind(code, body.templateId)
      .run();
    return { ok: true, scope: "investigation", removed };
  }
  const removed = await count(
    db,
    `SELECT COUNT(*) AS n FROM class_data_entry WHERE code = ?`,
    code,
  );
  await db.batch([
    db.prepare(`DELETE FROM class_data_entry WHERE code = ?`).bind(code),
    db.prepare(`DELETE FROM class_data_investigation WHERE code = ?`).bind(code),
    db.prepare(`DELETE FROM class_data_class WHERE code = ?`).bind(code),
  ]);
  return { ok: true, scope: "class", removed };
}

/* ── dispatch ──────────────────────────────────────────────────────────────── */

const PUBLIC_GET = new Set(["info", "entries"]);
const TEACHER_POST = new Set(["create", "activate", "close", "reopen", "purge"]);

export const onRequest = handler({
  methods: ["GET", "POST"],
  maxBodyBytes: LIMITS.maxBodyBytes,
  rateLimit: { max: 1200, windowMs: 60_000 },
  async handle({ request, env, params, body }) {
    const route = (Array.isArray(params?.path) ? params.path.join("/") : params?.path || "")
      .toLowerCase()
      .replace(/^\/+|\/+$/g, "");
    const method = request.method.toUpperCase();
    const db = env?.DB;

    if (route === "health") return { ok: true, backend: "d1", d1: Boolean(db) };
    if (!db) return fail("class-data-unavailable", 503);

    const isTeacherRoute = TEACHER_POST.has(route) || route === "export";
    const ip = clientIp(request);
    if (isTeacherRoute) {
      if (throttle.teacher(ip)) return tooManyRequests();
      const denied = teacherGate(env, request);
      if (denied) return denied;
    } else if (route === "contribute") {
      if (throttle.write(ip)) return tooManyRequests();
    } else if (throttle.read(ip)) {
      return tooManyRequests();
    }

    const now = Math.floor(Date.now() / 1000);
    const url = new URL(request.url);

    if (PUBLIC_GET.has(route) && method === "GET") {
      await ensureSchema(db);
      return route === "info" ? routeInfo(db, url, now) : routeEntries(db, url, now);
    }
    if (route === "contribute" && method === "POST") {
      await ensureSchema(db);
      return routeContribute(db, env, body, now);
    }
    if (route === "export" && method === "GET") {
      await ensureSchema(db);
      return routeExport(db, url, now);
    }
    if (TEACHER_POST.has(route) && method === "POST") {
      await ensureSchema(db);
      if (route === "create") return routeCreate(db, body, now);
      if (route === "activate") return routeActivate(db, body, now);
      if (route === "purge") return routePurge(db, body, now);
      return routeStatus(db, body, now, route === "close" ? "closed" : "open");
    }
    return notFound("unknown route");
  },
});
