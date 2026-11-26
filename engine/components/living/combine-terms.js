// living/combine-terms.js — like terms are the same kind of tile.
//
// One cast for scenes 1-5: 6x + 4 + 2x + 7 as four bags — x-tiles (teal, long)
// and plain number tiles (amber, square), the same tile language as the
// distribute play. The student sorts the tiles into an x pile and a number
// pile: tiles of one kind stack and are counted (8x, 11), and a tile put on the
// wrong pile does not belong there. Scene 5 gives every x-tile a length, so
// 8x + 11 and 6x + 4 + 2x + 7 are the SAME strip at every value, while the
// answer that joins everything (19x) is not. Scene 6 runs the idea on two
// letters (microphones and stands) that never combine with each other.
//
// Config: { terms:["6x","4","2x","7"], xMax, start, story,
//           transfer:{ terms:["4m","2m","6m","3s","5s","1s"], names:{m,s}, story } }
// — the lesson's own expressions (6-15 authors 6x + 4 + 2x + 7 and 4m + 2m + 6m
// + 3s + 5s + 1s).

import { escHtml } from "../../core/living-scene.js";
import {
  combine,
  combineCopy,
  MIN_X,
  mainChoices,
  placeCorrect,
  termText,
  transferChoices,
  validateCombineTerms,
  valueAt,
} from "./combine-terms-model.js";

export { validateCombineTerms };

const W = 480;
const MAIN = {
  top: 30,
  pitch: 50,
  tw: 38,
  ts: 24,
  th: 30,
  gap: 4,
  bagX: 74,
  pileX: 70,
  pileGap: 52,
};
const TRANS = {
  top: 26,
  pitch: 42,
  tw: 28,
  ts: 22,
  th: 26,
  gap: 3,
  bagX: 72,
  pileX: 60,
  pileGap: 42,
};
const STRIP_TH = 28;
const LOOKS = [
  { fill: "var(--lsx-x)", stroke: "var(--lsx-x-edge)", ink: "var(--lsx-on-x)" },
  { fill: "var(--lsx-u)", stroke: "var(--lsx-u-edge)", ink: "var(--lsx-ink)" },
];

export function buildCombineTermsPlay(cfg) {
  const v = validateCombineTerms(cfg);
  if (!v) return null;
  const { terms, v: letter, xMax, start } = v;
  const T = combineCopy(v);
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;
  const [vk, ck] = combine(terms);
  const U = 400 / (vk.sum * xMax + ck.sum); // one unit, in stage units, in the value-of-x strips
  let main = null;
  let trans = null;

  /** One set of bags and piles for a list of terms; scenes move its tiles, never rebuild them. */
  function makeCast(ctx, parent, list, geom) {
    const { svgEl } = ctx;
    const g = svgEl("g", { opacity: 0 }, parent);
    const kinds = combine(list);
    const kindOf = (t) => kinds.findIndex((k) => k.key === (t.v ?? "#"));
    const el = (tag, attrs) => svgEl(tag, attrs, g);
    const cast = {
      g,
      kinds,
      geom,
      frames: list.map((t, i) =>
        el("rect", {
          x: 12,
          y: geom.top + i * geom.pitch - 6,
          width: 80 + t.coef * ((t.v ? geom.tw : geom.ts) + geom.gap),
          height: geom.th + 12,
          rx: 10,
          fill: "var(--lsx-paper)",
          stroke: "var(--lsx-muted)",
          "stroke-width": 2,
          "stroke-dasharray": "6 4",
        }),
      ),
      labels: list.map((t, i) =>
        el("text", {
          x: 24,
          y: geom.top + i * geom.pitch + geom.th * 0.75,
          "font-size": 20,
          "font-weight": 800,
          fill: "var(--lsx-ink)",
          text: termText(t),
        }),
      ),
      tiles: list.map((t, i) => {
        const look = LOOKS[Math.min(kindOf(t), 1)];
        return Array.from({ length: t.coef }, () => ({
          rect: el("rect", {
            x: 0,
            y: geom.top + i * geom.pitch,
            width: t.v ? geom.tw : geom.ts,
            height: geom.th,
            rx: 4,
            fill: look.fill,
            stroke: look.stroke,
            "stroke-width": 2,
          }),
          txt: t.v
            ? el("text", {
                x: 0,
                y: geom.top + i * geom.pitch + geom.th * 0.72,
                "text-anchor": "middle",
                "font-size": 17,
                "font-weight": 800,
                fill: look.ink,
                text: t.v,
              })
            : null,
        }));
      }),
      kindLabels: kinds.map((_k, ki) =>
        el("text", {
          x: 14,
          y: 0,
          "font-size": 22,
          "font-weight": 800,
          fill: ki === 0 ? "var(--lsx-hi)" : "var(--lsx-lo)",
          text: "",
          opacity: 0,
        }),
      ),
      list,
      kindOf,
    };
    return cast;
  }

  /** Tween moves for one state of a cast. o: { placed:[], hover:{term, kind}, strip:{x}, show } */
  function castMoves(cast, o) {
    const { geom, list, kinds } = cast;
    const mv = [];
    const placed = new Set(o.placed ?? []);
    const wide = (t) => (t.v ? geom.tw : geom.ts);
    const count = kinds.map(() => 0);
    const slot = new Map();
    list.forEach((t, i) => {
      if (!placed.has(i)) return;
      const k = cast.kindOf(t);
      slot.set(i, { k, n: count[k] });
      count[k] += t.coef;
    });
    const pileXY = (k, n, t) => ({
      x: geom.pileX + n * (wide(t) + geom.gap),
      y: cast.pileY0 + k * geom.pileGap,
    });
    list.forEach((t, i) => {
      const hover = o.hover?.term === i ? o.hover : null;
      const s = slot.get(i);
      const strip = o.strip;
      cast.tiles[i].forEach((tile, j) => {
        let to;
        let h = geom.th;
        let w = wide(t);
        if (strip) {
          let before = 0;
          for (const ki of kinds.keys()) {
            if (ki >= cast.kindOf(t)) break;
            before += kinds[ki].sum * (kinds[ki].v ? strip.x : 1);
          }
          let sameKind = 0;
          for (let q = 0; q < i; q++)
            if (cast.kindOf(list[q]) === cast.kindOf(t)) sameKind += list[q].coef;
          const unitW = (t.v ? strip.x : 1) * U;
          to = { x: 20 + before * U + (sameKind + j) * unitW, y: strip.y };
          w = unitW;
          h = STRIP_TH;
        } else if (hover) {
          to = pileXY(hover.kind, count[hover.kind] + j, t);
        } else if (s) to = pileXY(s.k, s.n + j, t);
        else to = { x: geom.bagX + j * (wide(t) + geom.gap), y: geom.top + i * geom.pitch };
        mv.push([
          tile.rect,
          { ...to, width: w, height: h, opacity: 1, "stroke-width": strip ? 1.5 : 2 },
        ]);
        if (tile.txt)
          mv.push([
            tile.txt,
            {
              x: to.x + w / 2,
              y: to.y + h * 0.72,
              opacity: w >= 17 ? 1 : 0,
            },
          ]);
      });
      const bagged = !placed.has(i) && !o.strip;
      mv.push(
        [cast.frames[i], { opacity: bagged ? 1 : 0 }],
        [cast.labels[i], { opacity: bagged ? 1 : 0 }],
      );
    });
    kinds.forEach((k, ki) => {
      const sum = list
        .filter((t, i) => placed.has(i) && cast.kindOf(t) === ki)
        .reduce((s, t) => s + t.coef, 0);
      mv.push([
        cast.kindLabels[ki],
        {
          opacity: sum && !o.strip ? 1 : 0,
          y: cast.pileY0 + ki * geom.pileGap + geom.th * 0.75,
          text: `${sum}${k.v ?? ""}`,
        },
      ]);
    });
    return mv;
  }

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    main = makeCast(ctx, g, terms, MAIN);
    trans = makeCast(ctx, g, v.transfer.terms, TRANS);
    for (const [cast, geom, n] of [
      [main, MAIN, terms.length],
      [trans, TRANS, v.transfer.terms.length],
    ])
      cast.pileY0 = geom.top + n * geom.pitch + 22;
    main.height = main.pileY0 + MAIN.pileGap + MAIN.th + 14;
    trans.height = trans.pileY0 + TRANS.pileGap + TRANS.th + 14;
    main.segs = terms.map((t) => ({
      rect: svgEl(
        "rect",
        {
          x: 20,
          y: 70,
          width: 0,
          height: STRIP_TH,
          rx: 3,
          "stroke-width": 1.5,
          opacity: 0,
          fill: t.v ? LOOKS[0].fill : LOOKS[1].fill,
          stroke: t.v ? LOOKS[0].stroke : LOOKS[1].stroke,
        },
        main.g,
      ),
      txt: svgEl(
        "text",
        {
          x: 0,
          y: 70 + STRIP_TH * 0.7,
          "text-anchor": "middle",
          "font-size": 15,
          "font-weight": 800,
          fill: t.v ? LOOKS[0].ink : LOOKS[1].ink,
          opacity: 0,
          text: termText(t),
        },
        main.g,
      ),
    }));
    main.stripLbl = [0, 1].map((i) =>
      svgEl(
        "text",
        {
          x: 20,
          y: i ? 132 : 52,
          "font-size": 17,
          "font-weight": 800,
          fill: "var(--lsx-muted)",
          opacity: 0,
          text: "",
        },
        main.g,
      ),
    );
    svg.setAttribute("viewBox", `0 0 ${W} ${main.height}`);
  }

  /** One state of the whole stage; every scene calls this. */
  function view(ctx, o, ms) {
    const which = o.cast === "transfer" ? trans : main;
    const other = which === main ? trans : main;
    const mv = [
      [which.g, { opacity: 1 }],
      [other.g, { opacity: 0 }],
    ];
    mv.push(...castMoves(which, o));
    if (which === main) {
      const strip = o.strip;
      terms.forEach((t, i) => {
        const seg = main.segs[i];
        let x = 20;
        for (let q = 0; q < i; q++) x += terms[q].coef * (terms[q].v ? (strip?.x ?? 0) : 1) * U;
        const w = t.coef * (t.v ? (strip?.x ?? 0) : 1) * U;
        mv.push([seg.rect, { x, width: strip ? w : 0, opacity: strip ? 1 : 0 }]);
        mv.push([seg.txt, { x: x + w / 2, opacity: strip && w >= 17 ? 1 : 0 }]);
      });
      main.stripLbl.forEach((l, i) =>
        mv.push([l, { opacity: strip ? 1 : 0, text: ctx.L(i ? T.stripSimple : T.stripOrig) }]),
      );
    }
    // Once every bag is emptied the piles are all that is left: crop the empty rows away.
    const allIn = (o.placed ?? []).length === which.list.length;
    const top = !o.strip && allIn ? which.pileY0 - 30 : 0;
    const h = o.strip ? 200 : which.height - top;
    ctx.svg.setAttribute("viewBox", `0 ${top} ${W} ${h}`);
    return ctx.tween(mv, ms);
  }

  const bags = { cast: "main", placed: [] };
  const allPlaced = (list) => ({ placed: list.map((_, i) => i) });
  const choiceOpts = (opts, seed) =>
    placeCorrect(
      opts.map((o) => ({ ...o, label: o.text })),
      (seed % 3) + 1,
    );

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.expr(escHtml(T.text));
        ctx.say(T.situateSay);
        await view(ctx, bags, 400);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        ctx.expr(`${escHtml(T.text)} = ?`);
        ctx.say(T.predictSay);
        await view(ctx, bags, 0);
        const options = choiceOpts(mainChoices(terms), terms.length + vk.sum);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.cue(opt), "cue"),
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
      id: "sort",
      label: T.scene.sort,
      gate: true,
      async enter(ctx, saved) {
        const st = ctx.state;
        let placed = Array.isArray(saved.placed)
          ? saved.placed.filter((i) => Number.isInteger(i) && i >= 0 && i < terms.length)
          : [];
        placed = [...new Set(placed)];
        const row = document.createElement("div");
        row.className = "lsx-panel";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", ctx.L(T.scene.sort));
        ctx.panel.appendChild(row);
        let busy = false;
        const paint = (ms, extra = {}) => view(ctx, { cast: "main", placed, ...extra }, ms);
        const finished = () => placed.length === terms.length;
        const buttons = () => {
          row.innerHTML = "";
          terms.forEach((t, i) => {
            if (placed.includes(i)) return;
            const line = document.createElement("div");
            line.className = "lsx-choices";
            for (const pile of ["x", "num"]) {
              const b = ctx.button({
                label: pile === "x" ? T.toX(t) : T.toNum(t),
                onClick: async () => {
                  if (busy) return;
                  const ok = pile === "x" ? !!t.v : !t.v;
                  if (!ok) {
                    busy = true;
                    b.classList.add("miss");
                    ctx.feedback(T.sortCue(t), "cue");
                    const k = main.kindOf(pile === "x" ? { v: letter } : { v: null });
                    await paint(300, { hover: { term: i, kind: k } });
                    await paint(300);
                    busy = false;
                    return;
                  }
                  busy = true;
                  placed = [...placed, i].sort((a, b) => a - b);
                  st.placed = placed;
                  ctx.save();
                  ctx.feedback(T.sortProgress(placed.length), "");
                  await paint(450);
                  busy = false;
                  buttons();
                  ctx.expr(escHtml(T.text));
                  if (finished()) done();
                },
              });
              line.appendChild(b);
            }
            row.appendChild(line);
          });
        };
        const done = () => {
          ctx.feedback(T.sortDone);
          ctx.unlock();
        };
        const again = ctx.button({
          label: T.startOver,
          onClick: async () => {
            if (busy) return;
            placed = [];
            st.placed = [];
            ctx.save();
            ctx.feedback("");
            await paint(350);
            buttons();
          },
        });
        ctx.panel.appendChild(again);
        ctx.say(T.sortSay);
        ctx.expr(escHtml(T.text));
        await paint(400);
        buttons();
        if (finished()) done();
      },
    },
    {
      id: "connect",
      label: T.scene.connect,
      async enter(ctx) {
        ctx.say(T.connectSay);
        ctx.expr(`${hi(T.text)} = ${lo(T.simple)}`);
        await view(ctx, { cast: "main", ...allPlaced(terms) }, 500);
        ctx.feedback(T.connectDone);
      },
    },
    {
      id: "test",
      label: T.scene.test,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        st.seen = Array.isArray(st.seen)
          ? st.seen.filter((x) => Number.isInteger(x) && x >= MIN_X && x <= xMax)
          : [];
        const startX = st.seen.length ? st.seen[st.seen.length - 1] : start;
        const readout = document.createElement("p");
        readout.className = "lsx-fb";
        readout.setAttribute("aria-live", "polite");
        const apply = (x, ms) => {
          const orig = valueAt(terms, { [letter]: x });
          ctx.expr(`${hi(`${T.text} = ${orig}`)}<br>${lo(`${T.simple} = ${vk.sum * x + ck.sum}`)}`);
          readout.textContent = ctx.L(T.testRow(x));
          return view(ctx, { cast: "main", ...allPlaced(terms), strip: { x, y: 150 } }, ms);
        };
        const progress = () => {
          const distinct = new Set([...st.seen, start]);
          if (distinct.size >= 3) {
            ctx.feedback(T.testDone);
            ctx.unlock();
          } else
            ctx.feedback(distinct.size >= 2 ? T.tryMore(3 - distinct.size) : T.tryThree, "cue");
        };
        ctx.say(T.testSay);
        const rng = ctx.range({
          label: T.valueLabel,
          min: MIN_X,
          max: xMax,
          value: startX,
          onInput: async (x) => {
            if (!st.seen.includes(x)) st.seen.push(x);
            ctx.save();
            await apply(x, 250);
            progress();
          },
        });
        ctx.panel.append(rng, readout);
        await apply(startX, 450);
        progress();
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        const tt = v.transfer.terms;
        ctx.say(T.transferSay);
        ctx.expr(`${escHtml(T.tText)} = ?`);
        await view(ctx, { cast: "transfer", placed: saved.solved ? tt.map((_, i) => i) : [] }, 0);
        const options = choiceOpts(transferChoices(tt), tt.length + 2);
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
              ctx.expr(`${escHtml(T.tText)} = ${hi(T.tSimple)}`);
              await view(ctx, { cast: "transfer", ...allPlaced(tt) }, 600);
            },
          }),
        );
        if (saved.solved) ctx.expr(`${escHtml(T.tText)} = ${hi(T.tSimple)}`);
        ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
      },
    },
  ];

  return {
    kicker: T.kicker,
    title: T.title,
    viewBox: `0 0 ${W} 350`,
    ariaLabel: T.ariaLabel,
    printSummary: T.printSummary,
    setup,
    scenes,
  };
}
