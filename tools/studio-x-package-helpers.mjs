// Shared fixtures and helpers for the Studio X package tests.
import assert from "node:assert/strict";
import JSZip from "jszip";
import { buildPackage, PackageError } from "../access-practice-lab/src/studio/x/package.js";
import { PLAYER_CSS, PLAYER_JS } from "./studio-player-helpers.mjs";

export const DATE = "2026-11-26";
export const SECRETS = {
  note: "TEACHER-NOTE-BLOCK-QQ",
  notesField: "TEACHER-NOTES-FIELD-QQ",
  misc: "MISCONCEPTION-LIST-QQ",
  source: "SOURCE-NOTE-QQ",
  number: "7392",
  blank: "ParisXYZ",
  sample: "SAMPLE-RESPONSE-QQ",
  rubric: "RUBRIC-LOOKFOR-QQ",
  why: "EXPLAIN-WHY-QQ",
  qmisc: "QUESTION-MISTAKE-QQ",
};

export const activity = (title, extra = {}) => ({
  schema: "lp-activity/1",
  id: `act-${title.toLowerCase().replace(/\W+/g, "-")}`,
  title,
  kind: "worksheet",
  context: {
    grade: "6",
    subject: "Math",
    objective: `Objective for ${title}`,
    source: { origin: "teacher", note: SECRETS.source },
  },
  supports: { spanish: true },
  notes: { teacher: SECRETS.notesField, misconceptions: [SECRETS.misc] },
  blocks: [
    { id: "t1", type: "text", role: "directions", text: "Answer each question." },
    {
      id: "v1",
      type: "vocab",
      items: [{ term: "product", def: "the result of multiplying", es: "producto" }],
    },
    {
      id: "q1",
      type: "question",
      format: "number",
      prompt: "Compute 6 × 1232.",
      answer: SECRETS.number,
      explanation: SECRETS.why,
      misconception: SECRETS.qmisc,
    },
    {
      id: "q2",
      type: "question",
      format: "blank",
      prompt: "Fill in the blank.",
      text: `The capital of France is [[${SECRETS.blank}]].`,
    },
    {
      id: "q3",
      type: "question",
      format: "short",
      prompt: "Explain your thinking.",
      sample: SECRETS.sample,
      rubric: [SECRETS.rubric],
    },
    {
      id: "q4",
      type: "question",
      format: "choice",
      prompt: "Which is greater?",
      options: [
        { id: "a", text: "Seven" },
        { id: "b", text: "Three" },
      ],
      answer: "a",
    },
    { id: "n1", type: "note", text: SECRETS.note },
  ],
  ...extra,
});
export const A = activity("Fractions Practice");
export const B = activity("Ratio Check");

export const docx = async (text = "hello") => {
  // A fixed date: JSZip stamps undated entries with the wall clock (2 s resolution), which made two builds of the
  // same input differ whenever they straddled a boundary.
  const date = new Date(2026, 0, 1);
  const z = new JSZip();
  z.file("[Content_Types].xml", "<Types/>", { date });
  z.file("word/document.xml", `<w:document><w:t>${text}</w:t></w:document>`, { date });
  return z.generateAsync({ type: "uint8array" });
};
export const deps = async (extra = {}) => ({
  generatedAt: DATE,
  js: PLAYER_JS,
  css: PLAYER_CSS,
  docx: { worksheet: await docx("student"), key: await docx("key") },
  ...extra,
});
export const selection = (extra = {}) => ({
  title: "Fractions Unit Pack",
  lang: "bi",
  objectives: ["Use fractions to solve problems."],
  terms: ["denominator", { term: "numerator", es: "numerador" }],
  parts: [
    { id: "interactive", role: "interactive", activity: A, formats: ["html", "print"] },
    { id: "worksheet", role: "worksheet", activity: B, formats: ["print", "docx"] },
    { id: "key", role: "key", activity: B, formats: ["print", "docx"] },
    { id: "notes", role: "notes", activity: A, format: "print" },
  ],
  combined: { student: true, keys: true },
  ...extra,
});
export const build = async (sel = selection(), d) => buildPackage(sel, d ?? (await deps()));
export const open = async (bytes) => JSZip.loadAsync(bytes);
export const text = async (zip, path) => zip.file(path).async("string");
export const failsWith = async (fn, code) =>
  assert.rejects(
    fn,
    (e) => e instanceof PackageError && e.code === code && e.message.length > 10,
    code,
  );

/** Rewrite one file in a built package, keep the manifest's byte sizes honest, return new zip bytes. */
export async function tamper(bytes, path, edit, { manifest = true } = {}) {
  const zip = await open(bytes);
  const next = edit(zip.file(path) ? await text(zip, path) : "");
  if (next === null) zip.remove(path);
  else zip.file(path, next);
  if (manifest) {
    const m = JSON.parse(await text(zip, "package.json"));
    const entry = m.files.find((f) => f.path === path);
    if (next === null) m.files = m.files.filter((f) => f.path !== path);
    else if (entry) entry.bytes = new TextEncoder().encode(next).length;
    zip.file("package.json", JSON.stringify(m, null, 2));
  }
  return zip.generateAsync({ type: "uint8array" });
}
