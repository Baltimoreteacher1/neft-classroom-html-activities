// living/volume-layers.js — volume as layers: cover the floor, stack the base.
//
// One isometric box, drawn with clear faces and labelled edges. The student
// predicts the volume, covers the floor one row at a time (the base area B),
// stacks that base up the height (V = B × h), and sees that B × h is the same
// number as l × w × h. In "fraction" mode (5-10) the stack grows in half units,
// so a height of 0.5 is visibly half a layer and the rule never changes.
//
// Config: { mode: "whole" | "fraction", l, w, h, unit, transfer: { l, w, h } }
// Whole mode: whole-number edges (5-5). Fraction mode: the floor is whole, the
// height is a half-unit, and the transfer box may use half-unit edges (5-10).
// The numbers the lesson authors are the ones drawn; anything the stage cannot
// draw correctly makes the play refuse.

import { escHtml } from "../../core/living-scene.js";
import {
  fmt,
  orientations,
  placeCorrect,
  validateVolumeLayers,
  volumeChoices,
  volumeCopy,
} from "./volume-layers-model.js";

export { validateVolumeLayers };

const W = 480;
const H = 300;
const C = Math.sqrt(3) / 2;
const S = 0.5;
const PAD = 46;
const INK = "var(--lsx-ink)";

/** Isometric projection that fits a p × q × zmax box inside the stage. */
function projection(p, q, zmax) {
  const k = Math.min((W - 2 * PAD) / ((p + q) * C), (H - 2 * PAD) / ((p + q) * S + zmax));
  const ox = W / 2 - ((p - q) * C * k) / 2;
  const oy = H / 2 - (((p + q) * S - zmax) * k) / 2;
  return (x, y, z) => [ox + (x - y) * C * k, oy + (x + y) * S * k - z * k];
}

export function buildVolumeLayersPlay(cfg) {
  const v = validateVolumeLayers(cfg);
  if (!v) return null;
  const T = volumeCopy(v);
  const { mode, l, w, h, tr, step } = v;
  const whole = mode === "whole";
  /** @type {any} */
  let layer = null;
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;

  /**
   * Draw the box. s: { p, q, r (box edges), rows (floor rows covered, 0..q),
   * hgt (stack height, 0..), zmax, frame (dashed outline of the whole box),
   * label (show B) }
   */
  function paint(ctx, s) {
    const { p, q, r } = s;
    const zmax = Math.max(s.zmax ?? r, r, s.hgt || 0);
    const P = projection(p, q, zmax);
    layer.innerHTML = "";
    const el = (tag, attrs) => ctx.svgEl(tag, attrs, layer);
    const toPoints = (pts) => pts.map((a) => a.map((n) => n.toFixed(1)).join(",")).join(" ");
    /** A tinted face over an opaque white one, so faces behind it never show through. */
    const poly = (pts, fill, fo, stroke = INK, sw = 1.5) => {
      el("polygon", { points: toPoints(pts), fill: "var(--lsx-card)" });
      return el("polygon", {
        points: toPoints(pts),
        fill,
        "fill-opacity": fo,
        stroke,
        "stroke-width": sw,
        "stroke-linejoin": "round",
      });
    };
    const lines = (segs, op = 0.4) =>
      el("path", {
        d: segs
          .map(
            ([a, b]) =>
              `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`,
          )
          .join(""),
        stroke: INK,
        "stroke-width": 1,
        "stroke-opacity": op,
        fill: "none",
      });
    const rows = Math.min(s.rows || 0, q);
    const hgt = s.hgt || 0;
    // floor tiles: unit squares, one row at a time (the last may be partial)
    if (rows > 0 && hgt === 0) {
      for (let j = 0; j < Math.ceil(rows - 1e-9); j++) {
        for (let i = 0; i < Math.ceil(p - 1e-9); i++) {
          const [x0, x1] = [i, Math.min(i + 1, p)];
          const [y0, y1] = [j, Math.min(j + 1, rows)];
          poly(
            [P(x0, y0, 0), P(x1, y0, 0), P(x1, y1, 0), P(x0, y1, 0)],
            "var(--lsx-x)",
            0.4,
            INK,
            1.2,
          );
        }
      }
    }
    // stacked layers, bottom to top
    const n = Math.ceil(hgt / step - 1e-9);
    for (let k = 0; k < n; k++) {
      const z0 = k * step;
      const z1 = Math.min((k + 1) * step, hgt);
      poly([P(0, q, z0), P(p, q, z0), P(p, q, z1), P(0, q, z1)], "var(--lsx-x)", 0.28);
      poly([P(p, 0, z0), P(p, q, z0), P(p, q, z1), P(p, 0, z1)], "var(--lsx-x)", 0.16);
      poly([P(0, 0, z1), P(p, 0, z1), P(p, q, z1), P(0, q, z1)], "var(--lsx-x)", 0.5);
      const grid = [];
      for (let i = 1; i < p; i++) {
        grid.push([P(i, q, z0), P(i, q, z1)]);
        if (k === n - 1) grid.push([P(i, 0, z1), P(i, q, z1)]);
      }
      for (let j = 1; j < q; j++) {
        grid.push([P(p, j, z0), P(p, j, z1)]);
        if (k === n - 1) grid.push([P(0, j, z1), P(p, j, z1)]);
      }
      lines(grid);
    }
    if (s.frame) {
      // the twelve edges of the box, each once (a dashed outline of the space to fill)
      const e = (a, b) => [P(...a), P(...b)];
      const edges = [
        e([0, 0, r], [p, 0, r]),
        e([p, 0, r], [p, q, r]),
        e([p, q, r], [0, q, r]),
        e([0, q, r], [0, 0, r]),
        e([0, q, 0], [0, q, r]),
        e([p, q, 0], [p, q, r]),
        e([p, 0, 0], [p, 0, r]),
        e([0, q, 0], [p, q, 0]),
        e([p, q, 0], [p, 0, 0]),
      ];
      const d = edges
        .map(
          ([a, b]) =>
            `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`,
        )
        .join("");
      el("path", { d, stroke: INK, "stroke-width": 2, "stroke-dasharray": "6 4", fill: "none" });
    }
    const label = (pt, dx, dy, text, anchor = "middle", size = 16) =>
      el("text", {
        x: (pt[0] + dx).toFixed(1),
        y: (pt[1] + dy).toFixed(1),
        "text-anchor": anchor,
        "font-size": size,
        "font-weight": 800,
        fill: INK,
        stroke: "var(--lsx-card)",
        "stroke-width": 4,
        "paint-order": "stroke",
        text: text,
      });
    label(P(p / 2, q, 0), -10, 22, ctx.L(T.edge(p)), "end");
    label(P(p, q / 2, 0), 10, 22, ctx.L(T.edge(q)), "start");
    label(P(0, q, r / 2), -10, 5, ctx.L(T.edge(r)), "end");
    if (s.label && rows >= q) label(P(p / 2, q / 2, hgt), 0, 5, `B = ${fmt(p * q)}`, "middle", 18);
  }

  const mainBox = { p: l, q: w, r: h };
  const pickOpts = (mode2, box, seed, cueOf) =>
    placeCorrect(
      volumeChoices(mode2, box.l, box.w, box.h).map((c) => ({
        ...c,
        label: fmt(c.value),
        cue: c.correct ? null : cueOf(c.kind, c.value),
      })),
      seed,
    );

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.say(T.situateSay);
        ctx.expr(escHtml(ctx.L(T.size)));
        paint(ctx, { ...mainBox, frame: true });
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        ctx.say(T.situateSay);
        ctx.expr(escHtml(ctx.L(T.size)));
        paint(ctx, { ...mainBox, frame: true });
        const opts = pickOpts(mode, { l, w, h }, l * 5 + w * 3 + Math.round(h * 2), T.predictCue);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options: opts,
            restore: saved.solved ? opts.findIndex((o) => o.correct) : null,
            onMiss: (_i, o) => {
              ctx.feedback(o.cue, "cue");
              // a pointer at the picture: the floor covered is ONE layer (base) of the box
              paint(ctx, { ...mainBox, frame: true, rows: o.kind === "base" ? w : 0, label: true });
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              paint(ctx, { ...mainBox, frame: true });
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "floor",
      label: T.scene.floor,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        const start = Number.isInteger(st.rows) && st.rows >= 0 && st.rows <= w ? st.rows : 0;
        ctx.say(T.floorSay);
        const apply = (rows) => {
          paint(ctx, { ...mainBox, frame: true, rows, label: true });
          ctx.expr(
            rows === w
              ? `${escHtml(`${l} × ${w} = `)}${hi(String(l * w))}`
              : escHtml(T.rowsExpr(rows)),
          );
          if (rows === w) {
            ctx.feedback(T.floorDone);
            ctx.unlock();
          } else if (rows > 0) ctx.feedback(T.floorMore(w - rows), "cue");
          else ctx.feedback("");
        };
        const rng = ctx.range({
          label: T.rowsLabel,
          min: 0,
          max: w,
          value: start,
          onInput: (n) => {
            st.rows = n;
            ctx.save();
            apply(n);
          },
        });
        ctx.panel.appendChild(rng);
        apply(start);
      },
    },
    {
      id: "stack",
      label: T.scene.stack,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        const nMax = Math.round(v.stackMax / step);
        const nStart = Number.isInteger(st.n) && st.n >= 0 && st.n <= nMax ? st.n : 0;
        ctx.say(T.stackSay);
        const row = document.createElement("p");
        row.className = "lsx-fb";
        row.setAttribute("aria-live", "polite");
        const apply = (n) => {
          const hgt = n * step;
          paint(ctx, { ...mainBox, frame: true, rows: w, hgt, zmax: v.stackMax, label: true });
          ctx.expr(escHtml(T.stackExpr(hgt)));
          row.textContent = hgt === 0 ? "" : ctx.L(T.stackRow(whole ? n : hgt));
          if (hgt === h) {
            st.reached = true;
            ctx.save();
            ctx.feedback(T.stackDone);
            ctx.unlock();
          } else if (hgt > h) ctx.feedback(T.stackOver, "cue");
          else ctx.feedback(st.reached ? T.stackDone : T.stackMore, st.reached ? "" : "cue");
        };
        const rng = ctx.range({
          label: T.heightLabel,
          min: 0,
          max: nMax,
          value: nStart,
          onInput: (n) => {
            st.n = n;
            ctx.save();
            apply(n);
          },
        });
        const input = /** @type {HTMLInputElement} */ (rng.querySelector("input"));
        const out = /** @type {HTMLOutputElement} */ (rng.querySelector("output"));
        const show = () => {
          out.textContent = fmt(Number(input.value) * step);
        };
        input.addEventListener("input", show);
        show();
        ctx.panel.append(rng, row);
        apply(nStart);
        if (st.reached) ctx.unlock();
      },
    },
    whole
      ? {
          id: "tip",
          label: T.scene.tip,
          gate: true,
          async enter(ctx) {
            const st = ctx.state;
            const ors = orientations(l, w, h);
            const seen = new Set(
              Array.isArray(st.seen) ? st.seen.filter((i) => i >= 0 && i < 3) : [],
            );
            const row = document.createElement("p");
            row.className = "lsx-fb";
            row.setAttribute("aria-live", "polite");
            const btns = ors.map((o, i) =>
              ctx.button({ label: T.tipLabel(o), onClick: () => choose(i) }),
            );
            const choose = (i) => {
              seen.add(i);
              st.seen = [...seen];
              ctx.save();
              apply(i);
            };
            const apply = (i) => {
              const o = ors[i];
              paint(ctx, { p: o.p, q: o.q, r: o.r, rows: o.q, hgt: o.r, label: true });
              ctx.expr(escHtml(T.tipExpr(o)));
              row.textContent = ctx.L(T.tipRow(o));
              btns.forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
              if (seen.size === 3) {
                ctx.feedback(T.tipDone);
                ctx.unlock();
              } else ctx.feedback(T.tipMore(3 - seen.size), "cue");
            };
            const group = document.createElement("div");
            group.className = "lsx-choices";
            group.setAttribute("role", "group");
            group.setAttribute("aria-label", ctx.L(T.scene.tip));
            for (const b of btns) {
              b.setAttribute("aria-pressed", "false");
              group.appendChild(b);
            }
            ctx.say(T.tipSay);
            ctx.panel.append(group, row);
            apply(seen.size ? [...seen][seen.size - 1] : 0);
          },
        }
      : {
          id: "connect",
          label: T.scene.connect,
          async enter(ctx) {
            ctx.say(T.connectSay);
            ctx.expr(escHtml(T.connectExpr));
            ctx.feedback(T.connectDone);
            paint(ctx, { ...mainBox, rows: w, hgt: h, label: true });
          },
        },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        const box = { p: tr.l, q: tr.w, r: tr.h };
        ctx.say(T.transferSay);
        const show = (done) => {
          paint(ctx, { ...box, rows: tr.w, hgt: tr.h, label: done });
          ctx.expr(
            done ? escHtml(T.transferExpr) : escHtml(`${fmt(tr.l)} × ${fmt(tr.w)} × ${fmt(tr.h)}`),
          );
        };
        show(!!saved.solved);
        const opts = pickOpts(mode, tr, tr.l * 3 + Math.round(tr.h * 2) + 1, T.transferCue);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options: opts,
            restore: saved.solved ? opts.findIndex((o) => o.correct) : null,
            onMiss: (_i, o) => ctx.feedback(o.cue, "cue"),
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              show(true);
            },
          }),
        );
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
    setup(ctx) {
      ctx.svg.innerHTML = "";
      layer = ctx.svgEl("g", {}, ctx.svg);
    },
    scenes,
  };
}
