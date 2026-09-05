/* ==========================================================================
 * interactive-tools.test.mjs — gates for the Interactive Tools layer.
 *
 * Two things are guarded here:
 *
 *  1. NO TOOL SHIPS NAMELESS. Every kind in the interactive-visual REGISTRY and
 *     every `manip` authored across the lesson fleet must have a tool-catalog
 *     entry with a real name, a purpose, how-to steps, and try-this prompts.
 *     Before the catalog existed, a missing name fell back to title-casing the
 *     config slug, so students saw "Area Morph", "Dist Explorer", and "Frac
 *     Divide" — internal slugs on a student page. A source grep is the only gate
 *     that can catch that class before it ships, because the page renders fine.
 *
 *  2. THE IN-LESSON DRAWER STAYS NON-INVASIVE. The tool drawer is additive by
 *     contract: no lesson store contact, no phase completion, focus restored on
 *     close, and safe in the partial-DOM environment the small-group tests boot
 *     under. These assertions exist so a later edit cannot quietly make opening a
 *     tool count as lesson progress or take over the page.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { catalogKey, SECTION_LABEL, TOOL_CATALOG, toolMeta } from "@eduwonderlab/engine/core/tool-catalog.js";

const url = (p) => new URL(p, import.meta.url);
const read = (p) => readFileSync(url(p), "utf8");

// ── 1. Catalog completeness ────────────────────────────────────────────────
const registrySrc = read("../engine/core/interactive-visual.js");
const registryBlock = registrySrc.slice(
  registrySrc.indexOf("const REGISTRY = {"),
  registrySrc.indexOf("\n};", registrySrc.indexOf("const REGISTRY = {")),
);
const registryKinds = [...registryBlock.matchAll(/^ {2}"?([a-z0-9-]+)"?:/gm)].map((m) => m[1]);
assert.ok(registryKinds.length > 25, "registry kinds should have been parsed");

for (const kind of registryKinds) {
  // `manip` is a bridge, not a tool — its widgets are catalogued as `manip:<name>`.
  if (kind === "manip") continue;
  assert.ok(
    TOOL_CATALOG[kind],
    `interactive kind "${kind}" has no tool-catalog entry, so a tools surface would show a title-cased slug`,
  );
}

const SECTION_ORDER = ["explore", "practice", "connect", "launch", "reflect"];
const VISUAL_KEYS = ["diagram", "visual", "simulator", "lab"];
const lessonDirs = readdirSync(url("../lessons"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

let authoredTools = 0;
const uncatalogued = new Set();
for (const id of lessonDirs) {
  let config;
  try {
    config = JSON.parse(readFileSync(url(`../lessons/${id}/config.json`), "utf8"));
  } catch {
    continue; // not a lesson folder
  }
  for (const section of SECTION_ORDER) {
    const sec = config[section];
    if (!sec || typeof sec !== "object") continue;
    for (const key of VISUAL_KEYS) {
      const slot = sec[key];
      const blocks = Array.isArray(slot) ? slot : [slot];
      for (const v of blocks) {
        if (!v || typeof v !== "object" || typeof v.kind !== "string") continue;
        const catKey = catalogKey(v);
        if (!registryKinds.includes(v.kind)) continue; // static figure, not a tool
        authoredTools += 1;
        if (!TOOL_CATALOG[catKey]) uncatalogued.add(`${catKey} (${id})`);
      }
    }
  }
}
assert.ok(authoredTools > 400, `expected the tool fleet, counted ${authoredTools}`);
assert.deepEqual([...uncatalogued], [], "every authored interactive tool needs a catalog entry");

// Entry quality: a stub entry is worse than none, because it passes the check above.
for (const [key, entry] of Object.entries(TOOL_CATALOG)) {
  assert.ok(entry.name && entry.name.length > 3, `${key}: needs a real name`);
  assert.doesNotMatch(entry.name, /^[a-z0-9]+(-[a-z0-9]+)+$/, `${key}: name looks like a raw slug`);
  assert.ok(entry.purpose && entry.purpose.length > 30, `${key}: needs a plain-language purpose`);
  assert.ok(Array.isArray(entry.howTo) && entry.howTo.length >= 2, `${key}: needs how-to steps`);
  assert.ok(
    Array.isArray(entry.tryThis) && entry.tryThis.length >= 1,
    `${key}: needs at least one "try this" prompt`,
  );
  for (const step of [...entry.howTo, ...entry.tryThis]) {
    assert.ok(typeof step === "string" && step.trim().length > 8, `${key}: empty guidance line`);
  }
}

// The section chip must read as a lesson phase, never the raw config key.
for (const section of SECTION_ORDER) {
  assert.ok(SECTION_LABEL[section], `section "${section}" needs a human phase label`);
  assert.notEqual(SECTION_LABEL[section], section, `section "${section}" label is still the key`);
}

// toolMeta resolves a canonical name and keeps the lesson's own title as a subtitle.
const sample = toolMeta({
  kind: "tape-diagram",
  title: "1,344 ÷ 12, one place at a time",
});
assert.equal(sample.name, "Tape Diagram");
assert.equal(sample.instance, "1,344 ÷ 12, one place at a time");
assert.equal(toolMeta({ kind: "manip", manip: "frac-divide" }).name, "Fraction Divider");
assert.equal(toolMeta({ kind: "manip", manip: "frac-divide" }).catalogued, true);

// ── 2. Source contracts ────────────────────────────────────────────────────
const toolsMode = read("../engine/core/tools-mode.js");
assert.match(toolsMode, /export function buildToolCard/, "the drawer reuses the card builder");
assert.match(toolsMode, /nt-tool-purpose/, "cards must state what the tool is for");
assert.match(toolsMode, /nt-tool-guide/, "cards must carry how-to steps");
assert.match(toolsMode, /nt-try/, "cards must carry try-this prompts");
assert.match(toolsMode, /@media print/, "the tools page must be printable");
// Joel's rule: the standalone tools page is safe to hand to students on its own,
// so it must never link out to another lesson.
assert.doesNotMatch(toolsMode, /href="\/lessons\//, "tools page must not link to other lessons");

const drawer = read("../engine/core/tool-drawer.js");
assert.match(
  drawer,
  /typeof document === "undefined"/,
  "mountToolDrawer must no-op in a non-DOM environment",
);
assert.match(drawer, /showModal/, "the drawer must use the native top layer");
assert.match(drawer, /trigger\?\.focus\?\.\(\)/, "closing must return focus to the chip");
// Opening a tool is not lesson progress. Any store/phase contact here would make
// it one, and would quietly change every lesson's progress denominator.
assert.doesNotMatch(drawer, /store\./, "the drawer must not touch the lesson store");
assert.doesNotMatch(
  drawer,
  /phaseDone|markDone|small-group-state/,
  "the drawer must not mark phases",
);

const renderer = read("../engine/core/small-group-renderer.js");
assert.match(renderer, /mountToolDrawer\(config, \{ panels: activeTabSteps, hero: heroNode \}\)/);
// It must run AFTER the panels exist, or there is nothing to attach a chip to.
assert.ok(
  renderer.indexOf("mountToolDrawer(config") > renderer.indexOf("const activeTabSteps"),
  "the drawer must mount after the studio's panels are built",
);

// ── 3. Rendered behaviour ──────────────────────────────────────────────────
const dom = new JSDOM('<!doctype html><html lang="en"><body><div id="app"></div></body></html>', {
  url: "https://eduwonderlab.com/lessons/6-13/?mode=tools",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.URLSearchParams = dom.window.URLSearchParams;
globalThis.HTMLElement = dom.window.HTMLElement;
// Widgets that animate ask for rAF on mount; JSDOM has none, and the mount guard
// would log the throw as a warning that reads like a real failure. It must NOT
// actually run the callback: shape-3d's loop reschedules itself, so a working rAF
// keeps the event loop alive and the test never exits.
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
// The standards line does one best-effort fetch; JSDOM has none, so stub a miss.
globalThis.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve(null) });

const { collectTools, isToolsMode, renderToolsPage } = await import("@eduwonderlab/engine/core/tools-mode.js");
const { mountToolDrawer } = await import("@eduwonderlab/engine/core/tool-drawer.js");

assert.equal(isToolsMode(), true, "?mode=tools must be detected");

const testConfig = {
  lessonId: "1-1",
  title: "Prime Factorization",
  standard: "6.NOS.4",
  contentObjective: "I can write a number as a product of its prime factors.",
  explore: { diagram: { kind: "factor-tree-lab", value: 84 } },
  practice: { diagram: { kind: "manip", manip: "balance", attrs: { equation: "n + 8 = 20" } } },
};

assert.equal(collectTools(testConfig).length, 2);

renderToolsPage(testConfig, document.getElementById("app"));
const page = document.getElementById("app");
assert.match(page.textContent, /Factor Tree Lab/, "the canonical tool name must render");
assert.match(page.textContent, /Balance Scale/, "manip widgets must render their real name");
assert.doesNotMatch(page.textContent, /Manip|Frac Divide/, "no slug names on a student page");
assert.match(page.textContent, /I can write a number as a product/, "the lesson goal must show");
assert.match(page.textContent, /How to use it/, "how-to guidance must render");
assert.match(page.textContent, /Try this/, "try-this prompts must render");
assert.equal(page.querySelectorAll(".nt-tool-card").length, 2);
assert.equal(page.querySelector(".nt-tools-jump").hidden, false, "2+ tools need a jump list");
assert.equal(page.querySelectorAll(".nt-tools-jump a").length, 2);
// Phase chips read as phases, not config keys.
const tags = [...page.querySelectorAll(".nt-tool-tag")].map((n) => n.textContent);
assert.deepEqual(tags, ["Explore", "Practice"]);
// Cards are labelled for assistive tech and anchor-linked for the jump list.
for (const card of page.querySelectorAll(".nt-tool-card")) {
  const labelledBy = card.getAttribute("aria-labelledby");
  assert.ok(labelledBy && card.querySelector(`#${labelledBy}`), "card needs an accessible name");
  assert.match(card.id, /^nt-tool-\d+$/);
}

// A single-tool lesson gets no table of contents.
const solo = document.createElement("div");
document.body.appendChild(solo);
renderToolsPage(
  { lessonId: "9-9", title: "Solo", explore: { diagram: { kind: "solid-3d" } } },
  solo,
);
assert.equal(solo.querySelector(".nt-tools-jump").hidden, true);

// A lesson with no tools says so instead of rendering an empty grid, and drops the
// actions that would do nothing.
const empty = document.createElement("div");
document.body.appendChild(empty);
renderToolsPage({ lessonId: "0-0", title: "None" }, empty);
assert.equal(empty.querySelector(".nt-tools-empty").hidden, false);
assert.equal(empty.querySelector(".nt-tools-actions"), null);

// ── 4. Drawer behaviour ────────────────────────────────────────────────────
const hero = document.createElement("div");
const learn = document.createElement("div");
learn.id = "sg-tab-learn";
const practicePanel = document.createElement("div");
practicePanel.id = "sg-tab-practice";
const before = { learn: learn.childElementCount, practice: practicePanel.childElementCount };
document.body.append(hero, learn, practicePanel);

const mounted = mountToolDrawer(testConfig, {
  panels: [
    { id: "sg-tab-learn", panel: learn },
    { id: "sg-tab-practice", panel: practicePanel },
  ],
  hero,
});
assert.equal(mounted.points, 3, "explore→Learn It, practice→Practice & Check, plus the hero entry");
assert.equal(learn.querySelectorAll(".nt-toolpoint").length, 1);
assert.equal(practicePanel.querySelectorAll(".nt-toolpoint").length, 1);
assert.equal(hero.querySelectorAll(".nt-toolpoint").length, 1);
// Additive only: the chip row is appended, nothing existing is replaced.
assert.equal(learn.childElementCount, before.learn + 1);
assert.equal(practicePanel.childElementCount, before.practice + 1);

const chip = learn.querySelector(".nt-toolchip");
assert.match(chip.textContent, /Open the Factor Tree Lab/, "the chip names the tool it opens");
chip.click();
const dialog = document.querySelector("dialog.nt-tool-dialog");
assert.ok(dialog, "the chip must open the tool dialog");
assert.equal(dialog.querySelectorAll(".nt-tool-card").length, 1, "only that point's tool");
assert.match(dialog.textContent, /nothing here is graded/, "the drawer stays ungraded practice");
// The drawer is a student surface: no teacher number editor inside a lesson.
assert.equal(dialog.querySelector(".nt-tool-edit"), null);
dialog.querySelector(".nt-tool-dialog-close").click();
assert.equal(dialog.querySelectorAll(".nt-tool-card").length, 0, "closing must clear the widgets");

// Fallback: a stop whose own sections authored no tool still offers the lesson's
// tools. Which section a config parks a model in is an authoring detail, and a
// student mid-practice needs the model regardless.
const exploreOnly = {
  lessonId: "2-2",
  explore: { diagram: { kind: "tape-diagram", title: "Parts of 48", rows: [] } },
};
const guided = document.createElement("div");
guided.id = "sg-tab-guided";
const practiceOnly = document.createElement("div");
practiceOnly.id = "sg-tab-practice";
document.body.append(guided, practiceOnly);
const fallback = mountToolDrawer(exploreOnly, {
  panels: [
    { id: "sg-tab-guided", panel: guided },
    { id: "sg-tab-practice", panel: practiceOnly },
  ],
});
assert.equal(fallback.points, 2, "both stops get the lesson's tool even with no section match");
assert.match(guided.querySelector(".nt-toolchip").textContent, /Tape Diagram/);
assert.match(practiceOnly.querySelector(".nt-toolchip").textContent, /Tape Diagram/);

// A lesson with no tools mounts nothing at all — no empty chip rows in a lesson.
const barePanel = document.createElement("div");
barePanel.id = "sg-tab-learn";
const bare = mountToolDrawer(
  { lessonId: "0-0" },
  { panels: [{ id: "sg-tab-learn", panel: barePanel }] },
);
assert.equal(bare.points, 0);
assert.equal(barePanel.childElementCount, 0);

console.log(
  `interactive tools: ${Object.keys(TOOL_CATALOG).length} catalogued tools, ${authoredTools} authored instances, page + drawer behaviour verified`,
);
