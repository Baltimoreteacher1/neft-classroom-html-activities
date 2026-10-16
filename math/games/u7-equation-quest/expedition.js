/* Bridgekeepers — the Equation Quest expedition (Reveal Math Unit 8, lessons 8-1 to 8-7).
 * A misty chasm of broken bridges. Each bridge is a balance: the student's equations and
 * inequalities lower its counterweights, set its keystones and test its weight gates.
 * Math rules: expedition-math.js. Builders: expedition-missions.js (counterweight,
 * keystones) and expedition-gates.js (weightgate, plaque). Engine:
 * /math/games/shared/expedition-engine.js.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.EQ_MISSIONS;
  if (!X || !M || !M.counterweight || !M.weightgate || !window.eqGame) return;
  const { W, H } = X;
  const { L } = M;
  const { chapterDone } = X._internals;

  /* Mosslight Crossing: a rope footbridge with moss lanterns. */
  function footbridge(g, kit, cx, y, whole) {
    g.fillStyle(0x3a3150, 1)
      .fillRect(cx - 104, y - 40, 8, 56)
      .fillRect(cx + 96, y - 40, 8, 56);
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      pts.push({ x: cx - 100 + 200 * t, y: y - 30 + Math.sin(Math.PI * t) * 22 });
    }
    pts.forEach((p, i) => {
      if (!whole && i >= 6 && i <= 10) return;
      g.fillStyle(whole ? 0x8a6a44 : 0x5a4a3a, 1).fillRect(p.x - 5, p.y, 10, 5);
    });
    g.lineStyle(2, whole ? 0xb59a6a : 0x6a5a48, 1);
    for (let i = 1; i < pts.length; i++) {
      if (!whole && i >= 7 && i <= 10) continue;
      g.lineBetween(pts[i - 1].x, pts[i - 1].y - 12, pts[i].x, pts[i].y - 12);
    }
    if (!whole) {
      g.lineBetween(pts[6].x, pts[6].y - 12, pts[6].x + 4, pts[6].y + 26);
      g.lineBetween(pts[10].x, pts[10].y - 12, pts[10].x - 3, pts[10].y + 30);
    }
    [0, 4, 12, 16].forEach((i) => {
      const p = pts[i];
      g.fillStyle(whole ? 0x9cf2a8 : 0x445044, 1).fillCircle(p.x, p.y - 22, 4);
      if (whole) kit.glow(p.x, p.y - 22, 46, 0x9cf2a8, 0.4, -83);
    });
  }
  /* The Floating Span: stone platforms that line up and glow once restored. */
  function floatingSpan(g, kit, cx, y, whole) {
    for (let i = 0; i < 5; i++) {
      const x = cx - 96 + i * 48;
      const dy = whole ? 0 : [12, -16, 20, -6, 16][i];
      const tilt = whole ? 0 : [6, -8, 4, -10, 8][i];
      g.fillStyle(whole ? 0x6e6496 : 0x403a58, 1);
      g.fillPoints(
        [
          { x: x - 20, y: y + dy - tilt / 2 },
          { x: x + 20, y: y + dy + tilt / 2 },
          { x: x + 14, y: y + dy + 12 },
          { x: x - 14, y: y + dy + 12 },
        ],
        true,
      );
      if (whole) kit.glow(x, y + 16, 50, 0xc8b9ff, 0.35, -83);
    }
  }
  /* Citadel Bridge: a stone arch between two towers; the keystone is missing until restored. */
  function citadel(g, kit, cx, y, whole) {
    g.fillStyle(0x352d4f, 1)
      .fillRect(cx - 110, y - 70, 26, 96)
      .fillRect(cx + 84, y - 70, 26, 96);
    g.fillTriangle(cx - 116, y - 70, cx - 78, y - 70, cx - 97, y - 96);
    g.fillTriangle(cx + 78, y - 70, cx + 116, y - 70, cx + 97, y - 96);
    g.fillStyle(whole ? 0x6e6496 : 0x463e62, 1);
    for (let i = 0; i < 9; i++) {
      if (!whole && i === 4) continue;
      const a = Math.PI + (i / 8) * Math.PI;
      const x = cx + Math.cos(a) * 84;
      const yy = y + 14 + Math.sin(a) * 40;
      g.fillRect(x - 10, yy - 8, 20, 16);
    }
    g.fillStyle(whole ? 0xffd76a : 0x2a2440, 1)
      .fillRect(cx - 101, y - 50, 8, 10)
      .fillRect(cx + 93, y - 50, 8, 10);
    if (whole) {
      kit.glow(cx, y - 30, 120, 0xffd76a, 0.3, -83);
      g.fillStyle(0xc8b9ff, 1).fillTriangle(cx + 97, y - 96, cx + 97, y - 118, cx + 116, y - 110);
    }
  }

  function paint(scene, kit, ctx) {
    const r = ctx.restored;
    const play = ctx.mode === "play";
    kit.sky(0x0b0a22, kit.mix(0x2a2346, 0x3c4f78, r), "eq-sky-" + Math.round(r * 10));
    kit.glow(150, 120, 260, 0xe8e2ff, play ? 0.18 : 0.34, -98);
    scene.add.circle(150, 120, 26, 0xf3efff, 0.85).setDepth(-97);
    kit.stars(46, 13, 0xe6e0ff);
    // Far citadel spires.
    const far = scene.add.graphics().setDepth(-95);
    far.fillStyle(kit.mix(0x1c1835, 0x2b3558, r), 1);
    [90, 160, 610, 700, 760].forEach((x, i) => {
      const h = 90 + ((i * 37) % 60);
      far.fillRect(x, 330 - h, 22, h);
      far.fillTriangle(x - 4, 330 - h, x + 26, 330 - h, x + 11, 300 - h);
    });
    kit.ridge(kit.mix(0x1f1a38, 0x263c4f, r), 330, 60, 21, { parallax: 0.15, depth: -94 });
    kit.ridge(kit.mix(0x2a2340, 0x2f5a4c, r), 410, 54, 33, {
      parallax: 0.3,
      depth: -90,
      rim: kit.mix(0x6a5c8a, 0x9cf2a8, r),
    });
    // The chasm: fog bands thin out as the world is restored.
    const fog = scene.add.graphics().setDepth(-87);
    for (let i = 0; i < 4; i++) {
      fog.fillStyle(0xd8d0ff, (0.16 - 0.1 * r) * (1 - i * 0.18));
      fog.fillEllipse(W / 2 + (i % 2 ? -120 : 140), 470 + i * 26, 900, 34);
    }
    kit.ridge(kit.mix(0x241d3a, 0x2c4a3e, r), 548, 30, 47, { parallax: 0.55, depth: -86 });
    // Landmarks, one per chapter; whole and glowing once that chapter is restored.
    const g = scene.add.graphics().setDepth(-84);
    const done = (i) => !!ctx.state && chapterDone(def.chapters[i], ctx.state);
    footbridge(g, kit, W / 6, 476, done(0));
    floatingSpan(g, kit, W / 2, 478, done(1));
    citadel(g, kit, (5 * W) / 6, 482, done(2));
    // Lanterns appear along the cliffs as more of the world is restored.
    const lamps = Math.round(r * 10);
    for (let i = 0; i < lamps; i++) {
      const x = 40 + i * 82;
      g.fillStyle(0xffd76a, 1).fillCircle(x, 560, 4);
      kit.glow(x, 560, 40, 0xffd76a, 0.35, -83);
    }
    kit.motes(r > 0.3 ? 0xb8ffc8 : 0xc8b9ff, 22);
    if (play) {
      const veil = scene.add.graphics().setDepth(-60);
      veil.fillStyle(0x05040e, 0.5).fillRect(0, 0, W, H);
    }
  }

  function onRestore(scene, kit) {
    kit.burst(W / 2, 470, 0xc8b9ff, 30, { gravity: -40, speed: 180 });
    kit.sfx.hum();
  }

  const def = {
    id: "u7-equation-quest",
    title: L("Bridgekeepers", "Guardianes del Puente"),
    accent: "#c8b9ff",
    music: { root: 174.6, mode: "dorian", bpm: 72 },
    skills: {
      solutions: {
        ...L("Solutions of equations", "Soluciones de ecuaciones"),
        standard: "6.AT.8",
        lessons: "8-1",
      },
      addSub: {
        ...L("Solve x + a = b and x − a = b", "Resolver x + a = b y x − a = b"),
        standard: "6.AT.8",
        lessons: "8-2",
      },
      mulDiv: {
        ...L("Solve ax = b and x ÷ a = b", "Resolver ax = b y x ÷ a = b"),
        standard: "6.AT.8",
        lessons: "8-3",
      },
      writeEq: {
        ...L("Write equations for stories", "Escribir ecuaciones para historias"),
        standard: "6.AT.8",
        lessons: "8-2, 8-3",
      },
      writeIneq: {
        ...L("Write and graph inequalities", "Escribir y graficar desigualdades"),
        standard: "6.AT.9",
        lessons: "8-4",
      },
      ineqSolutions: {
        ...L("Solutions of inequalities", "Soluciones de desigualdades"),
        standard: "6.AT.9",
        lessons: "8-5",
      },
      solveIneq: {
        ...L("Solve and graph inequalities", "Resolver y graficar desigualdades"),
        standard: "6.AT.8",
        lessons: "8-6",
      },
      problem: {
        ...L("Equation problem solving", "Resolver problemas con ecuaciones"),
        standard: "6.AT.8",
        lessons: "8-7",
      },
    },
    misconceptions: {
      oneSide: L("Doing an operation to one side only", "Hacer una operación en un solo lado"),
      sameOp: L(
        "Using the same operation instead of the inverse",
        "Usar la misma operación en vez de la inversa",
      ),
      wrongOp: L(
        "Undoing × or ÷ with + or − (or the reverse)",
        "Deshacer × o ÷ con + o − (o al revés)",
      ),
      notIsolated: L("Stopping before x is alone", "Parar antes de que x quede sola"),
      notTrue: L(
        "Choosing values that do not make the sentence true",
        "Elegir valores que no hacen verdadera la oración",
      ),
      missedSome: L(
        "Finding only some solutions of an inequality",
        "Hallar solo algunas soluciones de una desigualdad",
      ),
      flipped: L("Inequality pointing the wrong way", "Desigualdad al revés"),
      endpoint: L("Open vs closed endpoint (< vs ≤)", "Extremo abierto o cerrado (< o ≤)"),
      boundary: L("Wrong boundary number", "Número límite equivocado"),
      relation: L("Mixing up = and inequality signs", "Confundir = con los signos de desigualdad"),
      order: L("Switching the order in − or ÷", "Invertir el orden en − o ÷"),
      lessThan: L('Writing x + 5 for "5 less than x"', 'Escribir x + 5 para "5 menos que x"'),
      opWord: L(
        "Choosing an operation that does not match the story",
        "Elegir una operación que no coincide con la historia",
      ),
      numbers: L("Numbers in the wrong places", "Números en lugares equivocados"),
      arith: L("Arithmetic slip while solving", "Error de cálculo al resolver"),
    },
    chapters: [
      {
        id: "mosslight",
        name: L("Mosslight Crossing", "Cruce de Luzmusgo"),
        landmark: L("the Mosslight footbridge", "el puente colgante de Luzmusgo"),
        missions: [
          {
            id: "m1",
            type: "keystones",
            variant: "eq",
            skill: "solutions",
            tier: 1,
            name: L("True Stones", "Piedras verdaderas"),
            brief: L(
              "Test stones in an equation. Only the solution fits the arch.",
              "Prueba piedras en una ecuación. Solo la solución cabe en el arco.",
            ),
          },
          {
            id: "m2",
            type: "counterweight",
            variant: "addsub",
            skill: "addSub",
            tier: 1,
            name: L("First Counterweight", "Primer contrapeso"),
            brief: L(
              "Take the same weight off both pans until x is alone.",
              "Quita el mismo peso de los dos platillos hasta que x quede sola.",
            ),
          },
          {
            id: "m3",
            type: "plaque",
            variant: "eq",
            skill: "writeEq",
            tier: 1,
            name: L("Carve the Crossing", "Tallar el cruce"),
            brief: L(
              "Write the equation for a story on the bridge plaque.",
              "Escribe la ecuación de una historia en la placa del puente.",
            ),
          },
          {
            id: "m4",
            type: "counterweight",
            variant: "addsub",
            skill: "addSub",
            tier: 2,
            mastery: true,
            name: L("Mosslight Mastery", "Dominio de Luzmusgo"),
            brief: L(
              "Balloons or weights: free x on your own.",
              "Globos o pesas: libera a x por tu cuenta.",
            ),
          },
        ],
      },
      {
        id: "span",
        name: L("The Floating Span", "El Puente Flotante"),
        landmark: L("the floating span", "el puente flotante"),
        missions: [
          {
            id: "f1",
            type: "counterweight",
            variant: "muldiv",
            skill: "mulDiv",
            tier: 1,
            name: L("Crate Stacks", "Pilas de cajas"),
            brief: L(
              "Several crates on one pan: split both pans into equal groups.",
              "Varias cajas en un platillo: divide los dos platillos en grupos iguales.",
            ),
          },
          {
            id: "f2",
            type: "plaque",
            variant: "ineq",
            skill: "writeIneq",
            tier: 2,
            name: L("Weight-Limit Signs", "Letreros de peso máximo"),
            brief: L(
              "Write the inequality for each bridge rule.",
              "Escribe la desigualdad de cada regla del puente.",
            ),
          },
          {
            id: "f3",
            type: "weightgate",
            variant: "represent",
            skill: "writeIneq",
            tier: 2,
            name: L("The Weight Gate", "La reja de peso"),
            brief: L(
              "Shade the safe weights on the number line. Open or closed circle?",
              "Sombrea los pesos seguros en la recta. ¿Círculo abierto o cerrado?",
            ),
          },
          {
            id: "f4",
            type: "counterweight",
            variant: "muldiv",
            skill: "mulDiv",
            tier: 2,
            mastery: true,
            name: L("Span Mastery", "Dominio del puente flotante"),
            brief: L(
              "Crates and crate pieces: free x on your own.",
              "Cajas y pedazos de caja: libera a x por tu cuenta.",
            ),
          },
        ],
      },
      {
        id: "citadel",
        name: L("Citadel Bridge", "Puente de la Ciudadela"),
        landmark: L("the citadel arch", "el arco de la ciudadela"),
        missions: [
          {
            id: "c1",
            type: "keystones",
            variant: "ineq",
            skill: "ineqSolutions",
            tier: 2,
            name: L("Many True Stones", "Muchas piedras verdaderas"),
            brief: L(
              "An inequality has many solutions. Place every true stone.",
              "Una desigualdad tiene muchas soluciones. Coloca todas las piedras verdaderas.",
            ),
          },
          {
            id: "c2",
            type: "weightgate",
            variant: "solve",
            skill: "solveIneq",
            tier: 2,
            name: L("Solve the Gate", "Resolver la reja"),
            brief: L(
              "Solve the inequality, then graph it so the gate holds.",
              "Resuelve la desigualdad y grafícala para que la reja aguante.",
            ),
          },
          {
            id: "c3",
            type: "plaque",
            variant: "problem",
            skill: "problem",
            tier: 3,
            name: L("Citadel Riddles", "Acertijos de la ciudadela"),
            brief: L(
              "Write the equation for a story, then solve it.",
              "Escribe la ecuación de una historia y resuélvela.",
            ),
          },
          {
            id: "c4",
            type: "weightgate",
            variant: "solve",
            skill: "solveIneq",
            tier: 3,
            mastery: true,
            name: L("Citadel Mastery", "Dominio de la ciudadela"),
            brief: L(
              "Solve and graph an inequality on your own.",
              "Resuelve y grafica una desigualdad por tu cuenta.",
            ),
          },
        ],
      },
    ],
    paint,
    onRestore,
    builders: {
      counterweight: M.counterweight,
      keystones: M.keystones,
      weightgate: M.weightgate,
      plaque: M.plaque,
    },
  };

  // window.eqGame is set in index.html right after the classic game is created.
  X.register(window.eqGame, def);
})();
