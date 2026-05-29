import { prismVolume } from "/games/engine3d/geometry-math.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";

const COLORS = {
  frame: 0xf2c15b,
  cube: [0x1fa6a2, 0x4f8fd0, 0xe09b4a, 0x8b6fc4, 0x4aa978, 0xd9795d],
  cursorOk: 0x1fa6a2,
  cursorBad: 0xb64e2f,
  floor: 0x13355b,
};

// Round kinds:
//   "fill"    — fill the prism with unit cubes to reach the target volume.
//   "missing" — given the volume and two edge lengths, set the missing edge.
//   "compare" — two prisms shown; pick the one with the greater volume.
function makeLevel(level) {
  if (level === 1) {
    return {
      hints: true,
      rounds: [
        { kind: "fill", l: 3, w: 2, h: 2 },
        { kind: "fill", l: 4, w: 3, h: 2 },
        { kind: "fill", l: 4, w: 3, h: 3 },
      ],
    };
  }
  return {
    hints: false,
    rounds: [
      // Fractional edge lengths: dimensions are in units; "frac" sets the
      // sub-cube count per unit along each axis (denominator). A 1/2-unit cube has
      // volume 1/8 of a whole unit cube.
      { kind: "fill", l: 2.5, w: 2, h: 1.5, frac: 2 },
      // Missing dimension: V = l*w*h, solve for h. Edge in half-units.
      { kind: "missing", l: 3, w: 2, volume: 9, axis: "h", frac: 2, max: 4 },
      // Compare two prisms by volume.
      {
        kind: "compare",
        a: { l: 4, w: 2, h: 1.5 },
        b: { l: 3, w: 3, h: 1 },
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

    const group = new THREE.Group();
    scene.add(group);

    // Shared low-poly resources for instancing efficiency.
    const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
    const cursorGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    const disposables = [cubeGeo, cursorGeo];

    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    // ---- Round state ----
    let round = null;
    let roundIndex = 0;
    let solved = false;
    let unbindFrame = null;

    // Fill-round geometry (in sub-cube cells).
    let frac = 1; // cells per unit along an axis
    let step = 1; // world size of one sub-cube = 1/frac
    let nx = 0;
    let ny = 0;
    let nz = 0; // sub-cube counts along x(l), y(h), z(w)
    let filled = null; // boolean grid [x][y][z]
    let cursor = { x: 0, y: 0, z: 0 };
    let placedCount = 0;
    let targetCount = 0;
    let layerUp = true; // direction of the secondary-button vertical layer move
    let cubeMesh = null; // InstancedMesh of placed sub-cubes
    const cursorMesh = new THREE.Mesh(
      cursorGeo,
      new THREE.MeshStandardMaterial({
        color: COLORS.cursorOk,
        transparent: true,
        opacity: 0.55,
        emissive: COLORS.cursorOk,
        emissiveIntensity: 0.3,
      }),
    );
    cursorMesh.visible = false;
    group.add(cursorMesh);

    const dummy = new THREE.Object3D();
    const frameMeshes = [];
    const labels = [];

    // ---- Missing/compare round state ----
    let guess = 0; // current value of the missing edge (in units)
    let guessStep = 1;
    let compareChoice = 0; // 0 = A, 1 = B
    let comparePrisms = [];

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
          if (o.geometry && o.geometry !== cubeGeo) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
      });
      comparePrisms.length = 0;
    }

    // World extents of the prism, centered on origin, sitting on the floor.
    function prismDims() {
      return { lx: nx * step, ly: ny * step, lz: nz * step };
    }

    // World position of the center of sub-cube (i,j,k).
    function cellCenter(i, j, k) {
      const { lx, ly, lz } = prismDims();
      return new THREE.Vector3(
        -lx / 2 + (i + 0.5) * step,
        (j + 0.5) * step,
        -lz / 2 + (k + 0.5) * step,
      );
    }

    function buildWireframe(lx, ly, lz, color, cx = 0, cz = 0) {
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
      // Render fractional unit values as nice strings (e.g. 2.5 -> "2½").
      if (Number.isInteger(value)) return String(value);
      const whole = Math.floor(value);
      const f = value - whole;
      const map = { 0.5: "½", 0.25: "¼", 0.75: "¾" };
      const fr = map[Number(f.toFixed(2))] || f.toFixed(2).replace(/0+$/, "");
      return whole ? `${whole}${fr}` : fr;
    }

    // ---------- FILL ROUND ----------
    function startFillRound() {
      frac = round.frac || 1;
      step = 1 / frac;
      nx = Math.round(round.l * frac);
      ny = Math.round(round.h * frac);
      nz = Math.round(round.w * frac);

      filled = [];
      for (let i = 0; i < nx; i++) {
        filled[i] = [];
        for (let j = 0; j < ny; j++) {
          filled[i][j] = new Array(nz).fill(false);
        }
      }
      targetCount = nx * ny * nz;
      placedCount = 0;
      cursor = { x: 0, y: 0, z: 0 };
      layerUp = true;

      const { lx, ly, lz } = prismDims();

      // Vault frame (target outline).
      const frame = buildWireframe(lx, ly, lz, COLORS.frame);
      group.add(frame);
      frameMeshes.push(frame);

      // Instanced cubes container, sized to capacity.
      const mat = new THREE.MeshStandardMaterial({
        roughness: 0.55,
        metalness: 0.05,
      });
      cubeMesh = new THREE.InstancedMesh(cubeGeo, mat, targetCount);
      cubeMesh.count = 0;
      cubeMesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(targetCount * 3),
        3,
      );
      group.add(cubeMesh);

      cursorMesh.visible = true;
      cursorMesh.scale.setScalar(step);
      cursorGeo.computeBoundingSphere();

      const targetVol = prismVolume(round.l, round.w, round.h);
      const dimStr = `${fracLabel(round.l)} × ${fracLabel(round.w)} × ${fracLabel(
        round.h,
      )}`;
      hud.setObjective(
        `Fill the vault: V = ${dimStr} = ${fracLabel(targetVol)} cubic units`,
      );

      const cubeWord =
        frac === 1
          ? "unit cubes"
          : `${fracLabel(step)}-unit cubes (each ${fracLabel(
              step * step * step,
            )} cubic unit)`;
      announce(
        `Round ${roundIndex + 1}. Fill the rectangular prism with ${cubeWord}. ` +
          `The prism is ${fracLabel(round.l)} long, ${fracLabel(
            round.w,
          )} wide, and ${fracLabel(round.h)} tall. ` +
          `Volume equals length times width times height, which is ${fracLabel(
            targetVol,
          )} cubic units.`,
      );

      if (cfg.hints) {
        hud.message(
          "Move with arrow keys / WASD (Q and E for up and down). Place a cube with Space or tap.",
          { tone: "info", duration: 3200 },
        );
      }
      refreshCursor();
      updateFillObjective();
    }

    function placedVolume() {
      return placedCount * step * step * step;
    }

    function updateFillObjective() {
      const targetVol = prismVolume(round.l, round.w, round.h);
      hud.setObjective(
        `Volume ${fracLabel(placedVolume())} / ${fracLabel(
          targetVol,
        )} cubic units  (${placedCount} / ${targetCount} cubes)`,
      );
    }

    function refreshCursor() {
      const c = cellCenter(cursor.x, cursor.y, cursor.z);
      cursorMesh.position.copy(c);
      const here = filled[cursor.x][cursor.y][cursor.z];
      cursorMesh.material.color.setHex(
        here ? COLORS.cursorBad : COLORS.cursorOk,
      );
      cursorMesh.material.emissive.setHex(
        here ? COLORS.cursorBad : COLORS.cursorOk,
      );
    }

    function placeCube() {
      if (solved) return;
      if (filled[cursor.x][cursor.y][cursor.z]) {
        hud.message("A cube is already there.", {
          tone: "warn",
          duration: 1400,
        });
        feel.shake(0.1);
        return;
      }
      filled[cursor.x][cursor.y][cursor.z] = true;
      const idx = placedCount;
      const c = cellCenter(cursor.x, cursor.y, cursor.z);
      dummy.position.copy(c);
      dummy.scale.setScalar(step * 0.94);
      dummy.updateMatrix();
      cubeMesh.setMatrixAt(idx, dummy.matrix);
      const col = new THREE.Color(COLORS.cube[idx % COLORS.cube.length]);
      cubeMesh.setColorAt(idx, col);
      placedCount += 1;
      cubeMesh.count = placedCount;
      cubeMesh.instanceMatrix.needsUpdate = true;
      if (cubeMesh.instanceColor) cubeMesh.instanceColor.needsUpdate = true;

      feel.burst(
        { x: c.x, y: c.y + 0.3, z: c.z },
        { color: COLORS.cube[idx % COLORS.cube.length], count: 8, size: 0.12 },
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
      for (let j = cursor.y; j < ny; j++) {
        for (let k = j === cursor.y ? cursor.z : 0; k < nz; k++) {
          for (
            let i = j === cursor.y && k === cursor.z ? cursor.x + 1 : 0;
            i < nx;
            i++
          ) {
            if (!filled[i][j][k]) {
              cursor = { x: i, y: j, z: k };
              return;
            }
          }
        }
      }
      // Fall back to first empty cell anywhere.
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
      feel.shake(0.3);
      feel.burst(
        { x: 0, y: 1.5, z: 0 },
        { color: COLORS.frame, count: 36, spread: 4 },
      );
      hud.message(
        `Vault filled! V = ${fracLabel(round.l)}×${fracLabel(
          round.w,
        )}×${fracLabel(round.h)} = ${fracLabel(targetVol)} cubic units. +${pts}`,
        { tone: "ok", duration: 2600 },
      );
      announce(
        `Vault filled. The volume is ${fracLabel(
          targetVol,
        )} cubic units. You earned ${pts} points.`,
      );
      nextRoundSoon();
    }

    // ---------- MISSING-DIMENSION ROUND ----------
    function startMissingRound() {
      frac = round.frac || 1;
      guessStep = 1 / frac;
      const known = prismVolume(round.l, round.w, 1); // l*w (area of base)
      const answer = round.volume / known; // the missing edge length
      round._answer = answer;
      guess = guessStep; // start at the smallest step

      buildMissingScene();

      hud.setObjective(
        `Find the missing edge: V = ${fracLabel(round.l)} × ${fracLabel(
          round.w,
        )} × ? = ${fracLabel(round.volume)} cubic units`,
      );
      announce(
        `Round ${roundIndex + 1}. A rectangular prism has volume ${fracLabel(
          round.volume,
        )} cubic units. Its length is ${fracLabel(
          round.l,
        )} and its width is ${fracLabel(round.w)}. ` +
          `Find the missing height. Use up and down, or the side button, to change it, then place to check.`,
      );
      if (cfg.hints) {
        hud.message("Volume ÷ (length × width) gives the missing edge.", {
          tone: "info",
          duration: 3000,
        });
      }
      updateMissingScene();
    }

    function buildMissingScene() {
      const lx = round.l;
      const lz = round.w;
      // Base footprint outline.
      const base = buildWireframe(lx, 0.02, lz, COLORS.frame);
      base.position.y = 0.01;
      group.add(base);
      frameMeshes.push(base);

      const lbl = makeLabel("", { scale: 0.7 });
      lbl.position.set(0, 0.2, 0);
      group.add(lbl);
      labels.push(lbl);
    }

    function updateMissingScene() {
      const lx = round.l;
      const lz = round.w;
      const ly = guess;
      // Rebuild the dynamic prism wireframe (keep frameMeshes[0] = base).
      if (frameMeshes[1]) {
        group.remove(frameMeshes[1]);
        frameMeshes[1].geometry.dispose();
        frameMeshes[1].material.dispose();
      }
      const prism = buildWireframe(lx, Math.max(ly, 0.001), lz, COLORS.cube[1]);
      group.add(prism);
      frameMeshes[1] = prism;

      const vol = prismVolume(round.l, round.w, guess);
      updateLabel(
        labels[0],
        `${fracLabel(round.l)} × ${fracLabel(round.w)} × ${fracLabel(
          guess,
        )} = ${fracLabel(vol)}`,
      );
      labels[0].position.y = ly + 0.5;
      hud.setObjective(
        `Height = ${fracLabel(guess)} → V = ${fracLabel(vol)} / ${fracLabel(
          round.volume,
        )} cubic units`,
      );
    }

    function adjustGuess(delta) {
      const v = Math.max(guessStep, Math.min(round.max || 6, guess + delta));
      if (v !== guess) {
        guess = Number(v.toFixed(4));
        updateMissingScene();
        announce(`Height set to ${fracLabel(guess)}.`);
      }
    }

    function checkMissing() {
      if (solved) return;
      const vol = prismVolume(round.l, round.w, guess);
      if (Math.abs(vol - round.volume) > 1e-9) {
        hud.message(
          `V = ${fracLabel(vol)}, not ${fracLabel(
            round.volume,
          )}. Adjust the height.`,
          { tone: "warn", duration: 2000 },
        );
        feel.shake(0.14);
        announce(
          `That gives ${fracLabel(vol)} cubic units. Try a different height.`,
        );
        return;
      }
      solved = true;
      const pts = 35;
      onScore(pts, {
        round: roundIndex + 1,
        volume: round.volume,
        edge: guess,
        kind: "missing",
      });
      feel.shake(0.3);
      feel.burst(
        { x: 0, y: guess + 0.6, z: 0 },
        { color: COLORS.frame, count: 32, spread: 3 },
      );
      hud.message(`Correct! Missing edge = ${fracLabel(guess)}. +${pts}`, {
        tone: "ok",
        duration: 2600,
      });
      announce(
        `Correct. The missing height is ${fracLabel(
          guess,
        )}. You earned ${pts} points.`,
      );
      nextRoundSoon();
    }

    // ---------- COMPARE ROUND ----------
    function startCompareRound() {
      comparePrisms = [];
      const specs = [
        { spec: round.a, cx: -3 },
        { spec: round.b, cx: 3 },
      ];
      specs.forEach(({ spec, cx }, idx) => {
        const p = buildSolidPrism(spec, COLORS.cube[idx === 0 ? 0 : 2]);
        p.position.x = cx;
        group.add(p);
        comparePrisms.push(p);
        const vol = prismVolume(spec.l, spec.w, spec.h);
        const lbl = makeLabel(
          `${fracLabel(spec.l)}×${fracLabel(spec.w)}×${fracLabel(
            spec.h,
          )} = ${fracLabel(vol)}`,
          { scale: 0.6 },
        );
        lbl.position.set(cx, spec.h + 0.6, 0);
        group.add(lbl);
        labels.push(lbl);
      });
      compareChoice = 0;
      hud.setObjective("Which vault holds MORE? Move left/right, then place.");
      announce(
        `Round ${roundIndex + 1}. Two prisms. ` +
          `Vault A is ${fracLabel(round.a.l)} by ${fracLabel(
            round.a.w,
          )} by ${fracLabel(round.a.h)}. ` +
          `Vault B is ${fracLabel(round.b.l)} by ${fracLabel(
            round.b.w,
          )} by ${fracLabel(round.b.h)}. ` +
          `Compute each volume and choose the one with the greater volume.`,
      );
      updateCompareCursor();
    }

    function buildSolidPrism(spec, color) {
      const wrap = new THREE.Group();
      const lx = spec.l;
      const ly = spec.h;
      const lz = spec.w;
      const solid = new THREE.Mesh(
        new THREE.BoxGeometry(lx, ly, lz),
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.55,
          transparent: true,
          opacity: 0.9,
        }),
      );
      solid.position.y = ly / 2;
      wrap.add(solid);
      const frame = buildWireframe(lx, ly, lz, COLORS.frame);
      wrap.add(frame);
      return wrap;
    }

    function updateCompareCursor() {
      cursorMesh.visible = false;
      comparePrisms.forEach((p, i) => {
        const solid = p.children[0];
        solid.material.emissive.setHex(
          i === compareChoice ? COLORS.frame : 0x000000,
        );
        solid.material.emissiveIntensity = i === compareChoice ? 0.4 : 0;
      });
      announce(`Selecting vault ${compareChoice === 0 ? "A" : "B"}.`);
    }

    function checkCompare() {
      if (solved) return;
      const va = prismVolume(round.a.l, round.a.w, round.a.h);
      const vb = prismVolume(round.b.l, round.b.w, round.b.h);
      const correct = va === vb ? -1 : va > vb ? 0 : 1;
      if (correct === -1) {
        // Equal volumes — accept either, treat as correct.
      } else if (compareChoice !== correct) {
        hud.message("Not the bigger one — compute each l×w×h again.", {
          tone: "warn",
          duration: 2200,
        });
        feel.shake(0.14);
        announce(
          `Vault A has ${fracLabel(va)} cubic units and vault B has ${fracLabel(
            vb,
          )} cubic units. Try again.`,
        );
        return;
      }
      solved = true;
      const pts = 35;
      onScore(pts, {
        round: roundIndex + 1,
        kind: "compare",
        volA: va,
        volB: vb,
      });
      feel.shake(0.3);
      feel.burst({ x: 0, y: 2, z: 0 }, { color: COLORS.frame, count: 32 });
      hud.message(
        `Correct! A = ${fracLabel(va)}, B = ${fracLabel(vb)} cubic units. +${pts}`,
        { tone: "ok", duration: 2600 },
      );
      announce(
        `Correct. Vault A is ${fracLabel(va)} and vault B is ${fracLabel(
          vb,
        )} cubic units. You earned ${pts} points.`,
      );
      nextRoundSoon();
    }

    // ---------- Round flow ----------
    function startRound() {
      clearGroupExtras();
      solved = false;
      round = cfg.rounds[roundIndex];
      if (round.kind === "fill") startFillRound();
      else if (round.kind === "missing") startMissingRound();
      else if (round.kind === "compare") startCompareRound();
    }

    function nextRoundSoon() {
      later(() => {
        if (roundIndex < cfg.rounds.length - 1) {
          roundIndex += 1;
          startRound();
        } else {
          hud.setObjective("Vault secured! Great work, Vault Keeper.");
          hud.message("All rounds complete!", { tone: "ok", duration: 0 });
          announce("All rounds complete. Great work, Vault Keeper.");
        }
      }, 2800);
    }

    // ---------- Input wiring ----------
    function onPrimary() {
      if (!round) return;
      if (round.kind === "fill") placeCube();
      else if (round.kind === "missing") checkMissing();
      else if (round.kind === "compare") checkCompare();
    }

    function onDirection(name) {
      if (!round) return;
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
          updateCompareCursor();
        } else if (name === "right") {
          compareChoice = 1;
          updateCompareCursor();
        }
      }
    }

    // Secondary button: vertical layer move (fill) / help (others).
    function onConfirm() {
      if (!round) return;
      if (round.kind === "fill") {
        // Toggle and move between vertical layers for full 3D reach.
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
        later(() => caption(""), 2200);
      }
    }

    let unbindPress = null;
    let unbindTap = null;

    return {
      start() {
        camera.position.set(6, 7, 9);
        camera.lookAt(0, 1, 0);
        feel.syncCamera();

        roundIndex = 0;
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
          if (!round || solved) return;
          if (round.kind === "fill") {
            placeCube();
          } else {
            onPrimary();
          }
        });

        if (!feel.reducedMotion) {
          unbindFrame = ctx.onFrame((dt, t) => {
            if (cursorMesh.visible) {
              const s = step * (1 + Math.sin(t * 4) * 0.05);
              cursorMesh.scale.setScalar(s);
            }
          });
        }
      },

      dispose() {
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        clearGroupExtras();
        if (cursorMesh.material) cursorMesh.material.dispose();
        disposables.forEach((g) => g.dispose());
        scene.remove(group);
      },
    };
  },
};
