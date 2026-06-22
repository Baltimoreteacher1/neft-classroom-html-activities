import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";

// ============================================================================
// Unit 3 — RATIO RALLY: HIGHWAY TUNER  (CCSS 6.RP.A.2–3)
// Self-paced highway driving game. The car waits at the start of each segment
// while you THINK — there is no timer and no forced motion. You tune a dial
// (↑/↓) to the correct rate, then press Space to confirm. Only a correct
// answer drives the car forward to clear the segment. Compare rounds =
// fuel-stop: steer to the cheapest pump ($ and liters shown — you compute
// $/L) and confirm. Cones are gentle steering practice: bumping one just gives
// a friendly hint, never a penalty and never a rush. Math is the throttle.
// Level 1 vs Level 2 differ ONLY in math difficulty, not speed or time.
// ============================================================================

const COLORS = {
  track: 0x14233f,
  trackGlow: 0x1d3a66,
  rail: 0x2f6aa0,
  dash: 0xeaf4ff,
  car: 0x1fa6a2,
  carEnrich: 0xe09b4a,
  cabin: 0xdff1ff,
  cone: 0xf2c15b,
  coneBad: 0xd9795d,
  pump: 0x4aa978,
  pumpBad: 0x35507a,
  finish: 0xf2c15b,
  good: 0x4aa978,
  bad: 0xd9795d,
  spark: 0xffd56b,
  nitro: 0x5ef0d8,
};

const LANE_W = 3.0;
const LANE_COUNT = 3;
const laneX = (i) => (i - (LANE_COUNT - 1) / 2) * LANE_W;

const CAR_Z = 6;
const SPAWN_Z = -90;
const DESPAWN_Z = 16;
const ROAD_LEN = 220;

// ---- Problem banks (curriculum exact; comments verify arithmetic) ------------
function makeLevel(level) {
  if (level === 1) {
    return {
      hints: true,
      problems: [
        {
          type: "unitrate",
          prompt:
            "12 miles in 3 hours. Tune your speed to miles in 1 hour (mph).",
          table: [
            ["miles", "hours"],
            ["12", "3"],
          ],
          help: "Divide miles by hours: 12 ÷ 3 = ?",
          answer: 4,
          unit: "mph",
          min: 0,
          max: 12,
          coarse: 1,
        },
        {
          type: "unitrate",
          prompt: "$10 for 2 cars. Tune the price for 1 car.",
          table: [
            ["dollars", "cars"],
            ["10", "2"],
          ],
          help: "Dollars ÷ cars: 10 ÷ 2 = ?",
          answer: 5,
          unit: "$/car",
          min: 0,
          max: 12,
          coarse: 1,
        },
        {
          type: "equiv",
          prompt: "4 miles each hour. How far in 5 hours? Tune the miles.",
          table: [
            ["miles", "hours"],
            ["4", "1"],
            ["?", "5"],
          ],
          help: "Same speed each hour: 4 × 5 = ?",
          answer: 20,
          unit: "mi",
          min: 0,
          max: 28,
          coarse: 2,
        },
        {
          type: "equiv",
          prompt: "3 liters every 2 laps. How much for 6 laps? Tune liters.",
          table: [
            ["liters", "laps"],
            ["3", "2"],
            ["?", "6"],
          ],
          help: "6 laps is 3 groups of 2. So 3 × 3 = ?",
          answer: 9,
          unit: "L",
          min: 0,
          max: 16,
          coarse: 1,
        },
        {
          type: "conversion",
          prompt: "How many seconds in 2 minutes? Tune the seconds.",
          table: [
            ["minutes", "seconds"],
            ["1", "60"],
            ["2", "?"],
          ],
          help: "2 × 60 = ?",
          answer: 120,
          unit: "s",
          min: 0,
          max: 200,
          coarse: 5,
        },
        {
          type: "compare",
          prompt: "Fuel stop! Pick the cheapest — lowest $ per liter.",
          help: "Divide dollars by liters for each pump. Pick the smallest.",
          lanes: [
            { label: "$6 / 3 L", dollars: 6, liters: 3 },
            { label: "$8 / 5 L", dollars: 8, liters: 5 },
            { label: "$5 / 2 L", dollars: 5, liters: 2 },
          ],
        },
      ],
    };
  }
  return {
    hints: false,
    problems: [
      {
        type: "multistep",
        prompt: "150 mi in 3 hr steady. How far in 4 hours? Tune miles.",
        help: "Speed = 150 ÷ 3 = 50 mph. Then 50 × 4 = ?",
        answer: 200,
        unit: "mi",
        min: 120,
        max: 280,
        coarse: 5,
      },
      {
        type: "percent",
        prompt: "What is 20% of 40 mph? Tune the boost.",
        help: "20% = 0.20. 0.20 × 40 = ?",
        answer: 8,
        unit: "mph",
        min: 0,
        max: 24,
        coarse: 1,
      },
      {
        type: "percent",
        prompt: "What is 15% of 80 liters? Tune liters.",
        help: "15% = 0.15. 0.15 × 80 = ?",
        answer: 12,
        unit: "L",
        min: 0,
        max: 32,
        coarse: 1,
      },
      {
        type: "multistep",
        prompt: "7 miles every 2 hours. How far in 10 hours? Tune miles.",
        help: "10 hours is 5 groups of 2. So 7 × 5 = ?",
        answer: 35,
        unit: "mi",
        min: 0,
        max: 60,
        coarse: 2,
      },
      {
        type: "conversion",
        prompt: "Seconds in 3 min 30 sec? Tune seconds.",
        help: "3 × 60 + 30 = ?",
        answer: 210,
        unit: "s",
        min: 0,
        max: 300,
        coarse: 10,
      },
      {
        type: "compare",
        prompt: "Fuel stop! Pick the cheapest — lowest $ per liter.",
        help: "Divide dollars by liters for each pump.",
        lanes: [
          { label: "$9 / 5 L", dollars: 9, liters: 5 },
          { label: "$12 / 8 L", dollars: 12, liters: 8 },
          { label: "$7 / 4 L", dollars: 7, liters: 4 },
        ],
      },
      {
        type: "percent",
        prompt: "What is 30% of $50? Tune the savings.",
        help: "30% = 0.30. 0.30 × 50 = ?",
        answer: 15,
        unit: "$",
        min: 0,
        max: 40,
        coarse: 2,
      },
    ],
  };
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

    // Pacing is student-controlled. The car sits still until the student
    // confirms a correct answer; then it drives forward at DRIVE_SPEED purely
    // as a reward animation between segments. No timers, no forced motion.
    const DRIVE_SPEED = 26;
    const CONE_GAP = 18;

    const clarityMount = renderer.domElement.parentElement || document.body;
    let clarity = null;

    const group = new THREE.Group();
    scene.add(group);

    const disposables = [];
    const mk = (g, m) => {
      disposables.push(g, m);
      return new THREE.Mesh(g, m);
    };

    // ---- Road ----------------------------------------------------------------
    const groundMat = new THREE.MeshStandardMaterial({
      color: COLORS.track,
      roughness: 0.9,
      metalness: 0.06,
      emissive: COLORS.trackGlow,
      emissiveIntensity: 0.14,
    });
    disposables.push(groundMat);
    const ground = mk(
      new THREE.BoxGeometry(LANE_COUNT * LANE_W + 4, 0.55, ROAD_LEN),
      groundMat,
    );
    ground.position.set(0, -0.28, -ROAD_LEN / 2 + CAR_Z);
    ground.receiveShadow = true;
    group.add(ground);

    const railMat = new THREE.MeshStandardMaterial({
      color: COLORS.rail,
      emissive: COLORS.rail,
      emissiveIntensity: 0.55,
      roughness: 0.45,
      metalness: 0.25,
    });
    disposables.push(railMat);
    [-1, 1].forEach((s) => {
      const geo = new THREE.BoxGeometry(0.2, 0.45, ROAD_LEN);
      disposables.push(geo);
      const rail = new THREE.Mesh(geo, railMat);
      rail.position.set(
        (s * (LANE_COUNT * LANE_W + 2.8)) / 2,
        0.18,
        -ROAD_LEN / 2 + CAR_Z,
      );
      rail.castShadow = true;
      group.add(rail);
    });

    const dashMat = new THREE.MeshStandardMaterial({
      color: COLORS.dash,
      emissive: COLORS.dash,
      emissiveIntensity: 0.75,
      roughness: 0.35,
    });
    disposables.push(dashMat);
    const dashGeo = new THREE.BoxGeometry(0.2, 0.06, 2.2);
    disposables.push(dashGeo);
    const DASH_SPAN = 110;
    const DASH_STEP = 3.6;
    const dashes = [];
    [-1, 1].forEach((side) => {
      const x = side * (LANE_W / 2);
      for (let z = CAR_Z; z > CAR_Z - DASH_SPAN; z -= DASH_STEP) {
        const d = new THREE.Mesh(dashGeo, dashMat);
        d.position.set(x, 0.07, z);
        group.add(d);
        dashes.push(d);
      }
    });

    // ---- Car -----------------------------------------------------------------
    function buildCar(color) {
      const car = new THREE.Group();
      const bodyGeo = new RoundedBoxGeometry(1.55, 0.62, 2.6, 4, 0.2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.28,
        metalness: 0.58,
        emissive: color,
        emissiveIntensity: 0.22,
      });
      disposables.push(bodyGeo, bodyMat);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.58;
      body.castShadow = true;
      car.add(body);
      car.userData.bodyMat = bodyMat;

      const cabGeo = new RoundedBoxGeometry(1.05, 0.48, 1.15, 4, 0.16);
      const cabMat = new THREE.MeshPhysicalMaterial({
        color: COLORS.cabin,
        roughness: 0.08,
        transmission: 0.45,
        thickness: 0.5,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      });
      disposables.push(cabGeo, cabMat);
      const cabin = new THREE.Mesh(cabGeo, cabMat);
      cabin.position.set(0, 1.05, -0.12);
      cabin.castShadow = true;
      car.add(cabin);

      const glowGeo = new RoundedBoxGeometry(1.65, 0.1, 2.7, 2, 0.05);
      const glowMat = new THREE.MeshStandardMaterial({
        color: COLORS.spark,
        emissive: COLORS.spark,
        emissiveIntensity: 0.95,
      });
      disposables.push(glowGeo, glowMat);
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.y = 0.22;
      car.add(glow);
      car.userData.glowMat = glowMat;

      const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 16);
      const wheelMat = new THREE.MeshStandardMaterial({
        color: 0x12141a,
        roughness: 0.65,
        metalness: 0.35,
      });
      disposables.push(wheelGeo, wheelMat);
      const wheels = [];
      [
        [-0.84, 0.36, 0.9],
        [0.84, 0.36, 0.9],
        [-0.84, 0.36, -0.9],
        [0.84, 0.36, -0.9],
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

    const speedo = makeLabel("", {
      fontSize: 88,
      scale: 1.35,
      color: "#0c1a33",
      background: "rgba(242,193,91,0.96)",
      THREE,
    });
    speedo.position.set(0, 2.35, CAR_Z + 0.5);
    group.add(speedo);

    // ---- Cones (obstacles) ---------------------------------------------------
    const coneGeo = new THREE.ConeGeometry(0.42, 1.05, 12);
    const coneMat = new THREE.MeshStandardMaterial({
      color: COLORS.cone,
      emissive: COLORS.cone,
      emissiveIntensity: 0.5,
      roughness: 0.45,
    });
    disposables.push(coneGeo, coneMat);
    const cones = [];

    function spawnCone(z) {
      const lane = Math.floor(Math.random() * LANE_COUNT);
      const c = new THREE.Mesh(coneGeo, coneMat);
      c.position.set(laneX(lane), 0.52, z);
      c.castShadow = true;
      c.userData.lane = lane;
      c.userData.active = true;
      group.add(c);
      cones.push(c);
      return c;
    }
    for (let z = CAR_Z - 20; z > SPAWN_Z; z -= CONE_GAP * 0.9) {
      if (Math.random() < 0.65) spawnCone(z);
    }

    // ---- Fuel pumps (compare rounds) -----------------------------------------
    const fuelGroup = new THREE.Group();
    fuelGroup.visible = false;
    group.add(fuelGroup);
    const pumpMeshes = [];
    const pumpLabels = [];

    function buildFuelStation() {
      while (fuelGroup.children.length) fuelGroup.remove(fuelGroup.children[0]);
      pumpMeshes.length = 0;
      pumpLabels.forEach((l) => disposeSprite(l));
      pumpLabels.length = 0;
      if (!problem || problem.type !== "compare") return;

      problem.lanes.forEach((ln, i) => {
        const lane = new THREE.Group();
        lane.position.set(laneX(i), 0, CAR_Z - 10);
        const pumpGeo = new RoundedBoxGeometry(1.4, 2.2, 1.0, 3, 0.14);
        const pumpMat = new THREE.MeshStandardMaterial({
          color: COLORS.pumpBad,
          emissive: COLORS.pumpBad,
          emissiveIntensity: 0.4,
          roughness: 0.4,
          metalness: 0.2,
        });
        disposables.push(pumpGeo, pumpMat);
        const pump = new THREE.Mesh(pumpGeo, pumpMat);
        pump.position.y = 1.1;
        pump.castShadow = true;
        lane.add(pump);
        const lbl = makeLabel(ln.label, {
          fontSize: 64,
          scale: 1.2,
          color: "#ffffff",
          background: "rgba(11,28,52,0.88)",
          THREE,
        });
        lbl.position.set(0, 2.6, 0.3);
        lane.add(lbl);
        fuelGroup.add(lane);
        pumpMeshes.push({ mesh: pump, mat: pumpMat, lane: i });
        pumpLabels.push(lbl);
      });
    }

    function highlightPump(lane) {
      pumpMeshes.forEach((p) => {
        const lit = p.lane === lane;
        p.mat.color.set(lit ? COLORS.pump : COLORS.pumpBad);
        p.mat.emissive.set(lit ? COLORS.pump : COLORS.pumpBad);
        p.mat.emissiveIntensity = lit ? 0.85 : 0.35;
      });
    }

    // ---- Finish line ---------------------------------------------------------
    const finishMat = new THREE.MeshStandardMaterial({
      color: COLORS.finish,
      emissive: COLORS.finish,
      emissiveIntensity: 0.85,
      roughness: 0.35,
    });
    disposables.push(finishMat);
    const finish = mk(
      new THREE.BoxGeometry(LANE_COUNT * LANE_W + 3.5, 0.1, 1.2),
      finishMat,
    );
    finish.position.set(0, 0.08, SPAWN_Z + 8);
    finish.visible = false;
    group.add(finish);

    if (!document.getElementById("u3-hud-fix")) {
      const hf = document.createElement("style");
      hf.id = "u3-hud-fix";
      hf.textContent = ".ck-chip{display:none !important;}";
      document.head.appendChild(hf);
    }

    function disposeSprite(spr) {
      if (!spr) return;
      if (spr.parent) spr.parent.remove(spr);
      if (spr.material.map) spr.material.map.dispose();
      spr.material.dispose();
    }

    // ---- State ---------------------------------------------------------------
    // Phases: "tune"  = car parked, student sets the dial (no timer)
    //         "fuel"  = car parked at fuel stop, student picks a pump
    //         "drive" = brief reward animation after a correct confirm
    //         "finish"= final reward drive to the checkered line
    //         "idle"  = not started / game over
    let segIndex = 0;
    const total = cfg.problems.length;
    let problem = null;
    let phase = "idle";
    let dial = 0;
    let targetLane = 1;
    let driveLeft = 0; // remaining distance for the reward-drive animation
    let driveThen = null; // callback when the reward drive finishes
    let streak = 0; // count of correct answers in a row (progress, not speed)
    let bestStreak = 0;
    let solved = 0;
    let running = false;
    let gameOver = false;
    let hintCooldown = 0; // gentle cone-hint debounce (seconds), never a penalty
    let flash = null;
    let segmentLock = false;

    const timers = [];
    let unbindPress = null;
    let unbindFrame = null;
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    const isCompare = () => problem?.type === "compare";
    const inGreen = () => !isCompare() && dial === problem.answer;

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

    function readout() {
      if (isCompare()) {
        const ln = problem.lanes[targetLane];
        return `Pump ${targetLane + 1}: ${ln.label}`;
      }
      return `${dial}${problem.unit ? " " + problem.unit : ""}`;
    }

    function tableHint() {
      if (!problem.table || !cfg.hints) return "";
      const [units, ...rows] = problem.table;
      const given = rows.find((r) => r.every((c) => !String(c).includes("?")));
      if (given && units.length >= 2) {
        return ` · Given: ${given[0]} ${units[0]} / ${given[1]} ${units[1]}`;
      }
      return "";
    }

    function updateHud() {
      if (!problem) return;
      let obj;
      if (phase === "fuel" || isCompare()) {
        obj = `${problem.prompt} ▶ ${readout()} — press Space to choose this pump`;
      } else if (inGreen()) {
        obj = `${problem.prompt} ▶ ${readout()} looks right — press Space to drive${tableHint()}`;
      } else {
        obj = `${problem.prompt} ▶ Tune: ${readout()} (↑/↓, take your time)${tableHint()}`;
      }
      hud.setObjective(obj);
      if (clarity?.setTarget) {
        clarity.setTarget(
          isCompare()
            ? "Steer to cheapest pump, Space to fuel"
            : `Set the dial to ${problem.answer} ${problem.unit || ""}, then Space`,
        );
      }
      updateLabel(speedo, readout());
      speedo.material.color.set(inGreen() ? "#ffffff" : "#0c1a33");
    }

    function stepSize(coarse) {
      return coarse ? problem.coarse || 1 : 1;
    }

    function steer(delta) {
      const next = Math.max(0, Math.min(LANE_COUNT - 1, targetLane + delta));
      if (next !== targetLane) {
        targetLane = next;
        feel.sfx("select");
        if (phase === "fuel") highlightPump(targetLane);
        updateHud();
      }
    }

    function changeDial(delta) {
      if (phase !== "tune" || isCompare()) return;
      const next = Math.max(problem.min, Math.min(problem.max, dial + delta));
      if (next !== dial) {
        dial = next;
        updateHud();
        feel.sfx(delta > 0 ? "add" : "remove");
        announce(`Tuned to ${dial} ${problem.unit || ""}`);
      }
    }

    // Student confirms their dial. Only a correct rate drives the car forward.
    // A wrong dial is never a failure — it gives a gentle nudge to keep tuning.
    function confirmDial() {
      if (phase !== "tune" || isCompare()) return;
      if (inGreen()) {
        completeSegment("rate");
      } else {
        feel.sfx("select");
        const tip = `Not yet — keep tuning. ${cfg.hints ? problem.help : "Check your math and try the dial again."}`;
        hud.feedback?.(
          false,
          "Not quite — take your time and adjust the dial.",
        ) ||
          hud.message("Keep tuning — no rush.", {
            tone: "info",
            duration: 1800,
          });
        announce(tip);
        if (!reduced) feel.shake(0.08);
      }
    }

    function scrollDashes(amount) {
      for (const d of dashes) {
        d.position.z += amount;
        if (d.position.z > CAR_Z + 5) d.position.z -= DASH_SPAN;
      }
    }

    function scrollCones(amount) {
      for (const c of cones) {
        if (!c.userData.active) continue;
        c.position.z += amount;
        if (c.position.z > DESPAWN_Z) {
          c.position.z = SPAWN_Z - Math.random() * 30;
          c.userData.lane = Math.floor(Math.random() * LANE_COUNT);
          c.position.x = laneX(c.userData.lane);
        }
      }
    }

    // Cones are gentle steering practice during the reward drive. Bumping one
    // is never a penalty — it just gives a friendly "steer around" hint and the
    // car keeps rolling. No lives, no failure, no rush.
    function checkConeHits() {
      if (phase !== "drive" || hintCooldown > 0) return;
      const carLane = nearestLane(playerCar.position.x);
      for (const c of cones) {
        if (!c.userData.active) continue;
        if (Math.abs(c.position.z - CAR_Z) > 1.1) continue;
        if (c.userData.lane !== carLane) continue;
        bumpCone();
        c.position.z = SPAWN_Z - 20;
        break;
      }
    }

    function bumpCone() {
      hintCooldown = 1.2;
      feel.sfx("select");
      if (!reduced) {
        feel.shake(0.1);
        feel.burst(
          { x: playerCar.position.x, y: 1.2, z: CAR_Z },
          { color: COLORS.cone, count: 10, spread: 2.2 },
        );
      }
      const msg = "Tap ← / → to steer around the cones.";
      hud.message(msg, { tone: "info", duration: 1600 });
      announce(msg);
    }

    function confirmFuel() {
      if (phase !== "fuel" || !isCompare()) return;
      let best = 0;
      let bestRate = Infinity;
      problem.lanes.forEach((ln, i) => {
        const r = ln.dollars / ln.liters;
        if (r < bestRate) {
          bestRate = r;
          best = i;
        }
      });
      if (targetLane !== best) {
        // Wrong pump is never a failure — gently invite another try.
        feel.sfx("select");
        if (!reduced) feel.shake(0.08);
        const msg = `Not the best buy yet — ${cfg.hints ? problem.help : "compare $ ÷ liters for each pump and pick the smallest."}`;
        hud.feedback?.(false, "Compare $ per liter and try another pump.") ||
          hud.message("Keep comparing — no rush.", {
            tone: "info",
            duration: 1800,
          });
        announce(msg);
        return;
      }
      completeSegment("fuel");
    }

    function completeSegment(kind) {
      if (segmentLock) return;
      segmentLock = true;
      solved += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      if (typeof hud.setStreak === "function") hud.setStreak(streak);

      // Scoring is purely by correct math + progress streak — never by speed.
      const pts = 22 + (level === 2 ? 12 : 0) + Math.min(streak - 1, 6) * 4;
      onScore(pts, { segment: segIndex + 1, kind });

      feel.sfx("correct");
      if (!reduced) {
        feel.burst(
          { x: playerCar.position.x, y: 1.8, z: CAR_Z - 1 },
          { color: COLORS.spark, count: 40, spread: 5 },
        );
        feel.shake(0.2);
      }
      flash = { color: COLORS.good, t: 0.35 };
      hud.feedback?.(
        true,
        `Correct! +${pts}${streak > 1 ? ` · 🔥${streak}` : ""}`,
      );
      announce(`Correct. ${pts} points. Driving to the next segment.`);

      fuelGroup.visible = false;
      // Reward drive: roll the highway forward a fixed distance, then advance.
      driveThen = () => {
        if (segIndex < total - 1) {
          segIndex += 1;
          startSegment();
        } else {
          startFinish();
        }
      };
      driveLeft = 70;
      phase = "drive";
    }

    function startSegment() {
      segmentLock = false;
      problem = cfg.problems[segIndex];
      dial = isCompare() ? 0 : problem.min;
      targetLane = 1;
      playerCar.position.x = laneX(targetLane);

      if (typeof hud.setProgress === "function")
        hud.setProgress(segIndex, total);

      if (isCompare()) {
        phase = "fuel";
        fuelGroup.visible = true;
        buildFuelStation();
        highlightPump(targetLane);
        announce(
          `Segment ${segIndex + 1}. Fuel stop. Steer to the cheapest pump and press Space.`,
        );
        if (cfg.hints) {
          hud.message(problem.help, { tone: "info", duration: 3200 });
        }
      } else {
        phase = "tune";
        fuelGroup.visible = false;
        announce(
          `Segment ${segIndex + 1}. ${problem.prompt} Take your time, tune ↑/↓ to the right number, then press Space to drive.`,
        );
        if (cfg.hints) {
          hud.message(problem.help, { tone: "info", duration: 3400 });
        }
      }
      updateHud();
      feel.sfx("pop");
    }

    function startFinish() {
      phase = "finish";
      finish.visible = true;
      finish.position.z = SPAWN_Z + 8;
      hud.setObjective("All segments solved — rolling to the finish line! 🏁");
      announce("All segments solved. Your car is rolling to the finish line.");
    }

    function winGame() {
      gameOver = true;
      running = false;
      finish.visible = false;
      hud.setObjective(
        `You finished! ${solved} segments · best streak ${bestStreak} 🏁`,
      );
      hud.message("🏁 Highway complete!", { tone: "ok", duration: 0 });
      feel.sfx("fanfare");
      if (!reduced) {
        feel.burst(
          { x: 0, y: 2.8, z: CAR_Z - 2 },
          { color: COLORS.finish, count: 70, spread: 8 },
        );
        feel.shake(0.32);
      }
      announce(`Highway complete! Best streak ${bestStreak}.`);
      clarity?.setTarget(null);
      clarity?.win({
        titleEn: "Highway champion!",
        badge: "🏁",
        stats: `You solved all ${solved} segments. Best streak: ${bestStreak}.`,
      });
    }

    function resetRun() {
      segIndex = 0;
      dial = 0;
      targetLane = 1;
      streak = 0;
      bestStreak = 0;
      solved = 0;
      gameOver = false;
      running = true;
      driveLeft = 0;
      driveThen = null;
      hintCooldown = 0;
      flash = null;
      finish.visible = false;
      fuelGroup.visible = false;
      if (typeof hud.setStreak === "function") hud.setStreak(0);
      hud.setLevel(level === 2 ? "Level 2" : "Level 1");
      startSegment();
    }

    function handleTap() {
      if (!running || gameOver) return;
      const nx = input.state.ndc.x;
      if (nx < -0.1) steer(-1);
      else if (nx > 0.1) steer(1);
    }

    return {
      start() {
        const framePos = { x: 0, y: 7.2, z: 18 };
        if (reduced) {
          camera.position.set(framePos.x, framePos.y, framePos.z);
          camera.lookAt(0, 1.2, CAR_Z - 8);
          feel.syncCamera();
        } else {
          camera.position.set(-5, 14, 26);
          camera.lookAt(0, 0, CAR_Z - 6);
          const from = camera.position.clone();
          feel.tween({
            from: 0,
            to: 1,
            duration: 1.2,
            onUpdate: (p) => {
              camera.position.set(
                from.x + (framePos.x - from.x) * p,
                from.y + (framePos.y - from.y) * p,
                from.z + (framePos.z - from.z) * p,
              );
              camera.lookAt(0, 1.2, CAR_Z - 8);
            },
            onComplete: () => feel.syncCamera(),
          });
        }

        function beginGameplay() {
          resetRun();
          unbindPress = input.onPress((name) => {
            if (!running || gameOver) return;
            if (name === "confirm" && problem) {
              caption(problem.help || "");
              announce(problem.help || "");
              feel.sfx("pop");
              later(() => caption(""), 2600);
              return;
            }
            if (phase === "fuel") {
              if (name === "left") steer(-1);
              else if (name === "right") steer(1);
              else if (name === "action") confirmFuel();
            } else if (phase === "tune") {
              if (name === "left") steer(-1);
              else if (name === "right") steer(1);
              else if (name === "up") changeDial(stepSize(false));
              else if (name === "down") changeDial(-stepSize(false));
              else if (name === "action") confirmDial();
            } else if (phase === "drive") {
              // Optional gentle steering during the reward drive.
              if (name === "left") steer(-1);
              else if (name === "right") steer(1);
            }
          });
          input.onTap(handleTap);
        }

        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "Ratio Rally — Highway Tuner",
          objectiveEn:
            "Your car waits at the start of each segment — there is no timer, so take all the time you need. Work out the rate, use ↑/↓ to set the dial to that number, then press Space. Only a correct answer drives the car forward. On fuel stops, steer to the cheapest pump ($ ÷ liters) and press Space.",
          objectiveEs:
            "Tu auto espera al inicio de cada tramo — no hay reloj, tómate todo el tiempo que necesites. Calcula la razón, usa ↑/↓ para poner ese número en el medidor y presiona Espacio. Solo una respuesta correcta hace avanzar el auto. En la gasolinera, ve a la bomba más barata ($ ÷ litros) y presiona Espacio.",
          standard: "6.RP.A.2–3 · Rates, Unit Rates & Percent",
          controls: [
            {
              key: "↑ / ↓",
              actionEn: "Set the dial to the rate (no rush)",
              actionEs: "Ajusta el medidor a la razón (sin prisa)",
            },
            {
              key: "Space",
              actionEn: "Confirm your answer / fuel pump",
              actionEs: "Confirma tu respuesta / la bomba",
            },
            {
              key: "← / →",
              actionEn: "Steer between lanes",
              actionEs: "Cambia de carril",
            },
            {
              key: "Enter",
              actionEn: "Hear a hint",
              actionEs: "Escucha una pista",
            },
            {
              key: "Tap sides",
              actionEn: "Steer left or right",
              actionEs: "Toca un lado para girar",
            },
          ],
          howToWinEn:
            "Solve every segment to drive the whole highway — there is no clock and no losing. Set the dial to the correct rate and press Space to roll forward. On fuel stops, pick the cheapest pump. Bumping a cone is fine; just steer around. Finish all segments to win.",
          howToWinEs:
            "Resuelve cada tramo para recorrer toda la carretera — no hay reloj ni forma de perder. Pon la razón correcta en el medidor y presiona Espacio para avanzar. En la gasolinera, elige la bomba más barata. Chocar un cono no pasa nada; solo esquívalo. Termina todos los tramos para ganar.",
          onStart: beginGameplay,
          onPlayAgain: () => location.reload(),
        });

        unbindFrame = ctx.onFrame((dt, t) => {
          if (!running || gameOver) return;
          const d = Math.min(dt, 0.05);

          if (hintCooldown > 0) hintCooldown = Math.max(0, hintCooldown - d);

          // Steering (lane follow — works while parked or during a reward drive)
          const tx = laneX(targetLane);
          const lerp = reduced ? 1 : Math.min(1, d * 12);
          playerCar.position.x += (tx - playerCar.position.x) * lerp;
          const lean = (tx - playerCar.position.x) * -1.2;
          playerCar.rotation.z = lean;

          // The dial being correct lights a calm "ready" glow — NOT a timer.
          const ready = phase === "tune" && inGreen();
          if (ready) {
            playerCar.userData.glowMat.emissive.set(COLORS.good);
            playerCar.userData.glowMat.emissiveIntensity = 1.0;
            playerCar.userData.bodyMat.emissiveIntensity = 0.4;
          } else if (phase === "tune") {
            playerCar.userData.glowMat.emissive.set(COLORS.spark);
            playerCar.userData.glowMat.emissiveIntensity = 0.75;
            playerCar.userData.bodyMat.emissiveIntensity = 0.22;
          }

          // The world only moves during reward animations. While the student is
          // thinking (tune / fuel) the car is parked — zero forced motion.
          let scroll = 0;
          if (phase === "drive") {
            scroll = Math.min(DRIVE_SPEED * d * 18, driveLeft);
            driveLeft -= scroll;
            checkConeHits();
            if (driveLeft <= 0) {
              const then = driveThen;
              driveThen = null;
              if (then) then();
            }
          } else if (phase === "finish") {
            scroll = DRIVE_SPEED * d * 22;
            finish.position.z += scroll;
            if (finish.position.z >= CAR_Z) winGame();
          }

          if (scroll > 0) {
            scrollDashes(scroll);
            scrollCones(scroll);
            if (playerCar.userData.wheels) {
              playerCar.userData.wheels.forEach(
                (w) => (w.rotation.x += scroll * 0.55),
              );
            }
          }

          if (!reduced) {
            const moving = phase === "drive" || phase === "finish";
            playerCar.position.y =
              (ready ? 0.06 : 0) + Math.sin(t * (moving ? 14 : 6)) * 0.02;
            const targetFov = 54 + (moving ? 6 : 0);
            if (camera.isPerspectiveCamera) {
              camera.fov += (targetFov - camera.fov) * Math.min(1, d * 5);
              camera.updateProjectionMatrix();
            }
            const camX = playerCar.position.x * 0.35;
            camera.position.x +=
              (camX - camera.position.x) * Math.min(1, d * 3);
            camera.lookAt(playerCar.position.x * 0.2, 1.1, CAR_Z - 10);
          }

          if (
            phase === "tune" &&
            Math.floor(t * 4) !== Math.floor((t - d) * 4)
          ) {
            updateHud();
          }

          if (flash) {
            flash.t = Math.max(0, flash.t - d);
            const k = flash.t / 0.35;
            groundMat.emissiveIntensity = 0.14 + k * 0.55;
            groundMat.emissive.lerpColors(
              new THREE.Color(COLORS.trackGlow),
              new THREE.Color(flash.color),
              k,
            );
            if (flash.t <= 0) {
              flash = null;
              groundMat.emissive.set(COLORS.trackGlow);
              groundMat.emissiveIntensity = 0.14;
            }
          }

          if (!reduced) {
            railMat.emissiveIntensity = 0.5 + Math.sin(t * 5) * 0.12;
            finishMat.emissiveIntensity = 0.7 + Math.sin(t * 4) * 0.2;
          }
        });
      },

      dispose() {
        running = false;
        if (clarity) clarity.dispose();
        if (unbindPress) unbindPress();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        disposeSprite(speedo);
        pumpLabels.forEach(disposeSprite);
        cones.forEach((c) => group.remove(c));
        disposables.forEach((d) => d.dispose?.());
        scene.remove(group);
      },
    };
  },
};
