// Pure vocabulary view model: student-safe copies, wall ordering, print markup. No DOM access (Node-testable).
import { esc } from "../../core/dom.js";

/** Fields a teacher sees and a student never does. */
const TEACHER_ENTRY_FIELDS = ["misconception", "teacherNote", "teacherNotes"];
const TEACHER_COLLECTION_FIELDS = ["review", "teacherNotes", "teacherNote"];

/** Spanish shown to students must have been checked; teachers also see unverified Spanish with a badge. */
export const spanishFor = (entry, { student = false } = {}) => {
  const es = entry?.es;
  if (!es || !es.word) return null;
  return student && es.verified !== true ? null : es;
};

/** Copy of a collection that is safe to put in front of students. The original is never mutated. */
export function studentSafe(collection) {
  const c = structuredClone(collection);
  for (const f of TEACHER_COLLECTION_FIELDS) delete c[f];
  if (c.curriculum) delete c.curriculum.note;
  for (const e of c.entries || []) {
    for (const f of TEACHER_ENTRY_FIELDS) delete e[f];
    if (e.practice) delete e.practice.retrieval;
    if (e.explore) delete e.explore.teacherNote;
    if (e.es && e.es.verified !== true) delete e.es;
    if (e.homeLanguages) {
      for (const [lang, v] of Object.entries(e.homeLanguages)) if (v?.verified !== true) delete e.homeLanguages[lang];
    }
  }
  return c;
}

export const entryById = (c, id) => c.entries.find((e) => e.id === id) || null;

export const posList = (entries) => [...new Set(entries.map((e) => e.pos).filter(Boolean))];

/** Ordered, filtered entries for the wall. sort: order | az | pos */
export function wallEntries(collection, { pos = "", tier = "", sort = "order" } = {}) {
  let list = collection.entries.filter((e) => (!pos || e.pos === pos) && (!tier || String(e.tier) === String(tier)));
  if (sort === "az") list = [...list].sort((a, b) => a.word.localeCompare(b.word));
  else if (sort === "pos") list = [...list].sort((a, b) => (a.pos || "").localeCompare(b.pos || "") || a.word.localeCompare(b.word));
  return list;
}

/** Text a visual offers to people who cannot see it. */
export function altText(visual) {
  return { alt: visual?.alt || "", longDesc: visual?.longDesc || "" };
}

const chunk = (list, n) => {
  const out = [];
  for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n));
  return out;
};

function printFigure(entry, renderSvg) {
  if (!entry.visual) return `<div class="st-v-print-novis">${esc(entry.noVisualReason || "")}</div>`;
  return `<figure class="st-v-print-fig">${renderSvg(entry.visual)}</figure>`;
}

/** Cut-apart cards: 8 per US Letter page, dashed cut lines, picture description under each picture. */
export function printCardsMarkup(collection, { renderSvg, showAlt = true, bilingual = false, student = false }) {
  const pages = chunk(collection.entries, 8)
    .map((page) => {
      const cards = page
        .map((e) => {
          const es = bilingual ? spanishFor(e, { student }) : null;
          return `<article class="st-v-print-card">
  ${printFigure(e, renderSvg)}
  ${showAlt && e.visual ? `<p class="st-v-print-alt">Picture: ${esc(e.visual.alt)}</p>` : ""}
  <h2 class="st-v-print-word">${esc(e.word)}${e.pos ? ` <span class="st-v-print-pos">${esc(e.pos)}</span>` : ""}</h2>
  <p class="st-v-print-def">${esc(e.def)}</p>
  ${es ? `<p class="st-v-print-es"><strong>${esc(es.word)}</strong>${es.def ? `: ${esc(es.def)}` : ""}</p>` : ""}
  <p class="st-v-print-ctx">${esc(e.context)}</p>
</article>`;
        })
        .join("");
      return `<section class="st-v-print-page st-v-print-cardpage">${cards}</section>`;
    })
    .join("");
  return `<div class="st-v-print st-v-print-cards" data-layout="cards"><p class="st-v-print-title">${esc(collection.title)}: word cards. Cut along the dashed lines.</p>${pages}</div>`;
}

/** Wall poster: title bar, picture-and-word grid, one definition each. */
export function printPosterMarkup(collection, { renderSvg, showAlt = true, bilingual = false, student = false }) {
  const tiles = collection.entries
    .map((e) => {
      const es = bilingual ? spanishFor(e, { student }) : null;
      return `<article class="st-v-print-tile">
  ${printFigure(e, renderSvg)}
  <h2 class="st-v-print-word">${esc(e.word)}</h2>
  ${es ? `<p class="st-v-print-es">${esc(es.word)}</p>` : ""}
  <p class="st-v-print-def">${esc(e.def)}</p>
  ${showAlt && e.visual ? `<p class="st-v-print-alt">Picture: ${esc(e.visual.alt)}</p>` : ""}
</article>`;
    })
    .join("");
  const std = (collection.standards || []).join(", ");
  return `<div class="st-v-print st-v-print-poster" data-layout="poster">
<header class="st-v-print-head"><h1>${esc(collection.title)}</h1><p>${esc(std)}</p></header>
<section class="st-v-print-grid">${tiles}</section>
</div>`;
}
