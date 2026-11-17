// Family Math Studio "kcf" model: dividing fractions with Keep, Change, Flip, drawn one step per group.
//
//   data: { dividend: "3/4", divisor: "6" }      each is a whole number, a fraction or a mixed number ("1 1/2")
//
// The picture is four top-level groups so the "Watch it" explainer reveals one per worked-example step:
//   1 the problem   2 both numbers as fractions (only when something needed converting)
//   3 Keep, Change, Flip, each move on its own chip   4 multiply across and simplify
// Pure function, deterministic, exact integer arithmetic. A bad value THROWS, like every model in the library.

import { PAD, RADIUS, W, assertKeys, mathText, need, text } from "./math-kit.mjs";

const tr = (lang, en, es) => (lang === "es" ? es : en);
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const style = (px) => ` style="font-size:${px}px"`;

/** "6" | "3/4" | "1 1/2" -> { n, d, kind: "whole" | "fraction" | "mixed" }; anything else throws. */
export function parseKcfNumber(value, field) {
  const s = String(value ?? "").trim();
  let m = s.match(/^(\d+)$/);
  if (m) return { n: Number(m[1]), d: 1, kind: "whole" };
  m = s.match(/^(\d+)\/(\d+)$/);
  if (m && Number(m[2]) > 0) return { n: Number(m[1]), d: Number(m[2]), kind: "fraction" };
  m = s.match(/^(\d+) (\d+)\/(\d+)$/);
  if (m && Number(m[3]) > 0) return { n: Number(m[1]) * Number(m[3]) + Number(m[2]), d: Number(m[3]), kind: "mixed" };
  throw new Error(`model "kcf": data.${field} must be a whole number, a fraction like 3/4 or a mixed number like 1 1/2; got ${JSON.stringify(value)}`);
}

const fr = (x) => `${x.n}/${x.d}`;
const frOrWhole = (x) => (x.d === 1 ? String(x.n) : fr(x));

function step(cls, x, y, w, label) {
  return `<rect class="${cls}" x="${x - w / 2}" y="${y}" width="${w}" height="30" rx="${RADIUS}"/>${text(x, y + 20, label, { cls: "m-t m-n" })}`;
}

export function renderKcf(d, { lang }) {
  assertKeys(d, ["dividend", "divisor"], 'model "kcf" data');
  need(d, "kcf", "dividend", "divisor");
  const a = parseKcfNumber(d.dividend, "dividend");
  const b = parseKcfNumber(d.divisor, "divisor");
  if (b.n === 0) throw new Error('model "kcf": data.divisor cannot be zero');
  const convert = a.kind !== "fraction" || b.kind !== "fraction";
  const prob = (x, src) => (x.kind === "fraction" ? fr(x) : String(src).trim());
  const cx = [W * 0.2, W * 0.5, W * 0.8];
  const flipped = { n: b.d, d: b.n };
  const prodN = a.n * flipped.n;
  const prodD = a.d * flipped.d;
  const g = gcd(prodN, prodD);
  const simple = { n: prodN / g, d: prodD / g };
  const showSimple = g > 1;
  const smaller = prodN * a.d < a.n * prodD;

  const groups = [];
  let y = 4;

  // 1 the problem
  groups.push(
    `<g>${text(W / 2, y + 12, tr(lang, "The problem", "El problema"), { cls: "m-t" })}${mathText(W / 2, y + 52, `${prob(a, d.dividend)} ÷ ${prob(b, d.divisor)}`, { size: 26 })}</g>`,
  );
  y += 78;

  // 2 both numbers as fractions
  if (convert) {
    groups.push(
      `<g>${text(W / 2, y + 12, tr(lang, "Write each number as a fraction", "Escribe cada número como fracción"), { cls: "m-t" })}${mathText(W / 2, y + 52, `${fr(a)} ÷ ${fr(b)}`, { size: 26 })}</g>`,
    );
    y += 78;
  }

  // 3 Keep, Change, Flip
  const kcfTop = y;
  const lineY = kcfTop + 50;
  const chipY = kcfTop + 66;
  const newY = kcfTop + 168;
  groups.push(
    `<g>${text(W / 2, kcfTop + 12, tr(lang, "Keep, Change, Flip", "Mantener, Cambiar, Invertir"), { cls: "m-t" })}` +
      mathText(cx[0], lineY, fr(a), { size: 24 }) +
      text(cx[1], lineY, "÷", { cls: "m-t m-n", extra: style(24) }) +
      mathText(cx[2], lineY, fr(b), { size: 24 }) +
      step("m-p", cx[0], chipY, 92, tr(lang, "Keep", "Mantener")) +
      step("m-u", cx[1], chipY, 92, tr(lang, "Change", "Cambiar")) +
      step("m-a", cx[2], chipY, 92, tr(lang, "Flip", "Invertir")) +
      [0, 1, 2].map((i) => `<path class="m-ln" d="M${cx[i]} ${chipY + 34}v26"/>`).join("") +
      [0, 1, 2].map((i) => `<polygon class="m-arr" points="${cx[i]},${chipY + 68} ${cx[i] - 5},${chipY + 60} ${cx[i] + 5},${chipY + 60}"/>`).join("") +
      mathText(cx[0], newY, fr(a), { size: 24 }) +
      text(cx[1], newY, "×", { cls: "m-t m-n", extra: style(24) }) +
      mathText(cx[2], newY, fr(flipped), { size: 24 }) +
      `</g>`,
  );
  y = newY + 30;

  // 4 multiply across, simplify
  const eq = `${fr(a)} × ${fr(flipped)} = ${prodN}/${prodD}${showSimple ? ` = ${frOrWhole(simple)}` : ""}`;
  groups.push(
    `<g><rect class="m-a" x="${PAD}" y="${y}" width="${W - 2 * PAD}" height="${showSimple ? 94 : 72}" rx="${RADIUS}"/>` +
      text(W / 2, y + 22, tr(lang, "Multiply across", "Multiplica en línea"), { cls: "m-t" }) +
      mathText(W / 2, y + 54, eq, { size: 18 }) +
      (showSimple ? text(W / 2, y + 86, tr(lang, "Then simplify", "Luego simplifica"), { cls: "m-t" }) : "") +
      `</g>`,
  );
  y += (showSimple ? 94 : 72) + 6;

  const answer = frOrWhole(showSimple ? simple : { n: prodN, d: prodD });
  const desc = tr(
    lang,
    `Keep, Change, Flip for ${fr(a)} ÷ ${fr(b)}: keep ${fr(a)}, change divide to multiply, flip ${fr(b)} to ${fr(flipped)}. Then ${fr(a)} × ${fr(flipped)} = ${answer}, which is ${smaller ? "less" : "more"} than ${fr(a)}.`,
    `Mantener, Cambiar, Invertir para ${fr(a)} ÷ ${fr(b)}: mantén ${fr(a)}, cambia dividir por multiplicar, invierte ${fr(b)} a ${fr(flipped)}. Luego ${fr(a)} × ${fr(flipped)} = ${answer}, que es ${smaller ? "menos" : "más"} que ${fr(a)}.`,
  );
  return { h: y, body: groups.join(""), desc };
}
