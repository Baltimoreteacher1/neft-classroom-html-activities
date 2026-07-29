// ── MCAP-practice item extractor ─────────────────────────────────────────────
// One-time / re-runnable extractor that lifts the curated MCAP-style items out
// of the 51 already-copied per-lesson practice DOCX and writes them to a
// structured JSON data file per lesson. Those JSON files become the SINGLE
// SOURCE OF TRUTH for scripts/generate-mcap-practice.mjs.
//
// The source DOCX (the "Final_Flawless" set) was copied into each lesson by
// scripts/integrate-lesson-printables.mjs. We do NOT touch that script. We read
// the DOCX directly:
//   • UNZIP with jszip (already installed; used for reading only)
//   • PARSE word/document.xml with light regex to recover paragraph text
//   • CLASSIFY paragraphs back into header fields + an items[] array
//
// Each DOCX header carries BOTH the Reveal lesson label (e.g. "Lesson 6-5") and
// the CCSS code (e.g. "6.AT.B.6"). The Reveal label differs from the classroom
// folder id (number crossing); we keep the classroom id as the JSON key and the
// Reveal label as `revealLabel`. The CCSS code is the standard of record and is
// preserved verbatim.
//
// Wording is LIGHTLY normalized to official-MCAP phrasing WITHOUT changing the
// mathematics or correct answers (see normalizeStem).
//
// Run: node scripts/mcap-practice/extract-items.mjs
//      npm run extract-mcap-practice  (if wired)

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..");
const lessonsDir = join(root, "lessons");
const dataDir = join(__dirname, "data");

// ── DOCX text recovery ────────────────────────────────────────────────────────
function decodeXml(s) {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// Render a single OMML fraction (<m:f>) to inline text "num/den". The source
// "Final_Flawless" set only ever uses fractions inside OMML (verified across all
// 51 DOCX); other OMML constructs would need adding here if introduced later.
function renderOmmlFraction(fXml) {
  const numM = fXml.match(/<m:num\b[\s\S]*?<\/m:num>/);
  const denM = fXml.match(/<m:den\b[\s\S]*?<\/m:den>/);
  const txt = (block) =>
    block
      ? (block.match(/<m:t\b[^>]*>[\s\S]*?<\/m:t>/g) || []).map((t) => decodeXml(t)).join("")
      : "";
  const num = txt(numM && numM[0]).trim();
  const den = txt(denM && denM[0]).trim();
  if (!num && !den) return "";
  // wrap multi-char numerators/denominators for clarity, else bare a/b
  const wrap = (v) => (v.length > 1 ? `(${v})` : v);
  return `${wrap(num)}/${wrap(den)}`;
}

// Serialize a paragraph's inner XML to text, walking <w:t> runs AND <m:oMath>
// math objects in document order so no math is silently dropped.
function serializeParagraph(pXml) {
  // token-level scan: match either a <w:t>…</w:t> run or an <m:oMath>…</m:oMath>
  const tokenRe = /<w:t\b[^>]*>[\s\S]*?<\/w:t>|<m:oMath\b[\s\S]*?<\/m:oMath>/g;
  let out = "";
  let m;
  while ((m = tokenRe.exec(pXml))) {
    const tok = m[0];
    if (tok.startsWith("<m:oMath")) {
      // each oMath may contain one or more fractions / plain math runs
      const fracs = tok.match(/<m:f\b[\s\S]*?<\/m:f>/g);
      if (fracs && fracs.length) {
        out += fracs.map(renderOmmlFraction).join(" ");
      } else {
        // plain math runs (no fraction) — recover their <m:t> text
        out += (tok.match(/<m:t\b[^>]*>[\s\S]*?<\/m:t>/g) || []).map((t) => decodeXml(t)).join("");
      }
    } else {
      out += decodeXml(tok);
    }
  }
  return out;
}

// Return the visible text of each non-empty paragraph, in document order.
async function readParagraphs(docxPath) {
  const zip = await JSZip.loadAsync(readFileSync(docxPath));
  const file = zip.file("word/document.xml");
  if (!file) throw new Error(`no word/document.xml in ${docxPath}`);
  const xml = await file.async("string");
  const out = [];
  const paraRe = /<w:p\b[\s\S]*?<\/w:p>/g;
  let m;
  while ((m = paraRe.exec(xml))) {
    // <w:br/> and tabs become single spaces; collapse runaway whitespace
    const clean = serializeParagraph(m[0]).replace(/\s+/g, " ").trim();
    if (clean) out.push(clean);
  }
  return out;
}

// ── wording normalization (math-preserving) ───────────────────────────────────
// Tidies phrasing only. Never rewrites numbers, variables, operators or answers.
function normalizeStem(stem, type) {
  let s = stem.replace(/\s+/g, " ").trim();
  // canonical multi-select lead-in: ensure stem starts with exactly "Select ALL"
  if (type === "multiselect") {
    if (/^select\s+all\b/i.test(s)) {
      s = s.replace(/^select\s+all\b/i, "Select ALL");
    } else if (/^select\b/i.test(s)) {
      s = s.replace(/^select\b/i, "Select ALL");
    }
  }
  // tidy stray double spaces around punctuation
  s = s.replace(/\s+([?.,;:])/g, "$1");
  return s;
}

// Official-MCAP constructed-response cue, appended only if the stem lacks one.
function ensureConstructedCue(stem) {
  if (/show .*work|explain your reasoning|explain your work|enter your answer/i.test(stem)) {
    return stem;
  }
  return `${stem} Show or explain your work.`;
}

// ── classify paragraphs into structured item set ──────────────────────────────
const ITEM_HEADER_RE = /^Item\s+(\d+)\s*\|\s*(.+)$/i;
const CHOICE_RE = /^([○□])\s*([A-Z])\.\s*(.+)$/;
const LESSON_CCSS_RE = /Lesson\s+([0-9]+-[0-9]+)\s*CCSS:\s*([0-9A-Za-z.]+)/;
const FOCUS_RE = /^Item Set Focus:\s*(.+)$/i;

function typeFromLabel(label) {
  const l = label.toLowerCase();
  if (l.includes("multiple select") || l.includes("multi-select")) return "multiselect";
  if (l.includes("constructed")) return "constructed";
  if (l.includes("numeric") || l.includes("gridded")) return "numeric";
  return "selected";
}

function parseItemSet(paras, classroomId) {
  let revealLabel = null;
  let ccss = null;
  let focus = null;
  const items = [];
  let cur = null;

  const flush = () => {
    if (!cur) return;
    if (cur.type === "constructed" || cur.type === "numeric") {
      cur.stem = ensureConstructedCue(normalizeStem(cur.stem, cur.type));
    } else {
      cur.stem = normalizeStem(cur.stem, cur.type);
    }
    items.push(cur);
    cur = null;
  };

  for (const p of paras) {
    // header: Lesson + CCSS (run-together in source; we split it here)
    const lc = p.match(LESSON_CCSS_RE);
    if (lc) {
      revealLabel = lc[1];
      ccss = lc[2];
      continue;
    }
    const fm = p.match(FOCUS_RE);
    if (fm) {
      focus = fm[1].trim();
      continue;
    }
    const ih = p.match(ITEM_HEADER_RE);
    if (ih) {
      flush();
      cur = {
        n: Number(ih[1]),
        type: typeFromLabel(ih[2]),
        stem: "",
        choices: [],
      };
      continue;
    }
    if (!cur) continue; // skip banner / name-date / directions lines
    const ch = p.match(CHOICE_RE);
    if (ch) {
      cur.choices.push(ch[3].trim());
      continue;
    }
    if (p === "Answer Space") continue;
    // a row of underscores = a constructed-response answer line
    if (/^_{6,}$/.test(p)) {
      cur.answerSpaceLines = (cur.answerSpaceLines || 0) + 1;
      continue;
    }
    // otherwise this is (more of) the stem
    cur.stem = cur.stem ? `${cur.stem} ${p}` : p;
  }
  flush();

  // shape choices: selected/multiselect keep them; constructed/numeric drop empties
  for (const it of items) {
    if (it.type === "constructed" || it.type === "numeric") {
      if (it.choices.length === 0) delete it.choices;
      if (!it.answerSpaceLines) it.answerSpaceLines = 7;
    }
  }

  // split focus "Title — Subtitle" into title + focus when present
  let title = focus;
  let focusDetail = null;
  if (focus && focus.includes("—")) {
    const [t, d] = focus.split("—");
    title = t.trim();
    focusDetail = d.trim();
  }

  return {
    classroomId,
    revealLabel,
    ccss,
    title: title || null,
    focus: focusDetail || null,
    items,
  };
}

// ── driver ────────────────────────────────────────────────────────────────────
function listLessonIds() {
  const ids = [];
  for (const e of readdirSync(lessonsDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const docx = join(
      lessonsDir,
      e.name,
      "downloads",
      "printables",
      `${e.name}-mcap-practice.docx`,
    );
    if (existsSync(docx)) ids.push(e.name);
  }
  return ids.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

async function main() {
  mkdirSync(dataDir, { recursive: true });
  const ids = listLessonIds();
  if (ids.length === 0) {
    console.error("No MCAP practice DOCX found under lessons/*/downloads/printables/");
    process.exit(1);
  }

  const report = [];
  for (const id of ids) {
    const docx = join(lessonsDir, id, "downloads", "printables", `${id}-mcap-practice.docx`);
    let parsed;
    try {
      const paras = await readParagraphs(docx);
      parsed = parseItemSet(paras, id);
    } catch (err) {
      report.push({ id, items: 0, error: err.message });
      console.error(`  ✗ ${id}: ${err.message}`);
      continue;
    }
    writeFileSync(join(dataDir, `${id}.json`), JSON.stringify(parsed, null, 2) + "\n");
    report.push({
      id,
      revealLabel: parsed.revealLabel,
      ccss: parsed.ccss,
      items: parsed.items.length,
      noCcss: !parsed.ccss,
    });
  }

  // summary
  console.log("\nlesson         reveal   ccss          items");
  console.log("─".repeat(50));
  for (const r of report) {
    if (r.error) {
      console.log(`${r.id.padEnd(14)} ERROR: ${r.error}`);
      continue;
    }
    console.log(
      `${r.id.padEnd(14)} ${(r.revealLabel || "?").padEnd(8)} ${(r.ccss || "MISSING").padEnd(13)} ${r.items}`,
    );
  }
  const total = report.reduce((a, r) => a + (r.items || 0), 0);
  const low = report.filter((r) => !r.error && r.items < 3);
  const noCcss = report.filter((r) => r.noCcss);
  console.log("─".repeat(50));
  console.log(`${report.length} lessons | ${total} items | ${dataDir}`);
  if (noCcss.length) console.log(`⚠ missing CCSS: ${noCcss.map((r) => r.id).join(", ")}`);
  if (low.length)
    console.log(`⚠ fewer than 3 items: ${low.map((r) => `${r.id}(${r.items})`).join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
