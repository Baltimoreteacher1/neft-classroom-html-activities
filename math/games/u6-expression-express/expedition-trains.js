/* Switchyard Odyssey — mission builders for the Expression Express expedition (part 2).
 *
 *   couple  couple an equivalent train: the student writes an expression in a fixed shape
 *           ([ ]x + [ ], [ ](x + [ ]), [ ]([ ]x + [ ])) from a source expression or a route
 *           description. Test runs at three x values must match or the coupling snaps.
 *   merge   shorten a long train by combining like terms: x² cars, x cars and number cars
 *           go into their own big car. A wrong count overloads a car or leaves it half empty.
 */
(function () {
  "use strict";
  const EM = window.EE_MATH;
  const M = window.EE_MISSIONS;
  if (!window.EWLExpedition || !EM || !M) return;
  const { L, entry, drawCar, drawRails, makeLoco, COPPER, BRASS, PANEL, GOOD, BAD, KIND, STORIES } = M;
  const MINUS = EM.MINUS;
  const fmt = EM.fmtNum;

  /* ── couple: equivalent expressions (write, expand, factor) ───────────── */
  function couple(scene, api) {
    const { kit, rng } = api;
    const variant = api.mission.variant || "expand";
    const pb = EM.genCouple(rng, variant, api.tier);
    const nBlank = pb.form === "fac" ? 3 : 2;
    const ents = Array.from({ length: nBlank }, () => entry(2));
    let sign = "+";
    let sel = 0;
    const story =
      variant === "words"
        ? pb.story === "trains"
          ? STORIES.trains(pb.params.g, pb.params.q)
          : STORIES[pb.story](pb.params.p, pb.params.q)
        : null;
    api.setBrief(
      variant === "words"
        ? L(
            "Read the route card. Write its expression so your train carries the same cargo for every x.",
            "Lee la tarjeta de ruta. Escribe su expresión para que tu tren lleve la misma carga para cada x.",
          )
        : variant === "factor"
          ? L(
              `Factor the engine train ${pb.source}: write an equal train with a number bigger than 1 outside the ( ).`,
              `Factoriza el tren ${pb.source}: escribe un tren igual con un número mayor que 1 fuera de los ( ).`,
            )
          : L(
              `Write a train equal to ${pb.source} with no parentheses. Test runs check it at three values of x.`,
              `Escribe un tren igual a ${pb.source} sin paréntesis. Las pruebas lo revisan con tres valores de x.`,
            ),
    );
    // Source card.
    kit.panel(20, 140, 780, 70, { fill: PANEL, alpha: 0.92 });
    kit.text(
      36,
      156,
      api.t(
        variant === "words" ? L("ROUTE CARD", "TARJETA DE RUTA") : L("ENGINE TRAIN", "TREN MOTOR"),
      ),
      13,
      "#ffd76a",
      { ox: 0, weight: "800" },
    );
    if (story)
      kit.text(36, 170, api.t(story), 15, "#ffe2cf", {
        ox: 0,
        oy: 0,
        align: "left",
        wrap: 740,
        weight: "700",
      });
    else kit.text(410, 182, pb.source, 30, "#ffe2cf", { weight: "900" });
    // Student's train template.
    kit.panel(20, 218, 430, 96, { fill: PANEL, alpha: 0.9 });
    kit.text(36, 234, api.t(L("YOUR TRAIN", "TU TREN")), 13, "#ffd76a", { ox: 0, weight: "800" });
    const tplG = scene.add.graphics().setDepth(21);
    const tplObjs = [];
    // Test runs table.
    kit.panel(462, 218, 338, 186, { fill: PANEL, alpha: 0.9 });
    kit.text(478, 234, api.t(L("TEST RUNS", "PRUEBAS")), 13, "#ffd76a", { ox: 0, weight: "800" });
    const COLS = [520, 640, 750];
    [L("x", "x"), story ? L("route", "ruta") : L("engine", "motor"), L("yours", "el tuyo")].forEach(
      (h, i) => kit.text(COLS[i], 258, api.t(h), 14, "#cfb8a8", { weight: "800" }),
    );
    const cells = pb.xs.map((x, r) =>
      COLS.map((cx, c) =>
        kit.text(cx, 292 + r * 36, c === 0 ? String(x) : "·", 19, "#ffffff", {
          weight: "900",
          depth: 23,
        }),
      ),
    );
    const rowG = scene.add.graphics().setDepth(21);
    // Two trains on the yard: engine train and the student's train.
    const rails = scene.add.graphics().setDepth(20);
    kit.panel(20, 322, 430, 92, { fill: PANEL, alpha: 0.86, depth: 19 });
    drawRails(rails, 34, 436, 396);
    const locoA = makeLoco(scene, 373, 389);
    const carsG = scene.add.graphics().setDepth(25);
    const EX = 300;
    let gap = 50;
    function drawTrains(snap) {
      carsG.clear();
      drawCar(carsG, EX, 358, 70, 24, 0x7a5a48);
      drawCar(carsG, EX - 76 - gap, 358, 70, 24, snap ? 0x7a3a2c : 0x3f5a6b);
      drawCar(carsG, EX - 152 - gap, 358, 70, 24, snap ? 0x7a3a2c : 0x3f5a6b);
      carsG.lineStyle(3, snap ? BAD : 0x9aa3ad, 1).lineBetween(EX - 41 - gap, 374, EX - 35, 374);
    }
    drawTrains(false);
    kit.keypad(34, 440, (k) => k !== "Backspace" && type(k), {
      size: 40,
      gap: 4,
      keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    });
    kit.button(504, 440, 56, 40, "⌫", () => type("Backspace"), {
      size: 18,
      fill: 0x2f4b5c,
      color: "#eaf6ff",
    });
    kit.button(600, 440, 96, 40, "+ / " + MINUS, () => flip(), {
      size: 17,
      fill: 0x2f4b5c,
      color: "#eaf6ff",
    });

    function draw() {
      tplObjs.forEach((o) => o.destroy());
      tplObjs.length = 0;
      tplG.clear();
      const box = (x, i) => {
        const on = i === sel;
        tplG.fillStyle(0x10283a, 1).fillRoundedRect(x - 26, 252, 52, 44, 9);
        tplG
          .lineStyle(on ? 4 : 2, on ? BRASS : 0x5e92b3, 1)
          .strokeRoundedRect(x - 26, 252, 52, 44, 9);
        tplObjs.push(
          kit.text(x, 274, ents[i].text || (on ? "▮" : "?"), 22, "#ffe9a8", {
            weight: "900",
            depth: 23,
          }),
        );
        const z = scene.add
          .zone(x, 274, 54, 46)
          .setInteractive({ useHandCursor: true })
          .setDepth(24);
        z.on("pointerdown", () => {
          sel = i;
          draw();
          api.refresh();
        });
        tplObjs.push(z);
      };
      const txt = (x, s) =>
        tplObjs.push(kit.text(x, 274, s, 26, "#ffffff", { weight: "900", depth: 23 }));
      const signBox = (x) => {
        tplG.fillStyle(0x2a1d33, 1).fillRoundedRect(x - 18, 256, 36, 36, 8);
        tplG.lineStyle(2, COPPER, 1).strokeRoundedRect(x - 18, 256, 36, 36, 8);
        txt(x, sign);
        const z = scene.add
          .zone(x, 274, 38, 38)
          .setInteractive({ useHandCursor: true })
          .setDepth(24);
        z.on("pointerdown", flip);
        tplObjs.push(z);
      };
      if (pb.form === "lin") {
        box(100, 0);
        txt(146, "x");
        signBox(196);
        box(252, 1);
      } else if (pb.form === "fac1") {
        box(90, 0);
        txt(138, "(x");
        signBox(188);
        box(244, 1);
        txt(286, ")");
      } else {
        box(76, 0);
        txt(114, "(");
        box(156, 1);
        txt(198, "x");
        signBox(240);
        box(294, 2);
        txt(336, ")");
      }
    }
    function type(key) {
      if (!ents[sel].type(key)) return;
      api.sfx.tap();
      draw();
      api.refresh();
    }
    function flip() {
      sign = sign === "+" ? MINUS : "+";
      api.sfx.select();
      draw();
      api.refresh();
    }
    kit.onType((k) => k !== "Backspace" && type(k));
    draw();
    const values = () => ents.map((e) => e.value);
    async function testRuns(e) {
      rowG.clear();
      let firstBad = -1;
      for (let r = 0; r < pb.xs.length; r++) {
        const x = pb.xs[r];
        const a = EM.sourceValue(pb, x);
        const b = EM.formValue(pb.form, e, sign, x);
        cells[r][1].setText(fmt(a));
        cells[r][2].setText(fmt(b));
        const ok = a === b;
        if (!ok && firstBad < 0) firstBad = r;
        rowG.fillStyle(ok ? GOOD : BAD, 0.22).fillRoundedRect(474, 276 + r * 36, 314, 32, 8);
        api.sfx.tick(r * 3 + (ok ? 4 : 0));
        await kit.wait(360);
      }
      return firstBad;
    }
    async function couplePass() {
      gap = 50;
      for (let k = 0; k < 7; k++) {
        gap = Math.max(0, 50 - k * 9);
        drawTrains(false);
        await kit.wait(60);
      }
      kit.burst(EX - 38, 372, GOOD, 18);
      kit.tween({ targets: locoA, x: 430, duration: 700, ease: "Sine.easeIn" });
    }
    return {
      checkLabel: L("Couple the trains", "Acoplar los trenes"),
      actions: [
        {
          key: "ArrowRight",
          label: L("Next box →", "Casilla siguiente →"),
          run: () => {
            sel = (sel + 1) % nBlank;
            draw();
            api.refresh();
          },
        },
        {
          key: "ArrowLeft",
          label: L("← Previous box", "← Casilla anterior"),
          run: () => {
            sel = (sel + nBlank - 1) % nBlank;
            draw();
            api.refresh();
          },
        },
        { key: "s", label: L("Switch + / −", "Cambiar + / −"), run: flip },
        {
          key: "Backspace",
          label: L("Erase digit", "Borrar dígito"),
          run: () => type("Backspace"),
        },
      ],
      status: () =>
        L(
          `Your train: ${EM.formText(pb.form, values(), sign)}`,
          `Tu tren: ${EM.formText(pb.form, values(), sign)}`,
        ),
      get hints() {
        const P = pb.params;
        if (variant === "factor")
          return [
            L(
              `Find a number that divides BOTH ${P.A} and ${P.B}. It goes outside the ( ).`,
              `Busca un número que divida a ${P.A} y a ${P.B}. Ese número va fuera de los ( ).`,
            ),
            L(
              `${P.A} and ${P.B} are both in the ${P.g} times table. Divide each term by ${P.g}.`,
              `${P.A} y ${P.B} están en la tabla del ${P.g}. Divide cada término entre ${P.g}.`,
            ),
          ];
        if (variant === "expand")
          return [
            L(
              "The number outside the ( ) multiplies EVERY term inside: the x term and the number.",
              "El número fuera de los ( ) multiplica CADA término de adentro: el término con x y el número.",
            ),
            P.c != null
              ? L(
                  `Multiply ${P.a} × ${P.c}x for the x term. Then multiply ${P.a} × ${P.b} for the number.`,
                  `Multiplica ${P.a} × ${P.c}x para el término con x. Luego ${P.a} × ${P.b} para el número.`,
                )
              : L(
                  `${P.a} × x = ${P.a}x. Now multiply ${P.a} by ${P.b} too.`,
                  `${P.a} × x = ${P.a}x. Ahora multiplica ${P.a} por ${P.b} también.`,
                ),
          ];
        if (pb.form === "fac1")
          return [
            L(
              "Every train is the same. Write ONE train in ( ), then put the number of trains in front.",
              "Todos los trenes son iguales. Escribe UN tren en ( ) y pon el número de trenes delante.",
            ),
            L(
              "One train has x passenger cars plus its mail cars. How many trains are there?",
              "Un tren tiene x vagones de pasajeros más sus vagones de correo. ¿Cuántos trenes hay?",
            ),
          ];
        return [
          L(
            "The amount that repeats for EACH car goes with x. An amount that happens once is the number alone.",
            "La cantidad que se repite en CADA vagón va con x. Una cantidad que pasa una sola vez es el número solo.",
          ),
          L(
            `${P.p} for each of x cars is ${P.p}x. Then decide: does the ${P.q} add or take away?`,
            `${P.p} por cada uno de x vagones es ${P.p}x. Luego decide: ¿el ${P.q} se suma o se resta?`,
          ),
        ];
      },
      async check() {
        if (ents.some((e) => e.value == null))
          return {
            ok: false,
            incomplete: true,
            feedback: L("Fill every box first.", "Primero completa todas las casillas."),
          };
        const e = values();
        const res = EM.judgeCouple(pb, e, sign);
        const bad = await testRuns(e);
        if (res.ok) {
          await couplePass();
          return { ok: true };
        }
        drawTrains(true);
        kit.shake(0.004, 160);
        const x = bad >= 0 ? pb.xs[bad] : pb.xs[0];
        const run =
          bad >= 0
            ? L(
                `The coupling snaps at x = ${x}: ${fmt(EM.formValue(pb.form, e, sign, x))} is not ${fmt(EM.sourceValue(pb, x))}.`,
                `El enganche se rompe con x = ${x}: ${fmt(EM.formValue(pb.form, e, sign, x))} no es ${fmt(EM.sourceValue(pb, x))}.`,
              )
            : L("The trains match, but", "Los trenes coinciden, pero");
        const why = {
          firstOnly:
            variant === "factor"
              ? L(
                  "You divided only one term. Divide BOTH terms by the number outside.",
                  "Dividiste solo un término. Divide AMBOS términos entre el número de afuera.",
                )
              : L(
                  "The number outside ( ) must multiply BOTH terms inside.",
                  "El número fuera de ( ) debe multiplicar AMBOS términos de adentro.",
                ),
          addInstead: L(
            "You added numbers. Here the numbers MULTIPLY.",
            "Sumaste números. Aquí los números se MULTIPLICAN.",
          ),
          subtractInstead: L(
            "You subtracted. To factor, DIVIDE each term by the number outside.",
            "Restaste. Para factorizar, DIVIDE cada término entre el número de afuera.",
          ),
          sign: L(
            "Check the sign: does that amount add or take away?",
            "Revisa el signo: ¿esa cantidad se suma o se resta?",
          ),
          swapped: L(
            "You switched the two numbers. The amount for EACH car goes with x.",
            "Cambiaste los dos números. La cantidad de CADA vagón va con x.",
          ),
          doubleCount: L(
            "Inside the ( ) is ONE train. Put only one train's mail cars there.",
            "Dentro de ( ) va UN tren. Pon ahí solo los vagones de correo de un tren.",
          ),
          trivialFactor: L(
            "a 1 outside the ( ) does not factor anything. Use a number bigger than 1.",
            "un 1 fuera de los ( ) no factoriza nada. Usa un número mayor que 1.",
          ),
          notEquivalent: L(
            "Equal trains carry the same cargo for EVERY x.",
            "Los trenes iguales llevan la misma carga para CADA x.",
          ),
        }[res.tag];
        return {
          ok: false,
          misconception: res.tag,
          feedback: L(run.en + " " + why.en, run.es + " " + why.es),
        };
      },
      async demo() {
        const P = pb.params;
        sign = pb.sign;
        const notes = {
          expand: [P.c != null ? `${P.a} × ${P.c}x` : `${P.a} × x`, `${P.a} × ${P.b}`],
          factor: [`÷ ${P.g}`, `${P.A} ÷ ${P.g}`, `${P.B} ÷ ${P.g}`],
          words:
            pb.form === "fac1"
              ? [L("trains", "trenes"), L("mail cars", "correo")]
              : [L("each car", "cada vagón"), L("once", "una vez")],
        }[variant];
        for (let i = 0; i < nBlank; i++) {
          sel = i;
          ents[i].text = String(pb.answer[i]);
          draw();
          kit.floatText(220, 238, api.t(notes[i] || ""), "#ffd76a", 18);
          api.sfx.tick(i * 4);
          await kit.wait(900);
        }
        await testRuns(pb.answer);
        await couplePass();
      },
      explain: () => {
        const mine = EM.formText(pb.form, pb.answer, pb.sign);
        if (variant === "words")
          return L(
            `The route card is ${mine}: the amount for each car goes with x, a one-time amount stands alone.`,
            `La tarjeta de ruta es ${mine}: la cantidad de cada vagón va con x y la cantidad de una sola vez va sola.`,
          );
        const left = variant === "factor" ? mine : pb.source;
        const right = variant === "factor" ? pb.source : mine;
        return L(
          `${left} = ${right}: the same cargo for every x (tested at x = ${pb.xs.join(", ")}).`,
          `${left} = ${right}: la misma carga para cada x (probado con x = ${pb.xs.join(", ")}).`,
        );
      },
    };
  }

  /* ── merge: combine like terms into a short train ────────────────────── */
  const KIND_NAME = { x2: L("x²", "x²"), x: L("x", "x"), c: L("number", "número") };
  function merge(scene, api) {
    const { kit, rng } = api;
    const pb = EM.genMerge(rng, api.tier);
    const ents = pb.kinds.map(() => entry(2));
    let sel = 0;
    const shown = pb.kinds.map(() => null);
    api.setBrief(
      pb.tier >= 3
        ? L(
            `Long train: ${pb.text}. Distribute, then combine like terms into a short train.`,
            `Tren largo: ${pb.text}. Distribuye y luego combina términos semejantes en un tren corto.`,
          )
        : L(
            `Long train: ${pb.text}. Combine like terms: each kind of cargo rides in its own big car.`,
            `Tren largo: ${pb.text}. Combina términos semejantes: cada tipo de carga va en su propio vagón grande.`,
          ),
    );
    kit.panel(20, 140, 780, 104, { fill: PANEL, alpha: 0.9 });
    kit.text(36, 156, api.t(L("LONG TRAIN", "TREN LARGO")), 13, "#ffd76a", {
      ox: 0,
      weight: "800",
    });
    const longG = scene.add.graphics().setDepth(21);
    drawRails(longG, 30, 790, 226);
    const n = pb.terms.length;
    const widths = pb.terms.map((t) => (t.k === "group" ? 150 : 96));
    const total = widths.reduce((s, w) => s + w + 12, -12);
    let cx = 410 - total / 2;
    const termPos = pb.terms.map((t, i) => {
      const w = widths[i];
      const x = cx + w / 2;
      const col = t.k === "group" ? 0x8a5a7a : KIND[t.k];
      drawCar(longG, x, 178, w, 36, kit.mix(col, 0x000000, 0.35));
      longG.lineStyle(2, col, 1).strokeRoundedRect(x - w / 2, 178, w, 36, 8);
      kit.text(x, 196, EM.termText(t, i === 0), 19, "#ffffff", { weight: "900", depth: 23 });
      cx += w + 12;
      return x;
    });
    // Short train: one big car per kind.
    kit.panel(20, 252, 780, 160, { fill: PANEL, alpha: 0.88 });
    kit.text(36, 268, api.t(L("SHORT TRAIN", "TREN CORTO")), 13, "#ffd76a", {
      ox: 0,
      weight: "800",
    });
    const k = pb.kinds.length;
    const SX = k === 2 ? [300, 540] : [220, 420, 620];
    const SW = 170;
    const shortG = scene.add.graphics().setDepth(21);
    const load = scene.add.graphics().setDepth(22);
    drawRails(shortG, 60, 780, 384);
    const vals = SX.map((x) => kit.text(x, 330, "", 26, "#ffe9a8", { weight: "900", depth: 23 }));
    const plus = SX.slice(1).map((x, i) =>
      kit.text((x + SX[i]) / 2, 330, "+", 26, "#ffffff", { weight: "900", depth: 23 }),
    );
    SX.forEach((x, i) => {
      const z = scene.add.zone(x, 330, SW, 80).setInteractive({ useHandCursor: true }).setDepth(24);
      z.on("pointerdown", () => {
        sel = i;
        api.sfx.select();
        draw();
        api.refresh();
      });
    });
    kit.keypad(34, 448, (key) => key !== "Backspace" && type(key), {
      size: 40,
      gap: 4,
      keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    });
    kit.button(504, 448, 56, 40, "⌫", () => type("Backspace"), {
      size: 18,
      fill: 0x2f4b5c,
      color: "#eaf6ff",
    });
    const suffix = { x2: "x²", x: "x", c: "" };
    function draw() {
      shortG.clear();
      drawRails(shortG, 60, 780, 384);
      load.clear();
      SX.forEach((x, i) => {
        const st = shown[i];
        const kind = pb.kinds[i];
        const col = st
          ? st.ok
            ? 0x3f6b4f
            : st.over
              ? 0x7a3a2c
              : 0x5a4a3a
          : kit.mix(KIND[kind], 0x000000, 0.5);
        drawCar(shortG, x, 300, SW, 60, col, {
          sink: st && st.over ? 6 : 0,
          springs: st && st.over ? BAD : undefined,
        });
        shortG
          .lineStyle(i === sel ? 4 : 2, i === sel ? BRASS : KIND[kind], 1)
          .strokeRoundedRect(x - SW / 2 - 3, 297, SW + 6, 66, 10);
        vals[i].setText((ents[i].text || (i === sel ? "▮" : "?")) + suffix[kind]);
        if (st && st.over)
          for (let b = 0; b < 4; b++)
            load.fillStyle(BAD, 1).fillRect(x - 40 + b * 22, 284 - (b % 2) * 8, 18, 14);
      });
      plus.forEach((p) => p.setVisible(true));
    }
    function type(key) {
      if (!ents[sel].type(key)) return;
      shown[sel] = null;
      api.sfx.tap();
      draw();
      api.refresh();
    }
    kit.onType((key) => key !== "Backspace" && type(key));
    draw();
    async function sendCars(e) {
      // Each long-train car glides down to the big car of its kind.
      for (let i = 0; i < n; i++) {
        const t = pb.terms[i];
        const target = t.k === "group" ? SX[0] : SX[pb.kinds.indexOf(t.k)];
        const dot = scene.add
          .image(termPos[i], 196, "ewl-glow")
          .setDisplaySize(40, 40)
          .setTint(t.k === "group" ? COPPER : KIND[t.k])
          .setDepth(30);
        kit.tween({
          targets: dot,
          x: target,
          y: 320,
          alpha: 0.2,
          duration: 420,
          onComplete: () => dot.destroy(),
        });
        api.sfx.tick(i * 2);
        await kit.wait(200);
      }
      await kit.wait(300);
      let bad = -1;
      pb.kinds.forEach((_, i) => {
        // Over = more cargo arrived than the number on the car: overloaded.
        shown[i] = { ok: e[i] === pb.answer[i], over: pb.answer[i] > e[i] };
        if (!shown[i].ok && bad < 0) bad = i;
      });
      draw();
      return bad;
    }
    function listOf(kind) {
      return pb.terms
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => t.k === kind)
        .map(({ t, i }) => EM.termText(t, i === 0).replace(/^\+ /, ""))
        .join(", ");
    }
    return {
      checkLabel: L("Couple the short train", "Acoplar el tren corto"),
      actions: [
        {
          key: "ArrowRight",
          label: L("Next big car →", "Vagón grande siguiente →"),
          run: () => {
            sel = (sel + 1) % k;
            draw();
            api.refresh();
          },
        },
        {
          key: "ArrowLeft",
          label: L("← Previous big car", "← Vagón grande anterior"),
          run: () => {
            sel = (sel + k - 1) % k;
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
      status: () => {
        const s = pb.kinds.map((kind, i) => (ents[i].text || "?") + suffix[kind]).join(" + ");
        return L(`Short train: ${s}`, `Tren corto: ${s}`);
      },
      get hints() {
        if (pb.tier >= 3) {
          const P = pb.params;
          return [
            L(
              "First distribute: the number outside ( ) multiplies both terms inside. Then combine like terms.",
              "Primero distribuye: el número fuera de ( ) multiplica los dos términos de adentro. Luego combina términos semejantes.",
            ),
            L(
              `${P.a}(x + ${P.b}) = ${P.a}x + ${P.a} × ${P.b}. Now add the other x term and the other number.`,
              `${P.a}(x + ${P.b}) = ${P.a}x + ${P.a} × ${P.b}. Ahora suma el otro término con x y el otro número.`,
            ),
          ];
        }
        const parts = pb.kinds
          .filter((kind) => kind !== "c")
          .map((kind) => `${api.t(KIND_NAME[kind])}: ${listOf(kind)}`)
          .join(" · ");
        return [
          L(
            "Like terms have the same letter part: x² with x², x with x, numbers with numbers. Add the numbers in front of each kind.",
            "Los términos semejantes tienen la misma parte con letra: x² con x², x con x, números con números. Suma los números de adelante de cada tipo.",
          ),
          L(
            `${parts}. A lone x counts as 1x, and a − term is taken away.`,
            `${parts}. Una x sola cuenta como 1x, y un término con − se resta.`,
          ),
        ];
      },
      async check() {
        if (ents.some((en) => en.value == null))
          return {
            ok: false,
            incomplete: true,
            feedback: L("Fill every big car first.", "Primero completa todos los vagones grandes."),
          };
        const e = ents.map((en) => en.value);
        const res = EM.judgeMerge(pb, e);
        const bad = await sendCars(e);
        if (res.ok) {
          SX.forEach((x) => kit.burst(x, 320, GOOD, 12));
          return { ok: true };
        }
        kit.shake(0.004, 160);
        const name = api.t(KIND_NAME[pb.kinds[bad]]);
        const state = shown[bad].over
          ? L(`The ${name} car is overloaded.`, `El vagón de ${name} está sobrecargado.`)
          : L(`The ${name} car runs half empty.`, `El vagón de ${name} va medio vacío.`);
        const why = {
          unlike: L(
            "Unlike cargo was mixed: x terms and plain numbers are different. Only combine like terms.",
            "Se mezcló carga distinta: los términos con x y los números solos son diferentes. Combina solo términos semejantes.",
          ),
          unlikePower: L(
            "x² cargo went into the x car. x² and x are not like terms.",
            "Carga de x² entró al vagón de x. x² y x no son términos semejantes.",
          ),
          sign: L(
            "A − term was added. A − in front means take that term away.",
            "Se sumó un término con −. Un − delante significa restar ese término.",
          ),
          loneX: L(
            "A lone x counts as 1x. It still adds one to the x car.",
            "Una x sola cuenta como 1x. También suma uno al vagón de x.",
          ),
          firstOnly: L(
            "The number outside ( ) must multiply BOTH terms inside before you combine.",
            "El número fuera de ( ) debe multiplicar AMBOS términos antes de combinar.",
          ),
          count: L(
            `Recount the ${name} terms in the long train.`,
            `Vuelve a contar los términos de ${name} en el tren largo.`,
          ),
        }[res.tag];
        return {
          ok: false,
          misconception: res.tag,
          feedback: L(state.en + " " + why.en, state.es + " " + why.es),
        };
      },
      async demo() {
        if (pb.tier >= 3) {
          const P = pb.params;
          kit.floatText(termPos[0], 160, `${P.a}x + ${P.a * P.b}`, "#ffd76a", 20);
          await kit.wait(1000);
        }
        for (let i = 0; i < k; i++) {
          sel = i;
          ents[i].text = String(pb.answer[i]);
          shown[i] = null;
          draw();
          kit.floatText(SX[i], 290, `${pb.answer[i]}${suffix[pb.kinds[i]]}`, "#ffd76a", 20);
          api.sfx.tick(i * 4);
          await kit.wait(800);
        }
        await sendCars(pb.answer);
      },
      explain: () => {
        const short = pb.kinds.map((kind, i) => `${pb.answer[i]}${suffix[kind]}`).join(" + ");
        return L(
          `${pb.text} = ${short}. Only like terms combine: x² with x², x with x, numbers with numbers.`,
          `${pb.text} = ${short}. Solo se combinan términos semejantes: x² con x², x con x, números con números.`,
        );
      },
    };
  }

  Object.assign(M, { couple, merge });
})();
