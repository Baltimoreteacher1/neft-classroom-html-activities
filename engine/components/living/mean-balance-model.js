// living/mean-balance-model.js — the mathematics of the mean-balance play.
//
// Pure functions only (no DOM): every number the play shows a student is
// computed here, so mean-balance.test.mjs can check each one in node.

export const MAX_DATA_BLOCKS = 8; // tallest tower a config may author

export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
export const near = (x, y) => Math.abs(x - y) < 1e-9;
export const sum = (a) => a.reduce((s, v) => s + v, 0);

/** n, total, mean, median, midrange, min, max of a list of numbers. */
export function stats(values) {
  const n = values.length;
  const total = sum(values);
  const s = [...values].sort((x, y) => x - y);
  const median = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  return {
    n,
    total,
    mean: total / n,
    median,
    midrange: (s[0] + s[n - 1]) / 2,
    min: s[0],
    max: s[n - 1],
  };
}

/** The predict/transfer choices: the mean plus distinct distractors (≥ 2), or null. */
export function choiceSet(values) {
  const s = stats(values);
  const out = [{ kind: "mean", value: s.mean, correct: true }];
  for (const p of [
    { kind: "median", value: s.median },
    { kind: "midrange", value: s.midrange },
    { kind: "total", value: s.total },
    { kind: "max", value: s.max },
  ]) {
    if (out.length < 4 && !out.some((o) => near(o.value, p.value)))
      out.push({ ...p, correct: false });
  }
  return out.length >= 3 ? out : null;
}

/** Distances from the mean: every row, and the left and right sums (always equal). */
export function balance(values) {
  const { mean } = stats(values);
  const rows = values.map((value, i) => ({
    i,
    value,
    d: Math.abs(value - mean),
    side: value < mean ? "left" : value > mean ? "right" : "on",
  }));
  const left = sum(rows.filter((r) => r.side === "left").map((r) => r.d));
  const right = sum(rows.filter((r) => r.side === "right").map((r) => r.d));
  return { mean, rows, left, right };
}

/** Move one block from tower `from` to tower `to`; null when the move is not allowed. */
export function applyMove(heights, from, to, cap) {
  if (from === to || !(heights[from] > 0) || heights[to] >= cap) return null;
  const next = [...heights];
  next[from] -= 1;
  next[to] += 1;
  return next;
}

export const isLevel = (heights) => heights.every((h) => h === heights[0]);

/** Fewest one-block moves that level the towers: the surplus above the mean. */
export function minMoves(heights) {
  const m = sum(heights) / heights.length;
  return sum(heights.map((h) => Math.max(0, h - m)));
}

/**
 * Which block sits where, for given tower heights: each tower keeps as many of
 * its own blocks as it can; the rest travel, in order, to towers that grew.
 * Blocks are { o: home tower, j: index in that tower }. Used on resume.
 */
export function assignBlocks(orig, heights) {
  const spare = [];
  orig.forEach((h, i) => {
    for (let j = Math.min(h, heights[i]); j < h; j++) spare.push({ o: i, j });
  });
  return heights.map((h, i) => {
    const own = Math.min(orig[i], h);
    const st = [];
    for (let j = 0; j < own; j++) st.push({ o: i, j });
    while (st.length < h) st.push(spare.shift());
    return st;
  });
}

/** "$15", "$12.50", "≈ 13.33" — money keeps cents; repeating means are marked ≈. */
export function fmtVal(v, prefix = "") {
  const r = Math.round(v * 100) / 100;
  const approx = near(r, v) ? "" : "≈ ";
  const body = Number.isInteger(r) ? String(r) : prefix === "$" ? r.toFixed(2) : String(r);
  return `${approx}${prefix}${body}`;
}

const pairOf = (p, fallback) => {
  if (typeof p === "string" && p.trim() && p.length <= 12) return { en: p, es: p };
  if (p && typeof p.en === "string" && p.en.trim() && p.en.length <= 12)
    return { en: p.en, es: typeof p.es === "string" && p.es.trim() ? p.es.slice(0, 12) : p.en };
  return fallback;
};
const storyOf = (s) =>
  s && typeof s.en === "string" && s.en.trim()
    ? { en: s.en.slice(0, 400), es: String(s.es || s.en).slice(0, 400) }
    : null;

function validTransfer(t) {
  const vals = Array.isArray(t?.values) ? t.values.map(Number) : [];
  if (vals.length < 3 || vals.length > 6 || !vals.every((v) => okInt(v, 0, 999))) return null;
  if ((sum(vals) * 100) % vals.length !== 0 || !choiceSet(vals)) return null;
  return { values: vals, story: storyOf(t.story) };
}

export function validateMeanBalance(cfg) {
  const unit = cfg?.unit == null ? 1 : Number(cfg.unit);
  if (!okInt(unit, 1, 100)) return null;
  const values = Array.isArray(cfg?.values) ? cfg.values.map(Number) : [];
  if (values.length < 3 || values.length > 6) return null;
  if (!values.every((v) => Number.isInteger(v) && v % unit === 0)) return null;
  const blocks = values.map((v) => v / unit);
  if (!blocks.every((b) => okInt(b, 0, MAX_DATA_BLOCKS)) || isLevel(blocks)) return null;
  if (sum(blocks) % blocks.length !== 0) return null; // level must be reachable
  const choices = choiceSet(values);
  if (!choices) return null;
  const prefix = typeof cfg.prefix === "string" && cfg.prefix.length <= 2 ? cfg.prefix : "";
  const labels = values.map((_, i) =>
    pairOf(Array.isArray(cfg.labels) ? cfg.labels[i] : null, {
      en: String(i + 1),
      es: String(i + 1),
    }),
  );
  const maxAt = values.indexOf(Math.max(...values));
  const editIndex = okInt(Number(cfg.editIndex), 0, values.length - 1)
    ? Number(cfg.editIndex)
    : maxAt;
  const fallback = { values: [3, 5, 6, 10].map((v) => v * unit), story: null };
  const transfer = validTransfer(cfg.transfer) || fallback;
  return { values, unit, blocks, prefix, labels, story: storyOf(cfg.story), editIndex, transfer };
}

/** Stable position for the correct choice — never always first. */
export function placeCorrect(options, seed) {
  const k = seed % options.length;
  const correct = options.find((o) => o.correct);
  const rest = options.filter((o) => !o.correct);
  rest.splice(k, 0, correct);
  return rest;
}

/** A tick step that keeps a number line to about a dozen labels. */
export function niceStep(range) {
  for (const s of [1, 2, 5, 10, 20, 25, 50, 100]) if (range / s <= 12) return s;
  return 200;
}

/**
 * Every sentence the play says, as {en, es} pairs built from the validated
 * config `v` (validateMeanBalance). Pure: the play only picks the language.
 * `esc` escapes text that lands in HTML (the scene-5 readout).
 */
export function meanBalanceCopy(v) {
  const { values, unit, labels } = v;
  const n = values.length;
  const S = stats(values);
  const f = (x) => fmtVal(x, v.prefix);
  const lab = (i) => labels[i];
  const list = values.map(f).join(", ");
  const tv = v.transfer.values;
  const ts = stats(tv);
  const story = v.transfer.story || { en: "A new data set:", es: "Un conjunto de datos nuevo:" };
  const twoTry = (left) => ({
    en: left === 1 ? "Try one more value." : "Try two more values.",
    es: left === 1 ? "Prueba un valor más." : "Prueba dos valores más.",
  });
  return {
    list,
    kicker: { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" },
    title: { en: "Fair share and balance point", es: "Parte justa y punto de equilibrio" },
    ariaLabel: {
      en: `${n} towers of blocks for the values ${list}. Leveled, every tower is ${f(S.mean)}. As a dot plot, a fulcrum at ${f(S.mean)} balances the distances on each side.`,
      es: `${n} torres de bloques para los valores ${list}. Niveladas, cada torre vale ${f(S.mean)}. Como diagrama de puntos, un apoyo en ${f(S.mean)} equilibra las distancias de cada lado.`,
    },
    printSummary: {
      en: `Data: ${list}. Total ${f(S.total)} shared equally among ${n} is ${f(S.total)} ÷ ${n} = ${f(S.mean)}, the mean (fair share). On a number line the distances below and above ${f(S.mean)} both add up to ${f(balance(values).left)}, so the mean is the balance point.`,
      es: `Datos: ${list}. El total ${f(S.total)} repartido por igual entre ${n} es ${f(S.total)} ÷ ${n} = ${f(S.mean)}, la media (parte justa). En la recta numérica las distancias por debajo y por encima de ${f(S.mean)} suman ${f(balance(values).left)} cada una, así que la media es el punto de equilibrio.`,
    },
    scene: {
      situate: { en: "The data", es: "Los datos" },
      predict: { en: "Predict", es: "Predice" },
      level: { en: "Level the towers", es: "Nivela las torres" },
      balance: { en: "Balance point", es: "Punto de equilibrio" },
      change: { en: "Change one value", es: "Cambia un valor" },
      transfer: { en: "On your own", es: "Por tu cuenta" },
    },
    fairShare: { en: "fair share", es: "parte justa" },
    mean: { en: "mean", es: "media" },
    left: { en: "left", es: "izquierda" },
    right: { en: "right", es: "derecha" },
    towers: { en: "Towers", es: "Torres" },
    startOver: { en: "Start over", es: "Empezar de nuevo" },
    total: { en: `Total: ${f(S.total)}`, es: `Total: ${f(S.total)}` },
    totalAlways: { en: `Total: ${f(S.total)} — always`, es: `Total: ${f(S.total)} — siempre` },
    distance: (i, d) => ({ en: `${lab(i).en}: ${f(d)} away`, es: `${lab(i).es}: a ${f(d)}` }),
    sums(bal) {
      const parts = (side) => bal.rows.filter((r) => r.side === side).map((r) => f(r.d));
      const sideTxt = (xs) => (xs.length > 1 ? `${xs.join(" + ")} = ` : "");
      const L1 = sideTxt(parts("left"));
      const R1 = sideTxt(parts("right"));
      return {
        en: `Left: ${L1}${f(bal.left)}   ·   Right: ${R1}${f(bal.right)}`,
        es: `Izquierda: ${L1}${f(bal.left)}   ·   Derecha: ${R1}${f(bal.right)}`,
      };
    },
    /** A cue for a wrong choice: names what the pick IS, asks a checking question. */
    cue(opt, vals) {
      const k = vals.length;
      const v2 = f(opt.value);
      const tot = f(stats(vals).total);
      if (opt.kind === "total")
        return {
          en: `${v2} is everything put together. Sharing splits that total among ${k}. How much does each one get?`,
          es: `${v2} es todo junto. Repartir divide ese total entre ${k}. ¿Cuánto le toca a cada uno?`,
        };
      const lead = {
        median: {
          en: `${v2} is the middle value when the data are in order.`,
          es: `${v2} es el valor del medio cuando los datos están en orden.`,
        },
        midrange: {
          en: `${v2} is halfway between the smallest and the largest value.`,
          es: `${v2} está a mitad de camino entre el valor menor y el mayor.`,
        },
        max: { en: `${v2} is the largest value.`, es: `${v2} es el valor mayor.` },
      }[opt.kind];
      return {
        en: `${lead.en} If all ${k} were ${v2}, would they add up to the total, ${tot}?`,
        es: `${lead.es} Si los ${k} fueran ${v2}, ¿sumarían el total, ${tot}?`,
      };
    },
    situateSay: {
      en: `${v.story ? `${v.story.en} ` : ""}Each value is a tower of blocks. One block = ${f(unit)}.`,
      es: `${v.story ? `${v.story.es} ` : ""}Cada valor es una torre de bloques. Un bloque = ${f(unit)}.`,
    },
    predictSay: {
      en: `Suppose the ${n} towers shared their blocks so every tower was the same height. How tall would each tower be?`,
      es: `Imagina que las ${n} torres se reparten los bloques para que todas tengan la misma altura. ¿Qué altura tendría cada torre?`,
    },
    predictQ: {
      en: "If everyone shared equally, each tower would be…",
      es: "Si todos repartieran por igual, cada torre sería…",
    },
    predictOk: {
      en: `Yes: ${n} towers of ${f(S.mean)} hold ${n} × ${f(S.mean)} = ${f(S.total)}, the same total as now. Next, level the towers yourself to check.`,
      es: `Sí: ${n} torres de ${f(S.mean)} tienen ${n} × ${f(S.mean)} = ${f(S.total)}, el mismo total que ahora. Ahora nivela tú las torres para comprobarlo.`,
    },
    levelSay: {
      en: `Move blocks from tall towers to short ones until every tower is the same height. The total, ${f(S.total)}, stays on screen the whole time.`,
      es: `Mueve bloques de las torres altas a las bajas hasta que todas tengan la misma altura. El total, ${f(S.total)}, se queda en la pantalla todo el tiempo.`,
    },
    levelHow: {
      en: "Pick a tower to take a block from, then the tower that gets it (tap the towers or use these buttons).",
      es: "Elige una torre para tomar un bloque y luego la torre que lo recibe (toca las torres o usa estos botones).",
    },
    levelDone: {
      en: `Level! Every tower is ${f(S.mean)}. No block was added or removed — the total is still ${f(S.total)}. ${f(S.total)} ÷ ${n} = ${f(S.mean)}: the mean is the fair share.`,
      es: `¡Niveladas! Cada torre vale ${f(S.mean)}. No se agregó ni se quitó ningún bloque: el total sigue siendo ${f(S.total)}. ${f(S.total)} ÷ ${n} = ${f(S.mean)}: la media es la parte justa.`,
    },
    emptySource: {
      en: "That tower has no blocks to give. Pick a tower with blocks.",
      es: "Esa torre no tiene bloques para dar. Elige una torre con bloques.",
    },
    taking: (i) => ({
      en: `Taking a block from ${lab(i).en}. Now pick the tower that gets it.`,
      es: `Tomas un bloque de ${lab(i).es}. Ahora elige la torre que lo recibe.`,
    }),
    atCap: {
      en: "That tower is already as tall as the tallest one started. Give the block to a shorter tower.",
      es: "Esa torre ya es tan alta como la más alta al principio. Dale el bloque a una torre más baja.",
    },
    moved: {
      en: "Moved one block. Watch the total: it does not change.",
      es: "Moviste un bloque. Mira el total: no cambia.",
    },
    balanceSay: {
      en: `Back to the real data. The same blocks drop onto a number line: each tower becomes one dot at its value. Put a fulcrum at the mean, ${f(S.mean)}, and measure each dot's distance to it.`,
      es: `Volvemos a los datos reales. Los mismos bloques caen sobre una recta numérica: cada torre se vuelve un punto en su valor. Pon el punto de apoyo en la media, ${f(S.mean)}, y mide la distancia de cada punto hasta ella.`,
    },
    balanceDone: {
      en: `The distances on the left add up to ${f(balance(values).left)}, and so do the distances on the right. That is why the mean is the balance point: the data would balance on a fulcrum at ${f(S.mean)}.`,
      es: `Las distancias de la izquierda suman ${f(balance(values).left)} y las de la derecha también. Por eso la media es el punto de equilibrio: los datos se equilibrarían sobre un apoyo en ${f(S.mean)}.`,
    },
    changeSay: (i) => ({
      en: `Drag ${lab(i).en}'s value. Watch the fair-share line on the towers and the fulcrum on the number line move together.`,
      es: `Arrastra el valor de ${lab(i).es}. Observa cómo la línea de la parte justa y el punto de apoyo se mueven juntos.`,
    }),
    /** Scene-5 readout (HTML); every interpolated value passes through `esc`. */
    changeRow(i, vals, esc) {
      const s = stats(vals);
      const bal = balance(vals);
      const [x, t, m, l, r] = [vals[i], s.total, s.mean, bal.left, bal.right].map((q) => esc(f(q)));
      return {
        en: `${esc(lab(i).en)} = <b>${x}</b>. Total ${t}, mean <b>${m}</b>. Distances left ${l}, right ${r} — still balanced.`,
        es: `${esc(lab(i).es)} = <b>${x}</b>. Total ${t}, media <b>${m}</b>. Distancias izquierda ${l}, derecha ${r}: sigue en equilibrio.`,
      };
    },
    changeLesson: {
      en: `Changing one value by ${f(unit)} moves the mean by only ${f(unit)} ÷ ${n} = ${f(unit / n)}: the change is shared by all ${n}. A far-away value pulls the fulcrum toward it.`,
      es: `Cambiar un valor en ${f(unit)} mueve la media solo ${f(unit)} ÷ ${n} = ${f(unit / n)}: el cambio se reparte entre los ${n}. Un valor muy lejano jala el punto de apoyo hacia él.`,
    },
    tryMore: twoTry,
    tryThree: {
      en: "Try at least three different values.",
      es: "Prueba al menos tres valores diferentes.",
    },
    transferList: tv.map(f).join(", "),
    transferSay: {
      en: `${story.en} No towers this time — find the mean on your own.`,
      es: `${story.es} Esta vez no hay torres: halla la media por tu cuenta.`,
    },
    transferQ: {
      en: "What is the mean of this data set?",
      es: "¿Cuál es la media de este conjunto de datos?",
    },
    transferOk: {
      en: `Right: ${f(ts.total)} ÷ ${tv.length} = ${f(ts.mean)}. The fulcrum balances there.`,
      es: `Correcto: ${f(ts.total)} ÷ ${tv.length} = ${f(ts.mean)}. El punto de apoyo se equilibra ahí.`,
    },
    transferSums: {
      en: `Left ${f(balance(tv).left)}   ·   Right ${f(balance(tv).right)}`,
      es: `Izquierda ${f(balance(tv).left)}   ·   Derecha ${f(balance(tv).right)}`,
    },
    explainLabel: {
      en: "Explain: why is the mean called the balance point of the data?",
      es: "Explica: ¿por qué la media se llama el punto de equilibrio de los datos?",
    },
    explainFrame: {
      en: "The distances on the left add up to ___ and on the right to ___, so ___.",
      es: "Las distancias de la izquierda suman ___ y las de la derecha ___, así que ___.",
    },
  };
}
