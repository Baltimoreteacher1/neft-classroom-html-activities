// Language Time Machine (/time-machine): the rules of system D (docs/part2-integration-map.md), on synthetic data.
//   earlier work stays byte-identical · pairs name the right tasks and never cross domains · every change statement
//   quotes words that are in the texts · length is never growth · speaking is never described by accent or speed ·
//   nothing is shared without the share action and the shared text has no name · a new-context task is a new loop ·
//   a reflection is saved under the feature's own key · the evidence view shows no score, level or percentage.
// Browser journey: tools/time-machine-e2e.mjs.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const load = (p) => import(new URL(p, LAB));
const { storage, toHtml } = await load("src/util.js");
const { makeI18n } = await load("src/i18n.js");
const C = await load("src/timemachine/collect.js");
const X = await load("src/timemachine/compare.js");
const R = await load("src/timemachine/reflect.js");
const CH = await load("src/timemachine/challenge.js");
const EV = await load("src/timemachine/evidence.js");
const LD = await load("src/timemachine/load.js");
const UI = await load("src/timemachine/ui.js");
const UIS = await load("src/timemachine/ui-speaking.js");
const UIM = await load("src/timemachine/ui-more.js");
const ENGINE = await load("src/intel/engine.js");
const LOOP = await load("src/intel/loop.js");

const P = "accessPracticeLab:v1";
const I = makeI18n("en");
const TASKS = {
  writing: {
    "wrt-plants": {
      title: "Why Plants Need Sunlight",
      prompt: "Explain why plants need sunlight.",
      keyUse: "Explain",
    },
  },
  speaking: {
    "spk-rivers": {
      title: "How a River Changes Land",
      prompt: "Explain how a river changes the land.",
      keyUse: "Explain",
    },
    "spk-story": {
      title: "A Day That Changed",
      prompt: "Tell about a day that changed.",
      keyUse: "Narrate",
    },
  },
};
const EARLY = "Plants need sun. They grow. It is good thing for plant.";
const REVISED =
  "Plants need sunlight because they use light energy to make food. However, without enough light, the leaves turn yellow.";
const SPOKEN_1 = "The river move rocks. It make the land different.";
const SPOKEN_2 =
  "The river moves rocks downstream because the water pushes them. As a result, the valley becomes wider.";

function seed() {
  for (const k of [
    `${P}:studio`,
    `${P}:intel`,
    `${P}:exhibition`,
    `${P}:adventures`,
    `${P}:prefs`,
    `${P}:studentName`,
    R.TM_KEY,
    `${P}:ledger`,
  ])
    storage.remove(k);
  storage.set(
    `${P}:studio`,
    JSON.stringify({
      v: 1,
      writing: {
        "wrt-plants": {
          stage: "independent",
          used: { frames: false, bank: false },
          versions: [
            { id: "v1", t: "2026-09-02T14:00:00.000Z", kind: "draft", text: EARLY },
            { id: "v2", t: "2026-09-09T14:00:00.000Z", kind: "revision", text: REVISED },
          ],
        },
      },
      speaking: {
        "spk-rivers": {
          stage: "guided",
          used: { frames: true, bank: true },
          takes: [
            {
              id: "take-old",
              t: "2026-09-03T15:00:00.000Z",
              seconds: 14,
              transcript: SPOKEN_1,
              transcriptSource: "speech-local",
              teacherReview: [{ comment: "Clear main idea." }],
            },
            {
              id: "take-new",
              t: "2026-10-20T15:00:00.000Z",
              seconds: 21,
              transcript: SPOKEN_2,
              transcriptSource: "",
            },
          ],
        },
        "spk-story": {
          stage: "independent",
          used: {},
          takes: [
            {
              id: "take-story",
              t: "2026-10-01T15:00:00.000Z",
              seconds: 9,
              transcript: "First we went to the park. Then it rained.",
              transcriptSource: "",
            },
          ],
        },
      },
    }),
  );
  storage.set(
    `${P}:intel`,
    JSON.stringify({
      v: 1,
      loops: {
        la: {
          id: "la",
          src: "write",
          band: "6-8",
          objective: "",
          attempt: 1,
          task: {
            id: "bk-water",
            title: "The Water Cycle",
            prompt: "Explain where rain comes from.",
            keyUse: "Explain",
            domain: "Writing",
          },
          createdAt: "2026-10-05T10:00:00.000Z",
          updatedAt: "2026-10-07T10:00:00.000Z",
          stages: {
            response: {
              t: "2026-10-05T10:00:00.000Z",
              text: "Rain come from clouds. The water go up.",
              source: "typed",
              supports: { frames: true },
            },
            revision: {
              t: "2026-10-06T10:00:00.000Z",
              text: "Rain comes from clouds because water evaporates and rises.",
              supports: {},
            },
            transfer: {
              t: "2026-10-07T10:00:00.000Z",
              prompt: "Explain why puddles disappear.",
              text: "Puddles disappear because the sun heats the water and it evaporates.",
              supports: {},
              independent: true,
            },
            review: {
              t: "2026-10-08T10:00:00.000Z",
              shared: true,
              workId: "w1",
              teacher: {
                comment: "You named the cause.",
                decision: "seen",
                at: "2026-10-08T12:00:00.000Z",
              },
            },
          },
        },
      },
    }),
  );
  storage.set(`${P}:studentName`, "Zuleyma Testname");
}
const SOURCE_KEYS = [
  `${P}:studio`,
  `${P}:intel`,
  `${P}:exhibition`,
  `${P}:adventures`,
  `${P}:prefs`,
];
const snapshot = () => Object.fromEntries(SOURCE_KEYS.map((k) => [k, storage.get(k)]));
const model = () => LD.loadModel({ tasks: TASKS });
const allStatements = (cmp) => [...cmp.changes, ...cmp.kept];

test("earlier work is read-only: collecting, comparing and rendering leave every source store byte-identical", async () => {
  seed();
  const before = snapshot();
  const m = await model();
  assert.ok(m.pairs.length >= 3, "seed should give several pairs");
  const comparisons = {};
  for (const p of m.pairs) {
    comparisons[p.id] = X.comparePair(p, { compareWork: ENGINE.compareWork });
    X.comparePair(p);
    const extra = {
      reflection: R.reflectionFor(m.tm, p.id),
      urls: {},
      canRecord: false,
      recording: "",
      inClass: false,
      share: {},
    };
    toHtml(
      p.kind === "speaking"
        ? UIS.speakingPairHTML(I, "6-8", m, p, comparisons[p.id], extra)
        : UI.writingPairHTML(I, "6-8", m, p, comparisons[p.id], extra),
    );
    EV.packetText(p, comparisons[p.id], R.reflectionFor(m.tm, p.id));
  }
  toHtml(
    UIM.evidenceHTML(
      I,
      "6-8",
      EV.buildEvidence({ items: m.items, pairs: m.pairs, comparisons, tm: m.tm }),
      m.reflections,
    ),
  );
  // this feature's own notes: a confirmed transcript, typed words, a reflection
  const tm = R.loadTM();
  R.setVerified(tm, m.speaking[0].earlier.id);
  R.setTranscript(tm, "s:spk-story:take-story", "typed here");
  R.setAnswer(tm, m.pairs[0].id, "improved", "I added because.");
  R.saveTM(tm);
  await model();
  assert.deepEqual(snapshot(), before);
});

test("a confirmed transcript only flips a flag in the feature's own key", async () => {
  seed();
  let m = await model();
  const old = m.items.find((x) => x.id === "s:spk-rivers:take-old");
  assert.equal(old.source, "transcript");
  assert.equal(old.verified, false);
  const studio = storage.get(`${P}:studio`);
  const tm = R.loadTM();
  R.setVerified(tm, old.id);
  R.saveTM(tm);
  m = await model();
  assert.equal(m.items.find((x) => x.id === old.id).verified, true);
  assert.equal(storage.get(`${P}:studio`), studio);
  assert.deepEqual(JSON.parse(storage.get(R.TM_KEY)).verified, { [old.id]: true });
});

test("pairs reference the right tasks, are never cross-domain, never an item with itself, earlier strictly earlier", async () => {
  seed();
  const m = await model();
  for (const p of m.pairs) {
    assert.equal(p.earlier.domain, p.later.domain, p.id);
    assert.equal(p.kind, p.later.kind);
    assert.notEqual(p.earlier.id, p.later.id);
    assert.ok(Date.parse(p.earlier.t) < Date.parse(p.later.t), p.id);
    if (p.reason === "same-task") assert.equal(p.earlier.taskId, p.later.taskId);
    else {
      assert.equal(p.reason, "same-goal");
      assert.notEqual(p.earlier.taskId, p.later.taskId);
      assert.equal(p.earlier.keyUse, p.later.keyUse);
      assert.ok(p.earlier.keyUse);
    }
    assert.deepEqual(Object.keys(p.supports), ["earlier", "later"]);
  }
  const plants = m.writing.find(
    (p) => p.earlier.id === "w:wrt-plants:v1" && p.later.id === "w:wrt-plants:v2",
  );
  assert.ok(plants, "the draft and its revision are a pair");
  assert.equal(plants.reason, "same-task");
  assert.equal(plants.later.prompt, "Explain why plants need sunlight.");
  assert.equal(plants.supports.earlier.independent, true);
  assert.equal(plants.supports.later.independent, false, "a revision is always supported");
  assert.equal(plants.later.stage, "revision");
  // Explain in Writing and Explain in Speaking share a goal and are still never paired
  assert.equal(
    C.comparable(
      m.items.find((x) => x.id === "w:wrt-plants:v1"),
      m.items.find((x) => x.id === "s:spk-rivers:take-new"),
    ),
    "",
  );
  // a different goal on a different task is not comparable
  assert.equal(
    C.comparable(
      m.items.find((x) => x.id === "s:spk-story:take-story"),
      m.items.find((x) => x.id === "s:spk-rivers:take-new"),
    ),
    "",
  );
  const x = m.items[0];
  assert.equal(C.comparable(x, x), "");
  assert.equal(
    C.comparable({ ...x, id: "other" }, { ...x, text: "different words" }),
    "",
    "same time is not earlier",
  );
  // loop stages keep their support context and the teacher's note
  const t = m.items.find((i) => i.id === "l:la:transfer");
  assert.equal(t.stage, "transfer");
  assert.equal(t.independent, true);
  assert.equal(t.teacherNote, "You named the cause.");
  assert.equal(
    m.items.find((i) => i.id === "l:la:response").independent,
    false,
    "frames were open",
  );
  assert.equal(m.items.find((i) => i.id === "l:la:revision").independent, false);
});

test("every change statement quotes words that are in the texts, with the engine and with the local comparer", async () => {
  seed();
  const m = await model();
  let seen = 0;
  for (const p of m.pairs)
    for (const cmp of [X.comparePair(p, { compareWork: ENGINE.compareWork }), X.comparePair(p)]) {
      for (const c of allStatements(cmp)) {
        assert.ok(c.beforeQuote || c.afterQuote, `${c.id} has no quote`);
        if (c.beforeQuote)
          assert.ok(
            p.earlier.text.includes(c.beforeQuote),
            `${c.id}: "${c.beforeQuote}" is not in the earlier text`,
          );
        if (c.afterQuote)
          assert.ok(
            p.later.text.includes(c.afterQuote),
            `${c.id}: "${c.afterQuote}" is not in the later text`,
          );
        assert.ok(c.text[0] && c.text[1], "English and Spanish");
        assert.ok(Object.hasOwn(X.DIMENSIONS, c.dimension));
        seen++;
      }
    }
  assert.ok(seen >= 4, `only ${seen} statements were checked`);
  const plants = m.writing.find((p) => p.later.id === "w:wrt-plants:v2");
  assert.equal(X.comparePair(plants, { compareWork: ENGINE.compareWork }).engine, "engine");
  assert.ok(X.comparePair(plants, { compareWork: ENGINE.compareWork }).changes.length > 0);
  assert.ok(X.comparePair(plants).changes.length > 0, "local comparer finds the change too");
});

test("the guard drops statements with no real quote, about length, or (for speaking) about how a voice sounds", () => {
  const pair = (kind) => ({
    kind,
    domain: kind === "speaking" ? "Speaking" : "Writing",
    reason: "same-task",
    keyUse: "Explain",
    earlier: { text: "I like dogs.", source: "typed" },
    later: { text: "I like dogs because they are loyal.", source: "typed" },
  });
  const fake = () => ({
    changes: [
      {
        id: "ok",
        kind: "organization",
        text: ["Gives a reason.", "Da una razón."],
        beforeQuote: "",
        afterQuote: "because they are loyal",
      },
      {
        id: "invented",
        text: ["Uses a quote that is not there.", "x"],
        beforeQuote: "",
        afterQuote: "cats are nice",
      },
      {
        id: "length",
        text: ["The later response is longer.", "La respuesta es más larga."],
        beforeQuote: "",
        afterQuote: "because",
      },
      {
        id: "words",
        text: ["You wrote more words this time.", "Escribiste más palabras."],
        beforeQuote: "",
        afterQuote: "because",
      },
      {
        id: "accent",
        text: ["The accent is clearer now.", "El acento es más claro."],
        beforeQuote: "",
        afterQuote: "because",
      },
      {
        id: "speed",
        text: ["You spoke faster with fewer pauses.", "Hablaste más rápido con menos pausas."],
        beforeQuote: "",
        afterQuote: "because",
      },
      {
        id: "noquote",
        text: ["Better overall.", "Mejor en general."],
        beforeQuote: "",
        afterQuote: "",
      },
    ],
    kept: [
      {
        id: "k",
        text: ["Still names the topic.", "Sigue nombrando el tema."],
        quote: "I like dogs",
      },
    ],
    caution: null,
  });
  const w = X.comparePair(pair("writing"), { compareWork: fake });
  assert.deepEqual(
    w.changes.map((c) => c.id),
    ["ok", "accent", "speed"],
    "writing: length and ungrounded statements go",
  );
  const s = X.comparePair(pair("speaking"), { compareWork: fake });
  assert.deepEqual(
    s.changes.map((c) => c.id),
    ["ok"],
  );
  assert.equal(s.kept.length, 1);
  assert.equal(
    X.comparePair(pair("writing"), {
      compareWork: () => {
        throw new Error("x");
      },
    }).engine,
    "local",
  );
});

test("length is never growth: padding a response produces no statement about it, and the page says so", async () => {
  const short = "Plants need sunlight because they make food with light.";
  const padded = `${short} Plants are plants. Plants are green. Plants are in the garden. Plants are in the park. Plants are nice.`;
  const p = {
    id: "p",
    kind: "writing",
    domain: "Writing",
    reason: "same-task",
    keyUse: "Explain",
    earlier: { text: short, source: "typed" },
    later: { text: padded, source: "typed" },
  };
  for (const cmp of [X.comparePair(p, { compareWork: ENGINE.compareWork }), X.comparePair(p)])
    for (const c of allStatements(cmp))
      assert.ok(!X.LENGTH_WORDING.test(c.text.join(" ")), c.text[0]);
  seed();
  const m = await model();
  for (const pr of m.pairs)
    for (const cmp of [X.comparePair(pr, { compareWork: ENGINE.compareWork }), X.comparePair(pr)])
      for (const c of allStatements(cmp))
        assert.ok(!X.LENGTH_WORDING.test(c.text.join(" ")), c.text[0]);
  const page = toHtml(UI.changesHTML(I, X.comparePair(m.writing[0])));
  assert.match(page, /Longer is not automatically better/);
});

test("speaking statements, suggestions, the packet and the page never mention accent, speed, pace or pauses", async () => {
  seed();
  const m = await model();
  assert.ok(m.speaking.length >= 1);
  const comparisons = {};
  for (const p of m.speaking) {
    for (const cmp of [X.comparePair(p, { compareWork: ENGINE.compareWork }), X.comparePair(p)]) {
      comparisons[p.id] = cmp;
      for (const c of allStatements(cmp))
        assert.ok(!X.SPEECH_WORDING.test(c.text.join(" ")), c.text.join(" / "));
      for (const n of cmp.notes) assert.ok(!X.SPEECH_WORDING.test(n.join(" ")), n[0]);
      assert.ok(!X.SPEECH_WORDING.test(EV.packetText(p, cmp, null)), "packet");
      const extra = {
        reflection: R.reflectionFor(m.tm, p.id),
        urls: {},
        canRecord: true,
        recording: "",
        inClass: true,
        share: {},
      };
      for (const lang of ["en", "es"]) {
        const text = toHtml(UIS.speakingPairHTML(makeI18n(lang), "6-8", m, p, cmp, extra)).replace(
          /<[^>]+>/g,
          " ",
        );
        assert.ok(!X.SPEECH_WORDING.test(text), `${lang}: ${text.match(X.SPEECH_WORDING)?.[0]}`);
      }
    }
  }
  for (const s of EV.suggestions({ items: m.items, pairs: m.speaking, comparisons, tm: m.tm }))
    assert.ok(!X.SPEECH_WORDING.test([...s.text, ...s.because].join(" ")), s.text[0]);
  for (const w of [
    "Your accent improved",
    "You spoke faster",
    "fewer pauses",
    "a steadier pace",
    "habla más rápido",
    "menos pausas",
    "tu acento",
  ])
    assert.ok(X.SPEECH_WORDING.test(w), `detector misses: ${w}`);
  // speech-recognition words are labelled until the learner confirms them
  const rivers = m.speaking.find((p) => p.earlier.id === "s:spk-rivers:take-old");
  const html = toHtml(
    UIS.speakingPairHTML(I, "6-8", m, rivers, X.comparePair(rivers), {
      reflection: {},
      urls: {},
      canRecord: false,
      recording: "",
      inClass: false,
      share: {},
    }),
  );
  assert.match(html, /Speech-recognition text\. It may contain errors/);
  assert.match(html, /data-tm-verify="s:spk-rivers:take-old"/);
  assert.match(
    html,
    /no longer kept on this device/,
    "no audio in this test, so both recordings read as expired",
  );
  assert.match(html, /My teacher wrote:.*Clear main idea\./s);
});

test("a new-context task keeps the goal, changes the context, and is saved as a new loop that becomes the newest piece", async () => {
  seed();
  let m = await model();
  const from = m.items.find((x) => x.id === "w:wrt-plants:v2");
  const ch = CH.challengeFor(from, { transferFor: ENGINE.transferFor });
  assert.equal(from.prompt, "Explain why plants need sunlight.");
  assert.equal(ch.prompt[0], "Explain how reduced sunlight could affect an ecosystem.");
  assert.equal(ch.keyUse, "Explain");
  assert.equal(ch.domain, "Writing");
  assert.ok(ch.prompt[1] && ch.prompt[1] !== ch.prompt[0], "Spanish prompt");
  const loopsBefore = JSON.parse(storage.get(`${P}:intel`)).loops;
  const studio = storage.get(`${P}:studio`);
  const intel = LOOP.loadIntel();
  const tm = R.loadTM();
  assert.equal(CH.saveChallenge(intel, tm, ch, { text: "too short" }, { ledger: false }), null);
  const saved = CH.saveChallenge(
    intel,
    tm,
    ch,
    {
      text: "With less sunlight, plants make less food, so the animals that eat them have less to eat.",
      supports: {},
    },
    { ledger: false, now: "2026-11-10T09:00:00.000Z" },
  );
  LOOP.saveIntel(intel);
  R.saveTM(tm);
  assert.equal(saved.loop.src, "time-machine");
  assert.equal(saved.entry.independent, true, "help closed");
  const after = JSON.parse(storage.get(`${P}:intel`)).loops;
  assert.deepEqual(after.la, loopsBefore.la, "the earlier loop is untouched");
  assert.equal(Object.keys(after).length, Object.keys(loopsBefore).length + 1);
  assert.equal(storage.get(`${P}:studio`), studio);
  m = await model();
  const newest = m.items.at(-1);
  assert.equal(newest.id, `l:${saved.loop.id}:transfer`);
  assert.equal(newest.stage, "transfer");
  assert.equal(newest.src, "time-machine");
  assert.equal(newest.independent, true);
  const pair = m.pairs.find((p) => p.id === C.pairId(from, newest));
  assert.ok(pair, "the new piece is paired with the work it came from");
  assert.equal(pair.reason, "same-goal");
  // opening help marks the work supported
  const ch2 = CH.challengeFor(newest, { transferFor: ENGINE.transferFor, done: [ch.id] });
  assert.notEqual(ch2.prompt[0], ch.prompt[0]);
  const helped = CH.saveChallenge(
    intel,
    tm,
    ch2,
    { text: "This is my answer with the frames open.", supports: { frames: true } },
    { ledger: false, now: "2026-11-11T09:00:00.000Z" },
  );
  assert.equal(helped.entry.independent, false);
  const picked = toHtml(
    UIM.challengeHTML(
      I,
      "6-8",
      from,
      ch,
      { text: "", help: false, saved: "" },
      { frames: CH.helpFrames("Explain"), canRecord: false },
    ),
  );
  assert.match(picked, /Help is closed/);
  assert.ok(
    !picked.includes(CH.helpFrames("Explain")[0]),
    "frames are not on the page until help is opened",
  );
});

test("a reflection is saved per pair under the feature's own key and shows in the door and the packet", async () => {
  seed();
  const m = await model();
  const pair = m.writing.find((p) => p.later.id === "w:wrt-plants:v2");
  assert.equal(R.PROMPTS.length, 4);
  assert.deepEqual(
    R.PROMPTS.map((p) => p.q[0]),
    [
      "What improved?",
      "What strategy helped?",
      "What remains challenging?",
      "What is my next goal?",
    ],
  );
  const tm = R.loadTM();
  R.setAnswer(tm, pair.id, "improved", "I explained why with because.");
  R.setAnswer(tm, pair.id, "goal", "Use an example next time.");
  R.setAudio(tm, pair.id, "strategy", "take-reflect");
  R.setAnswer(tm, pair.id, "nonsense", "ignored");
  R.saveTM(tm);
  const stored = JSON.parse(storage.get(R.TM_KEY));
  assert.ok(R.TM_KEY.startsWith("accessPracticeLab:"), "travels in the Passport export");
  assert.deepEqual(Object.keys(stored.reflections[pair.id].answers).sort(), ["goal", "improved"]);
  const list = R.listReflections(R.loadTM());
  assert.equal(list.length, 1);
  assert.match(
    toHtml(UIM.doorHTML(I, "6-8", { pairs: m.pairs.length, reflections: list })),
    /I explained why with because\./,
  );
  assert.match(
    toHtml(UIM.doorHTML(I, "6-8", { pairs: m.pairs.length, reflections: list })),
    new RegExp(`data-tm-door-count="${m.pairs.length}"`),
  );
  const packet = EV.packetText(
    pair,
    X.comparePair(pair, { compareWork: ENGINE.compareWork }),
    R.reflectionFor(R.loadTM(), pair.id),
  );
  assert.match(packet, /What improved\? I explained why with because\./);
  assert.match(packet, /What strategy helped\? \(recorded answer kept on the learner's device\)/);
  R.setAnswer(tm, pair.id, "improved", "");
  R.setAnswer(tm, pair.id, "goal", " ");
  R.setAudio(tm, pair.id, "strategy", "");
  assert.equal(tm.reflections[pair.id], undefined, "an emptied reflection is not kept");
});

test("permissions: the packet has both texts, dates, support context and quotes, no name; nothing is sent without the share action", async () => {
  seed();
  const m = await model();
  const pair = m.writing.find((p) => p.later.id === "w:wrt-plants:v2");
  const cmp = X.comparePair(pair, { compareWork: ENGINE.compareWork });
  const packet = EV.packetText(pair, cmp, null);
  for (const part of [
    EARLY,
    REVISED,
    "2026-09-02",
    "2026-09-09",
    "on my own",
    "a revision after feedback (supported)",
    "Explain why plants need sunlight.",
    cmp.changes[0].afterQuote || cmp.changes[0].beforeQuote,
  ])
    assert.ok(packet.includes(part), `packet lacks: ${part}`);
  assert.ok(!/Zuleyma|Testname/.test(packet), "no name in the shared text");
  assert.ok(!/Zuleyma|Testname/.test(EV.packetLabel(pair)));
  assert.ok(packet.length <= 3900);
  // Rendering every section makes no request to the class server.
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    throw new Error("offline");
  };
  try {
    const view = await load("src/views/time-machine.js");
    for (const tab of ["writing", "speaking", "challenge", "reflections", "evidence"]) {
      const out = await view.render({
        band: "6-8",
        prefs: {},
        route: {
          view: "time-machine",
          id: "",
          sub: "",
          tab,
          q: tab === "challenge" ? { from: "w:wrt-plants:v2" } : {},
        },
      });
      assert.ok(toHtml(out.html).includes("tm-page"));
    }
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.deepEqual(
    calls.filter((u) => /\/api\//.test(u)),
    [],
    "no class API call while rendering",
  );
  // The only caller of shareWithClass in this feature is the click on the share button.
  const dir = new URL("src/timemachine/", LAB);
  for (const f of readdirSync(dir))
    assert.ok(
      !/shareWithClass|fetch\(/.test(readFileSync(new URL(f, dir), "utf8")),
      `${f} must not send anything`,
    );
  const viewSrc = readFileSync(new URL("src/views/time-machine.js", LAB), "utf8");
  assert.equal(viewSrc.match(/shareWithClass\(/g).length, 1);
  assert.match(viewSrc, /data-tm-share\]"\);\s*if \(shareBtn\) return \(share\(/);
  assert.ok(!/fetch\(/.test(viewSrc));
});

test("evidence view: nothing to compare under two pieces; otherwise evidence, support history, transfer and grounded suggestions, no score", async () => {
  seed();
  storage.set(
    `${P}:studio`,
    JSON.stringify({
      v: 1,
      writing: {
        "wrt-plants": { versions: [{ id: "v1", t: "2026-09-02T14:00:00.000Z", text: EARLY }] },
      },
    }),
  );
  storage.remove(`${P}:intel`);
  let m = await model();
  assert.equal(m.pairs.length, 0);
  const none = toHtml(
    UIM.evidenceHTML(I, "6-8", EV.buildEvidence({ items: m.items, pairs: m.pairs, tm: m.tm }), []),
  );
  assert.match(none, /not enough to compare yet/i);
  assert.match(none, /Do a first writing task/);
  assert.match(toHtml(UI.emptyHTML(I, "6-8", "writing", m.items)), /Not enough to compare yet/);
  assert.match(
    toHtml(UIM.doorHTML(I, "6-8", { pairs: 0, reflections: [] })),
    /Not enough to compare yet/,
  );

  seed();
  m = await model();
  const comparisons = Object.fromEntries(
    m.pairs.map((p) => [p.id, X.comparePair(p, { compareWork: ENGINE.compareWork })]),
  );
  const ev = EV.buildEvidence({ items: m.items, pairs: m.pairs, comparisons, tm: m.tm });
  assert.ok(ev.enough);
  assert.ok(ev.revisions.some((x) => x.id === "w:wrt-plants:v2"));
  assert.ok(ev.transfers.some((x) => x.id === "l:la:transfer" && x.independent));
  assert.ok(ev.suggestions.length >= 1);
  for (const s of ev.suggestions) {
    assert.ok(s.text[0] && s.text[1] && s.because[0] && s.because[1], s.id);
    assert.match(s.because[0], /\d{4}-\d{2}-\d{2}|“/, `${s.id} names its evidence`);
  }
  for (const lang of ["en", "es"]) {
    const page = toHtml(UIM.evidenceHTML(makeI18n(lang), "6-8", ev, m.reflections)).replace(
      /<[^>]+>/g,
      " ",
    );
    assert.ok(
      !/\d\s?%|\bLevel \d|\bNivel \d|\bscore of\b|\bpoints\b|\bpuntos\b|proficien|WIDA level/i.test(
        page,
      ),
      page.match(/\d\s?%|Level \d|points|proficien/i)?.[0],
    );
    assert.ok(!/Zuleyma/.test(page));
  }
  const page = toHtml(UIM.evidenceHTML(I, "6-8", ev, m.reflections));
  for (const h of [
    "Comparable evidence and response changes",
    "Support history",
    "Revision activity",
    "Independent transfer",
    "Suggested next instruction",
    "Because:",
  ])
    assert.ok(page.includes(h), h);
});

test("marking quotes keeps the text whole and marks each quote where it sits", () => {
  const text = "Plants need sunlight because they make food. However, leaves turn yellow.";
  const segs = X.markQuotes(text, [
    { id: "b0", quote: "because they make food" },
    { id: "b1", quote: "because" },
    { id: "b2", quote: "However" },
    { id: "b3", quote: "not there" },
  ]);
  assert.equal(segs.map((s) => s.text).join(""), text);
  assert.deepEqual(
    segs.filter((s) => s.mark !== null).map((s) => s.mark),
    ["b0", "b2"],
  );
  assert.deepEqual(X.supportLabel({ independent: true, used: [] }), ["on my own", "por mi cuenta"]);
  assert.equal(
    X.supportLabel({ independent: false, stage: "first", used: ["frames"] })[0],
    "with sentence frames",
  );
});
