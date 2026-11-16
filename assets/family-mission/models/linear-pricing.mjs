// Linear Pricing / Concert Venue Model (`y = rate * t + fixed`), with optional Plan B comparison.
// Built as the reference implementation for Lesson 6-5 (12t + 50) and reusable for linear expressions.
import {
  clear,
  createView,
  defineFamily,
} from "./core.mjs";

function svg(tag, attrs = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v != null) node.setAttribute(k, String(v));
  }
  return node;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "text") node.textContent = v;
    else if (k === "hidden") node.hidden = Boolean(v);
    else if (v != null) node.setAttribute(k, String(v));
  }
  for (const ch of Array.isArray(children) ? children : [children]) {
    if (ch != null) node.appendChild(typeof ch === "string" ? document.createTextNode(ch) : ch);
  }
  return node;
}

const COPY = {
  en: {
    title: "Concert Ticket & Venue Studio",
    subtitle: "Change the number of tickets (t) and watch every representation update together.",
    ticketsLabel: "Tickets (t)",
    decrease: "One fewer ticket",
    increase: "One more ticket",
    variableTerm: "Variable cost",
    fixedTerm: "One-time fee",
    totalCost: "Total cost",
    expressionTitle: "Expression & Evaluation",
    tableTitle: "Table of Values",
    graphTitle: "Coordinate Graph",
    colTickets: "Tickets (t)",
    colPlanA: "Plan A: {expr}",
    colPlanB: "Plan B: {exprB}",
    compareToggle: "Compare two pricing plans",
    adjustToggle: "Test changing price or fee",
    priceLabel: "Ticket price ($)",
    feeLabel: "One-time fee ($)",
    resetParams: "Reset to 12t + 50",
    planALabel: "Plan A",
    planBLabel: "Plan B",
    cheaperA: "Plan A costs ${diff} less at t = {t}.",
    cheaperB: "Plan B costs ${diff} less at t = {t}.",
    equalPlans: "Both plans cost the exact same (${total}) at t = {t}!",
    staysSame: "Stays constant: +${fixed} once",
    changesWithT: "Grows by ${rate} per ticket",
    whyNot62tTitle: "Why is 62t incorrect?",
    whyNot62tBody:
      "62t would charge the $50 venue fee on EVERY ticket ($62 per ticket). Instead, $12 multiplies t, and $50 is added once.",
    investigateTitle: "Notice & Investigate",
    q1: "As t increases by 1, the total grows by ${rate}. The ${fixed} fee never repeats.",
    q2: "At t = 0 tickets, the cost is still ${fixed} — that is where the graph starts on the vertical axis.",
    venueStage: "MAIN STAGE",
    oneTimeBadge: "One-time fee: ${fixed}",
    ticketEach: "${rate} each",
    moreTickets: "+{n} more",
    ariaDesc:
      "Interactive concert pricing model for {expr}. Currently t = {t} tickets, total cost = ${total}.",
  },
  es: {
    title: "Estudio de Boletos y Lugar del Concierto",
    subtitle: "Cambia el número de boletos (t) y observa cómo se actualizan todas las representaciones juntas.",
    ticketsLabel: "Boletos (t)",
    decrease: "Un boleto menos",
    increase: "Un boleto más",
    variableTerm: "Costo variable",
    fixedTerm: "Tarifa única",
    totalCost: "Costo total",
    expressionTitle: "Expresión y evaluación",
    tableTitle: "Tabla de valores",
    graphTitle: "Gráfica de coordenadas",
    colTickets: "Boletos (t)",
    colPlanA: "Plan A: {expr}",
    colPlanB: "Plan B: {exprB}",
    compareToggle: "Comparar dos planes de precios",
    adjustToggle: "Probar cambiando precio o tarifa",
    priceLabel: "Precio por boleto ($)",
    feeLabel: "Tarifa única ($)",
    resetParams: "Restablecer a 12t + 50",
    planALabel: "Plan A",
    planBLabel: "Plan B",
    cheaperA: "El Plan A cuesta ${diff} menos con t = {t}.",
    cheaperB: "El Plan B cuesta ${diff} menos con t = {t}.",
    equalPlans: "¡Ambos planes cuestan exactamente lo mismo (${total}) con t = {t}!",
    staysSame: "Se mantiene constante: +${fixed} una vez",
    changesWithT: "Crece ${rate} por cada boleto",
    whyNot62tTitle: "¿Por qué 62t es incorrecto?",
    whyNot62tBody:
      "62t cobraría la tarifa de $50 en CADA boleto ($62 por boleto). En cambio, $12 multiplica a t y $50 se suma una sola vez.",
    investigateTitle: "Observa e investiga",
    q1: "Cuando t aumenta en 1, el total crece ${rate}. La tarifa de ${fixed} nunca se repite.",
    q2: "Con t = 0 boletos, el costo sigue siendo ${fixed}; ahí empieza la gráfica en el eje vertical.",
    venueStage: "ESCENARIO",
    oneTimeBadge: "Tarifa única: ${fixed}",
    ticketEach: "${rate} c/u",
    moreTickets: "+{n} más",
    ariaDesc:
      "Modelo interactivo de precios de concierto para {expr}. Actualmente t = {t} boletos, costo total = ${total}.",
  },
};

function fmt(tpl, vars) {
  return String(tpl).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : ""));
}

function exprText(rate, fixed, varName) {
  if (fixed === 0) return `${rate}${varName}`;
  return `${rate}${varName} + ${fixed}`;
}

export const id = "linear-pricing";
export const label = { en: "Linear Pricing Studio", es: "Estudio de Precios Lineales" };

export const create = defineFamily({
  id,
  normalize(config = {}) {
    const rate = Number.isFinite(config.rate) ? config.rate : 12;
    const fixed = Number.isFinite(config.fixed) ? config.fixed : 50;
    const varName = String(config.varName || "t").slice(0, 2) || "t";
    const maxT = Number.isFinite(config.maxT) ? config.maxT : 12;
    const initial = Number.isFinite(config.initial) ? Math.max(0, Math.min(maxT, config.initial)) : 3;
    const compareRate = Number.isFinite(config.compareRate) ? config.compareRate : 15;
    const compareFixed = Number.isFinite(config.compareFixed) ? config.compareFixed : 20;
    return {
      state: {
        t: initial,
        rate,
        fixed,
        baseRate: rate,
        baseFixed: fixed,
        varName,
        maxT,
        compareMode: Boolean(config.compareMode),
        adjustMode: false,
        compareRate,
        compareFixed,
        itemEn: config.itemEn || "ticket",
        itemEs: config.itemEs || "boleto",
      },
      task: config.task || null,
    };
  },
  reduce(state, patch) {
    const next = { ...state };
    if ("t" in patch) next.t = Math.max(0, Math.min(next.maxT, Math.round(Number(patch.t) || 0)));
    if ("rate" in patch) next.rate = Math.max(1, Math.min(30, Math.round(Number(patch.rate) || 1)));
    if ("fixed" in patch) next.fixed = Math.max(0, Math.min(100, Math.round(Number(patch.fixed) || 0)));
    if ("compareMode" in patch) next.compareMode = Boolean(patch.compareMode);
    if ("adjustMode" in patch) next.adjustMode = Boolean(patch.adjustMode);
    if (patch.resetParams) {
      next.rate = next.baseRate;
      next.fixed = next.baseFixed;
    }
    return next;
  },
  validateState(state) {
    return state.t >= 0 && state.t <= state.maxT && state.rate >= 1 && state.fixed >= 0;
  },
  track(state) {
    return { t: state.t, rate: state.rate, fixed: state.fixed, compareMode: state.compareMode };
  },
  derive(state) {
    const varCost = state.rate * state.t;
    const total = varCost + state.fixed;
    const totalB = state.compareRate * state.t + state.compareFixed;
    return {
      ...state,
      varCost,
      total,
      totalB,
      expr: exprText(state.rate, state.fixed, state.varName),
      exprB: exprText(state.compareRate, state.compareFixed, state.varName),
    };
  },
  validateTask(state, task) {
    if (!task) return { ok: true };
    const total = state.rate * state.t + state.fixed;
    if (typeof task.targetT === "number" && state.t !== task.targetT) {
      return { ok: false, reason: "t" };
    }
    if (typeof task.targetTotal === "number" && total !== task.targetTotal) {
      return { ok: false, reason: "total" };
    }
    return { ok: true };
  },
  accessibleDescription(state, lang) {
    const c = COPY[lang] || COPY.en;
    const total = state.rate * state.t + state.fixed;
    return fmt(c.ariaDesc, {
      expr: exprText(state.rate, state.fixed, state.varName),
      t: state.t,
      total,
    });
  },
  explanation(state, lang) {
    const c = COPY[lang] || COPY.en;
    const total = state.rate * state.t + state.fixed;
    return `${exprText(state.rate, state.fixed, state.varName)} -> ${state.rate}(${state.t}) + ${state.fixed} = $${total}. ${fmt(c.q1, { rate: state.rate, fixed: state.fixed })}`;
  },
  describeConfig(state) {
    return { rate: state.rate, fixed: state.fixed, varName: state.varName, initial: state.t };
  },
});

function drawVenueSvg(host, st, c) {
  clear(host);
  const s = svg("svg", {
    viewBox: "0 0 540 185",
    class: "lp-venue-svg",
    role: "img",
    "aria-label": fmt(c.ariaDesc, { expr: st.expr, t: st.t, total: st.total }),
  });

  // Warm concert hall backdrop
  s.appendChild(svg("rect", { x: 0, y: 0, width: 540, height: 185, rx: 14, fill: "#13293d" }));
  // Stage canopy
  s.appendChild(svg("path", { d: "M24 22 H516 L498 54 H42 Z", fill: "#1d3b56", stroke: "#38618c", "stroke-width": 1.5 }));
  // Stage spotlights proportional to t
  const litCount = Math.min(6, Math.max(1, Math.ceil(st.t / 2)));
  for (let i = 0; i < 6; i++) {
    const cx = 92 + i * 71;
    const isLit = i < litCount && st.t > 0;
    if (isLit) {
      s.appendChild(
        svg("polygon", {
          points: `${cx},36 ${cx - 26},102 ${cx + 26},102`,
          fill: "rgba(244, 196, 98, 0.16)",
        }),
      );
    }
    s.appendChild(
      svg("circle", {
        cx,
        cy: 36,
        r: 6,
        fill: isLit ? "#f4c462" : "#3a556e",
      }),
    );
  }
  const stageTxt = svg("text", {
    x: 270,
    y: 41,
    "text-anchor": "middle",
    fill: "#f8f4ea",
    "font-size": 11,
    "font-weight": 700,
    "letter-spacing": "2",
  });
  stageTxt.textContent = c.venueStage;
  s.appendChild(stageTxt);

  // One-time Venue Fee Card (Constant — terracotta/gold)
  s.appendChild(
    svg("rect", {
      x: 22,
      y: 72,
      width: 144,
      height: 92,
      rx: 10,
      fill: st.fixed > 0 ? "#b85c38" : "#2d4861",
      stroke: st.fixed > 0 ? "#f4c462" : "#4a6b88",
      "stroke-width": 2,
    }),
  );
  const feeTitle = svg("text", { x: 94, y: 97, "text-anchor": "middle", fill: "#fff7ed", "font-size": 11, "font-weight": 700 });
  feeTitle.textContent = c.fixedTerm.toUpperCase();
  s.appendChild(feeTitle);
  const feeVal = svg("text", { x: 94, y: 129, "text-anchor": "middle", fill: "#ffffff", "font-size": 26, "font-weight": 800 });
  feeVal.textContent = `$${st.fixed}`;
  s.appendChild(feeVal);
  const feeSub = svg("text", { x: 94, y: 150, "text-anchor": "middle", fill: "#fde6d8", "font-size": 11 });
  feeSub.textContent = fmt(c.staysSame, { fixed: st.fixed }).replace(`+$${st.fixed} `, "");
  s.appendChild(feeSub);

  // Plus connector
  const plusTxt = svg("text", { x: 184, y: 126, "text-anchor": "middle", fill: "#f4c462", "font-size": 24, "font-weight": 800 });
  plusTxt.textContent = "+";
  s.appendChild(plusTxt);

  // Ticket Rack (Variable term — teal tickets)
  s.appendChild(
    svg("rect", {
      x: 202,
      y: 72,
      width: 316,
      height: 92,
      rx: 10,
      fill: "#16354d",
      stroke: "#2b7a78",
      "stroke-width": 2,
    }),
  );
  const showMax = 6;
  const shown = Math.min(st.t, showMax);
  for (let i = 0; i < shown; i++) {
    const tx = 214 + i * 44;
    const ty = 86;
    s.appendChild(svg("rect", { x: tx, y: ty, width: 38, height: 52, rx: 6, fill: "#1b8a83", stroke: "#8de0d8", "stroke-width": 1.5 }));
    s.appendChild(svg("circle", { cx: tx, cy: ty + 26, r: 4, fill: "#16354d" }));
    s.appendChild(svg("circle", { cx: tx + 38, cy: ty + 26, r: 4, fill: "#16354d" }));
    const tNum = svg("text", { x: tx + 19, y: ty + 22, "text-anchor": "middle", fill: "#ffffff", "font-size": 11, "font-weight": 800 });
    tNum.textContent = `$${st.rate}`;
    s.appendChild(tNum);
    const tIdx = svg("text", { x: tx + 19, y: ty + 39, "text-anchor": "middle", fill: "#d4f7f3", "font-size": 9, "font-weight": 700 });
    tIdx.textContent = `#${i + 1}`;
    s.appendChild(tIdx);
  }
  if (st.t > showMax) {
    const more = svg("text", { x: 494, y: 117, "text-anchor": "middle", fill: "#8de0d8", "font-size": 12, "font-weight": 800 });
    more.textContent = fmt(c.moreTickets, { n: st.t - showMax });
    s.appendChild(more);
  } else if (st.t === 0) {
    const empty = svg("text", { x: 360, y: 118, "text-anchor": "middle", fill: "#9fb8cc", "font-size": 13, "font-weight": 600 });
    empty.textContent = `0 × $${st.rate} = $0`;
    s.appendChild(empty);
  }
  const rackCap = svg("text", { x: 360, y: 155, "text-anchor": "middle", fill: "#b9e8e3", "font-size": 11, "font-weight": 700 });
  rackCap.textContent = `${st.rate}${st.varName} = ${st.rate}(${st.t}) = $${st.varCost}`;
  s.appendChild(rackCap);

  host.appendChild(s);
}

function drawGraphSvg(host, st, c) {
  clear(host);
  const W = 320;
  const H = 220;
  const padL = 44;
  const padR = 16;
  const padT = 18;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxX = Math.max(8, st.maxT);
  const maxY = Math.max(200, Math.ceil((Math.max(st.rate, st.compareRate) * maxX + Math.max(st.fixed, st.compareFixed)) / 50) * 50);

  const px = (x) => padL + (x / maxX) * plotW;
  const py = (y) => padT + plotH - (y / maxY) * plotH;

  const s = svg("svg", {
    viewBox: `0 0 ${W} ${H}`,
    class: "lp-graph-svg",
    role: "img",
    "aria-label": `${c.graphTitle}: (${st.t}, ${st.total})`,
  });

  // Grid lines
  for (let y = 0; y <= maxY; y += 50) {
    const yy = py(y);
    s.appendChild(svg("line", { x1: padL, y1: yy, x2: W - padR, y2: yy, stroke: "#e4dfd3", "stroke-width": 1 }));
    const lbl = svg("text", { x: padL - 6, y: yy + 4, "text-anchor": "end", fill: "#52606d", "font-size": 10 });
    lbl.textContent = `$${y}`;
    s.appendChild(lbl);
  }
  for (let x = 0; x <= maxX; x += 2) {
    const xx = px(x);
    s.appendChild(svg("line", { x1: xx, y1: padT, x2: xx, y2: H - padB, stroke: "#ece8de", "stroke-width": 1 }));
    const lbl = svg("text", { x: xx, y: H - padB + 14, "text-anchor": "middle", fill: "#52606d", "font-size": 10 });
    lbl.textContent = String(x);
    s.appendChild(lbl);
  }

  // Axes
  s.appendChild(svg("line", { x1: padL, y1: padT, x2: padL, y2: H - padB, stroke: "#102a43", "stroke-width": 2 }));
  s.appendChild(svg("line", { x1: padL, y1: H - padB, x2: W - padR, y2: H - padB, stroke: "#102a43", "stroke-width": 2 }));

  // Constant fixed-fee baseline
  if (st.fixed > 0) {
    s.appendChild(
      svg("line", {
        x1: padL,
        y1: py(st.fixed),
        x2: W - padR,
        y2: py(st.fixed),
        stroke: "#b85c38",
        "stroke-width": 1.5,
        "stroke-dasharray": "4 4",
      }),
    );
  }

  // Plan B line if compareMode
  if (st.compareMode) {
    s.appendChild(
      svg("line", {
        x1: px(0),
        y1: py(st.compareFixed),
        x2: px(maxX),
        y2: py(st.compareRate * maxX + st.compareFixed),
        stroke: "#c08422",
        "stroke-width": 2.5,
        "stroke-dasharray": "6 3",
      }),
    );
    s.appendChild(svg("circle", { cx: px(st.t), cy: py(st.totalB), r: 5.5, fill: "#c08422", stroke: "#ffffff", "stroke-width": 1.5 }));
  }

  // Plan A line
  s.appendChild(
    svg("line", {
      x1: px(0),
      y1: py(st.fixed),
      x2: px(maxX),
      y2: py(st.rate * maxX + st.fixed),
      stroke: "#1b8a83",
      "stroke-width": 3,
    }),
  );

  // Y-intercept marker (0, fixed)
  s.appendChild(svg("circle", { cx: px(0), cy: py(st.fixed), r: 4.5, fill: "#b85c38", stroke: "#ffffff", "stroke-width": 1.5 }));

  // Current point (t, total)
  const cx = px(st.t);
  const cy = py(st.total);
  s.appendChild(svg("line", { x1: cx, y1: cy, x2: cx, y2: H - padB, stroke: "#102a43", "stroke-width": 1, "stroke-dasharray": "2 2" }));
  s.appendChild(svg("circle", { cx, cy, r: 6.5, fill: "#102a43", stroke: "#ffffff", "stroke-width": 2 }));

  const ptLbl = svg("text", {
    x: Math.min(W - 44, Math.max(padL + 30, cx)),
    y: Math.max(padT + 14, cy - 10),
    "text-anchor": "middle",
    fill: "#102a43",
    "font-size": 11,
    "font-weight": 800,
  });
  ptLbl.textContent = `(${st.t}, $${st.total})`;
  s.appendChild(ptLbl);

  const xAxisTitle = svg("text", { x: padL + plotW / 2, y: H - 4, "text-anchor": "middle", fill: "#334e68", "font-size": 10, "font-weight": 700 });
  xAxisTitle.textContent = c.colTickets;
  s.appendChild(xAxisTitle);

  host.appendChild(s);
}

export function mount(root, model, opts = {}) {
  return createView(root, model, {
    ...opts,
    cls: "fm-linear-pricing",
    say(st, lang) {
      const c = COPY[lang] || COPY.en;
      return `${st.varName} = ${st.t}, ${c.totalCost}: $${st.total}`;
    },
    build(view) {
      const c = COPY[view.lang] || COPY.en;
      const bag = view.bag;

      const wrap = el("div", { class: "lp-studio" });
      const head = el("div", { class: "lp-head" }, [
        el("h3", { class: "lp-title", text: c.title }),
        el("p", { class: "lp-sub", text: c.subtitle }),
      ]);
      wrap.appendChild(head);

      // Venue illustration
      const venueHost = el("div", { class: "lp-venue-host" });
      wrap.appendChild(venueHost);

      // Controls bar (slider, -/+, numeric input)
      const controls = el("div", { class: "lp-controls" });
      const label = el("label", { class: "lp-ctrl-label", for: "lp_t_num", text: c.ticketsLabel });
      const minusBtn = el("button", { type: "button", class: "lp-step-btn", "aria-label": c.decrease, text: "−" });
      const slider = el("input", {
        type: "range",
        class: "lp-slider",
        min: 0,
        max: model.getState().maxT,
        step: 1,
        "aria-label": c.ticketsLabel,
      });
      const plusBtn = el("button", { type: "button", class: "lp-step-btn", "aria-label": c.increase, text: "+" });
      const numInput = el("input", {
        type: "number",
        id: "lp_t_num",
        class: "lp-num-input",
        min: 0,
        max: model.getState().maxT,
        step: 1,
      });

      bag.on(minusBtn, "click", () => model.setState({ t: model.getState().t - 1 }));
      bag.on(plusBtn, "click", () => model.setState({ t: model.getState().t + 1 }));
      bag.on(slider, "input", () => model.setState({ t: Number(slider.value) }));
      bag.on(numInput, "input", () => model.setState({ t: Number(numInput.value) }));

      controls.append(label, minusBtn, slider, plusBtn, numInput);
      wrap.appendChild(controls);

      // Mode toggles: Compare plans & Adjust price/fee
      const toggles = el("div", { class: "lp-toggles" });
      const compareBtn = el("button", { type: "button", class: "lp-toggle-btn", "aria-pressed": "false", text: c.compareToggle });
      const adjustBtn = el("button", { type: "button", class: "lp-toggle-btn", "aria-pressed": "false", text: c.adjustToggle });
      bag.on(compareBtn, "click", () => model.setState({ compareMode: !model.getState().compareMode }));
      bag.on(adjustBtn, "click", () => model.setState({ adjustMode: !model.getState().adjustMode }));
      toggles.append(compareBtn, adjustBtn);
      wrap.appendChild(toggles);

      // Adjust parameters drawer (What if price or fee changes?)
      const adjustPanel = el("div", { class: "lp-adjust-panel", hidden: true });
      const rateIn = el("input", { type: "range", min: 4, max: 25, step: 1, "aria-label": c.priceLabel });
      const feeIn = el("input", { type: "range", min: 0, max: 80, step: 5, "aria-label": c.feeLabel });
      const rateVal = el("strong");
      const feeVal = el("strong");
      const resetParamsBtn = el("button", { type: "button", class: "lp-reset-btn", text: c.resetParams });
      bag.on(rateIn, "input", () => model.setState({ rate: Number(rateIn.value) }));
      bag.on(feeIn, "input", () => model.setState({ fixed: Number(feeIn.value) }));
      bag.on(resetParamsBtn, "click", () => model.setState({ resetParams: true }));
      adjustPanel.append(
        el("label", { class: "lp-param-row" }, [el("span", { text: c.priceLabel + ": " }), rateVal, rateIn]),
        el("label", { class: "lp-param-row" }, [el("span", { text: c.feeLabel + ": " }), feeVal, feeIn]),
        resetParamsBtn,
      );
      wrap.appendChild(adjustPanel);

      // Synchronized Expression Readout
      const exprCard = el("div", { class: "lp-expr-card" });
      const exprReadout = el("div", { class: "lp-expr-readout" });
      const compareReadout = el("div", { class: "lp-compare-readout", hidden: true });
      exprCard.append(el("h4", { class: "lp-card-h", text: c.expressionTitle }), exprReadout, compareReadout);
      wrap.appendChild(exprCard);

      // Side-by-side Table & Coordinate Graph
      const grid = el("div", { class: "lp-rep-grid" });
      const tableWrap = el("div", { class: "lp-rep-card" }, [el("h4", { class: "lp-card-h", text: c.tableTitle })]);
      const tableHost = el("div");
      tableWrap.appendChild(tableHost);

      const graphWrap = el("div", { class: "lp-rep-card" }, [el("h4", { class: "lp-card-h", text: c.graphTitle })]);
      const graphHost = el("div");
      graphWrap.appendChild(graphHost);

      grid.append(tableWrap, graphWrap);
      wrap.appendChild(grid);

      // Investigation / Why not 62t?
      const invCard = el("details", { class: "lp-investigate" }, [
        el("summary", { text: `${c.investigateTitle} · ${c.whyNot62tTitle}` }),
        el("div", { class: "lp-inv-body" }),
      ]);
      wrap.appendChild(invCard);

      root.appendChild(wrap);
      view.refs = {
        venueHost,
        slider,
        numInput,
        minusBtn,
        plusBtn,
        compareBtn,
        adjustBtn,
        adjustPanel,
        rateIn,
        feeIn,
        rateVal,
        feeVal,
        exprReadout,
        compareReadout,
        tableHost,
        graphHost,
        invBody: invCard.querySelector(".lp-inv-body"),
        c,
      };
    },
    sync(view) {
      const st = model.getState();
      const r = view.refs;
      const c = r.c;

      r.slider.value = String(st.t);
      r.numInput.value = String(st.t);
      r.minusBtn.disabled = st.t <= 0;
      r.plusBtn.disabled = st.t >= st.maxT;
      r.compareBtn.setAttribute("aria-pressed", st.compareMode ? "true" : "false");
      r.adjustBtn.setAttribute("aria-pressed", st.adjustMode ? "true" : "false");
      r.adjustPanel.hidden = !st.adjustMode;
      r.rateIn.value = String(st.rate);
      r.feeIn.value = String(st.fixed);
      r.rateVal.textContent = `$${st.rate}`;
      r.feeVal.textContent = `$${st.fixed}`;

      drawVenueSvg(r.venueHost, st, c);
      drawGraphSvg(r.graphHost, st, c);

      // Expression readout with distinct semantic chips
      r.exprReadout.innerHTML = `
        <div class="lp-eq-line">
          <span class="lp-chip lp-chip--var">${st.rate}${st.varName}</span>
          <span class="lp-op">+</span>
          <span class="lp-chip lp-chip--const">${st.fixed}</span>
          <span class="lp-op">→</span>
          <span class="lp-chip lp-chip--var">${st.rate}(${st.t})</span>
          <span class="lp-op">+</span>
          <span class="lp-chip lp-chip--const">${st.fixed}</span>
          <span class="lp-op">=</span>
          <strong class="lp-total">$${st.total}</strong>
        </div>
        <div class="lp-eq-legend">
          <span class="lp-leg-var">● ${c.variableTerm}: $${st.varCost} (${fmt(c.changesWithT, { rate: st.rate })})</span>
          <span class="lp-leg-const">◆ ${c.fixedTerm}: $${st.fixed} (${fmt(c.staysSame, { fixed: st.fixed })})</span>
        </div>
      `;

      // Comparison readout
      r.compareReadout.hidden = !st.compareMode;
      if (st.compareMode) {
        const diff = Math.abs(st.total - st.totalB);
        const msg =
          st.total < st.totalB
            ? fmt(c.cheaperA, { diff, t: st.t })
            : st.totalB < st.total
              ? fmt(c.cheaperB, { diff, t: st.t })
              : fmt(c.equalPlans, { total: st.total, t: st.t });
        r.compareReadout.innerHTML = `
          <div class="lp-cmp-pills">
            <span class="lp-cmp-a">${c.planALabel} (${st.expr}): <strong>$${st.total}</strong></span>
            <span class="lp-cmp-b">${c.planBLabel} (${st.exprB}): <strong>$${st.totalB}</strong></span>
          </div>
          <p class="lp-cmp-msg">${msg}</p>
        `;
      }

      // Table of values
      const rows = [...new Set([0, 1, 2, 3, 4, 5, 6, st.t])].sort((a, b) => a - b);
      r.tableHost.innerHTML = `
        <table class="lp-table">
          <thead>
            <tr>
              <th>${c.colTickets}</th>
              <th>${fmt(c.colPlanA, { expr: st.expr })}</th>
              ${st.compareMode ? `<th>${fmt(c.colPlanB, { exprB: st.exprB })}</th>` : ""}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((n) => {
                const valA = st.rate * n + st.fixed;
                const valB = st.compareRate * n + st.compareFixed;
                const active = n === st.t ? ' class="is-active"' : "";
                return `<tr${active}><td>${n}</td><td>$${valA}</td>${st.compareMode ? `<td>$${valB}</td>` : ""}</tr>`;
              })
              .join("")}
          </tbody>
        </table>
      `;

      // Investigation notes
      r.invBody.innerHTML = `
        <p><strong>${c.whyNot62tTitle}</strong> ${c.whyNot62tBody}</p>
        <ul>
          <li>${fmt(c.q1, { rate: st.rate, fixed: st.fixed })}</li>
          <li>${fmt(c.q2, { rate: st.rate, fixed: st.fixed })}</li>
        </ul>
      `;
    },
  });
}
