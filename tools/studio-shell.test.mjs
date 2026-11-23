// Teacher Studio shell: router, prefs, classes, library, catalog, search, manifest builder, and the Home/Find views in jsdom.
//   node --test tools/studio-shell.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, beforeEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const REPO = fileURLToPath(new URL("..", import.meta.url));
const dom = new JSDOM('<!doctype html><html><body><main id="st-main"></main></body></html>', {
  url: "http://localhost/bcpss-teachers/studio/",
  pretendToBeVisual: true,
});
const w = dom.window;
w.scrollTo = () => {};
for (const k of ["window", "document", "localStorage", "location", "history"])
  Object.defineProperty(globalThis, k, { value: w[k], configurable: true, writable: true });
globalThis.FormData = w.FormData;
Object.defineProperty(globalThis, "navigator", { value: w.navigator, configurable: true });

const S = (p) => import(`../bcpss-teachers/studio/${p}`);
const store = await S("core/store.js");
const prefs = await S("core/prefs.js");
const classes = await S("core/classes.js");
const library = await S("core/library.js");
const { parseHash, buildHash, createRouter } = await S("core/router.js");
const { createCatalog, CatalogError } = await S("core/catalog.js");
const { searchItems, facetCounts } = await S("core/search.js");
const tick = (ms = 25) => new Promise((r) => setTimeout(r, ms));
const resetStore = () => {
  for (const k of store.keys("")) store.remove(k);
  localStorage.clear();
};

describe("router", () => {
  it("parses routes, ids, sub-routes and query", () => {
    const r = parseHash("#/vocab/g6-ratios/wall?x=1&y=a%20b");
    assert.equal(r.view, "vocab");
    assert.deepEqual(
      [r.params.id, r.params.sub, r.params.x, r.params.y],
      ["g6-ratios", "wall", "1", "a b"],
    );
    assert.equal(parseHash("").view, "home");
    assert.equal(parseHash("#/class/c-1").view, "classes");
    assert.equal(parseHash("#/class/c-1").params.route, "class");
    assert.equal(parseHash("#/project/p1").view, "projects");
    assert.equal(parseHash("#/nonsense").view, null);
    assert.equal(parseHash("#/constructor").view, null);
  });
  it("builds hashes and drops empty values", () => {
    assert.equal(buildHash("/find", { grade: "6", subject: "", q: null }), "#/find?grade=6");
    assert.equal(buildHash("/", {}), "#/");
  });

  describe("navigation", () => {
    let root;
    let calls;
    let cleaned;
    let router;
    const announced = [];
    const make = (views) => {
      root = document.getElementById("st-main");
      root.replaceChildren();
      calls = [];
      cleaned = 0;
      return createRouter({
        root,
        win: window,
        announce: (t) => announced.push(t),
        shell: { tag: "shell" },
        importView: async (name) => {
          calls.push(name);
          const v = views[name];
          if (v instanceof Error) throw v;
          if (typeof v === "function") return v();
          if (!v) throw new Error(`no file for ${name}`);
          return v;
        },
      });
    };
    const view = (title, extra = {}) => ({
      render({ root: r, params, shell }) {
        r.append(Object.assign(document.createElement("h1"), { textContent: title }));
        extra.seen?.({ params, shell });
        return () => {
          cleaned += 1;
        };
      },
    });
    after(() => router?.stop());

    it("renders, focuses the h1, titles the page, announces, runs cleanup, and supports back/forward", async () => {
      let seen;
      router = make({
        home: view("Home page"),
        find: view("Find page", { seen: (s) => (seen = s) }),
      });
      history.replaceState(null, "", location.pathname);
      await router.start();
      assert.equal(root.querySelector("h1").textContent, "Home page");
      assert.equal(document.activeElement, root.querySelector("h1"));
      assert.match(document.title, /Home page/);
      location.hash = "#/find?q=ratio";
      await tick();
      assert.equal(root.querySelector("h1").textContent, "Find page");
      assert.equal(seen.params.q, "ratio");
      assert.equal(seen.shell.tag, "shell");
      assert.equal(cleaned, 1);
      assert.ok(announced.some((t) => /Find page/.test(t)));
      history.back();
      await tick(60);
      assert.equal(root.querySelector("h1").textContent, "Home page");
      router.stop();
    });

    it("shows a retryable state when a view file is missing, then recovers", async () => {
      const views = { home: view("Home page") };
      router = make(views);
      location.hash = "#/library";
      await router.start();
      assert.match(root.querySelector("h1").textContent, /did not load/);
      assert.ok([...root.querySelectorAll("button")].some((b) => /try again/i.test(b.textContent)));
      views.library = view("Library page");
      [...root.querySelectorAll("button")].find((b) => /try again/i.test(b.textContent)).click();
      await tick();
      assert.equal(root.querySelector("h1").textContent, "Library page");
      router.stop();
    });

    it("never crashes when a view throws", async () => {
      router = make({
        library: {
          render() {
            throw new Error("boom");
          },
        },
        home: view("Home page"),
      });
      const warn = console.warn;
      console.warn = () => {};
      location.hash = "#/library";
      await router.start();
      console.warn = warn;
      assert.match(root.querySelector("h1").textContent, /did not load/);
      assert.equal(root.getAttribute("aria-busy"), null);
      router.stop();
    });

    it("shows Not found with search for unknown routes", async () => {
      router = make({ home: view("Home page") });
      location.hash = "#/no-such-place";
      await router.start();
      assert.match(root.querySelector("h1").textContent, /could not find/i);
      assert.ok(root.querySelector('input[type="search"]'));
      assert.match(document.title, /not found/i);
      router.stop();
    });

    it("ignores a slow view that was superseded", async () => {
      let release;
      const gate = new Promise((r) => (release = r));
      router = make({ find: async () => (await gate, view("Slow find")), home: view("Fast home") });
      location.hash = "#/find";
      router.start();
      await tick(5);
      location.hash = "#/";
      await tick();
      release();
      await tick();
      assert.equal(root.querySelector("h1").textContent, "Fast home");
      router.stop();
    });
  });
});

describe("prefs", () => {
  beforeEach(resetStore);
  it("starts with nothing chosen", () => {
    const p = prefs.getPrefs();
    assert.equal(p.grade, null);
    assert.equal(p.subject, null);
    assert.equal(prefs.hasContext(), false);
  });
  it("derives the band, rejects out-of-scope values, clamps scale", () => {
    assert.equal(prefs.setPrefs({ grade: "6" }).band, "6-8");
    assert.equal(prefs.setPrefs({ grade: "K" }).band, "k-2");
    assert.equal(prefs.setPrefs({ grade: "PK" }).grade, null);
    assert.equal(prefs.setPrefs({ grade: "11" }).grade, null);
    assert.equal(prefs.setPrefs({ subject: "astrology" }).subject, null);
    assert.equal(prefs.setPrefs({ scale: 9 }).scale, 1.6);
    prefs.setPrefs({ grade: "3", subject: "science" });
    assert.equal(prefs.hasContext(), true);
    prefs.clearContext();
    assert.equal(prefs.hasContext(), false);
  });
  it("notifies subscribers", () => {
    let n = 0;
    const off = prefs.onPrefs(() => n++);
    prefs.setPrefs({ projector: true });
    off();
    prefs.setPrefs({ projector: false });
    assert.equal(n, 1);
  });
});

describe("classes", () => {
  beforeEach(resetStore);
  const good = {
    nickname: "Period 3",
    grade: "6",
    subject: "math",
    proficiency: { ee: 4, dev: 8, exp: 6, br: 2 },
  };
  it("validates required fields with specific messages", () => {
    const r = classes.saveClass({ nickname: "", grade: "PK", subject: "" });
    assert.equal(r.ok, false);
    assert.deepEqual(Object.keys(r.errors).sort(), ["grade", "nickname", "subject"]);
    assert.equal(classes.listClasses().length, 0);
  });
  it("creates, edits, duplicates and deletes", () => {
    const a = classes.saveClass(good);
    assert.ok(a.ok && a.cls.id.startsWith("c-"));
    const edited = classes.saveClass({ ...a.cls, unit: "Unit 2" });
    assert.equal(edited.cls.id, a.cls.id);
    assert.equal(classes.listClasses().length, 1);
    assert.equal(classes.getClass(a.cls.id).unit, "Unit 2");
    const copy = classes.duplicateClass(a.cls.id);
    assert.notEqual(copy.id, a.cls.id);
    assert.match(copy.nickname, /\(copy\)/);
    assert.equal(classes.listClasses().length, 2);
    classes.deleteClass(a.cls.id);
    assert.equal(classes.getClass(a.cls.id), null);
    assert.equal(classes.listClasses().length, 1);
  });
  it("deleting a class removes its pasted evidence", async () => {
    const { cls } = classes.saveClass(good);
    store.write(`classev.${cls.id}`, [{ aid: "x" }]);
    classes.deleteClass(cls.id);
    assert.equal(store.read(`classev.${cls.id}`, null), null);
  });
  it("normalizes counts and percentages, and refuses percentages over 100", () => {
    const n = classes.normalize({
      ...good,
      proficiency: { ee: "3.6", dev: -2, exp: "x", br: 5000 },
    });
    assert.deepEqual(n.proficiency, { ee: 4, dev: 0, exp: 0, br: 1000 });
    assert.equal(
      classes.saveClass({
        ...good,
        proficiencyMode: "percent",
        proficiency: { ee: 60, dev: 60, exp: 0, br: 0 },
      }).ok,
      false,
    );
  });
  it("tierShares always sum to 100 and is null with no counts", () => {
    const s = classes.tierShares(
      classes.normalize({ ...good, proficiency: { ee: 1, dev: 1, exp: 1, br: 0 } }),
    );
    assert.equal(s.ee + s.dev + s.exp + s.br, 100);
    assert.equal(classes.tierShares(classes.normalize({ ...good, proficiency: {} })), null);
    assert.equal(classes.dominantTier(classes.normalize(good)), "dev");
  });
  it("ignores unknown fields so no roster can be stored", () => {
    const n = classes.normalize({ ...good, students: ["A. Student"], roster: "x" });
    assert.equal("students" in n, false);
    assert.equal("roster" in n, false);
  });
});

describe("library", () => {
  beforeEach(resetStore);
  const lesson = { kind: "lesson", id: "g6-math-x", title: "Ratios", grade: "6", subject: "math" };
  it("toggles favorites", () => {
    assert.equal(library.isFavorite(lesson), false);
    assert.equal(library.toggleFavorite(lesson), true);
    assert.equal(library.isFavorite(lesson), true);
    assert.equal(library.toggleFavorite(lesson), false);
    assert.equal(library.favorites().length, 0);
    assert.equal(library.toggleFavorite({ kind: "bogus", id: "x" }), false);
  });
  it("keeps recents most-recent-first without duplicates, capped", () => {
    library.addRecent(lesson);
    library.addRecent({ ...lesson, id: "b", title: "B" });
    library.addRecent(lesson);
    assert.deepEqual(
      library.recents().map((r) => r.id),
      ["g6-math-x", "b"],
    );
    for (let i = 0; i < 80; i++) library.addRecent({ ...lesson, id: `n${i}`, title: `N${i}` });
    assert.equal(library.recents().length, 60);
    assert.equal(library.recents()[0].id, "n79");
    assert.deepEqual(
      library.searchHistory("n79").map((r) => r.id),
      ["n79"],
    );
    assert.deepEqual(
      library
        .searchHistory("n5 n")
        .map((r) => r.id)
        .sort(),
      ["n50", "n51", "n52", "n53", "n54", "n55", "n56", "n57", "n58", "n59"].sort(),
    );
  });
  it("creates, renames, reorders and deletes bundles", () => {
    const b = library.createBundle("Week 1");
    library.addToBundle(b.id, lesson);
    library.addToBundle(b.id, { ...lesson, id: "two", title: "Two" });
    library.addToBundle(b.id, { ...lesson, id: "three", title: "Three" });
    library.moveInBundle(b.id, 2, 0);
    assert.deepEqual(
      library.getBundle(b.id).items.map((i) => i.id),
      ["three", "g6-math-x", "two"],
    );
    library.moveInBundle(b.id, 0, -1);
    assert.equal(library.getBundle(b.id).items[0].id, "three");
    library.removeFromBundle(b.id, 1);
    library.renameBundle(b.id, "  Renamed ");
    assert.equal(library.getBundle(b.id).name, "Renamed");
    assert.equal(library.getBundle(b.id).items.length, 2);
    library.deleteBundle(b.id);
    assert.equal(library.bundles().length, 0);
  });
  it("builds the student play link", () => {
    assert.equal(
      library.playUrl("act-1", { tier: "dev", lessonId: "l1" }),
      "/bcpss-teachers/studio/play/#a=act-1&t=dev&l=l1",
    );
    assert.equal(
      library.playUrl("act-1", { tier: "nope" }),
      "/bcpss-teachers/studio/play/#a=act-1",
    );
    assert.match(
      library.playUrl("a", { projector: true, origin: "https://x.test" }),
      /^https:\/\/x\.test\/bcpss-teachers\/studio\/play\/\?projector=1#a=a$/,
    );
  });
  it("exports without evidence unless chosen, and restores round-trip", () => {
    const { cls } = classes.saveClass({ nickname: "P1", grade: "4", subject: "ela" });
    library.toggleFavorite(lesson);
    library.createBundle("B");
    store.write(`classev.${cls.id}`, [{ aid: "q" }]);
    store.write("ev.act-9", [{ aid: "act-9" }]);
    store.write("progress.act-9", { step: 2 });
    const plain = library.exportWorkspace();
    assert.equal("evidence" in plain, false);
    const withEv = library.exportWorkspace({ includeEvidence: true });
    assert.deepEqual(Object.keys(withEv.evidence).sort(), [`classev.${cls.id}`, "ev.act-9"].sort());
    resetStore();
    const r = library.importWorkspace(JSON.stringify(withEv), { mode: "replace" });
    assert.equal(r.evidenceKeys, 0);
    assert.equal(r.hasEvidence, true);
    assert.equal(classes.listClasses().length, 1);
    assert.equal(library.favorites().length, 1);
    assert.equal(store.read("ev.act-9", null), null);
    assert.deepEqual(store.read("progress.act-9"), { step: 2 });
    library.importWorkspace(withEv, { mode: "merge", includeEvidence: true });
    assert.deepEqual(store.read("ev.act-9"), [{ aid: "act-9" }]);
    assert.equal(classes.listClasses().length, 1);
  });
  it("rejects bad files and never writes unknown keys", () => {
    assert.throws(() => library.importWorkspace("not json"), /could not be read/);
    assert.throws(
      () => library.importWorkspace(JSON.stringify({ app: "other", v: 1 })),
      /not a BCPSS Teacher Studio backup/,
    );
    const evil = {
      app: "bcpss-teacher-studio",
      v: 1,
      progress: { prefs: { grade: "9" }, "progress.ok": 1 },
      evidence: { "../x": [1], "ev.fine": [1] },
    };
    library.importWorkspace(evil, { includeEvidence: true });
    assert.equal(store.read("progress.ok"), 1);
    assert.equal(store.read("ev.fine")[0], 1);
    assert.equal(prefs.getPrefs().grade, null);
    assert.equal(store.read("../x", null), null);
  });
});

describe("catalog", () => {
  const manifest = {
    v: 1,
    standardsFiles: ["a.js"],
    items: [{ id: "l1", kind: "lesson", title: "L1", path: "data/lessons/l1.js" }],
  };
  const make = (over = {}) => {
    const log = [];
    const cat = createCatalog({
      base: new URL("http://localhost/bcpss-teachers/studio/"),
      fetchJson: async (u) => {
        log.push(u);
        if (over.fail?.(u)) throw new Error("offline");
        return u.endsWith("manifest.json") ? manifest : { units: [{ id: "u1" }] };
      },
      importModule: async (u) => {
        log.push(u);
        return {
          default: u.includes("standards") ? [{ code: "6.RP.A.1" }] : { id: "l1", title: "L1" },
        };
      },
    });
    return { cat, log };
  };
  it("caches the manifest and loads data modules by manifest path", async () => {
    const { cat, log } = make();
    assert.equal((await cat.manifest()).length, 1);
    await cat.manifest();
    assert.equal(log.filter((u) => u.endsWith("manifest.json")).length, 1);
    assert.equal((await cat.lesson("l1")).title, "L1");
    assert.ok(log.some((u) => u.endsWith("/data/lessons/l1.js")));
    assert.equal((await cat.standard("6.RP.A.1")).code, "6.RP.A.1");
    await assert.rejects(() => cat.lesson("missing"), CatalogError);
  });
  it("does not cache failures, so retry works", async () => {
    let down = true;
    const { cat } = make({ fail: () => down });
    await assert.rejects(() => cat.manifest(), CatalogError);
    down = false;
    assert.equal((await cat.manifest()).length, 1);
  });
  it("asks the seed API only for K-8 ELA/Math/Science/Social Studies", async () => {
    const { cat, log } = make();
    assert.deepEqual(await cat.seedUnits("6", "esol"), []);
    assert.deepEqual(await cat.seedUnits("PK", "math"), []);
    assert.deepEqual(await cat.seedUnits("9", "math"), []);
    assert.equal((await cat.seedUnits("6", "math")).length, 1);
    assert.ok(log.includes("/api/bcpss/units?grade=6&subject=Math"));
  });
  it("seed failures throw and are retried", async () => {
    let down = true;
    const { cat } = make({ fail: (u) => down && u.includes("/api/") });
    await assert.rejects(() => cat.seedUnits("3", "ela"), CatalogError);
    down = false;
    assert.equal((await cat.seedUnits("3", "ela")).length, 1);
  });
});

describe("search", () => {
  const items = [
    {
      id: "a",
      kind: "lesson",
      title: "Ratio Tables",
      grade: "6",
      band: "6-8",
      subject: "math",
      standards: ["6.RP.A.3"],
      vocab: ["ratio", "rate"],
      klus: ["Explain"],
      domains: ["Speaking"],
      lo: "I can explain how two quantities change together.",
    },
    {
      id: "b",
      kind: "vocab",
      title: "Math Words About Rates",
      grade: "6",
      band: "6-8",
      subject: "math",
      standards: ["6.RP.A.2"],
      vocab: ["unit rate", "ratio"],
    },
    {
      id: "c",
      kind: "lesson",
      title: "How Plants Make Food",
      grade: "5",
      band: "3-5",
      subject: "science",
      standards: ["5-LS1-1"],
      vocab: ["photosynthesis"],
      klus: ["Explain"],
      domains: ["Writing"],
    },
    {
      id: "d",
      kind: "activity",
      title: "Ratio Detective",
      grade: "7",
      band: "6-8",
      subject: "math",
      engine: "language-detective",
      standards: [],
    },
    {
      id: "e",
      kind: "wida",
      title: "Describe the Garden",
      band: "k-2",
      subject: "esol",
      klus: ["Inform"],
      domains: ["Speaking"],
    },
  ];
  it("ranks exact standard code and title above weaker matches", () => {
    assert.equal(searchItems(items, "6.RP.A.3")[0].id, "a");
    assert.equal(searchItems(items, "ratio tables")[0].id, "a");
    const r = searchItems(items, "ratio").map((i) => i.id);
    assert.equal(r[0], "d", "a title-word match outranks a vocabulary-only match");
    assert.deepEqual(r.slice().sort(), ["a", "b", "d"]);
  });
  it("matches vocabulary words, KLUs and language objectives, and requires every word", () => {
    assert.deepEqual(
      searchItems(items, "photosynthesis").map((i) => i.id),
      ["c"],
    );
    assert.deepEqual(
      searchItems(items, "inform").map((i) => i.id),
      ["e"],
    );
    assert.deepEqual(
      searchItems(items, "quantities change").map((i) => i.id),
      ["a"],
    );
    assert.deepEqual(searchItems(items, "ratio photosynthesis"), []);
  });
  it("is stable and deterministic", () => {
    assert.deepEqual(
      searchItems(items, "").map((i) => i.id),
      searchItems([...items].reverse(), "").map((i) => i.id),
    );
  });
  it("filters by grade, falling back to the band when an item has no grade", () => {
    assert.deepEqual(
      searchItems(items, "", { grade: "K" }).map((i) => i.id),
      ["e"],
    );
    assert.deepEqual(
      searchItems(items, "", { grade: "6", subject: "math" })
        .map((i) => i.id)
        .sort(),
      ["a", "b", "d"].filter((i) => i !== "d"),
    );
    assert.deepEqual(
      searchItems(items, "", { grade: "7", subject: "math" })
        .map((i) => i.id)
        .sort(),
      ["d", "e"].filter((i) => i === "d"),
    );
  });
  it("never offers a filter value with zero results", () => {
    const f = facetCounts(items, "ratio", { subject: "math" });
    for (const group of Object.values(f)) for (const n of Object.values(group)) assert.ok(n > 0);
    assert.equal(
      "science" in f.subject,
      false,
      "other facets ignore their own selection but respect the query",
    );
    assert.equal("wida" in f.kind, false);
    const narrowed = facetCounts(items, "", { subject: "math", kind: "lesson" });
    assert.deepEqual(Object.keys(narrowed.domain), ["Speaking"]);
    assert.equal("Writing" in narrowed.domain, false);
    assert.equal(narrowed.kind.vocab, 1, "a facet counts results as if its own filter were off");
  });
});

describe("manifest builder", () => {
  let dir;
  const lesson = (id, extra = "") =>
    `export default { id: "${id}", title: "Lesson ${id}", grade: "6", subject: "math", duration: 45, standards: ["6.RP.A.1"], wida: { klus: ["Explain"], domains: ["Speaking"] }, languageObjective: "I can explain ratios.", vocab: { collection: "v1", ids: ["ratio"] }${extra} };`;
  before(() => {
    dir = mkdtempSync(join(tmpdir(), "studio-manifest-"));
    for (const d of [`lesson${"s"}`, "vocab", "activities", "wida", "projects", "standards"])
      mkdirSync(join(dir, "data", d), { recursive: true });
    writeFileSync(
      join(dir, "data/vocab/v1.js"),
      'export default { id: "v1", title: "Ratio words", grade: "6", subject: "math", entries: [{ id: "ratio", word: "ratio" }, { id: "rate", word: "rate" }] };',
    );
    writeFileSync(join(dir, "data/lessons/b.js"), lesson("b"));
    writeFileSync(join(dir, "data/lessons/a.js"), lesson("a"));
    writeFileSync(
      join(dir, "data/activities/x.js"),
      'export default { id: "x", title: "Ratio game", engine: "concept-builder", lessonId: "a", grade: "6", subject: "math", minutes: 15 };',
    );
    writeFileSync(
      join(dir, "data/wida/w.js"),
      'export default { id: "w", title: "Explain a pattern", domain: "Speaking", band: "6-8", subject: "esol", klus: ["Explain"] };',
    );
    writeFileSync(join(dir, "data/standards/s.js"), "export default [];");
  });
  after(() => rmSync(dir, { recursive: true, force: true }));
  const run = (...args) =>
    spawnSync("node", [join(REPO, "tools/build-studio-manifest.mjs"), "--root", dir, ...args], {
      encoding: "utf8",
    });

  it("is deterministic and sorted by kind then id", async () => {
    const { buildManifest } = await import("./build-studio-manifest.mjs");
    const one = await buildManifest(dir);
    const two = await buildManifest(dir);
    assert.equal(one, two);
    const m = JSON.parse(one);
    assert.deepEqual(
      m.items.map((i) => `${i.kind}:${i.id}`),
      ["lesson:a", "lesson:b", "vocab:v1", "activity:x", "wida:w"],
    );
    assert.deepEqual(m.standardsFiles, ["s.js"]);
    const a = m.items[0];
    assert.deepEqual(a.vocab, ["ratio"]);
    assert.equal(a.band, "6-8");
    assert.equal(a.path, "data/lessons/a.js");
    assert.deepEqual(
      m.items.find((i) => i.id === "x").vocab,
      ["ratio"],
      "an activity inherits its lesson's words",
    );
    assert.deepEqual(m.items.find((i) => i.id === "w").domains, ["Speaking"]);
    assert.ok(!/\d{4}-\d{2}-\d{2}T/.test(one), "no timestamps");
  });
  it("--check fails when stale and passes after a rebuild", () => {
    assert.equal(run().status, 0);
    assert.equal(run("--check").status, 0);
    writeFileSync(join(dir, "data/lessons/c.js"), lesson("c"));
    const stale = run("--check");
    assert.equal(stale.status, 1);
    assert.match(stale.stderr, /stale/);
    assert.equal(run().status, 0);
    assert.equal(run("--check").status, 0);
    assert.equal(JSON.parse(readFileSync(join(dir, "data/manifest.json"), "utf8")).items.length, 6);
  });
  it("refuses grades outside K-8 and duplicate ids", async () => {
    const { buildManifest } = await import("./build-studio-manifest.mjs");
    writeFileSync(
      join(dir, "data/lessons/hs.js"),
      lesson("hs").replace('grade: "6"', 'grade: "10"'),
    );
    await assert.rejects(() => buildManifest(dir), /outside K-8/);
    rmSync(join(dir, "data/lessons/hs.js"));
    writeFileSync(join(dir, "data/lessons/dup.js"), lesson("a"));
    await assert.rejects(() => buildManifest(dir), /duplicate lesson:a/);
    rmSync(join(dir, "data/lessons/dup.js"));
  });
});

describe("home and find views", () => {
  const manifest = [
    {
      id: "g6-math-ratios",
      kind: "lesson",
      title: "Ratio Tables",
      grade: "6",
      band: "6-8",
      subject: "math",
      standards: ["6.RP.A.3"],
      duration: 45,
    },
    {
      id: "g4-esol-garden",
      kind: "lesson",
      title: "Describe the Garden",
      grade: "4",
      band: "3-5",
      subject: "esol",
      standards: [],
    },
    {
      id: "g4-arts-color",
      kind: "lesson",
      title: "Mixing Colors",
      grade: "4",
      band: "3-5",
      subject: "arts",
      standards: [],
    },
  ];
  let shell;
  let announced;
  beforeEach(() => {
    resetStore();
    announced = [];
    document.getElementById("st-main").replaceChildren();
    const catalog = {
      manifest: async () => manifest,
      seedUnits: async (g, s) =>
        g === "6" && s === "math"
          ? [
              {
                id: "g6-math-u1",
                unit_number: 1,
                unit_title: "Ratios and Rates",
                unit_summary: "Compare quantities.",
                curriculum_name: "Reveal Math",
                core_standards: ["6.RP.A.1"],
                primary_klu: "Explain",
                activity_count: 2,
              },
            ]
          : [],
      lesson: async () => ({}),
    };
    shell = {
      prefs,
      classes,
      library,
      catalog,
      announce: (t) => announced.push(t),
      setTitle() {},
      replaceHash() {},
      nav() {},
      projector: { get: () => false, toggle: () => false },
      openActivity() {},
    };
  });
  const root = () => document.getElementById("st-main");
  const text = (sel) => [...root().querySelectorAll(sel)].map((e) => e.textContent.trim());

  it("home has the three primary actions, no preselection, and no pick-up strip without data", async () => {
    const { render } = await S("views/home.js");
    await render({ root: root(), params: {}, shell });
    assert.deepEqual(text(".st-action-card h2"), [
      "Find my lesson",
      "Prepare my class",
      "Launch an activity",
    ]);
    assert.equal(root().querySelector(".st-strip"), null);
    assert.equal(root().querySelector('[aria-current="true"]'), null);
    assert.deepEqual(text(".st-band h3"), ["Grades K–2", "Grades 3–5", "Grades 6–8"]);
    const grades = text(".st-band .st-pick");
    assert.equal(grades.length, 9);
    assert.ok(!grades.some((g) => /Pre-K|Grade (9|1[0-2])/.test(g)));
    assert.equal(
      text(".st-pills .st-pick").filter((t) => /^(Mathematics|Visual & Performing Arts)$/.test(t))
        .length,
      2,
    );
    assert.match(root().querySelector(".st-tip").textContent, /Tip/);
  });
  it("home shows returning context and the strip once there is data", async () => {
    const { render } = await S("views/home.js");
    prefs.setPrefs({ grade: "6", subject: "math" });
    library.addRecent({ kind: "lesson", id: "g6-math-ratios", title: "Ratio Tables" });
    await render({ root: root(), params: {}, shell });
    assert.match(root().querySelector(".st-tip").textContent, /Grade 6/);
    assert.ok(root().querySelector(".st-strip"));
    assert.ok(root().querySelector('a[href="#/find?change=1"]'));
    assert.equal(
      root().querySelector('a.st-pick[href="#/find?grade=6"]').getAttribute("aria-current"),
      "true",
    );
  });
  it("find: seed units plus studio lessons for a district-referenced combination", async () => {
    const { render } = await S("views/find.js");
    await render({ root: root(), params: { grade: "6", subject: "math" }, shell });
    await tick(40);
    assert.match(root().textContent, /Unit 1: Ratios and Rates/);
    assert.match(root().textContent, /Ratio Tables/);
    assert.doesNotMatch(root().textContent, /Standards-aligned pathway/);
    assert.deepEqual(prefs.getPrefs().subject, null, "reading params does not write preferences");
  });
  it("find: other subjects get the pathway label and no district units", async () => {
    const { render } = await S("views/find.js");
    await render({ root: root(), params: { grade: "4", subject: "esol" }, shell });
    await tick(40);
    assert.match(
      root().textContent,
      /Standards-aligned pathway \(not a district-verified unit sequence\)/,
    );
    assert.match(root().textContent, /Describe the Garden/);
    assert.equal(root().querySelector("#st-units-h"), null);
  });
  it("find: subject choices after a grade hide subjects with nothing to show", async () => {
    const { render } = await S("views/find.js");
    await render({ root: root(), params: { grade: "4" }, shell });
    const subjects = text('#st-s2 ~ ul .st-pick, section[aria-labelledby="st-s2"] .st-pick');
    assert.ok(
      subjects.some((s) => /Mathematics/.test(s)),
      "district subjects are offered for grade 4",
    );
    assert.ok(subjects.some((s) => /ESOL/.test(s)));
    assert.ok(subjects.some((s) => /Visual & Performing Arts/.test(s)));
    assert.ok(
      !subjects.some((s) => /Career/.test(s)),
      "a subject with no materials and no district units is not offered",
    );
  });
  it("find: search shows ranked results, a count, and a helpful empty state", async () => {
    const { render } = await S("views/find.js");
    await render({ root: root(), params: { q: "6.RP.A.3" }, shell });
    assert.deepEqual(text(".st-result .st-card-title"), ["Ratio Tables"]);
    assert.match(root().querySelector('[role="status"].st-count').textContent, /1 studio result/);
    root().replaceChildren();
    await render({ root: root(), params: { q: "zzzz" }, shell });
    assert.match(root().querySelector(".st-empty h3").textContent, /Nothing matches/);
    assert.ok(root().querySelector(".st-empty button"));
  });
  it("find: sets prefs only when the teacher chooses", async () => {
    const { render } = await S("views/find.js");
    await render({ root: root(), params: {}, shell });
    const pick = [
      ...root().querySelectorAll("#st-s1 ~ ul .st-pick, section[aria-labelledby='st-s1'] .st-pick"),
    ].find((b) => /Grade 4/.test(b.textContent));
    pick.click();
    assert.equal(prefs.getPrefs().grade, "4");
  });
  it("find: change=1 clears the remembered context", async () => {
    const { render } = await S("views/find.js");
    prefs.setPrefs({ grade: "5", subject: "science" });
    await render({ root: root(), params: { change: "1" }, shell });
    assert.equal(prefs.hasContext(), false);
    assert.equal(root().querySelector('.st-pick[aria-pressed="true"]'), null);
  });
});

describe("classes views", () => {
  let shell;
  const root = () => document.getElementById("st-main");
  beforeEach(() => {
    resetStore();
    root().replaceChildren();
    shell = {
      prefs,
      classes,
      library,
      catalog: {},
      announce() {},
      setTitle() {},
      replaceHash() {},
      nav() {},
      projector: { get: () => false, toggle: () => false },
    };
  });
  it("list shows an empty state, then the class card", async () => {
    const { render } = await S("views/classes.js");
    await render({ root: root(), params: { route: "classes" }, shell });
    assert.match(root().textContent, /No classes yet/);
    classes.saveClass({
      nickname: "Room 214",
      grade: "3",
      subject: "ela",
      proficiency: { ee: 2, dev: 3, exp: 1, br: 0 },
    });
    root().replaceChildren();
    await render({ root: root(), params: { route: "classes" }, shell });
    assert.match(root().textContent, /Room 214/);
    assert.ok(root().querySelector(".st-dist"));
  });
  it("new-class form states the no-names rule and submits through saveClass", async () => {
    const { render } = await S("views/classes.js");
    await render({ root: root(), params: { route: "classes", new: "1" }, shell });
    assert.match(root().querySelector(".st-privacy").textContent, /No student names/);
    assert.equal(root().querySelectorAll('input[name="nickname"]').length, 1);
    assert.equal(
      root().querySelectorAll('select[name="grade"] option').length,
      10,
      "K-8 plus the prompt",
    );
    const form = root().querySelector("form");
    form.dispatchEvent(new window.Event("submit", { cancelable: true }));
    assert.ok(root().querySelector('[role="alert"]'), "required fields are reported");
    assert.equal(classes.listClasses().length, 0);
    const f = root().querySelector("form");
    f.querySelector('[name="nickname"]').value = "Period 5";
    f.querySelector('[name="grade"]').value = "7";
    f.querySelector('[name="subject"]').value = "science";
    f.querySelector('[name="prof-dev"]').value = "6";
    f.dispatchEvent(new window.Event("submit", { cancelable: true }));
    const saved = classes.listClasses();
    assert.equal(saved.length, 1);
    assert.deepEqual(
      [saved[0].nickname, saved[0].grade, saved[0].proficiency.dev],
      ["Period 5", "7", 6],
    );
  });
  it("class page renders the profile and degrades when dash.js and evidence.js are absent", async () => {
    const { render } = await S("views/classes.js");
    const { cls } = classes.saveClass({
      nickname: "P2",
      grade: "6",
      subject: "math",
      proficiency: { ee: 1, dev: 1, exp: 1, br: 1 },
    });
    await render({ root: root(), params: { route: "class", id: cls.id }, shell });
    await tick(150);
    assert.equal(root().querySelector("h1").textContent, "P2");
    assert.match(root().textContent, /Recommended pathway/);
    assert.ok(root().querySelector(`a[href="#/prepare?class=${cls.id}"]`));
    assert.ok(root().querySelector("#st-ev-codes"));
    assert.match(root().querySelector("#st-evidence").textContent, /evidence|attempt|Class/i);
  });
  it("an unknown class id is a friendly message, not a crash", async () => {
    const { render } = await S("views/classes.js");
    await render({ root: root(), params: { route: "class", id: "c-nope" }, shell });
    assert.match(root().querySelector("h1").textContent, /not on this device/);
  });
});
