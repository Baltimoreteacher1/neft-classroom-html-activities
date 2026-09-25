import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { exactFamilyMission, exactFamilySupport } from "../scripts/homework-family-support.mjs";
import { buildHomeworkGame } from "../scripts/homework-games.mjs";
import {
  FAMILY_GAME_BANKS,
  familyGameKey,
  getTopicPowerUp,
  HOMEWORK_TABS_JS,
  renderConceptExplainer,
  renderDoneTab,
  renderHomeworkTabs,
  renderQuickPlan,
  renderTogetherTab,
  renderWelcomeBanner,
  resolveKitchenTableActivity,
} from "../scripts/homework-guided-notes.mjs";
import { lessonPath } from "./lib/curriculum-source.mjs";

const config = (id) => JSON.parse(readFileSync(lessonPath(id, "config.json"), "utf8"));
function runtime(query = "") {
  const markup =
    renderQuickPlan() +
    renderHomeworkTabs(
      '<div data-tab-panel="learn"></div><div class="practice-tier-warmup">' +
        '<section class="problem-section"></section>'.repeat(4) +
        '</div><div class="practice-tier-challenge"></div>' +
        renderDoneTab(config("3-2"), "3-2"),
    ) +
    '<a id="hw_text_link"></a><a id="hw_email_link"></a>';
  const dom = new JSDOM(markup, {
    url: "https://eduwonderlab.com/lessons/3-2/homework" + query,
    runScripts: "outside-only",
  });
  // Load the real runtime without its unrelated canvas/camera startup.
  dom.window.document.addEventListener = () => {};
  dom.window.eval(HOMEWORK_TABS_JS);
  dom.window.LESSON_ID = "3-2";
  dom.window.alerts = [];
  dom.window.alert = (msg) => dom.window.alerts.push(msg);
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  return dom;
}

test("new family starts on essentials, keeps saved choice, and explicit valid URL wins", () => {
  const dom = runtime();
  const w = dom.window;
  w.restoreHomeworkRoute();
  assert.equal(w.document.body.dataset.homeworkRoute, "quick");
  assert.equal(
    w.document.querySelectorAll(".practice-tier-warmup .problem-section:not([hidden])").length,
    2,
  );
  assert.equal(w.document.getElementById("hw_tab_words").hidden, true);
  w.localStorage.setItem("hw_route_3-2", "full");
  w.restoreHomeworkRoute();
  assert.equal(w.document.body.dataset.homeworkRoute, "full");
  w.history.replaceState(null, "", "?route=quick&lang=es&section=class-1");
  w.localStorage.setItem("hw_lang_mode", "en");
  w.restoreHomeworkRoute();
  w.setLanguageMode(w.preferredLanguageMode());
  assert.equal(w.document.body.dataset.homeworkRoute, "quick");
  assert.equal(w.document.documentElement.lang, "es");
  assert.match(w.document.getElementById("hw_tab_check").getAttribute("aria-label"), /parada/);
  const shared = new URL(w.homeworkShareUrl());
  assert.equal(shared.searchParams.get("route"), "quick");
  assert.equal(shared.searchParams.get("lang"), "es");
  assert.equal(shared.searchParams.get("section"), "class-1");
  assert.match(
    decodeURIComponent(w.document.getElementById("hw_text_link").href),
    /route=quick&lang=es/,
  );
  w.history.replaceState(null, "", "?route=__proto__&lang=bad");
  w.localStorage.setItem("hw_route_3-2", "broken");
  w.restoreHomeworkRoute();
  assert.equal(w.document.body.dataset.homeworkRoute, "quick");
  dom.window.close();
});

test("Done is brief; all signatures, media and extra activity live in closed optional details", () => {
  const dom = runtime();
  const d = dom.window.document;
  const extras = d.querySelector(".homework-optional-extras");
  assert.equal(extras.open, false);
  for (const selector of [
    "#parent_name_input",
    "#parent_note_input",
    ".kitchen-table-card",
    "#student_work_photo_input",
    "#btn_record_voice",
  ]) {
    assert.ok(d.querySelector(selector).closest(".homework-optional-extras"), selector);
  }
  assert.ok(!d.querySelector(".homework-message-action").closest("details"));
  assert.equal(d.querySelector(".homework-message-action a").href, "https://home.classdojo.com/");
  assert.match(d.querySelector("#hw_panel_done").textContent, /no adult signature is needed/);
  assert.equal(d.querySelector("#submit_signoff_btn").disabled, false);
  dom.window.close();
});

test("local reflection never implies a network send, can save without a guardian, and reports storage failure", () => {
  const dom = runtime();
  const w = dom.window;
  w.fetch = () => assert.fail("Local reflection must not send a request");
  w.navigator.sendBeacon = () => assert.fail("Local reflection must not send a beacon");
  w.document.getElementById("parent_note_input").value = "A question for later";
  w.saveParentSignoff();
  assert.equal(
    JSON.parse(w.localStorage.getItem("hw_parent_signoff_3-2")).note,
    "A question for later",
  );
  assert.equal(w.document.getElementById("signoff_confirmed_wrapper").hidden, false);
  w.editParentSignoff();
  Object.defineProperty(w, "localStorage", {
    value: {
      getItem: () => null,
      setItem: () => {
        throw new Error("blocked");
      },
    },
  });
  w.saveParentSignoff();
  assert.equal(w.document.getElementById("signoff_confirmed_wrapper").hidden, true);
  assert.match(w.alerts.at(-1), /could not be saved/);
  dom.window.close();
});

test("paper practice invokes a real print flow and makes no offline-download claim", () => {
  const dom = runtime();
  const w = dom.window;
  let printed = 0;
  w.print = () => printed++;
  w.preparePaperPractice();
  assert.equal(printed, 1);
  assert.match(w.alerts[0], /has not downloaded an offline copy/);
  assert.equal(w.localStorage.getItem("hw_offline_pack_3-2"), null);
  dom.window.close();
});

test("welcome has one bilingual H1 and tools are initially collapsed", () => {
  const dom = new JSDOM(renderWelcomeBanner(config("3-2"), "3-2"));
  assert.equal(dom.window.document.querySelectorAll("h1").length, 1);
  assert.ok(dom.window.document.querySelector('h1 .lang-es[lang="es"]'));
  assert.equal(dom.window.document.querySelector(".hw-tools-menu").open, false);
  assert.ok(dom.window.document.getElementById("hw_start_button"));
  dom.window.close();
});

test("exact skills replace broad standard matches, keep one visible mission, and preserve later sessions", () => {
  for (const [id, expected] of [
    ["1-2", /6\/5 × 20 = 24/],
    ["2-3", /median \/ mediana = 5/],
    ["2-9", /\(3 \+ 1 \+ 1 \+ 3\) ÷ 4 = 2/],
    ["4-5", /6 ÷ 0.25 = 24/],
    ["5-2", /½bh/],
    ["5-3", /b₁ \+ b₂/],
    ["5-8", /4² \+ 4/],
    ["5-9", /½Pa/],
    ["6-1", /1½ ÷ ¼/],
    ["9-4", /y = 3x/],
  ]) {
    const c = config(id);
    assert.match(exactFamilySupport(c).equation, expected, id);
    const mission = exactFamilyMission(c);
    assert.ok(mission.steps.every((step) => step.en && step.es));
    const kitchen = resolveKitchenTableActivity(c);
    assert.equal(kitchen.title, mission.titleEn, id);
    const dom = new JSDOM(renderTogetherTab(c, id));
    const cards = [...dom.window.document.querySelectorAll("[data-family-activity]")];
    assert.equal(cards.length, 2);
    assert.equal(cards[0].open, true);
    assert.equal(cards[1].closest(".family-mission-alternatives").open, false);
    assert.doesNotMatch(
      dom.window.document.body.textContent,
      /A student solved a problem and made a common slip|Choose a side with your student/,
    );
    dom.window.close();
    assert.ok(renderConceptExplainer(c).includes("family-specific-model"));
    if (id === "1-2") assert.match(getTopicPowerUp("fractions", c).qEn, /6\/5 × 20/);
    if (id === "5-2") assert.match(getTopicPowerUp("area", c).qEn, /triangle/);
    if (id === "5-8") assert.match(getTopicPowerUp("surface-area", c).qEn, /pyramid/);
  }
  assert.equal(exactFamilySupport({ ...config("5-2"), lessonId: "5-2-part2" }), null);
  assert.match(
    resolveKitchenTableActivity(config("4-3")).steps.join(" "),
    /10% and 50% do not bound every percent/,
  );
});

test("multiplication and two-variable quiz/game banks stay on their actual skills", () => {
  for (const [id, key] of [
    ["1-2", "fraction-multiply"],
    ["9-1", "two-variables"],
    ["9-3", "two-variables"],
  ]) {
    const c = config(id);
    assert.equal(familyGameKey(c), key);
    for (const bank of Object.values(FAMILY_GAME_BANKS)) assert.ok(bank[key]);
    const dom = new JSDOM(buildHomeworkGame(c).html);
    const rounds = JSON.parse(dom.window.document.querySelector("[data-rounds]").dataset.rounds);
    assert.ok(rounds.every((r) => r.choices.filter((ch) => ch.isCorrect).length === 1));
    if (id === "1-2") assert.ok(rounds.every((r) => /×/.test(r.q) && !/÷/.test(r.q)));
    else assert.ok(rounds.every((r) => /x/.test(r.q) && /y/.test(r.q)));
    dom.window.close();
  }
});
