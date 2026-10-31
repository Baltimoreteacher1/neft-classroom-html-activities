// Rounding engine: a number line between the two nearest multiples of the place, with the halfway mark. The
// answer is whichever end is nearer; exactly halfway rounds up. Frames record `lower`, `upper` and the choice
// so the tests can check the rule against plain arithmetic.
import { COLORS, L, clean, esc, frame, keyed, num, svgWrap, txt } from "./core.js";

const PLACES = { ten: 10, hundred: 100, thousand: 1000, "ten thousand": 10000, "hundred thousand": 100000, million: 1000000 };
const comma = (n) => n.toLocaleString("en-US");

export function parse(question) {
  const m = clean(question).match(/^Round (\d+) to the nearest (ten thousand|hundred thousand|ten|hundred|thousand|million)\.$/);
  if (!m) return null;
  const n = Number(m[1]);
  const p = PLACES[m[2]];
  const lower = Math.floor(n / p) * p;
  const upper = lower + p;
  const mid = lower + p / 2;
  return { engine: "round", n, place: m[2], p, lower, upper, mid, result: n >= mid ? upper : lower };
}

function drawLine(s, { token = true, mark = false, pick = null } = {}) {
  const X = (v) => 60 + ((v - s.lower) / s.p) * 440;
  let out = `<line x1="50" x2="510" y1="120" y2="120" stroke="${COLORS.ink}" stroke-width="4"/>`;
  for (const [v, label, color] of [
    [s.lower, comma(s.lower), COLORS.whole],
    [s.upper, comma(s.upper), COLORS.whole],
  ]) {
    out += `<line x1="${X(v)}" x2="${X(v)}" y1="104" y2="136" stroke="${color}" stroke-width="5"/>` + txt(X(v), 168, label, { size: 17, fill: color });
  }
  if (mark || pick) out += `<line x1="${X(s.mid)}" x2="${X(s.mid)}" y1="96" y2="144" stroke="${COLORS.warn}" stroke-width="3" stroke-dasharray="6 5"/>` + txt(X(s.mid), 88, `${comma(s.mid)} ${L("halfway", "mitad").en}`, { size: 14, fill: COLORS.warn });
  if (pick) out += `<circle cx="${X(pick === "upper" ? s.upper : s.lower)}" cy="120" r="14" fill="none" stroke="${COLORS.part}" stroke-width="5"/>`;
  if (token) out += keyed("tok", X(s.n), 120, `<circle r="12" fill="${COLORS.hundreds}" stroke="#fff" stroke-width="3"/>${txt(0, -22, comma(s.n), { size: 16, fill: COLORS.hundreds })}`, "sd-token");
  return svgWrap(out, "", { h: 200 });
}
const mk = (s, id, cap, easy, opts, meta = {}) => {
  const alt = L(`Number line from ${comma(s.lower)} to ${comma(s.upper)} with ${comma(s.n)} marked.`, `Recta numérica de ${comma(s.lower)} a ${comma(s.upper)} con ${comma(s.n)} marcado.`);
  return Object.assign(frame({ id, cap, easy, eq: `${comma(s.n)} ≈ ?`, svg: drawLine(s, opts).replace('aria-label=""', `aria-label="${esc(alt.en)}"`), alt }), { meta: { lower: s.lower, upper: s.upper, ...meta } });
};

export function frames(s) {
  const near = s.result === s.upper ? "upper" : "lower";
  const plc = L(s.place, { ten: "decena", hundred: "centena", thousand: "millar", "ten thousand": "decena de millar", "hundred thousand": "centena de millar", million: "millón" }[s.place]);
  return [
    mk(s, "between", L(`${comma(s.n)} sits between two multiples of ${comma(s.p)}: ${comma(s.lower)} and ${comma(s.upper)}.`, `${comma(s.n)} está entre dos múltiplos de ${comma(s.p)}: ${comma(s.lower)} y ${comma(s.upper)}.`), L(`Between ${comma(s.lower)} and ${comma(s.upper)}.`, `Entre ${comma(s.lower)} y ${comma(s.upper)}.`), {}),
    mk(s, "halfway", L(`The halfway mark is ${comma(s.mid)}. A number at or past halfway is closer to the upper end.`, `La marca de la mitad es ${comma(s.mid)}. Un número en la mitad o después está más cerca del extremo mayor.`), L(`Halfway is ${comma(s.mid)}.`, `La mitad es ${comma(s.mid)}.`), { mark: true }),
    mk(s, "choose", L(`${comma(s.n)} is ${s.n >= s.mid ? (s.n === s.mid ? "exactly halfway, and halfway rounds up" : "past halfway") : "before halfway"}, so it is nearer to ${comma(s.result)}.`, `${comma(s.n)} ${s.n >= s.mid ? (s.n === s.mid ? "está justo en la mitad, y la mitad se redondea hacia arriba" : "pasó la mitad") : "no llegó a la mitad"}, así que está más cerca de ${comma(s.result)}.`), L(`Nearest ${plc.en}: ${comma(s.result)}.`, `${plc.es} más cercana: ${comma(s.result)}.`), { mark: true, pick: near }, { pick: near, result: s.result }),
  ];
}

export const answer = (s) => s.result;

export function predicts(s) {
  const upper = s.n >= s.mid;
  return [{ at: 2, q: L(`Is ${comma(s.n)} nearer to ${comma(s.lower)} or to ${comma(s.upper)}?`, `¿${comma(s.n)} está más cerca de ${comma(s.lower)} o de ${comma(s.upper)}?`), choices: [
    { t: L(`${comma(s.lower)}`, `${comma(s.lower)}`), ok: !upper, why: upper ? L(`${comma(s.n)} is at or past the halfway mark ${comma(s.mid)}, so the upper end is nearer.`, `${comma(s.n)} está en la mitad o más allá de ${comma(s.mid)}, así que el extremo mayor está más cerca.`) : L(`${comma(s.n)} has not reached the halfway mark ${comma(s.mid)}, so it is nearer the lower end.`, `${comma(s.n)} no llegó a la mitad ${comma(s.mid)}, así que está más cerca del extremo menor.`) },
    { t: L(`${comma(s.upper)}`, `${comma(s.upper)}`), ok: upper, why: upper ? L(`Yes: ${comma(s.n)} is ${s.n === s.mid ? "exactly halfway, and halfway rounds up" : "past the halfway mark"}.`, `Sí: ${comma(s.n)} ${s.n === s.mid ? "está justo en la mitad, y la mitad se redondea hacia arriba" : "pasó la mitad"}.`) : L(`${comma(s.n)} has not reached halfway, so ${comma(s.lower)} is nearer.`, `${comma(s.n)} no llegó a la mitad, así que ${comma(s.lower)} está más cerca.`) },
  ], explain: [
    { t: L("Because rounding picks the nearest multiple, and halfway is where the two ends are equally near.", "Porque redondear elige el múltiplo más cercano, y la mitad es donde ambos extremos están igual de cerca."), ok: true },
    { t: L("Because the digit to the right always decides, whatever the number.", "Porque el dígito de la derecha siempre decide, sea cual sea el número."), ok: false },
  ] }];
}

export function hints(s) {
  const list = frames(s);
  return [
    { text: L(`Find the two multiples of ${comma(s.p)} that ${comma(s.n)} sits between.`, `Halla los dos múltiplos de ${comma(s.p)} entre los que está ${comma(s.n)}.`) },
    { text: L("The line shows the two ends. Think about which end the number is nearer.", "La recta muestra los dos extremos. Piensa a cuál está más cerca el número."), frame: { ...list[0], svg: drawLine(s, { token: true }) } },
    { text: L(`The halfway number is ${comma(s.mid)}. Is ${comma(s.n)} before it, or at or past it?`, `El número de la mitad es ${comma(s.mid)}. ¿${comma(s.n)} está antes, o en la mitad o más allá?`), frame: list[1] },
  ];
}

export function diagnose(s, raw) {
  const v = num(raw);
  if (v === null || v === s.result) return null;
  if (v === (s.result === s.upper ? s.lower : s.upper)) return s.result === s.upper ? "roundedDown" : "roundedUp";
  return null;
}
export const tags = {
  roundedDown: { label: L("Rounded down when the number is at or past halfway", "Redondeó hacia abajo cuando el número está en la mitad o más allá"), tip: L("Check the halfway mark. At or past it, the number is nearer the upper end.", "Revisa la marca de la mitad. En ella o después, el número está más cerca del extremo mayor.") },
  roundedUp: { label: L("Rounded up when the number has not reached halfway", "Redondeó hacia arriba sin llegar a la mitad"), tip: L("Check the halfway mark. Before it, the number is nearer the lower end.", "Revisa la marca de la mitad. Antes de ella, el número está más cerca del extremo menor.") },
};

export const build = {
  prompt: (s) => L(`Which end is ${comma(s.n)} nearer to? Pick it on the line.`, `¿A qué extremo está más cerca ${comma(s.n)}? Elígelo en la recta.`),
  init: () => ({ pick: null }),
  render: (st, s) => {
    const alt = L(`Number line from ${comma(s.lower)} to ${comma(s.upper)} with ${comma(s.n)} marked.`, `Recta numérica de ${comma(s.lower)} a ${comma(s.upper)} con ${comma(s.n)} marcado.`);
    const done = st.pick !== null && (st.pick === "upper") === (s.result === s.upper);
    return {
      svg: drawLine(s, { mark: Boolean(st.pick), pick: st.pick }).replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
      alt,
      controls: [{ id: "pick", arg: "lower", label: L(`Nearer to ${comma(s.lower)}`, `Más cerca de ${comma(s.lower)}`) }, { id: "pick", arg: "upper", label: L(`Nearer to ${comma(s.upper)}`, `Más cerca de ${comma(s.upper)}`) }],
      status: done ? L(`Yes. ${comma(s.n)} rounds to ${comma(s.result)} because halfway is ${comma(s.mid)}.`, `Sí. ${comma(s.n)} se redondea a ${comma(s.result)} porque la mitad es ${comma(s.mid)}.`) : null,
    };
  },
  act(st, id, arg, s) {
    const right = (arg === "upper") === (s.result === s.upper);
    return { state: { pick: arg }, ok: right, msg: right ? null : L(`Look at the halfway mark ${comma(s.mid)}. Is ${comma(s.n)} before it or at or past it?`, `Mira la marca de la mitad ${comma(s.mid)}. ¿${comma(s.n)} está antes, o en la mitad o más allá?`), tag: right ? null : "wrongEnd" };
  },
  done: (st, s) => st.pick !== null && (st.pick === "upper") === (s.result === s.upper),
};
