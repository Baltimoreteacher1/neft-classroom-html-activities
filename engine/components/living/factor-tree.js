// living/factor-tree.js — split until every leaf is prime (6-13).
//
// One cast for the whole play: a pool of tree nodes and the branches that join
// them. Splitting a number moves the same elements (a composite becomes two
// children), the circles at the bottom of the tree DROP into a row to become
// the written product, a different first split reuses the same pool for a
// different tree, and the transfer number grows its own tree there too.
// Shape carries the meaning, never colour alone: a prime is a circle with a
// heavy edge, a composite is a dashed square.
//
// Config: { n, split:[a,b], alt:[c,d], story?:{en,es},
//           transfer:{ n, split:[a,b] } } — 6-13 authors 60 = 6 × 10, a
// classmate's 2 × 30, and the weDo 12 = 3 × 4. Every number and sentence comes
// from factor-tree-model.js (pure, tested); this file stages it.

import { escHtml } from "../../core/living-scene.js";
import {
  factorizationChoices,
  factorTreeCopy,
  fmtPowers,
  fmtProduct,
  H,
  isPrime,
  layout,
  leavesOf,
  placeCorrect,
  powers,
  primeRow,
  splitChoices,
  splittable,
  validateFactorTree,
  visibleNodes,
  W,
} from "./factor-tree-model.js";

export { validateFactorTree };

const R = 21; // node half-size
const ROW_Y = 212;
const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;

export function buildFactorTreePlay(cfg) {
  const v = validateFactorTree(cfg);
  if (!v) return null;
  const T = factorTreeCopy(v);
  const { trees, main, alt, transfer } = v;
  const poolN = Math.max(...Object.values(trees).map((t) => t.length));
  const fullSplit = (key) => trees[key].filter((x) => x.kids.length).map((x) => x.id);
  const leafPrimes = (key) =>
    leavesOf(trees[key])
      .map((x) => x.n)
      .sort((p, q) => p - q);

  let c = null; // the cast
  let cur = "main"; // which tree the pool currently draws
  let onNode = null; // node click handler, live only while splitting

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs, parent = g) => svgEl(tag, { opacity: 0, ...attrs }, parent);
    const label = (attrs) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 19,
        "font-weight": 800,
        fill: "var(--lsx-ink)",
        ...attrs,
      });
    /** @type {{ edge: any, box?: any, txt?: any }[]} */
    const slots = Array.from({ length: poolN }, () => ({
      edge: el("line", {
        stroke: "var(--lsx-muted)",
        "stroke-width": 3,
        "stroke-linecap": "round",
        x1: W / 2,
        x2: W / 2,
        y1: 0,
        y2: 0,
      }),
    }));
    const ring = el("rect", {
      width: 2 * R + 14,
      height: 2 * R + 14,
      rx: 12,
      fill: "none",
      stroke: "var(--lsx-lo)",
      "stroke-width": 3,
    });
    for (const s of slots) {
      s.box = el("rect", { width: 2 * R, height: 2 * R, x: W / 2 - R, y: 0, rx: R });
      s.box.addEventListener("click", () => onNode?.(slots.indexOf(s)));
      s.txt = label({ x: W / 2, y: 0 });
      s.txt.style.pointerEvents = "none";
    }
    const times = Array.from({ length: 5 }, () => label({ text: "×", "font-size": 22 }));
    const groups = Array.from({ length: 6 }, () => ({
      line: el("line", { stroke: "var(--lsx-hi)", "stroke-width": 4, "stroke-linecap": "round" }),
      txt: label({ fill: "var(--lsx-hi)", "font-size": 22 }),
    }));
    const ref = label({ x: W / 2, y: 262, "font-size": 17, fill: "var(--lsx-muted)" });
    const legendY = H - 16;
    const legend = svgEl("g", {}, svg);
    svgEl(
      "rect",
      {
        x: 40,
        y: legendY - 11,
        width: 22,
        height: 22,
        rx: 11,
        fill: "var(--lsx-ok-bg)",
        stroke: "var(--lsx-x-edge)",
        "stroke-width": 4,
      },
      legend,
    );
    svgEl(
      "rect",
      {
        x: 250,
        y: legendY - 11,
        width: 22,
        height: 22,
        rx: 5,
        fill: "var(--lsx-card)",
        stroke: "var(--lsx-ink)",
        "stroke-width": 2,
        "stroke-dasharray": "5 3",
      },
      legend,
    );
    const lt = (x, p) =>
      svgEl(
        "text",
        {
          x,
          y: legendY + 5,
          "font-size": 15,
          "font-weight": 700,
          fill: "var(--lsx-muted)",
          text: ctx.L(p),
        },
        legend,
      );
    lt(70, T.legend.prime);
    lt(280, T.legend.composite);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    c = { slots, ring, times, groups, ref, legend };
  }

  /**
   * Put the whole stage in one state. o: { tree, split:[ids], row, marks,
   * groups, point (node id to ring), pick (ids drawn as splittable), ref }.
   */
  async function draw(ctx, o, ms) {
    const nodes = trees[o.tree];
    if (o.tree !== cur) {
      // A different tree: everything but the root fades, then the pool is re-labelled.
      const gone = [];
      c.slots.forEach((s, i) => {
        if (i > 0) gone.push([s.box, { opacity: 0 }], [s.txt, { opacity: 0 }]);
        gone.push([s.edge, { opacity: 0 }]);
      });
      for (const t of c.times) gone.push([t, { opacity: 0 }]);
      for (const gr of c.groups) gone.push([gr.line, { opacity: 0 }], [gr.txt, { opacity: 0 }]);
      await ctx.tween(gone, ms ? 250 : 0);
      cur = o.tree;
    }
    const vis = new Set(visibleNodes(nodes, o.split));
    const open = new Set(o.split);
    const isLeaf = (id) => !open.has(id) || !nodes[id].kids.length;
    const pos = o.row ? {} : layout(nodes, o.split);
    /** @type {{ p: number, x: number, id: number }[]} */
    let rowLeaves = [];
    if (o.row) {
      const ls = [...vis].filter(isLeaf).sort((p, q) => nodes[p].n - nodes[q].n || p - q);
      const row = primeRow(ls.map((id) => nodes[id].n));
      rowLeaves = ls.map((id, i) => ({ p: nodes[id].n, x: row[i].x, id }));
      for (const r of rowLeaves) pos[r.id] = { x: r.x, y: ROW_Y };
    }
    const m = [];
    const pick = new Set(o.pick || []);
    c.slots.forEach((s, i) => {
      const nd = nodes[i];
      const shown = !!nd && vis.has(i) && (!o.row || isLeaf(i));
      if (!shown) {
        m.push([s.box, { opacity: 0 }], [s.txt, { opacity: 0 }], [s.edge, { opacity: 0 }]);
        return;
      }
      const p = pos[i];
      const prime = isPrime(nd.n);
      const fresh = Number.parseFloat(s.box.getAttribute("opacity") || "0") === 0;
      if (fresh && !o.row && nd.parent >= 0 && pos[nd.parent]) {
        // A new child starts at its parent and slides out.
        const q = pos[nd.parent];
        s.box.setAttribute("x", String(q.x - R));
        s.box.setAttribute("y", String(q.y - R));
        s.txt.setAttribute("x", String(q.x));
        s.txt.setAttribute("y", String(q.y + 7));
      }
      s.txt.textContent = String(nd.n);
      s.box.setAttribute("fill", prime ? "var(--lsx-ok-bg)" : "var(--lsx-card)");
      s.box.setAttribute("stroke", prime ? "var(--lsx-x-edge)" : "var(--lsx-ink)");
      s.box.setAttribute("stroke-width", prime ? "4" : "2.5");
      if (!prime && pick.has(i)) s.box.setAttribute("stroke-dasharray", "6 4");
      else s.box.removeAttribute("stroke-dasharray");
      m.push([s.box, { x: p.x - R, y: p.y - R, rx: prime ? R : 6, opacity: 1 }]);
      m.push([s.txt, { x: p.x, y: p.y + 7, opacity: 1 }]);
      const par = nd.parent >= 0 ? pos[nd.parent] : null;
      if (par && !o.row)
        m.push([s.edge, { x1: par.x, y1: par.y + R, x2: p.x, y2: p.y - R, opacity: 1 }]);
      else m.push([s.edge, { opacity: 0 }]);
    });
    const ringAt = o.point != null ? pos[o.point] : null;
    m.push([
      c.ring,
      ringAt ? { x: ringAt.x - R - 7, y: ringAt.y - R - 7, opacity: 1 } : { opacity: 0 },
    ]);
    c.times.forEach((t, i) => {
      const a = rowLeaves[i];
      const b = rowLeaves[i + 1];
      m.push([
        t,
        a && b && o.marks ? { x: (a.x + b.x) / 2, y: ROW_Y + 7, opacity: 1 } : { opacity: 0 },
      ]);
    });
    const gs = [];
    for (const pw of powers(rowLeaves.map((r) => r.p))) {
      const first = gs.reduce((k, x) => k + x.e, 0);
      gs.push({ ...pw, x1: rowLeaves[first]?.x, x2: rowLeaves[first + pw.e - 1]?.x });
    }
    c.groups.forEach((gr, i) => {
      const gp = gs[i];
      if (!gp || !o.groups || gp.x1 == null) {
        m.push([gr.line, { opacity: 0 }], [gr.txt, { opacity: 0 }]);
        return;
      }
      const y = ROW_Y + R + 10;
      m.push([gr.line, { x1: gp.x1 - R, x2: gp.x2 + R, y1: y, y2: y, opacity: 1 }]);
      m.push([
        gr.txt,
        { x: (gp.x1 + gp.x2) / 2, y: y + 26, opacity: 1, text: fmtPowers(Array(gp.e).fill(gp.p)) },
      ]);
    });
    c.ref.textContent = o.ref || "";
    m.push([c.ref, { opacity: o.ref ? 1 : 0 }]);
    for (const s of c.slots) s.box.style.cursor = onNode ? "pointer" : "default";
    return ctx.tween(m, ms);
  }

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        onNode = null;
        ctx.expr(`${main.n} = ${main.split.join(" × ")}`);
        ctx.say(T.situateSay);
        await draw(ctx, { tree: "main", split: [] }, 0);
        await draw(ctx, { tree: "main", split: [0] }, 600);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        onNode = null;
        const [a, b] = main.split;
        const base = { tree: "main", split: [0], pick: [1, 2] };
        await draw(ctx, base, 300);
        ctx.expr(`${main.n} = ${a} × ${b}`);
        ctx.say(T.predictSay);
        const options = placeCorrect(
          splitChoices(a, b).map((o) => ({
            label: T.predictLabel(o.set),
            correct: o.correct,
            cue: o.wrongIn != null ? T.cueIn(o.wrongIn) : T.cueMissed(o.missed ?? a),
            point: o.wrongIn != null ? (o.wrongIn === a ? 1 : 2) : o.missed === a ? 1 : 2,
          })),
          main.n + 1,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(opt.cue, "cue");
              draw(ctx, { ...base, point: opt.point }, 200);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              draw(ctx, base, 200);
            },
          }),
        );
      },
    },
    {
      id: "grow",
      label: T.scene.grow,
      gate: true,
      async enter(ctx, saved) {
        const nodes = trees.main;
        const st = ctx.state;
        // Only splits that were really available, in an order the tree allows.
        let split = [0];
        for (const id of Array.isArray(saved.splits) ? saved.splits : []) {
          if (splittable(nodes, split).includes(id)) split = [...split, id];
        }
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.setAttribute("role", "group");
        const how = document.createElement("p");
        how.className = "lsx-q";
        how.textContent = ctx.L(T.growQ);
        ctx.panel.append(how, row);
        const paint = (ms) => {
          const open = splittable(nodes, split);
          row.innerHTML = "";
          for (const id of open) {
            row.appendChild(
              ctx.button({ label: T.splitBtn(nodes[id].n), onClick: () => doSplit(id) }),
            );
          }
          const pos = layout(nodes, split);
          const shown = visibleNodes(nodes, split)
            .filter((id) => !split.includes(id))
            .sort((p, q) => pos[p].x - pos[q].x)
            .map((id) => nodes[id].n);
          ctx.expr(`${main.n} = ${fmtProduct(shown)}`);
          return draw(ctx, { tree: "main", split, pick: open }, ms);
        };
        const finish = () => {
          onNode = null;
          ctx.feedback(T.growDone);
          ctx.unlock();
        };
        const doSplit = (id) => {
          if (!splittable(nodes, split).includes(id)) return;
          split = [...split, id];
          st.splits = split;
          ctx.save();
          const kids = nodes[id].kids.map((k) => nodes[k].n);
          ctx.feedback(T.splitDone(nodes[id].n, kids));
          paint(500).then(() => {
            if (!splittable(nodes, split).length) finish();
            else row.querySelector("button")?.focus();
          });
        };
        onNode = doSplit;
        ctx.say(T.growSay);
        // Row expression shows the visible leaves as a product while splitting.
        await paint(300);
        if (!splittable(nodes, split).length) finish();
      },
    },
    {
      id: "connect",
      label: T.scene.connect,
      async enter(ctx, saved) {
        onNode = null;
        const full = fullSplit("main");
        const fs = leafPrimes("main");
        const st = ctx.state;
        await draw(ctx, { tree: "main", split: full }, 0);
        ctx.expr(hi(`${main.n} = ${fmtProduct(fs)}`));
        ctx.say(T.connectSay[0]);
        const down = { tree: "main", split: full, row: true, marks: true };
        await draw(ctx, down, 700);
        const second = async (ms) => {
          st.stepped = true;
          ctx.save();
          ctx.panel.innerHTML = "";
          ctx.say(T.connectSay[1]);
          ctx.expr(hi(`${main.n} = ${fmtPowers(fs)}`));
          ctx.feedback(T.connectCheck);
          await draw(ctx, { ...down, groups: true }, ms);
        };
        if (saved.stepped) return second(0);
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.appendChild(
          ctx.button({
            label: { en: "Write it with an exponent", es: "Escríbelo con un exponente" },
            primary: true,
            onClick: () => second(400),
          }),
        );
        ctx.panel.appendChild(row);
      },
    },
    {
      id: "other",
      label: T.scene.other,
      gate: true,
      async enter(ctx, saved) {
        onNode = null;
        const full = fullSplit("alt");
        const fs = leafPrimes("alt");
        const ref = `${ctx.L({ en: "First tree", es: "Primer árbol" })}: ${fmtProduct(leafPrimes("main"))}`;
        await draw(ctx, { tree: "alt", split: [] }, 0);
        await draw(ctx, { tree: "alt", split: full, ref }, 700);
        ctx.expr(`${main.n} = ${alt.join(" × ")}`);
        ctx.say(T.otherSay);
        const o = T.otherOptions;
        const options = placeCorrect(
          [
            { label: o.same, correct: true },
            { label: o.diff, correct: false, cue: T.otherCues.diff },
            { label: o.order, correct: false, cue: T.otherCues.order },
            { label: o.mistake, correct: false, cue: T.otherCues.mistake },
          ],
          main.n + 2,
        );
        const done = () => {
          ctx.expr(hi(`${main.n} = ${fmtProduct(fs)}`));
          ctx.feedback(T.otherOk);
        };
        ctx.panel.appendChild(
          ctx.choices({
            question: T.otherQ,
            options,
            restore: saved.solved ? options.findIndex((x) => x.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: () => {
              ctx.state.solved = true;
              done();
              ctx.unlock();
            },
          }),
        );
        if (saved.solved) done();
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        onNode = null;
        const [ta, tb] = transfer.split;
        const full = fullSplit("transfer");
        const fs = leafPrimes("transfer");
        const done = (ms) => {
          ctx.expr(hi(`${transfer.n} = ${fmtProduct(fs)} = ${fmtPowers(fs)}`));
          ctx.feedback(T.transferOk);
          return draw(ctx, { tree: "transfer", split: full }, ms);
        };
        await draw(ctx, { tree: "transfer", split: [] }, 0);
        await draw(ctx, { tree: "transfer", split: [0] }, 500);
        ctx.expr(`${transfer.n} = ${ta} × ${tb}`);
        ctx.say(T.transferSay);
        const options = placeCorrect(
          factorizationChoices(transfer).map((o) => ({
            label: { en: o.text, es: o.text },
            correct: o.correct,
            cue: T.transferCues[o.kind],
          })),
          transfer.n + 2,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: saved.solved ? options.findIndex((x) => x.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.save();
              done(600);
            },
          }),
        );
        if (saved.solved) await done(0);
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
