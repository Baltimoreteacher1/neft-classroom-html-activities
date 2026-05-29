const COLORS = {
  grid: 0x18466f,
  gridLine: 0x2f6aa0,
  target: 0xf2c15b,
  cursor: 0x1fa6a2,
  piece: [0x1fa6a2, 0x4f8fd0, 0xe09b4a, 0x8b6fc4, 0x4aa978, 0xd9795d],
  ghostOk: 0x1fa6a2,
  ghostBad: 0xb64e2f,
};

const CELL = 1;

function makeLevel(level) {
  if (level === 1) {
    return {
      grid: 6,
      rounds: [
        { kind: "rect", parts: [{ x: 1, y: 1, w: 4, h: 3 }] },
        { kind: "rect", parts: [{ x: 0, y: 1, w: 5, h: 4 }] },
        { kind: "rect", parts: [{ x: 0, y: 1, w: 6, h: 4 }] },
      ],
      hints: true,
      labelPieces: true,
      allowTriangle: false,
    };
  }
  return {
    grid: 8,
    rounds: [
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
      // Right triangle: right-angle at corner (cx,cy); legs run +w and +h.
      { kind: "triangle", cx: 1, cy: 1, w: 6, h: 4 },
    ],
    hints: false,
    labelPieces: false,
    allowTriangle: true,
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
    const N = cfg.grid;
    const half = (N * CELL) / 2;

    // Cell (col,row) center on the XZ plane.
    const cellCenter = (col, row) => ({
      x: -half + (col + 0.5) * CELL,
      z: -half + (row + 0.5) * CELL,
    });
    // Grid-line vertex (vx,vy) -> world point (corners of cells, 0..N).
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

    // ---- Static scene ----
    const group = new THREE.Group();
    scene.add(group);

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(N * CELL, 0.4, N * CELL),
      new THREE.MeshStandardMaterial({ color: COLORS.grid, roughness: 0.95 }),
    );
    floor.position.y = -0.2;
    group.add(floor);

    const gridHelper = new THREE.GridHelper(
      N * CELL,
      N,
      COLORS.gridLine,
      COLORS.gridLine,
    );
    gridHelper.position.y = 0.01;
    gridHelper.material.opacity = 0.55;
    gridHelper.material.transparent = true;
    group.add(gridHelper);

    const pickPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(N * CELL, N * CELL),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    pickPlane.rotation.x = -Math.PI / 2;
    group.add(pickPlane);

    const tileGeo = new THREE.BoxGeometry(CELL * 0.96, 0.5, CELL * 0.96);
    const disposables = [tileGeo];

    // ---- Target outline ----
    const targetGroup = new THREE.Group();
    group.add(targetGroup);
    const targetMat = new THREE.MeshStandardMaterial({
      color: COLORS.target,
      transparent: true,
      opacity: 0.3,
      emissive: COLORS.target,
      emissiveIntensity: 0.25,
    });

    // ---- Cursor + ghost ----
    const cursor = { col: 0, row: 0 }; // cell index for rect mode, also drives vertex
    let anchor = null; // {col,row}

    const cursorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(CELL, 0.06, CELL),
      new THREE.MeshStandardMaterial({
        color: COLORS.cursor,
        transparent: true,
        opacity: 0.85,
      }),
    );
    cursorMesh.position.y = 0.05;
    group.add(cursorMesh);

    const ghostMat = new THREE.MeshStandardMaterial({
      color: COLORS.ghostOk,
      transparent: true,
      opacity: 0.4,
    });
    let ghostMesh = null; // rebuilt per shape

    // ---- Round state ----
    const placed = [];
    let covered = new Set();
    let target = new Set();
    let round = null;
    let targetArea = 0;
    let roundIndex = 0;
    let triangleMode = false;
    let solved = false;
    let triPlaced = false; // triangle round: has a correct triangle been placed
    let streak = 0; // consecutive correct placements
    let bestStreak = 0;
    let solvedCount = 0;
    let unbindFrame = null;
    const timers = [];

    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    // ---- Floating area label ----
    function makeLabel(text) {
      const cv = document.createElement("canvas");
      cv.width = 160;
      cv.height = 72;
      const c = cv.getContext("2d");
      c.fillStyle = "rgba(18,53,91,0.92)";
      roundRect(c, 4, 4, 152, 64, 14);
      c.fill();
      c.fillStyle = "#ffffff";
      c.font = "bold 30px system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, 80, 38);
      const tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearFilter;
      const spr = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthTest: false,
        }),
      );
      spr.scale.set(1.5, 0.68, 1);
      return spr;
    }
    function roundRect(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    function disposeMesh(m) {
      m.traverse((o) => {
        if (o.geometry && o.geometry !== tileGeo) o.geometry.dispose();
        if (o.material) {
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
          p.label.material.map.dispose();
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
      if (r.kind === "triangle") return "a right triangle";
      return "the shape";
    }

    // Right-triangle vertices (grid-line coords) for the triangle round.
    function triVertices(r) {
      return [
        { vx: r.cx, vy: r.cy }, // right-angle corner
        { vx: r.cx + r.w, vy: r.cy },
        { vx: r.cx, vy: r.cy + r.h },
      ];
    }

    function buildTriangleShapeMesh(verts, color, opacity) {
      // Flat extruded triangle on the XZ plane.
      const shape = new THREE.Shape();
      verts.forEach((v, i) => {
        const w = vertexWorld(v.vx, v.vy);
        if (i === 0) shape.moveTo(w.x, w.z);
        else shape.lineTo(w.x, w.z);
      });
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.5,
        bevelEnabled: false,
      });
      geo.rotateX(Math.PI / 2); // lay flat, extrude up
      const mat = new THREE.MeshStandardMaterial({
        color,
        transparent: opacity < 1,
        opacity,
        roughness: 0.6,
        emissive: color,
        emissiveIntensity: opacity < 1 ? 0.2 : 0,
      });
      return new THREE.Mesh(geo, mat);
    }

    function startRound() {
      clearRound();
      round = cfg.rounds[roundIndex];
      triangleMode = round.kind === "triangle";

      // Persistent "Step X of Y" for the whole round (both levels have 3 rounds).
      if (typeof hud.setProgress === "function")
        hud.setProgress(roundIndex, cfg.rounds.length);

      if (round.kind === "triangle") {
        targetArea = (round.w * round.h) / 2;
        const verts = triVertices(round);
        const t = buildTriangleShapeMesh(verts, COLORS.target, 0.3);
        t.position.y = 0.02;
        t.scale.y = 0.12;
        targetGroup.add(t);
        // Cursor starts at the corner.
        cursor.col = round.cx;
        cursor.row = round.cy;
      } else {
        target = targetCells(round);
        targetArea = target.size;
        target.forEach((key) => {
          const [col, row] = key.split(",").map(Number);
          const m = new THREE.Mesh(tileGeo, targetMat);
          const cc = cellCenter(col, row);
          m.position.set(cc.x, 0.02, cc.z);
          m.scale.y = 0.12;
          targetGroup.add(m);
        });
        const first = [...target][0].split(",").map(Number);
        cursor.col = first[0];
        cursor.row = first[1];
      }

      const tri = cfg.allowTriangle
        ? " Press Enter (or the side button) to toggle triangle pieces."
        : "";
      announce(
        `Round ${roundIndex + 1}. Build ${describeRound(round)} with area ${targetArea} square units.${tri}`,
      );
      updateLive();
      refreshGhost();
      if (cfg.hints) {
        hud.message("Move the cursor, then place a corner.", {
          tone: "info",
          duration: 2600,
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
      hud.setObjective(
        `Cover ${describeRound(round)} (area ${targetArea} sq units) by placing pieces. ` +
          `Covered ${area} of ${targetArea} — ` +
          (anchor ? "set the far corner." : "place a corner."),
      );
    }

    // ---- Rectangle helpers (cell-based) ----
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

    // ---- Triangle helpers (vertex-based, right triangle at corner) ----
    function triFromAnchorCursor() {
      // anchor = right-angle corner vertex; cursor cell -> opposite vertex.
      const a = anchor;
      const cv = { vx: cursor.col, vy: cursor.row }; // reuse cursor as a vertex index
      const w = Math.abs(cv.vx - a.vx);
      const h = Math.abs(cv.vy - a.vy);
      return { a, cv, w, h, area: (w * h) / 2 };
    }

    function refreshGhost() {
      // Cursor marker.
      if (triangleMode) {
        const w = vertexWorld(cursor.col, cursor.row);
        cursorMesh.position.set(w.x, 0.05, w.z);
      } else {
        const cc = cellCenter(cursor.col, cursor.row);
        cursorMesh.position.set(cc.x, 0.05, cc.z);
      }

      if (ghostMesh) {
        group.remove(ghostMesh);
        if (ghostMesh.geometry) ghostMesh.geometry.dispose();
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
        const ok = triangleMatchesTarget(verts, ti);
        ghostMesh = buildTriangleShapeMesh(
          verts,
          ok ? COLORS.ghostOk : COLORS.ghostBad,
          0.42,
        );
        ghostMesh.position.y = 0.28;
        group.add(ghostMesh);
      } else {
        const rc = rectFromCells(anchor, cursor);
        const ok = rectValid(rc);
        const center = cellCenter((rc.c0 + rc.c1) / 2, (rc.r0 + rc.r1) / 2);
        ghostMesh = new THREE.Mesh(
          new THREE.BoxGeometry(rc.w * CELL * 0.98, 0.5, rc.h * CELL * 0.98),
          ghostMat.clone(),
        );
        ghostMesh.material.color.setHex(ok ? COLORS.ghostOk : COLORS.ghostBad);
        ghostMesh.position.set(center.x, 0.28, center.z);
        group.add(ghostMesh);
      }
    }

    function triangleMatchesTarget(verts, ti) {
      if (round.kind !== "triangle") return false;
      const want = triVertices(round);
      // Compare unordered vertex sets.
      const key = (v) => v.vx + ":" + v.vy;
      const a = verts.map(key).sort().join("|");
      const b = want.map(key).sort().join("|");
      return a === b;
    }

    function pieceColor() {
      return COLORS.piece[placed.length % COLORS.piece.length];
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
        if (ti.w === 0 || ti.h === 0 || !triangleMatchesTarget(verts, ti)) {
          rejectPiece(
            "That triangle does not match the outline. Match both legs and the corner.",
          );
          return;
        }
        const mesh = buildTriangleShapeMesh(verts, pieceColor(), 1);
        mesh.position.y = 0.26;
        group.add(mesh);
        const entry = { mesh, area: ti.area };
        if (cfg.labelPieces) entry.label = attachTriLabel(verts, ti);
        placed.push(entry);
        triPlaced = true;
        announce(
          `Placed a triangle. ${ti.w} times ${ti.h} divided by 2 is ${ti.area} square units.`,
        );
        burstAt(vertexWorld(ti.a.vx, ti.a.vy));
        anchor = null;
        refreshGhost();
        updateLive();
        checkWin();
        return;
      }

      const rc = rectFromCells(anchor, cursor);
      if (!rectValid(rc)) {
        rejectPiece(
          "That piece spills outside or overlaps. Try a smaller piece.",
        );
        return;
      }
      const mesh = buildRectMesh(rc);
      group.add(mesh);
      rc.cells.forEach((k) => covered.add(k));
      const entry = { mesh, area: rc.w * rc.h };
      if (cfg.labelPieces) {
        const center = cellCenter((rc.c0 + rc.c1) / 2, (rc.r0 + rc.r1) / 2);
        const label = makeLabel(`${rc.w}×${rc.h}=${rc.w * rc.h}`);
        label.position.set(center.x, 1.1, center.z);
        group.add(label);
        entry.label = label;
      }
      placed.push(entry);
      announce(
        `Placed a piece. ${rc.w} times ${rc.h} is ${rc.w * rc.h} square units. Total area ${covered.size}.`,
      );
      burstAt(cellCenter(cursor.col, cursor.row));
      anchor = null;
      refreshGhost();
      updateLive();
      checkWin();
    }

    function attachTriLabel(verts, ti) {
      const cx = (verts[0].vx + verts[1].vx + verts[2].vx) / 3;
      const cy = (verts[0].vy + verts[1].vy + verts[2].vy) / 3;
      const w = vertexWorld(cx, cy);
      const label = makeLabel(`${ti.w}×${ti.h}÷2=${ti.area}`);
      label.position.set(w.x, 1.1, w.z);
      group.add(label);
      return label;
    }

    function buildRectMesh(rc) {
      const center = cellCenter((rc.c0 + rc.c1) / 2, (rc.r0 + rc.r1) / 2);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(rc.w * CELL * 0.98, 0.5, rc.h * CELL * 0.98),
        new THREE.MeshStandardMaterial({
          color: pieceColor(),
          roughness: 0.6,
          metalness: 0.05,
        }),
      );
      mesh.position.set(center.x, 0.28, center.z);
      return mesh;
    }

    function burstAt(p) {
      feel.burst(
        { x: p.x, y: 0.6, z: p.z },
        { color: pieceColor(), count: 16 },
      );
    }

    function rejectPiece(msg) {
      if (typeof hud.feedback === "function") hud.feedback(false, msg);
      else hud.message(msg, { tone: "warn", duration: 2000 });
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
        cfg.allowTriangle && round.kind !== "triangle" && placed.length <= 2
          ? 10
          : 0;
      const pts = base + levelBonus + fewBonus;
      onScore(pts, {
        round: roundIndex + 1,
        area: targetArea,
        pieces: placed.length,
        detail: round.kind,
      });
      feel.shake(0.32);
      feel.burst(
        { x: 0, y: 1.2, z: 0 },
        { color: COLORS.target, count: 40, spread: 5 },
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
          hud.setObjective(
            `All structures built — ${solvedCount} of ${cfg.rounds.length} shapes, best streak ${bestStreak}. Great work, Architect!`,
          );
          hud.message("All rounds complete!", { tone: "ok", duration: 0 });
          announce(
            `All rounds complete. You built ${solvedCount} shapes with a best streak of ${bestStreak}. Great work, Architect.`,
          );
        }
      }, 2600);
    }

    // ---- Input ----
    function maxIndex() {
      return triangleMode ? N : N - 1; // vertices go 0..N, cells 0..N-1
    }

    function moveCursor(dCol, dRow) {
      const lim = maxIndex();
      const nc = Math.max(0, Math.min(lim, cursor.col + dCol));
      const nr = Math.max(0, Math.min(lim, cursor.row + dRow));
      if (nc !== cursor.col || nr !== cursor.row) {
        cursor.col = nc;
        cursor.row = nr;
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
      if (solved) return;
      if (!anchor) {
        if (triangleMode) {
          // Anchor must be the right-angle corner vertex.
          if (cursor.col !== round.cx || cursor.row !== round.cy) {
            hud.message("Start at the square corner of the triangle.", {
              tone: "warn",
              duration: 1800,
            });
            feel.shake(0.12);
            return;
          }
          anchor = { vx: cursor.col, vy: cursor.row };
          announce("Corner set. Move to the opposite point, then place again.");
        } else {
          if (!target.has(cursor.col + "," + cursor.row)) {
            hud.message("Start your corner inside the outline.", {
              tone: "warn",
              duration: 1600,
            });
            feel.shake(0.12);
            return;
          }
          anchor = { col: cursor.col, row: cursor.row };
          announce(
            "First corner set. Move to the opposite corner, then place again.",
          );
        }
        updateLive();
        refreshGhost();
      } else {
        commit();
      }
    }

    function toggleTriangle() {
      // Only meaningful where the round mixes; here triangle rounds are fixed,
      // but Enter still cancels an in-progress anchor for keyboard users.
      if (anchor) {
        anchor = null;
        refreshGhost();
        updateLive();
        announce("Corner cleared.");
        return;
      }
      if (round.kind === "triangle") {
        caption("This round uses triangle pieces. Area = leg × leg ÷ 2.");
        announce(
          "This round uses triangle pieces. Area is one leg times the other leg divided by two.",
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

    return {
      start() {
        camera.position.set(0, N * 1.15, N * 1.15);
        camera.lookAt(0, 0, 0);
        feel.syncCamera();

        startRound();

        unbindPress = input.onPress((name) => {
          if (name === "up") moveCursor(0, -1);
          else if (name === "down") moveCursor(0, 1);
          else if (name === "left") moveCursor(-1, 0);
          else if (name === "right") moveCursor(1, 0);
          else if (name === "action") primaryAction();
          else if (name === "confirm") toggleTriangle();
        });

        unbindTap = input.onTap(() => {
          if (solved) return;
          const cell = pointerToTarget();
          if (!cell) return;
          cursor.col = cell.col;
          cursor.row = cell.row;
          refreshGhost();
          primaryAction();
        });

        if (!feel.reducedMotion) {
          unbindFrame = ctx.onFrame((dt, t) => {
            const s = 1 + Math.sin(t * 4) * 0.06;
            cursorMesh.scale.set(s, 1, s);
          });
        }
      },

      dispose() {
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        disposables.forEach((g) => g.dispose());
      },
    };
  },
};
