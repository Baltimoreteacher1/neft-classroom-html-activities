// Homework: a wrong answer at home is never a dead end, and the family card says only what the
// lesson already authored.
//
// Until now only multiple choice escalated (trap -> clue -> walkthrough). A wrong fill-table,
// matching or sorting problem answered with red marks and nothing else. All of those now climb the
// same three steps, Hint 2 shows the lesson's own worked example, and Done carries a Family
// Conversation Card in English and Spanish. This drives the generated pages in jsdom.

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { JSDOM, VirtualConsole } from "jsdom";
import { selectTieredQuickCheckProblems } from "../scripts/homework-alignment.mjs";
import { inlineSharedFromDisk } from "../scripts/lib/homework-shared-assets.mjs";
import { workedExampleFor } from "../scripts/lib/homework-worked-example.mjs";
import {
  lessonPath,
  listLessonDirs,
  loadLessonConfig,
  REPO_ROOT,
} from "./lib/curriculum-source.mjs";

function page(id) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => {
    if (e.type !== "css parsing" && e.type !== "not implemented") errors.push(e);
  });
  const dom = new JSDOM(
    inlineSharedFromDisk(REPO_ROOT, readFileSync(lessonPath(id, "homework.html"), "utf8")),
    {
      url: `https://eduwonderlab.com/lessons/${id}/homework?route=full&lang=en`,
      runScripts: "dangerously",
      pretendToBeVisual: true,
      virtualConsole: vc,
      beforeParse(w) {
        w.HTMLElement.prototype.scrollIntoView = () => {};
        w.scrollTo = () => {};
        w.HTMLMediaElement.prototype.play = () => Promise.resolve();
        w.HTMLMediaElement.prototype.pause = () => {};
        w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {} });
      },
    },
  );
  return { dom, w: dom.window, d: dom.window.document, errors };
}

/* ---- the worked example offered as Hint 2 ------------------------------------------------- */
test("workedExampleFor: lesson's own example, never a practice problem, Spanish only when aligned", () => {
  const cfg = (iDo) => ({ launch: { conceptIntro: { iDo } } });
  assert.equal(workedExampleFor({}), null, "a lesson with no worked example offers none");
  assert.equal(workedExampleFor(cfg({ lines: [] })), null);
  const ok = workedExampleFor(
    cfg({
      title: "Find the median",
      lines: ["Order: 2, 5, 9", "Middle is 5"],
      linesEs: ["Ordena", "El medio es 5"],
    }),
  );
  assert.deepEqual(ok.lines, ["Order: 2, 5, 9", "Middle is 5"]);
  assert.deepEqual(ok.linesEs, ["Ordena", "El medio es 5"]);
  const partial = workedExampleFor(cfg({ lines: ["a", "b"], linesEs: ["solo uno"] }));
  assert.equal(
    partial.linesEs,
    null,
    "a half-translated example falls back to English, never mixed",
  );
  const echo = workedExampleFor(
    cfg({ lines: ["What is the mean of 4, 8, 6, 10, and 2?", "Add, divide."] }),
    [{ stem: "What is the MEAN of 4, 8, 6, 10, and 2?" }],
  );
  assert.equal(echo, null, "an example that contains tonight's problem is dropped, not shown");
});

/* ---- escalation on a non-multiple-choice problem ------------------------------------------ */
test("a wrong fill-table answer climbs look-again -> worked example -> answer key, and spoils nothing early", () => {
  const { w, d, errors } = page("2-3");
  const section = [...d.querySelectorAll("[data-problem-type='fill-table']")][0];
  assert.ok(section, "2-3 has a fill-table problem");
  const idx = Number(section.id.replace("problem_", ""));
  const input = section.querySelector(".table-input");
  const answer = input.dataset.correct;
  const cardOf = () =>
    d.querySelector(
      `#problem_${idx} ~ .explanation-box, #problem_result_${idx} + .explanation-box`,
    );

  w.checkProblem(idx);
  assert.equal(cardOf(), null, "an empty problem is not an attempt and gets no hint");

  input.value = "wrong!!";
  w.checkProblem(idx, { silent: true });
  assert.equal(
    cardOf(),
    null,
    "a silent re-check (Check All, restore) shows no hint and burns none",
  );

  const seen = [];
  for (let i = 0; i < 4; i++) {
    w.checkProblem(idx);
    const card = cardOf();
    assert.ok(card, `attempt ${i + 1} shows a hint card`);
    seen.push({
      head: card.querySelector(".exp-header").textContent,
      worked: !!card.querySelector(".exp-worked"),
      showMe: !!card.querySelector(".hw-reveal-btn"),
      text: card.textContent,
      keyOpen: !!section.querySelector(".hw-answer-key[open]"),
    });
  }
  assert.match(seen[0].head, /Hint 1 of 3/);
  assert.match(seen[1].head, /Hint 2 of 3/);
  assert.match(seen[2].head, /Hint 3 of 3/);
  assert.match(seen[3].head, /Hint 3 of 3/, "a fourth try stays on the last step, not a dead end");
  assert.ok(seen[1].worked, "Hint 2 shows the lesson's worked example");
  assert.ok(!seen[0].worked && !seen[2].worked);
  assert.ok(seen[0].showMe && seen[1].showMe, "a stuck family can ask for the walkthrough at once");
  assert.ok(!seen[0].keyOpen && !seen[1].keyOpen, "the answer key stays closed before Hint 3");
  assert.ok(seen[2].keyOpen, "Hint 3 opens the answer key to compare against");
  for (const s of seen.slice(0, 2)) {
    assert.ok(
      !s.text.includes(` ${answer} `) && !s.text.endsWith(answer),
      "Hints 1-2 never print the answer",
    );
  }
  assert.deepEqual(errors, [], "no script errors");
});

test("'Show me how' jumps straight to the step-by-step", () => {
  const { w, d } = page("2-3");
  const section = [...d.querySelectorAll("[data-problem-type='fill-table']")][0];
  const idx = Number(section.id.replace("problem_", ""));
  section.querySelector(".table-input").value = "wrong!!";
  w.checkProblem(idx);
  w.forceReveal(idx);
  const card = d.querySelector(`#problem_result_${idx} + .explanation-box`);
  assert.match(card.querySelector(".exp-header").textContent, /Hint 3 of 3/);
  assert.ok(section.querySelector(".hw-answer-key[open]"));
});

/* ---- every page: the card is present, bilingual, and not the exit ticket ------------------- */
test("every homework page carries one English/Spanish family card that never prints the exit ticket", () => {
  const ids = listLessonDirs().filter((id) => existsSync(lessonPath(id, "homework.html")));
  let checked = 0;
  let withWorked = 0;
  const squash = (t) =>
    String(t)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  for (const id of ids) {
    const html = readFileSync(lessonPath(id, "homework.html"), "utf8");
    if (!html.includes("window.LESSON_ID")) continue;
    assert.equal(
      (html.match(/data-family-talk/g) || []).length,
      1,
      `${id}: exactly one family card`,
    );
    const card = html.slice(
      html.indexOf("data-family-talk"),
      html.indexOf("</section>", html.indexOf("data-family-talk")),
    );
    const panes = [...card.matchAll(/data-pane="(\w+)"/g)].map((m) => m[1]);
    assert.deepEqual(panes, ["en", "es"], `${id}: English and Spanish only`);
    for (const lang of ["en", "es"]) {
      const q = card.match(new RegExp(`data-pane="${lang}"[\\s\\S]*?class="ft-question">([^<]+)<`));
      assert.ok(q && q[1].trim().length > 8, `${id}: ${lang} question present`);
    }
    const configPath = lessonPath(id, "config.json");
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, "utf8"));
      const tickets = [config.reflect?.exitTicket].flat().filter(Boolean);
      const text = squash(card.replace(/<[^>]+>/g, " "));
      for (const t of tickets) {
        const stem = squash(t.stem || t.question || "");
        assert.ok(
          stem.length < 12 || !text.includes(stem),
          `${id}: the family card must not print the exit ticket`,
        );
      }
    }
    const m = html.match(/window\.__HW_WORKED__ = (.*);\n/);
    assert.ok(m, `${id}: worked-example data present`);
    if (JSON.parse(m[1])) withWorked++;
    checked++;
  }
  assert.ok(checked >= 100, `swept only ${checked} homework pages`);
  assert.ok(withWorked >= 50, `only ${withWorked} pages offer a worked example in Hint 2`);
  console.log(
    `homework-hint-ladder: ${checked} pages checked; ${withWorked} offer the lesson's worked example`,
  );
});

test("the worked example is the same one the generator derives from the config", () => {
  const config = loadLessonConfig("2-3");
  const { warmup, challenge } = selectTieredQuickCheckProblems(config.practice || {}, config);
  const expected = workedExampleFor(config, [...warmup, ...challenge]);
  const html = readFileSync(lessonPath("2-3", "homework.html"), "utf8");
  const m = html.match(/window\.__HW_WORKED__ = (.*);\n/);
  assert.deepEqual(JSON.parse(m[1].replace(/\\u003c/g, "<")), expected);
});
