/**
 * Module 1: Content-to-Language Bridge (Teacher Prepare Pillar)
 * Integrates Module 2: Cognate Spotlight & L1 Transfer Diagnostics Drawer.
 * State Machine: IDLE -> ACTIVE -> EVALUATING -> FEEDBACK -> COMPLETE
 */

import { BASE, esc, html, raw } from "../../util.js";
import { BRIDGE_SAMPLES, getLanguageMeta } from "../data/platformData.js";
import { checkFeatureAccess } from "../entitlements/entitlementService.js";
import { analyzeL1Transfer, scanLessonText } from "../services/intelligenceAdapter.js";
import { STORAGE_KEYS, readStorage, updateStorage } from "../services/storageService.js";
import { createStateMachine, STATES } from "../state/stateMachine.js";
import { openDrawer, upgradeCardHTML } from "../components/ui.js";

function highlightPassageHTML(text, scan, layers, showCognates) {
  let out = esc(text);
  if (layers.polysemous) {
    for (const hit of scan.polysemousHits) {
      const re = new RegExp(`\\b(${hit.word})\\b`, "gi");
      out = out.replace(
        re,
        `<mark class="tlp-mark-poly" title="Academic: ${esc(hit.academic)} | Everyday: ${esc(hit.everyday)}">$1</mark>`,
      );
    }
  }
  if (layers.connectors) {
    for (const hit of scan.connectorHits) {
      const re = new RegExp(`\\b(${hit.word})\\b`, "gi");
      out = out.replace(
        re,
        `<mark class="tlp-mark-conn" title="Connector (${esc(hit.function)}): ${esc(hit.plain)}">$1</mark>`,
      );
    }
  }
  if (showCognates) {
    for (const cog of scan.cognateHits) {
      const re = new RegExp(`\\b(${cog.word})\\b`, "gi");
      out = out.replace(
        re,
        `<span class="tlp-mark-cog" title="${esc(getLanguageMeta(cog.l1).english)} cognate: ${esc(cog.l1Word)}">$1</span>`,
      );
    }
  }
  return raw(out);
}

export async function render(ctx) {
  const prefs = readStorage(STORAGE_KEYS.PREFS);
  const saved = readStorage(STORAGE_KEYS.BRIDGE);
  const l1 = prefs.l1 || "es";
  const showCognates = prefs.cognateSpotlight !== false;

  const machine = createStateMachine("ContentBridge", {
    sampleId: saved.lastSampleId || BRIDGE_SAMPLES[0].id,
    text: saved.customText || BRIDGE_SAMPLES[0].text,
    layers: saved.activeLayers || { polysemous: true, connectors: true, syntax: true },
    activeTab: "scaffolds",
  });

  const currentText = machine.context.text;
  const scan = scanLessonText(currentText, l1);
  machine.transition(STATES.FEEDBACK);

  const customAccess = checkFeatureAccess("custom_bridge");

  return {
    title: "Content-to-Language Bridge — The Language Page",
    body: html`
      <section class="tlp-page">
        <header class="tlp-hero">
          <div>
            <p class="tlp-eyebrow">Prepare · Module 1</p>
            <h1>Content-to-Language Bridge</h1>
            <p class="tlp-muted tlp-measure">
              Paste any lesson text or try a sample below to spot polysemous traps, Tier 2 connectors, complex syntax, and ${getLanguageMeta(l1).english} cognates in seconds.
            </p>
          </div>
          <div class="tlp-actions-row">
            <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpBridgeTransferBtn">
              L1 Transfer Diagnostics
            </button>
          </div>
        </header>

        <div class="tlp-card">
          <div class="tlp-actions-row" style="margin-bottom:0.85rem">
            <span class="tlp-muted" style="font-weight:600">1-Click Samples:</span>
            ${BRIDGE_SAMPLES.map(
              (s) => html`<button
                type="button"
                class="tlp-btn tlp-btn-ghost"
                style="min-height:34px;padding:0.35rem 0.85rem;font-size:0.82rem"
                data-bridge-sample="${s.id}"
              >
                Try ${s.grade} ${s.subject}
              </button>`,
            )}
          </div>

          <label class="tlp-field">
            <span>Lesson Text or Word Problem</span>
            <textarea id="tlpBridgeInput" rows="4">${currentText}</textarea>
          </label>

          ${!customAccess.allowed ? upgradeCardHTML(customAccess.reason) : ""}

          <div class="tlp-actions-row" style="justify-content:space-between">
            <div class="tlp-actions-row">
              <label style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.86rem;font-weight:600">
                <input type="checkbox" data-layer="polysemous" ${machine.context.layers.polysemous ? "checked" : ""} />
                Multiple-Meaning Words (${scan.polysemousHits.length})
              </label>
              <label style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.86rem;font-weight:600">
                <input type="checkbox" data-layer="connectors" ${machine.context.layers.connectors ? "checked" : ""} />
                Tier 2 Connectors (${scan.connectorHits.length})
              </label>
              <label style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.86rem;font-weight:600">
                <input type="checkbox" data-layer="syntax" ${machine.context.layers.syntax ? "checked" : ""} />
                Complex Syntax (${scan.syntaxHits.length})
              </label>
            </div>
            <button type="button" class="tlp-btn tlp-btn-primary" id="tlpBridgeScanBtn">
              Scan Lesson Text
            </button>
          </div>
        </div>

        <div class="tlp-card">
          <p class="tlp-eyebrow">Linguistic Trap Scanner</p>
          <div class="tlp-passage" id="tlpBridgePassage" aria-live="polite">
            ${highlightPassageHTML(currentText, scan, machine.context.layers, showCognates)}
          </div>

          ${machine.context.layers.polysemous && scan.polysemousHits.length
            ? html`<div class="tlp-grid-2" style="margin-top:1rem">
                ${scan.polysemousHits.map(
                  (h) => html`<div class="tlp-pride-element" style="margin-top:0">
                    <strong>"${h.word}" · Multiple-Meaning Trap</strong>
                    <p class="tlp-muted" style="margin:0.25rem 0 0"><strong>Academic:</strong> ${h.academic}</p>
                    <p class="tlp-muted" style="margin:0.2rem 0 0"><strong>Everyday:</strong> ${h.everyday}</p>
                  </div>`,
                )}
              </div>`
            : ""}

          ${machine.context.layers.syntax && scan.syntaxHits.length
            ? html`<div style="margin-top:1rem">
                ${scan.syntaxHits.map(
                  (s) => html`<div class="tlp-pride-element">
                    <strong>Syntax Flag (${s.reason})</strong>
                    <p class="tlp-muted" style="margin:0.25rem 0 0"><strong>Plain Rewrite:</strong> ${s.rewrite}</p>
                  </div>`,
                )}
              </div>`
            : ""}
        </div>

        <div class="tlp-card">
          <div class="tlp-tabs" role="tablist" aria-label="Bridge Output">
            <button type="button" class="tlp-tab" role="tab" data-bridge-tab="scaffolds" aria-selected="true">
              Tiered Scaffolds (WIDA 1–6)
            </button>
            <button type="button" class="tlp-tab" role="tab" data-bridge-tab="microlab" aria-selected="false">
              5-Minute Pre-Teach Micro-Lab
            </button>
          </div>

          <div id="tlpTabScaffolds">
            <div class="tlp-grid-3">
              ${[scan.scaffolds.level12, scan.scaffolds.level34, scan.scaffolds.level56].map(
                (tier) => html`<div class="tlp-pride-element" style="margin-top:0">
                  <strong>${tier.label}</strong>
                  <ul style="padding-left:1.1rem;margin:0.5rem 0">
                    ${tier.frames.map((f) => html`<li>${f}</li>`)}
                  </ul>
                  <p class="tlp-muted" style="font-size:0.82rem;margin:0">
                    <strong>Word Bank:</strong> ${tier.wordBank.join(" · ")}
                  </p>
                </div>`,
              )}
            </div>
          </div>

          <div id="tlpTabMicrolab" hidden>
            <div class="tlp-grid-2">
              <div class="tlp-pride-element" style="margin-top:0">
                <strong>Pronunciation Warm-Up (Tap to Hear)</strong>
                <div class="tlp-actions-row" style="margin-top:0.6rem">
                  ${scan.microLab.pronunciationWords.map(
                    (w) => html`<button type="button" class="tlp-btn tlp-btn-ghost" data-speak-word="${w}">
                      🔊 ${w}
                    </button>`,
                  )}
                </div>
                <p class="tlp-muted" style="margin:0.75rem 0 0">${scan.microLab.cognateCue}</p>
              </div>
              <div class="tlp-pride-element" style="margin-top:0">
                <strong>Quick Check</strong>
                <p style="margin:0.4rem 0">${scan.microLab.quickCheck.question}</p>
                <div class="tlp-actions-row" id="tlpMicroCheckOptions">
                  ${scan.microLab.quickCheck.options.map(
                    (opt, idx) => html`<button
                      type="button"
                      class="tlp-btn tlp-btn-ghost"
                      data-check-idx="${idx}"
                      data-correct="${idx === scan.microLab.quickCheck.answerIndex ? "1" : "0"}"
                    >
                      ${opt}
                    </button>`,
                  )}
                </div>
                <p id="tlpMicroCheckStatus" class="tlp-muted" role="status" style="margin:0.5rem 0 0"></p>
              </div>
            </div>
          </div>
        </div>

        <p style="margin-top:1.25rem">
          <a class="tlp-btn tlp-btn-ghost" href="${BASE}/">← Back to Language Hub</a>
        </p>
      </section>
    `,
    mount(root) {
      const input = root.querySelector("#tlpBridgeInput");
      root.querySelectorAll("[data-bridge-sample]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const sample = BRIDGE_SAMPLES.find((s) => s.id === btn.dataset.bridgeSample);
          if (!sample) return;
          updateStorage(STORAGE_KEYS.BRIDGE, { lastSampleId: sample.id, customText: sample.text });
          ctx.rerender();
        });
      });

      root.querySelector("#tlpBridgeScanBtn")?.addEventListener("click", () => {
        const text = input.value.trim();
        if (!text) return;
        if (!customAccess.allowed && !BRIDGE_SAMPLES.some((s) => s.text === text)) {
          return;
        }
        updateStorage(STORAGE_KEYS.BRIDGE, { customText: text });
        ctx.rerender();
      });

      root.querySelectorAll("[data-layer]").forEach((cb) => {
        cb.addEventListener("change", () => {
          const layers = { ...readStorage(STORAGE_KEYS.BRIDGE).activeLayers, [cb.dataset.layer]: cb.checked };
          updateStorage(STORAGE_KEYS.BRIDGE, { activeLayers: layers });
          ctx.rerender();
        });
      });

      root.querySelectorAll("[data-bridge-tab]").forEach((tab) => {
        tab.addEventListener("click", () => {
          const id = tab.dataset.bridgeTab;
          root.querySelectorAll("[data-bridge-tab]").forEach((t) =>
            t.setAttribute("aria-selected", t === tab ? "true" : "false"),
          );
          root.querySelector("#tlpTabScaffolds").hidden = id !== "scaffolds";
          root.querySelector("#tlpTabMicrolab").hidden = id !== "microlab";
        });
      });

      root.querySelectorAll("[data-speak-word]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (typeof speechSynthesis === "undefined") return;
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(btn.dataset.speakWord);
          u.lang = "en-US";
          u.rate = 0.88;
          speechSynthesis.speak(u);
        });
      });

      root.querySelectorAll("[data-check-idx]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const status = root.querySelector("#tlpMicroCheckStatus");
          status.textContent =
            btn.dataset.correct === "1"
              ? "✓ Spot on! That's the exact academic signal."
              : "Not quite—check how the word connects the two clauses.";
        });
      });

      root.querySelector("#tlpBridgeTransferBtn")?.addEventListener("click", () => {
        const findings = analyzeL1Transfer(input.value, l1);
        openDrawer({
          title: `L1 Transfer Diagnostics (${getLanguageMeta(l1).english})`,
          subtitle: "Asset-based coaching tips for cross-linguistic transfer.",
          bodyHtml: findings
            .map(
              (f) => `<div class="tlp-pride-element">
                <strong>${esc(f.pattern)}</strong>
                <p class="tlp-muted" style="margin:0.35rem 0 0">${esc(f.observation)}</p>
                <p style="margin:0.45rem 0 0"><strong>Coaching Tip:</strong> ${esc(f.coachingTip)}</p>
              </div>`,
            )
            .join(""),
        });
      });
    },
  };
}
