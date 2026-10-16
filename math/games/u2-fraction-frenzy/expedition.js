/* Reef Rescue — the Fraction Frenzy expedition (Reveal Math lessons 6-1, 6-2, 6-9, 6-10, 6-11).
 * A bleached reef comes back to colour as the student divides with fractions: coral frames
 * along the wall, kelp feed shared among nursery beds, nutrient scoops in a tank, and
 * two-step garden problems. Builders: expedition-missions.js and expedition-flow.js;
 * mathematics: expedition-math.js; engine: /math/games/shared/expedition-engine.js.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const K = window.FF_MISSIONS;
  if (!X || !K || !K.rescue || !window.ffGame) return;
  const { W, H } = X;
  const L = K.L;
  const { chapterDone } = X._internals;
  const BLEACH = 0x8e959b;

  function coral(g, x, y, s, color, seed) {
    const r = X.rng(seed);
    g.lineStyle(6 * s, color, 1);
    const branch = (bx, by, ang, len, depth) => {
      const ex = bx + Math.cos(ang) * len;
      const ey = by + Math.sin(ang) * len;
      g.lineStyle(Math.max(2, (6 - depth * 1.5) * s), color, 1).lineBetween(bx, by, ex, ey);
      g.fillStyle(color, 1).fillCircle(ex, ey, Math.max(2, (4 - depth) * s));
      if (depth < 3) {
        branch(ex, ey, ang - 0.45 - r.next() * 0.2, len * 0.72, depth + 1);
        branch(ex, ey, ang + 0.45 + r.next() * 0.2, len * 0.72, depth + 1);
      }
    };
    branch(x, y, -Math.PI / 2, 26 * s, 0);
  }
  function kelp(g, x, y, h, color, sway) {
    g.lineStyle(5, color, 1);
    let px = x;
    let py = y;
    for (let i = 1; i <= 8; i++) {
      const nx = x + Math.sin(i * 0.9 + sway) * 7;
      const ny = y - (h * i) / 8;
      g.lineBetween(px, py, nx, ny);
      if (i % 2 === 0) g.fillStyle(color, 1).fillEllipse(nx + 6, ny, 12, 5);
      px = nx;
      py = ny;
    }
  }
  function fish(scene, kit, x, y, color, dir) {
    const g = scene.add.graphics().setDepth(-82);
    g.fillStyle(color, 0.9).fillEllipse(0, 0, 22, 10);
    g.fillTriangle(-10 * dir, 0, -18 * dir, -6, -18 * dir, 6);
    g.setPosition(x, y);
    kit.tween({
      targets: g,
      x: x + 60 * dir,
      duration: 5200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  function paint(scene, kit, ctx) {
    const r = ctx.restored;
    const play = ctx.mode === "play";
    kit.sky(kit.mix(0x24505c, 0x1aa0b8, r), 0x03121c, "ff-sky-" + Math.round(r * 10));
    // Light from the surface.
    kit.glow(W / 2, -40, 700, 0xbff6ff, play ? 0.18 : 0.32, -98);
    const rays = scene.add.graphics().setDepth(-97).setBlendMode(Phaser.BlendModes.ADD);
    [90, 250, 430, 600, 740].forEach((x, i) => {
      rays.fillStyle(0xd8fbff, 0.035 + 0.05 * r);
      rays.fillTriangle(x - 30, 0, x + 30, 0, x + 120 - i * 40, H * 0.85);
    });
    kit.ridge(kit.mix(0x1b2f38, 0x12485a, r), 330, 80, 13, { parallax: 0.15, depth: -94 });
    kit.ridge(kit.mix(0x26343a, 0x1f5a52, r), 420, 70, 29, {
      parallax: 0.35,
      depth: -90,
      rim: kit.mix(0x8e959b, 0x63eed8, r),
    });
    kit.ridge(kit.mix(0x4a463c, 0x6b5d40, r), 540, 34, 41, { parallax: 0.6, depth: -86 });
    const g = scene.add.graphics().setDepth(-84);
    const done = (i) => ctx.state && chapterDone(def.chapters[i], ctx.state);
    const cols = [W / 6, W / 2, (5 * W) / 6];
    cols.forEach((cx, i) => {
      const lush = done(i);
      if (i === 0) {
        // Kelp Nursery: planter beds with tall kelp.
        g.fillStyle(0x5a4c3a, 1).fillRoundedRect(cx - 80, 530, 160, 26, 8);
        for (let k = 0; k < 7; k++)
          kelp(
            g,
            cx - 66 + k * 22,
            532,
            lush ? 120 + (k % 3) * 18 : 34,
            lush ? 0x5fd38a : 0x6f7a66,
            k,
          );
      } else if (i === 1) {
        // Coral Cathedral: an arch with spires.
        const col = lush ? 0xff8f7a : BLEACH;
        g.lineStyle(14, col, 1);
        const arch = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(cx - 70, 560),
          new Phaser.Math.Vector2(cx, 400),
          new Phaser.Math.Vector2(cx + 70, 560),
        );
        arch.draw(g, 24);
        [-90, -45, 45, 90].forEach((dx, k) =>
          coral(
            g,
            cx + dx,
            565,
            0.9 + (k % 2) * 0.3,
            lush ? [0xff8f7a, 0xffc35a, 0xb59cff, 0x63eed8][k] : BLEACH,
            70 + k,
          ),
        );
        if (lush) kit.glow(cx, 470, 220, 0xff8f7a, 0.3, -83);
      } else {
        // The Deep Garden: anemones and sea fans that glow when restored.
        for (let k = 0; k < 5; k++) {
          const ax = cx - 80 + k * 40;
          const col = lush ? [0xb59cff, 0x63eed8, 0xff9fd0, 0xffd76a, 0x8fe388][k] : BLEACH;
          g.fillStyle(col, 1).fillEllipse(ax, 556, 26, 14);
          for (let t = 0; t < 6; t++)
            g.lineStyle(3, col, 1).lineBetween(ax, 552, ax - 12 + t * 5, 528 - (t % 2) * 8);
        }
        if (lush) kit.glow(cx, 540, 240, 0xb59cff, 0.35, -83);
      }
    });
    // Coral and kelp spread across the reef as more of it is restored.
    const n = 4 + Math.round(r * 10);
    for (let i = 0; i < n; i++) {
      const x = 30 + ((i * 97) % (W - 60));
      const col = kit.mix(BLEACH, [0xff8f7a, 0xffc35a, 0xb59cff, 0x63eed8, 0xff9fd0][i % 5], r);
      if (i % 2)
        coral(scene.add.graphics().setDepth(-85), x, 590, 0.55 + (i % 3) * 0.12, col, 200 + i);
      else kelp(g, x, 594, 30 + r * 60, kit.mix(0x6f7a66, 0x5fd38a, r), i);
    }
    const fishCount = Math.round(r * 9);
    for (let i = 0; i < fishCount; i++)
      fish(
        scene,
        kit,
        80 + ((i * 173) % 640),
        170 + ((i * 61) % 220),
        [0xffc35a, 0x63eed8, 0xff8f7a][i % 3],
        i % 2 ? 1 : -1,
      );
    kit.motes(0xbff6ff, 24, { speedY: { min: -26, max: -10 } });
    if (play) {
      const veil = scene.add.graphics().setDepth(-60);
      veil.fillStyle(0x02101a, 0.5).fillRect(0, 0, W, H);
    }
  }

  function onRestore(scene, kit) {
    kit.burst(W / 2, 540, 0x63eed8, 30, { gravity: -60, speed: 180 });
    kit.sfx.flow();
  }

  const def = {
    id: "u2-fraction-frenzy",
    title: L("Reef Rescue", "Rescate del Arrecife"),
    accent: "#63eed8",
    music: { root: 174.6, mode: "dorian", bpm: 70 },
    skills: {
      share: {
        ...L("Divide a fraction by a whole number", "Dividir una fracción entre un número entero"),
        standard: "6.NOS.1",
        lessons: "6-1",
      },
      measure: {
        ...L("Divide a whole number by a fraction", "Dividir un número entero entre una fracción"),
        standard: "6.NOS.1",
        lessons: "6-1, 6-9",
      },
      mixed: {
        ...L("Divide fractions and mixed numbers", "Dividir fracciones y números mixtos"),
        standard: "6.NOS.1",
        lessons: "6-2, 6-10",
      },
      solve: {
        ...L("Solve fraction division problems", "Resolver problemas de división de fracciones"),
        standard: "6.NOS.1",
        lessons: "6-11",
      },
    },
    misconceptions: {
      multiply: L("Multiplying instead of dividing", "Multiplicar en vez de dividir"),
      inverted: L(
        "Dividing the wrong way (switching the numbers)",
        "Dividir al revés (cambiar el orden de los números)",
      ),
      invertBoth: L("Flipping both fractions", "Voltear las dos fracciones"),
      mixedSplit: L(
        "Not changing a mixed number to an improper fraction",
        "No cambiar un número mixto a fracción impropia",
      ),
      remainderUnit: L(
        "Reading the leftover in units instead of as part of the divisor",
        "Leer lo que sobra en unidades y no como parte del divisor",
      ),
      remainderDropped: L("Ignoring the leftover part", "Ignorar la parte que sobra"),
      roundedUp: L("Rounding up to a whole extra group", "Redondear a un grupo entero de más"),
      noDivide: L("Giving each share the whole amount", "Dar a cada parte la cantidad completa"),
      firstStep: L("First step of a two-step problem", "Primer paso de un problema de dos pasos"),
      skippedStep: L("Skipping the first step", "Saltarse el primer paso"),
      tooMany: L("Too many groups for the amount", "Demasiados grupos para la cantidad"),
      tooFew: L("Too few groups for the amount", "Muy pocos grupos para la cantidad"),
      shareTooBig: L("Equal shares that are too big", "Partes iguales demasiado grandes"),
      shareTooSmall: L("Equal shares that are too small", "Partes iguales demasiado pequeñas"),
    },
    chapters: [
      {
        id: "nursery",
        name: L("Kelp Nursery", "Vivero de Algas"),
        landmark: L("the kelp nursery beds", "los lechos del vivero"),
        missions: [
          {
            id: "k1",
            type: "beds",
            skill: "share",
            tier: 1,
            name: L("First Feeding", "Primera comida"),
            brief: L(
              "Share kelp feed equally among the beds.",
              "Reparte el alimento en partes iguales entre los lechos.",
            ),
          },
          {
            id: "k2",
            type: "frames",
            skill: "measure",
            tier: 1,
            name: L("Frame the Wall", "Enmarcar la pared"),
            brief: L(
              "How many coral frames fit along the wall?",
              "¿Cuántos marcos de coral caben en la pared?",
            ),
          },
          {
            id: "k3",
            type: "beds",
            skill: "share",
            tier: 2,
            name: L("Hungry Rows", "Hileras con hambre"),
            brief: L(
              "More beds, smaller shares. Keep every share fair.",
              "Más lechos, porciones más pequeñas. Que todas sean iguales.",
            ),
          },
          {
            id: "k4",
            type: "frames",
            skill: "measure",
            tier: 1,
            mastery: true,
            name: L("Nursery Mastery", "Dominio del vivero"),
            brief: L(
              "Frame a reef wall on your own.",
              "Enmarca una pared del arrecife por tu cuenta.",
            ),
          },
        ],
      },
      {
        id: "cathedral",
        name: L("Coral Cathedral", "Catedral de Coral"),
        landmark: L("the coral cathedral", "la catedral de coral"),
        missions: [
          {
            id: "c1",
            type: "frames",
            skill: "measure",
            tier: 2,
            name: L("Cut to Fit", "Cortar a la medida"),
            brief: L(
              "The frames do not fit evenly. Use part of a frame.",
              "Los marcos no caben exactos. Usa parte de un marco.",
            ),
          },
          {
            id: "c2",
            type: "scoops",
            skill: "mixed",
            tier: 1,
            name: L("Nutrient Tank", "Tanque de nutrientes"),
            brief: L(
              "Fill a mixed-number tank with small scoops.",
              "Llena un tanque de número mixto con medidas pequeñas.",
            ),
          },
          {
            id: "c3",
            type: "beds",
            skill: "mixed",
            tier: 3,
            name: L("Mixed Bundles", "Paquetes mixtos"),
            brief: L(
              "Share a mixed-number bundle of feed.",
              "Reparte un paquete de alimento con número mixto.",
            ),
          },
          {
            id: "c4",
            type: "scoops",
            skill: "mixed",
            tier: 2,
            mastery: true,
            name: L("Cathedral Mastery", "Dominio de la catedral"),
            brief: L(
              "Fill a tank with bigger scoops on your own.",
              "Llena un tanque con medidas más grandes por tu cuenta.",
            ),
          },
        ],
      },
      {
        id: "garden",
        name: L("The Deep Garden", "El Jardín Profundo"),
        landmark: L("the deep garden", "el jardín profundo"),
        missions: [
          {
            id: "d1",
            type: "scoops",
            skill: "mixed",
            tier: 3,
            name: L("Part of a Scoop", "Parte de una medida"),
            brief: L(
              "The last scoop is only part full.",
              "La última medida está solo en parte llena.",
            ),
          },
          {
            id: "d2",
            type: "rescue",
            skill: "solve",
            tier: 2,
            name: L("Plant the Garden", "Plantar el jardín"),
            brief: L(
              "Two steps: find the amount, then divide.",
              "Dos pasos: halla la cantidad y luego divide.",
            ),
          },
          {
            id: "d3",
            type: "frames",
            skill: "mixed",
            tier: 3,
            name: L("Long Frames", "Marcos largos"),
            brief: L(
              "A mixed-number wall with fraction frames.",
              "Una pared de número mixto con marcos de fracción.",
            ),
          },
          {
            id: "d4",
            type: "rescue",
            skill: "solve",
            tier: 3,
            mastery: true,
            name: L("Garden Mastery", "Dominio del jardín"),
            brief: L(
              "A two-step reef problem on your own.",
              "Un problema de dos pasos por tu cuenta.",
            ),
          },
        ],
      },
    ],
    paint,
    onRestore,
    builders: { frames: K.frames, beds: K.beds, scoops: K.scoops, rescue: K.rescue },
  };

  X.register(window.ffGame, def);
})();
