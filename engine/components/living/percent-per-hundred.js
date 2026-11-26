// living/percent-per-hundred.js — "a out of every b" becomes "p out of 100", which is p%.
//
// One cast for the whole play: 100 squares. A group of b squares (a shaded) is
// COPIED until there are 100, the shaded squares slide together to read as a
// percent, and the very same squares line up into a bar that runs past 100% so
// a percent greater than 100% is something the student sees, not a rule.
//
// Config: { a, b, noun, did, story, over:{whole, amount, unit, base, other,
// story}, transfer:{a, b, noun, did} } — the lesson's own numbers (4-1 authors
// 4 out of every 10 voters chose the tiger, a 4-ounce kitten against a 6-ounce
// one, and 23 out of every 100). Every number and sentence comes from
// percent-per-hundred-model.js (pure, tested).

import { escHtml } from "../../core/living-scene.js";
import {
  fdChoices,
  okInt,
  overChoices,
  percentCopy,
  placeNotFirst,
  scaleChoices,
  shadedInGroups,
  sortedSlot,
  validatePercentPerHundred,
} from "./percent-per-hundred-model.js";
import { fmtHundredths } from "./percent-whole.js";

export { validatePercentPerHundred };

const W = 480;
const H = 300;
const GX = 20;
const GY = 40;
const CELL = 22;
const BAR = { x: 40, y: 64, h: 36, u: 2 }; // 2 units per 1%

const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;

export function buildPercentPerHundredPlay(cfg) {
  const v = validatePercentPerHundred(cfg);
  if (!v) return null;
  const { a, b, k, p, over: o, transfer: t } = v;
  const copy = percentCopy(v);
  let cast = null;
  let L = (x) => x.en;

  const gridPos = (slot) => ({
    x: GX + (slot % 10) * CELL + 1,
    y: GY + Math.floor(slot / 10) * CELL + 1,
    width: CELL - 2,
    height: CELL - 2,
  });
  const barPos = (i) => ({ x: BAR.x + i * BAR.u, y: BAR.y, width: BAR.u, height: BAR.h });
  const boxPos = (g) =>
    b <= 10
      ? {
          x: GX + (g % (10 / b)) * b * CELL - 1,
          y: GY + Math.floor(g / (10 / b)) * CELL - 1,
          width: b * CELL + 2,
          height: CELL + 2,
        }
      : {
          x: GX - 1,
          y: GY + g * (b / 10) * CELL - 1,
          width: 10 * CELL + 2,
          height: (b / 10) * CELL + 2,
        };

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    L = ctx.L;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const T = (a2) =>
      svgEl(
        "text",
        {
          "font-size": 16,
          "font-weight": 700,
          fill: "var(--lsx-ink)",
          opacity: 0,
          stroke: "var(--lsx-card)",
          "stroke-width": 4,
          "paint-order": "stroke",
          ...a2,
        },
        g,
      );
    const line = (a2) =>
      svgEl("line", { stroke: "var(--lsx-ink)", "stroke-width": 2, opacity: 0, ...a2 }, g);
    cast = {
      cells: Array.from({ length: 100 }, (_, i) =>
        svgEl("rect", { ...gridPos(i), rx: 2, "stroke-width": 1, opacity: 0 }, g),
      ),
      boxes: Array.from({ length: 100 / b }, (_, i) =>
        svgEl(
          "rect",
          {
            ...boxPos(i),
            rx: 3,
            fill: "none",
            stroke: "var(--lsx-ink)",
            "stroke-width": 2.5,
            "stroke-dasharray": "5 3",
            opacity: 0,
          },
          g,
        ),
      ),
      header: T({ x: 16, y: 24, "font-size": 16, "text-anchor": "start" }),
      side: [
        T({ x: 252, y: 86, "font-size": 24, "text-anchor": "start" }),
        T({
          x: 252,
          y: 130,
          "font-size": 34,
          "font-weight": 800,
          "text-anchor": "start",
          fill: "var(--lsx-hi)",
        }),
        T({ x: 252, y: 176, "font-size": 20, "text-anchor": "start" }),
        T({ x: 252, y: 208, "font-size": 20, "text-anchor": "start", fill: "var(--lsx-muted)" }),
      ],
      barFrame: svgEl(
        "rect",
        {
          x: BAR.x,
          y: BAR.y,
          width: 100 * BAR.u,
          height: BAR.h,
          fill: "none",
          stroke: "var(--lsx-ink)",
          "stroke-width": 2.5,
          opacity: 0,
        },
        g,
      ),
      over: svgEl(
        "rect",
        {
          x: BAR.x + 100 * BAR.u,
          y: BAR.y,
          width: 0,
          height: BAR.h,
          fill: "var(--lsx-u)",
          stroke: "var(--lsx-u-edge)",
          "stroke-width": 2.5,
          "stroke-dasharray": "6 4",
          opacity: 0,
        },
        g,
      ),
      axis: [0, 100, 200].map((pc) =>
        T({
          x: BAR.x + pc * BAR.u,
          y: BAR.y + BAR.h + 26,
          "text-anchor": "middle",
          text: `${pc}%`,
        }),
      ),
      tickLines: [0, 100, 200].map((pc) =>
        line({
          x1: BAR.x + pc * BAR.u,
          x2: BAR.x + pc * BAR.u,
          y1: BAR.y + BAR.h,
          y2: BAR.y + BAR.h + 8,
        }),
      ),
      pinTop: T({ y: BAR.y - 12, "font-size": 20, "text-anchor": "middle", fill: "var(--lsx-hi)" }),
      pinLine: line({
        y1: BAR.y - 6,
        y2: BAR.y + BAR.h + 6,
        stroke: "var(--lsx-hi)",
        "stroke-width": 3,
      }),
      ghostTxt: T({ y: BAR.y + BAR.h + 54, "font-size": 16, "text-anchor": "middle" }),
      ghostLine: line({
        y1: BAR.y - 6,
        y2: BAR.y + BAR.h + 6,
        "stroke-dasharray": "4 3",
        "stroke-width": 3,
      }),
      lblBase: T({ x: 20, y: 200, "font-size": 18, "text-anchor": "start", fill: "var(--lsx-hi)" }),
      lblOther: T({
        x: 20,
        y: 246,
        "font-size": 18,
        "text-anchor": "start",
        fill: "var(--lsx-lo)",
      }),
    };
  }

  const fill = (isShaded) =>
    cast.cells.forEach((c, i) => {
      const on = isShaded(i);
      c.setAttribute("fill", on ? "var(--lsx-x)" : "var(--lsx-card)");
      c.setAttribute("stroke", on ? "var(--lsx-x-edge)" : "var(--lsx-muted)");
    });
  const OFF = { opacity: 0 };
  const ON = { opacity: 1 };
  const hideAll = (except = []) =>
    [
      ...cast.boxes,
      cast.header,
      ...cast.side,
      cast.barFrame,
      cast.over,
      ...cast.axis,
      ...cast.tickLines,
      cast.pinTop,
      cast.pinLine,
      cast.ghostTxt,
      cast.ghostLine,
      cast.lblBase,
      cast.lblOther,
    ]
      .filter((n) => !except.includes(n))
      .map((n) => [n, OFF]);
  const setSide = (...texts) =>
    cast.side.forEach((s, i) => {
      s.textContent = texts[i] || "";
    });

  /** n copies of the group of b: cells of the first n groups, boxes around them. */
  function groupsView(n, header) {
    fill((i) => shadedInGroups(i, a, b));
    cast.header.textContent = header;
    const m = cast.cells.map((c, i) => [
      c,
      { ...gridPos(i), ...(i < n * b ? ON : OFF), "stroke-width": 1 },
    ]);
    m.push([cast.header, ON]);
    cast.boxes.forEach((bx, g) => m.push([bx, g < n ? ON : OFF]));
    return [...m, ...hideAll([...cast.boxes, cast.header])];
  }
  /** Shaded cells slid to the front (identity kept). */
  function sortedView(header) {
    fill((i) => shadedInGroups(i, a, b));
    cast.header.textContent = header;
    const m = cast.cells.map((c, i) => [
      c,
      { ...gridPos(sortedSlot(i, a, b, p)), ...ON, "stroke-width": 1 },
    ]);
    return [...m, [cast.header, ON], ...hideAll([cast.header])];
  }
  /** Contiguous shaded squares for the transfer problem. */
  function plainView(count, header) {
    fill((i) => i < count);
    cast.header.textContent = header;
    const m = cast.cells.map((c, i) => [c, { ...gridPos(i), ...ON, "stroke-width": 1 }]);
    return [...m, [cast.header, ON], ...hideAll([cast.header])];
  }
  /** All 100 squares as a bar with a 0-200% scale; `pct` > 100 adds the extra part. */
  function barView(pct, ghost) {
    fill(() => true);
    const m = cast.cells.map((c, i) => [c, { ...barPos(i), ...ON, "stroke-width": 0 }]);
    for (const c of cast.cells) c.setAttribute("stroke", "var(--lsx-card)");
    const xEnd = BAR.x + (pct || 100) * BAR.u;
    cast.pinTop.textContent = pct ? `${pct}%` : "100%";
    cast.lblBase.textContent = L(copy.over.barBase);
    cast.lblOther.textContent = L(copy.over.barOther);
    m.push(
      [cast.barFrame, ON],
      [cast.header, OFF],
      ...cast.axis.map((n) => [n, ON]),
      ...cast.tickLines.map((n) => [n, ON]),
    );
    m.push([cast.over, { ...ON, width: pct ? (pct - 100) * BAR.u : 0, opacity: pct ? 1 : 0 }]);
    m.push([cast.pinTop, { ...ON, x: xEnd }], [cast.pinLine, { ...ON, x1: xEnd, x2: xEnd }]);
    m.push([cast.lblBase, ON], [cast.lblOther, pct ? ON : OFF]);
    if (ghost != null) {
      const gx = BAR.x + Math.min(ghost, 200) * BAR.u;
      cast.ghostTxt.textContent = `${L({ en: "your pick", es: "tu elección" })} ${ghost}%`;
      m.push(
        [cast.ghostLine, { ...ON, x1: gx, x2: gx }],
        [cast.ghostTxt, { ...ON, x: Math.min(W - 70, Math.max(70, gx)) }],
      );
    } else m.push([cast.ghostLine, OFF], [cast.ghostTxt, OFF]);
    for (const n of [...cast.boxes, ...cast.side]) m.push([n, OFF]);
    return m;
  }

  const sentenceHeader = (n, d, x) =>
    L({
      en: `${x} out of every ${n} ${d.noun.en} ${d.did.en}`,
      es: `${x} de cada ${n} ${d.noun.es} ${d.did.es}`,
    });
  const header = (x, y) => sentenceHeader(y, v, x);
  const optsOf = (list, seed, label, cue) =>
    placeNotFirst(
      list.map((x) => ({ ...x, label: label(x), cue: x.correct ? null : cue(x) })),
      seed,
    );

  const scenes = [
    {
      id: "situate",
      label: copy.scene.situate,
      async enter(ctx) {
        L = ctx.L;
        await ctx.tween(groupsView(0, header(a, b)), 0);
        setSide(
          ctx.L({ en: `${a} out of ${b}`, es: `${a} de cada ${b}` }),
          "",
          ctx.L({ en: `${a} shaded`, es: `${a} sombreados` }),
          ctx.L({ en: `${b - a} not shaded`, es: `${b - a} sin sombrear` }),
        );
        const m = groupsView(1, header(a, b));
        for (const s of cast.side) m.push([s, ON]);
        await ctx.tween(m, 500);
        ctx.expr(`${hi(String(a))} : ${lo(String(b))}`);
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
        const sideNow = () =>
          setSide(ctx.L({ en: `${a} out of ${b}`, es: `${a} de cada ${b}` }), "= ?", "", "");
        sideNow();
        const solved = !!saved.solved;
        const m = groupsView(solved ? k : 1, header(a, b));
        m.push([cast.side[0], ON], [cast.side[1], ON]);
        await ctx.tween(m, 300);
        ctx.expr(`${hi(String(a))} : ${lo(String(b))} = ? : 100`);
        ctx.say(copy.predict.say);
        const options = optsOf(
          scaleChoices(a, b),
          a + b,
          (x) => ctx.L({ en: `${x.n} out of 100`, es: `${x.n} de cada 100` }),
          (x) => ctx.L(copy.predict.cue(x.kind, x.n)),
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.predict.question,
            options,
            restore: solved ? options.findIndex((x) => x.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(groupsView(k, header(a, b)), 700);
              setSide(
                ctx.L({ en: `${a} out of ${b}`, es: `${a} de cada ${b}` }),
                `= ${p} / 100`,
                "",
                "",
              );
              ctx.expr(`${a} × ${k} : ${b} × ${k} = ${hi(String(p))} : ${lo("100")}`);
              ctx.feedback(copy.predict.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "build",
      label: copy.scene.build,
      gate: true,
      async enter(ctx) {
        L = ctx.L;
        const st = ctx.state;
        const n0 = okInt(st.n, 1, k) ? st.n : 1;
        const paint = async (n, ms) => {
          st.n = n;
          ctx.save();
          setSide(L(copy.side.group(n)), "", "", "");
          const m = groupsView(n, header(a, b));
          m.push([cast.side[0], ON]);
          await ctx.tween(m, ms);
          ctx.expr(`${a} × ${n} : ${b} × ${n} = ${hi(String(a * n))} : ${lo(String(b * n))}`);
          if (n === k) {
            st.reached = true;
            ctx.save();
            ctx.feedback(copy.build.done);
            ctx.unlock();
          } else ctx.feedback(copy.build.more, "cue");
        };
        ctx.say(copy.build.say);
        ctx.panel.appendChild(
          ctx.range({
            label: copy.build.label,
            min: 1,
            max: k,
            value: n0,
            onInput: (n) => paint(n, 250),
          }),
        );
        await paint(st.reached ? k : n0, 400);
      },
    },
    {
      id: "percent",
      label: copy.scene.percent,
      async enter(ctx) {
        L = ctx.L;
        const st = ctx.state;
        const sorted = st.sorted !== false;
        const show = async (asSorted, ms) => {
          st.sorted = asSorted;
          ctx.save();
          const hd = header(p, 100);
          setSide(
            L(copy.side.pct),
            `= ${p}%`,
            `= ${copy.percent.chain.split(" = ").slice(0, 2).join(" = ")}`,
            L(copy.side.eachCell),
          );
          const m = asSorted ? sortedView(hd) : groupsView(k, hd);
          for (const s of cast.side) m.push([s, ON]);
          await ctx.tween(m, ms);
          toggle.textContent = L(
            asSorted
              ? { en: "Put the squares back in groups", es: "Devuelve los cuadros a los grupos" }
              : { en: "Slide the shaded squares together", es: "Junta los cuadros sombreados" },
          );
        };
        const toggle = ctx.button({
          label: { en: "Put the squares back in groups", es: "Devuelve los cuadros a los grupos" },
          onClick: () => show(!st.sorted, 800),
        });
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.appendChild(toggle);
        ctx.panel.appendChild(row);
        ctx.expr(`${hi(copy.percent.chain)}`);
        ctx.say(copy.percent.say);
        ctx.feedback(copy.percent.note);
        await show(sorted, 700);
      },
    },
    {
      id: "over",
      label: copy.scene.over,
      gate: true,
      async enter(ctx, saved) {
        L = ctx.L;
        const solved = !!saved.solved;
        await ctx.tween(barView(solved ? o.pct : 0), 600);
        ctx.expr(solved ? `${hi(`${o.pct}%`)}` : `${hi("?")}`);
        ctx.say(copy.over.say);
        const options = optsOf(
          overChoices(o.whole, o.amount),
          o.whole + o.amount,
          (x) => `${x.n}%`,
          (x) => ctx.L(copy.over.cue(x.kind, x.n)),
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.over.question,
            options,
            restore: solved ? options.findIndex((x) => x.correct) : null,
            onMiss: async (_i, opt) => {
              await ctx.tween(barView(0, opt.n), 350);
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(barView(o.pct), 800);
              ctx.expr(`${hi(`${o.pct}%`)}`);
              ctx.feedback(copy.over.ok);
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
        const hd = sentenceHeader(t.b, t, t.a);
        setSide(
          ctx.L({ en: `${t.a} out of ${t.b}`, es: `${t.a} de cada ${t.b}` }),
          solved ? `= ${t.p}%` : "= ?",
          "",
          "",
        );
        const m = plainView(t.p, hd);
        m.push([cast.side[0], ON], [cast.side[1], ON]);
        await ctx.tween(m, 600);
        ctx.expr(`${hi(`${t.a}`)} : ${lo(`${t.b}`)} = ${solved ? hi(`${t.p}%`) : "?"}`);
        ctx.say(copy.transfer.say);
        const options = optsOf(
          fdChoices(t.p),
          t.a + t.b,
          (x) => `${fmtHundredths(x.h)}%`,
          (x) => ctx.L(copy.transfer.cue(x.kind, x.h)),
        );
        ctx.panel.append(
          ctx.choices({
            question: copy.transfer.question,
            options,
            restore: solved ? options.findIndex((x) => x.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.save();
              cast.side[1].textContent = `= ${t.p}%`;
              ctx.expr(`${hi(`${t.a}`)} : ${lo(`${t.b}`)} = ${hi(`${t.p}%`)}`);
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
