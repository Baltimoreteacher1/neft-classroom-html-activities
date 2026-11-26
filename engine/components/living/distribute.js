// living/distribute.js — "3 bags of (x + 4)" becomes 3x + 12, and back.
//
// One cast for the whole play: `a` rows, each one x-tile and `c` unit tiles.
// Rows ARE the groups in scene 1, ARE the regrouped "3x" and "12" in scene 3,
// and ARE the a × (x + c) area model in scene 4 — the tiles only ever move, so
// the student watches the same quantity change form rather than meeting a new
// picture per representation. In scene 5 the x-tile's length becomes x unit
// squares, so "x can be anything" is something the student SEES: the two
// equivalent expressions stay equal at every length while 3x + c falls behind.
//
// Config: { a, c, presets:[{a,c}] } — the lesson's own numbers (6-6 authors
// 3(x + 4), 2(x + 5), 4(x + 3)). Validated up front; out-of-range numbers make
// the play refuse to draw instead of drawing a broken model.

import { escHtml } from "../../core/living-scene.js";

const U = 28; // one unit tile, in stage units
const GAP = 4;
const XW = 120; // an x-tile before x has a value — deliberately not a multiple of U

const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export function validateDistribute(cfg) {
  const a = Number(cfg?.a);
  const c = Number(cfg?.c);
  if (!okInt(a, 2, 5) || !okInt(c, 1, 6)) return null;
  const presets = (Array.isArray(cfg.presets) ? cfg.presets : [])
    .map((p) => ({ a: Number(p.a), c: Number(p.c) }))
    .filter((p) => okInt(p.a, 2, 5) && okInt(p.c, 1, 6) && !(p.a === a && p.c === c));
  // Reverse and transfer scenes need two OTHER expressions; fall back to
  // deterministic neighbours of the lesson's own numbers when none are authored.
  const fallback = [
    { a: a === 2 ? 3 : 2, c: c === 5 ? 3 : 5 },
    { a: a === 4 ? 5 : 4, c: c === 3 ? 2 : 3 },
  ];
  while (presets.length < 2) presets.push(fallback[presets.length]);
  return { a, c, reverse: presets[0], transfer: presets[1] };
}

const fmtFactored = (a, c) => `${a}(x + ${c})`;
const fmtExpanded = (a, c) => `${a}x + ${a * c}`;

/** Stable position for the correct choice — never always first. */
function placeCorrect(options, seed) {
  const k = seed % options.length;
  const correct = options.find((o) => o.correct);
  const rest = options.filter((o) => !o.correct);
  rest.splice(k, 0, correct);
  return rest;
}

export function buildDistributePlay(cfg) {
  const v = validateDistribute(cfg);
  if (!v) return null;
  const { a, c } = v;
  const ac = a * c;

  const rowY = (i) => 34 + i * 62;
  const H = rowY(a) + 48;
  const W = 400;
  let cast = null; // { frames:[], xs:[], units:[[...]], labels:{} }
  let curA = a;
  let curC = c;

  function draw(ctx, A, C) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    curA = A;
    curC = C;
    const g = svgEl("g", {}, svg);
    const frames = [];
    const xs = [];
    const xLbls = [];
    const units = [];
    for (let i = 0; i < A; i++) {
      const y = rowY(i);
      frames.push(
        svgEl(
          "rect",
          {
            x: 16,
            y: y - 10,
            width: 24 + XW + 12 + C * (U + GAP) + 6,
            height: U + 20,
            rx: 12,
            fill: "var(--lsx-paper)",
            stroke: "var(--lsx-ink)",
            "stroke-width": 2,
            "stroke-dasharray": "6 5",
            opacity: 0,
          },
          g,
        ),
      );
      xs.push(
        svgEl(
          "rect",
          {
            x: 30,
            y,
            width: XW,
            height: U,
            rx: 4,
            fill: "var(--lsx-x)",
            stroke: "var(--lsx-hi)",
            "stroke-width": 2,
            opacity: 0,
          },
          g,
        ),
      );
      xLbls.push(
        svgEl(
          "text",
          {
            x: 30 + XW / 2,
            y: y + 19,
            "text-anchor": "middle",
            "font-size": 17,
            "font-weight": 800,
            fill: "var(--lsx-on-x)",
            opacity: 0,
            text: "x",
          },
          g,
        ),
      );
      const row = [];
      for (let j = 0; j < C; j++) {
        row.push(
          svgEl(
            "rect",
            {
              x: 30 + XW + 12 + j * (U + GAP),
              y,
              width: U,
              height: U,
              rx: 4,
              fill: "var(--lsx-u)",
              stroke: "var(--lsx-lo)",
              "stroke-width": 2,
              opacity: 0,
            },
            g,
          ),
        );
      }
      units.push(row);
    }
    const labels = {
      left: svgEl(
        "text",
        {
          x: W - 24,
          y: H - 14,
          "text-anchor": "end",
          "font-size": 20,
          "font-weight": 800,
          fill: "var(--lsx-ink)",
          opacity: 0,
          text: "",
        },
        g,
      ),
      xSum: svgEl(
        "text",
        {
          x: 30 + XW / 2,
          y: H - 14,
          "text-anchor": "middle",
          "font-size": 20,
          "font-weight": 800,
          fill: "var(--lsx-hi)",
          opacity: 0,
          text: `${A}x`,
        },
        g,
      ),
      uSum: svgEl(
        "text",
        {
          x: 0,
          y: H - 14,
          "text-anchor": "middle",
          "font-size": 20,
          "font-weight": 800,
          fill: "var(--lsx-lo)",
          opacity: 0,
          text: String(A * C),
        },
        g,
      ),
      side: svgEl(
        "text",
        {
          x: 14,
          y: 0,
          "text-anchor": "middle",
          "font-size": 20,
          "font-weight": 800,
          fill: "var(--lsx-ink)",
          opacity: 0,
          text: String(A),
        },
        g,
      ),
      topX: svgEl(
        "text",
        {
          x: 0,
          y: 22,
          "text-anchor": "middle",
          "font-size": 20,
          "font-weight": 800,
          fill: "var(--lsx-hi)",
          opacity: 0,
          text: "x",
        },
        g,
      ),
      topC: svgEl(
        "text",
        {
          x: 0,
          y: 22,
          "text-anchor": "middle",
          "font-size": 20,
          "font-weight": 800,
          fill: "var(--lsx-lo)",
          opacity: 0,
          text: String(C),
        },
        g,
      ),
      regX: svgEl(
        "text",
        {
          x: 0,
          y: 0,
          "text-anchor": "middle",
          "font-size": 18,
          "font-weight": 800,
          fill: "var(--lsx-ink)",
          opacity: 0,
          text: "",
        },
        g,
      ),
      regC: svgEl(
        "text",
        {
          x: 0,
          y: 0,
          "text-anchor": "middle",
          "font-size": 18,
          "font-weight": 800,
          fill: "var(--lsx-ink)",
          opacity: 0,
          text: "",
        },
        g,
      ),
    };
    cast = { frames, xs, xLbls, units, labels };
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  }

  /** Grouped layout: one framed bag per row. */
  function groupedMoves(show = true) {
    const m = [];
    cast.xs.forEach((x, i) => {
      const y = rowY(i);
      m.push([x, { x: 30, y, width: XW, opacity: show ? 1 : 0 }]);
      m.push([cast.xLbls[i], { x: 30 + XW / 2, y: y + 19, opacity: show ? 1 : 0 }]);
      m.push([cast.frames[i], { opacity: show ? 1 : 0, y: y - 10 }]);
      cast.units[i].forEach((u, j) =>
        m.push([u, { x: 30 + XW + 12 + j * (U + GAP), y, opacity: show ? 1 : 0 }]),
      );
    });
    return m;
  }

  /** Regrouped: frames gone, x-tiles gather left, unit tiles gather right. */
  function regroupMoves(part) {
    const m = [];
    const unitX0 = 30 + XW + 40;
    if (part !== "units") {
      cast.frames.forEach((f) => m.push([f, { opacity: 0 }]));
      cast.xs.forEach((x, i) => m.push([x, { x: 30, y: rowY(i) }]));
      cast.xLbls.forEach((t, i) => m.push([t, { x: 30 + XW / 2, y: rowY(i) + 19 }]));
      m.push([cast.labels.xSum, { opacity: 1, x: 30 + XW / 2 }]);
    }
    if (part !== "xs") {
      cast.frames.forEach((f) => m.push([f, { opacity: 0 }]));
      cast.units.forEach((row, i) =>
        row.forEach((u, j) => m.push([u, { x: unitX0 + j * (U + GAP), y: rowY(i) }])),
      );
      m.push([cast.labels.uSum, { opacity: 1, x: unitX0 + (curC * (U + GAP) - GAP) / 2 }]);
    }
    return m;
  }

  /** Area model: rows close up into one a × (x + c) rectangle, no gaps. */
  function areaMoves(xLen = XW) {
    const m = [];
    const x0 = 40;
    const y0 = 40;
    cast.frames.forEach((f) => m.push([f, { opacity: 0 }]));
    cast.xs.forEach((x, i) => m.push([x, { x: x0, y: y0 + i * U, width: xLen, opacity: 1 }]));
    cast.xLbls.forEach((t, i) => m.push([t, { x: x0 + xLen / 2, y: y0 + i * U + 19, opacity: 1 }]));
    cast.units.forEach((row, i) =>
      row.forEach((u, j) => m.push([u, { x: x0 + xLen + j * U, y: y0 + i * U, opacity: 1 }])),
    );
    const bottom = y0 + curA * U;
    const L = cast.labels;
    m.push([L.xSum, { opacity: 0 }], [L.uSum, { opacity: 0 }]);
    m.push([L.side, { opacity: 1, x: 22, y: y0 + (curA * U) / 2 + 7 }]);
    m.push([L.topX, { opacity: 1, x: x0 + xLen / 2, y: y0 - 10 }]);
    m.push([L.topC, { opacity: 1, x: x0 + xLen + (curC * U) / 2, y: y0 - 10 }]);
    m.push([L.regX, { opacity: 1, x: x0 + xLen / 2, y: bottom + 28 }]);
    m.push([L.regC, { opacity: 1, x: x0 + xLen + (curC * U) / 2, y: bottom + 28 }]);
    return m;
  }

  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;
  const plain = (s) => escHtml(s);

  // Scenes 1-5 use the lesson's own cast; Back from the reverse scene must
  // bring it back rather than leave another expression's tiles on stage.
  const ensureMain = (ctx) => {
    if (curA !== a || curC !== c) draw(ctx, a, c);
  };

  const markRows = (ctx, which, from) => {
    // Amber dashed outline on the tiles the student's choice left out.
    const m = [];
    for (let i = 0; i < curA; i++) {
      const tiles = which === "units" ? cast.units[i] : [cast.xs[i]];
      for (const t of tiles) t.setAttribute("stroke-dasharray", i >= from ? "5 3" : "");
      for (const t of tiles) m.push([t, { "stroke-width": i >= from ? 4 : 2 }]);
    }
    return ctx.tween(m, 250);
  };
  // Unit ticks across the x-tiles in the "Does x matter?" scene, so a length of
  // x = 7 is visibly seven unit squares, the same size as the loose markers.
  let ticks = null;
  const drawTicks = (ctx, xv) => {
    ticks?.remove();
    ticks = ctx.svgEl("g", { "aria-hidden": "true" }, ctx.svg);
    for (let i = 0; i < curA; i++) {
      for (let k = 1; k < xv; k++) {
        const x = 40 + k * U;
        ctx.svgEl(
          "line",
          {
            x1: x,
            x2: x,
            y1: 40 + i * U + 3,
            y2: 40 + (i + 1) * U - 3,
            stroke: "var(--lsx-on-x)",
            "stroke-width": 1.5,
            opacity: 0.7,
          },
          ticks,
        );
      }
    }
  };
  const clearMarks = () => {
    ticks?.remove();
    ticks = null;
    for (let i = 0; i < curA; i++) {
      for (const t of [cast.xs[i], ...cast.units[i]]) {
        t.setAttribute("stroke-dasharray", "");
        t.setAttribute("stroke-width", "2");
      }
    }
  };

  const scenes = [
    {
      id: "situate",
      label: { en: "The situation", es: "La situación" },
      async enter(ctx) {
        ensureMain(ctx);
        clearMarks();
        ctx.expr(`${a}(${hi(`x + ${c}`)})`);
        ctx.say({
          en: `There are ${a} bags. Each bag holds one box with x markers inside (we don't know x yet) and ${c} loose markers. Each bag is x + ${c}, and there are ${a} of them.`,
          es: `Hay ${a} bolsas. Cada bolsa tiene una caja con x marcadores (todavía no sabemos cuánto es x) y ${c} marcadores sueltos. Cada bolsa es x + ${c}, y hay ${a} bolsas.`,
        });
        const all = groupedMoves(false);
        await ctx.tween(all, 0);
        for (let i = 0; i < a; i++) {
          const row = groupedMoves(true).filter(
            ([el]) =>
              el === cast.frames[i] ||
              el === cast.xs[i] ||
              el === cast.xLbls[i] ||
              cast.units[i].includes(/** @type {any} */ (el)),
          );
          await ctx.tween(row, 380);
        }
      },
    },
    {
      id: "predict",
      label: { en: "Predict", es: "Predice" },
      gate: true,
      async enter(ctx, saved) {
        ensureMain(ctx);
        clearMarks();
        await ctx.tween(groupedMoves(true), 300);
        ctx.expr(`${a}(x + ${c})`);
        ctx.say({
          en: "Before we open anything: which expression counts every marker in all the bags?",
          es: "Antes de abrir nada: ¿qué expresión cuenta todos los marcadores de todas las bolsas?",
        });
        const options = placeCorrect(
          [
            { label: `${a}x + ${ac}`, correct: true },
            {
              label: `${a}x + ${c}`,
              cue: {
                en: `Look at the outlined loose markers. The ${c} in the first bag are counted — what about the ones in the other bags?`,
                es: `Mira los marcadores sueltos marcados. Los ${c} de la primera bolsa están contados, ¿y los de las otras bolsas?`,
              },
              mark: "units",
            },
            {
              label: `x + ${ac}`,
              cue: {
                en: "Look at the outlined boxes. Every bag has a box of x markers. How many boxes are there?",
                es: "Mira las cajas marcadas. Cada bolsa tiene una caja de x marcadores. ¿Cuántas cajas hay?",
              },
              mark: "xs",
            },
            {
              label: `${a + c}x`,
              cue: {
                en: "Can a box of x markers and one loose marker be counted as the same kind of thing? Look at their lengths.",
                es: "¿Se puede contar una caja de x marcadores y un marcador suelto como la misma cosa? Mira su longitud.",
              },
            },
          ],
          a + c,
        );
        const correctIdx = options.findIndex((o) => o.correct);
        ctx.panel.appendChild(
          ctx.choices({
            question: {
              en: "Which expression shows the total?",
              es: "¿Qué expresión muestra el total?",
            },
            options,
            restore: saved.solved ? correctIdx : null,
            onMiss: async (_i, opt) => {
              clearMarks();
              if (opt.mark) await markRows(ctx, opt.mark, opt.mark === "units" ? 1 : 1);
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: () => {
              clearMarks();
              ctx.state.solved = true;
              ctx.feedback({
                en: `Yes — every bag contributes a box AND ${c} loose markers, so there are ${a} boxes (${a}x) and ${a} × ${c} = ${ac} loose markers. Next, check it by unpacking.`,
                es: `Sí: cada bolsa aporta una caja Y ${c} marcadores sueltos, así que hay ${a} cajas (${a}x) y ${a} × ${c} = ${ac} marcadores sueltos. Ahora compruébalo desempacando.`,
              });
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "regroup",
      label: { en: "Unpack and regroup", es: "Desempaca y reagrupa" },
      gate: true,
      async enter(ctx, saved) {
        ensureMain(ctx);
        clearMarks();
        const st = ctx.state;
        const repeated = `${Array(a).fill("x").join(" + ")} + ${Array(a).fill(String(c)).join(" + ")}`;
        const paint = () => {
          if (st.xs && st.units)
            ctx.expr(`${plain(repeated)} = ${hi(`${a}x`)} + ${lo(String(ac))}`);
          else if (st.xs)
            ctx.expr(`${hi(`${a}x`)} + ${plain(Array(a).fill(String(c)).join(" + "))}`);
          else if (st.units)
            ctx.expr(`${plain(Array(a).fill("x").join(" + "))} + ${lo(String(ac))}`);
          else ctx.expr(`${a}(x + ${c})`);
        };
        await ctx.tween(groupedMoves(true), 0);
        if (saved.xs) await ctx.tween(regroupMoves("xs"), 0);
        if (saved.units) await ctx.tween(regroupMoves("units"), 0);
        paint();
        ctx.say({
          en: "Open the bags. Move all the boxes together and all the loose markers together. Nothing is added or taken away — only moved.",
          es: "Abre las bolsas. Junta todas las cajas y todos los marcadores sueltos. No se agrega ni se quita nada: solo se mueve.",
        });
        const row = document.createElement("div");
        row.className = "lsx-choices";
        const finish = () => {
          paint();
          if (st.xs && st.units) {
            ctx.feedback({
              en: `${a} boxes make ${a}x. ${a} groups of ${c} make ${ac}. Same markers, new arrangement: ${a}(x + ${c}) = ${a}x + ${ac}.`,
              es: `${a} cajas forman ${a}x. ${a} grupos de ${c} forman ${ac}. Los mismos marcadores, otro orden: ${a}(x + ${c}) = ${a}x + ${ac}.`,
            });
            ctx.unlock();
          }
          ctx.save();
        };
        const bx = ctx.button({
          label: { en: "Gather the boxes", es: "Junta las cajas" },
          onClick: async () => {
            bx.disabled = true;
            st.xs = true;
            await ctx.tween(regroupMoves("xs"), 650);
            finish();
          },
        });
        const bu = ctx.button({
          label: { en: "Gather the loose markers", es: "Junta los marcadores sueltos" },
          onClick: async () => {
            bu.disabled = true;
            st.units = true;
            await ctx.tween(regroupMoves("units"), 650);
            finish();
          },
        });
        bx.disabled = !!st.xs;
        bu.disabled = !!st.units;
        row.append(bx, bu);
        ctx.panel.appendChild(row);
        if (st.xs && st.units) finish();
      },
    },
    {
      id: "area",
      label: { en: "The area model", es: "El modelo de área" },
      async enter(ctx) {
        ensureMain(ctx);
        clearMarks();
        cast.labels.topX.textContent = "x";
        cast.labels.regX.textContent = `${a} · x = ${a}x`;
        cast.labels.regC.textContent = `${a} · ${c} = ${ac}`;
        await ctx.tween(areaMoves(), 800);
        ctx.expr(`${a}(x + ${c}) = ${hi(`${a} · x`)} + ${lo(`${a} · ${c}`)} = ${a}x + ${ac}`);
        ctx.say({
          en: `Close the gaps and the bags become one rectangle: ${a} tall and x + ${c} wide. Its area can be found in one piece, ${a}(x + ${c}), or in two pieces, ${a}x and ${ac}. That is the Distributive Property.`,
          es: `Si cerramos los espacios, las bolsas forman un rectángulo: ${a} de alto y x + ${c} de ancho. Su área se puede hallar de una vez, ${a}(x + ${c}), o en dos partes, ${a}x y ${ac}. Esa es la propiedad distributiva.`,
        });
      },
    },
    {
      id: "test",
      label: { en: "Does x matter?", es: "¿Importa x?" },
      gate: true,
      async enter(ctx) {
        ensureMain(ctx);
        clearMarks();
        const st = ctx.state;
        st.seen = Array.isArray(st.seen) ? st.seen : [];
        const start = st.seen.length ? st.seen[st.seen.length - 1] : 3;
        const table = document.createElement("p");
        table.className = "lsx-fb";
        table.setAttribute("aria-live", "polite");
        const apply = async (xv, ms) => {
          cast.labels.topX.textContent = `x = ${xv}`;
          cast.labels.regX.textContent = `${a} · ${xv} = ${a * xv}`;
          cast.labels.regC.textContent = `${a} · ${c} = ${ac}`;
          ticks?.remove();
          await ctx.tween(areaMoves(xv * U), ms);
          drawTicks(ctx, xv);
          const f = a * (xv + c);
          const e = a * xv + ac;
          const wrong = a * xv + c;
          ctx.expr(`${a}(${xv} + ${c}) = ${f} &nbsp;·&nbsp; ${a}(${xv}) + ${ac} = ${e}`);
          table.innerHTML = ctx.L({
            en: `When x = <b>${xv}</b>: ${a}(x + ${c}) = <b>${f}</b> and ${a}x + ${ac} = <b>${e}</b> — equal. But ${a}x + ${c} = <b>${wrong}</b>, short by ${f - wrong}.`,
            es: `Cuando x = <b>${xv}</b>: ${a}(x + ${c}) = <b>${f}</b> y ${a}x + ${ac} = <b>${e}</b>: iguales. Pero ${a}x + ${c} = <b>${wrong}</b>, le faltan ${f - wrong}.`,
          });
        };
        ctx.say({
          en: "Now x gets a value: the box stretches to exactly x unit squares long. Try several values. Watch which expressions stay equal.",
          es: "Ahora x tiene un valor: la caja mide exactamente x cuadritos de largo. Prueba varios valores. Observa qué expresiones siguen siendo iguales.",
        });
        ctx.panel.appendChild(
          ctx.range({
            label: { en: "Value of x", es: "Valor de x" },
            min: 1,
            // the area model must fit the stage: 40 + x·U + c·U <= W - 10
            max: Math.max(4, Math.min(8, Math.floor((W - 50) / U) - c)),
            value: start,
            onInput: async (xv) => {
              if (!st.seen.includes(xv)) st.seen.push(xv);
              ctx.save();
              await apply(xv, 250);
              if (st.seen.length >= 3) ctx.unlock();
            },
          }),
        );
        ctx.panel.appendChild(table);
        await apply(start, 600);
        if (st.seen.length < 3)
          ctx.feedback(
            {
              en: "Try at least three different values of x.",
              es: "Prueba al menos tres valores diferentes de x.",
            },
            "cue",
          );
        else ctx.unlock();
      },
    },
    {
      id: "reverse",
      label: { en: "Pack it back", es: "Vuelve a empacar" },
      gate: true,
      async enter(ctx, saved) {
        const { a: ra, c: rc } = v.reverse;
        draw(ctx, ra, rc);
        cast.labels.regX.textContent = `${ra}x`;
        cast.labels.regC.textContent = String(ra * rc);
        await ctx.tween(areaMoves(), 0);
        for (const t of Object.values(cast.labels)) t.setAttribute("opacity", "0");
        cast.labels.regX.setAttribute("opacity", "1");
        cast.labels.regC.setAttribute("opacity", "1");
        ctx.expr(`${fmtExpanded(ra, rc)} = ?`);
        ctx.say({
          en: `A new order arrives already unpacked: ${fmtExpanded(ra, rc)}. Pack it back into equal bags. How many bags, and what goes in each?`,
          es: `Llega un pedido nuevo ya desempacado: ${fmtExpanded(ra, rc)}. Vuelve a empacarlo en bolsas iguales. ¿Cuántas bolsas y qué va en cada una?`,
        });
        const options = placeCorrect(
          [
            { label: fmtFactored(ra, rc), correct: true },
            {
              label: `${ra}(x + ${ra * rc})`,
              cue: {
                en: `Unpack your answer to check it: ${ra} bags with ${ra * rc} loose markers each would be ${ra} × ${ra * rc} loose markers. Is that ${ra * rc}?`,
                es: `Desempaca tu respuesta para comprobarla: ${ra} bolsas con ${ra * rc} marcadores sueltos cada una serían ${ra} × ${ra * rc}. ¿Eso es ${ra * rc}?`,
              },
            },
            {
              label: `${rc}(x + ${ra})`,
              cue: {
                en: `Count the boxes in the picture. ${rc} bags would need ${rc} boxes. How many boxes are there?`,
                es: `Cuenta las cajas del dibujo. ${rc} bolsas necesitarían ${rc} cajas. ¿Cuántas cajas hay?`,
              },
            },
          ],
          ra + 2 * rc,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: {
              en: `${fmtExpanded(ra, rc)} is equivalent to…`,
              es: `${fmtExpanded(ra, rc)} es equivalente a…`,
            },
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.expr(`${fmtExpanded(ra, rc)} = ${hi(fmtFactored(ra, rc))}`);
              await ctx.tween(groupedMoves(true), 700);
              ctx.feedback({
                en: `${ra} boxes means ${ra} bags. ${ra * rc} loose markers shared by ${ra} bags is ${rc} per bag. ${fmtExpanded(ra, rc)} = ${fmtFactored(ra, rc)}.`,
                es: `${ra} cajas quiere decir ${ra} bolsas. ${ra * rc} marcadores sueltos repartidos en ${ra} bolsas son ${rc} por bolsa. ${fmtExpanded(ra, rc)} = ${fmtFactored(ra, rc)}.`,
              });
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "transfer",
      label: { en: "On your own", es: "Por tu cuenta" },
      async enter(ctx, saved) {
        const { a: ta, c: tc } = v.transfer;
        draw(ctx, ta, tc);
        await ctx.tween(groupedMoves(false), 0);
        ctx.expr(`${fmtFactored(ta, tc)} = ?`);
        ctx.say({
          en: "No picture this time — picture the bags in your head.",
          es: "Esta vez no hay dibujo: imagina las bolsas en tu mente.",
        });
        const options = placeCorrect(
          [
            { label: fmtExpanded(ta, tc), correct: true },
            {
              label: `${ta}x + ${tc}`,
              cue: {
                en: `How many bags hold ${tc} loose markers?`,
                es: `¿Cuántas bolsas tienen ${tc} marcadores sueltos?`,
              },
            },
            {
              label: `${ta * tc}x`,
              cue: {
                en: "Boxes and loose markers are different kinds of things. Can they combine into one term?",
                es: "Las cajas y los marcadores sueltos son cosas distintas. ¿Pueden unirse en un solo término?",
              },
            },
          ],
          ta * 3 + tc,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: {
              en: `Which expression is equivalent to ${fmtFactored(ta, tc)}?`,
              es: `¿Qué expresión es equivalente a ${fmtFactored(ta, tc)}?`,
            },
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.expr(`${fmtFactored(ta, tc)} = ${hi(fmtExpanded(ta, tc))}`);
              await ctx.tween(groupedMoves(true), 500);
              ctx.feedback({
                en: `Right: ${ta} boxes and ${ta} × ${tc} = ${ta * tc} loose markers.`,
                es: `Correcto: ${ta} cajas y ${ta} × ${tc} = ${ta * tc} marcadores sueltos.`,
              });
            },
          }),
        );
        ctx.panel.appendChild(
          ctx.frame({
            label: {
              en: `Explain: why is ${a}(x + ${c}) NOT equivalent to ${a}x + ${c}?`,
              es: `Explica: ¿por qué ${a}(x + ${c}) NO es equivalente a ${a}x + ${c}?`,
            },
            frame: {
              en: `They are not equivalent because ___. For example, when x = ___, …`,
              es: `No son equivalentes porque ___. Por ejemplo, cuando x = ___, …`,
            },
          }),
        );
      },
    },
  ];

  return {
    kicker: { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" },
    title: { en: `Unpacking ${a}(x + ${c})`, es: `Desempacando ${a}(x + ${c})` },
    viewBox: `0 0 ${W} ${H}`,
    ariaLabel: {
      en: `${a} rows of tiles. Each row is one x-tile and ${c} unit tiles. The rows regroup into ${a}x and ${ac}, then form a ${a} by (x + ${c}) rectangle.`,
      es: `${a} filas de fichas. Cada fila es una ficha x y ${c} fichas unidad. Las filas se reagrupan en ${a}x y ${ac} y luego forman un rectángulo de ${a} por (x + ${c}).`,
    },
    printSummary: {
      en: `${a}(x + ${c}) means ${a} groups of x + ${c}. Regrouping gives ${a} x's and ${a} × ${c} = ${ac} ones, so ${a}(x + ${c}) = ${a}x + ${ac} for every value of x. ${a}x + ${c} is not equivalent: it counts the ${c} ones only once.`,
      es: `${a}(x + ${c}) significa ${a} grupos de x + ${c}. Al reagrupar hay ${a} x y ${a} × ${c} = ${ac} unidades, así que ${a}(x + ${c}) = ${a}x + ${ac} para cualquier valor de x. ${a}x + ${c} no es equivalente: cuenta las ${c} unidades una sola vez.`,
    },
    setup(ctx) {
      draw(ctx, a, c);
    },
    scenes,
  };
}
