/* Orbital Builders — the Volume Blast expedition (Reveal Math Unit 5: lessons 5-5,
 * 5-6, 5-7, 5-8 and 5-10; the "u10" folder name is historical).
 * A dark orbital station powers up as the student's volume, net and surface-area
 * mathematics loads its cargo, grows its greenhouse and plates its hull. Builders live
 * in expedition-missions.js, expedition-build.js and expedition-hull.js; all the
 * mathematics is in expedition-math.js; the shared engine is
 * /math/games/shared/expedition-engine.js.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const K = window.VB_MISSIONS;
  const M = window.VB_MATH;
  const game = window.vbGame;
  if (!X || !K || !M || !K.hull || !K.packer || !game) return;
  const { W, H } = X;
  const { L } = M;
  const { chapterDone } = X._internals;
  const TRUSS_Y = 452;

  function dock(g, kit, cx, lush) {
    const y = TRUSS_Y;
    g.fillStyle(lush ? 0x40597e : 0x30363f, 1).fillRect(cx - 70, y - 62, 140, 62);
    g.fillStyle(lush ? 0x5d7fb0 : 0x3a414b, 1).fillRect(cx - 70, y - 70, 140, 10);
    g.fillStyle(lush ? 0x0d2140 : 0x15181d, 1).fillRect(cx - 52, y - 54, 104, 46);
    if (lush) {
      // Crates stacked inside the lit bay.
      [0, 1, 2, 3].forEach((i) => {
        g.fillStyle(0xb9d4ff, 1).fillRect(cx - 46 + i * 24, y - 28, 20, 20);
        g.lineStyle(1, 0x15244a, 1).strokeRect(cx - 46 + i * 24, y - 28, 20, 20);
      });
      [0, 1].forEach((i) => {
        g.fillStyle(0x8fb3f0, 1).fillRect(cx - 34 + i * 24, y - 50, 20, 20);
        g.lineStyle(1, 0x15244a, 1).strokeRect(cx - 34 + i * 24, y - 50, 20, 20);
      });
      for (let i = 0; i < 5; i++) g.fillStyle(0x9cf27f, 1).fillCircle(cx - 60 + i * 30, y - 66, 3);
      kit.glow(cx, y - 32, 170, 0xa1c3ff, 0.35, -85);
    } else {
      g.lineStyle(2, 0x59606b, 0.8);
      g.lineBetween(cx - 52, y - 54, cx + 52, y - 8);
      g.lineBetween(cx + 52, y - 54, cx - 52, y - 8);
    }
  }
  function greenhouse(g, kit, cx, lush) {
    const y = TRUSS_Y;
    g.fillStyle(lush ? 0x3c5a72 : 0x2c333c, 1).fillRect(cx - 64, y - 24, 128, 24);
    g.fillStyle(lush ? 0x1d3f3a : 0x161b22, 0.9)
      .slice(cx, y - 24, 62, Math.PI, 0, false)
      .fillPath();
    if (lush) {
      for (let i = 0; i < 7; i++) {
        const px = cx - 48 + i * 16;
        g.lineStyle(3, 0x5fc27a, 1).lineBetween(px, y - 26, px, y - 40 - (i % 3) * 8);
        g.fillStyle(0x9cf27f, 1).fillEllipse(px + 4, y - 42 - (i % 3) * 8, 12, 7);
      }
      kit.glow(cx, y - 40, 200, 0x9cf27f, 0.35, -85);
    }
    g.lineStyle(2.5, lush ? 0xcff6ff : 0x5b6672, 0.9).beginPath();
    g.arc(cx, y - 24, 62, Math.PI, 0, false);
    g.strokePath();
    for (let a = 1; a < 4; a++) {
      const t = Math.PI + (a * Math.PI) / 4;
      g.lineStyle(1.5, lush ? 0xcff6ff : 0x5b6672, 0.5).lineBetween(
        cx,
        y - 24,
        cx + Math.cos(t) * 62,
        y - 24 + Math.sin(t) * 62,
      );
    }
  }
  function station(g, kit, cx, lush) {
    const y = TRUSS_Y - 40;
    // Solar wings.
    [-1, 1].forEach((side) => {
      const x0 = cx + side * 56;
      const x1 = cx + side * 132;
      const left = Math.min(x0, x1);
      g.lineStyle(3, 0x7d8794, 1).lineBetween(cx + side * 30, y, x0, y);
      if (lush) {
        g.fillStyle(0x2f6fd0, 1).fillRect(left, y - 22, 76, 44);
        g.lineStyle(1, 0xa1c3ff, 0.7);
        for (let k = 1; k < 4; k++) g.lineBetween(left + k * 19, y - 22, left + k * 19, y + 22);
        g.lineBetween(left, y, left + 76, y);
      } else {
        g.lineStyle(1.5, 0x59606b, 0.9).strokeRect(left, y - 22, 76, 44);
        g.lineBetween(left, y - 22, left + 76, y + 22);
      }
    });
    // Ring and hub.
    g.lineStyle(6, lush ? 0x9fb8d8 : 0x3e4550, 1).strokeEllipse(cx, y, 120, 34);
    g.fillStyle(lush ? 0x5d7fb0 : 0x30363f, 1).fillCircle(cx, y, 28);
    g.lineStyle(2, lush ? 0xeaf6ff : 0x59606b, 0.9).strokeCircle(cx, y, 28);
    if (lush) {
      for (let i = 0; i < 8; i++) {
        const t = (i / 8) * Math.PI * 2;
        g.fillStyle(0xffe39a, 1).fillCircle(cx + Math.cos(t) * 60, y + Math.sin(t) * 17, 2.5);
      }
      g.fillStyle(0xffe39a, 0.9).fillCircle(cx, y, 9);
      kit.glow(cx, y, 220, 0xa1c3ff, 0.4, -85);
    }
    g.lineStyle(4, 0x7d8794, 1).lineBetween(cx, y + 28, cx, TRUSS_Y);
  }

  function paint(scene, kit, ctx) {
    const r = ctx.restored;
    const play = ctx.mode === "play";
    kit.sky(0x02040c, kit.mix(0x0b1028, 0x173a66, r), "vb-sky-" + Math.round(r * 10));
    kit.stars(110, 41, 0xdfe9ff);
    kit.glow(170, 150, 420, 0x7a5cff, 0.14 + 0.1 * r, -97);
    kit.glow(700, 120, 340, 0xa1c3ff, 0.14 + 0.16 * r, -97);
    kit.glow(770, 64, 200, 0xffe2a8, 0.5, -98);
    // The planet below: grey and dim at first, blue and green as the station comes alive.
    const pl = scene.add.graphics().setDepth(-93);
    pl.fillStyle(kit.mix(0x23272f, 0x1c4f86, r), 1).fillCircle(W / 2, 1230, 760);
    pl.fillStyle(kit.mix(0x2f333b, 0x3c8f62, r), 0.85);
    pl.fillEllipse(220, 520, 220, 40);
    pl.fillEllipse(560, 500, 160, 30);
    pl.fillEllipse(700, 560, 240, 50);
    pl.lineStyle(16, 0x7fc4ff, 0.06 + 0.12 * r).strokeCircle(W / 2, 1230, 768);
    pl.lineStyle(4, 0xa8dcff, 0.15 + 0.45 * r).strokeCircle(W / 2, 1230, 761);
    kit.ridge(kit.mix(0x0b0f18, 0x10203a, r), 250, 18, 5, {
      alpha: 0.35,
      depth: -96,
      parallax: 0.1,
    });
    // Orbital truss with the three landmarks.
    const g = scene.add.graphics().setDepth(-86);
    g.lineStyle(3, 0x7d8794, 1);
    g.lineBetween(20, TRUSS_Y, W - 20, TRUSS_Y);
    g.lineBetween(20, TRUSS_Y + 14, W - 20, TRUSS_Y + 14);
    g.lineStyle(1.5, 0x7d8794, 0.8);
    for (let x = 20; x < W - 20; x += 20) g.lineBetween(x, TRUSS_Y, x + 20, TRUSS_Y + 14);
    const done = (i) => !!ctx.state && chapterDone(def.chapters[i], ctx.state);
    dock(g, kit, W / 6, done(0));
    greenhouse(g, kit, W / 2, done(1));
    station(g, kit, (5 * W) / 6, done(2));
    // Small solar panels light up along the truss as the station is restored.
    const lit = Math.round(r * 8);
    const spots = [40, 250, 300, 520, 570, 790 - 40, 225, 595];
    spots.slice(0, 8).forEach((x, i) => {
      const on = i < lit;
      g.fillStyle(on ? 0x2f6fd0 : 0x262b33, 1).fillRect(x - 12, TRUSS_Y + 18, 24, 14);
      g.lineStyle(1, on ? 0xa1c3ff : 0x4a515c, 0.9).strokeRect(x - 12, TRUSS_Y + 18, 24, 14);
    });
    kit.motes(0xcfe3ff, 16, {
      speedY: { min: -3, max: 3 },
      speedX: { min: -9, max: -3 },
      top: 40,
      bottom: 440,
    });
    if (play) {
      const veil = scene.add.graphics().setDepth(-60);
      veil.fillStyle(0x02050c, 0.62).fillRect(0, 0, W, H);
    }
  }

  function onRestore(scene, kit) {
    kit.burst(W / 2, TRUSS_Y - 40, 0xa1c3ff, 30, { gravity: -30, speed: 200 });
    kit.sfx.unlock?.();
  }

  const mission = (id, type, skill, tier, name, brief, extra = {}) => ({
    id,
    type,
    skill,
    tier,
    name,
    brief,
    ...extra,
  });
  const def = {
    id: "u10-volume-blast",
    title: L("Orbital Builders", "Constructores Orbitales"),
    accent: "#a1c3ff",
    music: { root: 196, mode: "major", bpm: 70 },
    skills: {
      volume: {
        ...L("Volume of rectangular prisms", "Volumen de prismas rectangulares"),
        standard: "6.GR.2",
        lessons: "5-5",
      },
      volumeFrac: {
        ...L(
          "Volume with fractional edges (V = B × h)",
          "Volumen con aristas fraccionarias (V = B × h)",
        ),
        standard: "6.GR.2",
        lessons: "5-10",
      },
      nets: {
        ...L("Nets of three-dimensional figures", "Redes de figuras tridimensionales"),
        standard: "6.GR.4",
        lessons: "5-6",
      },
      saPrism: {
        ...L("Surface area of prisms", "Área de superficie de prismas"),
        standard: "6.GR.4",
        lessons: "5-7",
      },
      saPyramid: {
        ...L("Surface area of pyramids", "Área de superficie de pirámides"),
        standard: "6.GR.4",
        lessons: "5-8",
      },
    },
    misconceptions: {
      addDims: L(
        "Adding the edges instead of multiplying",
        "Sumar las aristas en vez de multiplicar",
      ),
      oneLayer: L("Counting only one layer", "Contar solo una capa"),
      visibleOnly: L("Counting only the cubes you can see", "Contar solo los cubos que se ven"),
      areaNotVolume: L("Using surface area for volume", "Usar el área de superficie como volumen"),
      miscount: L("Miscounting the cubes", "Contar mal los cubos"),
      noFit: L("Right volume, but too big for the space", "Volumen correcto, pero no cabe"),
      subtractBase: L(
        "Subtracting the base instead of dividing",
        "Restar la base en vez de dividir",
      ),
      oneEdge: L(
        "Dividing by one edge instead of the base area",
        "Dividir entre una arista y no entre el área de la base",
      ),
      countSmall: L(
        "Counting small cubes as unit cubes",
        "Contar cubos pequeños como cubos unidad",
      ),
      smallCube: L(
        "Wrong volume for one small cube (½ × ½ × ½)",
        "Volumen incorrecto de un cubo pequeño (½ × ½ × ½)",
      ),
      splitMixed: L(
        "Multiplying only the whole numbers of a mixed number",
        "Multiplicar solo los enteros de un número mixto",
      ),
      roundedEdges: L("Rounding a fractional edge", "Redondear una arista fraccionaria"),
      packShort: L("Volume too small", "Volumen demasiado pequeño"),
      packOver: L("Volume too large", "Volumen demasiado grande"),
      netOverlap: L("Net faces that overlap", "Caras de la red que se enciman"),
      netDetached: L(
        "A face not joined along a full edge",
        "Una cara no unida por una arista completa",
      ),
      netSize: L("Joining edges of different lengths", "Unir aristas de distinto largo"),
      netDouble: L("Two faces folding onto the same side", "Dos caras que caen en el mismo lado"),
      volumeNotArea: L("Using volume for surface area", "Usar el volumen como área de superficie"),
      halfFaces: L("Counting only 3 faces of a prism", "Contar solo 3 caras del prisma"),
      faceCount: L("Counting the faces wrong", "Contar mal las caras"),
      forgotBase: L("Forgetting the base of a pyramid", "Olvidar la base de la pirámide"),
      noHalf: L("Forgetting ½ in the triangle area", "Olvidar el ½ en el área del triángulo"),
      usedHeight: L(
        "Using the height instead of the slant height",
        "Usar la altura en vez de la altura inclinada",
      ),
      plateShort: L("Surface area too small", "Área de superficie demasiado pequeña"),
      plateOver: L("Surface area too large", "Área de superficie demasiado grande"),
    },
    chapters: [
      {
        id: "dock",
        name: L("Supply Dock", "Muelle de Suministros"),
        landmark: L("the supply dock", "el muelle de suministros"),
        missions: [
          mission(
            "d1",
            "loader",
            "volume",
            1,
            L("Fill the Cargo Bay", "Llena la bodega"),
            L(
              "Order exactly enough crates to fill a cargo bay.",
              "Pide las cajas exactas para llenar una bodega.",
            ),
          ),
          mission(
            "d2",
            "module",
            "volume",
            1,
            L("Fit the Docking Bay", "Ajusta la bahía"),
            L(
              "Choose length, width and height so a module holds the whole manifest.",
              "Elige largo, ancho y alto para que el módulo guarde todo el manifiesto.",
            ),
            { variant: "dims" },
          ),
          mission(
            "d3",
            "module",
            "volume",
            2,
            L("Stack the Layers", "Apila las capas"),
            L(
              "The floor is fixed. How many layers hold the cargo?",
              "El piso es fijo. ¿Cuántas capas guardan la carga?",
            ),
            { variant: "base" },
          ),
          mission(
            "d4",
            "loader",
            "volume",
            2,
            L("Dock Mastery", "Dominio del muelle"),
            L(
              "A bigger bay, fewer guide crates. On your own.",
              "Una bodega más grande, menos cajas guía. Por tu cuenta.",
            ),
            { mastery: true },
          ),
        ],
      },
      {
        id: "greenhouse",
        name: L("Greenhouse Module", "Módulo Invernadero"),
        landmark: L("the greenhouse dome", "la cúpula del invernadero"),
        missions: [
          mission(
            "g1",
            "packer",
            "volumeFrac",
            1,
            L("Half-Cube Seed Trays", "Bandejas de medio cubo"),
            L(
              "Pack a tray with ½-unit cubes and find its volume.",
              "Llena una bandeja con cubos de ½ unidad y halla su volumen.",
            ),
            { variant: "half" },
          ),
          mission(
            "g2",
            "net",
            "nets",
            1,
            L("Unfold a Seed Crate", "Desdobla una caja"),
            L(
              "Finish the net so it folds into a closed cube.",
              "Completa la red para que se doble en un cubo cerrado.",
            ),
          ),
          mission(
            "g3",
            "packer",
            "volumeFrac",
            2,
            L("Soil for the Grow Box", "Tierra para la caja de cultivo"),
            L("Use V = B × h with fractional edges.", "Usa V = B × h con aristas fraccionarias."),
            { variant: "base" },
          ),
          mission(
            "g4",
            "packer",
            "volumeFrac",
            3,
            L("Greenhouse Mastery", "Dominio del invernadero"),
            L(
              "A water tank packed with ⅓-unit cubes. On your own.",
              "Un tanque lleno de cubos de ⅓ de unidad. Por tu cuenta.",
            ),
            { variant: "third", mastery: true },
          ),
        ],
      },
      {
        id: "station",
        name: L("The New Station", "La Nueva Estación"),
        landmark: L(
          "the station hub and solar wings",
          "el centro de la estación y sus alas solares",
        ),
        missions: [
          mission(
            "s1",
            "net",
            "nets",
            2,
            L("Cut the Hull Plates", "Corta las placas del casco"),
            L(
              "Place the missing plate so the module's net folds shut.",
              "Coloca la placa que falta para que la red del módulo se cierre.",
            ),
          ),
          mission(
            "s2",
            "hull",
            "saPrism",
            1,
            L("Plate a Module", "Cubre un módulo"),
            L(
              "Order plating for every face of a prism.",
              "Pide placas para cada cara de un prisma.",
            ),
            { variant: "prism" },
          ),
          mission(
            "s3",
            "hull",
            "saPyramid",
            2,
            L("Pyramid Roof", "Techo piramidal"),
            L(
              "Plate a square pyramid: base and 4 triangles.",
              "Cubre una pirámide cuadrada: base y 4 triángulos.",
            ),
            { variant: "pyramid" },
          ),
          mission(
            "s4",
            "hull",
            "saPyramid",
            3,
            L("Station Mastery", "Dominio de la estación"),
            L(
              "Plate a bigger pyramid roof. On your own.",
              "Cubre un techo piramidal más grande. Por tu cuenta.",
            ),
            { variant: "pyramid", mastery: true },
          ),
        ],
      },
    ],
    paint,
    onRestore,
    builders: { loader: K.loader, module: K.module, packer: K.packer, net: K.net, hull: K.hull },
  };

  X.register(game, def);
})();
