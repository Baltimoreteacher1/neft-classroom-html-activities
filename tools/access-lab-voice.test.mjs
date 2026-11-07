// Speaking and listening fidelity features of the Language Page (access-practice-lab): the model student,
// the "speak about as long as the model" meter, and the Voice Lab activities. Pure logic first, then the markup
// each feature renders. House rules held here: no countdown or speed language, Spanish for every new string,
// no WIDA level or score claims.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { makeI18n } from "../access-practice-lab/src/i18n.js";
import * as require_ms from "../access-practice-lab/src/lang/model-student.js";
import {
  compareLength,
  estimateSeconds,
  findModelStudent,
  lengthAdvice,
  takeSpeechSeconds,
} from "../access-practice-lab/src/lang/model-student.js";
import { lengthMeterHTML, modelStudentHTML } from "../access-practice-lab/src/model-student-ui.js";
import { toHtml } from "../access-practice-lab/src/util.js";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";

const en = makeI18n("en");
const es = makeI18n("es");
const TESTS = new URL("../access-practice-lab/content/tests/", import.meta.url);
const SPEED = /\b(per minute|wpm|words a minute|faster|hurry|countdown|time is up|seconds left)\b/i;

const speakingItems = () =>
  readdirSync(TESTS)
    .filter((f) => f.endsWith(".json"))
    .flatMap((f) => {
      const t = JSON.parse(readFileSync(new URL(f, TESTS), "utf8"));
      return (t.sections || [])
        .filter((s) => s.domain === "Speaking")
        .flatMap((s) => s.items.map((item) => ({ file: f, item })));
    });

test("findModelStudent reads every model student line written in the speaking tests", () => {
  const items = speakingItems();
  const mentioned = items.filter(({ item }) =>
    JSON.stringify(item.passage || "").includes("model student"),
  );
  assert.ok(
    mentioned.length >= 10,
    `expected the authored model students, found ${mentioned.length}`,
  );
  for (const { file, item } of mentioned) {
    const m = findModelStudent(item);
    assert.ok(m, `${file} ${item.id}: model student not parsed`);
    assert.match(m.name, /^\p{Lu}/u);
    assert.ok(m.line.split(/\s+/).length >= 3, `${file} ${item.id}: line too short`);
    assert.equal(
      /["“”]/.test(m.line),
      false,
      `${file} ${item.id}: quote marks leaked into the line`,
    );
  }
  const rob = findModelStudent(items.find(({ item }) => item.id === "ws-1").item);
  assert.deepEqual(rob, {
    name: "Rob",
    line: "I see a woman cooking over a fire and a garden.",
    partial: false,
  });
});

test("a model that only started the answer is marked partial, and an explicit field wins", () => {
  assert.equal(
    findModelStudent({
      passage: [
        'A model student, Lucía, started like this: "I see four students at a long table."',
      ],
    }).partial,
    true,
  );
  assert.deepEqual(
    findModelStudent({ modelStudent: { name: "Ana", line: "Hello there friend." }, passage: [] }),
    { name: "Ana", line: "Hello there friend.", partial: false },
  );
  assert.equal(findModelStudent({ passage: ["No model here."] }), null);
});

test("estimateSeconds grows with words and slows with a lower rate", () => {
  assert.equal(estimateSeconds(""), 1);
  const a = estimateSeconds("I see a woman cooking over a fire and a garden.");
  assert.ok(a > 3 && a < 6, String(a));
  assert.ok(
    estimateSeconds("one two three four five six seven", 0.5) >
      estimateSeconds("one two three four five six seven", 1),
  );
});

test("compareLength bands are about length only", () => {
  assert.equal(compareLength(0, 5), null);
  assert.equal(compareLength(5, 0), null);
  assert.equal(compareLength(2, 10).band, "short");
  assert.equal(compareLength(9, 10).band, "near");
  assert.equal(compareLength(30, 10).band, "long");
  assert.equal(
    compareLength(30, 10, { partial: true }).band,
    "near",
    "longer than a starter is never a caution",
  );
  const c = compareLength(5, 10);
  assert.equal(c.youPct, 50);
  assert.equal(c.modelPct, 100);
});

test("lengthAdvice has English and Spanish for every band and never mentions speed", () => {
  for (const [you, model, partial] of [
    [2, 10, false],
    [9, 10, false],
    [30, 10, false],
    [2, 10, true],
    [9, 10, true],
  ]) {
    const advice = lengthAdvice(compareLength(you, model, { partial }), "Rob", { partial });
    assert.equal(advice.length, 2);
    assert.notEqual(advice[0], advice[1]);
    for (const s of advice) {
      assert.doesNotMatch(s, SPEED);
      assert.doesNotMatch(s, SCORE_CLAIM);
    }
  }
});

test("takeSpeechSeconds prefers measured speech and falls back to recording length", () => {
  assert.equal(takeSpeechSeconds(null), 0);
  assert.equal(takeSpeechSeconds({ seconds: 12 }), 12);
  assert.equal(
    takeSpeechSeconds({ seconds: 12, env: [1], fps: 20 }, () => ({ ok: true, speechSeconds: 7.5 })),
    7.5,
  );
  assert.equal(
    takeSpeechSeconds({ seconds: 12, env: [1] }, () => ({ ok: false })),
    12,
  );
});

test("model student card and meter render in both languages, with no countdown or speed wording", () => {
  const model = {
    name: "Rob",
    line: "I see a woman cooking over a fire and a garden.",
    partial: false,
  };
  for (const I of [en, es]) {
    const card = toHtml(modelStudentHTML("t:ws-1", model, I));
    assert.match(card, /class="model-student/);
    assert.match(card, /Rob/);
    const meter = toHtml(lengthMeterHTML("t:ws-1", model, 1, I));
    assert.match(meter, /len-meter is-short/);
    assert.match(meter, /len-bar is-you/);
    assert.doesNotMatch(meter, SPEED);
    assert.doesNotMatch(meter, SCORE_CLAIM);
  }
  assert.match(toHtml(lengthMeterHTML("t:ws-1", model, 1, es)), /Cuánto tiempo hablaste/);
  assert.equal(toHtml(lengthMeterHTML("t:ws-1", model, 0, en)), "");
  assert.equal(toHtml(modelStudentHTML("x", null, en)), "");
});

// ── Sound Bridge (minimal pairs) ────────────────────────────────────────────
const { SOUND_SETS } = await import("../access-practice-lab/src/content/voice-lab.js");
const sb = await import("../access-practice-lab/src/lang/sound-bridge.js");

test("Sound Bridge content: every pair is two different real words with meanings, and a bilingual tip", () => {
  for (const set of SOUND_SETS) {
    assert.ok(set.pairs.length >= 4, set.id);
    assert.equal(set.tip.length, 2);
    assert.notEqual(set.tip[0], set.tip[1]);
    for (const p of set.pairs) {
      assert.equal(p.length, 4, `${set.id} ${p}`);
      assert.notEqual(p[0].toLowerCase(), p[2].toLowerCase());
      assert.ok(p[1] && p[3]);
      assert.ok(
        !p[1].toLowerCase().includes(p[0].toLowerCase()),
        `${p[0]}: meaning must not repeat the word`,
      );
    }
  }
});

test("Sound Bridge: right choices lay planks, a miss requeues the pair and never removes a plank", () => {
  const set = SOUND_SETS[0];
  const game = sb.newGame(set, { rng: sb.seeded(7) });
  assert.equal(game.queue.length, sb.PLANKS);
  const pairsSeen = new Set(game.queue.map((r) => r.pair));
  assert.equal(
    pairsSeen.size,
    Math.min(set.pairs.length, sb.PLANKS),
    "every pair appears before any repeats",
  );
  const first = sb.currentRound(game);
  const miss = sb.choose(game, 1 - first.target);
  assert.equal(miss.correct, false);
  assert.equal(game.placed, 0);
  assert.equal(
    game.queue.at(-1).pair,
    first.pair,
    "the missed pair returns at the end of the line",
  );
  let guard = 0;
  while (!sb.isWon(game) && guard++ < 50) sb.choose(game, sb.currentRound(game).target);
  assert.equal(sb.isWon(game), true);
  assert.equal(game.placed, sb.PLANKS);
  assert.equal(game.again, 1);
  assert.equal(sb.choose(game, 0), null, "no rounds after the bridge is finished");
  assert.equal(sb.choose(sb.newGame(set), 3), null, "only the two words can be chosen");
});

// ── Shadowing rhythm ────────────────────────────────────────────────────────
test("rhythmEnvelope places words at the voice's real word times, and says when it had to estimate", () => {
  const { rhythmEnvelope } = require_ms;
  const text = "The plant grew taller.";
  const real = rhythmEnvelope(
    text,
    [
      { charIndex: 0, t: 0 },
      { charIndex: 4, t: 0.5 },
      { charIndex: 10, t: 1.2 },
      { charIndex: 15, t: 1.6 },
    ],
    2.2,
    20,
  );
  assert.equal(real.fromVoice, true);
  assert.equal(real.env.length, 44);
  assert.ok(real.env[11] > 0.5, "plant is sounding at 0.55s");
  assert.ok(real.env[9] < 0.1, "a short gap before the next word");
  const est = rhythmEnvelope(text, [], 2, 20);
  assert.equal(est.fromVoice, false);
  assert.ok(est.env.some((v) => v > 0.5));
  assert.equal(
    rhythmEnvelope("", [], 1).env.every((v) => v < 0.1),
    true,
  );
});

// ── Keyboarding (accuracy only) ─────────────────────────────────────────────
test("checkTyping counts characters right from the edit distance; capitals and punctuation count", async () => {
  const { checkTyping, editDistance } = await import(
    "../access-practice-lab/src/lang/keyboarding.js"
  );
  assert.equal(editDistance("kitten", "sitting"), 3);
  assert.deepEqual(checkTyping("In my opinion.", "  In my opinion.  "), {
    right: 14,
    total: 14,
    exact: true,
    firstDiff: -1,
  });
  const r = checkTyping("In my opinion.", "in my opinion");
  assert.equal(r.exact, false);
  assert.equal(r.right, 12);
  assert.equal(r.firstDiff, 0);
  assert.equal(checkTyping("Hi.", "").right, 0);
  assert.equal(checkTyping("Hi.", "a much longer wrong answer").right, 0, "never negative");
});

test("keyboarding frames are full sentences with end marks and no speed wording", async () => {
  const { KEY_FRAMES } = await import("../access-practice-lab/src/content/voice-lab.js");
  for (const set of KEY_FRAMES) {
    assert.ok(set.titleEs && set.titleEs !== set.title);
    for (const f of set.frames) {
      assert.match(f, /^[A-Z].*[.?!]$/, f);
      assert.doesNotMatch(f, /\b(per minute|wpm|countdown|timer)\b/i);
    }
  }
});

// ── Speech-to-text (#19) ────────────────────────────────────────────────────
const stt = await import("../access-practice-lab/src/stt.js");
function fakeEnv({ available, local = true } = {}) {
  const made = [];
  class Rec {
    constructor() {
      if (local) this.processLocally = false;
      made.push(this);
    }
    start() {
      this.started = (this.started || 0) + 1;
    }
    stop() {
      this.onend?.();
    }
  }
  if (available) Rec.available = async () => available;
  return { env: { SpeechRecognition: Rec }, made };
}

test("dictation prefers on-device recognition when the language is available locally", async () => {
  const { env, made } = fakeEnv({ available: "available" });
  const s = await stt.startDictation({ env });
  assert.equal(s.mode, "local");
  assert.equal(made[0].processLocally, true);
  assert.equal(made[0].lang, "en-US");
  made[0].onresult({
    results: [
      Object.assign([{ transcript: "I see a fort" }], { isFinal: true }),
      Object.assign([{ transcript: "and oxen" }], { isFinal: false }),
    ],
  });
  assert.equal(s.text, "I see a fort and oxen");
  assert.equal(await s.stop(), "I see a fort and oxen");
});

test("dictation falls back to standard recognition, then to typing", async () => {
  const notReady = fakeEnv({ available: "downloadable" });
  assert.equal((await stt.startDictation({ env: notReady.env })).mode, "standard");
  assert.equal(notReady.made[0].processLocally, false);
  const old = fakeEnv({ local: false });
  assert.equal((await stt.startDictation({ env: old.env })).mode, "standard");
  assert.equal(await stt.localAvailability("en-US", old.env), "unsupported");
  assert.equal(await stt.startDictation({ env: {} }), null);
  assert.equal(stt.canDictate({}), false);
  assert.equal(stt.canDictate({ webkitSpeechRecognition: function W() {} }), true);
});

test("continuous dictation restarts after a browser silence timeout until the learner stops", async () => {
  const { env, made } = fakeEnv({ available: "available" });
  const s = await stt.startDictation({ env });
  made[0].onend();
  assert.equal(made[0].started, 2, "restarted after the browser ended it");
  await s.stop();
  assert.equal(made[0].started, 2, "not restarted after the learner stopped");
});

test("every dictation note has English and Spanish", () => {
  for (const pair of Object.values(stt.DICTATION_NOTE)) {
    assert.equal(pair.length, 2);
    assert.notEqual(pair[0], pair[1]);
  }
});

// ── Oral reading (#20) ──────────────────────────────────────────────────────
test("alignReading highlights words read, tolerates skips and slips, and revises from the full transcript", async () => {
  const { alignReading, passageWords, readingAccuracy, spokenWords, highlightedPassage } =
    await import("../access-practice-lab/src/lang/oral-reading.js");
  const text = "Plants cannot walk, but their seeds can travel.";
  const words = passageWords(text);
  assert.equal(words.length, 8);
  const full = alignReading(words, spokenWords("plants cannot walk but their seeds can travel"));
  assert.equal(full.matched, 8);
  assert.equal(readingAccuracy(full), 100);
  const skip = alignReading(words, spokenWords("Plants cannot but their seeds"));
  assert.deepEqual(skip.state.slice(0, 5), ["read", "read", "skipped", "read", "read"]);
  assert.equal(skip.skipped, 1);
  assert.equal(readingAccuracy(skip), 83);
  const slip = alignReading(words, spokenWords("plants um cannot walk"));
  assert.equal(slip.matched, 3);
  assert.equal(slip.extra, 1);
  assert.equal(readingAccuracy(alignReading(words, [])), null);
  assert.equal(alignReading(words, spokenWords("PLANTS")).state[0], "read", "case-insensitive");
  const markup = highlightedPassage("A <b> test, ok.", ["read", "todo", "todo"]);
  assert.match(markup, /<span class="rd-word is-read" data-rd="0">A<\/span>/);
  assert.doesNotMatch(markup, /<b>/, "passage text is escaped");
});
