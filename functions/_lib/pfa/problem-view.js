// Markup for problems, shared by the server renderer and the browser runtime (similar problems and
// the worked parallel example are drawn in the browser with exactly the same markup).
// Every user-visible string is rendered in BOTH languages as <span class="lang-en|lang-es">; the page
// shows one, and the hidden one is display:none, so it is out of the accessibility tree.

import { generate } from "./generators.js";
import { renderVisual } from "./math-visuals.js";
import { UI } from "./strings.js";

export const h = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Bilingual inline text. `o` is {en, es} or a UI key.
export function bi(o, tag = "span", vars = null) {
  const src = typeof o === "string" ? UI[o] : o;
  if (!src) return "";
  const fill = (s) =>
    vars ? String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`)) : s;
  return `<${tag} class="lang-en" lang="en">${h(fill(src.en))}</${tag}><${tag} class="lang-es" lang="es">${h(fill(src.es ?? src.en))}</${tag}>`;
}

// Math-friendly text: x^2 -> x², keeps everything else escaped.
export function mathText(s) {
  return h(s).replace(/\^(\d)/g, (_, d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)]);
}
export function biMath(o, tag = "span") {
  return `<${tag} class="lang-en" lang="en">${mathText(o.en)}</${tag}><${tag} class="lang-es" lang="es">${mathText(o.es ?? o.en)}</${tag}>`;
}

const FIX_NAMES = ["Jalen", "Sofía", "Malik", "Yesenia", "Tariq", "Camila"];

// Body of a generated problem (entry or multiple choice). `pid` scopes ids.
export function genBody(p, pid, opts = {}) {
  const vis = p.visual ? `<div class="p-visual">${renderVisual(p.visual)}</div>` : "";
  let prompt = biMath(p.stem, "span");
  if (opts.fixit) {
    const name = FIX_NAMES[p.seed % FIX_NAMES.length];
    const wrongV = p.distractors[0]?.value ?? "?";
    prompt = `${biMath(p.stem)} <strong class="classmate">${bi("classmateSays", "span", { name, v: wrongV })}</strong>`;
  }
  let input;
  if (p.kind === "mc") {
    input = `<fieldset class="choices"><legend class="sr">${bi("yourAnswer")}</legend>${p.choices
      .map(
        (c, _i) =>
          `<label class="choice"><input type="radio" name="${pid}-c" value="${h(c)}"> <span>${mathText(c)}</span></label>`,
      )
      .join("")}</fieldset>`;
  } else {
    const unit = p.unit ? `<span class="unit">${bi(p.unit)}</span>` : "";
    input = `<div class="answer-row"><label class="sr" for="${pid}-in">${bi("yourAnswer")}</label><input type="text" id="${pid}-in" inputmode="${p.answerType === "number" ? "decimal" : "text"}" autocomplete="off" spellcheck="false" aria-describedby="${pid}-fb">${unit}</div>`;
  }
  return `<p class="p-prompt" id="${pid}-q">${prompt}</p>${vis}${input}`;
}

// A worked parallel example: same skill, different numbers, every step shown. Used as hint 3.
export function workedExample(spec, seed) {
  const p = generate(spec, seed);
  const vis = p.visual ? `<div class="p-visual">${renderVisual(p.visual)}</div>` : "";
  const steps = (lang) =>
    `<ol class="steps lang-${lang}" lang="${lang}">${p.steps[lang].map((s) => `<li>${mathText(s)}</li>`).join("")}</ol>`;
  return `<p>${biMath(p.stem)}</p>${vis}${steps("en")}${steps("es")}<p><strong>${bi(p.unit ? { en: `Answer: ${p.answer} ${p.unit.en}`, es: `Respuesta: ${p.answer} ${p.unit.es}` } : { en: `Answer: ${p.answer}`, es: `Respuesta: ${p.answer}` })}</strong></p>`;
}

// Check data the browser needs for a generated problem (no markup).
export function genCheck(p, fixit = false) {
  return {
    kind: p.kind === "mc" ? "mc-gen" : "entry",
    answer: p.answer,
    answerType: p.answerType,
    known: (p.distractors || []).map((d) => ({ value: d.value, tag: d.tag, why: d.why })),
    solution: p.steps,
    fixit,
  };
}
