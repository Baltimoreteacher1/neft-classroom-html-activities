/* Atlas Rover — the Coordinate Quest expedition (Reveal Math Unit 7, lessons 7-1 to 7-9).
 * A dust-choked planet: the student programs the Atlas rover with integers, opposites,
 * absolute values and ordered pairs. Each restored chapter relights a landmark and the
 * storm clears. Math: expedition-math.js · builders: expedition-missions.js (number line)
 * and expedition-grid.js (coordinate plane) · engine: /math/games/shared/expedition-engine.js
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.CQ_MATH;
  const B = window.CQ_MISSIONS;
  const game = window.cqGame;
  if (!X || !M || !B || !B.nav || !game) return;
  const { W, H } = X;
  const { L } = M;
  const { chapterDone } = X._internals;

  /* ── World art ────────────────────────────────────────────────────────── */
  function relayMast(g, kit, x, y, lit) {
    const steel = lit ? 0xe9e4dc : 0x6a5a58;
    g.lineStyle(3, steel, 1);
    g.lineBetween(x - 22, y, x, y - 120);
    g.lineBetween(x + 22, y, x, y - 120);
    for (let k = 1; k < 6; k++) {
      const yy = y - k * 20;
      const half = 22 * (1 - (k * 20) / 120);
      g.lineStyle(2, steel, 0.8).lineBetween(x - half, yy, x + half, yy - 20 * 0.6);
    }
    g.fillStyle(steel, 1);
    if (lit) g.fillEllipse(x + 10, y - 112, 26, 12);
    else g.fillEllipse(x + 14, y - 100, 22, 9); // dish knocked loose
    if (lit) {
      g.fillStyle(0xff5a3c, 1).fillCircle(x, y - 124, 4);
      kit.glow(x, y - 124, 60, 0xff6a4a, 0.8, -87);
      g.lineStyle(2, 0xffb681, 0.7);
      [18, 30, 42].forEach((rr) =>
        g
          .beginPath()
          .arc(x + 10, y - 112, rr, -1.1, -0.2)
          .strokePath(),
      );
    }
  }
  function craterBeacon(scene, g, kit, x, y, lit) {
    g.fillStyle(0x2a1416, 1).fillEllipse(x, y + 6, 190, 40);
    g.lineStyle(3, lit ? 0xc0704a : 0x6a3a30, 1).strokeEllipse(x, y + 6, 190, 40);
    g.fillStyle(lit ? 0xe9e4dc : 0x5a4a48, 1).fillRect(x - 6, y - 70, 12, 76);
    g.fillStyle(lit ? 0xffb681 : 0x4a3a38, 1).fillRect(x - 12, y - 82, 24, 14);
    if (lit) {
      const beam = scene.add
        .image(x, y - 230, "ewl-glow")
        .setDisplaySize(46, 340)
        .setTint(0xffd2a8)
        .setAlpha(0.55)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(-87);
      kit.tween({ targets: beam, alpha: 0.85, duration: 1600, yoyo: true, repeat: -1 });
      kit.glow(x, y - 76, 120, 0xffb681, 0.9, -87);
    }
  }
  function observatory(g, kit, x, y, lit) {
    g.fillStyle(lit ? 0x5a3038 : 0x4a2a28, 1).fillEllipse(x, y + 10, 220, 60);
    g.fillStyle(lit ? 0xd8d2cc : 0x6a5c58, 1).fillRect(x - 46, y - 40, 92, 44);
    g.fillStyle(lit ? 0xeae5df : 0x75665f, 1);
    g.slice(x, y - 40, 46, Math.PI, 0, false).fillPath();
    if (lit) {
      g.fillStyle(0x10121e, 1).fillRect(x - 6, y - 86, 12, 46);
      g.lineStyle(6, 0xb9c4d6, 1).lineBetween(x, y - 52, x + 30, y - 96);
      [-28, 0, 28].forEach((dx) => g.fillStyle(0xffd27a, 1).fillRect(x + dx - 5, y - 26, 10, 12));
      kit.glow(x + 30, y - 96, 90, 0x9fd0ff, 0.7, -87);
      kit.glow(x, y - 20, 200, 0xffb681, 0.35, -87);
    } else {
      g.fillStyle(0x2a1a18, 1).fillRect(x - 4, y - 84, 8, 30); // seam closed
      [-28, 0, 28].forEach((dx) => g.fillStyle(0x2a1a18, 1).fillRect(x + dx - 5, y - 26, 10, 12));
    }
  }
  function paint(scene, kit, ctx) {
    const r = ctx.restored;
    const play = ctx.mode === "play";
    kit.sky(
      kit.mix(0x2a1222, 0x090d24, r),
      kit.mix(0x8a4424, 0x4a2c4c, r),
      "cq-sky-" + Math.round(r * 10),
    );
    kit.stars(Math.round(14 + 70 * r), 19, 0xffeadb);
    // Ringed giant planet, hidden by dust until the storm clears.
    const gg = scene.add.graphics().setDepth(-96);
    const PX = 640;
    const PY = 128;
    const PR = 72;
    kit.glow(PX, PY, 320, 0xffb681, 0.12 + 0.22 * r, -97);
    gg.fillStyle(0xd99a6c, 0.3 + 0.55 * r).fillCircle(PX, PY, PR);
    [-40, -14, 12, 38].forEach((dy, i) => {
      const w = 2 * Math.sqrt(PR * PR - dy * dy);
      gg.fillStyle(i % 2 ? 0xf0c296 : 0xa85e3e, (0.25 + 0.4 * r) * 0.8).fillEllipse(
        PX,
        PY + dy,
        w,
        10,
      );
    });
    gg.lineStyle(3, 0xffd7b0, 0.25 + 0.45 * r).strokeEllipse(PX, PY + 6, 236, 40);
    gg.fillStyle(0xe8ddd0, 0.35 + 0.5 * r).fillCircle(170, 92, 13);
    // Layered mesas and dunes.
    kit.ridge(kit.mix(0x3d1e22, 0x2c2140, r), 330, 70, 41, {
      parallax: 0.15,
      depth: -94,
      points: 7,
    });
    const haze = scene.add.graphics().setDepth(-92);
    haze.fillStyle(0xc0703a, 0.32 * (1 - r)).fillRect(0, 0, W, H);
    kit.ridge(kit.mix(0x6a3020, 0x56303a, r), 420, 60, 53, {
      parallax: 0.35,
      depth: -90,
      rim: kit.mix(0xc0643a, 0xffb681, r),
    });
    // Landmarks — lit once their chapter is restored.
    const g = scene.add.graphics().setDepth(-88);
    const done = (i) => !!ctx.state && chapterDone(def.chapters[i], ctx.state);
    relayMast(g, kit, 118, 496, done(0));
    craterBeacon(scene, g, kit, 410, 512, done(1));
    observatory(g, kit, 692, 498, done(2));
    kit.ridge(kit.mix(0x8a4428, 0x6e3a34, r), 548, 26, 67, { parallax: 0.6, depth: -86 });
    kit.motes(kit.mix(0xffb070, 0xdfe6ff, r), Math.round(16 + 30 * (1 - r)), {
      speedX: { min: 6 + 20 * (1 - r), max: 14 + 30 * (1 - r) },
      speedY: { min: -4, max: 3 },
      scale: 0.18,
    });
    if (play) {
      const veil = scene.add.graphics().setDepth(-60);
      veil.fillStyle(0x07040a, 0.55).fillRect(0, 0, W, H);
    }
  }

  function onRestore(scene, kit, info) {
    const xs = [118, 410, 692];
    kit.burst(xs[info.chapter] || W / 2, 470, 0xffb681, 30, { gravity: -40, speed: 200 });
    kit.sfx.hum();
  }

  const m = (id, type, skill, tier, name, brief, extra) => ({
    id,
    type,
    skill,
    tier,
    name,
    brief,
    ...extra,
  });
  const def = {
    id: "u9-coordinate-quest",
    title: L("Atlas Rover", "Róver Atlas"),
    accent: "#ffb681",
    music: { root: 174.61, mode: "dorian", bpm: 72 },
    skills: {
      opposites: {
        ...L("Integers and opposites", "Enteros y opuestos"),
        standard: "6.NOS.5",
        lessons: "7-1",
      },
      rational: {
        ...L("Rational numbers on the number line", "Números racionales en la recta numérica"),
        standard: "6.NOS.6",
        lessons: "7-2",
      },
      absval: {
        ...L("Absolute value as distance from 0", "Valor absoluto como distancia a 0"),
        standard: "6.NOS.8",
        lessons: "7-3",
      },
      order: {
        ...L("Compare and order rational numbers", "Comparar y ordenar números racionales"),
        standard: "6.NOS.8",
        lessons: "7-4",
      },
      plane: {
        ...L(
          "Rational numbers on the coordinate plane",
          "Números racionales en el plano de coordenadas",
        ),
        standard: "6.NOS.6",
        lessons: "7-5",
      },
      quadrants: {
        ...L("Ordered pairs in all four quadrants", "Pares ordenados en los cuatro cuadrantes"),
        standard: "6.NOS.7",
        lessons: "7-8",
      },
      distance: {
        ...L("Distance on the coordinate plane", "Distancia en el plano de coordenadas"),
        standard: "6.NOS.9",
        lessons: "7-6",
      },
      polygon: {
        ...L("Polygons on the coordinate plane", "Polígonos en el plano de coordenadas"),
        standard: "6.GR.3",
        lessons: "7-7",
      },
      reflect: {
        ...L("Reflect points across the axes", "Reflejar puntos sobre los ejes"),
        standard: "6.NOS.7",
        lessons: "7-9",
      },
    },
    misconceptions: {
      signWords: L(
        "Above/below turned into the wrong sign",
        "Arriba/abajo con el signo equivocado",
      ),
      halfDirection: L(
        "Placing the half of a negative number toward 0",
        "Poner la mitad de un número negativo hacia 0",
      ),
      misread: L("Counting the wrong distance from 0", "Contar mal la distancia desde 0"),
      sameNotOpposite: L("Opposite placed on the same spot", "Opuesto puesto en el mismo lugar"),
      notOpposite: L("Opposite not the same distance from 0", "Opuesto a otra distancia de 0"),
      swapSites: L("Switching the two distances", "Intercambiar las dos distancias"),
      negativeDistance: L(
        "A negative distance or absolute value",
        "Una distancia o valor absoluto negativo",
      ),
      notDistance: L(
        "Absolute value not equal to the distance from 0",
        "Valor absoluto distinto de la distancia a 0",
      ),
      reversed: L("Ordering from greatest to least", "Ordenar de mayor a menor"),
      absOrder: L(
        "Ordering negatives by distance from 0",
        "Ordenar negativos por su distancia a 0",
      ),
      negBigger: L("Thinking −7 is greater than −3", "Pensar que −7 es mayor que −3"),
      outOfOrder: L("Two numbers compared the wrong way", "Dos números comparados al revés"),
      swapXY: L("Switching x and y", "Intercambiar x e y"),
      signX: L("Wrong sign for x (left/right)", "Signo de x equivocado (izquierda/derecha)"),
      signY: L("Wrong sign for y (up/down)", "Signo de y equivocado (arriba/abajo)"),
      bothSigns: L("Both signs flipped", "Los dos signos al revés"),
      notMoved: L("Reflection left on the original point", "Reflexión dejada en el punto original"),
      wrongAxis: L("Reflecting across the wrong axis", "Reflejar sobre el eje equivocado"),
      offByOne: L("Off by one grid step", "Un paso de diferencia"),
      misplot: L("Ordered pair read incorrectly", "Par ordenado mal leído"),
      notRectangle: L(
        "Missing vertex does not make a rectangle",
        "El vértice no forma un rectángulo",
      ),
      absDiff: L(
        "Subtracting absolute values across an axis",
        "Restar valores absolutos al cruzar un eje",
      ),
      addAbs: L(
        "Adding absolute values on the same side",
        "Sumar valores absolutos del mismo lado",
      ),
      countPoints: L("Counting grid lines instead of units", "Contar líneas en vez de unidades"),
      oneCoordinate: L(
        "Using one coordinate as the distance",
        "Usar una coordenada como distancia",
      ),
      distance: L("Distance between points miscounted", "Distancia entre puntos mal contada"),
    },
    chapters: [
      {
        id: "dustfall",
        name: L("Dustfall Relay", "Antena Dustfall"),
        landmark: L("the Dustfall relay mast", "la antena de Dustfall"),
        missions: [
          m(
            "d1",
            "probe",
            "opposites",
            1,
            L("Flags at the Datum", "Banderas en el nivel 0"),
            L("Mark an elevation and its opposite.", "Marca una elevación y su opuesto."),
            { variant: "opp" },
          ),
          m(
            "d2",
            "probe",
            "rational",
            2,
            L("Half-Meter Flags", "Banderas de medio metro"),
            L(
              "Elevations with halves, and their opposites.",
              "Elevaciones con medios y sus opuestos.",
            ),
            { variant: "opp" },
          ),
          m(
            "d3",
            "descent",
            "order",
            1,
            L("Canyon Climb", "Subida del cañón"),
            L(
              "Order the stakes from lowest to highest.",
              "Ordena las estacas de la más baja a la más alta.",
            ),
          ),
          m(
            "d4",
            "descent",
            "order",
            2,
            L("Relay Mastery", "Dominio de la antena"),
            L(
              "Order decimals and fractions on your own.",
              "Ordena decimales y fracciones por tu cuenta.",
            ),
            { mastery: true },
          ),
        ],
      },
      {
        id: "crater",
        name: L("Crater Beacon", "Faro del Cráter"),
        landmark: L("the crater beacon", "el faro del cráter"),
        missions: [
          m(
            "c1",
            "probe",
            "absval",
            2,
            L("Winch Cables", "Cables del torno"),
            L("Cable length is the absolute value.", "El largo del cable es el valor absoluto."),
            { variant: "abs" },
          ),
          m(
            "c2",
            "nav",
            "quadrants",
            1,
            L("Beacon Drop", "Lanzar balizas"),
            L("Plot beacons in all four quadrants.", "Grafica balizas en los cuatro cuadrantes."),
            { variant: "plot" },
          ),
          m(
            "c3",
            "nav",
            "plane",
            2,
            L("Read the Craters", "Leer los cráteres"),
            L("Type each beacon's ordered pair.", "Escribe el par ordenado de cada baliza."),
            { variant: "read" },
          ),
          m(
            "c4",
            "nav",
            "plane",
            3,
            L("Beacon Mastery", "Dominio de las balizas"),
            L("Plot points with halves, on your own.", "Grafica puntos con medios, por tu cuenta."),
            { variant: "plot", mastery: true },
          ),
        ],
      },
      {
        id: "observatory",
        name: L("The Lost Observatory", "El Observatorio Perdido"),
        landmark: L("the observatory dome", "la cúpula del observatorio"),
        missions: [
          m(
            "o1",
            "survey",
            "distance",
            2,
            L("Battery Legs", "Tramos de batería"),
            L("Charge = distance between two points.", "Carga = distancia entre dos puntos."),
            { variant: "legs" },
          ),
          m(
            "o2",
            "survey",
            "polygon",
            2,
            L("Relay Ring", "Anillo de torres"),
            L(
              "Finish a rectangle and measure its sides.",
              "Completa un rectángulo y mide sus lados.",
            ),
            { variant: "relay" },
          ),
          m(
            "o3",
            "nav",
            "reflect",
            2,
            L("Mirror Path", "Camino espejo"),
            L("Reflect a path across an axis.", "Refleja un camino sobre un eje."),
            { variant: "mirror" },
          ),
          m(
            "o4",
            "nav",
            "reflect",
            3,
            L("Observatory Mastery", "Dominio del observatorio"),
            L(
              "Reflect a 3-point path on your own.",
              "Refleja un camino de 3 puntos por tu cuenta.",
            ),
            { variant: "mirror", mastery: true },
          ),
        ],
      },
    ],
    paint,
    onRestore,
    builders: { probe: B.probe, descent: B.descent, nav: B.nav, survey: B.survey },
  };

  X.register(game, def);
})();
