// small-group-present.test.mjs — teacher-led presenting for a studio.
//
// The highest-stakes assertion in this file is the teacher blackout. The screen
// a teacher turns toward the table must never carry probing questions,
// anticipated wrong answers, or observation evidence — so there is a test that
// FAILS when someone adds a new teacher-only surface without covering it,
// rather than a test that only pins today's five selectors.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const { JSDOM } = await import("jsdom");
const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  url: "https://example.test/lessons/1-1-group1/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;

const { smallGroupBeats, isSmallGroupStudio, clearVeils, injectStyles, TEACHER_ONLY } =
  await import("./small-group-present.js");

const HERE = dirname(fileURLToPath(import.meta.url));

/** A studio skeleton with the same shape the real renderer produces. */
function buildStudio() {
  document.body.className = "";
  document.getElementById("app").innerHTML = `
    <nav class="sg-tabs" role="tablist">
      <button role="tab" id="sg-tab-sg-tab-vocab" aria-controls="sg-tab-vocab">
        <span class="dot">1</span><span class="lbl">Vocabulary<small>The words</small></span>
      </button>
      <button role="tab" id="sg-tab-sg-tab-guided" aria-controls="sg-tab-guided">
        <span class="dot">2</span><span class="lbl">Guided<small>Together</small></span>
      </button>
    </nav>
    <section id="sg-tab-vocab">
      <section class="sg-sec">
        <div class="sg-h"><strong>Unlock the math words</strong></div>
        <div class="sg-vgrid">
          <article class="sg-vcard">alpha</article>
          <article class="sg-vcard">beta</article>
          <article class="sg-vcard">gamma</article>
        </div>
      </section>
      <div class="sg-next">next chrome</div>
    </section>
    <section id="sg-tab-guided">
      <section class="sg-sec">
        <div class="sg-h"><strong>Let’s solve together</strong></div>
        <p class="sg-directions">Write each step.</p>
        <div class="prob">one<div class="sg-lens">teacher probe</div></div>
        <div class="prob">two</div>
        <div class="prob">three</div>
        <div class="sg-problem-nav">
          <button type="button">← Previous</button>
          <span class="sg-problem-count"></span>
          <button type="button">Next problem →</button>
        </div>
      </section>
      <aside class="sg-teacher">ask / look for / if stuck</aside>
    </section>`;

  // Stand in for paginateProblems: the pager owns `hidden`, and this module
  // must drive it only by clicking. Same contract, minus the rendering.
  const section = document.querySelector("#sg-tab-guided .sg-sec");
  const cards = [...section.querySelectorAll(":scope > .prob")];
  const nav = section.querySelector(".sg-problem-nav");
  const [previous, next] = nav.querySelectorAll("button");
  let index = 0;
  const show = (i) => {
    index = Math.max(0, Math.min(cards.length - 1, i));
    cards.forEach((c, ci) => {
      c.hidden = ci !== index;
    });
    previous.disabled = index === 0;
    next.disabled = index === cards.length - 1;
  };
  previous.onclick = () => show(index - 1);
  next.onclick = () => show(index + 1);
  show(0);
  return { cards };
}

// ── beats ────────────────────────────────────────────────────────────────
{
  buildStudio();
  assert.ok(isSmallGroupStudio(), "a tablist marks the page as a studio");

  const beats = smallGroupBeats();
  const titles = beats.map((b) => b.title);

  // One beat per word, one per problem, plus the set-up beat before them.
  assert.equal(beats.length, 7, `3 words + set up + 3 problems, got ${beats.length}: ${titles}`);

  // Labels come from the authored heading, not the tab name, and carry no
  // decorative sub-label ("VocabularyThe words" was the old bug).
  assert.ok(
    titles[0].includes("Unlock the math words") && titles[0].includes("word 1"),
    `authored heading drives the label, got "${titles[0]}"`,
  );
  assert.ok(!titles.some((t) => /The words|Together/.test(t)), `sub-labels stripped: ${titles}`);
  assert.ok(titles[3].includes("set up"), `intro beat before the problems, got "${titles[3]}"`);
  assert.ok(titles[4].includes("problem 1"), `problem beats numbered, got "${titles[4]}"`);

  // Numbering is continuous across tabs — the rail is one sequence, not two.
  titles.forEach((t, i) => assert.ok(t.startsWith(`${i + 1} · `), `beat ${i + 1} numbered: ${t}`));
}

// ── veiling reveals progressively and never touches `hidden` ─────────────
{
  const { cards } = buildStudio();
  const beats = smallGroupBeats();

  beats[0].activate(); // first vocabulary word
  const words = [...document.querySelectorAll(".sg-vcard")];
  assert.ok(!words[0].classList.contains("sgp-veil"), "current word is revealed");
  assert.ok(words[1].classList.contains("sgp-veil"), "later words are veiled");
  assert.ok(
    words.every((w) => !w.hidden),
    "veiling uses a class, never the `hidden` attribute the pager owns",
  );

  beats[2].activate(); // third word
  assert.ok(
    words.every((w) => !w.classList.contains("sgp-veil")),
    "reveal is progressive — earlier words stay up",
  );

  // Problem beats drive the pager rather than veiling.
  beats[6].activate(); // problem 3
  assert.equal(cards.findIndex((c) => !c.hidden), 2, "pager moved to the third problem");
  assert.ok(
    cards.every((c) => !c.classList.contains("sgp-veil")),
    "problems are never veiled — the pager owns their visibility",
  );

  beats[4].activate(); // back to problem 1
  assert.equal(cards.findIndex((c) => !c.hidden), 0, "pager steps backwards too");

  clearVeils();
  assert.equal(document.querySelectorAll(".sgp-veil").length, 0, "clearVeils leaves nothing behind");
}

// ── the teacher blackout ─────────────────────────────────────────────────
{
  buildStudio();
  injectStyles();
  const css = document.getElementById("sgp-styles").textContent;

  // Named here as literals, NOT derived from TEACHER_ONLY. Iterating the
  // module's own constant made this test self-referential: deleting a selector
  // from the blackout also deleted the assertion that checked it, so the test
  // passed while the leak shipped. Caught by mutation-testing this file.
  const MUST_BE_BLACKED_OUT = [
    ".sg-lens", // per-item probing questions for each wrong answer
    ".sg-teacher", // ask / look for / if stuck
    ".sg-misconceptions", // anticipated wrong answers
    ".sg-facilitation", // observation evidence console
    ".ntfr", // facilitation rhythm coach
  ];
  for (const selector of MUST_BE_BLACKED_OUT) {
    assert.ok(
      TEACHER_ONLY.includes(selector),
      `${selector} is still listed in the blackout selector`,
    );
    assert.ok(
      css.includes(`body.nt-present ${selector}`),
      `${selector} is blacked out while presenting`,
    );
  }

  // Gated on body.nt-present, never global: a studio nobody is presenting must
  // still show the teacher their lens.
  for (const line of css.split("\n").filter((l) => l.includes("display:none"))) {
    assert.ok(line.startsWith("body.nt-present"), `blackout is scoped to presenting: ${line}`);
  }

  // The stylesheet is a JS template literal, so a stray backtick anywhere in it
  // — including inside a CSS comment — silently truncates everything after that
  // point. It has happened here once already. Assert the LAST rule survived, so
  // truncation fails loudly instead of shipping a half-applied stylesheet.
  assert.ok(css.includes(".sg-tabs{"), "the stylesheet reaches its final rule (not truncated)");
  assert.ok(!css.includes("`"), "no backticks inside the injected stylesheet");
  for (const chrome of [".ewl-supports-tools-dock", "#nt-present-widget", ".sg-mode"]) {
    assert.ok(css.includes(chrome), `floating chrome ${chrome} is cleared from the projector`);
  }
  assert.ok(css.includes("padding-right"), "room is reserved for the presenter rail");

  // A teacher surface is never itself a beat.
  const beats = smallGroupBeats();
  assert.ok(
    !beats.some((b) => /ask \/ look for/i.test(b.title)),
    "the teacher panel is not offered as a stop",
  );
}

// ── the ratchet: a NEW teacher surface must be covered too ───────────────
//
// Source-level on purpose. The teacher asides mount only in an authenticated
// teacher session, so a DOM test would pass while the real leak shipped. Every
// teacher-only surface in the engine is built with the "Teacher-only ·" kicker
// or an explicit teacher class; this finds them by construction and asserts the
// blackout list covers each one.
{
  const covered = TEACHER_ONLY.split(",").map((s) => s.trim().replace(/^\./, ""));
  const missing = [];
  for (const file of readdirSync(HERE).filter((f) => f.endsWith(".js"))) {
    const src = readFileSync(join(HERE, file), "utf8");
    // el("aside", "sg-foo sg-innovation") / className = "sg-foo ..."
    for (const match of src.matchAll(/el\(\s*"aside"\s*,\s*"([^"]+)"/g)) {
      const classes = match[1].split(/\s+/);
      const isTeacher =
        /Teacher-only/.test(src) &&
        classes.some((c) => /^(sg-teacher|sg-misconceptions|sg-facilitation|ntfr)$/.test(c));
      if (!isTeacher) continue;
      if (!classes.some((c) => covered.includes(c))) missing.push(`${file}: ${match[1]}`);
    }
  }
  assert.deepEqual(
    missing,
    [],
    `teacher-only surfaces missing from the presenting blackout:\n  ${missing.join("\n  ")}`,
  );
}

console.log("small-group-present: all assertions passed");
