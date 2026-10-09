import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { familyGuidance } from "../scripts/homework-family-guidance.mjs";
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
  renderPlayTabPanel,
  renderQuickPlan,
  renderWelcomeBanner,
  resolveKitchenTableActivity,
} from "../scripts/homework-guided-notes.mjs";
import { VISUAL_LABS_JS } from "../scripts/homework-visual-labs.mjs";
import { lessonPath, loadLessonConfig } from "./lib/curriculum-source.mjs";

const config = loadLessonConfig;
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

test("share links carry the language but no route, and old route links change nothing", () => {
  const dom = runtime();
  const w = dom.window;
  w.history.replaceState(null, "", "?route=quick&lang=es&section=class-1");
  w.localStorage.setItem("hw_lang_mode", "en");
  w.setLanguageMode(w.preferredLanguageMode());
  assert.equal(w.document.documentElement.lang, "es");
  assert.equal(w.document.body.dataset.homeworkRoute, undefined);
  assert.match(w.document.getElementById("hw_tab_check").getAttribute("aria-label"), /parada/);
  const shared = new URL(w.homeworkShareUrl());
  assert.equal(shared.searchParams.get("route"), null);
  assert.equal(shared.searchParams.get("lang"), "es");
  assert.equal(shared.searchParams.get("section"), "class-1");
  assert.equal(w.activeHomeworkRoute().problemLimit, 6);
  dom.window.close();
});

test("family homework is one path: every stop, no time choice, no minute labels, no Together stop", () => {
  for (const id of ["2-1", "3-3"]) {
    const page = readFileSync(lessonPath(id, "homework.html"), "utf8");
    const d = new JSDOM(page).window.document;
    assert.deepEqual(
      [...d.querySelectorAll(".homework-tab-btn")].map((b) => b.dataset.tab),
      ["learn", "words", "check", "play", "done"],
      id,
    );
    assert.equal(d.querySelector("#hw_panel_together"), null, id);
    assert.equal(
      d.querySelectorAll("[data-route-mode], .hw-route-chooser, .tab-min").length,
      0,
      id,
    );
    assert.equal(d.getElementById("hw_time_remaining"), null, id);
    assert.doesNotMatch(d.body.textContent, /\b(10|20|30) min/i, id);
    assert.doesNotMatch(d.querySelector(".homework-tab-bar").textContent, /together|juntos/i, id);
    assert.ok(
      d.querySelector("#hw_panel_play [data-family-activity]"),
      `${id} keeps the home activity`,
    );
  }
});

test("Words stop is cards, then a picture quiz, then matching — no filter bar or mastery stars", () => {
  const page = readFileSync(lessonPath("3-3", "homework.html"), "utf8");
  const d = new JSDOM(page).window.document;
  const panel = d.querySelector("#hw_panel_words");
  assert.equal(panel.querySelectorAll(".btn-filter, .vocab-master-toggle").length, 0);
  const order = [".vocab-container", "#vocab_quiz", "#vocab_match_shell"].map((sel) => {
    const el = panel.querySelector(sel);
    assert.ok(el, sel);
    return el;
  });
  order
    .slice(1)
    .forEach((el, i) =>
      assert.ok(
        order[i].compareDocumentPosition(el) & 4,
        "words stop keeps cards -> quiz -> match",
      ),
    );
  const items = JSON.parse(panel.querySelector("#vocab_quiz_data").textContent);
  assert.equal(items.length, panel.querySelectorAll(".vocab-card").length);
  assert.ok(items.every((i) => i.term && i.def && i.defEs));
});

test("statistical-question homework shows a concrete model and keeps reasons for feedback", () => {
  const page = readFileSync(lessonPath("2-1", "homework.html"), "utf8");
  const dom = new JSDOM(page);
  const d = dom.window.document;
  assert.match(d.querySelector(".concept-visual-caption").textContent, /One shelf has one count/);
  // The authored wording affects the deterministic problem order. Identify
  // the warm-up table by its task and content, not its displayed number.
  const table = [
    ...d.querySelectorAll('.practice-tier-warmup [data-problem-type="fill-table"] .fill-table'),
  ].find((candidate) =>
    /How many push-ups can each student do in one minute\?/.test(candidate.textContent),
  );
  assert.ok(table);
  assert.equal(table.querySelectorAll("input.table-input").length, 6);
  assert.ok([...table.querySelectorAll("input.table-input")].every((input) => input.value === ""));
  assert.equal(table.querySelectorAll('input[data-self-review="true"]').length, 3);
  assert.doesNotMatch(table.textContent, /Different students can do different amounts/);
  dom.window.close();
});

test("Done shows every optional activity without a disclosure", () => {
  const dom = runtime();
  const d = dom.window.document;
  const extras = d.querySelector(".homework-optional-extras");
  assert.equal(extras.tagName, "SECTION");
  assert.equal(extras.querySelectorAll(".homework-extra-actions .btn").length, 3);
  for (const selector of [
    "#parent_name_input",
    "#parent_note_input",
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

test("ratio homework compares two recipes and updates both rates", () => {
  for (const id of ["3-5", "3-5-part2"]) {
    const dom = new JSDOM(readFileSync(lessonPath(id, "homework.html"), "utf8"), {
      runScripts: "outside-only",
    });
    const d = dom.window.document;
    dom.window.eval(VISUAL_LABS_JS);
    d.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    const verdict = d.querySelector("[data-ratio-verdict]");
    assert.match(verdict.textContent, /35 ounces of milk.*21 tablespoons.*Tran uses 20/);
    const cocoa = d.querySelector("[data-ratio-b-cocoa]");
    cocoa.value = "5";
    cocoa.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    assert.match(verdict.textContent, /Tran uses 25.*Tran has more cocoa/);
    dom.window.close();
  }
});

test("graph and polygon family models match their lesson topics", () => {
  for (const [id, kind] of [
    ["3-4", "line-grapher"],
    ["7-7", "coordinate-plane"],
    ["9-2", "line-grapher"],
  ]) {
    for (const session of [id, `${id}-part2`]) {
      const page = readFileSync(lessonPath(session, "homework.html"), "utf8");
      const dom = new JSDOM(page);
      assert.equal(
        dom.window.document.querySelector(".family-visual-lab").dataset.lessonModel,
        kind,
      );
      dom.window.close();
    }
  }
});

test("the optional table activity uses the lesson's own math", () => {
  const withNotes = (id) => ({
    ...config(id),
    lessonId: id,
    familyNotes: JSON.parse(
      readFileSync(new URL(`../data/family-homework-notes/${id}.json`, import.meta.url), "utf8"),
    ),
  });
  const compare = resolveKitchenTableActivity(withNotes("3-5"));
  assert.match(compare.steps.join(" "), /Compare two drink recipes/);
  const polygon = resolveKitchenTableActivity(withNotes("7-7"));
  assert.match(polygon.steps.join(" "), /coordinate|polygon|vertex|rectangle/i);
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
    assert.equal(kitchen.title, "Use the math at home", id);
    assert.notDeepEqual(
      kitchen.steps,
      mission.steps.map((step) => step.en),
      id,
    );
    const dom = new JSDOM(renderPlayTabPanel(c, id));
    const cards = [...dom.window.document.querySelectorAll("[data-family-activity]")];
    assert.equal(cards.length, 1);
    assert.equal(cards[0].open, true);
    assert.equal(dom.window.document.querySelector(".family-mission-alternatives"), null);
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
  assert.match(resolveKitchenTableActivity(config("4-3")).steps.join(" "), /25% discount/);
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

test("dollar amounts in family prose survive rendering instead of becoming regex captures", () => {
  const page = readFileSync(lessonPath("9-3-part2", "homework.html"), "utf8");
  assert.match(page, /\$16 an hour/);
  assert.match(page, /\$5 plus \$2 per hour/);
});

test("the Together practice ladder is gone from family homework", () => {
  const page = readFileSync(lessonPath("1-2", "homework.html"), "utf8");
  const d = new JSDOM(page).window.document;
  assert.equal(d.querySelector(".family-extra-ladder"), null);
  assert.equal(d.querySelector(".together-steps"), null);
});

test("plotting lessons get a plotting home task, distance lessons a distance task", () => {
  for (const id of ["7-5", "7-8", "7-8-part2"]) {
    assert.match(familyGuidance({ lessonId: id }).mission.en, /Plot a park at \(3, 2\)/);
  }
  assert.match(familyGuidance({ lessonId: "7-6" }).mission.en, /distance cannot be negative/);
});

test("Unit 4 conceptSteps cues, family-specific SVG models, and no vague start/show/solve labels", () => {
  for (const id of [
    "4-1",
    "4-1-part2",
    "4-2",
    "4-2-part2",
    "4-3",
    "4-3-part2",
    "4-4",
    "4-4-part2",
    "4-5",
    "4-5-part2",
  ]) {
    const notes = JSON.parse(readFileSync(`data/family-homework-notes/${id}.json`, "utf8"));
    const c = { ...config(id.replace("-part2", "")), lessonId: id, familyNotes: notes };
    const explainer = renderConceptExplainer(c);
    assert.ok(
      explainer.includes("family-specific-model"),
      `${id} must have a family-specific visual model`,
    );
    assert.doesNotMatch(
      explainer,
      /Start \/ Comienza|Show it \/ Muéstralo/,
      `${id} must not use vague start/show labels`,
    );
    assert.ok(explainer.includes("step-cue-label"), `${id} must render step-cue-label`);
  }
});
