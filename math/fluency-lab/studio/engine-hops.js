// Hops engine: counting forward and skip-counting as equal jumps on a number line. Each hop is the same size, so
// the next number is the last one plus that size. Frames record the size and the landing numbers for the tests.
import { COLORS, L, esc, fmt, frame, keyed, num, svgWrap, txt } from "./core.js";

export function parse(question) {
  // Not clean(): its comma-stripping is for thousands separators, and the commas here are the list.
  const q = String(question).replaceAll("−", "-").trim();
  const m = q.match(/^((?:-?\d+(?:\.\d+)?, ){2,}-?\d+(?:\.\d+)?), ___$/);
  if (!m) return null;
  const nums = m[1].split(", ").map(Number);
  const step = nums[1] - nums[0];
  if (step === 0 || !nums.every((v, i) => i === 0 || Math.abs(v - nums[i - 1] - step) < 1e-9)) return null;
  const last = nums.at(-1);
  return { engine: "hops", nums, step, last, result: Math.round((last + step) * 1e6) / 1e6 };
}

function line(s, { upto = s.nums.length, next = false, landed = null } = {}) {
  const pts = s.nums.slice(0, upto);
  const lo = Math.min(...s.nums, s.result);
  const hi = Math.max(...s.nums, s.result);
  const pad = Math.abs(s.step);
  const X = (v) => 50 + ((v - (lo - pad)) / (hi - lo + 2 * pad)) * 460;
  let out = `<line x1="40" x2="520" y1="130" y2="130" stroke="${COLORS.ink}" stroke-width="3"/>`;
  pts.forEach((v, i) => {
    out += `<line x1="${X(v)}" x2="${X(v)}" y1="120" y2="140" stroke="${COLORS.ink}" stroke-width="3"/>` + txt(X(v), 164, fmt(v), { size: 15 });
    if (i > 0) {
      const [a, b] = [X(pts[i - 1]), X(v)];
      out += `<path d="M${a},120 Q${(a + b) / 2},${70} ${b},120" fill="none" stroke="${COLORS.part}" stroke-width="4"/>` + txt((a + b) / 2, 66, `${s.step > 0 ? "+" : "−"}${fmt(Math.abs(s.step))}`, { size: 14, fill: COLORS.part });
    }
  });
  if (next) {
    const [a, b] = [X(s.last), X(s.last + s.step)];
    out += `<path d="M${a},120 Q${(a + b) / 2},${70} ${b},120" fill="none" stroke="${COLORS.warn}" stroke-width="4" stroke-dasharray="7 5"/>` + txt((a + b) / 2, 66, `${s.step > 0 ? "+" : "−"}${fmt(Math.abs(s.step))} ?`, { size: 14, fill: COLORS.warn }) + `<circle cx="${b}" cy="130" r="9" fill="none" stroke="${COLORS.warn}" stroke-width="3" stroke-dasharray="4 3"/>`;
  }
  if (landed !== null) out += keyed("tok", X(landed), 130, `<circle r="12" fill="${COLORS.whole}" stroke="#fff" stroke-width="3"/>${txt(0, -22, fmt(landed), { size: 15, fill: COLORS.whole })}`, "sd-token");
  return svgWrap(out, "", { h: 190 });
}
const mk = (s, id, cap, easy, opts, meta = {}) => {
  const alt = L(`Number line with the numbers ${s.nums.slice(0, opts.upto ?? s.nums.length).join(", ")}.`, `Recta numérica con los números ${s.nums.slice(0, opts.upto ?? s.nums.length).join(", ")}.`);
  return Object.assign(frame({ id, cap, easy, eq: s.nums.join(", ") + ", ?", svg: line(s, opts).replace('aria-label=""', `aria-label="${esc(alt.en)}"`), alt }), { meta: { step: s.step, ...meta } });
};

export function frames(s) {
  const size = fmt(Math.abs(s.step));
  const dir = s.step > 0 ? L("up", "sube") : L("down", "baja");
  return [
    mk(s, "points", L(`Put the numbers on a number line: ${s.nums.join(", ")}.`, `Pon los números en una recta numérica: ${s.nums.join(", ")}.`), L("The numbers on a line.", "Los números en una recta."), { upto: s.nums.length }),
    mk(s, "hops", L(`Look at the hops between them. Every hop ${dir.en === "up" ? "goes up" : "goes down"} by ${size}, the same each time.`, `Mira los saltos entre ellos. Cada salto ${dir.es} ${size}, igual cada vez.`), L(`Every hop is ${size}.`, `Cada salto es ${size}.`), { upto: s.nums.length, next: true }),
    mk(s, "next", L(`One more hop of ${size} from ${fmt(s.last)} lands on ${fmt(s.result)}.`, `Un salto más de ${size} desde ${fmt(s.last)} llega a ${fmt(s.result)}.`), L(`${fmt(s.last)} ${s.step > 0 ? "+" : "−"} ${size} = ${fmt(s.result)}.`, `${fmt(s.last)} ${s.step > 0 ? "+" : "−"} ${size} = ${fmt(s.result)}.`), { upto: s.nums.length, landed: s.result }, { result: s.result, from: s.last }),
  ];
}

export const answer = (s) => s.result;

export function predicts(s) {
  const size = fmt(Math.abs(s.step));
  const other = Math.abs(s.step) === 1 ? 2 : 1;
  return [
    {
      at: 2,
      q: L(`The hops so far are all ${size}. How big should the next hop be?`, `Los saltos hasta ahora miden ${size}. ¿De qué tamaño debe ser el siguiente salto?`),
      choices: [
        { t: L(`${size}, the same.`, `${size}, igual.`), ok: true, why: L("A pattern keeps the same hop size, so the next hop matches the others.", "Un patrón mantiene el tamaño del salto, así que el siguiente salto coincide con los demás.") },
        { t: L(`${other}, a different size.`, `${other}, de otro tamaño.`), ok: false, why: L(`The hops are ${size}, so a hop of ${other} would break the pattern.`, `Los saltos son de ${size}, así que un salto de ${other} rompería el patrón.`) },
      ],
      explain: [
        { t: L("Because a skip-count pattern adds the same amount every time.", "Porque un patrón de conteo salteado suma la misma cantidad cada vez."), ok: true },
        { t: L("Because the next number is always one more.", "Porque el siguiente número siempre es uno más."), ok: false },
      ],
    },
  ];
}

export function hints(s) {
  const list = frames(s);
  return [
    { text: L("Look at how far apart the numbers are. Is it always the same?", "Mira qué tan separados están los números. ¿Siempre es igual?") },
    { text: L("The line shows the numbers and the hops between them.", "La recta muestra los números y los saltos entre ellos."), frame: list[0] },
    { text: L("Find the size of one hop, then hop that far from the last number.", "Halla el tamaño de un salto y salta esa distancia desde el último número."), frame: list[0] },
  ];
}

export function diagnose(s, raw) {
  const v = num(raw);
  if (v === null || v === s.result) return null;
  if (Math.abs(s.step) !== 1 && v === s.last + (s.step > 0 ? 1 : -1)) return "countedByOnes";
  if (v === s.last - s.step) return "wrongWay";
  return null;
}
export const tags = {
  countedByOnes: { label: L("Counted by ones instead of by the pattern's hop", "Contó de uno en uno en lugar del salto del patrón"), tip: L("Check the size of the hops between the numbers, then use that size again.", "Revisa el tamaño de los saltos entre los números y usa ese tamaño otra vez.") },
  wrongWay: { label: L("Hopped the wrong way", "Saltó en la dirección contraria"), tip: L("The numbers are going the other way. Keep the same direction.", "Los números van en la otra dirección. Mantén la misma dirección.") },
};

const options = (s) => [...new Set([Math.abs(s.step), 1, 2, 5, 10].filter((v) => v > 0))].sort((a, b) => a - b);
export const build = {
  prompt: () => L("Make the next hop. Pick how big it should be.", "Haz el siguiente salto. Elige de qué tamaño debe ser."),
  init: () => ({ size: null }),
  render(st, s) {
    const landed = st.size === null ? null : s.last + Math.sign(s.step) * st.size;
    const alt = L("Number line with the pattern.", "Recta numérica con el patrón.");
    const done = st.size === Math.abs(s.step);
    return {
      svg: line(s, { next: st.size === null, landed }).replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
      alt,
      controls: options(s).map((v) => ({ id: "hop", arg: v, label: L(`Hop ${fmt(v)}`, `Saltar ${fmt(v)}`) })),
      status: done ? L(`Yes: ${fmt(s.last)} ${s.step > 0 ? "+" : "−"} ${fmt(Math.abs(s.step))} = ${fmt(s.result)}.`, `Sí: ${fmt(s.last)} ${s.step > 0 ? "+" : "−"} ${fmt(Math.abs(s.step))} = ${fmt(s.result)}.`) : null,
    };
  },
  act(st, id, arg, s) {
    const right = arg === Math.abs(s.step);
    return { state: { size: arg }, ok: right, msg: right ? null : L(`The hops between the numbers are ${fmt(Math.abs(s.step))}. A pattern keeps the same hop.`, `Los saltos entre los números son de ${fmt(Math.abs(s.step))}. Un patrón mantiene el mismo salto.`), tag: right ? null : "wrongHop" };
  },
  done: (st, s) => st.size === Math.abs(s.step),
};
