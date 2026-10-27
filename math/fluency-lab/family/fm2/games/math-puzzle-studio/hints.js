// Hints. Tier 0 nudges, tier 1 names a strategy, tier 2 works a PARALLEL example with other numbers (rebuilt until none
// of its numbers appear in the answer), and tier 3 (Show me) states the whole solution. Tiers 0-2 never state the answer.
// @fm2 FM-062 FM-059
import { makeRng, seedFrom } from "../../rng.js";
import { answerText } from "./logic.js";
import { NOTE, TIER0, TIER1 } from "./hints-copy.js";
import { examples } from "./hints-examples.js";
import { openCells } from "./rules.js";
import { solutionMoves } from "./scale.js";

const T = (en, es) => ({ en, es });
const tokensOf = (text) => String(text).match(/\d+(?:\.\d+)?/g) || [];

// Do the answer's first numbers appear in order, close together, in the text? (A worked example must not read as the answer.)
function repeatsAnswer(text, tokens) {
  const lead = tokens.slice(0, 4);
  if (lead.length < 2) return false;
  const pattern = lead.map((t) => `(?<![\\d.])${t.replace(".", "\\.")}(?![\\d]|\\.\\d)`).join("\\D{0,8}?");
  return new RegExp(pattern).test(text);
}

// Run a maker with fresh numbers until it neither prints a number of a short answer nor echoes a long one.
function fresh(round, make) {
  const answer = answerText(round);
  const tokens = tokensOf(answer);
  const avoid = tokens.length <= 2 ? new Set(tokens) : new Set();
  const rng = makeRng(seedFrom("hint", round.seed, round.skillId));
  for (let i = 0; i < 600; i += 1) {
    const example = make(rng, round);
    const clean = example.nums.every((n) => !avoid.has(String(n)));
    if (clean && !repeatsAnswer(example.en, tokens) && !example.en.includes(answer)) return T(example.en, example.es);
  }
  return T("Try a smaller version of the same puzzle first and see what it teaches you.", "Prueba primero una versión más pequeña del mismo reto y mira qué te enseña.");
}

const bondMode = (round) =>
  round.cells[0].v === null
    ? "whole"
    : round.cells.filter((c) => c.v === null).length === 2
      ? "two"
      : "part";

function strategy(round) {
  const entry = TIER1[round.skillId];
  if (round.skillId === "bond-parts") return entry[bondMode(round)];
  if (round.skillId === "balance-same") return entry[round.level];
  return entry;
}

const describe = {
  take_k: (n) =>
    T(`take ${n} loose weights off both pans`, `quita ${n} pesas sueltas de los dos platillos`),
  take_x: (n) => T(`take ${n} x-boxes off both pans`, `quita ${n} cajas x de los dos platillos`),
  split: (n) =>
    T(`split both pans into ${n} equal groups`, `divide los dos platillos en ${n} grupos iguales`),
};

function solutionText(round) {
  const answer = answerText(round);
  if (round.kind === "scale") {
    const steps = solutionMoves(round).map((m) =>
      describe[m.op === "split" ? "split" : m.what === "x" ? "take_x" : "take_k"](m.n),
    );
    const en = steps.map((s) => s.en).join(", then ");
    const es = steps.map((s) => s.es).join(", y luego ");
    return T(
      `Solution: ${answer}. To get there: ${en}.`,
      `Solución: ${answer}. Para llegar: ${es}.`,
    );
  }
  const note = NOTE[round.layout] || NOTE.balance;
  const where = openCells(round).length > 1 || round.layout === "expr" ? ` ${note.en}` : "";
  const lugar = openCells(round).length > 1 || round.layout === "expr" ? ` ${note.es}` : "";
  return T(`Solution: ${answer}.${where}`, `Solución: ${answer}.${lugar}`);
}

export function hint(round, tier) {
  if (tier <= 0) return TIER0[round.skillId];
  if (tier === 1) return strategy(round);
  if (tier === 2) return fresh(round, examples[round.skillId]);
  return solutionText(round);
}
