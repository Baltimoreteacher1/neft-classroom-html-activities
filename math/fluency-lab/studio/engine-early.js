// Early number sense: ten-frames for "how many more", counting and seeing small groups, repeating patterns,
// coins, clocks (a time later), a ruler, and even or odd. Every mode records what its picture shows (counts,
// minutes, units) in `meta`, and the tests recompute each answer with plain arithmetic.
import { COLORS, L, choiceBuild, clean, dotRows, frameOf, keyed, num, predictOf, svgWrap, txt } from "./core.js";

const SHAPES = { "▲": ["triangle", "triángulo"], "●": ["circle", "círculo"], "■": ["square", "cuadrado"] };
const name = (g) => L(SHAPES[g][0], SHAPES[g][1]);

export function parse(question, item) {
  const raw = String(question).replaceAll("−", "-").trim();
  const q = clean(question);
  let m = q.match(/^(\d+) \+ (?:\?|□)(?:\. What belongs in the box\?)? = (\d+)$/) || q.match(/^(\d+) \+ (?:\?|□) = (\d+)(?:\. What belongs in the box\?)?$/);
  if (m) {
    const [a, c] = [Number(m[1]), Number(m[2])];
    return c >= a && c <= 20 ? { engine: "early", mode: "tenframe", a, c, missing: c - a, result: c - a } : null;
  }
  m = raw.match(/^((?:[▲●■] )+[▲●■]) ___$/);
  if (m) {
    const seq = m[1].split(" ");
    for (let p = 1; p < seq.length; p += 1)
      if (seq.every((g, i) => g === seq[i % p])) return { engine: "early", mode: "pattern", seq, unit: seq.slice(0, p), next: seq[seq.length % p], result: SHAPES[seq[seq.length % p]][0] };
    return null;
  }
  m = q.match(/^What time is (\d+) minutes after (\d{1,2}):(\d{2})\?$/);
  if (m) {
    const [add, h, mi] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (h < 1 || h > 12 || mi > 59 || add > 300) return null;
    const total = ((h % 12) * 60 + mi + add) % 720;
    const rh = Math.floor(total / 60) || 12;
    return { engine: "early", mode: "time", h, mi, add, total, result: `${rh}:${String(total % 60).padStart(2, "0")}` };
  }
  m = q.match(/^A strip starts at (\d+) cm and ends at (\d+) cm on a ruler\. How long is the strip\?$/);
  if (m) {
    const [s, e] = [Number(m[1]), Number(m[2])];
    return e > s && e <= 30 ? { engine: "early", mode: "ruler", s, e, result: e - s } : null;
  }
  m = q.match(/^(\d+) quarters \+ (\d+) dimes \+ (\d+) nickels \+ (\d+) pennies = how many cents\?$/);
  if (m) {
    const [qn, d, n, p] = m.slice(1).map(Number);
    return { engine: "early", mode: "coins", counts: [qn, d, n, p], result: qn * 25 + d * 10 + n * 5 + p };
  }
  m = q.match(/^Is (\d+) even or odd\?$/);
  if (m) {
    const n = Number(m[1]);
    return { engine: "early", mode: "evenodd", n, digit: n % 10, result: n % 2 ? "odd" : "even" };
  }
  if (item && /(?:dots|counters|counter|ten-frame|quantity|layout)/i.test(q) && item.kind === "number") {
    const n = Number(item.displayAnswer);
    return Number.isInteger(n) && n >= 1 && n <= 20 ? { engine: "early", mode: "count", n, result: n } : null;
  }
  return null;
}

// ---- pictures ----
function frames10(a, added, c) {
  const cells = [];
  for (let i = 0; i < Math.ceil(c / 10) * 10; i += 1) cells.push(i < a ? 1 : i < a + added ? 2 : i < c ? 3 : 0);
  let out = "";
  const n = Math.ceil(c / 10);
  for (let f = 0; f < n; f += 1) {
    const x0 = 280 - (n * 220) / 2 + f * 220 + 20;
    for (let i = 0; i < 10; i += 1) {
      const k = f * 10 + i;
      const [cx, cy] = [x0 + (i % 5) * 40 + 20, 40 + Math.floor(i / 5) * 40 + 20];
      out += `<rect x="${cx - 20}" y="${cy - 20}" width="40" height="40" fill="#fff" stroke="${COLORS.ink}" stroke-width="2"/>`;
      if (cells[k] === 1 || cells[k] === 2) out += keyed(`t${k}`, cx, cy, `<circle r="15" fill="${cells[k] === 1 ? COLORS.whole : COLORS.part}"/>`);
      if (cells[k] === 3) out += `<circle cx="${cx}" cy="${cy}" r="15" fill="none" stroke="${COLORS.warn}" stroke-width="3" stroke-dasharray="5 4"/>`;
    }
  }
  return out;
}
const clockBody = (h, mi) => {
  const [cx, cy, R] = [280, 105, 85];
  let out = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#fff" stroke="${COLORS.ink}" stroke-width="4"/>`;
  for (let i = 1; i <= 12; i += 1) {
    const a = (i * Math.PI) / 6;
    out += txt(cx + Math.sin(a) * (R - 18), cy - Math.cos(a) * (R - 18) + 6, String(i), { size: 16 });
  }
  const ha = (((h % 12) + mi / 60) * Math.PI) / 6;
  const ma = (mi * Math.PI) / 30;
  out += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(ha) * 45}" y2="${cy - Math.cos(ha) * 45}" stroke="${COLORS.ink}" stroke-width="7" stroke-linecap="round"/>`;
  out += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(ma) * 68}" y2="${cy - Math.cos(ma) * 68}" stroke="${COLORS.whole}" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="5" fill="${COLORS.ink}"/>`;
  return out;
};
const clockAt = (s, minutes) => {
  const t = ((s.h % 12) * 60 + s.mi + minutes) % 720;
  return { h: Math.floor(t / 60) || 12, mi: t % 60 };
};
const pad = (h, mi) => `${h}:${String(mi).padStart(2, "0")}`;
const rulerBody = (s, upto = s.e) => {
  const X = (v) => 40 + (v / (s.e + 1)) * 480;
  let out = `<rect x="30" y="90" width="500" height="44" fill="#fef3c7" stroke="${COLORS.ink}" stroke-width="2"/>`;
  for (let v = 0; v <= s.e + 1; v += 1) out += `<line x1="${X(v)}" x2="${X(v)}" y1="90" y2="${v % 5 === 0 ? 118 : 108}" stroke="${COLORS.ink}" stroke-width="2"/>` + txt(X(v), 156, String(v), { size: 14, weight: 600 });
  out += `<rect x="${X(s.s)}" y="50" width="${X(upto) - X(s.s)}" height="30" fill="${COLORS.whole}" fill-opacity=".85"/>`;
  return out;
};
const coinBody = (counts, upto = 4) => {
  const kinds = [["25", COLORS.hundreds], ["10", COLORS.whole], ["5", COLORS.warn], ["1", COLORS.part]];
  let out = "";
  kinds.forEach(([v, color], k) => {
    if (k >= upto) return;
    for (let i = 0; i < counts[k]; i += 1) out += keyed(`c${k}-${i}`, 60 + (i % 8) * 54, 40 + k * 56, `<circle r="22" fill="${color}" stroke="#fff" stroke-width="3"/>${txt(0, 6, v, { size: 16, fill: "#fff" })}`);
  });
  return out;
};

// ---- frames ----
export function frames(s) {
  const A = (en, es) => L(en, es);
  if (s.mode === "tenframe") {
    const { a, c, missing } = s;
    const alt = (k) => A(`Ten-frame with ${a} counters and ${k} more, aiming for ${c}.`, `Marco de diez con ${a} fichas y ${k} más, hasta ${c}.`);
    const h = 140 + (c > 10 ? 0 : 0);
    return [
      frameOf({ id: "start", cap: A(`Start with ${a} counters.`, `Empieza con ${a} fichas.`), easy: A(`${a} counters.`, `${a} fichas.`), eq: `${a} + ? = ${c}`, body: frames10(a, 0, a), alt: alt(0), meta: { a, added: 0 }, h }),
      frameOf({ id: "target", cap: A(`We want ${c} in all. The dotted circles show the spaces still to fill.`, `Queremos ${c} en total. Los círculos punteados son los espacios que faltan.`), easy: A(`Fill up to ${c}.`, `Llena hasta ${c}.`), eq: `${a} + ? = ${c}`, body: frames10(a, 0, c), alt: alt(0), meta: { a, added: 0, c }, h }),
      frameOf({ id: "fill", cap: A(`Add ${missing} more to reach ${c}: ${a} + ${missing} = ${c}.`, `Agrega ${missing} más para llegar a ${c}: ${a} + ${missing} = ${c}.`), easy: A(`${a} + ${missing} = ${c}.`, `${a} + ${missing} = ${c}.`), eq: `${a} + ${missing} = ${c}`, body: frames10(a, missing, c), alt: alt(missing), meta: { a, added: missing, c }, h }),
    ];
  }
  if (s.mode === "count") {
    const per = s.n > 10 ? 10 : 5;
    const d = dotRows(s.n, { per });
    const g = dotRows(s.n, { per, fill: COLORS.part });
    const alt = A(`${s.n} dots.`, `${s.n} puntos.`);
    return [
      frameOf({ id: "see", cap: A("Here are the dots. Count each one once.", "Aquí están los puntos. Cuenta cada uno una vez."), easy: A("Count each dot.", "Cuenta cada punto."), eq: "?", body: d.body, alt, meta: { n: s.n }, h: d.h }),
      frameOf({ id: "group", cap: A(`Dots in rows of ${per} are easy to count: ${s.n} in all.`, `Los puntos en filas de ${per} son fáciles de contar: ${s.n} en total.`), easy: A(`${s.n} dots.`, `${s.n} puntos.`), eq: `${s.n}`, body: g.body, alt, meta: { n: s.n, rows: Math.ceil(s.n / per), per }, h: g.h }),
    ];
  }
  if (s.mode === "pattern") {
    const w = 440 / (s.seq.length + 1);
    const row = (upto, hi) => {
      let out = "";
      for (let i = 0; i <= s.seq.length; i += 1) {
        const x = 70 + i * w + w / 2;
        const g = i < s.seq.length ? s.seq[i] : s.next;
        if (i === s.seq.length && upto <= s.seq.length) out += txt(x, 130, "?", { size: 42, fill: COLORS.warn });
        else out += txt(x, 130, g, { size: 40, fill: i < s.unit.length && hi ? COLORS.whole : COLORS.ink });
      }
      if (hi) out += `<rect x="${70 + 4}" y="80" width="${s.unit.length * w - 8}" height="70" rx="12" fill="none" stroke="${COLORS.warn}" stroke-width="4"/>`;
      return out;
    };
    const alt = A(`A pattern: ${s.seq.join(" ")}.`, `Un patrón: ${s.seq.join(" ")}.`);
    return [
      frameOf({ id: "look", cap: A("Look at the pattern. Which part keeps repeating?", "Mira el patrón. ¿Qué parte se repite?"), easy: A("Find what repeats.", "Halla lo que se repite."), eq: s.seq.join(" "), body: row(s.seq.length, false), alt, meta: { unit: s.unit }, h: 200 }),
      frameOf({ id: "unit", cap: A(`The part that repeats is ${s.unit.join(" ")}.`, `La parte que se repite es ${s.unit.join(" ")}.`), easy: A("This part repeats.", "Esta parte se repite."), eq: s.unit.join(" "), body: row(s.seq.length, true), alt, meta: { unit: s.unit }, h: 200 }),
      frameOf({ id: "next", cap: A(`The pattern continues with ${s.next}, a ${name(s.next).en}.`, `El patrón sigue con ${s.next}, un ${name(s.next).es}.`), easy: A(`Next: ${name(s.next).en}.`, `Sigue: ${name(s.next).es}.`), eq: `${s.next}`, body: row(s.seq.length + 1, true), alt, meta: { unit: s.unit, next: s.next, length: s.seq.length }, h: 200 }),
    ];
  }
  if (s.mode === "time") {
    const end = clockAt(s, s.add);
    const hours = Math.floor(s.add / 60);
    const rest = s.add % 60;
    const mid = clockAt(s, hours * 60);
    const alt = (h, mi) => A(`A clock showing ${pad(h, mi)}.`, `Un reloj que marca ${pad(h, mi)}.`);
    const out = [frameOf({ id: "start", cap: A(`The clock shows ${pad(s.h, s.mi)}.`, `El reloj marca ${pad(s.h, s.mi)}.`), easy: A(`Start: ${pad(s.h, s.mi)}.`, `Inicio: ${pad(s.h, s.mi)}.`), eq: `${pad(s.h, s.mi)} + ${s.add} min`, body: clockBody(s.h, s.mi), alt: alt(s.h, s.mi), meta: { minutes: (s.h % 12) * 60 + s.mi }, h: 215 })];
    if (hours > 0 && rest > 0) out.push(frameOf({ id: "hours", cap: A(`${s.add} minutes is ${hours} hour${hours > 1 ? "s" : ""} and ${rest} minutes. First add the hour${hours > 1 ? "s" : ""}: ${pad(mid.h, mid.mi)}.`, `${s.add} minutos son ${hours} hora${hours > 1 ? "s" : ""} y ${rest} minutos. Primero suma la${hours > 1 ? "s" : ""} hora${hours > 1 ? "s" : ""}: ${pad(mid.h, mid.mi)}.`), easy: A(`+${hours * 60} min: ${pad(mid.h, mid.mi)}.`, `+${hours * 60} min: ${pad(mid.h, mid.mi)}.`), eq: `${pad(s.h, s.mi)} + ${hours * 60} min`, body: clockBody(mid.h, mid.mi), alt: alt(mid.h, mid.mi), meta: { minutes: s.total - rest }, h: 215 }));
    out.push(frameOf({ id: "done", cap: A(`${rest > 0 || hours === 0 ? `Add ${hours > 0 ? rest : s.add} more minutes: ` : "The hour hand moves ahead: "}the clock shows ${pad(end.h, end.mi)}.`, `${rest > 0 || hours === 0 ? `Suma ${hours > 0 ? rest : s.add} minutos más: ` : "La manecilla de las horas avanza: "}el reloj marca ${pad(end.h, end.mi)}.`), easy: A(`${pad(end.h, end.mi)}.`, `${pad(end.h, end.mi)}.`), eq: `${pad(s.h, s.mi)} + ${s.add} min = ${pad(end.h, end.mi)}`, body: clockBody(end.h, end.mi), alt: alt(end.h, end.mi), meta: { minutes: s.total, result: s.result }, h: 215 }));
    return out;
  }
  if (s.mode === "ruler") {
    const alt = A(`A ruler with a strip from ${s.s} to ${s.e} centimetres.`, `Una regla con una tira de ${s.s} a ${s.e} centímetros.`);
    return [
      frameOf({ id: "ruler", cap: A(`The strip starts at ${s.s} cm and ends at ${s.e} cm.`, `La tira empieza en ${s.s} cm y termina en ${s.e} cm.`), easy: A(`From ${s.s} to ${s.e}.`, `De ${s.s} a ${s.e}.`), eq: `${s.s} → ${s.e}`, body: rulerBody(s), alt, meta: { s: s.s, e: s.e }, h: 190 }),
      frameOf({ id: "count", cap: A(`Length is how many units the strip covers, not the number where it ends. Count the units from ${s.s} to ${s.e}.`, `La longitud es cuántas unidades cubre la tira, no el número donde termina. Cuenta las unidades de ${s.s} a ${s.e}.`), easy: A("Count the units covered.", "Cuenta las unidades cubiertas."), eq: `${s.e} − ${s.s}`, body: rulerBody(s), alt, meta: { s: s.s, e: s.e }, h: 190 }),
      frameOf({ id: "length", cap: A(`${s.e} − ${s.s} = ${s.result}, so the strip is ${s.result} cm long.`, `${s.e} − ${s.s} = ${s.result}, así que la tira mide ${s.result} cm.`), easy: A(`${s.result} cm.`, `${s.result} cm.`), eq: `${s.e} − ${s.s} = ${s.result}`, body: rulerBody(s), alt, meta: { s: s.s, e: s.e, length: s.result }, h: 190 }),
    ];
  }
  if (s.mode === "coins") {
    const names = [L("quarters", "monedas de 25"), L("dimes", "monedas de 10"), L("nickels", "monedas de 5"), L("pennies", "monedas de 1")];
    const vals = [25, 10, 5, 1];
    const out = [];
    let run = 0;
    s.counts.forEach((cnt, k) => {
      if (!cnt) return;
      run += cnt * vals[k];
      out.push(frameOf({ id: `k${k}`, cap: A(`${cnt} ${names[k].en}: ${cnt} × ${vals[k]} = ${cnt * vals[k]}. Running total: ${run}.`, `${cnt} ${names[k].es}: ${cnt} × ${vals[k]} = ${cnt * vals[k]}. Total hasta ahora: ${run}.`), easy: A(`Total so far: ${run}.`, `Total hasta ahora: ${run}.`), eq: `${run}¢`, body: coinBody(s.counts, k + 1), alt: A(`Coins so far, worth ${run} cents.`, `Monedas hasta ahora, valen ${run} centavos.`), meta: { total: run }, h: 40 + 4 * 56 + 10 }));
    });
    if (!out.length) out.push(frameOf({ id: "none", cap: A("No coins, so the total is 0.", "Sin monedas, el total es 0."), eq: "0¢", body: "", alt: A("No coins.", "Sin monedas."), meta: { total: 0 }, h: 120 }));
    out.push(frameOf({ id: "total", cap: A(`All together: ${s.result} cents.`, `En total: ${s.result} centavos.`), easy: A(`${s.result} cents.`, `${s.result} centavos.`), eq: `${s.result}¢`, body: coinBody(s.counts), alt: A(`All the coins, worth ${s.result} cents.`, `Todas las monedas, valen ${s.result} centavos.`), meta: { total: s.result }, h: 40 + 4 * 56 + 10 }));
    return out;
  }
  if (s.mode === "evenodd") {
    const pairs = Math.floor(s.digit / 2);
    const left = s.digit % 2;
    const body = (show) => {
      let out = txt(280, 50, String(s.n), { size: 34 });
      if (show >= 1) out += `<rect x="${280 + (String(s.n).length * 10.5) - 24}" y="20" width="28" height="42" rx="6" fill="none" stroke="${COLORS.warn}" stroke-width="3"/>`;
      if (show >= 2) for (let i = 0; i < s.digit; i += 1) out += keyed(`o${i}`, 180 + Math.floor(i / 2) * 60 + (i % 2) * 24 + (Math.floor(i / 2) > 0 ? 0 : 0), 110, `<circle r="10" fill="${i < pairs * 2 ? COLORS.whole : COLORS.warn}"/>`);
      return out;
    };
    const alt = A(`The number ${s.n}, with its ones digit ${s.digit} shown as dots.`, `El número ${s.n}, con su dígito de las unidades ${s.digit} como puntos.`);
    return [
      frameOf({ id: "number", cap: A(`Is ${s.n} even or odd? Only the ones digit decides.`, `¿${s.n} es par o impar? Solo decide el dígito de las unidades.`), easy: A("Look at the ones digit.", "Mira el dígito de las unidades."), eq: String(s.n), body: body(0), alt, meta: { digit: s.digit }, h: 160 }),
      frameOf({ id: "digit", cap: A(`The ones digit is ${s.digit}.`, `El dígito de las unidades es ${s.digit}.`), easy: A(`Ones digit: ${s.digit}.`, `Unidades: ${s.digit}.`), eq: String(s.n), body: body(1), alt, meta: { digit: s.digit }, h: 160 }),
      frameOf({ id: "pairs", cap: left ? A(`${s.digit} dots make ${pairs} pair${pairs === 1 ? "" : "s"} and 1 left over, so ${s.n} is odd.`, `${s.digit} puntos hacen ${pairs} pareja${pairs === 1 ? "" : "s"} y sobra 1, así que ${s.n} es impar.`) : A(`${s.digit} dots make ${pairs} pair${pairs === 1 ? "" : "s"} with none left over, so ${s.n} is even.`, `${s.digit} puntos hacen ${pairs} pareja${pairs === 1 ? "" : "s"} sin sobrantes, así que ${s.n} es par.`), easy: A(`${s.n} is ${s.result}.`, `${s.n} es ${s.result === "odd" ? "impar" : "par"}.`), eq: `${s.n} is ${s.result}`, body: body(2), alt, meta: { digit: s.digit, pairs, left }, h: 160 }),
    ];
  }
  return [];
}

export const answer = (s) => s.result;

// ---- predictions ----
export function predicts(s) {
  const yes = (why) => ({ right: why[0], wrong: why[1] });
  if (s.mode === "tenframe")
    return [predictOf(2, A2("We need a bigger total. What does the question ask us to find?", "Necesitamos un total mayor. ¿Qué nos pide hallar la pregunta?"), A2("How many more to add.", "Cuántas más hay que agregar."), A2("The total, all over again.", "El total, otra vez."), yes([A2("The total is given. The missing part is how many to add to what we have.", "El total ya está dado. La parte que falta es cuántas agregar a lo que tenemos."), A2("The total is already in the question. The unknown is the part still missing.", "El total ya está en la pregunta. Lo desconocido es la parte que falta.")]), A2("Because we know the whole and one part, and we want the other part.", "Porque conocemos el todo y una parte, y queremos la otra parte."), A2("Because the answer is always the biggest number.", "Porque la respuesta siempre es el número mayor."))];
  if (s.mode === "pattern")
    return [predictOf(2, A2("After the pattern repeats once more, which part comes next?", "Después de repetir el patrón una vez más, ¿qué parte sigue?"), A2("The start of the repeating part again.", "El comienzo de la parte que se repite otra vez."), A2("Something new.", "Algo nuevo."), yes([A2("A pattern repeats, so it starts the repeating part over.", "Un patrón se repite, así que vuelve a empezar la parte repetida."), A2("A pattern keeps repeating; nothing new appears.", "Un patrón sigue repitiéndose; no aparece nada nuevo.")]), A2("Because the same part repeats again and again.", "Porque la misma parte se repite una y otra vez."), A2("Because patterns change every time.", "Porque los patrones cambian cada vez."))];
  if (s.mode === "ruler")
    return [predictOf(2, A2("To find how long the strip is, do we read the number at its end?", "Para hallar cuánto mide la tira, ¿leemos el número de su final?"), A2("No. We count the units it covers.", "No. Contamos las unidades que cubre."), A2("Yes. That number is the length.", "Sí. Ese número es la longitud."), yes([A2("The strip starts at 1 or more, so the end number is the position, not the length.", "La tira empieza en 1 o más, así que el número final es la posición, no la longitud."), A2("The end number includes the part of the ruler before the strip starts.", "El número final incluye la parte de la regla antes de que empiece la tira.")]), A2("Because length is how far the strip stretches from its start to its end.", "Porque la longitud es cuánto se extiende la tira de su inicio a su final."), A2("Because the ruler always starts at the strip's left edge.", "Porque la regla siempre empieza en el borde izquierdo de la tira."))];
  if (s.mode === "evenodd")
    return [predictOf(2, A2("Does the whole number decide even or odd, or only its ones digit?", "¿El número completo decide si es par o impar, o solo su dígito de las unidades?"), A2("Only the ones digit.", "Solo el dígito de las unidades."), A2("Every digit.", "Todos los dígitos."), yes([A2("Tens, hundreds and higher places are always made of pairs of ones-groups of 10, so they never leave one over.", "Las decenas, centenas y más siempre se forman con grupos de 10, así que nunca sobra uno."), A2("Bigger places are multiples of 10, which are always even, so they do not change the answer.", "Los lugares mayores son múltiplos de 10, siempre pares, así que no cambian la respuesta.")]), A2("Because every place above the ones is a multiple of 10, and 10 is even.", "Porque todo lugar sobre las unidades es múltiplo de 10, y 10 es par."), A2("Because the first digit always decides.", "Porque el primer dígito siempre decide."))];
  return [];
}
function A2(en, es) {
  return L(en, es);
}

// ---- hints (three rungs; pictures never state the answer) ----
export function hints(s) {
  const list = frames(s);
  const first = list[0];
  const t = {
    tenframe: [A2("The total is given. Think: how many more do we need to reach it?", "El total está dado. Piensa: ¿cuántas más necesitamos para llegar?"), A2("The frame shows what we have and the spaces still empty.", "El marco muestra lo que tenemos y los espacios vacíos."), A2("Count on from what we have up to the total.", "Cuenta hacia adelante desde lo que tenemos hasta el total.")],
    count: [A2("Touch each dot once as you count.", "Toca cada punto una vez al contar."), A2("The dots are shown so you can count them.", "Los puntos se muestran para que los cuentes."), A2("Count the dots in groups to make it quicker.", "Cuenta los puntos en grupos para ir más rápido.")],
    pattern: [A2("Find the part that repeats.", "Halla la parte que se repite."), A2("The picture shows the pattern so far.", "El dibujo muestra el patrón hasta ahora."), A2("Say the repeating part over, then see where the pattern stops.", "Di la parte que se repite y mira dónde se detiene el patrón.")],
    time: [A2("Split the minutes into hours and leftover minutes.", "Separa los minutos en horas y minutos sobrantes."), A2("The clock shows the starting time.", "El reloj muestra la hora de inicio."), A2("Move the hands forward: whole hours first, then the extra minutes.", "Mueve las manecillas: primero las horas completas y luego los minutos extra.")],
    ruler: [A2("Length is how much of the ruler the strip covers.", "La longitud es cuánto de la regla cubre la tira."), A2("The ruler shows where the strip starts and ends.", "La regla muestra dónde empieza y termina la tira."), A2("Count the units between the start and the end.", "Cuenta las unidades entre el inicio y el final.")],
    coins: [A2("Each kind of coin has its own value. Add one kind at a time.", "Cada tipo de moneda tiene su valor. Suma un tipo a la vez."), A2("The coins are shown by kind.", "Las monedas se muestran por tipo."), A2("Find the value of each group, then add the groups.", "Halla el valor de cada grupo y luego suma los grupos.")],
    evenodd: [A2("Only one digit decides even or odd.", "Solo un dígito decide si es par o impar."), A2("The number is shown with its digits.", "El número se muestra con sus dígitos."), A2("Look at the ones digit and try to share it into pairs.", "Mira el dígito de las unidades y trata de repartirlo en parejas.")],
  }[s.mode];
  // Pictures that already show the answer are replaced by the opening picture, which does not.
  const safe = s.mode === "pattern" ? list[0] : s.mode === "ruler" || s.mode === "evenodd" || s.mode === "time" ? list[0] : first;
  return [{ text: t[0] }, { text: t[1], frame: safe }, { text: t[2], frame: safe }];
}

// ---- named slips ----
export function diagnose(s, raw) {
  const v = num(raw);
  const w = String(raw).trim().toLowerCase();
  if (s.mode === "tenframe" && v !== null && v !== s.result) return v === s.a + s.c ? "addedBoth" : v === s.c ? "gaveTotal" : null;
  if (s.mode === "ruler" && v === s.e) return "readEnd";
  if (s.mode === "coins" && v === s.counts.reduce((a, b) => a + b, 0) && v !== s.result) return "countedCoins";
  if (s.mode === "pattern" && w === SHAPES[s.seq.at(-1)][0] && w !== s.result) return "copiedLast";
  if (s.mode === "evenodd" && (w === "odd" || w === "even") && w !== s.result) return Math.floor(s.n / 10) % 2 === (s.result === "odd" ? 0 : 1) ? "usedWrongDigit" : null;
  return null;
}
export const tags = {
  addedBoth: { label: L("Added the two numbers in the question", "Sumó los dos números de la pregunta"), tip: L("The total is already given. Ask how many more to add to the first number.", "El total ya está dado. Pregunta cuántas más se suman al primer número.") },
  gaveTotal: { label: L("Gave the total instead of the missing part", "Dio el total en lugar de la parte que falta"), tip: L("The total is in the question. The answer is how many more are needed.", "El total está en la pregunta. La respuesta es cuántas más se necesitan.") },
  readEnd: { label: L("Read the number at the end of the strip", "Leyó el número al final de la tira"), tip: L("Length counts the units the strip covers, from where it starts.", "La longitud cuenta las unidades que cubre la tira, desde donde empieza.") },
  countedCoins: { label: L("Counted the coins instead of adding their values", "Contó las monedas en lugar de sumar sus valores"), tip: L("Each kind of coin is worth a different amount. Add the values.", "Cada tipo de moneda vale distinto. Suma los valores.") },
  copiedLast: { label: L("Repeated the last shape", "Repitió la última forma"), tip: L("Find the part that repeats, then continue it from the start of that part.", "Halla la parte que se repite y continúala desde el inicio de esa parte.") },
  usedWrongDigit: { label: L("Looked at a digit other than the ones digit", "Miró un dígito que no es el de las unidades"), tip: L("Only the ones digit decides whether a number is even or odd.", "Solo el dígito de las unidades decide si un número es par o impar.") },
};

// ---- Build ----
const buildTenframe = {
  prompt: (s) => L(`Add counters until there are ${s.c} in all.`, `Agrega fichas hasta tener ${s.c} en total.`),
  init: () => ({ added: 0 }),
  render(st, s) {
    const alt = L(`${s.a + st.added} of ${s.c} counters.`, `${s.a + st.added} de ${s.c} fichas.`);
    return { svg: svgWrap(frames10(s.a, st.added, s.c), alt.en, { h: 140 }), alt, controls: [{ id: "add", arg: 1, label: L("Add a counter", "Agregar una ficha") }, { id: "add", arg: -1, label: L("Take one away", "Quitar una") }], status: s.a + st.added === s.c ? L(`${s.a} + ${st.added} = ${s.c}. You added ${st.added}.`, `${s.a} + ${st.added} = ${s.c}. Agregaste ${st.added}.`) : L(`${s.a} + ${st.added} = ${s.a + st.added} so far.`, `${s.a} + ${st.added} = ${s.a + st.added} hasta ahora.`) };
  },
  act(st, id, arg, s) {
    const v = st.added + arg;
    if (v < 0 || s.a + v > s.c) return { state: st, ok: false, msg: v < 0 ? L("There is nothing to take away.", "No hay nada que quitar.") : L(`That is more than ${s.c}. We only want ${s.c}.`, `Eso pasa de ${s.c}. Solo queremos ${s.c}.`) };
    return { state: { added: v }, ok: true };
  },
  done: (st, s) => s.a + st.added === s.c,
};
const buildPattern = choiceBuild({
  prompt: () => L("Which shape comes next?", "¿Qué forma sigue?"),
  options: (s) => Object.keys(SHAPES).map((g) => ({ label: L(`${g} ${SHAPES[g][0]}`, `${g} ${SHAPES[g][1]}`), ok: g === s.next, msg: L(`Say the repeating part: ${s.unit.join(" ")}. Where does the pattern stop?`, `Di la parte que se repite: ${s.unit.join(" ")}. ¿Dónde se detiene el patrón?`) })),
  draw: (s, pick) => ({ body: frames({ ...s }).at(pick !== null && Object.keys(SHAPES)[pick] === s.next ? 2 : 1).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L(`A pattern: ${s.seq.join(" ")}.`, `Un patrón: ${s.seq.join(" ")}.`), h: 200 }),
  doneMsg: (s) => L(`Yes: the pattern continues with ${name(s.next).en}.`, `Sí: el patrón sigue con ${name(s.next).es}.`),
});
const buildEvenOdd = choiceBuild({
  prompt: (s) => L(`Is ${s.n} even or odd?`, `¿${s.n} es par o impar?`),
  options: (s) => ["even", "odd"].map((w) => ({ label: L(w, w === "odd" ? "impar" : "par"), ok: w === s.result, msg: L("Look at the ones digit and try to make pairs.", "Mira el dígito de las unidades y trata de hacer parejas.") })),
  draw: (s, pick) => ({ body: frames(s).at(pick !== null ? 2 : 1).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L(`The number ${s.n}.`, `El número ${s.n}.`), h: 160 }),
  doneMsg: (s) => L(`Yes: ${s.n} is ${s.result}.`, `Sí: ${s.n} es ${s.result === "odd" ? "impar" : "par"}.`),
});
const buildTime = {
  prompt: (s) => L(`Move the clock ahead ${s.add} minutes using the buttons.`, `Mueve el reloj ${s.add} minutos con los botones.`),
  init: () => ({ spent: 0 }),
  render(st, s) {
    const t = clockAt(s, st.spent);
    const alt = L(`A clock showing ${pad(t.h, t.mi)}.`, `Un reloj que marca ${pad(t.h, t.mi)}.`);
    const steps = [60, 30, 10, 5, 1].filter((v) => v <= s.add);
    return { svg: svgWrap(clockBody(t.h, t.mi), alt.en, { h: 215 }), alt, controls: [...steps.map((v) => ({ id: "add", arg: v, label: L(`+${v} min`, `+${v} min`) })), { id: "reset", arg: 0, label: L("Start over", "Empezar de nuevo") }], status: st.spent === s.add ? L(`${s.add} minutes later it is ${pad(t.h, t.mi)}.`, `${s.add} minutos después son las ${pad(t.h, t.mi)}.`) : L(`${st.spent} of ${s.add} minutes so far.`, `${st.spent} de ${s.add} minutos hasta ahora.`) };
  },
  act(st, id, arg, s) {
    if (id === "reset") return { state: { spent: 0 }, ok: true };
    return st.spent + arg > s.add ? { state: st, ok: false, msg: L(`That is more than ${s.add} minutes.`, `Eso pasa de ${s.add} minutos.`) } : { state: { spent: st.spent + arg }, ok: true };
  },
  done: (st, s) => st.spent === s.add,
};
const buildRuler = {
  prompt: (s) => L(`Count the units from ${s.s} to ${s.e}, one at a time.`, `Cuenta las unidades de ${s.s} a ${s.e}, una a la vez.`),
  init: () => ({ n: 0 }),
  render(st, s) {
    const alt = L(`The strip covers ${st.n} units.`, `La tira cubre ${st.n} unidades.`);
    return { svg: svgWrap(rulerBody(s, s.s + st.n), alt.en, { h: 190 }), alt, controls: [{ id: "n", arg: 1, label: L("Count one more unit", "Contar una unidad más") }, { id: "n", arg: -1, label: L("Back one", "Una atrás") }], status: st.n === s.result ? L(`${st.n} units, so the strip is ${st.n} cm long.`, `${st.n} unidades, así que la tira mide ${st.n} cm.`) : L(`Counted ${st.n} so far.`, `Contadas ${st.n} hasta ahora.`) };
  },
  act(st, id, arg, s) {
    const v = st.n + arg;
    return v < 0 || s.s + v > s.e ? { state: st, ok: false, msg: L("The strip stops there.", "La tira se detiene ahí.") } : { state: { n: v }, ok: true };
  },
  done: (st, s) => st.n === s.result,
};
const buildCoins = {
  prompt: () => L("Add each coin to the total. Match the coins in the question.", "Agrega cada moneda al total. Iguala las monedas de la pregunta."),
  init: () => ({ got: [0, 0, 0, 0] }),
  render(st, s) {
    const total = st.got[0] * 25 + st.got[1] * 10 + st.got[2] * 5 + st.got[3];
    const alt = L(`Coins worth ${total} cents.`, `Monedas que valen ${total} centavos.`);
    const labels = [L("Add a quarter (25)", "Agregar moneda de 25"), L("Add a dime (10)", "Agregar moneda de 10"), L("Add a nickel (5)", "Agregar moneda de 5"), L("Add a penny (1)", "Agregar moneda de 1")];
    return { svg: svgWrap(coinBody(st.got) + txt(470, 120, `${total}¢`, { size: 34 }), alt.en, { h: 40 + 4 * 56 + 10 }), alt, controls: labels.map((label, k) => ({ id: "coin", arg: k, label })), status: this.done(st, s) ? L(`${s.result} cents in all.`, `${s.result} centavos en total.`) : L(`${total} cents so far.`, `${total} centavos hasta ahora.`) };
  },
  act(st, id, k, s) {
    if (st.got[k] >= s.counts[k]) return { state: st, ok: false, msg: L("The question has no more of those coins.", "La pregunta no tiene más de esas monedas.") };
    const got = [...st.got];
    got[k] += 1;
    return { state: { got }, ok: true };
  },
  done: (st, s) => st.got.every((v, k) => v === s.counts[k]),
};
const buildCount = {
  prompt: () => L("Tap to count each dot once.", "Toca para contar cada punto una vez."),
  init: () => ({ n: 0 }),
  render(st, s) {
    const per = s.n > 10 ? 10 : 5;
    const d = dotRows(s.n, { per, filled: st.n });
    const alt = L(`${st.n} of ${s.n} dots counted.`, `${st.n} de ${s.n} puntos contados.`);
    return { svg: svgWrap(d.body + txt(280, d.h + 20, String(st.n), { size: 34 }), alt.en, { h: d.h + 50 }), alt, controls: [{ id: "n", arg: 1, label: L("Count the next dot", "Contar el siguiente punto") }, { id: "n", arg: -1, label: L("Uncount one", "Quitar uno") }], status: st.n === s.n ? L(`You counted ${s.n}. The last number you say is how many.`, `Contaste ${s.n}. El último número que dices es cuántos hay.`) : null };
  },
  act(st, id, arg, s) {
    const v = st.n + arg;
    return v < 0 || v > s.n ? { state: st, ok: false, msg: L("That is all the dots.", "Esos son todos los puntos.") } : { state: { n: v }, ok: true };
  },
  done: (st, s) => st.n === s.n,
};
const BUILDS = { tenframe: buildTenframe, pattern: buildPattern, evenodd: buildEvenOdd, time: buildTime, ruler: buildRuler, coins: buildCoins, count: buildCount };
export const build = {
  available: (s) => Boolean(BUILDS[s.mode]),
  prompt: (s) => BUILDS[s.mode].prompt(s),
  init: (s) => BUILDS[s.mode].init(s),
  render: (st, s, x) => BUILDS[s.mode].render(st, s, x),
  act: (st, id, arg, s) => BUILDS[s.mode].act(st, id, arg, s),
  done: (st, s) => BUILDS[s.mode].done(st, s),
};
