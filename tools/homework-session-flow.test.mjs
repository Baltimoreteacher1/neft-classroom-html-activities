import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { SCRATCHPAD_STAMPS } from "../scripts/lib/homework-scratchpad.mjs";
import {
  renderSessionBanner,
  SESSIONS,
  sessionOf,
  sessionSentence,
} from "../scripts/lib/homework-session-flow.mjs";
import { lessonPath, listLessonDirs } from "./lib/curriculum-source.mjs";

const page = (id) => readFileSync(lessonPath(id, "homework.html"), "utf8");
const dom = (id) => new JSDOM(page(id)).window.document;
const tick = () => new Promise((resolve) => setImmediate(resolve));

test("sessionOf reads the session from the lesson id and ignores unpaired ids", () => {
  assert.deepEqual(sessionOf("4-4"), { baseId: "4-4", session: 1 });
  assert.deepEqual(sessionOf("4-4-part2"), { baseId: "4-4", session: 2 });
  assert.equal(sessionOf("4-4-group1"), null);
  assert.equal(sessionOf("1-review"), null);
});

test("sessionSentence restates 'Tonight' as the other session, in both languages, and never invents", () => {
  const s = sessionSentence(
    { en: "Tonight we compare two scores.", es: "Esta noche comparamos dos puntajes." },
    2,
  );
  assert.equal(s.en, "In Session 2, we compare two scores.");
  assert.equal(s.es, "En la Sesión 2, comparamos dos puntajes.");
  const odd = sessionSentence(
    { en: "Tonight the hard part is order.", es: "Esta noche lo difícil es el orden." },
    1,
  );
  assert.equal(odd.en, "In Session 1, the hard part is order.");
  const fallback = sessionSentence(undefined, 2);
  assert.match(fallback.en, /^Session 2 builds on this idea/);
  assert.ok(fallback.es.length > 20);
});

test("no banner without a partner page", () => {
  assert.equal(renderSessionBanner("4-4", null), "");
  assert.equal(renderSessionBanner("4-4-group1", { href: "/x", learningTonight: null }), "");
});

test("banner marks the current night and links the other one", () => {
  const partner = {
    href: "/lessons/4-4-part2/homework.html",
    learningTonight: { en: "Tonight we compare.", es: "Esta noche comparamos." },
  };
  const one = new JSDOM(renderSessionBanner("4-4", partner)).window.document;
  assert.match(one.querySelector(".is-current").textContent, /Session 1: Concept Launch/);
  assert.match(one.querySelector(".is-current").textContent, /Sesión 1: Lanzamiento del concepto/);
  assert.match(
    one.querySelector(".is-next .hw-session-chip").textContent,
    /Session 2: Compare & Apply/,
  );
  assert.equal(one.querySelector(".is-next a").getAttribute("href"), partner.href);
  assert.match(one.querySelector(".hw-session-sentence").textContent, /In Session 2, we compare/);

  const backHref = { ...partner, href: "/lessons/4-4/homework.html" };
  const two = new JSDOM(renderSessionBanner("4-4-part2", backHref)).window.document;
  assert.match(two.querySelector(".is-done").textContent, /✓/);
  assert.match(two.querySelector(".is-current").textContent, /Session 2: Compare & Apply/);
  assert.equal(two.querySelector(".is-done a").getAttribute("href"), backHref.href);
  assert.equal(SESSIONS[2].es, "Sesión 2: Comparar y aplicar");
});

test("every paired family page carries the banner, and the old pair note is gone", async () => {
  let pairs = 0;
  const ids = listLessonDirs({ filter: /^\d+-\d+$/ });
  for (const id of ids) {
    if (!existsSync(lessonPath(`${id}-part2`, "homework.html"))) continue;
    if (!existsSync(lessonPath(id, "homework.html"))) continue;
    await tick();
    const one = dom(id);
    await tick();
    const two = dom(`${id}-part2`);
    assert.equal(one.querySelector(".hw-pair-note"), null, id);
    assert.equal(one.querySelector(".hw-session-banner")?.dataset.session, "1", id);
    assert.equal(two.querySelector(".hw-session-banner")?.dataset.session, "2", id);
    assert.ok(
      one.querySelector(`.hw-session-banner a[href="/lessons/${id}-part2/homework.html"]`),
      id,
    );
    assert.ok(two.querySelector(`.hw-session-banner a[href="/lessons/${id}/homework.html"]`), id);
    for (const d of [one, two]) {
      assert.match(d.querySelector(".hw-session-sentence .lang-es").textContent, /\S/, id);
      assert.match(
        d.querySelector(".hw-hero-lesson-meta .lang-en").textContent,
        /Session [12]: /,
        id,
      );
      assert.match(
        d.querySelector(".hw-hero-lesson-meta .lang-es").textContent,
        /Sesión [12]: /,
        id,
      );
    }
    pairs++;
  }
  assert.ok(pairs >= 70, `expected the 77 two-session lessons, found ${pairs}`);
});

test("the hero leads with the lesson as its one H1, the unit eyebrow, and a one-sentence big idea", () => {
  for (const id of ["4-4", "4-4-part2", "3-8", "3-8-part2"]) {
    const d = dom(id);
    assert.equal(d.querySelectorAll("h1").length, 1, id);
    assert.equal(
      d.querySelector("h1 .lang-en").textContent,
      d.querySelector(".hw-hero-lesson-title .lang-en").textContent,
      id,
    );
    assert.match(d.querySelector("h1 .lang-es").textContent, /\S/, id);
    assert.match(d.querySelector(".hw-hero-kicker .lang-en").textContent, /^Unit \d+/, id);
    assert.match(
      d.querySelector(".hw-route-promise .lang-en").textContent,
      /Optional\. No grades\./,
      id,
    );
    assert.match(d.querySelector(".hw-hero-bigidea .lang-es:last-child").textContent, /\S/, id);
    const menu = d.querySelector(".hw-tools-menu");
    assert.equal(menu.open, false, id);
    assert.ok(
      menu.querySelector("[data-act='toggleScratchpad']"),
      `${id} scratchpad opens from the More sheet`,
    );
    assert.ok(menu.querySelector(".hw-standard-details"), `${id} standard lives in the More sheet`);
  }
});

test("the Confused Grown-Up is an optional warm-up after Learn, once, and not repeated at Play", () => {
  for (const id of ["4-4", "4-4-part2", "3-8", "3-8-part2"]) {
    const d = dom(id);
    const huddle = d.querySelector("#hw_panel_learn details.hw-huddle");
    if (!huddle) {
      assert.equal(d.querySelector("#hw_cga"), null, `${id} has no card, so no stray card`);
      continue;
    }
    assert.equal(huddle.open, false, id);
    assert.equal(d.querySelectorAll("#hw_cga").length, 1, id);
    assert.ok(huddle.querySelector("#hw_cga"), id);
    assert.equal(d.querySelector("#hw_panel_play #hw_cga"), null, id);
    assert.ok(
      huddle.querySelector(".cga-quick-note"),
      `${id} explains quick practice shows round 1`,
    );
  }
});

test("quick practice sets problems aside behind a disclosure instead of dropping them", () => {
  const d = dom("4-4");
  const opt = d.querySelector("#hw_quick_optional");
  assert.ok(opt, "disclosure exists");
  assert.equal(opt.querySelector("button").getAttribute("aria-expanded"), "false");
  assert.match(opt.textContent, /more problems \(optional\)/);
  assert.match(opt.textContent, /problemas más \(opcional\)/);
});

test("domain stamps exist only for the units that own them", () => {
  assert.deepEqual(Object.keys(SCRATCHPAD_STAMPS).sort(), ["3", "4", "7"]);
  const stampLabel = { 3: /Double number line/, 4: /100 grid/, 7: /Coordinate plane/ };
  for (const [id, unit] of [
    ["3-8", 3],
    ["4-4", 4],
    ["7-2", 7],
    ["5-1", 5],
  ]) {
    if (!existsSync(lessonPath(id, "homework.html"))) continue;
    const d = dom(id);
    const buttons = [...d.querySelectorAll(".grid-mode-group .grid-btn")];
    const hasStamp = buttons.length === 4;
    assert.equal(hasStamp, Boolean(stampLabel[unit]), id);
    if (hasStamp) assert.match(buttons[3].textContent, stampLabel[unit], id);
    const canvas = d.querySelector("#hw_scratchpad_canvas");
    assert.equal(canvas.getAttribute("style"), null, `${id} canvas carries no inline background`);
    assert.ok(d.querySelector("#scratchpad_expand_btn"), `${id} has a full-screen control`);
  }
});
