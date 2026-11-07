// Unit Check: a short mixed set for one Reveal Math Grade 6 unit, untimed, first try and no hints counted as
// independent. It can confirm several skills at once (a skill is confirmed when every one of its problems was right
// on the first try without help), and a learner can take one check per unit per day so it cannot be retaken until
// it passes. Scope and unit titles follow data/reveal-toc-2025.json; unit 10 ("Math Is...") has no skills and
// unit 1 is mindset, so neither has a check. Confirming a skill is evidence of independent work, never a grade.
import { findSkill } from "./tutor-engine.js";
import { profileKey, profiles, readLocal, writeLocal } from "./school-tools.js";

export const UNIT_CHECK_KEY = "ewl-fluency-unitchecks-v1";
export const PROBLEMS_PER_SKILL = 2;
export const CHECKS_PER_UNIT_PER_DAY = 1;

export const UNIT_CHECKS = Object.freeze([
  { id: "g6-u2", unit: 2, en: "Understanding the World Around Us Through Statistics", es: "Entender el mundo que nos rodea con la estadística", keys: ["5:divide-whole", "6:decimal-ops"] },
  { id: "g6-u3", unit: 3, en: "Ratios and Rates", es: "Razones y tasas", keys: ["6:ratios", "6:unit-rates"] },
  { id: "g6-u4", unit: 4, en: "Understand and Use Percentages", es: "Entender y usar porcentajes", keys: ["6:percent", "5:fraction-of"] },
  { id: "g6-u5", unit: 5, en: "Solve Area, Surface Area, and Volume Problems", es: "Resolver problemas de área, área de superficie y volumen", keys: ["6:triangle-area", "5:volume"] },
  { id: "g6-u6", unit: 6, en: "Numerical and Algebraic Expressions", es: "Expresiones numéricas y algebraicas", keys: ["6:divide-fractions", "6:evaluate", "6:gcf", "6:lcm"] },
  { id: "g6-u7", unit: 7, en: "Integers, Rational Numbers, and the Coordinate Plane", es: "Enteros, números racionales y el plano de coordenadas", keys: ["6:integers", "7:integer-add"] },
  { id: "g6-u8", unit: 8, en: "Equations and Inequalities", es: "Ecuaciones y desigualdades", keys: ["6:one-step", "7:inequalities"] },
  { id: "g6-u9", unit: 9, en: "Relationships Between Two Variables", es: "Relaciones entre dos variables", keys: ["6:evaluate", "8:functions"] },
]);

export const unitCheckById = (id) => UNIT_CHECKS.find((unit) => unit.id === id) || null;
export const unitCheckGrade = 6;

// The problems of one check: PROBLEMS_PER_SKILL per skill, in a shuffled mix, each planned as an independent first try
// at grade level (tier 3), so nothing is shown before the learner answers.
export function unitCheckQueue(unit, rng = Math.random) {
  const queue = unit.keys.flatMap((key) =>
    Array.from({ length: PROBLEMS_PER_SKILL }, () => ({
      key,
      purpose: "Unit Check",
      independent: true,
      tier: 3,
    })),
  );
  for (let i = queue.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  return queue;
}

// ---- results, kept on the device per learner: { [unitId]: { day, count, at, confirmed: [keys] } } ----
const dayOf = (time) => {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export function cleanUnitChecks(value) {
  const out = {};
  if (!value || typeof value !== "object") return out;
  for (const unit of UNIT_CHECKS) {
    const entry = value[unit.id];
    if (!entry || typeof entry !== "object") continue;
    const confirmed = (Array.isArray(entry.confirmed) ? entry.confirmed : []).filter((key) => unit.keys.includes(key));
    out[unit.id] = {
      day: /^\d{4}-\d{2}-\d{2}$/.test(entry.day) ? entry.day : "",
      count: Math.min(99, Math.max(0, Math.floor(Number(entry.count)) || 0)),
      at: Number.isFinite(entry.at) ? entry.at : 0,
      confirmed: [...new Set(confirmed)],
    };
  }
  return out;
}

const key = () => profileKey(UNIT_CHECK_KEY, profiles().active);
export const loadUnitChecks = () => cleanUnitChecks(readLocal(key(), {}));

// Rate limit: CHECKS_PER_UNIT_PER_DAY starts per unit per local day.
export function canStartUnitCheck(records, id, now = Date.now()) {
  const entry = records[id];
  return !(entry && entry.day === dayOf(now) && entry.count >= CHECKS_PER_UNIT_PER_DAY);
}

// Counts the start of a check. Returns the updated records, or null when today's check was already used.
export function startUnitCheck(id, now = Date.now(), records = loadUnitChecks()) {
  if (!unitCheckById(id) || !canStartUnitCheck(records, id, now)) return null;
  const entry = records[id];
  const sameDay = entry?.day === dayOf(now);
  const next = {
    ...records,
    [id]: { day: dayOf(now), count: sameDay ? entry.count + 1 : 1, at: now, confirmed: entry?.confirmed || [] },
  };
  writeLocal(key(), next);
  return next;
}

// results: { [skillKey]: { right, total } } from the finished check. A skill is confirmed when every problem was right
// on the first try without help. A confirmed skill stays confirmed: a later check cannot take it back.
export function unitCheckOutcome(unit, results) {
  const rows = unit.keys.map((skillKey) => {
    const { right = 0, total = 0 } = results?.[skillKey] || {};
    return { key: skillKey, right, total, confirmed: total > 0 && right === total };
  });
  return { rows, confirmed: rows.filter((row) => row.confirmed).map((row) => row.key) };
}

export function saveUnitCheckResult(id, results, now = Date.now(), records = loadUnitChecks()) {
  const unit = unitCheckById(id);
  if (!unit) return null;
  const outcome = unitCheckOutcome(unit, results);
  const entry = records[id] || { day: dayOf(now), count: 1, at: now, confirmed: [] };
  const next = {
    ...records,
    [id]: { ...entry, at: now, confirmed: [...new Set([...entry.confirmed, ...outcome.confirmed])] },
  };
  writeLocal(key(), next);
  return { outcome, records: next };
}

export const unitCheckSkillTitle = (skillKey) => findSkill(skillKey)?.title || skillKey;

// The Practice hub's Unit Check section (Grade 6 only). `t` is the page's translator; unit titles carry both languages.
export function unitCheckPanelHtml({ grade, lang, t, records = loadUnitChecks(), now = Date.now() }) {
  if (grade !== unitCheckGrade) return "";
  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const cards = UNIT_CHECKS.map((unit) => {
    const entry = records[unit.id];
    const blocked = !canStartUnitCheck(records, unit.id, now);
    const done = entry?.confirmed?.length || 0;
    const status = blocked
      ? t("Checked today. Practise, then try again tomorrow.")
      : done
        ? t("{done} of {total} skills confirmed", { done, total: unit.keys.length })
        : t("{total} skills, {n} problems", { total: unit.keys.length, n: unit.keys.length * PROBLEMS_PER_SKILL });
    return `<li><button type="button" class="outline-action practice-hub-card" data-start-unit="${unit.id}" ${blocked ? 'aria-disabled="true"' : ""}><strong>${esc(t("Unit {n}", { n: unit.unit }))}</strong><span>${esc(lang === "es" ? unit.es : unit.en)}</span><span>${esc(status)}</span></button></li>`;
  }).join("");
  return `<section class="unit-check" aria-labelledby="unit-check-title"><h3 id="unit-check-title">${esc(t("Unit Check"))}</h3>
    <p>${esc(t("A short mixed set for one unit. Nothing is timed. A skill is confirmed when every problem is right on the first try without help."))}</p><ul class="unit-check-grid">${cards}</ul></section>`;
}
