// The lab's front door (Package A, 2026-11-14): one primary action on home, the "I am a…" switch, one language
// choice, the three-idea site map, plain-language reasons, "Read this page", the Workbench exclusion on language
// pages, grade-count labels and the Privacy / Accessibility pages. JSDOM over the real modules.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const ROOT = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), "utf8");
const win = new JSDOM("<main id='app'></main><div id='labLive'></div>", {
  url: "https://lab.test/access-practice-lab/",
}).window;
for (const key of ["window", "document", "localStorage", "location", "history"])
  globalThis[key] = win[key];

const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");
const start = await import("../access-practice-lab/src/views/home-start.js");
const sm = await import("../access-practice-lab/src/sitemap.js");
const { HOME_CARDS } = await import("../access-practice-lab/src/home-registry.js");
const { pageSegments, voiceRuns, readPageButtonHTML } = await import(
  "../access-practice-lab/src/read-page.js"
);
const { gradeFocusHTML } = await import("../access-practice-lab/src/grade-focus-ui.js");
const { recommendTasks } = await import("../access-practice-lab/src/lang/adapt.js");
const privacy = await import("../access-practice-lab/src/views/privacy.js");
const accessibility = await import("../access-practice-lab/src/views/accessibility.js");

const EN = makeI18n("en", "en");
const ES = makeI18n("es", "es");
const doc = (markup) => new JSDOM(`<body>${toHtml(markup)}</body>`).window.document;
const missions = [5, 10, 15].map((minutes) => ({ minutes, ids: [`a${minutes}`], reviewIds: [] }));
const fresh = {
  kind: "start",
  title: "Start",
  why: "",
  cta: "Go",
  href: "/access-practice-lab/journey/m01/discover",
};
const unfinished = {
  kind: "resume",
  title: "Continue your writing",
  why: "Saved.",
  cta: "Continue",
  href: "/x",
};

test("front door: no unfinished work means Start today's mission (10 min) with 5 and 15 as chips", () => {
  const d = doc(start.frontDoorHTML(EN, { target: fresh, missions }));
  const primary = d.querySelectorAll(".btn-primary");
  assert.equal(primary.length, 1, "one primary action");
  assert.equal(primary[0].dataset.startMission, "10");
  assert.match(primary[0].textContent, /Start today’s mission · 10 min/);
  const chips = [...d.querySelectorAll(".lph-chip")];
  assert.deepEqual(
    chips.map((c) => c.dataset.startMission),
    ["5", "15"],
  );
  // Each chip's accessible name says what it does, not just "5 min".
  assert.match(chips[0].textContent.replace(/\s+/g, " "), /Start today’s mission · 5 min/);
  assert.match(d.querySelector("[data-continue-journey]").getAttribute("href"), /journey\/m01/);
});

test("front door: unfinished work means Continue; the mission lengths become secondary chips", () => {
  const d = doc(start.frontDoorHTML(EN, { target: unfinished, missions }));
  const primary = d.querySelectorAll(".btn-primary");
  assert.equal(primary.length, 1);
  assert.equal(primary[0].getAttribute("href"), "/x");
  assert.match(primary[0].textContent, /Continue/);
  assert.equal(d.querySelectorAll(".lph-chip").length, 3, "5, 10 and 15 stay available");
  const resume = { kind: "session", title: "t", why: "w", cta: "Resume", href: "/s" };
  const r = doc(start.frontDoorHTML(EN, { target: resume, missions, resume: { id: "s1" } }));
  assert.match(r.querySelector(".lph-chip").textContent, /Start a new session/);
  // Nothing to build a mission from: the Continue target is the action.
  const none = doc(
    start.frontDoorHTML(EN, { target: { ...fresh, href: "#skills" }, missions: [] }),
  );
  assert.equal(none.querySelector(".btn-primary").getAttribute("href"), "#skills");
});

test("front door: Spanish copy", () => {
  const d = doc(start.frontDoorHTML(ES, { target: fresh, missions }));
  const text = d.body.textContent;
  assert.match(text, /La misión de hoy/);
  assert.match(text, /Empezar la misión de hoy · 10 min/);
  assert.doesNotMatch(text, /Today|Start today/);
});

test("language: one choice on home, no banner on phones, the header switch sets langChosen", async () => {
  const src = read("access-practice-lab/src/views/home-start.js");
  assert.doesNotMatch(src, /langSwitchHTML/, "the home has no third language switch");
  globalThis.matchMedia = () => ({ matches: false });
  const { wantsLangBanner } = await import("../access-practice-lab/src/shell.js");
  const ctx = { prefs: { langChosen: false }, route: { view: "home" } };
  assert.equal(wantsLangBanner(ctx, false), true, "desktop first visit: banner");
  assert.equal(wantsLangBanner(ctx, true), false, "phone: the header switch is already on screen");
  assert.equal(wantsLangBanner({ ...ctx, prefs: { langChosen: true } }, false), false);
  assert.match(
    read("access-practice-lab/ds.css"),
    /max-width: 559px\)[^}]*lab-lang-pending \.lang-banner\[hidden\]/,
  );
  assert.match(
    read("access-practice-lab/src/main.js"),
    /t\.closest\("\[data-lang-mode\]"\)[\s\S]{0,200}setPrefs\(\{ lang: mode, langChosen: true \}\)/,
    "any language switch, header included, records the choice",
  );
});

test("site map: Today, Road to ACCESS and Studios lead; every destination keeps its route", () => {
  assert.deepEqual(
    sm.SECTIONS.slice(0, 3).map((s) => s.title[0]),
    ["Today & my progress", "Road to ACCESS", "Studios & practice"],
  );
  assert.deepEqual(
    sm.SECTIONS.map((s) => s.id).sort(),
    ["family", "help", "play", "practice", "prep", "progress", "teach"],
    "section ids (and so /explore/<id> URLs) unchanged",
  );
  const sec = (id) => sm.DEST_BY_ID[id].section;
  for (const id of ["journey", "path", "missions", "learn"]) assert.equal(sec(id), "progress", id);
  for (const id of ["road", "tests", "diagnostic", "assess"]) assert.equal(sec(id), "prep", id);
  for (const id of [
    "reader",
    "reading-room",
    "library",
    "stories",
    "ladder",
    "scaffold",
    "wordlab",
    "vocabulary",
    "detective",
    "collection",
  ])
    assert.equal(sec(id), "practice", id);
  assert.equal(
    sm.destinationsIn("prep", "6-8")[0].id,
    "road",
    "Road to ACCESS leads with the road",
  );
  for (const id of ["assess", "arena", "sentences", "newsroom", "warmup"])
    assert.equal(Boolean(sm.DEST_BY_ID[id].top), false, `${id} is secondary`);
});

test("plain-language reasons: short student why in EN and ES; the standard number is teacher-only", () => {
  const recs = recommendTasks(
    [{ id: "s1", keyUse: "Narrate", contentArea: "Science", taskType: "retell" }],
    [],
    { n: 1, signals: { checkinMissed: {}, worlds: {} } },
  );
  assert.deepEqual(recs[0].why, [
    "New for you: science words",
    "Nuevo para ti: palabras de ciencias",
  ]);
  assert.match(recs[0].teacherWhy, /WIDA ELD Standard 4/);
  for (const f of ["home.js", "speak.js", "write.js"])
    assert.match(read(`access-practice-lab/src/views/${f}`), /I\.T\(\.\.\.(r|rec)\.why\)/, f);
});

test("read this page: main content only, in order, skipping chrome, buttons and hidden text", () => {
  const d = new JSDOM(`<main id="app">
    <nav><p>Menu text</p></nav>
    <h1>Title</h1>
    <p>First <button>Skip me</button>paragraph.</p>
    <p hidden>Hidden</p>
    <p aria-hidden="true">Decor</p>
    <ul><li><p>Inner</p></li></ul>
    <details><summary>More</summary><p>Closed body</p></details>
    <p lang="es">Hola</p>
  </main>`).window.document;
  const segs = pageSegments(d.getElementById("app"));
  assert.deepEqual(
    segs.map((s) => s.text),
    ["Title", "First paragraph.", "Inner", "More", "Hola"],
  );
  assert.deepEqual(
    voiceRuns(segs, "bi").map((r) => r.lang),
    ["en", "es"],
    "bilingual follows each block's language",
  );
  assert.deepEqual(
    voiceRuns(segs, "es").map((r) => r.lang),
    ["es"],
  );
  const btn = doc(readPageButtonHTML(ES)).querySelector("button");
  assert.equal(btn.getAttribute("aria-pressed"), "false");
  assert.match(btn.textContent, /Leer esta página/);
  const shell = read("access-practice-lab/src/shell.js");
  assert.match(shell, /readPageButtonHTML\(I\)/);
  assert.match(shell, /installReadPage\(ctx, I\)/);
});

test("Math Workbench stays off language pages and the language host", () => {
  const src = read("shared/save-resume/save-resume-engine.js");
  for (const p of [
    "/access-practice-lab/",
    "/access-teacher/",
    "/access-expedition/",
    "/access-family-expedition/",
    "/access-family-tour/",
    "/language-adventures/",
    "/language-studio/",
  ])
    assert.ok(src.includes(`"${p}"`), p);
  assert.match(src, /thelanguagepage\\\.com/);
  assert.match(src, /isGameRoute \|\| isFluencyLabRoute \|\| isLanguageRoute/);
});

test("publisher demo: no student home card, route kept", () => {
  assert.ok(!HOME_CARDS.some((c) => c.href.startsWith("publisher-demo")));
  assert.match(read("access-practice-lab/src/main.js"), /"publisher-demo"/);
});

test("grade counts say what they count", () => {
  const counts = [
    { id: "", count: 454 },
    { id: "7", count: 418 },
  ];
  const en = doc(gradeFocusHTML(EN, "7", { counts }));
  assert.match(en.querySelector(".grade-focus-counts").textContent, /All grades: 454 activities/);
  assert.match(
    en.querySelector(".grade-focus-counts").textContent,
    /includes the activities shared/,
  );
  assert.match(
    en.querySelector('[data-grade-focus="7"] .grade-focus-n').textContent,
    /418 activities/,
  );
  const es = doc(gradeFocusHTML(ES, "7", { counts }));
  assert.match(
    es.querySelector(".grade-focus-counts").textContent,
    /incluye las actividades compartidas/,
  );
  assert.equal(doc(gradeFocusHTML(EN, "7")).querySelector(".grade-focus-counts"), null);
});

test("privacy and accessibility pages: routes, site map, footer, both languages, no invented email", async () => {
  const main = read("access-practice-lab/src/main.js");
  for (const v of ["privacy", "accessibility"]) {
    assert.match(main, new RegExp(`${v}: \\(\\) => import\\("\\./views/${v}\\.js"\\)`));
    assert.equal(sm.DEST_BY_ID[v].section, "help");
    assert.equal(sm.DEST_BY_ID[v].href, v);
  }
  assert.match(main, /a === "privacy" \|\| a === "accessibility"\) return \{ \.\.\.r, view: a \}/);
  const nav = read("access-practice-lab/src/nav.js");
  assert.match(nav, /\$\{BASE\}\/privacy\$\{q\}/);
  assert.match(nav, /\$\{BASE\}\/accessibility\$\{q\}/);
  for (const [view, must] of [
    [
      privacy,
      [
        /accessPracticeLab/,
        /Cloudflare D1/,
        /alias/,
        /COPPA/,
        /FERPA/,
        /Maryland/,
        /not legal advice/,
        /Start everything fresh/,
        /No ads/,
      ],
    ],
    [accessibility, [/WCAG 2\.2/, /Known limits/, /tell your teacher/, /Read this page/]],
  ]) {
    for (const [I, lang] of [
      [EN, "en"],
      [ES, "es"],
    ]) {
      const out = view.render({ band: "6-8", prefs: { lang }, route: {} });
      const d = doc(out.html);
      assert.equal(d.querySelectorAll("h1").length, 1);
      const text = d.body.textContent;
      assert.doesNotMatch(text, /@[a-z0-9-]+\.[a-z]/i, "no email address");
      if (lang === "en") for (const re of must) assert.match(text, re);
      else assert.doesNotMatch(text, /The short version|What helps|Known limits/, "Spanish page");
      assert.ok(I);
    }
  }
});
