// Problems for the Game Room come from the same trail stops as the rounds, so a game always
// practices the grade's own fluency standard. Games only use short, whole-number-answer problems.
import { TRAILS, getStation, makeProblem } from "./fact-trail.js";
import { seededRandom } from "./problem-bank.js";

export const ALL_STOPS = "all";
const MAX_LENGTH = 16;

const playable = new Map();

// Share of a stop's problems that fit a card (short, whole-number answer), measured with a fixed seed so
// the list of playable stops never changes between visits.
function cardFriendlyShare(grade, stopId) {
  const rng = seededRandom(grade * 7919 + stopId.length * 131);
  const stop = getStation(grade, stopId);
  let friendly = 0;
  for (let i = 0; i < 120; i += 1) if (isCardFriendly(makeProblem(grade, stop, rng))) friendly += 1;
  return friendly / 120;
}

function supportsEveryGame(grade, stopId) {
  try {
    if (cardFriendlyShare(grade, stopId) < 0.5) return false;
    if (gameProblems(grade, stopId, 12).length < 12) return false;
    if (gameProblems(grade, stopId, 6, { distinctAnswers: true }).length < 6) return false;
    huntBoard(grade, stopId);
    return true;
  } catch {
    return false;
  }
}

// Stops whose problems can fill every game (some stops are decimals or equations, or have too few facts).
export function stopsFor(grade) {
  if (!playable.has(grade)) {
    playable.set(
      grade,
      TRAILS[grade].stations.filter(({ id }) => supportsEveryGame(grade, id)).map(({ id, name }) => ({ id, name })),
    );
  }
  return playable.get(grade);
}

const isCardFriendly = (item) =>
  item.kind === "number" &&
  Number.isInteger(Number(item.answers[0])) &&
  item.question.replace(" = ?", "").length <= MAX_LENGTH &&
  / = \?$/.test(item.question);

// One short numeric problem from the chosen stop (or any stop of the grade).
export function gameProblem(grade, stopId = ALL_STOPS, rng = Math.random) {
  const stations = TRAILS[grade].stations;
  const pool = stopId === ALL_STOPS ? stations : stations.filter((entry) => entry.id === stopId);
  for (let tries = 0; tries < 300; tries += 1) {
    const item = makeProblem(grade, pool[Math.floor(rng() * pool.length)], rng);
    if (isCardFriendly(item)) return item;
  }
  throw new Error(`No card-friendly problem found for grade ${grade} stop ${stopId}`);
}

export const cardText = (item) => item.question.replace(" = ?", "");
export const answerOf = (item) => Number(item.answers[0]);

// `count` problems with different questions; `distinctAnswers` also keeps every answer different.
export function gameProblems(grade, stopId, count, { distinctAnswers = false } = {}) {
  const questions = new Set();
  const answers = new Set();
  const items = [];
  for (let tries = 0; items.length < count && tries < 800; tries += 1) {
    const item = gameProblem(grade, stopId);
    if (questions.has(item.question) || (distinctAnswers && answers.has(answerOf(item)))) continue;
    questions.add(item.question);
    answers.add(answerOf(item));
    items.push(item);
  }
  return items;
}

export function shuffle(list, rng = Math.random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// A Target Hunt board: `hits` problems that share one answer, hidden among `size - hits` others.
export function huntBoard(grade, stopId, { size = 12, hits = 4 } = {}) {
  // Big-number stops rarely repeat an answer, so each retry samples more and, late on, settles for two matches.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const groups = new Map();
    const wanted = attempt < 6 ? Math.min(3, hits) : 2;
    for (let i = 0; i < 400 * (1 + Math.floor(attempt / 2)); i += 1) {
      const item = gameProblem(grade, stopId);
      const group = groups.get(answerOf(item)) || new Map();
      group.set(item.question, item);
      groups.set(answerOf(item), group);
    }
    const sized = [...groups.entries()].filter(([, group]) => group.size >= wanted);
    // Zero is a fine answer, but a board whose target is 0 teaches little; use it only when nothing else fits.
    const eligible = sized.some(([answer]) => answer !== 0) ? sized.filter(([answer]) => answer !== 0) : sized;
    if (!eligible.length) continue;
    const [target, group] = eligible[Math.floor(Math.random() * eligible.length)];
    const winners = shuffle([...group.values()]).slice(0, hits);
    const others = shuffle(
      [...groups.entries()]
        .filter(([answer]) => answer !== target)
        .flatMap(([, g]) => [...g.values()]),
    );
    const seen = new Set(winners.map((item) => item.question));
    const decoys = [];
    for (const item of others) {
      if (decoys.length >= size - winners.length) break;
      if (!seen.has(item.question)) {
        seen.add(item.question);
        decoys.push(item);
      }
    }
    if (decoys.length === size - winners.length)
      return { target, cards: shuffle([...winners, ...decoys]) };
  }
  throw new Error(`Could not build a Target Hunt board for grade ${grade} stop ${stopId}`);
}
