/**
 * Practice Studio activity: zoomlens (window.StudioAct kind "zoomlens"), lesson 7-2, "Zoom lens".
 * The student picks how many equal parts (2, 3, 4, 5, 8 or 10) to cut one unit into so a fraction or decimal lands exactly
 * on a tick. The target shows on the line only after a miss, so the picture shows the slip and does not hand over the answer.
 * Only halves, fourths, fifths and tenths are targets. State: { n: number | null }.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const K = (A.u7 = A.u7 || {});
  const G = () => W.StudioGen;
  const OPTIONS = [2, 3, 4, 5, 8, 10];
  const WORDS = {
    2: ["halves", "medios"],
    3: ["thirds", "tercios"],
    4: ["fourths", "cuartas partes"],
    5: ["fifths", "quintos"],
    8: ["eighths", "octavos"],
    10: ["tenths", "décimos"],
  };

  function mkZoom(/** @type {any} */ rng, /** @type {number} */ lv) {
    const g = G();
    const d = rng.pick(lv === 1 ? [2, 4] : lv === 2 ? [2, 4, 5] : [2, 4, 5, 10]);
    let k = 0;
    do k = rng.int(1, d * (lv + 1) - 1);
    while (g.gcd(k, d) !== 1);
    const neg = rng.chance(0.6);
    const v = (neg ? -k : k) / d;
    const form = rng.pick(k > d ? ["frac", "mixed", "dec"] : ["frac", "dec"]);
    const body = form === "frac" ? g.frac(k, d) : form === "mixed" ? g.mixed(k, d) : g.fmt(k / d);
    const text = `${neg ? "−" : ""}${body}`;
    const lo = Math.floor(v);
    const lead = rng.pick([
      ["A diver logs a depth of", "Un buzo anota una profundidad de"],
      ["A buoy sits at", "Una boya está en"],
      ["A sensor reads", "Un sensor marca"],
      ["A coral marker is at", "Un marcador de coral está en"],
      ["A drone hovers at", "Un dron flota en"],
      ["A thermometer shows", "Un termómetro muestra"],
    ]);
    const pack = K.pack({
      q: `${lead[0]} ${text}. Zoom in on the unit from ${K.n(lo)} to ${K.n(lo + 1)}. Choose how many equal parts to cut it into so that ${text} lands exactly on a tick. ¦ ${lead[1]} ${text}. Acércate a la unidad de ${K.n(lo)} a ${K.n(lo + 1)}. Elige en cuántas partes iguales cortarla para que ${text} caiga exactamente en una marca.`,
      x: `${text} is ${neg ? "−" : ""}${g.frac(k, d)} in lowest terms, so its ticks are ${d === 1 ? "whole" : `every 1/${d}`}. A cut into a multiple of ${d} parts has a tick there. ¦ ${text} es ${neg ? "−" : ""}${g.frac(k, d)} en su mínima expresión, así que sus marcas van ${`cada 1/${d}`}. Una división en un múltiplo de ${d} partes tiene una marca ahí.`,
      h: [
        "Write the number as a fraction in lowest terms. The denominator matters. ¦ Escribe el número como fracción en su mínima expresión. El denominador importa.",
        "Cutting a unit into n equal parts makes ticks that are 1/n apart. ¦ Cortar una unidad en n partes iguales hace marcas separadas 1/n.",
        "A tick lands on the number when the number is a whole count of those 1/n pieces. ¦ Una marca cae en el número cuando el número es una cantidad entera de esas piezas de 1/n.",
      ],
    });
    return { ...pack, v, text, d, k: neg ? -k : k, lo, options: OPTIONS, model: { text, d } };
  }

  const valid = (/** @type {any} */ spec, /** @type {number} */ n) =>
    OPTIONS.includes(n) && Math.abs(spec.v * n - Math.round(spec.v * n)) < 1e-9;
  function gradeZoom(/** @type {any} */ spec, /** @type {any} */ state) {
    const n = state && Number.isInteger(state.n) ? state.n : null;
    if (n === null || !OPTIONS.includes(n))
      return K.miss(
        "no-point",
        "Choose a number of equal parts first. ¦ Elige primero un número de partes iguales.",
      );
    if (valid(spec, n)) return { ok: true };
    return K.miss(
      "number-line-misread",
      `With ${n} equal parts, the ticks are 1/${n} apart, and ${spec.text} lands between two of them. Think about the denominator of the number. ¦ Con ${n} partes iguales las marcas están separadas 1/${n}, y ${spec.text} cae entre dos de ellas. Piensa en el denominador del número.`,
    );
  }

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const c = K.start(host, spec, api, "zoomlens");
    const { L, T } = c;
    /** @type {number | null} */
    let pick = c.saved && Number.isInteger(c.saved.n) ? c.saved.n : null;
    if (c.solved && pick === null) pick = OPTIONS.find((n) => valid(spec, n)) ?? 2;
    const sel = A.el("div", "ak-row", "", { role: "group" });
    c.label(sel, "Number of equal parts", "Número de partes iguales");
    const chips = OPTIONS.map((n) => {
      const b = A.el("button", "ak-chip", `${n}<span class="es-text" lang="es"></span>`, {
        type: "button",
      });
      b.textContent = String(n);
      c.label(
        b,
        `${n} equal parts (${WORDS[/** @type {2} */ (n)][0]})`,
        `${n} partes iguales (${WORDS[/** @type {2} */ (n)][1]})`,
      );
      b.disabled = c.solved;
      b.addEventListener("click", () => {
        pick = n;
        c.verdict = null;
        c.emit({ n });
        c.say(`${n} equal parts`, `${n} partes iguales`);
        sync();
      });
      sel.append(b);
      return b;
    });
    const view = A.el("div", "ak-svg", "", { role: "img" });
    const info = A.el("p", "ak-text");
    function sync() {
      chips.forEach((b, i) => b.setAttribute("aria-pressed", String(pick === OPTIONS[i])));
      const Wd = 540;
      const x0 = 40;
      const x1 = Wd - 40;
      const by = 70;
      const X = (/** @type {number} */ t) => Math.round((x0 + (t - spec.lo) * (x1 - x0)) * 10) / 10;
      let s = `<line class="ak-ink" x1="${x0 - 22}" y1="${by}" x2="${x1 + 22}" y2="${by}"/>`;
      s += `<text class="ak-lab" text-anchor="middle" x="${x0}" y="${by + 30}">${K.n(spec.lo)}</text><text class="ak-lab" text-anchor="middle" x="${x1}" y="${by + 30}">${K.n(spec.lo + 1)}</text>`;
      if (pick)
        for (let i = 0; i <= pick; i++) {
          const t = spec.lo + i / pick;
          s += `<line class="ak-ink" x1="${X(t)}" y1="${by - (i % pick ? 8 : 14)}" x2="${X(t)}" y2="${by + (i % pick ? 8 : 14)}"/>`;
        }
      else
        s += `<line class="ak-ink" x1="${x0}" y1="${by - 14}" x2="${x0}" y2="${by + 14}"/><line class="ak-ink" x1="${x1}" y1="${by - 14}" x2="${x1}" y2="${by + 14}"/>`;
      const showTarget = c.solved || !!c.verdict;
      if (showTarget && pick) {
        const tx = X(spec.v);
        s += `<path d="M${tx} ${by - 18} l-9 -16 h18z" fill="var(--sun,#F0BD4F)" stroke="var(--ink,#1B2733)" stroke-width="2"/><text class="ak-lab" text-anchor="middle" x="${tx}" y="${by - 42}">${spec.text}</text>`;
      }
      view.innerHTML = `<svg viewBox="0 0 ${Wd} 110" aria-hidden="true" focusable="false">${s}</svg>`;
      view.setAttribute(
        "aria-label",
        pick
          ? L(
              `The unit from ${K.n(spec.lo)} to ${K.n(spec.lo + 1)} cut into ${pick} equal parts.`,
              `La unidad de ${K.n(spec.lo)} a ${K.n(spec.lo + 1)} cortada en ${pick} partes iguales.`,
            )
          : L("The unit, not yet cut.", "La unidad, todavía sin cortar."),
      );
      info.textContent = c.solved
        ? L(
            `${spec.text} lands on tick ${Math.round((spec.v - spec.lo) * (pick || 1))} of ${pick}.`,
            `${spec.text} cae en la marca ${Math.round((spec.v - spec.lo) * (pick || 1))} de ${pick}.`,
          )
        : pick
          ? L(
              `Cut into ${pick} equal parts (${WORDS[/** @type {2} */ (pick)][0]}).`,
              `Cortado en ${pick} partes iguales (${WORDS[/** @type {2} */ (pick)][1]}).`,
            )
          : L("Choose a number of parts.", "Elige un número de partes.");
      c.checkBtn.disabled = pick === null;
    }
    c.body.append(...(c.solved ? [] : [sel]), view, info);
    c.redraws.push(sync);
    c.wire(
      () => ({ n: pick }),
      () => {
        pick = null;
        c.emit({ n: null });
      },
    );
    void T;
    sync();
  }

  A.register("zoomlens", {
    title: "Zoom lens",
    titleEs: "Lupa",
    levels: 4,
    make: mkZoom,
    solution: (spec) => ({ n: OPTIONS.find((n) => valid(spec, n)) }),
    wrong(spec) {
      const bad = OPTIONS.filter((n) => !valid(spec, n));
      return [...bad.slice(0, 3).map((n) => ({ n })), { n: null }];
    },
    grade: gradeZoom,
    mount,
  });
})();
