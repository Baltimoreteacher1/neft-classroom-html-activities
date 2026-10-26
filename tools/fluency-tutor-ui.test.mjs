import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../math/fluency-lab/index.html", import.meta.url), "utf8");
const dom = new JSDOM(html, {
  url: "https://example.test/math/fluency-lab/?grade=4&skill=division",
  pretendToBeVisual: true,
});
const win = dom.window;
win.HTMLElement.prototype.scrollIntoView = () => {};
win.print = () => {};
for (const [key, value] of Object.entries({
  window: win,
  document: win.document,
  location: win.location,
  history: win.history,
  localStorage: win.localStorage,
  CustomEvent: win.CustomEvent,
}))
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
await import("../math/fluency-lab/app.js");
const $ = (selector) => win.document.querySelector(selector);
const click = (selector) => {
  assert.ok($(selector), `Missing ${selector}`);
  $(selector).click();
};
const fill = (selector, value) => {
  $(selector).value = String(value);
};
const submit = (selector) =>
  $(selector).dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
const savedTutor = () => JSON.parse(win.localStorage.getItem("ewl-fluency-tutor-v2") || "{}");
const savedSession = () => JSON.parse(win.localStorage.getItem("ewl-fluency-session-v2") || "null");
const solveCurrent = () => {
  const item = savedSession().item;
  if (item.choices)
    [...win.document.querySelectorAll("[data-answer]")]
      .find((button) => button.dataset.answer === item.answers[0])
      .click();
  else {
    fill("#answer-input", item.answers[0]);
    submit("#answer-form");
  }
};

click('[data-view="library"]');
assert.equal(
  $("#page-title").textContent,
  "Your Math Journey",
  "The student route opens on the journey home",
);
assert.match($("#personal-dashboard").textContent, /Continue learning/);
assert.match($("#personal-dashboard").textContent, /Play a game/);
assert.match($("#personal-dashboard").textContent, /Explore skills/);
assert.ok(
  $(".journey-continue [data-open-key]"),
  "First-time visitors get a real recommended next step",
);
assert.equal(
  $(".site-header #open-print-center"),
  null,
  "Teacher print tools stay out of the student header",
);
assert.ok(
  $(".journey-explore a[href='#subnav-skills']"),
  "Explore skills links to the actual skill library",
);

click('[data-view="games"]');
assert.equal($("#games-view").hidden, false, "The Play a game card reaches the live game room");
assert.equal($("#page-title").textContent, "Play with math");
assert.ok($("#games-view [data-game]"), "The game room renders playable game choices");
click('[data-view="teacher"]');
assert.equal($("#page-title").textContent, "Teacher resources");
assert.ok(win.document.body.classList.contains("teacher-resources"));
assert.ok($("#teacher-studio .teacher-layout"), "Teacher studio mounts into its own workspace");
assert.ok(
  $("#open-print-center") && $("#open-word-wall-btn") && $("#open-number-talk-btn"),
  "Teacher quick tools survive studio rendering",
);
assert.equal($("#studio-launch-nt"), null, "The Number Talk projector has one teacher entry point");
click('[data-view="library"]');
assert.ok(!win.document.body.classList.contains("teacher-resources"));
click("#lang-toggle");
assert.equal(
  $("#page-title").textContent,
  "Tu camino en matemáticas",
  "The journey home follows the language selection",
);
click("#lang-toggle");
fill("#quick-skill-select", "4:division");
$("#quick-skill-select").dispatchEvent(new win.Event("change", { bubbles: true }));

assert.equal(
  $("#workspace-title").textContent,
  "Whole-number division",
  "A deep link opens its requested skill",
);
click('[data-mode="visual"]');
assert.match($("#visual-panel").textContent, /360 ÷ 6/);
fill("#visual-answer", 999);
submit("[data-visual-form]");
assert.match($(".visual-feedback").textContent, /Try this/);
for (const answer of [60, 4, 64]) {
  fill("#visual-answer", answer);
  submit("[data-visual-form]");
  click("[data-visual-next]");
}
assert.equal(savedTutor().records["4:division"].lessonCompleted, true);
assert.ok($("[data-teach-back]"), "Visual lesson ends with a student explanation checkpoint");
fill("#teach-back-response", "My private explanation stays on this device only.");
click("[data-teach-back]");
assert.match($(".teach-back-feedback").textContent, /Choose one part/);
$(".teach-back-checks input[value='model']").checked = true;
click("[data-teach-back]");
assert.match($(".teach-back-feedback").textContent, /explain why each step fits the strategy/);
for (const checkbox of win.document.querySelectorAll(".teach-back-checks input"))
  checkbox.checked = true;
click("[data-teach-back]");
assert.match(
  $(".teach-back-feedback").textContent,
  /complete explanation: model, reason, and check/,
);
assert.ok(
  !Array.from({ length: win.localStorage.length }, (_, i) =>
    win.localStorage.getItem(win.localStorage.key(i)),
  )
    .join(" ")
    .includes("My private explanation"),
  "Teach-back writing is not saved",
);
click("[data-visual-practice]");
assert.equal(savedSession().session.mode, "adaptive");
assert.equal(savedSession().item.level, 0, "A new skill starts with a smaller first problem");
assert.equal($("#guided-coach").hidden, false, "The first problem includes coached support");
assert.deepEqual(
  Array.from(
    win.document.querySelectorAll(".tool-btn:not([hidden])"),
    (button) => button.dataset.tool,
  ),
  ["longdivision"],
  "The drawer only offers a tool that fits the current division problem",
);
const originalQuestion = $("#question").textContent;
submit("#answer-form");
assert.equal(savedSession().itemAttempts, 0, "Empty input does not spend an attempt");
fill("#answer-input", -999);
submit("#answer-form");
assert.equal(savedTutor().mistakes.length, 1, "First mistakes enter the notebook");
click("#back-library");
assert.ok($("[data-resume-practice]"), "Leaving practice exposes a resume action");
click("[data-resume-practice]");
assert.equal($("#question").textContent, originalQuestion, "Resume preserves the problem");
assert.equal(savedSession().itemAttempts, 1, "Resume preserves used attempts");
solveCurrent();
let record = savedTutor().records["4:division"];
assert.equal(
  record.recent.at(-1).correct,
  true,
  "The coached problem is ultimately recorded as solved",
);
assert.equal(
  record.recent.at(-1).independent,
  false,
  "The initial coached miss is not counted as independent evidence",
);
click("#next-problem");
fill("#answer-input", -999);
submit("#answer-form");
fill("#answer-input", -999);
submit("#answer-form");
click("#next-problem");
assert.equal($("#guided-coach").hidden, false, "Two misses produce coached support");
for (let i = 0; i < 2; i++) {
  solveCurrent();
  click("#next-problem");
}
assert.equal($("#guided-coach").hidden, true, "Two supported successes fade the coach");
click("#show-hint");
solveCurrent();
record = savedTutor().records["4:division"];
assert.equal(
  record.recent.at(-1).independent,
  false,
  "A pre-answer hint cannot inflate independent mastery",
);

click("#back-library");
const priorRecent = savedTutor().records["4:division"].recent.length;
click("#add-profile");
assert.equal($("#profile-select").value, "1");
assert.equal(
  $("#overall-stats strong").textContent,
  "0",
  "New learner starts with separate progress",
);
fill("#profile-select", "0");
$("#profile-select").dispatchEvent(new win.Event("change", { bubbles: true }));
assert.equal(
  savedTutor().records["4:division"].recent.length,
  priorRecent,
  "Switching profiles preserves previous progress",
);

click('[data-view="teacher"]');
fill("#assignment-label", "Division <Club>");
fill("#assignment-count", "5");
$('[name="assignment-skill"][value="4:division"]').checked = true;
submit("#assignment-builder");
assert.equal($("#assignment-result h3").textContent, "Division <Club>");
assert.ok($("#assignment-link").value.includes("#assignment="));
assert.equal($("#assignment-result Club"), null, "Assignment text is not HTML");
click("[data-launch-assignment]");
assert.equal(savedSession().session.mode, "assignment");
for (let i = 0; i < 5; i++) {
  solveCurrent();
  click("#next-problem");
}
assert.equal($("#session-summary").hidden, false, "Assignments reach a real completion state");
assert.equal(savedSession(), null, "Completed sessions do not remain resumable");
click('[data-view="library"]');
click('[data-skill="division"]');
assert.equal($("label[for='mastery-meter']").textContent, "Recent independent accuracy");
assert.match($("#mastery-label").textContent, /of \d+ recent checks correct/);

click('[data-view="library"]');
const recordsBefore = JSON.stringify(savedTutor().records);
click("[data-start-checkup]");
for (let i = 0; i < 11; i++) {
  click("#skip-checkup");
  click("#next-problem");
}
assert.equal(
  Object.keys(savedTutor().diagnostics[4].results).length,
  11,
  "Checkup records every skill once",
);
assert.equal(JSON.stringify(savedTutor().records), recordsBefore, "Checkups do not award mastery");
assert.match($("#summary-title").textContent, /starting-point/);

click('[data-view="notebook"]');
const savedMistake = savedTutor().mistakes.find(
  (entry) => entry.key === "4:division" && !entry.resolvedAt,
);
assert.ok(
  savedMistake?.original?.answers?.length,
  "A notebook entry retains a safe copy of its original problem for revision",
);
click(`[data-revise-entry="${savedMistake.id}"]`);
assert.equal(
  savedSession().item.question,
  savedMistake.question,
  "Repair begins with the original question",
);
assert.equal(savedSession().session.queue[0].original.question, savedMistake.question);
solveCurrent();
assert.equal(savedSession().session.revised, 1, "The supported revision is recorded separately");
assert.equal(
  savedSession().session.correct,
  0,
  "A supported revision does not inflate fresh-problem correctness",
);
assert.equal(
  savedSession().session.independentCorrect,
  0,
  "A supported revision is not independent mastery evidence",
);
assert.match($("#session-accuracy").textContent, /1 revised/);
click("#next-problem");
for (let i = 0; i < 2; i++) {
  solveCurrent();
  click("#next-problem");
}
assert.match($("#summary-stats").textContent, /revised with support/);
assert.ok(
  savedTutor()
    .mistakes.filter((entry) => entry.key === "4:division")
    .every((entry) => entry.resolvedAt),
  "Fresh independent success repairs notebook entries",
);
click('[data-view="path"]');
assert.equal(win.document.querySelectorAll(".path-skill").length, 11);
assert.match($(".learning-milestones").textContent, /0\/11/);
assert.match($("#path-view").textContent, /two different days/);

// Streak mode: untimed, 10 correct in a row, a miss restarts the count, no clock anywhere.
click('[data-view="library"]');
click('[data-skill="division"]');
click('[data-mode="streak"]');
assert.equal(savedSession().session.mode, "streak", "Streak sessions save and can resume");
assert.equal($("#streak-wrap").hidden, false, "Streak meter shows in streak mode");
assert.equal($("#timer-wrap"), null, "No timer element exists");
assert.doesNotMatch(
  $("#drill-panel").textContent,
  /\d:\d\d|second/i,
  "No clock text in the practice panel",
);
for (let i = 0; i < 3; i++) {
  solveCurrent();
  click("#next-problem");
}
assert.equal(win.document.querySelectorAll("#streak-meter .lit").length, 3);
fill("#answer-input", -999);
submit("#answer-form");
assert.equal(
  win.document.querySelectorAll("#streak-meter .lit").length,
  0,
  "A miss restarts the streak",
);
assert.equal(
  $("#next-problem").hidden,
  false,
  "Moving on is the student's choice, never automatic",
);
click("#next-problem");
for (let i = 0; i < 10; i++) {
  assert.equal($("#session-summary").hidden, true, `Streak continues until ten in a row (${i})`);
  solveCurrent();
  click("#next-problem");
}
assert.equal($("#session-summary").hidden, false, "Ten in a row completes the streak");
assert.match($("#summary-title").textContent, /Ten in a row/);
assert.equal(
  JSON.parse(win.localStorage.getItem("ewl-fluency-progress-v1"))["4:division"].streakBest,
  10,
  "streakBest is stored",
);

click('[data-view="library"]');
click("[data-start-daily]");
assert.equal(savedSession().session.queue.length, 10);
assert.ok(new Set(savedSession().session.queue.map((entry) => entry.key)).size >= 2);
click("#back-library");

// The GCF and LCM workspaces include a usable, side-by-side list chart.
click("#lang-toggle");
click('[data-grade="6"]');
click('.open-skill[data-skill="gcf"]');
click('[data-mode="practice"]');
click("#toggle-interactive-solver");
assert.ok($(".solver-reference-chart[aria-label='Tabla de factores']"));
assert.equal($(".solver-reference-chart h3").textContent, "Tabla de factores");
assert.match($(".solver-reference-chart .tp-prompt").textContent, /Escribe los factores/);
assert.equal(
  $(
    ".solver-reference-chart .tp-live[data-find='gcf'] .tp-list-row",
  )?.parentElement?.querySelectorAll(".tp-list-row").length,
  2,
);
fill(".solver-reference-chart [data-factor-of]", 1);
$(".solver-reference-chart [data-add-factor]").click();
assert.ok($(".solver-reference-chart [data-chips] b"), "Factor chart accepts and checks entries");

click('[data-view="library"]');
click("#lang-toggle");
click('.open-skill[data-skill="lcm"]');
click('[data-mode="practice"]');
click("#toggle-interactive-solver");
assert.ok($(".solver-reference-chart[aria-label='Prime factor guide']"));
// LCM is taught by prime factorization: the workspace asks for primes, not lists of multiples.
assert.equal(
  $(".solver-reference-chart [data-then='multiple']"),
  null,
  "LCM workspace no longer lists multiples",
);
assert.ok(
  $(".solver-reference-chart svg.ft-tree"),
  "Prime factor guide draws a worked factor tree",
);
for (const group of ["a", "b"]) {
  for (const input of [...document.querySelectorAll(`.lcm-prime-input[data-group="${group}"]`)]) {
    input.value = input.dataset.target;
    input.dispatchEvent(new win.Event("input", { bubbles: true }));
    assert.ok(
      input.classList.contains("is-ok"),
      `Prime ${input.dataset.target} in group ${group} is accepted`,
    );
  }
}
assert.ok(
  $(".lcm-guide-yours svg.ft-tree"),
  "Finishing both factorizations shows the learner's own factor trees",
);
click(".scratchpad-wrap summary");
fill("#scratchpad", "Keep this working.");
for (const background of ["blank", "lined", "numberline", "coordinate"]) {
  click(`[data-scratchpad-bg="${background}"]`);
  assert.equal($("#scratchpad").dataset.background, background);
  assert.ok($("#scratchpad").classList.contains(`scratchpad-background-${background}`));
  assert.equal(
    $("#scratchpad").value,
    "Keep this working.",
    "Changing backgrounds preserves writing",
  );
  assert.equal($(`[data-scratchpad-bg="${background}"]`).getAttribute("aria-pressed"), "true");
}
click('[data-view="library"]');
click("#lang-toggle");
fill("#quick-skill-select", "4:multiply-2digit");
$("#quick-skill-select").dispatchEvent(new win.Event("change", { bubbles: true }));
click('[data-mode="visual"]');
assert.match($("#visual-panel").textContent, /Compara estrategias para 48 × 25/);
assert.equal(win.document.querySelectorAll("#visual-panel [data-strategy-choice]").length, 3);
assert.match($("#visual-panel [data-visual-form]").textContent, /Si 25 es un cuarto de 100/);
click('#visual-panel [data-strategy-choice="friendly"]');
assert.match($("#visual-panel .strategy-equation").textContent, /50 × 25 − 2 × 25/);
assert.match($("#visual-panel .strategy-equivalence").textContent, /Si empiezas con 50 grupos/);
assert.equal(
  $('#visual-panel [data-strategy-choice="friendly"]').getAttribute("aria-pressed"),
  "true",
);
click('#visual-panel [data-strategy-choice="quarter"]');
assert.ok($("#visual-panel .strategy-quarter-whole .selected"));
win.close();
console.log(
  "Fluency UI: deep links, visual lessons, wrong-answer recovery, resume, adaptive support, profile isolation, teacher assignments, checkups, repair, relevant tools, scratchpad backgrounds, factor/multiples charts, and daily plans passed.",
);
