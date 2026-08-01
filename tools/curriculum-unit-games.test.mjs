// Every unit in the Curriculum Hub offers a "🎮 Unit Game". The game FILES are
// not filed under the folder that matches their curriculum unit — Equation
// Escape (curriculum Unit 7) lives in math/unit-8/games/, Coordinate Quest
// (Unit 9) lives in math/unit-7/games/ — so anyone who wires these links by
// folder number silently hands Statistics students an equations dungeon game
// and Unit 7 a coordinate-plane game. That is exactly what shipped in
// 78063af11, and nothing caught it: every link resolved, so audit:links was
// happy and the pages looked fine.
//
// This gate checks the thing that actually matters — that each unit's game
// teaches that unit's STANDARDS — plus the summary-bar shape that the same
// commit destroyed on three units.

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = new URL("../", import.meta.url);
const read = (rel) => readFileSync(new URL(rel, root), "utf8");
const STANDARD_RE = /6\.(?:NOS|AT|GR|DS)\.[A-Z]?\.?\d+[a-z]?/g;

// "6.AT.A.3" and "6.AT.3" are the same standard written two ways; the games
// predate the 2025 MCCRS re-code, so compare on the collapsed form.
const norm = (s) => s.replace(/^(6\.[A-Z]+)\.[A-Z]\./, "$1.");

// ── Standards each curriculum unit actually teaches ──────────────────────────
const manifest = JSON.parse(read("data/curriculum-manifest.json"));
const lessons = Array.isArray(manifest) ? manifest : (manifest.lessons ?? []);
const unitStandards = new Map();
for (const lesson of Array.isArray(lessons) ? lessons : Object.values(lessons)) {
  if (!lesson?.unit || !lesson?.standard) continue;
  if (!unitStandards.has(lesson.unit)) unitStandards.set(lesson.unit, new Set());
  unitStandards.get(lesson.unit).add(norm(lesson.standard));
}
assert.equal(unitStandards.size, 10, "expected 10 curriculum units in the manifest");

// ── What the hub links, per unit ─────────────────────────────────────────────
// Parsed, not grepped. The resource rows close each anchor with the NEXT one
// ("</a\n  ><a class=…"), so an inserted link that forgets to supply that ">"
// leaves markup a regex still happily matches while the browser swallows the
// anchor that follows it — which is how the Unit Game link vanished from seven
// units while every source-text check stayed green.
const dom = new JSDOM(read("curriculum/index.html"));
const units = [...dom.window.document.querySelectorAll("details.unit")].map((el) => {
  const res = [...el.querySelectorAll("a.res")];
  const game = res.find((a) => a.textContent.includes("Unit Game"));
  const summaryEl = el.querySelector("summary");
  return {
    num: Number(el.querySelector(".unit-num")?.textContent.replace(/\D+/g, "")),
    blurb: el.querySelector(".unit-blurb")?.textContent.trim() ?? "",
    badge: el.querySelector(".badge-cluster")?.textContent.trim() ?? "",
    count: el.querySelector(".unit-count")?.textContent.trim() ?? "",
    studioInSummary: !!summaryEl?.querySelector('a[href*="neft-math-lab-studio"]'),
    studioInBody: res.some((a) => a.getAttribute("href")?.includes("neft-math-lab-studio")),
    href: game?.getAttribute("href"),
    label: game?.querySelector(".res-sub")?.textContent.trim(),
  };
});
assert.equal(units.length, 10, `expected 10 unit blocks, found ${units.length}`);

const resolve = (href) => {
  const rel = href.replace(/^\//, "");
  const candidates = href.endsWith("/") ? [`${rel}index.html`] : [rel];
  return candidates.find((c) => existsSync(fileURLToPath(new URL(c, root))));
};

for (const unit of units) {
  const where = `Unit ${unit.num}`;

  // Shape parity: 78063af11 replaced the blurb + cluster badge with links on
  // Units 7-9. All ten summaries carry the same three pieces.
  assert.ok(unit.blurb, `${where}: missing unit blurb`);
  assert.match(unit.badge, /^6\.[A-Z]+$/, `${where}: missing cluster badge`);
  assert.match(unit.count, /^\d+ lessons$/, `${where}: missing lesson count`);
  assert.ok(
    !unit.studioInSummary,
    `${where}: the Small-Group Studio link belongs in the unit body, not the summary bar`,
  );
  assert.ok(unit.studioInBody, `${where}: missing the Small-Group Studio link in its resource row`);

  // The Unit Game must exist…
  assert.ok(unit.href, `${where}: no "🎮 Unit Game" link`);
  const file = resolve(unit.href);
  assert.ok(file, `${where}: Unit Game link ${unit.href} does not resolve to a file`);

  // …and must teach this unit's standards. Folder numbers prove nothing here.
  const taught = unitStandards.get(unit.num);
  const gameStandards = new Set([...(read(file).match(STANDARD_RE) ?? [])].map(norm));
  const overlap = [...gameStandards].filter((s) => taught.has(s));
  assert.ok(
    overlap.length > 0,
    `${where} (${[...taught].sort().join(", ")}) links "${unit.label}" (${file}), which covers ` +
      `${[...gameStandards].sort().join(", ") || "no standards at all"} — no shared standard. ` +
      `Match the game to the unit by STANDARD; the math/unit-N/ folder numbers do not line up.`,
  );
}

// ── Self-test: prove the standard check actually fires ───────────────────────
// A gate that stops firing reports a perfectly mapped curriculum.
{
  const statistics = unitStandards.get(8);
  const equationsGame = new Set(
    [...read("math/unit-8/games/unit7-equation-escape.html").match(STANDARD_RE)].map(norm),
  );
  assert.equal(
    [...equationsGame].filter((s) => statistics.has(s)).length,
    0,
    "self-test: the equations game must NOT overlap the Statistics standards — " +
      "if it does, this detector can no longer tell a crossed mapping from a correct one",
  );
}

console.log(`curriculum unit games: ${units.length} units, each linked to an on-standard game.`);
