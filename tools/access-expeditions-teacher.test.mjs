#!/usr/bin/env node
// Language Expeditions teacher features: one-land links (land=…), teacher-written stops (stop=…), the expedition
// passport page and the expedition stamps in the learner's share code. Pins: an invalid stop falls back to the
// authored one with a note, a teacher stop is rendered as text (never HTML), the QA plan still finishes, and the
// share code carries stamps and counts only (no answers, no writing), while older codes still read.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM('<p id="labLive"></p>', { url: "https://lab.test/" });
for (const k of ["window", "document", "localStorage"]) globalThis[k] = dom.window[k];

const root = new URL("../access-practice-lab/", import.meta.url);
const content = JSON.parse(
  await readFile(new URL("content/games/language-expeditions.json", root), "utf8"),
);
const mod = (await import(new URL("src/games/language-expeditions.js", root))).default;
const { decodeStop, encodeStop, landParam, packStop, STOP_MAX } = await import(
  new URL("src/games/language-expeditions-links.js", root)
);
const { rng } = await import(new URL("src/games/engine.js", root));
const { toHtml } = await import(new URL("src/util.js", root));
const { buildShare, decodeShare, encodeShare, normalize } = await import(
  new URL("src/lang/share.js", root)
);

const I = { T: (en) => en, S: (en) => en };
const envFor = (band, params = {}, events = []) => ({
  content,
  band,
  support: "A",
  sup: { hints: 3, audio: "tap", gloss: "show", frames: "full", visuals: true },
  I,
  def: { id: "language-expeditions" },
  rng: rng(41),
  count: (full) => full,
  report: (r) => events.push(r),
  use: () => {},
  params,
});
const fake = (selector) => {
  const m = selector.match(/\[([^=\]]+)(?:="([^"]*)")?\]/);
  const attr = m?.[1] || "";
  const key = attr.replace(/^data-/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const node = {
    dataset: key ? { [key]: m?.[2] ?? "" } : {},
    closest: (s) => (s === "button" ? node : null),
    hasAttribute: (n) => n === attr,
  };
  return node;
};
function play(state, env) {
  let guard = 0;
  while (!mod.done(state) && guard++ < 40)
    for (const step of mod.plan(state, { wrong: guard === 1 }, env)) {
      if (step.click)
        assert.equal(mod.click(fake(step.click), state, env), true, `click ${step.click}`);
      else if (step.fill) {
        const L = state.lands[state.land];
        L.acts[L.i].text = step.fill[1];
      }
    }
  assert.ok(guard < 40, "playthrough finished inside the guard");
}

const READING = {
  kind: "reading",
  stop: "2",
  titleEn: "The class garden",
  passage:
    'Our class planted beans. <img src=x onerror="alert(1)"> We water them every Monday, so they grow fast.',
  questionEn: "When do they water the beans?",
  questionEs: "¿Cuándo riegan los frijoles?",
  opt0En: "Every Friday",
  opt1En: "Every Monday",
  opt1Es: "Cada lunes",
  opt2En: "Never",
  answer: "1",
};
const WRITING = {
  kind: "writing",
  stop: "1",
  promptEn: "Write two sentences about your favorite season.",
  modelEn:
    "My favorite season is spring because the days get longer and warmer. The trees in my neighborhood grow bright green leaves again. After school, my friends and I play soccer in the park until dinner.",
};

test("land parameter names a land by domain or number", () => {
  assert.equal(landParam("listening"), 0);
  assert.equal(landParam("Writing"), 3);
  assert.equal(landParam("3"), 2);
  for (const bad of ["", "5", "0", "math", undefined, "<script>"]) assert.equal(landParam(bad), -1);
});

test("an assigned land opens in walk mode and the plan still finishes", () => {
  for (const band of ["3-5", "6-8"])
    for (const land of ["listening", "reading", "speaking", "writing", "4"]) {
      const env = envFor(band, { land });
      const s = mod.init(env);
      assert.equal(s.at, "walk");
      assert.equal(s.land, landParam(land));
      play(s, env);
      assert.ok(
        s.lands.every((L) => L.stamp),
        `${band}/${land}: every land stamped`,
      );
    }
});

test("a valid teacher Reading stop replaces the authored stop, renders as text, and is playable", () => {
  for (const band of ["3-5", "6-8"]) {
    const code = encodeStop(packStop(READING));
    const res = decodeStop(code, content.bands[band]);
    assert.ok(res.ok, JSON.stringify(res.errors));
    assert.equal(res.land, 1);
    assert.equal(res.i, 1);
    const events = [];
    const env = envFor(band, { stop: code, land: "reading" }, events);
    const s = mod.init(env);
    assert.equal(s.custom.act.answer, 1);
    assert.equal(s.lands[1].acts[1].id, res.act.id);
    // Open the teacher stop and check the passage is escaped, never raw HTML.
    s.lands[1].i = 1;
    s.at = "land";
    const out = toHtml(mod.view(s, env));
    assert.match(out, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
    assert.doesNotMatch(out, /<img src=x/);
    assert.match(out, /When do they water the beans\?/);
    s.lands[1].i = 0;
    s.at = "walk";
    play(s, env);
    assert.ok(
      events.some((e) => e.id === res.act.id && e.ok),
      "the teacher stop was answered",
    );
  }
});

test("a valid teacher Writing stop keeps the authored checks and the plan writes its model", () => {
  const code = encodeStop(packStop(WRITING));
  for (const band of ["3-5", "6-8"]) {
    const res = decodeStop(code, content.bands[band]);
    assert.ok(res.ok, JSON.stringify(res.errors));
    assert.equal(res.act.prompt.es, res.act.prompt.en, "missing Spanish shows the English once");
    const events = [];
    const env = envFor(band, { stop: code }, events);
    const s = mod.init(env);
    assert.equal(s.custom.land, 3);
    play(s, env);
    assert.ok(events.some((e) => e.id === res.act.id && e.production));
  }
});

test("invalid stops fall back to the authored stop with a visible note", () => {
  const bad = [
    encodeStop(packStop({ ...READING, answer: "3" })), // answer points at an empty choice
    encodeStop(packStop({ ...READING, passage: "" })),
    encodeStop(packStop({ ...READING, opt2En: "" })), // only two choices
    encodeStop(packStop({ ...WRITING, modelEn: "too short" })), // the model fails its own checks
    encodeStop({ v: 2, d: "r" }),
    "not*a*code",
    "A".repeat(STOP_MAX + 1),
    "eyJ2IjoxfQ", // {"v":1}
  ];
  for (const code of bad) {
    assert.equal(decodeStop(code, content.bands["3-5"]).ok, false, code.slice(0, 40));
    const env = envFor("3-5", { stop: code });
    const s = mod.init(env);
    assert.equal(s.custom, undefined);
    assert.ok(s.customNote);
    const out = toHtml(mod.view(s, env));
    assert.match(out, /could not be opened/);
    assert.deepEqual(
      s.lands.map((L) => L.acts.map((r) => r.id)),
      content.bands["3-5"].lands.map((L) => L.acts.map((a) => a.id)),
    );
  }
});

test("the passport shows the learner's own words and a plain no-recording note", () => {
  const env = envFor("6-8");
  const s = mod.init(env);
  play(s, envFor("6-8"));
  s.finished = false;
  s.lands[3].acts[0].text = "I saw <b>a canyon</b>.";
  s.lands[2].acts[0].text = "";
  s.at = "summary";
  assert.equal(mod.click(fake("[data-lexp-pp]"), s, env), true);
  assert.equal(s.at, "passport");
  const out = toHtml(mod.view(s, env));
  assert.match(out, /I saw &lt;b&gt;a canyon&lt;\/b&gt;\./);
  assert.match(out, /No recording to play/);
  assert.equal((out.match(/class="lexp-pp-land/g) || []).length, 4);
  assert.deepEqual(mod.plan(s, {}, env), [{ click: "[data-lexp-pp-back]" }]);
  assert.equal(mod.click(fake("[data-lexp-pp-back]"), s, env), true);
  assert.equal(s.at, "summary");
});

test("share codes carry expedition stamps only; older codes still read", () => {
  const env = envFor("3-5");
  const s = mod.init(env);
  s.got = ["0-1", "0-2", "1-0", "bogus"];
  play(s, env);
  s.lands[3].acts[0].text = "PRIVATE WRITING";
  const games = {
    v: 1,
    history: [],
    awards: [],
    sessions: {
      "language-expeditions:3-5": {
        game: "language-expeditions",
        band: "3-5",
        updatedAt: "2026-11-16T10:00:00Z",
        state: s,
      },
    },
  };
  const studio = { speaking: {}, writing: {}, missions: {}, detective: {}, portfolio: {} };
  const bundle = buildShare(
    { alias: "Sky", band: "3-5", include: { readingListening: false } },
    { entries: [] },
    studio,
    [],
    games,
  );
  assert.deepEqual(
    bundle.expeditions.lands.map((r) => [r.land, r.stamp, r.stops, r.of, r.got]),
    [
      ["listening", true, 3, 3, 2],
      ["reading", true, 3, 3, 1],
      ["speaking", true, 2, 2, 0],
      ["writing", true, 2, 2, 0],
    ],
  );
  const code = encodeShare(bundle);
  assert.doesNotMatch(code, /PRIVATE/);
  assert.doesNotMatch(JSON.stringify(bundle.expeditions), /PRIVATE|text|answer/);
  const read = decodeShare(code);
  assert.deepEqual(read.expeditions, bundle.expeditions);
  // Games off: no expedition field.
  assert.equal(
    buildShare(
      { alias: "Sky", band: "3-5", include: { games: false, readingListening: false } },
      { entries: [] },
      studio,
      [],
      games,
    ).expeditions,
    undefined,
  );
  // Older codes: no field, still read.
  assert.equal(normalize({ band: "3-5", alias: "Old" }).expeditions, null);
  // Hostile input is cleaned.
  const hostile = normalize({
    band: "3-5",
    expeditions: {
      lands: [
        { land: "<script>", stamp: true },
        { land: "reading", stamp: "yes", stops: 99, of: -1, got: 3.5, note: "x" },
      ],
      words: 4,
    },
  });
  assert.deepEqual(hostile.expeditions.lands, [
    { land: "reading", stamp: false, stops: 10, of: 0, got: 0 },
  ]);
  assert.equal(hostile.expeditions.words, 4);
});
