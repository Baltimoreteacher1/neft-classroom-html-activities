/* Switchyard Odyssey — mission builders for the Expression Express expedition (part 1).
 *
 *   tower  the switch tower: the signal code is a numerical expression. The student fires one
 *          switch (operation) at a time and types its value; the last car's number is the
 *          siding the train rolls to. Wrong order or 3² = 6 sends it to an empty siding.
 *   cargo  load the freight cars: each car's cargo is an algebraic expression evaluated at
 *          today's x. Wrong values overload a car (crushed springs) or leave it half empty.
 * Shared art, colours and entry helpers: expedition-kit.js (window.EE_MISSIONS).
 * Pure mathematics: expedition-math.js (window.EE_MATH).
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const EM = window.EE_MATH;
  const K = window.EE_MISSIONS;
  if (!X || !EM || !K || !K.drawCar) return;
  const { L, entry, drawCar, drawRails, makeLoco, substitute, COPPER, BRASS, PANEL, GOOD, BAD } = K;
  const niceMax = (v) => Math.max(20, Math.ceil((v * 1.25) / 10) * 10);

  /* ── tower: order of operations with exponents ───────────────────────── */
  function tower(scene, api) {
    const { kit, rng } = api;
    const pb = EM.genTower(rng, api.tier);
    let items = pb.items;
    let steps = [];
    let sel = -1;
    const ent = entry(3);
    const yardMax = niceMax(Math.max(pb.value, pb.ltr || 0, pb.powT || 0));
    api.setBrief(
      L(
        `Signal code: ${pb.text}. Fire one switch at a time and type its value. The last number left is the siding the train goes to.`,
        `Código de señal: ${pb.text}. Activa un cambio a la vez y escribe su valor. El último número es la vía donde llega el tren.`,
      ),
    );
    // Board: tower panel, log panel, yard panel.
    kit.panel(20, 140, 520, 196, { fill: PANEL, alpha: 0.9 });
    kit.panel(552, 140, 248, 196, { fill: PANEL, alpha: 0.9 });
    kit.panel(20, 344, 780, 130, { fill: PANEL, alpha: 0.86 });
    kit.text(36, 158, api.t(L("SWITCH TOWER", "TORRE DE CAMBIOS")), 13, "#ffd76a", {
      ox: 0,
      weight: "800",
    });
    kit.text(568, 158, api.t(L("SWITCHES FIRED", "CAMBIOS HECHOS")), 13, "#ffd76a", {
      ox: 0,
      weight: "800",
    });
    const row = [];
    const rowG = scene.add.graphics().setDepth(21);
    const entryText = kit.text(280, 254, "", 22, "#ffffff", { weight: "900", depth: 23 });
    const logText = kit.text(568, 176, "", 15, "#eaf6ff", {
      ox: 0,
      oy: 0,
      align: "left",
      lineSpacing: 6,
      depth: 23,
    });
    kit.keypad(34, 304, (k) => k !== "Backspace" && type(k), {
      size: 40,
      gap: 4,
      keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    });
    kit.button(618, 304, 112, 40, "⤵ " + api.t(L("Throw", "Activar")), () => throwSwitch(), {
      size: 16,
    });
    kit.button(506, 304, 58, 40, "⌫", () => type("Backspace"), {
      size: 18,
      fill: 0x2f4b5c,
      color: "#eaf6ff",
    });
    kit.button(736, 304, 108, 40, api.t(L("Undo", "Deshacer")), () => undo(), {
      size: 15,
      fill: 0x2f4b5c,
      color: "#eaf6ff",
    });

    // Yard: a number line of sidings from 0 to yardMax.
    const Y0 = 50;
    const Y1 = 770;
    const TRACK = 440;
    const yard = scene.add.graphics().setDepth(21);
    drawRails(yard, Y0 - 20, Y1 + 20, TRACK);
    yard.fillStyle(0x6b4a3a, 1).fillRect(Y1 + 18, TRACK - 22, 10, 26);
    const step = yardMax / 10;
    for (let k = 0; k <= 10; k++) {
      const x = Y0 + ((Y1 - Y0) * k) / 10;
      yard.lineStyle(2, 0xcfb8a8, 0.7).lineBetween(x, TRACK + 10, x, TRACK + 18);
      kit.text(x, TRACK + 28, String(Math.round(k * step)), 12, "#cfb8a8", { depth: 22 });
    }
    kit.text(784, 362, api.t(L("SIDINGS", "VÍAS")), 13, "#ffd76a", { ox: 1, weight: "800" });
    const xFor = (v) => Y0 + ((Y1 - Y0) * v) / yardMax;
    const loco = makeLoco(scene, Y0, TRACK - 4);
    const station = scene.add.graphics().setDepth(22);

    const fireable = () => items.map((_, i) => i).filter((i) => EM.towerFireable(items, i));
    function draw() {
      row.forEach((o) => o.destroy());
      row.length = 0;
      rowG.clear();
      const labels = items.map((it) => EM.itemLabel(it));
      const widths = items.map((it, i) =>
        it.t === "o" ? 44 : it.t === "(" || it.t === ")" ? 16 : 28 + labels[i].length * 17,
      );
      const total = widths.reduce((s, w) => s + w + 8, -8);
      let x = 280 - total / 2;
      const fire = fireable();
      if (!fire.includes(sel)) sel = fire.length ? fire[0] : -1;
      items.forEach((it, i) => {
        const w = widths[i];
        const cx = x + w / 2;
        if (it.t === "n" || it.t === "p") {
          drawCar(rowG, cx, 178, w, 44, it.t === "p" ? 0x9a5a3c : 0x4a3a52);
          if (i === sel)
            rowG.lineStyle(4, BRASS, 1).strokeRoundedRect(cx - w / 2 - 3, 175, w + 6, 50, 9);
          row.push(kit.text(cx, 200, labels[i], 26, "#ffffff", { weight: "900", depth: 23 }));
        } else if (it.t === "o") {
          const on = fire.includes(i);
          rowG.fillStyle(on ? 0x2f2238 : 0x1d1624, 1).fillCircle(cx, 201, 19);
          rowG.lineStyle(i === sel ? 4 : 2, i === sel ? BRASS : on ? COPPER : 0x5a4a60, 1);
          rowG.strokeCircle(cx, 201, 19);
          row.push(
            kit.text(cx, 200, labels[i], 22, on ? "#ffe2cf" : "#8a7a90", {
              weight: "900",
              depth: 23,
            }),
          );
        } else row.push(kit.text(cx, 199, labels[i], 30, "#ffd76a", { weight: "800", depth: 23 }));
        if (fire.includes(i)) {
          const z = scene.add
            .zone(cx, 201, Math.max(w, 40), 48)
            .setInteractive({ useHandCursor: true })
            .setDepth(24);
          z.on("pointerdown", () => {
            sel = i;
            api.sfx.select();
            draw();
            api.refresh();
          });
          row.push(z);
        }
        x += w + 8;
      });
      entryText.setText(
        sel < 0
          ? items.length === 1
            ? api.t(L("One car left — send the train!", "Queda un vagón: ¡envía el tren!"))
            : ""
          : EM.stepLabel(items, sel) + " = " + (ent.text || "▮"),
      );
      logText.setText(
        steps
          .slice(-4)
          .map(
            (s, k) =>
              `${steps.length - Math.min(4, steps.length) + k + 1}) ${s.label} → ${s.typed}`,
          )
          .join("\n"),
      );
    }
    function type(key) {
      if (sel < 0 || !ent.type(key)) return;
      api.sfx.tap();
      draw();
      api.refresh();
    }
    kit.onType((k) => k !== "Backspace" && type(k));
    function commit(value) {
      const it = items[sel];
      steps.push({
        legal: EM.towerLegal(items, sel),
        pow: it.t === "p" ? { b: it.b, e: it.e } : null,
        typed: value,
        truth: EM.towerTruth(items, sel),
        label: EM.stepLabel(items, sel),
      });
      kit.floatText(280, 230, "→ " + value, "#ffd76a", 20);
      items = EM.towerFire(items, sel, value);
      ent.text = "";
      sel = -1;
      api.sfx.place();
      draw();
      api.refresh();
    }
    function throwSwitch() {
      if (sel < 0) return;
      if (ent.value == null) {
        api.feedback(
          L("Type the value of that switch first.", "Primero escribe el valor de ese cambio."),
          "info",
        );
        return;
      }
      commit(ent.value);
    }
    function undo() {
      if (!steps.length) return;
      steps = steps.slice(0, -1);
      items = pb.items;
      // Replay the remaining steps from the start.
      const keep = steps;
      steps = [];
      keep.forEach((s) => {
        const i = fireable().find((k) => EM.stepLabel(items, k) === s.label);
        if (i == null) return;
        sel = i;
        commit(s.typed);
      });
      api.sfx.tap();
      draw();
      api.refresh();
    }
    draw();

    async function roll(value) {
      const off = !(Number.isInteger(value) && value >= 0 && value <= yardMax);
      const tx = off ? Y1 + 4 : xFor(value);
      loco.x = Y0;
      api.sfx.whoosh();
      kit.tween({ targets: loco, x: tx, duration: 1100, ease: "Sine.easeInOut" });
      await kit.wait(1150);
      if (off) {
        kit.shake(0.008, 220);
        kit.tween({ targets: loco, angle: -8, duration: 160, yoyo: true });
        kit.floatText(
          Y1 - 20,
          TRACK - 50,
          api.t(L("Buffer stop!", "¡Tope de vía!")),
          "#ff8a5c",
          20,
        );
      }
      return { off, tx };
    }
    function stationAt(x, ok) {
      station.clear();
      station.fillStyle(ok ? 0x6b4a3a : 0x3a3036, 1).fillRect(x - 40, TRACK - 52, 80, 10);
      station.fillStyle(ok ? BRASS : 0x5a5060, 1).fillRect(x - 34, TRACK - 70, 68, 6);
      station.lineStyle(3, 0x9aa3ad, 1).lineBetween(x - 30, TRACK - 64, x - 30, TRACK - 52);
      station.lineBetween(x + 30, TRACK - 64, x + 30, TRACK - 52);
      if (ok)
        for (let k = 0; k < 5; k++)
          station
            .fillStyle([0xffd76a, 0x8fd3ff, 0xffb795][k % 3], 1)
            .fillCircle(x - 22 + k * 11, TRACK - 60, 4);
    }

    function explainChain() {
      return pb.steps.map((s) => `${s.label} = ${s.v}`).join(" → ");
    }
    return {
      checkLabel: L("Send the train", "Enviar el tren"),
      get actions() {
        return [
          {
            key: "ArrowRight",
            label: L("Next switch →", "Cambio siguiente →"),
            run: () => {
              const f = fireable();
              if (!f.length) return;
              sel = f[(f.indexOf(sel) + 1) % f.length];
              draw();
              api.refresh();
            },
          },
          {
            key: "ArrowLeft",
            label: L("← Previous switch", "← Cambio anterior"),
            run: () => {
              const f = fireable();
              if (!f.length) return;
              sel = f[(f.indexOf(sel) + f.length - 1) % f.length];
              draw();
              api.refresh();
            },
          },
          { key: " ", label: L("Throw this switch", "Activar este cambio"), run: throwSwitch },
          {
            key: "Backspace",
            label: L("Erase digit", "Borrar dígito"),
            run: () => type("Backspace"),
          },
          { key: "u", label: L("Undo last switch", "Deshacer el último cambio"), run: undo },
        ];
      },
      status: () =>
        L(
          `Code now: ${EM.towerText(items)} · switches fired: ${steps.length}`,
          `Código ahora: ${EM.towerText(items)} · cambios hechos: ${steps.length}`,
        ),
      get hints() {
        const s0 = pb.steps[0];
        const it = pb.items[s0.i];
        const why =
          it.t === "p"
            ? L(
                `Start with ${s0.label}: it means ${Array(it.e).fill(it.b).join(" × ")}.`,
                `Empieza con ${s0.label}: significa ${Array(it.e).fill(it.b).join(" × ")}.`,
              )
            : pb.text.includes("(")
              ? L(
                  `Start with ${s0.label}: it is inside the parentheses.`,
                  `Empieza con ${s0.label}: está dentro de los paréntesis.`,
                )
              : L(
                  `Start with ${s0.label}: ${it.o} comes before + and −.`,
                  `Empieza con ${s0.label}: ${it.o} va antes de + y −.`,
                );
        return [
          L(
            "Fire switches in this order: inside ( ) first, then exponents, then × and ÷, then + and − from left to right.",
            "Activa los cambios en este orden: primero dentro de ( ), luego exponentes, luego × y ÷, y al final + y − de izquierda a derecha.",
          ),
          why,
        ];
      },
      async check() {
        if (items.length > 1)
          return {
            ok: false,
            incomplete: true,
            feedback: L(
              "Fire switches until only one number is left.",
              "Activa cambios hasta que quede un solo número.",
            ),
          };
        const v = items[0].v;
        const res = EM.judgeTower(pb, steps, v);
        const { off } = await roll(v);
        if (res.ok) {
          stationAt(xFor(v), true);
          kit.burst(xFor(v), TRACK - 70, BRASS, 26);
          api.sfx.success();
          return { ok: true };
        }
        if (!off) stationAt(xFor(v), false);
        const where = off
          ? L(
              "The train ran past the last siding into the buffer stop.",
              "El tren pasó la última vía y chocó con el tope.",
            )
          : L(`Siding ${v} is empty — no passengers.`, `La vía ${v} está vacía: no hay pasajeros.`);
        const k = res.step + 1;
        const s = steps[res.step];
        const why = {
          leftToRight: L(
            `Switch ${k} fired too early. Do ( ) first, then exponents, then × and ÷, then + and −.`,
            `El cambio ${k} se activó muy pronto. Primero ( ), luego exponentes, luego × y ÷, y después + y −.`,
          ),
          powerTimes: L(
            `In switch ${k} you made ${s?.label} = ${s?.typed}. An exponent is repeated multiplying, not base × exponent.`,
            `En el cambio ${k} hiciste ${s?.label} = ${s?.typed}. Un exponente es multiplicar repetidamente, no base × exponente.`,
          ),
          arith: L(
            `Switch ${k} has a math slip. Check the value you typed for ${s?.label}.`,
            `El cambio ${k} tiene un error de cálculo. Revisa el valor que escribiste para ${s?.label}.`,
          ),
        }[res.tag];
        return {
          ok: false,
          misconception: res.tag,
          feedback: L(where.en + " " + why.en, where.es + " " + why.es),
        };
      },
      async demo() {
        items = pb.items;
        steps = [];
        ent.text = "";
        draw();
        await kit.wait(400);
        for (const s of pb.steps) {
          sel = fireable().find((i) => EM.stepLabel(items, i) === s.label) ?? s.i;
          ent.text = String(s.v);
          draw();
          api.sfx.tick(steps.length * 3);
          await kit.wait(800);
          commit(s.v);
          await kit.wait(500);
        }
        await roll(pb.value);
        stationAt(xFor(pb.value), true);
        kit.burst(xFor(pb.value), TRACK - 70, BRASS, 26);
      },
      explain: () =>
        L(
          `${pb.text} = ${pb.value}. ${explainChain()}. Order: ( ), exponents, × ÷, then + −.`,
          `${pb.text} = ${pb.value}. ${explainChain()}. Orden: ( ), exponentes, × ÷, y luego + −.`,
        ),
    };
  }

  /* ── cargo: evaluate algebraic expressions at today's x ──────────────── */
  function cargo(scene, api) {
    const { kit, rng } = api;
    const pb = EM.genCargo(rng, api.tier);
    const n = pb.cars.length;
    const ents = pb.cars.map(() => entry(3));
    let sel = 0;
    api.setBrief(
      L(
        `Today x = ${pb.x}. Each car's label tells its cargo. Type how many crates each car carries, then load the train.`,
        `Hoy x = ${pb.x}. La etiqueta de cada vagón dice su carga. Escribe cuántas cajas lleva cada vagón y carga el tren.`,
      ),
    );
    kit.panel(20, 140, 168, 120, { fill: PANEL, alpha: 0.92 });
    kit.text(104, 162, api.t(L("TODAY", "HOY")), 14, "#ffd76a", { weight: "800" });
    kit.text(104, 210, `x = ${pb.x}`, 36, "#ffffff", { weight: "900" });
    kit.text(104, 246, api.t(L("the value of x", "el valor de x")), 12, "#cfb8a8", {});
    const xs = n === 2 ? [380, 620] : [300, 500, 700];
    const CW = 168;
    const TOP = 214;
    const CH = 66;
    const rails = scene.add.graphics().setDepth(20);
    drawRails(rails, 200, 800, TOP + CH + 14);
    const g = scene.add.graphics().setDepth(21);
    const load = scene.add.graphics().setDepth(22);
    const labels = pb.cars.map((c, i) => {
      kit.panel(xs[i] - CW / 2, 146, CW, 42, {
        fill: 0x2a1d33,
        alpha: 0.95,
        line: COPPER,
        depth: 21,
      });
      return kit.text(xs[i], 167, c.text, 21, "#ffe2cf", { weight: "900", depth: 23 });
    });
    const vals = xs.map((x) =>
      kit.text(x, TOP + CH + 46, "", 18, "#ffffff", { weight: "900", depth: 23 }),
    );
    xs.forEach((x, i) => {
      const z = scene.add
        .zone(x, TOP + 30, CW, 150)
        .setInteractive({ useHandCursor: true })
        .setDepth(24);
      z.on("pointerdown", () => {
        sel = i;
        api.sfx.select();
        draw();
        api.refresh();
      });
    });
    kit.keypad(144, 430, (k) => k !== "Backspace" && type(k), {
      size: 42,
      gap: 6,
      keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    });
    kit.button(660, 430, 64, 42, "⌫", () => type("Backspace"), {
      size: 18,
      fill: 0x2f4b5c,
      color: "#eaf6ff",
    });
    const shown = pb.cars.map(() => null);
    function draw() {
      g.clear();
      load.clear();
      xs.forEach((x, i) => {
        const st = shown[i];
        const sink = st && st.over ? 8 : 0;
        drawCar(
          g,
          x,
          TOP,
          CW,
          CH,
          st ? (st.ok ? 0x3f6b4f : st.over ? 0x7a3a2c : 0x5a4a3a) : 0x4a3a52,
          {
            sink,
            springs: st && st.over ? BAD : undefined,
          },
        );
        if (i === sel)
          g.lineStyle(4, BRASS, 1).strokeRoundedRect(x - CW / 2 - 4, TOP - 4, CW + 8, CH + 8, 10);
        if (st) {
          // Crates: a full car at the right amount, spilling over when overloaded.
          const ratio = Math.min(1.5, st.typed / Math.max(1, st.value));
          const cols = 6;
          const boxes = Math.round(ratio * 12);
          for (let b = 0; b < boxes; b++) {
            const cx = x - CW / 2 + 16 + (b % cols) * 24;
            const cy = TOP + CH - 22 - Math.floor(b / cols) * 18 + sink;
            load.fillStyle(b >= 12 ? BAD : 0xd9a066, 1).fillRect(cx, cy, 20, 15);
            load.lineStyle(1, 0x5a3a22, 1).strokeRect(cx, cy, 20, 15);
          }
        }
        vals[i].setText(
          (ents[i].text || (i === sel ? "▮" : "?")) + " " + api.t(L("crates", "cajas")),
        );
      });
    }
    function type(key) {
      if (!ents[sel].type(key)) return;
      shown[sel] = null;
      api.sfx.tap();
      draw();
      api.refresh();
    }
    kit.onType((k) => k !== "Backspace" && type(k));
    draw();
    const stateWord = (over) =>
      over
        ? L(
            "is overloaded — its springs are crushed.",
            "está sobrecargado: sus resortes se aplastan.",
          )
        : L(
            "is half empty — cargo is left on the platform.",
            "va medio vacío: quedó carga en el andén.",
          );
    async function loadCars(typed) {
      for (let i = 0; i < n; i++) {
        const car = pb.cars[i];
        shown[i] = {
          typed: typed[i],
          value: car.value,
          ok: typed[i] === car.value,
          over: typed[i] > car.value,
        };
        api.sfx.place();
        draw();
        await kit.wait(380);
        if (!shown[i].ok) {
          kit.shake(0.004, 140);
          return;
        }
        kit.burst(xs[i], TOP, GOOD, 10);
      }
    }
    return {
      checkLabel: L("Load the train", "Cargar el tren"),
      actions: [
        {
          key: "ArrowRight",
          label: L("Next car →", "Vagón siguiente →"),
          run: () => {
            sel = (sel + 1) % n;
            draw();
            api.refresh();
          },
        },
        {
          key: "ArrowLeft",
          label: L("← Previous car", "← Vagón anterior"),
          run: () => {
            sel = (sel + n - 1) % n;
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
          `x = ${pb.x} · ` +
            pb.cars.map((c, i) => `car ${i + 1}: ${ents[i].text || "?"}`).join(", "),
          `x = ${pb.x} · ` +
            pb.cars.map((c, i) => `vagón ${i + 1}: ${ents[i].text || "?"}`).join(", "),
        ),
      hints: [
        L(
          `Replace x with today's number, ${pb.x}. Then use the order of operations: ( ), exponents, ×, then + and −.`,
          `Cambia x por el número de hoy, ${pb.x}. Luego usa el orden de operaciones: ( ), exponentes, × y después + y −.`,
        ),
        L(
          `Car 1: ${pb.cars[0].text} becomes ${substitute(pb.cars[0].text, pb.x)}. A number touching x or ( ) means multiply.`,
          `Vagón 1: ${pb.cars[0].text} se convierte en ${substitute(pb.cars[0].text, pb.x)}. Un número junto a x o a ( ) significa multiplicar.`,
        ),
      ],
      async check() {
        if (ents.some((e) => e.value == null))
          return {
            ok: false,
            incomplete: true,
            feedback: L(
              "Type the cargo for every car first.",
              "Primero escribe la carga de cada vagón.",
            ),
          };
        const typed = ents.map((e) => e.value);
        const res = EM.judgeCargo(pb, typed);
        await loadCars(typed);
        if (res.ok) return { ok: true };
        const k = res.car + 1;
        const text = pb.cars[res.car].text;
        const st = stateWord(res.over);
        const why = {
          digits: L(
            "A number next to x means multiply. It is not two digits side by side.",
            "Un número junto a x significa multiplicar. No son dos dígitos juntos.",
          ),
          powerTimes: L(
            "An exponent means multiply the number by itself: x² is x × x, not x × 2.",
            "Un exponente significa multiplicar el número por sí mismo: x² es x × x, no x × 2.",
          ),
          leftToRight: L(
            "Do exponents and × before + and −, even when + comes first.",
            "Haz los exponentes y × antes de + y −, aunque + aparezca primero.",
          ),
          firstOnly: L(
            "The number outside ( ) multiplies everything inside, not only the first term.",
            "El número fuera de ( ) multiplica todo lo de adentro, no solo el primer término.",
          ),
          arith: L(
            `Put x = ${pb.x} into the expression and check each step.`,
            `Pon x = ${pb.x} en la expresión y revisa cada paso.`,
          ),
        }[res.tag];
        return {
          ok: false,
          misconception: res.tag,
          feedback: L(
            `Car ${k} (${text}) ${st.en} ${why.en}`,
            `El vagón ${k} (${text}) ${st.es} ${why.es}`,
          ),
        };
      },
      async demo() {
        for (let i = 0; i < n; i++) {
          sel = i;
          const car = pb.cars[i];
          ents[i].text = "";
          draw();
          kit.floatText(xs[i], TOP - 4, substitute(car.text, pb.x), "#ffd76a", 18);
          await kit.wait(900);
          ents[i].text = String(car.value);
          api.sfx.tick(i * 4);
          draw();
          await kit.wait(500);
        }
        await loadCars(pb.cars.map((c) => c.value));
      },
      explain: () =>
        L(
          `With x = ${pb.x}: ` +
            pb.cars.map((c) => `${c.text} = ${substitute(c.text, pb.x)} = ${c.value}`).join("; ") +
            ".",
          `Con x = ${pb.x}: ` +
            pb.cars.map((c) => `${c.text} = ${substitute(c.text, pb.x)} = ${c.value}`).join("; ") +
            ".",
        ),
    };
  }

  Object.assign(K, { tower, cargo });
})();
