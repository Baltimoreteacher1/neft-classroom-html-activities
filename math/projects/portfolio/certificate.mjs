/**
 * The certificate of completion. One certificate per unit, for the finished projects in that unit.
 * It is built only from real completion records: with none, `certificateFor` returns null and no
 * certificate can be shown. Layout is HTML (it reflows, reads aloud and prints); the border and
 * seal are one family of decorative SVG (ink, rust and blue, the same palette as the gallery
 * drawings) and are hidden from assistive technology. No emoji.
 */
const SVG_NS = "http://www.w3.org/2000/svg";
const INK = "#142c3b";
const RUST = "#b53e20";
const BLUE = "#124f7a";
const LIME = "#e4efbb";
const PAPER = "#fffdf6";

const svg = (tag, attrs = {}) => {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
};
const star = (cx, cy, outer, inner, points = 5) => {
  const pts = [];
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
};

/** The frame and seal. Drawn on a 1100 x 850 (Letter, landscape) board. */
function artwork() {
  const art = svg("svg", {
    class: "pf-cert-art",
    viewBox: "0 0 1100 850",
    preserveAspectRatio: "none",
    "aria-hidden": "true",
    focusable: "false",
  });
  art.append(
    svg("rect", { x: 26, y: 26, width: 1048, height: 798, rx: 6, fill: "none", stroke: INK, "stroke-width": 3 }),
    svg("rect", { x: 44, y: 44, width: 1012, height: 762, rx: 3, fill: "none", stroke: RUST, "stroke-width": 1.5 }),
  );
  for (const [x, y, sx, sy] of [
    [44, 44, 1, 1],
    [1056, 44, -1, 1],
    [44, 806, 1, -1],
    [1056, 806, -1, -1],
  ])
    art.append(
      svg("path", {
        d: `M ${x} ${y} h ${54 * sx} a 54 54 0 0 ${sx * sy > 0 ? 1 : 0} ${-54 * sx} ${54 * sy} z`,
        fill: LIME,
        stroke: RUST,
        "stroke-width": 1.5,
      }),
    );
  art.append(
    svg("circle", { cx: 550, cy: 110, r: 30, fill: PAPER, stroke: BLUE, "stroke-width": 3 }),
    svg("polygon", { points: star(550, 110, 20, 8.5), fill: RUST }),
    svg("line", { x1: 250, y1: 110, x2: 505, y2: 110, stroke: INK, "stroke-width": 1.5 }),
    svg("line", { x1: 595, y1: 110, x2: 850, y2: 110, stroke: INK, "stroke-width": 1.5 }),
    svg("polygon", { points: star(930, 690, 74, 64, 24), fill: BLUE }),
    svg("circle", { cx: 930, cy: 690, r: 50, fill: "none", stroke: PAPER, "stroke-width": 3 }),
    svg("polygon", { points: star(930, 690, 32, 13), fill: PAPER }),
  );
  return art;
}

/** The small emblem shown instead of the full frame on narrow screens (see portfolio.css). */
function emblem() {
  const mark = svg("svg", {
    class: "pf-cert-emblem",
    viewBox: "0 0 64 64",
    "aria-hidden": "true",
    focusable: "false",
  });
  mark.append(
    svg("circle", { cx: 32, cy: 32, r: 29, fill: PAPER, stroke: BLUE, "stroke-width": 3 }),
    svg("polygon", { points: star(32, 32, 20, 8.5), fill: RUST }),
  );
  return mark;
}

const el = (tag, className, content) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
};

const dateText = (iso) => {
  const d = new Date(iso);
  try {
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return d.toDateString();
  }
};

/**
 * @param unit  { key, label, short }
 * @param rows  portfolio rows (store.mjs) for projects in this unit
 * @param name  the student's name from this device, or ""
 * @returns the certificate element, or null when no row has a real completion record
 */
export function certificateFor(unit, rows, name) {
  const done = rows.filter((r) => r.completions.length);
  if (!done.length) return null;
  const latest = done
    .flatMap((r) => r.completions.map((c) => c.at))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
  const codes = [...new Set(done.flatMap((r) => r.project.codes))].sort();
  const stars = done.reduce(
    (sum, r) =>
      sum +
      r.completions.reduce(
        (n, c) => n + (c.kind === "classic" && Number(c.record.stars) > 0 ? Math.min(3, Math.round(Number(c.record.stars))) : 0),
        0,
      ),
    0,
  );
  const root = el("article", "pf-cert");
  root.setAttribute("aria-labelledby", "cert-title");
  root.dataset.unit = unit.key;
  const body = el("div", "pf-cert-body");
  const title = el("h2", "", unit.label);
  title.id = "cert-title";
  const nameLine = el("p", "pf-cert-name", name);
  if (!name) nameLine.append(el("span", "pf-sr", "Write your name on this line."));
  const projects = el("ul", "pf-cert-projects");
  for (const r of done) projects.append(el("li", "", r.studioDone?.title || r.project.title));
  const meta = [`Completed ${dateText(latest)}`, codes.length ? `Standards ${codes.join(", ")}` : ""];
  if (stars) meta.push(`${stars} star${stars === 1 ? "" : "s"} on classic project pages`);
  body.append(
    emblem(),
    el("p", "pf-cert-kicker", "Certificate of completion"),
    title,
    el("p", "pf-cert-line", "Awarded to"),
    nameLine,
    el("p", "pf-cert-line", `for finishing ${done.length === 1 ? "this project" : `these ${done.length} projects`}`),
    projects,
    el("p", "pf-cert-meta", meta.filter(Boolean).join(" · ")),
    el("p", "pf-cert-foot", "Neft Teacher · Grade 6 Math · eduwonderlab.com"),
  );
  root.append(artwork(), body);
  return root;
}
