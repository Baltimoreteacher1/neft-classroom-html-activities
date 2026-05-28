import * as THREE from "three";

const KEY_MAP = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  Space: "action",
  Enter: "confirm",
  NumpadEnter: "confirm",
};

export function createInput(domEl) {
  if (!domEl) throw new Error("createInput: domEl is required");

  const isTouch =
    "ontouchstart" in window || (navigator.maxTouchPoints || 0) > 0;

  const state = {
    up: false,
    down: false,
    left: false,
    right: false,
    action: false,
    confirm: false,
    pointer: { x: 0, y: 0, active: false },
    ndc: new THREE.Vector2(),
    isTouch,
  };

  const pressListeners = new Set();
  const tapListeners = new Set();
  const raycaster = new THREE.Raycaster();

  function fire(set, name) {
    for (const cb of set) {
      try {
        cb(name);
      } catch (e) {
        console.error("input listener error", e);
      }
    }
  }

  function onKeyDown(e) {
    const action = KEY_MAP[e.code];
    if (!action) return;
    e.preventDefault();
    if (!state[action]) fire(pressListeners, action);
    state[action] = true;
  }
  function onKeyUp(e) {
    const action = KEY_MAP[e.code];
    if (!action) return;
    state[action] = false;
  }

  function updateNdc(clientX, clientY) {
    const rect = domEl.getBoundingClientRect();
    state.pointer.x = clientX - rect.left;
    state.pointer.y = clientY - rect.top;
    state.ndc.x = (state.pointer.x / rect.width) * 2 - 1;
    state.ndc.y = -(state.pointer.y / rect.height) * 2 + 1;
  }

  function onPointerDown(e) {
    updateNdc(e.clientX, e.clientY);
    state.pointer.active = true;
    fire(tapListeners, "tap");
  }
  function onPointerMove(e) {
    updateNdc(e.clientX, e.clientY);
  }
  function onPointerUp() {
    state.pointer.active = false;
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  domEl.addEventListener("pointerdown", onPointerDown);
  domEl.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  // On-screen touch controls (touch devices only)
  let touchUi = null;
  if (isTouch) {
    touchUi = buildTouchUi(domEl.parentNode || domEl, state, () =>
      fire(pressListeners, "action"),
    );
  }

  return {
    state,
    isTouch,
    onPress(cb) {
      pressListeners.add(cb);
      return () => pressListeners.delete(cb);
    },
    onTap(cb) {
      tapListeners.add(cb);
      return () => tapListeners.delete(cb);
    },
    /** Returns array of intersected objects (raycast from pointer through camera). */
    raycast(camera, objects, recursive = true) {
      raycaster.setFromCamera(state.ndc, camera);
      return raycaster.intersectObjects(objects, recursive);
    },
    /** Normalized -1..1 directional vector from current dpad/keys. */
    direction() {
      const x = (state.right ? 1 : 0) - (state.left ? 1 : 0);
      const y = (state.up ? 1 : 0) - (state.down ? 1 : 0);
      return new THREE.Vector2(x, y);
    },
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      domEl.removeEventListener("pointerdown", onPointerDown);
      domEl.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      pressListeners.clear();
      tapListeners.clear();
      if (touchUi && touchUi.parentNode)
        touchUi.parentNode.removeChild(touchUi);
    },
  };
}

function buildTouchUi(host, state, fireAction) {
  const wrap = document.createElement("div");
  wrap.className = "e3d-touch";
  wrap.innerHTML = `
    <div class="e3d-dpad" aria-hidden="true">
      <button data-dir="up" class="e3d-tbtn e3d-up">▲</button>
      <button data-dir="left" class="e3d-tbtn e3d-left">◀</button>
      <button data-dir="right" class="e3d-tbtn e3d-right">▶</button>
      <button data-dir="down" class="e3d-tbtn e3d-down">▼</button>
    </div>
    <button data-dir="action" class="e3d-tbtn e3d-action" aria-label="Action">●</button>`;
  injectTouchStyles();

  wrap.querySelectorAll("[data-dir]").forEach((btn) => {
    const dir = btn.getAttribute("data-dir");
    const down = (e) => {
      e.preventDefault();
      // Stop the event reaching the canvas so a game using onTap on the
      // canvas does not also fire a tap when the on-screen control is pressed.
      e.stopPropagation();
      if (dir === "action") {
        state.action = true;
        fireAction();
      } else {
        state[dir] = true;
      }
    };
    const up = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (dir === "action") state.action = false;
      else state[dir] = false;
    };
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointerleave", up);
    btn.addEventListener("pointercancel", up);
  });

  host.appendChild(wrap);
  return wrap;
}

function injectTouchStyles() {
  if (document.getElementById("e3d-touch-styles")) return;
  const s = document.createElement("style");
  s.id = "e3d-touch-styles";
  s.textContent = `
  .e3d-touch{position:absolute;inset:0;pointer-events:none;z-index:20;}
  .e3d-dpad{position:absolute;left:16px;bottom:16px;width:150px;height:150px;}
  .e3d-tbtn{position:absolute;pointer-events:auto;width:46px;height:46px;border:none;
    border-radius:12px;background:rgba(18,53,91,.78);color:#fff;font-size:18px;
    display:flex;align-items:center;justify-content:center;touch-action:none;}
  .e3d-up{left:52px;top:0;} .e3d-down{left:52px;top:104px;}
  .e3d-left{left:0;top:52px;} .e3d-right{left:104px;top:52px;}
  .e3d-action{position:absolute;right:24px;bottom:40px;width:70px;height:70px;
    border-radius:50%;background:rgba(31,166,162,.9);font-size:26px;pointer-events:auto;}`;
  document.head.appendChild(s);
}
