/**
 * Module 1: Content-to-Language Bridge (Teacher Prepare Pillar)
 * Publisher-grade: Grade-band filter (K-2, 3-5, 6-8), clickable inline Word Inspector,
 * L1 Cognate Spotlight, L1 Transfer Diagnostics Drawer, and 3 Output Tabs (including Print Handout).
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
        `<button type="button" class="tlp-mark-btn tlp-mark-poly" data-inspect-kind="poly" data-inspect-word="${esc(hit.word)}" title="Inspect multiple-meaning word">$1</button>`,
      );
    }
  }
  if (layers.connectors) {
    for (const hit of scan.connectorHits) {
      const re = new RegExp(`\\b(${hit.word})\\b`, "gi");
      out = out.replace(
        re,
        `<button type="button" class="tlp-mark-btn tlp-mark-conn" data-inspect-kind="conn" data-inspect-word="${esc(hit.word)}" title="Inspect Tier 2 connector">$1</button>`,
      );
    }
  }
  if (showCognates) {
    for (const cog of scan.cognateHits) {
      const re = new RegExp(`\\b(${cog.word})\\b`, "gi");
      out = out.replace(
        re,
        `<button type="button" class="tlp-mark-btn tlp-mark-cog" data-inspect-kind="cog" data-inspect-word="${esc(cog.word)}" title="${esc(getLanguageMeta(cog.l1).english)} cognate: ${esc(cog.l1Word)}">$1</button>`,
      );
    }
  }
  return raw(out);
}

export async function render(ctx) {
  const prefs = readStorage(STORAGE_KEYS.PREFS);
  const saved = readStorage(STORAGE_KEYS.BRIDGE);
  const l1 = prefs.l1 || "es";
  const l1Meta = getLanguageMeta(l1);
  const showCognates = prefs.cognateSpotlight !== false;
  const bandFilter = saved.bandFilter || "All";

  const filteredSamples =
    bandFilter === "All" ? BRIDGE_SAMPLES : BRIDGE_SAMPLES.filter((s) => s.band === bandFilter);

  const machine = createStateMachine("ContentBridge", {
    sampleId: saved.lastSampleId || BRIDGE_SAMPLES[0].id,
    text: saved.customText || BRIDGE_SAMPLES[0].text,
    layers: saved.activeLayers || { polysemous: true, connectors: true, syntax: true },
  });

  const currentText = machine.context.text;
  const scan = scanLessonText(currentText, l1);
  machine.transition(STATES.FEEDBACK);
  const customAccess = checkFeatureAccess("custom_bridge");

  return {
    title: "Content-to-Language Bridge — ELL Lab",
    html: html`
      <section class="tlp-page">
        <header class="tlp-hero">
          <div>
            <p class="tlp-eyebrow">Prepare · Module 1 · K–8 Curriculum Bridge</p>
            <h1>Content-to-Language Bridge</h1>
            <p class="tlp-muted tlp-measure">
              Turn any K–8 math, science, or social studies passage into an accessible, scaffolded lesson. Click any highlighted word below to inspect its everyday vs. academic meaning and ${l1Meta.english} cognate.
            </p>
          </div>
          <div class="tlp-actions-row no-print">
            <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpBridgeTransferBtn">
              L1 Transfer Diagnostics
            </button>
            <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpBridgePrintBtn">
              Print Handout
            </button>
          </div>
        </header>

        <div class="tlp-card no-print">
          <div class="tlp-actions-row" style="justify-content:space-between;margin-bottom:0.85rem">
            <div class="tlp-actions-row" role="group" aria-label="Filter samples by grade band">
              ${["All", "K-2", "3-5", "6-8"].map(
                (b) => html`<button
                  type="button"
                  class="tlp-tab"
                  data-bridge-band="${b}"
                  aria-selected="${b === bandFilter ? "true" : "false"}"
                >
                  ${b === "All" ? "All Grades (K–8)" : `Grades ${b}`}
                </button>`,
              )}
            </div>
            <span class="tlp-muted" style="font-size:0.82rem">${filteredSamples.length} ready-to-teach texts</span>
          </div>

          <div class="tlp-actions-row" style="margin-bottom:0.9rem">
            ${filteredSamples.map(
              (s) => html`<button
                type="button"
                class="tlp-btn ${s.text === currentText ? "tlp-btn-primary" : "tlp-btn-ghost"}"
                style="min-height:34px;padding:0.35rem 0.85rem;font-size:0.82rem"
                data-bridge-sample="${s.id}"
              >
                ${s.grade} · ${s.subject}: ${s.title}
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
                Multiple-Meaning (${scan.polysemousHits.length})
              </label>
              <label style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.86rem;font-weight:600">
                <input type="checkbox" data-layer="connectors" ${machine.context.layers.connectors ? "checked" : ""} />
                Tier 2 Connectors (${scan.connectorHits.length})
              </label>
              <label style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.86rem;font-weight:600">
                <input type="checkbox" data-layer="syntax" ${machine.context.layers.syntax ? "checked" : ""} />
                Syntax Flags (${scan.syntaxHits.length})
              </label>
            </div>
            <button type="button" class="tlp-btn tlp-btn-primary" id="tlpBridgeScanBtn">
              Scan Lesson Text
            </button>
          </div>
        </div>

        <div class="tlp-card">
          <div class="tlp-actions-row" style="justify-content:space-between;margin-bottom:0.6rem">
            <p class="tlp-eyebrow" style="margin:0">Interactive Linguistic Trap Scanner (Tap Any Highlighted Word)</p>
            <div class="tlp-actions-row" style="font-size:0.78rem">
              <span class="tlp-mark-poly">Multiple-Meaning</span>
              <span class="tlp-mark-conn">Tier 2 Connector</span>
              <span class="tlp-mark-cog">${l1Meta.english} Cognate</span>
            </div>
          </div>

          <div class="tlp-passage" id="tlpBridgePassage" aria-live="polite">
            ${highlightPassageHTML(currentText, scan, machine.context.layers, showCognates)}
          </div>

          <div id="tlpWordInspector" class="tlp-inspector" hidden aria-live="polite"></div>

          ${machine.context.layers.syntax && scan.syntaxHits.length
            ? html`<div style="margin-top:1rem">
                ${scan.syntaxHits.map(
                  (s) => html`<div class="tlp-pride-element">
                    <strong>Syntax Flag (${s.reason})</strong>
                    <p class="tlp-muted" style="margin:0.25rem 0 0"><strong>Plain-Language Rewrite:</strong> ${s.rewrite}</p>
                  </div>`,
                )}
              </div>`
            : ""}
        </div>

        <div class="tlp-card">
          <div class="tlp-tabs no-print" role="tablist" aria-label="Bridge Output">
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
                <strong>Step 1 · Hear & Say (Tap to Pronounce)</strong>
                <div class="tlp-actions-row" style="margin-top:0.6rem">
                  ${scan.microLab.pronunciationWords.map(
                    (w) => html`<button type="button" class="tlp-btn tlp-btn-ghost" data-speak-word="${w}">
                      🔊 ${w}
                    </button>`,
                  )}
                </div>
                <p class="tlp-muted" style="margin:0.75rem 0 0"><strong>Step 2 · Cognate Cue:</strong> ${scan.microLab.cognateCue}</p>
              </div>
              <div class="tlp-pride-element" style="margin-top:0">
                <strong>Step 3 · Quick Check</strong>
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

        <p class="no-print" style="margin-top:1.25rem">
          <a class="tlp-btn tlp-btn-ghost" href="${BASE}/">← Back to ELL Lab Hub</a>
        </p>
      </section>
    `,
    mount(root) {
      const input = root.querySelector("#tlpBridgeInput");
      const inspector = root.querySelector("#tlpWordInspector");

      root.querySelectorAll("[data-bridge-band]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const band = btn.dataset.bridgeBand;
          const firstMatch = band === "All" ? BRIDGE_SAMPLES[0] : BRIDGE_SAMPLES.find((s) => s.band === band);
          updateStorage(STORAGE_KEYS.BRIDGE, {
            bandFilter: band,
            ...(firstMatch ? { lastSampleId: firstMatch.id, customText: firstMatch.text } : {}),
          });
          ctx.rerender();
        });
      });

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
        if (!customAccess.allowed && !BRIDGE_SAMPLES.some((s) => s.text === text)) return;
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

      root.querySelectorAll("[data-inspect-word]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const word = btn.dataset.inspectWord.toLowerCase();
          const kind = btn.dataset.inspectKind;
          const poly = scan.polysemousHits.find((h) => h.word.toLowerCase() === word);
          const conn = scan.connectorHits.find((h) => h.word.toLowerCase() === word);
          const cog = scan.cognateHits.find((h) => h.word.toLowerCase() === word);

          let details = "";
          if (poly) {
            details += `<p style="margin:0.35rem 0 0"><strong>Classroom Meaning:</strong> ${esc(poly.academic)}</p>
                        <p class="tlp-muted" style="margin:0.2rem 0 0"><strong>Everyday Meaning:</strong> ${esc(poly.everyday)}</p>
                        <p class="tlp-muted" style="margin:0.2rem 0 0"><strong>Teaching Move:</strong> ${esc(poly.tip)}</p>`;
          } else if (conn) {
            details += `<p style="margin:0.35rem 0 0"><strong>Discourse Function:</strong> ${esc(conn.function)}</p>
                        <p class="tlp-muted" style="margin:0.2rem 0 0"><strong>Plain-Language Meaning:</strong> ${esc(conn.plain)}</p>`;
          }
          if (cog) {
            details += `<p style="margin:0.35rem 0 0"><strong>${esc(l1Meta.english)} Cognate:</strong> ${esc(cog.l1Word)}</p>`;
          }

          inspector.hidden = false;
          inspector.innerHTML = `
            <div class="tlp-actions-row" style="justify-content:space-between">
              <strong style="font-size:1.05rem">"${esc(btn.textContent)}" <span class="tlp-badge tlp-badge-accent">${kind === "poly" ? "Multiple-Meaning" : kind === "conn" ? "Tier 2 Connector" : "Cognate"}</span></strong>
              <button type="button" class="tlp-btn tlp-btn-ghost" style="min-height:32px;padding:0.25rem 0.75rem;font-size:0.8rem" id="tlpInspectSpeak">🔊 Hear Word</button>
            </div>
            ${details}
          `;
          inspector.querySelector("#tlpInspectSpeak")?.addEventListener("click", () => {
            if (typeof speechSynthesis === "undefined") return;
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(btn.textContent);
            u.lang = "en-US";
            u.rate = 0.88;
            speechSynthesis.speak(u);
          });
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
              : "Not quite—check how the word connects the two ideas.";
        });
      });

      root.querySelector("#tlpBridgePrintBtn")?.addEventListener("click", () => window.print());

      root.querySelector("#tlpBridgeTransferBtn")?.addEventListener("click", () => {
        const findings = analyzeL1Transfer(input.value, l1);
        openDrawer({
          title: `L1 Transfer Diagnostics (${l1Meta.english})`,
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
