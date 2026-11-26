// living/two-var.js — one relationship, four views: a table, two cards, a
// graph and an equation, all drawn from the same cast.
//
// One play serves lessons 9-1 to 9-4 through `mode`:
//   variables  independent vs dependent (change one, watch the other respond)
//   graph      table rows slide onto a graph and become points
//   equation   the rule y = kx found from the table, tested on every row
//   apply      the equation and graph answer "how much when…?" / "when is…?"
//
// Config: { mode, main: Sit, transfer: Sit, ...mode extras } — see
// two-var-model.js for the validated shape. Every number the play states is
// computed in the model from k and the row inputs, and the graph is scaled
// from them; a config the stage cannot draw correctly returns null.

import { escHtml } from "../../core/living-scene.js";
import { graphCopy, variablesCopy } from "./two-var-copy.js";
import { applyCopy, equationCopy } from "./two-var-copy-solve.js";
import { H, validateTwoVar, W } from "./two-var-model.js";
import { graphScenes, variablesScenes } from "./two-var-scenes-read.js";
import { applyScenes, equationScenes } from "./two-var-scenes-solve.js";
import { makeCast, place } from "./two-var-stage.js";

export { validateTwoVar };

const hi = (s) => `<span class="lsx-hi">${escHtml(String(s))}</span>`;
const lo = (s) => `<span class="lsx-lo">${escHtml(String(s))}</span>`;

const MODES = {
  variables: { copy: variablesCopy, scenes: variablesScenes, kind: "pair" },
  graph: { copy: graphCopy, scenes: graphScenes, kind: "graph" },
  equation: { copy: equationCopy, scenes: equationScenes, kind: "graph" },
  apply: { copy: applyCopy, scenes: applyScenes, kind: "graph" },
};

/** A labelled group of toggle buttons; aria-pressed follows `pressed()`. */
function buttons(ctx, group, items) {
  const row = document.createElement("div");
  row.className = "lsx-choices";
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", ctx.L(group));
  const paint = () =>
    btns.forEach((b, i) => b.setAttribute("aria-pressed", String(items[i].pressed())));
  const btns = items.map((it) =>
    ctx.button({
      label: it.label,
      onClick: async () => {
        const done = it.onClick();
        paint();
        await done;
      },
    }),
  );
  paint();
  row.append(...btns);
  return row;
}

export function buildTwoVarPlay(cfg) {
  const v = validateTwoVar(cfg);
  if (!v) return null;
  const mode = MODES[v.mode];
  const copy = mode.copy(v);
  /** @type {Record<string, any>} */
  const casts = {};

  /** Moves for one situation's view; the other situation is hidden. */
  const mv = (which, spec) => [
    ...place(casts[which], spec),
    ...place(casts[which === "main" ? "transfer" : "main"], {}),
  ];

  /** A prediction gate: wrong picks show their own cue, never the answer. */
  function choose(ctx, saved, { question, options, ok, miss, win }) {
    ctx.panel.appendChild(
      ctx.choices({
        question,
        options,
        restore: saved.solved ? options.findIndex((o) => o.correct) : null,
        onMiss: async (_i, opt) => {
          ctx.feedback(opt.cue, "cue");
          await miss?.(opt);
        },
        onCorrect: async (i) => {
          ctx.state.solved = true;
          ctx.save();
          ctx.feedback(ok);
          ctx.unlock();
          await win?.(options[i]);
        },
      }),
    );
  }

  const sentenceHtml = (ctx, sit) => `${lo(ctx.L(sit.sentences.right))}`;

  /** True while this scene's panel is on screen: a late tween must not touch the next scene. */
  const live = (ctx) => {
    const mark = document.createElement("span");
    mark.hidden = true;
    ctx.panel.append(mark);
    return () => mark.isConnected;
  };

  const kit = { v, copy, hi, lo, mv, choose, buttons, sentenceHtml, live };

  return {
    kicker: { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" },
    title: copy.title,
    viewBox: `0 0 ${W} ${mode.kind === "pair" ? 300 : H}`,
    ariaLabel: copy.ariaLabel,
    printSummary: copy.printSummary,
    setup(ctx) {
      ctx.svg.innerHTML = "";
      casts.main = makeCast(ctx, v.main, mode.kind);
      casts.transfer = makeCast(ctx, v.transfer, mode.kind);
    },
    scenes: mode.scenes(kit),
  };
}
