/* Neon Grid — transit and plant missions for the Percent Power expedition.
 *   transit  a plant's output runs along a percent bar to a station. The student sets the MW:
 *            find p% of N exactly, estimate it with a benchmark, or compare two lines.
 *   plant    the district gets P MW, which is p% of the plant. The student sets the plant's
 *            total; the plant then really sends p% of THAT, so a wrong total shows its result.
 */
(function () {
  "use strict";
  const M = window.PP_MISSIONS;
  if (!window.EWLExpedition || !M || !M.meter) return;
  const { L, COLORS } = M;
  const { GOLD, CYAN, RED, PANEL } = COLORS;

  /** Smokestack power plant icon with its output label. */
  function plantIcon(scene, kit, x, y, label, lit) {
    const g = scene.add.graphics().setDepth(21);
    g.fillStyle(0x161b33, 1).fillRect(x - 46, y - 10, 92, 54);
    g.fillStyle(0x1f2644, 1)
      .fillRect(x - 36, y - 52, 18, 44)
      .fillRect(x + 8, y - 66, 18, 58);
    g.fillStyle(lit ? GOLD : 0x3a4166, 1)
      .fillRect(x - 32, y + 6, 14, 12)
      .fillRect(x + 14, y + 6, 14, 12);
    g.lineStyle(2, 0x46507a, 1).strokeRect(x - 46, y - 10, 92, 54);
    if (label) kit.text(x, y + 62, label, 20, "#ffffff", { weight: "900" });
    return g;
  }

  /** Percent bar (top) over a MW number line (bottom), with 10% ticks. */
  function percentBar(scene, kit, x0, x1, y, N, opts = {}) {
    const g = scene.add.graphics().setDepth(21);
    const fill = scene.add.graphics().setDepth(22);
    const step = opts.step || 10;
    g.fillStyle(0x050815, 1).fillRoundedRect(x0, y - 16, x1 - x0, 32, 6);
    g.lineStyle(2, 0x5e7bd6, 1).strokeRoundedRect(x0, y - 16, x1 - x0, 32, 6);
    for (let q = step; q < 100; q += step) {
      const tx = x0 + ((x1 - x0) * q) / 100;
      g.lineStyle(1, 0x5d6797, 1).lineBetween(tx, y - 16, tx, y + 16);
    }
    kit.text(x0, y - 30, "0%", 13, "#9fb3d8", { weight: "800" });
    kit.text(x1, y - 30, "100%", 13, "#9fb3d8", { weight: "800" });
    kit.text(x0, y + 30, "0", 13, "#9fb3d8", { weight: "800" });
    if (N != null) kit.text(x1, y + 30, N + " MW", 14, "#ffffff", { weight: "900" });
    const tickLabels = [];
    return {
      g,
      /** Show what a sent amount fills (after a check). */
      show(v, color) {
        fill.clear();
        if (!N) return;
        const k = v / N;
        fill
          .fillStyle(color, 0.85)
          .fillRoundedRect(x0 + 2, y - 13, Math.min(1, k) * (x1 - x0 - 4), 26, 5);
        if (k > 1) {
          fill.fillStyle(RED, 0.9).fillTriangle(x1 + 4, y - 14, x1 + 4, y + 14, x1 + 22, y);
        }
      },
      clear() {
        fill.clear();
      },
      /** Demo: label each chunk with its MW value. */
      async labelChunks(chunk, value, color = "#f8d877") {
        for (let q = chunk; q <= 100; q += chunk) {
          if (q === 100 && N != null) break;
          const tx = x0 + ((x1 - x0) * q) / 100;
          tickLabels.push(
            kit.text(tx, y + 44, M.fmt((value * q) / chunk), 12, color, {
              weight: "800",
              depth: 23,
            }),
          );
          await kit.wait(90);
        }
      },
      xAt: (q) => x0 + ((x1 - x0) * q) / 100,
    };
  }

  /* ── transit: find, estimate or compare p% of a plant's output ────────── */
  function transit(scene, api) {
    const { kit, rng } = api;
    const variant = api.mission.variant || "find";
    if (variant === "compare") return compare(scene, api);
    const est = variant === "estimate";
    const prob = est ? M.genEstimate(rng) : M.genFind(rng, api.tier);
    const { p, N } = prob;
    api.setBrief(
      est
        ? L(
            `The Skyline plant makes ${N} MW (megawatts). The station needs about ${p}% of it. Use a friendly percent to ESTIMATE the MW, then send it.`,
            `La planta Skyline produce ${N} MW (megavatios). La estación necesita cerca del ${p}%. Usa un porcentaje fácil para ESTIMAR los MW y envíalos.`,
          )
        : L(
            `The Skyline plant makes ${N} MW (megawatts). The transit station needs exactly ${p}% of it. Set how many MW to send.`,
            `La planta Skyline produce ${N} MW (megavatios). La estación de tránsito necesita exactamente el ${p}%. Ajusta cuántos MW enviar.`,
          ),
    );
    kit.panel(20, 140, 780, 252, { fill: PANEL, alpha: 0.9 });
    plantIcon(scene, kit, 100, 236, N + " MW", true);
    kit.text(100, 152, api.t(L("PLANT", "PLANTA")), 14, "#f8d877", { weight: "800" });
    const bar = percentBar(scene, kit, 200, 580, 214, N);
    kit.text(
      390,
      168,
      api.t(L("The whole output = 100%", "Toda la producción = 100%")),
      14,
      "#cfd8f5",
      {
        weight: "800",
      },
    );
    const town = M.district(scene, kit, 612, 166, 176, 120, { seed: 31 });
    kit.text(
      700,
      306,
      api.t(est ? L(`needs ≈ ${p}%`, `necesita ≈ ${p}%`) : L(`needs ${p}%`, `necesita ${p}%`)),
      18,
      "#f8d877",
      { weight: "900" },
    );
    if (est)
      kit.text(700, 332, api.t(L("a close load works", "una carga cercana sirve")), 13, "#9fb3d8", {
        weight: "700",
      });
    const m = M.meter(scene, api, 390, 322, {
      caption: est
        ? L("Your estimate", "Tu estimación")
        : L("Send to the station", "Enviar a la estación"),
      max: 999,
    });
    const reset = () => {
      bar.clear();
      town.reset();
    };
    M.meterButtons(scene, kit, m, 390, 368, [-10, -1, 1, 10], 70, reset);
    kit.keypad(150, 448, (key) => {
      reset();
      m.type(key);
    });
    kit.onType((key) => {
      reset();
      m.type(key);
    });
    async function send(v, okNow) {
      await M.pulse(scene, kit, [
        { x: 146, y: 200 },
        { x: 200, y: 214 },
        { x: 580, y: 214 },
        { x: 612, y: 226 },
      ]).then((g) => kit.wait(150).then(() => g.destroy()));
      const target = est ? prob.exact : prob.a;
      bar.show(v, okNow ? GOLD : v > target ? RED : 0xc9863a);
      await town.power(okNow ? 1 : v / target);
    }
    const g = M.chunkOf(p);
    const hints = est
      ? [
          L(
            "Round to friendly numbers. Use a benchmark percent: 10% is one tenth, 25% is one fourth, 50% is one half.",
            "Redondea a números fáciles. Usa un porcentaje de referencia: 10% es un décimo, 25% es un cuarto, 50% es la mitad.",
          ),
          L(
            `${p}% is close to ${prob.b}%. ${N} is close to ${prob.Nn}. Find ${prob.b}% of ${prob.Nn}.`,
            `${p}% está cerca de ${prob.b}%. ${N} está cerca de ${prob.Nn}. Halla el ${prob.b}% de ${prob.Nn}.`,
          ),
        ]
      : [
          L(
            "Percent means out of 100. Split the whole output into equal parts, like 10 parts of 10%, and count the parts you need.",
            "Porcentaje significa de cada 100. Divide toda la producción en partes iguales, como 10 partes de 10%, y cuenta las partes que necesitas.",
          ),
          p === g
            ? L(
                `${p}% is 1 of ${100 / p} equal parts. Split ${N} MW into ${100 / p} equal parts.`,
                `${p}% es 1 de ${100 / p} partes iguales. Divide ${N} MW en ${100 / p} partes iguales.`,
              )
            : L(
                `${g}% of ${N} MW is ${M.fmt((N * g) / 100)} MW. ${p}% is ${p / g} of those parts.`,
                `El ${g}% de ${N} MW es ${M.fmt((N * g) / 100)} MW. El ${p}% son ${p / g} de esas partes.`,
              ),
        ];
    return {
      checkLabel: est
        ? L("Send the estimate", "Enviar la estimación")
        : L("Send power", "Enviar energía"),
      actions: [
        { key: "ArrowUp", label: L("+1 MW", "+1 MW"), run: () => (reset(), m.bump(1)) },
        { key: "ArrowDown", label: L("−1 MW", "−1 MW"), run: () => (reset(), m.bump(-1)) },
        { key: "ArrowRight", label: L("+10 MW", "+10 MW"), run: () => (reset(), m.bump(10)) },
        { key: "ArrowLeft", label: L("−10 MW", "−10 MW"), run: () => (reset(), m.bump(-10)) },
      ],
      status: () => L(`Sending ${m.value} MW`, `Enviando ${m.value} MW`),
      hints,
      async check() {
        const res = est ? M.judgeEstimate(prob, m.value) : M.judgeAmount(prob, m.value);
        if (res.incomplete) return res;
        await send(m.value, res.ok);
        return res;
      },
      async demo() {
        reset();
        m.set(0);
        if (est) {
          kit.floatText(390, 170, `${p}% ≈ ${prob.b}%   ${N} ≈ ${prob.Nn}`, "#f8d877", 22);
          await kit.wait(1100);
          const cg = M.chunkOf(prob.b);
          await bar.labelChunks(cg, (prob.Nn * cg) / 100);
          await kit.wait(500);
          m.set(prob.est);
        } else {
          await bar.labelChunks(g, (N * g) / 100);
          await kit.wait(400);
          kit.floatText(bar.xAt(p), 250, `${p}%`, "#f8d877", 22);
          m.set(prob.a);
        }
        api.refresh();
        await kit.wait(500);
        await send(m.value, true);
      },
      explain: () =>
        est
          ? L(
              `${p}% ≈ ${prob.b}% and ${N} ≈ ${prob.Nn}. ${prob.b}% of ${prob.Nn} = ${prob.est} MW, close to the exact ${M.fmt(prob.exact)} MW.`,
              `${p}% ≈ ${prob.b}% y ${N} ≈ ${prob.Nn}. El ${prob.b}% de ${prob.Nn} = ${prob.est} MW, cerca del valor exacto, ${M.fmt(prob.exact)} MW.`,
            )
          : p === g
            ? L(
                `${p}% is 1 of ${100 / p} equal parts: ${N} ÷ ${100 / p} = ${prob.a} MW.`,
                `${p}% es 1 de ${100 / p} partes iguales: ${N} ÷ ${100 / p} = ${prob.a} MW.`,
              )
            : L(
                `${g}% of ${N} is ${M.fmt((N * g) / 100)}, so ${p}% is ${p / g} × ${M.fmt((N * g) / 100)} = ${prob.a} MW.`,
                `El ${g}% de ${N} es ${M.fmt((N * g) / 100)}, así que el ${p}% es ${p / g} × ${M.fmt((N * g) / 100)} = ${prob.a} MW.`,
              ),
    };
  }

  /* ── compare: two lines; the bigger percent is not the bigger amount ──── */
  function compare(scene, api) {
    const { kit, rng } = api;
    const prob = M.genCompare(rng, api.tier);
    const [A, B] = prob.lines;
    const NAMES = ["A", "B"];
    let sel = 0;
    let choice = -1;
    api.setBrief(
      L(
        `Line A sends ${A.p}% of a ${A.N} MW plant. Line B sends ${B.p}% of a ${B.N} MW plant. Set both meters in MW, then hook the station to the line that sends MORE.`,
        `La línea A envía el ${A.p}% de una planta de ${A.N} MW. La línea B envía el ${B.p}% de una planta de ${B.N} MW. Ajusta los dos medidores en MW y conecta la estación a la línea que envía MÁS.`,
      ),
    );
    const cols = [215, 605];
    const meters = [];
    const frames = scene.add.graphics().setDepth(20);
    prob.lines.forEach((ln, i) => {
      const cx = cols[i];
      kit.text(cx, 156, api.t(L(`Line ${NAMES[i]}`, `Línea ${NAMES[i]}`)), 18, "#f8d877", {
        weight: "900",
      });
      plantIcon(scene, kit, cx - 110, 230, null, true);
      kit.text(cx - 110, 290, ln.N + " MW", 17, "#ffffff", { weight: "900" });
      kit.text(cx + 50, 214, `${ln.p}%`, 36, "#5ee8ff", { weight: "900" });
      kit.text(cx + 50, 250, api.t(L(`of ${ln.N} MW`, `de ${ln.N} MW`)), 15, "#cfd8f5", {
        weight: "800",
      });
      const m = M.meter(scene, api, cx + 40, 310, { w: 150, size: 26, active: i === 0 });
      meters.push(m);
      M.meterButtons(scene, kit, m, cx, 360, [-10, -1, 1, 10], 64, () => pick(i));
      const z = scene.add
        .zone(cx, 250, 360, 130)
        .setInteractive({ useHandCursor: true })
        .setDepth(19);
      z.on("pointerdown", () => pick(i));
    });
    // The station and its switch.
    const sw = scene.add.graphics().setDepth(22);
    const town = M.district(scene, kit, 340, 392, 140, 76, { seed: 9 });
    const choose = (i) => {
      choice = i;
      api.sfx.select();
      draw();
      api.refresh();
    };
    const btnA = kit.button(
      220,
      436,
      170,
      44,
      api.t(L("◀ Use line A", "◀ Usar línea A")),
      () => choose(0),
      {
        size: 16,
      },
    );
    const btnB = kit.button(
      600,
      436,
      170,
      44,
      api.t(L("Use line B ▶", "Usar línea B ▶")),
      () => choose(1),
      {
        size: 16,
      },
    );
    function pick(i) {
      sel = i;
      meters.forEach((mm, k) => mm.setActive(k === i));
      draw();
      api.refresh();
    }
    function draw() {
      frames.clear();
      cols.forEach((cx, i) => {
        frames.fillStyle(PANEL, 0.92).fillRoundedRect(cx - 190, 140, 380, 246, 14);
        frames.lineStyle(sel === i ? 3 : 2, sel === i ? GOLD : 0x3b4466, 1);
        frames.strokeRoundedRect(cx - 190, 140, 380, 246, 14);
      });
      sw.clear();
      sw.lineStyle(5, choice < 0 ? 0x3b4466 : CYAN, 1);
      if (choice === 0) sw.lineBetween(340, 430, 305, 436);
      if (choice === 1) sw.lineBetween(480, 430, 515, 436);
      btnA.setScale(choice === 0 ? 1.06 : 1);
      btnB.setScale(choice === 1 ? 1.06 : 1);
    }
    draw();
    const typeKey = (key) => {
      town.reset();
      meters[sel].type(key);
    };
    kit.onType(typeKey);
    const bump = (d) => {
      town.reset();
      meters[sel].bump(d);
    };
    const chunkHint = (ln) => {
      const g = M.chunkOf(ln.p);
      return g === ln.p
        ? L(
            `${ln.p}% of ${ln.N} is 1 of ${100 / ln.p} equal parts`,
            `el ${ln.p}% de ${ln.N} es 1 de ${100 / ln.p} partes iguales`,
          )
        : L(
            `${g}% of ${ln.N} is ${M.fmt((ln.N * g) / 100)}`,
            `el ${g}% de ${ln.N} es ${M.fmt((ln.N * g) / 100)}`,
          );
    };
    return {
      checkLabel: L("Power the station", "Dar energía"),
      actions: [
        { key: "ArrowUp", label: L("+1 MW", "+1 MW"), run: () => bump(1) },
        { key: "ArrowDown", label: L("−1 MW", "−1 MW"), run: () => bump(-1) },
        { key: "ArrowRight", label: L("+10 MW", "+10 MW"), run: () => bump(10) },
        { key: "ArrowLeft", label: L("−10 MW", "−10 MW"), run: () => bump(-10) },
        { key: "s", label: L("Switch meter (S)", "Cambiar medidor (S)"), run: () => pick(1 - sel) },
        { key: "a", label: L("Use line A", "Usar línea A"), run: () => choose(0) },
        { key: "b", label: L("Use line B", "Usar línea B"), run: () => choose(1) },
      ],
      status: () =>
        L(
          `Meter A ${meters[0].value} MW · Meter B ${meters[1].value} MW · Station on ${choice < 0 ? "no line" : "line " + NAMES[choice]}`,
          `Medidor A ${meters[0].value} MW · Medidor B ${meters[1].value} MW · Estación en ${choice < 0 ? "ninguna línea" : "línea " + NAMES[choice]}`,
        ),
      hints: [
        L(
          "Find the MW on each line first. A bigger percent of a smaller plant can be LESS power.",
          "Primero halla los MW de cada línea. Un porcentaje mayor de una planta más pequeña puede ser MENOS energía.",
        ),
        L(
          `Line A: ${chunkHint(A).en}. Line B: ${chunkHint(B).en}.`,
          `Línea A: ${chunkHint(A).es}. Línea B: ${chunkHint(B).es}.`,
        ),
      ],
      async check() {
        const res = M.judgeCompare(
          prob,
          meters.map((mm) => mm.value),
          choice,
        );
        if (res.incomplete) return res;
        if (res.line != null) pick(res.line);
        const from = res.line != null ? res.line : choice;
        await M.pulse(scene, kit, [
          { x: cols[from] - 110, y: 200 },
          { x: cols[from], y: 400 },
          { x: 410, y: 400 },
        ]).then((g) => kit.wait(120).then(() => g.destroy()));
        if (res.ok) await town.power(1);
        else if (res.line != null) {
          const ln = prob.lines[res.line];
          await town.power(meters[res.line].value / ln.a);
        } else await town.power(prob.lines[choice].a / prob.lines[prob.better].a);
        return res;
      },
      async demo() {
        for (let i = 0; i < 2; i++) {
          pick(i);
          const ln = prob.lines[i];
          const g = M.chunkOf(ln.p);
          kit.floatText(cols[i] + 40, 270, `${g}% = ${M.fmt((ln.N * g) / 100)}`, "#f8d877", 18);
          await kit.wait(700);
          kit.floatText(
            cols[i] + 40,
            270,
            `${ln.p / g} × ${M.fmt((ln.N * g) / 100)}`,
            "#f8d877",
            18,
          );
          meters[i].set(ln.a);
          api.sfx.tick(i * 5);
          await kit.wait(700);
        }
        choose(prob.better);
        await kit.wait(400);
        await town.power(1);
      },
      explain: () =>
        L(
          `Line A: ${A.p}% of ${A.N} = ${A.a} MW. Line B: ${B.p}% of ${B.N} = ${B.a} MW. Line ${NAMES[prob.better]} sends more, even with the smaller percent.`,
          `Línea A: ${A.p}% de ${A.N} = ${A.a} MW. Línea B: ${B.p}% de ${B.N} = ${B.a} MW. La línea ${NAMES[prob.better]} envía más, aunque su porcentaje es menor.`,
        ),
    };
  }

  /* ── plant: find the whole from a part and its percent ────────────────── */
  function plant(scene, api) {
    const { kit, rng } = api;
    const prob = M.genWhole(rng, api.tier);
    const { p, T, P } = prob;
    const g = M.chunkOf(p);
    api.setBrief(
      L(
        `The Night Festival gets ${P} MW. That is ${p}% of everything the plant makes. Set the plant's TOTAL output (100%).`,
        `El Festival Nocturno recibe ${P} MW. Eso es el ${p}% de todo lo que produce la planta. Ajusta la producción TOTAL de la planta (100%).`,
      ),
    );
    kit.panel(20, 140, 780, 290, { fill: PANEL, alpha: 0.9 });
    const X0 = 70;
    const X1 = 590;
    const bar = percentBar(scene, kit, X0, X1, 200, null, { step: Math.max(g, 5) });
    const known = scene.add.graphics().setDepth(22);
    const xp = X0 + ((X1 - X0) * p) / 100;
    known.fillStyle(CYAN, 0.85).fillRoundedRect(X0 + 2, 187, xp - X0 - 2, 26, 5);
    kit.text((X0 + xp) / 2, 166, `${p}% = ${P} MW`, 16, "#5ee8ff", { weight: "900" });
    kit.text(X1, 232, "100% = ? MW", 15, "#f8d877", { weight: "900", ox: 1 });
    plantIcon(scene, kit, 130, 312, null, false);
    const m = M.meter(scene, api, 330, 304, {
      caption: L("Plant total (100%)", "Total de la planta (100%)"),
      max: 999,
    });
    const town = M.district(scene, kit, 620, 160, 170, 110, { seed: 77 });
    kit.text(705, 286, api.t(L(`gets ${P} MW`, `recibe ${P} MW`)), 17, "#f8d877", {
      weight: "900",
    });
    const readout = kit.text(705, 316, "", 14, "#cfd8f5", { weight: "800", wrap: 170 });
    const reset = () => {
      town.reset();
      bar.clear();
      readout.setText("");
    };
    M.meterButtons(scene, kit, m, 330, 372, [-100, -10, -1, 1, 10, 100], 64, reset);
    kit.keypad(150, 452, (key) => {
      reset();
      m.type(key);
    });
    kit.onType((key) => {
      reset();
      m.type(key);
    });
    async function run(v, ok) {
      const sent = M.delivered(prob, v);
      await M.pulse(scene, kit, [
        { x: 160, y: 270 },
        { x: 600, y: 270 },
        { x: 640, y: 240 },
      ]).then((gr) => kit.wait(120).then(() => gr.destroy()));
      readout.setText(
        api.t(
          ok
            ? L(`${p}% of ${v} = ${P} MW`, `${p}% de ${v} = ${P} MW`)
            : sent === T
              ? L(`${p}% of ${v} MW: too much`, `${p}% de ${v} MW: demasiado`)
              : L(`${p}% of ${v} = ${M.fmt(sent)} MW`, `${p}% de ${v} = ${M.fmt(sent)} MW`),
        ),
      );
      await town.power(ok ? 1 : sent / P);
    }
    return {
      checkLabel: L("Start the plant", "Arrancar la planta"),
      actions: [
        { key: "ArrowUp", label: L("+1 MW", "+1 MW"), run: () => (reset(), m.bump(1)) },
        { key: "ArrowDown", label: L("−1 MW", "−1 MW"), run: () => (reset(), m.bump(-1)) },
        { key: "ArrowRight", label: L("+10 MW", "+10 MW"), run: () => (reset(), m.bump(10)) },
        { key: "ArrowLeft", label: L("−10 MW", "−10 MW"), run: () => (reset(), m.bump(-10)) },
        { key: "PageUp", label: L("+100 MW", "+100 MW"), run: () => (reset(), m.bump(100)) },
        { key: "PageDown", label: L("−100 MW", "−100 MW"), run: () => (reset(), m.bump(-100)) },
      ],
      status: () => L(`Plant total set to ${m.value} MW`, `Total de la planta: ${m.value} MW`),
      hints: [
        L(
          `The ${P} MW part is ${p}% of the bar. Find what ONE equal part is worth, then count how many parts make 100%.`,
          `La parte de ${P} MW es el ${p}% de la barra. Halla cuánto vale UNA parte igual y cuenta cuántas partes forman el 100%.`,
        ),
        p === g
          ? L(
              `${p}% is 1 of ${100 / p} equal parts, and that one part is ${P} MW. How many parts make 100%?`,
              `${p}% es 1 de ${100 / p} partes iguales, y esa parte es ${P} MW. ¿Cuántas partes forman el 100%?`,
            )
          : L(
              `${p}% is ${p / g} parts of ${g}%. ${P} ÷ ${p / g} = ${M.fmt((P * g) / p)} MW for each ${g}%.`,
              `${p}% son ${p / g} partes de ${g}%. ${P} ÷ ${p / g} = ${M.fmt((P * g) / p)} MW por cada ${g}%.`,
            ),
      ],
      async check() {
        const res = M.judgeWhole(prob, m.value);
        if (res.incomplete) return res;
        if (!res.ok) bar.show(0, RED);
        await run(m.value, res.ok);
        return res;
      },
      async demo() {
        reset();
        m.set(0);
        const per = (P * g) / p;
        kit.floatText((X0 + xp) / 2, 240, `${P} ÷ ${p / g} = ${M.fmt(per)}`, "#f8d877", 20);
        await kit.wait(1000);
        await bar.labelChunks(g, per);
        await kit.wait(400);
        kit.floatText(X1 - 40, 250, `${100 / g} × ${M.fmt(per)}`, "#f8d877", 20);
        m.set(T);
        api.refresh();
        await kit.wait(600);
        await run(T, true);
      },
      explain: () =>
        p === g
          ? L(
              `${p}% = ${P} MW is 1 of ${100 / p} equal parts, so 100% = ${100 / p} × ${P} = ${T} MW.`,
              `${p}% = ${P} MW es 1 de ${100 / p} partes iguales, así que 100% = ${100 / p} × ${P} = ${T} MW.`,
            )
          : L(
              `${p}% = ${P} MW, so ${g}% = ${M.fmt((P * g) / p)} MW and 100% = ${100 / g} × ${M.fmt((P * g) / p)} = ${T} MW.`,
              `${p}% = ${P} MW, así que ${g}% = ${M.fmt((P * g) / p)} MW y 100% = ${100 / g} × ${M.fmt((P * g) / p)} = ${T} MW.`,
            ),
    };
  }

  Object.assign(M, { transit, plant, plantIcon, percentBar });
})();
