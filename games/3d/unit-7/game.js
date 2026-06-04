import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";

// ============================================================================
// Unit 7 — SUBMARINE: DEEP DIVE  (CCSS 6.NS.C.5–7)
// REAL-TIME UNDERWATER RUNNER on a VERTICAL number line. The submarine
// auto-travels forward; the whole sea (kelp, bubbles, depth markers) scrolls
// toward the camera for a true sense of motion. The player drives the sub
// UP/DOWN in real time along the number line (0 = sea level at the middle,
// positives above, negatives below).
//
// Collectible TOKENS and hazard MINES stream toward the sub at specific
// integer depths. Each round the HUD "Your task" panel poses a goal:
//   "Grab -4" · "Grab the OPPOSITE of 3" · "Grab |x| = 4 from the surface" ·
//   "Dive to the GREATER of -2 and 4" · "Grab the LEAST of -4, 1, 5".
// The player must COMPUTE the correct depth and be there when the token
// arrives. Grab the right token → points + combo + boost. Touch a wrong-number
// mine (or miss/grab the wrong one) → damage, screen shake, lose a life.
// Clear every goal → surface and win.
//
// The integer math is reused verbatim from the existing round bank so the
// curriculum stays exact; computeTarget() derives the one correct depth and
// decoy depths are drawn from the round's own numbers and near-misses.
// ============================================================================

const COLORS = {
  water: 0x1f6f9c,
  waterDeep: 0x0a2c4a,
  surface: 0xbfe6ff,
  sub: 0xf2c15b,
  subTrim: 0xd9795d,
  glass: 0x9fe6ff,
  token: 0x4aa978,
  tokenEdge: 0xbdf3d6,
  mine: 0xb64e2f,
  mineEdge: 0xffb39c,
  tick: 0xbfe6ff,
  tickZero: 0xffffff,
  spine: 0x4fb6e0,
  bubble: 0xcdeeff,
  kelp: 0x2f7d5c,
  good: 0x4aa978,
  bad: 0xd9795d,
};

const UNIT = 0.62; // world units per integer step (vertical)

// World layout. The sub sits at a fixed x/z and only moves in y (its depth on
// the number line). Tokens/mines/scenery spawn far ahead at -z and scroll
// toward +z (toward the camera) to fake forward travel.
const SUB_X = 0; // sub's fixed lateral position
const SUB_Z = 5.5; // sub's fixed forward position (near camera)
const SPAWN_Z = -34; // where tokens/scenery appear far ahead
const DESPAWN_Z = 11; // past the camera → recycle
const GRAB_Z = SUB_Z; // a streamer is "at" the sub when its z reaches here
const GRAB_REACH = UNIT * 0.62; // vertical tolerance to grab/collide
const GRAB_Z_REACH = 1.3; // forward tolerance around the sub plane

// ---- Round bank (6.NS.C.5–7) — reused verbatim from the prior build --------
// Every target is an exact integer (computeTarget verifies the math). Level 1 =
// scaffolded (smaller range, hints). Level 2 = enrichment (wider range,
// multi-step compare/order).
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
        kind: "absolute",
        value: -4,
        context: "A diver is 4 m below sea level.",
      },
    ],
  };
}

// The ONE correct depth for a round. (opposite of n = -n; |n| = distance from
// 0 = n itself for the "absolute" rounds where the context names the position;
// greater = max; least/min = lowest value on the line.)
function computeTarget(r) {
  switch (r.kind) {
    case "move":
      return r.target;
    case "opposite":
      return -r.value;
    case "absolute":
      return r.value;
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
    const subColor = level === 2 ? COLORS.subTrim : COLORS.sub;

    const clarityMount = renderer.domElement.parentElement || document.body;
    let clarity = null;

    const yFor = (n) => n * UNIT;
    const columnTopY = yFor(RANGE_MAX) + UNIT;
    const columnBotY = yFor(RANGE_MIN) - UNIT;
    const columnMidY = (yFor(RANGE_MAX) + yFor(RANGE_MIN)) / 2;
    const columnHeight = (RANGE_MAX - RANGE_MIN) * UNIT + UNIT * 2;

    // ---- Scene root ---------------------------------------------------------
    const group = new THREE.Group();
    scene.add(group);

    const disposables = [];
    const mk = (g, m) => {
      disposables.push(g, m);
      return new THREE.Mesh(g, m);
    };

    // ---- Tuning (Level 2 = faster scroll, tighter spacing) ------------------
    const BASE_SPEED = level === 2 ? 12 : 9; // z-units / sec scroll = forward speed
    const MAX_SPEED = level === 2 ? 20 : 15;
    const VERT_SPEED = level === 2 ? 9.5 : 8; // sub vertical units / sec
    const START_LIVES = level === 2 ? 4 : 6;

    // ---- Side number-line spine + ticks + integer labels --------------------
    // A vertical glowing spine to the left, a tick + dark chip label at every
    // integer. These scroll WITH the world (depth markers streaming past).
    const spineGeo = new RoundedBoxGeometry(0.07, columnHeight, 0.07, 2, 0.03);
    const spineMat = new THREE.MeshStandardMaterial({
      color: COLORS.spine,
      emissive: COLORS.spine,
      emissiveIntensity: 0.4,
      roughness: 0.4,
      metalness: 0.3,
    });
    const spine = mk(spineGeo, spineMat);
    spine.position.set(-2.4, columnMidY, SUB_Z);
    group.add(spine);

    const tickGeo = new RoundedBoxGeometry(0.5, 0.06, 0.06, 2, 0.02);
    const zeroTickGeo = new RoundedBoxGeometry(0.85, 0.09, 0.09, 2, 0.03);
    disposables.push(tickGeo, zeroTickGeo);
    const tickMat = new THREE.MeshStandardMaterial({
      color: COLORS.tick,
      roughness: 0.5,
    });
    const zeroMat = new THREE.MeshStandardMaterial({
      color: COLORS.tickZero,
      emissive: COLORS.tickZero,
      emissiveIntensity: 0.6,
      roughness: 0.5,
    });
    disposables.push(tickMat, zeroMat);

    const lineLabels = [];
    for (let n = RANGE_MIN; n <= RANGE_MAX; n++) {
      const isZero = n === 0;
      const tick = new THREE.Mesh(
        isZero ? zeroTickGeo : tickGeo,
        isZero ? zeroMat : tickMat,
      );
      tick.position.set(-2.4, yFor(n), SUB_Z);
      group.add(tick);

      const label = makeLabel(isZero ? "0  sea level" : String(n), {
        THREE,
        color: isZero ? "#ffffff" : "#eaf6ff",
        background: isZero ? "rgba(20,60,100,0.95)" : "rgba(11,28,48,0.92)",
        fontSize: isZero ? 80 : 74,
        scale: isZero ? 0.85 : 0.8,
      });
      label.position.set(-3.3, yFor(n), SUB_Z);
      label.userData.intN = n; // base depth, so we can keep them readable
      lineLabels.push(label);
      group.add(label);
    }

    // Surface slab glow at depth 0 (rides with the world plane at SUB depth).
    const surface = mk(
      new RoundedBoxGeometry(7.5, 0.08, 4.0, 3, 0.04),
      new THREE.MeshStandardMaterial({
        color: COLORS.surface,
        transparent: true,
        opacity: 0.4,
        roughness: 0.2,
        emissive: COLORS.surface,
        emissiveIntensity: 0.5,
      }),
    );
    surface.position.set(0, 0, SUB_Z - 4);
    group.add(surface);

    // Seabed glow band beneath the lowest integer.
    const seabed = mk(
      new RoundedBoxGeometry(8.5, 0.4, 5.0, 3, 0.12),
      new THREE.MeshStandardMaterial({
        color: COLORS.waterDeep,
        emissive: COLORS.waterDeep,
        emissiveIntensity: 0.2,
        roughness: 1,
      }),
    );
    seabed.position.set(0, columnBotY - UNIT, SUB_Z - 4);
    group.add(seabed);

    // ---- Scrolling kelp (THE speed cue) -------------------------------------
    // Stalks far behind the play plane that march toward the camera and wrap,
    // selling continuous forward motion at all times.
    const kelpMat = new THREE.MeshStandardMaterial({
      color: COLORS.kelp,
      emissive: COLORS.kelp,
      emissiveIntensity: 0.25,
      roughness: 0.8,
    });
    disposables.push(kelpMat);
    const kelpGeo = new THREE.CylinderGeometry(0.06, 0.14, 3.4, 7);
    disposables.push(kelpGeo);
    const KELP_SPAN = 44;
    const kelp = [];
    for (let i = 0; i < 22; i++) {
      const k = new THREE.Mesh(kelpGeo, kelpMat);
      const side = i % 2 === 0 ? -1 : 1;
      k.position.set(
        side * (2.6 + Math.random() * 2.4),
        columnBotY + 1.4 + Math.random() * 0.6,
        SUB_Z - 2 - Math.random() * KELP_SPAN,
      );
      k.userData.phase = Math.random() * Math.PI * 2;
      k.userData.baseX = k.position.x;
      group.add(k);
      kelp.push(k);
    }

    // ---- Scrolling bubble columns (extra motion + life) ---------------------
    const bubbleMat = new THREE.PointsMaterial({
      color: COLORS.bubble,
      size: 0.12,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    disposables.push(bubbleMat);
    const BUBBLE_N = reduced ? 60 : 150;
    const bubbleGeo = new THREE.BufferGeometry();
    const bubblePos = new Float32Array(BUBBLE_N * 3);
    for (let i = 0; i < BUBBLE_N; i++) {
      bubblePos[i * 3] = (Math.random() - 0.5) * 9;
      bubblePos[i * 3 + 1] = columnBotY + Math.random() * (columnHeight + 2);
      bubblePos[i * 3 + 2] = SUB_Z - Math.random() * KELP_SPAN;
    }
    bubbleGeo.setAttribute("position", new THREE.BufferAttribute(bubblePos, 3));
    disposables.push(bubbleGeo);
    const bubbles = new THREE.Points(bubbleGeo, bubbleMat);
    group.add(bubbles);

    // ---- Submarine (rounded PBR, fixed at SUB_X / SUB_Z, moves only in y) ---
    const subGroup = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.36, 0.82, 6, 14),
      new THREE.MeshStandardMaterial({
        color: subColor,
        roughness: 0.35,
        metalness: 0.45,
        emissive: subColor,
        emissiveIntensity: 0.15,
      }),
    );
    hull.rotation.z = Math.PI / 2;
    hull.castShadow = true;
    disposables.push(hull.geometry, hull.material);
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
    disposables.push(tower.geometry, tower.material);
    subGroup.add(tower);

    // Forward-facing porthead light (bloom catches it) — points "ahead" (-z).
    const portMat = new THREE.MeshPhysicalMaterial({
      color: COLORS.glass,
      emissive: COLORS.glass,
      emissiveIntensity: 0.95,
      roughness: 0.05,
      metalness: 0,
      transmission: 0.4,
      ior: 1.4,
    });
    disposables.push(portMat);
    const port = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 12),
      portMat,
    );
    port.position.set(0, 0, -0.55);
    disposables.push(port.geometry);
    subGroup.add(port);

    // Tail fin behind the sub.
    const fin = new THREE.Mesh(
      new RoundedBoxGeometry(0.06, 0.5, 0.18, 2, 0.03),
      new THREE.MeshStandardMaterial({ color: COLORS.subTrim, roughness: 0.5 }),
    );
    fin.position.set(0, 0, 0.55);
    disposables.push(fin.geometry, fin.material);
    subGroup.add(fin);

    subGroup.position.set(SUB_X, yFor(0), SUB_Z);
    subGroup.scale.setScalar(0.001); // spawn-pop on start
    group.add(subGroup);

    // Live depth read-out riding beside the sub.
    const depthLabel = makeLabel("0", {
      THREE,
      color: "#ffe08a",
      background: "rgba(11,28,48,0.95)",
      fontSize: 96,
      scale: 0.9,
    });
    depthLabel.position.set(SUB_X + 1.1, yFor(0), SUB_Z);
    group.add(depthLabel);

    // ---- Streamer pool (tokens + mines) -------------------------------------
    // A streamer is a labeled disc at an integer depth that scrolls toward the
    // sub. token=collectible (correct answer green), mine=hazard (red). We pool
    // a handful and recycle them as a "wave" for each round.
    const STREAMER_POOL = 6;
    const streamers = [];
    const tokenGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.16, 18);
    const mineGeo = new THREE.IcosahedronGeometry(0.42, 0);
    disposables.push(tokenGeo, mineGeo);

    function makeStreamer() {
      const obj = new THREE.Group();
      const tokenMat = new THREE.MeshStandardMaterial({
        color: COLORS.token,
        emissive: COLORS.token,
        emissiveIntensity: 0.55,
        roughness: 0.3,
        metalness: 0.2,
      });
      const mineMat = new THREE.MeshStandardMaterial({
        color: COLORS.mine,
        emissive: COLORS.mine,
        emissiveIntensity: 0.5,
        roughness: 0.4,
        metalness: 0.2,
      });
      disposables.push(tokenMat, mineMat);
      const tokenMesh = new THREE.Mesh(tokenGeo, tokenMat);
      tokenMesh.rotation.x = Math.PI / 2; // face the camera like a coin
      const mineMesh = new THREE.Mesh(mineGeo, mineMat);
      obj.add(tokenMesh);
      obj.add(mineMesh);
      const label = makeLabel("0", {
        THREE,
        color: "#ffffff",
        background: "rgba(11,28,48,0.0)",
        border: null,
        fontSize: 88,
        scale: 0.9,
      });
      label.position.set(0, 0, 0.3);
      obj.add(label);
      obj.visible = false;
      group.add(obj);
      const s = {
        obj,
        tokenMesh,
        mineMesh,
        tokenMat,
        mineMat,
        label,
        kind: "token", // "token" | "mine"
        value: 0,
        depth: 0,
        correct: false,
        active: false,
        resolved: false,
      };
      streamers.push(s);
      return s;
    }
    for (let i = 0; i < STREAMER_POOL; i++) makeStreamer();

    function disposeSprite(spr) {
      if (!spr) return;
      if (spr.parent) spr.parent.remove(spr);
      if (spr.material) {
        if (spr.material.map) spr.material.map.dispose();
        spr.material.dispose();
      }
    }

    // ---- Game state ---------------------------------------------------------
    let subDepthY = yFor(0); // continuous sub y (px), snapped to integer for math
    let round = null;
    let roundIndex = 0;
    let targetInt = null;
    let speed = BASE_SPEED;
    let boostT = 0;
    let flash = null; // { color, t }
    let streak = 0;
    let bestStreak = 0;
    let solvedCount = 0;
    let lives = START_LIVES;
    let started = false;
    let gameOver = false;
    let surfacing = false; // win cinematic — sub rises to surface
    let roundCleared = false; // current goal token grabbed, waiting to advance
    let traveled = 0; // scroll distance accumulated this round
    let nextWaveDist = 6; // distance before this round's wave spawns
    let waveSpawned = false; // a wave for the current goal is in flight / passed

    let unbindFrame = null;
    let unbindPress = null;
    let unbindTap = null;
    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    // Current depth as an integer (the sub's number-line position).
    function subInt() {
      return Math.round(subDepthY / UNIT);
    }

    // ---- Task text (the goal for the current round) -------------------------
    function taskText() {
      if (!round) return "Pilot the submarine";
      switch (round.kind) {
        case "move":
          return `Grab the token at ${round.target}`;
        case "opposite":
          return `Grab the OPPOSITE of ${round.value}`;
        case "absolute":
          return `${round.context} Grab that integer`;
        case "compare":
          return `Grab the ${round.pick.toUpperCase()} of ${round.a} and ${round.b}`;
        case "order":
          return `Grab the ${round.pick.toUpperCase()} of ${round.values.join(", ")}`;
        default:
          return "Grab the right token";
      }
    }

    function announceTask() {
      if (!round) return;
      let intro;
      switch (round.kind) {
        case "move":
          intro = `Dive to ${round.target} and grab the token there.`;
          break;
        case "opposite":
          intro = `Find the opposite of ${round.value} and grab that token.`;
          break;
        case "absolute":
          intro = `${round.context} Work out the integer and grab that token.`;
          break;
        case "compare":
          intro = `Which is ${round.pick}, ${round.a} or ${round.b}? Grab it.${
            cfg.hints ? " Higher on the line is greater." : ""
          }`;
          break;
        case "order":
          intro = `Grab the ${round.pick} number: ${round.values.join(", ")}.`;
          break;
        default:
          intro = "Grab the right token.";
      }
      announce(`Round ${roundIndex + 1}. ${intro}`);
    }

    function updateHud() {
      const text = `${taskText()}  ·  you are at ${subInt()}`;
      hud.setObjective(text);
      if (clarity) clarity.setObjective(text);
    }

    // ---- Decoy depths -------------------------------------------------------
    // Pull plausible-but-wrong integers from the round's own numbers and near
    // misses (off-by-one, sign flip). Never equal the correct target.
    function decoyDepths(correct) {
      const cands = [];
      const push = (v) => {
        if (!Number.isInteger(v)) return;
        if (v < RANGE_MIN || v > RANGE_MAX) return;
        if (v === correct) return;
        if (cands.includes(v)) return;
        cands.push(v);
      };
      // Round-specific wrong numbers (the OTHER value / a sign trap).
      if (round.kind === "opposite") push(round.value); // forgot to negate
      if (round.kind === "absolute") push(-round.value); // wrong sign
      if (round.kind === "compare") {
        push(round.a);
        push(round.b);
      }
      if (round.kind === "order") round.values.forEach(push);
      // Generic near-misses.
      push(-correct);
      push(correct + 1);
      push(correct - 1);
      push(correct + 2);
      push(correct - 2);
      return cands;
    }

    // ---- Spawn the wave of streamers for the current round ------------------
    // One token carries the CORRECT integer; the rest are mines at decoy
    // depths. They share a z so the player meets them as a single "gate" and
    // must already be at the right depth.
    function spawnWave() {
      const decoys = decoyDepths(targetInt);
      // Choose up to 3 distinct decoy depths.
      const chosen = [];
      for (const d of decoys) {
        if (chosen.length >= 3) break;
        chosen.push(d);
      }
      // Build the list: 1 correct token + N mines.
      const layout = [{ value: targetInt, kind: "token", correct: true }];
      for (const d of chosen) {
        layout.push({ value: d, kind: "mine", correct: false });
      }

      layout.forEach((spec, i) => {
        const s = streamers[i];
        if (!s) return;
        s.value = spec.value;
        s.depth = spec.value;
        s.kind = spec.kind;
        s.correct = spec.correct;
        s.active = true;
        s.resolved = false;
        s.obj.visible = true;
        s.obj.position.set(0, yFor(spec.value), SPAWN_Z);
        s.tokenMesh.visible = spec.kind === "token";
        s.mineMesh.visible = spec.kind === "mine";
        // Tokens show the number plainly; mines too (they must read each label
        // and steer AWAY from the wrong ones).
        updateLabel(s.label, String(spec.value));
      });
      // Park unused pool slots.
      for (let i = layout.length; i < streamers.length; i++) {
        streamers[i].active = false;
        streamers[i].obj.visible = false;
      }
      waveSpawned = true;
    }

    function clearWave() {
      streamers.forEach((s) => {
        s.active = false;
        s.resolved = true;
        s.obj.visible = false;
      });
    }

    // ---- Round lifecycle ----------------------------------------------------
    function startRound() {
      round = cfg.rounds[roundIndex];
      targetInt = computeTarget(round);
      roundCleared = false;
      traveled = 0;
      nextWaveDist = 6;
      waveSpawned = false;
      clearWave();
      updateHud();
      announceTask();
      caption(taskText());
      if (typeof hud.setProgress === "function")
        hud.setProgress(roundIndex, cfg.rounds.length);
      if (clarity) {
        clarity.setTarget(taskText());
      }
      if (cfg.hints) {
        hud.message("Up/Down to set your depth. Catch the green token!", {
          tone: "info",
          duration: 2600,
        });
      }
      feel.sfx("select");
    }

    function onGrabCorrect(s) {
      if (roundCleared) return;
      roundCleared = true;
      s.resolved = true;
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

      // Boost forward speed (sense of acceleration), flash + particles.
      speed = Math.min(MAX_SPEED, speed + 2.5 + Math.min(streak, 4) * 0.4);
      boostT = 0.6;
      flash = { color: COLORS.good, t: 0.35 };
      feel.sfx("correct");
      if (!reduced) feel.shake(0.16, 0.25);
      feel.burst(
        { x: SUB_X, y: subGroup.position.y, z: SUB_Z },
        { color: COLORS.tokenEdge, count: reduced ? 0 : 30, spread: 2.2 },
      );

      let why;
      switch (round.kind) {
        case "opposite":
          why = `${targetInt} is the opposite of ${round.value}.`;
          break;
        case "absolute":
          why = `${targetInt} is ${Math.abs(targetInt)} away from 0.`;
          break;
        case "compare":
          why = `${targetInt} is the ${round.pick} of ${round.a} and ${round.b}.`;
          break;
        case "order":
          why = `${targetInt} is the ${round.pick} of ${round.values.join(", ")}.`;
          break;
        default:
          why = `You grabbed ${targetInt}.`;
      }
      if (typeof hud.feedback === "function")
        hud.feedback(true, `Token grabbed! ${why} +${pts}`, { duration: 2400 });
      announce(`Correct! ${why} +${pts} points.`);
      caption(why);

      // Despawn this wave shortly and advance (or surface to win).
      later(() => clearWave(), 250);
      later(() => {
        if (roundIndex < cfg.rounds.length - 1) {
          roundIndex += 1;
          startRound();
        } else {
          beginSurface();
        }
      }, 1400);
    }

    function damage(reason) {
      streak = 0;
      if (typeof hud.setStreak === "function") hud.setStreak(0);
      lives = Math.max(0, lives - 1);
      if (typeof hud.setLives === "function") hud.setLives(lives);
      speed = Math.max(BASE_SPEED, speed - 2.5);
      flash = { color: COLORS.bad, t: 0.4 };
      feel.sfx("wrong");
      if (!reduced) feel.shake(0.32, 0.35);
      feel.burst(
        { x: SUB_X, y: subGroup.position.y, z: SUB_Z },
        { color: COLORS.bad, count: reduced ? 0 : 22, spread: 2.0 },
      );
      const msg =
        lives > 0
          ? `${reason} ${lives} ${lives === 1 ? "life" : "lives"} left.`
          : reason;
      if (typeof hud.feedback === "function") hud.feedback(false, msg);
      else hud.message(msg, { tone: "warn", duration: 2200 });
      announce(msg);
      if (lives <= 0) loseGame();
    }

    // A wrong streamer reached the sub plane.
    function onHitMine(s) {
      s.resolved = true;
      s.obj.visible = false;
      // Once the goal token is grabbed, the round is won — don't punish a mine
      // that brushes past during the short advance window.
      if (roundCleared || gameOver) return;
      damage(`Mine! ${s.value} is not it.`);
    }

    // The whole wave passed without the correct token being grabbed.
    function onMissedWave() {
      if (roundCleared || gameOver) return;
      damage("Missed the token!");
      // Re-arm: respawn the same goal's wave so the round is still winnable.
      if (!gameOver) {
        traveled = 0;
        nextWaveDist = 4;
      }
    }

    // ---- Real-time vertical movement ---------------------------------------
    // Held-state polling (smooth continuous dive) + crisp single-step presses.
    function moveStep(dir) {
      const nextInt = Math.max(RANGE_MIN, Math.min(RANGE_MAX, subInt() + dir));
      subDepthY = yFor(nextInt);
      feel.sfx(dir > 0 ? "add" : "remove");
    }

    function readOut() {
      if (!started) return;
      const n = subInt();
      const av = Math.abs(n);
      const msg = `You are at ${n}. It is ${av} away from 0.`;
      caption(msg);
      announce(msg);
      feel.sfx("pop");
      hud.message(`|${n}| = ${av}`, { tone: "info", duration: 1800 });
      later(() => caption(taskText()), 1800);
    }

    // ---- Win / lose ---------------------------------------------------------
    function beginSurface() {
      surfacing = true;
      clearWave();
      hud.setObjective("All tokens collected — surface! 🌊");
      announce("All tokens collected. Surfacing!");
      if (clarity) clarity.setTarget(null);
    }

    function winGame() {
      gameOver = true;
      hud.setProgress(cfg.rounds.length, cfg.rounds.length);
      hud.setObjective(
        `Surfaced! ${solvedCount} of ${cfg.rounds.length} tokens, best streak ${bestStreak}. Great diving, Captain!`,
      );
      hud.message("Mission complete!", { tone: "ok", duration: 0 });
      feel.sfx("fanfare");
      if (!reduced) {
        [0, 200, 400].forEach((ms) =>
          later(
            () =>
              feel.burst(
                { x: 0, y: 0.2, z: SUB_Z - 1 },
                { color: COLORS.token, count: 40, spread: 3.0, life: 1.4 },
              ),
            ms,
          ),
        );
        feel.shake(0.3, 0.4);
      }
      announce(
        `Mission complete! You grabbed ${solvedCount} of ${cfg.rounds.length} tokens with a best streak of ${bestStreak}.`,
      );
      if (clarity) {
        clarity.setTarget(null);
        clarity.win({
          titleEn: "Surfaced — mission complete!",
          badge: "🤿",
          stats: `You grabbed ${solvedCount} of ${cfg.rounds.length} tokens. Best streak: ${bestStreak}. Score saved.`,
        });
      }
    }

    function loseGame() {
      gameOver = true;
      clearWave();
      feel.sfx("wrong");
      const msg = `Hull breached! You grabbed ${solvedCount} of ${cfg.rounds.length} tokens.`;
      hud.setObjective(msg);
      announce(`Mission over. ${msg} Press Play Again to retry.`);
      if (clarity) {
        clarity.setTarget(null);
        clarity.lose({
          titleEn: "Hull breached!",
          badge: "🌊",
          stats: `${msg} Tip: work out the depth FIRST (opposite of n = -n; |n| = distance from 0; greater = higher on the line), then steer there before the wave arrives.`,
        });
      }
    }

    // ---- Per-frame real-time loop ------------------------------------------
    function frame(dt, t) {
      const playing = started && !gameOver;
      const d = Math.min(dt, 0.05); // clamp tab-switch hiccups

      // Ease speed back to base when not boosting.
      if (playing && !surfacing) {
        if (boostT > 0) boostT = Math.max(0, boostT - d);
        else speed += (BASE_SPEED - speed) * Math.min(1, d * 1.2);
      }
      const scroll = playing ? speed * d : BASE_SPEED * 0.25 * d; // idle drift

      // ---- Continuous vertical control (held keys / d-pad) ------------------
      if (playing && !surfacing) {
        const dir = (input.state.up ? 1 : 0) - (input.state.down ? 1 : 0);
        if (dir !== 0) {
          subDepthY += dir * VERT_SPEED * UNIT * d;
          subDepthY = Math.max(
            yFor(RANGE_MIN),
            Math.min(yFor(RANGE_MAX), subDepthY),
          );
        }
      }

      // Smooth the visible sub toward its depth; depth read-out tracks it.
      const subY =
        subGroup.position.y +
        (subDepthY - subGroup.position.y) * Math.min(1, d * 14);
      subGroup.position.y = subY;
      depthLabel.position.y = subY;
      updateLabel(depthLabel, String(subInt()));
      // Pitch the nose toward travel direction + gentle bob.
      if (!reduced) {
        const vy = subDepthY - subY;
        subGroup.rotation.x = -vy * 0.6;
        subGroup.position.x = SUB_X + Math.sin(t * 1.6) * 0.04;
        portMat.emissiveIntensity = 0.7 + Math.sin(t * 3) * 0.25;
      }

      // ---- Scroll the world toward the camera (forward motion) -------------
      if (scroll > 0) {
        for (const k of kelp) {
          k.position.z += scroll;
          if (k.position.z > DESPAWN_Z) {
            k.position.z -= KELP_SPAN;
            k.position.y = columnBotY + 1.4 + Math.random() * 0.6;
          }
          if (!reduced)
            k.position.x =
              k.userData.baseX + Math.sin(t * 1.2 + k.userData.phase) * 0.18;
        }
        // Bubbles drift up + scroll forward.
        const bp = bubbleGeo.attributes.position.array;
        for (let i = 0; i < BUBBLE_N; i++) {
          bp[i * 3 + 2] += scroll;
          bp[i * 3 + 1] += d * 0.6;
          if (bp[i * 3 + 2] > DESPAWN_Z) bp[i * 3 + 2] -= KELP_SPAN;
          if (bp[i * 3 + 1] > columnTopY + 1) bp[i * 3 + 1] = columnBotY;
        }
        bubbleGeo.attributes.position.needsUpdate = true;
      }

      // ---- Wave logic: spawn, scroll streamers, resolve grabs/hits ----------
      if (playing && !surfacing) {
        traveled += scroll;
        // Spawn this round's single wave once we've traveled far enough.
        if (!roundCleared && !waveSpawned && traveled >= nextWaveDist) {
          spawnWave();
        }

        let activeRemain = false;
        for (const s of streamers) {
          if (!s.active) continue;
          s.obj.position.z += scroll;
          // Spin mines for menace; bob tokens.
          if (!reduced) {
            if (s.kind === "mine") s.mineMesh.rotation.y += d * 2.2;
            else s.tokenMesh.rotation.z += d * 1.4;
          }
          // Live "in-range" cue: brighten the streamer at the sub's depth.
          const dy = Math.abs(s.obj.position.y - subY);
          const near = dy < GRAB_REACH * 1.6;
          const mat = s.kind === "token" ? s.tokenMat : s.mineMat;
          mat.emissiveIntensity = near ? 0.95 : s.kind === "token" ? 0.55 : 0.5;

          // Collision window: streamer crossing the sub's z plane.
          if (
            !s.resolved &&
            s.obj.position.z >= GRAB_Z - GRAB_Z_REACH &&
            s.obj.position.z <= GRAB_Z + GRAB_Z_REACH &&
            dy < GRAB_REACH
          ) {
            s.resolved = true;
            if (s.correct) {
              s.obj.visible = false;
              onGrabCorrect(s);
            } else {
              onHitMine(s);
            }
          }

          // Passed the sub (recycle the slot).
          if (s.obj.position.z > DESPAWN_Z) {
            s.active = false;
            s.obj.visible = false;
          } else {
            activeRemain = true;
          }
        }

        // The wave spawned, fully passed, and the correct token was never
        // grabbed → a miss. Damage once and re-arm with a fresh wave so the
        // round stays winnable.
        if (waveSpawned && !roundCleared && !activeRemain) {
          waveSpawned = false;
          onMissedWave();
        }
      }

      // ---- Surface (win cinematic): sub rises to 0 then wins ---------------
      if (playing && surfacing) {
        const toY = yFor(0);
        subDepthY += (toY - subDepthY) * Math.min(1, d * 3);
        if (Math.abs(subDepthY - toY) < 0.02) {
          subDepthY = toY;
          surfacing = false;
          winGame();
        }
      }

      // Keep integer labels facing readable (sprites already billboard).
      // ---- Screen flash (green grab / red hit) via surface glow pulse -------
      if (flash) {
        flash.t = Math.max(0, flash.t - d);
        const k = flash.t / 0.4;
        surface.material.emissiveIntensity = 0.4 + k * 0.7;
        surface.material.emissive.lerpColors(
          new THREE.Color(COLORS.surface),
          new THREE.Color(flash.color),
          k,
        );
        if (flash.t <= 0) {
          flash = null;
          surface.material.emissive.set(COLORS.surface);
          surface.material.emissiveIntensity = 0.5;
        }
      } else if (!reduced) {
        surface.material.emissiveIntensity = 0.4 + Math.sin(t * 2) * 0.12;
        spineMat.emissiveIntensity = 0.35 + Math.sin(t * 3) * 0.12;
      }
    }

    // ---- Camera intro -------------------------------------------------------
    function cameraIntro(onDone) {
      const target = new THREE.Vector3(0, columnMidY, SUB_Z - 3);
      const endPos = new THREE.Vector3(0.4, columnMidY + 1.2, SUB_Z + 7.5);
      if (reduced) {
        camera.position.copy(endPos);
        camera.lookAt(target);
        feel.syncCamera();
        onDone();
        return;
      }
      const startPos = new THREE.Vector3(6.5, columnTopY + 3, SUB_Z + 11);
      camera.position.copy(startPos);
      camera.lookAt(target);
      feel.tween({
        from: 0,
        to: 1,
        duration: 1.3,
        onUpdate: (tt) => {
          camera.position.lerpVectors(startPos, endPos, tt);
          camera.lookAt(target);
        },
        onComplete: () => {
          feel.syncCamera();
          onDone();
        },
      });
    }

    function beginGameplay() {
      started = true;
      lives = START_LIVES;
      gameOver = false;
      surfacing = false;
      speed = BASE_SPEED;
      subDepthY = yFor(0);
      if (typeof hud.setLives === "function") hud.setLives(lives);
      if (typeof hud.setStreak === "function") hud.setStreak(0);
      hud.setLevel(level === 2 ? "Level 2" : "Level 1");

      if (!reduced) {
        feel.tween({
          from: 0,
          to: 1,
          duration: 0.4,
          onUpdate: (tt) => subGroup.scale.setScalar(tt),
          onComplete: () => subGroup.scale.setScalar(1),
        });
      } else {
        subGroup.scale.setScalar(1);
      }
      feel.sfx("pop");

      // Crisp single-step presses (keyboard taps + touch d-pad). Held movement
      // is handled continuously in frame() via input.state.up/down.
      unbindPress = input.onPress((name) => {
        if (!started || gameOver) return;
        if (name === "up") moveStep(1);
        else if (name === "down") moveStep(-1);
        else if (name === "confirm") readOut();
      });

      // Tap above/below the sub to nudge depth (mobile + mouse).
      unbindTap = input.onTap(() => {
        if (!started || gameOver || surfacing) return;
        const ny = input.state.ndc ? input.state.ndc.y : 0;
        moveStep(ny >= 0 ? 1 : -1);
      });

      roundIndex = 0;
      startRound();
    }

    return {
      start() {
        cameraIntro(() => {});

        // The frame loop runs immediately (idle drift + scenery behind the
        // overlay); gameplay logic gates on `started` until Start is pressed.
        unbindFrame = onFrame(frame);

        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "Submarine — Deep Dive the Number Line",
          objectiveEn:
            "Your sub dives forward on its own. Read the task at the top, then move the sub UP or DOWN with the arrows so you are at the right depth when the green token streams in. Grab the correct number; dodge the red mines.",
          objectiveEs:
            "Tu submarino avanza solo. Lee la tarea de arriba y mueve el submarino ARRIBA o ABAJO para estar a la profundidad correcta cuando llegue la ficha verde. Atrapa el número correcto y esquiva las minas rojas.",
          standard: "6.NS.C.5–7 · Integers, Opposites & Absolute Value",
          controls: [
            {
              key: "↑ / W",
              actionEn: "Rise — move the sub up toward the positives",
              actionEs: "Sube — mueve el submarino hacia los positivos",
            },
            {
              key: "↓ / S",
              actionEn: "Dive — move the sub down toward the negatives",
              actionEs: "Baja — mueve el submarino hacia los negativos",
            },
            {
              key: "Enter / ✓",
              actionEn: "Read out your depth and its distance from 0",
              actionEs: "Di tu profundidad y su distancia desde 0",
            },
            {
              key: "Tap / d-pad",
              actionEn: "Tap above or below the sub (or use the d-pad) to move",
              actionEs: "Toca arriba o abajo (o usa la cruceta) para mover",
            },
            {
              key: "?",
              actionEn: "Open this help panel any time (Esc closes it)",
              actionEs: "Abre esta ayuda cuando quieras (Esc la cierra)",
            },
          ],
          howToWinEn:
            "Each round names a target — a number, an opposite, an absolute value, or the greater/least of a set. Work out the depth, be there when the wave arrives, and grab the GREEN token. Red mines cost a life. Grab every token to surface and win. A 3+ streak earns bonus points!",
          howToWinEs:
            "Cada ronda nombra un objetivo. Calcula la profundidad, llega a tiempo y atrapa la ficha verde. Las minas rojas cuestan una vida. Atrapa todas para ganar.",
          onStart: beginGameplay,
          onPlayAgain: () => location.reload(),
        });
      },

      dispose() {
        started = false;
        if (clarity) clarity.dispose();
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        scene.remove(group);
        disposables.forEach((dp) => dp.dispose && dp.dispose());
        // Dispose all label sprites (textures + materials).
        const sprites = [
          depthLabel,
          ...lineLabels,
          ...streamers.map((s) => s.label),
        ];
        sprites.forEach(disposeSprite);
      },
    };
  },
};
