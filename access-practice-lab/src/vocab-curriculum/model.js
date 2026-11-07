import { safeJson, storage } from "../util.js";
import { LESSONS } from "./lessons.js";

export const KEY = "accessPracticeLab:v1:vocabCurriculum";
export const STAGES = ["preview", "explore", "relationships", "context", "passage", "application", "revision", "transfer"];
const LESSON_IDS = new Set(LESSONS.map((lesson) => lesson.id));
const text = (value, limit = 1800) => typeof value === "string" ? value.slice(0, limit) : "";
export const wordsIn = (value) => text(value).trim().split(/\s+/).filter(Boolean).length;

export function cleanProgress(value) {
  const source = typeof value === "string" ? safeJson(value, null) : value;
  const lessons = {};
  if (!source || source.v !== 1 || !source.lessons || typeof source.lessons !== "object") return { v: 1, lessons };
  for (const [id, raw] of Object.entries(source.lessons)) {
    if (!LESSON_IDS.has(id) || !raw || typeof raw !== "object") continue;
    lessons[id] = {
      stage: STAGES.includes(raw.stage) ? raw.stage : "preview",
      inspected: Array.isArray(raw.inspected) ? [...new Set(raw.inspected.filter((x) => typeof x === "string"))].slice(0, 10) : [],
      attempts: Object.fromEntries(STAGES.map((stage) => [stage, Math.max(0, Math.min(99, Number(raw.attempts?.[stage]) || 0))])),
      feedback: text(raw.feedback, 500),
      draft: text(raw.draft),
      first: text(raw.first),
      revised: text(raw.revised),
      transfer: text(raw.transfer),
      explanation: text(raw.explanation, 600),
      supportUsed: Boolean(raw.supportUsed),
      completed: Boolean(raw.completed),
      updatedAt: typeof raw.updatedAt === "string" && Number.isFinite(Date.parse(raw.updatedAt)) ? raw.updatedAt : null,
    };
  }
  return { v: 1, lessons };
}

export const loadProgress = (read = (key) => storage.get(key)) => cleanProgress(read(KEY));
export const saveProgress = (progress, write = (key, value) => storage.set(key, value)) =>
  write(KEY, JSON.stringify(cleanProgress(progress)));

export function lessonState(progress, id) {
  return progress.lessons?.[id] || cleanProgress({ v: 1, lessons: { [id]: {} } }).lessons[id];
}

export function updateLesson(progress, id, patch, now = new Date()) {
  if (!LESSON_IDS.has(id)) return cleanProgress(progress);
  const next = cleanProgress(progress);
  next.lessons[id] = { ...lessonState(next, id), ...patch, updatedAt: now.toISOString() };
  return cleanProgress(next);
}

export function nextStage(stage) {
  const index = STAGES.indexOf(stage);
  return STAGES[Math.min(index + 1, STAGES.length - 1)] || STAGES[0];
}

/** A local, transparent writing prompt, never a score or judgment of language quality. */
export function responseNudge(response, lesson, { revision = false } = {}) {
  const count = wordsIn(response);
  if (count < 6) return "Add a complete idea with at least one detail before continuing.";
  const lower = response.toLowerCase();
  const usesTarget = lesson.words.some(({ term }) => new RegExp(`\\b${term}\\b`, "i").test(lower));
  if (!usesTarget) return `Try using one of the target words (${lesson.words.map((word) => word.term).join(" or ")}) where it helps your meaning.`;
  if (!/\b(because|so|for example|however|but|while|the text|the passage|the source)\b/i.test(response))
    return "Connect your idea to a reason or an example. A reader should see why you think it.";
  return revision ? "Your revision includes a target word and a connection. Compare it with your first response, then try the new situation alone." : "You used a target word and connected ideas. Reread the prompt, then revise one sentence for precision.";
}
