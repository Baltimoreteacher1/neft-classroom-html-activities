// small-group-practice-path.test.mjs — the SHIPPED small-group practice path.
//
// This file exists because of what its absence cost. `small-group-renderer.js`
// imports its practice sections from `small-group-practice-path.js`; the
// renderer it replaced, `small-group-practice.js`, is imported only by its own
// seven test files. So the dead module had seven suites proving it healthy and
// the live one had NONE — and `teacherLens()` was lost in the handover without
// a single check going red. `.sg-lens` rendered on zero studios across all 204
// variants, and the browser assertion that would have said so ("a studio
// renders at least one teacher lens") was deleted to get CI green.
//
// Runs the REAL module via the engine hooks (tools/lib/engine-hooks.mjs) under
// jsdom, the same way small-group-table-experience.test.mjs drives the old one.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import "../../tools/lib/register-engine-hooks.mjs";

const { JSDOM } = await import("jsdom");
const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  url: "https://example.test/lessons/1-5-group1/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.location = dom.window.location;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
globalThis.localStorage = dom.window.localStorage;
globalThis.sessionStorage = dom.window.sessionStorage;

const { CORRECT_LEADS, correctLead, resetCorrectLeads, tableCheck, teacherLens } = await import(
  "./small-group-practice-path.js"
);

let checks = 0;
const ok = (cond, what) => {
  assert.ok(cond, what);
  checks += 1;
};

// ── the lens is built from this item's own distractors ────────────────────────
{
  const lens = teacherLens({
    choices: ["12", "15", "18", "20"],
    correct: 2,
    choiceWhy: [
      "Did you add instead of multiply?",
      "",
      "Correct.",
      "That rounds both factors up first — what does rounding cost you here?",
    ],
  });
  ok(lens, "a lens renders when a distractor carries choiceWhy");
  const rows = [...lens.querySelectorAll(".sg-lens-row")];
  ok(rows.length === 2, `at most two probes, got ${rows.length}`);
  const text = lens.textContent;
  ok(text.includes("That rounds both factors up"), "richest probe is kept");
  ok(text.includes("Did you add instead of multiply?"), "second probe is kept");
  ok(!text.includes("Correct."), "the CORRECT choice is never probed");
  ok(/Teacher lens/.test(text), "the lens is labelled for a teacher");
}

// ── absence is a pass, and `hint` is NOT a fallback ───────────────────────────
// 1,428 of the 1,764 authored items carry a hint and 74 carry choiceWhy. A hint
// fallback would reprint the student's own hint button in a teacher-coloured box
// on four cards in five, so an item with nothing to probe must get NO lens.
{
  ok(teacherLens({ answer: "60", hint: "Name the number of equal groups first." }) === null,
    "an item with only a hint gets no lens");
  ok(teacherLens({ choices: ["a", "b"], correct: 0 }) === null,
    "choices with no choiceWhy get no lens");
  ok(teacherLens({ choices: ["a", "b"], correct: 0, choiceWhy: ["", ""] }) === null,
    "blank choiceWhy entries get no lens");
  // The guard above refuses an item with no choiceWhy ARRAY, so it cannot see a
  // fallback added inside the per-choice read. This case can: choices and a
  // choiceWhy array are present, every entry is blank, and a hint is sitting
  // right there to be picked up. Mutating the read to `it.choiceWhy[i] ||
  // it.hint` passes every other assertion in this file and fails only here.
  ok(
    teacherLens({
      choices: ["a", "b"],
      correct: 0,
      choiceWhy: ["", ""],
      hint: "Name the number of equal groups first.",
    }) === null,
    "a hint is never promoted into a probe",
  );
  ok(teacherLens({ choices: ["a", "b"], correct: 1, choiceWhy: ["", "only the correct one"] }) === null,
    "a choiceWhy on the CORRECT choice alone gets no lens");
  ok(teacherLens(null) === null, "a missing item gets no lens");
}

// ── the lens is teacher-only by construction ──────────────────────────────────
// Not a claim about the rendered page — these are source facts about the two
// files that make the lens invisible to students and absent from the projector.
{
  const ui = readFileSync(new URL("./small-group-ui.js", import.meta.url), "utf8");
  ok(/\.sg-lens\{[^}]*display:\s*none/.test(ui), ".sg-lens is display:none by default");
  ok(ui.includes("body.sg-is-teacher .sg-lens{display:block}"),
    "only body.sg-is-teacher reveals the lens");
  const present = readFileSync(new URL("./small-group-present.js", import.meta.url), "utf8");
  ok(/TEACHER_ONLY\s*=\s*"[^"]*\.sg-lens/.test(present),
    "Present Mode blacks the lens out on the projector");
}

// ── at least one authored studio can actually exercise it ─────────────────────
// The old browser assertion asked EVERY studio for a lens, which is not a fact
// about the code: only 74 of 1,764 items carry choiceWhy, and 1-1-group1 has
// none. What IS a fact is that the authored data feeds the lens somewhere — if
// that stops being true, the detector above is unreachable and proves nothing.
{
  const dir = new URL("../../data/small-group-practice/", import.meta.url);
  let fed = 0;
  let items = 0;
  const studios = [];
  for (const name of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const doc = JSON.parse(readFileSync(new URL(name, dir), "utf8"));
    for (const group of ["group1", "group2", "catchup"]) {
      const sections = doc[group] || {};
      for (const value of Object.values(sections)) {
        const list = Array.isArray(value) ? value : value && value.problem ? [value] : [];
        for (const it of list) {
          items += 1;
          if (teacherLens(it)) {
            fed += 1;
            studios.push(`${doc.lesson}-${group}`);
          }
        }
      }
    }
  }
  ok(items > 1000, `the sweep saw the authored fleet (${items} items)`);
  ok(fed > 0, "at least one authored item feeds a lens — the detector is reachable");
  ok(
    studios.includes("1-5-group1"),
    `1-5-group1 feeds a lens, so a browser probe has a studio to use (found ${studios.length})`,
  );
  console.log(
    `small-group practice path: ${fed} of ${items} authored items feed a teacher lens ` +
      `across ${new Set(studios).size} studio(s).`,
  );
}

// ── correct-answer praise rotates ─────────────────────────────────────────────
// Carried back from the renderer this path replaced, whose own comment is the
// reason: a student working a long set read the identical sentence every time,
// and praise that never varies "starts reading as machinery". This path had
// regressed to one fixed "Correct." for every right answer in a session.
{
  ok(CORRECT_LEADS.length >= 4, `enough leads to not repeat soon (${CORRECT_LEADS.length})`);
  ok(
    CORRECT_LEADS.every(([en, es]) => en && es),
    "every lead has a Spanish sibling",
  );
  // The voice rule: name the method, never rate the child. These are the shapes
  // that rate a person rather than describe the mathematics.
  const ratesTheChild = /\b(smart|clever|genius|good (boy|girl)|brilliant)\b/i;
  ok(
    CORRECT_LEADS.every(([en]) => !ratesTheChild.test(en)),
    "no lead rates the student instead of the method",
  );

  // Deterministic rotation, not Math.random — successive corrects walk the list
  // in order, so no two in a row repeat and a replayed session reads the same.
  const first = CORRECT_LEADS.map(([en]) => en);
  ok(new Set(first).size === first.length, "the leads are distinct, so rotation can vary the text");

  resetCorrectLeads();
  const walk = Array.from({ length: CORRECT_LEADS.length * 2 }, () => correctLead());
  ok(
    walk.slice(0, CORRECT_LEADS.length).every((html, i) => html.includes(first[i])),
    "the first pass walks the list in order",
  );
  ok(
    walk.every((html, i) => i === 0 || html !== walk[i - 1]),
    "no two consecutive corrects print the same lead",
  );
  ok(
    walk[CORRECT_LEADS.length] === walk[0],
    "the cursor wraps rather than running off the end",
  );
  resetCorrectLeads();
  ok(correctLead() === walk[0], "resetting replays the same sequence — deterministic, not random");
}

// ── the table check is the show-me rhythm, not a lock ─────────────────────────
{
  const block = tableCheck(3);
  ok(block.classList.contains("sg-tablecheck"), "the show-me block carries its own class");
  ok(block.getAttribute("role") === "status", "it is announced, not silent");
  ok(/#3/.test(block.textContent), "it names the problem number it belongs to");
  ok(/notebook/i.test(block.textContent), "it asks for the paper notebook");
  const button = block.querySelector(".sg-tablecheck-done");
  ok(button, "it is dismissible");
  ok(!button.disabled, "the dismiss button starts live");
  button.onclick();
  ok(block.classList.contains("sg-tablecheck-ok"), "dismissing marks it done");
  ok(button.disabled, "it cannot be double-dismissed");
  // Honor-system by design: the software cannot see a notebook, so nothing here
  // may gate progress on the dismissal.
  ok(
    !/disabled|required|must/i.test(block.innerHTML.replace(/<button[^>]*>/, "")),
    "the show-me never blocks the student",
  );
}

// ── the styles for both still ship, and now something renders them ────────────
// .sg-tablecheck* sat in the shipped stylesheet with nothing creating the
// element, which is how this read as a loss rather than a decision.
{
  const ui = readFileSync(new URL("./small-group-ui.js", import.meta.url), "utf8");
  for (const cls of [".sg-tablecheck", ".sg-tablecheck-done", ".sg-tablecheck-icon"]) {
    ok(ui.includes(cls), `${cls} is styled by the shipped sheet`);
  }
  const src = readFileSync(new URL("./small-group-practice-path.js", import.meta.url), "utf8");
  ok(/card\.appendChild\(tableCheck\(/.test(src), "a card actually mounts the show-me");
  ok(
    /\+\+solvedLive % 3 === 0/.test(src),
    "it lands on every third live solve, counted per section",
  );
  ok(
    /if \(!restoring && tick\?\.\(\)/.test(src),
    "a restored solve does not fire the ritual for last session's work",
  );
  ok(
    !/"\u2713 Correct\."/.test(src),
    "the fixed one-sentence praise is gone from the correct path",
  );
  ok(/correctLead\(\)/.test(src), "the correct path uses a rotating lead");
}

console.log(`small-group-practice-path: ${checks} checks passed.`);
