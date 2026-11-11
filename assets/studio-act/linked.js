/**
 * Practice Studio activity: linked (two-variable relationships, 6.AT.11).
 * One situation, three linked views: a table the student completes, a graph that plots each row the moment it is
 * filled, and the equation the student chooses. Changing a table value moves its point, so the graph shows whether
 * the rows follow one rule. Levels: 1 y = kx, 2 y = kx with larger x, 3 y = kx + b, 4 y = kx + b with a non-unit
 * first x and a rule the student must read from two rows.
 * State: { y: (number|null)[], eq: number|null } (eq indexes model.eqs). No timers.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const clone = (/** @type {any} */ o) => JSON.parse(JSON.stringify(o));
  const SITUATIONS = [
    {
      x: "hours worked",
      xEs: "horas trabajadas",
      y: "dollars earned",
      yEs: "dólares ganados",
      rate: "dollars each hour",
      rateEs: "dólares por hora",
      say: (k, b) =>
        b
          ? `A worker gets a $${b} sign-up bonus and earns $${k} for each hour.`
          : `A worker earns $${k} for each hour.`,
      sayEs: (k, b) =>
        b
          ? `Un trabajador recibe un bono de inscripción de $${b} y gana $${k} por cada hora.`
          : `Un trabajador gana $${k} por cada hora.`,
    },
    {
      x: "weeks",
      xEs: "semanas",
      y: "plant height (cm)",
      yEs: "altura de la planta (cm)",
      rate: "cm each week",
      rateEs: "cm por semana",
      say: (k, b) =>
        b
          ? `A plant is ${b} cm tall and grows ${k} cm each week.`
          : `A seedling grows ${k} cm each week, starting from the soil.`,
      sayEs: (k, b) =>
        b
          ? `Una planta mide ${b} cm y crece ${k} cm cada semana.`
          : `Una plántula crece ${k} cm cada semana, desde la tierra.`,
    },
    {
      x: "songs bought",
      xEs: "canciones compradas",
      y: "total cost ($)",
      yEs: "costo total ($)",
      rate: "dollars a song",
      rateEs: "dólares por canción",
      say: (k, b) =>
        b
          ? `A music club charges a $${b} membership fee plus $${k} for each song.`
          : `Each song costs $${k}.`,
      sayEs: (k, b) =>
        b
          ? `Un club de música cobra una cuota de $${b} más $${k} por cada canción.`
          : `Cada canción cuesta $${k}.`,
    },
    {
      x: "minutes",
      xEs: "minutos",
      y: "liters in the tank",
      yEs: "litros en el tanque",
      rate: "liters each minute",
      rateEs: "litros por minuto",
      say: (k, b) =>
        b
          ? `A tank already holds ${b} liters, and ${k} liters flow in each minute.`
          : `An empty tank fills with ${k} liters each minute.`,
      sayEs: (k, b) =>
        b
          ? `Un tanque ya tiene ${b} litros y entran ${k} litros cada minuto.`
          : `Un tanque vacío se llena con ${k} litros cada minuto.`,
    },
  ];

  function make(/** @type {any} */ rng, /** @type {number} */ level) {
    for (let t = 0; t < 200; t++) {
      const s = rng.pick(SITUATIONS);
      const k = rng.int(2, level >= 2 ? 9 : 6);
      const b = level >= 3 ? rng.int(1, 12) : 0;
      if (b === k) continue;
      const x0 = level === 4 ? rng.int(2, 3) : 1;
      const step = level >= 2 ? rng.pick([1, 2]) : 1;
      const xs = [0, 1, 2, 3].map((i) => x0 + i * step);
      const ys = xs.map((x) => k * x + b);
      // level 4 gives two rows so the student reads the rate from a difference; the rest give one
      const given = level === 4 ? [0, 1] : [0];
      const cx = (/** @type {number} */ c) => (c === 1 ? "x" : `${c}x`);
      const rule = b ? `y = ${k}x + ${b}` : `y = ${k}x`;
      const options = [
        rule,
        b ? `y = ${cx(b)} + ${k}` : `y = x + ${k}`,
        b ? `y = ${k}x` : `y = ${k + 1}x`,
        b ? `y = ${k + b}x` : `x = ${k}y`,
      ];
      if (new Set(options).size !== 4) continue;
      const order = rng.shuffle([0, 1, 2, 3]);
      const eqs = order.map((i) => options[i]);
      const tags = order.map(
        (i) =>
          [
            "",
            b ? "rate-start-swapped" : "added-not-multiplied",
            b ? "start-dropped" : "rate-off",
            b ? "start-added-to-rate" : "variables-swapped",
          ][i],
      );
      const yMax = Math.max(...ys);
      const story = s.say(k, b);
      const storyEs = s.sayEs(k, b);
      return {
        model: { s, k, b, xs, ys, given, eqs, tags, right: eqs.indexOf(rule), yMax },
        q:
          level === 4
            ? `x is ${s.x} and y is ${s.y}. Two rows are given. Complete the table, watch the graph, then choose the equation.`
            : `${story} x is ${s.x} and y is ${s.y}. Complete the table, watch the graph, then choose the equation.`,
        qEs:
          level === 4
            ? `x es ${s.xEs} y y es ${s.yEs}. Hay dos filas dadas. Completa la tabla, mira la gráfica y luego elige la ecuación.`
            : `${storyEs} x es ${s.xEs} y y es ${s.yEs}. Completa la tabla, mira la gráfica y luego elige la ecuación.`,
        x: `Each y is ${k} times x${b ? ` plus ${b}` : ""}, so the rule is ${rule}: ${xs.map((x, i) => `(${x}, ${ys[i]})`).join(", ")}.`,
        xEs: `Cada y es ${k} veces x${b ? ` más ${b}` : ""}, así que la regla es ${rule}: ${xs.map((x, i) => `(${x}, ${ys[i]})`).join(", ")}.`,
        h: [
          level === 4
            ? "Compare the two given rows: how much does y change when x goes up by the step?"
            : "Find how y changes each time x goes up by 1.",
          b
            ? "The rule multiplies x by the rate, then adds the starting amount."
            : "The rule multiplies x by the rate. There is nothing to add.",
          "Every point on the graph should line up. A point off the line means that row breaks the rule.",
        ],
        hEs: [
          level === 4
            ? "Compara las dos filas dadas: ¿cuánto cambia y cuando x sube un paso?"
            : "Busca cómo cambia y cada vez que x sube 1.",
          b
            ? "La regla multiplica x por la tasa y luego suma la cantidad inicial."
            : "La regla multiplica x por la tasa. No hay nada que sumar.",
          "Todos los puntos de la gráfica deben quedar alineados. Un punto fuera de la línea indica que esa fila no sigue la regla.",
        ],
      };
    }
    throw new Error("linked: no model");
  }

  const solution = (/** @type {any} */ spec) => ({ y: [...spec.model.ys], eq: spec.model.right });
  function wrong(/** @type {any} */ spec) {
    const m = spec.model;
    const add = m.xs.map((/** @type {number} */ x, /** @type {number} */ i) =>
      m.given.includes(i) ? m.ys[i] : m.ys[0] + (x - m.xs[0]),
    );
    const offByOne = [...m.ys];
    offByOne[3] += 1;
    const badEq = m.eqs.findIndex(
      (/** @type {string} */ _, /** @type {number} */ i) => i !== m.right,
    );
    return [
      { y: add, eq: m.right },
      { y: offByOne, eq: m.right },
      { y: [...m.ys], eq: badEq },
      { y: [...m.ys], eq: null },
    ];
  }
  const miss = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
  ) => ({ ok: false, tag, say, sayEs });
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const m = spec.model;
    const y = (st && st.y) || [];
    const blank = m.xs.findIndex(
      (/** @type {number} */ _, /** @type {number} */ i) => typeof y[i] !== "number",
    );
    if (blank >= 0)
      return miss(
        "incomplete",
        "Fill in every row of the table first.",
        "Primero completa cada fila de la tabla.",
      );
    const off = m.xs.findIndex(
      (/** @type {number} */ _, /** @type {number} */ i) => y[i] !== m.ys[i],
    );
    if (off >= 0) {
      const x = m.xs[off];
      if (off > 0 && y[off] - y[off - 1] === m.xs[off] - m.xs[off - 1])
        return miss(
          "added-one-not-rate",
          `The row x = ${x} goes up by the same amount as x. y grows by the rate each step, not by 1.`,
          `La fila x = ${x} sube lo mismo que x. y crece según la tasa en cada paso, no de 1 en 1.`,
        );
      return miss(
        "row-off-rule",
        `The point for x = ${x} is off the line the other rows make. Check that row against the rule.`,
        `El punto de x = ${x} está fuera de la línea de las otras filas. Revisa esa fila con la regla.`,
      );
    }
    if (typeof st.eq !== "number")
      return miss(
        "no-equation",
        "The table is right. Now choose the equation.",
        "La tabla está bien. Ahora elige la ecuación.",
      );
    if (st.eq === m.right) return { ok: true };
    const tag = m.tags[st.eq] || "equation";
    return miss(
      tag,
      `Test that equation with a row: put x = ${m.xs[1]} into it. Does it give ${m.ys[1]}?`,
      `Prueba esa ecuación con una fila: pon x = ${m.xs[1]}. ¿Da ${m.ys[1]}?`,
    );
  }

  // biome-ignore format: compact stylesheet
  const CSS = `
.lk-root{color:var(--ink,#1B2733);max-width:760px;margin:0 auto;font-family:inherit}
.lk-root *{box-sizing:border-box}
.lk-grid{display:grid;grid-template-columns:minmax(0,220px) minmax(0,1fr);gap:14px;align-items:start}
@media (max-width:560px){.lk-grid{grid-template-columns:1fr}}
.lk-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--border,#D5DCE5);border-radius:12px;overflow:hidden;background:var(--surface,#fff)}
.lk-table th,.lk-table td{padding:6px 8px;border-bottom:1px solid var(--border,#D5DCE5);text-align:center}
.lk-table tr:last-child td{border-bottom:0}
.lk-table th{background:var(--surface-soft,#F7F9FB);font-size:.85rem;color:var(--ink-muted,#3F4C5C)}
.lk-table input{width:80px;min-height:44px;font:inherit;font-size:1.05rem;text-align:center;border-radius:10px;border:2px solid var(--border-strong,#7A8B9F);background:var(--surface,#fff);color:var(--ink,#1B2733)}
.lk-fig{width:100%;height:auto;display:block;background:var(--surface,#fff);border:1px solid var(--border,#D5DCE5);border-radius:12px}
.lk-fig text{font:600 17px/1 inherit;fill:var(--ink-muted,#3F4C5C)}
.lk-fig .lk-ax{stroke:var(--ink,#1B2733);stroke-width:2}
.lk-fig .lk-gl{stroke:var(--border,#D5DCE5);stroke-width:1}
.lk-fig .lk-pt{fill:var(--brand,#2C4A68);stroke:var(--surface,#fff);stroke-width:2}
.lk-fig .lk-given{fill:var(--ink,#1B2733)}
.lk-eqs{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
.lk-btn{appearance:none;font:inherit;font-weight:800;min-height:44px;min-width:44px;padding:8px 16px;border-radius:12px;border:1.5px solid var(--border,#D5DCE5);background:var(--surface,#fff);color:var(--ink,#1B2733);cursor:pointer}
.lk-btn[aria-pressed="true"]{border-color:var(--brand,#2C4A68);background:var(--brand-tint,#E5ECF3);box-shadow:inset 0 0 0 2px var(--brand,#2C4A68)}
.lk-btn.lk-go{background:var(--brand,#2C4A68);border-color:var(--brand,#2C4A68);color:var(--on-brand,#fff)}
.lk-cap{font-weight:800;margin:10px 0 4px}
.lk-status{min-height:1.4em;margin:8px 0 0;font-weight:700;color:var(--ink-muted,#3F4C5C)}
@media (forced-colors:active){.lk-btn,.lk-table input{border-color:ButtonText}.lk-btn[aria-pressed="true"]{outline:3px solid Highlight}}
`;

  function graph(/** @type {any} */ m, /** @type {any} */ st, /** @type {string} */ label) {
    const xMax = m.xs[3] + 1;
    const yTop = Math.ceil((m.yMax * 1.15) / 5) * 5 || 5;
    const L = 46;
    const R = 400;
    const T = 16;
    const B = 230;
    const px = (/** @type {number} */ x) => L + (x / xMax) * (R - L);
    const py = (/** @type {number} */ y) => B - (y / yTop) * (B - T);
    let s = "";
    for (let i = 0; i <= 5; i++) {
      const v = (yTop / 5) * i;
      s += `<line class="lk-gl" x1="${L}" y1="${py(v)}" x2="${R}" y2="${py(v)}"/><text x="${L - 8}" y="${py(v) + 4}" text-anchor="end">${Math.round(v)}</text>`;
    }
    for (let x = 0; x <= xMax; x++)
      s += `<text x="${px(x)}" y="${B + 18}" text-anchor="middle">${x}</text>`;
    s += `<line class="lk-ax" x1="${L}" y1="${B}" x2="${R}" y2="${B}"/><line class="lk-ax" x1="${L}" y1="${T}" x2="${L}" y2="${B}"/>`;
    m.xs.forEach((/** @type {number} */ x, /** @type {number} */ i) => {
      const y = st.y[i];
      if (typeof y === "number" && y >= 0 && y <= yTop)
        s += `<circle class="lk-pt${m.given.includes(i) ? " lk-given" : ""}" cx="${px(x)}" cy="${py(y)}" r="7"/>`;
    });
    return `<svg class="lk-fig" viewBox="0 0 410 252" role="img" aria-label="${label}">${s}</svg>`;
  }

  function mount(/** @type {HTMLElement} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("linked", CSS);
    const m = spec.model;
    const ro = !!api.solved;
    const L = (/** @type {string} */ en, /** @type {string} */ es) =>
      api.es && api.es() ? es : en;
    const root = A.el("div", "lk-root");
    host.replaceChildren(root);
    const st = /** @type {any} */ ({
      y: m.xs.map((/** @type {number} */ _, /** @type {number} */ i) =>
        m.given.includes(i) ? m.ys[i] : null,
      ),
      eq: null,
    });
    if (api.restore) Object.assign(st, clone(api.restore));
    const grid = A.el("div", "lk-grid");
    const table = A.el("table", "lk-table");
    table.innerHTML = `<caption class="sr-only">${L("Table of x and y", "Tabla de x y y")}</caption><thead><tr><th scope="col">x · ${L(m.s.x, m.s.xEs)}</th><th scope="col">y · ${L(m.s.y, m.s.yEs)}</th></tr></thead>`;
    const body = A.el("tbody");
    const figWrap = A.el("div");
    const paint = () => {
      const pts = m.xs.filter(
        (/** @type {number} */ _, /** @type {number} */ i) => typeof st.y[i] === "number",
      ).length;
      figWrap.innerHTML = graph(
        m,
        st,
        L(
          `Graph of the table: ${pts} of 4 rows plotted.`,
          `Gráfica de la tabla: ${pts} de 4 filas.`,
        ),
      );
    };
    m.xs.forEach((/** @type {number} */ x, /** @type {number} */ i) => {
      const tr = A.el("tr");
      const td = A.el("td");
      if (m.given.includes(i)) td.textContent = String(m.ys[i]);
      else {
        const inp = /** @type {HTMLInputElement} */ (
          A.el("input", "", "", {
            type: "text",
            inputmode: "numeric",
            autocomplete: "off",
            "aria-label": L(`y when x is ${x}`, `y cuando x es ${x}`),
          })
        );
        if (typeof st.y[i] === "number") inp.value = String(st.y[i]);
        inp.disabled = ro;
        inp.addEventListener("input", () => {
          const n = Number(inp.value.trim());
          st.y[i] = inp.value.trim() !== "" && Number.isFinite(n) ? n : null;
          paint();
          api.change?.(clone(st));
        });
        td.append(inp);
      }
      tr.append(A.el("td", "", String(x)), td);
      body.append(tr);
    });
    table.append(body);
    grid.append(table, figWrap);
    const cap = A.el(
      "p",
      "lk-cap",
      L("Which equation matches every row?", "¿Qué ecuación cumple con todas las filas?"),
    );
    const eqs = A.el("div", "lk-eqs", "", {
      role: "group",
      "aria-label": L("Equations", "Ecuaciones"),
    });
    m.eqs.forEach((/** @type {string} */ e, /** @type {number} */ i) => {
      const b = A.el("button", "lk-btn", e, {
        type: "button",
        "aria-pressed": String(st.eq === i),
      });
      b.disabled = ro;
      b.addEventListener("click", () => {
        st.eq = i;
        eqs
          .querySelectorAll("button")
          .forEach((n, j) => n.setAttribute("aria-pressed", String(j === i)));
        api.change?.(clone(st));
      });
      eqs.append(b);
    });
    const status = A.el("p", "lk-status", "", { "aria-live": "polite" });
    root.append(grid, cap, eqs);
    if (!ro) {
      const chk = A.el("button", "lk-btn lk-go", L("Check", "Comprobar"), { type: "button" });
      chk.addEventListener("click", () => api.submit?.(clone(st)));
      root.append(chk);
    } else status.textContent = L("Solved.", "Resuelto.");
    root.append(status);
    paint();
  }

  A.register("linked", {
    title: "Table, graph, rule",
    titleEs: "Tabla, gráfica, regla",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  });
  A.coach("linked", [
    {
      icon: "📋",
      en: "Fill in each missing y in the table.",
      es: "Completa cada y que falta en la tabla.",
    },
    {
      icon: "📈",
      en: "Each row you fill appears as a point on the graph.",
      es: "Cada fila que completas aparece como un punto en la gráfica.",
    },
    {
      icon: "🟰",
      en: "Choose the equation that fits every row, then press Check.",
      es: "Elige la ecuación que cumple con todas las filas y toca Comprobar.",
    },
  ]);
})();
