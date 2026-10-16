/* The Primekeeper — the Factor Frenzy expedition (Unit 6 lessons 6-7, 6-12, 6-13; 6.NOS.4).
 * A cold mountain forge relights as the student's factors, multiples and prime
 * factorizations run its machines. Builders live in expedition-missions.js (gate, lock)
 * and expedition-forge.js (gears, forge); the pure math in expedition-math.js; the DOM
 * entry point and accessible deck for this non-Phaser page in expedition-mount.js.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.PK_MATH;
  const B = window.PK_MISSIONS;
  if (!X || !M || !B || !B.forge || !window.PK_MOUNT) return;
  const { W, H } = X;
  const L = M.L;
  const { chapterDone } = X._internals;

  function mountain(g, color, pts) {
    g.fillStyle(color, 1).fillPoints(pts, true);
  }
  /** Copper Gate: an arch tiled with copper plates; tarnished and gappy until restored. */
  function copperGate(g, cx, base, lush) {
    g.fillStyle(0x2a1c1c, 1).fillRect(cx - 62, base - 96, 124, 96);
    g.fillStyle(0x140c0e, 1).fillRoundedRect(cx - 40, base - 74, 80, 74, {
      tl: 40,
      tr: 40,
      bl: 0,
      br: 0,
    });
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 6; c++) {
        if (!lush && (r * 7 + c * 3) % 4 === 0) continue;
        g.fillStyle(lush ? ((r + c) % 2 ? 0xe39a58 : 0xc97a3e) : 0x5c4a40, 1);
        g.fillRect(cx - 58 + c * 19.5, base - 94 + r * 9, 17, 7);
      }
    if (lush) {
      g.fillStyle(0xffc779, 0.85).fillRoundedRect(cx - 36, base - 70, 72, 70, {
        tl: 36,
        tr: 36,
        bl: 0,
        br: 0,
      });
    }
  }
  /** Crystal Gate: crystal spires around two gears; grey until restored. */
  function crystalGate(g, cx, base, lush) {
    const col = lush ? 0x8ff0ff : 0x5a6470;
    [-58, -34, 34, 58].forEach((dx, i) => {
      const h = 60 + (i % 2) * 26;
      g.fillStyle(col, lush ? 0.95 : 0.8);
      g.fillTriangle(cx + dx - 11, base, cx + dx + 11, base, cx + dx, base - h);
      g.fillStyle(0xffffff, lush ? 0.35 : 0.08).fillTriangle(
        cx + dx - 3,
        base,
        cx + dx + 4,
        base,
        cx + dx,
        base - h + 6,
      );
    });
    [
      [-12, 22],
      [16, 16],
    ].forEach(([dx, r]) => {
      g.fillStyle(lush ? 0xffc779 : 0x4a4448, 1).fillCircle(cx + dx, base - 40, r);
      g.fillStyle(0x140c0e, 1).fillCircle(cx + dx, base - 40, r * 0.4);
    });
  }
  /** Heart of the Mountain: a furnace with an anvil; cold until restored. */
  function heartForge(g, cx, base, lush) {
    g.fillStyle(0x2c2024, 1).fillTriangle(cx - 70, base, cx + 70, base, cx, base - 104);
    g.fillStyle(lush ? 0xff9a3c : 0x241618, 1).fillRoundedRect(cx - 26, base - 52, 52, 52, {
      tl: 26,
      tr: 26,
      bl: 0,
      br: 0,
    });
    if (lush)
      g.fillStyle(0xffe08a, 1).fillRoundedRect(cx - 14, base - 36, 28, 36, {
        tl: 14,
        tr: 14,
        bl: 0,
        br: 0,
      });
    g.fillStyle(0x3a3236, 1)
      .fillRect(cx + 36, base - 22, 34, 10)
      .fillRect(cx + 46, base - 12, 14, 12);
  }

  function paint(scene, kit, ctx) {
    const r = ctx.restored;
    const play = ctx.mode === "play";
    const done = (i) => !!ctx.state && chapterDone(def.chapters[i], ctx.state);
    kit.sky(0x0e0a1c, kit.mix(0x2a1620, 0x6a3420, r), "pk-sky-" + Math.round(r * 10));
    kit.stars(46, 13, 0xffe6d0);
    kit.glow(W / 2, 360, 520, 0xff8a3c, 0.12 + 0.4 * r, -98);
    kit.ridge(kit.mix(0x221a30, 0x34223a, r), 330, 110, 5, { parallax: 0.12, depth: -95 });
    // The great mountain, its lava veins brightening as the forge relights.
    const m = scene.add.graphics().setDepth(-92);
    mountain(m, kit.mix(0x2a2030, 0x3a2630, r), [
      { x: 150, y: H },
      { x: 300, y: 250 },
      { x: 360, y: 205 },
      { x: W / 2, y: 150 },
      { x: 470, y: 210 },
      { x: 540, y: 262 },
      { x: 690, y: H },
    ]);
    m.fillStyle(0xffffff, 0.12).fillTriangle(W / 2, 150, 372, 214, 446, 206);
    m.lineStyle(3, kit.mix(0x4a2a24, 0xffa04a, r), 0.25 + 0.65 * r);
    [
      [W / 2, 190, 392, 270, 420, 360],
      [W / 2, 190, 440, 280, 404, 380],
      [430, 230, 470, 320, 452, 420],
    ].forEach(([x1, y1, x2, y2, x3, y3]) => {
      m.lineBetween(x1, y1, x2, y2);
      m.lineBetween(x2, y2, x3, y3);
    });
    kit.glow(W / 2, 400, 200 + 160 * r, done(2) ? 0xffb347 : 0xff6a2a, 0.1 + 0.5 * r, -91);
    kit.ridge(kit.mix(0x1c1420, 0x2a1a20, r), 440, 50, 29, {
      parallax: 0.35,
      depth: -88,
      rim: kit.mix(0x3a2a34, 0xffc779, r),
    });
    // Landmarks: Copper Gate, Crystal Gate, Heart of the Mountain.
    const g = scene.add.graphics().setDepth(-84);
    const base = 528;
    copperGate(g, W / 6, base, done(0));
    crystalGate(g, W / 2, base, done(1));
    heartForge(g, (5 * W) / 6, base, done(2));
    if (done(0)) kit.glow(W / 6, base - 40, 180, 0xffc779, 0.35, -85);
    if (done(1)) kit.glow(W / 2, base - 50, 200, 0x7fe3ff, 0.35, -85);
    if (done(2)) kit.glow((5 * W) / 6, base - 30, 200, 0xff9a3c, 0.5, -85);
    const fg = scene.add.graphics().setDepth(-82);
    fg.fillStyle(0x0c080c, 1).fillRect(0, base, W, H - base);
    // Lanterns along the path, one per restored mission.
    const lit = Math.round(r * 12);
    for (let i = 0; i < 12; i++) {
      const x = 30 + i * 69;
      fg.fillStyle(0x2a1e1a, 1).fillRect(x - 1, base - 18, 3, 18);
      fg.fillStyle(i < lit ? 0xffc779 : 0x3a2e2a, 1).fillCircle(x, base - 20, 4);
      if (i < lit) kit.glow(x, base - 20, 40, 0xffc779, 0.5, -81);
    }
    kit.motes(0xffa860, 12 + Math.round(r * 24), { speedY: { min: -26, max: -8 }, top: 200 });
    if (play) {
      const veil = scene.add.graphics().setDepth(-60);
      veil.fillStyle(0x07040a, 0.55).fillRect(0, 0, W, H);
    }
  }

  function onRestore(scene, kit) {
    kit.burst(W / 2, 470, 0xffc779, 30, { gravity: -60, speed: 200 });
    kit.sfx.place();
  }

  const def = {
    id: "u1-factor-frenzy",
    title: L("The Primekeeper", "El Guardián de los Primos"),
    accent: "#ffc779",
    music: { root: 174.6, mode: "dorian", bpm: 72 },
    skills: {
      factors: {
        ...L("Factors and factor pairs", "Factores y pares de factores"),
        standard: "6.NOS.4",
        lessons: "6-7",
      },
      gcf: {
        ...L("Greatest common factor", "Máximo común divisor"),
        standard: "6.NOS.4",
        lessons: "6-7",
      },
      lcm: {
        ...L("Least common multiple", "Mínimo común múltiplo"),
        standard: "6.NOS.4",
        lessons: "6-12",
      },
      primeFact: {
        ...L("Prime factorization", "Factorización prima"),
        standard: "6.NOS.4",
        lessons: "6-13",
      },
    },
    misconceptions: {
      notFactor: L("Using a number that is not a factor", "Usar un número que no es factor"),
      missedPair: L("Missing factor pairs", "Olvidar pares de factores"),
      forgotOne: L("Forgetting the pair 1 × the number", "Olvidar el par 1 × el número"),
      notCommon: L(
        "A factor of one number but not the other",
        "Un factor de un número pero no del otro",
      ),
      notGreatest: L("A common factor, but not the greatest", "Un factor común, pero no el mayor"),
      lcmForGcf: L(
        "Using a multiple when the GCF is needed",
        "Usar un múltiplo cuando se necesita el MCD",
      ),
      productLCM: L(
        "Multiplying the two numbers to get the LCM",
        "Multiplicar los dos números para obtener el MCM",
      ),
      notLeast: L("A common multiple, but not the least", "Un múltiplo común, pero no el menor"),
      gcfForLcm: L("Using the GCF when the LCM is needed", "Usar el MCD cuando se necesita el MCM"),
      oneMultiple: L(
        "A multiple of only one of the numbers",
        "Un múltiplo de solo uno de los números",
      ),
      notMultiple: L("Not a multiple of either number", "No es múltiplo de ninguno de los números"),
      stopEarly: L(
        "Calling a composite number prime (stopping the tree early)",
        "Llamar primo a un número compuesto (detener el árbol muy pronto)",
      ),
      oneAsPrime: L("Treating 1 as a prime factor", "Tratar el 1 como factor primo"),
    },
    chapters: [
      {
        id: "copper",
        name: L("Copper Gate", "Puerta de Cobre"),
        landmark: L("the copper gate", "la puerta de cobre"),
        missions: [
          {
            id: "c1",
            type: "gate",
            skill: "factors",
            tier: 1,
            name: L("Plate the Gate", "Cubrir la puerta"),
            brief: L(
              "Find every factor pair of a number and hang each one as a copper plate.",
              "Halla cada par de factores de un número y cuelga cada uno como placa de cobre.",
            ),
          },
          {
            id: "c2",
            type: "lock",
            skill: "gcf",
            tier: 1,
            name: L("Ore Crates", "Cajas de mineral"),
            brief: L(
              "Pack two piles into the most identical crates. Nothing left over.",
              "Empaca dos pilas en el mayor número de cajas iguales. Sin sobrantes.",
            ),
          },
          {
            id: "c3",
            type: "gate",
            skill: "factors",
            tier: 2,
            name: L("The Great Gate", "La gran puerta"),
            brief: L(
              "A bigger number and no slot count. Find every pair.",
              "Un número mayor y sin espacios marcados. Halla todos los pares.",
            ),
          },
          {
            id: "c4",
            type: "lock",
            skill: "gcf",
            tier: 2,
            mastery: true,
            name: L("Copper Mastery", "Dominio del cobre"),
            brief: L(
              "Find the greatest common factor on your own.",
              "Halla el máximo común divisor por tu cuenta.",
            ),
          },
        ],
      },
      {
        id: "crystal",
        name: L("Crystal Gate", "Puerta de Cristal"),
        landmark: L("the crystal gate gears", "los engranajes de la puerta de cristal"),
        missions: [
          {
            id: "g1",
            type: "gears",
            skill: "lcm",
            tier: 1,
            name: L("Mesh the Gears", "Engranar"),
            brief: L(
              "Turn two marked gears until both marks meet at the top again.",
              "Gira dos engranajes marcados hasta que las dos marcas vuelvan a estar arriba.",
            ),
          },
          {
            id: "g2",
            type: "gears",
            skill: "lcm",
            tier: 2,
            name: L("Shared Teeth", "Dientes compartidos"),
            brief: L(
              "These gears share a factor. Multiplying is not the shortcut.",
              "Estos engranajes comparten un factor. Multiplicar no es el atajo.",
            ),
          },
          {
            id: "g3",
            type: "lock",
            skill: "gcf",
            tier: 3,
            name: L("Crystal Crates", "Cajas de cristal"),
            brief: L(
              "Bigger piles. Is it a factor or a multiple you need?",
              "Pilas más grandes. ¿Necesitas un factor o un múltiplo?",
            ),
          },
          {
            id: "g4",
            type: "gears",
            skill: "lcm",
            tier: 3,
            mastery: true,
            name: L("Crystal Mastery", "Dominio del cristal"),
            brief: L(
              "Big gears. Find the least common multiple on your own.",
              "Engranajes grandes. Halla el mínimo común múltiplo por tu cuenta.",
            ),
          },
        ],
      },
      {
        id: "heart",
        name: L("Heart of the Mountain", "Corazón de la Montaña"),
        landmark: L("the heart forge", "la forja del corazón"),
        missions: [
          {
            id: "h1",
            type: "forge",
            skill: "primeFact",
            tier: 1,
            name: L("First Ingot", "Primer lingote"),
            brief: L(
              "Split an ingot until every piece is prime.",
              "Divide un lingote hasta que cada pieza sea prima.",
            ),
          },
          {
            id: "h2",
            type: "forge",
            skill: "primeFact",
            tier: 2,
            name: L("Heavy Ingot", "Lingote pesado"),
            brief: L(
              "A bigger ingot, a taller factor tree.",
              "Un lingote más grande, un árbol de factores más alto.",
            ),
          },
          {
            id: "h3",
            type: "gate",
            skill: "factors",
            tier: 3,
            name: L("Furnace Door", "Puerta del horno"),
            brief: L(
              "Plate the furnace door: every factor pair of a large number.",
              "Cubre la puerta del horno: cada par de factores de un número grande.",
            ),
          },
          {
            id: "h4",
            type: "forge",
            skill: "primeFact",
            tier: 3,
            mastery: true,
            name: L("Heart Mastery", "Dominio del corazón"),
            brief: L(
              "Forge a large ingot into primes on your own.",
              "Forja un lingote grande en primos por tu cuenta.",
            ),
          },
        ],
      },
    ],
    paint,
    onRestore,
    builders: { gate: B.gate, lock: B.lock, gears: B.gears, forge: B.forge },
  };

  window.PK_DEF = def;
  window.PK_MOUNT(def);
})();
