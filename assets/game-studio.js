/** Shared player controls. No network calls; saves only preferences and game totals. */
(() => {
  "use strict";
  const host = /** @type {any} */ (window);
  if (host.GameStudio) return;
  const KEY = "ewl-game-studio-v1";
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  let stored = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "{}");
    stored = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {}
  const preferences = {
    muted: typeof stored.muted === "boolean" ? stored.muted : true,
    reducedMotion: typeof stored.reducedMotion === "boolean" ? stored.reducedMotion : mq.matches,
    contrast: stored.contrast === true,
  };
  let adapter = {};
  let paused = false;
  let dialogPaused = false;
  let toolbar, dialog, soundButton, motionButton, pauseButton, notice;
  let notificationTimer;
  let previousFocus;
  const listeners = new EventTarget();
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(preferences));
    } catch {}
  }
  function apply() {
    host.NT_MUTED = preferences.muted;
    document.documentElement.classList.toggle("studio-reduced-motion", preferences.reducedMotion);
    document.documentElement.classList.toggle("studio-contrast", preferences.contrast);
    if (host.GameJuice?.SFX) host.GameJuice.SFX.setMuted(preferences.muted);
    if (host.GameFX?.AudioSynth) host.GameFX.AudioSynth.muted = preferences.muted;
    adapter.setMuted?.(preferences.muted);
    adapter.setMotion?.(preferences.reducedMotion);
    soundButton?.setAttribute("aria-pressed", String(!preferences.muted));
    if (soundButton) soundButton.textContent = preferences.muted ? "Sound off" : "Sound on";
    motionButton?.setAttribute("aria-pressed", String(preferences.reducedMotion));
    if (motionButton)
      motionButton.textContent = preferences.reducedMotion ? "Calm motion" : "Full motion";
    listeners.dispatchEvent(new CustomEvent("settings", { detail: { ...preferences } }));
  }
  function setPaused(value) {
    if (!adapter.pause || !adapter.resume || value === paused) return;
    paused = value;
    if (value) adapter.pause();
    else adapter.resume();
    document.documentElement.classList.toggle("studio-paused", paused);
    if (pauseButton) {
      pauseButton.textContent = paused ? "Resume" : "Pause";
      pauseButton.setAttribute("aria-pressed", String(paused));
    }
  }
  function button(text, action) {
    const el = document.createElement("button");
    el.type = "button";
    el.textContent = text;
    el.addEventListener("click", action);
    return el;
  }
  function checkbox(label, key) {
    const row = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = preferences[key];
    input.addEventListener("change", () => {
      preferences[key] = input.checked;
      save();
      apply();
    });
    row.append(input, document.createTextNode(label));
    return row;
  }
  function openDialog(mode) {
    if (!dialog || dialog.open) return;
    previousFocus = document.activeElement;
    dialogPaused = !paused && !!adapter.pause;
    if (dialogPaused) setPaused(true);
    dialog.replaceChildren();
    const title = document.createElement("h2");
    title.id = "studio-dialog-title";
    title.textContent = mode === "help" ? adapter.title || "How to play" : "Player settings";
    dialog.append(title);
    if (mode === "help") {
      const steps = document.createElement("ol");
      (adapter.instructions?.length
        ? adapter.instructions
        : [
            "Choose a practice level in the game. Read the challenge before making your move.",
            "Use the game controls to build or choose an answer. Take as much time as you need.",
            "Read the feedback, use a hint when available, and try again to strengthen your reasoning.",
          ]
      ).forEach((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        steps.append(li);
      });
      dialog.append(steps);
    } else {
      dialog.append(
        checkbox("Mute game audio", "muted"),
        checkbox("Reduce motion and celebrations", "reducedMotion"),
        checkbox("Stronger contrast", "contrast"),
      );
      const note = document.createElement("p");
      note.textContent =
        "Settings stay on this device and apply across the arcade. Your game progress uses the game's own save controls.";
      dialog.append(note);
    }
    dialog.append(button("Back to game", () => dialog.close()));
    dialog.showModal();
  }
  function announce(text, kind = "info") {
    if (!notice || !text) return;
    clearTimeout(notificationTimer);
    notice.textContent = text;
    notice.dataset.kind = kind;
    notice.hidden = false;
    notificationTimer = setTimeout(() => {
      notice.hidden = true;
    }, 4200);
  }
  function recordComplete(detail) {
    // A round score is a game result, not a claim of learning mastery.
    try {
      const raw = JSON.parse(localStorage.getItem("ewl-studio-play-record") || "{}");
      const path = location.pathname;
      const previous = raw[path] || {};
      raw[path] = {
        completed: Math.min(100000, (Number(previous.completed) || 0) + 1),
        lastPlayed: Date.now(),
        bestScore: Math.max(Number(previous.bestScore) || 0, Number(detail.score) || 0),
      };
      localStorage.setItem("ewl-studio-play-record", JSON.stringify(raw));
    } catch {}
  }
  function mount() {
    toolbar = document.createElement("nav");
    toolbar.className = "studio-toolbar";
    toolbar.setAttribute("aria-label", "Game player controls");
    const home = document.createElement("a");
    home.href = "/curriculum/arcade/";
    home.textContent = "← Games";
    toolbar.append(home);
    const controls = document.createElement("div");
    soundButton = button("Sound off", () => {
      preferences.muted = !preferences.muted;
      save();
      apply();
    });
    motionButton = button("Calm motion", () => {
      preferences.reducedMotion = !preferences.reducedMotion;
      save();
      apply();
    });
    pauseButton = button("Pause", () => setPaused(!paused));
    pauseButton.hidden = !adapter.pause || !adapter.resume;
    controls.append(
      button("How to play", () => openDialog("help")),
      soundButton,
      motionButton,
      button("Settings", () => openDialog("settings")),
      pauseButton,
    );
    toolbar.append(controls);
    dialog = document.createElement("dialog");
    dialog.className = "studio-dialog";
    dialog.setAttribute("aria-labelledby", "studio-dialog-title");
    dialog.setAttribute("closedby", "closerequest");
    dialog.addEventListener("close", () => {
      if (dialogPaused) setPaused(false);
      dialogPaused = false;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    });
    notice = document.createElement("div");
    notice.className = "studio-notice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    notice.hidden = true;
    document.body.prepend(toolbar);
    document.body.append(dialog, notice);
    apply();
  }
  const api = {
    register(options) {
      adapter = { ...adapter, ...options };
      if (pauseButton) pauseButton.hidden = !adapter.pause || !adapter.resume;
      apply();
    },
    get settings() {
      return { ...preferences };
    },
    get paused() {
      return paused;
    },
    emit(name, detail = {}) {
      document.dispatchEvent(new CustomEvent(`game:${name}`, { detail }));
    },
    onSettings(fn) {
      listeners.addEventListener("settings", fn);
    },
    setMuted(value) {
      preferences.muted = !!value;
      save();
      apply();
    },
    pause: () => setPaused(true),
    resume: () => setPaused(false),
    announce,
  };
  host.GameStudio = api;
  document.dispatchEvent(new CustomEvent("game:studio-ready"));
  apply();
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (adapter.pause && !paused) {
        setPaused(true);
        announce("Paused. Choose Resume when you return.");
      }
      host.GameJuice?.SFX?.musicStop();
    }
  });
  document.addEventListener("game:audio", (event) => {
    const value = !!(/** @type {CustomEvent} */ (event).detail?.muted);
    if (value !== preferences.muted) api.setMuted(value);
  });
  document.addEventListener("game:feedback", (event) => {
    const { correct, message } = /** @type {CustomEvent} */ (event).detail || {};
    if (message) announce(message, correct ? "good" : "coach");
  });
  document.addEventListener("game:complete", (event) => {
    const detail = /** @type {CustomEvent} */ (event).detail || {};
    recordComplete(detail);
    const count =
      Number.isFinite(detail.correct) && Number.isFinite(detail.total) && detail.total > 0
        ? ` ${detail.correct} of ${detail.total} challenges solved.`
        : "";
    announce(detail.message || `Session complete.${count} Ready for another round?`, "complete");
  });
})();
