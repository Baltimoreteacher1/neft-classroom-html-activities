// ── DOCX generation for notes packets ────────────────────────────────────────
// Builds an editable, branded Microsoft Word version of each lesson's notes
// packet using the `docx` npm package. Content is derived from config.json
// (objectives + vocab + launch/explore + connect + practice + reflect) plus the
// shared TWR core module, so it stays in lock-step with the HTML/PDF packets.
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
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  ShadingType,
  TabStopType,
  TabStopPosition,
} from "docx";
import { Resvg } from "@resvg/resvg-js";
import { deriveTWR } from "../engine/core/twr.js";
import { deriveWorkedSteps } from "../engine/core/worked-steps.js";
import { resolveVocabImage } from "../engine/core/vocab-images.js";

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

// Section heading (Heading 1): bold navy with a teal rule beneath. Page breaks
// are applied by callers via pageBreakBefore for clean print separation.
function sectionHeading(text, opts = {}) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: !!opts.pageBreak,
    spacing: { before: opts.pageBreak ? 0 : 260, after: 140 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 14, space: 6, color: TEAL },
    },
    children: [new TextRun({ text, bold: true, color: NAVY, size: 30 })],
  });
}

// Sub-heading (Heading 2) with optional italic tag (e.g. an "I Do" cue).
function subHeading(text, tag, tagColor = TEAL) {
  const runs = [new TextRun({ text, bold: true, color: NAVY, size: 24 })];
  if (tag)
    runs.push(
      new TextRun({ text: `   ${tag}`, italics: true, color: tagColor, size: 19 }),
    );
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 80 },
    children: runs,
  });
}

function muted(text, opts = {}) {
  return para(
    new TextRun({ text, color: MUTED, italics: true, size: 19 }),
    { spacing: { after: 100, ...(opts.spacing || {}) } },
  );
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
            children: [
              new TextRun({ text: "📐", size: 40, color: MUTED }),
            ],
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
      para(
        new TextRun({ text: `Step ${i + 1}:`, bold: true, color: PURPLE, size: 21 }),
        { spacing: { before: 50, after: 0 }, keepNext: true },
      ),
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

  const out = [sectionHeading("Worked Example", { pageBreak: true })];
  out.push(
    subHeading("Watch & Read", "I Do — follow along with your teacher", TEAL),
  );

  const inner = [];
  if (launch.badge) {
    inner.push(
      para(
        new TextRun({ text: launch.badge, bold: true, color: NAVY, size: 22 }),
        { spacing: { after: 60 } },
      ),
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
      para(
        new TextRun({ text: "Think about:", bold: true, color: NAVY, size: 21 }),
        { spacing: { before: 60, after: 50 } },
      ),
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

  const out = [sectionHeading("Guided Practice", { pageBreak: true })];
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
      const phaseLabel = phase
        ? phase.charAt(0).toUpperCase() + phase.slice(1)
        : "Discuss";
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

function gatherPractice(practice = {}) {
  return [].concat(
    practice.approaching || [],
    practice.onLevel || [],
    practice.extending || [],
    practice.optional || [],
  );
}

// ── INDEPENDENT PRACTICE / "You Do" (numbered problems + work space) ─────────
function independentPracticeBlock(cfg, excludeStems = new Set()) {
  const items = gatherPractice(cfg.practice).filter(
    (it) => it.stem && !excludeStems.has(it.stem),
  );
  // Up to 4 problems for a clean, one-section packet.
  const picks = items.slice(0, 4);
  if (!picks.length) return [];

  const out = [sectionHeading("Independent Practice", { pageBreak: true })];
  out.push(subHeading("On Your Own", "You Do — show your work", AMBER));
  out.push(muted("Solve each problem. Show your thinking in the work box."));

  picks.forEach((it, i) => {
    out.push(
      para(
        [
          new TextRun({
            text: `${i + 1}.  `,
            bold: true,
            color: NAVY,
            size: 22,
          }),
          new TextRun({ text: it.stem, bold: true, size: 21 }),
        ],
        { spacing: { before: 160, after: 60 }, keepNext: true },
      ),
    );
    if (Array.isArray(it.choices)) {
      it.choices.forEach((c, j) =>
        out.push(
          para(
            new TextRun({ text: `${choiceLetter(j)})  ${c}`, size: 20 }),
            { indent: { left: 420 }, spacing: { after: 40 } },
          ),
        ),
      );
      out.push(spacer(20));
      out.push(workBox(2, AMBER_BG));
    } else {
      out.push(workBox(4, AMBER_BG));
    }
  });

  return out;
}

// ── WRITE ABOUT THE MATH (TWR) ───────────────────────────────────────────────
function writingBlock(cfg) {
  const twr = deriveTWR(cfg);
  const out = [sectionHeading("Write About the Math", { pageBreak: true })];
  out.push(
    subHeading("Build Strong Sentences", "The Writing Revolution", AMBER),
  );
  out.push(
    muted(
      twr.languageObjective ||
        "Write a clear math sentence, then say it out loud.",
    ),
  );

  // 1. Kernel
  out.push(subHeading("1. Kernel Sentence", "subject + verb"));
  out.push(
    calloutBox(
      [
        para([
          new TextRun({ text: "Model:  ", bold: true, color: TEAL, size: 20 }),
          new TextRun({ text: twr.kernel.en, size: 20 }),
        ], { spacing: { after: 0 } }),
      ],
      { fill: AMBER_BG, border: AMBER },
    ),
  );
  out.push(spacer(40));
  out.push(bilingual(twr.kernel.promptEn, twr.kernel.promptEs));
  out.push(...writeline(2));

  // 2. Expansion
  out.push(subHeading("2. Sentence Expansion", "because · but · so"));
  out.push(
    para([
      new TextRun({ text: "Kernel:  ", bold: true, color: TEAL, size: 20 }),
      new TextRun({ text: twr.expansion.kernelEn, size: 20 }),
    ]),
  );
  for (const c of twr.expansion.conjunctions) {
    out.push(
      para([
        new TextRun({ text: `${c.word}  `, bold: true, color: NAVY, size: 21 }),
        new TextRun({ text: c.frameEn, size: 21 }),
        c.frameEs
          ? new TextRun({ text: c.frameEs, italics: true, color: MUTED, size: 19, break: 1 })
          : new TextRun(""),
      ]),
    );
    out.push(...writeline(1));
  }

  // 3. Explain reasoning (kept concise; sentence types live in HTML packet)
  out.push(subHeading("3. Explain Your Reasoning", "use a sentence starter"));
  for (const s of twr.reasoningStems) out.push(bilingual(s.en, s.es));
  out.push(...writeline(2));

  return out;
}

// ── REFLECT / EXIT TICKET ─────────────────────────────────────────────────────
function reflectBlock(cfg) {
  const et = (cfg.reflect || {}).exitTicket || {};
  if (!et.stem) return [];
  const out = [sectionHeading("Exit Ticket", { pageBreak: true })];
  out.push(
    muted("Answer on your own. This shows what you learned today."),
  );
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

// ── ANSWER KEY & TEACHER GUIDE (separate page) ───────────────────────────────
function answerKeyBlock(cfg, worked, excludeStems = new Set()) {
  const practice = cfg.practice || {};
  const reflect = cfg.reflect || {};
  const out = [sectionHeading("Answer Key & Teacher Guide", { pageBreak: true })];
  out.push(
    muted("Teacher reference — remove or fold back before distributing to students."),
  );

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

  const items = gatherPractice(practice).filter(
    (it) => it.stem && !excludeStems.has(it.stem),
  );
  const picks = items.slice(0, 4);
  if (picks.length) {
    out.push(subHeading("Independent Practice"));
    picks.forEach((it, i) => {
      let ans = "";
      if (Array.isArray(it.choices) && typeof it.correctIndex === "number") {
        ans = `${choiceLetter(it.correctIndex)})  ${it.choices[it.correctIndex]}`;
      } else if (it.sampleAnswer) ans = it.sampleAnswer;
      out.push(
        para([
          new TextRun({ text: `${i + 1}.  `, bold: true, size: 21 }),
          new TextRun({ text: ans || "Answers vary.", size: 21 }),
          it.explanation
            ? new TextRun({ text: `  — ${it.explanation}`, italics: true, color: MUTED, size: 19 })
            : new TextRun(""),
        ]),
      );
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

  // TWR teacher guide
  out.push(subHeading("Writing (TWR) — what to look for"));
  const twr = deriveTWR(cfg);
  out.push(
    para(new TextRun({
      text: `Kernel sentence: a complete sentence needs a subject and a verb. Example: ${twr.kernel.en}`,
      size: 20,
    })),
  );
  out.push(
    para(new TextRun({
      text: "Expansion: because = reason, but = contrast/exception, so = result. Answers vary; each must keep the kernel idea.",
      size: 20,
    })),
  );

  // Turn & Talk look-fors (teacher only).
  const tt = Array.isArray(cfg.turnAndTalk) ? cfg.turnAndTalk : [];
  const lookFors = tt.filter((it) => it.listenFor);
  if (lookFors.length) {
    out.push(subHeading("Turn & Talk — listen for"));
    lookFors.forEach((it, i) => {
      out.push(
        para([
          new TextRun({ text: `${i + 1}.  `, bold: true, size: 19 }),
          new TextRun({ text: it.listenFor, italics: true, color: MUTED, size: 19 }),
        ]),
      );
    });
  }

  return out;
}

// ── DOCUMENT ASSEMBLY ─────────────────────────────────────────────────────────
function buildDoc(id, cfg) {
  const worked = deriveWorkedSteps(cfg);
  // I-Do and We-Do problems are worked in the notes frame; exclude them from
  // the independent "On Your Own" set so answers are not duplicated or leaked.
  // You-Do remains in the pool and leads the independent practice.
  const excludeStems = new Set(
    [worked.iDo && worked.iDo.problem, worked.weDo && worked.weDo.problem].filter(
      Boolean,
    ),
  );
  const body = [
    ...coverBlock(id, cfg),
    ...objectivesBlock(cfg),
    ...vocabBlock(cfg.vocabulary),
    ...workedExampleBlock(cfg, worked),
    ...guidedPracticeBlock(cfg, worked),
    ...independentPracticeBlock(cfg, excludeStems),
    ...writingBlock(cfg),
    ...reflectBlock(cfg),
    ...answerKeyBlock(cfg, worked, excludeStems),
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
                children: [
                  new TextRun({ text: headerLabel, color: MUTED, size: 16 }),
                ],
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
                  new TextRun({ text: "Neft Teacher  ·  Grade 6 Math", bold: true, color: NAVY, size: 16 }),
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
