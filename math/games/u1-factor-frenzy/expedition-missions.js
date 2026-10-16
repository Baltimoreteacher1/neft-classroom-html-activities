/* The Primekeeper — Copper Gate (factor pairs) and Crystal Lock (GCF) builders.
 *
 *   gate  a plate press: the student sets a plate width; N copper tiles fill rows of that
 *         width. A width that is a factor makes a clean rectangle (a factor pair); any other
 *         width leaves loose tiles. Every factor pair must hang on the Copper Gate.
 *   lock  two cargo piles are packed into identical crates. The number of crates must be a
 *         common factor (nothing left over), and the greatest one opens the Crystal Lock.
 * The math judges live in expedition-math.js (PK_MATH) so they can be tested in Node.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.PK_MATH;
  if (!X || !M) return;
  const L = M.L;
  const COPPER = 0xd9894a;
  const CRYSTAL = 0x7fe3ff;
  const BAD = 0xff6b4f;
  const PANEL = 0x1a1016;
  const KEYPAD_Y = 456;

  /** Shared number entry: keypad + typed digits into a string, capped at max. */
  function numberEntry(scene, api, max, onChange) {
    let typed = "";
    const set = (s) => {
      typed = s;
      onChange();
      api.refresh();
    };
    const type = (key) => {
      if (key === "Backspace") {
        if (!typed) return;
        set(typed.slice(0, -1));
      } else if (/^[0-9]$/.test(key)) {
        const next = (typed + key).replace(/^0+(?=\d)/, "");
        if (next.length > 3 || Number(next) > max) {
          api.sfx.miss();
          return;
        }
        set(next);
      } else return;
      api.sfx.tap();
    };
    api.kit.keypad(24, KEYPAD_Y, type, { size: 34, gap: 4 });
    api.kit.onType(type);
    return {
      get value() {
        return typed === "" ? null : Number(typed);
      },
      get text() {
        return typed;
      },
      set(v) {
        set(v == null ? "" : String(Phaser.Math.Clamp(v, 0, max)));
      },
      step(d) {
        const v = typed === "" ? 0 : Number(typed);
        set(String(Phaser.Math.Clamp(v + d, 1, max)));
        api.sfx.tick(Math.min(12, Number(typed)));
      },
      type,
    };
  }

  /* ── gate: factor pairs as copper plates on the Copper Gate ────────────── */
  function gate(scene, api) {
    const { kit, rng, t } = api;
    const tier = api.tier;
    const { N, pairs } = M.genGate(rng, tier);
    const plates = [];
    let mark = null; // {bad:w} | {gaps:n} | {open:true}
    api.setBrief(
      L(
        `Tile the Copper Gate. Each plate is a rectangle made of all ${N} copper tiles. Forge one plate for every factor pair of ${N}.`,
        `Cubre la Puerta de Cobre. Cada placa es un rectángulo hecho con las ${N} fichas de cobre. Forja una placa para cada par de factores de ${N}.`,
      ),
    );
    // Plate press (left).
    kit.panel(24, 140, 420, 292, { fill: PANEL, alpha: 0.9 });
    const pressTitle = kit.text(234, 160, "", 16, "#ffd9a8", { weight: "800" });
    kit.button(56, 160, 34, 32, "−", () => entry.step(-1), { size: 20 });
    kit.button(412, 160, 34, 32, "+", () => entry.step(1), { size: 20 });
    const press = scene.add.graphics().setDepth(21);
    const pressMsg = kit.text(234, 410, "", 15, "#f3e6d8", { wrap: 400 });
    // Copper Gate (right).
    kit.panel(462, 140, 334, 292, { fill: PANEL, alpha: 0.9 });
    kit.text(629, 160, t(L("COPPER GATE", "PUERTA DE COBRE")), 15, "#ffc779", { weight: "800" });
    const gateG = scene.add.graphics().setDepth(21);
    const rowText = [];
    for (let i = 0; i < 8; i++)
      rowText.push(kit.text(629, 199 + i * 29, "", 15, "#2a1408", { weight: "900", depth: 22 }));
    const entry = numberEntry(scene, api, N, () => {
      mark = mark?.open ? mark : null;
      draw();
    });
    kit.button(560, KEYPAD_Y, 184, 40, "⚒ " + t(L("Forge plate", "Forjar placa")), () => forge(), {
      size: 15,
    });
    kit.button(724, KEYPAD_Y, 124, 40, "↶ " + t(L("Remove", "Quitar")), () => removeLast(), {
      size: 15,
      fill: 0x4a3a3a,
      color: "#f3e6d8",
    });

    function drawPress() {
      press.clear();
      const w = entry.value;
      pressTitle.setText(
        w ? t(L(`Plate width: ${w}`, `Ancho de placa: ${w}`)) : t(L("Plate width: ?", "Ancho: ?")),
      );
      if (!w) {
        pressMsg.setText(t(L("Type a width, or use + and −.", "Escribe un ancho, o usa + y −.")));
        return;
      }
      const full = Math.floor(N / w);
      const rem = N % w;
      const lines = full + (rem ? 1 : 0);
      const horiz = w >= lines;
      const cols = horiz ? w : lines;
      const rowsN = horiz ? lines : w;
      const tile = Math.min(28, 388 / cols, 196 / rowsN);
      const gap = tile >= 8 ? 1.5 : 0.4;
      const x0 = 234 - (cols * tile) / 2;
      const y0 = 286 - (rowsN * tile) / 2;
      for (let i = 0; i < N; i++) {
        const line = Math.floor(i / w);
        const pos = i % w;
        const loose = rem && line === full;
        const cx = horiz ? pos : line;
        const cy = horiz ? line : pos;
        press.fillStyle(loose ? BAD : COPPER, 1);
        press.fillRect(x0 + cx * tile + gap, y0 + cy * tile + gap, tile - 2 * gap, tile - 2 * gap);
      }
      pressMsg.setText(
        rem
          ? t(
              L(
                `${full} rows of ${w}, and ${rem} tiles left over. No clean rectangle.`,
                `${full} filas de ${w}, y sobran ${rem} fichas. No hay rectángulo exacto.`,
              ),
            )
          : t(
              L(
                `${w} × ${full} = ${N}. A clean rectangle!`,
                `${w} × ${full} = ${N}. ¡Un rectángulo exacto!`,
              ),
            ),
      );
    }
    function drawGate() {
      gateG.clear();
      const sorted = plates.slice().sort((x, y) => Math.min(x, N / x) - Math.min(y, N / y));
      const slots = tier === 1 ? Math.max(pairs.length, sorted.length) : sorted.length;
      for (let i = 0; i < 8; i++) {
        rowText[i].setText("");
        const y = 186 + i * 29;
        const w = sorted[i];
        if (w != null) {
          const bad = N % w !== 0;
          const red = bad && mark?.bad === w;
          gateG
            .fillStyle(red ? BAD : bad ? 0x9a6a4a : COPPER, 1)
            .fillRoundedRect(482, y, 294, 25, 6);
          gateG
            .lineStyle(2, mark?.open ? 0xffe9a8 : 0x5a2e14, 1)
            .strokeRoundedRect(482, y, 294, 25, 6);
          rowText[i].setText(bad ? `${w} × ? ✗` : `${Math.min(w, N / w)} × ${Math.max(w, N / w)}`);
          if (red) {
            gateG.lineStyle(2, 0x2a0a04, 1);
            gateG.lineBetween(600, y + 2, 612, y + 12);
            gateG.lineBetween(612, y + 12, 604, y + 23);
          }
        } else if (i < slots || (mark?.gaps && i < sorted.length + mark.gaps)) {
          const gapMark = mark?.gaps && i >= sorted.length;
          gateG.lineStyle(2, gapMark ? BAD : 0x8a6a50, gapMark ? 1 : 0.6);
          gateG.strokeRoundedRect(482, y, 294, 25, 6);
          rowText[i].setText(gapMark ? "?" : "");
          rowText[i].setColor("#ff9a80");
          continue;
        }
        rowText[i].setColor("#2a1408");
      }
      if (mark?.open) {
        gateG.fillStyle(0xffc779, 0.18).fillRoundedRect(470, 172, 318, 252, 12);
      }
    }
    function draw() {
      drawPress();
      drawGate();
    }
    function forge() {
      const w = entry.value;
      if (!w) {
        api.feedback(L("Type a width first.", "Primero escribe un ancho."), "info");
        return;
      }
      if (plates.some((p) => Math.min(p, N / p) === Math.min(w, N / w) && N % w === 0)) {
        api.feedback(
          L(
            `That pair is already on the gate. ${w} × ${N / w} is the same plate turned sideways.`,
            `Ese par ya está en la puerta. ${w} × ${N / w} es la misma placa girada.`,
          ),
          "info",
        );
        return;
      }
      if (plates.includes(w)) return;
      if (plates.length >= 8) {
        api.feedback(
          L(
            "The gate rack is full. Remove a plate first.",
            "El soporte está lleno. Quita una placa.",
          ),
          "info",
        );
        return;
      }
      plates.push(w);
      mark = null;
      api.sfx.place();
      kit.burst(629, 186 + (plates.length - 1) * 29, COPPER, 12, { speed: 140 });
      draw();
      api.refresh();
    }
    function removeLast() {
      if (!plates.length) return;
      plates.pop();
      mark = null;
      api.sfx.tap();
      draw();
      api.refresh();
    }
    draw();

    const k = Math.floor(Math.sqrt(N));
    return {
      checkLabel: L("Raise the gate", "Subir la puerta"),
      actions: [
        {
          key: "ArrowUp",
          label: L("Wider plate (+1)", "Placa más ancha (+1)"),
          run: () => entry.step(1),
        },
        {
          key: "ArrowDown",
          label: L("Narrower plate (−1)", "Placa más angosta (−1)"),
          run: () => entry.step(-1),
        },
        { key: "f", label: L("Forge this plate", "Forjar esta placa"), run: () => forge() },
        {
          key: "r",
          label: L("Remove last plate", "Quitar la última placa"),
          run: () => removeLast(),
        },
        {
          key: "Backspace",
          label: L("Erase digit", "Borrar dígito"),
          run: () => entry.type("Backspace"),
        },
      ],
      status: () =>
        L(
          `Width ${entry.text || "?"} · plates on the gate: ${plates.length}`,
          `Ancho ${entry.text || "?"} · placas en la puerta: ${plates.length}`,
        ),
      hints: [
        L(
          `Test the widths in order: 1, 2, 3, … Each width that leaves no loose tiles is a factor, and it gives a factor pair of ${N}.`,
          `Prueba los anchos en orden: 1, 2, 3, … Cada ancho que no deja fichas sueltas es un factor y da un par de factores de ${N}.`,
        ),
        L(
          `Test every width from 1 up to ${k}. After ${k}, each new plate is a pair you already have, turned sideways (${k + 1} × ${k + 1} is more than ${N}).`,
          `Prueba cada ancho de 1 a ${k}. Después de ${k}, cada placa nueva es un par que ya tienes, girado (${k + 1} × ${k + 1} es más que ${N}).`,
        ),
      ],
      async check() {
        const res = M.judgeGate(N, plates);
        if (res.incomplete) return res;
        if (res.ok) {
          mark = { open: true };
          draw();
          api.sfx.unlock();
          kit.burst(629, 300, 0xffc779, 30, { speed: 260 });
          await kit.wait(500);
          return res;
        }
        mark = res.misconception === "notFactor" ? { bad: res.bad } : { gaps: res.missing.length };
        draw();
        kit.shake(0.004, 160);
        await kit.wait(350);
        return res;
      },
      async demo() {
        plates.length = 0;
        mark = null;
        for (let w = 1; w <= k; w++) {
          entry.set(w);
          await kit.wait(260);
          if (N % w === 0) {
            forge();
            kit.floatText(234, 250, `${w} × ${N / w}`, "#ffd76a", 22);
          } else kit.floatText(234, 250, "✗", "#ff9a80", 22);
          await kit.wait(300);
        }
        mark = { open: true };
        draw();
      },
      explain: () => {
        const list = pairs.map((a) => `${a} × ${N / a}`).join(", ");
        return L(
          `Factor pairs of ${N}: ${list}. So the factors of ${N} are ${M.factorsOf(N).join(", ")}.`,
          `Pares de factores de ${N}: ${list}. Así que los factores de ${N} son ${M.factorsOf(N).join(", ")}.`,
        );
      },
    };
  }

  /* ── lock: pack bars and crystals into the most identical crates (GCF) ── */
  function lock(scene, api) {
    const { kit, rng, t } = api;
    const tier = api.tier;
    const { a, b, g } = M.genLock(rng, tier);
    const live = tier === 1; // tier 1 shows the packing as you type; later tiers on check
    let packed = false;
    let lockState = "shut"; // shut | jam | half | open
    api.setBrief(
      L(
        `The Crystal Lock opens for identical crates. Pack ${a} copper bars and ${b} crystals into the GREATEST number of crates, with nothing left over.`,
        `El Candado de Cristal se abre con cajas iguales. Empaca ${a} barras de cobre y ${b} cristales en el MAYOR número de cajas, sin que sobre nada.`,
      ),
    );
    // Cargo piles (left).
    kit.panel(24, 140, 214, 292, { fill: PANEL, alpha: 0.9 });
    kit.text(131, 158, t(L(`Copper bars: ${a}`, `Barras de cobre: ${a}`)), 15, "#ffc779", {
      weight: "800",
    });
    kit.text(131, 298, t(L(`Crystals: ${b}`, `Cristales: ${b}`)), 15, "#9eeaff", { weight: "800" });
    const piles = scene.add.graphics().setDepth(21);
    const pile = (n, y0, draw) => {
      const per = 10;
      const rows = Math.ceil(n / per);
      const dy = Math.min(12, 112 / Math.max(1, rows));
      for (let i = 0; i < n; i++) draw(44 + (i % per) * 19, y0 + Math.floor(i / per) * dy);
    };
    pile(a, 176, (x, y) => piles.fillStyle(COPPER, 1).fillRoundedRect(x - 7, y, 14, 7, 2));
    pile(b, 318, (x, y) => {
      piles.fillStyle(CRYSTAL, 1);
      piles.fillTriangle(x, y - 1, x - 5, y + 5, x + 5, y + 5);
      piles.fillTriangle(x - 5, y + 5, x + 5, y + 5, x, y + 11);
    });
    // Crates (middle).
    kit.panel(250, 140, 382, 292, { fill: PANEL, alpha: 0.9 });
    const cratesTitle = kit.text(441, 160, "", 17, "#ffffff", { weight: "800" });
    const crates = scene.add.graphics().setDepth(21);
    const crateText = [];
    for (let i = 0; i < 12; i++)
      crateText.push([
        kit.text(0, 0, "", 13, "#ffd9a8", { weight: "800", depth: 22 }),
        kit.text(0, 0, "", 13, "#bff2ff", { weight: "800", depth: 22 }),
      ]);
    const more = kit.text(441, 362, "", 13, "#f3e6d8");
    const spill = kit.text(441, 400, "", 14, "#ffb39f", { wrap: 360 });
    // The lock (right).
    kit.panel(644, 140, 152, 292, { fill: PANEL, alpha: 0.9 });
    kit.text(720, 160, t(L("CRYSTAL LOCK", "CANDADO")), 14, "#9eeaff", { weight: "800" });
    const lockG = scene.add.graphics().setDepth(21);
    const lockGlow = kit.glow(720, 320, 160, CRYSTAL, 0, 20);
    const entry = numberEntry(scene, api, 99, () => {
      packed = false;
      lockState = "shut";
      draw();
    });

    function drawLock() {
      lockG.clear();
      const lift = lockState === "open" ? 34 : lockState === "half" ? 14 : 0;
      const col = lockState === "jam" ? BAD : lockState === "open" ? 0xbff8ff : CRYSTAL;
      lockG.lineStyle(10, col, 1);
      lockG.beginPath();
      lockG.arc(720, 268 - lift, 30, Math.PI, 0, false);
      lockG.strokePath();
      lockG.lineBetween(690, 268 - lift, 690, 284 - (lockState === "open" ? 0 : lift));
      if (lockState !== "open") lockG.lineBetween(750, 268 - lift, 750, 284);
      lockG.fillStyle(kit.mix(col, 0x0a1a24, 0.35), 1).fillRoundedRect(674, 280, 92, 82, 12);
      lockG.lineStyle(3, col, 1).strokeRoundedRect(674, 280, 92, 82, 12);
      lockG.fillStyle(0x0a1a24, 1).fillCircle(720, 314, 9).fillRect(716, 314, 8, 22);
      lockGlow.setAlpha(lockState === "open" ? 0.5 : 0);
    }
    function draw() {
      crates.clear();
      crateText.forEach(([x, y]) => {
        x.setText("");
        y.setText("");
      });
      more.setText("");
      spill.setText("");
      const k = entry.value;
      cratesTitle.setText(k ? t(L(`${k} crates`, `${k} cajas`)) : t(L("Crates: ?", "Cajas: ?")));
      drawLock();
      if (!k) {
        spill.setText(t(L("Type how many crates to use.", "Escribe cuántas cajas usar.")));
        return;
      }
      const show = live || packed;
      const n = Math.floor(a / k);
      const m = Math.floor(b / k);
      const shown = Math.min(k, 12);
      const perRow = 6;
      for (let i = 0; i < shown; i++) {
        const cx = 286 + (i % perRow) * 62;
        const cy = 190 + Math.floor(i / perRow) * 84;
        crates.fillStyle(0x6b4a2e, 1).fillRoundedRect(cx - 27, cy, 54, 72, 6);
        crates.lineStyle(2, 0xb07a48, 1).strokeRoundedRect(cx - 27, cy, 54, 72, 6);
        crates.lineStyle(1, 0x3a2414, 1).lineBetween(cx - 27, cy + 36, cx + 27, cy + 36);
        if (show) {
          crates.fillStyle(COPPER, 1).fillRoundedRect(cx - 21, cy + 13, 12, 6, 2);
          crates
            .fillStyle(CRYSTAL, 1)
            .fillTriangle(cx - 15, cy + 44, cx - 21, cy + 52, cx - 9, cy + 52);
          crates.fillTriangle(cx - 21, cy + 52, cx - 9, cy + 52, cx - 15, cy + 60);
          crateText[i][0].setPosition(cx + 8, cy + 17).setText("×" + n);
          crateText[i][1].setPosition(cx + 8, cy + 53).setText("×" + m);
        } else {
          crateText[i][0].setPosition(cx, cy + 36).setText("?");
        }
      }
      if (k > shown) more.setText(t(L(`+ ${k - shown} more crates`, `+ ${k - shown} cajas más`)));
      if (!show) {
        spill.setText(
          t(L("Press Pack to fill the crates.", "Pulsa Empacar para llenar las cajas.")),
        );
        return;
      }
      const ra = a - n * k;
      const rb = b - m * k;
      spill.setText(
        ra || rb
          ? t(
              L(
                `Left over: ${ra} ${ra === 1 ? "bar" : "bars"}, ${rb} ${rb === 1 ? "crystal" : "crystals"}`,
                `Sobran: ${ra} ${ra === 1 ? "barra" : "barras"}, ${rb} ${rb === 1 ? "cristal" : "cristales"}`,
              ),
            )
          : t(L("Nothing left over.", "No sobra nada.")),
      );
      spill.setColor(ra || rb ? "#ffb39f" : "#b8f5c8");
    }
    draw();
    const factorsA = M.factorsOf(a);
    return {
      checkLabel: L("Pack & unlock", "Empacar y abrir"),
      actions: [
        { key: "ArrowUp", label: L("One more crate", "Una caja más"), run: () => entry.step(1) },
        {
          key: "ArrowDown",
          label: L("One less crate", "Una caja menos"),
          run: () => entry.step(-1),
        },
        {
          key: "Backspace",
          label: L("Erase digit", "Borrar dígito"),
          run: () => entry.type("Backspace"),
        },
      ],
      status: () => L(`Crates: ${entry.text || "?"}`, `Cajas: ${entry.text || "?"}`),
      hints: [
        L(
          `The number of crates must divide ${a} AND ${b} with nothing left over: a common factor. List the factors of each number and pick the greatest one they share.`,
          `El número de cajas debe dividir ${a} Y ${b} sin que sobre nada: un factor común. Haz la lista de factores de cada número y elige el mayor que compartan.`,
        ),
        L(
          `Factors of ${a}: ${factorsA.join(", ")}. Which of these also divide ${b}? Choose the greatest one.`,
          `Factores de ${a}: ${factorsA.join(", ")}. ¿Cuáles también dividen ${b}? Elige el mayor.`,
        ),
      ],
      async check() {
        const res = M.judgeLock(a, b, entry.value);
        if (res.incomplete) return res;
        packed = true;
        lockState = res.ok ? "open" : res.misconception === "notGreatest" ? "half" : "jam";
        draw();
        api.sfx.place();
        await kit.wait(400);
        if (res.ok) {
          api.sfx.unlock();
          kit.burst(720, 300, CRYSTAL, 28, { speed: 240 });
        } else kit.shake(0.004, 160);
        return res;
      },
      async demo() {
        const common = factorsA.filter((f) => b % f === 0);
        for (const f of factorsA.slice().reverse()) {
          entry.set(f);
          const ok = b % f === 0;
          kit.floatText(441, 250, ok ? `${f} ✓` : `${f} ✗`, ok ? "#b8f5c8" : "#ff9a80", 24);
          await kit.wait(ok ? 700 : 380);
          if (ok) break;
        }
        kit.floatText(441, 300, `${common.join(", ")}`, "#ffd76a", 18);
        packed = true;
        lockState = "open";
        draw();
        await kit.wait(500);
      },
      explain: () =>
        L(
          `GCF(${a}, ${b}) = ${g}. ${g} crates, each with ${a / g} bars and ${b / g} crystals.`,
          `MCD(${a}, ${b}) = ${g}. ${g} cajas, cada una con ${a / g} barras y ${b / g} cristales.`,
        ),
    };
  }

  window.PK_MISSIONS = Object.assign(window.PK_MISSIONS || {}, {
    gate,
    lock,
    numberEntry,
    COPPER,
    CRYSTAL,
    BAD,
    PANEL,
    KEYPAD_Y,
  });
})();
