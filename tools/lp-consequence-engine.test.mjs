#!/usr/bin/env node
// Communication Consequence Engine (access-practice-lab/src/consequence/): every scenario is valid and solvable,
// every failing tile combination produces a visible consequence and a revision prompt, random tiles pass no round
// with probability above 1/4, the robot's success matches the LITERAL meaning of the English sentence (recomputed
// here by an independent parser, not by the engine), scaffolds fade only after two independent successes, and the
// progress store is defensive. Negative controls prove each check rejects a corrupted scenario.
import assert from "node:assert/strict";
import {
  advance,
  allChoices,
  compose,
  evaluate,
  FADE_AFTER,
  freshScenario,
  helpFolded,
  recordAttempt,
  restoreProgress,
  STATUS,
  STORAGE_KEY,
  validateScenario,
} from "../access-practice-lab/src/consequence/engine.js";
import { SCENARIOS, scenarioById } from "../access-practice-lab/src/consequence/scenarios/index.js";

let checks = 0;
const ok = (cond, msg) => {
  assert.ok(cond, msg);
  checks += 1;
};
const pairOk = (p) =>
  Array.isArray(p) && p.length === 2 && p.every((t) => typeof t === "string" && t.trim());

// ── independent literal reading of the robot's English ──────────────────────────
const WORD_DIR = { "to the right": [1, 0], "to the left": [-1, 0], up: [0, 1], down: [0, -1] };
const ORD = { first: 1, second: 2, third: 3, fourth: 4 };
function literalRobot(round, sentence) {
  if (round.kind === "path") {
    const m = sentence.match(
      /^Move (\d+) units (to the right|to the left|up|down), then move (\d+) units (to the right|to the left|up|down)\.$/,
    );
    if (!m) return null;
    let [x, y] = round.start;
    for (const [n, d] of [
      [m[1], m[2]],
      [m[3], m[4]],
    ]) {
      x += Number(n) * WORD_DIR[d][0];
      y += Number(n) * WORD_DIR[d][1];
      if (x < 0 || y < 0 || x >= round.grid.w || y >= round.grid.h) return null;
    }
    return [x, y];
  }
  if (round.kind === "point") {
    const m = sentence.match(/^Go to the point \((\d+), (\d+)\)\.$/);
    return m ? [Number(m[1]), Number(m[2])] : null;
  }
  const m = sentence.match(
    /^Pick up the (first|second|third|fourth) box from the (left|right) on the (first|second|third) shelf from the top\.$/,
  );
  if (!m) return null;
  const n = ORD[m[1]];
  return [m[2] === "left" ? n : round.grid.w - n + 1, ORD[m[3]]];
}

// ── the sweep ──────────────────────────────────────────────────────────────────
function sweepRound(scenario, index, memory) {
  const round = scenario.rounds[index];
  let total = 0;
  const wins = [];
  for (const choice of allChoices(round)) {
    total += 1;
    const r = evaluate(scenario, index, choice, memory);
    ok(r.outcome !== "incomplete", `${scenario.id}/${round.id}: a full choice is complete`);
    ok(
      r.sentence === compose(round, choice).text && !r.sentence.includes("___"),
      `${round.id}: sentence composed`,
    );
    ok(
      pairOk(r.say),
      `${scenario.id}/${round.id}: every attempt has a visible consequence (${r.sentence})`,
    );
    ok(STATUS[r.status], `${round.id}: status ${r.status} is known`);
    if (r.ok) {
      wins.push(choice);
      ok(r.revise === null, `${round.id}: success needs no revision prompt`);
    } else {
      ok(
        pairOk(r.revise),
        `${scenario.id}/${round.id}: failing path "${r.sentence}" has a revision prompt`,
      );
      ok(r.say[0] !== round.success[0], `${round.id}: a miss never shows the success line`);
    }
    if (round.kind !== "talk") {
      ok(
        r.scene && r.scene.kind === round.kind,
        `${round.id}: robot result carries a scene to draw`,
      );
      const literal = literalRobot(round, r.sentence);
      const hit = literal && literal[0] === round.target[0] && literal[1] === round.target[1];
      ok(
        Boolean(hit) === r.ok,
        `${round.id}: engine verdict matches the literal meaning of "${r.sentence}"`,
      );
      if (!r.ok && literal && round.kind !== "pick")
        ok(
          r.scene.end[0] === literal[0] && r.scene.end[1] === literal[1],
          `${round.id}: robot stops where the words say`,
        );
      if (!r.ok && literal && round.kind === "pick")
        ok(
          r.scene.picked[0] === literal[0] && r.scene.picked[1] === literal[1],
          `${round.id}: picks the box the words name`,
        );
    }
  }
  ok(wins.length >= 1, `${scenario.id}/${round.id}: solvable`);
  ok(
    wins.length / total <= 0.25,
    `${scenario.id}/${round.id}: random tiles pass with p=${(wins.length / total).toFixed(3)} > 1/4`,
  );
  return wins;
}

for (const scenario of SCENARIOS) {
  const v = validateScenario(scenario);
  ok(v.ok, `${scenario.id} valid: ${v.errors.join("; ")}`);
  ok(scenarioById(scenario.id) === scenario, `${scenario.id} resolves by id`);
  ok(scenario.rounds.length >= 3, `${scenario.id}: 3+ rounds`);
  ok(
    Object.values(scenario.standards)
      .flat()
      .every((id) => /^ELD-(SI|LA|MA|SC|SS)\./.test(id)),
    `${scenario.id}: WIDA ids`,
  );
  // Walk every reachable memory: each passing choice of round i seeds round i+1.
  let memories = [{}];
  for (let i = 0; i < scenario.rounds.length; i += 1) {
    const next = [];
    for (const memory of memories)
      for (const win of sweepRound(scenario, i, memory))
        next.push({ ...memory, [scenario.rounds[i].id]: win });
    memories = next;
  }
  ok(memories.length >= 1, `${scenario.id}: a full path to the end exists`);
}

// Either side of the argument can win, with evidence that matches it.
{
  const civics = scenarioById("town-choice");
  for (const side of ["crosswalk", "skate"]) {
    const reason = side === "crosswalk" ? "safe" : "active";
    ok(
      evaluate(civics, 0, { proposal: side, conn: "because", reason }).ok,
      `claim for ${side} passes`,
    );
    const mem = { claim: { proposal: side, conn: "because", reason } };
    const wrongSide =
      side === "crosswalk"
        ? { source: "survey", fact: "teens" }
        : { source: "traffic", fact: "walkers" };
    const r = evaluate(civics, 1, wrongSide, mem);
    ok(!r.ok && r.status === "evidence", `${side}: evidence for the other side is questioned`);
    const opinion = evaluate(civics, 1, { source: "friends", fact: "everyone" }, mem);
    ok(!opinion.ok && /opinion/.test(opinion.say[0]), `${side}: an opinion is called an opinion`);
  }
  const mem = {
    claim: { proposal: "crosswalk" },
    evidence1: { source: "traffic", fact: "walkers" },
  };
  const repeat = evaluate(civics, 2, { add: "addition", source: "traffic", fact: "walkers" }, mem);
  ok(!repeat.ok && /already/.test(repeat.say[0]), "repeating the first evidence is refused");
  ok(
    evaluate(civics, 2, { add: "addition", source: "police", fact: "nearmiss" }, mem).ok,
    "a second fact passes",
  );
}

// Specific consequences the brief names.
{
  const robot = scenarioById("literal-robot");
  const swap = evaluate(robot, 1, { x: "n5", y: "y2" });
  ok(
    !swap.ok && /rock/.test(swap.say[0]) && /across/.test(swap.revise[0]),
    "swapped coordinates find the rock",
  );
  const vague = evaluate(robot, 0, { n1: "few", d1: "right", n2: "n2", d2: "up2" });
  ok(
    vague.outcome === "vague" && vague.status === "stuck" && /number/.test(vague.say[0]),
    "a vague count stops the robot",
  );
  ok(vague.scene.path.length === 1, "a stopped robot draws no path");
  const edge = evaluate(robot, 0, { n1: "n4", d1: "left", n2: "n2", d2: "up2" });
  ok(!edge.ok && /edge/.test(edge.say[0]), "driving off the grid stops at the edge");
  const sci = scenarioById("melting-ice");
  const vagueSci = evaluate(sci, 0, { tray: "metal", conn: "because", reason: "want" });
  ok(vagueSci.status === "clarify", "the scientist asks for clarification of a vague cause");
  ok(
    evaluate(robot, 0, { n1: "n4" }).outcome === "incomplete",
    "a half-built sentence is not judged",
  );
}

// ── negative controls: a corrupted scenario must be caught ───────────────────────
const clone = (x) => structuredClone(x);
{
  const bad = clone(scenarioById("melting-ice"));
  bad.rounds[0].rules.splice(0, 0, { ok: true }); // everything passes
  let passRate = 0;
  let total = 0;
  for (const c of allChoices(bad.rounds[0])) {
    total += 1;
    if (evaluate(bad, 0, c).ok) passRate += 1;
  }
  ok(
    passRate / total > 0.25,
    "control: an always-pass rule breaks the 1/4 bound (the sweep would fail)",
  );
  const noRevise = clone(scenarioById("melting-ice"));
  delete noRevise.rounds[1].rules[0].revise;
  ok(!validateScenario(noRevise).ok, "control: a miss without a revision prompt is invalid");
  const noFallback = clone(scenarioById("town-choice"));
  noFallback.rounds[0].rules.pop();
  ok(!validateScenario(noFallback).ok, "control: a talk round without a fallback is invalid");
  const twoRounds = clone(scenarioById("literal-robot"));
  twoRounds.rounds.pop();
  ok(!validateScenario(twoRounds).ok, "control: fewer than 3 rounds is invalid");
  const badRobot = clone(scenarioById("literal-robot"));
  badRobot.rounds[0].target = [3, 2]; // engine now accepts a sentence whose literal meaning misses (4, 2)
  const win = evaluate(badRobot, 0, { n1: "n3", d1: "right", n2: "n2", d2: "up2" });
  const lit = literalRobot(scenarioById("literal-robot").rounds[0], win.sentence);
  ok(
    win.ok && !(lit[0] === 4 && lit[1] === 2),
    "control: a corrupted target is caught by the literal reader",
  );
  const blank = clone(scenarioById("literal-robot"));
  blank.rounds[0].frame = "Move {n1} units {zz}.";
  ok(!validateScenario(blank).ok, "control: a frame blank with no slot is invalid");
}

// ── progress: fading scaffolds and storage ───────────────────────────────────────
{
  ok(STORAGE_KEY === "accessPracticeLab:v1:consequence", "new key under the lab prefix");
  const robot = scenarioById("literal-robot");
  const good = [
    { n1: "n4", d1: "right", n2: "n2", d2: "up2" },
    { x: "n2", y: "y5" },
    { ord: "third", side: "left", row: "row2" },
  ];
  let sp = freshScenario();
  ok(!helpFolded(sp), "help is open at first");
  // Round 1: a miss, then a pass: not independent.
  const miss = evaluate(robot, 0, { n1: "n3", d1: "right", n2: "n2", d2: "up2" });
  sp = recordAttempt(sp, robot, miss, {});
  sp = recordAttempt(sp, robot, evaluate(robot, 0, good[0]), good[0]);
  ok(
    sp.independent === 0 && sp.attempts.pad === 2,
    "a pass after a miss is supported, not independent",
  );
  sp = advance(sp, robot);
  ok(sp.round === 1, "advance after a pass");
  ok(advance({ ...sp }, robot).round === 1, "cannot advance an unpassed round");
  sp = recordAttempt(sp, robot, evaluate(robot, 1, good[1]), good[1]);
  ok(sp.independent === 1 && !helpFolded(sp), "one independent success: help still open");
  sp = advance(sp, robot);
  sp = recordAttempt(sp, robot, evaluate(robot, 2, good[2]), good[2]);
  ok(sp.independent === FADE_AFTER && helpFolded(sp), "two independent successes fold the help");
  sp = advance(sp, robot);
  ok(
    sp.complete && sp.said.shelf.startsWith("Pick up the third box"),
    "complete; passing sentences kept",
  );
  // Help opened after folding means the next pass is supported.
  const helped = recordAttempt(
    { ...freshScenario(), independent: 2, helped: { pad: true } },
    robot,
    evaluate(robot, 0, good[0]),
    good[0],
  );
  ok(helped.independent === 2, "a pass with folded help reopened does not count as independent");
  const before = JSON.stringify(sp);
  recordAttempt(sp, robot, miss, {});
  ok(JSON.stringify(sp) === before, "recordAttempt never mutates");
  ok(
    Object.keys(restoreProgress("junk")).length === 0 &&
      Object.keys(restoreProgress([1])).length === 0,
    "junk restores empty",
  );
  const r = restoreProgress({
    x: { round: -3, independent: "9", own: [], memory: { a: {} } },
    y: null,
  });
  ok(
    r.x.round === 0 &&
      r.x.independent === 0 &&
      Object.keys(r.x.own).length === 0 &&
      r.x.memory.a &&
      !r.y,
    "restore sanitizes",
  );
}

console.log(`lp-consequence-engine: ${checks} checks passed across ${SCENARIOS.length} scenarios`);
