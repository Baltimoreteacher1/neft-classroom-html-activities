// Drawing for the coordinate grid: grid lines, axes, labels, the figure, its image and the distance legs.
import { num, s } from "./b-core.js";
import { ZERO, clamp, rat, show, toNumber } from "./b-rational.js";
import * as M from "./coordinate-grid-math.js";
import { pair } from "./coordinate-grid-text.js";

export function drawGrid(parts, { state, px, py, unit }) {
  const { xmin, xmax, ymin, ymax } = state.range;
  const every = [1, 2, 5, 10].find((n) => n * unit >= 26) || 10;
  const left = px(rat(xmin));
  const right = px(rat(xmax));
  const top = py(rat(ymax));
  const bottom = py(rat(ymin));
  parts.push(
    s("rect", { class: "gb-gridbg", x: left, y: top, width: right - left, height: bottom - top }),
  );
  const stepN = toNumber(state.step);
  if (stepN < 1) {
    for (let v = Math.ceil(xmin / stepN) * stepN; v <= xmax + 1e-9; v += stepN)
      parts.push(
        s("line", {
          class: "gb-gridline gb-gridline--minor",
          x1: px(rat(Math.round(v * 8), 8)),
          x2: px(rat(Math.round(v * 8), 8)),
          y1: top,
          y2: bottom,
        }),
      );
    for (let v = Math.ceil(ymin / stepN) * stepN; v <= ymax + 1e-9; v += stepN)
      parts.push(
        s("line", {
          class: "gb-gridline gb-gridline--minor",
          y1: py(rat(Math.round(v * 8), 8)),
          y2: py(rat(Math.round(v * 8), 8)),
          x1: left,
          x2: right,
        }),
      );
  }
  for (let v = xmin; v <= xmax; v += 1)
    parts.push(
      s("line", { class: "gb-gridline", x1: px(rat(v)), x2: px(rat(v)), y1: top, y2: bottom }),
    );
  for (let v = ymin; v <= ymax; v += 1)
    parts.push(
      s("line", { class: "gb-gridline", y1: py(rat(v)), y2: py(rat(v)), x1: left, x2: right }),
    );
  const axisY = clamp(ZERO, rat(ymin), rat(ymax));
  const axisX = clamp(ZERO, rat(xmin), rat(xmax));
  parts.push(s("line", { class: "gb-axis", x1: left, x2: right, y1: py(axisY), y2: py(axisY) }));
  parts.push(s("line", { class: "gb-axis", x1: px(axisX), x2: px(axisX), y1: top, y2: bottom }));
  parts.push(
    s("text", {
      class: "gb-axisname",
      x: right + 2,
      y: py(axisY) - 6,
      "text-anchor": "end",
      text: "x",
    }),
  );
  parts.push(s("text", { class: "gb-axisname", x: px(axisX) + 8, y: top + 12, text: "y" }));
  for (let v = Math.ceil(xmin / every) * every; v <= xmax; v += every)
    if (v !== 0)
      parts.push(
        s("text", {
          class: "gb-ticklabel",
          x: px(rat(v)),
          y: Math.min(py(axisY) + 16, bottom + 18),
          "text-anchor": "middle",
          text: num(v),
        }),
      );
  for (let v = Math.ceil(ymin / every) * every; v <= ymax; v += every)
    if (v !== 0)
      parts.push(
        s("text", {
          class: "gb-ticklabel",
          x: Math.max(px(axisX) - 7, left - 7),
          y: py(rat(v)) + 4,
          "text-anchor": "end",
          text: num(v),
        }),
      );
  if (xmin <= 0 && xmax >= 0 && ymin <= 0 && ymax >= 0) {
    parts.push(
      s("text", {
        class: "gb-ticklabel",
        x: px(ZERO) - 7,
        y: py(ZERO) + 16,
        "text-anchor": "end",
        text: "0",
      }),
    );
    for (const [qx, qy, label] of [
      [1, 1, "I"],
      [-1, 1, "II"],
      [-1, -1, "III"],
      [1, -1, "IV"],
    ]) {
      const lim = qx > 0 ? xmax : xmin;
      const limy = qy > 0 ? ymax : ymin;
      if (lim !== 0 && limy !== 0)
        parts.push(
          s("text", {
            class: "gb-quadrant",
            x: px(rat(lim)) - qx * 22,
            y: py(rat(limy)) + (qy > 0 ? 24 : -14),
            "text-anchor": "middle",
            "aria-hidden": "true",
            text: label,
          }),
        );
    }
  }
}


const shape = (points, cls, closed, px, py) => {
  if (points.length < 2) return null;
  const d = points.map((p) => `${px(p.x)},${py(p.y)}`).join(" ");
  return s(closed && points.length > 2 ? "polygon" : "polyline", { class: cls, points: d });
};

export function drawFigure(parts, { state, px, py, name, indexOf }) {
  parts.push(shape(state.points, "gb-poly", state.closed, px, py));
  const image = M.imagePoints(state);
  if (state.transform.type !== "none" && state.points.length) {
    parts.push(shape(image, "gb-poly gb-poly--image", state.closed, px, py));
    image.forEach((p, i) => {
      parts.push(
        s("rect", { class: "gb-imgdot", x: px(p.x) - 6, y: py(p.y) - 6, width: 12, height: 12 }),
      );
      parts.push(
        s("text", { class: "gb-ptlabel", x: px(p.x) + 9, y: py(p.y) - 8, text: `${name(i)}′` }),
      );
    });
  }
  const sel = indexOf(state.selected);
  if (sel >= 0 && state.points.length > 1) {
    const p = state.points[sel];
    const q = state.points[(sel + 1) % state.points.length];
    const facts = M.legs(p, q);
    if (facts.kind === "diagonal" || facts.kind === "horizontal" || facts.kind === "vertical") {
      parts.push(
        s("path", { class: "gb-leg", d: `M${px(p.x)},${py(p.y)} H${px(q.x)} V${py(q.y)}` }),
      );
      if (facts.dx.n)
        parts.push(
          s("text", {
            class: "gb-legtext",
            x: (px(p.x) + px(q.x)) / 2,
            y: py(p.y) + (toNumber(q.y) >= toNumber(p.y) ? 16 : -8),
            "text-anchor": "middle",
            text: show(facts.dx),
          }),
        );
      if (facts.dy.n)
        parts.push(
          s("text", {
            class: "gb-legtext",
            x: px(q.x) + (toNumber(q.x) >= toNumber(p.x) ? 8 : -8),
            y: (py(p.y) + py(q.y)) / 2 + 4,
            "text-anchor": toNumber(q.x) >= toNumber(p.x) ? "start" : "end",
            text: show(facts.dy),
          }),
        );
    }
    parts.push(
      s("text", { class: "gb-ptcoord", x: px(p.x) + 12, y: py(p.y) + 24, text: pair(p) }),
    );
  }
}
