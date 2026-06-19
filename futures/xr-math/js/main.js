/* XR Math — "Math You Walk Inside". Two scenes on three.js WebXR with an
 * OrbitControls fallback for laptops/phones (no headset needed).
 * No data collected, no network calls, no PII. */
import * as THREE from "three";
import { OrbitControls } from "../vendor/controls/OrbitControls.js";
import { VRButton } from "./vrButton.js";

const canvas = document.getElementById("scene-canvas");
const readout = document.getElementById("readout");
const instructions = document.getElementById("instructions");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.xr.enabled = true;
document
  .getElementById("xr-button-wrap")
  .appendChild(VRButton.createButton(renderer));

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let scene,
  pickables = [],
  onPick = null,
  onHover = null;

function lights(s) {
  s.add(new THREE.AmbientLight(0xffffff, 0.7));
  const d = new THREE.DirectionalLight(0xffffff, 0.8);
  d.position.set(5, 8, 6);
  s.add(d);
}

/* ---------------- Scene 1: Volume builder ---------------- */
const DIM = { l: 4, w: 3, h: 2 }; // x, z, y
function buildVolumeScene() {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0xf7f4ec);
  lights(s);
  pickables = [];
  const total = DIM.l * DIM.w * DIM.h;
  const off = new THREE.Vector3(-(DIM.l - 1) / 2, 0, -(DIM.w - 1) / 2);

  // translucent target prism
  const tgt = new THREE.Mesh(
    new THREE.BoxGeometry(DIM.l, DIM.h, DIM.w),
    new THREE.MeshBasicMaterial({
      color: 0x1fa6a2,
      transparent: true,
      opacity: 0.12,
    }),
  );
  tgt.position.set(0, DIM.h / 2 - 0.5, 0);
  s.add(tgt);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(DIM.l, DIM.h, DIM.w)),
    new THREE.LineBasicMaterial({ color: 0x12355b }),
  );
  edges.position.copy(tgt.position);
  s.add(edges);

  // Empty slot = clearly visible faint cell; hover = teal; filled = solid amber.
  const emptyMat = () =>
    new THREE.MeshStandardMaterial({
      color: 0x3a86b5,
      transparent: true,
      opacity: 0.22,
    });
  const hoverMat = () =>
    new THREE.MeshStandardMaterial({
      color: 0x1fa6a2,
      transparent: true,
      opacity: 0.5,
    });
  const solidMat = () => new THREE.MeshStandardMaterial({ color: 0xf2c15b });
  const geo = new THREE.BoxGeometry(0.92, 0.92, 0.92);
  const edgeGeo = new THREE.EdgesGeometry(geo); // crisp cell outline (no triangle diagonals)
  for (let x = 0; x < DIM.l; x++)
    for (let y = 0; y < DIM.h; y++)
      for (let z = 0; z < DIM.w; z++) {
        const m = new THREE.Mesh(geo, emptyMat());
        m.position.set(off.x + x, y, off.z + z);
        m.userData.filled = false;
        m.add(
          new THREE.LineSegments(
            edgeGeo,
            new THREE.LineBasicMaterial({
              color: 0x12355b,
              transparent: true,
              opacity: 0.5,
            }),
          ),
        );
        s.add(m);
        pickables.push(m);
      }
  let placed = 0;
  const update = () => {
    readout.innerHTML =
      `Cubes placed: <b>${placed} / ${total}</b> &nbsp; · &nbsp; Volume = ${DIM.l} × ${DIM.w} × ${DIM.h} = <b>${total}</b> cubic units` +
      (placed === total ? ` &nbsp; 🎉 <b>Filled!</b>` : "");
  };
  update();
  let lastHover = null;
  onPick = (hit) => {
    const m = hit.object;
    m.userData.filled = !m.userData.filled;
    m.material.dispose();
    m.material = m.userData.filled ? solidMat() : emptyMat();
    if (lastHover === m) lastHover = null;
    placed += m.userData.filled ? 1 : -1;
    update();
  };
  onHover = (hit) => {
    if (lastHover && !lastHover.userData.filled) {
      lastHover.material.dispose();
      lastHover.material = emptyMat();
    }
    lastHover = null;
    if (hit && !hit.object.userData.filled) {
      hit.object.material.dispose();
      hit.object.material = hoverMat();
      lastHover = hit.object;
    }
  };
  instructions.innerHTML =
    "🧱 <b>Volume builder.</b> Click the slots to drop in unit cubes and fill the glowing box. Watch how length × width × height counts the cubes.";
  camera.position.set(5, 5, 7);
  controls.target.set(0, DIM.h / 2, 0);
  controls.update();
  return s;
}

/* ---------------- Scene 2: Coordinate space ---------------- */
const TARGETS = [
  [2, 3, 1],
  [1, 2, 3],
  [3, 1, 2],
  [0, 3, 2],
];
let targetIdx = 0;
function buildCoordScene() {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x0b1437);
  lights(s);
  pickables = [];
  const N = 4;
  s.add(new THREE.AxesHelper(N + 0.5));
  const grid = new THREE.GridHelper(N * 2, N * 2, 0x335, 0x224);
  grid.position.set(N / 2, 0, N / 2);
  s.add(grid);

  const dot = new THREE.SphereGeometry(0.09, 12, 12);
  const dotMat = () => new THREE.MeshStandardMaterial({ color: 0x9fb6d4 });
  for (let x = 0; x <= N; x++)
    for (let y = 0; y <= N; y++)
      for (let z = 0; z <= N; z++) {
        const m = new THREE.Mesh(dot, dotMat());
        m.position.set(x, y, z);
        m.userData.coord = [x, y, z];
        s.add(m);
        pickables.push(m);
      }
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xf2c15b }),
  );
  marker.visible = false;
  s.add(marker);

  const target = TARGETS[targetIdx % TARGETS.length];
  const setReadout = (msg) => {
    readout.innerHTML = `🎯 Plot <b>(${target.join(", ")})</b> &nbsp; ${msg}`;
  };
  setReadout("— click the matching lattice point.");
  onHover = (hit) => {
    if (!hit) return;
    const [x, y, z] = hit.object.userData.coord;
    readout.dataset.hover = `(${x}, ${y}, ${z})`;
  };
  onPick = (hit) => {
    const [x, y, z] = hit.object.userData.coord;
    marker.position.set(x, y, z);
    marker.visible = true;
    const ok = x === target[0] && y === target[1] && z === target[2];
    if (ok) {
      setReadout(`✅ <b>(${x}, ${y}, ${z})</b> — correct!`);
      document.getElementById("next-challenge").style.display = "inline-flex";
    } else {
      setReadout(`You picked (${x}, ${y}, ${z}). Not yet — check each axis.`);
    }
  };
  instructions.innerHTML =
    "🧭 <b>Coordinate space.</b> Read the target point and click the lattice dot at (x, y, z). X = right, Y = up, Z = toward you.";
  document.getElementById("next-challenge").style.display = "none";
  camera.position.set(7, 6, 9);
  controls.target.set(N / 2, N / 2, N / 2);
  controls.update();
  return s;
}

/* ---------------- interaction + loop ---------------- */
function setPointer(e) {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
}
// Distinguish a tap (pick) from a click-drag (OrbitControls rotate). Without
// this, every camera rotation also toggles a cube — the "fills incorrectly" bug.
let downPos = null;
canvas.addEventListener("pointerdown", (e) => {
  downPos = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener("pointerup", (e) => {
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
  downPos = null;
  if (moved > 6) return; // it was a drag to rotate, not a tap to place
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  if (hits.length && onPick) onPick(hits[0]);
});
canvas.addEventListener("pointermove", (e) => {
  if (!onHover) return;
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  onHover(hits[0] || null);
});

function resize() {
  const w = canvas.clientWidth,
    h = canvas.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}
function switchScene(name) {
  document
    .querySelectorAll(".scene-btn")
    .forEach((b) => b.setAttribute("aria-pressed", b.dataset.scene === name));
  scene = name === "coord" ? buildCoordScene() : buildVolumeScene();
}
renderer.setAnimationLoop(() => {
  resize();
  controls.update();
  if (scene) renderer.render(scene, camera);
});

document
  .querySelectorAll(".scene-btn")
  .forEach((b) =>
    b.addEventListener("click", () => switchScene(b.dataset.scene)),
  );
document.getElementById("next-challenge").addEventListener("click", () => {
  targetIdx++;
  switchScene("coord");
});
switchScene("volume");
