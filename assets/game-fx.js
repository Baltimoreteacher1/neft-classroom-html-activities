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
  var WRONG_CLASS = /(^|\s)(wrong|incorrect|is-incorrect|is-wrong|fail|error|gfx-wrong)(\s|$)/i;
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
    for (var i = 0; i < 16; i++) {
      var s = document.createElement("div");
      s.className = "gfx-spark";
      s.style.left = cx + "px";
      s.style.top = cy + "px";
      s.style.background = COLORS[i % COLORS.length];
      document.body.appendChild(s);
      var ang = (Math.PI * 2 * i) / 16;
      var dist = 40 + Math.random() * 40;
      var tx = Math.cos(ang) * dist;
      var ty = Math.sin(ang) * dist;
      try {
        var anim = s.animate(
          [
            { transform: "translate(-50%,-50%) scale(1.3) rotate(0deg)", opacity: 1 },
            {
              transform:
                "translate(calc(-50% + " +
                tx +
                "px), calc(-50% + " +
                ty +
                "px)) scale(0) rotate(180deg)",
              opacity: 0,
            },
          ],
          { duration: 750, easing: "cubic-bezier(.1,.8,.3,1)" },
        );
        anim.onfinish = (function (node) {
          return function () {
            if (node.parentNode) node.parentNode.removeChild(node);
          };
        })(s);
      } catch (e) {
        if (s.parentNode) s.parentNode.removeChild(s);
      }
    }
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

  // --- Programmatic Audio & Retro Music Synthesizer ---
  var AudioSynth = {
    muted: false,
    playingMusic: false,
    ctx: null,
    init: function () {
      if (this.ctx) return;
      try {
        var AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
      } catch (e) {}
    },
    playTone: function (freq, type, duration, vol) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      try {
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        var t = this.ctx.currentTime;
        osc.type = type || "sine";
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(vol || 0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.start(t);
        osc.stop(t + duration);
      } catch (e) {}
    },
    playSuccess: function () {
      this.playTone(523.25, "triangle", 0.1, 0.12);
      var self = this;
      setTimeout(function () {
        self.playTone(659.25, "triangle", 0.1, 0.12);
      }, 80);
      setTimeout(function () {
        self.playTone(783.99, "triangle", 0.2, 0.15);
      }, 160);
    },
    playError: function () {
      this.playTone(180, "sawtooth", 0.15, 0.1);
      var self = this;
      setTimeout(function () {
        self.playTone(110, "sawtooth", 0.25, 0.12);
      }, 100);
    },
    startMusic: function () {
      if (this.playingMusic) return;
      this.playingMusic = true;
      var notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 392.0, 329.63]; // C4 pentatonic loop
      var step = 0;
      var self = this;

      musicTimer = setInterval(function () {
        if (self.muted || !self.playingMusic) return;
        // Super soft retro arpeggio
        self.playTone(notes[step % notes.length], "sine", 0.2, 0.015);
        step++;
      }, 350);
    },
    stopMusic: function () {
      this.playingMusic = false;
      if (musicTimer) {
        clearInterval(musicTimer);
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
  function updateComboHUD(streak) {
    var hud = document.getElementById("game-combo-hud");
    if (!hud) return;

    if (streak >= 3) {
      hud.textContent = "🔥 STREAK x" + streak + "! 🔥";
      hud.className = "show pop";
      // Synthesize quick pitch scale tone matching streak count!
      AudioSynth.playTone(300 + streak * 60, "triangle", 0.1, 0.1);
      setTimeout(function () {
        hud.classList.remove("pop");
      }, 300);
    } else {
      hud.className = "";
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

  function cheatFreezeTimer() {
    if (typeof window.S !== "undefined") {
      window.S.time = 9999;
      window.S.timer = 9999;
    }
    var maxId = setInterval(function () {}, 9999);
    for (var i = 0; i < maxId; i++) {
      try {
        clearInterval(i);
      } catch (e) {}
    }
    alert("Countdown Timers frozen!");
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
    reduce: reduce,
    bilingual: true,
    soundInjected: true,
    comboInjected: true,
  };

  window.toggleGameLanguage = function () {
    var isEs = !document.body.classList.contains("es");
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
    var el = document.getElementById("teacher-cheat-console");
    if (el) el.classList.toggle("show");
  };
  window.cheatAutoWin = cheatAutoWin;
  window.cheatAddLives = cheatAddLives;
  window.cheatFreezeTimer = cheatFreezeTimer;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    if (reduce || !document.body) return;

    LMSBridge.initResizeHelper();

    // Start background retro music loop
    AudioSynth.startMusic();

    // 1. Inject Floating Bilingual, Sound, Contrast, Controls & TTS Toolbar
    var toolbar = document.createElement("div");
    toolbar.id = "game-pub-toolbar";
    toolbar.className = "no-print";
    toolbar.innerHTML = `
      <button class="pub-btn" id="btn-game-lang" onclick="toggleGameLanguage()">🌐 Language: EN</button>
      <button class="pub-btn" id="btn-game-read" onclick="readGameAloud()">🔊 Read</button>
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

    // 3. Inject Hidden Teacher Cheat Console
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
      <button class="cheat-btn" onclick="cheatFreezeTimer()">⏱️ Freeze Game Timers</button>
    `;
    document.body.appendChild(consoleDiv);

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

    // 6. Listen for Ctrl+Shift+T or triple click on game title / header
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        toggleCheatConsole();
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
          toggleCheatConsole();
          clicks = 0;
        }
        setTimeout(function () {
          clicks = 0;
        }, 1000);
      });
    }

    // 7. Auto-confetti and LMS score reporting listener
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          var target = mutation.target;
          var isWin =
            target.classList.contains("game-over") ||
            target.classList.contains("won") ||
            target.classList.contains("success");
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

              comboStreak++;
              updateComboHUD(comboStreak);
            } else if (isIncorrect) {
              AudioSynth.playError();
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
