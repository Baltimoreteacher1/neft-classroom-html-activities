import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";

// ============================================================================
// Unit 3 — RATIO RALLY  (CCSS 6.RP.A.3 / 6.RP.A.2)
// Theme: a neon speedway pit-lane. Tune unit rates, equivalent ratios, percent
// boosts, conversions and "best buy" comparisons to launch your car.
// Premium rebuild: RoundedBox/PBR cars, emissive bloom accents, receive/cast
// shadows, animated camera intro + idle motion, tweened transitions, particle
// bursts, and feel.sfx() on every action.
// ============================================================================

const COLORS = {
  bg: 0x0c1a33,
  track: 0x14233f,
  trackEmissive: 0x1d3a66,
  rail: 0x2f6aa0,
  car: 0x1fa6a2,
  carEnrich: 0xe09b4a,
  cabin: 0xdff1ff,
  dialOk: 0x4aa978,
  dialActive: 0xf2c15b,
  finish: 0xf2c15b,
  laneBest: 0x4aa978,
  amber: 0xf2c15b,
  spark: 0xffd56b,
};

const LANE_W = 2.4;
const TRACK_LEN = 28;
const LANE_COUNT = 3;
const laneX = (i) => (i - (LANE_COUNT - 1) / 2) * LANE_W;

// ---- Math problem banks (6.RP.A.3) ------------------------------------------
// Every answer is exact; comments verify the arithmetic. Level 1 = scaffolded
// (hints + a rate table + smaller numbers). Level 2 = enrichment (larger /
// multi-step, fewer scaffolds). 6+ rounds per level.

function makeLevel(level) {
  if (level === 1) {
    return {
      hints: true,
      problems: [
        // 12 miles in 3 hours -> 12 ÷ 3 = 4 mph.
        {
          type: "unitrate",
          prompt: "12 miles in 3 hours. Speed for 1 hour? Set mph.",
          table: [
            ["miles", "hours"],
            ["12", "3"],
          ],
          help: "12 ÷ 3 = 4. The answer is 4 mph.",
          answer: 4,
          unit: "mph",
          min: 0,
          max: 12,
        },
        // $10 for 2 cars -> 10 ÷ 2 = $5 each.
        {
          type: "unitrate",
          prompt: "$10 for 2 cars. Price for 1 car? Set dollars.",
          table: [
            ["dollars", "cars"],
            ["10", "2"],
          ],
          help: "10 ÷ 2 = 5. The answer is $5.",
          answer: 5,
          unit: "$/car",
          min: 0,
          max: 12,
        },
        // Equivalent ratio 4:1 -> 4 × 5 = 20 miles in 5 hours.
        {
          type: "equiv",
          prompt: "4 miles each hour. How far in 5 hours? Set miles.",
          table: [
            ["miles", "hours"],
            ["4", "1"],
            ["?", "5"],
          ],
          help: "4 × 5 = 20. The answer is 20 miles.",
          answer: 20,
          unit: "miles",
          min: 0,
          max: 28,
        },
        // Equivalent ratio 3:2 -> for 6 laps, fuel = 3 × 3 = 9.
        {
          type: "equiv",
          prompt: "3 liters every 2 laps. How much for 6 laps? Set liters.",
          table: [
            ["liters", "laps"],
            ["3", "2"],
            ["?", "6"],
          ],
          help: "6 ÷ 2 = 3, then 3 × 3 = 9. The answer is 9 liters.",
          answer: 9,
          unit: "L",
          min: 0,
          max: 16,
        },
        // Conversion: 2 min = 120 s. 2 × 60.
        {
          type: "conversion",
          prompt: "2 minutes is how many seconds? Set seconds.",
          table: [
            ["minutes", "seconds"],
            ["1", "60"],
            ["2", "?"],
          ],
          help: "1 minute = 60 seconds. 2 × 60 = 120. The answer is 120.",
          answer: 120,
          unit: "sec",
          min: 60,
          max: 200,
          coarse: 10,
        },
        // Compare: lowest price per liter. A 2.00, B 1.60 (best), C 2.50.
        {
          type: "compare",
          prompt: "Pick the cheapest fuel. Lowest price per liter wins.",
          help: "Each lane shows price per liter. Pick the smallest.",
          lanes: [
            { label: "$6 / 3 L", dollars: 6, liters: 3 }, // 2.00
            { label: "$8 / 5 L", dollars: 8, liters: 5 }, // 1.60 best
            { label: "$5 / 2 L", dollars: 5, liters: 2 }, // 2.50
          ],
        },
      ],
    };
  }
  // ---- Level 2: enrichment (larger / multi-step) ----------------------------
  return {
    hints: false,
    problems: [
      // 150 miles in 3 hours -> 50 mph; then 50 × 4 = 200 miles.
      {
        type: "multistep",
        prompt: "150 miles in 3 hours. How far in 4 hours? Set miles.",
        help: "150 ÷ 3 = 50 mph. Then 50 × 4 = 200. The answer is 200.",
        answer: 200,
        unit: "miles",
        min: 120,
        max: 280,
        coarse: 10,
      },
      // Percent: 20% of 40 = 8.
      {
        type: "percent",
        prompt: "What is 20% of 40 mph? Set the boost.",
        help: "20% of 40 = 0.20 × 40 = 8. The answer is 8 mph.",
        answer: 8,
        unit: "mph",
        min: 0,
        max: 24,
      },
      // Percent: 15% of 80 = 12.
      {
        type: "percent",
        prompt: "What is 15% of 80 liters? Set liters.",
        help: "15% of 80 = 0.15 × 80 = 12. The answer is 12 liters.",
        answer: 12,
        unit: "L",
        min: 0,
        max: 32,
      },
      // Equivalent ratio 7:2 scaled: 35 miles in 10 hours -> miles for? Actually
      // give 7 mi per 2 h; for 10 h, 10 ÷ 2 = 5, 7 × 5 = 35.
      {
        type: "multistep",
        prompt: "7 miles every 2 hours. How far in 10 hours? Set miles.",
        help: "10 ÷ 2 = 5, then 7 × 5 = 35. The answer is 35 miles.",
        answer: 35,
        unit: "miles",
        min: 0,
        max: 60,
        coarse: 1,
      },
      // Conversion: 3 minutes 30 s = 210 s. 3×60 + 30.
      {
        type: "conversion",
        prompt: "3 min 30 s is how many seconds? Set seconds.",
        help: "3 × 60 = 180, plus 30 = 210. The answer is 210.",
        answer: 210,
        unit: "sec",
        min: 120,
        max: 300,
        coarse: 10,
      },
      // Compare: A 1.80, B 1.50 (best), C 1.75.
      {
        type: "compare",
        prompt: "Pick the cheapest fuel. Lowest price per liter wins.",
        help: "Each lane shows price per liter. Pick the smallest.",
        lanes: [
          { label: "$9 / 5 L", dollars: 9, liters: 5 }, // 1.80
          { label: "$12 / 8 L", dollars: 12, liters: 8 }, // 1.50 best
          { label: "$7 / 4 L", dollars: 7, liters: 4 }, // 1.75
        ],
      },
      // Multi-step percent: $50 part costs, 30% off -> save 15.
      {
        type: "percent",
        prompt: "What is 30% of $50? Set the savings.",
        help: "30% of 50 = 0.30 × 50 = 15. You save $15.",
        answer: 15,
        unit: "$",
        min: 0,
        max: 40,
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

    // ---- Scene root ---------------------------------------------------------
    const group = new THREE.Group();
    scene.add(group);

    const disposables = []; // geometries + materials we own
    const track = (g, m) => {
      disposables.push(g, m);
      return new THREE.Mesh(g, m);
    };

    // ---- Stage / ground (receives shadow) -----------------------------------
    const groundMat = new THREE.MeshStandardMaterial({
      color: COLORS.track,
      roughness: 0.92,
      metalness: 0.05,
      emissive: COLORS.trackEmissive,
      emissiveIntensity: 0.12,
    });
    const ground = track(
      new RoundedBoxGeometry(
        LANE_COUNT * LANE_W + 2.4,
        0.6,
        TRACK_LEN,
        4,
        0.25,
      ),
      groundMat,
    );
    ground.position.set(0, -0.3, 0);
    ground.receiveShadow = true;
    group.add(ground);

    // Glowing lane dividers (emissive -> bloom).
    const railMat = new THREE.MeshStandardMaterial({
      color: COLORS.rail,
      roughness: 0.5,
      metalness: 0.3,
      emissive: COLORS.rail,
      emissiveIntensity: 0.5,
    });
    disposables.push(railMat);
    for (let i = 0; i <= LANE_COUNT; i++) {
      const railGeo = new RoundedBoxGeometry(0.12, 0.16, TRACK_LEN, 2, 0.06);
      disposables.push(railGeo);
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(laneX(i) - LANE_W / 2, 0.08, 0);
      rail.castShadow = true;
      group.add(rail);
    }

    // Finish line (emissive amber, glows).
    const finishMat = new THREE.MeshStandardMaterial({
      color: COLORS.finish,
      emissive: COLORS.finish,
      emissiveIntensity: 0.8,
      roughness: 0.4,
    });
    const finish = track(
      new RoundedBoxGeometry(LANE_COUNT * LANE_W + 2.0, 0.08, 0.7, 2, 0.04),
      finishMat,
    );
    finish.position.set(0, 0.1, -TRACK_LEN / 2 + 1.2);
    finish.receiveShadow = true;
    group.add(finish);

    // Goal pylons flanking the finish (lathe-style cones for prop variety).
    const pylonMat = new THREE.MeshStandardMaterial({
      color: COLORS.amber,
      emissive: COLORS.amber,
      emissiveIntensity: 0.4,
      roughness: 0.5,
    });
    disposables.push(pylonMat);
    [-1, 1].forEach((s) => {
      const pylGeo = new THREE.ConeGeometry(0.45, 1.4, 18);
      disposables.push(pylGeo);
      const pyl = new THREE.Mesh(pylGeo, pylonMat);
      pyl.position.set(
        (s * (LANE_COUNT * LANE_W)) / 2 + 0.4,
        0.7,
        -TRACK_LEN / 2 + 1.2,
      );
      pyl.castShadow = true;
      group.add(pyl);
    });

    // ---- Hero car (RoundedBox PBR + emissive accents, casts shadow) ---------
    function buildCar(color) {
      const car = new THREE.Group();
      const bodyGeo = new RoundedBoxGeometry(1.2, 0.55, 2.1, 4, 0.18);
      const bodyMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        metalness: 0.55,
        emissive: color,
        emissiveIntensity: 0.18,
      });
      disposables.push(bodyGeo, bodyMat);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.5;
      body.castShadow = true;
      car.add(body);

      // Glass cabin (physical material for a clearcoat-ish look).
      const cabGeo = new RoundedBoxGeometry(0.85, 0.42, 0.95, 4, 0.14);
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
      cabin.position.set(0, 0.92, -0.12);
      cabin.castShadow = true;
      car.add(cabin);

      // Glowing underglow strip (emissive -> bloom).
      const glowGeo = new RoundedBoxGeometry(1.3, 0.08, 2.2, 2, 0.04);
      const glowMat = new THREE.MeshStandardMaterial({
        color: COLORS.spark,
        emissive: COLORS.spark,
        emissiveIntensity: 0.9,
        roughness: 0.4,
      });
      disposables.push(glowGeo, glowMat);
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.y = 0.18;
      car.add(glow);

      // Wheels.
      const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 16);
      const wheelMat = new THREE.MeshStandardMaterial({
        color: 0x14151a,
        roughness: 0.7,
        metalness: 0.3,
      });
      disposables.push(wheelGeo, wheelMat);
      const wheels = [];
      [
        [-0.66, 0.3, 0.72],
        [0.66, 0.3, 0.72],
        [-0.66, 0.3, -0.72],
        [0.66, 0.3, -0.72],
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
    group.add(playerCar);

    // ---- 3D problem card (always shows the math) ----------------------------
    const cardSprite = makeLabel("", {
      fontSize: 56,
      scale: 1.5,
      color: "#ffffff",
      background: "rgba(12,26,51,0.92)",
      THREE,
    });
    cardSprite.position.set(0, 4.6, -TRACK_LEN / 2 + 6);
    group.add(cardSprite);

    // Live dial / readout sprite below the card.
    const dialSprite = makeLabel("", {
      fontSize: 72,
      scale: 1.5,
      color: "#0c1a33",
      background: "rgba(242,193,91,0.98)",
      THREE,
    });
    dialSprite.position.set(0, 3.0, -TRACK_LEN / 2 + 6);
    group.add(dialSprite);

    function disposeSprite(spr) {
      if (!spr) return;
      group.remove(spr);
      if (spr.material.map) spr.material.map.dispose();
      spr.material.dispose();
    }

    // ---- Compare-lane tags (canvas sprites) ---------------------------------
    let laneTags = []; // active compare tags
    function makeTag(text, highlight) {
      const spr = makeLabel(text, {
        fontSize: 52,
        scale: 1.1,
        color: highlight ? "#0c1a33" : "#ffffff",
        background: highlight ? "rgba(242,193,91,0.98)" : "rgba(20,35,63,0.94)",
        THREE,
      });
      return spr;
    }

    // ---- Round state --------------------------------------------------------
    let problemIndex = 0;
    let problem = null;
    let dial = 0;
    let laneSel = 0;
    let locked = false;
    let streak = 0;
    let bestStreak = 0;
    let solvedCount = 0;
    let raceAnim = null; // car launch tween
    let popAnim = null; // dial scale-pop
    const total = cfg.problems.length;

    const timers = [];
    let unbindPress = null;
    let unbindTap = null;
    let unbindFrame = null;

    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    const isCompare = () => problem && problem.type === "compare";

    function clearTags() {
      laneTags.forEach(disposeSprite);
      laneTags = [];
    }

    // ---- HUD + sprite sync --------------------------------------------------
    function readout() {
      if (isCompare()) {
        const ln = problem.lanes[laneSel];
        return `Lane ${laneSel + 1}: $${(ln.dollars / ln.liters).toFixed(2)}/L`;
      }
      return `${dial}${problem.unit ? " " + problem.unit : ""}`;
    }

    function updateHud() {
      const tableHint =
        problem.table && cfg.hints
          ? "  (table: " +
            problem.table.map((r) => r.join(":")).join("  ") +
            ")"
          : "";
      if (isCompare()) {
        hud.setObjective(`${problem.prompt} ▶ ${readout()}`);
      } else {
        hud.setObjective(`${problem.prompt} ▶ You: ${readout()}${tableHint}`);
      }
      // Mirror onto the 3D dial sprite + scale-pop.
      updateLabel(dialSprite, isCompare() ? readout() : readout());
      if (!reduced) {
        popAnim = { t: 0, dur: 0.18 };
      }
    }

    function showCard() {
      updateLabel(cardSprite, problem.prompt);
    }

    // ---- Compare tags -------------------------------------------------------
    function buildCompareTags() {
      problem.lanes.forEach((ln, i) => {
        const rate = (ln.dollars / ln.liters).toFixed(2);
        const spr = makeTag(
          `Lane ${i + 1}  ${ln.label}  $${rate}/L`,
          i === laneSel,
        );
        spr.position.set(laneX(i), 2.0, -TRACK_LEN / 2 + 4.5);
        spr.userData.lane = i;
        group.add(spr);
        laneTags.push(spr);
      });
    }
    function refreshCompareTags() {
      clearTags();
      buildCompareTags();
      // Slide the car under the chosen lane.
      if (reduced) playerCar.position.x = laneX(laneSel);
      else
        feel.tween({
          from: playerCar.position.x,
          to: laneX(laneSel),
          duration: 0.22,
          onUpdate: (v) => (playerCar.position.x = v),
        });
    }

    // ---- Round setup --------------------------------------------------------
    function startRound() {
      clearTags();
      locked = false;
      raceAnim = null;
      problem = cfg.problems[problemIndex];

      playerCar.position.set(
        isCompare() ? laneX(0) : 0,
        0,
        TRACK_LEN / 2 - 2.5,
      );
      playerCar.rotation.y = 0;

      hud.setLevel(level === 2 ? "Level 2" : "Level 1");
      if (typeof hud.setProgress === "function")
        hud.setProgress(problemIndex, total);

      showCard();

      if (isCompare()) {
        laneSel = 0;
        buildCompareTags();
        announce(
          `Round ${problemIndex + 1}. ${problem.prompt} Use left and right to pick a lane.`,
        );
      } else {
        dial = problem.min;
        announce(
          `Round ${problemIndex + 1}. ${problem.prompt} Use up and down to set the number.`,
        );
      }
      updateHud();
      feel.sfx("select");

      if (cfg.hints) {
        const tip = isCompare()
          ? "Pick the lowest price per liter."
          : problem.help || "Set the number, then press Space.";
        hud.message(tip, { tone: "info", duration: 3400 });
      }
    }

    function stepSize(coarse) {
      const base = problem.coarse || 1;
      return coarse ? base : 1;
    }

    function changeDial(delta) {
      if (locked || isCompare()) return;
      const next = Math.max(problem.min, Math.min(problem.max, dial + delta));
      if (next !== dial) {
        dial = next;
        updateHud();
        feel.sfx(delta > 0 ? "add" : "remove");
        announce(`Dial set to ${dial} ${problem.unit || ""}.`.trim());
      }
    }

    function changeLane(delta) {
      if (locked || !isCompare()) return;
      const next = Math.max(
        0,
        Math.min(problem.lanes.length - 1, laneSel + delta),
      );
      if (next !== laneSel) {
        laneSel = next;
        refreshCompareTags();
        updateHud();
        feel.sfx("select");
        const ln = problem.lanes[laneSel];
        announce(
          `Lane ${laneSel + 1}. ${ln.dollars} dollars for ${ln.liters} liters.`,
        );
      }
    }

    // ---- Commit / check -----------------------------------------------------
    function commit() {
      if (locked) return;
      if (isCompare()) {
        let bestIdx = 0,
          bestRate = Infinity;
        problem.lanes.forEach((ln, i) => {
          const r = ln.dollars / ln.liters;
          if (r < bestRate) {
            bestRate = r;
            bestIdx = i;
          }
        });
        if (laneSel !== bestIdx) {
          rejectRound(
            `Lane ${laneSel + 1} is not the best. Compare each price per liter.`,
          );
          return;
        }
        win("compare");
      } else {
        if (dial !== problem.answer) {
          const hint =
            dial < problem.answer
              ? "Try a higher value."
              : "Try a lower value.";
          rejectRound(`Not quite — ${hint}`);
          return;
        }
        win(problem.type);
      }
    }

    function rejectRound(msg) {
      streak = 0;
      if (typeof hud.setStreak === "function") hud.setStreak(0);
      if (typeof hud.feedback === "function") hud.feedback(false, msg);
      else hud.message(msg, { tone: "warn", duration: 2200 });
      feel.sfx("wrong");
      if (!reduced) feel.shake(0.16);
      announce(msg);
    }

    function win(detail) {
      locked = true;
      solvedCount += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      if (typeof hud.setStreak === "function") hud.setStreak(streak);

      const pts = 20 + (level === 2 ? 10 : 0);
      onScore(pts, { round: problemIndex + 1, detail });

      const summary = isCompare()
        ? `Best buy! Lane ${laneSel + 1} has the lowest unit price. +${pts}`
        : `Correct! ${problem.answer} ${problem.unit || ""}. +${pts}`.replace(
            "  ",
            " ",
          );
      if (typeof hud.feedback === "function") hud.feedback(true, summary);
      else hud.message(summary, { tone: "ok", duration: 2400 });
      announce(
        isCompare()
          ? `Correct. Lane ${laneSel + 1} is the best unit price. You earned ${pts} points.`
          : `Correct. The answer is ${problem.answer} ${problem.unit || ""}. You earned ${pts} points.`,
      );
      caption(problem.help || "");

      feel.sfx("correct");
      feel.burst(
        { x: playerCar.position.x, y: 1.4, z: playerCar.position.z },
        { color: COLORS.spark, count: reduced ? 0 : 34, spread: 4.2 },
      );
      if (!reduced) feel.shake(0.26);

      // Launch the car to the finish as the reward.
      raceAnim = {
        from: playerCar.position.z,
        to: -TRACK_LEN / 2 + 2.2,
        t: 0,
        dur: reduced ? 0.01 : 1.2,
      };

      later(() => {
        if (problemIndex < total - 1) {
          problemIndex += 1;
          startRound();
        } else {
          finishGame();
        }
      }, 2200);
    }

    function finishGame() {
      hud.setObjective(
        `Finished! You solved ${solvedCount} of ${total}. Great job!`,
      );
      hud.message("🏁 All rounds complete!", { tone: "ok", duration: 0 });
      updateLabel(cardSprite, "🏁 RACE COMPLETE");
      updateLabel(dialSprite, `${solvedCount} / ${total}`);
      feel.sfx("fanfare");
      if (!reduced) {
        // Confetti burst over the finish line.
        feel.burst(
          { x: 0, y: 2.4, z: -TRACK_LEN / 2 + 2.2 },
          { color: COLORS.amber, count: 60, spread: 7 },
        );
        feel.shake(0.3);
      }
      announce(
        `All rounds complete. You solved ${solvedCount} with a best streak of ${bestStreak}. Great tuning, racer.`,
      );
    }

    // ---- Tap: pick a lane (compare) or lock in (numeric) --------------------
    function handleTap() {
      if (locked) return;
      if (isCompare()) {
        const hits = input.raycast(camera, laneTags, false);
        if (hits.length && hits[0].object.userData.lane != null) {
          laneSel = hits[0].object.userData.lane;
          refreshCompareTags();
          updateHud();
          feel.sfx("select");
        }
        commit();
      } else {
        commit();
      }
    }

    return {
      start() {
        // Animated camera intro: sweep from a high wide shot into framing.
        const framePos = { x: 0, y: 8.5, z: 15 };
        if (reduced) {
          camera.position.set(framePos.x, framePos.y, framePos.z);
          camera.lookAt(0, 0, -2);
          feel.syncCamera();
        } else {
          camera.position.set(-6, 16, 24);
          camera.lookAt(0, 0, -2);
          const from = camera.position.clone();
          feel.tween({
            from: 0,
            to: 1,
            duration: 1.3,
            onUpdate: (p) => {
              camera.position.set(
                from.x + (framePos.x - from.x) * p,
                from.y + (framePos.y - from.y) * p,
                from.z + (framePos.z - from.z) * p,
              );
              camera.lookAt(0, 0, -2);
            },
            onComplete: () => feel.syncCamera(),
          });
        }

        startRound();

        unbindPress = input.onPress((name) => {
          if (locked) return;
          if (isCompare()) {
            if (name === "left") changeLane(-1);
            else if (name === "right") changeLane(1);
            else if (name === "action") commit();
          } else {
            if (name === "up") changeDial(stepSize(false));
            else if (name === "down") changeDial(-stepSize(false));
            else if (name === "right") changeDial(stepSize(true));
            else if (name === "left") changeDial(-stepSize(true));
            else if (name === "action") commit();
          }
          if (name === "confirm") {
            const h = problem.help || "Set the number, then press Space.";
            caption(h);
            announce(h);
            feel.sfx("pop");
            later(() => caption(""), 2600);
          }
        });

        unbindTap = input.onTap(handleTap);

        unbindFrame = ctx.onFrame((dt, t) => {
          // Car launch tween.
          if (raceAnim) {
            raceAnim.t = Math.min(1, raceAnim.t + dt / raceAnim.dur);
            const e = 1 - Math.pow(1 - raceAnim.t, 3);
            playerCar.position.z =
              raceAnim.from + (raceAnim.to - raceAnim.from) * e;
            if (!reduced && playerCar.userData.wheels)
              playerCar.userData.wheels.forEach(
                (w) => (w.rotation.x += dt * 14),
              );
            if (raceAnim.t >= 1) raceAnim = null;
          } else if (!reduced) {
            // Gentle idle bob + sway.
            playerCar.position.y = Math.sin(t * 2.5) * 0.04;
            playerCar.rotation.z = Math.sin(t * 1.8) * 0.015;
          }
          // Dial sprite scale-pop on change.
          if (popAnim) {
            popAnim.t = Math.min(1, popAnim.t + dt / popAnim.dur);
            const k = 1 + Math.sin(popAnim.t * Math.PI) * 0.18;
            dialSprite.scale.set(dialSprite.scale.x, 1.5 * k, 1);
            if (popAnim.t >= 1) popAnim = null;
          }
          // Subtle finish-line emissive pulse.
          if (!reduced) {
            finishMat.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.25;
          }
        });
      },

      dispose() {
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        clearTags();
        disposeSprite(cardSprite);
        disposeSprite(dialSprite);
        disposables.forEach((d) => d.dispose && d.dispose());
        scene.remove(group);
      },
    };
  },
};
