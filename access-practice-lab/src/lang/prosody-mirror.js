// Acoustic Prosody & Stress Mirror (src/lang/prosody-mirror.js)
// 100% On-Device Web Audio API AnalyserNode rhythm & stress envelope.
// Compares student pacing/stress visually beneath the model wave without punishing accents.

import { i18nFor } from "../i18n.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { html, icon, raw } from "../util.js";

let liveBars = [12, 24, 18, 36, 22, 14, 30, 42, 20, 16, 28, 34];
let listening = false;
let stream = null;
let audioCtx = null;
let rafId = null;

function barsSVG(bars, color, label) {
  const rects = bars.map((v, i) => {
    const h = Math.max(6, Math.min(48, v));
    const y = 52 - h;
    return `<rect x="${i * 22 + 4}" y="${y}" width="14" height="${h}" rx="4" fill="${color}"/>`;
  }).join("");
  return `<svg viewBox="0 0 272 56" width="100%" height="56" role="img" aria-label="${label}">${rects}</svg>`;
}

export function prosodyMirrorHTML(ctx, modelSentence = "Evidence helps explain how systems change over time.") {
  const I = i18nFor(ctx);
  const modelBars = [14, 38, 18, 22, 42, 16, 28, 44, 18, 26, 36, 20];
  return html`<section class="panel no-print" style="margin:1rem 0;border:1.5px solid #075568;" aria-labelledby="pmTitle">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;">
      <div>
        <p class="eyebrow">${I.T("Acoustic Prosody & Stress Mirror", "Espejo de ritmo y acento")}</p> <!-- ES-REVIEW -->
        <h2 id="pmTitle" style="margin:0;font-size:1.1rem;">${I.T("Practice Pacing & Sentence Stress", "Practica el ritmo y el énfasis")}</h2> <!-- ES-REVIEW -->
      </div>
      <span class="is-std-pill">${I.T("Audio stays on your device.", "El audio permanece en tu dispositivo.")}</span> <!-- ES-REVIEW -->
    </div>
    <p class="fine" style="margin:.5rem 0;"><strong>Model:</strong> ${modelSentence}</p>
    <div style="background:#f7f4ec;padding:.6rem;border-radius:10px;border:1px solid #d5d9e0;">
      <small>Model Stress Envelope</small>
      ${raw(barsSVG(modelBars, "#17324d", "Model sentence stress wave"))}
      <small>Your Voice Rhythm</small>
      <div id="pmLiveWave">${raw(barsSVG(liveBars, "#1fa6a2", "Your voice rhythm wave"))}</div>
    </div>
    <div class="is-actions" style="margin-top:.75rem;">
      <button type="button" class="btn small" data-pm-hear="${modelSentence}">${icon("volume")} ${I.T("Hear Model", "Escuchar modelo")}</button>
      <button type="button" class="btn btn-primary small" data-pm-toggle>${listening ? I.T("Stop Mirror", "Detener espejo") : I.T("Start Voice Mirror", "Iniciar espejo de voz")}</button>
    </div>
  </section>`;
}

export async function onProsodyMirrorClick(e, ctx) {
  const hear = e.target.closest("[data-pm-hear]");
  if (hear) {
    stopSpeech();
    speak(hear.dataset.pmHear, { rate: 0.9 });
    return true;
  }
  if (e.target.closest("[data-pm-toggle]")) {
    if (listening) {
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
      audioCtx?.close();
      listening = false;
      ctx.rerender();
      return true;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      listening = true;
      ctx.rerender();
      const tick = () => {
        if (!listening) return;
        analyser.getByteFrequencyData(buf);
        liveBars = Array.from({ length: 12 }, (_, i) => Math.max(8, Math.round((buf[i] || 10) / 4)));
        const el = document.getElementById("pmLiveWave");
        if (el) el.innerHTML = barsSVG(liveBars, "#1fa6a2", "Your voice rhythm wave");
        rafId = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      listening = false;
    }
    return true;
  }
  return false;
}
