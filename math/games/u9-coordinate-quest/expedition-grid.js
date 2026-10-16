/* Atlas Rover — coordinate-plane builders (chapters 2 and 3).
 *
 *   nav     the rover drives EXACTLY where the student's ordered pairs say.
 *           plot   pairs are given; place a beacon at each (tier 3: halves)
 *           read   beacons are on the map; type each pair into the rover's program
 *           mirror a path is given; place its reflection across the named axis
 *   (survey, the distance builder, is in expedition-survey.js.)
 *
 * A wrong program is shown, not just marked: the rover parks at the wrong crater, the
 * battery dies short, it rolls past the beacon, the relay ring will not close.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.CQ_MATH;
  const UI = window.CQ_MISSIONS;
  if (!X || !M || !UI) return;
  const { L, num, pair, same } = M;
  const { PANEL, GOOD, BAD, ICE } = UI;
  const AXIS = L("axis", "eje");
  const axisName = (a) => (a === "x" ? L("x-axis", "eje x") : L("y-axis", "eje y"));

  /* ── The planet-surface grid ─────────────────────────────────────────── */
  function grid(scene, api, R, step, opts = {}) {
    const { kit } = api;
    const CX = 200;
    const CY = 302;
    const CELL = 25;
    const px = (x) => CX + x * CELL;
    const py = (y) => CY - y * CELL;
    const g = scene.add.graphics().setDepth(18);
    g.fillStyle(PANEL, 0.9).fillRoundedRect(
      px(-R) - 16,
      py(R) - 16,
      2 * R * CELL + 32,
      2 * R * CELL + 32,
      12,
    );
    if (step < 1)
      for (let v = -R + 0.5; v < R; v += 1) {
        g.lineStyle(1, 0xffffff, 0.05);
        g.lineBetween(px(v), py(-R), px(v), py(R));
        g.lineBetween(px(-R), py(v), px(R), py(v));
      }
    for (let v = -R; v <= R; v++) {
      g.lineStyle(1, 0xffffff, v === 0 ? 0 : 0.13);
      g.lineBetween(px(v), py(-R), px(v), py(R));
      g.lineBetween(px(-R), py(v), px(R), py(v));
      if (v !== 0) {
        kit.text(px(v), py(0) + 11, num(v), 10, "#cdb8ae", { depth: 19 });
        kit.text(px(0) - 6, py(v), num(v), 10, "#cdb8ae", { depth: 19, ox: 1 });
      }
    }
    kit.text(px(0) - 6, py(0) + 11, "0", 10, "#ffd76a", { depth: 19, ox: 1 });
    const hl = opts.mirror;
    g.lineStyle(hl === "x" ? 5 : 3, hl === "x" ? 0x7fd8ff : 0xe9e4dc, 0.9).lineBetween(
      px(-R),
      py(0),
      px(R),
      py(0),
    );
    g.lineStyle(hl === "y" ? 5 : 3, hl === "y" ? 0x7fd8ff : 0xe9e4dc, 0.9).lineBetween(
      px(0),
      py(-R),
      px(0),
      py(R),
    );
    kit.text(px(R) + 8, py(0) - 9, "x", 14, "#ffe9a8", { weight: "900", depth: 19 });
    kit.text(px(0) + 10, py(R) - 4, "y", 14, "#ffe9a8", { weight: "900", depth: 19 });
    ["I", "II", "III", "IV"].forEach((q, i) => {
      const sx = i === 0 || i === 3 ? 1 : -1;
      const sy = i < 2 ? 1 : -1;
      kit
        .text(px(sx * R * 0.72), py(sy * R * 0.84), q, 15, "#ffffff", { depth: 18, weight: "900" })
        .setAlpha(0.16);
    });
    // Craters for flavour (decor only, kept off the axes).
    [
      [-4.3, 2.6, 9],
      [3.4, -4.4, 12],
      [4.6, 3.7, 7],
      [-2.4, -3.3, 8],
    ].forEach(([x, y, r]) => {
      g.fillStyle(0x000000, 0.18).fillCircle(px(x), py(y), r);
      g.lineStyle(1, 0xffb681, 0.18).strokeCircle(px(x), py(y), r);
    });
    const zone = scene.add
      .zone(CX, CY, 2 * R * CELL + 24, 2 * R * CELL + 24)
      .setInteractive({ useHandCursor: true })
      .setDepth(24);
    const snap = (p) => ({
      x: Math.max(-R, Math.min(R, Math.round((p.x - CX) / CELL / step) * step)),
      y: Math.max(-R, Math.min(R, Math.round((CY - p.y) / CELL / step) * step)),
    });
    return { px, py, zone, snap, R, step, CELL };
  }
  /** Drive x first (across), then y (up/down) — the order an ordered pair is read. */
  async function drive(kit, G, rv, to, from) {
    const f = from || { x: (rv.x - G.px(0)) / G.CELL, y: (G.py(0) - rv.y) / G.CELL };
    const dx = Math.abs(to.x - f.x);
    const dy = Math.abs(to.y - f.y);
    if (dx) await UI.move(kit, rv, { x: G.px(to.x) }, 140 + 70 * dx);
    if (dy) await UI.move(kit, rv, { y: G.py(to.y) }, 140 + 70 * dy);
  }
  const clampR = (v, R) => Math.max(-R - 0.6, Math.min(R + 0.6, v));

  /** Bilingual feedback for one point verdict. who = beacon label; typed = keyboard program. */
  function pointFeedback(r, who, s, opts = {}) {
    const ax = opts.axis ? axisName(opts.axis) : AXIS;
    const other = opts.axis ? axisName(opts.axis === "x" ? "y" : "x") : AXIS;
    return {
      swapXY: L(
        `${who}: the rover parked at ${pair(s.x, s.y)} — x and y are switched. The first number moves across, the second moves up or down.`,
        `${who}: el róver se detuvo en ${pair(s.x, s.y)}; x e y están al revés. El primer número mueve a lo ancho, el segundo hacia arriba o abajo.`,
      ),
      signX: L(
        `${who}: the rover went the wrong way across. Negative x means LEFT of 0. Positive x means RIGHT.`,
        `${who}: el róver fue al lado equivocado. x negativo es a la IZQUIERDA de 0. x positivo es a la DERECHA.`,
      ),
      signY: L(
        `${who}: the rover went the wrong way up or down. Negative y means DOWN. Positive y means UP.`,
        `${who}: el róver fue hacia arriba o abajo al revés. y negativo es hacia ABAJO. y positivo es hacia ARRIBA.`,
      ),
      bothSigns: opts.axis
        ? L(
            `${who}: both signs changed. A reflection across ONE axis changes only ONE sign.`,
            `${who}: cambiaron los dos signos. Una reflexión sobre UN eje cambia solo UN signo.`,
          )
        : L(
            `${who}: both directions are flipped. Check the sign of x (left or right) and of y (down or up).`,
            `${who}: las dos direcciones están al revés. Revisa el signo de x (izquierda o derecha) y de y (abajo o arriba).`,
          ),
      notMoved: L(
        `${who} is on top of the original point. Its image belongs on the other side of the ${ax.en}.`,
        `${who} está encima del punto original. Su imagen va del otro lado del ${ax.es}.`,
      ),
      wrongAxis: L(
        `${who}: that mirror is across the ${other.en}. This path reflects across the ${ax.en}.`,
        `${who}: ese reflejo es sobre el ${other.es}. Este camino se refleja sobre el ${ax.es}.`,
      ),
      offByOne: L(
        `${who}: so close — one step off. Count from 0 along each axis again.`,
        `${who}: ¡muy cerca! Un paso de diferencia. Cuenta otra vez desde 0 en cada eje.`,
      ),
      misplot: L(
        `${who}: the rover reached ${pair(s.x, s.y)} and found no signal. Read the ordered pair again: x first, then y.`,
        `${who}: el róver llegó a ${pair(s.x, s.y)} y no encontró señal. Lee otra vez el par ordenado: primero x, luego y.`,
      ),
      notRectangle: L(
        `Tower D at ${pair(s.x, s.y)} does not close a rectangle. D must line up with A and with C.`,
        `La torre D en ${pair(s.x, s.y)} no cierra un rectángulo. D debe alinearse con A y con C.`,
      ),
    }[r.tag];
  }
  /** Small coordinate label beside a point, nudged inside the grid. */
  function tag(kit, G, pt, text, color, depth = 27) {
    const right = pt.x <= 2;
    return kit.text(G.px(pt.x) + (right ? 10 : -10), G.py(pt.y) - 12, text, 12, color, {
      ox: right ? 0 : 1,
      weight: "800",
      depth,
      stroke: "#0b0710",
      strokeWidth: 4,
    });
  }

  /* ── nav ──────────────────────────────────────────────────────────────── */
  function nav(scene, api) {
    const { kit } = api;
    const variant = api.mission.variant || "plot";
    const p = M.genNav(api.rng, api.tier, variant);
    const k = p.targets.length;
    const names =
      variant === "mirror" ? p.src.map((_, i) => `P${i + 1}′`) : p.targets.map((_, i) => "ABC"[i]);
    const G = grid(scene, api, p.R, p.step, { mirror: p.axis });
    const briefs = {
      plot: L(
        `Drop a signal beacon at each point in the rover's orders${p.step < 1 ? " (some are halfway between grid lines)" : ""}. The rover drives exactly where you put them.`,
        `Coloca una baliza en cada punto de las órdenes${p.step < 1 ? " (algunos están a mitad de camino entre líneas)" : ""}. El róver va exactamente adonde las pongas.`,
      ),
      read: L(
        "Two beacons are calling from the craters. Type each beacon's ordered pair into the rover's program.",
        "Dos balizas llaman desde los cráteres. Escribe el par ordenado de cada baliza en el programa del róver.",
      ),
      mirror: L(
        `The twin rover must drive the mirror path across the ${axisName(p.axis).en}. Place the image of each point.`,
        `El róver gemelo debe seguir el camino reflejado sobre el ${axisName(p.axis).es}. Coloca la imagen de cada punto.`,
      ),
    };
    api.setBrief(briefs[variant]);
    const rv = UI.rover(scene, kit, G.px(0), G.py(0) - 4, 0.75);
    rv.setDepth(29);
    const marks = scene.add.graphics().setDepth(26);
    const temp = [];
    const placed = [];
    let cur = { x: 0, y: 0 };
    // Right panel.
    kit.panel(380, 146, 414, variant === "read" ? 286 : 300, { fill: PANEL, alpha: 0.92 });
    kit.text(587, 168, api.t(L("ROVER PROGRAM", "PROGRAMA DEL RÓVER")), 14, "#ffd76a", {
      weight: "800",
    });
    const rows = [];
    let f = null;
    if (variant === "read") {
      p.targets.forEach((t, i) => {
        const y = 222 + i * 70;
        kit.text(410, y, names[i], 24, "#ffb681", { weight: "900" });
        kit.text(470, y, "(", 30, "#f3e6dd", { weight: "700" });
        kit.text(588, y + 4, ",", 28, "#f3e6dd", { weight: "700" });
        kit.text(706, y, ")", 30, "#f3e6dd", { weight: "700" });
        tag(kit, G, t, names[i], "#ffb681");
        marks.fillStyle(0xffb681, 1).fillCircle(G.px(t.x), G.py(t.y), 7);
        marks.lineStyle(2, 0xffffff, 1).strokeCircle(G.px(t.x), G.py(t.y), 7);
        kit.glow(G.px(t.x), G.py(t.y), 50, 0xffb681, 0.6, 25);
      });
      kit.text(587, 372, api.t(L("x first, then y", "primero x, luego y")), 14, "#bfa89f");
      f = UI.fields(
        scene,
        api,
        p.targets.flatMap((_, i) => [
          { x: 530, y: 222 + i * 70, w: 96 },
          { x: 648, y: 222 + i * 70, w: 96 },
        ]),
      );
    } else {
      p.targets.forEach((t, i) => {
        const y = 210 + i * 58;
        kit.text(400, y, names[i], 22, "#ffb681", { weight: "900", ox: 0 });
        const what =
          variant === "mirror"
            ? L(
                `image of P${i + 1} ${pair(p.src[i].x, p.src[i].y)}`,
                `imagen de P${i + 1} ${pair(p.src[i].x, p.src[i].y)}`,
              )
            : L(pair(t.x, t.y), pair(t.x, t.y));
        kit.text(446, y, api.t(what), variant === "mirror" ? 16 : 22, "#f3e6dd", {
          weight: "800",
          ox: 0,
        });
        rows.push(kit.text(780, y, "", 18, "#ffd76a", { ox: 1, weight: "900" }));
      });
      if (variant === "mirror")
        p.src.forEach((s, i) => {
          marks.fillStyle(ICE, 1).fillCircle(G.px(s.x), G.py(s.y), 6);
          tag(kit, G, s, `P${i + 1}`, "#7fd8ff");
        });
      if (variant === "mirror")
        for (let i = 1; i < p.src.length; i++) {
          marks
            .lineStyle(2, ICE, 0.5)
            .lineBetween(
              G.px(p.src[i - 1].x),
              G.py(p.src[i - 1].y),
              G.px(p.src[i].x),
              G.py(p.src[i].y),
            );
        }
      kit.text(
        587,
        418,
        api.t(
          L("Arrows move · Space drops or lifts a beacon", "Flechas mueven · Espacio pone o quita"),
        ),
        13,
        "#bfa89f",
      );
    }
    const cursor = scene.add.graphics().setDepth(28);
    const beacons = scene.add.graphics().setDepth(27);
    const beaconLabels = [];
    function draw() {
      beacons.clear();
      beaconLabels.splice(0).forEach((o) => o.destroy());
      placed.forEach((pt, i) => {
        beacons.fillStyle(0x000000, 0.5).fillCircle(G.px(pt.x), G.py(pt.y) + 2, 8);
        beacons.fillStyle(0xffd76a, 1).fillCircle(G.px(pt.x), G.py(pt.y), 7);
        beacons.lineStyle(2, 0xffffff, 1).strokeCircle(G.px(pt.x), G.py(pt.y), 7);
        beaconLabels.push(tag(kit, G, pt, names[i], "#ffd76a", 28));
      });
      rows.forEach((r, i) => r.setText(placed[i] ? "●" : i === placed.length ? "◀" : ""));
      cursor.clear();
      if (variant !== "read") {
        cursor.lineStyle(3, 0x7be0c8, 1).strokeRect(G.px(cur.x) - 10, G.py(cur.y) - 10, 20, 20);
      }
    }
    function moveCur(dx, dy) {
      cur = {
        x: Math.max(-p.R, Math.min(p.R, cur.x + dx * p.step)),
        y: Math.max(-p.R, Math.min(p.R, cur.y + dy * p.step)),
      };
      api.sfx.tick(Math.round((cur.x + cur.y + 12) / p.step) % 12);
      draw();
      api.refresh();
    }
    function toggle() {
      const i = placed.findIndex((q) => same(q.x, cur.x) && same(q.y, cur.y));
      if (i >= 0) placed.splice(i, 1);
      else if (placed.length < k) placed.push({ ...cur });
      else {
        api.feedback(
          L(
            "Every beacon is placed. Stand on one and press Space to lift it.",
            "Todas las balizas están puestas. Párate en una y presiona Espacio para quitarla.",
          ),
          "info",
        );
        return;
      }
      api.sfx.place();
      draw();
      api.refresh();
    }
    if (variant !== "read") {
      G.zone.on("pointerdown", (ptr) => {
        cur = G.snap(ptr);
        toggle();
      });
      kit.onType((key) => {
        if (key === "Backspace" && placed.length) {
          placed.pop();
          draw();
          api.refresh();
        }
      });
    }
    draw();
    const points = () =>
      variant === "read"
        ? p.targets.map((_, i) => ({ x: f.nums()[2 * i], y: f.nums()[2 * i + 1] }))
        : placed.slice();
    async function run(pts) {
      temp.splice(0).forEach((o) => o.destroy());
      rv.setPosition(G.px(0), G.py(0) - 4);
      const r = M.judgeRoute(p, pts);
      const upto = r.ok ? k : r.at + 1;
      let from = { x: 0, y: 0 };
      for (let i = 0; i < upto; i++) {
        const to = { x: clampR(pts[i].x, p.R), y: clampR(pts[i].y, p.R) };
        await drive(kit, G, rv, to, from);
        from = to;
        const hit = r.ok || i < r.at;
        const x = G.px(to.x);
        const y = G.py(to.y);
        if (hit) {
          temp.push(kit.glow(x, y, 60, GOOD, 0.7, 26));
          kit.burst(x, y, GOOD, 14);
          api.sfx.select();
          if (variant === "mirror") {
            const s = p.src[i];
            const fold = scene.add.graphics().setDepth(25);
            fold.lineStyle(2, ICE, 0.7).lineBetween(G.px(s.x), G.py(s.y), x, y);
            temp.push(fold);
          }
        } else {
          temp.push(kit.text(x, y + 16, "✕", 20, "#ff7a5c", { weight: "900", depth: 30 }));
          kit.shake(0.004, 150);
        }
        await kit.wait(200);
      }
      return r;
    }
    const t0 = p.targets[0];
    const qName = (pt) =>
      ["", "I", "II", "III", "IV"][pt.x > 0 ? (pt.y > 0 ? 1 : 4) : pt.y > 0 ? 2 : 3];
    const sideWord = (v, en, es) => L(v < 0 ? en[0] : en[1], v < 0 ? es[0] : es[1]);
    const hints = {
      plot: [
        L(
          "Start at (0, 0). The first number (x) moves across: right if positive, left if negative. The second number (y) moves up if positive, down if negative.",
          "Empieza en (0, 0). El primer número (x) mueve a lo ancho: a la derecha si es positivo, a la izquierda si es negativo. El segundo (y) sube si es positivo y baja si es negativo.",
        ),
        L(
          `Beacon A is ${pair(t0.x, t0.y)}. Which way does ${num(t0.x)} move you first? Then which way does ${num(t0.y)} move you?`,
          `La baliza A es ${pair(t0.x, t0.y)}. ¿Hacia dónde te mueve primero ${num(t0.x)}? ¿Y luego ${num(t0.y)}?`,
        ),
      ],
      read: [
        L(
          "For x, look straight up or down from the beacon to the x-axis. For y, look straight across to the y-axis. Left and down are negative.",
          "Para x, mira derecho hacia arriba o abajo desde la baliza hasta el eje x. Para y, mira derecho hacia el eje y. Izquierda y abajo son negativos.",
        ),
        L(
          `Beacon A is in Quadrant ${qName(t0)}. There x is ${t0.x < 0 ? "negative" : "positive"} and y is ${t0.y < 0 ? "negative" : "positive"}.`,
          `La baliza A está en el cuadrante ${qName(t0)}. Ahí x es ${t0.x < 0 ? "negativo" : "positivo"} e y es ${t0.y < 0 ? "negativo" : "positivo"}.`,
        ),
      ],
      mirror: (() => {
        if (!p.src) return [];
        const s = p.src[0];
        const d = p.axis === "x" ? Math.abs(s.y) : Math.abs(s.x);
        const where =
          p.axis === "x"
            ? sideWord(s.y, ["below", "above"], ["debajo del", "encima del"])
            : sideWord(s.x, ["left of", "right of"], ["a la izquierda del", "a la derecha del"]);
        return [
          p.axis === "x"
            ? L(
                "Across the x-axis, a point keeps its x. Its y changes sign: it lands the same distance on the other side.",
                "Sobre el eje x, el punto conserva su x. Su y cambia de signo: queda a la misma distancia del otro lado.",
              )
            : L(
                "Across the y-axis, a point keeps its y. Its x changes sign: it lands the same distance on the other side.",
                "Sobre el eje y, el punto conserva su y. Su x cambia de signo: queda a la misma distancia del otro lado.",
              ),
          L(
            `P1 is ${d} ${d === 1 ? "unit" : "units"} ${where.en} the ${axisName(p.axis).en}. P1′ is ${d} ${d === 1 ? "unit" : "units"} on the other side.`,
            `P1 está a ${d} ${d === 1 ? "unidad" : "unidades"} ${where.es} ${axisName(p.axis).es}. P1′ está a ${d} del otro lado.`,
          ),
        ];
      })(),
    }[variant];
    const navActions = [
      {
        key: "ArrowRight",
        label: L("Cursor right →", "Cursor a la derecha →"),
        run: () => moveCur(1, 0),
      },
      {
        key: "ArrowLeft",
        label: L("← Cursor left", "← Cursor a la izquierda"),
        run: () => moveCur(-1, 0),
      },
      { key: "ArrowUp", label: L("Cursor up ↑", "Cursor arriba ↑"), run: () => moveCur(0, 1) },
      { key: "ArrowDown", label: L("Cursor down ↓", "Cursor abajo ↓"), run: () => moveCur(0, -1) },
      { key: " ", label: L("Drop / lift beacon", "Poner / quitar baliza"), run: () => toggle() },
      {
        key: "Delete",
        label: L("Lift the last beacon", "Quitar la última baliza"),
        run: () => {
          placed.pop();
          draw();
          api.refresh();
        },
      },
    ];
    return {
      checkLabel: L("Drive the rover", "Conducir el róver"),
      actions: variant === "read" ? f.actions : navActions,
      status: () =>
        variant === "read"
          ? L(
              `Program: ${names.map((n, i) => `${n} (${M.display(f.vals[2 * i]) || "?"}, ${M.display(f.vals[2 * i + 1]) || "?"})`).join(", ")}`,
              `Programa: ${names.map((n, i) => `${n} (${M.display(f.vals[2 * i]) || "?"}, ${M.display(f.vals[2 * i + 1]) || "?"})`).join(", ")}`,
            )
          : L(
              `Cursor ${pair(cur.x, cur.y)} · beacons placed ${placed.length} / ${k}`,
              `Cursor ${pair(cur.x, cur.y)} · balizas puestas ${placed.length} / ${k}`,
            ),
      hints,
      async check() {
        const done = variant === "read" ? f.filled() : placed.length === k;
        if (!done)
          return {
            ok: false,
            incomplete: true,
            feedback:
              variant === "read"
                ? L(
                    "Type both numbers for every beacon.",
                    "Escribe los dos números de cada baliza.",
                  )
                : L(`Place all ${k} beacons first.`, `Primero coloca las ${k} balizas.`),
          };
        const pts = points();
        const r = await run(pts);
        if (r.ok) return { ok: true };
        return {
          ok: false,
          misconception: r.tag,
          feedback: pointFeedback(r, names[r.at], pts[r.at], { axis: p.axis }),
        };
      },
      async demo() {
        if (variant === "read") {
          for (let i = 0; i < k; i++) {
            const t = p.targets[i];
            const guide = scene.add.graphics().setDepth(25);
            guide.lineStyle(2, 0xffd76a, 0.8);
            guide.lineBetween(G.px(t.x), G.py(t.y), G.px(t.x), G.py(0));
            guide.lineBetween(G.px(t.x), G.py(t.y), G.px(0), G.py(t.y));
            temp.push(guide);
            await UI.typeOut(kit, f, 2 * i, UI.plain(t.x));
            await UI.typeOut(kit, f, 2 * i + 1, UI.plain(t.y));
            await kit.wait(400);
          }
        } else {
          placed.length = 0;
          for (let i = 0; i < k; i++) {
            const t = p.targets[i];
            if (variant === "mirror")
              kit.floatText(G.px(t.x), G.py(t.y) - 20, pair(t.x, t.y), "#ffd76a", 16);
            while (!same(cur.x, t.x)) {
              moveCur(t.x > cur.x ? 1 : -1, 0);
              await kit.wait(70);
            }
            while (!same(cur.y, t.y)) {
              moveCur(0, t.y > cur.y ? 1 : -1);
              await kit.wait(70);
            }
            toggle();
            await kit.wait(350);
          }
        }
        await run(points());
      },
      explain: () => {
        if (variant === "mirror")
          return L(
            `Across the ${axisName(p.axis).en}, ${p.axis === "x" ? "x stays and y changes sign" : "y stays and x changes sign"}: ${p.src.map((s, i) => `${pair(s.x, s.y)} → ${pair(p.targets[i].x, p.targets[i].y)}`).join(", ")}.`,
            `Sobre el ${axisName(p.axis).es}, ${p.axis === "x" ? "x se queda y y cambia de signo" : "y se queda y x cambia de signo"}: ${p.src.map((s, i) => `${pair(s.x, s.y)} → ${pair(p.targets[i].x, p.targets[i].y)}`).join(", ")}.`,
          );
        return L(
          `${names.map((n, i) => `${n} ${pair(p.targets[i].x, p.targets[i].y)}`).join(", ")}. x tells how far left or right, y tells how far down or up.`,
          `${names.map((n, i) => `${n} ${pair(p.targets[i].x, p.targets[i].y)}`).join(", ")}. x dice cuánto a la izquierda o derecha; y, cuánto abajo o arriba.`,
        );
      },
    };
  }

  Object.assign(UI, { nav, grid, pointFeedback, tag, drive, clampR });
})();
