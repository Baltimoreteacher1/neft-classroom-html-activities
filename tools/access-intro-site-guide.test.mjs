// The Site Guide (/site-guide): audience visibility, search, every link it can print, and the markup rules
// (one h1, headings in order, single-level <details>, labeled landmarks, Spanish where promised).
// Renders the real view in JSDOM for every audience in English and Spanish. The browser half is
// tools/access-intro-site-guide-e2e.mjs.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const ROOT = new URL("../", import.meta.url);
const LAB = new URL("access-practice-lab/", ROOT);
const read = (p) => readFileSync(new URL(p, ROOT), "utf8");
const win = new JSDOM("<main id='app'></main><div id='labLive'></div>", {
  url: "https://lab.test/access-practice-lab/site-guide",
}).window;
for (const key of ["window", "document", "localStorage", "sessionStorage", "location", "history"])
  globalThis[key] = win[key];

const D = await import("../access-practice-lab/src/intro/data.js");
const G = await import("../access-practice-lab/src/intro/site-guide-data.js");
const M = await import("../access-practice-lab/src/intro/site-guide-more.js");
const S = await import("../access-practice-lab/src/intro/site-guide-search.js");
const view = await import("../access-practice-lab/src/intro/site-guide.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");
const intro = await import("../access-practice-lab/src/intro/state.js");

const AUDIENCES = ["", "teacher", "student", "family"];
const render = async (audience, lang = "en", id = "") => {
  const ctx = {
    route: { view: "site-guide", id, audience, q: "" },
    prefs: { lang },
    band: "6-8",
    navigate() {},
    rerender() {},
  };
  const out = await view.render(ctx);
  const doc = new JSDOM(`<body>${toHtml(out.html)}</body>`).window.document;
  return { doc, title: out.title };
};

// ── routes ───────────────────────────────────────────────────────────────────────────────────

/** First path segments the lab router understands (read from main.js, so a removed view fails here). */
const mainJs = read("access-practice-lab/src/main.js");
const VIEWS = new Set([
  ...[...mainJs.matchAll(/^\s{2}"?([\w-]+)"?: \(\) => import/gm)].map((m) => m[1]),
  ...[...mainJs.matchAll(/a === "([\w-]+)"/g)].map((m) => m[1]),
  ...[...mainJs.matchAll(/^\s{2}(?:"([\w-]+)"|(\w+)): "[\w-]+",?$/gm)].map((m) => m[1] || m[2]),
  "Listening",
  "Reading",
  "Speaking",
  "Writing",
]);
const stem = (route) => route.split(/[?#]/)[0].split("/").filter(Boolean)[0];

/** Content ids a route names, searched in the real content files (the e2e opens each in a browser). */
const CONTENT = [
  ["/voice/ladder/school-hallway", "src/content/voice-lab.js", "school-hallway"],
  ["/speak/spk-startime-argue", "content/studio/speaking.json", "spk-startime-argue"],
  [
    "/write/wrt-school-start-paragraph",
    "content/studio/writing.json",
    "wrt-school-start-paragraph",
  ],
  ["/scenarios/s68-hallway-bump", "src/content/scenarios.js", "s68-hallway-bump"],
  ["/newsroom/np-68-03", "src/content/newsroom.js", "np-68-03"],
  [
    "/reading-room/rr68p-why-we-have-seasons",
    "content/reading-room/lessons.json",
    "rr68p-why-we-have-seasons",
  ],
  ["/Listening/A/classroom-directions", "content/g6-8/Listening.json", "classroom-directions"],
];

test("every route the guide can link to is a lab view, and the named content exists", () => {
  const routes = S.allGuideRoutes();
  assert.ok(routes.length > 25, "the guide links to the whole site");
  for (const v of [
    "voice",
    "speak",
    "write",
    "scenarios",
    "newsroom",
    "wordlab",
    "library",
    "passport",
    "launch-studio",
    "classroom",
    "site-guide",
  ])
    assert.ok(VIEWS.has(v), `route table sanity: ${v}`);
  for (const r of routes) {
    assert.ok(r.startsWith("/"), `${r} is a lab route`);
    if (r.startsWith("/access-teacher/")) continue; // the Teacher Hub is a separate site area behind its own password
    assert.ok(VIEWS.has(stem(r)), `${r}: "${stem(r)}" is not a view in main.js`);
  }
  for (const [route, file, id] of CONTENT) {
    assert.ok(routes.includes(route), `${route} is linked`);
    const path = `access-practice-lab/${file}`;
    assert.ok(
      existsSync(new URL(path, ROOT)) && read(path).includes(id),
      `${id} exists in ${file}`,
    );
  }
});

test("curated activity facts are read from data.js, never retyped", () => {
  for (const a of D.ACTIVITIES) {
    const c = G.cardFor(a.id);
    assert.equal(c.name, a.name);
    assert.equal(c.route, a.route);
    assert.equal(c.time, a.time);
    assert.ok(c.preview?.sample, `${a.id} has a preview`);
  }
  for (const id of ["scenario", "newsroom"]) {
    const c = G.cardFor(id);
    assert.ok(
      c.preview.task && c.preview.sample && c.preview.source && c.preview.next,
      `${id} preview is complete`,
    );
    assert.ok(c.builtIn.length >= 3);
  }
  assert.deepEqual(G.SPEAKING_IDS.length, 3);
  assert.deepEqual(G.WRITING_IDS.length, 3);
  for (const a of M.OTHER_AREAS) assert.ok(a.route.startsWith("/") && a.start);
  assert.equal(G.STARTERS[0].id, "hallway");
  assert.equal(G.STARTERS[1].id, "upgrade");
});

test("no new file or route contains the substring teacher", () => {
  for (const f of readdirSync(new URL("src/intro/", LAB)))
    if (f.startsWith("site-guide")) assert.ok(!/teacher/i.test(f), f);
  for (const f of readdirSync(new URL("pictures/guide/", LAB))) assert.ok(!/teacher/i.test(f), f);
  for (const r of S.allGuideRoutes())
    if (!r.startsWith("/access-teacher")) assert.ok(!/teacher/i.test(r), r);
  for (const id of G.SECTION_IDS) assert.ok(!/teacher/i.test(id));
  for (const shot of M.SCREENSHOTS)
    assert.ok(existsSync(new URL(`pictures/guide/${shot.file}`, LAB)), shot.file);
});

// ── audiences ─────────────────────────────────────────────────────────────────────────────────

test("audience decides which sections show; any section opens by its own link", () => {
  assert.deepEqual(G.visibleSections(""), ["start", "speaking", "writing", "around", "help"]);
  assert.ok(G.visibleSections("teacher").includes("classroom"));
  assert.ok(!G.visibleSections("teacher").includes("home"));
  assert.ok(G.visibleSections("family").includes("home"));
  assert.ok(!G.visibleSections("student").includes("classroom"));
  assert.ok(G.visibleSections("student", "classroom").includes("classroom"));
  assert.ok(G.visibleSections("", "home").includes("home"));
  assert.equal(new Set(G.SECTION_IDS).size, 8);
});

test("the audience choice lives in the shared intro object without overwriting other keys", () => {
  localStorage.setItem(intro.INTRO_KEY, JSON.stringify({ tour: { stop: 3 } }));
  intro.updateIntro("siteGuideAudience", () => "family");
  const all = JSON.parse(localStorage.getItem(intro.INTRO_KEY));
  assert.deepEqual(all.tour, { stop: 3 });
  assert.equal(all.siteGuideAudience, "family");
  intro.clearIntro("siteGuideAudience");
  assert.deepEqual(JSON.parse(localStorage.getItem(intro.INTRO_KEY)), { tour: { stop: 3 } });
});

// ── search ────────────────────────────────────────────────────────────────────────────────────

test("search finds headings, explanations and activity names, with a section, an excerpt and one link", () => {
  const index = S.buildIndex();
  const mic = S.searchGuide(index, "microphone");
  assert.ok(
    mic.some((r) => r.section === "help"),
    "microphone leads to Help",
  );
  for (const r of mic) assert.ok(r.title && r.route.startsWith("/") && r.excerpt !== undefined);
  assert.equal(S.searchGuide(index, "hallway")[0].route.includes("hallway"), true);
  assert.ok(S.searchGuide(index, "upgrade").some((r) => r.route.includes("language-upgrade")));
  assert.ok(S.searchGuide(index, "micrófono").length > 0, "Spanish words are searchable");
  assert.ok(S.searchGuide(index, "print")[0], "print finds something");
  assert.deepEqual(S.searchGuide(index, "zzzqqq"), []);
  assert.deepEqual(S.searchGuide(index, " "), []);
  assert.deepEqual(S.tokens("a  Save?"), ["save"]);
  assert.ok(S.searchGuide(index, "SAVED work").length > 0, "case and punctuation do not matter");
});

// ── markup ────────────────────────────────────────────────────────────────────────────────────

test("every audience, in English and Spanish, renders valid structure", async () => {
  for (const audience of AUDIENCES) {
    for (const lang of ["en", "es", "bi"]) {
      const { doc, title } = await render(audience, lang);
      const label = `${audience || "general"}/${lang}`;
      assert.equal(
        title.startsWith("Your Guide") ||
          title.startsWith("Su guía") ||
          title.includes("Your Guide"),
        true,
        label,
      );
      assert.equal(doc.querySelectorAll("h1").length, 1, `${label}: one h1`);
      // headings never skip a level
      let last = 1;
      for (const h of doc.querySelectorAll("h1,h2,h3,h4")) {
        const n = Number(h.tagName[1]);
        assert.ok(n <= last + 1, `${label}: ${h.textContent.trim()} skips a level`);
        last = n;
      }
      for (const d of doc.querySelectorAll("details"))
        assert.equal(d.querySelectorAll("details").length, 0, `${label}: nested details`);
      for (const nav of doc.querySelectorAll("nav"))
        assert.ok(nav.getAttribute("aria-label"), `${label}: nav has a label`);
      assert.ok(doc.querySelector("[role=search]"), label);
      assert.ok(doc.querySelector("[role=status]"), `${label}: live region`);
      assert.ok(doc.querySelector("select[data-sg-select]"), `${label}: section selector`);
      assert.equal(doc.querySelector("label[for=sgJump]") !== null, true);
      const ids = [...doc.querySelectorAll("[id]")].map((e) => e.id);
      assert.equal(new Set(ids).size, ids.length, `${label}: duplicate ids`);
      assert.equal(doc.querySelectorAll("button[data-sg-audience]").length, 3);
      assert.equal(
        doc.querySelectorAll("button[data-sg-audience][aria-pressed=true]").length,
        audience ? 1 : 0,
        label,
      );
      // images carry real alt text; the domain cards' studio pictures are decorative (alt="")
      for (const img of doc.querySelectorAll("img"))
        assert.ok(
          img.alt.length > 30 || (img.closest(".tb-domain") && img.alt === ""),
          `${label}: alt`,
        );
      // every link is a lab link, the teacher entry, or a handout
      for (const a of doc.querySelectorAll("a[href]")) {
        const href = a.getAttribute("href");
        assert.ok(
          href.startsWith("/access-practice-lab/") ||
            href.startsWith("/access-teacher/") ||
            href.startsWith("#"),
          `${label}: ${href}`,
        );
        if (!href.startsWith("#") && href !== "/access-practice-lab/")
          assert.ok(
            VIEWS.has(stem(href.replace("/access-practice-lab", ""))) ||
              href.startsWith("/access-teacher/") ||
              /\.(pdf|docx)$/.test(href),
            `${label}: ${href}`,
          );
      }
    }
  }
});

test("links that open an activity carry the return hint; section and start links do not", async () => {
  const { doc } = await render("teacher");
  const all = [...doc.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
  for (const route of [
    D.ACTIVITIES[0].route,
    D.ACTIVITIES[2].route,
    "/scenarios/s68-hallway-bump",
    "/newsroom/np-68-03",
  ]) {
    assert.ok(
      all.some((h) => h.includes(route.split("?")[0]) && h.includes("intro=siteguide")),
      `${route} carries intro=siteguide`,
    );
  }
  for (const route of [
    D.ROUTES.start,
    D.ROUTES.tour,
    D.ROUTES.explore,
    D.ROUTES.guide,
    D.ROUTES.lesson,
  ]) {
    assert.ok(
      all.every((h) => !h.includes(`${route}?`) || !h.includes("intro=")),
      `${route} has no return wrapper`,
    );
  }
  const entrance = `/access-practice-lab${D.ROUTES.start}`;
  assert.equal(
    all.filter((h) => h === entrance).length,
    1,
    "the teacher start page is linked once for teachers",
  );
});

test("each curated card has one single-level See an Example and the five labels", async () => {
  const { doc } = await render("teacher");
  const cards = [...doc.querySelectorAll(".sg-card")];
  assert.equal(cards.length, 6);
  for (const c of cards) {
    assert.equal(c.querySelectorAll("details.in-preview").length, 1);
    assert.match(c.querySelector("details summary").textContent, /See an Example/);
    const text = c.textContent;
    for (const label of ["What it is", "What you’ll do", "Try it", "Get support", "Next step"])
      assert.ok(text.includes(label), label);
    assert.match(text, /Teaching moves you add \(not site features\)/);
  }
  const labels = [...doc.querySelectorAll(".sg-routine details summary")].length;
  assert.equal(labels, 3, "the three routines carry examples too");
  const student = (await render("student")).doc;
  assert.ok(!/Teaching moves/.test(student.querySelector("#sg-speaking").textContent));
});

test("Practice at Home is bilingual and uses the family page's own text", async () => {
  const fam = await import("../access-practice-lab/src/intro/family-data.js");
  const en = (await render("family", "en")).doc.querySelector("#sg-home").textContent;
  const es = (await render("family", "es")).doc.querySelector("#sg-home").textContent;
  for (const b of fam.practiceAtHome) {
    assert.ok(en.includes(b.en), b.id);
    assert.ok(es.includes(b.es), b.id);
  }
  assert.ok(es.includes("Practicar juntos"));
  const link = (await render("family", "en")).doc.querySelector("#sg-home a.btn-primary");
  assert.ok(link.getAttribute("href").includes("/practice-together"));
});

test("Spanish exists for the sections that promise it and never repeats the English", () => {
  const pairs = [
    ...M.WAYS.flatMap((w) => [w.q, w.a]),
    ...M.FAQ.flatMap((f) => [f.q, f.a]),
    ...G.START_STEPS.flatMap((s) => [s.head, s.body]),
    ...G.STARTERS.map((s) => s.why),
    ...M.SCREENSHOTS.map((s) => s.caption),
    G.GUIDE.title,
    G.GUIDE.lead,
    G.HOME.lead,
    ...G.SECTIONS.map((s) => s.title),
    ...G.AUDIENCES.map((a) => a.label),
    ...Object.values(G.CARD_TEXT).flatMap((c) => Object.values(c)),
  ];
  for (const p of pairs) {
    assert.ok(p.en && p.es, JSON.stringify(p));
    assert.notEqual(p.en, p.es);
  }
  for (const f of M.FAQ) assert.doesNotMatch(f.a.es, /^[A-Z][a-z]+ (the|your|a) /, f.id);
});

test("the guide invents no feature: claims are limited to what was verified", async () => {
  const text = [
    ...(await render("teacher")).doc.querySelectorAll("#sg-help, #sg-classroom, #sg-start"),
  ]
    .map((e) => e.textContent)
    .join(" ");
  assert.doesNotMatch(
    text,
    /automatic(ally)? (feedback|grad)|AI |translat(es|ion of) (the )?activit|leaderboard|timer|confetti|streak/i,
  );
  assert.match(text, /No account is needed/);
  assert.match(text, /never required/);
  assert.match(text, /Teacher Hub/);
});

test("teachers and new readers get a grade-aware summary; long sections fold and print open", async () => {
  for (const audience of ["", "teacher"]) {
    const { doc } = await render(audience);
    const ov = doc.querySelector(".sg-overview");
    assert.ok(ov, `${audience || "general"}: summary`);
    assert.equal(ov.querySelectorAll("[data-tb-pick]").length, 5, "five grade buttons");
    assert.equal(ov.querySelectorAll(".tb-domain").length, 4, "four domain cards");
    for (const a of ov.querySelectorAll(".tb-domain a[href]"))
      assert.match(a.getAttribute("href"), /[?&]grades=6-8/, a.getAttribute("href"));
    assert.ok(
      ov.querySelector('a[href="/access-practice-lab/start#ov-resources"]'),
      "resources entry point",
    );
  }
  for (const audience of ["family", "student"])
    assert.equal((await render(audience)).doc.querySelector(".sg-overview"), null, audience);
  const { doc } = await render("teacher");
  for (const id of ["speaking", "writing", "classroom", "around"]) {
    const btn = doc.querySelector(`[data-sg-toggle="${id}"]`);
    assert.equal(btn.getAttribute("aria-expanded"), "false", id);
    assert.equal(btn.getAttribute("aria-controls"), `sg-${id}-body`);
    assert.ok(doc.querySelector(`#sg-${id}-body`).hasAttribute("hidden"), id);
  }
  // A link to one section opens it.
  const one = (await render("teacher", "en", "classroom")).doc;
  assert.ok(!one.querySelector("#sg-classroom-body").hasAttribute("hidden"));
  assert.match(
    read("access-practice-lab/site-guide.css"),
    /@media print \{\s*\.sg-body\[hidden\] \{\s*display: block;/,
  );
});

test("the guide never links to the presenter view or presenter notes", async () => {
  for (const audience of AUDIENCES) {
    const { doc } = await render(audience);
    for (const a of doc.querySelectorAll("a[href]"))
      assert.doesNotMatch(
        a.getAttribute("href"),
        /\/start\/present|presenter-notes/,
        a.getAttribute("href"),
      );
    assert.doesNotMatch(doc.body.textContent, /Running the PD|Presenter notes/);
  }
});
