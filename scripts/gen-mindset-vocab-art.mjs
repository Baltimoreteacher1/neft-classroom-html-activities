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

const TILES = {
  // ── talking and reasoning ────────────────────────────────────────────────
  argument: [
    "Argument: a claim backed by reasons",
    `${speech(14, 26, 52, 26, TEAL)}${speech(84, 52, 52, 26, MUTE)}${line("M74 44 h14", INK, 3)}${tick(20, 92)}`,
  ],
  justify: [
    "Justify: give the reason your answer works",
    `${speech(16, 24, 60, 28, TEAL)}<text x="30" y="48" font-family="system-ui" font-size="17" fill="#fff">why?</text>${line("M40 74 h80", MUTE, 3)}${tick(40, 88)}`,
  ],
  critique: [
    "Critique: judge the reasoning, not the person",
    `${speech(12, 24, 54, 26, TEAL)}${speech(86, 24, 54, 26, MUTE)}${tick(24, 84)}${cross(104, 82)}`,
  ],
  counterexample: [
    "Counterexample: one case that breaks the rule",
    `<circle cx="28" cy="60" r="12" fill="${TEAL}"/><circle cx="64" cy="60" r="12" fill="${TEAL}"/><rect x="88" y="48" width="24" height="24" rx="3" fill="${CORAL}"/><circle cx="136" cy="60" r="12" fill="${TEAL}"/>${cross(92, 84)}`,
  ],
  reasonable: [
    "Reasonable: close to what you expected",
    `${line("M16 84 h128", MUTE, 3)}${line("M56 78 v12", MUTE, 3)}${line("M104 78 v12", MUTE, 3)}<circle cx="80" cy="84" r="8" fill="${TEAL}"/><text x="52" y="38" font-family="system-ui" font-size="15" fill="${INK}">about right</text>`,
  ],
  conjecture: [
    "Conjecture: a claim you have not proved yet",
    `${speech(18, 26, 60, 28, MUTE)}<text x="36" y="50" font-family="system-ui" font-size="18" fill="#fff">?</text>${line("M30 82 h100", MUTE, 3)}`,
  ],

  // ── the work of doing maths ──────────────────────────────────────────────
  persevere: [
    "Persevere: keep going when it gets hard",
    `${line("M14 96 C40 96 44 44 72 44 C96 44 96 74 118 74 C132 74 138 40 146 26", INK, 4)}<circle cx="146" cy="26" r="7" fill="${TEAL}"/>`,
  ],
  strategy: [
    "Strategy: the plan you choose for a problem",
    `${line("M20 96 L52 60 L92 76 L136 30", TEAL, 4)}<circle cx="20" cy="96" r="5" fill="${INK}"/><circle cx="52" cy="60" r="5" fill="${INK}"/><circle cx="92" cy="76" r="5" fill="${INK}"/><circle cx="136" cy="30" r="7" fill="${CORAL}"/>`,
  ],
  "make-sense-of-a-problem": [
    "Make sense of a problem: understand before you solve",
    `<rect x="22" y="26" width="70" height="66" rx="6" fill="#fff" stroke="${MUTE}" stroke-width="3"/>${line("M34 44 h46 M34 58 h46 M34 72 h30", MUTE, 3)}<circle cx="112" cy="58" r="20" fill="none" stroke="${TEAL}" stroke-width="4"/>${line("M126 72 l14 14", TEAL, 5)}`,
  ],
  organize: [
    "Organize: put the information in order",
    `<rect x="18" y="30" width="34" height="60" rx="4" fill="${TEAL}"/><rect x="62" y="46" width="34" height="44" rx="4" fill="${MUTE}"/><rect x="106" y="20" width="34" height="70" rx="4" fill="${CORAL}"/>`,
  ],
  tool: [
    "Tool: something you choose to help you solve",
    `<rect x="20" y="52" width="56" height="20" rx="4" fill="${MUTE}"/>${line("M28 52 v20 M40 52 v20 M52 52 v20 M64 52 v20", "#fff", 2)}<circle cx="112" cy="62" r="22" fill="none" stroke="${TEAL}" stroke-width="4"/>${line("M112 48 v14 h10", TEAL, 3)}`,
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
    `${person(80, 40, TEAL)}${line("M40 96 h80", MUTE, 3)}<text x="58" y="88" font-family="system-ui" font-size="20" fill="${INK}">+ −</text>`,
  ],
  strength: [
    "Strength: something you can already do well",
    `${line("M80 96 v-52", INK, 4)}${line("M80 44 l-22 18 M80 44 l22 18", INK, 4)}<circle cx="80" cy="32" r="12" fill="${TEAL}"/>${tick(70, 26)}`,
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
    `<rect x="26" y="22" width="108" height="76" rx="6" fill="#fff" stroke="${MUTE}" stroke-width="3"/>${line("M40 44 h80 M40 60 h80 M40 76 h50", MUTE, 3)}${tick(96, 74)}`,
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
    `${line("M20 88 C50 88 46 52 78 52 C108 52 104 30 140 30", TEAL, 4)}<circle cx="20" cy="88" r="6" fill="${MUTE}"/><circle cx="140" cy="30" r="7" fill="${CORAL}"/>`,
  ],
};

let written = 0;
for (const [slug, [title, body]] of Object.entries(TILES)) {
  writeFileSync(join(OUT, `${slug}.svg`), frame(title, body));
  written += 1;
}
console.log(`wrote ${written} mindset vocabulary tiles to assets/vocab-images/`);
