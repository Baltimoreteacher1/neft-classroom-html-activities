// living/decimal-area.js — multiplying decimals, and where the point goes (2-12).
//
// One cast for the whole play. A whole square is cut into 10 columns (tenths)
// and 10 rows (tenths), so each small square is a tenth of a tenth: a hundredth.
// A rectangle 0.4 wide and 0.7 tall covers 4 × 7 = 28 of them = 0.28: the
// student predicts the product, builds the rectangle with two sliders and
// counts. The same counting then explains the written rule (multiply without
// points, add the decimal places of BOTH factors). Scenes 5 and 6 carry that
// rule to the lesson's bigger products, where the grid is too small and an
// estimate is the check on where the point goes.
//
// Config: { a, b, big:{a,b,prefix?,story?}, transfer:{a,b,prefix?,story?}, story? }
// a and b are tenths (0.4, 0.7); big/transfer factors are strings so a trailing
// zero (12.60) keeps its decimal place. See validateDecimalArea.

import { escHtml } from "../../core/living-scene.js";
import {
  areaModel,
  decimalAreaCopy,
  placeCorrect,
  pointChoices,
  predictChoices,
  validateDecimalArea,
} from "./decimal-area-model.js";

export { validateDecimalArea };

const W = 480;
const H = 318;
const CELL = 22;
const SQ = CELL * 10;
const X0 = 120;
const Y0 = 44;
const TILE = 40;
const TGAP = 6;
const TILE_Y = 98;
const MAX_TILES = 8;
const XY = (i, j) => ({ x: X0 + i * CELL, y: Y0 + SQ - (j + 1) * CELL });

export function buildDecimalAreaPlay(cfg) {
  const v = validateDecimalArea(cfg);
  if (!v) return null;
  const T = decimalAreaCopy(v);
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  let c = null;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = "";
    const el = (tag, attrs) => svgEl(tag, { opacity: 0, ...attrs }, svg);
    const text = (attrs) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 16,
        "font-weight": 800,
        fill: "var(--lsx-ink)",
        ...attrs,
      });
    const cells = [];
    for (let j = 0; j < 10; j++)
      for (let i = 0; i < 10; i++)
        cells.push(
          el("rect", {
            ...XY(i, j),
            width: CELL,
            height: CELL,
            fill: "var(--lsx-x)",
            stroke: "none",
          }),
        );
    const line = (x1, y1, x2, y2) =>
      el("line", {
        x1,
        y1,
        x2,
        y2,
        stroke: "var(--lsx-muted)",
        "stroke-opacity": 0.6,
        "stroke-width": 1.2,
      });
    const vlines = Array.from({ length: 9 }, (_, k) =>
      line(X0 + (k + 1) * CELL, Y0, X0 + (k + 1) * CELL, Y0 + SQ),
    );
    const hlines = Array.from({ length: 9 }, (_, k) =>
      line(X0, Y0 + (k + 1) * CELL, X0 + SQ, Y0 + (k + 1) * CELL),
    );
    const frame = el("rect", {
      x: X0,
      y: Y0,
      width: SQ,
      height: SQ,
      fill: "none",
      stroke: "var(--lsx-ink)",
      "stroke-width": 3,
    });
    const rect = el("rect", {
      x: X0,
      y: Y0 + SQ - CELL,
      width: CELL,
      height: CELL,
      fill: "none",
      stroke: "var(--lsx-ink)",
      "stroke-width": 4,
    });
    const wLab = text({ x: X0, y: Y0 + SQ + 21, "font-size": 17 });
    const hLab = text({ x: X0 - 8, y: Y0 + SQ, "text-anchor": "end", "font-size": 17 });
    const whole = text({
      x: X0 + SQ / 2,
      y: Y0 + SQ + 44,
      "font-size": 15,
      fill: "var(--lsx-muted)",
      text: ctx.L(T.whole),
    });
    const pointer = {
      stroke: "var(--lsx-focus)",
      "stroke-width": 3,
      "stroke-dasharray": "6 4",
      fill: "none",
    };
    const hiWhole = el("rect", {
      x: X0 - 6,
      y: Y0 - 6,
      width: SQ + 12,
      height: SQ + 12,
      rx: 4,
      ...pointer,
    });
    const hiCell = el("rect", { ...XY(9, 9), width: CELL, height: CELL, ...pointer });
    hiCell.setAttribute("x", String(XY(9, 9).x - 3));
    hiCell.setAttribute("y", String(XY(9, 9).y - 3));
    hiCell.setAttribute("width", String(CELL + 6));
    hiCell.setAttribute("height", String(CELL + 6));
    const rp = [0, 1, 2].map((k) =>
      text({ x: X0 + SQ + 14, y: 118 + k * 44, "text-anchor": "start", "font-size": 19 }),
    );
    // Digit view (scenes 5-6)
    const factors = text({ x: W / 2, y: 40, "font-size": 24 });
    const whole2 = text({ x: W / 2, y: 76, "font-size": 20 });
    const tiles = Array.from({ length: MAX_TILES }, () => ({
      box: el("rect", {
        y: TILE_Y,
        width: TILE,
        height: 52,
        rx: 6,
        fill: "var(--lsx-card)",
        stroke: "var(--lsx-ink)",
        "stroke-width": 2.5,
      }),
      txt: text({ y: TILE_Y + 38, "font-size": 30 }),
    }));
    const dot = el("circle", {
      cx: W / 2,
      cy: TILE_Y + 46,
      r: 7,
      fill: "var(--lsx-hi)",
      stroke: "var(--lsx-card)",
      "stroke-width": 2,
    });
    const count = text({ x: W / 2, y: 190, "font-size": 17 });
    const result = text({ x: W / 2, y: 238, "font-size": 26 });
    const est = text({ x: W / 2, y: 276, "font-size": 18, fill: "var(--lsx-muted)" });
    c = {
      cells,
      vlines,
      hlines,
      frame,
      rect,
      wLab,
      hLab,
      whole,
      hiWhole,
      hiCell,
      rp,
      factors,
      whole2,
      tiles,
      dot,
      count,
      result,
      est,
    };
  }

  /** Everything on the stage in one state. o.mode: "grid" | "digits". */
  function draw(ctx, o, ms) {
    const m = [];
    const grid = o.mode === "grid";
    const shade = o.shade;
    c.cells.forEach((cell, k) => {
      const i = k % 10;
      const j = Math.floor(k / 10);
      m.push([cell, { opacity: grid && shade && i < shade.w && j < shade.h ? 1 : 0 }]);
    });
    for (const l of c.vlines) m.push([l, { opacity: grid && (o.lines || o.vlines) ? 1 : 0 }]);
    for (const l of c.hlines) m.push([l, { opacity: grid && o.lines ? 1 : 0 }]);
    m.push([c.frame, { opacity: grid ? 1 : 0 }]);
    const r = o.rect;
    if (r) {
      m.push([
        c.rect,
        {
          opacity: grid ? 1 : 0,
          x: X0,
          y: Y0 + SQ - r.h * CELL,
          width: r.w * CELL,
          height: r.h * CELL,
        },
      ]);
      c.wLab.textContent = r.wText;
      c.hLab.textContent = r.hText;
      m.push([c.wLab, { opacity: grid ? 1 : 0, x: X0 + (r.w * CELL) / 2 }]);
      m.push([c.hLab, { opacity: grid ? 1 : 0, y: Y0 + SQ - (r.h * CELL) / 2 + 5 }]);
    } else {
      m.push([c.rect, { opacity: 0 }], [c.wLab, { opacity: 0 }], [c.hLab, { opacity: 0 }]);
    }
    m.push([c.whole, { opacity: grid ? 1 : 0 }]);
    m.push([c.hiWhole, { opacity: grid && o.hiWhole ? 1 : 0 }]);
    m.push([c.hiCell, { opacity: grid && o.hiCell ? 1 : 0 }]);
    c.rp.forEach((el, k) => {
      el.textContent = o.rp?.[k] ?? "";
      m.push([el, { opacity: grid && o.rp?.[k] ? 1 : 0 }]);
    });
    // digits
    const d = o.mode === "digits" ? o.digits : null;
    const p = d?.pair;
    c.factors.textContent = p ? p.factors : "";
    c.whole2.textContent = p ? p.whole : "";
    m.push([c.factors, { opacity: p ? 1 : 0 }], [c.whole2, { opacity: p ? 1 : 0 }]);
    const n = p ? p.m.digits.length : 0;
    const left = W / 2 - (n * (TILE + TGAP) - TGAP) / 2;
    c.tiles.forEach((t, k) => {
      const on = k < n;
      t.txt.textContent = on ? p.m.digits[k] : "";
      m.push([t.box, { opacity: on ? 1 : 0, x: left + k * (TILE + TGAP) }]);
      m.push([t.txt, { opacity: on ? 1 : 0, x: left + k * (TILE + TGAP) + TILE / 2 }]);
    });
    const at = d?.places != null ? n - d.places : null;
    const dx = at == null ? W / 2 : left + at * (TILE + TGAP) - TGAP / 2;
    m.push([
      c.dot,
      {
        opacity: at == null ? 0 : 1,
        cx: dx,
        fill: d?.tone === "ok" ? "var(--lsx-hi)" : "var(--lsx-lo)",
      },
    ]);
    c.count.textContent = d?.count ?? "";
    m.push([c.count, { opacity: d?.count ? 1 : 0 }]);
    c.result.textContent = d?.result ?? "";
    c.result.setAttribute("fill", d?.tone === "ok" ? "var(--lsx-hi)" : "var(--lsx-lo)");
    m.push([c.result, { opacity: d?.result ? 1 : 0 }]);
    c.est.textContent = d?.est ?? "";
    m.push([c.est, { opacity: d?.est ? 1 : 0 }]);
    return ctx.tween(m, ms);
  }

  const rectOf = (w, h) => ({ w, h, wText: String(w / 10), hText: String(h / 10) });
  const gridBase = { mode: "grid", lines: true };
  const area = areaModel(v.w, v.h);

  /** Choose-the-point scene shared by scenes 5 and 6. */
  function pointScene(id, label, gate, key, say, q, cue, ok, withFrame) {
    return {
      id,
      label,
      gate,
      async enter(ctx, saved) {
        const p = T.pairs[key];
        const opts = placeCorrect(
          pointChoices(v[key].a, v[key].b).map((o) => ({
            ...o,
            label: { en: o.text, es: o.text },
          })),
          p.m.prod + (key === "big" ? 1 : 2),
        );
        const countBase = p.count.en.split("  ·  ").slice(0, 2).join("  ·  ");
        const countFor = (full) =>
          full
            ? ctx.L(p.count)
            : ctx.L({ en: countBase, es: p.count.es.split("  ·  ").slice(0, 2).join("  ·  ") });
        const view = (extra, ms) =>
          draw(ctx, { mode: "digits", digits: { pair: p, count: countFor(false), ...extra } }, ms);
        const solvedView = (ms) =>
          view(
            {
              places: p.m.places,
              tone: "ok",
              count: countFor(true),
              result: p.money ? `${p.m.text} = ${p.money}` : p.m.text,
              est: `≈ ${p.estLine}`,
            },
            ms,
          );
        ctx.expr(escHtml(p.factors));
        ctx.say(say);
        if (saved.solved) await solvedView(0);
        else await view({}, 0);
        ctx.panel.appendChild(
          ctx.choices({
            question: q,
            options: opts,
            restore: saved.solved ? opts.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              ctx.feedback(cue(opt), "cue");
              await view({ places: opt.places, tone: "miss", result: opt.text }, 250);
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(ok);
              if (gate) ctx.unlock();
              ctx.save();
              await solvedView(500);
            },
          }),
        );
        if (withFrame)
          ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
      },
    };
  }

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.expr(escHtml(T.situateExpr));
        ctx.say(T.situateSay);
        await draw(ctx, { mode: "grid" }, 0);
        await draw(ctx, { mode: "grid", vlines: true }, 500);
        await draw(ctx, gridBase, 500);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        const base = { ...gridBase, rect: rectOf(v.w, v.h) };
        ctx.expr(escHtml(`${v.a} × ${v.b}`));
        ctx.say(T.predictSay);
        await draw(ctx, base, 0);
        const opts = placeCorrect(
          predictChoices(v.a, v.b).map((o) => ({ ...o, label: { en: o.text, es: o.text } })),
          Math.round(v.a * 100) + Math.round(v.b * 10) + 1,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options: opts,
            restore: saved.solved ? opts.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              ctx.feedback(T.predictCue(opt), "cue");
              await draw(
                ctx,
                { ...base, hiWhole: opt.kind !== "small", hiCell: opt.kind === "small" },
                250,
              );
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              await draw(ctx, base, 250);
            },
          }),
        );
      },
    },
    {
      id: "build",
      label: T.scene.build,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        const okN = (x) => Number.isInteger(x) && x >= 1 && x <= 9;
        let w = okN(st.w) ? st.w : 1;
        let h = okN(st.h) ? st.h : 1;
        const paint = (ms) => {
          const m = areaModel(w, h);
          ctx.expr(`${escHtml(`${m.a} × ${m.b}`)} = ${hi(m.text)}`);
          return draw(ctx, { ...gridBase, rect: rectOf(w, h), shade: { w, h } }, ms);
        };
        const sync = () => {
          st.w = w;
          st.h = h;
          ctx.save();
          if (w === v.w && h === v.h) {
            ctx.feedback(T.buildDone);
            ctx.unlock();
          } else ctx.feedback(T.buildNow(w, h));
        };
        const wr = ctx.range({
          label: T.widthLabel,
          min: 1,
          max: 9,
          value: w,
          onInput: (x) => {
            w = x;
            sync();
            paint(200);
          },
        });
        const hr = ctx.range({
          label: T.heightLabel,
          min: 1,
          max: 9,
          value: h,
          onInput: (x) => {
            h = x;
            sync();
            paint(200);
          },
        });
        ctx.panel.append(wr, hr);
        ctx.say(T.buildSay);
        await paint(0);
        if (w === v.w && h === v.h) {
          ctx.feedback(T.buildDone);
          ctx.unlock();
        } else ctx.feedback("");
      },
    },
    {
      id: "connect",
      label: T.scene.connect,
      async enter(ctx) {
        const r = {
          w: v.w,
          h: v.h,
          wText: ctx.L(T.colsLabel(v.w)),
          hText: ctx.L(T.rowsLabel(v.h)),
        };
        const base = { ...gridBase, rect: r, shade: { w: v.w, h: v.h } };
        ctx.expr(`${escHtml(`${v.a} × ${v.b}`)} = ${hi(area.text)}`);
        ctx.say(T.connectSay);
        await draw(ctx, base, 500);
        for (let k = 1; k <= 3; k++)
          await draw(ctx, { ...base, rp: T.connectRows.slice(0, k) }, 350);
      },
    },
    pointScene("big", T.scene.big, true, "big", T.bigSay, T.bigQ, T.bigCue, T.bigOk, false),
    pointScene(
      "transfer",
      T.scene.transfer,
      false,
      "transfer",
      T.transferSay,
      T.transferQ,
      T.transferCue,
      T.transferOk,
      true,
    ),
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
