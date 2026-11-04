// Original mathematical artwork, one piece per grade, each drawn from a small exact data set. artFacts(grade) is the data
// (and what the tests check); drawArt(grade) turns it into SVG. Nothing here is decoration: every picture shows a true
// relationship (6 + 4 = 10, 3 + 4 = 7, 134 as blocks, 3 × 4 = 12, 3/4 on a fraction wall, 3 × 2 × 2 = 12, 2:3 scaled,
// y = 2x, and a slope of 1/2) that the grade actually teaches.
import { s, text } from "./views/common.js";

export const ART_FACTS = {
  0: { kind: "tenframe", filled: 6, cells: 10, caption: "6 and 4 make 10" },
  1: { kind: "path", from: 0, hops: [3, 4], to: 7, caption: "3 + 4 = 7" },
  2: { kind: "blocks", hundreds: 1, tens: 3, ones: 4, value: 134, caption: "1 hundred, 3 tens, 4 ones is 134" },
  3: { kind: "array", rows: 3, cols: 4, total: 12, caption: "3 × 4 = 12" },
  4: { kind: "wall", rows: [1, 2, 4, 8], shadedRow: 2, shadedParts: 3, caption: "3/4 on a fraction wall" },
  5: { kind: "cubes", length: 3, width: 2, height: 2, volume: 12, caption: "3 × 2 × 2 = 12 cubic units" },
  6: { kind: "dnl", top: [0, 2, 4, 6], bottom: [0, 3, 6, 9], caption: "2 : 3 scaled by 3 is 6 : 9" },
  7: { kind: "plane", slope: 2, points: [[0, 0], [1, 2], [2, 4], [3, 6]], caption: "y = 2x through the origin" },
  8: { kind: "slope", rise: 1, run: 2, intercept: 1, caption: "slope 1/2, y-intercept 1" },
};

// What the picture is worth, in numbers: used by the tests to prove the art is mathematically true.
export function artFacts(grade) {
  const f = ART_FACTS[grade] ?? ART_FACTS[4];
  switch (f.kind) {
    case "tenframe": return { ...f, ok: f.filled + (f.cells - f.filled) === f.cells && f.filled === 6 };
    case "path": return { ...f, ok: f.from + f.hops.reduce((a, b) => a + b, 0) === f.to };
    case "blocks": return { ...f, ok: f.hundreds * 100 + f.tens * 10 + f.ones === f.value };
    case "array": return { ...f, ok: f.rows * f.cols === f.total };
    case "wall": return { ...f, ok: f.rows[f.shadedRow] === 4 && f.shadedParts === 3 };
    case "cubes": return { ...f, ok: f.length * f.width * f.height === f.volume };
    case "dnl": return { ...f, ok: f.top.every((v, i) => v * 1.5 === f.bottom[i]) };
    case "plane": return { ...f, ok: f.points.every(([x, y]) => y === f.slope * x) };
    default: return { ...f, ok: f.rise / f.run === 0.5 };
  }
}

const rect = (x, y, w, h, cls, rx = 3) => s("rect", { x, y, width: w, height: h, rx, class: cls });
const line = (x1, y1, x2, y2, cls) => s("line", { x1, y1, x2, y2, class: cls });

export function drawArt(grade) {
  const f = ART_FACTS[grade] ?? ART_FACTS[4];
  const svg = s("svg", { viewBox: "0 0 640 200", class: `mr-art mr-art-${f.kind}`, role: "img", "aria-label": f.caption, preserveAspectRatio: "xMidYMid meet" });
  const g = s("g", {});
  svg.append(g);
  switch (f.kind) {
    case "tenframe":
      for (let i = 0; i < f.cells; i++) {
        const x = 150 + (i % 5) * 70;
        const y = 36 + Math.floor(i / 5) * 70;
        g.append(rect(x, y, 62, 62, "mr-art-cell", 10));
        if (i < f.filled) g.append(s("circle", { cx: x + 31, cy: y + 31, r: 22, class: "mr-art-a" }));
      }
      break;
    case "path": {
      g.append(line(40, 140, 600, 140, "mr-art-line"));
      for (let v = 0; v <= 10; v++) {
        g.append(line(40 + v * 56, 132, 40 + v * 56, 148, "mr-art-line"));
        g.append(text(40 + v * 56, 172, v, "mr-art-t"));
      }
      let at = f.from;
      f.hops.forEach((h, i) => {
        const x1 = 40 + at * 56;
        const x2 = 40 + (at + h) * 56;
        g.append(s("path", { d: `M ${x1} 136 Q ${(x1 + x2) / 2} 40 ${x2} 136`, class: i ? "mr-art-b-stroke" : "mr-art-a-stroke" }));
        g.append(text((x1 + x2) / 2, 72, `+${h}`, "mr-art-t"));
        at += h;
      });
      g.append(s("circle", { cx: 40 + f.to * 56, cy: 140, r: 9, class: "mr-art-c" }));
      break;
    }
    case "blocks": {
      g.append(rect(60, 40, 130, 130, "mr-art-a"));
      for (let i = 1; i < 10; i++) {
        g.append(line(60 + i * 13, 40, 60 + i * 13, 170, "mr-art-grid"));
        g.append(line(60, 40 + i * 13, 190, 40 + i * 13, "mr-art-grid"));
      }
      for (let i = 0; i < f.tens; i++) g.append(rect(240 + i * 40, 40, 26, 130, "mr-art-b"));
      for (let i = 0; i < f.ones; i++) g.append(rect(400 + (i % 2) * 36, 40 + Math.floor(i / 2) * 36, 26, 26, "mr-art-c"));
      break;
    }
    case "array":
      for (let r = 0; r < f.rows; r++) for (let c = 0; c < f.cols; c++) g.append(s("circle", { cx: 130 + c * 72, cy: 50 + r * 50, r: 20, class: `mr-art-${"abc"[r % 3]}` }));
      for (let r = 0; r < f.rows; r++) g.append(rect(100, 24 + r * 50, f.cols * 72 + 4, 52, "mr-art-frame", 26));
      g.append(text(500, 110, `${f.rows} × ${f.cols} = ${f.total}`, "mr-art-eq"));
      break;
    case "wall":
      f.rows.forEach((parts, i) => {
        const w = 520 / parts;
        for (let k = 0; k < parts; k++) g.append(rect(60 + k * w, 24 + i * 40, w - 3, 34, i === f.shadedRow && k < f.shadedParts ? "mr-art-a" : "mr-art-cell", 6));
      });
      break;
    case "cubes": {
      const u = 34;
      for (let z = 0; z < f.height; z++) for (let y = 0; y < f.width; y++) for (let x = 0; x < f.length; x++) {
        const ox = 200 + (x - y) * u * 0.866 + 0;
        const oy = 130 + (x + y) * u * 0.5 - z * u;
        g.append(s("polygon", { points: `${ox},${oy - u} ${ox + u * 0.866},${oy - u / 2} ${ox},${oy} ${ox - u * 0.866},${oy - u / 2}`, class: "mr-art-a" }));
        g.append(s("polygon", { points: `${ox - u * 0.866},${oy - u / 2} ${ox},${oy} ${ox},${oy + u} ${ox - u * 0.866},${oy + u / 2}`, class: "mr-art-b" }));
        g.append(s("polygon", { points: `${ox + u * 0.866},${oy - u / 2} ${ox},${oy} ${ox},${oy + u} ${ox + u * 0.866},${oy + u / 2}`, class: "mr-art-c" }));
      }
      break;
    }
    case "dnl":
      for (const [row, y, label] of [[f.top, 70, "a"], [f.bottom, 140, "b"]]) {
        g.append(line(40, y, 600, y, "mr-art-line"));
        row.forEach((v, i) => {
          const x = 40 + (i / (row.length - 1)) * 520;
          g.append(line(x, y - 8, x, y + 8, "mr-art-line"));
          g.append(s("circle", { cx: x, cy: y, r: 8, class: `mr-art-${label}` }));
          g.append(text(x, y + (y < 100 ? -16 : 28), v, "mr-art-t"));
        });
      }
      f.top.forEach((_, i) => { const x = 40 + (i / (f.top.length - 1)) * 520; g.append(line(x, 78, x, 132, "mr-art-grid")); });
      break;
    case "plane":
      g.append(rect(120, 14, 360, 172, "mr-art-cell", 6));
      for (let i = 0; i <= 8; i++) g.append(line(120 + i * 45, 14, 120 + i * 45, 186, "mr-art-grid"));
      g.append(line(120, 186, 480, 14, "mr-art-a-stroke"));
      f.points.forEach(([x, y]) => g.append(s("circle", { cx: 120 + x * 45, cy: 186 - y * 10.75, r: 7, class: "mr-art-c" })));
      break;
    default: {
      const U = 21.5;
      const px = (x) => 120 + x * U;
      const py = (y) => 186 - y * U;
      g.append(rect(120, 14, 344, 172, "mr-art-cell", 6));
      for (let i = 0; i <= 16; i += 2) g.append(line(px(i), 14, px(i), 186, "mr-art-grid"));
      for (let i = 0; i <= 8; i += 2) g.append(line(120, py(i), 464, py(i), "mr-art-grid"));
      // y = x/2 + 1, from x = 0 to the top edge at x = 14
      g.append(line(px(0), py(1), px(14), py(8), "mr-art-a-stroke"));
      const [x0, y0] = [4, 4 / 2 + 1];
      const [x1, y1] = [x0 + f.run, y0 + f.rise];
      g.append(s("path", { d: `M ${px(x0)} ${py(y0)} H ${px(x1)} V ${py(y1)}`, class: "mr-art-b-stroke" }));
      g.append(s("circle", { cx: px(x0), cy: py(y0), r: 6, class: "mr-art-c" }));
      g.append(s("circle", { cx: px(x1), cy: py(y1), r: 6, class: "mr-art-c" }));
      g.append(text((px(x0) + px(x1)) / 2, py(y0) + 22, `run ${f.run}`, "mr-art-t"));
      g.append(text(px(x1) + 34, (py(y0) + py(y1)) / 2 + 5, `rise ${f.rise}`, "mr-art-t"));
    }
  }
  return svg;
}
