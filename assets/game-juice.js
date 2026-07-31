// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/*
 * game-juice.js — Neft Teacher · shared "game feel" layer for Phaser games.
 *
 * One global, window.GameJuice, that any Phaser 3 game can use to feel like a
 * real game instead of a worksheet: layered WebAudio (chords, an ambient music
 * loop, designed SFX), particle bursts + confetti, squash/stretch tile pops,
 * camera shake, rising score text, per-theme color palettes + mascot, and a
 * thin wrapper over the Student Passport (window.NTPassport) for XP/badges.
 *
 * Design rules:
 *   - Pure add-on. Every method is guarded and no-ops if a dependency is
 *     missing, so a game keeps working even if this file fails to load.
 *   - Honors prefers-reduced-motion (skips shake / confetti / big motion) and
 *     window.NT_MUTED (silences audio).
 *   - Audio is unlocked lazily on the first user gesture (browser policy).
 */
(function () {
  "use strict";
  if (window.GameJuice && window.GameJuice.__booted) return;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function muted() {
    return !!window.NT_MUTED;
  }

  // ── Audio kit ────────────────────────────────────────────────────────────
  var AC = null;
  var musicTimer = null;
  function ctx() {
    if (AC) return AC;
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_e) {
      AC = null;
    }
    return AC;
  }
  function unlock() {
    var c = ctx();
    if (c && c.state === "suspended") c.resume().catch(function () {});
  }
  // One enveloped voice.
  function voice(freq, dur, type, vol, when) {
    var c = ctx();
    if (!c || muted()) return;
    // Self-heal: if the context is still suspended (autoplay policy), resume it
    // so the first gesture-triggered sound is not silently dropped.
    if (c.state === "suspended") c.resume().catch(function () {});
    try {
      var t0 = (when || c.currentTime) + 0.0001;
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol == null ? 0.14 : vol, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(c.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch (_e) {}
  }
  function chord(freqs, dur, type, vol) {
    var c = ctx();
    if (!c) return;
    freqs.forEach(function (f, i) {
      voice(f, dur, type, (vol || 0.12) - i * 0.02, c.currentTime + i * 0.015);
    });
  }
  var SFX = {
    unlock: unlock,
    setMuted: function (m) {
      window.NT_MUTED = !!m;
      if (m) SFX.musicStop();
    },
    tap: function () {
      voice(520, 0.06, "triangle", 0.08);
    },
    pop: function () {
      voice(740, 0.05, "square", 0.06);
      voice(1100, 0.05, "square", 0.04);
    },
    correct: function (streak) {
      // brighter chord as the streak grows
      var base = [523.25, 659.25, 783.99];
      if ((streak || 0) >= 3) base = [659.25, 830.61, 987.77, 1318.51];
      chord(base, 0.4, "sine", 0.13);
    },
    wrong: function () {
      voice(196, 0.28, "sawtooth", 0.12);
      voice(146, 0.34, "sawtooth", 0.09);
    },
    whoosh: function () {
      voice(420, 0.18, "sine", 0.05);
      voice(620, 0.14, "sine", 0.04);
    },
    fanfare: function () {
      // Schedule from the audio clock (drift-free vs. setTimeout on tablets).
      var c = ctx();
      if (!c) return;
      var t0 = c.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach(function (f, i) {
        voice(f, 0.3, "sine", 0.16, t0 + i * 0.11);
      });
    },
    // Gentle, slow ambient arpeggio so it never distracts.
    musicStart: function () {
      var c = ctx();
      if (!c || muted() || musicTimer) return;
      var scale = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63];
      var i = 0;
      musicTimer = setInterval(function () {
        if (muted()) return;
        voice(scale[i % scale.length], 1.1, "sine", 0.035);
        if (i % 2 === 0) voice(scale[i % scale.length] / 2, 1.4, "triangle", 0.025);
        i++;
      }, 900);
    },
    musicStop: function () {
      if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
      }
    },
  };

  // ── Theme palettes (keyed by lesson config "theme" id) ────────────────────
  // Each: top/bottom background, an accent, and a tile color. The mascot emoji
  // comes from the lesson's themeEmoji, so only colors live here.
  var THEMES = {
    "space-station": {
      top: "#0b1437",
      bot: "#1b2b6b",
      accent: "#7dd3fc",
      tile: "#23306b",
    },
    "time-capsule": {
      top: "#2a1a3e",
      bot: "#4a2c6e",
      accent: "#d8b4fe",
      tile: "#3c2a5e",
    },
    "detective-agency": {
      top: "#1c1917",
      bot: "#3b2f2a",
      accent: "#fbbf24",
      tile: "#3a302b",
    },
    "culinary-academy": {
      top: "#3a1d1d",
      bot: "#6b2f2f",
      accent: "#fca5a5",
      tile: "#5a2a2a",
    },
    "arcade-builder": {
      top: "#10182e",
      bot: "#241b52",
      accent: "#f472b6",
      tile: "#2a2350",
    },
    "architecture-firm": {
      top: "#0f2430",
      bot: "#1b4a5e",
      accent: "#5eead4",
      tile: "#1d3f4f",
    },
    "music-studio": {
      top: "#2b123a",
      bot: "#5a2170",
      accent: "#e879f9",
      tile: "#43215a",
    },
    "sports-analytics": {
      top: "#0c2a1a",
      bot: "#155e3a",
      accent: "#86efac",
      tile: "#17492f",
    },
    "treasure-map": {
      top: "#2c2410",
      bot: "#5e4a1b",
      accent: "#fcd34d",
      tile: "#4d3f1d",
    },
    "marine-biology": {
      top: "#08203a",
      bot: "#0e4a6e",
      accent: "#67e8f9",
      tile: "#123f5a",
    },
    "space-explorer": {
      top: "#0b1437",
      bot: "#1b2b6b",
      accent: "#7dd3fc",
      tile: "#23306b",
    },
  };
  var DEFAULT_THEME = {
    top: "#0f172a",
    bot: "#1e293b",
    accent: "#38bdf8",
    tile: "#334155",
  };
  function hx(s) {
    return parseInt(s.replace("#", "0x"));
  }
  function theme(id) {
    var t = THEMES[id] || DEFAULT_THEME;
    return {
      id: id || "default",
      top: t.top,
      bot: t.bot,
      accent: t.accent,
      tile: t.tile,
      topN: hx(t.top),
      botN: hx(t.bot),
      accentN: hx(t.accent),
      tileN: hx(t.tile),
    };
  }

  // ── Phaser visual helpers (scene-scoped; all guarded) ─────────────────────
  function bgGradient(scene, th) {
    // Vertical gradient via a tinted texture; falls back to a flat fill.
    try {
      var W = scene.scale.width,
        H = scene.scale.height;
      var key = "juice-bg-" + th.id;
      if (!scene.textures.exists(key)) {
        var cv = scene.textures.createCanvas(key, 8, H);
        var g = cv.context.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, th.top);
        g.addColorStop(1, th.bot);
        cv.context.fillStyle = g;
        cv.context.fillRect(0, 0, 8, H);
        cv.refresh();
      }
      return scene.add
        .image(W / 2, H / 2, key)
        .setDisplaySize(W, H)
        .setDepth(-100);
    } catch (_e) {
      return scene.add
        .rectangle(
          scene.scale.width / 2,
          scene.scale.height / 2,
          scene.scale.width,
          scene.scale.height,
          th.botN,
        )
        .setDepth(-100);
    }
  }
  function ensureParticleTexture(scene) {
    if (scene.textures.exists("juice-dot")) return;
    var g = scene.make.graphics({ add: false });
    g.fillStyle(0xffffff);
    g.fillCircle(6, 6, 6);
    g.generateTexture("juice-dot", 12, 12);
    g.destroy();
  }
  function popIn(scene, obj, delay) {
    if (!obj) return;
    try {
      obj.setScale(0.6).setAlpha(0);
      scene.tweens.add({
        targets: obj,
        scale: 1,
        alpha: 1,
        ease: "Back.Out",
        duration: reduce ? 1 : 320,
        delay: reduce ? 0 : delay || 0,
      });
    } catch (_e) {}
  }
  function tilePop(scene, obj) {
    if (!obj || reduce) return;
    try {
      scene.tweens.add({
        targets: obj,
        scaleX: 1.12,
        scaleY: 0.9,
        yoyo: true,
        duration: 110,
        ease: "Quad.Out",
      });
    } catch (_e) {}
  }
  function burst(scene, x, y, colors, n) {
    try {
      ensureParticleTexture(scene);
      var em = scene.add
        .particles(x, y, "juice-dot", {
          speed: { min: 90, max: 280 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.1, end: 0 },
          lifespan: 650,
          quantity: reduce ? 6 : n || 18,
          tint: colors || [0xffd24a, 0x34d399, 0xffffff],
          emitting: false,
        })
        .setDepth(60);
      em.explode(reduce ? 6 : n || 18);
      scene.time.delayedCall(800, function () {
        em.destroy();
      });
    } catch (_e) {}
  }
  function confetti(scene, _n) {
    if (reduce) return;
    try {
      ensureParticleTexture(scene);
      var W = scene.scale.width;
      var em = scene.add
        .particles(0, -10, "juice-dot", {
          x: { min: 0, max: W },
          y: -10,
          speedY: { min: 160, max: 320 },
          speedX: { min: -50, max: 50 },
          scale: { start: 1, end: 0.4 },
          rotate: { min: 0, max: 360 },
          lifespan: 1700,
          quantity: 4,
          frequency: 30,
          tint: [0xf472b6, 0xfacc15, 0x34d399, 0x38bdf8, 0xffffff],
        })
        .setDepth(70);
      scene.time.delayedCall(900, function () {
        em.stop();
      });
      scene.time.delayedCall(2700, function () {
        em.destroy();
      });
    } catch (_e) {}
  }
  function shake(scene, amount) {
    if (reduce) return;
    try {
      scene.cameras.main.shake(180, amount || 0.006);
    } catch (_e) {}
  }
  function floatText(scene, x, y, text, color, size) {
    try {
      var t = scene.add
        .text(x, y, text, {
          fontFamily: "Nunito, Segoe UI, sans-serif",
          fontSize: (size || 28) + "px",
          fontStyle: "bold",
          color: color || "#fde047",
          stroke: "#0a0f1f",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(80);
      // Brief pop before the rise, so earned XP reads as "earned".
      if (!reduce) {
        t.setScale(0.5);
        scene.tweens.add({
          targets: t,
          scale: 1,
          duration: 160,
          ease: "Back.Out",
        });
      }
      scene.tweens.add({
        targets: t,
        y: y - (reduce ? 20 : 70),
        alpha: { from: 1, to: 0 },
        duration: reduce ? 500 : 1300,
        delay: reduce ? 0 : 150,
        ease: "Quad.Out",
        onComplete: function () {
          t.destroy();
        },
      });
    } catch (_e) {}
  }

  // ── Progression (Student Passport wrapper) ────────────────────────────────
  function award(xp, reason) {
    try {
      if (window.NTPassport && typeof window.NTPassport.award === "function")
        window.NTPassport.award(xp, reason || "game");
    } catch (_e) {}
  }

  window.GameJuice = {
    __booted: true,
    reduceMotion: reduce,
    audio: SFX,
    theme: theme,
    bgGradient: bgGradient,
    popIn: popIn,
    tilePop: tilePop,
    burst: burst,
    confetti: confetti,
    shake: shake,
    floatText: floatText,
    award: award,
  };
})();
