import { createGrid } from "/games/engine3d/grid.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";

/**
 * Coordinate Polygon — Blueprint Builder.
 * Standard: 6.G.A.3 — Draw polygons in the coordinate plane given the
 * coordinates of the vertices; use coordinates to find the length of a side
 * joining points with the same first coordinate or the same second coordinate
 * (apply absolute value to find distances across quadrants).
 *
 * Theme: a holographic drafting table. The student is an architect who pilots
 * a beacon to plant each numbered vertex at the called-out ordered pair. When
 * every vertex is placed, the polygon's edges snap into a glowing outline.
 * The student then measures one horizontal and one vertical side by stepping
 * the beacon along it (length = |difference of the changing coordinate|), and
 * finally confirms the whole perimeter. Real interactive 3D, not a quiz: the
 * answer is only revealed in the post-solve feedback (no-giveaway rule).
 */

const COLORS = {
  beacon: 0x35e0d6, // hero cursor (cyan)
  target: 0xffd166, // goal ring (amber)
  vertex: 0x5aa9ff, // planted vertex (blue)
  edge: 0x8be0ff, // polygon outline (light cyan)
  fill: 0x2f6fb0, // polygon face fill
  measure: 0xff9f5a, // side being measured (orange)
  axis: 0xdce8ff,
  card: "rgba(10,20,40,0.92)",
};

// A "shape" task lists vertices in draw order plus the two sides the student
// will measure (a horizontal side and a vertical side). All vertices share a
// row or column with a neighbor so every side is axis-aligned — exactly the
// 6.G.A.3 case where lengths come from subtracting one coordinate.
//
// Level 1 = Quadrant I only, friendly rectangles/right shapes, hint ring shown.
// Level 2 = all four quadrants, so horizontal/vertical lengths require absolute
// value across the axes (e.g. |4 - (-3)| = 7).
function makeLevel(level) {
  if (level === 1) {
    return {
      grid: 10, // coords 0..5 used after centering
      minCoord: 0,
      maxCoord: 5,
      hints: true,
      shapes: [
        {
          name: "Rectangle",
          verts: [
            { x: 1, y: 1 },
            { x: 5, y: 1 },
            { x: 5, y: 4 },
            { x: 1, y: 4 },
          ],
        },
        {
          name: "Square",
          verts: [
            { x: 0, y: 0 },
            { x: 3, y: 0 },
            { x: 3, y: 3 },
            { x: 0, y: 3 },
          ],
        },
        {
          name: "L-shape",
          verts: [
            { x: 1, y: 1 },
            { x: 5, y: 1 },
            { x: 5, y: 2 },
            { x: 3, y: 2 },
            { x: 3, y: 5 },
            { x: 1, y: 5 },
          ],
        },
      ],
    };
  }
  return {
    grid: 12,
    minCoord: -6,
    maxCoord: 6,
    hints: false,
    shapes: [
      {
        name: "Rectangle across the axes",
        verts: [
          { x: -4, y: -3 },
          { x: 3, y: -3 },
          { x: 3, y: 2 },
          { x: -4, y: 2 },
        ],
      },
      {
        name: "Banner rectangle",
        verts: [
          { x: -5, y: 4 },
          { x: 4, y: 4 },
          { x: 4, y: -2 },
          { x: -5, y: -2 },
        ],
      },
      {
        name: "Plus-block",
        verts: [
          { x: -1, y: -5 },
          { x: 2, y: -5 },
          { x: 2, y: -1 },
          { x: 5, y: -1 },
          { x: 5, y: 2 },
          { x: 2, y: 2 },
          { x: 2, y: 5 },
          { x: -1, y: 5 },
          { x: -1, y: 2 },
          { x: -4, y: 2 },
          { x: -4, y: -1 },
          { x: -1, y: -1 },
        ],
      },
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

// Length of an axis-aligned side: subtract the coordinate that changes and
// take the absolute value. Returns { len, horizontal }.
function sideInfo(a, b) {
  if (a.y === b.y) return { len: Math.abs(b.x - a.x), horizontal: true };
  return { len: Math.abs(b.y - a.y), horizontal: false };
}

// Perimeter = sum of all side lengths around the polygon (closes back to v0).
function perimeterOf(verts) {
  let p = 0;
  for (let k = 0; k < verts.length; k++) {
    const a = verts[k];
    const b = verts[(k + 1) % verts.length];
    p += sideInfo(a, b).len;
  }
  return p;
}

// Build the worked phases for one shape: plant every vertex, measure one
// horizontal + one vertical side, then confirm the perimeter.
function buildPhases(shape) {
  const verts = shape.verts;
  const phases = [];
  // 1) plant each vertex in order
  verts.forEach((v, idx) => {
    phases.push({ kind: "plant", x: v.x, y: v.y, idx });
  });
  // 2) find a horizontal side and a vertical side to measure
  let hSide = null;
  let vSide = null;
  for (let k = 0; k < verts.length; k++) {
    const a = verts[k];
    const b = verts[(k + 1) % verts.length];
    const info = sideInfo(a, b);
    if (info.horizontal && !hSide) hSide = { a, b, ...info };
    else if (!info.horizontal && !vSide) vSide = { a, b, ...info };
  }
  if (hSide) phases.push({ kind: "measure", side: hSide });
  if (vSide) phases.push({ kind: "measure", side: vSide });
  // 3) confirm the perimeter by stepping the beacon onto a perimeter pad
  phases.push({ kind: "perimeter", value: perimeterOf(verts) });
  return phases;
}

export default {
  id: "coordinate-polygon-blueprint",
  vocab: [
    {
      term: "Polygon",
      definition:
        "A closed flat shape with straight sides, like a rectangle or an L-shape.",
      emoji: "📐",
    },
    {
      term: "Vertex",
      definition:
        "A corner of a polygon where two sides meet. Each corner is named by an ordered pair (x, y).",
      emoji: "📍",
    },
    {
      term: "Ordered pair",
      definition:
        "Two numbers (x, y) that name one point. The x comes first (across), then the y (up or down).",
      emoji: "🔢",
    },
    {
      term: "Side length",
      definition:
        "How long a side is. For a flat or upright side, subtract the coordinate that changes and take the absolute value.",
      emoji: "📏",
    },
    {
      term: "Perimeter",
      definition:
        "The distance all the way around a polygon. Add up the lengths of every side.",
      emoji: "🧮",
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

    const clarityMount = renderer.domElement.parentElement || document.body;
    let clarity = null;

    const cfg = makeLevel(level);
    const N = cfg.grid;
    const HALF = N / 2; // vertex index of the origin

    const grid = createGrid(ctx, { n: N, cell: 1 });

    // +y must read "up and away" from the camera (standard coordinate-plane
    // orientation). The grid's +Z runs toward the camera, so invert y→j: larger
    // y maps to a smaller j (further into the screen). All consumers (vertices,
    // edges, fill, labels, pointer picking) route through these two helpers, so
    // the flip stays globally consistent.
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
    const shapeMarkers = []; // cleared between shapes
    const unbinders = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    // ---- Stage platform ----
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

    // ---- Axis emphasis ----
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

    // ---- Origin marker ----
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
        const lx = makeLabel(String(c), { scale: 0.9, fontSize: 80 });
        const wx = coordToWorld(c, 0);
        lx.position.set(wx.x, 0.55, wx.z + 0.5);
        grid.group.add(lx);
        labels.push(lx);
        const ly = makeLabel(String(c), { scale: 0.9, fontSize: 80 });
        const wy = coordToWorld(0, c);
        ly.position.set(wy.x - 0.5, 0.55, wy.z);
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

    // ---- Floating 3D problem card ----
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

    // ---- Beacon ----
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

    // ---- Target ring (next vertex / measure endpoint hint) ----
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

    function placeVertexDot(x, y, color) {
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
      shapeMarkers.push(m);
      return m;
    }

    function addPointLabel(x, y, color, text) {
      const lbl = makeLabel(text || `(${x}, ${y})`, {
        scale: 0.9,
        fontSize: 80,
        color,
      });
      const w = coordToWorld(x, y);
      lbl.position.set(w.x, 1.0, w.z);
      scene.add(lbl);
      shapeMarkers.push(lbl);
      return lbl;
    }

    // Draw one polygon edge as a glowing line between two grid points.
    function drawEdge(a, b, color) {
      const wa = coordToWorld(a.x, a.y);
      const wb = coordToWorld(b.x, b.y);
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(wa.x, 0.14, wa.z),
        new THREE.Vector3(wb.x, 0.14, wb.z),
      ]);
      const m = new THREE.LineBasicMaterial({
        color,
        linewidth: 2,
      });
      const line = new THREE.Line(g, m);
      scene.add(line);
      shapeMarkers.push(line);
      return line;
    }

    // Fill the polygon face once it is closed (triangulated fan via ShapeGeom).
    function fillPolygon(verts, color) {
      const shp = new THREE.Shape();
      verts.forEach((v, idx) => {
        const w = coordToWorld(v.x, v.y);
        if (idx === 0) shp.moveTo(w.x, w.z);
        else shp.lineTo(w.x, w.z);
      });
      shp.closePath();
      const geo = new THREE.ShapeGeometry(shp);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.18,
        transparent: true,
        opacity: 0.4,
        roughness: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      // ShapeGeometry is built in the XY plane; rotate it flat onto XZ.
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.08;
      scene.add(mesh);
      shapeMarkers.push(mesh);
      return mesh;
    }

    // ---- Round state ----
    let shapeIndex = 0;
    let shape = null;
    let phases = [];
    let phaseIndex = 0;
    let phase = null;
    let placedVerts = []; // vertices planted so far this shape
    let solved = false;
    let streak = 0;
    let bestStreak = 0;
    let solvedShapes = 0;
    const totalShapes = cfg.shapes.length;

    const START_LIVES = level === 2 ? 4 : 6;
    let lives = START_LIVES;
    let gameOver = false;
    const cursor = { x: 0, y: 0 };

    function clearShape() {
      while (shapeMarkers.length) {
        const m = shapeMarkers.pop();
        scene.remove(m);
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          if (m.material.map) m.material.map.dispose();
          m.material.dispose();
        }
      }
      placedVerts = [];
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
            beacon.position.set(sx + (w.x - sx) * t, 0.45, sz + (w.z - sz) * t);
          },
        });
      } else {
        beacon.position.set(w.x, 0.45, w.z);
      }
      updateHud();
    }

    function objectiveText() {
      if (!phase) return "";
      if (phase.kind === "plant") {
        // Level 1 (hints) scaffolds with the literal target pair. Level 2 hides
        // it — naming the vertex generically so students read it off the
        // blueprint instead of being handed the coordinates.
        if (cfg.hints) {
          return `Plant vertex ${phase.idx + 1} of ${shape.verts.length} at (${phase.x}, ${phase.y}). Then place it.`;
        }
        return `Plant vertex ${phase.idx + 1} of ${shape.verts.length} from the blueprint, then place it.`;
      }
      if (phase.kind === "measure") {
        const s = phase.side;
        const word = s.horizontal ? "flat (horizontal)" : "upright (vertical)";
        return `Measure the ${word} side from (${s.a.x}, ${s.a.y}) to (${s.b.x}, ${s.b.y}). Move the beacon to (${s.b.x}, ${s.b.y}) and place it.`;
      }
      if (phase.kind === "perimeter") {
        return `Add up every side. Move the beacon onto the gold PERIMETER pad and place it to confirm.`;
      }
      return "";
    }

    function updateHud() {
      const obj = `${objectiveText()}   Beacon at (${cursor.x}, ${cursor.y})`;
      hud.setObjective(obj);
      setCard(`${objectiveText()}\nBeacon: (${cursor.x}, ${cursor.y})`);
      if (clarity) clarity.setObjective(obj);
    }

    function targetChipText() {
      if (!phase) return null;
      if (phase.kind === "plant")
        // Match objectiveText: keep the literal pair only in Level 1 (scaffold).
        return cfg.hints
          ? `Plant vertex ${phase.idx + 1} → (${phase.x}, ${phase.y})`
          : `Plant vertex ${phase.idx + 1} from the blueprint`;
      if (phase.kind === "measure") {
        const s = phase.side;
        return `Measure side to (${s.b.x}, ${s.b.y})`;
      }
      if (phase.kind === "perimeter") return "Confirm the perimeter";
      return null;
    }

    // Gold "perimeter pad" gives the student a clear spot to step onto to
    // confirm the perimeter. It must NEVER fuse with the shape, so we search for
    // an in-range lattice point that is not a vertex and not on any polygon
    // edge. We prefer points just above the top edge near the centroid, then
    // scan outward, and finally fall back to a guaranteed-empty grid corner.
    function onShape(x, y) {
      const vs = shape.verts;
      for (let i = 0; i < vs.length; i++) {
        const a = vs[i];
        const b = vs[(i + 1) % vs.length];
        if (a.x === x && a.y === y) return true; // a vertex
        // Only axis-aligned edges occur in these blueprints. Check collinear +
        // between the endpoints for both orientations.
        if (a.x === b.x && x === a.x) {
          if (y >= Math.min(a.y, b.y) && y <= Math.max(a.y, b.y)) return true;
        } else if (a.y === b.y && y === a.y) {
          if (x >= Math.min(a.x, b.x) && x <= Math.max(a.x, b.x)) return true;
        }
      }
      return false;
    }
    function perimeterPadCoord() {
      const xs = shape.verts.map((v) => v.x);
      const ys = shape.verts.map((v) => v.y);
      const cx = Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
      const topY = Math.max(...ys);
      // Preferred candidates first: directly above the top edge near centroid.
      const preferred = [
        { x: cx, y: topY + 1 },
        { x: cx, y: topY + 2 },
      ];
      for (const p of preferred) {
        if (inRange(p.x, p.y) && !onShape(p.x, p.y)) return p;
      }
      // Otherwise scan the whole grid for the first free off-shape point.
      for (let y = cfg.maxCoord; y >= cfg.minCoord; y--) {
        for (let x = cfg.minCoord; x <= cfg.maxCoord; x++) {
          if (!onShape(x, y)) return { x, y };
        }
      }
      // Last resort: a grid corner (shapes never reach the extreme corner).
      return { x: cfg.minCoord, y: cfg.minCoord };
    }
    let pad = null;

    function startPhase() {
      solved = false;
      phase = phases[phaseIndex];
      targetRing.visible = false;
      hud.setProgress(phaseIndex, phases.length);
      if (clarity) clarity.setTarget(targetChipText());

      if (phase.kind === "plant") {
        // Start the beacon at the origin for plotting from scratch.
        setCursor(0, 0);
        if (cfg.hints) {
          targetRing.visible = true;
          const w = coordToWorld(phase.x, phase.y);
          targetRing.position.set(w.x, 0.1, w.z);
        }
        announce(
          `Plant vertex ${phase.idx + 1} at ${phase.x}, ${phase.y}. Go ${phase.x} on x, then ${phase.y} on y. Then place it.`,
        );
      } else if (phase.kind === "measure") {
        const s = phase.side;
        // Beacon begins at the side's start so the student steps along it.
        setCursor(s.a.x, s.a.y);
        targetRing.visible = true;
        const w = coordToWorld(s.b.x, s.b.y);
        targetRing.position.set(w.x, 0.1, w.z);
        const word = s.horizontal ? "flat" : "upright";
        announce(
          `Measure the ${word} side. Step the beacon from ${s.a.x}, ${s.a.y} to ${s.b.x}, ${s.b.y}. Count the steps. Then place it.`,
        );
      } else if (phase.kind === "perimeter") {
        pad = perimeterPadCoord();
        setCursor(0, 0);
        targetRing.visible = true;
        const w = coordToWorld(pad.x, pad.y);
        targetRing.position.set(w.x, 0.1, w.z);
        const lbl = makeLabel("PERIMETER", {
          scale: 0.85,
          fontSize: 72,
          color: "#ffd166",
        });
        lbl.position.set(w.x, 0.7, w.z);
        scene.add(lbl);
        shapeMarkers.push(lbl);
        announce(
          `Add up every side of the polygon. Then move onto the gold perimeter pad and place the beacon to confirm.`,
        );
      }

      feel.sfx("select", `Step ${phaseIndex + 1} of ${phases.length}.`);
      caption(objectiveText());
      updateHud();
    }

    function win(points, msg, sayit) {
      solved = true;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      hud.setStreak(streak);
      onScore(points, { shape: shapeIndex + 1, phase: phase.kind });
      const burstPos = { x: beacon.position.x, y: 0.8, z: beacon.position.z };
      feel.burst(burstPos, { color: COLORS.target, count: 26, spread: 3 });
      feel.shake(0.22, 0.28);
      feel.sfx("correct", sayit);
      hud.feedback(true, `${msg} +${points}`, { duration: 2600 });
      feel.tween({
        from: 1,
        to: 1.5,
        duration: 0.18,
        onUpdate: (v) => beacon.scale.set(v, v, v),
        onComplete: () => beacon.scale.set(1, 1, 1),
      });

      later(() => {
        if (phaseIndex < phases.length - 1) {
          phaseIndex += 1;
          startPhase();
        } else {
          // finished this shape
          solvedShapes += 1;
          if (shapeIndex < totalShapes - 1) {
            shapeIndex += 1;
            clearShape();
            startShape();
          } else {
            finish();
          }
        }
      }, 2600);
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
      const msg = `Out of tries! You finished ${solvedShapes} of ${totalShapes} blueprints.`;
      hud.setObjective(msg);
      announce(`Game over. ${msg} Press Play Again to retry.`);
      if (clarity) {
        clarity.setTarget(null);
        clarity.lose({
          titleEn: "Out of tries!",
          badge: "📐",
          stats: `${msg} Tip: read x (across) before y (up/down). For a side length, subtract the coordinate that changes and take its absolute value.`,
        });
      }
    }

    function finish() {
      hud.setProgress(phases.length, phases.length);
      hud.setObjective(
        `Done! You built ${solvedShapes} of ${totalShapes} blueprints. Best streak: ${bestStreak}.`,
      );
      setCard(
        `Blueprints complete!\n${solvedShapes}/${totalShapes} shapes • streak ${bestStreak}`,
      );
      hud.message("All blueprints complete!", { tone: "ok", duration: 0 });
      feel.sfx(
        "fanfare",
        `All blueprints complete. You built ${solvedShapes} with a best streak of ${bestStreak}. Great work, architect.`,
      );
      const wo = coordToWorld(0, 0);
      feel.burst(
        { x: wo.x, y: 3, z: wo.z },
        { color: COLORS.beacon, count: 60, spread: 6, life: 1.4 },
      );
      feel.shake(0.32, 0.5);
      if (clarity) {
        clarity.setTarget(null);
        clarity.win({
          titleEn: "Blueprints complete!",
          badge: "📐",
          stats: `You drew and measured ${solvedShapes} of ${totalShapes} polygons. Best streak: ${bestStreak}. Score saved.`,
        });
      }
    }

    // Light up the polygon outline + fill once the last vertex lands.
    function closePolygon() {
      const v = shape.verts;
      for (let k = 0; k < v.length; k++) {
        drawEdge(v[k], v[(k + 1) % v.length], COLORS.edge);
      }
      fillPolygon(v, COLORS.fill);
      feel.burst(
        { x: beacon.position.x, y: 0.8, z: beacon.position.z },
        { color: COLORS.edge, count: 34, spread: 4 },
      );
    }

    function attempt() {
      if (solved || !phase || gameOver) return;

      if (phase.kind === "plant") {
        if (cursor.x === phase.x && cursor.y === phase.y) {
          placeVertexDot(phase.x, phase.y, COLORS.vertex);
          addPointLabel(phase.x, phase.y, "#9fc4f0");
          placedVerts.push({ x: phase.x, y: phase.y });
          // draw the edge from the previous vertex as we go (visible building)
          if (placedVerts.length >= 2) {
            const a = placedVerts[placedVerts.length - 2];
            const b = placedVerts[placedVerts.length - 1];
            drawEdge(a, b, COLORS.edge);
          }
          const isLast = phase.idx === shape.verts.length - 1;
          if (isLast) {
            closePolygon();
            win(
              25,
              `${shape.name} drawn! All ${shape.verts.length} vertices placed.`,
              `Great. You drew the ${shape.name} by plotting every vertex in order. Now measure its sides.`,
            );
          } else {
            win(
              15,
              `Vertex ${phase.idx + 1} planted at (${phase.x}, ${phase.y}) in ${quadrantName(phase.x, phase.y)}.`,
              `Correct. Vertex ${phase.idx + 1} is the ordered pair ${phase.x}, ${phase.y}.`,
            );
          }
        } else {
          reject(
            `Not there yet. Go to (${phase.x}, ${phase.y}). You are at (${cursor.x}, ${cursor.y}).`,
          );
        }
        return;
      }

      if (phase.kind === "measure") {
        const s = phase.side;
        if (cursor.x === s.b.x && cursor.y === s.b.y) {
          // highlight the measured side in orange + label its length
          drawEdge(s.a, s.b, COLORS.measure);
          const mx = (s.a.x + s.b.x) / 2;
          const my = (s.a.y + s.b.y) / 2;
          const lbl = makeLabel(`length = ${s.len}`, {
            scale: 0.9,
            fontSize: 80,
            color: "#f0c08a",
          });
          const w = coordToWorld(mx, my);
          lbl.position.set(w.x, 1.1, w.z);
          scene.add(lbl);
          shapeMarkers.push(lbl);
          const expr = s.horizontal
            ? `|${s.b.x} − (${s.a.x})| = ${s.len}`
            : `|${s.b.y} − (${s.a.y})| = ${s.len}`;
          win(
            20,
            `Side length = ${s.len}.  ${expr}`,
            `The two points share a ${s.horizontal ? "row" : "column"}, so the side length is the absolute value of the difference: ${s.len} units.`,
          );
        } else {
          reject(
            `Keep stepping to (${s.b.x}, ${s.b.y}). You are at (${cursor.x}, ${cursor.y}).`,
          );
        }
        return;
      }

      if (phase.kind === "perimeter") {
        if (pad && cursor.x === pad.x && cursor.y === pad.y) {
          // build a readable sum like 4 + 3 + 4 + 3 = 14
          const v = shape.verts;
          const parts = [];
          for (let k = 0; k < v.length; k++) {
            parts.push(sideInfo(v[k], v[(k + 1) % v.length]).len);
          }
          const sumExpr = `${parts.join(" + ")} = ${phase.value}`;
          win(
            30,
            `Perimeter = ${phase.value} units.`,
            `Right. Adding every side gives the perimeter: ${sumExpr}.`,
          );
          // show the sum on the card briefly via feedback already; also label it
          const lbl = makeLabel(`perimeter = ${phase.value}`, {
            scale: 0.95,
            fontSize: 80,
            color: "#ffd166",
          });
          const wo = coordToWorld(0, 0);
          lbl.position.set(wo.x, 1.3, wo.z);
          scene.add(lbl);
          shapeMarkers.push(lbl);
        } else {
          reject(
            `Move onto the gold perimeter pad at (${pad.x}, ${pad.y}) to confirm. You are at (${cursor.x}, ${cursor.y}).`,
          );
        }
        return;
      }
    }

    function startShape() {
      shape = cfg.shapes[shapeIndex];
      phases = buildPhases(shape);
      phaseIndex = 0;
      placedVerts = [];
      startPhase();
    }

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

        function beginGameplay() {
          shapeIndex = 0;
          lives = START_LIVES;
          gameOver = false;
          if (typeof hud.setLives === "function") hud.setLives(lives);
          startShape();

          unbinders.push(
            input.onPress((name) => {
              if (name === "up") move(0, 1);
              else if (name === "down") move(0, -1);
              else if (name === "left") move(-1, 0);
              else if (name === "right") move(1, 0);
              else if (name === "action" || name === "confirm") attempt();
            }),
          );

          unbinders.push(
            input.onTap(() => {
              if (solved) return;
              const c = pointerToCoord();
              if (!c) return;
              setCursor(c.x, c.y, true);
              feel.sfx("pop");
              announce(`Beacon at ${c.x}, ${c.y}.`);
              attempt();
            }),
          );
        }

        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "Coordinate Polygon — Blueprint Builder",
          objectiveEn:
            "Pilot the beacon to plant each vertex at its ordered pair, draw the polygon, then measure its side lengths and perimeter.",
          objectiveEs:
            "Mueve la baliza para ubicar cada vértice en su par ordenado, dibujar el polígono y medir sus lados y perímetro.",
          standard:
            "6.G.A.3 — Polygons in the coordinate plane: draw from vertices, find side lengths",
          controls: [
            {
              key: "← / → (or A / D)",
              actionEn: "Move the beacon left or right — changes the x value",
              actionEs: "Mueve la baliza izquierda o derecha — cambia la x",
            },
            {
              key: "↑ / ↓ (or W / S)",
              actionEn: "Move the beacon up or down — changes the y value",
              actionEs: "Mueve la baliza arriba o abajo — cambia la y",
            },
            {
              key: "● / Space / Enter",
              actionEn:
                "Place the beacon to plant a vertex or check a measurement (the ● button too)",
              actionEs:
                "Coloca la baliza para ubicar un vértice o revisar (botón ●)",
            },
            {
              key: "Tap / Click",
              actionEn: "Tap a grid spot to jump the beacon there and place it",
              actionEs: "Toca un punto de la cuadrícula para saltar y colocar",
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
            "Plant every vertex at its (x, y) to draw the polygon. Then measure a flat side and an upright side by stepping the beacon along it — the length is the absolute value of the difference. Finally, add the sides and step onto the gold pad to confirm the perimeter. Finish every blueprint to win!",
          howToWinEs:
            "Ubica cada vértice en su (x, y) para dibujar el polígono. Mide un lado plano y uno vertical, luego suma los lados y confirma el perímetro. Completa todos los planos para ganar.",
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
        clearShape();
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
        grid.dispose();
      },
    };
  },
};
