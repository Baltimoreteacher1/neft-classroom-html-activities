// G-96 student-packet-banned-tokens, G-98 writing-lab-deterministic-40.
// Pure in-process gates (no network, no browser).
import { analyzeParagraph, MOVES } from "../../bcpss-teachers/writing-lab/wl-coach.js";
import { buildPart, loadPacketSource } from "../../functions/_lib/bcpss/packet-parts.js";
import { renderPacketDocx, renderPacketHtml } from "../../functions/_lib/bcpss/packet-render.js";
import { BAND_LABEL, BANDS, variantCodes } from "../../shared/packets/bands.js";
import { paperSpec } from "../../shared/packets/content.js";
import { findLeaks } from "../../shared/packets/leak.js";
import { docxText, htmlText, paperPieces } from "../packet-test-kit.mjs";

// ── G-96 ──────────────────────────────────────────────────────────────────────
/** Scan a rendered student packet (HTML + DOCX) for banned student-facing tokens. */
export function scanStudentPacket(
  doc,
  spec,
  { unitId = "fixture", band = "1_2", codes = null } = {},
) {
  const errors = [];
  const mask = paperPieces(spec);
  const rendered = [
    ["html", htmlText(renderPacketHtml(doc))],
    ["docx", docxText(renderPacketDocx(doc))],
  ];
  for (const [fmt, text] of rendered) {
    const leaks = findLeaks(text, mask);
    if (leaks.length) errors.push(`${unitId} ${band} ${fmt}: banned token(s): ${leaks.join(", ")}`);
    if (codes) {
      for (const other of BANDS) {
        if (other !== band && text.includes(codes[other]))
          errors.push(`${unitId} ${band} ${fmt}: leaks another band code (${codes[other]})`);
      }
    }
    for (const label of Object.values(BAND_LABEL)) {
      if (text.includes(label))
        errors.push(`${unitId} ${band} ${fmt}: leaks band label "${label}"`);
    }
  }
  return errors;
}

export const g96 = {
  id: "G-96",
  name: "student-packet-banned-tokens",
  async run({ data }) {
    const errors = [];
    const unitIds = data.summaries.map((u) => u.id);
    if (unitIds.length !== 162) errors.push(`expected 162 BCPSS units, got ${unitIds.length}`);
    let packetsScanned = 0;
    for (const id of unitIds) {
      const src = await loadPacketSource(id);
      if (!src) {
        errors.push(`${id}: loadPacketSource returned null`);
        continue;
      }
      const codes = variantCodes(id);
      for (const band of BANDS) {
        const { doc } = buildPart(src, "student", { band });
        const spec = paperSpec(src.unit, src.studio, band);
        errors.push(...scanStudentPacket(doc, spec, { unitId: id, band, codes }));
        packetsScanned += 1;
      }
    }
    return {
      errors,
      info: { units: unitIds.length, bands: BANDS.length, packetsScanned },
    };
  },
  async controls({ data }) {
    const id = data.summaries[0].id;
    const src = await loadPacketSource(id);
    const { doc } = buildPart(src, "student", { band: "1_2" });
    doc.sections[0].blocks.push({
      type: "paragraph",
      runs: [{ t: "WIDA Level 2 — Newcomer / IEP" }],
    });
    const spec = paperSpec(src.unit, src.studio, "1_2");
    return [
      {
        name: 'injected "WIDA Level 2 — Newcomer / IEP" in student packet',
        errors: scanStudentPacket(doc, spec, { unitId: id, band: "1_2" }),
      },
    ];
  },
};

// ── G-98 ──────────────────────────────────────────────────────────────────────
// Matches any score, grade, points, WIDA level, fraction score (85/100), or percentage (85%).
export const FORBIDDEN_SCORE_RE =
  /(?:\b(?:score|grade|points?|wida\s+level|level\s+[1-6])\b|\b\d+\s*\/\s*\d+\b|\b\d+%)/i;

/** Scan coach-authored feedback strings (nudges, labels, summary) for forbidden scoring language. */
export function scanFeedbackForScores(feedback, id = "feedback") {
  const errors = [];
  const check = (field, value) => {
    if (typeof value !== "string") return;
    const m = value.match(FORBIDDEN_SCORE_RE);
    if (m) errors.push(`${id} (${field}): forbidden score/level text "${m[0]}" in "${value}"`);
  };
  for (const n of feedback.nudges || []) {
    check(`nudge:${n.k || "?"}`, n.msg);
    check(`nudge-label:${n.k || "?"}`, n.label);
  }
  for (const m of feedback.movesMeta || []) check(`move:${m.k || "?"}`, m.label);
  check("summary", feedback.summary);
  check("label", feedback.label);
  check("message", feedback.message);
  return errors;
}

const LONG_L1 =
  "The little brown dog ran all the way across the big green yard and then jumped over the tall wooden fence to chase a shiny red ball down the street.";
const LONG_L3 =
  "When the morning bell rang across the school courtyard, all of the fourth-grade students hurried down the hallway with their notebooks and pencils because the science teacher had promised to show them how sound waves travel through different materials during the afternoon lab.";
const LONG_L5 =
  "Although the colonial delegates disagreed sharply about trade rules and local taxation throughout the long summer debates in Philadelphia, they kept revising the draft resolution night after night because they knew that every colony needed a workable agreement before winter arrived and shipping lanes closed along the Atlantic coast.";

export const WRITING_FIXTURES = [
  // ── K-2 (l1_2): 13 responses ──
  { id: "k2-01-empty", text: "", ctx: { level: "l1_2" }, expectMoves: {} },
  { id: "k2-02-single-word", text: "Cats", ctx: { level: "l1_2" }, expectMoves: {} },
  { id: "k2-03-short-fragment", text: "in the park", ctx: { level: "l1_2" }, expectMoves: {} },
  {
    id: "k2-04-fragment-bbs",
    text: "because of the rain",
    ctx: { level: "l1_2" },
    expectMoves: { bbs: 1 },
  },
  {
    id: "k2-05-basic-2-sent",
    text: "The sun is bright. Plants grow tall.",
    ctx: { level: "l1_2" },
    expectMoves: { transition: 0, bbs: 0, sub: 0, appos: 0 },
  },
  {
    id: "k2-06-transition-rich",
    text: "First, I plant a seed. Next, I give it water. Finally, a green sprout pops up.",
    ctx: { level: "l1_2" },
    expectMoves: { transition: 3 },
  },
  {
    id: "k2-07-bbs-because",
    text: "The plant grew tall because it got water and sun.",
    ctx: { level: "l1_2" },
    expectMoves: { bbs: 1 },
  },
  {
    id: "k2-08-sub-start",
    text: "When the rain falls, the puddle gets big.",
    ctx: { level: "l1_2" },
    expectMoves: { sub: 1 },
  },
  {
    id: "k2-09-appos",
    text: "Max, my dog, loves to run in the yard.",
    ctx: { level: "l1_2" },
    expectMoves: { appos: 1 },
  },
  {
    id: "k2-10-multi-move-strong",
    text: "Max, my puppy, loves the park. First, he chases the ball because he has energy. When we walk home, he naps.",
    ctx: { level: "l1_2", vocab: ["energy"] },
    expectMoves: { transition: 1, bbs: 1, sub: 1, appos: 1 },
  },
  {
    id: "k2-11-vocab-aligned",
    text: "A plant needs water and sunlight to grow strong roots.",
    ctx: { level: "l1_2", vocab: ["plant", "water", "sunlight"] },
    expectMoves: {},
  },
  {
    id: "k2-12-run-on",
    text: LONG_L1,
    ctx: { level: "l1_2" },
    expectMoves: {},
  },
  {
    id: "k2-13-spanish-mixed-punct",
    text: "First, el sol warms the agua because it is hot.\nnext the niños play outside",
    ctx: { level: "l1_2" },
    expectMoves: { transition: 2, bbs: 1 },
  },

  // ── 3-5 (l3_4): 14 responses ──
  { id: "g35-14-whitespace", text: "   \n  ", ctx: { level: "l3_4" }, expectMoves: {} },
  { id: "g35-15-single-word-dot", text: "Water.", ctx: { level: "l3_4" }, expectMoves: {} },
  {
    id: "g35-16-basic-2-sent",
    text: "Sound travels through air. People hear music with their ears.",
    ctx: { level: "l3_4" },
    expectMoves: { transition: 0, bbs: 0, sub: 0, appos: 0 },
  },
  {
    id: "g35-17-transition-rich",
    text: "First, the drum vibrates. For example, rice bounces on the drum skin. In conclusion, vibration makes sound.",
    ctx: { level: "l3_4" },
    expectMoves: { transition: 3 },
  },
  {
    id: "g35-18-bbs-but",
    text: "Sound moves through air, but it travels even faster through solid wood.",
    ctx: { level: "l3_4" },
    expectMoves: { bbs: 1 },
  },
  {
    id: "g35-19-sub-although",
    text: "Although the room was quiet, we heard a faint echo down the hall.",
    ctx: { level: "l3_4" },
    expectMoves: { sub: 1 },
  },
  {
    id: "g35-20-appos-city",
    text: "Baltimore, a city on the bay, has a busy harbor.",
    ctx: { level: "l3_4" },
    expectMoves: { appos: 1 },
  },
  {
    id: "g35-21-multi-move-strong",
    text: "Baltimore, a port city, grew quickly. First, ships brought cargo so merchants could trade. When trains arrived, goods moved inland even faster.",
    ctx: { level: "l3_4", vocab: ["harbor", "cargo", "trade"] },
    expectMoves: { transition: 1, bbs: 1, sub: 1, appos: 1 },
  },
  {
    id: "g35-22-vocab-stemmed",
    text: "The wire transmits signals quickly. Strong vibrations travel through the metal.",
    ctx: { level: "l3_4", vocab: ["transmit", "vibrate"] },
    expectMoves: {},
  },
  {
    id: "g35-23-notes-full",
    text: "First, warm air rises over the ocean. Next, water vapor cools into clouds and falls as rain.",
    ctx: { level: "l3_4", notes: ["warm air rises ocean", "water vapor cools clouds"] },
    expectMoves: { transition: 2 },
  },
  {
    id: "g35-24-run-on",
    text: LONG_L3,
    ctx: { level: "l3_4" },
    expectMoves: { sub: 1, bbs: 1 },
  },
  {
    id: "g35-25-spanish-mixed",
    text: "When la lluvia falls, the river grows so the plantas drink.",
    ctx: { level: "l3_4" },
    expectMoves: { sub: 1, bbs: 1 },
  },
  {
    id: "g35-26-off-topic",
    text: "I went to my cousin's house on Saturday. We played soccer in the backyard until dinner.",
    ctx: {
      level: "l3_4",
      vocab: ["erosion", "sediment"],
      notes: ["rivers carry sediment downstream"],
    },
    expectMoves: { transition: 0, bbs: 0, sub: 0, appos: 0 },
  },
  {
    id: "g35-27-repeated-starters",
    text: "The river flows fast. The river carries sand. The river carves a valley.",
    ctx: { level: "l3_4" },
    expectMoves: {},
  },

  // ── 6-8 (l5_6): 13 responses ──
  {
    id: "g68-28-short-fragment",
    text: "proportional relationship on a graph",
    ctx: { level: "l5_6" },
    expectMoves: {},
  },
  {
    id: "g68-29-basic-2-sent",
    text: "The table shows a constant rate. Each output doubles when the input doubles.",
    ctx: { level: "l5_6" },
    expectMoves: { transition: 0, bbs: 0, sub: 0, appos: 0 },
  },
  {
    id: "g68-30-transition-rich",
    text: "However, the data changed in week three. In addition, the temperature dropped. Therefore, the slope flattened.",
    ctx: { level: "l5_6" },
    expectMoves: { transition: 3 },
  },
  {
    id: "g68-31-bbs-so",
    text: "The denominator was zero, so the expression was undefined.",
    ctx: { level: "l5_6" },
    expectMoves: { bbs: 1 },
  },
  {
    id: "g68-32-sub-since",
    text: "Since the two triangles share all three angle measures, they are similar.",
    ctx: { level: "l5_6" },
    expectMoves: { sub: 1 },
  },
  {
    id: "g68-33-sub-even-though",
    text: "Even though the sample was small, the pattern held across both trials.",
    ctx: { level: "l5_6" },
    expectMoves: { sub: 1 },
  },
  {
    id: "g68-34-appos-science",
    text: "Photosynthesis, a key plant process, turns sunlight into chemical energy.",
    ctx: { level: "l5_6" },
    expectMoves: { appos: 1 },
  },
  {
    id: "g68-35-appos-end",
    text: "Students tested water from the Chesapeake, a large tidal estuary.",
    ctx: { level: "l5_6" },
    expectMoves: { appos: 1 },
  },
  {
    id: "g68-36-multi-move-strong",
    text: "Photosynthesis, a vital cellular process, powers food webs. First, leaves absorb light so chloroplasts can build glucose. Although darkness pauses the reaction, plants store energy for later. In addition, oxygen returns to the air.",
    ctx: { level: "l5_6", vocab: ["photosynthesis", "chloroplast", "glucose"] },
    expectMoves: { transition: 2, bbs: 1, sub: 1, appos: 1 },
  },
  {
    id: "g68-37-vocab-aligned",
    text: "Two ratios are equivalent when they represent the same proportional relationship.",
    ctx: { level: "l5_6", vocab: ["ratio", "equivalent", "proportional"] },
    expectMoves: {},
  },
  {
    id: "g68-38-notes-partial",
    text: "The author cites census records from 1890 to prove the city expanded quickly.",
    ctx: {
      level: "l5_6",
      notes: ["census records 1890 city expanded", "railroad lines lowered shipping costs"],
    },
    expectMoves: {},
  },
  {
    id: "g68-39-run-on",
    text: LONG_L5,
    ctx: { level: "l5_6" },
    expectMoves: { sub: 1, bbs: 1 },
  },
  {
    id: "g68-40-spanish-mixed-offtopic",
    text: "Although la evidencia shows a clear pattern, los datos, an important clue, changed because the lab room cooled.",
    ctx: { level: "l5_6", vocab: ["slope", "intercept"] },
    expectMoves: { sub: 1, bbs: 1, appos: 1 },
  },
];

export const g98 = {
  id: "G-98",
  name: "writing-lab-deterministic-40",
  async run() {
    const errors = [];
    if (WRITING_FIXTURES.length !== 40)
      errors.push(`expected 40 writing fixtures, got ${WRITING_FIXTURES.length}`);
    const uniqueTexts = new Set(WRITING_FIXTURES.map((f) => f.text));
    if (uniqueTexts.size !== 40)
      errors.push(`expected 40 distinct response texts, got ${uniqueTexts.size}`);

    const levels = new Set();
    const movesDetected = { transition: 0, bbs: 0, sub: 0, appos: 0 };

    for (const fx of WRITING_FIXTURES) {
      levels.add(fx.ctx?.level || "l3_4");
      const first = analyzeParagraph(fx.text, fx.ctx);
      const second = analyzeParagraph(fx.text, fx.ctx);
      if (JSON.stringify(first) !== JSON.stringify(second)) {
        errors.push(`${fx.id}: non-deterministic analyzeParagraph output`);
      }
      for (const [move, expected] of Object.entries(fx.expectMoves || {})) {
        const actual = first.moves[move];
        if (actual !== expected) {
          errors.push(`${fx.id}: move "${move}" expected ${expected}, got ${actual}`);
        }
      }
      for (const k of Object.keys(movesDetected)) {
        if (first.moves[k] > 0) movesDetected[k] += 1;
      }
      errors.push(...scanFeedbackForScores({ ...first, movesMeta: MOVES }, fx.id));
    }

    for (const lvl of ["l1_2", "l3_4", "l5_6"]) {
      if (!levels.has(lvl)) errors.push(`missing fixtures for level ${lvl}`);
    }
    for (const [k, count] of Object.entries(movesDetected)) {
      if (count === 0) errors.push(`no fixture exercised positive move "${k}"`);
    }

    return {
      errors,
      info: { responses: WRITING_FIXTURES.length, levels: [...levels], movesDetected },
    };
  },
  async controls() {
    const synthetic = {
      nudges: [{ k: "synthetic", msg: "Score: 85/100 (WIDA Level 4)" }],
      summary: "Score: 85/100 (WIDA Level 4)",
    };
    return [
      {
        name: 'synthetic feedback containing "Score: 85/100 (WIDA Level 4)"',
        errors: scanFeedbackForScores(synthetic, "negative-control"),
      },
    ];
  },
};
