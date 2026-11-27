// Create (Project Studio): the Language Page lab adapters for studio tasks, TWR, Talk Table, warm-up, Subject
// Reading, Teach-Back, word parts, Word Lab, Phonics Path, Language Worlds, Real-Life Scenarios, Voice Lab, the
// language builders and the Sentence Lab. For each family: a real address is parsed by the app's own parseRoute,
// resolved by the route registry, extracted, validated, and checked for a known word or question from the source.
// The exhaustive per-item sweep is tools/studio-customize-adapters.test.mjs; this file proves the route wiring and
// spot-checks content fidelity.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fetchJson } from "./studio-customize-adapters-helpers.mjs";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const { capabilityFor } = await import(new URL("src/create/routes.js", LAB));
const { customizeFrom, ADAPTERS } = await import(new URL("src/studio/adapters/registry.js", LAB));
const { availableFormats } = await import(new URL("src/create/build.js", LAB));

/** The app's real parseRoute, lifted from main.js (the module itself touches the DOM when imported). */
function loadParseRoute() {
  const src = readFileSync(new URL("src/main.js", LAB), "utf8");
  const start = src.indexOf("export function parseRoute");
  const end = src.indexOf("\n}\n", start) + 2;
  const body = src.slice(start, end).replace("export function", "function");
  return new Function(
    "BASE",
    "DOMAINS",
    "readMathLanguageBridge",
    "location",
    `${body}; return parseRoute;`,
  )("/access-practice-lab", [], () => null, { pathname: "/", search: "" });
}
const parseRoute = loadParseRoute();
const capAt = (url) => {
  const u = new URL(url, "https://example.test");
  return capabilityFor(parseRoute(u.pathname, u.search), u.search);
};

const questions = (a) => a.blocks.filter((b) => b.type === "question");
const all = (a) => JSON.stringify(a.blocks);

/** [address, expected source, a string from the raw source that must survive into the draft] */
const CASES = [
  [
    "/access-practice-lab/speak/spk-seedlings-retell",
    { family: "studio-task", ref: "spk-seedlings-retell" },
    "How tall were the seedlings in the dark cabinet?",
  ],
  [
    "/access-practice-lab/write/wrt-mulch-cer",
    { family: "studio-task", ref: "wrt-mulch-cer" },
    "410 grams",
  ],
  [
    "/access-practice-lab/twr/summarize/g68-summarize-1",
    { family: "twr", ref: "g68-summarize-1" },
    "Glaciers are slow rivers of ice that carve wide valleys by dragging rocks across the land.",
  ],
  [
    "/access-practice-lab/talk-table/argue?grades=6-8",
    { family: "talk-table", ref: "6-8-argue" },
    "Should phones be allowed in class?",
  ],
  [
    "/access-practice-lab/subject-reading/ecosystems-relationships",
    { family: "subject-reading", ref: "ecosystems-relationships" },
    "How could losing the reeds affect the heron?",
  ],
  [
    "/access-practice-lab/science-of-reading/subject-reading/ecosystems-relationships",
    { family: "subject-reading", ref: "ecosystems-relationships" },
    "organism",
  ],
  [
    "/access-practice-lab/teach-back/area-vs-perimeter",
    { family: "teach-back", ref: "area-vs-perimeter" },
    "perimeter",
  ],
  ["/access-practice-lab/vocabulary?grades=6-8", { family: "word-parts", ref: "6-8" }, "transport"],
  [
    "/access-practice-lab/wordlab/explore/w-abolish",
    { family: "wordlab", ref: "w-abolish" },
    "to officially end a law or practice",
  ],
  [
    "/access-practice-lab/science-of-reading/lesson/cvc-short-a",
    { family: "phonics", ref: "cvc-short-a" },
    "Sam has a map.",
  ],
  [
    "/access-practice-lab/worlds/signal-station/g35-schedule-shift",
    { family: "world-missions", ref: "signal-station-3-5" },
    "Move Tuesday robotics to Room 14; keep Thursday library in Room 8.",
  ],
  [
    "/access-practice-lab/scenarios/s35-late-pass",
    { family: "scenarios", ref: "s35-late-pass" },
    "Good morning, Ms. Rivera. I need a little help, please.",
  ],
  [
    "/access-practice-lab/voice/retell/water-filter",
    { family: "voice-lab", ref: "retell-water-filter" },
    "Which layer took away the bad smell?",
  ],
  [
    "/access-practice-lab/voice/ladder/school-hallway",
    { family: "voice-lab", ref: "ladder-school-hallway" },
    "I see lockers, backpacks, a clock and a water fountain.",
  ],
  [
    "/access-practice-lab/voice/sounds/sh-ch",
    { family: "voice-lab", ref: "sounds-sh-ch" },
    "a big boat",
  ],
  [
    "/access-practice-lab/scaffold/evidence-builder?grades=3-5",
    { family: "scaffold-items", ref: "evidence-builder-3-5" },
    "Our school should have a longer recess.",
  ],
  [
    "/access-practice-lab/sentences/2?grades=3-5",
    { family: "craft-sentences", ref: "3-5-l2" },
    "Subject-verb agreement",
  ],
  [
    "/access-practice-lab/sentences/boss/gboss1",
    { family: "craft-sentences", ref: "gboss1" },
    "It started to rain.",
  ],
];

test("a real address on each page resolves to its own resource, which extracts and validates", async () => {
  for (const [url, source, known] of CASES) {
    const cap = capAt(url);
    assert.equal(cap.disposition, "source", url);
    assert.deepEqual(cap.source, source, url);
    const made = await customizeFrom(source.family, source.ref, {
      fetchJson,
      now: 0,
      newId: () => "s0000000000",
    });
    assert.deepEqual(made.validation.errors, [], `${url}: validation errors`);
    assert.ok(questions(made.activity).length >= 1, `${url}: no questions`);
    assert.ok(all(made.activity).includes(known), `${url}: "${known}" did not survive`);
    assert.ok(availableFormats(made.activity).length >= 2, `${url}: fewer than two formats`);
  }
});

test("authored answer keys are carried, not invented", async () => {
  const key = async (family, ref, id) => {
    const a = (await customizeFrom(family, ref, { fetchJson })).activity;
    return questions(a).find((q) => q.id === id);
  };
  const seedling = await key("studio-task", "spk-seedlings-retell", "c1");
  assert.equal(
    seedling.options.find((o) => o.id === seedling.answer).text,
    "About thirteen centimeters",
  );
  const glacier = await key("twr", "g68-summarize-1", "q1");
  assert.match(
    glacier.options.find((o) => o.id === glacier.answer).text,
    /^Glaciers are slow rivers of ice/,
  );
  const pick = await key("twr", "g68-summarize-1", "q2");
  assert.deepEqual(
    pick.answers.map((id) => pick.options.find((o) => o.id === id).text),
    [
      "Glaciers also leave behind piles of rock when they melt.",
      "The scraping rocks work like sandpaper.",
    ],
  );
  const read = await key("phonics", "cvc-short-a", "read");
  assert.equal(read.options.find((o) => o.id === read.answer).text, "map");
  const turn = await key("scenarios", "s35-late-pass", "t1");
  assert.equal(
    turn.options.find((o) => o.id === turn.answer).text,
    "Good morning, Ms. Rivera. I need a little help, please.",
  );
  const filter = await key("voice-lab", "retell-water-filter", "c2");
  assert.equal(filter.options.find((o) => o.id === filter.answer).text, "The charcoal");
});

test("open speaking and writing stay open: model and criteria are a sample and a self-check, never a key", async () => {
  const a = (await customizeFrom("studio-task", "wrt-mulch-cer", { fetchJson })).activity;
  const task = questions(a).find((q) => q.id === "task");
  assert.equal(task.format, "short");
  assert.match(task.sample, /^I claim that mulch reduces soil erosion/);
  assert.ok(task.rubric.includes("My claim answers the question directly."));
});

test("Spanish is carried where the source has it", async () => {
  const tb = (await customizeFrom("teach-back", "area-vs-perimeter", { fetchJson })).activity;
  assert.equal(tb.blocks.find((b) => b.type === "vocab").items[0].es, "perímetro");
  const twr = (await customizeFrom("twr", "g68-summarize-1", { fetchJson })).activity;
  assert.match(twr.blocks[0].text, /En español: Un resumen es una oración/);
  const tt = (await customizeFrom("talk-table", "6-8-argue", { fetchJson })).activity;
  assert.match(questions(tt)[0].prompt, /¿Se deberían permitir los teléfonos en clase\?/);
});

test("pages without one open resource become hubs; student and builder pages keep their dispositions", () => {
  for (const url of [
    "/access-practice-lab/speak",
    "/access-practice-lab/twr",
    "/access-practice-lab/twr/summarize",
    "/access-practice-lab/talk-table/argue",
    "/access-practice-lab/sor",
    "/access-practice-lab/science-of-reading",
    "/access-practice-lab/voice/read/ra-tides",
    "/access-practice-lab/worlds",
    "/access-practice-lab/wordlab",
    "/access-practice-lab/warmup",
    "/access-practice-lab/road",
    "/access-practice-lab/time-machine",
    "/access-practice-lab/supports",
    "/access-practice-lab/simulator",
  ])
    assert.equal(capAt(url).disposition, "hub", url);
  assert.equal(capAt("/access-practice-lab/task-packs").disposition, "workspace");
  assert.equal(capAt("/access-practice-lab/vocab-sets").disposition, "workspace");
  for (const url of [
    "/access-practice-lab/scenes",
    "/access-practice-lab/skill-arcade",
    "/access-practice-lab/stories",
  ]) {
    const cap = capAt(url);
    assert.equal(cap.disposition, "excluded", url);
    assert.equal(cap.tray, false, url);
  }
  assert.equal(
    capAt("/access-practice-lab/simulations/city-that-stopped-talking").disposition,
    "excluded",
  );
});

test("every family a lab page resolves to is a registered adapter, and a hostile ref is refused", async () => {
  for (const [, source] of CASES) assert.ok(ADAPTERS[source.family], source.family);
  assert.equal(capAt("/access-practice-lab/scenarios/..%2Fx").disposition, "hub");
  for (const [family, ref] of [
    ["twr", "g68-nope-1"],
    ["warmup", "6-8-99"],
    ["voice-lab", "read-ra-tides"],
    ["craft-sentences", "3-5-l9"],
  ])
    await assert.rejects(customizeFrom(family, ref, { fetchJson }), (e) => e.code === "not-found");
});
