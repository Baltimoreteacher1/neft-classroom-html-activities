// Game Room contract: every grade/stop can build every game's content, boards are solvable,
// and sticker rules only fire on saved evidence.
import assert from "node:assert/strict";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {}, removeItem() {} },
});
Object.defineProperty(globalThis, "window", { configurable: true, value: globalThis });
const { ALL_STOPS, answerOf, cardText, gameProblems, huntBoard, stopsFor } = await import(
  "../math/fluency-lab/game-pool.js"
);
const { STICKERS, dailyGame, earnedIds, rankFor, streakOf } = await import(
  "../math/fluency-lab/rewards.js"
);
const { comebackItems } = await import("../math/fluency-lab/game-pool.js");
const { bossFor, bossOpen, getStation, TRAILS } = await import("../math/fluency-lab/fact-trail.js");
const { PAPER_GAMES, paperSheets } = await import("../math/fluency-lab/paper-games.js");
const { buildRound } = await import("../math/fluency-lab/mistake-game.js");
const { makeBoard, rulesFor } = await import("../math/fluency-lab/make-game.js");
const { familyNumbers, familyOpFor, frameOk } = await import("../math/fluency-lab/family-game.js");
const { balanceRound, scaleSvg } = await import("../math/fluency-lab/balance-game.js");
const { familySummaryHtml, familySummaryDocument } = await import(
  "../math/fluency-lab/family-page.js"
);
const { sortBoard } = await import("../math/fluency-lab/sort-game.js");
const { cleanPlay } = await import("../math/fluency-lab/play-backup.js");
const { factLabel, parseFactsReport, summarizeReports, compareReports, comparisonHtml } =
  await import("../math/fluency-lab/class-snapshot.js");
const { validateAssignment } = await import("../math/fluency-lab/school-tools.js");
const { SCENES, SCENE_IDS } = await import("../math/fluency-lab/scenes.js");
const { ALL_SKILLS, generateProblem, seededRandom, validateAnswer } = await import(
  "../math/fluency-lab/problem-bank.js"
);

const failures = [];
const check = (condition, message) => condition || failures.push(message);

for (const grade of [1, 2, 3, 4, 5, 6, 7, 8]) {
  check(stopsFor(grade).length >= 1, `Grade ${grade}: at least one stop must support every game.`);
  for (const stop of [ALL_STOPS, ...stopsFor(grade).map((s) => s.id)]) {
    const tag = `${grade}/${stop}`;
    try {
      const match = gameProblems(grade, stop, 6, { distinctAnswers: true });
      check(
        match.length === 6,
        `${tag}: Fact Match needs 6 pairs with different answers (got ${match.length}).`,
      );
      const picture = gameProblems(grade, stop, 12);
      check(
        picture.length === 12,
        `${tag}: Mystery Picture needs 12 different problems (got ${picture.length}).`,
      );
      for (const item of [...match, ...picture]) {
        check(
          validateAnswer(item.answers[0], item),
          `${tag}: rejects its own answer for ${item.question}`,
        );
        check(
          cardText(item)?.length <= 22,
          `${tag}: card text missing or too long: ${item.question}`,
        );
      }
      for (let i = 0; i < 6; i += 1) {
        const { target, cards } = huntBoard(grade, stop);
        const hits = cards.filter((item) => answerOf(item) === target);
        check(cards.length === 12, `${tag}: Target Hunt board needs 12 cards.`);
        check(
          hits.length >= 2 && hits.length <= 4,
          `${tag}: Target Hunt needs 2-4 matching cards (got ${hits.length}).`,
        );
        check(
          new Set(cards.map((c) => c.question)).size === 12,
          `${tag}: Target Hunt repeats a card.`,
        );
      }
    } catch (error) {
      failures.push(`${tag}: ${error.message}`);
    }
  }
}

// "Watch me solve it" opens on step 1: it may never be the answer itself (Joel, 2026-10-11).
const tail = (text) => String(text).replace(/[,\s]/g, "");
for (const skill of ALL_SKILLS) {
  const rng = seededRandom(skill.grade * 31 + skill.id.length);
  for (let i = 0; i < 60; i += 1) {
    const item = generateProblem(skill, rng);
    check(
      item.steps.length >= 2,
      `${skill.grade}/${skill.id}: needs 2+ guided steps (${item.question}).`,
    );
    const first = tail(item.steps[0]);
    const answer = tail(item.answers[0]);
    check(
      first.includes("?") || // restating the open problem is fine
        (first !== tail(item.explanation) &&
          !first.endsWith(`=${answer}`) &&
          !first.endsWith(`is${answer}.`)),
      `${skill.grade}/${skill.id}: step 1 gives away the answer to ${item.question}: ${item.steps[0]}`,
    );
  }
}

for (const grade of [1, 3, 5, 7]) {
  for (const count of [6, 8]) {
    const { cards, line } = sortBoard(grade, ALL_STOPS, count);
    const below = cards.filter((item) => answerOf(item) < line).length;
    check(below >= 2 && count - below >= 2, `Answer Sort grade ${grade}: both bins need 2+ cards.`);
  }
}

// Backup round trip: hostile input is cleaned, good input survives.
const play = cleanPlay({
  trail: {
    stations: { "3:x6-7": { stars: 9, best: -2, rounds: 4 }, "../evil": { stars: 3 } },
    facts: { "mul:6:7": { right: 2, missed: 1, last: true }, bad: { right: 1 } },
  },
  rewards: {
    plays: 3,
    best: { match: 3 },
    scenes: ["rocket", "nope"],
    strategies: { fact: 2, nope: 5 },
    seen: ["first-game", "zzz"],
    calm: true,
  },
});
check(
  Object.keys(play.trail.stations).join() === "3:x6-7" &&
    play.trail.stations["3:x6-7"].stars === 3 &&
    play.trail.stations["3:x6-7"].best === 0,
  "cleanPlay keeps only valid, clamped station entries.",
);
check(Object.keys(play.trail.facts).join() === "mul:6:7", "cleanPlay keeps only valid fact keys.");
check(
  play.rewards.scenes.join() === "rocket" &&
    play.rewards.strategies.fact === 2 &&
    !play.rewards.strategies.nope &&
    play.rewards.seen.join() === "first-game" &&
    play.rewards.calm,
  "cleanPlay cleans rewards.",
);
check(cleanPlay(null) === null, "cleanPlay(null) is null.");

// Teacher side: assignments may name a game, and facts reports summarize without names.
const gameOnly = validateAssignment({ version: 1, grade: 3, keys: [], game: "hunt", stop: "x6-7" });
check(gameOnly?.game === "hunt" && gameOnly.stop === "x6-7", "A game-only assignment is valid.");
check(
  validateAssignment({ version: 1, grade: 3, keys: [], game: "nope" }) === null,
  "An unknown game with no skills is not an assignment.",
);
check(
  factLabel("mul:6:7") === "6 × 7" && factLabel("add:3:4") === "3 + 4",
  "Fact labels read naturally.",
);
const reports = [1, 2, 3].map((n) =>
  parseFactsReport({
    app: "EduWonderLab Fluency Lab facts report",
    version: 1,
    grade: 3,
    tricky: [
      { key: "mul:6:7", right: 0, missed: n },
      ...(n === 1 ? [{ key: "mul:8:9", right: 0, missed: 1 }] : []),
    ],
    known: 4,
    strategies: { apart: n },
  }),
);
const summary = summarizeReports(reports);
check(
  summary.students === 3 &&
    summary.facts[0][0] === "mul:6:7" &&
    summary.facts[0][1] === 3 &&
    summary.strategies.apart === 6,
  "Class snapshot counts learners per tricky fact.",
);
check(parseFactsReport({ app: "other" }) === null, "A non-report file is rejected.");

// Comeback facts: only facts missed last time, on a later day, in this grade's chart.
const facts = {
  "mul:6:7": { right: 0, missed: 3, last: false, lastDay: "2000-01-01" },
  "mul:2:3": { right: 2, missed: 0, last: true, lastDay: "2000-01-01" },
  "mul:8:9": { right: 0, missed: 1, last: false, lastDay: "2026-10-11" },
  "add:3:4": { right: 0, missed: 2, last: false, lastDay: "2000-01-01" },
};
const back = comebackItems(3, 5, { stations: {}, facts }, "2026-10-11");
check(
  back.length === 1 &&
    back[0].question === "6 × 7 = ?" &&
    back[0].answers[0] === "42" &&
    back[0].steps.length >= 2,
  "Comeback items are the still-missed facts of this grade's operation, from an earlier day.",
);
check(
  comebackItems(7, 5, { stations: {}, facts }, "2026-10-11").length === 0,
  "Grades without a fact chart have no comeback facts.",
);

// Boss round: mixes every regular stop, opens only when each has 2+ stars.
for (const grade of [1, 2, 3, 4, 5, 6, 7, 8]) {
  const boss = bossFor(grade);
  check(
    boss.mix.length >= 3 &&
      boss.mix.every((id) => getStation(grade, id) && !getStation(grade, id).mix),
    `Grade ${grade}: boss mixes regular stops only.`,
  );
  const done = {
    stations: Object.fromEntries(
      TRAILS[grade].stations.map((entry) => [`${grade}:${entry.id}`, { stars: 2 }]),
    ),
    facts: {},
  };
  check(bossOpen(done, grade), `Grade ${grade}: boss opens when every stop has 2 stars.`);
  delete done.stations[`${grade}:${TRAILS[grade].stations[0].id}`];
  check(!bossOpen(done, grade), `Grade ${grade}: boss stays locked until every stop has stars.`);
}

// Paper sheets: every game prints for every grade, the key is optional, and keys never leak onto sheets.
for (const grade of [1, 3, 6, 7]) {
  const sheets = paperSheets(
    grade,
    "all",
    PAPER_GAMES.map((g) => g.id),
    { includeKey: false },
  );
  check(
    !sheets.includes("answer-key") && !sheets.includes("teacher-answer-page"),
    `Grade ${grade}: no key unless asked.`,
  );
  check((sheets.match(/packet-page/g) || []).length === 3, `Grade ${grade}: three game pages.`);
  check(
    paperSheets(grade, "all", ["match"], { includeKey: true }).includes("teacher-answer-page"),
    `Grade ${grade}: key page when asked.`,
  );
}

// Spot the Mistake: exactly one checkable step is wrong, and claims are right or wrong as labelled.
const STEP = /^([\d.,]+) ([+−×÷]) ([\d.,]+) = ([\d.,]+)\.?$/;
const val = (t) => Number(String(t).replaceAll(",", ""));
const calc = (a, op, b) => (op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : a / b);
for (const grade of [1, 3, 5, 6, 7, 8]) {
  for (const stop of [
    ALL_STOPS,
    ...stopsFor(grade)
      .slice(0, 4)
      .map((s) => s.id),
  ]) {
    for (let i = 0; i < 10; i += 1) {
      const round = buildRound(grade, stop);
      if (round.format === "steps") {
        const bad = round.steps
          .map((text, k) => {
            const m = text.match(STEP);
            return m && Math.abs(calc(val(m[1]), m[2], val(m[3])) - val(m[4])) > 1e-6 ? k : -1;
          })
          .filter((k) => k >= 0);
        check(
          bad.length === 1 && bad[0] === round.bad,
          `${grade}/${stop}: exactly one wrong step expected (${round.item.question}).`,
        );
      } else {
        check(
          Math.abs(round.shown - round.truth) < 1e-9 === round.right,
          `${grade}/${stop}: claim flag matches its number (${round.item.question}).`,
        );
      }
    }
  }
}
check(
  stopsFor(5).some((s) => s.id === "skill:fraction-add") &&
    stopsFor(7).some((s) => s.id === "skill:fraction-ops"),
  "Fraction skills are playable stops.",
);
{
  const { cards, lineText } = sortBoard(5, "skill:fraction-add", 8, { comeback: false });
  check(
    cards.every((c) => c.kind === "fraction") && ["1/2", "1", "1 1/2", "2", "3"].includes(lineText),
    "Fraction Answer Sort uses a benchmark line.",
  );
  const hunt = huntBoard(5, "skill:fraction-mul");
  check(/^\d+\/\d+$/.test(hunt.targetText), "Fraction Target Hunt names its target as a fraction.");
}

// Week over week: facts that cleared, stayed, or are new.
{
  const mk = (keys, known) =>
    parseFactsReport({
      app: "EduWonderLab Fluency Lab facts report",
      version: 1,
      grade: 3,
      tricky: keys.map((key) => ({ key, right: 0, missed: 1 })),
      known,
      strategies: {},
    });
  const before = [mk(["mul:6:7", "mul:8:9"], 4), mk(["mul:6:7"], 6)];
  const after = [mk(["mul:8:9", "mul:7:7"], 9), mk([], 12)];
  const r = compareReports(before, after);
  check(r.improved.map((x) => x.key).join() === "mul:6:7", "Week over week: 6 × 7 got easier.");
  check(
    r.stillTricky.map((x) => x.key).join() === "mul:8:9",
    "Week over week: 8 × 9 is still tricky.",
  );
  check(r.newTrouble.map((x) => x.key).join() === "mul:7:7", "Week over week: 7 × 7 is new.");
  check(
    r.knownAverage[0] === 5 && r.knownAverage[1] === 10.5,
    "Week over week averages known facts.",
  );
  check(
    comparisonHtml(r).includes("Getting easier") && !comparisonHtml(r).includes("undefined"),
    "Comparison renders.",
  );
}

// Family page: names the learner, never prints "undefined", and the saved file is a full document.
{
  const html = familySummaryHtml({ grade: 3, name: "Orbit <b>" });
  check(
    html.includes("Orbit &lt;b&gt;") && !html.includes("undefined") && !html.includes("NaN"),
    "Family summary escapes the name and prints no undefined/NaN.",
  );
  check(
    familySummaryDocument({ grade: 7, name: "River" }).startsWith("<!doctype html>"),
    "Family summary file is a full document.",
  );
}

// Make It: every board holds the wanted number of tile pairs that reach the target.
for (const grade of [1, 2, 3, 4, 5, 6, 7, 8]) {
  for (let i = 0; i < 25; i += 1) {
    for (const wanted of [2, 3]) {
      const { op, target, tiles } = makeBoard(grade, wanted);
      const combine = (a, b) => (op === "+" ? a + b : a * b);
      let pairs = 0;
      for (let x = 0; x < tiles.length; x += 1)
        for (let y = x + 1; y < tiles.length; y += 1)
          if (combine(tiles[x], tiles[y]) === target) pairs += 1;
      check(
        pairs >= wanted,
        `Make It grade ${grade}: needs ${wanted}+ pairs for ${target} (${tiles.join()}).`,
      );
      check(
        tiles.length === wanted * 2 + 2 && rulesFor(grade).op === op,
        `Make It grade ${grade}: tile count and operation.`,
      );
    }
  }
}

// Fact Family Builder: the four frames accept exactly the right equations.
for (const grade of [1, 2, 3, 4, 5]) {
  for (let i = 0; i < 30; i += 1) {
    const [a, b, c] = familyNumbers(grade);
    const op = familyOpFor(grade);
    const inverse = op === "+" ? "−" : "÷";
    check(
      op === "+" ? a + b === c : a * b === c,
      `Family grade ${grade}: ${a},${b},${c} must be a fact family.`,
    );
    check(
      a !== b && c > b && (grade > 1 || c <= 10) && (grade !== 2 || c <= 20),
      `Family grade ${grade}: numbers differ and stay in range (${a},${b},${c}).`,
    );
    const nums = [a, b, c];
    check(
      frameOk({ op }, [a, b, c], nums) && frameOk({ op }, [b, a, c], nums),
      `Family grade ${grade}: both orders of the first sentence are right.`,
    );
    check(
      frameOk({ op: inverse }, [c, a, b], nums) && frameOk({ op: inverse }, [c, b, a], nums),
      `Family grade ${grade}: both inverse sentences are right.`,
    );
    check(
      !frameOk({ op }, [a, a, c], nums) &&
        !frameOk({ op: inverse }, [a, c, b], nums) &&
        !frameOk({ op }, [a, b, null], nums),
      `Family grade ${grade}: wrong or incomplete frames are rejected.`,
    );
  }
}

// Balance It: the missing number completes the part, and the scale tilts toward the heavier side.
for (const grade of [1, 3, 5, 6, 7, 8]) {
  for (const stop of [
    ALL_STOPS,
    ...stopsFor(grade)
      .slice(0, 3)
      .map((s) => s.id),
  ]) {
    const round = balanceRound(grade, stop);
    check(
      round.part + round.missing === round.total &&
        round.choices.includes(round.missing) &&
        new Set(round.choices).size === round.choices.length,
      `Balance It ${grade}/${stop}: part + missing = total and the choices differ.`,
    );
    check(
      round.choices.every((n) => n > 0),
      `Balance It ${grade}/${stop}: choices are positive.`,
    );
  }
}
{
  const beam = (svg) =>
    svg
      .match(
        /<line x1="[\d.]+" y1="([\d.]+)" x2="[\d.]+" y2="([\d.]+)" stroke="#13233a" stroke-width="7"/,
      )
      .slice(1)
      .map(Number);
  const leftHeavy = scaleSvg({ left: "6 × 7", rightText: "20 + ?", tilt: -12 });
  const rightHeavy = scaleSvg({ left: "6 × 7", rightText: "40 + 9", tilt: 12 });
  const level = scaleSvg({ left: "6 × 7", rightText: "40 + 2", tilt: 0 });
  check(beam(leftHeavy)[0] > beam(leftHeavy)[1], "The heavier left side sits lower.");
  check(beam(rightHeavy)[0] < beam(rightHeavy)[1], "The heavier right side sits lower.");
  check(beam(level)[0] === beam(level)[1], "A balanced scale is level.");
  check(
    leftHeavy.includes("6 × 7") &&
      rightHeavy.includes("40 + 9") &&
      !leftHeavy.includes("undefined"),
    "Scale shows both pans.",
  );
}

check(
  SCENE_IDS.length === 6 && SCENE_IDS.every((id) => SCENES[id].svg && SCENES[id].title),
  "Six titled scenes expected.",
);
const blank = {
  rounds: 0,
  threeStar: 0,
  stars: 0,
  stops: 0,
  facts: 0,
  plays: 0,
  best: { match: 0, hunt: 0, picture: 0 },
  scenes: 0,
  streak: 0,
};
check(earnedIds(blank).length === 0, "A learner with no evidence must earn no stickers.");
check(new Set(STICKERS.map((s) => s.id)).size === STICKERS.length, "Sticker ids must be unique.");
check(
  earnedIds({ ...blank, rounds: 1, stars: 12 }).includes("stars-10"),
  "10 stars earns the 10 Stars sticker.",
);
check(
  ["match", "hunt", "sort", "mistake", "make", "family", "balance", "picture"].includes(
    dailyGame(),
  ),
  "dailyGame must name a real game.",
);
check(rankFor(blank).name === "Trail Starter", "Rank starts at Trail Starter.");

const day = (offset) => {
  const d = new Date(Date.now() - offset * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
assert.equal(streakOf([day(0), day(1), day(2)]), 3);
assert.equal(streakOf([day(1), day(2)]), 2, "Yesterday still counts until today ends.");
assert.equal(streakOf([day(3)]), 0, "A gap resets the streak.");

if (failures.length) {
  console.error(failures.slice(0, 40).join("\n"));
  console.error(`fluency-games: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("fluency-games: all grades and stops build every game; sticker rules hold");
