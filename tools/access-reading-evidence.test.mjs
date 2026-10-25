#!/usr/bin/env node
// Evidence Notebook, multi-source synthesis matrix and tiered reading scaffolds (ACCESS Practice Lab).
// Drives the real modules and views in Node with isolated device storage and content read from disk.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "access-practice-lab");
const values = new Map();
let blocked = false;
globalThis.localStorage = {
  getItem: (k) => {
    if (blocked) throw new Error("blocked");
    return values.get(k) ?? null;
  },
  setItem: (k, v) => {
    if (blocked) throw new Error("blocked");
    values.set(k, String(v));
  },
  removeItem: (k) => {
    if (blocked) throw new Error("blocked");
    values.delete(k);
  },
};
globalThis.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
};
globalThis.CSS = { escape: (s) => String(s) };
globalThis.location = { search: "", href: "http://lab.test/access-practice-lab/" };
globalThis.fetch = async (url) => {
  const path = String(url)
    .replace(/^.*\/access-practice-lab\/content\//, "")
    .split("?")[0];
  try {
    const body = await readFile(join(ROOT, "content", decodeURIComponent(path)), "utf8");
    return { ok: true, status: 200, json: async () => JSON.parse(body) };
  } catch {
    return { ok: false, status: 404, json: async () => ({}) };
  }
};

const nbm = await import("../access-practice-lab/src/lang/evidence-notebook.js");
const { renderPassageSentences, readingToolbarHTML } = await import(
  "../access-practice-lab/src/components.js"
);
const { storage, toHtml } = await import("../access-practice-lab/src/util.js");
const { PREFIX } = await import("../access-practice-lab/src/store.js");
const evidence = await import("../access-practice-lab/src/views/evidence.js");
const activity = await import("../access-practice-lab/src/views/activity.js");

const SCORE =
  /\b(?:WIDA (?:level|score)|proficien\w*|placement|predict\w*|you scored|level [1-6]|\d+\s*\/\s*\d+ criteria|\d+%\s*(?:correct|score))\b/i;
const reset = () => {
  values.clear();
  blocked = false;
};
const src = (id = "act-1") => ({ id, kind: "activity", title: "Fixture" });

test("notebook key is versioned and outside the progress prefix (never in a progress code or backup)", () => {
  assert.match(nbm.NOTEBOOK_KEY, /:v\d+$/);
  assert.ok(!nbm.NOTEBOOK_KEY.startsWith(`${PREFIX}:`));
});

test("pin, re-tag, de-duplicate, place, remove and clear", () => {
  reset();
  const a = nbm.pinItem(storage, {
    tag: "claim",
    text: "Milkweed is the only plant monarch caterpillars can eat.",
    source: src(),
  });
  assert.equal(a.status, "added");
  assert.equal(
    nbm.pinItem(storage, { tag: "claim", text: a.item.text, source: src() }).status,
    "unchanged",
  );
  assert.equal(
    nbm.pinItem(storage, { tag: "evidence", text: a.item.text, source: src() }).status,
    "retagged",
  );
  let nb = nbm.loadNotebook(storage);
  assert.equal(nb.items.length, 1);
  assert.equal(nb.items[0].tag, "evidence");
  assert.deepEqual(nb.items[0].source, src());
  nbm.placeItem(storage, a.item.id, "agree");
  assert.equal(nbm.loadNotebook(storage).items[0].cell, "agree");
  nbm.placeItem(storage, a.item.id, "agree"); // pressing the same cell again takes it out
  assert.equal(nbm.loadNotebook(storage).items[0].cell, undefined);
  assert.equal(
    nbm.pinItem(storage, { tag: "opinion", text: "x", source: src() }).status,
    "invalid",
  );
  assert.equal(
    nbm.pinItem(storage, { tag: "claim", text: "   ", source: src() }).status,
    "invalid",
  );
  nb = nbm.removeItem(storage, a.item.id).notebook;
  assert.equal(nb.items.length, 0);
  assert.equal(values.has(nbm.NOTEBOOK_KEY), false, "an empty notebook leaves nothing in storage");
  nbm.pinItem(storage, { tag: "example", text: "One more.", source: src() });
  nbm.clearNotebook(storage);
  assert.equal(nbm.loadNotebook(storage).items.length, 0);
});

test("corrupt, foreign-version, hostile and blocked storage read as a safe notebook", () => {
  reset();
  values.set(nbm.NOTEBOOK_KEY, "{not json");
  assert.deepEqual(nbm.loadNotebook(storage).items, []);
  values.set(
    nbm.NOTEBOOK_KEY,
    JSON.stringify({ v: 99, items: [{ tag: "claim", text: "x", source: { id: "a" } }] }),
  );
  assert.deepEqual(nbm.loadNotebook(storage).items, []);
  values.set(
    nbm.NOTEBOOK_KEY,
    JSON.stringify({
      v: 1,
      items: [
        null,
        7,
        { tag: "claim", text: "kept", source: { id: "a" } },
        { tag: "bad", text: "dropped", source: { id: "a" } },
      ],
      synth: { p: 5, q: "draft" },
    }),
  );
  const nb = nbm.loadNotebook(storage);
  assert.deepEqual(
    nb.items.map((x) => x.text),
    ["kept"],
  );
  assert.deepEqual(nb.synth, { q: "draft" });
  reset();
  blocked = true;
  assert.doesNotThrow(() =>
    nbm.pinItem(storage, { tag: "claim", text: "Kept in this tab.", source: src() }),
  );
  assert.equal(
    nbm.loadNotebook(storage).items.length,
    1,
    "blocked storage keeps the pin for this tab",
  );
  assert.ok(storage.isVolatile);
  blocked = false;
  storage.remove(nbm.NOTEBOOK_KEY);
});

test("the notebook is capped", () => {
  reset();
  for (let i = 0; i < nbm.MAX_ITEMS; i++)
    nbm.pinItem(storage, { tag: "evidence", text: `Fact ${i}.`, source: src() });
  assert.equal(
    nbm.pinItem(storage, { tag: "evidence", text: "One too many.", source: src() }).status,
    "full",
  );
  reset();
});

test("synthesis pairs exist for Grades 3-5 and 6-8 and load an authored passage plus authored data", async () => {
  for (const band of ["3-5", "6-8"]) assert.ok(nbm.pairsForBand(band).length >= 1, band);
  const { findActivity, loadMission } = await import("../access-practice-lab/src/content.js");
  for (const pair of nbm.SYNTHESIS_PAIRS) {
    if (pair.from.kind === "mission") {
      const m = await loadMission(pair.from.id);
      assert.equal(m.band, pair.band);
      assert.equal(m.sources[pair.from.text]?.kind, "passage", pair.id);
      assert.ok(
        nbm.dataPoints(m.sources[pair.from.data]?.chart, m.sources[pair.from.data]?.table).length >=
          3,
        pair.id,
      );
    } else {
      const found = await findActivity(pair.from.id, { domain: "Reading" });
      assert.equal(found?.band, pair.band, pair.id);
      assert.ok(nbm.passageSentences(found.activity.passage).length >= 4, pair.id);
      assert.ok(nbm.dataPoints(found.activity.chart, found.activity.table).length >= 3, pair.id);
    }
  }
});

test("synthesis feedback is criterion-specific, built from the learner's own spans, and never a score", () => {
  const pins = [
    {
      text: "In June, the milkweed plants were still small, and the club saw only a few butterflies.",
      source: { id: "s:text" },
    },
    { text: "Monarchs Counted Each Month: Aug — 21 butterflies", source: { id: "s:data" } },
  ];
  const sourceText = ["In June, the milkweed plants were still small.", ...pins.map((p) => p.text)];
  const opts = { pins, textId: "s:text", dataId: "s:data", sourceText };
  const strong =
    "The text says the milkweed plants were small in June and the club saw few butterflies. The chart shows 21 butterflies in August, so both sources agree that monarchs came when the milkweed grew.";
  const r = nbm.synthesisFeedback(strong, opts);
  const by = Object.fromEntries(r.criteria.map((c) => [c.id, c]));
  for (const id of ["cites-pin", "both-sources", "names-sources", "connects", "numbers-match"])
    assert.ok(by[id]?.met, id);
  for (const c of r.criteria)
    for (const s of c.spans)
      assert.equal(strong.slice(s.start, s.end), s.text, `${c.id} span is the learner's own text`);
  assert.ok(
    by["names-sources"].spans.some((s) => /the text/i.test(s.text)) &&
      by["names-sources"].spans.some((s) => /the chart/i.test(s.text)),
  );

  const weak = nbm.synthesisFeedback("Butterflies are pretty. There were 40 of them.", opts);
  const w = Object.fromEntries(weak.criteria.map((c) => [c.id, c]));
  for (const id of ["cites-pin", "both-sources", "names-sources", "connects", "numbers-match"])
    assert.equal(w[id].met, false, id);
  assert.match(w["numbers-match"].ask, /40/);
  for (const c of weak.criteria)
    assert.ok(c.ask && !c.spans.length, `${c.id} asks a question and claims no spans`);
  assert.equal(
    nbm
      .synthesisFeedback("No numbers here, just words.", opts)
      .criteria.some((c) => c.id === "numbers-match"),
    false,
    "numbers are judged only when stated",
  );
  assert.deepEqual(nbm.synthesisFeedback("   ", opts).criteria, []);
  for (const c of [...r.criteria, ...weak.criteria])
    assert.doesNotMatch(`${c.label} ${c.ask}`, SCORE);
});

test("passage renderer: tag mode uses real buttons; gist prompts only when asked for", () => {
  const paras = ["First idea here. Second idea here.", "Third idea."];
  const read = toHtml(renderPassageSentences(paras, {}));
  assert.match(read, /role="button"/);
  assert.doesNotMatch(read, /data-gist|data-nb-pick/);
  const tag = toHtml(
    renderPassageSentences(paras, {
      tagMode: true,
      pickKey: "a1",
      picked: 1,
      pinned: new Map([[2, "claim"]]),
    }),
  );
  assert.equal((tag.match(/<button\b/g) || []).length, 3);
  assert.doesNotMatch(tag, /role="button"/);
  assert.match(
    tag,
    /data-nb-pick="a1\|1"\s+aria-pressed="true"|aria-pressed="true"[^>]*data-nb-pick="a1\|1"|data-nb-pick="a1\|1"[\s\S]*?aria-pressed="true"/,
  );
  assert.match(tag, /<span class="badge">Claim<\/span>/);
  const gist = toHtml(renderPassageSentences(paras, { gist: ["saved"] }));
  assert.equal((gist.match(/data-gist=/g) || []).length, 2);
  assert.match(gist, /<label for="gist-p-0">/);
  assert.match(gist, /value="saved"/);
});

test("reading toolbar: cognate lens only when supported", () => {
  // Node has no speech synthesis, so only the cognate control can appear.
  assert.equal(toHtml(readingToolbarHTML("k", ["a"], { cognates: false })), "");
  assert.match(toHtml(readingToolbarHTML("k", ["a"], { cognates: true })), /data-toggle-cognates/);
});

const ctxFor = (band, domain, level, id) => ({
  band,
  route: { view: "activity", domain, level, id },
  prefs: { rate: 0.9 },
  rerender() {},
  navigate() {},
  setPrefs() {},
});
async function renderActivity(mode) {
  globalThis.location = { search: mode ? `?mode=${mode}` : "", href: "http://lab.test/" };
  const out = await activity.render(ctxFor("3-5", "Reading", "C", "g35-r-c-monarchs"));
  return toHtml(out.html);
}

test("tiered reading scaffolds in the rendered activity: supported has them, independent is clean", async () => {
  reset();
  const supported = await renderActivity("supported");
  assert.match(supported, /data-reading-passage="g35-r-c-monarchs"/);
  assert.match(supported, /data-toggle-cognates/, "cognate toggle");
  assert.match(supported, /class="gloss-word"/, "inline glossary");
  assert.match(supported, /data-gist="0"/, "paragraph gist prompts");
  assert.match(supported, /nb-organizer/, "graphic organizer");
  assert.match(supported, /data-nb-pin-mode/);
  const independent = await renderActivity("independent");
  assert.match(independent, /data-reading-passage="g35-r-c-monarchs"/);
  for (const [re, what] of [
    [/data-toggle-cognates/, "cognates"],
    [/gloss-word|gloss-list/, "glossary"],
    [/data-gist/, "gist prompts"],
    [/nb-organizer/, "organizer"],
    [/has-cognates/, "cognate marks"],
  ])
    assert.doesNotMatch(independent, re, `independent passage shows no ${what}`);
});

test("activity pin flow: select a sentence by button, tag it, and it is in the notebook", async () => {
  reset();
  await renderActivity("supported");
  const target = (attrs) => ({
    closest: (sel) => {
      const m = sel.match(/^\[([\w-]+)\]$/);
      if (!m || !(m[1] in attrs)) return null;
      const dataset = Object.fromEntries(
        Object.entries(attrs).map(([k, v]) => [
          k.replace(/^data-/, "").replace(/-(\w)/g, (_, c) => c.toUpperCase()),
          v,
        ]),
      );
      return { dataset, textContent: "" };
    },
    matches: () => false,
  });
  const ctx = ctxFor("3-5", "Reading", "C", "g35-r-c-monarchs");
  assert.equal(activity.onClick({ target: target({ "data-nb-pin-mode": "" }) }, ctx), true);
  const html = await renderActivity("supported");
  assert.match(html, /<button[^>]*data-nb-pick="g35-r-c-monarchs\|0"/);
  assert.match(html, /Pin a data point/);
  assert.equal(
    activity.onClick({ target: target({ "data-nb-pick": "g35-r-c-monarchs|1" }) }, ctx),
    true,
  );
  assert.match(await renderActivity("supported"), /nbTagLabel/);
  assert.equal(activity.onClick({ target: target({ "data-nb-tag": "claim" }) }, ctx), true);
  const nb = nbm.loadNotebook(storage);
  assert.equal(nb.items.length, 1);
  assert.equal(nb.items[0].tag, "claim");
  assert.equal(nb.items[0].source.id, "g35-r-c-monarchs");
  assert.equal(nb.items[0].text, "Milkweed is the only plant that monarch caterpillars can eat.");
  assert.match(await renderActivity("supported"), /<span class="badge">Claim<\/span>/);
  activity.unmount();
  reset();
});

test("/evidence renders the synthesis matrix for each band and pins by keyboard-operable buttons", async () => {
  for (const band of ["3-5", "6-8"]) {
    reset();
    const out = toHtml((await evidence.render({ band, route: {}, prefs: {} })).html);
    assert.match(out, /Synthesis matrix/);
    assert.match(out, /Source 1 · Text/);
    assert.match(out, /Source 2 · Data/);
    assert.match(out, /<button[^>]*data-nb-pick="syn-[\w-]+:text\|0"/);
    assert.match(out, /data-nb-pick="syn-[\w-]+:data\|d0"/);
    assert.match(out, /Where do the sources agree\?/);
    assert.match(out, /data-syn-text=/);
    assert.match(out, /id="notebook"/);
    assert.doesNotMatch(out, /<div[^>]*onclick|role="button"/);
    assert.doesNotMatch(out.replace(/<[^>]+>/g, " "), SCORE);
  }
  reset();
  const ctx = { band: "3-5", route: {}, prefs: {}, rerender() {} };
  const at = (attr, value) => ({
    closest: (sel) =>
      sel === `[${attr}]`
        ? {
            dataset: {
              [attr.replace(/^data-/, "").replace(/-(\w)/g, (_, c) => c.toUpperCase())]: value,
            },
            textContent: "Both sources agree",
          }
        : null,
  });
  const pair = nbm.pairsForBand("3-5")[0];
  evidence.onEvidenceEvent(at("data-nb-pick", `${pair.id}:data|d2`), ctx);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(evidence.onEvidenceEvent(at("data-nb-tag", "evidence"), ctx), true);
  const item = nbm.loadNotebook(storage).items[0];
  assert.equal(item?.source.id, `${pair.id}:data`);
  assert.match(item.text, /Aug — 21 butterflies/);
  assert.equal(evidence.onEvidenceEvent(at("data-nb-place", `${item.id}:data`), ctx), true);
  assert.equal(nbm.loadNotebook(storage).items[0].cell, "data");
  nbm.saveSynthesis(
    storage,
    pair.id,
    "The chart shows 21 butterflies in August, and the text says the milkweed was tall then, so both sources agree.",
  );
  evidence.onEvidenceEvent(at("data-syn-check", pair.id), ctx);
  await new Promise((r) => setTimeout(r, 20));
  const page = toHtml((await evidence.render({ band: "3-5", route: {}, prefs: {} })).html);
  assert.match(page, /What your synthesis shows/);
  assert.match(page, /<q>21<\/q>/);
  assert.match(page, /Not yet: uses evidence from both sources/);
  assert.equal(evidence.onEvidenceEvent(at("data-nb-remove", item.id), ctx), true);
  assert.equal(nbm.loadNotebook(storage).items.length, 0);
  evidence.unmount();
  reset();
});
