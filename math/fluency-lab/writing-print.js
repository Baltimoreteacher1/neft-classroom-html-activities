// Print pages for the Math Writing Studio: a blank organizer on ruled lines (for writing by hand), and a learner's
// finished paragraph. Colour is never the only cue: every part carries its label and a job word.
import { JOBS } from "./writing-organizers.js";
import { joinParagraph } from "./writing-store.js";

export const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const pick = (pair, lang) => (lang === "es" ? pair.es : pair.en);
const LINES = { say: 2, show: 3, why: 3, check: 2, end: 2 };

const head = (organizer, lang, title) => `<header class="wr-print-head"><h1>${esc(title)}</h1>
  <p>${esc(pick(organizer.name, lang))}</p>
  <p class="wr-print-meta">${lang === "es" ? "Nombre" : "Name"} ______________________ ${lang === "es" ? "Fecha" : "Date"} ____________</p></header>`;

export function blankOrganizerHtml(organizer, { lang = "en", problem = "", task = "" } = {}) {
  const parts = organizer.boxes
    .map((box) => {
      const lines = Array.from(
        { length: LINES[box.job] || 2 },
        () => '<span class="wr-print-line"></span>',
      ).join("");
      return `<section class="wr-print-box" data-job="${box.job}"><h2>${esc(pick(box.label, lang))} <small>${esc(pick(JOBS[box.job], lang))}</small></h2>
        <p>${esc(pick(box.task, lang))}</p>${lines}</section>`;
    })
    .join("");
  const title = lang === "es" ? "Estudio de escritura matemática" : "Math Writing Studio";
  return `<article class="wr-print">${head(organizer, lang, title)}
    ${problem ? `<p class="wr-print-problem"><strong>${lang === "es" ? "Problema" : "Problem"}:</strong> ${esc(problem)}</p>` : ""}
    ${task ? `<p class="wr-print-task">${esc(task)}</p>` : ""}${parts}</article>`;
}

export function pieceHtml(piece, organizer) {
  const lang = piece.lang;
  const rows =
    piece.boxes.all !== undefined
      ? `<p class="wr-print-para">${esc(piece.boxes.all)}</p>`
      : organizer.boxes
          .filter((box) => piece.boxes[box.id])
          .map(
            (box) =>
              `<section class="wr-print-box" data-job="${box.job}"><h2>${esc(pick(box.label, lang))}</h2><p class="wr-print-para">${esc(piece.boxes[box.id])}</p></section>`,
          )
          .join("");
  const whole = joinParagraph(organizer, piece.boxes);
  const title = lang === "es" ? "Mi escritura matemática" : "My math writing";
  return `<article class="wr-print">${head(organizer, lang, title)}
    ${piece.problem ? `<p class="wr-print-problem"><strong>${lang === "es" ? "Problema" : "Problem"}:</strong> ${esc(piece.problem)}</p>` : ""}
    ${rows}<section class="wr-print-final"><h2>${lang === "es" ? "Mi párrafo" : "My paragraph"}</h2><p class="wr-print-para">${esc(whole)}</p></section></article>`;
}
