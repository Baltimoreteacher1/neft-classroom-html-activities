import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";

/* =============================================================================
 * Unit 4 — Factory Line: Package the Order
 * Standard: 6.NS.B.2-4 (GCF, LCM, distributive property, decimal operations).
 * Theme preserved: a glowing automated packing plant. The operator sets the
 * answer dial; correct orders ship down the line with a particle burst.
 * Premium rebuild: RoundedBox/PBR crates, emissive+bloom accents, shadowed
 * stage, animated camera intro + idle, tweened transitions, sfx on every action.
 * ========================================================================== */

const PALETTE = {
  stage: 0x16263f,
  belt: 0x1b3a5b,
  beltGlow: 0x2f6aa0,
  steel: 0x3a4a63,
  crate: [0x2bc4be, 0x5aa0ec, 0xf2a64a, 0xa385e8, 0x5fd08a, 0xef8268],
  dial: 0xf2c15b,
  ok: 0x5fd08a,
  bad: 0xef6a4a,
};

// ---- Pure math (kept exact; mirrors standard 6.NS.B.2-4) --------------------
function gcf(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}
function lcm(a, b) {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcf(a, b);
}
function round2(n) {
  return Math.round(n * 100) / 100;
}
function fmt(n) {
  return String(round2(n));
}

// ---- Round sets: 6 per level. L1 scaffolded/smaller; L2 enrichment/larger ---
function makeLevel(level) {
  if (level === 1) {
    return {
      hints: true,
      rounds: [
        {
          kind: "gcf",
          a: 12,
          b: 8,
          prompt: "Find the GCF of 12 and 8. Set the dial to that number.",
        },
        {
          kind: "gcf",
          a: 9,
          b: 6,
          prompt: "Find the GCF of 9 and 6. Set the dial to that number.",
        },
        {
          kind: "lcm",
          a: 4,
          b: 6,
          prompt: "Find the LCM of 4 and 6. Set the dial to that number.",
        },
        {
          kind: "lcm",
          a: 3,
          b: 5,
          prompt: "Find the LCM of 3 and 5. Set the dial to that number.",
        },
        {
          kind: "decimal-sum",
          a: 3.5,
          b: 2.25,
          op: "+",
          prompt: "Add 3.5 + 2.25. Set the dial to the sum.",
        },
        {
          kind: "decimal-sum",
          a: 9.4,
          b: 3.7,
          op: "-",
          prompt: "Subtract 9.4 − 3.7. Set the dial to the answer.",
        },
      ],
    };
  }
  return {
    hints: false,
    rounds: [
      {
        kind: "decimal-prod",
        a: 2.4,
        b: 1.5,
        op: "×",
        prompt: "Multiply 2.4 × 1.5. Set the dial to the answer.",
      },
      {
        kind: "decimal-prod",
        a: 7.2,
        b: 0.6,
        op: "÷",
        prompt: "Divide 7.2 ÷ 0.6. Set the dial to the answer.",
      },
      {
        kind: "distributive",
        a: 36,
        b: 8,
        prompt: "Set the dial to the GCF of 36 and 8. That is the factor.",
      },
      {
        kind: "distributive",
        a: 18,
        b: 30,
        prompt: "Set the dial to the GCF of 18 and 30. That is the factor.",
      },
      {
        kind: "lcm",
        a: 8,
        b: 12,
        prompt: "Find the LCM of 8 and 12. Set the dial to that number.",
      },
      {
        kind: "gcf",
        a: 24,
        b: 36,
        prompt: "Find the GCF of 24 and 36. Set the dial to that number.",
      },
    ],
  };
}

// Expected answer + how the dial moves for a given round.
function roundSpec(r) {
  switch (r.kind) {
    case "gcf":
      return {
        answer: gcf(r.a, r.b),
        min: 1,
        max: Math.max(r.a, r.b),
        step: 1,
      };
    case "lcm":
      return { answer: lcm(r.a, r.b), min: 1, max: r.a * r.b, step: 1 };
    case "decimal-sum":
      return {
        answer: round2(r.op === "+" ? r.a + r.b : r.a - r.b),
        min: 0,
        max: round2(r.a + r.b + 5),
        step: 0.05,
      };
    case "decimal-prod":
      return {
        answer: round2(r.op === "×" ? r.a * r.b : r.a / r.b),
        min: 0,
        max: round2((r.op === "×" ? r.a * r.b : r.a / r.b) + 6),
        step: r.op === "×" ? 0.1 : 1,
      };
    case "distributive": {
      const g = gcf(r.a, r.b);
      return { answer: g, min: 1, max: Math.min(r.a, r.b), step: 1 };
    }
    default:
      return { answer: 0, min: 0, max: 1, step: 1 };
  }
}

export default {
  id: "unit-4-factory-line",
  vocab: [
    {
      term: "Greatest common factor",
      definition:
        "The biggest number that divides two numbers with nothing left over.",
      emoji: "🧩",
    },
    {
      term: "Least common multiple",
      definition: "The smallest number that two numbers both divide into.",
      emoji: "🔁",
    },
    {
      term: "Distributive property",
      definition: "Pulling out a shared factor: 36 + 8 becomes 4 × (9 + 2).",
      emoji: "📦",
    },
    {
      term: "Quotient",
      definition: "The answer you get when you divide one number by another.",
      emoji: "➗",
    },
    {
      term: "Decimal",
      definition: "A number with a dot that shows parts smaller than one.",
      emoji: "🔢",
    },
  ],

  createGame(ctx) {
    const {
      scene,
      camera,
      renderer,
      input,
      hud,
      feel,
      announce,
      caption,
      THREE,
      level,
      onScore,
      onFrame,
    } = ctx;

    const cfg = makeLevel(level);
    const reduced = feel.reducedMotion;

    // ---- Clarity / onboarding kit (shared overlay over the canvas) ----------
    // Mount is the same positioned container that hosts the canvas. Drives
    // nothing in the 3D scene — purely the start overlay, how-to-play, persistent
    // help button, mini-HUD, and win screen.
    const clarityMount = renderer.domElement.parentElement || document.body;
    let clarity = null;

    // ---- Scene root ---------------------------------------------------------
    const group = new THREE.Group();
    scene.add(group);
    const disposables = []; // geometries/materials we own
    const track = (x) => {
      disposables.push(x);
      return x;
    };

    // ---- Shadowed stage floor ----------------------------------------------
    const floorGeo = track(new THREE.CircleGeometry(16, 48));
    const floorMat = track(
      new THREE.MeshStandardMaterial({
        color: PALETTE.stage,
        roughness: 0.95,
        metalness: 0.05,
      }),
    );
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.55;
    floor.receiveShadow = true;
    group.add(floor);

    // ---- Conveyor belt (rounded, PBR) --------------------------------------
    const beltGeo = track(new RoundedBoxGeometry(14, 0.5, 3.4, 4, 0.18));
    const beltMat = track(
      new THREE.MeshStandardMaterial({
        color: PALETTE.belt,
        roughness: 0.8,
        metalness: 0.15,
      }),
    );
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = -0.25;
    belt.castShadow = true;
    belt.receiveShadow = true;
    group.add(belt);

    // Emissive guide rails (bloom).
    const railGeo = track(new RoundedBoxGeometry(14, 0.16, 0.22, 3, 0.07));
    const railMat = track(
      new THREE.MeshStandardMaterial({
        color: PALETTE.beltGlow,
        roughness: 0.4,
        metalness: 0.3,
        emissive: new THREE.Color(PALETTE.beltGlow),
        emissiveIntensity: 0.85,
      }),
    );
    [-1.75, 1.75].forEach((z) => {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(0, 0.06, z);
      rail.castShadow = true;
      group.add(rail);
    });

    // Rolling rollers under the belt (visual juice).
    const rollers = [];
    const rollerGeo = track(new THREE.CylinderGeometry(0.22, 0.22, 3.2, 14));
    const rollerMat = track(
      new THREE.MeshStandardMaterial({
        color: PALETTE.steel,
        roughness: 0.45,
        metalness: 0.6,
      }),
    );
    for (let i = 0; i < 7; i++) {
      const rl = new THREE.Mesh(rollerGeo, rollerMat);
      rl.rotation.x = Math.PI / 2;
      rl.position.set(-6 + i * 2, -0.1, 0);
      rl.castShadow = true;
      group.add(rl);
      rollers.push(rl);
    }

    // ---- The answer dial: a glowing crate the operator scales --------------
    const dialGeo = track(new RoundedBoxGeometry(1.2, 1.2, 1.2, 5, 0.22));
    const dialMat = track(
      new THREE.MeshStandardMaterial({
        color: PALETTE.dial,
        roughness: 0.35,
        metalness: 0.2,
        emissive: new THREE.Color(PALETTE.dial),
        emissiveIntensity: 0.5,
      }),
    );
    const dial = new THREE.Mesh(dialGeo, dialMat);
    dial.position.set(0, 1.6, 0);
    dial.castShadow = true;
    group.add(dial);

    // ---- Floating problem card + answer readout ----------------------------
    const cardLabel = makeLabel("", { scale: 1.1, fontSize: 76 });
    cardLabel.position.set(0, 4.2, 0);
    group.add(cardLabel);

    const readoutLabel = makeLabel("", {
      scale: 0.95,
      fontSize: 72,
      background: "rgba(15,34,56,0.92)",
      color: "#ffe6a8",
    });
    readoutLabel.position.set(0, 2.9, 0);
    group.add(readoutLabel);

    // ---- Visual crate grouping (spawned per round) -------------------------
    const crateGeo = track(new RoundedBoxGeometry(0.62, 0.62, 0.62, 4, 0.12));
    const crateGroup = new THREE.Group();
    group.add(crateGroup);
    const crateMats = []; // per-round materials to dispose

    function clearCrates() {
      while (crateGroup.children.length) {
        crateGroup.children.pop();
      }
      crateMats.forEach((m) => m.dispose());
      crateMats.length = 0;
    }

    // Lay out `total` crates split into `groups` bundles, centered on the belt.
    function layoutCrates(total, groups, colorIdx) {
      clearCrates();
      total = Math.min(total, 24);
      if (total <= 0) return;
      groups = Math.max(1, groups);
      const color = PALETTE.crate[colorIdx % PALETTE.crate.length];
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        metalness: 0.1,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.18,
        transparent: true,
      });
      crateMats.push(mat);
      const perGroup = Math.max(1, Math.round(total / groups));
      const cw = 0.72;
      const gap = 0.7;
      const rowWidth = perGroup * cw;
      const totalWidth = groups * rowWidth + (groups - 1) * gap;
      let x = -totalWidth / 2;
      let placed = 0;
      for (let g = 0; g < groups && placed < total; g++) {
        for (let k = 0; k < perGroup && placed < total; k++) {
          const c = new THREE.Mesh(crateGeo, mat);
          const px = x + k * cw + cw / 2;
          c.position.set(px, -0.05, 0);
          c.castShadow = true;
          crateGroup.add(c);
          // scale-pop spawn
          c.scale.setScalar(reduced ? 1 : 0.01);
          if (!reduced) {
            const delay = placed * 22;
            later(() => {
              feel.tween({
                from: 0.01,
                to: 1,
                duration: 0.28,
                onUpdate: (v) => c.scale.setScalar(v),
              });
            }, delay);
          }
          placed++;
        }
        x += rowWidth + gap;
      }
    }

    // ---- Round state --------------------------------------------------------
    let roundIndex = 0;
    let round = null;
    let spec = null;
    let value = 1;
    let locked = true; // input gate
    let streak = 0;
    let bestStreak = 0;
    let solvedCount = 0;
    // Forgiving stakes: a pool of attempts; a wrong confirm costs one. Run out
    // and the shift ends (lose screen). Level 1 gets more cushion than Level 2.
    const START_LIVES = level === 2 ? 4 : 6;
    let lives = START_LIVES;
    let gameOver = false;
    let unbindFrame = null;
    let unbindPress = null;
    let unbindTap = null;
    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    function setLevelLabel() {
      hud.setLevel(level === 2 ? "Level 2" : "Level 1");
    }

    function hintFor(r) {
      switch (r.kind) {
        case "gcf":
          return "GCF: the biggest number that goes into both.";
        case "lcm":
          return "LCM: the first number both go into.";
        case "decimal-sum":
          return (
            "Line up the dots. Then " + (r.op === "+" ? "add." : "subtract.")
          );
        default:
          return "Up/Down sets the dial. Space ships it.";
      }
    }

    // Short "current target" chip text for the clarity mini-HUD.
    function targetChip(r) {
      switch (r.kind) {
        case "gcf":
          return `GCF of ${r.a} and ${r.b}`;
        case "lcm":
          return `LCM of ${r.a} and ${r.b}`;
        case "decimal-sum":
        case "decimal-prod":
          return `${fmt(r.a)} ${r.op} ${fmt(r.b)} = ?`;
        case "distributive":
          return `GCF of ${r.a} and ${r.b}`;
        default:
          return null;
      }
    }

    // The equation the operator is currently building.
    function equationText() {
      switch (round.kind) {
        case "gcf":
          return `GCF(${round.a}, ${round.b}) = ${value}`;
        case "lcm":
          return `LCM(${round.a}, ${round.b}) = ${value}`;
        case "decimal-sum":
        case "decimal-prod":
          return `${fmt(round.a)} ${round.op} ${fmt(round.b)} = ${fmt(value)}`;
        case "distributive": {
          const g = value;
          if (g > 0 && round.a % g === 0 && round.b % g === 0)
            return `${round.a} + ${round.b} = ${g}(${round.a / g} + ${round.b / g})`;
          return `${round.a} + ${round.b} = ${g}( ? + ? )`;
        }
        default:
          return "";
      }
    }

    function readoutText() {
      const v =
        round.kind === "decimal-sum" || round.kind === "decimal-prod"
          ? fmt(value)
          : String(value);
      return `Dial: ${v}`;
    }

    function refresh() {
      updateLabel(cardLabel, equationText());
      updateLabel(readoutLabel, readoutText());

      if (round.kind === "gcf") {
        const divides = value > 0 && round.a % value === 0;
        layoutCrates(round.a, divides ? round.a / value : round.a, 0);
      } else if (round.kind === "lcm") {
        layoutCrates(
          Math.min(value, 24),
          Math.max(1, Math.round(value / round.a) || 1),
          1,
        );
      } else if (round.kind === "distributive") {
        const g = value;
        if (g > 0 && round.a % g === 0 && round.b % g === 0)
          layoutCrates(round.a + round.b, g, 2);
        else clearCrates();
      } else {
        clearCrates();
      }
    }

    function startRound() {
      locked = true;
      clearCrates();
      round = cfg.rounds[roundIndex];
      spec = roundSpec(round);
      value = spec.min;

      setLevelLabel();
      hud.setProgress(roundIndex, cfg.rounds.length);
      announce(
        `Order ${roundIndex + 1} of ${cfg.rounds.length}. ${round.prompt}`,
      );
      caption(round.prompt);
      hud.setObjective(round.prompt);
      if (clarity) {
        clarity.setObjective(round.prompt);
        clarity.setTarget(targetChip(round));
      }

      if (cfg.hints)
        hud.message(hintFor(round), { tone: "info", duration: 3400 });

      // Pop the dial in.
      if (!reduced) {
        dial.scale.setScalar(0.01);
        feel.tween({
          from: 0.01,
          to: 1,
          duration: 0.4,
          onUpdate: (v) => dial.scale.setScalar(v),
          onComplete: () => {
            locked = false;
          },
        });
      } else {
        dial.scale.setScalar(1);
        locked = false;
      }
      refresh();
      feel.sfx("select");
    }

    function adjust(dir, coarse) {
      if (locked) return;
      // Two-tier stepping so big targets are reachable fast:
      //   fine  (Up/Down)  = one dial step (1 for whole numbers, 0.05/0.1 for decimals)
      //   coarse(Left/Right) = a big jump (10 for whole numbers, 1.0 for decimals)
      // Without this, decimal answers like 5.75 took 100+ key presses.
      const coarseStep = spec.step >= 1 ? 10 : 1;
      const amt = coarse ? coarseStep : spec.step;
      const next = round2(value + dir * amt);
      const clamped = Math.max(spec.min, Math.min(spec.max, next));
      if (clamped === value) return;
      value = clamped;
      refresh();
      feel.sfx(dir > 0 ? "add" : "remove");
      announce(`Dial set to ${readoutText().replace("Dial: ", "")}.`);
    }

    function isCorrect() {
      if (round.kind === "distributive")
        return (
          value === spec.answer &&
          round.a % value === 0 &&
          round.b % value === 0
        );
      return round2(value) === round2(spec.answer);
    }

    function confirm() {
      if (locked || gameOver) return;
      if (!isCorrect()) {
        streak = 0;
        hud.setStreak(0);
        feel.sfx("wrong");
        if (!reduced) feel.shake(0.16);
        lives = Math.max(0, lives - 1);
        if (typeof hud.setLives === "function") hud.setLives(lives);
        if (lives <= 0) {
          loseGame();
          return;
        }
        const base =
          round.kind === "distributive" &&
          value > 0 &&
          round.a % value === 0 &&
          round.b % value === 0
            ? "Close! Find a bigger factor that fits both."
            : "Not yet. Move the dial and try again.";
        const tip = `${base} ${lives} ${lives === 1 ? "try" : "tries"} left.`;
        hud.feedback(false, tip);
        announce(tip);
        return;
      }
      win();
    }

    function loseGame() {
      gameOver = true;
      locked = true;
      feel.sfx("wrong");
      const msg = `Out of tries! You packed ${solvedCount} of ${cfg.rounds.length}.`;
      hud.setObjective(msg);
      announce(`Shift over. ${msg} Press Play Again to retry.`);
      if (clarity) {
        if (clarity.setTarget) clarity.setTarget(null);
        clarity.lose({
          titleEn: "Out of tries!",
          badge: "📦",
          stats: `${msg} Tip: list the factors of each number and pick the one that fits.`,
        });
      }
    }

    function win() {
      locked = true;
      solvedCount += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      hud.setStreak(streak);

      const pts = 20 + (level === 2 ? 10 : 0);
      onScore(pts, {
        round: roundIndex + 1,
        kind: round.kind,
        answer: spec.answer,
      });

      feel.sfx("correct");
      feel.burst(
        { x: 0, y: 1.6, z: 0 },
        { color: PALETTE.ok, count: 40, spread: 4.2 },
      );
      if (!reduced) feel.shake(0.28);

      const msg = `Correct! ${equationText()}  +${pts}`;
      hud.feedback(true, msg);
      announce(`Correct! ${equationText()}. +${pts} points.`);

      // Ship the crates off down the belt.
      if (!reduced) {
        feel.tween({
          from: 0,
          to: 1,
          duration: 0.7,
          onUpdate: (p) => {
            crateGroup.position.x = p * 9;
            crateGroup.children.forEach((c) => (c.material.opacity = 1 - p));
          },
        });
      }

      later(
        () => {
          crateGroup.position.x = 0;
          if (roundIndex < cfg.rounds.length - 1) {
            roundIndex += 1;
            startRound();
          } else {
            finish();
          }
        },
        reduced ? 1200 : 1700,
      );
    }

    function finish() {
      clearCrates();
      updateLabel(cardLabel, "SHIFT COMPLETE");
      updateLabel(readoutLabel, `${solvedCount}/${cfg.rounds.length} shipped`);
      hud.setProgress(cfg.rounds.length, cfg.rounds.length);
      hud.setObjective(
        `Done! You packed ${solvedCount} of ${cfg.rounds.length}. Best streak: ${bestStreak}.`,
      );
      hud.message("All orders packed! 🏭", { tone: "ok", duration: 0 });
      feel.sfx("fanfare");
      feel.burst(
        { x: 0, y: 1.8, z: 0 },
        { color: PALETTE.dial, count: 70, spread: 6 },
      );
      announce(
        `Done. You packed ${solvedCount} orders. Best streak ${bestStreak}.`,
      );
      if (clarity) {
        clarity.setTarget(null);
        clarity.win({
          titleEn: "Shift complete!",
          badge: "🏭",
          stats: `You packed all ${cfg.rounds.length} orders. Best streak: ${bestStreak}. Score saved.`,
        });
      }
    }

    return {
      start() {
        // Animated camera intro: sweep into framing.
        const target = new THREE.Vector3(0, 0.8, 0);
        const finalPos = { x: 0, y: 6, z: 11 };
        if (!reduced) {
          camera.position.set(-7, 9, 14);
          camera.lookAt(target);
          feel.tween({
            from: 0,
            to: 1,
            duration: 1.1,
            onUpdate: (p) => {
              camera.position.set(
                -7 + (finalPos.x + 7) * p,
                9 + (finalPos.y - 9) * p,
                14 + (finalPos.z - 14) * p,
              );
              camera.lookAt(target);
            },
            onComplete: () => feel.syncCamera(),
          });
        } else {
          camera.position.set(finalPos.x, finalPos.y, finalPos.z);
          camera.lookAt(target);
          feel.syncCamera();
        }

        // Idle motion (gated behind reduced-motion). Safe to run behind the
        // start overlay; it touches only decorative meshes.
        if (!reduced) {
          unbindFrame = onFrame((dt, t) => {
            for (const r of rollers) r.rotation.y = t * 1.6;
            dial.rotation.y = t * 0.6;
            dial.position.y = 1.6 + Math.sin(t * 2) * 0.06;
            cardLabel.position.y = 4.1 + Math.sin(t * 1.6) * 0.07;
          });
        }

        // Begin the actual round loop + bind input only after the student
        // presses Start in the clarity overlay. Single entry point for first
        // play and for Play Again.
        function beginGameplay() {
          roundIndex = 0;
          lives = START_LIVES;
          gameOver = false;
          if (typeof hud.setLives === "function") hud.setLives(lives);
          startRound();

          unbindPress = input.onPress((name) => {
            if (name === "up")
              adjust(1, false); // fine +
            else if (name === "down")
              adjust(-1, false); // fine −
            else if (name === "right")
              adjust(1, true); // coarse + (big jump)
            else if (name === "left")
              adjust(-1, true); // coarse − (big jump)
            else if (name === "action" || name === "confirm") confirm();
          });

          // Touch: tap the dial/upper area raises, lower area lowers; tap the
          // floating answer card confirms.
          unbindTap = input.onTap(() => {
            if (locked) return;
            const hits = input.raycast(camera, [cardLabel, dial], false);
            if (hits.length && hits[0].object === cardLabel) {
              confirm();
              return;
            }
            const ndcY = input.state.ndc ? input.state.ndc.y : 0;
            adjust(ndcY >= 0 ? 1 : -1);
          });
        }

        // Clarity / onboarding kit: start overlay, how-to-play, persistent help
        // button, mini-HUD, and win screen.
        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "Factory Line — Package the Order",
          objectiveEn:
            "Read each order, set the dial to the right number (GCF, LCM, or a decimal answer), then ship it.",
          objectiveEs:
            "Lee cada orden, ajusta el dial al número correcto (MCD, mcm o un decimal) y envíalo.",
          standard: "6.NS.B.2–4 · GCF, LCM, Distributive & Decimal Operations",
          controls: [
            {
              key: "↑ / → (or W / D)",
              actionEn: "Raise the dial (the answer goes up)",
              actionEs: "Sube el dial (la respuesta aumenta)",
            },
            {
              key: "↓ / ← (or S / A)",
              actionEn: "Lower the dial (the answer goes down)",
              actionEs: "Baja el dial (la respuesta disminuye)",
            },
            {
              key: "Space / Enter",
              actionEn: "Ship the order — check if your dial answer is correct",
              actionEs: "Envía la orden — revisa si tu respuesta es correcta",
            },
            {
              key: "Tap upper / lower",
              actionEn: "Tap the top half to raise, the bottom half to lower",
              actionEs: "Toca arriba para subir, abajo para bajar",
            },
            {
              key: "Tap the problem card",
              actionEn: "Ship the order (same as Space)",
              actionEs: "Envía la orden (igual que Espacio)",
            },
            {
              key: "?",
              actionEn: "Open this help panel any time (Esc closes it)",
              actionEs: "Abre esta ayuda cuando quieras (Esc la cierra)",
            },
          ],
          howToWinEn:
            "Set the dial to the correct answer for each order and ship it. Pack all the orders to finish your shift — build your streak for bonus points!",
          howToWinEs:
            "Pon el dial en la respuesta correcta y envía. Completa todas las órdenes para terminar.",
          onStart: beginGameplay,
          onPlayAgain: () => location.reload(),
        });
      },

      dispose() {
        if (clarity) clarity.dispose();
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        clearCrates();
        scene.remove(group);
        // Dispose label textures.
        [cardLabel, readoutLabel].forEach((s) => {
          if (s.material) {
            if (s.material.map) s.material.map.dispose();
            s.material.dispose();
          }
        });
        disposables.forEach((d) => d.dispose && d.dispose());
      },
    };
  },
};
