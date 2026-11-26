// living/expression-evaluate.js — a situation becomes 12t + 50, and t gets values.
//
// One cast for the whole play: bars made of the same two kinds of block — a
// teal block per unit (a ticket, $12) and ONE amber block for the fixed fee
// ($50) — the same tile language as the distribute play. In scene 1 the unit
// blocks are a dashed "t of them" (the unknown); in scene 3 the student picks
// the value and the blocks become real and countable, so substituting is
// something they SEE; scene 5 puts two bars one above the other to show that
// doubling the tickets doubles the teal part and not the amber one.
//
// Config: { coef, constant, variable, prefix, unit:{en,es}, fee:{en,es}, what,
//           start, story, transfer:{ coef, constant, variable, value, unit, fee, story } }
// — the lesson's own numbers (6-5 authors 12t + 50, then 4.25s + 23.50 at s = 30).

import { escHtml } from "../../core/living-scene.js";
import {
  doubleChoices,
  evalAt,
  evaluateCopy,
  expressionChoices,
  fmtNum,
  MAX_BLOCKS,
  MAX_TICKS,
  placeCorrect,
  plural,
  substitution,
  validateExpressionEvaluate,
  valueChoices,
} from "./expression-evaluate-model.js";

export { validateExpressionEvaluate };

const W = 480;
const H = 262;
const X0 = 40;
const BAR_W = 340;
const BH = 40;
const ROW_Y = [66, 172];
const UK_W = 150; // the unknown block is deliberately not to scale

export function buildExpressionEvaluatePlay(cfg) {
  const v = validateExpressionEvaluate(cfg);
  if (!v) return null;
  const { main: q, start, transfer: t, prefix } = v;
  const T = evaluateCopy(v);
  const m = (cents) => `${prefix}${fmtNum(cents)}`;
  const topMain = evalAt(q, MAX_TICKS).total;
  const topTransfer = evalAt(t, t.value).total;
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;
  const TEAL = { fill: "var(--lsx-x)", stroke: "var(--lsx-x-edge)" };
  const AMBER = { fill: "var(--lsx-u)", stroke: "var(--lsx-u-edge)" };
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
        "font-size": 16,
        "font-weight": 800,
        fill: "var(--lsx-ink)",
        text: "",
        ...attrs,
      });
    const halo = { stroke: "var(--lsx-card)", "stroke-width": 5, "paint-order": "stroke" };
    const rect = (look, extra = {}) =>
      el("rect", { x: X0, width: 0, height: BH, rx: 5, "stroke-width": 2, ...look, ...extra });
    c = {
      defn: text({
        x: X0,
        y: 24,
        "text-anchor": "start",
        "font-size": 17,
        fill: "var(--lsx-muted)",
      }),
      rows: ROW_Y.map((y) => ({
        lbl: text({ x: X0, y: y - 10, "text-anchor": "start", fill: "var(--lsx-muted)" }),
        segs: Array.from({ length: MAX_BLOCKS }, () => ({
          rect: rect(TEAL, { y }),
          txt: text({ y: y + 26, fill: "var(--lsx-on-x)", "font-size": 14 }),
        })),
        blk: rect(TEAL, { y }),
        blkTxt: text({ y: y + 26, fill: "var(--lsx-on-x)" }),
        uk: rect(
          { fill: "var(--lsx-paper)", stroke: "var(--lsx-x-edge)" },
          { y, "stroke-dasharray": "7 5", "stroke-width": 3 },
        ),
        ukTxt: text({ y: y + 26 }),
        fee: rect(AMBER, { y }),
        feeTxt: text({ y: y + 26, "font-size": 14 }),
        tot: text({ ...halo, y: y + 27, "text-anchor": "start", "font-size": 20 }),
      })),
      annVar: text({ y: ROW_Y[0] + BH + 22, fill: "var(--lsx-hi)" }),
      annFee: text({ y: ROW_Y[0] + BH + 22, fill: "var(--lsx-lo)" }),
    };
  }

  /**
   * Put the whole stage in one state; every scene calls this.
   * o: { q, top (cents), rows:[{k, merged, unknown, label, hideTotal}|null], defn, ann (k|null) }
   */
  function view(ctx, o, ms) {
    const qq = o.q ?? q;
    const scale = BAR_W / o.top;
    const on = (x) => ({ opacity: x ? 1 : 0 });
    const cm = (cents) => `${prefix}${fmtNum(cents)}`;
    const mv = [[c.defn, { ...on(o.defn), text: ctx.L(T.varDef) }]];
    c.rows.forEach((r, i) => {
      const spec = o.rows[i];
      const coefW = qq.coefC * scale;
      const feeW = qq.constC * scale;
      const k = spec?.k ?? 0;
      const unit = spec?.unknown;
      const merged = !!spec?.merged;
      const blocksW = unit ? UK_W : k * coefW;
      mv.push([r.lbl, { ...on(spec?.label), text: spec?.label ?? "" }]);
      r.segs.forEach((s, j) => {
        const shown = !!spec && !unit && !merged && j < k;
        mv.push([s.rect, { x: X0 + j * coefW, width: coefW, ...on(shown) }]);
        const roomy = coefW >= 26;
        mv.push([
          s.txt,
          { x: X0 + j * coefW + coefW / 2, ...on(shown && roomy), text: cm(qq.coefC) },
        ]);
      });
      mv.push([r.blk, { width: merged ? blocksW : 0, ...on(spec && merged) }]);
      mv.push([
        r.blkTxt,
        { x: X0 + blocksW / 2, ...on(spec && merged), text: `${fmtNum(qq.coefC)} × ${k}` },
      ]);
      mv.push([r.uk, { width: unit ? UK_W : 0, ...on(unit) }]);
      mv.push([r.ukTxt, { x: X0 + UK_W / 2, ...on(unit), text: `${qq.v} × ${cm(qq.coefC)}` }]);
      mv.push([r.fee, { x: X0 + blocksW, width: feeW, ...on(spec) }]);
      mv.push([r.feeTxt, { x: X0 + blocksW + feeW / 2, ...on(spec), text: cm(qq.constC) }]);
      const total = evalAt(qq, k).total;
      mv.push([
        r.tot,
        {
          x: X0 + blocksW + feeW + 10,
          ...on(spec),
          text: unit || spec?.hideTotal ? "?" : cm(total),
        },
      ]);
    });
    const e = o.ann == null ? null : evalAt(q, o.ann);
    const coefW = q.coefC * scale;
    const varW = (o.ann ?? 0) * coefW;
    mv.push([c.annVar, { ...on(e), x: X0 + varW / 2, text: e ? ctx.L(T.annVar(o.ann)) : "" }]);
    mv.push([
      c.annFee,
      {
        ...on(e),
        x: Math.min(X0 + varW + (q.constC * scale) / 2, W - 90),
        y: ROW_Y[0] + BH + 44,
        text: ctx.L(T.annFee),
      },
    ]);
    return ctx.tween(mv, ms);
  }

  const countLabel = (ctx, n) => {
    const pl = plural(q.unit);
    return ctx.L({ en: `${n} ${pl.en}`, es: `${n} ${pl.es}` });
  };
  const mainTop = (extra = {}) => ({ top: topMain, ...extra });
  const choiceKind = (opts, seed) => placeCorrect(opts, (seed % 3) + 1);

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.expr(escHtml(`${ctx.L(v.what)} = ?`));
        ctx.say(T.situateSay);
        await view(ctx, mainTop({ rows: [{ unknown: true }], defn: true }), 400);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        ctx.expr(escHtml(`${ctx.L(v.what)} = ?`));
        ctx.say(T.predictSay);
        await view(ctx, mainTop({ rows: [{ unknown: true }], defn: true }), 0);
        const options = choiceKind(
          expressionChoices(q).map((o) => ({ ...o, label: o.text })),
          q.coefC + q.constC,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.cue(opt), "cue"),
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.expr(hi(T.expr));
              ctx.unlock();
            },
          }),
        );
        if (saved.solved) ctx.expr(hi(T.expr));
      },
    },
    {
      id: "evaluate",
      label: T.scene.evaluate,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        st.seen = Array.isArray(st.seen)
          ? st.seen.filter((x) => Number.isInteger(x) && x >= 0 && x <= MAX_TICKS)
          : [];
        const startK = st.seen.length ? st.seen[st.seen.length - 1] : start;
        const readout = document.createElement("p");
        readout.className = "lsx-fb";
        readout.setAttribute("aria-live", "polite");
        const apply = (k, ms) => {
          const [a, b] = substitution(q, k);
          ctx.expr(
            `${escHtml(`${q.v} = ${k}:`)} ${escHtml(a)} = ${escHtml(b)} = ${hi(m(evalAt(q, k).total))}`,
          );
          readout.textContent = ctx.L(T.evalRow(k));
          return view(ctx, mainTop({ rows: [{ k }], defn: true }), ms);
        };
        const progress = () => {
          const distinct = new Set([...st.seen, start]);
          if (distinct.size >= 3) {
            ctx.feedback(T.evalDone);
            ctx.unlock();
          } else {
            ctx.feedback(distinct.size >= 2 ? T.tryMore(3 - distinct.size) : T.tryThree, "cue");
          }
        };
        ctx.say(T.evalSay);
        const rng = ctx.range({
          label: T.valueLabel,
          min: 0,
          max: MAX_TICKS,
          value: startK,
          onInput: async (k) => {
            if (!st.seen.includes(k)) st.seen.push(k);
            ctx.save();
            await apply(k, 250);
            progress();
          },
        });
        ctx.panel.append(rng, readout);
        await apply(startK, 400);
        progress();
      },
    },
    {
      id: "connect",
      label: T.scene.connect,
      async enter(ctx) {
        const [a, b] = substitution(q, start);
        ctx.say(T.connectSay(start));
        ctx.expr(
          `${hi(T.expr)} · ${lo(`${q.v} = ${start}: ${a} = ${b} = ${m(evalAt(q, start).total)}`)}`,
        );
        await view(ctx, mainTop({ rows: [{ k: start }], defn: true, ann: start }), 450);
        ctx.feedback(T.connectDone);
      },
    },
    {
      id: "double",
      label: T.scene.double,
      gate: true,
      async enter(ctx, saved) {
        const bars = (done) => ({
          rows: [
            {
              k: start,
              label: countLabel(ctx, start),
            },
            {
              k: 2 * start,
              hideTotal: !done,
              label: countLabel(ctx, 2 * start),
            },
          ],
        });
        ctx.say(T.doubleSay);
        ctx.expr(escHtml(`${T.expr}`));
        await view(ctx, mainTop(bars(!!saved.solved)), 0);
        const options = choiceKind(
          doubleChoices(q, start).map((o) => ({ ...o, label: m(o.value) })),
          start + q.coefC,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.doubleQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.doubleCue(opt), "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.doubleOk);
              ctx.unlock();
              await view(ctx, mainTop(bars(true)), 350);
            },
          }),
        );
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        const tv = t.value;
        const merged = tv > MAX_BLOCKS;
        const show = (done, ms) =>
          view(
            ctx,
            {
              q: t,
              top: topTransfer,
              defn: false,
              rows: [done ? { k: tv, merged, hideTotal: false } : { unknown: true }],
            },
            ms,
          );
        ctx.say(T.transferSay);
        ctx.expr(escHtml(`${t.v} = ${tv}:  ${T.tExpr}`));
        await show(!!saved.solved, 0);
        const options = choiceKind(
          valueChoices(t, tv).map((o) => ({ ...o, label: m(o.value) })),
          tv + t.coefC,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.transferCue(opt), "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              const [a, b] = substitution(t, tv);
              ctx.expr(
                `${escHtml(`${t.v} = ${tv}:`)} ${escHtml(a)} = ${escHtml(b)} = ${hi(m(evalAt(t, tv).total))}`,
              );
              await show(true, 450);
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
