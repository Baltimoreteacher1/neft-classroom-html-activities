/**
 * Module 3: Sentence Architect Studio (Interactive Student & Live Teaching Lab)
 * Safe Drag-and-Drop (Mouse + Touch), Snap-to-Target, Persistent Reset,
 * AND full Click-to-Place / Keyboard-Accessible Fallback + Deconstruction Mode.
 * State Machine: IDLE -> ACTIVE -> EVALUATING -> FEEDBACK -> COMPLETE
 */

import { BASE, html } from "../../util.js";
import { ARCHITECT_KERNELS, L1_AUDIO_CUES, getLanguageMeta } from "../data/platformData.js";
import { evaluateSentenceArchitecture } from "../services/intelligenceAdapter.js";
import { STORAGE_KEYS, readStorage, updateStorage } from "../services/storageService.js";
import { createStateMachine, STATES } from "../state/stateMachine.js";

const SLOTS = [
  { key: "connector", label: "1. Connector" },
  { key: "verb", label: "2. Academic Verb" },
  { key: "prep", label: "3. Context Phrase" },
  { key: "evidence", label: "4. Evidence Clause" },
];

export async function render(ctx) {
  const prefs = readStorage(STORAGE_KEYS.PREFS);
  const saved = readStorage(STORAGE_KEYS.ARCHITECT);
  const l1 = prefs.l1 || "es";
  const l1Meta = getLanguageMeta(l1);

  const kernelItem = ARCHITECT_KERNELS.find((k) => k.id === saved.lastKernelId) || ARCHITECT_KERNELS[0];
  const machine = createStateMachine("SentenceArchitect", {
    kernelId: kernelItem.id,
    placed: {},
    deconstruct: false,
    selectedBlockId: null,
  });

  const renderInner = (root) => {
    const k = ARCHITECT_KERNELS.find((x) => x.id === machine.context.kernelId) || ARCHITECT_KERNELS[0];
    const evalResult = evaluateSentenceArchitecture(k, machine.context.placed);
    const pct = (evalResult.level / 5) * 100;
    const usedIds = new Set(Object.values(machine.context.placed).filter(Boolean).map((b) => b.id));

    root.querySelector("#tlpArchStage").textContent = evalResult.sentence;
    root.querySelector("#tlpArchStage").classList.toggle("is-leveled", evalResult.level > 1);
    root.querySelector("#tlpArchLevelBadge").textContent = `Complexity Level ${evalResult.level} / 5`;
    root.querySelector("#tlpArchLevelBadge").className = `tlp-badge tlp-badge-level-${evalResult.level} tlp-tabular`;
    root.querySelector("#tlpArchExplain").textContent = evalResult.explanation;
    root.querySelector("#tlpArchMeterFill").style.width = `${pct}%`;

    const deconstructBox = root.querySelector("#tlpDeconstructBox");
    deconstructBox.hidden = !machine.context.deconstruct;
    if (machine.context.deconstruct) {
      root.querySelector("#tlpDecWho").textContent = evalResult.clauses.whoWhat;
      root.querySelector("#tlpDecAct").textContent = evalResult.clauses.action;
      root.querySelector("#tlpDecWhy").textContent = evalResult.clauses.whyHow;
    }

    SLOTS.forEach((slot) => {
      const el = root.querySelector(`[data-slot-key="${slot.key}"]`);
      const block = machine.context.placed[slot.key];
      el.classList.toggle("is-filled", Boolean(block));
      el.querySelector("[data-slot-val]").textContent = block ? block.text : "Drop or tap a block";
      el.querySelector("[data-slot-clear]").hidden = !block;
    });

    root.querySelectorAll("[data-block-id]").forEach((btn) => {
      const id = btn.dataset.blockId;
      btn.classList.toggle("is-used", usedIds.has(id));
      btn.setAttribute("aria-pressed", machine.context.selectedBlockId === id ? "true" : "false");
    });
  };

  return {
    title: "Sentence Architect Studio — The Language Page",
    html: html`
      <section class="tlp-page">
        <header class="tlp-hero">
          <div>
            <p class="tlp-eyebrow">Practice · Module 3</p>
            <h1>Sentence Architect Studio</h1>
            <p class="tlp-muted tlp-measure">
              Expand a Level 1 kernel sentence by snapping connectors, academic verbs, context phrases, and evidence clauses. Drag-and-drop, tap, or use keyboard navigation.
            </p>
          </div>
          <div class="tlp-actions-row">
            <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpArchDeconstructBtn" aria-pressed="false">
              Deconstruction Mode
            </button>
            <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpArchResetBtn">
              Reset
            </button>
          </div>
        </header>

        <div class="tlp-card">
          <div class="tlp-actions-row" style="justify-content:space-between;margin-bottom:1rem">
            <div class="tlp-actions-row" role="group" aria-label="Choose Key Language Use">
              ${ARCHITECT_KERNELS.map(
                (k) => html`<button
                  type="button"
                  class="tlp-tab"
                  data-kernel-id="${k.id}"
                  aria-selected="${k.id === kernelItem.id ? "true" : "false"}"
                >
                  ${k.klu} · ${k.subject}
                </button>`,
              )}
            </div>
            ${l1 !== "en"
              ? html`<button type="button" class="tlp-btn tlp-btn-ghost" id="tlpArchL1CueBtn">
                  🔊 ${l1Meta.english} Cue
                </button>`
              : ""}
          </div>

          <div class="tlp-actions-row" style="justify-content:space-between;align-items:center">
            <span class="tlp-badge tlp-badge-level-1 tlp-tabular" id="tlpArchLevelBadge">Complexity Level 1 / 5</span>
            <span class="tlp-muted" id="tlpArchExplain" aria-live="polite">
              Level 1 kernel — snap linguistic blocks below to expand academic precision.
            </span>
          </div>
          <div class="tlp-meter-track" aria-hidden="true">
            <div class="tlp-meter-fill" id="tlpArchMeterFill" style="width:20%"></div>
          </div>

          <div class="tlp-sentence-stage" id="tlpArchStage" aria-live="polite">
            ${kernelItem.kernel}
          </div>

          <div id="tlpDeconstructBox" class="tlp-grid-3" hidden style="margin-bottom:1rem">
            <div class="tlp-pride-element" style="margin-top:0">
              <span class="tlp-eyebrow">Who / What</span>
              <p id="tlpDecWho" style="margin:0;font-weight:600">${kernelItem.whoWhat}</p>
            </div>
            <div class="tlp-pride-element" style="margin-top:0">
              <span class="tlp-eyebrow">Action</span>
              <p id="tlpDecAct" style="margin:0;font-weight:600">${kernelItem.action}</p>
            </div>
            <div class="tlp-pride-element" style="margin-top:0">
              <span class="tlp-eyebrow">Why / How</span>
              <p id="tlpDecWhy" style="margin:0;font-weight:600">${kernelItem.whyHow}</p>
            </div>
          </div>

          <div class="tlp-slots-grid" aria-label="Sentence expansion slots">
            ${SLOTS.map(
              (s) => html`
                <div class="tlp-slot" data-slot-key="${s.key}" tabindex="0" role="button" aria-label="Slot ${s.label}">
                  <div class="tlp-actions-row" style="justify-content:space-between">
                    <span class="tlp-eyebrow" style="margin:0">${s.label}</span>
                    <button type="button" class="tlp-icon-btn" style="min-height:24px;padding:0 0.45rem;font-size:0.75rem" data-slot-clear="${s.key}" hidden aria-label="Remove ${s.label}">✕</button>
                  </div>
                  <span data-slot-val class="tlp-muted" style="font-size:0.86rem">Drop or tap a block</span>
                </div>
              `,
            )}
          </div>

          <div>
            <p class="tlp-eyebrow">Linguistic Expansion Blocks (Drag or Tap to Place)</p>
            <div class="tlp-block-tray" id="tlpBlockTray">
              ${kernelItem.blocks.map(
                (b) => html`
                  <button
                    type="button"
                    class="tlp-block"
                    draggable="true"
                    data-block-id="${b.id}"
                    data-block-slot="${b.slot}"
                    aria-pressed="false"
                  >
                    <small class="tlp-eyebrow" style="display:block;margin:0 0 0.15rem">${b.category}</small>
                    ${b.text}
                  </button>
                `,
              )}
            </div>
          </div>

          <div class="tlp-actions-row" style="margin-top:1.25rem;justify-content:space-between">
            <div class="tlp-actions-row">
              <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpArchSpeakBtn">
                🔊 Hear Sentence
              </button>
              <button type="button" class="tlp-btn tlp-btn-primary" id="tlpArchSaveBtn">
                Save Built Sentence
              </button>
            </div>
            <span id="tlpArchSaveStatus" class="tlp-muted" role="status"></span>
          </div>
        </div>

        <p style="margin-top:1.25rem">
          <a class="tlp-btn tlp-btn-ghost" href="${BASE}/">← Back to Language Hub</a>
        </p>
      </section>
    `,
    mount(root) {
      const getCurrentKernel = () =>
        ARCHITECT_KERNELS.find((x) => x.id === machine.context.kernelId) || ARCHITECT_KERNELS[0];

      const placeBlock = (blockId, targetSlot) => {
        const k = getCurrentKernel();
        const block = k.blocks.find((b) => b.id === blockId);
        if (!block) return false;
        if (targetSlot && targetSlot !== block.slot) return false; // return-to-origin on invalid drop
        machine.transition(STATES.ACTIVE, {
          placed: { ...machine.context.placed, [block.slot]: block },
          selectedBlockId: null,
        });
        machine.transition(STATES.FEEDBACK);
        renderInner(root);
        return true;
      };

      // Kernel switcher
      root.querySelectorAll("[data-kernel-id]").forEach((tab) => {
        tab.addEventListener("click", () => {
          updateStorage(STORAGE_KEYS.ARCHITECT, { lastKernelId: tab.dataset.kernelId });
          ctx.rerender();
        });
      });

      // Click-to-place & keyboard accessible fallback
      root.querySelectorAll("[data-block-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
          placeBlock(btn.dataset.blockId, btn.dataset.blockSlot);
        });
        btn.addEventListener("dragstart", (e) => {
          e.dataTransfer?.setData("text/plain", btn.dataset.blockId);
        });
      });

      root.querySelectorAll("[data-slot-key]").forEach((slotEl) => {
        const key = slotEl.dataset.slotKey;
        slotEl.addEventListener("dragover", (e) => {
          e.preventDefault();
          slotEl.classList.add("is-over");
        });
        slotEl.addEventListener("dragleave", () => slotEl.classList.remove("is-over"));
        slotEl.addEventListener("drop", (e) => {
          e.preventDefault();
          slotEl.classList.remove("is-over");
          const blockId = e.dataTransfer?.getData("text/plain");
          if (blockId) placeBlock(blockId, key);
        });
        slotEl.addEventListener("keydown", (e) => {
          if ((e.key === "Enter" || e.key === " ") && machine.context.selectedBlockId) {
            e.preventDefault();
            placeBlock(machine.context.selectedBlockId, key);
          }
        });
      });

      root.querySelectorAll("[data-slot-clear]").forEach((clr) => {
        clr.addEventListener("click", (e) => {
          e.stopPropagation();
          const next = { ...machine.context.placed };
          delete next[clr.dataset.slotClear];
          machine.transition(STATES.ACTIVE, { placed: next });
          renderInner(root);
        });
      });

      root.querySelector("#tlpArchDeconstructBtn")?.addEventListener("click", (e) => {
        const next = !machine.context.deconstruct;
        machine.transition(STATES.ACTIVE, { deconstruct: next });
        e.currentTarget.setAttribute("aria-pressed", String(next));
        renderInner(root);
      });

      root.querySelector("#tlpArchResetBtn")?.addEventListener("click", () => {
        machine.reset({ kernelId: machine.context.kernelId, placed: {}, deconstruct: false, selectedBlockId: null });
        renderInner(root);
      });

      root.querySelector("#tlpArchL1CueBtn")?.addEventListener("click", () => {
        if (typeof speechSynthesis === "undefined") return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(L1_AUDIO_CUES[l1] || L1_AUDIO_CUES.en);
        u.lang = l1Meta.speechLang;
        u.rate = 0.92;
        speechSynthesis.speak(u);
      });

      root.querySelector("#tlpArchSpeakBtn")?.addEventListener("click", () => {
        if (typeof speechSynthesis === "undefined") return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(root.querySelector("#tlpArchStage")?.textContent || "");
        u.lang = "en-US";
        u.rate = 0.88;
        speechSynthesis.speak(u);
      });

      root.querySelector("#tlpArchSaveBtn")?.addEventListener("click", () => {
        const k = getCurrentKernel();
        const res = evaluateSentenceArchitecture(k, machine.context.placed);
        machine.transition(STATES.COMPLETE);
        updateStorage(STORAGE_KEYS.ARCHITECT, (prev) => ({
          ...prev,
          completedIds: [...new Set([...(prev.completedIds || []), k.id])],
          savedSentences: [...(prev.savedSentences || []).slice(-19), { id: k.id, sentence: res.sentence, level: res.level }],
        }));
        root.querySelector("#tlpArchSaveStatus").textContent = `✓ Saved Level ${res.level} sentence on this device.`;
      });
    },
  };
}
