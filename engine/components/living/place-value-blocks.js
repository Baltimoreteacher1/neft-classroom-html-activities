// living/place-value-blocks.js — add and subtract decimals by place value (2-11).
//
// One cast for the whole play: a place-value chart with five columns (hundreds,
// tens, ones | tenths, hundredths) and a decimal-point wall. The tank's 128.75
// L is drawn as discs, one disc per unit of its column. The shuttle's 46.8 L
// lands in the SAME columns (the point is the anchor, not the last digit),
// slides onto the tank's discs, and the student trades ten of a place for one
// of the place to its left. The same columns then hold the written sum, and
// the thrusters' 19.35 L comes off with a trade the student must predict.
//
// Config: { a, b, c, unit:{en,es}, story:{en,es}, transfer:{a, b} } — see
// validatePlaceValue (place-value-blocks-model.js). A config it cannot draw
// correctly makes the play refuse (the page shows nothing rather than a wrong
// picture).

import { escHtml } from "../../core/living-scene.js";
import {
  applyTrade,
  COLS,
  colDigits,
  colsOf,
  emptyCols,
  fmt,
  mergeCols,
  ONES,
  PLACE,
  placeCorrect,
  placeValueCopy,
  predictOptions,
  shown,
  subCols,
  sumChoices,
  validatePlaceValue,
} from "./place-value-blocks-model.js";

export { validatePlaceValue };

const W = 480;
const H = 258;
const CX0 = 96;
const CW = 68;
const GAP = 16;
const POOL = 20; // most discs a column ever holds (9 + 9 + a trade)
const colX = (c) => CX0 + c * CW + (c >= ONES + 1 ? GAP : 0);
const colMid = (c) => colX(c) + CW / 2;
const WALL = CX0 + (ONES + 1) * CW + GAP / 2;
const BAND_Y = { A: 46, B: 90, M: 46 };
const slotPos = (c, band, idx) => ({
  x: colX(c) + 5 + (idx % 5) * 12.2,
  y: BAND_Y[band] + Math.floor(idx / 5) * 13,
});
const ROW_Y = { mark: 150, top: 176, bot: 202, res: 238 };
const LINE_Y = 210;
const COUNT_Y = 120;

const KIND = {
  a: {
    fill: "var(--lsx-x)",
    stroke: "var(--lsx-x-edge)",
    "stroke-width": 2,
    rx: 5.5,
    "stroke-dasharray": "none",
  },
  b: {
    fill: "var(--lsx-u)",
    stroke: "var(--lsx-u-edge)",
    "stroke-width": 2,
    rx: 2,
    "stroke-dasharray": "none",
  },
  r: {
    fill: "var(--lsx-card)",
    stroke: "var(--lsx-ink)",
    "stroke-width": 3,
    rx: 5.5,
    "stroke-dasharray": "none",
  },
  g: {
    fill: "var(--lsx-card)",
    stroke: "var(--lsx-muted)",
    "stroke-width": 1.5,
    rx: 5.5,
    "stroke-dasharray": "2.5 2",
  },
};

export function buildPlaceValuePlay(cfg) {
  const v = validatePlaceValue(cfg);
  if (!v) return null;
  const T = placeValueCopy(v);
  const { add, sub, transfer } = v;
  const sumDigits = add.after;
  const tAdd = transfer.plan;
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;
  const bCol = predictOptions(v.b)[0].col;
  let c = null; // the cast

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
    const box = (x, y, w, h, rx, extra) =>
      el("rect", { x, y, width: w, height: h, rx, fill: "none", ...extra });
    const dash = (stroke, width, pattern) => ({
      stroke,
      "stroke-width": width,
      "stroke-dasharray": pattern,
    });
    for (let k = 0; k < COLS; k++) {
      // The frame and headers are always on (no opacity 0).
      const still = (tag, attrs) => svgEl(tag, attrs, svg);
      still("rect", {
        x: colX(k) + 1,
        y: 2,
        width: CW - 2,
        height: 128,
        rx: 6,
        fill: "none",
        stroke: "var(--lsx-rule)",
        "stroke-width": 1.5,
      });
      const head = {
        x: colMid(k),
        "text-anchor": "middle",
        fill: "var(--lsx-ink)",
        "font-weight": 800,
      };
      still("text", {
        ...head,
        y: 15,
        "font-size": 12,
        "font-weight": 700,
        fill: "var(--lsx-muted)",
        text: ctx.L(T.head[k]),
      });
      still("text", { ...head, y: 29, "font-size": 13, text: PLACE.value[k] });
    }
    svgEl("path", { d: `M ${WALL} 2 V 130`, stroke: "var(--lsx-ink)", "stroke-width": 3 }, svg);
    svgEl("circle", { cx: WALL, cy: 128, r: 4.5, fill: "var(--lsx-ink)" }, svg);
    const focus = dash("var(--lsx-focus)", 3, "6 4");
    const hiPoint = box(WALL - 11, 0, 22, 134, 6, focus);
    const hiCol = Array.from({ length: COLS }, (_, k) =>
      box(colX(k) - 1, 0, CW + 2, 134, 6, focus),
    );
    const label = (y, fs) => text({ x: CX0 - 8, y, "text-anchor": "end", "font-size": fs });
    const labs = {
      A: label(BAND_Y.A + 12, 15),
      B: label(BAND_Y.B + 12, 15),
      M: label(BAND_Y.M + 12, 14),
    };
    const pool = Array.from({ length: COLS }, (_, k) =>
      Array.from({ length: POOL }, () =>
        el("rect", { ...slotPos(k, "M", 0), width: 11, height: 11, ...KIND.a }),
      ),
    );
    const counts = Array.from({ length: COLS }, (_, k) =>
      text({ x: colMid(k), y: COUNT_Y, "font-size": 17 }),
    );
    const amber = dash("var(--lsx-lo)", 2, "4 3");
    const zeroBox = box(colMid(COLS - 1) - 11, BAND_Y.B - 2, 22, 18, 4, amber);
    const zeroTxt = text({
      x: colMid(COLS - 1),
      y: BAND_Y.B + 12,
      "font-size": 14,
      fill: "var(--lsx-lo)",
      text: "0",
    });
    const rows = {};
    for (const r of ["mark", "top", "bot", "res"])
      rows[r] = Array.from({ length: COLS }, (_, k) =>
        text({
          x: colMid(k),
          y: ROW_Y[r],
          "font-size": r === "mark" ? 16 : 24,
          ...(r === "mark" ? { fill: "var(--lsx-lo)" } : {}),
        }),
      );
    const dots = ["top", "bot", "res"].map((r) =>
      text({ x: WALL, y: ROW_Y[r], "font-size": 24, text: "." }),
    );
    const op = text({ x: CX0 - 8, y: ROW_Y.bot, "text-anchor": "end", "font-size": 24 });
    const line = el("path", {
      d: `M ${CX0 - 4} ${LINE_Y} H ${colX(COLS - 1) + CW}`,
      stroke: "var(--lsx-ink)",
      "stroke-width": 3,
    });
    const zeroNote = box(colMid(COLS - 1) - 14, ROW_Y.bot - 22, 28, 30, 5, amber);
    c = { hiPoint, hiCol, labs, pool, counts, zeroBox, zeroTxt, rows, dots, op, line, zeroNote };
  }

  /** Disc moves for a column state; a disc that was hidden appears in place. */
  function discMoves(cols) {
    const m = [];
    for (let k = 0; k < COLS; k++) {
      const seen = {};
      c.pool[k].forEach((el, s) => {
        const it = cols?.[k]?.[s];
        if (!it) return m.push([el, { opacity: 0 }]);
        seen[it.band] = (seen[it.band] ?? -1) + 1;
        const attrs = { ...slotPos(k, it.band, seen[it.band]), ...KIND[it.k] };
        if (Number(el.getAttribute("opacity")) > 0) return m.push([el, { ...attrs, opacity: 1 }]);
        for (const [a, val] of Object.entries(attrs)) el.setAttribute(a, String(val));
        m.push([el, { opacity: 1 }]);
      });
    }
    return m;
  }

  /** Written notation: o = { top, bot, res: digit arrays|null, marks: {col:text}, op, annex, vis } */
  function noteMoves(o) {
    const m = [];
    for (const r of ["top", "bot", "res"]) {
      const d = o[r] ? shown(o[r]) : null;
      c.rows[r].forEach((el, k) => {
        el.textContent = d ? d[k] : "";
        el.setAttribute(
          "fill",
          r === "bot" && o.annex && k === COLS - 1 ? "var(--lsx-lo)" : "var(--lsx-ink)",
        );
        m.push([el, { opacity: d ? 1 : 0 }]);
      });
    }
    c.rows.mark.forEach((el, k) => {
      el.textContent = o.marks?.[k] ?? "";
      m.push([el, { opacity: o.marks?.[k] ? 1 : 0 }]);
    });
    ["top", "bot", "res"].forEach((r, i) => m.push([c.dots[i], { opacity: o[r] ? 1 : 0 }]));
    c.op.textContent = o.op || "";
    m.push([c.op, { opacity: o.op ? 1 : 0 }], [c.line, { opacity: o.bot ? 1 : 0 }]);
    m.push([c.zeroNote, { opacity: o.annex ? 1 : 0 }]);
    return m;
  }

  /** The whole stage in one state; every scene calls this. */
  function draw(ctx, o, ms) {
    const m = discMoves(o.cols);
    for (const k of ["A", "B", "M"]) {
      c.labs[k].textContent = o.lab?.[k] ?? "";
      m.push([c.labs[k], { opacity: o.lab?.[k] ? 1 : 0 }]);
    }
    c.counts.forEach((el, k) => {
      el.textContent = String(o.cols?.[k]?.length ?? 0);
      m.push([el, { opacity: o.counts ? 1 : 0 }]);
    });
    m.push([c.hiPoint, { opacity: o.hiPoint ? 1 : 0 }]);
    c.hiCol.forEach((el, k) => m.push([el, { opacity: o.hiCol === k ? 1 : 0 }]));
    m.push(
      [c.zeroBox, { opacity: o.zeroBand ? 1 : 0 }],
      [c.zeroTxt, { opacity: o.zeroBand ? 1 : 0 }],
    );
    m.push(...noteMoves(o.note || {}));
    return ctx.tween(m, ms);
  }

  const aCols = colsOf(add.da, "a", "A");
  const bCols = colsOf(add.db, "b", "B");
  const merged0 = mergeCols(colsOf(add.da, "a", "M"), colsOf(add.db, "b", "M"));
  const labels = (extra) => ({ A: `${v.a}`, ...extra });
  const addNote = (a, b, marks, withRes) => ({
    top: colDigits(a),
    bot: colDigits(b),
    res: withRes ? colDigits(Math.round((a + b) * 100) / 100) : null,
    op: "+",
    annex: true,
    marks,
  });
  const topNote = { top: colDigits(v.a) };
  const carryMarks = (trades) => Object.fromEntries(trades.map((t) => [t - 1, "1"]));

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.expr(escHtml(T.situateExpr));
        ctx.say(T.situateSay);
        await draw(ctx, { cols: emptyCols(), lab: labels() }, 0);
        await draw(ctx, { cols: aCols, lab: labels(), note: topNote }, 600);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        const withB = {
          cols: mergeCols(aCols, bCols),
          lab: labels({ B: `+ ${v.b}` }),
          zeroBand: true,
          note: addNote(v.a, v.b, {}, false),
        };
        const only = { cols: aCols, lab: labels(), note: topNote };
        ctx.expr(escHtml(T.situateExpr));
        ctx.say(T.predictSay);
        const opts = placeCorrect(
          predictOptions(v.b).map((o) => ({ ...o, label: PLACE.pl[o.col] })),
          Math.round(v.a * 100) + 1,
        );
        await draw(ctx, saved.solved ? { ...withB, hiCol: bCol } : only, 0);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options: opts,
            restore: saved.solved ? opts.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              ctx.feedback(T.predictCue(opt.col), "cue");
              await draw(ctx, { ...only, hiPoint: true }, 250);
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              await draw(ctx, { ...withB, hiCol: bCol }, 700);
            },
          }),
        );
      },
    },
    {
      id: "regroup",
      label: T.scene.regroup,
      gate: true,
      async enter(ctx, saved) {
        const st = ctx.state;
        const build = (list) => list.reduce((cols, t) => applyTrade(cols, t), merged0);
        // Replay saved trades, dropping any that no longer apply.
        let done = [];
        let cols = merged0;
        for (const t of Array.isArray(saved.trades) ? saved.trades : []) {
          if (Number.isInteger(t) && t >= 1 && t < COLS && cols[t].length >= 10) {
            cols = applyTrade(cols, t);
            done.push(t);
          }
        }
        const view = (ms, extra = {}) =>
          draw(
            ctx,
            {
              cols,
              counts: true,
              lab: { M: ctx.L(T.together) },
              note: addNote(v.a, v.b, {}, false),
              ...extra,
            },
            ms,
          );
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", ctx.L(T.regroupHow));
        const btns = [];
        for (let col = COLS - 1; col >= 1; col--) {
          const b = ctx.button({ label: T.trade(col), onClick: () => tradeAt(col) });
          row.appendChild(b);
          btns.push([col, b]);
        }
        const reset = ctx.button({
          label: T.startOver,
          onClick: async () => {
            if (busy) return;
            done = [];
            cols = build(done);
            st.trades = [];
            ctx.save();
            ctx.feedback("");
            ctx.expr(exprNow());
            paintBtns();
            await view(450);
          },
        });
        row.appendChild(reset);
        let busy = false;
        const finished = () => cols.every((col) => col.length < 10);
        const exprNow = () =>
          finished()
            ? `${escHtml(`${v.a} + ${v.b.toFixed(2)}`)} = ${hi(fmt(v.sum.toFixed(2)))}`
            : lo(cols.map((col) => col.length).join(" · "));
        const paintBtns = () => {
          for (const [col, b] of btns) b.disabled = busy || cols[col].length < 10;
          reset.disabled = busy || !done.length;
        };
        async function tradeAt(col) {
          if (busy || cols[col].length < 10) return;
          busy = true;
          paintBtns();
          const tgt = slotPos(col - 1, "M", cols[col - 1].length);
          await ctx.tween(
            c.pool[col].slice(0, 10).map((el) => [el, { x: tgt.x, y: tgt.y, opacity: 0 }]),
            450,
          );
          cols = applyTrade(cols, col);
          done.push(col);
          st.trades = done;
          ctx.save();
          ctx.feedback(T.traded(col));
          ctx.expr(exprNow());
          await view(300, { hiCol: col - 1 });
          busy = false;
          paintBtns();
          if (finished()) finish();
        }
        function finish() {
          ctx.feedback(T.regroupDone);
          ctx.unlock();
        }
        const how = document.createElement("p");
        how.className = "lsx-q";
        how.textContent = ctx.L(T.regroupHow);
        ctx.panel.append(how, row);
        ctx.say(T.regroupSay);
        ctx.expr(exprNow());
        paintBtns();
        // The added discs slide up onto the tank's.
        await draw(
          ctx,
          {
            cols: mergeCols(aCols, bCols),
            lab: { A: `${v.a}`, B: `+ ${v.b}` },
            zeroBand: true,
            note: addNote(v.a, v.b, {}, false),
          },
          0,
        );
        await view(done.length ? 0 : 700);
        if (finished()) finish();
      },
    },
    {
      id: "connect",
      label: T.scene.connect,
      async enter(ctx) {
        const cols = add.trades.reduce((x, t) => applyTrade(x, t), merged0);
        const full = addNote(v.a, v.b, carryMarks(add.trades), true);
        ctx.expr(`${escHtml(`${v.a} + ${v.b.toFixed(2)}`)} = ${hi(fmt(v.sum.toFixed(2)))}`);
        ctx.say(T.connectSay);
        const base = { cols, lab: { M: ctx.L(T.together) } };
        await draw(ctx, { ...base, note: { ...full, res: null, marks: {} } }, 500);
        await draw(ctx, { ...base, note: full }, 600);
      },
    },
    {
      id: "subtract",
      label: T.scene.subtract,
      gate: true,
      async enter(ctx, saved) {
        const steps = sub.steps;
        const firstTrade = steps.findIndex((s) => s.trade);
        const at = (n, ms, extra = {}) => {
          const res = steps.slice(0, n);
          const resDigits = Array(COLS).fill(null);
          for (const s of res) resDigits[s.col] = s.left;
          const marks = {};
          for (const s of res)
            if (s.trade)
              Object.assign(marks, {
                [s.col - 1]: String(sumDigits[s.col - 1] - 1),
                [s.col]: String(s.have),
              });
          const note = {
            top: sumDigits,
            bot: colDigits(v.c),
            res: n ? resDigits : null,
            op: "−",
            marks,
          };
          return draw(
            ctx,
            {
              cols: subCols(sub, sumDigits, n),
              lab: { M: fmt(v.sum.toFixed(2)) },
              note,
              hiCol: steps[n]?.col ?? null,
              ...extra,
            },
            ms,
          );
        };
        ctx.expr(`${escHtml(fmt(v.sum.toFixed(2)))} − ${escHtml(String(v.c))}`);
        ctx.say(T.subtractSay);
        const finish = () => {
          ctx.feedback(T.subtractDone);
          ctx.unlock();
        };
        if (saved.solved) {
          await at(steps.length, 0);
          finish();
          return;
        }
        await at(0, 0);
        for (let n = 1; n <= firstTrade; n++) await at(n, 500);
        const trade = steps[firstTrade];
        const o = T.subtractOptions(trade.col);
        const opts = placeCorrect(
          [
            { label: o.right, correct: true, kind: "trade" },
            { label: o.flip, kind: "flip" },
            { label: o.skip, kind: "skip" },
          ],
          Math.round(v.c * 100) + 2,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.subtractQ(trade.col, trade.have, trade.take),
            options: opts,
            onMiss: (_i, opt) => ctx.feedback(T.subtractCue[opt.kind], "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.subtractOk);
              for (let n = firstTrade + 1; n <= steps.length; n++) await at(n, 600);
              finish();
            },
          }),
        );
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        const ta = transfer.a;
        const tb = transfer.b;
        const showNote = (ms) =>
          draw(
            ctx,
            { cols: emptyCols(), note: addNote(ta, tb, carryMarks(tAdd.trades), true) },
            ms,
          );
        await draw(ctx, { cols: emptyCols() }, 0);
        ctx.expr(escHtml(T.transferExpr));
        ctx.say(T.transferSay);
        const opts = placeCorrect(
          sumChoices(ta, tb).map((x) => ({
            ...x,
            label: { en: fmt(x.value.toFixed(2)), es: fmt(x.value.toFixed(2)) },
          })),
          Math.round(ta * 100) + 3,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options: opts,
            restore: saved.solved ? opts.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.transferCue(opt), "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              await showNote(500);
            },
          }),
        );
        if (saved.solved) await showNote(0);
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
