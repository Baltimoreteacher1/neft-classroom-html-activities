/**
 * family-takehome-html.mjs: markup of the Family Take-Home Sheet and its grown-up page.
 *
 * `renderSheet` / `renderGuide` return one fragment each (no ids, so a fragment can sit inside the homework page
 * without duplicating anything the page already has). `standaloneDocument` wraps a fragment as the PDF source:
 * embedded fonts, the print stylesheet, nothing external.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderModel } from "../../assets/design/family/art/math-models.mjs";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";
import { accentFor, pdfPageCss, SHEET_CSS } from "./family-takehome-css.mjs";
import { SHEET_UI } from "./family-takehome-data.mjs";
import { qrSvg } from "./qr-code.mjs";

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// ---- icons: the design sprite's own paths, inlined without ids -------------------------------------------------
const SPRITE = readFileSync(join(REPO_ROOT, "assets/design/family/art/icons.svg"), "utf8");
export function icon(name) {
  const m = new RegExp(`<symbol id="fi-${name}" viewBox="0 0 24 24">([\\s\\S]*?)</symbol>`).exec(
    SPRITE,
  );
  if (!m) throw new Error(`family-takehome: no icon fi-${name} in the sprite`);
  return `<svg class="fi" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${m[1]}</svg>`;
}

// ---- fonts: Atkinson Hyperlegible 400/700, latin + latin-ext (Spanish accents), embedded as data URIs ----------
let fontCache;
export function fontFaceCss() {
  if (fontCache) return fontCache;
  const css = readFileSync(
    join(REPO_ROOT, "public/assets/fonts/atkinson-hyperlegible-fredoka-bba435.css"),
    "utf8",
  );
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
  const out = [];
  for (const body of faces) {
    if (!/font-family:\s*'Atkinson Hyperlegible'/.test(body) || !/font-style:\s*normal/.test(body))
      continue;
    const weight = /font-weight:\s*(\d+)/.exec(body)?.[1];
    if (weight !== "400" && weight !== "700") continue;
    const file = /url\(\/assets\/fonts\/([\w.-]+)\)/.exec(body)[1];
    const range = /unicode-range:\s*([^;]+);/.exec(body)[1];
    const b64 = readFileSync(join(REPO_ROOT, "public/assets/fonts", file)).toString("base64");
    out.push(
      `@font-face{font-family:"Atkinson Hyperlegible";font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${b64}) format("woff2");unicode-range:${range}}`,
    );
  }
  if (out.length !== 4)
    throw new Error(`family-takehome: expected 4 Atkinson faces, found ${out.length}`);
  fontCache = out.join("\n");
  return fontCache;
}

// ---- pieces ---------------------------------------------------------------------------------------------------
/** The model as drawn by the shared grammar. `forWeb` drops ids so the page keeps unique ids. */
export function modelSvg(data, { forWeb = false } = {}) {
  let svg = renderModel(data.model.raw, { lang: data.lang });
  svg = svg
    .replace(/ role="img" aria-labelledby="[^"]*"/, ' aria-hidden="true" focusable="false"')
    .replace(/<title[^>]*>[\s\S]*?<\/title><desc[^>]*>[\s\S]*?<\/desc>/, "");
  if (forWeb) svg = svg.replace(/ id="[^"]*"/g, "");
  return svg;
}

/** viewBox height (units, width 360) from which a model goes beside the hook instead of under it. */
const TALL_MODEL = 250;

const FACES = [
  `<circle class="face" cx="13" cy="13" r="11"/><path class="face" d="M8 18q5-4 10 0M9 10h.01M17 10h.01"/>`,
  `<circle class="face" cx="13" cy="13" r="11"/><path class="face" d="M8.5 17h9M9 10h.01M17 10h.01"/>`,
  `<circle class="face" cx="13" cy="13" r="11"/><path class="face" d="M8 16q5 5 10 0M9 10h.01M17 10h.01"/>`,
];
const faces = (ui) =>
  `<div class="fm-th-faces">${ui.feel
    .map(
      (t, i) =>
        `<span><svg viewBox="0 0 26 26" aria-hidden="true" focusable="false">${FACES[i]}</svg>${esc(t)}</span>`,
    )
    .join("")}</div>`;

const answerLine = (label) =>
  `<p class="fm-th-ans"><span>${esc(label)}</span><i aria-hidden="true"></i></p>`;

function itemHtml(item, ui) {
  const choices = item.choices.length
    ? `<ul class="fm-th-choices">${item.choices.map((c) => `<li><span class="b">${c.letter}.</span> ${esc(c.text)}</li>`).join("")}</ul>`
    : "";
  return `<li><p class="fm-th-stem">${esc(item.stem)}</p>${choices}${answerLine(item.kind === "frame" ? ui.thinking : ui.answer)}</li>`;
}

/** The sheet (<= 2 pages): header, hook, model, practice, talk + mission, stuck box, QR, self-check. */
export function renderSheet(data, opts = {}) {
  const html = sheetHtml(data, opts);
  // On the web page the sheet must add no headings: the page owns its one h1 and its heading outline.
  return opts.forWeb
    ? html.replace(/<h([12])>/g, '<p class="fm-th-h$1">').replace(/<\/h[12]>/g, "</p>")
    : html;
}

function sheetHtml(data, { forWeb = false, cls = "" } = {}) {
  const ui = SHEET_UI[data.lang];
  const mathItems = data.items.some((i) => i.kind === "choice");
  const model = data.model
    ? `<figure class="fm-th-fig"><div role="img" aria-label="${esc(data.model.alt)}">${modelSvg(data, { forWeb })}</div><figcaption>${esc(ui.modelHead)}: ${esc(data.model.name)}</figcaption></figure>`
    : "";
  const hook = `<section class="fm-th-box fm-th-hook"><h2>${esc(ui.hookHead)}</h2><p>${esc(data.hook.text)}</p><p class="fm-th-guess">${esc(data.hook.guess)}</p></section>`;
  // A tall model (bar plot, coordinate plane, grid) sits beside the hook: it must stay large (11pt labels) and still leave room for practice.
  const tall =
    data.model &&
    Number(/viewBox="0 0 \d+ ([\d.]+)"/.exec(modelSvg(data, { forWeb }))?.[1]) >= TALL_MODEL;
  const hookAndModel = tall ? `<div class="fm-th-top">${hook}${model}</div>` : `${hook}\n${model}`;
  return `<article class="fm-th ${cls}" lang="${data.lang}" style="--accent:${accentFor(data.unit)}" aria-label="${esc(data.title)}">
<header class="fm-th-head"><p class="fm-th-mark">${esc(ui.wordmark)}</p><p class="fm-th-where">${esc(data.label)}<span class="fm-th-std">${esc(data.standard)}</span></p></header>
<h1>${esc(data.title)}</h1>
<p class="fm-th-plain">${esc(data.standardPlain)}</p>
<p class="fm-th-name"><span class="fm-th-field">${esc(ui.name)}<i aria-hidden="true"></i></span><span class="fm-th-field short">${esc(ui.date)}<i aria-hidden="true"></i></span></p>
${hookAndModel}
<section class="fm-th-practice"><h2>${esc(ui.tryHead)}</h2><p class="fm-th-note">${esc(mathItems ? ui.tryNote : ui.frameNote)}</p>
<ol class="fm-th-items">${data.items.map((i) => itemHtml(i, ui)).join("")}</ol></section>
<div class="fm-th-pair">
<section class="fm-th-box"><h2>${icon("chat")}${esc(ui.talkHead)}</h2><p>${esc(data.talk)}</p></section>
<section class="fm-th-box"><h2>${icon("kitchen")}${esc(ui.missionHead)}</h2><p>${esc(data.mission)}</p></section>
</div>
<section class="fm-th-box fm-th-stuck"><h2>${icon("hint")}${esc(ui.stuckHead)}</h2><ul>${data.stuck.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></section>
<footer class="fm-th-foot">
<a class="fm-th-qr" href="${esc(data.url)}">${qrSvg(data.url, { px: 100, label: `${ui.qrHead}: ${data.link}` })}<p><span class="b">${esc(ui.qrHead)}</span><span class="d">${esc(ui.qrNote)}</span><span class="fm-th-link">${esc(data.link).replace(/\//g, "/<wbr>")}</span></p></a>
<span></span>
<div class="fm-th-feel"><span class="b">${esc(ui.feelHead)}</span>${faces(ui)}</div>
</footer>
</article>`;
}

/** The grown-up page: what is learned, answers, how to talk, what not to say. */
export function renderGuide(data, { cls = "" } = {}) {
  const ui = SHEET_UI[data.lang];
  const answers = data.items
    .map((i) =>
      i.kind === "choice"
        ? `<li><span class="b">${i.answerLetter}.</span> ${esc(i.choices.find((c) => c.letter === i.answerLetter).text)}. ${esc(i.explanation)}</li>`
        : `<li>${esc(i.explanation)}</li>`,
    )
    .join("");
  return `<article class="fm-gd ${cls}" lang="${data.lang}" style="--accent:${accentFor(data.unit)}" aria-label="${esc(ui.guideTitle)}">
<header class="fm-th-head"><p class="fm-th-mark">${esc(ui.wordmark)} · ${esc(ui.guideHead)}</p><p class="fm-th-where">${esc(data.label)}<span class="fm-th-std">${esc(data.standard)}</span></p></header>
<h1>${esc(ui.guideTitle)}</h1>
<p class="fm-th-plain">${esc(data.title)}</p>
<section class="fm-th-box"><h2>${esc(ui.learnHead)}</h2><p>${esc(data.learning)}</p></section>
<section><h2>${esc(ui.answersHead)}</h2><p class="fm-th-note">${esc(ui.answersNote)}</p><ol class="fm-gd-ans">${answers}</ol></section>
<div class="fm-th-pair">
<section class="fm-th-box"><h2>${icon("chat")}${esc(ui.talkHead)}</h2><p>${esc(data.talk)}</p></section>
<section class="fm-th-box"><h2>${icon("kitchen")}${esc(ui.missionHead)}</h2><p>${esc(data.mission)}</p></section>
</div>
<div class="fm-th-pair">
<section class="fm-th-box"><h2>${icon("hint")}${esc(ui.stuckGuide)}</h2><ul>${data.stuck.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></section>
<section class="fm-th-box"><h2>${esc(ui.avoidHead)}</h2><ul>${data.avoid.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></section>
</div>
</article>`;
}

/** A complete HTML document for one fragment, ready for headless print-to-PDF. */
export function standaloneDocument({ title, lang, body, footerLeft }) {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>${fontFaceCss()}\n${pdfPageCss({ footerLeft })}\n${SHEET_CSS}</style></head><body>${body}</body></html>`;
}
