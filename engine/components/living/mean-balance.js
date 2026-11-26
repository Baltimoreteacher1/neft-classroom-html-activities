// living/mean-balance.js — the mean as FAIR SHARE and as BALANCE POINT.
//
// One cast for the whole play: n towers of unit blocks, one tower per
// observation (Miguel's 4 days of dog-walking earnings in 2-8). The towers ARE
// the data in scene 1, are what the student levels by hand in scene 3 (the
// total never changes, only where the blocks sit), and the SAME blocks drop
// onto a number line as a dot plot in scene 4, where a fulcrum at the mean
// balances the distances on each side. Scene 5 lets the student drag one value
// and watch the fair-share level and the fulcrum move together.
//
// Config: { values:[...], unit, prefix, labels:[...], story:{en,es},
//           editIndex, transfer:{ values:[...], story:{en,es} } }
// Every value must be a whole number of blocks (value ÷ unit) and the mean must
// be a whole number of blocks too, so "level" is reachable by moving blocks.
// Anything else makes the play refuse to draw rather than draw a broken model.

import { escHtml } from "../../core/living-scene.js";
import {
  applyMove,
  assignBlocks,
  balance,
  choiceSet,
  fmtVal,
  isLevel,
  meanBalanceCopy,
  niceStep,
  okInt,
  placeCorrect,
  stats,
  sum,
  validateMeanBalance,
} from "./mean-balance-model.js";

export { validateMeanBalance };

const B = 20; // one block, in stage units

const TOP = 34;
const D = 18; // a dot in the dot plot
const ROW = 20;

export function buildMeanBalancePlay(cfg) {
  const v = validateMeanBalance(cfg);
  if (!v) return null;
  const { values, unit, blocks, prefix, labels, editIndex: E, transfer } = v;
  const T = meanBalanceCopy(v);
  const n = values.length;
  const S = stats(values);
  // A narrower stage for fewer towers keeps text legible on a phone.
  const W = Math.min(720, Math.max(540, 160 + n * 100));
  const meanB = S.mean / unit;
  const f = (x) => fmtVal(x, prefix);
  // Headroom above the tallest tower: scene 5 can grow one value by 3 blocks.
  const MAXB = Math.min(10, Math.max(...blocks) + 3);
  const TB = TOP + MAXB * B; // tower baseline
  const NL = TB + 66; // number line
  const ROWS0 = NL + 84; // first distance row
  const H = ROWS0 + n * ROW + 22;
  const sw = Math.min(130, (W - 120) / n);
  const BW = Math.min(60, sw - 30);
  const cx = (i) => W / 2 + (i - (n - 1) / 2) * sw;
  const blockAt = (i, k) => ({
    x: cx(i) - BW / 2,
    y: TB - (k + 1) * B + 1.5,
    width: BW,
    height: B - 3,
    rx: 3,
  });
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;
  const X = { fill: "var(--lsx-x)", stroke: "var(--lsx-x-edge)" };
  const U = { fill: "var(--lsx-u)", stroke: "var(--lsx-u-edge)" };

  let line = { lo: 0, hi: MAXB * unit, step: unit };
  const xOf = (val) => 60 + ((val - line.lo) / (line.hi - line.lo)) * (W - 120);
  let c = null; // the cast
  let stacks = null; // [[{o, j}]] — which block stands in which tower
  let onTower = null; // tower click handler, live only while leveling

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs, parent = g) => svgEl(tag, { opacity: 0, ...attrs }, parent);
    const text = (attrs) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 17,
        "font-weight": 800,
        fill: "var(--lsx-ink)",
        ...attrs,
      });
    const halo = {
      stroke: "var(--lsx-card)",
      "stroke-width": 5,
      "paint-order": "stroke",
      "font-size": 16,
    };
    const hline = (x1, x2, y, attrs) => el("line", { x1, x2, y1: y, y2: y, ...attrs });
    const towers = values.map((_, i) => ({
      base: hline(cx(i) - BW / 2 - 8, cx(i) + BW / 2 + 8, TB + 1, {
        stroke: "var(--lsx-rule-strong)",
        "stroke-width": 3,
      }),
      sel: el("rect", {
        x: cx(i) - BW / 2 - 8,
        y: TOP - 8,
        width: BW + 16,
        height: TB - TOP + 40,
        rx: 8,
        fill: "none",
        stroke: "var(--lsx-focus)",
        "stroke-width": 3,
        "stroke-dasharray": "7 5",
      }),
      name: text({ x: cx(i), y: TB + 24, fill: "var(--lsx-muted)", text: ctx.L(labels[i]) }),
      val: null,
    }));
    const pool = values.map((_, i) =>
      Array.from({ length: MAXB }, (_, j) =>
        el("rect", { ...blockAt(i, j), ...X, "stroke-width": 2 }),
      ),
    );
    const dash = (color) =>
      hline(40, W - 40, TB, { stroke: color, "stroke-width": 3, "stroke-dasharray": "9 6" });
    const tag = (color, label) =>
      text({ ...halo, x: W - 6, y: TB, "text-anchor": "end", fill: color, text: label });
    const fair = { line: dash("var(--lsx-hi)"), txt: tag("var(--lsx-hi)", ctx.L(T.fairShare)) };
    const guess = { line: dash("var(--lsx-lo)"), txt: tag("var(--lsx-lo)", "") };
    // Value labels sit above the dashed lines, haloed, so a line never strikes them.
    towers.forEach((t, i) => {
      t.val = text({ ...halo, "font-size": 19, x: cx(i), y: TB - 8, text: "" });
    });
    const total = text({ x: W / 2, y: NL + 4, "font-size": 20 });
    const axis = hline(44, W - 44, NL, { stroke: "var(--lsx-ink)", "stroke-width": 2 });
    const ticks = svgEl("g", { opacity: 0 }, g);
    const dotOf = (parent) =>
      el(
        "rect",
        { x: 0, y: NL - D, width: D, height: D, rx: D / 2, ...X, "stroke-width": 2 },
        parent,
      );
    const dots = values.map(() => dotOf(g));
    const tdotsG = svgEl("g", {}, g);
    const fulcrum = el("svg", {
      x: W / 2 - 11,
      y: NL + 2,
      width: 22,
      height: 18,
      overflow: "visible",
    });
    svgEl("polygon", { points: "0,18 11,0 22,18", fill: "var(--lsx-ink)" }, fulcrum);
    const meanTxt = text({ x: W / 2, y: NL + 60, "font-size": 18 });
    const rows = values.map((_, r) => ({
      line: hline(W / 2, W / 2, ROWS0 + r * ROW, {
        "stroke-width": 5,
        "stroke-linecap": "round",
        stroke: "var(--lsx-hi)",
      }),
      txt: text({ x: W / 2, y: ROWS0 + r * ROW + 5, "font-size": 16, "text-anchor": "start" }),
    }));
    const sums = text({ x: W / 2, y: ROWS0 + n * ROW + 10, "font-size": 18 });
    const hits = values.map((_, i) => {
      const box = { x: cx(i) - sw / 2 + 2, y: TOP - 10, width: sw - 4, height: TB - TOP + 44 };
      const h = svgEl("rect", { ...box, fill: "transparent" }, g);
      h.addEventListener("click", () => onTower?.(i));
      return h;
    });
    c = {
      towers,
      pool,
      fair,
      guess,
      total,
      axis,
      ticks,
      dots,
      tdotsG,
      dotOf,
      fulcrum,
      meanTxt,
      rows,
      sums,
      hits,
      svgEl,
    };
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  }

  function useLine(lo2, hi2, step) {
    line = { lo: lo2, hi: hi2, step };
    c.ticks.innerHTML = "";
    for (let t = lo2; t <= hi2 + 1e-9; t += step) {
      const x = xOf(t);
      c.svgEl(
        "line",
        { x1: x, x2: x, y1: NL - 6, y2: NL + 6, stroke: "var(--lsx-ink)", "stroke-width": 2 },
        c.ticks,
      );
      const lbl = {
        x,
        y: NL + 38,
        "text-anchor": "middle",
        "font-size": 16,
        fill: "var(--lsx-muted)",
        text: `${prefix}${t}`,
      };
      c.svgEl("text", lbl, c.ticks);
    }
  }
  const useMainLine = () => useLine(0, MAXB * unit, unit);

  const homeStacks = (hs) => hs.map((h, i) => Array.from({ length: h }, (_, j) => ({ o: i, j })));
  const dotPos = (vals, i) => {
    const s = vals.slice(0, i).filter((x) => x === vals[i]).length;
    return { x: xOf(vals[i]) - D / 2, y: NL - D - 3 - s * (D + 2), width: D, height: D };
  };
  const lineAt = (h, on) => ({ opacity: on ? 1 : 0, y1: TB - h * B, y2: TB - h * B });

  /**
   * Put the whole stage in one state. Every scene calls this, so a scene looks
   * the same whether the student arrived by Next, Back, a step dot or resume.
   * o: { mode: "towers"|"dots"|"none", line, dotVals, fulcrum, rows, sums,
   *      fair (blocks or null), guess {h, txt} | null, total, sel, edit }
   */
  function view(ctx, o, ms) {
    const m = [];
    const tow = o.mode === "towers";
    const vis = new Set();
    if (tow) {
      stacks.forEach((st, i) =>
        st.forEach((b, k) => {
          const el = c.pool[b.o][b.j];
          vis.add(el);
          const moved = b.o !== i || o.edit === i;
          m.push([el, { ...blockAt(i, k), opacity: 1, ...(moved ? U : X) }]);
        }),
      );
    }
    c.pool.forEach((col, i) =>
      col.forEach((el, j) => {
        if (vis.has(el)) return;
        if (o.mode === "dots" && j < blocks[i])
          m.push([el, { ...dotPos(values, i), rx: D / 2, opacity: 0 }]);
        else m.push([el, { ...blockAt(i, j), opacity: 0 }]);
      }),
    );
    c.towers.forEach((t, i) => {
      const h = tow ? stacks[i].length : 0;
      m.push([t.base, { opacity: tow ? 1 : 0 }], [t.name, { opacity: tow ? 1 : 0 }]);
      m.push([t.sel, { opacity: o.sel === i ? 1 : 0 }]);
      m.push([t.val, { opacity: tow ? 1 : 0, y: TB - h * B - 8, text: f(h * unit) }]);
    });
    m.push([c.fair.line, lineAt(o.fair ?? 0, o.fair != null)]);
    m.push([c.fair.txt, { opacity: o.fair == null ? 0 : 1, y: TB - (o.fair ?? 0) * B - 7 }]);
    m.push([c.guess.line, lineAt(o.guess?.h ?? 0, !!o.guess)]);
    m.push([
      c.guess.txt,
      { opacity: o.guess ? 1 : 0, y: TB - (o.guess?.h ?? 0) * B - 7, text: o.guess?.txt ?? "" },
    ]);
    m.push([c.total, { opacity: o.total ? 1 : 0 }]);
    m.push([c.axis, { opacity: o.line ? 1 : 0 }], [c.ticks, { opacity: o.line ? 1 : 0 }]);
    c.dots.forEach((d, i) => {
      // The value being edited in scene 5 is amber on both the tower and the dot.
      const look = o.edit === i ? U : X;
      m.push([d, { ...dotPos(o.dotVals || values, i), opacity: o.dotVals ? 1 : 0, ...look }]);
    });
    const mean = o.dotVals ? stats(o.dotVals).mean : S.mean;
    const bal = o.dotVals ? balance(o.dotVals) : null;
    const mx = xOf(mean);
    m.push([c.fulcrum, { opacity: o.fulcrum ? 1 : 0, x: mx - 11 }]);
    m.push([
      c.meanTxt,
      { opacity: o.fulcrum ? 1 : 0, x: mx, text: `${ctx.L(T.mean)} = ${f(mean)}` },
    ]);
    c.rows.forEach((r, k) => {
      const row = bal?.rows[k];
      const on = !!(o.rows && row);
      const x2 = row ? xOf(row.value) : mx;
      // Label at the segment's outer end; flip to the mean side near a stage edge.
      const outerLeft = row?.side === "left";
      const toLeft = outerLeft ? x2 - 100 > 0 : x2 + 100 > W;
      const tx = toLeft ? (outerLeft ? x2 : mx) - 10 : (outerLeft ? mx : x2) + 10;
      const stroke = outerLeft ? "var(--lsx-lo)" : "var(--lsx-hi)";
      m.push([r.line, { opacity: on ? 1 : 0, x1: mx, x2, stroke }]);
      const txt = row ? ctx.L(T.distance(k, row.d)) : "";
      const anchor = toLeft ? "end" : "start";
      m.push([
        r.txt,
        { opacity: on ? 1 : 0, x: tx, y: ROWS0 + k * ROW + 5, "text-anchor": anchor, text: txt },
      ]);
    });
    if (bal) c.sums.textContent = ctx.L(T.sums(bal));
    m.push([c.sums, { opacity: o.sums && bal ? 1 : 0, y: ROWS0 + n * ROW + 10 }]);
    for (const h of c.hits) h.style.cursor = onTower ? "pointer" : "default";
    return ctx.tween(m, ms);
  }

  /** Reset what a scene does not own: leveling clicks, the line, transfer dots. */
  const enterCommon = () => {
    onTower = null;
    useMainLine();
    c.tdotsG.innerHTML = "";
  };
  const choiceOpts = (vals, seed) =>
    placeCorrect(
      choiceSet(vals).map((o) => ({ ...o, label: f(o.value) })),
      seed,
    );

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        enterCommon();
        c.total.textContent = ctx.L(T.total);
        ctx.expr(escHtml(T.list));
        ctx.say(T.situateSay);
        stacks = homeStacks(blocks.map(() => 0));
        await view(ctx, { mode: "towers" }, 0);
        for (let i = 0; i < n; i++) {
          stacks[i] = homeStacks(blocks)[i];
          await view(ctx, { mode: "towers" }, 360);
        }
        await view(ctx, { mode: "towers", total: true }, 300);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        enterCommon();
        c.total.textContent = ctx.L(T.total);
        stacks = homeStacks(blocks);
        await view(ctx, { mode: "towers", total: true }, 300);
        ctx.expr(escHtml(T.list));
        ctx.say(T.predictSay);
        const options = choiceOpts(values, S.total + 3 * n + 1);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              const h = opt.value / unit;
              const guess =
                opt.kind !== "total" && h <= MAXB ? { h, txt: `${f(opt.value)}?` } : null;
              ctx.feedback(T.cue(opt, values), "cue");
              await view(ctx, { mode: "towers", total: true, guess }, 300);
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              await view(ctx, { mode: "towers", total: true }, 300);
            },
          }),
        );
      },
    },
    {
      id: "level",
      label: T.scene.level,
      gate: true,
      async enter(ctx, saved) {
        enterCommon();
        const st = ctx.state;
        const cap = Math.max(...blocks);
        const sh = saved.heights;
        const ok =
          Array.isArray(sh) &&
          sh.length === n &&
          sum(sh) === sum(blocks) &&
          sh.every((h) => okInt(h, 0, cap));
        stacks = assignBlocks(blocks, ok ? sh : blocks);
        let from = null;
        c.total.textContent = ctx.L(T.totalAlways);
        const heights = () => stacks.map((s) => s.length);
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", ctx.L(T.towers));
        const btns = values.map((_, i) => {
          const b = ctx.button({ label: "", onClick: () => onTower?.(i) });
          b.setAttribute("aria-pressed", "false");
          row.appendChild(b);
          return b;
        });
        const reset = ctx.button({
          label: T.startOver,
          onClick: () => {
            if (isLevel(heights())) return;
            from = null;
            stacks = homeStacks(blocks);
            st.heights = heights();
            ctx.save();
            ctx.feedback("");
            paint(450);
          },
        });
        const paint = (ms) => {
          const hs = heights();
          const level = isLevel(hs);
          btns.forEach((b, i) => {
            b.textContent = `${ctx.L(labels[i])} · ${f(hs[i] * unit)}`;
            b.setAttribute("aria-pressed", String(from === i));
            b.disabled = level;
          });
          reset.disabled = level;
          ctx.expr(
            level
              ? `${escHtml(f(S.total))} ÷ ${n} = ${hi(f(S.mean))}`
              : `${escHtml(hs.map((h) => f(h * unit)).join(" + "))} = ${lo(f(S.total))}`,
          );
          return view(
            ctx,
            { mode: "towers", total: true, fair: level ? meanB : null, sel: from },
            ms,
          );
        };
        const done = () => {
          onTower = null;
          ctx.feedback(T.levelDone);
          ctx.unlock();
        };
        onTower = (i) => {
          if (isLevel(heights())) return;
          if (from == null) {
            if (!stacks[i].length) return ctx.feedback(T.emptySource, "cue");
            from = i;
            ctx.feedback(T.taking(i));
            paint(0);
            return;
          }
          if (from === i) {
            from = null;
            ctx.feedback("");
            paint(0);
            return;
          }
          if (!applyMove(heights(), from, i, cap)) return ctx.feedback(T.atCap, "cue");
          stacks[i].push(stacks[from].pop());
          from = null;
          st.heights = heights();
          ctx.save();
          ctx.feedback(T.moved);
          paint(450).then(() => isLevel(heights()) && done());
        };
        const how = document.createElement("p");
        how.className = "lsx-q";
        how.textContent = ctx.L(T.levelHow);
        row.appendChild(reset);
        ctx.panel.append(how, row);
        ctx.say(T.levelSay);
        await paint(300);
        if (isLevel(heights())) done();
      },
    },
    {
      id: "balance",
      label: T.scene.balance,
      async enter(ctx) {
        enterCommon();
        stacks = homeStacks(blocks);
        const bal = balance(values);
        ctx.say(T.balanceSay);
        ctx.expr(
          `${escHtml(ctx.L(T.left))} ${lo(f(bal.left))} = ${escHtml(ctx.L(T.right))} ${hi(f(bal.right))}`,
        );
        const dots = { mode: "dots", line: true, dotVals: values };
        await view(ctx, { mode: "towers" }, 500);
        await view(ctx, dots, 700);
        await view(ctx, { ...dots, fulcrum: true, rows: true, sums: true }, 500);
        ctx.feedback(T.balanceDone);
      },
    },
    {
      id: "change",
      label: T.scene.change,
      gate: true,
      async enter(ctx) {
        enterCommon();
        const st = ctx.state;
        st.seen = Array.isArray(st.seen) ? st.seen.filter((x) => okInt(x, 0, MAXB)) : [];
        const startB = st.seen.length ? st.seen[st.seen.length - 1] : blocks[E];
        const table = document.createElement("p");
        table.className = "lsx-fb";
        table.setAttribute("aria-live", "polite");
        const apply = (b, ms) => {
          const hs = blocks.map((h, i) => (i === E ? b : h));
          const vals = hs.map((h) => h * unit);
          const s = stats(vals);
          stacks = homeStacks(hs);
          ctx.expr(`${escHtml(f(s.total))} ÷ ${n} = ${hi(f(s.mean))}`);
          table.innerHTML = ctx.L(T.changeRow(E, vals, escHtml));
          const o = { mode: "towers", line: true, dotVals: vals, fulcrum: true, sums: true };
          return view(ctx, { ...o, fair: s.mean / unit, edit: E }, ms);
        };
        const progress = () => {
          if (st.seen.length >= 3) {
            ctx.feedback(T.changeLesson);
            ctx.unlock();
          } else ctx.feedback(st.seen.length ? T.tryMore(3 - st.seen.length) : T.tryThree, "cue");
        };
        ctx.say(T.changeSay(E));
        const rng = ctx.range({
          label: labels[E],
          min: 0,
          max: MAXB * unit,
          value: startB * unit,
          onInput: async (val) => {
            const b = Math.round(val / unit);
            if (!st.seen.includes(b) && b !== blocks[E]) st.seen.push(b);
            ctx.save();
            await apply(b, 250);
            progress();
          },
        });
        const input = /** @type {HTMLInputElement} */ (rng.querySelector("input"));
        const out = /** @type {HTMLOutputElement} */ (rng.querySelector("output"));
        input.step = String(unit);
        out.textContent = f(startB * unit);
        input.addEventListener("input", () => {
          out.textContent = f(Number(input.value));
        });
        ctx.panel.append(rng, table);
        await apply(startB, 600);
        progress();
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        onTower = null;
        const tv = transfer.values;
        const ts = stats(tv);
        const step = niceStep(ts.max - ts.min + 2);
        const lo2 = Math.max(0, Math.floor(ts.min / step) * step - step);
        useLine(lo2, Math.ceil(ts.max / step) * step + step, step);
        c.tdotsG.innerHTML = "";
        const tdots = tv.map((_, i) => {
          const d = c.dotOf(c.tdotsG);
          for (const [k, val] of Object.entries(dotPos(tv, i))) d.setAttribute(k, String(val));
          return d;
        });
        stacks = homeStacks(blocks.map(() => 0));
        const showFulcrum = (ms) => {
          c.sums.textContent = ctx.L(T.transferSums);
          const meanLbl = { opacity: 1, x: xOf(ts.mean), text: `${ctx.L(T.mean)} = ${f(ts.mean)}` };
          const moves = [
            [c.fulcrum, { opacity: 1, x: xOf(ts.mean) - 11 }],
            [c.meanTxt, meanLbl],
            [c.sums, { opacity: 1, y: ROWS0 }],
          ];
          return ctx.tween(moves, ms);
        };
        await view(ctx, { mode: "none", line: true }, 300);
        await ctx.tween(
          tdots.map((d) => [d, { opacity: 1 }]),
          400,
        );
        ctx.expr(escHtml(T.transferList));
        ctx.say(T.transferSay);
        const options = choiceOpts(tv, ts.total + 2 * tv.length + 3);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.cue(opt, tv), "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              await showFulcrum(500);
            },
          }),
        );
        if (saved.solved) await showFulcrum(0);
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
