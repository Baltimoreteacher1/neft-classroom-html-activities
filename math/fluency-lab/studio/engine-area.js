// Area engine: arrays and area models for multiplication and division, and rectangle area, perimeter,
// triangle area and volume. A split never changes the whole: frames record `parts` and `total` so the tests
// can check that the partial products always add to the product.
import { COLORS, L, PLACE_COLORS, clean, esc, frame, keyed, num, svgWrap, txt } from "./core.js";

const place = (n) => {
  const s = String(n);
  return [...s].map((d, i) => Number(d) * 10 ** (s.length - 1 - i)).filter(Boolean);
};

export function parse(question) {
  const q = clean(question);
  let m = q.match(/^(\d+) × (\d+) = \?$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 0 || b === 0) return null;
    if (Math.max(a, b) <= 12) return { engine: "area", kind: "array", a, b, total: a * b };
    const [pa, pb] = [place(a), place(b)];
    if (String(a).length > 4 || String(b).length > 4 || pa.length * pb.length > 9) return null;
    return { engine: "area", kind: "model", a, b, pa, pb, total: a * b };
  }
  m = q.match(/^(\d+) ÷ (\d+) = \?$/);
  if (m) {
    const [n, d] = [Number(m[1]), Number(m[2])];
    return d > 0 && d <= 12 && n % d === 0 && n / d <= 12 && n > 0
      ? { engine: "area", kind: "divide", n, d, total: n / d }
      : null;
  }
  m = q.match(/^Area of a rectangle with length (\d+) and width (\d+)\?$/);
  if (m)
    return { engine: "area", kind: "area", l: Number(m[1]), w: Number(m[2]), total: m[1] * m[2] };
  m = q.match(/^Perimeter of a rectangle with length (\d+) and width (\d+)\?$/);
  if (m)
    return {
      engine: "area",
      kind: "perimeter",
      l: Number(m[1]),
      w: Number(m[2]),
      total: 2 * (Number(m[1]) + Number(m[2])),
    };
  m = q.match(/^Area of a triangle with base (\d+) and height (\d+)\?$/);
  if (m)
    return (Number(m[1]) * Number(m[2])) % 2 === 0
      ? {
          engine: "area",
          kind: "triangle",
          b: Number(m[1]),
          h: Number(m[2]),
          total: (m[1] * m[2]) / 2,
        }
      : null;
  m = q.match(/^Volume of a rectangular prism: (\d+) × (\d+) × (\d+)\?$/);
  if (m)
    return {
      engine: "area",
      kind: "volume",
      l: Number(m[1]),
      w: Number(m[2]),
      h: Number(m[3]),
      total: m[1] * m[2] * m[3],
    };
  return null;
}

// A grid of unit squares; rows beyond `fill` are drawn empty.
function grid(
  rows,
  cols,
  {
    x0 = 40,
    y0 = 40,
    max = 440,
    hmax = 170,
    fill = rows,
    color = COLORS.whole,
    split = 0,
    key = "g",
    pa = 0,
  } = {},
) {
  const cell = Math.min(34, max / cols, hmax / rows);
  const x = x0 + (max - cell * cols) / 2;
  let out = "";
  for (let r = 0; r < rows; r += 1)
    for (let c = 0; c < cols; c += 1) {
      const right = split && c >= split;
      out += keyed(
        `${key}${r}-${c}`,
        x + c * cell + (right ? 10 : 0),
        y0 + r * cell,
        `<rect width="${cell - 2}" height="${cell - 2}" rx="${cell > 14 ? 4 : 1}" fill="${r < fill ? (right ? COLORS.hundreds : color) : "#fff"}" fill-opacity="${r < fill ? 0.88 : 1}" stroke="${r < fill ? "#fff" : COLORS.rule}" stroke-width="1.5"/>`,
      );
    }
  return { out, cell, x, w: cell * cols, h: cell * rows };
}
const wrap = (body, h = 260) => svgWrap(body, "", { h });
const mk = (id, cap, easy, eq, svg, alt, meta) =>
  Object.assign(
    frame({
      id,
      cap,
      easy,
      eq,
      svg: svg.replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
      alt,
    }),
    { meta },
  );

export function frames(spec) {
  return KINDS[spec.kind].frames(spec);
}

const KINDS = {
  array: {
    frames(s) {
      const { a, b, total } = s;
      const gl = (split) => grid(a, b, { split });
      const out = [];
      const base = gl(0);
      out.push(
        mk(
          "build",
          L(
            `${a} rows with ${b} in each row make an array.`,
            `${a} filas con ${b} en cada fila forman un arreglo.`,
          ),
          L(`${a} rows of ${b}.`, `${a} filas de ${b}.`),
          `${a} × ${b}`,
          wrap(base.out),
          L(
            `An array with ${a} rows and ${b} columns.`,
            `Un arreglo con ${a} filas y ${b} columnas.`,
          ),
          { total, parts: [total] },
        ),
      );
      if (b >= 6) {
        const sp = 5;
        const g = gl(sp);
        const [p1, p2] = [a * sp, a * (b - sp)];
        out.push(
          mk(
            "split",
            L(
              `Break ${b} into ${sp} and ${b - sp}. Two easier facts: ${a} × ${sp} = ${p1} and ${a} × ${b - sp} = ${p2}.`,
              `Descompón ${b} en ${sp} y ${b - sp}. Dos datos más fáciles: ${a} × ${sp} = ${p1} y ${a} × ${b - sp} = ${p2}.`,
            ),
            L(`${p1} and ${p2}.`, `${p1} y ${p2}.`),
            `${a} × ${sp} + ${a} × ${b - sp}`,
            wrap(
              g.out +
                txt(g.x + (sp * g.cell) / 2, 28, `${p1}`, { fill: COLORS.whole, size: 20 }) +
                txt(g.x + sp * g.cell + 10 + ((b - sp) * g.cell) / 2, 28, `${p2}`, {
                  fill: COLORS.hundreds,
                  size: 20,
                }),
            ),
            L(
              `The array split after column ${sp}: ${p1} squares and ${p2} squares.`,
              `El arreglo dividido tras la columna ${sp}: ${p1} cuadros y ${p2} cuadros.`,
            ),
            { total, parts: [p1, p2] },
          ),
        );
      }
      out.push(
        mk(
          "total",
          L(
            `${a} × ${b} = ${total}. The parts always add up to the whole array.`,
            `${a} × ${b} = ${total}. Las partes siempre suman el arreglo completo.`,
          ),
          L(`${total} in all.`, `${total} en total.`),
          `${a} × ${b} = ${total}`,
          wrap(base.out + txt(280, 246, `${total}`, { size: 26, fill: COLORS.ink })),
          L(`The whole array has ${total} squares.`, `El arreglo completo tiene ${total} cuadros.`),
          { total, parts: [total] },
        ),
      );
      return out;
    },
  },
  model: {
    frames(s) {
      const { a, b, pa, pb, total } = s;
      const wA = (parts) =>
        parts.map((p) => Math.max(0.16, Math.log10(p + 1) / Math.log10(Math.max(...parts) + 1)));
      const draw = (hi, label) => {
        const rw = wA(pb);
        const rh = wA(pa);
        const sumW = rw.reduce((x, y) => x + y, 0);
        const sumH = rh.reduce((x, y) => x + y, 0);
        const X0 = 90;
        const Y0 = 40;
        const W = 400;
        const H = 170;
        let out = "";
        let y = Y0;
        let idx = 0;
        const done = [];
        pa.forEach((va, i) => {
          let x = X0;
          const h = (rh[i] / sumH) * H;
          pb.forEach((vb, j) => {
            const w = (rw[j] / sumW) * W;
            const n = idx;
            const lit = n === hi;
            const shown = hi === undefined || n <= hi || hi === "all";
            const color = PLACE_COLORS[(i + j) % PLACE_COLORS.length];
            out += keyed(
              `m${n}`,
              x,
              y,
              `<rect width="${w - 3}" height="${h - 3}" rx="6" fill="${shown ? color : "#fff"}" fill-opacity="${lit ? 0.95 : shown ? 0.5 : 1}" stroke="${lit ? COLORS.warn : COLORS.rule}" stroke-width="${lit ? 4 : 1.5}"/>${shown ? `<text x="${(w - 3) / 2}" y="${h / 2 + 7}" text-anchor="middle" font-size="${w < 70 ? 14 : 19}" font-weight="800" fill="#fff">${va * vb}</text>` : ""}`,
            );
            if (shown) done.push(va * vb);
            x += w;
            idx += 1;
          });
          out += txt(X0 - 12, y + h / 2 + 6, String(va), {
            anchor: "end",
            size: 17,
            fill: COLORS.ink,
          });
          y += h;
        });
        let x = X0;
        pb.forEach((vb, j) => {
          const w = (rw[j] / sumW) * W;
          out += txt(x + w / 2, 30, String(vb), { size: 17 });
          x += w;
        });
        return {
          svg: wrap(out + (label ? txt(300, 240, label, { size: 17, fill: COLORS.mute }) : "")),
          done,
        };
      };
      const alt = (n) =>
        L(
          `Area model of ${a} × ${b} split into ${pa.length * pb.length} parts; ${n} shown.`,
          `Modelo de área de ${a} × ${b} dividido en ${pa.length * pb.length} partes; ${n} visibles.`,
        );
      const out = [];
      out.push(
        mk(
          "whole",
          L(
            `${a} × ${b} is the area of one big rectangle ${a} tall and ${b} wide. It is easier to find in smaller pieces.`,
            `${a} × ${b} es el área de un rectángulo de ${a} de alto y ${b} de ancho. Es más fácil hallarla en partes pequeñas.`,
          ),
          L("One big rectangle.", "Un rectángulo grande."),
          `${a} × ${b}`,
          wrap(
            `<rect x="90" y="40" width="400" height="170" rx="8" fill="${COLORS.whole}" fill-opacity=".25" stroke="${COLORS.ink}" stroke-width="2"/>${txt(290, 135, `${a} × ${b}`, { size: 30 })}${txt(78, 130, String(a), { anchor: "end", size: 18 })}${txt(290, 30, String(b), { size: 18 })}`,
          ),
          alt(0),
          { total, parts: [total] },
        ),
      );
      out.push(
        mk(
          "split",
          L(
            `Split each side by place value: ${pa.join(" + ")} and ${pb.join(" + ")}. Each small rectangle has an easier product.`,
            `Divide cada lado por valor posicional: ${pa.join(" + ")} y ${pb.join(" + ")}. Cada rectángulo pequeño tiene un producto más fácil.`,
          ),
          L("Split by place value.", "Divide por valor posicional."),
          `(${pa.join(" + ")}) × (${pb.join(" + ")})`,
          draw(-1).svg,
          alt(0),
          { total, parts: [total] },
        ),
      );
      let k = 0;
      for (const va of pa)
        for (const vb of pb) {
          const dn = draw(k);
          out.push(
            mk(
              `part${k}`,
              L(`${va} × ${vb} = ${va * vb}.`, `${va} × ${vb} = ${va * vb}.`),
              L(`${va} × ${vb} = ${va * vb}.`, `${va} × ${vb} = ${va * vb}.`),
              `${va} × ${vb} = ${va * vb}`,
              dn.svg,
              alt(k + 1),
              { total, parts: [...dn.done] },
            ),
          );
          k += 1;
        }
      const all = pa.flatMap((va) => pb.map((vb) => va * vb));
      out.push(
        mk(
          "sum",
          L(
            `Add the parts: ${all.join(" + ")} = ${total}. So ${a} × ${b} = ${total}.`,
            `Suma las partes: ${all.join(" + ")} = ${total}. Así ${a} × ${b} = ${total}.`,
          ),
          L(`${all.join(" + ")} = ${total}.`, `${all.join(" + ")} = ${total}.`),
          `${all.join(" + ")} = ${total}`,
          draw("all", `${all.join(" + ")} = ${total}`).svg,
          alt(all.length),
          { total, parts: all },
        ),
      );
      return out;
    },
  },
  divide: {
    frames(s) {
      const { n, d, total } = s;
      const tiles = (perRow) => {
        let out = "";
        const cell = Math.min(30, 420 / perRow, 190 / Math.ceil(n / perRow));
        const x0 = 280 - (perRow * cell) / 2;
        for (let i = 0; i < n; i += 1)
          out += keyed(
            `t${i}`,
            x0 + (i % perRow) * cell,
            36 + Math.floor(i / perRow) * cell,
            `<rect width="${cell - 3}" height="${cell - 3}" rx="4" fill="${Math.floor(i / perRow) % 2 ? COLORS.hundreds : COLORS.whole}" fill-opacity=".9"/>`,
          );
        return out;
      };
      const alt = (p) => L(`${n} squares in rows of ${p}.`, `${n} cuadros en filas de ${p}.`);
      return [
        mk(
          "pile",
          L(`Start with ${n} squares.`, `Empieza con ${n} cuadros.`),
          L(`${n} squares.`, `${n} cuadros.`),
          `${n} ÷ ${d}`,
          wrap(tiles(12)),
          alt(12),
          { total, n, d },
        ),
        mk(
          "rows",
          L(
            `Put ${d} squares in each row. Count the rows: that is how many groups of ${d} fit in ${n}.`,
            `Pon ${d} cuadros en cada fila. Cuenta las filas: eso es cuántos grupos de ${d} caben en ${n}.`,
          ),
          L(`Rows of ${d}.`, `Filas de ${d}.`),
          `${n} ÷ ${d}`,
          wrap(tiles(d)),
          alt(d),
          { total, n, d },
        ),
        mk(
          "rule",
          L(
            `${total} rows of ${d} make ${n}, so ${n} ÷ ${d} = ${total}. Multiplying checks dividing.`,
            `${total} filas de ${d} forman ${n}, así que ${n} ÷ ${d} = ${total}. Multiplicar comprueba dividir.`,
          ),
          L(`${total} × ${d} = ${n}.`, `${total} × ${d} = ${n}.`),
          `${n} ÷ ${d} = ${total}   (${total} × ${d} = ${n})`,
          wrap(tiles(d)),
          alt(d),
          { total, n, d },
        ),
      ];
    },
  },
  area: {
    frames(s) {
      const { l, w, total } = s;
      const alt = (f) =>
        L(
          `A rectangle ${l} units long and ${w} units wide with ${f} rows filled.`,
          `Un rectángulo de ${l} de largo y ${w} de ancho con ${f} filas llenas.`,
        );
      const draw = (fill) => {
        const g = grid(w, l, { fill });
        return wrap(
          g.out +
            txt(g.x + g.w / 2, 24, `${l}`, { size: 18 }) +
            txt(g.x - 14, 40 + g.h / 2, `${w}`, { size: 18, anchor: "end" }),
        );
      };
      return [
        mk(
          "outline",
          L(
            `The rectangle is ${l} units long and ${w} units wide. Area counts the unit squares inside.`,
            `El rectángulo mide ${l} de largo y ${w} de ancho. El área cuenta los cuadrados unitarios del interior.`,
          ),
          L("Count squares inside.", "Cuenta cuadrados dentro."),
          `${l} × ${w}`,
          draw(0),
          alt(0),
          { total },
        ),
        mk(
          "row",
          L(`One row holds ${l} squares.`, `Una fila tiene ${l} cuadrados.`),
          L(`1 row = ${l}.`, `1 fila = ${l}.`),
          `${l} × 1 = ${l}`,
          draw(1),
          alt(1),
          { total, parts: [l] },
        ),
        mk(
          "all",
          L(
            `${w} rows of ${l} squares: ${l} × ${w} = ${total} square units.`,
            `${w} filas de ${l} cuadrados: ${l} × ${w} = ${total} unidades cuadradas.`,
          ),
          L(`${l} × ${w} = ${total}.`, `${l} × ${w} = ${total}.`),
          `${l} × ${w} = ${total}`,
          draw(w),
          alt(w),
          { total, parts: [total] },
        ),
      ];
    },
  },
  perimeter: {
    frames(s) {
      const { l, w, total } = s;
      const rect = (labels) => {
        const sc = Math.min(300 / l, 130 / w);
        const [rw, rh] = [l * sc, w * sc];
        const x0 = 280 - rw / 2;
        let out = `<rect x="${x0}" y="60" width="${rw}" height="${rh}" fill="${COLORS.whole}" fill-opacity=".15" stroke="${COLORS.ink}" stroke-width="4"/>`;
        if (labels >= 1) out += txt(280, 50, `${l}`, { size: 20 });
        if (labels >= 2)
          out +=
            txt(280, 60 + rh + 28, `${l}`, { size: 20 }) +
            txt(x0 - 14, 60 + rh / 2 + 7, `${w}`, { size: 20, anchor: "end" }) +
            txt(x0 + rw + 14, 60 + rh / 2 + 7, `${w}`, { size: 20, anchor: "start" });
        else out += txt(x0 + rw + 14, 60 + rh / 2 + 7, `${w}`, { size: 20, anchor: "start" });
        return wrap(out, 250);
      };
      const alt = L(
        `A rectangle ${l} long and ${w} wide.`,
        `Un rectángulo de ${l} de largo y ${w} de ancho.`,
      );
      return [
        mk(
          "sides",
          L(
            `Perimeter is the distance all the way around. Two sides are ${l} long and two sides are ${w} wide.`,
            `El perímetro es la distancia alrededor. Dos lados miden ${l} y dos lados miden ${w}.`,
          ),
          L("All the way around.", "Todo alrededor."),
          `P = ?`,
          rect(1),
          alt,
          { total },
        ),
        mk(
          "four",
          L(
            `Opposite sides are equal, so all four sides are known: ${l}, ${w}, ${l}, ${w}.`,
            `Los lados opuestos son iguales, así que se conocen los cuatro lados: ${l}, ${w}, ${l}, ${w}.`,
          ),
          L(`${l}, ${w}, ${l}, ${w}.`, `${l}, ${w}, ${l}, ${w}.`),
          `${l} + ${w} + ${l} + ${w}`,
          rect(2),
          alt,
          { total },
        ),
        mk(
          "sum",
          L(
            `Add them: ${l} + ${w} + ${l} + ${w} = ${total}.`,
            `Súmalos: ${l} + ${w} + ${l} + ${w} = ${total}.`,
          ),
          L(`${total} around.`, `${total} alrededor.`),
          `${l} + ${w} + ${l} + ${w} = ${total}`,
          rect(2),
          alt,
          { total, parts: [l, w, l, w] },
        ),
      ];
    },
  },
  triangle: {
    frames(s) {
      const { b, h, total } = s;
      const sc = Math.min(340 / b, 160 / h);
      const [rw, rh] = [b * sc, h * sc];
      const x0 = 280 - rw / 2;
      const shape = (cut) =>
        wrap(
          `<rect x="${x0}" y="40" width="${rw}" height="${rh}" fill="${COLORS.whole}" fill-opacity="${cut ? 0.12 : 0.28}" stroke="${COLORS.ink}" stroke-width="3"/>${cut ? `<polygon points="${x0},${40 + rh} ${x0 + rw},${40 + rh} ${x0},40" fill="${COLORS.hundreds}" fill-opacity=".85"/><line x1="${x0}" y1="40" x2="${x0 + rw}" y2="${40 + rh}" stroke="${COLORS.warn}" stroke-width="3" stroke-dasharray="8 6"/>` : ""}${txt(280, 32, `${b}`, { size: 18 })}${txt(x0 - 12, 40 + rh / 2 + 6, `${h}`, { size: 18, anchor: "end" })}`,
          250,
        );
      const alt = (c) =>
        L(
          `${c ? "A right triangle that is half of" : ""} a ${b} by ${h} rectangle.`,
          `${c ? "Un triángulo rectángulo que es la mitad de" : ""} un rectángulo de ${b} por ${h}.`,
        );
      return [
        mk(
          "rect",
          L(
            `A rectangle ${b} by ${h} has area ${b} × ${h} = ${b * h}.`,
            `Un rectángulo de ${b} por ${h} tiene área ${b} × ${h} = ${b * h}.`,
          ),
          L(`${b} × ${h} = ${b * h}.`, `${b} × ${h} = ${b * h}.`),
          `${b} × ${h} = ${b * h}`,
          shape(false),
          alt(false),
          { total: b * h },
        ),
        mk(
          "cut",
          L(
            `Cut along the diagonal. Two equal triangles fit exactly inside, so one triangle is half the rectangle.`,
            `Corta por la diagonal. Dos triángulos iguales caben exactamente, así que un triángulo es la mitad del rectángulo.`,
          ),
          L("Two equal triangles.", "Dos triángulos iguales."),
          `½ × ${b} × ${h}`,
          shape(true),
          alt(true),
          { total: b * h },
        ),
        mk(
          "half",
          L(
            `Half of ${b * h} is ${total}. The triangle's area is ${total}.`,
            `La mitad de ${b * h} es ${total}. El área del triángulo es ${total}.`,
          ),
          L(`${b * h} ÷ 2 = ${total}.`, `${b * h} ÷ 2 = ${total}.`),
          `½ × ${b} × ${h} = ${total}`,
          shape(true),
          alt(true),
          { total, half: true },
        ),
      ];
    },
  },
  volume: {
    frames(s) {
      const { l, w, h, total } = s;
      const layers = (n) => {
        const g = grid(w, l, { x0: 40, y0: 90, max: 360, hmax: 120, key: "v" });
        let back = "";
        const shown = Math.min(n, 8);
        for (let i = shown - 1; i >= 1; i -= 1)
          back += `<rect x="${g.x + i * 7}" y="${90 - i * 7}" width="${g.w}" height="${g.h}" rx="4" fill="${COLORS.hundreds}" fill-opacity=".18" stroke="${COLORS.hundreds}" stroke-width="2"/>`;
        return wrap(
          back +
            g.out +
            txt(470, 120, `${n} layer${n > 1 ? "s" : ""}`, { size: 18, fill: COLORS.hundreds }),
          250,
        );
      };
      const alt = (n) =>
        L(
          `A box ${l} long, ${w} wide with ${n} layer${n > 1 ? "s" : ""} of ${l * w} cubes.`,
          `Una caja de ${l} de largo y ${w} de ancho con ${n} capa${n > 1 ? "s" : ""} de ${l * w} cubos.`,
        );
      return [
        mk(
          "layer",
          L(
            `One layer is ${l} by ${w}: ${l} × ${w} = ${l * w} cubes.`,
            `Una capa es de ${l} por ${w}: ${l} × ${w} = ${l * w} cubos.`,
          ),
          L(`1 layer = ${l * w}.`, `1 capa = ${l * w}.`),
          `${l} × ${w} = ${l * w}`,
          layers(1),
          alt(1),
          { total: l * w },
        ),
        mk(
          "stack",
          L(
            `Stack ${h} layers. Each layer has ${l * w} cubes.`,
            `Apila ${h} capas. Cada capa tiene ${l * w} cubos.`,
          ),
          L(`${h} layers.`, `${h} capas.`),
          `${l * w} × ${h}`,
          layers(h),
          alt(h),
          { total },
        ),
        mk(
          "total",
          L(
            `${l * w} × ${h} = ${total} cubes. Volume = length × width × height.`,
            `${l * w} × ${h} = ${total} cubos. Volumen = largo × ancho × alto.`,
          ),
          L(`${total} cubes.`, `${total} cubos.`),
          `${l} × ${w} × ${h} = ${total}`,
          layers(h),
          alt(h),
          { total },
        ),
      ];
    },
  },
};

export const answer = (s) => s.total;

export function predicts(s) {
  if (s.kind === "array" && s.b >= 6)
    return [
      {
        at: 1,
        q: L(
          `We split ${s.b} columns into 5 and ${s.b - 5}. What do we do with the two products?`,
          `Dividimos ${s.b} columnas en 5 y ${s.b - 5}. ¿Qué hacemos con los dos productos?`,
        ),
        choices: [
          {
            t: L("Add them.", "Sumarlos."),
            ok: true,
            why: L(
              "The two parts together are the whole array, so their squares add up.",
              "Las dos partes juntas son el arreglo completo, así que sus cuadros se suman.",
            ),
          },
          {
            t: L("Multiply them.", "Multiplicarlos."),
            ok: false,
            why: L(
              "Multiplying would count far more squares than the array has.",
              "Multiplicar contaría muchos más cuadros de los que tiene el arreglo.",
            ),
          },
        ],
        explain: [
          {
            t: L(
              "Because the two parts are pieces of one array, so together they make all of it.",
              "Porque las dos partes son trozos de un arreglo, así que juntas lo forman completo.",
            ),
            ok: true,
          },
          {
            t: L("Because adding is always easier.", "Porque sumar siempre es más fácil."),
            ok: false,
          },
        ],
      },
    ];
  if (s.kind === "model")
    return [
      {
        at: 1,
        q: L(
          `After finding every small product, what do we do to get ${s.a} × ${s.b}?`,
          `Después de hallar cada producto pequeño, ¿qué hacemos para obtener ${s.a} × ${s.b}?`,
        ),
        choices: [
          {
            t: L("Add all the small products.", "Sumar todos los productos pequeños."),
            ok: true,
            why: L(
              "The small rectangles together fill the whole rectangle, so their areas add.",
              "Los rectángulos pequeños juntos llenan el rectángulo entero, así que sus áreas se suman.",
            ),
          },
          {
            t: L("Multiply the small products.", "Multiplicar los productos pequeños."),
            ok: false,
            why: L(
              "Multiplying areas does not give an area of the big rectangle. Areas of pieces add.",
              "Multiplicar áreas no da el área del rectángulo grande. Las áreas de las partes se suman.",
            ),
          },
          {
            t: L("Use only the biggest piece.", "Usar solo la parte mayor."),
            ok: false,
            why: L(
              "The smaller pieces are part of the rectangle too. Leaving one out gives too little.",
              "Las partes menores también son del rectángulo. Dejar una fuera da muy poco.",
            ),
          },
        ],
        explain: [
          {
            t: L(
              "Because the small rectangles fit together to make the big one.",
              "Porque los rectángulos pequeños encajan para formar el grande.",
            ),
            ok: true,
          },
          {
            t: L(
              "Because the biggest part decides the answer.",
              "Porque la parte mayor decide la respuesta.",
            ),
            ok: false,
          },
        ],
      },
    ];
  if (s.kind === "divide")
    return [
      {
        at: 1,
        q: L(
          `We put ${s.d} squares in each row. What does the number of rows tell us?`,
          `Ponemos ${s.d} cuadros en cada fila. ¿Qué nos dice el número de filas?`,
        ),
        choices: [
          {
            t: L(
              `How many groups of ${s.d} fit in ${s.n}.`,
              `Cuántos grupos de ${s.d} caben en ${s.n}.`,
            ),
            ok: true,
            why: L(
              "Each row is one group of the divisor, so the row count is the quotient.",
              "Cada fila es un grupo del divisor, así que el número de filas es el cociente.",
            ),
          },
          {
            t: L(`How many squares there are in all.`, `Cuántos cuadros hay en total.`),
            ok: false,
            why: L(`The total is ${s.n} and does not change.`, `El total es ${s.n} y no cambia.`),
          },
        ],
      },
    ];
  if (s.kind === "triangle")
    return [
      {
        at: 1,
        q: L(
          "Two equal triangles make the rectangle. How does one triangle's area compare?",
          "Dos triángulos iguales forman el rectángulo. ¿Cómo es el área de un triángulo?",
        ),
        choices: [
          {
            t: L("Half of the rectangle.", "La mitad del rectángulo."),
            ok: true,
            why: L(
              "Two equal pieces that fill the rectangle: each is half.",
              "Dos partes iguales que llenan el rectángulo: cada una es la mitad.",
            ),
          },
          {
            t: L("The same as the rectangle.", "Igual que el rectángulo."),
            ok: false,
            why: L(
              "The triangle covers only part of the rectangle.",
              "El triángulo cubre solo una parte del rectángulo.",
            ),
          },
        ],
      },
    ];
  return [];
}

export function hints(s) {
  const list = frames(s);
  // Never a frame that already shows the total: the first picture that sets up the structure.
  const mid = list.find((f) => ["split", "rows", "row", "four", "cut", "stack"].includes(f.id)) || list[0];
  const texts = {
    array: [
      L(
        "Picture equal rows. Could you split the array into two easier facts?",
        "Imagina filas iguales. ¿Podrías dividir el arreglo en dos datos más fáciles?",
      ),
      L(
        "Break the bigger factor into 5 and the rest.",
        "Descompón el factor mayor en 5 y el resto.",
      ),
    ],
    model: [
      L(
        "Split each number by place value and look for easier products.",
        "Divide cada número por valor posicional y busca productos más fáciles.",
      ),
      L(
        "Find the product of every pair of parts, then add them all.",
        "Halla el producto de cada par de partes y luego súmalos todos.",
      ),
    ],
    divide: [
      L(
        "Think: what number of groups of the divisor fits in the total?",
        "Piensa: ¿cuántos grupos del divisor caben en el total?",
      ),
      L(
        "Put the divisor in each row and count rows.",
        "Pon el divisor en cada fila y cuenta las filas.",
      ),
    ],
    area: [
      L(
        "Area counts square units inside. How many in one row?",
        "El área cuenta unidades cuadradas dentro. ¿Cuántas hay en una fila?",
      ),
      L("Count one row, then think how many rows.", "Cuenta una fila y piensa cuántas filas hay."),
    ],
    perimeter: [
      L(
        "Perimeter is the distance around. Which sides do you need to add?",
        "El perímetro es la distancia alrededor. ¿Qué lados debes sumar?",
      ),
      L(
        "A rectangle has four sides. Opposite sides match.",
        "Un rectángulo tiene cuatro lados. Los lados opuestos son iguales.",
      ),
    ],
    triangle: [
      L(
        "Draw a rectangle around the triangle. What part is the triangle?",
        "Dibuja un rectángulo alrededor del triángulo. ¿Qué parte es el triángulo?",
      ),
      L(
        "Find the rectangle's area first, then take half.",
        "Halla primero el área del rectángulo y luego toma la mitad.",
      ),
    ],
    volume: [
      L(
        "Volume counts cubes. How many cubes make one layer?",
        "El volumen cuenta cubos. ¿Cuántos cubos forman una capa?",
      ),
      L(
        "Find the cubes in one layer, then count the layers.",
        "Halla los cubos de una capa y cuenta las capas.",
      ),
    ],
  }[s.kind];
  return [
    { text: texts[0] },
    {
      text: L(
        "The picture shows the shape of the problem.",
        "El dibujo muestra la forma del problema.",
      ),
      frame: mid,
    },
    { text: texts[1], frame: list[0] },
  ];
}

export function diagnose(s, raw) {
  const v = num(raw);
  if (v === null || v === s.total) return null;
  if (s.kind === "array" || s.kind === "model") return v === s.a + s.b ? "addedFactors" : null;
  if (s.kind === "area") return v === 2 * (s.l + s.w) ? "perimeterForArea" : null;
  if (s.kind === "perimeter")
    return v === s.l * s.w ? "areaForPerimeter" : v === s.l + s.w ? "halfAround" : null;
  if (s.kind === "triangle") return v === s.b * s.h ? "forgotHalf" : null;
  if (s.kind === "divide") return v === s.n - s.d ? "subtracted" : null;
  return null;
}
export const tags = {
  addedFactors: {
    label: L("Added the factors", "Sumó los factores"),
    tip: L(
      "Multiplying counts equal rows. Build the array and count all the squares.",
      "Multiplicar cuenta filas iguales. Arma el arreglo y cuenta todos los cuadros.",
    ),
  },
  perimeterForArea: {
    label: L("Found the perimeter instead of the area", "Halló el perímetro en lugar del área"),
    tip: L(
      "Area covers the inside with squares; perimeter is only the edge. Fill the rectangle with rows.",
      "El área cubre el interior con cuadros; el perímetro es solo el borde. Llena el rectángulo con filas.",
    ),
  },
  areaForPerimeter: {
    label: L("Found the area instead of the perimeter", "Halló el área en lugar del perímetro"),
    tip: L(
      "Perimeter is the distance around the edge. Add the four sides.",
      "El perímetro es la distancia por el borde. Suma los cuatro lados.",
    ),
  },
  halfAround: {
    label: L("Added only two sides", "Sumó solo dos lados"),
    tip: L(
      "A rectangle has four sides. Opposite sides are equal, so add all four.",
      "Un rectángulo tiene cuatro lados. Los opuestos son iguales, así que suma los cuatro.",
    ),
  },
  forgotHalf: {
    label: L("Found the rectangle, not the triangle", "Halló el rectángulo, no el triángulo"),
    tip: L(
      "The triangle is half of the rectangle. Take half of the product.",
      "El triángulo es la mitad del rectángulo. Toma la mitad del producto.",
    ),
  },
  subtracted: {
    label: L("Subtracted instead of dividing", "Restó en lugar de dividir"),
    tip: L(
      "Dividing asks how many equal groups fit. Make rows of the divisor and count the rows.",
      "Dividir pregunta cuántos grupos iguales caben. Haz filas del divisor y cuenta las filas.",
    ),
  },
};

// ----- Build -----
const hasBuild = (s) => (s.kind === "array" && s.b >= 6) || (s.kind === "model" && (s.pa.length > 1 || s.pb.length > 1)) || s.kind === "divide" || s.kind === "area" || s.kind === "perimeter";
export const build = {
  available: hasBuild,
  prompt(s) {
    if (s.kind === "divide")
      return L(
        `Arrange the ${s.n} squares in rows of ${s.d}.`,
        `Acomoda los ${s.n} cuadros en filas de ${s.d}.`,
      );
    if (s.kind === "area" || s.kind === "perimeter")
      return L(
        `Build a rectangle ${s.l} long and ${s.w} wide.`,
        `Construye un rectángulo de ${s.l} de largo y ${s.w} de ancho.`,
      );
    return L(
      `Split ${bigger(s)} into two parts to make easier facts. Try to make one part ${s.kind === "array" ? "5" : "a number of tens"}.`,
      `Divide ${bigger(s)} en dos partes para hacer datos más fáciles. Intenta que una parte sea ${s.kind === "array" ? "5" : "un número de decenas"}.`,
    );
  },
  init: (s) =>
    s.kind === "divide"
      ? { per: 12 }
      : s.kind === "area" || s.kind === "perimeter"
        ? { l: 1, w: 1 }
        : { s: Math.max(1, Math.floor(bigger(s) / 2)) },
  render(st, s) {
    const stepper = (id, arg, label) => ({ id, arg, label });
    if (s.kind === "divide") {
      const rows = Math.ceil(s.n / st.per);
      const cell = Math.min(30, 420 / st.per, 190 / rows);
      let out = "";
      for (let i = 0; i < s.n; i += 1)
        out += keyed(
          `t${i}`,
          280 - (st.per * cell) / 2 + (i % st.per) * cell,
          36 + Math.floor(i / st.per) * cell,
          `<rect width="${cell - 3}" height="${cell - 3}" rx="4" fill="${Math.floor(i / st.per) % 2 ? COLORS.hundreds : COLORS.whole}" fill-opacity=".9"/>`,
        );
      const done = st.per === s.d;
      const alt = L(
        `${s.n} squares in rows of ${st.per}: ${rows} rows${s.n % st.per ? " with some left over" : ""}.`,
        `${s.n} cuadros en filas de ${st.per}: ${rows} filas.`,
      );
      return {
        svg: wrap(out).replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
        alt,
        controls: [
          stepper("per", -1, L("Fewer in a row", "Menos por fila")),
          stepper("per", 1, L("More in a row", "Más por fila")),
        ],
        status: done
          ? L(
              `${rows} rows of ${s.d}. So ${s.n} ÷ ${s.d} = ${rows}.`,
              `${rows} filas de ${s.d}. Así ${s.n} ÷ ${s.d} = ${rows}.`,
            )
          : L(
              `${st.per} in a row makes ${rows} row${rows > 1 ? "s" : ""}${s.n % st.per ? ", but the last row is not full" : ""}.`,
              `${st.per} por fila hace ${rows} fila${rows > 1 ? "s" : ""}.`,
            ),
      };
    }
    if (s.kind === "area" || s.kind === "perimeter") {
      const g = grid(st.w, st.l, { max: 440, hmax: 170 });
      const val = s.kind === "area" ? st.l * st.w : 2 * (st.l + st.w);
      const done = st.l === s.l && st.w === s.w;
      const alt = L(`A rectangle ${st.l} by ${st.w}.`, `Un rectángulo de ${st.l} por ${st.w}.`);
      const label =
        s.kind === "area"
          ? L(
              `Area so far: ${st.l} × ${st.w} = ${val}`,
              `Área hasta ahora: ${st.l} × ${st.w} = ${val}`,
            )
          : L(
              `Perimeter so far: ${st.l} + ${st.w} + ${st.l} + ${st.w} = ${val}`,
              `Perímetro hasta ahora: ${st.l} + ${st.w} + ${st.l} + ${st.w} = ${val}`,
            );
      return {
        svg: wrap(g.out).replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
        alt,
        controls: [
          stepper("l", -1, L("Shorter", "Más corto")),
          stepper("l", 1, L("Longer", "Más largo")),
          stepper("w", -1, L("Less wide", "Menos ancho")),
          stepper("w", 1, L("Wider", "Más ancho")),
        ],
        status: done
          ? L(`That is the rectangle. ${label.en}`, `Ese es el rectángulo. ${label.es}`)
          : label,
      };
    }
    const n = bigger(s);
    const other = s.a === n ? s.b : s.a;
    const [p1, p2] = [st.s, n - st.s];
    const alt = L(`${n} split into ${p1} and ${p2}.`, `${n} dividido en ${p1} y ${p2}.`);
    const done = s.kind === "array" ? p1 === 5 || p2 === 5 : p1 % 10 === 0 && p2 < 10 && p1 > 0;
    const w = 400;
    const out = `<rect x="90" y="60" width="${(p1 / n) * w}" height="120" rx="8" fill="${COLORS.whole}" fill-opacity=".85"/><rect x="${90 + (p1 / n) * w + 6}" y="60" width="${(p2 / n) * w - 6}" height="120" rx="8" fill="${COLORS.hundreds}" fill-opacity=".85"/>${txt(90 + (p1 / n) * w * 0.5, 128, `${other} × ${p1} = ${other * p1}`, { size: 17, fill: "#fff" })}${txt(90 + (p1 / n) * w + (p2 / n) * w * 0.5, 128, `${other} × ${p2} = ${other * p2}`, { size: 17, fill: "#fff" })}${txt(290, 46, `${n} = ${p1} + ${p2}`, { size: 20 })}${txt(290, 214, `${other * p1} + ${other * p2} = ${other * n}`, { size: 22 })}`;
    return {
      svg: wrap(out, 240).replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
      alt,
      controls: [
        stepper("s", -1, L("Move the split left", "Mover el corte a la izquierda")),
        stepper("s", 1, L("Move the split right", "Mover el corte a la derecha")),
      ],
      status: done
        ? L(
            `Nice split! ${other} × ${p1} and ${other} × ${p2} are easy, and they add to ${other * n}.`,
            `¡Buen corte! ${other} × ${p1} y ${other} × ${p2} son fáciles y suman ${other * n}.`,
          )
        : L(
            `Any split works because the parts add to the whole. Try for an easier fact.`,
            `Cualquier corte sirve porque las partes suman el todo. Busca un dato más fácil.`,
          ),
    };
  },
  act(st, id, arg, s) {
    if (id === "per") {
      const per = st.per + arg;
      return per < 1 || per > 12
        ? { state: st, ok: false, msg: L("That is as far as this goes.", "Hasta aquí se puede.") }
        : { state: { per }, ok: true };
    }
    if (id === "l" || id === "w") {
      const v = Math.min(20, Math.max(1, st[id] + arg));
      return { state: { ...st, [id]: v }, ok: v !== st[id] };
    }
    const sp = st.s + arg;
    return sp < 1 || sp > bigger(s) - 1
      ? {
          state: st,
          ok: false,
          msg: L("Both parts need at least 1.", "Cada parte necesita al menos 1."),
        }
      : { state: { s: sp }, ok: true };
  },
  done(st, s) {
    if (s.kind === "divide") return st.per === s.d;
    if (s.kind === "area" || s.kind === "perimeter") return st.l === s.l && st.w === s.w;
    const n = bigger(s);
    return s.kind === "array"
      ? st.s === 5 || n - st.s === 5
      : st.s % 10 === 0 && n - st.s < 10 && st.s > 0;
  },
};
const bigger = (s) => (s.kind === "array" ? Math.max(s.a, s.b) : s.kind === "model" ? (s.pa.length > s.pb.length || (s.pa.length === s.pb.length && s.a >= s.b) ? s.a : s.b) : 0);
