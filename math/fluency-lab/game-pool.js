// Problems for the Game Room come from the same trail stops as the rounds, so a game always
// practices the grade's own fluency standard. Games use short problems with a single numeric answer (whole numbers, decimals, equations).
import { TRAILS, getStation, loadTrail, makeProblem } from "./fact-trail.js";
import { factSteps, generateProblem, getGrade, getSkill, seededRandom } from "./problem-bank.js";
import { localDay } from "./tutor-engine.js";

export const ALL_STOPS = "all";
const MAX_LENGTH = 22;

const playable = new Map();
const SKILL = "skill:";

// A stop is a trail stop ("x6-7") or one of the grade's skills ("skill:fraction-add"); skills add fractions,
// decimals and equations that the trail's fact stops never ask.
const skillOf = (grade, stopId) => (stopId.startsWith(SKILL) ? getSkill(grade, stopId.slice(SKILL.length)) : null);
const sample = (grade, stopId, rng) => {
  const skill = skillOf(grade, stopId);
  return skill ? generateProblem(skill, rng) : makeProblem(grade, getStation(grade, stopId), rng);
};

// Share of a stop's problems that fit a card (short, whole-number answer), measured with a fixed seed so
// the list of playable stops never changes between visits.
function cardFriendlyShare(grade, stopId) {
  const rng = seededRandom(grade * 7919 + stopId.length * 131);
  let friendly = 0;
  for (let i = 0; i < 120; i += 1) if (isCardFriendly(sample(grade, stopId, rng))) friendly += 1;
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
      [
        ...TRAILS[grade].stations.map(({ id, name }) => ({ id, name, group: "Trail stops" })),
        ...getGrade(grade).skills.map((skill) => ({ id: `${SKILL}${skill.id}`, name: skill.title, group: `Grade ${grade} skills` })),
      ].filter(({ id }) => supportsEveryGame(grade, id)),
    );
  }
  return playable.get(grade);
}

// How a problem reads on a card. Equations and evaluations get a short verb so a card is never a bare "7x + 7 = 112".
const CARD_RULES = [
  [/^(.+) = \?$/, (m) => m[1]],
  [/^(.+)\. Find x\.$/, (m) => `Solve ${m[1]}`],
  [/^Evaluate (.+) when x = (-?\d+)\.$/, (m) => `${m[1]}, x = ${m[2]}`],
  [/^What is (.+)\?$/, (m) => m[1]],
];

export function cardText(item) {
  for (const [pattern, text] of CARD_RULES) {
    const match = item.question.match(pattern);
    if (match) return text(match);
  }
  return null;
}

// Numeric value of a card's answer; fractions compare by value (2/6 and 1/3 are the same answer).
export function answerOf(item) {
  const fraction = String(item.answers[0]).match(/^(-?\d+)\/(\d+)$/);
  const value = fraction ? Number(fraction[1]) / Number(fraction[2]) : Number(item.answers[0]);
  return Math.round(value * 1e9) / 1e9;
}
export const answerText = (item) =>
  item.kind === "fraction" ? item.displayAnswer : answerOf(item).toLocaleString("en-US", { maximumFractionDigits: 6 });

// <option>/<optgroup> markup for a facts picker.
export function stopOptions(stops, selected = ALL_STOPS, allLabel = "Everything on my trail") {
  const esc = (v) => String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const option = (s) => `<option value="${esc(s.id)}"${s.id === selected ? " selected" : ""}>${esc(s.name)}</option>`;
  const groups = [...new Set(stops.map((s) => s.group))];
  return `<option value="${ALL_STOPS}"${selected === ALL_STOPS ? " selected" : ""}>${esc(allLabel)}</option>${groups.map((g) => `<optgroup label="${esc(g)}">${stops.filter((s) => s.group === g).map(option).join("")}</optgroup>`).join("")}`;
}

const isCardFriendly = (item) => {
  if (!["number", "fraction"].includes(item.kind) || !Number.isFinite(answerOf(item))) return false;
  const text = cardText(item);
  return text !== null && text.length <= MAX_LENGTH;
};

// One short numeric problem from the chosen stop (or any stop of the grade).
export function gameProblem(grade, stopId = ALL_STOPS, rng = Math.random) {
  const stations = TRAILS[grade].stations;
  for (let tries = 0; tries < 300; tries += 1) {
    const id = stopId === ALL_STOPS ? stations[Math.floor(rng() * stations.length)].id : stopId;
    const item = sample(grade, id, rng);
    if (isCardFriendly(item)) return item;
  }
  throw new Error(`No card-friendly problem found for grade ${grade} stop ${stopId}`);
}

// Facts the learner missed last time they saw them, as fresh problems. A fact missed today waits for a later day.
export function comebackItems(grade, count, trail = loadTrail(), today = localDay()) {
  const chart = TRAILS[grade].chart;
  if (!chart || count < 1) return [];
  const symbol = chart.op === "add" ? "+" : "×";
  return Object.entries(trail.facts)
    .map(([key, entry]) => ({ key: key.split(":"), entry }))
    .filter(({ key: [op, a, b], entry }) => op === chart.op && Number(b) <= chart.max && (!chart.sumMax || Number(a) + Number(b) <= chart.sumMax) && entry.last === false && entry.lastDay !== today)
    .sort((x, y) => (y.entry.missed || 0) - (x.entry.missed || 0))
    .slice(0, count)
    .map(({ key: [op, a, b] }) => {
      const answer = op === "add" ? Number(a) + Number(b) : Number(a) * Number(b);
      return {
        question: `${a} ${symbol} ${b} = ?`,
        answers: [String(answer)],
        displayAnswer: String(answer),
        hint: "Use a strategy you know for this fact.",
        explanation: `${a} ${symbol} ${b} = ${answer}`,
        kind: "number",
        choices: null,
        unit: "",
        model: null,
        steps: factSteps(op, Number(a), Number(b), answer),
        comeback: true,
      };
    });
}

// `count` problems with different questions; `distinctAnswers` also keeps every answer different.
export function gameProblems(grade, stopId, count, { distinctAnswers = false, comeback = true } = {}) {
  const questions = new Set();
  const answers = new Set();
  const items = [];
  const take = (item) => {
    if (questions.has(item.question) || (distinctAnswers && answers.has(answerOf(item)))) return false;
    questions.add(item.question);
    answers.add(answerOf(item));
    items.push(item);
    return true;
  };
  // Mixed play (every stop) brings back up to a third of the board from facts the learner missed.
  if (comeback && stopId === ALL_STOPS) for (const item of comebackItems(grade, Math.ceil(count / 3))) take(item);
  for (let tries = 0; items.length < count && tries < 800; tries += 1) take(gameProblem(grade, stopId));
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
      return { target, targetText: answerText(winners[0]), cards: shuffle([...winners, ...decoys]) };
  }
  throw new Error(`Could not build a Target Hunt board for grade ${grade} stop ${stopId}`);
}
