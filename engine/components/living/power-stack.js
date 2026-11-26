// living/power-stack.js — what an exponent counts: 2³ is 2 × 2 × 2, not 2 × 3.
//
// One cast for the whole play: the notation (base and raised exponent), a row
// of boxes — one per factor — and two bars. The boxes ARE the factors in
// scene 1, light up one at a time as the student multiplies them out in scene
// 3, and the SAME boxes feed two bars in scene 4: the product bar (multiply the
// boxes) next to the sum bar (add the same numbers). Scene 5 changes the
// exponent so the student sees each new box multiply the value again.
//
// Config: { base, exp, transfer:{ base, exp } } — the lesson's own powers
// (6-3 authors 2³, with 5² and 2⁴ as the worked and practice powers).

import { escHtml } from "../../core/living-scene.js";
import {
  asProduct,
  asSum,
  choiceSet,
  placeCorrect,
  powerCopy,
  running,
  sup,
  validatePowerStack,
} from "./power-stack-model.js";

export { validatePowerStack };

const W = 480;
const H = 300;
const BW = 52;
const GAP = 24;
const BAR_X = 30;
const BAR_W = 380;
const A_Y = 204;
const B_Y = 262;
const BAR_H = 26;

export function buildPowerStackPlay(cfg) {
  const v = validatePowerStack(cfg);
  if (!v) return null;
  const { base: b, exp: e, emax, transfer: tr } = v;
  const T = powerCopy(v);
  const P = b ** e;
  const S = b * e;
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;
  const X = { fill: "var(--lsx-x)", stroke: "var(--lsx-x-edge)" };
  const PAPER = { fill: "var(--lsx-card)", stroke: "var(--lsx-ink)" };
  const boxX = (i, n) => (W - (n * BW + (n - 1) * GAP)) / 2 + i * (BW + GAP);
  let c = null; // the cast

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs) => svgEl(tag, { opacity: 0, ...attrs }, g);
    const text = (attrs) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 18,
        "font-weight": 800,
        fill: "var(--lsx-ink)",
        ...attrs,
      });
    const small = { "font-size": 16, "font-weight": 700, fill: "var(--lsx-muted)" };
    const halo = { stroke: "var(--lsx-card)", "stroke-width": 5, "paint-order": "stroke" };
    c = {
      nb: text({ x: 236, y: 66, "text-anchor": "end", "font-size": 48, text: String(b) }),
      ne: text({ x: 242, y: 42, "text-anchor": "start", "font-size": 28, text: String(e) }),
      baseLbl: text({ ...small, x: 236, y: 88, "text-anchor": "end", text: ctx.L(T.base) }),
      expLbl: text({ ...small, x: 266, y: 40, "text-anchor": "start", text: ctx.L(T.exponent) }),
      boxes: Array.from({ length: emax }, () => ({
        rect: el("rect", {
          x: 0,
          y: 104,
          width: BW,
          height: BW,
          rx: 8,
          ...PAPER,
          "stroke-width": 3,
        }),
        txt: text({ x: 0, y: 138, "font-size": 24, text: String(b) }),
      })),
      times: Array.from({ length: emax - 1 }, () =>
        text({ x: 0, y: 138, "font-size": 24, text: "×" }),
      ),
      aLbl: text({ ...small, x: BAR_X, y: A_Y - 8, "text-anchor": "start", text: "" }),
      aBar: el("rect", {
        x: BAR_X,
        y: A_Y,
        width: 0,
        height: BAR_H,
        rx: 4,
        ...X,
        "stroke-width": 2,
      }),
      aVal: text({
        ...halo,
        x: BAR_X,
        y: A_Y + 21,
        "text-anchor": "start",
        "font-size": 20,
        text: "",
      }),
      bLbl: text({ ...small, x: BAR_X, y: B_Y - 8, "text-anchor": "start", text: "" }),
      bSegs: Array.from({ length: emax }, () =>
        el("rect", {
          x: BAR_X,
          y: B_Y,
          width: 0,
          height: BAR_H,
          rx: 4,
          fill: "var(--lsx-u)",
          stroke: "var(--lsx-u-edge)",
          "stroke-width": 2,
        }),
      ),
      bVal: text({
        ...halo,
        x: BAR_X,
        y: B_Y + 21,
        "text-anchor": "start",
        "font-size": 20,
        text: "",
      }),
    };
  }

  /**
   * Put the whole stage in one state; every scene calls this so a scene looks
   * the same whether the student arrived by Next, Back, a step dot or resume.
   * o: { base, exp (the power drawn), n (boxes shown), lit (boxes filled),
   *      notation, A (product bar value|null), B (sum segments|null), top }
   */
  function view(ctx, o, ms) {
    const pb = o.base ?? b;
    const pe = o.exp ?? e;
    const m = [];
    const on = (x) => ({ opacity: x ? 1 : 0 });
    m.push([c.nb, { ...on(o.notation), text: String(pb) }]);
    m.push([c.ne, { ...on(o.notation), text: String(pe) }]);
    m.push([c.baseLbl, on(o.notation)], [c.expLbl, on(o.notation)]);
    c.boxes.forEach((bx, i) => {
      const shown = i < (o.n ?? 0);
      const look = i < (o.lit ?? 0) ? X : PAPER;
      const textFill = i < (o.lit ?? 0) ? "var(--lsx-on-x)" : "var(--lsx-ink)";
      m.push([bx.rect, { x: boxX(i, o.n || 1), ...on(shown), ...look }]);
      m.push([
        bx.txt,
        { x: boxX(i, o.n || 1) + BW / 2, ...on(shown), fill: textFill, text: String(pb) },
      ]);
    });
    c.times.forEach((t, i) =>
      m.push([t, { x: boxX(i, o.n || 1) + BW + GAP / 2, ...on(i < (o.n ?? 0) - 1) }]),
    );
    const scale = BAR_W / (o.top || 1);
    const A = o.A ?? 0;
    m.push([c.aLbl, { ...on(o.A != null), text: o.aLbl ?? "" }]);
    m.push([c.aBar, { ...on(o.A != null), width: A * scale }]);
    m.push([c.aVal, { ...on(o.A != null), x: BAR_X + A * scale + 8, text: String(A) }]);
    const k = o.B ?? 0;
    m.push([c.bLbl, { ...on(o.B != null), text: o.bLbl ?? "" }]);
    c.bSegs.forEach((s, i) =>
      m.push([s, { ...on(o.B != null && i < k), x: BAR_X + i * pb * scale, width: pb * scale }]),
    );
    m.push([c.bVal, { ...on(o.B != null), x: BAR_X + k * pb * scale + 8, text: String(k * pb) }]);
    return ctx.tween(m, ms);
  }

  const mulText = (ctx, pb, k) => `${ctx.L(T.mulLabel)}: ${asProduct(pb, k)}`;
  const addText = (ctx, pb, k) => `${ctx.L(T.addLabel)}: ${asSum(pb, k)}`;
  const full = (ctx, pb, pe, ex = {}) => ({
    base: pb,
    exp: pe,
    n: pe,
    lit: pe,
    notation: true,
    A: pb ** pe,
    aLbl: mulText(ctx, pb, pe),
    B: pe,
    bLbl: addText(ctx, pb, pe),
    top: Math.max(pb ** pe, pb * pe),
    ...ex,
  });
  const choiceOpts = (pb, pe, seed) =>
    placeCorrect(
      choiceSet(pb, pe).map((o) => ({ ...o, label: String(o.value) })),
      (seed % 3) + 1, // never slot 0: the right answer is not always first
    );

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.expr(`${escHtml(`${b}${sup(e)}`)} = ${hi(asProduct(b, e))}`);
        ctx.say(T.situateSay);
        await view(ctx, { notation: true, n: 0 }, 0);
        for (let i = 1; i <= e; i++) await view(ctx, { notation: true, n: e, lit: i }, 320);
        await view(ctx, { notation: true, n: e, lit: 0 }, 200);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        await view(ctx, { notation: true, n: e }, 0);
        ctx.expr(escHtml(`${b}${sup(e)} = ?`));
        ctx.say(T.predictSay);
        const options = choiceOpts(b, e, P + 3 * e + 1);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              ctx.feedback(T.cue(opt), "cue");
              // Point at the picture: the boxes flash filled, in count.
              await view(ctx, { notation: true, n: e, lit: e }, 250);
              await view(ctx, { notation: true, n: e, lit: 0 }, 250);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "build",
      label: T.scene.build,
      gate: true,
      async enter(ctx, saved) {
        const st = ctx.state;
        let k = Number.isInteger(saved.k) && saved.k >= 1 && saved.k <= e ? saved.k : 1;
        const paint = (ms) => {
          ctx.expr(k === e ? `${escHtml(T.buildStep(k))}` : `${lo(T.buildStep(k))}`);
          next.textContent = ctx.L(T.buildBtn(Math.min(k, e - 1)));
          next.disabled = k >= e;
          again.disabled = k <= 1;
          return view(
            ctx,
            { notation: true, n: e, lit: k, A: running(b, k), aLbl: mulText(ctx, b, k), top: P },
            ms,
          );
        };
        const next = ctx.button({
          label: T.buildBtn(0),
          primary: true,
          onClick: async () => {
            if (k >= e) return;
            k += 1;
            st.k = k;
            ctx.save();
            await paint(350);
            if (k === e) {
              ctx.feedback(T.buildDone);
              ctx.unlock();
            }
          },
        });
        const again = ctx.button({
          label: T.startOver,
          onClick: () => {
            k = 1;
            st.k = 1;
            ctx.save();
            ctx.feedback("");
            paint(300);
          },
        });
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.append(next, again);
        ctx.panel.appendChild(row);
        ctx.say(T.buildSay);
        await paint(300);
        if (k === e) {
          ctx.feedback(T.buildDone);
          ctx.unlock();
        }
      },
    },
    {
      id: "connect",
      label: T.scene.connect,
      async enter(ctx) {
        ctx.expr(`${hi(T.connectExpr)}<br>${lo(T.connectExpr2)}`);
        ctx.say(T.connectSay);
        await view(ctx, full(ctx, b, e, { B: null, A: P, top: Math.max(P, S) }), 300);
        await view(ctx, full(ctx, b, e), 600);
        ctx.feedback(T.connectDone);
      },
    },
    {
      id: "change",
      label: T.scene.change,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        st.seen = Array.isArray(st.seen)
          ? st.seen.filter((x) => Number.isInteger(x) && x >= 1 && x <= emax)
          : [];
        const start = st.seen.length ? st.seen[st.seen.length - 1] : e;
        const readout = document.createElement("p");
        readout.className = "lsx-fb";
        readout.setAttribute("aria-live", "polite");
        const apply = (k, ms) => {
          readout.textContent = ctx.L(T.changeRow(k));
          ctx.expr(`${hi(`${b}${sup(k)} = ${b ** k}`)}   ${lo(`${b} × ${k} = ${b * k}`)}`);
          return view(ctx, full(ctx, b, k), ms);
        };
        const progress = () => {
          const distinct = new Set([...st.seen, e]);
          if (distinct.size >= 3) {
            ctx.feedback(T.changeLesson);
            ctx.unlock();
          } else {
            ctx.feedback(distinct.size >= 2 ? T.tryMore(3 - distinct.size) : T.tryThree, "cue");
          }
        };
        ctx.say(T.changeSay);
        const rng = ctx.range({
          label: T.expLabel,
          min: 1,
          max: emax,
          value: start,
          onInput: async (k) => {
            if (!st.seen.includes(k)) st.seen.push(k);
            ctx.save();
            await apply(k, 250);
            progress();
          },
        });
        ctx.panel.append(rng, readout);
        await apply(start, 400);
        progress();
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        const { base: tb, exp: te } = tr;
        const tP = tb ** te;
        const show = (ms) => view(ctx, full(ctx, tb, te), ms);
        await view(ctx, { base: tb, exp: te, notation: true, n: te, lit: 0 }, 300);
        ctx.expr(escHtml(`${tb}${sup(te)} = ?`));
        ctx.say(T.transferSay);
        const options = choiceOpts(tb, te, tP + 2 * te + 3);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.cueFor(opt, tr), "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              ctx.expr(`${hi(`${tb}${sup(te)} = ${asProduct(tb, te)} = ${tP}`)}`);
              await show(500);
            },
          }),
        );
        if (saved.solved) {
          ctx.expr(`${hi(`${tb}${sup(te)} = ${asProduct(tb, te)} = ${tP}`)}`);
          await show(0);
        }
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
