// living/surface-area.js — surface area as the sum of every face of a net.
//
// One stage of face polygons (the shared net stage) serves two modes:
//   mode "prism"   — 5-7: a rectangular prism whose opposite faces match
//                    (2lw + 2lh + 2wh), a "what if the height changes" slider,
//                    then a triangular prism (5 faces, triangles use ½bh).
//   mode "pyramid" — 5-8: a square pyramid; the triangles use the SLANT height
//                    (the classic mix-up is the pyramid's own height), and the
//                    base must be added.
// Faces keep their polygons from scene to scene; the student predicts, taps
// faces to find areas, and watches what changes when one measurement does.
//
// Config (prism):   { mode: "prism", l, w, h, unit, transfer: { b, hg, s, len, unit } }
// Config (pyramid): { mode: "pyramid", b, sl, unit, transfer: { b, sl } }
// Anything the stage cannot draw correctly makes the play refuse (return null).

import { escHtml } from "../../core/living-scene.js";
import { fitView, lerp, local, rectPrism, squarePyramid, triPrism } from "./net-fold-model.js";
import { createNetStage } from "./net-fold-stage.js";
import {
  boxPairs,
  lengthChoices,
  placeCorrect,
  pyramidChoices,
  sizeChoices,
  surfaceAreaCopy,
  triPrismChoices,
  validateSurfaceArea,
} from "./surface-area-model.js";

export { validateSurfaceArea };

const W = 480;
const H = 300;
const PAD = 16;
const HI = { stroke: "var(--lsx-hi)", sw: 4 };
const FOUND = { stroke: "var(--lsx-hi)", sw: 3 };

/** The small line under a face name: measurements, or the area once it is found. */
function l2Of(solid, f, mode, areaIds) {
  if (mode === "none") return "";
  if (mode === "area" && (!areaIds || areaIds.has(f.id))) return String(f.area);
  if (f.shape === "tri") {
    if (solid.kind === "tri-prism") return `½ × ${f.dims[0]} × ${f.dims[1]}`;
    return "";
  }
  return f.dims.join(" × ");
}

const styleFor = (ids, st) => Object.fromEntries([...ids].map((id) => [id, st]));

export function buildSurfaceAreaPlay(cfg) {
  const v = /** @type {any} */ (validateSurfaceArea(cfg));
  if (!v) return null;
  const T = surfaceAreaCopy(v);
  const prism = v.mode === "prism";
  /** @type {any} */
  let stage = null;
  let lastT = 0;
  let tok = 0;
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;

  const flatFit = (solid) => fitView([solid], W, H, PAD, true).at(0);
  const fits = {};

  /** A flat pyramid net shows the slant line on faceN: that face carries no label of its own then. */
  function hideSlantFace(solid, t, o) {
    if (solid.kind !== "sq-pyramid" || t > 0 || !o.segs?.length) return o;
    return { ...o, style: { ...o.style, faceN: { ...o.style?.faceN, l1: "", l2: "" } } };
  }

  /** The stage view of a solid at fold t. o: { l2, areaIds, style, segs (array or t => array), fit } */
  function frame(ctx, solid, t, o) {
    const segs = typeof o.segs === "function" ? o.segs(t) : o.segs;
    const oo = hideSlantFace(solid, t, { ...o, segs });
    const faces = {};
    for (const f of solid.faces)
      faces[f.id] = {
        l1: ctx.L(f.name),
        l2: l2Of(solid, f, oo.l2 ?? "dims", oo.areaIds),
        ...oo.style?.[f.id],
      };
    return { solid, t, faces, segs, fit: o.fit };
  }

  function draw(ctx, solid, t, o = {}) {
    stage.cancel();
    lastT = t;
    stage.draw(frame(ctx, solid, t, o));
  }

  async function foldTo(ctx, solid, t1, ms, o = {}) {
    const t0 = lastT;
    lastT = t1;
    await stage.run(ctx, (u) => frame(ctx, solid, lerp(t0, t1, u), o), ms);
  }

  const pick = (kinds, seed, labelOf, cueOf) =>
    placeCorrect(
      kinds.map((k) => ({ ...k, label: labelOf(k), cue: k.correct ? null : cueOf(k) })),
      seed,
    );

  /**
   * The body of both "what if" scenes: a slider over one measurement, the redrawn
   * net, and a readout row. The scene unlocks after two values other than the
   * lesson's own (`base`). textAt(n) -> { expr, row }.
   */
  function whatIf(ctx, /** @type {any} */ o) {
    const { min, max, base, label, solidAt, textAt, segsAt } = o;
    const st = ctx.state;
    st.seen = Array.isArray(st.seen) ? st.seen.filter((x) => Number.isInteger(x)) : [];
    const row = document.createElement("p");
    row.className = "lsx-fb";
    row.setAttribute("aria-live", "polite");
    const apply = (n) => {
      const solid = solidAt(n);
      draw(ctx, solid, 0, { l2: "area", fit: fits.what, segs: segsAt?.(solid, n) });
      ctx.expr(escHtml(textAt(n).expr));
      row.textContent = ctx.L(textAt(n).row);
    };
    const progress = () => {
      const left = 2 - st.seen.length;
      if (left <= 0) {
        ctx.feedback(T.whatLesson);
        ctx.unlock();
      } else ctx.feedback(T.tryMore(left), "cue");
    };
    const start = st.seen.length ? st.seen[st.seen.length - 1] : base;
    const rng = ctx.range({
      label,
      min,
      max,
      value: start,
      onInput: (x) => {
        if (!st.seen.includes(x) && x !== base) st.seen.push(x);
        ctx.save();
        apply(x);
        progress();
      },
    });
    ctx.panel.append(rng, row);
    apply(start);
    progress();
  }

  // ---------------------------------------------------------------- prism mode

  function prismScenes() {
    const { l, w, h, tri } = v;
    const S = rectPrism(l, w, h);
    const TS = triPrism(tri.b, tri.hg, tri.s, tri.len);
    const pr = boxPairs(l, w, h);
    const twinOf = (id) => pr.find((p) => p.ids.includes(id)).ids.find((x) => x !== id);
    const allIds = new Set(S.faces.map((f) => f.id));
    const miss = {
      all: ["top", "bottom"],
      one: ["top", "front"],
      two: ["right"],
    };
    return [
      {
        id: "net",
        label: T.scene.net,
        async enter(ctx) {
          stage.onFace = null;
          ctx.say(T.netSay);
          ctx.expr(escHtml(ctx.L(T.size)));
          draw(ctx, S, 0, { fit: fits.main });
        },
      },
      {
        id: "predict",
        label: T.scene.predict,
        gate: true,
        async enter(ctx, saved) {
          stage.onFace = null;
          ctx.say(T.predictSay);
          ctx.expr(escHtml(ctx.L(T.size)));
          draw(ctx, S, 0, { fit: fits.main });
          const opts = pick(
            sizeChoices,
            l * 7 + w * 3 + h,
            (k) => String(k.value),
            (k) => T.predictCue(k.kind),
          );
          const solved = saved.solved ? opts.findIndex((o) => o.correct) : null;
          if (saved.solved) draw(ctx, S, 0, { fit: fits.main, style: styleFor(allIds, FOUND) });
          ctx.panel.appendChild(
            ctx.choices({
              question: T.predictQ,
              options: opts,
              restore: solved,
              onMiss: (_i, o) => {
                ctx.feedback(o.cue, "cue");
                draw(ctx, S, 0, { fit: fits.main, style: styleFor(miss[o.kind], HI) });
              },
              onCorrect: () => {
                ctx.state.solved = true;
                ctx.feedback(T.predictOk);
                draw(ctx, S, 0, { fit: fits.main, style: styleFor(allIds, FOUND) });
                ctx.unlock();
              },
            }),
          );
        },
      },
      {
        id: "pairs",
        label: T.scene.pairs,
        gate: true,
        async enter(ctx) {
          const st = ctx.state;
          const keys = pr.map((p) => p.key);
          const found = (Array.isArray(st.found) ? st.found : []).filter((k) => keys.includes(k));
          const btns = new Map();
          const paint = (last) => {
            const ids = new Set(pr.filter((p) => found.includes(p.key)).flatMap((p) => p.ids));
            const style = styleFor(ids, FOUND);
            if (last) for (const id of [last, twinOf(last)]) style[id] = HI;
            draw(ctx, S, 0, { fit: fits.main, l2: "area", areaIds: ids, style });
            const shown = pr.filter((p) => found.includes(p.key));
            ctx.expr(
              found.length === 0
                ? escHtml(ctx.L(T.size))
                : `${escHtml(shown.map((p) => `2 × ${p.area}`).join(" + "))}${found.length === 3 ? ` = ${hi(String(shown.reduce((s, p) => s + 2 * p.area, 0)))}` : ""}`,
            );
            for (const [id, b] of btns) b.setAttribute("aria-pressed", String(ids.has(id)));
            const line = last ? ctx.L(T.pairPick(last, twinOf(last))) : "";
            if (found.length === 3) {
              ctx.feedback(`${escHtml(line)} ${escHtml(ctx.L(T.pairsDone))}`.trim());
              ctx.unlock();
            } else if (found.length) {
              ctx.feedback(`${escHtml(line)} ${escHtml(ctx.L(T.pairsLeft(found.length)))}`.trim());
            }
          };
          const choose = (id) => {
            const p = pr.find((q) => q.ids.includes(id));
            if (!p) return;
            if (!found.includes(p.key)) found.push(p.key);
            st.found = found;
            ctx.save();
            paint(id);
          };
          stage.onFace = choose;
          const row = document.createElement("div");
          row.className = "lsx-choices";
          row.setAttribute("role", "group");
          row.setAttribute("aria-label", ctx.L(T.scene.pairs));
          for (const f of S.faces) {
            const b = ctx.button({ label: f.name, onClick: () => choose(f.id) });
            b.setAttribute("aria-pressed", "false");
            btns.set(f.id, b);
            row.appendChild(b);
          }
          ctx.panel.appendChild(row);
          ctx.say(T.pairsSay);
          paint(null);
          if (found.length === 3) ctx.feedback(T.pairsDone);
        },
      },
      {
        id: "formula",
        label: T.scene.formula,
        async enter(ctx) {
          stage.onFace = null;
          ctx.say(T.formulaSay);
          ctx.expr(escHtml(ctx.L(T.formulaExpr)));
          draw(ctx, S, 0, { fit: fits.main, l2: "area", style: styleFor(allIds, FOUND) });
        },
      },
      {
        id: "what",
        label: T.scene.what,
        gate: true,
        async enter(ctx) {
          stage.onFace = null;
          ctx.say(T.whatSay);
          whatIf(ctx, {
            min: 1,
            max: v.hMax,
            base: h,
            label: T.heightLabel,
            solidAt: (n) => rectPrism(l, w, n),
            textAt: (n) => ({ expr: T.whatExpr(n), row: T.whatRow(n) }),
          });
        },
      },
      {
        id: "transfer",
        label: T.scene.transfer,
        async enter(ctx, saved) {
          stage.onFace = null;
          ctx.say(T.transferSay);
          const ends = ["endA", "endB"];
          const show = (areas) => {
            draw(ctx, TS, 0, { fit: fits.tri, l2: areas ? "area" : "dims" });
            ctx.expr(areas ? escHtml(ctx.L(T.transferExpr)) : "");
          };
          show(!!saved.solved);
          const opts = pick(
            triPrismChoices(tri.b, tri.hg, tri.s, tri.len),
            tri.b + tri.s + tri.len,
            (k) => String(k.value),
            (k) => T.transferCue(k.kind, k.value),
          );
          ctx.panel.appendChild(
            ctx.choices({
              question: T.transferQ,
              options: opts,
              restore: saved.solved ? opts.findIndex((o) => o.correct) : null,
              onMiss: (_i, o) => {
                ctx.feedback(o.cue, "cue");
                draw(ctx, TS, 0, {
                  fit: fits.tri,
                  style: styleFor(ends, HI),
                });
              },
              onCorrect: () => {
                ctx.state.solved = true;
                ctx.save();
                ctx.feedback(T.transferOk);
                show(true);
              },
            }),
          );
          ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
        },
      },
    ];
  }

  // -------------------------------------------------------------- pyramid mode

  function pyramidScenes() {
    const { b, sl, tr } = v;
    const P = squarePyramid(b, sl);
    const TP = squarePyramid(tr.b, tr.sl);
    const triIds = ["faceN", "faceE", "faceS", "faceW"];
    const segsFor = (ctx, solid, s, bb, withHeight) => (t) => {
      const apex = { id: "faceN", pt: local(solid, [bb / 2, -s]) };
      const out = [
        {
          a: { id: "faceN", pt: local(solid, [bb / 2, 0]) },
          b: apex,
          label: ctx.L(T.slantLabel(s)),
          stroke: "var(--lsx-hi)",
          dash: "7 5",
          dx: t > 0.5 ? -8 : 10,
        },
      ];
      if (withHeight && t >= 0.999)
        out.push({
          a: { id: "base", pt: local(solid, [bb / 2, bb / 2]) },
          b: apex,
          label: ctx.L(T.heightLabel),
          stroke: "var(--lsx-lo)",
          dash: "2 5",
          dx: 8,
        });
      return out;
    };
    return [
      {
        id: "net",
        label: T.scene.net,
        async enter(ctx) {
          stage.onFace = null;
          ctx.say(T.netSay);
          ctx.expr(escHtml(ctx.L({ en: `${b} × ${b}`, es: `${b} × ${b}` })));
          draw(ctx, P, 0, { fit: fits.main, segs: segsFor(ctx, P, sl, b, false)(0) });
        },
      },
      {
        id: "predict",
        label: T.scene.predict,
        gate: true,
        async enter(ctx, saved) {
          stage.onFace = null;
          const opts = pick(
            lengthChoices(b, sl),
            b * 5 + sl,
            (k) => T.lengthLabel(k.kind),
            (k) => T.lengthCue(k.kind),
          );
          const o0 = { segs: segsFor(ctx, P, sl, b, true) };
          draw(ctx, P, 0, { ...o0, segs: o0.segs(0) });
          ctx.panel.appendChild(
            ctx.choices({
              question: T.predictQ,
              options: opts,
              restore: saved.solved ? opts.findIndex((o) => o.correct) : null,
              onMiss: async (_i, o) => {
                ctx.feedback(o.cue, "cue");
                if (o.kind === "height")
                  await foldTo(ctx, P, 1, 1400, { l2: "none", segs: o0.segs });
              },
              onCorrect: async () => {
                ctx.state.solved = true;
                ctx.feedback(T.predictOk);
                ctx.unlock();
                await foldTo(ctx, P, 0, 900, { segs: o0.segs });
              },
            }),
          );
          if (saved.solved) ctx.feedback(T.predictOk);
        },
      },
      {
        id: "faces",
        label: T.scene.faces,
        gate: true,
        async enter(ctx) {
          const st = ctx.state;
          const found = (Array.isArray(st.found) ? st.found : []).filter(
            (k) => k === "base" || k === "face",
          );
          const sg = segsFor(ctx, P, sl, b, true);
          let t = 0;
          const baseBtn = ctx.button({ label: T.baseBtn, onClick: () => choose("base") });
          const faceBtn = ctx.button({ label: T.faceBtn, onClick: () => choose("face") });
          const foldBtn = ctx.button({ label: T.foldBtn, primary: true, onClick: () => toggle() });
          const paint = (last) => {
            const ids = new Set([
              ...(found.includes("base") ? ["base"] : []),
              ...(found.includes("face") ? triIds : []),
            ]);
            const style = styleFor(ids, FOUND);
            if (last === "base") style.base = HI;
            if (last === "face") Object.assign(style, styleFor(triIds, HI));
            draw(ctx, P, t, {
              fit: fits.main,
              l2: t > 0 ? "none" : "area",
              areaIds: ids,
              style,
              segs: t > 0 ? sg(t) : [],
            });
            baseBtn.setAttribute("aria-pressed", String(found.includes("base")));
            faceBtn.setAttribute("aria-pressed", String(found.includes("face")));
            ctx.expr(
              found.length === 2
                ? escHtml(`${b * b} + 4 × ${(b * sl) / 2}`)
                : found.length
                  ? escHtml(found.includes("base") ? String(b * b) : `4 × ${(b * sl) / 2}`)
                  : "",
            );
            const line = last ? ctx.L(last === "base" ? T.basePick : T.facePick) : "";
            if (found.length === 2) {
              ctx.feedback(`${escHtml(line)} ${escHtml(ctx.L(T.facesDone))}`.trim());
              ctx.unlock();
            } else if (last) ctx.feedback(`${escHtml(line)} ${escHtml(ctx.L(T.facesLeft))}`);
          };
          const choose = (k) => {
            if (!found.includes(k)) found.push(k);
            st.found = found;
            ctx.save();
            paint(k);
          };
          stage.onFace = (id) => choose(id === "base" ? "base" : "face");
          const toggle = async () => {
            const my = ++tok;
            const to = t >= 1 ? 0 : 1;
            foldBtn.textContent = ctx.L(to ? T.unfoldBtn : T.foldBtn);
            await foldTo(ctx, P, to, 1300, {
              l2: "none",
              style: styleFor(
                new Set([
                  ...(found.includes("base") ? ["base"] : []),
                  ...(found.includes("face") ? triIds : []),
                ]),
                FOUND,
              ),
              segs: sg,
            });
            if (my !== tok) return;
            t = to;
            paint(null);
          };
          const row = document.createElement("div");
          row.className = "lsx-choices";
          row.setAttribute("role", "group");
          row.setAttribute("aria-label", ctx.L(T.scene.faces));
          row.append(baseBtn, faceBtn, foldBtn);
          ctx.panel.appendChild(row);
          ctx.say(T.facesSay);
          paint(null);
          if (found.length === 2) ctx.feedback(T.facesDone);
        },
      },
      {
        id: "formula",
        label: T.scene.formula,
        async enter(ctx) {
          stage.onFace = null;
          ctx.say(T.formulaSay);
          ctx.expr(escHtml(ctx.L(T.formulaExpr)));
          draw(ctx, P, 0, {
            fit: fits.main,
            l2: "area",
            style: styleFor(new Set(["base", ...triIds]), FOUND),
            segs: segsFor(ctx, P, sl, b, false)(0),
          });
        },
      },
      {
        id: "what",
        label: T.scene.what,
        gate: true,
        async enter(ctx) {
          stage.onFace = null;
          ctx.say(T.whatSay);
          whatIf(ctx, {
            min: v.slMin,
            max: v.slMax,
            base: sl,
            label: T.slantRange,
            solidAt: (n) => squarePyramid(b, n),
            textAt: (n) => ({ expr: T.whatExpr(n), row: T.whatRow(n) }),
            segsAt: (solid, n) => segsFor(ctx, solid, n, b, false)(0),
          });
        },
      },
      {
        id: "transfer",
        label: T.scene.transfer,
        async enter(ctx, saved) {
          stage.onFace = null;
          ctx.say(T.transferSay);
          const sg = segsFor(ctx, TP, tr.sl, tr.b, false)(0);
          const show = (areas) => {
            draw(ctx, TP, 0, { fit: fits.tr, l2: areas ? "area" : "dims", segs: sg });
            ctx.expr(areas ? escHtml(ctx.L(T.transferExpr)) : "");
          };
          show(!!saved.solved);
          const opts = pick(
            pyramidChoices(tr.b, tr.sl),
            tr.b * 3 + tr.sl,
            (k) => String(k.value),
            (k) => T.transferCue(k.kind, k.value),
          );
          const pointAt = { noBase: ["base"], noHalf: triIds, oneFace: triIds };
          ctx.panel.appendChild(
            ctx.choices({
              question: T.transferQ,
              options: opts,
              restore: saved.solved ? opts.findIndex((o) => o.correct) : null,
              onMiss: (_i, o) => {
                ctx.feedback(o.cue, "cue");
                draw(ctx, TP, 0, {
                  fit: fits.tr,
                  segs: sg,
                  style: styleFor(pointAt[o.kind], HI),
                });
              },
              onCorrect: () => {
                ctx.state.solved = true;
                ctx.save();
                ctx.feedback(T.transferOk);
                show(true);
              },
            }),
          );
          ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
        },
      },
    ];
  }

  function setup(ctx) {
    const main = prism ? rectPrism(v.l, v.w, v.h) : squarePyramid(v.b, v.sl);
    stage = createNetStage(ctx, { W, H, pad: PAD, solids: [main] });
    fits.main = prism ? flatFit(main) : undefined;
    if (prism) {
      fits.tri = flatFit(triPrism(v.tri.b, v.tri.hg, v.tri.s, v.tri.len));
      fits.what = flatFit(rectPrism(v.l, v.w, v.hMax));
    } else {
      fits.tr = flatFit(squarePyramid(v.tr.b, v.tr.sl));
      fits.what = flatFit(squarePyramid(v.b, v.slMax));
    }
  }

  return {
    kicker: T.kicker,
    title: T.title,
    viewBox: `0 0 ${W} ${H}`,
    ariaLabel: T.ariaLabel,
    printSummary: T.printSummary,
    setup,
    scenes: (prism ? prismScenes() : pyramidScenes()).map((sc) => ({
      ...sc,
      enter: (ctx, saved) => {
        tok++;
        return sc.enter(ctx, saved);
      },
    })),
  };
}
