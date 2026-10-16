/* Wildlife Signal — mission builder, part 3: the Migration Observatory console (report).
 *   variant "mad"      distance ropes from the mean, then the MAD (2-9)
 *   variant "compare"  find the mean and MAD yourself, then track the more consistent flock (2-9)
 *   variant "choose"   an outlier appears: choose center + spread, then place the beacon (2-10)
 */
(function () {
  "use strict";
  const D = window.DD_MISSIONS;
  if (!window.EWLExpedition || !D || !D.entry) return;
  const { L, fmt, num, near, miss, chip, scaleX, PANEL, GOLD, WARN, GOOD, entry, cellBox, showTyped } = D;
  const M = D.math;

  function report(scene, api) {
    return (api.mission.variant || "mad") === "choose" ? choose(scene, api) : madConsole(scene, api);
  }

  /* ── MAD ropes (+ compare two flocks) ──────────────────────────────────── */
  function madConsole(scene, api) {
    const { kit, rng } = api;
    const compare = api.mission.variant === "compare";
    const g = M.genMad(rng, api.tier, compare);
    const n = g.n;
    let choice = null;
    api.setBrief(
      compare
        ? L(
            `${api.t(g.ctx.name)} (flock A). Find the mean, each distance from it, and the MAD. Flock B's MAD is ${fmt(g.other)}. Track the MORE CONSISTENT flock.`,
            `${api.t(g.ctx.name)} (bandada A). Halla la media, cada distancia a ella y la DMA. La DMA de la bandada B es ${fmt(g.other)}. Sigue a la bandada MÁS CONSTANTE.`,
          )
        : L(
            `${api.t(g.ctx.name)}. The mean is ${g.mean}. Type how far each tag is from the mean, then the MAD (the mean of those distances).`,
            `${api.t(g.ctx.name)}. La media es ${g.mean}. Escribe qué tan lejos está cada etiqueta de la media y luego la DMA (la media de esas distancias).`,
          ),
    );
    kit.panel(24, 140, compare ? 590 : 772, 334, { fill: PANEL, alpha: 0.88 });
    const cx0 = compare ? 330 : 410;
    const step = compare ? 86 : 92;
    const cells = [];
    if (compare) cells.push({ kind: "mean", text: "" });
    g.data.forEach((v, i) => cells.push({ kind: "dist", i, text: "" }));
    cells.push({ kind: "mad", text: "" });
    cells.forEach((c, k) => {
      c.x = cx0 + (k - (cells.length - 1) / 2) * step;
    });
    const CY = 220;
    cells.forEach((c) => {
      if (c.kind === "dist") chip(scene, kit, c.x, 166, 54, String(g.data[c.i]));
      else kit.text(c.x, 166, api.t(c.kind === "mean" ? L("MEAN", "MEDIA") : L("MAD", "DMA")), 15, "#ffd76a", { depth: 23, weight: "900" });
    });
    kit.text(cx0, 254, api.t(L("distance from the mean (never negative)", "distancia a la media (nunca negativa)")), 12, "#9fb7c4", { depth: 23 });
    const cg = scene.add.graphics().setDepth(22);
    const ctext = cells.map((c) => kit.text(c.x, CY, "", 20, "#ffe9a8", { depth: 23, weight: "900" }));
    cells.forEach((c, k) =>
      scene.add
        .zone(c.x, CY, step - 8, 46)
        .setInteractive({ useHandCursor: true })
        .setDepth(24)
        .on("pointerdown", () => {
          ent.sel = k;
          draw();
        }),
    );
    // Line plot with the mean line and one rope per tag.
    const lo = 0;
    const hi = 15;
    const xOf = scaleX(lo, hi, 70, compare ? 600 : 740);
    const AX = 350;
    const plot = scene.add.graphics().setDepth(21);
    plot.lineStyle(2, 0xeaf6ff, 0.85).lineBetween(xOf(lo) - 8, AX, xOf(hi) + 8, AX);
    for (let v = lo; v <= hi; v++) {
      plot.lineStyle(2, 0xeaf6ff, 0.6).lineBetween(xOf(v), AX - 5, xOf(v), AX + 5);
      kit.text(xOf(v), AX + 15, String(v), 11, "#cfe3ee", { depth: 22 });
    }
    const stack = {};
    g.data.forEach((v) => {
      stack[v] = (stack[v] || 0) + 1;
      plot.fillStyle(kit.accent, 1).fillCircle(xOf(v), AX - 10 - (stack[v] - 1) * 14, 6);
    });
    const ropes = scene.add.graphics().setDepth(22);
    const meanLbl = kit.text(0, 274, "", 13, "#ffd76a", { depth: 23, weight: "800" });
    const ent = entry(api, cells, draw);
    const typedMean = () => (compare ? num(cells[0].text) : g.mean);
    function draw(marks) {
      cg.clear();
      cells.forEach((c, k) => {
        cellBox(cg, c.x, CY, step - 12, k === ent.sel, marks?.[k] ? WARN : c.kind === "dist" ? 0x5e92b3 : GOLD);
        ctext[k].setText(showTyped(c.text) || (k === ent.sel ? "▮" : "?"));
      });
      ropes.clear();
      const m = typedMean();
      if (m != null && m >= lo && m <= hi) {
        for (let y = 282; y < AX + 74; y += 10) ropes.lineStyle(2, GOLD, 0.9).lineBetween(xOf(m), y, xOf(m), y + 5);
        meanLbl.setText(api.t(L(`mean ${fmt(m)}`, `media ${fmt(m)}`))).setX(xOf(m));
        cells.forEach((c) => {
          if (c.kind !== "dist") return;
          const y = AX + 30 + c.i * 9;
          const v = g.data[c.i];
          ropes.lineStyle(2, 0xeaf6ff, 0.5).strokeCircle(xOf(v), y, 3);
          const d = num(c.text);
          if (d == null) return;
          const dir = v >= m ? 1 : -1;
          const end = Phaser.Math.Clamp(m + dir * d, lo - 1, hi + 1);
          ropes.lineStyle(3, d < 0 ? WARN : kit.accent, 1).lineBetween(xOf(m), y, xOf(end), y);
          ropes.fillStyle(d < 0 ? WARN : kit.accent, 1).fillCircle(xOf(end), y, 3);
        });
      } else meanLbl.setText("");
      drawChoice();
      api.refresh();
    }
    // Compare: flock B card + the choice of flock to track.
    let drawChoice = () => {};
    if (compare) {
      kit.panel(624, 272, 172, 150, { alpha: 0.9 });
      kit.text(710, 290, api.t(L("Flock B", "Bandada B")), 15, "#ffd76a", { depth: 23, weight: "800" });
      kit.text(710, 314, api.t(L(`MAD = ${fmt(g.other)}`, `DMA = ${fmt(g.other)}`)), 16, "#ffffff", { depth: 23, weight: "800" });
      kit.text(710, 338, api.t(L("Track which flock?", "¿Qué bandada seguir?")), 12, "#cfe3ee", { depth: 23 });
      const bA = kit.button(668, 384, 76, 40, "A", () => pick(0), { size: 18 });
      const bB = kit.button(752, 384, 76, 40, "B", () => pick(1), { size: 18 });
      const ring = scene.add.graphics().setDepth(31);
      drawChoice = () => {
        ring.clear();
        if (choice == null) return;
        const b = choice === 0 ? bA : bB;
        ring.lineStyle(4, GOLD, 1).strokeRoundedRect(b.x - 42, b.y - 24, 84, 50, 14);
      };
    }
    function pick(c) {
      choice = c;
      api.sfx.select();
      draw();
    }
    draw();
    const dist0 = g.dists[0];
    const s = M.total(g.data);
    return {
      checkLabel: compare ? L("Track the flock", "Seguir a la bandada") : L("Send the report", "Enviar el informe"),
      get actions() {
        const list = [
          { key: "ArrowRight", label: L("Next box →", "Casilla siguiente →"), run: () => ((ent.sel = (ent.sel + 1) % cells.length), draw()) },
          { key: "ArrowLeft", label: L("← Previous box", "← Casilla anterior"), run: () => ((ent.sel = (ent.sel + cells.length - 1) % cells.length), draw()) },
          { key: "Backspace", label: L("Erase digit", "Borrar dígito"), run: () => ent.type("Backspace") },
        ];
        if (compare)
          list.push(
            { key: "a", label: L("Track flock A", "Seguir a la bandada A"), run: () => pick(0) },
            { key: "b", label: L("Track flock B", "Seguir a la bandada B"), run: () => pick(1) },
          );
        return list;
      },
      status: () => {
        const filled = cells.filter((c) => c.text !== "").length;
        return L(
          `Box ${ent.sel + 1} of ${cells.length}: ${showTyped(cells[ent.sel].text) || "empty"}. Filled ${filled}.${compare ? ` Tracking: ${choice == null ? "none" : choice ? "B" : "A"}.` : ""}`,
          `Casilla ${ent.sel + 1} de ${cells.length}: ${showTyped(cells[ent.sel].text) || "vacía"}. Llenas ${filled}.${compare ? ` Sigues: ${choice == null ? "ninguna" : choice ? "B" : "A"}.` : ""}`,
        );
      },
      hints: compare
        ? [
            L(
              `Mean: add the tags, divide by ${n}. Distances: how far each tag is from the mean. MAD: the mean of the distances. Smaller MAD = more consistent.`,
              `Media: suma las etiquetas y divide entre ${n}. Distancias: qué tan lejos está cada una de la media. DMA: la media de las distancias. DMA menor = más constante.`,
            ),
            L(
              `The tags add up to ${s}, so the mean is ${s} ÷ ${n}. Then measure each tag's distance from it.`,
              `Las etiquetas suman ${s}, así que la media es ${s} ÷ ${n}. Luego mide la distancia de cada etiqueta a ella.`,
            ),
          ]
        : [
            L(
              "MAD is the mean of the distances from the mean. Find each distance (never negative), add them, then divide.",
              "La DMA es la media de las distancias a la media. Halla cada distancia (nunca negativa), súmalas y luego divide.",
            ),
            L(
              `Tag ${g.data[0]} is ${dist0} away from ${g.mean}. Find the other distances the same way, add all ${n}, then divide by ${n}.`,
              `La etiqueta ${g.data[0]} está a ${dist0} de ${g.mean}. Halla las otras distancias igual, suma las ${n} y divide entre ${n}.`,
            ),
          ],
      async check() {
        const res = M.judgeMad(g, {
          mean: compare ? cells[0].text : String(g.mean),
          dists: cells.filter((c) => c.kind === "dist").map((c) => c.text),
          mad: cells[cells.length - 1].text,
          choice,
        });
        if (res.incomplete)
          return {
            ok: false,
            incomplete: true,
            feedback: res.needChoice
              ? L("Now choose the flock to track: A or B.", "Ahora elige la bandada que vas a seguir: A o B.")
              : L("Fill every box first.", "Primero llena todas las casillas."),
          };
        api.sfx.whoosh();
        if (res.ok) {
          const m = g.mean;
          ropes.fillStyle(GOOD, 0.25).fillRect(xOf(m - g.mad), AX - 50, xOf(m + g.mad) - xOf(m - g.mad), 50);
          kit.burst(xOf(m), AX - 30, kit.accent, 24);
          kit.floatText(xOf(m), AX - 60, api.t(L("Signal locked", "Señal fijada")), "#a4dfb0", 18);
          await kit.wait(400);
          return { ok: true };
        }
        const marks = cells.map((c) => {
          const v = num(c.text);
          if (v == null) return false;
          if (c.kind === "dist") return !near(v, g.dists[c.i]);
          if (c.kind === "mean") return !near(v, g.mean);
          return false;
        });
        draw(marks);
        return miss(res.tag, { n });
      },
      async demo() {
        const plan = cells.map((c) => (c.kind === "mean" ? String(g.mean) : c.kind === "dist" ? String(g.dists[c.i]) : fmt(g.mad)));
        for (let k = 0; k < cells.length; k++) {
          ent.sel = k;
          const c = cells[k];
          c.text = plan[k];
          draw();
          const note =
            c.kind === "mean"
              ? `${s} ÷ ${n} = ${g.mean}`
              : c.kind === "dist"
                ? `|${g.data[c.i]} − ${g.mean}| = ${g.dists[c.i]}`
                : `${M.total(g.dists)} ÷ ${n} = ${fmt(g.mad)}`;
          kit.floatText(c.x, 190, note, "#ffd76a", 15);
          api.sfx.tick(k * 2);
          await kit.wait(c.kind === "dist" ? 450 : 900);
        }
        if (compare) {
          choice = g.mad < g.other ? 0 : 1;
          draw();
          await kit.wait(500);
        }
      },
      explain: () =>
        compare
          ? L(
              `Flock A: mean ${g.mean}, MAD ${fmt(g.mad)}. Flock B: MAD ${fmt(g.other)}. The smaller MAD stays closer to its mean, so flock ${g.mad < g.other ? "A" : "B"} is more consistent.`,
              `Bandada A: media ${g.mean}, DMA ${fmt(g.mad)}. Bandada B: DMA ${fmt(g.other)}. La DMA menor queda más cerca de su media: la bandada ${g.mad < g.other ? "A" : "B"} es más constante.`,
            )
          : L(
              `Distances ${g.dists.join(" + ")} = ${M.total(g.dists)}. MAD = ${M.total(g.dists)} ÷ ${n} = ${fmt(g.mad)}: on average a tag is ${fmt(g.mad)} from the mean.`,
              `Distancias ${g.dists.join(" + ")} = ${M.total(g.dists)}. DMA = ${M.total(g.dists)} ÷ ${n} = ${fmt(g.mad)}: en promedio una etiqueta está a ${fmt(g.mad)} de la media.`,
            ),
    };
  }

  /* ── choose: the right measure when an outlier shows up (2-10) ─────────── */
  function choose(scene, api) {
    const { kit, rng } = api;
    const g = M.genChoose(rng, api.tier);
    const sel = { center: null, spread: null };
    api.setBrief(
      L(
        `${api.t(g.ctx.name)}. Choose the center and spread that describe these ${api.t(g.ctx.what)} best, then place the supply beacon at that center.`,
        `${api.t(g.ctx.name)}. Elige el centro y la dispersión que mejor describen estos ${api.t(g.ctx.what)} y coloca la baliza en ese centro.`,
      ),
    );
    const opts = {
      center: [
        ["mean", L("Mean", "Media")],
        ["median", L("Median", "Mediana")],
      ],
      spread: [
        ["mad", L("MAD", "DMA")],
        ["iqr", L("IQR", "RIC")],
      ],
    };
    kit.panel(24, 140, 772, 334, { fill: PANEL, alpha: 0.88 });
    const pills = scene.add.graphics().setDepth(22);
    const rows = [
      ["center", L("Center", "Centro"), 180],
      ["spread", L("Spread", "Dispersión"), 230],
    ];
    const pillText = {};
    rows.forEach(([key, label, y]) => {
      kit.text(196, y, api.t(label), 15, "#cfe3ee", { ox: 1, depth: 23, weight: "800" });
      pillText[key] = opts[key].map(([id, l], i) => {
        const x = 270 + i * 124;
        scene.add
          .zone(x, y, 116, 40)
          .setInteractive({ useHandCursor: true })
          .setDepth(24)
          .on("pointerdown", () => setOpt(key, id));
        return kit.text(x, y, api.t(l), 16, "#ffffff", { depth: 23, weight: "800" });
      });
    });
    const cells = [{ text: "" }];
    kit.text(640, 180, api.t(L("Beacon at", "Baliza en")), 15, "#cfe3ee", { depth: 23, weight: "800" });
    const cg = scene.add.graphics().setDepth(22);
    const ctext = kit.text(640, 226, "", 22, "#ffe9a8", { depth: 23, weight: "900" });
    const xOf = scaleX(g.axis.lo, g.axis.hi, 70, 750);
    const AX = 372;
    const plot = scene.add.graphics().setDepth(21);
    plot.lineStyle(2, 0xeaf6ff, 0.85).lineBetween(xOf(g.axis.lo) - 8, AX, xOf(g.axis.hi) + 8, AX);
    const every = g.axis.hi - g.axis.lo > 20 ? 2 : 1;
    for (let v = g.axis.lo; v <= g.axis.hi; v++) {
      plot.lineStyle(2, 0xeaf6ff, 0.6).lineBetween(xOf(v), AX - 4, xOf(v), AX + 4);
      if ((v - g.axis.lo) % every === 0) kit.text(xOf(v), AX + 15, String(v), 11, "#cfe3ee", { depth: 22 });
    }
    const stack = {};
    g.sorted.forEach((v) => {
      stack[v] = (stack[v] || 0) + 1;
      plot.fillStyle(v === g.outlier ? WARN : kit.accent, 1).fillCircle(xOf(v), AX - 10 - (stack[v] - 1) * 14, 6);
    });
    const beacon = scene.add.graphics().setDepth(23);
    const ent = entry(api, cells, draw);
    function setOpt(key, id) {
      sel[key] = id;
      api.sfx.select();
      draw();
    }
    const cycle = (key) => setOpt(key, sel[key] === opts[key][0][0] ? opts[key][1][0] : opts[key][0][0]);
    function draw(tone) {
      pills.clear();
      rows.forEach(([key, , y]) =>
        opts[key].forEach(([id], i) => {
          const x = 270 + i * 124;
          const on = sel[key] === id;
          pills.fillStyle(on ? kit.mix(kit.accent, 0x000000, 0.45) : 0x10283a, 1).fillRoundedRect(x - 58, y - 19, 116, 38, 19);
          pills.lineStyle(on ? 3 : 2, on ? GOLD : 0x5e92b3, 1).strokeRoundedRect(x - 58, y - 19, 116, 38, 19);
        }),
      );
      cg.clear();
      cellBox(cg, 640, 226, 120, true, tone);
      ctext.setText(showTyped(cells[0].text) || "▮");
      beacon.clear();
      const v = num(cells[0].text);
      if (v != null && v >= g.axis.lo && v <= g.axis.hi) {
        const x = xOf(v);
        beacon.lineStyle(3, tone || GOLD, 1).lineBetween(x, AX, x, AX - 84);
        beacon.fillStyle(tone || GOLD, 1).fillTriangle(x, AX - 84, x + 22, AX - 76, x, AX - 68);
      }
      api.refresh();
    }
    draw();
    const s = M.total(g.data);
    return {
      checkLabel: L("Send the supply drop", "Enviar los suministros"),
      get actions() {
        return [
          { key: "c", label: L("Switch center", "Cambiar centro"), run: () => cycle("center") },
          { key: "s", label: L("Switch spread", "Cambiar dispersión"), run: () => cycle("spread") },
          { key: "Backspace", label: L("Erase digit", "Borrar dígito"), run: () => ent.type("Backspace") },
        ];
      },
      status: () =>
        L(
          `Center ${sel.center || "not chosen"}, spread ${sel.spread || "not chosen"}, beacon at ${showTyped(cells[0].text) || "empty"}.`,
          `Centro ${sel.center ? (sel.center === "mean" ? "media" : "mediana") : "sin elegir"}, dispersión ${sel.spread ? (sel.spread === "mad" ? "DMA" : "RIC") : "sin elegir"}, baliza en ${showTyped(cells[0].text) || "vacía"}.`,
        ),
      hints: [
        L(
          "Look at the shape first. An outlier or a lopsided shape: use median and IQR. Symmetric with no outlier: use mean and MAD.",
          "Mira primero la forma. Con un valor atípico o forma desigual: usa mediana y RIC. Simétrica y sin valores atípicos: usa media y DMA.",
        ),
        g.skewed
          ? L(
              `The tag at ${g.outlier} is far from the others. Order all ${g.n} tags and find the middle.`,
              `La etiqueta ${g.outlier} está lejos de las demás. Ordena las ${g.n} etiquetas y busca el centro.`,
            )
          : L(
              `The tags mirror each other around the middle. They add up to ${s}; divide by ${g.n}.`,
              `Las etiquetas se reflejan alrededor del centro. Suman ${s}; divide entre ${g.n}.`,
            ),
      ],
      async check() {
        const res = M.judgeChoose(g, { center: sel.center, spread: sel.spread, value: cells[0].text });
        if (res.incomplete) {
          const ask = {
            center: L("Choose a center: mean or median (key C).", "Elige un centro: media o mediana (tecla C)."),
            spread: L("Choose a spread: MAD or IQR (key S).", "Elige una dispersión: DMA o RIC (tecla S)."),
            value: L("Type where the beacon goes.", "Escribe dónde va la baliza."),
          };
          return { ok: false, incomplete: true, feedback: ask[res.need] };
        }
        api.sfx.whoosh();
        await kit.wait(300);
        if (res.ok) {
          draw(GOOD);
          kit.burst(xOf(num(cells[0].text)), AX - 84, kit.accent, 26);
          return { ok: true };
        }
        draw(WARN);
        return miss(res.tag, { o: g.outlier, n: g.n, left: res.left, right: res.right });
      },
      async demo() {
        const c = g.skewed ? "median" : "mean";
        setOpt("center", c);
        kit.floatText(330, 160, api.t(g.skewed ? L("outlier → median", "valor atípico → mediana") : L("symmetric → mean", "simétrica → media")), "#ffd76a", 16);
        await kit.wait(900);
        setOpt("spread", g.skewed ? "iqr" : "mad");
        await kit.wait(700);
        const want = g.skewed ? g.median : g.mean;
        kit.floatText(640, 196, g.skewed ? `${api.t(L("middle", "centro"))} = ${fmt(want)}` : `${s} ÷ ${g.n} = ${fmt(want)}`, "#ffd76a", 18);
        cells[0].text = fmt(want);
        draw(GOOD);
        await kit.wait(900);
      },
      explain: () =>
        g.skewed
          ? L(
              `The outlier ${g.outlier} pulls the mean to ${fmt(g.mean)}. The median, ${fmt(g.median)}, stays with the group, so median and IQR describe these ${api.t(g.ctx.what)}.`,
              `El valor atípico ${g.outlier} jala la media a ${fmt(g.mean)}. La mediana, ${fmt(g.median)}, se queda con el grupo: mediana y RIC describen estos ${api.t(g.ctx.what)}.`,
            )
          : L(
              `The data is symmetric with no outlier, so the mean, ${fmt(g.mean)}, and the MAD describe it well.`,
              `Los datos son simétricos y sin valores atípicos, así que la media, ${fmt(g.mean)}, y la DMA los describen bien.`,
            ),
    };
  }

  window.DD_MISSIONS.report = report;
})();
