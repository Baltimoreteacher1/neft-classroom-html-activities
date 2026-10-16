/* Oasis Engineers — rate and graph missions for the Ratio Rush expedition.
 *   pump      unit rates: the meter the student sets is what the pump delivers
 *   pipeline  equivalent ratios on a grid: only proportional stations make a straight pipe
 */
(function () {
  "use strict";
  const M = window.RR_MISSIONS;
  if (!window.EWLExpedition || !M) return;
  const { L, WATER, PANEL } = M;

  /* ── pump: unit rate, apply a rate, compare two rates ─────────────────── */
  function pump(scene, api) {
    const { kit, rng } = api;
    const variant = api.mission.variant || "unit";
    const pumps = [];
    const mk = (u, t) => ({ u, t, q: u * t, dial: 0 });
    if (variant === "compare") {
      // Make the faster pump the one with the SMALLER total, so comparing totals fails.
      let A;
      let B;
      do {
        A = mk(rng.int(4, 9), rng.int(2, 4));
        B = mk(rng.int(4, 12), rng.int(5, 8));
      } while (A.u === B.u || A.u > B.u === A.q > B.q);
      pumps.push(...rng.shuffle([A, B]));
    } else pumps.push(mk(rng.int(3, api.tier >= 2 ? 12 : 9), rng.int(2, 6)));
    const P0 = pumps[0];
    let n = 0;
    if (variant === "apply") {
      do n = rng.int(2, 9);
      while (n === P0.t);
    }
    let guess = 0;
    let sel = 0;
    let choice = -1;
    const names = ["A", "B"];
    const briefs = {
      unit: () =>
        L(
          `The canopy pump moved ${P0.q} liters in ${P0.t} minutes at a steady rate. Set its meter to liters per 1 minute.`,
          `La bomba movió ${P0.q} litros en ${P0.t} minutos a ritmo constante. Ajusta su medidor a litros por 1 minuto.`,
        ),
      apply: () =>
        L(
          `The canopy pump moves ${P0.q} liters in ${P0.t} minutes. The reservoir needs ${n} minutes of pumping. Mark how many liters it will hold.`,
          `La bomba mueve ${P0.q} litros en ${P0.t} minutos. El depósito necesita ${n} minutos de bombeo. Marca cuántos litros tendrá.`,
        ),
      compare: () =>
        L(
          `Pump A moved ${pumps[0].q} L in ${pumps[0].t} min. Pump B moved ${pumps[1].q} L in ${pumps[1].t} min. Set both meters to liters per minute, then choose the faster pump.`,
          `La bomba A movió ${pumps[0].q} L en ${pumps[0].t} min. La B movió ${pumps[1].q} L en ${pumps[1].t} min. Ajusta los dos medidores a litros por minuto y elige la bomba más rápida.`,
        ),
    };
    api.setBrief(briefs[variant]());
    const answer = variant === "apply" ? P0.u * n : 0;
    const tankMax = variant === "apply" ? Math.ceil((Math.max(answer, P0.q) + 12) / 10) * 10 : 0;
    const g = scene.add.graphics().setDepth(22);
    const fill = scene.add.graphics().setDepth(23);
    const xs = variant === "compare" ? [220, 600] : [250];
    const dialText = xs.map((x) =>
      kit.text(x, 300, "", 34, "#ffffff", { weight: "900", depth: 24 }),
    );
    const subText = xs.map((x, i) => kit.text(x, 340, "", 14, "#cfe3ee", { depth: 24, wrap: 220 }));
    xs.forEach((x, i) => {
      kit.text(
        x,
        160,
        variant === "compare"
          ? api.t(L(`Pump ${names[i]}`, `Bomba ${names[i]}`))
          : api.t(L("Canopy pump", "Bomba del dosel")),
        18,
        "#ffd76a",
        { weight: "800", depth: 24 },
      );
      kit.text(x, 186, `${pumps[i].q} L · ${pumps[i].t} min`, 16, "#8fd3ff", {
        weight: "800",
        depth: 24,
      });
      const z = scene.add
        .zone(x, 290, 220, 200)
        .setInteractive({ useHandCursor: true })
        .setDepth(25);
      z.on("pointerdown", () => {
        sel = i;
        if (variant === "compare") choice = i;
        draw();
        api.refresh();
      });
      if (variant !== "apply") {
        kit.button(x - 70, 400, 56, 40, "−1", () => bumpDial(i, -1), {
          size: 17,
          fill: 0x2f4b5c,
          color: "#eaf6ff",
        });
        kit.button(x + 70, 400, 56, 40, "+1", () => bumpDial(i, 1), { size: 17 });
      }
    });
    // Reservoir tank (apply) or delivery tank (unit).
    const TX = 560;
    const TOP = 150;
    const BOT = 446;
    if (variant === "apply") {
      kit.text(TX, TOP - 18, api.t(L("Reservoir (liters)", "Depósito (litros)")), 15, "#8fd3ff", {
        weight: "800",
        depth: 24,
      });
      for (let v = 0; v <= tankMax; v += 10)
        kit.text(TX - 74, BOT - (v / tankMax) * (BOT - TOP), String(v), 12, "#9fb7c4", {
          depth: 24,
          ox: 1,
        });
      kit.button(TX + 120, 200, 64, 40, "+10", () => bumpGuess(10), { size: 16 });
      kit.button(TX + 120, 250, 64, 40, "+1", () => bumpGuess(1), { size: 16 });
      kit.button(TX + 120, 300, 64, 40, "−1", () => bumpGuess(-1), {
        size: 16,
        fill: 0x2f4b5c,
        color: "#eaf6ff",
      });
      kit.button(TX + 120, 350, 64, 40, "−10", () => bumpGuess(-10), {
        size: 16,
        fill: 0x2f4b5c,
        color: "#eaf6ff",
      });
      const tz = scene.add
        .zone(TX, (TOP + BOT) / 2, 120, BOT - TOP)
        .setInteractive({ useHandCursor: true })
        .setDepth(25);
      const setGuess = (p) => {
        guess = Phaser.Math.Clamp(Math.round(((BOT - p.y) / (BOT - TOP)) * tankMax), 0, tankMax);
        draw();
        api.refresh();
      };
      tz.on("pointerdown", setGuess);
      tz.on("pointermove", (p) => p.isDown && setGuess(p));
    }
    function bumpDial(i, d) {
      sel = i;
      pumps[i].dial = Phaser.Math.Clamp(pumps[i].dial + d, 0, 40);
      api.sfx.tick(Math.min(14, pumps[i].dial % 15));
      draw();
      api.refresh();
    }
    function bumpGuess(d) {
      guess = Phaser.Math.Clamp(guess + d, 0, tankMax);
      api.sfx.tick(Math.min(14, (guess / 10) | 0));
      draw();
      api.refresh();
    }
    function draw() {
      g.clear();
      xs.forEach((x, i) => {
        const active = sel === i && variant !== "apply";
        const chosen = choice === i;
        g.fillStyle(PANEL, 0.92).fillRoundedRect(x - 110, 140, 220, 290, 16);
        g.lineStyle(
          chosen ? 5 : active ? 3 : 2,
          chosen ? 0x7ee36d : active ? 0xffd76a : 0x5e92b3,
          1,
        );
        g.strokeRoundedRect(x - 110, 140, 220, 290, 16);
        // Pump body.
        g.fillStyle(0x24394a, 1).fillCircle(x, 250, 34);
        g.lineStyle(4, 0x8fd3ff, 0.8).strokeCircle(x, 250, 34);
        g.fillStyle(WATER, 0.9).fillTriangle(x - 10, 236, x - 10, 264, x + 16, 250);
        if (variant === "apply") {
          dialText[i].setText("");
          subText[i].setText(
            api.t(L(`Reservoir mark: ${guess} L`, `Marca del depósito: ${guess} L`)),
          );
        } else {
          dialText[i].setText(`${pumps[i].dial}`);
          subText[i].setText(
            api.t(L("liters per minute", "litros por minuto")) +
              (chosen ? "  ✓ " + api.t(L("chosen", "elegida")) : ""),
          );
        }
      });
      if (variant === "apply") {
        g.fillStyle(0x02070c, 0.8).fillRoundedRect(TX - 60, TOP, 120, BOT - TOP, 12);
        g.lineStyle(2, 0x5e92b3, 1).strokeRoundedRect(TX - 60, TOP, 120, BOT - TOP, 12);
        const y = BOT - (guess / tankMax) * (BOT - TOP);
        g.lineStyle(4, 0xffd76a, 1).lineBetween(TX - 70, y, TX + 70, y);
        g.fillStyle(0xffd76a, 1).fillTriangle(TX - 78, y - 8, TX - 78, y + 8, TX - 66, y);
      }
    }
    draw();
    async function run(i, rate, minutes, stopAt) {
      // Animate minute-by-minute pours into the reservoir (apply) or a gauge flash (others).
      for (let m = 1; m <= minutes; m++) {
        if (variant === "apply") {
          const v = Math.min(rate * m, tankMax);
          fill.clear();
          fill
            .fillStyle(WATER, 0.75)
            .fillRect(
              TX - 54,
              BOT - (v / tankMax) * (BOT - TOP),
              108,
              (v / tankMax) * (BOT - TOP) - 2,
            );
          kit.floatText(TX, BOT - (v / tankMax) * (BOT - TOP) - 10, `${m} min`, "#8fd3ff", 14);
        } else kit.floatText(xs[i], 230, `+${rate} L`, "#8fd3ff", 18);
        api.sfx.tick(m * 2);
        await kit.wait(stopAt ? 220 : 320);
      }
    }
    return {
      checkLabel:
        variant === "apply"
          ? L("Run the pump", "Encender la bomba")
          : L("Test the meters", "Probar medidores"),
      get actions() {
        if (variant === "apply")
          return [
            { key: "ArrowUp", label: L("Mark +1 L", "Marca +1 L"), run: () => bumpGuess(1) },
            { key: "ArrowDown", label: L("Mark −1 L", "Marca −1 L"), run: () => bumpGuess(-1) },
            { key: "ArrowRight", label: L("Mark +10 L", "Marca +10 L"), run: () => bumpGuess(10) },
            { key: "ArrowLeft", label: L("Mark −10 L", "Marca −10 L"), run: () => bumpGuess(-10) },
          ];
        const list = [
          { key: "ArrowUp", label: L("Meter +1", "Medidor +1"), run: () => bumpDial(sel, 1) },
          { key: "ArrowDown", label: L("Meter −1", "Medidor −1"), run: () => bumpDial(sel, -1) },
        ];
        if (variant === "compare")
          list.push(
            {
              key: "ArrowRight",
              label: L("Switch pump", "Cambiar bomba"),
              run: () => {
                sel = 1 - sel;
                draw();
                api.refresh();
              },
            },
            {
              key: "a",
              label: L("Choose pump A", "Elegir bomba A"),
              run: () => {
                choice = 0;
                draw();
                api.refresh();
              },
            },
            {
              key: "b",
              label: L("Choose pump B", "Elegir bomba B"),
              run: () => {
                choice = 1;
                draw();
                api.refresh();
              },
            },
          );
        return list;
      },
      status: () =>
        variant === "apply"
          ? L(`Mark at ${guess} L`, `Marca en ${guess} L`)
          : variant === "compare"
            ? L(
                `A: ${pumps[0].dial} L/min · B: ${pumps[1].dial} L/min · chosen: ${choice < 0 ? "none" : names[choice]}`,
                `A: ${pumps[0].dial} L/min · B: ${pumps[1].dial} L/min · elegida: ${choice < 0 ? "ninguna" : names[choice]}`,
              )
            : L(`Meter: ${P0.dial} L per minute`, `Medidor: ${P0.dial} L por minuto`),
      hints: {
        unit: () => [
          L(
            "A unit rate is the amount for ONE minute. Share the liters equally among the minutes.",
            "Una tasa unitaria es la cantidad en UN minuto. Reparte los litros por igual entre los minutos.",
          ),
          L(
            `${P0.q} liters ÷ ${P0.t} minutes = liters in each minute.`,
            `${P0.q} litros ÷ ${P0.t} minutos = litros en cada minuto.`,
          ),
        ],
        apply: () => [
          L(
            "First find how many liters the pump moves in 1 minute. Then use that for every minute of pumping.",
            "Primero halla cuántos litros mueve en 1 minuto. Luego úsalo para cada minuto de bombeo.",
          ),
          L(
            `${P0.q} ÷ ${P0.t} = ${P0.u} liters each minute. Now count ${n} minutes of that.`,
            `${P0.q} ÷ ${P0.t} = ${P0.u} litros cada minuto. Ahora cuenta ${n} minutos de eso.`,
          ),
        ],
        compare: () => [
          L(
            "The pump that moved more liters is not always faster. Compare liters in ONE minute.",
            "La bomba que movió más litros no siempre es la más rápida. Compara los litros en UN minuto.",
          ),
          L(
            `Pump A: ${pumps[0].q} ÷ ${pumps[0].t}. Pump B: ${pumps[1].q} ÷ ${pumps[1].t}.`,
            `Bomba A: ${pumps[0].q} ÷ ${pumps[0].t}. Bomba B: ${pumps[1].q} ÷ ${pumps[1].t}.`,
          ),
        ],
      }[variant](),
      async check() {
        if (variant === "apply") {
          await run(0, P0.u, n, true);
          if (guess === answer) {
            kit.burst(TX, BOT - (answer / tankMax) * (BOT - TOP), WATER, 24);
            return { ok: true };
          }
          const tag =
            guess === P0.q
              ? "total"
              : guess === P0.q + (n - P0.t)
                ? "additive"
                : guess === P0.u
                  ? "unitOnly"
                  : guess > answer
                    ? "over"
                    : "under";
          const fb = {
            total: L(
              `Your mark is the amount for ${P0.t} minutes. The reservoir runs for ${n} minutes.`,
              `Tu marca es la cantidad de ${P0.t} minutos. El depósito se llena durante ${n} minutos.`,
            ),
            additive: L(
              "You added minutes onto liters. Each extra minute adds a whole minute's worth of liters.",
              "Sumaste minutos a los litros. Cada minuto extra agrega los litros de un minuto entero.",
            ),
            unitOnly: L(
              `That is the amount for 1 minute. The pump runs ${n} minutes.`,
              `Esa es la cantidad de 1 minuto. La bomba trabaja ${n} minutos.`,
            ),
            over: L(
              "The water stopped below your mark. Your mark is too high.",
              "El agua se detuvo debajo de tu marca. Tu marca está muy alta.",
            ),
            under: L(
              "The water rose past your mark. Your mark is too low.",
              "El agua pasó tu marca. Tu marca está muy baja.",
            ),
          }[tag];
          return { ok: false, misconception: tag, feedback: fb };
        }
        for (let i = 0; i < pumps.length; i++)
          await run(i, pumps[i].dial, Math.min(3, pumps[i].t), false);
        const wrong = pumps.findIndex((p) => p.dial !== p.u);
        if (wrong >= 0) {
          const p = pumps[wrong];
          const who =
            variant === "compare"
              ? api.t(L(`Pump ${names[wrong]}: `, `Bomba ${names[wrong]}: `))
              : "";
          const tag =
            p.dial === 0
              ? "unset"
              : p.dial === p.q
                ? "total"
                : p.dial === p.t
                  ? "minutes"
                  : "notUnit";
          const fb = {
            unset: L(
              `${who}set the meter first: how many liters flow in ONE minute?`,
              `${who}primero ajusta el medidor: ¿cuántos litros salen en UN minuto?`,
            ),
            total: L(
              `${who}that is the amount for all ${p.t} minutes, not for one.`,
              `${who}esa es la cantidad de los ${p.t} minutos, no de uno.`,
            ),
            minutes: L(
              `${who}that is the number of minutes, not liters per minute.`,
              `${who}ese es el número de minutos, no litros por minuto.`,
            ),
            notUnit: L(
              `${who}at ${p.dial} L per minute, ${p.t} minutes would give ${p.dial * p.t} L, not ${p.q} L.`,
              `${who}a ${p.dial} L por minuto, ${p.t} minutos darían ${p.dial * p.t} L, no ${p.q} L.`,
            ),
          }[tag];
          return { ok: false, incomplete: tag === "unset", misconception: tag === "unset" ? null : tag, feedback: fb };
        }
        if (variant === "compare") {
          const faster = pumps[0].u > pumps[1].u ? 0 : 1;
          if (choice !== faster) {
            const tag =
              choice < 0
                ? null
                : pumps[choice].q > pumps[1 - choice].q
                  ? "compareTotals"
                  : "compareWrong";
            return {
              ok: false,
              incomplete: choice < 0,
              misconception: tag,
              feedback:
                choice < 0
                  ? L(
                      "Both meters are right. Now choose the faster pump (A or B).",
                      "Los dos medidores están bien. Ahora elige la bomba más rápida (A o B).",
                    )
                  : L(
                      "That pump moved more water in total, but over more minutes. Which meter reads higher?",
                      "Esa bomba movió más agua en total, pero en más minutos. ¿Qué medidor marca más?",
                    ),
            };
          }
        }
        kit.burst(xs[variant === "compare" ? choice : 0], 250, WATER, 24);
        return { ok: true };
      },
      async demo() {
        if (variant === "apply") {
          kit.floatText(250, 300, `${P0.q} ÷ ${P0.t} = ${P0.u}`, "#ffd76a", 22);
          await kit.wait(800);
          guess = answer;
          draw();
          await run(0, P0.u, n, true);
          return;
        }
        for (let i = 0; i < pumps.length; i++) {
          sel = i;
          kit.floatText(xs[i], 360, `${pumps[i].q} ÷ ${pumps[i].t} = ${pumps[i].u}`, "#ffd76a", 20);
          for (let v = pumps[i].dial; v !== pumps[i].u; v += pumps[i].u > v ? 1 : -1) {
            pumps[i].dial = v + (pumps[i].u > v ? 1 : -1);
            draw();
            await kit.wait(70);
          }
          await kit.wait(500);
        }
        if (variant === "compare") choice = pumps[0].u > pumps[1].u ? 0 : 1;
        draw();
      },
      explain: () =>
        variant === "apply"
          ? L(
              `${P0.q} ÷ ${P0.t} = ${P0.u} L per minute, so ${n} minutes × ${P0.u} = ${answer} L.`,
              `${P0.q} ÷ ${P0.t} = ${P0.u} L por minuto, así que ${n} minutos × ${P0.u} = ${answer} L.`,
            )
          : variant === "compare"
            ? L(
                `A: ${pumps[0].u} L/min, B: ${pumps[1].u} L/min. The faster pump has the greater unit rate, even if it moved less in total.`,
                `A: ${pumps[0].u} L/min, B: ${pumps[1].u} L/min. La bomba más rápida tiene la mayor tasa unitaria, aunque haya movido menos en total.`,
              )
            : L(
                `${P0.q} L ÷ ${P0.t} min = ${P0.u} L per minute.`,
                `${P0.q} L ÷ ${P0.t} min = ${P0.u} L por minuto.`,
              ),
    };
  }

  /* ── pipeline: plot equivalent ratios; the pipe is straight only through them ── */
  function pipeline(scene, api) {
    const { kit, rng } = api;
    const tier = api.tier;
    const { a, b } = tier >= 2 ? M.recipe(rng, 4, 4) : M.recipe(rng, 3, 4);
    const need = tier >= 2 ? 4 : 3;
    const MAX = 12;
    const OX = 92;
    const OY = 440;
    const CELL = 24;
    const pts = [];
    let cx = 0;
    let cy = 0;
    api.setBrief(
      L(
        `Lay the canal pipe. Each station must keep ${a} liters of water for every ${b} seedlings. Place ${need} stations (not at 0, 0).`,
        `Coloca la tubería. Cada estación debe mantener ${a} litros de agua por cada ${b} plántulas. Coloca ${need} estaciones (no en 0, 0).`,
      ),
    );
    const g = scene.add.graphics().setDepth(21);
    const pipe = scene.add.graphics().setDepth(22);
    const marks = scene.add.graphics().setDepth(23);
    const px = (x) => OX + x * CELL;
    const py = (y) => OY - y * CELL;
    g.fillStyle(PANEL, 0.9).fillRoundedRect(
      OX - 46,
      py(MAX) - 18,
      MAX * CELL + 70,
      MAX * CELL + 56,
      12,
    );
    for (let i = 0; i <= MAX; i++) {
      g.lineStyle(1, 0xffffff, i % 2 ? 0.08 : 0.16);
      g.lineBetween(px(i), py(0), px(i), py(MAX));
      g.lineBetween(px(0), py(i), px(MAX), py(i));
      if (i % 2 === 0) {
        kit.text(px(i), OY + 14, String(i), 11, "#9fb7c4", { depth: 22 });
        kit.text(OX - 14, py(i), String(i), 11, "#9fb7c4", { depth: 22 });
      }
    }
    g.lineStyle(3, 0xcfe3ee, 0.8)
      .lineBetween(px(0), py(0), px(MAX), py(0))
      .lineBetween(px(0), py(0), px(0), py(MAX));
    kit.text(px(MAX / 2), OY + 32, api.t(L("Water (liters) →", "Agua (litros) →")), 13, "#8fd3ff", {
      weight: "800",
      depth: 22,
    });
    kit
      .text(OX - 34, py(MAX / 2), api.t(L("Seedlings", "Plántulas")), 13, "#b8f59a", {
        weight: "800",
        depth: 22,
      })
      .setAngle(-90);
    // Station log (student's own values).
    kit.panel(470, 150, 320, 290, { fill: PANEL, alpha: 0.9 });
    kit.text(
      630,
      172,
      api.t(L("STATIONS  (water : seedlings)", "ESTACIONES  (agua : plántulas)")),
      13,
      "#ffd76a",
      { weight: "800" },
    );
    const log = kit.text(500, 196, "", 18, "#eaf6ff", {
      ox: 0,
      oy: 0,
      align: "left",
      depth: 22,
      lineSpacing: 8,
    });
    const zone = scene.add
      .zone(px(MAX / 2), py(MAX / 2), MAX * CELL + 26, MAX * CELL + 26)
      .setInteractive({ useHandCursor: true })
      .setDepth(24);
    zone.on("pointerdown", (p) => {
      cx = Phaser.Math.Clamp(Math.round((p.x - OX) / CELL), 0, MAX);
      cy = Phaser.Math.Clamp(Math.round((OY - p.y) / CELL), 0, MAX);
      toggle();
    });
    function toggle() {
      if (cx === 0 && cy === 0) {
        api.feedback(
          L(
            "The pipe already starts at (0, 0). Place stations along it.",
            "La tubería ya empieza en (0, 0). Coloca estaciones a lo largo.",
          ),
          "info",
        );
        return;
      }
      const i = pts.findIndex((p) => p.x === cx && p.y === cy);
      if (i >= 0) pts.splice(i, 1);
      else if (pts.length < need + 2) pts.push({ x: cx, y: cy });
      api.sfx.place();
      draw();
      api.refresh();
    }
    function move(dx, dy) {
      cx = Phaser.Math.Clamp(cx + dx, 0, MAX);
      cy = Phaser.Math.Clamp(cy + dy, 0, MAX);
      api.sfx.tick((cx + cy) % 12);
      draw();
      api.refresh();
    }
    function draw() {
      marks.clear();
      pts.forEach((p) => {
        marks.fillStyle(0x02070c, 0.6).fillCircle(px(p.x), py(p.y) + 2, 9);
        marks.fillStyle(0xffd76a, 1).fillCircle(px(p.x), py(p.y), 8);
        marks.lineStyle(2, 0xffffff, 1).strokeCircle(px(p.x), py(p.y), 8);
      });
      marks.lineStyle(3, 0x7be0c8, 1).strokeRect(px(cx) - 11, py(cy) - 11, 22, 22);
      const sorted = pts.slice().sort((p, q) => p.x - q.x || p.y - q.y);
      log.setText(
        sorted.length
          ? sorted.map((p, i) => `${i + 1}.  ${p.x} : ${p.y}`).join("\n")
          : api.t(L("No stations yet.", "Todavía no hay estaciones.")),
      );
    }
    kit.onType((key) => {
      if (key === "Backspace" && pts.length) {
        pts.pop();
        draw();
        api.refresh();
      }
    });
    draw();
    async function layPipe(color, through) {
      pipe.clear();
      pipe.lineStyle(8, color, 0.9);
      let prev = { x: 0, y: 0 };
      for (const p of through) {
        pipe.lineBetween(px(prev.x), py(prev.y), px(p.x), py(p.y));
        prev = p;
        api.sfx.tick(p.x % 12);
        await kit.wait(220);
      }
    }
    const onLine = (p) => p.x * b === p.y * a;
    return {
      checkLabel: L("Lay the pipe", "Tender la tubería"),
      actions: [
        { key: "ArrowRight", label: L("→ more water", "→ más agua"), run: () => move(1, 0) },
        { key: "ArrowLeft", label: L("← less water", "← menos agua"), run: () => move(-1, 0) },
        { key: "ArrowUp", label: L("↑ more seedlings", "↑ más plántulas"), run: () => move(0, 1) },
        {
          key: "ArrowDown",
          label: L("↓ fewer seedlings", "↓ menos plántulas"),
          run: () => move(0, -1),
        },
        {
          key: " ",
          label: L("Place / remove station", "Poner / quitar estación"),
          run: () => toggle(),
        },
      ],
      status: () =>
        L(
          `Cursor (${cx}, ${cy}) · stations ${pts.length} / ${need}`,
          `Cursor (${cx}, ${cy}) · estaciones ${pts.length} / ${need}`,
        ),
      hints: [
        L(
          `Start with the recipe itself: ${a} liters and ${b} seedlings is one station. Equivalent ratios multiply BOTH numbers by the same factor.`,
          `Empieza con la receta: ${a} litros y ${b} plántulas es una estación. Las razones equivalentes multiplican LOS DOS números por el mismo factor.`,
        ),
        L(
          `Double the recipe: (${2 * a}, ${2 * b}). Now try tripling it.`,
          `Duplica la receta: (${2 * a}, ${2 * b}). Ahora prueba triplicarla.`,
        ),
      ],
      async check() {
        if (pts.length < need)
          return {
            ok: false,
            incomplete: true,
            feedback: L(
              `Place ${need} stations before laying the pipe.`,
              `Coloca ${need} estaciones antes de tender la tubería.`,
            ),
          };
        const sorted = pts.slice().sort((p, q) => p.x - q.x || p.y - q.y);
        const bad = sorted.filter((p) => !onLine(p));
        await layPipe(bad.length ? 0xff9a5c : WATER, sorted);
        if (!bad.length) {
          kit.burst(px(sorted[sorted.length - 1].x), py(sorted[sorted.length - 1].y), WATER, 26);
          return { ok: true };
        }
        const swapped = bad.every((p) => p.x * a === p.y * b);
        const d = sorted.slice(1).map((p, i) => [p.x - sorted[i].x, p.y - sorted[i].y]);
        const collinear = d.every(([dx, dy]) => dx * d[0][1] === dy * d[0][0]);
        // A straight line that misses (0, 0) is the additive pattern (e.g. 2:3, 3:4, 4:5).
        const missesOrigin =
          collinear && sorted.length > 1 && sorted[0].x * d[0][1] !== sorted[0].y * d[0][0];
        const tag = swapped ? "swapped" : missesOrigin ? "notOrigin" : "notEquivalent";
        const p = bad[0];
        return {
          ok: false,
          misconception: tag,
          feedback: {
            swapped: L(
              "The pipe bends: those stations have water and seedlings switched. Water goes across, seedlings go up.",
              "La tubería se dobla: esas estaciones tienen agua y plántulas al revés. El agua va a lo ancho, las plántulas hacia arriba.",
            ),
            notOrigin: L(
              "Your stations line up, but the line would not pass through (0, 0). Equivalent ratios always start at zero — you added instead of multiplying.",
              "Tus estaciones forman una recta, pero no pasa por (0, 0). Las razones equivalentes siempre empiezan en cero: sumaste en vez de multiplicar.",
            ),
            notEquivalent: L(
              `The pipe bends at (${p.x}, ${p.y}): ${p.x} : ${p.y} is not equivalent to ${a} : ${b}.`,
              `La tubería se dobla en (${p.x}, ${p.y}): ${p.x} : ${p.y} no es equivalente a ${a} : ${b}.`,
            ),
          }[tag],
        };
      },
      async demo() {
        pts.length = 0;
        for (let k = 1; k <= need; k++) {
          cx = a * k;
          cy = b * k;
          pts.push({ x: cx, y: cy });
          draw();
          kit.floatText(px(cx), py(cy) - 18, `×${k}`, "#ffd76a", 18);
          await kit.wait(520);
        }
        await layPipe(WATER, pts.slice());
      },
      explain: () =>
        L(
          `Points like (${a}, ${b}), (${2 * a}, ${2 * b}), (${3 * a}, ${3 * b}) are equivalent ratios. On a graph they make a straight line through (0, 0).`,
          `Puntos como (${a}, ${b}), (${2 * a}, ${2 * b}), (${3 * a}, ${3 * b}) son razones equivalentes. En una gráfica forman una recta que pasa por (0, 0).`,
        ),
    };
  }

  Object.assign(M, { pump, pipeline });
})();
