// BCPSS Teacher Studio — Visual Vocabulary Studio
// Renders every unit's authored tier2_tier3_vocab (definition, example, non-example, cue, word
// family, Spanish) + l1_watchouts across all 162 K–8 units. The text is authored but NOT yet
// reviewed (159 of 162 units are draft_standards_based), so nothing here is labelled "verified".
// A card never shows invented text: a field that is missing is omitted, and a diagram is drawn
// only for a term with a declared visual spec (see vocab-visuals.js).

import { DRAFT_NOTICE } from "../shared/bcpss-provenance.js";
import { keepView } from "./keep-view.js";
import { chipHtml } from "./provenance-live.js";
import { openPrintableVocabSheet, renderVocabPracticePanel } from "./vocab-practice.js";
import { renderConceptVisual } from "./vocab-visuals.js";
import { wordPartsFor } from "./vocab-word-parts.js";

const containerState = new WeakMap();

const FALSE_COGNATE_WATCH = {
  actual: "False cognate alert: Spanish 'actual' means 'current', not 'real/actual'.",
  argument: "Cognate bridge: Spanish 'argumento' can mean plot or claim — clarify academic evidence.",
  data: "Cognate bridge: Spanish 'datos' is always plural ('los datos').",
  library: "False cognate alert: Spanish 'librería' is bookstore; 'biblioteca' is library.",
  record: "False cognate alert: Spanish 'recordar' means 'to remember', not 'to record data'.",
  support: "False cognate alert: Spanish 'soportar' means 'to tolerate'; use 'apoyar' for evidence support.",
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function safeParseJson(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export function gradeBandFor(grade) {
  const g = String(grade || "").toUpperCase();
  if (["K", "1", "2"].includes(g)) return "k2";
  if (["3", "4", "5"].includes(g)) return "35";
  return "68";
}

function bandLabel(band) {
  if (band === "k2") return "K–2 Early Elementary";
  if (band === "35") return "3–5 Upper Elementary";
  return "6–8 Middle School";
}

export function normalizeVocab(raw) {
  const parsed = safeParseJson(raw, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (typeof item === "string") {
        return { word: item.trim(), tier: "Tier 2", definition: "", cognate: "", cognateEs: "", example: "", nonexample: "", cue: "", family: [], falseFriend: "" };
      }
      if (!item || typeof item !== "object") return null;
      const word = String(item.word || item.term || "").trim();
      const definition = String(
        item.student_friendly_def || item.kid_def || item.definition || item.note || "",
      ).trim();
      const cognateEs = String(item.cognate_es || item.es_cognate || "").trim();
      const cognate = String(
        item.cognate_hint ||
          (item.cognate_es ? `Spanish cognate: ${item.cognate_es}` : "") ||
          item.cognate ||
          item.es_cognate ||
          "",
      ).trim();
      const tier = item.tier
        ? String(item.tier).toLowerCase().startsWith("tier")
          ? String(item.tier)
          : `Tier ${item.tier}`
        : "Tier 2";
      const text = (v) => String(v || "").trim();
      const family = (Array.isArray(item.family) ? item.family : [])
        .map(text)
        .filter((f) => f && f.toLowerCase() !== word.toLowerCase());
      return {
        word,
        tier,
        definition,
        cognate,
        cognateEs,
        example: text(item.example),
        nonexample: text(item.nonexample),
        cue: text(item.cue),
        family,
        falseFriend: text(item.false_friend),
      };
    })
    .filter((v) => v?.word);
}

function falseCognateNote(word, l1Watchouts) {
  const lower = String(word || "").toLowerCase();
  for (const [k, note] of Object.entries(FALSE_COGNATE_WATCH)) {
    if (lower.includes(k)) return note;
  }
  const watchList = Array.isArray(l1Watchouts) ? l1Watchouts : [];
  const hit = watchList.find((w) => {
    const text = `${w?.friction_point || ""} ${w?.watchout || ""} ${w?.note || ""}`.toLowerCase();
    return lower.length >= 4 && text.includes(lower);
  });
  if (hit) {
    return String(hit.friction_point || hit.watchout || hit.note || "").trim();
  }
  return "";
}

function speakWord(text, statusEl) {
  const clean = String(text || "").trim();
  if (!clean) return;
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = "en-US";
      utter.rate = 0.88;
      window.speechSynthesis.speak(utter);
      if (statusEl) statusEl.textContent = `Reading aloud: "${clean}"`;
      return;
    } catch {
      // Fallback below
    }
  }
  if (statusEl) statusEl.textContent = `Pronunciation support: read "${clean}" aloud together in syllables.`;
}

export function renderVisualVocabStudio(container, { unit, connection, blueprint, wida, provenance, onTelemetry } = {}) {
  if (!container) return;
  if (!unit) {
    container.innerHTML = `<div class="bh-empty">Choose a grade, subject, and unit above to open the Visual Vocabulary Studio.</div>`;
    return;
  }

  const vocab = normalizeVocab(connection?.tier2_tier3_vocab);
  const l1Raw = safeParseJson(connection?.l1_watchouts, []);
  const l1List = Array.isArray(l1Raw) ? l1Raw : l1Raw && typeof l1Raw === "object" ? Object.values(l1Raw) : [];
  const klu = blueprint?.wida_klu || unit.primary_klu || "Explain";
  // Vocabulary has no review record of its own: it carries its unit's state. Unknown reads as draft, never reviewed.
  const provChip = () => chipHtml(provenance?.state || "draft", { unitId: unit.id });
  const defaultBand = gradeBandFor(unit.grade);

  const prev = containerState.get(container);
  const st =
    prev && prev.unitId === unit.id
      ? prev
      : {
          unitId: unit.id,
          mode: "cards", // cards | practice | print
          band: defaultBand,
          tierFilter: "All",
          practiceMode: "match", // match | cloze | sentence
          selectedWord: null,
          matchedWords: new Set(),
          matchFeedback: "",
          clozeAnswers: {},
          sentenceDraft: "",
          sentenceFeedback: "",
        };
  containerState.set(container, st);

  function render() {
    keepView(container, draw);
  }

  function draw() {
    const filteredVocab = vocab.filter((v) => {
      if (st.tierFilter === "All") return true;
      return v.tier.toLowerCase().includes(st.tierFilter.toLowerCase());
    });

    container.innerHTML = `
      <div class="vs-shell is-band-${esc(st.band)}">
        <div class="vs-toolbar">
          <div>
            <span class="studio-kicker">Visual Vocabulary Studio · Unit ${esc(unit.unit_number)}</span>
            <h3 style="margin:0.15rem 0 0">${esc(unit.unit_title)} (${vocab.length} Terms) ${provChip()}</h3>
          </div>
          <div class="vs-mode-tabs" role="group" aria-label="Vocabulary classroom mode">
            <button type="button" class="vs-pill" data-vs-mode="cards" aria-pressed="${st.mode === "cards"}">Visual Word Cards</button>
            <button type="button" class="vs-pill" data-vs-mode="practice" aria-pressed="${st.mode === "practice"}">Practice &amp; Print</button>
            <button type="button" class="vs-pill" data-vs-mode="print" aria-pressed="${st.mode === "print"}">Printable Set</button>
          </div>
          <div class="vs-band-group" role="group" aria-label="Grade band layout mode">
            <button type="button" class="vs-pill" data-vs-band="k2" aria-pressed="${st.band === "k2"}">K–2</button>
            <button type="button" class="vs-pill" data-vs-band="35" aria-pressed="${st.band === "35"}">3–5</button>
            <button type="button" class="vs-pill" data-vs-band="68" aria-pressed="${st.band === "68"}">6–8</button>
          </div>
        </div>

        <p id="vsSpeechStatus" class="bh-muted" role="status" aria-live="polite" style="margin:0">
          Layout: <strong>${esc(bandLabel(st.band))}</strong> · WIDA Function: <strong>${esc(klu)}</strong> · Support Tier: <strong>${esc(wida || "3_4").replace("_", "–")}</strong>
        </p>

        ${st.mode === "cards" ? renderCardsMode(filteredVocab) : ""}
        ${st.mode === "practice" ? renderPracticeMode() : ""}
        ${st.mode === "print" ? renderPrintMode() : ""}
      </div>
    `;

    if (st.mode === "practice") {
      const mount = container.querySelector("[data-vs-practice-mount]");
      if (mount) {
        renderVocabPracticePanel(mount, {
          unit,
          terms: vocab,
          l1Watchouts: l1List,
          wida,
          provenance,
          onTelemetry,
        });
      }
    }
  }

  function renderCardsMode(items) {
    if (!items.length) {
      return `<div class="bh-empty">No vocabulary items match this filter.</div>`;
    }
    return `
      <div class="vs-band-group" role="group" aria-label="Filter vocabulary tier">
        <button type="button" class="vs-pill" data-vs-tier="All" aria-pressed="${st.tierFilter === "All"}">All Tiers (${vocab.length})</button>
        <button type="button" class="vs-pill" data-vs-tier="Tier 2" aria-pressed="${st.tierFilter === "Tier 2"}">Tier 2 Academic</button>
        <button type="button" class="vs-pill" data-vs-tier="Tier 3" aria-pressed="${st.tierFilter === "Tier 3"}">Tier 3 Domain</button>
      </div>
      <div class="vs-cards-grid">
        ${items
          .map((v) => {
            const parts = wordPartsFor(v.word);
            const watch = falseCognateNote(v.word, l1List);
            const visual = renderConceptVisual(v.word, unit.subject);
            return `
              <article class="vs-card">
                <div class="vs-card-head">
                  <div>
                    <h4 class="vs-word-title">${esc(v.word)}</h4>
                    <span class="bh-tier-badge">${esc(v.tier)}</span>
                    <span class="bh-standard-chip">WIDA: ${esc(klu)}</span>
                    ${provChip()}
                  </div>
                  <button
                    type="button"
                    class="bh-btn bh-btn-secondary bh-btn-sm"
                    data-vs-speak="${esc(`${v.word}. ${v.definition || ""}`)}"
                    aria-label="Hear pronunciation of ${esc(v.word)}"
                  >
                    Listen
                  </button>
                </div>

                ${visual ? `<div class="vs-svg-frame">${visual}</div>` : v.cue ? `<p class="vs-cue">Picture it: ${esc(v.cue)}</p>` : ""}

                <div class="vs-meta-grid">
                  ${v.definition ? `<p class="vs-meta-row vs-def"><strong>Student-Friendly Definition:</strong> ${esc(v.definition)}</p>` : ""}
                  ${v.example ? `<p class="vs-meta-row"><strong>Example:</strong> ${esc(v.example)}</p>` : ""}
                  ${st.band !== "k2" && v.nonexample ? `<p class="vs-meta-row"><strong>Non-Example:</strong> ${esc(v.nonexample)}</p>` : ""}
                  ${visual && v.cue ? `<p class="vs-meta-row"><strong>Picture it:</strong> ${esc(v.cue)}</p>` : ""}
                  ${v.family.length ? `<p class="vs-meta-row"><strong>Word family:</strong> ${esc(v.family.join(", "))}</p>` : ""}
                  ${parts ? `<p class="vs-meta-row"><strong>Word parts:</strong> <span class="wida-code">${esc(parts)}</span></p>` : ""}
                  ${v.cognate ? `<div><span class="vs-cognate-pill">${esc(v.cognate)}</span></div>` : ""}
                  ${v.falseFriend ? `<div class="vs-feedback is-warn">${esc(v.falseFriend)}</div>` : ""}
                  ${watch ? `<div class="vs-feedback is-warn">${esc(watch)}</div>` : ""}
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderPracticeMode() {
    if (!vocab.length) {
      return `<div class="bh-empty">No vocabulary terms available for practice in this unit.</div>`;
    }
    return `<div class="vs-practice-box" data-vs-practice-mount></div>`;
  }

  function renderPrintMode() {
    return `
      <div class="vs-practice-box">
        <div class="vs-card-head">
          <div>
            <h4 style="margin:0">Printable Vocabulary Card Set — Unit ${esc(unit.unit_number)}: ${esc(unit.unit_title)}</h4>
            <p class="bh-muted" style="margin:0.2rem 0 0">Formatted for student word walls, notebooks, and small-group cut-out cards.</p>
          </div>
          <button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-vs-print-set>Print Vocabulary Set</button>
        </div>
        <div class="vs-cards-grid">
          ${vocab
            .map(
              (v) => {
                const visual = renderConceptVisual(v.word, unit.subject);
                return `
                <article class="vs-card">
                  <div class="vs-card-head">
                    <strong>${esc(v.word)}</strong>
                    <span class="bh-tier-badge">${esc(v.tier)}</span>
                    ${provChip()}
                  </div>
                  ${visual ? `<div class="vs-svg-frame">${visual}</div>` : v.cue ? `<p class="vs-cue">Picture it: ${esc(v.cue)}</p>` : ""}
                  ${v.example ? `<p style="margin:0;font-size:0.86rem"><em>${esc(v.example)}</em></p>` : ""}
                  <p style="margin:0;font-size:0.9rem">${esc(v.definition || "")}</p>
                  ${v.cognate ? `<p style="margin:0;font-size:0.84rem;color:var(--cognate-ink)"><strong>${esc(v.cognate)}</strong></p>` : ""}
                </article>
              `;
              },
            )
            .join("")}
        </div>
        ${provenance?.state === "reviewed" ? "" : `<p class="bh-muted">${DRAFT_NOTICE}</p>`}
      </div>
    `;
  }

  if (!container.dataset.vsBound) {
    container.dataset.vsBound = "1";
    container.addEventListener("click", (e) => {
      const s = containerState.get(container);
      if (!s) return;

      const modeBtn = e.target.closest("[data-vs-mode]");
      if (modeBtn) {
        s.mode = modeBtn.dataset.vsMode;
        onTelemetry?.("vocab_lookup");
        render();
        return;
      }

      const bandBtn = e.target.closest("[data-vs-band]");
      if (bandBtn) {
        s.band = bandBtn.dataset.vsBand;
        render();
        return;
      }

      const tierBtn = e.target.closest("[data-vs-tier]");
      if (tierBtn) {
        s.tierFilter = tierBtn.dataset.vsTier;
        render();
        return;
      }

      const speakBtn = e.target.closest("[data-vs-speak]");
      if (speakBtn) {
        speakWord(speakBtn.dataset.vsSpeak, container.querySelector("#vsSpeechStatus"));
        onTelemetry?.("vocab_lookup");
        return;
      }

      if (e.target.closest("[data-vs-print-set]")) {
        openPrintableVocabSheet(unit, vocab, {
          wida,
          draftNotice: DRAFT_NOTICE,
          provenanceState: provenance?.state || "draft",
        });
        onTelemetry?.("vocab_print");
      }
    });
  }

  draw();
}
