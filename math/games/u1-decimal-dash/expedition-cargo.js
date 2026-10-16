/* Cloudline Courier — division missions.
 *   sorter  the Thunder Gap mail sorter runs the long-division algorithm. The student
 *           writes each quotient digit; the sorting log then divides, multiplies,
 *           subtracts and brings down with THEIR digits, and jams where a digit is wrong.
 *   crates  how many decimal-sized crates fill a decimal-length hold (decimal ÷ decimal).
 *           Crates overflow off the edge or leave a gap, so a misplaced point is visible.
 */
(function () {
  "use strict";
  const M = window.DD_MISSIONS;
  if (!window.EWLExpedition || !M) return;
  const { L, D, fmt, mul, cmp, eq, sig, shift, decPlaces, num, decimalOf } = { ...M, ...M.math };
  const { PANEL, INK, GOLD } = M;

  /* ── Pure: long-division problems and the step simulator ──────────────── */
  function genSorter(r, tier, variant) {
    for (let guard = 0; guard < 2000; guard++) {
      let d;
      let q;
      if (variant === "dec") {
        if (tier >= 3) {
          d = r.pick([12, 15, 16, 24, 25, 32, 35, 45]);
          q = { n: BigInt(r.int(51, 1999)), s: r.pick([2, 3]) };
        } else {
          d = r.int(2, 9);
          q = { n: BigInt(r.int(101, 999)), s: 2 };
        }
      } else if (tier >= 2) {
        d = r.int(11, 24);
        q = { n: BigInt(r.int(1, 4) * 100 + r.int(1, 9)), s: 0 };
      } else {
        d = r.int(12, 29);
        let v;
        do v = r.int(21, 99);
        while (v % 10 === 0);
        q = { n: BigInt(v), s: 0 };
      }
      if (q.s && q.n % 10n === 0n) continue;
      const dividend = fmt(mul(q, D(String(d))));
      const [ip, fp = ""] = dividend.split(".");
      const dd = (ip + fp).split("").map(Number);
      if (dd.length > 5 || dd.length < 2) continue;
      const qs = decPlaces(fmt(q));
      if (variant === "dec" && (qs <= fp.length || qs - fp.length > 2)) continue;
      let v = 0;
      let f = -1;
      for (let i = 0; i < dd.length; i++) {
        v = v * 10 + dd[i];
        if (v >= d) {
          f = i;
          break;
        }
      }
      if (f < 0) continue;
      const annexNeed = Math.max(0, qs - fp.length);
      return {
        variant: variant || "whole",
        dividend,
        divisor: d,
        truth: fmt(q),
        dd,
        intLen: ip.length,
        f,
        annexNeed,
        maxAnnex: variant === "dec" ? 3 : 0,
      };
    }
    throw new Error("genSorter exhausted");
  }
  /** Run the algorithm with the student's quotient digits (q[0] sits over column f). */
  function simSorter(p, q) {
    const d = p.divisor;
    let rem = 0;
    for (let i = 0; i < p.f; i++) rem = rem * 10 + p.dd[i];
    const steps = [];
    for (let j = 0; j < q.length; j++) {
      const col = p.f + j;
      const cur = rem * 10 + (col < p.dd.length ? p.dd[col] : 0);
      const prod = q[j] * d;
      const step = { col, cur, q: q[j], prod, rem: cur - prod, annexed: col >= p.dd.length };
      steps.push(step);
      if (prod > cur) return { steps, fail: { j, kind: cur < d ? "zeroSkip" : "digitHigh" }, rem };
      rem = cur - prod;
      if (rem >= d) return { steps, fail: { j, kind: "digitLow" }, rem };
    }
    return { steps, fail: null, rem, lastCol: p.f + q.length - 1 };
  }
  function judgeSorter(p, q) {
    if (!q.length) return { ok: false, incomplete: true };
    const sim = simSorter(p, q);
    if (sim.fail) return { ok: false, tag: sim.fail.kind, sim };
    if (sim.lastCol < p.dd.length - 1) return { ok: false, incomplete: true, sim };
    if (sim.rem > 0) return { ok: false, tag: "annexZero", sim };
    return { ok: true, sim };
  }
  const truthDigits = (p) => {
    const [ip, fp = ""] = p.truth.split(".");
    const all = (ip.padStart(p.intLen, "0") + fp).split("").map(Number);
    return all.slice(p.f, p.dd.length + p.annexNeed);
  };

  /* ── Pure: crate hold (decimal ÷ decimal) ─────────────────────────────── */
  function genCrates(r, tier) {
    for (let guard = 0; guard < 500; guard++) {
      const c =
        tier >= 3
          ? r.pick(["0.25", "0.75", "0.15", "0.35", "0.45", "1.25", "0.12", "0.65"])
          : r.next() < 0.6
            ? decimalOf(r, 2, 9, 1)
            : decimalOf(r, 12, 25, 1);
      const q = r.int(tier >= 3 ? 6 : 4, tier >= 3 ? 20 : 15);
      const a = fmt(mul(D(c), D(String(q))));
      if (num(D(a)) > 40 || num(D(a)) < 2) continue;
      return { a, c, truth: String(q), k: decPlaces(c) };
    }
    throw new Error("genCrates exhausted");
  }
  function judgeCrates(p, ans) {
    const s = D(ans);
    if (!s) return { ok: false, incomplete: true };
    const t = D(p.truth);
    const a = D(p.a);
    const c = D(p.c);
    if (eq(s, t)) return { ok: true };
    if (sig(s) === sig(t)) return { ok: false, tag: "pointPlace", high: cmp(s, t) > 0 };
    if (eq(s, mul(a, c))) return { ok: false, tag: "multiplied", high: cmp(s, t) > 0 };
    const inv = num(c) / num(a);
    if (num(s) < 1 && Math.abs(num(s) - inv) < 0.006)
      return { ok: false, tag: "inverted", high: false };
    if (cmp(c, D("1")) < 0 && cmp(s, a) < 0)
      return { ok: false, tag: "divideSmaller", high: false };
    return { ok: false, tag: "divDec", high: cmp(s, t) > 0 };
  }

  /* ── sorter builder ───────────────────────────────────────────────────── */
  function sorter(scene, api) {
    const { kit, rng } = api;
    const variant = api.mission.variant || "whole";
    const p = genSorter(rng, api.tier, variant);
    const d = p.divisor;
    const N = p.dd.length;
    const hasPoint = p.intLen < N || variant === "dec";
    const maxDigits = N - p.f + p.maxAnnex;
    let q = [];
    api.setBrief(
      variant === "dec"
        ? L(
            `${p.dividend} kg of mail goes into ${d} bags, the same in each. Write the quotient one digit at a time. If mail is left over, annex a zero and keep going.`,
            `${p.dividend} kg de correo van en ${d} bolsas, lo mismo en cada una. Escribe el cociente dígito por dígito. Si sobra correo, agrega un cero y sigue.`,
          )
        : L(
            `${p.dividend} letters go into ${d} mailbags, the same number in each. Use long division: write the quotient one digit at a time.`,
            `${p.dividend} cartas van en ${d} sacas, el mismo número en cada una. Usa la división larga: escribe el cociente dígito por dígito.`,
          ),
    );
    kit.panel(24, 140, 466, 334, { fill: PANEL, alpha: 0.9 });
    kit.text(40, 158, api.t(L("MAIL SORTER", "CLASIFICADORA")), 14, GOLD, { ox: 0, weight: "800" });
    const CWD = 38;
    const PTG = 14;
    const DX0 = 172;
    const DY = 236;
    const QY = DY - 48;
    const colX = (i) => DX0 + i * CWD + (hasPoint && i >= p.intLen ? PTG : 0);
    const board = scene.add.graphics().setDepth(21);
    const glyphs = [];
    const glyph = (x, y, s, color, size = 28) => {
      let t = glyphs.find((o) => !o.visible);
      if (!t) {
        t = kit.text(0, 0, "", size, color, { weight: "900", depth: 23 });
        glyphs.push(t);
      }
      return t.setVisible(true).setPosition(x, y).setText(s).setColor(color).setFontSize(size);
    };
    const logTitle = kit.text(40, 286, api.t(L("SORTING LOG", "REGISTRO")), 13, "#8fb7cc", {
      ox: 0,
      weight: "800",
    });
    const logLines = [];
    for (let i = 0; i < 8; i++)
      logLines.push(kit.text(40, 308 + i * 21, "", 14, INK, { ox: 0, depth: 23 }));
    const clearLog = () => logLines.forEach((t) => t.setText(""));
    logTitle.setVisible(true);
    function lastShownCol() {
      const typedLast = p.f + q.length - 1;
      let last = Math.max(N - 1, typedLast);
      if (p.maxAnnex && typedLast >= N - 1 && q.length < maxDigits) last = typedLast + 1;
      return last;
    }
    function draw() {
      glyphs.forEach((t) => t.setVisible(false));
      board.clear();
      const last = lastShownCol();
      glyph(DX0 - 30, DY, String(d), GOLD, 28).setOrigin(1, 0.5);
      board.lineStyle(3, 0xeaf6ff, 0.9);
      board.lineBetween(DX0 - 22, DY - 24, colX(last) + 24, DY - 24);
      new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(DX0 - 22, DY - 24),
        new Phaser.Math.Vector2(DX0 - 10, DY),
        new Phaser.Math.Vector2(DX0 - 24, DY + 22),
      ).draw(board, 12);
      for (let i = 0; i <= last; i++) {
        const annexed = i >= N;
        glyph(colX(i), DY, annexed ? "0" : String(p.dd[i]), annexed ? "#ffb35c" : INK);
        // Quotient slots.
        if (i < p.f) {
          if (i >= p.intLen - 1) glyph(colX(i), QY, "0", "#5f8296");
          continue;
        }
        const j = i - p.f;
        const v = q[j];
        const cursor = j === q.length && j < maxDigits;
        board
          .fillStyle(cursor ? 0x15344a : 0x0c2232, 1)
          .fillRoundedRect(colX(i) - 16, QY - 20, 32, 40, 7);
        board.lineStyle(cursor ? 3 : 1.5, cursor ? 0xffd76a : annexed ? 0xffb35c : 0x5e92b3, 1);
        board.strokeRoundedRect(colX(i) - 16, QY - 20, 32, 40, 7);
        if (v !== undefined) glyph(colX(i), QY, String(v), GOLD);
      }
      if (hasPoint) {
        const px = colX(p.intLen) - CWD / 2 - PTG / 2;
        board
          .fillStyle(0xffd76a, 1)
          .fillCircle(px, DY + 12, 4)
          .fillCircle(px, QY + 12, 4);
      }
    }
    // Mailbags on the right.
    kit.panel(504, 140, 292, 236, { fill: PANEL, alpha: 0.55 });
    const bagsG = scene.add.graphics().setDepth(22);
    const shown = Math.min(d, 8);
    const bagX = (i) => 530 + (i % 4) * 64;
    const bagY = (i) => 230 + Math.floor(i / 4) * 78;
    kit.text(650, 160, api.t(L(`${d} bags`, `${d} bolsas`)), 15, GOLD, { weight: "800" });
    if (d > shown)
      kit.text(650, 356, api.t(L(`(8 of ${d} shown)`, `(se ven 8 de ${d})`)), 12, "#8fb7cc");
    const light = scene.add.circle(770, 162, 9, 0x5e92b3).setDepth(23);
    function drawBags(level, color) {
      bagsG.clear();
      for (let i = 0; i < shown; i++) {
        const x = bagX(i) + 14;
        const y = bagY(i);
        bagsG.fillStyle(0x6b5232, 1).fillRoundedRect(x - 20, y - 26, 40, 52, 10);
        if (level > 0.05)
          bagsG.fillStyle(color, 1).fillRoundedRect(x - 16, y + 22 - 44 * level, 32, 44 * level, 6);
        bagsG.lineStyle(2, 0xd9b77a, 1).strokeRoundedRect(x - 20, y - 26, 40, 52, 10);
        bagsG.fillStyle(0xd9b77a, 1).fillRect(x - 8, y - 32, 16, 8);
      }
    }
    drawBags(0, 0xffd76a);
    function type(key) {
      if (!/^[0-9]$/.test(key) || q.length >= maxDigits) return;
      q.push(Number(key));
      api.sfx.tap();
      clearLog();
      drawBags(0, 0xffd76a);
      light.setFillStyle(0x5e92b3);
      draw();
      api.refresh();
    }
    function erase() {
      if (!q.length) return;
      q.pop();
      clearLog();
      draw();
      api.refresh();
    }
    M.typeDigits(kit, type);
    M.pad(scene, kit, (k) => (k === "Backspace" ? erase() : type(k)), false);
    draw();
    const lineFor = (s) =>
      `${s.cur} ÷ ${d} → ${s.q}:  ${s.q} × ${d} = ${s.prod},  ${s.cur} − ${s.prod} = ${s.rem}`;
    async function playLog(steps, fail) {
      clearLog();
      for (let j = 0; j < steps.length && j < logLines.length; j++) {
        const s = steps[j];
        const bad = fail && fail.j === j;
        let text = lineFor(s);
        if (bad && s.prod > s.cur)
          text = api.t(
            L(
              `${s.q} × ${d} = ${s.prod}, more than ${s.cur}: JAM!`,
              `${s.q} × ${d} = ${s.prod}, más que ${s.cur}: ¡ATASCO!`,
            ),
          );
        else if (bad)
          text += api.t(L(`  (${s.rem} ≥ ${d}: JAM!)`, `  (${s.rem} ≥ ${d}: ¡ATASCO!)`));
        logLines[j].setText(text).setColor(bad ? "#ff8a5c" : s.annexed ? "#ffb35c" : INK);
        api.sfx.tick(j * 2);
        drawBags((j + 1) / Math.max(steps.length, 1), 0xffd76a);
        await kit.wait(380);
      }
    }
    async function success(steps) {
      await playLog(steps, null);
      light.setFillStyle(0x7ee36d);
      drawBags(1, 0x7ee36d);
      kit.burst(650, 250, 0x75e0ff, 26);
      api.sfx.whoosh();
    }
    const firstCur = (() => {
      let v = 0;
      for (let i = 0; i <= p.f; i++) v = v * 10 + p.dd[i];
      return v;
    })();
    const qText = () => {
      const digits = [];
      for (let i = 0; i < p.f; i++) if (i >= p.intLen - 1) digits.push({ i, v: 0 });
      q.forEach((v, j) => digits.push({ i: p.f + j, v }));
      return digits.map((x) => (hasPoint && x.i === p.intLen ? "." : "") + x.v).join("") || "—";
    };
    return {
      checkLabel: L("Run the sorter", "Encender"),
      actions: [M.eraseAction(erase)],
      status: () => L(`Quotient so far: ${qText()}`, `Cociente hasta ahora: ${qText()}`),
      hints: [
        variant === "dec"
          ? L(
              `Divide, multiply, subtract, bring down. Each digit says how many ${d}s fit. If something is left at the end, annex a zero and keep going.`,
              `Divide, multiplica, resta, baja. Cada dígito dice cuántos ${d} caben. Si algo sobra al final, agrega un cero y sigue.`,
            )
          : L(
              `Divide, multiply, subtract, bring down. Each digit says how many ${d}s fit in the part you are looking at.`,
              `Divide, multiplica, resta, baja. Cada dígito dice cuántos ${d} caben en la parte que miras.`,
            ),
        L(
          `Start with ${firstCur}: how many ${d}s fit in ${firstCur}? Write that digit above the ${p.dd[p.f]}. Then subtract and bring down the next digit.`,
          `Empieza con ${firstCur}: ¿cuántos ${d} caben en ${firstCur}? Escribe ese dígito sobre el ${p.dd[p.f]}. Luego resta y baja el siguiente dígito.`,
        ),
      ],
      async check() {
        const res = judgeSorter(p, q);
        if (res.incomplete) {
          return {
            ok: false,
            incomplete: true,
            feedback: q.length
              ? L(
                  "Keep going: there are still digits to bring down.",
                  "Sigue: todavía hay dígitos para bajar.",
                )
              : L(
                  "Type the first digit of the quotient.",
                  "Escribe el primer dígito del cociente.",
                ),
          };
        }
        if (res.ok) {
          await success(res.sim.steps);
          return { ok: true };
        }
        await playLog(res.sim.steps, res.sim.fail);
        light.setFillStyle(0xff8a5c);
        drawBags(0.15, 0xff8a5c);
        kit.shake(0.005, 220);
        api.sfx.miss();
        const s = res.sim.fail ? res.sim.steps[res.sim.fail.j] : null;
        const fb = {
          zeroSkip: L(
            `The sorter jams at ${s?.cur}: it is smaller than ${d}, so no bag gets a full share there. How many ${d}s fit in ${s?.cur}?`,
            `La máquina se atasca en ${s?.cur}: es menor que ${d}, así que ninguna bolsa recibe una parte entera ahí. ¿Cuántos ${d} caben en ${s?.cur}?`,
          ),
          digitHigh: L(
            `The sorter jams: ${s?.q} × ${d} is more than ${s?.cur}. That quotient digit is too big.`,
            `La máquina se atasca: ${s?.q} × ${d} es más que ${s?.cur}. Ese dígito del cociente es muy grande.`,
          ),
          digitLow: L(
            `The sorter jams: after that step ${s?.rem} is left, and ${s?.rem} is ${d} or more. Each bag could take more. That digit is too small.`,
            `La máquina se atasca: después de ese paso quedan ${s?.rem}, y ${s?.rem} es ${d} o más. Cada bolsa puede llevar más. Ese dígito es muy pequeño.`,
          ),
          annexZero: L(
            `${res.sim.rem} is still on the dock. Do not stop with a remainder: annex a zero after the last digit and keep dividing.`,
            `Todavía quedan ${res.sim.rem} en el muelle. No te detengas con residuo: agrega un cero después del último dígito y sigue dividiendo.`,
          ),
        }[res.tag];
        return { ok: false, misconception: res.tag, feedback: fb };
      },
      async demo() {
        q = [];
        clearLog();
        draw();
        const digits = truthDigits(p);
        for (const v of digits) {
          q.push(v);
          draw();
          const sim = simSorter(p, q);
          const s = sim.steps[sim.steps.length - 1];
          logLines[q.length - 1]?.setText(lineFor(s)).setColor(s.annexed ? "#ffb35c" : INK);
          api.sfx.tick(q.length * 2);
          await kit.wait(620);
        }
        light.setFillStyle(0x7ee36d);
        drawBags(1, 0x7ee36d);
        kit.burst(650, 250, 0x75e0ff, 26);
      },
      explain: () =>
        variant === "dec"
          ? L(
              `${p.dividend} ÷ ${d} = ${p.truth}. The point goes straight up, and the annexed zeros let the division finish.`,
              `${p.dividend} ÷ ${d} = ${p.truth}. El punto sube derecho, y los ceros agregados dejan terminar la división.`,
            )
          : L(
              `${p.dividend} ÷ ${d} = ${p.truth}. Every step was divide, multiply, subtract, bring down.`,
              `${p.dividend} ÷ ${d} = ${p.truth}. Cada paso fue dividir, multiplicar, restar y bajar.`,
            ),
    };
  }

  /* ── crates builder ───────────────────────────────────────────────────── */
  function crates(scene, api) {
    const { kit, rng } = api;
    const p = genCrates(rng, api.tier);
    const t = D(p.truth);
    let ans = "";
    let k = 0; // how many places both points have moved
    api.setBrief(
      L(
        `The cargo hold is ${p.a} m long. Each crate is ${p.c} m long. How many crates fit end to end, with no gap?`,
        `La bodega mide ${p.a} m de largo. Cada caja mide ${p.c} m. ¿Cuántas cajas caben una tras otra, sin espacio?`,
      ),
    );
    const HX0 = 60;
    const HX1 = 700;
    const HY = 202;
    const scale = (HX1 - HX0) / num(D(p.a));
    const hold = scene.add.graphics().setDepth(20);
    hold.fillStyle(PANEL, 0.75).fillRoundedRect(24, 140, 772, 122, 14);
    hold.fillStyle(0x3b2b1e, 1).fillRoundedRect(HX0 - 10, HY - 34, HX1 - HX0 + 20, 64, 10);
    hold.fillStyle(0x15232e, 1).fillRect(HX0, HY - 26, HX1 - HX0, 48);
    hold.lineStyle(3, 0xeaf6ff, 0.9).lineBetween(HX1, HY - 40, HX1, HY + 34);
    const whole = Math.floor(num(D(p.a)));
    const tickEvery = whole > 20 ? 5 : whole > 10 ? 2 : 1;
    for (let m = 0; m <= whole; m += tickEvery) {
      hold
        .lineStyle(2, 0x9fd6ff, 0.6)
        .lineBetween(HX0 + m * scale, HY + 30, HX0 + m * scale, HY + 38);
      kit.text(HX0 + m * scale, HY + 46, String(m), 11, "#9fd6ff", { depth: 21 });
    }
    kit.text(HX1 + 50, HY, `${p.a} m`, 16, GOLD, { weight: "800", depth: 21 });
    kit.text(410, 154, api.t(L("CARGO HOLD", "BODEGA")), 13, "#8fb7cc", {
      weight: "800",
      depth: 21,
    });
    const crateG = scene.add.graphics().setDepth(22);
    const fallers = [];
    // Equation card: the student can move both decimal points (×10) before dividing.
    kit.panel(24, 270, 476, 204, { fill: PANEL, alpha: 0.9 });
    kit.text(40, 288, api.t(L("LOAD PLAN", "PLAN DE CARGA")), 14, GOLD, { ox: 0, weight: "800" });
    const eqText = kit.text(40, 318, "", 22, INK, { ox: 0, weight: "800", depth: 24 });
    const eqNote = kit.text(40, 346, "", 14, "#9fd6ff", {
      ox: 0,
      depth: 24,
      wrap: 440,
      align: "left",
      oy: 0,
    });
    const box = M.entry(scene, kit, 40, 396, 200, api.t(L("crates", "cajas")));
    const shiftBtn = kit.button(370, 420, 200, 44, "", () => movePoints(), { size: 15 });
    function drawEq() {
      const a2 = fmt(shift(D(p.a), k));
      const c2 = fmt(shift(D(p.c), k));
      eqText.setText(k ? `${p.a} ÷ ${p.c} = ${a2} ÷ ${c2}` : `${p.a} ÷ ${p.c}`);
      eqNote.setText(
        k >= p.k
          ? api.t(L("The divisor is a whole number now.", "El divisor ya es un número entero."))
          : api.t(
              L(
                "Move both decimal points to make the divisor whole.",
                "Mueve los dos puntos decimales para que el divisor sea entero.",
              ),
            ),
      );
      shiftBtn.setLabel(api.t(L("×10 both  →", "×10 a los dos  →")));
      shiftBtn.setDisabled(k >= p.k);
    }
    function movePoints() {
      if (k >= p.k) return;
      k++;
      api.sfx.select();
      kit.floatText(260, 308, "×10", GOLD, 20);
      drawEq();
      api.refresh();
    }
    drawEq();
    function clearCrates() {
      crateG.clear();
      while (fallers.length) fallers.pop().destroy();
    }
    function type(key) {
      const next = M.editNumber(ans, key, 3, 3);
      if (next == null) return;
      ans = next;
      api.sfx.tap();
      clearCrates();
      box.set(ans);
      api.refresh();
    }
    M.typeDigits(kit, type);
    M.pad(scene, kit, type, true);
    box.set(ans);
    const cw = num(D(p.c)) * scale;
    // One crate, drawn to the same scale as the hold.
    kit.panel(504, 270, 292, 112, { fill: PANEL, alpha: 0.6 });
    kit.text(650, 290, api.t(L(`1 crate = ${p.c} m`, `1 caja = ${p.c} m`)), 15, GOLD, { weight: "800" });
    const one = scene.add.graphics().setDepth(22);
    one.fillStyle(0xb5834a, 1).fillRect(650 - cw / 2, 316, cw, 44);
    one.lineStyle(2, 0x6b4a2a, 1).strokeRect(650 - cw / 2, 316, cw, 44);
    async function load(n) {
      clearCrates();
      const full = Math.floor(n);
      const part = n - full;
      const drawn = Math.min(full, 48);
      const step = Math.max(20, Math.min(90, 1100 / Math.max(drawn, 1)));
      for (let i = 0; i < drawn; i++) {
        const x = HX0 + i * cw;
        if (x + cw > HX1 + 1) {
          const r = scene.add.rectangle(x + cw / 2, HY - 2, cw - 3, 44, 0xff8a5c).setDepth(23);
          fallers.push(r);
          kit.tween({
            targets: r,
            y: HY + 140,
            angle: 40,
            alpha: 0.4,
            duration: 520,
            ease: "Quad.easeIn",
          });
        } else {
          crateG.fillStyle(0xb5834a, 1).fillRect(x + 1.5, HY - 24, cw - 3, 44);
          crateG.lineStyle(2, 0x6b4a2a, 1).strokeRect(x + 1.5, HY - 24, cw - 3, 44);
          if (cw > 16) crateG.lineBetween(x + 4, HY - 20, x + cw - 4, HY + 16);
        }
        if (i % 2 === 0) api.sfx.tick(Math.min(14, i));
        await kit.wait(step);
      }
      if (part > 0 && full < 48) {
        crateG.fillStyle(0xb5834a, 0.6).fillRect(HX0 + full * cw + 1.5, HY - 24, cw * part - 3, 44);
      }
      if (full > drawn) kit.floatText(HX1 - 40, HY - 50, `+${full - drawn}`, "#ff8a5c", 18);
    }
    return {
      checkLabel: L("Load the crates", "Cargar las cajas"),
      get actions() {
        return [
          {
            key: "x",
            label: L("×10 both numbers", "×10 a los dos números"),
            run: movePoints,
            disabled: k >= p.k,
          },
          M.eraseAction(() => type("Backspace")),
        ];
      },
      status: () =>
        L(
          `Points moved ${k} place${k === 1 ? "" : "s"} · Crates: ${ans || "—"}`,
          `Puntos movidos ${k} lugar${k === 1 ? "" : "es"} · Cajas: ${ans || "—"}`,
        ),
      hints: [
        L(
          "Make the divisor a whole number: move the decimal point in BOTH numbers the same number of places. The quotient stays the same.",
          "Haz que el divisor sea entero: mueve el punto decimal de LOS DOS números el mismo número de lugares. El cociente no cambia.",
        ),
        L(
          `${p.c} × ${10 ** p.k} = ${fmt(shift(D(p.c), p.k))}. Multiply ${p.a} by ${10 ** p.k} too, then divide.`,
          `${p.c} × ${10 ** p.k} = ${fmt(shift(D(p.c), p.k))}. Multiplica ${p.a} por ${10 ** p.k} también y luego divide.`,
        ),
      ],
      async check() {
        if (!D(ans)) {
          return {
            ok: false,
            incomplete: true,
            feedback: L("Type how many crates fit.", "Escribe cuántas cajas caben."),
          };
        }
        const res = judgeCrates(p, ans);
        const n = num(D(ans));
        await load(n);
        if (res.ok) {
          box.set(ans, "good");
          kit.burst(HX1, HY, 0x7ee36d, 24);
          return { ok: true };
        }
        box.set(ans, "bad");
        const high = cmp(D(ans), t) > 0;
        if (!high && n * cw < HX1 - HX0) {
          crateG
            .fillStyle(0xff8a5c, 0.25)
            .fillRect(HX0 + Math.min(n, 48) * cw, HY - 24, HX1 - HX0 - Math.min(n, 48) * cw, 44);
        }
        kit.shake(0.004, 180);
        const world = high
          ? L(
              "Too many: crates fall off the end of the hold. ",
              "Demasiadas: las cajas se caen por el final de la bodega. ",
            )
          : L(
              "Too few: a gap is left in the hold and the cargo slides. ",
              "Muy pocas: queda un espacio en la bodega y la carga se mueve. ",
            );
        const why = {
          pointPlace: L(
            "The digits are right, but the decimal point is in the wrong place. Move BOTH points the same number of places.",
            "Los dígitos están bien, pero el punto decimal está en otro lugar. Mueve LOS DOS puntos el mismo número de lugares.",
          ),
          multiplied: L(
            "You multiplied. To find how many crates fit, divide.",
            "Multiplicaste. Para saber cuántas cajas caben, divide.",
          ),
          inverted: L(
            "You divided the crate by the hold. Divide the hold length by the crate length.",
            "Dividiste la caja entre la bodega. Divide el largo de la bodega entre el largo de la caja.",
          ),
          divideSmaller: L(
            "Each crate is shorter than 1 m, so more crates fit than the number of meters.",
            "Cada caja mide menos de 1 m, así que caben más cajas que el número de metros.",
          ),
          divDec: L("Check your division again.", "Revisa tu división otra vez."),
        }[res.tag];
        return {
          ok: false,
          misconception: res.tag,
          feedback: L(world.en + why.en, world.es + why.es),
        };
      },
      async demo() {
        ans = "";
        k = 0;
        clearCrates();
        drawEq();
        box.set(ans);
        while (k < p.k) {
          await kit.wait(700);
          movePoints();
        }
        await kit.wait(800);
        for (const ch of p.truth) {
          ans += ch;
          box.set(ans);
          await kit.wait(220);
        }
        await load(num(t));
        box.set(ans, "good");
      },
      explain: () =>
        L(
          `${p.a} ÷ ${p.c} = ${fmt(shift(D(p.a), p.k))} ÷ ${fmt(shift(D(p.c), p.k))} = ${p.truth}. Moving both points the same way keeps the quotient the same.`,
          `${p.a} ÷ ${p.c} = ${fmt(shift(D(p.a), p.k))} ÷ ${fmt(shift(D(p.c), p.k))} = ${p.truth}. Mover los dos puntos igual no cambia el cociente.`,
        ),
    };
  }

  Object.assign(M, { sorter, crates });
  Object.assign(M.math, { genSorter, simSorter, judgeSorter, truthDigits, genCrates, judgeCrates });
})();
