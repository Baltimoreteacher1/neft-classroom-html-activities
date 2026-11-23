// WIDA view layer: pure data helpers, evidence aggregation, the pathway built from the real manifest, and the hub,
// collection page and path page rendered in jsdom against the real data files.
//   node --test tools/studio-wida-view.test.mjs
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { before, beforeEach, describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
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
const {
  buildIndex,
  describe: describeEntry,
  filterEntries,
  facetCounts,
  readFilters,
  sortEntries,
  playLink,
} = await import(U("views/wida/data.js"));
const { aggregate, taskNote } = await import(U("views/wida/aggregate.js"));
const { buildPathway, normalizeProfile } = await import(U("core/wida-path.js"));
const { validateCollection } = await import(U("engines/wida/validate.js"));
const { encodeCode } = await import(U("core/evidence.js"));
const { createCatalog } = await import(U("core/catalog.js"));
const widaView = await import(U("views/wida.js"));
const classesCore = await import(U("core/classes.js"));
const libraryCore = await import(U("core/library.js"));
const prefsCore = await import(U("core/prefs.js"));

let manifestText;
let items;
before(async () => {
  manifestText = await buildManifest();
  items = JSON.parse(manifestText).items;
});

const wida = () => items.filter((i) => i.kind === "wida");

describe("data helpers", () => {
  it("describes manifest entries and rejects everything else", () => {
    const e = describeEntry({
      kind: "wida",
      id: "wida-x",
      title: "T",
      domains: ["Listening"],
      grade: "4",
      subject: "esol",
      klus: ["Explain"],
    });
    assert.equal(e.domain, "Listening");
    assert.equal(e.cluster, "4-5");
    assert.equal(e.band, "3-5");
    assert.equal(describeEntry({ kind: "lesson", id: "a" }), null);
    assert.equal(describeEntry({ kind: "wida", id: "a", domains: ["Dancing"], grade: "4" }), null);
    assert.equal(describeEntry({ kind: "wida", id: "a", domains: ["Reading"], grade: "10" }), null);
  });

  it("builds an index from the real manifest with every collection and a domain lookup", () => {
    const idx = buildIndex(items);
    assert.equal(idx.wida.length, wida().length);
    assert.ok(idx.wida.length >= 2);
    for (const c of idx.wida) assert.equal(idx.domainOf(c.id), c.domain);
    assert.equal(idx.domainOf("nope"), null);
  });

  it("reads filters defensively and never passes unknown values through", () => {
    assert.deepEqual(readFilters({ cluster: "9-12", domain: "Dancing", tier: "zz" }), {
      cluster: "",
      domain: "",
      subject: "",
      tier: "dev",
      q: "",
    });
    assert.equal(readFilters({ cluster: "4-5", domain: "Speaking", tier: "br" }).tier, "br");
    assert.equal(readFilters({}, { cluster: "6-8" }).cluster, "6-8");
    assert.equal(readFilters({ cluster: "" }, { cluster: "6-8" }).cluster, "");
  });

  it("filters by cluster, domain, subject and text; counts ignore the facet's own choice", () => {
    const entries = sortEntries(buildIndex(items).wida);
    const g4 = filterEntries(entries, { cluster: "4-5", domain: "", subject: "", q: "" });
    assert.ok(g4.length >= 2 && g4.every((c) => c.cluster === "4-5"));
    assert.equal(
      filterEntries(entries, { cluster: "6-8", domain: "", subject: "", q: "" }).length,
      0,
    );
    assert.ok(
      filterEntries(entries, { cluster: "", domain: "Speaking", subject: "", q: "" }).every(
        (c) => c.domain === "Speaking",
      ),
    );
    assert.ok(
      filterEntries(entries, { cluster: "", domain: "", subject: "", q: "water" }).length >= 1,
    );
    const f = { cluster: "4-5", domain: "Listening", subject: "", q: "" };
    const counts = facetCounts(entries, f);
    assert.equal(
      counts.clusters["4-5"],
      filterEntries(entries, { ...f, cluster: "" }).filter((c) => c.cluster === "4-5").length,
    );
    assert.equal(
      counts.domains.Speaking,
      filterEntries(entries, { ...f, domain: "" }).filter((c) => c.domain === "Speaking").length,
    );
  });

  it("builds student links through the player and adds the independent flag", () => {
    const shell = { library: libraryCore };
    const url = playLink(shell, "wida-a", { tier: "ee" });
    assert.match(url, /play\/#a=wida-a&t=ee$/);
    assert.match(
      playLink(shell, "wida-a", { tier: "br", independent: true }),
      /&t=br&p=independent$/,
    );
  });
});

describe("evidence aggregation", () => {
  const att = (aid, items, tier = "dev") => ({
    v: 1,
    aid,
    eng: "wida-studio",
    t: "2026-11-23T00:00:00Z",
    tier,
    items,
  });
  const it_ = (id, ok, extra = {}) => ({
    id,
    tries: 1,
    hints: 0,
    ok,
    tags: ["domain:Listening", "mode:instructional", ...(extra.tags || [])],
    ...extra,
    tags: ["domain:Listening", "mode:instructional", ...(extra.tags || [])],
  });
  const domainOf = (aid) => (aid === "c1" ? "Listening" : null);

  it("ignores other engines, reports counts, and withholds patterns below three attempts", () => {
    const two = [
      att("c1", [it_("l1", true)]),
      att("c1", [it_("l1", false)]),
      { v: 1, aid: "x", eng: "visual-match", items: [] },
    ];
    const a = aggregate(two, { domainOf });
    assert.equal(a.total, 2);
    assert.equal(a.ignored, 1);
    assert.equal(a.domains.find((d) => d.domain === "Listening").signal, "unknown");
    assert.match(
      a.domains.find((d) => d.domain === "Listening").statement,
      /2 attempts in Listening/,
    );
    assert.equal(a.collections[0].enough, false);
    assert.equal(taskNote(a.collections[0].tasks[0]), "");
  });

  it("at three attempts it reports counts and a next step, never a score", () => {
    const many = [
      att("c1", [it_("l2", false, { tags: ["heat-confusion"] })]),
      att("c1", [it_("l2", false, { tags: ["heat-confusion"] })]),
      att("c1", [it_("l2", true)], "ee"),
    ];
    const a = aggregate(many, { domainOf });
    const t = a.collections[0].tasks[0];
    assert.equal(a.collections[0].enough, true);
    assert.deepEqual([t.n, t.scored, t.correct], [3, 3, 1]);
    assert.deepEqual(t.tags, [["heat-confusion", 2]]);
    assert.deepEqual(a.tags, [["heat-confusion", 2]]);
    assert.equal(a.tiers.ee, 1);
    assert.match(taskNote(t), /Many students missed/);
    assert.doesNotMatch(JSON.stringify(a), /ACCESS level|proficiency level \d/);
  });

  it("counts unscored (speaking and writing) items as completion only", () => {
    const u = [1, 2, 3].map(() =>
      att("s1", [
        {
          id: "w1",
          tries: 1,
          hints: 0,
          ok: true,
          tags: ["domain:Writing", "mode:instructional", "unscored"],
        },
      ]),
    );
    const a = aggregate(u, { domainOf: () => "Writing" });
    assert.equal(a.collections[0].tasks[0].scored, 0);
    assert.equal(a.domains.find((d) => d.domain === "Writing").attempts, 3);
  });

  it("round-trips real evidence codes (decoded attempts feed straight in)", async () => {
    const { decodeCode } = await import(U("core/evidence.js"));
    const code = encodeCode(att("c1", [it_("l1", true)]));
    assert.equal(aggregate([decodeCode(code)], { domainOf }).total, 1);
  });
});

describe("pathway from the real manifest", () => {
  it("covers all four domains, never lowers content demand, and adapts only with enough evidence", () => {
    const index = buildIndex(items);
    const profile = normalizeProfile({
      grade: "4",
      subject: "esol",
      proficiency: { ee: 3, dev: 10, exp: 5, br: 2 },
    });
    const path = buildPathway({ profile, index, evidence: [], length: 7 });
    for (const d of ["Listening", "Speaking", "Reading", "Writing"])
      assert.ok(path.domainsCovered.includes(d), d);
    for (const s of path.steps)
      if (s.resource?.kind === "wida") assert.ok(Number(s.resource.grade) >= 4);
    assert.equal(path.basis, "profile");
    const att = (i) => ({
      v: 1,
      aid: "wida-g4-esol-explain-how-things-work-listening",
      eng: "wida-studio",
      tier: "dev",
      items: [
        {
          id: `l${i}`,
          tries: 3,
          hints: 3,
          ok: false,
          tags: ["domain:Listening", "mode:instructional"],
        },
      ],
    });
    const adapted = buildPathway({ profile, index, evidence: [att(1), att(2), att(3)], length: 7 });
    assert.deepEqual(adapted.adaptedDomains, ["Listening"]);
    const twoOnly = buildPathway({ profile, index, evidence: [att(1), att(2)], length: 7 });
    assert.deepEqual(twoOnly.adaptedDomains, []);
  });
});

describe("collections: data integrity for the view", () => {
  const dir = join(STUDIO_ROOT, "data/wida");
  const files = readdirSync(dir).filter((f) => f.endsWith(".js"));
  for (const f of files) {
    it(`${f} passes the engine validator and every listening task has its own transcript`, async () => {
      const c = (await import(pathToFileURL(join(dir, f)).href)).default;
      assert.deepEqual(
        validateCollection(c, { standards: null }).filter((e) => !/standard/i.test(e)),
        [],
      );
      if (c.domain === "Listening")
        for (const t of c.tasks) assert.ok(t.audio?.transcript, `${c.id} ${t.id}`);
    });
  }

  it("listening transcripts contain what their questions ask about", async () => {
    const c = (await import(U("data/wida/wida-g4-esol-explain-how-things-work-listening.js")))
      .default;
    const T = Object.fromEntries(c.tasks.map((t) => [t.id, t.audio.transcript.toLowerCase()]));
    assert.match(T.l2, /air up there is cold/);
    assert.match(T.l3, /because/);
    assert.match(T.l3, /, so /);
    assert.match(T.l3, /first/);
    assert.match(T.l3, /finally/);
    for (const answer of ["vapor", "drops", "rain", "rivers"])
      assert.ok(T.l5.includes(answer), answer);
  });
});

describe("views in jsdom", () => {
  const docFor = (id) => import(pathToFileURL(join(STUDIO_ROOT, `data/wida/${id}.js`)).href);
  const catalog = createCatalog({
    base: new URL(pathToFileURL(`${STUDIO_ROOT}/`)),
    fetchJson: async (url) =>
      String(url).endsWith("manifest.json")
        ? JSON.parse(manifestText)
        : Promise.reject(new Error("no network")),
    importModule: (url) => import(url),
  });
  const shell = () => ({
    catalog,
    library: libraryCore,
    classes: classesCore,
    prefs: prefsCore,
    announce: () => {},
    setTitle: (t) => (document.title = t),
    replaceHash: (h) => history.replaceState(null, "", `/bcpss-teachers/studio/${h}`),
    projector: { get: () => false, toggle: () => false },
  });
  const root = () => document.getElementById("st-main");
  const settle = () => new Promise((r) => setTimeout(r, 30));
  beforeEach(() => {
    localStorage.clear();
    root().replaceChildren();
  });

  it("hub: framing line, filters, every collection card, honest copy", async () => {
    await widaView.render({ root: root(), params: { route: "wida" }, shell: shell() });
    const text = root().textContent;
    assert.match(text, /WIDA-aligned original practice/);
    assert.match(text, /not official WIDA or ACCESS items/i);
    assert.match(text, /untimed/i);
    assert.equal(root().querySelectorAll(".st-wida-card").length, wida().length);
    assert.equal(root().querySelectorAll('[aria-label="Grade cluster"] button').length, 6);
    assert.equal(root().querySelectorAll('[aria-label="Domain"] button').length, 5);
    assert.equal(root().querySelectorAll('[aria-label="Support level"] button').length, 4);
    assert.ok(root().querySelector(".st-wida-frames"), "frames panel");
    assert.ok(root().querySelector(".st-wida-evidence"), "class results section");
    assert.doesNotMatch(text, /predicts?\b.*ACCESS|your ACCESS score/i);
  });

  it("hub: domain filter narrows the list and says so; an empty filter offers a way out", async () => {
    await widaView.render({
      root: root(),
      params: { route: "wida", domain: "Speaking" },
      shell: shell(),
    });
    const cards = [...root().querySelectorAll(".st-wida-card")];
    assert.ok(cards.length >= 1 && cards.every((c) => c.dataset.domain === "Speaking"));
    await widaView.render({
      root: root(),
      params: { route: "wida", cluster: "6-8" },
      shell: shell(),
    });
    assert.equal(root().querySelectorAll(".st-wida-card").length, 0);
    assert.match(root().textContent, /Nothing matches yet/);
    root().querySelector(".st-empty button").click();
    assert.ok(root().querySelectorAll(".st-wida-card").length >= 1);
  });

  it("hub: pasted evidence codes become class results with counts, and junk is refused", async () => {
    await widaView.render({ root: root(), params: { route: "wida" }, shell: shell() });
    const mk = (ok) =>
      encodeCode({
        aid: "wida-g4-esol-explain-how-things-work-listening",
        eng: "wida-studio",
        tier: "dev",
        t: "2026-11-23T00:00:00Z",
        items: [
          { id: "l2", tries: 1, hints: 0, ok, tags: ["domain:Listening", "mode:instructional"] },
        ],
      });
    root().querySelector("#st-wida-ev-codes").value = `${mk(true)}\n${mk(false)}\nLPE1.junk`;
    [...root().querySelectorAll(".st-wida-evidence .st-btn-primary")][0].click();
    await settle();
    await settle();
    const ev = root().querySelector(".st-wida-evidence");
    assert.match(ev.textContent, /2 practice attempts counted/);
    assert.match(ev.textContent, /2 attempts in Listening/);
    assert.match(ev.textContent, /Not enough practice evidence yet/);
    assert.match(ev.textContent, /not a WIDA score/i);
    assert.match(ev.textContent, /A code could not be read/);
  });

  it("collection page: teacher guide, tasks at the chosen tier, launch links, tier switch", async () => {
    const id = "wida-g4-esol-explain-how-things-work-listening";
    await widaView.render({ root: root(), params: { route: "wida", id }, shell: shell() });
    assert.equal(root().querySelector("h1").textContent, (await docFor(id)).default.title);
    assert.equal(root().querySelectorAll(".st-wida-task").length, 5);
    assert.match(root().textContent, /Teacher guide/);
    assert.match(root().textContent, /Start independent practice/);
    assert.match(root().textContent, /Preview here as a teacher/);
    const ee = [...root().querySelectorAll('[aria-label="Support level"] button')].find(
      (b) => b.textContent === "Entering/Emerging",
    );
    ee.click();
    const pressed = () =>
      [...root().querySelectorAll('[aria-label="Support level"] button')].find(
        (b) => b.getAttribute("aria-pressed") === "true",
      );
    assert.equal(pressed().textContent, "Entering/Emerging");
    assert.match(
      root().querySelector(".st-wida-task").textContent,
      /Supports at Entering\/Emerging/,
    );
    assert.match(root().querySelector(".st-wida-task").textContent, /first/);
  });

  it("collection page: unknown id gives a clear message with a way back", async () => {
    await widaView.render({
      root: root(),
      params: { route: "wida", id: "wida-nope" },
      shell: shell(),
    });
    assert.match(root().textContent, /not found/i);
    assert.ok(root().querySelector('a[href="#/wida"]'));
  });

  it("path page: asks for a class first, then builds a path with all four domains", async () => {
    await widaView.render({ root: root(), params: { route: "wida", id: "path" }, shell: shell() });
    assert.match(root().textContent, /Add a class first/);
    classesCore.saveClass({
      nickname: "Room 214",
      grade: "4",
      subject: "esol",
      proficiency: { ee: 3, dev: 10, exp: 5, br: 2 },
    });
    root().replaceChildren();
    await widaView.render({ root: root(), params: { route: "wida", id: "path" }, shell: shell() });
    const steps = [...root().querySelectorAll(".st-wida-step")];
    assert.equal(steps.length, 7);
    for (const d of ["Listening", "Speaking", "Reading", "Writing"])
      assert.ok(
        steps.some((s) => s.dataset.domain === d),
        d,
      );
    assert.match(root().textContent, /Same grade-level content at every support level/);
    const len = root().querySelector("#st-wida-len");
    len.value = "5";
    len.dispatchEvent(new w.Event("change"));
    assert.equal(root().querySelectorAll(".st-wida-step").length, 5);
  });

  it("failed manifest shows a retry state, not a blank page", async () => {
    const bad = {
      ...shell(),
      catalog: createCatalog({
        base: new URL("http://localhost/x/"),
        fetchJson: async () => Promise.reject(new Error("offline")),
        importModule: (u) => import(u),
      }),
    };
    await widaView.render({ root: root(), params: { route: "wida" }, shell: bad });
    assert.match(root().textContent, /did not load/);
    assert.ok([...root().querySelectorAll("button")].some((b) => b.textContent === "Try again"));
  });
});

describe("source hygiene", () => {
  const files = [
    "views/wida.js",
    ...readdirSync(join(STUDIO_ROOT, "views/wida")).map((f) => `views/wida/${f}`),
  ];
  it("each file is at most 500 lines, has no emoji and no placeholder words", () => {
    for (const f of files) {
      const src = readFileSync(join(STUDIO_ROOT, f), "utf8");
      assert.ok(src.split("\n").length <= 500, `${f} is too long`);
      assert.doesNotMatch(src, /\p{Extended_Pictographic}/u, `${f} has emoji`);
      assert.doesNotMatch(src, /lorem ipsum|TODO|coming soon/i, `${f} has placeholder text`);
    }
  });
  it("never claims official items, scores or predictions", () => {
    const src = files
      .map((f) => readFileSync(join(STUDIO_ROOT, f), "utf8").replace(/^\s*\/\/.*$/gm, ""))
      .join("\n");
    assert.match(src, /not official WIDA or ACCESS items/);
    assert.doesNotMatch(src, /predicted (ACCESS|level)|your ACCESS (level|score)|official item/i);
  });
  it("is consistent with the repo layout (this file lives beside the studio)", () => {
    assert.ok(fileURLToPath(import.meta.url).endsWith("tools/studio-wida-view.test.mjs"));
  });
});
