// Input.js — one action layer over keyboard, pointer/touch and on-screen buttons.
//
// Games ask for actions ("left", "jump", "confirm"), never for keys. Every action has a keyboard binding, a
// touch/pointer route (on-screen buttons wired through bindButtons) and, for gameplay that is spatial or
// precise, a game-provided accessible alternative. Typing in a field never triggers a game action.
export const DEFAULT_KEYS = Object.freeze({
  left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"], up: ["ArrowUp", "KeyW"], down: ["ArrowDown", "KeyS"],
  jump: ["Space", "ArrowUp", "KeyW"], confirm: ["Enter"], cancel: ["Escape"], pause: ["KeyP"], shop: ["KeyB"], next: ["Tab"],
});

const typing = (t) => Boolean(t?.closest?.("input, textarea, select, [contenteditable='true']"));

export class InputManager {
  constructor({ target = typeof window !== "undefined" ? window : null, keys = DEFAULT_KEYS, onAction = () => {} } = {}) {
    this.target = target;
    this.keys = keys;
    this.onAction = onAction;
    this.down = new Set(); // actions currently held
    this.pressed = new Set(); // actions pressed since the last consume()
    this.buffer = new Map(); // action -> time pressed (input buffering, e.g. jump just before landing)
    this.enabled = true;
    this.cleanups = [];
    this.byCode = new Map();
    for (const [action, codes] of Object.entries(keys)) for (const c of codes) (this.byCode.get(c) || this.byCode.set(c, []).get(c)).push(action);
    if (target) this.attach();
  }
  attach() {
    const kd = (e) => {
      if (!this.enabled || typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      const acts = this.byCode.get(e.code);
      if (!acts) return;
      // Space/Enter on a focused button must still activate that button, not the game.
      if ((e.code === "Space" || e.code === "Enter") && e.target?.closest?.("button, a, [role='button'], [role='radio'], summary")) return;
      for (const a of acts) this.press(a, e.repeat);
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    };
    const ku = (e) => { for (const a of this.byCode.get(e.code) || []) this.release(a); };
    const blur = () => { this.down.clear(); };
    this.target.addEventListener("keydown", kd);
    this.target.addEventListener("keyup", ku);
    this.target.addEventListener("blur", blur);
    this.cleanups.push(() => { this.target.removeEventListener("keydown", kd); this.target.removeEventListener("keyup", ku); this.target.removeEventListener("blur", blur); });
  }
  press(action, repeat = false) {
    this.down.add(action);
    if (!repeat) { this.pressed.add(action); this.buffer.set(action, Date.now()); }
    this.onAction(action, true);
  }
  release(action) { this.down.delete(action); this.onAction(action, false); }
  isDown(action) { return this.down.has(action); }
  /** True once per press. */
  consume(action) { const had = this.pressed.has(action); this.pressed.delete(action); return had; }
  /** True if the action was pressed within `ms` (a jump pressed just before landing still counts). */
  buffered(action, ms = 140) { const t = this.buffer.get(action); return t !== undefined && Date.now() - t <= ms; }
  clearBuffer(action) { this.buffer.delete(action); }
  /** Wire on-screen buttons: [data-act="left"] held while pressed, so touch has every action the keyboard has. */
  bindButtons(root) {
    const h = (e, on) => {
      const b = e.target.closest?.("[data-act]");
      if (!b || !root.contains(b)) return;
      const a = b.dataset.act;
      if (on) this.press(a); else this.release(a);
      if (on && e.cancelable) e.preventDefault();
    };
    const pd = (e) => h(e, true);
    const pu = (e) => h(e, false);
    root.addEventListener("pointerdown", pd);
    const pc = () => this.down.clear();
    window.addEventListener("pointerup", pu);
    window.addEventListener("pointercancel", pc);
    this.cleanups.push(() => { root.removeEventListener("pointerdown", pd); window.removeEventListener("pointerup", pu); window.removeEventListener("pointercancel", pc); });
  }
  reset() { this.down.clear(); this.pressed.clear(); this.buffer.clear(); }
  destroy() { for (const c of this.cleanups) c(); this.cleanups = []; this.reset(); }
}
