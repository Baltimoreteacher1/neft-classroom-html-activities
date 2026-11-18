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
    partsTitle: "Parts of an algebraic expression",
    partsLead: "Know each part before you build or solve.",
    coefLabel: "Coefficient (multiplies)",
    varLabel: "Variable (unknown)",
    opLabel: "Operator",
    constLabel: "Constant (stays fixed)",
    varTermLabel: "Variable term",
    tapAsk: {
      coef: "Tap the coefficient (the number multiplying the variable):",
      var: "Tap the variable (the letter for an unknown number):",
      const: "Tap the constant (the number that stays alone):",
      term: "Tap the variable term (coefficient × variable):",
    },
    tapHit: "Yes! In {expr}, {part} is the {name}.",
    tapMiss: "Look at the arrows above: {picked} is not the {name}. Try another part!",
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
      "Modelo interactivo para {expr}. Ahora t = {t} boletos, costo total = ${total}.",
    partsTitle: "Partes de una expresión algebraica",
    partsLead: "Conoce cada parte antes de construir o resolver.",
    coefLabel: "Coeficiente (multiplica)",
    varLabel: "Variable (incógnita)",
    opLabel: "Operador",
    constLabel: "Constante (no cambia)",
    varTermLabel: "Término variable",
    tapAsk: {
      coef: "Toca el coeficiente (el número que multiplica a la variable):",
      var: "Toca la variable (la letra de un número desconocido):",
      const: "Toca la constante (el número que está solo):",
      term: "Toca el término variable (coeficiente × variable):",
    },
    tapHit: "¡Sí! En {expr}, {part} es el/la {name}.",
    tapMiss: "Mira las flechas de arriba: {picked} no es el/la {name}. ¡Prueba otra parte!",
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

function drawPartsSvg(host, st, c) {
  clear(host);
  const W = 540;
  const H = 196;
  const s = svg("svg", {
    viewBox: `0 0 ${W} ${H}`,
    class: "fm-svg lp-parts-svg",
    role: "img",
    "aria-label": `${st.expr}: ${st.rate} ${c.coefLabel}, ${st.varName} ${c.varLabel}, + ${c.opLabel}, ${st.fixed} ${c.constLabel}`,
  });

  // Expression tokens centered around y = 96
  const cy = 96;
  const cxCoef = 192;
  const cxVar = 246;
  const cxOp = 296;
  const cxConst = 352;

  // Token boxes
  const box = (x, y, w, h, cls, label, txtCls = "fm-svg-text") => {
    s.appendChild(svg("rect", { class: cls, x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 10 }));
    const t = svg("text", { x, y: y + 8, "text-anchor": "middle", class: txtCls, style: "font-size:24px;font-weight:800" });
    t.textContent = label;
    s.appendChild(t);
  };

  box(cxCoef, cy, 56, 46, "fm-tile fm-tile-x", String(st.rate), "fm-svg-text fm-tile-label");
  box(cxVar, cy, 44, 46, "fm-pill-bg", st.varName, "fm-svg-text fm-svg-strong");
  const opTxt = svg("text", { x: cxOp, y: cy + 8, "text-anchor": "middle", class: "fm-svg-text", style: "font-size:26px;font-weight:800" });
  opTxt.textContent = "+";
  s.appendChild(opTxt);
  box(cxConst, cy, 62, 46, "fm-tile fm-tile-u", String(st.fixed), "fm-svg-text fm-tile-u-text");

  // Callout arrow helper
  const callout = (x1, y1, x2, y2, label, pillCls, anchor = "middle") => {
    s.appendChild(svg("line", { class: "fm-connector", x1, y1, x2, y2 }));
    const dir = y2 > y1 ? 1 : -1;
    s.appendChild(svg("path", { class: "fm-arrowhead", d: `M${x2} ${y2} l-4 ${-6 * dir} l8 0 z` }));
    const pw = Math.max(110, label.length * 7.8 + 18);
    const py = y1 < y2 ? y1 - 24 : y1 + 4;
    s.appendChild(svg("rect", { class: pillCls, x: x1 - pw / 2, y: py, width: pw, height: 24, rx: 12 }));
    const lbl = svg("text", { x: x1, y: py + 16, "text-anchor": anchor, class: "fm-svg-text", style: "font-size:12.5px;font-weight:700" });
    lbl.textContent = label;
    s.appendChild(lbl);
  };

  callout(88, 34, cxCoef, cy - 25, c.coefLabel, "fm-pill-bg");
  callout(256, 34, cxVar, cy - 25, c.varLabel, "fm-pill-bg");
  callout(434, 34, cxConst, cy - 25, c.constLabel, "fm-pill-whole");
  callout(cxOp, 162, cxOp, cy + 20, c.opLabel, "fm-pill-bg");

  // Variable term bracket underneath 12t
  const bx1 = cxCoef - 28;
  const bx2 = cxVar + 22;
  const bmid = (bx1 + bx2) / 2;
  s.appendChild(svg("path", { class: "fm-axis", fill: "none", d: `M${bx1} 126 v8 H${bx2} v-8` }));
  const vt = svg("text", { x: bmid, y: 152, "text-anchor": "middle", class: "fm-svg-text fm-svg-strong", style: "font-size:13px;font-weight:800" });
  vt.textContent = `${c.varTermLabel}: ${st.rate}${st.varName}`;
  s.appendChild(vt);

  host.appendChild(s);
}

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

      // Parts of an Algebraic Expression (normative labeled diagram + interactive tap practice)
      const partsCard = el("section", { class: "fm-view lp-parts-card", "aria-label": c.partsTitle });
      const partsHead = el("div", { class: "lp-parts-head" }, [
        el("h4", { class: "lp-card-h", text: c.partsTitle }),
        el("p", { class: "lp-parts-lead", text: c.partsLead }),
      ]);
      const partsSvgHost = el("div", { class: "lp-parts-svg-host" });
      const quizPrompt = el("p", { class: "lp-quiz-prompt" });
      const quizChips = el("div", { class: "fm-row lp-quiz-chips", role: "group" });
      const quizFeedback = el("p", { class: "fm-explain lp-quiz-fb", role: "status" });
      let quizIdx = 0;
      const QUIZ_KEYS = ["coef", "var", "const", "term"];
      const renderPartsQuiz = () => {
        const st = model.getState();
        const qKey = QUIZ_KEYS[quizIdx % QUIZ_KEYS.length];
        const nameMap = {
          coef: c.coefLabel.split(" (")[0],
          var: c.varLabel.split(" (")[0],
          const: c.constLabel.split(" (")[0],
          term: c.varTermLabel,
        };
        const partMap = {
          coef: String(st.rate),
          var: st.varName,
          const: String(st.fixed),
          term: `${st.rate}${st.varName}`,
        };
        quizPrompt.textContent = c.tapAsk[qKey];
        quizChips.textContent = "";
        for (const k of QUIZ_KEYS) {
          const btn = el("button", { type: "button", class: "fm-btn lp-quiz-btn", text: partMap[k] });
          bag.on(btn, "click", () => {
            if (k === qKey) {
              quizFeedback.textContent = fmt(c.tapHit, { expr: st.expr, part: partMap[k], name: nameMap[qKey] });
              quizIdx = (quizIdx + 1) % QUIZ_KEYS.length;
              setTimeout(() => renderPartsQuiz(), 900);
            } else {
              quizFeedback.textContent = fmt(c.tapMiss, { picked: partMap[k], name: nameMap[qKey] });
            }
          });
          quizChips.appendChild(btn);
        }
      };
      partsCard.append(partsHead, partsSvgHost, quizPrompt, quizChips, quizFeedback);
      wrap.appendChild(partsCard);

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
        partsSvgHost,
        renderPartsQuiz,
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

      drawPartsSvg(r.partsSvgHost, st, c);
      r.renderPartsQuiz();
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
