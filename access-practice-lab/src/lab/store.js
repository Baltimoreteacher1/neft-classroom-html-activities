// LabStateStore (`tlp_lab_v2`): the one versioned record that Practice, Games & Worlds, the 12-week Road,
// My Progress, Teachers and Families all read. It lives at `accessPracticeLab:v1:tlp_lab_v2`, inside the
// lab's existing backup / Save-Resume boundary (every `accessPracticeLab:v1:*` key is exported), so a
// Save/Resume code carries it with no second code format.
//
// Language chrome, grade band and tier are NOT stored here: they already live in the lab prefs
// (`accessPracticeLab:v1:prefs`), which stays their single source of truth.
//
// Privacy: events hold no name, no text the learner typed, no recording. The first name stays where it
// already lives (`studentName`, device-local). Nothing here is a score: readiness is practice coverage.
import { safeJson, storage } from "../util.js";
import { DOMAINS, BANDS, CONTENT_AREAS, TIERS, gameMeta, normalizeLabBand } from "./meta.js";
import { ERROR_TAGS } from "./tags.js";

export const LAB_KEY = "accessPracticeLab:v1:tlp_lab_v2";
export const SCHEMA_VERSION = 2;
export const MAX_EVENTS = 600;
export const EVENT_KINDS = Object.freeze(["round", "mission"]);

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isoOrEmpty = (v) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : "");

export const emptyState = (now = new Date().toISOString()) => ({
  schemaVersion: SCHEMA_VERSION,
  createdAt: now,
  updatedAt: now,
  events: [],
  migrated: { gamesV1: false },
});

/** One telemetry event, cleaned. Returns null when it cannot be a real event. */
export function cleanEvent(e) {
  if (!isObject(e)) return null;
  const meta = gameMeta(e.gameId);
  if (!meta) return null;
  const gradeBand = normalizeLabBand(e.gradeBand);
  const timestamp = isoOrEmpty(e.timestamp);
  if (!gradeBand || !timestamp) return null;
  const widaDomain = DOMAINS.includes(e.widaDomain) ? e.widaDomain : meta.primaryDomain;
  const widaContentArea = CONTENT_AREAS.includes(e.widaContentArea)
    ? e.widaContentArea
    : meta.contentArea;
  const scaffoldTier = TIERS[e.scaffoldTier] ? e.scaffoldTier : "hands-on";
  const languageErrorTag =
    typeof e.languageErrorTag === "string" && ERROR_TAGS[e.languageErrorTag]
      ? e.languageErrorTag
      : null;
  return {
    kind: EVENT_KINDS.includes(e.kind) ? e.kind : "round",
    gameId: meta.id,
    gradeBand,
    widaDomain,
    widaContentArea,
    scaffoldTier,
    languageErrorTag,
    ok: e.ok === false ? false : true,
    timestamp,
  };
}

/** Structural check used by import and by tests. Reports every problem instead of stopping at the first. */
export function validateState(state) {
  const errors = [];
  if (!isObject(state)) return { ok: false, errors: ["state is not an object"] };
  if (state.schemaVersion !== SCHEMA_VERSION)
    errors.push(`schemaVersion must be ${SCHEMA_VERSION}`);
  if (!Array.isArray(state.events)) errors.push("events missing");
  else {
    if (state.events.length > MAX_EVENTS) errors.push(`more than ${MAX_EVENTS} events`);
    state.events.forEach((e, i) => {
      const c = cleanEvent(e);
      if (!c) errors.push(`event ${i} is not a valid event`);
    });
  }
  if (!isObject(state.migrated)) errors.push("migrated missing");
  return { ok: errors.length === 0, errors };
}

/**
 * Any stored shape -> a valid current state. Unknown or damaged input yields a fresh state rather than a
 * crash, a state from a NEWER app version is kept readable (events that still validate) and never
 * downgraded in place, and a missing schemaVersion is treated as the pre-v2 shape.
 */
export function migrateState(raw, now = new Date().toISOString()) {
  const out = emptyState(now);
  if (!isObject(raw)) return out;
  out.createdAt = isoOrEmpty(raw.createdAt) || now;
  out.updatedAt = isoOrEmpty(raw.updatedAt) || out.createdAt;
  const events = (Array.isArray(raw.events) ? raw.events : []).map(cleanEvent).filter(Boolean);
  out.events = events.slice(-MAX_EVENTS);
  out.migrated = { gamesV1: raw.migrated?.gamesV1 === true };
  return out;
}

/**
 * Fold the pre-v2 game history (`accessPracticeLab:v1:games`) into events once. Each finished session
 * becomes one "mission" event; the support mode becomes the matching tier. Idempotent: state.migrated
 * remembers it ran, and a restored backup that already holds the events is not doubled.
 */
export function migrateLegacyGames(state, games) {
  if (state.migrated.gamesV1) return state;
  const next = {
    ...state,
    events: [...state.events],
    migrated: { ...state.migrated, gamesV1: true },
  };
  const seen = new Set(next.events.map((e) => `${e.gameId}|${e.gradeBand}|${e.timestamp}`));
  for (const h of Array.isArray(games?.history) ? games.history : []) {
    const meta = gameMeta(h?.game);
    if (!meta) continue;
    const tier = Object.values(TIERS).find((t) => t.support === h.support)?.id || "hands-on";
    const evt = cleanEvent({
      kind: "mission",
      gameId: h.game,
      gradeBand: h.band,
      scaffoldTier: tier,
      timestamp: h.at,
      ok: true,
    });
    if (!evt) continue;
    const key = `${evt.gameId}|${evt.gradeBand}|${evt.timestamp}`;
    if (seen.has(key)) continue;
    seen.add(key);
    next.events.push(evt);
  }
  next.events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  next.events = next.events.slice(-MAX_EVENTS);
  return next;
}

export function loadLab({ read = (k) => storage.get(k), now = new Date().toISOString() } = {}) {
  let state = migrateState(safeJson(read(LAB_KEY), null), now);
  if (!state.migrated.gamesV1)
    state = migrateLegacyGames(state, safeJson(read("accessPracticeLab:v1:games"), null));
  return state;
}

export function saveLab(state, write = (k, v) => storage.set(k, v)) {
  const next = {
    ...state,
    updatedAt: new Date().toISOString(),
    events: state.events.slice(-MAX_EVENTS),
  };
  write(LAB_KEY, JSON.stringify(next));
  return next;
}

/** Append one event, persist, return the new state. A malformed event is dropped, never thrown. */
export function recordEvent(evt, deps = {}) {
  const clean = cleanEvent({ timestamp: new Date().toISOString(), ...evt });
  const state = loadLab(deps);
  if (!clean) return state;
  return saveLab({ ...state, events: [...state.events, clean] }, deps.write);
}

/** Backup merge: union of events, no duplicates. */
export function mergeLab(local, incoming) {
  const a = migrateState(local);
  const b = migrateState(incoming);
  const key = (e) =>
    `${e.kind}|${e.gameId}|${e.gradeBand}|${e.timestamp}|${e.languageErrorTag || ""}`;
  const seen = new Set(a.events.map(key));
  const events = [...a.events, ...b.events.filter((e) => !seen.has(key(e)))].sort((x, y) =>
    x.timestamp.localeCompare(y.timestamp),
  );
  return {
    ...a,
    createdAt: a.createdAt < b.createdAt ? a.createdAt : b.createdAt,
    events: events.slice(-MAX_EVENTS),
    migrated: { gamesV1: a.migrated.gamesV1 || b.migrated.gamesV1 },
  };
}

// ── derived views (nothing below is stored) ─────────────────────────────────────────────────────
const inBand = (e, band) => !band || e.gradeBand === band;
// Practice coverage for a domain: distinct games finished, out of the first COVERAGE_TARGET the learner
// is asked to try. Coverage says "how much have I practiced", never "how well will I score".
export const COVERAGE_TARGET = 4;

/** { Listening: 0..1, ... } practice coverage from finished missions. */
export function readiness(state, { band = "" } = {}) {
  const out = {};
  for (const d of DOMAINS) {
    const done = new Set(
      state.events
        .filter((e) => e.kind === "mission" && inBand(e, band) && practicesDomain(e, d))
        .map((e) => e.gameId),
    );
    out[d] = Math.min(1, done.size / COVERAGE_TARGET);
  }
  return out;
}
// A game covers every domain it lists; a world mission covers the domain it was logged for.
const practicesDomain = (e, d) => (e.gameId.startsWith("world:") ? e.widaDomain === d : (gameMeta(e.gameId)?.domains || []).includes(d));

/** The `n` most frequent language-error tags, newest-weighted tie-break. [{tag, count}] */
export function topErrorTags(state, n = 2, { band = "" } = {}) {
  const counts = new Map();
  const last = new Map();
  for (const e of state.events) {
    if (!e.languageErrorTag || !inBand(e, band)) continue;
    counts.set(e.languageErrorTag, (counts.get(e.languageErrorTag) || 0) + 1);
    last.set(e.languageErrorTag, e.timestamp);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || String(last.get(b[0])).localeCompare(String(last.get(a[0]))))
    .slice(0, n)
    .map(([tag, count]) => ({ tag, count }));
}

export const missionCount = (state, { band = "" } = {}) =>
  state.events.filter((e) => e.kind === "mission" && inBand(e, band)).length;
export const bandsPracticed = (state) =>
  BANDS.filter((b) => state.events.some((e) => e.gradeBand === b));
