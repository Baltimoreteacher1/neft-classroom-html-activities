// Printable worksheet renderer: one activity -> a complete standalone Letter-size HTML document.
//
//   renderWorksheetHtml(activity, { part, lang, baseUrl })        -> string
//   renderWorksheetParts(activity, { part, lang, baseUrl })       -> { html, transformations }
//
// part: "student" (no answers anywhere), "key" or "teacher" (answer key and notes only), "all" (student pages,
// then a page break and the TEACHER COPY). lang: "en" | "es" | "bi". Practice text always stays as the teacher
// wrote it; only directions and labels are translated.

import { normalizeActivity } from "../core/schema.js";
import { ANIMATION_CSS, DIAGRAM_CSS, renderBlock } from "./blocks.js";
import { printCss } from "./css.js";
import { chrome, renderQuestionBody } from "./formats.js";
import { esc, mathHtml, safeBase } from "./html.js";
import { renderKeyNotes, renderKeyQuestion } from "./key.js";
import { normLang, normPart, tr } from "./strings.js";
import { collectTransformations } from "./transformations.js";

function context(activity, lang) {
  return {
    activity,
    lang,
    workspace: activity.options.workspace,
    frames: activity.supports.frames,
    spanish: activity.supports.spanish,
    visuals: activity.supports.visuals,
  };
}

function metaLine(a, lang) {
  const c = a.context;
  const word = (key) => tr(lang === "es" ? "es" : "en", key);
  return [
    c.grade ? `${word("grade")} ${c.grade}` : "",
    c.subject,
    c.unitTitle ? (c.unitNumber ? `${word("unit")} ${c.unitNumber}: ${c.unitTitle}` : c.unitTitle) : "",
    c.day,
  ]
    .filter(Boolean)
    .map(esc)
    .join(" · ");
}

function questionHtml(c, q, n) {
  const img = q.image?.src && q.format !== "hotspot"
    ? `<img class="qimg" src="${esc(q.image.src)}" alt="${q.image.decorative ? "" : esc(q.image.alt)}">`
    : "";
  const frame =
    c.frames && q.frame
      ? `<p class="frame"><span class="tag">${chrome(c.lang, "sentenceStarter")}:</span> ${mathHtml(q.frame)}</p>`
      : "";
  const prompt = q.prompt ? mathHtml(q.prompt) : "";
  return `<div class="problem" role="group" aria-labelledby="q${n}"><p class="prompt" id="q${n}"><span class="qno">${n}.</span><span>${prompt}</span></p>${img}${frame}${renderQuestionBody(c, q)}</div>`;
}

function studentSection(c, a) {
  const head = `<header class="ws-head"><h1 id="ws-title">${esc(a.title)}</h1>${
    metaLine(a, c.lang) ? `<p class="meta">${metaLine(a, c.lang)}</p>` : ""
  }<div class="namebar"><span><span class="lab">${chrome(c.lang, "name")}:</span><i class="line"></i></span><span><span class="lab">${chrome(c.lang, "date")}:</span><i class="line"></i></span></div></header>`;
  const goal = a.context.objective
    ? `<div class="goal"><h2>${chrome(c.lang, "goal")}</h2><p>${mathHtml(a.context.objective)}</p></div>`
    : "";
  let n = 0;
  const body = a.blocks
    .map((b) =>
      b.type === "question" ? questionHtml(c, b, ++n) : b.type === "note" ? "" : renderBlock(c, b),
    )
    .join("");
  const empty = n === 0 && !body ? `<p>${chrome(c.lang, "noQuestions")}</p>` : "";
  return `<section class="sheet student" aria-labelledby="ws-title" lang="en">${head}${goal}${body}${empty}</section>`;
}

function keySection(c, a) {
  const notes = a.blocks.filter((b) => b.type === "note");
  const audio = a.blocks.filter((b) => b.type === "audio");
  let n = 0;
  const items = a.blocks
    .filter((b) => b.type === "question")
    .map((q) => renderKeyQuestion(c, q, ++n));
  return `<section class="sheet key" aria-labelledby="key-title" lang="en"><div class="banner"><span id="key-title">${chrome(c.lang, "teacherCopy")} — ${chrome(c.lang, "answerKey")}</span><span>${esc(a.title)} · ${chrome(c.lang, "notForStudents")}</span></div>${renderKeyNotes(c, a, notes, audio)}${items.join("")}</section>`;
}

/** @returns {{ html: string, transformations: Array<{blockId: string, note: {en: string, es: string}}> }} */
export function renderWorksheetParts(input, opts = {}) {
  const a = normalizeActivity(input);
  const part = normPart(opts.part);
  const lang = normLang(opts.lang);
  const c = context(a, lang);
  const wantStudent = part === "student" || part === "all";
  const wantKey = part !== "student";
  const sections = [wantStudent ? studentSection(c, a) : "", wantKey ? keySection(c, a) : ""].join(
    "",
  );
  const css = printCss({
    title: a.title,
    accent: a.look.accent,
    keyLabel: tr("en", "teacherCopy"),
    pageWord: tr(lang === "es" ? "es" : "en", "page"),
    ofWord: tr(lang === "es" ? "es" : "en", "of"),
    withKey: wantKey,
  });
  const base = safeBase(opts.baseUrl);
  const docLang = lang === "es" ? "es" : "en";
  const title = `${a.title}${wantKey && !wantStudent ? " (Teacher copy)" : ""}`;
  const html = `<!doctype html>
<html lang="${docLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
${base ? `<base href="${esc(base)}">\n` : ""}<title>${esc(title)}</title>
<style>${css}${DIAGRAM_CSS}${ANIMATION_CSS}</style>
</head>
<body class="part-${part}">
<main>${sections}</main>
</body>
</html>
`;
  return { html, transformations: collectTransformations(a) };
}

export const renderWorksheetHtml = (activity, opts = {}) =>
  renderWorksheetParts(activity, opts).html;
