// Shared kit for the 4.0 generators: seeded helpers, bilingual stems, and finish(), which turns a family's
// `draft` into a problem-bank item and refuses anything malformed (a draft that throws is redrawn by the caller).
//
// draft = {
//   q: { en, es },               stem in both languages (es may be omitted only when the stem has no words)
//   form: "int" | "decimal" | "fraction" | "mixed" | "percent" | "ratio" | "point" | "clock" | "text" | "choice",
//   answer: Q | [a, b] (ratio) | [Q, Q] (point) | minutes (clock) | string (text/choice key),
//   answerEs?: string            Spanish for a choice key that has words
//   simplest?: true              the typed fraction or ratio must be in lowest terms
//   units?: string[]             optional trailing words accepted after a typed number ("cm", "$", ...)
//   unit?: string                label shown beside the input
//   wrong?: [{ v: Q | string, why }]       typed items: plausible wrong answers (each tied to a named slip)
//   options?: [{ text, es?, why }]         choice items: the distractors (the key is added and shuffled in)
//   check: { kind, ... } | [{...}]         what an independent checker recomputes (see the test's evaluator)
//   hint, explanation, steps: string[]     steps never state the answer before the last one
//   model?: { graphic, config, shows }     from models.js
//   bare?: string                          the bare expression (item.expr)
//   meta?: {}                              extra facts for the checker
// }
import { leakCap } from "../step-leak.js";
import { DEFAULT_ACCEPT } from "./equivalence.js";
import { Q, decText, isInt, mixedText, qs } from "./rational.js";

export const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
export const pick = (rng, list) => list[Math.floor(rng() * list.length)];
export const chance = (rng, p = 0.5) => rng() < p;
export function shuffle(rng, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export const sample = (rng, list, count) => shuffle(rng, list).slice(0, count);
export const bi = (en, es = null) => ({ en, es });
export const fmt = (n) => n.toLocaleString("en-US");
export const SYMBOL = { add: "+", sub: "−", mul: "×", div: "÷" };
export const ASCII = { add: "+", sub: "-", mul: "*", div: "/" };

export const isWordy = (text) => /[A-Za-z]{3,}/.test(String(text || "").replace(/\b[xy]\b/g, ""));

const clock = (minutes) => {
  const m = ((minutes % 720) + 720) % 720;
  return `${Math.floor(m / 60) || 12}:${String(m % 60).padStart(2, "0")}`;
};

// Canonical typed text for an answer.
function canonical(form, answer) {
  switch (form) {
    case "int":
      if (!isInt(answer)) throw new Error(`int answer is not whole: ${qs(answer)}`);
      return String(answer.n);
    case "decimal": {
      const text = decText(answer);
      if (text === null) throw new Error(`decimal answer does not terminate: ${qs(answer)}`);
      return text;
    }
    case "fraction":
      return qs(answer);
    case "mixed":
      return mixedText(answer);
    case "percent":
      return decText(answer) ?? qs(answer);
    case "ratio":
      return `${answer[0]}:${answer[1]}`;
    case "point":
      return `(${qs(answer[0])},${qs(answer[1])})`;
    case "clock":
      return clock(answer);
    default:
      return String(answer);
  }
}

// Responses that must be accepted ("ok") and equal-looking ones that must be refused ("no"), for the checker.
function responses(form, answer, { simplest, units = [], accept }) {
  const ok = new Set();
  const no = new Set();
  if (["int", "decimal", "fraction", "mixed", "percent"].includes(form)) {
    const n = answer;
    const canon = canonical(form, answer);
    ok.add(`x = ${canon}`);
    if (isInt(n)) {
      const v = n.n;
      if (form !== "fraction" || accept.includes("decimal")) {
        ok.add(`${v}.0`);
        ok.add(`${v}.00`);
      }
      if (v >= 0 && v < 10) ok.add(`0${v}`);
      if (Math.abs(v) >= 1000) ok.add(v.toLocaleString("en-US"));
      if (v < 0) ok.add(`−${-v}`);
      if (form === "fraction" || form === "mixed") {
        if (simplest) no.add(`${v * 2}/2`);
        else ok.add(`${v * 2}/2`);
      }
    } else {
      const dec = decText(n);
      if (dec && accept.includes("decimal")) {
        ok.add(dec);
        if (Math.abs(n.n) < n.d) ok.add(dec.replace(/^(-?)0\./, "$1."));
        ok.add(`${dec}0`);
      }
      if (accept.includes("fraction")) {
        for (const k of [2, 3]) (simplest ? no : ok).add(`${n.n * k}/${n.d * k}`);
        if (Math.abs(n.n) > n.d) ok.add(qs(n));
      }
      if (accept.includes("mixed") && Math.abs(n.n) > n.d) ok.add(mixedText(n));
    }
    for (const unit of units.slice(0, 2)) ok.add(unit === "$" ? `$${canon}` : `${canon} ${unit}`);
    if (form === "percent") {
      ok.add(`${canon}%`);
      ok.add(`${canon} %`);
      const asFraction = Q(n.n, n.d * 100);
      const asDecimal = decText(asFraction);
      if (asDecimal && asDecimal !== canon) no.add(asDecimal);
    }
  } else if (form === "ratio") {
    const [a, b] = answer;
    ok.add(`${a} : ${b}`);
    ok.add(`${a} to ${b}`);
    (simplest ? no : ok).add(`${a * 2}:${b * 2}`);
  } else if (form === "point") {
    const [x, y] = answer.map(qs);
    ok.add(`(${x}, ${y})`);
    ok.add(`${x},${y}`);
    ok.add(`( ${x} , ${y} )`);
  } else if (form === "clock") {
    const text = clock(answer);
    ok.add(`${text} pm`);
    ok.add(`${text} am`);
  }
  ok.delete(canonical(form, answer));
  return { ok: [...ok], no: [...no] };
}

const TYPED = new Set(["int", "decimal", "fraction", "mixed", "percent", "ratio", "point", "clock", "text"]);
const KIND = { int: "number", decimal: "number", percent: "number", fraction: "fraction", mixed: "fraction", ratio: "text", point: "text", clock: "text", text: "text", choice: "choice" };

export function finish(draft, ctx) {
  const { form } = draft;
  if (!KIND[form]) throw new Error(`unknown form ${form}`);
  if (!draft.q?.en) throw new Error("draft has no stem");
  if (isWordy(draft.q.en) && !draft.q.es) throw new Error(`no Spanish for: ${draft.q.en}`);
  if (!draft.check) throw new Error("draft has no independent check");
  const steps = draft.steps || [];
  if (steps.length < 2) throw new Error("need at least two steps");
  const accept = draft.accept || (form === "int" ? ["int", "decimal"] : form === "decimal" ? ["int", "decimal"] : DEFAULT_ACCEPT);
  const key = canonical(form, draft.answer);
  if (/^[-−]0(\.0*)?$/.test(key)) throw new Error("negative zero");

  const item = {
    question: draft.q.en,
    questionEs: draft.q.es || null,
    answers: [key],
    displayAnswer: key,
    hint: draft.hint || steps[0],
    explanation: draft.explanation || steps.at(-1),
    steps,
    kind: KIND[form],
    choices: null,
    unit: draft.unit || "",
    model: draft.model ? { graphic: draft.model.graphic, config: draft.model.config } : null,
    generator: ctx.skill.generator,
    level: ctx.level,
    type: ctx.type,
  };
  if (draft.bare) item.expr = draft.bare;
  const meta = {
    skill: `${ctx.skill.grade}:${ctx.skill.id}`,
    level: ctx.level,
    type: ctx.type,
    form,
    answer: TYPED.has(form) && !["text", "ratio", "point", "clock"].includes(form) ? qs(draft.answer) : key,
    check: draft.check,
    ...(draft.model ? { shows: draft.model.shows } : {}),
    ...draft.meta,
  };

  if (form === "choice") {
    const options = draft.options || [];
    const texts = [key, ...options.map((o) => o.text)];
    if (options.length < 2) throw new Error("a choice item needs at least two distractors");
    if (new Set(texts.map((t) => String(t).toLowerCase())).size !== texts.length) throw new Error("duplicate choices");
    const order = shuffle(ctx.rng, [{ text: key, es: draft.answerEs }, ...options]);
    item.choices = order.map((o) => o.text);
    if (order.some((o) => isWordy(o.text))) {
      if (order.some((o) => !o.es)) throw new Error("choices with words need Spanish");
      item.choicesEs = order.map((o) => o.es);
    }
    meta.distractors = options.map((o) => ({ text: o.text, why: o.why }));
    if (options.some((o) => !o.why)) throw new Error("every distractor names its misconception");
  } else {
    item.equiv = buildEquiv(form, draft, accept);
    const { ok, no } = responses(form, draft.answer, { simplest: draft.simplest, units: draft.units, accept });
    meta.equivalents = ok;
    meta.refused = no;
    const wrong = draft.wrong || [];
    if (!wrong.length) throw new Error("a typed item lists plausible wrong answers");
    const seen = new Set([key]);
    meta.wrong = [];
    for (const w of wrong) {
      const text = canonical(form === "percent" ? "percent" : form, w.v);
      if (seen.has(text)) continue;
      seen.add(text);
      meta.wrong.push({ text, why: w.why });
    }
    if (!meta.wrong.length) throw new Error("no usable wrong answers");
  }
  item.meta = meta;
  if (leakCap(item) < steps.length - 1) throw new Error("an early step states the answer");
  return item;
}

function buildEquiv(form, draft, accept) {
  const base = { form: ["int", "decimal", "fraction", "mixed"].includes(form) ? "number" : form, accept };
  if (draft.simplest) base.simplest = true;
  if (draft.units) base.units = draft.units;
  if (base.form === "number" || form === "percent") return { ...base, value: qs(draft.answer) };
  if (form === "ratio") return { ...base, pair: draft.answer.map(String) };
  if (form === "point") return { ...base, pair: draft.answer.map(qs) };
  if (form === "clock") return { ...base, minutes: ((draft.answer % 720) + 720) % 720 };
  return { ...base, texts: [String(draft.answer)] };
}
