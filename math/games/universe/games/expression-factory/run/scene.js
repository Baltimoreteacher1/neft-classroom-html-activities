// Factory Run — the 3D world. Reads the run state, never writes it.
// Track z grows forward; in three.js forward is −z, so world z = −track z.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createScene } from "../../../../../../games/engine3d/core.js";
import { LANES } from "./track.js";

const SEEN = 75; // how far ahead objects are built
const CHUNK = 24; // length of one repeating factory section
const SKINS = { teal: 0x1fa6a2, gold: 0xf2b84b, red: 0xe0604a, blue: 0x3d7bd9, green: 0x4caf6a };

/** A canvas texture with centered text, sized to its content. */
function textTexture(
  text,
  { size = 96, color = "#fff6e0", bg = null, pad = 28, font = "800" } = {},
) {
  const c = document.createElement("canvas");
  const g = c.getContext("2d");
  g.font = `${font} ${size}px system-ui, sans-serif`;
  const lines = String(text).split("\n");
  const w = Math.max(...lines.map((l) => g.measureText(l).width)) + pad * 2;
  const h = lines.length * size * 1.15 + pad * 2;
  c.width = Math.ceil(w);
  c.height = Math.ceil(h);
  if (bg) {
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(0, 0, c.width, c.height, 26);
    g.fill();
  }
  g.font = `${font} ${size}px system-ui, sans-serif`;
  g.fillStyle = color;
  g.textAlign = "center";
  g.textBaseline = "middle";
  lines.forEach((l, i) => g.fillText(l, c.width / 2, pad + size * 0.6 + i * size * 1.15));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return { tex: t, aspect: c.width / c.height };
}

function textPlane(text, height, opts) {
  const { tex, aspect } = textTexture(text, opts);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(height * aspect, height),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }),
  );
  return m;
}

const std = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.25, ...extra });

/** Wren: a small runner robot-kid with a visor, arms and legs that swing. */
function makeWren(skin) {
  const g = new THREE.Group();
  const body = std(SKINS[skin] || SKINS.teal);
  const dark = std(0x16294a);
  const torso = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.72, 0.42, 4, 0.14), body);
  torso.position.y = 1.05;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16), body);
  head.position.y = 1.68;
  const visor = new THREE.Mesh(
    new RoundedBoxGeometry(0.46, 0.18, 0.12, 3, 0.05),
    std(0x7fe6ff, { emissive: 0x2fbfe0, emissiveIntensity: 1.2 }),
  );
  visor.position.set(0, 1.7, -0.3);
  const legs = [-0.16, 0.16].map((x) => {
    const leg = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.62, 0.22, 3, 0.07), dark);
    leg.geometry.translate(0, -0.31, 0);
    leg.position.set(x, 0.7, 0);
    return leg;
  });
  const arms = [-0.42, 0.42].map((x) => {
    const arm = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.56, 0.18, 3, 0.06), body);
    arm.geometry.translate(0, -0.26, 0);
    arm.position.set(x, 1.36, 0);
    return arm;
  });
  const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.1, 0.46), std(0xf2b84b));
  scarf.position.y = 1.44;
  g.add(torso, head, visor, scarf, ...legs, ...arms);
  for (const m of g.children) m.castShadow = true;
  g.userData = { legs, arms, body };
  return g;
}

function addHat(wren, hat) {
  const old = wren.getObjectByName("hat");
  if (old) wren.remove(old);
  if (!hat || hat === "none") return;
  let m;
  if (hat === "cap") {
    m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.16, 20), std(0xe0604a));
    m.position.y = 1.98;
  } else if (hat === "crown") {
    m = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.24, 0.24, 6, 1, true),
      std(0xf2b84b, { metalness: 0.8, emissive: 0x6b4a00 }),
    );
    m.position.y = 2.04;
  } else {
    m = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4), std(0xcccccc));
    stick.position.y = 2.12;
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 12, 8),
      std(0xff5c5c, { emissive: 0xff2020, emissiveIntensity: 1.5 }),
    );
    bulb.position.y = 2.34;
    m.add(stick, bulb);
  }
  m.name = "hat";
  wren.add(m);
}

/** One repeating factory section: floor, lane stripes, side walls, pillars, lamps, pipes. */
function makeChunk() {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 0.4, CHUNK),
    std(0x2b2f3a, { roughness: 0.8 }),
  );
  floor.position.set(0, -0.2, -CHUNK / 2);
  floor.receiveShadow = true;
  g.add(floor);
  for (const x of [-1.3, 1.3]) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.02, CHUNK),
      std(0xf2b84b, { emissive: 0x6b4a00 }),
    );
    stripe.position.set(x, 0.01, -CHUNK / 2);
    g.add(stripe);
  }
  for (let k = 0; k < 6; k++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.02, 0.18), std(0x3a404f));
    slat.position.set(0, 0.012, -k * 4 - 1);
    g.add(slat);
  }
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 5, CHUNK),
      std(0x3b2c22, { roughness: 0.9 }),
    );
    wall.position.set(side * 5.6, 2.3, -CHUNK / 2);
    g.add(wall);
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 6, 0.6),
      std(0x6b4a2c, { metalness: 0.5 }),
    );
    pillar.position.set(side * 5.1, 3, -2);
    pillar.castShadow = true;
    g.add(pillar);
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 8),
      std(0xffd27a, { emissive: 0xffb43a, emissiveIntensity: 2.2 }),
    );
    lamp.position.set(side * 4.7, 4.4, -2);
    g.add(lamp);
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, CHUNK, 10),
      std(0x8a6a2c, { metalness: 0.7 }),
    );
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(side * 5.0, 1.2 + (side > 0 ? 0.5 : 0), -CHUNK / 2);
    g.add(pipe);
    const crate = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 3, 0.08), std(0x9a7434));
    crate.position.set(side * 4.6, 0.5, -14);
    crate.rotation.y = side * 0.3;
    crate.castShadow = true;
    g.add(crate);
  }
  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.3, CHUNK), std(0x17110d, { roughness: 1 }));
  ceiling.position.set(0, 6.2, -CHUNK / 2);
  g.add(ceiling);
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(11, 0.4, 0.5),
    std(0x6b4a2c, { metalness: 0.5 }),
  );
  beam.position.set(0, 5.6, -2);
  g.add(beam);
  return g;
}

const GEAR_GEO = (() => {
  const shape = new THREE.Shape();
  const teeth = 10;
  for (let i = 0; i <= teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 ? 0.3 : 0.38;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.11, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
})();
const GEAR_MAT = std(0xf2b84b, {
  metalness: 0.85,
  roughness: 0.3,
  emissive: 0x6b4a00,
  emissiveIntensity: 0.6,
});
const POWER_COLORS = { magnet: 0xe0604a, shield: 0x4fc3f7, double: 0xf2b84b };
const POWER_ICON = { magnet: "🧲", shield: "🛡", double: "×2" };

/** Build the mesh for one track object. */
function makeObj(o) {
  const g = new THREE.Group();
  const x = LANES[o.lane ?? 1];
  if (o.kind === "gate") {
    const glow = new THREE.Mesh(
      new RoundedBoxGeometry(2.2, 1.5, 0.12, 3, 0.1),
      new THREE.MeshStandardMaterial({
        color: 0x1fa6a2,
        emissive: 0x0d6e6b,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.82,
      }),
    );
    glow.position.set(x, 2.2, 0);
    const label = textPlane(o.choice, 0.85, { size: 110 });
    label.position.set(x, 2.2, 0.08);
    if (label.geometry.parameters.width > 2.05)
      label.scale.setScalar(2.05 / label.geometry.parameters.width);
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 3, 0.16),
        std(0xf2b84b, { metalness: 0.7 }),
      );
      post.position.set(x + side * 1.12, 1.5, 0);
      post.castShadow = true;
      g.add(post);
    }
    const arrow = textPlane("▼", 0.5, { size: 90, color: "#ffd166" });
    arrow.position.set(x, 3.3, 0);
    g.add(glow, label, arrow);
    g.userData.panel = glow;
  } else if (o.kind === "wall") {
    const wall = new THREE.Mesh(new RoundedBoxGeometry(2.3, 3, 0.4, 3, 0.1), std(0x5a2e26));
    wall.position.set(x, 1.5, 0);
    const x1 = textPlane("✕", 1.2, { size: 120, color: "#ff8a7a" });
    x1.position.set(x, 1.6, 0.22);
    g.add(wall, x1);
  } else if (o.kind === "barrier") {
    const bar = new THREE.Mesh(new RoundedBoxGeometry(2.1, 0.55, 0.4, 3, 0.08), std(0xf2b84b));
    bar.position.set(x, 0.42, 0);
    const stripes = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.14, 0.42), std(0x1a1410));
    stripes.position.set(x, 0.42, 0);
    bar.castShadow = true;
    g.add(bar, stripes);
  } else if (o.kind === "pipe") {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 2.4, 14),
      std(0x8a8f9c, { metalness: 0.8 }),
    );
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(x, 1.45, 0);
    pipe.castShadow = true;
    const steam = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }),
    );
    steam.position.set(x, 1.0, 0);
    g.add(pipe, steam);
    g.userData.steam = steam;
  } else if (o.kind === "block") {
    const crate = new THREE.Mesh(new RoundedBoxGeometry(1.9, 2.2, 1.6, 3, 0.12), std(0x9a7434));
    crate.position.set(x, 1.1, 0);
    crate.castShadow = true;
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.18, 1.64), std(0x4a3a2c));
    band.position.set(x, 1.1, 0);
    g.add(crate, band);
  } else if (o.kind === "orb") {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 20, 14),
      std(0xff5c5c, { emissive: 0xff2a2a, emissiveIntensity: 2.4 }),
    );
    orb.position.set(x, 0.55, 0);
    g.add(orb);
    g.userData.bob = orb;
  } else if (o.kind === "gear") {
    const m = new THREE.Mesh(GEAR_GEO, GEAR_MAT);
    m.position.set(x, o.y ?? 0.9, 0);
    g.add(m);
    g.userData.spin = m;
  } else if (o.kind === "power") {
    const color = POWER_COLORS[o.power];
    const ball = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.42, 1),
      std(color, { emissive: color, emissiveIntensity: 1.1, transparent: true, opacity: 0.9 }),
    );
    ball.position.set(x, 1.1, 0);
    const icon = textPlane(POWER_ICON[o.power], 0.55, { size: 90 });
    icon.position.set(x, 1.95, 0);
    g.add(ball, icon);
    g.userData.spin = ball;
  }
  g.position.z = -o.z;
  return g;
}

function makeBot() {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(
    new RoundedBoxGeometry(2.6, 1.7, 1.4, 4, 0.35),
    std(0x4b5a78, { metalness: 0.6 }),
  );
  const face = new THREE.Mesh(new RoundedBoxGeometry(1.9, 0.8, 0.1, 3, 0.1), std(0x10151f));
  face.position.set(0, 0.1, 0.72);
  const eyeMat = std(0xff5c5c, { emissive: 0xff2020, emissiveIntensity: 2.5 });
  const eyes = [-0.45, 0.45].map((x) => {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.06), eyeMat);
    e.position.set(x, 0.12, 0.78);
    return e;
  });
  const antenna = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 8),
    std(0x7fd3ff, { emissive: 0x3fb3ff, emissiveIntensity: 2 }),
  );
  antenna.position.y = 1.25;
  g.add(shell, face, ...eyes, antenna);
  g.userData = { shell, eyeMat };
  return g;
}

/** Particle bursts: small boxes that fly out and fall. */
class Bursts {
  constructor(scene) {
    this.scene = scene;
    this.parts = [];
    this.geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  }
  emit(pos, color, n = 18, power = 5) {
    const mat = new THREE.MeshBasicMaterial({ color, toneMapped: false });
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.geo, mat);
      m.position.copy(pos);
      const a = Math.random() * Math.PI * 2;
      m.userData.v = new THREE.Vector3(
        Math.cos(a) * power * Math.random(),
        2 + Math.random() * power,
        Math.sin(a) * power * Math.random(),
      );
      m.userData.life = 0.8 + Math.random() * 0.4;
      this.scene.add(m);
      this.parts.push(m);
    }
  }
  update(dt) {
    for (const m of this.parts) {
      m.userData.life -= dt;
      m.userData.v.y -= 12 * dt;
      m.position.addScaledVector(m.userData.v, dt);
      m.rotation.x += dt * 6;
    }
    const dead = this.parts.filter((m) => m.userData.life <= 0);
    for (const m of dead) this.scene.remove(m);
    if (dead.length) this.parts = this.parts.filter((m) => m.userData.life > 0);
  }
}

/** The 3D view of a run. `sync(run, dt, t)` each frame; `fx(event)` for one-off effects. */
export function createWorld(mount, { skin = "teal", hat = "none", reduced = false } = {}) {
  const view = createScene(mount, {
    background: 0x1a1410,
    cameraPos: [0, 3.4, 7],
    fov: 60,
    far: 140,
    bloomStrength: 0.35,
    bloomThreshold: 0.85,
  });
  const { scene, camera } = view;
  scene.fog = new THREE.Fog(0x241a14, 30, 95);
  const key = scene.children.find((c) => c.isDirectionalLight && c.castShadow);
  if (key) scene.add(key.target);
  const chunks = Array.from({ length: 6 }, () => {
    const c = makeChunk();
    scene.add(c);
    return c;
  });
  const wren = makeWren(skin);
  addHat(wren, hat);
  wren.rotation.y = Math.PI;
  scene.add(wren);
  const shieldBubble = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 20, 14),
    new THREE.MeshStandardMaterial({
      color: 0x4fc3f7,
      emissive: 0x1f7fbf,
      transparent: true,
      opacity: 0.25,
    }),
  );
  shieldBubble.position.y = 1.1;
  wren.add(shieldBubble);
  const bot = makeBot();
  scene.add(bot);
  const bursts = new Bursts(scene);
  const beams = [];
  const meshes = new Map();
  let shake = 0;
  let hurt = 0;
  let camX = 0;

  function sync(run, dt, t) {
    // Track sections leapfrog ahead of the player.
    const base = Math.floor(run.dist / CHUNK) * CHUNK - CHUNK;
    chunks.forEach((c, i) => {
      c.position.z = -(base + i * CHUNK);
    });
    // Objects within sight get a mesh; passed and collected ones lose it.
    for (const o of run.objs) {
      // The question lives in the HUD banner; the sign marker is not drawn.
      const near = o.kind !== "sign" && o.z - run.dist < SEEN && o.z - run.dist > -12 && !o.gone;
      let m = meshes.get(o);
      if (near && !m) {
        m = makeObj(o);
        meshes.set(o, m);
        scene.add(m);
      } else if (!near && m) {
        scene.remove(m);
        meshes.delete(o);
        m = null;
      }
      if (!m) continue;
      if (m.userData.spin) m.userData.spin.rotation.y += dt * 3;
      if (o.kind === "gear" && o.lane !== undefined)
        m.children[0].position.x +=
          (LANES[o.lane] - m.children[0].position.x) * Math.min(1, dt * 8);
      if (m.userData.bob) m.userData.bob.position.y = 0.55 + Math.abs(Math.sin(t * 4 + o.z)) * 0.5;
      if (m.userData.steam) m.userData.steam.scale.setScalar(1 + Math.sin(t * 6 + o.z) * 0.3);
      if (m.userData.panel && o.passed) m.userData.panel.material.opacity = 0.2;
      if (m.userData.panel && o.broken && !m.userData.red) {
        m.userData.red = 1;
        m.userData.panel.material.color.setHex(0xe0604a);
        m.userData.panel.material.emissive.setHex(0x6b1a10);
      }
    }
    for (const [o, m] of meshes)
      if (!run.objs.includes(o)) {
        scene.remove(m);
        meshes.delete(o);
      }
    // Wren: lane position, jump height, slide squash, run cycle.
    const pz = -run.dist;
    wren.position.set(run.x, run.y, pz);
    const sliding = run.slideT > 0;
    wren.scale.set(1, sliding ? 0.55 : 1, 1);
    wren.rotation.x = sliding ? -0.5 : 0;
    const cycle = reduced ? 0 : Math.sin(t * (run.stumbleT > 0 ? 6 : 14));
    const { legs, arms } = wren.userData;
    if (run.y > 0) {
      legs[0].rotation.x = legs[1].rotation.x = 0.6;
      arms[0].rotation.x = arms[1].rotation.x = -2.4;
    } else {
      legs[0].rotation.x = cycle * 0.8;
      legs[1].rotation.x = -cycle * 0.8;
      arms[0].rotation.x = -cycle * 0.9;
      arms[1].rotation.x = cycle * 0.9;
    }
    wren.rotation.z =
      run.stumbleT > 0 && !reduced
        ? Math.sin(t * 30) * 0.15
        : (run.x - (LANES[run.lane] ?? 0)) * 0.08;
    shieldBubble.visible = !!run.shield;
    // Boss: hovers ahead, sways, flashes when zapped.
    bot.visible = run.boss && !run.done;
    if (bot.visible) {
      bot.position.set(Math.sin(t * 0.9) * 2.6, 3.4 + Math.sin(t * 2) * 0.3, pz - 16);
      bot.rotation.y = Math.sin(t * 1.3) * 0.3;
      hurt = Math.max(0, hurt - dt);
      bot.userData.shell.material.color.setHex(hurt > 0 ? 0xe0604a : 0x4b5a78);
    }
    // Camera: behind and above, easing toward the lane, with shake.
    camX += (run.x * 0.7 - camX) * Math.min(1, dt * 5);
    shake = Math.max(0, shake - dt * 2.5);
    const sx = reduced ? 0 : (Math.random() - 0.5) * shake;
    const sy = reduced ? 0 : (Math.random() - 0.5) * shake;
    camera.position.set(camX + sx, 3.6 + run.y * 0.35 + sy, pz + 7.2);
    camera.lookAt(camX * 0.6, 1.4, pz - 9);
    if (key) {
      key.position.set(6, 11, pz + 6);
      key.target.position.set(0, 0, pz - 6);
    }
    bursts.update(dt);
    for (const b of beams) {
      b.life -= dt || 0.016;
      b.m.material.opacity = Math.max(0, b.life / 0.35);
      if (b.life <= 0) scene.remove(b.m);
    }
    if (beams.some((b) => b.life <= 0)) beams.splice(0, beams.length, ...beams.filter((b) => b.life > 0));
  }

  function fx(e, run) {
    if (e.type === "blast") {
      // A beam from Wren to the gate, then the gate bursts.
      const from = new THREE.Vector3(run.x, 1.2, -run.dist);
      const to = new THREE.Vector3(LANES[e.lane], 2.2, -e.z);
      const len = from.distanceTo(to);
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, len, 8),
        new THREE.MeshBasicMaterial({ color: 0x7fe6ff, toneMapped: false, transparent: true, opacity: 0.9 }),
      );
      beam.position.copy(from).lerp(to, 0.5);
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
      scene.add(beam);
      beams.push({ m: beam, life: 0.35 });
      bursts.emit(to, 0x7fe6ff, 36, 7);
      bursts.emit(to, 0xffd166, 24, 5);
      shake = 0.25;
      return;
    }
    const at = new THREE.Vector3(LANES[e.lane ?? run.lane], 1.6, -run.dist - 1.5);
    if (e.type === "gate") {
      bursts.emit(at, e.ok ? 0x6be08a : 0xff6b5c, e.ok ? 30 : 18, e.ok ? 6 : 4);
      if (!e.ok) shake = 0.5;
    } else if (e.type === "gear")
      bursts.emit(new THREE.Vector3(run.x, 1, -run.dist - 0.5), 0xf2b84b, 5, 2);
    else if (e.type === "power")
      bursts.emit(new THREE.Vector3(run.x, 1.2, -run.dist), 0x7fd3ff, 26, 5);
    else if (e.type === "stumble") shake = 0.7;
    else if (e.type === "shieldPop")
      bursts.emit(new THREE.Vector3(run.x, 1.2, -run.dist), 0x4fc3f7, 30, 6);
    else if (e.type === "crate" && e.boss) {
      hurt = 0.45;
      shake = 0.4;
      bursts.emit(bot.position.clone(), 0xffd166, 40, 7);
    }
  }

  function setLook(skin2, hat2) {
    wren.userData.body.color.setHex(SKINS[skin2] || SKINS.teal);
    addHat(wren, hat2);
  }

  function reset() {
    for (const m of meshes.values()) scene.remove(m);
    meshes.clear();
  }

  return { sync, fx, setLook, reset, view };
}

export { SKINS };
