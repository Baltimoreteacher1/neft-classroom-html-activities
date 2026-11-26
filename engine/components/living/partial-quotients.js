// living/partial-quotients.js — dividing in chunks, and what long division writes (2-6, 2-7).
//
// One cast for the whole play: a tape for the dividend, cut into chunks that are
// groups of the divisor. In whole mode (2-6) the student takes chunks off 1,344
// (100 groups of 12, then 10, then 2) and then sees the long-division digits
// 1, 1, 2 are those same chunks one place at a time. In decimal mode (2-7) the
// tape for 18.9 ÷ 6.3 never changes while both decimal points slide: only the
// labels (189 ÷ 63) change, and the quotient stays 3.
//
// Config: { mode: "whole"|"decimal", dividend, divisor, story?, transfer:{dividend, divisor} }
// Everything must divide exactly; see validatePartialQuotients.

import { escHtml } from "../../core/living-scene.js";
import {
  chunkSizes,
  equivalentChoices,
  markerXs,
  partialQuotientsCopy,
  placeCorrect,
  quotientChoices,
  replayTaken,
  scaledPair,
  slideChoices,
  tapeParts,
  validatePartialQuotients,
  windowChoices,
} from "./partial-quotients-model.js";
import { fmt } from "./place-value-blocks-model.js";

export { validatePartialQuotients };

const W = 480;
const X0 = 30;
const BW = 420;
const BAR_Y = 58;
const BAR_H = 32;
const MARK_Y = 112;
const LEG_X = 262;
const LEG_Y = 150;
const LEG_STEP = 30;
const POOL = 24;
const MAX_CHUNKS = 24;
const CWL = 22; // long-division cell width
const DIV_X = 22;
const LD_Y = 160; // quotient row baseline
const ROW = 27;
const fx = (n) => fmt(String(n));
const style = (ci) =>
  ci % 2 === 0
    ? { fill: "var(--lsx-x)", stroke: "var(--lsx-x-edge)" }
    : { fill: "var(--lsx-u)", stroke: "var(--lsx-u-edge)" };

export function buildPartialQuotientsPlay(cfg) {
  const v = validatePartialQuotients(cfg);
  if (!v) return null;
  const T = partialQuotientsCopy(v);
  const { main: m, tr, mode } = v;
  const whole = mode === "whole";
  const rounds = m.ld.rounds.length;
  const H = Math.max(300, LD_Y + 28 + ROW * 2 * rounds + 18);
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  let c = null;
  let ldG = null;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = "";
    const el = (tag, attrs) => svgEl(tag, { opacity: 0, ...attrs }, svg);
    const text = (attrs) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 16,
        "font-weight": 800,
        fill: "var(--lsx-ink)",
        ...attrs,
      });
    const rect = (x, y, w, h, extra) => el("rect", { x, y, width: w, height: h, ...extra });
    const ink = { stroke: "var(--lsx-ink)", "stroke-width": 3 };
    const dashed = { fill: "none", "stroke-dasharray": "5 4" };
    const base = rect(X0, BAR_Y, BW, BAR_H, { rx: 3, fill: "var(--lsx-card)", ...ink });
    const rem = rect(X0, BAR_Y, BW, BAR_H, {
      rx: 3,
      ...dashed,
      stroke: "var(--lsx-muted)",
      "stroke-width": 2,
    });
    const segs = Array.from({ length: POOL }, () =>
      rect(X0, BAR_Y, 4, BAR_H, { ...style(0), "stroke-width": 2 }),
    );
    const segLabels = Array.from({ length: POOL }, () => text({ y: BAR_Y + BAR_H / 2 + 6 }));
    const top = text({ x: X0 + BW / 2, y: BAR_Y - 12, "font-size": 20 });
    const pointer = { ...dashed, stroke: "var(--lsx-focus)", "stroke-width": 3 };
    const hiBar = rect(X0 - 5, BAR_Y - 5, BW + 10, BAR_H + 10, { rx: 5, ...pointer });
    const guess = rect(X0, BAR_Y + BAR_H + 10, 10, 14, { ...pointer, fill: "var(--lsx-card)" });
    const guessTxt = text({ x: X0, y: BAR_Y + BAR_H + 46, "font-size": 15 });
    const dot = (cx, cy) =>
      el("circle", {
        cx,
        cy,
        r: 11,
        fill: "var(--lsx-card)",
        stroke: "var(--lsx-ink)",
        "stroke-width": 2.5,
      });
    const marks = Array.from({ length: 6 }, () => ({
      dot: dot(0, MARK_Y),
      num: text({ y: MARK_Y + 5, "font-size": 14 }),
    }));
    const legend = Array.from({ length: 6 }, (_, k) => {
      const y = LEG_Y + k * LEG_STEP;
      return {
        dot: dot(LEG_X + 11, y),
        num: text({ x: LEG_X + 11, y: y + 5, "font-size": 14 }),
        txt: text({
          x: LEG_X + 30,
          y: y + 5,
          "text-anchor": "start",
          "font-size": 18,
          "font-weight": 700,
        }),
      };
    });
    const stats = [0, 1].map((k) =>
      text({ x: X0, y: LEG_Y + 8 + k * 38, "text-anchor": "start", "font-size": k ? 20 : 25 }),
    );
    ldG = svgEl("g", { opacity: 0 }, svg);
    c = { base, rem, segs, segLabels, top, hiBar, guess, guessTxt, marks, legend, stats };
  }

  /** The whole stage in one state; every scene calls this. */
  function draw(ctx, o, ms) {
    const mv = [];
    const on = (el, yes, extra = {}) => mv.push([el, { opacity: yes ? 1 : 0, ...extra }]);
    on(c.base, o.bar);
    c.top.textContent = o.top ?? "";
    on(c.top, o.bar && o.top);
    const parts = o.parts || [];
    c.segs.forEach((s, k) => {
      const p = parts[k];
      if (!p) return on(s, false);
      const attrs = {
        x: X0 + p.from * BW,
        width: Math.max(3, p.size * BW),
        ...style(p.ci),
        "stroke-width": o.hiCi === p.ci ? 5 : 2,
      };
      if (Number(s.getAttribute("opacity")) > 0) return mv.push([s, { ...attrs, opacity: 1 }]);
      for (const [a, val] of Object.entries(attrs)) s.setAttribute(a, String(val));
      mv.push([s, { opacity: 1 }]);
    });
    c.segLabels.forEach((t, k) => {
      const p = parts[k];
      const show = p && o.segLabel && p.size * BW >= 34;
      t.textContent = show ? o.segLabel : "";
      if (show) t.setAttribute("fill", p.ci % 2 ? "var(--lsx-ink)" : "var(--lsx-on-x)");
      on(t, show, show ? { x: X0 + (p.from + p.size / 2) * BW } : {});
    });
    const from = o.remFrom ?? null;
    on(
      c.rem,
      from != null && from < 0.999,
      from != null ? { x: X0 + from * BW, width: Math.max(1, (1 - from) * BW) } : {},
    );
    on(c.hiBar, o.hiBar);
    const g = o.guess;
    c.guessTxt.textContent = g?.text ?? "";
    on(c.guess, g, g ? { width: g.frac * BW } : {});
    on(c.guessTxt, g, g ? { x: Math.min(X0 + 150, X0 + (g.frac * BW) / 2 + 60) } : {});
    // chunk markers under the bar and legend rows
    const chunks = o.chunks || [];
    const xs = markerXs(
      chunks.map((_, k) => {
        const own = parts.filter((p) => p.ci === k);
        return [Math.min(...own.map((p) => p.from)), Math.max(...own.map((p) => p.from + p.size))];
      }),
      X0,
      BW,
    );
    c.marks.forEach((mk, k) => {
      if (!chunks[k]) {
        on(mk.dot, false);
        return on(mk.num, false);
      }
      mk.num.textContent = String(k + 1);
      on(mk.dot, true, { cx: xs[k], cy: MARK_Y, "stroke-width": o.hiCi === k ? 5 : 2.5 });
      on(mk.num, true, { x: xs[k] });
    });
    c.legend.forEach((r, k) => {
      const ch = o.legend?.[k];
      r.num.textContent = ch ? String(k + 1) : "";
      r.txt.textContent = ch ?? "";
      r.txt.setAttribute("font-weight", o.hiCi === k ? 800 : 600);
      on(r.dot, ch, { "stroke-width": o.hiCi === k ? 5 : 2.5 });
      on(r.num, ch);
      on(r.txt, ch);
    });
    c.stats.forEach((t, k) => {
      t.textContent = o.stats?.[k] ?? "";
      on(t, o.stats?.[k]);
    });
    mv.push([ldG, { opacity: o.ld ? 1 : 0 }]);
    return ctx.tween(mv, ms);
  }

  const canonical = (p, extra = {}) => {
    const parts = tapeParts(p.Ds, p.ds, p.chunks).map((q) => ({
      from: q.from,
      size: q.size,
      ci: p.chunks.indexOf(q.chunk),
    }));
    return {
      bar: true,
      top: fx(p.D),
      parts,
      chunks: p.chunks,
      legend: p.chunks.map((ch) => T.legend(p, ch)),
      segLabel: p.units ? fx(p.d) : null,
      ...extra,
    };
  };

  /** Long-division writing for scene 4: returns { show(round, ms), count }. */
  function buildLD(ctx) {
    ldG.innerHTML = "";
    const { svgEl } = ctx;
    const p = m;
    const dl = String(p.ds).length;
    const BX = DIV_X + dl * CWL + 10;
    const n = p.ld.digits.length;
    const cx = (col) => BX + 6 + col * CWL + CWL / 2;
    const txt = (s, x, y, extra = {}) =>
      svgEl(
        "text",
        {
          x,
          y,
          "text-anchor": "middle",
          "font-size": 21,
          "font-weight": 700,
          fill: "var(--lsx-ink)",
          opacity: 0,
          text: s,
          ...extra,
        },
        ldG,
      );
    const still = (e) => e.setAttribute("opacity", "1");
    String(p.ds)
      .split("")
      .forEach((ch, i) => still(txt(ch, DIV_X + i * CWL + CWL / 2, LD_Y + 30)));
    const stroke = (d, w) =>
      svgEl(
        "path",
        { d, fill: "none", stroke: "var(--lsx-ink)", "stroke-width": w, opacity: 0 },
        ldG,
      );
    still(
      stroke(`M ${BX} ${LD_Y + 6} V ${LD_Y + 38} M ${BX} ${LD_Y + 8} H ${BX + n * CWL + 12}`, 3),
    );
    p.ld.digits.split("").forEach((ch, i) => still(txt(ch, cx(i), LD_Y + 30)));
    const right = (s, end, y, extra) =>
      s.split("").map((ch, i) => txt(ch, cx(end - (s.length - 1 - i)), y, extra));
    const parts = p.ld.rounds.map((r, k) => {
      const yP = LD_Y + 30 + ROW * (2 * k + 1);
      const yR = LD_Y + 30 + ROW * (2 * k + 2);
      const len = String(r.prod).length;
      const els = [
        txt(String(r.q), cx(r.end), LD_Y, { fill: "var(--lsx-hi)" }),
        txt("−", cx(r.end - len) - 4, yP, { fill: "var(--lsx-muted)" }),
        ...right(String(r.prod), r.end, yP),
        stroke(`M ${cx(r.end - len) - 10} ${yP + 7} H ${cx(r.end) + 12}`, 2),
        ...right(String(r.rem), r.end, yR),
      ];
      if (r.bring != null)
        els.push(txt(String(r.bring), cx(r.end + 1), yR, { fill: "var(--lsx-lo)" }));
      return els;
    });
    return {
      count: rounds,
      chunkOf: (r) => {
        const place = p.ld.rounds[r].place;
        return p.chunks.findIndex((ch) => ch.place === place);
      },
      show(upto, ms) {
        const moves = [];
        parts.forEach((els, k) =>
          els.forEach((e) => moves.push([e, { opacity: k < upto ? 1 : 0 }])),
        );
        return ctx.tween(moves, ms);
      },
    };
  }

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.expr(escHtml(T.situateExpr));
        ctx.say(T.situateSay);
        const one = ctx.L({ en: `One group = ${fx(m.d)}`, es: `Un grupo = ${fx(m.d)}` });
        await draw(ctx, { bar: false }, 0);
        await draw(ctx, { bar: true, top: fx(m.D), remFrom: 0, stats: [one] }, 600);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        const base = { bar: true, top: fx(m.D), remFrom: 0 };
        const solved = !!saved.solved;
        await draw(ctx, base, 0);
        ctx.expr(escHtml(T.situateExpr));
        ctx.say(T.predictSay);
        const opts = whole
          ? placeCorrect(
              windowChoices(m.Ds, m.ds).map((w) => ({ ...w, label: T.winLabel(w) })),
              m.q + 1,
            )
          : placeCorrect(
              slideChoices(m.q).map((o) => ({ ...o, label: T.slideLabel(o) })),
              m.q + 2,
            );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options: opts,
            restore: solved ? opts.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              if (!whole) {
                ctx.feedback(T.slideCue(opt), "cue");
                return draw(ctx, { ...base, hiBar: true }, 250);
              }
              const w = opt.m < String(m.q).length - 1 ? opt.hi : opt.lo;
              const guess = {
                frac: Math.min((w * m.ds) / m.Ds, 1.04),
                text: `${fx(w)} × ${fx(m.ds)} = ${fx(w * m.ds)}`,
              };
              ctx.feedback(T.windowCue(opt), "cue");
              await draw(ctx, { ...base, guess }, 300);
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              await draw(ctx, base, 250);
            },
          }),
        );
      },
    },
    whole ? chunkScene() : slideScene(),
    {
      id: "connect",
      label: T.scene.connect,
      async enter(ctx, saved) {
        const ld = buildLD(ctx);
        const st = ctx.state;
        let round = Number.isInteger(saved.round) ? Math.min(saved.round, ld.count) : 0;
        const base = canonical(m, {
          ld: true,
          top: fx(m.Ds),
          segLabel: m.units ? fx(m.ds) : null,
        });
        const paint = async (ms) => {
          const ci = round ? ld.chunkOf(round - 1) : -1;
          await draw(ctx, { ...base, hiCi: ci >= 0 ? ci : null }, ms);
          await ld.show(round, ms);
        };
        const btn = ctx.button({
          label: T.nextStep,
          primary: true,
          onClick: async () => {
            if (round >= ld.count) return;
            round++;
            st.round = round;
            ctx.save();
            sayNow();
            btn.disabled = round >= ld.count;
            await paint(450);
          },
        });
        const sayNow = () => {
          ctx.say(round ? T.roundSay(round - 1) : T.connectIntro);
          ctx.feedback(round >= ld.count ? T.ldDone : "");
        };
        ctx.expr(`${escHtml(`${fx(m.Ds)} ÷ ${fx(m.ds)}`)} = ${hi(fx(m.q))}`);
        sayNow();
        btn.disabled = round >= ld.count;
        ctx.panel.appendChild(btn);
        await draw(ctx, { ...base, hiCi: null }, 0);
        await ld.show(0, 0);
        await paint(round ? 0 : 500);
      },
    },
    transferScene(),
  ];

  /** Whole mode: take chunks off the bar. */
  function chunkScene() {
    return {
      id: "chunk",
      label: T.scene.chunk,
      gate: true,
      async enter(ctx, saved) {
        const st = ctx.state;
        const sizes = chunkSizes(m.q);
        const taken = replayTaken(saved.taken, sizes, m.Ds, m.ds, MAX_CHUNKS);
        const used = () => taken.reduce((s, g) => s + g * m.ds, 0);
        const left = () => m.Ds - used();
        const paint = (ms) => {
          let at = 0;
          const parts = taken.map((g, i) => {
            const size = (g * m.ds) / m.Ds;
            const part = { from: at, size, ci: i };
            at += size;
            return part;
          });
          const tot = taken.reduce((s, g) => s + g, 0);
          ctx.expr(
            !tot
              ? escHtml(T.situateExpr)
              : left()
                ? escHtml(`${fx(tot)} × ${fx(m.ds)} = ${fx(used())}`)
                : `${escHtml(taken.map(fx).join(" + "))} = ${hi(fx(tot))}`,
          );
          return draw(
            ctx,
            {
              bar: true,
              top: fx(m.D),
              parts,
              remFrom: left() ? used() / m.Ds : null,
              stats: [ctx.L(T.labels.left(left())), ctx.L(T.labels.groups(tot))],
            },
            ms,
          );
        };
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", ctx.L(T.chunkSay));
        const btns = sizes.map((g) => {
          const b = ctx.button({ label: T.takeLabel(g), onClick: () => take(g) });
          row.appendChild(b);
          return [g, b];
        });
        const reset = ctx.button({ label: T.undo, onClick: () => restart() });
        row.appendChild(reset);
        const paintBtns = () => {
          const full = taken.length >= MAX_CHUNKS;
          for (const [g, b] of btns) b.disabled = left() === 0 || g * m.ds > left() || full;
          reset.disabled = !taken.length;
          if (full && left()) ctx.feedback(T.tooMany, "cue");
        };
        const finish = () => {
          ctx.feedback(T.chunkDone(taken));
          ctx.unlock();
        };
        function take(g) {
          if (g * m.ds > left() || taken.length >= MAX_CHUNKS) return;
          taken.push(g);
          st.taken = taken;
          ctx.save();
          ctx.feedback(
            left()
              ? T.took(
                  g,
                  left(),
                  taken.reduce((s, x) => s + x, 0),
                )
              : "",
          );
          paintBtns();
          paint(350);
          if (!left()) finish();
        }
        function restart() {
          taken.length = 0;
          st.taken = [];
          ctx.save();
          ctx.feedback("");
          paintBtns();
          paint(300);
        }
        ctx.say(T.chunkSay);
        ctx.panel.appendChild(row);
        paintBtns();
        await paint(0);
        if (!left()) finish();
      },
    };
  }

  /** Decimal mode: slide both points; the tape does not change. */
  function slideScene() {
    return {
      id: "chunk",
      label: T.scene.chunk,
      gate: true,
      async enter(ctx, saved) {
        const st = ctx.state;
        const top = m.k + 1;
        let s =
          Number.isInteger(saved.slide) && saved.slide >= 0 && saved.slide <= top ? saved.slide : 0;
        let reached = !!saved.reached || s >= m.k;
        const paint = (ms) => {
          const t = scaledPair(m, s);
          ctx.expr(`${escHtml(`${t.D} ÷ ${t.d}`)} = ${hi(fx(m.q))}`);
          return draw(
            ctx,
            {
              ...canonical(m),
              top: t.D,
              segLabel: t.d,
              legend: [],
              chunks: [],
              stats: [ctx.L(T.labels.fits(m.q))],
            },
            ms,
          );
        };
        const report = () => {
          if (reached && s >= m.k) {
            ctx.feedback(`${ctx.L(T.slideNow(s))} ${ctx.L(T.slideDone)}`);
            ctx.unlock();
          } else ctx.feedback(T.slideNow(s), "cue");
        };
        const sync = () => {
          reached = reached || s >= m.k;
          st.slide = s;
          st.reached = reached;
          ctx.save();
          report();
        };
        const rng = ctx.range({
          label: T.slideLabelRange,
          min: 0,
          max: top,
          value: s,
          onInput: (x) => {
            s = x;
            sync();
            paint(250);
          },
        });
        ctx.panel.appendChild(rng);
        ctx.say(T.slideSay);
        await paint(0);
        if (reached && s >= m.k) report();
      },
    };
  }

  function transferScene() {
    return {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        const own = { bar: true, top: fx(tr.D) };
        ctx.expr(escHtml(T.transferExpr));
        ctx.say(T.transferSay);
        await draw(ctx, saved.solved ? canonical(tr) : { ...own, remFrom: 0 }, 0);
        const opts = whole
          ? placeCorrect(
              quotientChoices(tr.Ds, tr.ds).map((o) => ({
                ...o,
                label: { en: fx(o.value), es: fx(o.value) },
              })),
              tr.q + 1,
            )
          : placeCorrect(
              equivalentChoices(tr).map((o) => ({ ...o, label: { en: o.text, es: o.text } })),
              tr.Ds + 2,
            );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options: opts,
            restore: saved.solved ? opts.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(whole ? T.quotCue(opt) : T.equivCue(opt), "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              await draw(ctx, canonical(tr), 600);
            },
          }),
        );
        ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
      },
    };
  }

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
