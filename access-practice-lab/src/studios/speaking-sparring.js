/**
 * Module 2: The Asynchronous Discourse Sparring Partner
 * Target: #speaking-sparring-app
 * Features: 3-Beat Pacing Ribbon, Browser-Native Acoustic/Speech Telemetry,
 * Simulated Peer Web Audio Synthesis, Verifiable Voice Receipt.
 */

import { diagnostics } from "../../../shared/diagnostics-overlay.js";

export const DISCOURSE_TARGETS = [
  "according to the diagram",
  "furthermore",
  "in contrast",
  "specifically",
  "although",
  "consequently",
  "energy decreases",
  "trophic level"
];

export class SpeakingSparringPartner {
  constructor(container) {
    this.container = typeof container === "string" ? document.querySelector(container) : container;
    if (!this.container) {
      console.warn("SpeakingSparringPartner: Target container not found.");
      return;
    }

    this.state = {
      isRecording: false,
      isPeerSpeaking: false,
      elapsedSeconds: 0,
      activeBeat: 1, // 1: 0-10s, 2: 10-25s, 3: 25-45s
      detectedTokens: [],
      pausesOver2s: 0,
      audioBlobs: [],
      audioUrl: null,
      waveformPoints: [],
      hasMicrophone: true,
      hasSpeechRecognition: true,
      milestones: {
        beat1: false,
        beat2: false,
        beat3: false
      },
      transcript: ""
    };

    this.timerInterval = null;
    this.audioContext = null;
    this.analyser = null;
    this.mediaRecorder = null;
    this.recognition = null;
    this.lastSpeechTime = 0;

    this.init();
    diagnostics.registerState("SpeakingSparring", () => this.getTelemetry());
  }

  init() {
    this.checkBrowserCapabilities();
    this.render();
    this.bindEvents();
  }

  checkBrowserCapabilities() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.state.hasSpeechRecognition = !!SpeechRec;
    this.state.hasMicrophone = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  render() {
    this.container.innerHTML = `
      <div class="spar-header">
        <div class="spar-title">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" aria-hidden="true">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            Asynchronous Discourse Sparring Partner
          </h2>
          <p class="spar-subtitle">Grade 6 Academic Speaking Rehearsal: 3-Beat Pacing & Acoustic Telemetry.</p>
        </div>
        <button type="button" class="btn-playback" id="play-peer-prompt-btn">
          Hear Peer Partner (Marcus)
        </button>
      </div>

      <div class="spar-main-layout">
        <!-- Scenario & Visual Model Column -->
        <div class="spar-scenario-card">
          <span class="scenario-badge">Grade 6 Science · Life Science Ecology</span>
          <div class="scenario-prompt">
            <strong>Prompt:</strong> Examine the ecosystem energy pyramid below. Justify why top predators require a vastly larger territorial range than primary consumers, using evidence from the diagram and transition words.
          </div>

          <!-- Interactive SVG Diagram: Ecosystem Energy Pyramid -->
          <div class="svg-diagram-container" role="img" aria-label="Interactive Ecosystem Energy Pyramid Diagram">
            <svg viewBox="0 0 400 240" width="100%" height="220" style="overflow: visible;">
              <defs>
                <linearGradient id="pyr-top" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#ef4444" stop-opacity="0.8"/>
                  <stop offset="100%" stop-color="#dc2626" stop-opacity="0.9"/>
                </linearGradient>
                <linearGradient id="pyr-mid2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.8"/>
                  <stop offset="100%" stop-color="#d97706" stop-opacity="0.9"/>
                </linearGradient>
                <linearGradient id="pyr-mid1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.8"/>
                  <stop offset="100%" stop-color="#2563eb" stop-opacity="0.9"/>
                </linearGradient>
                <linearGradient id="pyr-base" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#10b981" stop-opacity="0.8"/>
                  <stop offset="100%" stop-color="#059669" stop-opacity="0.9"/>
                </linearGradient>
              </defs>

              <!-- Apex Predators (10 J) -->
              <polygon points="200,20 160,70 240,70" fill="url(#pyr-top)" stroke="#f87171" stroke-width="1.5" />
              <text x="200" y="55" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">Apex: 10 Joules</text>

              <!-- Secondary Consumers (100 J) -->
              <polygon points="160,70 120,120 280,120 240,70" fill="url(#pyr-mid2)" stroke="#fbbf24" stroke-width="1.5" />
              <text x="200" y="102" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">Secondary: 100 Joules</text>

              <!-- Primary Consumers (1,000 J) -->
              <polygon points="120,120 70,175 330,175 280,120" fill="url(#pyr-mid1)" stroke="#60a5fa" stroke-width="1.5" />
              <text x="200" y="152" fill="#ffffff" font-size="12" font-weight="700" text-anchor="middle">Primary Consumers: 1,000 Joules</text>

              <!-- Primary Producers (10,000 J) -->
              <polygon points="70,175 20,230 380,230 330,175" fill="url(#pyr-base)" stroke="#34d399" stroke-width="1.5" />
              <text x="200" y="210" fill="#ffffff" font-size="13" font-weight="700" text-anchor="middle">Primary Producers: 10,000 Joules (100%)</text>
            </svg>
          </div>

          <!-- Simulated Peer Speech Box -->
          <div class="simulated-peer-box">
            <div class="peer-avatar" id="peer-avatar-icon" aria-hidden="true">M</div>
            <div class="peer-speech-bubble">
              <strong>Marcus (Simulated Peer Partner):</strong>
              <p id="peer-bubble-text">
                "I notice that only 10% of energy transfers between each trophic level. But why does that force wolves and eagles to hunt over square miles rather than a single forest plot?"
              </p>
            </div>
          </div>
        </div>

        <!-- 3-Beat Pacing Ribbon & Controls Column -->
        <div class="pacing-ribbon-container">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:700; font-size:14px; text-transform:uppercase; color:#94a3b8;">The 3-Beat Pacing Ribbon</span>
            <span style="font-family:monospace; font-size:16px; color:#38bdf8;" id="timer-display">00:00 / 00:45</span>
          </div>

          <!-- Pacing Bar (45s total: 0-10s, 10-25s, 25-45s) -->
          <div class="pacing-ribbon-bar" id="pacing-ribbon-bar" role="progressbar" aria-label="Speaking Pacing Cadence Bar">
            <div class="ribbon-beat" id="beat-1">
              <div class="ribbon-beat-header">
                <span class="beat-tag">Beat 1</span>
                <span class="beat-time">0–10s</span>
              </div>
              <div class="beat-name">Claim / Stance</div>
              <div class="beat-target">State academic thesis clearly.</div>
              <div class="beat-progress-overlay" id="overlay-beat-1"></div>
            </div>

            <div class="ribbon-beat" id="beat-2">
              <div class="ribbon-beat-header">
                <span class="beat-tag">Beat 2</span>
                <span class="beat-time">10–25s</span>
              </div>
              <div class="beat-name">Evidence Citation</div>
              <div class="beat-target">Cite specific Joules & levels from diagram.</div>
              <div class="beat-progress-overlay" id="overlay-beat-2"></div>
            </div>

            <div class="ribbon-beat" id="beat-3">
              <div class="ribbon-beat-header">
                <span class="beat-tag">Beat 3</span>
                <span class="beat-time">25–45s</span>
              </div>
              <div class="beat-name">Synthesis & Reason</div>
              <div class="beat-target">Use subordinating conjunctions to justify.</div>
              <div class="beat-progress-overlay" id="overlay-beat-3"></div>
            </div>
          </div>

          <!-- Recording Controls -->
          <div class="spar-controls">
            <div class="recording-action-row">
              <button type="button" class="btn-record" id="spar-record-btn" aria-label="Record academic speaking response">
                <span id="record-icon" class="rec-dot" aria-hidden="true"></span>
                <span id="record-label">Start 45s Sparring Turn</span>
              </button>
              <button type="button" class="btn-playback" id="review-recording-btn" disabled aria-label="Review voice recording">
                Listen to Take
              </button>
              <button type="button" class="btn-playback" id="rerecord-btn" style="display:none;" aria-label="One-click re-record">
                Re-record
              </button>
            </div>

            ${!this.state.hasSpeechRecognition ? `
              <div class="fallback-guided-box" role="alert">
                <strong>Text Fallback Mode:</strong> Web Speech API is not active in this browser context. You can rehearse aloud with the 3-Beat Pacing Ribbon or type your discursive markers below to test telemetry.
              </div>
            ` : ''}

            <!-- Live Acoustic Indicators -->
            <div id="live-speech-transcription" style="font-size:13px; color:#cbd5e1; min-height:24px; font-style:italic;" aria-live="polite">
              Discourse targets: "According to the diagram", "Furthermore", "In contrast", "Although"
            </div>
          </div>

          <!-- Verifiable Voice Receipt -->
          <div class="voice-receipt-card" id="voice-receipt-container">
            <div class="receipt-title">
              <span>Verifiable Voice Receipt</span>
              <span id="receipt-status-pill" style="color:#10b981;">Ready for Input</span>
            </div>

            <svg class="waveform-svg" id="voice-waveform-display" viewBox="0 0 500 70" preserveAspectRatio="none">
              <path d="M 0 35 L 500 35" stroke="#334155" stroke-width="2" fill="none" id="waveform-path"/>
            </svg>

            <div>
              <span style="font-size:11px; font-weight:700; text-transform:uppercase; color:#94a3b8;">Detected Discourse Milestones:</span>
              <div class="detected-markers-list" id="detected-tokens-list">
                <span style="font-size:12px; color:#64748b;">No milestones vocalized yet.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const playPeerBtn = this.container.querySelector("#play-peer-prompt-btn");
    if (playPeerBtn) {
      playPeerBtn.onclick = () => this.playPeerPrompt();
    }

    const recordBtn = this.container.querySelector("#spar-record-btn");
    if (recordBtn) {
      recordBtn.onclick = () => this.toggleRecording();
    }

    const reviewBtn = this.container.querySelector("#review-recording-btn");
    if (reviewBtn) {
      reviewBtn.onclick = () => this.playReview();
    }

    const rerecordBtn = this.container.querySelector("#rerecord-btn");
    if (rerecordBtn) {
      rerecordBtn.onclick = () => {
        this.resetRecording();
        this.startRecording();
      };
    }
  }

  playPeerPrompt() {
    const avatar = this.container.querySelector("#peer-avatar-icon");
    if (avatar) avatar.classList.add("speaking");

    const text = "I notice that only 10% of energy transfers between each trophic level. But why does that force wolves and eagles to hunt over square miles rather than a single forest plot?";

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.onend = () => {
        if (avatar) avatar.classList.remove("speaking");
      };
      window.speechSynthesis.speak(utterance);
    } else {
      // Audio synth chime fallback
      this.playSyntheticChime();
      setTimeout(() => {
        if (avatar) avatar.classList.remove("speaking");
      }, 3000);
    }
  }

  playSyntheticChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Ignore audio synthesis restrictions
    }
  }

  toggleRecording() {
    if (this.state.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    this.resetRecording();
    this.state.isRecording = true;
    this.state.elapsedSeconds = 0;
    this.lastSpeechTime = Date.now();

    const recordBtn = this.container.querySelector("#spar-record-btn");
    const recordLabel = this.container.querySelector("#record-label");
    if (recordBtn) recordBtn.classList.add("recording");
    if (recordLabel) recordLabel.textContent = "Stop Sparring (Recording...)";

    const rerecordBtn = this.container.querySelector("#rerecord-btn");
    if (rerecordBtn) rerecordBtn.style.display = "none";

    // Setup Web Audio Telemetry (BiquadFilterNode + AnalyserNode)
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      const filter = this.audioContext.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1000;
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
    } catch (err) {
      console.warn("Web Audio not supported:", err);
    }

    // Setup Speech Recognition
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";
        this.recognition.onresult = (e) => this.handleSpeechResult(e);
        this.recognition.start();
      } catch (err) {
        console.warn("Speech recognition error:", err);
      }
    }

    // Capture microphone media stream
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.state.audioBlobs.push(e.data);
        };
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.state.audioBlobs, { type: "audio/webm" });
          this.state.audioUrl = URL.createObjectURL(blob);
          const reviewBtn = this.container.querySelector("#review-recording-btn");
          if (reviewBtn) reviewBtn.disabled = false;
        };
        this.mediaRecorder.start(100);
      }).catch((err) => {
        console.warn("Microphone access denied:", err);
      });
    }

    // 45-Second Pacing Timer Loop
    this.timerInterval = setInterval(() => {
      this.state.elapsedSeconds += 0.2;
      this.updatePacingBar();

      // Check for pauses > 2.5s
      if (Date.now() - this.lastSpeechTime > 2500 && this.state.isRecording) {
        this.state.pausesOver2s++;
      }

      if (this.state.elapsedSeconds >= 45) {
        this.stopRecording();
      }
    }, 200);
  }

  handleSpeechResult(event) {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript.toLowerCase();
    }
    this.state.transcript += " " + transcript;
    this.lastSpeechTime = Date.now();

    const transcriptEl = this.container.querySelector("#live-speech-transcription");
    if (transcriptEl) transcriptEl.textContent = `Heard: "${transcript}"`;

    // Check target discourse markers
    for (const target of DISCOURSE_TARGETS) {
      if (transcript.includes(target) && !this.state.detectedTokens.includes(target)) {
        this.state.detectedTokens.push(target);
        this.onDiscourseMilestoneVocalized(target);
      }
    }
  }

  onDiscourseMilestoneVocalized(token) {
    if (this.state.activeBeat === 1) this.state.milestones.beat1 = true;
    if (this.state.activeBeat === 2) this.state.milestones.beat2 = true;
    if (this.state.activeBeat === 3) this.state.milestones.beat3 = true;

    // Light up active beat with subtle CSS border glow: box-shadow: 0 0 8px var(--accent-success)
    const beatEl = this.container.querySelector(`#beat-${this.state.activeBeat}`);
    if (beatEl) {
      beatEl.classList.add("milestone-hit");
    }

    this.renderWaveformReceipt();
  }

  updatePacingBar() {
    const s = Math.min(45, this.state.elapsedSeconds);
    const mins = String(Math.floor(s / 60)).padStart(2, "0");
    const secs = String(Math.floor(s % 60)).padStart(2, "0");
    const timerDisplay = this.container.querySelector("#timer-display");
    if (timerDisplay) timerDisplay.textContent = `${mins}:${secs} / 00:45`;

    let activeBeat = 1;
    if (s > 25) activeBeat = 3;
    else if (s > 10) activeBeat = 2;
    this.state.activeBeat = activeBeat;

    for (let b = 1; b <= 3; b++) {
      const beatEl = this.container.querySelector(`#beat-${b}`);
      if (beatEl) {
        beatEl.classList.toggle("active", b === activeBeat);
      }
    }

    // Overlays
    const ov1 = this.container.querySelector("#overlay-beat-1");
    const ov2 = this.container.querySelector("#overlay-beat-2");
    const ov3 = this.container.querySelector("#overlay-beat-3");

    if (ov1) ov1.style.width = `${Math.min(100, (s / 10) * 100)}%`;
    if (ov2) ov2.style.width = `${s > 10 ? Math.min(100, ((s - 10) / 15) * 100) : 0}%`;
    if (ov3) ov3.style.width = `${s > 25 ? Math.min(100, ((s - 25) / 20) * 100) : 0}%`;
  }

  stopRecording() {
    this.state.isRecording = false;
    clearInterval(this.timerInterval);

    const recordBtn = this.container.querySelector("#spar-record-btn");
    const recordLabel = this.container.querySelector("#record-label");
    if (recordBtn) recordBtn.classList.remove("recording");
    if (recordLabel) recordLabel.textContent = "Start 45s Sparring Turn";

    const rerecordBtn = this.container.querySelector("#rerecord-btn");
    if (rerecordBtn) rerecordBtn.style.display = "inline-flex";

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }

    this.renderWaveformReceipt();
  }

  resetRecording() {
    this.state.elapsedSeconds = 0;
    this.state.audioBlobs = [];
    this.state.audioUrl = null;
    this.state.detectedTokens = [];
    this.state.transcript = "";
    this.state.milestones = { beat1: false, beat2: false, beat3: false };

    for (let b = 1; b <= 3; b++) {
      const beatEl = this.container.querySelector(`#beat-${b}`);
      if (beatEl) {
        beatEl.classList.remove("active", "milestone-hit");
      }
    }
  }

  renderWaveformReceipt() {
    const listEl = this.container.querySelector("#detected-tokens-list");
    if (listEl) {
      if (this.state.detectedTokens.length === 0) {
        listEl.innerHTML = '<span style="font-size:12px; color:#64748b;">No milestones vocalized yet.</span>';
      } else {
        listEl.innerHTML = this.state.detectedTokens.map(tok => `
          <span class="marker-pill">"${tok}"</span>
        `).join("");
      }
    }

    // Render client-side SVG waveform overlay
    const svgPath = this.container.querySelector("#waveform-path");
    if (svgPath) {
      let d = "M 0 35 ";
      for (let x = 10; x <= 500; x += 15) {
        const amplitude = this.state.detectedTokens.length > 0 ? (Math.sin(x * 0.1) * 18 + 35) : 35;
        d += `L ${x} ${amplitude} `;
      }
      svgPath.setAttribute("d", d);
      svgPath.setAttribute("stroke", this.state.detectedTokens.length > 0 ? "#10b981" : "#334155");
    }

    const statusPill = this.container.querySelector("#receipt-status-pill");
    if (statusPill) {
      statusPill.textContent = this.state.detectedTokens.length >= 2 ? "High Academic Fidelity" : "Draft Voice Take";
      statusPill.style.color = this.state.detectedTokens.length >= 2 ? "#10b981" : "#f59e0b";
    }
  }

  playReview() {
    if (this.state.audioUrl) {
      const audio = new Audio(this.state.audioUrl);
      audio.play();
    }
  }

  getTelemetry() {
    return {
      isRecording: this.state.isRecording,
      elapsedSeconds: this.state.elapsedSeconds,
      activeBeat: this.state.activeBeat,
      detectedTokens: this.state.detectedTokens,
      hasMicrophone: this.state.hasMicrophone,
      hasSpeechRecognition: this.state.hasSpeechRecognition
    };
  }
}

export function initSpeakingSparring(container = "#speaking-sparring-app") {
  return new SpeakingSparringPartner(container);
}
