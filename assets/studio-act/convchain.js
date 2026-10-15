/**
 * Practice Studio activity: convchain (lessons 3-6, 3-7, 3-10).
 *
 * Build a unit-conversion chain one step at a time. Each step picks multiply or divide and a factor tile; the running
 * number and its unit update. A miss explains the direction logic ("feet are smaller than yards, so more feet") without
 * giving the number. system "same": inside one measurement system (levels 1-3, one or two steps).
 * system "between": customary and metric, with "about" facts and a stated rounding place (level 4).
 * Text is "English|Spanish" pairs. Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;
  const f4 = (n) => G.fmt(n, 4);
  const commas = (n) => G.commas(Number(f4(n)));
  const fill1 = (s, o, sfx) =>
    s.replace(/\{(\w+)\}/g, (_, k) => o[k + sfx] ?? o[k]).replace(/^./, (c) => c.toUpperCase());
  const no = (tag, o) => {
    const [en, es] = MSG[tag].split("|");
    const say = fill1(en, o, "");
    const sayEs = fill1(es, o, "e");
    return { ok: false, tag, say, sayEs };
  };
  const UNIT = {
    yd: "yards|yardas",
    ft: "feet|pies",
    in: "inches|pulgadas",
    mi: "miles|millas",
    km: "kilometers|kilómetros",
    m: "meters|metros",
    cm: "centimeters|centímetros",
    mm: "millimeters|milímetros",
    L: "liters|litros",
    mL: "milliliters|mililitros",
    kg: "kilograms|kilogramos",
    g: "grams|gramos",
    lb: "pounds|libras",
    oz: "ounces|onzas",
    gal: "gallons|galones",
    qt: "quarts|cuartos",
    pt: "pints|pintas",
    cup: "cups|tazas",
    hr: "hours|horas",
    min: "minutes|minutos",
    s: "seconds|segundos",
  };
  /** Unit ladders, biggest first; n[i] of the next unit make 1 of this one. */
  const LADDERS = [
    { u: ["yd", "ft", "in"], n: [3, 12] },
    { u: ["km", "m", "cm"], n: [1000, 100] },
    { u: ["m", "cm", "mm"], n: [100, 10] },
    { u: ["gal", "qt", "pt", "cup"], n: [4, 2, 2] },
    { u: ["hr", "min", "s"], n: [60, 60] },
    { u: ["kg", "g"], n: [1000] },
    { u: ["L", "mL"], n: [1000] },
    { u: ["lb", "oz"], n: [16] },
  ];
  const ACROSS = [
    ["in", "cm", 2.54],
    ["mi", "km", 1.6],
    ["kg", "lb", 2.2],
    ["gal", "L", 3.8],
  ];
  const MSG = {
    incomplete:
      "Finish every step: choose multiply or divide AND a factor for each step you added.|Termina cada paso: elige multiplicar o dividir Y un factor para cada paso que añadiste.",
    "wrong-direction-up":
      "{a} are the bigger unit, so the same amount is measured by MORE {b}. Multiplying makes a bigger number; dividing makes a smaller one.|{a} es la unidad más grande, así que la misma cantidad se mide con MÁS {b}. Multiplicar da un número mayor; dividir da uno menor.",
    "wrong-direction-down":
      "{a} are the smaller unit, so it takes FEWER {b} to measure the same amount. Dividing makes a smaller number; multiplying makes a bigger one.|{a} es la unidad más pequeña, así que se necesitan MENOS {b} para medir la misma cantidad. Dividir da un número menor; multiplicar da uno mayor.",
    "wrong-factor":
      "That factor does not link {a} to the next unit. Read the facts again and find the one that has {a} in it.|Ese factor no conecta {a} con la siguiente unidad. Lee otra vez los datos y busca el que tiene {a}.",
    "wrong-unit":
      "Your chain ends in {a}, but the question asks for {b}. Check where each step leaves you, then add or remove a step.|Tu cadena termina en {a}, pero la pregunta pide {b}. Revisa dónde te deja cada paso y añade o quita un paso.",
    "round-missing":
      "The facts say about, so the answer is an estimate. Choose the place to round to, as the question says.|Los datos dicen aproximadamente, así que la respuesta es una estimación. Elige el lugar al que redondear, como dice la pregunta.",
    "round-place":
      "The question asks you to round to a different place. Look at the digit just after the place you need.|La pregunta pide redondear a otro lugar. Mira el dígito que sigue al lugar que necesitas.",
  };
  const HINTS = [
    "Compare the size of the two units. The smaller unit needs more of them to make the same amount.|Compara el tamaño de las dos unidades. La unidad más pequeña necesita más piezas para formar la misma cantidad.",
    "Find the fact that has your unit in it. Multiply to go to a smaller unit, divide to go to a bigger unit.|Busca el dato que tiene tu unidad. Multiplica para ir a una unidad más pequeña, divide para ir a una más grande.",
    "Do one fact at a time. The unit you land in after one step is the unit you start the next step from.|Haz un dato a la vez. La unidad en que quedas después de un paso es la unidad desde la que empiezas el siguiente.",
  ];
  const EXPLAIN =
    "A conversion factor is a ratio between two units. To go to a smaller unit you need more of them, so you multiply. To go to a bigger unit you need fewer, so you divide.|Un factor de conversión es una razón entre dos unidades. Para ir a una unidad más pequeña necesitas más, así que multiplicas. Para ir a una más grande necesitas menos, así que divides.";
  /** @type {[string, number][]} */
  const PLACES = [
    ["whole number|número entero", 0],
    ["tenth|décima", 1],
    ["hundredth|centésima", 2],
  ];

  /* ---- model ----------------------------------------------------------------------------------------- */
  const stepOf = (facts, from, op, n) =>
    facts.find((x) => x.n === n && (op === "×" ? x.big === from : x.small === from));
  const run = (M, st) => {
    let v = M.v;
    let u = M.from;
    const trail = [];
    for (const s of st.steps) {
      const fact = u === null ? null : stepOf(M.facts, u, s.op, s.f);
      if (fact) {
        v = s.op === "×" ? v * s.f : v / s.f;
        u = s.op === "×" ? fact.small : fact.big;
      } else u = null;
      trail.push({ v, u });
    }
    return trail;
  };
  const mkSame = (rng, lv) => {
    const L = rng.pick(LADDERS.filter((l) => l.u.length >= (lv === 3 ? 3 : 2)));
    const span = lv === 3 ? 2 : 1;
    const i = rng.int(0, L.u.length - 1 - span);
    const down = lv === 2 ? false : lv === 3 ? rng.chance(0.5) : true;
    const ns = L.n.slice(i, i + span);
    const mult = ns.reduce((a, b) => a * b, 1);
    const k = rng.int(2, 15);
    const path = L.u.slice(i, i + span + 1);
    const facts = L.u.slice(0, -1).map((u, j) => ({ big: u, small: L.u[j + 1], n: L.n[j] }));
    const from = down ? path[0] : path[span];
    const to = down ? path[span] : path[0];
    const v = down ? k : k * mult;
    const chain = (down ? ns : ns.slice().reverse()).map((f) => ({ op: down ? "×" : "÷", f }));
    return { v, from, to, facts, chain, answer: down ? k * mult : k, place: null, approx: false };
  };
  const mkAcross = (rng) => {
    const [big, small, n] = rng.pick(ACROSS);
    const down = rng.chance(0.5);
    const place = down && n !== 2.54 ? 0 : rng.pick([0, 1]);
    for (;;) {
      const v = rng.int(3, 40);
      const raw = down ? v * n : v / n;
      const r = Number(raw.toFixed(place));
      if (Math.abs(raw - r) > 0.04 && Math.abs(raw - Math.round(raw)) > 0.04) {
        const extra = rng.pick(ACROSS.filter((a) => a[2] !== n));
        const facts = [
          { big, small, n, approx: true },
          { big: extra[0], small: extra[1], n: extra[2], approx: true },
        ];
        return {
          v,
          from: down ? big : small,
          to: down ? small : big,
          facts,
          chain: [{ op: down ? "×" : "÷", f: n }],
          answer: raw,
          place,
          approx: true,
        };
      }
    }
  };
  const tiles = (M) =>
    [...new Set(M.facts.map((x) => x.n).concat(M.approx ? [] : [10]))].sort((a, b) => a - b);
  const unitName = (u, es) => UNIT[u].split("|")[es ? 1 : 0];

  const grade = (spec, st) => {
    const M = spec.model;
    const steps = Array.isArray(st?.steps) ? st.steps : [];
    if (!steps.length || steps.some((s) => (s.op !== "×" && s.op !== "÷") || !(s.f > 0)))
      return no("incomplete");
    let u = M.from;
    for (const s of steps) {
      if (u === null) break;
      const fact = stepOf(M.facts, u, s.op, s.f);
      if (fact) {
        u = s.op === "×" ? fact.small : fact.big;
        continue;
      }
      const other = M.facts.find((x) => x.n === s.f && (x.big === u || x.small === u));
      if (!other) return no("wrong-factor", { a: unitName(u, false), ae: unitName(u, true) });
      const upDir = other.big === u;
      return no(upDir ? "wrong-direction-up" : "wrong-direction-down", {
        a: unitName(u, false),
        b: unitName(upDir ? other.small : other.big, false),
        ae: unitName(u, true),
        be: unitName(upDir ? other.small : other.big, true),
      });
    }
    if (u !== M.to) return no("wrong-unit", { a: unitName(u, false), b: unitName(M.to, false) });
    if (M.place === null) return { ok: true };
    if (!Number.isInteger(st.round)) return no("round-missing");
    return st.round === M.place ? { ok: true } : no("round-place");
  };

  A.register("convchain", {
    title: "Conversion chain",
    titleEs: "Cadena de conversión",
    levels: 4,
    make(rng, level, params) {
      const system = params.system || (level === 4 ? "between" : "same");
      const M = system === "between" ? mkAcross(rng) : mkSame(rng, level);
      const f1 = unitName(M.from, false);
      const t1 = unitName(M.to, false);
      const pl = PLACES.find((p) => p[1] === M.place);
      const [pe, ps] = pl ? pl[0].split("|") : ["", ""];
      const q = `Convert ${commas(M.v)} ${f1} to ${t1}. Build a chain of steps; each step multiplies or divides by a factor.${M.approx ? ` The facts say about, so round to the nearest ${pe}.` : ""}`;
      const qEs = `Convierte ${commas(M.v)} ${unitName(M.from, true)} a ${unitName(M.to, true)}. Construye una cadena de pasos; cada paso multiplica o divide por un factor.${M.approx ? ` Los datos dicen aproximadamente, así que redondea a la ${ps} más cercana.` : ""}`;
      const [x, xEs] = EXPLAIN.split("|");
      const hs = HINTS.map((s) => s.split("|"));
      return { system, q, qEs, x, xEs, h: hs.map((s) => s[0]), hEs: hs.map((s) => s[1]), model: M };
    },
    solution: (spec) => ({
      steps: spec.model.chain.map((s) => ({ ...s })),
      round: spec.model.place,
    }),
    wrong(spec) {
      const M = spec.model;
      const c = M.chain;
      const out = [];
      const add = (s) => grade(spec, s).ok || out.push(s);
      const flip = (s) => ({ op: s.op === "×" ? "÷" : "×", f: s.f });
      add({ steps: [{ op: null, f: null }], round: null });
      add({ steps: [flip(c[0]), ...c.slice(1)], round: M.place });
      const other = tiles(M).find((n) => n !== c[0].f);
      add({ steps: [{ op: c[0].op, f: other }, ...c.slice(1)], round: M.place });
      if (c.length > 1) add({ steps: c.slice(0, 1), round: M.place });
      if (M.place !== null) add({ steps: c, round: null });
      if (M.place !== null) add({ steps: c, round: (M.place + 1) % 3 });
      return out;
    },
    grade,
    mount: (host, spec, api) => mountChain(host, spec, api),
  });

  /* ---- widget ---------------------------------------------------------------------------------------- */
  const CSS = `
.cc-root{display:grid;gap:12px;color:var(--ink,#1B2733);font:inherit}
.cc-btn{appearance:none;font:inherit;font-weight:800;cursor:pointer;min-height:44px;min-width:44px;padding:4px 14px;border-radius:var(--radius-md,14px);border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;background:var(--surface,#fff);color:var(--ink,#1B2733)}
.cc-btn:hover:not(:disabled){background:var(--brand-tint,#E5ECF3)}
.cc-btn:disabled{opacity:.45;cursor:not-allowed}
.cc-btn[aria-checked="true"]{background:var(--brand-tint,#E5ECF3);box-shadow:inset 0 0 0 2px var(--brand,#2C4A68)}
.cc-go .es-text{color:inherit}
.cc-go{background:var(--brand,#2C4A68);color:var(--surface,#fff)}
.cc-go:hover:not(:disabled){background:var(--brand,#2C4A68);filter:brightness(1.12)}
.cc-btn:focus-visible{outline:4px solid var(--sun,#F0BD4F);outline-offset:2px}
.cc-h{margin:0;font-weight:800}
.cc-facts{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:0;padding:0}
.cc-fact{padding:6px 12px;border:2px solid var(--brand-line,#BBCADA);border-radius:12px;background:var(--brand-tint,#E5ECF3);font-weight:700}
.cc-step{border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:10px;display:grid;gap:8px;background:var(--surface,#fff)}
.cc-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.cc-op{font-size:1.4rem;min-width:56px}
.cc-tile{min-width:64px;font-size:1.1rem}
.cc-run{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-weight:800;font-size:1.15rem}
.cc-val{padding:4px 12px;border:2px solid var(--brand,#2C4A68);border-radius:12px;background:var(--brand-tint,#E5ECF3)}
.cc-val.bad{border-style:dashed;border-color:var(--bad,#B42318)}
.cc-act{display:flex;flex-wrap:wrap;gap:10px}
@media (forced-colors:active){.cc-btn,.cc-fact,.cc-step{border-color:ButtonText}}
`;

  function mountChain(host, spec, api) {
    A.css("convchain", CSS);
    const M = spec.model;
    const ro = !!api.solved;
    const es = () => !!api.es?.();
    const L = (en, e) => (es() ? e : en);
    const B = (en, e) => A.t(en, e);
    const h = (tg, cls = "", html = "", at = {}) => /** @type {any} */ (A.el(tg, cls, html, at));
    const nm = (u) => unitName(u, false);
    const nmB = (u) => unitName(u, es());
    const one = (u) =>
      unitName(u, es())
        .replace(/^feet$/, "foot")
        .replace(/^inches$/, "inch")
        .replace(/^pies$/, "pie")
        .replace(/s$/, "");
    const init = () => ({ steps: [{ op: null, f: null }], round: null });
    let st = api.restore ? JSON.parse(JSON.stringify(api.restore)) : init();
    const save = (say) => {
      api.change?.(JSON.parse(JSON.stringify(st)));
      if (say) api.say?.(say);
      draw();
    };
    host.textContent = "";
    const root = h("div", `cc-root${ro ? " is-ro" : ""}`);
    const body = h("div", "cc-root");
    host.append(root);
    root.append(body);
    const btn = (html, fn, cls = "", label = "") => {
      const b = h("button", `cc-btn ${cls}`, html, { type: "button" });
      if (label) b.setAttribute("aria-label", label);
      b.addEventListener("click", fn);
      b.disabled = ro;
      return b;
    };
    const fmtV = (v) => commas(M.approx ? Math.round(v * 10000) / 10000 : v);
    const bigFactB = (x) =>
      `1 ${one(x.big)} ${x.approx ? L("≈ (about)", "≈ (aproximadamente)") : "="} ${commas(x.n)} ${nmB(x.small)}`;

    function draw() {
      const focus = document.activeElement?.getAttribute?.("aria-label");
      body.textContent = "";
      body.append(h("p", "cc-h", B("Facts you can use", "Datos que puedes usar")));
      const facts = h("ul", "cc-facts");
      for (const x of M.facts) facts.append(h("li", "cc-fact", bigFactB(x)));
      body.append(facts);
      const trail = run(M, st);
      let unit = M.from;
      let val = M.v;
      st.steps.forEach((s, i) => {
        const card = h("div", "cc-step");
        card.append(
          h(
            "p",
            "cc-h",
            B(
              `Step ${i + 1}: start with ${fmtV(val)} ${unit ? nm(unit) : "?"}`,
              `Paso ${i + 1}: empieza con ${fmtV(val)} ${unit ? unitName(unit, true) : "?"}`,
            ),
          ),
        );
        const ops = h("div", "cc-row", "", {
          role: "radiogroup",
          "aria-label": L(`Step ${i + 1} operation`, `Operación del paso ${i + 1}`),
        });
        for (const op of ["×", "÷"]) {
          const b = btn(
            op,
            () => ((s.op = op), save()),
            "cc-op",
            op === "×"
              ? L(`Step ${i + 1}: multiply`, `Paso ${i + 1}: multiplicar`)
              : L(`Step ${i + 1}: divide`, `Paso ${i + 1}: dividir`),
          );
          b.setAttribute("role", "radio");
          b.setAttribute("aria-checked", String(s.op === op));
          ops.append(b);
        }
        const fs = h("div", "cc-row", "", {
          role: "radiogroup",
          "aria-label": L(`Step ${i + 1} factor`, `Factor del paso ${i + 1}`),
        });
        for (const n of tiles(M)) {
          const b = btn(
            commas(n),
            () => ((s.f = n), save()),
            "cc-tile",
            L(`Step ${i + 1}: factor ${n}`, `Paso ${i + 1}: factor ${n}`),
          );
          b.setAttribute("role", "radio");
          b.setAttribute("aria-checked", String(s.f === n));
          fs.append(b);
        }
        card.append(ops, fs);
        if (s.op && s.f) {
          const t = trail[i];
          const ok = t.u !== null;
          card.append(
            h(
              "div",
              "cc-run",
              `<span>${fmtV(val)} ${unit ? nmB(unit) : "?"}</span><span>${s.op} ${commas(s.f)}</span><span>=</span><span class="cc-val${ok ? "" : " bad"}">${fmtV(t.v)} ${ok ? nmB(t.u) : "?"}</span>`,
            ),
          );
          unit = t.u;
          val = t.v;
        }
        if (!ro && i === st.steps.length - 1 && st.steps.length > 1)
          card.append(
            btn(B("Remove this step", "Quitar este paso"), () => (st.steps.pop(), save())),
          );
        body.append(card);
      });
      if (!ro && st.steps.length < 3)
        body.append(
          btn(
            B("+ Add a step", "+ Añadir un paso"),
            () => (st.steps.push({ op: null, f: null }), save()),
            "",
            L("Add a step", "Añadir un paso"),
          ),
        );
      if (M.place !== null) {
        body.append(h("p", "cc-h", B("Round to the nearest", "Redondea a la más cercana")));
        const row = h("div", "cc-row", "", {
          role: "radiogroup",
          "aria-label": L("Rounding place", "Lugar de redondeo"),
        });
        PLACES.forEach(([text, p]) => {
          const [e, s] = text.split("|");
          const b = btn(B(e, s), () => ((st.round = p), save()));
          b.setAttribute("role", "radio");
          b.setAttribute("aria-checked", String(st.round === p));
          row.append(b);
        });
        body.append(row);
        if (Number.isInteger(st.round) && unit)
          body.append(
            h(
              "p",
              "cc-run",
              `<span class="cc-val">${commas(Number(val.toFixed(st.round)))} ${nmB(unit)}</span>`,
            ),
          );
      }
      if (focus)
        for (const e of body.querySelectorAll("[aria-label]"))
          if (e.getAttribute("aria-label") === focus) return void e.focus?.();
    }
    draw();
    if (!ro) {
      const act = h("div", "cc-act");
      const reset = btn(B("Start over", "Empezar de nuevo"), () => {
        st = init();
        save(L("Started over.", "Empezaste de nuevo."));
      });
      act.append(
        btn(B("Check", "Revisar"), () => api.submit?.(JSON.parse(JSON.stringify(st))), "cc-go"),
        btn(B("Hint", "Pista"), () => api.hint?.()),
        reset,
      );
      root.append(act);
    }
  }
})();
