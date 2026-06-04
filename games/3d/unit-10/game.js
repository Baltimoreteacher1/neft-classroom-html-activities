import { prismVolume } from "/games/engine3d/geometry-math.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";

/* ============================================================================
 * Unit 10 — VOLUME VAULT  (CCSS 6.G.A.2)
 * Volume of right rectangular prisms, including fractional edge lengths, by
 * packing them with unit cubes:  V = l × w × h.
 *
 * Theme: a glowing gold "vault" you fill with luminous unit cubes.
 *   Level 1 (support):  whole-number edges, on-screen hints, smaller prisms.
 *   Level 2 (enrichment): fractional edges (half-units), packing fractional
 *                         unit cubes, missing-edge division, volume comparison.
 * ==========================================================================*/

const COLORS = {
  vault: 0xf2c15b, // gold vault frame / accents
  vaultGlow: 0xffd97a,
  cube: [0x35c9c3, 0x5b9cff, 0xffb454, 0xb98cff, 0x53d08a, 0xff7e6b],
  cursorOk: 0x35c9c3,
  cursorBad: 0xff7e6b,
  floor: 0x0c1c33,
  pad: 0x16335b,
};

// ---------------------------------------------------------------------------
// Level design — 6 rounds each. Level 2 is strictly harder (fractions + steps).
// ---------------------------------------------------------------------------
function makeLevel(level) {
  if (level === 1) {
    return {
      hints: true,
      rounds: [
        { kind: "fill", l: 2, w: 2, h: 1 },
        { kind: "fill", l: 3, w: 2, h: 1 },
        { kind: "fill", l: 3, w: 2, h: 2 },
        { kind: "missing", l: 3, w: 2, volume: 12, max: 5 },
        { kind: "fill", l: 4, w: 3, h: 2 },
        { kind: "compare", a: { l: 3, w: 2, h: 2 }, b: { l: 4, w: 2, h: 1 } },
      ],
    };
  }
  return {
    hints: false,
    rounds: [
      // frac = sub-cubes per unit along each axis (denominator). frac 2 ⇒
      // half-unit cubes, each 1/8 of a whole cubic unit. Keep the half-unit
      // edge so the 1/8-cube idea stays, but keep the sub-cube count small
      // (≤ ~16) so packing isn't tedious.
      { kind: "fill", l: 1.5, w: 1, h: 1, frac: 2 }, // 3×2×2 = 12 cubes, V = 1.5
      { kind: "fill", l: 1, w: 1.5, h: 1, frac: 2 }, // 2×3×2 = 12 cubes, V = 1.5
      { kind: "missing", l: 3, w: 2, volume: 9, frac: 2, max: 4 },
      { kind: "fill", l: 1, w: 1, h: 1.5, frac: 2 }, // 2×2×3 = 12 cubes, V = 1.5
      { kind: "missing", l: 2.5, w: 2, volume: 7.5, frac: 2, max: 4 },
      {
        kind: "compare",
        a: { l: 4, w: 2, h: 1.5 },
        b: { l: 3, w: 2.5, h: 1.5 },
        frac: 2,
      },
    ],
  };
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

    // ---- Clarity / onboarding kit (shared overlay over the canvas) ----------
    // Mount element is the same positioned container that hosts the canvas.
    const clarityMount = renderer.domElement.parentElement || document.body;
    let clarity = null;

    const group = new THREE.Group();
    scene.add(group);

    // ---- Shared geometry/material resources (disposed in dispose) ----------
    const unitCubeGeo = new RoundedBoxGeometry(1, 1, 1, 3, 0.12);
    const cursorGeo = new RoundedBoxGeometry(1.04, 1.04, 1.04, 2, 0.12);
    const disposables = [unitCubeGeo, cursorGeo];

    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    // ---- Stage: receive-shadow floor + a glowing vault pad -----------------
    const floorGeo = new THREE.CircleGeometry(22, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: COLORS.floor,
      roughness: 0.92,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.001;
    floor.receiveShadow = true;
    group.add(floor);
    disposables.push(floorGeo, floorMat);

    const padGeo = new RoundedBoxGeometry(9, 0.4, 9, 3, 0.25);
    const padMat = new THREE.MeshStandardMaterial({
      color: COLORS.pad,
      roughness: 0.5,
      metalness: 0.25,
      emissive: COLORS.vault,
      emissiveIntensity: 0.06,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = -0.2;
    pad.receiveShadow = true;
    pad.castShadow = true;
    group.add(pad);
    disposables.push(padGeo, padMat);

    // ---- Round state -------------------------------------------------------
    let round = null;
    let roundIndex = 0;
    let solved = false;
    let streak = 0;
    let bestStreak = 0;
    let solvedCount = 0;
    // Forgiving stakes: a pool of attempts. A wrong answer costs one; run out
    // and the mission fails (lose screen). Level 1 gets more cushion.
    const START_LIVES = level === 2 ? 4 : 6;
    let lives = START_LIVES;
    let gameOver = false;
    let unbindFrame = null;
    let unbindIdle = null;

    // Fill-round grid state.
    let frac = 1;
    let step = 1;
    let nx = 0;
    let ny = 0;
    let nz = 0;
    let filled = null;
    let cursor = { x: 0, y: 0, z: 0 };
    let placedCount = 0;
    let targetCount = 0;
    let layerUp = true;
    let cubeMesh = null;

    const cursorMat = new THREE.MeshStandardMaterial({
      color: COLORS.cursorOk,
      transparent: true,
      opacity: 0.5,
      roughness: 0.3,
      metalness: 0.1,
      emissive: COLORS.cursorOk,
      emissiveIntensity: 0.8,
    });
    const cursorMesh = new THREE.Mesh(cursorGeo, cursorMat);
    cursorMesh.visible = false;
    cursorMesh.castShadow = false;
    group.add(cursorMesh);

    const dummy = new THREE.Object3D();
    const frameMeshes = [];
    const labels = [];

    // ---- Missing / compare state ------------------------------------------
    let guess = 0;
    let guessStep = 1;
    let compareChoice = 0;
    let comparePrisms = [];

    // 3D problem card — always shows the current question above the vault.
    const problemCard = makeLabel("", {
      scale: 1.05,
      fontSize: 72,
      background: "rgba(12,28,51,0.92)",
      color: "#ffe6a8",
    });
    problemCard.position.set(0, 5.4, 0);
    // Redundant with the engine HUD "Your task" panel; hide so it can't
    // project over and garble the top-left HUD directions.
    problemCard.visible = false;
    group.add(problemCard);

    function setProblemCard(text) {
      updateLabel(problemCard, text);
    }

    // ----------------------------------------------------------------------
    function clearGroupExtras() {
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
      comparePrisms.forEach((p) => {
        group.remove(p);
        p.traverse((o) => {
          if (o.geometry && o.geometry !== unitCubeGeo) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
      });
      comparePrisms.length = 0;
    }

    function prismDims() {
      return { lx: nx * step, ly: ny * step, lz: nz * step };
    }

    function cellCenter(i, j, k) {
      const { lx, ly, lz } = prismDims();
      return new THREE.Vector3(
        -lx / 2 + (i + 0.5) * step,
        (j + 0.5) * step,
        -lz / 2 + (k + 0.5) * step,
      );
    }

    // Glowing gold vault outline (target frame).
    function buildVaultFrame(lx, ly, lz, cx = 0, cz = 0, color = COLORS.vault) {
      const box = new THREE.BoxGeometry(lx, ly, lz);
      const edges = new THREE.EdgesGeometry(box);
      box.dispose();
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color }),
      );
      line.position.set(cx, ly / 2, cz);
      return line;
    }

    function fracLabel(value) {
      if (Number.isInteger(value)) return String(value);
      const whole = Math.floor(value);
      const f = value - whole;
      const map = { 0.5: "½", 0.25: "¼", 0.75: "¾" };
      const fr = map[Number(f.toFixed(2))] || f.toFixed(2).replace(/0+$/, "");
      return whole ? `${whole}${fr}` : fr;
    }

    // ===================== FILL ROUND =====================================
    function startFillRound() {
      frac = round.frac || 1;
      step = 1 / frac;
      nx = Math.round(round.l * frac);
      ny = Math.round(round.h * frac);
      nz = Math.round(round.w * frac);

      filled = [];
      for (let i = 0; i < nx; i++) {
        filled[i] = [];
        for (let j = 0; j < ny; j++) filled[i][j] = new Array(nz).fill(false);
      }
      targetCount = nx * ny * nz;
      placedCount = 0;
      cursor = { x: 0, y: 0, z: 0 };
      layerUp = true;

      const { lx, ly, lz } = prismDims();
      const frame = buildVaultFrame(lx, ly, lz);
      group.add(frame);
      frameMeshes.push(frame);

      const mat = new THREE.MeshStandardMaterial({
        roughness: 0.32,
        metalness: 0.15,
        emissiveIntensity: 0.35,
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

      cursorMesh.visible = true;
      cursorMesh.scale.setScalar(step);

      // Show the dimensions and the V = l × w × h set-up, but NOT the result —
      // the student works out the volume by packing the cubes. The answer is
      // revealed in the post-solve feedback (see markCorrect below).
      setProblemCard(
        `V = ${fracLabel(round.l)} × ${fracLabel(round.w)} × ${fracLabel(
          round.h,
        )} = ?  cubic units`,
      );

      announce(
        `Round ${roundIndex + 1}. Fill the box with cubes to find its volume. ` +
          `It is ${fracLabel(round.l)} long, ${fracLabel(
            round.w,
          )} wide, ${fracLabel(round.h)} tall. ` +
          `Multiply length times width times height.`,
      );

      if (cfg.hints) {
        hud.message("Tap to drop a cube. Use arrows to move.", {
          tone: "info",
          duration: 3600,
        });
      }
      feel.sfx("select");
      refreshCursor();
      updateFillObjective();
    }

    function placedVolume() {
      return placedCount * step * step * step;
    }

    function updateFillObjective() {
      // Don't reveal the volume here — show progress only so the student has to
      // pack the box to discover it.
      let text =
        `Fill the box, then read off its volume.  ` +
        `Cubes: ${placedCount} / ${targetCount}`;
      // On half-unit (fractional) rounds, surface the unit-fraction reasoning so
      // the student watches the 1/8 cubes add up as they pack.
      if (frac > 1) {
        const den = frac * frac * frac; // each sub-cube is 1/den of a unit cube
        text += `  ·  = ${placedCount} × 1/${den} = ${fracLabel(placedVolume())}`;
      }
      hud.setObjective(text);
      if (clarity) {
        clarity.setObjective(text);
        clarity.setTarget(`Pack the box · V = l × w × h`);
      }
    }

    function refreshCursor() {
      const c = cellCenter(cursor.x, cursor.y, cursor.z);
      cursorMesh.position.copy(c);
      const here = filled[cursor.x][cursor.y][cursor.z];
      const col = here ? COLORS.cursorBad : COLORS.cursorOk;
      cursorMesh.material.color.setHex(col);
      cursorMesh.material.emissive.setHex(col);
    }

    function placeCube() {
      if (solved) return;
      if (filled[cursor.x][cursor.y][cursor.z]) {
        hud.message("A cube is already there.", {
          tone: "warn",
          duration: 1400,
        });
        feel.sfx("wrong");
        feel.shake(0.08);
        return;
      }
      filled[cursor.x][cursor.y][cursor.z] = true;
      const idx = placedCount;
      const c = cellCenter(cursor.x, cursor.y, cursor.z);
      const colHex = COLORS.cube[idx % COLORS.cube.length];

      // Scale-pop the new cube in.
      const place = (s) => {
        dummy.position.copy(c);
        dummy.scale.setScalar(step * 0.92 * s);
        dummy.updateMatrix();
        cubeMesh.setMatrixAt(idx, dummy.matrix);
        cubeMesh.instanceMatrix.needsUpdate = true;
      };
      place(reduced ? 1 : 0.2);
      const col = new THREE.Color(colHex);
      cubeMesh.setColorAt(idx, col);
      placedCount += 1;
      cubeMesh.count = placedCount;
      if (cubeMesh.instanceColor) cubeMesh.instanceColor.needsUpdate = true;
      if (!reduced) {
        feel.tween({
          from: 0.2,
          to: 1,
          duration: 0.22,
          onUpdate: (v) => place(v),
        });
      }

      feel.sfx("add");
      feel.burst(
        { x: c.x, y: c.y + 0.3, z: c.z },
        { color: colHex, count: 8, size: 0.12, spread: 1.4 },
      );
      announce(
        `Placed cube ${placedCount}. Volume so far ${fracLabel(
          placedVolume(),
        )} cubic units.`,
      );
      advanceCursor();
      refreshCursor();
      updateFillObjective();
      checkFillWin();
    }

    // Auto-advance to the next empty cell (row-major: x, then z, then y).
    function advanceCursor() {
      for (let j = cursor.y; j < ny; j++)
        for (let k = j === cursor.y ? cursor.z : 0; k < nz; k++)
          for (
            let i = j === cursor.y && k === cursor.z ? cursor.x + 1 : 0;
            i < nx;
            i++
          )
            if (!filled[i][j][k]) {
              cursor = { x: i, y: j, z: k };
              return;
            }
      for (let j = 0; j < ny; j++)
        for (let k = 0; k < nz; k++)
          for (let i = 0; i < nx; i++)
            if (!filled[i][j][k]) {
              cursor = { x: i, y: j, z: k };
              return;
            }
    }

    function moveCursor(dx, dy, dz) {
      const nxp = Math.max(0, Math.min(nx - 1, cursor.x + dx));
      const nyp = Math.max(0, Math.min(ny - 1, cursor.y + dy));
      const nzp = Math.max(0, Math.min(nz - 1, cursor.z + dz));
      if (nxp !== cursor.x || nyp !== cursor.y || nzp !== cursor.z) {
        cursor = { x: nxp, y: nyp, z: nzp };
        feel.sfx("select");
        refreshCursor();
        announce(
          `Cursor at column ${cursor.x + 1}, row ${cursor.z + 1}, layer ${
            cursor.y + 1
          }.`,
        );
      }
    }

    function checkFillWin() {
      if (placedCount < targetCount) return;
      solved = true;
      cursorMesh.visible = false;
      const targetVol = prismVolume(round.l, round.w, round.h);
      const pts = (level === 2 ? 30 : 20) + 5;
      onScore(pts, {
        round: roundIndex + 1,
        volume: targetVol,
        cubes: targetCount,
        kind: "fill",
      });
      feel.sfx("correct");
      feel.shake(0.28);
      feel.burst(
        { x: 0, y: 1.6, z: 0 },
        { color: COLORS.vaultGlow, count: 40, spread: 4 },
      );
      markCorrect(
        `Vault sealed! V = ${fracLabel(round.l)}×${fracLabel(
          round.w,
        )}×${fracLabel(round.h)} = ${fracLabel(targetVol)} cubic units. +${pts}`,
      );
      announce(
        `Vault sealed. The volume is ${fracLabel(
          targetVol,
        )} cubic units. You earned ${pts} points.`,
      );
      nextRoundSoon();
    }

    // ===================== MISSING-DIMENSION ROUND =========================
    function startMissingRound() {
      frac = round.frac || 1;
      guessStep = 1 / frac;
      guess = guessStep;

      // Glowing base footprint.
      const base = buildVaultFrame(round.l, 0.04, round.w);
      base.position.y = 0.02;
      group.add(base);
      frameMeshes.push(base);

      hud.setObjective(`Find the height. Use up / down, then tap to check.`);
      announce(
        `Round ${roundIndex + 1}. The box holds ${fracLabel(
          round.volume,
        )} cubic units. It is ${fracLabel(round.l)} long and ${fracLabel(
          round.w,
        )} wide. ` +
          `Find the height. Use up and down to change it, then tap to check.`,
      );
      if (cfg.hints) {
        hud.message("Height = volume ÷ (length × width).", {
          tone: "info",
          duration: 3400,
        });
      }
      feel.sfx("select");
      updateMissingScene();
    }

    function updateMissingScene() {
      const lx = round.l;
      const lz = round.w;
      const ly = guess;
      // Solid translucent prism that grows with the guessed height.
      if (frameMeshes[1]) {
        group.remove(frameMeshes[1]);
        frameMeshes[1].geometry.dispose();
        frameMeshes[1].material.dispose();
      }
      const solid = new THREE.Mesh(
        new RoundedBoxGeometry(lx, Math.max(ly, 0.04), lz, 3, 0.08),
        new THREE.MeshStandardMaterial({
          color: COLORS.cube[1],
          roughness: 0.3,
          metalness: 0.1,
          transparent: true,
          opacity: 0.82,
          emissive: COLORS.cube[1],
          emissiveIntensity: 0.25,
        }),
      );
      solid.position.y = Math.max(ly, 0.04) / 2;
      solid.castShadow = true;
      group.add(solid);
      frameMeshes[1] = solid;

      const vol = prismVolume(round.l, round.w, guess);
      setProblemCard(
        `${fracLabel(round.l)} × ${fracLabel(round.w)} × ? = ${fracLabel(
          round.volume,
        )}`,
      );
      const text =
        `Height = ${fracLabel(guess)}. Your volume = ${fracLabel(vol)}. ` +
        `Goal = ${fracLabel(round.volume)} cubic units.`;
      hud.setObjective(text);
      if (clarity) {
        clarity.setObjective(text);
        clarity.setTarget(
          `Find the height · Goal V = ${fracLabel(round.volume)} cubic units`,
        );
      }
    }

    function adjustGuess(delta) {
      const v = Math.max(guessStep, Math.min(round.max || 6, guess + delta));
      if (v !== guess) {
        guess = Number(v.toFixed(4));
        feel.sfx("pop");
        updateMissingScene();
        announce(`Height set to ${fracLabel(guess)}.`);
      }
    }

    function checkMissing() {
      if (solved) return;
      const vol = prismVolume(round.l, round.w, guess);
      if (Math.abs(vol - round.volume) > 1e-9) {
        markWrong(
          `V = ${fracLabel(vol)}, not ${fracLabel(
            round.volume,
          )}. Adjust the height.`,
        );
        feel.sfx("wrong");
        feel.shake(0.12);
        announce(
          `That gives ${fracLabel(vol)} cubic units. Try a different height.`,
        );
        return;
      }
      solved = true;
      const pts = level === 2 ? 35 : 25;
      onScore(pts, {
        round: roundIndex + 1,
        volume: round.volume,
        edge: guess,
        kind: "missing",
      });
      feel.sfx("correct");
      feel.shake(0.28);
      feel.burst(
        { x: 0, y: guess + 0.6, z: 0 },
        { color: COLORS.vaultGlow, count: 34, spread: 3 },
      );
      markCorrect(`Correct! Missing height = ${fracLabel(guess)}. +${pts}`);
      announce(
        `Correct. The missing height is ${fracLabel(
          guess,
        )}. You earned ${pts} points.`,
      );
      nextRoundSoon();
    }

    // ===================== COMPARE ROUND ==================================
    function startCompareRound() {
      comparePrisms = [];
      const specs = [
        { spec: round.a, cx: -3 },
        { spec: round.b, cx: 3 },
      ];
      specs.forEach(({ spec, cx }, idx) => {
        const p = buildSolidPrism(spec, COLORS.cube[idx === 0 ? 0 : 3]);
        p.position.x = cx;
        group.add(p);
        comparePrisms.push(p);
        const vol = prismVolume(spec.l, spec.w, spec.h);
        const lbl = makeLabel(
          `${idx === 0 ? "A" : "B"}:  ${fracLabel(spec.l)}×${fracLabel(
            spec.w,
          )}×${fracLabel(spec.h)} = ${fracLabel(vol)}`,
          { scale: 0.85, fontSize: 64, color: "#ffe6a8" },
        );
        lbl.position.set(cx, spec.h + 0.8, 0);
        group.add(lbl);
        labels.push(lbl);
      });
      compareChoice = 0;
      setProblemCard(
        "Which box has the BIGGER volume? (They could be equal.)  Find l × w × h for each.",
      );
      hud.setObjective(
        "Use left / right to pick the bigger box. Then tap to check.",
      );
      if (clarity) {
        clarity.setObjective(
          "Use left / right to pick the bigger box. Then tap to check.",
        );
        clarity.setTarget("Pick the box with the bigger volume");
      }
      announce(
        `Round ${roundIndex + 1}. Two boxes. ` +
          `Find the volume of each one. ` +
          `Pick the box with the bigger volume — they could be equal. Use left and right, then tap to check.`,
      );
      feel.sfx("select");
      updateCompareCursor();
    }

    function buildSolidPrism(spec, color) {
      const wrap = new THREE.Group();
      const lx = spec.l;
      const ly = spec.h;
      const lz = spec.w;
      const solid = new THREE.Mesh(
        new RoundedBoxGeometry(lx, ly, lz, 3, 0.08),
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.32,
          metalness: 0.12,
          transparent: true,
          opacity: 0.9,
          emissive: color,
          emissiveIntensity: 0.12,
        }),
      );
      solid.position.y = ly / 2;
      solid.castShadow = true;
      solid.receiveShadow = true;
      wrap.add(solid);
      wrap.add(buildVaultFrame(lx, ly, lz));
      return wrap;
    }

    function updateCompareCursor() {
      cursorMesh.visible = false;
      comparePrisms.forEach((p, i) => {
        const solid = p.children[0];
        const on = i === compareChoice;
        solid.material.emissive.setHex(
          on ? COLORS.vault : p.children[0].material.color.getHex(),
        );
        solid.material.emissiveIntensity = on ? 0.7 : 0.12;
      });
      announce(`Selecting vault ${compareChoice === 0 ? "A" : "B"}.`);
    }

    function checkCompare() {
      if (solved) return;
      const va = prismVolume(round.a.l, round.a.w, round.a.h);
      const vb = prismVolume(round.b.l, round.b.w, round.b.h);
      const correct = va === vb ? -1 : va > vb ? 0 : 1;
      if (correct !== -1 && compareChoice !== correct) {
        markWrong("Not the bigger one — compute each l×w×h again.", 2400);
        feel.sfx("wrong");
        feel.shake(0.12);
        announce(
          `Vault A has ${fracLabel(va)} cubic units and vault B has ${fracLabel(
            vb,
          )} cubic units. Try again.`,
        );
        return;
      }
      solved = true;
      const pts = level === 2 ? 35 : 25;
      onScore(pts, {
        round: roundIndex + 1,
        kind: "compare",
        volA: va,
        volB: vb,
      });
      feel.sfx("correct");
      feel.shake(0.28);
      feel.burst({ x: 0, y: 2, z: 0 }, { color: COLORS.vaultGlow, count: 34 });
      const tie = correct === -1;
      markCorrect(
        tie
          ? `They're equal! A = ${fracLabel(va)} = B = ${fracLabel(
              vb,
            )} cubic units. +${pts}`
          : `Correct! A = ${fracLabel(va)}, B = ${fracLabel(
              vb,
            )} cubic units. +${pts}`,
      );
      announce(
        tie
          ? `They're equal. Both vaults are ${fracLabel(
              va,
            )} cubic units. You earned ${pts} points.`
          : `Correct. Vault A is ${fracLabel(va)} and vault B is ${fracLabel(
              vb,
            )} cubic units. You earned ${pts} points.`,
      );
      nextRoundSoon();
    }

    // ===================== Round flow =====================================
    function startRound() {
      clearGroupExtras();
      solved = false;
      round = cfg.rounds[roundIndex];
      if (typeof hud.setProgress === "function")
        hud.setProgress(roundIndex, cfg.rounds.length);
      if (round.kind === "fill") startFillRound();
      else if (round.kind === "missing") startMissingRound();
      else if (round.kind === "compare") startCompareRound();
    }

    function markCorrect(okMsg) {
      solvedCount += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      if (typeof hud.setStreak === "function") hud.setStreak(streak);
      if (typeof hud.feedback === "function")
        hud.feedback(true, okMsg, { duration: 2600 });
      else hud.message(okMsg, { tone: "ok", duration: 2600 });
    }
    function markWrong(warnMsg, duration = 2000) {
      streak = 0;
      if (typeof hud.setStreak === "function") hud.setStreak(0);
      lives = Math.max(0, lives - 1);
      if (typeof hud.setLives === "function") hud.setLives(lives);
      if (lives <= 0) {
        loseGame();
        return;
      }
      const livesMsg = ` ${lives} ${lives === 1 ? "try" : "tries"} left.`;
      if (typeof hud.feedback === "function")
        hud.feedback(false, warnMsg + livesMsg);
      else hud.message(warnMsg + livesMsg, { tone: "warn", duration });
    }

    function loseGame() {
      gameOver = true;
      feel.sfx("wrong");
      const msg = `Vault locked! You solved ${solvedCount} of ${cfg.rounds.length}.`;
      setProblemCard("VAULT LOCKED");
      hud.setObjective(msg);
      announce(`Mission over. ${msg} Press Play Again to retry.`);
      if (clarity) {
        clarity.setTarget(null);
        clarity.lose({
          titleEn: "Vault locked!",
          badge: "🔒",
          stats: `${msg} Tip: count the cubes along each edge, then multiply length × width × height.`,
        });
      }
    }

    function nextRoundSoon() {
      later(() => {
        if (roundIndex < cfg.rounds.length - 1) {
          roundIndex += 1;
          startRound();
        } else finishGame();
      }, 2800);
    }

    function finishGame() {
      clearGroupExtras();
      setProblemCard("VAULT SECURED ✦");
      hud.setObjective(
        `Vault secured — ${solvedCount} of ${cfg.rounds.length} solved, best streak ${bestStreak}. Great work, Vault Keeper!`,
      );
      hud.message("All rounds complete!", { tone: "ok", duration: 0 });
      feel.sfx("fanfare");
      feel.shake(0.35);
      if (!reduced) {
        for (let i = 0; i < 5; i++) {
          later(
            () =>
              feel.burst(
                {
                  x: (Math.random() - 0.5) * 6,
                  y: 2 + Math.random() * 2,
                  z: 0,
                },
                {
                  color: COLORS.cube[i % COLORS.cube.length],
                  count: 30,
                  spread: 4.5,
                },
              ),
            i * 180,
          );
        }
      }
      announce(
        `All rounds complete. You solved ${solvedCount} with a best streak of ${bestStreak}. Great work, Vault Keeper.`,
      );
      if (clarity) {
        clarity.setTarget(null);
        clarity.win({
          titleEn: "Vault secured!",
          badge: "🧊",
          stats: `You solved ${solvedCount} of ${cfg.rounds.length} vaults · best streak ${bestStreak}. Score saved.`,
        });
      }
    }

    // ===================== Input wiring ===================================
    function onPrimary() {
      if (!round || gameOver) return;
      if (round.kind === "fill") placeCube();
      else if (round.kind === "missing") checkMissing();
      else if (round.kind === "compare") checkCompare();
    }

    function onDirection(name) {
      if (!round || gameOver) return;
      if (round.kind === "fill") {
        if (name === "up") moveCursor(0, 0, -1);
        else if (name === "down") moveCursor(0, 0, 1);
        else if (name === "left") moveCursor(-1, 0, 0);
        else if (name === "right") moveCursor(1, 0, 0);
      } else if (round.kind === "missing") {
        if (name === "up") adjustGuess(guessStep);
        else if (name === "down") adjustGuess(-guessStep);
      } else if (round.kind === "compare") {
        if (name === "left") {
          compareChoice = 0;
          feel.sfx("select");
          updateCompareCursor();
        } else if (name === "right") {
          compareChoice = 1;
          feel.sfx("select");
          updateCompareCursor();
        }
      }
    }

    // Secondary (keyboard Enter): vertical layer move in fill, hint elsewhere.
    function onConfirm() {
      if (!round || gameOver) return;
      if (round.kind === "fill") {
        if (layerUp && cursor.y < ny - 1) moveCursor(0, 1, 0);
        else if (!layerUp && cursor.y > 0) moveCursor(0, -1, 0);
        if (cursor.y === ny - 1) layerUp = false;
        else if (cursor.y === 0) layerUp = true;
      } else if (round.kind === "missing") {
        caption(
          "Volume = length × width × height. Solve for the missing edge.",
        );
        announce(
          "Volume equals length times width times height. Divide the volume by length times width to find the missing edge.",
        );
        later(() => caption(""), 2400);
      }
    }

    let unbindPress = null;
    let unbindTap = null;

    return {
      start() {
        // Animated camera intro: sweep into framing, then gentle idle orbit.
        const target = new THREE.Vector3(0, 1.4, 0);
        const endPos = new THREE.Vector3(6, 7, 9.5);
        if (reduced) {
          camera.position.copy(endPos);
          camera.lookAt(target);
          feel.syncCamera();
        } else {
          const startPos = new THREE.Vector3(11, 12, 14);
          camera.position.copy(startPos);
          camera.lookAt(target);
          feel.tween({
            from: 0,
            to: 1,
            duration: 1.2,
            onUpdate: (v) => {
              camera.position.lerpVectors(startPos, endPos, v);
              camera.lookAt(target);
            },
            onComplete: () => {
              feel.syncCamera();
              // Gentle idle orbit around the vault.
              const baseAngle = Math.atan2(endPos.z, endPos.x);
              const radius = Math.hypot(endPos.x, endPos.z);
              unbindIdle = ctx.onFrame((dt, t) => {
                const a = baseAngle + Math.sin(t * 0.18) * 0.06;
                camera.position.x = Math.cos(a) * radius;
                camera.position.z = Math.sin(a) * radius;
                camera.position.y = endPos.y + Math.sin(t * 0.5) * 0.12;
                camera.lookAt(target);
                feel.syncCamera();
              });
            },
          });
        }

        // Idle cursor pulse (gated behind reduced motion). Safe to run behind
        // the start overlay — it touches no round state.
        if (!reduced) {
          unbindFrame = ctx.onFrame((dt, t) => {
            if (cursorMesh.visible) {
              const s = step * (1 + Math.sin(t * 4) * 0.06);
              cursorMesh.scale.setScalar(s);
            }
            problemCard.position.y = 5.4 + Math.sin(t * 1.1) * 0.06;
          });
        }

        // Begin the actual round loop + input binding only after the student
        // presses Start in the clarity overlay. Single entry point for first
        // play and Play Again.
        function beginGameplay() {
          roundIndex = 0;
          lives = START_LIVES;
          gameOver = false;
          if (typeof hud.setLives === "function") hud.setLives(lives);
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
            if (!round || solved || gameOver) return;
            onPrimary();
          });
        }

        // Clarity / onboarding kit: start overlay, how-to-play, persistent help
        // button, mini-HUD, and win screen. Drives nothing in the 3D scene.
        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "Volume Vault — Pack the Prism, Find the Volume",
          objectiveEn:
            "Pack each rectangular prism full of unit cubes to find its volume: V = length × width × height.",
          objectiveEs:
            "Llena cada caja con cubos para hallar su volumen: V = largo × ancho × alto.",
          standard: "6.G.A.2 · Volume of Rectangular Prisms",
          controls: [
            {
              key: "← / → / ↑ / ↓",
              actionEn:
                "Move the glowing cube cursor (fill); pick box A or B (compare); raise/lower the height (missing height)",
              actionEs:
                "Mueve el cursor; elige caja A o B; sube o baja la altura",
            },
            {
              key: "Space / Tap",
              actionEn:
                "Drop a unit cube into the box — or check your answer (compare and missing-edge rounds)",
              actionEs: "Coloca un cubo, o revisa tu respuesta",
            },
            {
              key: "Enter / ✓",
              actionEn:
                "The cursor auto-fills the next empty cell — just keep dropping cubes. (Optional: Enter/✓ jumps to the next layer, or shows a hint on missing-height rounds.)",
              actionEs:
                "El cursor salta solo a la siguiente celda vacía — solo sigue colocando cubos. (Opcional: Enter/✓ salta de capa o muestra una pista.)",
            },
            {
              key: "?",
              actionEn: "Open this help panel any time (Esc closes it)",
              actionEs: "Abre esta ayuda cuando quieras (Esc la cierra)",
            },
          ],
          howToWinEn:
            "Fill each prism completely with unit cubes (the count is the volume), find the missing height, or pick the bigger box. Clear all 6 vaults to win. Each cube is 1 cubic unit (or 1/8 when edges are half-units).",
          howToWinEs:
            "Llena cada caja, halla la altura, o elige la caja más grande. Completa las 6 para ganar.",
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
        clearGroupExtras();
        if (problemCard.material.map) problemCard.material.map.dispose();
        problemCard.material.dispose();
        cursorMat.dispose();
        disposables.forEach((g) => g.dispose());
        scene.remove(group);
      },
    };
  },
};
