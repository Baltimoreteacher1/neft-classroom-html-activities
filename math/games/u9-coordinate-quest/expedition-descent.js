/* Atlas Rover — descent builder (chapter 1, compare and order).
 * Survey stakes on a canyon wall: the rover winches itself up, stake to stake, so the
 * stakes must be ordered lowest → highest. A wrong order shows the winch slipping DOWN.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.CQ_MATH;
  const UI = window.CQ_MISSIONS;
  if (!X || !M || !UI) return;
  const { L, show, num } = M;
  const { rover, move, PANEL, GOOD, BAD } = UI;
  /* ── descent: order the stakes lowest → highest; the winch only pulls up ── */
  function descent(scene, api) {
    const { kit } = api;
    const p = M.genOrder(api.rng, api.tier);
    const stakes = p.stakes.slice();
    const n = stakes.length;
    const R = api.tier >= 2 ? 6 : 10;
    api.setBrief(
      L(
        "The rover climbs out of the canyon on its winch, stake to stake. The winch only pulls UP. Put the stakes in order from lowest to highest.",
        "El róver sube del cañón con su torno, de estaca en estaca. El torno solo jala hacia ARRIBA. Ordena las estacas de la más baja a la más alta.",
      ),
    );
    const SX = (i) => 130 + i * 140;
    const CY = 196;
    kit.text(SX(0), 150, api.t(L("LOWEST", "MÁS BAJA")), 13, "#ffd76a", { weight: "800" });
    kit.text(SX(n - 1), 150, api.t(L("HIGHEST", "MÁS ALTA")), 13, "#ffd76a", { weight: "800" });
    const arrow = scene.add.graphics().setDepth(19);
    arrow.lineStyle(2, 0xffd76a, 0.6).lineBetween(SX(0) + 44, 150, SX(n - 1) - 50, 150);
    arrow
      .fillStyle(0xffd76a, 0.8)
      .fillTriangle(SX(n - 1) - 50, 145, SX(n - 1) - 40, 150, SX(n - 1) - 50, 155);
    // Canyon wall profile chart.
    const TOP = 248;
    const BOT = 464;
    const y = (v) => TOP + ((R - v) / (2 * R)) * (BOT - TOP);
    const chart = scene.add.graphics().setDepth(18);
    chart.fillStyle(PANEL, 0.88).fillRoundedRect(40, TOP - 12, 760, BOT - TOP + 24, 12);
    for (let v = -R; v <= R; v += R > 6 ? 5 : 2) {
      chart.lineStyle(1, 0xffffff, v === 0 ? 0 : 0.1).lineBetween(70, y(v), 790, y(v));
      kit.text(62, y(v), num(v), 11, v === 0 ? "#ffd76a" : "#bfa89f", { ox: 1, depth: 19 });
    }
    chart.lineStyle(2, 0xffd76a, 0.6);
    for (let dx = 70; dx < 790; dx += 16) chart.lineBetween(dx, y(0), dx + 8, y(0));
    kit.text(782, y(0) - 10, api.t(L("datum 0", "nivel 0")), 11, "#ffd76a", { ox: 1, depth: 19 });
    const route = scene.add.graphics().setDepth(20);
    const marks = [];
    const rv = rover(scene, kit, 90, y(-R) - 4, 0.9);
    let cur = 0;
    let held = -1;
    const cards = scene.add.graphics().setDepth(22);
    const cardText = stakes.map(() =>
      kit.text(0, CY, "", 26, "#ffffff", { weight: "900", depth: 23 }),
    );
    stakes.forEach((_, i) => {
      scene.add
        .zone(SX(i), CY, 120, 70)
        .setInteractive({ useHandCursor: true })
        .setDepth(24)
        .on("pointerdown", () => {
          cur = i;
          if (held < 0) held = i;
          else {
            swapCards(held, i);
            held = -1;
          }
          api.sfx.select();
          draw();
          api.refresh();
        });
    });
    function swapCards(a, b) {
      [stakes[a], stakes[b]] = [stakes[b], stakes[a]];
    }
    function draw() {
      cards.clear();
      stakes.forEach((s, i) => {
        const lift = i === held ? -10 : 0;
        const x = SX(i);
        cards.fillStyle(0x000000, 0.4).fillRoundedRect(x - 56, CY - 30 + 5, 112, 62, 12);
        cards
          .fillStyle(i === held ? 0x5a3424 : 0x2c1c22, 1)
          .fillRoundedRect(x - 56, CY - 30 + lift, 112, 62, 12);
        cards.lineStyle(i === cur ? 4 : 2, i === cur ? 0xffd76a : 0x8a6a5c, 1);
        cards.strokeRoundedRect(x - 56, CY - 30 + lift, 112, 62, 12);
        cards.fillStyle(0xffb681, 1).fillRect(x - 3, CY - 40 + lift, 6, 12);
        cardText[i].setText(show(s.v, s.style)).setPosition(x, CY + lift);
      });
    }
    function moveCursor(d) {
      const next = Math.max(0, Math.min(n - 1, cur + d));
      if (held >= 0 && next !== cur) {
        swapCards(cur, next);
        held = next;
      }
      cur = next;
      api.sfx.tick(cur * 2);
      draw();
      api.refresh();
    }
    function grab() {
      held = held >= 0 ? -1 : cur;
      api.sfx.select();
      draw();
      api.refresh();
    }
    draw();
    async function climb() {
      route.clear();
      marks.splice(0).forEach((o) => o.destroy());
      let prev = { x: 90, y: y(-R) - 4 };
      rv.setPosition(prev.x, prev.y);
      for (let i = 0; i < n; i++) {
        const sx = SX(i);
        const sy = y(stakes[i].v);
        const down = i > 0 && stakes[i].v < stakes[i - 1].v;
        route.lineStyle(4, down ? BAD : GOOD, 0.9).lineBetween(prev.x, prev.y, sx, sy);
        route.fillStyle(0xffb681, 1).fillRect(sx - 3, sy - 14, 6, 16);
        marks.push(
          kit.text(sx + 8, sy - 14, show(stakes[i].v, stakes[i].style), 13, "#ffe9a8", {
          ox: 0,
          weight: "800",
          depth: 21,
          }),
        );
        await move(kit, rv, { x: sx, y: sy - 4 }, 380);
        api.sfx.tick(i * 3);
        if (down) {
          marks.push(kit.text(sx, sy + 18, "✕", 22, "#ff7a5c", { weight: "900", depth: 26 }));
          kit.shake(0.004, 160);
          return i;
        }
        prev = { x: sx, y: sy };
      }
      kit.burst(SX(n - 1), y(stakes[n - 1].v), GOOD, 24);
      return -1;
    }
    const vals = () => stakes.map((s) => s.v);
    const fmtS = (s) => show(s.v, s.style);
    const sorted = stakes.slice().sort((a, b) => a.v - b.v);
    const negs = sorted.filter((s) => s.v < 0);
    return {
      checkLabel: L("Start the winch", "Arrancar el torno"),
      actions: [
        {
          key: "ArrowRight",
          label: L("Move right →", "Mover a la derecha →"),
          run: () => moveCursor(1),
        },
        {
          key: "ArrowLeft",
          label: L("← Move left", "← Mover a la izquierda"),
          run: () => moveCursor(-1),
        },
        {
          key: " ",
          label: L("Pick up / put down stake", "Tomar / soltar estaca"),
          run: () => grab(),
        },
      ],
      status: () =>
        L(
          `Order: ${stakes.map(fmtS).join(", ")}. Cursor on ${cur + 1}${held >= 0 ? ", holding a stake" : ""}.`,
          `Orden: ${stakes.map(fmtS).join(", ")}. Cursor en ${cur + 1}${held >= 0 ? ", con una estaca" : ""}.`,
        ),
      hints: [
        L(
          "Think of a vertical number line. Higher numbers are higher up. A negative number FARTHER from 0 is LOWER.",
          "Piensa en una recta numérica vertical. Los números mayores están más arriba. Un número negativo MÁS LEJOS de 0 está MÁS ABAJO.",
        ),
        L(
          `Compare ${fmtS(negs[negs.length - 1])} and ${fmtS(negs[0])}. Which one is farther below 0? That one is lower.`,
          `Compara ${fmtS(negs[negs.length - 1])} y ${fmtS(negs[0])}. ¿Cuál está más abajo de 0? Esa es la más baja.`,
        ),
      ],
      async check() {
        held = -1;
        draw();
        const r = M.judgeOrder(vals());
        await climb();
        if (r.ok) return { ok: true };
        const a = stakes[r.at];
        const b = stakes[r.at + 1];
        const fb = {
          reversed: L(
            "The stakes go from highest to lowest. The winch only pulls up: start with the LOWEST.",
            "Las estacas van de la más alta a la más baja. El torno solo jala hacia arriba: empieza con la MÁS BAJA.",
          ),
          absOrder: L(
            "You ordered by distance from 0. Negative numbers farther from 0 are LOWER, not higher.",
            "Ordenaste por distancia desde 0. Los negativos más lejos de 0 están MÁS ABAJO, no más arriba.",
          ),
          negBigger: L(
            `The rover slid down from ${fmtS(a)} to ${fmtS(b)}. ${fmtS(b)} is farther below 0, so it is LOWER.`,
            `El róver se resbaló de ${fmtS(a)} a ${fmtS(b)}. ${fmtS(b)} está más abajo de 0, así que es MÁS BAJA.`,
          ),
          outOfOrder: L(
            `The rover slid down from ${fmtS(a)} to ${fmtS(b)}: ${fmtS(b)} is lower than ${fmtS(a)}.`,
            `El róver se resbaló de ${fmtS(a)} a ${fmtS(b)}: ${fmtS(b)} es más baja que ${fmtS(a)}.`,
          ),
        }[r.tag];
        return { ok: false, misconception: r.tag, feedback: fb };
      },
      async demo() {
        held = -1;
        for (let i = 0; i < n; i++) {
          let m = i;
          for (let j = i + 1; j < n; j++) if (stakes[j].v < stakes[m].v) m = j;
          cur = i;
          if (m !== i) swapCards(i, m);
          draw();
          kit.floatText(
            SX(i),
            CY - 50,
            i === 0 ? api.t(L("lowest", "más baja")) : "<",
            "#ffd76a",
            18,
          );
          api.sfx.tick(i * 3);
          await kit.wait(600);
        }
        await climb();
      },
      explain: () =>
        L(
          `Lowest to highest: ${sorted.map(fmtS).join(" < ")}. A negative number farther from 0 is lower.`,
          `De la más baja a la más alta: ${sorted.map(fmtS).join(" < ")}. Un número negativo más lejos de 0 es menor.`,
        ),
    };
  }


  UI.descent = descent;
})();
