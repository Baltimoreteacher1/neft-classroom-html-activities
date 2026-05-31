import * as THREE from "three";

/**
 * Premium WebGL scene factory shared by every unit game.
 *
 * What this gives every game for free (no per-game work):
 *   - ACES filmic tone mapping + sRGB output  → film-like, non-washed color
 *   - Soft shadow maps (PCFSoft)              → grounded objects (opt-in per mesh)
 *   - 4-light studio rig (hemi + key + fill + rim) → readable, dimensional form
 *   - Vertical gradient "sky" background + fog → depth and atmosphere
 *
 * Optional premium extras (guarded — silently fall back if the CDN/addons are
 * unavailable, e.g. an index.html without the "three/addons/" importmap):
 *   - PMREM environment (RoomEnvironment) for believable PBR reflections
 *   - UnrealBloom post-processing so emissive highlights actually glow
 *
 * The returned object keeps the original public shape so existing games keep
 * working: { scene, camera, renderer, clock, onFrame, loaders, resize, dispose, THREE }.
 */
export function createScene(mountEl, opts = {}) {
  if (!mountEl) throw new Error("createScene: mountEl is required");

  const {
    background = 0x0f2238,
    fov = 52,
    near = 0.1,
    far = 220,
    cameraPos = [0, 4, 9],
    antialias = true,
    maxPixelRatio = 2,
    exposure = 1.08,
    shadows = true,
    fog = true,
    environment = true, // PMREM IBL (guarded)
    bloom = true, // UnrealBloom post (guarded)
    bloomStrength = 0.55,
    bloomRadius = 0.6,
    bloomThreshold = 0.82,
  } = opts;

  mountEl.style.position = mountEl.style.position || "relative";

  const scene = new THREE.Scene();

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
  if ("outputColorSpace" in renderer)
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  if (shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.touchAction = "none";
  mountEl.appendChild(renderer.domElement);

  // ---- Atmosphere: vertical gradient sky + matching fog ---------------------
  const base = new THREE.Color(background);
  const top = base.clone().lerp(new THREE.Color(0xffffff), 0.22);
  const bottom = base.clone().lerp(new THREE.Color(0x000000), 0.32);
  scene.background = makeGradientTexture(top, bottom);
  if (fog) scene.fog = new THREE.Fog(base.clone().lerp(bottom, 0.5), 26, 90);

  // ---- Studio light rig -----------------------------------------------------
  const hemi = new THREE.HemisphereLight(0xdfefff, 0x2a3344, 0.55);
  const ambient = new THREE.AmbientLight(0xffffff, 0.22);
  const key = new THREE.DirectionalLight(0xfff4e2, 1.15);
  key.position.set(6, 11, 7);
  if (shadows) {
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 50;
    const s = 18;
    key.shadow.camera.left = -s;
    key.shadow.camera.right = s;
    key.shadow.camera.top = s;
    key.shadow.camera.bottom = -s;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 3;
  }
  const fill = new THREE.DirectionalLight(0xbcd4ff, 0.32);
  fill.position.set(-8, 5, 4);
  const rim = new THREE.DirectionalLight(0x9fc0ff, 0.6);
  rim.position.set(-3, 6, -9);
  scene.add(hemi, ambient, key, fill, rim);

  // ---- Optional PMREM environment (guarded) ---------------------------------
  if (environment) {
    (async () => {
      try {
        const { RoomEnvironment } =
          await import("three/addons/environments/RoomEnvironment.js");
        const pmrem = new THREE.PMREMGenerator(renderer);
        const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
        scene.environment = env.texture;
        pmrem.dispose();
      } catch {
        /* addons unavailable — hemisphere light already covers ambient IBL */
      }
    })();
  }

  const clock = new THREE.Clock();
  const frameCallbacks = new Set();
  let rafId = null;
  let disposed = false;

  // ---- Optional bloom post-processing (guarded, async) ----------------------
  let composer = null;
  let bloomPass = null;
  if (bloom) {
    (async () => {
      try {
        const [
          { EffectComposer },
          { RenderPass },
          { UnrealBloomPass },
          { OutputPass },
        ] = await Promise.all([
          import("three/addons/postprocessing/EffectComposer.js"),
          import("three/addons/postprocessing/RenderPass.js"),
          import("three/addons/postprocessing/UnrealBloomPass.js"),
          import("three/addons/postprocessing/OutputPass.js"),
        ]);
        if (disposed) return;
        const c = new EffectComposer(renderer);
        c.addPass(new RenderPass(scene, camera));
        bloomPass = new UnrealBloomPass(
          new THREE.Vector2(width, height),
          bloomStrength,
          bloomRadius,
          bloomThreshold,
        );
        c.addPass(bloomPass);
        c.addPass(new OutputPass());
        c.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
        c.setSize(mountEl.clientWidth || width, mountEl.clientHeight || height);
        composer = c;
      } catch {
        /* addons unavailable — fall back to direct render */
      }
    })();
  }

  function resize() {
    const w = mountEl.clientWidth || window.innerWidth;
    const h = mountEl.clientHeight || window.innerHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const pr = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    if (composer) {
      composer.setPixelRatio(pr);
      composer.setSize(w, h);
    }
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
    if (composer) composer.render();
    else renderer.render(scene, camera);
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
    if (scene.background && scene.background.isTexture)
      scene.background.dispose();
    if (scene.environment && scene.environment.isTexture)
      scene.environment.dispose();
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
    if (composer) composer.dispose();
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
    get bloomPass() {
      return bloomPass;
    },
  };
}

/** Vertical two-stop gradient as a CanvasTexture for scene.background. */
function makeGradientTexture(topColor, bottomColor) {
  const cv = document.createElement("canvas");
  cv.width = 4;
  cv.height = 256;
  const c = cv.getContext("2d");
  const g = c.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#" + topColor.getHexString());
  g.addColorStop(1, "#" + bottomColor.getHexString());
  c.fillStyle = g;
  c.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(cv);
  if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
