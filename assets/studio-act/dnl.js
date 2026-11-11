/**
 * Practice Studio activity: dnl (double number line, 6.AT.2 / 6.AT.3).
 * Two number lines share their tick marks: the top counts one quantity, the bottom the other, and every tick pairs
 * equivalent amounts. Some labels are missing (A, B, C ...); the student types each one. Level 3 adds the unit-rate
 * tick (1 of the top quantity), level 4 a tick past the end of the drawn line.
 * State: { v: { [blankId]: number|null } }. No timers.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const clone = (/** @type {any} */ o) => JSON.parse(JSON.stringify(o));
  const CONTEXTS = [
    {
      top: "cups of flour",
      topEs: "tazas de harina",
      bot: "cups of milk",
      botEs: "tazas de leche",
      what: "a pancake recipe",
      whatEs: "una receta de panqueques",
    },
    {
      top: "minutes",
      topEs: "minutos",
      bot: "laps",
      botEs: "vueltas",
      what: "a steady swimmer",
      whatEs: "una nadadora constante",
    },
    {
      top: "tickets",
      topEs: "boletos",
      bot: "dollars",
      botEs: "dólares",
      what: "a fair ride",
      whatEs: "un juego de la feria",
    },
    {
      top: "bags",
      topEs: "bolsas",
      bot: "oranges",
      botEs: "naranjas",
      what: "a fruit stand",
      whatEs: "un puesto de frutas",
    },
    {
      top: "gallons of paint",
      topEs: "galones de pintura",
      bot: "walls",
      botEs: "paredes",
      what: "a painting crew",
      whatEs: "un equipo de pintores",
    },
  ];
  const LETTERS = "ABCDEF";

  /**
   * One model: the ratio a : b, the multipliers drawn as ticks, and which labels are blank. Level 3 starts with a unit
   * tick (top = 1), so a is chosen to divide b; level 4 adds a tick past the drawn line that the student must extend to.
   */
  function make(/** @type {any} */ rng, /** @type {number} */ level) {
    for (let t = 0; t < 200; t++) {
      const ctx = rng.pick(CONTEXTS);
      let a;
      let b;
      if (level >= 3) {
        a = rng.int(2, 4);
        b = a * rng.int(2, 6);
      } else {
        a = rng.int(2, 6);
        b = rng.int(2, 9);
      }
      if (a === b) continue;
      // level 3+ keeps the line short so the unit tick stays clear of 0
      const steps = level === 1 ? [1, 2, 3, 4] : level === 2 ? [1, 2, 3, 4, 5] : [1, 2, 3];
      // ticks as fractions of the ratio: k means k·a over k·b; the unit tick is k = 1/a
      const ks = [0, ...(level >= 3 ? [1 / a] : []), ...steps];
      const far = level === 4 ? rng.int(7, 10) : null;
      const ticks = ks.map((k) => ({ top: k * a, bot: k * b }));
      if (far) ticks.push({ top: far * a, bot: far * b, far: 1 });
      // blanks: never the first ratio pair (k = 1) and never 0 — those are the givens the line is read from
      const pool = [];
      ticks.forEach((tk, i) => {
        if (tk.top === 0 || tk.top === a) return;
        pool.push({ i, side: "bot" });
        if (level >= 2) pool.push({ i, side: "top" });
      });
      const want = level === 1 ? 2 : 3;
      const picked = [];
      const used = new Set();
      for (const c of rng.shuffle(pool)) {
        if (picked.length >= want) break;
        if (used.has(c.i)) continue;
        used.add(c.i);
        picked.push(c);
      }
      if (level >= 3) {
        const unit = ticks.findIndex((tk) => tk.top === 1);
        if (!picked.some((p) => p.i === unit)) picked[0] = { i: unit, side: "bot" };
      }
      if (far) {
        const fi = ticks.length - 1;
        if (!picked.some((p) => p.i === fi)) picked[picked.length - 1] = { i: fi, side: "bot" };
      }
      const blanks = picked
        .sort((p, q) => p.i - q.i || (p.side === "top" ? -1 : 1))
        .map((p, n) => ({ id: LETTERS[n], i: p.i, side: p.side, v: ticks[p.i][p.side] }));
      if (new Set(blanks.map((x) => x.i)).size !== blanks.length) continue;
      // the additive trap: same difference instead of same factor
      const additive = (/** @type {any} */ x) =>
        x.side === "bot" ? ticks[x.i].top + (b - a) : ticks[x.i].bot - (b - a);
      if (blanks.every((x) => additive(x) === x.v)) continue;
      const pair = `${a} ${ctx.top} for ${b} ${ctx.bot}`;
      const pairEs = `${a} ${ctx.topEs} por ${b} ${ctx.botEs}`;
      const names = blanks.map((x) => x.id).join(", ");
      return {
        model: { a, b, ctx, ticks, blanks, far },
        q: `For ${ctx.what}, the ratio is ${pair}. Fill in the missing labels ${names} on the double number line.`,
        qEs: `En ${ctx.whatEs}, la razón es ${pairEs}. Completa las etiquetas que faltan ${names} en la recta numérica doble.`,
        x: `Each tick multiplies both amounts by the same number. ${blanks
          .map((x) => `${x.id} = ${x.v}`)
          .join(", ")}.`,
        xEs: `Cada marca multiplica las dos cantidades por el mismo número. ${blanks
          .map((x) => `${x.id} = ${x.v}`)
          .join(", ")}.`,
        h: [
          `Find the tick that shows ${a} and ${b}. Every other tick is a multiple of that pair.`,
          `How many times bigger is the top number than ${a}? Multiply ${b} by the same number.`,
          level >= 3
            ? `For the tick at 1, divide both ${a} and ${b} by ${a}.`
            : "Check: the top and bottom of every tick should make the same ratio.",
        ],
        hEs: [
          `Busca la marca que muestra ${a} y ${b}. Las demás marcas son múltiplos de ese par.`,
          `¿Cuántas veces más grande es el número de arriba que ${a}? Multiplica ${b} por el mismo número.`,
          level >= 3
            ? `Para la marca en 1, divide ${a} y ${b} entre ${a}.`
            : "Comprueba: arriba y abajo de cada marca deben formar la misma razón.",
        ],
      };
    }
    throw new Error("dnl: no model");
  }

  const solution = (/** @type {any} */ spec) => ({
    v: Object.fromEntries(spec.model.blanks.map((/** @type {any} */ x) => [x.id, x.v])),
  });
  function wrong(/** @type {any} */ spec) {
    const m = spec.model;
    const add = Object.fromEntries(
      m.blanks.map((/** @type {any} */ x) => [
        x.id,
        x.side === "bot" ? m.ticks[x.i].top + (m.b - m.a) : m.ticks[x.i].bot - (m.b - m.a),
      ]),
    );
    const swap = Object.fromEntries(
      m.blanks.map((/** @type {any} */ x) => [
        x.id,
        x.side === "bot" ? m.ticks[x.i].top : m.ticks[x.i].bot,
      ]),
    );
    const first = m.blanks[0];
    const off = { ...solution(spec).v, [first.id]: first.v + 1 };
    const empty = { ...solution(spec).v, [first.id]: null };
    return [{ v: add }, { v: swap }, { v: off }, { v: empty }].filter(
      (w) => !m.blanks.every((/** @type {any} */ x) => w.v[x.id] === x.v),
    );
  }
  const miss = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
  ) => ({ ok: false, tag, say, sayEs });
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const m = spec.model;
    const v = (st && st.v) || {};
    const empty = m.blanks.filter((/** @type {any} */ x) => typeof v[x.id] !== "number");
    if (empty.length)
      return miss(
        "incomplete",
        `Fill in every label first: ${empty.map((/** @type {any} */ x) => x.id).join(", ")}.`,
        `Primero completa cada etiqueta: ${empty.map((/** @type {any} */ x) => x.id).join(", ")}.`,
      );
    const off = m.blanks.filter((/** @type {any} */ x) => v[x.id] !== x.v);
    if (!off.length) return { ok: true };
    const x = off[0];
    const tk = m.ticks[x.i];
    const addVal = x.side === "bot" ? tk.top + (m.b - m.a) : tk.bot - (m.b - m.a);
    if (v[x.id] === addVal)
      return miss(
        "additive-not-multiplicative",
        `${x.id} keeps the same difference between the lines. The lines grow by multiplying, not by adding the same amount.`,
        `${x.id} mantiene la misma diferencia entre las rectas. Las rectas crecen multiplicando, no sumando la misma cantidad.`,
      );
    const other = x.side === "bot" ? tk.top : tk.bot;
    if (v[x.id] === other)
      return miss(
        "copied-other-line",
        `${x.id} repeats the number on the other line. The two lines count different things.`,
        `${x.id} repite el número de la otra recta. Las dos rectas cuentan cosas distintas.`,
      );
    return miss(
      "scale-factor",
      `Check ${x.id}: is the tick's top amount the same multiple of ${m.a} as its bottom amount is of ${m.b}?`,
      `Revisa ${x.id}: ¿la cantidad de arriba es el mismo múltiplo de ${m.a} que la de abajo es de ${m.b}?`,
    );
  }

  // biome-ignore format: compact stylesheet
  const CSS = `
.dnl-root{color:var(--ink,#1B2733);max-width:680px;margin:0 auto;font-family:inherit}
.dnl-root *{box-sizing:border-box}
.dnl-root .sa-es{display:none;font-size:.82em;font-weight:600;color:var(--brand,#2C4A68)}
body.show-es .dnl-root .sa-es,.dnl-root[data-es="1"] .sa-es{display:block}
.dnl-fig{width:100%;height:auto;display:block;background:var(--surface,#fff);border:1px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px)}
.dnl-fig text{font:700 21px/1 inherit;fill:var(--ink,#1B2733)}
.dnl-fig .dnl-name{font-size:18px;font-weight:700;fill:var(--ink-muted,#3F4C5C)}
.dnl-fig .dnl-axis{stroke:var(--ink,#1B2733);stroke-width:2.5}
.dnl-fig .dnl-tick{stroke:var(--ink,#1B2733);stroke-width:2}
.dnl-fig .dnl-link{stroke:var(--brand-line,#BBCADA);stroke-width:1.5;stroke-dasharray:4 4}
.dnl-fig .dnl-blank{fill:var(--sun-tint,#FAF2DC);stroke:var(--brand,#2C4A68);stroke-width:2}
.dnl-fig .dnl-blank.dnl-done{fill:var(--brand-tint,#E5ECF3)}
.dnl-fig .dnl-gap{stroke:var(--border-strong,#7A8B9F);stroke-width:2.5;stroke-dasharray:3 6}
.dnl-inputs{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}
.dnl-inputs label{display:flex;align-items:center;gap:8px;font-weight:800}
.dnl-inputs input{width:96px;min-height:44px;font:inherit;font-size:1.1rem;padding:6px 10px;border-radius:12px;border:2px solid var(--border-strong,#7A8B9F);background:var(--surface,#fff);color:var(--ink,#1B2733)}
.dnl-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.dnl-btn{appearance:none;font:inherit;font-weight:800;min-height:44px;min-width:44px;padding:8px 16px;border-radius:12px;border:1.5px solid var(--border,#D5DCE5);background:var(--surface,#fff);color:var(--ink,#1B2733);cursor:pointer}
.dnl-btn.dnl-go{background:var(--brand,#2C4A68);border-color:var(--brand,#2C4A68);color:var(--on-brand,#fff)}
.dnl-status{min-height:1.4em;margin:8px 0 0;font-weight:700;color:var(--ink-muted,#3F4C5C)}
@media (forced-colors:active){.dnl-btn,.dnl-inputs input{border-color:ButtonText}}
`;

  function figure(
    /** @type {any} */ m,
    /** @type {any} */ st,
    /** @type {(en: string, es: string) => string} */ L,
  ) {
    const n = m.ticks.length;
    const drawn = m.ticks.filter((/** @type {any} */ t) => !t.far);
    const maxTop = drawn[drawn.length - 1].top;
    const W0 = 480;
    const left = 40;
    const right = m.far ? 380 : 455;
    const x = (/** @type {number} */ top, /** @type {boolean} */ far) =>
      far ? 450 : left + (top / maxTop) * (right - left);
    const yT = 64;
    const yB = 156;
    let s = `<line class="dnl-axis" x1="${left}" y1="${yT}" x2="${right}" y2="${yT}"/><line class="dnl-axis" x1="${left}" y1="${yB}" x2="${right}" y2="${yB}"/>`;
    if (m.far)
      s += `<line class="dnl-gap" x1="${right + 8}" y1="${yT}" x2="438" y2="${yT}"/><line class="dnl-gap" x1="${right + 8}" y1="${yB}" x2="438" y2="${yB}"/>`;
    s += `<text class="dnl-name" x="4" y="${yT - 42}">${m.ctx.top}</text><text class="dnl-name" x="4" y="${yB + 62}">${m.ctx.bot}</text>`;
    for (let i = 0; i < n; i++) {
      const tk = m.ticks[i];
      const cx = x(tk.top, !!tk.far);
      s += `<line class="dnl-link" x1="${cx}" y1="${yT + 10}" x2="${cx}" y2="${yB - 10}"/><line class="dnl-tick" x1="${cx}" y1="${yT - 9}" x2="${cx}" y2="${yT + 9}"/><line class="dnl-tick" x1="${cx}" y1="${yB - 9}" x2="${cx}" y2="${yB + 9}"/>`;
      for (const side of ["top", "bot"]) {
        const y = side === "top" ? yT - 18 : yB + 30;
        const b = m.blanks.find((/** @type {any} */ q) => q.i === i && q.side === side);
        if (!b) s += `<text x="${cx}" y="${y}" text-anchor="middle">${fmt(tk[side])}</text>`;
        else {
          const have = typeof st.v[b.id] === "number";
          s += `<rect class="dnl-blank${have ? " dnl-done" : ""}" x="${cx - 28}" y="${y - 23}" width="56" height="30" rx="7"/><text x="${cx}" y="${y}" text-anchor="middle">${have ? `${b.id}: ${fmt(st.v[b.id])}` : b.id}</text>`;
        }
      }
    }
    const label = L(
      `Double number line: ${m.ctx.top} on top, ${m.ctx.bot} below; ${m.a} ${m.ctx.top} matches ${m.b} ${m.ctx.bot}.`,
      `Recta numérica doble: ${m.ctx.topEs} arriba, ${m.ctx.botEs} abajo; ${m.a} ${m.ctx.topEs} corresponden a ${m.b} ${m.ctx.botEs}.`,
    );
    return `<svg class="dnl-fig" viewBox="0 0 ${W0} 228" role="img" aria-label="${label}">${s}</svg>`;
  }
  const fmt = (/** @type {number} */ v) =>
    Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);

  function mount(/** @type {HTMLElement} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("dnl", CSS);
    const m = spec.model;
    const ro = !!api.solved;
    const L = (/** @type {string} */ en, /** @type {string} */ es) =>
      api.es && api.es() ? es : en;
    const root = A.el("div", "dnl-root");
    if (api.es?.()) root.setAttribute("data-es", "1");
    host.replaceChildren(root);
    const st = /** @type {any} */ ({ v: {} });
    if (api.restore) Object.assign(st, clone(api.restore));
    const fig = A.el("div", "dnl-figwrap");
    const inputs = A.el("div", "dnl-inputs", "", {
      role: "group",
      "aria-label": L("Missing labels", "Etiquetas que faltan"),
    });
    const status = A.el("p", "dnl-status", "", { "aria-live": "polite" });
    root.append(fig, inputs, status);
    const paint = () => {
      fig.innerHTML = figure(m, st, L);
    };
    for (const b of m.blanks) {
      const lab = A.el("label");
      const side = b.side === "top" ? L(m.ctx.top, m.ctx.topEs) : L(m.ctx.bot, m.ctx.botEs);
      const inp = /** @type {HTMLInputElement} */ (
        A.el("input", "", "", {
          type: "text",
          inputmode: "decimal",
          autocomplete: "off",
          "aria-label": `${b.id} (${side})`,
        })
      );
      if (typeof st.v[b.id] === "number") inp.value = String(st.v[b.id]);
      inp.disabled = ro;
      inp.addEventListener("input", () => {
        const n = Number(inp.value.replace(/,/g, "").trim());
        st.v[b.id] = inp.value.trim() !== "" && Number.isFinite(n) ? n : null;
        paint();
        api.change?.(clone(st));
      });
      lab.append(A.el("span", "", `${b.id} =`), inp);
      inputs.append(lab);
    }
    if (!ro) {
      const row = A.el("div", "dnl-row");
      const chk = A.el("button", "dnl-btn dnl-go", L("Check", "Comprobar"), { type: "button" });
      chk.addEventListener("click", () => api.submit?.(clone(st)));
      row.append(chk);
      root.append(row);
    } else status.textContent = L("Solved.", "Resuelto.");
    paint();
  }

  A.register("dnl", {
    title: "Double number line",
    titleEs: "Recta numérica doble",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  });
  A.coach("dnl", [
    {
      icon: "📏",
      en: "Each tick pairs an amount on top with the matching amount below.",
      es: "Cada marca une una cantidad de arriba con la cantidad que le corresponde abajo.",
    },
    {
      icon: "✖️",
      en: "Multiply both amounts by the same number to move along the lines.",
      es: "Multiplica las dos cantidades por el mismo número para avanzar.",
    },
    {
      icon: "✅",
      en: "Type each missing label, then press Check.",
      es: "Escribe cada etiqueta que falta y luego toca Comprobar.",
    },
  ]);
})();
