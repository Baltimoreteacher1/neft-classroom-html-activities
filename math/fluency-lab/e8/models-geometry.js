// Geometry and measurement models: area and perimeter, area decomposition, triangle from parallelogram, angle tool,
// coordinate plane (plot points), transformations, prism volume with fractional unit cubes, and a net for surface area.
import { Rational, R } from "./rational.js";
import { PLANE, PX, PY, inWindow, planeGrid } from "./models-ratio-algebra.js";
import {
  ModelError,
  bi,
  circle,
  clamp,
  intIn,
  line,
  rect,
  registerModel,
  svg,
  text,
} from "./engine-core.js";

const INK = "#17324d";
const TEAL = "#1fa6a2";
const AMBER = "#f2c15b";
const CORAL = "#d8613c";
const BLUE = "#1d5fa8";

// ---------------------------------------------------------------- area and perimeter
registerModel({
  id: "areaPerimeter",
  title: bi("Area and perimeter", "Área y perímetro"),
  grades: [3, 4],
  domain: "geometry",
  init: (p) => ({ w: p.w, h: p.h }),
  reduce(s, a) {
    if (a.type === "setW") return { ...s, w: intIn(a.value, 1, 12, bi("The width", "El ancho")) };
    if (a.type === "setH") return { ...s, h: intIn(a.value, 1, 12, bi("The height", "El alto")) };
    throw new ModelError("Unknown move");
  },
  derive(s) {
    return {
      facts: { area: s.w * s.h, perimeter: 2 * (s.w + s.h) },
      equation: `A = ${s.w} × ${s.h} = ${s.w * s.h} square units    P = 2 × (${s.w} + ${s.h}) = ${2 * (s.w + s.h)} units`,
      verbal: bi(
        `Area counts the ${s.w * s.h} squares inside, in square units. Perimeter measures the ${2 * (s.w + s.h)} units around the edge.`,
        `El área cuenta los ${s.w * s.h} cuadrados de adentro, en unidades cuadradas. El perímetro mide las ${2 * (s.w + s.h)} unidades del borde.`,
      ),
      numeric: {
        headers: ["measure", "value", "unit"],
        rows: [
          ["area", s.w * s.h, "square units"],
          ["perimeter", 2 * (s.w + s.h), "units"],
        ],
      },
    };
  },
  render(s) {
    const c = Math.min(32, Math.floor(360 / Math.max(s.w, s.h)));
    let inner = "";
    for (let r = 0; r < s.h; r += 1)
      for (let k = 0; k < s.w; k += 1)
        inner += rect(
          20 + k * c,
          20 + r * c,
          c,
          c,
          `class="cell on" fill="#cfe9e7" stroke="${INK}" stroke-width="1"`,
        );
    for (let k = 0; k < s.w; k += 1)
      inner +=
        line(
          20 + k * c + c / 2,
          8,
          20 + k * c + c / 2,
          14,
          `class="edge" stroke="${CORAL}" stroke-width="3"`,
        ) +
        line(
          20 + k * c + c / 2,
          26 + s.h * c,
          20 + k * c + c / 2,
          32 + s.h * c,
          `class="edge" stroke="${CORAL}" stroke-width="3"`,
        );
    for (let r = 0; r < s.h; r += 1)
      inner +=
        line(
          8,
          20 + r * c + c / 2,
          14,
          20 + r * c + c / 2,
          `class="edge" stroke="${CORAL}" stroke-width="3"`,
        ) +
        line(
          26 + s.w * c,
          20 + r * c + c / 2,
          32 + s.w * c,
          20 + r * c + c / 2,
          `class="edge" stroke="${CORAL}" stroke-width="3"`,
        );
    return svg(44 + s.w * c, 44 + s.h * c, inner, `Rectangle ${s.w} by ${s.h}`);
  },
  controls: (s) => [
    {
      id: "w+",
      label: bi("Make it 1 wider", "Hacerlo 1 más ancho"),
      action: { type: "setW", value: s.w + 1 },
      disabled: s.w >= 12,
    },
    {
      id: "w-",
      label: bi("Make it 1 narrower", "Hacerlo 1 más angosto"),
      action: { type: "setW", value: s.w - 1 },
      disabled: s.w <= 1,
    },
    {
      id: "h+",
      label: bi("Make it 1 taller", "Hacerlo 1 más alto"),
      action: { type: "setH", value: s.h + 1 },
      disabled: s.h >= 12,
    },
    {
      id: "h-",
      label: bi("Make it 1 shorter", "Hacerlo 1 más bajo"),
      action: { type: "setH", value: s.h - 1 },
      disabled: s.h <= 1,
    },
  ],
  describe: (s) =>
    bi(
      `A rectangle ${s.w} units wide and ${s.h} units tall.`,
      `Un rectángulo de ${s.w} unidades de ancho y ${s.h} de alto.`,
    ),
  verify(s) {
    const html = this.render(s);
    const cells = (html.match(/class="cell on"/g) || []).length;
    const edges = (html.match(/class="edge"/g) || []).length;
    const problems = [];
    if (cells !== s.w * s.h) problems.push(`counted ${cells} squares, area is ${s.w * s.h}`);
    if (edges !== 2 * (s.w + s.h))
      problems.push(`counted ${edges} edge units, perimeter is ${2 * (s.w + s.h)}`);
    return problems;
  },
  generate: (rng) => ({ w: rng.int(3, 9), h: rng.int(2, 7) }),
});

// ---------------------------------------------------------------- composite shape decomposed two ways
registerModel({
  id: "areaDecomp",
  title: bi("Area decomposition", "Descomposición de área"),
  grades: [3, 4, 5, 6],
  domain: "geometry",
  init: () => ({ cut: "v" }),
  reduce(s, a) {
    if (a.type === "cut" && (a.way === "v" || a.way === "h")) return { cut: a.way };
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const left = [p.W - p.nw, p.H];
    const right = [p.nw, p.H - p.nh];
    const top = [p.W - p.nw, p.nh];
    const bottom = [p.W, p.H - p.nh];
    const parts = s.cut === "v" ? [left, right] : [top, bottom];
    const total = p.W * p.H - p.nw * p.nh;
    return {
      facts: { parts, total },
      equation: `${parts.map(([w, h]) => `${w} × ${h}`).join(" + ")} = ${parts.map(([w, h]) => w * h).join(" + ")} = ${total}`,
      verbal: bi(
        `Cutting the L-shape ${s.cut === "v" ? "with a vertical line" : "with a horizontal line"} gives two rectangles. Their areas add to ${total}, the same as the other cut, or as the big rectangle ${p.W * p.H} minus the notch ${p.nw * p.nh}.`,
        `Cortar la figura en L ${s.cut === "v" ? "con una línea vertical" : "con una línea horizontal"} da dos rectángulos. Sus áreas suman ${total}, igual que con el otro corte, o que el rectángulo grande ${p.W * p.H} menos la muesca ${p.nw * p.nh}.`,
      ),
      numeric: {
        headers: ["part", "area"],
        rows: parts.map(([w, h], i) => [`${w} × ${h}`, w * h]),
      },
    };
  },
  render(s, p) {
    const u = Math.min(28, Math.floor(300 / Math.max(p.W, p.H)));
    let inner = "";
    for (let r = 0; r < p.H; r += 1)
      for (let c = 0; c < p.W; c += 1) {
        const inNotch = c >= p.W - p.nw && r < p.nh;
        if (inNotch) continue;
        const part = s.cut === "v" ? (c < p.W - p.nw ? 0 : 1) : r < p.nh ? 0 : 1;
        inner += rect(
          20 + c * u,
          20 + r * u,
          u,
          u,
          `class="cell on" data-part="${part}" fill="${part ? AMBER : "#cfe9e7"}" stroke="${INK}" stroke-width="1"`,
        );
      }
    return svg(
      40 + p.W * u,
      40 + p.H * u,
      inner,
      `L-shaped figure cut ${s.cut === "v" ? "vertically" : "horizontally"}`,
    );
  },
  controls: (s) => [
    {
      id: "v",
      label: bi("Cut with a vertical line", "Cortar con una línea vertical"),
      action: { type: "cut", way: "v" },
      disabled: s.cut === "v",
    },
    {
      id: "h",
      label: bi("Cut with a horizontal line", "Cortar con una línea horizontal"),
      action: { type: "cut", way: "h" },
      disabled: s.cut === "h",
    },
  ],
  describe: (s, p) =>
    bi(
      `An L-shaped figure made from a ${p.W} by ${p.H} rectangle with a ${p.nw} by ${p.nh} corner removed.`,
      `Una figura en L hecha con un rectángulo de ${p.W} por ${p.H} al que se le quitó una esquina de ${p.nw} por ${p.nh}.`,
    ),
  verify(s, p) {
    const html = this.render(s, p);
    const cells = (html.match(/class="cell on"/g) || []).length;
    const d = this.derive(s, p);
    const problems = [];
    if (cells !== d.facts.total)
      problems.push(`counted ${cells} squares, parts add to ${d.facts.total}`);
    if (d.facts.parts.reduce((acc, [w, h]) => acc + w * h, 0) !== p.W * p.H - p.nw * p.nh)
      problems.push("parts do not add to the whole minus the notch");
    return problems;
  },
  generate: (rng) => {
    const W = rng.int(6, 10);
    const H = rng.int(5, 8);
    return { W, H, nw: rng.int(2, W - 3), nh: rng.int(2, H - 2) };
  },
});

// ---------------------------------------------------------------- triangle as half a parallelogram
const parallelogramPts = (s) => [
  [0, 0],
  [s.b, 0],
  [s.b + s.slant, s.h],
  [s.slant, s.h],
];
const shoelace = (pts) => {
  let sum = R(0);
  pts.forEach(([x0, y0], i) => {
    const [x1, y1] = pts[(i + 1) % pts.length];
    sum = sum.add(R(x0).mul(y1)).sub(R(x1).mul(y0));
  });
  return sum.abs().div(2);
};
registerModel({
  id: "triangleArea",
  title: bi("Triangle area from a parallelogram", "Área del triángulo desde un paralelogramo"),
  grades: [6],
  domain: "geometry",
  init: (p) => ({ b: p.b, h: p.h, slant: p.slant ?? 2 }),
  reduce(s, a) {
    if (a.type === "setB") return { ...s, b: intIn(a.value, 2, 12, bi("The base", "La base")) };
    if (a.type === "setH") return { ...s, h: intIn(a.value, 2, 10, bi("The height", "La altura")) };
    if (a.type === "slant")
      return { ...s, slant: intIn(a.value, -4, 4, bi("The slant", "La inclinación")) };
    throw new ModelError("Unknown move");
  },
  derive(s) {
    const par = shoelace(parallelogramPts(s));
    const tri = shoelace([
      [0, 0],
      [s.b, 0],
      [s.b + s.slant, s.h],
    ]);
    return {
      facts: { parallelogram: par, triangle: tri },
      equation: `A = ½ × ${s.b} × ${s.h} = ${R(s.b * s.h, 2)}`,
      verbal: bi(
        `Two copies of the triangle make a parallelogram with base ${s.b} and height ${s.h}, area ${s.b * s.h}. One triangle is half: ${R(s.b * s.h, 2)}. Sliding the top corner sideways does not change the height, so it does not change the area.`,
        `Dos copias del triángulo forman un paralelogramo de base ${s.b} y altura ${s.h}, área ${s.b * s.h}. Un triángulo es la mitad: ${R(s.b * s.h, 2)}. Deslizar el vértice superior de lado no cambia la altura, así que no cambia el área.`,
      ),
      numeric: {
        headers: ["shape", "area"],
        rows: [
          ["parallelogram", par.toString()],
          ["triangle", tri.toString()],
        ],
      },
    };
  },
  render(s) {
    const u = Math.min(26, Math.floor(300 / (s.b + Math.abs(s.slant) + 1)));
    const ox = 30 + (s.slant < 0 ? -s.slant * u : 0);
    const oy = 20 + s.h * u;
    const P = ([x, y]) => `${(ox + x * u).toFixed(1)},${(oy - y * u).toFixed(1)}`;
    const par = parallelogramPts(s).map(P).join(" ");
    const tri = [
      [0, 0],
      [s.b, 0],
      [s.b + s.slant, s.h],
    ]
      .map(P)
      .join(" ");
    const inner = `<polygon class="para" points="${par}" fill="#e6f3f2" stroke="${INK}" stroke-width="2" stroke-dasharray="6 4"/><polygon class="tri" points="${tri}" fill="${TEAL}" fill-opacity=".75" stroke="${INK}" stroke-width="3"/>${line(ox + (s.b + s.slant) * u, oy - s.h * u, ox + (s.b + s.slant) * u, oy, `stroke="${CORAL}" stroke-width="2.5" stroke-dasharray="4 3"`)}${text(ox + (s.b / 2) * u, oy + 18, `b = ${s.b}`, `text-anchor="middle" font-size="14" font-weight="700" fill="${INK}"`)}${text(ox + (s.b + s.slant) * u + 8, oy - (s.h * u) / 2, `h = ${s.h}`, `font-size="14" font-weight="700" fill="${INK}"`)}`;
    return svg(
      60 + (s.b + Math.abs(s.slant)) * u + 60,
      60 + s.h * u,
      inner,
      `Triangle with base ${s.b} and height ${s.h} inside a parallelogram`,
    );
  },
  controls: (s) => [
    {
      id: "b+",
      label: bi("Base + 1", "Base + 1"),
      action: { type: "setB", value: s.b + 1 },
      disabled: s.b >= 12,
    },
    {
      id: "b-",
      label: bi("Base − 1", "Base − 1"),
      action: { type: "setB", value: s.b - 1 },
      disabled: s.b <= 2,
    },
    {
      id: "h+",
      label: bi("Height + 1", "Altura + 1"),
      action: { type: "setH", value: s.h + 1 },
      disabled: s.h >= 10,
    },
    {
      id: "h-",
      label: bi("Height − 1", "Altura − 1"),
      action: { type: "setH", value: s.h - 1 },
      disabled: s.h <= 2,
    },
    {
      id: "s+",
      label: bi("Slide the top corner right", "Deslizar el vértice a la derecha"),
      action: { type: "slant", value: s.slant + 1 },
      disabled: s.slant >= 4,
    },
    {
      id: "s-",
      label: bi("Slide the top corner left", "Deslizar el vértice a la izquierda"),
      action: { type: "slant", value: s.slant - 1 },
      disabled: s.slant <= -4,
    },
  ],
  describe: (s) =>
    bi(
      `A triangle with base ${s.b} and height ${s.h} inside a matching parallelogram.`,
      `Un triángulo de base ${s.b} y altura ${s.h} dentro de un paralelogramo igual.`,
    ),
  verify(s) {
    const d = this.derive(s);
    const problems = [];
    // Independent routes: shoelace on the drawn vertices versus half of base times height.
    if (!d.facts.triangle.eq(R(s.b * s.h, 2))) problems.push("triangle area disagrees with ½bh");
    if (!d.facts.parallelogram.eq(R(s.b * s.h)))
      problems.push("parallelogram area disagrees with bh");
    if (!d.facts.triangle.mul(2).eq(d.facts.parallelogram))
      problems.push("the triangle is not half the parallelogram");
    return problems;
  },
  generate: (rng) => ({ b: rng.int(4, 10), h: rng.int(3, 8), slant: rng.int(-2, 3) }),
});

// ---------------------------------------------------------------- angle tool
const classify = (deg) =>
  deg === 0
    ? "zero"
    : deg < 90
      ? "acute"
      : deg === 90
        ? "right"
        : deg < 180
          ? "obtuse"
          : deg === 180
            ? "straight"
            : deg < 360
              ? "reflex"
              : "full";
registerModel({
  id: "angleTool",
  title: bi("Angle tool", "Herramienta de ángulos"),
  grades: [4, 7, 8],
  domain: "geometry",
  init: (p) => ({ deg: p.deg }),
  reduce(s, a) {
    if (a.type === "set") return { deg: intIn(a.value, 0, 360, bi("The angle", "El ángulo")) };
    if (a.type === "step") return { deg: clamp(s.deg + a.by, 0, 360) };
    throw new ModelError("Unknown move");
  },
  derive(s) {
    const kind = classify(s.deg);
    return {
      facts: {
        deg: s.deg,
        kind,
        complement: s.deg <= 90 ? 90 - s.deg : null,
        supplement: s.deg <= 180 ? 180 - s.deg : null,
      },
      equation: `${s.deg}°${s.deg <= 90 ? `    complement: 90° − ${s.deg}° = ${90 - s.deg}°` : ""}${s.deg <= 180 ? `    supplement: 180° − ${s.deg}° = ${180 - s.deg}°` : ""}`,
      verbal: bi(
        `This ${s.deg}° angle is ${kind}. ${s.deg <= 90 ? `Its complement is ${90 - s.deg}°. ` : ""}${s.deg <= 180 ? `Its supplement is ${180 - s.deg}°.` : ""}`,
        `Este ángulo de ${s.deg}° es ${{ acute: "agudo", right: "recto", obtuse: "obtuso", straight: "llano", reflex: "cóncavo", full: "completo", zero: "nulo" }[kind]}. ${s.deg <= 90 ? `Su complemento es ${90 - s.deg}°. ` : ""}${s.deg <= 180 ? `Su suplemento es ${180 - s.deg}°.` : ""}`,
      ),
      numeric: {
        headers: ["angle", "type", "complement", "supplement"],
        rows: [
          [
            `${s.deg}°`,
            kind,
            s.deg <= 90 ? `${90 - s.deg}°` : "—",
            s.deg <= 180 ? `${180 - s.deg}°` : "—",
          ],
        ],
      },
    };
  },
  render(s) {
    const cx = 60;
    const cy = 150;
    const L = 150;
    const rad = (s.deg * Math.PI) / 180;
    const x2 = cx + L * Math.cos(rad);
    const y2 = cy - L * Math.sin(rad);
    const large = s.deg > 180 ? 1 : 0;
    const arc =
      s.deg === 0
        ? ""
        : `<path d="M${cx + 40} ${cy}A40 40 0 ${large} 0 ${(cx + 40 * Math.cos(rad)).toFixed(2)} ${(cy - 40 * Math.sin(rad)).toFixed(2)}" fill="none" stroke="${CORAL}" stroke-width="3"/>`;
    const inner = `${line(cx, cy, cx + L, cy, `stroke="${INK}" stroke-width="3"`)}${line(cx, cy, x2, y2, `class="ray" data-x="${(x2 - cx).toFixed(3)}" data-y="${(cy - y2).toFixed(3)}" stroke="${INK}" stroke-width="3"`)}${arc}${text(cx + 56, cy - 12, `${s.deg}°`, `font-size="18" font-weight="800" fill="${INK}"`)}`;
    return svg(240, 170, inner, `Angle of ${s.deg} degrees`);
  },
  controls: () => [
    { id: "+5", label: bi("Open 5° more", "Abrir 5° más"), action: { type: "step", by: 5 } },
    { id: "-5", label: bi("Close 5°", "Cerrar 5°"), action: { type: "step", by: -5 } },
    { id: "+30", label: bi("Open 30° more", "Abrir 30° más"), action: { type: "step", by: 30 } },
    {
      id: "r",
      label: bi("Make a right angle", "Hacer un ángulo recto"),
      action: { type: "set", value: 90 },
    },
    {
      id: "s",
      label: bi("Make a straight angle", "Hacer un ángulo llano"),
      action: { type: "set", value: 180 },
    },
  ],
  describe: (s) =>
    bi(`An angle of ${s.deg} degrees, called ${classify(s.deg)}.`, `Un ángulo de ${s.deg} grados.`),
  verify(s) {
    const m = /class="ray" data-x="([-\d.]+)" data-y="([-\d.]+)"/.exec(this.render(s));
    let measured = (Math.atan2(Number(m[2]), Number(m[1])) * 180) / Math.PI;
    if (measured < 0) measured += 360;
    const problems = [];
    // Compare the drawn ray's angle with the stated measure (0 and 360 draw the same ray).
    const diff = Math.min(
      Math.abs(measured - s.deg),
      Math.abs(measured - s.deg + 360),
      Math.abs(measured - s.deg - 360),
    );
    if (diff > 0.1) problems.push(`drawn angle ${measured.toFixed(1)}° differs from ${s.deg}°`);
    return problems;
  },
  generate: (rng) => ({ deg: rng.pick([30, 45, 60, 110, 135, 150, 210]) }),
});

// ---------------------------------------------------------------- coordinate plane (plotting)
const quadrant = (x, y) =>
  x === 0 || y === 0
    ? "on an axis"
    : x > 0 && y > 0
      ? "Quadrant I"
      : x < 0 && y > 0
        ? "Quadrant II"
        : x < 0 && y < 0
          ? "Quadrant III"
          : "Quadrant IV";
registerModel({
  id: "coordinatePlane",
  title: bi("Coordinate plane", "Plano de coordenadas"),
  grades: [5, 6, 7, 8],
  domain: "algebra",
  init: (p) => ({ cx: 0, cy: 0, points: (p.points || []).map(([x, y]) => [x, y]) }),
  reduce(s, a, p) {
    const lo = p.quadrants === 1 ? 0 : -10;
    if (a.type === "move") {
      const cx = s.cx + (a.dx || 0);
      const cy = s.cy + (a.dy || 0);
      if (cx < lo || cx > 10 || cy < lo || cy > 10)
        throw new ModelError(
          bi(
            "The cursor is at the edge of the grid.",
            "El cursor está en el borde de la cuadrícula.",
          ),
        );
      return { ...s, cx, cy };
    }
    if (a.type === "place") {
      if (s.points.some(([x, y]) => x === s.cx && y === s.cy))
        throw new ModelError(bi("A point is already there.", "Ya hay un punto ahí."));
      return { ...s, points: [...s.points, [s.cx, s.cy]] };
    }
    if (a.type === "removeLast") {
      if (!s.points.length)
        throw new ModelError(bi("There are no points to remove.", "No hay puntos que quitar."));
      return { ...s, points: s.points.slice(0, -1) };
    }
    if (a.type === "goto")
      return { ...s, cx: intIn(a.x, lo, 10, bi("x", "x")), cy: intIn(a.y, lo, 10, bi("y", "y")) };
    throw new ModelError("Unknown move");
  },
  derive(s) {
    return {
      facts: { points: s.points, cursor: [s.cx, s.cy] },
      equation: s.points.length
        ? s.points.map(([x, y]) => `(${x}, ${y})`).join("  ")
        : `cursor (${s.cx}, ${s.cy})`,
      verbal: bi(
        `The cursor is at (${s.cx}, ${s.cy}): go ${Math.abs(s.cx)} ${s.cx >= 0 ? "right" : "left"} first, then ${Math.abs(s.cy)} ${s.cy >= 0 ? "up" : "down"}. ${s.points.length} point${s.points.length === 1 ? "" : "s"} plotted.`,
        `El cursor está en (${s.cx}, ${s.cy}): ve ${Math.abs(s.cx)} ${s.cx >= 0 ? "a la derecha" : "a la izquierda"} primero y luego ${Math.abs(s.cy)} ${s.cy >= 0 ? "hacia arriba" : "hacia abajo"}. ${s.points.length} punto${s.points.length === 1 ? "" : "s"} marcado${s.points.length === 1 ? "" : "s"}.`,
      ),
      numeric: {
        headers: ["x", "y", "location"],
        rows: s.points.map(([x, y]) => [x, y, quadrant(x, y)]),
      },
    };
  },
  render(s) {
    let inner = planeGrid();
    s.points.forEach(([x, y], i) => {
      inner +=
        circle(
          PX(x),
          PY(y),
          6,
          `class="point" data-x="${x}" data-y="${y}" fill="${AMBER}" stroke="${INK}" stroke-width="2.5"`,
        ) +
        text(
          PX(x) + 9,
          PY(y) - 8,
          String.fromCharCode(65 + (i % 26)),
          `font-size="12" font-weight="800" fill="${INK}"`,
        );
    });
    inner += `<rect class="cursor" x="${PX(s.cx) - 9}" y="${PY(s.cy) - 9}" width="18" height="18" fill="none" stroke="${CORAL}" stroke-width="2.5" rx="3"/>`;
    return svg(
      PLANE.size,
      PLANE.size,
      inner,
      `Coordinate plane with ${s.points.length} points; cursor at (${s.cx}, ${s.cy})`,
    );
  },
  pointer: (s, p, hit) => [{ type: "goto", x: Math.round((hit.x - PLANE.origin) / PLANE.unit), y: Math.round((PLANE.origin - hit.y) / PLANE.unit) }, { type: "place" }],
  keys: () => ({ ArrowRight: { type: "move", dx: 1 }, ArrowLeft: { type: "move", dx: -1 }, ArrowUp: { type: "move", dy: 1 }, ArrowDown: { type: "move", dy: -1 }, Enter: { type: "place" }, Backspace: { type: "removeLast" } }),
  controls: () => [
    {
      id: "right",
      label: bi("Cursor right", "Cursor a la derecha"),
      action: { type: "move", dx: 1 },
    },
    {
      id: "left",
      label: bi("Cursor left", "Cursor a la izquierda"),
      action: { type: "move", dx: -1 },
    },
    { id: "up", label: bi("Cursor up", "Cursor arriba"), action: { type: "move", dy: 1 } },
    { id: "down", label: bi("Cursor down", "Cursor abajo"), action: { type: "move", dy: -1 } },
    {
      id: "place",
      label: bi("Plot a point here", "Marcar un punto aquí"),
      action: { type: "place" },
    },
    {
      id: "undo",
      label: bi("Remove the last point", "Quitar el último punto"),
      action: { type: "removeLast" },
    },
  ],
  describe: (s) =>
    bi(
      `A coordinate plane with ${s.points.length} plotted points: ${s.points.map(([x, y]) => `(${x}, ${y})`).join(", ") || "none yet"}.`,
      `Un plano de coordenadas con ${s.points.length} puntos: ${s.points.map(([x, y]) => `(${x}, ${y})`).join(", ") || "ninguno todavía"}.`,
    ),
  verify(s) {
    const html = this.render(s);
    const problems = [];
    const found = [...html.matchAll(/class="point" data-x="(-?\d+)" data-y="(-?\d+)"/g)].map(
      (m) => [Number(m[1]), Number(m[2])],
    );
    if (found.length !== s.points.length)
      problems.push("a plotted point is missing from the picture");
    // Map each drawn circle back from pixels to coordinates.
    for (const m of html.matchAll(
      /<circle cx="([\d.]+)" cy="([\d.]+)" r="6" class="point" data-x="(-?\d+)" data-y="(-?\d+)"/g,
    )) {
      const gx = (Number(m[1]) - PLANE.origin) / PLANE.unit;
      const gy = (PLANE.origin - Number(m[2])) / PLANE.unit;
      if (Math.abs(gx - Number(m[3])) > 0.01 || Math.abs(gy - Number(m[4])) > 0.01)
        problems.push("a point is drawn in the wrong place");
    }
    return problems;
  },
  generate: (rng, g) => ({ quadrants: g <= 5 ? 1 : 4, points: [] }),
});

// ---------------------------------------------------------------- transformations (exact, matrix-verified)
const OPS = {
  translate: (o, [x, y]) => [x.add(o.dx), y.add(o.dy)],
  reflect: (o, [x, y]) => (o.axis === "x" ? [x, y.neg()] : [x.neg(), y]),
  rotate: (o, [x, y]) =>
    o.quarter === 1 ? [y.neg(), x] : o.quarter === 2 ? [x.neg(), y.neg()] : [y, x.neg()],
  dilate: (o, [x, y]) => [x.mul(o.k), y.mul(o.k)],
};
// The same operations as affine matrices [[a, b, e], [c, d, f]]; composing them is a second, independent route.
const MATS = {
  translate: (o) => [
    [R(1), R(0), R(o.dx)],
    [R(0), R(1), R(o.dy)],
  ],
  reflect: (o) =>
    o.axis === "x"
      ? [
          [R(1), R(0), R(0)],
          [R(0), R(-1), R(0)],
        ]
      : [
          [R(-1), R(0), R(0)],
          [R(0), R(1), R(0)],
        ],
  rotate: (o) =>
    o.quarter === 1
      ? [
          [R(0), R(-1), R(0)],
          [R(1), R(0), R(0)],
        ]
      : o.quarter === 2
        ? [
            [R(-1), R(0), R(0)],
            [R(0), R(-1), R(0)],
          ]
        : [
            [R(0), R(1), R(0)],
            [R(-1), R(0), R(0)],
          ],
  dilate: (o) => [
    [Rational.of(o.k), R(0), R(0)],
    [R(0), Rational.of(o.k), R(0)],
  ],
};
const compose = (m2, m1) => [
  [
    m2[0][0].mul(m1[0][0]).add(m2[0][1].mul(m1[1][0])),
    m2[0][0].mul(m1[0][1]).add(m2[0][1].mul(m1[1][1])),
    m2[0][0].mul(m1[0][2]).add(m2[0][1].mul(m1[1][2])).add(m2[0][2]),
  ],
  [
    m2[1][0].mul(m1[0][0]).add(m2[1][1].mul(m1[1][0])),
    m2[1][0].mul(m1[0][1]).add(m2[1][1].mul(m1[1][1])),
    m2[1][0].mul(m1[0][2]).add(m2[1][1].mul(m1[1][2])).add(m2[1][2]),
  ],
];
const imageOf = (poly, ops) => poly.map((pt) => ops.reduce((q, o) => OPS[o.t](o, q), pt.map((v) => R(v))));
registerModel({
  id: "transformation",
  title: bi("Transformations", "Transformaciones"),
  grades: [8],
  domain: "geometry",
  init: () => ({ ops: [] }),
  reduce(s, a, p) {
    if (a.type === "clear") return { ops: [] };
    if (a.type === "undo") {
      if (!s.ops.length)
        throw new ModelError(bi("There is nothing to undo.", "No hay nada que deshacer."));
      return { ops: s.ops.slice(0, -1) };
    }
    if (a.type === "apply") {
      const o = { ...a.op };
      if (!OPS[o.t]) throw new ModelError("Unknown transformation");
      if (o.t === "dilate" && Rational.of(o.k).isZero())
        throw new ModelError(
          bi(
            "A scale factor of 0 would collapse the figure to a point.",
            "Un factor de escala de 0 reduciría la figura a un punto.",
          ),
        );
      const ops = [...s.ops, o];
      const img = imageOf(p.poly, ops);
      if (img.some(([x, y]) => !inWindow(x) || !inWindow(y)))
        throw new ModelError(
          bi(
            "The image would leave the grid. Try a smaller move.",
            "La imagen saldría de la cuadrícula. Prueba un movimiento menor.",
          ),
        );
      return { ops };
    }
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const img = imageOf(p.poly, s.ops);
    const words = s.ops.map((o) =>
      o.t === "translate"
        ? `translate (${o.dx}, ${o.dy})`
        : o.t === "reflect"
          ? `reflect over the ${o.axis}-axis`
          : o.t === "rotate"
            ? `rotate ${o.quarter * 90}° counterclockwise about the origin`
            : `dilate by ${o.k} from the origin`,
    );
    return {
      facts: { image: img, ops: s.ops },
      equation: s.ops.length ? words.join(", then ") : "no transformation yet",
      verbal: bi(
        s.ops.length
          ? `Each point moved by the same rule. The image is ${s.ops.every((o) => o.t !== "dilate") ? "congruent to" : "similar to"} the original.`
          : "Choose a transformation to see the image.",
        s.ops.length
          ? `Cada punto se movió con la misma regla. La imagen es ${s.ops.every((o) => o.t !== "dilate") ? "congruente con" : "semejante a"} la original.`
          : "Elige una transformación para ver la imagen.",
      ),
      numeric: {
        headers: ["point", "original", "image"],
        rows: p.poly.map((pt, i) => [
          String.fromCharCode(65 + i),
          `(${pt[0]}, ${pt[1]})`,
          `(${img[i][0]}, ${img[i][1]})`,
        ]),
      },
    };
  },
  render(s, p) {
    const pts = (list) => list.map(([x, y]) => `${PX(x).toFixed(1)},${PY(y).toFixed(1)}`).join(" ");
    const img = imageOf(p.poly, s.ops);
    let inner = planeGrid();
    inner += `<polygon class="original" points="${pts(p.poly)}" fill="${AMBER}" fill-opacity=".5" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4"/>`;
    inner += `<polygon class="image" points="${pts(img)}" fill="${TEAL}" fill-opacity=".6" stroke="${INK}" stroke-width="3"/>`;
    img.forEach(([x, y], i) => {
      inner += text(
        PX(x) + 6,
        PY(y) - 6,
        `${String.fromCharCode(65 + i)}${s.ops.length ? "′" : ""}`,
        `font-size="12" font-weight="800" fill="${INK}"`,
      );
    });
    return svg(
      PLANE.size,
      PLANE.size,
      inner,
      `Original figure and its image after ${s.ops.length} transformation${s.ops.length === 1 ? "" : "s"}`,
    );
  },
  controls: () => [
    {
      id: "t",
      label: bi("Slide right 3, up 2", "Deslizar 3 a la derecha y 2 hacia arriba"),
      action: { type: "apply", op: { t: "translate", dx: 3, dy: 2 } },
    },
    {
      id: "tl",
      label: bi("Slide left 2, down 1", "Deslizar 2 a la izquierda y 1 hacia abajo"),
      action: { type: "apply", op: { t: "translate", dx: -2, dy: -1 } },
    },
    {
      id: "rx",
      label: bi("Reflect over the x-axis", "Reflejar sobre el eje x"),
      action: { type: "apply", op: { t: "reflect", axis: "x" } },
    },
    {
      id: "ry",
      label: bi("Reflect over the y-axis", "Reflejar sobre el eje y"),
      action: { type: "apply", op: { t: "reflect", axis: "y" } },
    },
    {
      id: "r90",
      label: bi("Rotate 90° counterclockwise", "Girar 90° en sentido contrario a las agujas"),
      action: { type: "apply", op: { t: "rotate", quarter: 1 } },
    },
    {
      id: "d2",
      label: bi("Dilate × 2", "Dilatar × 2"),
      action: { type: "apply", op: { t: "dilate", k: 2 } },
    },
    {
      id: "dh",
      label: bi("Dilate × ½", "Dilatar × ½"),
      action: { type: "apply", op: { t: "dilate", k: "1/2" } },
    },
    {
      id: "undo",
      label: bi("Undo the last transformation", "Deshacer la última transformación"),
      action: { type: "undo" },
    },
  ],
  describe: (s, p) =>
    bi(
      `A figure with ${p.poly.length} vertices and its image after ${s.ops.length} transformations.`,
      `Una figura con ${p.poly.length} vértices y su imagen después de ${s.ops.length} transformaciones.`,
    ),
  verify(s, p) {
    const problems = [];
    const stepwise = imageOf(p.poly, s.ops);
    const matrix = s.ops.reduce(
      (m, o) => compose(MATS[o.t](o), m),
      [
        [R(1), R(0), R(0)],
        [R(0), R(1), R(0)],
      ],
    );
    p.poly.forEach(([x, y], i) => {
      const mx = matrix[0][0].mul(x).add(matrix[0][1].mul(y)).add(matrix[0][2]);
      const my = matrix[1][0].mul(x).add(matrix[1][1].mul(y)).add(matrix[1][2]);
      if (!mx.eq(stepwise[i][0]) || !my.eq(stepwise[i][1]))
        problems.push(`vertex ${i} differs between the step rule and the matrix`);
    });
    // Rigid motions preserve side lengths (squared, so no square roots are needed).
    if (s.ops.every((o) => o.t !== "dilate")) {
      const d2 = (a, b) =>
        a[0]
          .sub(b[0])
          .mul(a[0].sub(b[0]))
          .add(a[1].sub(b[1]).mul(a[1].sub(b[1])));
      p.poly.forEach((pt, i) => {
        const j = (i + 1) % p.poly.length;
        if (!d2(pt.map((v) => R(v)), p.poly[j].map((v) => R(v))).eq(d2(stepwise[i], stepwise[j])))
          problems.push("a rigid motion changed a side length");
      });
    }
    return problems;
  },
  generate: (rng) => {
    const x = rng.int(1, 3);
    const y = rng.int(1, 3);
    return {
      poly: [
        [x, y],
        [x + rng.int(2, 3), y],
        [x + 1, y + rng.int(2, 3)],
      ],
    };
  },
});

// ---------------------------------------------------------------- prism volume with unit cubes (including fractional edges)
registerModel({
  id: "prismVolume",
  title: bi("Prism volume", "Volumen de un prisma"),
  grades: [5, 6],
  domain: "geometry",
  init: (p) => ({ l: p.l, w: p.w, h: p.h }),
  reduce(s, a) {
    if (a.type === "setL") return { ...s, l: intIn(a.value, 1, 8, bi("The length", "El largo")) };
    if (a.type === "setW") return { ...s, w: intIn(a.value, 1, 8, bi("The width", "El ancho")) };
    if (a.type === "setH") return { ...s, h: intIn(a.value, 1, 8, bi("The height", "La altura")) };
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const unit = Rational.of(p.unit ?? 1);
    const edges = [R(s.l).mul(unit), R(s.w).mul(unit), R(s.h).mul(unit)];
    const cubes = s.l * s.w * s.h;
    const volume = unit.pow(3).mul(cubes);
    const base = edges[0].mul(edges[1]);
    return {
      facts: { cubes, volume, base, edges },
      equation: `V = ${edges[0]} × ${edges[1]} × ${edges[2]} = ${volume}    (B × h = ${base} × ${edges[2]} = ${base.mul(edges[2])})`,
      verbal: bi(
        `${s.l * s.w} cubes make one layer and there are ${s.h} layers, so ${cubes} cubes. Each cube has edge ${unit}, so the volume is ${cubes} × ${unit.pow(3)} = ${volume}.`,
        `${s.l * s.w} cubos forman una capa y hay ${s.h} capas, o sea ${cubes} cubos. Cada cubo tiene arista ${unit}, así que el volumen es ${cubes} × ${unit.pow(3)} = ${volume}.`,
      ),
      numeric: {
        headers: ["edge", "cubes", "length"],
        rows: [
          ["length", s.l, edges[0].toString()],
          ["width", s.w, edges[1].toString()],
          ["height", s.h, edges[2].toString()],
        ],
      },
    };
  },
  render(s) {
    const c = Math.min(26, Math.floor(260 / Math.max(s.l, s.w)));
    let inner = "";
    for (let r = 0; r < s.w; r += 1)
      for (let k = 0; k < s.l; k += 1)
        inner += rect(
          20 + k * c,
          20 + r * c,
          c,
          c,
          `class="cell on" fill="#cfe9e7" stroke="${INK}" stroke-width="1.2"`,
        );
    const lx = 40 + s.l * c;
    for (let layer = 0; layer < s.h; layer += 1)
      inner += rect(
        lx + 10,
        20 + (s.h - 1 - layer) * 20,
        56,
        16,
        `class="layer" fill="${AMBER}" stroke="${INK}" stroke-width="1.5" rx="2"`,
      );
    return svg(
      lx + 90,
      Math.max(60 + s.w * c, 50 + s.h * 20),
      inner,
      `Prism ${s.l} by ${s.w} by ${s.h} unit cubes`,
    );
  },
  controls: (s) => [
    {
      id: "l+",
      label: bi("Length + 1 cube", "Largo + 1 cubo"),
      action: { type: "setL", value: s.l + 1 },
      disabled: s.l >= 8,
    },
    {
      id: "l-",
      label: bi("Length − 1 cube", "Largo − 1 cubo"),
      action: { type: "setL", value: s.l - 1 },
      disabled: s.l <= 1,
    },
    {
      id: "w+",
      label: bi("Width + 1 cube", "Ancho + 1 cubo"),
      action: { type: "setW", value: s.w + 1 },
      disabled: s.w >= 8,
    },
    {
      id: "w-",
      label: bi("Width − 1 cube", "Ancho − 1 cubo"),
      action: { type: "setW", value: s.w - 1 },
      disabled: s.w <= 1,
    },
    {
      id: "h+",
      label: bi("Add a layer", "Agregar una capa"),
      action: { type: "setH", value: s.h + 1 },
      disabled: s.h >= 8,
    },
    {
      id: "h-",
      label: bi("Take a layer away", "Quitar una capa"),
      action: { type: "setH", value: s.h - 1 },
      disabled: s.h <= 1,
    },
  ],
  describe: (s, p) =>
    bi(
      `A rectangular prism ${s.l} cubes long, ${s.w} wide and ${s.h} tall, with cube edge ${p.unit ?? 1}.`,
      `Un prisma rectangular de ${s.l} cubos de largo, ${s.w} de ancho y ${s.h} de alto, con arista de cubo ${p.unit ?? 1}.`,
    ),
  verify(s, p) {
    const html = this.render(s);
    const d = this.derive(s, p);
    const problems = [];
    const base = (html.match(/class="cell on"/g) || []).length;
    const layers = (html.match(/class="layer"/g) || []).length;
    if (base * layers !== d.facts.cubes)
      problems.push(`picture has ${base} × ${layers} cubes, derived ${d.facts.cubes}`);
    // Two routes: count cubes × cube volume, and multiply the three edge lengths.
    if (!d.facts.edges[0].mul(d.facts.edges[1]).mul(d.facts.edges[2]).eq(d.facts.volume))
      problems.push("counting cubes and multiplying edges disagree");
    return problems;
  },
  generate: (rng, g) => ({
    l: rng.int(2, 5),
    w: rng.int(2, 4),
    h: rng.int(2, 4),
    unit: g >= 6 ? rng.pick(["1/2", "1/3", "1/4"]) : 1,
  }),
});

// ---------------------------------------------------------------- net and surface area
registerModel({
  id: "netSurface",
  title: bi("Net and surface area", "Red y área de superficie"),
  grades: [6],
  domain: "geometry",
  init: (p) => ({ l: p.l, w: p.w, h: p.h }),
  reduce(s, a) {
    const key = { setL: "l", setW: "w", setH: "h" }[a.type];
    if (!key) throw new ModelError("Unknown move");
    return { ...s, [key]: intIn(a.value, 1, 8, bi("That edge", "Esa arista")) };
  },
  derive(s) {
    const faces = [s.l * s.w, s.l * s.w, s.l * s.h, s.l * s.h, s.w * s.h, s.w * s.h];
    const sa = faces.reduce((x, y) => x + y, 0);
    return {
      facts: { faces, surfaceArea: sa, volume: s.l * s.w * s.h },
      equation: `SA = ${faces.join(" + ")} = ${sa}    (2 × (${s.l}×${s.w} + ${s.l}×${s.h} + ${s.w}×${s.h}) = ${2 * (s.l * s.w + s.l * s.h + s.w * s.h)})`,
      verbal: bi(
        `The net has 6 rectangles, in 3 matching pairs. Their areas add to the surface area, ${sa} square units. Volume is a different measure: ${s.l * s.w * s.h} cubic units.`,
        `La red tiene 6 rectángulos, en 3 pares iguales. Sus áreas suman el área de superficie, ${sa} unidades cuadradas. El volumen es otra medida: ${s.l * s.w * s.h} unidades cúbicas.`,
      ),
      numeric: {
        headers: ["face", "area"],
        rows: [
          ["top", faces[0]],
          ["bottom", faces[1]],
          ["front", faces[2]],
          ["back", faces[3]],
          ["left", faces[4]],
          ["right", faces[5]],
        ],
      },
    };
  },
  render(s) {
    const u = Math.min(
      20,
      Math.floor(300 / (2 * (s.w + s.h) + 0.01)) || 10,
      Math.floor(260 / (2 * s.h + s.w)) || 10,
      20,
    );
    const ox = 20;
    const oy = 20 + s.h * u;
    const face = (x, y, w, h, label, area) =>
      rect(
        ox + x * u,
        oy + y * u - s.h * u,
        w * u,
        h * u,
        `class="face" data-area="${area}" fill="${AMBER}" fill-opacity=".55" stroke="${INK}" stroke-width="2"`,
      ) +
      text(
        ox + (x + w / 2) * u,
        oy + (y + h / 2) * u - s.h * u + 4,
        `${label}`,
        `text-anchor="middle" font-size="12" font-weight="700" fill="${INK}"`,
      );
    const inner = [
      face(s.h, 0, s.l, s.h, "top", s.l * s.h),
      face(s.h, s.h, s.l, s.w, "front", s.l * s.w),
      face(s.h, s.h + s.w, s.l, s.h, "bottom", s.l * s.h),
      face(s.h, 2 * s.h + s.w, s.l, s.w, "back", s.l * s.w),
      face(0, s.h, s.h, s.w, "left", s.h * s.w),
      face(s.h + s.l, s.h, s.h, s.w, "right", s.h * s.w),
    ].join("");
    return svg(
      60 + (2 * s.h + s.l) * u,
      40 + (2 * s.h + 2 * s.w) * u,
      inner,
      `Net of a ${s.l} by ${s.w} by ${s.h} prism`,
    );
  },
  controls: (s) => [
    {
      id: "l+",
      label: bi("Length + 1", "Largo + 1"),
      action: { type: "setL", value: s.l + 1 },
      disabled: s.l >= 8,
    },
    {
      id: "l-",
      label: bi("Length − 1", "Largo − 1"),
      action: { type: "setL", value: s.l - 1 },
      disabled: s.l <= 1,
    },
    {
      id: "w+",
      label: bi("Width + 1", "Ancho + 1"),
      action: { type: "setW", value: s.w + 1 },
      disabled: s.w >= 8,
    },
    {
      id: "h+",
      label: bi("Height + 1", "Altura + 1"),
      action: { type: "setH", value: s.h + 1 },
      disabled: s.h >= 8,
    },
  ],
  describe: (s) =>
    bi(
      `A net of a ${s.l} by ${s.w} by ${s.h} rectangular prism, made of six rectangles.`,
      `Una red de un prisma rectangular de ${s.l} por ${s.w} por ${s.h}, hecha de seis rectángulos.`,
    ),
  verify(s) {
    const areas = [...this.render(s).matchAll(/data-area="(\d+)"/g)].map((m) => Number(m[1]));
    const problems = [];
    if (areas.length !== 6) problems.push("a net has six faces");
    if (areas.reduce((x, y) => x + y, 0) !== 2 * (s.l * s.w + s.l * s.h + s.w * s.h))
      problems.push("faces do not add to the surface-area formula");
    return problems;
  },
  generate: (rng) => ({ l: rng.int(2, 6), w: rng.int(2, 5), h: rng.int(2, 4) }),
});
