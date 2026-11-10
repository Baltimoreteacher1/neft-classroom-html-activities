// Every sentence MathSense says about the current state: the statement panel and the one live-region message.
// All of it is computed from exact amounts; English text is the key into the Spanish table.
import { t } from "../i18n.js";
import {
  benchmarkOf,
  cmp,
  decimalText,
  fractionText,
  isWhole,
  mixed,
  mixedText,
  percentText,
  piecesOf,
  roundedText,
  sub,
} from "./exact.js";
import { shownKeys } from "./model.js";

const NAME = { a: "A", b: "B" };
export const name = (which) => NAME[which];

export function forms(q, parts) {
  const decimal = decimalText(q);
  const percent = percentText(q);
  return {
    fraction: fractionText(q),
    mixed: q.n >= q.d && !isWhole(q) ? mixedText(q) : null,
    decimal,
    percent,
    pieces: piecesOf(q, parts),
    parts,
  };
}

const lowestOf = (q) => fractionText(q);

function benchmarkLine(q) {
  const mark = benchmarkOf(q);
  if (mark.exact)
    return t("It sits exactly on the benchmark {mark}.", { mark: fractionText(mark.exact) });
  const vars = { lo: fractionText(mark.lo), hi: fractionText(mark.hi) };
  if (mark.closer === "middle")
    return t("It is halfway between the benchmarks {lo} and {hi}.", vars);
  return mark.closer === "lo"
    ? t("It is between the benchmarks {lo} and {hi}, closer to {lo}.", vars)
    : t("It is between the benchmarks {lo} and {hi}, closer to {hi}.", vars);
}

function honestyLine(q) {
  const info = decimalText(q);
  if (info.terminating) return null;
  const block = info.cycle.length > 12 ? `${info.cycle.slice(0, 12)}…` : info.cycle;
  return t(
    "The digits {block} repeat forever, so a decimal that stops, like {stop}, is close but not equal. Rounded to the hundredths it is about {round}.",
    { block, stop: roundedText(q, 3), round: roundedText(q, 2) },
  );
}

export function statements(state) {
  const lines = [];
  for (const which of shownKeys(state)) {
    const q = state[which];
    const f = forms(q, state.parts[which]);
    const label = state.compare ? t("Quantity {name}", { name: name(which) }) : t("This amount");
    const list = [];
    list.push({ id: "chain", text: `${f.fraction} = ${f.decimal.text} = ${f.percent.text}` });
    if (q.d !== 1n)
      list.push({
        id: "division",
        text: t("{n} ÷ {d} = {decimal}", { n: q.n, d: q.d, decimal: f.decimal.text }),
      });
    if (f.pieces !== null) {
      const same = f.pieces === q.n && BigInt(f.parts) === q.d;
      list.push({
        id: "pieces",
        text: same
          ? t("{k} of {parts} equal pieces are shaded.", { k: f.pieces, parts: f.parts })
          : t("{k} of {parts} equal pieces are shaded, so {k}/{parts} = {lowest}.", {
              k: f.pieces,
              parts: f.parts,
              lowest: lowestOf(q),
            }),
      });
    } else {
      list.push({
        id: "pieces",
        text: t(
          "This amount falls between two lines of the {parts}-piece cut, so it is not a whole number of pieces.",
          { parts: f.parts },
        ),
      });
    }
    if (f.mixed) {
      const { whole, rest } = mixed(q);
      list.push({
        id: "mixed",
        text: t("{fraction} = {mixed}: {whole} whole and {rest} more.", {
          fraction: f.fraction,
          mixed: f.mixed,
          whole,
          rest: fractionText(rest),
        }),
      });
    }
    if (f.percent.terminating && (q.n * 100n) % q.d === 0n) {
      list.push({
        id: "percent",
        text: t("{percent} means {count} out of every 100.", {
          percent: f.percent.text,
          count: (q.n * 100n) / q.d,
        }),
      });
    }
    const honest = honestyLine(q);
    if (honest) list.push({ id: "honest", text: honest });
    list.push({ id: "benchmark", text: benchmarkLine(q) });
    lines.push({ which, label, list });
  }
  return lines;
}

export function compareLine(state) {
  if (!state.compare) return null;
  const order = cmp(state.a, state.b);
  const diff = sub(state.a, state.b);
  const absDiff = order < 0 ? sub(state.b, state.a) : diff;
  const vars = {
    a: fractionText(state.a),
    b: fractionText(state.b),
    diff: fractionText(absDiff),
    da: decimalText(state.a).text,
    db: decimalText(state.b).text,
  };
  if (order === 0)
    return t("A and B are equal: {a} = {b}. They sit on the same spot on every line.", vars);
  return order > 0
    ? t("A = {a} is greater than B = {b}. A is {da} and B is {db}. A is {diff} more.", vars)
    : t("A = {a} is less than B = {b}. A is {da} and B is {db}. B is {diff} more.", vars);
}

// The single sentence read by the one polite live region after a change.
export function liveMessage(state, sourceLabel) {
  const q = state[state.active];
  const f = forms(q, state.parts[state.active]);
  const chain = t("{who} is {fraction}, which is {decimal} and {percent}.", {
    who: state.compare ? t("Quantity {name}", { name: name(state.active) }) : t("The amount"),
    fraction: f.fraction,
    decimal: f.decimal.text,
    percent: f.percent.text,
  });
  const pieces =
    f.pieces === null ? "" : ` ${t("{k} of {parts} pieces.", { k: f.pieces, parts: f.parts })}`;
  const compare = compareLine(state);
  return [sourceLabel, chain + pieces, compare].filter(Boolean).join(" ");
}

// Text for assistive technology on each picture (aria-valuetext).
export function pictureText(state, which = state.active) {
  const q = state[which];
  const f = forms(q, state.parts[which]);
  return t("{fraction}, {decimal}, {percent}", {
    fraction: f.fraction,
    decimal: f.decimal.text,
    percent: f.percent.text,
  });
}

// Names for the cuts in the "equal pieces" chooser (the English text is the key into the Spanish table).
export const PIECE_NAMES = Object.freeze({
  2: "halves", 3: "thirds", 4: "fourths", 5: "fifths", 6: "sixths", 7: "sevenths", 8: "eighths", 9: "ninths", 10: "tenths",
  11: "elevenths", 12: "twelfths", 16: "sixteenths", 20: "twentieths", 25: "twenty-fifths", 50: "fiftieths", 100: "hundredths",
});
export const pieceLabel = (parts) => (PIECE_NAMES[parts] ? `${parts} ${t(PIECE_NAMES[parts])}` : t("{parts} pieces", { parts }));
