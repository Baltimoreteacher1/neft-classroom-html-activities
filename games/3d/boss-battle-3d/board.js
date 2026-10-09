/**
 * Boss Battle 3D — the holographic coordinate board the boss hides behind on
 * aim rounds (number line or four-quadrant grid, -10..10). The bolt flies to
 * the point the player typed, so a coordinate is literally where you shoot.
 */
import { makeLabel } from "/games/engine3d/label3d.js";

export const BOARD = { z: 2.6, cx: 0, cy: 2.0, unit: 0.24, half: 10 };

/** World position of grid point (x, y). */
export function boardPoint(THREE, x, y) {
  const cx = Math.max(-BOARD.half - 0.6, Math.min(BOARD.half + 0.6, x));
  const cy = Math.max(-BOARD.half - 0.6, Math.min(BOARD.half + 0.6, y));
  return new THREE.Vector3(BOARD.cx + cx * BOARD.unit, BOARD.cy + cy * BOARD.unit, BOARD.z);
}

export function createBoard(THREE, scene) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  const span = BOARD.half * BOARD.unit;

  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(span * 2 + 0.3, span * 2 + 0.3),
    new THREE.MeshBasicMaterial({
      color: 0x0b2440,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  );
  plate.position.set(BOARD.cx, BOARD.cy, BOARD.z - 0.02);
  group.add(plate);

  function lines(color, opacity, segs) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(segs, 3));
    const l = new THREE.LineSegments(
      g,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
    );
    group.add(l);
    return l;
  }
  const grid = [];
  for (let i = -BOARD.half; i <= BOARD.half; i++) {
    if (i === 0) continue;
    const a = boardPoint(THREE, i, -BOARD.half);
    const b = boardPoint(THREE, i, BOARD.half);
    const c = boardPoint(THREE, -BOARD.half, i);
    const d = boardPoint(THREE, BOARD.half, i);
    grid.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z);
  }
  const gridLines = lines(0x5fa8d3, 0.35, grid);
  const xa = boardPoint(THREE, -BOARD.half, 0);
  const xb = boardPoint(THREE, BOARD.half, 0);
  const ya = boardPoint(THREE, 0, -BOARD.half);
  const yb = boardPoint(THREE, 0, BOARD.half);
  lines(0xffffff, 0.95, [xa.x, xa.y, xa.z, xb.x, xb.y, xb.z]);
  const yAxis = lines(0xffffff, 0.95, [ya.x, ya.y, ya.z, yb.x, yb.y, yb.z]);

  // Tick marks every unit on the x-axis (number-line mode needs them visible).
  const ticks = [];
  for (let i = -BOARD.half; i <= BOARD.half; i++) {
    const p = boardPoint(THREE, i, 0);
    const t = i % 5 === 0 ? 0.09 : 0.05;
    ticks.push(p.x, p.y - t, p.z, p.x, p.y + t, p.z);
  }
  lines(0xffffff, 0.9, ticks);

  const labels = [];
  const yLabels = [];
  for (const v of [-10, -5, 0, 5, 10]) {
    const lx = makeLabel(String(v), { scale: 0.22, background: "rgba(11,22,40,0.75)" });
    lx.position.copy(boardPoint(THREE, v, -1.3));
    group.add(lx);
    labels.push(lx);
    if (v !== 0) {
      const ly = makeLabel(String(v), { scale: 0.22, background: "rgba(11,22,40,0.75)" });
      ly.position.copy(boardPoint(THREE, -1.4, v));
      group.add(ly);
      yLabels.push(ly);
    }
  }
  const xName = makeLabel("x", { scale: 0.26 });
  xName.position.copy(boardPoint(THREE, BOARD.half + 1.2, 0));
  const yName = makeLabel("y", { scale: 0.26 });
  yName.position.copy(boardPoint(THREE, 0, BOARD.half + 1.2));
  group.add(xName, yName);

  // The given point (the boss's shadow) on grid rounds.
  const shadow = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xc77dff, emissive: 0xc77dff, emissiveIntensity: 1.4 }),
  );
  shadow.visible = false;
  group.add(shadow);

  // Where the last bolt landed.
  const mark = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.03, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0xffe48a, emissive: 0xffb347, emissiveIntensity: 1.6 }),
  );
  mark.visible = false;
  group.add(mark);

  return {
    group,
    /** mode "line" (x only) or "grid" (both axes). */
    show(mode, shadowXY) {
      group.visible = true;
      const gridMode = mode === "grid";
      gridLines.visible = gridMode;
      yAxis.visible = gridMode;
      yName.visible = gridMode;
      for (const l of yLabels) l.visible = gridMode;
      shadow.visible = !!shadowXY;
      if (shadowXY) shadow.position.copy(boardPoint(THREE, shadowXY[0], shadowXY[1]));
      mark.visible = false;
    },
    hide() {
      group.visible = false;
    },
    markAt(pos) {
      mark.position.copy(pos);
      mark.visible = true;
    },
  };
}
