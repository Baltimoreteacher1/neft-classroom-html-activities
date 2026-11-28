// Math Literacy Studio exports: the one entry point. A Resource (docs/math-literacy/architecture.md) goes in; a file
// (or, for print, a print document) comes out. No format has content of its own.
//
//   exportResource(resource, "docx" | "pptx" | "html" | "print", { key, images, renderVisual })
//     -> { blob, text?, filename, mime }      blob is a Blob in a browser and a Uint8Array in node
//   exportKey(resource, format)               the teacher answer key as its own document ("<title>: Answer key")
//
// The key is never part of the student document. Pictures are rasterised to PNG for Word and PowerPoint (browser:
// raster.js; node: pass a pre-built `images` Map(blockRef -> { png, w, h })). Where no PNG exists the alt text is
// written as a visible caption instead; an export never fails because rasterising is unavailable.
import { docxBytes, DOCX_MIME } from "./docx.js";
import { interactiveHtml } from "./html.js";
import { printDocument, openPrintView } from "./print.js";
import { pptxBytes, PPTX_MIME } from "./pptx.js";
import { collectImages, getRenderVisual, canRasterise, kebab, keyResource, normalizeResource } from "./raster.js";

export const FORMATS = [
  { id: "print", label: "Print or save as PDF (browser print dialog)", ext: "html", opensDialog: true },
  { id: "docx", label: "Word document (.docx, editable)", ext: "docx" },
  { id: "pptx", label: "PowerPoint (.pptx, editable)", ext: "pptx" },
  { id: "html", label: "Interactive web page (.html, works offline)", ext: "html" },
];

const MIME = {
  docx: DOCX_MIME,
  pptx: PPTX_MIME,
  html: "text/html;charset=utf-8",
  print: "text/html;charset=utf-8",
};

const inBrowser = () => typeof document !== "undefined" && typeof Blob !== "undefined";

/** "<kebab title>[-key].<ext>"; the print document is saved as "...-print.html" so it is never mistaken for the page. */
export function exportFilename(resource, format, key = false) {
  const f = FORMATS.find((x) => x.id === format);
  if (!f) throw new Error(`unknown export format: ${format}`);
  const base = kebab(normalizeResource(resource).title) + (key ? "-key" : "");
  return `${base}${format === "print" ? "-print" : ""}.${f.ext}`;
}

function wrap(format, filename, payload) {
  const mime = MIME[format];
  if (typeof payload === "string") {
    const bytes = new TextEncoder().encode(payload);
    return { text: payload, blob: inBrowser() ? new Blob([bytes], { type: mime }) : bytes, filename, mime };
  }
  return { blob: inBrowser() ? new Blob([payload], { type: mime }) : payload, filename, mime };
}

async function build(resource, format, key, opts) {
  if (!FORMATS.some((f) => f.id === format)) throw new Error(`unknown export format: ${format}`);
  const renderVisual = opts.renderVisual || (await getRenderVisual());
  // the key is a Resource of its own, so it goes through exactly the same code as any other document
  const doc = key ? keyResource(resource) : normalizeResource(resource);
  if (format === "html") return wrap(format, exportFilename(resource, format, key), interactiveHtml(doc, { renderVisual }));
  if (format === "print") return wrap(format, exportFilename(resource, format, key), printDocument(doc, { renderVisual }));
  let images = opts.images;
  if (!images && canRasterise()) images = await collectImages(doc, { renderVisual });
  images ||= new Map();
  const bytes = format === "docx" ? docxBytes(doc, { images, renderVisual }) : pptxBytes(doc, { images, renderVisual });
  return wrap(format, exportFilename(resource, format, key), bytes);
}

/**
 * Export a Resource. `key: true` exports the teacher answer key instead (same as exportKey).
 * `images` (optional): Map(blockRef -> { png: Uint8Array, w, h }) for Word/PowerPoint pictures.
 * `renderVisual` (optional): override for ../visuals.js renderVisual(spec) -> { svg, alt, summary }.
 */
export async function exportResource(resource, format, { key = false, images, renderVisual } = {}) {
  return build(resource, format, key, { images, renderVisual });
}

/** The teacher answer key as a separate document, built from resource.key and resource.notes only. */
export async function exportKey(resource, format, opts = {}) {
  return build(resource, format, true, opts);
}

/** Browser only: save an export result as a download. */
export function downloadResult(result) {
  if (!inBrowser()) throw new Error("downloadResult needs a browser");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(result.blob);
  a.download = result.filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/** Browser only: open the print view (the browser's own print dialog; choose "Save as PDF" there). */
export function printResource(resource, { key = false } = {}) {
  return openPrintView(resource, { key });
}

export { collectImages, keyResource, printDocument, interactiveHtml, docxBytes, pptxBytes };
export { openPrintView } from "./print.js";
