#!/usr/bin/env node
/**
 * Journey "Conversation Reality" (converse) and "Living Writing" (compose): the pure engines and the DOM modules.
 * Engines run in node against the real m08 pack; the two UI modules render and mount in jsdom (skipped when jsdom is missing).
 */
import assert from "node:assert/strict";
import test from "node:test";
import m08 from "../access-practice-lab/src/content/journey/m08.js";
import * as W from "../access-practice-lab/src/journey/engines/compose.js";
import * as C from "../access-practice-lab/src/journey/engines/converse.js";
import { toHtml } from "../access-practice-lab/src/util.js";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";

const g35 = m08.bands["3-5"];
const g68 = m08.bands["6-8"];
const discuss = g35.communicate;
const speak = g68.communicate;
const show35 = g35.show;
const show68 = g68.show;
const EXPLAIN = { keyUse: "Explain" };

const noScore = (value, where) => {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  assert.doesNotMatch(text, /\bscor(?:e|es|ed|ing)\b/i, `${where} must not mention a score`);
  assert.doesNotMatch(text, SCORE_CLAIM, `${where} must not claim a level`);
};

/** Run a whole conversation, returning every reply. */
function converse(task, texts, opts = EXPLAIN) {
  let state = C.init(task);
  const replies = [];
  for (const text of texts) {
    const r = C.reply(task, state, text, opts);
    state = r.state;
    replies.push(r);
  }
  return { state, replies };
}
const first = (task, text) => C.reply(task, C.init(task), text, EXPLAIN);

// ── converse: lines ───────────────────────────────────────────────────────────
test("converse m08 3-5: sun, water and soil each get their own ack and THAT line's probe", () => {
  const cases = {
    sun: "I think the sunlight is the cause of the yellow plants in the garden.",
    water: "I think Bed 2 is not getting enough water for the bean plants.",
    soil: "I think the soil in Bed 2 is the problem for the bean plants.",
  };
  for (const [id, text] of Object.entries(cases)) {
    const line = discuss.lines.find((l) => l.id === id);
    const r = first(discuss, text);
    assert.equal(r.matchedLine, id, `${id} matched`);
    assert.equal(r.kind, "ack+probe", `${id} asks its probe`);
    assert.ok(r.partnerLine.startsWith(line.ack), `${id} ack`);
    assert.ok(r.partnerLine.endsWith(line.probe), `${id} probe`);
    assert.ok(text.includes(r.quote) && r.quote.length > 8, `${id} echoes the learner's own words`);
    assert.ok(r.partnerLine.includes(`“${r.quote}”`));
  }
});

test("converse m08 6-8 (speak): soil, sun, water and temperature lines are all recognised", () => {
  const cases = {
    soil: "The trucks compacted the soil so the roots could not drain the water.",
    sun: "The new gym wing casts a shadow on the beds in the afternoon.",
    water: "I wonder if the irrigation watering changed between the two years.",
    temp: "Maybe the weather was hotter this year and the temperature hurt the plants.",
  };
  for (const [id, text] of Object.entries(cases)) {
    const line = speak.lines.find((l) => l.id === id);
    const r = first(speak, text);
    assert.equal(r.matchedLine, id, `${id} matched`);
    assert.ok(r.partnerLine.includes(line.ack), `${id} ack`);
    assert.ok(
      r.partnerLine.endsWith(line.probe) || r.kind === "followUp",
      `${id} probe or follow-up`,
    );
  }
  // the line with the most term hits wins
  const mixed = first(
    speak,
    "The water pools on the compacted soil and the roots cannot drain, and I saw some sun too.",
  );
  assert.equal(mixed.matchedLine, "soil");
});

test("converse: evidence present -> follow-up for the first missing move, different per gap", () => {
  const needsCause = first(discuss, "Bed 1 gets 7 hours of sun and Bed 2 gets 2 hours of sun.");
  assert.equal(needsCause.kind, "followUp");
  assert.ok(needsCause.partnerLine.endsWith(discuss.followUps.cause));
  assert.deepEqual(needsCause.movesMissing.slice(0, 1), ["cause"]);

  const needsChain = first(
    discuss,
    "The shade from the oak tree blocks the light because the tree is tall.",
  );
  assert.ok(needsChain.partnerLine.endsWith(discuss.followUps.chain));
  assert.equal(needsChain.movesMissing[0], "chain");

  const needsSupport = first(
    discuss,
    "The oak tree blocks the light because it is tall, and then the beans cannot make food so they stay small.",
  );
  assert.ok(needsSupport.partnerLine.endsWith(discuss.followUps.support));
  assert.equal(needsSupport.movesMissing[0], "support");

  assert.equal(
    new Set(
      [needsCause, needsChain, needsSupport].map((r) =>
        r.partnerLine.split("“").at(-1).split("”").at(-1),
      ),
    ).size,
    3,
  );
});

test("converse: the same probe is not asked twice for one line", () => {
  const { replies } = converse(discuss, [
    "I think the sunlight is the cause of the yellow plants.",
    "I still think the sunlight is the cause of the plants being yellow.",
  ]);
  assert.equal(replies[0].kind, "ack+probe");
  assert.notEqual(replies[1].kind, "ack+probe");
  assert.ok(!replies[1].partnerLine.includes(discuss.lines[0].probe));
});

// ── converse: clarify, turns, close ───────────────────────────────────────────
test("converse: off-topic or very short replies get a clarification and never count as a turn", () => {
  for (const text of ["pizza and my dog is happy today at home ok", "soil", "ok"]) {
    const r = first(discuss, text);
    assert.equal(r.kind, "clarify", text);
    assert.equal(r.state.turnCount, 0);
    assert.equal(r.countsTurn, false);
    assert.match(r.partnerLine, /^I want to make sure I understand — can you say more about /);
  }
  assert.match(first(discuss, "soil").partnerLine, /“soil”/);
  assert.match(
    first(discuss, "pizza and my dog is happy today at home ok").partnerLine,
    /“sunlight”/,
  );
  // two clarifications in a row do not use up the three turns
  const run = converse(discuss, [
    "pizza and my dog is happy today at home ok",
    "I think the sunlight is the cause of the yellow plants.",
    "water",
    "Bed 2 gets 2 hours of sun because the oak tree blocks the light.",
    "The beans cannot make food so they stay small and yellow.",
  ]);
  assert.deepEqual(
    run.replies.map((r) => r.kind),
    ["clarify", "ack+probe", "clarify", "followUp", "close"],
  );
  assert.equal(run.state.turnCount, 3);
  assert.equal(run.state.ended, true);
});

test("converse: nobody is stuck after repeated clarifications", () => {
  const run = converse(discuss, ["hmm okay", "hmm okay sure", "hmm okay sure yes"]);
  assert.deepEqual(
    run.replies.map((r) => r.kind),
    ["clarify", "clarify", "ack+probe"].map((k, i) => (i < 2 ? k : run.replies[2].kind)),
  );
  assert.equal(run.replies[2].countsTurn, true);
});

test("converse: after maxTurns the partner closes with ONE real strength in the learner's own words", () => {
  const texts = [
    "I think the sunlight is the cause of the yellow plants.",
    "Bed 2 gets only 2 hours of sun because the oak tree blocks the light.",
    "The beans cannot make food so they stay small.",
  ];
  const { state, replies } = converse(discuss, texts);
  const close = replies.at(-1);
  assert.equal(close.kind, "close");
  assert.equal(state.ended, true);
  assert.match(close.partnerLine, /One thing you did well: /);
  assert.ok(
    texts.some((t) => t.includes(close.strength.quote)),
    "the strength quotes the learner",
  );
  assert.ok(close.partnerLine.includes(`“${close.strength.quote}”`));
  assert.equal(close.partnerLine.match(/One thing you did well/g).length, 1);
  noScore(close.partnerLine, "close");
  // no more replies after the end
  const after = C.reply(discuss, state, "Another idea about the soil in the beans.", EXPLAIN);
  assert.equal(after.partnerLine, "");
  assert.equal(after.state.turns.length, state.turns.length);
});

test("converse: replies are deterministic and a label such as 'Bed 2' is not counted as data", () => {
  const texts = [
    "I think the water is the problem for Bed 2.",
    "Bed 2 gets two cups of water and Bed 1 gets two cups too.",
    "The soil is dark and crumbly in both beds.",
  ];
  const a = converse(discuss, texts);
  const b = converse(discuss, texts);
  assert.deepEqual(a, b);
  assert.equal(first(discuss, "I think the water is the problem for Bed 2.").kind, "ack+probe");
});

test("converse: independent changes only the analysis stage and the ledger stage", () => {
  const text = "I think the sunlight is the cause of the yellow plants.";
  const help = C.reply(discuss, C.init(discuss), text, { keyUse: "Explain", independent: false });
  const own = C.reply(discuss, C.init(discuss), text, { keyUse: "Explain", independent: true });
  assert.equal(own.partnerLine, help.partnerLine);
  assert.equal(own.analysis.stage, "independent");
  assert.equal(help.analysis.stage, "supported");
  assert.ok(
    own.analysis.nextMoves.every((m) => !m.frame),
    "no frames leak into independent feedback",
  );
});

test("converse: retry replaces the last reply, keeps the first try, and stays deterministic", () => {
  const texts = ["I think the sunlight is the cause of the yellow plants.", "Bed 2 gets shade."];
  const { state } = converse(discuss, texts);
  const better = "Bed 2 gets only 2 hours of sun because the oak tree blocks the light.";
  const r = C.retry(discuss, state, better, EXPLAIN);
  assert.equal(r.replaced, "Bed 2 gets shade.");
  assert.deepEqual(r.state.drafts, [{ turn: 1, text: "Bed 2 gets shade." }]);
  assert.deepEqual(C.learnerTexts(r.state), [texts[0], better]);
  assert.equal(r.state.turnCount, 2);
  assert.deepEqual(C.retry(discuss, state, better, EXPLAIN), r);
  assert.equal(r.state.turns.filter((t) => t.who === "learner").length, 2);
});

test("converse: doneCriteria needs a finished exchange AND the minimum words; ledger entry is honest", () => {
  const fresh = C.init(discuss);
  assert.equal(C.doneCriteria(discuss, fresh).ok, false);
  const texts = [
    "I think the sunlight is the cause of the yellow plants.",
    "Bed 2 gets only 2 hours of sun because the oak tree blocks the light.",
    "The beans cannot make food so they stay small.",
  ];
  const { state } = converse(discuss, texts);
  const crit = C.doneCriteria(discuss, state);
  assert.equal(crit.ok, true);
  assert.ok(crit.words >= discuss.minWords && crit.needWords === 0);
  const short = { ...state, turns: state.turns.filter((t) => t.who === "partner") };
  assert.equal(C.doneCriteria(discuss, short).ok, false);

  const own = C.ledgerEntry({
    task: discuss,
    state,
    missionId: "m08",
    band: "3-5",
    keyUse: "Explain",
    independent: true,
  });
  assert.equal(own.src, "mission");
  assert.equal(own.task, "m08.communicate");
  assert.equal(own.kind, "first");
  assert.equal(own.stage, "independent");
  assert.ok(own.m.words > 0);
  const helped = C.ledgerEntry({
    task: discuss,
    state,
    missionId: "m08",
    band: "3-5",
    keyUse: "Explain",
    independent: true,
    supports: ["frames", "evidence"],
  });
  assert.equal(helped.stage, "supported");
  assert.deepEqual(helped.supports, { frames: true, bank: true });
  const spoken = C.ledgerEntry({
    task: speak,
    state,
    missionId: "m08",
    step: "show",
    band: "6-8",
    keyUse: "Explain",
  });
  assert.equal(spoken.src, "speaking");
  assert.equal(spoken.task, "m08.show");
  assert.equal(spoken.kind, "transfer");
  assert.ok(!JSON.stringify(own).includes("sunlight"), "the ledger holds no learner words");
});

test("converse: partner lines never mention a score or level", () => {
  for (const task of [discuss, speak]) {
    const texts = [
      "I think the sunlight and shade cause the problem for the yellow plants.",
      "pizza",
      "The gym wing blocks sun for 4 of 8 hours because it makes a big shadow.",
      "The roots cannot get enough food so the yield dropped.",
    ];
    for (const r of converse(task, texts).replies) noScore(r.partnerLine, "partner line");
  }
});

// ── compose ───────────────────────────────────────────────────────────────────
const WEAK35 = "Plants are sad.";
const STRONG35 =
  "The tomato plants droop in the afternoon because the soil is dry and cracked. The pots sit in full sun, so the water dries up fast. After watering, the plants stand up again. This shows the plants droop because they need water.";
const WEAK68 = "The fish died. It was bad for the pond and everyone was sad about it.";
const STRONG68 =
  "The fish in the neighborhood pond died because oxygen fell from 8 to 2 milligrams per liter during a week of heavy algae growth. The water temperature was normal, so heat was not the cause. Dead algae on the bottom used up oxygen as they decomposed, which means the fish could not breathe. Therefore the oxygen shortage caused by the algae bloom killed the fish.";

for (const [name, task, weak, strong] of [
  ["3-5", show35, WEAK35, STRONG35],
  ["6-8", show68, WEAK68, STRONG68],
]) {
  test(`compose ${name}: analyze finds spans of the learner's own words (strong vs weak)`, () => {
    const s = W.analyze(task, strong);
    const w = W.analyze(task, weak);
    assert.deepEqual(s.missing, [], "strong draft makes every required move");
    assert.ok(w.missing.length >= 3, "weak draft misses several moves");
    for (const o of [...s.overlays, ...w.overlays]) {
      assert.equal(
        o.text,
        (strong + weak).includes(o.text) ? o.text : "",
        "overlay text is learner text",
      );
      assert.ok(o.start >= 0 && o.end > o.start && o.label);
    }
    for (const o of s.overlays) assert.equal(strong.slice(o.start, o.end), o.text);
    for (const kind of ["claim", "reason", "evidence", "connector"])
      assert.ok(s.counts[kind] > 0, `strong draft has ${kind} spans`);
    assert.ok(s.overlays.some((o) => o.kind === "connector" && o.job === "cause"));
    assert.ok(s.counts.evidence > (w.counts.evidence || 0));
    assert.equal(s.keyUse, "Explain");
  });

  test(`compose ${name}: structureMap lists what is present and what is not yet, as questions`, () => {
    const sm = W.structureMap(task, W.analyze(task, strong));
    assert.deepEqual(
      sm.boxes.map((b) => b.id),
      task.organizer,
    );
    assert.deepEqual(sm.notYet, []);
    for (const b of sm.boxes)
      assert.ok(strong.includes(b.quote) && b.quote.length > 3, `${b.id} quotes the draft`);
    const wm = W.structureMap(task, W.analyze(task, weak));
    assert.ok(wm.notYet.length >= 3 && wm.present.length < wm.boxes.length);
    for (const n of wm.notYet)
      assert.ok(n.question && !/^(The|It) /.test(n.question), `${n.id} is a question`);
    assert.ok(wm.notYet.some((n) => Object.values(task.readerQuestions).includes(n.question)));
    assert.match(wm.shape, /→/);
    noScore(wm, "structure map");
  });

  test(`compose ${name}: readerQuestion asks for the first missing move, uses the learner's words, moves on when asked`, () => {
    const a = W.analyze(task, weak);
    const q = W.readerQuestion(task, a);
    assert.equal(q.moveId, a.missing[0]);
    assert.ok(q.question.endsWith(task.readerQuestions[q.moveId]));
    assert.ok(q.anchor && weak.includes(q.anchor.quote) && q.question.includes(q.anchor.quote));
    const next = W.readerQuestion(task, a, { asked: [q.moveId] });
    assert.equal(next.moveId, a.missing[1]);
    assert.notEqual(next.question, q.question);
    assert.equal(
      W.readerQuestion(task, a, { asked: a.missing }).moveId,
      a.missing[0],
      "repeats rather than going silent",
    );
    const done = W.readerQuestion(task, W.analyze(task, strong));
    assert.equal(done.moveId, null);
    assert.match(done.question, /\?$/);
    assert.equal(W.readerQuestion(task, W.analyze(task, "")).anchor, null);
    noScore(q, "reader question");
  });

  test(`compose ${name}: compareVersions explains what changed and why, with the learner's own quotes`, () => {
    const c = W.compareVersions(weak, strong, { task });
    assert.ok(c.gainedMoves.length >= 3);
    const moveReasons = c.reasons.filter((r) => r.kind === "move");
    assert.ok(moveReasons.length >= 3);
    assert.ok(moveReasons.some((r) => r.id === "cause"));
    for (const r of c.reasons) {
      assert.ok(r.en && r.es && r.text === r.en, "bilingual plain-language line");
      if (r.quote) assert.ok(strong.includes(r.quote), `${r.id} quotes the new draft`);
    }
    assert.ok(
      c.reasons.every((r) => /help|Is it still there/.test(r.en)),
      "each line says why it helps",
    );
    assert.ok(
      c.changed.after.length > 0 &&
        c.changed.after.every((s) => strong.slice(s.start, s.end) === s.text),
    );
    assert.ok(c.changed.before.every((s) => weak.slice(s.start, s.end) === s.text));
    noScore(c.reasons, "reasons");
    noScore(c.changed, "changed spans");
    // a regression is a question, not an error
    const back = W.compareVersions(strong, weak, { task });
    assert.ok(back.reasons.some((r) => r.kind === "check" && r.en.endsWith("?")));
    const same = W.compareVersions(strong, strong, { task });
    assert.equal(same.unchanged, true);
    assert.deepEqual(same.reasons, []);
  });
}

test("compose: numbers and quotes copied from the evidence bank are marked", () => {
  const task = {
    ...show68,
    evidenceBank: [
      {
        id: "e1",
        text: "Oxygen readings fell from 8 to 2 milligrams per liter during a week of heavy algae growth.",
        kind: "fact",
      },
      {
        id: "e2",
        text: "Volunteers found many dead algae on the bottom of the pond.",
        kind: "quote",
      },
    ],
  };
  const a = W.analyze(task, STRONG68);
  assert.ok(a.overlays.some((o) => o.label === "Number from the evidence" && o.text === "8"));
  assert.ok(
    a.overlays.some(
      (o) => o.kind === "evidence" && /oxygen fell from 8|milligrams per liter/i.test(o.text),
    ),
  );
  // "Bed 2" style labels are not numbers from the bank
  assert.ok(
    !W.analyze(
      { ...task, evidenceBank: [{ id: "x", text: "Bed 2 gets 2 hours of sun.", kind: "fact" }] },
      "Bed 2 was in the shade.",
    ).overlays.some((o) => o.label === "Number from the evidence"),
  );
});

test("compose: state, versions, doneCriteria and ledger entry", () => {
  let s = W.init(show35);
  s = W.setDraft(s, WEAK35);
  s = W.useBox(s, "cause");
  assert.equal(s.organizer.cause, true);
  assert.match(W.starterFor("cause"), /___/);
  s = W.strengthen(s, STRONG35, { at: "t1" });
  assert.deepEqual(
    s.versions.map((v) => v.label),
    ["first draft", "revision"],
  );
  assert.equal(s.versions[0].text, WEAK35);
  assert.equal(s.draft, STRONG35);
  assert.equal(s.revisedFrom, 0);
  assert.equal(W.strengthen(s, STRONG35).versions.length, 2, "an unchanged draft adds no version");
  assert.equal(W.doneCriteria(show35, W.setDraft(W.init(), WEAK35)).ok, false);
  assert.equal(W.doneCriteria(show35, s).ok, true);
  assert.equal(W.markReaderAsked(s, "cause").readerAsked[0], "cause");

  const first = W.ledgerEntry({
    task: show35,
    state: W.setDraft(W.init(), STRONG35),
    missionId: "m08",
    band: "3-5",
    independent: true,
  });
  assert.equal(first.src, "writing");
  assert.equal(first.kind, "first");
  assert.equal(first.stage, "independent");
  assert.equal(
    W.ledgerEntry({ task: show35, state: s, missionId: "m08", band: "3-5" }).kind,
    "revision",
  );
  const transfer = W.ledgerEntry({
    task: show35,
    state: s,
    missionId: "m08",
    step: "show",
    band: "3-5",
    independent: true,
    supports: ["structure"],
  });
  assert.equal(transfer.kind, "transfer");
  assert.equal(transfer.task, "m08.show");
  assert.equal(transfer.stage, "supported");
  assert.deepEqual(transfer.supports, { coach: true });
});

test("highlight keeps overlapping spans in one mark and escapes the learner's text", async () => {
  const { highlight } = await import("../access-practice-lab/src/journey/ui/compose.js");
  const out = highlight("a <b> because c", [
    { start: 6, end: 13, cls: "x", title: "t1" },
    { start: 6, end: 13, cls: "y", title: "t2" },
  ]);
  assert.ok(out.includes("a &lt;b&gt; "));
  assert.equal(out.match(/<mark/g).length, 1);
  assert.match(out, /class="x y"/);
});

// ── DOM: converse and compose in jsdom ────────────────────────────────────────
const jsdom = await import("jsdom").catch(() => null);
const dom = jsdom
  ? new jsdom.JSDOM("<!doctype html><body></body>", { pretendToBeVisual: true })
  : null;
const domTest = (name, fn) => test(name, { skip: dom ? false : "jsdom is not installed" }, fn);

const I = { T: (en) => en, S: (en) => en };
function setup({
  task,
  band = "3-5",
  support = "A",
  independent = false,
  step = "communicate",
  data = {},
  pack,
}) {
  const calls = { updates: [], helps: [], done: [], ledger: [], announce: [] };
  const env = {
    I,
    band,
    support,
    independent,
    step,
    task,
    data,
    missionId: "m08",
    mission: { klu: "Explain" },
    pack: pack || (band === "3-5" ? g35 : g68),
    update: (p) => calls.updates.push(p),
    help: (id) => calls.helps.push(id),
    done: (r) => calls.done.push(r),
    ledger: (e) => calls.ledger.push(e),
    announce: (m) => calls.announce.push(m),
  };
  return { env, calls };
}
async function mounted(mod, opts) {
  const { Event } = dom.window;
  const { env, calls } = setup(opts);
  const root = dom.window.document.createElement("div");
  dom.window.document.body.append(root);
  root.innerHTML = toHtml(mod.render(opts.task, env));
  const cleanup = mod.mount(root, env);
  const q = (sel) => root.querySelector(sel);
  const type = (sel, text) => {
    const el = q(sel);
    el.value = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const submit = () =>
    q("[data-jt-form]").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  return { root, env, calls, q, type, submit, cleanup };
}
const withGlobals = async (extra, fn) => {
  const saved = {
    window: globalThis.window,
    document: globalThis.document,
    navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator"),
  };
  globalThis.window = Object.assign(dom.window, extra.window || {});
  globalThis.document = dom.window.document;
  if (extra.navigator)
    Object.defineProperty(globalThis, "navigator", { value: extra.navigator, configurable: true });
  try {
    return await fn();
  } finally {
    globalThis.window = saved.window;
    globalThis.document = saved.document;
    if (saved.navigator) Object.defineProperty(globalThis, "navigator", saved.navigator);
    delete dom.window.MediaRecorder;
  }
};

domTest("converse UI (typed): a full conversation, honest labels, supports, finish", async () => {
  const ui = await import("../access-practice-lab/src/journey/ui/converse.js");
  await withGlobals({}, async () => {
    const t = await mounted(ui, { task: discuss });
    assert.match(t.root.textContent, /Practice partner · rule-based, runs on this device/);
    noScore(t.root.textContent, "converse screen");
    assert.equal(t.q("[data-jt-log]").getAttribute("aria-live"), "polite");
    // role="log" on the <ol> would strip its list semantics and leave every bubble an orphan <li> (axe "listitem").
    assert.equal(t.q("[data-jt-log]").tagName, "OL");
    assert.equal(t.q("[data-jt-log]").getAttribute("role"), null);
    assert.equal(t.q("[data-jt-log]").getAttribute("aria-relevant"), "additions");
    assert.ok(
      t.root.querySelectorAll("[data-jt-log] > li").length >= 1,
      "every bubble is a direct child of the list",
    );
    assert.equal(t.root.querySelectorAll(".jt-partner").length, 1, "the opening line");
    assert.equal(t.q("[data-jt-send]").disabled, true);
    assert.equal(t.q("[data-jt-rec-start]"), null, "typed mode has no recorder");
    assert.equal(t.q("[data-jt-retry]"), null, "nothing to retry yet");

    // supports in A: frames and evidence chips that insert text and record help
    const chip = t.q('[data-jt-help="evidence"] .jt-chip');
    assert.ok(t.q('[data-jt-help="frames"] .jt-chip'));
    chip.click();
    assert.equal(t.q("#jt-input").value, chip.dataset.jtInsert);
    assert.deepEqual(t.calls.helps, ["evidence"]);

    t.type("#jt-input", "I think the sunlight is the cause of the yellow plants.");
    assert.equal(t.q("[data-jt-send]").disabled, false);
    t.submit();
    assert.equal(t.root.querySelectorAll(".jt-me").length, 1);
    assert.equal(t.root.querySelectorAll(".jt-partner").length, 2);
    assert.ok(
      t.root.querySelector(".jt-partner:last-child").textContent.includes(discuss.lines[0].probe),
    );
    assert.ok(t.q("[data-jt-retry]"), "Try saying it again appears after a reply");
    assert.equal(t.q("#jt-input").value, "");

    // try again replaces the last turn and keeps the first try
    t.q("[data-jt-retry]").click();
    assert.equal(t.q("#jt-input").value, "I think the sunlight is the cause of the yellow plants.");
    t.type(
      "#jt-input",
      "I think the sunlight is the cause because the oak tree makes shade on Bed 2.",
    );
    t.submit();
    assert.equal(t.root.querySelectorAll(".jt-me").length, 1);
    assert.ok(t.root.querySelector(".jt-earlier"), "the earlier try stays visible");
    const last = t.calls.updates.at(-1);
    assert.equal(last.state.drafts.length, 1);

    t.type("#jt-input", "Bed 2 gets 2 hours of sun and Bed 1 gets 7 hours.");
    t.submit();
    t.type("#jt-input", "The beans cannot make food so they stay small and yellow.");
    t.submit();
    assert.match(
      t.root.querySelector(".jt-partner:last-child").textContent,
      /One thing you did well/,
    );
    const finish = t.q("[data-jt-finish]");
    assert.equal(finish.disabled, false);
    finish.click();
    assert.equal(t.calls.done.length, 1);
    const result = t.calls.done[0];
    assert.equal(result.mode, "discuss");
    assert.deepEqual(result.supportsUsed, ["evidence"]);
    assert.equal(result.turns, 3);
    assert.equal(result.matchedLine, "sun");
    assert.ok(result.words >= discuss.minWords && result.drafts.length === 1);
    assert.equal(t.calls.ledger.length, 1);
    assert.equal(t.calls.ledger[0].task, "m08.communicate");
    assert.equal(t.calls.ledger[0].stage, "supported");
    finish.click();
    assert.equal(t.calls.done.length, 1, "finishing twice records once");
    t.cleanup?.();
  });
});

domTest("converse UI: C and independent render no frames or evidence chips", async () => {
  const ui = await import("../access-practice-lab/src/journey/ui/converse.js");
  await withGlobals({}, async () => {
    for (const opts of [
      { support: "C" },
      { support: "A", independent: true, step: "show", task: { ...discuss, evidenceBank: [] } },
    ]) {
      const t = await mounted(ui, { task: discuss, ...opts });
      assert.equal(t.root.querySelectorAll(".jt-help, .jt-chip").length, 0);
      t.type("#jt-input", "I think the sunlight is the cause of the yellow plants.");
      t.submit();
      assert.deepEqual(t.calls.helps, []);
    }
  });
});

domTest(
  "converse UI (speak, no MediaRecorder): typed dialogue continues with an honest message",
  async () => {
    const ui = await import("../access-practice-lab/src/journey/ui/converse.js");
    await withGlobals({}, async () => {
      const t = await mounted(ui, { task: speak, band: "6-8", support: "B" });
      assert.equal(t.q("[data-jt-rec-start]"), null);
      assert.match(t.root.textContent, /This browser cannot record/);
      assert.match(t.root.textContent, /does not turn your voice into text/);
      assert.match(t.root.textContent, /Type what you said/);
      assert.equal(t.q("[data-jt-send]").disabled, true, "the transcript is required");
      t.type("#jt-input", "The trucks compacted the soil so water pooled around the roots.");
      assert.equal(t.q("[data-jt-send]").disabled, false);
      t.submit();
      assert.match(t.root.querySelector(".jt-partner:last-child").textContent, /soil/i);
      assert.equal(t.root.querySelectorAll("audio").length, 0);
    });
  },
);

domTest(
  "converse UI (speak): recorder panel with privacy note; a denied microphone hides it and keeps typing",
  async () => {
    const ui = await import("../access-practice-lab/src/journey/ui/converse.js");
    class FakeRecorder {}
    const navigator = {
      mediaDevices: { getUserMedia: () => Promise.reject(new Error("NotAllowedError")) },
    };
    await withGlobals({ window: { MediaRecorder: FakeRecorder }, navigator }, async () => {
      const t = await mounted(ui, { task: speak, band: "6-8", support: "B" });
      assert.ok(t.q("[data-jt-rec-start]"), "recorder offered");
      assert.match(t.root.textContent, /stays on this device/);
      assert.match(t.root.textContent, /nothing judges your voice/);
      t.q("[data-jt-rec-start]").click();
      await new Promise((r) => setTimeout(r, 30));
      assert.equal(t.q("[data-jt-rec-start]"), null, "recording hidden after the denial");
      assert.match(t.root.textContent, /microphone is unavailable/i);
      assert.ok(t.q("#jt-input"), "typing still works");
      assert.ok(t.calls.announce.some((m) => /microphone/i.test(m)));
    });
  },
);

domTest(
  "compose UI: organizer starters, structure overlay, reader question, comparison, submit",
  async () => {
    const ui = await import("../access-practice-lab/src/journey/ui/compose.js");
    const task = {
      ...show68,
      evidenceBank: [
        {
          id: "e1",
          text: "Oxygen readings fell from 8 to 2 milligrams per liter.",
          kind: "number",
        },
      ],
    };
    await withGlobals({}, async () => {
      const t = await mounted(ui, { task, band: "6-8", support: "A", step: "show" });
      assert.match(t.root.textContent, /The town environmental committee/);
      assert.equal(t.root.querySelectorAll("[data-jt-box]").length, task.organizer.length);
      t.q('[data-jt-box="cause"]').click();
      assert.match(t.q("#jt-draft").value, /___ happened because ___\./);
      assert.deepEqual(t.calls.helps, ["frames"]);
      assert.ok(t.q("[data-jt-help='evidence'] .jt-chip"));

      t.type("#jt-draft", WEAK68);
      assert.equal(t.q("[data-jt-submit]").disabled, true, "below the minimum words");
      t.q("[data-jt-structure]").click();
      assert.equal(t.q("[data-jt-structure]").getAttribute("aria-pressed"), "true");
      assert.ok(t.q("[data-jt-mirror]"));
      assert.equal(t.root.querySelectorAll("[data-jt-kind]").length, 5);
      assert.ok(t.root.querySelectorAll(".jt-map li").length >= 3);

      t.q("[data-jt-ask]").click();
      const question = t.q(".jt-question").textContent;
      assert.ok(question.includes("You wrote “") && question.endsWith("?"));
      assert.equal(t.q("[data-jt-compare]").disabled, true, "nothing to compare before an edit");
      t.type("#jt-draft", STRONG68);
      assert.ok(t.q("[data-jt-mirror] mark"), "highlights follow the draft");
      assert.equal(t.q("[data-jt-compare]").disabled, false, "an edit enables the comparison");
      t.q("[data-jt-compare]").click();
      assert.ok(t.root.querySelectorAll(".jt-why li").length >= 3);
      assert.ok(t.root.querySelectorAll(".jt-chg-add").length > 0);
      assert.ok(t.calls.helps.includes("structure") && t.calls.helps.includes("reader"));

      assert.equal(t.q("[data-jt-submit]").disabled, false);
      t.q("[data-jt-submit]").click();
      assert.equal(t.calls.done.length, 1);
      const r = t.calls.done[0];
      assert.equal(r.mode, "write");
      assert.equal(r.text, STRONG68);
      assert.ok(r.supportsUsed.includes("reader") && r.versions.length >= 2);
      assert.equal(t.calls.ledger[0].task, "m08.show");
      assert.equal(t.calls.ledger[0].stage, "supported");
      assert.equal(t.calls.ledger[0].kind, "transfer");
      const saved = t.calls.updates.at(-1);
      assert.equal(saved.finished, true);
      noScore(t.root.textContent, "compose screen");
    });
  },
);

domTest(
  "compose UI: independent hides the overlay, reader, evidence bank and starters",
  async () => {
    const ui = await import("../access-practice-lab/src/journey/ui/compose.js");
    const task = {
      ...show68,
      evidenceBank: [{ id: "e1", text: "Oxygen readings fell from 8 to 2.", kind: "number" }],
    };
    await withGlobals({}, async () => {
      const t = await mounted(ui, {
        task,
        band: "6-8",
        support: "A",
        independent: true,
        step: "show",
      });
      assert.equal(
        t.root.querySelectorAll(
          "[data-jt-structure], [data-jt-ask], [data-jt-box], .jt-chip, .jt-help, .jt-mirror",
        ).length,
        0,
      );
      assert.equal(t.root.querySelectorAll(".jt-box.is-static").length, task.organizer.length);
      assert.doesNotMatch(
        t.root.querySelector(".jt-organizer").textContent,
        /What exactly are you explaining/,
      );
      t.type("#jt-draft", STRONG68);
      assert.equal(t.q("[data-jt-submit]").disabled, false);
      t.q("[data-jt-submit]").click();
      assert.deepEqual(t.calls.helps, []);
      assert.deepEqual(t.calls.done[0].supportsUsed, []);
      assert.equal(t.calls.ledger[0].stage, "independent");
    });
  },
);

domTest("compose UI: saved state resumes mid-draft", async () => {
  const ui = await import("../access-practice-lab/src/journey/ui/compose.js");
  await withGlobals({}, async () => {
    const state = { ...W.init(), draft: STRONG35 };
    const t = await mounted(ui, { task: show35, data: { state, view: true, reader: null } });
    assert.equal(t.q("#jt-draft").value, STRONG35);
    assert.ok(t.q("[data-jt-mirror] mark"));
    assert.equal(t.q("[data-jt-submit]").disabled, false);
  });
});
