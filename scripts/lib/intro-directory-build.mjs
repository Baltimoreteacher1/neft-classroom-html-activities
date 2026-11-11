// Builds the Site Directory PDF and Word file. The PDF is rendered twice: the first pass finds the page each band and
// domain starts on (by its unique heading text), the second fills those numbers into the contents page. Chromium
// writes PDF bookmarks from the headings (outline), and a footer carries "page N of M".
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildDirectory } from "../../access-practice-lab/src/intro/site-directory-model.js";
import { directoryBody, marker } from "./intro-directory-html.mjs";
import { otherPlaces } from "./intro-directory-places.mjs";
import { printDocument, renderPdfs } from "./intro-guide-pdf.mjs";

const INDEX = new URL("../../access-practice-lab/content/index.json", import.meta.url);
/** The first page after the cover and the contents page. */
const FIRST_BODY_PAGE = 3;

export function directoryModel(generated = new Date().toISOString().slice(0, 10)) {
  const model = buildDirectory(JSON.parse(readFileSync(INDEX, "utf8")), { generated });
  return { ...model, places: otherPlaces() };
}

/** marker text -> first page (1-based) at or after FIRST_BODY_PAGE that contains it. */
function findPages(pdf, model) {
  const text = execFileSync("pdftotext", ["-layout", pdf, "-"], { encoding: "utf8" }).split("\f");
  const squash = (s) => s.replace(/\s+/g, " ");
  const keys = [
    ...model.bands.flatMap((b) => [marker.band(b), ...b.domains.map((d) => marker.domain(b, d))]),
    marker.tests(),
    marker.places(),
  ];
  const pages = {};
  for (const k of keys) {
    const at = text.findIndex((t, i) => i + 1 >= FIRST_BODY_PAGE && squash(t).includes(k));
    if (at < 0) throw new Error(`site-directory: "${k}" was not found in the rendered PDF`);
    pages[k] = at + 1;
  }
  return pages;
}

const FOOTER = `<div style="width:100%;padding:0 0.6in;font:11pt Arial,sans-serif;color:#3a4566;display:flex;justify-content:space-between"><span>The Language Page Site Directory</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`;

export async function buildSiteDirectory(outDir) {
  const model = directoryModel();
  const out = join(outDir, "site-directory.pdf");
  const job = (pages) => ({
    out,
    doc: printDocument({ title: model.title, bodyHtml: directoryBody(model, pages) }),
    pdfOptions: {
      outline: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: FOOTER,
    },
  });
  await renderPdfs([job({})]);
  const pages = findPages(out, model);
  await renderPdfs([job(pages)]);
  const again = findPages(out, model);
  for (const [k, n] of Object.entries(pages))
    if (again[k] !== n)
      throw new Error(`site-directory: "${k}" moved from page ${n} to ${again[k]} after numbering`);
  const { buildDirectoryDocx } = await import("./intro-directory-docx.mjs");
  writeFileSync(join(outDir, "site-directory.docx"), await buildDirectoryDocx(model));
  return { model, pages };
}
