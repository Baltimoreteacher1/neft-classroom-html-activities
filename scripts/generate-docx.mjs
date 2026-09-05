// ── DOCX generation for notes packets ────────────────────────────────────────
// Builds an editable, branded Microsoft Word version of each lesson's notes
// packet using the `docx` npm package. Content is derived from config.json
// (objectives + vocab + fill-in-the-blank guided notes + worked examples +
// practice + reflect), so it stays in lock-step with the HTML/PDF packets.
//
// The packet is laid out as a clean, printable, TPT-quality student workbook
// with real heading styles, a cover/header block, a shaded objectives box,
// consistent vocabulary cards, worked-example ("I Do"), guided ("We Do") and
// independent ("You Do") practice with handwriting space, an exit ticket, and a
// teacher answer key. US Letter, 1" margins, page breaks between major sections.
//
// Usage:
//   node scripts/generate-docx.mjs            # all lessons
//   node scripts/generate-docx.mjs 1-1 5-1    # specific lessons
//
// Output: lessons/<id>/downloads/<id>-notes.docx

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TabStopPosition,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { deriveTWR } from "@eduwonderlab/engine/core/twr.js";
import { resolveVocabImage } from "@eduwonderlab/engine/core/vocab-images.js";
import { deriveWorkedSteps } from "@eduwonderlab/engine/core/worked-steps.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// ── brand palette ─────────────────────────────────────────────────────────────
const NAVY = "12355B"; // primary headings
const TEAL = "1FA6A2"; // accent rules / "I Do" cues
const AMBER = "B97A12"; // writing / "You Do" cues
const PURPLE = "6B4FA0"; // "We Do" cue
const MUTED = "5F6F80"; // secondary text
const INK = "1A2733"; // body text
const RULE = "C7D2DD"; // hairline borders
const BOX_BG = "EEF4F8"; // pale objectives/vocab fill
const BOX_BORDER = "BBD0DE";
const AMBER_BG = "FBF3E2"; // pale writing-box fill
const TEAL_BG = "E6F4F3"; // pale "I Do" fill
const LINE_GREY = "AFBECC"; // handwriting rules

const choiceLetter = (i) => String.fromCharCode(65 + i);

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

// ── vocab image rasterization (unchanged pipeline: SVG → PNG via resvg) ────────
// Rasterize a term's vocab illustration (an SVG on disk) to a PNG buffer so it
// embeds in Word natively. Memoized per file. Returns { data, width, height }
// sized for a tidy figure, or null if the asset is missing — callers degrade
// gracefully (text only) rather than crash.
const _vocabPngCache = new Map();
function vocabPng(term, displayWidth = 120) {
  const webPath = resolveVocabImage(term); // e.g. "/assets/vocab-images/triangle.svg"
  const cacheKey = `${webPath}@${displayWidth}`;
  if (_vocabPngCache.has(cacheKey)) return _vocabPngCache.get(cacheKey);
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
      const scale = displayWidth / png.width;
      out = {
        data: buf,
        width: Math.round(png.width * scale),
        height: Math.round(png.height * scale),
      };
    }
  } catch {
    out = null;
  }
  _vocabPngCache.set(cacheKey, out);
  return out;
}

const lessonsDir = join(root, "lessons");
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

// ── paragraph / run helpers ───────────────────────────────────────────────────
function run(text, opts = {}) {
  return new TextRun({ text, size: 21, color: INK, ...opts });
}
function para(children, opts = {}) {
  return new Paragraph({
    spacing: { after: 80, ...(opts.spacing || {}) },
    ...opts,
    children: Array.isArray(children) ? children : [children],
  });
}

// Section heading (Heading 1): bold navy with a teal rule beneath.
//
// `keepNext` is not optional here. Every section used to force a page break, so
// a short section stranded the rest of its page — half a sheet of white paper
// per packet, which is what "the PDF is off page" looked like in print. Now only
// the sections that MUST start on a fresh sheet ask for a break (see callers),
// and the rest flow. keepNext is what makes flowing safe: it binds the heading
// to the block after it, so "Guided Practice" can never sit alone at the foot of
// a page with its content overleaf.
function sectionHeading(text, opts = {}) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: !!opts.pageBreak,
    keepNext: true,
    keepLines: true,
    spacing: { before: opts.pageBreak ? 0 : 300, after: 140 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 14, space: 6, color: TEAL },
    },
    children: [new TextRun({ text, bold: true, color: NAVY, size: 30 })],
  });
}

// A blank a student can actually write on.
//
// Cloze sentences arrive from config carrying literal "___" — about 4mm at 11pt,
// which is a mark on the page, not a space to write in. Underscores also print
// as a lumpy dotted rule. This swaps every run of 2+ underscores for an
// underlined span of non-breaking spaces: a clean continuous rule, sized so a
// sixth-grader's handwriting fits, that never breaks across a line.
// Plain underscores, deliberately — not an underlined span of spaces. Underlined
// whitespace renders with visible gaps where the word processor kerns the run
// (LibreOffice breaks it into segments), and the underline attribute is one of
// the first things Google Docs drops when it converts a .docx. A straight run of
// underscores is one unbroken rule in Word, LibreOffice, Google Docs and print
// alike. 16 of them is roughly 3cm at 11pt — enough for a sixth-grader to write
// a word, where the "___" that arrives in config is about 4mm.
const BLANK_RULE = "_".repeat(16);
function clozeRuns(sentence, size = 22) {
  const parts = String(sentence).split(/_{2,}/);
  const runs = [];
  parts.forEach((part, i) => {
    if (part) runs.push(new TextRun({ text: part, size }));
    if (i < parts.length - 1) {
      runs.push(new TextRun({ text: BLANK_RULE, size }));
    }
  });
  return runs;
}

// Sub-heading (Heading 2) with optional italic tag (e.g. an "I Do" cue).
function subHeading(text, tag, tagColor = TEAL) {
  const runs = [new TextRun({ text, bold: true, color: NAVY, size: 24 })];
  if (tag) runs.push(new TextRun({ text: `   ${tag}`, italics: true, color: tagColor, size: 19 }));
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 80 },
    children: runs,
  });
}

function muted(text, opts = {}) {
  return para(new TextRun({ text, color: MUTED, italics: true, size: 19 }), {
    spacing: { after: 100, ...(opts.spacing || {}) },
  });
}

function bilingual(en, es) {
  const runs = [run(en)];
  if (es)
    runs.push(
      new TextRun({
        text: es,
        italics: true,
        color: MUTED,
        size: 19,
        break: 1,
      }),
    );
  return para(runs, { spacing: { after: 60 } });
}

// A blank writing line for student handwriting.
function writeline(n = 1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(
      new Paragraph({
        spacing: { before: 150, after: 30 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE_GREY },
        },
        children: [new TextRun({ text: "" })],
      }),
    );
  }
  return out;
}

// A bordered work box (for showing work / longer responses). `lines` controls
// approximate height by stacking empty paragraphs inside the box.
function workBox(lines = 4, fill = "FFFFFF") {
  const inner = [];
  for (let i = 0; i < lines; i++) {
    inner.push(new Paragraph({ spacing: { after: 0, line: 320 }, children: [new TextRun("")] }));
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE },
      left: { style: BorderStyle.SINGLE, size: 6, color: RULE },
      right: { style: BorderStyle.SINGLE, size: 6, color: RULE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            shading: { type: ShadingType.CLEAR, fill, color: "auto" },
            children: inner,
          }),
        ],
      }),
    ],
  });
}

// A single-cell shaded callout box (objectives, "I Do" model, etc.).
function calloutBox(children, { fill = BOX_BG, border = BOX_BORDER } = {}) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: border },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: border },
      left: { style: BorderStyle.SINGLE, size: 8, color: border },
      right: { style: BorderStyle.SINGLE, size: 8, color: border },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            shading: { type: ShadingType.CLEAR, fill, color: "auto" },
            children,
          }),
        ],
      }),
    ],
  });
}

function spacer(after = 120) {
  return new Paragraph({ spacing: { after }, children: [new TextRun("")] });
}

// ── COVER / HEADER BLOCK ──────────────────────────────────────────────────────
function coverBlock(id, cfg) {
  const unitLesson = [
    cfg.unit != null ? `Unit ${cfg.unit}` : "",
    cfg.lesson != null ? `Lesson ${cfg.lesson}` : "",
  ]
    .filter(Boolean)
    .join("  ·  ");
  const standard = cfg.standard ? `Standard ${cfg.standard}` : "";
  const eyebrow = [unitLesson, standard].filter(Boolean).join("      ");
  const isFlagship = cfg.flagship || id.endsWith("-flagship");

  const out = [];

  // Eyebrow line
  if (eyebrow) {
    out.push(
      para(
        new TextRun({
          text: eyebrow.toUpperCase(),
          bold: true,
          color: TEAL,
          size: 18,
        }),
        { spacing: { after: 60 } },
      ),
    );
  }

  // Title (page title style)
  out.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: `${cfg.title || "Math Notes"}${isFlagship ? "  (Flagship)" : ""}`,
          bold: true,
          color: NAVY,
          size: 44,
        }),
      ],
    }),
  );
  out.push(
    para(new TextRun({ text: "Student Notes Packet", color: MUTED, size: 20 }), {
      spacing: { after: 120 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 18, space: 6, color: NAVY },
      },
    }),
  );

  // Name / Date / Period line, evenly spaced with tab stops.
  out.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      tabStops: [
        { type: TabStopType.LEFT, position: 4320 },
        { type: TabStopType.LEFT, position: 7560 },
      ],
      children: [
        new TextRun({ text: "Name: ", bold: true, color: NAVY, size: 22 }),
        new TextRun({ text: "______________________", color: RULE, size: 22 }),
        new TextRun({ text: "\tDate: ", bold: true, color: NAVY, size: 22 }),
        new TextRun({ text: "____________", color: RULE, size: 22 }),
        new TextRun({ text: "\tPeriod: ", bold: true, color: NAVY, size: 22 }),
        new TextRun({ text: "________", color: RULE, size: 22 }),
      ],
    }),
  );

  return out;
}

// ── OBJECTIVES BOX ────────────────────────────────────────────────────────────
function objectivesBlock(cfg) {
  const co = cfg.contentObjective;
  const lo = cfg.languageObjective;
  if (!co && !lo) return [];
  const inner = [
    para(
      new TextRun({
        text: "Today's Goals",
        bold: true,
        color: NAVY,
        size: 22,
      }),
      { spacing: { after: 80 } },
    ),
  ];
  if (co) {
    inner.push(
      para(
        [
          new TextRun({ text: "Content:  ", bold: true, color: TEAL, size: 20 }),
          new TextRun({ text: co, size: 20 }),
        ],
        { spacing: { after: 60 } },
      ),
    );
  }
  if (lo) {
    inner.push(
      para(
        [
          new TextRun({ text: "Language:  ", bold: true, color: AMBER, size: 20 }),
          new TextRun({ text: lo, size: 20 }),
        ],
        { spacing: { after: 0 } },
      ),
    );
  }
  return [spacer(140), calloutBox(inner), spacer(40)];
}

// ── VOCABULARY (cards in a borderless 2-col table: image | term + meaning) ─────
function vocabBlock(vocab = []) {
  if (!vocab.length) return [];
  const out = [
    sectionHeading("Key Vocabulary"),
    muted("Look at the picture, read the word, then read what it means."),
  ];

  for (const v of vocab) {
    const pic = vocabPng(v.term, 110);

    // Left cell: image (or a small placeholder note). Right cell: term + meaning.
    const leftChildren = pic
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
            children: [
              new ImageRun({
                type: "png",
                data: pic.data,
                transformation: { width: pic.width, height: pic.height },
              }),
            ],
          }),
        ]
      : [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "📐", size: 40, color: MUTED })],
          }),
        ];

    const rightChildren = [
      para(
        [
          new TextRun({ text: v.term, bold: true, color: NAVY, size: 24 }),
          v.termEs
            ? new TextRun({
                text: `   ${v.termEs}`,
                italics: true,
                color: MUTED,
                size: 19,
              })
            : new TextRun(""),
        ],
        { spacing: { after: 50 } },
      ),
      para(new TextRun({ text: v.definition || "", size: 21 }), {
        spacing: { after: v.visual ? 40 : 0 },
      }),
    ];
    if (v.visual) {
      rightChildren.push(
        para(
          [
            new TextRun({ text: "Example:  ", bold: true, color: TEAL, size: 18 }),
            new TextRun({ text: v.visual, italics: true, color: MUTED, size: 18 }),
          ],
          { spacing: { after: 0 } },
        ),
      );
    }

    out.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          ...NO_BORDERS,
          bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
        },
        columnWidths: [1800, 7560],
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: 1800, type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 40, right: 120 },
                children: leftChildren,
              }),
              new TableCell({
                width: { size: 7560, type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 40, right: 40 },
                children: rightChildren,
              }),
            ],
          }),
        ],
      }),
    );
  }
  return out;
}

// ── WORKED EXAMPLE / "I Do" (from launch + explore) ──────────────────────────
// Render a multiple-choice option list for a worked problem.
function choiceLines(choices, size = 20) {
  if (!Array.isArray(choices)) return [];
  return choices.map((c, j) =>
    para(new TextRun({ text: `${choiceLetter(j)})  ${c}`, size }), {
      indent: { left: 420 },
      spacing: { after: 30 },
    }),
  );
}

// I-Do solved example: the problem, then each real explanation sentence as a
// numbered step, then the answer. Mirrors the HTML/PDF worked frame exactly.
function iDoSolvedBlock(iDo) {
  if (!iDo) return [];
  const out = [
    subHeading("Solved Example", "I Do — watch each step", TEAL),
    para(
      [
        new TextRun({ text: "Problem:  ", bold: true, color: NAVY, size: 21 }),
        new TextRun({ text: iDo.problem, size: 21 }),
      ],
      { spacing: { after: 40 }, keepNext: true },
    ),
    ...choiceLines(iDo.choices),
  ];
  iDo.steps.forEach((s, i) => {
    out.push(
      para(
        [
          new TextRun({ text: `Step ${i + 1}:  `, bold: true, color: TEAL, size: 21 }),
          new TextRun({ text: s, size: 21 }),
        ],
        { spacing: { before: 50, after: 20 } },
      ),
    );
  });
  if (iDo.answer) {
    out.push(
      para(
        [
          new TextRun({ text: "Answer:  ", bold: true, color: NAVY, size: 21 }),
          new TextRun({ text: iDo.answer, bold: true, size: 21 }),
        ],
        { spacing: { before: 60, after: 40 } },
      ),
    );
  }
  return out;
}

// We-Do problem with blank numbered steps for the class to solve together.
function weDoBlankBlock(weDo, stepCount) {
  if (!weDo) return [];
  const out = [
    para(
      [
        new TextRun({ text: "Problem:  ", bold: true, color: NAVY, size: 21 }),
        new TextRun({ text: weDo.problem, size: 21 }),
      ],
      { spacing: { before: 40, after: 40 }, keepNext: true },
    ),
    ...choiceLines(weDo.choices),
  ];
  const n = Math.min(Math.max(stepCount || 2, 2), 3);
  for (let i = 0; i < n; i++) {
    out.push(
      para(new TextRun({ text: `Step ${i + 1}:`, bold: true, color: PURPLE, size: 21 }), {
        spacing: { before: 50, after: 0 },
        keepNext: true,
      }),
    );
    out.push(...writeline(1));
  }
  out.push(
    para(new TextRun({ text: "Answer:", bold: true, color: NAVY, size: 21 }), {
      spacing: { before: 60, after: 0 },
      keepNext: true,
    }),
  );
  out.push(...writeline(1));
  return out;
}

function workedExampleBlock(cfg, worked) {
  const launch = cfg.launch || {};
  const explore = cfg.explore || {};
  const hasLaunch = launch.narrative || launch.badge;
  const hasExplore = explore.instructions;
  const hasWorked = Boolean(worked && worked.iDo);
  if (!hasLaunch && !hasExplore && !hasWorked) return [];

  const out = [sectionHeading("Worked Example")];
  out.push(subHeading("Watch & Read", "I Do — follow along with your teacher", TEAL));

  const inner = [];
  if (launch.badge) {
    inner.push(
      para(new TextRun({ text: launch.badge, bold: true, color: NAVY, size: 22 }), {
        spacing: { after: 60 },
      }),
    );
  }
  if (launch.narrative) {
    inner.push(para(new TextRun({ text: launch.narrative, size: 21 }), { spacing: { after: 0 } }));
  }
  if (inner.length) {
    out.push(calloutBox(inner, { fill: TEAL_BG, border: TEAL }));
    out.push(spacer(80));
  }

  // "Notice / Wonder" prompts guide the worked thinking.
  const notice = Array.isArray(launch.noticePrompts) ? launch.noticePrompts : [];
  const wonder = Array.isArray(launch.wonderPrompts) ? launch.wonderPrompts : [];
  if (notice.length || wonder.length) {
    out.push(
      para(new TextRun({ text: "Think about:", bold: true, color: NAVY, size: 21 }), {
        spacing: { before: 60, after: 50 },
      }),
    );
    [...notice, ...wonder].forEach((p) =>
      out.push(
        para(new TextRun({ text: `•  ${p}`, size: 20 }), {
          indent: { left: 300 },
          spacing: { after: 40 },
        }),
      ),
    );
  }

  // The actual solved example — one problem worked all the way through in
  // simple numbered steps so students see the notes in action.
  if (hasWorked) {
    out.push(...iDoSolvedBlock(worked.iDo));
  } else if (hasExplore) {
    out.push(subHeading("Try the Model", "step through it together"));
    out.push(para(new TextRun({ text: explore.instructions, size: 21 })));
    out.push(spacer(40));
    out.push(workBox(4, TEAL_BG));
  }

  return out;
}

// ── GUIDED PRACTICE / "We Do" (connect scenario + Turn & Talk) ───────────────
function guidedPracticeBlock(cfg, worked) {
  const connect = cfg.connect || {};
  const tt = Array.isArray(cfg.turnAndTalk) ? cfg.turnAndTalk : [];
  const hasWeDo = Boolean(worked && worked.weDo);
  if (!connect.scenario && !tt.length && !hasWeDo) return [];

  const out = [sectionHeading("Guided Practice")];
  out.push(subHeading("Solve Together", "We Do — work with your class", PURPLE));

  // We-Do worked problem: same step scaffold as the solved example, blank for
  // the class to fill in. Answer lives in the Answer Key.
  if (hasWeDo) {
    const stepCount = worked.iDo ? worked.iDo.steps.length : 2;
    out.push(...weDoBlankBlock(worked.weDo, stepCount));
    out.push(spacer(80));
  }

  // Connect = a real-world application problem to solve as a class.
  if (connect.scenario) {
    out.push(
      calloutBox(
        [
          para(new TextRun({ text: connect.scenario, size: 21 }), {
            spacing: { after: connect.promptQuestion ? 60 : 0 },
          }),
          ...(connect.promptQuestion
            ? [
                para(
                  new TextRun({
                    text: connect.promptQuestion,
                    bold: true,
                    color: NAVY,
                    size: 21,
                  }),
                  { spacing: { after: 0 } },
                ),
              ]
            : []),
        ],
        { fill: BOX_BG, border: BOX_BORDER },
      ),
    );
    out.push(spacer(60));
    if (connect.prompt) {
      out.push(
        para([
          new TextRun({ text: "Sentence frame:  ", bold: true, color: PURPLE, size: 20 }),
          new TextRun({ text: connect.prompt, italics: true, size: 20 }),
        ]),
      );
    }
    out.push(spacer(20));
    out.push(workBox(4));
    out.push(spacer(80));
  }

  // Turn & Talk discussion prompts (kept concise & student-facing — no answers).
  if (tt.length) {
    out.push(subHeading("Turn & Talk", "discuss with a partner"));
    tt.forEach((it, idx) => {
      const phase = String(it.phase || "").trim();
      const phaseLabel = phase ? phase.charAt(0).toUpperCase() + phase.slice(1) : "Discuss";
      out.push(
        para(
          [
            new TextRun({
              text: `${idx + 1}. `,
              bold: true,
              color: NAVY,
              size: 21,
            }),
            new TextRun({
              text: `[${phaseLabel}] `,
              bold: true,
              color: PURPLE,
              size: 19,
            }),
            new TextRun({ text: it.question || "", bold: true, size: 21 }),
          ],
          { spacing: { before: 80, after: 40 } },
        ),
      );
      // One supportive sentence starter (Level 1), if available.
      const stems = Array.isArray(it.stems) ? it.stems : [];
      const firstStem = stems
        .map((s) => (typeof s === "string" ? { en: s } : s))
        .find((s) => s && s.en);
      if (firstStem) {
        out.push(bilingual(`Start with:  ${firstStem.en}`, firstStem.es));
      }
      const wordBank = (Array.isArray(it.wordBank) ? it.wordBank : []).filter(Boolean);
      if (wordBank.length) {
        out.push(
          para([
            new TextRun({ text: "Word bank:  ", bold: true, color: NAVY, size: 19 }),
            new TextRun({ text: wordBank.join(",  "), color: TEAL, size: 19 }),
          ]),
        );
      }
    });
  }

  return out;
}

function _gatherPractice(practice = {}) {
  return [].concat(
    practice.approaching || [],
    practice.onLevel || [],
    practice.extending || [],
    practice.optional || [],
  );
}

// Tier metadata: the differentiation already encoded in every config. Student-
// facing labels never say "approaching"/"ESOL" — they read Level 1 / On Level /
// Level 2, matching the L0<L1<L2 scheme used across the math HTML activities.
// The three leveled-mode tiers the HTML notes template renders (html.level-l1 /
// l2 / l3), and the practice tier each one draws from. generate-pdf.mjs prints
// these by flipping a CSS class; the DOCX has no CSS, so it selects the tier
// directly. Same three names, same meaning, so a Word packet and its PDF twin
// hold the same problems.
const LEVELS = [
  { key: "l1", label: "Level 1 · Support" },
  { key: "l2", label: "Level 2 · Standard" },
  { key: "l3", label: "Level 3 · Enrichment" },
];
const LEVEL_TIER = { l1: "approaching", l2: "onLevel", l3: "extending" };
const LEVEL_LABEL = Object.fromEntries(LEVELS.map((l) => [l.key, l.label]));

const PRACTICE_TIERS = [
  { key: "approaching", label: "Level 1 Support", cue: "extra scaffolding", color: TEAL },
  { key: "onLevel", label: "On Level", cue: "grade-level practice", color: NAVY },
  { key: "extending", label: "Level 2 Enrichment", cue: "stretch your thinking", color: PURPLE },
];

// Walk the practice tiers in order, returning labelled groups of stem-bearing
// problems (the only items that render as numbered "You Do" questions), capping
// the total so the packet stays a clean single section. Numbering is continuous
// across tiers so the answer key lines up with the student copy.
function gatherPracticeTiered(practice = {}, excludeStems = new Set(), maxTotal = 6, level = null) {
  const groups = [];
  let count = 0;
  // A leveled packet carries ONE tier. The differentiation already lives in the
  // config as approaching / onLevel / extending, which is exactly L1 / L2 / L3 —
  // so a leveled copy is that tier's problems, not a re-authored set.
  const tiers = level ? PRACTICE_TIERS.filter((t) => t.key === LEVEL_TIER[level]) : PRACTICE_TIERS;
  for (const tier of tiers) {
    if (count >= maxTotal) break;
    const items = (practice[tier.key] || []).filter(
      (it) => it && it.stem && !excludeStems.has(it.stem),
    );
    if (!items.length) continue;
    const picks = items.slice(0, maxTotal - count);
    if (!picks.length) continue;
    groups.push({ ...tier, items: picks, startIndex: count });
    count += picks.length;
  }
  return groups;
}

// ── INDEPENDENT PRACTICE / "You Do" (numbered problems + work space) ─────────
function independentPracticeBlock(cfg, excludeStems = new Set(), level = null) {
  const groups = gatherPracticeTiered(cfg.practice, excludeStems, 6, level);
  if (!groups.length) return [];

  const out = [sectionHeading("Independent Practice")];
  out.push(subHeading("On Your Own", "You Do — show your work", AMBER));
  out.push(muted("Solve each problem. Show your thinking in the work box."));

  groups.forEach((group) => {
    // Label the differentiation tier that already exists in the config so the
    // printed packet makes Level 1 / On Level / Level 2 visible to teachers.
    out.push(subHeading(group.label, group.cue, group.color));
    group.items.forEach((it, idx) => {
      const num = group.startIndex + idx + 1;
      out.push(
        para(
          [
            new TextRun({ text: `${num}.  `, bold: true, color: NAVY, size: 22 }),
            new TextRun({ text: it.stem, bold: true, size: 21 }),
          ],
          { spacing: { before: 160, after: 60 }, keepNext: true },
        ),
      );
      if (Array.isArray(it.choices)) {
        it.choices.forEach((c, j) =>
          out.push(
            para(new TextRun({ text: `${choiceLetter(j)})  ${c}`, size: 20 }), {
              indent: { left: 420 },
              spacing: { after: 40 },
            }),
          ),
        );
        out.push(spacer(20));
        out.push(workBox(2, AMBER_BG));
      } else {
        out.push(workBox(4, AMBER_BG));
      }
    });
  });

  return out;
}

// ── WRITE ABOUT THE MATH (GUIDED WRITING) ───────────────────────────────────
// Mirrors the compact web version (scripts/generate-notes.mjs twrSection): the
// question, the words to use, a frame at each support level, a 3-item check.
// Spanish appears on the sentence frames only, and the C-E-R model prints only
// when the lesson authored one.
function writingBlock(cfg) {
  const twr = deriveTWR(cfg);
  const out = [sectionHeading("Write About the Math")];

  out.push(
    calloutBox([bilingual(twr.focus.questionEn, twr.focus.questionEs)], {
      fill: TEAL_BG,
      border: TEAL,
    }),
  );
  out.push(
    muted("Say your answer to a partner first. Then write it, using at least two of these words:"),
  );
  for (const word of twr.vocabulary) {
    out.push(
      para(
        [
          new TextRun({ text: "☐  ", bold: true, color: TEAL, size: 22 }),
          new TextRun({ text: word.term, bold: true, color: NAVY, size: 20 }),
          word.termEs
            ? new TextRun({ text: `  ·  ${word.termEs}`, italics: true, color: MUTED, size: 18 })
            : new TextRun(""),
        ],
        { spacing: { after: 40 } },
      ),
    );
  }

  if (twr.model && twr.model.claim) {
    out.push(
      calloutBox(
        [
          para([
            new TextRun({ text: "Model:  ", bold: true, color: NAVY, size: 19 }),
            new TextRun({ text: `${twr.model.claim} — ${twr.model.evidence}`, size: 19 }),
          ]),
        ],
        { fill: BOX_BG, border: BOX_BORDER },
      ),
    );
  }

  for (const level of twr.levels) {
    out.push(subHeading(level.label, level.support, level.id === "start" ? TEAL : AMBER));
    out.push(bilingual(level.directionEn, level.directionEs));
    for (const frame of level.frames) out.push(bilingual(frame.en, frame.es));
    out.push(workBox(level.id === "explain" ? 5 : 3, AMBER_BG));
  }

  out.push(subHeading("Check Your Explanation", "three quick checks", TEAL));
  for (const item of twr.checklist) {
    out.push(
      para([
        new TextRun({ text: "☐  ", bold: true, color: TEAL, size: 22 }),
        new TextRun({ text: item.en, size: 20 }),
      ]),
    );
  }
  return out;
}

// ── REFLECT / EXIT TICKET ─────────────────────────────────────────────────────
function reflectBlock(cfg) {
  const et = (cfg.reflect || {}).exitTicket || {};
  if (!et.stem) return [];
  const out = [sectionHeading("Exit Ticket")];
  out.push(muted("Answer on your own. This shows what you learned today."));
  out.push(
    para(
      [
        new TextRun({ text: "★  ", color: AMBER, size: 22 }),
        new TextRun({ text: et.stem, bold: true, size: 22 }),
      ],
      { spacing: { before: 80, after: 80 } },
    ),
  );
  if (Array.isArray(et.choices)) {
    et.choices.forEach((c, j) =>
      out.push(
        para(new TextRun({ text: `${choiceLetter(j)})  ${c}`, size: 21 }), {
          indent: { left: 420 },
          spacing: { after: 60 },
        }),
      ),
    );
    out.push(spacer(40));
  } else {
    out.push(...writeline(4));
  }
  return out;
}

// Per-distractor "why this is wrong" teacher lines for an MCQ. Renders only the
// incorrect choices (keyed off correctIndex) and only when the config supplies
// explicit `choiceExplanations` (one per choice). This is additive and forward-
// compatible: no current config carries the array, so nothing renders today, but
// the moment a lesson adds it the misconception guidance appears with zero code
// changes. The whole-item `explanation` already covers the no-array case above.
function distractorWhyLines(it) {
  const why = it && it.choiceExplanations;
  if (!Array.isArray(why) || !Array.isArray(it.choices)) return [];
  const out = [];
  it.choices.forEach((_c, j) => {
    if (j === it.correctIndex) return;
    const note = why[j];
    if (!note) return;
    out.push(
      para(
        [
          new TextRun({
            text: `${choiceLetter(j)})  why this is wrong:  `,
            bold: true,
            color: AMBER,
            size: 18,
          }),
          new TextRun({ text: note, italics: true, color: MUTED, size: 18 }),
        ],
        { indent: { left: 420 }, spacing: { after: 30 } },
      ),
    );
  });
  return out;
}

// ── ANSWER KEY & TEACHER GUIDE (separate page) ───────────────────────────────
function answerKeyBlock(cfg, worked, excludeStems = new Set()) {
  const practice = cfg.practice || {};
  const reflect = cfg.reflect || {};
  const out = [sectionHeading("Answer Key & Teacher Guide", { pageBreak: true })];
  out.push(muted("Teacher reference — remove or fold back before distributing to students."));

  // Fill-in-the-blank guided notes answers, listed first so a teacher can check
  // the notes line by line.
  const gnRows = guidedNotesAnswerRows(cfg);
  if (gnRows.length) {
    out.push(subHeading("Guided Notes (Fill-in)"));
    gnRows.forEach((r) => {
      out.push(
        para([
          new TextRun({ text: `${r.label}:  `, bold: true, size: 21 }),
          new TextRun({ text: r.answer, size: 21 }),
        ]),
      );
    });
  }

  // Guided-notes worked frame answers (I Do is shown in the packet; We Do is
  // blank for the class). List them first so teachers can check the model.
  if (worked && (worked.iDo || worked.weDo)) {
    out.push(subHeading("Worked Notes (I Do / We Do)"));
    if (worked.iDo && worked.iDo.answer) {
      out.push(
        para([
          new TextRun({ text: "I Do:  ", bold: true, size: 21 }),
          new TextRun({ text: worked.iDo.answer, size: 21 }),
        ]),
      );
    }
    if (worked.weDo && worked.weDo.answer) {
      out.push(
        para([
          new TextRun({ text: "We Do:  ", bold: true, size: 21 }),
          new TextRun({ text: worked.weDo.answer, size: 21 }),
        ]),
      );
    }
  }

  const groups = gatherPracticeTiered(practice, excludeStems);
  if (groups.length) {
    out.push(subHeading("Independent Practice"));
    // Misconception-targeted teacher note from the existing (previously unused)
    // commonMistake field — turns a generic key into actionable guidance.
    if (practice.commonMistake) {
      out.push(
        para(
          [
            new TextRun({ text: "Watch for this mistake:  ", bold: true, color: AMBER, size: 20 }),
            new TextRun({ text: practice.commonMistake, italics: true, color: MUTED, size: 19 }),
          ],
          { spacing: { after: 100 } },
        ),
      );
    }
    groups.forEach((group) => {
      out.push(subHeading(group.label));
      group.items.forEach((it, idx) => {
        const num = group.startIndex + idx + 1;
        let ans = "";
        if (Array.isArray(it.choices) && typeof it.correctIndex === "number") {
          ans = `${choiceLetter(it.correctIndex)})  ${it.choices[it.correctIndex]}`;
        } else if (it.sampleAnswer) ans = it.sampleAnswer;
        out.push(
          para([
            new TextRun({ text: `${num}.  `, bold: true, size: 21 }),
            new TextRun({ text: ans || "Answers vary.", size: 21 }),
            it.explanation
              ? new TextRun({
                  text: `  — ${it.explanation}`,
                  italics: true,
                  color: MUTED,
                  size: 19,
                })
              : new TextRun(""),
          ]),
        );
        // Per-distractor "why this is wrong" guidance keyed off correctIndex.
        out.push(...distractorWhyLines(it));
      });
    });
  }

  const et = reflect.exitTicket || {};
  if (et.stem) {
    out.push(subHeading("Exit Ticket"));
    let ans = "";
    if (Array.isArray(et.choices) && typeof et.correctIndex === "number") {
      ans = `${choiceLetter(et.correctIndex)})  ${et.choices[et.correctIndex]}`;
    }
    out.push(
      para([
        new TextRun({ text: ans || "Answers vary.", size: 21 }),
        et.explanation
          ? new TextRun({ text: `  — ${et.explanation}`, italics: true, color: MUTED, size: 19 })
          : new TextRun(""),
      ]),
    );
  }

  const twr = deriveTWR(cfg);
  out.push(subHeading("Math Writing Criteria"));
  out.push(
    muted(
      "The support level changes the amount of language scaffolding, not the mathematical expectation.",
    ),
  );
  for (const item of twr.teacherCriteria) {
    out.push(para(new TextRun({ text: `☐  ${item.en}`, size: 20 })));
  }

  return out;
}

// ── GUIDED NOTES (FILL-IN-THE-BLANK) ──────────────────────────────────────────
// Mirrors the HTML packet: each vocab item ships a `cloze` sentence whose blank
// is the term. Rendered as a numbered fill-in list with a Word Bank, exactly
// like a TPT-style guided-notes page.
function guidedNotesBlock(cfg) {
  const vocab = Array.isArray(cfg.vocabulary) ? cfg.vocabulary.filter((v) => v && v.term) : [];
  if (!vocab.length) return [];
  const out = [sectionHeading("Guided Notes")];
  out.push(muted("Fill in each blank as we go. Use the Word Bank to help you."));
  out.push(
    calloutBox([
      para([new TextRun({ text: "WORD BANK", bold: true, color: TEAL, size: 18 })], {
        spacing: { after: 40 },
      }),
      para([
        new TextRun({
          text: vocab.map((v) => v.term).join("      •      "),
          bold: true,
          size: 21,
        }),
      ]),
    ]),
  );
  out.push(spacer(80));
  vocab.forEach((v, i) => {
    const sentence =
      v.cloze && /_{2,}/.test(v.cloze)
        ? v.cloze
        : `___  —  ${v.definition || "Write what this word means."}`;
    out.push(
      para(
        [
          new TextRun({ text: `${i + 1}.  `, bold: true, color: NAVY, size: 22 }),
          ...clozeRuns(sentence, 22),
        ],
        // Roomier than the old 80/120: these lines are written on, so they need
        // vertical space as well as horizontal.
        { spacing: { before: 200, after: 260 }, keepLines: true },
      ),
    );
  });
  return out;
}

function guidedNotesAnswerRows(cfg) {
  const vocab = Array.isArray(cfg.vocabulary) ? cfg.vocabulary.filter((v) => v && v.term) : [];
  return vocab.map((v, i) => ({ label: `Notes ${i + 1}`, answer: v.term }));
}

// ── LEVEL 0 / IEP SCAFFOLDED PRACTICE ─────────────────────────────────────────
// The most-supported tier (L0 < L1 < L2). Emitted only when a lesson provides
// an optional `practice.level0` array, so it is purely additive and idempotent.
// Each item is one of:
//   { stem, choices, correctIndex }  → fewer, larger answer choices to circle
//   { steps:[{ shown?, blank? }] }   → a partially-worked problem (some steps
//                                       filled, others left as a guided blank),
//                                       reusing the We-Do scaffold pattern.
//   { cloze, hint }                  → a cloze sentence with a first-letter hint.
// First-letter hints are derived automatically from `answer` when not supplied.
function level0ItemBlock(it, num) {
  const out = [];
  const head = (text) =>
    out.push(
      para(
        [
          new TextRun({ text: `${num}.  `, bold: true, color: NAVY, size: 24 }),
          new TextRun({ text, bold: true, size: 23 }),
        ],
        { spacing: { before: 160, after: 60 }, keepNext: true },
      ),
    );

  if (it.stem && Array.isArray(it.choices)) {
    head(it.stem);
    // Larger, well-spaced choices to circle (one per line, big type).
    it.choices.forEach((c, j) =>
      out.push(
        para(new TextRun({ text: `${choiceLetter(j)})   ${c}`, size: 24 }), {
          indent: { left: 480 },
          spacing: { after: 90 },
        }),
      ),
    );
    out.push(muted("Circle the answer that is correct."));
    return out;
  }

  if (Array.isArray(it.steps)) {
    head(it.stem || it.problem || "Finish each step.");
    it.steps.forEach((s, i) => {
      const label = new TextRun({ text: `Step ${i + 1}:  `, bold: true, color: PURPLE, size: 22 });
      if (s.shown) {
        out.push(
          para([label, new TextRun({ text: s.shown, size: 22 })], {
            spacing: { before: 50, after: 20 },
          }),
        );
      } else {
        out.push(para([label], { spacing: { before: 50, after: 0 }, keepNext: true }));
        out.push(...writeline(1));
      }
    });
    return out;
  }

  if (it.cloze) {
    const hint =
      it.hint ||
      (it.answer ? `Starts with the letter “${String(it.answer).trim().charAt(0)}”.` : "");
    head(it.cloze);
    if (hint) {
      out.push(
        para(
          [
            new TextRun({ text: "Hint:  ", bold: true, color: TEAL, size: 20 }),
            new TextRun({ text: hint, italics: true, color: MUTED, size: 20 }),
          ],
          { spacing: { after: 40 } },
        ),
      );
    }
    out.push(...writeline(1));
    return out;
  }

  return out;
}

function level0Block(cfg) {
  const items = Array.isArray(cfg.practice && cfg.practice.level0) ? cfg.practice.level0 : [];
  if (!items.length) return [];
  const out = [sectionHeading("Practice — Level 0", { pageBreak: true })];
  out.push(subHeading("One Step at a Time", "extra support — you can do this", TEAL));
  out.push(muted("Take your time. Some steps are started for you."));
  items.slice(0, 4).forEach((it, i) => out.push(...level0ItemBlock(it, i + 1)));
  return out;
}

// ── DOCUMENT ASSEMBLY ─────────────────────────────────────────────────────────
// variant: "student" (default) | "teacher" | "level0"
function buildDoc(id, cfg, variant = "student", level = null) {
  const teacher = variant === "teacher";
  const level0 = variant === "level0";
  const worked = deriveWorkedSteps(cfg);
  // I-Do and We-Do problems are worked in the notes frame; exclude them from
  // the independent "On Your Own" set so answers are not duplicated or leaked.
  // You-Do remains in the pool and leads the independent practice.
  const excludeStems = new Set(
    [worked.iDo && worked.iDo.problem, worked.weDo && worked.weDo.problem].filter(Boolean),
  );
  const levelStamp = level
    ? [
        para([new TextRun({ text: LEVEL_LABEL[level], bold: true, color: TEAL, size: 22 })], {
          spacing: { before: 0, after: 200 },
        }),
      ]
    : [];
  const body = level0
    ? [
        // Level 0 / IEP copy: the same supported vocab + worked model students
        // need, then the most-scaffolded practice (fewer items, partial steps,
        // first-letter cloze hints) in place of the standard tiered "You Do".
        ...coverBlock(id, cfg),
        ...objectivesBlock(cfg),
        ...vocabBlock(cfg.vocabulary),
        ...guidedNotesBlock(cfg),
        ...writingBlock(cfg),
        ...workedExampleBlock(cfg, worked),
        ...level0Block(cfg),
        ...reflectBlock(cfg),
      ]
    : [
        ...coverBlock(id, cfg),
        ...levelStamp,
        ...objectivesBlock(cfg),
        ...vocabBlock(cfg.vocabulary),
        ...guidedNotesBlock(cfg),
        ...writingBlock(cfg),
        ...workedExampleBlock(cfg, worked),
        // L3 drops the We-Do scaffold: an enrichment packet that walks the
        // student through a second modelled problem is not enrichment. L1 and L2
        // keep it — it is the bridge from watching to doing.
        ...(level === "l3" ? [] : guidedPracticeBlock(cfg, worked)),
        ...independentPracticeBlock(cfg, excludeStems, level),
        ...reflectBlock(cfg),
        // Answer Key & Teacher Guide only on the teacher copy.
        ...(teacher ? answerKeyBlock(cfg, worked, excludeStems) : []),
      ];

  const headerLabel = [
    cfg.unit != null ? `Unit ${cfg.unit}` : "",
    cfg.lesson != null ? `Lesson ${cfg.lesson}` : "",
    cfg.title || "",
  ]
    .filter(Boolean)
    .join("  ·  ");

  return new Document({
    creator: "Neft Teacher",
    title: `${cfg.title || "Math"} — Notes Packet`,
    description: "Neft Teacher Grade 6 Math notes packet",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 21, color: INK } },
      },
      paragraphStyles: [
        {
          id: "Title",
          name: "Title",
          basedOn: "Normal",
          run: { font: "Calibri", size: 44, bold: true, color: NAVY },
        },
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Calibri", size: 30, bold: true, color: NAVY },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Calibri", size: 24, bold: true, color: NAVY },
        },
      ],
    },
    sections: [
      {
        properties: {
          // US Letter (12240 × 15840 twips) with 1" (1440) margins.
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: {
                  bottom: { style: BorderStyle.SINGLE, size: 4, space: 4, color: RULE },
                },
                children: [new TextRun({ text: headerLabel, color: MUTED, size: 16 })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                tabStops: [
                  { type: TabStopType.CENTER, position: TabStopPosition.MAX / 2 },
                  { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
                ],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, space: 4, color: RULE },
                },
                children: [
                  new TextRun({
                    text: "Neft Teacher  ·  Grade 6 Math",
                    bold: true,
                    color: NAVY,
                    size: 16,
                  }),
                  new TextRun({ text: "\tPage ", color: MUTED, size: 16 }),
                  new TextRun({ children: [PageNumber.CURRENT], color: MUTED, size: 16 }),
                  new TextRun({ text: " of ", color: MUTED, size: 16 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], color: MUTED, size: 16 }),
                  new TextRun({ text: "\tneftteacher.com", color: MUTED, size: 16 }),
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
  let l0 = 0;
  let leveled = 0;
  for (const id of ids) {
    const cfg = JSON.parse(readFileSync(join(lessonsDir, id, "config.json"), "utf8"));
    const outDir = join(lessonsDir, id, "downloads");
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    // Student copy — no answer key.
    const studentBuf = await Packer.toBuffer(buildDoc(id, cfg, "student"));
    writeFileSync(join(outDir, `${id}-notes.docx`), studentBuf);
    // Teacher copy — includes the Answer Key & Teacher Guide.
    const teacherBuf = await Packer.toBuffer(buildDoc(id, cfg, "teacher"));
    writeFileSync(join(outDir, `${id}-notes-teacher.docx`), teacherBuf);
    // Leveled copies, student + teacher, named to match their PDF twins
    // (<id>-notes-l1.pdf etc). generate-pdf.mjs has printed these three tiers
    // since it learned the leveled mode; the DOCX side never did, so the L1
    // support and L3 enrichment packets existed only as PDFs a teacher could
    // not edit. Same filenames, same tiers — now both formats exist for all six.
    for (const lv of LEVELS) {
      const sBuf = await Packer.toBuffer(buildDoc(id, cfg, "student", lv.key));
      writeFileSync(join(outDir, `${id}-notes-${lv.key}.docx`), sBuf);
      const tBuf = await Packer.toBuffer(buildDoc(id, cfg, "teacher", lv.key));
      writeFileSync(join(outDir, `${id}-notes-teacher-${lv.key}.docx`), tBuf);
      leveled += 2;
    }
    // Level 0 / IEP copy — only when the lesson supplies practice.level0.
    if (Array.isArray(cfg.practice && cfg.practice.level0) && cfg.practice.level0.length) {
      const l0Buf = await Packer.toBuffer(buildDoc(id, cfg, "level0"));
      writeFileSync(join(outDir, `${id}-notes-l0.docx`), l0Buf);
      l0++;
    }
    ok++;
  }
  console.log(
    `Generated ${ok}/${ids.length} notes DOCX files (student + teacher) + ${leveled} leveled` +
      (l0 ? ` + ${l0} Level 0 copies` : ""),
  );
}

main();
