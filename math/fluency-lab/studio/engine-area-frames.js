// Frames for the area engine: arrays, area models, division, and rectangle area, perimeter, triangle and volume.
// Split from engine-area.js to keep each file short. A split never changes the whole: frames record `parts` and
// `total` so the tests can check that the partial products always add to the product.
import { COLORS, PLACE_COLORS, L, esc, frame, keyed, svgWrap, txt } from "./core.js";

export function grid(
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
export const wrap = (body, h = 260) => svgWrap(body, "", { h });
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
