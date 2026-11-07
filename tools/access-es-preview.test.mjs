// Spanish preview layer (Language Page feature #4): Spanish title, gist, directions, good-answer checklist and key
// words for every task, never the passage, script, choices or answer; opening it marks the attempt supported.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, LAB), "utf8"));
const { buildEsPreview, splitVocab } = await import(
  "../access-practice-lab/src/lang/es-preview.js"
);
const { esPreviewHTML } = await import("../access-practice-lab/src/views/es-preview.js");
const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");

const guide = read("content/es-guide.json").activities;
const activities = [];
for (const band of ["g6-8", "g3-5"]) {
  for (const f of readdirSync(new URL(`content/${band}/`, LAB))) {
    const d = read(`content/${band}/${f}`);
    for (const level of Object.values(d.levels || {}))
      for (const a of level.activities || []) activities.push({ a, domain: d.domain });
  }
}

const englishSource = (a) =>
  [
    a.script,
    ...(Array.isArray(a.passage) ? a.passage : [a.passage]),
    ...(a.options || []).map((o) => o.text),
    ...(a.items || []).map((o) => o.text),
    ...(a.sentences || []).map((o) => o.text),
  ].filter((t) => typeof t === "string" && t.length > 12);

test("every task in the bank gets a Spanish preview", () => {
  assert.ok(activities.length > 400, `swept ${activities.length}`);
  const missing = activities.filter(({ a, domain }) => !buildEsPreview(a, domain, guide[a.id]));
  assert.deepEqual(
    missing.map(({ a }) => a.id),
    [],
  );
});

test("the preview never carries the passage, the script, a choice or the answer", () => {
  for (const { a, domain } of activities) {
    const p = buildEsPreview(a, domain, guide[a.id]);
    const text = JSON.stringify(p);
    for (const source of englishSource(a))
      assert.ok(!text.includes(source), `${a.id} leaks "${source.slice(0, 40)}"`);
    assert.ok(p.rubric.length >= 3, a.id);
    assert.ok(p.title && p.gist && p.prompt, a.id);
  }
});

test("key words split into English term and Spanish", () => {
  assert.deepEqual(splitVocab(["detail", "one small fact", "detalle: un dato pequeño"]), {
    term: "detail",
    es: "detalle",
    esDef: "un dato pequeño",
  });
  assert.equal(splitVocab(["x", "y"]), null);
});

test("no preview without Spanish for the task", () => {
  assert.equal(buildEsPreview({ type: "cloze" }, "Reading", {}), null);
});

test("the panel renders in Spanish and is a help panel the activity counts as support", () => {
  const { a, domain } = activities.find(({ a }) => a.id === "read-main-idea");
  for (const mode of ["en", "es", "bi"]) {
    const dom = new JSDOM(
      `<body>${toHtml(esPreviewHTML(makeI18n(mode), a, domain, guide[a.id]))}</body>`,
    );
    const details = dom.window.document.querySelector("details.helpers.es-preview");
    assert.ok(details, mode);
    assert.equal(details.querySelector("[lang=es] h3").textContent, guide[a.id].skill);
    assert.ok(details.textContent.includes("Palabras clave"));
    assert.ok(!details.textContent.includes("Students can save water at school."));
  }
  const view = readFileSync(new URL("src/views/activity.js", LAB), "utf8");
  assert.match(view, /mode === "supported" \? esPreviewHTML\(/, "only offered in Learn with help");
  assert.match(
    view,
    /querySelectorAll\("\.helpers,/,
    "opening a .helpers panel marks the attempt supported",
  );
});
