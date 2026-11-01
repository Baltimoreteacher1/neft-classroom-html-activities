// Anti-gaming layer for the Moby quests. Pure: no DOM, no clock except the `now` argument, no randomness.
//
// Credit goes to LEARNING behaviour only: an independent correct answer, a corrected answer after feedback, a written
// explanation, a strategy chosen on a right answer, a lesson actually worked through. Nothing here ever pays for speed,
// volume, streaks of clicks, or repeating what is already mastered. And nothing here punishes: a refused event just
// earns nothing, with a plain sentence saying why (whyNoCredit), and a wrong answer or a hint never costs anything.
import { t } from "../i18n.js";

export const GUARD = Object.freeze({
  minAnswerMs: 1200, // an answer faster than this was not read; one alone is allowed, a burst of them is not
  burstWindow: 5,
  burstSize: 2,
  sameWindow: 4,
  sameCount: 3,
  supportRun: 4, // this many supported answers in a row pause supported credit until one is tried alone
  perSkillDay: 12,
  perDay: 60,
  revisedPerDay: 6,
  explainPerDay: 6,
  explainMinWords: 6,
  explainMinDistinct: 4,
  lessonMinMs: 8000,
  memory: 12,
});

export const EVENT_TYPES = Object.freeze([
  "answer",
  "hint",
  "explain",
  "strategy",
  "repair",
  "lesson",
]);
export const SKILL_KEY = /^\d{1,2}:[a-z0-9-]{1,60}$/;

const clampInt = (value, lo, hi) => Math.max(lo, Math.min(hi, Math.floor(Number(value) || 0)));
const finite = (value) =>
  value === null || value === "" || value === undefined || !Number.isFinite(Number(value))
    ? null
    : Number(value);
const text = (value, max) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
const words = (value) =>
  text(value, 600)
    .toLowerCase()
    .match(/[\p{L}\p{N}']+/gu) || [];

// Turns whatever the UI sends into a small, well-typed event, or null when it is not an event at all.
export function normalizeEvent(raw) {
  if (!raw || typeof raw !== "object" || !EVENT_TYPES.includes(raw.type)) return null;
  const hints = clampInt(raw.hintsUsed, 0, 20);
  const ms = finite(raw.responseMs ?? raw.responseTimeMs);
  const level = [0, 1, 2].includes(raw.level) ? raw.level : 1;
  const revised = raw.revised === true;
  return {
    type: raw.type,
    skillKey: typeof raw.skillKey === "string" ? raw.skillKey.slice(0, 70) : "",
    correct: raw.correct === true,
    hasCorrect: typeof raw.correct === "boolean",
    revised,
    firstTry: raw.firstTry !== false && !revised,
    supported: raw.supported === true || hints > 0 || raw.modelShown === true,
    ms: ms !== null && ms >= 0 && ms <= 3600000 ? Math.round(ms) : null,
    sig: text(raw.sig ?? raw.mistakeId, 24),
    answer: text(raw.answer, 40).toLowerCase(),
    text: text(raw.text, 600),
    strategy: /^[a-z][a-z0-9-]{1,30}$/.test(String(raw.strategy || "")) ? raw.strategy : "",
    level,
    completed: raw.completed === true,
    engagedMs: finite(raw.engagedMs),
  };
}

export const emptyGuard = (day = "") => ({
  day,
  recent: [],
  supportRun: 0,
  perSkill: {},
  total: 0,
  revised: 0,
  explained: [],
  seen: {},
  wrong: {},
  strategies: {},
});

const cleanMap = (value, max, test) => {
  const out = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const [key, entry] of Object.entries(value).slice(-max))
    if (test(entry)) out[String(key).slice(0, 80)] = entry;
  return out;
};

export function sanitizeGuard(value, day = "") {
  if (!value || typeof value !== "object" || value.day !== day) return emptyGuard(day);
  return {
    day,
    recent: (Array.isArray(value.recent) ? value.recent : [])
      .filter((entry) => entry && typeof entry === "object")
      .slice(-GUARD.memory)
      .map((entry) => ({
        type: EVENT_TYPES.includes(entry.type) ? entry.type : "answer",
        skillKey: text(entry.skillKey, 70),
        sig: text(entry.sig, 24),
        answer: text(entry.answer, 40),
        correct: entry.correct === true,
        ms: finite(entry.ms),
      })),
    supportRun: clampInt(value.supportRun, 0, 99),
    perSkill: cleanMap(value.perSkill, 80, (n) => Number.isFinite(n) && n >= 0),
    total: clampInt(value.total, 0, 100000),
    revised: clampInt(value.revised, 0, 1000),
    explained: (Array.isArray(value.explained) ? value.explained : [])
      .filter((s) => typeof s === "string")
      .slice(-8)
      .map((s) => s.slice(0, 600)),
    seen: cleanMap(value.seen, 300, (n) => n === true),
    wrong: cleanMap(value.wrong, 150, (n) => n === true),
    strategies: cleanMap(value.strategies, 80, (n) => n === true),
  };
}

const sameWords = (a, b) => {
  const left = new Set(words(a));
  const right = new Set(words(b));
  if (!left.size || !right.size) return false;
  const shared = [...left].filter((word) => right.has(word)).length;
  return shared / Math.max(left.size, right.size) >= 0.8;
};

const deny = (reason, extra = {}) => ({ credit: false, kind: null, reason, ...extra });
const allow = (kind, extra = {}) => ({ credit: true, kind, reason: null, ...extra });
const isBurst = (guard, ev) =>
  ev.ms !== null &&
  ev.ms < GUARD.minAnswerMs &&
  guard.recent
    .slice(-(GUARD.burstWindow - 1))
    .filter((entry) => entry.ms !== null && entry.ms < GUARD.minAnswerMs).length >=
    GUARD.burstSize - 1;

// The verdict for one event given the day's guard. `opts.masteredKeys` is the day's snapshot of skills that are mastered
// and not due: independent answers on them are repetition, not learning.
export function judge(guard, ev, opts = {}) {
  if (!ev) return deny("invalid");
  if (ev.type === "hint") return deny("hint");
  if (ev.type === "explain") {
    const list = words(ev.text);
    if (list.length < GUARD.explainMinWords || new Set(list).size < GUARD.explainMinDistinct)
      return deny("explain-short");
    if (guard.explained.some((prior) => sameWords(prior, ev.text))) return deny("explain-repeat");
    if (guard.explained.length >= GUARD.explainPerDay) return deny("enough-today");
    return allow("explain");
  }
  if (!SKILL_KEY.test(ev.skillKey) || (opts.isSkill && !opts.isSkill(ev.skillKey)))
    return deny("unknown-skill");
  if (ev.type === "lesson") {
    if (!ev.completed) return deny("lesson-rushed");
    if (ev.engagedMs !== null && ev.engagedMs < GUARD.lessonMinMs) return deny("lesson-rushed");
    if (guard.seen[`lesson|${ev.skillKey}`]) return deny("repeat-item");
    return allow("lesson");
  }
  if (ev.type === "strategy") {
    if (!ev.strategy || !ev.hasCorrect) return deny("invalid");
    if (!ev.correct) return deny("strategy-wrong");
    if (guard.strategies[`${ev.skillKey}|${ev.strategy}`]) return deny("strategy-repeat");
    return allow("strategy");
  }
  if (ev.type === "repair") {
    if (!ev.hasCorrect) return deny("invalid");
    if (!ev.correct) return deny("wrong");
    if (ev.sig && guard.seen[`repair|${ev.sig}`]) return deny("repeat-item");
    return allow("repair");
  }
  // ---- an answer ----
  if (!ev.hasCorrect) return deny("invalid");
  if (isBurst(guard, ev)) return deny("burst");
  if (!ev.correct) return deny("wrong");
  if (ev.sig && guard.seen[ev.sig]) return deny("repeat-item");
  const window = guard.recent.slice(-(GUARD.sameWindow - 1));
  if (
    ev.answer &&
    window.length === GUARD.sameWindow - 1 &&
    window.filter((entry) => entry.answer === ev.answer).length >= GUARD.sameCount - 1 &&
    window.some((entry) => !entry.correct)
  )
    return deny("same-answer");
  if ((guard.perSkill[ev.skillKey] || 0) >= GUARD.perSkillDay || guard.total >= GUARD.perDay)
    return deny("enough-today");
  if (ev.revised) {
    if (!ev.sig || !guard.wrong[ev.sig]) return deny("no-miss-recorded");
    if (guard.revised >= GUARD.revisedPerDay) return deny("enough-today");
    return allow("revised", { supported: ev.supported });
  }
  if (ev.supported)
    return guard.supportRun >= GUARD.supportRun ? deny("support-loop") : allow("supported");
  if (ev.level !== 2 && opts.masteredKeys?.includes(ev.skillKey)) return deny("mastered-repeat");
  return allow("independent");
}

// Folds one judged event into the guard. Only CREDITED work uses up the day's caps or marks a problem as seen, so a
// rushed answer the guard refused can still be done properly later.
export function advance(guard, ev, verdict) {
  const next = {
    ...guard,
    recent: guard.recent.slice(),
    perSkill: { ...guard.perSkill },
    seen: { ...guard.seen },
    wrong: { ...guard.wrong },
    strategies: { ...guard.strategies },
    explained: guard.explained.slice(),
  };
  if (!ev || ev.type === "hint") return next;
  if (ev.type === "answer") {
    next.recent = [
      ...next.recent,
      {
        type: "answer",
        skillKey: ev.skillKey,
        sig: ev.sig,
        answer: ev.answer,
        correct: ev.correct,
        ms: ev.ms,
      },
    ].slice(-GUARD.memory);
    next.supportRun = ev.supported ? next.supportRun + 1 : 0;
    if (!ev.correct && verdict.reason === "wrong" && ev.sig) next.wrong[ev.sig] = true;
  }
  if (!verdict.credit) return next;
  next.total += 1;
  if (ev.skillKey) next.perSkill[ev.skillKey] = (next.perSkill[ev.skillKey] || 0) + 1;
  if (verdict.kind === "explain") next.explained = [...next.explained, ev.text].slice(-8);
  if (verdict.kind === "strategy") next.strategies[`${ev.skillKey}|${ev.strategy}`] = true;
  if (verdict.kind === "lesson") next.seen[`lesson|${ev.skillKey}`] = true;
  if (verdict.kind === "repair" && ev.sig) next.seen[`repair|${ev.sig}`] = true;
  if (verdict.kind === "revised") next.revised += 1;
  if (ev.type === "answer" && ev.sig) next.seen[ev.sig] = true;
  return next;
}

export const NO_CREDIT_REASONS = Object.freeze([
  "invalid",
  "unknown-skill",
  "wrong",
  "burst",
  "repeat-item",
  "same-answer",
  "hint",
  "support-loop",
  "supported-only",
  "mastered-repeat",
  "not-in-quest",
  "enough-today",
  "explain-short",
  "explain-repeat",
  "strategy-repeat",
  "strategy-wrong",
  "no-miss-recorded",
  "lesson-rushed",
  "step-done",
  "no-quests",
]);

export function whyText(reason) {
  switch (reason) {
    case "invalid":
      return t("That did not look like a finished answer, so nothing was counted.");
    case "unknown-skill":
      return t("This could not be matched to a skill, so nothing was counted.");
    case "wrong":
      return t(
        "No credit yet, and nothing is lost. A mistake is how learning happens. Read the feedback, fix it, and the corrected answer counts.",
      );
    case "burst":
      return t(
        "Several answers in a row came in faster than 1.2 seconds. Credit needs time to read and think, so these did not count. Slow down a little and the next one will.",
      );
    case "repeat-item":
      return t("You already got credit for this exact problem. A new problem will count.");
    case "same-answer":
      return t(
        "The same answer came up several times in a row, so this one was not counted. Read the problem fresh and work it out.",
      );
    case "hint":
      return t(
        "Hints never earn credit and never cost you anything. Use them whenever you need them.",
      );
    case "support-loop":
      return t(
        "You have used help on the last few problems. Try the next one on your own first. Hints are still there if you need them.",
      );
    case "supported-only":
      return t("Help is great for learning, but only a try on your own counts for this step.");
    case "mastered-repeat":
      return t(
        "You have already mastered this skill, so more practice here does not earn credit. Try something new, or a review that is due.",
      );
    case "not-in-quest":
      return t("This is not part of today's quests, but practicing it still helps you learn.");
    case "enough-today":
      return t("That is plenty for this skill today. Take a break or try something different.");
    case "explain-short":
      return t("Say a little more: write at least {n} words about how you solved it.", {
        n: GUARD.explainMinWords,
      });
    case "explain-repeat":
      return t(
        "That explanation matches one you already wrote. Describe this problem in your own words.",
      );
    case "strategy-repeat":
      return t(
        "You already picked that strategy for this skill today. Try a different way to solve it.",
      );
    case "strategy-wrong":
      return t(
        "A strategy counts when your answer is right. Check your answer, then pick the strategy you used.",
      );
    case "no-miss-recorded":
      return t("A repair counts after a real miss and feedback on the same problem.");
    case "lesson-rushed":
      return t("The lesson went by too fast to count. Take your time with each step.");
    case "step-done":
      return t("That step is already complete.");
    case "no-quests":
      return t("Open today's quests first, then your work will count.");
    default:
      return "";
  }
}

// A student-readable reason an event earned nothing. Accepts a verdict ({ credit, reason }) from progressQuest/judge,
// or a raw event, in which case only the checks that need no history apply. Credited work returns an empty string.
export function whyNoCredit(input) {
  if (input && typeof input === "object" && "credit" in input)
    return input.credit ? "" : whyText(input.reason);
  const ev = normalizeEvent(input);
  const verdict = judge(emptyGuard(), ev);
  return verdict.credit ? "" : whyText(verdict.reason);
}
