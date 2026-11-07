// Lab home start screen: the grade ruler (grade-bands.js), the card registry (home-registry.js), the Continue card,
// every destination the previous home linked, and Spanish coverage of the new copy. JSDOM over the real view.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";

const ROOT = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), "utf8");

const G = await import("../access-practice-lab/src/grade-bands.js");
const { HOME_CARDS, HOME_GROUPS, cardsFor } = await import(
  "../access-practice-lab/src/home-registry.js"
);
const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");

const SHIPPED = ["3-5", "6-8"];
const dom = (markup) => new JSDOM(`<body>${toHtml(markup)}</body>`).window.document;

// One JSDOM window as the browser globals, so the view's storage and location reads work.
const win = new JSDOM("<main id='app'></main><div id='labLive'></div>", {
  url: "https://lab.test/access-practice-lab/",
}).window;
for (const key of ["window", "document", "localStorage", "location", "history"])
  globalThis[key] = win[key];
globalThis.CSS = { escape: (s) => String(s) };
globalThis.fetch = async (url) => ({
  ok: true,
  json: async () =>
    JSON.parse(await readFile(new URL(String(url).replace(/^\//, ""), ROOT), "utf8")),
});
const home = await import("../access-practice-lab/src/views/home.js");
const start = await import("../access-practice-lab/src/views/home-start.js");

const ctxFor = (band, lang = "en", prefs = {}) => {
  const calls = { prefs: [], band: [], nav: [], rerender: 0 };
  return {
    calls,
    band,
    bands: SHIPPED,
    prefs: { lang, ...prefs },
    route: { view: "home" },
    setPrefs(p) {
      calls.prefs.push(p);
      Object.assign(this.prefs, p);
    },
    setBand(b) {
      calls.band.push(b);
    },
    navigate(p) {
      calls.nav.push(p);
    },
    rerender() {
      calls.rerender++;
    },
  };
};
const renderHome = async (band, lang, prefs) =>
  dom((await home.render(ctxFor(band, lang, prefs))).html);

test("grade picks resolve to shipped bands, closest band when a pick has none yet", () => {
  assert.deepEqual(G.resolvePick("6-8", SHIPPED), { band: "6-8", exact: true });
  assert.deepEqual(
    G.resolvePick("4-5", SHIPPED),
    { band: "3-5", exact: true },
    "4-5 is served by 3-5",
  );
  for (const id of ["K", "1", "2-3"])
    assert.deepEqual(G.resolvePick(id, SHIPPED), { band: "3-5", exact: false }, id);
  // A band added later is picked up with no other change.
  assert.deepEqual(G.resolvePick("K", ["K", ...SHIPPED]), { band: "K", exact: true });
  assert.deepEqual(G.resolvePick("4-5", ["3-5", "4-5", "6-8"]), { band: "4-5", exact: true });
  assert.deepEqual(G.resolvePick("2-3", ["6-8"]), { band: "6-8", exact: false });
  // Every pick's bands are in the ordered list availableBands() filters.
  for (const p of G.GRADE_PICKS)
    for (const b of p.content)
      assert.ok(G.CONTENT_BAND_ORDER.includes(b), `${b} in CONTENT_BAND_ORDER`);
  assert.equal(
    G.GRADE_PICKS.reduce((n, p) => n + p.span, 0),
    9,
    "the ruler spans K-8, nine grades",
  );
});

test("the chosen pick follows the remembered pick while it still matches the band on screen", () => {
  assert.equal(G.currentPick("3-5", "", SHIPPED), "4-5");
  assert.equal(G.currentPick("6-8", "", SHIPPED), "6-8");
  assert.equal(G.currentPick("3-5", "1", SHIPPED), "1", "Grade 1 stays chosen while it shows 3-5");
  assert.equal(G.currentPick("6-8", "1", SHIPPED), "6-8", "a band change elsewhere wins");
  assert.equal(G.currentPick("3-5", "nonsense", SHIPPED), "4-5");
  const state = G.pickerState("3-5", "K", SHIPPED);
  assert.deepEqual(
    state.map((p) => [p.id, p.ready, p.chosen]),
    [
      ["K", false, true],
      ["1", false, false],
      ["2-3", false, false],
      ["4-5", true, false],
      ["6-8", true, false],
    ],
  );
});

test("availableBands reads its order from grade-bands.js", () => {
  const src = read("access-practice-lab/src/content.js");
  assert.match(src, /CONTENT_BAND_ORDER\.filter\(\(b\) => index\.bands\[b\]\)/);
});

test("registry: unique ids, known groups, both languages, real icons, routes that exist", () => {
  const icons = new Set(
    [
      ...read("access-practice-lab/pictures/ui-icons.svg").matchAll(/symbol id="([a-z0-9-]+)"/g),
    ].map((m) => m[1]),
  );
  const main = read("access-practice-lab/src/main.js");
  const ids = new Set();
  for (const c of HOME_CARDS) {
    assert.ok(!ids.has(c.id), `duplicate id ${c.id}`);
    ids.add(c.id);
    assert.ok(HOME_GROUPS.includes(c.group), `${c.id}: group`);
    for (const pair of [c.title, c.text]) {
      assert.equal(pair.length, 2, `${c.id}: [en, es]`);
      assert.ok(pair[0].trim() && pair[1].trim(), `${c.id}: both languages`);
      assert.notEqual(pair[0], pair[1], `${c.id}: Spanish is not the English`);
    }
    assert.ok(icons.has(c.icon), `${c.id}: icon ${c.icon}`);
    const [pathWithQuery, hash] = c.href.split("#");
    const [path, query] = pathWithQuery.split("?");
    // Query strings configure a valid route (for example a family view or a
    // selected early-reading scene); route existence is checked by pathname.
    if (query) assert.ok(query.trim(), `${c.id}: route query is not empty`);
    if (path.startsWith("/")) {
      const file = new URL(`.${path}${path.endsWith("/") ? "index.html" : ""}`, ROOT);
      assert.ok(existsSync(file), `${c.id}: ${path} exists`);
      if (hash) {
        const dir = new URL(`.${path}`, ROOT);
        const src = ["index.html", "teacher.js"]
          .map((f) => new URL(f, dir))
          .filter(existsSync)
          .map((u) => readFileSync(u, "utf8"))
          .join("\n");
        assert.match(src, new RegExp(`id="${hash}"`), `${c.id}: #${hash} exists`);
      }
    } else {
      const seg = path.split("/")[0];
      assert.ok(main.includes(`"${seg}"`), `${c.id}: /${seg} is a lab route`);
      if (hash)
        assert.match(
          readdirSync(new URL("access-practice-lab/src/views/", ROOT))
            .filter((f) => f.endsWith(".js"))
            .map((f) => read(`access-practice-lab/src/views/${f}`))
            .join("\n"),
          new RegExp(`id="${hash}"|"${hash}"`),
          `${c.id}: #${hash} exists`,
        );
    }
  }
  for (const g of HOME_GROUPS) assert.ok(cardsFor(g, "6-8").length, `group ${g} has cards`);
  assert.ok(
    cardsFor("teach", "6-8").some((c) => c.id === "printables"),
    "teachers: printables",
  );
  assert.ok(
    cardsFor("teach", "6-8").some((c) => c.id === "assign"),
    "teachers: assign",
  );
  assert.ok(
    cardsFor("teach", "6-8").some((c) => c.id === "class-evidence"),
    "teachers: class",
  );
});

test("home keeps every destination the previous home linked, for both bands", async () => {
  const required = [
    "/path",
    "/journey/map",
    "/library",
    "/Listening/",
    "/Reading/",
    "/Speaking/",
    "/Writing/",
    "/exhibition",
    "/worlds",
    "/reality",
    "/learn",
    "/games",
    "/publisher-demo",
    "/stories",
    "/speak",
    "/write",
    "/reading-room",
    "/missions",
    "/detective",
    "/ladder",
    "/puzzles",
    "/vocabulary",
    "/road",
    "/tests",
    "/assess",
    "/diagnostic",
    "/tools",
    "/passport",
    "/growth",
    "/family",
    "/access-family-expedition/",
    "/access-family-tour/",
    "/access-teacher/",
    "/classroom",
    "/launch-studio",
    "/exhibition/teacher",
  ];
  for (const band of SHIPPED) {
    const doc = await renderHome(band, "en");
    const hrefs = [...doc.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
    for (const r of required)
      assert.ok(
        hrefs.some((h) => h.includes(r)),
        `${band}: home links ${r}`,
      );
    for (const c of HOME_CARDS.filter(
      (c) => c.group !== "start" && (!c.bands || c.bands.includes(band)),
    ))
      assert.equal(
        doc.querySelectorAll(`[data-home-card="${c.id}"]`).length,
        1,
        `${band}: card ${c.id}`,
      );
    for (const c of cardsFor("start", band))
      assert.ok(hrefs.includes(start.cardHref(c, band)), `${band}: quick link ${c.id}`);
    // In-page anchors the start screen uses all exist.
    for (const a of doc.querySelectorAll('.lph a[href^="#"]'))
      assert.ok(
        doc.getElementById(a.getAttribute("href").slice(1)),
        `${band}: anchor ${a.getAttribute("href")}`,
      );
  }
});

test("start screen: landmarks, one h1, a labelled ruler, the language choice, four skills, two doors", async () => {
  const doc = await renderHome("6-8", "en");
  const lph = doc.querySelector("section.lph");
  assert.equal(lph.getAttribute("aria-labelledby"), "homeTitle");
  assert.equal(doc.querySelectorAll("h1").length, 1);
  const ruler = lph.querySelector(".lph-ruler");
  assert.equal(ruler.getAttribute("role"), "group");
  assert.ok(doc.getElementById(ruler.getAttribute("aria-labelledby")));
  const steps = [...ruler.querySelectorAll("button[data-grade-pick]")];
  assert.deepEqual(
    steps.map((b) => b.dataset.gradePick),
    ["K", "1", "2-3", "4-5", "6-8"],
  );
  assert.equal(
    steps.find((b) => b.getAttribute("aria-pressed") === "true").dataset.gradePick,
    "6-8",
  );
  assert.match(steps[0].getAttribute("aria-label"), /Kindergarten \(coming soon\)/);
  assert.equal(
    lph.querySelectorAll("[data-lang-mode]").length,
    3,
    "language choice on the start screen",
  );
  assert.equal(lph.querySelectorAll(".lph-skill").length, 4);
  assert.equal(lph.querySelectorAll(".lph-door").length, 2);
  assert.equal(
    lph.querySelector(".is-family a").getAttribute("href"),
    "/access-practice-lab/family?grades=6-8",
  );
  assert.ok(lph.querySelector(".lph-continue [data-continue].btn-primary"));
  // The 4-5 pick on the 3-5 band says which practice it shows; a pick with no band yet says so plainly.
  const d35 = await renderHome("3-5", "en");
  assert.match(d35.querySelector(".lph-note").textContent, /Showing Grades 3–5 practice/);
  const dk = await renderHome("3-5", "en", { gradePick: "K" });
  assert.match(
    dk.querySelector(".lph-note").textContent,
    /Kindergarten practice is still being written/,
  );
  assert.equal(dk.querySelector('[aria-pressed="true"][data-grade-pick]').dataset.gradePick, "K");
});

test("Spanish: every new start-screen and registry string is in Spanish, bilingual shows both", async () => {
  const es = await renderHome("6-8", "es");
  const lphEs = es.querySelector(".lph").textContent.replace(/\s+/g, " ");
  for (const en of [
    "Practice English for school",
    "My grade",
    "Language for directions",
    "Or pick a skill",
    "Teachers",
    "Families",
    "Teacher tools",
    "Family Corner",
    "Start My Learning Journey",
    "No timers",
  ])
    assert.ok(!lphEs.includes(en), `Spanish start screen has no "${en}"`);
  assert.match(lphEs, /Practica inglés para la escuela/);
  for (const c of HOME_CARDS.filter(
    (c) => c.group !== "start" && (!c.bands || c.bands.includes("6-8")),
  )) {
    const el = es.querySelector(`[data-home-card="${c.id}"]`);
    assert.ok(el.textContent.includes(c.title[1]), `${c.id}: Spanish title`);
    assert.ok(!el.textContent.includes(c.title[0]), `${c.id}: no English title`);
  }
  const bi = await renderHome("6-8", "bi");
  const lphBi = bi.querySelector(".lph").textContent;
  assert.ok(lphBi.includes("My grade") && lphBi.includes("Mi grado"));
  assert.ok(bi.querySelector('.lph [lang="es"]'), "Spanish marked lang=es in bilingual mode");
});

test("Continue: unfinished session, open mission, journey under way, last room, then a first step", () => {
  const I = makeI18n("en", "en");
  const rec = {
    mission: "m03",
    step: "build",
    kind: "continue",
    reason: ["Keep going.", "Sigue."],
  };
  const resume = { id: "s1", band: "6-8", minutes: 10, ids: ["a"], index: 0 };
  const recent = { domain: "Reading", level: "B", next: ["r-1", "Main idea", "mc", "x", 4] };
  const pick = (o) => start.continueTarget(I, { band: "6-8", ...o }).kind;
  assert.equal(
    pick({ resume, openMission: "m1", journey: { recommendation: rec }, recent }),
    "session",
  );
  assert.equal(pick({ openMission: "m1", journey: { recommendation: rec }, recent }), "mission");
  assert.equal(pick({ journey: { recommendation: rec }, recent }), "journey");
  assert.equal(pick({ journey: { recommendation: { ...rec, kind: "start" } }, recent }), "room");
  const room = start.continueTarget(I, { band: "6-8", recent });
  assert.equal(room.href, "/access-practice-lab/Reading/B/r-1?grades=6-8");
  const fresh = start.continueTarget(I, {
    band: "6-8",
    journey: { recommendation: { ...rec, kind: "start", mission: "m01", step: "discover" } },
  });
  assert.equal(fresh.kind, "start");
  assert.match(fresh.href, /\/journey\/m01\/discover/);
  assert.equal(start.continueTarget(I, { band: "6-8" }).href, "#skills");
});

test("Continue reads the last skill room practiced on this device", async () => {
  localStorage.clear();
  const domains = {
    Reading: {
      levels: {
        A: {
          activities: [
            ["r-a1", "One"],
            ["r-a2", "Two"],
          ],
        },
      },
    },
  };
  localStorage.setItem(
    "accessPracticeLab:v1:Reading:A",
    JSON.stringify({
      complete: ["r-a1"],
      results: { "r-a1": { date: "2026-11-01T10:00:00Z", correct: true } },
    }),
  );
  const r = start.recentRoom("6-8", domains);
  assert.equal(r?.domain, "Reading");
  assert.equal(r?.next?.[0], "r-a2");
  localStorage.clear();
  assert.equal(start.recentRoom("6-8", domains), null);
});

test("choosing a grade remembers the pick and switches to the band that serves it", () => {
  const click = (ctx, pick) => {
    const doc = new JSDOM(`<button data-grade-pick="${pick}">x</button>`).window.document;
    return home.onClick({ target: doc.querySelector("button") }, ctx);
  };
  const a = ctxFor("6-8");
  assert.equal(click(a, "K"), true);
  assert.deepEqual(a.calls.prefs, [{ gradePick: "K" }]);
  assert.deepEqual(a.calls.band, ["3-5"], "K has no band yet: the closest band is shown");
  assert.match(a.calls.nav[0], /grades=3-5/);
  const b = ctxFor("3-5");
  click(b, "4-5");
  assert.deepEqual(b.calls.band, [], "same band: no switch");
  assert.equal(b.calls.rerender, 1);
  const c = ctxFor("6-8");
  click(c, "bogus");
  assert.deepEqual(c.calls.prefs, [], "an unknown pick changes nothing");
});

test("styles: the start sheet is critical, uses tokens and keeps 48px targets", () => {
  const index = read("access-practice-lab/index.html");
  assert.match(
    index,
    /data-lab-critical href="\/access-practice-lab\/home-start\.css\?v=[0-9a-f]{12}"/,
  );
  assert.equal(index, read("access-practice-lab/app-shell"), "app-shell mirrors index.html");
  const css = read("access-practice-lab/home-start.css");
  const hex = css.replace(/\/\*[\s\S]*?\*\//g, "").match(/#[0-9a-f]{3,8}\b/gi) || [];
  assert.deepEqual(
    hex.filter((h) => h.toLowerCase() !== "#fff"),
    [],
    "colours come from ds.css tokens",
  );
  for (const sel of [".lph-step", ".lph-skill", ".lph-quick a", ".lph-more > summary"]) {
    const block =
      css.match(new RegExp(`${sel.replace(/[.>]/g, (m) => `\\${m}`)} \\{[^}]*\\}`))?.[0] || "";
    const h = Number(block.match(/min-height: ([\d.]+)rem/)?.[1] || 0);
    assert.ok(h >= 3, `${sel}: min-height ${h}rem >= 3rem (48px)`);
  }
});
