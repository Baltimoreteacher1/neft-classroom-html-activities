#!/usr/bin/env node
/**
 * vocab-visual-quality.test.mjs — the vocabulary tiles are one system, and the
 * frame around them matches the art inside it.
 *
 * WHY. The small-group vocabulary cards looked poor, and the assets were not the
 * reason: all 379 unique terms across the fleet resolve to a term-specific SVG
 * that exists on disk, with zero generic placeholders. The defect was the FRAME.
 * 262 of the 270 tiles are 4:3 and 267 painted the same cream plate, while
 * `.sg-vcard-picture` forced `aspect-ratio: 16/9` and tinted itself pale blue —
 * so `object-fit: contain` letterboxed every card with about 41px of the wrong
 * colour down each side, and the SVG's own rounded cream plate floated inside a
 * blue-grey box inside a white card. Three surfaces, none matching, on all 204
 * variants.
 *
 * These checks are the ones a browser screenshot cannot make durable: that the
 * art keeps ONE plate and ONE ratio, that every term still resolves to a real
 * illustration rather than a category tile, and that the frame is still declared
 * to match. Whether a picture teaches its word is a reading task and is not
 * claimed here.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hasRealVocabImage, resolveVocabImage } from "../engine/core/vocab-images.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ART = join(ROOT, "assets/vocab-images");
const HOUSE_PLATE = "#f7f4ec";

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
};

const tiles = readdirSync(ART).filter((f) => f.endsWith(".svg"));
const head = (f) => readFileSync(join(ART, f), "utf8").slice(0, 900);

t("there is art to check at all", () => {
  assert.ok(tiles.length > 200, `only ${tiles.length} tiles found — the reader is looking wrong`);
});

t("every tile paints the house plate", () => {
  // A tile with its own background colour reads as a pale rectangle floating
  // inside the card's cream one. Three did; they are the seam a teacher sees.
  const wrong = [];
  for (const f of tiles) {
    const m = head(f).match(/<rect[^>]*fill="(#[0-9a-fA-F]{3,6})"/);
    const plate = (m?.[1] || "none").toLowerCase();
    if (plate !== HOUSE_PLATE) wrong.push(`${f} (${plate})`);
  }
  assert.deepEqual(wrong, [], `these tiles do not paint ${HOUSE_PLATE}`);
});

t("every tile declares a viewBox, and the house ratio dominates", () => {
  const ratios = new Map();
  for (const f of tiles) {
    const m = head(f).match(/viewBox="([\d.\s-]+)"/);
    assert.ok(m, `${f} has no viewBox, so it cannot be laid out predictably`);
    const [, , w, h] = m[1].trim().split(/\s+/).map(Number);
    const r = Math.round((w / h) * 1000) / 1000;
    ratios.set(r, (ratios.get(r) || 0) + 1);
  }
  const house = ratios.get(1.333) || 0;
  assert.ok(
    house / tiles.length > 0.9,
    `only ${house}/${tiles.length} tiles are 4:3 — the picture box's aspect-ratio no longer ` +
      `matches the art, which is what letterboxed every card before`,
  );
});

t("the picture box matches the art, and does not crop it", () => {
  const css = readFileSync(join(ROOT, "assets/small-group-designsystem.css"), "utf8");
  const block = css.slice(css.indexOf(".sg-vcard-picture {"), css.indexOf(".sg-vterm"));
  assert.match(block, /aspect-ratio:\s*4\s*\/\s*3/, "the picture box no longer matches the art");
  assert.ok(!/16\s*\/\s*9/.test(block), "the 16/9 box is back — every card will letterbox again");
  // `cover` would crop a labelled diagram's labels off the edge.
  const shell = readFileSync(join(ROOT, "engine/core/small-group-ui.js"), "utf8");
  assert.match(shell, /\.sg-vcard-picture img\{[^}]*object-fit:contain/, "contain was replaced");
  assert.match(shell, /\.sg-vcard-picture\{[^}]*aspect-ratio:4\/3/, "the shell box drifted");
  assert.match(shell, /--sg-plate:#f7f4ec/, "the plate token is gone from the shell");
});

t("every vocabulary term in the fleet resolves to real art that exists", () => {
  const lessons = join(ROOT, "lessons");
  const seen = new Set();
  const placeholder = [];
  const missing = [];
  for (const dir of readdirSync(lessons)) {
    const file = join(lessons, dir, "config.json");
    if (!existsSync(file)) continue;
    let config;
    try {
      config = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      continue;
    }
    for (const entry of config.vocabulary || []) {
      const term = entry?.term;
      if (!term || seen.has(term)) continue;
      seen.add(term);
      if (!hasRealVocabImage(term, entry.image)) placeholder.push(`${dir}: ${term}`);
      const src = resolveVocabImage(term, entry.image);
      if (!existsSync(join(ROOT, src.replace(/^\//, ""))))
        missing.push(`${dir}: ${term} -> ${src}`);
    }
  }
  assert.ok(seen.size > 300, `only ${seen.size} terms swept — the reader has stopped matching`);
  assert.deepEqual(missing, [], "a vocabulary card points at art that is not on disk");
  assert.deepEqual(
    placeholder,
    [],
    "these terms fall through to a generic category tile, which reads as an unrelated picture",
  );
});

t("alt text describes the term rather than repeating it", () => {
  const src = readFileSync(join(ROOT, "engine/core/vocab-images.js"), "utf8");
  assert.match(
    src,
    /Illustration of \$\{t\}: \$\{d\}/,
    "alt text no longer carries the definition",
  );
});

console.log(`vocab visual quality: ${passed} assertions passed over ${tiles.length} tiles.`);
