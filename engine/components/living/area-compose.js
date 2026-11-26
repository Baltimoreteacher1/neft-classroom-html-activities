// living/area-compose.js — a composite figure: split it, find each part, add or subtract.
//
// One cast for the whole play: two rectangles. They ARE the L-shaped room in
// scene 1, are pulled apart by hand in scene 3 (each piece is a rectangle the
// student can measure), slide back together to ADD in scene 4, re-split the
// same room two other ways in scene 5 (the SAME two rectangles resize, so the
// student sees the area does not move — and that "big rectangle minus the
// missing corner" is the subtract version), and carry the pool-with-a-cutout
// in scene 6 with nothing to move.
//
// Config: { base:{w,h}, arm:{w,h}, unit:{abbr,sq}, story:{en,es},
//   transfer:{ outer:{w,h}, cut:{x,y,w,h}, unit?, story? } } — the lesson's own numbers.

import { escHtml } from "../../core/living-scene.js";
import {
  areaOf,
  composeCopy,
  lChoices,
  placeCorrect,
  poolChoices,
  total,
  validateAreaCompose,
} from "./area-compose-model.js";
import { seedFor } from "./area-derive.js";

export { validateAreaCompose };

const W = 440;
const PAD = 24;
const TOP = 24;
const BOT = 54;
const MAXH = 270;
const EXPLODE = 2; // how far the arm lifts away in scene 3, in units

export function buildAreaComposePlay(cfg) {
  const v = validateAreaCompose(cfg);
  if (!v) return null;
  const T = composeCopy(v);
  const { L, cuts, pool } = v;
  const hi = (s) => `<span class="lsx-hi">${escHtml(String(s))}</span>`;
  const lo = (s) => `<span class="lsx-lo">${escHtml(String(s))}</span>`;
  const sizes = { l: [L.base.w, L.H + EXPLODE], pool: [pool.W, pool.H] };
  const frameOf = (/** @type {number[]} */ size) => {
    const [bw, bh] = size;
    const s = Math.min((W - 2 * PAD) / bw, MAXH / bh);
    return { s, X0: (W - bw * s) / 2, Y0: TOP + bh * s, H: TOP + bh * s + BOT };
  };
  const H = Math.round(Math.max(frameOf(sizes.l).H, frameOf(sizes.pool).H));
  let fr = frameOf(sizes.l);
  let c = null;

  const LOOK = {
    add: {
      fill: "var(--lsx-x)",
      stroke: "var(--lsx-ink)",
      "fill-opacity": 0.4,
      "stroke-dasharray": "none",
    },
    add2: {
      fill: "var(--lsx-u)",
      stroke: "var(--lsx-ink)",
      "fill-opacity": 0.45,
      "stroke-dasharray": "none",
    },
    cut: {
      fill: "var(--lsx-card)",
      stroke: "var(--lsx-lo)",
      "fill-opacity": 1,
      "stroke-dasharray": "8 5",
    },
  };

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs) => svgEl(tag, { opacity: 0, ...attrs }, g);
    const text = (attrs) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 18,
        "font-weight": 800,
        fill: "var(--lsx-ink)",
        stroke: "var(--lsx-card)",
        "stroke-width": 3,
        "paint-order": "stroke",
        "pointer-events": "none",
        ...attrs,
      });
    const rect = (attrs) =>
      el("rect", { "stroke-width": 2.5, "stroke-linejoin": "round", ...attrs });
    const dash = {
      fill: "none",
      stroke: "var(--lsx-lo)",
      "stroke-width": 3,
      "stroke-dasharray": "9 6",
    };
    c = {
      bbox: rect(dash),
      notch: rect({ ...dash, fill: "var(--lsx-u)", "fill-opacity": 0.35 }),
      p: [rect({}), rect({})],
      a: [text({}), text({})],
      b: [text({}), text({})],
      total: text({ "font-size": 22 }),
    };
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  }

  /**
   * Put the whole stage in one state (every scene calls this, so Back, a step
   * dot and resume all look alike). o: { sizes, pieces, gap, lab1, lab2, ghost, total, tint }
   */
  function view(ctx, o, ms) {
    fr = frameOf(o.sizes);
    const px = (x) => fr.X0 + x * fr.s;
    const py = (y) => fr.Y0 - y * fr.s;
    const box = (r) => ({ x: px(r.x), y: py(r.y + r.h), width: r.w * fr.s, height: r.h * fr.s });
    const m = [];
    o.pieces.forEach((r, i) => {
      const lifted = i === 1 && r.kind === "add" ? { ...r, y: r.y + (o.gap ?? 0) } : r;
      const look = r.kind === "cut" ? LOOK.cut : i === 1 ? LOOK.add2 : LOOK.add;
      for (const [k, val] of Object.entries(look)) c.p[i].setAttribute(k, val);
      m.push([c.p[i], { opacity: 1, ...box(lifted) }]);
      // Labels sit at the middle of a piece; the big piece of a pool sits in its free band.
      const free = o.band && i === 0 ? o.band : [lifted.x + lifted.w / 2, lifted.y + lifted.h / 2];
      const [lx, ly] = [px(free[0]), py(free[1])];
      m.push([c.a[i], { opacity: o.lab1 ? 1 : 0, x: lx, y: ly - 2, text: `${r.w} × ${r.h}` }]);
      const sign = r.kind === "cut" ? "−" : "=";
      const line2 = r.kind === "cut" ? `− ${areaOf(r)}` : `${sign} ${areaOf(r)}`;
      m.push([c.b[i], { opacity: o.lab2 ? 1 : 0, x: lx, y: ly + 17, text: line2 }]);
    });
    // The cue's visuals: the bounding rectangle and the corner the room lacks.
    const full = { x: 0, y: 0, w: L.base.w, h: L.H };
    m.push([c.bbox, { opacity: o.ghost ? 1 : 0, ...box(full) }]);
    const nb = { x: L.arm.w, y: L.base.h, w: L.base.w - L.arm.w, h: L.arm.h };
    m.push([c.notch, { opacity: o.ghost ? 1 : 0, ...box(nb) }]);
    m.push([
      c.total,
      { opacity: o.total ? 1 : 0, x: W / 2, y: fr.Y0 + 32, text: o.total ?? c.total.textContent },
    ]);
    return ctx.tween(m, ctx.restoring ? 0 : ms);
  }

  const unitSq = (ctx) => ctx.L(v.unit.sq);
  const stack = { sizes: sizes.l, pieces: cuts.stack, lab1: true };
  const opts = (list, seed) =>
    placeCorrect(
      list.map((o) => ({ ...o, label: String(o.value) })),
      seed,
    );

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.expr(escHtml("A = ?"));
        ctx.say(T.situateSay);
        await view(ctx, stack, 500);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        ctx.expr(escHtml("A = ?"));
        ctx.say(T.predictSay);
        const options = opts(lChoices(L), seedFor(4, total(cuts.stack), L.H));
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.cueL(opt), "cue");
              view(ctx, { ...stack, ghost: opt.kind === "box" }, 300);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              view(ctx, stack, 300);
            },
          }),
        );
        await view(ctx, stack, 300);
      },
    },
    {
      id: "pull",
      label: T.scene.pull,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        const max = EXPLODE;
        let k = Number.isInteger(st.k) && st.k >= 0 && st.k <= max ? st.k : 0;
        const o = (kk) => ({ ...stack, gap: kk, lab2: kk === max });
        const done = () => {
          ctx.feedback(T.pullDone);
          ctx.unlock();
        };
        const rng = ctx.range({
          label: T.pullLabel,
          min: 0,
          max,
          value: k,
          onInput: (val) => {
            k = val;
            st.k = val;
            ctx.save();
            view(ctx, o(val), 250);
            if (val === max) done();
            else ctx.feedback(val ? T.pullKeep : "");
          },
        });
        const out = /** @type {HTMLOutputElement} */ (rng.querySelector("output"));
        const input = /** @type {HTMLInputElement} */ (rng.querySelector("input"));
        const show = (kk) => `${kk} ${ctx.L(v.unit.abbr)}`;
        out.textContent = show(k);
        input.addEventListener("input", () => {
          out.textContent = show(Number(input.value));
        });
        ctx.panel.appendChild(rng);
        ctx.expr("");
        ctx.say(T.pullSay);
        await view(ctx, o(k), 500);
        if (k === max) done();
      },
    },
    {
      id: "connect",
      label: T.scene.connect,
      async enter(ctx) {
        const [A1, A2] = cuts.stack.map(areaOf);
        ctx.expr(`${hi(A1)} + ${lo(A2)} = ${total(cuts.stack)}`);
        ctx.say(T.connectSay);
        const sum = `${total(cuts.stack)} ${unitSq(ctx)}`;
        await view(ctx, { ...stack, lab2: true, gap: 0, total: sum }, 600);
      },
    },
    {
      id: "change",
      label: T.scene.change,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        const names = ["stack", "side", "fill"];
        st.seen = Array.isArray(st.seen) ? st.seen.filter((x) => names.includes(x)) : [];
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", ctx.L(T.scene.change));
        const buttons = {};
        let now = st.cut && names.includes(st.cut) ? st.cut : "stack";
        const show = (name, ms) => {
          now = name;
          st.cut = name;
          for (const n of names) buttons[n].setAttribute("aria-pressed", String(n === name));
          ctx.expr(escHtml(T.cutEq[name]));
          return view(
            ctx,
            {
              sizes: sizes.l,
              pieces: cuts[name],
              lab1: true,
              lab2: true,
              total: `${total(cuts[name])} ${unitSq(ctx)}`,
            },
            ms,
          );
        };
        const progress = () => {
          const left = names.filter((n) => n !== "stack" && !st.seen.includes(n)).length;
          if (left === 0) {
            ctx.feedback(T.changeLesson);
            ctx.unlock();
          } else ctx.feedback(T.tryOther(left), "cue");
        };
        for (const n of names) {
          buttons[n] = ctx.button({
            label: T.cutLabel[n],
            onClick: () => {
              if (n !== "stack" && !st.seen.includes(n)) st.seen.push(n);
              ctx.save();
              ctx.say(T.cutSay[n]);
              show(n, 450);
              progress();
            },
          });
          row.appendChild(buttons[n]);
        }
        ctx.panel.appendChild(row);
        ctx.say(st.seen.length ? T.cutSay[now] : T.changeSay);
        await show(now, 500);
        if (st.seen.length) progress();
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        const st = { sizes: sizes.pool, pieces: pool.pieces, lab1: true };
        const [outer, cut] = pool.pieces;
        // The pool's own label sits in the band above or below the cutout.
        st.band =
          cut.y >= 2 ? [outer.w / 2, cut.y / 2] : [outer.w / 2, (cut.y + cut.h + outer.h) / 2];
        const PT = total(pool.pieces);
        const sq = ctx.L(pool.unit.sq);
        ctx.expr(escHtml("A = ?"));
        ctx.say(T.transferSay);
        const options = opts(poolChoices(pool), seedFor(4, PT, outer.w, outer.h));
        const solved = () => {
          ctx.expr(escHtml(T.expr.pool));
          return view(ctx, { ...st, lab2: true, total: `${PT} ${sq}` }, 400);
        };
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.cuePool(opt), "cue"),
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              solved();
            },
          }),
        );
        if (saved.solved) await solved();
        else await view(ctx, st, 400);
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
