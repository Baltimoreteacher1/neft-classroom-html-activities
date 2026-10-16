/* Switchyard Odyssey — the Expression Express expedition (Reveal Math Unit 6:
 * lessons 6-3, 6-4, 6-5, 6-6, 6-8, 6-14, 6-15). A dark desert railway comes back to life as
 * the student's expressions run its switch tower, cargo cars and couplers.
 * Builders: expedition-missions.js (tower, cargo) and expedition-trains.js (couple, merge);
 * pure math: expedition-math.js. Shared engine: /math/games/shared/expedition-engine.js.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.EE_MISSIONS;
  if (!X || !M || !M.couple || !window.eeGame) return;
  const { W, H } = X;
  const { L, drawRails } = M;
  const { chapterDone } = X._internals;

  function mesas(scene, kit, color, base, seed, depth) {
    const r = kit.rng(seed);
    const g = scene.add.graphics().setDepth(depth);
    g.fillStyle(color, 1);
    const pts = [{ x: -20, y: H }];
    let x = -20;
    while (x < W + 40) {
      const w = r.int(70, 150);
      const h = r.int(30, 110);
      const slope = r.int(10, 24);
      pts.push(
        { x, y: base },
        { x: x + slope, y: base - h },
        { x: x + w - slope, y: base - h },
        { x: x + w, y: base },
      );
      x += w + r.int(10, 60);
    }
    pts.push({ x: W + 40, y: base }, { x: W + 40, y: H });
    g.fillPoints(pts, true);
    return g;
  }

  function switchTower(g, cx, lit) {
    g.fillStyle(0x3b2a2a, 1).fillRect(cx - 26, 420, 52, 80);
    g.fillStyle(0x6b3f2e, 1).fillRect(cx - 34, 386, 68, 38);
    g.fillStyle(0x2a1d22, 1).fillTriangle(cx - 42, 388, cx + 42, 388, cx, 362);
    for (let i = 0; i < 3; i++)
      g.fillStyle(lit ? 0xffd27a : 0x2c2430, 1).fillRect(cx - 26 + i * 19, 396, 14, 16);
    // Signal mast: green and gold lights once the junction is restored.
    g.lineStyle(4, 0x6b7380, 1).lineBetween(cx + 58, 500, cx + 58, 392);
    g.fillStyle(0x1d1624, 1).fillRoundedRect(cx + 48, 384, 20, 40, 6);
    g.fillStyle(lit ? 0x7ee3a0 : 0x5a2a2a, 1).fillCircle(cx + 58, 395, 5);
    g.fillStyle(lit ? 0xffd76a : 0x3a2a2a, 1).fillCircle(cx + 58, 412, 5);
  }
  function trestle(g, cx, done) {
    // The canyon under the crossing.
    g.fillStyle(0x0d0812, 1).fillPoints(
      [
        { x: cx - 90, y: 506 },
        { x: cx + 90, y: 506 },
        { x: cx + 60, y: 600 },
        { x: cx - 60, y: 600 },
      ],
      true,
    );
    const legs = [-80, -40, 0, 40, 80];
    legs.forEach((dx, i) => {
      if (!done && (i === 2 || i === 3)) return;
      g.lineStyle(4, done ? 0x9a6a48 : 0x5a4436, 1).lineBetween(cx + dx, 504, cx + dx * 0.8, 600);
      if (i < legs.length - 1 && (done || i < 1 || i > 3)) {
        g.lineStyle(2, done ? 0x8a5a3a : 0x4a3a30, 1);
        g.lineBetween(cx + dx, 510, cx + legs[i + 1] * 0.8, 590);
        g.lineBetween(cx + legs[i + 1], 510, cx + dx * 0.8, 590);
      }
    });
    if (done)
      for (let k = 0; k < 5; k++) g.fillStyle(0xffd27a, 1).fillCircle(cx - 80 + k * 40, 498, 3);
  }
  function terminal(g, cx, lit) {
    g.fillStyle(0x2c2234, 1).fillRect(cx - 80, 430, 160, 72);
    g.fillStyle(lit ? 0x3c4f7a : 0x241c2c, 1).fillEllipse(cx, 432, 170, 90);
    g.fillStyle(0x2c2234, 1).fillRect(cx - 86, 432, 172, 6);
    if (lit) {
      g.fillStyle(0xfff2c4, 1);
      [
        [-40, 412],
        [-12, 398],
        [18, 404],
        [44, 418],
        [2, 420],
      ].forEach(([dx, y]) => g.fillCircle(cx + dx, y, 2.5));
    } else g.lineStyle(2, 0x0d0812, 1).lineBetween(cx - 20, 400, cx + 6, 428);
    for (let i = 0; i < 5; i++)
      g.fillStyle(lit ? 0xffd27a : 0x1d1624, 1).fillRect(cx - 66 + i * 28, 452, 16, 26);
  }

  function paint(scene, kit, ctx) {
    const r = ctx.restored;
    const play = ctx.mode === "play";
    kit.sky(0x0b0820, kit.mix(0x2a1838, 0xd9826a, r * 0.8), "ee-sky-" + Math.round(r * 10));
    kit.glow(600, 330, 520, 0xffb795, 0.18 + 0.32 * r, -98);
    kit.stars(48, 13, 0xffe9d6);
    const far = mesas(scene, kit, kit.mix(0x241a34, 0x5a3148, r), 360, 5, -94);
    far.parallax = 0.12;
    kit._parallax.push(far);
    kit.ridge(kit.mix(0x2e2030, 0x7a3e34, r), 430, 46, 19, {
      parallax: 0.3,
      depth: -90,
      rim: kit.mix(0x8a5a4a, 0xffb795, r),
    });
    kit.ridge(kit.mix(0x24181f, 0x4a2a24, r), 520, 26, 31, { parallax: 0.55, depth: -88 });
    const g = scene.add.graphics().setDepth(-86);
    const done = (i) => !!(ctx.state && chapterDone(def.chapters[i], ctx.state));
    const cols = [W / 6, W / 2, (5 * W) / 6];
    trestle(g, cols[1], done(1));
    // The main line: whole once the trestle stands, broken over the canyon before.
    const rails = scene.add.graphics().setDepth(-85);
    if (done(1)) drawRails(rails, -10, W + 10, 504);
    else {
      drawRails(rails, -10, cols[1] - 40, 504);
      drawRails(rails, cols[1] + 40, W + 10, 504);
    }
    // Telegraph poles: their lamps light up as the line is restored.
    const poles = scene.add.graphics().setDepth(-85);
    const lamps = Math.round(r * 8);
    for (let i = 0; i < 8; i++) {
      const px = 40 + i * 104;
      if (Math.abs(px - cols[1]) < 70) continue;
      poles.lineStyle(3, 0x3a2a30, 1).lineBetween(px, 500, px, 452);
      poles.lineBetween(px - 10, 458, px + 10, 458);
      if (i < lamps) {
        poles.fillStyle(0xffd27a, 1).fillCircle(px, 450, 3);
        kit.glow(px, 450, 36, 0xffd27a, 0.5, -84);
      }
    }
    switchTower(g, cols[0], done(0));
    terminal(g, cols[2], done(2));
    if (done(0)) kit.glow(cols[0] + 58, 400, 70, 0x7ee3a0, 0.5, -84);
    if (done(2)) kit.glow(cols[2], 420, 220, 0x8fb3ff, 0.45, -84);
    // A night train appears on the line once the world is half restored.
    if (r >= 0.5) {
      const loco = M.makeLoco(scene, 560, 500, 0xffb795, -83);
      loco.setScale(0.9);
      for (let i = 1; i <= 3; i++) {
        const car = scene.add.graphics().setDepth(-83);
        M.drawCar(car, 560 - 30 - i * 60, 480, 54, 16, 0x5a3a48);
        car.fillStyle(0xffd27a, 0.9).fillRect(560 - 30 - i * 60 - 18, 484, 36, 5);
      }
    }
    kit.motes(r > 0.3 ? 0xffd2a8 : 0xb9a0c8, 22);
    if (play) {
      const veil = scene.add.graphics().setDepth(-60);
      veil.fillStyle(0x07040c, 0.5).fillRect(0, 0, W, H);
    }
  }

  function onRestore(scene, kit) {
    kit.burst(W / 2, 500, 0xffb795, 30, { gravity: -40, speed: 180 });
    kit.sfx.hum();
  }

  const def = {
    id: "u6-expression-express",
    title: L("Switchyard Odyssey", "Odisea del Patio de Maniobras"),
    accent: "#ffb795",
    music: { root: 196, mode: "major", bpm: 84 },
    skills: {
      orderOps: {
        ...L("Order of operations with exponents", "Orden de operaciones con exponentes"),
        standard: "6.AT.5 / 6.AT.6c",
        lessons: "6-3, 6-4",
      },
      evaluate: {
        ...L("Evaluate algebraic expressions", "Evaluar expresiones algebraicas"),
        standard: "6.AT.6a",
        lessons: "6-5",
      },
      write: {
        ...L("Write expressions from words", "Escribir expresiones a partir de palabras"),
        standard: "6.AT.6a",
        lessons: "6-5",
      },
      equivalent: {
        ...L(
          "Equivalent expressions and the distributive property",
          "Expresiones equivalentes y la propiedad distributiva",
        ),
        standard: "6.AT.7",
        lessons: "6-6, 6-8, 6-14",
      },
      simplify: {
        ...L("Combine like terms", "Combinar términos semejantes"),
        standard: "6.AT.7",
        lessons: "6-15, 6-8",
      },
    },
    misconceptions: {
      leftToRight: L(
        "Working left to right, ignoring the order of operations",
        "Trabajar de izquierda a derecha sin el orden de operaciones",
      ),
      powerTimes: L(
        "Reading an exponent as multiplying (3² = 6)",
        "Leer un exponente como multiplicación (3² = 6)",
      ),
      arith: L("A calculation slip in one step", "Un error de cálculo en un paso"),
      digits: L("Reading 3x as digits (x = 4 gives 34)", "Leer 3x como dígitos (con x = 4 da 34)"),
      firstOnly: L(
        "Multiplying (or dividing) only the first term",
        "Multiplicar (o dividir) solo el primer término",
      ),
      sign: L("Adding where the situation takes away", "Sumar cuando la situación resta"),
      addInstead: L(
        "Adding numbers that should be multiplied",
        "Sumar números que se deben multiplicar",
      ),
      subtractInstead: L(
        "Subtracting instead of dividing when factoring",
        "Restar en vez de dividir al factorizar",
      ),
      swapped: L(
        "Switching the coefficient and the constant",
        "Intercambiar el coeficiente y la constante",
      ),
      doubleCount: L(
        "Multiplying the inside of the parentheses twice",
        "Multiplicar dos veces lo de adentro del paréntesis",
      ),
      trivialFactor: L("Factoring out 1", "Sacar 1 como factor"),
      notEquivalent: L(
        "Expressions that do not match for every x",
        "Expresiones que no coinciden para cada x",
      ),
      unlike: L(
        "Combining unlike terms (3x + 2 = 5x)",
        "Combinar términos no semejantes (3x + 2 = 5x)",
      ),
      unlikePower: L("Combining x and x²", "Combinar x con x²"),
      loneX: L("Counting a lone x as 0 instead of 1x", "Contar una x sola como 0 en vez de 1x"),
      count: L("Miscounting like terms", "Contar mal los términos semejantes"),
    },
    chapters: [
      {
        id: "junction",
        name: L("Copper Junction", "Cruce de Cobre"),
        landmark: L("the copper switch tower", "la torre de cambios de cobre"),
        missions: [
          {
            id: "c1",
            type: "tower",
            skill: "orderOps",
            tier: 1,
            name: L("First Signal", "Primera señal"),
            brief: L(
              "Fire the switches in order so the train reaches the right siding.",
              "Activa los cambios en orden para que el tren llegue a la vía correcta.",
            ),
          },
          {
            id: "c2",
            type: "cargo",
            skill: "evaluate",
            tier: 1,
            name: L("Morning Freight", "Carga de la mañana"),
            brief: L(
              "Load each car with its cargo for today's x.",
              "Carga cada vagón con su carga para la x de hoy.",
            ),
          },
          {
            id: "c3",
            type: "tower",
            skill: "orderOps",
            tier: 2,
            name: L("Power Switches", "Cambios de potencia"),
            brief: L(
              "Exponents join the signal code. Fire them in the right order.",
              "Los exponentes entran al código. Actívalos en el orden correcto.",
            ),
          },
          {
            id: "c4",
            type: "tower",
            skill: "orderOps",
            tier: 3,
            mastery: true,
            name: L("Junction Mastery", "Dominio del cruce"),
            brief: L(
              "Parentheses, exponents and more. On your own.",
              "Paréntesis, exponentes y más. Por tu cuenta.",
            ),
          },
        ],
      },
      {
        id: "canyon",
        name: L("Canyon Crossing", "Paso del Cañón"),
        landmark: L("the canyon trestle", "el puente de caballetes del cañón"),
        missions: [
          {
            id: "k1",
            type: "couple",
            variant: "words",
            skill: "write",
            tier: 1,
            name: L("Route Cards", "Tarjetas de ruta"),
            brief: L(
              "Turn a route card into an expression.",
              "Convierte una tarjeta de ruta en una expresión.",
            ),
          },
          {
            id: "k2",
            type: "cargo",
            skill: "evaluate",
            tier: 2,
            name: L("Heavy Loads", "Cargas pesadas"),
            brief: L(
              "Exponents and parentheses in the cargo labels.",
              "Exponentes y paréntesis en las etiquetas de carga.",
            ),
          },
          {
            id: "k3",
            type: "couple",
            variant: "words",
            skill: "write",
            tier: 2,
            name: L("Many Trains", "Muchos trenes"),
            brief: L(
              "Equal trains: write one expression for all of them.",
              "Trenes iguales: escribe una expresión para todos.",
            ),
          },
          {
            id: "k4",
            type: "cargo",
            skill: "evaluate",
            tier: 3,
            mastery: true,
            name: L("Crossing Mastery", "Dominio del paso"),
            brief: L("Load every car on your own.", "Carga cada vagón por tu cuenta."),
          },
        ],
      },
      {
        id: "terminal",
        name: L("Starlight Terminal", "Terminal Luz de Estrellas"),
        landmark: L("the starlight terminal", "la terminal de las estrellas"),
        missions: [
          {
            id: "s1",
            type: "couple",
            variant: "expand",
            skill: "equivalent",
            tier: 1,
            name: L("Equal Trains", "Trenes iguales"),
            brief: L(
              "Rewrite a train with no parentheses. It must carry the same cargo for every x.",
              "Reescribe un tren sin paréntesis. Debe llevar la misma carga para cada x.",
            ),
          },
          {
            id: "s2",
            type: "merge",
            skill: "simplify",
            tier: 2,
            name: L("Shorten the Train", "Acortar el tren"),
            brief: L(
              "Combine like terms into a short train.",
              "Combina términos semejantes en un tren corto.",
            ),
          },
          {
            id: "s3",
            type: "couple",
            variant: "factor",
            skill: "equivalent",
            tier: 2,
            name: L("Pack the Train", "Empacar el tren"),
            brief: L(
              "Factor: put a common number outside the parentheses.",
              "Factoriza: pon un número común fuera de los paréntesis.",
            ),
          },
          {
            id: "s4",
            type: "merge",
            skill: "simplify",
            tier: 3,
            mastery: true,
            name: L("Terminal Mastery", "Dominio de la terminal"),
            brief: L(
              "Distribute, then combine like terms. On your own.",
              "Distribuye y luego combina términos semejantes. Por tu cuenta.",
            ),
          },
        ],
      },
    ],
    paint,
    onRestore,
    builders: { tower: M.tower, cargo: M.cargo, couple: M.couple, merge: M.merge },
  };

  X.register(window.eeGame, def);
})();
