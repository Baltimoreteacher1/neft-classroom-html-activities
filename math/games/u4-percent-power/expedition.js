/* Neon Grid — the Percent Power expedition (Reveal Math Unit 4, lessons 4-1 to 4-5).
 * A dark city comes back online as the student's percents route its power: the Lantern
 * Quarter's windows, the Skyline Transit line, and the Night Festival. Builders live in
 * expedition-missions.js and expedition-flow.js; the pure math is in expedition-math.js;
 * the shared engine is /math/games/shared/expedition-engine.js.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.PP_MISSIONS;
  const game = window.ppGame;
  if (!X || !M || !M.grid || !M.transit || !game) return;
  const { W, H } = X;
  const { L } = M;
  const { chapterDone } = X._internals;
  const GOLD = 0xf8d877;
  const CYAN = 0x5ee8ff;
  const PINK = 0xff6fb5;

  /** A row of towers with windows; `lit` (0..1) is the share of windows on. */
  function skyline(scene, kit, seed, baseY, minH, maxH, color, lit, depth, winColor) {
    const r = kit.rng(seed);
    const g = scene.add.graphics().setDepth(depth);
    let x = -10;
    while (x < W + 10) {
      const w = r.int(34, 70);
      const h = r.int(minH, maxH);
      g.fillStyle(color, 1).fillRect(x, baseY - h, w, h + 200);
      if (r.next() < 0.3) g.fillRect(x + w / 2 - 2, baseY - h - 16, 4, 16);
      for (let wy = baseY - h + 8; wy < baseY - 6; wy += 12)
        for (let wx = x + 6; wx < x + w - 8; wx += 10)
          if (r.next() < 0.55)
            g.fillStyle(
              r.next() < lit ? winColor : kit.mix(color, 0xffffff, 0.06),
              r.next() < lit ? 0.9 : 1,
            ).fillRect(wx, wy, 4, 6);
      x += w + r.int(2, 10);
    }
    return g;
  }

  function lanternQuarter(g, kit, cx, lush) {
    // Low houses with lantern strings between their roofs.
    [-60, -10, 40].forEach((dx, i) => {
      const x = cx + dx;
      g.fillStyle(0x161a30, 1).fillRect(x - 22, 500, 44, 60);
      g.fillTriangle(x - 28, 502, x + 28, 502, x, 476);
      g.fillStyle(lush ? (i % 2 ? GOLD : 0xff9f5a) : 0x2a2f48, 1).fillRect(x - 8, 520, 16, 16);
    });
    g.lineStyle(2, 0x4a5078, 1);
    for (let s = 0; s < 2; s++) {
      const y0 = 486 + s * 8;
      const pts = [];
      for (let i = 0; i <= 12; i++)
        pts.push({ x: cx - 88 + i * 13, y: y0 + Math.sin((i / 12) * Math.PI) * 12 });
      for (let i = 1; i < pts.length; i++)
        g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
      for (let i = 1; i < 12; i += 2) {
        g.fillStyle(lush ? (i % 4 === 1 ? GOLD : PINK) : 0x343a58, 1);
        g.fillCircle(pts[i].x, pts[i].y + 6, 5);
      }
    }
  }
  function skylineTransit(g, kit, cx, lush) {
    // Elevated rail on pylons, with a train whose windows glow once restored.
    g.fillStyle(0x1a1f3a, 1).fillRect(cx - 120, 488, 240, 8);
    [-100, -30, 40, 110].forEach((dx) => g.fillRect(cx + dx - 4, 496, 8, 70));
    g.fillStyle(lush ? 0x2e3a6e : 0x1e2238, 1).fillRoundedRect(cx - 80, 462, 150, 26, 8);
    for (let i = 0; i < 7; i++)
      g.fillStyle(lush ? CYAN : 0x2c3150, 1).fillRect(cx - 70 + i * 20, 468, 12, 10);
    g.lineStyle(2, lush ? CYAN : 0x343a58, lush ? 0.9 : 1).lineBetween(
      cx - 120,
      456,
      cx + 120,
      456,
    );
  }
  function nightFestival(g, kit, cx, lush) {
    // Ferris wheel and stalls.
    const wy = 470;
    g.lineStyle(3, lush ? PINK : 0x3a3f5c, 1).strokeCircle(cx, wy, 52);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.lineStyle(2, lush ? GOLD : 0x2f3450, 1).lineBetween(
        cx,
        wy,
        cx + Math.cos(a) * 52,
        wy + Math.sin(a) * 52,
      );
      g.fillStyle(lush ? (i % 2 ? CYAN : GOLD) : 0x2c3150, 1).fillCircle(
        cx + Math.cos(a) * 52,
        wy + Math.sin(a) * 52,
        6,
      );
    }
    g.lineStyle(4, 0x1a1f3a, 1)
      .lineBetween(cx, wy, cx - 30, 566)
      .lineBetween(cx, wy, cx + 30, 566);
    [-110, 90].forEach((dx, i) => {
      g.fillStyle(0x161a30, 1).fillRect(cx + dx - 26, 520, 52, 46);
      g.fillStyle(lush ? (i ? PINK : GOLD) : 0x2a2f48, 1).fillTriangle(
        cx + dx - 32,
        522,
        cx + dx + 32,
        522,
        cx + dx,
        500,
      );
    });
  }

  function paint(scene, kit, ctx) {
    const r = ctx.restored;
    const play = ctx.mode === "play";
    kit.sky(
      kit.mix(0x04050c, 0x0a0c24, r),
      kit.mix(0x15122a, 0x3b1e58, r),
      "pp-sky-" + Math.round(r * 10),
    );
    kit.stars(50, 13, 0xdfe6ff);
    kit.glow(W / 2, 600, 900, kit.mix(0x22184a, 0xff7fb0, r), 0.18 + 0.3 * r, -98);
    kit.glow(640, 110, 160, 0xf3f0d0, play ? 0.18 : 0.35, -97);
    skyline(
      scene,
      kit,
      21,
      430,
      90,
      210,
      0x0e1128,
      0.08 + 0.6 * r,
      -93,
      kit.mix(0x8a7a50, 0xa8b8ff, r),
    );
    skyline(
      scene,
      kit,
      37,
      500,
      60,
      170,
      0x0b0d1f,
      0.05 + 0.75 * r,
      -90,
      kit.mix(0x8a7a50, GOLD, r),
    );
    // Power lines strung across the city: they glow as more of the grid comes back.
    const wires = scene.add.graphics().setDepth(-88);
    [0, 1].forEach((k) => {
      wires.lineStyle(2, kit.mix(0x2a2f48, CYAN, r), 0.35 + 0.5 * r);
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        pts.push({ x: t * W, y: 392 + k * 14 + Math.abs(Math.sin(t * Math.PI * 4)) * -22 + 22 });
      }
      for (let i = 1; i < pts.length; i++)
        wires.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    });
    [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
      wires.fillStyle(0x0b0d1f, 1).fillRect(t * W - 3, 384, 6, 130);
      if (r > 0.05) kit.glow(t * W, 388, 30, CYAN, 0.25 + 0.4 * r, -87);
    });
    // Ground and landmarks — one per chapter, lit once that chapter is restored.
    const ground = scene.add.graphics().setDepth(-86);
    ground.fillStyle(0x07081a, 1).fillRect(0, 560, W, 40);
    ground.fillStyle(kit.mix(0x15182c, 0x2a1e48, r), 1).fillRect(0, 556, W, 6);
    const g = scene.add.graphics().setDepth(-84);
    const done = (i) => !!ctx.state && chapterDone(def.chapters[i], ctx.state);
    const cols = [W / 6, W / 2, (5 * W) / 6];
    lanternQuarter(g, kit, cols[0], done(0));
    skylineTransit(g, kit, cols[1], done(1));
    nightFestival(g, kit, cols[2], done(2));
    cols.forEach((cx, i) => {
      if (done(i)) kit.glow(cx, 500, 260, i === 0 ? GOLD : i === 1 ? CYAN : PINK, 0.35, -85);
    });
    kit.motes(r > 0.3 ? GOLD : 0x8a90c0, 20, { top: 300, bottom: 600 });
    if (play) {
      const veil = scene.add.graphics().setDepth(-60);
      veil.fillStyle(0x02030a, 0.5).fillRect(0, 0, W, H);
    }
  }

  function onRestore(scene, kit) {
    kit.burst(W / 2, 470, GOLD, 30, { gravity: -40, speed: 200 });
    kit.sfx.hum();
  }

  const def = {
    id: "u4-percent-power",
    title: L("Neon Grid", "Red de Neón"),
    accent: "#f8d877",
    music: { root: 220, mode: "minor", bpm: 80 },
    // The classic title screen keeps its centre column; the default corner is free.
    skills: {
      understand: {
        ...L("Understand percent", "Entender el porcentaje"),
        standard: "6.AT.4",
        lessons: "4-1",
      },
      relate: {
        ...L("Fractions, decimals and percents", "Fracciones, decimales y porcentajes"),
        standard: "6.AT.4",
        lessons: "4-2",
      },
      estimate: {
        ...L("Estimate a percent of a number", "Estimar el porcentaje de un número"),
        standard: "6.AT.4",
        lessons: "4-3",
      },
      percentOf: {
        ...L("Find a percent of a number", "Hallar el porcentaje de un número"),
        standard: "6.AT.4",
        lessons: "4-4",
      },
      compare: {
        ...L("Compare with percents", "Comparar con porcentajes"),
        standard: "6.AT.4",
        lessons: "4-4",
      },
      whole: {
        ...L(
          "Find the whole from a part and percent",
          "Hallar el total con la parte y el porcentaje",
        ),
        standard: "6.AT.4",
        lessons: "4-5",
      },
    },
    misconceptions: {
      percentAsNumber: L(
        "Treating the percent as the amount (30% of 50 → 30)",
        "Tomar el porcentaje como la cantidad (30% de 50 → 30)",
      ),
      divideByPercent: L("Dividing by the percent", "Dividir entre el porcentaje"),
      decimalShift: L(
        "Decimal point in the wrong place (0.05 vs 0.5)",
        "Punto decimal en el lugar equivocado (0.05 y 0.5)",
      ),
      complement: L(
        "Finding the part that is left instead of the part asked for",
        "Hallar la parte que sobra en vez de la parte pedida",
      ),
      wholeAsPart: L("Using the whole instead of the part", "Usar el total en vez de la parte"),
      fractionParts: L(
        "Using the digits of a fraction as the percent",
        "Usar los dígitos de una fracción como el porcentaje",
      ),
      notEquivalent: L(
        "Fraction, decimal and percent that are not equal",
        "Fracción, decimal y porcentaje que no son iguales",
      ),
      partAsWhole: L("Using the part as the whole", "Usar la parte como el total"),
      reversed: L("Mixing up the part and the whole", "Confundir la parte con el total"),
      biggerPercent: L(
        "Thinking a bigger percent always means a bigger amount",
        "Creer que un porcentaje mayor siempre es una cantidad mayor",
      ),
      estimateOff: L(
        "Estimate too far from the real amount",
        "Estimación muy lejos de la cantidad real",
      ),
      tooMuch: L(
        "Too much: more than the percent asked for",
        "Demasiado: más que el porcentaje pedido",
      ),
      tooLittle: L(
        "Too little: less than the percent asked for",
        "Muy poco: menos que el porcentaje pedido",
      ),
    },
    chapters: [
      {
        id: "lantern",
        name: L("Lantern Quarter", "Barrio de los Faroles"),
        landmark: L("the lantern blocks", "los bloques de faroles"),
        missions: [
          {
            id: "l1",
            type: "grid",
            skill: "understand",
            tier: 1,
            name: L("First Lights", "Primeras luces"),
            brief: L(
              "Light a percent of a 100-window block.",
              "Enciende un porcentaje de un bloque de 100 ventanas.",
            ),
          },
          {
            id: "l2",
            type: "breakers",
            skill: "relate",
            tier: 1,
            name: L("Breaker Panel", "Panel de interruptores"),
            brief: L(
              "Write each fraction as a decimal and a percent.",
              "Escribe cada fracción como decimal y como porcentaje.",
            ),
          },
          {
            id: "l3",
            type: "grid",
            skill: "relate",
            tier: 2,
            name: L("Coded Orders", "Órdenes en clave"),
            brief: L(
              "The order is a fraction or a decimal. Light that share of the block.",
              "La orden es una fracción o un decimal. Enciende esa parte del bloque.",
            ),
          },
          {
            id: "l4",
            type: "breakers",
            skill: "relate",
            tier: 2,
            mastery: true,
            name: L("Quarter Mastery", "Dominio del barrio"),
            brief: L(
              "Four breakers, mixed forms. On your own.",
              "Cuatro interruptores, formas mezcladas. Por tu cuenta.",
            ),
          },
        ],
      },
      {
        id: "transit",
        name: L("Skyline Transit", "Tránsito del Horizonte"),
        landmark: L("the skyline rail line", "la línea del tren elevado"),
        missions: [
          {
            id: "s1",
            type: "transit",
            variant: "find",
            skill: "percentOf",
            tier: 1,
            name: L("Station Power", "Energía de la estación"),
            brief: L(
              "Send exactly a percent of the plant's output.",
              "Envía exactamente un porcentaje de la producción.",
            ),
          },
          {
            id: "s2",
            type: "transit",
            variant: "estimate",
            skill: "estimate",
            tier: 2,
            name: L("Smart Estimate", "Estimación inteligente"),
            brief: L(
              "Awkward numbers: estimate with a friendly percent.",
              "Números difíciles: estima con un porcentaje fácil.",
            ),
          },
          {
            id: "s3",
            type: "transit",
            variant: "compare",
            skill: "compare",
            tier: 2,
            name: L("Two Lines", "Dos líneas"),
            brief: L(
              "Which line sends more MW? Compare amounts, not percents.",
              "¿Qué línea envía más MW? Compara cantidades, no porcentajes.",
            ),
          },
          {
            id: "s4",
            type: "transit",
            variant: "find",
            skill: "percentOf",
            tier: 3,
            mastery: true,
            name: L("Transit Mastery", "Dominio del tránsito"),
            brief: L(
              "Harder percents, bigger plants. On your own.",
              "Porcentajes más difíciles, plantas más grandes. Por tu cuenta.",
            ),
          },
        ],
      },
      {
        id: "festival",
        name: L("The Night Festival", "El Festival Nocturno"),
        landmark: L("the festival lights", "las luces del festival"),
        missions: [
          {
            id: "f1",
            type: "plant",
            skill: "whole",
            tier: 1,
            name: L("How Big Is the Plant?", "¿Qué tan grande es la planta?"),
            brief: L(
              "Know the part and its percent; find the plant's total.",
              "Sabes la parte y su porcentaje; halla el total.",
            ),
          },
          {
            id: "f2",
            type: "transit",
            variant: "estimate",
            skill: "estimate",
            tier: 3,
            name: L("Festival Estimate", "Estimación del festival"),
            brief: L(
              "Estimate the load for the stalls with a benchmark.",
              "Estima la carga de los puestos con una referencia.",
            ),
          },
          {
            id: "f3",
            type: "plant",
            skill: "whole",
            tier: 2,
            name: L("The Big Wheel", "La gran rueda"),
            brief: L(
              "New percents. Find the whole output again.",
              "Nuevos porcentajes. Halla otra vez la producción total.",
            ),
          },
          {
            id: "f4",
            type: "plant",
            skill: "whole",
            tier: 3,
            mastery: true,
            name: L("Festival Mastery", "Dominio del festival"),
            brief: L("Find the whole with no hints.", "Halla el total sin pistas."),
          },
        ],
      },
    ],
    paint,
    onRestore,
    builders: { grid: M.grid, breakers: M.breakers, transit: M.transit, plant: M.plant },
  };

  X.register(game, def);
})();
