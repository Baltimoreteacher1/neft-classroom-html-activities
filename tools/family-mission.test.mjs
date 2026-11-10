/**
 * Family Math Mission: the six-stage path is the same on every page and its numbers agree.
 *
 * String checks over all generated pages (a DOM per half-megabyte page runs out of memory), plus
 * jsdom for the mission runtime and the real model engine for every lesson that carries a model.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { createModel } from "../assets/family-mission/models/index.mjs";
import { FLOW_JS } from "../scripts/lib/homework-flow-js.mjs";
import {
  MISSION_PRACTICE_COUNT,
  MISSION_STAGES,
  OPTIONAL_STOPS,
  ROUTE_TIMES,
} from "../scripts/lib/homework-mission.mjs";
import { MISSION_JS } from "../scripts/lib/homework-mission-js.mjs";
import { LESSON_MODELS, missionModelFor } from "../scripts/lib/homework-mission-models.mjs";
import { FAMILY_SEQUENCE, nextFamilyPage } from "../scripts/lib/homework-sequence.mjs";
import { workedExampleFor } from "../scripts/lib/homework-worked-example.mjs";
import { lessonPath, REPO_ROOT } from "./lib/curriculum-source.mjs";

const ROOT = REPO_ROOT.replace(/\/$/, "");
const ids = readdirSync(`${ROOT}/data/family-homework-notes`)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.slice(0, -5));
const STAGES = ["connect", "explore", "check", "improve", "done"];
const OPTIONAL = ["talk", "apply", "words", "play", "photobooth"];
/** A lesson with at least two authored basic items gets A, B, C (the third is its own transfer problem when it has one). */
const hasABC = (id) => {
  const n = JSON.parse(readFileSync(`${ROOT}/data/family-homework-notes/${id}.json`, "utf8"));
  return (n.basicPractice?.length ?? 0) >= 3;
};
const count = (html, re) => (html.match(re) ?? []).length;

test("the five steps are defined once, in teaching order, with the optional stops outside them", () => {
  assert.deepEqual(
    MISSION_STAGES.map((s) => s.id),
    STAGES,
  );
  assert.deepEqual(
    MISSION_STAGES.map((s) => s.en),
    ["Look & Learn", "Try Together", "Your Turn", "Check & Improve", "Finish"],
  );
  assert.deepEqual(
    OPTIONAL_STOPS.map((s) => s.id),
    ["talk", "apply", "words", "play", "photobooth"],
  );
  assert.equal(MISSION_PRACTICE_COUNT, 10);
  assert.equal(ROUTE_TIMES.quick, "15–20");
  assert.equal(ROUTE_TIMES.full, "25–35");
});

test("every family page is the same five-step flow with one start, no depth selector and the extras behind Explore more", () => {
  assert.ok(ids.length >= 160, `only ${ids.length} pages`);
  const bad = [];
  for (const id of ids) {
    const html = readFileSync(lessonPath(id, "homework.html"), "utf8");
    const order = [...html.matchAll(/data-tab-panel="(\w+)"/g)].map((m) => m[1]);
    const checks = {
      panels: order.join() === [...STAGES, ...OPTIONAL].join(),
      rail: count(html, /class="homework-tab-btn/g) === 5,
      oneStart: count(html, /id="hw_start_button"/g) === 1,
      exploreMore: html.includes('id="hw_explore_sheet"') && html.includes("Explorar más"),
      noRoutes: !html.includes("data-route-mode"),
      noPathway: !html.includes("hw_pathway_bar") && !html.includes("hw-pathway-btn"),
      noPager: !html.includes("learn-pager") && !html.includes('class="learn-card"'),
      noteWonder: html.includes('id="hw_notice_wonder"'),
      lookAndLearn: html.includes('id="hw_goal_label"') && html.includes('id="hw_example_label"'),
      tryTogether: html.includes('id="hw_try_label"'),
      improve: html.includes('id="hw_improve"') && html.includes("data-improve-empty"),
      yourTurn: hasABC(id) ? ["A", "B", "C"].every((r) => html.includes(`data-role="${r}"`)) : true,
      oneFamilyQuestion: html.includes('class="fp-family"'),
      copilot: html.includes('id="hw_copilot_learning"') && html.includes('id="hw_copilot_ask"'),
      talk: html.includes('id="hw_talk"'),
      reflect: html.includes('id="hw_reflect"') && html.includes('id="hw_mission_summary"'),
      optionalHidden: /<div class="hw-optional-stops" hidden>/.test(html),
      statedCount: html.includes(`<span data-hw-goal-count>${MISSION_PRACTICE_COUNT}</span>`),
      noTopBottom: !/divide Top ÷ Bottom|Which number goes on top/.test(html),
    };
    for (const [name, ok] of Object.entries(checks)) if (!ok) bad.push(`${id}:${name}`);
  }
  assert.deepEqual(bad.slice(0, 12), []);
});

test("the default route shows exactly the problems it says: the stated count, the goal and the route limit agree", () => {
  const dom = new JSDOM(readFileSync(lessonPath("4-1-part2", "homework.html"), "utf8"), {
    runScripts: "outside-only",
  });
  const text = dom.window.document.querySelector(".hw-mission-start").textContent;
  assert.match(text, new RegExp(`solve ${MISSION_PRACTICE_COUNT}`));
  assert.match(text, new RegExp(ROUTE_TIMES.quick));
  const html = readFileSync(lessonPath("4-1-part2", "homework.html"), "utf8");
  assert.match(
    html,
    new RegExp(`<span data-hw-goal-count>${MISSION_PRACTICE_COUNT}</span> problems\\.`),
  );
  assert.doesNotMatch(html, /Tonight's goal: any/);
  dom.window.close();
});

test("every model a lesson mounts is a real family and instantiates from its configuration", () => {
  assert.ok(Object.keys(LESSON_MODELS).length >= 40);
  for (const base of Object.keys(LESSON_MODELS)) {
    for (const id of [base, `${base}-part2`]) {
      const spec = missionModelFor({ lessonId: id });
      assert.ok(spec, id);
      const model = createModel(spec.family, spec.config);
      assert.ok(model.getAccessibleDescription("en"), id);
      assert.ok(model.getAccessibleDescription("es"), id);
      assert.match(spec.leadEs, /[a-záéíóúñ]/i, `${id} has Spanish lead text`);
    }
  }
  // Percents over 100%: Session 2 of lesson 4-1 opens past one whole, on two grids.
  const over = createModel("percent", missionModelFor({ lessonId: "4-1-part2" }).config);
  assert.equal(over.getState().percent.n, 150);
  assert.equal(over.getState().grids, 2);
  assert.equal(missionModelFor({ lessonId: "2-1" }), null);
});

test("a page whose lesson has a model carries the host with a valid configuration, and one without carries none", () => {
  for (const id of ["4-1-part2", "3-3", "4-5", "8-2", "7-9", "5-6", "2-8"]) {
    const html = readFileSync(lessonPath(id, "homework.html"), "utf8");
    const m = html.match(/id="hw_mission_model"[^>]*data-family="(\w+)" data-config="([^"]*)"/);
    assert.ok(m, `${id} has a model host`);
    const config = JSON.parse(m[2].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
    assert.ok(createModel(m[1], config));
  }
  assert.ok(!readFileSync(lessonPath("2-1", "homework.html"), "utf8").includes("hw_mission_model"));
});

test("the next page follows the real sequence, never Unit 10, never a missing page", () => {
  assert.ok(FAMILY_SEQUENCE.length >= 150);
  for (const id of FAMILY_SEQUENCE) {
    assert.ok(existsSync(lessonPath(id, "homework.html")), `${id} has a page`);
    assert.ok(!id.startsWith("10-"), `${id} is Unit 10`);
    const next = nextFamilyPage(id);
    if (next) {
      assert.ok(FAMILY_SEQUENCE.includes(next.id));
      assert.ok(FAMILY_SEQUENCE.indexOf(next.id) === FAMILY_SEQUENCE.indexOf(id) + 1);
    }
  }
  assert.equal(nextFamilyPage("4-1").id, "4-1-part2");
  assert.equal(nextFamilyPage("4-1-part2").id, "4-2");
  assert.equal(nextFamilyPage(FAMILY_SEQUENCE.at(-1)), null);
});

test("a worked-example title that names another concept is dropped; its lines are kept", () => {
  const config = {
    title: "Percents Greater Than 100%",
    familyNotes: {
      sessionTitle: "Percents Greater Than 100%",
      bigIdea: { en: "100% is 1 whole, 150% is 1.5 wholes" },
    },
    launch: {
      conceptIntro: {
        iDo: {
          title: "How to divide with fractions",
          lines: ["1. Percent means 'per hundred'", "2. 100% is 1 whole; 150% is 1.5"],
        },
      },
    },
  };
  const w = workedExampleFor(config);
  assert.equal(w.title, "");
  assert.equal(w.lines.length, 2);
  config.launch.conceptIntro.iDo.title = "How percents compare to one whole";
  assert.equal(workedExampleFor(config).title, "How percents compare to one whole");
});

test("a wrong answer is answered with THIS problem's hints, not a ratio template", () => {
  const html = readFileSync(lessonPath("4-1-part2", "homework.html"), "utf8");
  assert.match(html, /data-hints='\[&quot;One whole is 100%\./);
  assert.doesNotMatch(html, /divide Top|Which number goes on top/);
});

test("the mission runtime parses, loads the model lazily and never sends data", () => {
  assert.doesNotThrow(() => new Function(MISSION_JS));
  assert.match(MISSION_JS, /import\(HW_MISSION_MODEL_URL\)/);
  assert.doesNotMatch(MISSION_JS, /fetch\(|XMLHttpRequest|sendBeacon/);
  assert.doesNotMatch(MISSION_JS, /innerHTML = [^;]*\+ *(box|note)\.value/);
});

test("the Reflect summary says only what happened: nothing before work, evidence after, no mastery claim", () => {
  const dom = new JSDOM(
    `<body class="lang-mode-en">
      <div data-mission-evidence hidden><div id="hw_mission_summary"></div></div>
      <a data-mission-prereq hidden></a>
      <section class="problem-section correct" id="problem_0"></section>
      <section class="problem-section" id="problem_1"></section>
      <section class="problem-section" id="problem_2"></section></body>`,
    { url: "https://eduwonderlab.com/lessons/4-1/homework", runScripts: "outside-only" },
  );
  const w = dom.window;
  w.document.addEventListener = () => {};
  w.LESSON_ID = "4-1";
  w.LESSON_TITLE = "Understand Percent";
  w.eval(MISSION_JS + FLOW_JS);
  w.eval("var problemAttempts = {0: 2}; var revealForced = {};");
  w.hwMissionSummary();
  const text = w.document.getElementById("hw_mission_summary").textContent;
  assert.match(text, /You practiced/);
  assert.match(text, /You solved 1 of 3 problems/);
  assert.match(text, /changed an answer and got it right/);
  assert.match(text, /without hints/);
  assert.doesNotMatch(text, /mastery|mastered|%|stars?\b/i);
  assert.equal(w.document.querySelector("[data-mission-evidence]").hidden, false);
  assert.equal(w.document.querySelector("[data-mission-prereq]").hidden, false);
  // Nothing solved: nothing is said and the block stays hidden.
  const empty = new JSDOM(
    `<body class="lang-mode-en"><div data-mission-evidence hidden><div id="hw_mission_summary"></div></div>
      <section class="problem-section" id="problem_0"></section></body>`,
    { url: "https://eduwonderlab.com/lessons/4-2/homework", runScripts: "outside-only" },
  ).window;
  empty.document.addEventListener = () => {};
  empty.LESSON_ID = "4-2";
  empty.eval(MISSION_JS + FLOW_JS);
  empty.eval("var problemAttempts = {}; var revealForced = {};");
  empty.hwMissionSummary();
  assert.equal(empty.document.querySelector("[data-mission-evidence]").hidden, true);
  assert.equal(empty.document.getElementById("hw_mission_summary").textContent, "");
});
