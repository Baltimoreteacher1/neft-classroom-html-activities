// The Site Guide (/site-guide): the short directory (three groups, name + sentence + link), audience choice, the
// step-by-step guide pages (/site-guide/<section>), search, every link it can print, and the markup rules
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
const DIR = await import("../access-practice-lab/src/intro/site-guide-directory.js");
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
/** A site path that is a folder served from disk (the Family Tour, the Teacher Hub, the WIDA Data Studio). */
const onDisk = (path) =>
  path.split(/[?#]/)[0].endsWith("/") &&
  existsSync(new URL(`${path.split(/[?#]/)[0].replace(/^\//, "")}index.html`, ROOT));
/** True when a lab route opens a view main.js routes, or a folder the lab serves from disk. */
const opens = (route) => VIEWS.has(stem(route)) || onDisk(`/access-practice-lab${route}`);
const FLIGHT_DECK = /flight[\s-]*deck/i;
/** A site path served from its own folder, or from the front layer's generated pages (lp/<path>). */
const siteOnDisk = (path) => onDisk(path) || onDisk(`/lp${path}`);

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
    if (r.startsWith("/access-teacher/")) {
      // the Teacher Hub is a separate site area behind its own password; its folder must exist
      assert.ok(onDisk(r), `${r} is a folder with an index.html`);
      continue;
    }
    if (DIR.siteRoutes().includes(r)) {
      // a site path outside the lab (BCPSS bridges, the Teacher Tools front pages under lp/): its folder must exist
      assert.ok(siteOnDisk(r), `${r} is a site folder with an index.html`);
      continue;
    }
    assert.ok(opens(r), `${r}: "${stem(r)}" is not a view in main.js or a folder on disk`);
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
  // Existing public site paths (Teacher Hub, BCPSS bridges) keep their names; new lab routes never say "teacher".
  for (const r of S.allGuideRoutes())
    if (!r.startsWith("/access-teacher") && !DIR.siteRoutes().includes(r))
      assert.ok(!/teacher/i.test(r), r);
  for (const id of G.SECTION_IDS) assert.ok(!/teacher/i.test(id));
  for (const shot of M.SCREENSHOTS)
    assert.ok(existsSync(new URL(`pictures/guide/${shot.file}`, LAB)), shot.file);
});

// ── audiences ─────────────────────────────────────────────────────────────────────────────────

test("the directory: three groups (teacher and student split into steps), each entry a name, one sentence and a link", () => {
  assert.deepEqual(
    DIR.DIRECTORY.map((g) => g.id),
    ["teacher", "student", "family"],
  );
  const entries = DIR.DIRECTORY.flatMap((g) => g.entries);
  assert.ok(entries.length >= 12 && entries.length <= 20, `${entries.length} entries stays short`);
  assert.equal(new Set(entries.map((e) => e.id)).size, entries.length, "no entry listed twice");
  for (const e of [...entries, ...DIR.ELSEWHERE]) {
    for (const p of [e.title, e.text]) {
      assert.ok(p.en && p.es && p.en !== p.es, `${e.id}: English and Spanish`);
      assert.doesNotMatch(`${p.en} ${p.es}`, FLIGHT_DECK, e.id);
    }
    assert.ok(e.text.en.length < 140, `${e.id}: one plain sentence`);
    assert.ok(e.route.startsWith("/"), e.id);
    assert.doesNotMatch(e.route, FLIGHT_DECK, e.id);
    if (e.route.startsWith("/access-teacher/")) assert.ok(onDisk(e.route), `${e.route} exists`);
    else if (e.site) assert.ok(siteOnDisk(e.route), `${e.id}: ${e.route} is a site folder`);
    else assert.ok(opens(e.route), `${e.id}: ${e.route} opens a lab view or a file on disk`);
  }
  // The surfaces a teacher looks for are all listed.
  const routes = DIR.directoryRoutes();
  for (const r of [
    "/start",
    "/start/tour",
    "/library",
    "/launch-studio",
    "/access-teacher/",
    "/access-teacher/predictive/",
    "/access-prep",
    "/book-studio",
    "/explore/practice",
    "/explore/play",
    "/family-tour/",
    "/practice-together",
    "/explore",
    "/access-teacher/classroom/",
    "/bcpss-teachers/",
  ])
    assert.ok(routes.includes(r), `${r} is in the directory`);
  // Every entry of a group with steps belongs to one of its steps, so nothing silently drops off the page.
  for (const g of DIR.DIRECTORY.filter((x) => x.subs)) {
    const ids = new Set(g.subs.map((x) => x.id));
    for (const e of g.entries) assert.ok(ids.has(e.sub), `${g.id}/${e.id} has a step`);
  }
  // The Teacher Tools front pages live on thelanguagepage.com only: off that host (this test) they are not listed.
  assert.ok(!DIR.directoryGroups("teacher")[0].entries.some((e) => e.id === "teacher-tools"));
  // Choosing an audience keeps only that group; the Family Tour shows only on its own host.
  assert.deepEqual(
    DIR.directoryGroups("family").map((g) => g.id),
    ["family"],
  );
  assert.equal(DIR.directoryGroups("").length, 3);
  // Off thelanguagepage.com (this test's host) families get Practice Together, never a link to the blocked tour.
  assert.deepEqual(
    DIR.directoryGroups("family")[0].entries.map((e) => e.id),
    ["practice-together", "family-corner"],
  );
  assert.equal(new Set(G.SECTION_IDS).size, 8, "every step-by-step guide keeps its own link");
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
      assert.equal(doc.querySelectorAll(".sg-dir").length, audience ? 1 : 3, `${label}: groups`);
      for (const li of doc.querySelectorAll(".sg-entry")) {
        assert.equal(li.querySelectorAll("a[href]").length, 1, `${label}: one link per entry`);
        assert.equal(li.querySelectorAll("p").length, 1, `${label}: one sentence per entry`);
      }
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
      assert.doesNotMatch(doc.body.textContent, FLIGHT_DECK, label);
      // every link is a lab link, the teacher entry, a listed site path (BCPSS bridges), or a handout
      for (const a of doc.querySelectorAll("a[href]")) {
        const href = a.getAttribute("href");
        assert.ok(
          href.startsWith("/access-practice-lab/") ||
            href.startsWith("/access-teacher/") ||
            DIR.siteRoutes().includes(href) ||
            href.startsWith("#"),
          `${label}: ${href}`,
        );
        if (!href.startsWith("#") && href !== "/access-practice-lab/")
          assert.ok(
            opens(href.replace("/access-practice-lab", "")) ||
              href.startsWith("/access-teacher/") ||
              (DIR.siteRoutes().includes(href) && siteOnDisk(href)) ||
              /\.(pdf|docx)$/.test(href),
            `${label}: ${href}`,
          );
      }
    }
  }
});

test("links that open an activity carry the return hint; section and start links do not", async () => {
  const { doc } = await render("teacher");
  const guides = [];
  for (const id of ["speaking", "writing"])
    guides.push(...(await render("teacher", "en", id)).doc.querySelectorAll("a[href]"));
  const all = [...doc.querySelectorAll("a[href]"), ...guides].map((a) => a.getAttribute("href"));
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
    [...doc.querySelectorAll("a[href]")].filter((a) => a.getAttribute("href") === entrance).length,
    1,
    "the teacher start page is linked once for teachers",
  );
});

test("each curated card has one single-level See an Example and the five labels", async () => {
  const cards = [];
  for (const id of ["speaking", "writing"])
    cards.push(...(await render("teacher", "en", id)).doc.querySelectorAll(".sg-card"));
  assert.equal(cards.length, 6);
  for (const c of cards) {
    assert.equal(c.querySelectorAll("details.in-preview").length, 1);
    assert.match(c.querySelector("details summary").textContent, /See an Example/);
    const text = c.textContent;
    for (const label of ["What it is", "What you’ll do", "Try it", "Get support", "Next step"])
      assert.ok(text.includes(label), label);
    assert.match(text, /Teaching moves you add \(not site features\)/);
  }
  const classroom = (await render("teacher", "en", "classroom")).doc;
  const labels = [...classroom.querySelectorAll(".sg-routine details summary")].length;
  assert.equal(labels, 3, "the three routines carry examples too");
  const student = (await render("student", "en", "speaking")).doc;
  assert.ok(!/Teaching moves/.test(student.querySelector("#sg-speaking").textContent));
});

test("Practice at Home is bilingual and uses the family page's own text", async () => {
  const fam = await import("../access-practice-lab/src/intro/family-data.js");
  const en = (await render("family", "en", "home")).doc.querySelector("#sg-home").textContent;
  const es = (await render("family", "es", "home")).doc.querySelector("#sg-home").textContent;
  for (const b of fam.practiceAtHome) {
    assert.ok(en.includes(b.en), b.id);
    assert.ok(es.includes(b.es), b.id);
  }
  assert.ok(es.includes("Practicar juntos"));
  const link = (await render("family", "en", "home")).doc.querySelector("#sg-home a.btn-primary");
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
    ...DIR.DIRECTORY.map((g) => g.title),
  ];
  for (const p of pairs) {
    assert.ok(p.en && p.es, JSON.stringify(p));
    assert.notEqual(p.en, p.es);
  }
  for (const f of M.FAQ) assert.doesNotMatch(f.a.es, /^[A-Z][a-z]+ (the|your|a) /, f.id);
});

test("the guide invents no feature: claims are limited to what was verified", async () => {
  const pages = await Promise.all(
    ["help", "classroom", "start"].map((id) => render("teacher", "en", id)),
  );
  const text = pages.map(({ doc }) => doc.querySelector(".sg-section").textContent).join(" ");
  assert.doesNotMatch(
    text,
    /automatic(ally)? (feedback|grad)|AI |translat(es|ion of) (the )?activit|leaderboard|timer|confetti|streak/i,
  );
  assert.match(text, /No account is needed/);
  assert.match(text, /never required/);
  assert.match(text, /Teacher Hub/);
});

test("the main page is a calm directory; each step-by-step guide opens alone on its own page", async () => {
  intro.clearIntro("siteGuideAudience"); // a new reader: nobody chosen on this device yet
  const { doc } = await render("");
  assert.equal(doc.querySelector(".sg-overview"), null, "no grade picker on the guide");
  assert.equal(
    doc.querySelectorAll("[data-sg-toggle], select").length,
    0,
    "no fold buttons, no selector",
  );
  assert.deepEqual(
    [...doc.querySelectorAll(".sg-section")].map((s) => s.id),
    ["sg-help"],
    "Help is the only full section on the main page",
  );
  const guides = [...doc.querySelectorAll(".sg-guides a")].map((a) => a.getAttribute("href"));
  assert.deepEqual(
    guides,
    G.SECTION_IDS.filter((id) => id !== "help").map(
      (id) => `/access-practice-lab/site-guide/${id}`,
    ),
  );
  const entries = doc.querySelectorAll(".sg-entry").length;
  assert.ok(entries >= 12 && entries <= 20, `${entries} entries`);
  for (const id of G.SECTION_IDS) {
    const page = (await render("teacher", "en", id)).doc;
    assert.deepEqual(
      [...page.querySelectorAll(".sg-section")].map((s) => s.id),
      [`sg-${id}`],
      id,
    );
    assert.equal(page.querySelectorAll(".sg-dir").length, 0, `${id}: no directory`);
    assert.match(page.querySelector(".sg-back a").textContent, /Back to Guide/);
    assert.doesNotMatch(page.body.textContent, FLIGHT_DECK, id);
  }
  // Print prints each link's address after it.
  assert.match(read("access-practice-lab/site-guide.css"), /\.sg-page a\[data-url\]::after/);
});

test("the guide never links to the presenter view or presenter notes", async () => {
  const pages = [...AUDIENCES.map((a) => [a, ""]), ...G.SECTION_IDS.map((id) => ["teacher", id])];
  for (const [audience, id] of pages) {
    const { doc } = await render(audience, "en", id);
    for (const a of doc.querySelectorAll("a[href]"))
      assert.doesNotMatch(
        a.getAttribute("href"),
        /\/start\/present|presenter-notes/,
        a.getAttribute("href"),
      );
    assert.doesNotMatch(doc.body.textContent, /Running the PD|Presenter notes/);
  }
});
