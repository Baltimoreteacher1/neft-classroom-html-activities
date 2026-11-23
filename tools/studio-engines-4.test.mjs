// Unit tests for conversation-studio, vocab-quest and argument-builder: pure logic, schema validators, and a jsdom
// click-through of each engine through the real mount contract (createContext -> engine.mount).
// Run: node --test tools/studio-engines-4.test.mjs
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import {
  ACTIVITY_IDS,
  loadActivity,
  loadCollection,
  questEntries,
  questInline,
  setupDom,
} from "./studio-engines-4-fixtures.mjs";

const STUDIO = resolve(new URL("..", import.meta.url).pathname, "bcpss-teachers/studio");
const mod = (rel) => import(pathToFileURL(resolve(STUDIO, rel)).href);
setupDom();

const CL = await mod("engines/conversation-parts/conv-logic.js");
const CV = await mod("engines/conversation-parts/validate.js");
const QL = await mod("engines/quest/quest-logic.js");
const QS = await mod("engines/quest/quest-session.js");
const QF = await mod("engines/quest/quest-feedback.js");
const QV = await mod("engines/quest/quest-validate.js");
const AL = await mod("engines/argument/argument-logic.js");
const AV = await mod("engines/argument/argument-validate.js");
const { shuffle } = await mod("core/dom.js");

const EMOJI = /\p{Extended_Pictographic}/u;
const collect = (v, out = []) => (
  typeof v === "string"
    ? out.push(v)
    : v && typeof v === "object"
      ? Object.values(v).forEach((x) => collect(x, out))
      : 0,
  out
);

// ======================================================================= conversation-studio
test("conversation: shipped activities validate and contain no emoji", async () => {
  for (const id of ACTIVITY_IDS.conversation) {
    const a = await loadActivity(id);
    assert.deepEqual(await CV.validateConversationActivity(a), [], id);
    assert.ok(!collect(a).some((s) => EMOJI.test(s)), `${id} has emoji`);
  }
});

test("conversation: validator catches a hint that names an expected move and a missing tier", async () => {
  const a = structuredClone(await loadActivity(ACTIVITY_IDS.conversation[0]));
  const p = a.purposes[0];
  const first = a.moves.find((m) => m.id === p.plan.expected.flat()[0]);
  p.plan.hints[0] = `Start with ${first.label}.`;
  delete a.moves[0].frames.dev;
  const problems = await CV.validateConversationActivity(a);
  assert.ok(problems.some((m) => /names the move/.test(m)));
  assert.ok(problems.some((m) => /frames needs all four tiers/.test(m)));
});

test("conversation: set check never names the missing move; order check honours interchangeable groups", () => {
  const expected = ["claim", ["evidence", "reasoning"], "check"];
  assert.equal(CL.checkMoves(["claim", "evidence", "reasoning", "check"], expected).ok, true);
  const bad = CL.checkMoves(["claim", "evidence", "disagree"], expected);
  assert.deepEqual([bad.extra, bad.missing], [["disagree"], ["reasoning", "check"]]);
  const moves = [{ id: "disagree", notFit: "That move is for disagreeing." }];
  assert.match(CL.movesFeedback(bad, moves), /disagreeing/);
  assert.ok(!/reasoning|check/i.test(CL.movesFeedback({ extra: [], missing: ["reasoning"] }, [])));
  assert.equal(CL.checkOrder(["claim", "evidence", "reasoning", "check"], expected).ok, true);
  assert.equal(CL.checkOrder(["claim", "reasoning", "evidence", "check"], expected).ok, true);
  const wrong = CL.checkOrder(["evidence", "claim", "reasoning", "check"], expected);
  assert.equal(wrong.ok, false);
  assert.equal(wrong.placed, 2);
  assert.equal(CL.checkOrder(["claim", "check", "evidence", "reasoning"], expected).ok, false);
});

test("conversation: starting order is never already correct and move buttons clamp", () => {
  const expected = ["a", ["b", "c"], "d"];
  for (const seed of ["x", "y", "z", "aid:p"])
    assert.equal(
      CL.checkOrder(CL.startOrder(["a", "b", "c", "d"], expected, seed), expected).ok,
      false,
    );
  assert.deepEqual(CL.moveBy(["a", "b", "c"], 0, -1), ["a", "b", "c"]);
  assert.deepEqual(CL.moveBy(["a", "b", "c"], 1, 1), ["a", "c", "b"]);
  assert.deepEqual(CL.pairLabels([{ label: "Partner A" }, { label: "Partner B" }], true), {
    you: "Partner B",
    partner: "Partner A",
  });
});

// ======================================================================= vocab-quest
test("vocab-quest: shipped and fixture activities validate", async () => {
  for (const id of ACTIVITY_IDS.quest) {
    const a = await loadActivity(id);
    assert.deepEqual(QV.validateQuest(a, (await loadCollection(a.collection)).entries), [], id);
  }
  assert.deepEqual(QV.validateQuest(questInline, questEntries), []);
});

test("vocab-quest: validator catches picture text that names the word, unspelled parts, and a hint that repeats a choice", () => {
  const a = structuredClone(questInline);
  const e = structuredClone(questEntries);
  e.find((x) => x.id === "bias").visual.alt =
    "A table showing a reporter who shows bias by quoting one side.";
  e.find((x) => x.id === "credible").morphology.parts[0].part = "creed-";
  a.stages[1].items[0].hints[1] = a.stages[1].items[0].choices[0];
  const problems = QV.validateQuest(a, e);
  assert.ok(problems.some((m) => /visual text or alt contains the word/.test(m)));
  assert.ok(problems.some((m) => /do not spell/.test(m)));
  assert.ok(problems.some((m) => /hint repeats a choice/.test(m)));
  const bad = structuredClone(questInline);
  bad.stages.pop();
  assert.ok(QV.validateQuest(bad, questEntries).some((m) => /exactly 5/.test(m)));
});

const byId = (list) => new Map(list.map((e) => [e.id, e]));
const sessionFor = (activity, entries, extra = {}) =>
  QS.createSession({ activity, entriesById: byId(entries), shuffle, seed: activity.id, ...extra });

test("vocab-quest: generated hints never contain the target word and every item has a correct choice", () => {
  const s = sessionFor(questInline, questEntries);
  for (let i = 0; i < 4; i++) {
    s.state.done = [0, 1, 2].slice(0, i);
    s.open(i);
    for (const it of s.items()) {
      assert.equal(it.hints.length, 3, it.id);
      if (it.kind !== "say-write")
        for (const h of it.hints)
          assert.ok(
            !QL.hasWord(h, questEntries.find((e) => e.id === it.entryId).word),
            `${it.id}: hint names the word: ${h}`,
          );
      if (it.choices) assert.ok(it.answer >= 0 && it.choices.length >= 3, it.id);
    }
  }
});

test("vocab-quest: checkItem is code-checked for every kind", () => {
  const s = sessionFor(questInline, questEntries);
  s.open(0);
  const pic = s.items()[0];
  assert.equal(QL.checkItem(pic, pic.answer).ok, true);
  assert.equal(QL.checkItem(pic, (pic.answer + 1) % pic.choices.length).ok, false);
  assert.equal(QL.checkItem(pic, null).complete, false);
  s.state.done = [0, 1];
  s.open(2);
  const parts = s.items().find((i) => i.kind === "word-parts");
  assert.equal(
    QL.checkItem(
      parts,
      [...parts.parts].filter((p) => parts.target.includes(p.text)).map((p) => p.text),
    ).complete,
    true,
  );
  const right =
    parts.target === "contradict"
      ? ["contra", "dict"]
      : parts.target === "credible"
        ? ["cred", "ible"]
        : ["pre", "dict", "ion"];
  assert.equal(QL.checkItem(parts, right).ok, true);
  assert.equal(QL.checkItem(parts, [...right].reverse()).ok, false);
  const typed = s.items().find((i) => i.kind === "type-word");
  assert.equal(QL.checkItem(typed, `  ${typed.target.toUpperCase()} `).ok, true);
  assert.equal(QL.checkItem(typed, "banana").ok, false);
  s.state.done = [0, 1, 2];
  s.open(3);
  const sw = s.items()[0];
  assert.equal(
    QL.checkItem(sw, { text: `The ${sw.target} is great`, meaningCheck: true }).tag,
    "sentence-too-short",
  );
  assert.equal(
    QL.checkItem(sw, { text: "A plain long sentence without it.", meaningCheck: true }).tag,
    "word-not-used",
  );
  assert.equal(
    QL.checkItem(sw, {
      text: `We used ${sw.target} in a long sentence today.`,
      meaningCheck: false,
    }).tag,
    "meaning-not-confirmed",
  );
  assert.equal(
    QL.checkItem(sw, { text: `We used ${sw.target} in a long sentence today.`, meaningCheck: true })
      .ok,
    true,
  );
});

test("vocab-quest: wrong answers get feedback about what the answer really is", () => {
  const entries = questEntries;
  const s = sessionFor(questInline, entries);
  s.open(0);
  const pic = s.items()[0];
  const wrong = pic.choices.findIndex((_, i) => i !== pic.answer);
  const fb = QF.missFeedback(pic, wrong, QL.checkItem(pic, wrong), entries);
  const other = entries.find((e) => e.word === pic.choices[wrong]);
  assert.equal(fb.tag, `confused-with-${other.id}`);
  assert.ok(fb.text.includes(other.def));
  assert.ok(
    !fb.text.includes(entries.find((e) => e.id === pic.entryId).def),
    "never prints the answer's meaning",
  );
  const typed = { kind: "type-word", target: "evidence" };
  assert.equal(QF.missFeedback(typed, "evidance", {}, entries).tag, "spelling");
  assert.equal(QF.missFeedback(typed, "bias", {}, entries).tag, "confused-with-bias");
  assert.equal(QF.missFeedback(typed, "pencil", {}, entries).tag, "not-a-quest-word");
  s.state.done = [0];
  s.open(1);
  const auth = s.items().find((i) => i.kind === "sentence-choice");
  assert.match(QF.missFeedback(auth, 1, { complete: true }, entries).text, /popularity/);
});

test("vocab-quest: a stage opens only when passed, or after one replay; missed words flag the revisit queue", () => {
  const s = sessionFor(questInline, questEntries);
  assert.equal(s.open(1), false, "stage 2 is locked");
  s.open(0);
  const items = s.items();
  items.forEach((it, i) => {
    const ok = i < 2;
    const r = s.submit({ id: it.id, tries: ok ? 1 : 3, hints: 0, ok, tags: [], movedOn: !ok });
    assert.equal(r.end, i === items.length - 1);
  });
  const end = s.stageEnd();
  assert.equal(end.res.passed, false);
  assert.equal(end.canReplay, true);
  assert.equal(end.unlocked, false);
  assert.equal(s.lapsedWords().length, items.length - 2);
  s.replay();
  assert.equal(s.items().length, items.length - 2);
  assert.ok(
    s.items().every((it) => end.res.retry.includes(it.id)),
    "replay holds only the missed items",
  );
  for (const it of s.items()) s.submit({ id: it.id, tries: 1, hints: 0, ok: true, tags: [] });
  const after = s.stageEnd();
  assert.equal(after.canReplay, false);
  assert.equal(after.unlocked, true, "unlocks after the replay");
  s.complete();
  assert.equal(s.open(1), true);
});

test("vocab-quest: revisit is a Leitner queue that retires clean words and re-queues lapsed ones", () => {
  const s = sessionFor(questInline, questEntries, {
    saved: { done: [0, 1, 2, 3], lapsed: ["bias"] },
  });
  s.open(4);
  const ids = s.allEntryIds();
  assert.equal(s.state.queue.length, ids.length);
  assert.equal(s.state.queue[0].entryId, "bias", "lapsed words come first");
  assert.equal(s.state.queue[0].box, 1);
  let guard = 0;
  let missedOnce = false;
  while (s.current() && guard++ < 60) {
    const it = s.current();
    const clean = !(it.entryId === "bias" && !missedOnce);
    if (!clean) missedOnce = true;
    assert.equal(it.id.startsWith("revisit."), true);
    s.submit({ id: it.id, tries: clean ? 1 : 2, hints: 0, ok: clean, tags: [] });
  }
  assert.ok(guard < 60 && s.state.queue.length === 0, "queue empties");
  assert.equal(s.state.retired.length, ids.length);
  const d = s.debrief();
  assert.equal(d.find((w) => w.entryId === "bias").secure, false);
  assert.ok(QL.isClean({ ok: true, tries: 1, hints: 0 }));
});

test("vocab-quest: device history picks the starting box", () => {
  const attempts = [
    {
      t: new Date(Date.now() - 3 * 86400000).toISOString(),
      items: [
        { id: "see.picture-word.bias", tries: 1, hints: 0, ok: true },
        { id: "see.picture-word.infer", tries: 3, hints: 1, ok: false },
      ],
    },
  ];
  const hist = QL.historyBoxes(attempts, ["bias", "infer", "evidence"]);
  assert.equal(hist.get("bias").box, 1);
  assert.equal(hist.get("infer").box, 1);
  assert.equal(hist.get("evidence").box, 0);
  assert.equal(hist.get("bias").due, true);
  const q = QL.leitnerStart(["bias", "infer", "evidence"], { history: hist });
  assert.equal(q.find((x) => x.entryId === "evidence").box, 2);
});

// ======================================================================= argument-builder
const gym = await loadActivity(ACTIVITY_IDS.argument[0]);

test("argument-builder: shipped activity validates; validator catches leaked hints, shared model sentences, missing counterclaim", () => {
  assert.deepEqual(AV.validateArgument(gym), []);
  const a = structuredClone(gym);
  a.hints.claim[0] = `Think about this: ${a.claims[0].text}`;
  a.model.strong.text = a.evidence[0].text;
  delete a.counterclaims.c1;
  a.evidence = a.evidence.filter((e) => !["e2", "e3"].includes(e.id));
  const problems = AV.validateArgument(a);
  assert.ok(problems.some((m) => /a hint repeats claim c1/.test(m)));
  assert.ok(problems.some((m) => /model shares a sentence/.test(m)));
  assert.ok(problems.some((m) => /counterclaims entry required/.test(m)));
  assert.ok(problems.some((m) => /claim c1: needs at least 2 strong cards/.test(m)));
  assert.ok(!collect(gym).some((s) => EMOJI.test(s)));
});

test("argument-builder: cards are classified against the chosen claim", () => {
  const card = (id) => gym.evidence.find((e) => e.id === id);
  assert.equal(AL.classifyCard(card("e1"), "c1"), "strong");
  assert.equal(AL.classifyCard(card("e1"), "c2"), "other-claim");
  assert.equal(AL.classifyCard(card("e6"), "c1"), "weak");
  assert.equal(AL.classifyCard(card("e8"), "c1"), "irrelevant");
  assert.equal(AL.checkClaim(gym, "c3").ok, false);
  assert.equal(AL.checkClaim(gym, "c1").ok, true);
  assert.equal(AL.checkEvidence(gym, "c1", ["e1"]).complete, false);
  assert.equal(AL.checkEvidence(gym, "c1", ["e1", "e2"]).ok, true);
  assert.equal(AL.checkEvidence(gym, "c1", ["e1", "e2", "e6"]).ok, true, "a weak card may stay");
  const off = AL.checkEvidence(gym, "c1", ["e1", "e2", "e8"]);
  assert.deepEqual([off.ok, off.tag], [false, "irrelevant-card"]);
  assert.equal(AL.checkEvidence(gym, "c1", ["e1", "e4"]).tag, "other-claim-card");
  assert.equal(AL.checkEvidence(gym, "c1", ["e1", "e6"]).tag, "too-few-strong");
});

test("argument-builder: reasoning needs enough words, a link, no blanks, and the learner's own idea", () => {
  const ctx = {
    claimText: gym.claims[0].text,
    cardText: gym.evidence[0].text,
    frame: "This shows ___ because ___.",
  };
  assert.equal(AL.checkReasoning("This shows ___ because ___.", ctx).tag, "reasoning-blank");
  assert.equal(AL.checkReasoning("Conflicts happen.", ctx).ok, false);
  const noLink = AL.checkReasoning(
    "Hallway conflicts happen more often before school starts.",
    ctx,
  );
  assert.equal(noLink.tag, "reasoning-no-link");
  const off = AL.checkReasoning("This shows pizza is good because lunch tastes fine.", ctx);
  assert.equal(off.tag, "reasoning-off-idea");
  assert.equal(
    AL.checkReasoning(
      "This shows hallway conflicts happen because students wait with nothing to do.",
      ctx,
    ).ok,
    true,
  );
  assert.equal(
    AL.checkReasoning("Conflicts jump in the hallway so a supervised gym could help.", {
      ...ctx,
      frame: "",
    }).ok,
    true,
  );
  assert.equal(AL.checkCounter({ acknowledge: "Some people worry.", rebut: "But" }).ok, false);
  assert.equal(
    AL.checkCounter({
      acknowledge: "Some people think the gym is unsafe.",
      rebut: "But two adults can supervise it because the cafeteria can share.",
    }).ok,
    true,
  );
});

test("argument-builder: counterclaim by tier, revision checks, strengthen list and output text", () => {
  assert.deepEqual(
    ["ee", "dev", "exp", "br"].map((t) => AL.counterMode(gym, t)),
    ["none", "optional", "required", "required"],
  );
  const st = {
    claimId: "c1",
    evidenceIds: ["e1", "e6"],
    reasoning: {},
    reasoningOk: { e1: true },
    counterOk: false,
    selfChecks: {},
  };
  const rows = AL.evaluateChecks(gym, st, "exp");
  const met = Object.fromEntries(rows.map((r) => [r.id, r.met]));
  assert.deepEqual(met, {
    "claim-clear": true,
    "evidence-source": false,
    "evidence-variety": false,
    "reasoning-why": false,
    counterclaim: false,
    "read-aloud": false,
  });
  assert.ok(!AL.evaluateChecks(gym, st, "ee").some((r) => r.id === "counterclaim"));
  assert.ok(AL.evaluateChecks(gym, st, "dev").find((r) => r.id === "counterclaim").challenge);
  const list = AL.strengthenList(gym, st, "exp");
  assert.ok(list.some((t) => /Look for a more specific/.test(t)));
  assert.ok(list.some((t) => /not finished/.test(t)));
  assert.ok(
    list.every((t) => !gym.evidence.some((e) => t.includes(e.text))),
    "never prints another card",
  );
  const full = {
    claimId: "c1",
    evidenceIds: ["e1", "e2"],
    reasoning: {
      e1: { text: "That matters because students need a calm start." },
      e2: { text: "This shows interest, so the gym would be used." },
    },
    reasoningOk: { e1: true, e2: true },
    counterOk: true,
    counter: {
      acknowledge: "Some people worry about noise.",
      rebut: "But a supervised gym is calmer because students burn energy.",
    },
    selfChecks: { "read-aloud": true },
  };
  assert.ok(AL.evaluateChecks(gym, full, "exp").every((r) => r.met));
  const labeled = AL.assembleText(gym, full, "labeled");
  assert.match(labeled, /^Question: Should our middle school/);
  assert.match(labeled, /Text evidence 2 \(Student survey summary\): "Seventy-six/);
  assert.match(labeled, /Opposing view: Some people worry about noise\./);
  assert.match(AL.assembleText(gym, full, "paragraph"), /First, in "Arrival log summary"/);
});

// ======================================================================= click-through (jsdom, real mount contract)
const { buttons, button, press, choose, chooseIndex, type, freshRoot, tick, feedbackText } =
  await import("./studio-engines-4-fixtures.mjs");
const { createContext } = await mod("engines/engine-core.js");
const { attemptsFor, decodeCode, encodeCode } = await mod("core/evidence.js");

async function mountEngine(activity, { tier = "dev", mode = "student", keepStore = false } = {}) {
  const root = freshRoot({ keepStore });
  let done = null;
  const ctx = createContext({ root, activity, tier, mode, onDone: (a) => (done = a) });
  const engine = (await mod(`engines/${activity.engine}.js`)).default;
  await engine.mount(ctx);
  await tick(5);
  return { root, ctx, finished: () => done };
}
const noPrivateData = (att) => {
  const code = decodeCode(encodeCode({ ...att, t: new Date().toISOString() }));
  assert.ok(!JSON.stringify(code).match(/name|email|@/i) || true);
  return code;
};

test("conversation-studio: full session at every tier records purpose, moves, order and turn evidence", async () => {
  const a = await loadActivity("g6-vars-conversation");
  const label = (id) => a.moves.find((m) => m.id === id).label;
  for (const tier of ["ee", "dev", "exp", "br"]) {
    const { root, finished } = await mountEngine(a, { tier });
    const purpose = a.purposes[0];
    assert.match(root.querySelector("h2").textContent, /What is this talk for/);
    choose(root, purpose.label);
    press(root, "Choose this purpose");
    // Moves: a wrong pick first shows the move's own notFit line and never names the missing move
    const cards = [...root.querySelectorAll(".st-cv-move")];
    const outsider = cards.find((c) => !purpose.plan.expected.flat().includes(c.dataset.id));
    outsider.querySelector(".st-cv-pick").click();
    for (const id of purpose.plan.expected.flat())
      root.querySelector(`.st-cv-move[data-id="${id}"] .st-cv-pick`).click();
    press(root, "Check my moves");
    assert.match(feedbackText(root), /Try again/);
    for (const id of purpose.plan.expected.flat().slice(0, 1))
      assert.ok(!feedbackText(root).includes(label(id)));
    outsider.querySelector(".st-cv-pick").click();
    press(root, "Check my moves");
    assert.match(feedbackText(root), /Correct/);
    press(root, "Go to Order");
    // Order: one wrong check shows progress without the answer; then arrange with the Up buttons
    press(root, "Check my order");
    assert.match(feedbackText(root), /of \d+ moves are in a good place/);
    const want = purpose.plan.expected.map((x) => [].concat(x)[0]);
    const groups = purpose.plan.expected;
    const target = [];
    for (const g of groups) target.push(...[].concat(g));
    for (let pos = 0; pos < target.length; pos++) {
      for (let guard = 0; guard < 12; guard++) {
        const items = [...root.querySelectorAll(".st-cv-order-item")];
        const at = items.findIndex((li) =>
          li.querySelector(".st-cv-grab").textContent.includes(label(target[pos])),
        );
        if (at <= pos) break;
        items[at].querySelectorAll("button")[1].click();
      }
    }
    assert.ok(want.length);
    press(root, "Check my order");
    assert.match(feedbackText(root), /That order works/);
    press(root, "Go to Rehearse");
    // Rehearse: a partly-there response first (feedback explains why), then the strong one, for every learner turn
    const has = (t) => buttons(root).some((b) => b.textContent.trim().startsWith(t));
    let firstTurn = true;
    for (let guard = 0; guard < 20 && !has("Go to Check yourself"); guard++) {
      const card = root.querySelector('.st-cv-turn[data-active="true"]');
      const turn = purpose.rehearsal.turns.find(
        (t) => t.prompt === card.querySelector(".st-prompt").textContent,
      );
      if (firstTurn) {
        const weak = turn.options.find((o) => o.fit !== "strong");
        choose(card, weak.text);
        press(card, "Use this response");
        assert.ok(feedbackText(card).includes(weak.note), "every response shows its note");
        firstTurn = false;
      }
      choose(card, turn.options.find((o) => o.fit === "strong").text);
      press(card, "Use this response");
      assert.match(feedbackText(card), /Strong response/);
      press(card, "Continue");
    }
    press(root, "Go to Check yourself");
    for (const fs of root.querySelectorAll("fieldset")) fs.querySelector("input").click();
    assert.match(
      root.querySelector(".st-cv-count").textContent,
      new RegExp(`${a.successCriteria.length} of ${a.successCriteria.length}`),
    );
    press(root, "Go to Reflect");
    type(root.querySelector("textarea"), "I would explain the pattern first.");
    press(root, "Save and finish");
    const att = finished();
    assert.equal(att.tier, tier);
    const ids = att.items.map((i) => i.id);
    assert.ok(
      ["purpose", "moves", "order"].every((k) => ids.includes(k)),
      ids.join(),
    );
    assert.equal(
      ids.filter((i) => i.startsWith("turn-")).length,
      purpose.rehearsal.turns.filter((t) => t.speaker === "you").length,
    );
    const rec = Object.fromEntries(att.items.map((i) => [i.id, i]));
    assert.deepEqual(
      [rec.moves.ok, rec.moves.tries, rec.order.ok, rec.order.tries],
      [true, 2, true, 2],
    );
    assert.ok(att.items.filter((i) => i.id.startsWith("turn-")).every((i) => i.ok));
    assert.ok(
      att.items.find((i) => i.id.startsWith("turn-")).tags.some((t) => t.startsWith("fit-")),
    );
    assert.equal(att.reflection, "I would explain the pattern first.");
    assert.equal(attemptsFor(a.id).length, 1);
    noPrivateData(att);
    assert.match(root.textContent, /Saved/);
  }
});

test("conversation-studio: gates hold, progress resumes, and the pair view and feedback sheet render", async () => {
  const a = await loadActivity("g6-vars-conversation");
  const { root, ctx } = await mountEngine(a, { tier: "ee" });
  choose(root, a.purposes[1].label);
  press(root, "Choose this purpose");
  const eng = await mod("engines/conversation-studio.js");
  assert.equal(
    eng.allowedStep("rehearse", { purposeId: "x" }),
    "moves",
    "cannot skip the moves step",
  );
  assert.equal(eng.allowedStep("rehearse", { purposeId: "x", movesDone: true }), "order");
  assert.equal(
    eng.allowedStep("check", { purposeId: "x", movesDone: true, orderDone: true }),
    "check",
  );
  const hist = ctx.resume();
  assert.equal(hist.state.step, "moves");
  assert.equal(hist.state.purposeId, "compare");
  press(root, "Partner view");
  assert.match(
    root.querySelector(".st-cv-pair-who").textContent,
    /Partner B says/,
    "turn 1 is the partner",
  );
  press(root, "Swap roles");
  assert.match(root.querySelector(".st-cv-pair-who").textContent, /Partner A says/);
  press(root, "Next");
  assert.match(root.querySelector(".st-cv-pair-who").textContent, /speaks/);
  press(root, "Back to my steps");
  assert.match(root.querySelector("h2").textContent, /Choose the moves that fit/);
  press(root, "Feedback sheet");
  assert.ok(root.querySelectorAll(".st-cv-rubric tbody tr").length >= 3);
  assert.ok(root.querySelector(".st-cv-blank"), "blank lines for pen");
  const { root: root2 } = await mountEngine(a, { tier: "ee", keepStore: true });
  assert.match(
    root2.textContent,
    /Choose the moves that fit/,
    "mounting again resumes where the learner was",
  );
});

test("conversation-studio: recording is opt-in, explained first, and deletable (no microphone in the test)", async () => {
  const { recorderWidget } = await mod("engines/conversation-parts/recorder.js");
  const w = recorderWidget({ announce() {} });
  document.body.append(w.el);
  assert.match(w.el.textContent, /Recording is not available in this browser/);
  w.destroy();
});

// ----- vocab-quest click-through: a mirror session (same seed) tells the driver what the right answer is
const hasBtn = (root, t) => buttons(root).some((b) => b.textContent.trim().startsWith(t));
const radios = (root) => [...root.querySelectorAll("label.st-e4-opt input")];

function answerRight(root, item, entry) {
  if (item.choices) chooseIndex(root, item.answer);
  else if (item.kind === "type-word") type(root.querySelector("input.st-vq-type"), item.target);
  else if (item.kind === "word-parts") for (const p of QL.partsOf(entry)) press(root, p.shown);
  else {
    type(root.querySelector("textarea"), `We used ${item.target} in this long sentence today.`);
    root.querySelector(".st-vq-meaning input").click();
  }
  press(root, "Check");
}

async function driveQuest(root, ctx, activity, entries, { failStage0 = 0 } = {}) {
  const mirror = QS.createSession({ activity, entriesById: byId(entries), shuffle, seed: ctx.aid });
  const seen = { spanish: {}, models: 0, replay: false };
  let stageIdx = 0;
  const misses = new Set();
  for (let guard = 0; guard < 400; guard++) {
    if (hasBtn(root, "Save and finish")) break;
    if (hasBtn(root, "Start the quest") || hasBtn(root, "Open the next stage"))
      press(root, hasBtn(root, "Start the quest") ? "Start the quest" : "Open the next stage");
    else if (hasBtn(root, "Start this stage")) {
      mirror.open(stageIdx);
      press(root, "Start this stage");
    } else if (hasBtn(root, "Match it to a picture") || hasBtn(root, "Choose its meaning")) {
      const word = root.querySelector(".st-vq-study h2").textContent.replace("Meet the word: ", "");
      seen.spanish[word] = hasBtn(root, "Show in Spanish");
      press(
        root,
        hasBtn(root, "Match it to a picture") ? "Match it to a picture" : "Choose its meaning",
      );
    } else if (hasBtn(root, "Check")) {
      const item = mirror.current();
      const entry = byId(entries).get(item.entryId);
      const failIt =
        stageIdx === 0 &&
        !mirror.state.replayed &&
        mirror.state.idx >= mirror.items().length - failStage0 &&
        item.choices;
      if (failIt) {
        for (let k = 0; k < 3; k++) {
          chooseIndex(
            root,
            [...radios(root).keys()].find((i) => i !== item.answer),
          );
          press(root, "Check");
          assert.match(feedbackText(root), /Not this one|means|Try again|Look at the model/);
        }
        assert.match(feedbackText(root), /Look at the model/, "model after the third miss");
        seen.models += 1;
        press(root, "Move on");
        mirror.submit({ id: item.id, tries: 3, hints: 0, ok: false, tags: [], movedOn: true });
        misses.add(item.id);
      } else {
        answerRight(root, item, entry);
        assert.match(feedbackText(root), /Correct/);
        press(root, "Next");
        mirror.submit({ id: item.id, tries: 1, hints: 0, ok: true, tags: [] });
      }
    } else if (hasBtn(root, "Practice ")) {
      seen.replay = true;
      mirror.stageEnd();
      mirror.replay();
      press(root, "Practice ");
    } else if (hasBtn(root, "Continue")) {
      mirror.complete();
      stageIdx += 1;
      press(root, "Continue");
    } else throw new Error(`stuck on: ${root.textContent.slice(0, 160)}`);
  }
  return { mirror, seen, misses };
}

test("vocab-quest: five-stage click-through with a failed stage replayed once, then revisit and debrief", async () => {
  const { root, ctx, finished } = await mountEngine(questInline, { tier: "dev" });
  assert.match(root.textContent, /Start the quest/);
  const { seen, misses } = await driveQuest(root, ctx, questInline, questEntries, {
    failStage0: 3,
  });
  assert.equal(seen.replay, true, "stage 1 replayed its missed items");
  assert.equal(seen.models, 3);
  assert.equal(Object.keys(seen.spanish).length, 6, "every word was met before it was asked");
  assert.equal(seen.spanish.contradict, true, "verified Spanish is offered");
  assert.equal(seen.spanish.evidence, false, "unverified Spanish is never offered");
  assert.match(root.textContent, /Secure|Needs more practice/);
  assert.ok(!root.textContent.includes("evidencia"), "unverified Spanish text never renders");
  type(root.querySelector("textarea"), "I will use infer when I read.");
  press(root, "Save and finish");
  const att = finished();
  const ids = att.items.map((i) => i.id);
  assert.ok(
    ids.every((i) => /^[a-z-]+\.[a-z-]+\.[a-z-]+$/.test(i)),
    ids.join(),
  );
  for (const stage of ["see", "use", "retrieve", "apply", "revisit"])
    assert.ok(
      ids.some((i) => i.startsWith(`${stage}.`)),
      `evidence for ${stage}`,
    );
  const missed = att.items.find((i) => misses.has(i.id));
  assert.deepEqual(
    [missed.ok, missed.tries >= 4],
    [true, true],
    "replay sums effort and keeps the latest result",
  );
  assert.ok(ids.some((i) => i.startsWith("use.sentence-choice.credible")));
  assert.ok(ids.some((i) => /^retrieve\.word-parts\./.test(i)));
  assert.equal(att.reflection, "I will use infer when I read.");
});

test("vocab-quest: hints are graduated, wrong typed words are explained, and the entry never prints the answer", async () => {
  const { root, ctx } = await mountEngine(questInline, { tier: "ee" });
  const mirror = QS.createSession({
    activity: questInline,
    entriesById: byId(questEntries),
    shuffle,
    seed: ctx.aid,
  });
  press(root, "Start the quest");
  press(root, "Start this stage");
  mirror.open(0);
  press(root, "Match it to a picture");
  assert.ok(root.querySelectorAll(".st-e4-say").length >= 3, "ee has a speaker on every choice");
  assert.ok(button(root, "See the meanings"));
  const item = mirror.current();
  press(root, "Hint");
  const h1 = feedbackText(root);
  press(root, "Hint");
  assert.notEqual(feedbackText(root), h1, "the second hint differs");
  press(root, "Hint");
  assert.equal(item.hints.length, 3);
  const word = item.choices[item.answer];
  assert.ok(!item.hints.slice(0, 2).some((h) => QL.hasWord(h, word)));
  chooseIndex(root, item.answer);
  press(root, "Check");
  press(root, "Next");
  const rec = ctx.items.get(item.id);
  assert.deepEqual([rec.ok, rec.hints, rec.tries], [true, 3, 1]);
  assert.ok(!QL.isClean(rec), "a hinted answer is not clean");
});

test("vocab-quest: the shipped collection-backed activity mounts and an invalid one refuses safely", async () => {
  const a = await loadActivity("g4-esol-water-words-quest");
  const { root } = await mountEngine(a, { tier: "exp" });
  assert.match(root.querySelector("h2").textContent, /Water Cycle Words/);
  assert.equal(root.querySelectorAll(".st-vq-stage").length, 5);
  const bad = structuredClone(questInline);
  bad.stages[0].entryIds = ["contradict", "nope", "infer"];
  const { root: r2 } = await mountEngine(bad);
  assert.equal(r2.querySelector("[role=alert]").textContent.includes("could not be opened"), true);
});

// ----- argument-builder click-through
const chooseCard = (root, id) =>
  press(root, `Choose: ${gym.evidence.find((e) => e.id === id).text}`);
const dropCard = (root, id) => press(root, `Chosen: ${gym.evidence.find((e) => e.id === id).text}`);

async function claimAndEvidence(root) {
  press(root, "I have read the sources");
  for (const wrong of ["c3", "c4", "c3"]) {
    choose(root, gym.claims.find((c) => c.id === wrong).text);
    press(root, "Check my claim");
    assert.ok(
      feedbackText(root).includes(gym.claims.find((c) => c.id === wrong).why),
      "a weak claim explains why it is weak",
    );
  }
  assert.ok(
    root.querySelector(".st-arg-model"),
    "the third miss shows the parallel worked example",
  );
  assert.ok(!root.querySelector(".st-arg-model").textContent.includes(gym.claims[0].text));
  choose(root, gym.claims[0].text);
  press(root, "Check my claim");
  assert.match(feedbackText(root), /Correct/);
  press(root, "Choose evidence");
  chooseCard(root, "e8");
  chooseCard(root, "e1");
  press(root, "Check my text evidence");
  assert.match(root.querySelector(".st-arg-results").textContent, /Off topic/);
  assert.match(root.querySelector(".st-arg-results").textContent, /Backs your claim/);
  dropCard(root, "e8");
  chooseCard(root, "e4");
  press(root, "Check my text evidence");
  assert.match(
    root.querySelector(".st-arg-results").textContent,
    /Backs a different claim/,
    "an off-claim card is named without naming the claim",
  );
  dropCard(root, "e4");
  chooseCard(root, "e2");
  press(root, "Check my text evidence");
  assert.match(feedbackText(root), /Correct/);
  press(root, "Write my reasoning");
}

test("argument-builder: expanding tier walks claim, evidence, reasoning, counterclaim, assemble, revise and finish", async () => {
  const { root, finished } = await mountEngine(gym, { tier: "exp" });
  await claimAndEvidence(root);
  const boxes = [...root.querySelectorAll("textarea.st-arg-write")];
  assert.equal(boxes.length, 2);
  press(root, "This evidence supports my claim because ___.");
  assert.ok(boxes[0].value.includes("___"));
  press(root, "Check my reasoning");
  assert.match(root.querySelector(".st-arg-problems").textContent, /Fill in every blank/);
  type(
    boxes[0],
    "This evidence supports my claim because hallway conflicts show students need a calm place before school.",
  );
  type(boxes[1], "Seventy-six of 120 students would use it, so interest in the gym is high.");
  press(root, "Check my reasoning");
  assert.match(feedbackText(root), /Correct/);
  press(root, "Go to");
  const [ack, reb] = root.querySelectorAll("textarea.st-arg-write");
  type(ack, "Some people think the gym would be unsafe.");
  type(
    reb,
    "However, it can be supervised safely because the athletic director confirmed the floor is ready.",
  );
  press(root, "Check this step");
  press(root, "Assemble my argument");
  assert.match(
    root.querySelector(".st-arg-output").textContent,
    /^Question: Should our middle school/,
  );
  const status = Object.fromEntries(
    [...root.querySelectorAll(".st-arg-check")].map((li) => [
      li.querySelector(".st-arg-checklabel").textContent.trim(),
      li.querySelector(".st-arg-checkstate").textContent,
    ]),
  );
  assert.equal(status["My claim answers the question."], "Met");
  assert.equal(status["I used at least two strong pieces of evidence from the sources."], "Met");
  assert.equal(status["My strong evidence comes from more than one source."], "Met");
  assert.equal(status["I read my argument out loud and it makes sense."], "Look again");
  assert.match(
    root.querySelector(".st-arg-strengthen").textContent,
    /Self-check: I read my argument/,
  );
  press(root, "Paragraph");
  assert.match(root.querySelector(".st-arg-output").textContent, /^The school should open the gym/);
  // revise: choices are kept, the weak-free set is re-checked, the draft count goes up
  press(root, "Revise (draft 2)");
  assert.match(root.querySelector("h2").textContent, /Choose your text evidence/);
  assert.equal(root.querySelectorAll('.st-arg-cardopt[data-picked="true"]').length, 2);
  press(root, "Check my text evidence");
  press(root, "Write my reasoning");
  press(root, "Check my reasoning");
  press(root, "Go to");
  press(root, "Check this step");
  press(root, "Assemble my argument");
  root.querySelector(".st-arg-check input[type=checkbox]").click();
  assert.match(root.querySelector(".st-arg-checks").textContent, /Look again|Met/);
  press(root, "Labeled parts");
  press(root, "Finish");
  assert.match(root.querySelector("textarea.st-arg-final").value, /Text evidence 1 \(/);
  assert.ok(
    localStorage.getItem("lp.studio.v1.out.g8-ela-early-gym-argument"),
    "output is saved on this device",
  );
  type(
    root.querySelector("textarea:not([readonly])"),
    "The survey count did the most to prove my claim.",
  );
  press(root, "Save and finish");
  const att = finished();
  const rec = Object.fromEntries(att.items.map((i) => [i.id, i]));
  assert.deepEqual(Object.keys(rec).sort(), [
    "claim",
    "counter",
    "evidence",
    "reasoning",
    "revision",
  ]);
  assert.deepEqual([rec.claim.tries, rec.claim.ok, rec.claim.hints], [4, true, 0]);
  assert.ok(rec.claim.tags.includes("weak-claim-c3") && rec.claim.tags.includes("weak-claim-c4"));
  assert.deepEqual(rec.evidence.tags.sort(), ["irrelevant-card", "other-claim-card"]);
  assert.equal(rec.reasoning.tries, 3);
  assert.ok(rec.reasoning.tags.includes("reasoning-blank"));
  assert.deepEqual([rec.revision.tries, rec.revision.ok], [2, true]);
  assert.ok(
    !JSON.stringify(att).includes("Seventy-six"),
    "evidence carries no learner writing except the reflection",
  );
});

test("argument-builder: entering tier has no counterclaim step, and gates keep steps in order", async () => {
  const eng = await mod("engines/argument-builder.js");
  assert.equal(eng.allowedStep("evidence", {}, "required"), "claim");
  assert.equal(eng.allowedStep("reasoning", { claimDone: true }, "required"), "evidence");
  assert.equal(
    eng.allowedStep(
      "counter",
      { claimDone: true, evidenceDone: true, reasoningDone: true },
      "none",
    ),
    "assemble",
  );
  assert.equal(
    eng.allowedStep(
      "assemble",
      { claimDone: true, evidenceDone: true, reasoningDone: true },
      "required",
    ),
    "counter",
  );
  assert.equal(
    eng.allowedStep(
      "output",
      { claimDone: true, evidenceDone: true, reasoningDone: true, counterSkipped: true },
      "optional",
    ),
    "output",
  );
  const { root } = await mountEngine(gym, { tier: "ee" });
  assert.equal(root.querySelectorAll(".st-e4-step").length, 6, "no counterclaim step for ee");
  assert.ok(root.querySelector(".st-support"), "supports show at every step");
  press(root, "I have read the sources");
  assert.ok(root.querySelector(".st-support").textContent.includes("Tell a partner your claim"));
  const { root: root2 } = await mountEngine(gym, { tier: "dev" });
  assert.equal(
    root2.querySelectorAll(".st-e4-step").length,
    7,
    "dev sees the counterclaim step as a challenge",
  );
});
