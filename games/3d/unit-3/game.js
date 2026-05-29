const COLORS = {
  track: 0x18466f,
  rail: 0x2f6aa0,
  car: [0x1fa6a2, 0x4f8fd0, 0xe09b4a, 0x8b6fc4],
  dialOk: 0x4aa978,
  dialActive: 0xf2c15b,
  laneBest: 0x4aa978,
  laneBad: 0xb64e2f,
  finish: 0xf2c15b,
};

const LANE_W = 2.2;
const TRACK_LEN = 26;

// ---- Math problem banks ------------------------------------------------------
// Each problem returns { type, prompt, answer, unit, build } and optional
// scaffolds. Answers are exact integers or one-decimal values so the dial can
// reach them. Math is verified in comments where non-obvious.

function makeLevel(level) {
  if (level === 1) {
    return {
      hints: true,
      step: 1,
      problems: [
        // Unit rate: 12 miles in 3 hours -> 4 mph. 12/3 = 4.
        {
          type: "unitrate",
          prompt:
            "Car goes 12 miles in 3 hours. Set the speed (miles per hour).",
          table: [
            ["miles", "hours"],
            ["12", "3"],
          ],
          help: "Unit rate = distance ÷ time = 12 ÷ 3.",
          answer: 4,
          unit: "mph",
          min: 0,
          max: 12,
        },
        // Unit rate: $10 for 2 toy cars -> $5 each. 10/2 = 5.
        {
          type: "unitrate",
          prompt: "$10 buys 2 toy cars. Set the price for 1 car (dollars).",
          table: [
            ["dollars", "cars"],
            ["10", "2"],
          ],
          help: "Unit rate = dollars ÷ cars = 10 ÷ 2.",
          answer: 5,
          unit: "$/car",
          min: 0,
          max: 12,
        },
        // Equivalent rate: 4 mph stays 4 mph; fill miles for 5 hours -> 20.
        {
          type: "equiv",
          prompt: "At 4 miles per hour, how far in 5 hours? Set the miles.",
          table: [
            ["miles", "hours"],
            ["4", "1"],
            ["?", "5"],
          ],
          help: "Equivalent rate: multiply both by 5. 4 × 5 = 20.",
          answer: 20,
          unit: "miles",
          min: 0,
          max: 28,
        },
      ],
    };
  }
  return {
    hints: false,
    step: 1,
    problems: [
      // Percent boost: 20% of 40 = 8. New base speed reads 40 + 8 later.
      {
        type: "percent",
        prompt:
          "Base speed is 40 mph. A 20% boost adds how many mph? Set the boost.",
        help: "20% of 40 = 0.20 × 40 = 8.",
        answer: 8,
        unit: "mph",
        min: 0,
        max: 24,
      },
      // Multi-step rate: 150 miles in 3 hours -> 50 mph; then 50 mph for 4 h?
      // The asked answer is the 4-hour distance: 50 × 4 = 200.
      {
        type: "multistep",
        prompt:
          "150 miles in 3 hours. At that same rate, how far in 4 hours? Set the miles.",
        help: "First the unit rate: 150 ÷ 3 = 50 mph. Then 50 × 4 = 200.",
        answer: 200,
        unit: "miles",
        min: 120,
        max: 280,
        coarse: 10,
      },
      // Conversion: 2 minutes = 120 seconds. 2 × 60 = 120.
      {
        type: "conversion",
        prompt: "Convert the pit time: 2 minutes equals how many seconds?",
        help: "1 minute = 60 seconds, so 2 × 60 = 120.",
        answer: 120,
        unit: "sec",
        min: 60,
        max: 200,
        coarse: 10,
      },
      // Comparison shopping: pick the BEST (lowest) unit price.
      // Lane A: $6 for 3 L -> $2.00/L. Lane B: $8 for 5 L -> $1.60/L (best).
      // Lane C: $5 for 2 L -> $2.50/L.
      {
        type: "compare",
        prompt: "Pick the fuel with the best (lowest) price per liter.",
        help: "Find each unit rate: dollars ÷ liters. Smallest wins.",
        lanes: [
          { label: "$6 / 3 L", dollars: 6, liters: 3 }, // 2.00
          { label: "$8 / 5 L", dollars: 8, liters: 5 }, // 1.60 best
          { label: "$5 / 2 L", dollars: 5, liters: 2 }, // 2.50
        ],
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
      term: "Percent",
      definition:
        "A part out of 100. 20% means 20 out of every 100, or 0.20 of the whole.",
      emoji: "％",
    },
    {
      term: "Equivalent ratio",
      definition:
        "A ratio that names the same comparison, made by multiplying or dividing both numbers.",
      emoji: "🟰",
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
    const laneCount = 3;

    // ---- Scene -------------------------------------------------------------
    const group = new THREE.Group();
    scene.add(group);

    const trackMat = new THREE.MeshStandardMaterial({
      color: COLORS.track,
      roughness: 0.95,
    });
    const railMat = new THREE.MeshStandardMaterial({
      color: COLORS.rail,
      roughness: 0.8,
    });
    const disposables = [trackMat, railMat];

    const laneX = (i) => (i - (laneCount - 1) / 2) * LANE_W;

    // Road bed.
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(laneCount * LANE_W + 1.2, 0.4, TRACK_LEN),
      trackMat,
    );
    road.position.set(0, -0.2, 0);
    group.add(road);

    // Lane dividers.
    for (let i = 0; i <= laneCount; i++) {
      const x = laneX(i) - LANE_W / 2;
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.18, TRACK_LEN),
        railMat,
      );
      rail.position.set(x, 0.05, 0);
      group.add(rail);
    }

    // Finish line.
    const finish = new THREE.Mesh(
      new THREE.BoxGeometry(laneCount * LANE_W + 1.2, 0.06, 0.8),
      new THREE.MeshStandardMaterial({
        color: COLORS.finish,
        emissive: COLORS.finish,
        emissiveIntensity: 0.3,
      }),
    );
    finish.position.set(0, 0.06, -TRACK_LEN / 2 + 1);
    group.add(finish);

    // ---- Car ---------------------------------------------------------------
    function buildCar(color) {
      const car = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.5, 2.0),
        new THREE.MeshStandardMaterial({ color, roughness: 0.5 }),
      );
      body.position.y = 0.45;
      car.add(body);
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.4, 0.9),
        new THREE.MeshStandardMaterial({ color: 0xeaf2ff, roughness: 0.4 }),
      );
      cabin.position.set(0, 0.85, -0.1);
      car.add(cabin);
      const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 12);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      [
        [-0.6, 0.25, 0.7],
        [0.6, 0.25, 0.7],
        [-0.6, 0.25, -0.7],
        [0.6, 0.25, -0.7],
      ].forEach(([x, y, z]) => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(x, y, z);
        car.add(w);
      });
      return car;
    }

    const playerCar = buildCar(COLORS.car[0]);
    group.add(playerCar);

    // ---- Floating sprite labels (rate table / lane tags) -------------------
    function roundRect(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    function makeTextSprite(lines, opts = {}) {
      const pad = 14;
      const lh = opts.lineHeight || 34;
      const fs = opts.fontSize || 26;
      const w = opts.width || 240;
      const h = pad * 2 + lh * lines.length;
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const c = cv.getContext("2d");
      c.fillStyle = opts.bg || "rgba(18,53,91,0.92)";
      roundRect(c, 2, 2, w - 4, h - 4, 16);
      c.fill();
      if (opts.border) {
        c.lineWidth = 4;
        c.strokeStyle = opts.border;
        c.stroke();
      }
      c.fillStyle = opts.color || "#ffffff";
      c.font = `bold ${fs}px system-ui, sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      lines.forEach((ln, i) => {
        c.fillText(ln, w / 2, pad + lh * (i + 0.5));
      });
      const tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearFilter;
      const spr = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthTest: false,
        }),
      );
      spr.scale.set((w / 160) * 1.6, (h / 160) * 1.6, 1);
      return spr;
    }

    function disposeSprite(spr) {
      if (!spr) return;
      group.remove(spr);
      if (spr.material.map) spr.material.map.dispose();
      spr.material.dispose();
    }

    // ---- Round state -------------------------------------------------------
    let problemIndex = 0;
    let problem = null;
    let dial = 0; // current dialed value (for numeric problems)
    let laneSel = 0; // current lane (for compare problems)
    let locked = false; // round solved, animating
    let infoSprites = [];
    const timers = [];
    let unbindPress = null;
    let unbindTap = null;
    let unbindFrame = null;

    let raceAnim = null; // { from, to, t, dur } for player car z

    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    function clearInfo() {
      infoSprites.forEach(disposeSprite);
      infoSprites = [];
    }

    function isCompare() {
      return problem && problem.type === "compare";
    }

    function stepSize(coarse) {
      const base = problem.coarse || cfg.step;
      return coarse ? base : cfg.step;
    }

    // Live computed readout for the HUD.
    function readout() {
      if (isCompare()) {
        const ln = problem.lanes[laneSel];
        const rate = ln.dollars / ln.liters;
        return `Lane ${laneSel + 1}: ${ln.label} = $${rate.toFixed(2)}/L`;
      }
      return `${problem.unit ? dial + " " + problem.unit : dial}`;
    }

    function updateHud() {
      if (isCompare()) {
        hud.setObjective(`Best price per liter? — ${readout()}`);
      } else {
        hud.setObjective(`${problem.prompt}  ▶ Dial: ${readout()}`);
      }
    }

    // ---- Lane tag sprites for compare rounds -------------------------------
    function buildCompareTags() {
      problem.lanes.forEach((ln, i) => {
        const rate = ln.dollars / ln.liters;
        const spr = makeTextSprite(
          [`Lane ${i + 1}`, ln.label, `$${rate.toFixed(2)}/L`],
          {
            width: 200,
            fontSize: 22,
            lineHeight: 30,
            border: i === laneSel ? "#f2c15b" : null,
          },
        );
        spr.position.set(laneX(i), 2.2, -TRACK_LEN / 2 + 4);
        spr.userData.lane = i;
        spr.userData.rate = rate;
        group.add(spr);
        infoSprites.push(spr);
      });
    }

    function refreshCompareTags() {
      // Rebuild borders to show selection.
      clearInfo();
      buildCompareTags();
      playerCar.position.x = laneX(laneSel);
    }

    // ---- Rate-table sprite for numeric rounds ------------------------------
    function buildTableSprite() {
      if (!problem.table) return;
      const lines = problem.table.map((row) => row.join("   |   "));
      const spr = makeTextSprite(lines, {
        width: 260,
        fontSize: 24,
        lineHeight: 32,
      });
      spr.position.set(0, 3.0, -TRACK_LEN / 2 + 5);
      group.add(spr);
      infoSprites.push(spr);
    }

    // ---- Round setup -------------------------------------------------------
    function startRound() {
      clearInfo();
      locked = false;
      raceAnim = null;
      problem = cfg.problems[problemIndex];
      playerCar.position.set(isCompare() ? laneX(0) : 0, 0, TRACK_LEN / 2 - 2);
      playerCar.rotation.y = 0;

      hud.setLevel(level === 2 ? "Level 2" : "Level 1");

      if (isCompare()) {
        laneSel = 0;
        buildCompareTags();
        announce(
          `Round ${problemIndex + 1}. ${problem.prompt} Use left and right to choose a lane, then press the action button.`,
        );
      } else {
        dial = problem.min;
        buildTableSprite();
        announce(
          `Round ${problemIndex + 1}. ${problem.prompt} Use up and down to change the dial, then press the action button to lock it in.`,
        );
      }
      updateHud();

      if (cfg.hints) {
        const tip = isCompare()
          ? "Compare the unit rates — lowest price per liter wins."
          : problem.help || "Set the dial, then lock it in.";
        hud.message(tip, { tone: "info", duration: 3200 });
      }
    }

    // ---- Numeric dial input ------------------------------------------------
    function changeDial(delta) {
      if (locked || isCompare()) return;
      const next = Math.max(problem.min, Math.min(problem.max, dial + delta));
      if (next !== dial) {
        dial = next;
        updateHud();
        announce(`Dial set to ${dial} ${problem.unit || ""}.`.trim() + ".");
      }
    }

    // ---- Lane select input -------------------------------------------------
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
        const ln = problem.lanes[laneSel];
        announce(
          `Lane ${laneSel + 1}. ${ln.dollars} dollars for ${ln.liters} liters.`,
        );
      }
    }

    // ---- Commit / check ----------------------------------------------------
    function commit() {
      if (locked) return;

      let correct;
      let detail;
      if (isCompare()) {
        let bestIdx = 0;
        let bestRate = Infinity;
        problem.lanes.forEach((ln, i) => {
          const r = ln.dollars / ln.liters;
          if (r < bestRate) {
            bestRate = r;
            bestIdx = i;
          }
        });
        correct = laneSel === bestIdx;
        detail = "compare";
        if (!correct) {
          rejectRound(
            `Lane ${laneSel + 1} is not the best. Compare each price per liter.`,
          );
          return;
        }
      } else {
        correct = dial === problem.answer;
        detail = problem.type;
        if (!correct) {
          const hint =
            dial < problem.answer
              ? "Try a higher value."
              : "Try a lower value.";
          rejectRound(`Not quite — ${hint}`);
          return;
        }
      }

      win(detail);
    }

    function rejectRound(msg) {
      hud.message(msg, { tone: "warn", duration: 2200 });
      feel.shake(0.16);
      announce(msg);
    }

    function win(detail) {
      locked = true;
      const base = 20;
      const levelBonus = level === 2 ? 10 : 0;
      const pts = base + levelBonus;
      onScore(pts, { round: problemIndex + 1, detail });

      const summary = isCompare()
        ? `Best buy! Lane ${laneSel + 1} has the lowest unit price. +${pts}`
        : `Correct! ${problem.answer} ${problem.unit || ""}. +${pts}`.replace(
            "  ",
            " ",
          );
      hud.message(summary, { tone: "ok", duration: 2400 });
      announce(
        isCompare()
          ? `Correct. Lane ${laneSel + 1} is the best unit price. You earned ${pts} points.`
          : `Correct. The answer is ${problem.answer} ${problem.unit || ""}. You earned ${pts} points.`,
      );
      caption(problem.help || "");

      feel.burst(
        { x: playerCar.position.x, y: 1.4, z: playerCar.position.z },
        {
          color: COLORS.dialActive,
          count: feel.reducedMotion ? 0 : 32,
          spread: 4,
        },
      );
      feel.shake(0.28);

      // Race the car to the finish line as the reward.
      raceAnim = {
        from: playerCar.position.z,
        to: -TRACK_LEN / 2 + 1.5,
        t: 0,
        dur: feel.reducedMotion ? 0.01 : 1.2,
      };

      later(() => {
        if (problemIndex < cfg.problems.length - 1) {
          problemIndex += 1;
          startRound();
        } else {
          hud.setObjective("All races won! Great tuning, racer.");
          hud.message("All rounds complete!", { tone: "ok", duration: 0 });
          announce("All rounds complete. Great tuning, racer.");
        }
      }, 2200);
    }

    // ---- Pointer: tap a lane (compare) or tap to lock (numeric) -----------
    function handleTap() {
      if (locked) return;
      if (isCompare()) {
        const hits = input.raycast(camera, infoSprites, false);
        if (hits.length && hits[0].object.userData.lane != null) {
          laneSel = hits[0].object.userData.lane;
          refreshCompareTags();
          updateHud();
        }
        commit();
      } else {
        commit();
      }
    }

    return {
      start() {
        camera.position.set(0, 9, 16);
        camera.lookAt(0, 0, -2);
        feel.syncCamera();

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
            // Read the current help aloud for support.
            const h = problem.help || "Set the dial to the correct value.";
            caption(h);
            announce(h);
            later(() => caption(""), 2400);
          }
        });

        unbindTap = input.onTap(handleTap);

        unbindFrame = ctx.onFrame((dt, t) => {
          // Idle bob on the player car when not racing.
          if (raceAnim) {
            raceAnim.t = Math.min(1, raceAnim.t + dt / raceAnim.dur);
            const e = 1 - Math.pow(1 - raceAnim.t, 3); // ease-out
            playerCar.position.z =
              raceAnim.from + (raceAnim.to - raceAnim.from) * e;
            if (raceAnim.t >= 1) raceAnim = null;
          } else if (!feel.reducedMotion) {
            playerCar.position.y = Math.sin(t * 3) * 0.03;
          }
          // Spin wheels while racing.
          if (raceAnim && !feel.reducedMotion) {
            playerCar.children.forEach((c) => {
              if (c.geometry && c.geometry.type === "CylinderGeometry")
                c.rotation.x += dt * 8;
            });
          }
        });
      },

      dispose() {
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        clearInfo();
        disposables.forEach((m) => m.dispose());
      },
    };
  },
};
