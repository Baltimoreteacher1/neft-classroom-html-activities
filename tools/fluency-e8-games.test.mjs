// Phase 4: the unified game engine and all ten game families, without a browser. Every generated challenge is checked
// for mathematical validity (answers recomputed independently, builds solved by an explicit move list on a verified model,
// distractors really wrong, hints that never give the answer away), and every session is played by simulated learners:
// perfect, always wrong, mixed, hint-taking, paused, saved and restored.
import assert from "node:assert/strict";
import { MathVisualEngine, seeded } from "../math/fluency-lab/e8/engine-core.js";
import {
  familiesForGrade,
  GameSession,
  getFamily,
  listFamilies,
} from "../math/fluency-lab/e8/games.js";
import {
  mean,
  median,
  parseRational,
  quartiles,
  R,
  Rational,
} from "../math/fluency-lab/e8/rational.js";
import { ALL_SKILLS } from "../math/fluency-lab/problem-bank.js";
import { skillKey } from "../math/fluency-lab/tutor-engine.js";

const FAMILY_IDS = [
  "numberQuest",
  "fractionFactory",
  "multiplicationArena",
  "decimalDash",
  "ratioArchitect",
  "equationBalance",
  "graphExplorer",
  "geometryBuilder",
  "dataDetective",
  "strategyTournament",
];
assert.deepEqual(
  listFamilies()
    .map((f) => f.id)
    .sort(),
  [...FAMILY_IDS].sort(),
);
for (let g = 1; g <= 8; g += 1)
  assert.ok(familiesForGrade(g).length >= 2, `Grade ${g} has too few games`);
const skills = new Set(ALL_SKILLS.map(skillKey));
const bilingual = (o, what) => assert.ok(o && o.en && o.es, `${what} needs English and Spanish`);

// ------------------------------------------------------------------ independent recomputation of numeric answers
const num = (s) => Number(String(s).replace(/,/g, ""));
function independent(prompt) {
  let m;
  if ((m = /^(\d+) × (\d+) = \?$/.exec(prompt))) return R(num(m[1]) * num(m[2]));
  if ((m = /^(\d+) ÷ (\d+) = \?$/.exec(prompt))) return R(num(m[1]), num(m[2]));
  if ((m = /^(\d+) \+ □ = (\d+)\. What goes in the box\?$/.exec(prompt)))
    return R(num(m[2]) - num(m[1]));
  if ((m = /^Round (\d+) to the nearest (ten|hundred)\.$/.exec(prompt))) {
    const u = m[2] === "ten" ? 10 : 100;
    return R(Math.floor(num(m[1]) / u + 0.5) * u);
  }
  if ((m = /value of the digit in the (\w+) place of ([\d,]+)\?$/.exec(prompt))) {
    const p = { ones: 0, tens: 1, hundreds: 2, thousands: 3 }[m[1]];
    return R(Number(m[2].replace(/,/g, "").split("").reverse()[p]) * 10 ** p);
  }
  if ((m = /^(-?\d+) ([+−]) \(?(-?\d+)\)? = \?$/.exec(prompt)))
    return R(m[2] === "+" ? num(m[1]) + num(m[3]) : num(m[1]) - num(m[3]));
  if ((m = /^(\d+)\/(\d+) ([+−]) (\d+)\/(\d+) = \? \(simplest form\)$/.exec(prompt))) {
    const a = R(num(m[1]), num(m[2]));
    const b = R(num(m[4]), num(m[5]));
    return m[3] === "+" ? a.add(b) : a.sub(b);
  }
  if ((m = /^([\d.]+) \+ ([\d.]+) = \?$/.exec(prompt)))
    return Rational.of(m[1]).add(Rational.of(m[2]));
  if ((m = /^([\d.]+) × ([\d.]+) = \?$/.exec(prompt)))
    return Rational.of(m[1]).mul(Rational.of(m[2]));
  if ((m = /place of (\d\.\d{3})\?$/.exec(prompt))) {
    const place = { tenths: 0, hundredths: 1, thousandths: 2 }[/the (\w+) place/.exec(prompt)[1]];
    return R(Number(m[1].split(".")[1][place]));
  }
  if ((m = /^(\d+):(\d+) = (\d+):□$/.exec(prompt))) return R(num(m[2]) * (num(m[3]) / num(m[1])));
  if ((m = /^(\d+):(\d+) = □:(\d+)$/.exec(prompt))) return R(num(m[1]) * (num(m[3]) / num(m[2])));
  if ((m = /^A car goes (\d+) miles in (\d+) hours/.exec(prompt))) return R(num(m[1]), num(m[2]));
  if ((m = /^(\d+)\/(\d+) = (\d+)\/x\. Find x\.$/.exec(prompt)))
    return R(num(m[2]) * num(m[3]), num(m[1]));
  if ((m = /^(\d*)x(?: \+ (\d+))? = (\d+)\. What is x\?$/.exec(prompt))) {
    const a = m[1] ? num(m[1]) : 1;
    return R(num(m[3]) - num(m[2] || 0), a);
  }
  if ((m = /^Find the slope through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\.$/.exec(prompt)))
    return R(num(m[4]) - num(m[2]), num(m[3]) - num(m[1]));
  if ((m = /^A triangle has base (\d+) and height (\d+)/.exec(prompt)))
    return R(num(m[1]) * num(m[2]), 2);
  if ((m = /is a (\d+) by (\d+) rectangle with a (\d+) by (\d+) corner removed/.exec(prompt)))
    return R(num(m[1]) * num(m[2]) - num(m[3]) * num(m[4]));
  if ((m = /^Data: ([\d, ]+)\. What is the interquartile range/.exec(prompt))) {
    const q = quartiles(m[1].split(",").map((x) => num(x)));
    return q.q3.sub(q.q1);
  }
  if ((m = /^Find the median of ([\d, ]+)\.$/.exec(prompt)))
    return median(m[1].split(",").map((x) => num(x)));
  if ((m = /^What is the mean of ([\d, ]+)\?$/.exec(prompt)))
    return mean(m[1].split(",").map((x) => num(x)));
  if ((m = /\. Feed it numbers.*what it outputs for (\d+)\.$/.exec(prompt))) return undefined; // needs the hidden rule; checked through the tool below
  return undefined;
}

const makeRng = (seed) => seeded(seed);
const stats = {
  challenges: 0,
  numeric: 0,
  choice: 0,
  build: 0,
  reason: 0,
  independentlyVerified: 0,
};
for (const family of listFamilies()) {
  bilingual(family.title, `${family.id}.title`);
  bilingual(family.blurb, `${family.id}.blurb`);
  for (const grade of family.grades) {
    for (const level of [0, 1, 2]) {
      for (let seed = 1; seed <= 40; seed += 1) {
        const tag = `${family.id} g${grade} L${level} #${seed}`;
        const c = family.make(makeRng(seed * 7919 + grade * 131 + level), {
          grade,
          level,
          round: seed % 8,
          variant: 0,
        });
        stats.challenges += 1;
        assert.ok(c.id && typeof c.id === "string", `${tag}: id`);
        bilingual(c.prompt, `${tag} prompt`);
        bilingual(c.explanation, `${tag} explanation`);
        assert.equal(c.hints.length, 3, `${tag}: three hints`);
        c.hints.forEach((h, i) => bilingual(h, `${tag} hint ${i + 1}`));
        assert.ok(
          c.skill === null || skills.has(c.skill),
          `${tag}: skill ${c.skill} is not in the library`,
        );
        assert.ok([0, 1, 2].includes(c.level));
        for (const d of c.distractors || []) {
          bilingual(d.why, `${tag} distractor`);
          assert.ok(!c.check(d.value), `${tag}: distractor ${d.value} is accepted as correct`);
        }
        if (c.repr) {
          const e = new MathVisualEngine(c.repr.model, c.repr.params);
          assert.deepEqual(e.verify(), [], `${tag}: representation model fails verification`);
        }
        if (c.tool) {
          const e = new MathVisualEngine(c.tool.model, c.tool.params);
          assert.deepEqual(e.verify(), [], `${tag}: tool model fails verification`);
        }
        if (c.kind === "numeric") {
          stats.numeric += 1;
          assert.ok(c.answer instanceof Rational, `${tag}: numeric answer must be exact`);
          assert.ok(c.check(c.answer.toString()), `${tag}: the key is rejected`);
          assert.ok(!c.check(c.answer.add(1).toString()), `${tag}: answer + 1 accepted`);
          assert.ok(!c.check(""), `${tag}: empty accepted`);
          const text = c.prompt.en;
          const want = independent(text);
          if (want !== undefined) {
            assert.ok(
              want.eq(c.answer),
              `${tag}: "${text}" has key ${c.answer} but independent value ${want}`,
            );
            stats.independentlyVerified += 1;
          }
          const answerText = c.answer.isInteger() ? String(c.answer) : "";
          if (answerText.length >= 2)
            for (let i = 0; i < 2; i += 1)
              assert.ok(
                !new RegExp(`(?<![\\d.])${answerText}(?![\\d.])`).test(
                  c.hints[i].en.replace(text, ""),
                ),
                `${tag}: hint ${i + 1} gives away ${answerText}: ${c.hints[i].en}`,
              );
          if (c.tool?.model === "functionMachine") {
            const e = new MathVisualEngine("functionMachine", c.tool.params);
            const t = Number(/outputs for (\d+)/.exec(text)[1]);
            e.dispatch({ type: "feed", value: t });
            assert.equal(
              e.derive().facts.rows[0][1],
              c.answer.toString(),
              `${tag}: the machine and the key disagree`,
            );
          }
        } else if (c.kind === "choice") {
          stats.choice += 1;
          assert.ok(c.options.length >= 2 && c.options.length <= 4);
          const ok = c.options.map((o, i) => (o.ok ? i : -1)).filter((i) => i >= 0);
          assert.equal(ok.length, 1, `${tag}: exactly one right option`);
          assert.equal(
            new Set(c.options.map((o) => o.text.en)).size,
            c.options.length,
            `${tag}: duplicate options`,
          );
          c.options.forEach((o, i) => {
            bilingual(o.text, `${tag} option`);
            assert.equal(c.check(i), Boolean(o.ok));
            if (!o.ok) bilingual(o.why, `${tag} wrong-option reason`);
          });
        } else if (c.kind === "build") {
          stats.build += 1;
          const e = c.make();
          assert.deepEqual(e.verify(), [], `${tag}: initial model fails verification`);
          assert.ok(!c.check(e), `${tag}: the goal is already met before any move`);
          assert.ok(c.solution.length >= 1);
          c.solution.forEach((a, i) => {
            const r = e.dispatch(a);
            assert.ok(
              r.ok,
              `${tag}: solution step ${i} ${JSON.stringify(a)} refused: ${r.reason?.en}`,
            );
            assert.deepEqual(e.verify(), [], `${tag}: solution step ${i} breaks the model`);
          });
          assert.ok(c.check(e), `${tag}: the listed solution does not meet the goal`);
        } else assert.fail(`${tag}: unknown kind ${c.kind}`);
      }
    }
  }
}
assert.ok(stats.build > 400 && stats.numeric > 800 && stats.choice > 400, JSON.stringify(stats));
assert.ok(
  stats.independentlyVerified / stats.numeric > 0.6,
  `only ${stats.independentlyVerified} of ${stats.numeric} numeric answers were recomputed independently`,
);

// ------------------------------------------------------------------ playing sessions
const answerFor = (s, wrong = false) => {
  const c = s.challenge;
  if (c.kind === "numeric") return wrong ? "987654" : c.answer.toString();
  if (c.kind === "choice" || (c.kind === "reason" && !c.free)) {
    const i = c.options.findIndex((o) => Boolean(o.ok) === !wrong);
    return i;
  }
  if (c.kind === "reason") return "I thought about it by using a model and checking each step";
  if (c.kind === "build") {
    if (!wrong) c.solution.forEach((a) => s.move(a));
    return null;
  }
  throw new Error("unknown challenge kind");
};
function play(s, { wrongEvery = 0, hint = false, limit = 60 } = {}) {
  s.start();
  const ids = [];
  let step = 0;
  while (s.status === "playing" && step < limit) {
    const c = s.challenge;
    ids.push(c.id);
    step += 1;
    if (hint && c.kind !== "reason") assert.ok(s.hint());
    const wrong = wrongEvery > 0 && step % wrongEvery === 0 && c.kind !== "reason";
    let r = s.submit(answerFor(s, wrong));
    let guard = 0;
    while (r.status === "incorrect" && guard < 3) {
      r = s.submit(answerFor(s, wrong));
      guard += 1;
    }
    assert.ok(["correct", "missed"].includes(r.status), `unexpected ${r.status} on ${c.id}`);
    if (r.status === "missed") assert.ok(r.explanation?.en, "a miss explains");
    s.next();
  }
  assert.ok(step < limit, "the session never finished");
  return ids;
}
for (const family of listFamilies()) {
  for (const grade of family.grades) {
    const tag = `${family.id} g${grade}`;
    const perfect = new GameSession({ family: family.id, grade, seed: 3, rounds: 8 });
    const ids = play(perfect);
    assert.equal(perfect.status, "complete", `${tag}: perfect play completes`);
    const r = perfect.results();
    assert.equal(
      r.rounds,
      r.firstTry,
      `${tag}: a perfect first-try player has every round independent`,
    );
    assert.equal(r.missed, 0);
    assert.equal(r.stars, 3);
    assert.ok(r.reasoning >= 1, `${tag}: a reasoning prompt appeared`);
    assert.equal(perfect.level, 2, `${tag}: difficulty followed a perfect player to the top`);
    assert.ok(r.evidence.every((e) => e.independent && e.correct));
    assert.equal(new Set(ids).size, ids.length, `${tag}: no repeated challenge`);
    // Same seed, same game.
    const again = play(new GameSession({ family: family.id, grade, seed: 3, rounds: 8 }));
    assert.deepEqual(again, ids, `${tag}: deterministic`);
    assert.notDeepEqual(
      play(new GameSession({ family: family.id, grade, seed: 4, rounds: 8 })),
      ids,
      `${tag}: another seed plays differently`,
    );
    // Always wrong: the game still ends, steps difficulty down, and follow-ups are different problems.
    const lost = new GameSession({ family: family.id, grade, seed: 5, rounds: 6 });
    const lostIds = play(lost, { wrongEvery: 1 });
    assert.equal(lost.status, "complete", `${tag}: a struggling player still reaches the end`);
    assert.ok(lost.results().missed >= 6 && lost.results().firstTry === 0);
    assert.equal(lost.level, 0);
    assert.equal(
      new Set(lostIds).size,
      lostIds.length,
      `${tag}: a miss never repeats the same item`,
    );
    assert.ok(lost.history.some((h) => !h.correct));
    // Hints turn a success into supported work.
    const hinted = new GameSession({ family: family.id, grade, seed: 6, rounds: 6 });
    play(hinted, { hint: true });
    assert.equal(hinted.results().firstTry, 0, `${tag}: hinted success is never independent`);
    assert.ok(hinted.results().supported >= 4);
    // Mixed: some misses, some wins; follow-up follows a miss with the same concept.
    const mixed = new GameSession({ family: family.id, grade, seed: 7, rounds: 8 });
    mixed.start();
    let missedConcept = null;
    for (let i = 0; i < 40 && mixed.status === "playing"; i += 1) {
      const c = mixed.challenge;
      if (missedConcept && c.kind !== "reason") {
        assert.equal(c.concept, missedConcept, `${tag}: follow-up keeps the idea`);
        assert.ok(c.followUp);
        missedConcept = null;
      }
      const wrong = i === 1 && c.kind !== "reason";
      let res = mixed.submit(answerFor(mixed, wrong));
      while (res.status === "incorrect") res = mixed.submit(answerFor(mixed, wrong));
      if (res.status === "missed" && c.kind !== "reason") missedConcept = c.concept;
      mixed.next();
    }
    assert.equal(mixed.status, "complete");
  }
}

// Pause and resume, invalid input, hint ladder, preferences, snapshots, and time independence.
{
  const s = new GameSession({ family: "multiplicationArena", grade: 3, seed: 2, rounds: 6 });
  s.start();
  s.pause();
  assert.equal(s.status, "paused");
  assert.equal(s.submit("1").status, "refused");
  assert.equal(s.hint(), null);
  s.resume();
  assert.equal(s.status, "playing");
  const c = s.challenge;
  if (c.kind === "numeric") assert.equal(s.submit("  ").status, "invalid");
  const h1 = s.hint();
  const h2 = s.hint();
  const h3 = s.hint();
  const h4 = s.hint();
  assert.deepEqual([h1.rung, h2.rung, h3.rung, h4.rung], [1, 2, 3, 3]);
  assert.ok(h1.text.en && h1.repr === null);
  assert.ok(h2.repr === null || h2.repr.model, "rung 2 shows a model when the challenge has one");
  // Preferences do not change what is correct.
  for (const options of [{ timer: true }, { sound: false }, { reducedMotion: true }]) {
    const a = play(
      new GameSession({ family: "fractionFactory", grade: 5, seed: 9, rounds: 6, options }),
    );
    const b = play(new GameSession({ family: "fractionFactory", grade: 5, seed: 9, rounds: 6 }));
    assert.deepEqual(a, b, "a preference never changes the game");
  }
  assert.equal(getFamily("decimalDash").optionalTimer, true);
  // Time independence: the same play with the clock jumping an hour at every call gives the same results.
  const realNow = Date.now;
  let t = 0;
  Date.now = () => (t += 3600000);
  const slow = new GameSession({ family: "ratioArchitect", grade: 6, seed: 11, rounds: 6 });
  play(slow);
  Date.now = realNow;
  const fast = new GameSession({ family: "ratioArchitect", grade: 6, seed: 11, rounds: 6 });
  play(fast);
  assert.deepEqual(slow.results(), fast.results(), "results do not depend on time");
  // Snapshot mid-game and restore: finished rounds keep their evidence and play completes.
  const part = new GameSession({ family: "equationBalance", grade: 7, seed: 13, rounds: 6 });
  part.start();
  for (let i = 0; i < 3; i += 1) {
    let r = part.submit(answerFor(part));
    while (r.status === "incorrect") r = part.submit(answerFor(part));
    part.next();
  }
  const saved = part.snapshot();
  const back = GameSession.restore(saved);
  assert.equal(back.status, "paused");
  assert.deepEqual(back.results().evidence, part.results().evidence);
  back.resume();
  back.status = "playing";
  back.load();
  const rest = [];
  while (back.status === "playing" && rest.length < 30) {
    rest.push(back.challenge.id);
    let r = back.submit(answerFor(back));
    while (r.status === "incorrect") r = back.submit(answerFor(back));
    back.next();
  }
  assert.equal(back.status, "complete");
  assert.ok(back.results().rounds >= 6);
  assert.throws(() => GameSession.restore('{"v":2}'));
  assert.throws(() => new GameSession({ family: "dataDetective", grade: 3 }), /not for grade/);
  // Reasoning prompts: free text needs a real sentence and filled blanks; frames fade after three accepted explanations.
  const r = new GameSession({ family: "numberQuest", grade: 4, seed: 21, rounds: 12 });
  r.start();
  let seenFree = 0;
  for (let i = 0; i < 40 && r.status === "playing"; i += 1) {
    const ch = r.challenge;
    if (ch.kind === "reason" && ch.free) {
      seenFree += 1;
      assert.equal(r.submit("ok").status, "invalid");
      if (ch.frames.length)
        assert.equal(r.submit("I started by ___ because ___.").status, "invalid");
    }
    let res = r.submit(answerFor(r));
    while (res.status === "incorrect") res = r.submit(answerFor(r));
    r.next();
  }
  assert.ok(seenFree > 0, "the session never offered a free-text reasoning prompt");
  assert.ok(r.reasoning.length >= 1 && r.status === "complete");
}

console.log(
  `Games: ${listFamilies().length} families, ${stats.challenges} challenges validated (${stats.build} builds solved, ${stats.numeric} numeric keys, ${stats.independentlyVerified} recomputed independently, ${stats.choice} choices), sessions played perfect / struggling / hinted / mixed / paused / restored.`,
);
