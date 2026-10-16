/* Bridgekeepers — inequality and story missions for the Equation Quest expedition.
 *   weightgate  a weight-limit gate on a number line: set the boundary, open or closed
 *               endpoint, and the safe direction; test carts roll and show what it let in
 *   plaque      carve the equation or inequality for a crossing story (and solve it)
 * Rules come from expedition-math.js (window.EQ_MISSIONS).
 */
(function () {
  "use strict";
  const M = window.EQ_MISSIONS;
  if (!window.EWLExpedition || !M || !M.genGate || !M.textPool) return;
  const { L, PANEL } = M;

  /* ── weightgate: graph the safe weights of an inequality ──────────────── */
  function weightgate(scene, api) {
    const { kit, rng } = api;
    const variant = api.mission.variant || "represent";
    const pz = M.genGate(rng, variant, api.tier);
    const g0 = { v: pz.start, closed: false, right: true, touched: false };
    const gs = { ...g0 };
    const X0 = 86;
    const X1 = 734;
    const LY = 372;
    const step = (X1 - X0) / (pz.hi - pz.lo);
    const xOf = (v) => X0 + (v - pz.lo) * step;
    api.setBrief(
      variant === "represent"
        ? L(
            "Read the sign. Shade every safe weight on the number line, then test the gate.",
            "Lee el letrero. Sombrea todos los pesos seguros en la recta numérica y prueba la reja.",
          )
        : L(
            `The gate holds only for values that make ${pz.sentence} true. Solve it, then shade those values.`,
            `La reja aguanta solo con valores que hacen verdadera ${pz.sentence}. Resuélvela y sombrea esos valores.`,
          ),
    );
    kit.panel(24, 140, 772, 74, { fill: PANEL, alpha: 0.92, line: 0xffd76a });
    if (variant === "represent")
      kit.text(410, 177, api.t(pz.story), 16, "#ffe9a8", { weight: "800", depth: 21, wrap: 740 });
    else kit.text(410, 177, pz.sentence, 34, "#ffe9a8", { weight: "900", depth: 21 });

    const deck = scene.add.graphics().setDepth(20);
    const line = scene.add.graphics().setDepth(22);
    const carts = scene.add.graphics().setDepth(24);
    const tickLabels = [];
    for (let v = pz.lo; v <= pz.hi; v++)
      tickLabels.push(
        kit.text(xOf(v), LY + 24, String(v), 12, v % 5 === 0 ? "#ffffff" : "#a9a2cf", {
          weight: v % 5 === 0 ? "900" : "700",
          depth: 23,
        }),
      );
    const cartLabels = M.textPool(kit, 12, "#1b1830", 26);
    const readout = kit.text(410, 236, "", 18, "#f1ecff", { weight: "900", depth: 23 });

    // Gate towers and the span the carts cross.
    deck
      .fillStyle(0x2b2443, 1)
      .fillRect(X0 - 60, 268, 40, 80)
      .fillRect(X1 + 22, 268, 40, 80);
    deck
      .fillStyle(0x4b4470, 1)
      .fillRect(X0 - 64, 260, 48, 12)
      .fillRect(X1 + 18, 260, 48, 12);
    deck.fillStyle(0x6b4f33, 1).fillRect(X0 - 20, 326, X1 - X0 + 44, 10);
    deck.lineStyle(2, 0xa8865c, 1).lineBetween(X0 - 20, 326, X1 + 24, 326);

    // Controls.
    const by = 444;
    kit.button(120, by, 64, 40, "◀", () => move(-1), {
      size: 18,
      fill: 0x3a3160,
      color: "#f1ecff",
    });
    kit.button(196, by, 64, 40, "▶", () => move(1), { size: 18, fill: 0x3a3160, color: "#f1ecff" });
    const endBtn = kit.button(350, by, 200, 40, "", () => toggleEnd(), { size: 15 });
    const dirBtn = kit.button(570, by, 200, 40, "", () => flip(), { size: 15 });
    const z = scene.add
      .zone(410, LY, X1 - X0 + 30, 60)
      .setInteractive({ useHandCursor: true })
      .setDepth(25);
    z.on("pointerdown", (p) => {
      gs.v = Phaser.Math.Clamp(Math.round(pz.lo + (p.x - X0) / step), pz.lo, pz.hi);
      gs.touched = true;
      api.sfx.tick(gs.v % 12);
      draw();
      api.refresh();
    });

    function graphText() {
      const rel = gs.right ? (gs.closed ? "≥" : ">") : gs.closed ? "≤" : "<";
      return "x " + rel + " " + gs.v;
    }
    function draw() {
      line.clear();
      line.lineStyle(4, 0xc8b9ff, 1).lineBetween(X0 - 18, LY, X1 + 18, LY);
      line.fillStyle(0xc8b9ff, 1);
      line.fillTriangle(X0 - 26, LY, X0 - 14, LY - 7, X0 - 14, LY + 7);
      line.fillTriangle(X1 + 26, LY, X1 + 14, LY - 7, X1 + 14, LY + 7);
      for (let v = pz.lo; v <= pz.hi; v++)
        line.lineStyle(2, 0xc8b9ff, 0.8).lineBetween(xOf(v), LY - 7, xOf(v), LY + 7);
      // Shaded ray.
      const x = xOf(gs.v);
      const end = gs.right ? X1 + 18 : X0 - 18;
      line.lineStyle(10, 0xffd76a, 0.9).lineBetween(x, LY, end, LY);
      line.fillStyle(0xffd76a, 1);
      if (gs.right) line.fillTriangle(X1 + 30, LY, X1 + 14, LY - 11, X1 + 14, LY + 11);
      else line.fillTriangle(X0 - 30, LY, X0 - 14, LY - 11, X0 - 14, LY + 11);
      line.fillStyle(gs.closed ? 0xffd76a : 0x120e26, 1).fillCircle(x, LY, 11);
      line.lineStyle(4, 0xffd76a, 1).strokeCircle(x, LY, 11);
      endBtn.setLabel(
        gs.closed
          ? api.t(L("● Closed: includes it", "● Cerrado: lo incluye"))
          : api.t(L("○ Open: leaves it out", "○ Abierto: lo deja fuera")),
      );
      dirBtn.setLabel(
        gs.right
          ? api.t(L("Shade → bigger", "Sombrear → mayores"))
          : api.t(L("Shade ← smaller", "Sombrear ← menores")),
      );
      readout.setText(api.t(L("Your graph: ", "Tu gráfica: ")) + graphText());
    }
    function move(d) {
      gs.v = Phaser.Math.Clamp(gs.v + d, pz.lo, pz.hi);
      gs.touched = true;
      api.sfx.tick(gs.v % 12);
      draw();
      api.refresh();
    }
    function toggleEnd() {
      gs.closed = !gs.closed;
      gs.touched = true;
      api.sfx.select();
      draw();
      api.refresh();
    }
    function flip() {
      gs.right = !gs.right;
      gs.touched = true;
      api.sfx.select();
      draw();
      api.refresh();
    }
    draw();

    /** Roll test carts: only carts your graph lets in cross; unsafe ones crack the span. */
    async function rollCarts() {
      carts.clear();
      cartLabels.reset();
      const tests = [pz.t - 3, pz.t - 1, pz.t, pz.t + 1, pz.t + 3].filter(
        (v) => v >= pz.lo && v <= pz.hi,
      );
      const truth = (v) =>
        M.inGraph({ v: pz.t, closed: M.closedRel(pz.rel), right: M.pointsRight(pz.rel) }, v);
      let broke = false;
      for (const v of tests) {
        const x = xOf(v);
        const inside = M.inGraph(gs, v);
        const y = inside ? 306 : 290;
        carts.fillStyle(0x000000, 0.35).fillRoundedRect(x - 15, y - 9, 30, 22, 5);
        carts.fillStyle(inside ? 0xb9a7ff : 0x5d567f, 1).fillRoundedRect(x - 15, y - 12, 30, 22, 5);
        carts
          .fillStyle(0x2b2443, 1)
          .fillCircle(x - 8, y + 11, 4)
          .fillCircle(x + 8, y + 11, 4);
        cartLabels.put(x, y - 1, String(v));
        if (inside && !truth(v)) {
          broke = true;
          carts.lineStyle(3, 0xff6b5a, 1);
          carts.lineBetween(x - 10, 324, x + 2, 338);
          carts.lineBetween(x + 2, 338, x - 4, 350);
          kit.shake(0.003, 120);
          api.sfx.miss();
        } else api.sfx.tick(v % 12);
        await kit.wait(240);
      }
      cartLabels.done();
      return broke;
    }

    const hintStep =
      variant === "represent"
        ? L(
            `The boundary is ${pz.t}. Ask: does ${pz.t} itself count? Then shade the side that is safe.`,
            `El límite es ${pz.t}. Pregunta: ¿cuenta el ${pz.t}? Luego sombrea el lado seguro.`,
          )
        : {
            plus: () => {
              const [, b] = pz.sentence.match(/\+ (\d+)/);
              return L(
                `Take ${b} away from BOTH sides. The boundary is the result. Keep the same sign.`,
                `Quita ${b} de LOS DOS lados. El límite es el resultado. Deja el mismo signo.`,
              );
            },
            minus: () => {
              const [, b] = pz.sentence.match(/− (\d+)/);
              return L(
                `Add ${b} to BOTH sides. The boundary is the result. Keep the same sign.`,
                `Suma ${b} a LOS DOS lados. El límite es el resultado. Deja el mismo signo.`,
              );
            },
            times: () => {
              const [, a] = pz.sentence.match(/^(\d+)x/);
              return L(
                `Divide BOTH sides by ${a}. The boundary is the result. Keep the same sign.`,
                `Divide LOS DOS lados entre ${a}. El límite es el resultado. Deja el mismo signo.`,
              );
            },
            div: () => {
              const [, k] = pz.sentence.match(/÷ (\d+)/);
              return L(
                `Multiply BOTH sides by ${k}. The boundary is the result. Keep the same sign.`,
                `Multiplica LOS DOS lados por ${k}. El límite es el resultado. Deja el mismo signo.`,
              );
            },
          }[pz.form]();

    return {
      checkLabel: L("Test the gate", "Probar la reja"),
      actions: [
        { key: "ArrowRight", label: L("Boundary +1", "Límite +1"), run: () => move(1) },
        { key: "ArrowLeft", label: L("Boundary −1", "Límite −1"), run: () => move(-1) },
        {
          key: " ",
          label: L("Open / closed endpoint", "Extremo abierto / cerrado"),
          run: () => toggleEnd(),
        },
        {
          key: "ArrowUp",
          label: L("Shade toward bigger numbers", "Sombrear hacia los mayores"),
          run: () => {
            if (!gs.right) flip();
          },
        },
        {
          key: "ArrowDown",
          label: L("Shade toward smaller numbers", "Sombrear hacia los menores"),
          run: () => {
            if (gs.right) flip();
          },
        },
      ],
      status: () =>
        L(
          `Your graph: ${graphText()} (${gs.closed ? "closed" : "open"} circle, shaded ${gs.right ? "right" : "left"}).`,
          `Tu gráfica: ${graphText()} (círculo ${gs.closed ? "cerrado" : "abierto"}, sombreado a la ${gs.right ? "derecha" : "izquierda"}).`,
        ),
      hints: [
        variant === "represent"
          ? L(
              "Key words: AT MOST means ≤ and AT LEAST means ≥ (the number counts: closed circle). LESS THAN is <, MORE THAN is > (it does not count: open circle).",
              "Palabras clave: COMO MÁXIMO es ≤ y AL MENOS es ≥ (el número cuenta: círculo cerrado). MENOS DE es <, MÁS DE es > (no cuenta: círculo abierto).",
            )
          : L(
              "Solve it like an equation: undo what is done to x on BOTH sides. Then graph: open circle for < or >, closed for ≤ or ≥.",
              "Resuélvela como una ecuación: deshaz lo que se le hace a x en LOS DOS lados. Luego grafica: círculo abierto para < o >, cerrado para ≤ o ≥.",
            ),
        hintStep,
      ],
      async check() {
        const res = M.judgeGate(pz, gs);
        if (res.incomplete)
          return {
            ok: false,
            incomplete: true,
            feedback: L(
              "Set the gate first: move the boundary, choose open or closed, and pick a direction.",
              "Primero ajusta la reja: mueve el límite, elige abierto o cerrado y escoge una dirección.",
            ),
          };
        const broke = await rollCarts();
        if (res.ok) {
          kit.burst(410, 300, kit.accent, 26);
          return { ok: true };
        }
        if (!broke) kit.shake(0.003, 140);
        const fb = {
          flipped: L(
            "The gate slammed: your shading points the wrong way. Do the safe values sit above or below the boundary?",
            "La reja se cerró de golpe: tu sombreado apunta al lado equivocado. ¿Los valores seguros están arriba o abajo del límite?",
          ),
          endpoint: L(
            "Your boundary is right, but check the circle: does the sign include the boundary itself?",
            "Tu límite es correcto, pero revisa el círculo: ¿el signo incluye el límite mismo?",
          ),
          sameOp: L(
            "Your boundary came from doing the same operation instead of the opposite. Undo what is done to x.",
            "Tu límite salió de hacer la misma operación en vez de la opuesta. Deshaz lo que se le hace a x.",
          ),
          boundary: L(
            `The gate did not hold: ${gs.v} is not the boundary. ${variant === "represent" ? "Use the number from the sign." : "The boundary is the value that makes both sides equal."}`,
            `La reja no aguantó: ${gs.v} no es el límite. ${variant === "represent" ? "Usa el número del letrero." : "El límite es el valor que hace iguales los dos lados."}`,
          ),
        }[res.tag];
        return { ok: false, misconception: res.tag, feedback: fb };
      },
      async demo() {
        gs.touched = true;
        while (gs.v !== pz.t) {
          gs.v += gs.v < pz.t ? 1 : -1;
          draw();
          api.sfx.tick(gs.v % 12);
          await kit.wait(120);
        }
        kit.floatText(xOf(pz.t), LY - 40, String(pz.t), "#ffd76a", 20);
        await kit.wait(400);
        gs.closed = M.closedRel(pz.rel);
        draw();
        await kit.wait(380);
        gs.right = M.pointsRight(pz.rel);
        draw();
        await kit.wait(380);
        await rollCarts();
      },
      explain: () => {
        const sol = "x " + pz.rel + " " + pz.t;
        return L(
          `${variant === "solve" ? pz.sentence + " means " : ""}${sol}: ${M.closedRel(pz.rel) ? "a closed" : "an open"} circle at ${pz.t}, shaded ${M.pointsRight(pz.rel) ? "right" : "left"}.`,
          `${variant === "solve" ? pz.sentence + " significa " : ""}${sol}: círculo ${M.closedRel(pz.rel) ? "cerrado" : "abierto"} en ${pz.t}, sombreado a la ${M.pointsRight(pz.rel) ? "derecha" : "izquierda"}.`,
        );
      },
    };
  }

  /* ── plaque: write the sentence for a crossing story ──────────────────── */
  function plaque(scene, api) {
    const { kit, rng } = api;
    const variant = api.mission.variant || "eq";
    const pz = M.genStory(rng, variant, api.tier);
    const sn = { a: null, op: null, b: null, rel: null, r: null };
    let answer = "";
    const SLOTS = ["a", "op", "b", "rel", "r"];
    const slotCount = pz.solve ? 6 : 5;
    let sel = 0;
    let typedSlot = -1;
    const OPS = ["+", "−", "×", "÷", ""];
    const tokens = ["x", ...pz.numbers];
    const SX = [168, 272, 376, 480, 584];
    const SY = 284;
    api.setBrief(
      pz.solve
        ? L(
            "Carve the equation for this crossing story on the plaque. Then solve it: what is x?",
            "Talla la ecuación de esta historia en la placa. Luego resuélvela: ¿cuánto vale x?",
          )
        : variant === "ineq"
          ? L(
              "Carve the inequality for this story on the plaque. The bridge only trusts a true rule.",
              "Talla la desigualdad de esta historia en la placa. El puente solo confía en una regla verdadera.",
            )
          : L(
              "Carve the equation for this story on the plaque. The bridge only trusts a true rule.",
              "Talla la ecuación de esta historia en la placa. El puente solo confía en una regla verdadera.",
            ),
    );
    kit.panel(24, 140, 772, 80, { fill: PANEL, alpha: 0.92, line: 0xffd76a });
    kit.text(410, 180, api.t(pz.story), 16, "#ffe9a8", { weight: "800", depth: 21, wrap: 744 });
    const plate = scene.add.graphics().setDepth(20);
    const slotsG = scene.add.graphics().setDepth(21);
    const lanterns = scene.add.graphics().setDepth(21);
    const slotText = SX.map((x) =>
      kit.text(x, SY, "", 30, "#ffffff", { weight: "900", depth: 23 }),
    );
    const ansText = kit.text(470, 350, "", 26, "#ffffff", { weight: "900", depth: 23 });
    if (pz.solve) kit.text(374, 350, "x =", 26, "#cfc6ff", { weight: "900", depth: 23 });
    plate.fillStyle(0x2b2443, 1).fillRoundedRect(104, 238, 544, 92, 16);
    plate.lineStyle(3, 0x8e86c0, 1).strokeRoundedRect(104, 238, 544, 92, 16);
    kit.button(712, 258, 64, 40, "▲", () => cycle(1), { size: 18 });
    kit.button(712, 306, 64, 40, "▼", () => cycle(-1), {
      size: 18,
      fill: 0x3a3160,
      color: "#f1ecff",
    });
    kit.button(712, 356, 64, 40, "x", () => setX(), { size: 20, fill: 0x9d7dff });
    kit.keypad(150, 430, (k) => type(k), { size: 40 });
    SX.forEach((x, i) => {
      const zz = scene.add.zone(x, SY, 92, 70).setInteractive({ useHandCursor: true }).setDepth(25);
      zz.on("pointerup", () => {
        sel = i;
        typedSlot = -1;
        if (i === 1 || i === 3) cycle(1);
        draw();
        api.refresh();
      });
    });
    if (pz.solve) {
      const az = scene.add
        .zone(470, 350, 100, 50)
        .setInteractive({ useHandCursor: true })
        .setDepth(25);
      az.on("pointerup", () => {
        sel = 5;
        draw();
        api.refresh();
      });
    }
    let lit = 0;
    let cracked = false;
    function drawLanterns() {
      lanterns.clear();
      for (let i = 0; i < 6; i++) {
        const x = 140 + i * 94;
        lanterns.lineStyle(2, 0x5d567f, 1).lineBetween(x, 226, x, 236);
        lanterns.fillStyle(i < lit ? 0xffd76a : 0x3a3456, 1).fillCircle(x, 232, 6);
        if (i < lit) lanterns.fillStyle(0xffd76a, 0.25).fillCircle(x, 232, 13);
      }
      if (cracked) {
        lanterns.lineStyle(3, 0xff6b5a, 0.9);
        lanterns.lineBetween(300, 240, 330, 282);
        lanterns.lineBetween(330, 282, 312, 328);
        lanterns.lineBetween(520, 240, 506, 300);
      }
    }
    const show = (v) => (v == null ? "?" : String(v));
    function draw() {
      slotsG.clear();
      SLOTS.forEach((k, i) => {
        const dim = i === 2 && sn.op === "";
        const active = sel === i;
        slotsG
          .fillStyle(dim ? 0x1d1833 : 0x120e26, 1)
          .fillRoundedRect(SX[i] - 44, SY - 32, 88, 64, 10);
        slotsG.lineStyle(active ? 4 : 2, active ? 0xffd76a : 0x5d567f, 1);
        slotsG.strokeRoundedRect(SX[i] - 44, SY - 32, 88, 64, 10);
        const v = sn[k];
        slotText[i]
          .setText(dim ? "" : k === "op" && v === "" ? "·" : show(v))
          .setColor(v == null ? "#6f6894" : v === "x" ? "#c8b9ff" : "#ffffff");
      });
      if (pz.solve) {
        const active = sel === 5;
        slotsG.fillStyle(0x120e26, 1).fillRoundedRect(422, 324, 96, 52, 10);
        slotsG
          .lineStyle(active ? 4 : 2, active ? 0xffd76a : 0x5d567f, 1)
          .strokeRoundedRect(422, 324, 96, 52, 10);
        ansText
          .setText(answer === "" ? "?" : answer)
          .setColor(answer === "" ? "#6f6894" : "#ffffff");
      }
      drawLanterns();
    }
    function cycle(d) {
      if (sel === 5) return;
      const k = SLOTS[sel];
      if (k === "op") {
        const i = OPS.indexOf(sn.op);
        sn.op = OPS[(i + d + OPS.length + (i < 0 && d < 0 ? 1 : 0)) % OPS.length];
        if (sn.op === "") sn.b = null;
      } else if (k === "rel") {
        const i = M.RELS.indexOf(sn.rel);
        sn.rel = M.RELS[(i + d + M.RELS.length + (i < 0 && d < 0 ? 1 : 0)) % M.RELS.length];
      } else {
        if (k === "b" && sn.op === "") return;
        const i = tokens.indexOf(sn[k]);
        sn[k] = tokens[(i + d + tokens.length + (i < 0 && d < 0 ? 1 : 0)) % tokens.length];
      }
      typedSlot = -1;
      api.sfx.tick(sel * 2);
      draw();
      api.refresh();
    }
    function setX() {
      const k = SLOTS[sel];
      if (sel === 5 || k === "op" || k === "rel" || (k === "b" && sn.op === "")) return;
      sn[k] = "x";
      typedSlot = -1;
      api.sfx.tap();
      draw();
      api.refresh();
    }
    function type(key) {
      if (sel === 5) {
        if (key === "Backspace") answer = answer.slice(0, -1);
        else if (/^[0-9]$/.test(key) && answer.length < 3)
          answer = (answer + key).replace(/^0+(?=\d)/, "");
        else return;
        api.sfx.tap();
        draw();
        api.refresh();
        return;
      }
      const k = SLOTS[sel];
      if (k === "op" || k === "rel" || (k === "b" && sn.op === "")) return;
      if (key === "Backspace") {
        const s = typeof sn[k] === "number" ? String(sn[k]).slice(0, -1) : "";
        sn[k] = s === "" ? null : Number(s);
      } else if (/^[0-9]$/.test(key)) {
        const cur = typedSlot === sel && typeof sn[k] === "number" ? String(sn[k]) : "";
        if (cur.length >= 3) return;
        sn[k] = Number(cur + key);
        typedSlot = sel;
      } else return;
      api.sfx.tap();
      draw();
      api.refresh();
    }
    kit.onType(type);
    draw();

    async function light(n) {
      for (let i = lit; i < n; i++) {
        lit = i + 1;
        drawLanterns();
        api.sfx.tick(i * 2);
        await kit.wait(140);
      }
    }
    const hint2 = {
      add: L(
        `The cart starts at x and gains ${pz.target.b}. What does that total equal?`,
        `El carro empieza con x y gana ${pz.target.b}. ¿A qué es igual ese total?`,
      ),
      less: L(
        `Start with the block, x, then take ${pz.target.b} away. That equals the sack.`,
        `Empieza con el bloque, x, y quita ${pz.target.b}. Eso es igual al saco.`,
      ),
      gave: L(
        `Start with x lanterns, then take away the ${pz.target.b} she hung.`,
        `Empieza con x faroles y quita los ${pz.target.b} que colgó.`,
      ),
      times: L(
        `${pz.target.a} planks of x kg each is ${pz.target.a} × x.`,
        `${pz.target.a} tablones de x kg cada uno es ${pz.target.a} × x.`,
      ),
      share: L(
        `x is split into ${pz.target.b} equal parts: x ÷ ${pz.target.b}.`,
        `x se reparte en ${pz.target.b} partes iguales: x ÷ ${pz.target.b}.`,
      ),
      atMost: L(
        `AT MOST ${pz.target.r}: x can be ${pz.target.r} or less. Which sign says that?`,
        `COMO MÁXIMO ${pz.target.r}: x puede ser ${pz.target.r} o menos. ¿Qué signo dice eso?`,
      ),
      under: L(
        `LESS THAN ${pz.target.r}: x must be smaller, and ${pz.target.r} itself is not allowed.`,
        `MENOS DE ${pz.target.r}: x debe ser menor, y ${pz.target.r} no se permite.`,
      ),
      atLeast: L(
        `AT LEAST ${pz.target.r}: x can be ${pz.target.r} or more. Which sign says that?`,
        `AL MENOS ${pz.target.r}: x puede ser ${pz.target.r} o más. ¿Qué signo dice eso?`,
      ),
      over: L(
        `MORE THAN ${pz.target.r}: x must be bigger, and ${pz.target.r} itself is not enough.`,
        `MÁS DE ${pz.target.r}: x debe ser mayor, y ${pz.target.r} no basta.`,
      ),
      basket: L(
        `The total is ${pz.target.a} + x. It can be ${pz.target.r} or less.`,
        `El total es ${pz.target.a} + x. Puede ser ${pz.target.r} o menos.`,
      ),
    }[pz.kind];

    return {
      checkLabel: L("Light the plaque", "Encender la placa"),
      actions: [
        {
          key: "ArrowRight",
          label: L("Next slot →", "Casilla siguiente →"),
          run: () => {
            sel = (sel + 1) % slotCount;
            typedSlot = -1;
            draw();
            api.refresh();
          },
        },
        {
          key: "ArrowLeft",
          label: L("← Previous slot", "← Casilla anterior"),
          run: () => {
            sel = (sel + slotCount - 1) % slotCount;
            typedSlot = -1;
            draw();
            api.refresh();
          },
        },
        {
          key: "ArrowUp",
          label: L("Change this slot ▲", "Cambiar casilla ▲"),
          run: () => cycle(1),
        },
        {
          key: "ArrowDown",
          label: L("Change this slot ▼", "Cambiar casilla ▼"),
          run: () => cycle(-1),
        },
        { key: "x", label: L("Put x in this slot", "Poner x en esta casilla"), run: () => setX() },
      ],
      status: () =>
        L(
          `Plaque: ${M.sentenceString(sn)}${pz.solve ? `. x = ${answer || "?"}` : ""}. Slot ${sel + 1} selected.`,
          `Placa: ${M.sentenceString(sn)}${pz.solve ? `. x = ${answer || "?"}` : ""}. Casilla ${sel + 1} elegida.`,
        ),
      hints: [
        L(
          "Find x in the story. Find the action word (adds, less, each, shared, at most, at least…). Then find what it equals or what it must stay under or over." +
            (pz.solve ? " Solve with the opposite operation." : ""),
          "Halla x en la historia. Halla la palabra de acción (agrega, menos, cada, reparten, como máximo, al menos…). Luego halla a qué es igual o qué límite tiene." +
            (pz.solve ? " Resuelve con la operación opuesta." : ""),
        ),
        hint2,
      ],
      async check() {
        const res = M.judgeStory(pz, sn, answer);
        if (res.incomplete)
          return {
            ok: false,
            incomplete: true,
            feedback:
              res.tag === "noAnswer"
                ? L(
                    "Your rule is carved. Now type the value of x.",
                    "Tu regla está tallada. Ahora escribe el valor de x.",
                  )
                : L(
                    "Fill every slot on the plaque first. Use · in the middle slot when nothing is added to x.",
                    "Primero llena todas las casillas. Usa · en la casilla del medio si no se hace nada con x.",
                  ),
          };
        cracked = false;
        if (res.ok) {
          await light(6);
          kit.burst(376, 284, 0xffd76a, 26);
          return { ok: true };
        }
        await light(2);
        cracked = true;
        lit = 0;
        drawLanterns();
        kit.shake(0.003, 140);
        const fb = {
          relation:
            pz.target.rel === "="
              ? L(
                  "This story gives one exact amount, so the rule needs =.",
                  "Esta historia da una cantidad exacta, así que la regla necesita =.",
                )
              : L(
                  "This story allows many values, so the rule needs an inequality sign, not =.",
                  "Esta historia permite muchos valores, así que la regla necesita un signo de desigualdad, no =.",
                ),
          endpoint: L(
            "Check the words: does the number itself count? AT MOST and AT LEAST include it (≤, ≥). LESS THAN and MORE THAN do not (<, >).",
            "Revisa las palabras: ¿cuenta el número? COMO MÁXIMO y AL MENOS lo incluyen (≤, ≥). MENOS DE y MÁS DE no (<, >).",
          ),
          flipped: L(
            "Your sign points the wrong way. Read it aloud: must x be bigger or smaller than the number?",
            "Tu signo apunta al revés. Léelo en voz alta: ¿x debe ser mayor o menor que el número?",
          ),
          order: L(
            "Order matters with − and ÷. Your rule takes away or splits in the wrong order. Start with what the story starts with.",
            "El orden importa con − y ÷. Tu regla quita o reparte en el orden equivocado. Empieza con lo que empieza la historia.",
          ),
          lessThan: L(
            `"${pz.target.b} less than" means take ${pz.target.b} away. You added.`,
            `"${pz.target.b} menos que" significa quitar ${pz.target.b}. Tú sumaste.`,
          ),
          opWord: L(
            "Your operation does not match the action in the story. Find the action word again.",
            "Tu operación no coincide con la acción de la historia. Busca otra vez la palabra de acción.",
          ),
          numbers: L(
            "The plaque cracked: check your numbers. Use the numbers from the story, each in the right place.",
            "La placa se rompió: revisa tus números. Usa los números de la historia, cada uno en su lugar.",
          ),
          sameOp: L(
            `Your rule is right, but x = ${answer} does not fit. You did the same operation instead of the opposite.`,
            `Tu regla está bien, pero x = ${answer} no cumple. Hiciste la misma operación en vez de la opuesta.`,
          ),
          arith: L(
            `Your rule is right, but x = ${answer} does not fit. Put it back into your rule and check.`,
            `Tu regla está bien, pero x = ${answer} no cumple. Ponlo en tu regla y comprueba.`,
          ),
        }[res.tag];
        return { ok: false, misconception: res.tag, feedback: fb };
      },
      async demo() {
        const tg = pz.target;
        lit = 0;
        cracked = false;
        for (let i = 0; i < 5; i++) {
          sel = i;
          const k = SLOTS[i];
          sn[k] = k === "b" && tg.op === "" ? null : tg[k];
          draw();
          api.sfx.tick(i * 2);
          await kit.wait(320);
        }
        if (pz.solve) {
          sel = 5;
          answer = String(pz.s);
          draw();
          await kit.wait(320);
        }
        await light(6);
      },
      explain: () =>
        pz.solve
          ? L(
              `The story says ${M.sentenceString(pz.target)}. Undo the operation: x = ${pz.s}.`,
              `La historia dice ${M.sentenceString(pz.target)}. Deshaz la operación: x = ${pz.s}.`,
            )
          : L(
              `The story says ${M.sentenceString(pz.target)}.`,
              `La historia dice ${M.sentenceString(pz.target)}.`,
            ),
    };
  }

  window.EQ_MISSIONS = Object.assign(window.EQ_MISSIONS || {}, { weightgate, plaque });
})();
