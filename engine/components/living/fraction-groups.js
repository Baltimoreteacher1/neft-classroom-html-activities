// living/fraction-groups.js — division as "how many groups fit" (6-1, 6-2, 6-9,
// 6-10, 6-11).
//
// One tape per problem. The tape is cut into pieces of one common size; the
// dividend is those pieces, a group of the divisor is some of them, and laying
// groups along the tape counts the quotient. The SAME piece rectangles are the
// whole bars (stacked on top of each other), the halves of a mixed number, and
// the single pieces — "cut" only changes where they sit — so renaming a
// fraction in smaller pieces is something the student watches, not something
// they are told. The written steps (the reciprocal rule, the check) come last
// and say what the picture already did.
//
// Config: { mode: "unit"|"whole"|"fraction"|"mixed"|"story",
//           dividend:{n,d}, divisor:{n,d}, noun:{en,es}, story, question?,
//           transfer:{ dividend, divisor, noun, story, question? },
//           share?:{ dividend?, shares, story, question? }   // unit, story
//           bigger?:{ dividend, divisor, noun, story }       // whole
//         }
// Every number, choice and sentence comes from fraction-groups-model.js (pure,
// tested); this file stages it.

import { escHtml } from "../../core/living-scene.js";
import {
  connectSteps,
  convertChoices,
  equationChoices,
  fmt,
  frac,
  fractionGroupsCopy,
  H,
  isWhole,
  mixed,
  pieces,
  placeCorrect,
  quotientChoices,
  shareChoices,
  validateFractionGroups,
  W,
} from "./fraction-groups-model.js";

export { validateFractionGroups };

const X0 = 30;
const TW = 420; // the tape's width, in stage units
const TY = 118;
const TH = 44;
const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;
/** The correct choice never sits first: a seed that lands on 0 is nudged. */
const seat = (options, n) => placeCorrect(options, n % options.length === 0 ? n + 1 : n);
/** «x» marks the part of a written expression to emphasise. */
const emph = (s) => escHtml(s).replace(/«(.*?)»/g, (_, m) => hi(m));

/**
 * One problem's tape. show(o) returns the tween moves for that state; hide()
 * the moves that clear it. o = { mode: "amount"|"groups", cut, k, counter,
 * ghost, labels: (count, c) => text | null, end: text | null }.
 */
function makeTape(ctx, parent, spec) {
  const { D, q, P, g, Q, whole } = spec;
  const u = TW / whole;
  const pw = u / q;
  const Dn = D.n / D.d;
  const el = (tag, attrs) => ctx.svgEl(tag, { opacity: 0, ...attrs }, parent);
  const text = (attrs) =>
    el("text", {
      "text-anchor": "middle",
      "font-size": 16,
      "font-weight": 700,
      fill: "var(--lsx-ink)",
      ...attrs,
    });
  const tracks = Array.from({ length: whole }, (_, w) =>
    el("rect", {
      x: X0 + w * u,
      y: TY,
      width: u,
      height: TH,
      fill: "none",
      stroke: "var(--lsx-muted)",
      "stroke-width": 2,
    }),
  );
  const cells = Array.from({ length: P }, () =>
    el("rect", { y: TY, height: TH, x: X0, width: pw, "stroke-width": 2 }),
  );
  const marks = Array.from({ length: Q }, () => ({
    box: el("rect", {
      y: TY - 4,
      height: TH + 8,
      x: X0,
      width: pw,
      rx: 3,
      fill: "none",
      stroke: "var(--lsx-ink)",
      "stroke-width": 3,
    }),
    num: text({ y: TY - 10, "font-size": 13 }),
  }));
  const ticks = Array.from({ length: whole + 1 }, (_, w) => ({
    line: el("line", {
      x1: X0 + w * u,
      x2: X0 + w * u,
      y1: TY + TH,
      y2: TY + TH + 8,
      stroke: "var(--lsx-muted)",
      "stroke-width": 2,
    }),
    txt: text({ x: X0 + w * u, y: TY + TH + 26, text: w, fill: "var(--lsx-muted)" }),
  }));
  const endTick = el("line", {
    x1: X0 + Dn * u,
    x2: X0 + Dn * u,
    y1: TY + TH,
    y2: TY + TH + 12,
    stroke: "var(--lsx-hi)",
    "stroke-width": 3,
  });
  const endTxt = text({
    x: Math.min(Math.max(X0 + Dn * u, X0 + 20), X0 + TW - 20),
    y: TY + TH + 48,
    "font-size": 17,
    fill: "var(--lsx-hi)",
  });
  const cuts = Array.from({ length: whole }, (_, w) =>
    text({ x: X0 + (w + 0.5) * u, y: TY + TH + 70, fill: "var(--lsx-muted)", "font-size": 15 }),
  );
  const counter = text({ x: W / 2, y: 52, "font-size": 26, "font-weight": 800 });
  const ghostBox = el("rect", {
    x: X0,
    y: 254,
    width: g * pw,
    height: 20,
    rx: 3,
    fill: "var(--lsx-u)",
    stroke: "var(--lsx-ink)",
    "stroke-width": 2,
  });
  const ghostTxt = text({ x: X0 + g * pw + 12, y: 270, "text-anchor": "start", "font-size": 16 });
  const all = [
    ...tracks,
    ...cells,
    ...marks.flatMap((m) => [m.box, m.num]),
    ...ticks.flatMap((t) => [t.line, t.txt]),
    endTick,
    endTxt,
    ...cuts,
    counter,
    ghostBox,
    ghostTxt,
  ];
  return {
    spec,
    hide: () => all.map((e) => [e, { opacity: 0 }]),
    show(o) {
      const m = [];
      const k = o.k || 0;
      const grouped = o.mode === "groups";
      const c = grouped || k > 0 ? q : o.cut || 1;
      tracks.forEach((t) => m.push([t, { opacity: 1 }]));
      cells.forEach((cell, i) => {
        const s = Math.floor((i * c) / q);
        const x = X0 + (s / c) * u;
        const w = Math.min(u / c, (Dn - s / c) * u);
        const covered = grouped && Math.floor(i / g) < k;
        cell.setAttribute(
          "fill",
          grouped ? (covered ? "var(--lsx-u)" : "var(--lsx-card)") : "var(--lsx-x)",
        );
        cell.setAttribute("stroke", grouped && covered ? "var(--lsx-u-edge)" : "var(--lsx-x-edge)");
        m.push([cell, { x, width: w, opacity: 1 }]);
      });
      marks.forEach((mk, j) => {
        const on = grouped && j < k;
        const showNum = on && (Q <= 14 || (j + 1) % 2 === 0 || j + 1 === Q);
        mk.num.textContent = String(j + 1);
        m.push([mk.box, { x: X0 + j * g * pw, width: g * pw, opacity: on ? 1 : 0 }]);
        m.push([mk.num, { x: X0 + (j + 0.5) * g * pw, opacity: showNum ? 1 : 0 }]);
      });
      ticks.forEach((t) => m.push([t.line, { opacity: 1 }], [t.txt, { opacity: 1 }]));
      const showEnd = !!o.end && !isWhole(D);
      endTxt.textContent = showEnd ? o.end : "";
      m.push([endTick, { opacity: showEnd ? 1 : 0 }], [endTxt, { opacity: showEnd ? 1 : 0 }]);
      cuts.forEach((t, w) => {
        const inWhole = Math.round((Math.min(w + 1, Dn) - w) * c);
        const label = o.labels && c > 1 ? o.labels(inWhole, c) : "";
        t.textContent = label || "";
        m.push([t, { opacity: label ? 1 : 0 }]);
      });
      counter.textContent = o.counter || "";
      m.push([counter, { opacity: o.counter ? 1 : 0 }]);
      ghostTxt.textContent = o.ghost || "";
      m.push([ghostBox, { opacity: o.ghost ? 1 : 0 }], [ghostTxt, { opacity: o.ghost ? 1 : 0 }]);
      return m;
    },
  };
}

export function buildFractionGroupsPlay(cfg) {
  const v = validateFractionGroups(cfg);
  if (!v) return null;
  const T = fractionGroupsCopy(v);
  const { mode, main, transfer, extra } = v;
  const spec = main.spec;
  const { D, B, Q } = spec;
  const Dt = mode === "mixed" ? mixed(D) : fmt(D);
  const Bt = fmt(B);
  /** @type {Map<string, ReturnType<typeof makeTape>>} */
  const tapes = new Map();

  function setup(ctx) {
    ctx.svg.innerHTML = "";
    const g = ctx.svgEl("g", {}, ctx.svg);
    for (const s of v.specs) if (!tapes.has(s.key)) tapes.set(s.key, makeTape(ctx, g, s));
    ctx.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  }

  /** Draw one tape in a state and clear every other tape. */
  function view(ctx, s, o, ms) {
    const moves = [];
    for (const [key, tape] of tapes) {
      if (key === s.key) moves.push(...tape.show(o));
      else moves.push(...tape.hide());
    }
    return ctx.tween(moves, ms);
  }
  const ghost = (ctx, s, share = false) =>
    ctx.L(share ? T.word.oneShare(s.B) : T.word.oneGroup(s.B));
  const base = (ctx, s, over = {}) => ({
    mode: "amount",
    cut: 1,
    k: 0,
    ghost: ghost(ctx, s),
    end: mixed(s.D),
    ...over,
  });
  const dText = (s) => (mode === "mixed" ? mixed(s.D) : fmt(s.D));
  const labelsOf = (ctx) => (count, c) => ctx.L(pieces(c, count));
  const full = (ctx, s, over = {}) =>
    base(ctx, s, {
      mode: "groups",
      cut: s.q,
      k: s.Q,
      counter: ctx.L(T.word.groups(s.Q)),
      end: dText(s),
      ...over,
    });
  const pointer = (ctx, s, over = {}) =>
    base(ctx, s, { mode: "groups", cut: s.q, k: Math.min(2, s.Q), end: dText(s), ...over });
  const quotientOptions = (s, seed) =>
    seat(
      quotientChoices(s).map((o) => ({
        label: T.quotientLabel(o.value),
        correct: o.correct,
        cue: o.correct ? null : T.quotientCue[o.kind](o.value, s),
      })),
      seed,
    );

  const scenes = [];
  scenes.push({
    id: "situate",
    label: T.scene.situate,
    async enter(ctx) {
      ctx.expr(`${hi(Dt)} ÷ ${lo(Bt)} = ?`);
      ctx.say(T.situateSay);
      await view(ctx, spec, base(ctx, spec, { ghost: null, end: dText(spec) }), 0);
      await view(ctx, spec, base(ctx, spec, { end: dText(spec) }), 500);
    },
  });

  scenes.push({
    id: "predict",
    label: T.scene.predict,
    gate: true,
    async enter(ctx, saved) {
      const b = base(ctx, spec, { end: dText(spec) });
      await view(ctx, spec, b, 250);
      ctx.expr(`${hi(Dt)} ÷ ${lo(Bt)} = ?`);
      ctx.say(T.predictSay);
      const story = mode === "story";
      const options = story
        ? seat(
            equationChoices(D, B).map((o) => ({
              label: { en: o.text, es: o.text },
              correct: o.correct,
              cue: o.correct ? null : T.equationCue[o.kind],
            })),
            Q + 1,
          )
        : quotientOptions(spec, Q + 1);
      ctx.panel.appendChild(
        ctx.choices({
          question: T.predictQ,
          options,
          restore: saved.solved ? options.findIndex((o) => o.correct) : null,
          onMiss: (_i, opt) => {
            ctx.feedback(opt.cue, "cue");
            view(ctx, spec, pointer(ctx, spec), 300);
          },
          onCorrect: () => {
            ctx.state.solved = true;
            ctx.feedback(story ? T.equationOk : T.predictOk);
            ctx.unlock();
            view(ctx, spec, b, 300);
          },
        }),
      );
    },
  });

  scenes.push({
    id: "place",
    label: T.scene.place,
    gate: true,
    async enter(ctx, saved) {
      const st = ctx.state;
      const at = (k) => full(ctx, spec, { k, counter: k ? ctx.L(T.word.groups(k)) : "" });
      let k = saved.found
        ? Q
        : Number.isInteger(saved.k) && saved.k >= 0 && saved.k <= Q
          ? saved.k
          : 0;
      const paint = (ms) => {
        ctx.expr(
          k
            ? `${hi(String(k))} × ${lo(Bt)} = ${escHtml(product(k))}`
            : `${hi("0")} × ${lo(Bt)} = 0`,
        );
        return view(ctx, spec, at(k), ms);
      };
      const product = (n) => {
        const raw = `${n * B.n}/${B.d}`;
        const red = mixed(frac(n * B.n, B.d));
        return red === raw ? raw : `${raw} = ${red}`;
      };
      const rng = ctx.range({
        label: T.placeLabel,
        min: 0,
        max: Q,
        value: k,
        onInput: (val) => {
          k = val;
          st.k = k;
          if (k === Q) {
            st.found = true;
            ctx.feedback(T.placeOk);
            ctx.unlock();
          } else ctx.feedback(T.placeLeft(k), "cue");
          ctx.save();
          paint(120);
        },
      });
      ctx.panel.appendChild(rng);
      ctx.say(T.placeSay);
      await paint(300);
      if (k === Q) ctx.feedback(T.placeOk);
      else if (k) ctx.feedback(T.placeLeft(k), "cue");
    },
  });

  if (mode === "mixed") {
    scenes.push({
      id: "convert",
      label: T.scene.convert,
      gate: true,
      async enter(ctx, saved) {
        const cutHalves = (over = {}) =>
          base(ctx, spec, { cut: D.d, labels: labelsOf(ctx), end: mixed(D), ...over });
        await view(ctx, spec, base(ctx, spec, { end: mixed(D) }), 300);
        ctx.expr(`${hi(Dt)} = ?/${D.d}`);
        ctx.say(T.convertSay);
        const options = seat(
          convertChoices(D).map((o) => ({
            label: { en: o.text, es: o.text },
            correct: o.correct,
            cue: o.correct ? null : T.convertCue[o.kind],
          })),
          D.n + 1,
        );
        const done = (ms) => {
          ctx.expr(`${escHtml(Dt)} = ${hi(fmt(D))}`);
          return view(ctx, spec, cutHalves(), ms);
        };
        ctx.panel.appendChild(
          ctx.choices({
            question: T.convertQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(opt.cue, "cue");
              view(ctx, spec, cutHalves(), 350);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.convertOk);
              ctx.unlock();
              done(450);
            },
          }),
        );
        if (saved.solved) await done(0);
      },
    });
  }

  scenes.push({
    id: "connect",
    label: T.scene.connect,
    async enter(ctx, saved) {
      const steps = connectSteps(spec, { roles: mode === "story" });
      const st = ctx.state;
      let i =
        Number.isInteger(saved.step) && saved.step >= 0 && saved.step < steps.length
          ? saved.step
          : 0;
      const row = document.createElement("div");
      row.className = "lsx-choices";
      const next = ctx.button({ label: T.nextStep, primary: true, onClick: () => go(i + 1, 450) });
      row.appendChild(next);
      ctx.panel.appendChild(row);
      const go = (n, ms) => {
        i = n;
        st.step = i;
        ctx.save();
        const s = steps[i];
        ctx.expr(emph(ctx.L(s.expr)));
        ctx.say(s.say);
        next.hidden = i >= steps.length - 1;
        const over = s.groups
          ? full(ctx, spec, { k: s.groups })
          : base(ctx, spec, {
              cut: s.cut,
              labels: s.cut > 1 ? labelsOf(ctx) : null,
              end: dText(spec),
            });
        return view(ctx, spec, over, ms);
      };
      await go(i, 0);
    },
  });

  if (extra) {
    const es = extra.spec;
    if (extra.kind === "share") {
      scenes.push({
        id: "share",
        label: T.scene.share,
        gate: true,
        async enter(ctx, saved) {
          const b = base(ctx, es, { ghost: null, end: dText(es) });
          await view(ctx, es, b, 300);
          ctx.expr(`${hi(fmt(es.D))} ${escHtml("÷")} ${lo(String(extra.shares))} = ?`);
          ctx.say(T.extra.say);
          const options = seat(
            shareChoices(es.D, extra.shares).map((o) => ({
              label: { en: o.text, es: o.text },
              correct: o.correct,
              cue: o.correct ? null : T.extra.cue[o.kind],
            })),
            extra.shares + 2,
          );
          const shown = (ms) =>
            view(
              ctx,
              es,
              full(ctx, es, {
                counter: ctx.L(T.word.shares(es.Q)),
                ghost: ghost(ctx, es, true),
              }),
              ms,
            );
          const done = (ms) => {
            ctx.expr(`${escHtml(fmt(es.D))} ÷ ${escHtml(String(extra.shares))} = ${hi(fmt(es.B))}`);
            return shown(ms);
          };
          ctx.panel.appendChild(
            ctx.choices({
              question: T.extra.q,
              options,
              restore: saved.solved ? options.findIndex((o) => o.correct) : null,
              onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
              onCorrect: () => {
                ctx.state.solved = true;
                ctx.feedback(T.extra.ok);
                ctx.unlock();
                done(450);
              },
            }),
          );
          if (saved.solved) {
            await done(0);
            ctx.feedback(T.extra.ok);
          }
        },
      });
    } else {
      scenes.push({
        id: "bigger",
        label: T.scene.bigger,
        gate: true,
        async enter(ctx, saved) {
          const b = base(ctx, es, { end: dText(es) });
          await view(ctx, es, b, 300);
          ctx.expr(`${hi(fmt(es.D))} ÷ ${lo(fmt(es.B))} = ?`);
          ctx.say(T.extra.say);
          const options = quotientOptions(es, es.Q + 2);
          const done = (ms) => {
            ctx.expr(`${escHtml(fmt(es.D))} ÷ ${escHtml(fmt(es.B))} = ${hi(String(es.Q))}`);
            return view(ctx, es, full(ctx, es), ms);
          };
          ctx.panel.appendChild(
            ctx.choices({
              question: T.extra.q,
              options,
              restore: saved.solved ? options.findIndex((o) => o.correct) : null,
              onMiss: (_i, opt) => {
                ctx.feedback(opt.cue, "cue");
                view(ctx, es, pointer(ctx, es), 300);
              },
              onCorrect: () => {
                ctx.state.solved = true;
                ctx.feedback(T.extra.ok);
                ctx.unlock();
                done(450);
              },
            }),
          );
          if (saved.solved) {
            await done(0);
            ctx.feedback(T.extra.ok);
          }
        },
      });
    }
  }

  scenes.push({
    id: "transfer",
    label: T.scene.transfer,
    async enter(ctx, saved) {
      const ts = transfer.spec;
      const b = base(ctx, ts, { end: dText(ts) });
      await view(ctx, ts, b, 300);
      ctx.expr(`${hi(dText(ts))} ÷ ${lo(fmt(ts.B))} = ?`);
      ctx.say(T.transferSay);
      const options = quotientOptions(ts, ts.Q + 1);
      const done = (ms) => {
        ctx.expr(`${escHtml(dText(ts))} ÷ ${escHtml(fmt(ts.B))} = ${hi(String(ts.Q))}`);
        return view(ctx, ts, full(ctx, ts), ms);
      };
      ctx.panel.appendChild(
        ctx.choices({
          question: T.transferQ,
          options,
          restore: saved.solved ? options.findIndex((o) => o.correct) : null,
          onMiss: (_i, opt) => {
            ctx.feedback(opt.cue, "cue");
            view(ctx, ts, pointer(ctx, ts), 300);
          },
          onCorrect: () => {
            ctx.state.solved = true;
            ctx.save();
            ctx.feedback(T.transferOk);
            done(450);
          },
        }),
      );
      if (saved.solved) {
        await done(0);
        ctx.feedback(T.transferOk);
      }
      ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
    },
  });

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
