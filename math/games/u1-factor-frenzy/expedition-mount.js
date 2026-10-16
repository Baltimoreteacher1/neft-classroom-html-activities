/* The Primekeeper — DOM entry point and accessible control deck for Factor Frenzy.
 *
 * Factor Frenzy is a DOM game, not Phaser, so the expedition runs in its own Phaser canvas
 * (EWLExpedition.mountStandalone) inside a panel that replaces the classic screens while
 * it is open. This file adds:
 *   - an "Expedition" button next to the classic start controls, and ?expedition=1;
 *   - the panel, mounted lazily on first open (the classic game never pays for Phaser);
 *   - a "Back to Factor Frenzy" control that sleeps the canvas and its keyboard;
 *   - a small accessible deck fed by the engine's `ewl:studio` event: prompt, status,
 *     an aria-live feedback line, and one real button per action.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  if (!X) return;
  const t = (v) => X.t(v);
  const UI = {
    entry: { en: "Expedition", es: "Expedición" },
    entryHint: {
      en: "Restore the mountain forge with factors, multiples and primes.",
      es: "Restaura la forja de la montaña con factores, múltiplos y primos.",
    },
    back: { en: "← Back to Factor Frenzy", es: "← Volver a Factor Frenzy" },
    heading: { en: "The Primekeeper — Expedition", es: "El Guardián de los Primos — Expedición" },
    controls: { en: "Expedition controls", es: "Controles de la expedición" },
    canvas: {
      en: "Expedition game board. Use the controls below the board or the keyboard.",
      es: "Tablero de la expedición. Usa los controles debajo del tablero o el teclado.",
    },
  };
  const CSS = `
#ffx-panel{display:none;margin:4px 0 24px}
#wrap.ffx-open>#ffx-panel{display:block}
#wrap.ffx-open>.screen{display:none!important}
#ffx-panel .ffx-top{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:10px}
#ffx-panel h1{font-size:clamp(1.25rem,3.4vw,1.8rem);color:#ffc779;margin:0}
#ffx-panel h1:focus{outline:none}
#ffx-panel .ffx-btn,.ffx-entry{font:700 1rem "Outfit","Segoe UI",system-ui,sans-serif;min-height:44px;padding:10px 18px;border-radius:12px;cursor:pointer;border:2px solid #ffc779;background:#2a1a12;color:#ffe3bf}
#ffx-panel .ffx-btn:hover,.ffx-entry:hover{background:#3a2416}
#ffx-panel .ffx-btn:focus-visible,.ffx-entry:focus-visible{outline:3px solid #ffd17b;outline-offset:3px}
.ffx-entry{display:inline-flex;align-items:center;gap:8px;margin:12px 0 0 12px;background:linear-gradient(180deg,#5a3418,#2a1a12)}
.ffx-entry small{display:block;font-weight:500;font-size:.82rem;color:#f0cfa8}
#ffx-stage{width:min(100%,calc((100dvh - 250px)*820/600));min-width:min(100%,320px);aspect-ratio:820/600;margin:0 auto;border-radius:14px;overflow:hidden;border:2px solid #5a3a22;background:#06121c}
#ffx-stage canvas{display:block}
#ffx-stage canvas:focus-visible{outline:3px solid #ffd17b;outline-offset:-3px}
#ffx-deck{max-width:960px;margin:12px auto 0;padding:12px 14px;border-radius:14px;background:rgba(26,16,22,.92);border:1px solid #5a3a22;color:#f3e6d8;font:16px/1.45 "Outfit","Segoe UI",system-ui,sans-serif}
#ffx-deck p{margin:0 0 6px}
#ffx-deck .ffx-prompt{font-weight:700;color:#fff}
#ffx-deck .ffx-status{color:#f0cfa8;font-size:.95rem}
#ffx-deck .ffx-fb{min-height:1.4em;color:#ffd9a8}
#ffx-deck .ffx-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
#ffx-deck .ffx-actions button{font:600 .95rem "Outfit","Segoe UI",system-ui,sans-serif;min-height:44px;min-width:44px;padding:8px 12px;border-radius:10px;border:1px solid #8a5a34;background:#2a1a12;color:#ffe3bf;cursor:pointer}
#ffx-deck .ffx-actions button:hover{background:#3a2416}
#ffx-deck .ffx-actions button:focus-visible{outline:3px solid #ffd17b;outline-offset:2px}
#ffx-deck .ffx-actions button:disabled{opacity:.45;cursor:default}
#ffx-deck kbd{font:600 .78rem ui-monospace,monospace;margin-left:6px;padding:1px 5px;border-radius:5px;background:#120a0e;border:1px solid #6a4a32;color:#f0cfa8}
@media (max-width:600px){#ffx-stage{width:100%}.ffx-entry{margin:12px 0 0}}
`;
  const KEY_NAMES = {
    ArrowRight: "→",
    ArrowLeft: "←",
    ArrowUp: "↑",
    ArrowDown: "↓",
    Enter: "Enter",
    Escape: "Esc",
    Backspace: "⌫",
  };

  function el(tag, attrs, text) {
    const n = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v));
    if (text != null) n.textContent = text;
    return n;
  }

  window.PK_MOUNT = function mount(def) {
    let game = null;
    let opener = null;
    let panel;
    let heading;
    let backBtn;
    let stage;
    let deck;
    const entries = [];

    /* ── Deck: render the engine's published state as real DOM controls ── */
    let last = null;
    let lastV = -1;
    function renderDeck(info) {
      if (!deck || !info) return;
      if (info === last && info.v === lastV) return;
      last = info;
      lastV = info.v;
      deck.prompt.textContent = info.prompt || "";
      deck.status.textContent = info.progress || "";
      if (deck.fb.textContent !== (info.feedback || "")) deck.fb.textContent = info.feedback || "";
      const active = document.activeElement;
      const hadFocus = active && deck.actions.contains(active);
      const focusKey = hadFocus ? active.dataset.key : null;
      const focusIdx = hadFocus ? [...deck.actions.children].indexOf(active) : -1;
      deck.actions.textContent = "";
      (info.actions || []).forEach((a) => {
        const b = el("button", { type: "button", "data-key": a.key });
        b.append(t(a.label));
        if (a.key)
          b.append(el("kbd", { "aria-hidden": "true" }, KEY_NAMES[a.key] || a.key.toUpperCase()));
        b.disabled = !!a.disabled;
        b.addEventListener("click", () => {
          if (!b.disabled) a.run();
        });
        deck.actions.append(b);
      });
      if (hadFocus) {
        const btns = [...deck.actions.children];
        const same = btns.find((b) => b.dataset.key === focusKey && !b.disabled);
        const next = same || btns[Math.min(focusIdx, btns.length - 1)];
        if (next) next.focus({ preventScroll: true });
        else stage?.querySelector("canvas")?.focus({ preventScroll: true });
      }
    }
    document.addEventListener("ewl:studio", (e) => {
      if (panel && document.getElementById("wrap")?.classList.contains("ffx-open"))
        renderDeck(e.detail);
    });

    function relabel() {
      if (!panel) return;
      heading.textContent = "🗺️ " + t(UI.heading);
      backBtn.textContent = t(UI.back);
      deck.root.setAttribute("aria-label", t(UI.controls));
      const canvas = stage.querySelector("canvas");
      if (canvas) canvas.setAttribute("aria-label", t(UI.canvas));
      entries.forEach((b) => {
        b.querySelector(".ffx-entry-label").textContent = t(UI.entry);
        b.querySelector("small").textContent = t(UI.entryHint);
      });
    }
    document.addEventListener("ewl:lang", relabel);

    function setKeyboard(on) {
      if (!game) return;
      try {
        if (game.input?.keyboard) game.input.keyboard.enabled = on;
        if (on) game.loop.wake();
        else game.loop.sleep();
      } catch (_e) {}
    }
    function open(from) {
      const wrap = document.getElementById("wrap");
      if (!wrap || !panel) return;
      opener = from || null;
      wrap.classList.add("ffx-open");
      if (!game) {
        game = X.mountStandalone(stage, def);
        game.events.once("ready", () => {
          const canvas = game.canvas;
          canvas.setAttribute("tabindex", "0");
          canvas.setAttribute("role", "application");
          canvas.setAttribute("aria-label", t(UI.canvas));
        });
      } else {
        setKeyboard(true);
        game.scale.refresh();
        const s = game.scene.getScenes(true)[0];
        if (s?.studio) {
          last = null;
          renderDeck(s.studio);
        }
      }
      heading.focus({ preventScroll: true });
      panel.scrollIntoView({ block: "start" });
    }
    function close() {
      const wrap = document.getElementById("wrap");
      if (!wrap) return;
      setKeyboard(false);
      X.audio.stopMusic();
      wrap.classList.remove("ffx-open");
      (opener || entries[0])?.focus({ preventScroll: true });
    }

    function build() {
      const wrap = document.getElementById("wrap");
      if (!wrap || document.getElementById("ffx-panel")) return;
      const style = el("style", { id: "ffx-style" });
      style.textContent = CSS;
      document.head.append(style);
      panel = el("section", { id: "ffx-panel", "aria-labelledby": "ffx-h" });
      const top = el("div", { class: "ffx-top" });
      heading = el("h1", { id: "ffx-h", tabindex: "-1" });
      backBtn = el("button", { type: "button", class: "ffx-btn" });
      backBtn.addEventListener("click", close);
      top.append(heading, backBtn);
      stage = el("div", { id: "ffx-stage" });
      const root = el("div", { id: "ffx-deck", role: "group" });
      deck = {
        root,
        prompt: el("p", { class: "ffx-prompt" }),
        status: el("p", { class: "ffx-status" }),
        fb: el("p", { class: "ffx-fb", "aria-live": "polite" }),
        actions: el("div", { class: "ffx-actions" }),
      };
      root.append(deck.prompt, deck.status, deck.fb, deck.actions);
      // Enter/Space on a deck button is that button's click; keep the canvas from also
      // acting on the same key (the engine listens for keys on the window).
      root.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target.tagName === "BUTTON")
          e.stopPropagation();
      });
      panel.append(top, stage, root);
      const anchor = document.getElementById("arcade-controls-host");
      if (anchor) anchor.after(panel);
      else wrap.prepend(panel);

      // Entry buttons next to the classic start controls.
      ["vocab-go", "level-auto"].forEach((id) => {
        const near = document.getElementById(id);
        if (!near) return;
        const b = el("button", { type: "button", class: "ffx-entry" });
        const span = el("span", {});
        span.append(
          el("span", { "aria-hidden": "true" }, "🗺️ "),
          el("span", { class: "ffx-entry-label" }),
        );
        span.append(el("small", {}));
        b.append(span);
        b.addEventListener("click", () => open(b));
        near.after(b);
        entries.push(b);
      });
      relabel();
      if (/[?&]expedition=1\b/.test(location.search)) open(null);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
    else build();
    return { open, close };
  };
})();
