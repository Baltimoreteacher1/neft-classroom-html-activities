/**
 * Module 6: Zero-Login Bilingual Family Bridge
 * Generates a self-contained, mobile-first Family Pride Card with QR code,
 * copyable non-PII URL, and RTL Arabic support. Strictly 3 calm elements.
 */

import { BASE, copyText, html } from "../../util.js";
import {
  FAMILY_CARD_LABELS,
  FAMILY_DINNER_PROMPTS,
  HOME_LANGUAGES,
  getLanguageMeta,
} from "../data/platformData.js";
import { STORAGE_KEYS, readStorage, sanitizeAlias } from "../services/storageService.js";
import { qrSvg } from "../components/ui.js";

function encodeCardParams({ a, l, g, d }) {
  const q = new URLSearchParams({ a, l, g, d });
  return `${location.origin}${BASE}/family-bridge?${q.toString()}`;
}

export async function render(ctx) {
  const prefs = readStorage(STORAGE_KEYS.PREFS);
  const speakingStore = readStorage(STORAGE_KEYS.SPEAKING);
  const latestClip = speakingStore.clips?.[speakingStore.clips.length - 1] || null;

  const urlParams = new URLSearchParams(location.search);
  const alias = sanitizeAlias(urlParams.get("a") || latestClip?.alias || "Maya R.");
  const langCode = HOME_LANGUAGES.some((x) => x.code === urlParams.get("l")) ? urlParams.get("l") : prefs.l1 || "es";
  const dinnerId = urlParams.get("d") || FAMILY_DINNER_PROMPTS[0].id;

  const langMeta = getLanguageMeta(langCode);
  const labels = FAMILY_CARD_LABELS[langCode] || FAMILY_CARD_LABELS.en;
  const dinnerItem = FAMILY_DINNER_PROMPTS.find((p) => p.id === dinnerId) || FAMILY_DINNER_PROMPTS[0];
  const prideSentence =
    latestClip?.transcript ||
    "When leaves fall to the forest floor, decomposers break them down into nutrients. Consequently, the soil becomes richer.";

  const shareUrl = encodeCardParams({
    a: alias,
    l: langCode,
    g: dinnerItem.growthKey,
    d: dinnerItem.id,
  });

  return {
    title: "Bilingual Family Bridge — The Language Page",
    html: html`
      <section class="tlp-page">
        <header class="tlp-hero no-print">
          <div>
            <p class="tlp-eyebrow">Evidence & Family · Module 6</p>
            <h1>Zero-Login Bilingual Family Bridge</h1>
            <p class="tlp-muted tlp-measure">
              Share a calm, mobile-first Family Pride Card in your family's home language—zero login required and zero student PII in the link.
            </p>
          </div>
          <div class="tlp-actions-row">
            <select id="tlpFamilyLangSelect" class="tlp-select-compact" aria-label="Family card language">
              ${HOME_LANGUAGES.map(
                (l) => html`<option value="${l.code}" ${l.code === langCode ? "selected" : ""}>${l.label} (${l.english})</option>`,
              )}
            </select>
            <select id="tlpFamilyPromptSelect" class="tlp-select-compact" aria-label="Dinner prompt topic">
              ${FAMILY_DINNER_PROMPTS.map(
                (p) => html`<option value="${p.id}" ${p.id === dinnerItem.id ? "selected" : ""}>${p.topic}</option>`,
              )}
            </select>
          </div>
        </header>

        <article class="tlp-pride-card" dir="${langMeta.dir}" lang="${langCode}">
          <div class="tlp-actions-row" style="justify-content:space-between">
            <div>
              <p class="tlp-eyebrow" style="margin:0">${labels.title}</p>
              <h2 style="margin:0.2rem 0 0;font-family:var(--tlp-font-serif);font-size:1.55rem">${alias}</h2>
            </div>
            <span class="tlp-badge tlp-badge-accent">${langMeta.label}</span>
          </div>

          <!-- Element 1: This Week's Growth -->
          <div class="tlp-pride-element">
            <strong>1. ${labels.week}</strong>
            <p style="margin:0.35rem 0 0">
              ${alias} ${dinnerItem.growthKey}. This shows steady confidence in academic classroom language!
            </p>
          </div>

          <!-- Element 2: Pride Moment -->
          <div class="tlp-pride-element">
            <strong>2. ${labels.pride}</strong>
            <p style="margin:0.35rem 0 0;font-style:italic" dir="ltr" lang="en">“${prideSentence}”</p>
            <button type="button" class="tlp-btn tlp-btn-ghost no-print" id="tlpPrideSpeakBtn" style="margin-top:0.6rem;min-height:34px;padding:0.3rem 0.85rem;font-size:0.82rem">
              🔊 Listen
            </button>
          </div>

          <!-- Element 3: 2-Minute Dinner Table Prompt -->
          <div class="tlp-pride-element">
            <strong>3. ${labels.dinner}</strong>
            <p style="margin:0.35rem 0 0">${dinnerItem.prompts[langCode] || dinnerItem.prompts.en}</p>
            <button type="button" class="tlp-btn tlp-btn-ghost no-print" id="tlpDinnerSpeakBtn" style="margin-top:0.6rem;min-height:34px;padding:0.3rem 0.85rem;font-size:0.82rem">
              🔊 Listen (${langMeta.label})
            </button>
          </div>

          <div class="tlp-pride-footer">
            <p class="tlp-muted" style="font-size:0.78rem;margin:0;max-width:38ch">${labels.privacy}</p>
            <div>${qrSvg(shareUrl, 92)}</div>
          </div>

          <div class="tlp-actions-row no-print" style="margin-top:1rem">
            <button type="button" class="tlp-btn tlp-btn-primary" id="tlpFamilyCopyBtn">${labels.copy}</button>
            <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpFamilyPrintBtn">${labels.print}</button>
            <span id="tlpFamilyCopyStatus" class="tlp-muted" role="status"></span>
          </div>
        </article>

        <p class="no-print" style="margin-top:1.25rem">
          <a class="tlp-btn tlp-btn-ghost" href="${BASE}/">← Back to Language Hub</a>
        </p>
      </section>
    `,
    mount(root) {
      const updateUrl = (nextLang, nextPrompt) => {
        const u = new URL(location.href);
        u.searchParams.set("a", alias);
        u.searchParams.set("l", nextLang);
        u.searchParams.set("d", nextPrompt);
        history.replaceState(null, "", u.pathname + u.search);
        ctx.rerender();
      };

      root.querySelector("#tlpFamilyLangSelect")?.addEventListener("change", (e) => {
        updateUrl(e.target.value, dinnerItem.id);
      });
      root.querySelector("#tlpFamilyPromptSelect")?.addEventListener("change", (e) => {
        updateUrl(langCode, e.target.value);
      });

      root.querySelector("#tlpPrideSpeakBtn")?.addEventListener("click", () => {
        if (typeof speechSynthesis === "undefined") return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(prideSentence);
        u.lang = "en-US";
        u.rate = 0.9;
        speechSynthesis.speak(u);
      });

      root.querySelector("#tlpDinnerSpeakBtn")?.addEventListener("click", () => {
        if (typeof speechSynthesis === "undefined") return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(dinnerItem.prompts[langCode] || dinnerItem.prompts.en);
        u.lang = langMeta.speechLang;
        u.rate = 0.92;
        speechSynthesis.speak(u);
      });

      root.querySelector("#tlpFamilyCopyBtn")?.addEventListener("click", async () => {
        await copyText(shareUrl);
        root.querySelector("#tlpFamilyCopyStatus").textContent = "✓ Zero-PII link copied!";
      });

      root.querySelector("#tlpFamilyPrintBtn")?.addEventListener("click", () => window.print());
    },
  };
}
