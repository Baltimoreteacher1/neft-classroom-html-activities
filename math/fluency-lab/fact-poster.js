// A class fact poster: the grade's facts as boxes the class colours in together once most of the class knows that
// fact without help. No names, no scores, no speed. Built from the same grade domain the fact charts use.
import { gradeFactDomain } from "./moby/fact-model.js";
import { ES_MOBY_FACTS } from "./moby/i18n-es-facts.js";
import { SYMBOL } from "./moby/fact-keys.js";
import { escapeHtml, localQrMarkup } from "./school-tools.js";
import { labUrl } from "./family-letter.js";

const COPY = {
  en: {
    title: "Our class fact wall",
    how: "Colour a box when most of us can answer that fact without help. We are done when we understand, not when we are fast.",
    scan: "Practise at home",
    group: "Fact groups our class knows",
    qr: "QR code: open the Math Fluency Lab",
  },
  es: {
    title: "Nuestro muro de operaciones",
    how: "Coloreen un cuadro cuando casi toda la clase pueda responder esa operación sin ayuda. Terminamos cuando entendemos, no cuando somos rápidos.",
    scan: "Practica en casa",
    group: "Grupos de operaciones que la clase sabe",
    qr: "Código QR: abrir el Laboratorio de Fluidez Matemática",
  },
};
const LIST_BOXES = 5;

// What a grid cell shows: the fact with no answer, as the learner meets it.
function cellText(band, row, col) {
  const key = band.cell(row, col);
  if (!key) return "";
  const [, x, y] = key.split(":").map(Number);
  if (band.op === "mul") return `${row} ${SYMBOL.mul} ${col}`;
  if (band.op === "div") return `${x} ${SYMBOL.div} ${y}`;
  return `${x} ${SYMBOL[band.op]} ${y}`;
}

function gridHtml(band) {
  const rows = band.rows.map((row) => {
    const cells = band.cols.map((col) => {
      const text = cellText(band, row, col);
      return text ? `<td>${escapeHtml(text)}</td>` : `<td class="is-empty"></td>`;
    });
    return `<tr>${cells.join("")}</tr>`;
  });
  return `<table class="fl-poster-grid"><tbody>${rows.join("")}</tbody></table>`;
}

const listHtml = (text) =>
  `<p class="fl-poster-group">${escapeHtml(text)}</p><div class="fl-poster-boxes">${'<span aria-hidden="true"></span>'.repeat(LIST_BOXES)}</div>`;

// The facts the grade is learning; Grade 5 only maintains facts, so its poster shows the multiplication and division charts.
export function posterBands(grade) {
  const { bands } = gradeFactDomain(grade);
  const own = bands.filter((band) => !band.maintain);
  return own.length ? own : bands.slice(0, 2);
}

export function posterHtml({ grade, lang = "en" } = {}) {
  const c = COPY[lang === "es" ? "es" : "en"];
  const href = labUrl(grade, lang);
  const qr = localQrMarkup(href, { label: c.qr, size: 110 });
  const sections = posterBands(grade).map((band) => {
    const label = lang === "es" ? ES_MOBY_FACTS[band.label] || band.label : band.label;
    const body = band.cols?.length > 1 ? gridHtml(band) : listHtml(`${label}: ${c.group}`);
    return `<section class="fl-poster-band"><h2>${escapeHtml(label)}</h2>${body}</section>`;
  });
  return `<article class="fl-poster" lang="${lang === "es" ? "es" : "en"}"><header><h1>${escapeHtml(c.title)}</h1><p>${escapeHtml(c.how)}</p></header>
    <div class="fl-poster-bands">${sections.join("")}</div>
    <footer>${qr ? `<div class="fluency-local-qr">${qr}</div>` : ""}<p><strong>${escapeHtml(c.scan)}</strong><br>${escapeHtml(href)}</p></footer></article>`;
}
