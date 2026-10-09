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
  let toolbar, dialog, soundButton, motionButton, pauseButton, notice, sessionRail, ceremony;
  let audioCtx;
  const session = { correct: 0, attempts: 0, streak: 0, bestStreak: 0, mastered: false };
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
  function tone(kind) {
    if (preferences.muted) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      const now = audioCtx.currentTime + 0.01;
      const notes =
        kind === "good" ? [523, 659] : kind === "complete" ? [392, 523, 659] : [220, 196];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = kind === "coach" ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.0001, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.05, now + i * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.18);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.2);
      });
    } catch {}
  }
  function stars() {
    return [
      session.correct >= 3,
      session.bestStreak >= 3 || session.correct >= 8,
      session.mastered,
    ];
  }
  function renderSession() {
    if (!sessionRail) return;
    const earned = stars();
    const mark = Math.floor(session.correct / 5) * 5;
    const goal = mark + 5;
    const into = session.correct - mark;
    sessionRail.querySelector("[data-count]").textContent = `${session.correct} / ${goal} solved`;
    sessionRail.querySelector(".studio-meter i").style.width = `${(into / 5) * 100}%`;
    sessionRail.querySelector("[data-streak]").textContent =
      session.streak > 1 ? `Streak ${session.streak}` : "Streak ready";
    const starNode = sessionRail.querySelector("[data-stars]");
    starNode.textContent = earned.map((on) => (on ? "★" : "☆")).join("");
    starNode.setAttribute("aria-label", `${earned.filter(Boolean).length} of 3 stars`);
  }
  function noteFeedback(detail) {
    if (typeof detail?.correct !== "boolean") return false;
    session.attempts += 1;
    if (detail.correct) {
      session.correct += 1;
      session.streak += 1;
      session.bestStreak = Math.max(session.bestStreak, session.streak);
      tone("good");
    } else {
      session.streak = 0;
      tone("coach");
    }
    renderSession();
    return detail.correct && session.correct > 0 && session.correct % 5 === 0;
  }
  function noteComplete(detail) {
    const total = Number(detail?.total);
    const correct = Number(detail?.correct);
    const accuracy = Number(detail?.accuracy);
    const ratio = Number.isFinite(accuracy)
      ? accuracy / 100
      : Number.isFinite(total) && total > 0 && Number.isFinite(correct)
        ? correct / total
        : session.attempts
          ? session.correct / session.attempts
          : 0;
    const sample = Number.isFinite(total) && total > 0 ? total : session.attempts;
    if (sample >= 4 && ratio >= 0.8) session.mastered = true;
    renderSession();
    tone("complete");
    if (!ceremony) return;
    const earned = stars();
    const lines = [
      earned[0] ? "Star 1: three correct answers." : "Star 1 opens after three correct answers.",
      earned[1]
        ? "Star 2: a streak of three, or eight correct."
        : "Star 2 opens with a streak of three, or eight correct.",
      earned[2]
        ? "Star 3: at least 80% on a finished round."
        : "Star 3 opens at 80% on a finished round of four or more.",
    ];
    ceremony.replaceChildren();
    const title = document.createElement("h2");
    title.id = "studio-ceremony-title";
    title.textContent = earned.filter(Boolean).length
      ? `${earned.filter(Boolean).length} of 3 stars`
      : "Round complete";
    const score = document.createElement("p");
    score.textContent =
      detail?.message || "Round complete. Your stars stay with this game on this device.";
    const list = document.createElement("ul");
    lines.forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      list.append(li);
    });
    ceremony.append(
      title,
      score,
      list,
      button("Back to the game", () => ceremony.close()),
    );
    if (!ceremony.open) ceremony.showModal();
  }
  function announce(text, kind = "info") {
    if (!notice || !text) return;
    clearTimeout(notificationTimer);
    notice.textContent = text;
    notice.dataset.kind = kind;
    notice.hidden = false;
    notificationTimer = setTimeout(() => {
      notice.hidden = true;
    }, 2800);
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
        bestStars: Math.max(Number(previous.bestStars) || 0, stars().filter(Boolean).length),
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
    sessionRail = document.createElement("section");
    sessionRail.className = "studio-session";
    sessionRail.setAttribute("aria-label", "This round");
    sessionRail.innerHTML =
      '<p class="studio-objective"><span>Objective</span> <strong data-count>0 / 5 solved</strong><span class="studio-meter" aria-hidden="true"><i></i></span></p><p data-streak>Streak ready</p><p data-stars aria-label="0 of 3 stars">☆☆☆</p>';
    ceremony = document.createElement("dialog");
    ceremony.className = "studio-dialog studio-ceremony";
    ceremony.setAttribute("aria-labelledby", "studio-ceremony-title");
    ceremony.setAttribute("closedby", "closerequest");
    document.body.prepend(toolbar);
    toolbar.after(sessionRail);
    document.body.append(dialog, ceremony, notice);
    renderSession();
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
    get session() {
      return { ...session, stars: stars().filter(Boolean).length };
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
    const detail = /** @type {CustomEvent} */ (event).detail || {};
    const objective = noteFeedback(detail);
    if (detail.message) announce(detail.message, detail.correct ? "good" : "coach");
    if (objective)
      announce(
        `Objective complete: ${session.correct} solved. The next mark is ${session.correct + 5}.`,
        "good",
      );
  });
  document.addEventListener("game:complete", (event) => {
    const detail = /** @type {CustomEvent} */ (event).detail || {};
    noteComplete(detail);
    recordComplete(detail);
    const count =
      Number.isFinite(detail.correct) && Number.isFinite(detail.total) && detail.total > 0
        ? ` ${detail.correct} of ${detail.total} challenges solved.`
        : "";
    announce(detail.message || `Session complete.${count} Ready for another round?`, "complete");
  });
})();
