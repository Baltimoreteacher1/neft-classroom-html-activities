// living/two-var-stage.js — the cast of one relationship and where it stands in
// each view. A cast is built ONCE per situation: table cells, one point per row,
// the line(s), a ghost point for a wrong guess, a probe point, the guides that
// drop to the axes. `place(cast, spec)` returns the tween moves for a view, so
// a table row slides to become the point of the same row (same SVG elements).
//
// Two stages share this file:
//   "pair"  — two cards (the chosen quantity and the one that responds) above a
//             table; a row's cells live on the cards, then slide into the table.
//   "graph" — a table at the left and a scaled graph at the right.

import { fmt, fmtY, H, pairText, splitLabel, W, yOf } from "./two-var-model.js";

export { H, W };

const TB = { x: 6, w: 176, y: 30, head: 42, rowH: 34 }; // graph stage table
const GR = { x0: 272, y0: 270, w: 192, h: 222 }; // graph plane
const PR = { x: 90, w: 300, y: 130, head: 36, rowH: 30 }; // pair stage table
const CARD = { y: 14, h: 92, inX: 20, outX: 280, w: 180 };

/** Where a row's two cells stand in the table. */
const slot = (kind, i) => {
  const t = kind === "pair" ? PR : TB;
  const cy = t.y + t.head + i * t.rowH + t.rowH / 2;
  return { xc: [t.x + t.w / 4, t.x + (3 * t.w) / 4], cy, top: t.y + t.head + i * t.rowH, t };
};

/**
 * @param {any} ctx @param {import("./two-var-model.js").Sit} sit @param {"pair" | "graph"} kind
 */
export function makeCast(ctx, sit, kind) {
  const { svg, svgEl, L } = ctx;
  const g = svgEl("g", {}, svg);
  const sv = (tag, attrs, parent = g) => svgEl(tag, attrs, parent);
  const el = (tag, attrs, parent = g) => svgEl(tag, { opacity: 0, ...attrs }, parent);
  const txt = (attrs, parent = g) =>
    el(
      "text",
      {
        "text-anchor": "middle",
        "font-size": 16,
        "font-weight": 700,
        fill: "var(--lsx-ink)",
        ...attrs,
      },
      parent,
    );
  const halo = { stroke: "var(--lsx-card)", "stroke-width": 5, "paint-order": "stroke" };
  const line = (x1, y1, x2, y2, stroke, more = {}, parent = g) =>
    el("line", { x1, y1, x2, y2, stroke: `var(--lsx-${stroke})`, ...more }, parent);
  const n = sit.xs.length;
  const t = kind === "pair" ? PR : TB;
  const rows = sit.xs.map((x) => ({ x, y: yOf(sit, x) }));
  /** @type {any} */
  const cast = { sit, kind, rows };

  // ---- table ---------------------------------------------------------
  const tableG = el("g", {});
  const bottom = t.y + t.head + n * t.rowH;
  sv(
    "rect",
    {
      x: t.x,
      y: t.y,
      width: t.w,
      height: bottom - t.y,
      rx: 6,
      fill: "var(--lsx-card)",
      stroke: "var(--lsx-ink)",
      "stroke-width": 2,
    },
    tableG,
  );
  sv(
    "line",
    {
      x1: t.x,
      y1: t.y + t.head,
      x2: t.x + t.w,
      y2: t.y + t.head,
      stroke: "var(--lsx-ink)",
      "stroke-width": 2,
    },
    tableG,
  );
  sv(
    "line",
    {
      x1: t.x + t.w / 2,
      y1: t.y,
      x2: t.x + t.w / 2,
      y2: bottom,
      stroke: "var(--lsx-rule-strong)",
      "stroke-width": 1.5,
    },
    tableG,
  );
  for (let i = 1; i < n; i++) {
    const y = t.y + t.head + i * t.rowH;
    sv(
      "line",
      { x1: t.x, y1: y, x2: t.x + t.w, y2: y, stroke: "var(--lsx-rule)", "stroke-width": 1 },
      tableG,
    );
  }
  [sit.xName, sit.yName].forEach((name, c) => {
    const lines = splitLabel(L(name), kind === "pair" ? 22 : 12);
    const cx = t.x + (c ? (3 * t.w) / 4 : t.w / 4);
    lines.forEach((ln, j) => {
      const y = t.y + t.head / 2 + 5 + (j - (lines.length - 1) / 2) * 15;
      sv(
        "text",
        {
          x: cx,
          y,
          "text-anchor": "middle",
          "font-size": kind === "pair" ? 14 : 13,
          "font-weight": 700,
          fill: c ? "var(--lsx-lo)" : "var(--lsx-hi)",
          text: ln,
        },
        tableG,
      );
    });
  });
  cast.tableG = tableG;
  cast.cells = rows.map((r) => [
    txt({ "font-size": 19, fill: "var(--lsx-hi)", text: fmt(r.x) }),
    txt({ "font-size": 19, fill: "var(--lsx-lo)", text: fmtY(sit, r.y) }),
  ]);
  cast.hl = el("rect", {
    x: 0,
    y: 0,
    width: t.w - 2,
    height: t.rowH,
    rx: 4,
    fill: "none",
    stroke: "var(--lsx-ink)",
    "stroke-width": 2.5,
    "stroke-dasharray": "6 4",
  });

  if (kind === "pair") {
    const card = (x) =>
      el("rect", {
        x,
        y: CARD.y,
        width: CARD.w,
        height: CARD.h,
        rx: 12,
        fill: "var(--lsx-card)",
        stroke: "var(--lsx-ink)",
        "stroke-width": 3,
      });
    cast.cardIn = card(CARD.inX);
    cast.cardOut = card(CARD.outX);
    const lbl = (x, text, fill, y, size = 14) =>
      txt({ x: x + CARD.w / 2, y, "font-size": size, fill, text });
    cast.cardNames = [
      lbl(CARD.inX, L(sit.xName), "var(--lsx-hi)", CARD.y + CARD.h - 10),
      lbl(CARD.outX, L(sit.yName), "var(--lsx-lo)", CARD.y + CARD.h - 10),
    ];
    cast.roleTags = [
      lbl(
        CARD.inX,
        L({ en: "independent · chosen", es: "independiente · se elige" }),
        "var(--lsx-hi)",
        CARD.y + 22,
      ),
      lbl(
        CARD.outX,
        L({ en: "dependent · responds", es: "dependiente · responde" }),
        "var(--lsx-lo)",
        CARD.y + 22,
      ),
    ];
    const ay = CARD.y + CARD.h / 2;
    const arrow = el("g", {});
    sv(
      "line",
      {
        x1: CARD.inX + CARD.w + 6,
        y1: ay,
        x2: CARD.outX - 12,
        y2: ay,
        stroke: "var(--lsx-ink)",
        "stroke-width": 3,
      },
      arrow,
    );
    sv("path", { d: `M${CARD.outX - 4} ${ay} l-11 -7 l0 14 z`, fill: "var(--lsx-ink)" }, arrow);
    cast.arrow = arrow;
    const dep = el("g", {});
    const dy = CARD.y + CARD.h - 18;
    sv(
      "line",
      {
        x1: CARD.outX - 6,
        y1: dy,
        x2: CARD.inX + CARD.w + 12,
        y2: dy,
        stroke: "var(--lsx-lo)",
        "stroke-width": 3,
        "stroke-dasharray": "7 4",
      },
      dep,
    );
    sv("path", { d: `M${CARD.inX + CARD.w + 4} ${dy} l11 -7 l0 14 z`, fill: "var(--lsx-lo)" }, dep);
    sv(
      "text",
      {
        x: (CARD.inX + CARD.w + CARD.outX) / 2,
        y: dy - 8,
        "text-anchor": "middle",
        "font-size": 13,
        "font-weight": 700,
        fill: "var(--lsx-lo)",
        ...halo,
        text: L({ en: "depends on", es: "depende de" }),
      },
      dep,
    );
    cast.dep = dep;
    // The cards are drawn after the cells; lift the cells above them so a row's
    // numbers show on the card they slide onto.
    for (const pair of cast.cells) for (const c of pair) g.appendChild(c);
    g.appendChild(cast.hl);
    return cast;
  }

  // ---- graph ---------------------------------------------------------
  const { xMax, yMax, xStep, yStep } = sit.scale;
  const gx = (v) => GR.x0 + (v / xMax) * GR.w;
  const gy = (v) => GR.y0 - (v / yMax) * GR.h;
  cast.gx = gx;
  cast.gy = gy;
  const axes = el("g", {});
  const tick = { "font-size": 14, "font-weight": 600, fill: "var(--lsx-ink)" };
  for (let x = xStep; x <= xMax; x += xStep) {
    sv(
      "line",
      {
        x1: gx(x),
        y1: GR.y0,
        x2: gx(x),
        y2: GR.y0 - GR.h,
        stroke: "var(--lsx-rule)",
        "stroke-width": 1,
      },
      axes,
    );
    sv("text", { x: gx(x), y: GR.y0 + 19, "text-anchor": "middle", ...tick, text: fmt(x) }, axes);
  }
  for (let y = yStep; y <= yMax + 1e-9; y += yStep) {
    sv(
      "line",
      {
        x1: GR.x0,
        y1: gy(y),
        x2: GR.x0 + GR.w,
        y2: gy(y),
        stroke: "var(--lsx-rule)",
        "stroke-width": 1,
      },
      axes,
    );
    sv(
      "text",
      {
        x: GR.x0 - 7,
        y: gy(y) + 5,
        "text-anchor": "end",
        ...tick,
        text: `${sit.yPrefix}${fmt(y)}`,
      },
      axes,
    );
  }
  sv(
    "line",
    {
      x1: GR.x0,
      y1: GR.y0,
      x2: GR.x0 + GR.w + 6,
      y2: GR.y0,
      stroke: "var(--lsx-ink)",
      "stroke-width": 2.5,
    },
    axes,
  );
  sv(
    "line",
    {
      x1: GR.x0,
      y1: GR.y0,
      x2: GR.x0,
      y2: GR.y0 - GR.h - 6,
      stroke: "var(--lsx-ink)",
      "stroke-width": 2.5,
    },
    axes,
  );
  sv("text", { x: GR.x0 - 7, y: GR.y0 + 19, "text-anchor": "end", ...tick, text: "0" }, axes);
  sv(
    "text",
    {
      x: GR.x0 + GR.w / 2,
      y: GR.y0 + 44,
      "text-anchor": "middle",
      "font-size": 14,
      "font-weight": 700,
      fill: "var(--lsx-hi)",
      text: L(sit.xName),
    },
    axes,
  );
  const ty = GR.y0 - GR.h / 2;
  sv(
    "text",
    {
      x: 204,
      y: ty,
      "text-anchor": "middle",
      "font-size": 14,
      "font-weight": 700,
      fill: "var(--lsx-lo)",
      transform: `rotate(-90 204 ${ty})`,
      text: L(sit.yName),
    },
    axes,
  );
  cast.axes = axes;

  const lineTo = (k) => [gx(xMax), gy(k * xMax)];
  const [lx, ly] = lineTo(sit.k);
  cast.line = line(gx(0), gy(0), lx, ly, "hi", {
    "stroke-width": 3.5,
    ...(sit.dashed ? { "stroke-dasharray": "9 6" } : {}),
  });
  // A key in the top-left of the plot: a sample of the line's own stroke, then its name.
  const key = (row, stroke, dash, text) => {
    const kg = el("g", {});
    const y = GR.y0 - GR.h + 14 + row * 22;
    sv(
      "line",
      {
        x1: GR.x0 + 10,
        y1: y,
        x2: GR.x0 + 38,
        y2: y,
        stroke: `var(--lsx-${stroke})`,
        "stroke-width": 3.5,
        "stroke-dasharray": dash,
        "stroke-linecap": "round",
      },
      kg,
    );
    sv(
      "text",
      {
        x: GR.x0 + 46,
        y: y + 5,
        "text-anchor": "start",
        "font-size": 13,
        "font-weight": 700,
        fill: `var(--lsx-${stroke})`,
        text,
      },
      kg,
    );
    return kg;
  };
  cast.lineLbl = key(0, "hi", sit.dashed ? "9 6" : "none", sit.lineLabel ? L(sit.lineLabel) : "");
  if (sit.second != null) {
    const [sx, sy] = lineTo(sit.second);
    cast.secondLine = line(gx(0), gy(0), sx, sy, "lo", {
      "stroke-width": 3.5,
      "stroke-dasharray": "3 6",
      "stroke-linecap": "round",
    });
    cast.secondLbl = key(sit.lineLabel ? 1 : 0, "lo", "3 6", L(sit.secondLabel));
  }
  if (sit.goal != null) {
    cast.goalLine = line(GR.x0, gy(sit.goal), GR.x0 + GR.w, gy(sit.goal), "ink", {
      "stroke-width": 2.5,
      "stroke-dasharray": "10 5",
    });
    cast.goalLbl = txt({
      x: GR.x0 + 8,
      y: gy(sit.goal) - 7,
      "text-anchor": "start",
      "font-size": 13,
      ...halo,
      text: `${L({ en: "goal", es: "meta" })} ${fmtY(sit, sit.goal)}`,
    });
  }
  cast.guideV = line(0, 0, 0, 0, "ink", { "stroke-width": 2, "stroke-dasharray": "5 4" });
  cast.guideH = line(0, 0, 0, 0, "ink", { "stroke-width": 2, "stroke-dasharray": "5 4" });
  cast.guideX = txt({ "text-anchor": "middle", "font-size": 14, fill: "var(--lsx-hi)", ...halo });
  cast.guideY = txt({ "text-anchor": "start", "font-size": 14, fill: "var(--lsx-lo)", ...halo });
  cast.pts = rows.map((_, i) =>
    el("circle", {
      cx: slot(kind, i).t.x + slot(kind, i).t.w - 12,
      cy: slot(kind, i).cy,
      r: 7,
      fill: "var(--lsx-x)",
      stroke: "var(--lsx-ink)",
      "stroke-width": 2.5,
    }),
  );
  cast.ghost = el("circle", {
    cx: 0,
    cy: 0,
    r: 8,
    fill: "var(--lsx-card)",
    stroke: "var(--lsx-lo)",
    "stroke-width": 3,
    "stroke-dasharray": "3 3",
  });
  cast.ghostLbl = txt({ "font-size": 14, fill: "var(--lsx-lo)", ...halo });
  cast.probe = el("circle", {
    cx: 0,
    cy: 0,
    r: 9,
    fill: "var(--lsx-card)",
    stroke: "var(--lsx-hi)",
    "stroke-width": 4.5,
  });
  cast.probeLbl = txt({ "font-size": 14, fill: "var(--lsx-hi)", ...halo });
  // A short note in the empty lower-right of the plot (three lines of ~20 characters).
  cast.note = [0, 1, 2].map((j) =>
    txt({
      x: GR.x0 + GR.w * 0.7,
      y: GR.y0 - 64 + j * 18,
      "font-size": 13,
      fill: "var(--lsx-muted)",
      ...halo,
    }),
  );
  return cast;
}

/**
 * Every cast member's place in one view.
 * spec (all optional): table, rows (cells shown in the graph stage's table), plot[]
 * (rows whose point is on the graph), axes, line, second, goal, probe {x, y?},
 * guide {x, y, labels?}, ghost {x, y}, hl (row index), note [line1, line2], and for the
 * pair stage: cards, cardRow, visited[], roles, dep.
 */
export function place(cast, spec = {}) {
  const { sit, kind } = cast;
  const s = {
    table: false,
    rows: 0,
    plot: [],
    axes: false,
    line: false,
    second: false,
    goal: false,
    probe: null,
    guide: null,
    ghost: null,
    hl: -1,
    note: null,
    cards: false,
    cardRow: -1,
    visited: [],
    roles: false,
    dep: false,
    ...spec,
  };
  /** @type {[any, Record<string, any>][]} */
  const m = [];
  // An element appearing from nothing snaps to its place (it never flies in
  // from the corner); only a row's point travels, from its table row.
  const put = (node, attrs, on, snap = true) => {
    if (!node) return;
    if (snap && on && node.getAttribute("opacity") === "0")
      for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    m.push([node, { ...attrs, opacity: on ? 1 : 0 }]);
  };
  const pairOf = kind === "pair";
  put(cast.tableG, {}, s.table);
  cast.rows.forEach((_r, i) => {
    const sl = slot(kind, i);
    const onCard = pairOf && s.cards && i === s.cardRow;
    const inSlot = pairOf
      ? s.table && s.visited.includes(i) && i !== s.cardRow
      : s.table && i < s.rows;
    const cx = onCard ? [CARD.inX + CARD.w / 2, CARD.outX + CARD.w / 2] : sl.xc;
    const cy = onCard ? CARD.y + 62 : sl.cy + 6;
    put(cast.cells[i][0], { x: cx[0], y: cy }, onCard || inSlot);
    put(cast.cells[i][1], { x: cx[1], y: cy }, onCard || inSlot);
  });
  const hlRow = s.hl >= 0 ? slot(kind, s.hl) : null;
  put(
    cast.hl,
    hlRow ? { x: hlRow.t.x + 1, y: hlRow.top, width: hlRow.t.w - 2, height: hlRow.t.rowH } : {},
    s.table && !!hlRow,
  );
  if (pairOf) {
    put(cast.cardIn, {}, s.cards);
    put(cast.cardOut, {}, s.cards);
    cast.cardOut.setAttribute("stroke-dasharray", s.roles ? "8 5" : "none");
    cast.cardNames.forEach((c) => put(c, {}, s.cards));
    cast.roleTags.forEach((c) => put(c, {}, s.cards && s.roles));
    put(cast.arrow, {}, s.cards);
    put(cast.dep, {}, s.cards && s.dep);
    return m;
  }
  const at = (x, y) => ({ cx: cast.gx(x), cy: cast.gy(y) });
  cast.rows.forEach((r, i) => {
    const sl = slot(kind, i);
    put(
      cast.pts[i],
      s.plot.includes(i) ? at(r.x, r.y) : { cx: sl.t.x + sl.t.w - 12, cy: sl.cy },
      s.plot.includes(i),
      false,
    );
  });
  put(cast.axes, {}, s.axes);
  put(cast.line, {}, s.line);
  put(cast.lineLbl, {}, s.line && !!sit.lineLabel);
  put(cast.secondLine, {}, s.second);
  put(cast.secondLbl, {}, s.second);
  put(cast.goalLine, {}, s.goal);
  put(cast.goalLbl, {}, s.goal);
  // A label for a point. The line runs up and to the right through a probe, so
  // its label goes below (or, near the axis, to the right); a ghost point can sit
  // on either side of the line, so its label goes above, away from the middle.
  const tag = (lbl, x, y, below) => {
    const right = x > sit.xMax * 0.62;
    lbl.textContent = pairText(sit, x, y);
    const px = cast.gx(x);
    const py = cast.gy(y);
    if (!below) {
      lbl.setAttribute("text-anchor", right ? "end" : "start");
      return { x: px + (right ? -13 : 13), y: py - 12 };
    }
    if (py > GR.y0 - 40) {
      lbl.setAttribute("text-anchor", "start");
      return { x: px + 16, y: py + 4 };
    }
    lbl.setAttribute("text-anchor", right ? "end" : "start");
    return { x: px + (right ? 10 : -10), y: py + 30 };
  };
  if (s.probe) {
    const y = s.probe.y ?? yOf(sit, s.probe.x);
    put(cast.probe, at(s.probe.x, y), true);
    put(cast.probeLbl, tag(cast.probeLbl, s.probe.x, y, true), true);
  } else {
    put(cast.probe, {}, false);
    put(cast.probeLbl, {}, false);
  }
  if (s.ghost) {
    put(cast.ghost, at(s.ghost.x, s.ghost.y), true);
    put(cast.ghostLbl, tag(cast.ghostLbl, s.ghost.x, s.ghost.y), true);
  } else {
    put(cast.ghost, {}, false);
    put(cast.ghostLbl, {}, false);
  }
  const gd = s.guide;
  if (gd) {
    cast.guideX.textContent = fmt(gd.x);
    cast.guideY.textContent = fmtY(sit, gd.y);
    put(
      cast.guideV,
      { x1: cast.gx(gd.x), x2: cast.gx(gd.x), y1: cast.gy(gd.y), y2: cast.gy(0) },
      true,
    );
    put(
      cast.guideH,
      { x1: cast.gx(0), x2: cast.gx(gd.x), y1: cast.gy(gd.y), y2: cast.gy(gd.y) },
      true,
    );
    put(cast.guideX, { x: cast.gx(gd.x), y: GR.y0 - 7 }, gd.labels !== false);
    put(cast.guideY, { x: GR.x0 + 7, y: cast.gy(gd.y) - 6 }, gd.labels !== false);
  } else {
    for (const k of ["guideV", "guideH", "guideX", "guideY"]) put(cast[k], {}, false);
  }
  cast.note.forEach((nt, j) => {
    nt.textContent = s.note?.[j] ?? "";
    put(nt, {}, !!s.note?.[j]);
  });
  return m;
}
