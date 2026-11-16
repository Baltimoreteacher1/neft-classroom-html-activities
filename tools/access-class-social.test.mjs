// Class social features on The Language Page: peer listening pairs (/pairs) and student-made scenes (/scenes).
// The server routes are tested in functions/api/class/social.test.mjs; this file covers the shared rules, the
// browser helpers, the views' wiring (router, sitemap, class page, teacher panel hook) and the bilingual copy.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { JSDOM } from "jsdom";

import {
  autoPair,
  characterSlug,
  checkText,
  LISTENER_QUESTIONS,
  partnersOf,
  QUESTION_FOR_TYPE,
  REACTIONS,
  SCENE_CHARACTERS,
  SCENE_PLACES,
  validateGroups,
  validateReply,
  validateScene,
  validateTakeMeta,
} from "../shared/class-platform/social.js";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const read = (p) => readFileSync(new URL(p, LAB), "utf8");

// The scenario content and art are plain modules; the views need a DOM to import (components.js touches window).
const dom = new JSDOM("<!doctype html><body></body>", {
  url: "https://example.test/access-practice-lab/",
});
globalThis.window ??= dom.window;
globalThis.document ??= dom.window.document;
globalThis.localStorage ??= dom.window.localStorage;
globalThis.sessionStorage ??= dom.window.sessionStorage;
for (const k of ["navigator", "location", "HTMLElement", "Node", "CustomEvent", "Event"])
  if (!(k in globalThis))
    Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true });

const { SCENES } = await import(new URL("src/content/scenarios.js", LAB));
const { PLACE_IDS } = await import(new URL("src/views/scenario-art.js", LAB));
const model = await import(new URL("src/class/scene-model.js", LAB));

const good = {
  title: "Asking for a pencil",
  place: "classroom",
  character: "ms-patel",
  situation: "You forgot your pencil.",
  lines: ["Is everything okay?"],
  good: ["Excuse me, could I borrow a pencil, please?", "May I borrow a pencil?"],
  rude: { say: "Give me a pencil.", why: "It sounds like an order." },
};

test("text guard blocks contact details, links and unkind words, in English and Spanish", () => {
  assert.deepEqual(checkText("I went to the store first.", 100), {
    ok: true,
    text: "I went to the store first.",
  });
  const err = (t) => checkText(t, 200).error;
  assert.equal(err("ana@school.org"), "text-contact");
  assert.equal(err("follow @ana"), "text-contact");
  assert.equal(err("call me 410-555-1212"), "text-contact");
  assert.equal(err("(410) 555 1212"), "text-contact");
  assert.equal(err("go to https://x.io"), "text-link");
  assert.equal(err("www.games.net"), "text-link");
  assert.equal(err("look at mysite.com"), "text-link");
  assert.equal(err("you are a sh1t"), "text-language");
  assert.equal(err("eres un pendejo"), "text-language");
  assert.equal(err("   "), "text-empty");
  assert.equal(checkText("x".repeat(11), 10).error, "text-too-long");
  // Ordinary school sentences pass: numbers, times, grades, titles with dots.
  for (const ok of [
    "Grades 3-5 at 10:30",
    "Mr. Okafor said 25 kids came.",
    "I have 3 brothers and 2 sisters.",
    "Class assignment",
  ])
    assert.equal(checkText(ok, 200).ok, true, ok);
  assert.equal(checkText(42, 10).error, "text-invalid");
});

test("scene validation keeps declared fields only and names the bad field", () => {
  const r = validateScene({ ...good, extra: "<script>", lines: ["Hi.", "", null] });
  assert.equal(r.ok, true);
  assert.deepEqual(Object.keys(r.scene).sort(), [
    "character",
    "good",
    "lines",
    "place",
    "rude",
    "situation",
    "title",
  ]);
  assert.deepEqual(r.scene.lines, ["Hi."]);
  assert.equal(validateScene({ ...good, rude: { say: "Go away.", why: "" } }).field, "why");
  assert.equal(validateScene({ ...good, good: ["a", "b", "c", "d"] }).error, "count-good");
  assert.equal(validateScene({ ...good, situation: "x".repeat(201) }).error, "text-too-long");
  assert.equal(validateScene(null).error, "invalid-scene");
});

test("take metadata, replies and fixed reactions", () => {
  const meta = {
    taskId: "spk-seedlings-retell",
    taskTitle: "Retell",
    questionId: "first-step",
    seconds: 30,
  };
  assert.equal(validateTakeMeta(meta).ok, true);
  assert.equal(validateTakeMeta({ ...meta, seconds: 120 }).error, "take-too-long");
  assert.equal(validateTakeMeta({ ...meta, taskId: "../x" }).error, "invalid-task");
  assert.equal(validateReply({ answer: "They planted seeds.", reaction: "clear" }).ok, true);
  assert.equal(validateReply({ answer: "ok", reaction: "lol" }).error, "invalid-reaction");
  for (const [en, es] of [...Object.values(REACTIONS), ...Object.values(LISTENER_QUESTIONS)]) {
    assert.ok(en && es && en !== es, `bilingual: ${en}`);
  }
});

test("listener question fits every Speaking Studio task type", () => {
  const tasks = JSON.parse(read("content/studio/speaking.json")).tasks;
  for (const t of tasks)
    assert.ok(LISTENER_QUESTIONS[QUESTION_FOR_TYPE[t.taskType]], `${t.id} ${t.taskType}`);
});

test("auto-pairing leaves nobody out; picked groups are checked against the roster", () => {
  let seed = 1;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const n of [2, 3, 4, 7, 30]) {
    const ids = Array.from({ length: n }, (_, i) => `s${String(i).padStart(10, "0")}`);
    const groups = autoPair(ids, rand);
    assert.deepEqual(groups.flat().sort(), ids, `n=${n}`);
    assert.ok(groups.every((g) => g.length === 2 || g.length === 3));
  }
  assert.deepEqual(autoPair(["s1"]), []);
  assert.equal(validateGroups([["a", "b"]], ["a", "b"]).ok, true);
  assert.equal(validateGroups([["a", "x"]], ["a", "b"]).ok, false);
  assert.equal(
    validateGroups(
      [
        ["a", "b"],
        ["b", "c"],
      ],
      ["a", "b", "c"],
    ).ok,
    false,
  );
  assert.deepEqual(partnersOf([["a", "b", "c"]], "b"), ["a", "c"]);
  assert.deepEqual(partnersOf([["a", "b"]], "z"), []);
});

test("scene places and characters are exactly the Real-Life Scenarios ones", () => {
  assert.deepEqual([...SCENE_PLACES].sort(), [...PLACE_IDS].sort());
  const npcs = new Set(
    SCENES.flatMap((s) => [s.npc, s.npc2].filter(Boolean).map((n) => characterSlug(n.name))),
  );
  assert.deepEqual([...SCENE_CHARACTERS].sort(), [...npcs].sort());
  assert.equal(model.CHARACTERS.length, SCENE_CHARACTERS.length);
  for (const p of SCENE_PLACES) assert.equal(model.PLACE_NAMES[p]?.length, 2, p);
  assert.equal(model.artScene(good).npc.name, "Ms. Patel");
});

test("reply order is stable per scene and keeps every reply", () => {
  const a = model.replyChoices(good, "c0123456789ab");
  assert.deepEqual(a, model.replyChoices(good, "c0123456789ab"));
  assert.deepEqual(a.map((c) => c.say).sort(), [...good.good, good.rude.say].sort());
  assert.equal(a.find((c) => c.q === 0).why, good.rude.why);
});

test("student text is rendered as text, never HTML", async () => {
  const { scenePlayerCard } = await import(new URL("src/class/scene-player.js", LAB));
  const evil = { ...good, title: "<img src=x onerror=alert(1)>", situation: "<b>bold</b>" };
  const card = scenePlayerCard({
    S: (en) => en,
    item: { sceneId: "c0123456789ab", alias: "Comet", scene: evil, hasAudio: false },
    picked: null,
    onPick() {},
    onRetry() {},
    onBack() {},
  });
  assert.equal(card.querySelector("img[src=x]"), null);
  assert.equal(card.querySelector("h2").textContent, evil.title);
  assert.ok(card.querySelector(".scn-stage svg"), "uses the scenario art");
  assert.equal(card.querySelectorAll(".scn-choice").length, 3);
});

test("routes, loaders, sitemap and the minimal hooks are wired", async () => {
  const main = read("src/main.js");
  assert.match(main, /pairs: \(\) => import\("\.\/views\/pairs\.js"\)/);
  assert.match(main, /scenes: \(\) => import\("\.\/views\/scenes\.js"\)/);
  assert.match(main, /a === "pairs" \|\| a === "scenes"/);
  const sm = await import(new URL("src/sitemap.js", LAB));
  for (const id of ["pairs", "scenes"]) {
    const d = sm.DESTINATIONS.find((x) => x.id === id);
    assert.ok(d, id);
    assert.ok(d.title[0] && d.title[1] && d.text[0] && d.text[1]);
  }
  const cls = read("src/views/class.js");
  assert.ok(cls.includes("${BASE}/pairs") && cls.includes("${BASE}/scenes"));
  assert.match(
    read("src/class/roster-panel.js"),
    /import\("\.\/social-teacher\.js"\)\.then\(\(m\) => \{\s*const social = m\.mountSocialPanel\(socialBox/,
  );
});

test("views are bilingual, class-only, and never claim a score", () => {
  for (const file of [
    "src/views/pairs.js",
    "src/views/scenes.js",
    "src/class/social-teacher.js",
    "src/class/scene-player.js",
  ]) {
    const src = read(file);
    // Every S("…") / I.T("…") call carries two strings (English, Spanish).
    for (const m of src.matchAll(/\b(?:S|I\.S|I\.T)\(\s*("(?:[^"\\]|\\.)*"|`[^`]*`)\s*\)/g))
      assert.fail(`${file}: one-language string ${m[1].slice(0, 60)}`);
    assert.doesNotMatch(src, /ACCESS (score|level)|proficiency level|placement/i, file);
    assert.doesNotMatch(
      src,
      /innerHTML\s*=(?!\s*sceneSVG)/,
      `${file}: only the escaped scenario art is set as HTML`,
    );
  }
  for (const file of ["src/views/pairs.js", "src/views/scenes.js"])
    assert.match(read(file), /loadLink\(\)/, `${file} checks the class link`);
});
