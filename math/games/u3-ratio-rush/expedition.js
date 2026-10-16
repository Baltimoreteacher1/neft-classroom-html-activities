/* Oasis Engineers — the Ratio Rush expedition (Reveal Math Unit 3, lessons 3-1 to 3-8).
 * A dry valley turns green as the student's ratios run its irrigation. Builders live in
 * expedition-missions.js and expedition-flow.js; the shared engine is
 * /math/games/shared/expedition-engine.js.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.RR_MISSIONS;
  if (!X || !M || !window.rrGame) return;
  const { W, H } = X;
  const L = M.L;
  const { chapterDone } = X._internals;

  function palm(g, x, y, s, trunk, leaf) {
    g.lineStyle(7 * s, trunk, 1);
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(x, y),
      new Phaser.Math.Vector2(x + 14 * s, y - 40 * s),
      new Phaser.Math.Vector2(x + 6 * s, y - 78 * s),
    );
    curve.draw(g, 12);
    g.fillStyle(leaf, 1);
    const tx = x + 6 * s;
    const ty = y - 78 * s;
    for (let i = 0; i < 6; i++) {
      const ang = -Math.PI / 2 + (i - 2.5) * 0.55;
      const lx = tx + Math.cos(ang) * 30 * s;
      const ly = ty + Math.sin(ang) * 18 * s + 10 * s;
      g.fillTriangle(tx, ty, lx, ly - 5 * s, lx + 4 * s, ly + 6 * s);
    }
  }

  function paint(scene, kit, ctx) {
    const r = ctx.restored;
    const play = ctx.mode === "play";
    kit.sky(0x081b2e, kit.mix(0x5a4630, 0x2c5a55, r), "rr-sky-" + Math.round(r * 10));
    kit.glow(660, 150, 420, 0xffc46b, play ? 0.22 : 0.42, -98);
    kit.stars(36, 7);
    kit.ridge(kit.mix(0x3a3a46, 0x2b4d58, r), 300, 70, 11, { parallax: 0.15, depth: -94 });
    kit.ridge(kit.mix(0x6b5232, 0x2f6b48, r), 390, 64, 23, {
      parallax: 0.35,
      depth: -90,
      rim: kit.mix(0xc49a5a, 0x9be38c, r),
    });
    // The river grows wider and brighter as the valley is restored.
    const river = scene.add.graphics().setDepth(-88);
    river.fillStyle(0x47c2e8, 0.15 + 0.55 * r);
    const pts = [];
    for (let i = 0; i <= 20; i++) pts.push({ x: (i / 20) * W, y: 470 + Math.sin(i * 0.7) * 10 });
    river.fillPoints(
      [...pts, { x: W, y: 470 + 22 + 30 * r }, { x: 0, y: 470 + 22 + 30 * r }],
      true,
    );
    kit.ridge(kit.mix(0x8a6a3e, 0x3f8f4a, r), 540, 36, 37, { parallax: 0.6, depth: -86 });
    // Landmarks: one per chapter, lush once that chapter is restored.
    const g = scene.add.graphics().setDepth(-84);
    const done = (i) => ctx.state && chapterDone(def.chapters[i], ctx.state);
    const cols = [W / 6, W / 2, (5 * W) / 6];
    cols.forEach((cx, i) => {
      const lush = done(i);
      const trunk = lush ? 0x6b4a2a : 0x5a4a3a;
      const leaf = lush ? 0x4fbf5a : 0x7d6a45;
      if (i === 0) {
        g.fillStyle(lush ? 0x4fc3e8 : 0x6b5a40, 0.9).fillEllipse(cx, 520, 150, 34);
        for (let k = 0; k < 5; k++) {
          g.lineStyle(3, lush ? 0x8ff07a : 0x8a7a50, 1).lineBetween(
            cx - 50 + k * 25,
            512,
            cx - 50 + k * 25,
            lush ? 488 : 504,
          );
        }
      } else if (i === 1) {
        g.fillStyle(0x4a5a64, 1).fillRect(cx - 70, 470, 140, 50);
        g.fillStyle(lush ? 0x4fc3e8 : 0x2a3036, 1).fillRect(cx - 62, 478, 124, 36);
        palm(g, cx - 96, 540, 0.8, trunk, leaf);
      } else {
        g.fillStyle(lush ? 0x58d0f0 : 0x6b5a40, 0.9).fillEllipse(cx, 530, 190, 40);
        [-80, -30, 40, 90].forEach((dx, k) =>
          palm(g, cx + dx, 540, 0.9 + (k % 2) * 0.25, trunk, leaf),
        );
      }
    });
    // Extra palms appear across the valley as more of it is restored.
    const extra = Math.round(r * 8);
    for (let i = 0; i < extra; i++) palm(g, 60 + i * 95, 590, 0.7, 0x6b4a2a, 0x4fbf5a);
    kit.motes(r > 0.3 ? 0xd9ff9a : 0xffd9a0, 22);
    if (play) {
      const veil = scene.add.graphics().setDepth(-60);
      veil.fillStyle(0x02070c, 0.45).fillRect(0, 0, W, H);
    }
  }

  function onRestore(scene, kit) {
    kit.burst(W / 2, 520, 0x9be38c, 30, { gravity: -40, speed: 180 });
    kit.sfx.flow();
  }

  const L33 = "3-3";
  const def = {
    id: "u3-ratio-rush",
    title: L("Oasis Engineers", "Ingenieros del Oasis"),
    accent: "#a8ef93",
    music: { root: 196, mode: "dorian", bpm: 76 },
    skills: {
      equiv: {
        ...L("Equivalent ratios", "Razones equivalentes"),
        standard: "6.AT.1 / 6.AT.3",
        lessons: "3-1, 3-9",
      },
      table: { ...L("Ratio tables", "Tablas de razones"), standard: "6.AT.3a", lessons: L33 },
      unitRate: { ...L("Unit rates", "Tasas unitarias"), standard: "6.AT.2", lessons: "3-2, 3-8" },
      compare: {
        ...L("Compare ratio relationships", "Comparar relaciones de razones"),
        standard: "6.AT.3",
        lessons: "3-5",
      },
      graph: {
        ...L("Equivalent ratios on a graph", "Razones equivalentes en una gráfica"),
        standard: "6.AT.3a",
        lessons: "3-4",
      },
    },
    misconceptions: {
      additive: L(
        "Adding the same amount instead of multiplying",
        "Sumar lo mismo en vez de multiplicar",
      ),
      swapped: L(
        "Switching the order of the two quantities",
        "Invertir el orden de las dos cantidades",
      ),
      oneRow: L("Scaling only one row of a ratio table", "Multiplicar solo una fila de la tabla"),
      total: L(
        "Using the total instead of the amount per 1",
        "Usar el total en vez de la cantidad por 1",
      ),
      minutes: L("Reading the time as the rate", "Confundir el tiempo con la tasa"),
      compareTotals: L(
        "Comparing totals instead of unit rates",
        "Comparar totales en vez de tasas unitarias",
      ),
      notOrigin: L(
        "Equivalent-ratio lines that miss (0, 0)",
        "Rectas de razones que no pasan por (0, 0)",
      ),
      tooStrong: L("Mix too strong for the recipe", "Mezcla demasiado fuerte"),
      tooWeak: L("Mix too weak for the recipe", "Mezcla demasiado débil"),
    },
    chapters: [
      {
        id: "basin",
        name: L("Seedling Basin", "Cuenca de Plántulas"),
        landmark: L("the seedling beds", "los semilleros"),
        missions: [
          {
            id: "b1",
            type: "mixer",
            skill: "equiv",
            tier: 1,
            name: L("First Feed", "Primer abono"),
            brief: L(
              "Mix feed for the seedlings in the recipe ratio.",
              "Mezcla abono en la razón de la receta.",
            ),
          },
          {
            id: "b2",
            type: "gates",
            skill: "table",
            tier: 1,
            name: L("Sluice Gates", "Compuertas"),
            brief: L(
              "Each gate is a column of a ratio table. Open them all.",
              "Cada compuerta es una columna de una tabla de razones.",
            ),
          },
          {
            id: "b3",
            type: "mixer",
            skill: "equiv",
            tier: 2,
            name: L("Full Batch", "Tanda completa"),
            brief: L(
              "Fill both tanks to an exact total and keep the recipe.",
              "Llena los dos tanques a un total exacto con la receta.",
            ),
          },
          {
            id: "b4",
            type: "gates",
            skill: "table",
            tier: 2,
            mastery: true,
            name: L("Basin Mastery", "Dominio de la cuenca"),
            brief: L(
              "A longer canal, both rows missing values. On your own.",
              "Un canal más largo, faltan valores en las dos filas. Por tu cuenta.",
            ),
          },
        ],
      },
      {
        id: "reservoir",
        name: L("Canopy Reservoir", "Depósito del Dosel"),
        landmark: L("the canopy reservoir", "el depósito del dosel"),
        missions: [
          {
            id: "r1",
            type: "pump",
            variant: "unit",
            skill: "unitRate",
            tier: 1,
            name: L("Calibrate the Pump", "Calibrar la bomba"),
            brief: L(
              "Find liters per minute and set the meter.",
              "Halla los litros por minuto y ajusta el medidor.",
            ),
          },
          {
            id: "r2",
            type: "pump",
            variant: "apply",
            skill: "unitRate",
            tier: 2,
            name: L("Fill the Reservoir", "Llenar el depósito"),
            brief: L(
              "Use the unit rate to predict the water level.",
              "Usa la tasa unitaria para predecir el nivel.",
            ),
          },
          {
            id: "r3",
            type: "pump",
            variant: "compare",
            skill: "compare",
            tier: 2,
            name: L("Two Pumps", "Dos bombas"),
            brief: L(
              "Which pump is faster? Compare unit rates, not totals.",
              "¿Qué bomba es más rápida? Compara tasas unitarias.",
            ),
          },
          {
            id: "r4",
            type: "pump",
            variant: "apply",
            skill: "unitRate",
            tier: 2,
            mastery: true,
            name: L("Reservoir Mastery", "Dominio del depósito"),
            brief: L("Predict the level with no hints.", "Predice el nivel sin pistas."),
          },
        ],
      },
      {
        id: "oasis",
        name: L("The Living Oasis", "El Oasis Vivo"),
        landmark: L("the palm grove and pool", "el palmar y el estanque"),
        missions: [
          {
            id: "o1",
            type: "pipeline",
            skill: "graph",
            tier: 1,
            name: L("Lay the Pipe", "Tender la tubería"),
            brief: L(
              "Plot equivalent ratios so the pipe runs straight.",
              "Grafica razones equivalentes para que la tubería sea recta.",
            ),
          },
          {
            id: "o2",
            type: "mixer",
            skill: "equiv",
            tier: 3,
            name: L("Grove Feed", "Abono del palmar"),
            brief: L(
              "Bigger batches: find the water for the nutrient you poured.",
              "Tandas más grandes: halla el agua para el nutriente.",
            ),
          },
          {
            id: "o3",
            type: "pipeline",
            skill: "graph",
            tier: 2,
            name: L("Long Pipeline", "Tubería larga"),
            brief: L("Four stations, a new recipe.", "Cuatro estaciones, una receta nueva."),
          },
          {
            id: "o4",
            type: "pump",
            variant: "compare",
            skill: "compare",
            tier: 2,
            mastery: true,
            name: L("Oasis Mastery", "Dominio del oasis"),
            brief: L("Compare two pumps on your own.", "Compara dos bombas por tu cuenta."),
          },
        ],
      },
    ],
    paint,
    onRestore,
    builders: { mixer: M.mixer, gates: M.gates, pump: M.pump, pipeline: M.pipeline },
  };

  X.register(window.rrGame, def);
})();
