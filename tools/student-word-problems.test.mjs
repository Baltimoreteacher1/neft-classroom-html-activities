/**
 * Student word-problems page (lessons/<id>/word-problems/, data/student-word-problems/<id>.json):
 * - the page on disk is what the generator would write, and the curriculum hub links to it;
 * - every answer the page checks against is re-derived here from the problem's own numbers;
 * - the page behaves: a wrong answer gets a hint and no answer, a right one is marked and counted,
 *   and progress survives a reload.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { JSDOM } from "jsdom";
import { isGeneratedFresh } from "../scripts/lib/preserve-injected.mjs";
import { studentPage } from "../scripts/lib/student-word-problems.mjs";
import { DATA_DIR, lessonPath, loadLessonConfig, REPO_ROOT } from "./lib/curriculum-source.mjs";

const read = (path) => readFileSync(join(REPO_ROOT, path), "utf8");
const json = (...parts) => JSON.parse(readFileSync(join(DATA_DIR, ...parts), "utf8"));
const lessons = readdirSync(join(DATA_DIR, "student-word-problems"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""));
const pageFor = (id) => readFileSync(lessonPath(id, "word-problems", "index.html"), "utf8");
const dataOf = (html) =>
  JSON.parse(/<script type="application\/json" id="wp-data">([\s\S]*?)<\/script>/.exec(html)[1]);

test("there is at least one student word-problems lesson", () => {
  assert.ok(lessons.length >= 1);
});

test("each page is current, links nowhere external, and the hub links to it", () => {
  for (const id of lessons) {
    const html = pageFor(id);
    assert.ok(
      isGeneratedFresh(
        lessonPath(id, "word-problems", "index.html"),
        studentPage(
          json("student-word-problems", `${id}.json`),
          json("family-word-problems", `${id}.json`),
          loadLessonConfig(id),
        ),
      ),
      `${id} student page is stale`,
    );
    assert.doesNotMatch(html, /<script[^>]+src="https?:/, "no external scripts");
    const hub = read("curriculum/units/index.html");
    assert.match(
      hub,
      new RegExp(`<a class="res" href="/lessons/${id}/word-problems/">HTML word problems</a`),
    );
  }
});

test("the tabs and cards match the family problem set, one card per problem", () => {
  for (const id of lessons) {
    const family = json("family-word-problems", `${id}.json`);
    const html = pageFor(id);
    const tabs = [...html.matchAll(/role="tab" id="tab-([a-z-]+)"/g)].map((m) => m[1]);
    assert.deepEqual(tabs, ["plan", ...family.groups.map((g) => g.id)]);
    for (const p of family.groups.flatMap((g) => g.problems))
      assert.equal(
        (
          html.match(
            new RegExp(`class="stage-card wp-card" id="wp-${p.id}" data-id="${p.id}"`, "g"),
          ) ?? []
        ).length,
        1,
        `${p.id} has one card`,
      );
    assert.equal(dataOf(html).problems.length, family.groups.flatMap((g) => g.problems).length);
  }
});

test("every checked answer equals an independent recomputation", () => {
  for (const id of lessons) {
    const family = json("family-word-problems", `${id}.json`);
    const byId = Object.fromEntries(dataOf(pageFor(id)).problems.map((p) => [p.id, p]));
    for (const p of family.groups.flatMap((g) => g.problems)) {
      const c = byId[p.id];
      if (p.kind === "percent-of") {
        assert.equal(c.fields[0].answer, (p.percent * p.whole) / 100, p.id);
      } else if (p.kind === "discount") {
        const saved = (p.percent * p.price) / 100;
        assert.deepEqual(
          c.fields.map((f) => f.answer),
          [saved, p.price - saved],
          p.id,
        );
      } else {
        const [x, y] = p.options.map((o) => ({
          off: (o.percent * o.price) / 100,
          pay: o.price - (o.percent * o.price) / 100,
        }));
        const moreOff = x.off === y.off ? 2 : x.off > y.off ? 0 : 1;
        assert.deepEqual(
          c.questions.map((q) => q.correct),
          [moreOff, x.pay < y.pay ? 0 : 1],
          p.id,
        );
      }
    }
  }
});

test("every message is bilingual (English and Spanish only) and Spanish is not a copy", () => {
  for (const id of lessons) {
    const messages = [];
    for (const p of dataOf(pageFor(id)).problems) {
      for (const f of p.fields ?? []) messages.push(f.generic, ...f.wrong.map((w) => w.msg));
      for (const q of p.questions ?? []) messages.push(...q.wrong);
    }
    assert.ok(messages.length > 0);
    for (const m of messages) {
      assert.deepEqual(Object.keys(m).sort(), ["en", "es"]);
      assert.notEqual(m.es, m.en);
    }
    const student = json("student-word-problems", `${id}.json`);
    for (const s of student.plan.steps) {
      assert.deepEqual(Object.keys(s.name).sort(), ["en", "es"]);
      assert.deepEqual(Object.keys(s.text).sort(), ["en", "es"]);
    }
  }
});

test("the worked example states the numbers it computes", () => {
  for (const id of lessons) {
    const ex = json("student-word-problems", `${id}.json`).example;
    for (const lang of ["en", "es"])
      for (const n of [ex.percent, ex.price])
        assert.ok(ex.stem[lang].includes(String(n)), `example ${lang} stem names ${n}`);
  }
});

/** Open the generated page in jsdom with a clean store and return the window. */
function open(id, store = {}) {
  const dom = new JSDOM(pageFor(id), {
    runScripts: "dangerously",
    url: `https://eduwonderlab.com/lessons/${id}/word-problems/`,
    beforeParse(window) {
      for (const [k, v] of Object.entries(store)) window.localStorage.setItem(k, v);
    },
  });
  return dom.window;
}

test("a wrong answer gets a hint and no answer, a right one is counted and remembered", () => {
  const id = lessons[0];
  const html = pageFor(id);
  const data = dataOf(html);
  const first = data.problems[0];
  const w = open(id);
  const card = w.document.querySelector(`#wp-${first.id}`);
  const input = card.querySelector("input");
  assert.equal(card.querySelector(".hint-btn").hidden, true, "hint starts hidden");
  const wrong = first.fields[0].answer + 1;
  input.value = String(wrong);
  card.querySelector(".check-btn").click();
  assert.match(card.querySelector(".feedback-box").className, /\berr\b/);
  assert.equal(card.querySelector(".hint-btn").hidden, false, "a miss reveals the hint");
  assert.doesNotMatch(
    card.querySelector(".feedback-box").textContent,
    new RegExp(`=\\s*${first.fields[0].answer}\\b`),
  );
  input.value = `$${first.fields[0].answer}`;
  card.querySelector(".check-btn").click();
  assert.ok(card.classList.contains("wp-solved"));
  assert.equal(
    w.document.querySelector("#solved-count").textContent,
    `1 / ${data.problems.length}`,
  );
  const again = open(id, { [data.key]: w.localStorage.getItem(data.key) });
  assert.equal(
    again.document.querySelector("#solved-count").textContent,
    `1 / ${data.problems.length}`,
  );
  assert.ok(again.document.querySelector(`#wp-${first.id}`).classList.contains("wp-solved"));
});

test("a choice problem takes two right answers before it counts", () => {
  const id = lessons[0];
  const data = dataOf(pageFor(id));
  const deal = data.problems.find((p) => p.questions);
  assert.ok(deal, "the set has a comparison problem");
  const w = open(id);
  const card = w.document.querySelector(`#wp-${deal.id}`);
  const pick = (q, i) => card.querySelector(`.choice-btn[data-q="${q}"][data-i="${i}"]`).click();
  const wrongIndex = deal.questions[0].correct === 0 ? 1 : 0;
  pick(0, wrongIndex);
  assert.match(card.querySelector(".feedback-box").className, /\berr\b/);
  pick(0, deal.questions[0].correct);
  assert.ok(!card.classList.contains("wp-solved"), "one question is not the whole problem");
  pick(1, deal.questions[1].correct);
  assert.ok(card.classList.contains("wp-solved"));
});

test("the page keeps no answer out of its own text before it is asked", () => {
  const html = pageFor(lessons[0]);
  assert.doesNotMatch(html.replace(/<script[\s\S]*?<\/script>/g, ""), /Answer:/);
});
