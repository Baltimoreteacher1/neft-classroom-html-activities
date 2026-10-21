/* =============================================================================
 * shared/family-welcome.js — "A note from Mr. Neft": the optional, per-week
 * welcome at the top of the weekly hub.
 * -----------------------------------------------------------------------------
 * Source of truth: data/family-welcome.json
 *
 *   { "enabled": boolean,
 *     "weeks": { "YYYY-MM-DD": {            // the Monday the note belongs to
 *       "en": "…", "es": "…",
 *       "video": { "src": "/…mp4",          // optional
 *                  "captions": { "en": "/…vtt", "es": "/…vtt" },
 *                  "poster": "/…jpg" } } } }  // poster optional
 *
 * Two lanes are always written together: a note with only one language, or a
 * video without BOTH caption tracks, is a defect — families watch these with the
 * sound off, in a language that may not be the one the video speaks.
 * `welcomeProblems` is the strict check (tools/validate-family-welcome.mjs runs
 * it and fails the build). `normalizeWelcome` is what the browser does with
 * whatever it was served: it NEVER shows a video that fails the check, and it
 * drops a bad note rather than throwing, so a data mistake cannot blank the hub.
 *
 * Pure functions — no DOM, no fetch.
 * ========================================================================== */

export const WELCOME_TEXT_LIMIT = 600;
const WEEK_KEY = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_PATH = /^\/(?!\/)[A-Za-z0-9._~\-/]+$/;
const VIDEO_FILE = /\.(?:mp4|webm|m4v)$/i;
const CAPTION_FILE = /\.vtt$/i;
const POSTER_FILE = /\.(?:jpe?g|png|webp|svg)$/i;
const ENTRY_KEYS = new Set(["en", "es", "video"]);
const VIDEO_KEYS = new Set(["src", "captions", "poster"]);

const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);
const text = (value) => (typeof value === "string" ? value.trim() : "");

/** A same-site path to a file of the right kind; never a URL, never `..`. */
export function isLocalAsset(value, extension) {
  return (
    typeof value === "string" &&
    LOCAL_PATH.test(value) &&
    !value.split("/").includes("..") &&
    extension.test(value)
  );
}

/** A real Monday, written YYYY-MM-DD. */
export function isMondayKey(key) {
  if (!WEEK_KEY.test(key)) return false;
  const date = new Date(`${key}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === key &&
    date.getUTCDay() === 1
  );
}

function videoProblems(video, where) {
  if (!isObject(video)) return [`${where}: video must be an object`];
  const problems = [];
  for (const key of Object.keys(video))
    if (!VIDEO_KEYS.has(key)) problems.push(`${where}: unknown video field "${key}"`);
  if (!isLocalAsset(video.src, VIDEO_FILE))
    problems.push(`${where}: video.src must be a site path ending .mp4, .webm or .m4v`);
  const captions = video.captions;
  if (!isObject(captions)) {
    problems.push(`${where}: a video needs captions in BOTH English and Spanish`);
  } else {
    for (const lang of ["en", "es"])
      if (!isLocalAsset(captions[lang], CAPTION_FILE))
        problems.push(`${where}: video.captions.${lang} must be a site path ending .vtt`);
    for (const key of Object.keys(captions))
      if (key !== "en" && key !== "es")
        problems.push(`${where}: captions are English and Spanish only, not "${key}"`);
  }
  if (video.poster !== undefined && !isLocalAsset(video.poster, POSTER_FILE))
    problems.push(`${where}: video.poster must be a site path ending .jpg, .png, .webp or .svg`);
  return problems;
}

/** Everything wrong with a welcome file, in words a person can act on. */
export function welcomeProblems(data) {
  if (!isObject(data)) return ["the file must be an object: { enabled, weeks }"];
  const problems = [];
  for (const key of Object.keys(data))
    if (key !== "enabled" && key !== "weeks" && key !== "note")
      problems.push(`unknown top-level field "${key}"`);
  if (typeof data.enabled !== "boolean") problems.push('"enabled" must be true or false');
  if (!isObject(data.weeks)) {
    problems.push('"weeks" must be an object keyed by Monday (YYYY-MM-DD)');
    return problems;
  }
  for (const [week, entry] of Object.entries(data.weeks)) {
    const where = `weeks["${week}"]`;
    if (!isMondayKey(week)) problems.push(`${where}: the key must be a real Monday, YYYY-MM-DD`);
    if (!isObject(entry)) {
      problems.push(`${where}: must be an object`);
      continue;
    }
    for (const key of Object.keys(entry))
      if (!ENTRY_KEYS.has(key)) problems.push(`${where}: unknown field "${key}"`);
    for (const lang of ["en", "es"]) {
      const value = text(entry[lang]);
      if (!value) problems.push(`${where}: "${lang}" is required (write both languages)`);
      else if (value.length > WELCOME_TEXT_LIMIT)
        problems.push(
          `${where}: "${lang}" is ${value.length} characters; keep it to ${WELCOME_TEXT_LIMIT}`,
        );
    }
    if (text(entry.en) && text(entry.en) === text(entry.es))
      problems.push(`${where}: the Spanish is a copy of the English`);
    if (entry.video !== undefined) problems.push(...videoProblems(entry.video, where));
  }
  return problems;
}

/**
 * What the hub may show. Always `{ enabled, weeks }`; a note that fails the
 * check is dropped whole, and a note whose only fault is its video keeps its
 * text and loses the video.
 */
export function normalizeWelcome(raw) {
  const empty = { enabled: false, weeks: {} };
  if (!isObject(raw) || raw.enabled !== true || !isObject(raw.weeks)) return empty;
  const weeks = {};
  for (const [week, entry] of Object.entries(raw.weeks)) {
    if (!isMondayKey(week) || !isObject(entry)) continue;
    const en = text(entry.en);
    const es = text(entry.es);
    if (!en || !es || en.length > WELCOME_TEXT_LIMIT || es.length > WELCOME_TEXT_LIMIT) continue;
    const note = { en, es };
    if (entry.video !== undefined && videoProblems(entry.video, week).length === 0) {
      const { src, captions, poster } = entry.video;
      note.video = { src, captions: { en: captions.en, es: captions.es } };
      if (poster) note.video.poster = poster;
    }
    weeks[week] = note;
  }
  return { enabled: true, weeks };
}

/** The note for one week (keyed by its Monday), or null — never a placeholder. */
export function welcomeForWeek(welcome, weekStart) {
  if (!welcome?.enabled || !isObject(welcome.weeks)) return null;
  return welcome.weeks[weekStart] ?? null;
}
