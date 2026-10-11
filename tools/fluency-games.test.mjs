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
const { sortBoard } = await import("../math/fluency-lab/sort-game.js");
const { cleanPlay } = await import("../math/fluency-lab/play-backup.js");
const { factLabel, parseFactsReport, summarizeReports } = await import(
  "../math/fluency-lab/class-snapshot.js"
);
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
        check(cardText(item).length <= 16, `${tag}: card text too long: ${item.question}`);
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
check(["match", "hunt", "picture"].includes(dailyGame()), "dailyGame must name a real game.");
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
