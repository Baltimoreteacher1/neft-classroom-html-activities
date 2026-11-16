// Language Expeditions controls (feature "feel"): a gamepad, on-screen trail controls over the scene on phones, and
// the Sound toggle, all hooked into explore mode's drive() loop (language-expeditions-explore.js).
//
// Gamepad (standard mapping, polled once per animation frame): left stick or d-pad left/right walks, A (button 0)
// jumps, X (2) or B (1) opens a stop when the explorer is near it, exactly like the Open button. No gamepad: no-op.
// Phone controls (≤ 560px, walk mode): ◀ ▶ ▲ and Open as large buttons over the bottom of the scene. They sit in a
// sibling of the aria-hidden scene, are real labelled buttons, and share drive()'s press / release / tap handlers.
import { toHtml } from "../util.js";
import { html } from "./engine.js";
import {
  chime,
  resume,
  soundOn,
  stop as stopSound,
  toggle,
} from "./language-expeditions-feel-sound.js";

const soundLabel = (I, on) =>
  on ? I.T("Sound: on", "Sonido: activado") : I.T("Sound: off", "Sonido: desactivado");

/** The Sound toggle for the walk panel (off unless the learner turned it on on this device). */
export function soundBtnHTML(I) {
  const on = soundOn();
  return html`<button
    type="button"
    class="btn lexp-feel-sound"
    data-lexp-sound
    aria-pressed="${on ? "true" : "false"}"
  >
    <span data-lexp-sound-t>${soundLabel(I, on)}</span>
  </button>`;
}

/** Trail controls laid over the bottom of the scene; shown by CSS only on narrow screens. */
export function touchPadHTML(I, near) {
  return html`<div
    class="lexp-feel-tpad"
    role="group"
    aria-label="${I.S("Trail controls", "Controles del sendero")}"
  >
    <div class="lexp-feel-tpad-l">
      <button
        type="button"
        class="lexp-feel-tbtn"
        data-lexp-move="-1"
        aria-label="${I.S("Back", "Atrás")}"
      >
        <span aria-hidden="true">◀</span>
      </button>
      <button
        type="button"
        class="lexp-feel-tbtn"
        data-lexp-move="1"
        aria-label="${I.S("Ahead", "Adelante")}"
      >
        <span aria-hidden="true">▶</span>
      </button>
    </div>
    <div class="lexp-feel-tpad-r">
      <button
        type="button"
        class="lexp-feel-tbtn lexp-feel-topen"
        data-lexp-feel-open
        ${near ? "" : "hidden"}
      >
        ${I.T("Open", "Abrir")}
      </button>
      <button
        type="button"
        class="lexp-feel-tbtn"
        data-lexp-jump
        aria-label="${I.S("Jump", "Saltar")}"
      >
        <span aria-hidden="true">▲</span>
      </button>
    </div>
  </div>`;
}

/**
 * Hooks for drive(): `api` = { jump(), open() }. Returns { poll() -> -1|0|1, gathered(), near(bool), stop() }.
 */
export function feelDrive(root, band, I, api) {
  const toggleBtn = root.querySelector("[data-lexp-sound]");
  const openBtn = root.querySelector("[data-lexp-feel-open]");
  const onSound = () => {
    const on = toggle(band);
    toggleBtn?.setAttribute("aria-pressed", on ? "true" : "false");
    const t = toggleBtn?.querySelector("[data-lexp-sound-t]");
    if (t) t.innerHTML = toHtml(soundLabel(I, on));
  };
  const onOpen = () => api.open();
  toggleBtn?.addEventListener("click", onSound);
  openBtn?.addEventListener("click", onOpen);
  resume(band);

  let prevA = false;
  let prevO = false;
  return {
    poll() {
      const list =
        typeof navigator !== "undefined" && navigator.getGamepads ? navigator.getGamepads() : [];
      let p = null;
      for (const g of list || []) if (g?.connected && g.mapping === "standard") p = p || g;
      if (!p) return 0;
      const btn = (i) => Boolean(p.buttons[i]?.pressed);
      const ax = p.axes[0] || 0;
      const a = btn(0);
      if (a && !prevA) api.jump();
      prevA = a;
      const o = btn(2) || btn(1);
      if (o && !prevO) api.open();
      prevO = o;
      return btn(14) || ax < -0.5 ? -1 : btn(15) || ax > 0.5 ? 1 : 0;
    },
    gathered: () => chime(band),
    near(n) {
      if (openBtn) openBtn.hidden = !n;
    },
    stop() {
      toggleBtn?.removeEventListener("click", onSound);
      openBtn?.removeEventListener("click", onOpen);
      stopSound();
    },
  };
}
