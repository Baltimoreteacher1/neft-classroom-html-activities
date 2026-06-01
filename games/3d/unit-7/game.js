import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";

// ============================================================================
// Unit 7 — Submarine: Dive the Number Line
// Standard: 6.NS.C.5–7 (integers, opposites, absolute value, comparing/ordering)
// Theme: pilot a deep-sea submarine along a vertical number line where 0 is
// sea level, positives are above the surface, negatives are below.
// Level 1 = scaffolded (smaller range, hints). Level 2 = enrichment (larger
// range, multi-step compare/order). 6–8 rounds per level.
// ============================================================================

const COLORS = {
  sky: 0x0b3d66,
  water: 0x1f6f9c,
  waterDeep: 0x0a2c4a,
  surface: 0xbfe6ff,
  sub: 0xf2c15b,
  subTrim: 0xd9795d,
  glass: 0x9fe6ff,
  target: 0x4aa978,
  targetBad: 0xb64e2f,
  tick: 0xbfe6ff,
  tickZero: 0xffffff,
  spine: 0x4fb6e0,
};

const UNIT = 0.62; // world units per integer step on the number line

function makeLevel(level) {
  if (level === 1) {
    return {
      min: -6,
      max: 6,
      hints: true,
      rounds: [
        { kind: "move", target: 3 },
        { kind: "move", target: -4 },
        { kind: "opposite", value: 2 },
        { kind: "opposite", value: -5 },
        {
          kind: "absolute",
          value: -3,
          context: "A diver is 3 m below sea level.",
        },
        { kind: "compare", a: -2, b: 4, pick: "greater" },
        { kind: "order", values: [-4, 1, 5], pick: "least" },
      ],
    };
  }
  return {
    min: -10,
    max: 10,
    hints: false,
    rounds: [
      {
        kind: "absolute",
        value: -7,
        context: "A submarine sits 7 m below sea level.",
      },
      {
        kind: "absolute",
        value: 6,
        context: "A gull glides 6 m above sea level.",
      },
      { kind: "opposite", value: -8 },
      { kind: "compare", a: -8, b: -3, pick: "greater" },
      { kind: "compare", a: 5, b: -9, pick: "less" },
      { kind: "order", values: [-6, -2, 3, 8], pick: "greatest" },
      { kind: "order", values: [9, -4, -10, 2], pick: "least" },
      {
        kind: "absDist",
        a: -4,
        b: 0,
        context: "How far is -4 from sea level?",
      },
    ],
  };
}

export default {
  id: "unit-7-submarine",
  vocab: [
    {
      term: "Integer",
      definition: "A whole number that can be positive, negative, or zero.",
      emoji: "🔢",
    },
    {
      term: "Negative number",
      definition:
        "A number less than zero, like -3. Here it means below the surface.",
      emoji: "⬇️",
    },
    {
      term: "Opposite",
      definition:
        "Two numbers the same distance from zero, on opposite sides. 4 and -4 are opposites.",
      emoji: "↕️",
    },
    {
      term: "Number line",
      definition:
        "A line where numbers are placed in order. Up is positive, down is negative.",
      emoji: "📏",
    },
    {
      term: "Absolute value",
      definition:
        "How far a number is from zero. It is never negative. The absolute value of -7 is 7.",
      emoji: "📐",
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
    const RANGE_MIN = cfg.min;
    const RANGE_MAX = cfg.max;
    const reduced = feel.reducedMotion;

    // ---- Clarity / onboarding kit (shared overlay over the canvas) ----------
    // Mount element is the same positioned container that hosts the canvas.
    const clarityMount = renderer.domElement.parentElement || document.body;
    let clarity = null;

    const yFor = (n) => n * UNIT;

    const group = new THREE.Group();
    scene.add(group);

    const disposables = [];
    const track = (obj) => {
      if (obj.geometry) disposables.push(obj.geometry);
      if (obj.material) disposables.push(obj.material);
      return obj;
    };

    const columnHeight = (RANGE_MAX - RANGE_MIN) * UNIT + UNIT * 2;
    const columnTopY = yFor(RANGE_MAX) + UNIT;
    const columnMidY = (yFor(RANGE_MAX) + yFor(RANGE_MIN)) / 2;

    // ---- Stage floor (receives shadows) -------------------------------------
    const floorGeo = new THREE.CircleGeometry(9, 48);
    const floor = new THREE.Mesh(
      floorGeo,
      new THREE.MeshStandardMaterial({
        color: COLORS.waterDeep,
        roughness: 0.95,
        metalness: 0.05,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = yFor(RANGE_MIN) - UNIT * 1.4;
    floor.receiveShadow = true;
    track(floor);
    group.add(floor);

    // ---- Water column (PBR glassy volume) -----------------------------------
    const waterGeo = new RoundedBoxGeometry(3.0, columnHeight, 3.0, 4, 0.25);
    const water = new THREE.Mesh(
      waterGeo,
      new THREE.MeshPhysicalMaterial({
        color: COLORS.water,
        transparent: true,
        opacity: 0.28,
        roughness: 0.12,
        metalness: 0.0,
        transmission: 0.6,
        thickness: 1.5,
        ior: 1.33,
      }),
    );
    water.position.y = columnMidY;
    track(water);
    group.add(water);

    // Surface slab at 0 — glows so bloom catches it.
    const surfGeo = new RoundedBoxGeometry(3.4, 0.08, 3.4, 3, 0.04);
    const surface = new THREE.Mesh(
      surfGeo,
      new THREE.MeshStandardMaterial({
        color: COLORS.surface,
        transparent: true,
        opacity: 0.6,
        roughness: 0.2,
        emissive: COLORS.surface,
        emissiveIntensity: 0.5,
      }),
    );
    surface.position.y = 0;
    track(surface);
    group.add(surface);

    // Seabed block below the lowest integer.
    const bedGeo = new RoundedBoxGeometry(3.8, 0.5, 3.8, 3, 0.12);
    const bed = new THREE.Mesh(
      bedGeo,
      new THREE.MeshStandardMaterial({ color: COLORS.waterDeep, roughness: 1 }),
    );
    bed.position.y = yFor(RANGE_MIN) - UNIT;
    bed.receiveShadow = true;
    bed.castShadow = true;
    track(bed);
    group.add(bed);

    // ---- Number-line spine + ticks + labels ---------------------------------
    const spineGeo = new RoundedBoxGeometry(0.07, columnHeight, 0.07, 2, 0.03);
    const spine = new THREE.Mesh(
      spineGeo,
      new THREE.MeshStandardMaterial({
        color: COLORS.spine,
        emissive: COLORS.spine,
        emissiveIntensity: 0.35,
        roughness: 0.4,
        metalness: 0.3,
      }),
    );
    spine.position.set(-1.5, columnMidY, 0);
    track(spine);
    group.add(spine);

    const tickGeo = new RoundedBoxGeometry(0.5, 0.06, 0.06, 2, 0.02);
    const zeroTickGeo = new RoundedBoxGeometry(0.78, 0.08, 0.08, 2, 0.03);
    disposables.push(tickGeo, zeroTickGeo);

    const lineLabels = [];
    for (let n = RANGE_MIN; n <= RANGE_MAX; n++) {
      const isZero = n === 0;
      const tick = new THREE.Mesh(
        isZero ? zeroTickGeo : tickGeo,
        new THREE.MeshStandardMaterial({
          color: isZero ? COLORS.tickZero : COLORS.tick,
          emissive: isZero ? COLORS.tickZero : 0x000000,
          emissiveIntensity: isZero ? 0.6 : 0,
          roughness: 0.5,
        }),
      );
      tick.position.set(-1.5, yFor(n), 0);
      tick.castShadow = true;
      track(tick);
      group.add(tick);

      const label = makeLabel(String(n), {
        THREE,
        color: isZero ? "#ffffff" : "#eaf6ff",
        // Dark high-contrast chip so every integer reads clearly against water.
        background: isZero ? "rgba(20,60,100,0.95)" : "rgba(11,28,48,0.92)",
        fontSize: isZero ? 96 : 84,
        scale: isZero ? 1.1 : 0.95,
      });
      label.position.set(-2.55, yFor(n), 0);
      lineLabels.push(label);
      group.add(label);
    }

    const seaLabel = makeLabel("0 = sea level", {
      THREE,
      color: "#ffffff",
      background: "rgba(15,34,56,0.92)",
      fontSize: 56,
      scale: 0.72,
    });
    seaLabel.position.set(1.2, 0.0, 1.8);
    group.add(seaLabel);

    // ---- Big live depth read-out that rides next to the submarine ----------
    const depthLabel = makeLabel("0", {
      THREE,
      color: "#ffe08a",
      background: "rgba(11,28,48,0.95)",
      fontSize: 110,
      scale: 1.05,
    });
    depthLabel.position.set(1.7, yFor(0), 0);
    group.add(depthLabel);

    // ---- Floating 3D problem card (always shows the question) ---------------
    const cardLabel = makeLabel("...", {
      THREE,
      color: "#ffffff",
      background: "rgba(11,40,66,0.95)",
      fontSize: 72,
      scale: 0.82,
      maxWidth: 1280,
    });
    cardLabel.position.set(0, columnTopY + 1.4, 0);
    group.add(cardLabel);

    // ---- Submarine (rounded, PBR, casts shadow) -----------------------------
    const subGroup = new THREE.Group();

    const hull = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.36, 0.78, 6, 14),
      new THREE.MeshStandardMaterial({
        color: COLORS.sub,
        roughness: 0.35,
        metalness: 0.45,
      }),
    );
    hull.rotation.z = Math.PI / 2;
    hull.castShadow = true;
    track(hull);
    subGroup.add(hull);

    const tower = new THREE.Mesh(
      new RoundedBoxGeometry(0.26, 0.3, 0.26, 3, 0.06),
      new THREE.MeshStandardMaterial({
        color: COLORS.subTrim,
        roughness: 0.5,
        metalness: 0.3,
      }),
    );
    tower.position.y = 0.36;
    tower.castShadow = true;
    track(tower);
    subGroup.add(tower);

    const fin = new THREE.Mesh(
      new RoundedBoxGeometry(0.5, 0.18, 0.06, 2, 0.03),
      new THREE.MeshStandardMaterial({
        color: COLORS.subTrim,
        roughness: 0.5,
        metalness: 0.3,
      }),
    );
    fin.position.set(-0.5, 0, 0);
    fin.castShadow = true;
    track(fin);
    subGroup.add(fin);

    // Glowing porthead light — bloom makes it pop.
    const portMat = new THREE.MeshPhysicalMaterial({
      color: COLORS.glass,
      emissive: COLORS.glass,
      emissiveIntensity: 0.9,
      roughness: 0.05,
      metalness: 0,
      transmission: 0.4,
      ior: 1.4,
    });
    const port = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 12),
      portMat,
    );
    port.position.set(0.52, 0, 0);
    track(port);
    subGroup.add(port);

    subGroup.position.set(0, yFor(0), 0);
    subGroup.scale.setScalar(0.001); // spawn-pop on start
    group.add(subGroup);

    // ---- Target band the sub must reach -------------------------------------
    const markerGeo = new RoundedBoxGeometry(1.25, UNIT * 0.55, 1.25, 3, 0.1);
    disposables.push(markerGeo);
    const markerMat = new THREE.MeshStandardMaterial({
      color: COLORS.target,
      transparent: true,
      opacity: 0.4,
      roughness: 0.3,
      emissive: COLORS.target,
      emissiveIntensity: 0.7,
    });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    track(marker);
    marker.visible = false;
    group.add(marker);

    // ---- Round state --------------------------------------------------------
    let pos = 0;
    let round = null;
    let roundIndex = 0;
    let targetInt = null;
    let solved = false;
    let started = false;
    let streak = 0;
    let bestStreak = 0;
    let solvedCount = 0;
    let unbindFrame = null;
    let unbindPress = null;
    let unbindTap = null;

    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    function depthWord(n) {
      if (n > 0) return `${n} (${Math.abs(n)} above sea level)`;
      if (n < 0) return `${n} (${Math.abs(n)} below sea level)`;
      return "0 (at sea level)";
    }

    function setSubY(n, animate) {
      const toY = yFor(n);
      depthLabel.position.y = toY;
      updateLabel(depthLabel, String(n));
      if (animate && !reduced) {
        const fromY = subGroup.position.y;
        feel.tween({
          from: 0,
          to: 1,
          duration: 0.22,
          onUpdate: (t) => {
            subGroup.position.y = fromY + (toY - fromY) * t;
          },
        });
      } else {
        subGroup.position.y = toY;
      }
    }

    function cardText() {
      if (!round) return "Pilot the submarine";
      switch (round.kind) {
        case "move":
          return `Dive the sub to ${round.target}`;
        case "opposite":
          return `Go to the opposite of ${round.value}. (Answer: ${-round.value})`;
        case "absolute":
        case "absDist":
          return `Go to ${targetInt}`;
        case "compare":
          return `Go to the ${round.pick} one: ${round.a} or ${round.b}`;
        case "order":
          return `Go to the ${round.pick}: ${round.values.join(", ")}`;
        default:
          return "Move the sub";
      }
    }

    function roundObjective() {
      if (!round) return "Pilot the submarine";
      switch (round.kind) {
        case "move":
          return `Dive to ${round.target}. Press Space.`;
        case "opposite":
          return `Go to ${-round.value} (opposite of ${round.value}). Press Space.`;
        case "absolute":
        case "absDist":
          return `Go to ${targetInt}. Press Space.`;
        case "compare":
          return `Go to the ${round.pick}: ${round.a} or ${round.b}. Press Space.`;
        case "order":
          return `Go to the ${round.pick}: ${round.values.join(", ")}. Press Space.`;
        default:
          return "Move the sub.";
      }
    }

    function computeTarget(r) {
      switch (r.kind) {
        case "move":
          return r.target;
        case "opposite":
          return -r.value;
        case "absolute":
          return r.value;
        case "absDist":
          return r.a; // pilot to the integer; absolute value is the distance
        case "compare":
          return r.pick === "greater" ? Math.max(r.a, r.b) : Math.min(r.a, r.b);
        case "order":
          return r.pick === "greatest"
            ? Math.max(...r.values)
            : Math.min(...r.values);
        default:
          return 0;
      }
    }

    function updateHud() {
      const text = `${roundObjective()} (You are at ${pos}.)`;
      hud.setObjective(text);
      if (clarity) clarity.setObjective(text);
    }

    function startRound() {
      solved = false;
      round = cfg.rounds[roundIndex];
      targetInt = computeTarget(round);
      pos = 0;
      setSubY(0, false);

      // updateLabel sets the sprite scale from the text's canvas aspect.
      updateLabel(cardLabel, cardText());
      // Scale-pop the card by tweening its parent-relative scale multiplier
      // without corrupting the aspect ratio set by updateLabel.
      if (!reduced) {
        const base = cardLabel.scale.clone();
        feel.tween({
          from: 0,
          to: 1,
          duration: 0.3,
          onUpdate: (t) => {
            const m = 1 + Math.sin(t * Math.PI) * 0.16;
            cardLabel.scale.set(base.x * m, base.y * m, 1);
          },
          onComplete: () => cardLabel.scale.copy(base),
        });
      }

      marker.position.set(0, yFor(targetInt), 0);
      markerMat.color.setHex(COLORS.target);
      markerMat.emissive.setHex(COLORS.target);
      marker.visible = true;

      if (clarity) {
        clarity.setObjective(`Round ${roundIndex + 1} of ${cfg.rounds.length}`);
        clarity.setTarget(`Dive to ${targetInt}`);
      }

      if (typeof hud.setProgress === "function")
        hud.setProgress(roundIndex, cfg.rounds.length);

      let intro;
      switch (round.kind) {
        case "move":
          intro = `Dive the sub to ${round.target}.`;
          break;
        case "opposite":
          intro = `Go to the opposite of ${round.value}. The answer is ${-round.value}.`;
          break;
        case "absolute":
        case "absDist":
          intro = `${round.context} Go to ${targetInt}.`;
          break;
        case "compare":
          intro = `Which is ${round.pick}, ${round.a} or ${round.b}? Go to it. Higher is greater.`;
          break;
        case "order":
          intro = `Go to the ${round.pick} number: ${round.values.join(", ")}.`;
          break;
        default:
          intro = `Move the sub.`;
      }
      announce(intro);
      caption(cardText());
      updateHud();
      feel.sfx("select");

      hud.message("Up/Down to move. Space when you arrive.", {
        tone: "info",
        duration: cfg.hints ? 3000 : 2200,
      });
    }

    function move(dir) {
      if (solved || !started) return;
      const next = Math.max(RANGE_MIN, Math.min(RANGE_MAX, pos + dir));
      if (next === pos) {
        feel.sfx("wrong");
        feel.shake(0.08, 0.18);
        return;
      }
      pos = next;
      setSubY(pos, true);
      feel.sfx(dir > 0 ? "add" : "remove");
      feel.burst(
        { x: 0, y: yFor(pos), z: 0 },
        {
          color: COLORS.surface,
          count: 8,
          spread: 0.5,
          size: 0.07,
          life: 0.45,
        },
      );
      announce(`You are at ${pos}.`);
      updateHud();
    }

    function readOut() {
      if (!started) return;
      const av = Math.abs(pos);
      const msg = `You are at ${pos}. It is ${av} away from 0.`;
      caption(msg);
      announce(msg);
      feel.sfx("pop");
      hud.message(`|${pos}| = ${av}`, { tone: "info", duration: 1800 });
      later(() => caption(cardText()), 1800);
    }

    function confirmArrival() {
      if (solved || !started) return;
      if (pos !== targetInt) {
        feel.sfx("wrong");
        feel.shake(0.16, 0.3);
        markerMat.color.setHex(COLORS.targetBad);
        markerMat.emissive.setHex(COLORS.targetBad);
        later(() => {
          markerMat.color.setHex(COLORS.target);
          markerMat.emissive.setHex(COLORS.target);
        }, 500);
        const hint = ` Go to ${targetInt}.`;
        const msg = `Not yet. You are at ${pos}.${cfg.hints ? hint : ""}`;
        streak = 0;
        if (typeof hud.setStreak === "function") hud.setStreak(0);
        if (typeof hud.feedback === "function") hud.feedback(false, msg);
        else hud.message(msg, { tone: "warn", duration: 2400 });
        announce(msg);
        return;
      }

      solved = true;
      solvedCount += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      if (typeof hud.setStreak === "function") hud.setStreak(streak);

      const pts = (level === 2 ? 30 : 20) + (streak >= 3 ? 10 : 0);
      onScore(pts, {
        round: roundIndex + 1,
        kind: round.kind,
        target: targetInt,
        absolute: Math.abs(targetInt),
      });

      feel.sfx("correct");
      feel.shake(0.3, 0.35);
      feel.burst(
        { x: 0, y: yFor(targetInt), z: 0 },
        { color: COLORS.target, count: 36, spread: 1.6 },
      );
      // Victory scale-pop on the sub.
      if (!reduced) {
        feel.tween({
          from: 0,
          to: 1,
          duration: 0.35,
          onUpdate: (t) =>
            subGroup.scale.setScalar(1 + Math.sin(t * Math.PI) * 0.18),
          onComplete: () => subGroup.scale.setScalar(1),
        });
      }

      let why;
      switch (round.kind) {
        case "opposite":
          why = `${targetInt} is the opposite of ${round.value}.`;
          break;
        case "absolute":
        case "absDist":
          why = `${targetInt} is ${Math.abs(targetInt)} away from 0.`;
          break;
        case "compare":
          why = `${targetInt} is the ${round.pick} of ${round.a} and ${round.b}.`;
          break;
        case "order":
          why = `${targetInt} is the ${round.pick} of ${round.values.join(", ")}.`;
          break;
        default:
          why = `You reached ${depthWord(targetInt)}.`;
      }
      const okMsg = `Docked! ${why} +${pts}`;
      if (typeof hud.feedback === "function")
        hud.feedback(true, okMsg, { duration: 2600 });
      else hud.message(okMsg, { tone: "ok", duration: 2600 });
      announce(`Correct! ${why} +${pts} points.`);

      later(() => {
        if (roundIndex < cfg.rounds.length - 1) {
          roundIndex += 1;
          startRound();
        } else {
          finish();
        }
      }, 2600);
    }

    function finish() {
      marker.visible = false;
      updateLabel(cardLabel, "All depths reached!");
      hud.setProgress(cfg.rounds.length, cfg.rounds.length);
      hud.setObjective(
        `All depths reached — ${solvedCount} of ${cfg.rounds.length}, best streak ${bestStreak}. Great piloting, Captain!`,
      );
      hud.message("All rounds complete!", { tone: "ok", duration: 0 });
      feel.sfx("fanfare");
      announce(
        `All rounds complete. You reached ${solvedCount} depths with a best streak of ${bestStreak}. Great piloting, Captain.`,
      );
      // Celebration confetti rising from sea level.
      if (!reduced) {
        [0, 200, 400].forEach((ms) =>
          later(
            () =>
              feel.burst(
                { x: 0, y: 0, z: 0 },
                { color: COLORS.target, count: 40, spread: 3.0, life: 1.4 },
              ),
            ms,
          ),
        );
      }
      if (clarity) {
        clarity.setTarget(null);
        clarity.win({
          titleEn: "All depths reached!",
          badge: "🤿",
          stats: `You reached ${solvedCount} of ${cfg.rounds.length} depths. Best streak: ${bestStreak}. Score saved.`,
        });
      }
    }

    // ---- Animated camera intro ----------------------------------------------
    function cameraIntro(onDone) {
      const target = new THREE.Vector3(0, columnMidY, 0);
      const endPos = new THREE.Vector3(4.4, columnMidY + 1.3, 6.6);
      if (reduced) {
        camera.position.copy(endPos);
        camera.lookAt(target);
        feel.syncCamera();
        onDone();
        return;
      }
      const startPos = new THREE.Vector3(8.5, columnTopY + 3, 10.5);
      camera.position.copy(startPos);
      camera.lookAt(target);
      feel.tween({
        from: 0,
        to: 1,
        duration: 1.4,
        onUpdate: (t) => {
          camera.position.lerpVectors(startPos, endPos, t);
          camera.lookAt(target);
        },
        onComplete: () => {
          feel.syncCamera();
          onDone();
        },
      });
    }

    // Begin the actual round loop + input binding only after the student
    // presses Start in the clarity overlay. Single entry point for first play
    // and (via page reload) for Play Again. The camera intro + spawn-pop and
    // idle animation run immediately behind the overlay; only the interactive
    // round loop and input wait for Start.
    function beginGameplay() {
      started = true;
      // Spawn-pop the submarine in.
      if (!reduced) {
        feel.tween({
          from: 0,
          to: 1,
          duration: 0.4,
          onUpdate: (t) => subGroup.scale.setScalar(t),
          onComplete: () => subGroup.scale.setScalar(1),
        });
      } else {
        subGroup.scale.setScalar(1);
      }
      feel.sfx("pop");

      unbindPress = input.onPress((name) => {
        if (name === "up") move(1);
        else if (name === "down") move(-1);
        else if (name === "action") confirmArrival();
        else if (name === "confirm") readOut();
      });

      unbindTap = input.onTap(() => {
        if (solved || !started) return;
        const hits = input.raycast(camera, [marker, subGroup], true);
        if (hits.length) {
          confirmArrival();
          return;
        }
        const ny = input.state.ndc ? input.state.ndc.y : 0;
        move(ny >= 0 ? 1 : -1);
      });

      roundIndex = 0;
      startRound();
    }

    return {
      start() {
        // Camera intro runs immediately, behind the start overlay.
        cameraIntro(() => {});

        if (!reduced) {
          unbindFrame = onFrame((dt, t) => {
            // Gentle sub bob (only when settled, never overrides a tween).
            subGroup.position.x = Math.sin(t * 1.4) * 0.05;
            subGroup.rotation.z = Math.sin(t * 1.1) * 0.04;
            // Target marker pulse.
            const s = 1 + Math.sin(t * 3) * 0.1;
            marker.scale.set(s, 1, s);
            markerMat.emissiveIntensity = 0.5 + Math.sin(t * 3) * 0.25;
            // Drifting surface shimmer.
            surface.material.emissiveIntensity = 0.4 + Math.sin(t * 2) * 0.15;
            // Glowing porthead breathes.
            portMat.emissiveIntensity = 0.7 + Math.sin(t * 2.5) * 0.3;
          });
        }

        // Clarity / onboarding kit: start overlay, how-to-play, persistent help
        // button, mini-HUD, and win screen. Drives nothing in the 3D scene.
        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "Submarine — Dive the Number Line",
          objectiveEn:
            "Pilot the submarine up and down the number line to the integer each round asks for, then dock with Space.",
          objectiveEs:
            "Pilotea el submarino por la recta numérica hasta el número entero de cada ronda y atraca con Espacio.",
          standard: "6.NS.C.5–7 · Integers, Opposites & Absolute Value",
          controls: [
            {
              key: "↑ / W",
              actionEn:
                "Rise — move the sub up the number line (toward positives)",
              actionEs: "Sube — mueve el submarino hacia los positivos",
            },
            {
              key: "↓ / S",
              actionEn:
                "Dive — move the sub down the number line (toward negatives)",
              actionEs: "Baja — mueve el submarino hacia los negativos",
            },
            {
              key: "Space",
              actionEn: "Dock — check if you reached the target integer",
              actionEs: "Atraca — revisa si llegaste al número correcto",
            },
            {
              key: "Enter",
              actionEn:
                "Read out your depth and its distance from 0 (absolute value)",
              actionEs:
                "Di tu profundidad y su distancia desde 0 (valor absoluto)",
            },
            {
              key: "Tap",
              actionEn:
                "Tap the green target band to dock, or tap above/below the sub to move it",
              actionEs:
                "Toca la banda verde para atracar, o toca arriba/abajo para mover el submarino",
            },
            {
              key: "?",
              actionEn: "Open this help panel any time (Esc closes it)",
              actionEs: "Abre esta ayuda cuando quieras (Esc la cierra)",
            },
          ],
          howToWinEn:
            "Each round names a target — a number to dive to, an opposite, an absolute value, or the greater/least of a set. Move to that integer and press Space to dock. Dock all rounds to win. A 3+ streak earns bonus points!",
          howToWinEs:
            "Llega al número entero de cada ronda y atraca con Espacio. Completa todas las rondas para ganar.",
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
        scene.remove(group);
        disposables.forEach((d) => d.dispose && d.dispose());
        // makeLabel sprites: dispose their textures + materials.
        const sprites = [cardLabel, seaLabel, depthLabel, ...lineLabels];
        sprites.forEach((sp) => {
          if (sp.material) {
            if (sp.material.map) sp.material.map.dispose();
            sp.material.dispose();
          }
        });
      },
    };
  },
};
