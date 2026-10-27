// Ratio Recipe Lab mathematics: the skill table, round dispatch, scoring (`check`), the model solution (`solve`) and the
// answer text. Pure and DOM-free; every comparison is an exact rational. check() judges the FINAL table, so any route to the
// right batch (x6, or x2 then x3, or a slider) is accepted. @fm2 FM-017 FM-019 FM-056 FM-057 FM-060
import { add, cmp, div, eq, frac, mul, parse, sub } from "../../rational.js";
import { fmtVal, R, typed, valueOf } from "./kit.js";
import { MISTAKES, FRIENDLY_OK } from "./copy.js";
import * as early from "./rounds-early.js";
import * as g6 from "./rounds-g6.js";
import * as g78 from "./rounds-g78.js";
import * as mid from "./rounds-mid.js";
import { fmt } from "../../lang.js";

// id -> [min grade, max grade, standard, generator]
export const SKILL_TABLE = {
  "bowls-groups": [0, 1, "K.OA.A.2", early.bowlsGroups],
  "more-fewer": [0, 1, "K.CC.C.6", early.moreFewer],
  "share-bowls": [0, 2, "2.OA.C.4", early.shareBowls],
  "double-half": [1, 2, "1.OA.C.6", early.doubleHalf],
  "repeat-batch": [2, 2, "2.OA.C.4", early.repeatBatch],
  "times-as-many": [3, 3, "3.OA.A.1", mid.timesAsMany],
  "scale-whole": [3, 3, "3.OA.A.3", mid.scaleWhole],
  "table-100": [4, 4, "4.OA.A.2", mid.table100],
  "fraction-batch": [4, 5, "4.NF.B.4", mid.fractionBatch],
  "fraction-scale": [5, 5, "5.NF.B.5", mid.fractionScale],
  "graph-pairs": [5, 5, "5.OA.B.3", mid.graphPairs],
  "equiv-ratios": [6, 6, "6.RP.A.3a", g6.equivRatios],
  "unit-rate": [6, 6, "6.RP.A.2", g6.unitRate],
  "percent-per-100": [6, 6, "6.RP.A.3c", g6.percentPer100],
  "constant-speed": [6, 6, "6.RP.A.3b", g6.constantSpeed],
  "stronger-mix": [6, 6, "6.RP.A.3", g6.strongerMix],
  "const-k": [7, 7, "7.RP.A.2b", g78.constK],
  "equation-ykx": [7, 7, "7.RP.A.2c", g78.equationYKX],
  "scale-drawing": [7, 7, "7.G.A.1", g78.scaleDrawing],
  "percent-prop": [7, 7, "7.RP.A.3", g78.percentProp],
  "line-origin": [8, 8, "8.EE.B.5", g78.lineOrigin],
  "compare-rates": [8, 8, "8.EE.B.5", g78.compareRates],
  "direct-variation": [8, 8, "8.F.B.4", g78.directVariation],
};

export function makeRound(skillId, level, rng, grade) {
  const entry = SKILL_TABLE[skillId];
  if (!entry) throw new RangeError(`Unknown skill ${skillId}`);
  const [low, high, , generate] = entry;
  return generate(Math.min(3, Math.max(1, level)), rng, Math.min(high, Math.max(low, grade)));
}

// ---- reading what the learner typed -------------------------------------------------------------------------------------
export function readNum(text) {
  if (text == null) return null;
  const t = String(text)
    .trim()
    .replace(/^(\d+),(\d+)$/, "$1.$2");
  if (!t || t.includes("%")) return null;
  return parse(t);
}
export function readRatio(text) {
  const m = /^\s*(\d+)\s*(?::|∶|to|a)\s*(\d+)\s*$/i.exec(String(text ?? ""));
  return m ? [Number(m[1]), Number(m[2])] : null;
}

export const plain = (row, lang) => (row.noun ? row.noun[lang][1] : row.name[lang]);
const absDiff = (a, b) => (cmp(a, b) >= 0 ? sub(a, b) : sub(b, a));
const isInteger = (r) => r.d === 1;

// ---- scoring ----------------------------------------------------------------------------------------------------------------
function batchCode(round, col, b) {
  const { pin } = col;
  const per = col.per[pin.key];
  const unit = eq(per, R(1));
  if (round.hintKind === "inverse") {
    if (eq(b, pin.value)) return "inv-target";
    if (eq(b, mul(per, pin.value))) return "inv-multiply";
    if (cmp(pin.value, per) > 0 && eq(b, sub(pin.value, per))) return "inv-diff";
    return "inv-wrong";
  }
  if (!unit) {
    if (cmp(pin.value, per) > 0 && eq(b, sub(pin.value, per))) return "batch-diff";
    if (eq(b, pin.value)) return "batch-target";
    if (pin.value.n && eq(b, div(per, pin.value))) return "batch-inverse";
    if (cmp(b, R(1)) > 0 && cmp(col.batch, R(1)) < 0) return "batch-should-shrink";
    if (cmp(b, R(1)) < 0 && cmp(col.batch, R(1)) > 0) return "batch-should-grow";
  }
  if (eq(absDiff(b, col.batch), col.step)) return "batch-near";
  return "batch-wrong";
}

function limitCode(col, b) {
  for (const [key, have] of Object.entries(col.limit.have))
    if (cmp(mul(col.per[key], b), have) > 0) return { code: "limit-over", row: key };
  const steps = div(b, col.step);
  if (!isInteger(steps)) return { code: "limit-step" };
  return cmp(b, col.batch) < 0 ? { code: "limit-small" } : null;
}

function valueCode(round, col, key, v, want) {
  const per = col.per[key];
  if (eq(v, per)) return "value-unscaled";
  if (col.pin && eq(v, add(per, sub(col.pin.value, col.per[col.pin.key])))) return "value-additive";
  if (round.hintKind === "unit" && want.n && eq(v, div(R(1), want))) return "value-inverse";
  if (col.batch.n && eq(v, div(per, col.batch))) return "value-flipped";
  if (col.ask.some((other) => other !== key && eq(v, valueOf(col, other)))) return "value-swapped";
  return "value-wrong";
}

function colMistake(round, col, resp) {
  const b = readNum(resp?.batch);
  if (!b || b.n < 0) return { code: "no-batch" };
  if (col.pin && !eq(b, col.batch)) return { code: batchCode(round, col, b), row: col.pin.key };
  if (col.limit) {
    const bad = limitCode(col, b);
    if (bad) return bad;
  }
  for (const key of col.ask) {
    const v = readNum(resp?.values?.[key]);
    if (!v) return { code: "value-missing" };
    const want = valueOf(col, key);
    if (!eq(v, want)) return { code: valueCode(round, col, key, v, want) };
  }
  return null;
}

function extraMistake(round, e, resp) {
  const text = resp?.extra?.[e.key];
  if (e.kind === "ratio") {
    const got = readRatio(text);
    if (!got) return "ratio-missing";
    const [a, b] = e.answer;
    if (got[0] === a && got[1] === b) return null;
    if (got[0] === b && got[1] === a) return "ratio-flipped";
    if (got[1] > 0 && got[0] * b === got[1] * a) return "ratio-unreduced";
    return "ratio-wrong";
  }
  const v = readNum(text);
  if (!v) return "extra-missing";
  if (eq(v, e.answer)) return null;
  if (e.key === "diff") {
    const col = round.cols;
    if (
      eq(
        v,
        col.reduce((sum, c) => add(sum, valueOf(c, c.ask[0])), frac(0)),
      )
    )
      return "extra-sum";
  }
  if (e.key === "gap") return "extra-gap";
  if (e.key === "k" && e.answer.n && eq(v, div(R(1), e.answer))) return "extra-flip";
  return "extra-wrong";
}

const INVERSE_COPY = {
  "inv-target": {
    en: "That is the total you started with. The answer is how many go in each group: split the total into equal groups.",
    es: "Ese es el total del que partiste. La respuesta es cuántos van en cada grupo: reparte el total en grupos iguales.",
  },
  "inv-multiply": {
    en: "You multiplied. Sharing or comparing like this goes the other way: divide the total by the number of groups.",
    es: "Multiplicaste. Repartir o comparar así va al revés: divide el total entre el número de grupos.",
  },
  "inv-diff": {
    en: "You subtracted. Equal groups mean division: how many equal groups fit in the total?",
    es: "Restaste. Los grupos iguales piden dividir: ¿cuántos grupos iguales caben en el total?",
  },
  "inv-wrong": {
    en: "Check your answer: put that many in every group and see if the total matches the goal.",
    es: "Revisa tu respuesta: pon esa cantidad en cada grupo y mira si el total coincide con la meta.",
  },
  "batch-should-shrink": {
    en: "Your batch is bigger than a single batch, but the goal is smaller than a single batch. Scale down.",
    es: "Tu tanda es mayor que una sola tanda, pero la meta es menor que una sola tanda. Reduce.",
  },
  "batch-should-grow": {
    en: "Your batch is smaller than a single batch, but the goal is bigger than a single batch. Scale up.",
    es: "Tu tanda es menor que una sola tanda, pero la meta es mayor que una sola tanda. Aumenta.",
  },
};
export const feedbackFor = (code) => MISTAKES[code] || INVERSE_COPY[code];
export const MISTAKE_CODES = [...Object.keys(MISTAKES), ...Object.keys(INVERSE_COPY)];

const rowOf = (round, key) => round.rows.find((r) => r.key === key);
function miss(round, code, { col, row, step } = {}) {
  const base = feedbackFor(code);
  const out = {};
  for (const lang of ["en", "es"]) {
    const vars = {
      name: row
        ? code === "limit-over"
          ? plain(rowOf(round, row), lang)
          : plain(rowOf(round, row), lang)
        : "",
      step: step ? `${step.n}/${step.d}` : "",
    };
    const prefix = col ? `${col.label[lang]}: ` : "";
    out[lang] = prefix + fmt(base[lang], vars);
  }
  return { correct: false, mistake: code, feedback: out };
}

export function check(round, response) {
  const r = response || {};
  const several = round.cols.length > 1;
  for (let i = 0; i < round.cols.length; i += 1) {
    const col = round.cols[i];
    const bad = colMistake(round, col, r.cols?.[i]);
    if (bad)
      return miss(round, bad.code, { col: several ? col : null, row: bad.row, step: col.step });
  }
  for (const e of round.extra) {
    const code = extraMistake(round, e, r);
    if (code) return miss(round, code);
  }
  if (round.pick && r.pick !== round.pick.answer) return miss(round, round.pick.wrong);
  return { correct: true, feedback: FRIENDLY_OK };
}

export function solve(round) {
  const cols = round.cols.map((col) => ({
    batch: typed(col.batch, round.style),
    values: Object.fromEntries(col.ask.map((key) => [key, typed(valueOf(col, key), round.style)])),
  }));
  const extra = Object.fromEntries(
    round.extra.map((e) => [
      e.key,
      e.kind === "ratio" ? `${e.answer[0]}:${e.answer[1]}` : typed(e.answer, round.style),
    ]),
  );
  return { cols, extra, pick: round.pick ? round.pick.answer : null };
}

// Short, language-neutral: "×3 → 6, 4" per column, then extras and the picked option.
export function answerText(round) {
  const parts = round.cols.map((col) => {
    const asked = col.ask.map((key) => fmtVal(valueOf(col, key), round.style));
    return `×${fmtVal(col.batch, round.style)}${asked.length ? ` → ${asked.join(", ")}` : ""}`;
  });
  let text = parts.join(" | ");
  for (const e of round.extra)
    text += `; ${e.kind === "ratio" ? `${e.answer[0]}:${e.answer[1]}` : `${e.key}=${fmtVal(e.answer, round.style)}`}`;
  if (round.pick) text += `; ${"AB"[round.pick.answer]}`;
  return text;
}
