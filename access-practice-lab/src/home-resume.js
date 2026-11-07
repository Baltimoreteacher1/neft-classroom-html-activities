// Read-only bridge from the platform's existing device-local progress records to the home Continue action.
// Each learning system keeps its own serializer and backup contract; this module only reads known keys and
// returns a direct route to the owning system.
import { BASE, safeJson, storage } from "./util.js";

const KEYS = Object.freeze({
  sor: "accessPracticeLab:v1:sor",
  vocabulary: "accessPracticeLab:v1:vocabCurriculum",
  subjectReading: "accessPracticeLab:v1:subjectReading",
  readingRoom: "accessPracticeLab:v1:readingRoom",
});

const readJson = (read, key) => safeJson(read(key), {}) || {};
const stamp = (...values) => {
  for (const value of values) {
    const time = Date.parse(value || "");
    if (Number.isFinite(time)) return time;
  }
  return 0;
};
const bandQuery = (band) => `?grades=${encodeURIComponent(band)}`;
const rowHasWork = (value) => Boolean(
  value && (
    value.draft?.trim?.() || value.revised?.trim?.() || value.explanation?.trim?.() || value.reflection?.trim?.() ||
    value.feedback || value.placed?.length || value.choice || value.spelling || value.transfer ||
    value.evidence?.length || value.answers && Object.keys(value.answers).length ||
    value.plan && Object.values(value.plan).some(Boolean) || value.organizer && Object.values(value.organizer).some(Boolean) ||
    value.takes?.length || value.versions?.length || value.rehearsed === true ||
    value.stage && !["preview", "model"].includes(value.stage) ||
    value.phase && value.phase !== "model" || value.inspected?.length ||
    value.attempts && Object.values(value.attempts).some((n) => Number(n) > 0) ||
    value.started === true || value.startedAt
  ),
);

function vocabularyGradeBand(id) {
  const match = String(id).match(/^(?:g)?(k|[1-8])-/i);
  if (!match) return "";
  const grade = match[1].toUpperCase();
  if (grade === "K") return "K";
  const n = Number(grade);
  if (n === 1) return "1";
  if (n <= 3) return "2-3";
  if (n <= 5) return "3-5";
  return "6-8";
}

/** Return the newest unfinished saved task from modules that are not in the core activity record. */
export function latestModuleResume({ band = "6-8", studio = {}, index = {}, read = (key) => storage.get(key) } = {}) {
  const candidates = [];
  const add = (system, id, at, path, queryBand = band) => {
    if (!id || !path) return;
    candidates.push({
      system,
      id: String(id),
      updatedAt: at || "",
      time: stamp(at),
      href: `${BASE}/${path}${bandQuery(queryBand)}`,
    });
  };

  const sor = readJson(read, KEYS.sor);
  for (const [id, state] of Object.entries(sor)) {
    if (state?.doneAt || state?.phase === "complete" || !rowHasWork(state)) continue;
    add("phonics", id, state.updatedAt || state.lastAt, `science-of-reading/lesson/${encodeURIComponent(id)}`);
  }

  const vocabulary = readJson(read, KEYS.vocabulary);
  for (const [id, state] of Object.entries(vocabulary.lessons || {})) {
    if (state?.completed || !rowHasWork(state)) continue;
    const lessonBand = vocabularyGradeBand(id);
    if (lessonBand && lessonBand !== band && !(band === "3-5" && lessonBand === "2-3")) continue;
    add("vocabulary", id, state.updatedAt || state.startedAt, `vocab-curriculum/${encodeURIComponent(id)}`);
  }

  const subjectReading = readJson(read, KEYS.subjectReading);
  for (const [id, state] of Object.entries(subjectReading.readings || {})) {
    if (state?.completedAt || !state?.startedAt || !rowHasWork(state)) continue;
    add("subject-reading", id, state.updatedAt || state.startedAt, `subject-reading/${encodeURIComponent(id)}`);
  }

  const readingRoom = readJson(read, KEYS.readingRoom);
  const recentId = readingRoom.lastRead;
  if (recentId) {
    const recent = Object.entries(readingRoom.lessons || {})
      .filter(([key, value]) => key.startsWith(`${recentId}@`) && value?.started && !value?.completed)
      .map(([, value]) => value)
      .sort((a, b) => stamp(b.lastOpened) - stamp(a.lastOpened))[0];
    if (recent) add("reading-room", recentId, recent.lastOpened, `reading-room/${encodeURIComponent(recentId)}`);
  }

  for (const source of ["writing", "speaking"]) {
    const rows = new Map((index[source] || []).filter((row) => !row.band || row.band === band).map((row) => [row.id, row]));
    for (const [id, state] of Object.entries(studio[source] || {})) {
      if (!rows.has(id) || state?.finishedAt || state?.completedAt || state?.takes?.at?.(-1)?.finished || !rowHasWork(state)) continue;
      const when = state.updatedAt || state.versions?.at?.(-1)?.t || state.takes?.at?.(-1)?.t;
      add(source, id, when, `${source}/${encodeURIComponent(id)}`);
    }
  }

  candidates.sort((a, b) => b.time - a.time);
  return candidates[0] || null;
}

/** Read the module-specific records from local storage without changing any serializer or saved data. */
export function readLatestModuleResume(options = {}) {
  return latestModuleResume(options);
}
