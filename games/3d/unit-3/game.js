import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";

// ============================================================================
// Unit 3 — RATIO RALLY  (CCSS 6.RP.A.3 / 6.RP.A.2)
// REAL-TIME LANE-RUNNER RACER. The car auto-drives forward; the world scrolls
// toward the camera for a true sense of speed. The player STEERS between 3 lanes
// in real time. Every few seconds an ANSWER GATE rushes in: 3 floating numbers,
// one of which is the correct answer to the current problem shown in the HUD
// "Your task" panel. Be in the right lane when you hit the gate to BOOST; wrong
// lane = crash, screen shake, lose a life, slow down. The math IS the gameplay.
//
// Math is reused verbatim from the existing cfg.problems answer banks so the
// curriculum stays exact; distractors are generated to be plausible but wrong.
// ============================================================================

const COLORS = {
  track: 0x14233f,
  trackEmissive: 0x1d3a66,
  rail: 0x2f6aa0,
  dash: 0xeaf4ff,
  car: 0x1fa6a2,
  carEnrich: 0xe09b4a,
  cabin: 0xdff1ff,
  finish: 0xf2c15b,
  amber: 0xf2c15b,
  spark: 0xffd56b,
  good: 0x4aa978,
  bad: 0xd9795d,
  gateGood: 0x2f8f63,
  gateBad: 0x35507a,
};

const LANE_W = 3.0;
const LANE_COUNT = 3;
const laneX = (i) => (i - (LANE_COUNT - 1) / 2) * LANE_W;

// World layout. The car sits near z = CAR_Z and never moves in z; the track and
// every gate/scenery object scroll toward +z (toward the camera) to fake speed.
const CAR_Z = 6; // car's fixed forward position
const SPAWN_Z = -70; // where gates/scenery appear far ahead
const DESPAWN_Z = 16; // past the camera → recycle
const GATE_HIT_Z = CAR_Z; // a gate "hits" when its z reaches the car

// ---- Math problem banks (6.RP.A.3) — answers reused verbatim ----------------
// Every numeric answer is exact (comments verify the arithmetic). Level 1 =
// scaffolded smaller numbers; Level 2 = enrichment (larger / multi-step).

function makeLevel(level) {
  if (level === 1) {
    return {
      hints: true,
      problems: [
        // 12 miles in 3 hours -> 12 ÷ 3 = 4 mph.
        {
          prompt: "12 miles in 3 hours. How many miles in 1 hour?",
          help: "For one hour, divide miles by hours: 12 ÷ 3 = ?",
          answer: 4,
          unit: "mph",
        },
        // $10 for 2 cars -> 10 ÷ 2 = $5 each.
        {
          prompt: "2 model cars cost $10. How much is 1 car?",
          help: "Price for one car = dollars ÷ cars: 10 ÷ 2 = ?",
          answer: 5,
          unit: "$",
        },
        // 4 miles each hour, 5 hours -> 4 × 5 = 20.
        {
          prompt: "A car drives 4 miles each hour. How far in 5 hours?",
          help: "Same speed each hour: 4 × 5 = ?",
          answer: 20,
          unit: "mi",
        },
        // 3 L per 2 laps, 6 laps -> 3 groups -> 3 × 3 = 9.
        {
          prompt: "3 liters of fuel every 2 laps. How much for 6 laps?",
          help: "6 laps is 3 groups of 2. So 3 × 3 = ?",
          answer: 9,
          unit: "L",
        },
        // 2 minutes -> 2 × 60 = 120 seconds.
        {
          prompt: "How many seconds are in 2 minutes?",
          help: "1 minute = 60 seconds. 2 × 60 = ?",
          answer: 120,
          unit: "s",
        },
        // Cheapest fuel: $6/3L=2.00, $8/5L=1.60 (best), $5/2L=2.50.
        {
          prompt: "Pick the cheapest fuel — lowest price per liter.",
          help: "Find each price per liter. Pick the smallest number.",
          answer: "$8 / 5L",
          choices: ["$6 / 3L", "$8 / 5L", "$5 / 2L"],
          unit: "",
        },
        // 8 miles in 4 hours -> 8 ÷ 4 = 2 mph.
        {
          prompt: "8 miles in 4 hours. How many miles in 1 hour?",
          help: "Divide miles by hours: 8 ÷ 4 = ?",
          answer: 2,
          unit: "mph",
        },
      ],
    };
  }
  // ---- Level 2: enrichment (larger / multi-step) ----------------------------
  return {
    hints: false,
    problems: [
      // 150 miles in 3 hours = 50 mph; × 4 = 200 miles.
      {
        prompt: "150 miles in 3 hours, steady speed. How far in 4 hours?",
        help: "Speed = 150 ÷ 3 = 50 mph. Then 50 × 4 = ?",
        answer: 200,
        unit: "mi",
      },
      // 20% of 40 = 8.
      {
        prompt: "What is 20% of 40 mph?",
        help: "20% = 0.20. 0.20 × 40 = ?",
        answer: 8,
        unit: "mph",
      },
      // 15% of 80 = 12.
      {
        prompt: "What is 15% of 80 liters?",
        help: "15% = 0.15. 0.15 × 80 = ?",
        answer: 12,
        unit: "L",
      },
      // 7 miles per 2 hours, 10 hours -> 5 groups -> 7 × 5 = 35.
      {
        prompt: "7 miles every 2 hours, steady pace. How far in 10 hours?",
        help: "10 hours is 5 groups of 2. So 7 × 5 = ?",
        answer: 35,
        unit: "mi",
      },
      // 3 min 30 s -> 3 × 60 + 30 = 210 s.
      {
        prompt: "How many seconds in 3 minutes and 30 seconds?",
        help: "3 × 60 = 180, then + 30 = ?",
        answer: 210,
        unit: "s",
      },
      // Cheapest fuel: $9/5L=1.80, $12/8L=1.50 (best), $7/4L=1.75.
      {
        prompt: "Pick the cheapest fuel — lowest price per liter.",
        help: "Find each price per liter. Pick the smallest number.",
        answer: "$12 / 8L",
        choices: ["$9 / 5L", "$12 / 8L", "$7 / 4L"],
        unit: "",
      },
      // 30% of 50 = 15.
      {
        prompt: "What is 30% of $50?",
        help: "30% = 0.30. 0.30 × 50 = ?",
        answer: 15,
        unit: "$",
      },
    ],
  };
}

// ---- Distractor generation --------------------------------------------------
// For a numeric problem, return [a,b] two distinct, plausible-but-wrong values
// (≠ the answer, ≠ each other, all ≥ 0). Strategies model common rate/percent
// mistakes: off-by-one, double, half, ±10%-ish, swapping the operation.
function numericDistractors(answer) {
  const cands = [];
  const push = (v) => {
    if (!Number.isFinite(v)) return;
    v = Math.round(v);
    if (v < 0) return;
    if (v === answer) return;
    if (cands.includes(v)) return;
    cands.push(v);
  };
  // Common misconception values, in rough order of plausibility.
  push(answer * 2); // multiplied instead of divided
  push(Math.round(answer / 2)); // divided instead of multiplied
  push(answer + 1);
  push(answer - 1);
  push(answer + (answer >= 20 ? 5 : 2));
  push(answer - (answer >= 20 ? 5 : 2));
  push(answer + 10);
  push(Math.round(answer * 1.5));
  push(answer + 2);
  push(answer - 3);
  // Guarantee we have at least two by padding upward.
  let pad = answer + 3;
  while (cands.length < 2) {
    push(pad);
    pad += 1;
  }
  // Pick two, lightly shuffled for variety.
  const a = cands[0];
  const b = cands.find((v) => v !== a);
  return [a, b];
}

// Build the three lane labels for a problem (one correct, two wrong) and report
// which lane index holds the correct answer. Lane order is shuffled each gate.
function buildGateChoices(problem) {
  let correct;
  let wrong;
  if (problem.choices) {
    // "Cheapest fuel" style: choices already given; correct = problem.answer.
    correct = problem.answer;
    wrong = problem.choices.filter((c) => c !== correct);
  } else {
    correct = String(problem.answer);
    wrong = numericDistractors(problem.answer).map(String);
  }
  const labels = [correct, wrong[0], wrong[1]];
  // Fisher–Yates shuffle the 3 entries, tracking where correct lands.
  for (let i = labels.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [labels[i], labels[j]] = [labels[j], labels[i]];
  }
  const correctLane = labels.indexOf(correct);
  return { labels, correctLane, correct };
}

export default {
  id: "unit-3-ratio-rally",
  vocab: [
    {
      term: "Rate",
      definition:
        "A comparison of two amounts with different units, like miles and hours.",
      emoji: "🏁",
    },
    {
      term: "Unit rate",
      definition:
        "A rate for exactly one of something, like miles in 1 hour. Divide to find it.",
      emoji: "⏱️",
    },
    {
      term: "Equivalent ratio",
      definition:
        "A ratio that names the same comparison, made by multiplying or dividing both numbers.",
      emoji: "🟰",
    },
    {
      term: "Percent",
      definition:
        "A part out of 100. 20% means 20 out of every 100, or 0.20 of the whole.",
      emoji: "％",
    },
    {
      term: "Conversion",
      definition:
        "Changing a measure to different units, like minutes to seconds, using a known relationship.",
      emoji: "🔁",
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
    } = ctx;

    const cfg = makeLevel(level);
    const reduced = feel.reducedMotion;
    const carColor = level === 2 ? COLORS.carEnrich : COLORS.car;

    const clarityMount = renderer.domElement.parentElement || document.body;
    let clarity = null;

    // ---- Scene root ---------------------------------------------------------
    const group = new THREE.Group();
    scene.add(group);

    const disposables = []; // geometries + materials we own
    const mk = (g, m) => {
      disposables.push(g, m);
      return new THREE.Mesh(g, m);
    };

    // ---- Tuning (Level 2 = faster, tighter gates, trickier feel) ------------
    const BASE_SPEED = level === 2 ? 22 : 17; // world units / sec scroll
    const MAX_SPEED = level === 2 ? 40 : 32;
    const GATE_GAP = level === 2 ? 30 : 36; // z-distance between gates
    const START_LIVES = level === 2 ? 3 : 4;

    // ---- Long scrolling road (a strip far longer than the view) -------------
    const ROAD_LEN = 200;
    const groundMat = new THREE.MeshStandardMaterial({
      color: COLORS.track,
      roughness: 0.92,
      metalness: 0.05,
      emissive: COLORS.trackEmissive,
      emissiveIntensity: 0.14,
    });
    const ground = mk(
      new THREE.BoxGeometry(LANE_COUNT * LANE_W + 3.0, 0.5, ROAD_LEN),
      groundMat,
    );
    ground.position.set(0, -0.25, -ROAD_LEN / 2 + CAR_Z);
    ground.receiveShadow = true;
    group.add(ground);

    // Glowing side rails (static; the sense of motion comes from the dashes).
    const railMat = new THREE.MeshStandardMaterial({
      color: COLORS.rail,
      roughness: 0.5,
      metalness: 0.3,
      emissive: COLORS.rail,
      emissiveIntensity: 0.6,
    });
    disposables.push(railMat);
    [-1, 1].forEach((s) => {
      const railGeo = new THREE.BoxGeometry(0.22, 0.4, ROAD_LEN);
      disposables.push(railGeo);
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(
        (s * (LANE_COUNT * LANE_W + 2.4)) / 2,
        0.2,
        -ROAD_LEN / 2 + CAR_Z,
      );
      rail.castShadow = true;
      group.add(rail);
    });

    // ---- Scrolling lane dashes (THE speed cue) ------------------------------
    // Two columns of dashes between the three lanes. They march toward the
    // camera every frame and wrap around — this is what sells "speed".
    const dashMat = new THREE.MeshStandardMaterial({
      color: COLORS.dash,
      emissive: COLORS.dash,
      emissiveIntensity: 0.7,
      roughness: 0.4,
    });
    disposables.push(dashMat);
    const dashGeo = new THREE.BoxGeometry(0.18, 0.06, 2.0);
    disposables.push(dashGeo);
    const DASH_SPAN = 100; // z-range the dashes tile over
    const DASH_STEP = 4.0;
    const dashes = [];
    [-1, 1].forEach((side) => {
      const x = side * (LANE_W / 2);
      for (let z = CAR_Z; z > CAR_Z - DASH_SPAN; z -= DASH_STEP) {
        const d = new THREE.Mesh(dashGeo, dashMat);
        d.position.set(x, 0.06, z);
        group.add(d);
        dashes.push(d);
      }
    });

    // ---- Scrolling roadside pylons (extra speed cue + scenery) --------------
    const pylonMat = new THREE.MeshStandardMaterial({
      color: COLORS.amber,
      emissive: COLORS.amber,
      emissiveIntensity: 0.45,
      roughness: 0.5,
    });
    disposables.push(pylonMat);
    const pylonGeo = new THREE.ConeGeometry(0.32, 1.1, 14);
    disposables.push(pylonGeo);
    const PYLON_SPAN = 110;
    const PYLON_STEP = 11;
    const pylons = [];
    [-1, 1].forEach((side) => {
      const x = (side * (LANE_COUNT * LANE_W + 2.4)) / 2 + 0.9;
      for (let z = CAR_Z; z > CAR_Z - PYLON_SPAN; z -= PYLON_STEP) {
        const p = new THREE.Mesh(pylonGeo, pylonMat);
        p.position.set(x, 0.55, z + (side > 0 ? PYLON_STEP / 2 : 0));
        p.castShadow = true;
        group.add(p);
        pylons.push(p);
      }
    });

    // ---- Hero car (RoundedBox PBR + emissive accents) -----------------------
    function buildCar(color) {
      const car = new THREE.Group();
      const bodyGeo = new RoundedBoxGeometry(1.5, 0.6, 2.5, 4, 0.2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        metalness: 0.55,
        emissive: color,
        emissiveIntensity: 0.2,
      });
      disposables.push(bodyGeo, bodyMat);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.55;
      body.castShadow = true;
      car.add(body);

      const cabGeo = new RoundedBoxGeometry(1.0, 0.46, 1.1, 4, 0.16);
      const cabMat = new THREE.MeshPhysicalMaterial({
        color: COLORS.cabin,
        roughness: 0.1,
        metalness: 0,
        transmission: 0.4,
        thickness: 0.5,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      });
      disposables.push(cabGeo, cabMat);
      const cabin = new THREE.Mesh(cabGeo, cabMat);
      cabin.position.set(0, 1.0, -0.15);
      cabin.castShadow = true;
      car.add(cabin);

      const glowGeo = new RoundedBoxGeometry(1.6, 0.1, 2.6, 2, 0.05);
      const glowMat = new THREE.MeshStandardMaterial({
        color: COLORS.spark,
        emissive: COLORS.spark,
        emissiveIntensity: 0.95,
        roughness: 0.4,
      });
      disposables.push(glowGeo, glowMat);
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.y = 0.2;
      car.add(glow);

      const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 16);
      const wheelMat = new THREE.MeshStandardMaterial({
        color: 0x14151a,
        roughness: 0.7,
        metalness: 0.3,
      });
      disposables.push(wheelGeo, wheelMat);
      const wheels = [];
      [
        [-0.82, 0.34, 0.86],
        [0.82, 0.34, 0.86],
        [-0.82, 0.34, -0.86],
        [0.82, 0.34, -0.86],
      ].forEach(([x, y, z]) => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(x, y, z);
        w.castShadow = true;
        car.add(w);
        wheels.push(w);
      });
      car.userData.wheels = wheels;
      return car;
    }

    const playerCar = buildCar(carColor);
    playerCar.position.set(0, 0, CAR_Z);
    group.add(playerCar);

    // ---- Hide the clarity kit's duplicate HUD pills (we use the engine HUD) --
    if (!document.getElementById("u3-hud-fix")) {
      const hf = document.createElement("style");
      hf.id = "u3-hud-fix";
      hf.textContent = ".ck-chip{display:none !important;}";
      document.head.appendChild(hf);
    }

    // ---- Gate pool (3 answer panels + number labels per gate) ---------------
    // One gate object is reused; we move it back to SPAWN_Z and relabel it for
    // each problem. Lane choice index that is correct is stored on the gate.
    function makePanel() {
      const panelGeo = new RoundedBoxGeometry(LANE_W - 0.4, 2.4, 0.3, 3, 0.12);
      disposables.push(panelGeo);
      const panelMat = new THREE.MeshStandardMaterial({
        color: COLORS.gateBad,
        roughness: 0.45,
        metalness: 0.25,
        emissive: COLORS.gateBad,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.92,
      });
      disposables.push(panelMat);
      const mesh = new THREE.Mesh(panelGeo, panelMat);
      mesh.position.y = 1.6;
      return { mesh, mat: panelMat };
    }

    const gate = new THREE.Group();
    gate.visible = false;
    group.add(gate);
    const gatePanels = [];
    const gateLabels = [];
    for (let i = 0; i < LANE_COUNT; i++) {
      const lane = new THREE.Group();
      lane.position.x = laneX(i);
      const panel = makePanel();
      lane.add(panel.mesh);
      const label = makeLabel("", {
        fontSize: 92,
        scale: 1.6,
        color: "#ffffff",
        background: "rgba(11,28,52,0.0)",
        border: null,
        THREE,
      });
      label.position.set(0, 1.6, 0.25);
      lane.add(label);
      gate.add(lane);
      gatePanels.push(panel);
      gateLabels.push(label);
    }
    // A thin "gate beam" the car must cross, for a clear hit moment.
    const beamMat = new THREE.MeshStandardMaterial({
      color: COLORS.amber,
      emissive: COLORS.amber,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.5,
    });
    disposables.push(beamMat);
    const beam = mk(
      new THREE.BoxGeometry(LANE_COUNT * LANE_W + 1.5, 0.06, 0.4),
      beamMat,
    );
    beam.position.y = 0.05;
    gate.add(beam);

    // ---- Finish line (revealed after the last gate is cleared) --------------
    const finishMat = new THREE.MeshStandardMaterial({
      color: COLORS.finish,
      emissive: COLORS.finish,
      emissiveIntensity: 0.85,
      roughness: 0.4,
    });
    const finish = mk(
      new THREE.BoxGeometry(LANE_COUNT * LANE_W + 3.0, 0.1, 1.0),
      finishMat,
    );
    finish.position.set(0, 0.06, SPAWN_Z);
    finish.visible = false;
    group.add(finish);

    function disposeSprite(spr) {
      if (!spr) return;
      if (spr.parent) spr.parent.remove(spr);
      if (spr.material.map) spr.material.map.dispose();
      spr.material.dispose();
    }

    // ---- Game state ---------------------------------------------------------
    let problemIndex = 0;
    const total = cfg.problems.length;
    let problem = null;

    let targetLane = 1; // lane the player is steering toward (0..2)
    let speed = BASE_SPEED;
    let boostT = 0; // remaining boost-glow time
    let flash = null; // { color, t } whole-screen color flash via fog-ish tint
    let streak = 0;
    let bestStreak = 0;
    let solvedCount = 0;
    let lives = START_LIVES;
    let running = false;
    let gameOver = false;

    // Gate scheduling
    let gateActive = false;
    let gateScored = false;
    let gateCorrectLane = 0;
    let nextGateDistance = GATE_GAP; // travel distance until next gate spawns
    let traveled = 0;
    let finishing = false;

    let unbindPress = null;
    let unbindFrame = null;
    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    // ---- HUD --------------------------------------------------------------
    function setTask() {
      if (!problem) return;
      const prefix = problem.choices ? "" : "Steer into: ";
      hud.setObjective(`${prefix}${problem.prompt}`);
      if (clarity && clarity.setTarget) {
        clarity.setTarget(
          problem.choices ? "Find the cheapest" : "Find the answer",
        );
      }
    }

    function loadProblem(i) {
      problem = cfg.problems[i];
      setTask();
      if (typeof hud.setProgress === "function") hud.setProgress(i, total);
      if (cfg.hints && problem.help) {
        hud.message(problem.help, { tone: "info", duration: 3200 });
      }
      announce(
        `Problem ${i + 1}. ${problem.prompt} Steer your car into the lane with the correct answer.`,
      );
    }

    // ---- Spawn an answer gate for the CURRENT problem -----------------------
    function spawnGate() {
      const { labels, correctLane } = buildGateChoices(problem);
      gateCorrectLane = correctLane;
      gate.children.forEach((lane, i) => {
        if (i >= LANE_COUNT) return; // skip the beam
        updateLabel(gateLabels[i], labels[i]);
        // Reset panels to neutral.
        gatePanels[i].mat.color.set(COLORS.gateBad);
        gatePanels[i].mat.emissive.set(COLORS.gateBad);
        gatePanels[i].mat.emissiveIntensity = 0.35;
      });
      gate.position.z = SPAWN_Z;
      gate.visible = true;
      gateActive = true;
      gateScored = false;
    }

    // ---- Resolve a gate when the car reaches it -----------------------------
    function resolveGate() {
      gateScored = true;
      const carLane = nearestLane(playerCar.position.x);
      const correct = carLane === gateCorrectLane;
      // Light the panels: green on the right answer, dim red on the chosen-wrong.
      gatePanels.forEach((p, i) => {
        if (i === gateCorrectLane) {
          p.mat.color.set(COLORS.gateGood);
          p.mat.emissive.set(COLORS.gateGood);
          p.mat.emissiveIntensity = 0.9;
        } else if (i === carLane && !correct) {
          p.mat.color.set(COLORS.bad);
          p.mat.emissive.set(COLORS.bad);
          p.mat.emissiveIntensity = 0.9;
        }
      });

      if (correct) {
        onCorrect();
      } else {
        onWrong();
      }
    }

    function onCorrect() {
      solvedCount += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      if (typeof hud.setStreak === "function") hud.setStreak(streak);

      const pts = 20 + (level === 2 ? 10 : 0) + Math.min(streak - 1, 5) * 5;
      onScore(pts, { round: problemIndex + 1 });

      // Speed BOOST that rises with the streak, capped.
      speed = Math.min(MAX_SPEED, speed + 6 + Math.min(streak, 4));
      boostT = 0.7;
      flash = { color: COLORS.good, t: 0.35 };

      feel.sfx("correct");
      feel.burst(
        { x: playerCar.position.x, y: 1.6, z: playerCar.position.z },
        { color: COLORS.spark, count: reduced ? 0 : 30, spread: 4.6 },
      );
      if (typeof hud.feedback === "function")
        hud.feedback(true, `Correct! +${pts} · BOOST!`);
      announce(`Correct! Boost! ${pts} points.`);
      caption(problem.help || "");

      advanceAfterGate();
    }

    function onWrong() {
      streak = 0;
      if (typeof hud.setStreak === "function") hud.setStreak(0);
      lives = Math.max(0, lives - 1);
      if (typeof hud.setLives === "function") hud.setLives(lives);

      // Slow down hard and shake.
      speed = Math.max(BASE_SPEED * 0.6, speed - 9);
      flash = { color: COLORS.bad, t: 0.4 };
      feel.sfx("wrong");
      if (!reduced) feel.shake(0.3);
      feel.burst(
        { x: playerCar.position.x, y: 1.2, z: playerCar.position.z },
        { color: COLORS.bad, count: reduced ? 0 : 22, spread: 3.6 },
      );

      const msg =
        lives > 0
          ? `Wrong lane. ${lives} ${lives === 1 ? "life" : "lives"} left.`
          : "Wrong lane.";
      if (typeof hud.feedback === "function") hud.feedback(false, msg);
      announce(msg);

      if (lives <= 0) {
        loseGame();
        return;
      }
      advanceAfterGate();
    }

    // After a gate resolves: hide it shortly, advance the problem (or finish).
    function advanceAfterGate() {
      gateActive = false;
      later(() => {
        gate.visible = false;
      }, 350);
      if (problemIndex < total - 1) {
        problemIndex += 1;
        loadProblem(problemIndex);
      } else {
        // All problems answered → roll out the finish line.
        finishing = true;
        finish.position.z = SPAWN_Z;
        finish.visible = true;
        hud.setObjective("Final stretch — cross the finish line! 🏁");
        announce("Last answer done. Race to the finish line!");
      }
    }

    // ---- Steering ----------------------------------------------------------
    function nearestLane(x) {
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < LANE_COUNT; i++) {
        const d = Math.abs(x - laneX(i));
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    }
    function steer(delta) {
      const next = Math.max(0, Math.min(LANE_COUNT - 1, targetLane + delta));
      if (next !== targetLane) {
        targetLane = next;
        feel.sfx("select");
      }
    }

    // Tap left/right half of the screen to steer (mobile + mouse).
    function handleTap() {
      if (!running || gameOver) return;
      const nx = input.state.ndc.x; // -1 (left) .. 1 (right)
      if (nx < -0.08) steer(-1);
      else if (nx > 0.08) steer(1);
    }

    // ---- Win / lose --------------------------------------------------------
    function loseGame() {
      gameOver = true;
      running = false;
      const msg = `Out of lives! You answered ${solvedCount} of ${total}.`;
      hud.setObjective(msg);
      announce(`Race over. ${msg}`);
      if (clarity) {
        if (clarity.setTarget) clarity.setTarget(null);
        clarity.lose({
          titleEn: "Out of lives!",
          badge: "🏁",
          stats: `${msg} Tip: find the unit rate (per 1 hour, per 1 liter) before the gate reaches you.`,
        });
      }
    }

    function winGame() {
      gameOver = true;
      running = false;
      hud.setObjective(`Finished! You answered ${solvedCount} of ${total}. 🏁`);
      hud.message("🏁 Race complete!", { tone: "ok", duration: 0 });
      feel.sfx("fanfare");
      if (!reduced) {
        feel.burst(
          { x: 0, y: 2.4, z: CAR_Z - 2 },
          { color: COLORS.amber, count: 60, spread: 7 },
        );
        feel.shake(0.3);
      }
      announce(
        `Race complete! You answered ${solvedCount} of ${total} with a best streak of ${bestStreak}.`,
      );
      if (clarity) {
        clarity.setTarget(null);
        clarity.win({
          titleEn: "Race complete!",
          badge: "🏁",
          stats: `You answered ${solvedCount} of ${total}. Best streak: ${bestStreak}. Score saved.`,
        });
      }
    }

    // ---- Reset for a fresh run (first play + Play Again) --------------------
    function resetRun() {
      problemIndex = 0;
      targetLane = 1;
      speed = BASE_SPEED;
      boostT = 0;
      flash = null;
      streak = 0;
      bestStreak = 0;
      solvedCount = 0;
      lives = START_LIVES;
      gameOver = false;
      finishing = false;
      gateActive = false;
      gateScored = false;
      traveled = 0;
      nextGateDistance = GATE_GAP;
      gate.visible = false;
      finish.visible = false;
      finish.position.z = SPAWN_Z;
      playerCar.position.set(0, 0, CAR_Z);
      if (typeof hud.setLives === "function") hud.setLives(lives);
      if (typeof hud.setStreak === "function") hud.setStreak(0);
      hud.setLevel(level === 2 ? "Level 2" : "Level 1");
      loadProblem(0);
      running = true;
    }

    // ---- Per-frame real-time loop ------------------------------------------
    function frame(dt, t) {
      // Always animate idle scenery a touch even before Start, but only scroll
      // and resolve gameplay while running.
      const playing = running && !gameOver;
      // Clamp dt so a tab-switch hiccup can't teleport gates past the car.
      const d = Math.min(dt, 0.05);

      // Ease speed back toward base when not boosting (engine/road drag).
      if (playing) {
        if (boostT > 0) boostT = Math.max(0, boostT - d);
        else speed += (BASE_SPEED - speed) * Math.min(1, d * 1.2);
      }

      const scroll = playing ? speed * d : 0;

      // Scroll dashes toward camera; wrap them around for an infinite road.
      if (scroll > 0) {
        for (const dh of dashes) {
          dh.position.z += scroll;
          if (dh.position.z > CAR_Z + 4) dh.position.z -= DASH_SPAN;
        }
        for (const p of pylons) {
          p.position.z += scroll;
          if (p.position.z > CAR_Z + 4) p.position.z -= PYLON_SPAN;
        }
      }

      // Smooth lane steering (lerp toward target lane x).
      const tx = laneX(targetLane);
      const lerp = reduced ? 1 : Math.min(1, d * 11);
      playerCar.position.x += (tx - playerCar.position.x) * lerp;
      // Steering lean + speed-scaled forward tilt for game feel.
      if (!reduced) {
        const dx = tx - playerCar.position.x;
        playerCar.rotation.z = -dx * 0.9;
        playerCar.rotation.x = -Math.min(0.12, (speed - BASE_SPEED) * 0.01);
        playerCar.position.y = boostT > 0 ? 0.06 : Math.sin(t * 9) * 0.02;
        // Spin wheels with speed.
        if (playerCar.userData.wheels)
          playerCar.userData.wheels.forEach(
            (w) => (w.rotation.x += d * speed * 0.6),
          );
      }

      // Camera FOV kick + bob on boost (subtle).
      if (!reduced && camera.isPerspectiveCamera) {
        const targetFov =
          52 + (boostT > 0 ? 7 : 0) + (speed - BASE_SPEED) * 0.3;
        camera.fov += (targetFov - camera.fov) * Math.min(1, d * 4);
        camera.updateProjectionMatrix();
      }

      // ---- Gate logic -------------------------------------------------------
      if (playing && !finishing) {
        traveled += scroll;
        if (!gateActive && traveled >= nextGateDistance) {
          spawnGate();
        }
        if (gateActive) {
          gate.position.z += scroll;
          // Recolor the lane the car is currently in as a live "you are here".
          if (!gateScored) {
            const carLane = nearestLane(playerCar.position.x);
            gatePanels.forEach((p, i) => {
              const lit = i === carLane;
              p.mat.emissiveIntensity = lit ? 0.7 : 0.35;
            });
          }
          if (!gateScored && gate.position.z >= GATE_HIT_Z) {
            resolveGate();
            traveled = 0;
            nextGateDistance = GATE_GAP;
          }
          if (gate.position.z > DESPAWN_Z) gate.visible = false;
        }
      }

      // ---- Finish line ------------------------------------------------------
      if (playing && finishing) {
        finish.position.z += scroll;
        if (!reduced) finish.rotation.y = 0; // keep flat
        if (finish.position.z >= CAR_Z) {
          finish.visible = false;
          winGame();
        }
      }

      // ---- Screen flash (green boost / red crash) via emissive road pulse ---
      if (flash) {
        flash.t = Math.max(0, flash.t - d);
        const k = flash.t / 0.4;
        groundMat.emissiveIntensity = 0.14 + k * 0.6;
        groundMat.emissive.lerpColors(
          new THREE.Color(COLORS.trackEmissive),
          new THREE.Color(flash.color),
          k,
        );
        if (flash.t <= 0) {
          flash = null;
          groundMat.emissive.set(COLORS.trackEmissive);
          groundMat.emissiveIntensity = 0.14;
        }
      }

      // Finish-line / rail emissive shimmer.
      if (!reduced) {
        railMat.emissiveIntensity = 0.55 + Math.sin(t * 4) * 0.15;
      }
    }

    return {
      start() {
        // Frame the chase camera behind/above the car.
        const framePos = { x: 0, y: 7.0, z: 19 };
        camera.position.set(framePos.x, framePos.y, framePos.z);
        camera.lookAt(0, 1.2, CAR_Z - 6);
        camera.fov = 52;
        camera.updateProjectionMatrix();
        feel.syncCamera();

        // Begin the real-time loop only after Start is pressed.
        function beginGameplay() {
          resetRun();

          // Held-state polling happens in frame(); discrete presses handle the
          // crisp single-lane changes (keyboard + touch d-pad).
          unbindPress = input.onPress((name) => {
            if (!running || gameOver) return;
            if (name === "left") steer(-1);
            else if (name === "right") steer(1);
            else if (name === "confirm") {
              const h = problem.help || "Steer into the correct answer.";
              caption(h);
              announce(h);
              feel.sfx("pop");
              later(() => caption(""), 2600);
            }
          });
          // Tapping the screen halves also steers (mobile-friendly).
          input.onTap(handleTap);
        }

        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "Ratio Rally — Steer Into the Right Answer",
          objectiveEn:
            "Your car races forward on its own. Read the problem at the top, then STEER left/right so you are in the lane with the correct answer when you hit the gate. Right lane = boost; wrong lane = crash.",
          objectiveEs:
            "Tu carro avanza solo. Lee el problema arriba y MUEVE el carro a la izquierda o derecha para estar en el carril con la respuesta correcta al cruzar la puerta. Carril correcto = impulso; incorrecto = choque.",
          standard: "6.RP.A.2–3 · Rates, Unit Rates & Percent",
          controls: [
            {
              key: "← / →  (A / D)",
              actionEn: "Steer between the 3 lanes",
              actionEs: "Cambia entre los 3 carriles",
            },
            {
              key: "Tap screen",
              actionEn: "Tap the left or right half to steer that way",
              actionEs: "Toca la mitad izquierda o derecha para girar",
            },
            {
              key: "Enter",
              actionEn: "Hear a hint for this problem",
              actionEs: "Escucha una pista para este problema",
            },
            {
              key: "?",
              actionEn: "Open this help panel any time (Esc closes it)",
              actionEs: "Abre esta ayuda cuando quieras (Esc la cierra)",
            },
          ],
          howToWinEn:
            "Each gate has 3 numbers. Be in the lane with the correct answer to boost and score. A wrong lane costs a life. Clear every problem and cross the finish line to win.",
          howToWinEs:
            "Cada puerta tiene 3 números. Cruza por el carril con la respuesta correcta para acelerar y ganar puntos. Un carril incorrecto cuesta una vida. Termina y cruza la meta para ganar.",
          onStart: beginGameplay,
          onPlayAgain: () => location.reload(),
        });

        unbindFrame = ctx.onFrame(frame);
      },

      dispose() {
        running = false;
        if (clarity) clarity.dispose();
        if (unbindPress) unbindPress();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        gateLabels.forEach(disposeSprite);
        disposables.forEach((d) => d.dispose && d.dispose());
        scene.remove(group);
      },
    };
  },
};
