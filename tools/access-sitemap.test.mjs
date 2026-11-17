// The site map (access-practice-lab/src/sitemap.js) is the one registry behind the top navigation, the More menu, the
// section bar, /explore and the teacher and family start pages. These checks keep every entry honest.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { JSDOM } from "jsdom";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const sm = await import(new URL("src/sitemap.js", LAB));
const sprite = readFileSync(new URL("pictures/ui-icons.svg", LAB), "utf8");

// The router's own parser, lifted from main.js (main.js itself needs a browser to import).
const mainSrc = readFileSync(new URL("src/main.js", LAB), "utf8");
const start = mainSrc.indexOf("export function parseRoute");
const parseRoute = new Function(
  "BASE",
  "readMathLanguageBridge",
  "DOMAINS",
  `${mainSrc.slice(start, mainSrc.indexOf("\n}\n", start) + 2).replace("export ", "")};return parseRoute;`,
)("/access-practice-lab", () => null, [
  "Listening",
  "Reading",
  "Speaking",
  "Writing",
  "Model-Test",
]);
const loaders = new Set(
  [...mainSrc.matchAll(/^\s+"?([a-z-]+)"?: \(\) => import\(/gm)].map((m) => m[1]),
);
const aliases = new Set(
  [
    ...mainSrc
      .slice(mainSrc.indexOf("const VIEW_ALIASES"), mainSrc.indexOf("const viewCache"))
      .matchAll(/"?([a-z-]+)"?: "/g),
  ].map((m) => m[1]),
);

test("every destination is complete, bilingual and unique", () => {
  const ids = new Set();
  const sections = new Set(sm.SECTIONS.map((s) => s.id));
  const skills = new Set(sm.SKILLS.map((s) => s.id));
  const audiences = new Set(sm.AUDIENCES.map((a) => a.id));
  for (const d of sm.DESTINATIONS) {
    assert.ok(!ids.has(d.id), `duplicate id ${d.id}`);
    ids.add(d.id);
    assert.ok(sections.has(d.section), `${d.id}: section ${d.section}`);
    assert.ok(skills.has(d.skill), `${d.id}: skill ${d.skill}`);
    assert.ok(sm.KINDS[d.kind], `${d.id}: kind ${d.kind}`);
    assert.ok(d.for.length && d.for.every((a) => audiences.has(a)), `${d.id}: audiences`);
    for (const pair of [d.title, d.text])
      assert.ok(pair.length === 2 && pair.every((s) => s.trim()), `${d.id}: English and Spanish`);
    assert.ok(sprite.includes(`id="${d.icon}"`), `${d.id}: icon ${d.icon} is in the sprite`);
    assert.ok(
      !/\b(score|level \d|proficien)/i.test(d.text[0]) || /never|not/i.test(d.text[0]),
      `${d.id}: no proficiency claim`,
    );
  }
  for (const s of sm.SECTIONS)
    assert.ok(
      sprite.includes(`id="${s.icon}"`) && s.title.length === 2 && s.lead.length === 2,
      s.id,
    );
});

test("every lab route parses to a real view and locates back to its own destination", () => {
  for (const d of sm.DESTINATIONS) {
    if (d.href.startsWith("/")) {
      assert.ok(
        d.external ||
          /^\/(graphic-novels|language-adventures|language-studio|access-teacher|learning-studios|studios|access-practice-lab\/videos)\//.test(
            d.href,
          ),
        `${d.id}: site path served on the lab host or marked external`,
      );
      continue;
    }
    const [path, query] = d.href.split("?");
    const route = parseRoute(`/access-practice-lab/${path}`, query ? `?${query}` : "");
    assert.ok(!route.notFound, `${d.id}: ${d.href} is a route`);
    assert.ok(
      ["room", "activity"].includes(route.view) ||
        loaders.has(route.view) ||
        aliases.has(route.view),
      `${d.id}: view ${route.view} has a loader`,
    );
    assert.equal(sm.locate(route)?.id, d.id, `${d.id}: locate(${d.href})`);
  }
});

test("deep routes land in the right section", () => {
  const at = (p) => sm.locate(parseRoute(p, ""))?.id;
  assert.equal(at("/access-practice-lab/Listening/A/l-3"), "listening");
  assert.equal(at("/access-practice-lab/journey/map"), "journey-map");
  assert.equal(at("/access-practice-lab/journey/m03"), "journey");
  assert.equal(at("/access-practice-lab/city/cafe/order"), "city");
  assert.equal(at("/access-practice-lab/class/quiz"), "class-quiz");
});

test("the section bar shows siblings in one skill and the explore view filters", async () => {
  const speak = sm.DEST_BY_ID.speak;
  const sibs = sm.siblings(speak, "6-8").map((d) => d.id);
  assert.ok(sibs.includes("speak") && sibs.every((id) => sm.DEST_BY_ID[id].skill === "Speaking"));
  assert.ok(
    !sm.siblings(sm.DEST_BY_ID.speak, "K").some((d) => d.id === "arena"),
    "band-limited places stay out of other bands",
  );
  const dom = new JSDOM("<main></main>", { url: "https://lab.test/access-practice-lab/explore" });
  for (const k of ["window", "document", "location", "history", "localStorage"])
    globalThis[k] = dom.window[k];
  const xp = await import(new URL("src/views/explore.js", LAB));
  const games = sm.DESTINATIONS.filter((d) =>
    xp.matches(d, { section: "", for: "", skill: "", kind: "game", q: "" }, "6-8"),
  );
  assert.ok(games.length >= 2 && games.every((d) => d.kind === "game"));
  const debate = sm.DESTINATIONS.filter((d) =>
    xp.matches(d, { section: "", for: "", skill: "", kind: "", q: "debate" }, "6-8"),
  );
  assert.deepEqual(
    debate.map((d) => d.id),
    ["arena"],
  );
  const kids = sm.DESTINATIONS.filter((d) =>
    xp.matches(d, { section: "", for: "", skill: "", kind: "", q: "" }, "K"),
  );
  assert.ok(
    kids.length && !kids.some((d) => d.id === "speak"),
    "K–3 directory lists only views the early gate opens",
  );
});

test("navigation: six audience places on top, every former top-row door in More, one current link", async () => {
  // 2026-11-17 navigation redesign: the top row names audiences (Home · Teachers · Students · Families · Find
  // Resources · Help). The nine former top-row doors stay one click away at the top of More.
  const { navHTML, currentTop } = await import(new URL("src/nav.js", LAB));
  const { makeI18n } = await import(new URL("src/i18n.js", LAB));
  const { toHtml } = await import(new URL("src/util.js", LAB));
  const I = makeI18n("en", "en");
  const render = (band, route) =>
    new JSDOM(`<nav>${toHtml(navHTML({ band, route }, I))}</nav>`).window.document;
  const doc = render("6-8", { view: "wordlab" });
  const top = [...doc.querySelectorAll("nav > a")].map((a) => a.textContent.trim());
  assert.deepEqual(top, ["Home", "Teachers", "Students", "Families", "Find Resources", "Help"]);
  assert.equal(doc.querySelectorAll('nav > a[aria-current="page"]').length, 1);
  assert.match(doc.querySelector('nav > a[aria-current="page"]').textContent, /Students/);
  const hrefOf = (label) =>
    [...doc.querySelectorAll("nav > a")]
      .find((a) => a.textContent.trim() === label)
      .getAttribute("href");
  assert.equal(hrefOf("Teachers"), "/access-teacher/");
  assert.equal(hrefOf("Students"), "/access-practice-lab/students?grades=6-8");
  assert.equal(hrefOf("Families"), "/access-practice-lab/family-start");
  assert.equal(hrefOf("Find Resources"), "/access-practice-lab/search?grades=6-8");
  assert.equal(hrefOf("Help"), "/access-practice-lab/site-guide?grades=6-8");
  // Every former top-row door, one click away in More (Access Prep first).
  const go = [...doc.querySelectorAll(".lab-utilities-body .menu-go a")].map((a) =>
    a.textContent.trim(),
  );
  assert.equal(go[0], "Access Prep");
  for (const door of [
    "Access Prep",
    "Practice",
    "Games & Worlds",
    "My Progress",
    "Create a Book",
    "Site Guide",
  ])
    assert.ok(go.includes(door), `More keeps ${door}`);
  // K–3: the same six places; the early home, activity finder and Passport are in More.
  const early = render("K", { view: "early" });
  assert.deepEqual(
    [...early.querySelectorAll("nav > a")].map((a) => a.textContent.trim()),
    top,
  );
  assert.match(early.querySelector('nav > a[aria-current="page"]').textContent, /Students/);
  const earlyGo = [...early.querySelectorAll(".menu-go a")].map((a) => a.getAttribute("href"));
  for (const path of ["/access-prep?", "/early?", "/library?", "/passport?", "/book-studio?"])
    assert.ok(
      earlyGo.some((h) => h.includes(path)),
      `K More keeps ${path}`,
    );
  const cases = {
    home: "home",
    students: "students",
    city: "students",
    "family-start": "families",
    family: "families",
    "practice-together": "families",
    search: "find",
    "site-guide": "help",
    privacy: "help",
    start: "teachers",
    launch: "teachers",
  };
  for (const [view, want] of Object.entries(cases)) assert.equal(currentTop({ view }), want, view);
  assert.equal(currentTop({ view: "explore", id: "prep" }), "students");
  assert.equal(currentTop({ view: "explore", id: "teach" }), "teachers");
  assert.equal(currentTop({ view: "explore" }), "find");
  const menu = [...doc.querySelectorAll(".lab-utilities-body .menu-group")];
  assert.ok(
    menu.every((g) => g.querySelectorAll("a:not(.menu-all)").length <= 10),
    "no menu group is a wall of links",
  );
});
