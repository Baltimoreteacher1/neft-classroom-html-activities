// living/balance-solve.js — a balance scale that teaches equations (8-2, 8-3,
// 8-7): the SAME inverse operation on BOTH sides keeps the scale level.
//
// One cast for the whole play: a beam, two pans and a pool of tape pieces. The
// pieces ARE the equation (the unknown is amber, known amounts are teal), they
// are what the student acts on in scene 3 (the student chooses the move and both
// pans change; a one-sided move tips the beam), and in scene 4 the same steps
// fade into a ladder of symbols. The transfer scene uses a second equation
// (8-2/8-3) or a story with a limit (8-7), where the scale tips and stays tipped.
//
// Config: { mode: "inverse"|"model", form: add|sub|mul|div, a, b, letter, story,
//           transfer, reason (model), prefix }. See balance-solve-model.js.
// Anything the stage cannot draw correctly makes the play refuse to draw.
// The stage is exported (createBalanceStage) for balance-test.js (8-1).

import { escHtml } from "../../core/living-scene.js";
import {
  balanceCopy,
  contrastChoices,
  eqText,
  modelChoices,
  oneSidePans,
  opChoices,
  PAN_PX,
  POOL,
  pan,
  resultChoices,
  scaleFor,
  stages,
  stepText,
  tiltFor,
  validateBalanceSolve,
} from "./balance-solve-model.js";

export { validateBalanceSolve };

export const W = 480;
export const H = 376; // with the symbol ladder
export const HS = 232; // without it
const PIV_Y = 92;
const BEAM_HALF = 214;
const HANG = 70;
const PH = 34; // piece height
const CX = { L: 124, R: 356 };
const PAN_W = 188;
const LADDER_Y = 250;
const LADDER_STEP = 26;
const LADDER_N = 5;

const LOOK = {
  x: { fill: "var(--lsx-u)", stroke: "var(--lsx-u-edge)", dash: "none" },
  k: { fill: "var(--lsx-ok-bg)", stroke: "var(--lsx-x-edge)", dash: "none" },
  ghost: { fill: "var(--lsx-card)", stroke: "var(--lsx-muted)", dash: "6 4" },
};

/** The scale: build once with setup(ctx), repaint with view(ctx, state, ms). */
export function createBalanceStage() {
  let c = null;
  const empty = { L: pan([]), R: pan([]), top: { L: "", R: "" } };

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    svg.setAttribute("viewBox", `0 0 ${W} ${HS}`);
    const g = svgEl("g", {}, svg);
    const line = (attrs) =>
      svgEl("line", { stroke: "var(--lsx-ink)", "stroke-linecap": "round", ...attrs }, g);
    svgEl(
      "polygon",
      {
        points: `214,215 240,${PIV_Y} 266,215`,
        fill: "none",
        stroke: "var(--lsx-rule-strong)",
        "stroke-width": 4,
        "stroke-linejoin": "round",
      },
      g,
    );
    line({ x1: 200, x2: 280, y1: 215, y2: 215, "stroke-width": 5 });
    const beam = line({ x1: 26, x2: 454, y1: PIV_Y, y2: PIV_Y, "stroke-width": 6 });
    const pans = {};
    for (const side of ["L", "R"]) {
      const cx = CX[side];
      pans[side] = {
        strings: [cx - PAN_W / 2 + 8, cx + PAN_W / 2 - 8].map((x) =>
          line({
            x1: x,
            x2: x,
            y1: PIV_Y,
            y2: PIV_Y + HANG,
            stroke: "var(--lsx-muted)",
            "stroke-width": 2,
          }),
        ),
        shelf: line({ x1: cx - PAN_W / 2, x2: cx + PAN_W / 2, y1: 0, y2: 0, "stroke-width": 6 }),
      };
    }
    svgEl("circle", { cx: 240, cy: PIV_Y, r: 8, fill: "var(--lsx-ink)" }, g);
    for (const side of ["L", "R"]) {
      pans[side].pieces = Array.from({ length: POOL }, () => ({
        rect: svgEl(
          "rect",
          { x: 0, y: 0, width: 0, height: PH, rx: 4, "stroke-width": 2.5, opacity: 0 },
          g,
        ),
        label: svgEl(
          "text",
          {
            "text-anchor": "middle",
            "font-size": 16,
            "font-weight": 800,
            fill: "var(--lsx-ink)",
            opacity: 0,
          },
          g,
        ),
      }));
    }
    const text = (attrs) =>
      svgEl(
        "text",
        {
          "text-anchor": "middle",
          "font-weight": 800,
          "font-size": 20,
          fill: "var(--lsx-ink)",
          opacity: 0,
          ...attrs,
        },
        g,
      );
    const top = { L: text({ x: CX.L, y: 32 }), R: text({ x: CX.R, y: 32 }) };
    const sym = text({ x: 240, y: 40, "font-size": 34 });
    const ladder = Array.from({ length: LADDER_N }, (_, i) =>
      text({ x: 240, y: LADDER_Y + i * LADDER_STEP, "font-size": 21 }),
    );
    c = { beam, pans, top, sym, ladder };
  }

  /**
   * Paint the whole scale. o: { scale, L, R (Piece[]), top:{L,R}, sym, tilt,
   * dim, ladder: string[], ladderOn }. Every scene paints through here, so a
   * scene looks the same whether reached by Next, Back, a dot or resume.
   */
  function view(ctx, o, ms = 0) {
    ctx.svg.setAttribute("viewBox", `0 0 ${W} ${o.ladder ? H : HS}`);
    const tilt = o.tilt || 0;
    const by = (x) => PIV_Y + (tilt * (240 - x)) / BEAM_HALF;
    const dim = o.dim ?? 1;
    const m = [[c.beam, { y1: by(26), y2: by(454) }]];
    for (const side of ["L", "R"]) {
      const cx = CX[side];
      const p = c.pans[side];
      const shelfY = by(cx) + HANG;
      for (const s of p.strings) {
        const x = Number(s.getAttribute("x1"));
        m.push([s, { y1: by(x), y2: shelfY }]);
      }
      m.push([p.shelf, { y1: shelfY, y2: shelfY }]);
      let x0 = cx - PAN_W / 2 + 6;
      (o[side] || empty[side]).forEach((piece, i) => {
        const w = Math.max(0, piece.v * (o.scale || 1));
        const look = LOOK[piece.kind] || LOOK.k;
        const y = shelfY - PH - 3 - piece.lift;
        const op = piece.o * dim;
        const slot = p.pieces[i];
        m.push([
          slot.rect,
          {
            x: x0,
            y,
            width: w,
            opacity: op,
            fill: look.fill,
            stroke: look.stroke,
            "stroke-dasharray": look.dash,
          },
        ]);
        m.push([
          slot.label,
          {
            x: x0 + w / 2,
            y: y + PH / 2 + 6,
            opacity: w >= 26 && piece.label ? op : 0,
            "font-size": w < 56 ? 15 : 17,
            text: piece.label,
          },
        ]);
        x0 += w;
      });
    }
    const top = o.top || empty.top;
    m.push([c.top.L, { opacity: top.L ? 1 : 0, text: top.L }]);
    m.push([c.top.R, { opacity: top.R ? 1 : 0, text: top.R }]);
    m.push([c.sym, { opacity: o.sym ? 1 : 0, text: o.sym || "" }]);
    c.ladder.forEach((t, i) => {
      m.push([t, { opacity: i < (o.ladderOn || 0) ? 1 : 0, text: o.ladder?.[i] ?? "" }]);
    });
    return ctx.tween(m, ms);
  }
  return { setup, view };
}

/** The scale as a student predicts and acts on it, for one equation. */
const level = (eq, phase) => ({
  scale: scaleFor(eq),
  ...stages(eq)[phase],
  tilt: 0,
  sym: "=",
});

export function buildBalanceSolvePlay(cfg) {
  const v = validateBalanceSolve(cfg);
  if (!v) return null;
  const T = balanceCopy(v);
  const e = v.eq;
  const stage = createBalanceStage();
  const isModel = v.mode === "model";
  const ex = (s) => ({ en: s, es: s });
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;

  /** Empty scale, then the equation's pans appear. */
  async function appear(ctx, eq, ms) {
    await stage.view(
      ctx,
      {
        scale: scaleFor(eq),
        ...level(eq, "start"),
        L: pan([]),
        R: pan([]),
        top: { L: "", R: "" },
        sym: "",
      },
      0,
    );
    await stage.view(ctx, level(eq, "start"), ms);
  }

  /**
   * "Which move gets the letter alone?" — a choice that acts on the scale: a
   * wrong move shows its own cue (one-sided moves tip the beam), the right
   * move runs on BOTH pans.
   */
  function moveChoice(ctx, eq, saved, after) {
    const st = ctx.state;
    const options = opChoices(eq);
    return ctx.choices({
      question: T.opQ(eq),
      options,
      restore: saved.solved ? options.findIndex((o) => o.correct) : null,
      onMiss: async (_i, opt) => {
        ctx.feedback(opt.cue, "cue");
        if (opt.tilt) {
          const os = oneSidePans(eq);
          await stage.view(
            ctx,
            {
              scale: scaleFor(eq),
              L: os.L,
              R: os.R,
              top: { L: stages(eq).end.top.L, R: stages(eq).start.top.R },
              sym: "≠",
              tilt: tiltFor(os.diff),
            },
            400,
          );
        } else await stage.view(ctx, level(eq, "start"), 300);
      },
      onCorrect: async () => {
        st.solved = true;
        ctx.save();
        ctx.expr(escHtml(stepText(eq)));
        ctx.feedback(T.opOk(eq));
        ctx.unlock();
        await stage.view(ctx, level(eq, "mid"), 600);
        await stage.view(ctx, level(eq, "end"), 700);
        await after?.();
      },
    });
  }

  /** A scene that offers the move on equation `eq`. */
  async function moveScene(ctx, eq, saved, say, after) {
    ctx.say(say);
    ctx.expr(escHtml(eqText(eq)));
    if (saved.solved) {
      ctx.expr(escHtml(stepText(eq)));
      ctx.feedback(T.opOk(eq));
      await stage.view(ctx, level(eq, "end"), 0);
    } else await appear(ctx, eq, 300);
    ctx.panel.appendChild(moveChoice(ctx, eq, saved, after));
  }

  /** The model fades; the same steps appear as a ladder of symbols. */
  async function symbolsScene(ctx, eq, say, extra) {
    const lines = T.ladder(eq);
    if (say) ctx.say(say);
    ctx.expr(`${escHtml(eqText(eq))} → ${hi(`${eq.L} = ${eq.x}`)}`);
    await stage.view(ctx, { ...level(eq, "end"), dim: 0.3, ladder: lines, ladderOn: 0 }, 0);
    for (let k = 1; k <= lines.length; k++)
      await stage.view(ctx, { ...level(eq, "end"), dim: 0.3, ladder: lines, ladderOn: k }, 380);
    if (extra) ctx.feedback(extra);
  }

  const explain = (ctx) =>
    ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));

  const resultOptions = () => resultChoices(e).map((o) => ({ ...o, label: ex(o.text) }));
  const textOptions = (opts) => opts.map((o) => ({ ...o, label: ex(o.text) }));

  const scenes = [
    {
      id: "situate",
      label: T.labels[0],
      async enter(ctx) {
        ctx.expr(escHtml(eqText(e)));
        ctx.say(T.situateSay);
        await appear(ctx, e, 700);
      },
    },
    isModel
      ? {
          id: "write",
          label: T.labels[1],
          gate: true,
          async enter(ctx, saved) {
            ctx.say(T.predictSay);
            await stage.view(ctx, level(e, "start"), 300);
            const options = textOptions(modelChoices(e, v.transfer.sym));
            ctx.panel.appendChild(
              ctx.choices({
                question: T.predictQ,
                options,
                restore: saved.solved ? options.findIndex((o) => o.correct) : null,
                onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
                onCorrect: () => {
                  ctx.state.solved = true;
                  ctx.expr(escHtml(eqText(e)));
                  ctx.feedback(T.predictOk);
                  ctx.unlock();
                },
              }),
            );
            if (saved.solved) ctx.feedback(T.predictOk);
          },
        }
      : {
          id: "predict",
          label: T.labels[1],
          gate: true,
          async enter(ctx, saved) {
            ctx.say(T.predictSay);
            ctx.expr(escHtml(eqText(e)));
            await stage.view(ctx, level(e, "start"), 300);
            const options = resultOptions();
            ctx.panel.appendChild(
              ctx.choices({
                question: T.predictResultQ,
                options,
                restore: saved.solved ? options.findIndex((o) => o.correct) : null,
                onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
                onCorrect: () => {
                  ctx.state.solved = true;
                  ctx.feedback(T.predictResultOk);
                  ctx.unlock();
                },
              }),
            );
            if (saved.solved) ctx.feedback(T.predictResultOk);
          },
        },
    {
      id: "move",
      label: T.labels[2],
      gate: true,
      enter: (ctx, saved) => moveScene(ctx, e, saved, T.opSay),
    },
    {
      id: isModel ? "check" : "symbols",
      label: T.labels[3],
      enter: (ctx) => symbolsScene(ctx, e, T.connectSay),
    },
    isModel
      ? {
          id: "transfer",
          label: T.labels[4],
          async enter(ctx, saved) {
            const c = v.transfer;
            const diff = c.example - c.limit;
            const scale = PAN_PX / Math.max(c.example, c.limit);
            const piece = (val, label, kind) => pan([{ v: val, label, kind, o: 1, lift: 0 }]);
            const tipped = {
              scale,
              L: piece(c.example, c.L, "x"),
              R: piece(c.limit, String(c.limit), "k"),
              top: { L: `${c.L} = ${c.example}`, R: String(c.limit) },
              sym: diff < 0 ? "<" : ">",
              tilt: tiltFor(diff),
            };
            ctx.say(T.transferSay);
            ctx.expr("");
            await stage.view(ctx, { scale: 1, L: pan([]), R: pan([]) }, 0);
            const options = textOptions(contrastChoices(c));
            ctx.panel.appendChild(
              ctx.choices({
                question: T.transferQ,
                options,
                restore: saved.solved ? options.findIndex((o) => o.correct) : null,
                onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
                onCorrect: async () => {
                  ctx.state.solved = true;
                  ctx.save();
                  ctx.expr(escHtml(`${c.L} ${c.sym} ${c.limit}`));
                  ctx.feedback(T.transferOk);
                  await stage.view(ctx, tipped, 700);
                },
              }),
            );
            if (saved.solved) {
              ctx.expr(escHtml(`${c.L} ${c.sym} ${c.limit}`));
              ctx.feedback(T.transferOk);
              await stage.view(ctx, tipped, 0);
            }
            explain(ctx);
          },
        }
      : {
          id: "transfer",
          label: T.labels[4],
          async enter(ctx, saved) {
            const t = v.transfer.eq;
            const ladder = () => symbolsScene(ctx, t, null, T.opOk(t));
            await moveScene(ctx, t, saved, T.transferSay, ladder);
            if (saved.solved) await ladder();
            explain(ctx);
          },
        },
  ];
  return {
    kicker: T.kicker,
    title: T.title,
    viewBox: `0 0 ${W} ${HS}`,
    ariaLabel: T.ariaLabel,
    printSummary: T.printSummary,
    setup: stage.setup,
    scenes,
  };
}
