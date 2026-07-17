/* =============================================================================
 * Learning Supports v2 backend — Cloudflare Pages Function (optional, opt-in)
 * -----------------------------------------------------------------------------
 * Per-student IEP / WIDA roster + assignment store. Lets a teacher record which
 * accommodations (from a fixed allow-list) and WIDA proficiency level apply to
 * each student, keyed by (section, initials). Student-facing pages read their
 * own row (public) so lessons can auto-enable the right supports; the roster
 * editor is teacher-gated.
 *
 * Routes (catch-all under /api/supports):
 *   GET    /api/supports/health                       -> { ok, d1 }               PUBLIC
 *   GET    /api/supports/sections                     -> { ok, sections }         PUBLIC*
 *   GET    /api/supports/for?section=&initials=       -> { ok, items }            PUBLIC*
 *   GET    /api/supports/roster[?section=]            -> { ok, roster }           TEACHER
 *   POST   /api/supports/roster { entries:[...] }      -> { ok, count }            TEACHER
 *   DELETE /api/supports/roster { section, initials }  -> { ok }                   TEACHER
 *
 * Storage: Cloudflare D1, bound as `env.DB`.
 *
 * PRIVACY (release-blocking invariant):
 *   Public reads never expose WIDA proficiency levels or any IEP framing.
 *   `/for` resolves the student's WIDA bundle SERVER-SIDE and returns only a
 *   flat list of generic tool keys (e.g. "calculator", "vocab") — the same
 *   vocabulary any UDL toolbar uses. The full (widaLevel, iepItems) record is
 *   only readable through the TEACHER-gated /roster. Public reads are also
 *   per-IP rate-limited (mirroring /api/progress/load) so the roster cannot be
 *   bulk-enumerated.
 *
 * SAFETY / GRACEFUL DEGRADATION (mirrors functions/api/progress/[[path]].js):
 *   - No D1 binding on a PUBLIC read -> return the empty shape with ok:true so
 *     lessons keep working (fail-open), never a 500.
 *   - TEACHER routes: no TEACHER_KEY env -> 503 not-configured; wrong/missing
 *     key -> 401 unauthorized; no D1 -> 503 backend-not-configured.
 *   - Bad input is sanitized and skipped, never a 500.
 * ========================================================================== */

const JSON_HEADERS = {
  "Content-Type": "application/json",
  // Assignments must reach student devices promptly — never let a browser or
  // intermediary cache a stale roster/assignment read.
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-teacher-key",
};

function json(obj, status = 200, extraHeaders) {
  const headers = extraHeaders ? { ...JSON_HEADERS, ...extraHeaders } : JSON_HEADERS;
  return new Response(JSON.stringify(obj), { status, headers });
}

// Fixed allow-list of accommodation keys. Anything not here is dropped on write.
const ALLOW_LIST = [
  "tts",
  "text-large",
  "contrast",
  "tint",
  "ruler",
  "focus",
  "comfort",
  "vocab",
  "example",
  "model",
  "misconceptions",
  "frames",
  "notepad",
  "calculator",
  "numberline",
  "multchart",
  "placevalue",
  "translate",
  "fewer",
  "time",
  "checklist",
  "break",
  "checkin",
  // IEP/ESOL document lines that duplicate a tool onto a second checkbox.
  // Each resolves to an existing dock tool (see supports-schema.js `tool`);
  // must stay lockstep with the schema's `interactive` keys.
  "iep-tts",
  "iep-calc-noncalc",
  "iep-word-bank",
  "iep-sentence-starters",
  "iep-visual-aids",
  "iep-preteach-vocab",
  "iep-manipulatives",
  "iep-writing-frame",
  "esol-word-bank",
  // Teacher planning flags (no student tool; resolve to nothing student-side,
  // like the legacy `fewer`/`time` flags). Whitelisted so the roster can persist
  // them; required by the schema ⊆ ALLOW_LIST lockstep validator.
  "iep-redirect",
  "iep-graphic-organizer",
  "iep-small-group",
  "iep-reduce-distract-self",
  "iep-reduce-distract-others",
  "iep-monitor-test",
  "iep-chunk-text",
  "iep-repeat-directions",
  "iep-check-understanding",
  "iep-chunk-repeat-verbal",
  "iep-verbal-visual-choices",
  "iep-alt-demonstrate",
  "iep-monitor-independent",
  "iep-pictures-support",
  "iep-paraphrase",
  "iep-preferential-seating",
  "iep-highlighter",
  "iep-ask-assistance",
  "iep-cues",
  "iep-reminder-rules",
  "iep-positive-praise",
  "iep-movement",
  "iep-multisensory",
  "iep-extra-time",
  "iep-immediate-feedback",
  "esol-extended-time",
  "esol-repeated-readings",
  "esol-leveled-text",
  "esol-selected-portion",
  "esol-read-aloud-selected",
  "esol-graphic-organizers",
  "esol-frequent-checks",
  "esol-reduced-noise",
  "esol-allow-home-language",
  "esol-preferential-seating",
  "esol-simplify-language",
  "esol-model-directions",
  "esol-reword-directions",
];
const ALLOW_SET = new Set(ALLOW_LIST);

// WIDA level -> pre-checked tool bundle. MUST stay in lockstep with
// assets/learning-supports/supports-schema.js widaLevels (enforced by
// tools/validate-learning-supports.mjs). Resolved server-side so the public
// /for response carries only generic tool keys, never the level itself.
const WIDA_BUNDLES = {
  1: ["translate", "vocab", "frames", "tts"],
  2: ["frames", "vocab", "tts"],
  3: ["frames", "vocab", "notepad"],
  4: ["vocab", "frames"],
  5: ["vocab"],
  6: [],
};

function resolveItemsServer(widaLevel, iepItems) {
  const seen = new Set(WIDA_BUNDLES[Number(widaLevel)] || []);
  for (const k of iepItems || []) if (ALLOW_SET.has(k)) seen.add(k);
  return [...seen];
}

// --- public-read rate limiting (mirrors /api/progress load_miss guard) ------
// Students authenticate with nothing, so enumeration is throttled per IP:
// lookups of NON-EXISTENT (section, initials) rows count as misses; every
// /sections read counts lightly. Real classes (one NAT) stay far under caps.
const GUARD_WINDOW_SEC = 300; // 5-minute window
const GUARD_MAX_HITS = 60; // throttled events per IP per window before 429

function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "?";
}
function guardBucket() {
  return Math.floor(Date.now() / 1000 / GUARD_WINDOW_SEC);
}
async function ensureGuardSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS supports_guard (
        ip     TEXT NOT NULL,
        bucket INTEGER NOT NULL,
        hits   INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (ip, bucket)
      )`,
    )
    .run();
}
async function guardCount(db, ip, bucket) {
  const row = await db
    .prepare("SELECT hits FROM supports_guard WHERE ip = ? AND bucket = ?")
    .bind(ip, bucket)
    .first();
  return row ? Number(row.hits) || 0 : 0;
}
async function noteGuardHit(db, ip, bucket) {
  await db
    .prepare(
      `INSERT INTO supports_guard (ip, bucket, hits) VALUES (?, ?, 1)
         ON CONFLICT(ip, bucket) DO UPDATE SET hits = hits + 1`,
    )
    .bind(ip, bucket)
    .run();
  try {
    await db
      .prepare("DELETE FROM supports_guard WHERE bucket < ?")
      .bind(bucket - 1)
      .run();
  } catch (e) {
    /* prune is best-effort */
  }
}

// --- sanitizers (never throw) ----------------------------------------------
function cleanSection(v) {
  return typeof v === "string" || typeof v === "number" ? String(v).trim().slice(0, 8) : "";
}
function cleanInitials(v) {
  return typeof v === "string" || typeof v === "number"
    ? String(v).trim().toUpperCase().slice(0, 6)
    : "";
}
function cleanWida(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 0;
  return Math.min(6, Math.max(0, n));
}
// Filter an array of keys to the allow-list, de-dupe, JSON string for storage.
function cleanIepItemsJson(v) {
  if (!Array.isArray(v)) return "[]";
  const seen = new Set();
  for (const item of v) {
    const key = typeof item === "string" ? item.trim() : "";
    if (ALLOW_SET.has(key)) seen.add(key);
  }
  return JSON.stringify([...seen]);
}
// Parse stored JSON back to an array on read; tolerate corruption.
function parseIepItems(s) {
  try {
    const arr = JSON.parse(s || "[]");
    return Array.isArray(arr) ? arr.filter((x) => ALLOW_SET.has(x)) : [];
  } catch (e) {
    return [];
  }
}
// Accept an ISO string from the body if present, else mint one server-side so
// every write carries an audit timestamp even from older clients.
function cleanUpdatedAt(v) {
  if (typeof v === "string" && v) return v.slice(0, 30);
  return new Date().toISOString();
}

// Assigned lessons: canonical lesson ids only (e.g. "3-2"), de-duped, capped.
// Lesson ids carry no accommodation information, so they may ride the public
// /for read alongside the generic tool keys.
const LESSON_ID_RE = /^\d+-\d+(?:-group[12]|-catchup)?$/;
function cleanLessonsJson(v) {
  if (!Array.isArray(v)) return "[]";
  const seen = new Set();
  for (const item of v.slice(0, 96)) {
    const id = typeof item === "string" ? item.trim() : "";
    if (LESSON_ID_RE.test(id)) seen.add(id);
  }
  return JSON.stringify([...seen]);
}
function parseLessons(s) {
  try {
    const arr = JSON.parse(s || "[]");
    return Array.isArray(arr)
      ? arr.filter((x) => typeof x === "string" && LESSON_ID_RE.test(x))
      : [];
  } catch (e) {
    return [];
  }
}

// Once per isolate: CREATE covers fresh databases; the ALTER migrates a
// pre-v2.3 table (duplicate-column error is expected and swallowed).
let schemaEnsured = false;
async function ensureSchema(db) {
  if (schemaEnsured) return;
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS supports_roster (
        section    TEXT NOT NULL,
        initials   TEXT NOT NULL,
        wida_level INTEGER DEFAULT 0,
        iep_items  TEXT DEFAULT '[]',
        lessons    TEXT DEFAULT '[]',
        updated_at TEXT,
        PRIMARY KEY (section, initials)
      )`,
    )
    .run();
  try {
    await db.prepare("ALTER TABLE supports_roster ADD COLUMN lessons TEXT DEFAULT '[]'").run();
  } catch (e) {
    /* column already exists */
  }
  schemaEnsured = true;
}

// Gating mirrors progress: no key configured -> not-configured; else compare.
function teacherAuthorized(env, request, url) {
  if (!env.TEACHER_KEY) return "not-configured";
  const key = url.searchParams.get("key") || request.headers.get("x-teacher-key") || "";
  return key === env.TEACHER_KEY ? "ok" : "unauthorized";
}

function rowToEntry(r) {
  return {
    section: r.section,
    initials: r.initials,
    widaLevel: Number(r.wida_level) || 0,
    iepItems: parseIepItems(r.iep_items),
    lessons: parseLessons(r.lessons),
    updatedAt: r.updated_at || null,
  };
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();
  const url = new URL(request.url);

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  // params.path is an array of the segments after /api/supports/.
  const seg = (params.path && params.path[0]) || "";

  // Health works even without D1 so the client can probe availability.
  if (seg === "health") {
    return json({ ok: true, d1: !!env.DB });
  }

  // --- PUBLIC reads --------------------------------------------------------
  // Fail-open: no D1 -> return the empty shape with ok:true, never 500.
  if (seg === "sections" && method === "GET") {
    if (!env.DB) return json({ ok: true, sections: {} });
    try {
      await ensureSchema(env.DB);
      await ensureGuardSchema(env.DB);
      // Every /sections read counts against the window (it enumerates initials).
      const ip = clientIp(request);
      const bucket = guardBucket();
      if ((await guardCount(env.DB, ip, bucket)) >= GUARD_MAX_HITS) {
        return json({ ok: false, error: "rate-limited" }, 429);
      }
      await noteGuardHit(env.DB, ip, bucket);
      const res = await env.DB.prepare(
        "SELECT section, initials FROM supports_roster ORDER BY section, initials",
      ).all();
      const sections = {};
      for (const r of res.results || []) {
        (sections[r.section] || (sections[r.section] = [])).push(r.initials);
      }
      for (const k of Object.keys(sections)) sections[k].sort();
      return json({ ok: true, sections });
    } catch (e) {
      return json({ ok: true, sections: {} });
    }
  }

  if (seg === "for" && method === "GET") {
    const section = cleanSection(url.searchParams.get("section"));
    const initials = cleanInitials(url.searchParams.get("initials"));
    // PRIVACY: public response is a flat generic tool list only — the WIDA
    // level and the IEP item split never leave the teacher-gated /roster.
    // items:null = "backend can't answer" (client keeps current state);
    // items:[]  = confirmed "nothing assigned" (client may clear).
    if (!env.DB || !section || !initials) {
      return json({ ok: true, items: null, lessons: null });
    }
    try {
      await ensureSchema(env.DB);
      await ensureGuardSchema(env.DB);
      const ip = clientIp(request);
      const bucket = guardBucket();
      if ((await guardCount(env.DB, ip, bucket)) >= GUARD_MAX_HITS) {
        return json({ ok: false, error: "rate-limited" }, 429);
      }
      const row = await env.DB.prepare(
        "SELECT wida_level, iep_items, lessons FROM supports_roster WHERE section = ? AND initials = ?",
      )
        .bind(section, initials)
        .first();
      if (!row) {
        // Unknown (section, initials) — count the miss to throttle enumeration.
        await noteGuardHit(env.DB, ip, bucket);
        return json({ ok: true, items: [], lessons: [] });
      }
      return json({
        ok: true,
        items: resolveItemsServer(row.wida_level, parseIepItems(row.iep_items)),
        // Lesson ids only — generic navigation data, no accommodation info.
        lessons: parseLessons(row.lessons),
      });
    } catch (e) {
      return json({ ok: true, items: null, lessons: null });
    }
  }

  // --- TEACHER roster (read / upsert / delete) -----------------------------
  if (seg === "roster") {
    const auth = teacherAuthorized(env, request, url);
    if (auth === "not-configured")
      return json(
        {
          ok: false,
          error: "not-configured",
          message: "Set the TEACHER_KEY env var on the Pages project to enable the roster.",
        },
        503,
      );
    if (auth === "unauthorized") return json({ ok: false, error: "unauthorized" }, 401);
    if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503);

    try {
      await ensureSchema(env.DB);

      if (method === "GET") {
        const filter = cleanSection(url.searchParams.get("section"));
        const res = filter
          ? await env.DB.prepare(
              "SELECT * FROM supports_roster WHERE section = ? ORDER BY initials",
            )
              .bind(filter)
              .all()
          : await env.DB.prepare("SELECT * FROM supports_roster ORDER BY section, initials").all();
        return json({ ok: true, roster: (res.results || []).map(rowToEntry) });
      }

      if (method === "POST") {
        // Reject absurd payloads before parsing (CPU/memory guard).
        const len = Number(request.headers.get("content-length") || 0);
        if (len > 512 * 1024) return json({ ok: false, error: "payload-too-large" }, 413);
        const body = await request.json().catch(() => null);
        const entries = (body && Array.isArray(body.entries) && body.entries) || [];
        // Field-presence-aware upsert: an entry that OMITS widaLevel/iepItems/
        // lessons (roster maintenance — import, rename, add-initials) must NOT
        // clobber an existing assignment back to defaults. Only fields
        // explicitly sent overwrite; flags 6/7/9 mark presence.
        const stmt = env.DB.prepare(
          `INSERT INTO supports_roster (section, initials, wida_level, iep_items, updated_at, lessons)
             VALUES (?1, ?2, ?3, ?4, ?5, ?8)
           ON CONFLICT(section, initials) DO UPDATE SET
             wida_level = CASE WHEN ?6 = 1 THEN excluded.wida_level ELSE supports_roster.wida_level END,
             iep_items  = CASE WHEN ?7 = 1 THEN excluded.iep_items  ELSE supports_roster.iep_items  END,
             lessons    = CASE WHEN ?9 = 1 THEN excluded.lessons    ELSE supports_roster.lessons    END,
             updated_at = COALESCE(excluded.updated_at, supports_roster.updated_at)`,
        );
        const batch = [];
        for (const e of entries.slice(0, 2000)) {
          if (!e || typeof e !== "object") continue;
          const section = cleanSection(e.section);
          const initials = cleanInitials(e.initials);
          if (!section || !initials) continue; // skip entries missing either key
          const hasWida = e.widaLevel !== undefined && e.widaLevel !== null;
          const hasIep = Array.isArray(e.iepItems);
          const hasLessons = Array.isArray(e.lessons);
          batch.push(
            stmt.bind(
              section,
              initials,
              cleanWida(e.widaLevel),
              cleanIepItemsJson(e.iepItems),
              cleanUpdatedAt(e.updatedAt),
              hasWida ? 1 : 0,
              hasIep ? 1 : 0,
              cleanLessonsJson(e.lessons),
              hasLessons ? 1 : 0,
            ),
          );
        }
        if (batch.length) await env.DB.batch(batch);
        return json({ ok: true, count: batch.length });
      }

      if (method === "DELETE") {
        const body = await request.json().catch(() => null);
        const section = cleanSection(body && body.section);
        const initials = cleanInitials(body && body.initials);
        if (section && initials) {
          await env.DB.prepare("DELETE FROM supports_roster WHERE section = ? AND initials = ?")
            .bind(section, initials)
            .run();
        }
        return json({ ok: true });
      }

      return json({ ok: false, error: "method-not-allowed" }, 405);
    } catch (err) {
      return json({ ok: false, error: "server-error", message: String(err) }, 500);
    }
  }

  return json({ ok: false, error: "not-found", route: seg }, 404);
}
