const COLORS = {
  base: 0x12355b,
  blender: 0x2f6aa0,
  blenderGlass: 0x9ec9ec,
  strawberry: 0xe0556b,
  banana: 0xf2c15b,
  cursor: 0x1fa6a2,
  ok: 0x4aa978,
  bad: 0xb64e2f,
  counter: 0x4f8fd0,
};

const FRUIT = {
  strawberry: { name: "strawberry", color: COLORS.strawberry, emoji: "🍓" },
  banana: { name: "banana", color: COLORS.banana, emoji: "🍌" },
};

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

function simplify(a, b) {
  const g = gcd(a, b);
  return [a / g, b / g];
}

// Build the list of rounds for a level.
function makeLevel(level) {
  if (level === 1) {
    return {
      hints: true,
      rounds: [
        { kind: "ratio", a: 2, b: 3 },
        { kind: "ratio", a: 1, b: 2 },
        { kind: "ratio", a: 3, b: 2 },
        { kind: "ratio", a: 2, b: 4 }, // simplifies to 1:2 — exact counts accepted too
      ],
    };
  }
  return {
    hints: false,
    rounds: [
      // Scale the recipe up: target shown small, must serve the doubled batch.
      { kind: "ratio", a: 4, b: 6, baseLabel: "2 : 3, doubled" },
      { kind: "ratio", a: 6, b: 4, baseLabel: "3 : 2, doubled" },
      // Unit-rate rounds: pick the correct number.
      {
        kind: "rate",
        prompt: "$6 for 3 smoothies. Price per smoothie?",
        total: 6,
        count: 3,
        unit: "$",
        answer: 2,
      },
      {
        kind: "rate",
        prompt: "12 scoops of fruit make 4 servings. Scoops per serving?",
        total: 12,
        count: 4,
        unit: "",
        answer: 3,
      },
      {
        kind: "rate",
        prompt: "$10 for 5 smoothies. Price per smoothie?",
        total: 10,
        count: 5,
        unit: "$",
        answer: 2,
      },
    ],
  };
}

export default {
  id: "unit-1-smoothie-stand",
  vocab: [
    {
      term: "Ratio",
      definition:
        "A way to compare two amounts, like 2 strawberries to 3 bananas.",
      emoji: "⚖️",
    },
    {
      term: "Part-to-part",
      definition:
        "A ratio that compares one part to another part, like fruit to fruit.",
      emoji: "🍓",
    },
    {
      term: "Equivalent ratio",
      definition:
        "A ratio that shows the same comparison, like 2 : 3 and 4 : 6.",
      emoji: "🟰",
    },
    {
      term: "Unit rate",
      definition:
        "How much you get for just one, like the price for one smoothie.",
      emoji: "1️⃣",
    },
    {
      term: "Scale",
      definition:
        "To grow or shrink amounts by the same number to keep a ratio.",
      emoji: "📈",
    },
  ],

  createGame(ctx) {
    const {
      scene,
      camera,
      input,
      hud,
      feel,
      announce,
      caption,
      THREE,
      level,
      onScore,
    } = ctx;

    const cfg = makeLevel(level);

    // ---- Static scene ----
    const group = new THREE.Group();
    scene.add(group);

    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: COLORS.base, roughness: 0.95 }),
    );
    counter.position.y = -0.4;
    group.add(counter);

    // Blender: glassy cylinder where scoops stack.
    const blenderGroup = new THREE.Group();
    group.add(blenderGroup);
    const jarRadius = 1.5;
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(jarRadius, jarRadius * 0.82, 4, 24, 1, true),
      new THREE.MeshStandardMaterial({
        color: COLORS.blenderGlass,
        transparent: true,
        opacity: 0.22,
        roughness: 0.1,
        metalness: 0.1,
        side: THREE.DoubleSide,
      }),
    );
    jar.position.y = 2;
    blenderGroup.add(jar);
    const jarBase = new THREE.Mesh(
      new THREE.CylinderGeometry(jarRadius * 0.9, jarRadius * 0.9, 0.5, 24),
      new THREE.MeshStandardMaterial({ color: COLORS.blender, roughness: 0.5 }),
    );
    jarBase.position.y = 0.25;
    blenderGroup.add(jarBase);

    // Two fruit dispensers flanking the blender (also tap targets).
    function makeDispenser(fruit, x) {
      const g = new THREE.Group();
      const bin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.9, 1.4, 16),
        new THREE.MeshStandardMaterial({ color: fruit.color, roughness: 0.6 }),
      );
      bin.position.y = 0.7;
      g.add(bin);
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({
          color: fruit.color,
          roughness: 0.4,
          emissive: fruit.color,
          emissiveIntensity: 0.15,
        }),
      );
      dome.position.y = 1.4;
      g.add(dome);
      g.position.set(x, 0, 3.4);
      g.userData.fruit = fruit.name;
      group.add(g);
      return g;
    }
    const dispenserStrawberry = makeDispenser(FRUIT.strawberry, -4.5);
    const dispenserBanana = makeDispenser(FRUIT.banana, 4.5);
    // Tag child meshes so a raycast hit maps back to the dispenser's fruit.
    dispenserStrawberry.traverse((o) => (o.userData.fruit = "strawberry"));
    dispenserBanana.traverse((o) => (o.userData.fruit = "banana"));

    const scoopGeo = new THREE.SphereGeometry(jarRadius * 0.62, 14, 10);
    const disposables = [scoopGeo];

    // ---- Round state ----
    const scoops = []; // { mesh, fruit }
    let counts = { strawberry: 0, banana: 0 };
    let round = null;
    let roundIndex = 0;
    let solved = false;

    // Unit-rate state.
    let rateGuess = 0;
    let rateLabel = null;

    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    // ---- Floating canvas labels (sprites) ----
    function roundRect(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }
    function makeLabel(text, bg = "rgba(18,53,91,0.92)") {
      const cv = document.createElement("canvas");
      cv.width = 256;
      cv.height = 88;
      const c = cv.getContext("2d");
      c.fillStyle = bg;
      roundRect(c, 4, 4, 248, 80, 16);
      c.fill();
      c.fillStyle = "#ffffff";
      c.font = "bold 36px system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, 128, 46);
      const tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearFilter;
      const spr = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthTest: false,
        }),
      );
      spr.scale.set(2.6, 0.9, 1);
      return spr;
    }
    function disposeLabel(spr) {
      if (!spr) return;
      group.remove(spr);
      spr.material.map.dispose();
      spr.material.dispose();
    }

    function clearRound() {
      scoops.forEach((s) => {
        group.remove(s.mesh);
        s.mesh.material.dispose();
      });
      scoops.length = 0;
      counts = { strawberry: 0, banana: 0 };
      disposeLabel(rateLabel);
      rateLabel = null;
      rateGuess = 0;
      solved = false;
    }

    // ---- Ratio rounds ----
    function ratioText() {
      return `${counts.strawberry} : ${counts.banana}`;
    }

    function addScoop(fruit) {
      if (solved) return;
      counts[fruit] += 1;
      const mesh = new THREE.Mesh(
        scoopGeo,
        new THREE.MeshStandardMaterial({
          color: FRUIT[fruit].color,
          roughness: 0.5,
          emissive: FRUIT[fruit].color,
          emissiveIntensity: 0.12,
        }),
      );
      // Stack in fill order so the running mixture is visible.
      const idx = scoops.length;
      mesh.position.set(0, 0.7 + idx * 0.62, 0);
      blenderGroup.add(mesh);
      scoops.push({ mesh, fruit });
      feel.burst(
        { x: 0, y: mesh.position.y + 0.5, z: 0 },
        { color: FRUIT[fruit].color, count: 12 },
      );
      announce(
        `Added ${FRUIT[fruit].name}. Mixture is ${counts.strawberry} strawberry to ${counts.banana} banana.`,
      );
      updateRatioLive();
    }

    function removeScoop() {
      if (solved || !scoops.length) return;
      const s = scoops.pop();
      counts[s.fruit] -= 1;
      blenderGroup.remove(s.mesh);
      s.mesh.material.dispose();
      announce(`Removed a ${FRUIT[s.fruit].name} scoop.`);
      updateRatioLive();
    }

    function updateRatioLive() {
      const target = `${round.a} : ${round.b}`;
      hud.setObjective(
        `Target ${target} (strawberry : banana) — Mixture ${ratioText()}`,
      );
    }

    // A mixture matches when it is non-empty and equivalent to the target ratio.
    function ratioMatches() {
      const { strawberry: s, banana: b } = counts;
      if (s === 0 && b === 0) return false;
      // Equivalent ratio test via cross-multiplication: s/b == a/round.b.
      // Guard the zero-part cases (a or b could be 0 in other recipes).
      if (round.a === 0) return s === 0 && b > 0;
      if (round.b === 0) return b === 0 && s > 0;
      return s * round.b === b * round.a;
    }

    function serveRatio() {
      if (solved) return;
      if (!ratioMatches()) {
        const [ta, tb] = simplify(round.a, round.b);
        const [ma, mb] =
          counts.strawberry || counts.banana
            ? simplify(counts.strawberry, counts.banana)
            : [counts.strawberry, counts.banana];
        hud.message(
          `Not equivalent yet. Your ${ma} : ${mb} must match ${ta} : ${tb}.`,
          { tone: "warn", duration: 2400 },
        );
        feel.shake(0.16);
        announce(
          `That mixture is not equivalent to the target ratio yet. Keep the same comparison.`,
        );
        return;
      }
      win();
    }

    // ---- Unit-rate rounds ----
    function buildRate() {
      rateGuess = 0;
      hud.setObjective(
        round.prompt + `  Your answer: ${round.unit}${rateGuess}`,
      );
      rateLabel = makeLabel(
        `${round.unit}${rateGuess}`,
        "rgba(79,143,208,0.95)",
      );
      rateLabel.position.set(0, 4.4, 0);
      group.add(rateLabel);
      announce(
        `Unit rate round. ${round.prompt} Use up and down to change your answer, then serve to lock it in.`,
      );
      if (cfg.hints) {
        hud.message("Divide the total by the number of servings.", {
          tone: "info",
          duration: 2600,
        });
      }
    }

    function adjustRate(delta) {
      if (solved) return;
      rateGuess = Math.max(0, rateGuess + delta);
      hud.setObjective(
        round.prompt + `  Your answer: ${round.unit}${rateGuess}`,
      );
      disposeLabel(rateLabel);
      rateLabel = makeLabel(
        `${round.unit}${rateGuess}`,
        "rgba(79,143,208,0.95)",
      );
      rateLabel.position.set(0, 4.4, 0);
      group.add(rateLabel);
      announce(`Answer ${round.unit}${rateGuess}.`);
    }

    function serveRate() {
      if (solved) return;
      if (rateGuess !== round.answer) {
        hud.message(
          `${round.unit}${rateGuess} is not the unit rate. Try ${round.total} ÷ ${round.count}.`,
          { tone: "warn", duration: 2400 },
        );
        feel.shake(0.16);
        announce(
          `That is not the unit rate. Divide ${round.total} by ${round.count}.`,
        );
        return;
      }
      win();
    }

    // ---- Win / progression ----
    function win() {
      solved = true;
      const base = round.kind === "rate" ? 25 : 20;
      const levelBonus = level === 2 ? 10 : 0;
      const pts = base + levelBonus;
      onScore(pts, {
        round: roundIndex + 1,
        kind: round.kind,
        target: round.kind === "rate" ? round.answer : `${round.a}:${round.b}`,
      });
      feel.shake(0.3);
      feel.burst(
        { x: 0, y: 3.2, z: 0 },
        { color: COLORS.ok, count: 40, spread: 4 },
      );
      if (round.kind === "rate") {
        hud.message(`Correct! ${round.unit}${round.answer} per one. +${pts}`, {
          tone: "ok",
          duration: 2400,
        });
        announce(
          `Correct! The unit rate is ${round.unit}${round.answer}. You earned ${pts} points.`,
        );
      } else {
        hud.message(`Served! ${ratioText()} matches the order. +${pts}`, {
          tone: "ok",
          duration: 2400,
        });
        announce(
          `Smoothie served. ${counts.strawberry} to ${counts.banana} is equivalent to the order. You earned ${pts} points.`,
        );
      }
      later(() => {
        if (roundIndex < cfg.rounds.length - 1) {
          roundIndex += 1;
          startRound();
        } else {
          hud.setObjective("Stand closed — every customer served. Great work!");
          hud.message("All orders complete!", { tone: "ok", duration: 0 });
          announce("All orders complete. Great work at the Smoothie Stand.");
        }
      }, 2600);
    }

    function startRound() {
      clearRound();
      round = cfg.rounds[roundIndex];
      // Keep an exact "Step X of Y" visible for the whole round.
      if (typeof hud.setProgress === "function")
        hud.setProgress(roundIndex, cfg.rounds.length);
      if (round.kind === "rate") {
        buildRate();
        return;
      }
      const targetTxt =
        round.baseLabel != null
          ? `${round.a} : ${round.b}  (scale ${round.baseLabel})`
          : `${round.a} : ${round.b}`;
      updateRatioLive();
      announce(
        `New customer. Order is ${round.a} parts strawberry to ${round.b} parts banana. ` +
          `Add scoops to match the ratio, then serve.`,
      );
      if (cfg.hints) {
        hud.message(
          `Order: ${targetTxt} strawberry : banana. Add scoops to match.`,
          {
            tone: "info",
            duration: 3000,
          },
        );
      }
    }

    // ---- Input handling ----
    function onPress(name) {
      if (round.kind === "rate") {
        if (name === "up" || name === "right") adjustRate(1);
        else if (name === "down" || name === "left") adjustRate(-1);
        else if (name === "action") serveRate();
        else if (name === "confirm") serveRate();
        return;
      }
      // Ratio round.
      if (name === "left" || name === "up") addScoop("strawberry");
      else if (name === "right" || name === "down") addScoop("banana");
      else if (name === "action") serveRatio();
      else if (name === "confirm") removeScoop();
    }

    function onTapWorld() {
      if (solved) return;
      if (round.kind === "rate") {
        // Tap right half = increment, left half = decrement (NDC sign is
        // mount-size independent: x >= 0 means the right half of the canvas).
        adjustRate(input.state.ndc.x >= 0 ? 1 : -1);
        return;
      }
      const hits = input.raycast(
        camera,
        [dispenserStrawberry, dispenserBanana, jar, jarBase],
        true,
      );
      if (!hits.length) return;
      const fruit = hits[0].object.userData.fruit;
      if (fruit) addScoop(fruit);
      else serveRatio(); // tapped the blender jar -> serve
    }

    let unbindPress = null;
    let unbindTap = null;
    let unbindFrame = null;

    return {
      start() {
        camera.position.set(0, 6.5, 11);
        camera.lookAt(0, 2, 0);
        feel.syncCamera();

        startRound();

        unbindPress = input.onPress(onPress);
        unbindTap = input.onTap(onTapWorld);

        if (!feel.reducedMotion) {
          unbindFrame = ctx.onFrame((dt, t) => {
            blenderGroup.rotation.y = Math.sin(t * 0.4) * 0.05;
            if (rateLabel) rateLabel.position.y = 4.4 + Math.sin(t * 2) * 0.08;
          });
        }
      },

      dispose() {
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        disposables.forEach((g) => g.dispose());
      },
    };
  },
};
