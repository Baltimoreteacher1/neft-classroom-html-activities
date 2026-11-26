// living/property-shift.js — move the same tiles, keep the same total.
//
// One cast for the whole play: three groups of tiles (3 guitar, 5 drums, 2 keys
// in 6-8), each a framed row. The groups trade places (the commutative
// property), get a pair of parentheses (the associative property) and join a
// group of nothing (identity) — and because the tiles only ever MOVE, the
// student sees that nothing was added or removed, so the total cannot change.
// Scene 5 runs the same move on subtraction, where the tiles run out: the
// order matters there.
//
// Config: { groups:[{n, label, short}, ×3], noun, nounOne, sub:{a,b}, divide:{a,b},
//           identity, commute:{a,b}, regroup:{a,b,c}, weDo:{a,b}, story }
// — the lesson's own numbers (6-8 authors 3 + 5 + 2, 9 − 6, 47 + 0 = 47, 5 + 13,
// (6 × 3) × 2, and 6 + 9 = 9 + 6).

import { escHtml } from "../../core/living-scene.js";
import {
  arrangementKey,
  exprFor,
  identityChoices,
  isSwapped,
  placeCorrect,
  propertyCopy,
  subtotal,
  swapSide,
  validatePropertyShift,
} from "./property-shift-model.js";

export { validatePropertyShift };

const W = 480;
const H = 252;
const SLOT = 124;
const SX = 10;
const T = 20; // a tile
const PITCH = 22;
const FRAME_Y = 70;
const TILE_Y = 84;
const SUB_PITCH = 26;
const SUB_MAX = 12;
const slotCx = (p) => SX + p * SLOT + SLOT / 2;
const ZERO_CX = SX + 3 * SLOT + 40;

const LOOK = [
  { fill: "var(--lsx-x)", stroke: "var(--lsx-x-edge)", ink: "var(--lsx-on-x)" },
  { fill: "var(--lsx-u)", stroke: "var(--lsx-u-edge)", ink: "var(--lsx-ink)" },
  { fill: "var(--lsx-card)", stroke: "var(--lsx-ink)", ink: "var(--lsx-ink)" },
];

export function buildPropertyShiftPlay(cfg) {
  const v = validatePropertyShift(cfg);
  if (!v) return null;
  const { counts, names, noun, total, sub } = v;
  const T_ = propertyCopy(v);
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;
  const START = [0, 1, 2];
  let c = null; // the cast

  const frameBox = (i, p) => {
    const w = counts[i] * PITCH + 10;
    return { x: slotCx(p) - w / 2, width: w };
  };
  const tileX = (i, p, j) => slotCx(p) - (counts[i] * PITCH - (PITCH - T)) / 2 + j * PITCH;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs) => svgEl(tag, { opacity: 0, ...attrs }, g);
    const text = (attrs) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 16,
        "font-weight": 800,
        fill: "var(--lsx-ink)",
        text: "",
        ...attrs,
      });
    const bracket = (color) => ({
      path: el("path", { d: "M0 0", fill: "none", stroke: color, "stroke-width": 3 }),
      txt: text({ "font-size": 22, fill: color }),
    });
    c = {
      groups: counts.map((n, i) => ({
        frame: el("rect", {
          x: 0,
          y: FRAME_Y,
          width: n * PITCH + 10,
          height: 48,
          rx: 10,
          fill: "var(--lsx-paper)",
          stroke: "var(--lsx-muted)",
          "stroke-width": 2,
          "stroke-dasharray": "6 4",
        }),
        tiles: Array.from({ length: n }, () =>
          el("rect", {
            x: 0,
            y: TILE_Y,
            width: T,
            height: T,
            rx: 4,
            fill: LOOK[i].fill,
            stroke: LOOK[i].stroke,
            "stroke-width": 2,
          }),
        ),
        count: text({ y: 144, "font-size": 24, text: String(n) }),
        name: text({ y: 164, fill: "var(--lsx-muted)", text: ctx.L(names[i].short ?? names[i]) }),
      })),
      zero: {
        frame: el("rect", {
          x: ZERO_CX - 26,
          y: FRAME_Y,
          width: 52,
          height: 48,
          rx: 10,
          fill: "none",
          stroke: "var(--lsx-muted)",
          "stroke-width": 2,
          "stroke-dasharray": "3 5",
        }),
        txt: text({ x: ZERO_CX, y: 144, "font-size": 24, text: "0" }),
      },
      top: bracket("var(--lsx-hi)"),
      bottom: bracket("var(--lsx-lo)"),
      totLine: el("path", {
        d: `M24 214 H${W - 24}`,
        fill: "none",
        stroke: "var(--lsx-ink)",
        "stroke-width": 2,
      }),
      tot: text({ x: W / 2, y: 240, "font-size": 20 }),
      subA: Array.from({ length: SUB_MAX }, () =>
        el("rect", { x: 0, y: 68, width: T, height: T, rx: 4, ...tileLook() }),
      ),
      subB: Array.from({ length: SUB_MAX }, () =>
        el("rect", { x: 0, y: 150, width: T, height: T, rx: 4, ...tileLook() }),
      ),
      subLblA: text({ x: 24, y: 116, "text-anchor": "start" }),
      subLblB: text({ x: 24, y: 198, "text-anchor": "start" }),
    };
    function tileLook() {
      return {
        fill: LOOK[0].fill,
        stroke: LOOK[0].stroke,
        "stroke-width": 2,
      };
    }
  }

  const bracketPath = (which) => {
    const from = which === "first" ? 0 : 1;
    const x1 = SX + from * SLOT + 8;
    const x2 = SX + (from + 2) * SLOT - 8;
    return which === "first"
      ? { d: `M${x1} 56 V48 H${x2} V56`, x: (x1 + x2) / 2, y: 38 }
      : { d: `M${x1} 174 V182 H${x2} V174`, x: (x1 + x2) / 2, y: 206 };
  };

  /**
   * Put the whole stage in one state; every scene calls this.
   * o: { mode: "groups"|"sub"|"none", order, grouping, both (draw both brackets),
   *      total (text|null), zero }
   */
  function view(ctx, o, ms) {
    const on = (x) => ({ opacity: x ? 1 : 0 });
    const order = o.order ?? START;
    const groups = o.mode === "groups";
    const mv = [];
    counts.forEach((_n, i) => {
      const p = order.indexOf(i);
      const fb = frameBox(i, p);
      const gr = c.groups[i];
      mv.push([gr.frame, { ...fb, ...on(groups) }]);
      gr.tiles.forEach((t, j) => mv.push([t, { x: tileX(i, p, j), ...on(groups) }]));
      mv.push(
        [gr.count, { x: slotCx(p), ...on(groups) }],
        [gr.name, { x: slotCx(p), ...on(groups) }],
      );
    });
    mv.push([c.zero.frame, on(groups && o.zero)], [c.zero.txt, on(groups && o.zero)]);
    for (const [key, which] of [
      ["top", "first"],
      ["bottom", "last"],
    ]) {
      const show = groups && (o.both || o.grouping === which);
      const br = bracketPath(which);
      const sum = subtotal(counts, order, which);
      mv.push([c[key].path, { ...on(show), d: br.d }]);
      mv.push([
        c[key].txt,
        { ...on(show), x: br.x, y: br.y, text: sum == null ? "" : String(sum) },
      ]);
    }
    mv.push([c.totLine, on(o.total != null && o.mode !== "sub" && o.mode !== "none")]);
    mv.push([
      c.tot,
      { ...on(o.total != null && o.mode !== "sub" && o.mode !== "none"), text: o.total ?? "" },
    ]);
    const sb = o.mode === "sub";
    c.subA.forEach((t, j) => {
      const taken = j >= sub.a - sub.b;
      mv.push([
        t,
        {
          x: 24 + j * SUB_PITCH,
          ...on(sb && j < sub.a),
          "fill-opacity": sb && o.take && taken ? 0.25 : 1,
          "stroke-dasharray": sb && o.take && taken ? "3 3" : "none",
        },
      ]);
    });
    c.subB.forEach((t, j) => {
      const ghost = j >= sub.b;
      mv.push([
        t,
        {
          x: 24 + j * SUB_PITCH,
          ...on(sb && o.cant && j < sub.a),
          "fill-opacity": ghost ? 0 : 1,
          "stroke-dasharray": ghost ? "3 3" : "none",
        },
      ]);
    });
    mv.push([c.subLblA, { ...on(sb), text: ctx.L(T_.rowTakeLabel) }]);
    mv.push([c.subLblB, { ...on(sb && o.cant), text: ctx.L(T_.rowCant) }]);
    return ctx.tween(mv, ms);
  }

  const totalText = (ctx, extra = "") => `${total}${extra} ${ctx.L(noun)}`;
  const exprHtml = (order, grouping) => escHtml(`${exprFor(counts, order, grouping)} = ${total}`);

  const scenes = [
    {
      id: "situate",
      label: T_.scene.situate,
      async enter(ctx) {
        ctx.expr(exprHtml(START, "none"));
        ctx.say(T_.situateSay);
        await view(ctx, { mode: "groups", order: START, total: totalText(ctx) }, 400);
      },
    },
    {
      id: "predict",
      label: T_.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        const swapped = [1, 0, 2];
        ctx.say(T_.predictSay);
        ctx.expr(escHtml(`${exprFor(counts, swapped, "none")} = ?`));
        const solved = !!saved.solved;
        await view(
          ctx,
          {
            mode: "groups",
            order: solved ? swapped : START,
            total: solved ? totalText(ctx) : `? ${ctx.L(noun)}`,
          },
          0,
        );
        const options = placeCorrect(
          T_.predictOpts.map((o) => ({ ...o, correct: o.kind === "same", label: o.label })),
          2,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T_.predictQ,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              ctx.feedback(T_.predictCue[opt.kind], "cue");
              await view(ctx, { mode: "groups", order: swapped, total: `? ${ctx.L(noun)}` }, 500);
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T_.predictOk);
              ctx.unlock();
              await view(ctx, { mode: "groups", order: swapped, total: totalText(ctx) }, 500);
            },
          }),
        );
      },
    },
    {
      id: "shift",
      label: T_.scene.shift,
      gate: true,
      async enter(ctx, saved) {
        const st = ctx.state;
        let order = Array.isArray(saved.order) && saved.order.length === 3 ? saved.order : START;
        if (![...order].sort().every((x, i) => x === i)) order = START;
        let grouping = ["none", "first", "last"].includes(saved.grouping) ? saved.grouping : "none";
        st.keys = Array.isArray(saved.keys) ? saved.keys.filter((k) => typeof k === "string") : [];
        st.swapped = !!saved.swapped;
        st.grouped = !!saved.grouped;
        const paint = (ms) => {
          const sum = subtotal(counts, order, grouping);
          ctx.expr(exprHtml(order, grouping));
          return view(ctx, { mode: "groups", order, grouping, total: totalText(ctx) }, ms).then(
            () => sum,
          );
        };
        const progress = () => {
          if (st.swapped && st.grouped && st.keys.length >= 3) {
            ctx.feedback(T_.shiftDone);
            ctx.unlock();
          } else if (!st.swapped) ctx.feedback(T_.needSwap, "cue");
          else if (!st.grouped) ctx.feedback(T_.needGroup, "cue");
          else ctx.feedback(T_.needMore, "cue");
        };
        const move = async (next) => {
          order = next.order ?? order;
          grouping = next.grouping ?? grouping;
          st.order = order;
          st.grouping = grouping;
          if (isSwapped(order)) st.swapped = true;
          if (grouping !== "none") st.grouped = true;
          const key = arrangementKey(order, grouping);
          if (!st.keys.includes(key)) st.keys.push(key);
          ctx.save();
          const sum = await paint(450);
          ctx.feedback(T_.shiftRow(exprFor(counts, order, grouping), sum));
          progress();
        };
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", ctx.L(T_.scene.shift));
        row.append(
          ctx.button({
            label: T_.btnLeft,
            onClick: () => move({ order: swapSide(order, "left") }),
          }),
          ctx.button({
            label: T_.btnRight,
            onClick: () => move({ order: swapSide(order, "right") }),
          }),
          ctx.button({ label: T_.btnFirst, onClick: () => move({ grouping: "first" }) }),
          ctx.button({ label: T_.btnLast, onClick: () => move({ grouping: "last" }) }),
          ctx.button({ label: T_.btnNone, onClick: () => move({ grouping: "none" }) }),
          ctx.button({
            label: T_.startOver,
            onClick: () => move({ order: START, grouping: "none" }),
          }),
        );
        ctx.panel.appendChild(row);
        ctx.say(T_.shiftSay);
        await paint(400);
        if (st.keys.length) progress();
      },
    },
    {
      id: "connect",
      label: T_.scene.connect,
      async enter(ctx) {
        ctx.say(T_.connectSay);
        ctx.expr(`${hi(T_.connectExprA)}<br>${lo(T_.connectExprB)}`);
        await view(ctx, { mode: "groups", order: START, both: true, total: totalText(ctx) }, 500);
        ctx.feedback(T_.connectDone);
      },
    },
    {
      id: "limits",
      label: T_.scene.limits,
      gate: true,
      async enter(ctx, saved) {
        ctx.say(T_.limitsSay);
        ctx.expr(escHtml(`${sub.a} − ${sub.b} = ${sub.a - sub.b}`));
        const show = (cant, ms) => view(ctx, { mode: "sub", take: true, cant, total: null }, ms);
        await show(!!saved.solved, 0);
        const options = placeCorrect(
          T_.limitsOpts.map((o) => ({ ...o, correct: o.kind === "no" })),
          1,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T_.limitsQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              ctx.feedback(T_.limitsCue[opt.kind], "cue");
              await show(true, 350);
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T_.limitsOk);
              ctx.unlock();
              await show(true, 350);
            },
          }),
        );
      },
    },
    {
      id: "transfer",
      label: T_.scene.transfer,
      async enter(ctx, saved) {
        ctx.say(T_.transferSay);
        ctx.expr(escHtml(`${total} + 0 = ?`));
        const show = (done, ms) =>
          view(
            ctx,
            {
              mode: "groups",
              order: START,
              zero: true,
              total: done ? `${totalText(ctx)} + 0 = ${total}` : totalText(ctx),
            },
            ms,
          );
        await show(!!saved.solved, 0);
        const options = placeCorrect(
          identityChoices(v).map((o) => ({ ...o, label: o.text })),
          total + 1,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T_.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T_.transferCue[opt.kind], "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T_.transferOk);
              ctx.expr(hi(`${total} + 0 = ${total}`));
              await show(true, 400);
            },
          }),
        );
        ctx.panel.appendChild(ctx.frame({ label: T_.explainLabel, frame: T_.explainFrame }));
      },
    },
  ];

  return {
    kicker: T_.kicker,
    title: T_.title,
    viewBox: `0 0 ${W} ${H}`,
    ariaLabel: T_.ariaLabel,
    printSummary: T_.printSummary,
    setup,
    scenes,
  };
}
