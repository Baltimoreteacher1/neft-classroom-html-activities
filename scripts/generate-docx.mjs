// ── DOCX generation for notes packets ────────────────────────────────────────
// Builds an editable, branded Microsoft Word version of each lesson's notes
// packet using the `docx` npm package. Content is derived from config.json
// (vocab + practice + reflect) plus the shared TWR core module, so it stays in
// lock-step with the HTML/PDF packets.
//
// Usage:
//   node scripts/generate-docx.mjs            # all lessons
//   node scripts/generate-docx.mjs 1-1 5-1    # specific lessons
//
// Output: lessons/<id>/downloads/<id>-notes.docx

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  PageNumber,
  Header,
  Footer,
} from "docx";
import { Resvg } from "@resvg/resvg-js";
import { deriveTWR } from "../engine/core/twr.js";
import { resolveVocabImage } from "../engine/core/vocab-images.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Rasterize a term's vocab illustration (an SVG on disk) to a PNG buffer so it
// embeds in Word natively (no SVG-fallback quirks). Memoized per file. Returns
// { data, width, height } sized for a tidy ~130px-wide figure, or null if the
// asset is missing — callers degrade gracefully (text only) rather than crash.
const _vocabPngCache = new Map();
function vocabPng(term) {
  const webPath = resolveVocabImage(term); // e.g. "/assets/vocab-images/triangle.svg"
  if (_vocabPngCache.has(webPath)) return _vocabPngCache.get(webPath);
  let out = null;
  try {
    const file = join(root, webPath.replace(/^\//, ""));
    if (existsSync(file)) {
      // Strip <title>/<desc> before rasterizing: some assets contain raw "<"/">"
      // inside their accessible title (valid for lenient browsers, but rejected
      // by resvg's strict XML parser). They aren't needed for rendering.
      const svg = readFileSync(file, "utf8")
        .replace(/<title[\s\S]*?<\/title>/gi, "")
        .replace(/<desc[\s\S]*?<\/desc>/gi, "");
      const r = new Resvg(svg, { fitTo: { mode: "width", value: 360 } });
      const png = r.render();
      const buf = png.asPng();
      const display = 130; // points-ish width in the doc
      const scale = display / png.width;
      out = {
        data: buf,
        width: Math.round(png.width * scale),
        height: Math.round(png.height * scale),
      };
    }
  } catch {
    out = null;
  }
  _vocabPngCache.set(webPath, out);
  return out;
}
const lessonsDir = join(root, "lessons");
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

const NAVY = "12355B";
const TEAL = "1FA6A2";
const AMBER = "9A6B12";
const MUTED = "5F6F80";

const choiceLetter = (i) => String.fromCharCode(65 + i);

// ── small paragraph helpers ──────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, color: NAVY, size: 30 })],
  });
}
function h2(text, color = NAVY) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, space: 8, color: TEAL } },
    children: [new TextRun({ text, bold: true, color, size: 26 })],
  });
}
function h3(text, tag) {
  const runs = [new TextRun({ text, bold: true, color: NAVY, size: 22 })];
  if (tag) runs.push(new TextRun({ text: `   ${tag}`, italics: true, color: TEAL, size: 17 }));
  return new Paragraph({ spacing: { before: 140, after: 60 }, children: runs });
}
function para(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: 60, ...(opts.spacing || {}) },
    children: Array.isArray(runs) ? runs : [runs],
    ...opts,
  });
}
function bilingual(en, es) {
  const runs = [new TextRun({ text: en, size: 21 })];
  if (es) runs.push(new TextRun({ text: `\n${es}`, italics: true, color: MUTED, size: 19, break: 1 }));
  return para(runs);
}
function muted(text) {
  return para(new TextRun({ text, color: MUTED, italics: true, size: 19 }));
}
// A blank writing line (underscored) for student handwriting.
function writeline(n = 1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(
      new Paragraph({
        spacing: { before: 120, after: 40 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "B9C6D3" } },
        children: [new TextRun({ text: "" })],
      }),
    );
  }
  return out;
}

// ── content sections ──────────────────────────────────────────────────────────
function vocabParas(vocab = []) {
  if (!vocab.length) return [];
  const out = [
    h2("Key Vocabulary  (Level 1 support)"),
    muted("Picture first, then the word, then a plain-language meaning."),
  ];
  for (const v of vocab) {
    // Picture first (mirrors the HTML/PDF packet), centered, then term + meaning.
    const pic = vocabPng(v.term);
    if (pic) {
      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 20 },
          keepNext: true,
          children: [
            new ImageRun({
              type: "png",
              data: pic.data,
              transformation: { width: pic.width, height: pic.height },
            }),
          ],
        }),
      );
    }
    out.push(
      para(
        [
          new TextRun({ text: v.term, bold: true, color: NAVY, size: 23 }),
          v.termEs ? new TextRun({ text: `  ·  ${v.termEs}`, italics: true, color: MUTED, size: 20 }) : new TextRun(""),
        ],
        { spacing: { after: 20 }, keepNext: true },
      ),
    );
    out.push(para(new TextRun({ text: v.definition || "", size: 21 }), { spacing: { after: 160 } }));
  }
  return out;
}

function twrParas(config) {
  const twr = deriveTWR(config);
  const out = [
    h2("Write About the Math  (The Writing Revolution)", AMBER),
    muted(
      twr.languageObjective ||
        "Build strong math sentences. Write, then say each sentence out loud.",
    ),
  ];

  // 1. Kernel
  out.push(h3("1. Kernel Sentence", "subject + verb"));
  out.push(
    para([
      new TextRun({ text: "Model: ", bold: true, color: TEAL, size: 21 }),
      new TextRun({ text: twr.kernel.en, size: 21 }),
    ]),
  );
  out.push(bilingual(twr.kernel.promptEn, twr.kernel.promptEs));
  out.push(...writeline(2));

  // 2. Expansion
  out.push(h3("2. Sentence Expansion", "because · but · so"));
  out.push(
    para([
      new TextRun({ text: "Kernel: ", bold: true, color: TEAL, size: 21 }),
      new TextRun({ text: twr.expansion.kernelEn, size: 21 }),
    ]),
  );
  for (const c of twr.expansion.conjunctions) {
    out.push(
      para([
        new TextRun({ text: `${c.word} `, bold: true, color: NAVY, size: 21 }),
        new TextRun({ text: c.frameEn, size: 21 }),
        c.frameEs ? new TextRun({ text: `\n${c.frameEs}`, italics: true, color: MUTED, size: 19, break: 1 }) : new TextRun(""),
      ]),
    );
    out.push(...writeline(1));
  }

  // 3. Sentence types
  out.push(h3("3. Sentence Types", "4 ways to write a math idea"));
  for (const t of twr.sentenceTypes) {
    out.push(
      para([
        new TextRun({ text: `${t.type}: `, bold: true, color: NAVY, size: 21 }),
        new TextRun({ text: t.hintEn, size: 21 }),
      ]),
    );
    out.push(bilingual(t.frameEn, t.frameEs));
    out.push(...writeline(1));
  }

  // 4. Explain reasoning
  out.push(h3("4. Explain Your Reasoning", "use a sentence starter"));
  for (const s of twr.reasoningStems) out.push(bilingual(s.en, s.es));
  out.push(...writeline(3));

  return out;
}

// Turn & Talk — Discussion Points. Mirrors the HTML section: per item, a
// phase + question, a Level 1 (support) block (kernel, bilingual stems, word
// bank, listen-for note), and a Level 2 push question with stems. Defensive
// about every optional field so older configs still render.
// Derive a SHORT strategy hint (mirrors generate-notes.mjs). Uses an explicit
// item.hint when present; otherwise a non-answer-giving nudge. NEVER uses
// item.listenFor and NEVER states the answer.
function deriveTtHint(item) {
  if (item.hint) return String(item.hint).trim();
  const parts = [];
  const wb = Array.isArray(item.wordBank) ? item.wordBank.filter(Boolean) : [];
  if (wb.length) {
    const picks = wb.slice(0, 2).join('" or "');
    parts.push(`Try starting with the word "${picks}".`);
  }
  if (item.question) {
    parts.push("Re-read the question and underline what it is asking you to compare or find.");
  } else {
    parts.push("Ask yourself: what does the math show, and how do I know?");
  }
  parts.push("Use one number or word from the problem as your evidence.");
  return parts.join(" ");
}

function turnAndTalkParas(config) {
  const items = Array.isArray(config.turnAndTalk) ? config.turnAndTalk : [];
  if (!items.length) return [];
  const out = [
    h2("Turn & Talk — Discussion Points  (Level 1 support · Level 2)", TEAL),
    muted(
      "Talk with a partner. Use the Level 1 stems if you need help getting started; try the Level 2 question when you are ready for more.",
    ),
  ];
  items.forEach((it, idx) => {
    const phase = String(it.phase || "").trim();
    const phaseLabel = phase
      ? phase.charAt(0).toUpperCase() + phase.slice(1)
      : "Discuss";
    out.push(
      para([
        new TextRun({ text: `${idx + 1}. [${phaseLabel}] `, bold: true, color: NAVY, size: 21 }),
        new TextRun({ text: it.question || "", bold: true, size: 21 }),
      ]),
    );
    // Level 1 (support)
    if (it.kernel) {
      out.push(
        para([
          new TextRun({ text: "Level 1 — Start here: ", bold: true, color: TEAL, size: 20 }),
          new TextRun({ text: it.kernel, size: 20 }),
        ]),
      );
    }
    // Optional strategy hint — never reveals the answer.
    const hintText = deriveTtHint(it);
    if (hintText) {
      out.push(
        para([
          new TextRun({ text: "Hint (optional): ", bold: true, color: TEAL, size: 20 }),
          new TextRun({ text: hintText, size: 20 }),
        ]),
      );
    }
    const stems = Array.isArray(it.stems) ? it.stems : [];
    if (stems.some((s) => (typeof s === "string" ? s : s && s.en))) {
      out.push(
        para(new TextRun({ text: "Sentence starters (optional)", bold: true, color: NAVY, size: 19 })),
      );
    }
    for (const s of stems) {
      const en = typeof s === "string" ? s : s && s.en;
      const es = typeof s === "object" && s ? s.es : "";
      if (en) out.push(bilingual(en, es));
    }
    const wordBank = (Array.isArray(it.wordBank) ? it.wordBank : []).filter(Boolean);
    if (wordBank.length) {
      out.push(
        para([
          new TextRun({ text: "Word bank: ", bold: true, color: NAVY, size: 20 }),
          new TextRun({ text: wordBank.join(", "), color: TEAL, size: 20 }),
        ]),
      );
    }
    if (it.listenFor) {
      out.push(
        para([
          new TextRun({ text: "Listen for: ", bold: true, color: NAVY, size: 19 }),
          new TextRun({ text: it.listenFor, italics: true, color: MUTED, size: 19 }),
        ]),
      );
    }
    // Level 2
    if (it.extend) {
      out.push(
        para([
          new TextRun({ text: "Level 2: ", bold: true, color: AMBER, size: 20 }),
          new TextRun({ text: it.extend, size: 20 }),
        ]),
      );
    }
    const extendStems = (Array.isArray(it.extendStems) ? it.extendStems : []).filter(Boolean);
    for (const s of extendStems) {
      out.push(para(new TextRun({ text: `• ${s}`, size: 20 }), { indent: { left: 360 } }));
    }
  });
  return out;
}

function gatherPractice(practice = {}) {
  return [].concat(
    practice.approaching || [],
    practice.onLevel || [],
    practice.extending || [],
  );
}

function tryItParas(practice = {}) {
  const items = gatherPractice(practice).filter((it) => it.stem);
  const picks = items.slice(-2).length ? items.slice(-2) : items.slice(0, 2);
  if (!picks.length) return [];
  const out = [h2("Try It"), muted("Solve on your own. Check the answer key when you are done.")];
  picks.forEach((it, i) => {
    out.push(para(new TextRun({ text: `${i + 1}. ${it.stem}`, bold: true, size: 21 })));
    if (Array.isArray(it.choices)) {
      it.choices.forEach((c, j) =>
        out.push(para(new TextRun({ text: `${choiceLetter(j)}. ${c}`, size: 20 }), { indent: { left: 360 } })),
      );
    }
    out.push(...writeline(3));
  });
  return out;
}

function reflectParas(reflect = {}) {
  const et = reflect.exitTicket || {};
  if (!et.stem) return [];
  const out = [h2("Reflect — Exit Ticket"), para(new TextRun({ text: et.stem, bold: true, size: 21 }))];
  if (Array.isArray(et.choices)) {
    et.choices.forEach((c, j) =>
      out.push(para(new TextRun({ text: `${choiceLetter(j)}. ${c}`, size: 20 }), { indent: { left: 360 } })),
    );
  }
  out.push(...writeline(3));
  return out;
}

function answerKeyParas(config) {
  const practice = config.practice || {};
  const reflect = config.reflect || {};
  const out = [
    new Paragraph({ children: [new TextRun({ text: "", break: 0 })], pageBreakBefore: true }),
    h2("Answer Key & Teacher Guide"),
  ];

  const items = gatherPractice(practice).filter((it) => it.stem);
  const picks = items.slice(-2).length ? items.slice(-2) : items.slice(0, 2);
  picks.forEach((it, i) => {
    let ans = "";
    if (Array.isArray(it.choices) && typeof it.correctIndex === "number") {
      ans = `${choiceLetter(it.correctIndex)}. ${it.choices[it.correctIndex]}`;
    } else if (it.sampleAnswer) ans = it.sampleAnswer;
    out.push(
      para([
        new TextRun({ text: `Try It ${i + 1}: `, bold: true, size: 21 }),
        new TextRun({ text: ans, size: 21 }),
        it.explanation ? new TextRun({ text: `  — ${it.explanation}`, italics: true, color: MUTED, size: 19 }) : new TextRun(""),
      ]),
    );
  });

  const et = reflect.exitTicket || {};
  if (et.stem && Array.isArray(et.choices) && typeof et.correctIndex === "number") {
    out.push(
      para([
        new TextRun({ text: "Exit Ticket: ", bold: true, size: 21 }),
        new TextRun({ text: `${choiceLetter(et.correctIndex)}. ${et.choices[et.correctIndex]}`, size: 21 }),
        et.explanation ? new TextRun({ text: `  — ${et.explanation}`, italics: true, color: MUTED, size: 19 }) : new TextRun(""),
      ]),
    );
  }

  // TWR teacher guide
  out.push(h3("Writing (TWR) — what to look for"));
  const twr = deriveTWR(config);
  out.push(para(new TextRun({ text: `Kernel sentence: a complete sentence needs a subject and a verb. Example: ${twr.kernel.en}`, size: 20 })));
  out.push(para(new TextRun({ text: "Expansion: because = reason, but = contrast/exception, so = result. Answers vary; each must keep the kernel idea.", size: 20 })));
  out.push(para(new TextRun({ text: "Sentence types: statement ends with a period, question with ?, exclamation with !, and a command starts with an action verb.", size: 20 })));
  return out;
}

// ── document assembly ─────────────────────────────────────────────────────────
function buildDoc(id, cfg) {
  const standard = cfg.standard ? `Standard ${cfg.standard}` : "";
  const unit = cfg.unit != null ? `Unit ${cfg.unit}` : "";

  const headerText = [unit, standard].filter(Boolean).join("  ·  ");

  const body = [
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: headerText.toUpperCase(), bold: true, color: TEAL, size: 17 })],
    }),
    h1(`${cfg.title}${cfg.flagship || id.endsWith("-flagship") ? "  (Flagship)" : ""}`),
    para(new TextRun({ text: `Lesson ${id}`, color: MUTED, size: 19 })),
    para([
      new TextRun({ text: "Name: ___________________    ", size: 21 }),
      new TextRun({ text: "Date: ____________    ", size: 21 }),
      new TextRun({ text: "Class: ____________", size: 21 }),
    ]),
    ...vocabParas(cfg.vocabulary),
    ...turnAndTalkParas(cfg),
    ...twrParas(cfg),
    ...tryItParas(cfg.practice),
    ...reflectParas(cfg.reflect),
    ...answerKeyParas(cfg),
  ];

  return new Document({
    creator: "Neft Teacher",
    title: `${cfg.title} — Notes Packet`,
    styles: {
      default: { document: { run: { font: "Calibri" } } },
    },
    sections: [
      {
        properties: { page: { margin: { top: 1008, bottom: 1152, left: 1008, right: 1008 } } },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `Neft Teacher  ·  ${cfg.title}`, color: MUTED, size: 16 })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Neft Teacher · Grade 6 Math", color: MUTED, size: 16 }),
                  new TextRun({ text: "    Page ", color: MUTED, size: 16 }),
                  new TextRun({ children: [PageNumber.CURRENT], color: MUTED, size: 16 }),
                  new TextRun({ text: " of ", color: MUTED, size: 16 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], color: MUTED, size: 16 }),
                ],
              }),
            ],
          }),
        },
        children: body,
      },
    ],
  });
}

function lessonIds(filter) {
  const all = readdirSync(lessonsDir)
    .filter((d) => LESSON_DIR_RE.test(d))
    .filter((d) => existsSync(join(lessonsDir, d, "config.json")));
  if (filter && filter.length) return all.filter((id) => filter.includes(id));
  return all;
}

async function main() {
  const filter = process.argv.slice(2);
  const ids = lessonIds(filter);
  let ok = 0;
  for (const id of ids) {
    const cfg = JSON.parse(readFileSync(join(lessonsDir, id, "config.json"), "utf8"));
    const outDir = join(lessonsDir, id, "downloads");
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const buffer = await Packer.toBuffer(buildDoc(id, cfg));
    writeFileSync(join(outDir, `${id}-notes.docx`), buffer);
    ok++;
  }
  console.log(`Generated ${ok}/${ids.length} notes DOCX files`);
}

main();
