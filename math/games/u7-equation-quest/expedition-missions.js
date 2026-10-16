/* Bridgekeepers — balance missions for the Equation Quest expedition.
 *   counterweight  a bridge counterweight is a balance scale: do the same inverse move to
 *                  BOTH pans until one x-crate stands alone, and the drawbridge lowers
 *   keystones      only stones that make the sentence TRUE fit the arch (solutions)
 * The pure rules live in expedition-math.js (window.EQ_MISSIONS); this file draws them.
 * A wrong move is shown, not just marked: a tipped beam, a bridge that stays up, a
 * stone that cracks with its own substitution written on it.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.EQ_MISSIONS;
  if (!X || !M || !M.genScale) return;
  const { L } = M;
  const CRATE = 0x9d7dff;
  const GOLD = 0xffc857;
  const BALLOON = 0xff8fb8;
  const STONE = 0x8b93a8;
  const PANEL = 0x120e26;
  const OK = 0x7ee3a0;
  const BAD = 0xff8a6b;

  /** Reusable text objects so redraws never leak Phaser objects. */
  function textPool(kit, size, color, depth) {
    const items = [];
    let used = 0;
    return {
      reset() {
        used = 0;
      },
      put(x, y, s, opts = {}) {
        if (!items[used])
          items[used] = kit.text(0, 0, "", size, color, { weight: "900", depth, ...opts });
        const t = items[used++];
        t.setPosition(x, y)
          .setText(s)
          .setVisible(true)
          .setColor(opts.color || color);
        return t;
      },
      done() {
        for (let i = used; i < items.length; i++) items[i].setVisible(false);
      },
    };
  }

  /** Gold weights: tall bars are 10s, small blocks are 1s. Width-limited. */
  function drawWeights(g, labels, cx, baseY, n, maxW) {
    if (n <= 0) return;
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    const width = tens * 13 + Math.ceil(ones / 3) * 13;
    if (width > maxW || n > 99) {
      g.fillStyle(0x7a5a2a, 1).fillRoundedRect(cx - 26, baseY - 44, 52, 44, 12);
      g.fillStyle(GOLD, 1).fillRoundedRect(cx - 22, baseY - 40, 44, 36, 10);
      labels.put(cx, baseY - 22, String(n), { color: "#2a1a00" });
      return;
    }
    let x = cx - width / 2;
    for (let i = 0; i < tens; i++, x += 13) {
      g.fillStyle(0x8a6420, 1).fillRect(x, baseY - 44, 11, 44);
      g.fillStyle(GOLD, 1).fillRect(x + 1, baseY - 43, 9, 42);
      g.lineStyle(1, 0x8a6420, 1);
      for (let k = 1; k < 10; k++)
        g.lineBetween(x + 1, baseY - 44 + k * 4.4, x + 10, baseY - 44 + k * 4.4);
    }
    for (let i = 0; i < ones; i++) {
      const col = Math.floor(i / 3);
      const row = i % 3;
      g.fillStyle(0x8a6420, 1).fillRect(x + col * 13, baseY - 13 - row * 13, 12, 12);
      g.fillStyle(GOLD, 1).fillRect(x + col * 13 + 1, baseY - 12 - row * 13, 10, 10);
    }
  }

  /* ── counterweight: solve by doing the same inverse move to both pans ───── */
  function counterweight(scene, api) {
    const { kit, rng } = api;
    const variant = api.mission.variant || "addsub";
    const start = M.genScale(rng, variant, api.tier);
    const path = M.solutionPath(start);
    let st = { ...start };
    let history = [];
    let undo = [];
    let opIdx = 0;
    let amount = 1;
    let typed = false;
    let target = "both";
    let angle = 0;
    let deckAngle = -0.17;
    let busy = false;
    const PX = 270;
    const PY = 196;
    const HL = 170;
    const HANG = 96;
    const TARGETS = ["both", "left", "right"];
    const targetName = {
      both: L("both pans", "los dos platillos"),
      left: L("left pan only", "solo el platillo izquierdo"),
      right: L("right pan only", "solo el platillo derecho"),
    };
    api.setBrief(
      L(
        `The bridge counterweight reads ${M.eqText(start)}. Each purple crate weighs x. Get one crate alone with the scale level, and the bridge lowers.`,
        `El contrapeso del puente marca ${M.eqText(start)}. Cada caja morada pesa x. Deja una caja sola con la balanza nivelada y el puente baja.`,
      ),
    );

    const world = scene.add.graphics().setDepth(20);
    const g = scene.add.graphics().setDepth(22);
    const labels = textPool(kit, 14, "#ffffff", 23);
    const panLabels = [0, 1].map(() =>
      kit.text(0, 0, "", 17, "#f1ecff", { weight: "900", depth: 24, stroke: "#120e26" }),
    );
    const tipText = kit.text(PX, 150, "", 14, "#cfc6ff", { weight: "800", depth: 24 });

    // Control panel.
    kit.panel(536, 140, 264, 334, { fill: PANEL, alpha: 0.92 });
    kit.text(668, 160, api.t(L("CHOOSE A MOVE", "ELIGE UN MOVIMIENTO")), 14, "#ffd76a", {
      weight: "800",
    });
    const sel = scene.add.graphics().setDepth(29);
    const opBtns = M.OPS.map((op, i) =>
      kit.button(574 + i * 62, 198, 52, 42, op, () => setOp(i), {
        size: 24,
        fill: 0x3a3160,
        color: "#f1ecff",
      }),
    );
    kit.button(590, 250, 44, 40, "−", () => bumpAmount(-1), {
      size: 22,
      fill: 0x3a3160,
      color: "#f1ecff",
    });
    const amountText = kit.text(668, 250, "", 28, "#ffffff", { weight: "900", depth: 31 });
    kit.button(746, 250, 44, 40, "+", () => bumpAmount(1), { size: 22 });
    const tgtBtns = [
      kit.button(598, 302, 92, 38, api.t(L("Both", "Ambos")), () => setTarget("both"), {
        size: 15,
        fill: 0x3a3160,
        color: "#f1ecff",
      }),
      kit.button(688, 302, 76, 38, api.t(L("Left", "Izq.")), () => setTarget("left"), {
        size: 15,
        fill: 0x3a3160,
        color: "#f1ecff",
      }),
      kit.button(762, 302, 64, 38, api.t(L("Right", "Der.")), () => setTarget("right"), {
        size: 15,
        fill: 0x3a3160,
        color: "#f1ecff",
      }),
    ];
    const preview = kit.text(668, 346, "", 15, "#cfc6ff", { weight: "800", depth: 31, wrap: 240 });
    kit.button(668, 392, 210, 44, api.t(L("Apply ▶", "Aplicar ▶")), () => applyMove(), {
      size: 17,
    });
    kit.button(616, 446, 100, 34, api.t(L("↶ Undo", "↶ Deshacer")), () => undoMove(), {
      size: 14,
      fill: 0x3a3160,
      color: "#f1ecff",
    });
    kit.button(722, 446, 100, 34, api.t(L("Reset", "Reiniciar")), () => reset(), {
      size: 14,
      fill: 0x3a3160,
      color: "#f1ecff",
    });

    function drawControls() {
      sel.clear();
      const ob = opBtns[opIdx];
      sel.lineStyle(3, 0xffd76a, 1).strokeRoundedRect(ob.x - 30, ob.y - 25, 60, 50, 14);
      const tb = tgtBtns[TARGETS.indexOf(target)];
      sel.strokeRoundedRect(tb.x - tb.width / 2 - 4, tb.y - 23, tb.width + 8, 46, 14);
      amountText.setText(String(amount));
      preview.setText(
        api.t(L("{op} {n} on {where}", "{op} {n} en {where}"), {
          op: M.OPS[opIdx],
          n: amount,
          where: api.t(targetName[target]),
        }),
      );
    }

    function drawWorld() {
      world.clear();
      // Cliffs and the drawbridge deck, hinged on the left cliff.
      world.fillStyle(0x2b2443, 1).fillRect(18, 452, 66, 26);
      world.fillStyle(0x2b2443, 1).fillRect(456, 452, 66, 26);
      world.fillStyle(0x4a7a52, 1).fillRect(18, 448, 66, 6).fillRect(456, 448, 66, 6);
      const len = 376;
      const tx = 84 + Math.cos(deckAngle) * len;
      const ty = 452 + Math.sin(deckAngle) * len;
      world.lineStyle(10, 0x6b4f33, 1).lineBetween(84, 452, tx, ty);
      world.lineStyle(2, 0xa8865c, 1).lineBetween(84, 448, tx, ty - 4);
      for (let i = 1; i < 12; i++) {
        const k = i / 12;
        world
          .lineStyle(2, 0x3d2c1b, 0.9)
          .lineBetween(
            84 + (tx - 84) * k,
            452 + (ty - 452) * k - 5,
            84 + (tx - 84) * k,
            452 + (ty - 452) * k + 5,
          );
      }
      // Pivot post.
      world.fillStyle(0x3d335f, 1).fillRect(PX - 9, PY, 18, 168);
      world.fillStyle(0x5b4d8a, 1).fillTriangle(PX - 34, PY + 172, PX + 34, PY + 172, PX, PY + 120);
    }

    function draw() {
      g.clear();
      labels.reset();
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      const ends = [
        { x: PX - HL * ca, y: PY - HL * sa },
        { x: PX + HL * ca, y: PY + HL * sa },
      ];
      g.lineStyle(9, 0x7a6bb8, 1).lineBetween(ends[0].x, ends[0].y, ends[1].x, ends[1].y);
      g.fillStyle(0xc8b9ff, 1).fillCircle(PX, PY, 9);
      ends.forEach((e, side) => {
        const baseY = e.y + HANG;
        g.lineStyle(2, 0xb9b0d8, 0.9);
        g.lineBetween(e.x, e.y, e.x - 70, baseY);
        g.lineBetween(e.x, e.y, e.x + 70, baseY);
        g.fillStyle(0x5b4d8a, 1).fillRoundedRect(e.x - 80, baseY, 160, 10, 5);
        if (side === 0) drawLeftPan(e.x, baseY);
        else drawWeights(g, labels, e.x, baseY, st.C, 150);
        panLabels[side]
          .setPosition(e.x, baseY + 26)
          .setText(side === 0 ? M.leftText(st) : String(st.C));
      });
      labels.done();
      const lean = M.lean(st);
      tipText.setText(
        lean === 0
          ? api.t(L("⚖ Level", "⚖ Nivelada"))
          : api.t(
              L("⚠ Tipped — the pans are not equal", "⚠ Inclinada — los platillos no son iguales"),
            ),
      );
      tipText.setColor(lean === 0 ? "#bff5cf" : "#ffb39a");
    }
    function drawLeftPan(cx, baseY) {
      const whole = Math.floor(st.p / st.q);
      const part = st.p % st.q;
      const crates = whole + (part ? 1 : 0);
      const unitsW = st.B > 0 ? 64 : 0;
      const perRow = Math.min(3, Math.max(1, crates));
      const cratesW = perRow * 34;
      const left = cx - (cratesW + unitsW) / 2;
      for (let i = 0; i < crates; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = left + col * 34;
        const y = baseY - 32 - row * 34;
        const isPart = part && i === crates - 1;
        g.fillStyle(0x4b3a8a, 1).fillRoundedRect(x, y, 30, 30, 5);
        if (isPart) {
          for (let k = 0; k < st.q; k++) {
            const w = 30 / st.q;
            g.fillStyle(k < part ? CRATE : 0x2a2148, k < part ? 1 : 0.6).fillRect(
              x + k * w + 1,
              y + 2,
              w - 2,
              26,
            );
          }
          labels.put(x + 15, y + 15, part + "/" + st.q, { color: "#ffffff" });
        } else {
          g.fillStyle(CRATE, 1).fillRoundedRect(x + 2, y + 2, 26, 26, 4);
          labels.put(x + 15, y + 15, "x", { color: "#1a1036" });
        }
      }
      if (st.B > 0) drawWeights(g, labels, left + cratesW + unitsW / 2, baseY, st.B, 62);
      if (st.B < 0) {
        // Balloons pull the pan UP: each one subtracts 1.
        const n = -st.B;
        const shown = Math.min(n, 12);
        for (let i = 0; i < shown; i++) {
          const bx = cx - 50 + (i % 6) * 20;
          const by = baseY - 88 - Math.floor(i / 6) * 22;
          g.lineStyle(1, 0xffffff, 0.5).lineBetween(bx, by + 9, cx + 30, baseY - 4);
          g.fillStyle(BALLOON, 1).fillCircle(bx, by, 9);
          g.fillStyle(0xffffff, 0.45).fillCircle(bx - 3, by - 3, 3);
        }
        labels.put(cx + 66, baseY - 96, M.MINUS + n, { color: "#ffc4dc" });
      }
    }
    function tiltTo(target) {
      return new Promise((resolve) => {
        const obj = { a: angle };
        kit.tween({
          targets: obj,
          a: target,
          duration: 420,
          ease: "Sine.easeInOut",
          onUpdate: () => {
            angle = obj.a;
            draw();
          },
          onComplete: () => {
            angle = target;
            draw();
            resolve();
          },
        });
      });
    }
    // Left heavier → left end goes DOWN → negative angle in this frame.
    const targetAngle = () => {
      const d = M.lean(st);
      if (d === 0) return 0;
      const mag = Math.min(0.2, 0.06 + Math.abs(d) * 0.012);
      return d > 0 ? -mag : mag;
    };

    function setOp(i) {
      opIdx = (i + M.OPS.length) % M.OPS.length;
      typed = false;
      api.sfx.select();
      drawControls();
      api.refresh();
    }
    function bumpAmount(d) {
      amount = Phaser.Math.Clamp(amount + d, 1, M.AMOUNT_MAX);
      typed = false;
      api.sfx.tick(amount % 12);
      drawControls();
      api.refresh();
    }
    function setTarget(t) {
      target = t;
      api.sfx.select();
      drawControls();
      api.refresh();
    }
    function type(key) {
      if (key === "Backspace") {
        const s = String(amount).slice(0, -1);
        amount = Math.max(1, Number(s) || 1);
        typed = s.length > 0;
      } else if (/^[0-9]$/.test(key)) {
        const joined = Number(String(amount) + key);
        const n = typed && joined <= M.AMOUNT_MAX ? joined : Number(key);
        if (n < 1) return;
        amount = n;
        typed = true;
      } else return;
      api.sfx.tap();
      drawControls();
      api.refresh();
    }
    kit.onType(type);

    async function applyMove(move) {
      if (busy) return;
      const op = move ? move.op : M.OPS[opIdx];
      const n = move ? move.n : amount;
      const where = move ? "both" : target;
      const r = M.applyOp(st, op, n, where);
      typed = false;
      if (!r.ok) {
        api.sfx.miss();
        kit.shake(0.002, 120);
        api.feedback(
          {
            split: L(
              `The scale can't do that: ÷ ${n} would cut a weight into pieces. Every weight on that pan must split evenly.`,
              `La balanza no puede: ÷ ${n} cortaría una pesa en pedazos. Cada pesa de ese platillo debe repartirse en partes iguales.`,
            ),
            negRight: L(
              `The right pan has only ${st.C} weights. You can't take away ${n}.`,
              `El platillo derecho tiene solo ${st.C} pesas. No puedes quitar ${n}.`,
            ),
            tooMany: L(
              "That is too much weight for the pans. Try a different move.",
              "Es demasiado peso para los platillos. Prueba otro movimiento.",
            ),
          }[r.reason],
          "info",
        );
        return;
      }
      busy = true;
      undo.push({ st, history });
      st = r.st;
      history = history.concat([r]);
      api.sfx.place();
      const label = op + " " + n;
      if (where !== "right") kit.floatText(PX - HL, 250, label, "#ffd76a", 20);
      if (where !== "left") kit.floatText(PX + HL, 250, label, "#ffd76a", 20);
      await tiltTo(targetAngle());
      busy = false;
      api.refresh();
    }
    function undoMove() {
      if (busy || !undo.length) return;
      const prev = undo.pop();
      st = prev.st;
      history = prev.history;
      api.sfx.tap();
      tiltTo(targetAngle());
      api.refresh();
    }
    function reset() {
      if (busy) return;
      st = { ...start };
      history = [];
      undo = [];
      api.sfx.whoosh();
      tiltTo(0);
      api.refresh();
    }
    function lowerBridge(down) {
      return new Promise((resolve) => {
        const obj = { a: deckAngle };
        kit.tween({
          targets: obj,
          a: down ? 0 : -0.17,
          duration: 700,
          ease: down ? "Bounce.easeOut" : "Sine.easeInOut",
          onUpdate: () => {
            deckAngle = obj.a;
            drawWorld();
          },
          onComplete: () => {
            deckAngle = down ? 0 : -0.17;
            drawWorld();
            resolve();
          },
        });
      });
    }

    drawWorld();
    draw();
    drawControls();

    const moveText = (mv) => mv.op + " " + mv.n;
    const first = path[0];
    const hint2 = {
      plus: L(
        `x has + ${start.B} on its pan. Take ${start.B} off BOTH pans.`,
        `x tiene + ${start.B} en su platillo. Quita ${start.B} de LOS DOS platillos.`,
      ),
      minus: L(
        `${-start.B} balloons pull x up (− ${-start.B}). Add ${-start.B} weights to BOTH pans to cancel them.`,
        `${-start.B} globos jalan x hacia arriba (− ${-start.B}). Agrega ${-start.B} pesas a LOS DOS platillos para anularlos.`,
      ),
      times: L(
        `There are ${start.p} crates. Split BOTH pans into ${start.p} equal groups: ÷ ${start.p}.`,
        `Hay ${start.p} cajas. Divide LOS DOS platillos en ${start.p} grupos iguales: ÷ ${start.p}.`,
      ),
      div: L(
        `The pan holds 1/${start.q} of a crate. Make ${start.q} copies of BOTH pans: × ${start.q}.`,
        `El platillo tiene 1/${start.q} de una caja. Haz ${start.q} copias de LOS DOS platillos: × ${start.q}.`,
      ),
    }[start.form];

    return {
      checkLabel: L("Lower the bridge", "Bajar el puente"),
      get actions() {
        return [
          {
            key: "ArrowUp",
            label: L("Next move type", "Siguiente operación"),
            run: () => setOp(opIdx + 1),
          },
          {
            key: "ArrowDown",
            label: L("Previous move type", "Operación anterior"),
            run: () => setOp(opIdx - 1),
          },
          { key: "ArrowRight", label: L("Amount +1", "Cantidad +1"), run: () => bumpAmount(1) },
          { key: "ArrowLeft", label: L("Amount −1", "Cantidad −1"), run: () => bumpAmount(-1) },
          {
            key: "p",
            label: L(
              "Change pans (both / left / right)",
              "Cambiar platillos (ambos / izq. / der.)",
            ),
            run: () => setTarget(TARGETS[(TARGETS.indexOf(target) + 1) % 3]),
          },
          { key: " ", label: L("Apply the move", "Aplicar el movimiento"), run: () => applyMove() },
          { key: "u", label: L("Undo", "Deshacer"), run: () => undoMove() },
        ];
      },
      status: () =>
        L(
          `Left pan ${M.leftText(st)}, right pan ${st.C}. ${M.lean(st) === 0 ? "Level" : "Tipped"}. Move: ${M.OPS[opIdx]} ${amount} on ${targetName[target].en}.`,
          `Platillo izquierdo ${M.leftText(st)}, derecho ${st.C}. ${M.lean(st) === 0 ? "Nivelada" : "Inclinada"}. Movimiento: ${M.OPS[opIdx]} ${amount} en ${targetName[target].es}.`,
        ),
      hints: [
        L(
          "Ask: what is done to x? Do the OPPOSITE move, and do it to BOTH pans so the scale stays level.",
          "Pregunta: ¿qué se le hace a x? Haz la operación OPUESTA y hazla en LOS DOS platillos para que la balanza siga nivelada.",
        ),
        path.length > 1
          ? L(
              `${hint2.en} Then look at the crates again.`,
              `${hint2.es} Luego mira las cajas otra vez.`,
            )
          : hint2,
      ],
      async check() {
        const res = M.judgeScale(st, history);
        if (res.ok) {
          await lowerBridge(true);
          kit.burst(270, 452, kit.accent, 26);
          return { ok: true };
        }
        if (res.incomplete)
          return {
            ok: false,
            incomplete: true,
            feedback: L(
              "Make a move first: choose an operation, an amount and the pans, then Apply.",
              "Primero haz un movimiento: elige una operación, una cantidad y los platillos, y luego Aplicar.",
            ),
          };
        // The bridge strains but will not come down.
        await lowerBridge(false);
        kit.shake(0.004, 160);
        const fb = {
          oneSide: L(
            "The scale tipped: you changed only one pan. A move on one pan must happen on the other pan too.",
            "La balanza se inclinó: cambiaste solo un platillo. Lo que haces en un platillo lo debes hacer en el otro también.",
          ),
          sameOp: L(
            "You used the SAME operation that is already on x, so x got harder to free. Use the opposite operation on both pans.",
            "Usaste la MISMA operación que ya tiene x, así que x quedó más difícil de liberar. Usa la operación opuesta en los dos platillos.",
          ),
          wrongOp: L(
            start.form === "times" || start.form === "div"
              ? "x is multiplied or divided here. Adding or taking away weights can't undo that. Use the opposite of × or ÷."
              : "x has weights added or taken away. Multiplying or dividing can't undo that. Use the opposite of + or −.",
            start.form === "times" || start.form === "div"
              ? "Aquí x está multiplicada o dividida. Sumar o quitar pesas no lo deshace. Usa lo opuesto de × o ÷."
              : "A x le suman o le quitan pesas. Multiplicar o dividir no lo deshace. Usa lo opuesto de + o −.",
          ),
          notIsolated: L(
            "The bridge stays up: x is not alone on its pan yet. Keep undoing what is done to x.",
            "El puente no baja: x todavía no está sola en su platillo. Sigue deshaciendo lo que se le hace a x.",
          ),
        }[res.tag];
        return { ok: false, misconception: res.tag, feedback: fb };
      },
      async demo() {
        st = { ...start };
        history = [];
        undo = [];
        target = "both";
        await tiltTo(0);
        for (const mv of path) {
          opIdx = M.OPS.indexOf(mv.op);
          amount = mv.n;
          drawControls();
          await kit.wait(380);
          await applyMove(mv);
          await kit.wait(320);
        }
        await lowerBridge(true);
        await kit.wait(300);
      },
      explain: () =>
        L(
          `${M.eqText(start)}: ${path.map(moveText).join(", then ")} on both pans gives x = ${start.s}.`,
          `${M.eqText(start)}: ${path.map(moveText).join(", luego ")} en los dos platillos da x = ${start.s}.`,
        ),
    };
  }

  /* ── keystones: substitute each stone; only true ones fit the arch ─────── */
  function keystones(scene, api) {
    const { kit, rng } = api;
    const variant = api.mission.variant || "eq";
    const pz = M.genStones(rng, variant, api.tier);
    const n = pz.values.length;
    const placed = new Array(n).fill(false);
    const cracked = new Array(n).fill(false);
    let sel = 0;
    const colX = (i) => 410 + (i - (n - 1) / 2) * 110;
    const ARCH_Y = 286;
    const QUARRY_Y = 418;
    api.setBrief(
      variant === "ineq"
        ? L(
            "A stone fits the arch only if it makes the inequality TRUE. Put EVERY true stone in the arch.",
            "Una piedra cabe en el arco solo si hace VERDADERA la desigualdad. Pon TODAS las piedras verdaderas en el arco.",
          )
        : L(
            "A stone fits the arch only if it makes the equation TRUE. Find the stone that is the solution.",
            "Una piedra cabe en el arco solo si hace VERDADERA la ecuación. Halla la piedra que es la solución.",
          ),
    );
    // Carved sentence.
    kit.panel(230, 140, 360, 62, { fill: PANEL, alpha: 0.92, line: 0xffd76a });
    kit.text(410, 171, M.sentenceText(pz), 32, "#ffe9a8", { weight: "900", depth: 21 });
    const arch = scene.add.graphics().setDepth(20);
    const stoneG = scene.add.graphics().setDepth(22);
    const valText = pz.values.map((v) =>
      kit.text(0, 0, String(v), 24, "#1b1830", { weight: "900", depth: 23 }),
    );
    const subText = pz.values.map(() =>
      kit.text(0, 0, "", 13, "#ffffff", { weight: "800", depth: 24 }),
    );
    kit.text(410, 470, api.t(L("QUARRY", "CANTERA")), 12, "#9c95c4", { weight: "800" });
    // The arch: two piers and a curved band with a slot over each column.
    arch.fillStyle(0x3a3456, 1).fillRect(70, 250, 34, 130).fillRect(716, 250, 34, 130);
    arch.lineStyle(14, 0x4b4470, 1);
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(86, 252),
      new Phaser.Math.Vector2(410, 214),
      new Phaser.Math.Vector2(734, 252),
    );
    curve.draw(arch, 32);
    for (let i = 0; i < n; i++) {
      arch.lineStyle(2, 0x8e86c0, 0.55).strokeRoundedRect(colX(i) - 44, ARCH_Y - 30, 88, 60, 10);
    }

    function stonePos(i) {
      return { x: colX(i), y: placed[i] ? ARCH_Y : QUARRY_Y };
    }
    function draw() {
      stoneG.clear();
      for (let i = 0; i < n; i++) {
        const { x, y } = stonePos(i);
        const active = i === sel;
        stoneG.fillStyle(0x000000, 0.35).fillRoundedRect(x - 40, y - 22, 80, 50, 10);
        stoneG
          .fillStyle(cracked[i] ? 0x8a5a55 : STONE, 1)
          .fillRoundedRect(x - 40, y - 26, 80, 50, 10);
        stoneG.fillStyle(0xffffff, 0.16).fillRoundedRect(x - 34, y - 22, 68, 14, 6);
        if (cracked[i]) {
          stoneG.lineStyle(2, 0x2a1414, 1);
          stoneG.lineBetween(x - 10, y - 26, x + 2, y - 4);
          stoneG.lineBetween(x + 2, y - 4, x - 6, y + 24);
        }
        stoneG.lineStyle(active ? 4 : 2, active ? 0xffd76a : 0x5d567f, 1);
        stoneG.strokeRoundedRect(x - 40, y - 26, 80, 50, 10);
        valText[i].setPosition(x, y - 1);
      }
    }
    function toggle(i = sel) {
      sel = i;
      placed[i] = !placed[i];
      cracked[i] = false;
      subText[i].setText("");
      api.sfx.place();
      kit.pop(valText[i], 1.15);
      draw();
      api.refresh();
    }
    pz.values.forEach((_, i) => {
      const z = scene.add
        .zone(colX(i), 352, 96, 200)
        .setInteractive({ useHandCursor: true })
        .setDepth(25);
      z.on("pointerup", () => toggle(i));
    });
    draw();

    function showSub(i, good) {
      const v = pz.values[i];
      const left = pz.f(v);
      subText[i]
        .setPosition(colX(i), placed[i] ? ARCH_Y + 42 : QUARRY_Y + 40)
        .setText(`${pz.sub(v)} = ${left}`)
        .setColor(good ? "#bff5cf" : "#ffb39a");
    }
    const chosen = () => placed.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
    const relWord = {
      "<": L("less than", "menor que"),
      ">": L("greater than", "mayor que"),
      "≤": L("less than or equal to", "menor o igual que"),
      "≥": L("greater than or equal to", "mayor o igual que"),
      "=": L("equal to", "igual a"),
    }[pz.rel];
    const exampleIdx = (() => {
      const i = pz.values.findIndex((v, k) => !pz.truth[k] && v !== pz.sameOpValue && v !== pz.s);
      return i >= 0 ? i : pz.truth.indexOf(false);
    })();
    const ex = pz.values[exampleIdx];

    return {
      checkLabel: L("Set the arch", "Colocar el arco"),
      actions: [
        {
          key: "ArrowRight",
          label: L("Next stone →", "Piedra siguiente →"),
          run: () => {
            sel = (sel + 1) % n;
            draw();
            api.refresh();
          },
        },
        {
          key: "ArrowLeft",
          label: L("← Previous stone", "← Piedra anterior"),
          run: () => {
            sel = (sel + n - 1) % n;
            draw();
            api.refresh();
          },
        },
        {
          key: " ",
          label: L("Move stone in / out of the arch", "Meter / sacar la piedra del arco"),
          run: () => toggle(),
        },
      ],
      status: () => {
        const ins = chosen().map((i) => pz.values[i]);
        return L(
          `Stone ${pz.values[sel]} selected. In the arch: ${ins.length ? ins.join(", ") : "none"}.`,
          `Piedra ${pz.values[sel]} elegida. En el arco: ${ins.length ? ins.join(", ") : "ninguna"}.`,
        );
      },
      hints: [
        variant === "ineq"
          ? L(
              "Test each stone: put its number in for x and compute. Keep it only if the result is " +
                relWord.en +
                " " +
                pz.c +
                ".",
              "Prueba cada piedra: pon su número en lugar de x y calcula. Déjala solo si el resultado es " +
                relWord.es +
                " " +
                pz.c +
                ".",
            )
          : L(
              "Substitute: put a stone's number in for x and compute. The solution makes both sides equal.",
              "Sustituye: pon el número de una piedra en lugar de x y calcula. La solución hace iguales los dos lados.",
            ),
        L(
          `Try stone ${ex}: ${pz.sub(ex)} = ${pz.f(ex)}. Is ${pz.f(ex)} ${relWord.en} ${pz.c}? Test every stone like that.`,
          `Prueba la piedra ${ex}: ${pz.sub(ex)} = ${pz.f(ex)}. ¿Es ${pz.f(ex)} ${relWord.es} ${pz.c}? Prueba cada piedra así.`,
        ),
      ],
      async check() {
        const res = M.judgeStones(pz, chosen());
        if (res.incomplete)
          return {
            ok: false,
            incomplete: true,
            feedback: L(
              "The arch is empty. Move a stone up into it first (Space or tap a stone).",
              "El arco está vacío. Primero sube una piedra (Espacio o toca una piedra).",
            ),
          };
        // Weigh every stone in the arch, one by one.
        for (const i of chosen()) {
          showSub(i, pz.truth[i]);
          api.sfx.tick(i * 2);
          if (!pz.truth[i]) {
            cracked[i] = true;
            draw();
            kit.shake(0.003, 120);
          } else kit.burst(colX(i), ARCH_Y, kit.accent, 8);
          await kit.wait(260);
        }
        if (res.ok) {
          kit.burst(410, 230, 0xffd76a, 28);
          return { ok: true };
        }
        const v = res.stone != null ? pz.values[res.stone] : null;
        const lv = v != null ? pz.f(v) : null;
        const fb = {
          sameOp: L(
            `Stone ${v} cracked: ${pz.sub(v)} = ${lv}, not ${pz.c}. It looks like you used the same operation instead of undoing it.`,
            `La piedra ${v} se rompió: ${pz.sub(v)} = ${lv}, no ${pz.c}. Parece que usaste la misma operación en vez de deshacerla.`,
          ),
          notTrue:
            v != null
              ? L(
                  `Stone ${v} cracked: ${pz.sub(v)} = ${lv}, and ${lv} ${pz.rel} ${pz.c} is false.`,
                  `La piedra ${v} se rompió: ${pz.sub(v)} = ${lv}, y ${lv} ${pz.rel} ${pz.c} es falso.`,
                )
              : L("Some stones do not make it true.", "Algunas piedras no la hacen verdadera."),
          flipped: L(
            "The arch shook: your stones are on the wrong side. Check which way the sign points.",
            "El arco tembló: tus piedras están del lado equivocado. Revisa hacia dónde apunta el signo.",
          ),
          endpoint: L(
            `Check the boundary stone: when both sides are equal, does "${pz.rel}" let it in or keep it out?`,
            `Revisa la piedra del límite: cuando los dos lados son iguales, ¿"${pz.rel}" la deja entrar o la deja fuera?`,
          ),
          missedSome: L(
            "Every stone you placed is true, but the arch has gaps. More stones make it true.",
            "Cada piedra que pusiste es verdadera, pero el arco tiene huecos. Hay más piedras que la hacen verdadera.",
          ),
        }[res.tag];
        return { ok: false, misconception: res.tag, feedback: fb };
      },
      async demo() {
        for (let i = 0; i < n; i++) {
          sel = i;
          placed[i] = false;
          cracked[i] = false;
          draw();
          showSub(i, pz.truth[i]);
          api.sfx.tick(i * 2);
          await kit.wait(320);
          if (pz.truth[i]) {
            placed[i] = true;
            draw();
            showSub(i, true);
            api.sfx.place();
            await kit.wait(260);
          }
        }
        kit.burst(410, 230, 0xffd76a, 24);
        await kit.wait(300);
      },
      explain: () => {
        if (variant !== "ineq")
          return L(
            `${pz.sub(pz.s)} = ${pz.c}. Only ${pz.s} makes both sides equal, so x = ${pz.s} is the solution.`,
            `${pz.sub(pz.s)} = ${pz.c}. Solo ${pz.s} hace iguales los dos lados, así que x = ${pz.s} es la solución.`,
          );
        const good = pz.values.filter((_, i) => pz.truth[i]).sort((a, b) => a - b);
        return L(
          `${M.sentenceText(pz)} is true for ${good.join(", ")}. The boundary is ${pz.s}; "${pz.rel}" ${M.closedRel(pz.rel) ? "includes" : "does not include"} it.`,
          `${M.sentenceText(pz)} es verdadera para ${good.join(", ")}. El límite es ${pz.s}; "${pz.rel}" ${M.closedRel(pz.rel) ? "lo incluye" : "no lo incluye"}.`,
        );
      },
    };
  }

  window.EQ_MISSIONS = Object.assign(window.EQ_MISSIONS || {}, {
    counterweight,
    keystones,
    textPool,
    PANEL,
    OK,
    BAD,
    GOLD,
    CRATE,
  });
})();
