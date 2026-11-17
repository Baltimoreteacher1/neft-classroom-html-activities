// Goal setting: the shared, pure model behind the Goal-Setting Form (WIDA Data Studio toolkit) and "My goals" in the
// lab. One bank of goals per grade band (content/goals/<band>.json), one set of option lists, no DOM. Both pages read
// this file, so a goal written by a teacher in the studio is the same goal a student sees in the lab.
import { STRATEGIES } from "../twr/registry.js";

/** Grade bands the bank is written for. K-12: the lab's own bands plus 4-5 and 9-12 (WIDA covers every grade). */
export const GOAL_BANDS = ["K", "1", "2-3", "4-5", "6-8", "9-12"];
export const GOAL_DOMAINS = ["listening", "speaking", "reading", "writing", "habits"];
export const DOMAIN_NAME = {
  listening: ["Listening", "Escuchar"],
  speaking: ["Speaking", "Hablar"],
  reading: ["Reading", "Leer"],
  writing: ["Writing", "Escribir"],
  habits: ["Habits and confidence", "Hábitos y confianza"],
};
export const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

/** Which bank a grade reads from. */
export const bandOfGrade = (grade) => {
  const g = String(grade).toUpperCase();
  if (g === "K") return "K";
  if (g === "1") return "1";
  const n = Number(g);
  if (n <= 3) return "2-3";
  if (n <= 5) return "4-5";
  if (n <= 8) return "6-8";
  return "9-12";
};

/** The lab content band a bank band's activity links use (the lab has no 4-5 or 9-12 content of its own). */
export const labBand = (band) => ({ "4-5": "3-5", "9-12": "6-8" })[band] || band;
/** The picker value for ?grades= links. */
export const pickerOf = (band) => ({ "3-5": "4-5", "9-12": "6-8" })[band] || band;

export const LINK_KINDS = ["twr", "speaking", "prep", "room"];
export const PREP_SLUGS = ["notes", "data-talk", "raters-eye", "word-meanings", "text-structures", "task-words", "daily-drill"];
const EARLY = new Set(["K", "1"]);

/** Whether a goal or step may point at this activity for this band (K-1 only get TWR and the skill rooms). */
export function bandHasLink(band, link) {
  if (!link) return false;
  if (link.kind === "twr") return Boolean(STRATEGIES[link.slug]?.bands.includes(labBand(band)));
  if (link.kind === "room") return ["Listening", "Speaking", "Reading", "Writing"].includes(link.slug);
  if (EARLY.has(band)) return false;
  if (link.kind === "speaking") return link.slug === "extempore-speak";
  if (link.kind === "prep") return PREP_SLUGS.includes(link.slug);
  return false;
}

/** Site path (under /access-practice-lab) for a link. */
export function linkPath(link, band) {
  const q = `?grades=${pickerOf(labBand(band))}`;
  if (link.kind === "twr") return `/twr/${link.slug}${q}`;
  if (link.kind === "speaking") return `/access-prep/extempore-speak${q}`;
  if (link.kind === "prep") return `/access-prep/${link.slug}${q}`;
  return `/${link.slug}${q}`;
}

/** WIDA proficiency level 1.0 to 6.0 -> the goal range written for it. */
export const rangeOfLevel = (lv) => (lv < 3 ? "1-2" : lv < 5 ? "3-4" : "5-6");
export const inRange = (goal, lv) => lv == null || (lv >= goal.lv[0] && lv < goal.lv[1] + 1);

/** Nearest WIDA level at or below a score, written the way the Level drop-down spells it ("3.5"). */
export const levelOption = (lv) => (lv == null || Number.isNaN(Number(lv)) ? "" : (Math.min(6, Math.max(1, Math.floor(Number(lv) * 2) / 2))).toFixed(1));

/** The bank goal that best fits a domain and a level: the first whose range holds the level, else the first. */
export function suggestGoal(bank, domain, level) {
  const goals = bank?.domains?.[domain]?.goals || [];
  const lv = level === "" || level == null ? null : Number(level);
  return goals.find((g) => inRange(g, lv)) || goals[0] || null;
}

/** The skill with the lowest level on a record, as a bank domain key ("speaking"); null when no skill has a level. */
export function lowestDomain(domainLevels) {
  let best = null;
  for (const d of ["listening", "speaking", "reading", "writing"]) {
    const v = domainLevels?.[d];
    if (v != null && (best === null || v < domainLevels[best])) best = d;
  }
  return best;
}
