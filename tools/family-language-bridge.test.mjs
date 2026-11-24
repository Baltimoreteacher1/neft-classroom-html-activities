// Language Bridge (assets/family-studio/language-bridge.mjs + language-logic.mjs): "Read it 3 ways" on
// word problems and the Word Bridge (Spanish word twins) card. The text logic is proved on fixtures and then
// swept over EVERY problem stem and EVERY vocabulary pair on all generated family homework pages; the DOM
// layer is mounted in jsdom on a real page.
//
//   node --test tools/family-language-bridge.test.mjs

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import {
  cognate,
  isWordProblem,
  quantities,
  sharedLetters,
  threeReads,
} from "../assets/family-studio/language-logic.mjs";
import { lessonPath, listLessonDirs } from "./lib/curriculum-source.mjs";

const decode = (s) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

function pages() {
  return listLessonDirs()
    .map((d) => lessonPath(d, "homework.html"))
    .filter((p) => existsSync(p))
    .map((p) => ({ url: p, html: readFileSync(p, "utf8") }));
}

/* ── Three Reads: fixtures ─────────────────────────────────────────── */

test("a story with counted things is a word problem; pure computation and labels are not", () => {
  assert.ok(
    isWordProblem(
      "Headphones are on sale for $27. That is 30% of the regular price. What was the regular price?",
    ),
  );
  assert.ok(
    isWordProblem(
      "A box has 20 crayons and the class used 3/5 of them today. How many crayons were used?",
    ),
  );
  assert.equal(isWordProblem("Evaluate 3 + 4 × 2."), false);
  assert.equal(isWordProblem("In 4x + 3 + 2x, which terms are like terms?"), false);
  /* "Row 1" names a row; "2:3" is one ratio. Nothing here counts a thing. */
  assert.equal(
    isWordProblem(
      "Row 1 of a ratio table is 2:3. Row 2 is made by multiplying both numbers by 2. What is row 2?",
    ),
    false,
  );
});

test("quantities keep money, fractions, mixed numbers, percents and ratios whole", () => {
  const v = (t) => quantities(t).map((q) => q.value);
  assert.deepEqual(
    v("It costs $4.50 for 2 1/2 pounds, 3/4 of a bag, 25% off, a 2:3 mix, 1,200 people."),
    ["$4.50", "2 1/2", "3/4", "25%", "2:3", "1,200"],
  );
  assert.deepEqual(v("Step 2: add 5 apples."), ["5"]);
});

test("read 1 hides every number and holds the question for read 3; read 2 is the stem verbatim", () => {
  const t =
    "Headphones are on sale for $27. That is 30% of the regular price. What was the regular price?";
  const r = threeReads(t);
  const story = r.story.map((s) => (s.blank ? "[?]" : s.text)).join("");
  assert.equal(story, "Headphones are on sale for [?]. That is [?] of the regular price. …");
  assert.equal(r.question, "What was the regular price?");
  assert.equal(r.numbers.map((s) => s.num ?? s.text).join(""), t);
  assert.deepEqual(
    r.numbers.filter((s) => s.num).map((s) => s.num),
    ["$27", "30%"],
  );
});

test("a one-sentence asking stem keeps its words in read 1, with the numbers hidden", () => {
  const r = threeReads(
    "What is the volume of a box that is 2 inches long, 3 inches wide, and 4 inches tall?",
  );
  const story = r.story.map((s) => (s.blank ? "[?]" : s.text)).join("");
  assert.equal(
    story,
    "What is the volume of a box that is [?] inches long, [?] inches wide, and [?] inches tall?",
  );
  assert.deepEqual(
    r.numbers.filter((s) => s.num).map((s) => s.unit),
    ["inches", "inches", "inches"],
  );
});

/* ── Three Reads: every stem on every page ─────────────────────────── */

test("sweep: every word problem on every family page reads three ways without adding or losing a word", () => {
  let stems = 0;
  let wordProblems = 0;
  let spanish = 0;
  for (const { html } of pages()) {
    for (const m of html.matchAll(
      /<p class="problem-stem"><span class="lang-en">(.*?)<\/span><span class="lang-es" lang="es">(.*?)<\/span>/gs,
    )) {
      stems++;
      const en = decode(m[1]);
      const es = decode(m[2]);
      const r = threeReads(en);
      if (!r) continue;
      wordProblems++;
      for (const [text, reads] of [
        [en, r],
        [es, threeReads(es, { force: true })],
      ]) {
        if (!reads) continue;
        if (text === es) spanish++;
        /* Read 2 is the stem itself, every character, in order. */
        assert.equal(
          reads.numbers.map((s) => s.num ?? s.text).join(""),
          text,
          `read 2 changed: ${text}`,
        );
        /* Read 1 prints no quantity and nothing the stem does not say. */
        const story = reads.story.filter((s) => !s.blank).map((s) => s.text.replace(/ …$/, ""));
        for (const piece of story)
          assert.ok(text.includes(piece.trim()), `read 1 invented text: ${piece}`);
        assert.deepEqual(quantities(story.join(" ")), [], `read 1 shows a quantity: ${text}`);
        /* Read 3 is a sentence of the stem. */
        if (reads.question)
          assert.ok(text.includes(reads.question), `read 3 is not in the stem: ${text}`);
      }
    }
  }
  console.log(
    `  three reads: ${wordProblems} word problems of ${stems} stems; ${spanish} Spanish reads`,
  );
  assert.ok(stems > 2000, `swept only ${stems} stems`);
  assert.ok(
    wordProblems > 500,
    `only ${wordProblems} word problems found; the detector stopped firing`,
  );
  assert.ok(
    wordProblems < stems * 0.6,
    `${wordProblems} of ${stems} called word problems; the detector is too loose`,
  );
});

/* ── Cognates ──────────────────────────────────────────────────────── */

test("word twins are recognised through the usual Spanish spelling changes", () => {
  for (const [en, es] of [
    ["Equivalent", "Equivalente"],
    ["Equation", "Ecuación"],
    ["Simplify", "Simplificar"],
    ["strategy", "estrategia"],
    ["quantity", "cantidad"],
    ["volume", "volumen"],
    ["Evaluate", "Evaluar"],
    ["Trapezoid", "Trapecio"],
    ["Commutative Property", "Propiedad conmutativa"],
    ["Prime factorization", "Factorización prima"],
    ["Quotient", "Cociente"],
    ["Quadrant", "Cuadrante"],
  ])
    assert.ok(cognate(en, es).twin, `${en} / ${es} should be twins`);
});

test("words that only look alike, or do not look alike, are never called twins", () => {
  for (const [en, es] of [
    ["Ratio", "Razón"],
    ["Rate", "Tasa"],
    ["Mean", "Media"],
    ["Survey", "Encuesta"],
    ["Isolate", "Despejar"],
    ["counterexample", "contraejemplo"],
    ["large", "largo"],
    ["actual", "actual"],
    ["record", "récord"],
    [
      "Divide Multi-Digit Numbers Using an Algorithm",
      "Dividir números de varias cifras con un algoritmo",
    ],
  ])
    assert.equal(cognate(en, es).twin, false, `${en} / ${es} must not be twins`);
});

test("shared letters line up the two spellings", () => {
  const lit = (a, b) =>
    [...a].map((c, i) => (sharedLetters(a, b)[i] ? c.toUpperCase() : c)).join("");
  assert.equal(lit("equivalente", "equivalent"), "EQUIVALENTe");
  assert.equal(lit("área", "area"), "ÁREA");
});

test("sweep: every vocabulary pair on every page is judged, and twins share their first letters", () => {
  const seen = new Map();
  for (const { html } of pages()) {
    const m = html.match(/window\.__HW_VOCAB__ = (\[.*?\]);\n/s);
    if (!m) continue;
    for (const v of JSON.parse(m[1])) if (v.term && v.termEs) seen.set(`${v.term}|${v.termEs}`, v);
  }
  let twins = 0;
  for (const key of seen.keys()) {
    const [en, es] = key.split("|");
    const c = cognate(en, es);
    if (!c.twin) continue;
    twins++;
    for (const [a, b, score] of c.pairs) assert.ok(score >= 0.72, `${a}/${b} scored ${score}`);
  }
  console.log(`  word twins: ${twins} of ${seen.size} vocabulary pairs`);
  assert.ok(seen.size > 300, `swept only ${seen.size} pairs`);
  assert.ok(twins > 100 && twins < seen.size * 0.6, `${twins} twins of ${seen.size}: detector off`);
});

/* ── The DOM layer on a real page ──────────────────────────────────── */

test("on a real page: the card mounts on Discover, the match game works, Read it 3 ways opens and closes", async () => {
  const html = readFileSync(lessonPath("6-6", "homework.html"), "utf8");
  const vocab = JSON.parse(html.match(/window\.__HW_VOCAB__ = (\[.*?\]);\n/s)[1]);
  const body = html
    .slice(html.indexOf("<body"), html.lastIndexOf("</body>"))
    .replace(/<script[\s\S]*?<\/script>/g, "");
  const dom = new JSDOM(`<!doctype html><html><head></head>${body}</body></html>`, {
    url: "http://localhost/lessons/6-6/homework.html",
  });
  const g = globalThis;
  const prev = { window: g.window, document: g.document, HTMLElement: g.HTMLElement };
  g.window = dom.window;
  g.document = dom.window.document;
  g.HTMLElement = dom.window.HTMLElement;
  dom.window.__HW_VOCAB__ = vocab;
  dom.window.LESSON_ID = "6-6";
  dom.window.matchMedia = () => ({ matches: true });
  try {
    const m = await import("../assets/family-studio/language-bridge.mjs");
    const card = m.mountWordBridge();
    assert.ok(card, "card mounted");
    assert.equal(m.mountWordBridge(), null, "idempotent");
    const doc = dom.window.document;
    assert.ok(
      card.nextElementSibling.classList.contains("fp-optional-group"),
      "sits before the optional extras",
    );
    assert.match(
      card.querySelector(".wb-title .lang-en").textContent,
      /^\d+ of tonight's 9 math words are word twins$/,
    );
    /* Always-visible Spanish words must not carry lang="es": the page's English mode hides [lang="es"]. */
    assert.equal(card.querySelectorAll('.wb-pairs [lang="es"]:not(.lang-es)').length, 0);
    assert.ok(card.querySelector(".wb-word--es b"), "shared letters are lit");

    const play = card.querySelector(".wb-play");
    play.open = true;
    play.dispatchEvent(new dom.window.Event("toggle"));
    const tiles = card.querySelectorAll(".wb-tile[data-wb-en]");
    assert.ok(tiles.length >= 3);
    const say = card.querySelector(".wb-match__say");
    tiles[0].click();
    card.querySelector('.wb-tile[data-wb-es="1"]').click();
    assert.match(say.textContent, /Not twins/);
    assert.equal(card.querySelectorAll(".is-matched").length, 0, "a miss locks nothing");
    for (let i = 0; i < tiles.length; i++) {
      tiles[i].click();
      card.querySelector(`.wb-tile[data-wb-es="${i}"]`).click();
    }
    assert.equal(card.querySelectorAll(".is-matched").length, tiles.length * 2);
    assert.match(say.textContent, /All \d+ twins matched/);
    assert.ok(!card.querySelector(".wb-again").hidden, "Play again offered");

    const added = m.decorateThreeReads();
    assert.equal(m.decorateThreeReads(), 0, "idempotent");
    assert.ok(added >= 1, "6-6 has word problems");
    const sec = doc.querySelector(".problem-section:has(.lb-open)");
    const open = sec.querySelector(".lb-open");
    open.click();
    const panel = sec.querySelector(".lb-reads");
    assert.equal(open.getAttribute("aria-expanded"), "true");
    assert.ok(panel.querySelector(".lb-blank"), "read 1 hides numbers");
    panel.querySelector('[data-lb="next"]').click();
    const chip = panel.querySelector(".lb-card__text .lang-en .lb-num");
    chip.click();
    assert.equal(chip.getAttribute("aria-pressed"), "true");
    panel.querySelector('[data-lb="next"]').click();
    assert.ok(panel.querySelector(".lb-question"), "read 3 shows the question");
    panel.querySelector('[data-lb="next"]').click();
    assert.ok(panel.hidden, "Start solving closes the reads");
    assert.equal(open.getAttribute("aria-expanded"), "false");
  } finally {
    Object.assign(g, prev);
  }
});
