// living/percent-fdp.js — one shaded region, three names.
//
// One cast for the whole play: a strip of 100 pieces. At first only d of them
// show (the fraction strip, n shaded); each part is then CUT into k pieces
// until all 100 show; a decimal ruler (0 to 1) and a percent ruler (0% to
// 100%) mark the same spot; and the same pieces re-shade for other fractions.
//
// Config: { n, d, story, transfer:{ n, d } } — the lesson's own numbers (4-2
// authors 3/4 of the points and 1/5). Denominators 2, 4, 5, 10, 20, 25 or 50,
// so every conversion is exact. Every number and sentence comes from
// percent-fdp-model.js (pure, tested).

import { escHtml } from "../../core/living-scene.js";
import {
  choicesFor,
  cut,
  EXPLORE,
  fdpCopy,
  okInt,
  placeNotFirst,
  validatePercentFdp,
} from "./percent-fdp-model.js";
import { fmtHundredths } from "./percent-whole.js";

export { validatePercentFdp };

const W = 480;
const H = 290;
const SX = 40;
const SW = 400;
const SY = 104;
const SH = 44;
const RULER = [0, 25, 50, 75, 100];

const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;

export function buildPercentFdpPlay(cfg) {
  const v = validatePercentFdp(cfg);
  if (!v) return null;
  const { n, d, k, p, transfer: t } = v;
  const copy = fdpCopy(v);
  let cast = null;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
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
      pieces: Array.from({ length: 100 }, () =>
        svgEl("rect", { x: SX, y: SY, width: 0, height: SH, "stroke-width": 1, opacity: 0 }, g),
      ),
      frame: svgEl(
        "rect",
        {
          x: SX,
          y: SY,
          width: SW,
          height: SH,
          fill: "none",
          stroke: "var(--lsx-ink)",
          "stroke-width": 2.5,
          opacity: 0,
        },
        g,
      ),
      header: T({ x: W / 2, y: 28, "font-size": 18 }),
      info: T({ x: W / 2, y: 66, "font-size": 20 }),
      decLbl: RULER.map((r) => T({ x: SX + (r * SW) / 100, y: SY - 14, text: fmtHundredths(r) })),
      decTick: RULER.map((r) =>
        line({ x1: SX + (r * SW) / 100, x2: SX + (r * SW) / 100, y1: SY - 8, y2: SY }),
      ),
      pctLbl: RULER.map((r) => T({ x: SX + (r * SW) / 100, y: SY + SH + 30, text: `${r}%` })),
      pctTick: RULER.map((r) =>
        line({ x1: SX + (r * SW) / 100, x2: SX + (r * SW) / 100, y1: SY + SH, y2: SY + SH + 8 }),
      ),
      marker: line({
        y1: SY - 8,
        y2: SY + SH + 8,
        stroke: "var(--lsx-hi)",
        "stroke-width": 4,
        "stroke-dasharray": "5 3",
      }),
      big: T({ x: W / 2, y: 232, "font-size": 26, "font-weight": 800 }),
      small: T({ x: W / 2, y: 268, "font-size": 30, "font-weight": 800, fill: "var(--lsx-hi)" }),
    };
  }

  const OFF = { opacity: 0 };
  const ON = { opacity: 1 };

  /** `count` pieces across the strip, the first `shaded` of them shaded. */
  function strip(count, shaded) {
    const w = SW / count;
    const fine = count > 25;
    cast.pieces.forEach((c, i) => {
      const on = i < shaded;
      c.setAttribute("fill", on ? "var(--lsx-x)" : "var(--lsx-paper)");
      c.setAttribute(
        "stroke",
        on ? "var(--lsx-x-edge)" : fine ? "var(--lsx-rule-strong)" : "var(--lsx-ink)",
      );
    });
    const m = cast.pieces.map((c, i) => [
      c,
      i < count
        ? { x: SX + i * w, width: w, opacity: 1, "stroke-width": fine ? 0.5 : 1.5 }
        : { x: SX + SW, width: 0, opacity: 0 },
    ]);
    m.push([cast.frame, ON]);
    return m;
  }
  /**
   * Which labelled extras show: info text, rulers+marker at percent `mp`, big/small texts.
   * @param {{ header?: string, info?: string, mp?: number, big?: string, small?: string }} o
   */
  function extras(o) {
    const { header, info, mp, big, small } = o;
    cast.header.textContent = header || "";
    cast.info.textContent = info || "";
    cast.big.textContent = big || "";
    cast.small.textContent = small || "";
    const on = mp != null;
    const xp = SX + ((mp ?? 0) * SW) / 100;
    return [
      [cast.header, header ? ON : OFF],
      [cast.info, info ? ON : OFF],
      ...[...cast.decLbl, ...cast.decTick, ...cast.pctLbl, ...cast.pctTick].map((e) => [
        e,
        on ? ON : OFF,
      ]),
      [cast.marker, on ? { ...ON, x1: xp, x2: xp } : OFF],
      [cast.big, big ? ON : OFF],
      [cast.small, small ? ON : OFF],
    ];
  }

  const exprOf = (f, p2, solved) => `${hi(`${f.n}/${f.d}`)} = ${solved ? hi(`${p2}%`) : hi("?")}`;
  const opts = (f, seed, cue) =>
    placeNotFirst(
      choicesFor(f).map((o) => ({
        ...o,
        label: `${o.p}%`,
        cue: o.correct ? null : cue(o.kind, o.p),
      })),
      seed,
    );

  const scenes = [
    {
      id: "situate",
      label: copy.scene.situate,
      async enter(ctx) {
        await ctx.tween([...strip(d, 0), ...extras({})], 0);
        await ctx.tween(
          [
            ...strip(d, n),
            ...extras({
              header: ctx.L({ en: "The whole strip", es: "Toda la barra" }),
              info: ctx.L(copy.parts(v)),
            }),
          ],
          600,
        );
        ctx.expr(hi(`${n}/${d}`));
        ctx.say(copy.situate.say);
        ctx.feedback(copy.situate.note);
      },
    },
    {
      id: "predict",
      label: copy.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        const solved = !!saved.solved;
        const base = {
          header: ctx.L({ en: "The whole strip", es: "Toda la barra" }),
          info: ctx.L(copy.parts(v)),
        };
        await ctx.tween([...strip(d, n), ...extras(base)], 300);
        ctx.expr(exprOf(v, p, solved));
        ctx.say(copy.predict.say);
        const options = opts(v, n + d, (kind, x) => ctx.L(copy.predict.cue(kind, x)));
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.predict.question,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.expr(exprOf(v, p, true));
              ctx.feedback(copy.predict.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "cut",
      label: copy.scene.cut,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        const j0 = st.reached ? k : okInt(st.j, 1, k) ? st.j : 1;
        const paint = async (j, ms) => {
          st.j = j;
          const c = cut(v, j);
          ctx.save();
          await ctx.tween(
            [
              ...strip(c.parts, c.shaded),
              ...extras({
                header: ctx.L({ en: "The whole strip", es: "Toda la barra" }),
                info: ctx.L(copy.parts(v, j)),
              }),
            ],
            ms,
          );
          ctx.expr(`${hi(`${n}/${d}`)} = ${copy.cut.expr(j)}`);
          if (j === k) {
            st.reached = true;
            ctx.save();
            ctx.feedback(copy.cut.done);
            ctx.unlock();
          } else ctx.feedback(copy.cut.more, "cue");
        };
        ctx.say(copy.cut.say);
        ctx.panel.appendChild(
          ctx.range({
            label: copy.cut.label,
            min: 1,
            max: k,
            value: j0,
            onInput: (j) => paint(j, 250),
          }),
        );
        await paint(j0, 450);
      },
    },
    {
      id: "names",
      label: copy.scene.names,
      async enter(ctx) {
        await ctx.tween(
          [
            ...strip(100, p),
            ...extras({
              header: ctx.L({ en: "The same strip: 100 pieces", es: "La misma barra: 100 piezas" }),
              mp: p,
              big: copy.names.big,
              small: copy.names.small,
            }),
          ],
          700,
        );
        ctx.expr(hi(`${n}/${d} = ${p}/100 = ${v.dec} = ${p}%`));
        ctx.say(copy.names.say);
        ctx.feedback("");
      },
    },
    {
      id: "explore",
      label: copy.scene.explore,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        const start = Math.max(
          0,
          EXPLORE.findIndex(([a, b]) => a === n && b === d),
        );
        st.seen = Array.isArray(st.seen)
          ? st.seen.filter((i) => okInt(i, 0, EXPLORE.length - 1))
          : [];
        const i0 = okInt(st.i, 0, EXPLORE.length - 1) ? st.i : start;
        st.i = i0;
        if (!st.seen.includes(i0)) st.seen.push(i0);
        const apply = async (i, ms) => {
          st.i = i;
          if (!st.seen.includes(i)) st.seen.push(i);
          ctx.save();
          const [a, b] = EXPLORE[i];
          const pp = (a * 100) / b;
          await ctx.tween(
            [
              ...strip(100, pp),
              ...extras({
                header: ctx.L({ en: `${a}/${b} of the strip`, es: `${a}/${b} de la barra` }),
                mp: pp,
                big: `${a}/${b} = ${pp}/100`,
                small: `= ${fmtHundredths(pp)} = ${pp}%`,
              }),
            ],
            ms,
          );
          ctx.expr(hi(copy.explore.chain({ n: a, d: b, p: pp, dec: fmtHundredths(pp) })));
          if (st.seen.length >= 3) {
            ctx.feedback(copy.explore.done);
            ctx.unlock();
          } else ctx.feedback(copy.explore.tryMore, "cue");
        };
        ctx.say(copy.explore.say);
        const rng = ctx.range({
          label: copy.explore.label,
          min: 0,
          max: EXPLORE.length - 1,
          value: i0,
          onInput: (i) => apply(i, 300),
        });
        ctx.panel.appendChild(rng);
        // The slider walks a list, so its readout names the fraction, not the list position.
        const out = rng.querySelector("output");
        const sync = () => {
          const [a, b] = EXPLORE[st.i];
          if (out) out.textContent = `${a}/${b}`;
        };
        rng.querySelector("input")?.addEventListener("input", sync);
        sync();
        await apply(i0, 500);
        sync();
      },
    },
    {
      id: "transfer",
      label: copy.scene.transfer,
      async enter(ctx, saved) {
        const solved = !!saved.solved;
        const head = ctx.L({ en: "A new strip", es: "Una barra nueva" });
        const open = [...strip(t.d, t.n), ...extras({ header: head, info: ctx.L(copy.parts(t)) })];
        const done = [
          ...strip(100, t.p),
          ...extras({
            header: head,
            mp: t.p,
            big: `${t.n}/${t.d} = ${t.p}/100`,
            small: `= ${t.dec} = ${t.p}%`,
          }),
        ];
        await ctx.tween(solved ? done : open, 600);
        ctx.expr(exprOf(t, t.p, solved));
        ctx.say(copy.transfer.say);
        const options = opts(t, t.n + 2 * t.d, (kind, x) => ctx.L(copy.transfer.cue(kind, x)));
        ctx.panel.append(
          ctx.choices({
            question: copy.transfer.question,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(done, 800);
              ctx.expr(exprOf(t, t.p, true));
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
