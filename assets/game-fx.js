/* Neft Teacher — shared Game FX kit (additive, deploy-safe).
 *
 * Pairs with game-fx.css. Adds universal, gameplay-neutral polish to any
 * interactive game/activity it is injected into:
 *   - Success spark burst when a "correct" element appears.
 *   - Pointer parallax on data-parallax elements.
 *   - 🌐 English/Spanish Bilingual support with auto-dictionary translations.
 *   - 🔊 Text-to-Speech (TTS) Read Aloud accessibility tools.
 *   - 🔑 Hidden Teacher Cheats & Diagnostics Console.
 *   - 🎉 Auto-Confetti celebration on win screen.
 *   - 🌎 Enterprise LMS Integration Bridge (SCORM 1.2 / SCORM 2004 / postMessage API).
 *   - 🔊 Programmatic Web Audio Synthesizer (Success / Error chimes).
 *   - 🌓 High-Contrast Accessibility Theme.
 *   - ⌨️ Keyboard Navigation & Controls Guide.
 *   - ⚡ Juicy Click Cursor Ripples & Stars.
 *   - 🔥 Animated Combo Score Multiplier HUD.
 *   - 🎵 Synthesized Retro 8-bit Background Music.
 */
(function () {
  "use strict";
  if (window.GameFX && window.GameFX.comboInjected) return;

  var reduce = !!(
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  var COLORS = ["#1aa179", "#f0a400", "#3b7dd8", "#e0542f", "#9b5de5"];
  var SUCCESS_CLASS = /(^|\s)(right|correct|is-correct|is-right|ok|success|won|gfx-correct)(\s|$)/i;
  var WRONG_CLASS = /(^|\s)(wrong|incorrect|is-incorrect|is-wrong|fail|error|gfx-wrong|bad)(\s|$)/i;
  var INTERACTIVE = /(^|\s)(opt|option|choice|answer|tile|card|btn|cell|key)(\s|$)/i;

  var DICT = {
    es: {
      "start game": "iniciar juego",
      "play again": "jugar de nuevo",
      "game over": "fin del juego",
      level: "nivel",
      round: "ronda",
      score: "puntuación",
      time: "tiempo",
      lives: "vidas",
      correct: "correcto",
      incorrect: "incorrecto",
      streak: "racha",
      perfect: "perfecto",
      congratulations: "¡felicitaciones!",
      "you won": "¡ganaste!",
      "next level": "siguiente nivel",
      "next round": "siguiente ronda",
      instructions: "instrucciones",
      points: "puntos",
      "high score": "puntuación alta",
      "time's up": "¡tiempo agotado!",
      forged: "forjado",
      prime: "primo",
      composite: "compuesto",
      factor: "factor",
      multiple: "múltiplo",
      ready: "listo",
      go: "¡vamos!",
      play: "jugar",
    },
  };

  var textRegistry = new WeakMap();
  var comboStreak = 0;
  var musicTimer = null;

  var lastPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  window.addEventListener(
    "pointerdown",
    function (e) {
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
    },
    true,
  );

  function spawnFloatingScore(text, x, y) {
    if (reduce) return;
    var bubble = document.createElement("div");
    bubble.className = "gfx-floating-score";
    bubble.style.left = x + "px";
    bubble.style.top = y + "px";
    bubble.textContent = text;
    document.body.appendChild(bubble);
    setTimeout(function () {
      bubble.remove();
    }, 800);
  }

  function spawnShockwave(x, y) {
    if (reduce) return;
    var shock = document.createElement("div");
    shock.className = "gfx-shockwave";
    shock.style.left = x + "px";
    shock.style.top = y + "px";
    document.body.appendChild(shock);
    setTimeout(function () {
      shock.remove();
    }, 600);
  }

  function flashScreen(color) {
    if (reduce) return;
    var flash = document.createElement("div");
    flash.style.position = "fixed";
    flash.style.inset = "0";
    flash.style.background = color || "rgba(239, 68, 68, 0.4)";
    flash.style.pointerEvents = "none";
    flash.style.zIndex = "100002";
    document.body.appendChild(flash);
    try {
      var anim = flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
      anim.onfinish = function () {
        flash.remove();
      };
    } catch (e) {
      flash.remove();
    }
  }

  // Screen-warp glitch removed — it distorted the game and hurt readability.
  // Kept as a no-op so the GameFX.glitch API and existing callers stay valid;
  // wrong-answer audio/flash feedback is unaffected.
  function triggerScreenGlitch() {}

  function drawBezelEqualizer() {
    var canvas = document.getElementById("gfx-equalizer");
    if (!canvas) {
      setTimeout(drawBezelEqualizer, 100);
      return;
    }
    var ctx2d = canvas.getContext("2d");
    if (!ctx2d) {
      setTimeout(drawBezelEqualizer, 100);
      return;
    }

    var w = canvas.width;
    var h = canvas.height;

    function draw() {
      requestAnimationFrame(draw);
      ctx2d.clearRect(0, 0, w, h);

      var data = null;
      if (AudioSynth.analyser && AudioSynth.analyserData) {
        AudioSynth.analyser.getByteFrequencyData(AudioSynth.analyserData);
        data = AudioSynth.analyserData;
      }

      var barW = w / 8;
      ctx2d.fillStyle = "#38bdf8"; // Neon Sky Blue

      for (var i = 0; i < 8; i++) {
        var val = data ? data[i] : 0;
        var barH = (val / 255) * h * 0.85 + 2; // scale and add baseline height
        var x = i * barW + 1;
        var y = h - barH;

        ctx2d.fillRect(x, y, barW - 2, barH);
      }
    }
    draw();
  }

  function translateDOM(isEs) {
    document.body.classList.toggle("es", isEs);

    function walk(node) {
      if (node.nodeType === 3) {
        var val = node.nodeValue.trim();
        if (!val) return;

        if (!textRegistry.has(node)) {
          textRegistry.set(node, node.nodeValue);
        }

        var original = textRegistry.get(node);
        if (isEs) {
          var translated = original;
          for (var en in DICT.es) {
            var es = DICT.es[en];
            var re = new RegExp("\\b" + en + "\\b", "gi");
            translated = translated.replace(re, es);
          }
          node.nodeValue = translated;
        } else {
          node.nodeValue = original;
        }
      } else if (
        node.nodeType === 1 &&
        node.id !== "game-pub-toolbar" &&
        node.id !== "teacher-cheat-console" &&
        node.id !== "game-controls-dialog" &&
        node.id !== "game-combo-hud" &&
        node.id !== "game-visual-helper" &&
        node.tagName !== "SCRIPT" &&
        node.tagName !== "STYLE"
      ) {
        for (var i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i]);
        }
      }
    }
    walk(document.body);
  }

  function burst(cx, cy) {
    if (reduce) return;
    var particles = [];
    var count = 25;
    for (var i = 0; i < count; i++) {
      var el = document.createElement("div");
      el.className = "gfx-spark";
      el.style.left = cx + "px";
      el.style.top = cy + "px";
      el.style.background = COLORS[i % COLORS.length];
      document.body.appendChild(el);
      var angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      var speed = 3 + Math.random() * 6;
      particles.push({
        el: el,
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.02,
        scale: 1.2 + Math.random() * 0.6,
      });
    }

    function updateParticles() {
      var active = false;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (p.alpha <= 0) continue;
        p.vy += 0.18; // gravity
        p.vx *= 0.98; // air drag
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.scale *= 0.97;
        p.el.style.left = p.x + "px";
        p.el.style.top = p.y + "px";
        p.el.style.opacity = p.alpha;
        p.el.style.transform =
          "translate(-50%, -50%) scale(" + p.scale + ") rotate(" + p.alpha * 360 + "deg)";
        if (p.alpha > 0) {
          active = true;
        } else {
          p.el.remove();
        }
      }
      if (active) {
        requestAnimationFrame(updateParticles);
      }
    }
    requestAnimationFrame(updateParticles);
  }

  function celebrate(el) {
    if (reduce || !el || !el.getBoundingClientRect) return;
    var r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;
    burst(r.left + r.width / 2, r.top + r.height / 2);
  }

  function pop(el) {
    if (reduce || !el || !el.classList) return;
    el.classList.remove("gfx-pop");
    void el.offsetWidth;
    el.classList.add("gfx-pop");
  }

  function shakeScreen() {
    if (reduce) return;
    var el = document.querySelector("canvas") || document.body;
    el.classList.remove("gfx-shake");
    void el.offsetWidth;
    el.classList.add("gfx-shake");
    setTimeout(function () {
      el.classList.remove("gfx-shake");
    }, 400);
  }

  // --- Programmatic Audio & Retro Music Synthesizer ---
  var AudioSynth = {
    muted: false,
    playingMusic: false,
    ctx: null,
    filter: null,
    delay: null,
    delayGain: null,
    humOsc: null,
    humGain: null,
    analyser: null,
    analyserData: null,
    init: function () {
      if (this.ctx) return;
      try {
        var AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();

        // 1. Main LPF Filter Node
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = "lowpass";
        this.filter.frequency.setValueAtTime(2000, this.ctx.currentTime);
        this.filter.connect(this.ctx.destination);

        // 2. Feedback Delay Echo unit (Reverb emulation)
        this.delay = this.ctx.createDelay(1.0);
        this.delay.delayTime.setValueAtTime(0.18, this.ctx.currentTime); // 180ms delay

        this.delayGain = this.ctx.createGain();
        this.delayGain.gain.setValueAtTime(0.35, this.ctx.currentTime); // 35% feedback loop volume

        this.delay.connect(this.delayGain);
        this.delayGain.connect(this.delay);

        this.delay.connect(this.filter);

        // 3. Audio-Reactive AnalyserNode
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 32;
        this.filter.connect(this.analyser);

        this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);
      } catch (e) {}
    },
    startHum: function () {
      this.init();
      if (!this.ctx || this.humOsc) return;
      try {
        this.humOsc = this.ctx.createOscillator();
        this.humGain = this.ctx.createGain();

        this.humOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // 55Hz cabinet power hum
        this.humOsc.type = "sine";
        this.humGain.gain.setValueAtTime(0.003, this.ctx.currentTime); // very subtle

        this.humOsc.connect(this.humGain);
        this.humGain.connect(this.filter || this.ctx.destination);
        this.humOsc.start();
      } catch (e) {}
    },
    stopHum: function () {
      if (this.humOsc) {
        try {
          this.humOsc.stop();
        } catch (e) {}
        this.humOsc = null;
        this.humGain = null;
      }
    },
    muffle: function () {
      this.init();
      if (this.filter && this.ctx) {
        this.filter.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.3);
      }
    },
    unmuffle: function () {
      this.init();
      if (this.filter && this.ctx) {
        this.filter.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.3);
      }
    },
    playTone: function (freq, type, duration, vol) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      try {
        var carrier = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        carrier.connect(gain);
        gain.connect(this.filter || this.ctx.destination);
        if (this.delay) gain.connect(this.delay);

        var t = this.ctx.currentTime;
        carrier.type = type || "sine";
        carrier.frequency.setValueAtTime(freq, t);

        // Gold-Standard FM Synthesis: Modulator voice
        var modulator = this.ctx.createOscillator();
        var modGain = this.ctx.createGain();

        // Metallic FM ratio (2:1 frequency ratio, modulation depth indexing on carrier frequency)
        modulator.frequency.setValueAtTime(freq * 2, t);
        modGain.gain.setValueAtTime(freq * 0.35, t);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        gain.gain.setValueAtTime(vol || 0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        carrier.start(t);
        modulator.start(t);

        carrier.stop(t + duration);
        modulator.stop(t + duration);
      } catch (e) {}
    },
    noise: function (duration, vol) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      try {
        var bufferSize = this.ctx.sampleRate * duration;
        var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        var noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = buffer;

        var gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol || 0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        noiseSource.connect(gain);
        gain.connect(this.filter || this.ctx.destination);
        if (this.delay) gain.connect(this.delay);

        noiseSource.start();
        noiseSource.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    },
    playSuccess: function () {
      this.playTone(523.25, "triangle", 0.08, 0.1);
      var self = this;
      setTimeout(function () {
        self.playTone(659.25, "triangle", 0.08, 0.1);
      }, 60);
      setTimeout(function () {
        self.playTone(783.99, "triangle", 0.12, 0.1);
      }, 120);
      setTimeout(function () {
        self.playTone(1046.5, "sine", 0.18, 0.1);
      }, 180);
    },
    playError: function () {
      this.playTone(150, "sawtooth", 0.1, 0.12);
      var self = this;
      setTimeout(function () {
        self.playTone(90, "sawtooth", 0.25, 0.15);
      }, 80);
      this.noise(0.2, 0.06);
    },
    startMusic: function () {
      if (this.playingMusic) return;
      this.playingMusic = true;
      this.init();
      if (!this.ctx) return;
      this.startHum();
      var self = this;
      var step = 0;

      // Pentatonic retro melody progression
      var melody = [
        329.63, 392.0, 440.0, 523.25, 587.33, 523.25, 440.0, 392.0, 329.63, 392.0, 440.0, 523.25,
        587.33, 659.25, 587.33, 523.25,
      ];
      var bassProgression = [130.81, 97.99, 110.0, 87.31];

      function playBeat() {
        if (!self.playingMusic) return;

        var lives = 3;
        try {
          if (typeof window.S !== "undefined" && typeof window.S.lives !== "undefined") {
            lives = window.S.lives;
          } else {
            var pg = findPhaserGame();
            if (pg) {
              var activeScene = pg.scene.getScenes(true)[0];
              if (activeScene && typeof activeScene.lives !== "undefined") {
                lives = activeScene.lives;
              }
            }
          }
        } catch (e) {}

        var speedMultiplier = 1.0;
        var pitchOctave = 1.0;
        if (lives === 1) {
          speedMultiplier = 1.4;
          pitchOctave = 2.0;
        } else if (lives === 2) {
          speedMultiplier = 1.15;
          pitchOctave = 1.0;
        }

        if (!self.muted) {
          var time = self.ctx.currentTime;
          var bar = Math.floor(step / 8);
          var beat = step % 8;

          if (beat % 2 === 0) {
            var bassFreq = bassProgression[bar % bassProgression.length];
            if (beat === 0) bassFreq *= 0.5;
            self.playTone(bassFreq * pitchOctave, "triangle", 0.35 / speedMultiplier, 0.012);
          }

          var melNote = melody[step % melody.length];
          if (beat % 2 !== 0 || Math.random() > 0.45) {
            self.playTone(melNote * pitchOctave, "square", 0.12 / speedMultiplier, 0.004);
          }

          if (beat === 0 || beat === 4) {
            try {
              var osc = self.ctx.createOscillator();
              var gain = self.ctx.createGain();
              osc.connect(gain);
              gain.connect(self.filter || self.ctx.destination);
              osc.frequency.setValueAtTime(120, time);
              osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
              gain.gain.setValueAtTime(0.02, time);
              gain.gain.linearRampToValueAtTime(0.001, time + 0.1);
              osc.start(time);
              osc.stop(time + 0.1);
            } catch (e) {}
          } else if (beat === 2 || beat === 6) {
            self.noise(0.08, 0.008);
          } else if (beat % 2 !== 0) {
            self.noise(0.02, 0.004);
          }
        }

        step++;
        var baseInterval = 180;
        var nextBeatTime = baseInterval / speedMultiplier;
        musicTimer = setTimeout(playBeat, nextBeatTime);
      }

      playBeat();
    },
    stopMusic: function () {
      this.playingMusic = false;
      this.stopHum();
      if (musicTimer) {
        clearTimeout(musicTimer);
        musicTimer = null;
      }
    },
  };

  // --- Click Ripple & Star Spark Generator ---
  function spawnClickRipple(x, y) {
    if (reduce) return;
    var rip = document.createElement("div");
    rip.className = "gfx-ripple";
    rip.style.left = x + "px";
    rip.style.top = y + "px";
    document.body.appendChild(rip);
    try {
      var anim = rip.animate(
        [
          { width: "0px", height: "0px", opacity: 0.8 },
          { width: "80px", height: "80px", opacity: 0 },
        ],
        { duration: 400 },
      );
      anim.onfinish = function () {
        rip.remove();
      };
    } catch (e) {
      rip.remove();
    }
  }

  // --- Combo Score Multiplier HUD ---
  var comboDrainTimer = null;
  function updateComboHUD(streak) {
    var hud = document.getElementById("game-combo-hud");
    var meter = document.getElementById("gfx-combo-meter");
    var fill = document.getElementById("gfx-combo-fill");
    if (!hud) return;

    if (streak >= 3) {
      hud.textContent = "🔥 STREAK x" + streak + "! 🔥";
      hud.className = "show pop";
      AudioSynth.playTone(300 + streak * 60, "triangle", 0.1, 0.1);
      setTimeout(function () {
        hud.classList.remove("pop");
      }, 300);

      if (meter && fill) {
        meter.classList.add("active");
        fill.style.width = "100%";
        if (comboDrainTimer) clearInterval(comboDrainTimer);
        var width = 100;
        comboDrainTimer = setInterval(function () {
          width -= 2.5;
          fill.style.width = width + "%";
          if (width <= 0) {
            clearInterval(comboDrainTimer);
            comboStreak = 0;
            updateComboHUD(0);
          }
        }, 100);
      }
    } else {
      hud.className = "";
      if (meter) meter.classList.remove("active");
      if (comboDrainTimer) {
        clearInterval(comboDrainTimer);
        comboDrainTimer = null;
      }
    }
  }

  // --- TTS Read Aloud ---
  function readAloud() {
    var btn = document.getElementById("btn-game-read");
    if (!btn) return;

    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      btn.textContent = document.body.classList.contains("es") ? "🔊 Leer" : "🔊 Read";
      return;
    }

    var isEs = document.body.classList.contains("es");
    btn.textContent = isEs ? "⏹️ Detener" : "⏹️ Stop";

    var texts = [];
    var selectors = [
      ".target",
      ".nums",
      ".prompt",
      ".question",
      ".card-title",
      ".activity-card h3",
      ".activity-card p",
      ".vterm",
      ".vdef",
      "h1",
      "h2",
      "p",
      "summary",
    ];

    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (
          el.offsetParent !== null &&
          !el.closest("#game-pub-toolbar") &&
          !el.closest("#teacher-cheat-console") &&
          !el.closest("#game-controls-dialog")
        ) {
          texts.push(el.textContent.trim());
        }
      });
    });

    if (texts.length === 0) {
      texts.push(document.title);
    }

    var speechText = texts.slice(0, 5).join(". ");
    var utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = isEs ? "es-ES" : "en-US";
    utterance.rate = 0.95;

    utterance.onend = function () {
      btn.textContent = isEs ? "🔊 Leer" : "🔊 Read";
    };
    utterance.onerror = function () {
      btn.textContent = isEs ? "🔊 Leer" : "🔊 Read";
    };

    window.speechSynthesis.speak(utterance);
  }

  // --- Cheats & Auto-Wins ---
  function findPhaserGame() {
    for (var key in window) {
      try {
        if (window[key] && window[key] instanceof Phaser.Game) {
          return window[key];
        }
      } catch (e) {}
    }
    return window.game || window.ffGame || null;
  }

  function cheatAutoWin() {
    var pg = findPhaserGame();
    if (pg) {
      try {
        var activeScene = pg.scene.getScenes(true)[0];
        if (activeScene) {
          activeScene.score = (activeScene.score || 0) + 10000;
          activeScene.lives = 99;
          activeScene.level = (activeScene.level || 1) + 1;

          if (typeof activeScene.winLevel === "function") activeScene.winLevel();
          else if (typeof activeScene.nextLevel === "function") activeScene.nextLevel();
          else if (typeof activeScene.endGame === "function") activeScene.endGame(true);
          else {
            var keys = Object.keys(pg.scene.keys);
            var endScene = keys.find((k) => /result|win|end|score|victory/i.test(k));
            if (endScene) activeScene.scene.start(endScene);
          }
          alert("Auto-win triggered on Phaser Game scene!");
          return;
        }
      } catch (e) {
        console.error("Phaser cheat error", e);
      }
    }

    if (typeof window.S !== "undefined") {
      try {
        window.S.score = (window.S.score || 0) + 5000;
        window.S.lives = 99;
        if (typeof window.ROUNDS !== "undefined") {
          window.S.round = window.ROUNDS - 1;
        }
        if (typeof window.endGame === "function") {
          window.endGame(true);
        } else if (typeof window.roundWon === "function") {
          window.roundWon();
        }
        alert("Auto-win triggered on Game State S!");
        return;
      } catch (e) {}
    }

    try {
      if (typeof window.winGame === "function") window.winGame();
      else if (typeof window.winLevel === "function") window.winLevel();
      else alert("No active game engine loop found to auto-win.");
    } catch (e) {}
  }

  function cheatAddLives() {
    var pg = findPhaserGame();
    if (pg) {
      try {
        var activeScene = pg.scene.getScenes(true)[0];
        if (activeScene) {
          activeScene.lives = 99;
          if (activeScene.livesLabel) activeScene.livesLabel.setText("Lives: 99");
          alert("Lives set to 99 inside Phaser Scene!");
        }
      } catch (e) {}
    }
    if (typeof window.S !== "undefined") {
      window.S.lives = 99;
      var hudLives = document.getElementById("hud-lives") || document.getElementById("r-lives");
      if (hudLives) hudLives.textContent = "❤️❤️❤️ (99)";
      alert("Lives set to 99 in state S!");
    }
  }

  // Teacher-mode gate — shares the sticky key set by the password-gated
  // Teacher toggle (engine/core/teacher-mode.js). No student path IN.
  function isTeacherDevice() {
    try {
      return localStorage.getItem("nt-teacher-mode") === "1";
    } catch (e) {
      return false;
    }
  }

  // --- Confetti Burst ---
  function playConfetti() {
    if (typeof Confetti !== "undefined") {
      Confetti.burst();
      return;
    }
    for (var i = 0; i < 60; i++) {
      var c = document.createElement("div");
      c.className = "gfx-spark";
      c.style.left = Math.random() * 100 + "vw";
      c.style.top = Math.random() * 100 + "vh";
      c.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
      document.body.appendChild(c);
      try {
        var anim = c.animate(
          [
            { transform: "translate(0, 0) scale(1)", opacity: 1 },
            {
              transform: "translate(" + (Math.random() * 100 - 50) + "px, 250px) scale(0)",
              opacity: 0,
            },
          ],
          { duration: 1500 + Math.random() * 1000 },
        );
        anim.onfinish = (function (n) {
          return function () {
            if (n.parentNode) n.parentNode.removeChild(n);
          };
        })(c);
      } catch (e) {
        if (c.parentNode) c.parentNode.removeChild(c);
      }
    }
  }

  // --- LMS/SCORM Integration Bridge ---
  var LMSBridge = {
    getAPI: function () {
      var win = window;
      try {
        while (win) {
          if (win.API) return { api: win.API, version: "1.2" };
          if (win.API_1484_11) return { api: win.API_1484_11, version: "2004" };
          if (win.parent && win.parent !== win) win = win.parent;
          else break;
        }
      } catch (e) {}
      return null;
    },
    reportScore: function (score, maxScore, stars) {
      var scorm = this.getAPI();
      if (scorm) {
        try {
          var api = scorm.api;
          if (scorm.version === "1.2") {
            api.LMSSetValue("cmi.core.score.raw", String(score));
            if (maxScore) api.LMSSetValue("cmi.core.score.max", String(maxScore));
            api.LMSSetValue("cmi.core.lesson_status", "completed");
            api.LMSCommit("");
          } else {
            api.SetValue("cmi.score.raw", String(score));
            if (maxScore) api.SetValue("cmi.score.max", String(maxScore));
            api.SetValue("cmi.completion_status", "completed");
            api.Commit("");
          }
          console.log("[LMSBridge] SCORM reported score:", score);
        } catch (e) {
          console.error("[LMSBridge] SCORM failed", e);
        }
      }

      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage(
            {
              type: "game_completed",
              score: score,
              maxScore: maxScore || score || 100,
              stars: stars || 3,
              completed: true,
              timestamp: new Date().toISOString(),
            },
            "*",
          );
          console.log("[LMSBridge] postMessage reported score:", score);
        } catch (e) {}
      }
    },
    initResizeHelper: function () {
      setInterval(function () {
        if (window.parent && window.parent !== window) {
          try {
            window.parent.postMessage(
              {
                type: "lti.frameResize",
                height: document.body.scrollHeight || document.documentElement.scrollHeight,
              },
              "*",
            );
          } catch (e) {}
        }
      }, 1000);
    },
  };

  window.GameFX = {
    celebrate: celebrate,
    burst: burst,
    pop: pop,
    shake: shakeScreen,
    flash: flashScreen,
    shockwave: spawnShockwave,
    glitch: triggerScreenGlitch,
    reduce: reduce,
    bilingual: true,
    soundInjected: true,
    comboInjected: true,
  };

  window.toggleCabinetFilter = function () {
    var btn = document.getElementById("sw-filter");
    if (btn) {
      var active = btn.classList.toggle("active");
      if (active) {
        AudioSynth.muffle();
      } else {
        AudioSynth.unmuffle();
      }
    }
  };

  window.toggleGameLanguage = function () {
    var isEs = !document.body.classList.contains("es");
    // Keep html[lang] in sync so game-access TTS picks the matching voice.
    document.documentElement.lang = isEs ? "es" : "en";
    translateDOM(isEs);
    var btn = document.getElementById("btn-game-lang");
    if (btn) btn.textContent = isEs ? "🌐 Idioma: ES" : "🌐 Language: EN";
  };
  window.readGameAloud = readAloud;

  window.toggleGameSound = function () {
    AudioSynth.muted = !AudioSynth.muted;
    var btn = document.getElementById("btn-game-sound");
    if (btn) btn.textContent = AudioSynth.muted ? "🔇 Sound: OFF" : "🔊 Sound: ON";
    if (!AudioSynth.muted) AudioSynth.startMusic();
    else AudioSynth.stopMusic();
  };

  window.toggleGameContrast = function () {
    var hc = document.body.classList.toggle("high-contrast");
    var btn = document.getElementById("btn-game-contrast");
    if (btn) btn.textContent = hc ? "🌓 Contrast: HIGH" : "🌓 Contrast: NORM";
  };

  window.toggleControlsDialog = function () {
    var el = document.getElementById("game-controls-dialog");
    if (el) el.classList.toggle("show");
  };

  window.toggleCheatConsole = function () {
    if (!isTeacherDevice()) return;
    var el = document.getElementById("teacher-cheat-console");
    if (el) el.classList.toggle("show");
  };
  window.cheatAutoWin = cheatAutoWin;
  window.cheatAddLives = cheatAddLives;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    if (!document.body) return;

    LMSBridge.initResizeHelper();

    // game-access.js owns Read-aloud where present; game-juice.js owns music
    // where present — avoid double TTS buttons / double music loops.
    var hasAccess = !!document.querySelector('script[src*="game-access"]');
    var hasJuice = !!document.querySelector('script[src*="game-juice"]');

    // Start background retro music loop (motion-safe users only, one loop max)
    if (!reduce && !hasJuice) AudioSynth.startMusic();

    // Games load straight into play — no BIOS boot splash, no CRT screen warp.

    // Lazy-load the "See It" math visual helper (self-guards to mapped games).
    if (!document.querySelector('script[src*="game-visuals.js"]')) {
      var gv = document.createElement("script");
      gv.src = "/assets/game-visuals.js";
      gv.defer = true;
      document.head.appendChild(gv);
    }

    // 1. Inject Floating Bilingual, Sound, Contrast, Controls & TTS Toolbar
    var toolbar = document.createElement("div");
    toolbar.id = "game-pub-toolbar";
    toolbar.className = "no-print";
    toolbar.innerHTML = `
      <button class="pub-btn" id="btn-game-lang" onclick="toggleGameLanguage()">🌐 Language: EN</button>
      ${hasAccess ? "" : '<button class="pub-btn" id="btn-game-read" onclick="readGameAloud()">🔊 Read</button>'}
      <button class="pub-btn" id="btn-game-sound" onclick="toggleGameSound()">🔊 Sound: ON</button>
      <button class="pub-btn" id="btn-game-contrast" onclick="toggleGameContrast()">🌓 Contrast: NORM</button>
      <button class="pub-btn" id="btn-game-controls" onclick="toggleControlsDialog()">⌨️ Controls</button>
    `;
    document.body.appendChild(toolbar);

    // 2. Inject Combo Streak HUD banner overlay
    var comboHud = document.createElement("div");
    comboHud.id = "game-combo-hud";
    comboHud.className = "no-print";
    document.body.appendChild(comboHud);

    // 2b. Inject Combo energy meter gauge and control switches bezel
    var meterDiv = document.createElement("div");
    meterDiv.id = "gfx-combo-meter";
    meterDiv.className = "no-print";
    meterDiv.innerHTML = '<div id="gfx-combo-fill"></div>';
    document.body.appendChild(meterDiv);

    // Glass specular glare layer for 3D parallax depth
    var glare = document.createElement("div");
    glare.className = "gfx-specular-glare no-print";
    document.body.appendChild(glare);

    // Pointer move listener to drive the glass parallax glare shift
    window.addEventListener("pointermove", function (e) {
      document.body.style.setProperty("--glare-x", String(e.clientX));
      document.body.style.setProperty("--glare-y", String(e.clientY));
    });

    var cabinet = document.createElement("div");
    cabinet.id = "gfx-arcade-controls";
    cabinet.className = "no-print";
    cabinet.innerHTML = `
      <button class="arcade-switch" id="sw-filter" onclick="toggleCabinetFilter()">🎛️ Audio LPF</button>
      <canvas id="gfx-equalizer" width="70" height="24"></canvas>
    `;
    document.body.appendChild(cabinet);

    // Start the audio-reactive visualizer renderer loop
    drawBezelEqualizer();

    // 3. Inject Hidden Teacher Cheat Console — teacher-mode devices only
    // (sticky nt-teacher-mode key; students have no path in).
    if (isTeacherDevice()) {
      var consoleDiv = document.createElement("div");
      consoleDiv.id = "teacher-cheat-console";
      consoleDiv.className = "no-print";
      consoleDiv.innerHTML = `
      <h4>
        <span>🔑 Teacher Grading & Cheats</span>
        <button class="close-btn" onclick="toggleCheatConsole()">×</button>
      </h4>
      <p style="font-size:11px;color:#94a3b8;margin:0 0 10px;">Diagnostics options for checking gameplay:</p>
      <button class="cheat-btn" onclick="cheatAutoWin()">⚡ Skip to End / Auto-Win</button>
      <button class="cheat-btn" onclick="cheatAddLives()">💖 Add Unlimited Lives</button>
    `;
      document.body.appendChild(consoleDiv);
    }

    // 4. Inject Keyboard Controls Dialog
    var controlsDiv = document.createElement("div");
    controlsDiv.id = "game-controls-dialog";
    controlsDiv.className = "no-print";
    controlsDiv.innerHTML = `
      <h4>
        <span>⌨️ Keyboard Navigation & Controls</span>
        <button class="close-btn" onclick="toggleControlsDialog()">×</button>
      </h4>
      <p style="font-size:12px;margin:0 0 8px;line-height:1.4;color:#e2e8f0;">Use the following keystrokes to play this activity:</p>
      <ul style="font-size:11px;color:#94a3b8;padding-left:16px;margin:0;line-height:1.6;">
        <li><strong>Tab</strong> : Move focus between options and interactive tiles.</li>
        <li><strong>Enter / Space</strong> : Select a focused option or button.</li>
        <li><strong>Arrow Keys (Left/Right)</strong> : Slide, navigate, or direct standard horizontal mechanics.</li>
        <li><strong>Escape</strong> : Close overlays or return to the main menu.</li>
      </ul>
      <button class="cheat-btn" style="text-align:center;margin-top:12px;background:#0284c7;color:#fff;" onclick="toggleControlsDialog()">Close</button>
    `;
    document.body.appendChild(controlsDiv);

    // 5. Global touch ripple effect listener
    document.addEventListener("pointerdown", function (e) {
      if (
        e.target.closest("#game-pub-toolbar") ||
        e.target.closest("#teacher-cheat-console") ||
        e.target.closest("#game-controls-dialog")
      )
        return;
      spawnClickRipple(e.clientX, e.clientY);
    });

    // 6. Cheat-console openers — teacher-mode devices only
    if (isTeacherDevice()) {
      document.addEventListener("keydown", function (e) {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "t") {
          e.preventDefault();
          window.toggleCheatConsole();
        }
      });

      var header =
        document.querySelector("h1") ||
        document.querySelector("h2") ||
        document.querySelector(".hero");
      if (header) {
        var clicks = 0;
        header.addEventListener("click", function () {
          clicks++;
          if (clicks >= 3) {
            window.toggleCheatConsole();
            clicks = 0;
          }
          setTimeout(function () {
            clicks = 0;
          }, 1000);
        });
      }
    }

    // 7. Auto-confetti and LMS score reporting listener
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          var target = mutation.target;
          var isWin = target.classList.contains("won") || target.classList.contains("success");
          var isWrong =
            target.classList.contains("wrong") ||
            target.classList.contains("incorrect") ||
            target.classList.contains("fail");

          if (isWin) {
            playConfetti();
            AudioSynth.playSuccess();

            var finalScore = 0;
            var finalStars = 3;
            if (typeof window.S !== "undefined") {
              finalScore = window.S.score || 0;
              finalStars = window.S.stars || 3;
            } else {
              var pg = findPhaserGame();
              if (pg) {
                try {
                  var activeScene = pg.scene.getScenes(true)[0];
                  if (activeScene) {
                    finalScore = activeScene.score || activeScene.finalScore || 0;
                    finalStars = activeScene.stars || 3;
                  }
                } catch (e) {}
              }
            }
            LMSBridge.reportScore(finalScore, null, finalStars);
          } else if (isWrong) {
            AudioSynth.playError();
            flashScreen("rgba(239, 68, 68, 0.35)");
            triggerScreenGlitch(300);
            shakeScreen();
            comboStreak = 0;
            updateComboHUD(0);
          }
        }
      });
    });
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ["class"],
    });

    // Success sparkles observer with synthesized sound trigger & streak combo accumulator
    try {
      if (window.MutationObserver) {
        var fired = typeof WeakSet === "function" ? new WeakSet() : null;
        var obs = new MutationObserver(function (muts) {
          for (var i = 0; i < muts.length; i++) {
            var t = muts[i].target;
            if (!t || t.nodeType !== 1 || typeof t.className !== "string") continue;

            var isCorrect = SUCCESS_CLASS.test(t.className);
            var isIncorrect = WRONG_CLASS.test(t.className);

            if (isCorrect) {
              var isInteractive =
                t.tagName === "BUTTON" ||
                t.getAttribute("role") === "button" ||
                INTERACTIVE.test(t.className);
              if (!isInteractive) continue;
              if (fired) {
                if (fired.has(t)) continue;
                fired.add(t);
              }
              celebrate(t);
              AudioSynth.playSuccess();
              flashScreen("rgba(16, 185, 129, 0.15)");
              spawnShockwave(lastPointer.x, lastPointer.y);

              var scoreMsg = "+100";
              if (comboStreak >= 3) {
                scoreMsg = "+" + 100 * comboStreak + " COMBO!";
              }
              spawnFloatingScore(scoreMsg, lastPointer.x, lastPointer.y);

              comboStreak++;
              updateComboHUD(comboStreak);
            } else if (isIncorrect) {
              AudioSynth.playError();
              flashScreen("rgba(239, 68, 68, 0.35)");
              triggerScreenGlitch(300);
              shakeScreen();
              comboStreak = 0;
              updateComboHUD(0);
            }
          }
        });
        obs.observe(document.body, {
          subtree: true,
          attributes: true,
          attributeFilter: ["class"],
        });
      }
    } catch (e) {}

    // Pointer parallax
    try {
      var heroes = document.querySelectorAll("[data-parallax], .ghero");
      Array.prototype.forEach.call(heroes, function (h) {
        var layer = h.querySelector("[data-parallax-layer]") || h.querySelector(".deco");
        if (!layer) return;
        h.addEventListener("pointermove", function (e) {
          var r = h.getBoundingClientRect();
          if (!r.width) return;
          var dx = (e.clientX - r.left) / r.width - 0.5;
          var dy = (e.clientY - r.top) / r.height - 0.5;
          layer.style.transform = "translate(" + dx * 16 + "px," + dy * 16 + "px)";
        });
        h.addEventListener("pointerleave", function () {
          layer.style.transform = "";
        });
      });
    } catch (e) {}
  });
})();
