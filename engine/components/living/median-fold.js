// living/median-fold.js — the median as the MIDDLE of ORDERED data.
//
// One cast for the whole play: a row of number cards. The same cards are the
// data as written (scene 1), are put in order by the student (scene 2), and are
// folded in half from both ends until the middle is left (scene 3). An even
// count leaves two middle cards (scene 4); scene 5 grows the greatest value and
// shows the middle card never moves; scene 6 is a new data set on its own.
//
// Config: { values:[odd, unsorted], even:[even count], story:{en,es},
//           whatIf:{ values:[odd], max }, transfer:{ values:[odd, unsorted], story } }
// Anything the stage cannot draw makes the play refuse (null) instead of
// drawing something wrong.

import { escHtml } from "../../core/living-scene.js";
import {
  evenChoices,
  fiveNumber,
  fmtNum,
  isNextSmallest,
  medianFoldCopy,
  medianOf,
  oddChoices,
  okInt,
  placeCorrect,
  sortedIds,
  sum,
  validateMedianFold,
  validPlaced,
} from "./median-fold-model.js";

export { validateMedianFold };

const W = 480;
const H = 214;
const CY = 100; // top of the cards
const CH = 52; // card height

const LOOK = {
  plain: {
    box: { fill: "var(--lsx-card)", stroke: "var(--lsx-ink)", "stroke-width": 2 },
    ink: "var(--lsx-ink)",
  },
  placed: {
    box: { fill: "var(--lsx-ok-bg)", stroke: "var(--lsx-x-edge)", "stroke-width": 2.5 },
    ink: "var(--lsx-ink)",
  },
  mid: {
    box: { fill: "var(--lsx-hi)", stroke: "var(--lsx-ink)", "stroke-width": 3 },
    ink: "var(--lsx-on-x)",
  },
  edit: {
    box: { fill: "var(--lsx-cue-bg)", stroke: "var(--lsx-u-edge)", "stroke-width": 3 },
    ink: "var(--lsx-ink)",
  },
};

const ids = (k) => Array.from({ length: k }, (_, i) => i);

export function buildMedianFoldPlay(cfg) {
  const v = validateMedianFold(cfg);
  if (!v) return null;
  const T = medianFoldCopy(v);
  const f = fmtNum;
  const P = Math.max(
    v.values.length,
    v.even.length,
    v.whatIf.values.length,
    v.transfer.values.length,
  );
  const NP = Math.floor(P / 2);
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const choiceOpts = (list, seed) =>
    placeCorrect(
      list.map((o) => ({ ...o, label: f(o.value) })),
      seed,
    );

  let c = null; // the cast
  let onCard = null; // card click handler, live only while a scene wants taps

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const g = svgEl("g", {}, svg);
    const cards = ids(P).map((id) => {
      const r = svgEl(
        "rect",
        { x: W / 2 - 26, y: CY, width: 52, height: CH, rx: 8, opacity: 0, ...LOOK.plain.box },
        g,
      );
      const t = svgEl(
        "text",
        {
          x: W / 2,
          y: CY + 34,
          "text-anchor": "middle",
          "font-size": 22,
          "font-weight": 800,
          fill: "var(--lsx-ink)",
          opacity: 0,
        },
        g,
      );
      const h = svgEl("rect", { x: 0, y: CY, width: 52, height: CH, fill: "transparent" }, g);
      h.addEventListener("click", () => onCard?.(id));
      return { r, t, h };
    });
    const brackets = ids(NP).map(() =>
      svgEl(
        "path",
        {
          d: "M0,0",
          fill: "none",
          stroke: "var(--lsx-x-edge)",
          "stroke-width": 3,
          "stroke-linejoin": "round",
          opacity: 0,
        },
        g,
      ),
    );
    const arrow = svgEl("polygon", { points: "0,0", fill: "var(--lsx-ink)", opacity: 0 }, g);
    const mark = svgEl(
      "text",
      {
        x: W / 2,
        y: CY + CH + 46,
        "text-anchor": "middle",
        "font-size": 19,
        "font-weight": 800,
        fill: "var(--lsx-hi)",
        opacity: 0,
      },
      g,
    );
    c = { cards, brackets, arrow, mark };
  }

  /**
   * Put the whole stage in one state; every scene calls this, so a scene looks
   * the same by Next, Back, a step dot or resume.
   * o: { order: card ids by slot, vals: value by card id, look(id), pairs, mark }
   */
  function view(ctx, o, ms) {
    const n = o.order.length;
    const sp = Math.min(84, 420 / n);
    const w = Math.min(56, sp - 8);
    const x = (s) => W / 2 + (s - (n - 1) / 2) * sp;
    const m = [];
    const slotOf = new Map(o.order.map((id, s) => [id, s]));
    c.cards.forEach((cd, id) => {
      const s = slotOf.get(id);
      const on = s != null;
      cd.h.style.display = on ? "" : "none";
      cd.h.style.cursor = onCard ? "pointer" : "default";
      if (!on) {
        m.push([cd.r, { opacity: 0 }], [cd.t, { opacity: 0 }]);
        return;
      }
      const L = LOOK[o.look(id)];
      m.push([cd.r, { x: x(s) - w / 2, y: CY, width: w, height: CH, opacity: 1, ...L.box }]);
      m.push([cd.t, { x: x(s), y: CY + 34, opacity: 1, text: String(o.vals[id]), fill: L.ink }]);
      cd.h.setAttribute("x", String(x(s) - sp / 2 + 2));
      cd.h.setAttribute("width", String(sp - 4));
    });
    const np = Math.floor(n / 2);
    c.brackets.forEach((b, k) => {
      if (k < np) {
        const y0 = CY - 6;
        const yt = y0 - (20 + (np - 1 - k) * 14);
        b.setAttribute("d", `M${x(k)},${y0} V${yt} H${x(n - 1 - k)} V${y0}`);
      }
      m.push([b, { opacity: k < (o.pairs || 0) && k < np ? 1 : 0 }]);
    });
    if (o.mark) {
      const mx = x(o.mark.slot);
      const ay = CY + CH;
      c.arrow.setAttribute("points", `${mx - 9},${ay + 22} ${mx},${ay + 7} ${mx + 9},${ay + 22}`);
      c.mark.textContent = ctx.L(o.mark.label);
      m.push([c.mark, { x: mx, opacity: 1 }]);
    } else m.push([c.mark, { opacity: 0 }]);
    m.push([c.arrow, { opacity: o.mark ? 1 : 0 }]);
    return ctx.tween(m, ms);
  }

  const scenes = [
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        onCard = null;
        const vals = v.values;
        ctx.expr(escHtml(T.list));
        ctx.say(T.predictSay);
        const shown = view(
          ctx,
          { order: ids(vals.length), vals, look: () => "plain" },
          saved.solved ? 0 : 400,
        );
        const options = choiceOpts(oddChoices(vals), sum(vals) + vals.length);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.cueOdd(opt, vals), "cue"),
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
            },
          }),
        );
        await shown;
      },
    },
    {
      id: "order",
      label: T.scene.order,
      gate: true,
      async enter(ctx) {
        const vals = v.values;
        const n = vals.length;
        const st = ctx.state;
        if (!validPlaced(vals, st.placed)) st.placed = [];
        const placed = st.placed;
        const orderNow = () => [...placed, ...ids(n).filter((i) => !placed.includes(i))];
        const finished = () => placed.length === n;
        const btns = vals.map((x, i) => ctx.button({ label: String(x), onClick: () => pick(i) }));
        const paint = (ms) => {
          btns.forEach((b, i) => {
            b.disabled = placed.includes(i);
          });
          ctx.expr(
            escHtml(
              orderNow()
                .map((i) => vals[i])
                .join(", "),
            ),
          );
          return view(
            ctx,
            { order: orderNow(), vals, look: (id) => (placed.includes(id) ? "placed" : "plain") },
            ms,
          );
        };
        const done = () => {
          onCard = null;
          ctx.feedback(T.orderDone);
          ctx.unlock();
        };
        function pick(id) {
          if (finished() || placed.includes(id)) return;
          if (!isNextSmallest(vals, placed, id)) {
            ctx.feedback(T.orderCue(vals[id]), "cue");
            return;
          }
          placed.push(id);
          ctx.save();
          ctx.feedback("");
          paint(450).then(() => finished() && done());
        }
        onCard = pick;
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", ctx.L(T.orderHow));
        row.append(...btns);
        const how = document.createElement("p");
        how.className = "lsx-q";
        how.textContent = ctx.L(T.orderHow);
        ctx.panel.append(how, row);
        ctx.say(T.orderSay);
        await paint(300);
        if (finished()) done();
      },
    },
    {
      id: "fold",
      label: T.scene.fold,
      gate: true,
      async enter(ctx) {
        onCard = null;
        const vals = v.values;
        const n = vals.length;
        const order = sortedIds(vals);
        const sv = order.map((i) => vals[i]);
        const med = fiveNumber(vals).med;
        const np = Math.floor(n / 2);
        const st = ctx.state;
        if (!okInt(st.pairs, 0, np)) st.pairs = 0;
        const midSlot = (n - 1) / 2;
        const paint = (ms) => {
          const done = st.pairs === np;
          ctx.expr(
            done ? `${escHtml(ctx.L(T.medianWord))} = ${hi(f(med))}` : escHtml(sv.join(", ")),
          );
          return view(
            ctx,
            {
              order,
              vals,
              pairs: st.pairs,
              look: (id) => (done && order.indexOf(id) === midSlot ? "mid" : "placed"),
              mark: done ? { slot: midSlot, label: T.markLabel(med) } : null,
            },
            ms,
          );
        };
        const btn = ctx.button({
          label: T.foldBtn,
          primary: true,
          onClick: () => {
            if (st.pairs >= np) return;
            st.pairs += 1;
            ctx.save();
            const k = st.pairs - 1;
            btn.disabled = st.pairs === np;
            if (st.pairs === np) {
              ctx.feedback(T.foldDone);
              ctx.unlock();
            } else ctx.feedback(T.foldStep(sv[k], sv[n - 1 - k]));
            paint(500);
          },
        });
        ctx.panel.appendChild(btn);
        ctx.say(T.foldSay);
        await paint(300);
        btn.disabled = st.pairs === np;
        if (st.pairs === np) {
          ctx.feedback(T.foldDone);
          ctx.unlock();
        }
      },
    },
    {
      id: "even",
      label: T.scene.even,
      gate: true,
      async enter(ctx, saved) {
        onCard = null;
        const ev = fiveNumber(v.even);
        const ne = ev.n;
        const vals = ev.sorted;
        const mids = [ne / 2 - 1, ne / 2];
        const draw = (solved, pointer, ms) =>
          view(
            ctx,
            {
              order: ids(ne),
              vals,
              pairs: solved ? ne / 2 : 0,
              look: (id) => ((solved || pointer) && mids.includes(id) ? "mid" : "placed"),
              mark: solved ? { slot: (ne - 1) / 2, label: T.markLabel(ev.med) } : null,
            },
            ms,
          );
        ctx.say(T.evenSay);
        ctx.expr(saved.solved ? escHtml(T.evenExpr) : escHtml(vals.join(", ")));
        if (saved.solved) ctx.feedback(T.evenOk);
        const shown = draw(!!saved.solved, false, saved.solved ? 0 : 400);
        const options = choiceOpts(evenChoices(v.even), sum(vals) + ne);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.evenQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.cueEven(opt), "cue");
              draw(false, true, 300);
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.evenOk);
              ctx.expr(escHtml(T.evenExpr));
              ctx.unlock();
              await draw(true, false, 600);
            },
          }),
        );
        await shown;
      },
    },
    {
      id: "whatIf",
      label: T.scene.whatIf,
      gate: true,
      async enter(ctx) {
        onCard = null;
        const w0 = v.whatIf.values;
        const nw = w0.length;
        const top = w0[nw - 1];
        const mx = v.whatIf.max;
        const wmed = medianOf(w0);
        const st = ctx.state;
        st.seen = Array.isArray(st.seen) ? st.seen.filter((x) => okInt(x, top, mx)) : [];
        const start = st.seen.length ? st.seen[st.seen.length - 1] : top;
        const table = document.createElement("p");
        table.className = "lsx-fb";
        table.setAttribute("aria-live", "polite");
        const apply = (g, ms) => {
          const vals = [...w0.slice(0, nw - 1), g];
          table.innerHTML = ctx.L(T.whatIfRow(g, vals, escHtml));
          ctx.expr(escHtml(vals.join(", ")));
          return view(
            ctx,
            {
              order: ids(nw),
              vals,
              pairs: Math.floor(nw / 2),
              look: (id) => (id === nw - 1 ? "edit" : id === (nw - 1) / 2 ? "mid" : "placed"),
              mark: { slot: (nw - 1) / 2, label: T.markLabel(wmed) },
            },
            ms,
          );
        };
        const progress = () => {
          if (st.seen.length >= 3) {
            ctx.feedback(T.whatIfLesson);
            ctx.unlock();
          } else ctx.feedback(st.seen.length ? T.tryMore(3 - st.seen.length) : T.tryThree, "cue");
        };
        ctx.say(T.whatIfSay);
        const rng = ctx.range({
          label: T.greatest,
          min: top,
          max: mx,
          value: start,
          onInput: async (val) => {
            if (val !== top && !st.seen.includes(val)) st.seen.push(val);
            ctx.save();
            await apply(val, 200);
            progress();
          },
        });
        ctx.panel.append(rng, table);
        await apply(start, 500);
        progress();
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        onCard = null;
        const tv = v.transfer.values;
        const nt = tv.length;
        const TS = fiveNumber(tv);
        const order = sortedIds(tv);
        const draw = (solved, ms) =>
          view(
            ctx,
            solved
              ? {
                  order,
                  vals: tv,
                  pairs: Math.floor(nt / 2),
                  look: (id) => (order.indexOf(id) === (nt - 1) / 2 ? "mid" : "placed"),
                  mark: { slot: (nt - 1) / 2, label: T.markLabel(TS.med) },
                }
              : { order: ids(nt), vals: tv, look: () => "plain" },
            ms,
          );
        ctx.expr(escHtml(tv.join(", ")));
        ctx.say(T.transferSay);
        if (saved.solved) ctx.feedback(T.transferOk);
        const shown = draw(!!saved.solved, saved.solved ? 0 : 400);
        const options = choiceOpts(oddChoices(tv), sum(tv) + 2 * nt + 1);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.cueOdd(opt, tv), "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              await draw(true, 600);
            },
          }),
        );
        ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
        await shown;
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
