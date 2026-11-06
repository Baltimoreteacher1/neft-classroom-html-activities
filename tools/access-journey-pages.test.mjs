// Journey pages: Continue My Journey hero, journey map, mission overview, lab home hierarchy, navigation, CSS rules.
// Real state.js / recommend.js on fabricated states; pages are driven through the same `deps` the route view passes.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const read = (p) => readFile(new URL(p, LAB), "utf8");

const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
const { MISSION_IDS, MISSIONS, STEP_IDS, UNITS } = await import(
  "../access-practice-lab/src/journey/curriculum.js"
);
const S = await import("../access-practice-lab/src/journey/state.js");
const { recommendNext } = await import("../access-practice-lab/src/journey/recommend.js");
const pages = await import("../access-practice-lab/src/journey/ui/pages.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");

const NOW = "2026-11-04T12:00:00.000Z";
const BANDS = ["3-5", "6-8"];
const dom = (markup) => new JSDOM(`<body>${toHtml(markup)}</body>`).window.document;
const all = (root, sel) => [...root.querySelectorAll(sel)];
const textOf = (root) => root.body.textContent.replace(/\s+/g, " ");

/** Missions 1-7 shown independently, mission 8 mid-way: discover done, understand done with help, build done, communicate started. */
function returning(band) {
  let s = S.emptyState();
  for (const m of MISSION_IDS.slice(0, 7))
    for (const st of STEP_IDS) s = S.completeStep(s, band, m, st, { independent: true, now: NOW });
  s = S.completeStep(s, band, "m08", "discover", { independent: true, now: NOW });
  s = S.noteHelp(s, band, "m08", "understand", "bank", NOW);
  s = S.completeStep(s, band, "m08", "understand", { independent: false, now: NOW });
  s = S.completeStep(s, band, "m08", "build", { independent: true, now: NOW });
  s = S.startStep(s, band, "m08", "communicate", NOW);
  return S.revisitStep(s, band, "m01", "discover", NOW);
}
const growthLedger = (band) => ({
  entries: [
    { t: NOW, src: "mission", task: "m02.communicate", band, kind: "first" },
    { t: NOW, src: "mission", task: "m02.improve", band, kind: "revision" },
  ],
});
const reviews = [
  {
    mission: "m06",
    step: "show",
    feature: "evidence",
    reason: ["Try it on your own.", "Inténtalo por tu cuenta."],
  },
];
function deps(band, state, { mode = "en", ledger = { entries: [] }, withReviews = false, I } = {}) {
  const s = state ?? S.emptyState();
  return {
    band,
    state: s,
    ledger,
    I: I ?? makeI18n(mode, "en"),
    recommendation: recommendNext(s, band, { ledger, now: NOW }),
    reviews: withReviews ? reviews : [],
  };
}
const ctxFor = (band, mode = "en") => ({
  band,
  bands: BANDS,
  prefs: { lang: mode },
  route: { view: "journey" },
});

test("a new student sees Start My Learning Journey and a link to Mission 1", () => {
  for (const band of BANDS) {
    const doc = dom(pages.homeHTML(ctxFor(band), deps(band)));
    assert.equal(all(doc, "h1").length, 1, "one h1");
    assert.match(doc.querySelector("h1").textContent, /Start My Learning Journey/);
    const go = doc.querySelector("[data-journey-go]");
    assert.match(go.getAttribute("href"), /\/journey\/m01\/discover\?grades=/);
    assert.match(go.textContent, /Start Mission 1/);
    assert.ok(doc.querySelector(".jr-why").textContent.includes("Why this step"));
    assert.match(
      doc.querySelector("[data-explore-all]").getAttribute("href"),
      /\/library\?grades=/,
    );
    assert.match(textOf(doc), /Explore all activities/);
    assert.equal(all(doc, ".jr-hero .jr-pip").length, 6);
  }
});

test("a returning student sees Continue Mission 8 with unit, step, goal, duration, progress and reason", () => {
  for (const band of BANDS) {
    const d = deps(band, returning(band));
    assert.equal(d.recommendation.mission, "m08");
    assert.equal(d.recommendation.step, "communicate");
    const doc = dom(pages.homeHTML(ctxFor(band), d));
    const h1 = doc.querySelector("h1").textContent;
    assert.match(h1, /Continue Mission 8: Causes and Consequences/);
    const facts = doc.querySelector(".jr-facts").textContent.replace(/\s+/g, " ");
    assert.match(facts, /Unit 3: Investigate and Explain/);
    assert.match(facts, /Step 4 of 6 · Communicate/);
    assert.ok(facts.includes(MISSIONS.m08.goal[band][0]), "language goal in the student's band");
    assert.match(doc.querySelector(".jr-time").textContent, /about 12 minutes/);
    assert.match(
      doc.querySelector(".jr-hero-prog .jr-status").textContent.replace(/\s+/g, " "),
      /In progress · 3 of 6 steps done/,
    );
    assert.ok(doc.querySelector(".jr-why").textContent.includes(d.recommendation.reason[0]));
    assert.match(
      doc.querySelector("[data-journey-go]").getAttribute("href"),
      /\/journey\/m08\/communicate/,
    );
    // the navigation the brief requires
    const hrefs = all(doc, "a").map((a) => a.getAttribute("href"));
    for (const part of ["/journey/map", "/library", "/passport", "/family", "/learn"])
      assert.ok(
        hrefs.some((h) => h.includes(part)),
        `link to ${part}`,
      );
    assert.equal(all(doc, ".jr-units-glance .jr-unit-card").length, 4);
  }
});

test("mission status wording: in progress, completed with support, shown on my own", () => {
  const band = "6-8";
  let s = returning(band);
  for (const st of STEP_IDS)
    s = S.completeStep(s, band, "m08", st, { independent: false, now: NOW });
  const done = dom(pages.mapHTML(ctxFor(band), deps(band, s)));
  assert.match(done.querySelector("#jr-m08 .jr-status").textContent, /Completed with support/);
  assert.match(done.querySelector("#jr-m01 .jr-status").textContent, /Shown on my own/);
  assert.match(done.querySelector("#jr-m09 .jr-status").textContent, /Not started|In progress/);
  const mid = dom(pages.mapHTML(ctxFor(band), deps(band, returning(band))));
  assert.match(mid.querySelector("#jr-m08 .jr-status").textContent, /In progress/);
});

test("the map renders 12 missions x 6 steps in both bands, as nested ordered lists, with one You are here", () => {
  for (const band of BANDS) {
    const doc = dom(
      pages.mapHTML(
        ctxFor(band),
        deps(band, returning(band), { ledger: growthLedger(band), withReviews: true }),
      ),
    );
    assert.equal(all(doc, "h1").length, 1);
    assert.equal(doc.querySelector(".jr-map-page").dataset.band, band);
    assert.equal(all(doc, "ol.jr-units > li.jr-unit").length, UNITS.length);
    assert.equal(all(doc, "ol.jr-trail > li.jr-node").length, 12);
    assert.equal(all(doc, "li.jr-node ol.jr-pips > li > a.jr-pip").length, 72, "12 x 6 step links");
    for (const id of MISSION_IDS) {
      const node = doc.querySelector(`#jr-${id}`);
      assert.equal(all(node, "a.jr-pip").length, 6, `${id} has six steps`);
      assert.ok(node.querySelector(`a[href*="/journey/${id}?"]`), `${id} links to its overview`);
      assert.equal(node.querySelector(".jr-env").dataset.env, MISSIONS[id].environment);
      assert.ok(node.querySelector(".jr-env svg"), "environment glyph");
    }
    // states carry a glyph and words, not colour alone
    const states = new Set(all(doc, "a.jr-pip").map((a) => a.dataset.state));
    for (const st of ["new", "started", "done-supported", "done-independent"])
      assert.ok(states.has(st), st);
    for (const pip of all(doc, "a.jr-pip")) {
      assert.ok(pip.getAttribute("aria-label").length > 12, "pip has words for assistive tech");
      assert.ok(pip.querySelector(".jr-pip-dot svg, .jr-pip-dot b"), "pip has a glyph or number");
    }
    assert.ok(
      doc.querySelector("#jr-m01 .jr-pip.is-revisited .jr-pip-rev svg"),
      "revisited marker",
    );
    // You are here
    const here = all(doc, ".jr-here");
    assert.equal(here.length, 1);
    assert.match(here[0].textContent, /You are here/);
    assert.ok(here[0].closest("#jr-m08"));
    const current = all(doc, 'a.jr-pip[aria-current="step"]');
    assert.equal(current.length, 1);
    assert.equal(current[0].dataset.step, "communicate");
    assert.match(current[0].getAttribute("aria-label"), /You are here/);
    assert.ok(doc.querySelector('a[href="#jr-m08"]'), "jump link to the current mission");
    // legend, spiral, review, evidence
    assert.equal(all(doc, ".jr-legend li").length, 5);
    assert.ok(doc.querySelector("#jr-m08 .jr-mark.is-spiral"), "builds on");
    assert.ok(
      doc.querySelector("#jr-m06 .jr-mark.is-review a[href*='/journey/m06/show']"),
      "review marker",
    );
    const ba = doc.querySelector("#jr-m02 .jr-mark.is-evidence a");
    assert.match(ba.textContent, /Before & After/);
    assert.match(ba.getAttribute("href"), /\/journey\/m02\?grades=.*#before-after/);
    assert.equal(
      doc.querySelector("#jr-m03 .jr-mark.is-evidence"),
      null,
      "no badge without a record",
    );
  }
});

test("mission overview for m08: goal, six step cards, practice, domains, reviews, family and teacher links", async () => {
  for (const band of BANDS) {
    const doc = dom(
      await pages.overviewHTML(
        ctxFor(band),
        "m08",
        deps(band, returning(band), { ledger: growthLedger(band) }),
      ),
    );
    assert.equal(all(doc, "h1").length, 1);
    assert.match(doc.querySelector("h1").textContent, /Mission 8\s+Causes and Consequences/);
    assert.ok(doc.querySelector(".jr-goal").textContent.includes(MISSIONS.m08.goal[band][0]));
    assert.ok(doc.querySelector(".lead").textContent.includes("Save the School Garden"));
    const steps = all(doc, "ol.jr-steps > li a.jr-step-card");
    assert.equal(steps.length, 6);
    steps.forEach((a, i) =>
      assert.ok(a.getAttribute("href").includes(`/journey/m08/${STEP_IDS[i]}?`)),
    );
    assert.equal(all(doc, ".jr-step.is-here").length, 1);
    assert.equal(all(doc, ".jr-chip").length, MISSIONS.m08.features.length);
    assert.equal(all(doc, ".jr-domains .jr-domain").length, 4);
    const links = all(doc, "a").map((a) => a.getAttribute("href"));
    assert.ok(
      links.some((h) => h.includes("/journey/m07?")),
      "review m07",
    );
    assert.ok(
      links.some((h) => h.includes("/journey/m06?")),
      "review m06",
    );
    assert.ok(
      links.some((h) => h.includes("/family?mission=m08")),
      "family companion",
    );
    assert.ok(
      links.some((h) => h.includes("/journey/guide")),
      "teacher guide",
    );
    assert.ok(doc.querySelector("#before-after h2"), "Before & After section");
    assert.match(
      doc.querySelector("[data-journey-go]").getAttribute("href"),
      /\/journey\/m08\/communicate/,
    );
  }
  const none = dom(await pages.overviewHTML(ctxFor("6-8"), "m99", deps("6-8")));
  assert.match(none.querySelector("h1").textContent, /could not find that mission/);
});

/** Wrap an I18n so every pair a page asks for is recorded. */
function recording(mode) {
  const I = makeI18n(mode, "en");
  const pairs = [];
  return {
    pairs,
    I: {
      ...I,
      T: (en, es) => (pairs.push([en, es]), I.T(en, es)),
      S: (en, es) => (pairs.push([en, es]), I.S(en, es)),
    },
  };
}

test("Spanish mode: every pair has natural Spanish and no English interface text leaks", async () => {
  for (const band of BANDS) {
    const st = returning(band);
    const renders = {
      home: (I) =>
        pages.homeHTML(ctxFor(band, "es"), deps(band, st, { mode: "es", I, withReviews: true })),
      map: (I) =>
        pages.mapHTML(
          ctxFor(band, "es"),
          deps(band, st, { mode: "es", I, ledger: growthLedger(band), withReviews: true }),
        ),
      overview: (I) =>
        pages.overviewHTML(
          ctxFor(band, "es"),
          "m08",
          deps(band, st, { mode: "es", I, ledger: growthLedger(band) }),
        ),
    };
    for (const [name, render] of Object.entries(renders)) {
      const { pairs, I } = recording("es");
      const markup = toHtml(await render(I));
      assert.ok(pairs.length > 10, `${name} asked for text`);
      for (const [en, es] of pairs) {
        assert.ok(es && es.trim(), `${name}: Spanish missing for "${en}"`);
        assert.notEqual(es, en, `${name}: Spanish equals English for "${en}"`);
      }
      const d = new JSDOM(`<body>${markup}</body>`).window.document;
      const text = textOf(d);
      const labels = all(d, "[aria-label]")
        .map((n) => n.getAttribute("aria-label"))
        .join(" | ");
      for (const [en] of pairs) {
        if (en.length < 8) continue;
        assert.ok(
          !text.includes(en) && !labels.includes(en),
          `${name} (${band}): English leaked: "${en}"`,
        );
      }
    }
  }
  // bilingual mode shows both sides
  const { pairs, I } = recording("bi");
  const d = dom(
    await pages.overviewHTML(
      ctxFor("6-8", "bi"),
      "m08",
      deps("6-8", returning("6-8"), { mode: "bi", I }),
    ),
  );
  const bi = textOf(d);
  for (const [en, es] of pairs.filter(([en]) => en.length > 12 && !/\$|\{/.test(en)).slice(0, 25))
    assert.ok(bi.includes(en) && bi.includes(es), `bilingual: both "${en}" and "${es}"`);
});

test("lab home: one h1 in the journey hero, the old hero demoted, every test-used element kept, order is journey first", async () => {
  const dummy = new JSDOM("<main id='app'></main><div id='labLive'></div>", {
    url: "https://lab.test/access-practice-lab/",
  });
  for (const key of ["window", "document", "localStorage", "location", "history"])
    globalThis[key] = dummy.window[key];
  globalThis.fetch = async (url) => ({
    ok: true,
    json: async () =>
      JSON.parse(
        await readFile(
          new URL(String(url).replace(/^\//, ""), new URL("../", import.meta.url)),
          "utf8",
        ),
      ),
  });
  const home = await import("../access-practice-lab/src/views/home.js");
  for (const band of BANDS) {
    const ctx = {
      band,
      bands: BANDS,
      prefs: { lang: "en" },
      route: { view: "home" },
      setPrefs() {},
      navigate() {},
      rerender() {},
    };
    const out = await home.render(ctx);
    const doc = dom(out.html);
    assert.equal(all(doc, "h1").length, 1, "exactly one h1 on home");
    assert.equal(all(doc, ".ll-hero h1").length, 1, ".ll-hero h1 (living-studio e2e)");
    const h1 = doc.querySelector("h1");
    assert.equal(h1.id, "homeTitle");
    assert.ok(h1.closest(".jr-hero"), "the journey hero owns the page h1");
    assert.match(h1.textContent, /Start My Learning Journey/);
    assert.match(
      doc.querySelector(".eyebrow").textContent,
      new RegExp(`Grades ${band.replace("-", "–")}`),
    );
    assert.equal(all(doc, "[data-set-band]").length, 2, "band switch kept, once");
    assert.equal(all(doc, ".room-tile").length, 4);
    assert.equal(all(doc, ".room-tile.ll-portal").length, 4);
    assert.equal(all(doc, ".session-heading .btn-primary").length, 1);
    assert.ok(all(doc, "[data-start-mission]").length >= 1);
    for (const sel of [
      "#planOptions",
      "#planFocus",
      "#planLevel",
      "#planCount",
      ".session-list",
      ".weekly-goal",
      "[data-weekly-goal]",
      ".ll-station[data-hero-station]",
      ".studio-card",
      "#homeSearch",
      ".band-identity-strip",
      "#skills",
    ])
      assert.ok(doc.querySelector(sel), `kept ${sel}`);
    const order = [
      "homeTitle",
      "exploreTitle",
      "exploreHeroTitle",
      "sessionTitle",
      "reviewTitle|.review-due",
      "roomsTitle",
      "growthTitle",
      "testsTitle",
      "moreTitle",
      "pathsTitle",
    ];
    const pos = order.map((k) => {
      const [id, sel] = k.split("|");
      const el = doc.getElementById(id) || (sel && doc.querySelector(sel));
      assert.ok(el, `section ${k}`);
      return [...doc.querySelectorAll("*")].indexOf(el);
    });
    assert.deepEqual(
      [...pos].sort((a, b) => a - b),
      pos,
      `home section order (${band})`,
    );
    assert.equal(doc.getElementById("exploreHeroTitle").tagName, "H2");
    assert.match(doc.getElementById("exploreTitle").textContent, /Explore all activities/);
    assert.ok(doc.querySelector('.jr-explore-head a[href*="/library"]'));
  }
});

test("navigation: four learner destinations keep the journey and adult tools in the menu", async () => {
  const { primaryLinks, navHTML } = await import("../access-practice-lab/src/nav.js");
  const T = (en) => en;
  const links = primaryLinks("6-8", T);
  assert.deepEqual(
    links.map((link) => link.id),
    ["continue", "practice", "explore", "growth"],
  );
  assert.equal(links[0].id, "continue");
  assert.equal(links[0].icon, "road");
  assert.match(links[0].href, /\/access-practice-lab\/\?grades=6-8$/);
  const I = makeI18n("en", "en");
  const nav = dom(navHTML({ band: "6-8", route: { view: "journey" } }, I));
  const current = nav.querySelector('a[aria-current="page"]');
  assert.match(current.textContent, /Continue/);
  const menu = all(nav, ".lab-utilities-body a").map((a) => [
    a.textContent.trim(),
    a.getAttribute("href"),
  ]);
  assert.ok(menu.some(([t, h]) => /My Journey Map/.test(t) && h.includes("/journey/map")));
  assert.ok(menu.some(([t, h]) => /Journey teacher guide/.test(t) && h.includes("/journey/guide")));
  const home = dom(navHTML({ band: "6-8", route: { view: "home" } }, I));
  assert.match(home.querySelector('a[aria-current="page"]').textContent, /Continue/);
  const main = await read("src/main.js");
  assert.doesNotMatch(main, /import \* as journeyView/);
  assert.match(main, /journey: \(\) => import\("\.\/views\/journey\.js"\)/);
  assert.match(
    main,
    /a === "journey"\) return \{ \.\.\.r, view: "journey", id: b \|\| "", rest: parts\.slice\(1\)/,
  );
});

/** CSS text with every @media/@supports block removed. */
function outsideAtRules(css) {
  let out = "";
  for (let i = 0, depth = 0; i < css.length; i++) {
    const rest = css.slice(i);
    if (depth === 0 && /^@(media|supports)\b/.test(rest)) {
      const open = css.indexOf("{", i);
      let d = 1;
      let j = open + 1;
      while (d && j < css.length) (d += css[j] === "{" ? 1 : css[j] === "}" ? -1 : 0), j++;
      i = j - 1;
      continue;
    }
    out += css[i];
  }
  return out;
}
const hue = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (!d) return { h: 0, s: 0 };
  const l = (max + min) / 2;
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s };
};

test("journey CSS: no wide min-width outside media queries, no purple, reduced motion and 44px targets", async () => {
  for (const file of ["journey.css", "journey-map.css"]) {
    const css = await read(file);
    const flat = outsideAtRules(css);
    for (const m of flat.matchAll(/min-width:\s*([\d.]+)(px|rem|em)/g)) {
      const px = Number(m[1]) * (m[2] === "px" ? 1 : 16);
      assert.ok(px <= 360, `${file}: min-width ${m[0]} exceeds 360px outside a media query`);
    }
    for (const m of flat.matchAll(/(?<![-\w])width:\s*([\d.]+)px/g))
      assert.ok(Number(m[1]) <= 360, `${file}: fixed ${m[0]} wider than a 375px phone allows`);
    for (const m of css.matchAll(/#[0-9a-f]{6}\b/gi)) {
      const { h, s } = hue(m[0]);
      assert.ok(!(h >= 255 && h <= 335 && s > 0.15), `${file}: ${m[0]} is purple/violet/magenta`);
    }
    assert.ok(
      !/\b(purple|violet|magenta|fuchsia|orchid|plum)\b/i.test(css),
      `${file}: named purple`,
    );
    assert.match(css, /prefers-reduced-motion/);
  }
  const base = await read("journey.css");
  assert.match(base, /min-height:\s*2\.75rem/, "44px targets");
  assert.match(base, /body\[data-lab-band="3-5"\] \.jr-hero/);
  assert.match(base, /\[data-band="6-8"\]/);
  assert.match(await read("journey-map.css"), /\.jr-trail/);
});
