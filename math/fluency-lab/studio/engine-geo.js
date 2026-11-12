// Geometry, signs and factors: area of a circle as r × r, the Pythagorean theorem as squares on the sides, angle
// relationships, reflections and quadrants on a coordinate plane, multiplying and dividing integers by pattern,
// and factors and multiples. Every figure is drawn from the question's own numbers and recomputed by the tests.
import { COLORS, L, choiceBuild, clean, frameOf, num, predictOf, svgWrap, txt } from "./core.js";

const A = (en, es) => L(en, es);
const sg = (n) => (n < 0 ? `−${-n}` : String(n));
const T = (x, y, t, size = 20, fill = COLORS.ink, anchor = "middle") => txt(x, y, t, { size, fill, anchor });
const strip = (svg) => svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, "");

export function parse(question) {
  const raw = String(question).replaceAll("−", "-").trim();
  const q = clean(question);
  let net = raw.match(/^Use the net of a rectangular prism that is (\d+) in long, (\d+) in wide and (\d+) in tall\. What is the surface area\?$/);
  if (net) {
    const [l, w, h] = net.slice(1).map(Number);
    return l > 0 && w > 0 && h > 0 ? { engine: "geo", mode: "surfaceNet", solid: "rectangular-prism", l, w, h, unit: "in", areaUnit: "square inches", areaUnitEs: "pulgadas cuadradas", faces: [l*w, l*w, l*h, l*h, w*h, w*h], result: 2 * (l*w + l*h + w*h) } : null;
  }
  net = raw.match(/^The net of a square pyramid has a square base with side (\d+) cm and four triangles, each with base (\d+) cm and height (\d+) cm\. What is the surface area\?$/);
  if (net) {
    const [side, base, triangleHeight] = net.slice(1).map(Number);
    if (side !== base || side <= 0 || triangleHeight <= 0) return null;
    return { engine: "geo", mode: "surfaceNet", solid: "square-pyramid", side, triangleHeight, unit: "cm", areaUnit: "square centimeters", areaUnitEs: "centímetros cuadrados", faces: [side*side, ...Array(4).fill(side*triangleHeight/2)], result: side*side + 2*side*triangleHeight };
  }
  let m = q.match(/^A circle has radius (\d+)\. What number multiplies π to give its area\?$/);
  if (m) {
    const r = Number(m[1]);
    return r >= 1 && r <= 20 ? { engine: "geo", mode: "circle", r, result: r * r } : null;
  }
  m = q.match(/^A right triangle has legs (\d+) and (\d+)\. Find the hypotenuse\.$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    const c = Math.sqrt(a * a + b * b);
    return Number.isInteger(c) && c <= 60 ? { engine: "geo", mode: "pyth", a, b, c, a2: a * a, b2: b * b, c2: c * c, result: c } : null;
  }
  m = q.match(/^One of two vertical angles measures (\d+)°\. What is the measure of the other angle\?$/);
  if (m) return { engine: "geo", mode: "angle", kind: "vertical", given: Number(m[1]), total: null, result: Number(m[1]) };
  m = q.match(/^Two (complementary|supplementary) angles include one angle that measures (\d+)°\. What is the other angle\?$/);
  if (m) {
    const total = m[1] === "complementary" ? 90 : 180;
    const given = Number(m[2]);
    return given < total ? { engine: "geo", mode: "angle", kind: m[1], given, total, result: total - given } : null;
  }
  m = raw.match(/^Reflect \((-?\d+), (-?\d+)\) across the (x|y)-axis\.$/);
  if (m) {
    const [x, y] = [Number(m[1]), Number(m[2])];
    const [rx, ry] = m[3] === "y" ? [-x, y] : [x, -y];
    return { engine: "geo", mode: "reflect", x, y, axis: m[3], rx, ry, result: `(${rx}, ${ry})` };
  }
  m = raw.match(/^Which quadrant contains \((-?\d+), (-?\d+)\)\?$/);
  if (m) {
    const [x, y] = [Number(m[1]), Number(m[2])];
    return x !== 0 && y !== 0 ? { engine: "geo", mode: "quad", x, y, result: quadrant(x, y) } : null;
  }
  m = raw.match(/^(-?\d+) (×|÷) \(?(-?\d+)\)? = \?$/);
  if (m) {
    const [a, op, b] = [Number(m[1]), m[2], Number(m[3])];
    if (a === 0 || b === 0 || (a > 0 && b > 0)) return null;
    if (op === "÷" && a % b !== 0) return null;
    const result = op === "×" ? a * b : a / b;
    return { engine: "geo", mode: "signs", a, op, b, result };
  }
  m = q.match(/^How many factors does (\d+) have\?$/);
  if (m) {
    const n = Number(m[1]);
    const all = Array.from({ length: n }, (_, i) => i + 1).filter((f) => n % f === 0);
    return n >= 2 && n <= 150 ? { engine: "geo", mode: "fcount", n, all, pairs: all.filter((f) => f * f <= n).map((f) => [f, n / f]), result: all.length } : null;
  }
  m = q.match(/^Is (\d+) a multiple of (\d+)\?$/);
  if (m) {
    const [n, d] = [Number(m[1]), Number(m[2])];
    if (d < 2 || n > 400) return null;
    const list = [];
    for (let v = d; v <= Math.max(n, d) + d; v += d) list.push(v);
    return { engine: "geo", mode: "fmult", n, d, list, result: n % d === 0 ? "yes" : "no" };
  }
  m = q.match(/^What is the (\d+)(?:st|nd|rd|th) multiple of (\d+)\?$/);
  if (m) {
    const [k, d] = [Number(m[1]), Number(m[2])];
    return k >= 1 && k <= 12 && d >= 1 ? { engine: "geo", mode: "fkth", k, d, list: Array.from({ length: k }, (_, i) => d * (i + 1)), result: d * k } : null;
  }
  return null;
}
const quadrant = (x, y) => (x > 0 ? (y > 0 ? "I" : "IV") : y > 0 ? "II" : "III");

// ----- pictures -----
const plane = (pts = [], axis = null, extra = "") => {
  const size = 200;
  const [cx, cy] = [280, 120];
  const k = size / 2 / Math.max(10, ...pts.flatMap((p) => [Math.abs(p[0]), Math.abs(p[1])]));
  const X = (v) => cx + v * k;
  const Y = (v) => cy - v * k;
  let out = `<line x1="${cx - size / 2 - 10}" x2="${cx + size / 2 + 10}" y1="${cy}" y2="${cy}" stroke="${axis === "x" ? COLORS.warn : COLORS.ink}" stroke-width="${axis === "x" ? 5 : 2.5}"/><line y1="${cy - size / 2 - 10}" y2="${cy + size / 2 + 10}" x1="${cx}" x2="${cx}" stroke="${axis === "y" ? COLORS.warn : COLORS.ink}" stroke-width="${axis === "y" ? 5 : 2.5}"/>`;
  out += T(cx + size / 2 + 4, cy + 18, "x", 16, COLORS.mute, "end") + T(cx + 12, cy - size / 2 - 2, "y", 16, COLORS.mute, "start");
  pts.forEach(([x, y, color, label]) => (out += `<circle cx="${X(x)}" cy="${Y(y)}" r="8" fill="${color}" stroke="#fff" stroke-width="2"/>` + T(X(x) + 12, Y(y) - 10, label, 14, color, "start")));
  return out + extra;
};
const angleBody = (s, show) => {
  const [cx, cy] = [280, 150];
  const rad = (d) => (d * Math.PI) / 180;
  const arc = (r, a0, a1, color, label) => `<path d="M${cx + r * Math.cos(rad(a0))},${cy - r * Math.sin(rad(a0))} A${r},${r} 0 0 0 ${cx + r * Math.cos(rad(a1))},${cy - r * Math.sin(rad(a1))}" fill="none" stroke="${color}" stroke-width="7"/>` + T(cx + (r + 26) * Math.cos(rad((a0 + a1) / 2)), cy - (r + 26) * Math.sin(rad((a0 + a1) / 2)) + 5, label, 18, color);
  const g = s.given;
  if (s.kind === "vertical") {
    const a = Math.min(g, 180 - g) || g;
    let out = `<line x1="${cx - 150}" x2="${cx + 150}" y1="${cy}" y2="${cy}" stroke="${COLORS.ink}" stroke-width="4"/><line x1="${cx - 120 * Math.cos(rad(a))}" y1="${cy + 120 * Math.sin(rad(a))}" x2="${cx + 120 * Math.cos(rad(a))}" y2="${cy - 120 * Math.sin(rad(a))}" stroke="${COLORS.ink}" stroke-width="4"/>`;
    out += arc(36, 0, a, COLORS.whole, `${g}°`);
    if (show) out += arc(36, 180, 180 + a, COLORS.part, "?");
    return out;
  }
  const out = s.total === 180 ? `<line x1="${cx - 150}" x2="${cx + 150}" y1="${cy}" y2="${cy}" stroke="${COLORS.ink}" stroke-width="4"/><line x1="${cx}" y1="${cy}" x2="${cx + 110 * Math.cos(rad(g))}" y2="${cy - 110 * Math.sin(rad(g))}" stroke="${COLORS.ink}" stroke-width="4"/>` : `<line x1="${cx}" y1="${cy}" x2="${cx + 150}" y2="${cy}" stroke="${COLORS.ink}" stroke-width="4"/><line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 130}" stroke="${COLORS.ink}" stroke-width="4"/><line x1="${cx}" y1="${cy}" x2="${cx + 110 * Math.cos(rad(90 - g))}" y2="${cy - 110 * Math.sin(rad(90 - g))}" stroke="${COLORS.ink}" stroke-width="4"/><path d="M${cx + 20},${cy} v-20 h-20" fill="none" stroke="${COLORS.mute}" stroke-width="2"/>`;
  return s.total === 180 ? out + arc(34, 0, g, COLORS.whole, `${g}°`) + (show ? arc(34, g, 180, COLORS.part, "?") : "") : out + arc(34, 0, 90 - g, COLORS.whole, `${g}°`).replace(/stroke-width="7"/, 'stroke-width="7" opacity="0"') + arc(60, 90 - g, 90, COLORS.whole, `${g}°`) + (show ? arc(34, 0, 90 - g, COLORS.part, "?") : "");
};

export function frames(s) {
  const ctx = (id, cap, easy, eq, body, alt, meta, h = 240) => frameOf({ id, cap, easy, eq, body, alt, meta, h });
  if (s.mode === "surfaceNet") {
    const labels = s.solid === "rectangular-prism"
      ? [`${s.l}×${s.w}`, `${s.l}×${s.w}`, `${s.l}×${s.h}`, `${s.l}×${s.h}`, `${s.w}×${s.h}`, `${s.w}×${s.h}`]
      : [`${s.side}×${s.side}`, ...Array(4).fill(`${s.side}×${s.triangleHeight}÷2`)];
    const areas = s.faces;
    const colors = [COLORS.whole, COLORS.whole, COLORS.part, COLORS.part, COLORS.hundreds, COLORS.hundreds];
    const faceRects = labels.map((label, i) => {
      const x = 30 + (i % 3) * 180, y = 28 + Math.floor(i / 3) * 82;
      return `<rect x="${x}" y="${y}" width="150" height="58" rx="8" fill="${colors[i]}" fill-opacity=".2" stroke="${colors[i]}" stroke-width="3"/>` + T(x+75,y+25,label,17) + T(x+75,y+47,`${areas[i]} ${s.unit}²`,14,COLORS.mute);
    }).join("");
    const alt = A(`A ${s.solid === "rectangular-prism" ? `${s.l} by ${s.w} by ${s.h} inch rectangular prism` : `square pyramid with base side ${s.side} centimeters and triangle height ${s.triangleHeight} centimeters`}, shown as its ${areas.length}-face net.`, `Una red de ${areas.length} caras de ${s.solid === "rectangular-prism" ? `un prisma rectangular de ${s.l} por ${s.w} por ${s.h} pulgadas` : `una pirámide cuadrada con lado ${s.side} cm y altura triangular ${s.triangleHeight} cm`}.`);
    const formula = s.solid === "rectangular-prism" ? `2(${s.l}×${s.w} + ${s.l}×${s.h} + ${s.w}×${s.h})` : `${s.side}×${s.side} + 4(${s.side}×${s.triangleHeight}÷2)`;
    return [
      ctx("net-faces", A("A net lays every outside face flat. Fold it and notice which faces match; each face contributes once.", "Una red muestra planas todas las caras exteriores. Dóblala y observa cuáles coinciden; cada cara se cuenta una vez."), A("Find the area of each face.", "Halla el área de cada cara."), "six faces", `<g>${faceRects}</g>`, alt, { faces: areas }, 220),
      ctx("net-pairs", (s.solid === "rectangular-prism" ? A("Opposite faces match in three pairs. Find each pair's area and count both faces.", "Las caras opuestas coinciden en tres pares. Halla el área de cada par y cuenta las dos caras.") : A("The net has one square base and four matching triangles. Use one-half × base × triangle height for each triangle.", "La red tiene una base cuadrada y cuatro triángulos iguales. Usa un medio × base × altura del triángulo para cada triángulo.")), A("Pair matching faces and use square units.", "Agrupa las caras iguales y usa unidades cuadradas."), formula, `<g>${faceRects}</g>`, alt, { faces: areas, formula }, 220),
      ctx("net-total", A(`Add all ${areas.length} face areas: ${areas.join(" + ")} = ${s.result} ${s.areaUnit}.`, `Suma las áreas de las ${areas.length} caras: ${areas.join(" + ")} = ${s.result} ${s.areaUnitEs}.`), A(`${s.result} ${s.areaUnit}.`, `${s.result} ${s.areaUnitEs}.`), `${formula} = ${s.result} ${s.unit}²`, `<g>${faceRects}</g>`, alt, { faces: areas, total: s.result, unit: s.unit }, 220),
    ];
  }
  if (s.mode === "circle") {
    const k = Math.min(10, 150 / Math.max(s.r, 1));
    const alt = A(`A circle of radius ${s.r}, and a square ${s.r} by ${s.r}.`, `Un círculo de radio ${s.r} y un cuadrado de ${s.r} por ${s.r}.`);
    const body = (sq) => `<circle cx="150" cy="130" r="${s.r * k}" fill="${COLORS.whole}" fill-opacity=".25" stroke="${COLORS.ink}" stroke-width="3"/><line x1="150" y1="130" x2="${150 + s.r * k}" y2="130" stroke="${COLORS.warn}" stroke-width="4"/>${T(150 + (s.r * k) / 2, 122, `r = ${s.r}`, 16, COLORS.warn)}` + (sq ? `<rect x="330" y="${130 - s.r * k}" width="${s.r * k}" height="${s.r * k}" fill="${COLORS.part}" fill-opacity=".6" stroke="${COLORS.ink}" stroke-width="3"/>${T(330 + (s.r * k) / 2, 135, `${s.r} × ${s.r}`, 18)}` : "");
    return [
      ctx("circle", A(`The radius is ${s.r}. The area of a circle is π times the radius times the radius.`, `El radio es ${s.r}. El área de un círculo es π por el radio por el radio.`), A("Area = π × r × r.", "Área = π × r × r."), `A = π × ${s.r} × ${s.r}`, body(false), alt, { r: s.r }),
      ctx("square", A(`The part that multiplies π is a square with sides equal to the radius: ${s.r} × ${s.r} = ${s.result}.`, `La parte que multiplica a π es un cuadrado con lados iguales al radio: ${s.r} × ${s.r} = ${s.result}.`), A(`${s.r} × ${s.r} = ${s.result}.`, `${s.r} × ${s.r} = ${s.result}.`), `${s.r} × ${s.r} = ${s.result}`, body(true), alt, { r: s.r, square: s.r * s.r }),
      ctx("area", A(`So the area is ${s.result}π. The number that multiplies π is ${s.result}.`, `Así el área es ${s.result}π. El número que multiplica a π es ${s.result}.`), A(`${s.result}π.`, `${s.result}π.`), `A = ${s.result}π`, body(true), alt, { r: s.r, square: s.r * s.r, result: s.result }),
    ];
  }
  if (s.mode === "pyth") {
    const sc = Math.min(8, 130 / Math.max(s.a, s.b));
    const [bx, by] = [150, 200];
    const alt = A(`A right triangle with legs ${s.a} and ${s.b}.`, `Un triángulo rectángulo con catetos ${s.a} y ${s.b}.`);
    const tri = `<polygon points="${bx},${by} ${bx + s.b * sc},${by} ${bx},${by - s.a * sc}" fill="${COLORS.whole}" fill-opacity=".2" stroke="${COLORS.ink}" stroke-width="3"/>${T(bx + (s.b * sc) / 2, by + 20, String(s.b), 18)}${T(bx - 14, by - (s.a * sc) / 2, String(s.a), 18, COLORS.ink, "end")}`;
    const body = (n) => tri + (n >= 1 ? T(420, 110, `${s.a}² = ${s.a2}`, 22, COLORS.whole) + T(420, 146, `${s.b}² = ${s.b2}`, 22, COLORS.whole) : "") + (n >= 2 ? T(420, 190, `${s.a2} + ${s.b2} = ${s.c2}`, 22, COLORS.part) : "") + (n >= 3 ? T(420, 226, `√${s.c2} = ${s.c}`, 26, COLORS.part) : "");
    return [
      ctx("legs", A(`Square each leg. The long side, the hypotenuse c, follows a² + b² = c².`, `Eleva al cuadrado cada cateto. El lado largo, la hipotenusa c, cumple a² + b² = c².`), A("a² + b² = c².", "a² + b² = c²."), `a² + b² = c²`, body(0), alt, { a: s.a, b: s.b }, 250),
      ctx("squares", A(`${s.a}² = ${s.a2} and ${s.b}² = ${s.b2}.`, `${s.a}² = ${s.a2} y ${s.b}² = ${s.b2}.`), A(`${s.a2} and ${s.b2}.`, `${s.a2} y ${s.b2}.`), `${s.a}² + ${s.b}²`, body(1), alt, { a2: s.a2, b2: s.b2 }, 250),
      ctx("sum", A(`Add them: ${s.a2} + ${s.b2} = ${s.c2}. That is c².`, `Súmalos: ${s.a2} + ${s.b2} = ${s.c2}. Eso es c².`), A(`c² = ${s.c2}.`, `c² = ${s.c2}.`), `c² = ${s.c2}`, body(2), alt, { a2: s.a2, b2: s.b2, c2: s.c2 }, 250),
      ctx("root", A(`c is the number that multiplies itself to make ${s.c2}: c = ${s.c}.`, `c es el número que se multiplica por sí mismo para dar ${s.c2}: c = ${s.c}.`), A(`c = ${s.c}.`, `c = ${s.c}.`), `c = ${s.c}`, body(3), alt, { a2: s.a2, b2: s.b2, c2: s.c2, c: s.c }, 250),
    ];
  }
  if (s.mode === "angle") {
    const rule = s.kind === "vertical" ? A("Vertical angles are across from each other, and they are equal.", "Los ángulos opuestos por el vértice están uno frente al otro y son iguales.") : s.kind === "complementary" ? A("Complementary angles add up to 90°.", "Los ángulos complementarios suman 90°.") : A("Supplementary angles add up to 180°.", "Los ángulos suplementarios suman 180°.");
    const alt = A(`Two angles, one measuring ${s.given} degrees.`, `Dos ángulos, uno de ${s.given} grados.`);
    return [
      ctx("given", A(`One angle is ${s.given}°. We want the other one.`, `Un ángulo mide ${s.given}°. Queremos el otro.`), A(`One angle: ${s.given}°.`, `Un ángulo: ${s.given}°.`), `∠1 = ${s.given}°, ∠2 = ?`, angleBody(s, false), alt, { given: s.given, kind: s.kind }, 250),
      ctx("rule", rule, A(s.kind === "vertical" ? "They are equal." : `They add to ${s.total}°.`, s.kind === "vertical" ? "Son iguales." : `Suman ${s.total}°.`), s.kind === "vertical" ? "∠2 = ∠1" : `${s.given}° + ? = ${s.total}°`, angleBody(s, false), alt, { given: s.given, kind: s.kind, total: s.total }, 250),
      ctx("answer", s.kind === "vertical" ? A(`The other angle is also ${s.result}°.`, `El otro ángulo también mide ${s.result}°.`) : A(`${s.total}° − ${s.given}° = ${s.result}°.`, `${s.total}° − ${s.given}° = ${s.result}°.`), A(`${s.result}°.`, `${s.result}°.`), s.kind === "vertical" ? `? = ${s.result}°` : `${s.total} − ${s.given} = ${s.result}`, angleBody(s, true), alt, { given: s.given, kind: s.kind, total: s.total, result: s.result }, 250),
    ];
  }
  if (s.mode === "reflect") {
    const alt = A(`The point (${s.x}, ${s.y}) on a coordinate plane.`, `El punto (${s.x}, ${s.y}) en un plano cartesiano.`);
    const orig = [s.x, s.y, COLORS.whole, `(${sg(s.x)}, ${sg(s.y)})`];
    const img = [s.rx, s.ry, COLORS.part, `(${sg(s.rx)}, ${sg(s.ry)})`];
    return [
      ctx("point", A(`Plot (${sg(s.x)}, ${sg(s.y)}) and the ${s.axis}-axis, the mirror line.`, `Marca (${sg(s.x)}, ${sg(s.y)}) y el eje ${s.axis}, la línea espejo.`), A(`Mirror: the ${s.axis}-axis.`, `Espejo: el eje ${s.axis}.`), `reflect (${sg(s.x)}, ${sg(s.y)})`, plane([orig], s.axis), alt, { x: s.x, y: s.y, axis: s.axis }, 250),
      ctx("rule", s.axis === "y" ? A("Across the y-axis, left and right swap: x changes sign, y stays.", "Sobre el eje y se intercambian izquierda y derecha: x cambia de signo y y se queda igual.") : A("Across the x-axis, up and down swap: y changes sign, x stays.", "Sobre el eje x se intercambian arriba y abajo: y cambia de signo y x se queda igual."), A(s.axis === "y" ? "x changes sign." : "y changes sign.", s.axis === "y" ? "x cambia de signo." : "y cambia de signo."), s.axis === "y" ? "(x, y) → (−x, y)" : "(x, y) → (x, −y)", plane([orig], s.axis), alt, { axis: s.axis }, 250),
      ctx("image", A(`The reflection is (${sg(s.rx)}, ${sg(s.ry)}), the same distance from the ${s.axis}-axis on the other side.`, `El reflejo es (${sg(s.rx)}, ${sg(s.ry)}), a la misma distancia del eje ${s.axis} del otro lado.`), A(`(${sg(s.rx)}, ${sg(s.ry)}).`, `(${sg(s.rx)}, ${sg(s.ry)}).`), `(${sg(s.x)}, ${sg(s.y)}) → (${sg(s.rx)}, ${sg(s.ry)})`, plane([orig, img], s.axis), alt, { x: s.x, y: s.y, rx: s.rx, ry: s.ry, axis: s.axis }, 250),
    ];
  }
  if (s.mode === "quad") {
    const alt = A(`The point (${s.x}, ${s.y}) on a coordinate plane.`, `El punto (${s.x}, ${s.y}) en un plano cartesiano.`);
    const labels = (hi) => ["I", "II", "III", "IV"].map((q, i) => T([380, 180, 180, 380][i], [60, 60, 190, 190][i], q, 24, q === hi ? COLORS.part : COLORS.mute)).join("");
    return [
      ctx("plane", A(`The axes split the plane into four quadrants, numbered counterclockwise from the top right.`, `Los ejes dividen el plano en cuatro cuadrantes, numerados en sentido contrario a las agujas del reloj desde arriba a la derecha.`), A("Four quadrants.", "Cuatro cuadrantes."), `(${sg(s.x)}, ${sg(s.y)})`, plane([]) + labels(null), alt, { x: s.x, y: s.y }, 260),
      ctx("signs", A(`x = ${sg(s.x)} is ${s.x > 0 ? "right" : "left"} of the y-axis. y = ${sg(s.y)} is ${s.y > 0 ? "above" : "below"} the x-axis.`, `x = ${sg(s.x)} está a la ${s.x > 0 ? "derecha" : "izquierda"} del eje y. y = ${sg(s.y)} está ${s.y > 0 ? "arriba" : "abajo"} del eje x.`), A(`${s.x > 0 ? "Right" : "Left"}, ${s.y > 0 ? "up" : "down"}.`, `${s.x > 0 ? "Derecha" : "Izquierda"}, ${s.y > 0 ? "arriba" : "abajo"}.`), `(${s.x > 0 ? "+" : "−"}, ${s.y > 0 ? "+" : "−"})`, plane([[s.x, s.y, COLORS.whole, `(${sg(s.x)}, ${sg(s.y)})`]]) + labels(null), alt, { x: s.x, y: s.y }, 260),
      ctx("quadrant", A(`That is quadrant ${s.result}.`, `Eso es el cuadrante ${s.result}.`), A(`Quadrant ${s.result}.`, `Cuadrante ${s.result}.`), `quadrant ${s.result}`, plane([[s.x, s.y, COLORS.whole, `(${sg(s.x)}, ${sg(s.y)})`]]) + labels(s.result), alt, { x: s.x, y: s.y, result: s.result }, 260),
    ];
  }
  if (s.mode === "signs") {
    const rows = s.op === "×" ? [3, 2, 1, 0, -1, -2].map((v) => [`${sg(s.a)} × ${sg(v)}`, s.a * v]) : [];
    const alt = A(`${sg(s.a)} ${s.op} ${sg(s.b)}.`, `${sg(s.a)} ${s.op} ${sg(s.b)}.`);
    if (s.op === "×") {
      const body = (n) => rows.slice(0, n).map(([e, v], i) => T(280, 40 + i * 34, `${e} = ${sg(v)}`, 22, i === n - 1 ? COLORS.part : COLORS.ink)).join("");
      const upTo = Math.max(1, rows.findIndex(([, v]) => v === s.result) + 1 || 6);
      const start = [3, 2, 1, 0, -1, -2].indexOf(s.b);
      const use = [3, 2, 1, 0, -1, -2].slice(0, Math.max(start + 1, 4));
      const rowsU = use.map((v) => [`${sg(s.a)} × ${sg(v)}`, s.a * v]);
      const draw = (n) => rowsU.slice(0, n).map(([e, v], i) => T(280, 36 + i * 34, `${e} = ${sg(v)}`, 22, i === n - 1 ? COLORS.part : COLORS.ink)).join("");
      void body;
      void upTo;
      return [
        ctx("start", A(`Look at a pattern to see what ${sg(s.a)} × ${sg(s.b)} must be.`, `Mira un patrón para ver cuánto debe ser ${sg(s.a)} × ${sg(s.b)}.`), A("Follow the pattern.", "Sigue el patrón."), `${sg(s.a)} × ${sg(s.b)}`, draw(1), alt, { a: s.a, rows: 1 }, 40 + rowsU.length * 34 + 30),
        ctx("pattern", A(`As the second number goes down by 1, the answer changes by ${sg(-s.a)} each time.`, `Cada vez que el segundo número baja 1, la respuesta cambia ${sg(-s.a)}.`), A(`Each row changes by ${sg(-s.a)}.`, `Cada fila cambia ${sg(-s.a)}.`), `step ${sg(-s.a)}`, draw(rowsU.length), alt, { a: s.a, step: -s.a, rows: rowsU.length, last: rowsU.at(-1)[1] }, 40 + rowsU.length * 34 + 30),
        ctx("answer", A(`So ${sg(s.a)} × ${sg(s.b)} = ${sg(s.result)}. A negative times a ${s.b < 0 ? "negative" : "positive"} is ${s.result > 0 ? "positive" : "negative"}.`, `Así ${sg(s.a)} × ${sg(s.b)} = ${sg(s.result)}. Un negativo por un ${s.b < 0 ? "negativo" : "positivo"} es ${s.result > 0 ? "positivo" : "negativo"}.`), A(`${sg(s.result)}.`, `${sg(s.result)}.`), `${sg(s.a)} × ${sg(s.b)} = ${sg(s.result)}`, draw(rowsU.length) + T(280, 36 + rowsU.length * 34, `${sg(s.a)} × ${sg(s.b)} = ${sg(s.result)}`, 24, COLORS.part), alt, { a: s.a, b: s.b, result: s.result, product: s.a * s.b }, 70 + rowsU.length * 34),
      ];
    }
    return [
      ctx("start", A(`Dividing undoes multiplying: ${sg(s.a)} ÷ ${sg(s.b)} asks what number times ${sg(s.b)} makes ${sg(s.a)}.`, `Dividir deshace multiplicar: ${sg(s.a)} ÷ ${sg(s.b)} pregunta qué número por ${sg(s.b)} da ${sg(s.a)}.`), A("What × the divisor?", "¿Qué × el divisor?"), `${sg(s.a)} ÷ ${sg(s.b)}`, T(280, 90, `? × ${sg(s.b)} = ${sg(s.a)}`, 30), alt, { a: s.a, b: s.b }, 150),
      ctx("sign", A(`${sg(s.b)} is ${s.b < 0 ? "negative" : "positive"} and ${sg(s.a)} is ${s.a < 0 ? "negative" : "positive"}, so the missing number is ${s.result < 0 ? "negative" : "positive"}.`, `${sg(s.b)} es ${s.b < 0 ? "negativo" : "positivo"} y ${sg(s.a)} es ${s.a < 0 ? "negativo" : "positivo"}, así que el número que falta es ${s.result < 0 ? "negativo" : "positivo"}.`), A(`The answer is ${s.result < 0 ? "negative" : "positive"}.`, `La respuesta es ${s.result < 0 ? "negativa" : "positiva"}.`), `? is ${s.result < 0 ? "negative" : "positive"}`, T(280, 90, `? × ${sg(s.b)} = ${sg(s.a)}`, 30) + T(280, 134, s.result < 0 ? "−" : "+", 34, COLORS.warn), alt, { sign: Math.sign(s.result) }, 170),
      ctx("answer", A(`${sg(s.result)} × ${sg(s.b)} = ${sg(s.a)}, so ${sg(s.a)} ÷ ${sg(s.b)} = ${sg(s.result)}.`, `${sg(s.result)} × ${sg(s.b)} = ${sg(s.a)}, así que ${sg(s.a)} ÷ ${sg(s.b)} = ${sg(s.result)}.`), A(`${sg(s.result)}.`, `${sg(s.result)}.`), `${sg(s.a)} ÷ ${sg(s.b)} = ${sg(s.result)}`, T(280, 90, `${sg(s.result)} × ${sg(s.b)} = ${sg(s.a)}`, 30, COLORS.part), alt, { a: s.a, b: s.b, result: s.result, check: s.result * s.b }, 150),
    ];
  }
  if (s.mode === "fcount") {
    const alt = A(`Factor pairs of ${s.n}.`, `Pares de factores de ${s.n}.`);
    const body = (n) => s.pairs.slice(0, n).map(([f, g], i) => T(280, 40 + i * 34, f === g ? `${f} × ${g}` : `${f} × ${g}`, 24, COLORS.whole)).join("") + (n >= s.pairs.length ? T(280, 52 + s.pairs.length * 34, s.all.join(", "), 18, COLORS.part) : "");
    const h = 100 + s.pairs.length * 34;
    return [
      ctx("start", A(`Find the pairs of numbers that multiply to ${s.n}.`, `Halla los pares de números que se multiplican para dar ${s.n}.`), A("Find the pairs.", "Halla los pares."), `factors of ${s.n}`, body(0), alt, { n: s.n }, h),
      ctx("pairs", A(`The pairs: ${s.pairs.map(([f, g]) => `${f} × ${g}`).join(", ")}.`, `Los pares: ${s.pairs.map(([f, g]) => `${f} × ${g}`).join(", ")}.`), A("All the pairs.", "Todos los pares."), `${s.pairs.length} pairs`, body(s.pairs.length), alt, { n: s.n, pairs: s.pairs }, h),
      ctx("list", A(`List each number once: ${s.all.join(", ")}. That is ${s.all.length} factors.`, `Escribe cada número una vez: ${s.all.join(", ")}. Son ${s.all.length} factores.`), A(`${s.all.length} factors.`, `${s.all.length} factores.`), `${s.all.length}`, body(s.pairs.length) + "", alt, { n: s.n, all: s.all, result: s.all.length }, h),
    ];
  }
  if (s.mode === "fmult") {
    const alt = A(`Multiples of ${s.d}: ${s.list.join(", ")}.`, `Múltiplos de ${s.d}: ${s.list.join(", ")}.`);
    const w = Math.min(54, 520 / s.list.length);
    const body = (hi) => s.list.map((v, i) => `<rect x="${280 - (w * s.list.length) / 2 + i * w + 2}" y="70" width="${w - 4}" height="44" rx="8" fill="${v === hi ? COLORS.part : "#f8fafc"}" stroke="${COLORS.rule}" stroke-width="2"/>${T(280 - (w * s.list.length) / 2 + i * w + w / 2, 99, String(v), w < 36 ? 12 : 17, v === hi ? "#fff" : COLORS.ink)}`).join("");
    const inList = s.list.includes(s.n);
    return [
      ctx("count", A(`Count by ${s.d}s to list the multiples: ${s.list.join(", ")}.`, `Cuenta de ${s.d} en ${s.d} para listar los múltiplos: ${s.list.join(", ")}.`), A(`Count by ${s.d}.`, `Cuenta de ${s.d} en ${s.d}.`), `multiples of ${s.d}`, body(null), alt, { list: s.list }, 160),
      ctx("check", inList ? A(`${s.n} is in the list, so it is a multiple of ${s.d}.`, `${s.n} está en la lista, así que es múltiplo de ${s.d}.`) : A(`The list jumps over ${s.n} without landing on it, so ${s.n} is not a multiple of ${s.d}.`, `La lista salta ${s.n} sin caer en él, así que ${s.n} no es múltiplo de ${s.d}.`), A(inList ? "Yes." : "No.", inList ? "Sí." : "No."), `${s.n} ${inList ? "∈" : "∉"} multiples of ${s.d}`, body(inList ? s.n : null), alt, { list: s.list, n: s.n, result: s.result }, 160),
    ];
  }
  if (s.mode === "fkth") {
    const alt = A(`The first ${s.k} multiples of ${s.d}.`, `Los primeros ${s.k} múltiplos de ${s.d}.`);
    const w = Math.min(54, 520 / s.k);
    const body = (upto) => s.list.slice(0, upto).map((v, i) => `<rect x="${280 - (w * s.k) / 2 + i * w + 2}" y="70" width="${w - 4}" height="44" rx="8" fill="${i === s.k - 1 && upto === s.k ? COLORS.part : "#f8fafc"}" stroke="${COLORS.rule}" stroke-width="2"/>${T(280 - (w * s.k) / 2 + i * w + w / 2, 99, String(v), w < 36 ? 12 : 17, i === s.k - 1 && upto === s.k ? "#fff" : COLORS.ink)}`).join("");
    return [
      ctx("start", A(`Count by ${s.d}s, ${s.k} times.`, `Cuenta de ${s.d} en ${s.d}, ${s.k} veces.`), A(`Count ${s.k} times.`, `Cuenta ${s.k} veces.`), `${s.k} × ${s.d}`, body(Math.max(1, s.k - 1)), alt, { upto: s.k - 1 }, 160),
      ctx("kth", A(`The ${s.k}th number you say is ${s.result}: ${s.k} × ${s.d} = ${s.result}.`, `El ${s.k}.º número que dices es ${s.result}: ${s.k} × ${s.d} = ${s.result}.`), A(`${s.result}.`, `${s.result}.`), `${s.k} × ${s.d} = ${s.result}`, body(s.k), alt, { list: s.list, k: s.k, d: s.d, result: s.result }, 160),
    ];
  }
  return [];
}

export const answer = (s) => s.result;

export function predicts(s) {
  const P = (at, q, r, w, why, er, ew) => [predictOf(at, q, r, w, { right: why[0], wrong: why[1] }, er, ew)];
  if (s.mode === "surfaceNet") return s.solid === "square-pyramid"
    ? P(1, A("Each side face is a triangle. How do you find one triangle's area?", "Cada cara lateral es un triángulo. ¿Cómo hallas el área de un triángulo?"), A("One-half × base × triangle height.", "Un medio × base × altura del triángulo."), A("Base × triangle height.", "Base × altura del triángulo."), [A("A triangle has half the area of a rectangle with the same base and height.", "Un triángulo tiene la mitad del área de un rectángulo con la misma base y altura."), A("That would count two congruent triangles for each face.", "Eso contaría dos triángulos congruentes por cada cara.")], A("The four side faces are triangles, not rectangles.", "Las cuatro caras laterales son triángulos, no rectángulos."), A("Use the triangle area rule, then count all four faces.", "Usa la regla del área del triángulo y cuenta las cuatro caras."))
    : P(1, A("A rectangular-prism net shows three matching pairs of faces. What should you do with the three different face areas?", "Una red de prisma rectangular muestra tres pares de caras iguales. ¿Qué haces con las tres áreas diferentes?"), A("Add each area twice, once for each matching face.", "Suma cada área dos veces, una por cada cara del par."), A("Add each area once because each shape appears once.", "Suma cada área una vez porque cada forma aparece una vez."), [A("The net has two faces in each matching pair.", "La red tiene dos caras en cada par igual."), A("Matching dimensions do not make a face disappear; both are on the outside.", "Que las dimensiones coincidan no elimina una cara; ambas están afuera.")], A("Surface area covers every outside face.", "El área de superficie cubre cada cara exterior."), A("A pair names two matching faces, and both count.", "Un par nombra dos caras iguales y ambas cuentan."));
  if (s.mode === "circle") return P(1, A("In the area of a circle, what multiplies π?", "En el área de un círculo, ¿qué multiplica a π?"), A("The radius times itself.", "El radio por sí mismo."), A("The radius times 2.", "El radio por 2."), [A("Area is square units, so the radius is used as a factor twice.", "El área es en unidades cuadradas, así que el radio se usa como factor dos veces."), A("Doubling the radius is the diameter, which is for the circumference.", "Duplicar el radio da el diámetro, que es para la circunferencia.")], A("Because area covers a surface, so two lengths multiply.", "Porque el área cubre una superficie, así que se multiplican dos longitudes."), A("Because the radius is the whole answer.", "Porque el radio es toda la respuesta."));
  if (s.mode === "pyth") return P(2, A("After adding the two squares, are we done?", "Después de sumar los dos cuadrados, ¿terminamos?"), A("No: we found c², so we still take the square root.", "No: hallamos c², así que falta sacar la raíz cuadrada."), A("Yes: that sum is c.", "Sí: esa suma es c."), [A("The sum is the area of the big square; c is its side.", "La suma es el área del cuadrado grande; c es su lado."), A("The sum is c × c, so c is smaller.", "La suma es c × c, así que c es menor.")], A("Because a² + b² = c², and we want c.", "Porque a² + b² = c², y queremos c."), A("Because the hypotenuse is the sum of the legs.", "Porque la hipotenusa es la suma de los catetos."));
  if (s.mode === "angle") return P(1, A(s.kind === "vertical" ? "Vertical angles are across from each other. How do their sizes compare?" : `What do ${s.kind} angles add up to?`, s.kind === "vertical" ? "Los ángulos opuestos por el vértice están frente a frente. ¿Cómo se comparan sus tamaños?" : `¿A cuánto suman los ángulos ${s.kind === "complementary" ? "complementarios" : "suplementarios"}?`), A(s.kind === "vertical" ? "They are equal." : `${s.total}°.`, s.kind === "vertical" ? "Son iguales." : `${s.total}°.`), A(s.kind === "vertical" ? "They add to 180°." : s.total === 90 ? "180°." : "90°.", s.kind === "vertical" ? "Suman 180°." : s.total === 90 ? "180°." : "90°."), [A(s.kind === "vertical" ? "Opposite angles made by two crossing lines match." : s.total === 90 ? "A right angle is 90°; complementary angles fill it." : "A straight line is 180°; supplementary angles fill it.", s.kind === "vertical" ? "Los ángulos opuestos de dos rectas que se cruzan son iguales." : s.total === 90 ? "Un ángulo recto mide 90°; los complementarios lo llenan." : "Una línea recta mide 180°; los suplementarios la llenan."), A("Check the word: complementary means 90°, supplementary means 180°.", "Revisa la palabra: complementario es 90°, suplementario es 180°.")], A("Because the name of the relationship tells the total.", "Porque el nombre de la relación dice el total."), A("Because all angle pairs add to 180°.", "Porque todos los pares de ángulos suman 180°."));
  if (s.mode === "reflect") return P(1, A(`Reflecting across the ${s.axis}-axis, which coordinate changes sign?`, `Al reflejar sobre el eje ${s.axis}, ¿qué coordenada cambia de signo?`), A(s.axis === "y" ? "x." : "y.", s.axis === "y" ? "x." : "y."), A(s.axis === "y" ? "y." : "x.", s.axis === "y" ? "y." : "x."), [A(s.axis === "y" ? "The point swaps left and right, which is the x direction." : "The point swaps up and down, which is the y direction.", s.axis === "y" ? "El punto cambia de izquierda a derecha, la dirección x." : "El punto cambia de arriba a abajo, la dirección y."), A("That coordinate measures along the mirror line, so it stays the same.", "Esa coordenada mide a lo largo de la línea espejo, así que no cambia.")], A("Because the mirror line does not move the points along it.", "Porque la línea espejo no mueve los puntos a lo largo de ella."), A("Because both coordinates swap places.", "Porque ambas coordenadas se intercambian."));
  if (s.mode === "quad") return P(1, A("In (x, y), which number says left or right?", "En (x, y), ¿qué número dice izquierda o derecha?"), A("x.", "x."), A("y.", "y."), [A("x is how far across; negative means left.", "x es cuánto a lo ancho; negativo significa izquierda."), A("y is how far up or down.", "y es cuánto arriba o abajo.")], A("Because the first number of a pair goes across.", "Porque el primer número de un par va a lo ancho."), A("Because the second number goes across.", "Porque el segundo número va a lo ancho."));
  if (s.mode === "signs") return P(1, A(`What kind of number do we expect for ${sg(s.a)} ${s.op} ${sg(s.b)}?`, `¿Qué tipo de número esperamos para ${sg(s.a)} ${s.op} ${sg(s.b)}?`), A(s.result > 0 ? "Positive: two negatives." : "Negative: one negative.", s.result > 0 ? "Positivo: dos negativos." : "Negativo: un negativo."), A(s.result > 0 ? "Negative." : "Positive.", s.result > 0 ? "Negativo." : "Positivo."), [A(s.result > 0 ? "Two negatives make a positive: the pattern passes through zero and keeps counting up." : "One negative factor makes a negative answer.", s.result > 0 ? "Dos negativos hacen un positivo: el patrón pasa por cero y sigue subiendo." : "Un factor negativo da una respuesta negativa."), A("Follow the pattern past zero to check the sign.", "Sigue el patrón más allá de cero para revisar el signo.")], A("Because the pattern keeps changing by the same amount, even past zero.", "Porque el patrón sigue cambiando en la misma cantidad, incluso pasado el cero."), A("Because the answer is always negative if any factor is.", "Porque la respuesta siempre es negativa si algún factor lo es."));
  return [];
}

export function hints(s) {
  const list = frames(s);
  const first = list[0];
  const H = {
    circle: [A("Area covers a surface, so the radius is used twice.", "El área cubre una superficie, así que el radio se usa dos veces."), A("The circle is shown with its radius.", "El círculo se muestra con su radio."), A("The number that multiplies π is the radius times the radius.", "El número que multiplica a π es el radio por el radio.")],
    pyth: [A("Square the two legs and add them.", "Eleva al cuadrado los dos catetos y súmalos."), A("The triangle is shown with its legs.", "El triángulo se muestra con sus catetos."), A("That sum is c², so find the number that squares to it.", "Esa suma es c², así que halla el número que la tiene como cuadrado.")],
    angle: [A("The name of the relationship tells how the angles compare.", "El nombre de la relación dice cómo se comparan los ángulos."), A("The two angles are shown.", "Se muestran los dos ángulos."), A("Use what the pair adds to (or that they are equal) to find the missing angle.", "Usa a cuánto suma el par (o que son iguales) para hallar el ángulo que falta.")],
    reflect: [A("A reflection flips the point across the mirror line.", "Una reflexión voltea el punto sobre la línea espejo."), A("The point and the mirror line are shown.", "Se muestran el punto y la línea espejo."), A("Decide which coordinate measures the distance from the mirror, and flip its sign.", "Decide qué coordenada mide la distancia al espejo y cambia su signo.")],
    quad: [A("The first number is across and the second is up or down.", "El primer número va a lo ancho y el segundo arriba o abajo."), A("The four quadrants are shown.", "Se muestran los cuatro cuadrantes."), A("Decide left or right, then up or down, and find the quadrant.", "Decide izquierda o derecha, luego arriba o abajo, y halla el cuadrante.")],
    signs: [A("Think about the sign first, then the size.", "Piensa primero en el signo y luego en el tamaño."), A("The problem is shown.", "Se muestra el problema."), A("Use a pattern or the inverse operation to check the sign.", "Usa un patrón o la operación inversa para revisar el signo.")],
    fcount: [A("Factors come in pairs that multiply to the number.", "Los factores vienen en pares que se multiplican para dar el número."), A("The number is shown.", "Se muestra el número."), A("Find every pair, then count each number once.", "Halla cada par y cuenta cada número una vez.")],
    fmult: [A("Multiples are what you get counting by the number.", "Los múltiplos son lo que obtienes contando de ese número en ese número."), A("The number is shown.", "Se muestra el número."), A("Count up by it and see whether you land on the number in question.", "Cuenta hacia arriba y mira si caes en el número de la pregunta.")],
    fkth: [A("Count by the number, and keep track of how many you have said.", "Cuenta de ese número en ese número y lleva la cuenta de cuántos dijiste."), A("The counting is set up for you.", "El conteo está preparado."), A("Stop at the right count and read the number.", "Detente en el conteo correcto y lee el número.")],
    surfaceNet: [A("Surface area counts every outside face. First identify the faces in the net.", "El área de superficie cuenta cada cara exterior. Primero identifica las caras de la red."), A("The net lists each face area in square units.", "La red muestra el área de cada cara en unidades cuadradas."), A("Add every face once; matching pairs still contain two faces.", "Suma cada cara una vez; los pares iguales todavía contienen dos caras.")],
  }[s.mode];
  // For sign problems the opening picture is already a worked row of the pattern; hints show just the problem.
  const safe = s.mode === "signs" ? { ...first, svg: svgWrap(T(280, 80, `${sg(s.a)} ${s.op} ${sg(s.b)}`, 36), "", { h: 140 }) } : first;
  return [{ text: H[0] }, { text: H[1], frame: safe }, { text: H[2], frame: safe }];
}

export function diagnose(s, raw) {
  const w = String(raw).replace(/\s/g, "").replaceAll("−", "-");
  const v = num(raw);
  if (s.mode === "surfaceNet" && v !== null && v !== s.result) {
    const onceEach = s.solid === "rectangular-prism" ? s.result / 2 : null;
    if (v === onceEach) return "surfaceNetMissedPairs";
    if (s.solid === "rectangular-prism" && v === s.l * s.w * s.h) return "surfaceNetUsedVolume";
  }
  if (s.mode === "circle" && v !== null && v !== s.result) return v === s.r * 2 ? "doubledRadius" : v === s.r ? "forgotSquare" : null;
  if (s.mode === "pyth" && v !== null && v !== s.c) return v === s.a + s.b ? "addedLegs" : v === s.c2 ? "forgotRoot" : null;
  if (s.mode === "angle" && v !== null && v !== s.result) return s.kind === "vertical" ? (v === 180 - s.given ? "usedSupplementary" : null) : v === (s.total === 90 ? 180 : 90) - s.given ? (s.total === 90 ? "usedSupplementary" : "usedComplementary") : null;
  if (s.mode === "reflect" && w !== s.result.replace(/\s/g, "")) return w === `(${s.y},${s.x})` ? "swapped" : w === (s.axis === "y" ? `(${s.x},${-s.y})` : `(${-s.x},${s.y})`) ? "wrongAxis" : w === `(${-s.x},${-s.y})` ? "flippedBoth" : null;
  if (s.mode === "quad" && raw && String(raw).toUpperCase() !== s.result) return String(raw).toUpperCase() === quadrant(s.y, s.x) && quadrant(s.y, s.x) !== s.result ? "swappedXY" : null;
  if (s.mode === "signs" && v !== null && v !== s.result) return v === -s.result ? "signSlip" : null;
  if (s.mode === "fcount" && v !== null && v !== s.result) return v === s.pairs.length ? "countedPairs" : null;
  if (s.mode === "fkth" && v !== null && v !== s.result) return v === s.d + s.k ? "addedInstead" : null;
  return null;
}
export const tags = {
  surfaceNetMissedPairs: { label: L("Counted matching faces only once", "Contó las caras iguales una sola vez"), tip: L("Each matching pair contains two outside faces. Count both areas.", "Cada par igual contiene dos caras exteriores. Cuenta ambas áreas.") },
  surfaceNetUsedVolume: { label: L("Found volume instead of surface area", "Halló el volumen en lugar del área de superficie"), tip: L("Volume multiplies three dimensions. Surface area adds the areas of the outside faces.", "El volumen multiplica tres dimensiones. El área de superficie suma las áreas de las caras exteriores.") },
  doubledRadius: { label: L("Doubled the radius instead of multiplying it by itself", "Duplicó el radio en lugar de multiplicarlo por sí mismo"), tip: L("Area uses r × r, a square, not r + r.", "El área usa r × r, un cuadrado, no r + r.") },
  forgotSquare: { label: L("Gave the radius itself", "Dio el radio mismo"), tip: L("The number multiplying π is r × r.", "El número que multiplica a π es r × r.") },
  addedLegs: { label: L("Added the legs", "Sumó los catetos"), tip: L("Square each leg first, add the squares, then take the square root.", "Eleva al cuadrado cada cateto, suma los cuadrados y saca la raíz cuadrada.") },
  forgotRoot: { label: L("Stopped at c squared", "Se detuvo en c al cuadrado"), tip: L("a² + b² = c². Take the square root to get c.", "a² + b² = c². Saca la raíz cuadrada para obtener c.") },
  usedSupplementary: { label: L("Used 180° instead of 90°", "Usó 180° en lugar de 90°"), tip: L("Complementary angles add to 90°; vertical angles are equal.", "Los ángulos complementarios suman 90°; los opuestos por el vértice son iguales.") },
  usedComplementary: { label: L("Used 90° instead of 180°", "Usó 90° en lugar de 180°"), tip: L("Supplementary angles add to 180°, a straight line.", "Los ángulos suplementarios suman 180°, una línea recta.") },
  swapped: { label: L("Swapped x and y", "Intercambió x e y"), tip: L("A reflection keeps x first and y second; only one sign changes.", "Una reflexión mantiene x primero y y segundo; solo cambia un signo.") },
  wrongAxis: { label: L("Flipped the wrong coordinate", "Cambió la coordenada equivocada"), tip: L("Across the y-axis x changes sign; across the x-axis y changes sign.", "Sobre el eje y cambia el signo de x; sobre el eje x cambia el de y.") },
  flippedBoth: { label: L("Changed both signs", "Cambió ambos signos"), tip: L("A reflection across one axis changes only one coordinate.", "Una reflexión sobre un eje cambia solo una coordenada.") },
  swappedXY: { label: L("Read the coordinates in the wrong order", "Leyó las coordenadas en orden equivocado"), tip: L("The first number is across (x); the second is up or down (y).", "El primer número es a lo ancho (x); el segundo es arriba o abajo (y).") },
  signSlip: { label: L("Right size, wrong sign", "Tamaño correcto, signo equivocado"), tip: L("Check the sign: two negatives make a positive; one negative makes a negative.", "Revisa el signo: dos negativos hacen un positivo; un negativo hace un negativo.") },
  countedPairs: { label: L("Counted the pairs instead of the factors", "Contó los pares en lugar de los factores"), tip: L("Each pair has two factors. List every number once and count them.", "Cada par tiene dos factores. Escribe cada número una vez y cuéntalos.") },
  addedInstead: { label: L("Added instead of counting by the number", "Sumó en lugar de contar de ese número en ese número"), tip: L("The kth multiple is k times the number: count by it k times.", "El k-ésimo múltiplo es k veces el número: cuenta de él k veces.") },
};

// ----- Build -----
const pickDraw = (idx) => (s, pick) => ({ body: strip(frames(s)[Math.min(pick !== null ? idx : 0, frames(s).length - 1)].svg), alt: L("The figure.", "La figura."), h: 250 });
const opts = (list, rightFn, msgFn) => list.map((v) => ({ label: L(String(v), String(v)), ok: rightFn(v), msg: msgFn(v) }));
const BUILDS = {
  surfaceNet: choiceBuild({ prompt: (s) => L(s.solid === "rectangular-prism" ? "Which expression counts all six faces in the net?" : "Which expression counts the square base and all four triangular faces?", s.solid === "rectangular-prism" ? "¿Qué expresión cuenta las seis caras de la red?" : "¿Qué expresión cuenta la base cuadrada y las cuatro caras triangulares?"), options: (s) => s.solid === "rectangular-prism" ? [
    { label: L(`2(${s.l}×${s.w} + ${s.l}×${s.h} + ${s.w}×${s.h})`, `2(${s.l}×${s.w} + ${s.l}×${s.h} + ${s.w}×${s.h})`), ok: true },
    { label: L(`${s.l}×${s.w}×${s.h}`, `${s.l}×${s.w}×${s.h}`), ok: false, msg: L("That multiplies three dimensions to find volume. Surface area adds face areas.", "Eso multiplica tres dimensiones para hallar volumen. El área suma las caras.") },
    { label: L(`${s.l}×${s.w} + ${s.l}×${s.h} + ${s.w}×${s.h}`, `${s.l}×${s.w} + ${s.l}×${s.h} + ${s.w}×${s.h}`), ok: false, msg: L("Those are the three different face areas; each occurs twice.", "Esas son las tres áreas distintas; cada una aparece dos veces.") },
  ] : [
    { label: L(`${s.side}×${s.side} + 4(${s.side}×${s.triangleHeight}÷2)`, `${s.side}×${s.side} + 4(${s.side}×${s.triangleHeight}÷2)`), ok: true },
    { label: L(`${s.side}×${s.side} + 4(${s.side}×${s.triangleHeight})`, `${s.side}×${s.side} + 4(${s.side}×${s.triangleHeight})`), ok: false, msg: L("Each side face is a triangle, so use one-half × base × height.", "Cada cara lateral es un triángulo: usa un medio por base por altura.") },
    { label: L(`${s.side}×${s.side}×${s.triangleHeight}`, `${s.side}×${s.side}×${s.triangleHeight}`), ok: false, msg: L("That is not the sum of the square base and four triangular faces.", "Eso no suma la base cuadrada y las cuatro caras triangulares.") },
  ], draw: pickDraw(1), doneMsg: (s) => L(`Add all ${s.faces.length} face areas: ${s.faces.join(" + ")} = ${s.result} ${s.areaUnit}.`, `Suma las ${s.faces.length} áreas: ${s.faces.join(" + ")} = ${s.result} ${s.areaUnitEs}.`) }),
  circle: choiceBuild({ prompt: () => L("What multiplies π?", "¿Qué multiplica a π?"), options: (s) => [{ label: L(`${s.r} × ${s.r}`, `${s.r} × ${s.r}`), ok: true }, { label: L(`${s.r} × 2`, `${s.r} × 2`), ok: false, msg: L("That is the diameter. Area needs the radius times itself.", "Eso es el diámetro. El área necesita el radio por sí mismo.") }, { label: L(`${s.r}`, `${s.r}`), ok: false, msg: L("The radius alone is a length. Area needs two lengths multiplied.", "El radio solo es una longitud. El área necesita dos longitudes multiplicadas.") }], draw: pickDraw(1), doneMsg: (s) => L(`${s.r} × ${s.r} = ${s.result}, so the area is ${s.result}π.`, `${s.r} × ${s.r} = ${s.result}, así que el área es ${s.result}π.`) }),
  pyth: choiceBuild({ prompt: () => L("What do we do with the squares of the legs?", "¿Qué hacemos con los cuadrados de los catetos?"), options: (s) => [{ label: L("Add them, then take the square root", "Sumarlos y sacar la raíz cuadrada"), ok: true }, { label: L("Add the legs themselves", "Sumar los catetos mismos"), ok: false, msg: L("The theorem adds the squares, not the legs.", "El teorema suma los cuadrados, no los catetos.") }, { label: L("Subtract them", "Restarlos"), ok: false, msg: L("To find the hypotenuse, add the squares of the legs.", "Para hallar la hipotenusa, suma los cuadrados de los catetos.") }], draw: pickDraw(3), doneMsg: (s) => L(`${s.a2} + ${s.b2} = ${s.c2}, so c = ${s.c}.`, `${s.a2} + ${s.b2} = ${s.c2}, así que c = ${s.c}.`) }),
  angle: choiceBuild({ prompt: (s) => L(s.kind === "vertical" ? "How do vertical angles compare?" : `What do ${s.kind} angles add to?`, s.kind === "vertical" ? "¿Cómo se comparan los ángulos opuestos por el vértice?" : `¿A cuánto suman los ángulos ${s.kind === "complementary" ? "complementarios" : "suplementarios"}?`), options: (s) => (s.kind === "vertical" ? [{ label: L("They are equal", "Son iguales"), ok: true }, { label: L("They add to 180°", "Suman 180°"), ok: false, msg: L("That is for angles side by side on a line. Vertical angles are across from each other.", "Eso es para ángulos lado a lado en una recta. Los opuestos están frente a frente.") }, { label: L("They add to 90°", "Suman 90°"), ok: false, msg: L("Vertical angles are equal, not a sum of 90°.", "Los ángulos opuestos por el vértice son iguales, no suman 90°.") }] : [90, 180].map((v) => ({ label: L(`${v}°`, `${v}°`), ok: v === s.total, msg: L(s.kind === "complementary" ? "Complementary angles make a right angle: 90°." : "Supplementary angles make a straight line: 180°.", s.kind === "complementary" ? "Los complementarios forman un ángulo recto: 90°." : "Los suplementarios forman una línea recta: 180°.") }))), draw: pickDraw(2), doneMsg: (s) => L(s.kind === "vertical" ? `The other angle is ${s.result}°.` : `${s.total}° − ${s.given}° = ${s.result}°.`, s.kind === "vertical" ? `El otro ángulo mide ${s.result}°.` : `${s.total}° − ${s.given}° = ${s.result}°.`) }),
  reflect: choiceBuild({ prompt: (s) => L(`Reflect across the ${s.axis}-axis. Which coordinate changes sign?`, `Refleja sobre el eje ${s.axis}. ¿Qué coordenada cambia de signo?`), options: (s) => [{ label: L("x", "x"), ok: s.axis === "y", msg: L("Across the x-axis the point swaps up and down, so y changes.", "Sobre el eje x el punto cambia de arriba a abajo, así que cambia y.") }, { label: L("y", "y"), ok: s.axis === "x", msg: L("Across the y-axis the point swaps left and right, so x changes.", "Sobre el eje y el punto cambia de izquierda a derecha, así que cambia x.") }, { label: L("Both", "Ambas"), ok: false, msg: L("Only the coordinate across the mirror changes.", "Solo cambia la coordenada que cruza el espejo.") }], draw: pickDraw(2), doneMsg: (s) => L(`(${sg(s.x)}, ${sg(s.y)}) reflects to (${sg(s.rx)}, ${sg(s.ry)}).`, `(${sg(s.x)}, ${sg(s.y)}) se refleja en (${sg(s.rx)}, ${sg(s.ry)}).`) }),
  quad: choiceBuild({ prompt: (s) => L(`Which quadrant is (${sg(s.x)}, ${sg(s.y)}) in?`, `¿En qué cuadrante está (${sg(s.x)}, ${sg(s.y)})?`), options: (s) => ["I", "II", "III", "IV"].map((q) => ({ label: L(q, q), ok: q === s.result, msg: L("Check left or right with x, then up or down with y.", "Revisa izquierda o derecha con x y arriba o abajo con y.") })), draw: pickDraw(2), doneMsg: (s) => L(`Quadrant ${s.result}.`, `Cuadrante ${s.result}.`) }),
  signs: choiceBuild({ prompt: (s) => L(`Will ${sg(s.a)} ${s.op} ${sg(s.b)} be positive or negative?`, `¿${sg(s.a)} ${s.op} ${sg(s.b)} será positivo o negativo?`), options: (s) => [{ label: L("Positive", "Positivo"), ok: s.result > 0, msg: L("Follow the pattern or check with the inverse operation.", "Sigue el patrón o revisa con la operación inversa.") }, { label: L("Negative", "Negativo"), ok: s.result < 0, msg: L("Two negatives make a positive: check with the pattern.", "Dos negativos hacen un positivo: revisa con el patrón.") }], draw: pickDraw(2), doneMsg: (s) => L(`${sg(s.a)} ${s.op} ${sg(s.b)} = ${sg(s.result)}.`, `${sg(s.a)} ${s.op} ${sg(s.b)} = ${sg(s.result)}.`) }),
  fcount: choiceBuild({ prompt: (s) => L(`How many factors does ${s.n} have?`, `¿Cuántos factores tiene ${s.n}?`), options: (s) => [...new Set([s.pairs.length, s.result, s.result + 1, s.result - 1].filter((v) => v > 0))].sort((a, b) => a - b).map((v) => ({ label: L(String(v), String(v)), ok: v === s.result, msg: v === s.pairs.length ? L("That is the number of pairs. Each pair has two factors.", "Esa es la cantidad de pares. Cada par tiene dos factores.") : L("List every factor once, then count them.", "Escribe cada factor una vez y cuéntalos.") })), draw: pickDraw(2), doneMsg: (s) => L(`${s.n} has ${s.result} factors.`, `${s.n} tiene ${s.result} factores.`) }),
  fmult: choiceBuild({ prompt: (s) => L(`Is ${s.n} a multiple of ${s.d}?`, `¿${s.n} es múltiplo de ${s.d}?`), options: (s) => ["yes", "no"].map((w) => ({ label: L(w === "yes" ? "Yes" : "No", w === "yes" ? "Sí" : "No"), ok: w === s.result, msg: L("Count by the number and see whether you land on it.", "Cuenta de ese número en ese número y mira si caes en él.") })), draw: pickDraw(1), doneMsg: (s) => L(`${s.n} ${s.result === "yes" ? "is" : "is not"} a multiple of ${s.d}.`, `${s.n} ${s.result === "yes" ? "es" : "no es"} múltiplo de ${s.d}.`) }),
  fkth: choiceBuild({ prompt: (s) => L(`Which is the ${s.k}th multiple of ${s.d}?`, `¿Cuál es el múltiplo ${s.k}.º de ${s.d}?`), options: (s) => opts(s.list, (v) => v === s.result, (v) => (v < s.result ? L("Keep counting: that is an earlier multiple.", "Sigue contando: ese es un múltiplo anterior.") : L("Check the count.", "Revisa el conteo."))), draw: pickDraw(1), doneMsg: (s) => L(`${s.k} × ${s.d} = ${s.result}.`, `${s.k} × ${s.d} = ${s.result}.`) }),
};
export const build = {
  available: (s) => Boolean(BUILDS[s.mode]),
  prompt: (s) => BUILDS[s.mode].prompt(s),
  init: (s) => BUILDS[s.mode].init(s),
  render: (st, s, x) => BUILDS[s.mode].render(st, s, x),
  act: (st, id, arg, s) => BUILDS[s.mode].act(st, id, arg, s),
  done: (st, s) => BUILDS[s.mode].done(st, s),
};
