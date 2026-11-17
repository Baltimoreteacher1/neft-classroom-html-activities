// Print / PDF view of a downloadable document (model.js). printDocumentHTML() is a pure string builder (tested in
// Node); openPrintView() writes it into a window the click handler opened, and the browser's print dialog saves the
// PDF ("Save as PDF" as the destination), the same way the rest of the site makes PDFs. The page carries its own
// print stylesheet inline (it is a separate document), Letter size, black on white, with the pictures the lab
// ships, the K-3 scenes drawn in code, and a QR code to the online activity (shared/qr, as on the family sheets).
// Interface text is in the learner's language; activity content keeps lang="en".
import { qrSvg } from "../../../shared/qr/qr-code.mjs";
import { sceneSVG } from "../early/scenes.js";
import { BASE, esc } from "../util.js";

const CSS = `
@page { size: letter; margin: 0.6in; }
* { box-sizing: border-box; }
body { margin: 0; background: #fff; color: #111; font: 13pt/1.45 Arial, Helvetica, sans-serif; }
.pv-sheet { max-width: 7.3in; margin: 0 auto; padding: 16px; }
.pv-bar { position: sticky; top: 0; background: #f3f6fa; border-bottom: 1px solid #c8d1dc; padding: 12px 16px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.pv-bar p { margin: 0; flex: 1 1 260px; font-size: 12pt; }
.pv-bar button { min-height: 44px; min-width: 44px; padding: 8px 18px; font: inherit; font-weight: 700; border: 2px solid #143361; border-radius: 8px; background: #143361; color: #fff; cursor: pointer; }
.pv-bar button.pv-ghost { background: #fff; color: #143361; }
.pv-bar button:focus-visible { outline: 3px solid #e07a5f; outline-offset: 2px; }
.pv-name { display: flex; gap: 24px; margin: 0 0 14px; }
.pv-name span { flex: 1; border-bottom: 1px solid #333; padding-bottom: 2px; }
h1 { font-size: 22pt; margin: 0 0 2px; color: #143361; }
.pv-meta { margin: 0 0 12px; font-size: 10.5pt; color: #333; }
h2 { font-size: 14pt; margin: 18px 0 6px; color: #143361; break-after: avoid; }
.pv-label { font-weight: 700; margin: 10px 0 4px; break-after: avoid; }
.pv-note { background: #eef3f8; border-left: 4px solid #143361; padding: 6px 10px; font-style: italic; }
.pv-script { border: 2px dashed #b0763a; padding: 8px 12px; margin: 10px 0; break-inside: avoid; }
.pv-passage { border-left: 3px solid #8a97a8; padding: 2px 12px; margin: 8px 0; }
.pv-strong { font-weight: 700; }
.pv-em { font-style: italic; }
figure { margin: 10px 0; break-inside: avoid; text-align: center; }
figure img, figure svg { max-width: 100%; max-height: 3.2in; height: auto; }
figcaption { font-size: 10pt; color: #333; }
ul.pv-list { margin: 4px 0 8px; padding-left: 22px; }
ul.pv-box { list-style: none; padding-left: 4px; }
ul.pv-box li { margin: 6px 0; }
ol.pv-choices { list-style: none; padding: 0; margin: 6px 0; }
ol.pv-choices li { display: flex; gap: 10px; align-items: center; margin: 8px 0; break-inside: avoid; }
.pv-bubble { font-size: 16pt; line-height: 1; }
.pv-choices img { width: 1.1in; height: auto; }
.pv-line { border-bottom: 1px solid #555; height: 30px; }
table { border-collapse: collapse; width: 100%; margin: 6px 0 10px; break-inside: avoid; }
caption { text-align: left; font-weight: 700; padding-bottom: 4px; }
td, th { border: 1px solid #8a97a8; padding: 5px 8px; text-align: left; vertical-align: top; }
.pv-help { border: 1px solid #1f766f; background: #f2f9f8; padding: 6px 12px; margin: 14px 0; break-inside: avoid; }
.pv-help > .pv-label:first-child { margin-top: 4px; }
.pv-foot { display: flex; gap: 16px; align-items: center; margin-top: 16px; break-inside: avoid; }
.pv-foot a { word-break: break-all; color: #0b5bd3; }
.pv-honest { font-size: 9.5pt; font-style: italic; color: #333; }
.pv-break { break-before: page; }
@media print { .pv-bar { display: none; } .pv-sheet { padding: 0; } a { color: #111; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

const langAttr = (b) => (b.lang ? ` lang="${esc(b.lang)}"` : "");

function block(b, origin) {
  switch (b.t) {
    case "h":
      return `<h2${langAttr(b)}>${esc(b.text)}</h2>`;
    case "label":
      return `<p class="pv-label"${langAttr(b)}>${esc(b.text)}</p>`;
    case "note":
      return `<p class="pv-note">${esc(b.text)}</p>`;
    case "p":
      return `<p class="${b.strong ? "pv-strong" : ""} ${b.em ? "pv-em" : ""}"${langAttr(b)}>${esc(b.text)}</p>`;
    case "script":
      return `<section class="pv-script"><p class="pv-label">${esc(b.label)}</p>${b.lines.map((l) => `<p${langAttr(b)}>${esc(l)}</p>`).join("")}</section>`;
    case "passage":
      return `<section class="pv-passage"${langAttr(b)}>${b.title ? `<p class="pv-label">${esc(b.title)}</p>` : ""}${b.paras.map((p) => `<p>${esc(p)}</p>`).join("")}</section>`;
    case "picture": {
      const art = b.scene
        ? sceneSVG(b.scene)
        : b.src
          ? `<img src="${esc(`${origin}${BASE}/${b.src}`)}" alt="${esc(b.alt)}">`
          : "";
      return art || b.alt
        ? `<figure>${art}${b.alt ? `<figcaption lang="en">${esc(b.alt)}</figcaption>` : ""}</figure>`
        : "";
    }
    case "table":
      return `<table${langAttr(b)}>${b.caption ? `<caption>${esc(b.caption)}</caption>` : ""}${b.headers ? `<thead><tr>${b.headers.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead>` : ""}<tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    case "choices":
      return `<ol class="pv-choices"${langAttr(b)}>${b.items
        .map((it) => {
          const pic = it.picture?.src
            ? `<img src="${esc(`${origin}${BASE}/${it.picture.src}`)}" alt="${esc(it.picture.alt || "")}">`
            : "";
          return `<li><span class="pv-bubble" aria-hidden="true">${esc(it.mark)}</span><strong>${esc(it.letter)}.</strong> ${pic}${it.visual ? `<span aria-hidden="true">${esc(it.visual)}</span> ` : ""}<span>${esc(it.text)}</span></li>`;
        })
        .join("")}</ol>`;
    case "list":
      return `<ul class="pv-list ${b.box ? "pv-box" : ""}"${langAttr(b)}>${b.items.map((it) => `<li>${b.box ? `${esc(b.box)}&nbsp; ` : ""}${esc(it)}</li>`).join("")}</ul>`;
    case "lines":
      return Array.from(
        { length: b.n },
        () => `<div class="pv-line" aria-hidden="true"></div>`,
      ).join("");
    case "help":
      return `<section class="pv-help"><p class="pv-label">${esc(b.title)}</p><p class="pv-em">${esc(b.note)}</p>${b.blocks.map((x) => block(x, origin)).join("")}</section>`;
    case "pagebreak":
      return `<div class="pv-break"></div>`;
    case "link":
    case "honest":
      return ""; // the footer draws these
    default:
      throw new Error(`print: unknown block "${b.t}"`);
  }
}

function qrFor(url, label) {
  try {
    return qrSvg(url, { px: 96, label });
  } catch {
    return ""; // a URL too long for the small QR: the printed link is still there
  }
}

/**
 * The print view as a complete HTML document. `ui` = { print, close, howTo } (screen-only toolbar text);
 * `origin` makes the lab's pictures load from a blank window.
 */
export function printDocumentHTML(doc, { origin = "", ui = {} } = {}) {
  const link = doc.blocks.find((b) => b.t === "link");
  const honest = doc.blocks.find((b) => b.t === "honest");
  const lang = doc.lang === "es" ? "es" : "en";
  const foot = link
    ? `<footer class="pv-foot">${qrFor(link.url, doc.labels.scan)}<div><p class="pv-label">${esc(link.label)}</p><p><a href="${esc(link.url)}">${esc(link.url)}</a></p></div></footer>`
    : "";
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(doc.title)}</title><style>${CSS}</style></head><body>
<div class="pv-bar" role="region" aria-label="${esc(ui.print || "Print")}"><p>${esc(ui.howTo || "")}</p><button type="button" data-pv-print>${esc(ui.print || "Print")}</button><button type="button" class="pv-ghost" data-pv-close>${esc(ui.close || "Close")}</button></div>
<main class="pv-sheet"><p class="pv-name"><span>${esc(doc.labels.name)}:</span><span>${esc(doc.labels.date)}:</span></p>
<h1 lang="en">${esc(doc.title)}</h1>${doc.meta ? `<p class="pv-meta">${esc(doc.meta)}</p>` : ""}
${doc.blocks.map((b) => block(b, origin)).join("\n")}
${foot}${honest ? `<p class="pv-honest">${esc(honest.text)}</p>` : ""}</main></body></html>`;
}

/** Write the print view into `win` (opened synchronously by the click), wire its buttons and open the dialog. */
export function openPrintView(win, doc, ui) {
  const markup = printDocumentHTML(doc, { origin: location.origin, ui });
  win.document.open();
  win.document.write(markup);
  win.document.close();
  win.document.querySelector("[data-pv-print]")?.addEventListener("click", () => win.print());
  win.document.querySelector("[data-pv-close]")?.addEventListener("click", () => win.close());
  win.focus();
  win.document.querySelector("[data-pv-print]")?.focus();
}
