/* Cloudline Courier — the Decimal Dash expedition (Reveal Math lessons 2-6, 2-7, 2-11, 2-12).
 * A storm has grounded the sky-courier network. The student's decimal arithmetic flies
 * it again: cargo manifests balance the airships, fuel loads carry them across, and the
 * long-division sorter splits the mail. Builders live in expedition-missions.js and
 * expedition-cargo.js; the shared engine is /math/games/shared/expedition-engine.js.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.DD_MISSIONS;
  // index.html exposes the classic game's Phaser instance as window.ddGame.
  const game = window.ddGame;
  if (!X || !M || !M.sorter || !M.fuel || !game) return;
  const { W, H } = X;
  const { L } = M;
  const { chapterDone } = X._internals;

  /** Floating rock island; returns the y of its grassy top. */
  function island(g, cx, cy, w, lush, kit) {
    const rock = lush ? 0x4a4f5e : 0x3a3d4a;
    g.fillStyle(kit.mix(rock, 0x000000, 0.25), 1);
    g.fillTriangle(cx - w / 2, cy, cx + w / 2, cy, cx + w * 0.08, cy + w * 0.55);
    g.fillStyle(rock, 1).fillTriangle(cx - w / 2, cy, cx + w * 0.1, cy, cx - w * 0.1, cy + w * 0.4);
    g.fillStyle(lush ? 0x6fd38a : 0x5d6b5a, 1).fillEllipse(cx, cy, w, w * 0.16);
    return cy - w * 0.04;
  }
  function lantern(kit, x, y, on) {
    if (on) kit.glow(x, y, 46, 0xffd76a, 0.55, -83);
  }

  function paint(scene, kit, ctx) {
    const r = ctx.restored;
    const play = ctx.mode === "play";
    const done = (i) => !!ctx.state && chapterDone(def.chapters[i], ctx.state);
    kit.sky(
      kit.mix(0x0b0f26, 0x14306b, r),
      kit.mix(0x2b3046, 0xf0a271, r),
      "dd-sky-" + Math.round(r * 10),
    );
    kit.stars(46, 5);
    kit.glow(W / 2, H - 40, 700, 0xffbe86, 0.12 + 0.35 * r, -98);
    // Aurora ribbons strengthen as the network comes back.
    const aur = scene.add.graphics().setDepth(-96).setBlendMode(Phaser.BlendModes.ADD);
    [0x5cf2c8, 0x75e0ff, 0xb48cff].forEach((c, i) => {
      const pts = [];
      for (let k = 0; k <= 24; k++) {
        const x = (k / 24) * W;
        pts.push({ x, y: 70 + i * 26 + Math.sin(k * 0.55 + i * 1.7) * 22 });
      }
      aur.fillStyle(c, 0.05 + 0.22 * r);
      aur.fillPoints(
        [
          ...pts,
          ...pts
            .slice()
            .reverse()
            .map((p) => ({ x: p.x, y: p.y + 30 + i * 6 })),
        ],
        true,
      );
    });
    if (!kit.reduced() && r > 0)
      kit.tween({ targets: aur, alpha: 0.6, duration: 2600, yoyo: true, repeat: -1 });
    // Cloud banks: storm grey → sunlit as missions are completed.
    kit.ridge(kit.mix(0x2a2f44, 0x6d8fbf, r), 300, 44, 3, {
      parallax: 0.12,
      depth: -94,
      alpha: 0.85,
    });
    // Landmarks.
    const g = scene.add.graphics().setDepth(-88);
    const cols = [W / 6, W / 2, (5 * W) / 6];
    cols.forEach((cx, i) => {
      const lush = done(i);
      const top = island(g, cx, 368 + (i === 1 ? -14 : 0), 150, lush, kit);
      if (i === 0) {
        // Windward Post: a mail tower with a wind vane and docking mast.
        g.fillStyle(lush ? 0xd9c49a : 0x6d6a66, 1).fillRect(cx - 14, top - 74, 28, 74);
        g.fillStyle(lush ? 0xc4553f : 0x55504c, 1).fillTriangle(
          cx - 22,
          top - 74,
          cx + 22,
          top - 74,
          cx,
          top - 104,
        );
        g.lineStyle(4, 0x8a96a0, 1).lineBetween(cx + 34, top, cx + 34, top - 92);
        g.fillStyle(lush ? 0xffd76a : 0x6a6a6a, 1).fillTriangle(
          cx + 34,
          top - 92,
          cx + 62,
          top - 86,
          cx + 34,
          top - 80,
        );
        g.fillStyle(lush ? 0xffe9a8 : 0x2a2e36, 1).fillRect(cx - 6, top - 56, 12, 16);
        lantern(kit, cx, top - 48, lush);
      } else if (i === 1) {
        // Thunder Gap: two spires with a beacon arc; storm bolt until restored.
        g.fillStyle(0x4b5266, 1).fillTriangle(cx - 60, top, cx - 30, top, cx - 46, top - 110);
        g.fillTriangle(cx + 30, top, cx + 60, top, cx + 46, top - 110);
        if (lush) {
          g.lineStyle(5, 0x75e0ff, 0.9);
          new Phaser.Curves.QuadraticBezier(
            new Phaser.Math.Vector2(cx - 46, top - 104),
            new Phaser.Math.Vector2(cx, top - 150),
            new Phaser.Math.Vector2(cx + 46, top - 104),
          ).draw(g, 20);
          kit.glow(cx, top - 128, 150, 0x75e0ff, 0.45, -83);
        } else {
          g.lineStyle(3, 0xfff2a0, 0.85);
          g.strokePoints(
            [
              { x: cx + 6, y: top - 170 },
              { x: cx - 8, y: top - 128 },
              { x: cx + 8, y: top - 120 },
              { x: cx - 4, y: top - 80 },
            ],
            false,
          );
        }
      } else {
        // Aurora Harbor: docking towers with a string of lanterns.
        [-48, 48].forEach((dx) => {
          g.fillStyle(lush ? 0x9aa9b8 : 0x5a5f68, 1).fillRect(cx + dx - 8, top - 96, 16, 96);
          g.fillStyle(lush ? 0x75e0ff : 0x3f4650, 1).fillCircle(cx + dx, top - 100, 10);
        });
        g.lineStyle(2, 0xcfd8de, 0.7).lineBetween(cx - 48, top - 80, cx + 48, top - 80);
        for (let k = 0; k < 5; k++) {
          const lx = cx - 36 + k * 18;
          g.fillStyle(lush ? 0xffd76a : 0x4a4a4a, 1).fillCircle(lx, top - 76, 4);
          lantern(kit, lx, top - 76, lush);
        }
      }
      if (lush) {
        const ship = M.airship(
          scene,
          cx + (i === 1 ? 0 : 6),
          top - (i === 1 ? 190 : 150),
          0.32,
          0x75e0ff,
          -86,
        );
        if (!kit.reduced())
          kit.tween({
            targets: ship,
            y: ship.y - 6,
            duration: 1800 + i * 300,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
      }
    });
    // Courier ships return to the sky as the network is restored.
    const fleet = Math.round(r * 5);
    for (let i = 0; i < fleet; i++) {
      const s = M.airship(
        scene,
        90 + i * 160,
        200 + (i % 2) * 40,
        0.22,
        i % 2 ? 0xffd76a : 0x75e0ff,
        -90,
      );
      if (!kit.reduced())
        kit.tween({
          targets: s,
          x: s.x + 40,
          duration: 6000 + i * 700,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
    }
    kit.ridge(kit.mix(0x343a52, 0x9fb8d8, r), 470, 40, 17, {
      parallax: 0.3,
      depth: -87,
      alpha: 0.92,
    });
    kit.ridge(kit.mix(0x41465e, 0xd8e4f2, r), 560, 34, 29, { parallax: 0.55, depth: -85 });
    kit.motes(r > 0.3 ? 0xdff6ff : 0x9aa6b8, 22, {
      speedX: { min: 10, max: 30 },
      speedY: { min: -4, max: 4 },
    });
    if (play) {
      const veil = scene.add.graphics().setDepth(-60);
      veil.fillStyle(0x02070c, 0.5).fillRect(0, 0, W, H);
    }
  }

  function onRestore(scene, kit) {
    kit.burst(W / 2, 140, 0x75e0ff, 26, { gravity: 40, speed: 200 });
    kit.sfx.whoosh();
  }

  const def = {
    id: "u1-decimal-dash",
    title: L("Cloudline Courier", "Mensajería Línea de Nubes"),
    accent: "#75e0ff",
    music: { root: 220, mode: "major", bpm: 80 },
    entry: { x: W - 118, y: H - 48 },
    skills: {
      addSub: {
        ...L("Add and subtract decimals", "Sumar y restar decimales"),
        standard: "6.NOS.3",
        lessons: "2-11",
      },
      multDec: {
        ...L("Multiply decimals", "Multiplicar decimales"),
        standard: "6.NOS.3",
        lessons: "2-12",
      },
      divWhole: {
        ...L(
          "Divide multi-digit numbers (long division)",
          "Dividir números de varios dígitos (división larga)",
        ),
        standard: "6.NOS.2",
        lessons: "2-6",
      },
      divDec: { ...L("Divide decimals", "Dividir decimales"), standard: "6.NOS.3", lessons: "2-7" },
    },
    misconceptions: {
      misaligned: L(
        "Lining up the last digits instead of the decimal points",
        "Alinear los últimos dígitos en vez de los puntos decimales",
      ),
      regroup: L("Skipping a carry or a regroup", "Olvidar llevar o reagrupar"),
      annexZero: L(
        "Not annexing zeros (empty places are worth 0)",
        "No agregar ceros (los lugares vacíos valen 0)",
      ),
      addSub: L("Adding or subtracting slip", "Error al sumar o restar"),
      pointPlace: L(
        "Decimal point in the wrong place in a product or quotient",
        "Punto decimal en el lugar equivocado en un producto o cociente",
      ),
      added: L(
        "Adding the factors instead of multiplying",
        "Sumar los factores en vez de multiplicar",
      ),
      biggerProduct: L(
        "Thinking multiplying always makes a number bigger",
        "Creer que multiplicar siempre hace un número más grande",
      ),
      multDec: L("Multiplying slip", "Error al multiplicar"),
      digitHigh: L("A quotient digit that is too big", "Un dígito del cociente demasiado grande"),
      digitLow: L("A quotient digit that is too small", "Un dígito del cociente demasiado pequeño"),
      zeroSkip: L("Leaving out a 0 in the quotient", "Omitir un 0 en el cociente"),
      multiplied: L("Multiplying instead of dividing", "Multiplicar en vez de dividir"),
      inverted: L("Dividing in the wrong order", "Dividir en el orden equivocado"),
      divideSmaller: L(
        "Thinking dividing always makes a number smaller",
        "Creer que dividir siempre hace un número más pequeño",
      ),
      divDec: L("Dividing slip", "Error al dividir"),
    },
    chapters: [
      {
        id: "windward",
        name: L("Windward Post", "Puesto Barlovento"),
        landmark: L("the Windward mail tower", "la torre de correo de Barlovento"),
        missions: [
          {
            id: "w1",
            type: "manifest",
            variant: "add",
            skill: "addSub",
            tier: 1,
            name: L("First Manifest", "Primer manifiesto"),
            brief: L(
              "Line up the decimal points and total the cargo.",
              "Alinea los puntos decimales y suma la carga.",
            ),
          },
          {
            id: "w2",
            type: "manifest",
            variant: "sub",
            skill: "addSub",
            tier: 1,
            name: L("Room Aboard", "Espacio a bordo"),
            brief: L(
              "Find how many more tons fit on the ship.",
              "Halla cuántas toneladas más caben en la nave.",
            ),
          },
          {
            id: "w3",
            type: "fuel",
            skill: "multDec",
            tier: 1,
            name: L("Fuel Up", "Cargar combustible"),
            brief: L(
              "Fuel = burn rate × distance. Load exactly enough.",
              "Combustible = gasto × distancia. Carga lo justo.",
            ),
          },
          {
            id: "w4",
            type: "manifest",
            variant: "sub",
            skill: "addSub",
            tier: 2,
            mastery: true,
            name: L("Windward Mastery", "Dominio de Barlovento"),
            brief: L(
              "Thousandths on the manifest. On your own.",
              "Milésimos en el manifiesto. Por tu cuenta.",
            ),
          },
        ],
      },
      {
        id: "thunder",
        name: L("Thunder Gap", "Paso del Trueno"),
        landmark: L("the Thunder Gap beacon", "el faro del Paso del Trueno"),
        missions: [
          {
            id: "t1",
            type: "fuel",
            skill: "multDec",
            tier: 2,
            name: L("Through the Storm", "A través de la tormenta"),
            brief: L(
              "Both numbers are decimals now. Count the decimal places.",
              "Ahora los dos números son decimales. Cuenta los decimales.",
            ),
          },
          {
            id: "t2",
            type: "sorter",
            variant: "whole",
            skill: "divWhole",
            tier: 1,
            name: L("Mail Sorter", "Clasificadora de correo"),
            brief: L(
              "Split the letters evenly with long division.",
              "Reparte las cartas en partes iguales con división larga.",
            ),
          },
          {
            id: "t3",
            type: "sorter",
            variant: "whole",
            skill: "divWhole",
            tier: 2,
            name: L("Zero in the Middle", "Un cero en medio"),
            brief: L(
              "Some bundles are too small to share. Watch for zeros.",
              "Algunos grupos son muy pequeños para repartir. Atento a los ceros.",
            ),
          },
          {
            id: "t4",
            type: "fuel",
            skill: "multDec",
            tier: 3,
            mastery: true,
            name: L("Thunder Gap Mastery", "Dominio del Paso"),
            brief: L(
              "Hundredths × tenths. Fuel the crossing on your own.",
              "Centésimos × décimos. Carga el cruce por tu cuenta.",
            ),
          },
        ],
      },
      {
        id: "aurora",
        name: L("Aurora Harbor", "Puerto Aurora"),
        landmark: L("the harbor lights", "las luces del puerto"),
        missions: [
          {
            id: "a1",
            type: "sorter",
            variant: "dec",
            skill: "divDec",
            tier: 2,
            name: L("Even Shares", "Partes iguales"),
            brief: L(
              "Divide a decimal amount of mail. Annex zeros when needed.",
              "Divide una cantidad decimal de correo. Agrega ceros si hace falta.",
            ),
          },
          {
            id: "a2",
            type: "crates",
            skill: "divDec",
            tier: 2,
            name: L("Crate Fit", "Cajas a la medida"),
            brief: L(
              "How many decimal-length crates fill the hold?",
              "¿Cuántas cajas de largo decimal llenan la bodega?",
            ),
          },
          {
            id: "a3",
            type: "sorter",
            variant: "dec",
            skill: "divDec",
            tier: 3,
            name: L("Big Bags", "Bolsas grandes"),
            brief: L(
              "Two-digit divisors and more zeros to annex.",
              "Divisores de dos dígitos y más ceros para agregar.",
            ),
          },
          {
            id: "a4",
            type: "crates",
            skill: "divDec",
            tier: 3,
            mastery: true,
            name: L("Harbor Mastery", "Dominio del puerto"),
            brief: L(
              "Hundredths-size crates. Fill the hold on your own.",
              "Cajas en centésimos. Llena la bodega por tu cuenta.",
            ),
          },
        ],
      },
    ],
    paint,
    onRestore,
    builders: { manifest: M.manifest, fuel: M.fuel, sorter: M.sorter, crates: M.crates },
  };

  X.register(game, def);
})();
