// living/percent-estimate-model.js — the mathematics and every sentence of the
// percent-estimate play (4-3 "Estimate the Percent of a Number"). Pure functions
// only: every number the play shows a student is computed here and checked in
// node by percent-estimate.test.mjs.
//
// The idea: do not compute — find the friendly benchmark percent (10%, 25% or
// 50%) near the percent you have, round the whole to a compatible number, and
// read the estimate off a percent bar. Then check it against the exact value.
// Amounts are held in hundredths so no float reaches the stage.

import { fmt, okInt, placeNotFirst } from "./unit-convert-model.js";

export { fmt, okInt, placeNotFirst };

export const BENCHES = [10, 25, 50];

const pair = (v, max = 400) => {
  const en = typeof v === "string" ? v.trim() : typeof v?.en === "string" ? v.en.trim() : "";
  const es = typeof v?.es === "string" && v.es.trim() ? v.es.trim() : en;
  return en && en.length <= max && es.length <= max ? { en, es } : null;
};
const P = (en, es) => ({ en, es });

/** The percent as tenths of a percent (24 → 240, 8.6 → 86): one decimal at most. */
const tenths = (x) => {
  const t = Math.round(Number(x) * 10);
  return Math.abs(Number(x) * 10 - t) < 1e-9 ? t : null;
};

function problem(c) {
  const t10 = tenths(c?.percent);
  const whole = Number(c?.whole);
  const compat = Number(c?.compat);
  const bench = Number(c?.bench);
  if (t10 == null || t10 < 10 || t10 > 990 || !BENCHES.includes(bench)) return null;
  if (!okInt(whole, 2, 100000) || !okInt(compat, 2, 100000) || (compat * bench) % 100) return null;
  if (Math.abs(bench * 10 - t10) > 100 || Math.abs(compat - whole) * 10 > whole) return null;
  const unit = pair(c.unit, 30);
  const prefix = typeof c.prefix === "string" && c.prefix.length <= 2 ? c.prefix : "";
  if (!prefix && !unit) return null;
  const est = (compat * bench) / 100;
  const exactH = Math.round((t10 * whole) / 10); // hundredths
  return {
    percent: t10 / 10,
    t10,
    whole,
    compat,
    bench,
    unit,
    prefix,
    est,
    exactH,
    exactRounded: (t10 * whole) % 10 !== 0,
    story: pair(c.story),
    verdict: est * 100 > exactH ? "high" : est * 100 < exactH ? "low" : "exact",
  };
}

export function validatePercentEstimate(cfg) {
  const main = problem(cfg);
  const transfer = problem(cfg?.transfer);
  if (!main || !transfer || main.verdict === "exact") return null;
  if (!choicesFor(main) || !choicesFor(transfer)) return null;
  return { ...main, transfer };
}

/** Amount text from hundredths: "$20" or "22 pounds". */
export function amt(s, h) {
  return s.prefix ? `${s.prefix}${fmt(h)}` : `${fmt(h)} ${s.unit.en}`;
}
/** Bare amount for a scale label: "$20" or "22". */
export const numTxt = (s, h) => (s.prefix ? `${s.prefix}${fmt(h)}` : fmt(h));
export function amtPair(s, h) {
  return s.prefix
    ? P(`${s.prefix}${fmt(h)}`, `${s.prefix}${fmt(h)}`)
    : P(`${fmt(h)} ${s.unit.en}`, `${fmt(h)} ${s.unit.es}`);
}

/**
 * "About how much?" choices: the benchmark estimate plus real slips — the
 * percent's own number used as the amount, and the other benchmarks of the
 * friendly whole. At most three distractors, all different from the estimate.
 */
export function choicesFor(s) {
  /** @type {{ kind: string, v: number, b?: number, correct?: boolean }[]} */
  const out = [{ kind: "correct", v: s.est, correct: true }];
  const cands = [
    { kind: "number", v: Math.round(s.percent) },
    ...BENCHES.filter((b) => b !== s.bench).map((b) => ({
      kind: `b${b}`,
      b,
      v: (s.compat * b) / 100,
    })),
  ];
  for (const c of cands)
    if (Number.isInteger(c.v) && c.v > 0 && !out.some((o) => o.v === c.v) && out.length < 4)
      out.push(c);
  return out.length >= 3 ? out : null;
}

/** Verdict choices for "is the estimate a little high or a little low?". */
export const checkChoices = (verdict) =>
  ["high", "low", "exact"].map((kind) => ({ kind, correct: kind === verdict }));

export function estimateCopy(v) {
  const { percent, whole, compat, bench, est, exactH, verdict, transfer: t } = v;
  const pctDir = bench > percent ? "up" : "down";
  const wholeDir = compat > whole ? "up" : "down";
  const dirEs = { up: "hacia arriba", down: "hacia abajo" };
  const cue = (s) => (kind, val) => {
    const x = amtPair(s, val * 100);
    if (kind === "number")
      return P(
        `${x.en} reuses the percent's number as an amount. The top scale reads percents and the bottom scale reads amounts. Where does ${s.percent}% land on the bottom scale?`,
        `${x.es} usa el número del porcentaje como cantidad. La escala de arriba lee porcentajes y la de abajo lee cantidades. ¿Dónde queda ${s.percent}% en la escala de abajo?`,
      );
    const b = Number(kind.slice(1));
    return P(
      `${x.en} is ${b}% of ${s.compat}. On the bar, is ${s.percent}% close to ${b}%, or far from it? Which benchmark is it closest to?`,
      `${x.es} es el ${b}% de ${s.compat}. En la barra, ¿${s.percent}% está cerca de ${b}% o lejos? ¿De cuál referencia está más cerca?`,
    );
  };
  return {
    kicker: P("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: P("Estimate a percent of a number", "Estima un porcentaje de un número"),
    ariaLabel: P(
      `A percent bar from 0% to 100%, matched to amounts from 0 to ${amt(v, whole * 100)}. ${percent}% is marked just near the ${bench}% benchmark. The friendly whole ${amt(v, compat * 100)} gives ${bench}% = ${amt(v, est * 100)}, so ${percent}% of ${amt(v, whole * 100)} is about ${amt(v, est * 100)}.`,
      `Una barra de porcentaje de 0% a 100%, unida a cantidades de 0 a ${amtPair(v, whole * 100).es}. El ${percent}% está marcado cerca de la referencia ${bench}%. El total sencillo ${amtPair(v, compat * 100).es} da ${bench}% = ${amtPair(v, est * 100).es}, así que el ${percent}% de ${amtPair(v, whole * 100).es} es alrededor de ${amtPair(v, est * 100).es}.`,
    ),
    printSummary: P(
      `To estimate ${percent}% of ${amt(v, whole * 100)}, use a benchmark: ${percent}% is close to ${bench}%, and ${amt(v, whole * 100)} is close to ${amt(v, compat * 100)}. ${bench}% of ${amt(v, compat * 100)} is ${amt(v, est * 100)}, so the answer is about ${amt(v, est * 100)}. The exact value, ${percent / 100} × ${whole}, is ${amt(v, exactH)}${v.exactRounded ? " (rounded)" : ""}, so the estimate is a little ${verdict}.`,
      `Para estimar el ${percent}% de ${amtPair(v, whole * 100).es}, usa una referencia: ${percent}% está cerca de ${bench}%, y ${amtPair(v, whole * 100).es} está cerca de ${amtPair(v, compat * 100).es}. El ${bench}% de ${amtPair(v, compat * 100).es} es ${amtPair(v, est * 100).es}, así que la respuesta es alrededor de ${amtPair(v, est * 100).es}. El valor exacto, ${percent / 100} × ${whole}, es ${amtPair(v, exactH).es}${v.exactRounded ? " (redondeado)" : ""}, así que la estimación queda un poco ${verdict === "high" ? "alta" : "baja"}.`,
    ),
    scene: {
      situate: P("The bar", "La barra"),
      predict: P("Predict", "Predice"),
      bench: P("Benchmarks", "Referencias"),
      estimate: P("Your estimate", "Tu estimación"),
      check: P("Check it", "Compruébalo"),
      transfer: P("On your own", "Por tu cuenta"),
    },
    about: (x) => P(`about ${x.en}`, `alrededor de ${x.es}`),
    wholeLbl: (s, h, friendly) =>
      P(
        `100% = ${amt(s, h)}${friendly ? " (friendly)" : ""}`,
        `100% = ${amtPair(s, h).es}${friendly ? " (sencillo)" : ""}`,
      ),
    situate: {
      say:
        v.story ||
        P(
          `We want ${percent}% of ${amt(v, whole * 100)} without a calculator. The bar's top scale counts percents, 0% to 100%; the bottom scale counts amounts, 0 to ${amt(v, whole * 100)}. The pin marks ${percent}%.`,
          `Queremos el ${percent}% de ${amtPair(v, whole * 100).es} sin calculadora. La escala de arriba cuenta porcentajes, de 0% a 100%; la de abajo cuenta cantidades, de 0 a ${amtPair(v, whole * 100).es}. El marcador señala ${percent}%.`,
        ),
      note: P(
        `The top scale counts percents and the bottom scale counts amounts. Where on the bottom scale is the pin at ${percent}%?`,
        `La escala de arriba cuenta porcentajes y la de abajo cuenta cantidades. ¿Dónde queda el marcador de ${percent}% en la escala de abajo?`,
      ),
    },
    predict: {
      say: P(
        `Estimate in your head. About how much is ${percent}% of ${amt(v, whole * 100)}?`,
        `Estima mentalmente. ¿Más o menos cuánto es el ${percent}% de ${amtPair(v, whole * 100).es}?`,
      ),
      question: P(
        `${percent}% of ${amt(v, whole * 100)} is about…`,
        `El ${percent}% de ${amtPair(v, whole * 100).es} es alrededor de…`,
      ),
      ok: P(
        `A good estimate. Now find out why: use friendly benchmarks.`,
        `Una buena estimación. Ahora descubre por qué: usa referencias sencillas.`,
      ),
      cue: cue(v),
    },
    bench: {
      say: P(
        `Make the numbers friendly. First round ${amt(v, whole * 100)} to a compatible number, then show the benchmark percents 10%, 25% and 50% on the bar.`,
        `Haz los números sencillos. Primero redondea ${amtPair(v, whole * 100).es} a un número compatible y luego muestra las referencias 10%, 25% y 50% en la barra.`,
      ),
      round: P(
        `Round ${amt(v, whole * 100)} to ${amt(v, compat * 100)}`,
        `Redondea ${amtPair(v, whole * 100).es} a ${amtPair(v, compat * 100).es}`,
      ),
      roundFirst: P(
        "Round the whole first: the benchmarks use the friendly number.",
        "Primero redondea el total: las referencias usan el número sencillo.",
      ),
      show: (b) => P(`Show ${b}%`, `Muestra ${b}%`),
      more: P(
        "Show all three benchmarks to see where the pin sits.",
        "Muestra las tres referencias para ver dónde queda el marcador.",
      ),
      done: P(
        `${percent}% sits right next to ${bench}%. The friendly whole is ${amt(v, compat * 100)}, so ${bench}% of it is ${amt(v, est * 100)}.`,
        `El ${percent}% queda justo al lado de ${bench}%. El total sencillo es ${amtPair(v, compat * 100).es}, así que el ${bench}% es ${amtPair(v, est * 100).es}.`,
      ),
    },
    estimate: {
      say: P(
        `${percent}% is between the benchmarks, closest to ${bench}%. ${bench}% of ${amt(v, compat * 100)} is ${amt(v, est * 100)}, so ${percent}% of ${amt(v, whole * 100)} is about ${amt(v, est * 100)}.`,
        `El ${percent}% está entre las referencias, más cerca de ${bench}%. El ${bench}% de ${amtPair(v, compat * 100).es} es ${amtPair(v, est * 100).es}, así que el ${percent}% de ${amtPair(v, whole * 100).es} es alrededor de ${amtPair(v, est * 100).es}.`,
      ),
    },
    check: {
      say: P(
        `Now check the estimate. Is it a little high, a little low, or exact?`,
        `Ahora comprueba la estimación. ¿Queda un poco alta, un poco baja o exacta?`,
      ),
      question: P(
        `Compared with the exact answer, the estimate is…`,
        `Comparada con la respuesta exacta, la estimación es…`,
      ),
      labels: {
        high: P("a little high", "un poco alta"),
        low: P("a little low", "un poco baja"),
        exact: P("exactly right", "exacta"),
      },
      cue: (kind) =>
        ({
          high: P(
            `Two roundings happened: ${percent}% became ${bench}% (${pctDir}) and ${whole} became ${compat} (${wholeDir}). Rounding up makes the estimate bigger and rounding down makes it smaller. Which rounding changed the answer more?`,
            `Hubo dos redondeos: ${percent}% pasó a ${bench}% (${dirEs[pctDir]}) y ${whole} pasó a ${compat} (${dirEs[wholeDir]}). Redondear hacia arriba agranda la estimación y hacia abajo la achica. ¿Cuál redondeo cambió más la respuesta?`,
          ),
          low: P(
            `Two roundings happened: ${percent}% became ${bench}% (${pctDir}) and ${whole} became ${compat} (${wholeDir}). Rounding up makes the estimate bigger and rounding down makes it smaller. Which rounding changed the answer more?`,
            `Hubo dos redondeos: ${percent}% pasó a ${bench}% (${dirEs[pctDir]}) y ${whole} pasó a ${compat} (${dirEs[wholeDir]}). Redondear hacia arriba agranda la estimación y hacia abajo la achica. ¿Cuál redondeo cambió más la respuesta?`,
          ),
          exact: P(
            `An exact answer needs no rounding. Were ${percent}% and ${whole} changed to friendlier numbers?`,
            `Una respuesta exacta no necesita redondeo. ¿Se cambiaron ${percent}% y ${whole} por números más sencillos?`,
          ),
        })[kind],
      lead: (kind) =>
        kind === "exact"
          ? null
          : kind === "high"
            ? P(
                `If the estimate were high, the exact answer would be below ${amt(v, est * 100)}.`,
                `Si la estimación fuera alta, la respuesta exacta estaría por debajo de ${amtPair(v, est * 100).es}.`,
              )
            : P(
                `If the estimate were low, the exact answer would be above ${amt(v, est * 100)}.`,
                `Si la estimación fuera baja, la respuesta exacta estaría por encima de ${amtPair(v, est * 100).es}.`,
              ),
      ok: P(
        `Yes: the exact value is ${percent / 100} × ${whole} = ${amt(v, exactH)}${v.exactRounded ? " (rounded)" : ""}, and the estimate, ${amt(v, est * 100)}, is a little ${verdict}. An estimate only has to be close.`,
        `Sí: el valor exacto es ${percent / 100} × ${whole} = ${amtPair(v, exactH).es}${v.exactRounded ? " (redondeado)" : ""}, y la estimación, ${amtPair(v, est * 100).es}, queda un poco ${verdict === "high" ? "alta" : "baja"}. Una estimación solo tiene que ser cercana.`,
      ),
      exactLine: `${percent / 100} × ${whole} = ${v.prefix}${fmt(exactH)}`,
    },
    transfer: {
      say:
        t.story ||
        P(
          `A new problem: ${t.percent}% of ${amt(t, t.whole * 100)}. Estimate with a benchmark.`,
          `Un problema nuevo: el ${t.percent}% de ${amtPair(t, t.whole * 100).es}. Estima con una referencia.`,
        ),
      question: P(
        `${t.percent}% of ${amt(t, t.whole * 100)} is about…`,
        `El ${t.percent}% de ${amtPair(t, t.whole * 100).es} es alrededor de…`,
      ),
      ok: P(
        `Right: ${t.percent}% is about ${t.bench}%, and ${t.whole} is about ${t.compat}. ${t.bench}% of ${t.compat} = ${amt(t, t.est * 100)}, so about ${amt(t, t.est * 100)}.`,
        `Correcto: el ${t.percent}% es casi ${t.bench}%, y ${t.whole} es casi ${t.compat}. El ${t.bench}% de ${t.compat} = ${amtPair(t, t.est * 100).es}, así que alrededor de ${amtPair(t, t.est * 100).es}.`,
      ),
      cue: cue(t),
      explain: P(
        "Explain: why is an estimate good enough here, and which benchmark did you pick?",
        "Explica: ¿por qué aquí basta una estimación y qué referencia elegiste?",
      ),
      frame: P(
        "I picked ___% because ___ is close to it, and I rounded ___ to ___, so the answer is about ___.",
        "Elegí ___% porque ___ está cerca, y redondeé ___ a ___, así que la respuesta es alrededor de ___.",
      ),
    },
  };
}
