/* Wildlife Signal — mission builders, part 2 (boxplot, report).
 *   boxplot  Foxwood's habitat ruler: median / five-number markers, or range + IQR fences
 *   report   the Migration Observatory console: MAD ropes, compare two flocks, or
 *            choose the center and spread when an outlier appears
 */
(function () {
  "use strict";
  const D = window.DD_MISSIONS;
  if (!window.EWLExpedition || !D || !D.survey) return;
  const { L, fmt, num, near, miss, chip, scaleX, PANEL, GOLD, WARN, GOOD } = D;
  const M = D.math;
  const LBL = {
    min: L("MIN", "MÍN"),
    q1: L("Q1", "Q1"),
    med: L("MEDIAN", "MEDIANA"),
    q3: L("Q3", "Q3"),
    max: L("MAX", "MÁX"),
  };

  /** Typed cells: digits, "." and "−" go to the selected cell; Backspace erases. */
  function entry(api, cells, onChange) {
    const state = { sel: 0 };
    state.type = (key) => {
      const c = cells[state.sel];
      if (!c) return;
      if (key === "Backspace") c.text = c.text.slice(0, -1);
      else if (key === "-") c.text = c.text.startsWith("-") ? c.text.slice(1) : "-" + c.text;
      else if (key === ".") {
        if (c.text.includes(".") || c.text.replace("-", "").length >= 4) return;
        c.text += ".";
      } else if (/^[0-9]$/.test(key) && c.text.replace(/[-.]/g, "").length < 4) c.text += key;
      else return;
      api.sfx.tap();
      onChange();
    };
    // Backspace reaches us through the action deck (so it is not handled twice).
    api.kit.onType((k) => k !== "Backspace" && state.type(k));
    api.kit.keypad(117, 452, (k) => state.type(k === "−" ? "-" : k), {
      keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ".", "−", "⌫"],
      size: 38,
    });
    return state;
  }
  /** Draw one entry cell box with its text object. */
  function cellBox(g, x, y, w, active, tone) {
    g.fillStyle(0x10283a, 1).fillRoundedRect(x - w / 2, y - 22, w, 44, 10);
    g.lineStyle(active ? 4 : 2, active ? GOLD : tone || 0x5e92b3, 1).strokeRoundedRect(x - w / 2, y - 22, w, 44, 10);
  }
  const showTyped = (s) => (s === "" ? "" : s.replace("-", "−"));

  /* ── boxplot: median, box plot, or range and IQR fences (2-3, 2-4, 2-5) ── */
  function boxplot(scene, api) {
    const { kit, rng } = api;
    const variant = api.mission.variant || "median";
    const g = M.genBox(rng, api.tier, variant);
    const f = g.five;
    const xOf = scaleX(g.axis.lo, g.axis.hi, 80, 740);
    const AX = variant === "spread" ? 344 : 340;
    const who = api.t(g.ctx.who);
    const briefs = {
      median: L(
        `The log lists ${api.t(g.ctx.name).toLowerCase()} for ${g.n} ${who}. Move the marker to the MEDIAN so the station can plan the feeders.`,
        `El registro muestra: ${api.t(g.ctx.name).toLowerCase()}, para ${g.n} ${who}. Mueve el marcador a la MEDIANA para planear los comederos.`,
      ),
      box: L(
        `${api.t(g.ctx.name)}, ${g.n} ${who}. Place all five markers to build the box plot for the station's display.`,
        `${api.t(g.ctx.name)}, ${g.n} ${who}. Coloca los cinco marcadores para construir el diagrama de caja de la estación.`,
      ),
      spread: L(
        `${api.t(g.ctx.name)}, ${g.n} ${who}. Set the fence to the RANGE and the core zone to the IQR to protect the habitat.`,
        `${api.t(g.ctx.name)}, ${g.n} ${who}. Ajusta la cerca al RANGO y la zona central al RIC para proteger el hábitat.`,
      ),
    };
    api.setBrief(briefs[variant]);
    // Tag chips, in the order the rangers logged them.
    const order = g.data.map((v, i) => i);
    const slotX = (k) => 380 + (k - (g.n - 1) / 2) * 56;
    const chips = g.data.map((v, i) => chip(scene, kit, slotX(i), 160, 50, String(v)));
    let sorted = false;
    async function sortTags() {
      if (sorted) return;
      sorted = true;
      const idx = order.slice().sort((a, b) => g.data[a] - g.data[b] || a - b);
      idx.forEach((ci, k) => kit.tween({ targets: chips[ci], x: slotX(k), duration: 450, ease: "Cubic.easeInOut" }));
      if (kit.reduced()) idx.forEach((ci, k) => chips[ci].setX(slotX(k)));
      api.sfx.whoosh();
      sortBtn.setDisabled(true);
      api.refresh();
      await kit.wait(480);
    }
    const sortBtn = kit.button(758, 160, 92, 38, api.t(L("Sort ⇅", "Ordenar ⇅")), () => sortTags(), { size: 15 });
    // Ruler (on its own board panel so the world stays behind it).
    kit.panel(24, 188, 772, 286, { fill: PANEL, alpha: 0.88 });
    const ruler = scene.add.graphics().setDepth(21);
    ruler.lineStyle(3, 0xeaf6ff, 0.85).lineBetween(xOf(g.axis.lo) - 10, AX, xOf(g.axis.hi) + 10, AX);
    for (let v = g.axis.lo; v <= g.axis.hi; v++) {
      ruler.lineStyle(2, 0xeaf6ff, 0.7).lineBetween(xOf(v), AX - 6, xOf(v), AX + 6);
      kit.text(xOf(v), AX + 18, String(v), 12, "#cfe3ee", { depth: 22 });
    }
    if (variant === "spread") kit.text(410, AX + 38, api.t(g.ctx.name), 13, "#9fb7c4", { depth: 22 });
    const dotsG = scene.add.graphics().setDepth(22);
    const display = scene.add.graphics().setDepth(22);
    function dropDots(colorOf) {
      dotsG.clear();
      const stack = {};
      g.sorted.forEach((v) => {
        stack[v] = (stack[v] || 0) + 1;
        dotsG.fillStyle(colorOf ? colorOf(v) : kit.accent, 1).fillCircle(xOf(v), AX - 14 - (stack[v] - 1) * 14, 6);
      });
    }

    const n = g.n;
    const h = Math.floor(n / 2);
    if (variant === "spread") return spreadControls();

    const keys = variant === "median" ? ["med"] : ["min", "q1", "med", "q3", "max"];
    const span = g.axis.hi - g.axis.lo;
    const pos = {};
    keys.forEach((k, i) => {
      pos[k] = keys.length === 1 ? g.axis.lo : Math.round((g.axis.lo + ((i + 1) * span) / 6) * 2) / 2;
    });
    let sel = keys.indexOf("med");
    let touched = false;
    const mk = scene.add.graphics().setDepth(23);
    const labels = keys.map(() => kit.text(0, 0, "", 12, "#ffffff", { depth: 24, weight: "800" }));
    const readout = kit.text(410, 452, "", 15, "#eaf6ff", { depth: 23, weight: "800" });
    function draw() {
      mk.clear();
      display.clear();
      keys.forEach((k, i) => {
        const x = xOf(pos[k]);
        const active = i === sel;
        const col = active ? GOLD : k === "med" ? kit.accent : 0x8fd3ff;
        mk.lineStyle(2, col, 0.9).lineBetween(x, AX - 8, x, AX + 30);
        mk.fillStyle(col, 1).fillTriangle(x, AX + 28, x - 11, AX + 48, x + 11, AX + 48);
        labels[i].setText(api.t(LBL[k])).setPosition(x, AX + 62 + (i % 2) * 16).setColor(active ? "#ffd76a" : "#eaf6ff");
      });
      if (variant === "box") {
        const p = keys.map((k) => xOf(pos[k]));
        const Y = 236;
        display.lineStyle(3, 0xeaf6ff, 0.9).lineBetween(p[0], Y, p[4], Y);
        display.lineBetween(p[0], Y - 14, p[0], Y + 14).lineBetween(p[4], Y - 14, p[4], Y + 14);
        const l = Math.min(p[1], p[3]);
        display.fillStyle(0x1d4a5c, 1).fillRect(l, Y - 26, Math.abs(p[3] - p[1]), 52);
        display.lineStyle(3, kit.accent, 1).strokeRect(l, Y - 26, Math.abs(p[3] - p[1]), 52);
        display.lineStyle(4, GOLD, 1).lineBetween(p[2], Y - 26, p[2], Y + 26);
      }
      readout.setText(keys.map((k) => `${api.t(LBL[k])} ${fmt(pos[k])}`).join("   ·   "));
    }
    function move(d) {
      touched = true;
      const k = keys[sel];
      pos[k] = Phaser.Math.Clamp(pos[k] + d, g.axis.lo, g.axis.hi);
      api.sfx.tick(Math.round(pos[k]) % 12);
      dotsG.clear();
      draw();
      api.refresh();
    }
    const zone = scene.add.zone(410, AX + 10, 700, 90).setInteractive({ useHandCursor: true }).setDepth(25);
    const valueAt = (px) => Phaser.Math.Clamp(Math.round((g.axis.lo + ((px - 80) / 660) * span) * 2) / 2, g.axis.lo, g.axis.hi);
    zone.on("pointerdown", (p) => {
      const v = valueAt(p.x);
      // Grab the nearest marker (keyboard: ↑ ↓ choose a marker).
      let best = sel;
      keys.forEach((k, i) => {
        if (Math.abs(pos[k] - v) < Math.abs(pos[keys[best]] - v)) best = i;
      });
      sel = best;
      move(v - pos[keys[sel]]);
    });
    zone.on("pointermove", (p) => p.isDown && move(valueAt(p.x) - pos[keys[sel]]));
    draw();
    const medianHint =
      n % 2
        ? L(`With ${n} tags, the median is tag number ${(n + 1) / 2} in order.`, `Con ${n} etiquetas, la mediana es la etiqueta número ${(n + 1) / 2} en orden.`)
        : L(
            `With ${n} tags, the middle two are tags ${n / 2} and ${n / 2 + 1} in order. The median is halfway between them.`,
            `Con ${n} etiquetas, las dos centrales son la ${n / 2} y la ${n / 2 + 1} en orden. La mediana está a mitad de camino entre ellas.`,
          );
    const hints =
      variant === "median"
        ? [
            L(
              "Put the tags in order from least to greatest (press Sort). The median is the value in the middle.",
              "Ordena las etiquetas de menor a mayor (pulsa Ordenar). La mediana es el valor del centro.",
            ),
            medianHint,
          ]
        : [
            L(
              "Sort the tags. MIN and MAX are the ends. The median splits the tags in half; Q1 and Q3 are the middles of each half.",
              "Ordena las etiquetas. MÍN y MÁX son los extremos. La mediana divide las etiquetas por la mitad; Q1 y Q3 son los centros de cada mitad.",
            ),
            L(
              `${medianHint.en} ${n % 2 ? `Leave it out: each half has ${h} tags.` : `Each half has ${h} tags.`}`,
              `${medianHint.es} ${n % 2 ? `Déjala fuera: cada mitad tiene ${h} etiquetas.` : `Cada mitad tiene ${h} etiquetas.`}`,
            ),
          ];
    const target = { min: f.min, q1: f.q1, med: f.med, q3: f.q3, max: f.max };
    return {
      checkLabel: variant === "median" ? L("Set the feeders", "Colocar comederos") : L("Post the box plot", "Publicar el diagrama"),
      get actions() {
        const list = [
          { key: "ArrowRight", label: L("Marker right +½", "Marcador a la derecha +½"), run: () => move(0.5) },
          { key: "ArrowLeft", label: L("Marker left −½", "Marcador a la izquierda −½"), run: () => move(-0.5) },
        ];
        if (keys.length > 1)
          list.push(
            { key: "ArrowUp", label: L("Next marker", "Marcador siguiente"), run: () => ((sel = (sel + 1) % keys.length), draw(), api.refresh()) },
            { key: "ArrowDown", label: L("Previous marker", "Marcador anterior"), run: () => ((sel = (sel + keys.length - 1) % keys.length), draw(), api.refresh()) },
          );
        if (!sorted) list.push({ key: "s", label: L("Sort the tags", "Ordenar las etiquetas"), run: () => sortTags() });
        return list;
      },
      status: () => L(keys.map((k) => `${LBL[k].en} ${fmt(pos[k])}`).join(", "), keys.map((k) => `${LBL[k].es} ${fmt(pos[k])}`).join(", ")),
      hints,
      async check() {
        if (!touched)
          return {
            ok: false,
            incomplete: true,
            feedback: L("Move a marker along the ruler first.", "Primero mueve un marcador por la regla."),
          };
        const res = variant === "median" ? M.judgeMedian(g, pos.med) : M.judgeBox(g, pos);
        api.sfx.place();
        dropDots((v) => (variant === "box" && v >= pos.q1 && v <= pos.q3 ? GOLD : kit.accent));
        await kit.wait(350);
        const left = M.below(g.data, pos.med);
        const right = M.above(g.data, pos.med);
        kit.floatText(xOf(pos.med) - 40, AX - 70, `${left} ◀`, "#ffd76a", 18);
        kit.floatText(xOf(pos.med) + 40, AX - 70, `▶ ${right}`, "#ffd76a", 18);
        await kit.wait(450);
        if (res.ok) {
          kit.burst(xOf(pos.med), AX - 30, kit.accent, 24);
          return { ok: true };
        }
        kit.shake(0.003, 120);
        return miss(res.tag, { n: g.n, left, right });
      },
      async demo() {
        await sortTags();
        for (let i = 0; i < keys.length; i++) {
          sel = i;
          const key = keys[i];
          const from = pos[key];
          for (let s = 1; s <= 5; s++) {
            pos[key] = from + ((target[key] - from) * s) / 5;
            draw();
            await kit.wait(50);
          }
          pos[key] = target[key];
          touched = true;
          draw();
          kit.floatText(xOf(target[key]), AX - 40, `${api.t(LBL[key])} ${fmt(target[key])}`, "#ffd76a", 16);
          api.sfx.tick(i * 3);
          await kit.wait(380);
        }
        dropDots((v) => (variant === "box" && v >= f.q1 && v <= f.q3 ? GOLD : kit.accent));
        await kit.wait(500);
      },
      explain: () =>
        variant === "median"
          ? L(
              `Sorted, the middle of the ${n} tags is ${fmt(f.med)}: half the tags are below it and half are above.`,
              `En orden, el centro de las ${n} etiquetas es ${fmt(f.med)}: la mitad queda por debajo y la mitad por encima.`,
            )
          : L(
              `Five-number summary: ${f.min}, ${fmt(f.q1)}, ${fmt(f.med)}, ${fmt(f.q3)}, ${f.max}. The box holds the middle half of the ${who}.`,
              `Resumen de cinco números: ${f.min}, ${fmt(f.q1)}, ${fmt(f.med)}, ${fmt(f.q3)}, ${f.max}. La caja guarda la mitad central de los ${who}.`,
            ),
    };

    /* Range and IQR: the fence (range) and the core zone (IQR) the student types. */
    function spreadControls() {
      const cells = [
        { label: L("Fence = RANGE", "Cerca = RANGO"), text: "", x: 270 },
        { label: L("Core zone = IQR", "Zona central = RIC"), text: "", x: 550 },
      ];
      const cg = scene.add.graphics().setDepth(22);
      const ctext = cells.map((c) => kit.text(c.x, 232, "", 22, "#ffe9a8", { depth: 23, weight: "900" }));
      cells.forEach((c) => kit.text(c.x, 198, api.t(c.label), 14, "#cfe3ee", { depth: 23, weight: "800" }));
      const fenceG = scene.add.graphics().setDepth(22);
      const ent = entry(api, cells, draw);
      function draw() {
        cg.clear();
        cells.forEach((c, i) => {
          cellBox(cg, c.x, 232, 120, i === ent.sel);
          ctext[i].setText(showTyped(c.text) || (i === ent.sel ? "▮" : "?"));
        });
        fenceG.clear();
        api.refresh();
      }
      cells.forEach((c, i) => {
        scene.add
          .zone(c.x, 232, 124, 48)
          .setInteractive({ useHandCursor: true })
          .setDepth(24)
          .on("pointerdown", () => {
            ent.sel = i;
            draw();
          });
      });
      draw();
      const R = f.max - f.min;
      const I = f.q3 - f.q1;
      function showFences(range, iqr) {
        fenceG.clear();
        if (range != null) {
          fenceG.lineStyle(6, near(range, R) ? GOOD : WARN, 1).lineBetween(xOf(f.min), AX - 74, xOf(Math.min(g.axis.hi + 2, f.min + range)), AX - 74);
          fenceG.fillStyle(0xeaf6ff, 1).fillRect(xOf(f.min) - 2, AX - 86, 4, 24);
        }
        if (iqr != null) {
          fenceG.fillStyle(near(iqr, I) ? GOOD : WARN, 0.35).fillRect(xOf(f.q1), AX - 64, xOf(Math.min(g.axis.hi + 2, f.q1 + iqr)) - xOf(f.q1), 16);
        }
      }
      return {
        checkLabel: L("Build the fences", "Construir las cercas"),
        get actions() {
          const list = [
            { key: "ArrowRight", label: L("Next box →", "Casilla siguiente →"), run: () => ((ent.sel = (ent.sel + 1) % 2), draw()) },
            { key: "ArrowLeft", label: L("← Previous box", "← Casilla anterior"), run: () => ((ent.sel = (ent.sel + 1) % 2), draw()) },
            { key: "Backspace", label: L("Erase digit", "Borrar dígito"), run: () => ent.type("Backspace") },
          ];
          if (!sorted) list.push({ key: "s", label: L("Sort the tags", "Ordenar las etiquetas"), run: () => sortTags() });
          return list;
        },
        status: () =>
          L(
            `Range ${showTyped(cells[0].text) || "empty"}, IQR ${showTyped(cells[1].text) || "empty"}`,
            `Rango ${showTyped(cells[0].text) || "vacío"}, RIC ${showTyped(cells[1].text) || "vacío"}`,
          ),
        hints: [
          L(
            "Sort the tags. Range = greatest − least. IQR = Q3 − Q1, where Q1 and Q3 are the middles of the lower and upper halves.",
            "Ordena las etiquetas. Rango = mayor − menor. RIC = Q3 − Q1, donde Q1 y Q3 son los centros de la mitad inferior y la superior.",
          ),
          L(
            `In order, the first ${h} tags are the lower half (the median stays out). Q1 is their middle. Do the same for the last ${h} tags.`,
            `En orden, las primeras ${h} etiquetas son la mitad inferior (la mediana queda fuera). Q1 es su centro. Haz lo mismo con las últimas ${h}.`,
          ),
        ],
        async check() {
          const range = num(cells[0].text);
          const iqr = num(cells[1].text);
          const res = M.judgeSpread(g, range, iqr);
          if (res.incomplete)
            return {
              ok: false,
              incomplete: true,
              feedback: L("Type both numbers: the range and the IQR.", "Escribe los dos números: el rango y el RIC."),
            };
          api.sfx.place();
          dropDots((v) => (v >= f.q1 && v <= f.q3 ? GOLD : kit.accent));
          showFences(range, iqr);
          await kit.wait(600);
          if (res.ok) {
            kit.burst(xOf((f.min + f.max) / 2), AX - 74, kit.accent, 24);
            return { ok: true };
          }
          return miss(res.tag, { n: g.n });
        },
        async demo() {
          await sortTags();
          ent.sel = 0;
          cells[0].text = String(R);
          draw();
          kit.floatText(270, 200, `${f.max} − ${f.min} = ${R}`, "#ffd76a", 20);
          await kit.wait(1100);
          ent.sel = 1;
          cells[1].text = fmt(I);
          draw();
          kit.floatText(550, 200, `${fmt(f.q3)} − ${fmt(f.q1)} = ${fmt(I)}`, "#ffd76a", 20);
          await kit.wait(1100);
          dropDots((v) => (v >= f.q1 && v <= f.q3 ? GOLD : kit.accent));
          showFences(R, I);
          await kit.wait(500);
        },
        explain: () =>
          L(
            `Range = ${f.max} − ${f.min} = ${R}. IQR = ${fmt(f.q3)} − ${fmt(f.q1)} = ${fmt(I)}. The core zone holds the middle half of the tags.`,
            `Rango = ${f.max} − ${f.min} = ${R}. RIC = ${fmt(f.q3)} − ${fmt(f.q1)} = ${fmt(I)}. La zona central guarda la mitad central de las etiquetas.`,
          ),
      };
    }
  }

  window.DD_MISSIONS.boxplot = boxplot;
  window.DD_MISSIONS.entry = entry;
  window.DD_MISSIONS.cellBox = cellBox;
  window.DD_MISSIONS.showTyped = showTyped;
})();
