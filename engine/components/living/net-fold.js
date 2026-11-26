// living/net-fold.js — a flat net folds into the box it came from.
//
// One cast for the whole play: six face polygons that keep their names while
// they move. In scene 1 they lie flat as a net; the student predicts which face
// ends up across from Top (scene 2), folds the net with a slider (scene 3: a
// true rotation about every hinge, drawn as an orthographic view, so a face
// the viewer cannot see is dashed rather than faked), unfolds it again and adds
// the six areas one matching pair at a time (scene 4), then meets a smaller box
// (scene 5) whose faces are the same polygons at new measurements.
//
// Config: { l, w, h, unit, transfer: { l, w, h } } — the lesson's own box
// (5-6 authors the 8 × 5 × 3 in box and the 4 × 3 × 2 in box). The three edges
// must differ (so matching pairs are really pairs) and the surface-area choice
// set must have four distinct values; otherwise the play refuses to draw.

import { escHtml } from "../../core/living-scene.js";
import {
  boxChoices,
  boxPairs,
  fitView,
  lerp,
  netFoldCopy,
  placeCorrect,
  rectPrism,
  validateNetFold,
} from "./net-fold-model.js";
import { createNetStage } from "./net-fold-stage.js";

export { validateNetFold };

const W = 480;
const H = 270;
const STEPS = 10; // slider steps from flat (0) to closed (STEPS)
const HI = { stroke: "var(--lsx-hi)", sw: 4 };
const LO = { stroke: "var(--lsx-lo)", sw: 4, dash: "7 5" };

export function buildNetFoldPlay(cfg) {
  const v = validateNetFold(cfg);
  if (!v) return null;
  const T = netFoldCopy(v);
  const main = { l: v.l, w: v.w, h: v.h };
  const tr = v.transfer;
  const solidOf = (d) => rectPrism(d.l, d.w, d.h);
  let stage = null;
  let fitTr = null;
  let lastT = 0;
  let lastDims = main;
  let lastMix = 0;
  let tok = 0; // a scene that is left stops drawing

  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const sizeText = (d) => `${d.l} × ${d.w} × ${d.h} ${v.unit.len.en}`;

  /** The view of a box d at fold t. `l2`: "dims" | "area" | "none"; `style`: per-face overrides. */
  function viewOf(ctx, d, t, l2 = "dims", style = {}, areaIds = null, mix = 0) {
    const solid = solidOf(d);
    const faces = {};
    for (const f of solid.faces) {
      const showArea = l2 === "area" && (!areaIds || areaIds.has(f.id));
      const l2Text =
        l2 === "none" ? "" : showArea ? String(f.area) : l2 === "dims" ? f.dims.join(" × ") : "";
      faces[f.id] = { l1: ctx.L(f.name), l2: l2Text, ...style[f.id] };
    }
    const a = stage.fit.at(t);
    const b = fitTr.at(t);
    const fit = { k: lerp(a.k, b.k, mix), ox: lerp(a.ox, b.ox, mix), oy: lerp(a.oy, b.oy, mix) };
    return { solid, t, faces, fit };
  }

  const draw = (ctx, d, t, l2, style, areaIds, mix = 0) => {
    stage.cancel();
    lastT = t;
    lastDims = d;
    lastMix = mix;
    stage.draw(viewOf(ctx, d, t, l2, style, areaIds, mix));
  };

  async function foldTo(ctx, d, t1, ms, l2 = "none", style = {}) {
    const t0 = lastT;
    lastMix = 0;
    lastT = t1;
    lastDims = d;
    await stage.run(ctx, (u) => viewOf(ctx, d, lerp(t0, t1, u), l2, style, null, lastMix), ms);
  }

  const options = (kinds, seed) =>
    placeCorrect(
      kinds.map((k) => ({ ...k })),
      seed,
    );

  function setup(ctx) {
    stage = createNetStage(ctx, { W, H, pad: 16, solids: [solidOf(main)] });
    fitTr = fitView([solidOf(tr)], W, H, 16);
  }

  const scenes = [
    {
      id: "net",
      label: T.scene.net,
      async enter(ctx) {
        tok++;
        stage.onFace = null;
        ctx.say(T.netSay);
        ctx.expr(escHtml(sizeText(main)));
        await foldTo(ctx, main, 0, 500, "dims");
        draw(ctx, main, 0, "dims");
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        tok++;
        stage.onFace = null;
        draw(ctx, main, 0, "dims", { top: HI });
        ctx.expr(escHtml(sizeText(main)));
        ctx.say(T.predictSay);
        const opts = options(
          [{ id: "bottom", correct: true }, { id: "front" }, { id: "left" }, { id: "back" }].map(
            (o) => ({
              ...o,
              label: solidOf(main).byId[o.id].name,
              cue: o.correct ? null : T.faceCue(o.id),
            }),
          ),
          v.l + v.w + v.h,
        );
        const solved = saved.solved ? opts.findIndex((o) => o.correct) : null;
        if (saved.solved) draw(ctx, main, 0, "dims", { top: HI, bottom: HI });
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options: opts,
            restore: solved,
            onMiss: (_i, opt) => {
              ctx.feedback(opt.cue, "cue");
              draw(ctx, main, 0, "dims", { top: HI, [opt.id]: LO });
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              draw(ctx, main, 0, "dims", { top: HI, bottom: HI });
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "fold",
      label: T.scene.fold,
      gate: true,
      async enter(ctx) {
        tok++;
        stage.onFace = null;
        const st = ctx.state;
        const saved = Number.isInteger(st.v) && st.v >= 0 && st.v <= STEPS ? st.v : 0;
        ctx.say(T.foldSay);
        ctx.expr("");
        draw(ctx, main, saved / STEPS, "none");
        const rng = ctx.range({
          label: T.foldLabel,
          min: 0,
          max: STEPS,
          value: saved,
          onInput() {},
        });
        const input = /** @type {HTMLInputElement} */ (rng.querySelector("input"));
        const out = /** @type {HTMLOutputElement} */ (rng.querySelector("output"));
        const label = (n) => `${n * STEPS}%`;
        out.textContent = label(saved / STEPS);
        const toggle = ctx.button({ label: T.foldAuto, primary: true, onClick: () => auto() });
        const finish = (n) => {
          if (n === STEPS) {
            st.v = STEPS;
            ctx.save();
            ctx.feedback(T.foldDone);
            ctx.unlock();
          } else {
            st.v = n;
            ctx.save();
          }
          toggle.textContent = ctx.L(n === STEPS ? T.unfold : T.foldAuto);
        };
        const set = (n) => {
          input.value = String(n);
          out.textContent = label(n);
        };
        input.addEventListener("input", () => {
          const n = Number(input.value);
          out.textContent = label(n);
          draw(ctx, main, n / STEPS, "none");
          finish(n);
        });
        const auto = async () => {
          const my = tok;
          const to = lastT >= 1 ? 0 : 1;
          await foldTo(ctx, main, to, 1500);
          if (my !== tok) return;
          set(to * STEPS);
          finish(to * STEPS);
        };
        ctx.panel.append(rng, toggle);
        if (saved === STEPS) {
          toggle.textContent = ctx.L(T.unfold);
          ctx.feedback(T.foldDone);
        }
      },
    },
    {
      id: "areas",
      label: T.scene.areas,
      async enter(ctx) {
        tok++;
        const my = tok;
        stage.onFace = null;
        const st = ctx.state;
        const pairs = boxPairs(main.l, main.w, main.h);
        const n0 = Number.isInteger(st.n) && st.n >= 0 && st.n <= 3 ? st.n : 0;
        const paint = (n) => {
          const ids = new Set(pairs.slice(0, n).flatMap((p) => p.ids));
          const style = Object.fromEntries([...ids].map((id) => [id, HI]));
          draw(ctx, main, 0, "area", style, ids);
          const shown = pairs.slice(0, n);
          const total = shown.reduce((s, p) => s + 2 * p.area, 0);
          ctx.expr(
            n === 0
              ? escHtml(sizeText(main))
              : n < 3
                ? `${escHtml(shown.map((p) => `${p.area} + ${p.area}`).join(" + "))} = ${hi(String(total))}`
                : `${escHtml(ctx.L(T.areasExpr))}`,
          );
          if (n === 0) ctx.say(T.areasSay);
          else if (n < 3) ctx.say(T.pairLine(n - 1));
          else ctx.feedback(T.areasDone);
        };
        await foldTo(ctx, main, 0, 700, "none");
        paint(n0);
        const btn = ctx.button({
          label: n0 >= 3 ? T.allPairs : T.nextPair,
          primary: true,
          onClick: () => {
            if (st.n >= 3) return;
            st.n = (st.n || 0) + 1;
            ctx.save();
            paint(st.n);
            if (st.n >= 3) {
              btn.disabled = true;
              btn.textContent = ctx.L(T.allPairs);
            }
          },
        });
        btn.disabled = n0 >= 3;
        if (my === tok) ctx.panel.appendChild(btn);
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        tok++;
        const my = tok;
        stage.onFace = null;
        ctx.say(T.transferSay);
        ctx.expr(escHtml(sizeText(tr)));
        const d0 = lastDims;
        const t0 = lastT;
        const blend = (u) => ({
          l: lerp(d0.l, tr.l, u),
          w: lerp(d0.w, tr.w, u),
          h: lerp(d0.h, tr.h, u),
        });
        await stage.run(
          ctx,
          (u) => viewOf(ctx, blend(u), lerp(t0, 0, u), "none", {}, null, lerp(lastMix, 1, u)),
          800,
        );
        if (my !== tok) return;
        const showAll = (areas) => {
          const ids = areas ? new Set(solidOf(tr).faces.map((f) => f.id)) : null;
          draw(ctx, tr, 0, areas ? "area" : "dims", {}, ids, 1);
        };
        showAll(!!saved.solved);
        if (saved.solved) {
          ctx.expr(
            escHtml(`${T.transferExpr} = ${T.sq(boxChoices(tr.l, tr.w, tr.h)[0].value, ctx.lang)}`),
          );
        }
        const opts = options(
          boxChoices(tr.l, tr.w, tr.h).map((c) => ({
            ...c,
            label: String(c.value),
            cue: c.correct ? null : T.miss(c.kind, c.value),
          })),
          tr.l * 7 + tr.w + tr.h,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options: opts,
            restore: saved.solved ? opts.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              showAll(true);
              ctx.expr(
                escHtml(
                  `${T.transferExpr} = ${T.sq(boxChoices(tr.l, tr.w, tr.h)[0].value, ctx.lang)}`,
                ),
              );
            },
          }),
        );
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
