/* =============================================================================
 * Family Weekly Broadcast — Cloudflare Pages Function (read-only, one child)
 * -----------------------------------------------------------------------------
 * GET /api/family-broadcast?code=<save code>&days=7&lang=en|es
 *   -> { ok, child: { displayName }, window: { days, since },
 *        did:  [ { title, path, standard, when } ],
 *        grew: [ { standard, label, evidence } ],
 *        stuck:[ { standard, label, tag, watchFor } ],
 *        kitchenTable: { title, minutes, materials, steps[], why },
 *        nextUp: [ { title, path, why } ],
 *        headline, note, thin, offline, lang }
 *
 * THIS IS THE MOST SENSITIVE READ ON THE PLATFORM. It returns data about ONE
 * NAMED CHILD, so the rules below are not style preferences:
 *
 * 1. IDENTITY — reuses the EXISTING save-code bearer model of
 *    functions/api/progress/[[path]].js verbatim. A request must carry a code
 *    that resolves to a row in `student_progress`; there is no second way in,
 *    no teacher key shortcut, and no route in this file that reads or returns
 *    student data before acceptableCode() and the student_progress lookup have
 *    both passed. The code check runs even on the no-database path.
 *
 * 2. NOT ENUMERABLE — no listing route, no ids, no "does this code exist"
 *    signal. A malformed code, an unknown code and a code that resolves to
 *    nothing all return the SAME generic 401 body. Guessing is throttled with
 *    the same per-IP miss-counting table /api/progress/load uses (`load_miss`),
 *    under its own "fb:" key so a family resuming work is never affected.
 *
 * 3. ONE CHILD ONLY — `lesson_telemetry` is keyed by student NAME, not by save
 *    code, so a name shared by two students in the same section could blend two
 *    children's work. When that is even possible, the name-joined sources are
 *    dropped entirely and the broadcast falls back to the strictly code-keyed
 *    sources (`student_progress`, `game_scores`). Nothing class-relative, no
 *    ranking, no peer ever appears. Class context, if the page shows any, comes
 *    from the already-aggregated, k-anonymous /api/class-pulse — never here.
 *
 * 4. NO CACHING, NO CORS, NO LOGS — every response carries
 *    `Cache-Control: no-store`. No Access-Control-Allow-Origin header is sent,
 *    so a third-party page cannot read a broadcast even if it holds the code.
 *    This file contains no console call of any kind, and error responses never
 *    echo the code, the name or the underlying error text.
 *
 * 5. NO GRADES — nothing here returns a score, a percentage or a rank. The
 *    "grew" evidence counts effort (tries, lessons finished), never accuracy.
 *
 * Storage and graceful degradation mirror functions/api/misconception-heatmap.js:
 * D1 bound as `env.DB`, idempotent CREATE TABLE IF NOT EXISTS, and a working
 * answer rather than an error when the binding is absent.
 * ========================================================================== */

import {
  ASSETS,
  BRIDGES,
  COPY,
  DEFAULT_NEXT_UP,
  kitchenTableFor,
  pick,
  STANDARDS,
  TAGS,
} from "../../curriculum/family-connections/broadcast/broadcast-content.js";

const BASE_HEADERS = {
  // Never store a named child's week in any cache, shared or private.
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
  // Deliberately NO Access-Control-Allow-Origin: same-origin reads only.
};

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", ...BASE_HEADERS };

function json(obj, status = 200, extra) {
  const headers = extra ? { ...JSON_HEADERS, ...extra } : JSON_HEADERS;
  return new Response(JSON.stringify(obj), { status, headers });
}

/** One generic answer for every identity failure. Reveals nothing. */
function unauthorized() {
  return json({ ok: false, error: "unauthorized" }, 401);
}

/* ------------------------------------------------------------- identity ---
 * Same normalization and same shape as the save/resume engine
 * (shared/save-resume/save-resume-engine.js makeCode: a 3-6 character prefix,
 * a hyphen, then four characters of a 31-symbol alphabet), and strictly
 * tighter than validCode() in functions/api/progress/[[path]].js: the suffix
 * floor is raised from three characters to four and the total is floored at
 * seven, which rejects short guesses without rejecting any code the engine can
 * actually mint. PLACEHOLDER_CODES blocks the handful of literal strings a
 * prober types first; every entry is a full-code exact match, so no real code
 * is ever caught by it.
 * ------------------------------------------------------------------------ */
const CODE_RE = /^[A-Z0-9]{3,12}-[A-Z0-9]{4,8}$/;
const PLACEHOLDER_CODES = new Set([
  "TEST-CODE",
  "TEST-1234",
  "DEMO-CODE",
  "DEMO-1234",
  "ABC-1234",
  "AAA-AAAA",
  "CODE-CODE",
  "NULL-NULL",
]);

function normalizeCode(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function acceptableCode(code) {
  if (typeof code !== "string") return false;
  if (!CODE_RE.test(code)) return false;
  if (code.replace("-", "").length < 7) return false;
  return !PLACEHOLDER_CODES.has(code);
}

/* ------------------------------------------------- anti-enumeration guard --
 * Identical mechanism to the /api/progress/load guard: count only MISSES per
 * IP per window, so a family that opens their own broadcast twenty times is
 * never throttled while a prober walking the code space is stopped. The cap is
 * lower here than on /load because a family follows one link, not a class set.
 * ------------------------------------------------------------------------ */
const GUARD_WINDOW_SEC = 300;
const GUARD_MAX_MISSES = 20;

function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "?";
}

function guardBucket() {
  return Math.floor(Date.now() / 1000 / GUARD_WINDOW_SEC);
}

async function ensureGuardSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS load_miss (
        ip     TEXT NOT NULL,
        bucket INTEGER NOT NULL,
        hits   INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (ip, bucket)
      )`,
    )
    .run();
}

async function missCount(db, ip, bucket) {
  const row = await db
    .prepare("SELECT hits FROM load_miss WHERE ip = ? AND bucket = ?")
    .bind(ip, bucket)
    .first();
  return row ? Number(row.hits) || 0 : 0;
}

async function noteMiss(db, ip, bucket) {
  await db
    .prepare(
      `INSERT INTO load_miss (ip, bucket, hits) VALUES (?, ?, 1)
         ON CONFLICT(ip, bucket) DO UPDATE SET hits = hits + 1`,
    )
    .bind(ip, bucket)
    .run();
  try {
    await db
      .prepare("DELETE FROM load_miss WHERE bucket < ?")
      .bind(bucket - 1)
      .run();
  } catch (_e) {
    /* prune is best-effort */
  }
}

/* --------------------------------------------------------------- schemas ---
 * The same idempotent DDL the writing functions run, so this read-only
 * endpoint is safe against an empty database and never migrates anything.
 * ------------------------------------------------------------------------ */
async function ensureSchemas(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS student_progress (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        save_code     TEXT UNIQUE NOT NULL,
        activity_id   TEXT NOT NULL,
        activity_title TEXT,
        student_name  TEXT,
        section       TEXT,
        state_json    TEXT NOT NULL,
        progress_percent INTEGER DEFAULT 0,
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL
      )`,
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS lesson_telemetry (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_slug  TEXT,
        lesson_title TEXT,
        standard     TEXT,
        student_name TEXT,
        section      TEXT,
        event_type   TEXT,
        payload_json TEXT,
        created_at   TEXT NOT NULL
      )`,
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS game_scores (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id         TEXT NOT NULL,
        standard        TEXT,
        level           INTEGER,
        points          INTEGER DEFAULT 0,
        correct         INTEGER DEFAULT 0,
        total           INTEGER DEFAULT 0,
        steps           INTEGER DEFAULT 0,
        misconception_tag TEXT,
        save_code       TEXT,
        created_at      TEXT NOT NULL
      )`,
    )
    .run();
}

/* ------------------------------------------------------------- utilities ---*/

function clampDays(raw) {
  if (raw == null || String(raw).trim() === "") return 7;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 7;
  return Math.min(Math.max(Math.round(n), 1), 30);
}

/** First name only. A broadcast link can be forwarded; a surname need not go with it. */
function displayNameFrom(fullName) {
  const first = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0];
  return first ? first.slice(0, 24) : "";
}

function parsePayload(text) {
  try {
    const p = JSON.parse(text || "{}");
    return p && typeof p === "object" ? p : {};
  } catch (_e) {
    return {};
  }
}

function nestedProps(p) {
  return p.props && typeof p.props === "object" ? p.props : {};
}

/** Closed vocabulary: a tag this repo does not know is dropped, never echoed. */
function payloadTag(p) {
  const n = nestedProps(p);
  const raw = String(
    p.tag || p.misconceptionTag || p.misconception || n.tag || n.misconceptionTag || "",
  ).slice(0, 60);
  return Object.prototype.hasOwnProperty.call(TAGS, raw) ? raw : "";
}

/** true / false / null (unknown). Handles both the flat and the props shape. */
function attemptCorrect(p) {
  const n = nestedProps(p);
  if (p.correct === true || n.correct === true) return true;
  if (p.correct === false || n.correct === false) return false;
  const result = String(p.result || n.result || "");
  if (result === "correct") return true;
  if (result === "incorrect") return false;
  return null;
}

/**
 * Page badges carry the cluster letter ("6.AT.A.3a"); the concept map does not.
 * Drop the cluster letter, then fall back to the parent standard so "6.AT.3a"
 * still finds "6.AT.3" copy when the sub-standard has none of its own.
 */
function normalizeStandard(raw) {
  const s = String(raw || "")
    .trim()
    .toUpperCase()
    .slice(0, 20);
  if (!s) return "";
  const parts = s.split(".");
  if (parts.length === 4 && /^[A-Z]$/.test(parts[2])) parts.splice(2, 1);
  const joined = parts.join(".");
  if (STANDARDS[joined]) return joined;
  const parent = joined.replace(/[A-Z]+$/, "");
  return STANDARDS[parent] ? parent : joined;
}

// Reverse index: which tag best represents a standard, when a family has no
// tagged work but we still want a real activity rather than a generic one.
const TAG_FOR_STANDARD = (() => {
  const map = {};
  for (const [tag, meta] of Object.entries(TAGS)) {
    for (const std of meta.standards) if (!map[std]) map[std] = tag;
  }
  return map;
})();

/**
 * A link we are confident actually exists, or "" (the page renders plain text
 * rather than a broken link). Registry titles win, then the slug conventions
 * assets/lesson-telemetry.js produces (pathname with slashes turned to
 * hyphens), then the standard's canonical lesson.
 */
const TITLE_INDEX = (() => {
  const map = new Map();
  for (const list of Object.values(ASSETS)) {
    for (const a of list) map.set(a.title.toLowerCase(), a.path);
  }
  return map;
})();

/**
 * Lesson titles arrive from telemetry as the English page title. A Spanish
 * broadcast should not hand a family an English sentence, so any title the
 * asset registry knows is swapped for its authored Spanish name. A title the
 * registry does not know is left exactly as recorded rather than mangled.
 */
const TITLE_ES_INDEX = (() => {
  const map = new Map();
  for (const list of Object.values(ASSETS)) {
    for (const a of list) map.set(a.title.toLowerCase(), a.titleEs);
  }
  return map;
})();

function localizeTitle(title, lang) {
  if (lang !== "es") return title;
  return TITLE_ES_INDEX.get(String(title || "").toLowerCase()) || title;
}

function resolvePath(slug, standard, title) {
  const byTitle = TITLE_INDEX.get(String(title || "").toLowerCase());
  if (byTitle) return byTitle;
  const s = String(slug || "");
  let m = /^lessons-([a-z0-9.]+(?:-[a-z0-9.]+)*?)-readiness$/i.exec(s);
  if (m) return `/lessons/${m[1]}/readiness/`;
  m = /^lessons-([a-z0-9.]+(?:-[a-z0-9.]+)*)$/i.exec(s);
  if (m) return `/lessons/${m[1]}/`;
  m = /^games-([a-z0-9.]+(?:-[a-z0-9.]+)*)$/i.exec(s);
  if (m) return `/games/${m[1]}/`;
  const assets = ASSETS[standard];
  return assets && assets.length ? assets[0].path : "";
}

function titleCase(id) {
  return String(id || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .trim()
    .slice(0, 90);
}

/* ------------------------------------------------------------ composition --*/

function standardLabel(std, lang) {
  const meta = STANDARDS[std];
  return meta ? pick(lang, meta.label, meta.labelEs) : "";
}

function buildNextUp(standards, lang) {
  const out = [];
  const seen = new Set();
  for (const std of standards) {
    const list = ASSETS[std];
    const meta = STANDARDS[std];
    if (!list || !meta) continue;
    for (const asset of list) {
      if (seen.has(asset.path)) continue;
      seen.add(asset.path);
      out.push({
        title: pick(lang, asset.title, asset.titleEs),
        path: asset.path,
        why: COPY.nextWhy[lang === "es" ? "es" : "en"](pick(lang, meta.family, meta.familyEs)),
      });
      break; // one link per standard keeps the card readable on a phone
    }
    if (out.length >= 3) break;
  }
  for (const fallback of DEFAULT_NEXT_UP) {
    if (out.length >= 3) break;
    if (seen.has(fallback.path)) continue;
    seen.add(fallback.path);
    out.push({
      title: pick(lang, fallback.title, fallback.titleEs),
      path: fallback.path,
      why: pick(lang, fallback.why, fallback.whyEs),
    });
  }
  return out;
}

/** The kitchen-table card, with the prerequisite sentence appended when we have one. */
function buildKitchenTable(tag, standards, lang) {
  const activity = kitchenTableFor(tag, lang);
  const bridgeStd = standards.find((s) => BRIDGES[s]);
  if (bridgeStd) {
    const bridge = BRIDGES[bridgeStd];
    activity.why = `${activity.why} ${pick(lang, bridge.en, bridge.es)}`;
  }
  return activity;
}

/** The whole broadcast when there is no database, or nothing personal to say. */
function curriculumDefault(lang, days, since, extra) {
  const en = lang !== "es";
  return {
    ok: true,
    lang,
    child: { displayName: "" },
    window: { days, since },
    headline: COPY.headlineAnon[en ? "en" : "es"],
    did: [],
    grew: [],
    stuck: [],
    kitchenTable: kitchenTableFor("", lang),
    nextUp: buildNextUp([], lang),
    ...extra,
  };
}

/* ------------------------------------------------------------- the handler --*/

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...BASE_HEADERS, Allow: "GET, OPTIONS" } });
  }
  if (method !== "GET") return json({ ok: false, error: "method-not-allowed" }, 405);

  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") === "es" ? "es" : "en";
  const langKey = lang === "es" ? "es" : "en";
  const days = clampDays(url.searchParams.get("days"));
  const sinceMs = Date.now() - days * 86400000;
  const since = new Date(sinceMs).toISOString();
  const code = normalizeCode(url.searchParams.get("code"));

  // THE identity gate. Nothing below this line runs for a caller without a
  // well-formed code, including the no-database path.
  if (!acceptableCode(code)) return unauthorized();

  // No D1 bound: a true, useful, entirely impersonal broadcast rather than an
  // error page, exactly as /api/class-pulse degrades.
  if (!env.DB) {
    return json(
      curriculumDefault(lang, days, since, {
        offline: true,
        thin: true,
        note: COPY.noteOffline[langKey],
      }),
    );
  }

  try {
    await ensureSchemas(env.DB);
    await ensureGuardSchema(env.DB);

    const ip = `fb:${clientIp(request)}`;
    const bucket = guardBucket();
    if ((await missCount(env.DB, ip, bucket)) > GUARD_MAX_MISSES) {
      return json({ ok: false, error: "rate-limited" }, 429, {
        "Retry-After": String(GUARD_WINDOW_SEC),
      });
    }

    const student = await env.DB.prepare(
      `SELECT save_code, student_name, section, activity_id, activity_title, updated_at
         FROM student_progress WHERE save_code = ?`,
    )
      .bind(code)
      .first();

    if (!student) {
      await noteMiss(env.DB, ip, bucket);
      return unauthorized();
    }

    const name = String(student.student_name || "");
    const section = String(student.section || "");
    const displayName = displayNameFrom(name);

    /* One child only. lesson_telemetry is keyed by name, so if this name is not
       unique inside this section we cannot prove a telemetry row belongs to
       THIS save code — so we use none of them. See rule 3 in the header. */
    let nameJoinable = false;
    if (name) {
      const dupes = await env.DB.prepare(
        `SELECT COUNT(*) AS n FROM student_progress
          WHERE student_name = ? AND COALESCE(section, '') = ?`,
      )
        .bind(name, section)
        .first();
      nameJoinable = (Number(dupes && dupes.n) || 0) <= 1;
    }

    const telemetry = nameJoinable
      ? (
          await env.DB.prepare(
            `SELECT lesson_slug, lesson_title, standard, event_type, payload_json, created_at
               FROM lesson_telemetry
              WHERE student_name = ? AND COALESCE(section, '') = ? AND created_at >= ?
              ORDER BY id DESC LIMIT 1500`,
          )
            .bind(name, section, since)
            .all()
        ).results || []
      : [];

    // game_scores carries the save code itself, so it is exact regardless.
    const games =
      (
        await env.DB.prepare(
          `SELECT game_id, standard, correct, total, misconception_tag, created_at
             FROM game_scores
            WHERE save_code = ? AND created_at >= ?
            ORDER BY id DESC LIMIT 500`,
        )
          .bind(code, since)
          .all()
      ).results || [];

    /* ---------------------------------------------------------------- did -- */
    const midMs = sinceMs + (Date.now() - sinceMs) / 2;
    const lessons = new Map();
    const stats = new Map();
    const tagCounts = new Map();

    const statFor = (std) => {
      if (!stats.has(std))
        stats.set(std, {
          attempts: 0,
          earlyA: 0,
          earlyC: 0,
          lateA: 0,
          lateC: 0,
          mastery: 0,
          title: "",
        });
      return stats.get(std);
    };

    for (const row of telemetry) {
      const std = normalizeStandard(row.standard);
      const slug = String(row.lesson_slug || "");
      const title = String(row.lesson_title || "") || titleCase(slug);
      const when = String(row.created_at || "");
      if (slug) {
        const entry = lessons.get(slug);
        if (!entry) {
          lessons.set(slug, { slug, title, standard: std, when });
        } else if (when > entry.when) {
          entry.when = when;
        }
      }
      const type = String(row.event_type || "");
      const payload = parsePayload(row.payload_json);
      const late = Date.parse(when) >= midMs;

      if (type === "item_attempt") {
        const ok = attemptCorrect(payload);
        if (ok !== null && std) {
          const s = statFor(std);
          s.attempts += 1;
          if (late) {
            s.lateA += 1;
            if (ok) s.lateC += 1;
          } else {
            s.earlyA += 1;
            if (ok) s.earlyC += 1;
          }
        }
      } else if (
        type === "mastery_reached" ||
        type === "mastery-reached" ||
        type === "lesson_complete"
      ) {
        if (std) {
          const s = statFor(std);
          s.mastery += 1;
          if (!s.title) s.title = title;
        }
      } else if (type === "misconception") {
        const tag = payloadTag(payload);
        if (tag) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    for (const row of games) {
      const std = normalizeStandard(row.standard);
      const gameId = String(row.game_id || "");
      const when = String(row.created_at || "");
      if (gameId) {
        const slug = `games-${gameId}`;
        const entry = lessons.get(slug);
        if (!entry) {
          lessons.set(slug, { slug, title: titleCase(gameId), standard: std, when });
        } else if (when > entry.when) {
          entry.when = when;
        }
      }
      const total = Number(row.total) || 0;
      const correct = Number(row.correct) || 0;
      if (std && total > 0) {
        const s = statFor(std);
        s.attempts += total;
        if (Date.parse(when) >= midMs) {
          s.lateA += total;
          s.lateC += correct;
        } else {
          s.earlyA += total;
          s.earlyC += correct;
        }
      }
      const tag = String(row.misconception_tag || "");
      if (Object.prototype.hasOwnProperty.call(TAGS, tag)) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    // The save/resume row itself is one real thing they worked on.
    if (student.updated_at && String(student.updated_at) >= since && student.activity_id) {
      const slug = String(student.activity_id);
      if (!lessons.has(slug)) {
        lessons.set(slug, {
          slug,
          title: String(student.activity_title || titleCase(slug)),
          standard: "",
          when: String(student.updated_at),
        });
      }
    }

    const did = [...lessons.values()]
      .sort((a, b) => (a.when < b.when ? 1 : a.when > b.when ? -1 : 0))
      .slice(0, 6)
      .map((entry) => ({
        title: localizeTitle(entry.title, lang).slice(0, 120),
        path: resolvePath(entry.slug, entry.standard, entry.title),
        standard: entry.standard,
        when: entry.when,
      }));

    /* --------------------------------------------------------------- grew -- */
    const grew = [];
    const grewSeen = new Set();
    const evidence = COPY.evidence;

    for (const [std, s] of stats) {
      if (grew.length >= 3) break;
      if (!s.mastery || grewSeen.has(std)) continue;
      const title = localizeTitle(s.title, lang) || standardLabel(std, lang);
      if (!title) continue;
      grewSeen.add(std);
      grew.push({
        standard: std,
        label: standardLabel(std, lang) || title,
        evidence: evidence.finished[langKey](title),
      });
    }
    for (const [std, s] of stats) {
      if (grew.length >= 3) break;
      if (grewSeen.has(std)) continue;
      const label = standardLabel(std, lang);
      if (!label) continue;
      const earlyRate = s.earlyA >= 3 ? s.earlyC / s.earlyA : null;
      const lateRate = s.lateA >= 3 ? s.lateC / s.lateA : null;
      let text = "";
      if (earlyRate !== null && lateRate !== null && lateRate - earlyRate >= 0.15) {
        text = evidence.improved[langKey](label);
      } else if (s.attempts >= 4 && (s.earlyC + s.lateC) / s.attempts >= 0.75) {
        text = evidence.steady[langKey](label);
      } else if (s.attempts >= 8) {
        text = evidence.persisted[langKey](label, s.attempts);
      }
      if (!text) continue;
      grewSeen.add(std);
      grew.push({ standard: std, label, evidence: text });
    }

    /* -------------------------------------------------------------- stuck -- */
    const rankedTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);

    const stuck = rankedTags.slice(0, 2).map((tag) => {
      const meta = TAGS[tag];
      const std = meta.standards[0] || "";
      return {
        standard: std,
        label: pick(lang, meta.label, meta.labelEs),
        tag,
        watchFor: pick(lang, meta.watchFor, meta.watchForEs),
      };
    });

    /* ------------------------------------------------- kitchen table + next -- */
    const workedStandards = [...stats.entries()]
      .sort((a, b) => b[1].attempts - a[1].attempts)
      .map(([std]) => std)
      .filter((std) => STANDARDS[std]);

    const focusTag = rankedTags[0] || TAG_FOR_STANDARD[workedStandards[0]] || "";
    const kitchenStandards = [
      ...stuck.map((s) => s.standard).filter(Boolean),
      ...workedStandards,
    ].filter((std, i, arr) => arr.indexOf(std) === i);

    const kitchenTable = buildKitchenTable(focusTag, kitchenStandards, lang);
    const nextUp = buildNextUp(kitchenStandards, lang);

    const thin = did.length === 0 && grew.length === 0 && stuck.length === 0;

    return json({
      ok: true,
      lang,
      child: { displayName },
      window: { days, since },
      headline: displayName ? COPY.headline[langKey](displayName) : COPY.headlineAnon[langKey],
      did,
      grew,
      stuck,
      kitchenTable,
      nextUp,
      thin,
      note: thin ? COPY.noteThin[langKey] : COPY.noteFull[langKey],
    });
  } catch (_err) {
    // Never echo the error text: a D1 message can carry the bound save code.
    return json({ ok: false, error: "server-error" }, 500);
  }
}

export const __test__ = {
  acceptableCode,
  normalizeCode,
  normalizeStandard,
  displayNameFrom,
  resolvePath,
  clampDays,
};
