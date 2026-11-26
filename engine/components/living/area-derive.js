// living/area-derive.js — where the area formula comes from, by moving pieces.
//
// One cast for the whole play: two pieces of one figure. The pieces ARE the
// shape in scene 1, are what the student predicts about, are cut/copied and
// moved by hand in scene 3 (a parallelogram's triangle slides across to make a
// rectangle; a triangle or trapezoid is copied and the copy turns half-way
// round to make a parallelogram), and the same pieces carry the formula in
// scene 4. Scene 5 leans the figure while base and height stay put: the area
// does not move. Scene 6 is a new figure with no pieces.
//
// Config: { shape: "parallelogram"|"triangle"|"trapezoid", h, b | b1,b2,
//   offset|apex, unit:{abbr,sq}, story:{en,es}, transfer:{…same dims…} } —
// the lesson's own numbers. The model refuses figures the stage cannot draw.

import { escHtml, prefersReducedMotion } from "../../core/living-scene.js";
import {
  area,
  bounds,
  choiceSet,
  deriveCopy,
  fmt,
  formula,
  geom,
  leanMax,
  placeCorrect,
  slantLabel,
  validateAreaDerive,
  wholeArea,
} from "./area-derive-model.js";

export { validateAreaDerive };

const W = 440;
const ML = 92; // room for the slanted-side label
const MR = 16;
const TOP = 30;
const BOT = 40; // under the baseline: the base label
const MAXH = 290;
const FLIPS = 12; // slider steps for the whole flip: 6 sideways, then 6 upside down

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** A movable group: its pose is translate + scale about a pivot (a flip), kept in JS. */
export const poseOf = (el) => ({ el, dx: 0, dy: 0, sx: 1, sy: 1, px: 0, py: 0 });
export function paintPose(p) {
  p.el.setAttribute(
    "transform",
    `translate(${p.dx} ${p.dy}) translate(${p.px} ${p.py}) scale(${p.sx} ${p.sy}) translate(${-p.px} ${-p.py})`,
  );
}
/** Mirror scales for flip step k: sideways (sx 1 to -1), then upside down (sy 1 to -1). */
export const flipScales = (k) => ({
  sx: Math.cos((Math.min(k, FLIPS / 2) / (FLIPS / 2)) * Math.PI),
  sy: Math.cos((Math.max(0, k - FLIPS / 2) / (FLIPS / 2)) * Math.PI),
});

/**
 * Pose animation the kernel's attribute tween cannot do (rotation). A newer
 * run supersedes an older one; reduced motion applies the end state at once.
 */
export function makeMotion() {
  let epoch = 0;
  return {
    run(items, ms) {
      const my = ++epoch;
      const tr = items.map(([p, to]) => ({
        p,
        from: { dx: p.dx, dy: p.dy, sx: p.sx, sy: p.sy },
        to: { dx: to.dx ?? p.dx, dy: to.dy ?? p.dy, sx: to.sx ?? p.sx, sy: to.sy ?? p.sy },
      }));
      const set = (t) => {
        for (const { p, from, to } of tr) {
          p.dx = from.dx + (to.dx - from.dx) * t;
          p.dy = from.dy + (to.dy - from.dy) * t;
          p.sx = from.sx + (to.sx - from.sx) * t;
          p.sy = from.sy + (to.sy - from.sy) * t;
          paintPose(p);
        }
      };
      if (ms <= 0 || prefersReducedMotion() || typeof requestAnimationFrame !== "function") {
        set(1);
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        const t0 = performance.now();
        const step = (now) => {
          if (my !== epoch || !items[0]?.[0].el.isConnected) return resolve(undefined);
          const t = Math.min(1, (now - t0) / ms);
          set(ease(t));
          if (t < 1) requestAnimationFrame(step);
          else resolve(undefined);
        };
        requestAnimationFrame(step);
      });
    },
  };
}

/** A seed for placeCorrect that never leaves the correct choice first. */
export const seedFor = (n, ...parts) => {
  const seed = parts.reduce((a, x, i) => a + Math.round(x * 10) * (i + 3), 1);
  return seed % n === 0 ? seed + 1 : seed;
};

export function buildAreaDerivePlay(cfg) {
  const v = validateAreaDerive(cfg);
  if (!v) return null;
  const T = deriveCopy(v);
  const main = v.main;
  const xfer = v.transfer.spec;
  const par = main.shape === "parallelogram";
  const trap = main.shape === "trapezoid";
  // The frame fits everything a figure does on the stage (see `bounds`).
  const frameOf = (sp) => {
    const b = bounds(sp);
    const [bw, bh] = [b.maxX - b.minX, b.maxY - b.minY];
    const s = Math.min((W - ML - MR) / bw, MAXH / bh);
    return {
      s,
      X0: ML + (W - ML - MR - bw * s) / 2 - b.minX * s,
      Y0: TOP + b.maxY * s,
      H: TOP + bh * s + BOT,
    };
  };
  const H = Math.round(Math.max(frameOf(main).H, frameOf(xfer).H));
  const motion = makeMotion();
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;
  const X = { fill: "var(--lsx-x)", stroke: "var(--lsx-ink)" };
  const U = { fill: "var(--lsx-u)", stroke: "var(--lsx-ink)" };

  let spec = main;
  let unit = v.unit;
  let fr = frameOf(main);
  let c = null; // the cast
  let sceneId = 0; // a scene that was left must not finish drawing over the next

  const P = (x, y) => [fr.X0 + x * fr.s, fr.Y0 - y * fr.s];
  const pts = (poly) => poly.map(([x, y]) => P(x, y).join(",")).join(" ");

  /** Switch the stage to a figure (main or transfer): scale, grid, pose reset. */
  function useSpec(sp, un) {
    spec = sp;
    unit = un;
    fr = frameOf(sp);
    for (const p of [c.p1, c.p2]) Object.assign(p, { dx: 0, dy: 0, sx: 1, sy: 1 }), paintPose(p);
    if (sp.shape === "parallelogram") {
      const o = sp.lean;
      let d = "";
      for (let k = 1; k < sp.b; k++) d += `M${P(o + k, 0)} L${P(o + k, sp.h)} `;
      for (let k = 1; k < sp.h; k++) d += `M${P(o, k)} L${P(o + sp.b, k)} `;
      c.grid.setAttribute("d", d.replaceAll(",", " "));
    }
  }

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs, parent = g) => svgEl(tag, { opacity: 0, ...attrs }, parent);
    const text = (attrs) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 16,
        "font-weight": 800,
        fill: "var(--lsx-ink)",
        stroke: "var(--lsx-card)",
        "stroke-width": 3,
        "paint-order": "stroke",
        ...attrs,
      });
    const dash = { fill: "none", stroke: "var(--lsx-lo)", "stroke-width": 3 };
    const ghost = el("polygon", { ...dash, "stroke-dasharray": "9 6", "stroke-linejoin": "round" });
    const piece = () => {
      const grp = el("g", {});
      const poly = svgEl(
        "polygon",
        { "stroke-width": 2.5, "stroke-linejoin": "round", "fill-opacity": 0.4 },
        grp,
      );
      return { ...poseOf(grp), poly };
    };
    const p1 = piece();
    const p2 = piece();
    const grid = el("path", {
      fill: "none",
      stroke: "var(--lsx-ink)",
      "stroke-opacity": 0.3,
      "stroke-width": 1.5,
      "pointer-events": "none",
    });
    const slantLine = el("line", {
      stroke: "var(--lsx-lo)",
      "stroke-width": 4,
      "stroke-dasharray": "1 7",
      "stroke-linecap": "round",
    });
    const heightLine = el("line", {
      stroke: "var(--lsx-ink)",
      "stroke-width": 3,
      "stroke-dasharray": "7 5",
    });
    const angle = el("path", { fill: "none", stroke: "var(--lsx-ink)", "stroke-width": 2.5 });
    const pivot = el("circle", { r: 6, fill: "var(--lsx-ink)", stroke: "var(--lsx-card)" });
    c = {
      ghost,
      p1,
      p2,
      grid,
      slantLine,
      heightLine,
      angle,
      pivot,
      tBase: text({ "text-anchor": "middle" }),
      tTop: text({}),
      tH: text({ fill: "var(--lsx-hi)" }),
      tSlantA: text({ fill: "var(--lsx-lo)", "text-anchor": "end" }),
      tSlantB: text({ fill: "var(--lsx-lo)", "text-anchor": "end" }),
      tArea: text({ "font-size": 20 }),
    };
    useSpec(main, v.unit);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  }

  /**
   * Put the whole stage in one state (every scene calls this, so Back, a step
   * dot and resume all look alike). o: { lean, slide, copy, turn, copyOpacity,
   * tint, seam, final, guides, slant, hiSlant, hiTop, ghost, grid, pivot, area, areaAt }
   */
  function view(ctx, o = {}, ms = 0) {
    const t = ctx.restoring ? 0 : ms;
    const un = ctx.L(unit.abbr);
    const lean = o.lean ?? spec.lean;
    const gm = geom(spec, lean);
    const sl = slantLabel(spec);
    const seam = par && o.seam;
    const span = o.final
      ? par
        ? [lean, lean + spec.b]
        : [0, trap ? spec.b2 : spec.b]
      : gm.baseSpan;
    const look = (poly, l) => {
      poly.setAttribute("fill", l.fill);
      poly.setAttribute("stroke", l.stroke);
    };
    c.p1.poly.setAttribute("points", pts(seam ? gm.outline : gm.p1));
    c.p2.poly.setAttribute("points", pts(par ? gm.p2 : gm.p1));
    look(c.p1.poly, X);
    look(c.p2.poly, trap || spec.shape === "triangle" || o.tint ? U : X);
    c.ghost.setAttribute("points", pts(gm.final));
    const m = [];
    const put = (el, a) => m.push([el, a]);
    put(c.p1.el, { opacity: 1 });
    put(c.p2.el, { opacity: par ? (seam ? 0 : 1) : o.copy ? (o.copyOpacity ?? 1) : 0 });
    put(c.ghost, { opacity: o.ghost ? 1 : 0 });
    put(c.grid, { opacity: o.grid ? 1 : 0 });
    // Guides: the height (dashed, with its square corner) and the base label(s).
    const [fx, fy0] = P(gm.foot, 0);
    const fy1 = P(gm.foot, spec.h)[1];
    const mid = (span[0] + span[1]) / 2;
    const sg = gm.foot > mid ? -1 : 1;
    const e = fx + sg * 11;
    c.angle.setAttribute("d", `M${e} ${fy0} L${e} ${fy0 - 11} L${fx} ${fy0 - 11}`);
    const gd = o.guides ? 1 : 0;
    const row = fr.Y0 + 24;
    put(c.heightLine, { opacity: gd, x1: fx, x2: fx, y1: fy0, y2: fy1 });
    put(c.angle, { opacity: gd });
    const hy = fr.Y0 - Math.max(18, spec.h * fr.s * 0.14);
    const hAnchor = sg > 0 ? "start" : "end";
    const hTxt = `${ctx.L(T.height)} = ${spec.h} ${un}`;
    put(c.tH, { opacity: gd, x: fx + sg * 10, y: hy, "text-anchor": hAnchor, text: hTxt });
    const baseTxt = trap ? `b2 = ${spec.b2} ${un}` : `${ctx.L(T.base)} = ${spec.b} ${un}`;
    put(c.tBase, { opacity: gd, x: P(mid, 0)[0], y: row, text: baseTxt });
    if (trap) {
      const tx = P(o.final ? spec.b2 + spec.b1 / 2 : lean + spec.b1 / 2, 0)[0];
      const ty = o.final ? row : fr.Y0 - spec.h * fr.s - 10;
      const hl = o.hiTop;
      const a = { opacity: gd, x: tx, y: ty, text: `b1 = ${spec.b1} ${un}` };
      put(c.tTop, {
        ...a,
        fill: hl ? "var(--lsx-lo)" : "var(--lsx-ink)",
        "font-size": hl ? 19 : 16,
      });
    } else put(c.tTop, { opacity: 0 });
    // The slanted side: dotted along the left side; numbers only on the real figure.
    const [sx0, sy0] = P(0, 0);
    const [sx1, sy1] = P(lean, spec.h);
    const slOn = o.slant && lean > 0;
    const sw = o.hiSlant ? 7 : 4;
    put(c.slantLine, {
      opacity: slOn ? 1 : 0,
      x1: sx0,
      y1: sy0,
      x2: sx1,
      y2: sy1,
      "stroke-width": sw,
    });
    const len = Math.hypot(lean, spec.h);
    const [mx, my] = P(lean / 2, spec.h / 2);
    const [lx, ly] = [mx - (spec.h / len) * 16, my - (lean / len) * 16];
    const num = slOn && o.slant === true && sl != null && lean === spec.lean ? 1 : 0;
    const sTxt = `${Number.isInteger(sl) ? "" : "≈ "}${fmt(sl ?? 0)} ${un}`;
    put(c.tSlantA, { opacity: num, x: lx, y: ly - 2, text: ctx.L(T.slantShort) });
    put(c.tSlantB, { opacity: num, x: lx, y: ly + 15, text: sTxt });
    // The pivot and the area readout depend on the geometry just computed.
    const piv = gm.pivot ? P(gm.pivot[0], gm.pivot[1]) : [0, 0];
    const at = o.areaAt === "p1" ? gm.p1 : gm.final;
    const [ax] = P(at.reduce((a, p) => a + p[0], 0) / at.length, 0);
    const cy = fr.Y0 - (at.reduce((a, p) => a + p[1], 0) / at.length) * fr.s;
    put(c.pivot, { opacity: o.pivot && gm.pivot ? 1 : 0, cx: piv[0], cy: piv[1] });
    put(c.tArea, {
      opacity: o.area ? 1 : 0,
      x: ax,
      y: cy + 6,
      text: o.area ?? c.tArea.textContent,
    });
    // Poses: a parallelogram slides its triangle; the others flip a copy over the pivot.
    [c.p2.px, c.p2.py] = piv;
    const flat = { dx: 0, dy: 0, sx: 1, sy: 1 };
    const pose = par
      ? { ...flat, dx: (o.slide ?? 0) * fr.s }
      : { ...flat, ...flipScales(o.turn ?? 0) };
    return Promise.all([
      ctx.tween(m, t),
      motion.run(
        [
          [c.p1, flat],
          [c.p2, pose],
        ],
        t,
      ),
    ]);
  }

  const sqAbbr = (ctx) => `${ctx.L(unit.abbr)}²`;
  const SHAPE = { guides: true, slant: true, seam: true };
  const cueView = (opt) => ({
    ...SHAPE,
    hiSlant: opt.kind === "slant",
    ghost: opt.kind === "half" || opt.kind === "noHalf",
    hiTop: opt.kind === "longBase",
  });
  const choiceOpts = (sp, seed) =>
    placeCorrect(
      choiceSet(sp).map((o) => ({ ...o, label: fmt(o.value) })),
      seed,
    );
  const enterScene = (sp, un) => {
    sceneId++;
    useSpec(sp, un);
    return sceneId;
  };

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        enterScene(main, v.unit);
        ctx.expr(escHtml("A = ?"));
        ctx.say(T.situateSay);
        await view(ctx, SHAPE, 500);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        enterScene(main, v.unit);
        ctx.expr(escHtml("A = ?"));
        ctx.say(T.predictSay);
        const options = choiceOpts(main, seedFor(4, area(main), main.h, main.lean));
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.cue(opt, main, v.unit), "cue");
              view(ctx, cueView(opt), 300);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              view(ctx, SHAPE, 300);
            },
          }),
        );
        await view(ctx, SHAPE, 300);
      },
    },
    {
      id: "build",
      label: T.scene.build,
      gate: true,
      async enter(ctx) {
        enterScene(main, v.unit);
        const st = ctx.state;
        const max = par ? main.b : FLIPS;
        let k = Number.isInteger(st.k) && st.k >= 0 && st.k <= max ? st.k : 0;
        const o = (kk) =>
          par
            ? { guides: true, tint: true, slide: kk }
            : { guides: true, copy: true, pivot: true, turn: kk };
        const readout = (kk) => (par ? `${kk} ${ctx.L(unit.abbr)}` : `${kk} / ${FLIPS}`);
        const done = () => {
          ctx.feedback(T.buildDone);
          ctx.unlock();
        };
        const rng = ctx.range({
          label: par ? T.slideLabel : T.turnLabel,
          min: 0,
          max,
          value: k,
          onInput: (val) => {
            k = val;
            st.k = val;
            ctx.save();
            view(ctx, o(val), 0);
            if (val === max) done();
            else ctx.feedback(val ? (par ? T.slideKeep(max - val) : T.turnKeep) : "");
          },
        });
        const input = /** @type {HTMLInputElement} */ (rng.querySelector("input"));
        const out = /** @type {HTMLOutputElement} */ (rng.querySelector("output"));
        out.textContent = readout(k);
        input.addEventListener("input", () => {
          out.textContent = readout(Number(input.value));
        });
        ctx.panel.appendChild(rng);
        ctx.expr("");
        ctx.say(T.buildSay);
        await view(ctx, o(k), 500);
        if (k === max) done();
      },
    },
    {
      id: "connect",
      label: T.scene.connect,
      async enter(ctx) {
        const me = enterScene(main, v.unit);
        const st = ctx.state;
        const A = fmt(area(main));
        const Wh = fmt(wholeArea(main));
        const sq = sqAbbr(ctx);
        const fin = par
          ? {
              final: true,
              guides: true,
              tint: true,
              slide: main.b,
              grid: true,
              area: `${Wh} ${sq}`,
            }
          : { final: true, guides: true, copy: true, turn: FLIPS, area: `${Wh} ${sq}` };
        const wholeExpr = par
          ? `${hi(`${ctx.L(T.base)} ${main.b}`)} × ${lo(`${ctx.L(T.height)} ${main.h}`)} = ${escHtml(Wh)}`
          : trap
            ? `(${hi(`${main.b1} + ${main.b2}`)}) × ${lo(String(main.h))} = ${escHtml(Wh)}`
            : `${hi(String(main.b))} × ${lo(String(main.h))} = ${escHtml(Wh)}`;
        ctx.expr(wholeExpr);
        ctx.say(T.connectSay1);
        if (par) {
          await view(ctx, fin, 600);
          return;
        }
        const half = { ...fin, copyOpacity: 0.18, area: `${A} ${sq}`, areaAt: "p1" };
        const showHalf = (ms) => {
          if (me !== sceneId) return Promise.resolve();
          ctx.expr(`½ × ${escHtml(Wh)} = ${hi(A)}`);
          ctx.say(T.connectSay2);
          return view(ctx, half, ms);
        };
        const btn = ctx.button({
          label: { en: "Take half of it", es: "Toma la mitad" },
          primary: true,
          onClick: () => {
            st.half = true;
            ctx.save();
            btn.disabled = true;
            showHalf(500);
          },
        });
        btn.style.justifySelf = "start";
        ctx.panel.appendChild(btn);
        if (st.half) {
          btn.disabled = true;
          await showHalf(0);
        } else await view(ctx, fin, 600);
      },
    },
    {
      id: "change",
      label: T.scene.change,
      gate: true,
      async enter(ctx) {
        enterScene(main, v.unit);
        const st = ctx.state;
        const max = leanMax(main);
        st.seen = Array.isArray(st.seen)
          ? st.seen.filter((x) => Number.isInteger(x) && x >= 0 && x <= max)
          : [];
        const start = st.seen.length ? st.seen[st.seen.length - 1] : main.lean;
        const A = fmt(area(main));
        const table = document.createElement("p");
        table.className = "lsx-fb";
        table.setAttribute("aria-live", "polite");
        const apply = (val, ms) => {
          table.innerHTML = ctx.L(T.changeRow);
          ctx.expr(`${escHtml(formula(main))} = ${hi(A)}`);
          return view(
            ctx,
            { lean: val, guides: true, slant: "line", seam: true, area: `${A} ${sqAbbr(ctx)}` },
            ms,
          );
        };
        const progress = () => {
          if (st.seen.length >= 3) {
            ctx.feedback(T.changeLesson);
            ctx.unlock();
          } else ctx.feedback(st.seen.length ? T.tryMore(3 - st.seen.length) : T.tryThree, "cue");
        };
        const rng = ctx.range({
          label: T.leanLabel,
          min: 0,
          max,
          value: start,
          onInput: (val) => {
            if (!st.seen.includes(val) && val !== main.lean) st.seen.push(val);
            ctx.save();
            apply(val, 0);
            progress();
          },
        });
        const input = /** @type {HTMLInputElement} */ (rng.querySelector("input"));
        const out = /** @type {HTMLOutputElement} */ (rng.querySelector("output"));
        out.textContent = `${start} ${ctx.L(unit.abbr)}`;
        input.addEventListener("input", () => {
          out.textContent = `${input.value} ${ctx.L(unit.abbr)}`;
        });
        ctx.panel.append(rng, table);
        ctx.say(T.changeSay);
        await apply(start, 500);
        progress();
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        const tr = v.transfer;
        enterScene(tr.spec, tr.unit);
        ctx.expr(escHtml("A = ?"));
        ctx.say(T.transferSay);
        const options = choiceOpts(tr.spec, seedFor(4, area(tr.spec), tr.spec.h, tr.spec.lean, 7));
        const sq = sqAbbr(ctx);
        const solved = () => {
          ctx.expr(`${escHtml(formula(tr.spec))} = ${hi(fmt(area(tr.spec)))}`);
          return view(ctx, { ...SHAPE, area: `${fmt(area(tr.spec))} ${sq}` }, 400);
        };
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.cue(opt, tr.spec, tr.unit), "cue");
              view(ctx, cueView(opt), 300);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              solved();
            },
          }),
        );
        if (saved.solved) await solved();
        else await view(ctx, SHAPE, 400);
        ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
      },
    },
  ];

  return {
    kicker: T.kicker,
    title: T.title,
    viewBox: `0 0 ${W} ${H}`,
    ariaLabel: T.ariaLabel,
    printSummary: T.printSummary,
    setup,
    scenes,
  };
}
