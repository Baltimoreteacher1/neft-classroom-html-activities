/**
 * Shared helpers for the student-facing PDF downloads: the three practice
 * worksheets (generate-worksheet-pdf.mjs) and the homework sheet
 * (generate-homework-pdf.mjs).
 *
 * Both write to lessons/<id>/downloads/<id>-<name>.pdf, the folder the notes
 * and MSTAR PDFs already use, and record the hash of what they rendered from in
 * data/student-pdf-manifest.json so an unchanged source is not re-rendered.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LESSONS_DIR, REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";

export const CORE_LESSON_RE = /^\d+-\d+$/;
export const MANIFEST_PATH = join(REPO_ROOT, "data", "student-pdf-manifest.json");

export const pdfPath = (id, name) => join(LESSONS_DIR, id, "downloads", `${id}-${name}.pdf`);

export const sha256 = (...parts) => {
  const h = createHash("sha256");
  for (const p of parts) h.update(p).update("\0");
  return h.digest("hex");
};

export function readManifest() {
  if (!existsSync(MANIFEST_PATH)) return {};
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
}

export function writeManifest(manifest) {
  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
}

/**
 * Make sure the PDF declares its language and carries the tagged-PDF markers a
 * screen reader needs. Chrome writes `/Lang (en)`; LibreOffice may write none.
 * Edits the catalog in place (latin1 keeps byte offsets intact for the tokens
 * touched; every edit is an in-place token rewrite, never an insertion into a
 * stream).
 */
export function stampLanguage(file, lang = "en-US") {
  const original = readFileSync(file).toString("latin1");
  let text = original;
  if (/\/Lang\s*\(/.test(text)) {
    text = text.replace(/\/Lang\s*\((?:en)\)/, `/Lang(${lang})`);
  } else {
    text = text.replace(/(\/Type\s*\/Catalog)/, `$1 /Lang(${lang})`);
  }
  if (!/\/MarkInfo/.test(text))
    text = text.replace(/(\/Type\s*\/Catalog)/, "$1 /MarkInfo<</Marked true>>");
  if (text !== original) writeFileSync(file, Buffer.from(text, "latin1"));
}

/** The properties validate-student-pdfs checks, shared so the two cannot disagree. */
export const TAGGED_CHECKS = [
  { name: "structure tree", re: /\/StructTreeRoot/ },
  { name: "marked tagged", re: /\/Marked\s+true/ },
  { name: "language", re: /\/Lang\s*\(/ },
];
