// The Case File card on every family homework page, and its authored extras.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import {
  buildUpFacts,
  EXTRAS_DIR,
  loadExtras,
  pickEvidence,
  validateExtras,
} from "../scripts/lib/homework-case-file.mjs";
import { lessonPath, listLessonDirs, loadLessonConfig } from "./lib/curriculum-source.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const lessonIds = listLessonDirs().filter((id) => existsSync(lessonPath(id, "homework.html")));

test("build-up facts are derived, never typed", () => {
  assert.deepEqual(buildUpFacts({ part: 42, pct: 60 }), { blocks: 6, per: 7, whole: 70, steps: 4 });
  assert.deepEqual(buildUpFacts({ part: 15, pct: 30 }), { blocks: 3, per: 5, whole: 50, steps: 7 });
});

test("authored extras are refused when their arithmetic cannot work", () => {
  assert.ok(
    validateExtras({ buildUp: { part: 42, pct: 65 } }).length,
    "65% is not whole 10% blocks",
  );
  assert.ok(
    validateExtras({ buildUp: { part: 43, pct: 60 } }).length,
    "43 does not split into 6 blocks",
  );
  assert.ok(validateExtras({ buildUp: { part: 42, pct: 100 } }).length, "100% is the whole");
  assert.deepEqual(validateExtras({ buildUp: { part: 42, pct: 60 } }), []);
  const two = { en: "a", es: "a", say: { en: "a", es: "a" } };
  assert.ok(
    validateExtras({
      hunch: {
        options: [
          { ...two, right: true },
          { ...two, right: true },
        ],
      },
    }).length,
  );
  assert.ok(validateExtras({ hunch: { options: [{ ...two, right: false }] } }).length);
});

test("every authored extras file is valid", () => {
  for (const f of readdirSync(EXTRAS_DIR).filter((n) => n.endsWith(".json"))) {
    const id = f.replace(/\.json$/, "");
    assert.deepEqual(validateExtras(loadExtras(id)), [], `${f}`);
    assert.ok(lessonIds.includes(id), `${f} names a lesson with no homework page`);
  }
});

test("clues never repeat the lesson title or each other, but keep one-word terms", () => {
  const v = (t) => ({ term: t, definition: "x" });
  assert.deepEqual(
    pickEvidence(
      [v("Write Algebraic Expressions"), v("Variable"), v("Algebraic Expression"), v("Evaluate")],
      "Write and Evaluate Algebraic Expressions",
    ).map((x) => x.term),
    ["Variable", "Evaluate"],
  );
  assert.deepEqual(
    pickEvidence(
      [
        v("Determine the Whole Given the Part and Percent"),
        v("Part"),
        v("Whole"),
        v("Double number line"),
        v("Equation"),
      ],
      "Determine the Whole Given the Part and Percent",
    ).map((x) => x.term),
    ["Part", "Whole", "Double number line"],
  );
});

test("all homework pages carry one bilingual Case File that opens the Learn stop", () => {
  assert.ok(lessonIds.length >= 160, `found ${lessonIds.length} homework pages`);
  const bad = [];
  for (const id of lessonIds) {
    const html = readFileSync(lessonPath(id, "homework.html"), "utf8");
    // Parse only the card: a whole page is ~700KB and 166 of them exhaust the heap.
    const start = html.indexOf('<section class="cf"');
    const count = html.split('id="hw_case"').length - 1;
    if (count !== 1 || start < 0) {
      bad.push(`${id}: ${count} case files`);
      continue;
    }
    if (!/data-tab-panel="learn"[^>]*>\s*<section class="cf"/.test(html))
      bad.push(`${id}: case file is not first in Learn`);
    const card = new JSDOM(
      html.slice(start, html.indexOf("</section>", start) + 10),
    ).window.document.querySelector(".cf");
    if (!card.querySelector("h2 .lang-en") || !card.querySelector("h2 .lang-es"))
      bad.push(`${id}: title not bilingual`);
    if (!card.querySelector(".cf-case .lang-en") || !card.querySelector(".cf-case .lang-es"))
      bad.push(`${id}: "your case" not bilingual`);
    const clues = card.querySelectorAll("[data-cf-ev]");
    if (!clues.length && !card.querySelector("[data-cf-hunch]"))
      bad.push(`${id}: right column would be empty`);
    if (clues.length > 3) bad.push(`${id}: ${clues.length} clues`);
    for (const c of clues) {
      if (c.getAttribute("aria-expanded") !== "false") bad.push(`${id}: a clue starts open`);
      if (!c.querySelector(".cf-ev-def .lang-es")) bad.push(`${id}: a clue lacks Spanish`);
    }
    if (/\b(timer|countdown|beat the clock|streak)\b/i.test(card.textContent))
      bad.push(`${id}: timer language`);
    const cfg = loadLessonConfig(id);
    const wantsScene = /^\d+-\d+$/.test(id) && Boolean(cfg.launch?.conceptIntro?.iDo?.lines?.[0]);
    if (wantsScene !== Boolean(card.querySelector(".cf-scene")))
      bad.push(`${id}: scene ${wantsScene ? "missing" : "invented"}`);
    const lab = card.querySelector("[data-cf-lab]");
    if (lab) {
      const d = JSON.parse(lab.getAttribute("data-cf-lab"));
      // Independent of buildUpFacts: whole = part / (pct / 100).
      if (Math.abs(d.part / (d.pct / 100) - d.whole) > 1e-9) bad.push(`${id}: lab whole is wrong`);
      if (d.per * d.blocks !== d.part) bad.push(`${id}: lab blocks do not make the part`);
    }
  }
  assert.deepEqual(bad, []);
});

test("the sidebar offers the Case File and the lesson's own sections, and the lightbox covers its graphics", () => {
  const skin = readFileSync(join(ROOT, "scripts/homework-studio-skin.mjs"), "utf8");
  for (const id of ["case", "mystery", "huddle"]) assert.match(skin, new RegExp(`id: '${id}'`));
  assert.match(
    skin,
    /svg\.cf-tag, svg\.cf-line/,
    "the skin's zoom selector must list the Case File graphics",
  );
});
