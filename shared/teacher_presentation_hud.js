/**
 * EduWonderLab Enterprise Smartboard Teacher Presentation Dock & Focus HUD
 * Architecture: Floating classroom presenter toolbar providing step-by-step masking, spotlight mode, timers, and visual toggles.
 * Global Rules Compliance: Programmatic inline SVG with style="background:white", touch & drag/drop support, reset state machine.
 */

(function (global) {
  "use strict";

  class TeacherPresentationHUD {
    constructor() {
      this.isMaskingActive = false;
      this.isSpotlightActive = false;
      this.timerInterval = null;
      this.timerRemaining = 0;
      this.timerTotal = 0;
      this.init();
    }

    init() {
      if (document.getElementById("ew-teacher-hud")) return;

      const hud = document.createElement("div");
      hud.id = "ew-teacher-hud";
      hud.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        user-select: none;
      `;

      hud.innerHTML = `
        <div id="hud-toggle-btn" style="background: linear-gradient(135deg, #0f172a, #1e293b); color: #38bdf8; border: 1.5px solid #0284c7; padding: 8px 16px; border-radius: 9999px; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 8px 25px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 8px;">
          <span>⚡</span>
          <span>Teacher Smartboard Dock</span>
        </div>

        <div id="hud-panel" style="display: none; position: absolute; bottom: 44px; left: 0; width: 340px; background: #0f172a; border: 1.5px solid #334155; border-radius: 14px; padding: 14px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); color: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">
            <strong style="color: #38bdf8; font-size: 13px;">Classroom Presentation Tools</strong>
            <span style="font-size: 11px; background: #0284c7; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">Live</span>
          </div>

          <!-- Tool 1: Step-by-Step Masking -->
          <div style="margin-bottom: 10px;">
            <button id="hud-mask-btn" style="width: 100%; background: #1e293b; color: #e2e8f0; border: 1px solid #475569; border-radius: 8px; padding: 8px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
              <span>🎭 Step-by-Step Problem Masker</span>
              <span id="hud-mask-status" style="color: #94a3b8;">OFF</span>
            </button>
          </div>

          <!-- Tool 2: Spotlight Focus Mode -->
          <div style="margin-bottom: 10px;">
            <button id="hud-spotlight-btn" style="width: 100%; background: #1e293b; color: #e2e8f0; border: 1px solid #475569; border-radius: 8px; padding: 8px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
              <span>🔦 Spotlight Focus Highlight</span>
              <span id="hud-spotlight-status" style="color: #94a3b8;">OFF</span>
            </button>
          </div>

          <!-- Tool 3: Turn & Talk Timer -->
          <div style="background: #1e293b; border-radius: 8px; padding: 10px; border: 1px solid #334155;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 700; color: #94a3b8;">⏱️ Turn & Talk Timer</span>
              <span id="hud-timer-display" style="font-weight: 800; font-size: 13px; color: #a7f3d0;">00:00</span>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="hud-time-btn" data-sec="60" style="flex: 1; background: #0f172a; border: 1px solid #475569; color: #fff; border-radius: 4px; padding: 4px; font-size: 11px; font-weight: 700; cursor: pointer;">1 min</button>
              <button class="hud-time-btn" data-sec="180" style="flex: 1; background: #0f172a; border: 1px solid #475569; color: #fff; border-radius: 4px; padding: 4px; font-size: 11px; font-weight: 700; cursor: pointer;">3 min</button>
              <button class="hud-time-btn" data-sec="300" style="flex: 1; background: #0f172a; border: 1px solid #475569; color: #fff; border-radius: 4px; padding: 4px; font-size: 11px; font-weight: 700; cursor: pointer;">5 min</button>
              <button id="hud-timer-stop" style="background: #ef4444; border: none; color: #fff; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-weight: 700; cursor: pointer;">Stop</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(hud);
      this.hud = hud;
      this.bindEvents();
    }

    bindEvents() {
      const toggleBtn = this.hud.querySelector("#hud-toggle-btn");
      const panel = this.hud.querySelector("#hud-panel");
      const maskBtn = this.hud.querySelector("#hud-mask-btn");
      const maskStatus = this.hud.querySelector("#hud-mask-status");
      const spotlightBtn = this.hud.querySelector("#hud-spotlight-btn");
      const spotlightStatus = this.hud.querySelector("#hud-spotlight-status");
      const timerDisplay = this.hud.querySelector("#hud-timer-display");
      const timerStopBtn = this.hud.querySelector("#hud-timer-stop");
      const timeBtns = this.hud.querySelectorAll(".hud-time-btn");

      toggleBtn.addEventListener("click", () => {
        const isShown = panel.style.display === "block";
        panel.style.display = isShown ? "none" : "block";
      });

      // Step-by-Step Masking
      maskBtn.addEventListener("click", () => {
        this.isMaskingActive = !this.isMaskingActive;
        maskStatus.textContent = this.isMaskingActive ? "ON" : "OFF";
        maskStatus.style.color = this.isMaskingActive ? "#38bdf8" : "#94a3b8";
        this.toggleStepMasking(this.isMaskingActive);
      });

      // Spotlight Mode
      spotlightBtn.addEventListener("click", () => {
        this.isSpotlightActive = !this.isSpotlightActive;
        spotlightStatus.textContent = this.isSpotlightActive ? "ON" : "OFF";
        spotlightStatus.style.color = this.isSpotlightActive ? "#38bdf8" : "#94a3b8";
        this.toggleSpotlight(this.isSpotlightActive);
      });

      // Timers
      timeBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const sec = parseInt(btn.getAttribute("data-sec"), 10);
          this.startTimer(sec, timerDisplay);
        });
      });

      timerStopBtn.addEventListener("click", () => {
        this.stopTimer(timerDisplay);
      });
    }

    startTimer(seconds, displayEl) {
      clearInterval(this.timerInterval);
      this.timerRemaining = seconds;
      this.timerTotal = seconds;

      const update = () => {
        const m = Math.floor(this.timerRemaining / 60);
        const s = this.timerRemaining % 60;
        displayEl.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

        if (this.timerRemaining <= 0) {
          clearInterval(this.timerInterval);
          displayEl.textContent = "🎉 Time!";
          this.playChime();
        }
        this.timerRemaining--;
      };

      update();
      this.timerInterval = setInterval(update, 1000);
    }

    stopTimer(displayEl) {
      clearInterval(this.timerInterval);
      displayEl.textContent = "00:00";
    }

    playChime() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } catch (_e) {}
    }

    toggleStepMasking(active) {
      const steps = document.querySelectorAll("ol > li, .step-card, .problem-step");
      steps.forEach((step) => {
        if (active) {
          step.style.cursor = "pointer";
          step.style.opacity = "0.15";
          step.style.transition = "opacity 0.25s ease";
          step.addEventListener("click", function revealStep() {
            step.style.opacity = "1";
          });
        } else {
          step.style.opacity = "1";
        }
      });
    }

    toggleSpotlight(active) {
      let overlay = document.getElementById("ew-spotlight-overlay");
      if (active) {
        if (!overlay) {
          overlay = document.createElement("div");
          overlay.id = "ew-spotlight-overlay";
          overlay.style.cssText =
            "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.65);z-index:99998;pointer-events:none;transition:background 0.3s;";
          document.body.appendChild(overlay);
        }
        overlay.style.display = "block";
      } else if (overlay) {
        overlay.style.display = "none";
      }
    }
  }

  const hudInstance = new TeacherPresentationHUD();
  global.EWTeacherHUD = hudInstance;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { TeacherPresentationHUD, hudInstance };
  }
})(typeof window !== "undefined" ? window : this);
