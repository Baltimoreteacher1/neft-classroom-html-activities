/** Shared player controls, fixed-timestep loop, EduWonderAudio synth, CDDA & BioAdaptiveFlow.
 * No network calls; saves only preferences and game totals locally. */
(() => {
  "use strict";
  const host = /** @type {any} */ (window);
  if (host.GameStudio) return;

  const KEY = "ewl-game-studio-v1";
  const KEY_V2 = "eduwonder_games_v2";
  const KEY_MASTER_V3 = "eduwonder_master_v3";
  const DT_FIXED = 1000 / 60;
  const MAX_DELTA_MS = 50;

  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  /** @type {any} */
  let stored = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "{}");
    stored = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {}

  const preferences = {
    muted: typeof stored.muted === "boolean" ? stored.muted : true,
    reducedMotion:
      typeof stored.reducedMotion === "boolean"
        ? stored.reducedMotion
        : typeof stored.calm === "boolean"
          ? stored.calm
          : mq.matches,
    contrast: stored.contrast === true,
  };

  /** @type {any} */
  let adapter = {};
  let paused = false;
  let dialogPaused = false;
  /** @type {HTMLElement | undefined} */
  let toolbar;
  /** @type {HTMLDialogElement | undefined} */
  let dialog;
  /** @type {HTMLButtonElement | undefined} */
  let soundButton;
  /** @type {HTMLButtonElement | undefined} */
  let motionButton;
  /** @type {HTMLButtonElement | undefined} */
  let pauseButton;
  /** @type {HTMLButtonElement | undefined} */
  let fullscreenButton;
  /** @type {HTMLElement | undefined} */
  let notice;
  /** @type {HTMLElement | undefined} */
  let sessionRail;
  /** @type {HTMLDialogElement | undefined} */
  let ceremony;
  /** @type {HTMLButtonElement | undefined} */
  let helpButton;
  /** @type {HTMLButtonElement | undefined} */
  let settingsButton;
  /** @type {HTMLElement | undefined} */
  let brandEl;
  /** @type {HTMLElement | undefined} */
  let rewindBanner;
  /** @type {HTMLElement | undefined} */
  let scaffoldOverlay;
  /** @type {HTMLElement | undefined} */
  let diagnosticsEl;

  const session = {
    correct: 0,
    attempts: 0,
    streak: 0,
    bestStreak: 0,
    score: 0,
    level: 1,
    mastered: false,
  };

  /** @type {any} */
  let notificationTimer;
  /** @type {any} */
  let rewindCleanupHandle;
  /** @type {Element | null | undefined} */
  let previousFocus;
  const listeners = new EventTarget();

  // ── Central Disposable Registry (Zero Memory Leaks) ──────────────────────
  const disposables = {
    rafs: new Set(),
    intervals: new Set(),
    timeouts: new Set(),
    /** @type {Array<{target: EventTarget, type: string, fn: EventListenerOrEventListenerObject, options?: any, scope: string}>} */
    domListeners: [],
  };

  /**
   * @param {FrameRequestCallback} fn
   */
  function trackRaf(fn) {
    const id = requestAnimationFrame((ts) => {
      disposables.rafs.delete(id);
      fn(ts);
    });
    disposables.rafs.add(id);
    return id;
  }

  /**
   * @param {number} id
   */
  function cancelTrackedRaf(id) {
    cancelAnimationFrame(id);
    disposables.rafs.delete(id);
  }

  /**
   * @param { TimerHandler } fn
   * @param { number } ms
   */
  function trackInterval(fn, ms) {
    const id = setInterval(fn, ms);
    disposables.intervals.add(id);
    return id;
  }

  /**
   * @param { TimerHandler } fn
   * @param { number } ms
   */
  function trackTimeout(fn, ms) {
    const id = setTimeout(() => {
      disposables.timeouts.delete(id);
      if (typeof fn === "function") fn();
    }, ms);
    disposables.timeouts.add(id);
    return id;
  }

  /**
   * @param {EventTarget} target
   * @param {string} type
   * @param {any} fn
   * @param {any} [options]
   * @param {string} [scope]
   */
  function trackListener(target, type, fn, options, scope = "session") {
    if (!target || typeof target.addEventListener !== "function") return;
    target.addEventListener(type, fn, options);
    disposables.domListeners.push({ target, type, fn, options, scope });
  }

  /**
   * @param {string} [scope]
   */
  function cleanupDisposables(scope) {
    if (!scope || scope === "all") {
      disposables.rafs.forEach((id) => cancelAnimationFrame(id));
      disposables.rafs.clear();
      disposables.intervals.forEach((id) => clearInterval(id));
      disposables.intervals.clear();
      disposables.timeouts.forEach((id) => clearTimeout(id));
      disposables.timeouts.clear();
      while (disposables.domListeners.length) {
        const item = disposables.domListeners.pop();
        if (item) item.target.removeEventListener(item.type, item.fn, item.options);
      }
      return;
    }
    for (let i = disposables.domListeners.length - 1; i >= 0; i--) {
      const item = disposables.domListeners[i];
      if (item.scope === scope) {
        item.target.removeEventListener(item.type, item.fn, item.options);
        disposables.domListeners.splice(i, 1);
      }
    }
  }

  // ── Language Helper ──────────────────────────────────────────────────────
  const isEs = () => {
    try {
      return localStorage.getItem("nt-lang") === "es";
    } catch {
      return false;
    }
  };
  /**
   * @param {string} en
   * @param {string} es
   */
  const T = (en, es) => (isEs() ? es : en);

  // ── Deterministic Finite State Machine (FSM) ─────────────────────────────
  const FSM_STATES = new Set([
    "BOOT",
    "TITLE/SELECT",
    "TUTORIAL/WARMUP",
    "PLAYING",
    "REWIND/HINT",
    "LEVEL_COMPLETE",
    "SUMMARY",
  ]);

  const fsm = {
    state: "BOOT",
    /** @type {Array<{from: string, to: string, at: number, reason: string}>} */
    history: [],
    /**
     * @param {string} nextState
     * @param {string} [reason]
     */
    transition(nextState, reason = "") {
      if (!FSM_STATES.has(nextState)) return this.state;
      const prev = this.state;
      if (prev === nextState) return prev;
      this.state = nextState;
      this.history.push({
        from: prev,
        to: nextState,
        at: Math.round(performance.now()),
        reason: reason || "auto",
      });
      if (this.history.length > 30) this.history.shift();
      if (document.body) {
        document.body.dataset.gameFsmState = nextState;
      }
      cleanupDisposables("state");
      renderDiagnostics();
      document.dispatchEvent(
        new CustomEvent("game:fsm", { detail: { from: prev, to: nextState, reason } }),
      );
      return nextState;
    },
  };

  // ── Zero-Asset Web Audio API Sound Engine (EduWonderAudio) ───────────────
  const PENTATONIC_HZ = [523.25, 587.33, 659.25, 783.99, 1046.5];
  const CHORD_SWELL_HZ = [261.63, 329.63, 392.0, 523.25, 659.25];
  /** @type {AudioContext | undefined} */
  let audioCtx;

  const EduWonderAudio = {
    tempoScale: 1.0,
    harmonicRichness: 1,
    get muted() {
      return preferences.muted;
    },
    set muted(val) {
      preferences.muted = !!val;
    },
    ensureContext() {
      if (preferences.muted) return null;
      try {
        const AudioContextClass = window.AudioContext || host.webkitAudioContext;
        if (!AudioContextClass) return null;
        audioCtx = audioCtx || new AudioContextClass();
        if (audioCtx.state === "suspended") {
          audioCtx.resume().catch(() => {});
        }
        return audioCtx;
      } catch {
        return null;
      }
    },
    /**
     * Pentatonic scale ascending sine-wave arpeggio (150ms harmonic envelope).
     * Tempo scales +10% in Mastery Flow State.
     * @param {number} [streakCount]
     */
    playCorrect(streakCount = session.streak) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      try {
        const tempo = streakCount >= 3 || this.tempoScale > 1 ? 1.1 : 1.0;
        const stepGap = 0.055 / tempo;
        const envDur = 0.15 / tempo;
        const now = ctx.currentTime + 0.01;
        const count = Math.min(PENTATONIC_HZ.length, streakCount >= 3 ? 5 : 4);
        for (let i = 0; i < count; i++) {
          const freq = PENTATONIC_HZ[i];
          const t0 = now + i * stepGap;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t0);
          gain.gain.setValueAtTime(0.0001, t0);
          gain.gain.exponentialRampToValueAtTime(0.055, t0 + 0.018);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + envDur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t0);
          osc.stop(t0 + envDur + 0.02);

          if (this.harmonicRichness > 1 || streakCount >= 3) {
            const harm = ctx.createOscillator();
            const hGain = ctx.createGain();
            harm.type = "triangle";
            harm.frequency.setValueAtTime(freq * 1.5, t0);
            hGain.gain.setValueAtTime(0.0001, t0);
            hGain.gain.exponentialRampToValueAtTime(0.018, t0 + 0.02);
            hGain.gain.exponentialRampToValueAtTime(0.0001, t0 + envDur);
            harm.connect(hGain);
            hGain.connect(ctx.destination);
            harm.start(t0);
            harm.stop(t0 + envDur + 0.02);
          }
        }
      } catch {}
    },
    /**
     * Low-frequency triangle wave sweep (220 -> 130 Hz) with gentle BiquadFilter
     * low-pass filtering (zero harsh buzzers).
     */
    playRewind() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime + 0.01;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(130, now + 0.24);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(520, now);
        filter.Q.setValueAtTime(0.7, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.05, now + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      } catch {}
    },
    playIncorrect() {
      this.playRewind();
    },
    /**
     * Ambient chord swell via polyphonic oscillators, with +10% tempo scaling in Mastery Flow State.
     * @param {number} [streakCount]
     */
    playStreakMilestone(streakCount = session.streak) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      try {
        const tempo = streakCount >= 3 || this.tempoScale > 1 ? 1.1 : 1.0;
        const swellDur = 0.42 / tempo;
        const now = ctx.currentTime + 0.01;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1600, now);
        filter.connect(ctx.destination);

        CHORD_SWELL_HZ.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = i % 2 === 0 ? "sine" : "triangle";
          osc.frequency.setValueAtTime(freq, now + i * (0.03 / tempo));
          gain.gain.setValueAtTime(0.0001, now + i * (0.03 / tempo));
          gain.gain.exponentialRampToValueAtTime(0.032, now + i * (0.03 / tempo) + 0.08 / tempo);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * (0.03 / tempo) + swellDur);
          osc.connect(gain);
          gain.connect(filter);
          osc.start(now + i * (0.03 / tempo));
          osc.stop(now + i * (0.03 / tempo) + swellDur + 0.03);
        });
      } catch {}
    },
    playComplete() {
      this.playCorrect(5);
      this.playStreakMilestone(5);
    },
  };
  host.EduWonderAudio = EduWonderAudio;

  /**
   * @param {string} kind
   */
  function tone(kind) {
    if (preferences.muted) return;
    if (kind === "good") {
      EduWonderAudio.playCorrect(session.streak);
      if (session.streak >= 3 && (session.streak === 3 || session.streak % 5 === 0)) {
        EduWonderAudio.playStreakMilestone(session.streak);
      }
    } else if (kind === "complete") {
      EduWonderAudio.playComplete();
    } else {
      EduWonderAudio.playRewind();
    }
  }

  // ── BioAdaptiveFlow (Ambient Attention Flow Engine) ──────────────────────
  const BioAdaptiveFlow = {
    state: "balanced", // 'flow' | 'overload' | 'balanced'
    cadenceMs: 1200,
    inputVelocityPxPerMs: 0,
    clickDispersionPx: 0,
    lastInputStamp: performance.now(),
    lastPointerPos: { x: 0, y: 0, t: 0 },
    /** @type {Array<{x: number, y: number, t: number}>} */
    recentClicks: [],
    /**
     * @param {number} x
     * @param {number} y
     */
    recordPointerDown(x, y) {
      const now = performance.now();
      const dt = Math.max(1, now - this.lastInputStamp);
      this.cadenceMs = Math.round(this.cadenceMs * 0.65 + dt * 0.35);
      this.lastInputStamp = now;
      this.recentClicks.push({ x, y, t: now });
      while (this.recentClicks.length > 0 && now - this.recentClicks[0].t > 1400) {
        this.recentClicks.shift();
      }
      if (this.recentClicks.length >= 2) {
        let sumDist = 0;
        for (let i = 1; i < this.recentClicks.length; i++) {
          const dx = this.recentClicks[i].x - this.recentClicks[i - 1].x;
          const dy = this.recentClicks[i].y - this.recentClicks[i - 1].y;
          sumDist += Math.hypot(dx, dy);
        }
        this.clickDispersionPx = Math.round(sumDist / (this.recentClicks.length - 1));
      } else {
        this.clickDispersionPx = 0;
      }
      this.evaluate();
    },
    /**
     * @param {number} x
     * @param {number} y
     */
    recordPointerMove(x, y) {
      const now = performance.now();
      const dt = now - this.lastPointerPos.t;
      if (dt > 8 && this.lastPointerPos.t > 0) {
        const dist = Math.hypot(x - this.lastPointerPos.x, y - this.lastPointerPos.y);
        const v = dist / dt;
        this.inputVelocityPxPerMs = Number((this.inputVelocityPxPerMs * 0.8 + v * 0.2).toFixed(2));
      }
      this.lastPointerPos = { x, y, t: now };
    },
    evaluate() {
      const cddaMisses = host.NTAdaptive?.cdda?.misses || 0;
      const frantic = this.recentClicks.length >= 5 && this.clickDispersionPx > 95;
      const accuracy = session.attempts > 0 ? session.correct / session.attempts : 1;
      let next = "balanced";
      if (frantic || cddaMisses >= 2) {
        next = "overload";
      } else if (
        session.streak >= 2 &&
        accuracy >= 0.8 &&
        this.cadenceMs >= 350 &&
        this.cadenceMs <= 8000
      ) {
        next = "flow";
      }
      this.setState(next);
      return this.state;
    },
    /**
     * @param {string} next
     */
    setState(next) {
      if (next !== "flow" && next !== "overload" && next !== "balanced") return;
      const changed = this.state !== next;
      this.state = next;
      EduWonderAudio.tempoScale = next === "flow" || session.streak >= 3 ? 1.1 : 1.0;
      EduWonderAudio.harmonicRichness = next === "flow" ? 2 : 1;
      if (document.body) {
        document.body.dataset.bioFlow = next;
        if (next === "overload") {
          document.documentElement.style.setProperty("--gs-hitbox-scale", "1.25");
        } else {
          document.documentElement.style.setProperty("--gs-hitbox-scale", "1");
        }
      }
      if (changed) {
        document.dispatchEvent(
          new CustomEvent("game:bio-flow", {
            detail: {
              state: next,
              cadenceMs: this.cadenceMs,
              clickDispersionPx: this.clickDispersionPx,
            },
          }),
        );
      }
      renderDiagnostics();
    },
  };
  host.BioAdaptiveFlow = BioAdaptiveFlow;

  // ── 60 FPS Fixed-Timestep Loop & Phaser Delta Clamping ───────────────────
  let rollingFps = 60;
  let lastFrameStamp = performance.now();
  let lastInputLatencyMs = 4;

  /**
   * Creates a deterministic 60 FPS fixed-timestep loop with delta clamping (<= 50ms).
   * @param {(dtSec: number, dtMs: number) => void} updateFn
   * @param {(alpha: number, clampedDtMs: number) => void} [renderFn]
   */
  function createFixedLoop(updateFn, renderFn) {
    let running = true;
    let rafId = 0;
    let prev = performance.now();
    let accumulator = 0;

    function tick(now) {
      if (!running) return;
      const rawDt = now - prev;
      prev = now;
      if (rawDt > 0) {
        const instFps = 1000 / Math.max(1, rawDt);
        rollingFps = Math.round(rollingFps * 0.9 + Math.min(120, instFps) * 0.1);
      }
      if (!paused && !document.hidden) {
        const clamped = Math.min(Math.max(0, rawDt), MAX_DELTA_MS);
        accumulator += clamped;
        let steps = 0;
        while (accumulator >= DT_FIXED && steps < 4) {
          if (typeof updateFn === "function") updateFn(DT_FIXED / 1000, DT_FIXED);
          accumulator -= DT_FIXED;
          steps += 1;
        }
        if (typeof renderFn === "function") {
          renderFn(accumulator / DT_FIXED, clamped);
        }
      }
      rafId = trackRaf(tick);
    }

    rafId = trackRaf(tick);
    return {
      DT_FIXED,
      MAX_DELTA_MS,
      stop() {
        running = false;
        cancelTrackedRaf(rafId);
      },
      dispose() {
        running = false;
        cancelTrackedRaf(rafId);
      },
    };
  }

  /**
   * Patches Phaser scenes or Scene.prototype so update(time, delta) clamps delta <= 50ms.
   * @param {any} [target]
   */
  function patchPhaserDeltaClamp(target) {
    try {
      const P = target || host.Phaser;
      if (P?.Scene?.prototype && !P.Scene.prototype.__gsDeltaClamped) {
        P.Scene.prototype.__gsDeltaClamped = true;
      }
      const games = [];
      if (target?.scene?.scenes) games.push(target);
      if (P?.GAMES && Array.isArray(P.GAMES)) games.push(...P.GAMES);
      if (host.__flagshipGame) games.push(host.__flagshipGame);
      if (host.game?.scene?.scenes) games.push(host.game);
      games.forEach((g) => {
        if (!g?.scene?.scenes) return;
        g.scene.scenes.forEach((/** @type {any} */ sc) => {
          if (!sc || sc.__gsSceneDeltaClamped || typeof sc.update !== "function") return;
          sc.__gsSceneDeltaClamped = true;
          const origUpdate = sc.update;
          sc.update = function (/** @type {number} */ t, /** @type {number} */ dt) {
            const safeDt =
              typeof dt === "number" ? Math.min(Math.max(0, dt), MAX_DELTA_MS) : DT_FIXED;
            return origUpdate.call(this, t, safeDt);
          };
        });
      });
    } catch {}
  }

  // ── Inline SVG Math Physics Models (Explicit viewBox, width/height, #FFFFFF) ─
  /**
   * Generates a high-contrast inline SVG visual math model dynamically coupled to parameters.
   * @param {string} [kind]
   * @param {any} [params]
   */
  function renderMathModelSVG(kind = "ratios", params = {}) {
    const num = (/** @type {any} */ v, /** @type {number} */ d) =>
      Number.isFinite(Number(v)) ? Number(v) : d;
    if (kind === "coordinates") {
      const xVal = Math.max(-8, Math.min(8, num(params.x, 3)));
      const yVal = Math.max(-5, Math.min(5, num(params.y, 2)));
      const ox = 180;
      const oy = 44;
      const px = ox + xVal * 16;
      const py = oy - yVal * 7;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 88" width="360" height="88" style="background:#FFFFFF;border-radius:8px;display:block;max-width:100%;height:auto;" role="img" aria-label="Coordinate plane vector model (${xVal}, ${yVal})">
        <rect x="0" y="0" width="360" height="88" fill="#FFFFFF" rx="8"/>
        <line x1="28" y1="${oy}" x2="332" y2="${oy}" stroke="#94A3B8" stroke-width="1.5"/>
        <line x1="${ox}" y1="8" x2="${ox}" y2="80" stroke="#94A3B8" stroke-width="1.5"/>
        <line x1="${ox}" y1="${oy}" x2="${px}" y2="${oy}" stroke="#0284C7" stroke-width="3" stroke-dasharray="4 2"/>
        <line x1="${px}" y1="${oy}" x2="${px}" y2="${py}" stroke="#0D9488" stroke-width="3"/>
        <line x1="${ox}" y1="${oy}" x2="${px}" y2="${py}" stroke="#1E293B" stroke-width="2"/>
        <circle cx="${ox}" cy="${oy}" r="3.5" fill="#475569"/>
        <circle cx="${px}" cy="${py}" r="5.5" fill="#0284C7" stroke="#FFFFFF" stroke-width="1.5"/>
        <text x="12" y="20" fill="#0F172A" font-family="system-ui,sans-serif" font-size="11" font-weight="700">x → ${xVal}, y ↑ ${yVal}</text>
      </svg>`;
    }
    if (kind === "fractions") {
      const cuts = Math.max(1, Math.min(16, Math.round(num(params.cuts, 4))));
      const sel = Math.max(0, Math.min(cuts, Math.round(num(params.selected, 3))));
      const barW = 280;
      const cellW = barW / cuts;
      let cells = "";
      for (let i = 0; i < cuts; i++) {
        const fill = i < sel ? "#0EA5E9" : "#E2E8F0";
        cells += `<rect x="${40 + i * cellW}" y="28" width="${Math.max(2, cellW - 2)}" height="32" fill="${fill}" stroke="#0F172A" stroke-width="1.5" rx="3"/>`;
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 88" width="360" height="88" style="background:#FFFFFF;border-radius:8px;display:block;max-width:100%;height:auto;" role="img" aria-label="Fraction partition model ${sel} of ${cuts} equal parts">
        <rect x="0" y="0" width="360" height="88" fill="#FFFFFF" rx="8"/>
        <text x="40" y="20" fill="#0F172A" font-family="system-ui,sans-serif" font-size="11" font-weight="700">Equal partitions: ${sel} / ${cuts}</text>
        ${cells}
      </svg>`;
    }
    if (kind === "integers") {
      const val = Math.max(-10, Math.min(10, num(params.value, -4)));
      const ox = 180;
      const px = ox + val * 13;
      const color = val >= 0 ? "#059669" : "#D97706";
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 88" width="360" height="88" style="background:#FFFFFF;border-radius:8px;display:block;max-width:100%;height:auto;" role="img" aria-label="Zero-sum number line model value ${val}, distance ${Math.abs(val)}">
        <rect x="0" y="0" width="360" height="88" fill="#FFFFFF" rx="8"/>
        <line x1="30" y1="50" x2="330" y2="50" stroke="#334155" stroke-width="2"/>
        <line x1="${ox}" y1="34" x2="${ox}" y2="66" stroke="#0F172A" stroke-width="2.5"/>
        <line x1="${ox}" y1="44" x2="${px}" y2="44" stroke="${color}" stroke-width="5"/>
        <circle cx="${px}" cy="44" r="6" fill="${color}"/>
        <text x="30" y="22" fill="#0F172A" font-family="system-ui,sans-serif" font-size="11" font-weight="700">0-Level Balance · Value: ${val} · |${val}| = ${Math.abs(val)}</text>
      </svg>`;
    }
    // Default: 'ratios' (Ratios & Proportions dynamic scaling bars)
    const a = Math.max(1, num(params.a, 2));
    const b = Math.max(1, num(params.b, 3));
    const curA = Math.max(0, num(params.currentA, a));
    const curB = Math.max(0, num(params.currentB, b));
    const maxUnit = Math.max(a, b, curA, curB, 1);
    const scaleW = 210 / maxUnit;
    const wA = Math.max(12, Math.min(220, Math.round(curA * scaleW)));
    const wB = Math.max(12, Math.min(220, Math.round(curB * scaleW)));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 88" width="360" height="88" style="background:#FFFFFF;border-radius:8px;display:block;max-width:100%;height:auto;" role="img" aria-label="Proportional ratio model target ${a}:${b}, current ${curA}:${curB}">
      <rect x="0" y="0" width="360" height="88" fill="#FFFFFF" rx="8"/>
      <text x="16" y="19" fill="#0F172A" font-family="system-ui,sans-serif" font-size="11" font-weight="700">Target Ratio ${a} : ${b} · Current Scale ${curA} : ${curB}</text>
      <rect x="16" y="28" width="${wA}" height="20" fill="#0284C7" rx="4"/>
      <text x="${wA + 24}" y="42" fill="#0F172A" font-family="system-ui,sans-serif" font-size="11" font-weight="700">A (${curA})</text>
      <rect x="16" y="54" width="${wB}" height="20" fill="#0D9488" rx="4"/>
      <text x="${wB + 24}" y="68" fill="#0F172A" font-family="system-ui,sans-serif" font-size="11" font-weight="700">B (${curB})</text>
    </svg>`;
  }

  // ── Persistence: ewl-game-studio-v1 + eduwonder_games_v2 + eduwonder_master_v3 ─
  function save() {
    try {
      const v1Payload = {
        ...preferences,
        calm: preferences.reducedMotion,
        stats: {
          correct: session.correct,
          attempts: session.attempts,
          streak: session.streak,
          bestStreak: session.bestStreak,
          score: session.score,
        },
      };
      localStorage.setItem(KEY, JSON.stringify(v1Payload));
    } catch {}
    syncEnterprisePersistence();
  }

  /**
   * @param {any} [extra]
   */
  function syncEnterprisePersistence(extra = {}) {
    try {
      const path = location.pathname || "/";
      const now = Date.now();
      const rawV2 = JSON.parse(localStorage.getItem(KEY_V2) || "{}");
      const v2 =
        rawV2 && typeof rawV2 === "object" && !Array.isArray(rawV2)
          ? rawV2
          : { version: 2, games: {} };
      v2.version = 2;
      v2.updatedAt = now;
      v2.preferences = { ...preferences, calm: preferences.reducedMotion };
      v2.games = v2.games && typeof v2.games === "object" ? v2.games : {};

      const prevGame = v2.games[path] || {};
      const accuracy =
        session.attempts > 0 ? Math.round((session.correct / session.attempts) * 100) : 100;
      const numericScore = Math.max(
        Number(extra.score) || 0,
        session.score || 0,
        session.correct * 100,
      );
      const earnedStars = stars().filter(Boolean).length;
      const badges = Array.isArray(prevGame.streakBadges) ? prevGame.streakBadges.slice() : [];
      if (session.bestStreak >= 3 && !badges.includes("streak-3")) badges.push("streak-3");
      if (session.bestStreak >= 5 && !badges.includes("streak-5")) badges.push("streak-5");
      if (session.bestStreak >= 10 && !badges.includes("streak-10")) badges.push("streak-10");

      v2.games[path] = {
        highScore: Math.max(Number(prevGame.highScore) || 0, numericScore),
        bestStars: Math.max(Number(prevGame.bestStars) || 0, earnedStars),
        bestStreak: Math.max(Number(prevGame.bestStreak) || 0, session.bestStreak),
        unlockedTier: Math.max(
          Number(prevGame.unlockedTier) || 1,
          session.bestStreak >= 3 ? Math.min(3, session.level + 1) : session.level,
        ),
        completedRounds: (Number(prevGame.completedRounds) || 0) + (extra.completedRound ? 1 : 0),
        accuracy,
        streakBadges: badges,
        checkpoint: {
          level: session.level,
          correct: session.correct,
          attempts: session.attempts,
          streak: session.streak,
          score: numericScore,
          fsmState: fsm.state,
          updatedAt: now,
        },
      };
      localStorage.setItem(KEY_V2, JSON.stringify(v2));

      // Sync into eduwonder_master_v3 without overwriting unrelated keys
      const rawV3 = JSON.parse(localStorage.getItem(KEY_MASTER_V3) || "{}");
      const v3 =
        rawV3 && typeof rawV3 === "object" && !Array.isArray(rawV3) ? rawV3 : { version: 3 };
      v3.version = 3;
      v3.updatedAt = now;
      v3.gamesStudio = {
        preferences: v2.preferences,
        lastPath: path,
        games: v2.games,
      };
      localStorage.setItem(KEY_MASTER_V3, JSON.stringify(v3));
    } catch {}
  }

  function apply() {
    host.NT_MUTED = preferences.muted;
    EduWonderAudio.muted = preferences.muted;
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
    if (fullscreenButton) {
      const isFs = !!document.fullscreenElement;
      const fsText = isFs
        ? T("Exit fullscreen", "Salir de pantalla completa")
        : T("Fullscreen", "Pantalla completa");
      fullscreenButton.textContent = fsText;
      fullscreenButton.setAttribute("aria-label", fsText);
      fullscreenButton.setAttribute("aria-pressed", String(isFs));
    }
    if (sessionRail) {
      sessionRail.setAttribute("aria-label", T("This round", "Esta ronda"));
      const label = sessionRail.querySelector("[data-objective]");
      if (label) label.textContent = T("Objective", "Objetivo");
      renderSession();
    }
    document.documentElement.lang = isEs() ? "es" : document.documentElement.lang;
  }

  /**
   * @param {boolean} value
   */
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

  /**
   * @param {string} text
   * @param {() => void} action
   */
  function button(text, action) {
    const el = document.createElement("button");
    el.type = "button";
    el.textContent = text;
    el.addEventListener("click", action);
    return el;
  }

  /**
   * @param {string} label
   * @param {"muted" | "reducedMotion" | "contrast"} key
   */
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

  /**
   * @param {"help" | "settings"} mode
   */
  function openDialog(mode) {
    if (!dialog || dialog.open) return;
    previousFocus = document.activeElement;
    dialogPaused = !paused && !!adapter.pause;
    if (dialogPaused) setPaused(true);
    if (mode === "help" && fsm.state === "TITLE/SELECT") {
      fsm.transition("TUTORIAL/WARMUP", "help-dialog");
    }
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
      ).forEach((/** @type {string} */ text) => {
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
    dialog.append(button(T("Back to game", "Volver al juego"), () => dialog?.close()));
    dialog.showModal();
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
    const accPct =
      session.attempts > 0 ? Math.round((session.correct / session.attempts) * 100) : 100;

    const countNode = sessionRail.querySelector("[data-count]");
    if (countNode) {
      countNode.textContent = `${session.correct} / ${goal} ${T("solved", "resueltas")}`;
    }
    const meterFill = /** @type {HTMLElement | null} */ (
      sessionRail.querySelector(".studio-meter i")
    );
    if (meterFill) {
      meterFill.style.width = `${(into / 5) * 100}%`;
    }
    const streakNode = /** @type {HTMLElement | null} */ (
      sessionRail.querySelector("[data-streak]")
    );
    if (streakNode) {
      streakNode.textContent =
        session.streak > 1
          ? `${T("Streak", "Racha")} ${session.streak}`
          : T("Streak ready", "Racha lista");
      streakNode.dataset.masteryGlow = session.streak >= 3 ? "1" : "0";
    }
    const levelNode = sessionRail.querySelector("[data-gs-level]");
    if (levelNode) {
      levelNode.textContent = `${T("Level", "Nivel")} ${session.level} · ${T("Goal", "Meta")} ${goal}`;
    }
    const accNode = sessionRail.querySelector("[data-gs-accuracy]");
    if (accNode) {
      accNode.textContent = `${T("Accuracy", "Precisión")} ${accPct}%`;
    }
    const scoreNode = sessionRail.querySelector("[data-gs-score]");
    if (scoreNode) {
      scoreNode.textContent = `${T("Score", "Puntos")} ${session.score}`;
    }
    const starNode = sessionRail.querySelector("[data-stars]");
    if (starNode) {
      starNode.textContent = earned.map((on) => (on ? "★" : "☆")).join("");
      starNode.setAttribute(
        "aria-label",
        T(
          `${earned.filter(Boolean).length} of 3 stars`,
          `${earned.filter(Boolean).length} de 3 estrellas`,
        ),
      );
    }
  }

  // ── 2-Second Visual Rewind & Recovery + Silent CDDA Scaffold ─────────────
  /**
   * Projects a 2-second visual rewind & recovery banner without harsh game-over halts
   * and NEVER reveals the worked solution on a miss.
   * @param {any} [detail]
   */
  function triggerRewind(detail = {}) {
    if (!rewindBanner) return;
    fsm.transition("REWIND/HINT", "miss-rewind");
    const pattern =
      detail.pattern || host.NTAdaptive?.detectErrorPattern?.(detail) || "general-miss";
    const guideText =
      pattern === "coord-swap"
        ? T(
            "Rewind 2s: Check horizontal (x) first, then vertical (y). Adjust your point.",
            "Rebobinar 2s: Revisa primero horizontal (x) y luego vertical (y). Ajusta tu punto.",
          )
        : pattern === "sign-flip"
          ? T(
              "Rewind 2s: Check direction from zero (positive vs. negative polarity).",
              "Rebobinar 2s: Revisa la dirección desde cero (positivo vs. negativo).",
            )
          : pattern === "unscaled-ratio"
            ? T(
                "Rewind 2s: Scale both quantities by the same multiplicative factor.",
                "Rebobinar 2s: Multiplica ambas cantidades por el mismo factor de escala.",
              )
            : pattern === "partition-mismatch"
              ? T(
                  "Rewind 2s: Match the equal partition divisions to the denominator.",
                  "Rebobinar 2s: Iguala las divisiones de la partición con el denominador.",
                )
              : detail.message ||
                T(
                  "Rewind 2s: Trajectory paused at the step. Adjust your model and try again.",
                  "Rebobinar 2s: Trayectoria en pausa. Ajusta tu modelo e inténtalo de nuevo.",
                );

    rewindBanner.textContent = guideText;
    rewindBanner.dataset.pattern = pattern;
    rewindBanner.hidden = false;
    clearTimeout(rewindCleanupHandle);
    rewindCleanupHandle = trackTimeout(() => {
      if (rewindBanner) rewindBanner.hidden = true;
      if (fsm.state === "REWIND/HINT") {
        fsm.transition("PLAYING", "rewind-recovered");
      }
    }, 2000);
  }

  /**
   * Updates the silent CDDA visual scaffolding overlay based on current struggle/mastery state.
   * @param {any} cddaResult
   * @param {any} [detail]
   */
  function syncCDDAScaffold(cddaResult, detail = {}) {
    if (!document.body) return;
    if (cddaResult.scaffoldActive) {
      document.body.dataset.cddaScaffold = "active";
      document.body.dataset.cddaPattern = cddaResult.pattern || "general-miss";
      if (scaffoldOverlay) {
        const kind =
          cddaResult.pattern === "coord-swap"
            ? "coordinates"
            : cddaResult.pattern === "sign-flip"
              ? "integers"
              : cddaResult.pattern === "partition-mismatch"
                ? "fractions"
                : "ratios";
        scaffoldOverlay.innerHTML = `<div class="gs-cdda-card">
          <span class="gs-cdda-tag">${T("Visual Scaffold Active", "Andamiaje visual activo")}</span>
          ${renderMathModelSVG(kind, detail)}
        </div>`;
        scaffoldOverlay.hidden = false;
      }
    } else if (cddaResult.masteryActive) {
      document.body.dataset.cddaScaffold = "mastery";
      document.body.dataset.cddaPattern = "none";
      if (scaffoldOverlay) scaffoldOverlay.hidden = true;
    } else {
      document.body.dataset.cddaScaffold = "neutral";
      if (scaffoldOverlay) scaffoldOverlay.hidden = true;
    }
  }

  /**
   * @param {any} detail
   */
  function noteFeedback(detail) {
    if (typeof detail?.correct !== "boolean") return false;
    session.attempts += 1;
    if (fsm.state !== "PLAYING" && fsm.state !== "REWIND/HINT") {
      fsm.transition("PLAYING", "feedback-received");
    }
    if (detail.correct) {
      session.correct += 1;
      session.streak += 1;
      session.bestStreak = Math.max(session.bestStreak, session.streak);
      session.score += 100 * Math.max(1, Math.min(5, session.streak));
      if (rewindBanner) rewindBanner.hidden = true;
      fsm.transition("PLAYING", "correct-step");
      tone("good");
    } else {
      session.streak = 0;
      tone("coach");
      triggerRewind(detail);
    }
    const cddaRes = host.NTAdaptive?.cdda
      ? host.NTAdaptive.cdda.analyze(detail)
      : {
          state: session.streak >= 3 ? "mastery" : detail.correct ? "neutral" : "scaffold",
          streak: session.streak,
          misses: detail.correct ? 0 : 1,
          pattern: detail.correct ? "none" : "general-miss",
          scaffoldActive: !detail.correct,
          masteryActive: session.streak >= 3,
        };
    syncCDDAScaffold(cddaRes, detail);
    BioAdaptiveFlow.evaluate();
    renderSession();
    save();
    const milestone = detail.correct && session.correct > 0 && session.correct % 5 === 0;
    if (milestone) {
      session.level += 1;
      fsm.transition("LEVEL_COMPLETE", "milestone-5");
    }
    return milestone;
  }

  /**
   * @param {any} detail
   */
  function noteComplete(detail) {
    fsm.transition("SUMMARY", "round-complete");
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
    if (Number.isFinite(Number(detail?.score))) {
      session.score = Math.max(session.score, Number(detail.score));
    }
    renderSession();
    tone("complete");
    syncEnterprisePersistence({ score: detail?.score, completedRound: true });
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
      button(T("Back to the game", "Volver al juego"), () => ceremony?.close()),
    );
    if (!ceremony.open) ceremony.showModal();
  }

  /**
   * @param {string} text
   * @param {string} [kind]
   */
  function announce(text, kind = "info") {
    if (!notice || !text) return;
    clearTimeout(notificationTimer);
    notice.textContent = text;
    notice.dataset.kind = kind;
    notice.hidden = false;
    notificationTimer = trackTimeout(() => {
      if (notice) notice.hidden = true;
    }, 2800);
  }

  /**
   * @param {any} detail
   */
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
    syncEnterprisePersistence({ score: detail?.score, completedRound: true });
  }

  // ── Accessible Click-to-Select / Click-to-Place Fallback ─────────────────
  /** @type {HTMLElement | null} */
  let selectedToken = null;

  /**
   * Enables accessible 2-tap / keyboard (Tab + Enter/Space) token selection and placement.
   * @param {ParentNode} [root]
   */
  function enableClickToPlace(root = document) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    const tokens = root.querySelectorAll(
      '[draggable="true"], [data-draggable], [data-gs-token], .gs-draggable-token',
    );
    const slots = root.querySelectorAll(
      "[data-dropzone], [data-slot], [data-gs-slot], .gs-drop-slot",
    );

    tokens.forEach((node) => {
      const el = /** @type {HTMLElement} */ (node);
      if (el.dataset.gsClickPlaceBound === "1") return;
      el.dataset.gsClickPlaceBound = "1";
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
      const selectFn = (/** @type {Event} */ ev) => {
        if (ev.type === "keydown") {
          const ke = /** @type {KeyboardEvent} */ (ev);
          if (ke.key !== "Enter" && ke.key !== " ") return;
          ke.preventDefault();
        }
        if (selectedToken === el) {
          el.classList.remove("gs-token-selected");
          el.setAttribute("aria-grabbed", "false");
          selectedToken = null;
          return;
        }
        if (selectedToken) {
          selectedToken.classList.remove("gs-token-selected");
          selectedToken.setAttribute("aria-grabbed", "false");
        }
        selectedToken = el;
        el.classList.add("gs-token-selected");
        el.setAttribute("aria-grabbed", "true");
      };
      trackListener(el, "click", selectFn);
      trackListener(el, "keydown", selectFn);
    });

    slots.forEach((node) => {
      const slot = /** @type {HTMLElement} */ (node);
      if (slot.dataset.gsSlotBound === "1") return;
      slot.dataset.gsSlotBound = "1";
      if (!slot.hasAttribute("tabindex")) slot.setAttribute("tabindex", "0");
      const placeFn = (/** @type {Event} */ ev) => {
        if (!selectedToken) return;
        if (ev.type === "keydown") {
          const ke = /** @type {KeyboardEvent} */ (ev);
          if (ke.key !== "Enter" && ke.key !== " ") return;
          ke.preventDefault();
        }
        const token = selectedToken;
        token.classList.remove("gs-token-selected");
        token.setAttribute("aria-grabbed", "false");
        selectedToken = null;
        slot.dispatchEvent(
          new CustomEvent("gs:place", {
            bubbles: true,
            detail: { token, slot, value: token.dataset.value || token.textContent?.trim() },
          }),
        );
      };
      trackListener(slot, "click", placeFn);
      trackListener(slot, "keydown", placeFn);
    });
  }

  // ── Hidden Diagnostics Overlay (Shift + D) ───────────────────────────────
  function renderDiagnostics() {
    if (!diagnosticsEl || diagnosticsEl.hidden) return;
    const cdda = host.NTAdaptive?.cdda;
    const recentLog = fsm.history
      .slice(-4)
      .map((h) => `${h.from}→${h.to}`)
      .join(" | ");
    diagnosticsEl.textContent = [
      `FPS: ${rollingFps} (dt=${DT_FIXED.toFixed(1)}ms, clamp<=${MAX_DELTA_MS}ms)`,
      `Input Latency: ${lastInputLatencyMs}ms`,
      `FSM: ${fsm.state} [${recentLog || "boot"}]`,
      `CDDA: ${cdda?.state || "neutral"} (pattern=${cdda?.lastPattern || "none"}, streak=${session.streak})`,
      `BioFlow: ${BioAdaptiveFlow.state} (cadence=${BioAdaptiveFlow.cadenceMs}ms, disp=${BioAdaptiveFlow.clickDispersionPx}px)`,
    ].join(" · ");
  }

  function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        const target =
          document.querySelector(".flagship-stage, #pa-stage, [data-game-stage]") ||
          document.documentElement;
        target.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    } catch {}
  }

  function mount() {
    toolbar = document.createElement("nav");
    toolbar.className = "studio-toolbar";
    toolbar.dataset.gameStudio = "1";
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
    fullscreenButton = button(T("Fullscreen", "Pantalla completa"), toggleFullscreen);
    fullscreenButton.dataset.gsFullscreen = "1";
    fullscreenButton.setAttribute("aria-label", T("Fullscreen", "Pantalla completa"));

    controls.append(
      helpButton,
      soundButton,
      motionButton,
      settingsButton,
      pauseButton,
      fullscreenButton,
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
    sessionRail.setAttribute("aria-label", T("This round", "Esta ronda"));
    sessionRail.innerHTML =
      '<p class="studio-objective"><span data-objective>Objective</span> <strong data-count>0 / 5 solved</strong><span class="studio-meter" aria-hidden="true"><i></i></span></p>' +
      '<p class="studio-hud-pill" data-gs-level>Level 1 · Goal 5</p>' +
      '<p class="studio-hud-pill" data-streak data-gs-streak data-mastery-glow="0">Streak ready</p>' +
      '<p class="studio-hud-pill" data-gs-accuracy>Accuracy 100%</p>' +
      '<p class="studio-hud-pill" data-gs-score>Score 0</p>' +
      '<p data-stars aria-label="0 of 3 stars">☆☆☆</p>';

    rewindBanner = document.createElement("div");
    rewindBanner.className = "gs-rewind-banner";
    rewindBanner.setAttribute("role", "status");
    rewindBanner.setAttribute("aria-live", "polite");
    rewindBanner.hidden = true;

    scaffoldOverlay = document.createElement("aside");
    scaffoldOverlay.className = "gs-cdda-scaffold-overlay";
    scaffoldOverlay.setAttribute("aria-label", T("Visual math guide", "Guía matemática visual"));
    scaffoldOverlay.hidden = true;

    diagnosticsEl = document.createElement("div");
    diagnosticsEl.id = "gs-diagnostics";
    diagnosticsEl.className = "gs-diagnostics";
    diagnosticsEl.setAttribute("role", "status");
    diagnosticsEl.setAttribute("aria-live", "off");
    diagnosticsEl.hidden = true;

    ceremony = document.createElement("dialog");
    ceremony.className = "studio-dialog studio-ceremony";
    ceremony.setAttribute("aria-labelledby", "studio-ceremony-title");
    ceremony.setAttribute("closedby", "closerequest");

    document.body.prepend(toolbar);
    toolbar.after(sessionRail);
    document.body.append(dialog, ceremony, notice, rewindBanner, scaffoldOverlay, diagnosticsEl);

    fsm.transition("TITLE/SELECT", "mounted");
    document.body.dataset.bioFlow = BioAdaptiveFlow.state;
    enableClickToPlace(document);
    patchPhaserDeltaClamp();
    renderSession();
    apply();
    save();
  }

  const api = {
    register(/** @type {any} */ options) {
      adapter = { ...adapter, ...options };
      if (pauseButton) pauseButton.hidden = !adapter.pause || !adapter.resume;
      patchPhaserDeltaClamp();
      apply();
    },
    get settings() {
      return { ...preferences, calm: preferences.reducedMotion };
    },
    get paused() {
      return paused;
    },
    get session() {
      return {
        ...session,
        accuracy:
          session.attempts > 0 ? Math.round((session.correct / session.attempts) * 100) : 100,
        stars: stars().filter(Boolean).length,
      };
    },
    fsm,
    audio: EduWonderAudio,
    bioFlow: BioAdaptiveFlow,
    disposables,
    createFixedLoop,
    patchPhaserDeltaClamp,
    renderMathModelSVG,
    enableClickToPlace,
    triggerRewind,
    cleanupDisposables,
    trackTimeout,
    trackInterval,
    /**
     * @param {string} name
     * @param {any} [detail]
     */
    emit(name, detail = {}) {
      document.dispatchEvent(new CustomEvent(`game:${name}`, { detail }));
    },
    /**
     * @param {EventListenerOrEventListenerObject} fn
     */
    onSettings(fn) {
      listeners.addEventListener("settings", fn);
    },
    /**
     * @param {boolean} value
     */
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

  // Start lightweight 60fps telemetry sampler for diagnostics & Phaser delta protection
  createFixedLoop(() => {
    lastFrameStamp = performance.now();
  });

  // ── Universal Input Unification & Keyboard Mapping ───────────────────────
  document.addEventListener("pointerdown", (ev) => {
    lastInputLatencyMs = Math.max(1, Math.min(50, Math.round(performance.now() - lastFrameStamp)));
    BioAdaptiveFlow.recordPointerDown(ev.clientX, ev.clientY);
  });

  document.addEventListener(
    "pointermove",
    (ev) => {
      BioAdaptiveFlow.recordPointerMove(ev.clientX, ev.clientY);
    },
    { passive: true },
  );

  document.addEventListener("fullscreenchange", () => {
    relabel();
  });

  document.addEventListener("keydown", (event) => {
    lastInputLatencyMs = Math.max(1, Math.min(50, Math.round(performance.now() - lastFrameStamp)));
    const target = /** @type {HTMLElement | null} */ (event.target);
    const tag = target?.tagName || "";
    const inEditable = /^(INPUT|TEXTAREA|SELECT)$/.test(tag) || !!target?.isContentEditable;

    // Shift + D toggles hidden Diagnostics Mode
    if (
      event.shiftKey &&
      (event.key === "D" || event.key === "d") &&
      !inEditable &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      event.preventDefault();
      if (diagnosticsEl) {
        diagnosticsEl.hidden = !diagnosticsEl.hidden;
        renderDiagnostics();
      }
      return;
    }

    // Never interfere with native <dialog> Escape closing or form inputs
    if (dialog?.open || ceremony?.open || document.querySelector("dialog[open]") || inEditable) {
      return;
    }

    const active = document.activeElement;
    const insideGameStage = !!(
      target?.closest?.("canvas, .flagship-stage, [data-game-stage], #pa-stage, #game-container") ||
      active?.closest?.("canvas, .flagship-stage, [data-game-stage], #pa-stage, #game-container") ||
      target?.tagName === "CANVAS"
    );

    const k = event.key;
    /** @type {string | null} */
    let action = null;
    if (k === "ArrowUp" || k === "w" || k === "W") action = "up";
    else if (k === "ArrowDown" || k === "s" || k === "S") action = "down";
    else if (k === "ArrowLeft" || k === "a" || k === "A") action = "left";
    else if (k === "ArrowRight" || k === "d" || k === "D") action = "right";
    else if (k === " " || k === "Enter") action = "confirm";
    else if (/^[1-9]$/.test(k)) action = "digit";

    if (action) {
      // Only preventDefault when focus is strictly inside the game stage so page scroll is never blocked
      if (
        insideGameStage &&
        (k.startsWith("Arrow") || k === " " || k === "w" || k === "a" || k === "s" || k === "d")
      ) {
        event.preventDefault();
      }
      if (fsm.state === "TITLE/SELECT") {
        fsm.transition("PLAYING", "keyboard-input");
      }
      document.dispatchEvent(
        new CustomEvent("game:input", {
          detail: {
            action,
            key: k,
            digit: action === "digit" ? Number(k) : null,
            insideGameStage,
          },
        }),
      );
    }
  });

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
  window.addEventListener("pagehide", () => {
    syncEnterprisePersistence();
    cleanupDisposables("all");
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
