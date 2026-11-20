// Language Games, chapters added after launch (greenhouse room, museum case, reading-room encounter, transit
// assignment; each in grades 3-5 and 6-8). Pins what must not change for learners who already played: every launch
// chapter id, its order and its step ids (saved progress is keyed by them), the storage key, old completed and
// unfinished saves, help semantics and ledger privacy. Also checks the new chapters themselves: invented material is
// labelled, distractors are specific, branches both finish, and plausible-but-wrong answers do not pass.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const E = await import(new URL("src/flagship/engine.js", LAB));
const K = await import(new URL("src/flagship/checks.js", LAB));
const UI = await import(new URL("src/flagship/ui.js", LAB));
const { makeI18n } = await import(new URL("src/i18n.js", LAB));

// Launch chapters: id → step ids, in launch order, per game|band.
const LAUNCH = {
  "escape-room|3-5": {
    "er35-shed": ["l1-read", "l1-explain", "l2-read", "l2-explain", "l3-read", "l3-explain"],
    "er35-treehouse": ["l1-read", "l1-explain", "l2-read", "l2-explain", "l3-read", "l3-explain"],
    "er35-library": [
      "l1-read",
      "l1-explain",
      "l2-read",
      "l2-explain",
      "l3-read",
      "l3-explain",
      "l4-read",
      "l4-explain",
    ],
  },
  "escape-room|6-8": {
    "er68-archive": [
      "l1-read",
      "l1-explain",
      "l2-read",
      "l2-explain",
      "l3-read",
      "l3-explain",
      "l4-read",
      "l4-explain",
    ],
    "er68-robots": ["l1-read", "l1-explain", "l2-read", "l2-explain", "l3-read", "l3-explain"],
    "er68-control": [
      "l1-read",
      "l1-explain",
      "l2-read",
      "l2-explain",
      "l3-read",
      "l3-explain",
      "l4-read",
      "l4-explain",
    ],
  },
  "evidence-detective|3-5": {
    "ed35-hamster": ["sort", "choose", "defend", "answer"],
    "ed35-tomatoes": ["sort", "choose", "defend", "answer"],
    "ed35-book": ["sort", "choose", "strongest", "defend", "answer"],
  },
  "evidence-detective|6-8": {
    "ed68-garden": ["sort", "choose", "defend", "answer"],
    "ed68-bikerack": ["sort", "choose", "defend", "answer"],
    "ed68-window": ["sort", "choose", "strongest", "defend", "answer"],
  },
  "conversation-quest|3-5": {
    "cq35-toy": ["open", "say-need", "mixup", "repair", "deal"],
    "cq35-coach": ["open", "say-need", "mixup", "repair", "deal"],
    "cq35-poster": ["open", "say-need", "mixup", "repair", "deal"],
    "cq35-backpack": ["open", "say-robot", "say-coupon", "mixup", "repair", "thanks"],
  },
  "conversation-quest|6-8": {
    "cq68-return": ["open", "say-need", "mixup", "repair", "deal"],
    "cq68-coach": ["open", "say-need", "mixup", "repair", "deal"],
    "cq68-project": ["open", "say-need", "mixup", "repair", "deal"],
    "cq68-lostbag": ["open", "say-wed", "say-thu", "mixup", "repair-cash", "repair-credit", "deal"],
  },
  "newsroom-challenge|3-5": {
    "nc35-garden": ["source", "conflict", "sort", "headline", "lead", "revise"],
    "nc35-readathon": ["source", "conflict", "sort", "headline", "lead", "revise"],
    "nc35-lostdog": ["source", "conflict", "sort", "headline", "lead", "revise"],
  },
  "newsroom-challenge|6-8": {
    "nc68-crosswalk": ["source", "conflict", "sort", "headline", "lead", "revise"],
    "nc68-fooddrive": ["source", "conflict", "sort", "headline", "lead", "revise"],
    "nc68-flood": ["source", "conflict", "sort", "headline", "lead", "revise"],
  },
};
const ADDED = {
  "escape-room": ["er35-greenhouse", "er68-greenhouse"],
  "evidence-detective": ["ed35-museum", "ed68-museum"],
  "conversation-quest": ["cq35-readingroom", "cq68-readingroom"],
  "newsroom-challenge": ["nc35-transit", "nc68-transit"],
};
const addedId = (game, band) => ADDED[game.id][band === "3-5" ? 0 : 1];
const lastOf = (game, band) => E.chaptersOf(game, band).at(-1);
const raw = (r) => r[Object.getOwnPropertySymbols(r)[0]];
const I = makeI18n("en");
const text = (v) =>
  String(raw(v))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

/** The input that completes a step correctly (supported = no help used; the learner's own answer). */
function answerFor(step) {
  if (step.type === "choose") return step.options.find((o) => o.ok).id;
  if (step.type === "sort")
    return Object.fromEntries(step.items.map((it) => [it.id, { cat: it.cat, reason: it.reason }]));
  return step.model;
}
/** Play steps of a chapter with correct answers from its current position until `stopAt` steps are done. */
function play(bs, chapter, stopAt = Infinity) {
  const cs = E.chapterState(bs, chapter.id);
  for (let n = 0; n < stopAt && !cs.done; n++) {
    const step = E.activeSteps(chapter, cs.flags)[cs.at];
    const ss = E.stepState(cs, step.id);
    const r = E.attempt(step, ss, answerFor(step));
    assert.ok(r.ok, `${chapter.id} ${step.id}`);
    E.applyFlags(bs, cs, r.sets);
    E.advance(bs, chapter, cs);
  }
  return cs;
}
/** What localStorage holds: a JSON round trip, so a test cannot lean on object identity. */
const UI_STATE = () => ({ es: {}, drafts: {}, sort: {}, pick: {}, dict: null });
const stored = (st) => JSON.parse(JSON.stringify(st));

test("launch chapters keep their ids, order and step ids; added chapters come last", () => {
  for (const g of E.GAMES)
    for (const band of E.BANDS) {
      const chapters = E.chaptersOf(g, band);
      const launch = LAUNCH[`${g.id}|${band}`];
      const ids = Object.keys(launch);
      assert.deepEqual(
        chapters.map((c) => c.id),
        [...ids, addedId(g, band)],
        `${g.id} ${band}`,
      );
      for (const c of chapters.slice(0, ids.length))
        assert.deepEqual(
          c.steps.map((s) => s.id),
          launch[c.id],
          `${c.id}: step ids`,
        );
      assert.equal(chapters.length, g.chapters, `${g.id} ${band}: game.chapters matches`);
    }
});

test("the saved-progress storage key has not changed", () => {
  const view = readFileSync(new URL("src/views/language-games.js", LAB), "utf8");
  assert.ok(view.includes('const KEY = "accessPracticeLab:v1:flagship";'));
});

test("a save with every launch chapter finished reopens: the added chapter is next and nothing is lost", () => {
  for (const g of E.GAMES)
    for (const band of E.BANDS) {
      const chapters = E.chaptersOf(g, band);
      const launch = chapters.slice(0, -1);
      let st = {};
      const bs0 = E.bandState(st, g.id, band);
      for (const c of launch) play(bs0, c);
      bs0.last = launch.at(-1).id;
      st = stored(st);
      const bs = E.bandState(st, g.id, band);
      const at = `${g.id} ${band}`;
      const p = E.progressOf(g, band, bs);
      assert.equal(p.done, launch.length, at);
      assert.equal(p.total, launch.length + 1, at);
      assert.equal(p.complete, false, `${at}: no longer complete`);
      assert.equal(p.next.id, addedId(g, band), `${at}: next chapter`);
      assert.ok(E.isUnlocked(g, band, bs, launch.length), `${at}: added chapter is open`);
      // Every screen a returning learner meets renders from this save.
      const all = { [g.id]: { [band]: bs } };
      const hub = text(UI.hubHTML(I, all, band));
      assert.match(
        hub,
        new RegExp(`${launch.length} of ${launch.length + 1} `),
        `${at}: hub progress`,
      );
      const map = text(UI.gameHTML(I, g, band, bs, UI_STATE()));
      assert.ok(map.includes(lastOf(g, band).title), `${at}: map lists the added chapter`);
      const art = text(UI.artifactHTML(I, g, band, bs));
      assert.ok(
        art.includes(`${launch.length} of ${launch.length + 1} chapters finished`),
        `${at}: artifact count`,
      );
      for (const c of launch) assert.ok(art.includes(c.title), `${at}: artifact keeps ${c.id}`);
      // Their old work is intact, and finishing the added chapter completes the game.
      const before = E.artifactOf(g, band, bs).flatMap((a) => a.entries.map((e) => e.text));
      const cs = play(bs, chapters.at(-1));
      assert.ok(cs.done, `${at}: added chapter finishes`);
      assert.equal(E.progressOf(g, band, bs).complete, true, `${at}: complete again`);
      const after = E.artifactOf(g, band, bs).flatMap((a) => a.entries.map((e) => e.text));
      assert.deepEqual(after.slice(0, before.length), before, `${at}: old entries unchanged`);
      const chapterPage = text(
        UI.chapterHTML(I, g, band, chapters.at(-1), chapters.length - 1, cs, UI_STATE(), {}),
      );
      assert.ok(chapterPage.length > 200, `${at}: finished chapter renders`);
    }
});

test("a save part-way through a launch chapter resumes on the same step", () => {
  for (const g of E.GAMES)
    for (const band of E.BANDS) {
      const chapters = E.chaptersOf(g, band);
      for (const [i, c] of chapters.slice(0, -1).entries()) {
        // Everything before chapter i is finished; chapter i stops after two steps, with Spanish help open on the next.
        let st = {};
        const bs0 = E.bandState(st, g.id, band);
        for (const prior of chapters.slice(0, i)) play(bs0, prior);
        const cs0 = play(bs0, c, 2);
        const steps0 = E.activeSteps(c, cs0.flags);
        const stuck = E.stepState(cs0, steps0[cs0.at].id);
        stuck.help = true;
        stuck.tries = 1;
        st = stored(st);
        const bs = E.bandState(st, g.id, band);
        const cs = E.chapterState(bs, c.id);
        const at = `${g.id} ${band} ${c.id}`;
        assert.equal(cs.done, false, at);
        assert.equal(E.activeSteps(c, cs.flags)[cs.at].id, steps0[cs0.at].id, `${at}: same step`);
        assert.equal(cs.steps[steps0[cs0.at].id].help, true, `${at}: help flag kept`);
        assert.equal(cs.steps[steps0[cs0.at].id].tries, 1, `${at}: tries kept`);
        const page = text(UI.chapterHTML(I, g, band, c, i, cs, UI_STATE(), {}));
        assert.ok(page.length > 200, `${at}: renders`);
        play(bs, c);
        assert.ok(cs.done, `${at}: finishes`);
        assert.ok(E.isUnlocked(g, band, bs, i + 1), `${at}: next chapter opens`);
        // The chapter that was added is still locked until the one before it is done.
        const last = chapters.length - 1;
        assert.equal(
          E.isUnlocked(g, band, bs, last),
          i + 1 === last,
          `${at}: later chapters stay locked`,
        );
      }
    }
});

test("help semantics and ledger privacy hold in the added chapters", () => {
  const allowed = ["ok", "game", "chapter", "type", "level", "words"];
  for (const g of E.GAMES)
    for (const band of E.BANDS) {
      const c = lastOf(g, band);
      for (const step of c.steps) {
        const at = `${g.id} ${band} ${step.id}`;
        const answer = answerFor(step);
        const ss = { tries: 0, ok: false, shown: false, help: false };
        const res = E.attempt(step, ss, answer);
        let e = E.ledgerEntry(g, band, c, step, ss, res);
        assert.equal(e.src, "flagship", at);
        assert.equal(e.stage, "independent", `${at}: no help, no model`);
        assert.deepEqual(e.supports, { spanish: false, model: false }, at);
        ss.help = true;
        e = E.ledgerEntry(g, band, c, step, ss, res);
        assert.equal(e.stage, "supported", `${at}: Spanish help marks the step supported`);
        assert.equal(e.supports.spanish, true, at);
        // Privacy: the ledger holds counts and levels, never what the learner wrote or picked.
        assert.deepEqual(
          Object.keys(e.m).filter((k) => e.m[k] !== undefined && !allowed.includes(k)),
          [],
          `${at}: no extra ledger fields`,
        );
        if (step.type === "write") {
          assert.ok(
            !JSON.stringify(e).includes(step.model.slice(0, 30)),
            `${at}: no learner text in ledger`,
          );
          assert.equal(e.m.words, step.model.split(/\s+/).filter(Boolean).length, at);
        }
        // Spanish help explains the task, not the answer.
        if (step.type === "write")
          assert.ok(!step.help.includes(step.model), `${at}: help states the model`);
        if (step.type === "choose")
          for (const o of step.options.filter((x) => x.ok && x.text.length > 6))
            assert.ok(!step.help.includes(o.text), `${at}: help states the answer`);
      }
      // Revealing the model on a third miss marks it supported and keeps the learner's own text apart.
      const writeStep = c.steps.find((s) => s.type === "write");
      const ss = { tries: 0 };
      for (let n = 0; n < 3; n++) E.attempt(writeStep, ss, writeStep.prompt);
      const res = E.attempt(writeStep, ss, writeStep.prompt);
      const e = E.ledgerEntry(g, band, c, writeStep, ss, res);
      assert.equal(ss.shown, true);
      assert.equal(e.stage, "supported");
      assert.equal(e.supports.model, true);
    }
});

test("added chapters label invented material and give each wrong choice a specific reason", () => {
  for (const g of E.GAMES)
    for (const band of E.BANDS) {
      const c = lastOf(g, band);
      assert.match(c.intro, /made up|invented/i, `${c.id}: intro says the material is invented`);
      assert.match(c.introEs, /inventad/i, `${c.id}: Spanish intro says so too`);
      for (const d of c.docs.filter((x) => x.kind === "chart"))
        assert.match(
          d.source || "",
          /invented|made up|practice/i,
          `${c.id} ${d.id}: chart source labelled`,
        );
      for (const s of c.steps.filter((x) => x.type === "choose")) {
        assert.ok(s.options.length >= 3, `${c.id} ${s.id}: plausible alternatives`);
        for (const o of s.options.filter((x) => !x.ok)) {
          assert.ok(o.why.length >= 40, `${c.id} ${s.id} ${o.id}: specific feedback`);
          assert.match(o.why, /\?|[.]/, `${c.id} ${s.id} ${o.id}`);
        }
      }
    }
  // The right answer is not always in the same place within one chapter.
  for (const g of E.GAMES)
    for (const band of E.BANDS) {
      const c = lastOf(g, band);
      const at = c.steps
        .filter((s) => s.type === "choose")
        .map((s) => s.options.findIndex((o) => o.ok));
      if (at.length > 1) assert.ok(new Set(at).size > 1, `${c.id}: answer positions ${at}`);
    }
});

test("the greenhouse rooms keep the escape-room pattern: 3 locks (3-5) and 4 locks (6-8), explain after interpret", () => {
  const er = E.gameById("escape-room");
  assert.deepEqual([...new Set(lastOf(er, "3-5").steps.map((s) => s.lock))], [1, 2, 3]);
  assert.deepEqual([...new Set(lastOf(er, "6-8").steps.map((s) => s.lock))], [1, 2, 3, 4]);
});

test("reading-room negotiation: each compromise sets a flag, shows only its own last step, and finishes", () => {
  const cq = E.gameById("conversation-quest");
  for (const band of E.BANDS) {
    const c = lastOf(cq, band);
    const deal = c.steps.find((s) => s.id === "deal");
    const picks = deal.options.filter((o) => o.ok);
    assert.equal(picks.length, 2, `${c.id}: two fair plans`);
    const flagKey = Object.keys(picks[0].sets)[0];
    assert.deepEqual(Object.keys(picks[1].sets), [flagKey]);
    assert.notEqual(picks[0].sets[flagKey], picks[1].sets[flagKey]);
    const branches = c.steps.filter((s) => s.when);
    assert.equal(branches.length, 2, `${c.id}: one closing step per plan`);
    const seen = [];
    for (const pick of picks) {
      const st = {};
      const bs = E.bandState(st, cq.id, band);
      const cs = E.chapterState(bs, c.id);
      for (let guard = 0; guard < 20 && !cs.done; guard++) {
        const step = E.activeSteps(c, cs.flags)[cs.at];
        const ss = E.stepState(cs, step.id);
        const input = step.id === "deal" ? pick.id : answerFor(step);
        const r = E.attempt(step, ss, input);
        assert.ok(r.ok, `${c.id} ${step.id}`);
        E.applyFlags(bs, cs, r.sets);
        E.advance(bs, c, cs);
      }
      assert.ok(cs.done, `${c.id}: ${pick.id} finishes`);
      const done = E.activeSteps(c, cs.flags).map((s) => s.id);
      const mine = branches.filter((b) => E.matches(b.when, cs.flags));
      assert.equal(mine.length, 1, `${c.id}: exactly one closing step for ${pick.id}`);
      assert.ok(done.includes(mine[0].id));
      seen.push(mine[0].id);
      const kept = E.artifactOf(cq, band, bs).find((a) => a.chapter.id === c.id).entries;
      assert.ok(
        kept.some((e) => /plan|booking/i.test(e.label)),
        `${c.id}: the plan is kept`,
      );
    }
    assert.notEqual(seen[0], seen[1], `${c.id}: different plans, different closing steps`);
    // Choosing a plan also changes the flags a learner carries (saved with their progress).
    const st = {};
    const bs = E.bandState(st, cq.id, band);
    const cs = E.chapterState(bs, c.id);
    E.applyFlags(bs, cs, picks[0].sets);
    assert.equal(stored(st)[cq.id][band].flags[flagKey], picks[0].sets[flagKey]);
  }
});

test("plausible but wrong answers do not pass the added write steps", () => {
  const step = (game, band, id) => lastOf(E.gameById(game), band).steps.find((s) => s.id === id);
  const fails = (s, answer, kind) => {
    const r = K.checkWrite(answer, s.check, s.prompt);
    assert.equal(r.ok, false, `${s.id}: "${answer}"`);
    if (kind)
      assert.ok(
        r.missing.some((m) => m.kind === kind),
        `${s.id}: ${kind} in ${r.missing.map((m) => m.kind)}`,
      );
  };
  // Newsroom: the unchecked number, and a cause the data cannot show, are named as errors.
  fails(
    step("newsroom-challenge", "3-5", "revise"),
    "The count sheet shows that about 40 students ride Bus 12 on Monday.",
    "avoid",
  );
  fails(
    step("newsroom-challenge", "6-8", "revise"),
    "The fare-card counts show that Route 9 ridership fell by half after the schedule change.",
    "avoid",
  );
  assert.ok(
    K.checkWrite(
      "The fare-card counts show boardings fell from 4,000 in September to 3,800 in October, not by half.",
      step("newsroom-challenge", "6-8", "revise").check,
    ).ok,
    "a rejected wrong claim is a correction",
  );
  fails(
    step("newsroom-challenge", "6-8", "lead"),
    "Metro Transit has a new schedule that is the best change.",
    "opinion",
  );
  // Evidence detective: a fluent answer that uses the donation date as the printing date, or has no evidence.
  fails(
    step("evidence-detective", "6-8", "answer"),
    "It is true that the family gave it in 1983, but the label should say 1983 because that is what the card says.",
    "idea",
  );
  fails(
    step("evidence-detective", "6-8", "defend"),
    "The ticket was printed in 1983 because the museum got it then, so the label is right.",
    "idea",
  );
  fails(
    step("evidence-detective", "3-5", "defend"),
    "The blue shell is in Room 12 because I think so.",
    "idea",
  );
  // Escape room: the tempting reading (10:00) is not the answer, and a bare answer has no reason.
  fails(
    step("escape-room", "6-8", "l1-explain"),
    "The rule was met at 10:00 because the log shows 29 degrees at 10:00.",
    "idea",
  );
  fails(
    step("escape-room", "3-5", "l1-explain"),
    "The dial is 22 because the chart says we water basil.",
    "idea",
  );
  fails(
    step("escape-room", "6-8", "l3-explain"),
    "Zones B, C and D need the fan because the chart shows 71, 78 and 80, which are above 70.",
    "idea",
  );
  // Conversation quest: a polite line that does not repair anything, and a repair that is rude.
  fails(
    step("conversation-quest", "6-8", "repair"),
    "Could you please give us the room for thirty minutes? Thank you.",
    "clarify",
  );
  fails(
    step("conversation-quest", "6-8", "repair"),
    "Give me a break, I said thirty, not thirteen. Just to check, listen better.",
    "rude",
  );
  fails(
    step("conversation-quest", "3-5", "repair"),
    "You are wrong, I meant out loud and you better listen.",
    "rude",
  );
  fails(
    step("conversation-quest", "3-5", "propose-days"),
    "Excuse me, Ms. Ruiz. Leo will take Thursday at 3:30. Could we please write that down?",
    "idea",
  );
});
