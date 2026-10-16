/* Atlas Rover — shared board pieces + the number-line builders (chapter 1).
 *
 *   probe    a vertical elevation line at the survey datum (0 m).
 *            variant "opp": plant flag A at a described elevation, flag B at its opposite.
 *            variant "abs": spool two winch cables from the datum; length = absolute value.
 *   (descent, the ordering builder, is in expedition-descent.js.)
 *
 * The math (generators, judges, misconception tags) lives in expedition-math.js.
 * Grid builders (nav, survey) are in expedition-grid.js.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.CQ_MATH;
  if (!X || !M) return;
  const { L, show, num, same } = M;
  const PANEL = 0x140c16;
  const ROCK = 0x8a4b33;
  const GOOD = 0x6be3a0;
  const BAD = 0xff7a5c;
  const ICE = 0x7fd8ff;

  /* ── Shared pieces ────────────────────────────────────────────────────── */
  /** The Atlas rover: a small container (body, mast, dish, six wheels). */
  function rover(scene, kit, x, y, s = 1) {
    const c = scene.add.container(x, y).setDepth(30);
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.35).fillEllipse(0, 9 * s, 34 * s, 8 * s);
    g.fillStyle(0x2a2430, 1);
    [-11, 0, 11].forEach((dx) => g.fillCircle(dx * s, 5 * s, 4.5 * s));
    g.fillStyle(0xe9e4dc, 1).fillRoundedRect(-15 * s, -8 * s, 30 * s, 11 * s, 4 * s);
    g.fillStyle(kit.accent, 1).fillRect(-15 * s, -3 * s, 30 * s, 3 * s);
    g.lineStyle(2 * s, 0xe9e4dc, 1).lineBetween(8 * s, -8 * s, 8 * s, -18 * s);
    g.fillStyle(0xe9e4dc, 1).fillEllipse(8 * s, -19 * s, 10 * s, 5 * s);
    g.fillStyle(ICE, 1).fillCircle(-8 * s, -14 * s, 3 * s);
    g.lineStyle(2 * s, 0xe9e4dc, 1).lineBetween(-8 * s, -8 * s, -8 * s, -12 * s);
    c.add(g);
    c.lamp = kit.glow(-8 * s, -14 * s, 26 * s, ICE, 0.6, 0);
    c.add(c.lamp);
    return c;
  }
  /** Tween a game object; resolves when done (instant in calm motion). */
  function move(kit, target, props, ms = 420) {
    return new Promise((resolve) => {
      const tw = kit.tween({
        targets: target,
        ...props,
        duration: ms,
        ease: "Sine.easeInOut",
        onComplete: resolve,
      });
      if (!tw) resolve();
    });
  }

  /**
   * Typed number fields with a touch keypad.
   * specs: [{x, y, w}] box centres. Keyboard digits/−/. come through kit.onType.
   */
  function fields(scene, api, specs, opts = {}) {
    const { kit } = api;
    const vals = specs.map(() => "");
    let sel = 0;
    const g = scene.add.graphics().setDepth(22);
    const texts = specs.map((s) =>
      kit.text(s.x, s.y, "", 20, "#ffffff", { weight: "900", depth: 23 }),
    );
    specs.forEach((s, i) => {
      scene.add
        .zone(s.x, s.y, s.w, 40)
        .setInteractive({ useHandCursor: true })
        .setDepth(24)
        .on("pointerdown", () => select(i));
    });
    function draw() {
      g.clear();
      specs.forEach((s, i) => {
        const active = i === sel;
        g.fillStyle(0x0b0710, 1).fillRoundedRect(s.x - s.w / 2, s.y - 19, s.w, 38, 9);
        g.lineStyle(active ? 3 : 2, active ? 0xffd76a : 0x7a5a52, 1);
        g.strokeRoundedRect(s.x - s.w / 2, s.y - 19, s.w, 38, 9);
        texts[i].setText(vals[i] ? M.display(vals[i]) : active ? "▮" : "?");
        texts[i].setColor(vals[i] ? "#ffe9a8" : "#8d7a74");
      });
    }
    function select(i) {
      sel = (i + specs.length) % specs.length;
      api.sfx.tap();
      draw();
      api.refresh();
    }
    function type(key) {
      const next = M.typeInto(vals[sel], key);
      if (next === vals[sel]) return;
      vals[sel] = next;
      api.sfx.tick(vals[sel].length * 2);
      draw();
      api.refresh();
    }
    if (opts.keypad !== false) {
      const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", M.MINUS, ".", "⌫"];
      kit.keypad(opts.padX ?? 368, opts.padY ?? 458, type, { keys, size: 30, gap: 3 });
    }
    kit.onType(type);
    draw();
    return {
      vals,
      get sel() {
        return sel;
      },
      select,
      type,
      draw,
      nums: () => vals.map(M.parse),
      filled: () => vals.every((v) => M.parse(v) != null),
      set(i, v) {
        vals[i] = v;
        draw();
      },
      actions: [
        {
          key: "ArrowRight",
          label: L("Next box →", "Casilla siguiente →"),
          run: () => select(sel + 1),
        },
        {
          key: "ArrowLeft",
          label: L("← Previous box", "← Casilla anterior"),
          run: () => select(sel - 1),
        },
        {
          key: "Delete",
          label: L("Erase a digit", "Borrar un dígito"),
          run: () => type("Backspace"),
        },
        {
          key: "n",
          label: L("Negative sign (−)", "Signo negativo (−)"),
          run: () => type("-"),
        },
      ],
    };
  }
  /** Type a value into a field one character at a time (worked demos). */
  async function typeOut(kit, f, i, text) {
    f.select(i);
    f.set(i, "");
    for (const ch of text) {
      f.type(ch === M.MINUS ? "-" : ch);
      await kit.wait(160);
    }
  }
  const plain = (v) => String(v); // what a student would type: -4.5

  /** A vertical elevation line: returns y(v) and the zone for pointer picks. */
  function elevationLine(scene, kit, x, top, bottom, R, step, opts = {}) {
    const y = (v) => top + ((R - v) / (2 * R)) * (bottom - top);
    const g = scene.add.graphics().setDepth(20);
    g.fillStyle(PANEL, 0.88).fillRoundedRect(x - 62, top - 16, 108, bottom - top + 32, 12);
    g.lineStyle(4, 0xe9e4dc, 0.9).lineBetween(x, top, x, bottom);
    for (let v = -R; v <= R + 1e-9; v += step) {
      const whole = Number.isInteger(v);
      g.lineStyle(whole ? 2 : 1, 0xe9e4dc, whole ? 0.85 : 0.45);
      g.lineBetween(x - (whole ? 10 : 6), y(v), x + (whole ? 10 : 6), y(v));
      const labelEvery = R > 6 ? 1 : 1;
      if (whole && Math.round(v) % labelEvery === 0)
        kit.text(x - 18, y(v), num(v), 12, v === 0 ? "#ffd76a" : "#d9c9c0", {
          ox: 1,
          depth: 21,
          weight: v === 0 ? "900" : "700",
        });
    }
    if (opts.datum !== false) {
      const d = scene.add.graphics().setDepth(19);
      d.lineStyle(2, 0xffd76a, 0.55);
      for (let dx = x + 14; dx < (opts.datumTo ?? 800); dx += 16)
        d.lineBetween(dx, y(0), dx + 8, y(0));
    }
    const zone = scene.add
      .zone(x - 8, (top + bottom) / 2, 90, bottom - top + 20)
      .setInteractive({ useHandCursor: true })
      .setDepth(24);
    const pick = (py) => {
      const raw = R - ((py - top) / (bottom - top)) * 2 * R;
      return Math.max(-R, Math.min(R, Math.round(raw / step) * step));
    };
    return { y, zone, pick };
  }

  /* ── probe: flags and cables on the elevation line ────────────────────── */
  function probe(scene, api) {
    return api.mission.variant === "abs" ? probeAbs(scene, api) : probeOpp(scene, api);
  }

  function probeOpp(scene, api) {
    const { kit } = api;
    const p = M.genOpp(api.rng, api.tier);
    const mag = Math.abs(p.v);
    const magS = show(mag, p.style);
    const up = p.v > 0;
    const place = up
      ? L(
          `a ridge top ${magS} m above the datum`,
          `la cima de una cresta, ${magS} m por encima del nivel 0`,
        )
      : L(
          `a canyon floor ${magS} m below the datum`,
          `el fondo de un cañón, ${magS} m por debajo del nivel 0`,
        );
    api.setBrief(
      L(
        `Plant flag A at ${place.en}. Plant flag B at the opposite elevation. Then send the signal.`,
        `Planta la bandera A en ${place.es}. Planta la bandera B en la elevación opuesta. Luego envía la señal.`,
      ),
    );
    const line = elevationLine(scene, kit, 150, 156, 452, p.R, p.step, { datumTo: 520 });
    kit.text(150, 142, api.t(L("ELEVATION (m)", "ELEVACIÓN (m)")), 12, "#ffd76a", {
      weight: "800",
    });
    // Terrain silhouette (not to scale — the flags decide the heights).
    const terr = scene.add.graphics().setDepth(18);
    terr.fillStyle(ROCK, 0.55);
    terr.fillPoints(
      [
        { x: 240, y: 470 },
        { x: 260, y: 330 },
        { x: 300, y: 250 },
        { x: 330, y: 190 },
        { x: 360, y: 240 },
        { x: 390, y: 300 },
        { x: 420, y: 400 },
        { x: 450, y: 440 },
        { x: 480, y: 380 },
        { x: 510, y: 310 },
        { x: 520, y: 470 },
      ],
      true,
    );
    // Mission card (right).
    kit.panel(540, 146, 254, 300, { fill: PANEL, alpha: 0.92 });
    kit.text(667, 168, api.t(L("SURVEY ORDERS", "ÓRDENES")), 14, "#ffd76a", { weight: "800" });
    kit.text(556, 192, "A", 22, "#ffb681", { ox: 0, oy: 0, weight: "900" });
    kit.text(584, 194, api.t(place), 15, "#f3e6dd", { ox: 0, oy: 0, wrap: 196, align: "left" });
    kit.text(556, 266, "B", 22, "#7fd8ff", { ox: 0, oy: 0, weight: "900" });
    kit.text(
      584,
      268,
      api.t(L("the opposite of flag A", "el opuesto de la bandera A")),
      15,
      "#f3e6dd",
      { ox: 0, oy: 0, wrap: 196, align: "left" },
    );
    const readout = kit.text(667, 386, "", 18, "#ffffff", { weight: "800", lineSpacing: 8 });
    const flags = [
      { v: 0, color: 0xffb681, name: "A", side: -1 },
      { v: 0, color: ICE, name: "B", side: 1 },
    ];
    let sel = 0;
    let touched = false;
    const fg = scene.add.graphics().setDepth(25);
    const labels = flags.map((f) =>
      kit.text(0, 0, f.name, 14, "#06121c", { weight: "900", depth: 26 }),
    );
    const beams = scene.add.graphics().setDepth(17);
    const marks = [];
    function draw() {
      fg.clear();
      flags.forEach((f, i) => {
        const y = line.y(f.v);
        const x = 150 + f.side * 6;
        const tip = x + f.side * 34;
        if (i === sel) {
          fg.fillStyle(0xffd76a, 0.25).fillCircle(150, y, 16);
        }
        fg.lineStyle(3, 0xe9e4dc, 1).lineBetween(x, y, x, y - 24);
        fg.fillStyle(f.color, 1).fillTriangle(x, y - 24, tip, y - 18, x, y - 10);
        fg.lineStyle(i === sel ? 3 : 1, i === sel ? 0xffd76a : 0x000000, 0.9);
        fg.strokeTriangle(x, y - 24, tip, y - 18, x, y - 10);
        fg.fillStyle(f.color, 1).fillCircle(150, y, 5);
        labels[i].setPosition(x + f.side * 13, y - 18);
      });
      readout.setText(flags.map((f) => `${f.name} = ${show(f.v, p.style)} m`).join("\n"));
    }
    function bump(d) {
      const f = flags[sel];
      f.v = Math.max(-p.R, Math.min(p.R, f.v + d * p.step));
      touched = true;
      api.sfx.tick(Math.round(f.v / p.step) % 12);
      draw();
      api.refresh();
    }
    function swap(i) {
      sel = i ?? 1 - sel;
      api.sfx.select();
      draw();
      api.refresh();
    }
    line.zone.on("pointerdown", (ptr) => {
      flags[sel].v = line.pick(ptr.y);
      touched = true;
      api.sfx.place();
      draw();
      api.refresh();
    });
    draw();
    async function signal(okA, okB) {
      beams.clear();
      marks.splice(0).forEach((o) => o.destroy());
      [okA, okB].forEach((ok, i) => {
        const y = line.y(flags[i].v);
        beams.lineStyle(4, ok ? GOOD : BAD, 0.9).lineBetween(160, y, 520, y);
        if (!ok) marks.push(kit.text(530, y, "✕", 22, "#ff7a5c", { weight: "900", depth: 26 }));
      });
      api.sfx[okA && okB ? "hum" : "miss"]();
      await kit.wait(500);
    }
    return {
      checkLabel: L("Send the signal", "Enviar la señal"),
      actions: [
        { key: "ArrowUp", label: L("Flag up ↑", "Bandera arriba ↑"), run: () => bump(1) },
        { key: "ArrowDown", label: L("Flag down ↓", "Bandera abajo ↓"), run: () => bump(-1) },
        {
          key: "ArrowRight",
          label: L("Switch flag (A/B)", "Cambiar bandera (A/B)"),
          run: () => swap(),
        },
        {
          key: "ArrowLeft",
          label: L("Switch flag (A/B)", "Cambiar bandera (A/B)"),
          run: () => swap(),
        },
      ],
      status: () =>
        L(
          `Flag ${flags[sel].name} selected. A = ${show(flags[0].v, p.style)} m, B = ${show(flags[1].v, p.style)} m`,
          `Bandera ${flags[sel].name} elegida. A = ${show(flags[0].v, p.style)} m, B = ${show(flags[1].v, p.style)} m`,
        ),
      hints: [
        L(
          "Above the datum is positive (+). Below the datum is negative (−). Opposites are the same distance from 0, on opposite sides.",
          "Por encima del nivel 0 es positivo (+). Por debajo es negativo (−). Los opuestos están a la misma distancia de 0, en lados opuestos.",
        ),
        L(
          `Flag A: start at 0 and count ${magS} m. Is “${up ? "above" : "below"}” up or down? Then count the same ${magS} m from 0 the other way for flag B.`,
          `Bandera A: empieza en 0 y cuenta ${magS} m. ¿“${up ? "Por encima" : "Por debajo"}” es hacia arriba o hacia abajo? Luego cuenta los mismos ${magS} m desde 0 hacia el otro lado para la bandera B.`,
        ),
      ],
      async check() {
        if (!touched)
          return {
            ok: false,
            incomplete: true,
            feedback: L(
              "Move the flags first: ↑ ↓ moves a flag, → switches flags.",
              "Primero mueve las banderas: ↑ ↓ mueve una bandera, → cambia de bandera.",
            ),
          };
        const r = M.judgeOpp(p, flags[0].v, flags[1].v);
        await signal(r.ok || r.flag !== "A", r.ok);
        if (r.ok) {
          kit.burst(150, line.y(p.v), 0xffb681, 20);
          kit.burst(150, line.y(-p.v), ICE, 20);
          return { ok: true };
        }
        const fb = {
          signWords: L(
            `Flag A is on the wrong side of the datum. “${up ? "Above" : "Below"}” means ${up ? "positive, up from 0" : "negative, down from 0"}.`,
            `La bandera A está del lado equivocado. “${up ? "Por encima" : "Por debajo"}” significa ${up ? "positivo, hacia arriba de 0" : "negativo, hacia abajo de 0"}.`,
          ),
          halfDirection: L(
            `Flag ${r.flag} is half a step on the wrong side. For a negative number, the extra half goes FARTHER from 0, not back toward it.`,
            `La bandera ${r.flag} está medio paso del lado equivocado. En un número negativo, la media unidad extra va MÁS LEJOS de 0, no hacia 0.`,
          ),
          misread: L(
            `Flag A is at ${show(flags[0].v, p.style)} m. Count again from 0: how far is ${magS} m?`,
            `La bandera A está en ${show(flags[0].v, p.style)} m. Cuenta otra vez desde 0: ¿qué tan lejos son ${magS} m?`,
          ),
          sameNotOpposite: L(
            "Flag B is on the same spot as flag A. An opposite is on the OTHER side of 0.",
            "La bandera B está en el mismo lugar que la A. El opuesto está del OTRO lado de 0.",
          ),
          notOpposite: L(
            `Flag B is ${show(Math.abs(flags[1].v), p.style)} m from 0, but flag A is ${magS} m from 0. Opposites are the same distance from 0.`,
            `La bandera B está a ${show(Math.abs(flags[1].v), p.style)} m de 0, pero la A está a ${magS} m. Los opuestos están a la misma distancia de 0.`,
          ),
        }[r.tag];
        return { ok: false, misconception: r.tag, feedback: fb };
      },
      async demo() {
        for (let i = 0; i < 2; i++) {
          swap(i);
          const goal = i === 0 ? p.v : -p.v;
          while (!same(flags[i].v, goal)) {
            bump(goal > flags[i].v ? 1 : -1);
            await kit.wait(p.step < 1 ? 70 : 110);
          }
          kit.floatText(
            230,
            line.y(goal),
            `${flags[i].name}: ${show(goal, p.style)}`,
            "#ffd76a",
            18,
          );
          await kit.wait(600);
        }
        await signal(true, true);
      },
      explain: () =>
        L(
          `Flag A: ${show(p.v, p.style)} m. Its opposite is ${show(-p.v, p.style)} m. Both are ${magS} m from 0, on opposite sides of the datum.`,
          `Bandera A: ${show(p.v, p.style)} m. Su opuesto es ${show(-p.v, p.style)} m. Las dos están a ${magS} m de 0, en lados opuestos del nivel 0.`,
        ),
    };
  }

  function probeAbs(scene, api) {
    const { kit } = api;
    const p = M.genAbs(api.rng, api.tier);
    const rS = show(p.ridge, p.style);
    const vS = show(p.vent, p.style);
    api.setBrief(
      L(
        `Winches sit at the datum (0 m). Run one cable up to the ridge tip at ${rS} m and one down to the vent at ${vS} m.`,
        `Los tornos están en el nivel 0 m. Lleva un cable hasta la cima en ${rS} m y otro hasta el respiradero en ${vS} m.`,
      ),
    );
    const line = elevationLine(scene, kit, 110, 156, 444, p.R, 0.5, { datumTo: 360 });
    const RX = 210;
    const VX = 300;
    const g = scene.add.graphics().setDepth(18);
    // Ridge spire up to its elevation, vent shaft down to its elevation (both to scale).
    g.fillStyle(ROCK, 0.95).fillTriangle(
      RX - 34,
      line.y(0),
      RX,
      line.y(p.ridge),
      RX + 34,
      line.y(0),
    );
    g.fillStyle(0x2a1410, 1).fillRect(VX - 14, line.y(0), 28, line.y(p.vent) - line.y(0));
    g.fillStyle(0xff8a4a, 0.85).fillEllipse(VX, line.y(p.vent), 30, 10);
    kit.glow(VX, line.y(p.vent), 70, 0xff8a4a, 0.45, 18);
    kit.text(RX, line.y(p.ridge) - 14, rS, 15, "#ffe9a8", { weight: "900" });
    kit.text(VX + 26, line.y(p.vent), vS, 15, "#ffe9a8", { weight: "900", ox: 0 });
    [RX, VX].forEach((x) => g.fillStyle(0xe9e4dc, 1).fillRect(x - 8, line.y(0) - 8, 16, 10));
    const cables = scene.add.graphics().setDepth(21);
    // Cable panel.
    kit.panel(380, 146, 414, 290, { fill: PANEL, alpha: 0.92 });
    kit.text(587, 168, api.t(L("WINCH CONTROL", "CONTROL DE TORNOS")), 14, "#ffd76a", {
      weight: "800",
    });
    kit.text(
      398,
      214,
      api.t(L("Cable up to the ridge tip", "Cable hasta la cima")),
      15,
      "#f3e6dd",
      {
        ox: 0,
        wrap: 230,
        align: "left",
      },
    );
    kit.text(
      398,
      290,
      api.t(L("Cable down to the vent", "Cable hasta el respiradero")),
      15,
      "#f3e6dd",
      {
        ox: 0,
        wrap: 230,
        align: "left",
      },
    );
    kit.text(770, 214, "m", 16, "#d9c9c0", { weight: "800" });
    kit.text(770, 290, "m", 16, "#d9c9c0", { weight: "800" });
    kit.text(
      587,
      376,
      api.t(
        L(
          "A length is a distance. It is never negative.",
          "Un largo es una distancia. Nunca es negativo.",
        ),
      ),
      13,
      "#bfa89f",
      { wrap: 380 },
    );
    const f = fields(scene, api, [
      { x: 700, y: 214, w: 100 },
      { x: 700, y: 290, w: 100 },
    ]);
    async function spool(i, len, ok) {
      const x = i === 0 ? RX : VX;
      const dir = i === 0 ? 1 : -1; // ridge is up, vent is down
      const end = line.y(
        Math.max(-p.R - 0.5, Math.min(p.R + 0.5, Math.sign(len) * dir * Math.abs(len))),
      );
      const y0 = line.y(0);
      const steps = 10;
      for (let k = 1; k <= steps; k++) {
        cables
          .lineStyle(3, ok ? GOOD : BAD, 1)
          .lineBetween(x, y0, x, y0 + ((end - y0) * k) / steps);
        await kit.wait(30);
      }
      cables.fillStyle(ok ? GOOD : BAD, 1).fillCircle(x, end, 5);
      if (ok) kit.burst(x, end, GOOD, 14);
      api.sfx[ok ? "place" : "miss"]();
    }
    return {
      checkLabel: L("Run the winches", "Activar los tornos"),
      actions: f.actions,
      status: () =>
        L(
          `Ridge cable ${f.vals[0] ? M.display(f.vals[0]) : "empty"} m, vent cable ${f.vals[1] ? M.display(f.vals[1]) : "empty"} m`,
          `Cable a la cima ${f.vals[0] ? M.display(f.vals[0]) : "vacío"} m, cable al respiradero ${f.vals[1] ? M.display(f.vals[1]) : "vacío"} m`,
        ),
      hints: [
        L(
          "Absolute value is the distance from 0. Count the steps from 0 to the place. Up or down, a distance is positive.",
          "El valor absoluto es la distancia desde 0. Cuenta los pasos de 0 al lugar. Hacia arriba o hacia abajo, la distancia es positiva.",
        ),
        L(
          `The vent is at ${vS}. The minus sign only tells you it is BELOW 0. How many meters is it from 0?`,
          `El respiradero está en ${vS}. El signo menos solo dice que está DEBAJO de 0. ¿A cuántos metros está de 0?`,
        ),
      ],
      async check() {
        if (!f.filled())
          return {
            ok: false,
            incomplete: true,
            feedback: L("Type a length in both boxes.", "Escribe un largo en las dos casillas."),
          };
        const [a, b] = f.nums();
        cables.clear();
        const r = M.judgeAbs(p, a, b);
        const okA = M.judgeCable(p.ridge, a).ok;
        const okB = M.judgeCable(p.vent, b).ok;
        await spool(0, a, okA);
        await spool(1, b, okB);
        if (r.ok) return { ok: true };
        const which =
          r.cable === 0
            ? L("The ridge cable", "El cable de la cima")
            : L("The vent cable", "El cable del respiradero");
        const fb = {
          swapSites: L(
            "The two lengths are switched: each cable got the other site's distance.",
            "Los dos largos están al revés: cada cable tiene la distancia del otro lugar.",
          ),
          negativeDistance: L(
            `${which.en} has a negative length, so the winch spun the wrong way. Absolute value is a distance, never negative.`,
            `${which.es} tiene un largo negativo, así que el torno giró al revés. El valor absoluto es una distancia, nunca negativa.`,
          ),
          notDistance: L(
            `${which.en} ${r.short ? "stops short of" : "goes past"} the site. Count the meters from 0 to it again.`,
            `${which.es} ${r.short ? "no llega al" : "se pasa del"} lugar. Cuenta otra vez los metros de 0 hasta él.`,
          ),
        }[r.tag];
        return { ok: false, misconception: r.tag, feedback: fb };
      },
      async demo() {
        cables.clear();
        kit.floatText(RX, line.y(p.ridge / 2), `|${rS}|`, "#ffd76a", 20);
        await typeOut(kit, f, 0, plain(Math.abs(p.ridge)));
        await kit.wait(400);
        kit.floatText(VX, line.y(p.vent / 2), `|${vS}|`, "#ffd76a", 20);
        await typeOut(kit, f, 1, plain(Math.abs(p.vent)));
        await kit.wait(300);
        await spool(0, Math.abs(p.ridge), true);
        await spool(1, Math.abs(p.vent), true);
      },
      explain: () =>
        L(
          `|${rS}| = ${show(p.ridge, p.style)} and |${vS}| = ${show(-p.vent, p.style)}. Absolute value is the distance from 0, so both cable lengths are positive.`,
          `|${rS}| = ${show(p.ridge, p.style)} y |${vS}| = ${show(-p.vent, p.style)}. El valor absoluto es la distancia desde 0, así que los dos largos son positivos.`,
        ),
    };
  }

  window.CQ_MISSIONS = Object.assign(window.CQ_MISSIONS || {}, {
    probe,
    rover,
    move,
    fields,
    typeOut,
    plain,
    PANEL,
    ROCK,
    GOOD,
    BAD,
    ICE,
  });
})();
