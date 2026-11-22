/**
 * Module 4: Adaptive Speaking Simulator with Measured Lifelines
 * Client-side audio containment: MediaRecorder Blobs stay strictly in browser memory
 * and are revoked on unload/reset. Graceful text/simulated fallback if mic is unavailable.
 * State Machine: IDLE -> ACTIVE -> EVALUATING -> FEEDBACK -> COMPLETE
 */

import { BASE, html } from "../../util.js";
import { L1_AUDIO_CUES, SPEAKING_PROMPTS, getLanguageMeta } from "../data/platformData.js";
import { checkFeatureAccess } from "../entitlements/entitlementService.js";
import { evaluateSpeakingResponse } from "../services/intelligenceAdapter.js";
import { STORAGE_KEYS, readStorage, sanitizeAlias, updateStorage } from "../services/storageService.js";
import { createStateMachine, STATES } from "../state/stateMachine.js";
import { upgradeCardHTML } from "../components/ui.js";

export async function render(ctx) {
  const prefs = readStorage(STORAGE_KEYS.PREFS);
  const speakingStore = readStorage(STORAGE_KEYS.SPEAKING);
  const l1 = prefs.l1 || "es";
  const l1Meta = getLanguageMeta(l1);

  const promptItem = SPEAKING_PROMPTS[0];
  const machine = createStateMachine("SpeakingSimulator", {
    promptId: promptItem.id,
    lifelines: [],
    transcript: "",
    recordingUrl: null,
    evaluation: null,
  });

  const clipAccess = checkFeatureAccess("save_clip", (speakingStore.clips || []).length);

  return {
    title: "Adaptive Speaking Simulator — The Language Page",
    html: html`
      <section class="tlp-page">
        <header class="tlp-hero">
          <div>
            <p class="tlp-eyebrow">Practice · Module 4</p>
            <h1>Adaptive Speaking Simulator</h1>
            <p class="tlp-muted tlp-measure">
              Rehearse academic speaking with measured scaffold lifelines. Audio stays in your browser memory only and is never uploaded.
            </p>
          </div>
          ${l1 !== "en"
            ? html`<button type="button" class="tlp-btn tlp-btn-ghost" id="tlpSimL1Btn">
                🔊 ${l1Meta.english} Concept Cue
              </button>`
            : ""}
        </header>

        <div class="tlp-card">
          <div class="tlp-tabs" role="tablist" aria-label="Select speaking prompt">
            ${SPEAKING_PROMPTS.map(
              (p, i) => html`<button
                type="button"
                class="tlp-tab"
                data-sim-prompt="${p.id}"
                aria-selected="${i === 0 ? "true" : "false"}"
              >
                ${p.subject} · ${p.klu}
              </button>`,
            )}
          </div>

          <h2 id="tlpSimTitle" style="margin:0 0 0.4rem;font-size:1.25rem">${promptItem.title}</h2>
          <p id="tlpSimPrompt" class="tlp-measure" style="margin:0 0 0.65rem">${promptItem.prompt}</p>
          <p style="margin:0 0 1rem">
            <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpSimReadPromptBtn" style="min-height:34px;padding:0.3rem 0.85rem;font-size:0.82rem">
              🔊 Hear Prompt Read Aloud
            </button>
          </p>

          <div class="tlp-actions-row" style="margin-bottom:1rem">
            <span class="tlp-muted" style="font-weight:600">Measured Lifelines:</span>
            <button type="button" class="tlp-btn tlp-btn-ghost" data-lifeline="starter">
              Sentence Starter
            </button>
            <button type="button" class="tlp-btn tlp-btn-ghost" data-lifeline="wordbank">
              Word Bank
            </button>
            <button type="button" class="tlp-btn tlp-btn-ghost" data-lifeline="replay">
              🔊 Replay Prompt (0.85×)
            </button>
          </div>

          <div id="tlpLifelineBox" class="tlp-pride-element" hidden style="margin-bottom:1rem"></div>

          <div class="tlp-actions-row" style="margin-bottom:0.85rem">
            <button type="button" class="tlp-btn tlp-btn-primary" id="tlpRecBtn">
              🎙️ Start Recording
            </button>
            <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpSimSampleBtn">
              Try Sample Response
            </button>
            <span id="tlpRecStatus" class="tlp-muted" role="status">Ready (or type/edit below if mic is unavailable)</span>
          </div>

          <audio id="tlpRecAudio" controls hidden style="width:100%;margin-bottom:0.85rem"></audio>

          <label class="tlp-field">
            <span>Live Transcript / Spoken Draft</span>
            <textarea id="tlpSimTranscript" rows="3" placeholder="Speak into your microphone or type your response here..."></textarea>
          </label>

          <div class="tlp-actions-row">
            <button type="button" class="tlp-btn tlp-btn-primary" id="tlpSimEvalBtn">
              Evaluate Response
            </button>
          </div>
        </div>

        <div class="tlp-card" id="tlpSimFeedback" hidden aria-live="polite"></div>

        ${!clipAccess.allowed ? upgradeCardHTML(clipAccess.reason) : ""}

        <p style="margin-top:1.25rem">
          <a class="tlp-btn tlp-btn-ghost" href="${BASE}/">← Back to Language Hub</a>
        </p>
      </section>
    `,
    mount(root) {
      let currentPrompt = SPEAKING_PROMPTS[0];
      let mediaRecorder = null;
      let chunks = [];
      let recognition = null;
      let objectUrl = null;

      const revokeAudio = () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
        }
      };
      window.addEventListener("beforeunload", revokeAudio, { once: true });

      const getTranscriptEl = () => root.querySelector("#tlpSimTranscript");

      root.querySelectorAll("[data-sim-prompt]").forEach((tab) => {
        tab.addEventListener("click", () => {
          currentPrompt = SPEAKING_PROMPTS.find((p) => p.id === tab.dataset.simPrompt) || SPEAKING_PROMPTS[0];
          root.querySelectorAll("[data-sim-prompt]").forEach((t) =>
            t.setAttribute("aria-selected", t === tab ? "true" : "false"),
          );
          root.querySelector("#tlpSimTitle").textContent = currentPrompt.title;
          root.querySelector("#tlpSimPrompt").textContent = currentPrompt.prompt;
          root.querySelector("#tlpLifelineBox").hidden = true;
          root.querySelector("#tlpSimFeedback").hidden = true;
          getTranscriptEl().value = "";
          machine.reset({ promptId: currentPrompt.id, lifelines: [] });
        });
      });

      root.querySelectorAll("[data-lifeline]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const kind = btn.dataset.lifeline;
          const nextLifelines = [...new Set([...(machine.context.lifelines || []), kind])];
          machine.transition(STATES.ACTIVE, { lifelines: nextLifelines });
          const box = root.querySelector("#tlpLifelineBox");
          if (kind === "starter") {
            box.hidden = false;
            box.innerHTML = `<strong>Sentence Starter:</strong> ${currentPrompt.starter}`;
          } else if (kind === "wordbank") {
            box.hidden = false;
            box.innerHTML = `<strong>Word Bank:</strong> ${currentPrompt.wordBank.join(" · ")}`;
          } else if (kind === "replay") {
            if (typeof speechSynthesis !== "undefined") {
              speechSynthesis.cancel();
              const u = new SpeechSynthesisUtterance(currentPrompt.prompt);
              u.lang = "en-US";
              u.rate = 0.85;
              speechSynthesis.speak(u);
            }
          }
        });
      });

      root.querySelector("#tlpSimReadPromptBtn")?.addEventListener("click", () => {
        if (typeof speechSynthesis === "undefined") return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(currentPrompt.prompt);
        u.lang = "en-US";
        u.rate = 0.92;
        speechSynthesis.speak(u);
      });

      root.querySelector("#tlpSimL1Btn")?.addEventListener("click", () => {
        if (typeof speechSynthesis === "undefined") return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(L1_AUDIO_CUES[l1] || L1_AUDIO_CUES.en);
        u.lang = l1Meta.speechLang;
        u.rate = 0.92;
        speechSynthesis.speak(u);
      });

      root.querySelector("#tlpSimSampleBtn")?.addEventListener("click", () => {
        machine.transition(STATES.ACTIVE);
        getTranscriptEl().value = currentPrompt.modelSample;
        root.querySelector("#tlpRecStatus").textContent = "Sample response loaded—ready to evaluate.";
      });

      const recBtn = root.querySelector("#tlpRecBtn");
      const recStatus = root.querySelector("#tlpRecStatus");
      const recAudio = root.querySelector("#tlpRecAudio");

      recBtn?.addEventListener("click", async () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          if (recognition) try { recognition.stop(); } catch {}
          recBtn.textContent = "🎙️ Start Recording";
          recStatus.textContent = "Recording stopped (stored in browser memory only).";
          return;
        }
        try {
          if (!navigator.mediaDevices?.getUserMedia) throw new Error("No mic");
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          revokeAudio();
          chunks = [];
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
          mediaRecorder.onstop = () => {
            stream.getTracks().forEach((t) => t.stop());
            const blob = new Blob(chunks, { type: "audio/webm" });
            objectUrl = URL.createObjectURL(blob);
            recAudio.src = objectUrl;
            recAudio.hidden = false;
          };
          mediaRecorder.start();
          machine.transition(STATES.ACTIVE);
          recBtn.textContent = "⏹ Stop Recording";
          recStatus.textContent = "Listening… speak clearly.";

          const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (SpeechRec) {
            recognition = new SpeechRec();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";
            recognition.onresult = (event) => {
              let txt = "";
              for (let i = 0; i < event.results.length; i++) txt += event.results[i][0].transcript + " ";
              getTranscriptEl().value = txt.trim();
            };
            recognition.start();
          }
        } catch {
          recStatus.textContent = "Microphone unavailable — type or use 'Try Sample Response' below.";
        }
      });

      root.querySelector("#tlpSimEvalBtn")?.addEventListener("click", () => {
        const transcript = getTranscriptEl().value.trim();
        if (!transcript) {
          recStatus.textContent = "Enter or record a response first.";
          return;
        }
        machine.transition(STATES.EVALUATING);
        const result = evaluateSpeakingResponse(currentPrompt, transcript, machine.context.lifelines);
        machine.transition(STATES.FEEDBACK, { evaluation: result, transcript });

        const fb = root.querySelector("#tlpSimFeedback");
        fb.hidden = false;
        fb.innerHTML = `
          <div class="tlp-actions-row" style="justify-content:space-between;margin-bottom:0.75rem">
            <div>
              <span class="tlp-badge tlp-badge-level-${result.band} tlp-tabular">Practice Band ${result.band} / 6</span>
              <span class="tlp-badge tlp-badge-accent">${result.lifelineTier}</span>
            </div>
            <span class="tlp-muted tlp-tabular">${result.wordCount} words</span>
          </div>
          <p style="margin:0.35rem 0"><strong>What worked:</strong> ${result.praise}</p>
          <p class="tlp-muted" style="margin:0.35rem 0 0.85rem"><strong>Next step:</strong> ${result.nextStep}</p>
          <div class="tlp-grid-3" style="margin-bottom:1rem">
            <div class="tlp-pride-element" style="margin-top:0"><strong>Vocabulary</strong><p class="tlp-tabular" style="margin:0.2rem 0 0">${result.dimensions.vocabulary} / 6</p></div>
            <div class="tlp-pride-element" style="margin-top:0"><strong>Complexity</strong><p class="tlp-tabular" style="margin:0.2rem 0 0">${result.dimensions.complexity} / 6</p></div>
            <div class="tlp-pride-element" style="margin-top:0"><strong>Completeness</strong><p class="tlp-tabular" style="margin:0.2rem 0 0">${result.dimensions.completeness} / 6</p></div>
          </div>
          <div class="tlp-actions-row">
            <button type="button" class="tlp-btn tlp-btn-primary" id="tlpSavePrideClipBtn">Save as Pride Clip</button>
            <a class="tlp-btn tlp-btn-ghost" href="${BASE}/family-bridge">Open Family Bridge →</a>
            <span id="tlpClipStatus" class="tlp-muted" role="status"></span>
          </div>
        `;

        fb.querySelector("#tlpSavePrideClipBtn")?.addEventListener("click", () => {
          const currentClips = readStorage(STORAGE_KEYS.SPEAKING).clips || [];
          const access = checkFeatureAccess("save_clip", currentClips.length);
          if (!access.allowed) {
            fb.querySelector("#tlpClipStatus").textContent = access.reason;
            return;
          }
          machine.transition(STATES.COMPLETE);
          updateStorage(STORAGE_KEYS.SPEAKING, (prev) => ({
            ...prev,
            clips: [
              ...(prev.clips || []).slice(-19),
              {
                id: `clip-${Date.now().toString(36)}`,
                promptId: currentPrompt.id,
                alias: sanitizeAlias("Maya R."),
                band: result.band,
                lifelineTier: result.lifelineTier,
                transcript,
                createdAt: new Date().toISOString(),
              },
            ],
          }));
          fb.querySelector("#tlpClipStatus").textContent = "✓ Saved as Pride Clip for Family Bridge!";
        });
      });
    },
  };
}
