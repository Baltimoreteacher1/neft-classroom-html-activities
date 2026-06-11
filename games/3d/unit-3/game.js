import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";

// ============================================================================
// Unit 3 — RATIO RALLY: HIGHWAY TUNER  (CCSS 6.RP.A.2–3)
// Continuous arcade highway racer. The car NEVER stops — you steer between
// lanes, dodge cones, and tune a live dial (↑/↓) WHILE driving. Your dial
// sets the car's speed; hit the target rate and HOLD it in the green zone to
// clear each segment. Compare rounds = fuel-stop: steer to the cheapest pump
// ($ and liters shown — you compute $/L). Math is the throttle, not a quiz.
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
      holdSec: 4.2,
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
    holdSec: 3.4,
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

    const BASE_SPEED = level === 2 ? 20 : 16;
    const BOOST_SPEED = level === 2 ? 38 : 30;
    const START_LIVES = level === 2 ? 3 : 4;
    const CONE_GAP = level === 2 ? 14 : 18;
    const HOLD_SEC = cfg.holdSec;

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
    let segIndex = 0;
    const total = cfg.problems.length;
    let problem = null;
    let phase = "idle"; // run | fuel | finish | idle
    let dial = 0;
    let targetLane = 1;
    let holdTime = 0;
    let traveled = 0;
    let nextConeAt = CONE_GAP;
    let streak = 0;
    let bestStreak = 0;
    let solved = 0;
    let lives = START_LIVES;
    let running = false;
    let gameOver = false;
    let boostT = 0;
    let hitCooldown = 0;
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
        obj = `${problem.prompt} ▶ ${readout()}`;
      } else if (inGreen()) {
        const left = Math.max(0, HOLD_SEC - holdTime).toFixed(1);
        obj = `${problem.prompt} ▶ GREEN ZONE ${readout()} — hold ${left}s${tableHint()}`;
      } else {
        obj = `${problem.prompt} ▶ Tune: ${readout()} (↑/↓ while driving)${tableHint()}`;
      }
      hud.setObjective(obj);
      if (clarity?.setTarget) {
        clarity.setTarget(
          isCompare()
            ? "Steer to cheapest pump, Space to fuel"
            : `Hold ${problem.answer} ${problem.unit || ""}`,
        );
      }
      const bg = inGreen()
        ? "rgba(47,169,120,0.96)"
        : "rgba(242,193,91,0.96)";
      updateLabel(speedo, readout());
      speedo.material.color.set(inGreen() ? "#ffffff" : "#0c1a33");
      if (speedo.material.map) {
        // refresh label texture color via remake is heavy; tint via children
      }
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
      if (phase !== "run" || isCompare()) return;
      const next = Math.max(
        problem.min,
        Math.min(problem.max, dial + delta),
      );
      if (next !== dial) {
        dial = next;
        holdTime = inGreen() ? holdTime : 0;
        updateHud();
        feel.sfx(delta > 0 ? "add" : "remove");
        announce(`Tuned to ${dial} ${problem.unit || ""}`);
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

    function checkConeHits() {
      if (phase !== "run" || hitCooldown > 0) return;
      const carLane = nearestLane(playerCar.position.x);
      for (const c of cones) {
        if (!c.userData.active) continue;
        if (Math.abs(c.position.z - CAR_Z) > 1.1) continue;
        if (c.userData.lane !== carLane) continue;
        hitCone();
        c.position.z = SPAWN_Z - 20;
        break;
      }
    }

    function hitCone() {
      hitCooldown = 1.2;
      streak = 0;
      holdTime = 0;
      if (typeof hud.setStreak === "function") hud.setStreak(0);
      lives = Math.max(0, lives - 1);
      if (typeof hud.setLives === "function") hud.setLives(lives);
      feel.sfx("wrong");
      if (!reduced) {
        feel.shake(0.28);
        feel.burst(
          { x: playerCar.position.x, y: 1.2, z: CAR_Z },
          { color: COLORS.bad, count: 22, spread: 3.5 },
        );
      }
      flash = { color: COLORS.bad, t: 0.35 };
      const msg =
        lives > 0
          ? `Cone hit! ${lives} ${lives === 1 ? "life" : "lives"} left.`
          : "Cone hit!";
      hud.feedback?.(false, msg) || hud.message(msg, { tone: "warn", duration: 2000 });
      announce(msg);
      if (lives <= 0) loseGame();
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
        streak = 0;
        if (typeof hud.setStreak === "function") hud.setStreak(0);
        lives = Math.max(0, lives - 1);
        if (typeof hud.setLives === "function") hud.setLives(lives);
        feel.sfx("wrong");
        if (!reduced) feel.shake(0.22);
        const msg =
          lives > 0
            ? `Not the best buy. ${lives} ${lives === 1 ? "life" : "lives"} left.`
            : "Not the best buy.";
        hud.feedback?.(false, msg);
        announce(msg);
        if (lives <= 0) {
          loseGame();
          return;
        }
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

      const pts = 22 + (level === 2 ? 12 : 0) + Math.min(streak - 1, 6) * 4;
      onScore(pts, { segment: segIndex + 1, kind });

      boostT = 1.1;
      feel.sfx("correct");
      if (!reduced) {
        feel.burst(
          { x: playerCar.position.x, y: 1.8, z: CAR_Z - 1 },
          { color: COLORS.spark, count: 40, spread: 5 },
        );
        feel.shake(0.2);
      }
      flash = { color: COLORS.good, t: 0.35 };
      hud.feedback?.(true, `Segment clear! +${pts}${streak > 1 ? ` · 🔥${streak}` : ""}`);
      announce(`Segment ${segIndex + 1} clear. ${pts} points.`);

      fuelGroup.visible = false;
      later(() => {
        if (segIndex < total - 1) {
          segIndex += 1;
          startSegment();
        } else {
          startFinish();
        }
      }, 900);
    }

    function startSegment() {
      segmentLock = false;
      problem = cfg.problems[segIndex];
      holdTime = 0;
      traveled = 0;
      nextConeAt = CONE_GAP;
      dial = isCompare() ? 0 : problem.min;
      targetLane = 1;
      playerCar.position.x = laneX(targetLane);

      if (typeof hud.setProgress === "function") hud.setProgress(segIndex, total);

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
        phase = "run";
        fuelGroup.visible = false;
        announce(
          `Segment ${segIndex + 1}. ${problem.prompt} Tune ↑/↓ and hold the green zone.`,
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
      hud.setObjective("Final stretch — cross the finish! 🏁");
      announce("Last segment done. Race to the finish line!");
    }

    function winGame() {
      gameOver = true;
      running = false;
      finish.visible = false;
      hud.setObjective(`You won! ${solved} segments · best streak ${bestStreak} 🏁`);
      hud.message("🏁 Race complete!", { tone: "ok", duration: 0 });
      feel.sfx("fanfare");
      if (!reduced) {
        feel.burst(
          { x: 0, y: 2.8, z: CAR_Z - 2 },
          { color: COLORS.finish, count: 70, spread: 8 },
        );
        feel.shake(0.32);
      }
      announce(`Race complete! Best streak ${bestStreak}.`);
      clarity?.setTarget(null);
      clarity?.win({
        titleEn: "Highway champion!",
        badge: "🏁",
        stats: `You cleared ${solved} segments. Best streak: ${bestStreak}.`,
      });
    }

    function loseGame() {
      gameOver = true;
      running = false;
      const msg = `Race over. You cleared ${solved} of ${total}.`;
      hud.setObjective(msg);
      announce(msg);
      clarity?.setTarget(null);
      clarity?.lose({
        titleEn: "Race over",
        badge: "🏁",
        stats: `${msg} Tip: divide to find the unit rate, then hold that number in the green zone.`,
      });
    }

    function resetRun() {
      segIndex = 0;
      dial = 0;
      targetLane = 1;
      holdTime = 0;
      streak = 0;
      bestStreak = 0;
      solved = 0;
      lives = START_LIVES;
      gameOver = false;
      running = true;
      boostT = 0;
      hitCooldown = 0;
      flash = null;
      finish.visible = false;
      fuelGroup.visible = false;
      if (typeof hud.setLives === "function") hud.setLives(lives);
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
            } else if (phase === "run") {
              if (name === "left") steer(-1);
              else if (name === "right") steer(1);
              else if (name === "up") changeDial(stepSize(false));
              else if (name === "down") changeDial(-stepSize(false));
            }
          });
          input.onTap(handleTap);
        }

        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "Ratio Rally — Highway Tuner",
          objectiveEn:
            "Steer between lanes and dodge cones. Use ↑/↓ to tune your rate WHILE driving — when the speedometer hits the green zone, HOLD it to clear the segment. Fuel stops: steer to the cheapest pump and press Space.",
          objectiveEs:
            "Conduce entre carriles y esquiva conos. Usa ↑/↓ para ajustar tu razón MIENTRAS conduces — cuando el velocímetro entre en la zona verde, MANTÉNLO. En gasolina: elige la bomba más barata y presiona Espacio.",
          standard: "6.RP.A.2–3 · Rates, Unit Rates & Percent",
          controls: [
            {
              key: "← / →",
              actionEn: "Steer between lanes (dodge cones)",
              actionEs: "Gira entre carriles (esquiva conos)",
            },
            {
              key: "↑ / ↓",
              actionEn: "Tune your rate while driving",
              actionEs: "Ajusta tu razón mientras conduces",
            },
            {
              key: "Space",
              actionEn: "Confirm fuel pump on fuel-stop rounds",
              actionEs: "Confirma la bomba en paradas de gasolina",
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
            "Hold the correct rate in the green zone long enough to clear each highway segment. Dodge cones. On fuel rounds, pick the cheapest pump. Clear every segment and cross the finish.",
          howToWinEs:
            "Mantén la razón correcta en la zona verde el tiempo suficiente. Esquiva conos. En gasolina, elige la bomba más barata. Cruza la meta.",
          onStart: beginGameplay,
          onPlayAgain: () => location.reload(),
        });

        unbindFrame = ctx.onFrame((dt, t) => {
          if (!running || gameOver) return;
          const d = Math.min(dt, 0.05);

          if (hitCooldown > 0) hitCooldown = Math.max(0, hitCooldown - d);
          if (boostT > 0) boostT = Math.max(0, boostT - d);

          // Steering
          const tx = laneX(targetLane);
          const lerp = reduced ? 1 : Math.min(1, d * 12);
          playerCar.position.x += (tx - playerCar.position.x) * lerp;
          const lean = (tx - playerCar.position.x) * -1.2;
          playerCar.rotation.z = lean;

          let scroll = 0;
          if (phase === "run") {
            scroll = inGreen()
              ? BOOST_SPEED + (boostT > 0 ? 6 : 0)
              : BASE_SPEED * (0.35 + (0.65 * dial) / Math.max(problem.max, 1));
            if (inGreen()) {
              holdTime += d;
              playerCar.userData.glowMat.emissive.set(COLORS.nitro);
              playerCar.userData.glowMat.emissiveIntensity = 1.1;
              playerCar.userData.bodyMat.emissiveIntensity = 0.45;
              if (!reduced && Math.random() < 0.35) {
                feel.burst(
                  {
                    x: playerCar.position.x + (Math.random() - 0.5) * 0.6,
                    y: 0.5,
                    z: CAR_Z - 1.2,
                  },
                  { color: COLORS.nitro, count: 2, spread: 1.2, size: 0.12 },
                );
              }
              if (holdTime >= HOLD_SEC) completeSegment("hold");
            } else {
              holdTime = 0;
              playerCar.userData.glowMat.emissive.set(COLORS.spark);
              playerCar.userData.glowMat.emissiveIntensity = 0.75;
              playerCar.userData.bodyMat.emissiveIntensity = 0.22;
            }
            traveled += scroll;
            if (traveled >= nextConeAt) {
              spawnCone(SPAWN_Z - Math.random() * 15);
              nextConeAt += CONE_GAP;
            }
            checkConeHits();
          } else if (phase === "fuel") {
            scroll = BASE_SPEED * 0.35;
          } else if (phase === "finish") {
            scroll = BOOST_SPEED * 1.1;
            finish.position.z += scroll;
            if (finish.position.z >= CAR_Z) winGame();
          }

          if (scroll > 0) {
            scrollDashes(scroll);
            scrollCones(scroll);
            if (playerCar.userData.wheels) {
              playerCar.userData.wheels.forEach(
                (w) => (w.rotation.x += d * scroll * 0.55),
              );
            }
          }

          if (!reduced) {
            playerCar.position.y =
              (inGreen() ? 0.08 : 0) + Math.sin(t * (inGreen() ? 14 : 8)) * 0.025;
            const targetFov =
              54 + (inGreen() ? 10 : 0) + (boostT > 0 ? 5 : 0);
            if (camera.isPerspectiveCamera) {
              camera.fov += (targetFov - camera.fov) * Math.min(1, d * 5);
              camera.updateProjectionMatrix();
            }
            const camX = playerCar.position.x * 0.35;
            camera.position.x += (camX - camera.position.x) * Math.min(1, d * 3);
            camera.lookAt(
              playerCar.position.x * 0.2,
              1.1,
              CAR_Z - 10,
            );
          }

          if (phase === "run" && Math.floor(t * 4) !== Math.floor((t - d) * 4)) {
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
