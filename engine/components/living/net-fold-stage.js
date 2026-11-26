// living/net-fold-stage.js — the shared stage for nets (net-fold and surface-area).
//
// One pool of face polygons that never changes identity: a face is the same
// <polygon> in the flat net, mid-fold, and closed, in every scene, and when the
// solid's measurements change. A frame is described by a plain `view` object,
// so a scene says WHAT the stage shows and this module draws it (and animates
// between two views by re-drawing a fresh view every frame, which keeps a fold
// a true rotation instead of a blend of two pictures).

import { prefersReducedMotion } from "../../core/living-scene.js";
import { fitView, poseFaces, projectPoint } from "./net-fold-model.js";

const PAIR_STYLES = [
  { fill: "var(--lsx-x)", fo: 0.4 },
  { fill: "var(--lsx-u)", fo: 0.4 },
  { fill: "var(--lsx-muted)", fo: 0.2 },
];

const area2 = (pts) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
};

/**
 * stage = createNetStage(ctx, { W, H, pad, solids, maxFaces })
 *   solids — every solid the play will draw, so one scale fits them all
 *   stage.draw(view)            draw instantly
 *   stage.run(ctx, frame, ms)   frame(u) -> view for u in 0..1 (snaps when motion is reduced)
 *   stage.onFace = (id) => {}   set while faces are clickable
 *
 * view = { solid, t, fit?: {k,ox,oy}, faces: { id: { l1, l2, fill, fo, stroke, sw, dash, pair } },
 *          segs: [{ id, a, b, label, stroke, dash }] }
 */
export function createNetStage(ctx, { W, H, pad = 18, solids, maxFaces = 6 }) {
  const { svg, svgEl } = ctx;
  svg.innerHTML = "";
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const fit = fitView(solids, W, H, pad);
  const g = svgEl("g", {}, svg);
  const halo = {
    stroke: "var(--lsx-card)",
    "stroke-width": 4,
    "paint-order": "stroke",
    "text-anchor": "middle",
    fill: "var(--lsx-ink)",
    "pointer-events": "none",
  };
  const pool = Array.from({ length: maxFaces }, () => {
    const grp = svgEl("g", {}, g);
    return {
      grp,
      poly: svgEl("polygon", { "stroke-linejoin": "round" }, grp),
      t1: svgEl("text", { ...halo, "font-size": 15, "font-weight": 800 }, grp),
      t2: svgEl("text", { ...halo, "font-size": 14, "font-weight": 700 }, grp),
    };
  });
  const segs = Array.from({ length: 3 }, () => ({
    line: svgEl("line", { "stroke-width": 3 }, g),
    txt: svgEl("text", { ...halo, "font-size": 14, "font-weight": 800 }, g),
  }));
  let order = "";
  let token = 0;
  const stage = {
    /** @type {null | ((id: string) => void)} */
    onFace: null,
    fit,
    draw(view) {
      const { solid, t } = view;
      const posed = poseFaces(solid, t);
      const pairs = [...new Set(solid.faces.map((f) => f.pair))];
      const fp = view.fit ?? fit.at(t);
      const proj = (p) => [fp.ox + p[0] * fp.k, fp.oy + p[1] * fp.k];
      const keyed = posed.map((p, i) => ({ p, f: solid.faces[i], el: pool[i] }));
      keyed.forEach(({ p, f, el }) => {
        const pts = p.pts3.map(proj);
        const st = view.faces?.[f.id] || {};
        const pair = PAIR_STYLES[pairs.indexOf(f.pair) % PAIR_STYLES.length];
        el.grp.setAttribute("display", "");
        el.poly.setAttribute(
          "points",
          pts.map((q) => q.map((v) => v.toFixed(1)).join(",")).join(" "),
        );
        el.poly.setAttribute("fill", p.facing ? (st.fill ?? pair.fill) : "none");
        el.poly.setAttribute("fill-opacity", String(st.fo ?? pair.fo));
        el.poly.setAttribute("stroke", st.stroke ?? "var(--lsx-ink)");
        el.poly.setAttribute("stroke-width", String(p.facing ? (st.sw ?? 2) : 1.5));
        el.poly.setAttribute("stroke-dasharray", p.facing ? (st.dash ?? "") : "5 4");
        el.poly.style.cursor = stage.onFace && p.facing ? "pointer" : "default";
        el.poly.dataset.face = f.id;
        let cx = pts.reduce((s, q) => s + q[0], 0) / pts.length;
        let cy = pts.reduce((s, q) => s + q[1], 0) / pts.length;
        if (pts.length === 3) {
          // triangles are widest at the base (pts 0 and 1): sit the label nearer it
          cx += 0.3 * ((pts[0][0] + pts[1][0]) / 2 - cx);
          cy += 0.3 * ((pts[0][1] + pts[1][1]) / 2 - cy);
        }
        const a = area2(pts);
        const bw = Math.max(...pts.map((q) => q[0])) - Math.min(...pts.map((q) => q[0]));
        const show1 = p.facing && st.l1 && a > 420 && bw > st.l1.length * 7.6 + 4;
        const show2 = p.facing && st.l2 && a > 900 && bw > st.l2.length * 7.4 + 4;
        el.t1.textContent = st.l1 || "";
        el.t2.textContent = st.l2 || "";
        el.t1.setAttribute("x", cx.toFixed(1));
        el.t1.setAttribute("y", (cy + (show2 ? -3 : 5)).toFixed(1));
        el.t2.setAttribute("x", cx.toFixed(1));
        el.t2.setAttribute("y", (cy + 17).toFixed(1));
        el.t1.setAttribute("opacity", show1 ? "1" : "0");
        el.t2.setAttribute("opacity", show2 ? "1" : "0");
      });
      pool.slice(solid.faces.length).forEach((el) => el.grp.setAttribute("display", "none"));
      // far faces first so a nearer face paints over a farther one
      const sorted = [...keyed].sort(
        (u, v) => Number(u.p.facing) - Number(v.p.facing) || v.p.z - u.p.z,
      );
      const key = sorted.map((s) => keyed.indexOf(s)).join();
      if (key !== order) {
        order = key;
        for (const s of sorted) g.insertBefore(s.el.grp, segs[0].line);
      }
      segs.forEach((sg, i) => {
        const d = view.segs?.[i];
        const on = !!d;
        sg.line.setAttribute("opacity", on ? "1" : "0");
        sg.txt.setAttribute("opacity", on ? "1" : "0");
        if (!d) return;
        const [p0, p1] = [d.a, d.b].map((e) => proj(projectPoint(solid, e.id, e.pt, t)));
        for (const [k, v] of [
          ["x1", p0[0]],
          ["y1", p0[1]],
          ["x2", p1[0]],
          ["y2", p1[1]],
        ])
          sg.line.setAttribute(k, v.toFixed(1));
        sg.line.setAttribute("stroke", d.stroke ?? "var(--lsx-hi)");
        sg.line.setAttribute("stroke-dasharray", d.dash ?? "7 5");
        sg.txt.textContent = d.label || "";
        const mx = (p0[0] + p1[0]) / 2;
        const my = (p0[1] + p1[1]) / 2;
        sg.txt.setAttribute("x", (mx + (d.dx ?? 12)).toFixed(1));
        sg.txt.setAttribute("y", (my + 5).toFixed(1));
        sg.txt.setAttribute("text-anchor", "start");
      });
    },
    run(c, frame, ms) {
      token++;
      const mine = token;
      if (
        ms <= 0 ||
        c.restoring ||
        prefersReducedMotion() ||
        typeof requestAnimationFrame !== "function"
      ) {
        stage.draw(frame(1));
        return Promise.resolve();
      }
      return new Promise(
        /** @param {(v?: any) => void} resolve */ (resolve) => {
          const t0 = performance.now();
          const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
          const step = (now) => {
            if (mine !== token || !svg.isConnected) return resolve();
            const u = Math.min(1, (now - t0) / ms);
            stage.draw(frame(u < 1 ? ease(u) : 1));
            if (u < 1) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        },
      );
    },
    /** Cancel any running animation (a scene calls this before drawing its own end state). */
    cancel() {
      token++;
    },
  };
  for (const el of pool) {
    el.poly.addEventListener("click", () => {
      const id = el.poly.dataset.face;
      if (id && stage.onFace) stage.onFace(id);
    });
  }
  return stage;
}
