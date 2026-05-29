import * as THREE from "three";

export function createScene(mountEl, opts = {}) {
  if (!mountEl) throw new Error("createScene: mountEl is required");

  const {
    background = 0x0f2238,
    fov = 55,
    near = 0.1,
    far = 200,
    cameraPos = [0, 4, 9],
    antialias = true,
    maxPixelRatio = 2,
  } = opts;

  mountEl.style.position = mountEl.style.position || "relative";

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);

  const width = mountEl.clientWidth || window.innerWidth;
  const height = mountEl.clientHeight || window.innerHeight;

  const camera = new THREE.PerspectiveCamera(fov, width / height, near, far);
  camera.position.set(cameraPos[0], cameraPos[1], cameraPos[2]);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
  renderer.setSize(width, height, false);
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.touchAction = "none";
  mountEl.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(5, 10, 7);
  scene.add(ambient, key);

  const clock = new THREE.Clock();
  const frameCallbacks = new Set();
  let rafId = null;
  let disposed = false;

  function resize() {
    const w = mountEl.clientWidth || window.innerWidth;
    const h = mountEl.clientHeight || window.innerHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, maxPixelRatio),
    );
    renderer.setSize(w, h, false);
  }

  let ro = null;
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(resize);
    ro.observe(mountEl);
  }
  window.addEventListener("resize", resize);

  function loop() {
    if (disposed) return;
    rafId = requestAnimationFrame(loop);
    const dt = clock.getDelta();
    const elapsed = clock.elapsedTime;
    for (const cb of frameCallbacks) {
      try {
        cb(dt, elapsed);
      } catch (err) {
        console.error("onFrame callback error", err);
      }
    }
    renderer.render(scene, camera);
  }
  rafId = requestAnimationFrame(loop);

  function onFrame(cb) {
    frameCallbacks.add(cb);
    return () => frameCallbacks.delete(cb);
  }

  const textureLoader = new THREE.TextureLoader();
  const loaders = {
    loadTexture(url) {
      return new Promise((resolve, reject) => {
        textureLoader.load(url, resolve, undefined, reject);
      });
    },
    loadAudio(url) {
      return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.preload = "auto";
        audio.src = url;
        audio.addEventListener("canplaythrough", () => resolve(audio), {
          once: true,
        });
        audio.addEventListener(
          "error",
          () => reject(new Error("audio load failed: " + url)),
          { once: true },
        );
      });
    },
  };

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (rafId) cancelAnimationFrame(rafId);
    frameCallbacks.clear();
    if (ro) ro.disconnect();
    window.removeEventListener("resize", resize);
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        mats.forEach((m) => {
          for (const key in m) {
            const val = m[key];
            if (val && val.isTexture) val.dispose();
          }
          m.dispose();
        });
      }
    });
    renderer.dispose();
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }

  return {
    scene,
    camera,
    renderer,
    clock,
    onFrame,
    loaders,
    resize,
    dispose,
    THREE,
  };
}
