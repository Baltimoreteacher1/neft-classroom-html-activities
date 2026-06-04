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
        prompt:
          "Rewrite 36 + 8 with the distributive property. Build the GCF you pull out (the count of crates in the bay).",
      },
      {
        kind: "distributive",
        a: 18,
        b: 30,
        prompt:
          "Rewrite 18 + 30 with the distributive property. Build the GCF you pull out (the count of crates in the bay).",
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
      // LCM answers (12, 15, 24…) are too large to build crate-by-crate, so
      // these rounds use the SLIDE DIAL like the decimal rounds. `step: 1`
      // keeps it integer; `useDial` routes it to the dial manipulative.
      return {
        answer: lcm(r.a, r.b),
        min: 1,
        max: r.a * r.b,
        step: 1,
        useDial: true,
      };
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
    // HUD "Your task" panel already shows the full problem/equation text. This
    // high-floating 3D card (and the live dial readout below) projected over the
    // top HUD and made the directions illegible, so both are kept in the scene
    // graph (for tap-to-ship + dispose) but never rendered.
    cardLabel.visible = false;
    group.add(cardLabel);

    const readoutLabel = makeLabel("", {
      scale: 0.95,
      fontSize: 72,
      background: "rgba(15,34,56,0.92)",
      color: "#ffe6a8",
    });
    readoutLabel.position.set(0, 2.9, 0);
    readoutLabel.visible = false;
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
    const dragUnbinders = []; // pointerup + per-frame drag updater
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
          // Only reveal the rewritten form once the GCF is correct. Until then
          // show a STABLE goal so the card doesn't flicker "?( ? + ? )".
          const g = value;
          if (g === spec.answer && round.a % g === 0 && round.b % g === 0)
            return `${round.a} + ${round.b} = ${g} × (${round.a / g} + ${round.b / g})`;
          return `${round.a} + ${round.b} = ☐ × (☐ + ☐)`;
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
      clearBayCrates();
      round = cfg.rounds[roundIndex];
      spec = roundSpec(round);
      value = spec.min;

      // Crate rounds (GCF / distributive — small answers) → drag crates into
      // the bay. Dial rounds (decimals + LCM — large answers) → slide the dial.
      // Show only the relevant manipulables.
      const useCrates = spec.step >= 1 && !spec.useDial;
      supplyCrate.visible = useCrates;
      supplyLabel.visible = useCrates;
      bay.visible = useCrates;
      dial.visible = !useCrates;
      dial.position.set(0, 1.6, 0);
      // Seed bay crates to match the starting value (spec.min) for crate rounds.
      if (useCrates) syncBayCrates();

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
      // Keep the bay crate count in sync only for crate rounds (GCF /
      // distributive). Dial rounds (LCM / decimals) hide the bay.
      if (spec.step >= 1 && !spec.useDial) syncBayCrates();
      feel.sfx(dir > 0 ? "add" : "remove");
      announce(`Dial set to ${readoutText().replace("Dial: ", "")}.`);
    }

    // ---- Drag-to-build: physically construct the answer --------------------
    // Genuine 3D manipulation (like unit-5/unit-10) instead of dial-and-confirm.
    //   Whole-number rounds (GCF / LCM / distributive): the student DRAGS unit
    //     crates from the supply pallet into the glowing loading bay. The number
    //     of crates in the bay IS `value`. Dragging a crate back to the pallet
    //     lowers it. The math (`value`, `spec`, `confirm`) is unchanged.
    //   Decimal rounds: the student physically SLIDES the glowing dial block up
    //     and down its track to set `value` (no fine-grained crate-dragging).
    // Keyboard up/down/left/right still adjust `value` as a fallback for all.

    // Invisible ground plane for pointer→world raycasting while dragging.
    const dragPlaneGeo = track(new THREE.PlaneGeometry(80, 80));
    const dragPlaneMat = track(new THREE.MeshBasicMaterial({ visible: false }));
    const dragPlane = new THREE.Mesh(dragPlaneGeo, dragPlaneMat);
    dragPlane.rotation.x = -Math.PI / 2;
    dragPlane.position.y = 0.4;
    group.add(dragPlane);

    // Vertical pick plane (faces camera-ish) for the decimal dial slide.
    const slidePlaneGeo = track(new THREE.PlaneGeometry(40, 40));
    const slidePlaneMat = track(
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    const slidePlane = new THREE.Mesh(slidePlaneGeo, slidePlaneMat);
    slidePlane.position.set(0, 1.6, 0);
    group.add(slidePlane);

    // Supply pallet: a small stack the student grabs crates from (whole rounds).
    const palletX = -5.2;
    const supplyGeo = track(new RoundedBoxGeometry(0.62, 0.62, 0.62, 4, 0.12));
    const supplyMat = track(
      new THREE.MeshStandardMaterial({
        color: PALETTE.crate[1],
        roughness: 0.5,
        metalness: 0.12,
        emissive: new THREE.Color(PALETTE.crate[1]),
        emissiveIntensity: 0.25,
      }),
    );
    const supplyCrate = new THREE.Mesh(supplyGeo, supplyMat);
    supplyCrate.position.set(palletX, 0.3, 1.4);
    supplyCrate.castShadow = true;
    supplyCrate.userData.role = "supply";
    group.add(supplyCrate);
    const supplyLabel = makeLabel("Drag a crate →", {
      scale: 0.8,
      fontSize: 52,
      background: "rgba(15,34,56,0.92)",
    });
    supplyLabel.position.set(palletX, 1.3, 1.4);
    group.add(supplyLabel);

    // Glowing loading bay: drop zone where built crates land. Bay count = value.
    const bayCenter = { x: 0, z: 1.4 };
    const bayMat = track(
      new THREE.MeshBasicMaterial({
        color: PALETTE.ok,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
      }),
    );
    const bayGeo = track(new THREE.RingGeometry(2.0, 3.4, 40));
    const bay = new THREE.Mesh(bayGeo, bayMat);
    bay.rotation.x = -Math.PI / 2;
    bay.position.set(bayCenter.x, 0.02, bayCenter.z);
    group.add(bay);
    const BAY_RADIUS = 3.4;

    // Crates the student has loaded into the bay (whole-number rounds).
    const bayCrates = [];
    const bayCrateMats = [];
    function clearBayCrates() {
      bayCrates.forEach((c) => {
        crateGroup.remove(c);
        group.remove(c);
      });
      bayCrates.length = 0;
      bayCrateMats.forEach((m) => m.dispose());
      bayCrateMats.length = 0;
    }
    function layoutBayCrate(mesh, idx) {
      const perRow = 5;
      const col = idx % perRow;
      const row = Math.floor(idx / perRow);
      mesh.position.set(
        bayCenter.x - 1.4 + col * 0.72,
        0.3 + row * 0.0,
        bayCenter.z - 0.7 + row * 0.7,
      );
    }
    function spawnBayCrate() {
      const color = PALETTE.crate[bayCrates.length % PALETTE.crate.length];
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.12,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.2,
      });
      bayCrateMats.push(mat);
      const c = new THREE.Mesh(crateGeo, mat);
      c.castShadow = true;
      c.userData.role = "bay";
      layoutBayCrate(c, bayCrates.length);
      group.add(c);
      bayCrates.push(c);
      if (!reduced) {
        c.scale.setScalar(0.01);
        feel.tween({
          from: 0.01,
          to: 1,
          duration: 0.24,
          onUpdate: (v) => c.scale.setScalar(v),
        });
      }
      return c;
    }
    function removeBayCrate() {
      const c = bayCrates.pop();
      if (!c) return;
      group.remove(c);
      const m = bayCrateMats.pop();
      if (m) m.dispose();
    }
    // Sync the visible bay crates to a target count (used after value changes).
    function syncBayCrates() {
      const target = Math.round(value);
      while (bayCrates.length < target && bayCrates.length < 60)
        spawnBayCrate();
      while (bayCrates.length > target) removeBayCrate();
    }

    function planePoint(plane) {
      const hits = input.raycast(camera, [plane], false);
      return hits.length ? hits[0].point : null;
    }
    function overBay(p) {
      if (!p) return false;
      return Math.hypot(p.x - bayCenter.x, p.z - bayCenter.z) <= BAY_RADIUS;
    }

    // Set value directly (clamped to spec), refresh visuals + audio.
    function setValue(v, silent) {
      const clamped = round2(Math.max(spec.min, Math.min(spec.max, v)));
      if (clamped === value) return false;
      const up = clamped > value;
      value = clamped;
      refresh();
      if (!silent) {
        feel.sfx(up ? "add" : "remove");
        announce(`Dial set to ${readoutText().replace("Dial: ", "")}.`);
      }
      return true;
    }

    // --- drag state ---
    const drag = {
      active: false,
      mode: null, // "load" (whole) | "slide" (decimal)
      ghost: null,
    };

    function beginCrateDrag() {
      if (locked || gameOver) return;
      drag.active = true;
      drag.mode = "load";
      // A carried ghost crate that follows the pointer.
      const color = PALETTE.crate[bayCrates.length % PALETTE.crate.length];
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.12,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.6,
      });
      bayCrateMats.push(mat); // disposed on clear
      const g = new THREE.Mesh(crateGeo, mat);
      g.castShadow = true;
      group.add(g);
      drag.ghost = g;
      feel.sfx("select");
      announce("Picked up a crate. Drag it into the glowing bay.");
    }

    function beginDialSlide() {
      if (locked || gameOver) return;
      drag.active = true;
      drag.mode = "slide";
      if (!reduced) dial.scale.setScalar(1.15);
      feel.sfx("select");
      announce("Sliding the dial. Move up to raise, down to lower.");
    }

    function updateDrag() {
      if (!drag.active) return;
      if (drag.mode === "load" && drag.ghost) {
        const p = planePoint(dragPlane);
        if (p) {
          drag.ghost.position.set(p.x, 0.7, p.z);
          bay.material.opacity = overBay(p) ? 0.5 : 0.18;
        }
      } else if (drag.mode === "slide") {
        // Map pointer height on the slide plane to the value range.
        const p = planePoint(slidePlane);
        if (p) {
          const lo = 0.3,
            hi = 3.4; // world-y travel of the dial
          const t = Math.max(0, Math.min(1, (p.y - lo) / (hi - lo)));
          const v = spec.min + t * (spec.max - spec.min);
          // Snap to the round's step.
          const snapped = Math.round(v / spec.step) * spec.step;
          if (setValue(snapped, false)) {
            dial.position.y = 1.0 + t * 1.6;
          }
        }
      }
    }

    function endDrag() {
      if (!drag.active) {
        bay.material.opacity = 0.18;
        return;
      }
      if (drag.mode === "load") {
        const p = planePoint(dragPlane);
        const dropped = overBay(p);
        if (drag.ghost) {
          group.remove(drag.ghost);
          // its material stays in bayCrateMats for disposal
          drag.ghost = null;
        }
        bay.material.opacity = 0.18;
        if (dropped) {
          // Build: one more crate = +1 to the answer.
          if (setValue(value + 1, true)) {
            spawnBayCrate();
            feel.sfx("add");
            feel.burst(
              { x: bayCenter.x, y: 1.0, z: bayCenter.z },
              { color: PALETTE.ok, count: 12 },
            );
            announce(`Loaded crate ${Math.round(value)} into the bay.`);
          } else {
            feel.sfx("wrong");
          }
        } else {
          feel.sfx("remove");
        }
      } else if (drag.mode === "slide") {
        if (!reduced) dial.scale.setScalar(1);
      }
      drag.active = false;
      drag.mode = null;
    }

    function isCorrect() {
      if (round.kind === "distributive")
        return (
          value === spec.answer &&
          round.a % value === 0 &&
          round.b % value === 0
        );
      // Decimal rounds: a slide can land one step shy of the exact answer
      // (e.g. 5.65 vs 5.70). Accept anything within half a dial step so a
      // near-miss on the dial isn't wrongly failed. Whole-number / LCM rounds
      // (step ≥ 1) stay an exact match.
      const decimal =
        round.kind === "decimal-sum" || round.kind === "decimal-prod";
      if (decimal) {
        const tol = spec.step / 2;
        return Math.abs(round2(value) - round2(spec.answer)) <= tol + 1e-9;
      }
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
      // Snap to the exact answer so the win readout shows the true value
      // (e.g. 5.7), not a dialed value accepted within tolerance (e.g. 5.65).
      value = round2(spec.answer);
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

      const msg = `Correct! ${equationText()} +${pts}`;
      hud.feedback(true, msg);
      announce(`Correct! ${equationText()}. +${pts} points.`);

      // Ship the crates off down the belt — both the diagram crates and the
      // crates the student loaded into the bay.
      if (!reduced) {
        const bayHomes = bayCrates.map((c) => c.position.x);
        feel.tween({
          from: 0,
          to: 1,
          duration: 0.7,
          onUpdate: (p) => {
            crateGroup.position.x = p * 9;
            crateGroup.children.forEach((c) => (c.material.opacity = 1 - p));
            bayCrates.forEach((c, i) => {
              c.position.x = bayHomes[i] + p * 9;
            });
          },
        });
      }

      later(
        () => {
          crateGroup.position.x = 0;
          clearBayCrates();
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
            // Don't bob the dial while the student is sliding it.
            if (!(drag.active && drag.mode === "slide")) {
              dial.rotation.y = t * 0.6;
              if (dial.visible) dial.position.y = 1.6 + Math.sin(t * 2) * 0.06;
            }
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

          // Pointer down: grab a supply crate (whole rounds) or the dial
          // (decimal rounds) to start a DRAG. The floating answer card is now
          // hidden (it overlapped the HUD), so it is filtered out of the
          // raycast; Space/Enter and a bay/empty-area tap still ship the order.
          unbindTap = input.onTap(() => {
            if (locked || gameOver) return;
            const targets = [cardLabel, supplyCrate, dial].filter(
              (o) => o.visible !== false,
            );
            const hits = input.raycast(camera, targets, false);
            if (hits.length) {
              const obj = hits[0].object;
              if (obj === cardLabel) {
                confirm();
                return;
              }
              if (obj === supplyCrate) {
                beginCrateDrag();
                return;
              }
              if (obj === dial) {
                beginDialSlide();
                return;
              }
            }
          });

          // Pointer up ends an active drag (input.js fires pointerup on window
          // but exposes no callback, so attach our own tracked listener).
          const onUp = () => {
            if (drag.active) endDrag();
          };
          window.addEventListener("pointerup", onUp);
          dragUnbinders.push(() =>
            window.removeEventListener("pointerup", onUp),
          );

          // Drive the held piece every frame (covers reduced-motion, where the
          // idle frame loop is not bound).
          dragUnbinders.push(
            onFrame(() => {
              if (drag.active) updateDrag();
            }),
          );
        }

        // Clarity / onboarding kit: start overlay, how-to-play, persistent help
        // button, mini-HUD, and win screen.
        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "Factory Line — Package the Order",
          objectiveEn:
            "Build each order's answer: drag crates into the loading bay until the count is right (GCF, LCM, factor), or slide the dial for decimals — then ship it.",
          objectiveEs:
            "Construye la respuesta: arrastra cajas a la bahía hasta tener el número correcto, o desliza el dial para decimales, y envía.",
          standard: "6.NS.B.2–4 · GCF, LCM, Distributive & Decimal Operations",
          controls: [
            {
              key: "Drag a crate",
              actionEn:
                "Whole-number rounds (GCF & distributive factor): drag crates from the pallet into the glowing bay — the number of crates is your answer",
              actionEs:
                "Rondas de números enteros (MCD y factor distributivo): arrastra cajas del palé a la bahía — el número de cajas es tu respuesta",
            },
            {
              key: "Slide the dial",
              actionEn:
                "Decimal & LCM rounds: slide the glowing dial up or down to set the answer (the bay is hidden on these rounds)",
              actionEs:
                "Rondas de decimales y MCM: desliza el dial para fijar la respuesta (la bahía se oculta en estas rondas)",
            },
            {
              key: "↑ ↓ / → ←",
              actionEn:
                "Fine / coarse adjust the answer with the keyboard (fallback)",
              actionEs: "Ajusta la respuesta con el teclado (alternativa)",
            },
            {
              key: "Space / Enter",
              actionEn: "Ship the order — check if your answer is correct",
              actionEs: "Envía la orden — revisa si tu respuesta es correcta",
            },
            {
              key: "Tap the bay",
              actionEn:
                "Ship the order (same as Space). Read the problem in the Your Task panel (top-left)",
              actionEs:
                "Envía la orden (igual que Espacio). Lee el problema en el panel Your Task (arriba a la izquierda)",
            },
            {
              key: "?",
              actionEn: "Open this help panel any time (Esc closes it)",
              actionEs: "Abre esta ayuda cuando quieras (Esc la cierra)",
            },
          ],
          howToWinEn:
            "Build the correct answer for each order — load the right number of crates into the bay, or slide the dial for decimals — then ship it. Pack all the orders to finish your shift!",
          howToWinEs:
            "Construye la respuesta correcta — carga las cajas o desliza el dial — y envía. Completa todas las órdenes para terminar.",
          onStart: beginGameplay,
          onPlayAgain: () => location.reload(),
        });
      },

      dispose() {
        if (clarity) clarity.dispose();
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        dragUnbinders.forEach((u) => u && u());
        dragUnbinders.length = 0;
        timers.forEach(clearTimeout);
        timers.length = 0;
        clearCrates();
        clearBayCrates();
        scene.remove(group);
        // Dispose label textures.
        [cardLabel, readoutLabel, supplyLabel].forEach((s) => {
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
