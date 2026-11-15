import * as THREE from "three";

const THEMES = {
  "u2-pulse-matrix": [0x73e7dc, 0x749cff, "octahedron"],
  "u2-circuit-breaker": [0xffc56d, 0xff6d83, "knot"],
  "u3-ratio-mixer": [0x71e2c1, 0xbaa0ff, "dodecahedron"],
  "u4-percent-cylinder": [0x68dded, 0xffbf6a, "cylinder"],
  "u5-polyhedral-forge": [0xffce72, 0xff7898, "golem"],
  "u6-kinetic-slicer": [0x8de8d3, 0x7ba7ff, "blade"],
  "u6-assembly-matrix": [0x83e3a7, 0xffc567, "assembly"],
  "u7-abyssal-drift": [0x65dfec, 0xa792ff, "submarine"],
  "u8-aero-torque": [0xffd16e, 0x87dcff, "gyro"],
  "u9-flux-plotter": [0x85e7d3, 0xc097ff, "plot"],
};

const noop = Object.freeze({ celebrate() {}, stumble() {}, dispose() {} });

function makeBody(kind, color, emissive) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.22,
    metalness: 0.42,
    roughness: 0.28,
  });
  let geometry;
  if (kind === "knot") geometry = new THREE.TorusKnotGeometry(0.53, 0.17, 72, 10, 2, 3);
  else if (kind === "cylinder") geometry = new THREE.CylinderGeometry(0.48, 0.58, 1.05, 12, 1, true);
  else if (kind === "dodecahedron") geometry = new THREE.DodecahedronGeometry(0.68, 0);
  else if (kind === "blade") geometry = new THREE.OctahedronGeometry(0.72, 0);
  else if (kind === "submarine") geometry = new THREE.SphereGeometry(0.63, 14, 10);
  else if (kind === "gyro") geometry = new THREE.TorusGeometry(0.54, 0.14, 8, 32);
  else if (kind === "assembly") geometry = new THREE.BoxGeometry(0.78, 0.78, 0.78);
  else if (kind === "plot") geometry = new THREE.IcosahedronGeometry(0.65, 1);
  else geometry = new THREE.OctahedronGeometry(0.7, 0);
  return new THREE.Mesh(geometry, mat);
}

function addForgeDetails(group, color) {
  const hornMaterial = new THREE.MeshStandardMaterial({
    color: 0xffb863,
    emissive: 0x7b271d,
    emissiveIntensity: 0.25,
    metalness: 0.38,
    roughness: 0.32,
  });
  const hornGeometry = new THREE.ConeGeometry(0.14, 0.38, 5);
  const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
  leftHorn.position.set(-0.37, 0.57, 0);
  leftHorn.rotation.z = 0.46;
  const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
  rightHorn.position.set(0.37, 0.57, 0);
  rightHorn.rotation.z = -0.46;
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xfff2bf });
  const eyeGeometry = new THREE.SphereGeometry(0.065, 8, 6);
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.2, 0.11, 0.56);
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.2, 0.11, 0.56);
  group.add(leftHorn, rightHorn, leftEye, rightEye);
}

function addSpecialParts(group, kind, secondary) {
  if (kind === "submarine") {
    const fin = new THREE.Mesh(
      new THREE.ConeGeometry(0.26, 0.5, 5),
      new THREE.MeshStandardMaterial({ color: 0x8ee8dc, emissive: 0x154f64, metalness: 0.2, roughness: 0.38 }),
    );
    fin.position.x = -0.66;
    fin.rotation.z = Math.PI / 2;
    group.add(fin);
  } else if (kind === "gyro") {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.93, 0.045, 6, 36),
      new THREE.MeshBasicMaterial({ color: 0x87dcff, transparent: true, opacity: 0.76 }),
    );
    ring.rotation.x = Math.PI / 2.7;
    group.add(ring);
    secondary.push(ring);
  } else if (kind === "assembly") {
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), new THREE.MeshStandardMaterial({ color: 0xffc567, metalness: 0.25, roughness: 0.36 }));
    block.position.set(0.55, 0.46, 0.1);
    group.add(block);
  } else if (kind === "plot") {
    const axisMaterial = new THREE.LineBasicMaterial({ color: 0xb3f6e4, transparent: true, opacity: 0.72 });
    const axisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.85, -0.65, 0),
      new THREE.Vector3(0.85, -0.65, 0),
      new THREE.Vector3(0, -0.65, 0),
      new THREE.Vector3(0, 0.82, 0),
    ]);
    group.add(new THREE.LineSegments(axisGeometry, axisMaterial));
  }
}

/** A low-cost, themed 3D game companion shared by all ten machine games. */
export function attachEngineScene(mount, gameId, reducedMotion = false) {
  if (!mount || !THEMES[gameId]) return noop;
  let renderer;
  try {
    const [primary, secondaryColor, kind] = THEMES[gameId];
    const scene = new THREE.Scene();
    const width = Math.max(1, mount.clientWidth || 96);
    const height = Math.max(1, mount.clientHeight || 88);
    const aspect = width / height;
    const camera = new THREE.OrthographicCamera(-1.68 * aspect, 1.68 * aspect, 1.68, -1.68, 0.1, 30);
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;pointer-events:none";
    mount.replaceChildren(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xe7f7ff, 0x18223f, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(-2, 3, 5);
    scene.add(key);

    const root = new THREE.Group();
    scene.add(root);
    const body = makeBody(kind, primary, secondaryColor);
    root.add(body);
    const secondary = [];
    if (kind === "golem") addForgeDetails(root, primary);
    addSpecialParts(root, kind, secondary);

    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(1.03, 0.035, 8, 44),
      new THREE.MeshBasicMaterial({ color: primary, transparent: true, opacity: 0.68 }),
    );
    ringA.rotation.set(0.68, 0.2, 0.24);
    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(1.22, 0.018, 6, 44),
      new THREE.MeshBasicMaterial({ color: secondaryColor, transparent: true, opacity: 0.48 }),
    );
    ringB.rotation.set(1.02, 0.4, -0.35);
    root.add(ringA, ringB);
    secondary.push(ringA, ringB);

    const satellites = [];
    const satelliteGeometry = new THREE.OctahedronGeometry(0.095, 0);
    const satelliteMaterial = new THREE.MeshStandardMaterial({ color: secondaryColor, emissive: secondaryColor, emissiveIntensity: 0.48, metalness: 0.2, roughness: 0.28 });
    for (let i = 0; i < 4; i++) {
      const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
      satellite.position.set(Math.cos(i * Math.PI / 2) * 1.34, Math.sin(i * Math.PI / 2) * 1.04, i % 2 ? 0.24 : -0.12);
      root.add(satellite);
      satellites.push(satellite);
    }

    let rafId = 0;
    let lastRender = 0;
    let live = !reducedMotion && !document.hidden;
    let onScreen = true;
    let disposed = false;
    let pulse = 0;
    let tilt = 0;
    const draw = () => renderer.render(scene, camera);
    draw();

    const frame = (time) => {
      rafId = 0;
      if (disposed || !live || !onScreen) return;
      if (time - lastRender >= 32) {
        const dt = Math.min(0.06, (time - lastRender || 32) / 1000);
        lastRender = time;
        const t = time * 0.001;
        root.rotation.y = t * 0.58 + tilt;
        root.rotation.x = 0.16 + Math.sin(t * 1.7) * 0.12;
        root.position.y = Math.sin(t * 2.1) * 0.09;
        body.rotation.z = Math.sin(t * 1.3) * 0.08;
        ringA.rotation.z += dt * 0.82;
        ringB.rotation.x += dt * 0.54;
        for (let i = 0; i < satellites.length; i++) {
          const a = t * (i % 2 ? -0.9 : 0.72) + i * Math.PI / 2;
          satellites[i].position.x = Math.cos(a) * 1.34;
          satellites[i].position.y = Math.sin(a) * 1.04;
          satellites[i].rotation.x += dt * 1.5;
          satellites[i].rotation.y += dt * 1.9;
        }
        if (pulse > 0) pulse = Math.max(0, pulse - dt * 2.4);
        root.scale.setScalar(1 + pulse * 0.17);
        if (pulse === 0 && tilt !== 0) tilt *= Math.max(0, 1 - dt * 5);
        draw();
      }
      rafId = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!reducedMotion && live && onScreen && !disposed && !rafId) rafId = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    };
    const onVisibility = () => {
      live = !document.hidden && !reducedMotion;
      if (live) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const intersection = typeof IntersectionObserver === "function"
      ? new IntersectionObserver((entries) => {
          onScreen = entries[entries.length - 1]?.isIntersecting ?? true;
          if (onScreen) start();
          else stop();
        })
      : null;
    intersection?.observe(mount);
    const resize = typeof ResizeObserver === "function"
      ? new ResizeObserver(() => {
          const w = Math.max(1, mount.clientWidth || 96);
          const h = Math.max(1, mount.clientHeight || 88);
          const a = w / h;
          camera.left = -1.68 * a;
          camera.right = 1.68 * a;
          camera.top = 1.68;
          camera.bottom = -1.68;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
          if (reducedMotion) draw();
        })
      : null;
    resize?.observe(mount);
    start();

    return {
      celebrate() {
        pulse = 1;
        tilt = 0;
      },
      stumble() {
        tilt = 0.28;
        pulse = 0.32;
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        stop();
        document.removeEventListener("visibilitychange", onVisibility);
        intersection?.disconnect();
        resize?.disconnect();
        scene.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose());
            else object.material.dispose();
          }
        });
        renderer.dispose();
      },
    };
  } catch {
    renderer?.dispose();
    return noop;
  }
}
