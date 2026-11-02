/**
 * Family word problems (data/family-word-problems/<lesson>.json):
 * - the arithmetic is re-derived here, independently of the generator, and must match the answers it prints;
 * - each stem states the numbers the problem declares, in both languages;
 * - the page on disk is what the generator would write, and the lesson's family guide links to it.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { JSDOM } from "jsdom";
import { solve } from "../scripts/lib/family-word-problems.mjs";
import { wordProblemsPage } from "../scripts/lib/family-word-problems-page.mjs";
import { homeworkChrome } from "../scripts/lib/homework-chrome.mjs";
import { isGeneratedFresh } from "../scripts/lib/preserve-injected.mjs";
import { DATA_DIR, lessonPath } from "./lib/curriculum-source.mjs";

const dir = join(DATA_DIR, "family-word-problems");
const sets = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
const problems = sets.flatMap((s) =>
  s.groups.flatMap((g) => g.problems.map((p) => ({ lesson: s.lessonId, ...p }))),
);

const numbersIn = (text) => (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
const lastLine = (p, lang) => solve(p, lang).at(-1);

test("there is at least one set, with problems", () => {
  assert.ok(sets.length >= 1);
  assert.ok(problems.length >= 9);
});

test("every problem is bilingual (English and Spanish only) and Spanish is not a copy", () => {
  for (const p of problems) {
    for (const field of ["stem", "ask", "hint"]) {
      assert.deepEqual(Object.keys(p[field]).sort(), ["en", "es"], `${p.id}.${field} languages`);
      assert.notEqual(p[field].es, p[field].en, `${p.id}.${field} Spanish is a copy`);
      assert.ok(p[field].es.length > 10, `${p.id}.${field} Spanish is empty`);
    }
  }
});

test("percent-of answers equal an independent recomputation", () => {
  for (const p of problems.filter((q) => q.kind === "percent-of")) {
    const expected = (p.percent * p.whole) / 100;
    for (const lang of ["en", "es"])
      assert.ok(
        numbersIn(lastLine(p, lang)).includes(expected),
        `${p.id} ${lang}: ${lastLine(p, lang)}`,
      );
  }
});

test("discount answers state the savings and the sale price", () => {
  for (const p of problems.filter((q) => q.kind === "discount")) {
    const saved = (p.percent * p.price) / 100;
    for (const lang of ["en", "es"]) {
      const nums = numbersIn(lastLine(p, lang));
      assert.ok(
        nums.includes(saved) && nums.includes(p.price - saved),
        `${p.id} ${lang}: ${lastLine(p, lang)}`,
      );
    }
  }
});

test("deal answers compare savings and final prices correctly, never on a tie of final prices", () => {
  for (const p of problems.filter((q) => q.kind === "deal")) {
    assert.equal(p.options.length, 2, `${p.id} compares exactly two deals`);
    const rows = p.options.map((o) => ({
      saved: (o.percent * o.price) / 100,
      pay: o.price - (o.percent * o.price) / 100,
    }));
    assert.notEqual(rows[0].pay, rows[1].pay, `${p.id} final prices tie`);
    for (const lang of ["en", "es"]) {
      const text = solve(p, lang).join("\n");
      for (const r of rows) {
        assert.ok(numbersIn(text).includes(r.saved), `${p.id} ${lang} lacks savings ${r.saved}`);
        assert.ok(numbersIn(text).includes(r.pay), `${p.id} ${lang} lacks price ${r.pay}`);
      }
      const cheaper = rows[0].pay < rows[1].pay ? p.options[0] : p.options[1];
      assert.ok(
        solve(p, lang).at(-1).includes(cheaper.name[lang]),
        `${p.id} ${lang} names the cheaper deal`,
      );
    }
  }
});

test("stems state the numbers the problem declares, in both languages", () => {
  for (const p of problems) {
    const declared =
      p.kind === "deal"
        ? p.options.flatMap((o) => [o.percent, o.price])
        : [p.percent, p.kind === "discount" ? p.price : p.whole];
    for (const lang of ["en", "es"]) {
      const stated = numbersIn(p.stem[lang]);
      for (const n of declared)
        assert.ok(stated.includes(n), `${p.id} ${lang} stem never says ${n}`);
    }
  }
});

test("percents stay inside what the lesson teaches: whole numbers from 5 to 100", () => {
  for (const p of problems) {
    const percents = p.kind === "deal" ? p.options.map((o) => o.percent) : [p.percent];
    for (const pct of percents)
      assert.ok(Number.isInteger(pct) && pct >= 5 && pct <= 100, `${p.id} percent ${pct}`);
  }
});

test("no timer language", () => {
  const text = JSON.stringify(sets);
  assert.doesNotMatch(text, /\b(timer|countdown|beat the clock|race the clock)\b/i);
});

test("each page is current and the family guide links to it", () => {
  for (const s of sets) {
    const out = lessonPath(s.lessonId, "family", "word-problems", "index.html");
    assert.ok(
      isGeneratedFresh(out, wordProblemsPage(s, homeworkChrome(s.lessonId))),
      `${s.lessonId} word-problems page is stale`,
    );
    const guide = readFileSync(lessonPath(s.lessonId, "family", "index.html"), "utf8");
    assert.ok(
      guide.includes(`/lessons/${s.lessonId}/family/word-problems/`),
      `${s.lessonId} guide does not link to its word problems`,
    );
    const html = readFileSync(out, "utf8");
    assert.match(
      html,
      new RegExp(`<html lang="en" data-unit="${Number.parseInt(s.lessonId, 10)}">`),
    );
  }
});

test("each page is dressed as its lesson's homework page", () => {
  for (const s of sets) {
    const chrome = homeworkChrome(s.lessonId);
    const html = readFileSync(
      lessonPath(s.lessonId, "family", "word-problems", "index.html"),
      "utf8",
    );
    const homework = readFileSync(lessonPath(s.lessonId, "homework.html"), "utf8");
    const links = [
      ...chrome.designHead.split("\n"),
      `<link rel="stylesheet" href="${chrome.legacy}">`,
    ];
    assert.ok(
      chrome.designHead.includes("body.css?v=") && chrome.designHead.includes("homework-art-"),
      "the design system's links (tokens, components, body, art palette) are lifted too",
    );
    for (const link of links) {
      assert.ok(homework.includes(link), "homework still loads the sheets it is dressed with");
      assert.ok(html.includes(link), `${s.lessonId} word problems lose ${link}`);
    }
    assert.match(html, /<header class="hw-hero fm-page"/);
    assert.match(html, /data-lang-mode="es"/);
    assert.match(html, /hw_lang_mode/, "shares the homework language choice");
    assert.match(html, /class="problem-section card/);
  }
});

test("each page uses the homework tab bar: one stop per group between Learn and Done", () => {
  for (const s of sets) {
    const html = readFileSync(
      lessonPath(s.lessonId, "family", "word-problems", "index.html"),
      "utf8",
    );
    const stops = [...html.matchAll(/<button type="button" role="tab" id="wp_tab_([a-z-]+)"/g)].map(
      (m) => m[1],
    );
    assert.deepEqual(stops, ["learn", ...s.groups.map((g) => g.id), "done"]);
    for (const id of stops)
      assert.match(html, new RegExp(`data-tab-panel="${id}" id="wp_panel_${id}" role="tabpanel"`));
    assert.equal(
      (
        html.match(
          /data-tab-panel="[a-z-]+" id="wp_panel_[a-z-]+" role="tabpanel"[^>]* hidden>/g,
        ) ?? []
      ).length,
      stops.length - 1,
      "only Learn starts open",
    );
    for (const g of s.groups) {
      assert.ok(
        g.tab.en.length <= 7,
        `${g.id} tab "${g.tab.en}" is too long to fit five tabs on a phone`,
      );
      assert.ok(
        g.tab.es.length <= 8,
        `${g.id} tab "${g.tab.es}" is too long to fit five tabs on a phone`,
      );
      assert.ok(g.emoji, `${g.id} needs a tab emoji`);
    }
  }
});

const pair = (v, where) => {
  assert.deepEqual(Object.keys(v).sort(), ["en", "es"], `${where} languages`);
  assert.notEqual(v.es, v.en, `${where} Spanish is a copy`);
};

test("the family extras are bilingual: team, explorer, coaching for every problem kind, hunt, celebration", () => {
  for (const s of sets) {
    pair(s.team.title, "team.title");
    pair(s.team.intro, "team.intro");
    assert.ok(s.team.roles.length >= 3);
    for (const r of s.team.roles) {
      pair(r.title, "role.title");
      pair(r.text, "role.text");
      assert.ok(r.emoji);
    }
    pair(s.explorer.title, "explorer.title");
    pair(s.explorer.text, "explorer.text");
    pair(s.hunt.title, "hunt.title");
    pair(s.hunt.text, "hunt.text");
    pair(s.celebrate.locked, "celebrate.locked");
    pair(s.celebrate.done, "celebrate.done");
    const kinds = new Set(s.groups.flatMap((g) => g.problems.map((p) => p.kind)));
    for (const kind of kinds) {
      pair(s.coach[kind].listenFor, `coach.${kind}.listenFor`);
      assert.ok(s.coach[kind].stems.length >= 2, `coach.${kind} has sentence starters`);
      for (const stem of s.coach[kind].stems) pair(stem, `coach.${kind}.stem`);
    }
    for (const p of s.groups.flatMap((g) => g.problems))
      assert.ok(p.emoji, `${p.id} needs an emoji`);
  }
});

/** Open a family page in jsdom with a clean store. */
function openFamily(id, store = {}) {
  const html = readFileSync(lessonPath(id, "family", "word-problems", "index.html"), "utf8");
  return new JSDOM(html, {
    runScripts: "dangerously",
    url: `https://eduwonderlab.com/lessons/${id}/family/word-problems/`,
    beforeParse(window) {
      for (const [k, v] of Object.entries(store)) window.localStorage.setItem(k, v);
    },
  }).window;
}
const familyData = (w) => JSON.parse(w.document.getElementById("wp-data").textContent);
const solveAll = (w, data) => {
  for (const P of data.problems) {
    const card = w.document.getElementById(P.id);
    if (P.fields) {
      card.querySelectorAll("input").forEach((el, i) => {
        el.value = String(P.fields[i].answer);
      });
      card.querySelector(".check-btn").click();
    } else
      P.questions.forEach((q, qi) =>
        card.querySelector(`.choice-btn[data-q="${qi}"][data-i="${q.correct}"]`).click(),
      );
  }
};

test("family page: a miss gives a hint and no answer, a hit earns a star, and it is remembered", () => {
  const id = sets[0].lessonId;
  const w = openFamily(id);
  const data = familyData(w);
  const first = data.problems.find((p) => p.fields);
  const card = w.document.getElementById(first.id);
  card.querySelector("input").value = String(first.fields[0].answer + 1);
  card.querySelector(".check-btn").click();
  assert.match(card.querySelector(".feedback-box").className, /\berr\b/);
  assert.equal(card.querySelector(".hint-btn").hidden, false);
  assert.equal(w.document.getElementById("wp-stars").textContent, "0");
  card.querySelector("input").value = String(first.fields[0].answer);
  card.querySelector(".check-btn").click();
  assert.ok(card.classList.contains("wp-solved"));
  assert.equal(w.document.getElementById("wp-stars").textContent, "1");
  assert.equal(w.document.getElementById("wp-first").textContent, "0", "not a first-try solve");
  const again = openFamily(id, { [data.key]: w.localStorage.getItem(data.key) });
  assert.equal(again.document.getElementById("wp-stars").textContent, "1");
});

test("family page: solving every problem unlocks the certificate and celebrates once", () => {
  const id = sets[0].lessonId;
  const w = openFamily(id);
  const data = familyData(w);
  const cert = w.document.getElementById("wp-cert");
  assert.ok(cert.classList.contains("locked"));
  assert.equal(w.document.getElementById("wp-print-cert").disabled, true);
  solveAll(w, data);
  assert.equal(w.document.getElementById("wp-stars").textContent, String(data.problems.length));
  assert.equal(w.document.getElementById("wp-first").textContent, String(data.problems.length));
  assert.ok(!cert.classList.contains("locked"));
  assert.equal(w.document.getElementById("wp-print-cert").disabled, false);
  assert.equal(w.document.getElementById("wp-cert-done").hidden, false);
  const saved = JSON.parse(w.localStorage.getItem(data.key));
  assert.equal(
    saved.celebrated,
    true,
    "the celebration is remembered so a reload does not repeat it",
  );
});

test("family page: the percent bar shades the percent of the bar and states the part", () => {
  const w = openFamily(sets[0].lessonId);
  const doc = w.document;
  const range = doc.getElementById("wp-bar-percent");
  const whole = doc.getElementById("wp-bar-whole");
  range.value = "40";
  whole.value = "300";
  range.dispatchEvent(new w.Event("input"));
  assert.equal(doc.querySelectorAll("#wp-cells .on").length, 8, "40% of 20 cells");
  assert.match(doc.getElementById("wp-bar-out").textContent, /40% of 300 = 120/);
});

test("family page: every problem has a picture, a Grown-up corner and a grown-up answer key", () => {
  for (const s of sets) {
    const html = readFileSync(
      lessonPath(s.lessonId, "family", "word-problems", "index.html"),
      "utf8",
    );
    for (const p of s.groups.flatMap((g) => g.problems)) {
      const card = html.slice(
        html.indexOf(`id="${p.id}" data-id`),
        html.indexOf("</section>", html.indexOf(`id="${p.id}" data-id`)),
      );
      for (const marker of [
        'class="wp-picture"',
        'class="wp-corner"',
        'class="hw-answer-key"',
        "wp-bar-fill",
      ])
        assert.ok(card.includes(marker), `${p.id} lacks ${marker}`);
    }
  }
});
