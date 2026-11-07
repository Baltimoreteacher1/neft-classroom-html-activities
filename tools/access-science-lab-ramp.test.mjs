// Science Investigation Lab, grades 3-5 case two (ramp-roll): scenes, the investigation picker, every stage view,
// the home card and the Language Page sitemap. Content rules for the case live in access-science-lab.test.mjs.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM('<main id="app"></main><div id="labLive"></div>', {
  url: "https://lab.test/access-practice-lab/worlds/science-lab?case=ramp-roll",
});
for (const key of ["window", "document", "localStorage", "location", "history"])
  globalThis[key] = dom.window[key];
globalThis.CSS = { escape: (s) => String(s) };

const { CASES, STAGES, TRANSFER_STAGE, findCase } = await import(
  "../access-practice-lab/src/content/science-lab.js"
);
const scene = await import("../access-practice-lab/src/views/science-lab-scene.js");
const view = await import("../access-practice-lab/src/views/science-lab.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");
const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
const { HOME_CARDS, cardsFor } = await import("../access-practice-lab/src/home-registry.js");
const { cardHref } = await import("../access-practice-lab/src/views/home-start.js");
const { SITEMAP_PATHS } = await import("../functions/_lib/language-page.js");

const RAMP = findCase("3-5", "ramp-roll");
const en = makeI18n("en");
const es = makeI18n("es");

test("the 3-5 band has two investigations and the new one resolves by id", () => {
  assert.deepEqual(
    CASES["3-5"].map((c) => c.id),
    ["soil-sprout", "ramp-roll"],
  );
  assert.ok(RAMP.transfer.id === "ramp-roll-transfer");
  assert.equal(findCase("6-8", "ramp-roll"), null);
});

test("both ramp scene families have their own hero, hotspots, units and icons", () => {
  for (const c of [RAMP, RAMP.transfer]) {
    const fam = scene.sceneFamily(c);
    assert.notEqual(fam.id, "bench", `${c.id} is not the generic fallback`);
    assert.equal(fam.id, c.id);
    assert.ok(fam.hotspots.length >= 3);
    for (const h of fam.hotspots) {
      assert.ok(
        h.label.en && h.label.es && h.notice.en && h.notice.es && h.wonder.en && h.wonder.es,
      );
      assert.ok(
        h.x >= 0 && h.x <= 100 && h.y >= 0 && h.y <= 100,
        `${c.id}/${h.id} inside the hero`,
      );
    }
    for (const I of [en, es]) {
      const hero = toHtml(scene.phenomenonSceneHTML(I, c, { uid: "t", hotspots: true }));
      assert.match(hero, /role="img"/);
      assert.match(hero, /<title id="t-t">[^<]+/);
      assert.match(hero, /<desc id="t-d">[^<]+/);
    }
    for (const row of c.dataset.rows) {
      for (const state of ["ready", "play", "done"]) {
        const out = toHtml(scene.runFrameHTML(en, c, row, { state }));
        assert.match(out, /role="img"/);
        assert.ok(out.includes(String(row.measures[c.measure.id])) || state === "ready");
      }
    }
  }
});

test("the end frame shows the car farther along for a larger measure, never past the unit", () => {
  const dxOf = (cm) => {
    const max = Math.max(...RAMP.dataset.rows.map((r) => r.measures.cm));
    const svg = scene.sceneFamily(RAMP).unit({ surface: "tile", height: "1" }, "end", cm / max);
    return Number(svg.match(/translate\((\d+)px, 0px\);opacity:1/)[1]);
  };
  assert.ok(dxOf(160) > dxOf(64) && dxOf(64) > dxOf(40));
  assert.ok(56 + dxOf(160) + 26 <= 160, "the car stays inside the 160-wide unit");
});

test("the hero never shows a car that has already rolled, and no floor wins in the text", () => {
  const hero = scene.sceneFamily(RAMP).hero().svg;
  assert.doesNotMatch(hero, /slx-a/, "the hero is a still, not an animation");
  const text = JSON.stringify(scene.sceneFamily(RAMP).hero().desc);
  assert.doesNotMatch(text, /farthest|fastest|winner|best/i);
});

const ctxFor = (stage = "") => ({
  band: "3-5",
  prefs: {},
  route: { view: "worlds", missionId: stage },
  rerender() {},
  navigate() {},
});
const draw = async (ctx) => {
  document.querySelector("#app").innerHTML = toHtml((await view.render(ctx)).html);
  return document.querySelector("#app");
};

test("the hub of a two-case band offers both investigations and marks the current one", async () => {
  history.replaceState({}, "", "/access-practice-lab/worlds/science-lab?case=ramp-roll");
  const root = await draw(ctxFor());
  const links = [...root.querySelectorAll("[data-sl-cases] a")];
  assert.equal(links.length, 2);
  assert.match(links[0].getAttribute("href"), /case=soil-sprout/);
  assert.match(links[1].getAttribute("href"), /case=ramp-roll/);
  assert.equal(links[1].getAttribute("aria-current"), "true");
  assert.equal(links[0].getAttribute("aria-current"), null);
  assert.match(root.querySelector("h1").textContent, /toy car roll the farthest/);
  history.replaceState({}, "", "/access-practice-lab/worlds/science-lab");
  const dflt = await draw(ctxFor());
  assert.match(
    dflt.querySelector("h1").textContent,
    /bean seeds sprout fastest/,
    "default stays the first case",
  );
});

test("a band with one investigation shows no picker", async () => {
  history.replaceState({}, "", "/access-practice-lab/worlds/science-lab");
  const ctx = { ...ctxFor(), band: "6-8" };
  const root = await draw(ctx);
  assert.equal(root.querySelector("[data-sl-cases]"), null);
});

test("every stage view of the new case renders in English and Spanish, with its own case id in the links", async () => {
  history.replaceState({}, "", "/access-practice-lab/worlds/science-lab?case=ramp-roll");
  for (const lang of ["en", "es"])
    for (const stage of ["", ...STAGES, TRANSFER_STAGE]) {
      const root = await draw({ ...ctxFor(stage), prefs: { lang } });
      assert.ok(root.querySelector("h1,h2"), `${lang} ${stage} renders a heading`);
      for (const a of root.querySelectorAll(
        "a[href*='/worlds/science-lab']:not([data-sl-cases] a)",
      ))
        assert.match(
          a.getAttribute("href"),
          /case=ramp-roll/,
          `${lang} ${stage}: ${a.getAttribute("href")}`,
        );
      if (lang === "es" && stage === "") assert.match(root.textContent, /Elige una investigación/);
    }
});

test("the home registry lists the case for 3-5 only, with a working link and Spanish", () => {
  const card = HOME_CARDS.find((c) => c.id === "science-lab-ramp");
  assert.ok(card);
  assert.ok(cardsFor("explore", "3-5").includes(card));
  assert.ok(!cardsFor("explore", "6-8").includes(card));
  assert.notEqual(card.title[0], card.title[1]);
  assert.equal(
    cardHref(card, "3-5"),
    "/access-practice-lab/worlds/science-lab?case=ramp-roll&grades=3-5",
  );
  assert.equal(
    cardHref({ href: "worlds/science-lab" }, "3-5"),
    "/access-practice-lab/worlds/science-lab?grades=3-5",
  );
});

test("the Language Page sitemap lists the science lab hub", () => {
  assert.ok(SITEMAP_PATHS.includes("/access-practice-lab/worlds/science-lab"));
});
