// The Living Mathematics Studio hero sculpture: one interactive, dimensional model per grade band. Each scene
// is drawn as layered SVG slabs (front, top and side faces lit from the upper left) and always shows a real
// relationship the learner can change: making ten (K-2), equivalent fractions on one ribbon (3-4), equal
// ratios on a lattice (5-6) and rate of change on a line (7-8). Controls are real buttons; the equation and a
// plain-language description are announced through one polite live region. The math helpers are pure and
// exported for tests (tools/fluency-atelier.test.mjs).
import { t } from "../i18n.js";

export const BANDS = Object.freeze({
  early: [0, 1, 2],
  discover: [3, 4],
  design: [5, 6],
  analyze: [7, 8],
});
export const bandFor = (grade) =>
  Object.entries(BANDS).find(([, grades]) => grades.includes(Number(grade)))?.[0] || "discover";

const MINUS = "−";
const sign = (n) => (n < 0 ? `${MINUS}${Math.abs(n)}` : String(n));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

// ---- pure mathematics ------------------------------------------------------------------------------------------
// Adding b to a: when the sum passes ten, `fill` counters complete the first ten-frame and `rest` start the next.
export function makeTen(a, b) {
  const sum = a + b;
  const fill = sum > 10 ? 10 - a : b;
  return { sum, fill, rest: b - fill, crosses: sum > 10 };
}

// Every denominator d in `dens` where p/q can be written exactly as k/d.
export function equivalents(p, q, dens) {
  return dens.filter((d) => (p * d) % q === 0).map((d) => ({ n: (p * d) / q, d }));
}

// Equal ratios a:b scaled by 0, 1, 2 ... while both coordinates stay within `max`.
export function ratioPoints(a, b, max) {
  const points = [];
  for (let k = 0; k * a <= max && k * b <= max; k += 1) points.push({ k, x: k * a, y: k * b });
  return points;
}

// A slope written as a reduced fraction rise/run with a positive run.
export function slopeParts(num, den) {
  const g = gcd(num, den) || 1;
  return { rise: num / g, run: den / g };
}

// Lattice points of y = (rise/run)x + b inside [-range, range]; slope triangles start at two of them.
export function lineLattice(rise, run, b, range) {
  const points = [];
  for (let x = -range; x <= range; x += 1) {
    const y = (rise * x) / run + b;
    if (Number.isInteger(y) && Math.abs(y) <= range) points.push({ x, y });
  }
  return points;
}

export const fractionText = (n, d) => (d === 1 ? sign(n) : `${sign(n)}/${d}`);
// A coefficient written before a variable: (3/2)x, never the ambiguous 3/2x.
export const coefText = (n, d) => (d === 1 ? sign(n) : `(${fractionText(n, d)})`);
// The x-term of a line: x, −x, 2x or (3/2)x.
export const xTerm = (n, d) => (n === d ? "x" : n === -d ? `${MINUS}x` : `${coefText(n, d)}x`);

// ---- drawing helpers -------------------------------------------------------------------------------------------
const DEPTH = { dx: 9, dy: -7 };
// A lit slab: front face plus the top and right faces of its extrusion.
function slab(
  x,
  y,
  w,
  h,
  { front, top, side, stroke = "rgba(8,15,37,.28)", cls = "", depth = DEPTH, attrs = "" },
) {
  const { dx, dy } = depth;
  return `<g class="at-slab ${cls}" ${attrs}>
    <path d="M${x} ${y}l${dx} ${dy}h${w}l${-dx} ${-dy}z" fill="${top}" stroke="${stroke}" stroke-width=".8"/>
    <path d="M${x + w} ${y}l${dx} ${dy}v${h}l${-dx} ${-dy}z" fill="${side}" stroke="${stroke}" stroke-width=".8"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${front}" stroke="${stroke}" stroke-width=".8"/>
  </g>`;
}

const defs = (id) => `<defs>
  <linearGradient id="${id}-teal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5cc7bb"/><stop offset="1" stop-color="#087e88"/></linearGradient>
  <linearGradient id="${id}-copper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1bf9f"/><stop offset="1" stop-color="#c97d5d"/></linearGradient>
  <linearGradient id="${id}-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdfbf5" stop-opacity=".2"/><stop offset="1" stop-color="#c7d5de" stop-opacity=".07"/></linearGradient>
  <linearGradient id="${id}-porcelain" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdfbf5"/><stop offset="1" stop-color="#e9e2d5"/></linearGradient>
  <radialGradient id="${id}-glow" cx=".35" cy=".25" r=".8"><stop offset="0" stop-color="#85d8cb" stop-opacity=".28"/><stop offset=".6" stop-color="#28447c" stop-opacity=".08"/><stop offset="1" stop-color="#080f25" stop-opacity="0"/></radialGradient>
  <radialGradient id="${id}-counter-a" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ffe2cf"/><stop offset=".55" stop-color="#e6a688"/><stop offset="1" stop-color="#a65f45"/></radialGradient>
  <radialGradient id="${id}-counter-b" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#d5f5ef"/><stop offset=".55" stop-color="#85d8cb"/><stop offset="1" stop-color="#087e88"/></radialGradient>
  <filter id="${id}-contact" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>`;

const floor = (id, cx, cy, rx) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.11}" fill="#02060f" opacity=".32" filter="url(#${id}-contact)"/>`;

// ---- scenes -----------------------------------------------------------------------------------------------------
// Each scene: initial state, the controls it offers, a pure step(), draw() and words().
const SCENES = {
  early: {
    init: (grade) =>
      grade === 0 ? { a: 3, b: 4, max: 5, made: false } : { a: 8, b: 5, max: 9, made: false },
    controls: (s) => [
      { id: "a", label: t("First number"), value: s.a },
      { id: "b", label: t("Number to add"), value: s.b },
    ],
    step(s, id, delta) {
      const next = { ...s, made: false };
      next[id] = Math.min(s.max, Math.max(1, s[id] + delta));
      return next;
    },
    action: (s) =>
      makeTen(s.a, s.b).crosses
        ? { id: "make", label: s.made ? t("Show the groups again") : t("Make a ten") }
        : null,
    act: (s) => ({ ...s, made: !s.made }),
    draw(s, id) {
      const { fill, rest, crosses, sum } = makeTen(s.a, s.b);
      const cell = 46;
      const frames = crosses || s.a + s.b > 10 ? 2 : 1;
      const frameW = cell * 5;
      const ox = frames === 2 ? 34 : 152;
      let out = floor(id, 280, 352, 230);
      const counters = [];
      // Counters for the first number fill frame 1 from the left; the added counters follow. Before "make a ten"
      // the added counters sit in their own row so the two groups stay visible.
      for (let i = 0; i < s.a; i += 1) counters.push({ frame: 0, slot: i, kind: "a" });
      for (let i = 0; i < s.b; i += 1) {
        if (s.made || !crosses)
          counters.push(
            i < fill
              ? { frame: 0, slot: s.a + i, kind: "b" }
              : { frame: 1, slot: i - fill, kind: "b" },
          );
        else counters.push({ frame: 1, slot: i, kind: "b" });
      }
      for (let f = 0; f < frames; f += 1) {
        const fx = ox + f * (frameW + 40);
        out += slab(fx - 8, 150, frameW + 16, cell * 2 + 16, {
          front: `url(#${id}-porcelain)`,
          top: "#fffaf0",
          side: "#cfc6b5",
          depth: { dx: 14, dy: -11 },
        });
        for (let r = 0; r < 2; r += 1)
          for (let c = 0; c < 5; c += 1)
            out += `<rect x="${fx + c * cell + 3}" y="${158 + r * cell + 3}" width="${cell - 6}" height="${cell - 6}" rx="7" fill="#e9e2d5" stroke="#b9ae9b" stroke-width="1"/>`;
      }
      counters.forEach((counter, index) => {
        const fx = ox + counter.frame * (frameW + 40);
        const cx = fx + (counter.slot % 5) * cell + cell / 2;
        const cy = 158 + Math.floor(counter.slot / 5) * cell + cell / 2;
        out += `<g class="at-counter" style="--i:${index};transform:translate(${cx}px,${cy}px)"><ellipse cx="2" cy="6" rx="16" ry="6" fill="#13294b" opacity=".25"/><circle r="16" fill="url(#${id}-counter-${counter.kind})" stroke="${counter.kind === "a" ? "#8e4f38" : "#05545c"}" stroke-width="1.2"/>${counter.kind === "b" ? '<circle r="5" fill="none" stroke="#05545c" stroke-width="1.6" opacity=".7"/>' : ""}</g>`;
      });
      const caption = crosses
        ? s.made
          ? `${s.a} + ${fill} + ${rest} = 10 + ${rest} = ${sum}`
          : `${s.a} + ${s.b} = ?`
        : `${s.a} + ${s.b} = ${sum}`;
      out += `<text class="at-eq" x="280" y="78" text-anchor="middle">${esc(caption)}</text>`;
      return out;
    },
    words(s) {
      const { fill, rest, crosses, sum } = makeTen(s.a, s.b);
      if (!crosses)
        return t("{a} and {b} make {sum}. The ten-frame shows both groups.", {
          a: s.a,
          b: s.b,
          sum,
        });
      return s.made
        ? t(
            "Move {fill} counters to fill the first ten-frame. {a} + {b} is 10 and {rest} more, which is {sum}.",
            { fill, a: s.a, b: s.b, rest, sum },
          )
        : t("{a} counters and {b} counters. Can you make a ten first?", { a: s.a, b: s.b });
    },
  },

  discover: {
    init: (grade) => ({
      p: 3,
      q: 4,
      dens: grade === 3 ? [2, 3, 4, 6, 8] : [2, 3, 4, 5, 6, 8, 10, 12],
    }),
    controls: (s) => [
      { id: "p", label: t("Shaded parts"), value: s.p },
      { id: "q", label: t("Equal parts"), value: s.q },
    ],
    step(s, id, delta) {
      if (id === "q") {
        const index = Math.min(s.dens.length - 1, Math.max(0, s.dens.indexOf(s.q) + delta));
        const q = s.dens[index];
        return { ...s, q, p: Math.min(s.p, q) };
      }
      return { ...s, p: Math.min(s.q, Math.max(1, s.p + delta)) };
    },
    draw(s, id) {
      const x0 = 70;
      const w = 400;
      const rowH = 28;
      const gap = 36 - Math.max(0, s.dens.length - 5) * 3;
      const top = 210 - (s.dens.length * gap) / 2;
      const matches = new Map(equivalents(s.p, s.q, s.dens).map((e) => [e.d, e.n]));
      let out = floor(id, 290, 372, 250);
      const at = (row) => x0 + (s.dens.length - 1 - row) * 6 + (w * s.p) / s.q;
      s.dens.forEach((d, row) => {
        // Rows recede: each one sits further back and a little higher, like a stack of ribbons on a table.
        const y = top + row * gap;
        const shift = (s.dens.length - 1 - row) * 6;
        const x = x0 + shift;
        const part = w / d;
        const hit = matches.has(d);
        const shaded = hit ? matches.get(d) : Math.floor((d * s.p) / s.q);
        out += `<g class="at-row${hit ? " is-hit" : ""}${d === s.q ? " is-source" : ""}">`;
        for (let k = 0; k < d; k += 1) {
          const on = k < shaded;
          out += slab(x + k * part, y, part, rowH, {
            front: on ? (hit ? `url(#${id}-teal)` : "#3f5f8f") : `url(#${id}-glass)`,
            top: on ? (hit ? "#a6e6dc" : "#6d86ad") : "rgba(253,251,245,.16)",
            side: on ? (hit ? "#05545c" : "#28447c") : "rgba(199,213,222,.08)",
            stroke: "rgba(199,213,222,.45)",
            depth: { dx: 6, dy: -5 },
          });
        }
        out += `<text class="at-row-label" x="${x - 14}" y="${y + rowH / 2 + 5}" text-anchor="end">${hit ? esc(`${matches.get(d)}/${d}`) : esc(`1/${d}`)}</text></g>`;
      });
      // The measuring line follows the rows' perspective offset, so it marks p/q on every ribbon.
      const pts = s.dens.map((_, row) => `${at(row)} ${top + row * gap + rowH / 2}`);
      out += `<path class="at-measure" d="M${at(0)} ${top - 22}L${pts.join("L")}L${at(s.dens.length - 1)} ${top + (s.dens.length - 1) * gap + rowH + 14}" fill="none"/>`;
      const eq = [...matches.entries()].map(([d, n]) => `${n}/${d}`);
      out += `<text class="at-eq" x="280" y="48" text-anchor="middle">${esc(eq.join(" = ") || `${s.p}/${s.q}`)}</text>`;
      return out;
    },
    words(s) {
      const eq = equivalents(s.p, s.q, s.dens).map((e) => `${e.n}/${e.d}`);
      return eq.length > 1
        ? t(
            "{p}/{q} of the ribbon lines up exactly with {list}. They are equivalent fractions: the same amount cut into different equal parts.",
            { p: s.p, q: s.q, list: eq.filter((f) => f !== `${s.p}/${s.q}`).join(", ") },
          )
        : t("{p}/{q} does not line up exactly with any other ribbon here.", { p: s.p, q: s.q });
    },
  },

  design: {
    init: (grade) => ({ a: 2, b: 3, grade }),
    controls: (s) => [
      { id: "a", label: s.grade === 5 ? t("Pattern A adds") : t("First quantity"), value: s.a },
      { id: "b", label: s.grade === 5 ? t("Pattern B adds") : t("Second quantity"), value: s.b },
    ],
    step: (s, id, delta) => ({ ...s, [id]: Math.min(6, Math.max(1, s[id] + delta)) }),
    draw(s, id) {
      const max = 12;
      const size = 20;
      const ox = 290;
      const oy = 356;
      const pts = ratioPoints(s.a, s.b, max);
      let out = floor(id, 380, 366, 170);
      // A tilted lattice floor with light gridlines; equal ratios rise as columns whose height is the y-value.
      out += `<path d="M${ox} ${oy}h${size * max}l${-60} ${-size * max * 0.95}h${-size * max}z" fill="url(#${id}-glass)" stroke="rgba(199,213,222,.35)"/>`;
      for (let i = 0; i <= max; i += 1) {
        out += `<line class="at-grid" x1="${ox + i * size}" y1="${oy}" x2="${ox + i * size - 60}" y2="${oy - size * max * 0.95}"/>`;
        const yy = oy - i * size * 0.95;
        const shift = (60 * i) / max;
        out += `<line class="at-grid" x1="${ox - shift}" y1="${yy}" x2="${ox + size * max - shift}" y2="${yy}"/>`;
      }
      const at = (x, y) => [ox + x * size - (60 * y) / max, oy - y * size * 0.95];
      const [ex, ey] = at(pts.at(-1).x, pts.at(-1).y);
      out += `<line class="at-ray" x1="${ox}" y1="${oy}" x2="${ex}" y2="${ey}"/>`;
      pts.slice(1).forEach((pt, i) => {
        const [px, py] = at(pt.x, pt.y);
        out += `<g class="at-node" style="--i:${i}"><circle cx="${px}" cy="${py}" r="9" fill="url(#${id}-counter-b)" stroke="#05545c"/><text class="at-node-label" x="${px + 12}" y="${py - 10}">(${pt.x}, ${pt.y})</text></g>`;
      });
      // Ratio table on a porcelain card.
      const cols = pts.slice(1, 5);
      const tx = 24;
      const ty = 280;
      out += slab(tx, ty, 50 + cols.length * 44, 76, {
        front: `url(#${id}-porcelain)`,
        top: "#fffaf0",
        side: "#cfc6b5",
        stroke: "#b9ae9b",
      });
      out += `<text class="at-table-head" x="${tx + 12}" y="${ty + 30}">${esc(s.grade === 5 ? "A" : "x")}</text><text class="at-table-head" x="${tx + 12}" y="${ty + 62}">${esc(s.grade === 5 ? "B" : "y")}</text>`;
      cols.forEach((pt, i) => {
        out += `<text class="at-table-cell" x="${tx + 64 + i * 44}" y="${ty + 30}" text-anchor="middle">${pt.x}</text><text class="at-table-cell" x="${tx + 64 + i * 44}" y="${ty + 62}" text-anchor="middle">${pt.y}</text>`;
      });
      const { rise, run } = slopeParts(s.b, s.a);
      out += `<text class="at-eq" x="${tx + 2}" y="72">${esc(s.grade === 5 ? `B = ${coefText(rise, run)} × A` : `${s.a} : ${s.b}`)}</text>`;
      if (s.grade !== 5) out += `<text class="at-eq is-sub" x="${tx + 2}" y="110">${esc(`y = ${xTerm(rise, run)}`)}</text>`;
      return out;
    },
    words(s) {
      const { rise, run } = slopeParts(s.b, s.a);
      const unit = fractionText(rise, run);
      return s.grade === 5
        ? t(
            "Pattern A counts by {a} and pattern B counts by {b}. Every B term is {unit} times its A term, so the points line up.",
            { a: s.a, b: s.b, unit },
          )
        : t(
            "The ratio {a} to {b} scales to equal ratios that line up through (0, 0). The unit rate is {unit} for each 1.",
            { a: s.a, b: s.b, unit },
          );
    },
  },

  analyze: {
    init: (grade) => ({ grade, mi: grade === 7 ? 3 : 6, b: grade === 7 ? 0 : 1 }),
    slopes: (s) =>
      s.grade === 7
        ? [
            [1, 3],
            [1, 2],
            [2, 3],
            [1, 1],
            [3, 2],
            [2, 1],
            [5, 2],
            [3, 1],
          ]
        : [
            [-2, 1],
            [-3, 2],
            [-1, 1],
            [-1, 2],
            [0, 1],
            [1, 2],
            [1, 1],
            [3, 2],
            [2, 1],
          ],
    controls(s) {
      const list = [
        {
          id: "m",
          label: s.grade === 7 ? t("Constant of proportionality") : t("Slope"),
          value: fractionText(...this.slopes(s)[s.mi]),
        },
      ];
      if (s.grade !== 7) list.push({ id: "b", label: t("y-intercept"), value: sign(s.b) });
      return list;
    },
    step(s, id, delta) {
      if (id === "m")
        return { ...s, mi: Math.min(this.slopes(s).length - 1, Math.max(0, s.mi + delta)) };
      return { ...s, b: Math.min(4, Math.max(-4, s.b + delta)) };
    },
    draw(s, id) {
      const [num, den] = this.slopes(s)[s.mi];
      const { rise, run } = slopeParts(num, den);
      const range = 6;
      const u = 26;
      const cx = 300;
      const cy = 214;
      const X = (x) => cx + x * u;
      const Y = (y) => cy - y * u;
      let out = `<rect x="${X(-range) - 10}" y="${Y(range) - 10}" width="${u * range * 2 + 20}" height="${u * range * 2 + 20}" rx="14" fill="url(#${id}-glass)" stroke="rgba(199,213,222,.3)"/>`;
      for (let i = -range; i <= range; i += 1) {
        out += `<line class="at-grid${i === 0 ? " is-axis" : ""}" x1="${X(i)}" y1="${Y(-range)}" x2="${X(i)}" y2="${Y(range)}"/>`;
        out += `<line class="at-grid${i === 0 ? " is-axis" : ""}" x1="${X(-range)}" y1="${Y(i)}" x2="${X(range)}" y2="${Y(i)}"/>`;
      }
      // The line is drawn as a lit ribbon: a soft cast shadow, then a bright core.
      const yAt = (x) => (rise * x) / run + s.b;
      const x1 = -range;
      const x2 = range;
      const clip = `clip-path="url(#${id}-plot)"`;
      out += `<clipPath id="${id}-plot"><rect x="${X(-range)}" y="${Y(range)}" width="${u * range * 2}" height="${u * range * 2}"/></clipPath>`;
      out += `<line ${clip} x1="${X(x1) + 5}" y1="${Y(yAt(x1)) + 7}" x2="${X(x2) + 5}" y2="${Y(yAt(x2)) + 7}" stroke="#02060f" stroke-opacity=".5" stroke-width="9" stroke-linecap="round"/>`;
      out += `<line ${clip} class="at-line" x1="${X(x1)}" y1="${Y(yAt(x1))}" x2="${X(x2)}" y2="${Y(yAt(x2))}"/>`;
      // Two similar slope triangles: one step (run, rise) and a doubled one (2 run, 2 rise) further along.
      const fits = (p, k) =>
        Math.abs(p.x + run * k) <= range && Math.abs(p.y + rise * k) <= range && Math.abs(p.y) <= range;
      const lattice = lineLattice(rise, run, s.b, range);
      // Keep both triangles clear of the y-intercept: the large one starts right of the axis, the small one ends left of it.
      const big =
        lattice.find((p) => p.x >= 1 && fits(p, 2)) ||
        lattice.find((p) => p.x >= 0 && fits(p, 2)) ||
        lattice.find((p) => fits(p, 2));
      const small =
        big &&
        ([...lattice].reverse().find((p) => fits(p, 1) && p.x + run <= -1 && p.x + run <= big.x) ||
          [...lattice].reverse().find((p) => fits(p, 1) && p.x + run <= big.x));
      const triangle = (p, k, second) => {
        const ex = p.x + run * k;
        const ey = p.y + rise * k;
        return `<path class="at-tri${second ? " is-second" : ""}" d="M${X(p.x)} ${Y(p.y)}H${X(ex)}V${Y(ey)}"/><text class="at-tri-label" x="${(X(p.x) + X(ex)) / 2}" y="${Y(p.y) + (rise > 0 ? 18 : -8)}" text-anchor="middle">${run * k}</text><text class="at-tri-label" x="${X(ex) + 8}" y="${(Y(p.y) + Y(ey)) / 2 + 4}">${sign(rise * k)}</text>`;
      };
      if (rise !== 0 && s.grade !== 7) {
        if (small) out += triangle(small, 1, false);
        if (big) out += triangle(big, 2, true);
      }
      if (s.grade === 7)
        out += `<circle class="at-unit-point" cx="${X(1)}" cy="${Y(yAt(1))}" r="7"/><text class="at-node-label" x="${X(1) + 10}" y="${Y(yAt(1)) - 10}">(1, ${fractionText(rise, run)})</text>`;
      else
        out += `<circle class="at-unit-point" cx="${X(0)}" cy="${Y(s.b)}" r="7"/><text class="at-node-label" x="${X(0) - 12}" y="${Y(s.b) - 10}" text-anchor="end">(0, ${sign(s.b)})</text>`;
      const m = fractionText(rise, run);
      const formula =
        s.grade === 7
          ? `y = ${xTerm(rise, run)}`
          : `y = ${xTerm(rise, run)}${s.b ? ` ${s.b < 0 ? MINUS : "+"} ${Math.abs(s.b)}` : ""}`;
      out += `<text class="at-eq" x="${cx}" y="${Y(range) - 22}" text-anchor="middle">${esc(rise === 0 && s.grade !== 7 ? `y = ${sign(s.b)}` : formula)}</text>`;
      return out;
    },
    words(s) {
      const [num, den] = this.slopes(s)[s.mi];
      const { rise, run } = slopeParts(num, den);
      const m = fractionText(rise, run);
      if (s.grade === 7)
        return t(
          "In y = {c}, y grows by {m} for every 1 that x grows. The line passes through (0, 0) and (1, {m}).",
          { c: xTerm(rise, run), m },
        );
      if (rise === 0)
        return t("A slope of 0 makes a horizontal line: y stays {b} for every x.", {
          b: sign(s.b),
        });
      return t(
        "The small triangle rises {rise} over a run of {run}; the large one rises {rise2} over {run2}. Both make the same slope, {m}, everywhere on the line. It crosses the y-axis at {b}.",
        { rise: sign(rise), run, rise2: sign(2 * rise), run2: 2 * run, m, b: sign(s.b) },
      );
    },
  },
};

// ---- mount -------------------------------------------------------------------------------------------------------
let counter = 0;
export function mountSculpture(host, { grade = 4 } = {}) {
  if (!host) return () => {};
  const band = bandFor(grade);
  const scene = SCENES[band];
  const id = `at-s${(counter += 1)}`;
  let state = scene.init(Number(grade));
  host.dataset.band = band;
  host.innerHTML = `<figure class="at-sculpture" data-band="${band}">
    <div class="at-stage">
      <svg class="at-svg" viewBox="0 0 560 400" role="img" aria-labelledby="${id}-desc" focusable="false">${defs(id)}<rect width="560" height="400" fill="url(#${id}-glow)"/><g class="at-scene"></g></svg>
    </div>
    <figcaption class="at-caption"><p id="${id}-desc" class="at-words" aria-live="polite"></p><div class="at-controls" role="group" aria-label="${esc(t("Change the model"))}"></div></figcaption>
  </figure>`;
  const svgScene = host.querySelector(".at-scene");
  const words = host.querySelector(".at-words");
  const controls = host.querySelector(".at-controls");

  const render = () => {
    svgScene.innerHTML = scene.draw.call(scene, state, id);
    words.textContent = scene.words.call(scene, state);
    const action = scene.action?.(state);
    controls.innerHTML =
      scene.controls
        .call(scene, state)
        .map(
          (
            c,
          ) => `<div class="at-stepper"><span class="at-stepper-label" id="${id}-${c.id}">${esc(c.label)}</span>
          <button type="button" class="at-step" data-step="${c.id}" data-delta="-1" aria-label="${esc(t("Less: {label}", { label: c.label }))}" aria-describedby="${id}-${c.id}">${MINUS}</button>
          <output class="at-value" aria-labelledby="${id}-${c.id}">${esc(c.value)}</output>
          <button type="button" class="at-step" data-step="${c.id}" data-delta="1" aria-label="${esc(t("More: {label}", { label: c.label }))}" aria-describedby="${id}-${c.id}">+</button></div>`,
        )
        .join("") +
      (action
        ? `<button type="button" class="at-act" data-at-act="${action.id}">${esc(action.label)}</button>`
        : "");
  };

  const onClick = (event) => {
    const step = event.target.closest("[data-step]");
    const act = event.target.closest("[data-at-act]");
    if (!step && !act) return;
    const focusKey = step
      ? `[data-step="${step.dataset.step}"][data-delta="${step.dataset.delta}"]`
      : "[data-at-act]";
    state = step
      ? scene.step.call(scene, state, step.dataset.step, Number(step.dataset.delta))
      : scene.act(state);
    render();
    controls.querySelector(focusKey)?.focus();
  };
  host.addEventListener("click", onClick);
  render();
  return () => host.removeEventListener("click", onClick);
}
