// Input manager: keyboard, touch and gamepad all reduce to one bitmask per tick
// (see IN in sim.js), which is what the simulation records and replays.
// Bindings are remappable and saved with the player's settings.

import { IN } from "./sim.js";

export const ACTIONS = ["LEFT", "RIGHT", "UP", "DOWN", "JUMP", "DASH", "ACT"];

export const DEFAULT_KEYS = {
  LEFT: ["ArrowLeft", "KeyA"],
  RIGHT: ["ArrowRight", "KeyD"],
  UP: ["ArrowUp", "KeyW"],
  DOWN: ["ArrowDown", "KeyS"],
  JUMP: ["Space", "KeyK"],
  DASH: ["ShiftLeft", "KeyJ"],
  ACT: ["KeyE", "Enter"],
};

// Standard-mapping gamepad buttons.
const PAD = { JUMP: 0, DASH: 2, ACT: 1, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };

export class Input {
  /** @param {HTMLElement} host element that owns keyboard focus for play */
  constructor(host, keys) {
    this.host = host;
    this.keys = structuredClone(keys || DEFAULT_KEYS);
    this.down = new Set();
    this.touch = 0;
    this.enabled = true;
    /** One-shot system presses the shell reads: "pause" | "rewind" | "shift" | "switch". */
    this.system = [];
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    host.addEventListener("keydown", this.onKeyDown);
    host.addEventListener("keyup", this.onKeyUp);
    host.addEventListener("blur", () => this.release());
    window.addEventListener("blur", () => this.release());
  }

  release() {
    this.down.clear();
    this.touch = 0;
  }

  onKeyDown(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!this.enabled) return;
    if (!e.repeat) {
      if (e.code === "KeyR") this.system.push("rewind");
      if (e.code === "KeyQ") this.system.push("shift");
      if (e.code === "Tab" && this.capturesTab) this.system.push("switch");
    }
    if (this.bound(e.code)) {
      this.down.add(e.code);
      e.preventDefault();
    }
  }

  onKeyUp(e) {
    this.down.delete(e.code);
  }

  bound(code) {
    for (const a of ACTIONS) if (this.keys[a].includes(code)) return true;
    return false;
  }

  /** Rebind one action to one key; any other action holding that key loses it. */
  rebind(action, code) {
    for (const a of ACTIONS) this.keys[a] = this.keys[a].filter((c) => c !== code);
    this.keys[action] = [code];
  }

  /** Touch controls call these with an IN bit. */
  press(bit) {
    this.touch |= bit;
  }

  lift(bit) {
    this.touch &= ~bit;
  }

  /** The bitmask for this tick. */
  mask() {
    if (!this.enabled) return 0;
    let m = this.touch;
    for (const a of ACTIONS) {
      const codes = this.keys[a];
      for (let i = 0; i < codes.length; i++)
        if (this.down.has(codes[i])) {
          m |= IN[a];
          break;
        }
    }
    const pads = navigator.getGamepads ? navigator.getGamepads() : null;
    if (pads) {
      for (let p = 0; p < pads.length; p++) {
        const pad = pads[p];
        if (!pad || !pad.connected) continue;
        for (const a of ACTIONS) if (pad.buttons[PAD[a]]?.pressed) m |= IN[a];
        const x = pad.axes[0] || 0;
        const y = pad.axes[1] || 0;
        if (x < -0.4) m |= IN.LEFT;
        if (x > 0.4) m |= IN.RIGHT;
        if (y < -0.5) m |= IN.UP;
        if (y > 0.5) m |= IN.DOWN;
        if (pad.buttons[9]?.pressed && !this.padStart) this.system.push("pause");
        this.padStart = !!pad.buttons[9]?.pressed;
      }
    }
    return m;
  }

  takeSystem() {
    return this.system.shift();
  }
}

/** Human-readable name for a KeyboardEvent.code, for the controls menu and hints. */
export function keyName(code) {
  if (!code) return "";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Arrow")) return { Left: "←", Right: "→", Up: "↑", Down: "↓" }[code.slice(5)];
  if (code.startsWith("Shift")) return "Shift";
  return code;
}
