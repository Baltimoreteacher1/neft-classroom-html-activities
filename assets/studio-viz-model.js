/**
 * Practice Studio figures (window.StudioViz), part 3: ratio and fraction models.
 *
 * Registers tape, dnl, table and bar1 on window.StudioViz using the kit from assets/studio-viz.js (either file may
 * load first). Contract: docs/specs/practice-studio-v2.md section 3.
 *
 *   tape   {parts:[{v,l?}], total?, groups?}  one tape: segment widths follow the numbers; a string such as "?" or
 *          "x" is an unknown part (dashed). total = a brace over the whole tape. groups = repeat the parts n times
 *          (4 groups of 6). Extra: rows:[{label?, parts, total?, groups?}] stacks tapes on one shared scale.
 *   dnl    {top:{label,vals[]}, bottom:{label,vals[]}}  double number line; null = an empty box to fill in
 *   table  {hd[], rows[][], blank?:[[row,col]]}  row is counted from the first body row; a blank cell is drawn as an
 *          empty box and its value is never written anywhere in the figure
 *   bar1   {n, d, whole?, label?}  d equal cells per bar, n shaded after whole fully shaded bars; n > d runs on
 *          into the next bar. label:true writes the fraction under the bars
 */
(() => {
  const W = /** @type {any} */ (window);
  const V = (W.StudioViz = W.StudioViz || {});
  const boot = () => {
    const { n, fmt, req, opt, clamp, list, plural, dim, tw, wrapLabel, T, L, Rc, D, arrow } = V.kit;
    const { register } = V;
    const say = (dm) => (dm ? dm.t : "");

    /* ---- tape: tape diagram ------------------------------------------------------------------ */
    /** Curly brace over [xa, xb] with its ends at y + d and its point at y - d. */
    const brace = (xa, xb, y, d) => {
      const m = (xa + xb) / 2;
      const r = Math.min(d, (xb - xa) / 4);
      const q = (cx, cy, x, yy) => `Q${n(cx)} ${n(cy)} ${n(x)} ${n(yy)}`;
      return `M${n(xa)} ${n(y + d)}${q(xa, y, xa + r, y)}H${n(m - r)}${q(m, y, m, y - d)}${q(m, y, m + r, y)}H${n(xb - r)}${q(xb, y, xb, y + d)}`;
    };
    const rowOf = (r) => {
      const parts = Array.isArray(r?.parts) ? r.parts : [];
      const once = parts.map((p) => {
        const raw = p && typeof p === "object" && !Array.isArray(p) ? p : { v: p };
        return { q: dim(raw.v), l: raw.l == null ? "" : String(raw.l) };
      });
      const reps = clamp(Math.round(opt(r?.groups, 1)), 1, 12);
      const all = [];
      for (let g = 0; g < reps; g++) for (const p of once) all.push(g ? { ...p, l: "" } : p);
      return {
        label: r?.label == null ? "" : String(r.label),
        total: dim(r?.total),
        parts: all,
        grouped: reps > 1,
      };
    };
    register("tape", (s) => {
      const rows = (Array.isArray(s.rows) ? s.rows : [s]).map(rowOf);
      if (!rows.some((r) => r.parts.length)) throw new RangeError("tape: parts is empty");
      const lw = Math.min(
        120,
        Math.max(0, ...rows.map((r) => (r.label ? tw(r.label, 15, true) + 16 : 0))),
      );
      const x0 = 22 + lw;
      const sums = rows.map((r) => r.parts.reduce((a, p) => a + (p.q?.v > 0 ? p.q.v : 0), 0));
      const nums = rows.flatMap((r) => r.parts.filter((p) => p.q?.v > 0).map((p) => p.q.v));
      const fallback = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 1;
      const weigh = (p) => (p.q?.v > 0 ? p.q.v : fallback);
      const totals = rows.map((r) => r.parts.reduce((a, p) => a + weigh(p), 0));
      const need = (r) =>
        r.parts.reduce((a, p) => a + Math.max(40, tw(say(p.q), 17, true) + 18), 0);
      const avail = Math.max(436 - lw, ...rows.map(need));
      const ppu = avail / Math.max(...totals, 1e-9);
      const Wd = x0 + avail + 22;
      const labelled = rows.some((r) => r.parts.some((p) => p.l));
      let y = 14;
      let body = "";
      const said = [];
      rows.forEach((r, ri) => {
        if (r.total) y += 40;
        const widths = r.parts.map((p) =>
          Math.max(40, tw(say(p.q), 17, true) + 18, weigh(p) * ppu),
        );
        const sum = widths.reduce((a, b) => a + b, 0);
        const k = sum > avail && totals[ri] * ppu <= avail ? avail / sum : 1;
        if (r.total) {
          body += D(brace(x0, x0 + sum * k, y - 12, 9), "sb");
          body += T(x0 + (sum * k) / 2, y - 28, say(r.total), { a: "middle", z: 18, c: "bd" });
        }
        if (r.label) body += T(14, y + 22, r.label, { z: 15, c: "bd", m: 1 });
        let x = x0;
        r.parts.forEach((p, i) => {
          const w = widths[i] * k;
          const open = !p.q || p.q.v == null;
          const fill = open ? "fw" : r.grouped || i % 2 === 0 ? "ft" : "fy";
          body += Rc(x, y, w, 44, `${fill} ${open ? "sq" : "sb"}`, 4);
          if (p.q) body += T(x + w / 2, y + 22, say(p.q), { a: "middle", z: 17, c: "bd", m: 1 });
          if (p.l) body += T(x + w / 2, y + 66, p.l, { a: "middle", z: 14 });
          x += w;
        });
        y += 44 + (labelled ? 36 : 14);
        const bits = r.parts.map((p) => (p.q ? say(p.q) : "an empty part"));
        const tot = r.total ? `, whole ${say(r.total)}` : "";
        said.push(`${r.label ? `${r.label}: ` : ""}${list(bits)}${tot}`);
        void sums;
      });
      const title = `Tape diagram${rows.length > 1 ? ` with ${rows.length} rows` : ""}: ${said.join("; ")}.`;
      return { w: Wd, h: y + 4, body, title, alt: title };
    });

    /* ---- dnl: double number line --------------------------------------------------------------- */
    register("dnl", (s) => {
      const rows = [s.top, s.bottom].map((r) => ({
        label: r?.label == null ? "" : String(r.label),
        vals: Array.isArray(r?.vals) ? r.vals : [],
      }));
      const m = Math.max(rows[0].vals.length, rows[1].vals.length);
      if (m < 1) throw new RangeError("dnl: both lines are empty");
      const lw = Math.min(
        130,
        Math.max(...rows.map((r) => (r.label ? tw(r.label, 15, true) + 16 : 0))),
      );
      const x0 = 28 + lw + 14;
      const sp = clamp((480 - x0 - 58) / Math.max(1, m - 1), 48, 96);
      const x1 = x0 + sp * (m - 1);
      const Wd = Math.max(480, x1 + 58);
      const ys = [82, 152];
      let body = "";
      for (let i = 0; i < m; i++) body += L(x0 + sp * i, ys[0], x0 + sp * i, ys[1], "sf");
      rows.forEach((r, ri) => {
        const y = ys[ri];
        body += L(x0 - 16, y, x1 + 30, y, "ax") + arrow(x1 + 36, y, 0);
        const lines = wrapLabel(r.label, lw, 15, true);
        lines.forEach((ln, i) => {
          body += T(16, y + (i - (lines.length - 1) / 2) * 18, ln, { z: 15, c: "bd", m: 1 });
        });
        for (let i = 0; i < m; i++) {
          const x = x0 + sp * i;
          const vy = ri ? y + 28 : y - 28;
          body += L(x, y - 7, x, y + 7, "tk");
          const v = r.vals[i];
          const dm = v == null || v === "" ? null : dim(v);
          if (!dm) body += Rc(x - 22, vy - 14, 44, 28, "fw sq", 6);
          else
            body += T(x, vy, dm.t, {
              a: "middle",
              z: tw(dm.t, 17, true) > sp - 8 ? 14 : 17,
              c: "bd",
              m: 1,
            });
        }
      });
      const read = (r) =>
        `${r.label || "line"}: ${Array.from({ length: m }, (_, i) => (r.vals[i] == null || r.vals[i] === "" ? "blank" : say(dim(r.vals[i])))).join(", ")}`;
      const title = `Double number line. ${read(rows[0])}. ${read(rows[1])}.`;
      return { w: Wd, h: ys[1] + 52, body, title, alt: title };
    });

    /* ---- table: ratio table with optional blank cells ------------------------------------------ */
    register("table", (s) => {
      const hd = (Array.isArray(s.hd) ? s.hd : []).map(String);
      const rows = (Array.isArray(s.rows) ? s.rows : []).map((r) => (Array.isArray(r) ? r : []));
      const cols = Math.max(hd.length, ...rows.map((r) => r.length));
      if (!cols) throw new RangeError("table: no columns");
      const blank = new Set(
        (Array.isArray(s.blank) ? s.blank : []).map((b) => `${b?.[0]},${b?.[1]}`),
      );
      const cell = (r, c) => {
        const v = rows[r][c];
        return blank.has(`${r},${c}`) || v == null
          ? ""
          : typeof v === "number"
            ? fmt(v)
            : String(v);
      };
      const cw = Array.from({ length: cols }, (_, c) =>
        Math.min(
          200,
          Math.max(
            92,
            tw(hd[c] || "", 15, true) + 32,
            ...rows.map((_r, r) => tw(cell(r, c), 18, true) + 34),
          ),
        ),
      );
      const heads = cw.map((w, c) => wrapLabel(hd[c] || "", w - 24, 15, true));
      const hh = 26 + Math.max(1, ...heads.map((h) => h.length)) * 19;
      const rh = 44;
      const tw0 = cw.reduce((a, b) => a + b, 0);
      const Wd = Math.max(480, tw0 + 44);
      const x0 = (Wd - tw0) / 2;
      const y0 = 20;
      const bodyH = rows.length * rh;
      const r = 10;
      let body = Rc(x0, y0, tw0, hh + bodyH, "fw sb", r);
      body += D(
        `M${n(x0)} ${n(y0 + hh)}V${n(y0 + r)}Q${n(x0)} ${n(y0)} ${n(x0 + r)} ${n(y0)}H${n(x0 + tw0 - r)}Q${n(x0 + tw0)} ${n(y0)} ${n(x0 + tw0)} ${n(y0 + r)}V${n(y0 + hh)}Z`,
        "ft sb",
      );
      for (let i = 1; i < rows.length; i++)
        body += L(x0, y0 + hh + i * rh, x0 + tw0, y0 + hh + i * rh, "sg");
      let x = x0;
      cw.forEach((w, c) => {
        if (c) body += L(x, y0 + 2, x, y0 + hh + bodyH - 2, "sg");
        heads[c].forEach((ln, i) => {
          body += T(x + w / 2, y0 + 25 + (i - (heads[c].length - 1) / 2) * 0 + i * 19, ln, {
            a: "middle",
            z: 15,
            c: "bd",
          });
        });
        rows.forEach((_r, ri) => {
          const cy = y0 + hh + ri * rh + rh / 2;
          if (blank.has(`${ri},${c}`)) body += Rc(x + 11, cy - 15, w - 22, 30, "fw sq", 6);
          else body += T(x + w / 2, cy, cell(ri, c), { a: "middle", z: 18, c: "bd", m: 1 });
        });
        x += w;
      });
      const heading = hd.filter(Boolean);
      const nb = rows.reduce(
        (a, _r, ri) => a + [...Array(cols).keys()].filter((c) => blank.has(`${ri},${c}`)).length,
        0,
      );
      const head = `Table${heading.length ? ` with columns ${list(heading)}` : ""}, ${plural(rows.length, "row")}${nb ? `, ${plural(nb, "empty box")} to fill in` : ""}`;
      const say1 = rows.map(
        (_r, ri) =>
          `Row ${ri + 1}: ${Array.from({ length: cols }, (_, c) => (blank.has(`${ri},${c}`) ? "blank" : cell(ri, c) || "empty")).join(", ")}`,
      );
      const title = `${head}.`;
      return { w: Wd, h: y0 + hh + bodyH + 20, body, title, alt: `${head}. ${say1.join(". ")}.` };
    });

    /* ---- bar1: fraction bars -------------------------------------------------------------------- */
    /** 45-degree hatch lines clipped to the cell (x, y, w, h): the "shaded" cue that does not rely on colour. */
    const hatch = (x, y, w, h, gap) => {
      let out = "";
      for (let c = -h + gap / 2; c < w; c += gap) {
        let [xa, ya, xb, yb] = [x + c, y + h, x + c + h, y];
        if (xa < x) [xa, ya] = [x, ya - (x - xa)];
        if (xb > x + w) [xb, yb] = [x + w, yb + (xb - x - w)];
        if (xb - xa > 0.5) out += L(xa, ya, xb, yb, "sx");
      }
      return out;
    };
    register("bar1", (s) => {
      const d = Math.round(req(s.d, "bar1 d"));
      const part = Math.round(req(s.n, "bar1 n"));
      const whole = Math.round(opt(s.whole, 0));
      if (d < 1 || d > 48 || part < 0 || whole < 0)
        throw new RangeError("bar1: need 1 <= d <= 48 and n, whole >= 0");
      const shaded = whole * d + part;
      const bars = Math.max(1, Math.ceil(shaded / d));
      if (bars > 12) throw new RangeError("bar1: too many bars");
      const cw = Math.min(64, 420 / d);
      const bw = cw * d;
      const x0 = (480 - bw) / 2;
      const bh = 46;
      let body = "";
      for (let b = 0; b < bars; b++) {
        const y = 22 + b * (bh + 14);
        for (let i = 0; i < d; i++) {
          const on = b * d + i < shaded;
          body += Rc(x0 + i * cw, y, cw, bh, `${on ? "fa" : "fw"} sc`);
          if (on) body += hatch(x0 + i * cw, y, cw, bh, 9);
        }
        body += Rc(x0, y, bw, bh, "fn sb", 4);
      }
      const frac = whole > 0 ? `${whole} ${part}/${d}` : `${part}/${d}`;
      let h = 22 + bars * (bh + 14) + 8;
      if (s.label) {
        body += T(240, h + 14, frac, { a: "middle", z: 20, c: "bd" });
        h += 34;
      }
      const base = `${bars === 1 ? "Fraction bar" : `${bars} fraction bars`} cut into ${plural(d, "equal part")}${bars === 1 ? "" : " each"}`;
      const alt = `${base}: ${plural(shaded, "part")} shaded in all.`;
      return { w: 480, h, body, title: `${base}.`, alt };
    });
  };
  if (V.kit) boot();
  else (V.pending = V.pending || []).push(boot);
})();
