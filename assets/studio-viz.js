/**
 * Practice Studio figures (window.StudioViz), part 1: the shared kit, the statistics figures and the number line.
 *
 *   StudioViz.render(spec) -> a complete <svg> string for the figure spec.t names
 *   StudioViz.types        -> every supported t (grows as part files register)
 *   StudioViz.kit          -> the drawing kit the part files build on
 *
 * Three files share one kit and may load in any order (a part file that loads first waits for this one):
 *   assets/studio-viz.js        kit, render(), dots, hist, box, bars, nline         (self-sufficient)
 *   assets/studio-viz-geo.js    coord, shape, prism
 *   assets/studio-viz-model.js  tape, dnl, table, bar1
 * Contract: docs/specs/practice-studio-v2.md section 3. Extras beyond the table there:
 *   any    alt (string) replaces both text alternatives
 *   bars   show:true (print each value above its bar)
 *   hist   xlabel / ylabel are drawn as axis titles
 *
 * Every figure follows the same rules:
 *  - a pure function of its spec; no DOM, only `window`, so the file loads as a plain <script> and through node:vm
 *  - colours are CSS variables with fallbacks (--brand --sun --ink --surface --border --ok); tints come from
 *    color-mix, so every world and the night theme recolour it; colour never carries meaning alone
 *  - role="img", a <title> (what is printed on the figure) and an aria-label (everything a sighted reader can read
 *    off it). A blank cell or an unknown dimension is never printed, drawn or described
 *  - bad input never throws: render() returns a small figure carrying data-viz-error and the reason
 */
(() => {
  const W = /** @type {any} */ (window);
  const V = (W.StudioViz = W.StudioViz || {});
  const draw = (V.draw = V.draw || {});
  V.types = V.types || [];
  V.register = (/** @type {string} */ t, /** @type {(s: any) => any} */ fn) => {
    draw[t] = fn;
    if (!V.types.includes(t)) V.types.push(t);
  };

  /* ---- numbers and text ----------------------------------------------------------------------- */
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  /** A coordinate for the markup: rounded, and a non-number throws so NaN can never reach a figure. */
  const n = (v) => {
    if (!Number.isFinite(v)) throw new RangeError("figure maths produced a non-number");
    return Math.round(v * 100) / 100;
  };
  /** A number for people: float noise stripped, true minus sign. */
  let mixed = false;
  const fmt = (v) => {
    const r = Math.round(v * 1e6) / 1e6;
    if (mixed && r > 0 && !Number.isInteger(r) && Number.isInteger(r * 8)) {
      const whole = Math.floor(r);
      let num = Math.round((r - whole) * 8);
      let den = 8;
      while (num % 2 === 0) {
        num /= 2;
        den /= 2;
      }
      return `${whole ? `${whole} ` : ""}${num}/${den}`;
    }
    return (Object.is(r, -0) ? "0" : String(r)).replace("-", "−");
  };
  const req = (v, what) => {
    const x = v == null || v === "" || typeof v === "boolean" ? Number.NaN : Number(v);
    if (!Number.isFinite(x)) throw new RangeError(`${what} must be a number`);
    return x;
  };
  const opt = (v, d) => (v == null || v === "" || !Number.isFinite(Number(v)) ? d : Number(v));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const list = (a) =>
    a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;
  const plural = (c, w) => `${c} ${w}${c === 1 ? "" : "s"}`;
  /** A measurement as an author writes it: a number, a numeric string, or a symbol such as "?" or "h". */
  const dim = (v) => {
    if (v == null || v === "" || typeof v === "boolean") return null;
    if (typeof v === "number") return Number.isFinite(v) ? { v, t: fmt(v) } : null;
    const t = String(v).trim();
    if (!t) return null;
    return Number.isFinite(Number(t)) ? { v: Number(t), t: fmt(Number(t)) } : { v: null, t };
  };
  /** Estimated text width in px, good enough to keep labels apart without measuring a DOM. */
  const tw = (s, z = 14, bold = false) => {
    let w = 0;
    for (const c of String(s)) {
      if (/[il.,:;'|! ]/.test(c)) w += 0.3;
      else if (/[mwMW]/.test(c)) w += 0.9;
      else if (/[A-Z]/.test(c)) w += 0.68;
      else if (/[0-9]/.test(c)) w += 0.58;
      else w += 0.54;
    }
    return w * z * (bold ? 1.08 : 1);
  };

  /** Split a label into at most three lines, each no wider than w px (a single long word stays whole). */
  const wrapLabel = (text, w, z, bold = false) => {
    const lines = [];
    let cur = "";
    for (const word of String(text).split(/\s+/)) {
      const next = cur ? `${cur} ${word}` : word;
      if (cur && tw(next, z, bold) > w && lines.length < 2) {
        lines.push(cur);
        cur = word;
      } else cur = next;
    }
    lines.push(cur);
    return lines;
  };

  /* ---- markup primitives (class names are written short and prefixed here) -------------------- */
  const cls = (c) =>
    c
      .split(" ")
      .filter(Boolean)
      .map((t) => `v-${t}`)
      .join(" ");
  const T = (x, y, s, o = {}) =>
    `<text x="${n(x)}" y="${n(y)}" font-size="${o.z || 14}" text-anchor="${o.a || "start"}"${
      o.m ? ' dy="0.35em"' : ""
    }${o.c ? ` class="${cls(o.c)}"` : ""}${
      o.r ? ` transform="rotate(${o.r} ${n(x)} ${n(y)})"` : ""
    }>${esc(s)}</text>`;
  const L = (x1, y1, x2, y2, c) =>
    `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" class="${cls(c)}"/>`;
  const Rc = (x, y, w, h, c, r = 0) =>
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${r ? ` rx="${r}"` : ""} class="${cls(c)}"/>`;
  const Ci = (x, y, r, c) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" class="${cls(c)}"/>`;
  const Pg = (pts, c) =>
    `<polygon points="${pts.map((p) => `${n(p[0])},${n(p[1])}`).join(" ")}" class="${cls(c)}"/>`;
  const pathOf = (pts, close) =>
    `M${pts.map((p) => `${n(p[0])} ${n(p[1])}`).join("L")}${close ? "Z" : ""}`;
  const D = (d, c) => `<path d="${d}" class="${cls(/\bf[a-z]\b/.test(c) ? c : `${c} fn`)}"/>`;
  /** Arrowhead whose tip is (x, y), pointing at angle a (0 = right, PI/2 = down). */
  const arrow = (x, y, a, size = 9, c = "fi") => {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const hw = size * 0.5;
    return Pg(
      [
        [x, y],
        [x - ca * size - sa * hw, y - sa * size + ca * hw],
        [x - ca * size + sa * hw, y - sa * size - ca * hw],
      ],
      c,
    );
  };
  /** Right-angle corner mark at vertex v, running s px along unit directions d1 and d2. */
  const square = (v, d1, d2, s = 9) =>
    D(
      pathOf(
        [
          [v[0] + d1[0] * s, v[1] + d1[1] * s],
          [v[0] + (d1[0] + d2[0]) * s, v[1] + (d1[1] + d2[1]) * s],
          [v[0] + d2[0] * s, v[1] + d2[1] * s],
        ],
        false,
      ),
      "ra",
    );

  /* ---- scales --------------------------------------------------------------------------------- */
  const niceStep = (span, maxTicks) => {
    const raw = span / maxTicks;
    if (!(raw > 0)) return 1;
    const p = 10 ** Math.floor(Math.log10(raw));
    for (const m of [1, 2, 5, 10]) if (m * p >= raw * 0.999) return m * p;
    return 10 * p;
  };
  const MULT = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  /** Tick values from min to max; `lab` marks the ones that get a printed number (never touching). */
  const ticksOf = (min, max, step, ppu, z = 14) => {
    let st = step > 0 ? step : niceStep(max - min, 10);
    if ((max - min) / st > 240) st = niceStep(max - min, 20);
    const cnt = Math.max(1, Math.round((max - min) / st));
    const val = (i) => Math.round((min + i * st) * 1e9) / 1e9;
    let wid = 0;
    for (let i = 0; i <= cnt; i++) wid = Math.max(wid, tw(fmt(val(i)), z));
    let k = 1;
    for (const m of MULT) {
      k = m;
      if (m * st * ppu >= wid + 12) break;
    }
    const out = [];
    for (let i = 0; i <= cnt; i++) {
      const q = val(i) / (k * st);
      out.push({ v: val(i), lab: Math.abs(q - Math.round(q)) < 1e-6 });
    }
    for (const i of [0, cnt]) {
      if (out[i].lab) continue;
      const near = out.reduce(
        (m, t, j) => (t.lab ? Math.min(m, Math.abs(j - i) * st * ppu) : m),
        Number.POSITIVE_INFINITY,
      );
      if (near >= wid + 12) out[i].lab = true;
    }
    return out;
  };
  /** Label every k-th of an explicit list of values so printed numbers never touch. */
  const sparse = (vals, X, z) => {
    const wid = Math.max(...vals.map((v) => tw(fmt(v), z))) + 10;
    let gap = Number.POSITIVE_INFINITY;
    for (let i = 1; i < vals.length; i++) gap = Math.min(gap, X(vals[i]) - X(vals[i - 1]));
    const k = Math.max(1, Math.ceil(wid / gap));
    return vals.map((v, i) => ({ v, lab: i % k === 0 }));
  };
  /** Horizontal scale: baseline, tick marks (down, or across with cross) and labels. */
  const hAxis = (X, y, tk, o = {}) => {
    const a = X(tk[0].v);
    const b = X(tk[tk.length - 1].v);
    const e = o.arrows ? 14 : 0;
    let s = L(a - e, y, b + e, y, "ax");
    if (o.arrows) s += arrow(b + e + 6, y, 0) + arrow(a - e - 6, y, Math.PI);
    for (const t of tk) {
      const x = X(t.v);
      const up = o.cross ? (t.lab ? 7 : 4.5) : 0;
      const dn = t.lab ? 7 : 4.5;
      s += L(x, y - up, x, y + dn, "tk");
      if (t.lab) s += T(x, y + dn + 17, fmt(t.v), { a: "middle", z: o.z || 14 });
    }
    return s;
  };

  /* ---- stylesheet shared by every figure (class names are prefixed v-) ------------------------ */
  const RULES = {
    mu: "fill:var(--m)",
    bd: "font-weight:700",
    on: "fill:var(--s)",
    hl: "paint-order:stroke;stroke:var(--s);stroke-width:4;stroke-linejoin:round",
    fb: "fill:var(--b)",
    ft: "fill:var(--bt)",
    fa: "fill:var(--bt2)",
    fy: "fill:var(--yt)",
    fk: "fill:var(--kt)",
    fw: "fill:var(--s)",
    fn: "fill:none",
    fi: "fill:var(--i)",
    ax: "stroke:var(--i);stroke-width:2.2",
    tk: "stroke:var(--i);stroke-width:1.6",
    ra: "stroke:var(--i);stroke-width:1.6",
    sb: "stroke:var(--b);stroke-width:3",
    sc: "stroke:var(--b);stroke-width:2",
    sr: "stroke:var(--b);stroke-width:5.5",
    si: "stroke:var(--i);stroke-width:2",
    sm: "stroke:var(--i);stroke-width:4.5;stroke-linecap:butt",
    sg: "stroke:var(--g);stroke-width:1",
    sw: "stroke:var(--s);stroke-width:2",
    sd: "stroke:var(--i);stroke-width:2.2;stroke-dasharray:6 4",
    sh: "stroke:var(--m);stroke-width:1.6;stroke-dasharray:4 4",
    sf: "stroke:var(--g);stroke-width:1.6;stroke-dasharray:2 4",
    sx: "stroke:var(--b);stroke-width:1.2;stroke-opacity:.55",
    sq: "stroke:var(--b);stroke-width:2.6;stroke-dasharray:7 5",
  };
  const CSS =
    "svg.sv{--i:var(--ink,#1B2733);--s:var(--surface,#fff);--b:var(--brand,#2C4A68);--y:var(--sun,#F0BD4F);--g:var(--border,#D5DCE5);--k:var(--ok,#0A7D4B);--m:#566475;--bt:#E5ECF3;--bt2:#CFDCE9;--yt:#FAF2DC;--kt:#E4F7EC;font-family:var(--font-sans,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif);font-variant-numeric:tabular-nums}" +
    "@supports (color:color-mix(in srgb,red,blue)){svg.sv{--m:color-mix(in srgb,var(--i) 72%,var(--s));--bt:color-mix(in srgb,var(--b) 14%,var(--s));--bt2:color-mix(in srgb,var(--b) 26%,var(--s));--yt:color-mix(in srgb,var(--y) 38%,var(--s));--kt:color-mix(in srgb,var(--k) 15%,var(--s))}}" +
    "@media (forced-colors:active){svg.sv{--i:CanvasText;--m:CanvasText;--s:Canvas;--b:CanvasText;--y:Canvas;--g:GrayText;--k:CanvasText;--bt:Canvas;--bt2:Canvas;--yt:Canvas;--kt:Canvas}svg.sv .v-hl{stroke:none}}" +
    "svg.sv text{fill:var(--i)}svg.sv line,svg.sv path,svg.sv polygon,svg.sv rect,svg.sv circle{stroke-linecap:round;stroke-linejoin:round}" +
    Object.entries(RULES)
      .map(([k, v]) => `svg.sv .v-${k}{${v}}`)
      .join("");

  /* ---- render: wrap a figure body in the accessible svg shell -------------------------------- */
  const shell = (extra, w, h, title, alt, body) => {
    const mw = Math.min(560, Math.round(w * 1.15));
    return (
      `<svg class="sv" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(alt)}" viewBox="0 0 ${n(w)} ${n(h)}" width="${n(w)}" height="${n(h)}" style="display:block;width:100%;height:auto;max-width:${mw}px;margin:0 auto"${extra}>` +
      `<title>${esc(title)}</title><style>${CSS}</style>${body}</svg>`
    );
  };
  const fail = (why) => {
    const msg = `Figure unavailable: ${why}`;
    return shell(
      ` data-viz-error="${esc(why)}"`,
      360,
      72,
      msg,
      msg,
      `${Rc(0.5, 0.5, 359, 71, "fw sg", 14)}${T(180, 42, "Figure unavailable", { a: "middle", z: 16, c: "bd" })}`,
    );
  };
  V.render = (/** @type {any} */ spec) => {
    try {
      if (!spec || typeof spec !== "object") return fail("the figure spec is missing");
      const fn = draw[spec.t];
      if (!fn) return fail(`unknown figure type "${spec.t}"`);
      mixed = spec.frac === true;
      const f = fn(spec);
      mixed = false;
      const own = typeof spec.alt === "string" && spec.alt.trim() ? spec.alt.trim() : "";
      const frame = Rc(0.5, 0.5, n(f.w) - 1, n(f.h) - 1, "fw sg", 14);
      return shell("", f.w, f.h, own || f.title, own || f.alt || f.title, frame + f.body);
    } catch (e) {
      return fail(
        e && /** @type {any} */ (e).message ? /** @type {any} */ (e).message : "bad figure spec",
      );
    }
  };
  V.kit = {
    esc,
    n,
    fmt,
    req,
    opt,
    clamp,
    list,
    plural,
    dim,
    tw,
    wrapLabel,
    cls,
    T,
    L,
    Rc,
    Ci,
    Pg,
    D,
    pathOf,
    arrow,
    square,
    niceStep,
    ticksOf,
    sparse,
    hAxis,
    MULT,
  };
  const { register } = V;

  /* ---- dots: dot plot (stacked dots) ---------------------------------------------------------- */
  register("dots", (s) => {
    const data = (Array.isArray(s.data) ? s.data : []).map(Number).filter(Number.isFinite);
    let lo = opt(s.min, data.length ? Math.floor(Math.min(...data)) : 0);
    let hi = opt(s.max, data.length ? Math.ceil(Math.max(...data)) : 10);
    if (data.length) {
      lo = Math.min(lo, Math.floor(Math.min(...data)));
      hi = Math.max(hi, Math.ceil(Math.max(...data)));
    }
    if (!(hi > lo)) hi = lo + 1;
    const whole = Number.isInteger(lo) && Number.isInteger(hi);
    const step = s.step > 0 ? Number(s.step) : whole && hi - lo <= 40 ? 1 : niceStep(hi - lo, 10);
    const x0 = 40;
    const x1 = 440;
    const ppu = (x1 - x0) / (hi - lo);
    const X = (v) => x0 + (v - lo) * ppu;
    const groups = new Map();
    for (const v of data) {
      const k = Math.round(v * 1e6) / 1e6;
      groups.set(k, (groups.get(k) || 0) + 1);
    }
    const keys = [...groups.keys()].sort((a, b) => a - b);
    let gap = step * ppu;
    for (let i = 1; i < keys.length; i++) gap = Math.min(gap, (keys[i] - keys[i - 1]) * ppu);
    let r = clamp((gap - 3) / 2, 3.5, 9.5);
    let dh = 2 * r + 2;
    const tall = Math.max(1, ...groups.values());
    if (tall * dh > 200) {
      dh = 200 / tall;
      r = Math.max(2.5, (dh - 2) / 2);
    }
    const top = 18;
    const ay = top + tall * dh + 10;
    const label = s.label ? String(s.label) : "";
    const H = ay + (label ? 70 : 44);
    const tk = ticksOf(lo, hi, step, ppu);
    let body = hAxis(X, ay, tk);
    for (const [v, c] of groups) {
      for (let i = 0; i < c; i++) body += Ci(X(v), ay - 5 - r - i * dh, r, "fb sw");
    }
    if (!data.length) body += T(240, top + 36, "No data yet", { a: "middle", z: 15, c: "mu" });
    if (label) body += T((x0 + x1) / 2, ay + 58, label, { a: "middle", z: 15, c: "bd" });
    const title = `Dot plot${label ? ` of ${label}` : ""}, scale ${fmt(lo)} to ${fmt(hi)}`;
    const dots = keys.map((v) => `${fmt(v)} (${plural(groups.get(v), "dot")})`);
    const alt = data.length
      ? `${title}. ${plural(data.length, "dot")} in all: ${dots.join(", ")}.`
      : `${title}. There are no dots yet.`;
    return { w: 480, h: H, body, title, alt };
  });

  /* ---- hist: histogram ------------------------------------------------------------------------ */
  register("hist", (s) => {
    const bins = (Array.isArray(s.bins) ? s.bins : []).map((b) => ({
      a: req(b?.from, "hist bin.from"),
      b: req(b?.to, "hist bin.to"),
      c: req(b?.n, "hist bin.n"),
    }));
    if (bins.some((b) => !(b.b > b.a) || b.c < 0))
      throw new RangeError("hist: each bin needs to > from and n >= 0");
    // Bins written as inclusive whole-number pairs (20–24, 25–29) are one interval wide each, so the bars must touch:
    // a histogram has no gaps. `d` is the edge drawn; the printed ranges (and the text alternative) keep the authored pair.
    const byA = [...bins].sort((p, q) => p.a - q.a);
    const inclusive = byA.length > 1 && byA.slice(1).every((b, i) => b.a - byA[i].b === 1);
    for (const b of bins) b.d = b.b;
    if (inclusive) byA.forEach((b, i) => (b.d = i + 1 < byA.length ? byA[i + 1].a : b.b + 1));
    const lo = bins.length ? Math.min(...bins.map((b) => b.a)) : 0;
    const hi = bins.length ? Math.max(...bins.map((b) => b.d)) : 1;
    const ys = niceStep(Math.max(1, ...bins.map((b) => b.c)), 8);
    const yTop = Math.max(ys, Math.ceil(Math.max(...bins.map((b) => b.c), 0) / ys - 1e-9) * ys);
    const xl = s.xlabel ? String(s.xlabel) : "";
    const yl = s.ylabel ? String(s.ylabel) : "";
    const L0 = yl ? 62 : 46;
    const R0 = 22;
    const T0 = 22;
    const PH = 210;
    const PW = 480 - L0 - R0;
    const X = (v) => L0 + ((v - lo) / (hi - lo)) * PW;
    const Y = (v) => T0 + PH - (v / yTop) * PH;
    let body = "";
    for (let t = 0; t <= yTop + 1e-9; t += ys) {
      if (t > 0) body += L(L0, Y(t), L0 + PW, Y(t), "sg");
      body += T(L0 - 9, Y(t), fmt(t), { a: "end", m: 1 });
    }
    for (const b of bins)
      if (b.c > 0) body += Rc(X(b.a), Y(b.c), X(b.d) - X(b.a), (b.c / yTop) * PH, "fb sw");
    const edges = [...new Set(bins.flatMap((b) => [b.a, b.d]))].sort((a, b) => a - b);
    const tk =
      edges.length > 1
        ? sparse(edges, X, 14)
        : [
            { v: lo, lab: true },
            { v: hi, lab: true },
          ];
    body += L(L0, T0, L0, T0 + PH, "ax") + hAxis(X, T0 + PH, tk);
    if (!bins.length)
      body += T(L0 + PW / 2, T0 + PH / 2, "No data yet", { a: "middle", z: 15, c: "mu" });
    if (xl) body += T(L0 + PW / 2, T0 + PH + 56, xl, { a: "middle", z: 15, c: "bd" });
    if (yl) body += T(15, T0 + PH / 2, yl, { a: "middle", z: 15, c: "bd", r: -90 });
    const title = `Histogram${xl ? ` of ${xl}` : ""}, ${plural(bins.length, "bar")}`;
    const alt = bins.length
      ? `${title}. ${bins.map((b) => `${fmt(b.a)} to ${fmt(b.b)}: ${fmt(b.c)}`).join("; ")}.${yl ? ` Bar height is ${yl}.` : ""}`
      : `${title}. There is no data yet.`;
    return { w: 480, h: T0 + PH + (xl ? 70 : 44), body, title, alt };
  });

  /* ---- box: box plot, one or several on a shared scale --------------------------------------- */
  register("box", (s) => {
    const src = Array.isArray(s.plots) ? s.plots : [s];
    if (!src.length) throw new RangeError("box: plots is empty");
    const plots = src.map((p, i) => ({
      label: Array.isArray(s.plots) && p?.label ? String(p.label) : "",
      v: ["min", "q1", "med", "q3", "max"].map((k) => req(p?.[k], `box ${k}`)),
      i,
    }));
    const all = plots.flatMap((p) => p.v);
    const sc = s.scale && typeof s.scale === "object" ? s.scale : {};
    const lo = Math.min(opt(sc.min, Math.floor(Math.min(...all))), Math.floor(Math.min(...all)));
    const hi0 = Math.max(opt(sc.max, Math.ceil(Math.max(...all))), Math.ceil(Math.max(...all)));
    const hi = hi0 > lo ? hi0 : lo + 1;
    const x0 = 36;
    const x1 = 444;
    const ppu = (x1 - x0) / (hi - lo);
    const X = (v) => x0 + (v - lo) * ppu;
    const tk = ticksOf(lo, hi, Number(sc.step), ppu);
    const named = plots.some((p) => p.label);
    const rowH = named ? 62 : 48;
    const top = 14;
    const ay = top + plots.length * rowH + 2;
    let body = "";
    for (const t of tk) if (t.lab) body += L(X(t.v), top - 4, X(t.v), ay, "sg");
    const fills = ["ft", "fy", "fk"];
    for (const p of plots) {
      const [mn, q1, md, q3, mx] = p.v;
      const y = top + p.i * rowH + (named ? 26 : 8);
      const mid = y + 15;
      if (p.label) body += T(x0, y - 8, p.label, { z: 15, c: "bd" });
      body += L(X(mn), mid, X(q1), mid, "sb") + L(X(q3), mid, X(mx), mid, "sb");
      body += L(X(mn), mid - 8, X(mn), mid + 8, "sb") + L(X(mx), mid - 8, X(mx), mid + 8, "sb");
      body += Rc(X(q1), y, Math.max(2, X(q3) - X(q1)), 30, `${fills[p.i % 3]} sb`, 3);
      body += L(X(md), y - 1, X(md), y + 31, "sm");
    }
    body += hAxis(X, ay, tk);
    const label = s.label ? String(s.label) : "";
    if (label) body += T((x0 + x1) / 2, ay + 58, label, { a: "middle", z: 15, c: "bd" });
    const title = `${plots.length > 1 ? `${plots.length} box plots` : "Box plot"}${label ? ` of ${label}` : ""}, scale ${fmt(lo)} to ${fmt(hi)}`;
    const five = (p) =>
      `minimum ${fmt(p.v[0])}, first quartile ${fmt(p.v[1])}, median ${fmt(p.v[2])}, third quartile ${fmt(p.v[3])}, maximum ${fmt(p.v[4])}`;
    const alt = `${title}. ${plots.map((p) => `${p.label ? `${p.label}: ` : ""}${five(p)}`).join(". ")}.`;
    return { w: 480, h: ay + (label ? 72 : 46), body, title, alt };
  });

  /* ---- bars: bar chart ------------------------------------------------------------------------ */
  register("bars", (s) => {
    const labels = (Array.isArray(s.labels) ? s.labels : []).map(String);
    const vals = (Array.isArray(s.values) ? s.values : []).map((v) => req(v, "bars value"));
    if (labels.length !== vals.length)
      throw new RangeError("bars: labels and values must be the same length");
    const yl = s.ylabel ? String(s.ylabel) : "";
    const hi0 = Math.max(0, opt(s.max, 0), ...vals);
    const lo0 = Math.min(0, ...vals);
    const ys = niceStep(Math.max(1, hi0 - lo0), 7);
    const yTop = Math.max(ys, Math.ceil(hi0 / ys - 1e-9) * ys);
    const yBot = Math.floor(lo0 / ys + 1e-9) * ys;
    const L0 = yl ? 64 : 48;
    const R0 = 18;
    const T0 = 24;
    const PH = 200;
    const PW = 480 - L0 - R0;
    const Y = (v) => T0 + ((yTop - v) / (yTop - yBot)) * PH;
    const slot = PW / Math.max(1, labels.length);
    const bw = Math.min(70, slot * 0.64);
    const z = labels.length > 6 ? 12.5 : 14;
    let body = "";
    for (let t = yBot; t <= yTop + 1e-9; t += ys) {
      if (Math.abs(t) > 1e-9) body += L(L0, Y(t), L0 + PW, Y(t), "sg");
      body += T(L0 - 9, Y(t), fmt(t), { a: "end", m: 1 });
    }
    const lines = labels.map((t) => wrapLabel(t, slot - 6, z));
    const yZero = Y(0);
    vals.forEach((v, i) => {
      const x = L0 + slot * i + (slot - bw) / 2;
      const yv = Y(v);
      const r = Math.min(5, bw / 2, Math.abs(yv - yZero) / 2);
      const e = v >= 0 ? r : -r;
      if (yv !== yZero) {
        const d = `M${n(x)} ${n(yZero)}V${n(yv + e)}Q${n(x)} ${n(yv)} ${n(x + r)} ${n(yv)}H${n(x + bw - r)}Q${n(x + bw)} ${n(yv)} ${n(x + bw)} ${n(yv + e)}V${n(yZero)}Z`;
        body += D(d, "fb sw");
      }
      if (s.show) {
        body += T(x + bw / 2, v >= 0 ? yv - 7 : yv + 19, fmt(v), {
          a: "middle",
          z: 15,
          c: "bd hl",
        });
      }
      lines[i].forEach((ln, j) => {
        body += T(x + bw / 2, T0 + PH + 22 + j * (z + 3), ln, { a: "middle", z });
      });
    });
    body += L(L0, T0, L0, T0 + PH, "ax") + L(L0, Y(0), L0 + PW, Y(0), "ax");
    if (!labels.length)
      body += T(L0 + PW / 2, T0 + PH / 2, "No data yet", { a: "middle", z: 15, c: "mu" });
    if (yl) body += T(15, T0 + PH / 2, yl, { a: "middle", z: 15, c: "bd", r: -90 });
    const rows = Math.max(1, ...lines.map((l) => l.length));
    const title = `Bar chart, ${plural(labels.length, "bar")}${yl ? `, ${yl}` : ""}`;
    const alt = labels.length
      ? `${title}. ${labels.map((t, i) => `${t}: ${fmt(vals[i])}`).join("; ")}.`
      : `${title}. There is no data yet.`;
    return { w: 480, h: T0 + PH + 22 + rows * (z + 3) + 14, body, title, alt };
  });

  /* ---- nline: number line with points and a ray ----------------------------------------------- */
  register("nline", (s) => {
    const lo = req(s.min, "nline min");
    const hi = req(s.max, "nline max");
    if (!(hi > lo)) throw new RangeError("nline: max must be greater than min");
    const x0 = 44;
    const x1 = 436;
    const ppu = (x1 - x0) / (hi - lo);
    const X = (v) => x0 + (v - lo) * ppu;
    const tk = ticksOf(lo, hi, Number(s.step), ppu);
    const marks = (Array.isArray(s.marks) ? s.marks : [])
      .map((m) => ({
        v: req(m?.v, "nline mark.v"),
        l: m?.l == null ? "" : String(m.l),
        open: !!m?.open,
      }))
      .filter((m) => m.v >= lo - 1e-9 && m.v <= hi + 1e-9);
    const ray = s.ray && typeof s.ray === "object" ? s.ray : null;
    const rf = ray ? req(ray.from, "nline ray.from") : 0;
    const rdir = ray?.dir === "left" ? -1 : 1;
    const ay = marks.some((m) => m.l) ? 80 : 52;
    let body = hAxis(X, ay, tk, { arrows: true, cross: true });
    if (ray) {
      const end = rdir > 0 ? x1 + 20 : x0 - 20;
      body +=
        L(X(clamp(rf, lo, hi)), ay, end, ay, "sr") +
        arrow(end + rdir * 8, ay, rdir > 0 ? 0 : Math.PI, 13, "fb");
      body += Ci(X(clamp(rf, lo, hi)), ay, 8.5, ray.open ? "fw sb" : "fb sw");
    }
    const lastEnd = [-1e9, -1e9];
    for (const m of [...marks].sort((a, b) => a.v - b.v)) {
      const cx = X(m.v);
      if (!(ray && Math.abs(m.v - rf) < 1e-9)) body += Ci(cx, ay, 8, m.open ? "fw sb" : "fb sw");
      if (!m.l) continue;
      const w = tw(m.l, 15, true);
      let row = lastEnd.findIndex((e) => cx - w / 2 >= e + 6);
      if (row < 0) row = 0;
      lastEnd[row] = cx + w / 2;
      body += T(cx, ay - 24 - row * 21, m.l, { a: "middle", z: 15, c: "bd hl" });
    }
    const title = `Number line from ${fmt(lo)} to ${fmt(hi)}`;
    const bits = [];
    for (const m of marks)
      bits.push(`${m.open ? "an open" : "a"} point${m.l ? ` ${m.l}` : ""} at ${fmt(m.v)}`);
    if (ray)
      bits.push(
        `${ray.open ? "an open" : "a closed"} circle at ${fmt(rf)} with a ray pointing ${rdir > 0 ? "right" : "left"}`,
      );
    const alt = `${title}${bits.length ? `, showing ${list(bits)}` : ""}.`;
    return { w: 480, h: ay + 46, body, title, alt };
  });

  /* part files (studio-viz-geo.js, studio-viz-model.js) wait here when they load first */
  for (const boot of V.pending ? V.pending.splice(0) : []) boot();
})();
