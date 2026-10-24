import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  FAMILY_GAME_BANKS,
  HOMEWORK_TABS_JS,
  renderQuickPlan,
} from "../scripts/homework-guided-notes.mjs";
import {
  GOAL_QUICK,
  GOAL_TARGET,
  pickMystery,
  renderConfidence,
  renderExperienceDialogs,
  renderFamilyNights,
  renderGoalPips,
  renderMysteryChallenge,
  renderShareWin,
  renderTeachBack,
  renderTonightStrip,
} from "../scripts/lib/homework-experience.mjs";
import { EXPERIENCE_JS } from "../scripts/lib/homework-experience-js.mjs";
import { lessonPath, REPO_ROOT } from "./lib/curriculum-source.mjs";

const ROOT = REPO_ROOT.replace(/\/$/, "");

/** A page with twelve problems, the experience layer's markup, and the shared runtime. */
function page({ query = "", reducedMotion = false, storage = {}, restored = true } = {}) {
  const problems = Array.from(
    { length: 12 },
    (_, i) =>
      `<section class="problem-section" id="problem_${i}" data-problem-type="multiple-choice"></section>`,
  ).join("");
  const markup = `${renderQuickPlan()}${renderTonightStrip()}${renderConfidence("before")}${renderMysteryChallenge({ index: 11, stemEn: "What is 10% of 80?", stemEs: "¿Cuánto es el 10% de 80?" })}
    <div data-tab-panel="check">${problems}</div>
    <div id="goal_reached_banner" hidden><button class="hw-banner-mystery" hidden></button></div>
    <span id="progress_text"></span><div id="progress_bar"></div><span id="tab_badge_check"></span>
    ${renderGoalPips("a")}${renderGoalPips("b")}${renderConfidence("after")}${renderFamilyNights()}${renderExperienceDialogs()}`;
  const dom = new JSDOM(`<body class="lang-mode-en">${markup}</body>`, {
    url: `https://eduwonderlab.com/lessons/4-3/homework${query}`,
    runScripts: "outside-only",
  });
  const w = dom.window;
  w.document.addEventListener = () => {};
  w.matchMedia = () => ({ matches: reducedMotion });
  w.HTMLElement.prototype.scrollIntoView = () => {};
  for (const [k, v] of Object.entries(storage)) w.localStorage.setItem(k, v);
  w.LESSON_ID = "4-3";
  w.eval(HOMEWORK_TABS_JS);
  w.eval(`
    var bursts = 0, fanfares = 0;
    function triggerConfettiBurst() { bursts++; }
    function playFanfareSound() { fanfares++; }
    function switchHomeworkTab() {}
  `);
  w.eval(EXPERIENCE_JS);
  // What the DOMContentLoaded handler does first: read saved progress back.
  if (restored) w.hwRestoreSolved();
  w.solve = (n) => {
    for (let i = 0; i < n; i++) w.document.getElementById(`problem_${i}`).classList.add("correct");
    w.hwRenderGoal(true);
  };
  return w;
}

test("the goal is four problems, two on Quick, and never zero", () => {
  const w = page();
  w.document.body.dataset.homeworkRoute = "full";
  assert.deepEqual({ ...w.hwGoalSnapshot() }, { done: 0, goal: GOAL_TARGET, available: 12 });
  w.document.body.dataset.homeworkRoute = "core";
  assert.equal(w.hwGoalSnapshot().goal, GOAL_TARGET);
  w.document.body.dataset.homeworkRoute = "quick";
  assert.equal(w.hwGoalSnapshot().goal, GOAL_QUICK);
  assert.ok(w.activeHomeworkRoute().problemLimit === 2);
});

test("a wrong answer is not progress and nothing celebrates before the goal", () => {
  // The shipped page showed "That's tonight's goal — done!" after one WRONG answer: its goal
  // was the route's problemLimit, which is 0 on two of the three routes, and 0 >= 0.
  const w = page();
  w.document.getElementById("problem_0").classList.add("incorrect");
  w.hwRenderGoal(true);
  assert.equal(w.document.getElementById("progress_text").textContent, "0 / 4");
  assert.equal(w.document.getElementById("goal_reached_banner").hidden, true);
  assert.equal(w.document.body.dataset.goalMet, "0");
  assert.equal(w.eval("bursts"), 0);
});

test("pips, meter and mystery lock follow solved problems and open at the goal", () => {
  const w = page();
  w.solve(3);
  assert.equal(w.document.getElementById("progress_text").textContent, "3 / 4");
  assert.equal(w.document.querySelectorAll(".hw-pips")[0].querySelectorAll(".is-on").length, 3);
  assert.equal(w.document.getElementById("hw_mystery").classList.contains("is-unlocked"), false);
  w.solve(4);
  assert.equal(w.document.getElementById("progress_text").textContent, "4 / 4");
  assert.equal(w.document.getElementById("goal_reached_banner").hidden, false);
  assert.equal(w.document.getElementById("hw_mystery").classList.contains("is-unlocked"), true);
  assert.equal(w.document.getElementById("hw_mystery_open").hidden, false);
  assert.equal(w.eval("bursts"), 1);
  w.solve(6);
  assert.equal(w.document.getElementById("progress_text").textContent, "4 / 4");
  assert.equal(w.eval("bursts"), 1, "bonus problems do not celebrate again");
});

test("solved problems come back after a reload, without a second fanfare", () => {
  const first = page();
  first.solve(4);
  const saved = {
    [first.eval("hwKey('solved')")]: first.localStorage.getItem(first.eval("hwKey('solved')")),
    [first.eval("hwKey('goal_met')")]: first.localStorage.getItem(first.eval("hwKey('goal_met')")),
  };
  assert.ok(saved[first.eval("hwKey('solved')")]);
  const again = page({ storage: saved });
  again.hwRestoreSolved();
  again.hwRenderGoal(false);
  assert.equal(again.document.getElementById("progress_text").textContent, "4 / 4");
  assert.equal(again.document.getElementById("hw_mystery").classList.contains("is-unlocked"), true);
  assert.equal(again.eval("bursts"), 0);
  assert.equal(again.eval("fanfares"), 0);
});

test("saved progress is never overwritten before it has been read back", () => {
  const w = page({ restored: false });
  w.localStorage.setItem(w.eval("hwKey('solved')"), JSON.stringify({ 0: "correct" }));
  w.hwRenderGoal(true); // a startup render that happens before the restore
  assert.equal(JSON.parse(w.localStorage.getItem(w.eval("hwKey('solved')")))[0], "correct");
});

test("reduced motion gets no confetti and no fanfare", () => {
  const w = page({ reducedMotion: true });
  w.solve(4);
  assert.equal(w.eval("bursts"), 0);
  assert.equal(w.eval("fanfares"), 0);
  assert.equal(w.document.getElementById("goal_reached_banner").hidden, false);
});

test("reset clears solved state", () => {
  const w = page();
  w.solve(4);
  w.hwClearProgress();
  assert.equal(w.localStorage.getItem(w.eval("hwKey('solved')")), "{}");
});

test("the confidence plant records before and after and says what changed", () => {
  const w = page();
  const radios = w.document.querySelectorAll("#hw_conf_before .hw-conf-btn");
  assert.equal(radios.length, 3);
  assert.equal(w.document.querySelector("#hw_conf_before [role='group']") !== null, true);
  w.hwSetConfidence("before", 1);
  assert.equal(
    w.document.querySelector("#hw_conf_before [data-conf-level='1']").getAttribute("aria-pressed"),
    "true",
  );
  w.hwSetConfidence("after", 3);
  assert.match(w.document.getElementById("hw_conf_growth").textContent, /grew from 🌱 to 🌳/);
  w.hwSetConfidence("after", 1);
  assert.match(w.document.getElementById("hw_conf_growth").textContent, /Steady/);
  w.hwSetConfidence("before", 3);
  w.hwSetConfidence("after", 1);
  assert.match(w.document.getElementById("hw_conf_growth").textContent, /honest/);
});

test("notices are in-page toasts in the language on screen, and reset asks in-page", () => {
  const w = page();
  w.hwNotice("Copied. / Copiado.");
  assert.equal(w.document.getElementById("hw_toast").textContent, "Copied.");
  w.document.body.className = "lang-mode-es";
  w.hwNotice("Copied. / Copiado.");
  assert.equal(w.document.getElementById("hw_toast").textContent, "Copiado.");
  w.document.body.className = "lang-mode-bilingual";
  w.hwNotice("Copied. / Copiado.");
  assert.equal(w.document.getElementById("hw_toast").textContent, "Copied. · Copiado.");
  let asked = false;
  w.document.getElementById("hw_dialog").showModal = () => (asked = true);
  w.hwConfirm("Reset?", "¿Borrar?", "Yes", "Sí", "No", "No", () => {});
  assert.equal(asked, true);
  assert.equal(w.document.getElementById("hw_dialog_text").textContent, "Reset? · ¿Borrar?");
});

test("the tonight strip follows the route", () => {
  const w = page();
  w.document.body.dataset.homeworkRoute = "quick";
  w.hwRenderTonight();
  assert.equal(w.document.querySelector("[data-hw-tonight-time]").textContent, "5–10");
});

test("the mystery challenge quotes a standalone stem and never a stem that points elsewhere", () => {
  const items = [
    { stem: "Which is greater?", stemEs: "¿Cuál es mayor?" },
    { stem: "Use the table below to find the total.", stemEs: "Usa la tabla de abajo." },
  ];
  assert.deepEqual(pickMystery(items, 6), {
    index: 6,
    stemEn: "Which is greater?",
    stemEs: "¿Cuál es mayor?",
  });
  const none = pickMystery([items[1]], 9);
  assert.equal(none.index, 9);
  assert.equal(none.stemEn, "");
  assert.equal(pickMystery([], 0), null);
  assert.equal(pickMystery([{ stem: "x".repeat(200), stemEs: "y" }], 0).stemEn, "");
  assert.match(renderMysteryChallenge(none), /last problem in Level up/);
  assert.match(
    renderMysteryChallenge({ index: 3, stemEn: "A?", stemEs: "¿A?" }),
    /data-problem="problem_3"/,
  );
});

test("teach-it-back names three English words with their Spanish, and sharing sends no answers", () => {
  const html = renderTeachBack({
    vocabulary: [
      { term: "ratio", termEs: "razón" },
      { term: "rate", termEs: "tasa" },
      { term: "unit rate", termEs: "tasa unitaria" },
      { term: "extra" },
    ],
  });
  assert.equal((html.match(/<li><strong>/g) || []).length, 3);
  assert.match(html, /any language first/i);
  assert.match(renderShareWin(), /No answers, no names/);
});

test("every Math Dominoes tile that carries words has Spanish, and none is unused", () => {
  const es = JSON.parse(readFileSync(join(ROOT, "data/family-game-pairs-es.json"), "utf8"));
  delete es._note;
  const used = new Set();
  for (const pairs of Object.values(FAMILY_GAME_BANKS.pairs)) {
    for (const pair of pairs) {
      for (const text of [pair.a, pair.b]) {
        if (!/[A-Za-z]{3}/.test(text)) continue;
        used.add(text);
        assert.ok(es[text], `no Spanish for domino tile "${text}"`);
      }
    }
  }
  assert.deepEqual(
    Object.keys(es).filter((k) => !used.has(k)),
    [],
    "Spanish entries for tiles that no longer exist",
  );
});

test("every generated family page carries the experience layer and the one product name", () => {
  const ids = readdirSync(join(ROOT, "data/family-homework-notes"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5));
  assert.ok(ids.length >= 160, `only ${ids.length} family pages`);
  const missing = [];
  for (const id of ids) {
    const html = readFileSync(lessonPath(id, "homework.html"), "utf8");
    const checks = {
      title: /<title>Family Math Studio — /.test(html),
      noOldName: !html.includes("Help Your Student"),
      mystery: html.includes('id="hw_mystery"'),
      before: html.includes('id="hw_conf_before"'),
      after: html.includes('id="hw_conf_after"'),
      teach: html.includes('id="hw_teach_title"'),
      toast: html.includes('id="hw_toast"') && html.includes('id="hw_dialog"'),
      tonight: html.includes("data-hw-tonight-time"),
      pips: html.includes('class="hw-pips'),
      langFirst: html.indexOf('class="hw-hero-controls"') < html.indexOf('class="hw-hero-kicker"'),
      fullStudio: html.includes("Full Studio") && html.includes("Estudio completo"),
    };
    for (const [name, ok] of Object.entries(checks)) if (!ok) missing.push(`${id}:${name}`);
  }
  assert.deepEqual(missing, []);
});

test("the shared runtime never opens a native dialog", () => {
  const dir = join(ROOT, "assets/homework");
  const bundle = readdirSync(dir).filter((f) => /^homework-core-.*\.js$/.test(f));
  assert.ok(bundle.length >= 1);
  for (const file of bundle) {
    const src = readFileSync(join(dir, file), "utf8");
    // hwConfirm's own fallback (when <dialog> is unsupported) is the only permitted confirm.
    const outside = src
      .replace(/function hwConfirm[\s\S]*?\n}\n/, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    assert.doesNotMatch(outside, /(?<![\w.])(alert|confirm)\(/, `${file} opens a native dialog`);
    assert.doesNotMatch(outside, /window\.prompt\(/, `${file} opens a native prompt`);
  }
});

test("family nights count school nights: weekends and an unfinished tonight never break a streak", () => {
  const w = page();
  const set = (...days) => w.localStorage.setItem("hw_family_nights_v1", JSON.stringify(days));
  const wed = new w.Date(2026, 9, 21); // Wednesday 21 Oct 2026
  assert.equal(w.hwStreakCount(wed), 0);
  set("2026-10-19", "2026-10-20");
  assert.equal(w.hwStreakCount(wed), 2, "Monday and Tuesday done, Wednesday not yet");
  set("2026-10-19", "2026-10-20", "2026-10-21");
  assert.equal(w.hwStreakCount(wed), 3);
  set("2026-10-22", "2026-10-23");
  assert.equal(
    w.hwStreakCount(new w.Date(2026, 9, 26)),
    2,
    "Thursday and Friday still count on Monday",
  );
  assert.equal(w.hwStreakCount(new w.Date(2026, 9, 24)), 2, "and on the Saturday between");
  set("2026-10-24");
  assert.equal(
    w.hwStreakCount(new w.Date(2026, 9, 24)),
    1,
    "a Saturday done counts, and Friday not done ends it there",
  );
  set("2026-10-19", "2026-10-21");
  assert.equal(w.hwStreakCount(wed), 1, "a missed school night does break it");
});

test("the goal records tonight once, and a restore never records a night", () => {
  const first = page();
  first.solve(4);
  const nights = JSON.parse(first.localStorage.getItem("hw_family_nights_v1"));
  assert.equal(nights.length, 1);
  assert.match(first.document.getElementById("hw_nights_streak").textContent, /1 night in a row/);
  const today = new Date();
  const isSchoolNight = today.getDay() !== 0 && today.getDay() !== 6;
  assert.equal(
    first.document.querySelectorAll("#hw_nights_week .is-on").length,
    isSchoolNight ? 1 : 0,
    "the weekly strip displays weekdays only; weekend completions still count in the streak",
  );
  first.solve(6);
  assert.equal(JSON.parse(first.localStorage.getItem("hw_family_nights_v1")).length, 1);
  const solvedKey = first.eval("hwKey('solved')");
  const goalKey = first.eval("hwKey('goal_met')");
  const again = page({
    storage: {
      [solvedKey]: first.localStorage.getItem(solvedKey),
      [goalKey]: first.localStorage.getItem(goalKey),
    },
  });
  again.hwRenderGoal(false);
  assert.equal(again.localStorage.getItem("hw_family_nights_v1"), null);
});

test("the goal reads the same from every tab: a hidden panel does not make the page look empty", () => {
  const w = page();
  w.solve(3);
  const panel = w.document.querySelector("[data-tab-panel='check']");
  panel.hidden = true; // the family is on Learn or Done
  assert.deepEqual({ ...w.hwGoalSnapshot() }, { done: 3, goal: GOAL_TARGET, available: 12 });
  w.hwRenderGoal(false);
  assert.equal(w.document.getElementById("progress_text").textContent, `3 / ${GOAL_TARGET}`);
  // a problem inside a hidden tier (the route's unused tier) still does not count
  const tier = w.document.createElement("div");
  tier.hidden = true;
  tier.append(w.document.getElementById("problem_11"));
  panel.append(tier);
  assert.equal(w.hwGoalSnapshot().available, 11);
});

test("finishing on Full, then opening Quick, does not celebrate again and still records the night once", () => {
  const w = page();
  w.document.body.dataset.homeworkRoute = "full";
  w.solve(GOAL_TARGET);
  const nights = JSON.parse(w.localStorage.getItem("hw_family_nights_v1"));
  assert.equal(nights.length, 1);
  w.document.body.dataset.homeworkRoute = "quick";
  w.hwRenderGoal(true);
  assert.equal(w.bursts <= 1 && w.fanfares <= 1, true, "no second fanfare after the route changes");
  assert.equal(JSON.parse(w.localStorage.getItem("hw_family_nights_v1")).length, 1);
});

test("the mystery button in the goal banner is hidden on Quick, where the mystery problem is not shown", () => {
  const w = page();
  w.document.body.dataset.homeworkRoute = "quick";
  w.solve(GOAL_QUICK);
  assert.equal(w.document.querySelector(".hw-banner-mystery").hidden, true);
  w.document.body.dataset.homeworkRoute = "full";
  w.solve(GOAL_TARGET);
  assert.equal(w.document.querySelector(".hw-banner-mystery").hidden, false);
});

test("a full device frees old photos and voice notes and keeps the written reflection", () => {
  const w = page({
    storage: {
      "hw_parent_signoff_3-1": JSON.stringify({
        parentName: "A",
        photoData: "xxxx",
        voiceMemoData: "yyyy",
        photo: "present",
      }),
      "hw_parent_signoff_4-3": JSON.stringify({ parentName: "B", photoData: "keep" }),
    },
  });
  w.hwFreeSignoffMedia("4-3");
  const old = JSON.parse(w.localStorage.getItem("hw_parent_signoff_3-1"));
  assert.equal(old.parentName, "A");
  assert.equal(old.photoData, "");
  assert.equal(old.voiceMemoData, "");
  assert.equal(
    JSON.parse(w.localStorage.getItem("hw_parent_signoff_4-3")).photoData,
    "keep",
    "tonight's lesson keeps its own media",
  );
});

test("another script resetting <html lang> to en does not undo Spanish mode", async () => {
  const w = page();
  w.document.body.className = "lang-mode-es";
  w.hwHoldDocumentLanguage();
  w.document.documentElement.lang = "en"; // what the site-wide i18n script does after load
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(w.document.documentElement.lang, "es");
  w.document.body.className = "lang-mode-bilingual";
  w.document.documentElement.lang = "es";
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(
    w.document.documentElement.lang,
    "en",
    "bilingual stays en, as setLanguageMode does",
  );
});
