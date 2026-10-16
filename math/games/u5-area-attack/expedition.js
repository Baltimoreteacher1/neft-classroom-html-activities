/* Terrace Architects — the Area Attack expedition (Reveal Math Unit 5: 5-1, 5-2, 5-3, 5-4, 5-9).
 * A dry hillside of terraces turns green as the student's area calculations pave its
 * plots, courtyards and pavilions. Maths: expedition-core.js. Builders:
 * expedition-missions.js (frame, tiles), expedition-yard.js (courtyard) and
 * expedition-pavilion.js (pavilion, edging). Shared engine: /math/games/shared/expedition-engine.js.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.AA_MISSIONS;
  // biome-ignore lint/correctness/noUndeclaredVariables: top-level const of the classic game script
  if (!X || !M || !M.builders || typeof aaGame === "undefined") return;
  const { W, H } = X;
  const { L } = M;
  const { chapterDone } = X._internals;

  function plantRow(g, x0, y, n, gap, lush, k = 1) {
    for (let i = 0; i < n; i++) {
      const x = x0 + i * gap;
      if (lush) {
        g.lineStyle(2, 0x3f8f4a, 1).lineBetween(x, y, x, y - 12 * k);
        g.fillStyle(i % 3 ? 0x7ee36d : 0xf28bb8, 1).fillCircle(x, y - 13 * k, 4 * k);
      } else g.fillStyle(0x6b5a40, 1).fillRect(x - 1, y - 4, 2, 4);
    }
  }

  function paint(scene, kit, ctx) {
    const r = ctx.restored;
    const play = ctx.mode === "play";
    const done = (i) => !!ctx.state && chapterDone(def.chapters[i], ctx.state);
    kit.sky(kit.mix(0x1b1430, 0x0f2a3a, r), kit.mix(0x8a5a3a, 0xbfe3a0, r), "aa-sky-" + Math.round(r * 10));
    kit.glow(150, 120, 380, 0xffd38a, play ? 0.2 : 0.45, -98);
    kit.stars(30, 5, 0xfff4d6);
    kit.ridge(kit.mix(0x3b3346, 0x2f5a5a, r), 280, 60, 13, { parallax: 0.12, depth: -95 });
    kit.ridge(kit.mix(0x5d4834, 0x3c7a4c, r), 340, 50, 29, {
      parallax: 0.3,
      depth: -92,
      rim: kit.mix(0xb8936a, 0xccf589, r),
    });
    // Stepped terraces climbing the hill from left to right.
    const t = scene.add.graphics().setDepth(-88);
    const bands = 5;
    for (let i = 0; i < bands; i++) {
      const y = 560 - i * 44;
      const x0 = -20 + i * 120;
      const lit = r * bands > i;
      t.fillStyle(kit.mix(0x6b5232, lit ? 0x4f9a52 : 0x7a5f3a, lit ? 0.85 : 0.3), 1);
      t.fillRect(x0, y - 44, W - x0 + 20, 44);
      t.fillStyle(kit.mix(0x8a7458, 0x9aa38a, r), 1).fillRect(x0, y - 8, W - x0 + 20, 8);
      t.lineStyle(2, 0x2a1d12, 0.5).lineBetween(x0, y - 44, x0, y);
      if (lit) plantRow(t, x0 + 24, y - 12, Math.floor((W - x0) / 34), 34, true, 0.8);
    }
    // River along the foot of the terraces; it runs clearer as the hillside is restored.
    const river = scene.add.graphics().setDepth(-87);
    river.fillStyle(kit.mix(0x5a4a3a, 0x48b5e8, r), 0.5 + 0.4 * r);
    const pts = [];
    for (let i = 0; i <= 20; i++) pts.push({ x: (i / 20) * W, y: 568 + Math.sin(i * 0.8) * 6 });
    river.fillPoints([...pts, { x: W, y: H }, { x: 0, y: H }], true);

    // Landmarks, lush once their chapter is restored.
    const g = scene.add.graphics().setDepth(-84);
    // 0 · River Terrace: three stepped beds beside the river.
    const lush0 = done(0);
    for (let k = 0; k < 3; k++) {
      const x = 60 + k * 40;
      const y = 548 - k * 22;
      g.fillStyle(lush0 ? 0x3d6b3a : 0x5a4330, 1).fillRect(x, y - 20, 170 - k * 40, 20);
      g.fillStyle(0xb9ad8f, 1).fillRect(x, y - 4, 170 - k * 40, 4);
      plantRow(g, x + 10, y - 6, Math.floor((150 - k * 40) / 16), 16, lush0);
    }
    // 1 · Sunken Courtyard: a paved square set into the slope, with a fountain.
    const lush1 = done(1);
    const cx = 410;
    g.fillStyle(0x3a2e24, 1).fillPoints(
      [
        { x: cx - 110, y: 470 },
        { x: cx + 110, y: 470 },
        { x: cx + 80, y: 520 },
        { x: cx - 80, y: 520 },
      ],
      true,
    );
    g.fillStyle(lush1 ? 0xd9cfae : 0x6b5a46, 1).fillPoints(
      [
        { x: cx - 96, y: 476 },
        { x: cx + 96, y: 476 },
        { x: cx + 72, y: 514 },
        { x: cx - 72, y: 514 },
      ],
      true,
    );
    if (lush1) {
      g.lineStyle(1, 0xa89a78, 1);
      for (let k = -4; k <= 4; k++) g.lineBetween(cx + k * 20, 476, cx + k * 15, 514);
      g.fillStyle(0x58c8f0, 1).fillEllipse(cx, 494, 50, 14);
      g.fillStyle(0xbfe9ff, 0.9).fillRect(cx - 2, 470, 4, 22);
      kit.glow(cx, 488, 120, 0x58c8f0, play ? 0.15 : 0.35, -83);
    } else {
      g.lineStyle(2, 0x3a2e24, 0.9).lineBetween(cx - 40, 480, cx - 10, 500).lineBetween(cx - 10, 500, cx + 30, 492);
    }
    // 2 · The Hanging Garden: a stepped tower crowned with a hexagon pavilion.
    const lush2 = done(2);
    const hx = 680;
    [
      [150, 470, 50],
      [110, 420, 50],
      [70, 370, 50],
    ].forEach(([w, y, h], k) => {
      g.fillStyle(kit.mix(0x6d6152, 0x8f8a7a, k * 0.2), 1).fillRect(hx - w / 2, y, w, h);
      g.fillStyle(lush2 ? 0x4f9a52 : 0x6b5a40, 1).fillRect(hx - w / 2 - 4, y - 6, w + 8, 8);
      if (lush2)
        for (let v = 0; v < w / 14; v++) {
          const vx = hx - w / 2 + 6 + v * 14;
          const len = 14 + ((v * 7) % 18);
          g.lineStyle(2, 0x3f8f4a, 1).lineBetween(vx, y, vx + 2, y + len);
          g.fillStyle(v % 2 ? 0xf28bb8 : 0x7ee36d, 1).fillCircle(vx + 2, y + len, 3);
        }
    });
    const hex = [];
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 6 + (k * Math.PI) / 3;
      hex.push({ x: hx + Math.cos(a) * 34, y: 336 + Math.sin(a) * 16 });
    }
    g.fillStyle(lush2 ? 0xccf589 : 0x7d6a55, 1).fillPoints(hex, true);
    g.lineStyle(2, 0x2a1d12, 0.7).strokePoints(hex, true, true);
    g.lineStyle(3, 0x8f8a7a, 1).lineBetween(hx - 26, 342, hx - 26, 370).lineBetween(hx + 26, 342, hx + 26, 370);
    if (lush2) kit.glow(hx, 336, 160, 0xccf589, play ? 0.15 : 0.4, -83);
    kit.motes(r > 0.3 ? 0xeaffb0 : 0xffd9a0, 22);
    if (play) {
      const veil = scene.add.graphics().setDepth(-60);
      veil.fillStyle(0x02070c, 0.5).fillRect(0, 0, W, H);
    }
  }

  function onRestore(scene, kit) {
    kit.burst(W / 2, 470, 0xccf589, 30, { gravity: -40, speed: 180 });
    kit.sfx.place();
  }

  const m = (id, type, skill, tier, en, es, ben, bes, extra = {}) => ({
    id,
    type,
    skill,
    tier,
    name: L(en, es),
    brief: L(ben, bes),
    ...extra,
  });
  const def = {
    id: "u5-area-attack",
    title: L("Terrace Architects", "Arquitectos de Terrazas"),
    accent: "#ccf589",
    music: { root: 220, mode: "major", bpm: 72 },
    skills: {
      para: {
        ...L("Area of parallelograms and rhombuses", "Área de paralelogramos y rombos"),
        standard: "6.GR.1",
        lessons: "5-1",
      },
      tri: { ...L("Area of triangles", "Área de triángulos"), standard: "6.GR.1", lessons: "5-2" },
      trap: { ...L("Area of trapezoids", "Área de trapecios"), standard: "6.GR.1", lessons: "5-3" },
      composite: {
        ...L("Area of composite figures", "Área de figuras compuestas"),
        standard: "6.GR.1",
        lessons: "5-4",
      },
      apply: {
        ...L("Area and perimeter problems", "Problemas de área y perímetro"),
        standard: "6.GR.1",
        lessons: "5-4",
      },
      polygon: {
        ...L("Area of regular polygons", "Área de polígonos regulares"),
        standard: "6.GR.1",
        lessons: "5-9",
      },
    },
    misconceptions: {
      slantHeight: L(
        "Using the slanted side instead of the height",
        "Usar el lado inclinado en vez de la altura",
      ),
      fullWidth: L(
        "Measuring a parallelogram corner to corner as its base",
        "Medir el paralelogramo de esquina a esquina como base",
      ),
      swapped: L("Switching base and height", "Cambiar la base por la altura"),
      frameOff: L("Base or height miscounted", "Base o altura mal contadas"),
      noHalf: L("Forgetting the ½ for triangles", "Olvidar el ½ en los triángulos"),
      oneBase: L("Using only one base of a trapezoid", "Usar solo una base del trapecio"),
      perimeter: L("Confusing perimeter with area", "Confundir perímetro con área"),
      perimeterArea: L("Confusing perimeter with area", "Confundir perímetro con área"),
      addLengths: L("Adding lengths instead of multiplying", "Sumar longitudes en vez de multiplicar"),
      tooMany: L("Area too large", "Área demasiado grande"),
      tooFew: L("Area too small", "Área demasiado pequeña"),
      overlap: L(
        "Double-counting the overlap in a composite figure",
        "Contar dos veces la parte que se encima",
      ),
      wholeRect: L(
        "Using the whole outer rectangle for one piece",
        "Usar todo el rectángulo de afuera para una pieza",
      ),
      missingLength: L(
        "Using the wrong side for a piece (missing length)",
        "Usar el lado equivocado en una pieza (longitud faltante)",
      ),
      addedHole: L("Adding a cut-out instead of subtracting it", "Sumar un hueco en vez de restarlo"),
      pieceOver: L("A piece's area too large", "Área de una pieza demasiado grande"),
      pieceUnder: L("A piece's area too small", "Área de una pieza demasiado pequeña"),
      radius: L(
        "Using the radius instead of the apothem",
        "Usar el radio en vez de la apotema",
      ),
      wedgeCount: L(
        "Not one triangle per side of a regular polygon",
        "No usar un triángulo por cada lado del polígono",
      ),
      wedgeOver: L("Triangle area too large", "Área del triángulo demasiado grande"),
      wedgeUnder: L("Triangle area too small", "Área del triángulo demasiado pequeña"),
      oneWedge: L("Finding one triangle, not the whole polygon", "Hallar un solo triángulo, no todo el polígono"),
      halfEdging: L(
        "Counting only two sides for the perimeter",
        "Contar solo dos lados para el perímetro",
      ),
      areaOff: L("Right perimeter, wrong area", "Perímetro correcto, área equivocada"),
      edgingOff: L("Right area, wrong perimeter", "Área correcta, perímetro equivocado"),
      bedOff: L("Perimeter and area both off", "Perímetro y área equivocados"),
    },
    chapters: [
      {
        id: "river",
        name: L("River Terrace", "Terraza del Río"),
        landmark: L("the river terrace beds", "los canteros de la terraza del río"),
        missions: [
          m(
            "r1",
            "frame",
            "para",
            1,
            "Leaning Plot",
            "Parcela inclinada",
            "Turn a slanted plot into a rectangle with the same area.",
            "Convierte una parcela inclinada en un rectángulo con la misma área.",
          ),
          m(
            "r2",
            "tiles",
            "tri",
            1,
            "Corner Bed",
            "Cantero de esquina",
            "Order exactly enough tiles for a right-triangle bed.",
            "Pide las baldosas exactas para un cantero con forma de triángulo rectángulo.",
            { variant: "tri" },
          ),
          m(
            "r3",
            "tiles",
            "tri",
            2,
            "Slanted Bed",
            "Cantero inclinado",
            "A triangle bed with a slanted side. Find the true height.",
            "Un cantero triangular con un lado inclinado. Busca la altura verdadera.",
            { variant: "tri" },
          ),
          m(
            "r4",
            "frame",
            "para",
            2,
            "Terrace Mastery",
            "Dominio de la terraza",
            "A rhombus plot: every side is the same length. On your own.",
            "Una parcela con forma de rombo: todos los lados miden lo mismo. Por tu cuenta.",
            { variant: "rhombus", mastery: true },
          ),
        ],
      },
      {
        id: "courtyard",
        name: L("Sunken Courtyard", "Patio Hundido"),
        landmark: L("the sunken courtyard", "el patio hundido"),
        missions: [
          m(
            "c1",
            "tiles",
            "trap",
            2,
            "Trapezoid Steps",
            "Escalones de trapecio",
            "Pave a trapezoid bed. Both bases count.",
            "Pavimenta un cantero con forma de trapecio. Cuentan las dos bases.",
            { variant: "trap" },
          ),
          m(
            "c2",
            "courtyard",
            "composite",
            1,
            "L-Shaped Yard",
            "Patio en L",
            "Cut the courtyard into rectangles and pave each piece once.",
            "Corta el patio en rectángulos y pavimenta cada pieza una vez.",
          ),
          m(
            "c3",
            "courtyard",
            "composite",
            2,
            "Gable Garden",
            "Jardín con frontón",
            "A rectangle with a triangle garden on top.",
            "Un rectángulo con un jardín triangular arriba.",
          ),
          m(
            "c4",
            "courtyard",
            "composite",
            3,
            "Courtyard Mastery",
            "Dominio del patio",
            "Pave the lawn around a flower bed. On your own.",
            "Pavimenta el césped alrededor de un cantero de flores. Por tu cuenta.",
            { mastery: true },
          ),
        ],
      },
      {
        id: "hanging",
        name: L("The Hanging Garden", "El Jardín Colgante"),
        landmark: L("the hanging garden", "el jardín colgante"),
        missions: [
          m(
            "g1",
            "pavilion",
            "polygon",
            1,
            "Hexagon Pavilion",
            "Pabellón hexagonal",
            "Build a regular hexagon floor from identical triangles.",
            "Construye un piso hexagonal regular con triángulos iguales.",
          ),
          m(
            "g2",
            "edging",
            "apply",
            2,
            "Edging Puzzle",
            "Reto del borde",
            "Use all the edging and plant exactly the right area.",
            "Usa todo el borde y siembra exactamente el área pedida.",
          ),
          m(
            "g3",
            "pavilion",
            "polygon",
            2,
            "Rooftop Pavilion",
            "Pabellón de la azotea",
            "A pentagon or octagon floor, one triangle per side.",
            "Un piso de pentágono u octágono, un triángulo por cada lado.",
          ),
          m(
            "g4",
            "pavilion",
            "polygon",
            3,
            "Garden Mastery",
            "Dominio del jardín",
            "Find the floor area of a regular pavilion. On your own.",
            "Halla el área del piso de un pabellón regular. Por tu cuenta.",
            { mastery: true },
          ),
        ],
      },
    ],
    paint,
    onRestore,
    builders: M.builders,
  };

  // biome-ignore lint/correctness/noUndeclaredVariables: top-level const of the classic game script
  X.register(aaGame, def);
})();
