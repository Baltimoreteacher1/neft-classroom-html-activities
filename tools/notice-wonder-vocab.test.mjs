/* ==========================================================================
 * notice-wonder-vocab.test.mjs — pins two regressions that both shipped
 * silently because nothing rendered the surface they broke.
 *
 * 1. NOTICE & WONDER printed `noticeAndWonder.context` as a visible paragraph
 *    directly above the image. Students were told what the picture showed
 *    before they looked at it — on lesson 6-2, "Agent Reyes has 5/6 pound of
 *    fingerprint powder… each tube holds 1/12 pound" sat over the very bar
 *    model they were being asked to notice. The SAME field was also used as the
 *    image's alt text, so the authored, purpose-written `imageAlt` — present on
 *    all 84 core lessons — was never read by anything. Removing the caption
 *    without fixing the alt would have downgraded the accessible name.
 *
 * 2. ACADEMIC VOCABULARY had no student-facing surface inside the lesson. The
 *    graded "Vocabulary" phase was removed in 2f5b382fd because a separate
 *    Vocab Explorer tab covered it; `config.vocabulary` stayed in every config
 *    and kept feeding term underlining, glossary popups, teacher mode and the
 *    small-group surfaces, so every data-level check stayed green while the
 *    words themselves were invisible to students.
 *
 * The shape of both bugs is the same: authored data that no longer reaches the
 * page. So these tests assert what RENDERS (in jsdom, from the real module),
 * not that a field exists in a config — a data-presence check would have passed
 * throughout both regressions.
 *
 * Counting is deliberately avoided as a quality proxy: nothing here asserts a
 * term count, only that every term a lesson authors reaches the card with the
 * bilingual fields the localisation architecture already guarantees.
 * ========================================================================== */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Event = dom.window.Event;

const {
  noticeWonderCaption,
  noticeWonderImageAlt,
  renderAcademicVocabulary,
  renderableVocabulary,
} = await import("@eduwonderlab/engine/core/academic-vocabulary.js");

const mount = () => {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
};

// ── 1. Notice & Wonder: accessibility text must not become a visible caption ──
{
  const nw = {
    image: "/lessons/6-2/reveal-assets/notice-wonder.svg",
    context: "Agent Reyes has 5/6 pound of fingerprint powder. Each tube holds 1/12 pound.",
    imageAlt: "A bar model of five sixths of a pound of powder poured into tubes.",
  };

  assert.equal(
    noticeWonderCaption(nw),
    null,
    "a lesson that authors only `context` must render NO visible caption — that text " +
      "answers the noticing before the student looks at the image",
  );

  assert.equal(
    noticeWonderImageAlt(nw),
    nw.imageAlt,
    "the image's accessible name must come from the authored `imageAlt`, not `context`",
  );
  assert.notEqual(
    noticeWonderImageAlt(nw),
    nw.context,
    "alt text must not fall back to the framing prose while a written `imageAlt` exists",
  );
}

// An instructional Notice & Wonder image always gets a usable accessible name.
// These are never decorative, so the resolver must never produce "".
{
  assert.equal(
    noticeWonderImageAlt({ image: "/x.svg", context: "Two tape diagrams." }, {}),
    "Two tape diagrams.",
    "with no imageAlt, `context` is a better accessible name than nothing",
  );
  assert.equal(
    noticeWonderImageAlt({ image: "/x.svg" }, { title: "Compare Ratios" }),
    "Compare Ratios",
    "with neither field, fall back to the lesson title",
  );
  assert.equal(
    noticeWonderImageAlt({ image: "/x.svg" }, {}),
    "Notice and Wonder data display",
    "the last resort is still a real accessible name, never an empty one",
  );
  for (const blank of [{ imageAlt: "   ", context: "  " }, { imageAlt: "" }, {}]) {
    assert.ok(
      String(noticeWonderImageAlt(blank, {}) || "").trim().length > 0,
      "whitespace-only authored text must not resolve to an empty accessible name",
    );
  }
}

// ── 2. A visible caption appears ONLY when a lesson intentionally enables it ──
{
  const withDormantCaption = {
    context: "Concert setup.",
    caption: "Concert setup: a $150 base venue fee plus $12 for each speaker rented.",
  };
  assert.equal(
    noticeWonderCaption(withDormantCaption),
    null,
    "a `caption` that is merely PRESENT must stay hidden — 6-4 and its two small-group " +
      "variants carry one that restates the problem's numbers, so rendering on presence " +
      "alone would newly give the math away on exactly the lessons this fix is for",
  );

  assert.equal(
    noticeWonderCaption({ ...withDormantCaption, showCaption: true }),
    withDormantCaption.caption,
    "an explicit opt-in renders the authored caption",
  );
  assert.equal(
    noticeWonderCaption({ context: "A ferris wheel.", showCaption: true }),
    "A ferris wheel.",
    "opting in without a `caption` falls back to `context`",
  );
  for (const truthy of ["true", 1, {}]) {
    assert.equal(
      noticeWonderCaption({ context: "x", showCaption: truthy }),
      null,
      "the opt-in is strictly `true` — a truthy stray value must not switch captions on",
    );
  }
  assert.equal(noticeWonderCaption(null), null, "no notice/wonder block renders no caption");
  assert.equal(
    noticeWonderCaption({ showCaption: true, caption: "   " }),
    null,
    "opting in with blank text renders nothing rather than an empty caption element",
  );
}

// ── 3. Academic Vocabulary actually renders into the interactive surface ─────
{
  const config = {
    title: "Divide Fractions",
    vocabulary: [
      {
        term: "Dividend",
        termEs: "Dividendo",
        definition:
          "The total number being divided into equal groups (the number inside the division bracket).",
        definitionEs: "El número que estás repartiendo.",
      },
      {
        term: "Divisor",
        termEs: "Divisor",
        definition:
          "The number of equal groups you are dividing into (the number outside the division bracket).",
        definitionEs: "El número entre el que divides.",
      },
    ],
  };

  const host = mount();
  let wired = null;
  const card = renderAcademicVocabulary(host, config, {
    wirePopups: (el, vocab) => {
      wired = { el, vocab };
    },
  });

  assert.ok(card, "a lesson with vocabulary must render the card");
  assert.equal(host.querySelectorAll(".av-card").length, 1, "exactly one vocabulary block");

  const heading = card.querySelector(".av-title");
  assert.ok(heading, "the section needs a real heading element, not styled text");
  assert.equal(heading.tagName, "H3", "the heading must be semantic");
  assert.match(heading.textContent, /Academic Vocabulary/);

  // term → meaning conveyed structurally, not by layout alone
  const dts = [...card.querySelectorAll("dl.av-list dt")];
  const dds = [...card.querySelectorAll("dl.av-list dd")];
  assert.equal(dts.length, config.vocabulary.length, "one <dt> per authored term");
  assert.equal(dds.length, dts.length, "every term has a paired <dd> meaning");

  // Every authored term reaches the page, in order, with its meaning legible —
  // no modal required to read the basics.
  assert.deepEqual(
    dts.map((dt) => dt.querySelector(".obj-term").textContent.trim()),
    config.vocabulary.map((v) => v.term),
    "the rendered terms must be the lesson's own authored vocabulary, in order",
  );
  assert.deepEqual(
    dds.map((dd) => dd.firstChild.textContent.trim()),
    config.vocabulary.map((v) => v.definition),
    "each meaning must be visible on the page, not hidden behind a click",
  );

  // Bilingual parity through the existing localisation fields. Read through a
  // helper that reports a MISSING element by name instead of throwing a bare
  // "cannot read properties of null" — dropping the Spanish span is the most
  // likely way this regresses, and the failure has to say so.
  const textIn = (root, selector) => {
    const el = root.querySelector(selector);
    assert.ok(
      el,
      `expected ${selector} to be rendered — Spanish support was dropped from the card`,
    );
    return el.textContent.trim();
  };
  assert.deepEqual(
    dts.map((dt) => textIn(dt, '.av-term-es[lang="es"]')),
    config.vocabulary.map((v) => v.termEs),
    "Spanish terms must render, marked lang=es so a screen reader switches voice",
  );
  assert.deepEqual(
    dds.map((dd) => textIn(dd, '.av-def-es[lang="es"]')),
    config.vocabulary.map((v) => v.definitionEs),
    "Spanish definitions must render — a translated heading over English terms is " +
      "worse than no Spanish at all",
  );

  // Keyboard-reachable, and wired to the SHARED glossary popup rather than a
  // second popup system.
  const buttons = [...card.querySelectorAll(".obj-term")];
  assert.ok(
    buttons.every((b) => b.tagName === "BUTTON" && b.type === "button"),
    "terms must be real buttons so they are keyboard reachable",
  );
  assert.ok(
    buttons.every((b) => b.getAttribute("aria-haspopup") === "dialog"),
    "each term must announce that it opens a dialog",
  );
  assert.equal(wired.el, card, "the card must be wired to the shared objective-term popup");
  assert.deepEqual(
    wired.vocab,
    config.vocabulary,
    "the popup must be indexed against the same array the buttons were numbered from, " +
      "or a tap opens the wrong word's definition",
  );
  assert.deepEqual(
    buttons.map((b) => Number(b.dataset.termIdx)),
    config.vocabulary.map((_, i) => i),
    "term indices must line up with that array",
  );
}

// Escaping: a term or meaning containing markup must not become live HTML.
{
  const host = mount();
  renderAcademicVocabulary(
    host,
    { vocabulary: [{ term: "<img src=x onerror=1>", definition: "a & b < c" }] },
    {},
  );
  assert.equal(host.querySelectorAll("img").length, 0, "authored text must be escaped");
  assert.match(host.querySelector(".av-def").textContent, /a & b < c/);
}

// Strict no-op: no vocabulary, no card, no empty container left behind.
{
  for (const cfg of [{}, { vocabulary: [] }, { vocabulary: null }]) {
    const host = mount();
    assert.equal(renderAcademicVocabulary(host, cfg, {}), null);
    assert.equal(host.children.length, 0, "a lesson without vocabulary renders nothing at all");
  }
  // Half-authored entries are skipped rather than rendered blank.
  const host = mount();
  renderAcademicVocabulary(
    host,
    {
      vocabulary: [{ term: "Ratio" }, { definition: "no term" }, { term: "Rate", definition: "d" }],
    },
    {},
  );
  assert.equal(
    host.querySelectorAll(".av-item").length,
    1,
    "an entry missing a term or a meaning must be skipped, not rendered empty",
  );
}

// ── 4. Fleet: every core lesson still carries a usable source for both ───────
// Data-level, and deliberately the WEAKER half of this file: these fields were
// intact throughout both regressions. They are pinned so a future content pass
// cannot quietly remove the source the rendering tests above depend on.
{
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data/curriculum-manifest.json"), "utf8"),
  );
  const lessons = Array.isArray(manifest.lessons)
    ? manifest.lessons
    : Object.values(manifest.lessons);
  assert.ok(lessons.length > 0, "the curriculum manifest must list the core lessons");

  const problems = [];
  for (const { id } of lessons) {
    const file = path.join(ROOT, "lessons", id, "config.json");
    if (!fs.existsSync(file)) {
      problems.push(`${id}: no config.json`);
      continue;
    }
    const config = JSON.parse(fs.readFileSync(file, "utf8"));

    const vocab = renderableVocabulary(config);
    if (!vocab.length) problems.push(`${id}: no renderable Academic Vocabulary source`);
    for (const v of vocab) {
      if (!String(v.termEs || "").trim()) problems.push(`${id}: "${v.term}" has no Spanish term`);
      if (!String(v.definitionEs || "").trim()) {
        problems.push(`${id}: "${v.term}" has no Spanish definition`);
      }
    }

    const nw = config.noticeAndWonder;
    if (nw && typeof nw === "object" && nw.image) {
      // Instructional image — it needs a real alternative text of its own.
      if (!String(nw.imageAlt || "").trim()) {
        problems.push(`${id}: Notice & Wonder image has no authored imageAlt`);
      } else if (String(nw.imageAlt).trim() === String(nw.context || "").trim()) {
        // Identical strings are the signature of the original bug: one field
        // doing duty as both the caption and the accessible description.
        problems.push(`${id}: imageAlt merely repeats context — write a real image description`);
      }
      if (noticeWonderCaption(nw) !== null && nw.showCaption !== true) {
        problems.push(`${id}: renders a visible caption without opting in`);
      }
    }
  }
  assert.deepEqual(
    problems,
    [],
    `fleet vocabulary / notice-and-wonder sources:\n${problems.join("\n")}`,
  );
}

console.log("notice-wonder-vocab.test.mjs — all assertions passed");
