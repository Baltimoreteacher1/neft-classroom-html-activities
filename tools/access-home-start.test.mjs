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
const { latestModuleResume } = await import("../access-practice-lab/src/home-resume.js");

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
const students = await import("../access-practice-lab/src/views/students.js");

test("student start joins practice, adventures and studios, with a saved-work transfer", async () => {
  const ctx = ctxFor("3-5", "en", { gradePick: "4-5" });
  ctx.route = { view: "students", grades: "3-5", pick: "4-5" };
  const page = dom((await students.render(ctx)).html);
  const smart = page.querySelector("#stuSmart");
  const library = page.querySelector("#stuLibraryTitle");
  assert.ok(
    smart && library && smart.compareDocumentPosition(library) & 4,
    "skill chooser comes before the library",
  );
  assert.equal(
    page.querySelector('[data-student-place="adventures"]').getAttribute("href"),
    "/language-adventures/",
  );
  assert.equal(
    page.querySelector('[data-student-place="studios"]').getAttribute("href"),
    "/studios/language",
  );
  assert.equal(page.querySelectorAll("[data-student-place]").length, 2);
  assert.equal(students.transferStep("Reading").href, "/language-adventures/");
  assert.equal(students.transferStep("Writing").href, "/studios/language");
  const I = makeI18n("es", "es");
  const transfer = dom(students.transferHTML(I, "Speaking", "Mi respuesta"));
  assert.equal(
    transfer.querySelector("[data-transfer-step]").getAttribute("href"),
    "/studios/language",
  );
  assert.match(transfer.body.textContent, /Usa lo que practicaste/);
});

// The full home is the ?grades= route; a bare home (grades: "") is the grade chooser.
const ctxFor = (band, lang = "en", prefs = {}, grades = band) => {
  const calls = { prefs: [], band: [], nav: [], rerender: 0 };
  return {
    calls,
    band,
    bands: SHIPPED,
    prefs: { lang, ...prefs },
    route: { view: "home", grades },
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

// A card named for a program (TWR) keeps its name in Spanish; everything around it is still translated.
const SAME_IN_SPANISH = new Set(["TWR"]);

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
      if (!(pair === c.title && SAME_IN_SPANISH.has(pair[0])))
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

test("new literacy pathways are discoverable from home", async () => {
  const expected = [
    ["science-of-reading-path", "science-of-reading/path"],
    ["vocabulary-investigations", "vocab-curriculum"],
    ["subject-reading", "subject-reading"],
  ];
  const homeDoc = await renderHome("6-8", "en");
  for (const [id, route] of expected) {
    const card = homeDoc.querySelector(`[data-home-card="${id}"]`);
    assert.ok(card, `${id} is present in Explore Activities`);
    assert.ok(card.getAttribute("href").includes(route), `${id} launches ${route}`);
  }
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
    // The publisher demo is a pitch for publishers: its route stays, the student home no longer links it.
    assert.ok(!hrefs.some((h) => h.includes("/publisher-demo")), `${band}: no publisher demo card`);
    // In-page anchors the start screen uses all exist.
    for (const a of doc.querySelectorAll('.lph a[href^="#"]'))
      assert.ok(
        doc.getElementById(a.getAttribute("href").slice(1)),
        `${band}: anchor ${a.getAttribute("href")}`,
      );
  }
});

test("audience doors: Student, Family, Classroom and ESOL Teacher, then search and the district; a role door never opens a tour (Joel, 2026-11-17)", async () => {
  // The navigation redesign (2026-11-17) replaced the "I am a…" switch with three large audience doors. The Teacher
  // door opens the Teacher Hub and the Family door the family start page; both offer the tour among other choices,
  // so no door drops anyone straight into a tour, whatever the tour state on this device.
  const KEY = "accessPracticeLab:v1:intro";
  try {
    for (const tour2 of [
      { v: 1, step: "support", furthest: 2 },
      { v: 1, step: "kit", furthest: 6 },
      null,
    ]) {
      if (tour2) localStorage.setItem(KEY, JSON.stringify({ tour2 }));
      else localStorage.removeItem(KEY);
      for (const doc of [
        await renderHome("6-8", "en"),
        dom((await home.render(ctxFor("6-8", "en", {}, ""))).html),
      ]) {
        const doors = [...doc.querySelectorAll(".lpa-doors .lpa-door")];
        assert.deepEqual(
          doors.map((a) => a.querySelector("strong").textContent.trim()),
          [
            "I’m a Student",
            "I’m a Family Member",
            "I’m a Classroom Teacher",
            "I’m an ESOL Teacher",
          ],
        );
        const href = (id) => doc.querySelector(`[data-audience-door="${id}"]`).getAttribute("href");
        // The Classroom Teacher door opens the lesson kit (access-teacher/classroom/); the ESOL door the Teacher Hub in its view.
        assert.equal(href("teacher"), "/access-teacher/classroom/");
        assert.equal(href("esol"), "/access-teacher/?role=esol");
        assert.equal(doc.querySelector('[data-audience-door="esol"]').dataset.doorRole, "esol");
        // The district door is a link under the doors, not a fifth audience (award audit C6).
        assert.equal(doc.querySelector('.lpa-doors [data-audience-door="bcpss"]'), null);
        assert.match(href("student"), /^\/access-practice-lab\/students(\?grades=6-8)?$/);
        assert.equal(href("family"), "/access-practice-lab/family-start");
        assert.equal(href("bcpss"), "/bcpss-teachers");
        assert.match(href("search"), /^\/access-practice-lab\/search/);
        for (const a of doc.querySelectorAll(".lpa a"))
          assert.doesNotMatch(a.getAttribute("href"), /tour/, "no audience door opens a tour");
        for (const img of doc.querySelectorAll(".lpa-door img"))
          assert.equal(img.getAttribute("alt"), "", "door art is decorative");
      }
    }
  } finally {
    localStorage.removeItem(KEY);
  }
});

test("continue shortcuts appear only for state that exists on this device", async () => {
  const { continueShortcuts } = await import("../access-practice-lab/src/views/home-audience.js");
  const none = () => null;
  assert.deepEqual(
    continueShortcuts({ band: "6-8", audience: "", read: none }),
    [],
    "a new visitor sees no shortcuts",
  );
  const store = {
    "accessPracticeLab:v1:book-last": "b1",
    "accessPracticeLab:v1:saved": JSON.stringify({
      items: { a: { id: "a", href: "/x", title: "X" } },
    }),
  };
  const ids = continueShortcuts({
    band: "6-8",
    practiceHref: "/access-practice-lab/play?x=1",
    audience: "teacher",
    read: (k) => store[k] ?? null,
  }).map((i) => i.id);
  assert.deepEqual(ids, ["practice", "teacher-hub", "book", "saved"]);
  assert.deepEqual(
    continueShortcuts({ audience: "student", read: (k) => (k.endsWith("saved") ? "[]" : null) }),
    [],
    "an empty saved list and a student audience add nothing",
  );
  localStorage.clear();
  const doc = await renderHome("6-8", "en");
  assert.equal(doc.querySelector(".lpa-continue"), null, "no shortcut row without saved state");
  localStorage.setItem("accessPracticeLab:v1:book-last", "b1");
  const back = await renderHome("6-8", "en");
  assert.deepEqual(
    [...back.querySelectorAll(".lpa-continue a")].map((a) => a.dataset.homeContinue),
    ["book"],
  );
  localStorage.clear();
});

test("start screen: one h1 above the doors, a labelled ruler, ONE primary action, the rest collapsed", async () => {
  localStorage.clear();
  const doc = await renderHome("6-8", "en");
  // The page h1 heads the audience doors (2026-11-17 navigation redesign); the student stage has its own h2.
  assert.equal(doc.querySelector("section.lpa").getAttribute("aria-labelledby"), "homeTitle");
  assert.equal(doc.getElementById("homeTitle").tagName, "H1");
  const lph = doc.querySelector("section.lph");
  assert.equal(doc.getElementById(lph.getAttribute("aria-labelledby")).tagName, "H2");
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
  // The language choice lives once, in the header: the home no longer repeats it.
  assert.equal(
    doc.querySelectorAll("[data-lang-mode]").length,
    0,
    "no language switch in the page",
  );
  // One primary action on the start screen.
  assert.equal(lph.querySelectorAll(".btn-primary").length, 1, "exactly one primary action");
  assert.equal(
    lph.querySelectorAll(".lph-start").length,
    0,
    "the big Teacher / Family cards are gone",
  );
  // The "I am a…" switch is gone: the audience doors above the stage replaced it.
  assert.equal(doc.querySelectorAll(".lph-roles, .lph-role").length, 0);
  // Everything else is below, collapsed, and still reachable.
  const more = doc.querySelector("details.lph-more-ways");
  assert.equal(more.open, false, "More ways to practice starts collapsed");
  assert.match(more.querySelector("summary").textContent, /More ways to practice/);
  assert.equal(
    more.querySelectorAll(".lph-skill").length,
    4,
    "the four skills sit in More ways to practice",
  );
  assert.ok(more.querySelector("#start-learning") && more.querySelector("#skills"));
  assert.equal(
    doc.querySelector("details.lph-dashboard").open,
    false,
    "secondary resources start collapsed",
  );
  assert.ok(doc.querySelector("a[href*='/family?']"), "Family Corner stays reachable from home");
  assert.ok(
    doc.querySelector("a[href^='/access-teacher/']"),
    "teacher resources stay reachable from home",
  );
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
  // The audience doors and the h1 sit above the student stage; both must be Spanish.
  const lphEs = [".lpa", ".lph"]
    .map((sel) => es.querySelector(sel).textContent)
    .join(" ")
    .replace(/\s+/g, " ");
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
    "I’m a Teacher",
    "I’m a Student",
    "I’m a Family Member",
    "Search all resources",
  ])
    assert.ok(!lphEs.includes(en), `Spanish start screen has no "${en}"`);
  assert.match(lphEs, /Practica inglés para la escuela/);
  for (const es1 of [
    "Soy docente",
    "Soy estudiante",
    "Soy de la familia",
    "Buscar en todos los recursos",
  ])
    assert.ok(lphEs.includes(es1), es1);
  for (const c of HOME_CARDS.filter(
    (c) => c.group !== "start" && (!c.bands || c.bands.includes("6-8")),
  )) {
    const el = es.querySelector(`[data-home-card="${c.id}"]`);
    assert.ok(el.textContent.includes(c.title[1]), `${c.id}: Spanish title`);
    if (!SAME_IN_SPANISH.has(c.title[0]))
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
  assert.equal(
    pick({
      openMission: { id: "m1", started: "2026-10-01T10:00:00Z", updatedAt: "2026-10-01T10:00:00Z" },
      moduleResume: {
        system: "vocabulary",
        href: "/access-practice-lab/vocab-curriculum/g6-evaluate-sources?grades=6-8",
        updatedAt: "2026-11-01T10:00:00Z",
      },
    }),
    "resume",
    "newer saved work in another learning system wins over an older open mission",
  );
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

test("cross-system Continue returns the newest unfinished lesson without mixing progress formats", () => {
  const records = new Map([
    [
      "accessPracticeLab:v1:sor",
      JSON.stringify({
        "short-vowels": { phase: "read", choice: "map", updatedAt: "2026-11-01T10:00:00.000Z" },
        "finished-pattern": {
          phase: "complete",
          doneAt: "2026-11-02T10:00:00.000Z",
          choice: "ship",
        },
      }),
    ],
    [
      "accessPracticeLab:v1:vocabCurriculum",
      JSON.stringify({
        v: 1,
        lessons: {
          "g6-evaluate-sources": {
            stage: "passage",
            draft: "The source shows",
            updatedAt: "2026-11-03T10:00:00.000Z",
          },
          "g4-use-evidence": {
            stage: "application",
            draft: "Another band",
            updatedAt: "2026-11-04T10:00:00.000Z",
          },
          "g8-synthesize-claims": {
            stage: "transfer",
            completed: true,
            draft: "Finished",
            updatedAt: "2026-11-05T10:00:00.000Z",
          },
        },
      }),
    ],
    [
      "accessPracticeLab:v1:subjectReading",
      JSON.stringify({
        v: 1,
        readings: {
          "ecosystems-change": {
            startedAt: "2026-11-06T10:00:00.000Z",
            updatedAt: "2026-11-06T10:00:00.000Z",
            draft: "Evidence suggests",
          },
        },
      }),
    ],
  ]);
  const resume = latestModuleResume({ band: "6-8", read: (key) => records.get(key) || null });
  assert.equal(resume.system, "subject-reading");
  assert.equal(resume.id, "ecosystems-change");
  assert.equal(resume.href, "/access-practice-lab/subject-reading/ecosystems-change?grades=6-8");
});

test("the rendered home Continue button opens a saved vocabulary investigation", async () => {
  localStorage.clear();
  localStorage.setItem(
    "accessPracticeLab:v1:vocabCurriculum",
    JSON.stringify({
      v: 1,
      lessons: {
        "g6-evaluate-sources": {
          stage: "context",
          draft: "The evidence shows",
          updatedAt: "2026-11-06T10:00:00.000Z",
        },
      },
    }),
  );
  const doc = await renderHome("6-8", "en");
  const continueLink = doc.querySelector(".lph-continue [data-continue]");
  assert.equal(
    continueLink.getAttribute("href"),
    "/access-practice-lab/vocab-curriculum/g6-evaluate-sources?grades=6-8",
  );
  assert.match(doc.querySelector(".lph-continue h2").textContent, /vocabulary lesson/i);
  localStorage.clear();
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

test("bare home never pre-picks a grade; choosing one opens that grade's home", async () => {
  const ctx = ctxFor("6-8", "en", { gradePick: "6-8" }, "");
  const doc = dom((await home.render(ctx)).html);
  assert.equal(doc.querySelectorAll("h1").length, 1);
  const steps = [...doc.querySelectorAll("button[data-grade-pick]")];
  assert.ok(steps.length > 1, "the grade ruler is shown");
  assert.equal(
    doc.querySelectorAll('[data-grade-pick][aria-pressed="true"]').length,
    0,
    "no grade is pre-chosen",
  );
  assert.equal(
    doc.querySelector("[data-start-mission], [data-continue]"),
    null,
    "no band content before a choice",
  );
  const btn = new JSDOM('<button data-grade-pick="6-8">x</button>').window.document.querySelector(
    "button",
  );
  assert.equal(home.onClick({ target: btn }, ctx), true);
  assert.deepEqual(ctx.calls.band, [], "same band as last time: no band switch");
  assert.match(ctx.calls.nav[0], /grades=6-8/, "but the chosen grade's home opens");
});

test("home links are bare: breadcrumbs and the header Home never carry ?grades=", async () => {
  const { crumbsHTML } = await import("../access-practice-lab/src/components.js");
  const trail = dom(
    crumbsHTML([
      ["Lab", "/access-practice-lab/?grades=6-8"],
      ["Here", null],
    ]),
  );
  assert.equal(trail.querySelector("a").getAttribute("href"), "/access-practice-lab/");
  // The header Home is the wordmark link, static in index.html and never carrying ?grades=.
  assert.match(
    read("access-practice-lab/index.html"),
    /<a class="lab-brand" href="\/access-practice-lab\/"/,
  );
});

test("styles: the start sheet is critical, uses tokens and keeps 48px targets", () => {
  const index = read("access-practice-lab/index.html");
  assert.match(
    index,
    /data-lab-critical href="\/access-practice-lab\/home-start\.css\?v=[0-9a-f]{8}"/,
  );
  assert.equal(index, read("access-practice-lab/app-shell"), "app-shell mirrors index.html");
  const css = read("access-practice-lab/home-start.css");
  const hex = css.replace(/\/\*[\s\S]*?\*\//g, "").match(/#[0-9a-f]{3,8}\b/gi) || [];
  assert.deepEqual(
    hex.filter((h) => h.toLowerCase() !== "#fff"),
    [],
    "colours come from ds.css tokens",
  );
  for (const sel of [".lph-step", ".lph-skill", ".lph-chip", ".lph-more > summary"]) {
    const block =
      css.match(new RegExp(`${sel.replace(/[.>]/g, (m) => `\\${m}`)} \\{[^}]*\\}`))?.[0] || "";
    const h = Number(block.match(/min-height: ([\d.]+)rem/)?.[1] || 0);
    assert.ok(h >= 3, `${sel}: min-height ${h}rem >= 3rem (48px)`);
  }
});

test("audience memory: hubs remember their audience; crumbs offer Back to <Hub>, never on the hub itself", async () => {
  const A = await import("../access-practice-lab/src/audience.js");
  const { crumbsHTML } = await import("../access-practice-lab/src/components.js");
  localStorage.clear();
  const trail = () =>
    dom(
      crumbsHTML([
        ["Lab", "/access-practice-lab/"],
        ["Here", null],
      ]),
    );
  assert.equal(trail().querySelector(".crumbs-hub"), null, "no audience yet: no hub link");
  A.syncAudience({ view: "students" });
  assert.equal(localStorage.getItem(A.AUDIENCE_KEY), "student");
  assert.equal(
    trail().querySelector(".crumbs-hub").getAttribute("href"),
    "/access-practice-lab/students",
  );
  assert.match(trail().querySelector(".crumbs-hub").textContent, /Back to Student Hub/);
  A.syncAudience({ view: "family-start" });
  assert.equal(A.readAudience(), "family");
  assert.equal(
    A.hubLink({ pathname: "/access-practice-lab/family-start" }),
    null,
    "never on the hub itself",
  );
  assert.equal(A.hubLink({ audience: "teacher", pathname: "/access-teacher/" }), null);
  assert.equal(
    A.hubLink({ audience: "teacher", pathname: "/access-practice-lab/speak" }).href,
    "/access-teacher/",
  );
  assert.equal(A.rememberAudience("admin"), false, "only teacher, student or family");
  localStorage.setItem(A.AUDIENCE_KEY, "nonsense");
  assert.equal(A.readAudience(), "");
  localStorage.clear();
});
