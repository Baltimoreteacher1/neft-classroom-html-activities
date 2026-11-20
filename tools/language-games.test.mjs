// Language Games (/language-games): content integrity for all four games in both bands, the rule checks in
// src/flagship/checks.js, the help ladder (never the answer on the first two misses), progression (chapters unlock in
// order) and story flags. Browser journey: tools/language-games-e2e.mjs.
import assert from "node:assert/strict";
import test from "node:test";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const E = await import(new URL("src/flagship/engine.js", LAB));
const K = await import(new URL("src/flagship/checks.js", LAB));
const SITEMAP = await import(new URL("src/sitemap.js", LAB));
const HOME = await import(new URL("src/home-registry.js", LAB));

const IDS = ["escape-room", "evidence-detective", "conversation-quest", "newsroom-challenge"];
const allSteps = (game) =>
  E.BANDS.flatMap((band) =>
    E.chaptersOf(game, band).flatMap((c) => c.steps.map((s) => ({ band, chapter: c, step: s }))),
  );

test("four games, each complete in grades 3-5 and 6-8 (validateGame finds nothing)", () => {
  assert.deepEqual(
    E.GAMES.map((g) => g.id),
    IDS,
  );
  for (const g of E.GAMES) assert.deepEqual(E.validateGame(g), [], g.id);
  // Launch chapters plus the one added after launch (greenhouse room, museum case, reading-room encounter, transit
  // assignment). Old chapters keep their ids and order: tools/language-games-chapters.test.mjs pins both.
  const counts = {
    "escape-room": 4,
    "evidence-detective": 4,
    "conversation-quest": 5,
    "newsroom-challenge": 4,
  };
  for (const g of E.GAMES)
    for (const b of E.BANDS) assert.equal(E.chaptersOf(g, b).length, counts[g.id], `${g.id} ${b}`);
});

test("each game has the mechanics it promises", () => {
  for (const b of E.BANDS) {
    const er = E.gameById("escape-room");
    for (const c of E.chaptersOf(er, b)) {
      const locks = [...new Set(c.steps.map((s) => s.lock))];
      assert.ok(locks.length >= 3 && locks.length <= 4, `${c.id}: 3-4 locks`);
      for (const n of locks) {
        const types = c.steps.filter((s) => s.lock === n).map((s) => s.type);
        assert.ok(
          types.includes("choose") && types.includes("write"),
          `${c.id} lock ${n}: interpret then explain`,
        );
      }
    }
    for (const c of E.chaptersOf(E.gameById("evidence-detective"), b)) {
      const sort = c.steps.find((s) => s.type === "sort");
      assert.ok(
        sort?.reasons && sort.cats.length === 2,
        `${c.id}: relevant/irrelevant sort with reasons`,
      );
      const writes = c.steps.filter((s) => s.type === "write");
      assert.ok(
        writes.length >= 2 && writes.some((s) => s.npc),
        `${c.id}: a defense and an answer to a counterclaim`,
      );
      assert.ok(
        writes.some((s) => s.check.connector?.some((j) => ["contrast", "concession"].includes(j))),
        `${c.id}: counterclaim needs contrast`,
      );
    }
    const cq = E.gameById("conversation-quest");
    const cqSteps = E.chaptersOf(cq, b).flatMap((c) => c.steps);
    assert.ok(
      cqSteps.some((s) => s.check?.register === "polite"),
      `quest ${b}: register is checked`,
    );
    assert.ok(
      cqSteps.some((s) => s.check?.clarify),
      `quest ${b}: a misunderstanding is repaired`,
    );
    assert.ok(
      cqSteps.filter((s) => s.type === "write").every((s) => s.say),
      `quest ${b}: every line can be spoken`,
    );
    assert.ok(
      cqSteps.some((s) => s.when) || E.chaptersOf(cq, b).some((c) => c.introBy || c.outroBy),
      `quest ${b}: earlier choices change later encounters`,
    );
    for (const c of E.chaptersOf(E.gameById("newsroom-challenge"), b)) {
      const kinds = new Set(c.docs.map((d) => d.kind));
      for (const k of ["interview", "chart", "witness"])
        assert.ok(kinds.has(k), `${c.id}: has a ${k}`);
      assert.ok(
        c.docs.filter((d) => d.kind === "witness").length >= 2,
        `${c.id}: two eyewitnesses`,
      );
      const keeps = c.steps.map((s) => s.keep).filter(Boolean);
      for (const k of ["Headline", "Lead"]) assert.ok(keeps.includes(k), `${c.id}: keeps a ${k}`);
      assert.ok(
        c.steps.some((s) => s.type === "sort"),
        `${c.id}: fact and opinion sort`,
      );
      assert.ok(
        c.steps.some((s) => s.check?.avoid?.length),
        `${c.id}: a revision for accuracy`,
      );
    }
  }
});

test("rule checks: a strong model answer passes; an empty or copied-prompt answer fails", () => {
  let n = 0;
  for (const g of E.GAMES)
    for (const { band, chapter, step } of allSteps(g)) {
      if (step.type !== "write") continue;
      const at = `${g.id} ${band} ${chapter.id} ${step.id}`;
      assert.ok(K.checkWrite(step.model, step.check, step.prompt).ok, `${at}: model passes`);
      assert.equal(K.checkWrite("", step.check, step.prompt).ok, false, `${at}: empty fails`);
      assert.equal(
        K.checkWrite(step.prompt, step.check, step.prompt).ok,
        false,
        `${at}: copied prompt fails`,
      );
      n++;
    }
  assert.ok(n >= 60, `write steps checked: ${n}`);
});

test("checks.js rules", () => {
  assert.ok(K.hasPhrase("We repaired it.", "repair*"));
  assert.ok(K.hasPhrase("It opens at 4:15 p.m.", "4:15"));
  assert.ok(!K.hasPhrase("blueberry", "blue"));
  assert.ok(K.connectorJobs("I stayed home because I was sick.").includes("cause"));
  assert.ok(
    K.connectorJobs("It is true that it rained, but the soil was dry.").includes("concession"),
  );
  const polite = { register: "polite" };
  assert.ok(K.checkWrite("Excuse me, could you help me return this lamp?", polite).ok);
  assert.equal(K.checkWrite("Give me my money back.", polite).ok, false);
  assert.equal(K.checkWrite("I want my money back.", polite).missing[0].kind, "polite");
  assert.ok(K.checkWrite("Sorry, I meant Tuesday, not Thursday.", { clarify: true }).ok);
  const avoid = { avoid: [{ any: ["50"], clue: ["x", "y"] }] };
  assert.equal(K.checkWrite("They picked 50 tomatoes.", avoid).ok, false);
  assert.ok(
    K.checkWrite("They picked 34 tomatoes, not 50.", avoid).ok,
    "a rejected wrong fact is a correction",
  );
  assert.equal(K.checkWrite("Amazing Garden Has Best Harvest", { noOpinion: true }).ok, false);
  assert.ok(K.checkWrite("School Garden Harvests 34 Tomatoes", { noOpinion: true, max: 10 }).ok);
  assert.equal(
    K.checkWrite("one two three four five six seven eight nine ten eleven", { max: 10 }).missing[0]
      .kind,
    "long",
  );
  assert.equal(K.checkWrite("The answer is yes", { min: 8 }).missing[0].kind, "short");
});

test("help ladder: clue, then rule, then model; never the answer on the first two misses", () => {
  for (const g of E.GAMES)
    for (const { band, chapter, step } of allSteps(g)) {
      const at = `${g.id} ${band} ${chapter.id} ${step.id}`;
      const ss = { tries: 0 };
      if (step.type === "choose") {
        const right = step.options.filter((o) => o.ok);
        const wrong = step.options.find((o) => !o.ok);
        if (!wrong) continue;
        for (const level of ["clue", "rule"]) {
          const r = E.attempt(step, ss, wrong.id);
          assert.equal(r.level, level, at);
          for (const o of right)
            if (o.text.length > 6)
              assert.ok(!r.msg.join(" ").includes(o.text), `${at}: ${level} states the answer`);
        }
        const r3 = E.attempt(step, ss, wrong.id);
        assert.ok(r3.ok && r3.level === "model" && ss.shown, `${at}: third miss shows the answer`);
      } else if (step.type === "sort") {
        const wrongAnswers = Object.fromEntries(
          step.items.map((it) => [
            it.id,
            { cat: step.cats.find((c) => c.id !== it.cat).id, reason: it.reason },
          ]),
        );
        assert.equal(E.attempt(step, ss, wrongAnswers).level, "clue", at);
        assert.equal(E.attempt(step, ss, wrongAnswers).level, "rule", at);
        assert.equal(E.attempt(step, ss, wrongAnswers).level, "model", at);
      } else {
        const r1 = E.attempt(step, ss, step.prompt);
        assert.equal(r1.level, "clue", at);
        assert.ok(!r1.msg.join(" ").includes(step.model), `${at}: clue states the model`);
        const r2 = E.attempt(step, ss, step.prompt);
        assert.equal(r2.level, "rule", at);
        assert.ok(!r2.msg.join(" ").includes(step.model), `${at}: rule states the model`);
        assert.equal(E.attempt(step, ss, step.prompt).level, "model", at);
        assert.ok(
          E.attempt(step, ss, step.model).ok,
          `${at}: own answer still accepted after the model`,
        );
      }
    }
});

test("progression: chapters unlock in order, steps advance, flags carry forward", () => {
  for (const g of E.GAMES)
    for (const band of E.BANDS) {
      const st = {};
      const bs = E.bandState(st, g.id, band);
      const chapters = E.chaptersOf(g, band);
      assert.ok(E.isUnlocked(g, band, bs, 0));
      assert.equal(E.isUnlocked(g, band, bs, 1), false, `${g.id} ${band}: chapter 2 starts locked`);
      for (const [i, c] of chapters.entries()) {
        assert.ok(E.isUnlocked(g, band, bs, i), `${g.id} ${band} ${c.id} unlocked in order`);
        const cs = E.chapterState(bs, c.id);
        for (let guard = 0; guard < 40 && !cs.done; guard++) {
          const step = E.activeSteps(c, cs.flags)[cs.at];
          const ss = E.stepState(cs, step.id);
          const input =
            step.type === "choose"
              ? step.options.find((o) => o.ok).id
              : step.type === "sort"
                ? Object.fromEntries(
                    step.items.map((it) => [it.id, { cat: it.cat, reason: it.reason }]),
                  )
                : step.model;
          const r = E.attempt(step, ss, input);
          assert.ok(r.ok, `${g.id} ${c.id} ${step.id}`);
          E.applyFlags(bs, cs, r.sets);
          E.advance(bs, c, cs);
        }
        assert.ok(cs.done, `${g.id} ${c.id} completes`);
        if (i + 1 < chapters.length) assert.ok(E.isUnlocked(g, band, bs, i + 1));
      }
      const p = E.progressOf(g, band, bs);
      assert.ok(p.complete && p.done === chapters.length);
      const art = E.artifactOf(g, band, bs);
      assert.ok(
        art.every((a) => a.done) && art.some((a) => a.entries.length),
        `${g.id} ${band}: artifact has the learner's work`,
      );
      if (g.id === "conversation-quest")
        assert.ok(Object.keys(bs.flags).length, `quest ${band}: choices set flags`);
    }
});

test("a flag set in an earlier encounter changes a later one", () => {
  const cq = E.gameById("conversation-quest");
  for (const band of E.BANDS) {
    const chapters = E.chaptersOf(cq, band);
    const flagged = chapters
      .slice(1)
      .filter((c) => c.introBy || c.outroBy || c.steps.some((s) => s.when));
    assert.ok(flagged.length >= 1, band);
    const c = flagged[0];
    const v = (c.introBy || c.outroBy || [])[0] || { when: c.steps.find((s) => s.when).when };
    const [k, val] = Object.entries(v.when)[0];
    if (c.introBy)
      assert.notEqual(
        E.storyLine(c, "intro", { [k]: val }),
        E.storyLine(c, "intro", {}),
        `${c.id}: intro changes with ${k}`,
      );
    else if (c.steps.some((s) => s.when))
      assert.notEqual(E.activeSteps(c, { [k]: val }).length, E.activeSteps(c, {}).length);
  }
});

test("read-aloud covers every document; no timers, points or scores in the content", () => {
  // "points" as a verb ("the arrow points past the shed") is fine; points as a reward is not.
  const bad =
    /\b(timer|countdown|hurry|(earn|win|get|collect|lose)\s+(\d+\s+)?points?|points? (earned|total)|scores?|scored|leaderboard|stars? earned|beat the clock|WIDA level)\b/i;
  for (const g of E.GAMES)
    for (const band of E.BANDS)
      for (const c of E.chaptersOf(g, band)) {
        for (const d of c.docs)
          assert.ok(E.docText(d).length > d.title.length, `${c.id} ${d.id}: read-aloud text`);
        const text = JSON.stringify(c);
        const m = text.match(bad);
        assert.ok(!m, `${c.id}: "${m?.[0]}"`);
      }
});

test("registered once in the site map (play, game) and on the home page (explore, featured)", () => {
  const d = SITEMAP.DESTINATIONS.filter((x) => x.id === "language-games");
  assert.equal(d.length, 1);
  assert.equal(d[0].section, "play");
  assert.equal(d[0].kind, "game");
  const h = HOME.HOME_CARDS.filter((x) => x.id === "language-games");
  assert.equal(h.length, 1);
  assert.equal(h[0].group, "explore");
  assert.equal(h[0].featured, true);
});
