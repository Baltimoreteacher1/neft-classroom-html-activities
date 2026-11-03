// Linked representations for the stadium: a table, an equation, a tape diagram and a graph, all computed from the
// same stadium state, so changing the world changes every one of them. Pure DOM builders, no state of their own.
import { h, s } from "../graphics/graphics-a-ui.js";
import { COST, areaCurve, capacityOf, costLine, derive } from "./stadium-math.js";

const fmt = (n) => Number(n).toLocaleString("en-US");
const money = (n) => `$${fmt(n)}`;

function table(caption, head, rows) {
  return h(
    "table",
    { class: "rl-table" },
    h("caption", { text: caption }),
    h("thead", {}, h("tr", {}, ...head.map((text) => h("th", { scope: "col", text })))),
    h(
      "tbody",
      {},
      ...rows.map((row) =>
        h(
          "tr",
          { class: row.cls },
          ...row.cells.map((text, i) =>
            i === 0 ? h("th", { scope: "row", text }) : h("td", { text }),
          ),
        ),
      ),
    ),
  );
}

const equation = (text, label) =>
  h("p", { class: "rl-equation", role: "math", "aria-label": label || text, text });

// Round an axis maximum up to 1, 2 or 5 times a power of ten so ticks read cleanly.
const niceMax = (n) => {
  const p = 10 ** Math.floor(Math.log10(Math.max(1, n)));
  return [1, 2, 5, 10].map((m) => m * p).find((v) => v >= n);
};

// A small line chart on a fixed 320 x 200 canvas with ticks on both axes.
function chart({ xMax, yMax: rawMax, series, marker, xLabel, yLabel, describe }) {
  const yMax = niceMax(rawMax);
  const W = 320;
  const H = 200;
  const m = { l: 62, r: 12, t: 14, b: 34 };
  const x = (v) => m.l + (v / xMax) * (W - m.l - m.r);
  const y = (v) => H - m.b - (Math.min(v, yMax) / yMax) * (H - m.t - m.b);
  const svg = s("svg", {
    viewBox: `0 0 ${W} ${H}`,
    class: "rl-chart",
    role: "img",
    "aria-label": describe,
  });
  svg.append(s("rect", { x: 0, y: 0, width: W, height: H, fill: "#fff", rx: 10 }));
  for (let i = 0; i <= 4; i += 1) {
    const gx = (xMax * i) / 4;
    const gy = (yMax * i) / 4;
    svg.append(s("line", { x1: x(gx), y1: m.t, x2: x(gx), y2: H - m.b, stroke: "#e4e8ec" }));
    svg.append(s("line", { x1: m.l, y1: y(gy), x2: W - m.r, y2: y(gy), stroke: "#e4e8ec" }));
    const tx = s("text", {
      x: x(gx),
      y: H - m.b + 14,
      "text-anchor": "middle",
      "font-size": 10,
      fill: "#52606d",
    });
    tx.textContent = Number.isInteger(gx) ? fmt(gx) : gx.toFixed(1);
    const ty = s("text", {
      x: m.l - 6,
      y: y(gy) + 3,
      "text-anchor": "end",
      "font-size": 10,
      fill: "#52606d",
    });
    ty.textContent = fmt(Math.round(gy));
    svg.append(tx, ty);
  }
  svg.append(
    s("line", {
      x1: m.l,
      y1: H - m.b,
      x2: W - m.r,
      y2: H - m.b,
      stroke: "#17324d",
      "stroke-width": 1.5,
    }),
  );
  svg.append(
    s("line", { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: "#17324d", "stroke-width": 1.5 }),
  );
  for (const line of series) {
    const d = line.pts
      .map(([px, py], i) => `${i ? "L" : "M"}${x(px).toFixed(1)} ${y(py).toFixed(1)}`)
      .join(" ");
    svg.append(
      s("path", {
        d,
        fill: "none",
        stroke: line.color,
        "stroke-width": 2.6,
        "stroke-dasharray": line.dashed ? "6 4" : null,
        "stroke-linecap": "round",
      }),
    );
  }
  if (marker)
    svg.append(
      s("circle", {
        cx: x(marker.x),
        cy: y(marker.y),
        r: 6,
        fill: "#f2c15b",
        stroke: "#17324d",
        "stroke-width": 2,
      }),
    );
  const xl = s("text", {
    x: (W + m.l) / 2,
    y: H - 4,
    "text-anchor": "middle",
    "font-size": 11,
    "font-weight": 600,
    fill: "#17324d",
  });
  xl.textContent = xLabel;
  const yl = s("text", {
    x: 12,
    y: H / 2,
    "text-anchor": "middle",
    "font-size": 11,
    "font-weight": 600,
    fill: "#17324d",
    transform: `rotate(-90 12 ${H / 2})`,
  });
  yl.textContent = yLabel;
  svg.append(xl, yl);
  return svg;
}

// Tape diagram: one bar cut into equal parts, the sold part shaded. Parts = the reduced ratio's denominator.
function tape(state, t) {
  const d = derive(state);
  const parts = d.occupancy.d;
  const done = d.occupancy.n;
  const W = 320;
  const svg = s("svg", {
    viewBox: `0 0 ${W} 74`,
    class: "rl-tape",
    role: "img",
    "aria-label": t("{n} out of every {d} seats are sold.", { n: done, d: parts }),
  });
  const cw = (W - 8) / Math.min(parts, 40);
  const shown = Math.min(parts, 40);
  for (let i = 0; i < shown; i += 1)
    svg.append(
      s("rect", {
        x: 4 + i * cw,
        y: 8,
        width: cw - 2,
        height: 40,
        rx: 4,
        fill: i < done ? "#f2c15b" : "#dff3f1",
        stroke: "#17324d",
        "stroke-width": 1.5,
      }),
    );
  const label = s("text", {
    x: W / 2,
    y: 66,
    "text-anchor": "middle",
    "font-size": 13,
    "font-weight": 700,
    fill: "#17324d",
  });
  label.textContent = `${done} : ${parts}  =  ${d.occupancyText}`;
  svg.append(label);
  return svg;
}

const KS = [0, 1, 2, 3, 4].map((n) => ({ n, d: 1 }));

// Everything the student can read about the world for this band. `observed` carries before/after once known;
// `hidden` withholds the answer-bearing numbers while an independent problem is open.
export function renderRepresentations(host, mission, state, { observed, hidden, base }, t) {
  host.replaceChildren();
  const d = derive(state);
  const band = mission.band;
  if (hidden) {
    host.append(
      h("p", {
        class: "rl-hidden",
        text: t(
          "The numbers are hidden while you work this one. Solve it, then check it on the field.",
        ),
      }),
    );
    return;
  }
  if (band === "k2") {
    host.append(
      table(
        t("Equal groups"),
        [t("Groups"), t("Seats in each group"), t("Seats in all")],
        [{ cells: [String(state.sections), String(state.seatsPerSection), String(d.capacity)] }],
      ),
      equation(
        `${state.sections} × ${state.seatsPerSection} = ${d.capacity}`,
        t("{s} groups of {p} seats make {total} seats.", {
          s: state.sections,
          p: state.seatsPerSection,
          total: d.capacity,
        }),
      ),
    );
    return;
  }
  if (band === "g35") {
    const rows = [];
    if (observed) {
      const a = derive(observed.before);
      rows.push({
        cells: [
          t("Before"),
          `${observed.before.length} m`,
          `${observed.before.width} m`,
          `${fmt(a.area)} m²`,
          `${fmt(a.perimeter)} m`,
        ],
      });
    }
    rows.push({
      cells: [
        observed ? t("Now") : t("Field"),
        `${state.length} m`,
        `${state.width} m`,
        `${fmt(d.area)} m²`,
        `${fmt(d.perimeter)} m`,
      ],
      cls: observed ? "rl-now" : null,
    });
    host.append(
      table(
        t("Field measurements"),
        ["", t("Length"), t("Width"), t("Area"), t("Perimeter")],
        rows,
      ),
      equation(
        `${state.length} × ${state.width} = ${fmt(d.area)} m²`,
        t("Area is length times width: {l} times {w} is {a} square metres.", {
          l: state.length,
          w: state.width,
          a: fmt(d.area),
        }),
      ),
    );
    if (d.cells)
      host.append(
        h("p", {
          class: "rl-note",
          text: t("{a} squares across and {b} down: {n} squares of 25 m².", {
            a: d.cells.across,
            b: d.cells.down,
            n: d.cells.across * d.cells.down,
          }),
        }),
      );
    return;
  }
  if (band === "g6") {
    host.append(
      table(
        t("Seats and tickets"),
        [t("Seats"), t("Sold"), t("Fraction"), t("Percent")],
        [
          {
            cells: [
              String(d.capacity),
              String(state.sold),
              `${d.occupancy.n}/${d.occupancy.d}`,
              d.occupancyText,
            ],
          },
        ],
      ),
      tape(state, t),
      equation(
        `${state.sold} ÷ ${d.capacity} = ${d.occupancy.n}/${d.occupancy.d} = ${d.occupancyText}`,
        t("{a} sold out of {b} seats is {pct}.", {
          a: state.sold,
          b: d.capacity,
          pct: d.occupancyText,
        }),
      ),
    );
    return;
  }
  if (band === "g7") {
    const ref = base ?? state;
    const k = ref.length ? state.length / ref.length : 1;
    const curve = areaCurve(
      ref,
      KS,
    ).map((p) => [p.k.n / p.k.d, p.area.n / p.area.d]);
    const line = KS.map((p) => [p.n, ref.length * ref.width * p.n]);
    const rows = [];
    if (observed) {
      const a = derive(observed.before);
      rows.push({
        cells: [
          t("Before"),
          `${observed.before.length} × ${observed.before.width}`,
          `${fmt(a.area)} m²`,
          `${fmt(a.perimeter)} m`,
        ],
      });
    }
    rows.push({
      cells: [
        observed ? t("Now") : t("Field"),
        `${state.length} × ${state.width}`,
        `${fmt(d.area)} m²`,
        `${fmt(d.perimeter)} m`,
      ],
      cls: observed ? "rl-now" : null,
    });
    host.append(
      table(t("Scaling the field"), ["", t("Length × width"), t("Area"), t("Perimeter")], rows),
      equation(
        `${state.length} × ${state.width} = ${fmt(d.area)} m²`,
        t("Area is length times width: {l} times {w} is {a} square metres.", {
          l: state.length,
          w: state.width,
          a: fmt(d.area),
        }),
      ),
    );
    if (
      observed &&
      ref.length &&
      ref.width &&
      state.length / ref.length === state.width / ref.width
    ) {
      const series = [
        { pts: curve, color: "#1fa6a2" },
        { pts: line, color: "#d9533a", dashed: true },
      ];
      host.append(
        chart({
          xMax: 4,
          yMax: ref.length * ref.width * 16,
          series,
          marker: { x: k, y: d.area },
          xLabel: t("Scale factor"),
          yLabel: t("Area (m²)"),
          describe: t(
            "Graph of area against the scale factor. The solid curve is the real area. The dashed line is what doubling would give if area changed in a straight line.",
          ),
        }),
      );
      host.append(
        h("p", {
          class: "rl-note",
          text: t("Solid: the real area. Dashed: a straight-line guess."),
        }),
      );
    }
    return;
  }
  // g8: cost is a linear function of the seats.
  const line = costLine(state);
  const seats = capacityOf(state);
  const top = Math.max(line.at(720), state.budget) * 1.05;
  host.append(
    table(
      t("Cost of the stadium"),
      [t("Seats"), t("Field"), t("Seats cost"), t("Total")],
      [
        {
          cells: [
            String(seats),
            money(line.fixed),
            money(seats * COST.perSeat),
            money(line.at(seats)),
          ],
          cls: line.at(seats) > state.budget ? "rl-over" : null,
        },
      ],
    ),
    equation(
      `cost = ${fmt(line.fixed)} + ${COST.perSeat} × seats`,
      t("Cost equals {fixed} plus 50 times the number of seats.", { fixed: fmt(line.fixed) }),
    ),
    chart({
      xMax: 720,
      yMax: top,
      series: [
        {
          pts: [
            [0, line.at(0)],
            [720, line.at(720)],
          ],
          color: "#1fa6a2",
        },
        {
          pts: [
            [0, state.budget],
            [720, state.budget],
          ],
          color: "#d9533a",
          dashed: true,
        },
      ],
      marker: { x: seats, y: line.at(seats) },
      xLabel: t("Seats"),
      yLabel: t("Cost ($)"),
      describe: t(
        "Graph of total cost against seats. The straight line starts at the field cost. The dashed line is the budget.",
      ),
    }),
    h("p", {
      class: "rl-note",
      text: t("Solid: cost. Dashed: budget of {b}.", { b: money(state.budget) }),
    }),
  );
}
