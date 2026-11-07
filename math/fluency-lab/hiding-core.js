// How Many Are Hiding? rules (K.OA.A.3 part-whole): the total is known, some counters show, a leaf hides the rest, and
// the child sets the hidden part. No clock, no luck: every round is solved by working out total minus the part you see,
// a wrong try never removes a choice, and the game always ends in a win. Stars count first-try, unsupported rounds.
import { problem } from "./problem-item.js";

export const FIRST_GRADE = 0;
export const LAST_GRADE = 2;
export const GAME_ID = "hiding";
// Evidence goes to the skill the round exercises: sums within 10 are Kindergarten "hidden parts"; the 20 stage is the
// Grade 1 missing-addend skill (1.OA.D.8).
export const SKILL_WITHIN_10 = "0:hidden-parts";
export const SKILL_WITHIN_20 = "1:missing-addend";

// Four garden stages. A flower grows when a stage is finished. Kindergarten stays within 10, so it plays the first three.
export const STAGES = Object.freeze([
  { id: "seed", name: "Seed", totals: [3, 4, 5], minGrade: 0 },
  { id: "sprout", name: "Sprout", totals: [6, 7, 8], minGrade: 0 },
  { id: "bud", name: "Bud", totals: [9, 10], minGrade: 0 },
  { id: "bloom", name: "Bloom", totals: [20], minGrade: 1 },
]);

// What the counters are. The shape differs as well as the colour, so no round depends on telling colours apart.
export const THINGS = Object.freeze([
  { id: "berries", en: "berries", es: "bayas", shape: "circle" },
  { id: "seeds", en: "seeds", es: "semillas", shape: "oval" },
  { id: "gems", en: "gems", es: "gemas", shape: "diamond" },
]);

export const ROUNDS_PER_STAGE = 2;
export const CALM_ROUNDS_PER_STAGE = 1;

export const stagesFor = (grade) => STAGES.filter((stage) => grade >= stage.minGrade);
export const roundsPerStage = (calm) => (calm ? CALM_ROUNDS_PER_STAGE : ROUNDS_PER_STAGE);
export const skillKeyFor = (total) => (total > 10 ? SKILL_WITHIN_20 : SKILL_WITHIN_10);

const randInt = (lo, hi, rng) => lo + Math.floor(rng() * (hi - lo + 1));

// One round in a stage. `used` holds "total:shown" keys already played so a game never repeats a picture.
export function makeRound(stage, rng = Math.random, used = new Set()) {
  const totals = stage.totals;
  for (let tries = 0; tries < 60; tries += 1) {
    const total = totals[randInt(0, totals.length - 1, rng)];
    // Up to 20 the visible part stays at 3 or more so the hidden part is a real subtraction, not "all but one".
    const shown = total > 10 ? randInt(3, total - 3, rng) : randInt(1, total - 1, rng);
    if (!used.has(`${total}:${shown}`) || tries === 59) {
      used.add(`${total}:${shown}`);
      return {
        total,
        shown,
        hidden: total - shown,
        stage: stage.id,
        thing: THINGS[randInt(0, THINGS.length - 1, rng)],
      };
    }
  }
  throw new Error("unreachable");
}

// The whole game as a list of rounds, in order: every stage in turn, `perStage` rounds each.
export function makePlan(grade, calm, rng = Math.random) {
  const used = new Set();
  return stagesFor(grade).flatMap((stage) =>
    Array.from({ length: roundsPerStage(calm) }, () => makeRound(stage, rng, used)),
  );
}

// The child's setting is right when it is exactly the hidden part. Nothing about a wrong setting is stored on the round.
export const isRight = (round, setting) => Number.isInteger(setting) && setting === round.hidden;

// The stepper never leaves 0..total; a choice is never taken away, only clamped at the ends.
export const clampSetting = (round, value) =>
  Math.max(0, Math.min(round.total, Math.floor(Number(value) || 0)));

// Counters in rows of five (like a ten-frame without its cells, so the board never shows how many are hidden).
export const COLS = 5;
export function gridPoints(count, pitch = 38) {
  return Array.from({ length: count }, (_, i) => ({
    x: (i % COLS) * pitch + pitch / 2,
    y: Math.floor(i / COLS) * pitch + pitch / 2,
  }));
}
export const gridHeight = (count, pitch = 38) => Math.max(1, Math.ceil(count / COLS)) * pitch;

// Stars reward rounds solved on the first try with no support, never speed: 4 in 5 is 3 stars, half is 2, else 1.
export const starsFor = (independent, total) =>
  total <= 0 ? 1 : independent / total >= 0.8 ? 3 : independent / total >= 0.5 ? 2 : 1;

// Whether the learner was independent on a round: the first setting they checked was right and no count-on help was open.
export const independentRound = ({ misses, supported }) => misses === 0 && !supported;

// Flowers grown across plays, kept per profile; the garden shows at most MAX_FLOWERS.
export const MAX_FLOWERS = 12;
export const cleanGarden = (saved) => ({
  flowers:
    Number.isFinite(saved?.flowers) && saved.flowers >= 0
      ? Math.min(Math.floor(saved.flowers), 1000)
      : 0,
});
export const grow = (garden, count) =>
  cleanGarden({ flowers: (garden?.flowers || 0) + Math.max(0, count) });

// The same question the practice skill asks, as a practice item. Missed rounds go to the review and Tricky Facts, and
// the steps stop before the one that names the answer (step-leak.js).
export function reviewItem(round) {
  const things = round.thing.en;
  const { total, shown, hidden } = round;
  return problem(
    `There are ${total} ${things} in all. ${shown} are showing. How many are hiding?`,
    hidden,
    {
      questionEs: `Hay ${total} ${round.thing.es} en total. Se ven ${shown}. ¿Cuántas están escondidas?`,
      hint: "The part you see and the part hiding make the whole.",
      steps: [
        `The whole is ${total}. You can see ${shown}.`,
        "Think: what do you add to the part you see to make the whole?",
        `${hidden} are hiding.`,
      ],
    },
  );
}
