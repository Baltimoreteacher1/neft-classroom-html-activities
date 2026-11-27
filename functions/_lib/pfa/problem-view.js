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
  // Display only: a true minus sign before a number (answers are still typed with hyphen-minus).
  return h(s)
    .replace(/\^(\d)/g, (_, d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)])
    .replace(/(^|[\s(,=:])-(?=\d)/g, "$1−");
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

// A table to complete. Blank cells are real text inputs labelled by their column header and row,
// so a screen reader announces "Cups of water, row 3" and a keyboard user tabs cell to cell.
export function tableBody(t, pid, { key = false, print = false } = {}) {
  const head = t.headers
    .map((hd, c) => `<th scope="col" id="${pid}-h${c}">${bi(hd)}</th>`)
    .join("");
  const body = t.rows
    .map((row, r) => {
      const cells = row
        .map((cell, c) => {
          const blank = t.blanks.find((b) => b.r === r && b.c === c);
          if (!blank) return `<td${c === 0 ? ` id="${pid}-r${r}"` : ""}>${mathText(cell)}</td>`;
          if (key) return `<td class="is-key">${mathText(blank.answer)}</td>`;
          if (print) return `<td class="is-blank"><span class="sr">?</span></td>`;
          return `<td class="is-blank"><input type="text" inputmode="decimal" autocomplete="off" data-blank="${t.blanks.indexOf(blank)}" aria-labelledby="${pid}-h${c} ${pid}-r${r}"></td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<p class="p-prompt" id="${pid}-q">${biMath(t.stem)}</p><div class="ptable-wrap"><table class="ptable" aria-describedby="${pid}-q"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

// A number line to place a point on. The SVG draws the line and any given marks; a native range
// input (aligned under the line) is the control, so tap, drag, arrow keys and screen readers all
// work without custom widget code. The point starts at 0, which is never an accepted answer.
export function lineBody(t, pid, { print = false } = {}) {
  // Ticks every 5 on a wide line (labels every 10) so it stays readable on a phone; the point
  // still moves in steps of t.step.
  const span = t.max - t.min;
  const tick = span > 24 ? 5 : t.step;
  const svg = renderVisual({
    type: "numberLine",
    min: t.min,
    max: t.max,
    step: tick,
    marks: t.marks,
    center: 0,
    labelEvery: span > 40 ? 2 : 1,
  });
  const control = print
    ? `<p class="tier-note">${bi({ en: "Draw a dot on the number line at your answer.", es: "Dibuja un punto en la recta numérica en tu respuesta." })}</p>`
    : `<div class="nl-track"><label class="sr" for="${pid}-nl">${bi({ en: "Your point on the number line", es: "Tu punto en la recta numérica" })}</label><input class="nl-range" type="range" id="${pid}-nl" min="${t.min}" max="${t.max}" step="${t.step}" value="0" aria-describedby="${pid}-q ${pid}-fb"></div><p class="nl-readout">${bi({ en: "Your point:", es: "Tu punto:" })} <output for="${pid}-nl" class="nl-value">0</output></p>`;
  return `<p class="p-prompt" id="${pid}-q">${biMath(t.stem)}</p><div class="p-visual nl-visual">${svg}</div>${control}`;
}
