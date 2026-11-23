// Projects views: pure data helpers, the browse view with its filters, and the detail view, rendered in jsdom against
// the real project files and the real manifest. Also recomputes the statistics the sampling project states.
//   node --test tools/studio-projects-view.test.mjs
import assert from "node:assert/strict";
import { join } from "node:path";
import { before, beforeEach, describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";
import { buildManifest, STUDIO_ROOT } from "./build-studio-manifest.mjs";

const dom = new JSDOM('<!doctype html><html><body><main id="st-main"></main></body></html>', {
  url: "http://localhost/bcpss-teachers/studio/",
  pretendToBeVisual: true,
});
const w = dom.window;
for (const k of ["window", "document", "localStorage", "location", "history"])
  Object.defineProperty(globalThis, k, { value: w[k], configurable: true, writable: true });
Object.defineProperty(globalThis, "navigator", { value: w.navigator, configurable: true });
globalThis.HashChangeEvent = w.HashChangeEvent;
w.scrollTo = () => {};

const U = (p) => pathToFileURL(join(STUDIO_ROOT, p)).href;
const data = await import(U("views/projects/data.js"));
const { createCatalog } = await import(U("core/catalog.js"));
const view = await import(U("views/projects.js"));
const libraryCore = await import(U("core/library.js"));
const prefsCore = await import(U("core/prefs.js"));
const classesCore = await import(U("core/classes.js"));

let manifestText;
let projects;
before(async () => {
  manifestText = await buildManifest();
  projects = JSON.parse(manifestText).items.filter((i) => i.kind === "project");
});

const catalog = () =>
  createCatalog({
    base: new URL(pathToFileURL(`${STUDIO_ROOT}/`)),
    fetchJson: async (url) =>
      String(url).endsWith("manifest.json")
        ? JSON.parse(manifestText)
        : Promise.reject(new Error("no network")),
    importModule: (url) => import(url),
  });
const announced = [];
const shell = (cat = catalog()) => ({
  catalog: cat,
  library: libraryCore,
  classes: classesCore,
  prefs: prefsCore,
  announce: (t) => announced.push(t),
  setTitle: (t) => (document.title = t),
  replaceHash: (h) => history.replaceState(null, "", `/bcpss-teachers/studio/${h}`),
  openActivity: () => {},
  projector: { get: () => false, toggle: () => false },
});
const root = () => document.getElementById("st-main");
const settle = () => new Promise((r) => setTimeout(r, 40));
const load = (id) => import(U(`data/projects/${id}.js`)).then((m) => m.default);
const pressed = (label) =>
  [...root().querySelectorAll(`[aria-label="${label}"] button`)].find(
    (b) => b.getAttribute("aria-pressed") === "true",
  );
const pill = (label, text) =>
  [...root().querySelectorAll(`[aria-label="${label}"] button`)].find((b) =>
    b.textContent.startsWith(text),
  );
const cardTitles = () =>
  [...root().querySelectorAll(".st-pj-card .st-card-title")].map((n) => n.textContent);

describe("data helpers", () => {
  it("describes a project and rejects other things", () => {
    const d = data.describe({
      kind: "project",
      id: "x",
      title: "T",
      drivingQuestion: "Why?",
      grade: "4",
      band: "3-5",
      subject: "science",
      subjects: ["science", "math"],
      sessions: 7,
      finalProduct: { title: "A poster" },
      standards: ["4-ESS2-1"],
    });
    assert.equal(d.duration, "medium");
    assert.deepEqual(d.subjects, ["science", "math"]);
    assert.equal(d.finalProduct, "A poster");
    assert.equal(data.describe({ kind: "lesson", id: "x", title: "T" }), null);
    assert.equal(data.describe({ kind: "project", id: "x" }), null);
  });

  it("derives sessions from duration and session minutes when sessions is absent", () => {
    assert.equal(data.sessionsOf({ duration: 500, sessionMinutes: 50 }), 10);
    assert.equal(data.sessionsOf({}), null);
    assert.equal(data.durationOf(5), "short");
    assert.equal(data.durationOf(6), "medium");
    assert.equal(data.durationOf(9), "long");
  });

  it("reads filters from the address, ignoring unknown values", () => {
    assert.deepEqual(
      data.readFilters({ band: "6-8", duration: "long", subject: "math", q: "scale" }),
      { band: "6-8", subject: "math", duration: "long", q: "scale" },
    );
    assert.deepEqual(data.readFilters({ band: "9-12", duration: "forever" }), {
      band: "",
      subject: "",
      duration: "",
      q: "",
    });
    assert.equal(data.readTier("br"), "br");
    assert.equal(data.readTier("zz"), "dev");
  });
});

describe("the project set", () => {
  it("has range across all three grade bands, several subjects and more than one length", async () => {
    assert.ok(projects.length >= 6, `expected at least 6 projects, found ${projects.length}`);
    const items = (await data.loadProjects(shell())).items;
    for (const band of ["k-2", "3-5", "6-8"])
      assert.ok(items.filter((i) => i.band === band).length >= 1, band);
    assert.ok(items.filter((i) => i.band === "3-5").length >= 2);
    assert.ok(items.filter((i) => i.band === "6-8").length >= 3);
    assert.ok(new Set(items.flatMap((i) => i.subjects)).size >= 4);
    assert.ok(new Set(items.map((i) => i.duration)).size >= 2);
  });
});

describe("browse view", () => {
  beforeEach(() => {
    localStorage.clear();
    root().replaceChildren();
    history.replaceState(null, "", "/bcpss-teachers/studio/");
  });

  it("shows one card per project with driving question, final product and standards", async () => {
    await view.render({ root: root(), params: { route: "projects" }, shell: shell() });
    const cards = [...root().querySelectorAll(".st-pj-card")];
    assert.equal(cards.length, projects.length);
    for (const c of cards) {
      assert.ok(c.querySelector(".st-pj-dq").textContent.length > 20, "driving question");
      assert.ok(c.querySelector(".st-pj-fp").textContent.length > 5, "final product");
      assert.ok(c.querySelector('a[href^="#/project/"]'), "link to detail");
    }
    assert.match(root().textContent, /standards-aligned/i);
    assert.equal(root().querySelectorAll('[aria-label="Grade band"] button').length, 4);
    assert.equal(root().querySelectorAll('[aria-label="Length"] button').length, 4);
  });

  it("filters by grade band, narrowing the list and announcing it", async () => {
    await view.render({ root: root(), params: { route: "projects" }, shell: shell() });
    pill("Grade band", "Grades K").click();
    const small = cardTitles();
    assert.ok(small.length >= 1 && small.length < projects.length);
    assert.ok([...root().querySelectorAll(".st-pj-card")].every((c) => c.dataset.band === "k-2"));
    assert.equal(pressed("Grade band").firstChild.textContent, "Grades K\u20132");
    assert.match(root().querySelector(".st-pj-status").textContent, /\d+ projects? shown/);
    pill("Grade band", "Grades 6").click();
    assert.ok([...root().querySelectorAll(".st-pj-card")].every((c) => c.dataset.band === "6-8"));
    pill("Grade band", "Grades 6").click();
    assert.equal(
      root().querySelectorAll(".st-pj-card").length,
      projects.length,
      "pressing a pressed band clears it",
    );
  });

  it("filters by subject, length and search, and combines them", async () => {
    await view.render({ root: root(), params: { route: "projects" }, shell: shell() });
    const subject = root().querySelector("#st-pj-subject");
    subject.value = "math";
    subject.dispatchEvent(new w.Event("change"));
    const math = cardTitles();
    assert.ok(math.length >= 2 && math.length < projects.length);
    pill("Length", "9 or more").click();
    assert.ok(cardTitles().every((t) => math.includes(t)));
    const q = root().querySelector("#st-pj-q");
    q.value = "7.SP.A.2";
    q.dispatchEvent(new w.Event("input"));
    assert.deepEqual(cardTitles(), ["How Much Homework Is Too Much? A Sampling Study"]);
    assert.match(location.hash + location.search, /subject=math/);
  });

  it("reads filters from the address and offers a way out of an empty result", async () => {
    await view.render({
      root: root(),
      params: { route: "projects", band: "k-2", subject: "social-studies" },
      shell: shell(),
    });
    assert.equal(root().querySelectorAll(".st-pj-card").length, 0);
    assert.match(root().textContent, /Nothing matches yet/);
    root().querySelector(".st-empty button").click();
    assert.equal(root().querySelectorAll(".st-pj-card").length, projects.length);
  });

  it("says plainly when the manifest cannot be read, with a retry", async () => {
    const broken = createCatalog({
      base: new URL(pathToFileURL(`${STUDIO_ROOT}/`)),
      fetchJson: async () => Promise.reject(new Error("offline")),
      importModule: (u) => import(u),
    });
    await view.render({ root: root(), params: { route: "projects" }, shell: shell(broken) });
    assert.match(root().textContent, /did not load/i);
    assert.ok([...root().querySelectorAll("button")].some((b) => b.textContent === "Try again"));
  });
});

describe("detail view", () => {
  beforeEach(() => {
    localStorage.clear();
    root().replaceChildren();
    history.replaceState(null, "", "/bcpss-teachers/studio/");
  });

  const open = async (id, extra = {}) => {
    await view.render({ root: root(), params: { route: "project", id, ...extra }, shell: shell() });
    await settle();
  };

  it("every project renders every required section", async () => {
    for (const { id } of projects) {
      const p = await load(id);
      await open(id);
      const text = root().textContent;
      assert.equal(root().querySelector("h1").textContent, p.title, id);
      assert.ok(text.includes(p.drivingQuestion), `${id}: driving question`);
      assert.ok(text.includes(p.finalProduct.title), `${id}: final product`);
      assert.equal(
        root().querySelectorAll(".st-pj-cp").length,
        p.checkpoints.length,
        `${id}: checkpoints`,
      );
      assert.ok(p.checkpoints.length >= 3, `${id}: >= 3 checkpoints`);
      assert.equal(
        root().querySelectorAll(".st-pj-crit").length,
        p.rubric.criteria.length,
        `${id}: rubric criteria`,
      );
      for (const c of p.rubric.criteria) assert.ok(c.levels.length >= 3);
      assert.equal(
        root().querySelectorAll(".st-pj-day").length,
        p.facilitation.length,
        `${id}: sessions`,
      );
      assert.equal(
        root().querySelectorAll('[aria-label="Support level"] button').length,
        4,
        `${id}: tiers`,
      );
      assert.ok(text.includes("Teacher review recommended"), `${id}: review status`);
      assert.match(text, /Standards-aligned|District-referenced/, `${id}: curriculum chip`);
      assert.ok(
        root().querySelectorAll(".st-pj-fig svg").length >= p.visuals.length,
        `${id}: visuals rendered`,
      );
      assert.doesNotMatch(text, /not in the standards registry/, `${id}: every standard resolves`);
      for (const s of p.standards)
        assert.ok(root().querySelector(`.st-pj-standards code`) && text.includes(s), `${id}: ${s}`);
      for (const t of p.languageTargets)
        assert.ok(text.includes(t.function), `${id}: language target`);
      assert.match(text, /Not an official WIDA or ACCESS item/);
    }
  });

  it("switches supports by level and keeps the level in the address", async () => {
    await open("stop-the-washout-erosion-design");
    assert.equal(root().querySelector(".st-pj-pill[aria-pressed=true]").textContent, "Developing");
    const p = await load("stop-the-washout-erosion-design");
    assert.match(
      root().querySelector(".st-pj-tier-panel").textContent,
      new RegExp(p.supports.dev.frames[0].slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
    root().querySelector('[data-tier="ee"]').click();
    assert.match(root().querySelector(".st-pj-tier-panel").textContent, /The water moves/);
    assert.match(location.search + location.hash, /tier=ee/);
    root().querySelector('[data-tier="br"]').click();
    assert.match(root().querySelector(".st-pj-tier-panel").textContent, /No frames at this level/);
    await open("stop-the-washout-erosion-design", { tier: "exp" });
    assert.equal(root().querySelector(".st-pj-pill[aria-pressed=true]").textContent, "Expanding");
  });

  it("hands off to Resource Studio only for organizers it can build, and says why for the rest", async () => {
    await open("neighborhood-park-scale");
    const links = [...root().querySelectorAll("#st-pj-handoff .st-pj-org a")];
    assert.ok(links.length >= 1);
    for (const a of links)
      assert.match(a.getAttribute("href"), /^#\/create\?type=[a-z-]+&source=topic&title=/);
    const text = root().querySelector("#st-pj-handoff").textContent;
    assert.match(text, /Print this plan/);
    assert.match(text, /needs practice items/i, "an organizer that needs a lesson explains itself");
    const types = links.map((a) =>
      new URLSearchParams(a.getAttribute("href").split("?")[1]).get("type"),
    );
    assert.ok(types.includes("partner-project") && types.includes("gallery-walk"));
    assert.ok(!types.includes("math-explain"));
  });

  it("the action bar never sends a project to Resource Studio as if it were a lesson", async () => {
    await open("our-class-garden-what-plants-need");
    assert.equal(root().querySelectorAll('.st-actions a[href^="#/create"]').length, 0);
    assert.ok(
      [...root().querySelectorAll(".st-actions button")].some((b) =>
        /Print or export/.test(b.textContent),
      ),
    );
    assert.ok(root().querySelector(".st-actions .st-fav"), "favorite star");
  });

  it("shows starter sources when a project has them, and resolves vocabulary words", async () => {
    await open("position-paper-community-newsletter");
    assert.equal(root().querySelectorAll(".st-pj-source").length, 3);
    assert.match(root().textContent, /Invented for practice/);
    assert.ok(root().querySelectorAll(".st-pj-term").length >= 8);
    await open("neighborhood-park-scale");
    assert.ok(
      root().querySelector("#st-pj-language").textContent.includes("actual length"),
      "ids fall back to words when the set is missing",
    );
  });

  it("an unknown id gives a clear message with a way back", async () => {
    await open("no-such-project");
    assert.match(root().textContent, /not found/i);
    assert.ok(root().querySelector('a[href="#/projects"]'));
  });
});

describe("the sampling project's statistics", () => {
  const rowsOf = (visual) => visual.rows.flatMap((r) => r.slice(1).map(Number));
  const stats = (a) => {
    const mean = a.reduce((x, y) => x + y, 0) / a.length;
    const s = [...a].sort((x, y) => x - y);
    const median =
      a.length % 2 ? s[(a.length - 1) / 2] : (s[a.length / 2 - 1] + s[a.length / 2]) / 2;
    return {
      n: a.length,
      sum: a.reduce((x, y) => x + y, 0),
      mean,
      median,
      mad: a.reduce((x, y) => x + Math.abs(y - mean), 0) / a.length,
    };
  };

  it("matches the totals, means, medians and deviations written in the notes", async () => {
    const p = await load("homework-minutes-sampling-study");
    const g7 = rowsOf(p.visuals.find((v) => v.id === "grade7").visual);
    const g8 = rowsOf(p.visuals.find((v) => v.id === "grade8").visual);
    assert.deepEqual(stats(g7), { n: 40, sum: 1700, mean: 42.5, median: 40, mad: 12 });
    assert.deepEqual(stats(g8), { n: 40, sum: 2400, mean: 60, median: 60, mad: 12.75 });
    assert.equal(g7.slice(0, 10).reduce((a, b) => a + b, 0) / 10, 26);
    assert.equal(g8.slice(0, 10).reduce((a, b) => a + b, 0) / 10, 41);
    assert.ok(Math.abs((60 - 42.5) / 12.75 - 1.4) < 0.1);
    const prep = p.prep.join(" ");
    for (const s of [
      "1,700",
      "mean 42.5",
      "median 40",
      "deviation 12.",
      "sum 2,400",
      "mean 60",
      "12.75",
      "17.5",
    ])
      assert.ok(prep.includes(s), s);
  });

  it("matches the arithmetic in the position paper's starter sources", async () => {
    const p = await load("position-paper-community-newsletter");
    const text = p.sources.map((s) => s.text).join(" ");
    assert.ok(
      text.includes("Seventy-eight") && text.includes("120") && text.includes("65 percent"),
    );
    assert.equal(78 / 120, 0.65);
    assert.ok(text.includes("31 of the 120"));
    assert.equal(Math.round((31 / 120) * 100), 26);
  });
});
