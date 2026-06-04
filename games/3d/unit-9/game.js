import { createGrid } from "/games/engine3d/grid.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";

/**
 * Unit 9 — Coordinate Quest.
 * Standards: 6.NS.C.6 (rational numbers / ordered pairs on the coordinate
 * plane, all four quadrants), 6.NS.C.8 (reflections + distance on the plane),
 * 6.G.A.3 (distance between points sharing a row/column).
 *
 * Theme: a glowing star-map observatory. Students pilot a holographic beacon
 * across the coordinate plane to plot ordered pairs, mirror points across an
 * axis, and step out distances.
 */

const COLORS = {
  beacon: 0x35e0d6, // hero cursor (cyan)
  target: 0xffd166, // goal ring (amber)
  plotted: 0x5aa9ff, // confirmed point (blue)
  reflection: 0xb98bff, // reflection image (violet)
  distance: 0xff9f5a, // distance endpoint (orange)
  axis: 0xdce8ff,
  card: "rgba(10,20,40,0.92)",
  mystery: 0xeaf2ff, // neutral marker for the point to read (no giveaway)
  padIdle: 0x1b4a76, // answer pad, not highlighted
  padActive: 0xffd166, // answer pad, highlighted
  padOk: 0x0f9d63, // answer pad, chosen-correct
};

// Each level lists 6–8 rounds. Level 1 = one quadrant + scaffolds; Level 2 =
// four quadrants with reflections and distances (multi-step enrichment).
function makeLevel(level) {
  if (level === 1) {
    return {
      grid: 10, // coords 0..5 used (Quadrant I only after centering)
      minCoord: 0,
      maxCoord: 5,
      hints: true,
      tasks: [
        { kind: "plot", x: 3, y: 2 },
        { kind: "plot", x: 0, y: 4 }, // on the y-axis
        { kind: "plot", x: 5, y: 0 }, // on the x-axis
        { kind: "identify", x: 2, y: 5 },
        { kind: "plot", x: 4, y: 3 },
        { kind: "identify", x: 1, y: 1 },
        { kind: "plot", x: 2, y: 4 },
      ],
    };
  }
  return {
    grid: 12,
    minCoord: -6,
    maxCoord: 6,
    hints: false,
    tasks: [
      { kind: "plot", x: -4, y: 3 },
      { kind: "plot", x: -3, y: -5 },
      { kind: "plot", x: 5, y: -2 },
      { kind: "reflect", x: 4, y: 2, axis: "x" }, // -> (4,-2)
      { kind: "reflect", x: -2, y: 5, axis: "y" }, // -> (2,5)
      { kind: "distance", a: { x: -5, y: 3 }, b: { x: 4, y: 3 } }, // |4-(-5)|=9
      { kind: "distance", a: { x: -2, y: -4 }, b: { x: -2, y: 5 } }, // |5-(-4)|=9
      { kind: "distance", a: { x: 1, y: -3 }, b: { x: 6, y: -3 } }, // |6-1|=5
    ],
  };
}

function quadrantName(x, y) {
  if (x === 0 && y === 0) return "the origin";
  if (x === 0) return "the y-axis";
  if (y === 0) return "the x-axis";
  if (x > 0 && y > 0) return "Quadrant I";
  if (x < 0 && y > 0) return "Quadrant II";
  if (x < 0 && y < 0) return "Quadrant III";
  return "Quadrant IV";
}

export default {
  id: "unit-9-coordinate-quest",
  vocab: [
    {
      term: "Coordinate plane",
      definition:
        "A flat grid made by a number line across (the x-axis) and a number line up and down (the y-axis).",
      emoji: "🗺️",
    },
    {
      term: "Ordered pair",
      definition:
        "Two numbers (x, y) that name one point. The x comes first, then the y.",
      emoji: "📍",
    },
    {
      term: "Quadrant",
      definition:
        "One of the four corners of the coordinate plane, split by the two axes.",
      emoji: "🧭",
    },
    {
      term: "Reflection",
      definition:
        "A mirror flip of a point over an axis. Flipping over the x-axis keeps x and changes the sign of y.",
      emoji: "🪞",
    },
    {
      term: "Distance",
      definition:
        "How far apart two points are. On the same row or column, subtract and take the absolute value.",
      emoji: "📏",
    },
  ],

  createGame(ctx) {
    const {
      scene,
      camera,
      renderer, // destructured per engine contract (used by feel.syncCamera path)
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
    // ---- Clarity / onboarding kit (shared overlay over the canvas) ----------
    // Mount element is the same positioned container that hosts the canvas.
    const clarityMount = renderer.domElement.parentElement || document.body;
    let clarity = null;

    const cfg = makeLevel(level);
    const N = cfg.grid;
    const HALF = N / 2; // vertex index of the origin

    const grid = createGrid(ctx, { n: N, cell: 1 });

    // Coordinate <-> vertex-index conversions.
    // +y must read "up and away" from the camera (standard coordinate-plane
    // orientation). The grid's +Z runs toward the camera, so invert y→j: larger
    // y maps to a smaller j (further into the screen). All consumers (beacon,
    // targets, reflections, distance, axis labels, pointer picking) route
    // through these two helpers, so the flip stays globally consistent.
    const coordToVertex = (x, y) => ({ i: x + HALF, j: HALF - y });
    const vertexToCoord = (i, j) => ({ x: i - HALF, y: HALF - j });
    const coordToWorld = (x, y) => {
      const { i, j } = coordToVertex(x, y);
      return grid.vertexWorld(i, j);
    };
    const inRange = (x, y) =>
      x >= cfg.minCoord &&
      x <= cfg.maxCoord &&
      y >= cfg.minCoord &&
      y <= cfg.maxCoord;

    const disposables = [];
    const timers = [];
    const labels = [];
    const persistentMarkers = [];
    const unbinders = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    // ---- Stage: a rounded shadow-catching platform under the plane ----
    const stageGeo = new RoundedBoxGeometry(N + 2.4, 0.6, N + 2.4, 4, 0.35);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x0c1b30,
      roughness: 0.85,
      metalness: 0.15,
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.y = -0.35;
    stage.receiveShadow = true;
    scene.add(stage);
    disposables.push(stageGeo, stageMat);

    // ---- Axis emphasis (bright lines along x=0 and y=0) ----
    const axisMat = new THREE.LineBasicMaterial({ color: COLORS.axis });
    disposables.push(axisMat);
    function addAxisLine(from, to) {
      const g = new THREE.BufferGeometry().setFromPoints([from, to]);
      const line = new THREE.Line(g, axisMat);
      line.position.y = 0.03;
      grid.group.add(line);
      disposables.push(g);
    }
    addAxisLine(coordToWorld(cfg.minCoord, 0), coordToWorld(cfg.maxCoord, 0));
    addAxisLine(coordToWorld(0, cfg.minCoord), coordToWorld(0, cfg.maxCoord));

    // ---- Origin marker (small glowing rounded cube) ----
    const originGeo = new RoundedBoxGeometry(0.3, 0.3, 0.3, 3, 0.08);
    const originMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x88aaff,
      emissiveIntensity: 0.6,
      roughness: 0.4,
    });
    const originCube = new THREE.Mesh(originGeo, originMat);
    const wOrigin = coordToWorld(0, 0);
    originCube.position.set(wOrigin.x, 0.18, wOrigin.z);
    originCube.castShadow = true;
    scene.add(originCube);
    disposables.push(originGeo, originMat);

    // ---- Axis tick labels ----
    function addTickLabels() {
      for (let c = cfg.minCoord; c <= cfg.maxCoord; c++) {
        if (c === 0) continue;
        // X-axis numbers: nudged just below the x-axis so they don't sit on it.
        const lx = makeLabel(String(c), {
          scale: 1.1,
          fontSize: 96,
          color: "#eaf4ff",
        });
        const wx = coordToWorld(c, 0);
        lx.position.set(wx.x, 0.6, wx.z + 0.5);
        grid.group.add(lx);
        labels.push(lx);
        // Y-axis numbers: nudged just left of the y-axis to avoid overlap.
        const ly = makeLabel(String(c), {
          scale: 1.1,
          fontSize: 96,
          color: "#eaf4ff",
        });
        const wy = coordToWorld(0, c);
        ly.position.set(wy.x - 0.5, 0.6, wy.z);
        grid.group.add(ly);
        labels.push(ly);
      }
      const ox = makeLabel("x", { scale: 1.0, color: "#9fd0ff" });
      const wox = coordToWorld(cfg.maxCoord, 0);
      ox.position.set(wox.x + 0.7, 0.6, wox.z);
      grid.group.add(ox);
      labels.push(ox);
      const oy = makeLabel("y", { scale: 1.0, color: "#9fd0ff" });
      const woy = coordToWorld(0, cfg.maxCoord);
      oy.position.set(woy.x, 0.6, woy.z - 0.7);
      grid.group.add(oy);
      labels.push(oy);
    }
    addTickLabels();

    // ---- Floating 3D problem card (always shows the math question) ----
    const card = makeLabel("", {
      scale: 0.92,
      fontSize: 56,
      color: "#ffffff",
      background: COLORS.card,
    });
    card.position.set(0, N * 0.62, -N * 0.5);
    scene.add(card);
    labels.push(card);
    function setCard(text) {
      updateLabel(card, text);
    }

    // ---- Beacon: hero cursor on a lattice point ----
    const beaconGeo = new RoundedBoxGeometry(0.42, 0.42, 0.42, 4, 0.12);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: COLORS.beacon,
      emissive: COLORS.beacon,
      emissiveIntensity: 0.65,
      roughness: 0.3,
      metalness: 0.25,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.castShadow = true;
    disposables.push(beaconGeo, beaconMat);
    scene.add(beacon);

    // ---- Target ring (goal vertex) ----
    const ringGeo = new THREE.TorusGeometry(0.36, 0.07, 12, 28);
    const ringMat = new THREE.MeshStandardMaterial({
      color: COLORS.target,
      emissive: COLORS.target,
      emissiveIntensity: 0.7,
      roughness: 0.35,
    });
    const targetRing = new THREE.Mesh(ringGeo, ringMat);
    targetRing.rotation.x = -Math.PI / 2;
    targetRing.visible = false;
    disposables.push(ringGeo, ringMat);
    scene.add(targetRing);

    const markerGeo = new THREE.SphereGeometry(0.2, 18, 14);
    disposables.push(markerGeo);

    // ---- Floating answer pads (identify + distance tasks) ----
    // A row of selectable choice pads floating beyond the plane. The student
    // highlights left/right and presses action/confirm to pick one. Reuses the
    // unit-8 "answer pad" idiom so identify/distance require reading/computing
    // the answer instead of navigating onto a glowing giveaway.
    const PAD_Z = HALF + 2.4; // in front of the plane, clear of every point
    const PAD_Y = 1.5;
    const padGeo = new RoundedBoxGeometry(2.2, 0.5, 1.4, 4, 0.14);
    disposables.push(padGeo);
    const padGroup = new THREE.Group();
    scene.add(padGroup);
    let pads = []; // [{ mesh, label, value }]
    let padIndex = 0;
    let answerChoices = null; // array of { value, label } when in answer mode
    let answerCorrect = null; // the correct value (string compare)

    function clearPads() {
      while (padGroup.children.length) {
        const child = padGroup.children.pop();
        if (child.geometry && child.geometry !== padGeo)
          child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      }
      pads = [];
      answerChoices = null;
      answerCorrect = null;
    }

    function buildPads(choices, correct) {
      clearPads();
      answerChoices = choices;
      answerCorrect = correct;
      padIndex = 0;
      const n = choices.length;
      const gap = 2.9;
      const startX = -((n - 1) * gap) / 2;
      choices.forEach((c, i) => {
        const mesh = new THREE.Mesh(
          padGeo,
          new THREE.MeshStandardMaterial({
            color: COLORS.padIdle,
            emissive: COLORS.padActive,
            emissiveIntensity: 0,
            roughness: 0.45,
            metalness: 0.2,
          }),
        );
        mesh.position.set(startX + i * gap, PAD_Y, PAD_Z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.padIndex = i;
        padGroup.add(mesh);
        const label = makeLabel(c.label, {
          scale: 1.0,
          fontSize: 96,
          color: "#ffffff",
        });
        label.position.set(startX + i * gap, PAD_Y + 0.62, PAD_Z);
        padGroup.add(label);
        pads.push({ mesh, label, value: c.value });
      });
      highlightPad();
    }

    function highlightPad() {
      pads.forEach((p, i) => {
        const on = i === padIndex;
        p.mesh.material.color.setHex(on ? COLORS.padActive : COLORS.padIdle);
        p.mesh.material.emissiveIntensity = on ? 0.75 : 0;
      });
      const p = pads[padIndex];
      if (p && !feel.reducedMotion) {
        feel.tween({
          from: 1,
          to: 1.12,
          duration: 0.12,
          onUpdate: (s) => p.mesh.scale.set(s, 1, s),
          onComplete: () => p.mesh.scale.set(1, 1, 1),
        });
      }
    }

    function movePad(delta) {
      if (phase !== "answer") return;
      padIndex = Math.max(0, Math.min(pads.length - 1, padIndex + delta));
      highlightPad();
      feel.sfx("select");
      const p = pads[padIndex];
      if (p) announce(`Choice ${p.value}.`);
    }

    function placeMarker(x, y, color) {
      const m = new THREE.Mesh(
        markerGeo,
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.45,
          roughness: 0.35,
        }),
      );
      const w = coordToWorld(x, y);
      m.position.set(w.x, 0.22, w.z);
      m.castShadow = true;
      m.scale.set(0.01, 0.01, 0.01);
      feel.tween({
        from: 0.01,
        to: 1,
        duration: 0.35,
        onUpdate: (v) => m.scale.set(v, v, v),
      });
      scene.add(m);
      persistentMarkers.push(m);
      return m;
    }

    function addPointLabel(x, y, color) {
      const lbl = makeLabel(`(${x}, ${y})`, {
        scale: 0.95,
        fontSize: 84,
        color,
      });
      const w = coordToWorld(x, y);
      lbl.position.set(w.x, 1.05, w.z);
      scene.add(lbl);
      persistentMarkers.push(lbl);
      return lbl;
    }

    // ---- Round state ----
    let taskIndex = 0;
    let task = null;
    let solved = false;
    // "navigate" = plot/reflect (drive the beacon to a computed spot).
    // "answer" = identify/distance (read/compute, then pick a floating pad).
    let phase = "navigate";
    let streak = 0;
    let bestStreak = 0;
    let solvedCount = 0;
    // Forgiving stakes: a pool of attempts; a wrong confirm costs one. Run out
    // and the quest fails (lose screen). Level 1 gets more cushion than Level 2.
    const START_LIVES = level === 2 ? 8 : 6;
    let lives = START_LIVES;
    let gameOver = false;
    const cursor = { x: 0, y: 0 };

    function clearMarkers() {
      while (persistentMarkers.length) {
        const m = persistentMarkers.pop();
        scene.remove(m);
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          if (m.material.map) m.material.map.dispose();
          m.material.dispose();
        }
      }
    }

    function beaconWorldY() {
      return 0.45;
    }

    function setCursor(x, y, animate) {
      cursor.x = Math.max(cfg.minCoord, Math.min(cfg.maxCoord, x));
      cursor.y = Math.max(cfg.minCoord, Math.min(cfg.maxCoord, y));
      const w = coordToWorld(cursor.x, cursor.y);
      if (animate && !feel.reducedMotion) {
        const sx = beacon.position.x;
        const sz = beacon.position.z;
        feel.tween({
          from: 0,
          to: 1,
          duration: 0.16,
          onUpdate: (t) => {
            beacon.position.set(
              sx + (w.x - sx) * t,
              beaconWorldY(),
              sz + (w.z - sz) * t,
            );
          },
        });
      } else {
        beacon.position.set(w.x, beaconWorldY(), w.z);
      }
      updateHud();
    }

    function objectiveText() {
      if (!task) return "";
      if (task.kind === "plot")
        return `Move the beacon to (${task.x}, ${task.y}). Then place it.`;
      if (task.kind === "identify")
        return "Read the point on the plane — x first, then y. Choose its ordered pair.";
      if (task.kind === "reflect") {
        const want = reflectTarget(task);
        return `Flip (${task.x}, ${task.y}) over the ${task.axis}-axis. Move to (${want.x}, ${want.y}) and place it.`;
      }
      if (task.kind === "distance")
        return "These two points share a row or column. Count the units between them, then choose the distance.";
      return "";
    }

    function updateHud() {
      // In the answer phase the beacon is idle, so don't clutter the prompt
      // with its position — just show the question and "pick a pad".
      if (phase === "answer") {
        const obj = `${objectiveText()}   Pick a pad.`;
        hud.setObjective(obj);
        setCard(`${objectiveText()}\nMove ← → between the pads, then choose.`);
        if (clarity) clarity.setObjective(obj);
        return;
      }
      const obj = `${objectiveText()}   Beacon now at (${cursor.x}, ${cursor.y})`;
      hud.setObjective(obj);
      setCard(`${objectiveText()}\nBeacon: (${cursor.x}, ${cursor.y})`);
      if (clarity) clarity.setObjective(obj);
    }

    // Plain-language "current target" chip text for the clarity mini-HUD.
    function targetChipText() {
      if (!task) return null;
      if (task.kind === "plot") return `Plot (${task.x}, ${task.y})`;
      if (task.kind === "identify") return "Read the point → choose its pair";
      if (task.kind === "reflect") {
        const want = reflectTarget(task);
        return `Flip over ${task.axis}-axis → (${want.x}, ${want.y})`;
      }
      if (task.kind === "distance")
        return "Count the units → choose the distance";
      return null;
    }

    function reflectTarget(t) {
      if (t.axis === "x") return { x: t.x, y: -t.y };
      return { x: -t.x, y: t.y };
    }

    // ---- Answer-choice builders (identify + distance) ----
    // Shuffle in place (Fisher-Yates) so the correct pad is not always first.
    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    // Take a correct value plus candidate distractors, keep the correct one,
    // drop duplicates and out-of-domain candidates, top up to `count`, shuffle.
    function makeChoices(correct, candidates, count, isValid) {
      const out = [correct];
      const seen = new Set([correct]);
      for (const c of candidates) {
        if (out.length >= count) break;
        if (c == null || seen.has(c)) continue;
        if (isValid && !isValid(c)) continue;
        seen.add(c);
        out.push(c);
      }
      // Safety top-up so there are always `count` distinct pads.
      let bump = 1;
      while (out.length < count) {
        for (const cand of [correct + bump, correct - bump]) {
          if (out.length >= count) break;
          if (seen.has(cand)) continue;
          if (isValid && !isValid(cand)) continue;
          seen.add(cand);
          out.push(cand);
        }
        bump += 1;
      }
      return shuffle(out);
    }

    // identify: ordered-pair pads. Distractors swap x/y and flip signs — the
    // classic mistakes when a student reads y before x or misreads a sign.
    function identifyChoices(x, y) {
      const fmtPair = (px, py) => `(${px}, ${py})`;
      const correct = fmtPair(x, y);
      const candidates = [
        fmtPair(y, x), // swapped x and y
        fmtPair(x, -y), // flipped the y sign
        fmtPair(-x, y), // flipped the x sign
        fmtPair(-x, -y), // flipped both signs
      ];
      const choices = makeChoices(correct, candidates, 4, null).map((v) => ({
        value: v,
        label: v,
      }));
      return { choices, correct };
    }

    // distance: numeric pads. Correct = |Δx| or |Δy| along the shared line.
    // Distractors: off-by-one, the perpendicular coordinate value, and the sum
    // instead of the difference (a common sign mistake across the origin).
    function distanceValue(a, b) {
      return a.y === b.y ? Math.abs(b.x - a.x) : Math.abs(b.y - a.y);
    }
    function distanceChoices(a, b) {
      const d = distanceValue(a, b);
      const sameRow = a.y === b.y;
      const sum = sameRow
        ? Math.abs(b.x) + Math.abs(a.x)
        : Math.abs(b.y) + Math.abs(a.y);
      const other = sameRow ? Math.abs(b.x) : Math.abs(b.y);
      const candidates = [d + 1, sum, d - 1, other, d + 2];
      const choices = makeChoices(d, candidates, 4, (v) => v >= 0).map((v) => ({
        value: String(v),
        label: String(v),
      }));
      return { choices, correct: String(d) };
    }

    function startTask() {
      solved = false;
      task = cfg.tasks[taskIndex];
      targetRing.visible = false;
      clearPads();
      phase = "navigate";
      hud.setProgress(taskIndex, cfg.tasks.length);
      if (clarity) clarity.setTarget(targetChipText());
      setCursor(0, 0);

      if (task.kind === "plot") {
        if (cfg.hints) {
          targetRing.visible = true;
          const w = coordToWorld(task.x, task.y);
          targetRing.position.set(w.x, 0.1, w.z);
        }
        announce(
          `Move the beacon to ${task.x}, ${task.y}. Go ${task.x} on x, then ${task.y} on y. Then place it.`,
        );
      } else if (task.kind === "identify") {
        // Answer task: show the point with a NEUTRAL marker (no gold ring, no
        // coordinate label) so it never reveals its ordered pair. The student
        // must read x then y off the axes and pick the matching pad.
        phase = "answer";
        placeMarker(task.x, task.y, COLORS.mystery);
        const { choices, correct } = identifyChoices(task.x, task.y);
        buildPads(choices, correct);
        announce(
          `Read the point on the plane. Find its x first, then its y. Move left and right between the pads, then choose its ordered pair.`,
        );
      } else if (task.kind === "reflect") {
        placeMarker(task.x, task.y, COLORS.plotted);
        addPointLabel(task.x, task.y, "#9fc4f0");
        const want = reflectTarget(task);
        announce(
          `Flip the point ${task.x}, ${task.y} over the ${task.axis}-axis. Move to ${want.x}, ${want.y} and place it.`,
        );
      } else if (task.kind === "distance") {
        // Answer task: both points are shown, but the student computes the
        // distance and picks the numeric pad — the game no longer counts for
        // them by walking the beacon between the endpoints.
        phase = "answer";
        placeMarker(task.a.x, task.a.y, COLORS.plotted);
        addPointLabel(task.a.x, task.a.y, "#9fc4f0");
        placeMarker(task.b.x, task.b.y, COLORS.distance);
        addPointLabel(task.b.x, task.b.y, "#f0c08a");
        drawDistanceBar(task.a, task.b);
        const { choices, correct } = distanceChoices(task.a, task.b);
        buildPads(choices, correct);
        announce(
          `These two points share a row or column. Count the units between them, then move left and right between the pads and choose the distance.`,
        );
      }
      feel.sfx("select", `Task ${taskIndex + 1} of ${cfg.tasks.length}.`);
      caption(objectiveText());
      updateHud();
      if (cfg.hints && task.kind === "plot") {
        later(
          () =>
            hud.message(
              "Right/left changes x. Up/down changes y. Then place.",
              {
                tone: "info",
                duration: 2600,
              },
            ),
          400,
        );
      }
    }

    function win(points, msg, sayit) {
      solved = true;
      solvedCount += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      hud.setStreak(streak);
      onScore(points, { task: taskIndex + 1, kind: task.kind });
      const burstPos = { x: beacon.position.x, y: 0.8, z: beacon.position.z };
      feel.burst(burstPos, { color: COLORS.target, count: 30, spread: 3 });
      feel.shake(0.26, 0.3);
      feel.sfx("correct", sayit);
      const okMsg = `${msg} +${points}`;
      hud.feedback(true, okMsg, { duration: 2400 });
      // celebratory pop on the beacon
      feel.tween({
        from: 1,
        to: 1.5,
        duration: 0.18,
        onUpdate: (v) => beacon.scale.set(v, v, v),
        onComplete: () => beacon.scale.set(1, 1, 1),
      });

      later(() => {
        clearMarkers();
        clearPads();
        if (taskIndex < cfg.tasks.length - 1) {
          taskIndex += 1;
          startTask();
        } else {
          finish();
        }
      }, 2600);
    }

    function finish() {
      hud.setProgress(cfg.tasks.length, cfg.tasks.length);
      hud.setObjective(
        `Done! You plotted ${solvedCount} of ${cfg.tasks.length} points. Best streak: ${bestStreak}.`,
      );
      setCard(
        `Quest complete!\n${solvedCount}/${cfg.tasks.length} points • streak ${bestStreak}`,
      );
      hud.message("All tasks complete!", { tone: "ok", duration: 0 });
      feel.sfx(
        "fanfare",
        `All tasks complete. You solved ${solvedCount} with a best streak of ${bestStreak}. Great work, star pilot.`,
      );
      // confetti from above the origin
      const wo = coordToWorld(0, 0);
      feel.burst(
        { x: wo.x, y: 3, z: wo.z },
        { color: COLORS.beacon, count: 60, spread: 6, life: 1.4 },
      );
      feel.shake(0.32, 0.5);
      if (clarity) {
        clarity.setTarget(null);
        clarity.win({
          titleEn: "Quest complete!",
          badge: "🗺️",
          stats: `You charted ${solvedCount} of ${cfg.tasks.length} points. Best streak: ${bestStreak}. Score saved.`,
        });
      }
    }

    function reject(msg) {
      streak = 0;
      hud.setStreak(0);
      feel.shake(0.14, 0.25);
      feel.sfx("wrong", msg);
      lives = Math.max(0, lives - 1);
      if (typeof hud.setLives === "function") hud.setLives(lives);
      if (lives <= 0) {
        loseGame();
        return;
      }
      hud.feedback(
        false,
        `${msg} ${lives} ${lives === 1 ? "try" : "tries"} left.`,
      );
    }

    function loseGame() {
      gameOver = true;
      feel.sfx("wrong");
      const msg = `Out of tries! You charted ${solvedCount} of ${cfg.tasks.length} points.`;
      hud.setObjective(msg);
      announce(`Quest over. ${msg} Press Play Again to retry.`);
      if (clarity) {
        clarity.setTarget(null);
        clarity.lose({
          titleEn: "Out of tries!",
          badge: "🗺️",
          stats: `${msg} Tip: read the x-coordinate (across) before the y-coordinate (up/down).`,
        });
      }
    }

    function drawDistanceBar(a, b) {
      const wa = coordToWorld(a.x, a.y);
      const wb = coordToWorld(b.x, b.y);
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(wa.x, 0.16, wa.z),
        new THREE.Vector3(wb.x, 0.16, wb.z),
      ]);
      const m = new THREE.LineBasicMaterial({ color: COLORS.distance });
      const line = new THREE.Line(g, m);
      scene.add(line);
      persistentMarkers.push(line);
    }

    // Identify/distance reward: the worked answer, shown after a correct pick.
    function showDistanceResult() {
      const dist = distanceValue(task.a, task.b);
      const lbl = makeLabel(`distance = ${dist}`, {
        scale: 0.9,
        fontSize: 80,
        color: "#f0c08a",
      });
      const mx = (task.a.x + task.b.x) / 2;
      const my = (task.a.y + task.b.y) / 2;
      const w = coordToWorld(mx, my);
      lbl.position.set(w.x, 1.1, w.z);
      scene.add(lbl);
      persistentMarkers.push(lbl);
    }

    function distanceExpr() {
      const dist = distanceValue(task.a, task.b);
      const fmtOperand = (n) => (n < 0 ? `(−${Math.abs(n)})` : `${n}`);
      return task.a.y === task.b.y
        ? `|${fmtOperand(task.b.x)} − ${fmtOperand(task.a.x)}| = ${dist}`
        : `|${fmtOperand(task.b.y)} − ${fmtOperand(task.a.y)}| = ${dist}`;
    }

    // Handle a pad selection for identify/distance (the "answer" phase).
    function chooseAnswer() {
      if (solved || !task || gameOver || phase !== "answer") return;
      const p = pads[padIndex];
      if (!p) return;
      const ok = p.value === answerCorrect;
      if (!ok) {
        const tip =
          task.kind === "identify"
            ? "Read the x first, then the y."
            : "Count the units between them.";
        reject(`Not that one. ${tip}`);
        return;
      }
      // Correct: light the pad green, then advance via the shared win() flow.
      p.mesh.material.color.setHex(COLORS.padOk);
      p.mesh.material.emissive.setHex(COLORS.padOk);
      p.mesh.material.emissiveIntensity = 0.9;
      feel.burst(
        { x: p.mesh.position.x, y: PAD_Y + 0.4, z: PAD_Z },
        { color: COLORS.target, count: 34, spread: 4 },
      );
      if (task.kind === "identify") {
        addPointLabel(task.x, task.y, "#9fc4f0");
        win(
          20,
          `Correct: (${task.x}, ${task.y}).`,
          `Yes. The point is the ordered pair ${task.x}, ${task.y}, in ${quadrantName(task.x, task.y)}.`,
        );
      } else {
        const dist = distanceValue(task.a, task.b);
        showDistanceResult();
        win(
          25,
          `Distance = ${dist}. ${distanceExpr()}`,
          `The points line up, so the distance is the absolute value of the difference: ${dist} units.`,
        );
      }
    }

    function attempt() {
      if (solved || !task || gameOver) return;
      if (phase === "answer") {
        chooseAnswer();
        return;
      }

      if (task.kind === "plot") {
        if (cursor.x === task.x && cursor.y === task.y) {
          placeMarker(task.x, task.y, COLORS.plotted);
          addPointLabel(task.x, task.y, "#9fc4f0");
          win(
            20,
            `Plotted (${task.x}, ${task.y}) in ${quadrantName(task.x, task.y)}.`,
            `Correct. You plotted the ordered pair ${task.x}, ${task.y}, on ${quadrantName(task.x, task.y)}.`,
          );
        } else {
          reject(
            `Not there yet. Go to (${task.x}, ${task.y}). You are at (${cursor.x}, ${cursor.y}).`,
          );
        }
        return;
      }

      if (task.kind === "reflect") {
        const want = reflectTarget(task);
        if (cursor.x === want.x && cursor.y === want.y) {
          placeMarker(want.x, want.y, COLORS.reflection);
          addPointLabel(want.x, want.y, "#c8b6ff");
          const rule =
            task.axis === "x"
              ? "Reflecting across the x-axis keeps x and flips the sign of y"
              : "Reflecting across the y-axis flips the sign of x and keeps y";
          win(
            25,
            `Reflection (${want.x}, ${want.y}) correct!`,
            `${rule}. The image of ${task.x}, ${task.y} is ${want.x}, ${want.y}.`,
          );
        } else {
          reject(
            `Not the flip. Over the ${task.axis}-axis, go to (${want.x}, ${want.y}). You are at (${cursor.x}, ${cursor.y}).`,
          );
        }
        return;
      }
    }

    // ---- Movement ----
    function move(dx, dy) {
      if (gameOver) return;
      const before = `${cursor.x},${cursor.y}`;
      setCursor(cursor.x + dx, cursor.y + dy, true);
      if (`${cursor.x},${cursor.y}` !== before) feel.sfx("pop");
      announce(
        `Beacon at ${cursor.x}, ${cursor.y}. ${quadrantName(cursor.x, cursor.y)}.`,
      );
    }

    function pointerToCoord() {
      const hits = input.raycast(camera, [grid.pickPlane], false);
      if (!hits.length) return null;
      const { i, j, inBounds } = grid.worldToVertex(hits[0].point);
      if (!inBounds) return null;
      const { x, y } = vertexToCoord(i, j);
      return inRange(x, y) ? { x, y } : null;
    }

    return {
      start() {
        // Animated camera intro: sweep from a high wide angle into framing.
        const target = new THREE.Vector3(0, N * 1.25, N * 1.15);
        if (feel.reducedMotion) {
          camera.position.copy(target);
        } else {
          const startPos = new THREE.Vector3(N * 1.6, N * 2.0, N * 1.9);
          camera.position.copy(startPos);
          feel.tween({
            from: 0,
            to: 1,
            duration: 1.1,
            onUpdate: (t) => {
              camera.position.lerpVectors(startPos, target, t);
              camera.lookAt(0, 0, 0);
            },
            onComplete: () => feel.syncCamera(),
          });
        }
        camera.lookAt(0, 0, 0);
        feel.syncCamera();

        // Begin the interactive task loop + bind input only after the student
        // presses Start in the clarity overlay. The camera intro and idle
        // animation below may run immediately behind the overlay.
        function beginGameplay() {
          taskIndex = 0;
          lives = START_LIVES;
          gameOver = false;
          if (typeof hud.setLives === "function") hud.setLives(lives);
          startTask();

          unbinders.push(
            input.onPress((name) => {
              // Answer phase (identify/distance): left/right highlight a pad,
              // action/confirm picks it. The beacon does not move here.
              if (phase === "answer") {
                if (name === "left") movePad(-1);
                else if (name === "right") movePad(1);
                else if (name === "action" || name === "confirm")
                  chooseAnswer();
                return;
              }
              // Navigate phase (plot/reflect): drive the beacon, then place.
              if (name === "up") move(0, 1);
              else if (name === "down") move(0, -1);
              else if (name === "left") move(-1, 0);
              else if (name === "right") move(1, 0);
              else if (name === "action" || name === "confirm") attempt();
            }),
          );

          unbinders.push(
            input.onTap(() => {
              if (solved || gameOver) return;
              // Answer phase: tap a pad to highlight + choose it.
              if (phase === "answer") {
                const hits = input.raycast(
                  camera,
                  pads.map((p) => p.mesh),
                  false,
                );
                if (!hits.length) return;
                const i = hits[0].object.userData.padIndex;
                if (i == null) return;
                padIndex = i;
                highlightPad();
                chooseAnswer();
                return;
              }
              // Navigate phase: tap a grid spot to jump the beacon and check.
              const c = pointerToCoord();
              if (!c) return;
              setCursor(c.x, c.y, true);
              feel.sfx("pop");
              announce(`Beacon at ${c.x}, ${c.y}.`);
              attempt();
            }),
          );
        }

        // Clarity / onboarding kit: start overlay, how-to-play, persistent help
        // button, mini-HUD, and win screen. Drives nothing in the 3D scene.
        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "Coordinate Quest — Chart the Star Map",
          objectiveEn:
            "Pilot the beacon across the coordinate plane to plot ordered pairs, reflect points over an axis, and measure distances.",
          objectiveEs:
            "Mueve la baliza por el plano de coordenadas para ubicar pares ordenados, reflejar puntos y medir distancias.",
          standard: "6.NS.C.6 · 6.NS.C.8 · 6.G.A.3 — Coordinate Plane",
          controls: [
            {
              key: "← / → (or A / D)",
              actionEn:
                "Plot & flip tasks: move the beacon's x. Read & distance tasks: move between answer pads",
              actionEs:
                "Tareas de ubicar y reflejar: mueve la x de la baliza. Tareas de leer y distancia: muévete entre los botones",
            },
            {
              key: "↑ / ↓ (or W / S)",
              actionEn: "Move the beacon up or down — changes the y value",
              actionEs: "Mueve la baliza arriba o abajo — cambia la y",
            },
            {
              key: "Space / Enter",
              actionEn:
                "Place the beacon, or choose the highlighted answer pad (the ● button too)",
              actionEs:
                "Coloca la baliza o elige el botón de respuesta marcado (botón ●)",
            },
            {
              key: "Tap / Click",
              actionEn:
                "Tap a grid spot to move the beacon, or tap an answer pad to choose it",
              actionEs:
                "Toca un punto para mover la baliza o toca un botón para elegir la respuesta",
            },
            {
              key: "D-pad",
              actionEn: "On touch screens, use the on-screen arrows to move",
              actionEs: "En pantalla táctil, usa las flechas para mover",
            },
            {
              key: "?",
              actionEn: "Open this help panel any time (Esc closes it)",
              actionEs: "Abre esta ayuda cuando quieras (Esc la cierra)",
            },
          ],
          howToWinEn:
            "Plot pairs like (x, y) and flip points over an axis by driving the beacon there and placing it. To read a point or measure a distance, work out the answer and choose the matching floating pad. Clear every task to win!",
          howToWinEs:
            "Ubica pares como (x, y) y refleja puntos llevando la baliza al lugar correcto. Para leer un punto o medir una distancia, calcula la respuesta y elige el botón flotante correcto. Completa todas las tareas para ganar.",
          onStart: beginGameplay,
          onPlayAgain: () => location.reload(),
        });

        if (!feel.reducedMotion) {
          unbinders.push(
            onFrame((dt, t) => {
              const s = 1 + Math.sin(t * 4) * 0.07;
              if (Math.abs(beacon.scale.x - 1) < 0.5) beacon.scale.set(s, s, s);
              beacon.rotation.y = t * 0.8;
              originCube.rotation.y = t * 0.5;
              if (targetRing.visible) {
                targetRing.rotation.z = t * 1.5;
                const r = 1 + Math.sin(t * 5) * 0.06;
                targetRing.scale.set(r, r, 1);
              }
            }),
          );
        }
      },

      dispose() {
        if (clarity) clarity.dispose();
        unbinders.forEach((u) => u && u());
        unbinders.length = 0;
        timers.forEach(clearTimeout);
        timers.length = 0;
        clearMarkers();
        clearPads();
        labels.forEach((l) => {
          if (l.material) {
            if (l.material.map) l.material.map.dispose();
            l.material.dispose();
          }
        });
        disposables.forEach((d) => d.dispose && d.dispose());
        scene.remove(stage);
        scene.remove(originCube);
        scene.remove(beacon);
        scene.remove(targetRing);
        scene.remove(card);
        scene.remove(padGroup);
        grid.dispose();
      },
    };
  },
};
