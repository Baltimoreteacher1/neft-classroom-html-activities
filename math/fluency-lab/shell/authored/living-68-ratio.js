// Living models for rate and percent reasoning (Grade 6). Each draws a tape diagram or double number line, a
// table and an equation from ONE state, so the representations always agree.
import { L, livingModel, svg, table, text } from "./kit-68.js";

const Q1 = "var(--q1)";
const Q2 = "var(--q2)";

// Percent: the state is a percent from a fixed list and the size of one equal group. The whole is split into
// n equal groups (n = 100 ÷ gcd(percent, 100)); the percent covers m of them. Every number is then whole.
export const PERCENTS = [10, 20, 25, 30, 40, 50, 60, 75, 80, 90];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
export function percentState(p, g) {
  const n = 100 / gcd(p, 100);
  const m = (p * n) / 100;
  return { n, m, whole: n * g, part: m * g, each: 100 / n };
}

export function percentModel(mode) {
  return livingModel({
    label: L("Change the model", "Cambia el modelo"),
    sliders: [
      {
        id: "pi",
        label: L("Percent", "Porcentaje"),
        min: 0,
        max: PERCENTS.length - 1,
        step: 1,
        value: 2,
        show: (v) => `${PERCENTS[v]}%`,
      },
      {
        id: "g",
        label: L("Size of one equal part", "Tamaño de una parte igual"),
        min: 1,
        max: 12,
        step: 1,
        value: 10,
      },
    ],
    render(s, T) {
      const p = PERCENTS[s.pi];
      const { n, m, whole, part, each } = percentState(p, s.g);
      // Layout: tape (equal parts) on top, then the double number line: percents above, amounts below,
      // one vertical link where the percent meets its part. Every number is drawn from (p, g).
      const X0 = 16;
      const W = 300;
      const w = W / n;
      const xp = X0 + m * w;
      const close = X0 + W - xp < 52; // the part label would touch the 100% / whole label
      const segs = [];
      for (let i = 0; i < n; i += 1) {
        const x = X0 + i * w;
        segs.push(
          `<rect x="${x}" y="28" width="${w}" height="36" fill="${i < m ? Q1 : "var(--surface, #fff)"}" fill-opacity="${i < m ? 0.28 : 1}" stroke="var(--ink-2)" stroke-width="1.5"/>`,
          text(x + w / 2, 52, String(s.g), n === 10 ? 'font-size="12"' : ""),
        );
      }
      const ticks = [];
      for (let i = 0; i <= n; i += 1) {
        const x = X0 + i * w;
        ticks.push(`<line x1="${x}" y1="104" x2="${x}" y2="112" class="lm-tick"/><line x1="${x}" y1="142" x2="${x}" y2="150" class="lm-tick"/>`);
        if (n <= 5 && i > 0 && i < n && i !== m)
          ticks.push(text(x, 96, `${each * i}%`, 'font-size="12" fill="var(--ink-2)"'), text(x, 170, String(s.g * i), 'font-size="12" fill="var(--ink-2)"'));
      }
      const tape = svg(
        332,
        close ? 196 : 180,
        T(
          L(
            `Tape diagram: the whole, ${whole}, is ${n} equal parts of ${s.g}; ${m} of them are shaded, which is ${p}% or ${part}. Double number line: ${p}% lines up with ${part} and 100% with ${whole}.`,
            `Diagrama de cinta: el total, ${whole}, son ${n} partes iguales de ${s.g}; ${m} están sombreadas, que son el ${p} % o ${part}. Recta numérica doble: ${p} % corresponde a ${part} y 100 % a ${whole}.`,
          ),
        ),
        `${text(X0 + W / 2, 18, T(L(`whole = ${whole}`, `total = ${whole}`)), 'fill="var(--q2)"')}${segs.join("")}
         <line x1="${X0}" y1="108" x2="${X0 + W}" y2="108" class="lm-axis"/><line x1="${X0}" y1="146" x2="${X0 + W}" y2="146" class="lm-axis"/>${ticks.join("")}
         <line x1="${xp}" y1="64" x2="${xp}" y2="146" class="lm-link"/>
         ${text(X0, 96, "0%")}${text(X0 + W, 96, "100%", 'text-anchor="end"')}${text(xp, close ? 78 : 96, `${p}%`, `fill="${Q1}"`)}
         ${text(X0, 170, "0")}${text(X0 + W, 170, String(whole), `fill="${Q2}" text-anchor="end"`)}${text(xp, close ? 188 : 170, String(part), `fill="${Q1}"`)}`,
      );
      const rows = [[T(L("Percent", "Porcentaje")), T(L("Amount", "Cantidad"))]];
      for (const [pc, amt] of [[each, s.g], [p, part], [100, whole]]) if (!rows.some((r) => r[0] === `${pc}%`)) rows.push([`${pc}%`, String(amt)]);
      const tab = table(T(L("Percent table", "Tabla de porcentajes")), rows, rows.findIndex((r) => r[0] === `${p}%`) - 1);
      const eq =
        mode === "part"
          ? T(
              L(
                `${p}% of ${whole} = [[${p}/100]] × ${whole} = [[${m}/${n}]] × ${whole} = ${part}`,
                `${p} % de ${whole} = [[${p}/100]] × ${whole} = [[${m}/${n}]] × ${whole} = ${part}`,
              ),
            )
          : T(
              L(
                m === 1
                  ? `${part} is ${p}% of the whole, and ${p}% is one of ${n} equal parts. So the whole is ${n} × ${part} = ${whole}.`
                  : `${part} is ${p}% of the whole. ${p}% is ${m} of ${n} equal parts, so one part is ${part} ÷ ${m} = ${s.g}, and the whole is ${n} × ${s.g} = ${whole}.`,
                m === 1
                  ? `${part} es el ${p} % del total, y el ${p} % es una de ${n} partes iguales. Así que el total es ${n} × ${part} = ${whole}.`
                  : `${part} es el ${p} % del total. El ${p} % son ${m} de ${n} partes iguales, así que una parte es ${part} ÷ ${m} = ${s.g}, y el total es ${n} × ${s.g} = ${whole}.`,
              ),
            );
      return { svg: tape, table: tab, eq };
    },
  });
}

// Unit rate: price for one item and number of items; total = rate × items. The double number line puts items
// above and dollars below, so 1 ↔ the unit rate and k ↔ the total line up on one vertical.
export const unitRateModel = livingModel({
  label: L("Change the model", "Cambia el modelo"),
  sliders: [
    {
      id: "u",
      label: L("Dollars for 1 item", "Dólares por 1 artículo"),
      min: 1,
      max: 12,
      step: 1,
      value: 3,
    },
    {
      id: "k",
      label: L("Number of items", "Número de artículos"),
      min: 1,
      max: 8,
      step: 1,
      value: 4,
    },
  ],
  render(s, T) {
    const total = s.u * s.k;
    const step = 236 / 8;
    const marks = [];
    for (let i = 0; i <= 8; i += 1) {
      const x = 80 + i * step;
      marks.push(
        `<line x1="${x}" y1="30" x2="${x}" y2="40" class="lm-tick"/>${text(x, 24, String(i), i === 1 || i === s.k ? `class="lm-num lm-on" fill="${Q1}"` : `fill="${Q1}"`)}`,
        `<line x1="${x}" y1="70" x2="${x}" y2="80" class="lm-tick"/>${text(x, 98, String(s.u * i), i === 1 || i === s.k ? `class="lm-num lm-on" fill="${Q2}"` : `fill="${Q2}"`)}`,
      );
    }
    const pic = svg(
      332,
      112,
      T(
        L(
          `Double number line: items 0 to 8 above, dollars below; 1 item matches ${s.u} dollars and ${s.k} items match ${total} dollars.`,
          `Recta numérica doble: artículos de 0 a 8 arriba y dólares abajo; 1 artículo corresponde a ${s.u} dólares y ${s.k} artículos a ${total} dólares.`,
        ),
      ),
      `<line x1="80" y1="35" x2="316" y2="35" class="lm-axis"/><line x1="80" y1="75" x2="316" y2="75" class="lm-axis"/>
       <line x1="${80 + step}" y1="35" x2="${80 + step}" y2="75" class="lm-link"/><line x1="${80 + s.k * step}" y1="35" x2="${80 + s.k * step}" y2="75" class="lm-link"/>${marks.join("")}
       ${text(0, 40, T(L("items", "artículos")), `text-anchor="start" font-size="12" fill="${Q1}"`)}${text(0, 80, T(L("dollars", "dólares")), `text-anchor="start" font-size="12" fill="${Q2}"`)}`,
    );
    const rows = [[T(L("Items", "Artículos")), T(L("Dollars", "Dólares"))]];
    for (const i of [...new Set([1, 2, s.k])].sort((a, b) => a - b))
      rows.push([String(i), String(s.u * i)]);
    return {
      svg: pic,
      table: table(T(L("Rate table", "Tabla de tasas")), rows, rows.length - 2),
      eq: T(
        L(
          `${s.k} items cost $${total}. ${total} ÷ ${s.k} = ${s.u}, so the unit rate is $${s.u} for 1 item.`,
          `${s.k} artículos cuestan $${total}. ${total} ÷ ${s.k} = ${s.u}, así que la tasa unitaria es $${s.u} por 1 artículo.`,
        ),
      ),
    };
  },
});
