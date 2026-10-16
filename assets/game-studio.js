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
  let toolbar,
    dialog,
    soundButton,
    motionButton,
    pauseButton,
    notice,
    sessionRail,
    ceremony,
    helpButton,
    settingsButton,
    brandEl;
  let audioCtx;
  const session = { correct: 0, attempts: 0, streak: 0, bestStreak: 0, mastered: false };
  let notificationTimer;
  let previousFocus;
  const listeners = new EventTarget();
  // Spanish follows the site-wide language key; read at call time so a switch applies without a reload.
  const isEs = () => {
    try {
      return localStorage.getItem("nt-lang") === "es";
    } catch {
      return false;
    }
  };
  const T = (en, es) => (isEs() ? es : en);
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
    if (soundButton)
      soundButton.textContent = preferences.muted
        ? T("Sound off", "Sonido apagado")
        : T("Sound on", "Sonido activado");
    motionButton?.setAttribute("aria-pressed", String(preferences.reducedMotion));
    if (motionButton)
      motionButton.textContent = preferences.reducedMotion
        ? T("Calm motion", "Movimiento calmado")
        : T("Full motion", "Movimiento completo");
    relabel();
    listeners.dispatchEvent(new CustomEvent("settings", { detail: { ...preferences } }));
  }
  // Re-label the static controls when the language changes (no reload needed).
  function relabel() {
    if (!toolbar) return;
    toolbar.setAttribute(
      "aria-label",
      T("Game player controls", "Controles del reproductor del juego"),
    );
    if (brandEl && !adapter.title) brandEl.textContent = T("Arcade Studio", "Estudio Arcade");
    if (helpButton) helpButton.textContent = T("How to play", "Cómo jugar");
    if (settingsButton) settingsButton.textContent = T("Settings", "Ajustes");
    if (pauseButton)
      pauseButton.textContent = paused ? T("Resume", "Continuar") : T("Pause", "Pausa");
    if (sessionRail) {
      sessionRail.setAttribute("aria-label", T("This round", "Esta ronda"));
      const label = sessionRail.querySelector("[data-objective]");
      if (label) label.textContent = T("Objective", "Objetivo");
      renderSession();
    }
    document.documentElement.lang = isEs() ? "es" : document.documentElement.lang;
  }
  function setPaused(value) {
    if (!adapter.pause || !adapter.resume || value === paused) return;
    paused = value;
    if (value) adapter.pause();
    else adapter.resume();
    document.documentElement.classList.toggle("studio-paused", paused);
    if (pauseButton) {
      pauseButton.textContent = paused ? T("Resume", "Continuar") : T("Pause", "Pausa");
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
    title.textContent =
      mode === "help"
        ? adapter.title || T("How to play", "Cómo jugar")
        : T("Player settings", "Ajustes del jugador");
    dialog.append(title);
    if (mode === "help") {
      const steps = document.createElement("ol");
      (adapter.instructions?.length
        ? adapter.instructions
        : [
            T(
              "Choose a practice level in the game. Read the challenge before making your move.",
              "Elige un nivel de práctica en el juego. Lee el reto antes de hacer tu jugada.",
            ),
            T(
              "Use the game controls to build or choose an answer. Take as much time as you need.",
              "Usa los controles del juego para armar o elegir una respuesta. Tómate el tiempo que necesites.",
            ),
            T(
              "Read the feedback, use a hint when available, and try again to strengthen your reasoning.",
              "Lee los comentarios, usa una pista cuando haya y vuelve a intentarlo para fortalecer tu razonamiento.",
            ),
          ]
      ).forEach((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        steps.append(li);
      });
      dialog.append(steps);
    } else {
      dialog.append(
        checkbox(T("Mute game audio", "Silenciar el audio del juego"), "muted"),
        checkbox(
          T("Reduce motion and celebrations", "Reducir el movimiento y las celebraciones"),
          "reducedMotion",
        ),
        checkbox(T("Stronger contrast", "Mayor contraste"), "contrast"),
      );
      const note = document.createElement("p");
      note.textContent = T(
        "Settings stay on this device and apply across the arcade. Your game progress uses the game's own save controls.",
        "Los ajustes se quedan en este dispositivo y se aplican en todo el arcade. El progreso de tu juego usa los controles de guardado del propio juego.",
      );
      dialog.append(note);
    }
    dialog.append(button(T("Back to game", "Volver al juego"), () => dialog.close()));
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
    sessionRail.querySelector("[data-count]").textContent =
      `${session.correct} / ${goal} ${T("solved", "resueltas")}`;
    sessionRail.querySelector(".studio-meter i").style.width = `${(into / 5) * 100}%`;
    sessionRail.querySelector("[data-streak]").textContent =
      session.streak > 1
        ? `${T("Streak", "Racha")} ${session.streak}`
        : T("Streak ready", "Racha lista");
    const starNode = sessionRail.querySelector("[data-stars]");
    starNode.textContent = earned.map((on) => (on ? "★" : "☆")).join("");
    starNode.setAttribute(
      "aria-label",
      T(
        `${earned.filter(Boolean).length} of 3 stars`,
        `${earned.filter(Boolean).length} de 3 estrellas`,
      ),
    );
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
      earned[0]
        ? T("Star 1: three correct answers.", "Estrella 1: tres respuestas correctas.")
        : T(
            "Star 1 opens after three correct answers.",
            "La estrella 1 se abre con tres respuestas correctas.",
          ),
      earned[1]
        ? T(
            "Star 2: a streak of three, or eight correct.",
            "Estrella 2: una racha de tres, u ocho correctas.",
          )
        : T(
            "Star 2 opens with a streak of three, or eight correct.",
            "La estrella 2 se abre con una racha de tres, u ocho correctas.",
          ),
      earned[2]
        ? T(
            "Star 3: at least 80% on a finished round.",
            "Estrella 3: al menos 80% en una ronda terminada.",
          )
        : T(
            "Star 3 opens at 80% on a finished round of four or more.",
            "La estrella 3 se abre con 80% en una ronda terminada de cuatro o más.",
          ),
    ];
    ceremony.replaceChildren();
    const title = document.createElement("h2");
    title.id = "studio-ceremony-title";
    title.textContent = earned.filter(Boolean).length
      ? T(
          `${earned.filter(Boolean).length} of 3 stars`,
          `${earned.filter(Boolean).length} de 3 estrellas`,
        )
      : T("Round complete", "Ronda completa");
    const score = document.createElement("p");
    score.textContent =
      detail?.message ||
      T(
        "Round complete. Your stars stay with this game on this device.",
        "Ronda completa. Tus estrellas se quedan con este juego en este dispositivo.",
      );
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
      button(T("Back to the game", "Volver al juego"), () => ceremony.close()),
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
    toolbar.setAttribute(
      "aria-label",
      T("Game player controls", "Controles del reproductor del juego"),
    );
    const brand = document.createElement("span");
    brand.className = "studio-badge";
    brand.textContent = adapter.title || T("Arcade Studio", "Estudio Arcade");
    brandEl = brand;
    toolbar.append(brand);
    const controls = document.createElement("div");
    soundButton = button(T("Sound off", "Sonido apagado"), () => {
      preferences.muted = !preferences.muted;
      save();
      apply();
    });
    motionButton = button(T("Calm motion", "Movimiento calmado"), () => {
      preferences.reducedMotion = !preferences.reducedMotion;
      save();
      apply();
    });
    pauseButton = button(T("Pause", "Pausa"), () => setPaused(!paused));
    pauseButton.hidden = !adapter.pause || !adapter.resume;
    helpButton = button(T("How to play", "Cómo jugar"), () => openDialog("help"));
    settingsButton = button(T("Settings", "Ajustes"), () => openDialog("settings"));
    controls.append(helpButton, soundButton, motionButton, settingsButton, pauseButton);
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
    sessionRail.setAttribute("aria-label", T("This round", "Esta ronda"));
    sessionRail.innerHTML =
      '<p class="studio-objective"><span data-objective>Objective</span> <strong data-count>0 / 5 solved</strong><span class="studio-meter" aria-hidden="true"><i></i></span></p><p data-streak>Streak ready</p><p data-stars aria-label="0 of 3 stars">☆☆☆</p>';
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
  window.addEventListener("storage", (event) => {
    if (event.key === "nt-lang") {
      relabel();
      apply();
    }
  });
  document.addEventListener("ewl:lang", () => {
    relabel();
    apply();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (adapter.pause && !paused) {
        setPaused(true);
        announce(
          T("Paused. Choose Resume when you return.", "En pausa. Elige Continuar cuando vuelvas."),
        );
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
        T(
          `Objective complete: ${session.correct} solved. The next mark is ${session.correct + 5}.`,
          `Objetivo cumplido: ${session.correct} resueltas. La siguiente meta es ${session.correct + 5}.`,
        ),
        "good",
      );
  });
  document.addEventListener("game:complete", (event) => {
    const detail = /** @type {CustomEvent} */ (event).detail || {};
    noteComplete(detail);
    recordComplete(detail);
    const count =
      Number.isFinite(detail.correct) && Number.isFinite(detail.total) && detail.total > 0
        ? T(
            ` ${detail.correct} of ${detail.total} challenges solved.`,
            ` ${detail.correct} de ${detail.total} retos resueltos.`,
          )
        : "";
    announce(
      detail.message ||
        T(
          `Session complete.${count} Ready for another round?`,
          `Sesión completa.${count} ¿Listo para otra ronda?`,
        ),
      "complete",
    );
  });
})();
