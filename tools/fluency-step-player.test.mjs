// The explanation card is a step player: the active step and the numbers it uses light up in the problem,
// tapping a step moves the highlight, and the WIDA language prompts are bilingual and never ask for a clock.
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body><div id='host'></div></body>", {
  url: "https://example.test/",
});
for (const [key, value] of Object.entries({
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
}))
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });

const { stepPlayer, handleStepPlayerClick, lightStepPlayers } = await import(
  "../math/fluency-lab/step-player.js"
);
const { ALL_SKILLS, generateProblem, seededRandom } = await import(
  "../math/fluency-lab/problem-bank.js"
);
const { languagePromptHtml, languageExpectation } = await import(
  "../math/fluency-lab/language-bridge.js"
);
const { setLang } = await import("../math/fluency-lab/i18n.js");

const rng = seededRandom(7);
let item = null;
for (const skill of ALL_SKILLS) {
  for (let i = 0; i < 6 && !item; i++) {
    const candidate = generateProblem(skill, rng);
    if (
      (candidate.steps?.length || 0) >= 3 &&
      /\d/.test(candidate.question) &&
      candidate.steps.slice(0, 2).some((s) => /\d/.test(s))
    )
      item = candidate;
  }
  if (item) break;
}
assert.ok(item, "some skill has a three-step solution to play");

const host = document.querySelector("#host");
host.innerHTML = stepPlayer(item);
lightStepPlayers(host);
const section = host.querySelector("[data-step-player]");
assert.ok(section, "a multi-step solution renders a step player");
assert.equal(
  host.querySelectorAll(".tr-steps > li").length,
  1,
  "only the first step shows at the start",
);
assert.ok(
  section.querySelectorAll(".sp-num").length > 0,
  "the numbers in the problem are individually highlightable",
);
assert.equal(
  section.querySelector(".tr-steps > li").getAttribute("aria-current"),
  "step",
  "the newest step is the active one",
);
assert.ok(section.querySelector(".step-audio-btn"), "each readable step has a listen button");
assert.match(
  section.querySelector(".sp-live").textContent,
  /Step 1 of \d/,
  "the active step is announced",
);

assert.equal(
  handleStepPlayerClick(document.body),
  false,
  "clicks outside a player are not handled",
);

const next = () => section.querySelector("button.tr-step-next");
let guard = 0;
while (next() && guard++ < 10)
  assert.ok(handleStepPlayerClick(next()), "Next step reveals another step");
const lis = [...section.querySelectorAll(".tr-steps > li")];
assert.equal(lis.length, item.steps.length, "every step can be revealed");
assert.equal(
  lis.filter((li) => li.classList.contains("sp-active")).length,
  1,
  "exactly one step is active",
);
assert.ok(lis.at(-1).classList.contains("sp-active"), "the newest step is active after advancing");

handleStepPlayerClick(lis[0]);
assert.ok(
  lis[0].classList.contains("sp-active"),
  "tapping an earlier step makes it the active one",
);
assert.ok(!lis.at(-1).classList.contains("sp-active"), "the later step is no longer active");
const lit = [...section.querySelectorAll(".sp-num.sp-lit")].map((s) => s.dataset.n);
const stepNumbers = (
  lis[0].querySelector(".tr-step-text").textContent.match(/\d[\d,]*(?:\.\d+)?/g) || []
).map((n) => n.replaceAll(",", ""));
for (const n of lit)
  assert.ok(stepNumbers.includes(n), `${n} is lit only because the active step uses it`);
assert.ok(
  !section.querySelector(".tr-step-text mark.sp-link") || lit.length > 0,
  "marked step numbers match numbers in the problem",
);

// WIDA language prompts: every grade has a standard code, no clock language, Spanish is real Spanish.
for (let grade = 1; grade <= 8; grade++) {
  setLang("en");
  const html = languagePromptHtml({ grade, name: "Fractions" });
  assert.match(html, /ELD-MA\./, `grade ${grade} names its WIDA ELD Standard 3 expectation`);
  assert.doesNotMatch(
    html,
    /\d:\d\d|second|timer|minutes/i,
    `grade ${grade} language prompt has no clock language`,
  );
  setLang("es");
  const es = languagePromptHtml({ grade, name: "Fractions" });
  assert.match(es, /Meta de lenguaje/, `grade ${grade} prompt is in Spanish`);
  assert.notEqual(languageExpectation(grade).goal, "", "a goal exists");
}
setLang("en");
console.log("fluency-step-player: step player highlights and WIDA prompts hold");
