/* Math Workbench — factor tree, GCF/LCM ladder, fraction-division strip,
 * unit-conversion chart. The tools check that a move is legal (a split really
 * multiplies back to its number, a ladder divisor really divides both numbers);
 * the student does the thinking and writes the final result herself. */
(function (root) {
  "use strict";
  const MWB = root.MWB;
  const M = root.WBMath;
  if (!MWB || !M) return;
  const { h } = MWB;
  const t = MWB.t;

  /* ======================= Factor tree ======================= */
  function cloneTree(n) {
    return n ? { v: n.v, kids: n.kids ? n.kids.map(cloneTree) : null } : null;
  }

  function buildFactorTree(o, ctx) {
    if (!Number.isInteger(o.n) || o.n < 2) o.n = 24;
    if (!o.tree || o.tree.v !== o.n) o.tree = { v: o.n, kids: null };
    const wrap = h("div", { class: "wbx toolobj wbx-ftree" });
    const live = h("p", { class: "wbx-live", role: "status", "aria-live": "polite" });
    const body = h("div", { class: "wbx-ft" });
    const summary = h("p", { class: "wbx-read", "aria-live": "polite" });
    let open = null; // node being split

    const root0 = MWB.numField(
      o.n,
      t("Number to factor", "Número a factorizar"),
      { min: 2, max: 9999 },
      (inp) => {
        const v = Math.round(Number(inp.value));
        if (!(v >= 2 && v <= 9999)) {
          inp.value = o.n;
          live.textContent = t(
            "Pick a whole number from 2 to 9999.",
            "Elige un número entero de 2 a 9999.",
          );
          return;
        }
        o.n = v;
        o.tree = { v, kids: null };
        open = null;
        render();
        ctx.pushHistory();
      },
    );
    root0.style.width = "84px";

    function nodeEl(node) {
      const leaf = !node.kids;
      const prime = leaf && M.isPrime(node.v);
      const btn = h(
        "button",
        {
          type: "button",
          class: `wbx-ftn${leaf ? (prime ? " prime" : " split") : " done"}`,
          "aria-label": leaf
            ? prime
              ? t(`${node.v}, a prime number`, `${node.v}, número primo`)
              : t(`${node.v}. Split it into two factors`, `${node.v}. Divídelo en dos factores`)
            : t(
                `${node.v}. Press to undo this split`,
                `${node.v}. Pulsa para deshacer esta división`,
              ),
        },
        String(node.v),
      );
      MWB.guard(btn);
      btn.addEventListener("click", () => {
        if (!leaf) {
          node.kids = null;
          open = null;
          render();
          ctx.pushHistory();
        } else if (!prime) {
          open = open === node ? null : node;
          render();
        } else
          live.textContent = t(
            `${node.v} is prime: its only factors are 1 and itself.`,
            `${node.v} es primo: solo tiene como factores 1 y él mismo.`,
          );
      });
      const col = h("div", { class: "wbx-ftcol" }, btn);
      if (open === node) {
        const a = MWB.numField(
          "",
          t("First factor", "Primer factor"),
          { min: 2, max: node.v },
          () => {},
        );
        const b = MWB.numField(
          "",
          t("Second factor", "Segundo factor"),
          { min: 2, max: node.v },
          () => {},
        );
        const go = MWB.btn(
          t("Split", "Dividir"),
          t(`Split ${node.v} into these two factors`, `Dividir ${node.v} en estos dos factores`),
          () => {
            const x = Math.round(Number(a.value));
            const y = Math.round(Number(b.value));
            const st = M.checkSplit({ v: node.v, kids: [{ v: x }, { v: y }] });
            if (st !== "ok") {
              live.textContent = t(
                `The two factors have to multiply to make ${node.v}, and each must be at least 2.`,
                `Los dos factores deben multiplicarse para dar ${node.v}, y cada uno debe ser al menos 2.`,
              );
              return;
            }
            node.kids = [
              { v: x, kids: null },
              { v: y, kids: null },
            ];
            open = null;
            render();
            ctx.pushHistory();
          },
        );
        col.appendChild(h("div", { class: "wbx-row" }, a, h("span", null, "×"), b, go));
      }
      if (node.kids) col.appendChild(h("div", { class: "wbx-ftrow" }, ...node.kids.map(nodeEl)));
      return col;
    }

    function render() {
      body.textContent = "";
      body.appendChild(nodeEl(o.tree));
      const leaves = M.leafValues(o.tree);
      const allPrime = leaves.every((v) => M.isPrime(v));
      summary.textContent = `${t("End numbers", "Números finales")}: ${leaves.join(", ")}${allPrime ? ` — ${t("all prime", "todos primos")} ✓` : ""}`;
      ctx.updateObjEl(o);
    }
    wrap.append(
      h(
        "div",
        { class: "wbx-head" },
        h("p", { class: "wbx-title" }, t("Factor tree", "Árbol de factores")),
        root0,
      ),
      body,
      summary,
      live,
    );
    render();
    return wrap;
  }

  /* ======================= GCF / LCM ladder ======================= */
  function buildLadder(o, ctx) {
    const num = (v, d) => (Number.isInteger(v) && v >= 2 && v <= 999 ? v : d);
    o.a = num(o.a, 24);
    o.b = num(o.b, 36);
    if (!Array.isArray(o.steps)) o.steps = [];
    const wrap = h("div", { class: "wbx toolobj wbx-ladder" });
    const live = h("p", { class: "wbx-live", role: "status", "aria-live": "polite" });
    const table = h("div", { class: "wbx-ladtable" });
    const current = () => o.steps.reduce((p, d) => [p[0] / d, p[1] / d], [o.a, o.b]);

    const setNum = (key) => (inp) => {
      const v = Math.round(Number(inp.value));
      if (!(v >= 2 && v <= 999)) {
        inp.value = o[key];
        live.textContent = t(
          "Pick whole numbers from 2 to 999.",
          "Elige números enteros de 2 a 999.",
        );
        return;
      }
      o[key] = v;
      o.steps = [];
      render();
      ctx.pushHistory();
    };
    const aIn = MWB.numField(
      o.a,
      t("First number", "Primer número"),
      { min: 2, max: 999 },
      setNum("a"),
    );
    const bIn = MWB.numField(
      o.b,
      t("Second number", "Segundo número"),
      { min: 2, max: 999 },
      setNum("b"),
    );
    const dIn = MWB.numField(
      "",
      t("Divisor for the next step", "Divisor para el siguiente paso"),
      { min: 2, max: 999 },
      () => {},
    );
    const add = MWB.btn(
      t("Divide", "Dividir"),
      t("Divide both numbers by this divisor", "Dividir ambos números entre este divisor"),
      () => {
        const d = Math.round(Number(dIn.value));
        const [x, y] = current();
        if (!(d >= 2)) {
          live.textContent = t(
            "Type a divisor that is at least 2.",
            "Escribe un divisor de al menos 2.",
          );
          return;
        }
        if (x % d || y % d) {
          live.textContent = t(
            `${d} does not divide both ${x} and ${y} evenly.`,
            `${d} no divide exactamente a ${x} y a ${y}.`,
          );
          return;
        }
        o.steps.push(d);
        dIn.value = "";
        render();
        ctx.pushHistory();
      },
    );
    const undo = MWB.btn(
      t("Undo step", "Deshacer paso"),
      t("Remove the last ladder step", "Quitar el último paso de la escalera"),
      () => {
        o.steps.pop();
        render();
        ctx.pushHistory();
      },
    );

    function render() {
      table.textContent = "";
      let [x, y] = [o.a, o.b];
      table.appendChild(
        h(
          "div",
          { class: "wbx-ladrow" },
          h("span", { class: "wbx-ladd" }, ""),
          h("b", null, String(x)),
          h("b", null, String(y)),
        ),
      );
      for (const d of o.steps) {
        x /= d;
        y /= d;
        table.appendChild(
          h(
            "div",
            { class: "wbx-ladrow" },
            h("span", { class: "wbx-ladd" }, `${d} )`),
            h("b", null, String(x)),
            h("b", null, String(y)),
          ),
        );
      }
      live.textContent =
        M.gcd(x, y) === 1
          ? t(
              "No whole number except 1 divides both of these.",
              "Ningún número entero, excepto 1, divide a ambos.",
            )
          : t(
              "Both numbers can still be divided by a common factor.",
              "Todavía se puede dividir a ambos por un factor común.",
            );
      undo.disabled = !o.steps.length;
      ctx.updateObjEl(o);
    }
    wrap.append(
      h(
        "div",
        { class: "wbx-head" },
        h("p", { class: "wbx-title" }, t("GCF / LCM ladder", "Escalera MCD / MCM")),
        aIn,
        bIn,
      ),
      table,
      h(
        "div",
        { class: "wbx-row" },
        h("span", { class: "wbx-title" }, t("Next divisor", "Siguiente divisor")),
        dIn,
        add,
        undo,
      ),
      live,
    );
    render();
    return wrap;
  }

  /* ======================= Fraction division strip ======================= */
  function buildFracDiv(o, ctx) {
    if (typeof o.dividend !== "string") o.dividend = "2/3";
    if (typeof o.divisor !== "string") o.divisor = "1/4";
    if (!Number.isInteger(o.groups)) o.groups = 0;
    const wrap = h("div", { class: "wbx toolobj wbx-fracdiv" });
    const live = h("p", { class: "wbx-live", role: "status", "aria-live": "polite" });
    const stage = h("div", { class: "wbx-fdstage" });
    const read = h("p", { class: "wbx-read", "aria-live": "polite" });

    function model() {
      const a = M.parseFraction(o.dividend);
      const b = M.parseFraction(o.divisor);
      if (!a || !b || a.n <= 0 || b.n <= 0 || a.d > 12 || b.d > 12) return null;
      const D = M.lcm(a.d, b.d);
      const whole = Math.max(1, Math.ceil(a.n / a.d));
      if (D * whole > 60) return null;
      return { D, whole, units: (a.n * D) / a.d, per: (b.n * D) / b.d };
    }
    const setFrac = (key) => (inp) => {
      const f = M.parseFraction(inp.value);
      const prev = o[key];
      o[key] = inp.value.trim();
      if (!model()) {
        o[key] = prev;
        inp.value = prev;
        live.textContent = t(
          "Use fractions with denominators up to 12, like 2/3 or 1/4.",
          "Usa fracciones con denominadores hasta 12, como 2/3 o 1/4.",
        );
        return;
      }
      o.groups = 0;
      render();
      ctx.pushHistory();
      return f;
    };
    const aIn = MWB.textField(
      o.dividend,
      t("Dividend fraction", "Fracción dividendo"),
      setFrac("dividend"),
      64,
    );
    const bIn = MWB.textField(
      o.divisor,
      t("Divisor fraction", "Fracción divisor"),
      setFrac("divisor"),
      64,
    );
    const addG = MWB.btn(
      t("+ group", "+ grupo"),
      t("Place one more group", "Colocar un grupo más"),
      () => {
        const m = model();
        if (m && (o.groups + 1) * m.per - m.per < m.units) {
          o.groups += 1;
          render();
          ctx.pushHistory();
        } else
          live.textContent = t(
            "There is no room for another group.",
            "No hay lugar para otro grupo.",
          );
      },
    );
    const remG = MWB.btn(
      t("− group", "− grupo"),
      t("Take back the last group", "Quitar el último grupo"),
      () => {
        if (o.groups > 0) {
          o.groups -= 1;
          render();
          ctx.pushHistory();
        }
      },
    );

    function render() {
      const m = model();
      stage.textContent = "";
      if (!m) {
        read.textContent = "";
        return;
      }
      const U = Math.min(26, Math.floor(480 / (m.D * m.whole)) || 8);
      const total = m.D * m.whole;
      const W = total * U + 4;
      const s = MWB.svg("svg", {
        viewBox: `0 0 ${W} 86`,
        width: W,
        height: 86,
        role: "img",
        "aria-label": t(
          `Strip of ${total} equal parts. ${m.units} parts are the dividend. Groups of ${m.per} parts placed: ${o.groups}.`,
          `Tira de ${total} partes iguales. ${m.units} partes son el dividendo. Grupos de ${m.per} partes colocados: ${o.groups}.`,
        ),
      });
      for (let i = 0; i < total; i++) {
        s.appendChild(
          MWB.svg("rect", {
            x: 2 + i * U,
            y: 8,
            width: U,
            height: 30,
            fill: i < m.units ? "rgba(32,95,166,.55)" : "#fff",
            stroke: "#205fa6",
            "stroke-width": 1.2,
          }),
        );
      }
      s.appendChild(
        MWB.svg("rect", {
          x: 2,
          y: 8,
          width: total * U,
          height: 30,
          fill: "none",
          stroke: "#14223a",
          "stroke-width": 2,
        }),
      );
      for (let g = 0; g < o.groups; g++) {
        const x0 = 2 + g * m.per * U;
        const w = Math.min(m.per, Math.max(0, m.units - g * m.per)) * U;
        s.appendChild(
          MWB.svg("rect", {
            x: x0 + 1,
            y: 44,
            width: Math.max(2, w - 2),
            height: 22,
            rx: 5,
            fill: "#fde9b8",
            stroke: "#d97706",
            "stroke-width": 2,
          }),
        );
        s.appendChild(
          MWB.svg(
            "text",
            {
              x: x0 + w / 2,
              y: 60,
              "text-anchor": "middle",
              "font-weight": 900,
              "font-size": 12,
              fill: "#8a4b05",
            },
            String(g + 1),
          ),
        );
      }
      stage.appendChild(s);
      const used = Math.min(m.units, o.groups * m.per);
      read.textContent = t(
        `One group is ${m.per} of the ${total} parts. Groups placed: ${o.groups}. Parts left over: ${m.units - used}.`,
        `Un grupo son ${m.per} de las ${total} partes. Grupos colocados: ${o.groups}. Partes sobrantes: ${m.units - used}.`,
      );
      ctx.updateObjEl(o);
    }
    wrap.append(
      h(
        "div",
        { class: "wbx-head" },
        h("p", { class: "wbx-title" }, t("How many groups?", "¿Cuántos grupos?")),
        aIn,
        h("span", null, "÷"),
        bIn,
      ),
      stage,
      h("div", { class: "wbx-row" }, addG, remG),
      read,
      live,
    );
    render();
    return wrap;
  }

  /* ======================= Unit conversion chart ======================= */
  function buildConversion(o, ctx) {
    if (!M.CONVERSIONS[o.cat]) o.cat = "length";
    if (!["all", "customary", "metric"].includes(o.system)) o.system = "all";
    const wrap = h("div", { class: "wbx toolobj wbx-conv" });
    const liveEl = h("p", { class: "wbx-live", role: "status", "aria-live": "polite" });
    const live = (msg) => {
      liveEl.textContent = msg;
    };
    const body = h("div", { class: "wbx-convbody" });
    const sel = h("select", {
      class: "wbx-txt",
      "aria-label": t("Kind of measurement", "Tipo de medida"),
    });
    for (const [k, v] of Object.entries(M.CONVERSIONS))
      sel.appendChild(h("option", { value: k, selected: k === o.cat }, v.label));
    MWB.guard(sel);
    sel.addEventListener("change", () => {
      o.cat = sel.value;
      render();
      ctx.pushHistory();
    });
    const sys = h("div", {
      class: "wbx-row",
      role: "group",
      "aria-label": t("Measurement system", "Sistema de medida"),
    });
    for (const [k, label] of [
      ["all", t("All", "Todos")],
      ["customary", t("Customary", "Usual")],
      ["metric", t("Metric", "Métrico")],
    ]) {
      const b = MWB.btn(label, label, () => {
        o.system = k;
        render();
        ctx.pushHistory();
      });
      b.dataset.k = k;
      sys.appendChild(b);
    }
    function render() {
      body.textContent = "";
      sys
        .querySelectorAll("button")
        .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === o.system)));
      const rows = M.CONVERSIONS[o.cat].units.filter(
        (u) => o.system === "all" || u.system === o.system || u.system === "time",
      );
      for (const u of rows) {
        const use = MWB.btn(
          t("Ratio table", "Tabla de razones"),
          t(
            `Start a ratio table for ${u.from} = ${u.to}`,
            `Empezar una tabla de razones para ${u.from} = ${u.to}`,
          ),
          () => {
            const [from, to] = u.ratio;
            ctx.makeObject("ratiotable", {
              cols: 4,
              top: [String(from)],
              bottom: [String(to)],
              topLabel: u.from.replace(/^1 /, ""),
              botLabel: u.to.replace(/^[\d,]+ /, ""),
            });
            live(
              t(
                "A ratio table was added with this equivalence in the first column.",
                "Se añadió una tabla de razones con esta equivalencia en la primera columna.",
              ),
            );
          },
        );
        body.appendChild(
          h("div", { class: "wbx-convrow" }, h("span", null, `${u.from} = ${u.to}`), use),
        );
      }
      ctx.updateObjEl(o);
    }
    wrap.append(
      h("div", { class: "wbx-head" }, h("p", { class: "wbx-title" }, t("Unit conversions", "Conversiones de unidades")), sel),
      sys,
      body,
      liveEl,
    );
    render();
    return wrap;
  }

  /* ======================= registration ======================= */
  const svgIcon = (inner) =>
    `<svg viewBox="0 0 90 70" width="84" height="64" aria-hidden="true">${inner}</svg>`;
  MWB.register("factortree", {
    model: true,
    label: (o) => `Factor tree for ${o.n || 24}`,
    build: buildFactorTree,
    explain: {
      shows:
        "A number split into two factors, again and again, until every end number is prime. The end numbers multiply back to the number you started with.",
      shows_es:
        "Un número dividido en dos factores, una y otra vez, hasta que todos los números finales son primos. Los números finales se multiplican para dar el número inicial.",
      words: ["factor", "prime", "composite", "product", "prime factorization"],
      tryThis: [
        "Split the number two different ways. Do you end with the same prime numbers? Why?",
        "How do you know when a number is finished?",
      ],
    },
  });
  MWB.register("gcfladder", {
    model: true,
    label: (o) => `GCF and LCM ladder for ${o.a || 24} and ${o.b || 36}`,
    build: buildLadder,
    explain: {
      shows:
        "A ladder of divisions. Each step divides both numbers by the same factor. When no common factor is left, the steps and the leftovers tell you about the GCF and LCM.",
      shows_es:
        "Una escalera de divisiones. Cada paso divide a ambos números entre el mismo factor. Cuando ya no hay factor común, los pasos y los restos te dicen el MCD y el MCM.",
      words: ["common factor", "greatest common factor", "least common multiple", "divisor"],
      tryThis: [
        "How do the numbers on the left side help you find the GCF?",
        "How could you use the ladder to find the LCM?",
      ],
    },
  });
  MWB.register("fracdiv", {
    model: true,
    label: (o) =>
      `Fraction division strip: ${o.dividend || "2/3"} divided by ${o.divisor || "1/4"}`,
    build: buildFracDiv,
    explain: {
      shows:
        "A strip cut into equal parts the same size. The shaded part is the amount being divided. Each group is as big as the divisor. You count how many groups fit.",
      shows_es:
        "Una tira cortada en partes iguales. La parte sombreada es la cantidad que se divide. Cada grupo mide lo que el divisor. Cuentas cuántos grupos caben.",
      words: ["divide", "dividend", "divisor", "groups", "equal parts", "common denominator"],
      tryThis: [
        "Place groups until you cannot fit another whole one. What does the leftover part mean?",
        "Write a division equation that matches your picture.",
      ],
    },
  });
  MWB.register("convchart", {
    label: () => "Unit conversion chart",
    build: buildConversion,
    explain: {
      shows:
        "Equivalent measures, such as 1 foot = 12 inches. Each pair is a ratio you can use in a ratio table.",
      shows_es:
        "Medidas equivalentes, como 1 pie = 12 pulgadas. Cada par es una razón que puedes usar en una tabla de razones.",
      words: ["unit", "equivalent", "ratio", "convert"],
      tryThis: ["Pick a row and build a ratio table. How do you use it to convert a new measure?"],
    },
  });

  const S = "Number theory, fractions & units";
  MWB.addPalette({
    section: S,
    key: "factortree",
    name: "Factor tree",
    es: "Árbol de factores",
    svg: svgIcon(
      '<g fill="#fff" stroke="#205fa6" stroke-width="2"><circle cx="45" cy="14" r="9"/><circle cx="28" cy="38" r="9"/><circle cx="62" cy="38" r="9"/><circle cx="18" cy="60" r="7" fill="#d1fae5"/><circle cx="38" cy="60" r="7" fill="#d1fae5"/></g><g stroke="#205fa6" stroke-width="2"><line x1="40" y1="21" x2="31" y2="31"/><line x1="50" y1="21" x2="59" y2="31"/><line x1="24" y1="45" x2="19" y2="54"/><line x1="32" y1="45" x2="37" y2="54"/></g>',
    ),
    go: () => MWB.ctx.makeObject("factortree", { n: 24 }),
  });
  MWB.addPalette({
    section: S,
    key: "gcfladder",
    name: "GCF / LCM ladder",
    es: "Escalera MCD/MCM",
    svg: svgIcon(
      '<g stroke="#205fa6" stroke-width="2" fill="none"><line x1="20" y1="14" x2="20" y2="60"/><line x1="20" y1="24" x2="74" y2="24"/><line x1="20" y1="42" x2="74" y2="42"/></g><g font-size="11" font-weight="800" fill="#14223a"><text x="30" y="20">24 36</text><text x="30" y="38">12 18</text><text x="30" y="56">…</text></g>',
    ),
    go: () => MWB.ctx.makeObject("gcfladder", { a: 24, b: 36 }),
  });
  MWB.addPalette({
    section: S,
    key: "fracdiv",
    name: "Fraction division strip",
    es: "Tira de división",
    svg: svgIcon(
      '<g stroke="#205fa6" stroke-width="2"><rect x="8" y="16" width="74" height="20" fill="#fff"/><rect x="8" y="16" width="50" height="20" fill="rgba(32,95,166,.5)"/><rect x="8" y="44" width="18" height="14" rx="3" fill="#fde9b8" stroke="#d97706"/><rect x="28" y="44" width="18" height="14" rx="3" fill="#fde9b8" stroke="#d97706"/></g>',
    ),
    go: () => MWB.ctx.makeObject("fracdiv", {}),
  });
  MWB.addPalette({
    section: S,
    key: "convchart",
    name: "Unit conversions",
    es: "Conversiones",
    svg: svgIcon(
      '<g font-size="10" font-weight="800" fill="#14223a"><text x="8" y="22">1 ft = 12 in</text><text x="8" y="40">1 yd = 3 ft</text><text x="8" y="58">1 m = 100 cm</text></g>',
    ),
    go: () => MWB.ctx.makeObject("convchart", {}),
  });
})(window);
