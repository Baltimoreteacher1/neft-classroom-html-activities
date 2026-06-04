import { prismVolume } from "/games/engine3d/geometry-math.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";

/* ============================================================================
 * Unit 10 — VOLUME VAULT  (CCSS 6.G.A.2)
 * REAL-TIME PACK-THE-PRISM ARCADE. A factory chute drops unit cubes in real
 * time. The player slides the drop column left/right; each cube SNAPS down and
 * auto-stacks layer by layer. Pack the rectangular prism with EXACTLY
 * l × w × h cubes before the timer runs out — that count IS the volume.
 *
 * Miss the vault (let a cube fall past the open mouth, or drop onto a full
 * column while empty cells remain) and you lose a life. Fill the prism in time
 * and a SPEED-ROUND answer gate appears: pick the numeric volume (l × w × h)
 * under time pressure for combo points. The math is the gameplay — you build
 * and read the volume, you never copy it.
 *
 *   Level 1 (support):  smaller prisms, more time, slower drops, hints.
 *   Level 2 (enrichment): bigger prisms, tighter timer, faster drops.
 * ==========================================================================*/

const COLORS = {
  vault: 0xf2c15b, // gold vault frame / accents
  vaultGlow: 0xffd97a,
  cube: [0x35c9c3, 0x5b9cff, 0xffb454, 0xb98cff, 0x53d08a, 0xff7e6b],
  columnOk: 0x35c9c3,
  columnBad: 0xff7e6b,
  floor: 0x0c1c33,
  pad: 0x16335b,
  chute: 0xf2c15b,
  gateGood: 0x2f8f63,
  gateBad: 0x35507a,
  good: 0x4aa978,
  bad: 0xd9795d,
};

// ---------------------------------------------------------------------------
// Level design — a sequence of whole-number prisms. Level 2 is strictly harder:
// bigger boxes, less time, faster cube drops.
// ---------------------------------------------------------------------------
function makeLevel(level) {
  if (level === 1) {
    return {
      hints: true,
      startLives: 5,
      dropInterval: 1.05, // seconds between cube drops (eases down over a round)
      dropAccel: 0.94, // each drop multiplies the interval (slowly speeds up)
      minInterval: 0.55,
      fallSpeed: 9, // world units / sec the cube falls
      timePerCube: 1.5, // round timer = cubes × this (seconds)
      gateTime: 7, // seconds to answer the speed-round volume gate
      rounds: [
        { l: 2, w: 2, h: 1 }, // 4
        { l: 3, w: 2, h: 1 }, // 6
        { l: 2, w: 2, h: 2 }, // 8
        { l: 3, w: 2, h: 2 }, // 12
        { l: 4, w: 3, h: 1 }, // 12
        { l: 3, w: 3, h: 2 }, // 18
      ],
    };
  }
  return {
    hints: false,
    startLives: 4,
    dropInterval: 0.82,
    dropAccel: 0.92,
    minInterval: 0.4,
    fallSpeed: 12,
    timePerCube: 1.15,
    gateTime: 5.5,
    rounds: [
      { l: 3, w: 2, h: 2 }, // 12
      { l: 4, w: 2, h: 2 }, // 16
      { l: 3, w: 3, h: 2 }, // 18
      { l: 4, w: 3, h: 2 }, // 24
      { l: 5, w: 2, h: 2 }, // 20
      { l: 4, w: 3, h: 3 }, // 36
    ],
  };
}

// ---- Speed-round answer-gate distractors (plausible volume mistakes) --------
function volumeDistractors(answer, l, w, h) {
  const cands = [];
  const push = (v) => {
    if (!Number.isFinite(v)) return;
    v = Math.round(v);
    if (v <= 0 || v === answer || cands.includes(v)) return;
    cands.push(v);
  };
  push(l + w + h); // added instead of multiplied
  push(l * w); // forgot the height (just the base)
  push(2 * (l * w + w * h + l * h)); // computed surface area instead
  push(answer + l); // off by one edge
  push(answer - w);
  push(answer + 2);
  push(answer - 2);
  push(answer * 2);
  let pad = answer + 3;
  while (cands.length < 2) {
    push(pad);
    pad += 1;
  }
  return [cands[0], cands.find((v) => v !== cands[0])];
}

function buildGateChoices(answer, l, w, h) {
  const wrong = volumeDistractors(answer, l, w, h);
  const labels = [answer, wrong[0], wrong[1]];
  for (let i = labels.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [labels[i], labels[j]] = [labels[j], labels[i]];
  }
  return { labels, correctLane: labels.indexOf(answer) };
}

export default {
  id: "unit-10-volume-vault",
  vocab: [
    {
      term: "Volume",
      definition:
        "The amount of space inside a solid shape. We measure it in cubic units.",
      emoji: "📦",
    },
    {
      term: "Unit cube",
      definition:
        "A small cube whose every edge is 1 unit long. Its volume is 1 cubic unit.",
      emoji: "🧊",
    },
    {
      term: "Rectangular prism",
      definition:
        "A 3D box with six flat rectangle faces, like a brick or a vault.",
      emoji: "🧱",
    },
    {
      term: "Edge length",
      definition:
        "How long one side of the prism is. A prism has a length, a width, and a height.",
      emoji: "📏",
    },
    {
      term: "Cubic unit",
      definition:
        "The unit we count volume in — the space filled by one unit cube.",
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
    } = ctx;

    const cfg = makeLevel(level);
    const reduced = feel.reducedMotion;

    const clarityMount = renderer.domElement.parentElement || document.body;
    let clarity = null;

    const group = new THREE.Group();
    scene.add(group);

    // ---- Shared geometry/material resources (disposed in dispose) ----------
    const unitCubeGeo = new RoundedBoxGeometry(0.9, 0.9, 0.9, 3, 0.12);
    const fallingCubeGeo = new RoundedBoxGeometry(0.86, 0.86, 0.86, 3, 0.12);
    const disposables = [unitCubeGeo, fallingCubeGeo];
    const mk = (g, m) => {
      disposables.push(g, m);
      return new THREE.Mesh(g, m);
    };

    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    // ---- Stage: floor + glowing vault pad ----------------------------------
    const floor = mk(
      new THREE.CircleGeometry(26, 64),
      new THREE.MeshStandardMaterial({
        color: COLORS.floor,
        roughness: 0.92,
        metalness: 0.05,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.001;
    floor.receiveShadow = true;
    group.add(floor);

    const padMat = new THREE.MeshStandardMaterial({
      color: COLORS.pad,
      roughness: 0.5,
      metalness: 0.25,
      emissive: COLORS.vault,
      emissiveIntensity: 0.06,
    });
    const pad = mk(new RoundedBoxGeometry(11, 0.4, 11, 3, 0.25), padMat);
    pad.position.y = -0.2;
    pad.receiveShadow = true;
    group.add(pad);

    // ---- Factory chute (drop spout that slides above the prism) ------------
    const chuteMat = new THREE.MeshStandardMaterial({
      color: COLORS.chute,
      roughness: 0.4,
      metalness: 0.4,
      emissive: COLORS.chute,
      emissiveIntensity: 0.35,
    });
    const chute = mk(new RoundedBoxGeometry(1.3, 0.7, 1.3, 3, 0.18), chuteMat);
    chute.castShadow = true;
    chute.visible = false;
    group.add(chute);

    // ---- The single live falling cube --------------------------------------
    const fallingMat = new THREE.MeshStandardMaterial({
      roughness: 0.3,
      metalness: 0.15,
      emissiveIntensity: 0.5,
    });
    disposables.push(fallingMat);
    const fallingCube = new THREE.Mesh(fallingCubeGeo, fallingMat);
    fallingCube.castShadow = true;
    fallingCube.visible = false;
    group.add(fallingCube);

    // ---- Column highlight (shows which column the next cube drops into) ----
    const columnMat = new THREE.MeshBasicMaterial({
      color: COLORS.columnOk,
      transparent: true,
      opacity: 0.22,
    });
    disposables.push(columnMat);
    const columnGeo = new THREE.BoxGeometry(0.96, 1, 0.96);
    disposables.push(columnGeo);
    const columnMesh = new THREE.Mesh(columnGeo, columnMat);
    columnMesh.visible = false;
    group.add(columnMesh);

    // ---- 3D problem card above the vault -----------------------------------
    const problemCard = makeLabel("", {
      scale: 1.0,
      fontSize: 70,
      background: "rgba(12,28,51,0.92)",
      color: "#ffe6a8",
    });
    problemCard.visible = false;
    group.add(problemCard);
    function setProblemCard(text) {
      updateLabel(problemCard, text);
    }

    // ---- Per-round transient meshes (frame, placed cubes) ------------------
    const frameMeshes = [];
    const labels = [];
    let cubeMesh = null; // InstancedMesh of placed cubes
    const dummy = new THREE.Object3D();

    function clearRoundMeshes() {
      frameMeshes.forEach((m) => {
        group.remove(m);
        if (m.geometry) m.geometry.dispose();
        if (m.material) m.material.dispose();
      });
      frameMeshes.length = 0;
      labels.forEach((l) => {
        group.remove(l);
        if (l.material.map) l.material.map.dispose();
        l.material.dispose();
      });
      labels.length = 0;
      if (cubeMesh) {
        group.remove(cubeMesh);
        cubeMesh.material.dispose();
        cubeMesh = null;
      }
      gateGroup.visible = false;
    }

    // =====================================================================
    // SPEED-ROUND answer gate (3 floating panels). Reused each round.
    // =====================================================================
    const gateGroup = new THREE.Group();
    gateGroup.visible = false;
    group.add(gateGroup);
    const gatePanels = [];
    const gateLabels = [];
    const GATE_LANE_X = [-3.4, 0, 3.4];
    for (let i = 0; i < 3; i++) {
      const lane = new THREE.Group();
      lane.position.x = GATE_LANE_X[i];
      const pmat = new THREE.MeshStandardMaterial({
        color: COLORS.gateBad,
        roughness: 0.45,
        metalness: 0.25,
        emissive: COLORS.gateBad,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.94,
      });
      disposables.push(pmat);
      const panel = new THREE.Mesh(
        new RoundedBoxGeometry(2.6, 2.0, 0.3, 3, 0.12),
        pmat,
      );
      disposables.push(panel.geometry);
      panel.position.y = 1.4;
      lane.add(panel);
      const lbl = makeLabel("", {
        fontSize: 100,
        scale: 1.5,
        color: "#ffffff",
        background: "rgba(0,0,0,0)",
        border: null,
      });
      lbl.position.set(0, 1.4, 0.25);
      lane.add(lbl);
      gateGroup.add(lane);
      gatePanels.push(panel);
      gateLabels.push(lbl);
    }

    // ---- Game / round state -------------------------------------------------
    let roundIndex = 0;
    let round = null;
    let phase = "idle"; // idle | packing | gate | between | over
    let solvedCount = 0;
    let streak = 0;
    let bestStreak = 0;
    let lives = cfg.startLives;
    let gameOver = false;

    // Prism grid (whole-unit cells): nx (length) × ny (height) × nz (width).
    let nx = 0;
    let ny = 0;
    let nz = 0;
    let targetCount = 0;
    let placedCount = 0;
    let heights = []; // heights[x][z] = how many cubes stacked in that column
    let colSel = 0; // currently selected column index (0..nx*nz-1, row-major x then z)
    let originX = 0;
    let originZ = 0;

    // Falling-cube animation state.
    let cubeY = 0;
    let cubeFalling = false;
    let cubeTargetX = 0;
    let cubeTargetZ = 0;
    let cubeColHex = COLORS.cube[0];
    let dropTimer = 0;
    let curInterval = 1;
    let roundTime = 0; // counts down

    // Gate state.
    let gateCorrectLane = 0;
    let gateChoice = 1;
    let gateTime = 0;
    let gateAnswer = 0;

    let unbindPress = null;
    let unbindTap = null;
    let unbindFrame = null;
    let unbindIdle = null;

    // ----------------------------------------------------------------------
    function colCount() {
      return nx * nz;
    }
    function colXZ(idx) {
      return { x: idx % nx, z: Math.floor(idx / nx) };
    }
    function cellCenter(x, j, z) {
      return new THREE.Vector3(originX + x + 0.5, j + 0.5, originZ + z + 0.5);
    }

    function buildVaultFrame(lx, ly, lz, color = COLORS.vault) {
      const box = new THREE.BoxGeometry(lx, ly, lz);
      const edges = new THREE.EdgesGeometry(box);
      box.dispose();
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color, linewidth: 2 }),
      );
      line.position.set(0, ly / 2, 0);
      return line;
    }

    // =====================================================================
    // START A PACKING ROUND
    // =====================================================================
    function startRound() {
      clearRoundMeshes();
      round = cfg.rounds[roundIndex];
      phase = "packing";

      nx = round.l;
      ny = round.h;
      nz = round.w;
      originX = -nx / 2;
      originZ = -nz / 2;
      targetCount = nx * ny * nz;
      placedCount = 0;
      colSel = 0;

      heights = [];
      for (let x = 0; x < nx; x++) heights[x] = new Array(nz).fill(0);

      // Gold vault outline.
      const frame = buildVaultFrame(nx, ny, nz);
      group.add(frame);
      frameMeshes.push(frame);

      // Placed-cube instanced mesh.
      const mat = new THREE.MeshStandardMaterial({
        roughness: 0.32,
        metalness: 0.15,
        emissiveIntensity: 0.3,
      });
      cubeMesh = new THREE.InstancedMesh(unitCubeGeo, mat, targetCount);
      cubeMesh.count = 0;
      cubeMesh.castShadow = true;
      cubeMesh.receiveShadow = true;
      cubeMesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(targetCount * 3),
        3,
      );
      group.add(cubeMesh);

      // Drop pacing + round timer.
      curInterval = cfg.dropInterval;
      dropTimer = 0.6; // brief grace before the first cube
      roundTime = Math.max(8, Math.round(targetCount * cfg.timePerCube));

      columnMesh.visible = true;
      chute.visible = true;
      cubeFalling = false;
      fallingCube.visible = false;

      if (typeof hud.setProgress === "function")
        hud.setProgress(roundIndex, cfg.rounds.length);
      if (typeof hud.setTimer === "function") hud.setTimer(roundTime);

      problemCard.position.set(0, ny + 2.2, 0);
      setProblemCard(`PACK IT:  ${round.l} × ${round.w} × ${round.h}`);

      pickNextColumn(true);
      updatePackObjective();

      announce(
        `Round ${roundIndex + 1}. Pack the ${round.l} by ${round.w} by ${round.h} vault. ` +
          `Slide left and right to aim the chute, then press to drop a cube. Fill every cell before time runs out.`,
      );
      if (cfg.hints) {
        hud.message("Slide left/right to aim · press to drop a cube fast!", {
          tone: "info",
          duration: 3600,
        });
      }
      feel.sfx("select");
    }

    function placedVolumeText() {
      return `${placedCount} / ${targetCount} cubes`;
    }

    function updatePackObjective() {
      const text =
        `Pack the vault: ${round.l} × ${round.w} × ${round.h}. ` +
        `Cubes placed: ${placedCount} / ${targetCount}.`;
      hud.setObjective(text);
      if (clarity) {
        clarity.setObjective(text);
        clarity.setTarget(`Fill every cell · V = length × width × height`);
      }
    }

    // Auto-pick the nearest column that still has room, preferring the current
    // selection. Used so the highlight always rests on a fillable column.
    function pickNextColumn(reset) {
      if (reset) colSel = 0;
      const total = colCount();
      for (let n = 0; n < total; n++) {
        const idx = (colSel + n) % total;
        const { x, z } = colXZ(idx);
        if (heights[x][z] < ny) {
          colSel = idx;
          refreshColumn();
          return true;
        }
      }
      return false; // prism full
    }

    function refreshColumn() {
      const { x, z } = colXZ(colSel);
      const stacked = heights[x][z];
      const full = stacked >= ny;
      columnMesh.position.set(originX + x + 0.5, ny / 2, originZ + z + 0.5);
      columnMesh.scale.set(1, ny, 1);
      const col = full ? COLORS.columnBad : COLORS.columnOk;
      columnMat.color.setHex(col);
      // Park the chute above the selected column.
      chute.position.set(originX + x + 0.5, ny + 1.1, originZ + z + 0.5);
    }

    function moveColumn(dir) {
      if (phase !== "packing") return;
      const total = colCount();
      // Move to the adjacent column (wrap), regardless of fullness, so aiming
      // feels direct. The drop itself validates fullness.
      colSel = (colSel + dir + total) % total;
      refreshColumn();
      feel.sfx("select");
      const { x, z } = colXZ(colSel);
      announce(`Column ${x + 1}, row ${z + 1}.`);
    }

    // Drop a cube into the selected column right now (player action) or let the
    // factory auto-drop one when its timer fires.
    function dropCube() {
      if (phase !== "packing" || cubeFalling) return;
      const { x, z } = colXZ(colSel);
      if (heights[x][z] >= ny) {
        // Column is full — the cube spills. Costs a life (over-fill mistake).
        spillCube(x, z);
        return;
      }
      // Launch the falling cube from the chute toward the lowest empty cell.
      cubeTargetX = x;
      cubeTargetZ = z;
      cubeColHex = COLORS.cube[placedCount % COLORS.cube.length];
      fallingMat.color.setHex(cubeColHex);
      fallingMat.emissive.setHex(cubeColHex);
      const landY = heights[x][z] + 0.5;
      fallingCube.position.set(originX + x + 0.5, ny + 1.1, originZ + z + 0.5);
      cubeY = ny + 1.1;
      fallingCube.scale.setScalar(1);
      fallingCube.visible = true;
      cubeFalling = true;
      fallingCube.userData.landY = landY;
      feel.sfx("pop");
      // Reset auto-drop timer so manual + auto don't double up.
      dropTimer = curInterval;
    }

    function spillCube(x, z) {
      feel.sfx("wrong");
      if (!reduced) feel.shake(0.12);
      feel.burst(
        { x: originX + x + 0.5, y: ny + 0.6, z: originZ + z + 0.5 },
        { color: COLORS.bad, count: reduced ? 0 : 14, spread: 2.2 },
      );
      loseLife("Column already full — cube spilled!");
    }

    // Snap the falling cube into its target cell.
    function landCube() {
      const x = cubeTargetX;
      const z = cubeTargetZ;
      const j = heights[x][z];
      heights[x][z] = j + 1;
      const idx = placedCount;
      const c = cellCenter(x, j, z);

      const place = (s) => {
        dummy.position.copy(c);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        cubeMesh.setMatrixAt(idx, dummy.matrix);
        cubeMesh.instanceMatrix.needsUpdate = true;
      };
      place(reduced ? 1 : 0.6);
      cubeMesh.setColorAt(idx, new THREE.Color(cubeColHex));
      if (cubeMesh.instanceColor) cubeMesh.instanceColor.needsUpdate = true;
      placedCount += 1;
      cubeMesh.count = placedCount;
      if (!reduced) {
        feel.tween({ from: 0.6, to: 1, duration: 0.14, onUpdate: place });
      }

      fallingCube.visible = false;
      cubeFalling = false;
      feel.sfx("add");
      feel.burst(
        { x: c.x, y: c.y + 0.2, z: c.z },
        { color: cubeColHex, count: reduced ? 0 : 7, size: 0.11, spread: 1.2 },
      );

      // Layer-complete flash: did we just finish a full horizontal layer?
      if (placedCount % (nx * nz) === 0 && placedCount < targetCount) {
        feel.sfx("correct");
        if (!reduced) feel.shake(0.1);
        feel.burst(
          { x: 0, y: j + 0.5, z: 0 },
          { color: COLORS.vaultGlow, count: reduced ? 0 : 20, spread: nx + nz },
        );
      }

      updatePackObjective();

      if (placedCount >= targetCount) {
        finishPacking();
        return;
      }
      // Auto-advance the highlight to the next fillable column if the current
      // one just filled up.
      const cur = colXZ(colSel);
      if (heights[cur.x][cur.z] >= ny) pickNextColumn(false);
      else refreshColumn();
    }

    // =====================================================================
    // PRISM FILLED → SPEED-ROUND ANSWER GATE
    // =====================================================================
    function finishPacking() {
      phase = "between";
      columnMesh.visible = false;
      chute.visible = false;
      fallingCube.visible = false;

      const vol = prismVolume(round.l, round.w, round.h);
      const timeBonus = Math.max(0, Math.round(roundTime) * 2);
      const base = level === 2 ? 25 : 18;
      const pts = base + timeBonus;
      onScore(pts, {
        round: roundIndex + 1,
        volume: vol,
        cubes: targetCount,
        kind: "pack",
      });
      feel.sfx("correct");
      if (!reduced) feel.shake(0.26);
      feel.burst(
        { x: 0, y: ny * 0.6 + 0.6, z: 0 },
        {
          color: COLORS.vaultGlow,
          count: reduced ? 0 : 40,
          spread: nx + nz + 2,
        },
      );
      hud.feedback(true, `Vault packed! +${pts} (time bonus ${timeBonus})`, {
        duration: 2200,
      });
      announce(
        `Vault packed with ${targetCount} cubes. Now the speed round — pick the volume fast!`,
      );

      later(() => startGate(vol), reduced ? 600 : 1000);
    }

    function startGate(answer) {
      if (gameOver) return;
      phase = "gate";
      gateAnswer = answer;
      const { labels: opts, correctLane } = buildGateChoices(
        answer,
        round.l,
        round.w,
        round.h,
      );
      gateCorrectLane = correctLane;
      gateChoice = 1;
      gateTime = cfg.gateTime;

      opts.forEach((v, i) => {
        updateLabel(gateLabels[i], String(v));
        gatePanels[i].material.color.setHex(COLORS.gateBad);
        gatePanels[i].material.emissive.setHex(COLORS.gateBad);
        gatePanels[i].material.emissiveIntensity = 0.4;
      });
      gateGroup.position.set(0, 0, 0);
      gateGroup.visible = true;
      refreshGateChoice();

      problemCard.position.set(0, 4.4, 0);
      setProblemCard(`SPEED ROUND:  ${round.l} × ${round.w} × ${round.h} = ?`);
      const text = `Speed round! What is ${round.l} × ${round.w} × ${round.h}? Pick the volume — left/right, then press.`;
      hud.setObjective(text);
      if (clarity) {
        clarity.setObjective(text);
        clarity.setTarget(`Pick the volume before time runs out!`);
      }
      if (typeof hud.setTimer === "function") hud.setTimer(gateTime);
      feel.sfx("select");
      announce(
        `Speed round. What is ${round.l} times ${round.w} times ${round.h}? ` +
          `Use left and right to choose, then press to lock it in.`,
      );
    }

    function refreshGateChoice() {
      gatePanels.forEach((p, i) => {
        const on = i === gateChoice;
        p.material.emissiveIntensity = on ? 0.95 : 0.4;
        p.scale.setScalar(on ? 1.08 : 1);
      });
    }

    function moveGate(dir) {
      if (phase !== "gate") return;
      gateChoice = Math.max(0, Math.min(2, gateChoice + dir));
      refreshGateChoice();
      feel.sfx("select");
    }

    function lockGate(timedOut) {
      if (phase !== "gate") return;
      phase = "between";
      const correct = !timedOut && gateChoice === gateCorrectLane;
      // Light the correct panel green; a wrong pick red.
      gatePanels.forEach((p, i) => {
        if (i === gateCorrectLane) {
          p.material.color.setHex(COLORS.gateGood);
          p.material.emissive.setHex(COLORS.gateGood);
          p.material.emissiveIntensity = 0.95;
        } else if (i === gateChoice && !correct) {
          p.material.color.setHex(COLORS.bad);
          p.material.emissive.setHex(COLORS.bad);
          p.material.emissiveIntensity = 0.95;
        }
      });
      if (typeof hud.setTimer === "function") hud.setTimer(null);

      if (correct) {
        solvedCount += 1;
        streak += 1;
        if (streak > bestStreak) bestStreak = streak;
        if (typeof hud.setStreak === "function") hud.setStreak(streak);
        const combo = Math.min(streak - 1, 5) * 5;
        const pts = (level === 2 ? 20 : 15) + combo;
        onScore(pts, {
          round: roundIndex + 1,
          kind: "speed",
          volume: gateAnswer,
        });
        feel.sfx("correct");
        if (!reduced) feel.shake(0.2);
        feel.burst(
          { x: GATE_LANE_X[gateCorrectLane], y: 1.4, z: 0 },
          { color: COLORS.vaultGlow, count: reduced ? 0 : 30, spread: 4 },
        );
        hud.feedback(
          true,
          `Volume = ${gateAnswer} cubic units! +${pts}${combo ? ` · combo ×${streak}` : ""}`,
          { duration: 2400 },
        );
        announce(
          `Correct. The volume is ${gateAnswer} cubic units. You earned ${pts} points.`,
        );
        later(nextRound, reduced ? 900 : 1500);
      } else {
        streak = 0;
        if (typeof hud.setStreak === "function") hud.setStreak(0);
        const why = timedOut
          ? `Time! The volume was ${gateAnswer}.`
          : `Not quite — ${round.l}×${round.w}×${round.h} = ${gateAnswer}.`;
        feel.sfx("wrong");
        if (!reduced) feel.shake(0.18);
        loseLife(why, () => later(nextRound, reduced ? 1000 : 1600));
      }
    }

    // =====================================================================
    // Lives / flow
    // =====================================================================
    function loseLife(msg, after) {
      lives = Math.max(0, lives - 1);
      if (typeof hud.setStreak === "function") hud.setStreak(0);
      streak = 0;
      if (typeof hud.setLives === "function") hud.setLives(lives);
      if (lives <= 0) {
        loseGame();
        return;
      }
      const livesMsg = ` ${lives} ${lives === 1 ? "life" : "lives"} left.`;
      hud.feedback(false, msg + livesMsg, { duration: 2200 });
      announce(msg + livesMsg);
      if (after) after();
    }

    function nextRound() {
      if (gameOver) return;
      if (roundIndex < cfg.rounds.length - 1) {
        roundIndex += 1;
        startRound();
      } else {
        finishGame();
      }
    }

    function loseGame() {
      gameOver = true;
      phase = "over";
      columnMesh.visible = false;
      chute.visible = false;
      fallingCube.visible = false;
      if (typeof hud.setTimer === "function") hud.setTimer(null);
      feel.sfx("wrong");
      const msg = `Vault locked! You secured ${solvedCount} of ${cfg.rounds.length}.`;
      setProblemCard("VAULT LOCKED");
      hud.setObjective(msg);
      announce(`Mission over. ${msg} Press Play Again to retry.`);
      if (clarity) {
        clarity.setTarget(null);
        clarity.lose({
          titleEn: "Vault locked!",
          badge: "🔒",
          stats: `${msg} Tip: count the cubes along the length, width, and height, then multiply.`,
        });
      }
    }

    function finishGame() {
      gameOver = true;
      phase = "over";
      columnMesh.visible = false;
      chute.visible = false;
      fallingCube.visible = false;
      if (typeof hud.setTimer === "function") hud.setTimer(null);
      setProblemCard("VAULT SECURED ✦");
      hud.setObjective(
        `Vault secured — ${solvedCount} of ${cfg.rounds.length} sealed, best streak ${bestStreak}. Great work, Vault Keeper!`,
      );
      hud.message("All vaults packed!", { tone: "ok", duration: 0 });
      feel.sfx("fanfare");
      if (!reduced) {
        feel.shake(0.32);
        for (let i = 0; i < 5; i++) {
          later(
            () =>
              feel.burst(
                {
                  x: (Math.random() - 0.5) * 7,
                  y: 2 + Math.random() * 2,
                  z: 0,
                },
                {
                  color: COLORS.cube[i % COLORS.cube.length],
                  count: 30,
                  spread: 4.5,
                },
              ),
            i * 170,
          );
        }
      }
      announce(
        `All vaults packed. You sealed ${solvedCount} with a best streak of ${bestStreak}. Great work, Vault Keeper.`,
      );
      if (clarity) {
        clarity.setTarget(null);
        clarity.win({
          titleEn: "Vault secured!",
          badge: "🧊",
          stats: `You packed ${solvedCount} of ${cfg.rounds.length} vaults · best streak ${bestStreak}. Score saved.`,
        });
      }
    }

    // =====================================================================
    // Input wiring
    // =====================================================================
    function onPrimary() {
      if (gameOver) return;
      if (phase === "packing") dropCube();
      else if (phase === "gate") lockGate(false);
    }
    function onDirection(name) {
      if (gameOver) return;
      if (phase === "packing") {
        if (name === "left") moveColumn(-1);
        else if (name === "right") moveColumn(1);
        else if (name === "up")
          moveColumn(nx); // jump a row deeper
        else if (name === "down") moveColumn(-nx);
      } else if (phase === "gate") {
        if (name === "left") moveGate(-1);
        else if (name === "right") moveGate(1);
      }
    }
    function onConfirm() {
      if (gameOver) return;
      if (phase === "packing") {
        caption("Volume = length × width × height. Each cube is 1 cubic unit.");
        announce(
          "Volume equals length times width times height. Each cube you drop is one cubic unit.",
        );
        later(() => caption(""), 2600);
      }
    }

    // =====================================================================
    // Real-time per-frame loop
    // =====================================================================
    function frame(dt) {
      const d = Math.min(dt, 0.05);

      // Falling-cube physics.
      if (cubeFalling) {
        cubeY -= cfg.fallSpeed * d;
        const landY = fallingCube.userData.landY;
        if (cubeY <= landY) {
          cubeY = landY;
          fallingCube.position.y = landY;
          landCube();
        } else {
          fallingCube.position.y = cubeY;
        }
      }

      if (phase === "packing") {
        // Round timer pressure.
        roundTime -= d;
        if (typeof hud.setTimer === "function")
          hud.setTimer(Math.max(0, roundTime));
        if (roundTime <= 0) {
          // Ran out of time before filling the vault.
          phase = "between";
          columnMesh.visible = false;
          chute.visible = false;
          fallingCube.visible = false;
          cubeFalling = false;
          feel.sfx("wrong");
          loseLife(
            `Time! You packed ${placedCount} of ${targetCount} cubes.`,
            () => later(nextRound, reduced ? 1000 : 1600),
          );
          return;
        }

        // Factory auto-drops cubes into the selected column on a tightening
        // interval — this is the real-time pressure. The player keeps moving to
        // a fillable column so cubes don't spill.
        if (!cubeFalling) {
          dropTimer -= d;
          if (dropTimer <= 0) {
            const { x, z } = colXZ(colSel);
            if (heights[x][z] < ny) {
              dropCube();
            } else {
              // Selected column full: nudge the player, then retry shortly.
              if (!pickNextColumn(false)) {
                // No fillable column? (shouldn't happen pre-fill) — skip.
                dropTimer = curInterval;
              } else {
                dropTimer = 0.2;
              }
            }
            curInterval = Math.max(
              cfg.minInterval,
              curInterval * cfg.dropAccel,
            );
          }
        }

        // Pulse the column highlight for visibility.
        if (!reduced && columnMesh.visible) {
          columnMat.opacity =
            0.18 + Math.abs(Math.sin(performance.now() * 0.004)) * 0.16;
        }
      } else if (phase === "gate") {
        gateTime -= d;
        if (typeof hud.setTimer === "function")
          hud.setTimer(Math.max(0, gateTime));
        // Float the gate panels gently.
        if (!reduced) {
          gateGroup.children.forEach((lane, i) => {
            lane.position.y = Math.sin(performance.now() * 0.003 + i) * 0.1;
          });
        }
        if (gateTime <= 0) lockGate(true);
      }
    }

    // =====================================================================
    // Lifecycle
    // =====================================================================
    return {
      start() {
        const target = new THREE.Vector3(0, 1.4, 0);
        const endPos = new THREE.Vector3(7, 8, 11);
        if (reduced) {
          camera.position.copy(endPos);
          camera.lookAt(target);
          feel.syncCamera();
        } else {
          const startPos = new THREE.Vector3(12, 13, 16);
          camera.position.copy(startPos);
          camera.lookAt(target);
          feel.tween({
            from: 0,
            to: 1,
            duration: 1.1,
            onUpdate: (v) => {
              camera.position.lerpVectors(startPos, endPos, v);
              camera.lookAt(target);
            },
            onComplete: () => {
              feel.syncCamera();
              // Gentle idle orbit.
              const baseAngle = Math.atan2(endPos.z, endPos.x);
              const radius = Math.hypot(endPos.x, endPos.z);
              unbindIdle = ctx.onFrame((dt, t) => {
                const a = baseAngle + Math.sin(t * 0.16) * 0.05;
                camera.position.x = Math.cos(a) * radius;
                camera.position.z = Math.sin(a) * radius;
                camera.position.y = endPos.y + Math.sin(t * 0.5) * 0.12;
                camera.lookAt(target);
                feel.syncCamera();
              });
            },
          });
        }

        function beginGameplay() {
          roundIndex = 0;
          lives = cfg.startLives;
          gameOver = false;
          solvedCount = 0;
          streak = 0;
          bestStreak = 0;
          if (typeof hud.setLives === "function") hud.setLives(lives);
          if (typeof hud.setStreak === "function") hud.setStreak(0);
          startRound();

          unbindPress = input.onPress((name) => {
            if (
              name === "up" ||
              name === "down" ||
              name === "left" ||
              name === "right"
            )
              onDirection(name);
            else if (name === "action") onPrimary();
            else if (name === "confirm") onConfirm();
          });

          unbindTap = input.onTap(() => {
            if (gameOver) return;
            if (phase === "packing") {
              // Tap left/right half of the screen to aim, center to drop.
              const nxp = input.state.ndc.x;
              if (nxp < -0.18) moveColumn(-1);
              else if (nxp > 0.18) moveColumn(1);
              else dropCube();
            } else if (phase === "gate") {
              const nxp = input.state.ndc.x;
              if (nxp < -0.25) moveGate(-1);
              else if (nxp > 0.25) moveGate(1);
              else lockGate(false);
            }
          });

          unbindFrame = ctx.onFrame(frame);
        }

        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "Volume Vault — Pack the Prism Before Time Runs Out",
          objectiveEn:
            "A factory drops unit cubes in real time. Slide the chute left/right and press to drop — pack the prism with exactly length × width × height cubes before the timer runs out. Then pick its volume in the speed round.",
          objectiveEs:
            "Una fábrica suelta cubos en tiempo real. Mueve el surtidor a la izquierda o derecha y presiona para soltar. Llena la caja con exactamente largo × ancho × alto cubos antes de que se acabe el tiempo. Luego elige el volumen en la ronda rápida.",
          standard: "6.G.A.2 · Volume of Rectangular Prisms",
          controls: [
            {
              key: "← / →  (A / D)",
              actionEn:
                "Slide the chute to aim at a column (gate round: choose the answer)",
              actionEs:
                "Mueve el surtidor para apuntar a una columna (ronda rápida: elige la respuesta)",
            },
            {
              key: "↑ / ↓  (W / S)",
              actionEn: "Jump to a column in the next/previous row",
              actionEs: "Salta a una columna en la otra fila",
            },
            {
              key: "Space / Tap / ●",
              actionEn:
                "Drop a unit cube right now — or lock in your answer in the speed round",
              actionEs:
                "Suelta un cubo ahora, o confirma tu respuesta en la ronda rápida",
            },
            {
              key: "Enter / ✓",
              actionEn: "Hear the volume hint (V = length × width × height)",
              actionEs: "Escucha la pista del volumen",
            },
            {
              key: "?",
              actionEn: "Open this help panel any time (Esc closes it)",
              actionEs: "Abre esta ayuda cuando quieras (Esc la cierra)",
            },
          ],
          howToWinEn:
            "Pack every cell of the prism with unit cubes before the timer hits zero — that count is the volume. The factory keeps dropping, so keep aiming at empty columns (a cube on a full column spills and costs a life). After packing, pick the correct volume (length × width × height) in the speed round for combo points. Clear all 6 vaults to win.",
          howToWinEs:
            "Llena cada celda de la caja antes de que el tiempo llegue a cero — ese total es el volumen. Luego elige el volumen correcto en la ronda rápida. Completa las 6 cajas para ganar.",
          onStart: beginGameplay,
          onPlayAgain: () => location.reload(),
        });
      },

      dispose() {
        if (clarity) clarity.dispose();
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        if (unbindIdle) unbindIdle();
        timers.forEach(clearTimeout);
        timers.length = 0;
        clearRoundMeshes();
        gateLabels.forEach((l) => {
          if (l.material.map) l.material.map.dispose();
          l.material.dispose();
        });
        if (problemCard.material.map) problemCard.material.map.dispose();
        problemCard.material.dispose();
        disposables.forEach((g) => g.dispose && g.dispose());
        scene.remove(group);
      },
    };
  },
};
