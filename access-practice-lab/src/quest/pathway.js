// Language Quest pathway: the support ladder's fading rule and the "what next?" recommender. Both are small, visible rules
// that return their reasons. Neither infers a WIDA level or a mastery score: they read what the learner did (rung used,
// help opened, hints, revision) and nothing else. A recommendation is a suggestion; every mission stays open.
import { RUNGS, rungIndex } from "./engine.js";

/**
 * One finished run, as stored in `prog[missionId].runs`:
 *   { fn: ["Argue"], rung, help, hints, revised, requiredMet, at }
 * `help` = the learner asked for more support than the rung gave. Independent means rung "independent" and no help.
 */
export const wasStrong = (r) => r.requiredMet && !r.help && (r.hints || 0) <= 1;

/**
 * Suggest a starting rung for a language function. Fading needs two strong runs in a row at the same rung; a run that
 * needed help holds the rung (or steps one up when it needed help twice running). The teacher can pin a rung or turn
 * fading off, and the learner can always pick another rung by hand: this only chooses the default.
 */
export function suggestRung(history = [], teacher = {}) {
  if (teacher.pin && RUNGS.includes(teacher.pin)) return { rung: teacher.pin, why: { en: "Your teacher chose this support.", es: "Tu docente eligió este apoyo." } };
  const start = RUNGS.includes(teacher.start) ? teacher.start : "frame";
  if (!history.length) return { rung: start, why: { en: "A first try starts with a sentence frame. Change it any time.", es: "El primer intento empieza con un marco de oración. Cámbialo cuando quieras." } };
  const last = history.at(-1);
  const prev = history.at(-2);
  const i = rungIndex(last.rung);
  if (teacher.fade === false) return { rung: last.rung, why: { en: "Fading is off for this class.", es: "El desvanecimiento está desactivado para esta clase." } };
  if (last.help && prev?.help && prev.rung === last.rung && i > 0)
    return { rung: RUNGS[i - 1], why: { en: "You asked for more help twice in a row, so we start with a little more support.", es: "Pediste más ayuda dos veces seguidas, así que empezamos con un poco más de apoyo." } };
  if (wasStrong(last) && prev && wasStrong(prev) && prev.rung === last.rung && i < RUNGS.length - 1)
    return { rung: RUNGS[i + 1], why: { en: "Two strong tries in a row at this level. Try one step with less support.", es: "Dos buenos intentos seguidos en este nivel. Prueba un paso con menos apoyo." } };
  return { rung: last.rung, why: { en: "Stay here for another try.", es: "Quédate aquí para otro intento." } };
}

/** The rung one step *more* supportive than `rung`, or the same rung at the top. Used by "Ask for more help". */
export const moreSupport = (rung) => RUNGS[Math.max(0, rungIndex(rung) - 1)];

// Which function is productive practice after another. Named relationships only; nothing is scored.
export const NEXT_FUNCTIONS = {
  Question: ["Infer", "Explain"],
  Infer: ["Argue", "Explain"],
  Explain: ["Argue", "Compare"],
  Argue: ["Counter", "Evaluate"],
  Counter: ["Negotiate", "Evaluate"],
  Evaluate: ["Argue", "Inform"],
  Describe: ["Narrate", "Sequence"],
  Sequence: ["Narrate", "Describe"],
  Narrate: ["Describe", "Explain"],
  Define: ["Describe", "Explain"],
  Compare: ["Evaluate", "Argue"],
  Negotiate: ["Argue", "Counter"],
  Inform: ["Explain", "Compare"],
};

/**
 * Rank missions for one learner. Reasons are the whole story: each point comes from a stated rule.
 *   +4 the teacher named this function or mission        +3 follows the function you just finished on your own
 *   +2 matches an interest (world or tag)                +2 a function you have not practiced yet in this band
 *   +1 revisit: finished with support, so another run at less support is the useful next step
 *   -3 finished on my own already (still open, just not suggested)
 */
export function recommend({ missions, band, prog = {}, interests = [], teacher = {}, limit = 3 }) {
  const pool = missions.filter((m) => m.band === band);
  const practiced = new Set();
  let lastIndependentFn = null;
  let lastAt = "";
  for (const m of pool) {
    const p = prog[m.id];
    if (!p?.runs?.length) continue;
    for (const f of m.functions) practiced.add(f);
    const r = p.runs.at(-1);
    if (!r.help && r.rung === "independent" && (r.at || "") >= lastAt) {
      lastAt = r.at || "";
      lastIndependentFn = m.functions;
    }
  }
  const objectives = new Set(teacher.objectives || []);
  const ranked = pool.map((m) => {
    const reasons = [];
    let score = 0;
    const p = prog[m.id];
    const done = p?.runs?.length;
    const indep = p?.runs?.some((r) => r.rung === "independent" && !r.help);
    if (objectives.has(m.id) || m.functions.some((f) => objectives.has(f))) (score += 4), reasons.push({ en: "Your teacher asked for this skill.", es: "Tu docente pidió esta destreza." });
    if (lastIndependentFn && lastIndependentFn.some((f) => (NEXT_FUNCTIONS[f] || []).some((n) => m.functions.includes(n))) && !done)
      (score += 3), reasons.push({ en: "It builds on the skill you just finished on your own.", es: "Continúa la destreza que acabas de terminar por tu cuenta." });
    if (interests.includes(m.world) || m.tags?.some((t) => interests.includes(t))) (score += 2), reasons.push({ en: "It matches something you like.", es: "Coincide con algo que te gusta." });
    if (!done && m.functions.some((f) => !practiced.has(f))) (score += 2), reasons.push({ en: "A new language skill to try.", es: "Una destreza nueva para probar." });
    if (done && !indep) (score += 1), reasons.push({ en: "Try it again with less support.", es: "Inténtalo otra vez con menos apoyo." });
    if (indep) (score -= 3), reasons.push({ en: "You finished this one on your own. Replay it any time.", es: "Terminaste esta por tu cuenta. Puedes repetirla cuando quieras." });
    if (!reasons.length) reasons.push({ en: "A good next mission.", es: "Una buena misión para seguir." });
    return { mission: m, score, reasons };
  });
  ranked.sort((a, b) => b.score - a.score || a.mission.id.localeCompare(b.mission.id));
  return ranked.slice(0, limit);
}

/** Teacher catalog filter. Every filter is optional; text matches title, objective, functions and vocabulary. */
export function filterCatalog(missions, { band = "", domain = "", fn = "", world = "", q = "", minutes = 0 } = {}) {
  const needle = q.trim().toLowerCase();
  return missions.filter((m) => {
    if (band && m.band !== band) return false;
    if (domain && !m.domains.includes(domain)) return false;
    if (fn && !m.functions.includes(fn)) return false;
    if (world && m.world !== world) return false;
    if (minutes && m.minutes > minutes) return false;
    if (needle) {
      const hay = [m.title.en, m.objective.en, m.functions.join(" "), m.domains.join(" "), (m.vocab || []).map((v) => v.term).join(" "), (m.tags || []).join(" ")].join(" ").toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}
