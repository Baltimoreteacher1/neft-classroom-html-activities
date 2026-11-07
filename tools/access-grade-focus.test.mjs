// Grade 6 / 7 / 8 focus inside the 6-8 band: the pure rules (grade-focus.js), the tags written on the 6-8
// content, the generated index, and JSDOM over the real room, library and home views.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";
import { allActivities, buildIndex } from "./lib/access-lab-content.mjs";

const ROOT = new URL("../", import.meta.url);
const G = await import("../access-practice-lab/src/grade-focus.js");
const B = await import("../access-practice-lab/src/bands.js");
const { progressKey } = await import("../access-practice-lab/src/store.js");
const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");

const win = new JSDOM("<main id='app'></main><div id='labLive'></div>", {
  url: "https://lab.test/access-practice-lab/",
}).window;
for (const key of [
  "window",
  "document",
  "localStorage",
  "location",
  "history",
  "navigator",
  "HTMLElement",
  "Node",
  "MutationObserver",
])
  Object.defineProperty(globalThis, key, { value: win[key], configurable: true, writable: true });
globalThis.CSS = { escape: (s) => String(s) };
globalThis.fetch = async (url) => ({
  ok: true,
  json: async () =>
    JSON.parse(await readFile(new URL(String(url).replace(/^\//, ""), ROOT), "utf8")),
});
const room = await import("../access-practice-lab/src/views/room.js");
const library = await import("../access-practice-lab/src/views/library.js");
const home = await import("../access-practice-lab/src/views/home.js");
const { parseRoute } = await import("../access-practice-lab/src/main.js").catch(() => ({}));

const dom = (markup) => new JSDOM(`<body>${toHtml(markup)}</body>`).window.document;
const ctxFor = (route, prefs = {}, band = "6-8") => ({
  band,
  bands: ["3-5", "6-8"],
  route,
  prefs: { lang: "en", ...prefs },
  setPrefs(p) {
    Object.assign(this.prefs, p);
  },
  setBand() {},
  navigate() {},
  rerender() {},
});
const six8 = allActivities().filter((a) => a.band === "6-8");
const tagged = six8.filter((a) => a.activity.grades);

test("focus values normalize and unknown values mean all grades", () => {
  assert.equal(G.normalizeGradeFocus("7"), "7");
  assert.equal(G.normalizeGradeFocus(" 8 "), "8");
  for (const v of ["", "all", "9", "5", "K", null, undefined, "6-8", "7,8"])
    assert.equal(G.normalizeGradeFocus(v), "", String(v));
  assert.equal(G.namesGradeFocus("all"), true, "?gradeFocus=all clears a saved focus");
  assert.equal(G.namesGradeFocus("7"), true);
  assert.equal(G.namesGradeFocus("banana"), false, "a junk value leaves the saved focus alone");
  assert.equal(G.namesGradeFocus(null), false, "no parameter leaves the saved focus alone");
});

test("a focus lists its own grade's activities plus the untagged ones; no focus lists everything", () => {
  const items = [
    { id: "a" },
    { id: "b", grades: ["6"] },
    { id: "c", grades: ["6", "7"] },
    { id: "d", grades: ["7", "8"] },
    { id: "e", grades: ["8"] },
  ];
  const ids = (f) => G.byGradeFocus(items, f).map((i) => i.id);
  assert.deepEqual(ids(""), ["a", "b", "c", "d", "e"]);
  assert.deepEqual(ids("6"), ["a", "b", "c"]);
  assert.deepEqual(ids("7"), ["a", "c", "d"]);
  assert.deepEqual(ids("8"), ["a", "d", "e"]);
  assert.equal(G.inGradeFocus([], "7"), true);
  assert.equal(G.inGradeFocus(undefined, "7"), true);
});

test("only the 6-8 band has a focus, whatever is saved", () => {
  assert.equal(G.activeGradeFocus({ gradeFocus: "7" }, "6-8"), "7");
  for (const band of ["K", "1", "2-3", "3-5"])
    assert.equal(G.activeGradeFocus({ gradeFocus: "7" }, band), "", band);
  assert.equal(G.activeGradeFocus({ gradeFocus: "banana" }, "6-8"), "");
  assert.equal(G.activeGradeFocus({}, "6-8"), "");
});

test("grade labels read well in both languages", () => {
  assert.equal(G.gradesLabel(undefined), null);
  assert.deepEqual(G.gradesLabel(["6"]), ["Grade 6", "6.º grado"]);
  assert.deepEqual(G.gradesLabel(["7", "8"]), ["Grades 7–8", "Grados 7–8"]);
  for (const f of G.GRADE_FOCUS)
    assert.ok((f.label[0] && f.label[1] && f.label[0] !== f.label[1]) || !f.id);
});

test("tag problems: shape, order, reason code agreement, 6-8 only", () => {
  const ok = { grades: ["7", "8"], gradesWhy: "g78-load" };
  assert.deepEqual(G.gradeTagProblems(ok, "6-8"), []);
  assert.deepEqual(G.gradeTagProblems({}, "3-5"), [], "no tag, no problem anywhere");
  const bad = (a, band = "6-8") => G.gradeTagProblems(a, band).join(" | ");
  assert.match(bad(ok, "3-5"), /6-8 activities only/);
  assert.match(bad({ grades: ["9"], gradesWhy: "g78-load" }), /"6", "7" or "8"/);
  assert.match(bad({ grades: [], gradesWhy: "g78-load" }), /non-empty/);
  assert.match(bad({ grades: ["8", "7"], gradesWhy: "g78-load" }), /sorted/);
  assert.match(bad({ grades: ["7", "7"], gradesWhy: "g78-load" }), /sorted|repeats/);
  assert.match(bad({ grades: ["6", "7", "8"], gradesWhy: "g67-load" }), /all three/);
  assert.match(bad({ grades: ["7", "8"] }), /not a known reason/);
  assert.match(bad({ grades: ["7", "8"], gradesWhy: "nope" }), /not a known reason/);
  assert.match(bad({ grades: ["6"], gradesWhy: "g78-load" }), /does not match reason/);
  assert.match(bad({ gradesWhy: "g78-load" }), /non-empty/);
});

test("every reason code assigns grades inside 6-8, sorted, never all three", () => {
  for (const [code, grades] of Object.entries(G.GRADE_REASONS)) {
    assert.ok(/^g(6|67|78|8)-(topic|load|task|stretch)$/.test(code), code);
    assert.ok(grades.length >= 1 && grades.length <= 2, code);
    assert.deepEqual(grades, [...grades].sort(), code);
  }
});

test("the 6-8 content is tagged only where it was read and judged, and every tag validates", () => {
  assert.ok(
    tagged.length >= 60 && tagged.length < six8.length / 2,
    `tagged ${tagged.length} of ${six8.length}`,
  );
  for (const { activity, band } of tagged)
    assert.deepEqual(G.gradeTagProblems(activity, band), [], activity.id);
  for (const { activity, band } of allActivities().filter((a) => a.band !== "6-8"))
    assert.equal(activity.grades, undefined, `${band}/${activity.id} must not carry grade tags`);
  const codes = new Set(tagged.map((a) => a.activity.gradesWhy));
  assert.deepEqual([...codes].sort(), Object.keys(G.GRADE_REASONS).sort(), "every code is used");
  // Support-level foundations (Level A) and the model-test items are grade-neutral by rule.
  assert.equal(tagged.filter((a) => a.level === "A").length, 0, "no Level A activity is tagged");
  assert.equal(
    tagged.filter((a) => a.domain === "Model-Test").length,
    0,
    "no model-test item is tagged",
  );
});

test("every room keeps at least 8 activities for each of Grade 6, 7 and 8", () => {
  const rooms = new Map();
  for (const { domain, level, activity } of six8) {
    const k = `${domain}/${level}`;
    rooms.set(k, [...(rooms.get(k) || []), activity]);
  }
  for (const [k, list] of rooms)
    for (const f of ["6", "7", "8"])
      assert.ok(G.byGradeFocus(list, f).length >= Math.min(8, list.length), `${k} grade ${f}`);
});

test("index.json: committed copy is current, rows carry grades only when tagged, picker ids unchanged", () => {
  const committed = JSON.parse(
    readFileSync(new URL("access-practice-lab/content/index.json", ROOT), "utf8"),
  );
  assert.deepEqual(
    committed,
    JSON.parse(JSON.stringify(buildIndex())),
    "run node tools/access-lab-index.mjs",
  );
  assert.deepEqual(
    committed.gradeBands.map((g) => g.id),
    ["K", "1", "2-3", "4-5", "6-8"],
  );
  const g68 = committed.gradeBands.find((g) => g.id === "6-8");
  assert.equal(g68.contentBand, "6-8");
  assert.deepEqual(
    g68.gradeFocus.map((f) => f.id),
    ["", "6", "7", "8"],
  );
  for (const f of g68.gradeFocus) assert.ok(f.label && f.labelEs && f.count > 0, f.id);
  assert.equal(g68.gradeFocus[0].count, six8.length);
  for (const f of ["6", "7", "8"])
    assert.equal(
      g68.gradeFocus.find((x) => x.id === f).count,
      six8.filter((a) => G.inGradeFocus(a.activity.grades, f)).length,
    );
  for (const other of committed.gradeBands.filter((g) => g.id !== "6-8"))
    assert.equal(other.gradeFocus, undefined, `${other.id} has no focus`);
  let rows = 0;
  for (const d of Object.values(committed.bands["6-8"].domains))
    for (const L of Object.values(d.levels))
      for (const row of L.activities) {
        rows++;
        assert.ok(row.length === 5 || (row.length === 6 && Array.isArray(row[5])), row[0]);
      }
  assert.equal(rows, six8.length);
  for (const d of Object.values(committed.bands["3-5"].domains))
    for (const L of Object.values(d.levels))
      for (const row of L.activities) assert.equal(row.length, 5);
});

test("band ids, progress keys and picker aliases are untouched", () => {
  assert.deepEqual(B.CONTENT_BANDS, ["K", "1", "2-3", "3-5", "6-8"]);
  assert.equal(B.normalizeBand("6-8"), "6-8");
  assert.equal(B.normalizeBand("4-5"), "3-5");
  assert.equal(progressKey("6-8", "Reading", "B"), "accessPracticeLab:v1:Reading:B");
  assert.equal(progressKey("3-5", "Reading", "B"), "accessPracticeLab:v1:g3-5:Reading:B");
});

const rowsOf = (document) =>
  [...document.querySelectorAll(".act-row a")].map((a) => a.getAttribute("href").split("/").pop());

test("room: no focus shows everything; a focus hides other grades; untagged stay; links and ring follow", async () => {
  const route = { view: "room", domain: "Reading", level: "C" };
  const all = dom((await room.render(ctxFor(route))).html);
  const level = six8
    .filter((a) => a.domain === "Reading" && a.level === "C")
    .map((a) => a.activity);
  assert.equal(rowsOf(all).length, level.length);
  assert.equal(all.querySelectorAll("[data-grade-focus]").length, 4);
  assert.equal(all.querySelector('[data-grade-focus=""]').getAttribute("aria-pressed"), "true");
  for (const f of ["6", "7", "8"]) {
    const doc = dom((await room.render(ctxFor(route, { gradeFocus: f }))).html);
    const want = G.byGradeFocus(level, f).map((a) => a.id);
    assert.deepEqual(rowsOf(doc).sort(), [...want].sort(), `grade ${f}`);
    assert.equal(
      doc.querySelector(`[data-grade-focus="${f}"]`).getAttribute("aria-pressed"),
      "true",
    );
    assert.match(
      doc.querySelector(".room-hero-progress").textContent,
      new RegExp(`of ${want.length}(?!\\d)`),
    );
    const start = doc.querySelector(".btn-next").getAttribute("href").split("/").pop();
    assert.ok(want.includes(start), "Start here is inside the focus");
  }
  const g8 = dom((await room.render(ctxFor(route, { gradeFocus: "8" }))).html);
  assert.ok(
    !rowsOf(g8).includes("68c-r-unit-price-best-buy"),
    "a Grade 6-7 activity is hidden from Grade 8",
  );
  assert.ok(g8.querySelector(".act-meta").textContent.length > 0);
  assert.ok(
    [...g8.querySelectorAll(".act-meta")].some((m) => /Grades? [6-8]/.test(m.textContent)),
    "tagged rows say their grades",
  );
});

test("room: the focus control is 6-8 only, and a stale saved focus is ignored in other bands", async () => {
  const doc = dom(
    (
      await room.render(
        ctxFor({ view: "room", domain: "Reading", level: "B" }, { gradeFocus: "7" }, "3-5"),
      )
    ).html,
  );
  assert.equal(doc.querySelectorAll("[data-grade-focus]").length, 0);
  const g35 = allActivities().filter(
    (a) => a.band === "3-5" && a.domain === "Reading" && a.level === "B",
  );
  assert.equal(doc.querySelectorAll(".act-row").length, g35.length, "3-5 lists every activity");
  const gk = dom(
    (
      await room.render(
        ctxFor({ view: "room", domain: "Model-Test", level: "6-8-A" }, { gradeFocus: "7" }),
      )
    ).html,
  );
  assert.equal(
    gk.querySelectorAll("[data-grade-focus]").length,
    0,
    "model test has no focus control",
  );
});

test("room: Spanish labels", async () => {
  const doc = dom(
    (
      await room.render(
        ctxFor({ view: "room", domain: "Reading", level: "C" }, { lang: "es", gradeFocus: "7" }),
      )
    ).html,
  );
  const text = doc.querySelector(".grade-focus").textContent;
  assert.match(text, /Enfoque por grado/);
  assert.match(text, /Todos los grados/);
  assert.match(text, /7\.º grado/);
  assert.match(text, /Nada está bloqueado/);
});

test("library: the focus filters search results, keeps shared picks, and tags rows", async () => {
  const items = [
    { id: "a", title: "t", domain: "Reading", level: "A" },
    { id: "b", title: "t", domain: "Reading", level: "A", grades: ["6"] },
    { id: "c", title: "t", domain: "Reading", level: "A", grades: ["7", "8"] },
  ];
  assert.deepEqual(
    library.filterActivities(items, { gradeFocus: "8" }).map((r) => r.id),
    ["a", "c"],
  );
  assert.deepEqual(
    library.filterActivities(items, { gradeFocus: "6" }).map((r) => r.id),
    ["a", "b"],
  );
  assert.equal(library.filterActivities(items).length, 3);
  win.history.replaceState(
    {},
    "",
    "/access-practice-lab/library?grades=6-8&pick=68c-r-unit-price-best-buy",
  );
  const out = await library.render(ctxFor({ view: "library" }, { gradeFocus: "8" }));
  const doc = dom(out.html);
  assert.equal(doc.querySelectorAll("[data-grade-focus]").length, 4);
  assert.match(doc.querySelector(".lib-count-row p").textContent, /\d+ activities found/);
  assert.ok(
    doc.querySelector(".library-picked").textContent.length > 0,
    "a shared pick outside the focus is still in the set",
  );
  const g8 = dom((await library.render(ctxFor({ view: "library" }, { gradeFocus: "8" }))).html);
  const all = dom((await library.render(ctxFor({ view: "library" }))).html);
  const count = (d) =>
    Number(d.querySelector(".lib-count-row p").textContent.match(/(\d+) activit/)[1]);
  assert.equal(count(all), six8.filter((a) => a.domain !== "Model-Test").length);
  assert.equal(
    count(g8),
    six8.filter((a) => a.domain !== "Model-Test" && G.inGradeFocus(a.activity.grades, "8")).length,
  );
});

test("home: the 6-8 picker shows the focus with counts; other bands do not; next activity follows it", async () => {
  const doc = dom((await home.render(ctxFor({ view: "home" }, { gradeFocus: "7" }))).html);
  const buttons = [...doc.querySelectorAll(".lph [data-grade-focus]")];
  assert.deepEqual(
    buttons.map((b) => b.dataset.gradeFocus),
    ["", "6", "7", "8"],
  );
  assert.equal(
    buttons.find((b) => b.getAttribute("aria-pressed") === "true").dataset.gradeFocus,
    "7",
  );
  assert.match(buttons[0].textContent, new RegExp(`\\b${six8.length}\\b`));
  assert.equal(
    doc.querySelectorAll(".lph-ruler [data-grade-pick]").length,
    5,
    "the five picker ids are unchanged",
  );
  const early = dom((await home.render(ctxFor({ view: "home" }, { gradeFocus: "7" }, "3-5"))).html);
  assert.equal(early.querySelectorAll(".lph [data-grade-focus]").length, 0);
  const es = dom((await home.render(ctxFor({ view: "home" }, { lang: "es" }))).html);
  assert.match(es.querySelector(".lph .grade-focus").textContent, /Enfoque por grado/);
});

test("main.js wires the click, the URL parameter and the restore-focus list", async () => {
  const src = readFileSync(new URL("access-practice-lab/src/main.js", ROOT), "utf8");
  assert.match(src, /t\.closest\("\[data-grade-focus\]"\)/);
  assert.match(src, /gradeFocus: q\.get\("gradeFocus"\)/);
  if (parseRoute) {
    assert.equal(parseRoute("/access-practice-lab/", "?grades=6-8&gradeFocus=7").gradeFocus, "7");
    assert.equal(
      "gradeFocus" in parseRoute("/access-practice-lab/Reading/A", "?grades=6-8"),
      false,
      "old links parse as before",
    );
  }
  assert.match(src, /"data-grade-focus"/);
  assert.match(src, /namesGradeFocus\(route\.gradeFocus\)/);
  assert.ok(makeI18n("en") && toHtml);
});
