// Decimals and division: multiplying and dividing decimals by shifting to whole numbers, powers of ten as a
// moving decimal point, standard-algorithm long division (DMSB: Divide, Multiply, Subtract, Bring Down), dividing fractions by counting equal pieces, and
// unit-fraction word problems. All the arithmetic is done on whole numbers, so every frame can be recomputed.
import { COLORS, L, choiceBuild, clean, frameOf, gcd, num, predictOf, svgWrap, txt } from "./core.js";

const A = (en, es) => L(en, es);
const places = (t) => (String(t).split(".")[1] || "").length;
const whole = (t) => Number(String(t).replace(".", ""));
const dec = (n) => String(Math.round(n * 1e9) / 1e9);
const comma = (n) => n.toLocaleString("en-US");

export function parse(question) {
  const raw = String(question).replaceAll("−", "-").trim();
  const q = clean(question);
  let m = q.match(/^(\d+(?:\.\d+)?) × (\d+(?:\.\d+)?) = \?$/);
  if (m && (m[1].includes(".") || m[2].includes("."))) {
    const [pa, pb] = [places(m[1]), places(m[2])];
    const [Aw, Bw] = [whole(m[1]), whole(m[2])];
    return { engine: "decimal", mode: "mul", a: m[1], b: m[2], pa, pb, Aw, Bw, P: Aw * Bw, scale: pa + pb, result: (Aw * Bw) / 10 ** (pa + pb) };
  }
  m = q.match(/^(\d+(?:\.\d+)?) ÷ (\d+(?:\.\d+)?) = \?$/);
  if (m && (m[1].includes(".") || m[2].includes("."))) {
    const [da, db] = [places(m[1]), places(m[2])];
    // Shift both numbers by 10^db so the divisor is whole; if the dividend still has decimals (da > db), write it
    // as a whole number too and put that many places back in the answer.
    const extra = Math.max(0, da - db);
    const A2 = whole(m[1]) * 10 ** Math.max(0, db - da);
    const B = whole(m[2]);
    if (B === 0 || A2 % B !== 0) return null;
    return { engine: "decimal", mode: "div", a: m[1], b: m[2], da, db, A2, B, Q2: A2 / B, extra, result: A2 / B / 10 ** extra };
  }
  m = q.match(/^(\d+(?:\.\d+)?) × 10\^(-?\d+) = \?$/);
  if (m) {
    const e = Number(m[2]);
    const digits = m[1].replace(".", "");
    const point = m[1].includes(".") ? m[1].indexOf(".") : m[1].length;
    const newPoint = point + e;
    let text;
    if (newPoint <= 0) text = `0.${"0".repeat(-newPoint)}${digits}`;
    else if (newPoint >= digits.length) text = digits + "0".repeat(newPoint - digits.length);
    else text = `${digits.slice(0, newPoint)}.${digits.slice(newPoint)}`;
    const result = Number(text);
    return Math.abs(e) <= 8 && /^\d/.test(m[1]) ? { engine: "decimal", mode: "pow10", a: m[1], e, digits, point, newPoint, text, result } : null;
  }
  m = q.match(/^([\d]+) ÷ ([\d]+) = \?$/);
  if (m) {
    const [n, d] = [Number(m[1]), Number(m[2])];
    if (d < 2 || d > 99 || n > 99999 || n % d !== 0 || (d <= 12 && n / d <= 12)) return null;
    const chunks = [];
    let rem = n;
    while (rem > 0 && chunks.length < 6) {
      let k = 0;
      while (d * 10 ** (k + 1) <= rem) k += 1;
      let c = 9;
      while (d * c * 10 ** k > rem) c -= 1;
      const piece = c * 10 ** k;
      chunks.push({ piece, take: d * piece, before: rem, after: rem - d * piece });
      rem -= d * piece;
    }
    return rem === 0 ? { engine: "decimal", mode: "long", n, d, chunks, result: n / d } : null;
  }
  m = q.match(/^(\d+)\/(\d+) ÷ (\d+)\/(\d+) = \?$/);
  if (m) {
    const [a, b, c, d] = m.slice(1).map(Number);
    if (![a, b, c, d].every((v) => v > 0) || b * d > 400) return null;
    const num2 = a * d;
    const den2 = b * c;
    const g = gcd(num2, den2) || 1;
    return { engine: "decimal", mode: "fdiv", a, b, c, d, ad: num2, bc: den2, bd: b * d, rn: num2 / g, rd: den2 / g, result: den2 / g === 1 ? String(num2 / g) : `${num2 / g}/${den2 / g}` };
  }
  m = raw.match(/^A ribbon that is (\d+)\/(\d+) meter long is shared equally by (\d+) students\./);
  if (m) {
    const [a, b, w] = m.slice(1).map(Number);
    return a === 1 && b * w <= 60 ? { engine: "decimal", mode: "unitshare", b, w, result: `1/${b * w}` } : null;
  }
  m = raw.match(/^A jug holds (\d+) liters\. How many 1\/(\d+)-liter servings can it fill\?$/);
  if (m) {
    const [w, d] = [Number(m[1]), Number(m[2])];
    return w <= 12 && d <= 12 ? { engine: "decimal", mode: "unitcount", w, d, result: w * d } : null;
  }
  return null;
}

const tag = (x, y, t, size = 22, fill = COLORS.ink, anchor = "middle") => txt(x, y, t, { size, fill, anchor });

export function frames(s) {
  if (s.mode === "mul") {
    const alt = A(`${s.a} × ${s.b} as whole numbers, then a decimal point.`, `${s.a} × ${s.b} como números enteros y luego el punto decimal.`);
    const body = (n) => tag(280, 60, `${s.a} × ${s.b}`, 34) + (n >= 1 ? tag(280, 110, `${s.Aw} × ${s.Bw}`, 28, COLORS.whole) : "") + (n >= 2 ? tag(280, 160, `= ${comma(s.P)}`, 30, COLORS.whole) : "") + (n >= 3 ? tag(280, 210, `${comma(s.P)} ÷ ${10 ** s.scale} = ${dec(s.result)}`, 28, COLORS.part) : "");
    return [
      frameOf({ id: "decimals", cap: A(`Multiply the decimals by treating them as whole numbers first.`, `Multiplica los decimales tratándolos primero como números enteros.`), easy: A("Use whole numbers first.", "Usa primero números enteros."), eq: `${s.a} × ${s.b}`, body: body(0), alt, meta: { pa: s.pa, pb: s.pb }, h: 250 }),
      frameOf({ id: "whole", cap: A(`Remove the decimal points: ${s.a} becomes ${s.Aw} and ${s.b} becomes ${s.Bw}.`, `Quita los puntos decimales: ${s.a} se vuelve ${s.Aw} y ${s.b} se vuelve ${s.Bw}.`), easy: A(`${s.Aw} × ${s.Bw}.`, `${s.Aw} × ${s.Bw}.`), eq: `${s.Aw} × ${s.Bw}`, body: body(1), alt, meta: { Aw: s.Aw, Bw: s.Bw }, h: 250 }),
      frameOf({ id: "product", cap: A(`${s.Aw} × ${s.Bw} = ${comma(s.P)}.`, `${s.Aw} × ${s.Bw} = ${comma(s.P)}.`), easy: A(`${comma(s.P)}.`, `${comma(s.P)}.`), eq: `${s.Aw} × ${s.Bw} = ${comma(s.P)}`, body: body(2), alt, meta: { Aw: s.Aw, Bw: s.Bw, P: s.P }, h: 250 }),
      frameOf({ id: "point", cap: A(`${s.a} has ${s.pa} decimal place${s.pa === 1 ? "" : "s"} and ${s.b} has ${s.pb}, so the answer has ${s.scale}: ${dec(s.result)}.`, `${s.a} tiene ${s.pa} lugar${s.pa === 1 ? "" : "es"} decimal${s.pa === 1 ? "" : "es"} y ${s.b} tiene ${s.pb}, así que la respuesta tiene ${s.scale}: ${dec(s.result)}.`), easy: A(`${dec(s.result)}.`, `${dec(s.result)}.`), eq: `${s.a} × ${s.b} = ${dec(s.result)}`, body: body(3), alt, meta: { Aw: s.Aw, Bw: s.Bw, P: s.P, scale: s.scale, result: s.result }, h: 250 }),
    ];
  }
  if (s.mode === "div") {
    const alt = A(`${s.a} ÷ ${s.b} shifted to whole numbers.`, `${s.a} ÷ ${s.b} convertido a números enteros.`);
    const hasShift = s.db > 0;
    const body = (n) => tag(280, 60, `${s.a} ÷ ${s.b}`, 34) + (n >= 1 ? tag(280, 110, `${s.A2} ÷ ${s.B}`, 28, COLORS.whole) : "") + (n >= 2 ? tag(280, 160, `= ${comma(s.Q2)}`, 30, COLORS.whole) : "") + (n >= 3 && s.extra > 0 ? tag(280, 210, `${comma(s.Q2)} ÷ ${10 ** s.extra} = ${dec(s.result)}`, 28, COLORS.part) : "");
    const out = [frameOf({ id: "start", cap: A("Make the divisor a whole number, then divide as with whole numbers.", "Haz que el divisor sea un número entero y luego divide como con enteros."), easy: A("Make the divisor whole.", "Haz entero el divisor."), eq: `${s.a} ÷ ${s.b}`, body: body(0), alt, meta: { a: s.a, b: s.b }, h: 250 })];
    out.push(frameOf({ id: "shift", cap: hasShift ? A(`Move the decimal point ${s.db} place${s.db > 1 ? "s" : ""} in both numbers. The answer stays the same: ${s.A2} ÷ ${s.B}.`, `Mueve el punto decimal ${s.db} lugar${s.db > 1 ? "es" : ""} en ambos números. La respuesta no cambia: ${s.A2} ÷ ${s.B}.`) : A(`The divisor is already whole. Ignore the decimal point and divide ${s.A2} ÷ ${s.B}.`, `El divisor ya es entero. Ignora el punto decimal y divide ${s.A2} ÷ ${s.B}.`), easy: A(`${s.A2} ÷ ${s.B}.`, `${s.A2} ÷ ${s.B}.`), eq: `${s.A2} ÷ ${s.B}`, body: body(1), alt, meta: { A2: s.A2, B: s.B }, h: 250 }));
    out.push(frameOf({ id: "quotient", cap: A(`${s.A2} ÷ ${s.B} = ${comma(s.Q2)}.`, `${s.A2} ÷ ${s.B} = ${comma(s.Q2)}.`), easy: A(`${comma(s.Q2)}.`, `${comma(s.Q2)}.`), eq: `${s.A2} ÷ ${s.B} = ${comma(s.Q2)}`, body: body(2), alt, meta: { A2: s.A2, B: s.B, Q2: s.Q2 }, h: 250 }));
    if (s.extra > 0) out.push(frameOf({ id: "point", cap: A(`${s.a} had ${s.extra} decimal place${s.extra > 1 ? "s" : ""} to put back: ${comma(s.Q2)} ÷ ${10 ** s.extra} = ${dec(s.result)}.`, `${s.a} tenía ${s.extra} lugar${s.extra > 1 ? "es" : ""} decimal${s.extra > 1 ? "es" : ""} que devolver: ${comma(s.Q2)} ÷ ${10 ** s.extra} = ${dec(s.result)}.`), easy: A(`${dec(s.result)}.`, `${dec(s.result)}.`), eq: `${s.a} ÷ ${s.b} = ${dec(s.result)}`, body: body(3), alt, meta: { A2: s.A2, B: s.B, Q2: s.Q2, extra: s.extra, result: s.result }, h: 250 }));
    return out;
  }
  if (s.mode === "pow10") {
    const w = Math.min(46, 460 / (s.digits.length + 2));
    const draw = (point, arrow) => {
      let out = "";
      const x0 = 280 - (w * s.digits.length) / 2;
      [...s.digits].forEach((d, i) => (out += `<rect x="${x0 + i * w + 2}" y="70" width="${w - 4}" height="56" rx="8" fill="#f8fafc" stroke="${COLORS.rule}" stroke-width="2"/>` + tag(x0 + i * w + w / 2, 108, d, 28)));
      const px = x0 + Math.max(0, Math.min(s.digits.length, point)) * w;
      out += `<circle cx="${px}" cy="140" r="8" fill="${COLORS.warn}"/>`;
      if (point < 0 || point > s.digits.length) out += tag(px + (point < 0 ? 16 : -16), 146, point < 0 ? `←${-point} zeros` : `${point - s.digits.length} zeros →`, 14, COLORS.warn, point < 0 ? "start" : "end");
      if (arrow) out += tag(280, 180, arrow, 22, COLORS.warn);
      return out;
    };
    const alt = A(`The digits ${s.digits} with a decimal point.`, `Los dígitos ${s.digits} con un punto decimal.`);
    return [
      frameOf({ id: "number", cap: A(`${s.a} has its decimal point after the ${s.point === 1 ? "first digit" : `${s.point} digits`}.`, `${s.a} tiene su punto decimal después de ${s.point === 1 ? "el primer dígito" : `${s.point} dígitos`}.`), easy: A("The decimal point.", "El punto decimal."), eq: `${s.a} × 10^${s.e}`, body: draw(s.point, ""), alt, meta: { point: s.point }, h: 220 }),
      frameOf({ id: "move", cap: s.e === 0 ? A("10^0 is 1, so the number does not change.", "10^0 es 1, así que el número no cambia.") : A(`Each ${s.e > 0 ? "×10" : "÷10"} moves the point one place ${s.e > 0 ? "right" : "left"}. Here that is ${Math.abs(s.e)} place${Math.abs(s.e) > 1 ? "s" : ""} ${s.e > 0 ? "right" : "left"}.`, `Cada ${s.e > 0 ? "×10" : "÷10"} mueve el punto un lugar a la ${s.e > 0 ? "derecha" : "izquierda"}. Aquí son ${Math.abs(s.e)} lugar${Math.abs(s.e) > 1 ? "es" : ""} a la ${s.e > 0 ? "derecha" : "izquierda"}.`), easy: A(s.e === 0 ? "No move." : `${Math.abs(s.e)} ${s.e > 0 ? "right" : "left"}.`, s.e === 0 ? "Sin mover." : `${Math.abs(s.e)} a la ${s.e > 0 ? "derecha" : "izquierda"}.`), eq: `${s.a} × 10^${s.e}`, body: draw(s.point, s.e === 0 ? "" : `${s.e > 0 ? "→" : "←"} ${Math.abs(s.e)}`), alt, meta: { moved: s.e }, h: 220 }),
      frameOf({ id: "result", cap: A(`The number is now ${s.text}.`, `El número ahora es ${s.text}.`), easy: A(`${s.text}.`, `${s.text}.`), eq: `${s.a} × 10^${s.e} = ${s.text}`, body: draw(s.newPoint, ""), alt, meta: { text: s.text, newPoint: s.newPoint, result: s.result }, h: 220 }),
    ];
  }
  if (s.mode === "long") {
    const alt = A(`${comma(s.n)} ÷ ${s.d} in chunks.`, `${comma(s.n)} ÷ ${s.d} en partes.`);
    const body = (upto) => {
      let out = tag(280, 40, `${comma(s.n)} ÷ ${s.d}`, 32);
      s.chunks.slice(0, upto).forEach((c, i) => (out += tag(280, 86 + i * 44, `${s.d} × ${comma(c.piece)} = ${comma(c.take)}  →  ${comma(c.after)} left`, 20, COLORS.whole)));
      if (upto === s.chunks.length) out += tag(280, 96 + upto * 44, `${s.chunks.map((c) => comma(c.piece)).join(" + ")} = ${comma(s.result)}`, 24, COLORS.part);
      return out;
    };
    const h = 140 + s.chunks.length * 44;
    const out = [frameOf({ id: "start", cap: A(`Divide in friendly chunks: take the biggest chunk of ${s.d} that fits, subtract it, and repeat.`, `Divide en partes cómodas: toma la parte más grande de ${s.d} que quepa, réstala y repite.`), easy: A("Take chunks.", "Toma partes."), eq: `${comma(s.n)} ÷ ${s.d}`, body: body(0), alt, meta: { n: s.n }, h })];
    s.chunks.forEach((c, i) => out.push(frameOf({ id: `c${i}`, cap: A(`${s.d} × ${comma(c.piece)} = ${comma(c.take)}. ${comma(c.before)} − ${comma(c.take)} = ${comma(c.after)} left.`, `${s.d} × ${comma(c.piece)} = ${comma(c.take)}. ${comma(c.before)} − ${comma(c.take)} = ${comma(c.after)} restante.`), easy: A(`${comma(c.after)} left.`, `Quedan ${comma(c.after)}.`), eq: `${comma(s.n)} ÷ ${s.d}`, body: body(i + 1), alt, meta: { piece: c.piece, take: c.take, before: c.before, after: c.after, d: s.d, sum: s.chunks.slice(0, i + 1).reduce((x, y) => x + y.piece, 0) }, h })));
    out[out.length - 1] = Object.assign(out[out.length - 1], { meta: { ...out.at(-1).meta, result: s.result, final: true } });
    return out;
  }
  if (s.mode === "fdiv") {
    const alt = A(`${s.a}/${s.b} ÷ ${s.c}/${s.d} with equal-size pieces.`, `${s.a}/${s.b} ÷ ${s.c}/${s.d} con partes del mismo tamaño.`);
    const body = (n) => tag(280, 60, `${s.a}/${s.b} ÷ ${s.c}/${s.d}`, 34) + (n >= 1 ? tag(280, 118, `${s.ad}/${s.bd} ÷ ${s.bc}/${s.bd}`, 30, COLORS.whole) : "") + (n >= 2 ? tag(280, 174, `${s.ad} ÷ ${s.bc}`, 30, COLORS.whole) : "") + (n >= 3 ? tag(280, 226, `= ${s.result}`, 32, COLORS.part) : "");
    return [
      frameOf({ id: "start", cap: A(`Dividing asks: how many groups of ${s.c}/${s.d} fit into ${s.a}/${s.b}?`, `Dividir pregunta: ¿cuántos grupos de ${s.c}/${s.d} caben en ${s.a}/${s.b}?`), easy: A("How many groups fit?", "¿Cuántos grupos caben?"), eq: `${s.a}/${s.b} ÷ ${s.c}/${s.d}`, body: body(0), alt, meta: { a: s.a, b: s.b, c: s.c, d: s.d }, h: 270 }),
      frameOf({ id: "rename", cap: A(`Use pieces of the same size, 1/${s.bd}: ${s.a}/${s.b} = ${s.ad}/${s.bd} and ${s.c}/${s.d} = ${s.bc}/${s.bd}.`, `Usa partes del mismo tamaño, 1/${s.bd}: ${s.a}/${s.b} = ${s.ad}/${s.bd} y ${s.c}/${s.d} = ${s.bc}/${s.bd}.`), easy: A("Same-size pieces.", "Partes del mismo tamaño."), eq: `${s.ad}/${s.bd} ÷ ${s.bc}/${s.bd}`, body: body(1), alt, meta: { ad: s.ad, bc: s.bc, bd: s.bd }, h: 270 }),
      frameOf({ id: "count", cap: A(`Now count: how many groups of ${s.bc} pieces fit in ${s.ad} pieces? ${s.ad} ÷ ${s.bc}.`, `Ahora cuenta: ¿cuántos grupos de ${s.bc} partes caben en ${s.ad} partes? ${s.ad} ÷ ${s.bc}.`), easy: A(`${s.ad} ÷ ${s.bc}.`, `${s.ad} ÷ ${s.bc}.`), eq: `${s.ad} ÷ ${s.bc}`, body: body(2), alt, meta: { ad: s.ad, bc: s.bc }, h: 270 }),
      frameOf({ id: "result", cap: A(`${s.ad} ÷ ${s.bc} = ${s.ad}/${s.bc}${s.result !== `${s.ad}/${s.bc}` ? ` = ${s.result}` : ""}. This is the same as ${s.a}/${s.b} × ${s.d}/${s.c}: multiplying by the reciprocal of ${s.c}/${s.d}, which tells how many groups fit in one whole.`, `${s.ad} ÷ ${s.bc} = ${s.ad}/${s.bc}${s.result !== `${s.ad}/${s.bc}` ? ` = ${s.result}` : ""}. Es lo mismo que ${s.a}/${s.b} × ${s.d}/${s.c}: multiplicar por el recíproco de ${s.c}/${s.d}, que dice cuántos grupos caben en un entero.`), easy: A(`${s.result}.`, `${s.result}.`), eq: `= ${s.result}`, body: body(3), alt, meta: { ad: s.ad, bc: s.bc, rn: s.rn, rd: s.rd, result: s.result }, h: 270 }),
    ];
  }
  if (s.mode === "unitshare") {
    const total = s.b * s.w;
    const draw = (stage) => {
      let out = "";
      const w = 440 / total;
      for (let i = 0; i < total; i += 1) out += `<rect x="${60 + i * w}" y="90" width="${w - 1}" height="50" fill="${stage >= 1 && i < s.w ? COLORS.whole : stage === 0 && i < total / s.b ? COLORS.whole : "#fff"}" fill-opacity=".85" stroke="${COLORS.ink}" stroke-width="1.5"/>`;
      for (let j = 0; j <= s.b; j += 1) out += `<line x1="${60 + (j * 440) / s.b}" x2="${60 + (j * 440) / s.b}" y1="80" y2="150" stroke="${COLORS.ink}" stroke-width="3"/>`;
      if (stage >= 2) out += `<rect x="60" y="90" width="${440 / total}" height="50" fill="${COLORS.part}"/>` + tag(60 + 440 / total / 2, 176, `1/${total}`, 18, COLORS.part);
      return out;
    };
    const alt = A(`A whole cut into ${total} equal pieces.`, `Un entero cortado en ${total} partes iguales.`);
    return [
      frameOf({ id: "half", cap: A(`Start with 1/${s.b} of the whole ribbon.`, `Empieza con 1/${s.b} de la cinta entera.`), easy: A(`1/${s.b} of a meter.`, `1/${s.b} de metro.`), eq: `1/${s.b} ÷ ${s.w}`, body: draw(0), alt, meta: { b: s.b }, h: 210 }),
      frameOf({ id: "share", cap: A(`Share that piece equally among ${s.w} students: cut it into ${s.w} equal parts.`, `Reparte esa parte entre ${s.w} estudiantes: córtala en ${s.w} partes iguales.`), easy: A(`Cut into ${s.w}.`, `Corta en ${s.w}.`), eq: `1/${s.b} ÷ ${s.w}`, body: draw(1), alt, meta: { b: s.b, w: s.w, total }, h: 210 }),
      frameOf({ id: "each", cap: A(`The whole is now ${s.b} × ${s.w} = ${total} equal parts, so each student gets 1/${total}.`, `El entero ahora tiene ${s.b} × ${s.w} = ${total} partes iguales, así que cada estudiante recibe 1/${total}.`), easy: A(`1/${total} each.`, `1/${total} cada uno.`), eq: `1/${s.b} ÷ ${s.w} = 1/${total}`, body: draw(2), alt, meta: { b: s.b, w: s.w, total, result: `1/${total}` }, h: 210 }),
    ];
  }
  if (s.mode === "unitcount") {
    const draw = (stage) => {
      let out = "";
      const wUnit = Math.min(60, 500 / s.w);
      for (let i = 0; i < s.w; i += 1) {
        out += `<rect x="${30 + i * wUnit}" y="90" width="${wUnit - 4}" height="40" fill="#fff" stroke="${COLORS.ink}" stroke-width="2"/>`;
        if (stage >= 1) for (let j = 1; j < s.d; j += 1) out += `<line x1="${30 + i * wUnit + (j * (wUnit - 4)) / s.d}" x2="${30 + i * wUnit + (j * (wUnit - 4)) / s.d}" y1="90" y2="130" stroke="${COLORS.whole}" stroke-width="2"/>`;
      }
      if (stage >= 2) out += tag(280, 176, `${s.w} × ${s.d} = ${s.result}`, 26, COLORS.part);
      return out;
    };
    const alt = A(`${s.w} wholes, each cut into ${s.d} equal parts.`, `${s.w} enteros, cada uno cortado en ${s.d} partes iguales.`);
    return [
      frameOf({ id: "wholes", cap: A(`The jug holds ${s.w} liters: ${s.w} wholes.`, `La jarra tiene ${s.w} litros: ${s.w} enteros.`), easy: A(`${s.w} wholes.`, `${s.w} enteros.`), eq: `${s.w} ÷ 1/${s.d}`, body: draw(0), alt, meta: { w: s.w }, h: 210 }),
      frameOf({ id: "cut", cap: A(`Cut every liter into servings of 1/${s.d}: each liter makes ${s.d} servings.`, `Corta cada litro en porciones de 1/${s.d}: cada litro da ${s.d} porciones.`), easy: A(`Each liter makes ${s.d}.`, `Cada litro da ${s.d}.`), eq: `${s.w} ÷ 1/${s.d}`, body: draw(1), alt, meta: { w: s.w, d: s.d }, h: 210 }),
      frameOf({ id: "count", cap: A(`${s.w} liters × ${s.d} servings each = ${s.result} servings. Dividing by 1/${s.d} is the same as multiplying by ${s.d}.`, `${s.w} litros × ${s.d} porciones cada uno = ${s.result} porciones. Dividir entre 1/${s.d} es lo mismo que multiplicar por ${s.d}.`), easy: A(`${s.result} servings.`, `${s.result} porciones.`), eq: `${s.w} × ${s.d} = ${s.result}`, body: draw(2), alt, meta: { w: s.w, d: s.d, result: s.result }, h: 210 }),
    ];
  }
  return [];
}

export const answer = (s) => s.result;

export function predicts(s) {
  const P = (at, q, r, w, why, er, ew) => [predictOf(at, q, r, w, { right: why[0], wrong: why[1] }, er, ew)];
  if (s.mode === "mul") return P(3, A("How many decimal places should the answer have?", "¿Cuántos lugares decimales debe tener la respuesta?"), A("All the places from both numbers together.", "Todos los lugares de ambos números juntos."), A("Just the larger number of places.", "Solo el mayor número de lugares."), [A("Each place divides by 10 once, and both numbers were shifted, so the shifts add.", "Cada lugar divide entre 10 una vez, y se movieron ambos números, así que se suman."), A("That rule is for adding decimals. Multiplying shifts both numbers, so the places add.", "Esa regla es para sumar decimales. Al multiplicar se mueven ambos números, así que los lugares se suman.")], A("Because each number was multiplied by a power of 10, and we undo both.", "Porque cada número se multiplicó por una potencia de 10, y deshacemos ambas."), A("Because decimals line up like in addition.", "Porque los decimales se alinean como en la suma."));
  if (s.mode === "div") return P(1, A("Why can we move the decimal point in both numbers?", "¿Por qué podemos mover el punto decimal en ambos números?"), A("Multiplying both by the same power of 10 does not change the quotient.", "Multiplicar ambos por la misma potencia de 10 no cambia el cociente."), A("Moving it only in the divisor is enough.", "Moverlo solo en el divisor basta."), [A("It is like multiplying the top and bottom of a fraction by the same number.", "Es como multiplicar arriba y abajo de una fracción por el mismo número."), A("If only one number moves, the quotient changes.", "Si solo se mueve un número, cambia el cociente.")], A("Because the same factor on both numbers keeps the ratio.", "Porque el mismo factor en ambos números mantiene la razón."), A("Because the decimal point does not matter.", "Porque el punto decimal no importa."));
  if (s.mode === "pow10" && s.e !== 0) return P(1, A(`The exponent is ${s.e}. Which way does the decimal point move?`, `El exponente es ${s.e}. ¿Hacia dónde se mueve el punto decimal?`), A(s.e > 0 ? "To the right." : "To the left.", s.e > 0 ? "A la derecha." : "A la izquierda."), A(s.e > 0 ? "To the left." : "To the right.", s.e > 0 ? "A la izquierda." : "A la derecha."), [A(s.e > 0 ? "Multiplying by 10 makes a number bigger, so the point moves right." : "A negative exponent divides by 10, making the number smaller, so the point moves left.", s.e > 0 ? "Multiplicar por 10 agranda el número, así que el punto va a la derecha." : "Un exponente negativo divide entre 10 y achica el número, así que el punto va a la izquierda."), A(s.e > 0 ? "Moving left would make the number smaller, but ×10 makes it bigger." : "Moving right would make it bigger, but a negative exponent makes it smaller.", s.e > 0 ? "Ir a la izquierda achicaría el número, pero ×10 lo agranda." : "Ir a la derecha lo agrandaría, pero un exponente negativo lo achica.")], A("Because each power of 10 changes the size by one place.", "Porque cada potencia de 10 cambia el tamaño en un lugar."), A("Because the point always moves right.", "Porque el punto siempre va a la derecha."));
  if (s.mode === "long") return P(1, A("How do we choose each chunk?", "¿Cómo elegimos cada parte?"), A("The biggest easy chunk that still fits.", "La parte fácil más grande que todavía cabe."), A("The smallest chunk possible.", "La parte más pequeña posible."), [A("Big chunks finish in fewer steps, and we keep going until nothing is left.", "Las partes grandes terminan en menos pasos, y seguimos hasta que no quede nada."), A("Tiny chunks work but take many steps; choose the biggest that fits.", "Las partes pequeñas sirven pero llevan muchos pasos; elige la mayor que quepa.")], A("Because each chunk is a multiple of the divisor we can subtract.", "Porque cada parte es un múltiplo del divisor que podemos restar."), A("Because chunks must all be the same size.", "Porque las partes deben ser todas del mismo tamaño."));
  if (s.mode === "fdiv") return P(1, A("Why rename both fractions with the same size pieces?", "¿Por qué renombrar ambas fracciones con partes del mismo tamaño?"), A("So we can count how many pieces fit.", "Para poder contar cuántas partes caben."), A("So the answer is bigger.", "Para que la respuesta sea mayor."), [A("With equal pieces, dividing is just counting groups of pieces.", "Con partes iguales, dividir es solo contar grupos de partes."), A("Renaming never changes the size of the answer; it only makes it countable.", "Renombrar nunca cambia el tamaño de la respuesta; solo la hace contable.")], A("Because we can only count groups of pieces that are the same size.", "Porque solo podemos contar grupos de partes del mismo tamaño."), A("Because the bottom numbers must be added.", "Porque los denominadores deben sumarse."));
  if (s.mode === "unitcount") return P(1, A(`Each liter is cut into servings of 1/${s.d}. Will there be more or fewer servings than liters?`, `Cada litro se corta en porciones de 1/${s.d}. ¿Habrá más o menos porciones que litros?`), A("More: each liter makes several servings.", "Más: cada litro da varias porciones."), A("Fewer.", "Menos."), [A("A serving is smaller than a liter, so more of them fit.", "Una porción es menor que un litro, así que caben más."), A("Smaller servings mean more servings, not fewer.", "Porciones más pequeñas significan más porciones, no menos.")], A("Because dividing by a fraction less than 1 makes the answer bigger.", "Porque dividir entre una fracción menor que 1 hace mayor la respuesta."), A("Because dividing always makes a number smaller.", "Porque dividir siempre achica un número."));
  if (s.mode === "unitshare") return P(1, A("When we share a piece among students, is each share bigger or smaller than the piece?", "Al repartir un trozo entre estudiantes, ¿cada parte es mayor o menor que el trozo?"), A("Smaller.", "Menor."), A("Bigger.", "Mayor."), [A("Sharing cuts the piece into parts, so each part is smaller.", "Repartir corta el trozo en partes, así que cada parte es menor."), A("A share is a part of the piece, so it cannot be bigger.", "Una parte es una porción del trozo, así que no puede ser mayor.")], A("Because the piece is divided into equal shares.", "Porque el trozo se divide en partes iguales."), A("Because more students get more ribbon.", "Porque más estudiantes reciben más cinta."));
  return [];
}

export function hints(s) {
  const list = frames(s);
  const first = list[0];
  const T = {
    mul: [A("Multiply as if there were no decimal points, then decide where the point goes.", "Multiplica como si no hubiera puntos decimales y luego decide dónde va el punto."), A("The decimals are shown before any step.", "Los decimales se muestran antes de cualquier paso."), A("Count the decimal places in both numbers together.", "Cuenta los lugares decimales de ambos números juntos.")],
    div: [A("Make the divisor a whole number by moving the decimal point in both numbers.", "Haz entero el divisor moviendo el punto decimal en ambos números."), A("The division is shown as given.", "La división se muestra como está."), A("Then divide as with whole numbers and put any decimal point back.", "Luego divide como con enteros y devuelve el punto decimal.")],
    pow10: [A("Each power of 10 moves the decimal point one place.", "Cada potencia de 10 mueve el punto decimal un lugar."), A("The digits are shown with the decimal point.", "Los dígitos se muestran con el punto decimal."), A("Decide the direction from the sign of the exponent, then count the places.", "Decide la dirección con el signo del exponente y cuenta los lugares.")],
    long: [A("Take friendly chunks of the divisor, like tens and ones.", "Toma partes cómodas del divisor, como decenas y unidades."), A("The problem is shown before any chunk is taken.", "El problema se muestra antes de tomar una parte."), A("Find the biggest chunk that fits, subtract it, and repeat with what is left.", "Halla la parte mayor que quepa, réstala y repite con lo que queda.")],
    fdiv: [A("Dividing by a fraction asks how many of it fit.", "Dividir entre una fracción pregunta cuántos caben."), A("The division is shown with both fractions.", "La división se muestra con ambas fracciones."), A("Rename both with the same size pieces, then divide the counts.", "Renombra ambas con partes del mismo tamaño y divide los conteos.")],
    unitshare: [A("Sharing a piece cuts it into smaller parts.", "Repartir un trozo lo corta en partes menores."), A("The piece is shown as part of the whole.", "El trozo se muestra como parte del entero."), A("Cut the whole into equal parts so each share is one of them.", "Corta el entero en partes iguales para que cada parte sea una.")],
    unitcount: [A("A serving is smaller than a liter, so each liter makes several.", "Una porción es menor que un litro, así que cada litro da varias."), A("The liters are shown as wholes.", "Los litros se muestran como enteros."), A("Find how many servings one liter makes, then use it for every liter.", "Halla cuántas porciones da un litro y úsalo para todos los litros.")],
  }[s.mode];
  return [{ text: T[0] }, { text: T[1], frame: first }, { text: T[2], frame: first }];
}

const fracVal = (raw) => {
  const t = String(raw).replace(/\s/g, "");
  if (t.includes("/")) {
    const [x, y] = t.split("/").map(Number);
    return y ? x / y : null;
  }
  return num(t);
};
const near = (a, b) => a !== null && Number.isFinite(a) && Math.abs(a - b) < 1e-9;
export function diagnose(s, raw) {
  const v = fracVal(raw);
  if (v === null) return null;
  if (s.mode === "mul" && !near(v, s.result)) return [10, 100, 0.1, 0.01, 1000, 0.001].some((k) => near(v, s.result * k)) ? "pointSlip" : near(v, s.P / 10 ** Math.max(s.pa, s.pb)) ? "alignedLikeAdding" : null;
  if (s.mode === "div" && !near(v, s.result)) return [10, 100, 0.1, 0.01].some((k) => near(v, s.result * k)) ? "pointSlip" : null;
  if (s.mode === "pow10" && !near(v, s.result)) return near(v, Number(s.a) * 10 ** -s.e) ? "wrongDirection" : [10, 0.1, 100, 0.01].some((k) => near(v, s.result * k)) ? "wrongPlaces" : null;
  if (s.mode === "long" && !near(v, s.result)) return [10, 0.1, 100].some((k) => near(v, s.result * k)) ? "placeValueSlip" : null;
  if (s.mode === "fdiv" && !near(v, s.ad / s.bc)) return near(v, (s.a * s.c) / (s.b * s.d)) ? "noFlip" : near(v, (s.b * s.c) / (s.a * s.d)) ? "flippedFirst" : null;
  if (s.mode === "unitcount" && !near(v, s.result)) return near(v, s.w / s.d) ? "dividedWrongWay" : null;
  if (s.mode === "unitshare" && !near(v, 1 / (s.b * s.w))) return near(v, s.w / s.b) ? "multiplied" : near(v, 1 / s.b) ? "forgotToShare" : null;
  return null;
}
export const tags = {
  pointSlip: { label: L("Put the decimal point in the wrong place", "Puso el punto decimal en el lugar equivocado"), tip: L("Check the size: estimate first, and count the decimal places to put the point back.", "Revisa el tamaño: estima primero y cuenta los lugares decimales para devolver el punto.") },
  alignedLikeAdding: { label: L("Kept only the larger number of decimal places", "Dejó solo el mayor número de lugares decimales"), tip: L("When multiplying, the decimal places of both numbers add together.", "Al multiplicar, los lugares decimales de ambos números se suman.") },
  wrongDirection: { label: L("Moved the decimal point the wrong way", "Movió el punto decimal en la dirección contraria"), tip: L("×10^n moves the point right; a negative exponent moves it left.", "×10^n mueve el punto a la derecha; un exponente negativo lo mueve a la izquierda.") },
  wrongPlaces: { label: L("Moved the point the wrong number of places", "Movió el punto un número equivocado de lugares"), tip: L("The exponent tells exactly how many places to move the point.", "El exponente dice exactamente cuántos lugares mover el punto.") },
  placeValueSlip: { label: L("The digits are right but a place is off", "Los dígitos están bien pero un lugar falla"), tip: L("Check each chunk's place value: 10 × 19 is 190, not 19.", "Revisa el valor posicional de cada parte: 10 × 19 es 190, no 19.") },
  noFlip: { label: L("Multiplied straight across instead of dividing", "Multiplicó directo en lugar de dividir"), tip: L("Dividing by a fraction means multiplying by its flip, the reciprocal.", "Dividir entre una fracción significa multiplicar por su inverso.") },
  flippedFirst: { label: L("Flipped the first fraction", "Invirtió la primera fracción"), tip: L("Only the fraction you divide by is flipped.", "Solo se invierte la fracción entre la que divides.") },
  dividedWrongWay: { label: L("Divided the liters by the serving size's bottom number", "Dividió los litros entre el denominador de la porción"), tip: L("Smaller servings make more servings: multiply the liters by the bottom number.", "Porciones más pequeñas dan más porciones: multiplica los litros por el denominador.") },
  multiplied: { label: L("Multiplied instead of sharing", "Multiplicó en lugar de repartir"), tip: L("Sharing a piece makes smaller parts. Cut the whole into more equal parts.", "Repartir un trozo hace partes menores. Corta el entero en más partes iguales.") },
  forgotToShare: { label: L("Gave the piece, not one student's share", "Dio el trozo, no la parte de un estudiante"), tip: L("The piece is shared among all the students, so each gets less than the piece.", "El trozo se reparte entre todos los estudiantes, así que cada uno recibe menos que el trozo.") },
};

// ----- Build -----
const BUILDS = {
  mul: choiceBuild({ prompt: () => L("How many decimal places does the product have?", "¿Cuántos lugares decimales tiene el producto?"), options: (s) => [...new Set([s.scale, Math.max(s.pa, s.pb), s.pa + s.pb + 1].filter((v) => v > 0))].sort((a, b) => a - b).map((v) => ({ label: L(String(v), String(v)), ok: v === s.scale, msg: v === Math.max(s.pa, s.pb) ? L("That is the rule for adding. When multiplying, the places of both numbers add.", "Esa es la regla de sumar. Al multiplicar, los lugares de ambos números se suman.") : L(`Count the places in ${s.a} and in ${s.b}, then add them.`, `Cuenta los lugares de ${s.a} y de ${s.b} y súmalos.`) })), draw: (s, pick) => ({ body: frames(s).at(pick !== null ? 3 : 2).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("The product.", "El producto."), h: 250 }), doneMsg: (s) => L(`${s.pa} + ${s.pb} = ${s.scale} places: ${dec(s.result)}.`, `${s.pa} + ${s.pb} = ${s.scale} lugares: ${dec(s.result)}.`) }),
  div: choiceBuild({ prompt: () => L("Which first step makes the division easier?", "¿Qué primer paso facilita la división?"), options: (s) => [{ label: L(s.db > 0 ? `Move the point ${s.db} place${s.db > 1 ? "s" : ""} in both numbers` : "Divide as whole numbers", s.db > 0 ? `Mover el punto ${s.db} lugar${s.db > 1 ? "es" : ""} en ambos números` : "Dividir como enteros"), ok: true }, { label: L("Move the point only in the divisor", "Mover el punto solo en el divisor"), ok: false, msg: L("Then the quotient would change. Move it in both numbers.", "Entonces cambiaría el cociente. Muévelo en ambos números.") }], draw: (s, pick) => ({ body: frames(s).at(pick === 0 ? 1 : 0).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("The division.", "La división."), h: 250 }), doneMsg: (s) => L(`${s.A2} ÷ ${s.B} gives ${dec(s.result)}.`, `${s.A2} ÷ ${s.B} da ${dec(s.result)}.`) }),
  pow10: choiceBuild({ available: (s) => s.e !== 0, prompt: () => L("Which way does the decimal point move?", "¿Hacia dónde se mueve el punto decimal?"), options: (s) => [{ label: L("Right", "Derecha"), ok: s.e > 0, msg: L("A negative exponent makes the number smaller: the point moves left.", "Un exponente negativo achica el número: el punto va a la izquierda.") }, { label: L("Left", "Izquierda"), ok: s.e < 0, msg: L("×10 makes the number bigger: the point moves right.", "×10 agranda el número: el punto va a la derecha.") }], draw: (s, pick) => ({ body: frames(s).at(pick !== null ? 2 : 0).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("The digits.", "Los dígitos."), h: 220 }), doneMsg: (s) => L(`${Math.abs(s.e)} place${Math.abs(s.e) > 1 ? "s" : ""} ${s.e > 0 ? "right" : "left"}: ${s.text}.`, `${Math.abs(s.e)} lugar${Math.abs(s.e) > 1 ? "es" : ""} a la ${s.e > 0 ? "derecha" : "izquierda"}: ${s.text}.`) }),
  long: choiceBuild({ prompt: (s) => L(`What is the biggest easy chunk of ${s.d} that fits in ${comma(s.n)}?`, `¿Cuál es la parte fácil más grande de ${s.d} que cabe en ${comma(s.n)}?`), options: (s) => { const c = s.chunks[0].piece; return [...new Set([c / 10, c, c * 10].filter((v) => v >= 1))].map((v) => ({ label: L(comma(v), comma(v)), ok: v === c, msg: v < c ? L(`${s.d} × ${comma(v)} fits, but a bigger chunk fits too.`, `${s.d} × ${comma(v)} cabe, pero cabe una parte mayor.`) : L(`${s.d} × ${comma(v)} = ${comma(s.d * v)}, which is more than ${comma(s.n)}.`, `${s.d} × ${comma(v)} = ${comma(s.d * v)}, que es más que ${comma(s.n)}.`) })); }, draw: (s, pick) => ({ body: frames(s).at(pick !== null ? 1 : 0).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("Long division in chunks.", "División larga por partes."), h: 140 + s.chunks.length * 44 }), doneMsg: (s) => L(`${s.d} × ${comma(s.chunks[0].piece)} = ${comma(s.chunks[0].take)}. Keep going with ${comma(s.chunks[0].after)}.`, `${s.d} × ${comma(s.chunks[0].piece)} = ${comma(s.chunks[0].take)}. Sigue con ${comma(s.chunks[0].after)}.`) }),
  fdiv: choiceBuild({ prompt: (s) => L(`Dividing by ${s.c}/${s.d} is the same as multiplying by what?`, `Dividir entre ${s.c}/${s.d} es lo mismo que multiplicar por qué?`), options: (s) => [{ label: L(`${s.d}/${s.c}`, `${s.d}/${s.c}`), ok: true }, { label: L(`${s.c}/${s.d}`, `${s.c}/${s.d}`), ok: false, msg: L("That multiplies by the same fraction. Dividing uses its flip.", "Eso multiplica por la misma fracción. Dividir usa su inverso.") }, { label: L(`${s.b}/${s.a}`, `${s.b}/${s.a}`), ok: false, msg: L("That flips the fraction you start with. Flip the one you divide by.", "Eso invierte la fracción con la que empiezas. Invierte entre la que divides.") }], draw: (s, pick) => ({ body: frames(s).at(pick === 0 ? 3 : 0).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("A fraction division.", "Una división de fracciones."), h: 270 }), doneMsg: (s) => L(`${s.a}/${s.b} × ${s.d}/${s.c} = ${s.result}.`, `${s.a}/${s.b} × ${s.d}/${s.c} = ${s.result}.`) }),
  unitshare: choiceBuild({ prompt: () => L("How many equal parts is the whole cut into?", "¿En cuántas partes iguales se corta el entero?"), options: (s) => [{ label: L(String(s.b * s.w), String(s.b * s.w)), ok: true }, { label: L(String(s.b + s.w), String(s.b + s.w)), ok: false, msg: L("Cutting each part into more parts multiplies, it does not add.", "Cortar cada parte en más partes multiplica, no suma.") }], draw: (s, pick) => ({ body: frames(s).at(pick === 0 ? 2 : 1).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("The whole in equal parts.", "El entero en partes iguales."), h: 210 }), doneMsg: (s) => L(`${s.b} × ${s.w} = ${s.b * s.w} parts, so each share is 1/${s.b * s.w}.`, `${s.b} × ${s.w} = ${s.b * s.w} partes, así que cada parte es 1/${s.b * s.w}.`) }),
  unitcount: choiceBuild({ prompt: (s) => L(`How many servings of 1/${s.d} does one liter make?`, `¿Cuántas porciones de 1/${s.d} da un litro?`), options: (s) => [{ label: L(String(s.d), String(s.d)), ok: true }, { label: L("1", "1"), ok: false, msg: L("A serving is smaller than a liter, so one liter makes more than one.", "Una porción es menor que un litro, así que un litro da más de una.") }], draw: (s, pick) => ({ body: frames(s).at(pick === 0 ? 2 : 1).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("Liters cut into servings.", "Litros cortados en porciones."), h: 210 }), doneMsg: (s) => L(`${s.w} × ${s.d} = ${s.result} servings.`, `${s.w} × ${s.d} = ${s.result} porciones.`) }),
};
export const build = {
  available: (s) => Boolean(BUILDS[s.mode]) && (BUILDS[s.mode].available ? BUILDS[s.mode].available(s) : true),
  prompt: (s) => (typeof BUILDS[s.mode].prompt === "function" ? BUILDS[s.mode].prompt(s) : BUILDS[s.mode].prompt),
  init: (s) => BUILDS[s.mode].init(s),
  render: (st, s, x) => BUILDS[s.mode].render(st, s, x),
  act: (st, id, arg, s) => BUILDS[s.mode].act(st, id, arg, s),
  done: (st, s) => BUILDS[s.mode].done(st, s),
};
void svgWrap;
