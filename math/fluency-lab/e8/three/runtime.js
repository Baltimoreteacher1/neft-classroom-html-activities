import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const reduceMotion = () =>
  Boolean(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) ||
  document.body?.dataset.reducedMotion === "true";

export const copyFor = (lang, en, es) => (lang === "es" ? es : en);

export function makeLabel(text, color = "#17324d") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(255,255,255,.94)";
  context.beginPath();
  context.roundRect(10, 12, 492, 104, 24);
  context.fill();
  context.strokeStyle = "rgba(23,50,77,.16)";
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = color;
  context.font = "700 58px Lexend, Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(String(text).slice(0, 18), canvas.width / 2, canvas.height / 2, 460);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }),
  );
  sprite.scale.set(1.55, 0.39, 1);
  sprite.renderOrder = 4;
  return sprite;
}

export function createStage(
  slot,
  { id, lang, label, help, extraControls = [], onStageAction = () => {} } = {},
) {
  const wrapper = document.createElement("section");
  wrapper.className = "e8ml-three-stage";
  wrapper.dataset.threeExperience = id;
  wrapper.setAttribute("role", "group");
  wrapper.setAttribute("aria-label", label);

  const toolbar = document.createElement("div");
  toolbar.className = "e8ml-three-toolbar";
  toolbar.setAttribute("role", "group");
  toolbar.setAttribute("aria-label", copyFor(lang, "3D scene controls", "Controles de la escena 3D"));

  const viewport = document.createElement("div");
  viewport.className = "e8ml-three-viewport";
  const status = document.createElement("p");
  status.className = "e8ml-three-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.textContent = help;
  const helpId = `e8ml-three-help-${id}`;
  status.id = helpId;
  const canvasLabel = document.createElement("p");
  canvasLabel.className = "e8ml-three-caption";
  canvasLabel.textContent = label;

  const cameraControls = [
    ["iso", copyFor(lang, "Isometric", "Isométrica")],
    ["top", copyFor(lang, "Top view", "Vista superior")],
    ["side", copyFor(lang, "Side view", "Vista lateral")],
    ["reset-view", copyFor(lang, "Reset view", "Restablecer vista")],
  ];
  for (const [action, text] of [...cameraControls, ...extraControls.map(({ id: key, label: name }) => [key, name])]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "e8ml-three-btn";
    button.dataset.stageAction = action;
    button.textContent = text;
    if (extraControls.some((control) => control.id === action)) button.setAttribute("aria-pressed", "false");
    toolbar.append(button);
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f7f4ec");
  scene.fog = new THREE.Fog("#f7f4ec", 10, 24);
  const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 60);
  const cameraHome = new THREE.Vector3(5.4, 4.1, 7.2);
  const targetHome = new THREE.Vector3(0, 0.45, 0);
  camera.position.copy(cameraHome);
  camera.lookAt(targetHome);

  scene.add(new THREE.HemisphereLight("#ffffff", "#d6d4c9", 2.15));
  const keyLight = new THREE.DirectionalLight("#ffffff", 2.25);
  keyLight.position.set(-4, 8, 6);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight("#78c9c2", 0.72);
  fillLight.position.set(5, 3, -5);
  scene.add(fillLight);

  const renderer = new THREE.WebGLRenderer({
    alpha: false,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(720, 370, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setClearColor("#f7f4ec", 1);
  renderer.domElement.className = "e8ml-three-canvas";
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute("aria-label", label);
  renderer.domElement.setAttribute("aria-describedby", helpId);
  renderer.domElement.tabIndex = 0;
  viewport.append(renderer.domElement);
  wrapper.append(toolbar, viewport, status, canvasLabel);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(targetHome);
  controls.enableDamping = !reduceMotion();
  controls.dampingFactor = 0.09;
  controls.enablePan = false;
  controls.minDistance = 3.3;
  controls.maxDistance = 12;
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
  controls.update();

  let attachedSlot = null;
  let active = true;
  let visible = true;
  let destroyed = false;
  let tick = () => {};
  let lastDraw = 0;
  const draw = (time = 0) => {
    if (destroyed || !active || !visible || document.hidden) return;
    controls.update();
    tick(time, Math.min(40, Math.max(0, time - lastDraw)));
    lastDraw = time;
    renderer.render(scene, camera);
  };
  const resize = () => {
    if (!attachedSlot) return;
    const bounds = attachedSlot.getBoundingClientRect();
    const width = Math.max(1, Math.floor(bounds.width));
    const height = width < 560 ? 300 : 370;
    const dpr = Math.min(window.devicePixelRatio || 1, width < 560 ? 1.2 : 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw(performance.now());
  };
  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([entry]) => {
          visible = Boolean(entry?.isIntersecting);
          if (visible) draw(performance.now());
        })
      : null;
  const visibilityChanged = () => draw(performance.now());
  const contextLost = (event) => {
    event.preventDefault();
    active = false;
    status.textContent = copyFor(
      lang,
      "The 3D view paused. Open the accessible 2D model below to keep working.",
      "La vista 3D se pausó. Abre el modelo 2D accesible para seguir trabajando.",
    );
    wrapper.dataset.renderer = "unavailable";
  };
  const contextRestored = () => {
    active = true;
    renderer.resetState();
    wrapper.dataset.renderer = "webgl";
    status.textContent = help;
    draw(performance.now());
  };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  renderer.domElement.addEventListener("webglcontextrestored", contextRestored);
  document.addEventListener("visibilitychange", visibilityChanged);
  renderer.setAnimationLoop(draw);

  const preset = (name) => {
    const poses = {
      iso: [cameraHome, targetHome],
      top: [new THREE.Vector3(0.05, 9, 0.01), targetHome],
      side: [new THREE.Vector3(0, 1.55, 9), targetHome],
      "reset-view": [cameraHome, targetHome],
    };
    const [position, target] = poses[name] || poses.iso;
    camera.position.copy(position);
    controls.target.copy(target);
    controls.update();
    draw(performance.now());
  };
  toolbar.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-stage-action]");
    if (!button) return;
    const action = button.dataset.stageAction;
    if (["iso", "top", "side", "reset-view"].includes(action)) preset(action);
    else onStageAction(action);
  });

  const attach = (nextSlot) => {
    if (!nextSlot || destroyed) return;
    if (attachedSlot) {
      resizeObserver.unobserve(attachedSlot);
      intersectionObserver?.unobserve(attachedSlot);
    }
    attachedSlot = nextSlot;
    nextSlot.replaceChildren(wrapper);
    resizeObserver.observe(nextSlot);
    intersectionObserver?.observe(nextSlot);
    resize();
  };
  attach(slot);

  const setHelp = (text) => {
    status.textContent = text;
    renderer.domElement.setAttribute("aria-label", text);
  };
  const setControls = (states = {}) => {
    for (const button of toolbar.querySelectorAll("[data-stage-action]")) {
      if (button.hasAttribute("aria-pressed"))
        button.setAttribute("aria-pressed", String(Boolean(states[button.dataset.stageAction])));
    }
  };
  const setTick = (fn) => {
    tick = typeof fn === "function" ? fn : () => {};
    draw(performance.now());
  };
  const setHome = (position, target) => {
    cameraHome.copy(position);
    targetHome.copy(target);
    controls.maxDistance = Math.max(12, position.length() * 1.5);
    preset("iso");
  };
  const destroy = (owned = []) => {
    if (destroyed) return;
    destroyed = true;
    renderer.setAnimationLoop(null);
    resizeObserver.disconnect();
    intersectionObserver?.disconnect();
    document.removeEventListener("visibilitychange", visibilityChanged);
    controls.dispose();
    const geometries = new Set();
    const materials = new Set();
    scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!material) continue;
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
      }
    });
    for (const object of owned) object?.dispose?.();
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    renderer.dispose();
    wrapper.remove();
    attachedSlot?.replaceChildren();
    attachedSlot = null;
  };

  return {
    scene,
    camera,
    controls,
    renderer,
    wrapper,
    attach,
    draw,
    setHelp,
    setTick,
    setHome,
    setControls,
    destroy,
  };
}

export function listenForTap(canvas, callback) {
  let start = null;
  const down = (event) => {
    start = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };
  const up = (event) => {
    if (!start || start.id !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    start = null;
    if (moved < 5) callback(event);
  };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointerup", up);
  return () => {
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointerup", up);
  };
}

export function pickFromCanvas(stage, event, objects) {
  const bounds = stage.renderer.domElement.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
    -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, stage.camera);
  return raycaster.intersectObjects(objects, true)[0] || null;
}

export function standardMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.52,
    metalness: 0.035,
    ...options,
  });
}

export function stageBase(scene, { width = 6.8, depth = 3.7 } = {}) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    standardMaterial("#ffffff", { roughness: 0.96 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.28;
  scene.add(floor);
  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.08, 0.1, depth + 0.08),
    standardMaterial("#d9e7e4", { roughness: 0.78 }),
  );
  rim.position.y = -0.36;
  scene.add(rim);
  return [floor, rim];
}

export { THREE };
