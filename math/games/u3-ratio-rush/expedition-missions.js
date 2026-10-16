/* Oasis Engineers — mission builders for the Ratio Rush expedition.
 *
 * Every mission is a machine in the oasis that only runs when the ratio is right:
 *   mixer     two feed tanks; the mix reaches the seedlings only in the recipe ratio
 *   gates     a canal of sluice gates; each gate is one column of a ratio table
 *   pump      flow meters; unit rates decide how much water each field gets
 *   pipeline  stations on a coordinate grid; equivalent ratios lay a straight pipe
 * The student's numbers drive the water. A wrong ratio is shown, not just marked:
 * scorched or pale fields, a jammed gate, an overflowing tank, a bent pipe.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  if (!X) return;
  const { W } = X;
  const L = (en, es) => ({ en, es });
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const NUTRIENT = 0xffb547;
  const WATER = 0x48b5ff;
  const PANEL = 0x0a1a26;

  function recipe(r, maxA, maxB) {
    let a;
    let b;
    do {
      a = r.int(1, maxA);
      b = r.int(2, maxB);
    } while (a === b || gcd(a, b) !== 1);
    return { a, b };
  }

  /* ── mixer: equivalent ratios with a double tape of scoops and buckets ── */
  function mixer(scene, api) {
    const { kit, rng } = api;
    const tier = api.tier;
    const { a, b } = tier >= 3 ? recipe(rng, 5, 7) : recipe(rng, 4, 5);
    const k = rng.int(2, tier >= 3 ? 6 : 4);
    const T = (a + b) * k;
    const mode = tier === 2 ? "total" : tier >= 3 ? "findWater" : "findNutrient";
    const cap = Math.max(a * k, b * k) + 5;
    let n = mode === "findWater" ? a * k : 0;
    let w = mode === "findNutrient" ? b * k : 0;
    const editable = mode === "total" ? [0, 1] : mode === "findWater" ? [1] : [0];
    let sel = editable[0];
    let showGroups = tier === 1;
    const TOP = 168;
    const BOT = 446;
    const unitH = (BOT - TOP) / cap;
    const tanks = [
      {
        x: 330,
        color: NUTRIENT,
        name: L("Nutrient", "Nutriente"),
        unit: L("scoops", "cucharadas"),
      },
      { x: 470, color: WATER, name: L("Water", "Agua"), unit: L("buckets", "cubetas") },
    ];
    const briefs = {
      findNutrient: L(
        `Recipe: ${a} ${a === 1 ? "scoop" : "scoops"} of nutrient for every ${b} buckets of water. The water tank holds ${b * k} buckets. Add nutrient so the mix matches the recipe.`,
        `Receta: ${a} ${a === 1 ? "cucharada" : "cucharadas"} de nutriente por cada ${b} cubetas de agua. El tanque tiene ${b * k} cubetas. Agrega nutriente para que la mezcla siga la receta.`,
      ),
      findWater: L(
        `Recipe: ${a} ${a === 1 ? "scoop" : "scoops"} for every ${b} buckets. You already poured ${a * k} scoops. Add water to keep the recipe.`,
        `Receta: ${a} ${a === 1 ? "cucharada" : "cucharadas"} por cada ${b} cubetas. Ya echaste ${a * k} cucharadas. Agrega agua para mantener la receta.`,
      ),
      total: L(
        `Recipe: ${a} ${a === 1 ? "scoop" : "scoops"} for every ${b} buckets. Fill both tanks with exactly ${T} parts in all and keep the recipe.`,
        `Receta: ${a} ${a === 1 ? "cucharada" : "cucharadas"} por cada ${b} cubetas. Llena los tanques con exactamente ${T} partes en total y mantén la receta.`,
      ),
    };
    api.setBrief(briefs[mode]);

    // Recipe card: one batch drawn as tokens.
    kit.panel(28, 140, 230, 150, { fill: PANEL, alpha: 0.9 });
    kit.text(143, 160, api.t(L("ONE BATCH", "UNA TANDA")), 14, "#ffd76a", { weight: "800" });
    const token = (x, y, color) => {
      const g = scene.add.graphics().setDepth(21);
      g.fillStyle(color, 1).fillRoundedRect(x - 9, y - 9, 18, 18, 5);
      g.lineStyle(2, 0xffffff, 0.5).strokeRoundedRect(x - 9, y - 9, 18, 18, 5);
    };
    for (let i = 0; i < a; i++) token(56 + i * 24, 198, NUTRIENT);
    for (let i = 0; i < b; i++) token(56 + i * 24, 236, WATER);
    kit.text(143, 272, `${a} : ${b}`, 22, "#ffffff", { weight: "900" });
    if (mode === "total")
      kit.text(143, 318, api.t(L(`Goal: ${T} parts`, `Meta: ${T} partes`)), 18, "#ffd76a", {
        weight: "800",
      });

    // Tanks.
    const g = scene.add.graphics().setDepth(22);
    const labels = tanks.map((tk) =>
      kit.text(tk.x, BOT + 18, "", 15, "#eaf6ff", { weight: "800", depth: 23 }),
    );
    tanks.forEach((tk, i) => {
      kit.text(tk.x, TOP - 22, api.t(tk.name), 15, kit.css(tk.color), { weight: "800" });
      const zone = scene.add
        .zone(tk.x, (TOP + BOT) / 2, 90, BOT - TOP)
        .setInteractive({ useHandCursor: editable.includes(i) })
        .setDepth(24);
      const setFromPointer = (p) => {
        if (!editable.includes(i)) return;
        sel = i;
        const v = Phaser.Math.Clamp(Math.round((BOT - p.y) / unitH), 0, cap);
        if (i === 0) n = v;
        else w = v;
        draw();
        api.refresh();
      };
      zone.on("pointerdown", setFromPointer);
      zone.on("pointermove", (p) => p.isDown && setFromPointer(p));
      if (editable.includes(i)) {
        kit.button(tk.x + 78, TOP + 30, 40, 40, "+", () => bump(i, 1), { size: 22 });
        kit.button(tk.x + 78, TOP + 80, 40, 40, "−", () => bump(i, -1), { size: 22 });
      }
    });
    const field = scene.add.graphics().setDepth(21);
    function drawField(color, lush) {
      field.clear();
      field.fillStyle(PANEL, 0.85).fillRoundedRect(600, 150, 190, 300, 14);
      field.fillStyle(color, 1).fillRoundedRect(614, 330, 162, 104, 10);
      for (let i = 0; i < 6; i++) {
        const sx = 630 + i * 27;
        const h = lush ? 46 : 12;
        field.lineStyle(4, lush ? 0x7ee36d : 0x8a7a50, 1).lineBetween(sx, 340, sx, 340 - h);
        if (lush) field.fillStyle(0x9cf27f, 1).fillEllipse(sx + 6, 340 - h, 14, 8);
      }
    }
    drawField(0x6d5634, false);
    kit.text(695, 172, api.t(L("SEEDLINGS", "PLÁNTULAS")), 14, "#cfe3ee", { weight: "800" });

    function draw() {
      g.clear();
      tanks.forEach((tk, i) => {
        const v = i === 0 ? n : w;
        const group = i === 0 ? a : b;
        g.fillStyle(0x02070c, 0.75).fillRoundedRect(tk.x - 46, TOP - 6, 92, BOT - TOP + 12, 12);
        for (let u = 0; u < v; u++) {
          const shade = showGroups && Math.floor(u / group) % 2 ? 0.62 : 1;
          g.fillStyle(kit.mix(tk.color, 0x000000, 1 - shade), 1);
          g.fillRect(tk.x - 38, BOT - (u + 1) * unitH + 1, 76, Math.max(1, unitH - 2));
        }
        if (showGroups)
          for (let u = group; u < v; u += group) {
            g.lineStyle(2, 0xffffff, 0.8).lineBetween(
              tk.x - 42,
              BOT - u * unitH,
              tk.x + 42,
              BOT - u * unitH,
            );
          }
        const active = sel === i && editable.includes(i);
        g.lineStyle(active ? 4 : 2, active ? 0xffd76a : 0x5e92b3, active ? 1 : 0.6);
        g.strokeRoundedRect(tk.x - 46, TOP - 6, 92, BOT - TOP + 12, 12);
        labels[i].setText(`${v} ${api.t(tk.unit)}`);
      });
    }
    function bump(i, d) {
      sel = i;
      if (i === 0) n = Phaser.Math.Clamp(n + d, 0, cap);
      else w = Phaser.Math.Clamp(w + d, 0, cap);
      api.sfx.tick(Math.min(12, i === 0 ? n : w));
      draw();
      api.refresh();
    }
    draw();

    async function pour(color, lush) {
      const stream = scene.add.graphics().setDepth(25);
      stream.lineStyle(10, color, 0.9).lineBetween(400, BOT - 8, 600, 380);
      api.sfx.flow();
      await kit.wait(450);
      drawField(lush ? kit.mix(0x2f7046, color, 0.25) : color, lush);
      stream.destroy();
    }
    const mixColor = () => kit.mix(WATER, NUTRIENT, n + w ? n / (n + w) : 0);

    return {
      checkLabel: L("Open the valve", "Abrir la válvula"),
      get actions() {
        const list = [
          {
            key: "ArrowUp",
            label: L("+1 to this tank", "+1 a este tanque"),
            run: () => bump(sel, 1),
          },
          {
            key: "ArrowDown",
            label: L("−1 from this tank", "−1 de este tanque"),
            run: () => bump(sel, -1),
          },
        ];
        if (editable.length > 1)
          list.push({
            key: "ArrowRight",
            label: L("Switch tank", "Cambiar tanque"),
            run: () => {
              sel = sel === 0 ? 1 : 0;
              draw();
              api.refresh();
            },
          });
        return list;
      },
      status: () => L(`Nutrient ${n} · Water ${w}`, `Nutriente ${n} · Agua ${w}`),
      hints:
        mode === "total"
          ? [
              L(
                `One batch has ${a} + ${b} = ${a + b} parts. How many batches make ${T} parts?`,
                `Una tanda tiene ${a} + ${b} = ${a + b} partes. ¿Cuántas tandas forman ${T} partes?`,
              ),
              L(
                `${T} ÷ ${a + b} = ${k} batches. Multiply BOTH parts of the recipe by ${k}.`,
                `${T} ÷ ${a + b} = ${k} tandas. Multiplica AMBAS partes de la receta por ${k}.`,
              ),
            ]
          : mode === "findWater"
            ? [
                L(
                  `One batch is ${a} ${a === 1 ? "scoop" : "scoops"} with ${b} buckets. How many groups of ${a} ${a === 1 ? "scoop" : "scoops"} are in ${a * k}?`,
                  `Una tanda son ${a} ${a === 1 ? "cucharada" : "cucharadas"} con ${b} cubetas. ¿Cuántos grupos de ${a} hay en ${a * k}?`,
                ),
                L(
                  `${a * k} ÷ ${a} = ${k} batches. Each batch needs ${b} buckets.`,
                  `${a * k} ÷ ${a} = ${k} tandas. Cada tanda necesita ${b} cubetas.`,
                ),
              ]
            : [
                L(
                  `One batch is ${a} ${a === 1 ? "scoop" : "scoops"} with ${b} buckets. How many groups of ${b} buckets are in ${b * k}?`,
                  `Una tanda son ${a} ${a === 1 ? "cucharada" : "cucharadas"} con ${b} cubetas. ¿Cuántos grupos de ${b} hay en ${b * k}?`,
                ),
                L(
                  `${b * k} ÷ ${b} = ${k} batches. Each batch needs ${a} ${a === 1 ? "scoop" : "scoops"}.`,
                  `${b * k} ÷ ${b} = ${k} tandas. Cada tanda necesita ${a} ${a === 1 ? "cucharada" : "cucharadas"}.`,
                ),
              ],
      async check() {
        const ratioOk = n > 0 && w > 0 && n * b === w * a;
        const amountOk =
          mode === "total" ? n + w === T : mode === "findWater" ? n === a * k : w === b * k;
        if (ratioOk && amountOk) {
          await pour(mixColor(), true);
          kit.burst(695, 330, 0x9cf27f, 26);
          return { ok: true };
        }
        await pour(n * b > w * a ? 0xd8b23a : 0xa9b8a0, false);
        if (!showGroups) {
          showGroups = true;
          draw();
        }
        if (n > 0 && w > 0 && n - a === w - b)
          return {
            ok: false,
            misconception: "additive",
            feedback: L(
              `You added ${n - a} to both parts. Ratios grow by MULTIPLYING both parts by the same number.`,
              `Sumaste ${n - a} a las dos partes. Las razones crecen al MULTIPLICAR las dos partes por el mismo número.`,
            ),
          };
        if (n > 0 && w > 0 && n * a === w * b && a !== b)
          return {
            ok: false,
            misconception: "swapped",
            feedback: L(
              "Your mix flips the recipe: it is buckets : scoops. Keep nutrient first and water second.",
              "Tu mezcla invierte la receta: es cubetas : cucharadas. El nutriente va primero y el agua después.",
            ),
          };
        if (ratioOk && !amountOk)
          return {
            ok: false,
            misconception: "amount",
            feedback: L(
              `Right recipe, wrong size: the tanks need ${T} parts in all.`,
              `Receta correcta, tamaño incorrecto: se necesitan ${T} partes en total.`,
            ),
          };
        return {
          ok: false,
          misconception: n * b > w * a ? "tooStrong" : "tooWeak",
          feedback:
            n * b > w * a
              ? L(
                  "Too strong: the seedlings scorch yellow. There is too much nutrient for that much water.",
                  "Demasiado fuerte: las plántulas se queman. Hay demasiado nutriente para esa agua.",
                )
              : L(
                  "Too weak: the seedlings stay pale. There is too little nutrient for that much water.",
                  "Demasiado débil: las plántulas siguen pálidas. Hay poco nutriente para esa agua.",
                ),
        };
      },
      async demo() {
        showGroups = true;
        if (mode !== "findWater") n = 0;
        if (mode !== "findNutrient") w = 0;
        for (let i = 1; i <= k; i++) {
          if (mode !== "findWater") n = a * i;
          if (mode !== "findNutrient") w = b * i;
          draw();
          api.sfx.tick(i * 2);
          kit.floatText(400, BOT - Math.max(n, w) * unitH, `×${i}`, "#ffd76a", 22);
          await kit.wait(520);
        }
        await pour(mixColor(), true);
      },
      explain: () =>
        L(
          `${a} : ${b} = ${a * k} : ${b * k}. Both parts were multiplied by ${k}.`,
          `${a} : ${b} = ${a * k} : ${b * k}. Las dos partes se multiplicaron por ${k}.`,
        ),
    };
  }

  /* ── gates: a ratio table where each column is a sluice gate ─────────── */
  function gates(scene, api) {
    const { kit, rng } = api;
    const tier = api.tier;
    const { a, b } = recipe(rng, tier >= 2 ? 6 : 4, tier >= 2 ? 7 : 5);
    const pool = tier >= 2 ? [2, 3, 4, 5, 6, 8, 10] : [2, 3, 4, 5];
    const mults = [
      1,
      ...rng
        .shuffle(pool)
        .slice(0, 4)
        .sort((x, y) => x - y),
    ];
    const truth = mults.map((m) => [a * m, b * m]);
    const blanks = [];
    if (tier >= 2) {
      mults.slice(1).forEach((_, i) => blanks.push({ col: i + 1, row: rng.int(0, 1) }));
    } else {
      const row = rng.int(0, 1);
      rng
        .shuffle([1, 2, 3, 4])
        .slice(0, 3)
        .sort()
        .forEach((col) => blanks.push({ col, row }));
    }
    blanks.forEach((bl) => {
      bl.text = "";
    });
    let sel = 0;
    const COL0 = 170;
    const DX = 130;
    const ROWY = [292, 352];
    api.setBrief(
      L(
        `Every gate must keep the ratio ${a} : ${b} (liters of water : seedlings). Fill the empty plates so water reaches the oasis.`,
        `Cada compuerta debe mantener la razón ${a} : ${b} (litros de agua : plántulas). Completa las placas vacías para que el agua llegue al oasis.`,
      ),
    );
    kit.text(70, ROWY[0], api.t(L("Water (L)", "Agua (L)")), 15, "#8fd3ff", { weight: "800" });
    kit.text(70, ROWY[1], api.t(L("Seedlings", "Plántulas")), 15, "#b8f59a", { weight: "800" });
    const canal = scene.add.graphics().setDepth(20);
    const water = scene.add.graphics().setDepth(21);
    const plates = scene.add.graphics().setDepth(22);
    canal.fillStyle(0x3b2d1d, 1).fillRoundedRect(40, 186, 750, 54, 12);
    canal.fillStyle(0x241a10, 1).fillRect(40, 228, 750, 12);
    const cellText = [];
    mults.forEach((_, c) => {
      cellText[c] = ROWY.map((y) =>
        kit.text(COL0 + c * DX, y, "", 22, "#ffffff", { weight: "900", depth: 23 }),
      );
      ROWY.forEach((y, r) => {
        const z = scene.add
          .zone(COL0 + c * DX, y, 96, 46)
          .setInteractive({ useHandCursor: true })
          .setDepth(24);
        z.on("pointerdown", () => {
          const i = blanks.findIndex((bl) => bl.col === c && bl.row === r);
          if (i >= 0) {
            sel = i;
            draw();
            api.refresh();
          }
        });
      });
    });
    const gateBars = mults.map((_, c) => {
      const bar = scene.add
        .rectangle(COL0 + c * DX, 213, 16, 60, 0x8a99a6)
        .setStrokeStyle(2, 0xd8e4ee)
        .setDepth(23);
      return bar;
    });
    kit.keypad(140, 430, (key) => type(key), { size: 42 });
    function value(c, r) {
      const bl = blanks.find((x) => x.col === c && x.row === r);
      if (!bl) return truth[c][r];
      return bl.text === "" ? null : Number(bl.text);
    }
    function draw() {
      plates.clear();
      mults.forEach((_, c) => {
        ROWY.forEach((y, r) => {
          const bi = blanks.findIndex((bl) => bl.col === c && bl.row === r);
          const isBlank = bi >= 0;
          const active = isBlank && bi === sel;
          plates
            .fillStyle(isBlank ? 0x10283a : 0x2a3c4a, 1)
            .fillRoundedRect(COL0 + c * DX - 46, y - 22, 92, 44, 10);
          plates.lineStyle(active ? 4 : 2, active ? 0xffd76a : isBlank ? 0x5e92b3 : 0x51616d, 1);
          plates.strokeRoundedRect(COL0 + c * DX - 46, y - 22, 92, 44, 10);
          const v = value(c, r);
          cellText[c][r].setText(v == null ? (active ? "▮" : "?") : String(v));
          cellText[c][r].setColor(isBlank ? "#ffe9a8" : "#ffffff");
        });
      });
    }
    function type(key) {
      const bl = blanks[sel];
      if (!bl) return;
      if (key === "Backspace") bl.text = bl.text.slice(0, -1);
      else if (/^[0-9]$/.test(key) && bl.text.length < 3)
        bl.text = (bl.text + key).replace(/^0+(?=\d)/, "");
      else return;
      api.sfx.tap();
      draw();
      api.refresh();
    }
    kit.onType(type);
    draw();
    function columnOk(c) {
      const top = value(c, 0);
      const bot = value(c, 1);
      return top != null && bot != null && top > 0 && top * b === bot * a;
    }
    async function flowTo(col) {
      water.clear();
      const end = col < 0 ? 40 : col >= mults.length ? 790 : COL0 + col * DX - 10;
      water.fillStyle(WATER, 0.85).fillRoundedRect(40, 192, Math.max(0, end - 40), 34, 10);
      api.sfx.flow();
      await kit.wait(280);
    }
    return {
      checkLabel: L("Open the gates", "Abrir compuertas"),
      actions: [
        {
          key: "ArrowRight",
          label: L("Next plate →", "Placa siguiente →"),
          run: () => {
            sel = (sel + 1) % blanks.length;
            draw();
            api.refresh();
          },
        },
        {
          key: "ArrowLeft",
          label: L("← Previous plate", "← Placa anterior"),
          run: () => {
            sel = (sel + blanks.length - 1) % blanks.length;
            draw();
            api.refresh();
          },
        },
        {
          key: "Backspace",
          label: L("Erase digit", "Borrar dígito"),
          run: () => type("Backspace"),
        },
      ],
      status: () =>
        L(
          `Plates filled ${blanks.filter((x) => x.text !== "").length} / ${blanks.length}`,
          `Placas llenas ${blanks.filter((x) => x.text !== "").length} / ${blanks.length}`,
        ),
      hints: [
        L(
          "Each column is the first column times the same number. Use the row that is filled in to find that number.",
          "Cada columna es la primera columna multiplicada por el mismo número. Usa la fila que ya está llena para hallar ese número.",
        ),
        (() => {
          const bl = blanks[0];
          const known = truth[bl.col][1 - bl.row];
          const base = 1 - bl.row === 0 ? a : b;
          return L(
            `Gate ${bl.col + 1}: ${known} ÷ ${base} = ${mults[bl.col]}. Multiply the other row by ${mults[bl.col]} too.`,
            `Compuerta ${bl.col + 1}: ${known} ÷ ${base} = ${mults[bl.col]}. Multiplica la otra fila por ${mults[bl.col]} también.`,
          );
        })(),
      ],
      async check() {
        if (blanks.some((x) => x.text === "")) {
          return {
            ok: false,
            incomplete: true,
            feedback: L(
              "Fill every empty plate first.",
              "Primero completa todas las placas vacías.",
            ),
          };
        }
        let c = 0;
        for (; c < mults.length; c++) {
          if (!columnOk(c)) break;
          gateBars[c].setFillStyle(0x7ee36d);
          kit.tween({ targets: gateBars[c], y: 170, duration: 220 });
          await flowTo(c + 1);
        }
        if (c === mults.length) {
          kit.burst(780, 213, WATER, 28);
          return { ok: true };
        }
        gateBars[c].setFillStyle(0xff8a5c);
        kit.shake(0.004, 160);
        const top = value(c, 0);
        const bot = value(c, 1);
        const tag =
          top - a === bot - b ? "additive" : top === a || bot === b ? "oneRow" : "notEquivalent";
        const msg = {
          additive: L(
            `Gate ${c + 1} jammed: ${top} : ${bot} adds the same amount to both rows. Multiply instead.`,
            `La compuerta ${c + 1} se trabó: ${top} : ${bot} suma lo mismo en las dos filas. Multiplica.`,
          ),
          oneRow: L(
            `Gate ${c + 1} jammed: only one row changed. Both rows must be multiplied by the same number.`,
            `La compuerta ${c + 1} se trabó: solo cambió una fila. Las dos filas se multiplican por el mismo número.`,
          ),
          notEquivalent: L(
            `Gate ${c + 1} jammed: ${top} : ${bot} is not the same ratio as ${a} : ${b}.`,
            `La compuerta ${c + 1} se trabó: ${top} : ${bot} no es la misma razón que ${a} : ${b}.`,
          ),
        }[tag];
        return { ok: false, misconception: tag, feedback: msg };
      },
      async demo() {
        for (let i = 0; i < blanks.length; i++) {
          sel = i;
          blanks[i].text = String(truth[blanks[i].col][blanks[i].row]);
          draw();
          kit.floatText(
            COL0 + blanks[i].col * DX,
            ROWY[blanks[i].row] - 34,
            `×${mults[blanks[i].col]}`,
            "#ffd76a",
            20,
          );
          api.sfx.tick(i * 3);
          await kit.wait(600);
        }
        await this.check();
      },
      explain: () =>
        L(
          `Every column is ${a} : ${b} multiplied by one number: ${mults.map((m) => "×" + m).join(", ")}.`,
          `Cada columna es ${a} : ${b} multiplicada por un número: ${mults.map((m) => "×" + m).join(", ")}.`,
        ),
    };
  }

  window.RR_MISSIONS = Object.assign(window.RR_MISSIONS || {}, {
    mixer,
    gates,
    recipe,
    L,
    NUTRIENT,
    WATER,
    PANEL,
    W,
  });
})();
