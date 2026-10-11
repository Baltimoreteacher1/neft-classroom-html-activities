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

check(
  SCENE_IDS.length === 4 && SCENE_IDS.every((id) => SCENES[id].svg && SCENES[id].title),
  "Four titled scenes expected.",
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
