// living/percent-missing-whole.js — a known part and its percent: build the
// tape back up to 100% to find the whole.
//
// One cast for the whole play: a tape of 100/chunk equal blocks. The shaded
// blocks are the part we know; sharing the part equally gives what one block is
// worth; filling the rest of the tape reaches 100%; the same numbers then sit in
// a ratio table and an equation, and a check puts the percent of the whole back
// onto the part.
//
// Config: { part, percent, chunk, prefix | unit, story, transfer:{...same} } —
// the lesson's own numbers (4-5 authors $42 = 60% of the sweater's price, so 10%
// = $7 and 100% = $70, and Sheng's car: $26,600 = 70% of $38,000). Every number
// and sentence comes from percent-missing-whole-model.js (pure, tested).

import { escHtml } from "../../core/living-scene.js";
import {
  amtPair,
  choicesFor,
  fmt,
  okInt,
  placeNotFirst,
  validatePercentMissingWhole,
  wholeCopy,
} from "./percent-missing-whole-model.js";

export { validatePercentMissingWhole };

const W = 480;
const H = 300;
const TX = 20;
const TW = 440;
const TY = 64;
const TH = 50;
const MAXB = 10;

const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;

export function buildPercentMissingWholePlay(cfg) {
  const v = validatePercentMissingWhole(cfg);
  if (!v) return null;
  const t = v.transfer;
  const copy = wholeCopy(v);
  let cast = null;
  let L = (x) => x.en;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    L = ctx.L;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const T = (a) =>
      svgEl(
        "text",
        {
          "font-size": 16,
          "font-weight": 700,
          fill: "var(--lsx-ink)",
          "text-anchor": "middle",
          opacity: 0,
          stroke: "var(--lsx-card)",
          "stroke-width": 4,
          "paint-order": "stroke",
          ...a,
        },
        g,
      );
    const line = (a) =>
      svgEl("line", { stroke: "var(--lsx-ink)", "stroke-width": 2, opacity: 0, ...a }, g);
    cast = {
      blocks: Array.from({ length: MAXB }, () =>
        svgEl(
          "rect",
          { x: TX, y: TY, width: 0, height: TH, rx: 3, "stroke-width": 2, opacity: 0 },
          g,
        ),
      ),
      vals: Array.from({ length: MAXB }, () =>
        T({ y: TY + TH / 2 + 6, "font-size": 16, "font-weight": 800 }),
      ),
      wholeLine: line({ x1: TX, x2: TX + TW, y1: 50, y2: 50 }),
      wholeEnds: [TX, TX + TW].map((x) => line({ x1: x, x2: x, y1: 44, y2: 56 })),
      wholeLbl: T({ x: TX + TW / 2, y: 38, "font-size": 20, fill: "var(--lsx-hi)" }),
      partLine: line({
        y1: TY + TH + 10,
        y2: TY + TH + 10,
        stroke: "var(--lsx-hi)",
        "stroke-width": 3,
      }),
      partEnds: [0, 1].map(() =>
        line({ y1: TY + TH + 4, y2: TY + TH + 16, stroke: "var(--lsx-hi)", "stroke-width": 3 }),
      ),
      partLbl: T({ y: TY + TH + 38, "font-size": 19, fill: "var(--lsx-hi)" }),
      each: T({ x: TX + TW / 2, y: TY + TH + 66, "font-size": 18, fill: "var(--lsx-lo)" }),
      note: T({ x: W / 2, y: 284, "font-size": 22, "font-weight": 800, fill: "var(--lsx-hi)" }),
      hdr: [T({ x: 130, y: 200, "font-size": 16 }), T({ x: 290, y: 200, "font-size": 16 })],
      rule: line({ x1: 70, x2: 350, y1: 208, y2: 208, "stroke-width": 1.5 }),
      cells: [0, 1, 2].map((r) => [
        T({ x: 130, y: 232 + r * 26, "font-size": 20 }),
        T({ x: 290, y: 232 + r * 26, "font-size": 20, fill: "var(--lsx-lo)" }),
      ]),
      ops: [
        T({ x: 372, y: 245, "font-size": 18, "text-anchor": "start" }),
        T({ x: 372, y: 271, "font-size": 18, "text-anchor": "start" }),
      ],
    };
  }

  const OFF = { opacity: 0 };
  const ON = { opacity: 1 };

  /**
   * Everything on the stage for problem `s`. o = { k: blocks with a value label,
   * whole: show the whole's value, each, table, note, hot: part|rest }.
   */
  function paint(s, o) {
    const m = [];
    const bw = TW / s.n;
    const known = (i) => i < s.tens;
    cast.blocks.forEach((b, i) => {
      const live = i < s.n;
      const built = !known(i) && i < (o.k || 0);
      b.setAttribute(
        "fill",
        known(i) ? "var(--lsx-x)" : built ? "var(--lsx-u)" : "var(--lsx-paper)",
      );
      b.setAttribute(
        "stroke",
        known(i) ? "var(--lsx-x-edge)" : built ? "var(--lsx-u-edge)" : "var(--lsx-ink)",
      );
      b.setAttribute("stroke-dasharray", !known(i) && !built ? "6 4" : "");
      const hot = (o.hot === "part" && known(i)) || (o.hot === "rest" && !known(i));
      m.push([
        b,
        { x: TX + i * bw + 1, width: bw - 2, "stroke-width": hot ? 5 : 2, ...(live ? ON : OFF) },
      ]);
      const v2 = cast.vals[i];
      v2.textContent = fmt(s.chunkH);
      v2.setAttribute("fill", known(i) ? "var(--lsx-on-x)" : "var(--lsx-ink)");
      v2.setAttribute("stroke-width", "0");
      v2.setAttribute(
        "font-size",
        String(Math.min(16, Math.max(12, (bw - 6) / (v2.textContent.length * 0.6)))),
      );
      m.push([v2, { x: TX + i * bw + bw / 2, ...(live && i < (o.k || 0) ? ON : OFF) }]);
    });
    cast.wholeLbl.textContent = L(o.whole ? copy.wholeLbl(s) : copy.wholeQ);
    cast.partLbl.textContent = L(copy.partLbl(s));
    cast.each.textContent = L(copy.eachLbl(s));
    const px = TX + s.tens * bw;
    m.push([cast.wholeLine, ON], ...cast.wholeEnds.map((e) => [e, ON]), [cast.wholeLbl, ON]);
    m.push([cast.partLine, { ...ON, x1: TX, x2: px }]);
    m.push(
      [cast.partEnds[0], { ...ON, x1: TX, x2: TX }],
      [cast.partEnds[1], { ...ON, x1: px, x2: px }],
    );
    m.push([cast.partLbl, { ...ON, x: TX + (s.tens * bw) / 2 }]);
    m.push([cast.each, o.each ? ON : OFF]);
    cast.note.textContent = o.note || "";
    m.push([cast.note, o.note ? ON : OFF]);
    const tb = !!o.table;
    cast.hdr[0].textContent = L(copy.hdr.pct);
    cast.hdr[1].textContent = L(copy.hdr.amt);
    const rows = [
      [`${s.percent}%`, fmt(s.part * 100)],
      [`${s.chunk}%`, fmt(s.chunkH)],
      ["100%", fmt(s.wholeH)],
    ];
    cast.cells.forEach((r, i) =>
      r.forEach((c, j) => {
        c.textContent = (j === 1 && s.prefix ? s.prefix : "") + rows[i][j];
        m.push([c, tb ? ON : OFF]);
      }),
    );
    cast.ops[0].textContent = copy.table.divide;
    cast.ops[1].textContent = copy.table.times;
    for (const e of [...cast.hdr, cast.rule, ...cast.ops]) m.push([e, tb ? ON : OFF]);
    return m;
  }

  const solvedView = (s, extra = {}) => ({ k: s.n, whole: true, each: true, ...extra });
  const optsOf = (s, seed, cue) =>
    placeNotFirst(
      choicesFor(s).map((o) => ({
        ...o,
        label: L(amtPair(s, o.h)),
        cue: o.correct ? null : cue(o.kind, o.h),
      })),
      seed,
    );
  const exprWhole = (s, solved) =>
    `${hi(`${s.percent}%`)} = ${lo(fmt(s.part * 100))} → 100% = ${solved ? hi(fmt(s.wholeH)) : "?"}`;

  const scenes = [
    {
      id: "situate",
      label: copy.scene.situate,
      async enter(ctx) {
        L = ctx.L;
        await ctx.tween(
          paint(v, {}).map(([e, a]) => [e, cast.blocks.includes(e) ? { ...a, opacity: 0 } : a]),
          0,
        );
        await ctx.tween(paint(v, {}), 600);
        ctx.expr(exprWhole(v, false));
        ctx.say(copy.situate.say);
        ctx.feedback(copy.situate.note);
      },
    },
    {
      id: "predict",
      label: copy.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        L = ctx.L;
        const solved = !!saved.solved;
        await ctx.tween(paint(v, solved ? solvedView(v) : {}), 300);
        ctx.expr(exprWhole(v, solved));
        ctx.say(copy.predict.say);
        const options = optsOf(v, v.part + v.percent, (kind, h) =>
          ctx.L(copy.predict.cue(kind, h)),
        );
        const hotOf = { times: "part", addMissing: "rest", same: "rest" };
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.predict.question,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              await ctx.tween(paint(v, { hot: hotOf[opt.kind] }), 250);
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(paint(v, {}), 200);
              ctx.feedback(copy.predict.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "chunk",
      label: copy.scene.chunk,
      gate: true,
      async enter(ctx) {
        L = ctx.L;
        const st = ctx.state;
        ctx.say(copy.chunk.say);
        const unitTxt = (h) => L(amtPair(v, h));
        const fill = async (k, ms) => {
          st.k = k;
          ctx.save();
          const done = k === v.n;
          await ctx.tween(paint(v, { k, each: true, whole: done }), ms);
          ctx.expr(
            `${hi(fmt(v.chunkH))} × ${k} = ${lo(fmt(v.chunkH * k))}${done ? ` → 100% = ${hi(unitTxt(v.wholeH))}` : ""}`,
          );
          if (done) {
            st.reached = true;
            ctx.save();
            ctx.feedback(copy.chunk.done);
            ctx.unlock();
          } else ctx.feedback(copy.chunk.more, "cue");
        };
        const showRange = (k0) => {
          ctx.panel.innerHTML = "";
          ctx.panel.appendChild(
            ctx.range({
              label: copy.chunk.label,
              min: v.tens,
              max: v.n,
              value: k0,
              onInput: (k) => fill(k, 250),
            }),
          );
        };
        if (st.shared) {
          const k0 = okInt(st.k, v.tens, v.n) ? st.k : v.tens;
          showRange(st.reached ? v.n : k0);
          await fill(st.reached ? v.n : k0, 400);
          return;
        }
        await ctx.tween(paint(v, {}), 300);
        ctx.expr(`${hi(unitTxt(v.part * 100))} ÷ ${v.tens} = ?`);
        const btn = ctx.button({
          label: copy.chunk.shareBtn,
          primary: true,
          onClick: async () => {
            st.shared = true;
            st.k = v.tens;
            ctx.save();
            showRange(v.tens);
            await ctx.tween(paint(v, { k: v.tens, each: true }), 700);
            ctx.expr(`${hi(unitTxt(v.part * 100))} ÷ ${v.tens} = ${lo(unitTxt(v.chunkH))}`);
            ctx.feedback(copy.chunk.shared);
          },
        });
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.appendChild(btn);
        ctx.panel.appendChild(row);
      },
    },
    {
      id: "table",
      label: copy.scene.table,
      async enter(ctx) {
        L = ctx.L;
        await ctx.tween(paint(v, solvedView(v, { table: true, each: false })), 600);
        ctx.expr(`${hi(copy.table.eq)}`);
        ctx.say(copy.table.say);
        ctx.feedback("");
      },
    },
    {
      id: "check",
      label: copy.scene.check,
      gate: true,
      async enter(ctx, saved) {
        L = ctx.L;
        const solved = !!saved.solved;
        const note = `${fmt(v.percent)} × ${fmt(v.wholeH)} = ${fmt(v.part * 100)}`;
        await ctx.tween(paint(v, solvedView(v, solved ? { note } : {})), 400);
        ctx.expr(exprWhole(v, true));
        ctx.say(copy.check.say);
        const order = [
          { kind: "correct", correct: true, label: copy.check.labels.correct },
          { kind: "bigger", label: copy.check.labels.bigger, cue: copy.check.cue.bigger },
          { kind: "ofPart", label: copy.check.labels.ofPart, cue: copy.check.cue.ofPart },
        ];
        const options = placeNotFirst(
          order.map((o) => ({ ...o, label: ctx.L(o.label), cue: o.cue ? ctx.L(o.cue) : null })),
          v.part + v.n,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.check.question,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(paint(v, solvedView(v, { note })), 500);
              ctx.feedback(copy.check.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "transfer",
      label: copy.scene.transfer,
      async enter(ctx, saved) {
        L = ctx.L;
        const solved = !!saved.solved;
        await ctx.tween(paint(t, solved ? solvedView(t) : {}), 600);
        ctx.expr(exprWhole(t, solved));
        ctx.say(copy.transfer.say);
        const options = optsOf(t, t.part + t.percent, (kind, h) =>
          ctx.L(copy.transfer.cue(kind, h)),
        );
        const hotOf = { times: "part", addMissing: "rest", same: "rest" };
        ctx.panel.append(
          ctx.choices({
            question: copy.transfer.question,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              await ctx.tween(paint(t, { hot: hotOf[opt.kind] }), 250);
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(paint(t, solvedView(t)), 800);
              ctx.expr(exprWhole(t, true));
              ctx.feedback(copy.transfer.ok);
            },
          }),
          ctx.frame({ label: copy.transfer.explain, frame: copy.transfer.frame }),
        );
      },
    },
  ];

  return {
    kicker: copy.kicker,
    title: copy.title,
    viewBox: `0 0 ${W} ${H}`,
    ariaLabel: copy.ariaLabel,
    printSummary: copy.printSummary,
    setup,
    scenes,
  };
}
