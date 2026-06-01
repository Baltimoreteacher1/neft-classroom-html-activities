// Unit 5 — "Area Architect" (CCSS 6.G.A.1)
// Build structures whose footprint matches a target area by placing rectangular
// and right-triangular pieces on a grid. Premium rebuild against engine3d.
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";
import {
  rectArea,
  triangleArea,
  compositeArea,
} from "/games/engine3d/geometry-math.js";

const COLORS = {
  stage: 0x14304f,
  stageEdge: 0x1f4a78,
  gridLine: 0x3c7fbf,
  target: 0xf2c15b,
  cursor: 0x35e0d6,
  piece: [0x35e0d6, 0x5fa0e6, 0xf0a64e, 0x9b7fe0, 0x55c98a, 0xe88a6c],
  ghostOk: 0x35e0d6,
  ghostBad: 0xe05a3a,
};

const CELL = 1;

// ---- Level definitions -----------------------------------------------------
// Level 1 (support): smaller grid, only rectangles & simple L composites,
// piece labels + hints, smaller numbers. 6 rounds.
// Level 2 (enrichment): larger grid, T/L composites + right-triangle round,
// no labels/hints, larger numbers, multi-step. 6 rounds.
function makeLevel(level) {
  if (level === 1) {
    return {
      grid: 6,
      hints: true,
      labelPieces: true,
      allowTriangle: false,
      rounds: [
        { kind: "rect", parts: [{ x: 1, y: 1, w: 3, h: 2 }] },
        { kind: "rect", parts: [{ x: 0, y: 1, w: 4, h: 3 }] },
        { kind: "rect", parts: [{ x: 0, y: 0, w: 5, h: 3 }] },
        { kind: "rect", parts: [{ x: 0, y: 1, w: 6, h: 4 }] },
        {
          kind: "lshape",
          parts: [
            { x: 0, y: 0, w: 4, h: 2 },
            { x: 0, y: 2, w: 2, h: 2 },
          ],
        },
        {
          kind: "lshape",
          parts: [
            { x: 0, y: 0, w: 5, h: 2 },
            { x: 0, y: 2, w: 2, h: 3 },
          ],
        },
      ],
    };
  }
  return {
    grid: 8,
    hints: false,
    labelPieces: false,
    allowTriangle: true,
    rounds: [
      { kind: "rect", parts: [{ x: 0, y: 0, w: 7, h: 5 }] },
      {
        kind: "lshape",
        parts: [
          { x: 0, y: 0, w: 6, h: 3 },
          { x: 0, y: 3, w: 3, h: 3 },
        ],
      },
      {
        kind: "tshape",
        parts: [
          { x: 0, y: 0, w: 7, h: 2 },
          { x: 2, y: 2, w: 3, h: 4 },
        ],
      },
      {
        kind: "ushape",
        parts: [
          { x: 0, y: 0, w: 2, h: 5 },
          { x: 6, y: 0, w: 2, h: 5 },
          { x: 2, y: 0, w: 4, h: 2 },
        ],
      },
      // Right triangle: right-angle at corner (cx,cy); legs run +w and +h.
      { kind: "triangle", cx: 1, cy: 1, w: 6, h: 4 },
      { kind: "triangle", cx: 0, cy: 0, w: 8, h: 6 },
    ],
  };
}

// Cell set for rectangle / composite rounds. Cells keyed "col,row".
function targetCells(round) {
  const cells = new Set();
  for (const r of round.parts) {
    for (let dx = 0; dx < r.w; dx++)
      for (let dy = 0; dy < r.h; dy++) cells.add(r.x + dx + "," + (r.y + dy));
  }
  return cells;
}

export default {
  id: "unit-5-area-architect",
  vocab: [
    {
      term: "Area",
      definition:
        "The amount of flat space inside a shape, measured in square units.",
      emoji: "▦",
    },
    {
      term: "Square unit",
      definition: "One small 1-by-1 square. We count these to find area.",
      emoji: "⬛",
    },
    {
      term: "Length and width",
      definition: "The two sides of a rectangle. Area = length × width.",
      emoji: "📏",
    },
    {
      term: "Composite figure",
      definition:
        "A bigger shape made by joining simple shapes like rectangles.",
      emoji: "🧩",
    },
    {
      term: "Decompose",
      definition:
        "To break a shape into smaller, easier pieces you can measure.",
      emoji: "✂️",
    },
    {
      term: "Right triangle",
      definition: "A triangle with a square corner. Its area is leg × leg ÷ 2.",
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
    const N = cfg.grid;
    const half = (N * CELL) / 2;

    // ---- Clarity / onboarding kit (shared overlay over the canvas) ----------
    // Mount element is the same positioned container that hosts the canvas.
    const clarityMount = renderer.domElement.parentElement || document.body;
    let clarity = null;

    // ---- Coordinate helpers --------------------------------------------------
    const cellCenter = (col, row) => ({
      x: -half + (col + 0.5) * CELL,
      z: -half + (row + 0.5) * CELL,
    });
    const vertexWorld = (vx, vy) => ({
      x: -half + vx * CELL,
      z: -half + vy * CELL,
    });
    const worldToCell = (x, z) => ({
      col: Math.floor((x + half) / CELL),
      row: Math.floor((z + half) / CELL),
    });
    const worldToVertex = (x, z) => ({
      vx: Math.round((x + half) / CELL),
      vy: Math.round((z + half) / CELL),
    });
    const inCell = (col, row) => col >= 0 && col < N && row >= 0 && row < N;
    const inVertex = (vx, vy) => vx >= 0 && vx <= N && vy >= 0 && vy <= N;

    // ---- Static scene --------------------------------------------------------
    const group = new THREE.Group();
    scene.add(group);

    const disposables = [];
    const track = (obj) => {
      disposables.push(obj);
      return obj;
    };

    // Stage / build platform — rounded, PBR, receives shadow.
    const stageGeo = track(
      new RoundedBoxGeometry(N * CELL + 1.4, 0.7, N * CELL + 1.4, 4, 0.28),
    );
    const stageMat = track(
      new THREE.MeshStandardMaterial({
        color: COLORS.stage,
        roughness: 0.85,
        metalness: 0.12,
      }),
    );
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.y = -0.35;
    stage.receiveShadow = true;
    group.add(stage);

    // Inset build deck (slightly raised, glows faintly).
    const deckGeo = track(
      new RoundedBoxGeometry(N * CELL + 0.2, 0.18, N * CELL + 0.2, 3, 0.1),
    );
    const deckMat = track(
      new THREE.MeshStandardMaterial({
        color: COLORS.stageEdge,
        roughness: 0.7,
        metalness: 0.2,
        emissive: COLORS.stageEdge,
        emissiveIntensity: 0.18,
      }),
    );
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 0.0;
    deck.receiveShadow = true;
    group.add(deck);

    const gridHelper = new THREE.GridHelper(
      N * CELL,
      N,
      COLORS.gridLine,
      COLORS.gridLine,
    );
    gridHelper.position.y = 0.1;
    gridHelper.material.opacity = 0.8;
    gridHelper.material.transparent = true;
    track(gridHelper.material);
    track(gridHelper.geometry);
    group.add(gridHelper);

    const pickPlane = new THREE.Mesh(
      track(new THREE.PlaneGeometry(N * CELL, N * CELL)),
      track(new THREE.MeshBasicMaterial({ visible: false })),
    );
    pickPlane.rotation.x = -Math.PI / 2;
    pickPlane.position.y = 0.1;
    group.add(pickPlane);

    // ---- Target outline ------------------------------------------------------
    const targetGroup = new THREE.Group();
    group.add(targetGroup);
    const tileGeo = track(new THREE.BoxGeometry(CELL * 0.94, 0.5, CELL * 0.94));
    const targetMat = track(
      new THREE.MeshStandardMaterial({
        color: COLORS.target,
        transparent: true,
        opacity: 0.32,
        emissive: COLORS.target,
        emissiveIntensity: 0.45,
        roughness: 0.5,
      }),
    );

    // ---- Cursor + ghost ------------------------------------------------------
    const cursor = { col: 0, row: 0 };
    let anchor = null;

    const cursorGeo = track(new RoundedBoxGeometry(CELL, 0.1, CELL, 2, 0.1));
    const cursorMat = track(
      new THREE.MeshStandardMaterial({
        color: COLORS.cursor,
        transparent: true,
        opacity: 0.9,
        emissive: COLORS.cursor,
        emissiveIntensity: 0.6,
        roughness: 0.4,
      }),
    );
    const cursorMesh = new THREE.Mesh(cursorGeo, cursorMat);
    cursorMesh.position.y = 0.18;
    group.add(cursorMesh);

    // 3D problem card — floats above the stage, always shows the question.
    const cardLabel = makeLabel("", {
      THREE,
      fontSize: 60,
      scale: 1.3,
      color: "#ffffff",
      background: "rgba(13,32,56,0.92)",
    });
    cardLabel.position.set(0, N * 0.62 + 1.6, -half - 0.4);
    cardLabel.renderOrder = 10;
    group.add(cardLabel);

    let ghostMesh = null;

    // ---- Round state ---------------------------------------------------------
    const placed = [];
    let covered = new Set();
    let target = new Set();
    let round = null;
    let targetArea = 0;
    let roundIndex = 0;
    let triangleMode = false;
    let solved = false;
    let triPlaced = false;
    let streak = 0;
    let bestStreak = 0;
    let solvedCount = 0;
    let introDone = false;
    const frameUnbinders = [];
    const timers = [];

    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    function disposeMesh(m) {
      m.traverse((o) => {
        if (o.geometry && o.geometry !== tileGeo && o.geometry !== cursorGeo)
          o.geometry.dispose();
        if (
          o.material &&
          o.material !== targetMat &&
          o.material !== cursorMat
        ) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      });
    }

    function clearRound() {
      placed.forEach((p) => {
        group.remove(p.mesh);
        disposeMesh(p.mesh);
        if (p.label) {
          group.remove(p.label);
          if (p.label.material.map) p.label.material.map.dispose();
          p.label.material.dispose();
        }
      });
      placed.length = 0;
      while (targetGroup.children.length) {
        const m = targetGroup.children.pop();
        if (m.geometry && m.geometry !== tileGeo) m.geometry.dispose();
      }
      if (ghostMesh) {
        group.remove(ghostMesh);
        if (ghostMesh.geometry) ghostMesh.geometry.dispose();
        ghostMesh.material.dispose();
        ghostMesh = null;
      }
      covered = new Set();
      anchor = null;
      solved = false;
      triPlaced = false;
    }

    function describeRound(r) {
      if (r.kind === "rect") return "a rectangle";
      if (r.kind === "lshape") return "an L-shaped composite figure";
      if (r.kind === "tshape") return "a T-shaped composite figure";
      if (r.kind === "ushape") return "a U-shaped composite figure";
      if (r.kind === "triangle") return "a right triangle";
      return "the shape";
    }

    // Exact area via geometry-math helpers (not cell counting).
    function exactTargetArea(r) {
      if (r.kind === "triangle") return triangleArea(r.w, r.h);
      return compositeArea(
        r.parts.map((p) => ({ type: "rect", w: p.w, h: p.h })),
      );
    }

    // Right-triangle vertices (grid-line coords) for the triangle round.
    function triVertices(r) {
      return [
        { vx: r.cx, vy: r.cy },
        { vx: r.cx + r.w, vy: r.cy },
        { vx: r.cx, vy: r.cy + r.h },
      ];
    }

    function buildTriangleShapeMesh(verts, color, opacity) {
      const shape = new THREE.Shape();
      verts.forEach((v, i) => {
        const w = vertexWorld(v.vx, v.vy);
        if (i === 0) shape.moveTo(w.x, w.z);
        else shape.lineTo(w.x, w.z);
      });
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.5,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 1,
      });
      geo.rotateX(Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({
        color,
        transparent: opacity < 1,
        opacity,
        roughness: 0.55,
        metalness: 0.08,
        emissive: color,
        emissiveIntensity: opacity < 1 ? 0.4 : 0.15,
      });
      return new THREE.Mesh(geo, mat);
    }

    // ---- Problem card / objective text --------------------------------------
    function cardText() {
      if (round.kind === "triangle") {
        return `Fill the gold triangle.\nArea = ${targetArea} sq units\n(leg × leg ÷ 2)`;
      }
      return `Fill the gold shape.\nArea = ${targetArea} sq units`;
    }

    function startRound() {
      clearRound();
      round = cfg.rounds[roundIndex];
      triangleMode = round.kind === "triangle";
      targetArea = exactTargetArea(round);

      if (typeof hud.setProgress === "function")
        hud.setProgress(roundIndex, cfg.rounds.length);

      if (round.kind === "triangle") {
        const verts = triVertices(round);
        const t = buildTriangleShapeMesh(verts, COLORS.target, 0.32);
        t.position.y = 0.12;
        t.scale.y = 0.12;
        targetGroup.add(t);
        cursor.col = round.cx;
        cursor.row = round.cy;
      } else {
        target = targetCells(round);
        target.forEach((key) => {
          const [col, row] = key.split(",").map(Number);
          const m = new THREE.Mesh(tileGeo, targetMat);
          const cc = cellCenter(col, row);
          m.position.set(cc.x, 0.12, cc.z);
          m.scale.y = 0.12;
          targetGroup.add(m);
        });
        const first = [...target][0].split(",").map(Number);
        cursor.col = first[0];
        cursor.row = first[1];
      }

      updateLabel(cardLabel, cardText());

      if (clarity) {
        const shapeName =
          round.kind === "triangle"
            ? "right triangle"
            : round.kind === "rect"
              ? "rectangle"
              : `${round.kind.replace("shape", "")}-shaped figure`;
        clarity.setTarget(`${shapeName} · ${targetArea} sq units`);
      }

      announce(
        `Round ${roundIndex + 1} of ${cfg.rounds.length}. Fill the gold shape. The area is ${targetArea} square units.`,
      );
      feel.sfx("select", "New shape to fill.");
      updateLive();
      refreshGhost();
      if (cfg.hints) {
        hud.message("Set a corner, then drop a block to fill the gold shape.", {
          tone: "info",
          duration: 2800,
        });
      }
    }

    function liveArea() {
      return triangleMode && round.kind === "triangle"
        ? triPlaced
          ? targetArea
          : 0
        : covered.size;
    }

    function updateLive() {
      const area = liveArea();
      const text =
        `Fill the gold shape: ${targetArea} sq units. ` +
        `Filled ${area} of ${targetArea}. ` +
        (anchor ? "Move, then drop the block." : "Press to set a corner.");
      hud.setObjective(text);
      if (clarity) clarity.setObjective(text);
    }

    // ---- Rectangle helpers (cell-based) -------------------------------------
    function rectFromCells(a, b) {
      const c0 = Math.min(a.col, b.col);
      const c1 = Math.max(a.col, b.col);
      const r0 = Math.min(a.row, b.row);
      const r1 = Math.max(a.row, b.row);
      const cells = [];
      for (let c = c0; c <= c1; c++)
        for (let r = r0; r <= r1; r++) cells.push(c + "," + r);
      return { cells, w: c1 - c0 + 1, h: r1 - r0 + 1, c0, r0, c1, r1 };
    }

    function rectValid(rc) {
      if (!rc.cells.length) return false;
      for (const k of rc.cells)
        if (!target.has(k) || covered.has(k)) return false;
      return true;
    }

    // ---- Triangle helpers ---------------------------------------------------
    function triFromAnchorCursor() {
      const a = anchor;
      const cv = { vx: cursor.col, vy: cursor.row };
      const w = Math.abs(cv.vx - a.vx);
      const h = Math.abs(cv.vy - a.vy);
      return { a, cv, w, h, area: triangleArea(w, h) };
    }

    function triangleMatchesTarget(verts) {
      if (round.kind !== "triangle") return false;
      const want = triVertices(round);
      const key = (v) => v.vx + ":" + v.vy;
      const a = verts.map(key).sort().join("|");
      const b = want.map(key).sort().join("|");
      return a === b;
    }

    function refreshGhost() {
      // Cursor marker position.
      if (triangleMode) {
        const w = vertexWorld(cursor.col, cursor.row);
        cursorMesh.position.set(w.x, 0.18, w.z);
      } else {
        const cc = cellCenter(cursor.col, cursor.row);
        cursorMesh.position.set(cc.x, 0.18, cc.z);
      }

      if (ghostMesh) {
        group.remove(ghostMesh);
        if (ghostMesh.geometry) ghostMesh.geometry.dispose();
        ghostMesh.material.dispose();
        ghostMesh = null;
      }
      if (!anchor) return;

      if (triangleMode) {
        const ti = triFromAnchorCursor();
        if (ti.w === 0 || ti.h === 0) return;
        const verts = [
          { vx: ti.a.vx, vy: ti.a.vy },
          { vx: ti.cv.vx, vy: ti.a.vy },
          { vx: ti.a.vx, vy: ti.cv.vy },
        ];
        const ok = triangleMatchesTarget(verts);
        ghostMesh = buildTriangleShapeMesh(
          verts,
          ok ? COLORS.ghostOk : COLORS.ghostBad,
          0.45,
        );
        ghostMesh.position.y = 0.38;
        group.add(ghostMesh);
      } else {
        const rc = rectFromCells(anchor, cursor);
        const ok = rectValid(rc);
        const center = cellCenter((rc.c0 + rc.c1) / 2, (rc.r0 + rc.r1) / 2);
        ghostMesh = new THREE.Mesh(
          new THREE.BoxGeometry(rc.w * CELL * 0.96, 0.5, rc.h * CELL * 0.96),
          new THREE.MeshStandardMaterial({
            color: ok ? COLORS.ghostOk : COLORS.ghostBad,
            transparent: true,
            opacity: 0.45,
            emissive: ok ? COLORS.ghostOk : COLORS.ghostBad,
            emissiveIntensity: 0.4,
          }),
        );
        ghostMesh.position.set(center.x, 0.4, center.z);
        group.add(ghostMesh);
      }
    }

    function pieceColor() {
      return COLORS.piece[placed.length % COLORS.piece.length];
    }

    // Scale-pop a freshly placed mesh in (respects reduced motion via feel).
    function popIn(mesh, targetY) {
      mesh.position.y = targetY;
      if (feel.reducedMotion) {
        mesh.scale.setScalar(1);
        return;
      }
      mesh.scale.setScalar(0.01);
      feel.tween({
        from: 0,
        to: 1,
        duration: 0.32,
        onUpdate: (v) => {
          const s = 0.3 + v * 0.7;
          mesh.scale.set(s, 0.4 + v * 0.6, s);
        },
        onComplete: () => mesh.scale.set(1, 1, 1),
      });
    }

    function commit() {
      if (solved || !anchor) return;

      if (triangleMode) {
        const ti = triFromAnchorCursor();
        const verts = [
          { vx: ti.a.vx, vy: ti.a.vy },
          { vx: ti.cv.vx, vy: ti.a.vy },
          { vx: ti.a.vx, vy: ti.cv.vy },
        ];
        if (ti.w === 0 || ti.h === 0 || !triangleMatchesTarget(verts)) {
          rejectPiece("Not a match. Make it fit the gold triangle.");
          return;
        }
        const mesh = buildTriangleShapeMesh(verts, pieceColor(), 1);
        mesh.castShadow = true;
        popIn(mesh, 0.34);
        group.add(mesh);
        const entry = { mesh, area: ti.area };
        if (cfg.labelPieces) entry.label = attachTriLabel(verts, ti);
        placed.push(entry);
        triPlaced = true;
        feel.sfx("add", `Placed a triangle, area ${ti.area} square units.`);
        announce(
          `Placed a triangle. ${ti.w} times ${ti.h} divided by 2 is ${ti.area} square units.`,
        );
        burstAt(vertexWorld(ti.a.vx, ti.a.vy), pieceColor());
        anchor = null;
        refreshGhost();
        updateLive();
        checkWin();
        return;
      }

      const rc = rectFromCells(anchor, cursor);
      if (!rectValid(rc)) {
        rejectPiece("Block goes outside the gold shape. Try a smaller one.");
        return;
      }
      const mesh = buildRectMesh(rc);
      mesh.castShadow = true;
      popIn(mesh, 0.4);
      group.add(mesh);
      rc.cells.forEach((k) => covered.add(k));
      const a = rectArea(rc.w, rc.h);
      const entry = { mesh, area: a };
      if (cfg.labelPieces) {
        const center = cellCenter((rc.c0 + rc.c1) / 2, (rc.r0 + rc.r1) / 2);
        const label = makeLabel(`${rc.w}×${rc.h}=${a}`, {
          THREE,
          fontSize: 64,
          scale: 0.95,
        });
        label.position.set(center.x, 1.2, center.z);
        group.add(label);
        entry.label = label;
      }
      placed.push(entry);
      feel.sfx("add", `Placed a piece, ${a} square units.`);
      announce(
        `Placed a piece. ${rc.w} times ${rc.h} is ${a} square units. Total area ${covered.size}.`,
      );
      burstAt(cellCenter(cursor.col, cursor.row), pieceColor());
      anchor = null;
      refreshGhost();
      updateLive();
      checkWin();
    }

    function attachTriLabel(verts, ti) {
      const cx = (verts[0].vx + verts[1].vx + verts[2].vx) / 3;
      const cy = (verts[0].vy + verts[1].vy + verts[2].vy) / 3;
      const w = vertexWorld(cx, cy);
      const label = makeLabel(`${ti.w}×${ti.h}÷2=${ti.area}`, {
        THREE,
        fontSize: 64,
        scale: 0.95,
      });
      label.position.set(w.x, 1.2, w.z);
      group.add(label);
      return label;
    }

    function buildRectMesh(rc) {
      const center = cellCenter((rc.c0 + rc.c1) / 2, (rc.r0 + rc.r1) / 2);
      const color = pieceColor();
      const mesh = new THREE.Mesh(
        new RoundedBoxGeometry(
          rc.w * CELL * 0.96,
          0.5,
          rc.h * CELL * 0.96,
          3,
          0.1,
        ),
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.5,
          metalness: 0.15,
          emissive: color,
          emissiveIntensity: 0.16,
        }),
      );
      mesh.position.set(center.x, 0.4, center.z);
      return mesh;
    }

    function burstAt(p, color) {
      feel.burst({ x: p.x, y: 0.7, z: p.z }, { color, count: 18, spread: 3.4 });
    }

    function rejectPiece(msg) {
      if (typeof hud.feedback === "function") hud.feedback(false, msg);
      else hud.message(msg, { tone: "warn", duration: 2000 });
      feel.sfx("wrong");
      feel.shake(0.18);
      announce(msg);
      anchor = null;
      refreshGhost();
      updateLive();
    }

    function checkWin() {
      if (solved) return;
      let win = false;
      if (round.kind === "triangle") {
        win = triPlaced;
      } else {
        if (covered.size > targetArea) {
          hud.message("Area is too big — rethink your pieces.", {
            tone: "warn",
            duration: 2000,
          });
          return;
        }
        if (covered.size !== targetArea) return;
        win = true;
        for (const k of target)
          if (!covered.has(k)) {
            win = false;
            break;
          }
      }
      if (!win) return;

      solved = true;
      solvedCount += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      if (typeof hud.setStreak === "function") hud.setStreak(streak);

      const base = 20;
      const levelBonus = level === 2 ? 10 : 0;
      const fewBonus =
        round.kind !== "triangle" && round.kind !== "rect" && placed.length <= 2
          ? 10
          : 0;
      const pts = base + levelBonus + fewBonus;
      onScore(pts, {
        round: roundIndex + 1,
        area: targetArea,
        pieces: placed.length,
        detail: round.kind,
      });

      feel.sfx("correct");
      feel.shake(0.3);
      feel.burst(
        { x: 0, y: 1.4, z: 0 },
        { color: COLORS.target, count: 44, spread: 5.5 },
      );
      const bonusMsg = fewBonus ? ` Fewest-pieces bonus +${fewBonus}!` : "";
      const okMsg = `Perfect! Area = ${targetArea} sq units. +${pts}${bonusMsg}`;
      if (typeof hud.feedback === "function")
        hud.feedback(true, okMsg, { duration: 2400 });
      else hud.message(okMsg, { tone: "ok", duration: 2400 });
      announce(
        `Solved! The area is exactly ${targetArea} square units. You earned ${pts} points.`,
      );

      later(() => {
        if (roundIndex < cfg.rounds.length - 1) {
          roundIndex += 1;
          startRound();
        } else {
          finishGame();
        }
      }, 2600);
    }

    function finishGame() {
      updateLabel(cardLabel, `You filled every shape!\nGreat work!`);
      hud.setObjective(
        `Done! You filled ${solvedCount} of ${cfg.rounds.length} shapes. Best streak ${bestStreak}. Great work!`,
      );
      hud.message("All rounds complete!", { tone: "ok", duration: 0 });
      feel.sfx("fanfare", "All rounds complete!");
      if (!feel.reducedMotion) {
        for (let i = 0; i < 6; i++) {
          later(
            () =>
              feel.burst(
                {
                  x: (Math.random() - 0.5) * N,
                  y: 1.6 + Math.random(),
                  z: (Math.random() - 0.5) * N,
                },
                {
                  color: COLORS.piece[i % COLORS.piece.length],
                  count: 30,
                  spread: 5,
                },
              ),
            i * 180,
          );
        }
      }
      announce(
        `All rounds complete. You built ${solvedCount} shapes with a best streak of ${bestStreak}. Great work, Architect.`,
      );

      if (clarity) {
        clarity.setTarget(null);
        clarity.win({
          titleEn: "Studio complete!",
          badge: "📐",
          stats: `You filled all ${cfg.rounds.length} shapes. Best streak ${bestStreak}. Score saved.`,
        });
      }
    }

    // ---- Input ---------------------------------------------------------------
    function maxIndex() {
      return triangleMode ? N : N - 1;
    }

    function moveCursor(dCol, dRow) {
      const lim = maxIndex();
      const nc = Math.max(0, Math.min(lim, cursor.col + dCol));
      const nr = Math.max(0, Math.min(lim, cursor.row + dRow));
      if (nc !== cursor.col || nr !== cursor.row) {
        cursor.col = nc;
        cursor.row = nr;
        feel.sfx("select");
        refreshGhost();
        if (triangleMode)
          announce(`Cursor at point ${cursor.col}, ${cursor.row}.`);
        else
          announce(
            `Cursor at column ${cursor.col + 1}, row ${cursor.row + 1}.`,
          );
      }
    }

    function primaryAction() {
      if (solved || !introDone) return;
      if (!anchor) {
        if (triangleMode) {
          if (cursor.col !== round.cx || cursor.row !== round.cy) {
            hud.message("Start at the square corner of the triangle.", {
              tone: "info",
              duration: 1800,
            });
            feel.sfx("wrong");
            feel.shake(0.12);
            return;
          }
          anchor = { vx: cursor.col, vy: cursor.row };
          feel.sfx("pop");
          announce("Corner set. Move to the far point, then press again.");
        } else {
          if (!target.has(cursor.col + "," + cursor.row)) {
            hud.message("Start your corner inside the outline.", {
              tone: "warn",
              duration: 1600,
            });
            feel.sfx("wrong");
            feel.shake(0.12);
            return;
          }
          anchor = { col: cursor.col, row: cursor.row };
          feel.sfx("pop");
          announce("Corner set. Move to the far corner, then press again.");
        }
        updateLive();
        refreshGhost();
      } else {
        commit();
      }
    }

    function secondaryAction() {
      if (anchor) {
        anchor = null;
        feel.sfx("remove");
        refreshGhost();
        updateLive();
        announce("Corner cleared.");
        return;
      }
      if (round.kind === "triangle") {
        caption("Triangle rule: area = leg × leg ÷ 2.");
        feel.sfx("select");
        announce(
          "Triangle rule. Area is one leg times the other leg divided by two.",
        );
        later(() => caption(""), 1800);
      }
    }

    function pointerToTarget() {
      const hits = input.raycast(camera, [pickPlane], false);
      if (!hits.length) return null;
      const p = hits[0].point;
      if (triangleMode) {
        const { vx, vy } = worldToVertex(p.x, p.z);
        return inVertex(vx, vy) ? { col: vx, row: vy } : null;
      }
      const { col, row } = worldToCell(p.x, p.z);
      return inCell(col, row) ? { col, row } : null;
    }

    let unbindPress = null;
    let unbindTap = null;

    // ---- Animated camera intro ----------------------------------------------
    function cameraIntro() {
      const targetPos = { x: 0, y: N * 1.25, z: N * 1.35 };
      if (feel.reducedMotion) {
        camera.position.set(targetPos.x, targetPos.y, targetPos.z);
        camera.lookAt(0, 0, 0);
        feel.syncCamera();
        introDone = true;
        return;
      }
      const start = { x: -N * 0.9, y: N * 2.1, z: N * 1.9 };
      camera.position.set(start.x, start.y, start.z);
      camera.lookAt(0, 0, 0);
      feel.tween({
        from: 0,
        to: 1,
        duration: 1.5,
        onUpdate: (v) => {
          camera.position.set(
            start.x + (targetPos.x - start.x) * v,
            start.y + (targetPos.y - start.y) * v,
            start.z + (targetPos.z - start.z) * v,
          );
          camera.lookAt(0, 0, 0);
        },
        onComplete: () => {
          feel.syncCamera();
          introDone = true;
        },
      });
    }

    return {
      start() {
        // Camera intro + idle motion run immediately behind the start overlay;
        // only the interactive round loop + input wait for Start.
        cameraIntro();

        // Begin the actual round loop only after the student presses Start in the
        // clarity overlay. Single entry point for first play and Play Again.
        function beginGameplay() {
          roundIndex = 0;
          startRound();

          unbindPress = input.onPress((name) => {
            if (name === "up") moveCursor(0, -1);
            else if (name === "down") moveCursor(0, 1);
            else if (name === "left") moveCursor(-1, 0);
            else if (name === "right") moveCursor(1, 0);
            else if (name === "action") primaryAction();
            else if (name === "confirm") secondaryAction();
          });

          unbindTap = input.onTap(() => {
            if (solved || !introDone) return;
            const cell = pointerToTarget();
            if (!cell) return;
            cursor.col = cell.col;
            cursor.row = cell.row;
            refreshGhost();
            primaryAction();
          });
        }

        // Clarity / onboarding kit: start overlay, how-to-play, persistent help
        // button, mini-HUD, and win screen. Drives nothing in the 3D scene.
        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "Area Architect — Build to the Target Area",
          objectiveEn:
            "Fill the glowing gold shape exactly by placing blocks so the area you build equals the target square units.",
          objectiveEs:
            "Llena la figura dorada colocando bloques para que el área sea igual a las unidades cuadradas indicadas.",
          standard: "6.G.A.1 · Area of Polygons & Composite Figures",
          controls: [
            {
              key: "← ↑ → ↓",
              actionEn: "Move the build cursor across the grid",
              actionEs: "Mueve el cursor por la cuadrícula",
            },
            {
              key: "Space",
              actionEn:
                "Set a corner, then press again to drop a block (or place the triangle)",
              actionEs:
                "Fija una esquina, luego presiona otra vez para soltar un bloque",
            },
            {
              key: "Enter",
              actionEn:
                "Cancel the corner you set (on triangle rounds, show the area rule)",
              actionEs:
                "Cancela la esquina fijada (o muestra la regla del área)",
            },
            {
              key: "Tap / Click",
              actionEn:
                "Tap a grid square to move there and set a corner / drop a block",
              actionEs:
                "Toca una casilla para fijar la esquina o soltar el bloque",
            },
            {
              key: "?",
              actionEn: "Open this help panel any time (Esc closes it)",
              actionEs: "Abre esta ayuda cuando quieras (Esc la cierra)",
            },
          ],
          howToWinEn:
            "Cover the gold shape so the filled area exactly equals the target — no overflow. Rectangle area = length × width; right triangle = leg × leg ÷ 2. Fill every shape to win.",
          howToWinEs:
            "Cubre la figura dorada hasta igualar el área exacta. Completa todas las figuras para ganar.",
          onStart: beginGameplay,
          onPlayAgain: () => location.reload(),
        });

        // Idle motion: gentle cursor pulse + slow card bob (reduced-motion gated).
        if (!feel.reducedMotion) {
          frameUnbinders.push(
            onFrame((dt, t) => {
              const s = 1 + Math.sin(t * 4) * 0.08;
              cursorMesh.scale.set(s, 1, s);
              cardLabel.position.y = N * 0.62 + 1.6 + Math.sin(t * 1.3) * 0.12;
              if (ghostMesh) {
                ghostMesh.material.emissiveIntensity =
                  0.3 + Math.sin(t * 6) * 0.12;
              }
            }),
          );
        }
      },

      dispose() {
        if (clarity) clarity.dispose();
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        frameUnbinders.forEach((u) => u && u());
        frameUnbinders.length = 0;
        timers.forEach(clearTimeout);
        timers.length = 0;
        clearRound();
        if (cardLabel.material.map) cardLabel.material.map.dispose();
        cardLabel.material.dispose();
        scene.remove(group);
        disposables.forEach((d) => d && d.dispose && d.dispose());
      },
    };
  },
};
