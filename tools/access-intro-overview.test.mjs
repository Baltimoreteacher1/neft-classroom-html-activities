// The teacher Start overview (/start): grade-aware for every pick, domain cards that carry the grade, a families
// section that links to the family page and the handout, a resources library, and no on-site link to the presenter
// view or presenter notes (from /start, the teacher nav, the Quick Guide or the Site Guide). Renders the real views in
// JSDOM. The browser half is the overview block of tools/access-intro-e2e.mjs.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const win = new JSDOM("<main id='app'></main><div id='labLive'></div>", {
  url: "https://lab.test/access-practice-lab/start",
}).window;
for (const key of ["window", "document", "localStorage", "sessionStorage", "location", "history"])
  globalThis[key] = win[key];

const D = await import("../access-practice-lab/src/intro/data.js");
const { GRADE_PICKS } = await import("../access-practice-lab/src/grade-bands.js");
const start = await import("../access-practice-lab/src/intro/start.js");
const O = await import("../access-practice-lab/src/intro/start-overview.js");
const R = await import("../access-practice-lab/src/intro/start-resources.js");
const { TEACHER_NAV, teacherNavHTML } = await import("../access-practice-lab/src/intro/shell.js");
const { GUIDE_FILES } = await import("../access-practice-lab/src/intro/quick-guide-model.js");
const { FAMILY_HANDOUT, familyBandFromGrades } = await import(
  "../access-practice-lab/src/intro/family-data.js"
);
const siteGuide = await import("../access-practice-lab/src/intro/site-guide.js");
const intro = await import("../access-practice-lab/src/intro/state.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");

const PRESENTER = /\/start\/present|presenter-notes/;
const ctxFor = (route) => ({
  route,
  prefs: { lang: "en" },
  band: "6-8",
  navigate() {},
  rerender() {},
});
const doc = (markup) => new JSDOM(`<body>${toHtml(markup)}</body>`).window.document;
const renderStart = async (grades) => {
  const out = await start.render(ctxFor({ view: "start", id: "", grades, stop: "", focus: "" }));
  return { d: doc(out.html), title: out.title };
};
const hrefs = (d) => [...d.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
const PICKS = GRADE_PICKS.map((p) => p.id);

test("the page renders for every grade choice with one h1, ordered headings and no duplicate ids", async () => {
  for (const pick of PICKS) {
    const { d, title } = await renderStart(pick);
    assert.match(title, /^Start here/);
    assert.equal(d.querySelectorAll("h1").length, 1, pick);
    let last = 1;
    for (const h of d.querySelectorAll("h1,h2,h3,h4")) {
      const n = Number(h.tagName[1]);
      assert.ok(n <= last + 1, `${pick}: "${h.textContent.trim()}" skips a level`);
      last = n;
    }
    const ids = [...d.querySelectorAll("[id]")].map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length, `${pick}: duplicate ids`);
    assert.equal(d.querySelector('[data-tb-pick][aria-pressed="true"]').dataset.tbPick, pick);
    assert.equal(d.querySelectorAll(".in-choices > li").length, D.START_CHOICES.length);
    for (const a of d.querySelectorAll(".ov-jump a"))
      assert.ok(d.querySelector(a.getAttribute("href")), a.getAttribute("href"));
    // Grades 6–8 material shows only for Grades 6–8, and says so.
    const more = d.querySelector("#ov-more");
    if (pick === "6-8") assert.match(more.textContent, /Grades 6–8/);
    else assert.equal(more, null, pick);
  }
});

test("every domain card link carries grades=, and the tour link opens Part 2 with that card's skill", async () => {
  for (const pick of PICKS) {
    const { d } = await renderStart(pick);
    const cards = [...d.querySelectorAll(".tb-domain")];
    assert.equal(cards.length, 4, pick);
    cards.forEach((card, i) => {
      const links = [...card.querySelectorAll("a[href]")].map(
        (a) => new URL(a.getAttribute("href"), "https://x.test"),
      );
      assert.equal(links.length, 2, pick);
      for (const u of links) assert.equal(u.searchParams.get("grades"), pick, u.href);
      const tour = links.find((u) => u.pathname.endsWith("/start/tour"));
      assert.equal(tour.searchParams.get("part"), "2", `${pick}: card ${i + 1} opens Part 2`);
      assert.equal(
        tour.searchParams.get("skill"),
        ["listening", "speaking", "reading", "writing"][i],
        `${pick}: card ${i + 1} chooses its skill`,
      );
      assert.equal(tour.searchParams.get("stop"), null, "no legacy ?stop= links");
      const open = links.find((u) => !u.pathname.endsWith("/start/tour"));
      assert.equal(
        open.searchParams.get("intro"),
        "start",
        "the activity offers a way back to Start",
      );
    });
    const tourChoice = new URL(
      d.querySelector(".in-choice.is-tour").getAttribute("href"),
      "https://x.test",
    );
    assert.equal(tourChoice.searchParams.get("grades"), pick);
  }
  assert.equal(O.DOMAIN_STOP, undefined);
  assert.equal(
    O.tourHref("4-5", "reading"),
    "/access-practice-lab/start/tour?part=2&skill=reading&grades=4-5",
  );
  assert.equal(O.tourHref("K"), "/access-practice-lab/start/tour?grades=K");
});

test("families: the family page link carries the grade, copy and preview agree, both handouts are linked", async () => {
  for (const pick of PICKS) {
    const { d } = await renderStart(pick);
    const fam = d.querySelector("#ov-families");
    const preview = [...fam.querySelectorAll("a[href]")].find((a) =>
      /Preview the family page/.test(a.textContent),
    );
    const u = new URL(preview.getAttribute("href"), "https://x.test");
    assert.equal(u.pathname, `/access-practice-lab${D.ROUTES.together}`);
    assert.equal(
      familyBandFromGrades(u.searchParams.get("grades")),
      { K: "k-2", 1: "k-2", "2-3": "k-2", "4-5": "3-5", "6-8": "6-8" }[pick],
    );
    assert.equal(fam.querySelector("[data-ov-copy]").dataset.ovCopy, D.absUrl(R.familyRoute(pick)));
    const links = hrefs(fam);
    for (const f of [FAMILY_HANDOUT.en, FAMILY_HANDOUT.es])
      for (const p of [f.pdf, f.docx]) assert.ok(links.includes(p), p);
    // K–2 families get the early-learner page, not Let's Talk / Let's Write.
    const early = ["K", "1", "2-3"].includes(pick);
    assert.equal(/Let’s Talk and Let’s Write/.test(fam.textContent), !early, pick);
  }
});

test("resources: a library of the teacher handouts with formats and page counts, never presenter notes", async () => {
  const { d } = await renderStart("4-5");
  const res = d.querySelector("#ov-resources");
  const names = [...res.querySelectorAll("h3")].map((h) => h.textContent.trim());
  assert.deepEqual(names, [
    "Quick Guide",
    "Activity Guide",
    "Site Directory",
    "Featured lesson backup",
    "Site Guide",
  ]);
  for (const r of R.RESOURCES.filter((x) => x.files)) {
    assert.ok(hrefs(res).includes(r.files.pdf) && hrefs(res).includes(r.files.docx), r.id);
    assert.ok(r.pages > 0, r.id);
  }
  assert.doesNotMatch(res.textContent, /presenter/i);
});

test("no on-site link to /start/present or presenter notes: /start, teacher nav, Quick Guide, Site Guide", async () => {
  for (const pick of PICKS) {
    const { d } = await renderStart(pick);
    for (const h of hrefs(d)) assert.doesNotMatch(h, PRESENTER, `${pick}: ${h}`);
    assert.doesNotMatch(d.body.textContent, /Run a PD session|presenter view|Presenter notes/i);
  }
  assert.ok(!TEACHER_NAV.some((n) => /present/.test(n.route)));
  assert.equal(D.ROUTES.present, undefined, "the presenter view route is gone");
  for (const h of hrefs(doc(teacherNavHTML("overview")))) assert.doesNotMatch(h, PRESENTER, h);
  for (const f of GUIDE_FILES.downloads)
    assert.doesNotMatch(`${f.pdf} ${f.docx} ${f.name}`, /presenter/i);
  for (const audience of ["", "teacher", "student", "family"]) {
    const out = await siteGuide.render(
      ctxFor({ view: "site-guide", id: "", audience, q: "", grades: "" }),
    );
    for (const h of hrefs(doc(out.html))) assert.doesNotMatch(h, PRESENTER, h);
  }
  // The route itself keeps answering (the lead decides about unpublishing).
  const present = await start.render(
    ctxFor({ view: "start", id: "present", grades: "", stop: "1", focus: "" }),
  );
  assert.ok(present.html);
});

test("Pick up where you left off follows the three-part teacher tour", () => {
  const [item] = O.progressItems({ guided: { part: 2, pick: "2-3", skill: "reading" } });
  assert.equal(item.text, "Teacher tour: Part 2 of 3, Try it as a student");
  assert.match(item.href, /\/start\/tour$/);
  assert.equal(item.cta, "Resume the tour");
  assert.deepEqual(O.progressItems({ guided: { part: 1 } }), [], "Part 1 is not progress");
  assert.deepEqual(O.progressItems({ guided: { part: 3, done: true } }), [], "a finished tour");
  // A device saved by the old four-part tour must not break the overview.
  assert.doesNotThrow(() => O.progressItems({ guided: { part: 4, skill: "reading" } }));
  assert.deepEqual(
    O.progressItems({ tour: { stop: 3 } }),
    [],
    "the old six-stop record is ignored",
  );
  assert.deepEqual(O.progressItems({}), []);
  intro.clearIntro?.("guided");
});
