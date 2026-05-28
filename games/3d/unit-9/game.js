import { createGrid } from "/games/engine3d/grid.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";

const COLORS = {
  cursor: 0x1fa6a2,
  target: 0xf2c15b,
  plotted: 0x4f8fd0,
  reflection: 0x8b6fc4,
  distance: 0xe09b4a,
  ghostOk: 0x1fa6a2,
  ghostBad: 0xb64e2f,
};

// Level config. The grid is GRID x GRID cells; coordinates are centered so the
// origin (0,0) sits at the middle vertex. Coordinate value c maps to vertex
// index c + HALF.
function makeLevel(level) {
  if (level === 1) {
    return {
      grid: 10, // coords 0..10 on each axis after centering => we restrict to Q1
      minCoord: 0,
      maxCoord: 5,
      hints: true,
      showLabels: true,
      tasks: [
        { kind: "plot", x: 3, y: 2 },
        { kind: "plot", x: 0, y: 4 }, // on the y-axis
        { kind: "plot", x: 5, y: 0 }, // on the x-axis
        { kind: "identify", x: 2, y: 5 },
        { kind: "plot", x: 4, y: 3 },
      ],
    };
  }
  return {
    grid: 12,
    minCoord: -6,
    maxCoord: 6,
    hints: false,
    showLabels: false,
    tasks: [
      { kind: "plot", x: -4, y: 3 },
      { kind: "plot", x: -3, y: -5 },
      { kind: "reflect", x: 4, y: 2, axis: "x" }, // reflect across x-axis -> (4,-2)
      { kind: "reflect", x: -2, y: 5, axis: "y" }, // reflect across y-axis -> (2,5)
      { kind: "distance", a: { x: -5, y: 3 }, b: { x: 4, y: 3 } }, // same row, |4-(-5)|=9
      { kind: "distance", a: { x: -2, y: -4 }, b: { x: -2, y: 5 } }, // same col, |5-(-4)|=9
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
      term: "x-axis",
      definition:
        "The line that goes left and right. Numbers right of center are positive.",
      emoji: "↔️",
    },
    {
      term: "Reflection",
      definition:
        "A mirror flip of a point over an axis. Flipping over the x-axis changes the sign of y.",
      emoji: "🪞",
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
    const HALF = N / 2; // vertex index of the origin

    const grid = createGrid(ctx, { n: N, cell: 1 });

    // Coordinate <-> vertex-index conversions.
    const coordToVertex = (x, y) => ({ i: x + HALF, j: y + HALF });
    const vertexToCoord = (i, j) => ({ x: i - HALF, y: j - HALF });
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
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    // ---- Axis emphasis (darker lines along x=0 and y=0) ----
    const axisMat = new THREE.LineBasicMaterial({ color: 0xdce8ff });
    disposables.push(axisMat);
    function addAxisLine(from, to) {
      const g = new THREE.BufferGeometry().setFromPoints([from, to]);
      const line = new THREE.Line(g, axisMat);
      line.position.y = 0.02;
      grid.group.add(line);
      disposables.push(g);
    }
    addAxisLine(coordToWorld(cfg.minCoord, 0), coordToWorld(cfg.maxCoord, 0));
    addAxisLine(coordToWorld(0, cfg.minCoord), coordToWorld(0, cfg.maxCoord));

    // ---- Axis tick labels ----
    function addTickLabels() {
      for (let c = cfg.minCoord; c <= cfg.maxCoord; c++) {
        if (c === 0) continue;
        const lx = makeLabel(String(c), { scale: 0.5 });
        const wx = coordToWorld(c, 0);
        lx.position.set(wx.x, 0.45, wx.z);
        grid.group.add(lx);
        labels.push(lx);
        const ly = makeLabel(String(c), { scale: 0.5 });
        const wy = coordToWorld(0, c);
        ly.position.set(wy.x, 0.45, wy.z);
        grid.group.add(ly);
        labels.push(ly);
      }
      const ox = makeLabel("x", { scale: 0.6, color: "#9fd0ff" });
      const wox = coordToWorld(cfg.maxCoord, 0);
      ox.position.set(wox.x + 0.6, 0.5, wox.z);
      grid.group.add(ox);
      labels.push(ox);
      const oy = makeLabel("y", { scale: 0.6, color: "#9fd0ff" });
      const woy = coordToWorld(0, cfg.maxCoord);
      oy.position.set(woy.x, 0.5, woy.z - 0.6);
      grid.group.add(oy);
      labels.push(oy);
    }
    addTickLabels();

    // ---- Cursor (sits on a vertex / lattice point) ----
    const cursor = { x: 0, y: 0 };
    const cursorMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 12),
      new THREE.MeshStandardMaterial({
        color: COLORS.cursor,
        emissive: COLORS.cursor,
        emissiveIntensity: 0.4,
      }),
    );
    disposables.push(cursorMesh.geometry, cursorMesh.material);
    scene.add(cursorMesh);

    // ---- Target marker (a ring on the goal vertex) ----
    const targetRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.07, 10, 24),
      new THREE.MeshStandardMaterial({
        color: COLORS.target,
        emissive: COLORS.target,
        emissiveIntensity: 0.5,
      }),
    );
    targetRing.rotation.x = -Math.PI / 2;
    targetRing.visible = false;
    disposables.push(targetRing.geometry, targetRing.material);
    scene.add(targetRing);

    const markerGeo = new THREE.SphereGeometry(0.2, 16, 12);
    disposables.push(markerGeo);

    function placeMarker(x, y, color) {
      const m = new THREE.Mesh(
        markerGeo,
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.35,
        }),
      );
      const w = coordToWorld(x, y);
      m.position.set(w.x, 0.2, w.z);
      scene.add(m);
      persistentMarkers.push(m);
      return m;
    }

    function addPointLabel(x, y, color) {
      const lbl = makeLabel(`(${x}, ${y})`, { scale: 0.55, color });
      const w = coordToWorld(x, y);
      lbl.position.set(w.x, 0.9, w.z);
      scene.add(lbl);
      persistentMarkers.push(lbl);
      return lbl;
    }

    // ---- Round state ----
    let taskIndex = 0;
    let task = null;
    let solved = false;
    let unbindFrame = null;
    let unbindPress = null;
    let unbindTap = null;

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

    function setCursor(x, y) {
      cursor.x = Math.max(cfg.minCoord, Math.min(cfg.maxCoord, x));
      cursor.y = Math.max(cfg.minCoord, Math.min(cfg.maxCoord, y));
      const w = coordToWorld(cursor.x, cursor.y);
      cursorMesh.position.set(w.x, 0.25, w.z);
      updateHud();
    }

    // Objective line carries the live cursor coordinates so students always see
    // where (x, y) they are as they navigate.
    function updateHud() {
      hud.setObjective(
        `${objectiveText()}  •  Cursor: (${cursor.x}, ${cursor.y})`,
      );
    }

    function objectiveText() {
      if (!task) return "";
      if (task.kind === "plot")
        return `Plot the ordered pair (${task.x}, ${task.y}).`;
      if (task.kind === "identify")
        return `Move to the ringed point and name its coordinates.`;
      if (task.kind === "reflect")
        return `Reflect (${task.x}, ${task.y}) across the ${task.axis}-axis. Plot the image.`;
      if (task.kind === "distance")
        return `Find the distance from (${task.a.x}, ${task.a.y}) to (${task.b.x}, ${task.b.y}). Step onto the second point.`;
      return "";
    }

    function reflectTarget(t) {
      if (t.axis === "x") return { x: t.x, y: -t.y };
      return { x: -t.x, y: t.y };
    }

    function startTask() {
      solved = false;
      task = cfg.tasks[taskIndex];
      targetRing.visible = false;
      setCursor(0, 0);

      if (task.kind === "plot") {
        if (cfg.hints) {
          targetRing.visible = true;
          const w = coordToWorld(task.x, task.y);
          targetRing.position.set(w.x, 0.1, w.z);
        }
        announce(
          `Task ${taskIndex + 1}. Plot the ordered pair ${task.x}, ${task.y}. Move right or left for x, then up or down for y, then place.`,
        );
      } else if (task.kind === "identify") {
        targetRing.visible = true;
        const w = coordToWorld(task.x, task.y);
        targetRing.position.set(w.x, 0.1, w.z);
        announce(
          `Task ${taskIndex + 1}. Move the cursor onto the ringed point, then place to name its coordinates.`,
        );
      } else if (task.kind === "reflect") {
        // Show the original point as a fixed marker.
        placeMarker(task.x, task.y, COLORS.plotted);
        addPointLabel(task.x, task.y, "#9fc4f0");
        announce(
          `Task ${taskIndex + 1}. The point ${task.x}, ${task.y} is shown. Reflect it across the ${task.axis}-axis and plot the new point.`,
        );
      } else if (task.kind === "distance") {
        placeMarker(task.a.x, task.a.y, COLORS.plotted);
        addPointLabel(task.a.x, task.a.y, "#9fc4f0");
        placeMarker(task.b.x, task.b.y, COLORS.distance);
        addPointLabel(task.b.x, task.b.y, "#f0c08a");
        setCursor(task.a.x, task.a.y);
        const along =
          task.a.y === task.b.y ? "row (same y)" : "column (same x)";
        announce(
          `Task ${taskIndex + 1}. These two points share a ${along}. Step the cursor from the first point to the second to measure the distance.`,
        );
      }
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
      onScore(points, { task: taskIndex + 1, kind: task.kind });
      feel.shake(0.28);
      feel.burst(
        { x: cursorMesh.position.x, y: 0.8, z: cursorMesh.position.z },
        { color: COLORS.target, count: 28, spread: 3 },
      );
      hud.message(`${msg} +${points}`, { tone: "ok", duration: 2400 });
      announce(sayit);
      later(() => {
        clearMarkers();
        if (taskIndex < cfg.tasks.length - 1) {
          taskIndex += 1;
          startTask();
        } else {
          hud.setObjective("Quest complete! You mapped the whole plane.");
          hud.message("All tasks complete!", { tone: "ok", duration: 0 });
          announce("All tasks complete. Great work, coordinate explorer.");
        }
      }, 2600);
    }

    function reject(msg) {
      hud.message(msg, { tone: "warn", duration: 2000 });
      feel.shake(0.14);
      announce(msg);
    }

    function attempt() {
      if (solved || !task) return;

      if (task.kind === "plot") {
        if (cursor.x === task.x && cursor.y === task.y) {
          placeMarker(task.x, task.y, COLORS.plotted);
          addPointLabel(task.x, task.y, "#9fc4f0");
          win(
            20,
            `Plotted (${task.x}, ${task.y}) in ${quadrantName(task.x, task.y)}.`,
            `Correct. You plotted the ordered pair ${task.x}, ${task.y}, which is on ${quadrantName(task.x, task.y)}.`,
          );
        } else {
          reject(
            `Not yet. Remember (x, y): x is right/left, y is up/down. You are at (${cursor.x}, ${cursor.y}).`,
          );
        }
        return;
      }

      if (task.kind === "identify") {
        if (cursor.x === task.x && cursor.y === task.y) {
          placeMarker(task.x, task.y, COLORS.plotted);
          addPointLabel(task.x, task.y, "#9fc4f0");
          win(
            20,
            `Correct: (${task.x}, ${task.y}).`,
            `Yes. The ringed point is the ordered pair ${task.x}, ${task.y}, in ${quadrantName(task.x, task.y)}.`,
          );
        } else {
          reject(
            `That is (${cursor.x}, ${cursor.y}). Move onto the ringed point first.`,
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
            `Not the mirror image. Across the ${task.axis}-axis, flip the sign of ${task.axis === "x" ? "y" : "x"}. You are at (${cursor.x}, ${cursor.y}).`,
          );
        }
        return;
      }

      if (task.kind === "distance") {
        if (cursor.x === task.b.x && cursor.y === task.b.y) {
          const dist =
            task.a.y === task.b.y
              ? Math.abs(task.b.x - task.a.x)
              : Math.abs(task.b.y - task.a.y);
          drawDistanceBar(task.a, task.b);
          const lbl = makeLabel(`distance = ${dist}`, {
            scale: 0.6,
            color: "#f0c08a",
          });
          const mx = (task.a.x + task.b.x) / 2;
          const my = (task.a.y + task.b.y) / 2;
          const w = coordToWorld(mx, my);
          lbl.position.set(w.x, 1.1, w.z);
          scene.add(lbl);
          persistentMarkers.push(lbl);
          const expr =
            task.a.y === task.b.y
              ? `|${task.b.x} − (${task.a.x})| = ${dist}`
              : `|${task.b.y} − (${task.a.y})| = ${dist}`;
          win(
            25,
            `Distance = ${dist}. ${expr}`,
            `The points line up, so the distance is the absolute value of the difference: ${dist} units.`,
          );
        } else {
          reject(
            `Keep stepping toward (${task.b.x}, ${task.b.y}). You are at (${cursor.x}, ${cursor.y}).`,
          );
        }
        return;
      }
    }

    function drawDistanceBar(a, b) {
      const wa = coordToWorld(a.x, a.y);
      const wb = coordToWorld(b.x, b.y);
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(wa.x, 0.15, wa.z),
        new THREE.Vector3(wb.x, 0.15, wb.z),
      ]);
      const m = new THREE.LineBasicMaterial({ color: COLORS.distance });
      const line = new THREE.Line(g, m);
      scene.add(line);
      persistentMarkers.push(line);
    }

    // ---- Movement ----
    function move(dx, dy) {
      setCursor(cursor.x + dx, cursor.y + dy);
      announce(
        `Cursor at ${cursor.x}, ${cursor.y}. ${quadrantName(cursor.x, cursor.y)}.`,
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
        camera.position.set(0, N * 1.25, N * 1.15);
        camera.lookAt(0, 0, 0);
        feel.syncCamera();

        startTask();

        unbindPress = input.onPress((name) => {
          if (name === "up") move(0, 1);
          else if (name === "down") move(0, -1);
          else if (name === "left") move(-1, 0);
          else if (name === "right") move(1, 0);
          else if (name === "action" || name === "confirm") attempt();
        });

        unbindTap = input.onTap(() => {
          if (solved) return;
          const c = pointerToCoord();
          if (!c) return;
          setCursor(c.x, c.y);
          announce(`Cursor at ${c.x}, ${c.y}.`);
          attempt();
        });

        if (!feel.reducedMotion) {
          unbindFrame = ctx.onFrame((dt, t) => {
            const s = 1 + Math.sin(t * 4) * 0.12;
            cursorMesh.scale.set(s, s, s);
            if (targetRing.visible) targetRing.rotation.z = t * 1.5;
          });
        }
      },

      dispose() {
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        clearMarkers();
        labels.forEach((l) => {
          if (l.material) {
            if (l.material.map) l.material.map.dispose();
            l.material.dispose();
          }
        });
        disposables.forEach((d) => d.dispose && d.dispose());
        grid.dispose();
      },
    };
  },
};
