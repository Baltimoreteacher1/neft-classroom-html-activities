/* Isometric solids for the EduWonderLab dimensional illustration system.
 *
 * One lighting model everywhere: key light from the upper left, so every solid
 * has a lit top (t), a body face (l) and a shaded face (r).
 *
 *   class mode  faces carry classes only; assets/dimension.css derives the three
 *               tones from one base colour per tone class (a b c d e), so a single
 *               drawing takes each unit's colour from the page.
 *   baked mode  faces carry explicit fills from a palette, for artwork that must
 *               be self-contained (CSS background images cannot read page variables).
 *
 * Coordinates: x runs right-down, y runs left-down, z runs up, in cube units. */
const COS = 0.8660254;
const SIN = 0.5;
const round = (n) => Math.round(n * 10) / 10;
const NIGHT = "#0d273d";
/* Shaded faces mix toward a warm near-black, not navy: navy rotates a rose hue into the forbidden magenta band. */
const SHADE = "#1a1612";

const channel = (hex, i) => Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
/** `amount` of `toward` mixed into `hex`, as color-mix(in srgb) does in the stylesheet. */
const mix = (hex, toward, amount) =>
  `#${[0, 1, 2]
    .map((i) =>
      Math.round(channel(hex, i) * (1 - amount) + channel(toward, i) * amount)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

/** Two-pass fit: draw once to find the bounds, then again scaled into W x H. */
export function fitSvg(
  draw,
  {
    width,
    height,
    pad = 6,
    className = "iso",
    attrs = "",
    inner = "",
    indexed = false,
    palette = null,
  },
) {
  const probe = new Scene(1, 0, 0);
  draw(probe);
  const { minX, maxX, minY, maxY } = probe.bounds;
  const scale = Math.min((width - pad * 2) / (maxX - minX), (height - pad * 2) / (maxY - minY));
  const ox = (width - (maxX - minX) * scale) / 2 - minX * scale;
  const oy = (height - (maxY - minY) * scale) / 2 - minY * scale;
  const scene = new Scene(scale, ox, oy);
  scene.indexed = indexed;
  scene.palette = palette;
  draw(scene);
  const cls = palette ? ' xmlns="http://www.w3.org/2000/svg"' : ` class="${className}"`;
  return `<svg${cls} viewBox="0 0 ${width} ${height}" ${attrs}>${inner}${scene.out.join("")}</svg>`;
}

export class Scene {
  constructor(scale, ox, oy) {
    this.s = scale;
    this.ox = ox;
    this.oy = oy;
    this.out = [];
    this.indexed = false;
    this.palette = null;
    this.n = 0;
    this.bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  }

  /** Project a cube-space point to screen space and track the bounds. */
  P(x, y, z) {
    const px = this.ox + (x - y) * COS * this.s;
    const py = this.oy + (x + y) * SIN * this.s - z * this.s;
    const b = this.bounds;
    b.minX = Math.min(b.minX, px);
    b.maxX = Math.max(b.maxX, px);
    b.minY = Math.min(b.minY, py);
    b.maxY = Math.max(b.maxY, py);
    return [px, py];
  }

  pts(list) {
    return list.map(([x, y, z]) => this.P(x, y, z).map(round).join(",")).join(" ");
  }

  /** Attributes for one face of a solid: a class, or explicit paint in baked mode. */
  face(kind, tone) {
    if (!this.palette) return ` class="${kind}"`;
    const base = this.palette[tone];
    const edge = `stroke-linejoin="round"`;
    if (kind === "t")
      return ` fill="${mix(base, "#ffffff", 0.44)}" stroke="#ffffff" stroke-opacity=".6" stroke-width=".6" ${edge}`;
    if (kind === "r")
      return ` fill="${mix(base, SHADE, 0.3)}" stroke="${NIGHT}" stroke-opacity=".2" stroke-width=".5" ${edge}`;
    return ` fill="${base}" stroke="${NIGHT}" stroke-opacity=".16" stroke-width=".5" ${edge}`;
  }

  /** Opening tag for a solid; the hero numbers its solids so they can assemble in turn. */
  g(tone, cls = "") {
    if (this.palette) return "<g>";
    const style = this.indexed ? ` style="--i:${this.n++}"` : "";
    return `<g class="s ${tone}${cls ? ` ${cls}` : ""}"${style}>`;
  }

  /** A rectangular solid. `x y z` is the back-bottom-left corner. */
  box({ x, y, z = 0, w = 1, d = 1, h = 1, tone = "a", cls = "" }) {
    const top = this.pts([
      [x, y, z + h],
      [x + w, y, z + h],
      [x + w, y + d, z + h],
      [x, y + d, z + h],
    ]);
    const left = this.pts([
      [x, y + d, z],
      [x + w, y + d, z],
      [x + w, y + d, z + h],
      [x, y + d, z + h],
    ]);
    const right = this.pts([
      [x + w, y, z],
      [x + w, y + d, z],
      [x + w, y + d, z + h],
      [x + w, y, z + h],
    ]);
    this.out.push(
      `${this.g(tone, cls)}<polygon${this.face("l", tone)} points="${left}"/><polygon${this.face("r", tone)} points="${right}"/><polygon${this.face("t", tone)} points="${top}"/></g>`,
    );
  }

  /** Upright cylinder; `x y` is the centre of its base. */
  cyl({ x, y, z = 0, r = 0.5, h = 1, tone = "a" }) {
    const [cx, top] = this.P(x, y, z + h);
    const [, bot] = this.P(x, y, z);
    const rx = 1.2247 * r * this.s;
    const ry = 0.7071 * r * this.s;
    const b = this.bounds;
    b.minX = Math.min(b.minX, cx - rx);
    b.maxX = Math.max(b.maxX, cx + rx);
    b.minY = Math.min(b.minY, top - ry);
    b.maxY = Math.max(b.maxY, bot + ry);
    const f = round;
    const arc = `A${f(rx)} ${f(ry)} 0 0 0`;
    this.out.push(
      `${this.g(tone)}<path${this.face("l", tone)} d="M${f(cx - rx)} ${f(top)}V${f(bot)}${arc} ${f(cx)} ${f(bot + ry)}V${f(top)}Z"/><path${this.face("r", tone)} d="M${f(cx)} ${f(top)}V${f(bot + ry)}${arc} ${f(cx + rx)} ${f(bot)}V${f(top)}Z"/><ellipse${this.face("t", tone)} cx="${f(cx)}" cy="${f(top)}" rx="${f(rx)}" ry="${f(ry)}"/></g>`,
    );
  }

  /** A bead: lit sphere resting at `z` (its bottom). */
  sphere({ x, y, z = 0, r = 0.5, tone = "a" }) {
    const [cx, cy] = this.P(x, y, z + r);
    const R = r * this.s * 1.05;
    const b = this.bounds;
    b.minY = Math.min(b.minY, cy - R);
    b.maxY = Math.max(b.maxY, cy + R);
    b.minX = Math.min(b.minX, cx - R);
    b.maxX = Math.max(b.maxX, cx + R);
    const f = round;
    /* Spheres carry no edge strokes: the three discs are the shading. */
    const paint = (kind) =>
      this.palette
        ? this.face(kind, tone).replace(/ stroke[-\w]*="[^"]*"/g, "")
        : ` class="${kind}"`;
    const highlight = this.palette ? ' fill="#ffffff" fill-opacity=".55"' : ' class="t"';
    this.out.push(
      `${this.g(tone)}<circle${paint("r")} cx="${f(cx)}" cy="${f(cy)}" r="${f(R)}"/><circle${paint("l")} cx="${f(cx - R * 0.1)}" cy="${f(cy - R * 0.12)}" r="${f(R * 0.86)}"/><circle${highlight} cx="${f(cx - R * 0.28)}" cy="${f(cy - R * 0.32)}" r="${f(R * 0.42)}"/></g>`,
    );
  }

  /** Soft contact shadow on the floor under a footprint (stacked, no blur filter). */
  shadow({ x, y, z = 0, w, d, grow = 0.5 }) {
    for (const [k, o] of [
      [1, 0.07],
      [0.66, 0.08],
      [0.34, 0.1],
    ]) {
      const g = grow * k;
      const points = this.pts([
        [x - g, y - g, z],
        [x + w + g, y - g, z],
        [x + w + g, y + d + g, z],
        [x - g, y + d + g, z],
      ]);
      this.out.push(
        this.palette
          ? `<polygon fill="${NIGHT}" fill-opacity="${o}" points="${points}"/>`
          : `<polygon class="shade" style="--o:${o}" points="${points}"/>`,
      );
    }
  }

  /** Graph-paper lines on a horizontal plane at height z. */
  grid({ x, y, z, w, d, step = 1 }) {
    const lines = [];
    for (let i = 0; i <= w + 1e-6; i += step)
      lines.push(
        this.pts([
          [x + i, y, z],
          [x + i, y + d, z],
        ]),
      );
    for (let j = 0; j <= d + 1e-6; j += step)
      lines.push(
        this.pts([
          [x, y + j, z],
          [x + w, y + j, z],
        ]),
      );
    const attrs = this.palette
      ? ' fill="none" stroke="#17324d" stroke-opacity=".2" stroke-width=".45"'
      : "";
    this.out.push(
      `<g${this.palette ? "" : ' class="grid"'}>${lines.map((l) => `<polyline${attrs} points="${l}"/>`).join("")}</g>`,
    );
  }

  /** A flat strip on a horizontal plane (an axis line, a marker). */
  strip({ x, y, z, w, d, tone = "c" }) {
    const points = this.pts([
      [x, y, z],
      [x + w, y, z],
      [x + w, y + d, z],
      [x, y + d, z],
    ]);
    this.out.push(
      this.palette
        ? `<polygon fill="${this.palette[tone]}" stroke="${NIGHT}" stroke-opacity=".2" stroke-width=".4" points="${points}"/>`
        : `<polygon class="s ${tone} flat" points="${points}"/>`,
    );
  }

  /** Text lying flat on a horizontal plane (skewed to the iso axes). */
  label({ text, x, y, z, size = 1, anchor = "middle" }) {
    const [px, py] = this.P(x, y, z);
    const k = this.s * size;
    const m = [COS * k, SIN * k, -COS * k, SIN * k, px, py].map((n) => Math.round(n * 100) / 100);
    const paint = this.palette
      ? ` fill="${NIGHT}" fill-opacity=".82" font-family="Georgia,serif" font-weight="700"`
      : ' class="lab"';
    this.out.push(
      `<text${paint} text-anchor="${anchor}" transform="matrix(${m.join(" ")})" font-size="1">${text}</text>`,
    );
  }
}
