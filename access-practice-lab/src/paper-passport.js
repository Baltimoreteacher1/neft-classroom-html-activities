// "Paper passport" menu: the printable booklet, sticker sheet and family guide.
// The PDFs are committed in access-practice-lab/paper-passport/ and built by tools/paper-passport/build.py.
import { BASE, html, icon } from "./util.js";

const DIR = `${BASE}/paper-passport`;

export const PAPER_PASSPORT_FILES = [
  {
    file: "language-passport-booklet-print.pdf",
    name: ["Passport booklet", "Librito del pasaporte"],
    note: [
      "Print two-sided, flip on the short edge, then fold in half.",
      "Imprime por ambos lados, voltea por el borde corto y dobla por la mitad.",
    ],
  },
  {
    file: "language-passport-booklet-pages.pdf",
    name: ["Booklet, one page at a time", "Librito, una página a la vez"],
    note: ["To read on a screen or print single pages.", "Para leer en pantalla o imprimir páginas sueltas."],
  },
  {
    file: "language-passport-stickers.pdf",
    name: ["Sticker sheet", "Hoja de calcomanías"],
    note: ["Print on sticker paper, then cut along the dashed lines.", "Imprime en papel adhesivo y corta por las líneas punteadas."],
  },
  {
    file: "language-passport-teacher-key.pdf",
    name: ["Teacher key: countries and levels", "Llave del docente: países y niveles"],
    note: ["Which country is which skill and level.", "Qué país es cada destreza y nivel."],
  },
  {
    file: "language-passport-family-guide.pdf",
    name: ["Family guide (English and Spanish)", "Guía para la familia (inglés y español)"],
    note: ["One sheet, printed front and back.", "Una hoja, impresa por ambos lados."],
  },
];

/** @param {ReturnType<import("./i18n.js").makeI18n>} I */
export function paperPassportMenu(I) {
  return html`<details class="paper-pass no-print">
    <summary class="btn">${icon("passport")} ${I.T("Paper passport", "Pasaporte de papel")}</summary>
    <div class="paper-pass-menu">
      <p class="fine">${I.T("Print a passport your teacher can stamp. Open a file to view it, or download it.", "Imprime un pasaporte que tu docente pueda sellar. Abre un archivo para verlo o descárgalo.")}</p>
      <ul>
        ${PAPER_PASSPORT_FILES.map(
          (f) => html`<li>
            <span><strong>${I.T(...f.name)}</strong><span class="fine">${I.T(...f.note)}</span></span>
            <span class="row-actions">
              <a class="btn small" href="${DIR}/${f.file}" target="_blank" rel="noopener">${icon("list")} ${I.T("Open", "Abrir")}</a>
              <a class="btn small" href="${DIR}/${f.file}" download>${icon("download")} ${I.T("Download", "Descargar")}</a>
            </span>
          </li>`,
        )}
      </ul>
    </div>
  </details>`;
}
