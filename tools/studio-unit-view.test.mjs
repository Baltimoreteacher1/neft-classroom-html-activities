// Unit view (#/unit/<seedUnitId>) rendered in jsdom against the real catalog and the real BCPSS seed fallback.
//   node --test tools/studio-unit-view.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

const STUDIO = fileURLToPath(new URL("../bcpss-teachers/studio/", import.meta.url));
const U = (p) => pathToFileURL(`${STUDIO}${p}`).href;

const dom = new JSDOM('<!doctype html><html><body><main id="st-main"></main></body></html>', {
  url: "http://localhost/bcpss-teachers/studio/",
  pretendToBeVisual: true,
});
const w = dom.window;
for (const k of ["window", "document", "localStorage", "sessionStorage", "location", "history"])
  Object.defineProperty(globalThis, k, { value: w[k], configurable: true, writable: true });
Object.defineProperty(globalThis, "navigator", { value: w.navigator, configurable: true });
w.scrollTo = () => {};

const { createCatalog } = await import(U("core/catalog.js"));
const unitView = await import(U("views/unit.js"));
const unitData = await import(U("views/unit/data.js"));
const { getUnitDetail } = await import(
  new URL("../functions/_lib/bcpss/db.js", import.meta.url).href
);
const { VIEW_FOR } = await import(U("core/router.js"));

let failApi = false;
const fetchJson = async (url) => {
  if (url.startsWith("file:")) return JSON.parse(readFileSync(fileURLToPath(url), "utf8"));
  if (failApi) throw new Error("Request failed (503)");
  const m = /\/api\/bcpss\/units\/([^/?]+)$/.exec(url);
  if (!m) throw new Error("Request failed (404)");
  const { detail } = await getUnitDetail({}, decodeURIComponent(m[1]));
  if (!detail) throw new Error("Request failed (404)");
  return detail;
};
const catalog = createCatalog({ fetchJson });
const announced = [];
const titles = [];
const shell = { catalog, setTitle: (t) => titles.push(t), announce: (t) => announced.push(t) };
const root = () => document.getElementById("st-main");
const $ = (s) => root().querySelector(s);
const $$ = (s) => [...root().querySelectorAll(s)];
const show = async (id) => {
  await unitView.render({ root: root(), params: { id }, shell });
};

describe("unit view", () => {
  before(() => assert.equal(VIEW_FOR.unit, "unit"));

  it("shows a seed unit that Studio lessons reference", async () => {
    await show("g6-math-u5");
    assert.match($("h1").textContent, /^Unit 5: Numerical & Algebraic Expressions and Equations/);
    const chips = $$(".st-ll-chip").map((c) => c.textContent);
    assert.ok(chips.includes("Grade 6"));
    assert.ok(chips.some((c) => c.startsWith("District-referenced")));
    assert.ok(chips.includes("Teacher review recommended"));
    // Standards come from the seed; the registry paraphrase is used when the code exists there.
    assert.ok($$(".st-un-std dt code").some((c) => c.textContent === "6.EE.C.9"));
    assert.ok($(".st-un-std dd").textContent.length > 3);
    // Lessons, vocabulary and activities link into the Studio.
    const lesson = $$('a[href^="#/lesson/"]').map((a) => a.getAttribute("href"));
    assert.ok(lesson.includes("#/lesson/g6-math-variables-relationships"));
    assert.ok($$('a[href^="#/vocab/"]').length >= 1);
    const play = $$('a[href*="/bcpss-teachers/studio/play/"]');
    assert.ok(play.length >= 2);
    assert.ok(play.every((a) => a.target === "_blank" && a.rel.includes("noopener")));
    assert.ok(
      play.some((a) => a.getAttribute("href").includes("l=g6-math-variables-relationships")),
    );
    assert.match($('a[href^="#/lens"]').getAttribute("href"), /^#\/lens\?grade=6&subject=math$/);
    assert.equal($(".st-ll-btn:not(a)")?.tagName, "BUTTON");
    assert.ok(titles.at(-1).startsWith("Unit 5"));
    assert.ok(announced.at(-1).includes("Studio lesson"));
  });

  it("family card uses the lesson's own home-language note and nothing invented", async () => {
    await show("g6-math-u5");
    const card = $('[data-testid="family-card"]');
    assert.ok(card);
    assert.match(card.textContent, /Numerical & Algebraic Expressions and Equations/);
    assert.match(card.textContent, /Spanish note/);
    assert.match(card.textContent, /variable independiente/);
    assert.equal($('[data-testid="family-empty"]'), null);
    assert.match(root().textContent, /Teacher review recommended before this goes home/);
  });

  it("a seed unit with no Studio lessons says so and still shows the seed", async () => {
    await show("g6-math-u6");
    assert.match($("h1").textContent, /^Unit 6:/);
    assert.ok($('[data-testid="no-lessons"]'));
    assert.equal($$('a[href^="#/lesson/"]').length, 0);
    assert.match(
      $('[data-testid="no-lessons"] a').getAttribute("href"),
      /^#\/find\?grade=6&subject=math$/,
    );
    const empty = $('[data-testid="family-empty"]');
    assert.ok(empty);
    assert.match(empty.textContent, /No family note yet/);
    assert.match(empty.querySelector("a").getAttribute("href"), /^#\/create\?/);
    assert.ok($$(".st-un-std dt").length >= 1);
    assert.match($$(".st-ll-card h2").at(-1).textContent, /Family card/);
  });

  it("an unknown unit id gets a clear state with a link to Find", async () => {
    await show("not-a-unit");
    assert.equal($("h1").textContent, "We could not find that unit");
    assert.ok($$("a").some((a) => a.getAttribute("href") === "#/find"));
    assert.equal($(".st-ll-state").getAttribute("role"), "status");
    assert.ok(announced.at(-1).includes("could not find"));
  });

  it("a failed load is an alert with a working Try again", async () => {
    failApi = true;
    const bad = createCatalog({ fetchJson });
    await unitView.render({
      root: root(),
      params: { id: "g6-math-u5" },
      shell: { ...shell, catalog: bad },
    });
    assert.equal($("h1").textContent, "This unit did not load");
    assert.equal($(".st-ll-state").getAttribute("role"), "alert");
    failApi = false;
    $("button").click();
    await new Promise((r) => setTimeout(r, 200));
    assert.match($("h1").textContent, /^Unit 5:/);
  });

  it("matches lessons by curriculum.unitId only and honors grade and subject", async () => {
    const unit = { id: "g6-math-u5", grade: "6", subject: "Math" };
    const found = await unitData.studioFor(catalog, unit);
    assert.deepEqual(
      found.lessons.map((l) => l.id),
      ["g6-math-variables-relationships"],
    );
    const other = await unitData.studioFor(catalog, {
      id: "g6-math-u2",
      grade: "6",
      subject: "Math",
    });
    assert.deepEqual(
      other.lessons.map((l) => l.id),
      ["g6-math-ratios-and-rates"],
    );
    const none = await unitData.studioFor(catalog, { id: "g6-ela-u1", grade: "6", subject: "ELA" });
    assert.ok(none.lessons.every((l) => l.curriculum.unitId === "g6-ela-u1"));
    assert.equal(
      unitData.isUnknownUnit(
        Object.assign(new Error("x"), { cause: new Error("Request failed (404)") }),
      ),
      true,
    );
    assert.equal(unitData.isUnknownUnit(new Error("Request failed (500)")), false);
  });

  it("source files stay under 500 lines and carry no emoji", () => {
    for (const f of [
      "views/unit.js",
      "views/unit/data.js",
      "views/unit/family.js",
      "views/unit/sections.js",
      "views/unit/unit.css",
    ]) {
      const text = readFileSync(`${STUDIO}${f}`, "utf8");
      assert.ok(text.split("\n").length <= 500, f);
      assert.ok(!/\p{Extended_Pictographic}/u.test(text), `${f} has an emoji`);
    }
  });
});
