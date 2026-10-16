/* Wildlife Signal — the Data Dash expedition (Reveal Math Unit 2, lessons 2-1 to 2-10).
 * A wildlife research network comes back online as the student's statistics drive it:
 * survey tablets, the station's histogram display, Foxwood's habitat ruler, and the
 * Migration Observatory's balance beam and signal console. Math: expedition-data.js;
 * builders: expedition-missions.js, expedition-plots.js, expedition-report.js; the shared
 * engine is /math/games/shared/expedition-engine.js.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const D = window.DD_MISSIONS;
  if (!X || !D || !D.report || !window.ddGame) return;
  const { W, H } = X;
  const { L } = D;
  const { chapterDone } = X._internals;

  function pine(g, x, base, h, color) {
    g.fillStyle(color, 1);
    for (let k = 0; k < 3; k++) {
      const w = h * (0.42 - k * 0.1);
      const top = base - h * (0.45 + k * 0.27);
      g.fillTriangle(x, top - h * 0.28, x - w, top + h * 0.22, x + w, top + h * 0.22);
    }
    g.fillRect(x - h * 0.04, base - h * 0.12, h * 0.08, h * 0.12);
  }
  function heron(g, x, y, s, color) {
    g.lineStyle(3 * s, color, 1);
    g.lineBetween(x - 4 * s, y, x - 6 * s, y + 30 * s);
    g.lineBetween(x + 4 * s, y, x + 6 * s, y + 30 * s);
    g.fillStyle(color, 1).fillEllipse(x, y - 6 * s, 30 * s, 16 * s);
    const neck = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(x + 10 * s, y - 10 * s),
      new Phaser.Math.Vector2(x + 22 * s, y - 24 * s),
      new Phaser.Math.Vector2(x + 14 * s, y - 38 * s),
    );
    g.lineStyle(4 * s, color, 1);
    neck.draw(g, 10);
    g.fillCircle(x + 14 * s, y - 40 * s, 4.5 * s);
    g.lineStyle(2 * s, 0xffc46b, 1).lineBetween(x + 17 * s, y - 40 * s, x + 30 * s, y - 37 * s);
  }
  function goose(g, x, y, s, color) {
    g.lineStyle(2.5 * s, color, 1);
    g.lineBetween(x - 9 * s, y - 4 * s, x, y);
    g.lineBetween(x, y, x + 9 * s, y - 4 * s);
  }

  function paint(scene, kit, ctx) {
    const r = ctx.restored;
    const play = ctx.mode === "play";
    const done = (i) => !!ctx.state && chapterDone(def.chapters[i], ctx.state);
    kit.sky(0x050d1c, kit.mix(0x2c2840, 0x1d5650, r), "dd-sky-" + Math.round(r * 10));
    // Signal aurora: the network's data streams light the sky as stations come online.
    const aur = scene.add.graphics().setDepth(-97);
    for (let k = 0; k < 4; k++) {
      aur.lineStyle(26 - k * 4, k % 2 ? 0x7fd6c8 : kit.accent, 0.04 + 0.14 * r);
      const pts = [];
      for (let i = 0; i <= 16; i++) pts.push(new Phaser.Math.Vector2((i / 16) * W, 120 + k * 26 + Math.sin(i * 0.8 + k) * 22));
      new Phaser.Curves.Spline(pts).draw(aur, 64);
    }
    kit.glow(700, 236, 240, 0xdff6ff, play ? 0.14 : 0.3, -98);
    scene.add.image(700, 236, "ewl-dot").setDisplaySize(30, 30).setTint(0xf2f7ff).setAlpha(0.9).setDepth(-96);
    kit.stars(46, 9);
    kit.ridge(kit.mix(0x1c2333, 0x1f3a44, r), 300, 60, 41, { parallax: 0.12, depth: -94 });
    // Pine forest band.
    const forest = scene.add.graphics().setDepth(-92);
    const pineC = kit.mix(0x1a2328, 0x17402f, r);
    for (let i = 0; i < 26; i++) pine(forest, -10 + i * 33 + ((i * 17) % 13), 420 + ((i * 7) % 11), 70 + ((i * 29) % 40), pineC);
    kit.ridge(kit.mix(0x2a3326, 0x29513a, r), 440, 30, 57, { parallax: 0.3, depth: -91, rim: kit.mix(0x56604a, 0x8fd99c, r) });
    // Marsh water: grey and still, then bright with reflections.
    const water = scene.add.graphics().setDepth(-89);
    water.fillStyle(kit.mix(0x2a3440, 0x2f8a9a, r), 0.55 + 0.3 * r).fillRect(0, 462, W, 40);
    for (let i = 0; i < 18; i++) water.fillStyle(0xdff6ff, 0.05 + 0.18 * r).fillRect(20 + i * 46, 470 + (i % 3) * 9, 22, 2);
    kit.ridge(kit.mix(0x232b22, 0x2f5a35, r), 560, 26, 73, { parallax: 0.55, depth: -88 });

    const g = scene.add.graphics().setDepth(-86);
    const cols = [W / 6, W / 2, (5 * W) / 6];
    // Heron Marsh: reeds + nesting platform.
    {
      const cx = cols[0];
      const lush = done(0);
      for (let k = 0; k < 14; k++) {
        const x = cx - 80 + k * 12;
        g.lineStyle(3, lush ? 0x7fd88a : 0x5d6650, 1).lineBetween(x, 500, x + (k % 3) - 1, 456 - (k % 4) * 8);
        if (k % 3 === 0) g.fillStyle(lush ? 0x9a6a3a : 0x4c4438, 1).fillEllipse(x + 1, 452 - (k % 4) * 8, 5, 14);
      }
      g.fillStyle(lush ? 0x7a5634 : 0x4a4036, 1).fillRect(cx + 10, 420, 4, 70).fillRect(cx + 56, 420, 4, 70);
      g.fillStyle(lush ? 0x8a6a44 : 0x4f463c, 1).fillRect(cx, 414, 70, 8);
      if (lush) {
        heron(g, cx + 34, 398, 0.9, 0xf2f6f8);
        heron(g, cx - 60, 446, 0.8, 0xdfe7ec);
        kit.glow(cx + 34, 380, 160, kit.accent, 0.3, -87);
      } else heron(g, cx - 40, 452, 0.7, 0x55606a);
    }
    // Foxwood Station: cabin + antenna mast.
    {
      const cx = cols[1];
      const lush = done(1);
      g.fillStyle(lush ? 0x5a3e2a : 0x3a332e, 1).fillRect(cx - 50, 430, 100, 56);
      g.fillStyle(lush ? 0x7a4f32 : 0x463c34, 1).fillTriangle(cx - 60, 432, cx, 398, cx + 60, 432);
      [-28, 12].forEach((dx) => g.fillStyle(lush ? 0xffd27a : 0x1c2228, 1).fillRect(cx + dx, 446, 18, 16));
      g.lineStyle(3, lush ? 0xcfe3ee : 0x5a636a, 1).lineBetween(cx + 70, 486, cx + 70, 360);
      g.lineBetween(cx + 60, 486, cx + 70, 380).lineBetween(cx + 80, 486, cx + 70, 380);
      g.fillStyle(lush ? kit.accent : 0x5a636a, 1).fillCircle(cx + 70, 358, 5);
      if (lush) {
        for (let k = 1; k <= 3; k++) {
          g.lineStyle(3, kit.accent, 0.9 - k * 0.22).beginPath();
          g.arc(cx + 70, 358, 12 * k, -2.5, -0.64).strokePath();
        }
        kit.glow(cx, 452, 200, 0xffd27a, 0.35, -87);
      }
    }
    // The Migration Observatory: tower + dome, geese overhead once restored.
    {
      const cx = cols[2];
      const lush = done(2);
      g.fillStyle(lush ? 0x4c5a66 : 0x343a40, 1).fillRect(cx - 22, 396, 44, 92);
      g.fillStyle(lush ? 0xdde6ec : 0x4a5056, 1).fillCircle(cx, 396, 34);
      g.fillStyle(lush ? 0x22323e : 0x2a2e33, 1).fillRect(cx - 4, 364, 8, 30);
      if (lush) {
        g.fillStyle(0xffe6a0, 1).fillRect(cx - 3, 366, 6, 26);
        kit.glow(cx, 380, 220, 0xffe6a0, 0.35, -87);
        for (let k = 0; k < 7; k++) goose(g, cx - 120 + Math.abs(k - 3) * 18 + k * 2, 300 + Math.abs(k - 3) * 12, 1, 0xeaf6ff);
      }
    }
    // Relay towers: one more lights up for every ~15% restored.
    const towers = scene.add.graphics().setDepth(-90);
    const lit = Math.round(r * 6);
    for (let i = 0; i < 6; i++) {
      const x = 70 + i * 136;
      const y = 300 + ((i * 37) % 30);
      towers.lineStyle(2, 0x3c4a54, 1).lineBetween(x, y + 40, x, y);
      if (i < lit) {
        const beacon = scene.add.image(x, y, "ewl-dot").setDisplaySize(10, 10).setTint(kit.accent).setDepth(-89);
        kit.glow(x, y, 46, kit.accent, 0.5, -90);
        kit.tween({ targets: beacon, alpha: 0.3, duration: 900 + i * 120, yoyo: true, repeat: -1 });
      }
    }
    kit.motes(r > 0.3 ? 0xd8ff9a : 0xbfd4e0, 22, { top: 260, bottom: 560 });
    if (play) {
      const veil = scene.add.graphics().setDepth(-60);
      veil.fillStyle(0x02070c, 0.5).fillRect(0, 0, W, H);
    }
  }

  function onRestore(scene, kit) {
    kit.burst(W / 2, 470, kit.accent, 30, { gravity: -60, speed: 200 });
    kit.sfx.hum();
  }

  const skill = (en, es, standard, lessons) => ({ en, es, standard, lessons });
  const mission = (id, type, skillId, tier, name, brief, extra) => ({ id, type, skill: skillId, tier, name, brief, ...extra });
  const def = {
    id: "u8-data-dash",
    title: L("Wildlife Signal", "Señal Silvestre"),
    accent: "#a4dfb0",
    music: { root: 220, mode: "dorian", bpm: 72 },
    skills: {
      statQ: skill("Statistical questions", "Preguntas estadísticas", "6.DS.1", "2-1"),
      histogram: skill("Histograms", "Histogramas", "6.DS.5", "2-2"),
      median: skill("Median", "Mediana", "6.DS.4", "2-3"),
      boxplot: skill("Box plots", "Diagramas de caja", "6.DS.5", "2-4"),
      spread: skill("Range and IQR", "Rango y RIC", "6.DS.3", "2-5"),
      mean: skill("Mean as a balance point", "La media como punto de equilibrio", "6.DS.4", "2-8"),
      mad: skill("Mean absolute deviation (MAD)", "Desviación media absoluta (DMA)", "6.DS.6c", "2-9"),
      choose: skill("Choose the right measures", "Elegir las medidas adecuadas", "6.DS.6d", "2-10"),
    },
    misconceptions: {
      singleAnswer: L("Sending a question with only one answer", "Enviar una pregunta de una sola respuesta"),
      missedVariability: L("Skipping a question whose answers vary", "Descartar una pregunta con respuestas que varían"),
      missedData: L("Bars that miss or double-count tags", "Barras que omiten o repiten etiquetas"),
      edgeBin: L("Putting an edge value in the interval below", "Poner un valor del borde en el intervalo de abajo"),
      binCount: L("Miscounting tags in an interval", "Contar mal las etiquetas de un intervalo"),
      unsortedMedian: L("Median of data that was not put in order", "Mediana de datos sin ordenar"),
      oneMiddle: L("Even count: using one middle value as the median", "Cantidad par: usar un solo valor central"),
      medianCount: L("A median that does not split the data in half", "Una mediana que no divide los datos por la mitad"),
      whiskerEnds: L("Whiskers that miss the least or greatest value", "Bigotes que no llegan al menor o al mayor"),
      quartileInclusive: L("Keeping the median inside the halves (odd count)", "Dejar la mediana dentro de las mitades (cantidad impar)"),
      quartileOff: L("Finding Q1 or Q3 incorrectly", "Hallar mal Q1 o Q3"),
      rangeIqrSwap: L("Mixing up range and IQR", "Confundir el rango con el RIC"),
      spreadAsValue: L("Giving a position instead of a distance for spread", "Dar una posición en vez de una distancia"),
      rangeCalc: L("Range not equal to greatest − least", "Rango distinto de mayor − menor"),
      iqrCalc: L("IQR not equal to Q3 − Q1", "RIC distinto de Q3 − Q1"),
      meanIsMedian: L("Thinking the mean is the middle value", "Creer que la media es el valor central"),
      midrange: L("Mean as halfway between the ends", "La media como el punto medio de los extremos"),
      meanIsMode: L("Mean as the most common value", "La media como el valor más común"),
      notBalanced: L("Mean not at the balance point", "Media fuera del punto de equilibrio"),
      signedDeviations: L("Signed (negative) distances in MAD", "Distancias con signo (negativas) en la DMA"),
      distanceOff: L("A distance from the mean measured wrong", "Una distancia a la media mal medida"),
      noDivide: L("MAD: adding the distances but not dividing", "DMA: sumar las distancias sin dividir"),
      madCalc: L("MAD not the mean of the distances", "DMA distinta de la media de las distancias"),
      meanOff: L("Mean calculated incorrectly", "Media mal calculada"),
      biggerMadConsistent: L("Thinking a bigger MAD means more consistent", "Creer que una DMA mayor es más constante"),
      meanWithOutlier: L("Choosing the mean when an outlier skews it", "Elegir la media cuando un valor atípico la sesga"),
      medianSymmetric: L("Skipping the mean for symmetric data", "No usar la media con datos simétricos"),
      spreadMismatch: L("Pairing mean with IQR or median with MAD", "Combinar media con RIC o mediana con DMA"),
      meanCalc: L("Placing the mean incorrectly", "Ubicar mal la media"),
    },
    chapters: [
      {
        id: "marsh",
        name: L("Heron Marsh", "Pantano de las Garzas"),
        landmark: L("the heron nesting grounds", "los nidos de las garzas"),
        missions: [
          mission("m1", "survey", "statQ", 1, L("Field Questions", "Preguntas de campo"), L("Send only the questions that collect varied data.", "Envía solo las preguntas que recogen datos variados.")),
          mission("m2", "histogram", "histogram", 1, L("Station Display", "Pantalla de la estación"), L("Turn the tag log into a histogram for the rangers.", "Convierte el registro en un histograma para los guardabosques.")),
          mission("m3", "survey", "statQ", 2, L("Sharper Questions", "Preguntas más precisas"), L("Some questions come in pairs. Which ones vary?", "Algunas preguntas vienen en pares. ¿Cuáles varían?")),
          mission("m4", "histogram", "histogram", 2, L("Marsh Mastery", "Dominio del pantano"), L("Narrower intervals and edge values. On your own.", "Intervalos más estrechos y valores en los bordes. Por tu cuenta."), { mastery: true }),
        ],
      },
      {
        id: "foxwood",
        name: L("Foxwood Station", "Estación Foxwood"),
        landmark: L("the Foxwood signal station", "la estación de señales de Foxwood"),
        missions: [
          mission("f1", "boxplot", "median", 1, L("Feeder Line", "Línea de comederos"), L("Find the median of the fox data.", "Halla la mediana de los datos de zorros."), { variant: "median" }),
          mission("f2", "boxplot", "boxplot", 2, L("Station Box Plot", "Diagrama de la estación"), L("Place min, Q1, median, Q3 and max.", "Coloca mín, Q1, mediana, Q3 y máx."), { variant: "box" }),
          mission("f3", "boxplot", "spread", 2, L("Habitat Fences", "Cercas del hábitat"), L("Range sets the fence. IQR sets the core zone.", "El rango fija la cerca. El RIC fija la zona central."), { variant: "spread" }),
          mission("f4", "boxplot", "boxplot", 3, L("Foxwood Mastery", "Dominio de Foxwood"), L("A full box plot with no hints.", "Un diagrama de caja completo sin pistas."), { variant: "box", mastery: true }),
        ],
      },
      {
        id: "observatory",
        name: L("The Migration Observatory", "El Observatorio de Migración"),
        landmark: L("the migration observatory", "el observatorio de migración"),
        missions: [
          mission("o1", "balance", "mean", 1, L("Balance Beam", "Viga de equilibrio"), L("Balance the flight data at its mean.", "Equilibra los datos de vuelo en su media.")),
          mission("o2", "report", "mad", 2, L("Signal Ropes", "Cuerdas de señal"), L("Measure each distance from the mean, then the MAD.", "Mide cada distancia a la media y luego la DMA."), { variant: "mad" }),
          mission("o3", "report", "choose", 2, L("Outlier Alert", "Alerta de valor atípico"), L("Pick the center and spread that fit the data.", "Elige el centro y la dispersión que van con los datos."), { variant: "choose" }),
          mission("o4", "report", "mad", 3, L("Observatory Mastery", "Dominio del observatorio"), L("Mean, MAD, and the more consistent flock. On your own.", "Media, DMA y la bandada más constante. Por tu cuenta."), { variant: "compare", mastery: true }),
        ],
      },
    ],
    paint,
    onRestore,
    builders: { survey: D.survey, histogram: D.histogram, balance: D.balance, boxplot: D.boxplot, report: D.report },
  };

  X.register(window.ddGame, def);
})();
