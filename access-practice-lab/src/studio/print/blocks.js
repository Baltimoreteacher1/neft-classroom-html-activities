// Non-question blocks on paper: directions and text, passages, vocabulary, images, math, tables, organizers,
// audio. Student copy only; teacher-only blocks (note) never reach this file.

import { safeImageSrc } from "../core/schema.js";
import { chrome } from "./formats.js";
import { esc, mathHtml, paragraphsHtml } from "./html.js";
import { animationPaper, diagramPaper } from "./paper-model.js";
import { PRINT_STRINGS, tr } from "./strings.js";

const orgText = (c, key) => esc(PRINT_STRINGS.org[c.lang === "es" ? "es" : "en"][key]);
const orgBi = (c, key) =>
  c.lang === "bi"
    ? `${orgText({ lang: "en" }, key)} <span class="es" lang="es">/ ${orgText({ lang: "es" }, key)}</span>`
    : orgText(c, key);

const cell = (c, title, cls = "") =>
  `<div class="ocell ${c.workspace} ${cls}">${title ? `<h3>${title}</h3>` : ""}</div>`;

const ORGANIZERS = {
  kwl: (c) =>
    `<div class="org kwl">${["know", "want", "learned"].map((k) => cell(c, orgBi(c, k))).join("")}</div>`,
  compare: (c, b) => {
    const [a = "", z = ""] = b.prompts;
    return `<div class="org compare">${cell(c, a ? mathHtml(a) : orgBi(c, "topic"))}${cell(c, orgBi(c, "both"))}${cell(c, z ? mathHtml(z) : orgBi(c, "topic"))}</div>`;
  },
  "cause-effect": (c, b) => {
    const rows = b.prompts.length ? b.prompts : ["", ""];
    return `<div class="org ce">${rows
      .map(
        (p) =>
          `<div class="cerow">${cell(c, orgBi(c, "cause"))}<span class="arrow" role="img" aria-label="leads to">→</span>${cell(c, p ? mathHtml(p) : orgBi(c, "effect"))}</div>`,
      )
      .join("")}</div>`;
  },
  "claim-evidence": (c, b) => {
    const [claim = "", ...rest] = b.prompts;
    const ev = rest.length ? rest : ["", "", ""];
    return `<div class="org ced">${cell(c, claim ? `${orgBi(c, "claim")}: ${mathHtml(claim)}` : orgBi(c, "claim"), "wide")}${ev
      .map((p, i) => cell(c, p ? mathHtml(p) : `${orgBi(c, "evidence")} ${i + 1}`))
      .join("")}</div>`;
  },
  web: (c, b) => {
    const [main = "", ...rest] = b.prompts;
    const sats = rest.length ? rest : ["", "", "", ""];
    return `<div class="org web"><div class="center">${main ? mathHtml(main) : orgBi(c, "main")}</div><div class="sats">${sats
      .map((p) => cell(c, p ? mathHtml(p) : ""))
      .join("")}</div></div>`;
  },
  sequence: (c, b) => {
    const steps = b.prompts.length ? b.prompts : ["", "", "", ""];
    return `<ol class="org seq">${steps
      .map((p) => `<li>${cell(c, p ? mathHtml(p) : "")}</li>`)
      .join("")}</ol>`;
  },
};

function vocabTable(c, b) {
  const gloss = c.spanish && b.items.some((i) => i.es);
  const pics = c.visuals;
  const head = [
    `<th scope="col">${chrome(c.lang, "term")}</th>`,
    `<th scope="col">${chrome(c.lang, "meaning")}</th>`,
    b.items.some((i) => i.example) ? `<th scope="col">${chrome(c.lang, "example")}</th>` : "",
    gloss ? `<th scope="col" lang="es">${esc(tr("es", "spanish"))}</th>` : "",
    pics ? `<th scope="col">${chrome(c.lang, "picture")}</th>` : "",
  ].join("");
  const rows = b.items
    .map((i) => {
      const src = i.image?.src ? safeImageSrc(i.image.src) : "";
      return `<tr><th scope="row">${mathHtml(i.term)}</th><td>${mathHtml(i.def)}</td>${
        b.items.some((x) => x.example) ? `<td>${mathHtml(i.example)}</td>` : ""
      }${gloss ? `<td lang="es">${esc(i.es)}</td>` : ""}${
        pics
          ? `<td class="pictd">${src ? `<img src="${esc(src)}" alt="${esc(i.image?.alt || "")}">` : ""}</td>`
          : ""
      }</tr>`;
    })
    .join("");
  return `<section class="vocab"><h2>${chrome(c.lang, "keyWords")}</h2><table class="datatable vt"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></section>`;
}

function figure(c, b) {
  const src = b.src ? safeImageSrc(b.src) : "";
  if (!src)
    return `<figure class="image"><div class="nopic" role="img" aria-label="${esc(b.alt)}">${chrome(c.lang, "picturePlaceholder")}</div>${caption(b)}</figure>`;
  return `<figure class="image"><img src="${esc(src)}" alt="${b.decorative ? "" : esc(b.alt)}">${caption(b)}</figure>`;
}
const caption = (b) => (b.caption ? `<figcaption>${mathHtml(b.caption)}</figcaption>` : "");

function dataTable(b) {
  const head = b.headers.length
    ? `<thead><tr>${b.headers.map((h) => `<th scope="col">${mathHtml(h)}</th>`).join("")}</tr></thead>`
    : "";
  const rows = b.rows
    .map((r) => `<tr>${r.map((x) => `<td>${mathHtml(x)}</td>`).join("")}</tr>`)
    .join("");
  return `<table class="datatable">${b.caption ? `<caption>${mathHtml(b.caption)}</caption>` : ""}${head}<tbody>${rows}</tbody></table>`;
}

/** Extra print CSS for diagram blocks (appended by worksheet.js): kept whole and kept with what follows. */
export const DIAGRAM_CSS =
  "figure.diagram{margin:0 0 14pt;text-align:center;break-inside:avoid;break-after:avoid}" +
  "figure.diagram svg{display:block;margin:0 auto;height:auto;max-height:4in}" +
  "figure.diagram figcaption{margin-top:4pt;font-size:11pt}";

function diagramFigure(c, b) {
  const d = diagramPaper(b, c.lang);
  if (!d.ok)
    return `<figure class="image"><div class="nopic" role="img" aria-label="${esc(tr(c.lang === "es" ? "es" : "en", "diagramMissing"))}">${chrome(c.lang, "diagramMissing")}</div></figure>`;
  const svg = d.svg.replace(/^<svg /, `<svg style="width:100%;max-width:${d.widthPt}pt" `);
  const es = d.captionEs ? ` <span class="es" lang="es">/ ${esc(d.captionEs)}</span>` : "";
  return `<figure class="diagram">${svg}<figcaption>${esc(d.caption)}${es}</figcaption></figure>`;
}

/** Extra print CSS for animation blocks (appended by worksheet.js): a numbered filmstrip, each frame kept whole. */
export const ANIMATION_CSS =
  "section.anim{margin:0 0 14pt}section.anim h2{margin:0 0 4pt;break-after:avoid}section.anim>p{break-after:avoid}" +
  "ol.anim-strip{margin:0}" +
  "li.anim-frame{display:grid;grid-template-columns:4.4in 1fr;gap:10pt;align-items:center;margin:0 0 7pt;padding:5pt;border:1.2pt solid #555;border-radius:5pt;break-inside:avoid}" +
  "li.anim-frame.wide{grid-template-columns:1fr}" +
  "li.anim-frame svg{display:block;width:100%;height:auto;max-height:3in}" +
  "li.anim-frame .anim-words{font-size:12pt;margin:0}" +
  "li.anim-frame .anim-no{display:inline-block;min-width:18pt;margin-right:5pt;font-weight:800}" +
  "section.anim .datatable{margin-top:6pt}";

function animationStrip(c, b) {
  const a = animationPaper(b, c.lang);
  const lang = c.lang === "es" ? "es" : "en";
  if (!a.ok)
    return `<figure class="image"><div class="nopic" role="img" aria-label="${esc(tr(lang, "animationMissing"))}">${chrome(c.lang, "animationMissing")}</div></figure>`;
  const es = (t) => (t ? ` <span class="es" lang="es">/ ${esc(t)}</span>` : "");
  const frames = a.frames
    .map((f, i) => {
      const svg = f.svg.replace(/^<svg /, `<svg style="max-width:${f.widthPt}pt" `);
      return `<li class="anim-frame${f.wide ? " wide" : ""}">${svg}<p class="anim-words"><span class="anim-no">${i + 1}.</span>${mathHtml(f.caption)}${es(f.captionEs)}</p></li>`;
    })
    .join("");
  const table = a.table
    ? `<table class="datatable"><thead><tr>${a.table.headers.map((x) => `<th scope="col">${esc(x)}</th>`).join("")}</tr></thead><tbody>${a.table.rows.map((r) => `<tr>${r.map((x) => `<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</tbody></table>`
    : "";
  const intro = a.explanation ? `<p>${mathHtml(a.explanation)}${es(a.explanationEs)}</p>` : "";
  return `<section class="anim" aria-label="${esc(a.alt)}"><h2>${esc(a.title)}${es(a.titleEs)}</h2>${intro}<ol class="anim-strip">${frames}</ol>${table}</section>`;
}

const BLOCKS = {
  text: (c, b) =>
    b.role === "heading"
      ? `<h2 class="sechead">${mathHtml(b.text)}</h2>`
      : b.role === "directions"
        ? `<div class="directions"><h2>${chrome(c.lang, "directions")}</h2>${paragraphsHtml(b.text)}</div>`
        : `<div class="body">${paragraphsHtml(b.text)}</div>`,
  passage: (_c, b) =>
    `<section class="passage">${b.title ? `<h2>${mathHtml(b.title)}</h2>` : ""}${paragraphsHtml(b.text)}</section>`,
  vocab: vocabTable,
  image: figure,
  math: (_c, b) =>
    `<div class="mathblock">${mathHtml(b.text)}${b.caption ? `<div class="cap">${mathHtml(b.caption)}</div>` : ""}</div>`,
  table: (_c, b) => `<div class="tablewrap">${dataTable(b)}</div>`,
  organizer: (c, b) =>
    `<section class="organizer">${(ORGANIZERS[b.kind] || ORGANIZERS.web)(c, b)}</section>`,
  diagram: diagramFigure,
  animation: animationStrip,
  audio: (c, b) =>
    `<div class="listen"><b>${esc(b.label || "Listen")}</b> — ${chrome(c.lang, "listen")}</div>`,
};

/** HTML for one non-question, non-note block on the student copy ("" when it has no paper form). */
export const renderBlock = (c, b) => (BLOCKS[b.type] ? BLOCKS[b.type](c, b) : "");
