// Sound Bridge: a minimal-pair listening game. Goal: lay every plank of a bridge across the river. Each plank is
// one heard word; the learner chooses which of two close-sounding words they heard. A wrong choice never removes a
// plank: the pair goes to the back of the line and must be heard again before the bridge is finished. Untimed,
// no lives, no points to lose, no luck: what decides each plank is what the learner heard.

export const PLANKS = 8;

/** Small seeded generator so a game can be replayed in tests. */
export function seeded(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/**
 * A new game for one sound set. Rounds cycle through the set's pairs so every pair is heard, in a shuffled order.
 * @param {{ pairs: string[][] }} set each pair is [wordA, meaningA, wordB, meaningB]
 */
export function newGame(set, { rng = Math.random, planks = PLANKS } = {}) {
  const n = set.pairs.length;
  const order = [];
  while (order.length < planks) {
    const lap = [...Array(n).keys()];
    for (let i = lap.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [lap[i], lap[j]] = [lap[j], lap[i]];
    }
    order.push(...lap);
  }
  return {
    setId: set.id,
    goal: planks,
    queue: order.slice(0, planks).map((pair) => ({ pair, target: rng() < 0.5 ? 0 : 1 })),
    placed: 0,
    tries: 0,
    again: 0, // rounds that went back in line
    last: null, // { pair, target, choice, correct }
    rng,
  };
}

export const currentRound = (game) => (game.placed < game.goal ? game.queue[0] || null : null);
export const isWon = (game) => game.placed >= game.goal;

/** The two words of a round, in a fixed order (the order never hints at the answer). */
export function roundWords(set, round) {
  const p = set.pairs[round.pair];
  return [
    { word: p[0], meaning: p[1] },
    { word: p[2], meaning: p[3] },
  ];
}

/**
 * The learner picks word 0 or 1. Right: a plank is laid. Wrong: the same pair returns at the end of the line with a
 * fresh target word, so the learner hears the contrast again before finishing.
 */
export function choose(game, choice) {
  const round = currentRound(game);
  if (!round || ![0, 1].includes(choice)) return null;
  game.tries += 1;
  const correct = choice === round.target;
  game.queue.shift();
  if (correct) game.placed += 1;
  else {
    game.again += 1;
    game.queue.push({ pair: round.pair, target: game.rng() < 0.5 ? 0 : 1 });
  }
  game.last = { pair: round.pair, target: round.target, choice, correct };
  return game.last;
}
