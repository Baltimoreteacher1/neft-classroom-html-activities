// ar-solid.js — "View in your space" WebXR augmented-reality companion for the
// 3D solid explorer. Progressive enhancement only: the button renders *solely*
// on devices that report immersive-ar + hit-test support (Android Chrome / AR
// headsets). On desktop and iOS Safari (no WebXR AR) nothing is added, so the
// existing on-screen 3D explorer is the complete experience there and there is
// zero regression.
//
// three.js is loaded lazily from the vendored copy the first time AR is actually
// launched, so its ~1.2 MB never touches the lesson bundle or non-AR devices.
//
// Public API:
//   mountARButton(container, { shape, label }) -> Promise<{ destroy } | null>
//     Resolves null (and appends nothing) when AR is unsupported.

const THREE_URL = "/assets/vendor/three-0.160.0/build/three.module.js";

// Base edge length (metres) for the placed solid — a ~16 cm object sits nicely
// on a desk.
const S = 0.16;

function solidGeometry(THREE, shape) {
  switch (shape) {
    case "triangular-prism":
      // A 3-sided "cylinder" is a triangular prism laid on its side.
      return new THREE.CylinderGeometry(S * 0.62, S * 0.62, S * 1.2, 3).rotateZ(Math.PI / 2);
    case "square-pyramid":
      // A 4-sided cone is a square pyramid; nudge so the base sits on the plane.
      return new THREE.ConeGeometry(S * 0.75, S, 4).rotateY(Math.PI / 4).translate(0, S / 2, 0);
    case "rectangular-prism":
      return new THREE.BoxGeometry(S * 1.3, S * 0.9, S).translate(0, (S * 0.9) / 2, 0);
    default: // cube
      return new THREE.BoxGeometry(S, S, S).translate(0, S / 2, 0);
  }
}

async function launchAR(shape) {
  const THREE = await import(/* @vite-ignore */ THREE_URL);

  // ── DOM overlay shown over the camera feed ──
  const overlay = document.createElement("div");
  overlay.className = "ar-solid-overlay";
  overlay.style.cssText =
    "position:fixed; inset:0; z-index:2147483000; pointer-events:none; font-family:system-ui,sans-serif;";
  overlay.innerHTML = `
    <div style="position:absolute; top:12px; left:50%; transform:translateX(-50%); background:rgba(18,53,91,.82); color:#fff; padding:8px 16px; border-radius:999px; font-size:.9rem; pointer-events:none;">
      Point at a flat surface, then tap to place the shape
    </div>
    <button class="ar-solid-exit" style="position:absolute; top:12px; right:12px; pointer-events:auto; background:#fff; color:#12355b; border:0; border-radius:999px; width:44px; height:44px; font-size:1.2rem; font-weight:800; box-shadow:0 2px 8px rgba(0,0,0,.3);" aria-label="Exit augmented reality">✕</button>`;
  document.body.appendChild(overlay);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbbb, 1.1));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(0.5, 1, 0.25);
  scene.add(dir);

  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.06, 0.075, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x1fa6a2 }),
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  const material = new THREE.MeshStandardMaterial({
    color: 0x1fa6a2,
    metalness: 0.1,
    roughness: 0.6,
    flatShading: true,
  });
  const geometry = solidGeometry(THREE, shape);

  let session = null;
  let hitTestSource = null;
  let refSpace = null;

  function cleanup() {
    try {
      renderer.setAnimationLoop(null);
      renderer.dispose();
    } catch {}
    hitTestSource = null;
    overlay.remove();
  }

  function onSelect() {
    if (!reticle.visible) return;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.setFromMatrixPosition(reticle.matrix);
    // A gentle random yaw so repeated placements don't all face the same way.
    mesh.rotation.y = ((shape || "").length % 6) * 0.5;
    scene.add(mesh);
  }

  try {
    session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: overlay },
    });
  } catch (err) {
    cleanup();
    throw err;
  }

  overlay.querySelector(".ar-solid-exit")?.addEventListener("click", () => session.end());
  session.addEventListener("select", onSelect);
  session.addEventListener("end", cleanup);

  await renderer.xr.setSession(session);
  refSpace = await session.requestReferenceSpace("local");
  const viewerSpace = await session.requestReferenceSpace("viewer");
  hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

  renderer.setAnimationLoop((_, frame) => {
    if (!frame || !hitTestSource) {
      renderer.render(scene, camera);
      return;
    }
    const hits = frame.getHitTestResults(hitTestSource);
    if (hits.length) {
      const pose = hits[0].getPose(refSpace);
      if (pose) {
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
      }
    } else {
      reticle.visible = false;
    }
    renderer.render(scene, camera);
  });
}

export async function mountARButton(container, { shape = "cube", label } = {}) {
  if (!container || typeof navigator === "undefined" || !navigator.xr?.isSessionSupported) {
    return null;
  }
  let supported = false;
  try {
    supported = await navigator.xr.isSessionSupported("immersive-ar");
  } catch {
    supported = false;
  }
  if (!supported) return null;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ar-solid-launch";
  btn.textContent = `📱 View ${label || "it"} in your space`;
  btn.style.cssText =
    "display:inline-flex; align-items:center; gap:8px; margin-top:10px; padding:10px 16px; min-height:44px; background:var(--navy,#12355b); color:#fff; border:0; border-radius:12px; font-weight:700; font-size:.95rem; cursor:pointer;";
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = "Starting AR…";
    try {
      await launchAR(shape);
    } catch (err) {
      console.warn("ar-solid: AR session failed", err);
      btn.textContent = "AR unavailable right now";
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
      }, 2500);
      return;
    }
    btn.textContent = original;
    btn.disabled = false;
  });
  container.appendChild(btn);

  return {
    destroy() {
      btn.remove();
    },
  };
}

export default mountARButton;
