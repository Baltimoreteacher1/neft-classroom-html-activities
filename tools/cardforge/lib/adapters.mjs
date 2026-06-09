// CardForge input adapters.
// Implemented (real parsing): text, markdown, html, json.
// Scaffolded (honest "not yet supported"): pptx, pdf, docx, gslides.
// Every adapter returns a partial lesson-analysis object (see
// schemas/lesson-analysis.schema.json). analyze.mjs enriches it further.
import { readFileSync, existsSync } from "node:fs";
import { extname, basename } from "node:path";
import { CCSS_RE } from "./util.mjs";

const EXT_MAP = {
  ".txt": "text", ".text": "text",
  ".md": "markdown", ".markdown": "markdown",
  ".html": "html", ".htm": "html",
  ".json": "json",
  ".pptx": "pptx", ".ppt": "pptx",
  ".pdf": "pdf",
  ".docx": "docx", ".doc": "docx",
};

export const IMPLEMENTED = ["text", "markdown", "html", "json"];
export const SCAFFOLDED = ["pptx", "pdf", "docx", "gslides"];

export function detectType(file) {
  return EXT_MAP[extname(file).toLowerCase()] || "text";
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function firstHeading(text, fallback) {
  const md = text.match(/^#{1,3}\s+(.+)$/m);
  if (md) return md[1].trim();
  const line = text.split(/\n/).map((l) => l.trim()).find(Boolean);
  return (line && line.slice(0, 120)) || fallback;
}

// A scaffolded adapter: honest, non-faking. Returns supported:false with a
// clear message so the engine never pretends to parse a binary it cannot.
function scaffolded(type, file) {
  return {
    sourceType: type,
    sourceFile: file,
    supported: false,
    message:
      `Input type "${type}" is scaffolded but not yet parsed by CardForge v1. ` +
      `Convert to text/markdown/html (e.g. export the deck's text, or paste the ` +
      `lesson outline into a .md file) and re-run, or author the package directly ` +
      `via a job.json. No content was invented.`,
    title: basename(file).replace(/\.[^.]+$/, ""),
    rawText: "",
    confidence: 0,
    missing: ["parsed-content"],
    uncertain: ["everything"],
  };
}

export function runAdapter(file, explicitType) {
  const type = explicitType || detectType(file);
  if (SCAFFOLDED.includes(type)) return scaffolded(type, file);

  if (!existsSync(file)) {
    return { sourceType: type, sourceFile: file, supported: false, message: `File not found: ${file}`, title: "", rawText: "", confidence: 0 };
  }
  const raw = readFileSync(file, "utf8");
  let text = raw;
  let title;

  if (type === "json") {
    try {
      const obj = JSON.parse(raw);
      title = obj.title || obj.lessonId || basename(file);
      text = [obj.title, obj.contentObjective, obj.objective, obj.topic,
        JSON.stringify(obj.vocabulary || ""), JSON.stringify(obj.practice || "")]
        .filter(Boolean).join("\n");
      const std = obj.standard || (raw.match(CCSS_RE) || [])[0] || null;
      return { sourceType: "json", sourceFile: file, supported: true, message: null,
        title, rawText: text, standard: std, unit: obj.unit ?? null, lesson: obj.lesson ?? null,
        objective: obj.contentObjective || obj.objective || null,
        languageObjective: obj.languageObjective || null, confidence: 0.8, missing: [], uncertain: [] };
    } catch {
      return { sourceType: "json", sourceFile: file, supported: false, message: "Invalid JSON.", title: basename(file), rawText: "", confidence: 0 };
    }
  }

  if (type === "html") text = stripHtml(raw);
  title = firstHeading(text, basename(file).replace(/\.[^.]+$/, ""));

  return {
    sourceType: type, sourceFile: file, supported: true, message: null,
    title, rawText: text, confidence: type === "markdown" ? 0.7 : 0.6,
    missing: [], uncertain: [],
  };
}
