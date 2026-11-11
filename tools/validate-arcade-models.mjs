// Gate: the arcade's games, hub cards, coach text and live-model panel all agree on the topic.
//
// Source gates passed a median tip under Equation Escape, a 2:3 ratio bar under five other
// topics and a "Target Ratio" progress bar in eleven journals, because each page was correct
// on its own and the mismatch lived in shared code that picks a picture from a pattern.
// Sources of truth: data/arcade-games.json (registry), curriculum/arcade/index.html (hub),
// math/games/shared/flagship-studio.js (coach + model per flagship game),
// assets/game-studio.js (renderers and scaffold).
//
// Usage: node tools/validate-arcade-models.mjs [--report]    exit 1 on any finding

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  flagshipModelFindings,
  foreignKeywordFindings,
  hubCardFindings,
  loadRenderer,
  mentions,
  SAMPLES,
  scaffoldFallbackFindings,
} from "./lib/arcade-models-check.mjs";
import { ARCADE_GAMES } from "./lib/arcade-registry.mjs";

const root = new URL("../", import.meta.url);
const read = (rel) => readFileSync(new URL(rel, root), "utf8");

/** English coach text per game id, read from the flagship configs (the `es:` block comes first). */
function coachTexts(studioSrc) {
  const out = new Map();
  for (const g of ARCADE_GAMES.filter((x) => x.flagshipSlug)) {
    const start = studioSrc.indexOf(`"${g.flagshipSlug}": {`);
    if (start < 0) continue;
    // A config ends at the next config key, or at the closing of the configs object.
    const ends = [
      studioSrc.indexOf('\n    "', start + 10),
      studioSrc.indexOf("\n  };", start),
    ].filter((i) => i > 0);
    const hits = [...studioSrc.slice(start, Math.min(...ends)).matchAll(/coach:\s*"([^"]+)"/g)];
    if (hits.length) out.set(g.id, hits[hits.length - 1][1]);
  }
  return out;
}

// ── Self-tests: each detector must fire on the defect that shipped, and stay quiet on clean data ──
{
  const eq = { id: "eq", model: "balance", topicKeywords: ["equation"] };
  const st = { id: "st", model: "data-display", topicKeywords: ["median", "mean"] };
  const leak = foreignKeywordFindings(
    [eq, st],
    new Map([
      ["eq", "Solve the equation. Order the data, then find the median."],
      ["st", "Find the median."],
    ]),
  );
  assert.ok(
    leak.some((f) => f.id === "eq" && f.rule === "COACH_FOREIGN_TOPIC"),
    "median tip under an equation game must fail",
  );
  assert.deepEqual(
    foreignKeywordFindings(
      [eq, st],
      new Map([
        ["eq", "Solve the equation."],
        ["st", "Find the median."],
      ]),
    ),
    [],
  );
  assert.ok(
    foreignKeywordFindings([eq], new Map([["eq", "Do the same to both sides."]])).some(
      (f) => f.rule === "COACH_OFF_TOPIC",
    ),
  );
  const html =
    '<section id="unit-9"><a class="card" href="/g/"><span class="card-kicker">Skill game</span></a></section>';
  const bad = hubCardFindings([{ id: "g", route: "/g/", kind: "adventure", unit: 9 }], html);
  assert.ok(
    bad.some((f) => f.rule === "HUB_KIND_MISMATCH"),
    "Variable Velocity labelled a skill game must fail",
  );
  assert.deepEqual(hubCardFindings([{ id: "g", route: "/g/", kind: "skill", unit: 9 }], html), []);
  assert.ok(
    flagshipModelFindings(
      [{ id: "g", flagshipSlug: "s", model: "balance" }],
      '"s": {\n model: "ratio-bars",',
    ).some((f) => f.rule === "FLAGSHIP_MODEL_MISMATCH"),
  );
  assert.ok(scaffoldFallbackFindings('const patternKind = x ? "a" : "ratios";').length === 1);
  assert.ok(mentions("find the Median now", "median") && !mentions("immediate", "median"));
}

const findings = [];

// 1. Registry shape and files.
const ids = new Set();
for (const g of ARCADE_GAMES) {
  if (ids.has(g.id)) findings.push({ id: g.id, rule: "REGISTRY_DUPLICATE_ID", detail: g.id });
  ids.add(g.id);
  if (!existsSync(new URL(g.file, root)))
    findings.push({ id: g.id, rule: "REGISTRY_FILE_MISSING", detail: g.file });
  if (!["skill", "adventure"].includes(g.kind))
    findings.push({ id: g.id, rule: "REGISTRY_BAD_KIND", detail: g.kind });
  if (!(g.unit >= 1 && g.unit <= 10))
    findings.push({ id: g.id, rule: "REGISTRY_BAD_UNIT", detail: String(g.unit) });
}
if (ARCADE_GAMES.length !== 20)
  findings.push({
    id: "registry",
    rule: "REGISTRY_COUNT",
    detail: `expected 20 skill/adventure games, found ${ARCADE_GAMES.length}`,
  });

// 2-4. Hub cards, flagship model declarations, coach text.
const studioSrc = read("math/games/shared/flagship-studio.js");
findings.push(...hubCardFindings(ARCADE_GAMES, read("curriculum/arcade/index.html")));
findings.push(...flagshipModelFindings(ARCADE_GAMES, studioSrc));
findings.push(...foreignKeywordFindings(ARCADE_GAMES, coachTexts(studioSrc)));

// 5. Renderer contract.
findings.push(...scaffoldFallbackFindings(read("assets/game-studio.js")));
const render = loadRenderer(root);
assert.equal(
  render("not-a-kind", { a: 2, b: 3 }),
  "",
  "an unknown kind must draw nothing, never a ratio bar",
);
const rendered = [];
for (const [kind, params] of Object.entries(SAMPLES)) {
  const svg = render(kind, params);
  if (!svg.includes("<svg") || !/aria-label="[^"]{12,}"/.test(svg))
    findings.push({
      id: kind,
      rule: "RENDERER_EMPTY_OR_UNLABELLED",
      detail: "sample state drew nothing or has no aria-label",
    });
  else rendered.push(kind);
}
// A renderer must draw from its parameters, not from a constant picture.
const a = render("percent-grid", { pct: 20 });
const b = render("percent-grid", { pct: 80 });
if (a === b)
  findings.push({
    id: "percent-grid",
    rule: "RENDERER_IGNORES_PARAMS",
    detail: "20% and 80% drew the same picture",
  });
if (render("percent-grid", { pct: 140 }) !== "")
  findings.push({
    id: "percent-grid",
    rule: "RENDERER_DRAWS_INVALID",
    detail: "140% must not draw a 100-square grid",
  });
if (
  render("balance", { xs: 1, units: 4, right: 40, left: "x + 4", rightLabel: "40" }).split("<rect")
    .length > 30
)
  findings.push({
    id: "balance",
    rule: "RENDERER_TRUNCATES",
    detail: "a large quantity must be one labelled bar",
  });

// 6. Coverage report: topic models the registry names that have no renderer yet.
const planned = [...new Set(ARCADE_GAMES.map((g) => g.model))].filter(
  (k) => !rendered.includes(k) && !["ratio-bars", "fraction-bar", "coordinate-plane"].includes(k),
);
console.log(
  `arcade models: ${ARCADE_GAMES.length} games, ${rendered.length} renderers verified (${rendered.join(", ")})`,
);
console.log(`topic models still planned (no renderer): ${planned.join(", ") || "none"}`);
if (findings.length) {
  for (const f of findings) console.error(`FAIL ${f.rule} [${f.id}] ${f.detail}`);
  process.exit(1);
}
console.log("PASS validate-arcade-models");
// The shipped script starts timers inside jsdom; without an explicit exit the process never ends.
process.exit(0);
