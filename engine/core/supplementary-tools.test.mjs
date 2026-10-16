#!/usr/bin/env node
/* =============================================================================
 * supplementary-tools.test.mjs — the linked ratio lab and the invent-first scene
 * ride the EXISTING tool system, additively.
 * -----------------------------------------------------------------------------
 * Both are offered through collectTools(), so they reach the in-lesson drawer,
 * the dock and ?mode=tools with no new route and no change to any lesson file.
 * "Additive" is the claim under test: the lesson's own tools come first and are
 * unchanged, the new ones sit in a section of their own (so the Explore/Practice
 * coverage rule still measures only what a lesson authored), and lessons outside
 * the units that need them see nothing at all.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM('<!doctype html><html lang="en"><body><div id="app"></div></body></html>', {
  url: "https://eduwonderlab.com/lessons/4-3/",
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  MutationObserver: dom.window.MutationObserver,
  URLSearchParams: dom.window.URLSearchParams,
  HTMLElement: dom.window.HTMLElement,
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
});
const inventConfig = JSON.parse(
  readFileSync(new URL("../../data/invent-first/4-3.json", import.meta.url), "utf8"),
);
globalThis.fetch = async (url) =>
  String(url).includes("/data/invent-first/")
    ? { ok: true, json: async () => inventConfig }
    : { ok: false, json: async () => null };

const { collectTools, renderToolsPage } = await import("./tools-mode.js");
const { mountToolDrawer } = await import("./tool-drawer.js");
const { SECTION_LABEL, TOOL_CATALOG, toolMeta } = await import("./tool-catalog.js");

const lessonsDir = new URL("../../lessons/", import.meta.url);
const configs = readdirSync(lessonsDir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .flatMap((e) => {
    try {
      return [JSON.parse(readFileSync(new URL(`${e.name}/config.json`, lessonsDir), "utf8"))];
    } catch {
      return [];
    }
  });
const authoredOnly = (config) => collectTools(config).filter((t) => t.section !== "extra");

test("both kinds are registered, catalogued and have a human section label", () => {
  const registry = readFileSync(new URL("./interactive-visual.js", import.meta.url), "utf8");
  for (const kind of ["linked-lab", "invent-first"]) {
    assert.match(registry, new RegExp(`"${kind}": async \\(host, cfg\\)`), `${kind} not in REGISTRY`);
    const meta = toolMeta({ kind });
    assert.equal(meta.catalogued, true);
    assert.ok(meta.nameEs && meta.purposeEs, `${kind} needs Spanish`);
    assert.ok(meta.howTo.length >= 2 && meta.tryThis.length >= 1);
    assert.ok(!/-/.test(meta.name), `${kind} reads like a slug: ${meta.name}`);
  }
  assert.equal(SECTION_LABEL.extra, "Extra");
  assert.ok(TOOL_CATALOG["linked-lab"] && TOOL_CATALOG["invent-first"]);
});

test("Unit 3 and Unit 4 lessons get the linked lab after their own tools", () => {
  const authored = {
    lessonId: "3-1",
    explore: { diagram: { kind: "tape-diagram", rows: [{ label: "a", parts: [{ value: 1 }] }] } },
    practice: { diagram: { kind: "percent-grid", percent: 40 } },
  };
  const tools = collectTools(authored);
  assert.deepEqual(
    tools.map((t) => [t.v.kind, t.section]),
    [
      ["tape-diagram", "explore"],
      ["percent-grid", "practice"],
      ["linked-lab", "extra"],
    ],
  );
  assert.deepEqual(tools[2].v, { kind: "linked-lab", mode: "ratio" });
  assert.equal(collectTools({ ...authored, lessonId: "4-2" }).at(-1).v.mode, "percent");
});

test("lesson 4-3 and its variants also get the invent-first scene; 4-4 does not", () => {
  for (const id of ["4-3", "4-3-group1", "4-3-part2", "4-3-catchup"]) {
    const kinds = collectTools({ lessonId: id }).map((t) => t.v.kind);
    assert.deepEqual(kinds, ["linked-lab", "invent-first"], id);
  }
  assert.deepEqual(collectTools({ lessonId: "4-4" }).map((t) => t.v.kind), ["linked-lab"]);
});

test("every other lesson sees exactly what it saw before", () => {
  for (const id of ["1-1", "2-6", "5-1", "6-13", "7-2", "9-3"]) {
    assert.deepEqual(collectTools({ lessonId: id }), [], id);
  }
});

test("across every lesson config: extras appear only where intended and never alter the authored tools", () => {
  const seen = { linked: 0, invent: 0, authoredAfter: 0 };
  for (const config of configs) {
    const id = String(config.lessonId || "");
    const extras = collectTools(config).filter((t) => t.section === "extra");
    const wantsLinked = /^[34]-\d+(-|$)/.test(id);
    const wantsInvent = /^4-3(-|$)/.test(id);
    assert.equal(extras.some((t) => t.v.kind === "linked-lab"), wantsLinked, `${id} linked-lab`);
    assert.equal(extras.some((t) => t.v.kind === "invent-first"), wantsInvent, `${id} invent-first`);
    seen.linked += wantsLinked ? 1 : 0;
    seen.invent += wantsInvent ? 1 : 0;
    // Authored tools are exactly the extras-free collection, in order, and come first.
    const all = collectTools(config);
    assert.deepEqual(all.slice(0, all.length - extras.length), authoredOnly(config), id);
    assert.ok(all.slice(all.length - extras.length).every((t) => t.section === "extra"));
    // Explore/Practice coverage is measured on authored tools only.
    const covered = new Set(all.map((t) => t.section));
    covered.delete("extra");
    assert.deepEqual(covered, new Set(authoredOnly(config).map((t) => t.section)), id);
    seen.authoredAfter += 1;
  }
  assert.ok(seen.linked >= 60, `linked lab reached only ${seen.linked} configs`);
  assert.ok(seen.invent >= 4 && seen.invent <= 6, `invent-first reached ${seen.invent} configs`);
  assert.ok(seen.authoredAfter > 200);
});

test("the tools page lists both new tools under 'Extra', with no number editor", () => {
  const app = document.getElementById("app");
  renderToolsPage({ lessonId: "4-3", title: "Estimate the Percent of a Number" }, app);
  const names = [...app.querySelectorAll(".nt-tool-card > h2")].map((h) => h.textContent);
  assert.match(names[0], /Linked Ratio Lab/);
  assert.match(names[1], /Invent a Way First/);
  assert.deepEqual(
    [...app.querySelectorAll(".nt-tool-tag")].map((t) => t.textContent),
    ["Extra", "Extra"],
  );
  assert.equal(app.querySelectorAll(".nt-tool-edit").length, 0, "nothing in them is a lesson number to edit");
});

test("the in-lesson drawer opens them, additively, and closing clears them", async () => {
  const hero = document.createElement("div");
  const panel = document.createElement("div");
  panel.id = "sg-tab-learn";
  document.body.append(hero, panel);
  const config = {
    lessonId: "4-3",
    explore: { diagram: { kind: "percent-grid", percent: 75 } },
  };
  const before = panel.childElementCount;
  mountToolDrawer(config, { panels: [{ id: "sg-tab-learn", panel }], hero });
  assert.equal(panel.childElementCount, before + 1, "one chip row appended, nothing replaced");
  const open = hero.querySelector(".nt-toolchip");
  assert.match(open.textContent, /Open the tools/);
  open.click();
  const dialog = document.querySelector("dialog.nt-tool-dialog");
  const cards = [...dialog.querySelectorAll(".nt-tool-card > h2")].map((h) => h.textContent);
  assert.equal(cards.length, 3, "the lesson's own tool plus both new ones");
  assert.match(cards[0], /Hundred Grid/);
  // The lazy components mount for real inside the dialog.
  for (let i = 0; i < 40 && !(dialog.querySelector(".ll") && dialog.querySelector(".ifx .ifx-problem")); i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.ok(dialog.querySelector(".ll .rtlab"), "linked lab mounted");
  assert.ok(dialog.querySelector(".ifx .ifx-problem"), "invent-first mounted");
  assert.match(dialog.textContent, /Optional · try first/);
  dialog.querySelector(".nt-tool-dialog-close").click();
  assert.equal(dialog.querySelectorAll(".nt-tool-card").length, 0);
});
