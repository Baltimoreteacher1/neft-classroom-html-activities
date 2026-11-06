// Stage 3: Speech-to-Math Reasoning Sparkles & Metacognitive Confidence Gauge
// Integrates browser Web Speech API with live mathematical keyword detection and confidence calibration.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const MATH_KEYWORDS = [
  "numerator", "denominator", "reciprocal", "fraction",
  "decompose", "partial product", "distributive", "regroup",
  "factor", "multiple", "product", "quotient", "divisor", "dividend",
  "equation", "balance", "variable", "inverse", "constant",
  "ratio", "rate", "percent", "proportion",
  "integer", "negative", "positive", "zero pair", "opposite",
  "estimate", "benchmark", "common denominator", "simplify",
];

/**
 * 1. SPEECH REASONING ENGINE
 * Connects to Web Speech API to transcribe student explanations and detect math vocabulary.
 */
export class SpeechReasoningEngine {
  constructor({ onTranscript, onKeywordFound, onError }) {
    this.onTranscript = onTranscript;
    this.onKeywordFound = onKeywordFound;
    this.onError = onError;
    this.recognition = null;
    this.isListening = false;
    this.foundKeywords = new Set();
    this.init();
  }

  init() {
    if (typeof window === "undefined") return;
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) return;

    try {
      this.recognition = new SpeechClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";

      this.recognition.onresult = (event) => {
        let fullText = "";
        for (let i = 0; i < event.results.length; i++) {
          fullText += event.results[i][0].transcript + " ";
        }
        const lower = fullText.toLowerCase();
        if (this.onTranscript) this.onTranscript(fullText.trim());

        MATH_KEYWORDS.forEach((kw) => {
          if (lower.includes(kw) && !this.foundKeywords.has(kw)) {
            this.foundKeywords.add(kw);
            if (this.onKeywordFound) this.onKeywordFound(kw);
          }
        });
      };

      this.recognition.onerror = (err) => {
        this.isListening = false;
        if (this.onError) this.onError(err);
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    } catch (e) {
      this.recognition = null;
    }
  }

  isSupported() {
    return Boolean(this.recognition);
  }

  start() {
    if (!this.recognition || this.isListening) return;
    this.foundKeywords.clear();
    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      if (this.onError) this.onError(e);
    }
  }

  stop() {
    if (!this.recognition || !this.isListening) return;
    try {
      this.recognition.stop();
      this.isListening = false;
    } catch (e) {}
  }
}

/**
 * 2. CONFIDENCE & REFLECTION RADAR
 * Low-anxiety 3-tier gauge helping students calibrate self-assessment.
 */
export function renderConfidenceGauge(currentLevel = null) {
  const levels = [
    { id: "exploring", emoji: "🌱", label: "Exploring", desc: "Still working it out" },
    { id: "confident", emoji: "🌿", label: "Pretty Confident", desc: "Double-checked my steps" },
    { id: "locked", emoji: "🌳", label: "Locked In", desc: "Can explain why this is true" },
  ];

  const buttons = levels.map((lvl) => {
    const isActive = currentLevel === lvl.id;
    return `
      <button type="button" class="conf-gauge-btn ${isActive ? "is-active" : ""}"
        data-conf-level="${lvl.id}" aria-pressed="${isActive}">
        <span class="conf-emoji" aria-hidden="true">${lvl.emoji}</span>
        <span class="conf-label"><strong>${esc(lvl.label)}</strong><small>${esc(lvl.desc)}</small></span>
      </button>
    `;
  }).join("");

  return `
    <div class="confidence-gauge-wrap" data-conf-gauge="true">
      <span class="conf-gauge-title">🎯 Metacognitive Check: How sure are you?</span>
      <div class="conf-gauge-row" role="group" aria-label="Confidence level">
        ${buttons}
      </div>
    </div>
  `;
}

export function mountConfidenceGauge(container, onSelect) {
  if (!container) return;
  const wrap = container.matches("[data-conf-gauge]") ? container : container.querySelector("[data-conf-gauge]");
  if (!wrap) return;

  const btns = wrap.querySelectorAll("[data-conf-level]");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");
      if (onSelect) onSelect(btn.dataset.confLevel);
    });
  });
}
