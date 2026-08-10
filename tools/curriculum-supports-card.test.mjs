#!/usr/bin/env node
/* =============================================================================
 * curriculum-supports-card.test.mjs — JSDOM tests for the Learning Supports
 * card on /curriculum (assets/curriculum-supports-identity.js).
 *
 * The card is the only entry point students and teachers have into the supports
 * layer, so the tests here guard the two things that would make it useless
 * again rather than merely ugly:
 *
 *   1. STATE — the right card for the right person. An empty roster must show a
 *      student nothing (never nag) while showing a teacher the one-click path
 *      to setup; that missing teacher state is exactly why the feature shipped
 *      live and invisible.
 *   2. LANGUAGE — no student-facing string may carry IEP / WIDA / assessment
 *      framing. The schema's own labels ARE the district document lines
 *      ("Text to Speech for the ELA/Literacy Assessments…"), so a card that
 *      naively printed schema labels would put a student's IEP on screen.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const IDENTITY_SRC = readFileSync(join(ROOT, "assets", "shared-identity.js"), "utf8");
const SCHEMA_SRC = readFileSync(
  join(ROOT, "assets", "learning-supports", "supports-schema.js"),
  "utf8",
);
const CARD_SRC = readFileSync(join(ROOT, "assets", "curriculum-supports-identity.js"), "utf8");
const API_SRC = readFileSync(join(ROOT, "functions", "api", "supports", "[[path]].js"), "utf8");

const HUB = `<!doctype html><html><body>
  <header id="curriculum-start">
    <h1>Curriculum Hub</h1>
    <p class="curriculum-guide__lede">Every lesson for Grade 6 math.</p>
    <nav class="curriculum-guide__actions"><a href="#interactive-hub">Explore by unit</a></nav>
  </header>
  <main>
    <a href="/lessons/6-13/">Ratios and Rates</a>
    <a href="/lessons/3-3/">Dividing Fractions</a>
  </main>
</body></html>`;

/*
 * Boot the card against a stubbed /api/supports. `sections` shapes the roster,
 * `forItems` / `forLessons` shape what the claimed student resolves to.
 */
async function boot({
  sections = {},
  forItems = [],
  forLessons = [],
  teacher = false,
  identity = null,
  unitsData = null,
  url = "https://example.com/curriculum/",
} = {}) {
  const dom = new JSDOM(HUB, { url, runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;

  if (teacher) w.document.body.classList.add("teacher-mode");
  if (unitsData) w.CurriculumHub = { unitsData };

  w.fetch = (path) => {
    const body = String(path).includes("/for?")
      ? { ok: true, items: forItems, lessons: forLessons }
      : { ok: true, sections };
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
  };

  w.eval(SCHEMA_SRC);
  w.eval(IDENTITY_SRC);
  if (identity) w.NTIdentity.set(identity);
  w.eval(CARD_SRC);

  // boot() is async (two awaited fetches, each resolving on its own turn); let
  // the task queue drain, not just the microtask queue.
  for (let i = 0; i < 10; i += 1) await new Promise((r) => setTimeout(r, 0));
  return w;
}

const card = (w) => w.document.getElementById("nt-supports-card");
const text = (w) => (card(w) ? card(w).textContent : "");

const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

// ---- state: the right card for the right person ----------------------------

test("empty roster + student -> renders NOTHING (never nag a student)", async () => {
  const w = await boot({ sections: {} });
  assert.equal(card(w), null);
});

test("empty roster + teacher -> the setup card, with the manager one click away", async () => {
  const w = await boot({ sections: {}, teacher: true });
  assert.ok(card(w), "a teacher must always find the way in");
  assert.ok(card(w).classList.contains("is-setup"));
  const cta = card(w).querySelector("a.nt-sup-btn");
  assert.equal(cta.getAttribute("href"), "/teacher-tools/learning-supports-manager/");
  assert.equal(
    card(w).querySelector(".nt-sup-card__teacher"),
    null,
    "the setup card IS the teacher strip — do not print 'Manage students' twice",
  );
});

test("roster + nobody claimed -> the claim card with a real button", async () => {
  const w = await boot({ sections: { 601: ["JN", "AB"] } });
  assert.ok(card(w).classList.contains("is-claim"));
  assert.match(text(w), /Who's working today\?/);
  assert.ok(card(w).querySelector("button.nt-sup-btn"), "claiming must be a tap, not a hunt");
});

test("the card mounts ABOVE the fold, not below the whole header", async () => {
  // Mounting after the header put the card ~800px down the page, which is how
  // the previous chip went unnoticed. It belongs inside the header, directly
  // above the Teach / Plan / Explore row.
  const w = await boot({ sections: { 601: ["JN"] } });
  const c = card(w);
  assert.equal(c.parentElement.id, "curriculum-start");
  assert.ok(c.nextElementSibling.classList.contains("curriculum-guide__actions"));
});

test("claimed -> the ready card names the student and their tools", async () => {
  const w = await boot({
    sections: { 601: ["JN"] },
    identity: { section: "601", initials: "JN" },
    forItems: ["tts", "calculator", "esol-word-bank"],
  });
  assert.ok(card(w).classList.contains("is-ready"));
  assert.match(text(w), /You're all set, JN/);
  const chips = [...card(w).querySelectorAll(".nt-sup-tool")].map((n) => n.textContent);
  assert.deepEqual(chips, ["Read aloud", "Calculator", "Word help"]);
});

test("six roster lines that mean 'read aloud' collapse to ONE chip", async () => {
  const w = await boot({
    sections: { 601: ["JN"] },
    identity: { section: "601", initials: "JN" },
    forItems: ["tts", "iep-tts", "esol-read-aloud-selected"],
  });
  const chips = [...card(w).querySelectorAll(".nt-sup-tool")].map((n) => n.textContent);
  assert.deepEqual(chips, ["Read aloud"], "the student has one Read aloud button, not three");
});

test("teacher planning flags are never advertised to the student as tools", async () => {
  const w = await boot({
    sections: { 601: ["JN"] },
    identity: { section: "601", initials: "JN" },
    // preferential seating / small group are real roster lines with NO student
    // control behind them; printing them would promise a button that isn't there
    forItems: ["iep-preferential-seating", "iep-small-group", "calculator"],
  });
  const chips = [...card(w).querySelectorAll(".nt-sup-tool")].map((n) => n.textContent);
  assert.deepEqual(chips, ["Calculator"]);
});

test("assigned lessons are titled from the hub's data, not its anchor labels", async () => {
  // Every lesson anchor on the hub is labelled by RESOURCE ("Interactive
  // Lesson"), so a DOM-first title would print the same meaningless string for
  // every picked lesson. The standard code is dropped — it means nothing to a
  // student.
  const w = await boot({
    sections: { 601: ["JN"] },
    identity: { section: "601", initials: "JN" },
    forLessons: ["3-2"],
    unitsData: [
      {
        lessons: [{ lessonId: "3-2", title: "Lesson 3-2 · Dividing Fractions 6.NOS.1" }],
      },
    ],
  });
  const links = [...card(w).querySelectorAll(".nt-sup-picked__link")];
  assert.equal(links.length, 1);
  assert.equal(links[0].textContent, "Lesson 3-2 · Dividing Fractions");
  assert.match(links[0].getAttribute("href"), /^\/lessons\/3-2\//);
});

test("an assigned lesson the hub data does not know still gets a usable name", async () => {
  const w = await boot({
    sections: { 601: ["JN"] },
    identity: { section: "601", initials: "JN" },
    forLessons: ["3-2"],
  });
  const link = card(w).querySelector(".nt-sup-picked__link");
  assert.equal(link.textContent, "Dividing Fractions", "falls back to the anchor label");
});

test("the teacher strip is teacher-only and reports the real roster size", async () => {
  const student = await boot({ sections: { 601: ["JN", "AB"], 602: ["CD"] } });
  assert.equal(student.document.querySelector(".nt-sup-card__teacher"), null);

  const w = await boot({ sections: { 601: ["JN", "AB"], 602: ["CD"] }, teacher: true });
  assert.match(
    w.document.querySelector(".nt-sup-card__teacher").textContent,
    /3 students · 2 classes/,
  );
});

test("?student=1 forces the student view even with Teacher Mode stored", async () => {
  const w = await boot({
    sections: {},
    url: "https://example.com/curriculum/?student=1",
  });
  w.localStorage.setItem("nt-teacher-mode", "1");
  assert.equal(card(w), null, "a student link must never leak the teacher strip");
});

// ---- language: nothing on the card may carry IEP framing --------------------

test("no student-facing string carries IEP / WIDA / assessment framing", async () => {
  const w = await boot({
    sections: { 601: ["JN"] },
    identity: { section: "601", initials: "JN" },
    // everything the API can possibly resolve, at once
    forItems: [...w0AllKeys()],
  });
  const chips = card(w).querySelectorAll(".nt-sup-tool").length;
  assert.ok(chips > 10, `only ${chips} chips rendered — this gate would pass vacuously`);
  const rendered = text(w);
  for (const banned of [/\bIEP\b/, /\bWIDA\b/, /\bESOL\b/i, /Assessment/i, /disabilit/i]) {
    assert.doesNotMatch(rendered, banned, `card text leaked: ${banned}`);
  }
});

test("every support a student can actually feel is named on the card", async () => {
  /*
   * Behavioural, not a source grep: an interactive or adaptive item that the
   * card cannot name would silently vanish from the chip list — the student
   * would be told nothing turned on while the lesson dock quietly handed them
   * the button. Driven through the real render path, one key at a time, so a
   * new schema item fails here the day it is added.
   */
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    runScripts: "outside-only",
  });
  dom.window.eval(SCHEMA_SRC);
  const felt = dom.window.EWLSupportsSchema.allItems.filter(
    (i) => i.apply === "interactive" || i.apply === "adaptive",
  );
  assert.ok(felt.length > 30, "schema went empty — this gate would pass vacuously");

  const unnamed = [];
  for (const item of felt) {
    const w = await boot({
      sections: { 601: ["JN"] },
      identity: { section: "601", initials: "JN" },
      forItems: [item.key],
    });
    if (!w.document.querySelector(".nt-sup-tool")) unnamed.push(item.key);
  }
  assert.deepEqual(unnamed, [], "supports with no plain-language name");
});

// Every key the public /for endpoint can return, taken from the API allow-list
// so this test cannot drift from what a student can actually be assigned.
function w0AllKeys() {
  const block = API_SRC.slice(API_SRC.indexOf("const ALLOW_LIST"));
  return [...block.slice(0, block.indexOf("];")).matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);
}

// ---- runner -----------------------------------------------------------------

let failed = 0;
for (const [name, fn] of tests) {
  try {
    await fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL  ${name}\n        ${err.message}`);
  }
}
console.log(`\ncurriculum-supports-card: ${tests.length - failed}/${tests.length} passed.`);
process.exit(failed > 0 ? 1 : 0);
