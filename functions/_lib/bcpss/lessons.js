// BCPSS lesson companions: lazy loader + computed language_demand_score.
// Data lives in db/seeds/bcpss/v2/lessons/<unitId>.mjs (generated drafts or hand-authored files).

import { BCPSS_UNITS, UNIT_CONNECTIONS } from "../../../data/bcpss-curriculum-seed.mjs";
import { AUTHORED_LOADERS } from "../../../db/seeds/bcpss/v2/lessons-authored.mjs";
import { kluOfConnection } from "./klu.js";
import { generateLessons } from "./lesson-generator.js";
import { loadStudio } from "./studio.js";

const KLU_WEIGHT = { Narrate: 0.3, Inform: 0.5, Explain: 0.7, Argue: 0.9 };
const OUTPUT_WEIGHT = { speak_and_record: 0.5, write_scaffold: 0.8, paragraph_builder: 0.9 };

/** 0-1 score from KLU complexity, new Tier 2/3 terms, text length and output demand. */
export function languageDemandScore(lesson) {
  const klu = KLU_WEIGHT[lesson.language_objective?.klu] ?? 0.5;
  const fresh = (lesson.vocab || []).filter((v) => v.new_or_review === "new");
  const terms = Math.min(1, fresh.reduce((n, v) => n + (v.tier === 3 ? 1 : 0.5), 0) / 4);
  const text = Math.min(1, String(lesson.mentor_sentence?.text || "").split(/\s+/).length / 25);
  const produce = lesson.arc?.find((s) => s.step === "produce")?.activity?.kind;
  const output = OUTPUT_WEIGHT[produce] ?? 0.5;
  return Math.round((0.3 * klu + 0.3 * terms + 0.2 * text + 0.2 * output) * 100) / 100;
}

const withScore = (lesson) => ({ ...lesson, language_demand_score: languageDemandScore(lesson) });

const UNIT_BY_ID = new Map(BCPSS_UNITS.map((u) => [u.id, u]));
const KLU_BY_UNIT = new Map(UNIT_CONNECTIONS.map((c) => [c.unit_id, kluOfConnection(c)]));

/** Authored lessons win; otherwise drafts are generated from the unit's authored studio content. */
export async function loadLessons(unitId) {
  const authored = AUTHORED_LOADERS[unitId];
  if (authored) {
    const set = (await authored()).default;
    return { ...set, lessons: set.lessons.map(withScore) };
  }
  const unit = UNIT_BY_ID.get(unitId);
  const studio = unit ? await loadStudio(unitId) : null;
  if (!studio) return null;
  const lessons = generateLessons({ unit, studio, klu: KLU_BY_UNIT.get(unitId) || "Explain" });
  return {
    version: 1,
    unit_id: unitId,
    source: "draft_standards_based",
    lessons: lessons.map(withScore),
  };
}

const LESSON_ID = /^(g(?:k|[1-8])-(?:ela|math|sci|ss)-u\d+)-l\d{2}$/;

export const unitIdOfLesson = (lessonId) => LESSON_ID.exec(lessonId)?.[1] || null;

export async function loadLesson(lessonId) {
  const unitId = unitIdOfLesson(lessonId);
  if (!unitId) return null;
  const set = await loadLessons(unitId);
  return set?.lessons.find((l) => l.id === lessonId) || null;
}

/** Lightweight rows for the timeline (no activity payloads). */
export function summarize(lesson) {
  return {
    id: lesson.id,
    sequence: lesson.sequence,
    title: lesson.title,
    source: lesson.source,
    klu: lesson.language_objective.klu,
    function: lesson.language_objective.function,
    vocab: lesson.vocab.map((v) => v.term),
    minutes: lesson.teacher_card.minutes,
    language_demand_score: lesson.language_demand_score,
    review: lesson.review,
  };
}
