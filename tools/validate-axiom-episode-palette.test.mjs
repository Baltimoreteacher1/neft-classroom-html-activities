import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseColor, toHsl } from "./lib/color-math.mjs";
import { findForbiddenLiterals } from "./validate-palette.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AXIOM = join(ROOT, "graphic-novels", "axiom-city");
const EPISODES = join(AXIOM, "episodes");
const UNIT2 = join(ROOT, "graphic-novels", "unit2");
const BUILT_EPISODES = [
  "axiom-city-u1-e1-benchmark-and-brass.html",
  "axiom-city-u1-e2-sequences-and-cubes.html",
  "axiom-city-u7-e1-lights-out.html",
  "axiom-city-u7-e2-signal-in-the-snow.html",
  "axiom-city-u7-e3-the-grid-map.html",
  "axiom-city-u8-e1-the-antechamber.html",
  "axiom-city-u8-e2-the-gear-locks.html",
  "axiom-city-u8-e3-the-fog-gallery.html",
  "axiom-city-u9-e1-lines-that-talk.html",
  "axiom-city-u9-e2-the-rule-in-the-table.html",
  "axiom-city-u10-e1-festival-to-night-market.html",
  "axiom-city-u10-e2-brightside-to-boundless.html",
];

function walkHtml(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walkHtml(path, files);
    else if (path.endsWith(".html")) files.push(path);
  }
  return files;
}

function forbiddenRangeFindings(source) {
  const clean = source
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[\s;{}])\/\/[^\n]*/g, " ");
  const findings = [];
  for (const match of clean.matchAll(
    /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\([^)]*\)/g,
  )) {
    const color = parseColor(match[0]);
    if (!color) continue;
    const { h, s, l } = toHsl(color);
    if (s > 0.15 && l > 0.03 && l < 0.97 && h >= 235 && h <= 335) {
      findings.push({ color: match[0], hue: h });
    }
  }
  return findings;
}

// Negative controls prove the expanded hue threshold catches a value the
// existing 255° threshold would miss, while allowing the locked EWL palette.
assert.equal(forbiddenRangeFindings(".x{color:#36385f}").length, 1, "235°–255° negative control");
assert.equal(
  findForbiddenLiterals(".x{color:#7c3aed}").length,
  1,
  "existing purple detector negative control",
);
assert.equal(
  forbiddenRangeFindings(".x{color:#17324D;background:#1FA6A2;border-color:#F2C15B}").length,
  0,
  "locked EWL palette control",
);

const sources = readdirSync(AXIOM)
  .filter((name) => /^axiom-city-vol-.*\.html$/.test(name))
  .map((name) => join(AXIOM, name));
assert.equal(sources.length, 10, `expected all 10 canonical volumes, found ${sources.length}`);

const availableOutputs = new Set(walkHtml(EPISODES));
const missing = BUILT_EPISODES.filter((name) => !availableOutputs.has(join(EPISODES, name)));
assert.deepEqual(
  missing,
  [],
  `active builder outputs missing; regenerate with node tools/build-axiom-episodes.mjs`,
);
for (const name of BUILT_EPISODES) {
  const output = readFileSync(join(EPISODES, name), "utf8");
  const unit = Number(/^axiom-city-u(\d+)-/.exec(name)?.[1]);
  const volume = sources.find((file) => file.includes(`vol-${String(unit).padStart(2, "0")}-`));
  assert.ok(volume, `${name} has a canonical volume source`);
  const source = readFileSync(volume, "utf8");
  for (const marker of [
    "ac-holopad-injected:begin",
    "nt-gn-teacher-gate:begin",
    "nsr-injected:begin",
  ]) {
    assert.equal(
      output.includes(marker),
      source.includes(marker),
      `${name} preserves source layer ${marker}`,
    );
  }
}

const episodeFiles = walkHtml(EPISODES);
assert.equal(
  episodeFiles.length,
  29,
  `expected 29 shipped Axiom episode pages, found ${episodeFiles.length}`,
);
const unit2Aliases = readdirSync(UNIT2)
  .filter((name) => /^axiom-city-u2-e\d+-.+\.html$/.test(name))
  .map((name) => join(UNIT2, name));
assert.equal(
  unit2Aliases.length,
  4,
  `expected 4 Unit 2 route aliases, found ${unit2Aliases.length}`,
);
const files = [...sources, ...episodeFiles, ...unit2Aliases];
const failures = [];
for (const file of files) {
  const source = readFileSync(file, "utf8");
  const wide = forbiddenRangeFindings(source);
  const namedOrStandard = findForbiddenLiterals(source);
  if (wide.length || namedOrStandard.length) {
    failures.push(
      `${file.replace(`${ROOT}/`, "")}: ${[
        ...wide.map(({ color, hue }) => `${color} (${hue.toFixed(1)}°)`),
        ...namedOrStandard.map(({ text }) => text),
      ].join(", ")}`,
    );
  }
}

assert.deepEqual(failures, [], `forbidden Axiom City paint values:\n${failures.join("\n")}`);
console.log(
  `validate-axiom-episode-palette: ${sources.length} volumes + ${episodeFiles.length} episodes + ${unit2Aliases.length} Unit 2 aliases pass`,
);
