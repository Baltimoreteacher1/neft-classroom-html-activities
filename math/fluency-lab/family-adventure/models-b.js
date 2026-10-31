/* Hands-on models, part 2: fraction bars (two bars, same whole) and base-ten blocks (whole numbers and decimals). */
import { h, p } from "./core.js";
import { fmt, modelButton, statusLine, stepper } from "./model-kit.js";

const DENOMS = [2, 3, 4, 5, 6, 8, 10, 12];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/* ---- Fraction bars -------------------------------------------------------------------------------------------- */
export function fractionBars(
  host,
  K,
  { initial, onChange, fixedDen = false, bars = 2, masked = false } = {},
) {
  let hide = masked;
  const state =
    initial?.bars?.length === bars
      ? structuredClone(initial)
      : {
          bars: [
            { n: 0, d: 3 },
            { n: 0, d: 4 },
          ].slice(0, bars),
        };
  const st = statusLine();
  const compare = h("p", { class: "m-equation", "aria-live": "off" });
  const names = ["A", "B"];
  const rows = state.bars.map((bar, i) => {
    const track = h("div", { class: `fb-track fb-${names[i]}`, role: "group" });
    const label = h(
      "span",
      { class: "fb-name" },
      `${K.one() === "es" ? "Barra" : "Bar"} ${names[i]}`,
    );
    let den;
    if (!fixedDen) {
      den = stepper(K, p(`Equal parts, bar ${names[i]}`, `Partes iguales, barra ${names[i]}`), {
        min: 0,
        max: DENOMS.length - 1,
        value: Math.max(0, DENOMS.indexOf(bar.d)),
        format: (idx) => String(DENOMS[idx]),
        onChange: (idx) => {
          bar.d = DENOMS[idx];
          bar.n = Math.min(bar.n, bar.d);
          paint();
          emit();
        },
      });
    }
    return { bar, track, label, den };
  });
  const paint = () => {
    const parts = [];
    for (const [i, { bar, track, label }] of rows.entries()) {
      track.replaceChildren(
        ...Array.from({ length: bar.d }, (_, k) => {
          const b = h("button", {
            type: "button",
            class: "fb-part",
            "aria-pressed": String(k < bar.n),
            "aria-label": `${K.one() === "es" ? "Parte" : "Part"} ${k + 1} ${K.one() === "es" ? "de" : "of"} ${bar.d}`,
          });
          b.addEventListener("click", () => {
            bar.n = k < bar.n ? k : k + 1;
            paint();
            emit();
            track.querySelectorAll("button")[k]?.focus();
          });
          return b;
        }),
      );
      track.setAttribute(
        "aria-label",
        `${K.one() === "es" ? "Barra" : "Bar"} ${names[i]}: ${bar.n}/${bar.d}`,
      );
      label.textContent = `${K.one() === "es" ? "Barra" : "Bar"} ${names[i]}: ${bar.n}/${bar.d}`;
      parts.push(`${names[i]} ${bar.n}/${bar.d}`);
    }
    if (rows.length === 2) {
      const [a, b] = state.bars;
      const lhs = a.n * b.d;
      const rhs = b.n * a.d;
      const es = K.one() === "es";
      const text =
        !a.n && !b.n
          ? es
            ? "Sombrea partes en cada barra para comparar."
            : "Shade parts on each bar to compare."
          : lhs === rhs
            ? es
              ? "Las dos barras sombrean la misma cantidad del entero."
              : "Both bars shade the same amount of the whole."
            : lhs > rhs
              ? es
                ? "La barra A sombrea más del entero."
                : "Bar A shades more of the whole."
              : es
                ? "La barra B sombrea más del entero."
                : "Bar B shades more of the whole.";
      const neutral = es
        ? "Mira cuánto del entero sombrea cada barra."
        : "Look at how much of the whole each bar shades.";
      compare.textContent = hide ? neutral : text;
      st.say(`${parts.join(", ")}. ${hide ? neutral : text}`);
    } else st.say(parts.join(", "));
  };
  const emit = () => onChange?.(structuredClone(state));
  host.append(
    ...rows.flatMap(({ track, label, den }) => [
      h("div", { class: "fb-row" }, label, track, den?.el),
    ]),
    compare,
    st.el,
  );
  paint();
  return {
    get: () => structuredClone(state),
    set: () => {},
    reveal: () => {
      hide = false;
      paint();
    },
  };
}

/** True when two fractions name the same amount. */
export const sameAmount = (a, b) => a.n * b.d === b.n * a.d;
export const lowest = (n, d) => (n ? `${n / gcd(n, d)}/${d / gcd(n, d)}` : "0");

/* ---- Base-ten blocks ------------------------------------------------------------------------------------------ */
export function baseTen(
  host,
  K,
  { initial = { h: 0, t: 0, o: 0, decimal: false }, onChange, lockMode = false } = {},
) {
  const s = { ...initial };
  const st = statusLine();
  const value = h("p", { class: "bt-value", "aria-hidden": "true" });
  const pieces = h("div", { class: "bt-stage", role: "img" });
  const row = (key, nameWhole, nameDec, cls) => {
    const out = h("output", { class: "m-step-val" }, "0");
    const minus = h("button", { type: "button", class: "m-step-btn" }, "−");
    const plus = h("button", { type: "button", class: "m-step-btn" }, "+");
    const label = h("span", { class: "m-step-label" });
    minus.addEventListener("click", () => bump(key, -1));
    plus.addEventListener("click", () => bump(key, 1));
    return {
      key,
      out,
      minus,
      plus,
      label,
      nameWhole,
      nameDec,
      cls,
      el: h("div", { class: "bt-row" }, label, h("div", { class: "m-step-row" }, minus, out, plus)),
    };
  };
  const rows = [
    row("h", p("Flats (100)", "Placas (100)"), p("Flats (1)", "Placas (1)"), "bt-flat"),
    row("t", p("Rods (10)", "Barras (10)"), p("Rods (0.1)", "Barras (0.1)"), "bt-rod"),
    row("o", p("Units (1)", "Cubitos (1)"), p("Units (0.01)", "Cubitos (0.01)"), "bt-unit"),
  ];
  const caps = { h: 9, t: 19, o: 19 };
  const bump = (k, d) => {
    s[k] = Math.max(0, Math.min(caps[k], s[k] + d));
    paint();
    onChange?.({ ...s });
  };
  const trade = (from, to) => {
    s[from] -= 10;
    s[to] += 1;
    paint();
    onChange?.({ ...s });
  };
  const tradeO = modelButton(
    K,
    p("Trade 10 units for 1 rod", "Cambiar 10 cubitos por 1 barra"),
    () => trade("o", "t"),
    "m-btn",
  );
  const tradeT = modelButton(
    K,
    p("Trade 10 rods for 1 flat", "Cambiar 10 barras por 1 placa"),
    () => trade("t", "h"),
    "m-btn",
  );
  const modeBtn = modelButton(
    K,
    p("Switch: whole numbers / decimals", "Cambiar: números enteros / decimales"),
    () => {
      s.decimal = !s.decimal;
      paint();
      onChange?.({ ...s });
    },
    "m-btn m-btn-quiet",
  );
  const paint = () => {
    const dec = s.decimal;
    for (const r of rows) {
      r.out.textContent = String(s[r.key]);
      r.label.textContent = K.only(dec ? r.nameDec : r.nameWhole);
      r.minus.disabled = s[r.key] <= 0;
      r.plus.disabled = s[r.key] >= caps[r.key];
      r.minus.setAttribute("aria-label", `${r.label.textContent} −`);
      r.plus.setAttribute("aria-label", `${r.label.textContent} +`);
    }
    pieces.replaceChildren(
      ...["h", "t", "o"].map((k) =>
        h(
          "span",
          { class: `bt-group bt-g-${k}` },
          Array.from({ length: s[k] }, () =>
            h("i", { class: `bt-piece ${rows.find((r) => r.key === k).cls}` }),
          ),
        ),
      ),
    );
    const total = dec ? s.h + s.t / 10 + s.o / 100 : s.h * 100 + s.t * 10 + s.o;
    value.textContent = fmt(total);
    tradeO.disabled = s.o < 10;
    tradeT.disabled = s.t < 10 || s.h >= caps.h;
    const es = K.one() === "es";
    const spoken = dec
      ? es
        ? `${s.h} placas, ${s.t} barras y ${s.o} cubitos. Valor: ${fmt(total)}.`
        : `${s.h} flats, ${s.t} rods and ${s.o} units. Value: ${fmt(total)}.`
      : es
        ? `${s.h} placas, ${s.t} barras y ${s.o} cubitos. Valor: ${total}.`
        : `${s.h} flats, ${s.t} rods and ${s.o} units. Value: ${total}.`;
    pieces.setAttribute("aria-label", spoken);
    st.say(spoken);
  };
  host.append(
    pieces,
    value,
    h(
      "div",
      { class: "bt-controls" },
      rows.map((r) => r.el),
    ),
    h("div", { class: "m-row" }, tradeO, tradeT, lockMode ? null : modeBtn),
    st.el,
  );
  paint();
  return { get: () => ({ ...s }), set: () => {} };
}
