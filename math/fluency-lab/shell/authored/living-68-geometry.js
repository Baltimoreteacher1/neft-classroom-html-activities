// Living models for area, volume, circles, angles and transformations (Grades 6–8). Each render() computes the
// picture, the table and the equation from one state. Pictures are drawn to fill a ~330-unit viewBox so labels
// stay at least 14px on a 320px screen.
import { L, eighths, fmt, half, livingModel, svg, table, text } from "./kit-68.js";

const Q1 = "var(--q1)";
const Q2 = "var(--q2)";
const Q3 = "var(--q3)";
const PI = 3.14;
const r2 = (n) => Math.round(n * 100) / 100;

// Triangle and its copy: together they make a parallelogram with the same base and height, so the triangle is
// exactly half of b × h. Sliding the top vertex changes the shape but not the area.
export const triangleAreaModel = livingModel({
  label: L("Change the triangle", "Cambia el triángulo"),
  sliders: [
    { id: "b", label: L("Base", "Base"), min: 2, max: 10, step: 1, value: 6 },
    {
      id: "h",
      label: L("Height", "Altura"),
      min: 2,
      max: 6,
      step: 1,
      value: 4,
    },
    {
      id: "s",
      label: L("Slide the top vertex", "Desliza el vértice superior"),
      min: 0,
      max: 10,
      step: 1,
      value: 2,
    },
  ],
  render(s, T) {
    s.s = Math.min(s.s, s.b); // the top vertex stays above the base
    const u = Math.min(26, 252 / (s.b + s.s));
    const x0 = 62;
    const y0 = 30 + s.h * u;
    const P = (x, y) => `${x0 + x * u},${y0 - y * u}`;
    const grid = [];
    for (let i = 0; i <= s.b + s.s; i += 1)
      grid.push(
        `<line x1="${x0 + i * u}" y1="${y0 - s.h * u}" x2="${x0 + i * u}" y2="${y0}" stroke="var(--line-2)"/>`,
      );
    for (let j = 0; j <= s.h; j += 1)
      grid.push(
        `<line x1="${x0}" y1="${y0 - j * u}" x2="${x0 + (s.b + s.s) * u}" y2="${y0 - j * u}" stroke="var(--line-2)"/>`,
      );
    const pic = svg(
      330,
      y0 + 34,
      T(
        L(
          `Triangle with base ${s.b} and height ${s.h}, and an identical copy turned around; together they make a parallelogram with area ${s.b * s.h}.`,
          `Triángulo de base ${s.b} y altura ${s.h}, y una copia idéntica girada; juntos forman un paralelogramo de área ${s.b * s.h}.`,
        ),
      ),
      `${grid.join("")}
       <polygon points="${P(s.b, 0)} ${P(s.b + s.s, s.h)} ${P(s.s, s.h)}" fill="${Q2}" fill-opacity=".12" stroke="${Q2}" stroke-width="2" stroke-dasharray="6 4"/>
       <polygon points="${P(0, 0)} ${P(s.b, 0)} ${P(s.s, s.h)}" fill="${Q1}" fill-opacity=".35" stroke="${Q1}" stroke-width="2.5"/>
       <line x1="${x0 + s.s * u}" y1="${y0 - s.h * u}" x2="${x0 + s.s * u}" y2="${y0}" stroke="${Q3}" stroke-width="2.5"/>
       <path d="M${x0 + s.s * u} ${y0 - 10} h10 v10" fill="none" stroke="${Q3}" stroke-width="1.5"/>
       ${text(x0 + (s.b * u) / 2, y0 + 24, `b = ${s.b}`, `fill="${Q1}"`)}<path d="M${x0 - 14} ${y0 - s.h * u} h8 M${x0 - 10} ${y0 - s.h * u} V${y0} M${x0 - 14} ${y0} h8" stroke="${Q3}" stroke-width="2" fill="none"/>${text(x0 - 18, y0 - (s.h * u) / 2 + 6, `h = ${s.h}`, `fill="${Q3}" text-anchor="end"`)}
       ${text(x0 + (s.b + s.s) * u - 4, 20, T(L("copy", "copia")), `font-size="12" fill="${Q2}" text-anchor="end"`)}`,
    );
    const whole = s.b * s.h;
    return {
      svg: pic,
      eq: T(
        L(
          `Parallelogram: ${s.b} × ${s.h} = ${whole}. The triangle is half of it: [[1/2]] × ${s.b} × ${s.h} = ${fmt(whole / 2)} square units, wherever the top vertex is.`,
          `Paralelogramo: ${s.b} × ${s.h} = ${whole}. El triángulo es la mitad: [[1/2]] × ${s.b} × ${s.h} = ${fmt(whole / 2)} unidades cuadradas, esté donde esté el vértice superior.`,
        ),
      ),
    };
  },
});

// A prism with edges in halves, drawn as a box whose visible faces are ruled in ½-unit squares, so the ½-unit
// cubes can be counted. Counting cubes ÷ 8 must equal length × width × height.
export const fractionalVolumeModel = livingModel({
  label: L("Change the prism", "Cambia el prisma"),
  sliders: [
    {
      id: "l",
      label: L("Length (units)", "Largo (unidades)"),
      min: 0.5,
      max: 4,
      step: 0.5,
      value: 2.5,
      show: half,
    },
    {
      id: "w",
      label: L("Width (units)", "Ancho (unidades)"),
      min: 0.5,
      max: 3,
      step: 0.5,
      value: 1,
      show: half,
    },
    {
      id: "h",
      label: L("Height (units)", "Alto (unidades)"),
      min: 0.5,
      max: 3,
      step: 0.5,
      value: 1.5,
      show: half,
    },
  ],
  render(s, T) {
    const [nl, nw, nh] = [s.l * 2, s.w * 2, s.h * 2];
    const c = Math.min(26, 196 / (nl + nw * 0.6), 150 / (nh + nw * 0.45));
    const dx = c * 0.6;
    const dy = c * 0.45;
    const x0 = 64;
    const y0 = 30 + nw * dy + nh * c;
    const F = (x, y, z) => [x0 + x * c + z * dx, y0 - y * c - z * dy];
    const pt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    const face = (corners, fill) =>
      `<polygon points="${corners.map(pt).join(" ")}" fill="${fill}" stroke="var(--ink-2)" stroke-width="1.5"/>`;
    const lines = [];
    for (let i = 1; i < nl; i += 1)
      lines.push([F(i, 0, 0), F(i, nh, 0)], [F(i, nh, 0), F(i, nh, nw)]);
    for (let j = 1; j < nh; j += 1)
      lines.push([F(0, j, 0), F(nl, j, 0)], [F(nl, j, 0), F(nl, j, nw)]);
    for (let k = 1; k < nw; k += 1)
      lines.push([F(0, nh, k), F(nl, nh, k)], [F(nl, 0, k), F(nl, nh, k)]);
    const count = nl * nw * nh;
    const pic = svg(
      330,
      y0 + 32,
      T(
        L(
          `Prism ${half(s.l)} by ${half(s.w)} by ${half(s.h)} units; its faces are ruled in half units, so it holds ${count} half-unit cubes.`,
          `Prisma de ${half(s.l)} por ${half(s.w)} por ${half(s.h)} unidades; sus caras están divididas en medias unidades, así que contiene ${count} cubitos de media unidad.`,
        ),
      ),
      `${face([F(0, 0, 0), F(nl, 0, 0), F(nl, nh, 0), F(0, nh, 0)], "color-mix(in srgb, var(--q2) 18%, white)")}
       ${face([F(0, nh, 0), F(nl, nh, 0), F(nl, nh, nw), F(0, nh, nw)], "color-mix(in srgb, var(--q2) 30%, white)")}
       ${face([F(nl, 0, 0), F(nl, 0, nw), F(nl, nh, nw), F(nl, nh, 0)], "color-mix(in srgb, var(--q2) 42%, white)")}
       ${lines.map(([p, q]) => `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="var(--ink-2)" stroke-width=".8" opacity=".55"/>`).join("")}
       ${text((F(0, 0, 0)[0] + F(nl, 0, 0)[0]) / 2, F(0, 0, 0)[1] + 24, half(s.l))}
       ${text(F(0, 0, 0)[0] - 8, (F(0, 0, 0)[1] + F(0, nh, 0)[1]) / 2 + 6, half(s.h), 'text-anchor="end"')}
       ${text(F(nl, 0, nw)[0] + 8, (F(nl, 0, 0)[1] + F(nl, 0, nw)[1]) / 2 + 6, half(s.w), 'text-anchor="start"')}`,
    );
    const v = s.l * s.w * s.h;
    const tab = table(
      T(L("Two ways to find the volume", "Dos maneras de hallar el volumen")),
      [
        [
          T(L("Half-unit cubes", "Cubitos de ½")),
          T(L("Each", "Cada uno")),
          T(L("Volume", "Volumen")),
        ],
        [
          `${nl} × ${nw} × ${nh} = ${count}`,
          "1/8",
          `${count} ÷ 8 = ${eighths(v)}`,
        ],
      ],
    );
    return {
      svg: pic,
      table: tab,
      eq: T(
        L(
          `V = ${half(s.l)} × ${half(s.w)} × ${half(s.h)} = ${eighths(v)} cubic units`,
          `V = ${half(s.l)} × ${half(s.w)} × ${half(s.h)} = ${eighths(v)} unidades cúbicas`,
        ),
      ),
    };
  },
});

// Circumference: the circle and its circumference rolled out flat, with three diameters laid along it. The picture
// is drawn to fit, so the comparison (just over 3 diameters) is what the eye sees at every size.
export const circumferenceModel = livingModel({
  label: L("Change the circle", "Cambia el círculo"),
  sliders: [
    {
      id: "d",
      label: L("Diameter (cm)", "Diámetro (cm)"),
      min: 1,
      max: 10,
      step: 1,
      value: 4,
    },
  ],
  render(s, T) {
    const C = r2(PI * s.d);
    const u = 290 / (PI * s.d); // px per cm: the rolled-out circumference always spans the width
    const R = (s.d * u) / 2;
    const cy = 20 + R;
    const lineY = cy + R + 40;
    const segs = [];
    for (let i = 0; i < 3; i += 1)
      segs.push(
        `<rect x="${20 + i * s.d * u}" y="${lineY + 10}" width="${s.d * u}" height="12" fill="${i % 2 ? Q2 : Q1}" fill-opacity=".8"/>${text(20 + (i + 0.5) * s.d * u, lineY + 44, "d", 'font-size="12"')}`,
      );
    const pic = svg(
      330,
      lineY + 54,
      T(
        L(
          `Circle with diameter ${s.d} cm. Rolled out flat, its circumference, ${C} cm, is three diameters and a little more.`,
          `Círculo de diámetro ${s.d} cm. Desenrollada, su circunferencia, ${C} cm, mide tres diámetros y un poco más.`,
        ),
      ),
      `<circle cx="${20 + R}" cy="${cy}" r="${R}" fill="none" stroke="${Q3}" stroke-width="3.5"/>
       <line x1="20" y1="${cy}" x2="${20 + 2 * R}" y2="${cy}" stroke="${Q1}" stroke-width="2.5"/>${text(20 + 2 * R + 10, cy + 6, `d = ${s.d} cm`, `fill="${Q1}" text-anchor="start"`)}
       <line x1="20" y1="${lineY}" x2="310" y2="${lineY}" stroke="${Q3}" stroke-width="5" stroke-linecap="round"/>
       ${text(310, lineY - 10, `C ≈ ${C} cm`, `fill="${Q3}" text-anchor="end"`)}${segs.join("")}
       <rect x="${20 + 3 * s.d * u}" y="${lineY + 10}" width="${310 - 20 - 3 * s.d * u}" height="12" fill="var(--q3)" fill-opacity=".35"/>`,
    );
    const rows = [["d (cm)", "C ≈ 3.14 × d", "C ÷ d"]];
    for (const d of [...new Set([1, 2, s.d])].sort((a, b) => a - b))
      rows.push([String(d), String(r2(PI * d)), "3.14"]);
    return {
      svg: pic,
      table: table(
        T(L("Circles of different sizes", "Círculos de distintos tamaños")),
        rows,
        rows.findIndex((r) => r[0] === String(s.d)) - 1,
      ),
      eq: T(
        L(
          `d = ${s.d} cm, so r = ${fmt(s.d / 2)} cm. C = π × d ≈ 3.14 × ${s.d} = ${C} cm: three diameters and about 0.14 of another.`,
          `d = ${s.d} cm, así que r = ${fmt(s.d / 2)} cm. C = π × d ≈ 3,14 × ${s.d} = ${C} cm: tres diámetros y unos 0,14 de otro.`,
        ),
      ),
    };
  },
});

// Angles: two crossing lines (one angle sets all four) and a triangle (two angles set the third). Each angle is
// marked with an arc and its measure sits on the arc's bisector, clear of the lines.
const rad = (d) => (d * Math.PI) / 180;
const arc = (cx, cy, r, from, to, color) => {
  const p = (a) =>
    `${(cx + r * Math.cos(rad(a))).toFixed(1)},${(cy - r * Math.sin(rad(a))).toFixed(1)}`;
  return `<path d="M${p(from)} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 0 ${p(to)}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
};
const tag = (cx, cy, r, mid, label, color) =>
  text(
    (cx + r * Math.cos(rad(mid))).toFixed(1),
    (cy - r * Math.sin(rad(mid)) + 6).toFixed(1),
    label,
    `fill="${color}"`,
  );
export const angleModel = livingModel({
  label: L("Change the angles", "Cambia los ángulos"),
  sliders: [
    {
      id: "a",
      label: L(
        "Angle where the lines cross",
        "Ángulo donde se cruzan las rectas",
      ),
      min: 30,
      max: 150,
      step: 5,
      value: 55,
      show: (v) => `${v}°`,
    },
    {
      id: "p",
      label: L("Triangle angle A", "Ángulo A del triángulo"),
      min: 25,
      max: 110,
      step: 5,
      value: 50,
      show: (v) => `${v}°`,
    },
    {
      id: "q",
      label: L("Triangle angle B", "Ángulo B del triángulo"),
      min: 25,
      max: 110,
      step: 5,
      value: 70,
      show: (v) => `${v}°`,
    },
  ],
  render(s, T) {
    const q = s.q;
    const c = 180 - s.p - q;
    // Crossing lines, centred at (95, 90).
    const [cx, cy, R] = [95, 90, 80];
    const ex = R * Math.cos(rad(s.a));
    const ey = R * Math.sin(rad(s.a));
    const crossing = `<line x1="${cx - R}" y1="${cy}" x2="${cx + R}" y2="${cy}" stroke="var(--ink-2)" stroke-width="2.5"/>
       <line x1="${(cx - ex).toFixed(1)}" y1="${(cy + ey).toFixed(1)}" x2="${(cx + ex).toFixed(1)}" y2="${(cy - ey).toFixed(1)}" stroke="var(--ink-2)" stroke-width="2.5"/>
       ${arc(cx, cy, 22, 0, s.a, Q1)}${arc(cx, cy, 22, 180, 180 + s.a, Q1)}${arc(cx, cy, 28, s.a, 180, Q2)}
       ${tag(cx, cy, 46, s.a / 2, `${s.a}°`, Q1)}${tag(cx, cy, 46, 180 + s.a / 2, `${s.a}°`, Q1)}${tag(cx, cy, 50, (s.a + 180) / 2, `${180 - s.a}°`, Q2)}`;
    let tri = "";
    if (c > 0) {
      const [bx, by, base] = [195, 170, 125];
      const t1 = Math.tan(rad(s.p));
      const t2 = Math.tan(rad(q));
      const ax = (base * t2) / (t1 + t2);
      const ay = Math.min(ax * t1, 150);
      const apex = [bx + ax, by - ay];
      tri = `<polygon points="${bx},${by} ${bx + base},${by} ${apex[0].toFixed(1)},${apex[1].toFixed(1)}" fill="${Q3}" fill-opacity=".15" stroke="var(--ink-2)" stroke-width="2.5"/>
        ${text(bx + 30, by - 8, `${s.p}°`, 'font-size="12"')}${text(bx + base - 30, by - 8, `${q}°`, 'font-size="12"')}${text(apex[0], apex[1] + 30, `${c}°`, `font-size="12" fill="${Q3}"`)}`;
    }
    const pic = svg(
      330,
      186,
      T(
        L(
          `Crossing lines with angles ${s.a}°, ${180 - s.a}°, ${s.a}°, ${180 - s.a}°; triangle with angles ${s.p}°, ${q}° and ${c > 0 ? `${c}°` : "no third angle"}.`,
          `Rectas que se cruzan con ángulos ${s.a}°, ${180 - s.a}°, ${s.a}°, ${180 - s.a}°; triángulo con ángulos ${s.p}°, ${q}° y ${c > 0 ? `${c}°` : "sin tercer ángulo"}.`,
        ),
      ),
      `${crossing}${tri}`,
    );
    const lines = T(
      L(
        `Straight line: ${s.a}° + ${180 - s.a}° = 180°. Vertical angles are equal: ${s.a}° and ${s.a}°.`,
        `Recta: ${s.a}° + ${180 - s.a}° = 180°. Los ángulos opuestos por el vértice son iguales: ${s.a}° y ${s.a}°.`,
      ),
    );
    const triangle =
      c > 0
        ? T(
            L(
              ` Triangle: ${s.p}° + ${q}° + ${c}° = 180°.`,
              ` Triángulo: ${s.p}° + ${q}° + ${c}° = 180°.`,
            ),
          )
        : T(
            L(
              ` Triangle: ${s.p}° + ${q}° = ${s.p + q}° leaves nothing for a third angle, because a triangle's angles add to exactly 180°. Make A + B less than 180°.`,
              ` Triángulo: ${s.p}° + ${q}° = ${s.p + q}° no deja nada para un tercer ángulo, porque los ángulos de un triángulo suman exactamente 180°. Haz que A + B sea menor que 180°.`,
            ),
          );
    return { svg: pic, eq: lines + triangle };
  },
});

// Cylinder, cone and sphere side by side with one radius and height: cone = ⅓ cylinder, and when h = 2r the
// sphere = ⅔ of the cylinder. All three are drawn at the same scale.
export const roundVolumeModel = livingModel({
  label: L("Change the solids", "Cambia los cuerpos"),
  sliders: [
    {
      id: "r",
      label: L("Radius (cm)", "Radio (cm)"),
      min: 1,
      max: 5,
      step: 1,
      value: 3,
    },
    {
      id: "h",
      label: L(
        "Height of cylinder and cone (cm)",
        "Altura del cilindro y del cono (cm)",
      ),
      min: 1,
      max: 10,
      step: 1,
      value: 6,
    },
  ],
  render(s, T) {
    const cyl = r2(PI * s.r * s.r * s.h);
    const cone = r2((PI * s.r * s.r * s.h) / 3);
    const sph = r2((4 / 3) * PI * s.r ** 3);
    const u = Math.min(14, 98 / (2 * s.r), 140 / Math.max(s.h, 2 * s.r));
    const R = s.r * u;
    const H = s.h * u;
    const base = 30 + Math.max(H, 2 * R) + R / 4;
    const ell = (cx, cy, dash = "") =>
      `<ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${R / 4}" fill="none" stroke="var(--ink-2)" stroke-width="1.5" ${dash}/>`;
    const pic = svg(
      330,
      base + 40,
      T(
        L(
          `Cylinder and cone with radius ${s.r} cm and height ${s.h} cm, and a sphere with radius ${s.r} cm, drawn to the same scale.`,
          `Cilindro y cono de radio ${s.r} cm y altura ${s.h} cm, y una esfera de radio ${s.r} cm, a la misma escala.`,
        ),
      ),
      `<rect x="${55 - R}" y="${base - H}" width="${2 * R}" height="${H}" fill="${Q1}" fill-opacity=".22"/><line x1="${55 - R}" y1="${base - H}" x2="${55 - R}" y2="${base}" stroke="var(--ink-2)" stroke-width="1.5"/><line x1="${55 + R}" y1="${base - H}" x2="${55 + R}" y2="${base}" stroke="var(--ink-2)" stroke-width="1.5"/>${ell(55, base - H)}${ell(55, base)}
       <polygon points="${165 - R},${base} ${165 + R},${base} 165,${base - H}" fill="${Q2}" fill-opacity=".22" stroke="var(--ink-2)" stroke-width="1.5"/>${ell(165, base)}
       <circle cx="275" cy="${base - R}" r="${R}" fill="${Q3}" fill-opacity=".22" stroke="var(--ink-2)" stroke-width="1.5"/>${ell(275, base - R, 'stroke-dasharray="4 3"')}
       ${text(55, base + 30, T(L("cylinder", "cilindro")), 'font-size="12"')}${text(165, base + 30, T(L("cone", "cono")), 'font-size="12"')}${text(275, base + 30, T(L("sphere", "esfera")), 'font-size="12"')}`,
    );
    const tab = table(T(L("Volumes (π ≈ 3.14)", "Volúmenes (π ≈ 3,14)")), [
      [T(L("Solid", "Cuerpo")), T(L("Volume", "Volumen")), "cm³"],
      [T(L("Cylinder", "Cilindro")), `π × ${s.r}² × ${s.h}`, String(cyl)],
      [T(L("Cone", "Cono")), `⅓ × π × ${s.r}² × ${s.h}`, String(cone)],
      [T(L("Sphere", "Esfera")), `4/3 × π × ${s.r}³`, String(sph)],
    ]);
    const note =
      s.h === 2 * s.r
        ? T(
            L(
              ` With h = 2r, the sphere is [[2/3]] of the cylinder: [[2/3]] × ${cyl} = ${sph} cm³.`,
              ` Con h = 2r, la esfera es [[2/3]] del cilindro: [[2/3]] × ${cyl} = ${sph} cm³.`,
            ),
          )
        : T(
            L(
              " Set the height to twice the radius to compare the sphere with the cylinder.",
              " Pon la altura en el doble del radio para comparar la esfera con el cilindro.",
            ),
          );
    return {
      svg: pic,
      table: tab,
      eq:
        T(
          L(
            `The cone holds [[1/3]] of the cylinder: ${cyl} ÷ 3 = ${cone} cm³.`,
            `El cono contiene [[1/3]] del cilindro: ${cyl} ÷ 3 = ${cone} cm³.`,
          ),
        ) + note,
    };
  },
});

// Transformations of a point on a coordinate grid: translation, 90° or 180° rotation about the origin, or a
// dilation by 2. The slide controls appear only for a translation, where they mean something.
export const transformModel = livingModel({
  label: L("Choose a transformation", "Elige una transformación"),
  toggles: [
    {
      id: "kind",
      label: L("Transformation", "Transformación"),
      value: "translate",
      options: [
        { value: "translate", label: L("Translate", "Trasladar") },
        { value: "rot90", label: L("Rotate 90° ↺", "Rotar 90° ↺") },
        { value: "rot180", label: L("Rotate 180°", "Rotar 180°") },
        { value: "dilate", label: L("Dilate × 2", "Dilatar × 2") },
      ],
    },
  ],
  sliders: [
    {
      id: "x",
      label: L("Point x", "Punto x"),
      min: -4,
      max: 4,
      step: 1,
      value: 3,
      show: (v) => fmt(v),
    },
    {
      id: "y",
      label: L("Point y", "Punto y"),
      min: -4,
      max: 4,
      step: 1,
      value: 2,
      show: (v) => fmt(v),
    },
    {
      id: "a",
      label: L(
        "Slide right (+) or left (−)",
        "Deslizar a la derecha (+) o izquierda (−)",
      ),
      min: -4,
      max: 4,
      step: 1,
      value: -2,
      show: (v) => fmt(v),
      when: (s) => s.kind === "translate",
    },
    {
      id: "b",
      label: L(
        "Slide up (+) or down (−)",
        "Deslizar hacia arriba (+) o abajo (−)",
      ),
      min: -4,
      max: 4,
      step: 1,
      value: 1,
      show: (v) => fmt(v),
      when: (s) => s.kind === "translate",
    },
  ],
  render(s, T) {
    const img = {
      translate: [s.x + s.a, s.y + s.b],
      rot90: [-s.y, s.x],
      rot180: [-s.x, -s.y],
      dilate: [2 * s.x, 2 * s.y],
    }[s.kind];
    const sign = (n) => (n < 0 ? "−" : "+");
    const rule = {
      translate: `(x, y) → (x ${sign(s.a)} ${Math.abs(s.a)}, y ${sign(s.b)} ${Math.abs(s.b)})`,
      rot90: "(x, y) → (−y, x)",
      rot180: "(x, y) → (−x, −y)",
      dilate: "(x, y) → (2x, 2y)",
    }[s.kind];
    const u = 19;
    const P = (x, y) => [165 + x * u, 165 - y * u];
    const grid = [];
    for (let i = -8; i <= 8; i += 1) {
      const [gx] = P(i, 0);
      const [, gy] = P(0, i);
      const axis = i === 0;
      grid.push(
        `<line x1="${gx}" y1="${P(0, 8)[1]}" x2="${gx}" y2="${P(0, -8)[1]}" stroke="${axis ? "var(--ink-2)" : "var(--line-2)"}" stroke-width="${axis ? 2 : 1}"/>`,
      );
      grid.push(
        `<line x1="${P(-8, 0)[0]}" y1="${gy}" x2="${P(8, 0)[0]}" y2="${gy}" stroke="${axis ? "var(--ink-2)" : "var(--line-2)"}" stroke-width="${axis ? 2 : 1}"/>`,
      );
      if (i % 4 === 0 && i !== 0)
        grid.push(
          text(
            gx,
            P(0, 0)[1] + 20,
            fmt(i),
            'font-size="12" fill="var(--ink-2)"',
          ),
          text(
            P(0, 0)[0] - 6,
            gy + 5,
            fmt(i),
            'font-size="12" fill="var(--ink-2)" text-anchor="end"',
          ),
        );
    }
    const [px, py] = P(s.x, s.y);
    const [ix, iy] = P(img[0], img[1]);
    // A point's label sits beside it, flipped inward near the right and top edges so it is never clipped.
    const lbl = (x, y, t, color) => text(x > 230 ? x - 12 : x + 12, y < 30 ? y + 26 : y - 10, t, `fill="${color}" text-anchor="${x > 230 ? "end" : "start"}"`);
    const path =
      s.kind === "rot90" || s.kind === "rot180"
        ? `<path d="M${px} ${py} A${Math.hypot(px - 165, py - 165).toFixed(1)} ${Math.hypot(px - 165, py - 165).toFixed(1)} 0 0 0 ${ix} ${iy}" fill="none" stroke="${Q3}" stroke-width="2" stroke-dasharray="5 4"/>`
        : `<line x1="${px}" y1="${py}" x2="${ix}" y2="${iy}" stroke="${Q3}" stroke-width="2" stroke-dasharray="5 4"/>`;
    const pic = svg(
      330,
      330,
      T(
        L(
          `Point (${s.x}, ${s.y}) and its image (${img[0]}, ${img[1]}).`,
          `Punto (${s.x}, ${s.y}) y su imagen (${img[0]}, ${img[1]}).`,
        ),
      ),
      `${grid.join("")}${path}
       <circle cx="${px}" cy="${py}" r="7" fill="${Q1}"/><circle cx="${ix}" cy="${iy}" r="7" fill="${Q2}"/>
       ${lbl(px, py, `(${fmt(s.x)}, ${fmt(s.y)})`, Q1)}${lbl(ix, iy, `(${fmt(img[0])}, ${fmt(img[1])})`, Q2)}`,
    );
    return {
      svg: pic,
      eq: `${rule}: (${fmt(s.x)}, ${fmt(s.y)}) → (${fmt(img[0])}, ${fmt(img[1])})`,
    };
  },
});
