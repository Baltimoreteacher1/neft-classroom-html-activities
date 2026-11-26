// living/order-line.js — comparing and ordering integers by POSITION on a
// number line (Lesson 7-4: the five treasures −2, −7, −5, 3 and −9).
//
// One horizontal, equally spaced line with one dot per treasure, and a row of
// number chips under it. The student compares −7 and −5 (the digit trap), puts
// all five in order by tapping the least one left, reads the chain with <,
// sees that ordering by distance from 0 gives a DIFFERENT order for negative
// numbers, and compares one more pair.
//
// Config: { min, max, labelEvery, story, compare:{a,b}, items:[{v,name}],
//           transfer:{a,b} }  (see validateOrderLine)

import { escHtml, svgEl } from "../../core/living-scene.js";
import { num, slotFor } from "./numline-model.js";
import { createStage, layoutFor } from "./numline-stage.js";
import {
  compareChoices,
  distanceOrder,
  leastOf,
  orderCopy,
  placeCorrect,
  statementChoices,
  validateOrderLine,
  valueOrder,
} from "./order-line-model.js";

export { validateOrderLine };

const TRIM = 40; // no bars here, so the top of the stage is trimmed
const EXTRA_H = 44;
const CHIP_W = 52;
const CHIP_H = 32;

export function buildOrderLinePlay(cfg) {
  const v = validateOrderLine(cfg);
  if (!v) return null;
  const T = orderCopy(v);
  const { items, compare: cmp, transfer: tr } = v;
  const n = items.length;
  const lay = layoutFor("h", { top: TRIM, extraH: EXTRA_H });
  const W = lay.W;
  const CY = lay.line + 66;
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const scale = { min: v.min, max: v.max, labelEvery: v.labelEvery, tickEvery: 1 };
  const idx = (x) => items.findIndex((it) => it.v === x);
  const vOrder = valueOrder(items);
  const dOrder = distanceOrder(items);
  const slotX = (k) => lay.pad + ((k + 0.5) * (W - 2 * lay.pad)) / n;
  let stage = null;
  let chips = [];
  let signs = [];
  let cap = null;

  function setup(ctx) {
    stage = createStage(ctx, { axis: "h", top: TRIM, extraH: EXTRA_H });
    stage.scale(scale);
    items.forEach((_, i) => stage.mark(`m${i}`, "x"));
    const g = stage.layer;
    const label = (extra) =>
      svgEl(
        "text",
        {
          opacity: 0,
          y: CY + 6,
          "text-anchor": "middle",
          "font-size": 18,
          "font-weight": 800,
          fill: "var(--lsx-ink)",
          ...extra,
        },
        g,
      );
    chips = items.map((it) => {
      const x = stage.geo.pos(it.v);
      return {
        rect: svgEl(
          "rect",
          {
            opacity: 0,
            x: x - CHIP_W / 2,
            y: CY - CHIP_H / 2,
            width: CHIP_W,
            height: CHIP_H,
            rx: 8,
            fill: "var(--lsx-card)",
            stroke: "var(--lsx-ink)",
            "stroke-width": 2,
          },
          g,
        ),
        text: label({ x, text: num(it.v) }),
      };
    });
    signs = Array.from({ length: n - 1 }, () => label({ x: W / 2, text: "<" }));
    cap = label({
      x: W / 2,
      y: CY + CHIP_H + 8,
      "font-size": 16,
      "font-weight": 700,
      fill: "var(--lsx-muted)",
    });
  }

  /** Chips: `order` lists item indices left→right; only those in `shown` appear. */
  function chipsView(ctx, { order = vOrder, shown = [], showSigns = false, caption = null }, ms) {
    const m = [];
    chips.forEach((c, i) => {
      const k = order.indexOf(i);
      const on = shown.includes(i);
      const cx = on ? slotX(k) : stage.geo.pos(items[i].v);
      m.push([c.rect, { opacity: on ? 1 : 0, x: cx - CHIP_W / 2 }]);
      m.push([c.text, { opacity: on ? 1 : 0, x: cx }]);
    });
    signs.forEach((s, k) => {
      const both = shown.includes(order[k]) && shown.includes(order[k + 1]);
      m.push([s, { opacity: showSigns && both ? 1 : 0, x: (slotX(k) + slotX(k + 1)) / 2 }]);
    });
    m.push([cap, { opacity: caption ? 1 : 0, text: caption ? ctx.L(caption) : "" }]);
    return ctx.tween(m, ms);
  }
  const dots = (idxs) =>
    Object.fromEntries(idxs.map((i) => [`m${i}`, { v: items[i].v, label: num(items[i].v) }]));
  const view = (ctx, o, ms) =>
    Promise.all([stage.show(ctx, o.stage || {}, ms), chipsView(ctx, o.chips || {}, ms)]);
  const everyIdx = items.map((_, i) => i);
  const pair = (a, b) => [idx(a), idx(b)];

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.expr("");
        ctx.say(T.situateSay);
        await view(ctx, {}, 0);
        for (let k = 1; k <= n; k++) await view(ctx, { stage: dots(everyIdx.slice(0, k)) }, 220);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        const [ia, ib] = pair(cmp.a, cmp.b);
        const st = dots([ia, ib]);
        const reveal = (ms) => {
          ctx.expr(hi(`${num(cmp.a)} < ${num(cmp.b)}`));
          return view(ctx, { stage: { ...st, band: { a: cmp.a, b: cmp.b } } }, ms);
        };
        ctx.say(T.predictSay);
        if (saved.solved) await reveal(0);
        else {
          ctx.expr(hi(`${num(cmp.a)} ? ${num(cmp.b)}`));
          await view(ctx, { stage: st }, 400);
        }
        const options = placeCorrect(
          compareChoices().map((o) => ({ ...o, label: T.predictLabel(o.kind) })),
          slotFor(Math.abs(cmp.a), 3),
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.predictCue(opt.kind), "cue");
              return view(ctx, { stage: { ...st, ghost: { v: cmp.a } } }, 250);
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              await reveal(700);
            },
          }),
        );
        if (saved.solved) ctx.feedback(T.predictOk);
      },
    },
    {
      id: "order",
      label: T.scene.order,
      gate: true,
      async enter(ctx, saved) {
        const st = ctx.state;
        const ok = Array.isArray(saved.picked) && saved.picked.every((x, k) => x === vOrder[k]);
        let picked = ok ? [...saved.picked] : [];
        const q = document.createElement("p");
        q.className = "lsx-q";
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.setAttribute("role", "group");
        const btns = items.map((_, i) => {
          const b = ctx.button({ label: T.orderBtn(i), onClick: () => pick(i) });
          row.appendChild(b);
          return b;
        });
        const paint = (ms, ghost = null) => {
          const left = everyIdx.filter((i) => !picked.includes(i));
          btns.forEach((b, i) => {
            b.hidden = picked.includes(i);
          });
          q.textContent = left.length ? ctx.L(T.orderQ(picked.length)) : "";
          ctx.expr(picked.length ? hi(picked.map((i) => num(items[i].v)).join(" < ")) : "");
          return view(
            ctx,
            {
              stage: { ...dots(everyIdx), ghost },
              chips: { order: picked.concat(left), shown: picked },
            },
            ms,
          );
        };
        function pick(i) {
          const left = everyIdx.filter((x) => !picked.includes(x));
          if (i !== leastOf(items, left)) {
            btns[i].classList.add("miss");
            ctx.feedback(T.orderCue(i, left), "cue");
            paint(250, { v: items[i].v });
            return;
          }
          picked = picked.concat(i);
          for (const b of btns) b.classList.remove("miss");
          st.picked = picked;
          ctx.save();
          if (picked.length === n) {
            ctx.feedback(T.orderOk);
            ctx.unlock();
          } else ctx.feedback(T.orderStep(i));
          paint(500);
        }
        ctx.say(T.orderSay);
        ctx.panel.append(q, row);
        await paint(saved.picked ? 0 : 400);
        if (picked.length === n) {
          ctx.feedback(T.orderOk);
          ctx.unlock();
        }
      },
    },
    {
      id: "chain",
      label: T.scene.chain,
      async enter(ctx) {
        ctx.say(T.chainSay);
        ctx.expr(hi(T.chain));
        ctx.feedback(T.chainFb);
        await view(
          ctx,
          { stage: dots(everyIdx), chips: { order: vOrder, shown: everyIdx, showSigns: true } },
          600,
        );
      },
    },
    {
      id: "trap",
      label: T.scene.trap,
      gate: true,
      async enter(ctx, saved) {
        const st = ctx.state;
        let dist = !!saved.viewed;
        const paint = (ms) => {
          ctx.expr(hi(dist ? T.dChain : T.chain));
          return view(
            ctx,
            {
              stage: dots(everyIdx),
              chips: {
                order: dist ? dOrder : vOrder,
                shown: everyIdx,
                showSigns: !dist,
                caption: dist ? T.capDist : T.capValue,
              },
            },
            ms,
          );
        };
        const toggle = ctx.button({
          label: T.trapBtn,
          primary: true,
          onClick: () => {
            dist = !dist;
            toggle.textContent = ctx.L(dist ? T.trapBack : T.trapBtn);
            if (dist) {
              st.viewed = true;
              ctx.save();
              addQuestion();
            }
            paint(600);
          },
        });
        toggle.textContent = ctx.L(dist ? T.trapBack : T.trapBtn);
        let asked = false;
        function addQuestion() {
          if (asked) return;
          asked = true;
          const O = T.trapOpts;
          const options = placeCorrect(
            [
              { kind: "no", correct: true, label: O.no },
              { kind: "near", label: O.near },
              { kind: "digit", label: O.digit },
            ],
            slotFor(n + 1, 3),
          );
          ctx.panel.appendChild(
            ctx.choices({
              question: T.trapQ,
              options,
              restore: saved.solved ? options.findIndex((o) => o.correct) : null,
              onMiss: (_i, opt) => ctx.feedback(T.trapCue[opt.kind], "cue"),
              onCorrect: () => {
                ctx.state.solved = true;
                ctx.feedback(T.trapOk);
                ctx.unlock();
              },
            }),
          );
        }
        ctx.say(T.trapSay);
        ctx.panel.appendChild(toggle);
        if (dist) addQuestion();
        if (saved.solved) ctx.feedback(T.trapOk);
        await paint(saved.viewed ? 0 : 400);
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        const [ia, ib] = pair(tr.a, tr.b);
        const st = dots([ia, ib]);
        const reveal = (ms) => {
          ctx.expr(hi(`${num(tr.a)} < ${num(tr.b)}`));
          return view(ctx, { stage: { ...st, band: { a: tr.a, b: tr.b } } }, ms);
        };
        ctx.say(T.transferSay);
        if (saved.solved) await reveal(0);
        else {
          ctx.expr("");
          await view(ctx, { stage: st }, 400);
        }
        const options = placeCorrect(
          statementChoices(tr.a, tr.b).map((o) => ({
            ...o,
            label: { en: o.text, es: o.text },
          })),
          slotFor(Math.abs(tr.a), 3),
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.transferCue(opt.kind), "cue");
              return view(
                ctx,
                { stage: { ...st, ghost: { v: opt.kind === "digits" ? tr.a : tr.b } } },
                250,
              );
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              await reveal(600);
            },
          }),
        );
        if (saved.solved) ctx.feedback(T.transferOk);
        ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
      },
    },
  ];

  return {
    kicker: T.kicker,
    title: T.title,
    viewBox: `0 0 ${W} ${lay.H}`,
    ariaLabel: T.ariaLabel,
    printSummary: T.printSummary,
    setup,
    scenes,
  };
}
