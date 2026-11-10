// Shared helpers for the Axiom City graphic-novel layer: the book list, which lessons a book
// teaches, the vocabulary the layer embeds, and the layer's own pure functions (loaded from
// graphic-novels/_shared/gn-layer.js so the tools and the runtime share one implementation).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { hasRealVocabImage, resolveVocabImage } from "@eduwonderlab/engine/core/vocab-images.js";
import { buildVocabMatcher } from "@eduwonderlab/engine/core/vocab-match.js";
import { loadCurriculumManifest, loadLessonConfig, REPO_ROOT } from "./curriculum-source.mjs";

export const NOVEL_DIR = join(REPO_ROOT, "graphic-novels/axiom-city");
export const LAYER_FILE = join(REPO_ROOT, "graphic-novels/_shared/gn-layer.js");
export const EASY_DIR = join(NOVEL_DIR, "easy");
export const BEGIN = "<!-- gn-layer:begin";
export const END = "<!-- gn-layer:end -->";

/** The layer's pure API (normalizeKey, collectLeaves, buildMatcher, ...), run outside a browser. */
export function loadLayer() {
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(readFileSync(LAYER_FILE, "utf8"), sandbox, { filename: LAYER_FILE });
  return sandbox.module.exports;
}

/** All 39 books: 10 unit volumes plus the per-lesson episodes. */
export function listBooks() {
  const books = [];
  for (const f of readdirSync(NOVEL_DIR).sort())
    if (/^axiom-city-vol-.*\.html$/.test(f)) books.push([f, join(NOVEL_DIR, f)]);
  for (const f of readdirSync(join(NOVEL_DIR, "episodes")).sort())
    if (f.endsWith(".html")) books.push([f, join(NOVEL_DIR, "episodes", f)]);
  return books.map(([f, file]) => ({ slug: f.replace(/\.html$/, ""), file }));
}

const decode = (s) => s.replace(/&amp;/g, "&");

/**
 * Which lessons' vocabulary a book carries. Lesson ids named in VOLUME.unit that exist in the
 * manifest win; otherwise (unit volumes, and episodes that name no lesson) the whole unit.
 */
export function bookLessons(html) {
  const unit = decode((html.match(/\bunit:\s*"([^"]*)"/) || [])[1] || "");
  const manifest = loadCurriculumManifest();
  const known = new Set(manifest.lessons.map((l) => l.id));
  const named = /\bLessons?\b/.test(unit)
    ? [...unit.matchAll(/\b(\d{1,2}-\d{1,2})\b/g)].map((m) => m[1])
    : [];
  const ids = [...new Set(named)].filter((id) => known.has(id));
  if (ids.length) return { unit, source: "named", ids };
  const n = Number((unit.match(/\bUnit (\d+)/) || [])[1]);
  const all = manifest.lessons.filter((l) => l.unit === n).map((l) => l.id);
  return { unit, source: all.length ? "unit" : "none", ids: all };
}

const POPUP_FIELDS = [
  "term",
  "termEs",
  "definition",
  "definitionEs",
  "visual",
  "aliases",
  "caseSensitive",
  "expandsTo",
  "role",
];

/** Lesson vocabulary for the given ids, de-duplicated by term (first lesson wins), image resolved. */
export function vocabFor(ids) {
  const seen = new Set();
  const out = [];
  for (const id of ids) {
    for (const v of loadLessonConfig(id).vocabulary || []) {
      const key = String(v.term || "")
        .trim()
        .toLowerCase();
      if (!key || seen.has(key)) continue;
      if (!(v.definition || v.definitionEs || v.visual)) continue;
      seen.add(key);
      const entry = {};
      for (const f of POPUP_FIELDS) if (v[f] != null && v[f] !== "") entry[f] = v[f];
      entry.img = hasRealVocabImage(v.term, v.image) ? resolveVocabImage(v.term, v.image) : "";
      entry.lesson = id;
      out.push(entry);
    }
  }
  return out;
}

/** The engine's own matcher over the same list (the oracle the layer's port is tested against). */
export const engineMatcher = (vocab) => buildVocabMatcher(vocab);
