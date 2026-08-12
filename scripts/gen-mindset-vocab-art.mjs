#!/usr/bin/env node
// Draw the Math Is... unit's process-vocabulary tiles.
//
//   node scripts/gen-mindset-vocab-art.mjs
//
// Units 1 and 10 teach mathematical DISPOSITION, so their vocabulary is words
// like "persevere" and "counterexample" rather than "trapezoid". Those terms
// were resolving to cat-number.svg — a literal "#" — which vocab-bank-fresh
// rejects, on the reasoning that a picture meaning nothing is worse than none
// because a student trusts the picture.
//
// Each tile below draws the IDEA, not a decoration: "counterexample" is a row
// of matching shapes with one that breaks the rule; "persevere" is a path that
// dips before it climbs. Same 160x120 frame, palette and titled-<svg> shape as
// the rest of assets/vocab-images/.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "assets/vocab-images");

const INK = "#1f2a37";
const TEAL = "#1fa6a2";
const CORAL = "#e4572e";
const SAND = "#f7f4ec";
const MUTE = "#9bb0c3";

const frame = (title, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" role="img" aria-labelledby="t">
<title id="t">${title}</title>
<rect x="0" y="0" width="160" height="120" rx="10" fill="${SAND}"/>
${body}
</svg>
`;

const speech = (x, y, w, h, fill) =>
  `<path d="M${x} ${y} h${w} a6 6 0 0 1 6 6 v${h} a6 6 0 0 1 -6 6 h-${w - 10} l-8 8 v-8 a6 6 0 0 1 -6 -6 v-${h} a6 6 0 0 1 6 -6 z" fill="${fill}"/>`;
const person = (cx, cy, fill) =>
  `<circle cx="${cx}" cy="${cy}" r="7" fill="${fill}"/><path d="M${cx - 12} ${cy + 26} a12 14 0 0 1 24 0 z" fill="${fill}"/>`;
const line = (d, stroke = INK, w = 3) =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const tick = (x, y) => line(`M${x} ${y} l6 7 l12 -16`, TEAL, 4);
const cross = (x, y) => line(`M${x} ${y} l14 14 M${x + 14} ${y} l-14 14`, CORAL, 4);

/* A picture of an abstract idea is only as good as the example inside it. The
   first pass drew "persevere" as a bare squiggle and "quantity" borrowed the
   VARIABLE tile — an orange x captioned "stands for a number" — so a student
   studying the word wall read a picture of a different word. These helpers put a
   real, small, readable example inside the frame the way the ratio-table tile
   does, which is what makes those tiles legible at word-wall size. */
const label = (x, y, text, fill = INK, size = 13) =>
  `<text x="${x}" y="${y}" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="${size}" font-weight="600" fill="${fill}">${text}</text>`;
/* The frame is 160 units wide and these captions are the whole point of the
   redraw, so a caption that overflows is worse than none — the first pass
   shipped "the number AND what it counts" clipped at BOTH edges. system-ui runs
   about 0.55em per character at these weights, so this refuses anything that
   would not fit rather than drawing it off-canvas. */
const FRAME = 160;
const SAFE = 150;
const mid = (y, text, fill = INK, size = 13) => {
  const width = String(text).length * size * 0.55;
  if (width > SAFE)
    throw new Error(
      `caption too wide for the tile (${Math.round(width)} > ${SAFE}): "${text}" at ${size}px`,
    );
  return `<text x="${FRAME / 2}" y="${y}" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="${size}" font-weight="600" fill="${fill}">${text}</text>`;
};
const chip = (x, y, w, text, fill = TEAL) =>
  `<rect x="${x}" y="${y}" width="${w}" height="22" rx="6" fill="${fill}"/><text x="${x + w / 2}" y="${y + 16}" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="13" font-weight="700" fill="#fff">${text}</text>`;
const _arrow = (d, stroke = MUTE) => `${line(d, stroke, 3)}<path d="M0 0" fill="none"/>`;
/** Two-column table with a header row — the shape a student actually meets. */
const table = (x, y, rows, headers) => {
  const cw = 44;
  const rh = 18;
  const cells = rows
    .map((row, r) =>
      row
        .map(
          (cell, c) =>
            `<text x="${x + c * cw + cw / 2}" y="${y + (r + 1) * rh + 30}" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="12" fill="${INK}">${cell}</text>`,
        )
        .join(""),
    )
    .join("");
  const head = headers
    .map(
      (h, c) =>
        `<text x="${x + c * cw + cw / 2}" y="${y + 30}" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="12" font-weight="700" fill="${TEAL}">${h}</text>`,
    )
    .join("");
  const grid = `<rect x="${x}" y="${y + 16}" width="${cw * headers.length}" height="${rh * (rows.length + 1)}" rx="5" fill="#fff" stroke="${MUTE}" stroke-width="2"/><line x1="${x}" y1="${y + 16 + rh}" x2="${x + cw * headers.length}" y2="${y + 16 + rh}" stroke="${MUTE}" stroke-width="2"/><line x1="${x + cw}" y1="${y + 16}" x2="${x + cw}" y2="${y + 16 + rh * (rows.length + 1)}" stroke="${MUTE}" stroke-width="2"/>`;
  return grid + head + cells;
};

const TILES = {
  // ── talking and reasoning ────────────────────────────────────────────────
  argument: [
    "Argument: a claim backed by reasons",
    `${speech(14, 26, 52, 26, TEAL)}${speech(84, 52, 52, 26, MUTE)}${line("M74 44 h14", INK, 3)}${tick(20, 92)}${mid(112, "claim + reasons", MUTE, 11)}`,
  ],
  justify: [
    "Justify: give the reason your answer works",
    `${speech(16, 24, 60, 28, TEAL)}<text x="30" y="48" font-family="system-ui" font-size="17" fill="#fff">why?</text>${line("M40 74 h80", MUTE, 3)}${tick(40, 88)}`,
  ],
  critique: [
    "Critique: judge the reasoning, not the person",
    `${speech(12, 24, 54, 26, TEAL)}${speech(86, 24, 54, 26, MUTE)}${tick(24, 84)}${cross(104, 82)}${mid(110, "idea, not the person", MUTE, 11)}`,
  ],
  counterexample: [
    "Counterexample: one case that breaks the rule",
    `<circle cx="28" cy="60" r="12" fill="${TEAL}"/><circle cx="64" cy="60" r="12" fill="${TEAL}"/><rect x="88" y="48" width="24" height="24" rx="3" fill="${CORAL}"/><circle cx="136" cy="60" r="12" fill="${TEAL}"/>${cross(92, 84)}${mid(108, "one case breaks it", MUTE, 11)}`,
  ],
  reasonable: [
    "Reasonable: close to what you expected",
    `${line("M16 84 h128", MUTE, 3)}${line("M56 78 v12", MUTE, 3)}${line("M104 78 v12", MUTE, 3)}<circle cx="80" cy="84" r="8" fill="${TEAL}"/><text x="52" y="38" font-family="system-ui" font-size="15" fill="${INK}">about right</text>`,
  ],
  conjecture: [
    "Conjecture: a claim you have not proved yet",
    `${speech(18, 26, 60, 28, MUTE)}<text x="36" y="50" font-family="system-ui" font-size="18" fill="#fff">?</text>${line("M30 76 h100", MUTE, 3)}${mid(96, "I think it is true —", MUTE, 11)}${mid(110, "not proved yet", MUTE, 11)}`,
  ],

  // ── the work of doing maths ──────────────────────────────────────────────
  persevere: [
    "Persevere: keep going when it gets hard",
    `${line("M14 96 C40 96 44 44 72 44 C96 44 96 74 118 74 C132 74 138 40 146 26", INK, 4)}<circle cx="146" cy="26" r="7" fill="${TEAL}"/>${mid(112, "stuck → try again", MUTE, 11)}`,
  ],
  strategy: [
    "Strategy: the plan you choose for a problem",
    `${line("M20 96 L52 60 L92 76 L136 30", TEAL, 4)}<circle cx="20" cy="96" r="5" fill="${INK}"/><circle cx="52" cy="60" r="5" fill="${INK}"/><circle cx="92" cy="76" r="5" fill="${INK}"/><circle cx="136" cy="30" r="7" fill="${CORAL}"/>${mid(112, "the plan you pick", MUTE, 11)}`,
  ],
  "make-sense-of-a-problem": [
    "Make sense of a problem: understand before you solve",
    `<rect x="22" y="26" width="70" height="66" rx="6" fill="#fff" stroke="${MUTE}" stroke-width="3"/>${line("M34 44 h46 M34 58 h46 M34 72 h30", MUTE, 3)}<circle cx="112" cy="58" r="20" fill="none" stroke="${TEAL}" stroke-width="4"/>${line("M126 72 l14 14", TEAL, 5)}${mid(112, "what do I know?", MUTE, 11)}`,
  ],
  organize: [
    "Organize: put the information in order",
    `<rect x="18" y="30" width="34" height="60" rx="4" fill="${TEAL}"/><rect x="62" y="46" width="34" height="44" rx="4" fill="${MUTE}"/><rect x="106" y="20" width="34" height="70" rx="4" fill="${CORAL}"/>`,
  ],
  tool: [
    "Tool: something you choose to help you solve",
    `<rect x="20" y="52" width="56" height="20" rx="4" fill="${MUTE}"/>${line("M28 52 v20 M40 52 v20 M52 52 v20 M64 52 v20", "#fff", 2)}<circle cx="112" cy="62" r="22" fill="none" stroke="${TEAL}" stroke-width="4"/>${line("M112 48 v14 h10", TEAL, 3)}${mid(106, "ruler · table · model", MUTE, 11)}`,
  ],
  ingenuity: [
    "Ingenuity: inventing a clever solution",
    `<circle cx="80" cy="48" r="22" fill="${TEAL}"/>${line("M72 70 h16 M74 78 h12", INK, 3)}${line("M80 16 v-0.5 M52 26 l-8 -8 M108 26 l8 -8 M40 48 h-10 M120 48 h10", CORAL, 3)}${line("M70 44 l8 8 l14 -16", "#fff", 4)}`,
  ],
  puzzle: [
    "Puzzle: a problem you work at for the fun of it",
    `<path d="M24 30 h44 v16 a8 8 0 0 0 16 0 v-16 h44 v44 h-16 a8 8 0 0 1 0 16 h16 v0 h-44 v-16 a8 8 0 0 0 -16 0 v16 h-44 z" fill="${TEAL}"/>`,
  ],
  inventory: [
    "Inventory: a list of what you already have",
    `<rect x="30" y="20" width="100" height="80" rx="6" fill="#fff" stroke="${MUTE}" stroke-width="3"/>${tick(44, 36)}${tick(44, 58)}${tick(44, 80)}${line("M74 42 h44 M74 64 h44 M74 86 h30", MUTE, 3)}`,
  ],

  // ── identity and community ───────────────────────────────────────────────
  "doer-of-math": [
    "Doer of math: someone who does mathematics",
    `${person(80, 40, TEAL)}${line("M40 96 h80", MUTE, 3)}<text x="58" y="84" font-family="system-ui" font-size="20" fill="${INK}">+ −</text>${mid(108, "that is everyone", MUTE, 11)}`,
  ],
  strength: [
    "Strength: something you can already do well",
    `${line("M80 96 v-52", INK, 4)}${line("M80 44 l-22 18 M80 44 l22 18", INK, 4)}<circle cx="80" cy="32" r="12" fill="${TEAL}"/>${tick(70, 26)}${mid(112, "something you teach", MUTE, 11)}`,
  ],
  confidence: [
    "Confidence: trusting your own reasoning",
    `${person(80, 34, TEAL)}${line("M50 92 h60", MUTE, 3)}${line("M56 70 l-14 -14 M104 70 l14 -14", TEAL, 4)}`,
  ],
  community: [
    "Community: the people learning together",
    `${person(44, 40, TEAL)}${person(80, 34, CORAL)}${person(116, 40, MUTE)}`,
  ],
  "community-agreement": [
    "Community agreement: how we agree to work together",
    `<rect x="26" y="22" width="108" height="76" rx="6" fill="#fff" stroke="${MUTE}" stroke-width="3"/>${line("M40 44 h80 M40 60 h80 M40 76 h50", MUTE, 3)}${tick(96, 74)}${mid(112, "how we work together", MUTE, 10)}`,
  ],
  profession: [
    "Profession: a job that uses mathematics",
    `${person(52, 40, MUTE)}<rect x="86" y="46" width="52" height="38" rx="5" fill="${TEAL}"/><rect x="102" y="36" width="20" height="12" rx="3" fill="${TEAL}"/>${line("M96 64 h32", "#fff", 3)}`,
  ],
  "math-biography": [
    "Math biography: your own story with mathematics",
    `<rect x="34" y="20" width="92" height="80" rx="6" fill="#fff" stroke="${MUTE}" stroke-width="3"/>${person(60, 44, TEAL)}${line("M86 40 h30 M86 54 h30 M52 84 h64", MUTE, 3)}`,
  ],
  "math-story": [
    "Math story: how your thinking changed over time",
    `${line("M20 82 C50 82 46 46 78 46 C108 46 104 26 140 26", TEAL, 4)}<circle cx="20" cy="82" r="6" fill="${MUTE}"/><circle cx="140" cy="26" r="7" fill="${CORAL}"/>${label(14, 106, "then", MUTE, 12)}${label(120, 106, "now", CORAL, 12)}`,
  ],

  /* ── Unit 1 terms that used to borrow another word's picture ────────────
     Each of these resolved through the synonym table to a tile drawn for a
     DIFFERENT concept: `quantity` showed the variable tile (an orange x
     captioned "stands for a number"), `relationship` and `table of values`
     both showed the juice/water ratio table, and `pattern`, `pattern rule`
     and `generalization` shared one picture between all three, so a third of
     lesson 1-5's word wall was the same image. */
  quantity: [
    "Quantity: a number with a meaning attached",
    `${chip(20, 34, 54, "540")}${label(80, 51, "meters", INK, 14)}${line("M20 70 h120", MUTE, 2)}${mid(92, "number + what it counts", MUTE, 10)}`,
  ],
  relationship: [
    "Relationship: how two quantities move together",
    `${chip(14, 30, 46, "hours")}${chip(100, 30, 46, "miles", CORAL)}${line("M62 41 h34", MUTE, 3)}${line("M88 35 l8 6 l-8 6", MUTE, 3)}${mid(76, "1 hour → 48 miles", INK, 13)}${mid(96, "2 hours → 96 miles", INK, 13)}`,
  ],
  representation: [
    "Representation: one situation shown several ways",
    `<rect x="12" y="30" width="40" height="18" rx="4" fill="${TEAL}"/><rect x="12" y="52" width="26" height="18" rx="4" fill="${MUTE}"/>${table(60, 14, [["1", "4"]], ["n", "4n"])}${mid(104, "12 = 3 × 4", INK, 14)}`,
  ],
  "round-trip": [
    "Round trip: out to a place and back again",
    `<circle cx="26" cy="56" r="8" fill="${TEAL}"/><circle cx="134" cy="56" r="8" fill="${CORAL}"/>${line("M34 46 C70 26 96 26 126 46", INK, 3)}${line("M118 40 l9 6 l-9 6", INK, 3)}${line("M126 66 C96 86 70 86 34 66", INK, 3)}${line("M42 60 l-9 6 l9 6", INK, 3)}${mid(96, "5 mi out + 5 mi back", INK, 11)}${mid(110, "= 10 mi in all", MUTE, 11)}`,
  ],
  "pattern-rule": [
    "Pattern rule: the step that gets you to the next term",
    `${mid(44, "2 · 4 · 6 · 8", INK, 18)}${line("M34 54 C46 68 58 68 70 54", MUTE, 3)}${line("M78 54 C90 68 102 68 114 54", MUTE, 3)}${chip(56, 76, 48, "+ 2")}${mid(112, "every time", MUTE, 11)}`,
  ],
  generalization: [
    "Generalization: one rule that covers every case",
    `${mid(32, "1→3   2→5   3→7", INK, 13)}${line("M20 44 h120", MUTE, 2)}${chip(38, 56, 84, "n → 2n + 1")}${mid(100, "true for ANY n", CORAL, 12)}`,
  ],
  "table-of-values": [
    "Table of values: each step of the pattern, in order",
    `${table(
      36,
      12,
      [
        ["1", "1"],
        ["2", "3"],
        ["3", "7"],
      ],
      ["discs", "steps"],
    )}${mid(112, "one row per step", MUTE, 11)}`,
  ],
  reasonableness: [
    "Reasonableness: does this answer make sense?",
    `${mid(32, "5/6 of 540", INK, 14)}${line("M20 62 h120", MUTE, 3)}${line("M56 56 v12", MUTE, 3)}${line("M104 56 v12", MUTE, 3)}<circle cx="72" cy="62" r="8" fill="${TEAL}"/>${label(24, 84, "450 ✓", TEAL, 13)}${label(96, 84, "650 ✗", CORAL, 13)}${mid(104, "less than 540", MUTE, 11)}`,
  ],
};

let written = 0;
for (const [slug, [title, body]] of Object.entries(TILES)) {
  writeFileSync(join(OUT, `${slug}.svg`), frame(title, body));
  written += 1;
}
console.log(`wrote ${written} mindset vocabulary tiles to assets/vocab-images/`);
