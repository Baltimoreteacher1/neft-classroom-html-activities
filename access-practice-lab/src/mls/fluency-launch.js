// Student links contain only activity configuration. Return destinations are constructed from
// validated route data so embedded assignments cannot supply an arbitrary URL.
import { getFluencyMapping, studioSkillsForFluency } from "./fluency-map.js";

export const FLUENCY_ROOT = "/access-practice-lab/math-literacy";
export const studioSkillPath = (id) => id.replace(".", "-");

const oneOf = (value, choices, fallback) => choices.includes(value) ? value : fallback;
const seedOf = (input) => {
  if (!/^\d{1,10}$/.test(String(input))) return 1;
  const value = Number(input);
  return value >= 1 && value <= 0xffffffff ? value : 1;
};

export function fluencyLaunch(grade, sourceId, opts = {}) {
  const gradeText = String(grade);
  if (!/^[0-8]$/.test(gradeText)) return null;
  const skill = getFluencyMapping(Number(gradeText), sourceId);
  if (!skill) return null;
  const studio = studioSkillsForFluency(skill.grade, skill.id).includes(opts.studio) ? opts.studio : "";
  return {
    grade: skill.grade,
    sourceId: skill.id,
    studio,
    stage: oneOf(opts.stage, skill.capabilities?.race ? ["model", "practice", "game"] : ["model", "practice"], "practice"),
    support: oneOf(opts.support, ["more", "standard", "extension"], "standard"),
    level: Number(oneOf(String(opts.level), ["1", "2", "3"], "2")),
    lang: oneOf(opts.lang, ["en", "es", "bi"], "en"),
    seed: seedOf(opts.seed),
    from: opts.from === "family" && studio ? "family" : "",
    resume: opts.from === "family" && studio ? false : true,
    count: opts.from === "family" && studio ? 3 : undefined,
    title: skill.title,
  };
}

export function fluencyHref(grade, sourceId, opts = {}) {
  const launch = fluencyLaunch(grade, sourceId, opts);
  if (!launch) return "";
  const { studio, stage, support, level, lang, seed, from } = launch;
  const q = new URLSearchParams({ stage, support, level, lang, seed });
  if (studio) q.set("studio", studio);
  if (from) q.set("from", from);
  return `${FLUENCY_ROOT}/fluency/${launch.grade}/${launch.sourceId}?${q}`;
}

export function fluencyReturn(config) {
  const { grade, sourceId, studio, from, support, level, lang, seed } = config;
  if (from === "family") return `${FLUENCY_ROOT}/family/${studioSkillPath(studio)}?lang=${lang}`;
  const q = new URLSearchParams({ grade, support, level, lang, seed });
  if (studio) q.set("focus", sourceId);
  return studio
    ? `${FLUENCY_ROOT}/skill/${studioSkillPath(studio)}?${q}`
    : `${FLUENCY_ROOT}/teach?${q}`;
}
