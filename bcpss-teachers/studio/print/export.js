// Export pipeline for a Resource Studio document: browser print, Word (.docx), plain text, and the checks every export passes.
// Every export carries the review status line; nothing here reads a class profile or any student data.
import { buildDocx, DOCX_MIME, loadRasterizer, REVIEW_LINE } from "./docx.js";
import { pageRule, renderDoc } from "./html.js";
import { allBlocks, docToText, pageCount, TEACHER_ONLY, visibleSections } from "./ir.js";

export { REVIEW_LINE };
/** Short form for the printed page footer, where room is tight. */
export const REVIEW_SHORT = "Teacher review recommended.";
export const AUDIENCES = [
  { v: "student", label: "Student copy" },
  { v: "teacher", label: "Teacher copy (answer key and notes)" },
];

/** A copy that is safe to render or export: independent of the editor's document, with the review line in the footer. */
export function prepareDoc(doc) {
  const out = structuredClone(doc);
  const src = out.meta.sourceLine || "";
  if (!/review recommended/i.test(src)) out.meta.sourceLine = `${REVIEW_SHORT} ${src}`.trim();
  return out;
}

/** A file name that can never carry a person's name: only the resource title, grade band and copy. */
export function fileStem(doc, audience) {
  const slug =
    String(doc.title || "resource")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "resource";
  return `${slug}-${doc.meta?.band || "k-8"}-${audience === "teacher" ? "teacher" : "student"}`;
}

/** Picture specs anywhere in the document: visual blocks, card and table-cell pictures. */
function specsOf(doc, audience) {
  const out = [];
  const kinds = audience === "teacher" ? null : ["cover", "student"];
  for (const { block: b } of allBlocks(doc, kinds)) {
    if (b.type === "visual") out.push(b.spec);
    if (b.type === "cards") for (const c of b.items) if (c.visual) out.push(c.visual);
    if (b.type === "table")
      for (const r of [...(b.head ? [b.head] : []), ...b.rows])
        for (const c of r) if (c.visual) out.push(c.visual);
  }
  return out;
}

/** Checks an export must pass. Returns { ok, problems:[string] } and never throws. */
export function auditDoc(doc, audience = "student") {
  const problems = [];
  const visible = visibleSections(doc, audience);
  if (!visible.some((s) => s.pages.length))
    problems.push("The resource has no pages for this copy.");
  if (audience === "student" && visible.some((s) => TEACHER_ONLY.has(s.kind)))
    problems.push("A student copy may not contain the answer key or teacher notes.");
  if (doc.meta?.review !== "authored")
    problems.push("The review status is missing from the resource.");
  const unnamed = specsOf(doc, audience).filter((s) => !s?.alt || !String(s.alt).trim()).length;
  if (unnamed) problems.push(`${unnamed} picture${unnamed === 1 ? " has" : "s have"} no alt text.`);
  return { ok: problems.length === 0, problems };
}

export function textCopy(doc, audience = "student") {
  return `${docToText(doc, audience).trimEnd()}\n\n${REVIEW_LINE}\n`;
}

/** core/visuals.js renderVisual, or null when that module is not available. */
export async function loadRenderVisual() {
  try {
    const v = await import("../core/visuals.js");
    return typeof v.renderVisual === "function" ? v.renderVisual : null;
  } catch {
    return null;
  }
}

/**
 * Print through the browser's own dialog. The sheets are put in #st-print-root, print.css hides everything else
 * (body.st-printing), and @page is set to the document's size. Resolves after the dialog closes.
 */
export async function printDoc(doc, { audience = "student", renderVisual, win = window } = {}) {
  const check = auditDoc(doc, audience);
  if (!check.ok) throw new Error(check.problems[0]);
  const d = win.document;
  const rv = renderVisual === undefined ? await loadRenderVisual() : renderVisual;
  const prepared = prepareDoc(doc);
  const { html } = renderDoc(prepared, { audience, edit: false, renderVisual: rv });
  d.getElementById("st-print-root")?.remove();
  d.getElementById("st-print-page")?.remove();
  const root = d.createElement("div");
  root.id = "st-print-root";
  root.style.display = "none";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = html;
  const rule = d.createElement("style");
  rule.id = "st-print-page";
  rule.textContent = pageRule(prepared.format);
  d.head.append(rule);
  d.body.append(root);
  d.body.classList.add("st-printing");
  try {
    await d.fonts?.ready;
  } catch {
    /* fonts API unavailable */
  }
  return new Promise((resolve) => {
    const done = () => {
      win.removeEventListener("afterprint", done);
      d.body.classList.remove("st-printing");
      root.remove();
      rule.remove();
      resolve();
    };
    win.addEventListener("afterprint", done);
    try {
      win.print();
    } catch {
      done();
    }
  });
}

/** Build the Word file. Returns { blob, name }. */
export async function buildWord(doc, { audience = "student", rasterize } = {}) {
  const check = auditDoc(doc, audience);
  if (!check.ok) throw new Error(check.problems[0]);
  const prepared = prepareDoc(doc);
  const bytes = await buildDocx(prepared, {
    audience,
    rasterize: rasterize === undefined ? await loadRasterizer() : rasterize,
  });
  return {
    blob: new Blob([bytes], { type: DOCX_MIME }),
    bytes,
    name: `${fileStem(doc, audience)}.docx`,
  };
}

export function saveBlob(blob, name, win = window) {
  const d = win.document;
  const url = win.URL.createObjectURL(blob);
  const a = d.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  d.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => win.URL.revokeObjectURL(url), 4000);
}

export async function downloadWord(doc, opts = {}) {
  const { blob, name } = await buildWord(doc, opts);
  saveBlob(blob, name, opts.win || window);
  return name;
}

export { pageCount };
