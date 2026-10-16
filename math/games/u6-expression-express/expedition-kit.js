/* Switchyard Odyssey — shared kit for the Expression Express expedition builders:
 * colours, railway art (cars, rails, locomotive), digit entry, substitution display and the
 * route-card stories. Loaded after expedition-math.js and before the builders; everything is
 * published on window.EE_MISSIONS.
 */
(function () {
  "use strict";
  if (!window.EWLExpedition) return;
  const L = (en, es) => ({ en, es });
  const COPPER = 0xffb795;
  const BRASS = 0xffd76a;
  const PANEL = 0x160f1f;
  const STEEL = 0x5b6472;
  const GOOD = 0x7ee3a0;
  const BAD = 0xff8a5c;
  const KIND = { x2: 0xb68cff, x: 0x5fd3c6, c: 0xf2a65a };

  /* ── Shared art ───────────────────────────────────────────────────────── */
  function drawCar(g, cx, top, w, h, color, opts = {}) {
    const sink = opts.sink || 0;
    g.fillStyle(0x0b0710, 0.55).fillRoundedRect(cx - w / 2 + 4, top + 6 + sink, w, h, 8);
    g.fillStyle(color, 1).fillRoundedRect(cx - w / 2, top + sink, w, h, 8);
    g.fillStyle(0xffffff, 0.16).fillRoundedRect(
      cx - w / 2 + 6,
      top + 4 + sink,
      w - 12,
      h * 0.22,
      5,
    );
    g.fillStyle(0x000000, 0.28).fillRect(cx - w / 2, top + h - 8 + sink, w, 8);
    g.fillStyle(0x2a2230, 1);
    [-w / 2 + 18, -w / 2 + 38, w / 2 - 38, w / 2 - 18].forEach((dx) =>
      g.fillCircle(cx + dx, top + h + 6, 9),
    );
    g.fillStyle(0x9aa3ad, 1);
    [-w / 2 + 18, -w / 2 + 38, w / 2 - 38, w / 2 - 18].forEach((dx) =>
      g.fillCircle(cx + dx, top + h + 6, 3.5),
    );
    // Springs: squashed when overloaded.
    g.lineStyle(2, opts.springs || 0xc9cfd6, 1);
    [-w / 2 + 28, w / 2 - 28].forEach((dx) => {
      const y0 = top + h + sink;
      const y1 = top + h - 2;
      g.lineBetween(cx + dx - 6, Math.min(y0, y1), cx + dx + 6, Math.max(y0, y1));
    });
  }
  function drawRails(g, x0, x1, y) {
    g.fillStyle(0x3a2a22, 1);
    for (let x = x0; x < x1; x += 18) g.fillRect(x, y - 2, 10, 9);
    g.lineStyle(3, 0x9aa3ad, 1).lineBetween(x0, y, x1, y);
    g.lineStyle(2, 0x6b7380, 1).lineBetween(x0, y + 5, x1, y + 5);
  }
  /** A small copper locomotive as a container (faces right). */
  function makeLoco(scene, x, y, color = COPPER, depth = 26) {
    const c = scene.add.container(x, y).setDepth(depth);
    const g = scene.add.graphics();
    g.fillStyle(0x0b0710, 0.5).fillRoundedRect(-30, -20, 64, 26, 6);
    g.fillStyle(color, 1).fillRoundedRect(-32, -24, 46, 22, 5);
    g.fillStyle(0x3b2a33, 1).fillRoundedRect(-34, -40, 22, 20, 4);
    g.fillStyle(0xfff2c4, 1).fillRect(-30, -36, 12, 8);
    g.fillStyle(0x3b2a33, 1).fillRect(2, -36, 8, 12);
    g.fillStyle(0x2a2230, 1).fillTriangle(14, -2, 26, -2, 14, -16);
    g.fillStyle(0xfff2c4, 1).fillCircle(14, -16, 3);
    g.fillStyle(0x2a2230, 1);
    [-24, -8, 8].forEach((dx) => g.fillCircle(dx, 0, 7));
    g.fillStyle(0x9aa3ad, 1);
    [-24, -8, 8].forEach((dx) => g.fillCircle(dx, 0, 2.5));
    c.add(g);
    return c;
  }
  /** Digit entry with a 3-character cap. Backspace is routed through the deck action only. */
  function entry(max = 3) {
    return {
      text: "",
      type(key) {
        if (key === "Backspace") this.text = this.text.slice(0, -1);
        else if (/^[0-9]$/.test(key) && this.text.length < max)
          this.text = (this.text + key).replace(/^0+(?=\d)/, "");
        else return false;
        return true;
      },
      get value() {
        return this.text === "" ? null : Number(this.text);
      },
    };
  }
  /** "3x + 2" with x = 4 → "3 × 4 + 2" (substitution shown, never the result). */
  function substitute(text, x) {
    return text
      .replace(/(\d)x/g, `$1 × ${x}`)
      .replace(/(\d)\(/g, "$1 × (")
      .replace(/x/g, String(x));
  }
  /** Round up to a friendly yard length. */

  const STORIES = {
    crates: (p, q) =>
      L(
        `There are x boxcars. Each boxcar carries ${p} crates. The engine carries ${q} more crates. Write the total number of crates.`,
        `Hay x vagones de carga. Cada vagón lleva ${p} cajas. La locomotora lleva ${q} cajas más. Escribe el total de cajas.`,
      ),
    coal: (p, q) =>
      L(
        `There are x coal cars with ${p} tons of coal in each. At the canyon, ${q} tons fall off. Write the tons of coal left.`,
        `Hay x vagones de carbón con ${p} toneladas en cada uno. En el cañón se caen ${q} toneladas. Escribe las toneladas que quedan.`,
      ),
    seats: (p, q) =>
      L(
        `There are x passenger cars with ${p} seats in each. The caboose has ${q} more seats. Write the total number of seats.`,
        `Hay x vagones de pasajeros con ${p} asientos cada uno. El vagón de cola tiene ${q} asientos más. Escribe el total de asientos.`,
      ),
    trains: (g, q) =>
      L(
        `${g} trains leave the terminal. Each train has x passenger cars and ${q} mail cars. Write the total number of cars.`,
        `Salen ${g} trenes de la terminal. Cada tren tiene x vagones de pasajeros y ${q} vagones de correo. Escribe el total de vagones.`,
      ),
  };

  window.EE_MISSIONS = Object.assign(window.EE_MISSIONS || {}, {
    L,
    entry,
    drawCar,
    drawRails,
    makeLoco,
    substitute,
    STORIES,
    COPPER,
    BRASS,
    PANEL,
    STEEL,
    GOOD,
    BAD,
    KIND,
  });
})();
