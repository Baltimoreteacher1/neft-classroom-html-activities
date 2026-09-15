#!/usr/bin/env node
/**
 * import-session2-practice.mjs — read the district's Reveal "Session 2" material
 * into `data/part-two-session2-source.json`.
 *
 * WHY A COMMITTED SNAPSHOT. The source lives in `~/Desktop/Reveal Math by Unit
 * and Lesson/`, outside this repo and absent from Cloudflare's clean build. A
 * generator that read it directly would produce different output on this laptop
 * than in CI, which is the class of bug that cannot be reproduced. So this is a
 * LOCAL RE-SEED tool in the shape of `tools/import-pacing-baseline.mjs`: run it
 * by hand when the district material changes, commit the JSON, and let every
 * build read the JSON.
 *
 * IT EXTRACTS, IT DOES NOT DERIVE. Every field here is text the docx states.
 * Answers are NOT computed: 160 of the 216 problem stems across the 54 lessons
 * are bespoke (dot-plot shape, box-plot comparison, MAD, target mean, unit
 * price…), and a pattern-matcher that "recognises" one it does not understand
 * puts a wrong answer key in front of a student. Deriving answers is done in
 * `data/part-two-session2-practice.json`, per lesson, verified, by a human.
 *
 *   node tools/import-session2-practice.mjs           # write
 *   node tools/import-session2-practice.mjs --check    # fail if stale
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = join(ROOT, "data/part-two-session2-source.json");
const REVEAL = join(homedir(), "Desktop", "Reveal Math by Unit and Lesson");
const CHECK = process.argv.includes("--check");

/* ── A minimal .docx reader ────────────────────────────────────────────────
   A .docx is a zip and the repo has no zip READER (the `docx` dependency only
   writes). Reading the central directory is ~30 lines and adds no dependency to
   a build that ships to students. */
function readZipEntry(buf, wanted) {
  // End of central directory: scan back for its signature.
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("not a zip file");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("bad central directory");
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    if (name === wanted) {
      const lhNameLen = buf.readUInt16LE(offset + 26);
      const lhExtraLen = buf.readUInt16LE(offset + 28);
      const start = offset + 30 + lhNameLen + lhExtraLen;
      const raw = buf.subarray(start, start + compSize);
      return method === 0 ? raw : inflateRawSync(raw);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`entry not found: ${wanted}`);
}

const TEXT_RUN = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
const TAGS = /<[^>]+>/g;

function cellText(xml) {
  let out = "";
  for (const m of xml.matchAll(TEXT_RUN)) out += m[1];
  return out
    .replace(TAGS, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/\s+/g, " ")
    .trim();
}

/** Table rows as cell arrays, plus bare paragraphs as one-cell rows, in order.
 *  The Practice doc is all tables; the HW doc puts its numbered items in bare
 *  paragraphs. Reading one shape only returns an empty item list, which is
 *  indistinguishable from a lesson that ships no homework. */
function blocks(path) {
  const xml = readZipEntry(readFileSync(path), "word/document.xml").toString("utf8");
  const out = [];
  for (const m of xml.matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>|<w:p[ >][\s\S]*?<\/w:p>/g)) {
    const blob = m[0];
    const cells = blob.startsWith("<w:tr")
      ? [...blob.matchAll(/<w:tc[ >][\s\S]*?<\/w:tc>/g)].map((c) => cellText(c[0]))
      : [cellText(blob)];
    const kept = cells.filter(Boolean);
    if (kept.length) out.push(kept);
  }
  return out;
}

/** One cell routinely holds every step run together, so split on the markers
 *  rather than trusting each step to be its own row. */
function splitSteps(text) {
  return text
    .split(/(?=Step\s*\d)/)
    .map((part) => /^Step\s*(\d)\s*([\s\S]*)$/.exec(part.trim()))
    .filter(Boolean)
    .map((m) => ({
      n: Number(m[1]),
      text: m[2]
        .replace(/\s*\|\s*/g, "   ")
        .split("Answer:")[0]
        .trim(),
    }));
}

function parsePractice(path) {
  const rows = blocks(path);
  const lines = rows.map((c) => c.join(" | "));
  const doc = { vocabulary: [], workedExample: { steps: [] }, yourProblem: { steps: [] } };

  for (const line of lines) {
    let m = /Lesson ([\d.]+) · Session 2:\s*(.+?)(?:\s*\||$)/.exec(line);
    if (m) {
      doc.revealLesson = m[1];
      doc.sessionTitle = m[2].trim();
    }
    m = /STANDARD:\s*([\w.]+)/.exec(line);
    if (m) doc.standard = m[1];
    m = /LEARNING TARGET:\s*(.+?)(?:\s*\||$)/.exec(line);
    if (m) doc.learningTarget = m[1].trim();
  }

  const lo = lines.findIndex((l) => l.includes("WORDS FOR THIS LESSON"));
  const hiRaw = lines.findIndex((l) => l.includes("WORKED EXAMPLE"));
  const hi = hiRaw < 0 ? lines.length : hiRaw;
  if (lo >= 0) {
    for (const cells of rows.slice(lo + 1, hi)) {
      if (cells.length < 3 || cells[0].toUpperCase() === "WORD") continue;
      const m = /^(.+?)Spanish:\s*(.+)$/.exec(cells[0]);
      doc.vocabulary.push({
        term: (m ? m[1] : cells[0]).trim(),
        termEs: m ? m[2].trim() : null,
        meaning: cells[1],
        example: cells[2],
      });
    }
  }

  for (const line of lines) {
    let m = /^YOUR PROBLEM\s*—\s*(.+)$/.exec(line);
    if (m) doc.yourProblem.stem = m[1].trim();
    const target = doc.yourProblem.stem ? doc.yourProblem : doc.workedExample;
    if (/Step\s*\d/.test(line)) target.steps.push(...splitSteps(line));
    m = /Answer:\s*(.+?)(?:\s*\||$)/.exec(line);
    if (m && !target.answer) target.answer = m[1].trim();
    m = /^(.+?)\s*—\s*(.+)$/.exec(line);
    if (
      m &&
      !doc.workedExample.prompt &&
      !/WORKED EXAMPLE|YOUR PROBLEM/.test(line) &&
      /[A-Z]{3,}/.test(m[1])
    ) {
      doc.workedExample.title = m[1].trim();
      doc.workedExample.prompt = m[2].trim();
    }
  }
  return doc;
}

function parseHomework(path) {
  const items = [];
  for (const cells of blocks(path)) {
    const m = /^(\d)\.\s*(.+)$/.exec(cells.join(" | "));
    if (m) items.push({ n: Number(m[1]), text: m[2].trim() });
  }
  return items;
}

const lessons = [];
if (!existsSync(REVEAL)) {
  console.error(`Reveal source not found at ${REVEAL} — nothing to import.`);
  process.exit(CHECK ? 0 : 1);
}
for (const unitDir of readdirSync(REVEAL).sort()) {
  const um = /^Unit (\d+)$/.exec(unitDir);
  if (!um) continue;
  const unit = Number(um[1]);
  for (const lessonDir of readdirSync(join(REVEAL, unitDir)).sort()) {
    const lm = new RegExp(`^Lesson ${unit}\\.(\\d+)$`).exec(lessonDir);
    if (!lm) continue;
    const lesson = Number(lm[1]);
    const base = join(REVEAL, unitDir, lessonDir);
    const practice = join(base, "Practice", `${unit}.${lesson} Session 2.docx`);
    const homework = join(base, "HW", `${unit}.${lesson} Session 2 HW.docx`);
    if (!existsSync(practice) || !existsSync(homework)) continue;
    lessons.push({
      id: `${unit}-${lesson}-part2`,
      unit,
      lesson,
      ...parsePractice(practice),
      homework: parseHomework(homework),
    });
  }
}

lessons.sort((a, b) => a.unit - b.unit || a.lesson - b.lesson);

const payload = {
  $comment:
    "GENERATED by tools/import-session2-practice.mjs from the district Reveal Session 2 material — do not hand-edit. Extracted text only: no answer is computed here. Answers live in data/part-two-session2-practice.json, authored and verified per lesson.",
  importedLessons: lessons.length,
  lessons,
};
const serialized = `${JSON.stringify(payload, null, 2)}\n`;

if (CHECK) {
  const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, "utf8") : "";
  if (current !== serialized) {
    console.error("import-session2-practice --check: data/part-two-session2-source.json is stale");
    process.exit(1);
  }
  console.log(`import-session2-practice --check: up to date (${lessons.length} lessons)`);
} else {
  writeFileSync(OUTPUT, serialized);
  console.log(`Imported ${lessons.length} Session 2 lessons to ${OUTPUT}`);
}
