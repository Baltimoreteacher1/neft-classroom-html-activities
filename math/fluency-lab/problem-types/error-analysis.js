// "A classmate's worked solution with one specific error" for every skill, built on the mistake bank
// (mistake-bank.js: templates, named slips). The learner finds the step, repairs it, or names the slip.
// Level sets the task: 1 find the step, 2 repair it, 3 name the slip, 4 repair it (error hidden after a correct
// step), 5 name the slip (same). The bank's own tests prove each chain; the 4.0 test re-proves it from meta.check.
import { getLang, setLang } from "../i18n.js";
import { buildWorkItem, describeAsk } from "../mistake-bank.js";
import { slipInfo } from "../mistake-notes.js";
import { bi } from "./kit.js";

const TASK = { 1: "find", 2: "fix", 3: "slip", 4: "fix", 5: "slip" };

// Run a reader of t() strings in Spanish without changing what the page is showing.
function inSpanish(read) {
  const was = getLang();
  setLang("es", { persist: false });
  try {
    return read();
  } finally {
    setLang(was, { persist: false });
  }
}

const cleanPunctuation = (text) => String(text).replace(/\s+([,.;:?!])/g, "$1");
const stop = (text) => {
  const clean = cleanPunctuation(text);
  return /[.?!]$/.test(clean) ? clean : `${clean}.`;
};
const lines = (item) => item.steps.map((step, i) => `Step ${i + 1}: ${cleanPunctuation(step)}.`).join(" ");
const linesEs = (item) => item.steps.map((step, i) => `Paso ${i + 1}: ${cleanPunctuation(step)}.`).join(" ");

export function errorAnalysisDraft({ rng, level, skill }) {
  const task = TASK[level];
  let item = null;
  for (let tries = 0; tries < 12; tries += 1) {
    item = buildWorkItem(skill, Math.floor(rng() * 2 ** 31));
    if (level < 4 || (item.bad >= 1 && item.steps.length >= 4)) break;
  }
  if (level >= 4 && item.bad < 1) item = buildWorkItem(skill, Math.floor(rng() * 2 ** 31));
  const n = item.bad + 1;
  const ask = describeAsk(item);
  const askEs = cleanPunctuation(inSpanish(() => describeAsk(item)));
  const frame = {
    en: `A classmate worked on this: ${stop(ask)} ${lines(item)}`,
    es: `Un compañero trabajó en esto: ${stop(askEs)} ${linesEs(item)}`,
  };
  const before = item.bad === 0 ? item.start : item.steps[item.bad - 1];
  const work = { start: item.start, steps: item.steps, bad: item.bad };
  const base = {
    form: "choice",
    meta: { family: item.family, template: item.template, work, mode: item.mode },
    check: { kind: "work", role: "answer", mode: item.mode, start: item.start, steps: item.steps, bad: item.bad, fix: item.fix, fixes: item.fixes, slip: item.slip, slips: item.slips, task },
  };
  if (task === "find") {
    const others = item.steps.map((_, i) => i + 1).filter((i) => i !== n);
    return {
      ...base,
      q: bi(`${frame.en} Which step is the first one with a mistake?`, `${frame.es} ¿Cuál es el primer paso con un error?`),
      answer: `Step ${n}`,
      answerEs: `Paso ${n}`,
      options: others.map((i) => ({ text: `Step ${i}`, es: `Paso ${i}`, why: i < n ? "this step still equals the one before it" : "it comes after the first mistake, so it only follows the slip" })),
      steps: ["Check each step against the step before it. A correct step keeps the same value.", `Step ${n} (${item.steps[item.bad]}) does not keep the value of ${before}.`],
      work,
    };
  }
  if (task === "fix") {
    return {
      ...base,
      q: bi(`${frame.en} What should Step ${n} be?`, `${frame.es} ¿Cómo debería ser el Paso ${n}?`),
      answer: item.fix,
      options: item.fixes.filter((f) => f !== item.fix).map((f) => ({ text: f, why: "a repair that does not keep the value of the step before it" })),
      steps: ["Find the first step that changes the value.", "A repaired step must have the same value as the step before it.", `Step ${n} should be ${item.fix}.`],
      work,
    };
  }
  const label = slipInfo(item.slip).label;
  const labelEs = inSpanish(() => slipInfo(item.slip).label);
  return {
    ...base,
    q: bi(`${frame.en} What went wrong in Step ${n}?`, `${frame.es} ¿Qué salió mal en el Paso ${n}?`),
    answer: label,
    answerEs: labelEs,
    options: item.slips
      .filter((id) => id !== item.slip)
      .map((id) => ({ text: slipInfo(id).label, es: inSpanish(() => slipInfo(id).label), why: `slip:${id}` })),
    steps: ["Find the first step that changes the value.", "Compare it with a step that keeps the value.", `The slip: ${label}.`],
    work,
  };
}
