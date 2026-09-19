/**
 * reveal-docx.mjs — read the district's Reveal "Session 1" / "Session 2"
 * practice and homework .docx files (in `~/Desktop/Reveal Math by Unit and
 * Lesson/`) into plain data.
 *
 * IT EXTRACTS, IT DOES NOT DERIVE. Every field is text the docx states; no
 * answer is computed here. Shared by tools/import-session1-practice.mjs and
 * tools/import-session2-practice.mjs so both sessions are read by one parser.
 *
 * A .docx is a zip and the repo has no zip READER (the `docx` dependency only
 * writes). Reading the central directory is ~30 lines and adds no dependency
 * to a build that ships to students.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";

export const REVEAL_ROOT = join(homedir(), "Desktop", "Reveal Math by Unit and Lesson");

export function readZipEntry(buf, wanted) {
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
export function blocks(path) {
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

/**
 * The practice sheet: title line, standard/learning target (Session 2 only),
 * the WORDS table, the WORKED EXAMPLE, the NOW YOU TRY / YOUR PROBLEM block,
 * the SAY IT & WRITE IT sentence starters and the WORD BANK.
 */
export function parsePractice(path) {
  const rows = blocks(path);
  const lines = rows.map((c) => c.join(" | "));
  const doc = {
    vocabulary: [],
    workedExample: { steps: [] },
    yourProblem: { steps: [] },
    sentenceStarters: [],
    wordBank: [],
  };

  for (const line of lines) {
    let m = /Lesson ([\d.]+) · Session (\d):\s*(.+?)(?:\s*\||$)/.exec(line);
    if (m) {
      doc.revealLesson = m[1];
      doc.session = Number(m[2]);
      doc.sessionTitle = m[3].trim();
    }
    m = /UNIT \d+:\s*([^|]+?)\s*(?:Lesson [\d.]+|\||$)/.exec(line);
    if (m && !doc.unitTitle) doc.unitTitle = m[1].trim();
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

  // The worked example and NOW YOU TRY live between their banners; the title
  // line ("SHARING A TOTAL USING A RATIO — Paint mixes…") is only looked for
  // inside the worked-example span, so a later "MASTERY QUESTION: … — …" exit
  // ticket can never be mistaken for it.
  const exampleAt = lines.findIndex((l) => /WORKED EXAMPLE/.test(l));
  const tryAt = lines.findIndex((l) => /NOW YOU TRY|^YOUR PROBLEM/.test(l));
  const sayAt = lines.findIndex((l) => /SAY IT & WRITE IT/.test(l));
  const sectionAt = lines.findIndex((l) => /^SECTION 1/.test(l));
  const end = (i) => (i < 0 ? lines.length : i);
  lines.forEach((line, i) => {
    const inExample = exampleAt >= 0 && i > exampleAt && i < end(tryAt);
    const inTry = tryAt >= 0 && i >= tryAt && i < end(sayAt >= 0 ? sayAt : sectionAt);
    if (!inExample && !inTry) return;
    const target = inTry ? doc.yourProblem : doc.workedExample;
    let m = /^YOUR PROBLEM\s*—\s*(.+)$/.exec(line);
    if (m) doc.yourProblem.stem = m[1].trim();
    if (/Step\s*\d/.test(line)) target.steps.push(...splitSteps(line));
    m = /Answer:\s*(.+?)(?:\s*\||$)/.exec(line);
    if (m && !target.answer) target.answer = m[1].trim();
    m = /^(.+?)\s*—\s*(.+)$/.exec(line);
    if (
      inExample &&
      m &&
      !doc.workedExample.prompt &&
      /[A-Z]{3,}/.test(m[1]) &&
      !/Step\s*\d/.test(line)
    ) {
      doc.workedExample.title = m[1].trim();
      doc.workedExample.prompt = m[2].trim();
    }
  });
  // Sentence starters and the word bank share one table; the starters are
  // bulleted inside a single cell, so split on the bullet, not on the row.
  if (sayAt >= 0) {
    for (const cells of rows.slice(sayAt, end(sectionAt))) {
      for (const cell of cells) {
        for (const part of cell.split(/\s*•\s*/).slice(1)) {
          const t = part.trim();
          if (t) doc.sentenceStarters.push(t);
        }
        const bank = /WORD BANK\s*(.+)$/.exec(cell);
        if (bank) {
          doc.wordBank = bank[1]
            .split(/\s*·\s*/)
            .map((w) => w.trim())
            .filter(Boolean);
        }
      }
    }
  }
  // The Session 1 "NOW YOU TRY" block has no separate stem line; its blanks
  // ARE the problem. A missing stem is reported as null, never invented.
  if (!doc.yourProblem.stem) doc.yourProblem.stem = null;
  if (doc.yourProblem.answer && /^_+$/.test(doc.yourProblem.answer)) doc.yourProblem.answer = null;
  return doc;
}

export function parseHomework(path) {
  const items = [];
  for (const cells of blocks(path)) {
    const m = /^(\d)\.\s*(.+)$/.exec(cells.join(" | "));
    if (m) items.push({ n: Number(m[1]), text: m[2].trim() });
  }
  return items;
}

/** Every `Unit N/Lesson N.x` folder under the Reveal root, as {unit, lesson, base}. */
export function revealLessonDirs(root = REVEAL_ROOT) {
  const out = [];
  if (!existsSync(root)) return out;
  for (const unitDir of readdirSync(root).sort()) {
    const um = /^Unit (\d+)$/.exec(unitDir);
    if (!um) continue;
    const unit = Number(um[1]);
    for (const lessonDir of readdirSync(join(root, unitDir)).sort()) {
      const lm = new RegExp(`^Lesson ${unit}\\.(\\d+)$`).exec(lessonDir);
      if (!lm) continue;
      out.push({ unit, lesson: Number(lm[1]), base: join(root, unitDir, lessonDir) });
    }
  }
  return out.sort((a, b) => a.unit - b.unit || a.lesson - b.lesson);
}
