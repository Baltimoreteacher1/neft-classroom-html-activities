#!/usr/bin/env node
// One-shot repair for G3: student missions that repeat across more than 3 units.
// Rebuilds each repeated mission from the activity's OWN payload (never the answer) and edits the
// unit file in place. Missions used by 3 units or fewer are authored text and are left alone.
//   node tools/rewrite-bcpss-missions.mjs --dry   # report only
//   node tools/rewrite-bcpss-missions.mjs         # write
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../db/seeds/bcpss/v2/units");
const DRY = process.argv.includes("--dry");
const MAX_UNITS = 3;
const ids = (await import("../db/seeds/bcpss/v2/index.mjs")).STUDIO_UNIT_IDS;

const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const q = (s) => {
  const w = String(s)
    .replace(/[.!?,;:]+$/, "")
    .split(/\s+/);
  return w.length > 7 ? `“${w.slice(0, 7).join(" ")}…”` : `“${w.join(" ")}”`;
};
const words = (s) => String(s).match(/[A-Za-z][A-Za-z'-]+/g) || [];
const lc1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const longWords = (strings, n) => {
  const seen = new Map();
  for (const w of strings.flatMap(words))
    if (w.length >= 6) seen.set(w.toLowerCase(), (seen.get(w.toLowerCase()) || 0) + 1);
  return [...seen.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length || (a[0] < b[0] ? -1 : 1))
    .slice(0, n)
    .map(([w]) => w);
};
const list = (xs) =>
  xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

const MAKE = {
  clue_game: (p) =>
    `Flip one clue at a time to guess all ${p.cards.length} words, starting with ${q(p.cards[0].clues[0])}.`,
  sentence_combine: (p) => {
    const cs = [...new Set(p.items.map((i) => i.connector))].slice(0, 3).map((c) => q(c));
    return `Use ${list(cs)} to join ${p.items.length} pairs of short sentences, starting with ${q(p.items[0].sentences[0])}.`;
  },
  cloze: (p) => {
    const start = words(p.text.replace(/\{\d+\}/g, "").split(/[.!?]/)[0])
      .slice(0, 5)
      .join(" ");
    return `Finish the story that begins ${q(`${start}…`)} by choosing the right word for each of the ${p.answers.length} gaps.`;
  },
  error_analysis: (p) =>
    `Find the mistake in each of ${p.items.length} sentences, starting with ${q(p.items[0].wrong)}, and pick the best fix.`,
  unscramble: (p) => {
    const w = longWords(
      p.items.flatMap((i) => i.parts),
      2,
    );
    return w.length === 2
      ? `Drag the pieces into order to build ${p.items.length} sentences that use ${q(w[0])} and ${q(w[1])}.`
      : `Drag the pieces into order to build ${p.items.length} sentences, starting with one that ends ${q(p.items[0].parts.at(-1))}.`;
  },
  match: (p) => {
    const l = p.pairs.map((x) => x.l);
    const what = /picture|image|clue/i.test(p.right_label) ? "picture clues" : "meanings";
    return `Match ${p.pairs.length} words, from ${q(l[0])} to ${q(l[l.length - 1])}, to their ${what}.`;
  },
  quiz: (p) =>
    `Answer ${p.items.length} questions, starting with ${q(p.items[0].q)} — pick the best answer and say why.`,
  word_sort: (p) =>
    `Sort ${p.items.length} words into ${list(p.categories.map((c) => q(c.name)))}, then defend one choice to your partner.`,
  dictogloss: (p) =>
    `Listen to the story twice, then rebuild it with your partner using words like ${q(p.key_words[0])} and ${q(p.key_words[1])}.`,
  talk_cards: (p) =>
    `Take turns drawing a card, starting with the question ${q(p.cards[0].prompt)}, and push each other’s thinking.`,
  info_gap: (p) =>
    `Ask your partner questions to find ${q(p.a.needs[0])} and ${q(p.b.needs[0])} — no peeking!`,
};

const units = [];
const count = new Map();
for (const id of ids) {
  const u = (await import(pathToFileURL(path.join(dir, `${id}.mjs`)).href)).default;
  units.push([id, u]);
  for (const k of new Set(u.activities.map((a) => `${a.kind}|${norm(a.mission)}`)))
    count.set(k, (count.get(k) || 0) + 1);
}

const used = new Map();
let changed = 0;
const skipped = [];
for (const [id, u] of units) {
  const file = path.join(dir, `${id}.mjs`);
  let src = readFileSync(file, "utf8");
  let touched = false;
  for (const a of u.activities) {
    const tooLong = String(a.mission).split(/\s+/).length > 26;
    if (!tooLong && (count.get(`${a.kind}|${norm(a.mission)}`) || 0) <= MAX_UNITS) continue;
    let next;
    try {
      next = MAKE[a.kind]?.(a.payload);
    } catch {
      next = null;
    }
    if (!next) {
      skipped.push(`${id} ${a.kind}`);
      continue;
    }
    const key = norm(next);
    used.set(key, (used.get(key) || 0) + 1);
    const oldLit = `mission: ${JSON.stringify(a.mission)}`;
    const at = src.indexOf(oldLit);
    if (at < 0) {
      skipped.push(`${id} ${a.kind} (literal not found)`);
      continue;
    }
    src = src.slice(0, at) + `mission: ${JSON.stringify(next)}` + src.slice(at + oldLit.length);
    changed += 1;
    touched = true;
  }
  if (touched && !DRY) writeFileSync(file, src);
}
console.log(`${DRY ? "would rewrite" : "rewrote"} ${changed} missions; skipped ${skipped.length}`);
if (skipped.length) console.log(skipped.slice(0, 20).join("\n"));
const dup = [...used.entries()].filter(([, n]) => n > MAX_UNITS);
console.log(`new missions reused > ${MAX_UNITS}x: ${dup.length}`);
