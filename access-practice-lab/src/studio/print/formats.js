// The STUDENT paper form of each question format: no answers, no hints, no explanations. Returns HTML strings.
// Every format has a sensible way to answer with a pencil; where it differs from the interactive version,
// transformations.js says so.

import { esc, mathHtml } from "./html.js";
import {
  LETTERS,
  blankModel,
  buildModel,
  choiceModel,
  fillTableModel,
  hotspotModel,
  identifyText,
  matchModel,
  orderModel,
  sortModel,
  writingLines,
} from "./paper-model.js";
import { PRINT_STRINGS, tr } from "./strings.js";
import { gridSvg, numberLineSvg } from "./svg.js";

/** Chrome text for `lang`; in bilingual mode the Spanish half is marked lang="es" for screen readers. */
export function chrome(lang, path) {
  if (lang === "es") return `<span lang="es">${esc(tr("es", path))}</span>`;
  if (lang !== "bi") return esc(tr(lang, path));
  const node = path.split(".").reduce((o, k) => o?.[k], PRINT_STRINGS);
  if (!node || node.en === node.es) return esc(node?.en ?? "");
  return `${esc(node.en)} <span class="es" lang="es">/ ${esc(node.es)}</span>`;
}

const bubble = '<span class="bubble"></span>';
const checkbox = '<span class="check"></span>';
const line = (cls = "") => `<span class="line${cls ? ` ${cls}` : ""}"></span>`;
const rules = (n) => Array.from({ length: n }, () => '<div class="rule"></div>').join("");
const how = (c, key) => `<p class="how">${chrome(c.lang, `how.${key}`)}</p>`;
const workBox = (c) =>
  `<div class="workbox ${c.workspace}"><span class="tag">${chrome(c.lang, "workSpace")}</span></div>`;

const FORMATS = {
  choice: (c, q) =>
    `${how(c, "choice")}<ul class="opts">${choiceModel(q)
      .map(
        (o) =>
          `<li>${bubble}<b class="letter">${o.letter}</b><span>${mathHtml(o.text)}</span></li>`,
      )
      .join("")}</ul>`,

  multi: (c, q) =>
    `${how(c, "multi")}<ul class="opts">${choiceModel(q)
      .map(
        (o) =>
          `<li>${checkbox}<b class="letter">${o.letter}</b><span>${mathHtml(o.text)}</span></li>`,
      )
      .join("")}</ul>`,

  match: (c, q) => {
    const m = matchModel(c.activity, q);
    return `${how(c, "match")}<div class="match"><ol class="left">${m.left
      .map((l) => `<li>${line("short")}<span>${mathHtml(l.text)}</span></li>`)
      .join("")}</ol><ul class="right">${m.right
      .map((r) => `<li><b class="letter">${r.letter}</b><span>${mathHtml(r.text)}</span></li>`)
      .join("")}</ul></div>`;
  },

  sort: (c, q) => {
    const m = sortModel(c.activity, q);
    const head = m.categories.map((cat) => `<th scope="col">${mathHtml(cat.label)}</th>`).join("");
    const rows = Array.from(
      { length: m.rows },
      () => `<tr>${m.categories.map(() => "<td></td>").join("")}</tr>`,
    ).join("");
    return `${how(c, "sort")}<ul class="chips">${m.bank.map((b) => `<li>${mathHtml(b.text)}</li>`).join("")}</ul><table class="sorttable"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
  },

  order: (c, q) => {
    const m = orderModel(c.activity, q);
    const slots = Array.from({ length: m.slots }, (_, i) => `<li>${line("tiny")}</li>`).join("");
    return `${how(c, "order")}<ul class="opts plain">${m.items
      .map((o) => `<li><b class="letter">${o.letter}</b><span>${mathHtml(o.text)}</span></li>`)
      .join("")}</ul><ol class="slots">${slots}</ol>`;
  },

  blank: (c, q) => {
    const m = blankModel(c.activity, q);
    const body = m.parts
      .map((p) =>
        p.t === "text"
          ? mathHtml(p.v)
          : `<span class="blank"><span class="bn">${p.n}</span></span>`,
      )
      .join("");
    const bank = m.bank.length
      ? `<div class="bank"><span class="tag">${chrome(c.lang, "wordBank")}</span><ul class="chips">${m.bank.map((w) => `<li>${mathHtml(w)}</li>`).join("")}</ul></div>`
      : "";
    return `${how(c, m.bank.length ? "bank" : "blank")}${bank}<p class="cloze">${body}</p>`;
  },

  number: (c, q) =>
    `${how(c, "number")}${workBox(c)}<p class="answerline"><span class="tag">${chrome(c.lang, "answer")}:</span> ${line("long")}${q.unit ? ` <span class="unit">${esc(q.unit)}</span>` : ""}</p>`,

  short: (c, q) =>
    `${how(c, q.kind === "explain" ? "explain" : "write")}<div class="writing">${rules(writingLines(q, c.workspace))}</div>`,

  identify: (c, q) =>
    `${how(c, "identify")}<blockquote class="circle">${mathHtml(identifyText(q))}</blockquote>`,

  hotspot: (c, q) => {
    const m = hotspotModel(q);
    const boxes = m.regions
      .map(
        (r) =>
          `<span class="region" style="left:${num(r.x)}%;top:${num(r.y)}%;width:${num(r.w)}%;height:${num(r.h)}%"><b>${r.letter}</b></span>`,
      )
      .join("");
    const pic = m.image
      ? `<img src="${esc(m.image)}" alt="${esc(m.alt)}">`
      : `<div class="nopic" role="img" aria-label="${esc(m.alt)}">${chrome(c.lang, "picturePlaceholder")}</div>`;
    return `${how(c, "hotspot")}<div class="hotspot"><div class="pic">${pic}${boxes}</div><ul class="opts plain">${m.regions
      .map((r) => `<li><b class="letter">${r.letter}</b><span>${mathHtml(r.label)}</span></li>`)
      .join(
        "",
      )}</ul><p class="answerline"><span class="tag">${chrome(c.lang, "answer")}:</span> ${line("tiny")}</p></div>`;
  },

  numberline: (c, q) => `${how(c, "numberline")}<div class="figwrap">${numberLineSvg(q)}</div>`,

  plot: (c, q) => `${how(c, "plot")}<div class="figwrap grid">${gridSvg(q)}</div>`,

  build: (c, q) => {
    const m = buildModel(c.activity, q);
    return `${how(c, "build")}<ul class="cards">${m.cards.map((w) => `<li>${esc(w)}</li>`).join("")}</ul><p class="tag">${chrome(c.lang, "yourSentence")}</p><div class="writing">${rules(2)}</div>`;
  },

  error: (c, q) =>
    `${how(c, "error")}<ol class="steps">${q.steps
      .map(
        (s, i) =>
          `<li><span class="stepno">${chrome(c.lang, "step")} ${i + 1}</span><span class="stepbox">${mathHtml(s.text)}</span></li>`,
      )
      .join("")}</ol><p class="tag">${chrome(c.lang, "fix")}</p><ul class="opts">${q.fixOptions
      .map(
        (o, i) =>
          `<li>${bubble}<b class="letter">${LETTERS[i]}</b><span>${mathHtml(o.text)}</span></li>`,
      )
      .join("")}</ul>`,

  fillTable: (c, q) => {
    const m = fillTableModel(q);
    const head = m.headers.map((h) => `<th scope="col">${mathHtml(h)}</th>`).join("");
    const rows = m.rows
      .map(
        (r) =>
          `<tr>${r.map((cell) => (cell.blank ? '<td class="empty"></td>' : `<td>${mathHtml(cell.text)}</td>`)).join("")}</tr>`,
      )
      .join("");
    return `${how(c, "fillTable")}<table class="datatable ${c.workspace}"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
  },
};

const num = (v) =>
  Number.isFinite(Number(v)) ? Math.max(0, Math.min(100, Number(v))).toFixed(2) : "0";

/** The answer area of one question for the student copy. */
export const renderQuestionBody = (c, q) => (FORMATS[q.format] || FORMATS.choice)(c, q);
