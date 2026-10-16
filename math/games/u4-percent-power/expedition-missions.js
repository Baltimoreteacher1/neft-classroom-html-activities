/* Neon Grid — city widgets and the Lantern Quarter builders for the Percent Power expedition.
 *
 * Every mission is a piece of the city's power grid that only comes back when the percent is right:
 *   grid      a 100-window block: light exactly the percent named (as %, a fraction or a decimal)
 *   breakers  a breaker panel: each breaker shows one amount as a fraction, decimal and percent
 * (transit and plant live in expedition-flow.js.) A wrong number is shown, not just marked:
 * extra windows overload and flicker red, too few leave a brownout, a breaker trips.
 * The math (generators, judges, misconception tags) is in expedition-math.js.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.PP_MISSIONS;
  if (!X || !M) return;
  const { W } = X;
  const { L } = M;
  const GOLD = 0xf8d877;
  const CYAN = 0x5ee8ff;
  const RED = 0xff5b5b;
  const AMBER = 0xc9863a;
  const DARK = 0x1b2036;
  const PANEL = 0x0b0f22;

  /* ── Shared widgets ───────────────────────────────────────────────────── */

  /** A city district whose windows show what the delivered power did. */
  function district(scene, kit, x, y, w, h, opts = {}) {
    const r = kit.rng(opts.seed || 5);
    const g = scene.add.graphics().setDepth(21);
    const fx = scene.add.graphics().setDepth(22);
    const towers = [];
    let cx = x + 6;
    while (cx < x + w - 24) {
      const tw = r.int(30, 46);
      const th = r.int(Math.round(h * 0.45), h - 10);
      towers.push({ x: cx, w: Math.min(tw, x + w - cx - 4), h: th });
      cx += tw + r.int(4, 8);
    }
    const wins = [];
    towers.forEach((t) => {
      for (let wy = y + h - t.h + 8; wy < y + h - 10; wy += 13)
        for (let wx = t.x + 5; wx < t.x + t.w - 8; wx += 10) wins.push({ x: wx, y: wy });
    });
    const order = r.shuffle(wins.map((_, i) => i));
    let level = 0;
    let mode = "dark";
    function draw() {
      g.clear();
      towers.forEach((t) => {
        g.fillStyle(0x10142a, 1).fillRect(t.x, y + h - t.h, t.w, t.h);
        g.lineStyle(1, 0x2c3558, 1).strokeRect(t.x, y + h - t.h, t.w, t.h);
      });
      const n = Math.round(Math.min(1, level) * wins.length);
      order.forEach((wi, k) => {
        const on = k < n;
        const color =
          !on || mode === "dark"
            ? 0x252b45
            : mode === "over"
              ? k % 3 === 0
                ? 0xffffff
                : RED
              : mode === "brown"
                ? AMBER
                : GOLD;
        g.fillStyle(color, on && mode !== "dark" ? 1 : 0.9).fillRect(wins[wi].x, wins[wi].y, 6, 8);
      });
    }
    draw();
    return {
      /** level = delivered ÷ needed. 1 = exact, below = brownout, above = overload. */
      async power(ratio) {
        fx.clear();
        level = Math.max(0, ratio);
        mode =
          ratio <= 0 ? "dark" : Math.abs(ratio - 1) < 1e-9 ? "ok" : ratio > 1 ? "over" : "brown";
        draw();
        if (mode === "ok") {
          kit.glow(x + w / 2, y + h / 2, w * 1.4, GOLD, 0.35, 19);
          kit.burst(x + w / 2, y + 20, GOLD, 22);
        } else if (mode === "over") {
          kit.burst(x + w / 2, y + 10, RED, 20, { gravity: 220 });
          kit.shake(0.004, 160);
          for (let i = 0; i < 3; i++) {
            fx.lineStyle(3, 0xffffff, 0.9);
            const sx = x + 20 + i * (w / 3);
            fx.lineBetween(sx, y + 4, sx + 10, y - 14).lineBetween(sx + 10, y - 14, sx + 2, y - 26);
          }
        }
        await kit.wait(350);
      },
      reset() {
        fx.clear();
        level = 0;
        mode = "dark";
        draw();
      },
    };
  }

  /** A numeric meter the student sets: buttons, arrow keys or typed digits. */
  function meter(scene, api, x, y, opts = {}) {
    const { kit } = api;
    const max = opts.max ?? 999;
    const w = opts.w || 170;
    let value = 0;
    let fresh = true;
    let active = opts.active ?? true;
    const box = scene.add.graphics().setDepth(21);
    const txt = kit.text(x, y, "0", opts.size || 30, "#ffffff", { weight: "900", depth: 23 });
    const unit = kit.text(x + w / 2 - 12, y + 2, opts.unit || "MW", 15, "#9fb3d8", {
      ox: 1,
      depth: 23,
      weight: "800",
    });
    if (opts.caption)
      kit.text(x, y - 40, api.t(opts.caption), 14, "#cfd8f5", { depth: 23, weight: "800" });
    function draw() {
      box.clear();
      box.fillStyle(0x050815, 0.95).fillRoundedRect(x - w / 2, y - 26, w, 52, 12);
      box.lineStyle(active ? 4 : 2, active ? GOLD : 0x46507a, 1);
      box.strokeRoundedRect(x - w / 2, y - 26, w, 52, 12);
      txt.setText(String(value));
      txt.x = x - 14;
    }
    const m = {
      get value() {
        return value;
      },
      set(v) {
        value = Phaser.Math.Clamp(Math.round(v), 0, max);
        fresh = true;
        draw();
      },
      bump(d) {
        value = Phaser.Math.Clamp(value + d, 0, max);
        fresh = true;
        api.sfx.tick(Math.min(14, Math.abs(d) === 1 ? value % 12 : 12));
        draw();
        api.refresh();
      },
      type(key) {
        if (key === "Backspace") {
          value = Math.floor(value / 10);
          fresh = false;
        } else if (/^[0-9]$/.test(key)) {
          const next = fresh ? Number(key) : value * 10 + Number(key);
          value = next > max ? Number(key) : next;
          fresh = false;
        } else return;
        api.sfx.tap();
        draw();
        api.refresh();
      },
      setActive(v) {
        active = v;
        draw();
      },
      text: txt,
      unit,
    };
    draw();
    return m;
  }
  /** −10 −1 +1 +10 style buttons under a meter. */
  function meterButtons(scene, kit, m, x, y, steps = [-10, -1, 1, 10], gap = 70, onPress) {
    steps.forEach((d, i) => {
      const bx = x + (i - (steps.length - 1) / 2) * gap;
      kit.button(
        bx,
        y,
        gap - 8,
        40,
        (d > 0 ? "+" : "−") + Math.abs(d),
        () => {
          onPress?.();
          m.bump(d);
        },
        d > 0 ? { size: 16 } : { size: 16, fill: 0x2f3b66, color: "#eaf0ff" },
      );
    });
  }
  /** Power pulse travelling along a cable. */
  async function pulse(scene, kit, pts, color = CYAN) {
    const g = scene.add.graphics().setDepth(24);
    g.lineStyle(5, color, 0.9);
    for (let i = 1; i < pts.length; i++)
      g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    const dot = kit.glow(pts[0].x, pts[0].y, 46, color, 0.9, 25);
    kit.sfx.hum();
    for (let i = 1; i < pts.length; i++) {
      await new Promise((resolve) => {
        const tw = kit.tween({
          targets: dot,
          x: pts[i].x,
          y: pts[i].y,
          duration: 220,
          onComplete: resolve,
        });
        if (!tw) resolve();
      });
    }
    dot.destroy();
    return g;
  }

  /* ── grid: light p% of the 100 windows of a Lantern Quarter block ─────── */
  function grid(scene, api) {
    const { kit, rng } = api;
    const prob = M.genGrid(rng, api.tier);
    const p = prob.p;
    let lit = 0;
    let fresh = true;
    let state = "idle"; // idle | ok | over | brown
    const named = {
      percent: L(`${p}%`, `el ${p}%`),
      fraction: L(`${prob.label}`, `${prob.label}`),
      decimal: L(`${prob.label}`, `${prob.label}`),
    }[prob.form];
    api.setBrief(
      L(
        `This Lantern Quarter block has 100 windows. The plant can power exactly ${named.en} of them. Light that many windows.`,
        `Este bloque del Barrio de los Faroles tiene 100 ventanas. La planta puede dar energía a exactamente ${named.es} de ellas. Enciende esas ventanas.`,
      ),
    );
    const CELL = 26;
    const PITCH = 30;
    const GX = 58;
    const GY = 150;
    // Building facade.
    const facade = scene.add.graphics().setDepth(20);
    facade
      .fillStyle(0x0d1124, 0.97)
      .fillRoundedRect(GX - 16, GY - 12, PITCH * 10 + 28, PITCH * 10 + 22, 10);
    facade
      .lineStyle(2, 0x3a4470, 1)
      .strokeRoundedRect(GX - 16, GY - 12, PITCH * 10 + 28, PITCH * 10 + 22, 10);
    const cells = scene.add.graphics().setDepth(21);
    const cellAt = (k) => {
      const row = 9 - Math.floor(k / 10);
      const col = k % 10;
      return { x: GX + col * PITCH, y: GY + row * PITCH };
    };
    // Order card + counter on the right.
    kit.panel(392, 140, 404, 128, { fill: PANEL, alpha: 0.92 });
    kit.text(594, 160, api.t(L("POWER ORDER", "ORDEN DE ENERGÍA")), 14, "#f8d877", {
      weight: "800",
    });
    if (prob.form === "fraction") {
      kit.text(560, 196, String(prob.num), 30, "#ffffff", { weight: "900" });
      const bar = scene.add.graphics().setDepth(21);
      bar.lineStyle(4, 0xffffff, 1).lineBetween(536, 216, 584, 216);
      kit.text(560, 238, String(prob.den), 30, "#ffffff", { weight: "900" });
    } else kit.text(560, 216, prob.label, 44, "#ffffff", { weight: "900" });
    kit.text(680, 216, api.t(L("of the\nwindows", "de las\nventanas")), 16, "#cfd8f5", {
      weight: "800",
    });
    const counter = kit.text(594, 298, "", 22, "#ffffff", { weight: "900" });
    kit.text(594, 326, api.t(L("1 row = 10 windows", "1 fila = 10 ventanas")), 14, "#9fb3d8", {
      weight: "700",
    });
    const steps = [-10, -1, 1, 10];
    steps.forEach((d, i) => {
      kit.button(
        471 + i * 82,
        372,
        74,
        42,
        (d > 0 ? "+" : "−") + Math.abs(d),
        () => setLit(lit + d),
        d > 0 ? { size: 17 } : { size: 17, fill: 0x2f3b66, color: "#eaf0ff" },
      );
    });
    // A string of lanterns: dark until the block is powered.
    const lanterns = scene.add.graphics().setDepth(21);
    function drawLanterns(on) {
      lanterns.clear();
      lanterns.lineStyle(2, 0x6b7299, 1);
      const pts = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        pts.push({ x: 400 + t * 390, y: 420 + Math.sin(t * Math.PI) * 18 });
      }
      for (let i = 1; i < pts.length; i++)
        lanterns.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
      for (let i = 1; i < 10; i++) {
        const q = pts[i * 2];
        lanterns.fillStyle(on ? (i % 2 ? GOLD : 0xff9f5a) : 0x3a3f5c, 1);
        lanterns.fillRoundedRect(q.x - 8, q.y + 2, 16, 20, 5);
        lanterns.fillStyle(0x2a2f48, 1).fillRect(q.x - 4, q.y, 8, 4);
      }
      if (on)
        for (let i = 1; i < 10; i++) kit.glow(pts[i * 2].x, pts[i * 2].y + 12, 60, GOLD, 0.5, 20);
    }
    drawLanterns(false);

    function draw() {
      cells.clear();
      for (let k = 0; k < 100; k++) {
        const { x, y } = cellAt(k);
        const on = k < lit;
        let color = 0x262c48;
        if (on)
          color =
            state === "over" && k >= p
              ? RED
              : state === "brown"
                ? AMBER
                : state === "over"
                  ? 0xffe9a8
                  : GOLD;
        cells.fillStyle(color, 1).fillRoundedRect(x, y, CELL, CELL, 4);
        if (on && state !== "brown") {
          cells.fillStyle(0xffffff, 0.25).fillRect(x + 3, y + 3, CELL - 6, 5);
        }
        // Thin line between groups of 10 (each row = 10%).
      }
      cells.lineStyle(1, 0x5d6797, 0.6);
      for (let r = 1; r < 10; r++)
        cells.lineBetween(GX - 4, GY + r * PITCH - 2, GX + PITCH * 10 - 2, GY + r * PITCH - 2);
      counter.setText(api.t(L(`Lit: ${lit} of 100 windows`, `Encendidas: ${lit} de 100 ventanas`)));
    }
    function setLit(v) {
      lit = Phaser.Math.Clamp(v, 0, 100);
      state = "idle";
      fresh = true;
      drawLanterns(false);
      api.sfx.tick(lit % 12);
      draw();
      api.refresh();
    }
    const zone = scene.add
      .zone(GX + PITCH * 5 - 2, GY + PITCH * 5 - 2, PITCH * 10, PITCH * 10)
      .setInteractive({ useHandCursor: true })
      .setDepth(25);
    const fromPointer = (ptr) => {
      const col = Phaser.Math.Clamp(Math.floor((ptr.x - GX) / PITCH), 0, 9);
      const row = Phaser.Math.Clamp(Math.floor((ptr.y - GY) / PITCH), 0, 9);
      const k = (9 - row) * 10 + col;
      return k;
    };
    zone.on("pointerdown", (ptr) => {
      const k = fromPointer(ptr);
      setLit(lit === k + 1 ? k : k + 1);
    });
    zone.on("pointermove", (ptr) => ptr.isDown && setLit(fromPointer(ptr) + 1));
    kit.onType((key) => {
      if (key === "Backspace") lit = Math.floor(lit / 10);
      else if (/^[0-9]$/.test(key)) {
        const next = fresh ? Number(key) : lit * 10 + Number(key);
        lit = next > 100 ? Number(key) : next;
      } else return;
      fresh = false;
      state = "idle";
      drawLanterns(false);
      api.sfx.tap();
      draw();
      api.refresh();
    });
    draw();

    async function powerUp() {
      state = "idle";
      for (let r = 0; r < 10; r++) {
        draw();
        if (r * 10 < lit) {
          const { x, y } = cellAt(r * 10);
          kit.glow(x + 150, y + 13, 90, GOLD, 0.25, 22);
        }
      }
      drawLanterns(true);
      kit.burst(594, 420, GOLD, 30);
      api.sfx.success();
      await kit.wait(300);
    }

    return {
      checkLabel: L("Power the block", "Dar energía al bloque"),
      actions: [
        { key: "ArrowRight", label: L("+1 window", "+1 ventana"), run: () => setLit(lit + 1) },
        { key: "ArrowLeft", label: L("−1 window", "−1 ventana"), run: () => setLit(lit - 1) },
        { key: "ArrowUp", label: L("+1 row (10)", "+1 fila (10)"), run: () => setLit(lit + 10) },
        { key: "ArrowDown", label: L("−1 row (10)", "−1 fila (10)"), run: () => setLit(lit - 10) },
      ],
      status: () => L(`Lit windows: ${lit} of 100`, `Ventanas encendidas: ${lit} de 100`),
      hints:
        prob.form === "percent"
          ? [
              L(
                "Percent means out of 100. The block has 100 windows, so 1% is one window.",
                "Porcentaje significa de cada 100. El bloque tiene 100 ventanas, así que 1% es una ventana.",
              ),
              L(
                `Each full row is 10 windows, or 10%. How many full rows fit in ${p}%? Then add single windows.`,
                `Cada fila completa son 10 ventanas, o 10%. ¿Cuántas filas completas caben en ${p}%? Luego suma ventanas sueltas.`,
              ),
            ]
          : prob.form === "fraction"
            ? [
                L(
                  "Rewrite the fraction with 100 on the bottom. Then the top number tells how many of the 100 windows.",
                  "Escribe la fracción con 100 abajo. Así el número de arriba dice cuántas de las 100 ventanas.",
                ),
                L(
                  `${prob.den} × ${100 / prob.den} = 100. Multiply the top number, ${prob.num}, by ${100 / prob.den} too.`,
                  `${prob.den} × ${100 / prob.den} = 100. Multiplica también el número de arriba, ${prob.num}, por ${100 / prob.den}.`,
                ),
              ]
            : [
                L(
                  "Read the decimal as hundredths. Hundredths are windows out of 100.",
                  "Lee el decimal como centésimos. Los centésimos son ventanas de cada 100.",
                ),
                L(
                  `In ${prob.dec}, the first digit after the point is tenths: full rows of 10. The second digit is hundredths: single windows.`,
                  `En ${prob.dec}, el primer dígito después del punto son décimos: filas de 10. El segundo dígito son centésimos: ventanas sueltas.`,
                ),
              ],
      async check() {
        const res = M.judgeGrid(prob, lit);
        if (res.incomplete) return res;
        if (res.ok) {
          await powerUp();
          return res;
        }
        state = lit > p ? "over" : "brown";
        draw();
        if (state === "over") {
          kit.burst(GX + PITCH * 5, GY - 6, RED, 22, { gravity: 240 });
          kit.shake(0.004, 160);
        }
        api.sfx.hum();
        await kit.wait(300);
        return res;
      },
      async demo() {
        lit = 0;
        state = "idle";
        draw();
        if (prob.form !== "percent") {
          kit.floatText(594, 250, `${prob.label} = ${p}/100`, "#f8d877", 24);
          await kit.wait(1000);
        }
        while (lit + 10 <= p) {
          lit += 10;
          draw();
          const { x, y } = cellAt(lit - 1);
          kit.floatText(x + 10, y, `${lit}%`, "#f8d877", 18);
          api.sfx.tick(lit / 10);
          await kit.wait(450);
        }
        while (lit < p) {
          lit += 1;
          draw();
          api.sfx.tick(lit % 12);
          await kit.wait(160);
        }
        await powerUp();
      },
      explain: () =>
        prob.form === "percent"
          ? L(
              `${p}% means ${p} out of 100: ${Math.floor(p / 10)} full rows of 10 and ${p % 10} more windows.`,
              `${p}% significa ${p} de cada 100: ${Math.floor(p / 10)} filas de 10 y ${p % 10} ventanas más.`,
            )
          : L(
              `${prob.label} = ${p}/100 = ${p}%, so ${p} of the 100 windows light up.`,
              `${prob.label} = ${p}/100 = ${p}%, así que se encienden ${p} de las 100 ventanas.`,
            ),
    };
  }

  /* ── breakers: fraction = decimal = percent on every breaker ──────────── */
  function breakers(scene, api) {
    const { kit, rng } = api;
    const rows = M.genBreakers(rng, api.tier);
    const entries = rows.map(() => ({ dec: "", pct: "" }));
    const blanks = [];
    rows.forEach((row, i) => M.blanksOf(row).forEach((kind) => blanks.push({ row: i, kind })));
    let sel = 0;
    const result = rows.map(() => "off"); // off | on | trip
    api.setBrief(
      L(
        "Each breaker sends one share of the power. Its fraction, decimal and percent must name the SAME amount. Fill the empty plates.",
        "Cada interruptor envía una parte de la energía. Su fracción, decimal y porcentaje deben ser la MISMA cantidad. Completa las placas vacías.",
      ),
    );
    const COLX = { frac: 140, dec: 310, pct: 470 };
    const ROWY = rows.map(
      (_, i) => (rows.length === 3 ? 214 : 200) + i * (rows.length === 3 ? 66 : 58),
    );
    kit.panel(30, 140, 760, rows.length === 3 ? 230 : 248, { fill: PANEL, alpha: 0.9 });
    [
      ["frac", L("Fraction", "Fracción")],
      ["dec", L("Decimal", "Decimal")],
      ["pct", L("Percent", "Porcentaje")],
    ].forEach(([k, lbl]) => kit.text(COLX[k], 160, api.t(lbl), 15, "#f8d877", { weight: "800" }));
    kit.text(650, 160, api.t(L("Breaker", "Interruptor")), 15, "#f8d877", { weight: "800" });
    const plates = scene.add.graphics().setDepth(21);
    const gear = scene.add.graphics().setDepth(21);
    const boxText = rows.map((row, i) => {
      const y = ROWY[i];
      if (row.given === "fraction") {
        kit.text(COLX.frac, y - 11, String(row.num), 18, "#ffffff", { weight: "900", depth: 23 });
        kit.text(COLX.frac, y + 12, String(row.den), 18, "#ffffff", { weight: "900", depth: 23 });
        const ln = scene.add.graphics().setDepth(23);
        ln.lineStyle(3, 0xffffff, 1).lineBetween(COLX.frac - 16, y + 1, COLX.frac + 16, y + 1);
      } else kit.text(COLX.frac, y, "—", 18, "#5d6797", { depth: 23 });
      kit.text(30 + 22, y, String(i + 1), 16, "#9fb3d8", { weight: "900", depth: 23 });
      return {
        dec: kit.text(COLX.dec, y, "", 22, "#ffffff", { weight: "900", depth: 23 }),
        pct: kit.text(COLX.pct, y, "", 22, "#ffffff", { weight: "900", depth: 23 }),
      };
    });
    rows.forEach((row, i) => {
      ["dec", "pct"].forEach((kind) => {
        const z = scene.add
          .zone(COLX[kind], ROWY[i], 130, 48)
          .setInteractive({ useHandCursor: true })
          .setDepth(24);
        z.on("pointerdown", () => {
          const b = blanks.findIndex((x) => x.row === i && x.kind === kind);
          if (b >= 0) {
            sel = b;
            draw();
            api.refresh();
          }
        });
      });
    });
    kit.keypad(149, 446, (key) => type(key), {
      keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ".", "⌫"],
      size: 38,
    });
    const isBlank = (i, kind) => blanks.some((b) => b.row === i && b.kind === kind);
    function shown(i, kind) {
      const row = rows[i];
      if (!isBlank(i, kind)) return kind === "pct" ? row.p + "%" : M.decStr(row.p);
      return entries[i][kind];
    }
    function draw() {
      plates.clear();
      gear.clear();
      rows.forEach((row, i) => {
        const y = ROWY[i];
        ["dec", "pct"].forEach((kind) => {
          const blank = isBlank(i, kind);
          const b = blanks.findIndex((x) => x.row === i && x.kind === kind);
          const active = blank && b === sel;
          const bad = result[i] === "trip" && blank;
          plates.fillStyle(blank ? 0x141b3a : 0x232a4a, 1);
          plates.fillRoundedRect(COLX[kind] - 62, y - 23, 124, 46, 10);
          plates.lineStyle(
            active ? 4 : 2,
            active ? GOLD : bad ? RED : blank ? 0x5e7bd6 : 0x3b4466,
            1,
          );
          plates.strokeRoundedRect(COLX[kind] - 62, y - 23, 124, 46, 10);
          const s = shown(i, kind);
          const t = boxText[i][kind];
          if (blank)
            t.setText(s === "" ? (active ? "▮" : "?") : kind === "pct" ? s + "%" : s).setColor(
              "#ffe9a8",
            );
          else t.setText(s).setColor("#ffffff");
        });
        // Breaker lever + lamp.
        const st = result[i];
        gear.fillStyle(0x050815, 1).fillRoundedRect(612, y - 22, 40, 44, 8);
        gear.fillStyle(st === "on" ? 0x7ee36d : st === "trip" ? RED : 0x6b7299, 1);
        gear.fillRoundedRect(622, st === "on" ? y - 18 : y - 2, 20, 18, 4);
        gear.fillStyle(st === "on" ? GOLD : st === "trip" ? 0x5a1f1f : 0x2a2f48, 1);
        gear.fillCircle(690, y, 13);
        gear.lineStyle(2, 0x9fb3d8, 0.6).strokeCircle(690, y, 13);
        // Share gauge: fills with the student's own amount once the breaker is tested.
        gear.fillStyle(0x050815, 1).fillRect(714, y - 6, 66, 12);
        if (st !== "off") {
          const v = isBlank(i, "pct") ? Number(entries[i].pct) : Number(entries[i].dec) * 100;
          const share = Number.isFinite(v) ? Math.min(1.2, Math.max(0, v / 100)) : 0;
          gear
            .fillStyle(st === "on" ? GOLD : RED, 1)
            .fillRect(714, y - 6, Math.min(66, 66 * share), 12);
        }
        gear.lineStyle(1, 0x5d6797, 1).strokeRect(714, y - 6, 66, 12);
      });
    }
    function type(key) {
      const b = blanks[sel];
      if (!b) return;
      let s = entries[b.row][b.kind];
      if (key === "Backspace") s = s.slice(0, -1);
      else if (key === "." && !s.includes(".") && s.length < 5) s = s === "" ? "0." : s + ".";
      else if (/^[0-9]$/.test(key) && s.length < 5) s = s === "0" ? key : s + key;
      else return;
      entries[b.row][b.kind] = s;
      result.fill("off");
      api.sfx.tap();
      draw();
      api.refresh();
    }
    kit.onType(type);
    draw();
    const move = (d) => {
      sel = (sel + d + blanks.length) % blanks.length;
      draw();
      api.refresh();
    };
    async function testUpTo(fail) {
      for (let i = 0; i < rows.length; i++) {
        if (i === fail) {
          result[i] = "trip";
          draw();
          kit.burst(632, ROWY[i], RED, 16, { gravity: 220 });
          kit.shake(0.004, 140);
          return;
        }
        result[i] = "on";
        draw();
        kit.glow(690, ROWY[i], 70, GOLD, 0.6, 22);
        api.sfx.tick(i * 3 + 4);
        await kit.wait(260);
      }
      kit.burst(690, ROWY[rows.length - 1], GOLD, 26);
    }
    const firstFrac = rows.findIndex((r) => r.given === "fraction");
    const fr = rows[firstFrac];
    return {
      checkLabel: L("Flip the breakers", "Subir los interruptores"),
      actions: [
        { key: "ArrowDown", label: L("Next plate ↓", "Placa siguiente ↓"), run: () => move(1) },
        { key: "ArrowUp", label: L("↑ Previous plate", "↑ Placa anterior"), run: () => move(-1) },
        { key: "ArrowRight", label: L("Next plate →", "Placa siguiente →"), run: () => move(1) },
        { key: "ArrowLeft", label: L("← Previous plate", "← Placa anterior"), run: () => move(-1) },
      ],
      status: () =>
        L(
          `Plates filled ${blanks.filter((b) => entries[b.row][b.kind] !== "").length} of ${blanks.length}`,
          `Placas llenas ${blanks.filter((b) => entries[b.row][b.kind] !== "").length} de ${blanks.length}`,
        ),
      hints: [
        L(
          "Write every amount as hundredths. Fraction: make the bottom number 100. Decimal: read the hundredths. Percent: that many out of 100.",
          "Escribe cada cantidad en centésimos. Fracción: haz que el número de abajo sea 100. Decimal: lee los centésimos. Porcentaje: esa cantidad de cada 100.",
        ),
        fr.den === 100
          ? L(
              `Breaker ${firstFrac + 1}: ${fr.num}/100 already has 100 on the bottom. Read it as hundredths for the decimal, and out of 100 for the percent.`,
              `Interruptor ${firstFrac + 1}: ${fr.num}/100 ya tiene 100 abajo. Léelo como centésimos para el decimal, y de cada 100 para el porcentaje.`,
            )
          : L(
              `Breaker ${firstFrac + 1}: ${fr.den} × ${100 / fr.den} = 100, so multiply ${fr.num} by ${100 / fr.den} too. That many hundredths is the decimal; that many out of 100 is the percent.`,
              `Interruptor ${firstFrac + 1}: ${fr.den} × ${100 / fr.den} = 100, así que multiplica ${fr.num} por ${100 / fr.den} también. Esos centésimos son el decimal; esa cantidad de cada 100 es el porcentaje.`,
            ),
      ],
      async check() {
        const res = M.judgeBreakers(rows, entries);
        if (res.incomplete) return res;
        if (!res.ok) {
          sel = Math.max(
            0,
            blanks.findIndex((b) => b.row === res.row && b.kind === res.kind),
          );
        }
        await testUpTo(res.ok ? -1 : res.row);
        return res;
      },
      async demo() {
        result.fill("off");
        for (let b = 0; b < blanks.length; b++) {
          const { row, kind } = blanks[b];
          const r = rows[row];
          sel = b;
          entries[row][kind] = kind === "pct" ? String(r.p) : M.decStr(r.p);
          draw();
          const tip =
            r.given === "fraction"
              ? kind === "dec"
                ? `${r.num}/${r.den} = ${r.p}/100`
                : `${r.p}/100 = ${r.p}%`
              : r.given === "decimal"
                ? "× 100 → %"
                : "÷ 100";
          kit.floatText(COLX[kind], ROWY[row] - 30, tip, "#f8d877", 17);
          api.sfx.tick(b * 2);
          await kit.wait(800);
        }
        await testUpTo(-1);
      },
      explain: () =>
        L(
          rows
            .map(
              (r) =>
                `${r.given === "fraction" ? r.num + "/" + r.den + " = " : ""}${M.decStr(r.p)} = ${r.p}%`,
            )
            .join(" · ") + ". Each is that many hundredths.",
          rows
            .map(
              (r) =>
                `${r.given === "fraction" ? r.num + "/" + r.den + " = " : ""}${M.decStr(r.p)} = ${r.p}%`,
            )
            .join(" · ") + ". Cada uno son esos centésimos.",
        ),
    };
  }

  Object.assign(M, {
    grid,
    breakers,
    district,
    meter,
    meterButtons,
    pulse,
    COLORS: { GOLD, CYAN, RED, AMBER, DARK, PANEL },
    W,
  });
})();
