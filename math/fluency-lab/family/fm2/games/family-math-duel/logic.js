// The duel referee: given a round and what the learner did (the whole record of moves, claims, challenge and verdict),
// decide what is legal, what is right, and name the mix-up when it is not. Pure and DOM-free; `check` is the learner's
// score, `inspect` is the same judgement in steps so the interface can tell a wrong step from an unfinished one.
// A record is { moves: [[seat, card, slot]...], fair, claims: [text, text], call: null | {challenge, counter}, verdict, theirs }.
// @fm2 FM-016 FM-017 FM-019 FM-027 FM-063 FM-079
import { add, cmp, div, eq, frac, mul, neg, parse } from "../../rational.js";
import { FEEDBACK, goodFeedback } from "./feedback.js";
import { fmtValue, referenceRecord, replay, seatValue, winnerOf } from "./engine.js";
import { leftToRight, TEMPLATES } from "./templates.js";

export { makeRound } from "./rounds.js";

// A learner's typed value: 12, -3, −3, 3/4, 1 1/2, 0.75, 1,200. Returns an exact fraction or null.
export function parseClaim(text) {
  const raw = String(text ?? "")
    .replaceAll(",", "")
    .trim();
  return raw ? parse(raw) : null;
}

const cardVals = (round, slots) =>
  slots.map((id) => (round.cards[id].kind === "op" ? round.cards[id].op : round.cards[id].v));
const ten = [frac(10), frac(100), frac(1, 10), frac(1, 100)];

// Which familiar mix-up does a wrong value look like?
export function slipKey(round, slots, typed, truth) {
  const v = cardVals(round, slots);
  const same = (q) => q && eq(typed, q);
  const attempt = (fn) => {
    try {
      return fn();
    } catch {
      return null;
    }
  };
  if (round.tpl === "ops3" && same(leftToRight(v))) return "ltr";
  if (round.tpl === "paren" && same(attempt(() => add(v[0], mul(v[1], v[2]))))) return "parens";
  if (truth.n !== 0 && same(neg(truth))) return "negated";
  if (TEMPLATES[round.tpl].places && same(v.filter((x) => typeof x !== "string").reduce(add)))
    return "digits";
  if (round.tpl === "sum2" && same(mul(v[0], v[1]))) return "swapop";
  if (round.tpl === "prod2" && same(add(v[0], v[1]))) return "swapop";
  if (
    round.tpl === "sum2" &&
    round.style === "frac" &&
    same(attempt(() => div(add(frac(v[0].n), frac(v[1].n)), add(frac(v[0].d), frac(v[1].d)))))
  )
    return "across";
  if (
    (round.tpl === "frac2" || round.tpl === "fracdiv") &&
    truth.n !== 0 &&
    same(div(frac(1), truth))
  )
    return "flip";
  if (round.tpl === "pct" && same(mul(v[0], v[1]))) return "percent";
  if ((round.tpl === "pow" || round.tpl === "sci") && same(mul(v[0], v[1]))) return "expmul";
  if ((round.tpl === "root2" || round.tpl === "root3") && same(v.reduce(add))) return "noroot";
  if (truth.n !== 0 && ten.some((f) => same(mul(truth, f)))) return "point";
  return "generic";
}

// Why a verdict is wrong, from the learner's point of view.
export function verdictKey(round, v0, v1, verdict, truth) {
  if (truth === 2) return "tie-missed";
  if (verdict === 2) return "false-tie";
  const high = cmp(v0, v1) > 0 ? 0 : 1;
  const low = 1 - high;
  const byAbs = cmp(frac(Math.abs(v0.n), v0.d), frac(Math.abs(v1.n), v1.d)) > 0 ? 0 : 1;
  if (
    (v0.n < 0 || v1.n < 0) &&
    verdict === byAbs &&
    cmp(frac(Math.abs(v0.n), v0.d), frac(Math.abs(v1.n), v1.d)) !== 0
  )
    return "magnitude";
  if (round.goal.type === "closest" && verdict === high) return "closest-raw";
  if (round.goal.type === "min" && verdict === high) return "min-raw";
  if (round.goal.type === "max" && verdict === low) return "max-raw";
  return "generic";
}

const blank = (x) => x == null || String(x).trim() === "";

// The judgement in steps. `stage` is the step the record has reached; `problem` names a step done wrongly.
export function inspect(round, rec = {}) {
  const state = replay(round, rec.moves || [], Boolean(rec.fair));
  if (!state.ok) return { problem: state.problem, complete: false, stage: "draft", state };
  if (!state.complete) return { problem: null, complete: false, stage: "draft", state };
  const values = [seatValue(round, state.seats[0]), seatValue(round, state.seats[1])];
  const out = { state, values, problem: null, complete: false, stage: "claim0" };
  const stop = (mistake, extra = {}) => ({ ...out, problem: { mistake, ...extra } });
  if (blank(rec.claims?.[0])) return out;
  const q0 = parseClaim(rec.claims[0]);
  if (!q0) return stop("unreadable", { which: 0 });
  if (!eq(q0, values[0])) return stop(`value-${slipKey(round, state.seats[0], q0, values[0])}`);
  out.stage = round.rights.challenge ? "claim1" : "verdict";
  if (round.rights.challenge) {
    if (blank(rec.claims?.[1])) return out;
    const q1 = parseClaim(rec.claims[1]);
    if (!q1) return stop("unreadable", { which: 1 });
    out.stage = "call";
    const call = rec.call;
    if (!call || typeof call.challenge !== "boolean") return out;
    const theirsWrong = !eq(q1, values[1]);
    if (call.challenge) {
      if (!theirsWrong) return stop("bad-challenge");
      const counter = parseClaim(call.counter);
      if (!counter) return stop("unreadable", { which: 2 });
      if (!eq(counter, values[1])) return stop("wrong-counter");
    } else if (theirsWrong) return stop("missed-error");
    out.stage = "verdict";
  }
  if (![0, 1, 2].includes(rec.verdict)) return out;
  const truth = winnerOf(round.goal, values[0], values[1]);
  if (rec.verdict !== truth)
    return stop(`compare-${verdictKey(round, values[0], values[1], rec.verdict, truth)}`);
  return { ...out, stage: "done", complete: true, truth };
}

// A card the interface offered that the rules do not allow, checked without ending or scoring anything.
function probe(round, response) {
  const { seat, card, slot } = response.attempt;
  const state = replay(
    round,
    [...(response.moves || []), [seat, card, slot]],
    Boolean(response.fair),
  );
  if (state.ok)
    return { correct: false, neutral: true, mistake: "legal", feedback: FEEDBACK.legal };
  const mistake = state.problem.mistake;
  return {
    correct: false,
    neutral: true,
    mistake,
    feedback: FEEDBACK[mistake] || FEEDBACK.generic,
  };
}

export function check(round, response) {
  if (response?.attempt) return probe(round, response);
  const info = inspect(round, response || {});
  if (info.problem)
    return {
      correct: false,
      mistake: info.problem.mistake,
      feedback: FEEDBACK[info.problem.mistake] || FEEDBACK.generic,
    };
  if (!info.complete)
    return { correct: false, mistake: "incomplete", feedback: FEEDBACK.incomplete };
  return { correct: true, feedback: goodFeedback(round, info) };
}

// Points for a finished hand (display only): 2 for the winner (1 each for a tie), 1 for an upheld challenge, 1 when the
// other player's challenge of a correct claim is checked and fails.
export function scoreOf(round, rec, info = inspect(round, rec)) {
  const points = [0, 0];
  const lines = [];
  if (info.truth === 2) {
    points[0] += 1;
    points[1] += 1;
    lines.push({ key: "handTie" });
  } else if (info.truth !== undefined) {
    points[info.truth] += 2;
    lines.push({ key: "handWin", seat: info.truth });
  }
  if (round.rights.challenge && rec.call?.challenge && info.complete) {
    points[0] += 1;
    lines.push({ key: "challengeWon" });
  }
  if (round.rights.theirs && rec.theirs === true && info.complete) {
    points[0] += 1;
    lines.push({ key: "theirsWon" });
  }
  return { points, lines };
}

export const solve = (round) => referenceRecord(round);

export function answerText(round) {
  const rec = referenceRecord(round);
  const state = replay(round, rec.moves, false);
  return fmtValue(seatValue(round, state.seats[0]), round.style);
}

