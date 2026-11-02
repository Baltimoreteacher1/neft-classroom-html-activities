// Drawing and working text for the protractor (angle) and ruler (cm and inches) tools.
import { s, t } from "./b-core.js";
import { decimalText, mixed, toNumber } from "./b-rational.js";
import * as G from "./geometry-math.js";

const rad = (deg) => (deg * Math.PI) / 180;
const kindText = (d) =>
  ({
    zero: t("zero angle"),
    acute: t("acute angle"),
    right: t("right angle"),
    obtuse: t("obtuse angle"),
    straight: t("straight angle"),
  })[G.angleKind(d)];

// ---- protractor ----------------------------------------------------------------------------------------------
export function angleLayout(width) {
  const r = Math.min(width / 2 - 34, 230);
  return { r, cx: width / 2, cy: r + 36, height: Math.round(r + 36 + 44) };
}

export function drawAngle(state, lay, hideReading) {
  const { r, cx, cy } = lay;
  const at = (deg, radius) => [cx + radius * Math.cos(rad(deg)), cy - radius * Math.sin(rad(deg))];
  const parts = [
    s("path", { class: "gb-protractor", d: `M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy} Z` }),
  ];
  for (let d = 0; d <= 180; d += 1) {
    const len = d % 10 === 0 ? 16 : d % 5 === 0 ? 11 : 6;
    const [x1, y1] = at(d, r);
    const [x2, y2] = at(d, r - len);
    parts.push(
      s("line", { class: d % 10 === 0 ? "gb-tick" : "gb-tick gb-tick--fine", x1, y1, x2, y2 }),
    );
    if (d % 10 === 0) {
      const spin = (deg) => (deg <= 90 ? -deg : 180 - deg);
      const [ox, oy] = at(d, r - 32);
      const [ix, iy] = at(d, r - 60);
      parts.push(s("text", { class: "gb-ticklabel gb-prolabel", x: ox, y: oy + 4, "text-anchor": "middle", transform: `rotate(${spin(d)} ${ox} ${oy})`, text: d }));
      parts.push(s("text", { class: "gb-ticklabel gb-prolabel gb-prolabel--inner", x: ix, y: iy + 4, "text-anchor": "middle", transform: `rotate(${spin(d)} ${ix} ${iy})`, text: 180 - d }));
    }
  }
  parts.push(s("line", { class: "gb-axis", x1: cx - r - 10, y1: cy, x2: cx + r + 14, y2: cy }));
  const [rx, ry] = at(state.degrees, r + 18);
  const [ax, ay] = at(state.degrees, r * 0.3);
  parts.push(
    s("path", {
      class: "gb-arc",
      d: `M${cx + r * 0.3},${cy} A${r * 0.3},${r * 0.3} 0 0 0 ${ax},${ay}`,
    }),
  );
  parts.push(s("line", { class: "gb-ray", x1: cx, y1: cy, x2: rx, y2: ry }));
  parts.push(s("circle", { class: "gb-vertex", cx, cy, r: 5 }));
  if (!hideReading) {
    const [lx, ly] = at(state.degrees / 2, r * 0.18 + 12);
    parts.push(
      s("text", {
        class: "gb-ptcoord",
        x: lx + 14,
        y: ly + 4,
        "text-anchor": "middle",
        text: `${state.degrees}°`,
      }),
    );
  }
  const [hx, hy] = at(state.degrees, r + 18);
  return {
    parts,
    handles: [
      {
        id: "ray",
        x: hx,
        y: hy,
        role: "slider",
        valuemin: 0,
        valuemax: 180,
        valuenow: state.degrees,
        valuetext: t("{d} degrees, {kind}", { d: state.degrees, kind: kindText(state.degrees) }),
        aria: t("Angle ray"),
      },
    ],
  };
}

export function angleDegrees(pt, lay) {
  const dx = pt.x - lay.cx;
  const dy = lay.cy - pt.y;
  if (dy < 0) return dx >= 0 ? 0 : 180;
  return Math.max(0, Math.min(180, Math.round((Math.atan2(dy, dx) * 180) / Math.PI)));
}

export function angleLines(state, hideReading) {
  const d = state.degrees;
  if (hideReading) return [t("Turn the ray to the angle you want, then read the protractor.")];
  const lines = [t("The angle measures {d}°. It is a {kind}.", { d, kind: kindText(d) })];
  if (d > 0 && d < 90) lines.push(t("Complement: 90° − {d}° = {c}°", { d, c: 90 - d }));
  if (d > 0 && d < 180) lines.push(t("Supplement: 180° − {d}° = {c}°", { d, c: 180 - d }));
  return lines;
}

// ---- ruler ---------------------------------------------------------------------------------------------------
export const rulerText = (unit, value) =>
  unit === "cm" ? `${decimalText(value)} cm` : `${mixed(value)} in`;

export function rulerLayout(width, unit) {
  const { max } = G.RULER[unit];
  const left = 20;
  const span = width - 40;
  return {
    left,
    span,
    perUnit: span / toNumber(max),
    height: 190,
    x: (v) => left + (toNumber(v) * span) / toNumber(max),
  };
}

export function drawRuler(state, lay, measure, hideReading) {
  const { unit } = state;
  const { max, step } = G.RULER[unit];
  const parts = [];
  const top = 104;
  parts.push(
    s("rect", {
      class: "gb-rulerbody",
      x: lay.left - 8,
      y: top,
      width: lay.span + 16,
      height: 64,
      rx: 6,
    }),
  );
  const steps = Math.round(toNumber(max) / toNumber(step));
  const per = unit === "cm" ? 10 : 16;
  for (let k = 0; k <= steps; k += 1) {
    const x = lay.left + (k * lay.span) / steps;
    const m = k % per;
    let len = 8;
    if (unit === "cm") len = m === 0 ? 30 : m === 5 ? 20 : 12;
    else len = m === 0 ? 30 : m === 8 ? 24 : m % 4 === 0 ? 18 : m % 2 === 0 ? 13 : 8;
    parts.push(s("line", { class: "gb-tick", x1: x, y1: top, x2: x, y2: top + len }));
    if (m === 0 && k > 0)
      parts.push(
        s("text", { class: "gb-rulernum", x, y: top + 50, "text-anchor": "middle", text: k / per }),
      );
  }
  parts.push(
    s("text", {
      class: "gb-rulernum",
      x: lay.left + lay.span - 4,
      y: top + 22,
      "text-anchor": "end",
      text: unit,
    }),
  );
  const objectEnd = lay.x(state.length);
  parts.push(
    s("rect", {
      class: "gb-object",
      x: lay.left,
      y: 56,
      width: Math.max(0, objectEnd - lay.left),
      height: 30,
      rx: 5,
    }),
  );
  const markerX = lay.x(measure ? state.marker : state.length);
  parts.push(s("line", { class: "gb-marker", x1: markerX, y1: 26, x2: markerX, y2: top + 36 }));
  const valuetext =
    hideReading && measure
      ? t("marker on the ruler")
      : rulerText(unit, measure ? state.marker : state.length);
  return {
    parts,
    handles: [
      {
        id: "end",
        x: markerX,
        y: measure ? 26 : 71,
        role: "slider",
        valuemin: 0,
        valuemax: toNumber(max),
        valuenow: toNumber(measure ? state.marker : state.length),
        valuetext,
        aria: measure ? t("Ruler marker") : t("End of the object"),
      },
    ],
  };
}

export function rulerLines(state, measure, hideReading) {
  if (measure && hideReading)
    return [t("Slide the marker to the end of the object, then read the ruler.")];
  const v = measure ? state.marker : state.length;
  const lines = [t("Reading: {text}", { text: rulerText(state.unit, v) })];
  if (state.unit === "cm")
    lines.push(
      t("That is {cm} cm and {mm} mm.", {
        cm: Math.floor(toNumber(v)),
        mm: Math.round((toNumber(v) % 1) * 10),
      }),
    );
  else lines.push(t("As a decimal: {d} in", { d: decimalText(v) }));
  return lines;
}

export function rulerValue(pt, lay, unit) {
  const { max } = G.RULER[unit];
  const frac = Math.max(0, Math.min(1, (pt.x - lay.left) / lay.span));
  return G.snapLength(unit, { n: Math.round(frac * toNumber(max) * 1000), d: 1000 });
}
