// Adaptive choices made from demonstrated performance (the ledger), never from a fixed level.
// Every function returns a recommendation AND an observable reason the learner can read, and the
// learner can always override it. Evidence used: the ledger (Key Language Use, Language Dimension,
// independent vs supported work, error patterns), the WIDA ELD Standard a task belongs to, the
// optional check-in, and Language World transfers. Missing or unreadable storage means "no evidence".
import { getPrefs } from "../store.js";
import { safeJson, storage } from "../util.js";
import { DETECTORS } from "./errors.js";
import { KEY_LANGUAGE_USES } from "./klu.js";
import { buildProfile, dayNumber, focusAreas, patternReviewEvents, reviewSchedule, supportsUsed } from "./ledger.js";
import { SKILLS, evidenceFromLedger, evidenceFromPracticeRecords } from "./skill-graph.js";

export { KEY_LANGUAGE_USES };
export const DIAGNOSTIC_KEY = "accessPracticeLab:v1:diagnostic";
export const WORLD_MISSIONS_KEY = "accessPracticeLab:v1:world-missions";

/** WIDA ELD Standards Framework (2020): the five standards, by the codes STUDIO-CONTENT.md uses. */
export const ELD_STANDARDS = Object.freeze({
  "ELD-SI": { n: 1, name: "Language for Social and Instructional Purposes", short: "social and instructional" },
  "ELD-LA": { n: 2, name: "Language for Language Arts", short: "language arts" },
  "ELD-MA": { n: 3, name: "Language for Mathematics", short: "math" },
  "ELD-SC": { n: 4, name: "Language for Science", short: "science" },
  "ELD-SS": { n: 5, name: "Language for Social Studies", short: "social studies" },
});
export const LANGUAGE_DIMENSIONS = ["Discourse", "Sentence", "Word/Phrase"];

/** The learner's own support choice. Stage is what the studios open; the label is what the learner sees. */
export const SUPPORT_TIERS = Object.freeze([
  { id: "A", label: "Starting", stage: "guided", detail: "frames, a word bank and a model are open" },
  { id: "B", label: "Growing", stage: "supported", detail: "frames and a word bank are ready" },
  { id: "C", label: "Expanding", stage: "supported", detail: "a word bank only; frames stay closed" },
  { id: "independent", label: "Independent", stage: "independent", detail: "no frames, word bank or model" },
]);

const WORLD_DOMAIN = { "signal-station": "Listening", "evidence-city": "Reading", "conversation-quest": "Speaking", storyworks: "Writing" };
const WORLD_NAME = { "signal-station": "Signal Station", "evidence-city": "Evidence City", "conversation-quest": "Conversation Quest", storyworks: "StoryWorks" };
// Check-in skill tags → the Key Language Use (or dimension) that practices the same move.
const CHECKIN_KLU = { sequence: "Narrate", "main-idea": "Inform", "cause-effect": "Explain", evidence: "Argue" };
const CHECKIN_LABEL = { sequence: "the order of events", "main-idea": "main ideas", "cause-effect": "cause and effect", evidence: "finding evidence" };
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** The WIDA ELD Standard code for a task: its own `standards`, else read from its content area. */
export function standardFor(task) {
  const own = Array.isArray(task?.standards) ? task.standards.find((s) => Object.hasOwn(ELD_STANDARDS, s)) : null;
  if (own) return own;
  const area = String(task?.contentArea || "").toLowerCase();
  if (/science/.test(area)) return "ELD-SC";
  if (/math/.test(area)) return "ELD-MA";
  if (/social studies|civic|history|geograph|government/.test(area)) return "ELD-SS";
  if (/\bela\b|language arts|english|literature/.test(area)) return "ELD-LA";
  return "ELD-SI";
}

const taskDomain = (t) => t?.domain || (t?.taskType ? "Speaking" : t?.form ? "Writing" : "");

/**
 * Read the check-in and Language World records for a band (null = every band). Never throws: corrupt or missing storage
 * gives empty evidence. Returns only skill tags, correctness, and completed mission ids.
 */
export function loadAdaptSignals(band = null, read = (k) => storage.get(k)) {
  const out = { checkinMissed: {}, worlds: {} };
  try {
    const diag = safeJson(read(DIAGNOSTIC_KEY), {});
    if (isObj(diag))
      for (const [key, rec] of Object.entries(diag)) {
        const [b, domain] = key.split(":");
        if ((band && b !== band) || !isObj(rec)) continue;
        for (const a of Array.isArray(rec.answers) ? rec.answers : [])
          if (isObj(a) && a.correct === false && typeof a.skill === "string") (out.checkinMissed[a.skill] ||= []).push(domain);
      }
    const worlds = safeJson(read(WORLD_MISSIONS_KEY), {});
    if (isObj(worlds))
      for (const [key, rec] of Object.entries(worlds)) {
        const [b, world] = key.split(":");
        if ((band && b !== band) || !isObj(rec) || !rec.completed || !Object.hasOwn(WORLD_DOMAIN, world)) continue;
        out.worlds[world] = (out.worlds[world] || 0) + 1;
      }
  } catch {
    return { checkinMissed: {}, worlds: {} };
  }
  return out;
}

/** The learner's support override from prefs ("" when they follow the evidence). Never throws. */
export function supportOverride(prefs) {
  try {
    const v = (prefs || getPrefs()).supportOverride;
    return SUPPORT_TIERS.some((t) => t.id === v) ? v : "";
  } catch {
    return "";
  }
}

/** Dimensions the learner's own evidence says need attention, with the reason. */
function dimensionNeeds(profile) {
  const needs = {};
  for (const f of focusAreas(profile)) {
    if (f.kind === "pattern") needs.Sentence ||= "a pattern keeps showing up in your recent sentences";
    else if (f.kind === "feature" || f.kind === "independence") {
      const dim = profile.features[f.id]?.dimension;
      if (dim) needs[dim] ||= f.reason.replace(/\.$/, "").toLowerCase();
    }
  }
  return needs;
}

/**
 * Rank tasks to suggest next. Each result: { task, score, reason, why, factors }. `reason` (= `why`)
 * is the learner-facing explanation built only from the factors that actually applied.
 */
export function recommendTasks(tasks, entries, { n = 3, band = null, signals = null } = {}) {
  const list = Array.isArray(tasks) ? tasks : [];
  const log = Array.isArray(entries) ? entries : [];
  const profile = buildProfile(log, { band });
  const sig = signals || loadAdaptSignals(band);
  const tried = new Set(log.map((e) => e.task));
  const triedStandards = new Set(list.filter((t) => tried.has(t.id)).map(standardFor));
  const dimNeeds = dimensionNeeds(profile);
  const recurring = profile.errors.find((e) => !e.mastered && e.drafts >= 2);
  const scored = list.map((t, order) => {
    const u = profile.byUse[t.keyUse] || { n: 0, independent: 0 };
    const factors = [];
    let score = 0;
    const add = (pts, factor, text) => {
      score += pts;
      factors.push({ factor, points: pts, text });
    };
    if (!tried.has(t.id)) add(10, "new", "new to you");
    if (KEY_LANGUAGE_USES.includes(t.keyUse) && u.independent === 0)
      add(6, "keyUse", `you have not done a ${t.keyUse} task on your own yet`);
    else if (u.n === 0) add(3, "keyUse", `you have not tried ${t.keyUse || "this kind of"} task yet`);
    const std = standardFor(t);
    if (!triedStandards.has(std))
      add(2, "standard", `it adds ${ELD_STANDARDS[std].short} language (WIDA ELD Standard ${ELD_STANDARDS[std].n}), which you have not practiced here yet`);
    const dims = Array.isArray(t.dimensions) ? t.dimensions : [];
    const dim = dims.find((d) => dimNeeds[d]);
    if (dim) add(2, "dimension", `it practices ${dim} language, because ${dimNeeds[dim]}`);
    else if (recurring && dims.includes("Sentence")) add(2, "pattern", "a chance to practice a pattern from your recent work");
    const missed = Object.entries(sig.checkinMissed || {}).find(([skill]) => CHECKIN_KLU[skill] === t.keyUse);
    if (missed) add(3, "checkin", `your ${missed[1][0]} check-in suggested practicing ${CHECKIN_LABEL[missed[0]]}`);
    const world = Object.entries(WORLD_DOMAIN).find(([id, d]) => d === taskDomain(t) && sig.worlds?.[id]);
    if (world && u.independent === 0)
      add(2, "world", `you finished ${sig.worlds[world[0]]} ${WORLD_NAME[world[0]]} transfer mission${sig.worlds[world[0]] === 1 ? "" : "s"} — use that skill in a full task`);
    const shown = factors.filter((f) => f.factor !== "new").map((f) => f.text);
    const reason = [factors.some((f) => f.factor === "new") ? "New to you" : "", ...shown].filter(Boolean).join("; ") || "More practice of a task you have tried";
    return { task: t, score, why: reason, reason, factors, order };
  });
  return scored
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, n)
    .map(({ order, ...r }) => r);
}

/**
 * Which mission questions to show. "stretch" questions appear only after independent success on core
 * questions of the same skill — demonstrated performance, not a level.
 */
export function showStretch(entries, skill) {
  const qs = entries.filter((e) => e.src === "mission" || e.src === "item").flatMap((e) => (e.m?.questions || []).map((q) => ({ ...q, stage: e.stage })));
  const mine = qs.filter((q) => q.skill === skill && q.tier !== "stretch");
  const independentOk = mine.filter((q) => q.stage === "independent" && q.ok).length;
  const independentTotal = mine.filter((q) => q.stage === "independent").length;
  return independentTotal >= 2 && independentOk / independentTotal >= 0.75;
}

/**
 * Support for a mission phase. The learner's own override wins; otherwise the stage follows their
 * evidence on this Key Language Use, recent check-in misses, and Language World transfers.
 */
export function missionSupport(entries, use, { override, band = null, signals = null, domain = "" } = {}) {
  const choice = override === undefined ? supportOverride() : SUPPORT_TIERS.some((t) => t.id === override) ? override : "";
  const tier = SUPPORT_TIERS.find((t) => t.id === choice);
  if (tier) return { stage: tier.stage, tier: tier.id, override: true, reason: `You chose ${tier.label} support (${tier.detail}). Change it on your Growth Map any time.` };
  const profile = buildProfile(Array.isArray(entries) ? entries : [], { band });
  const u = profile.byUse[use] || { n: 0, independent: 0 };
  const sig = signals || loadAdaptSignals(band);
  const missed = Object.entries(sig.checkinMissed || {}).find(([skill]) => CHECKIN_KLU[skill] === use);
  const worldsDone = Object.entries(WORLD_DOMAIN).filter(([id, d]) => (!domain || d === domain) && sig.worlds?.[id]).reduce((s, [id]) => s + sig.worlds[id], 0);
  if (u.n >= 3 && u.independent >= 2) return { stage: "supported", override: false, reason: `You did ${u.independent} ${use} tasks on your own — you start with a word bank only.` };
  if (u.n >= 1) return { stage: "supported", override: false, reason: `You have tried ${u.n} ${use} task${u.n === 1 ? "" : "s"} before — you start with a word bank.` };
  if (worldsDone >= 2 && !missed) return { stage: "supported", override: false, reason: `You finished ${worldsDone} Language World transfer missions — you start with a word bank.` };
  if (missed) return { stage: "guided", override: false, reason: `Your ${missed[1][0]} check-in suggested practicing this — frames, words and a model are open. Fade them when you are ready.` };
  return { stage: "guided", override: false, reason: "New kind of task — frames, words and a model are open. Fade them when you are ready." };
}

// ── spaced review ─────────────────────────────────────────────────────────────
const PERFORMANCE_OK = 0.7;
const patternName = (id) => DETECTORS.find((d) => d.id === id)?.name || id;
const skillName = (id) => SKILLS.find((s) => s.id === id)?.name || id;
const ago = (d) => (d === 0 ? "earlier today" : d === 1 ? "yesterday" : `${d} days ago`);
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

function helpPhrase(ev) {
  if (ev.independent) return "on your own";
  const names = ev.entry ? supportsUsed(ev.entry) : [];
  if (names.length > 1) return `with ${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  return names.length ? `with ${names[0]}` : "with help";
}

function nextPhrase(s) {
  if (s.last.guessed) return "you marked it a guess, so one more try on your own will help it stick";
  if (!s.last.independent) return "try a quick independent check today";
  if (!s.last.ok) return "one more short try today will help it stick";
  return `you showed it on your own, and a quick check after ${s.interval} days helps you keep it`;
}

/**
 * Items due for spaced review today. Skill nodes (skill-graph) and error patterns (errors.js ids),
 * each scheduled on the 1 → 3 → 7 → 14-day ladder from independent vs scaffolded evidence. Each item
 * carries a `reason` composed only from its stored evidence (when, which supports, what happened).
 */
export function dueForReview(entries, now = Date.now(), { records = {}, n = 3 } = {}) {
  const log = (Array.isArray(entries) ? entries : []).filter((e) => e && typeof e === "object");
  const byId = new Map(log.filter((e) => e.id).map((e) => [e.id, e]));
  let evidence = [];
  try {
    evidence = [...evidenceFromLedger(log), ...evidenceFromPracticeRecords(isObj(records) ? records : {})];
  } catch {
    evidence = [];
  }
  const skillEvents = new Map();
  for (const ev of evidence) {
    if (!(dayNumber(ev.createdAt) > 0)) continue;
    if (!skillEvents.has(ev.skillId)) skillEvents.set(ev.skillId, []);
    skillEvents.get(ev.skillId).push({ t: ev.createdAt, independent: ev.independenceLevel === "independent", ok: ev.normalizedPerformance >= PERFORMANCE_OK && ev.selfSure !== 1, guessed: ev.selfSure === 1, perf: ev.normalizedPerformance, source: ev.responseId, entry: byId.get(ev.responseId) || null, activity: ev.activityId });
  }
  const items = [];
  for (const [id, events] of skillEvents) {
    const s = reviewSchedule(events, now);
    if (!s?.due) continue;
    const skill = SKILLS.find((k) => k.id === id);
    const name = skillName(id);
    items.push({ key: `skill:${id}`, kind: "skill", id, domain: skill?.domain || "", name, ...s, source: s.last.source, perf: s.last.perf, reason: `You practiced “${lowerFirst(name)}” ${helpPhrase(s.last)} ${ago(s.daysSince)}; ${nextPhrase(s)}.` });
  }
  // One writing or speaking draft feeds several skill nodes; review the one it showed least.
  const bySource = new Map();
  for (const it of items) {
    const prev = bySource.get(it.source);
    if (!prev || it.perf < prev.perf) bySource.set(it.source, it);
  }
  const out = [...bySource.values()];
  for (const [id, events] of patternReviewEvents(log)) {
    const s = reviewSchedule(events, now);
    if (!s?.due) continue;
    const name = patternName(id);
    const where = s.last.entry?.src === "detective" ? `You practiced the pattern “${name}” in Error Detective ${helpPhrase(s.last)} ${ago(s.daysSince)}` : `The pattern “${name}” showed up in your ${s.last.entry?.src === "speaking" ? "speaking" : "writing"} ${ago(s.daysSince)}`;
    out.push({ key: `pattern:${id}`, kind: "pattern", id, domain: "Writing", name, ...s, source: s.last.entry?.id || null, reason: `${where}; ${nextPhrase(s)}.` });
  }
  return out
    .sort((a, b) => b.daysSince - b.interval - (a.daysSince - a.interval) || a.step - b.step || a.key.localeCompare(b.key))
    .slice(0, Math.max(0, n))
    .map(({ last, perf, ...it }) => ({ ...it, lastAt: last.t, independent: last.independent }));
}
