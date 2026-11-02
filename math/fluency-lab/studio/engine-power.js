// Power engine: an exponent as repeated multiplication, and a square root as the side of a square. 8^2 is 8 × 8
// (not 8 × 2), and √81 asks which side makes a square of 81 tiles. Frames record the factors and side so the
// tests can recompute every product.
import { COLORS, L, clean, esc, frame, keyed, num, svgWrap, txt } from "./core.js";

const comma = (n) => n.toLocaleString("en-US");

export function parse(question) {
  const q = clean(question);
  let m = q.match(/^(\d+)\^(\d+) = \?$/);
  if (m) {
    const [b, e] = [Number(m[1]), Number(m[2])];
    const result = b ** e;
    if (b < 1 || e < 1 || e > 6 || result > 9_999_999 || !Number.isSafeInteger(result)) return null;
    return { engine: "power", mode: "exp", b, e, result };
  }
  m = q.match(/^√(\d+) = \?$/);
  if (m) {
    const n = Number(m[1]);
    const side = Math.round(Math.sqrt(n));
    return n >= 1 && side * side === n && side <= 25 ? { engine: "power", mode: "root", n, side, result: side } : null;
  }
  return null;
}

function squareSvg(side, { max = side, mark = false } = {}) {
  const cell = Math.min(24, 190 / Math.max(side, 1));
  const x0 = 280 - (cell * side) / 2;
  let out = "";
  for (let r = 0; r < side; r += 1) for (let c = 0; c < side; c += 1) out += keyed(`q${r}-${c}`, x0 + c * cell, 24 + r * cell, `<rect width="${cell - 2}" height="${cell - 2}" rx="2" fill="${COLORS.whole}" fill-opacity=".85"/>`);
  if (mark) out += txt(x0 - 14, 24 + (cell * side) / 2 + 6, String(side), { size: 18, anchor: "end" }) + txt(280, 24 + cell * side + 24, String(side), { size: 18 });
  return svgWrap(out, "", { h: 60 + cell * side });
}
function chainSvg(s, upto) {
  const parts = Array.from({ length: s.e }, () => String(s.b)).join(" × ");
  let out = txt(280, 70, `${s.b}^${s.e}`, { size: 34 }) + txt(280, 120, parts.length > 30 ? `${s.b} × ${s.b} × … × ${s.b}` : parts, { size: 24, fill: COLORS.whole });
  for (let i = 1; i <= upto; i += 1) out += txt(60 + (i - 1) * (460 / Math.max(s.e, 1)) + 40, 175, comma(s.b ** i), { size: 18, fill: i === s.e ? COLORS.part : COLORS.mute, weight: i === s.e ? 900 : 600 });
  return svgWrap(out, "", { h: 210 });
}
const mk = (id, cap, easy, eq, svg, alt, meta = {}) => Object.assign(frame({ id, cap, easy, eq, svg: svg.replace('aria-label=""', `aria-label="${esc(alt.en)}"`), alt }), { meta });

export function frames(s) {
  if (s.mode === "root") {
    const alt = (k) => L(`${k} by ${k} square of tiles.`, `Cuadrado de ${k} por ${k} fichas.`);
    return [
      mk("tiles", L(`√${s.n} asks: what side length makes a square of ${s.n} tiles?`, `√${s.n} pregunta: ¿qué longitud de lado forma un cuadrado de ${s.n} fichas?`), L(`A square of ${s.n} tiles.`, `Un cuadrado de ${s.n} fichas.`), `√${s.n}`, squareSvg(s.side), alt(s.side), { side: s.side, tiles: s.n }),
      mk("side", L(`Count along one side: ${s.side} tiles. The square has ${s.side} rows of ${s.side}.`, `Cuenta a lo largo de un lado: ${s.side} fichas. El cuadrado tiene ${s.side} filas de ${s.side}.`), L(`One side is ${s.side}.`, `Un lado mide ${s.side}.`), `√${s.n}`, squareSvg(s.side, { mark: true }), alt(s.side), { side: s.side, tiles: s.n }),
      mk("check", L(`${s.side} × ${s.side} = ${s.n}, so √${s.n} = ${s.side}.`, `${s.side} × ${s.side} = ${s.n}, así que √${s.n} = ${s.side}.`), L(`${s.side} × ${s.side} = ${s.n}.`, `${s.side} × ${s.side} = ${s.n}.`), `√${s.n} = ${s.side}`, squareSvg(s.side, { mark: true }), alt(s.side), { side: s.side, tiles: s.n }),
    ];
  }
  const alt = (k) => L(`${s.b} used as a factor ${s.e} times; running products up to ${s.b ** k}.`, `${s.b} usado como factor ${s.e} veces; productos hasta ${s.b ** k}.`);
  const chain = [mk("meaning", L(`${s.b}^${s.e} means ${s.b} is used as a factor ${s.e} times. It does not mean ${s.b} × ${s.e}.`, `${s.b}^${s.e} significa que ${s.b} se usa como factor ${s.e} veces. No significa ${s.b} × ${s.e}.`), L(`${s.e} factors of ${s.b}.`, `${s.e} factores de ${s.b}.`), `${s.b}^${s.e}`, chainSvg(s, 0), alt(0), { factors: s.e, base: s.b })];
  for (let i = 2; i <= s.e; i += 1)
    chain.push(mk(`step${i}`, L(`${i === 2 ? `${s.b} × ${s.b}` : `${s.b ** (i - 1)} × ${s.b}`} = ${comma(s.b ** i)}.`, `${i === 2 ? `${s.b} × ${s.b}` : `${s.b ** (i - 1)} × ${s.b}`} = ${comma(s.b ** i)}.`), L(`${comma(s.b ** i)}.`, `${comma(s.b ** i)}.`), `${s.b}^${i} = ${comma(s.b ** i)}`, chainSvg(s, i), alt(i), { factors: i, base: s.b, product: s.b ** i }));
  if (s.e === 1) chain.push(mk("one", L(`One factor of ${s.b} is just ${s.b}.`, `Un factor de ${s.b} es solo ${s.b}.`), L(`${s.b}.`, `${s.b}.`), `${s.b}^1 = ${s.b}`, chainSvg(s, 1), alt(1), { factors: 1, base: s.b, product: s.b }));
  return chain;
}

export const answer = (s) => s.result;

export function predicts(s) {
  if (s.mode === "root")
    return [{ at: 2, q: L(`Which is the same as √${s.n}: the side of a square of ${s.n} tiles, or half of ${s.n}?`, `¿Qué es igual a √${s.n}: el lado de un cuadrado de ${s.n} fichas, o la mitad de ${s.n}?`), choices: [
      { t: L("The side of the square.", "El lado del cuadrado."), ok: true, why: L("A square root undoes squaring: it is the side that gives that many tiles.", "Una raíz cuadrada deshace elevar al cuadrado: es el lado que da esa cantidad de fichas.") },
      { t: L(`Half of ${s.n}.`, `La mitad de ${s.n}.`), ok: false, why: L("Halving splits the tiles in two; it does not make a square.", "Partir por la mitad divide las fichas en dos; no forma un cuadrado.") },
    ], explain: [{ t: L("Because squaring multiplies a number by itself, and the root finds that number.", "Porque elevar al cuadrado multiplica un número por sí mismo, y la raíz halla ese número."), ok: true }, { t: L("Because the root always divides by 2.", "Porque la raíz siempre divide entre 2."), ok: false }] }];
  if (s.e < 2) return [];
  return [{ at: 1, q: L(`${s.b}^${s.e}: is that ${s.b} × ${s.e}, or ${s.b} used as a factor ${s.e} times?`, `${s.b}^${s.e}: ¿es ${s.b} × ${s.e}, o ${s.b} usado como factor ${s.e} veces?`), choices: [
    { t: L(`${s.b} used as a factor ${s.e} times.`, `${s.b} usado como factor ${s.e} veces.`), ok: true, why: L("The exponent counts how many times the base is multiplied by itself.", "El exponente cuenta cuántas veces se multiplica la base por sí misma.") },
    { t: L(`${s.b} × ${s.e}.`, `${s.b} × ${s.e}.`), ok: false, why: L("The exponent is a count of factors, not a number to multiply by.", "El exponente es un conteo de factores, no un número por el que multiplicar.") },
  ], explain: [{ t: L("Because an exponent tells how many copies of the base are multiplied together.", "Porque un exponente dice cuántas copias de la base se multiplican entre sí."), ok: true }, { t: L("Because the exponent is just another factor.", "Porque el exponente es solo otro factor."), ok: false }] }];
}

export function hints(s) {
  const list = frames(s);
  if (s.mode === "root")
    return [{ text: L("A square root asks for the side of a square with that many tiles.", "Una raíz cuadrada pide el lado de un cuadrado con esa cantidad de fichas.") }, { text: L("Picture the tiles in a square; one side is what you want.", "Imagina las fichas en un cuadrado; un lado es lo que buscas."), frame: { ...list[0], svg: squareSvg(s.side) } }, { text: L("Which number times itself gives the number of tiles?", "¿Qué número por sí mismo da el número de fichas?"), frame: { ...list[0], svg: squareSvg(s.side) } }];
  const peek = { ...list[0], svg: chainSvg(s, 0) };
  return [{ text: L("The little number says how many times to use the big number as a factor.", "El número pequeño dice cuántas veces usar el número grande como factor.") }, { text: L("Write the base out as many times as the exponent says.", "Escribe la base tantas veces como dice el exponente."), frame: peek }, { text: L("Multiply two at a time, left to right, keeping a running product.", "Multiplica de dos en dos, de izquierda a derecha, llevando un producto parcial."), frame: peek }];
}

export function diagnose(s, raw) {
  const v = num(raw);
  if (v === null || v === s.result) return null;
  if (s.mode === "exp" && v === s.b * s.e) return "multipliedByExponent";
  if (s.mode === "root" && v === s.n / 2) return "halved";
  return null;
}
export const tags = {
  multipliedByExponent: { label: L("Multiplied the base by the exponent", "Multiplicó la base por el exponente"), tip: L("An exponent counts factors: write the base that many times, then multiply.", "Un exponente cuenta factores: escribe la base esas veces y luego multiplica.") },
  halved: { label: L("Took half instead of the square root", "Tomó la mitad en lugar de la raíz cuadrada"), tip: L("The square root is the side of a square of that many tiles, not half of the number.", "La raíz cuadrada es el lado de un cuadrado con esa cantidad de fichas, no la mitad del número.") },
};

export const build = {
  prompt: (s) => (s.mode === "root" ? L(`Make a square of ${s.n} tiles. How long is its side?`, `Forma un cuadrado de ${s.n} fichas. ¿Cuánto mide su lado?`) : L(`Build ${s.b}^${s.e} one factor at a time.`, `Construye ${s.b}^${s.e} un factor a la vez.`)),
  init: (s) => (s.mode === "root" ? { k: 1 } : { f: 1 }),
  render(st, s) {
    if (s.mode === "root") {
      const alt = L(`${st.k} by ${st.k} square, ${st.k * st.k} tiles.`, `Cuadrado de ${st.k} por ${st.k}, ${st.k * st.k} fichas.`);
      return { svg: squareSvg(st.k, { mark: true }).replace('aria-label=""', `aria-label="${esc(alt.en)}"`), alt, controls: [{ id: "k", arg: -1, label: L("Shorter side", "Lado más corto") }, { id: "k", arg: 1, label: L("Longer side", "Lado más largo") }], status: st.k === s.side ? L(`${st.k} × ${st.k} = ${s.n} tiles. So √${s.n} = ${st.k}.`, `${st.k} × ${st.k} = ${s.n} fichas. Así √${s.n} = ${st.k}.`) : L(`${st.k} × ${st.k} = ${st.k * st.k} tiles, and we need ${s.n}.`, `${st.k} × ${st.k} = ${st.k * st.k} fichas, y necesitamos ${s.n}.`) };
    }
    const alt = L(`${st.f} factors of ${s.b}, product ${comma(s.b ** st.f)}.`, `${st.f} factores de ${s.b}, producto ${comma(s.b ** st.f)}.`);
    return { svg: chainSvg({ ...s, e: Math.max(st.f, 1) }, st.f).replace('aria-label=""', `aria-label="${esc(alt.en)}"`), alt, controls: [{ id: "f", arg: 1, label: L(`Multiply by ${s.b} again`, `Multiplicar por ${s.b} otra vez`) }, { id: "f", arg: -1, label: L("Take a factor away", "Quitar un factor") }], status: st.f === s.e ? L(`${s.e} factors of ${s.b}: ${s.b}^${s.e} = ${comma(s.result)}.`, `${s.e} factores de ${s.b}: ${s.b}^${s.e} = ${comma(s.result)}.`) : L(`${st.f} factor${st.f === 1 ? "" : "s"} so far. The exponent says ${s.e}.`, `${st.f} factor${st.f === 1 ? "" : "es"} hasta ahora. El exponente dice ${s.e}.`) };
  },
  act(st, id, arg, s) {
    const key = s.mode === "root" ? "k" : "f";
    const max = s.mode === "root" ? 25 : s.e + 2;
    const v = Math.min(max, Math.max(1, st[key] + arg));
    return { state: { [key]: v }, ok: v !== st[key], msg: v === st[key] ? L("That is as far as this goes.", "Hasta aquí se puede.") : null };
  },
  done: (st, s) => (s.mode === "root" ? st.k === s.side : st.f === s.e),
};
