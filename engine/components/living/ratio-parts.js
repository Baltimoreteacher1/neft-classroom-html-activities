// living/ratio-parts.js — one strip of tiles, read two ways (lesson 3-1).
//
// The cast is one set of tiles: squares for the first amount, circles for the
// second (shape AND label carry the meaning, never colour alone). The same
// tiles sit apart in the situation, slide into one strip when the student
// writes the ratio, and are then READ four ways with rings that point at the
// amounts being compared and a "1st / 2nd" tag on whichever is named first.
// Part to part compares two amounts; part to whole compares one amount with all
// the parts; the order the amounts are named is the order the numbers go.
//
// Config: { a, b, labelA, labelB, whole, story, transfer:{a, b, labelA, labelB, whole, story} }
// — 3-1 authors 3 cups of apple juice : 2 cups of sparkling water and the
// bowl of 4 apples : 1 orange. Every number and line of text comes from
// ratio-parts-model.js (pure, tested); this file only stages it.

import { escHtml } from "../../core/living-scene.js";
import {
  H,
  partToPartChoices,
  partToWholeChoices,
  partValue,
  placeCorrect,
  READINGS,
  ratioPartsCopy,
  validateRatioParts,
  W,
} from "./ratio-parts-model.js";

export { validateRatioParts };

const hi = (s) => `<span class="lsx-hi">${escHtml(String(s))}</span>`;
const lo = (s) => `<span class="lsx-lo">${escHtml(String(s))}</span>`;
const plain = (s) => escHtml(String(s));
const part = (key, n) => (key === "A" ? hi(n) : key === "B" ? lo(n) : plain(n));
const ROW_Y = 96;

export function buildRatioPartsPlay(cfg) {
  const v = validateRatioParts(cfg);
  if (!v) return null;
  const copy = ratioPartsCopy(v);
  const t = v.transfer;
  const maxA = Math.max(v.a, t.a);
  const maxB = Math.max(v.b, t.b);
  const T = Math.min(44, Math.floor(380 / Math.max(v.a + v.b, t.a + t.b)));
  let cast = null;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs) => svgEl(tag, { opacity: 0, ...attrs }, g);
    const text = (more) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 17,
        "font-weight": 700,
        fill: "var(--lsx-ink)",
        x: 0,
        y: 0,
        ...more,
      });
    const stroke = { fill: "none", stroke: "var(--lsx-ink)", "stroke-width": 3, rx: 8 };
    const rule = () => el("line", { stroke: "var(--lsx-ink)", "stroke-width": 2 });
    cast = {
      ringAll: el("rect", {
        ...stroke,
        "stroke-dasharray": "7 5",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      }),
      ringA: el("rect", { ...stroke, x: 0, y: 0, width: 0, height: 0 }),
      ringB: el("rect", { ...stroke, x: 0, y: 0, width: 0, height: 0 }),
      tilesA: Array.from({ length: maxA }, () =>
        el("rect", {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          rx: 4,
          fill: "var(--lsx-x)",
          stroke: "var(--lsx-x-edge)",
          "stroke-width": 2,
        }),
      ),
      tilesB: Array.from({ length: maxB }, () =>
        el("circle", {
          cx: 0,
          cy: 0,
          r: 0,
          fill: "var(--lsx-u)",
          stroke: "var(--lsx-u-edge)",
          "stroke-width": 2,
        }),
      ),
      lblA: text({ fill: "var(--lsx-hi)" }),
      lblB: text({ fill: "var(--lsx-lo)" }),
      bL: rule(),
      bH: rule(),
      bR: rule(),
      bText: text({ "font-size": 16 }),
    };
  }

  /**
   * Every cast member's place. set: "m" (main) | "t" (transfer); mode: apart | strip;
   * ring: {A, B, All}; tag: {A, B, W} order tags; bracket: show the whole's bracket.
   */
  function layout(ctx, { set = "m", mode = "apart", ring = {}, tag = {}, bracket = false }) {
    const s = set === "t" ? t : v;
    const gap = mode === "apart" ? 64 : 0;
    const total = (s.a + s.b) * T + gap;
    const x0 = (W - total) / 2;
    const xB = x0 + s.a * T + gap;
    const by = ROW_Y + T + 58;
    const m = [];
    const put = (node, attrs, show) => m.push([node, { ...attrs, opacity: show ? 1 : 0 }]);
    const tagged = (k) => (tag[k] ? ` · ${ctx.L(tag[k])}` : "");
    cast.tilesA.forEach((r, i) =>
      put(r, { x: x0 + i * T + 2, y: ROW_Y + 2, width: T - 4, height: T - 4 }, i < s.a),
    );
    cast.tilesB.forEach((c, j) =>
      put(c, { cx: xB + j * T + T / 2, cy: ROW_Y + T / 2, r: T / 2 - 3 }, j < s.b),
    );
    put(
      cast.lblA,
      { x: x0 + (s.a * T) / 2, y: ROW_Y - 20, text: `${ctx.L(s.labelA)}: ${s.a}${tagged("A")}` },
      true,
    );
    put(
      cast.lblB,
      {
        x: xB + (s.b * T) / 2,
        y: ROW_Y + T + 32,
        text: `${ctx.L(s.labelB)}: ${s.b}${tagged("B")}`,
      },
      true,
    );
    put(
      cast.ringA,
      { x: x0 - 5, y: ROW_Y - 5, width: s.a * T + (gap ? 10 : 5), height: T + 10 },
      ring.A,
    );
    put(
      cast.ringB,
      { x: gap ? xB - 5 : xB, y: ROW_Y - 5, width: s.b * T + (gap ? 10 : 5), height: T + 10 },
      ring.B,
    );
    put(cast.ringAll, { x: x0 - 10, y: ROW_Y - 10, width: total + 20, height: T + 20 }, ring.All);
    put(cast.bL, { x1: x0, x2: x0, y1: by - 7, y2: by }, bracket);
    put(cast.bH, { x1: x0, x2: x0 + total, y1: by, y2: by }, bracket);
    put(cast.bR, { x1: x0 + total, x2: x0 + total, y1: by - 7, y2: by }, bracket);
    put(
      cast.bText,
      {
        x: W / 2,
        y: by + 22,
        text: `${ctx.L(s.whole)}: ${s.a + s.b} ${ctx.L(copy.partsWord)}${tagged("W")}`,
      },
      bracket,
    );
    return m;
  }

  const ratioExpr = (a, b) => `${hi(a)} : ${lo(b)}`;
  const choiceOptions = (list, seed, fmt, cues) =>
    placeCorrect(list, seed).map((o) => ({
      ...o,
      label: fmt(o),
      cue: cues[o.kind],
    }));

  const scenes = [
    {
      id: "situate",
      label: { en: "One batch", es: "Una tanda" },
      async enter(ctx) {
        await ctx.tween(layout(ctx, { mode: "apart" }), 500);
        ctx.expr("");
        ctx.say(copy.situate);
      },
    },
    {
      id: "predict",
      label: { en: "Predict", es: "Predice" },
      gate: true,
      async enter(ctx, saved) {
        await ctx.tween(
          layout(ctx, { mode: saved.solved ? "strip" : "apart" }),
          saved.solved ? 0 : 300,
        );
        ctx.expr(`${plain(ctx.L(v.labelA))} : ${plain(ctx.L(v.labelB))} = ?`);
        ctx.say(copy.predict.say);
        const options = choiceOptions(
          partToPartChoices(v.a, v.b),
          v.a + v.b,
          (o) => `${o.x} : ${o.y}`,
          copy.predict.cues,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.predict.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              const ring = opt.kind === "reversed" ? { A: true } : { All: true };
              await ctx.tween(layout(ctx, { mode: "apart", ring }), 300);
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.expr(ratioExpr(v.a, v.b));
              await ctx.tween(layout(ctx, { mode: "strip" }), 700);
              ctx.feedback(copy.predict.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "readings",
      label: { en: "Read it four ways", es: "Léelo de cuatro formas" },
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        st.seen = Array.isArray(st.seen) ? st.seen.filter((k) => k in READINGS) : [];
        const show = async (id, ms) => {
          const r = READINGS[id];
          const keys = [r.first, r.second];
          const tag = { [r.first]: copy.ordinal.first, [r.second]: copy.ordinal.second };
          await ctx.tween(
            layout(ctx, {
              mode: "strip",
              ring: { A: keys.includes("A"), B: keys.includes("B"), All: r.second === "W" },
              tag,
              bracket: keys.includes("W"),
            }),
            ms,
          );
          ctx.expr(
            `${part(r.first, partValue(v, r.first))} : ${part(r.second, partValue(v, r.second))}`,
          );
          ctx.say(copy.readings.say1[id]);
          if (st.seen.length < 4) ctx.feedback(copy.readings.progress(st.seen.length), "cue");
          else {
            ctx.feedback(copy.readings.done);
            ctx.unlock();
          }
          ctx.save();
        };
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", ctx.L({ en: "Reading", es: "Lectura" }));
        const btns = Object.keys(READINGS).map((id) => {
          const btn = ctx.button({
            label: copy.readings.labels[id],
            onClick: async () => {
              for (const x of btns) x.setAttribute("aria-pressed", String(x === btn));
              if (!st.seen.includes(id)) st.seen.push(id);
              await show(id, 500);
            },
          });
          btn.setAttribute("aria-pressed", "false");
          return btn;
        });
        row.append(...btns);
        ctx.panel.appendChild(row);
        await ctx.tween(layout(ctx, { mode: "strip" }), 400);
        ctx.expr(ratioExpr(v.a, v.b));
        ctx.say(copy.readings.say);
        if (st.seen.length >= 4) {
          ctx.feedback(copy.readings.done);
          ctx.unlock();
        }
      },
    },
    {
      id: "write",
      label: { en: "Write it", es: "Escríbela" },
      async enter(ctx) {
        await ctx.tween(layout(ctx, { mode: "strip", bracket: true }), 400);
        const to = ctx.L(copy.write.to);
        ctx.expr(
          `${ratioExpr(v.a, v.b)} &nbsp;·&nbsp; ${hi(v.a)} ${plain(to)} ${lo(v.b)} &nbsp;·&nbsp; ${hi(v.a)}/${lo(v.b)}`,
        );
        ctx.say(copy.write.say);
      },
    },
    {
      id: "transfer",
      label: { en: "On your own", es: "Por tu cuenta" },
      async enter(ctx, saved) {
        const solved = Boolean(saved.solved);
        await ctx.tween(
          layout(ctx, {
            set: "t",
            mode: solved ? "strip" : "apart",
            bracket: solved,
            ring: solved ? {} : { All: true },
          }),
          solved ? 0 : 400,
        );
        ctx.expr(`${plain(ctx.L(t.labelA))} : ${plain(ctx.L(t.whole))} = ?`);
        ctx.say(copy.transfer.say);
        const options = choiceOptions(
          partToWholeChoices(t.a, t.b),
          t.a + 2 * t.b,
          (o) => `${o.x} : ${o.y}`,
          copy.transfer.cues,
        );
        ctx.panel.append(
          ctx.choices({
            question: copy.transfer.question,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.expr(`${hi(t.a)} : ${plain(t.a + t.b)}`);
              await ctx.tween(
                layout(ctx, {
                  set: "t",
                  mode: "strip",
                  bracket: true,
                  ring: { A: true, All: true },
                }),
                600,
              );
              ctx.feedback(copy.transfer.ok);
            },
          }),
          ctx.frame({ label: copy.transfer.explain, frame: copy.transfer.frame }),
        );
      },
    },
  ];

  return {
    kicker: { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" },
    title: copy.title,
    viewBox: `0 0 ${W} ${H}`,
    ariaLabel: copy.ariaLabel,
    printSummary: copy.printSummary,
    setup,
    scenes,
  };
}
