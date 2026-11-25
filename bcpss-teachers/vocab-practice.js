// BCPSS Teacher Studio — Vocabulary Practice Modes, Word Family Explorer, and Printable Card Sheets
// Pure data builders + interactive DOM renderer. Every term, definition, example, cognate, and word
// family comes strictly from the unit's authored data — never invented text. All outputs carry the
// unit's draft provenance notice until reviewed by a teacher or language specialist.

import { DRAFT_NOTICE } from "../shared/bcpss-provenance.js";
import { wordPartsFor } from "./vocab-word-parts.js";

const practiceState = new WeakMap();

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);
}

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hashStr(str) {
  let h = 2166136261;
  for (const ch of String(str)) {
    h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  }
  return h;
}

function deterministicShuffle(list, seed) {
  if (list.length <= 1) return [...list];
  const ordered = list
    .map((item, idx) => ({ item, idx, key: hashStr(`${seed}:${idx}:${item.word || ""}`) }))
    .sort((a, b) => a.key - b.key || a.idx - b.idx)
    .map((entry) => entry.item);
  // Avoid identical 1:1 ordering when 2+ items exist so matching requires reading.
  const sameOrder = ordered.every((item, idx) => item === list[idx]);
  if (sameOrder) {
    return [...ordered.slice(1), ordered[0]];
  }
  return ordered;
}

function findL1Watchout(word, l1Watchouts) {
  const lower = String(word || "").trim().toLowerCase();
  if (lower.length < 4 || !Array.isArray(l1Watchouts)) return "";
  const hit = l1Watchouts.find((w) => {
    const text = `${w?.friction_point || ""} ${w?.watchout || ""} ${w?.note || ""}`.toLowerCase();
    return text.includes(lower);
  });
  return hit ? String(hit.friction_point || hit.watchout || hit.note || "").trim() : "";
}

// ── 1. Flashcards ─────────────────────────────────────────────────────────────

export function buildFlashcards(terms) {
  if (!Array.isArray(terms)) return [];
  return terms
    .filter((v) => v?.word && v.definition)
    .map((v) => ({
      word: v.word,
      tier: v.tier || "Tier 2",
      cognate: v.cognate || "",
      cognateEs: v.cognateEs || "",
      definition: v.definition,
      example: v.example || "",
      nonexample: v.nonexample || "",
      cue: v.cue || "",
      family: Array.isArray(v.family) ? [...v.family] : [],
    }));
}

// ── 2. Match Term <-> Definition ──────────────────────────────────────────────

export function buildMatchItems(terms, { seed = "" } = {}) {
  if (!Array.isArray(terms)) return { pairs: [], shuffledDefs: [] };
  const pairs = terms
    .filter((v) => v?.word && v.definition)
    .map((v) => ({
      word: v.word,
      tier: v.tier || "Tier 2",
      definition: v.definition,
    }));
  const shuffledDefs = deterministicShuffle(pairs, seed || "match");
  return { pairs, shuffledDefs };
}

// ── 3. Context Cloze (strictly real example sentences containing the word) ───

export function buildClozeItems(terms, { seed = "" } = {}) {
  if (!Array.isArray(terms)) return [];
  const allWords = [...new Set(terms.map((v) => v?.word).filter(Boolean))];
  const items = [];
  for (const v of terms) {
    if (!v?.word || !v.example) continue;
    const re = new RegExp(`\\b${escapeRegExp(v.word)}\\b`, "gi");
    if (!re.test(v.example)) continue;
    const prompt = v.example.replace(re, "_____");
    if (!prompt.includes("_____")) continue;
    const distractors = deterministicShuffle(
      allWords.filter((w) => w.toLowerCase() !== v.word.toLowerCase()).map((w) => ({ word: w })),
      `${seed}:cloze:${v.word}`,
    )
      .slice(0, 3)
      .map((x) => x.word);
    const choices = deterministicShuffle(
      [v.word, ...distractors].map((w) => ({ word: w })),
      `${seed}:choices:${v.word}`,
    ).map((x) => x.word);
    items.push({
      word: v.word,
      tier: v.tier || "Tier 2",
      prompt,
      originalExample: v.example,
      definition: v.definition || "",
      choices,
    });
  }
  return items;
}

// ── 4. Cognate Detective ──────────────────────────────────────────────────────

export const COGNATE_CATEGORIES = Object.freeze({
  true_cognate: "True Cognate",
  false_friend: "False Friend",
  non_cognate: "Non-Cognate / Translation",
});

export function classifyTermCognate(term, l1Watchouts = []) {
  const cognate = String(term?.cognate || "").trim();
  const falseFriend = String(term?.falseFriend || "").trim();
  const l1Note = findL1Watchout(term?.word, l1Watchouts);
  const falsePattern = /false\s+(?:friend|cognate)/i;
  const nonCognatePattern = /\b(?:non-cognate|not a cognate)\b/i;
  const trueCognatePattern = /\b(?:true\s+cognate|cognate-like|cognate)\b/i;

  if (falseFriend || falsePattern.test(cognate) || (l1Note && falsePattern.test(l1Note))) {
    return {
      category: "false_friend",
      evidence: falseFriend || (falsePattern.test(cognate) ? cognate : l1Note),
      l1Note,
    };
  }
  if (cognate && !nonCognatePattern.test(cognate) && trueCognatePattern.test(cognate)) {
    return {
      category: "true_cognate",
      evidence: cognate,
      l1Note,
    };
  }
  return {
    category: "non_cognate",
    evidence: cognate || l1Note || "",
    l1Note,
  };
}

export function buildCognateItems(terms, l1Watchouts = []) {
  if (!Array.isArray(terms)) return [];
  return terms
    .filter((v) => v?.word)
    .map((v) => {
      const result = classifyTermCognate(v, l1Watchouts);
      return {
        word: v.word,
        tier: v.tier || "Tier 2",
        category: result.category,
        cognate: v.cognate || "",
        cognateEs: v.cognateEs || "",
        falseFriend: v.falseFriend || "",
        l1Note: result.l1Note,
        evidence: result.evidence,
      };
    });
}

// ── 5. Word Family Explorer ───────────────────────────────────────────────────

export function buildWordFamilyItems(terms) {
  if (!Array.isArray(terms)) return [];
  const items = [];
  for (const v of terms) {
    if (!v?.word) continue;
    const family = (Array.isArray(v.family) ? v.family : [])
      .map((f) => String(f || "").trim())
      .filter((f) => f && f.toLowerCase() !== v.word.toLowerCase());
    const wordParts = wordPartsFor(v.word);
    if (!family.length && !wordParts) continue;
    items.push({
      word: v.word,
      tier: v.tier || "Tier 2",
      definition: v.definition || "",
      family,
      wordParts,
    });
  }
  return items;
}

// ── 6. Printable Card Sheets ──────────────────────────────────────────────────

export function renderPrintableVocabSheet(
  unit,
  terms,
  { wida = "3_4", draftNotice = DRAFT_NOTICE, provenanceState = "draft" } = {},
) {
  const safeTerms = Array.isArray(terms) ? terms.filter((v) => v?.word) : [];
  const title = `Vocabulary Card Sheet — Unit ${unit?.unit_number ?? ""}: ${unit?.unit_title || ""}`.trim();
  const widaLabel = String(wida || "3_4").replace("_", "–");
  const showNotice = provenanceState !== "reviewed" && Boolean(draftNotice);

  const cardsHtml = safeTerms
    .map((v) => {
      const family = (Array.isArray(v.family) ? v.family : [])
        .map((f) => String(f || "").trim())
        .filter((f) => f && f.toLowerCase() !== v.word.toLowerCase());
      const parts = wordPartsFor(v.word);
      const esLine = v.cognate || (v.cognateEs ? `Spanish: ${v.cognateEs}` : "");
      return `
        <article class="vp-print-card" data-print-term="${esc(v.word)}">
          <header class="vp-print-card-head">
            <h2 class="vp-print-word">${esc(v.word)}</h2>
            <span class="vp-print-tier">${esc(v.tier || "Tier 2")}</span>
          </header>
          ${esLine ? `<p class="vp-print-es">${esc(esLine)}</p>` : ""}
          ${v.definition ? `<p class="vp-print-def"><strong>Definition:</strong> ${esc(v.definition)}</p>` : ""}
          ${v.example ? `<p class="vp-print-ex"><strong>Example:</strong> ${esc(v.example)}</p>` : ""}
          ${family.length ? `<p class="vp-print-fam"><strong>Word family:</strong> ${esc(family.join(", "))}</p>` : ""}
          ${parts ? `<p class="vp-print-parts"><strong>Word parts:</strong> ${esc(parts)}</p>` : ""}
        </article>
      `;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>
    @page { margin: 0.5in; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 10pt;
      line-height: 1.35;
    }
    .vp-print-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 0.08in;
      margin-bottom: 0.14in;
    }
    .vp-print-header h1 {
      margin: 0;
      font-size: 13pt;
      color: #0f172a;
    }
    .vp-print-meta {
      font-size: 8.5pt;
      color: #475569;
    }
    .vp-print-notice {
      margin: 0 0 0.12in;
      padding: 0.06in 0.1in;
      border: 1px solid #d97706;
      background: #fef3c7;
      color: #92400e;
      font-size: 8.5pt;
      border-radius: 4px;
    }
    .vp-print-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.12in;
    }
    .vp-print-card {
      border: 1px dashed #64748b;
      border-radius: 6px;
      padding: 0.1in 0.12in;
      break-inside: avoid;
      background: #ffffff;
    }
    .vp-print-card-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.08in;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 0.04in;
      margin-bottom: 0.06in;
    }
    .vp-print-word {
      margin: 0;
      font-size: 12pt;
      color: #0f766e;
    }
    .vp-print-tier {
      font-size: 8pt;
      font-weight: 600;
      color: #0369a1;
      background: #e0f2fe;
      padding: 1px 6px;
      border-radius: 999px;
      white-space: nowrap;
    }
    .vp-print-es {
      margin: 0 0 0.05in;
      font-size: 8.5pt;
      color: #115e59;
      background: #f0fdfa;
      border-left: 3px solid #0f766e;
      padding: 2px 6px;
    }
    .vp-print-def,
    .vp-print-ex,
    .vp-print-fam,
    .vp-print-parts {
      margin: 0 0 0.04in;
      font-size: 9pt;
      color: #1e293b;
    }
    .vp-print-footer {
      margin-top: 0.14in;
      padding-top: 0.06in;
      border-top: 1px solid #cbd5e1;
      font-size: 8pt;
      color: #475569;
    }
  </style>
</head>
<body>
  <header class="vp-print-header">
    <h1>${esc(title)}</h1>
    <span class="vp-print-meta">Grade ${esc(unit?.grade ?? "")} · ${esc(unit?.subject ?? "")} · WIDA ${esc(widaLabel)} · ${safeTerms.length} Terms</span>
  </header>
  ${showNotice ? `<p class="vp-print-notice" data-print-provenance="draft">${esc(draftNotice)}</p>` : ""}
  <main class="vp-print-grid">
    ${cardsHtml}
  </main>
  ${showNotice ? `<footer class="vp-print-footer">${esc(draftNotice)}</footer>` : ""}
</body>
</html>`;
}

// ── 7. Scoped Styles (injected once, teal/ocean/slate/amber palette only) ─────

const PRACTICE_CSS = `
.vp-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  padding: 0.75rem 0.9rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
}
.vp-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.vp-tab {
  appearance: none;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #1e293b;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
}
.vp-tab[aria-pressed="true"] {
  background: #0f766e;
  border-color: #0f766e;
  color: #ffffff;
}
.vp-print-btn {
  appearance: none;
  border: 1px solid #0369a1;
  background: #0369a1;
  color: #ffffff;
  padding: 0.42rem 0.85rem;
  border-radius: 8px;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
}
.vp-panel {
  margin-top: 0.85rem;
  display: grid;
  gap: 0.85rem;
}
.vp-flashcard {
  border: 2px solid #99f6e4;
  background: #ffffff;
  border-radius: 12px;
  padding: 1.25rem;
  display: grid;
  gap: 0.65rem;
}
.vp-flashcard.is-flipped {
  background: #f0fdfa;
  border-color: #0f766e;
}
.vp-flashcard-word {
  margin: 0;
  font-size: 1.45rem;
  color: #0f172a;
}
.vp-flashcard-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.vp-cog-card,
.vp-fam-card {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  display: grid;
  gap: 0.45rem;
}
.vp-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.vp-fam-chip {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.84rem;
  font-weight: 600;
}
.vp-parts-badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  background: #f0fdfa;
  border: 1px solid #99f6e4;
  color: #115e59;
  font-size: 0.84rem;
}
.vp-notice {
  margin: 0.5rem 0 0;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  color: #92400e;
  font-size: 0.84rem;
}
`;

export function ensurePracticeStyles() {
  if (typeof document === "undefined" || !document.head) return;
  if (document.head.querySelector("style[data-vocab-practice-css]")) return;
  const style = document.createElement("style");
  style.setAttribute("data-vocab-practice-css", "1");
  style.textContent = PRACTICE_CSS;
  document.head.append(style);
}

export function openPrintableVocabSheet(unit, terms, options = {}) {
  const html = renderPrintableVocabSheet(unit, terms, options);
  if (typeof window === "undefined") return html;
  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank", "noopener");
    if (win) {
      win.addEventListener("load", () => {
        try {
          win.print();
        } catch {
          // Print dialog blocked or unavailable
        }
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      });
      return html;
    }
    URL.revokeObjectURL(url);
  } catch {
    // Fallback below
  }
  const win = window.open("", "_blank");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }
  return html;
}

// ── 8. Interactive Practice & Print DOM Renderer ──────────────────────────────

export function renderVocabPracticePanel(
  container,
  { unit, terms = [], l1Watchouts = [], wida = "3_4", provenance, onTelemetry } = {},
) {
  if (!container) return;
  ensurePracticeStyles();

  const unitId = unit?.id || "unit";
  const flashcards = buildFlashcards(terms);
  const matchData = buildMatchItems(terms, { seed: unitId });
  const clozeItems = buildClozeItems(terms, { seed: unitId });
  const cognateItems = buildCognateItems(terms, l1Watchouts);
  const familyItems = buildWordFamilyItems(terms);
  const provState = provenance?.state || "draft";

  const prev = practiceState.get(container);
  const st =
    prev && prev.unitId === unitId
      ? prev
      : {
          unitId,
          tab: "flashcard", // flashcard | match | cloze | cognate | family
          cardIdx: 0,
          flipped: false,
          selectedWord: null,
          matchedWords: new Set(),
          matchFeedback: "",
          clozeAnswers: {},
          cognateAnswers: {},
        };
  practiceState.set(container, st);

  function renderFlashcardTab() {
    if (!flashcards.length) {
      return `<div class="bh-empty">No vocabulary definitions available for flashcards in this unit.</div>`;
    }
    const idx = Math.max(0, Math.min(st.cardIdx, flashcards.length - 1));
    const card = flashcards[idx];
    return `
      <div class="vp-panel" data-vp-view="flashcard">
        <p class="bh-muted" style="margin:0">Card ${idx + 1} of ${flashcards.length}. Flip to reveal the student-friendly definition and unit example.</p>
        <article class="vp-flashcard ${st.flipped ? "is-flipped" : ""}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem">
            <h4 class="vp-flashcard-word">${esc(card.word)}</h4>
            <span class="bh-tier-badge">${esc(card.tier)}</span>
          </div>
          ${card.cognate ? `<div><span class="vs-cognate-pill">${esc(card.cognate)}</span></div>` : ""}
          ${
            st.flipped
              ? `
                <p style="margin:0"><strong>Definition:</strong> ${esc(card.definition)}</p>
                ${card.example ? `<p style="margin:0"><strong>Example:</strong> ${esc(card.example)}</p>` : ""}
                ${card.nonexample ? `<p style="margin:0"><strong>Non-Example:</strong> ${esc(card.nonexample)}</p>` : ""}
              `
              : `<p class="bh-muted" style="margin:0">Select <strong>Flip Card</strong> to check the meaning.</p>`
          }
        </article>
        <div class="vp-flashcard-controls">
          <button type="button" class="vp-tab" data-vp-card-prev ${idx === 0 ? "disabled" : ""}>Previous</button>
          <button type="button" class="vp-tab" data-vp-card-flip aria-pressed="${st.flipped}">${st.flipped ? "Show Term" : "Flip Card"}</button>
          <button type="button" class="vp-tab" data-vp-card-next ${idx >= flashcards.length - 1 ? "disabled" : ""}>Next</button>
        </div>
      </div>
    `;
  }

  function renderMatchTab() {
    if (!matchData.pairs.length) {
      return `<div class="bh-empty">No vocabulary pairs available for matching in this unit.</div>`;
    }
    const done = st.matchedWords.size >= matchData.pairs.length;
    return `
      <div class="vp-panel" data-vp-view="match">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem">
          <p class="bh-muted" style="margin:0">Select a term on the left, then select its matching definition on the right (${st.matchedWords.size}/${matchData.pairs.length} matched).</p>
          <button type="button" class="vp-tab" data-vp-match-reset>Reset</button>
        </div>
        <div class="vs-match-grid">
          <div style="display:grid;gap:0.5rem">
            <strong>Terms</strong>
            ${matchData.pairs
              .map((p) => {
                const matched = st.matchedWords.has(p.word);
                const selected = st.selectedWord === p.word;
                return `<button type="button" class="vs-match-btn ${matched ? "is-matched" : selected ? "is-selected" : ""}" data-vp-match-word="${esc(p.word)}" ${matched ? "disabled" : ""}>${esc(p.word)} ${matched ? "✓" : ""}</button>`;
              })
              .join("")}
          </div>
          <div style="display:grid;gap:0.5rem">
            <strong>Definitions</strong>
            ${matchData.shuffledDefs
              .map((p) => {
                const matched = st.matchedWords.has(p.word);
                return `<button type="button" class="vs-match-btn ${matched ? "is-matched" : ""}" data-vp-match-def="${esc(p.word)}" ${matched ? "disabled" : ""}>${esc(p.definition)}</button>`;
              })
              .join("")}
          </div>
        </div>
        ${
          done
            ? `<div class="vs-feedback is-good" role="status">All ${matchData.pairs.length} terms matched accurately!</div>`
            : st.matchFeedback
              ? `<div class="vs-feedback ${st.matchFeedback.startsWith("Matched") ? "is-good" : "is-warn"}" role="status">${esc(st.matchFeedback)}</div>`
              : ""
        }
      </div>
    `;
  }

  function renderClozeTab() {
    if (!clozeItems.length) {
      return `<div class="bh-empty">No authored example sentences containing the target term are available for cloze practice in this unit.</div>`;
    }
    return `
      <div class="vp-panel" data-vp-view="cloze">
        <p class="bh-muted" style="margin:0">Choose the target term that completes each unit example sentence.</p>
        ${clozeItems
          .map((item, idx) => {
            const picked = st.clozeAnswers[idx] || "";
            const isRight = picked === item.word;
            return `
              <article class="vp-cog-card" data-vp-cloze-item="${esc(item.word)}">
                <p style="margin:0"><strong>${idx + 1}.</strong> ${esc(item.prompt)}</p>
                <div class="vp-tabs">
                  ${item.choices
                    .map(
                      (choice) => `
                        <button type="button" class="vp-tab" data-vp-cloze-idx="${idx}" data-vp-cloze-val="${esc(choice)}" aria-pressed="${picked === choice}">
                          ${esc(choice)}
                        </button>
                      `,
                    )
                    .join("")}
                </div>
                ${
                  picked
                    ? `<div class="vs-feedback ${isRight ? "is-good" : "is-warn"}" role="status">${
                        isRight
                          ? `Correct: "${item.originalExample}"`
                          : `Try again — re-read the sentence context and choose another unit term.`
                      }</div>`
                    : ""
                }
              </article>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderCognateTab() {
    if (!cognateItems.length) {
      return `<div class="bh-empty">No vocabulary terms available for Cognate Detective in this unit.</div>`;
    }
    return `
      <div class="vp-panel" data-vp-view="cognate">
        <p class="bh-muted" style="margin:0">Classify each term using its Spanish language connection: True Cognate, False Friend, or Non-Cognate / Translation.</p>
        ${cognateItems
          .map((item, idx) => {
            const picked = st.cognateAnswers[idx] || "";
            const isRight = picked === item.category;
            return `
              <article class="vp-cog-card" data-vp-cog-item="${esc(item.word)}">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem">
                  <strong>${esc(item.word)}</strong>
                  <span class="bh-tier-badge">${esc(item.tier)}</span>
                </div>
                ${item.cognateEs ? `<p class="bh-muted" style="margin:0">Spanish: <strong>${esc(item.cognateEs)}</strong></p>` : ""}
                <div class="vp-tabs">
                  ${Object.entries(COGNATE_CATEGORIES)
                    .map(
                      ([key, label]) => `
                        <button type="button" class="vp-tab" data-vp-cog-idx="${idx}" data-vp-cog-val="${key}" aria-pressed="${picked === key}">
                          ${esc(label)}
                        </button>
                      `,
                    )
                    .join("")}
                </div>
                ${
                  picked
                    ? `<div class="vs-feedback ${isRight ? "is-good" : "is-warn"}" role="status">
                        ${isRight ? `Correct (${COGNATE_CATEGORIES[item.category]}).` : `This term is classified as ${COGNATE_CATEGORIES[item.category]}.`}
                        ${item.evidence ? ` ${esc(item.evidence)}` : ""}
                      </div>`
                    : ""
                }
              </article>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderFamilyTab() {
    if (!familyItems.length) {
      return `<div class="bh-empty">No word families or morphology breakdowns are authored for this unit.</div>`;
    }
    return `
      <div class="vp-panel" data-vp-view="family">
        <p class="bh-muted" style="margin:0">Explore related word family forms and prefix/root/suffix parts from this unit.</p>
        ${familyItems
          .map(
            (item) => `
              <article class="vp-fam-card" data-vp-fam-item="${esc(item.word)}">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem">
                  <strong>${esc(item.word)}</strong>
                  <span class="bh-tier-badge">${esc(item.tier)}</span>
                </div>
                ${item.definition ? `<p class="bh-muted" style="margin:0">${esc(item.definition)}</p>` : ""}
                ${
                  item.family.length
                    ? `<div class="vp-chip-row">${item.family.map((f) => `<span class="vp-fam-chip">${esc(f)}</span>`).join("")}</div>`
                    : ""
                }
                ${item.wordParts ? `<div><span class="vp-parts-badge"><strong>Word parts:</strong> ${esc(item.wordParts)}</span></div>` : ""}
              </article>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function draw() {
    container.innerHTML = `
      <div class="vp-root" data-vp-root>
        <div class="vp-strip" role="region" aria-label="Practice and Print">
          <div class="vp-tabs" role="group" aria-label="Vocabulary practice modes">
            <button type="button" class="vp-tab" data-vp-tab="flashcard" aria-pressed="${st.tab === "flashcard"}">Flashcards (${flashcards.length})</button>
            <button type="button" class="vp-tab" data-vp-tab="match" aria-pressed="${st.tab === "match"}">Match (${matchData.pairs.length})</button>
            <button type="button" class="vp-tab" data-vp-tab="cloze" aria-pressed="${st.tab === "cloze"}">Context Cloze (${clozeItems.length})</button>
            <button type="button" class="vp-tab" data-vp-tab="cognate" aria-pressed="${st.tab === "cognate"}">Cognate Detective (${cognateItems.length})</button>
            <button type="button" class="vp-tab" data-vp-tab="family" aria-pressed="${st.tab === "family"}">Word Family (${familyItems.length})</button>
          </div>
          <button type="button" class="vp-print-btn" data-vp-print-sheet>Print Card Sheet</button>
        </div>
        ${st.tab === "flashcard" ? renderFlashcardTab() : ""}
        ${st.tab === "match" ? renderMatchTab() : ""}
        ${st.tab === "cloze" ? renderClozeTab() : ""}
        ${st.tab === "cognate" ? renderCognateTab() : ""}
        ${st.tab === "family" ? renderFamilyTab() : ""}
        ${provState === "reviewed" ? "" : `<p class="vp-notice">${esc(DRAFT_NOTICE)}</p>`}
      </div>
    `;
  }

  if (!container.dataset.vpBound) {
    container.dataset.vpBound = "1";
    container.addEventListener("click", (e) => {
      const s = practiceState.get(container);
      if (!s) return;

      const tabBtn = e.target.closest("[data-vp-tab]");
      if (tabBtn) {
        s.tab = tabBtn.dataset.vpTab;
        onTelemetry?.("vocab_practice");
        draw();
        return;
      }

      if (e.target.closest("[data-vp-card-flip]")) {
        s.flipped = !s.flipped;
        draw();
        return;
      }
      if (e.target.closest("[data-vp-card-prev]")) {
        s.cardIdx = Math.max(0, s.cardIdx - 1);
        s.flipped = false;
        draw();
        return;
      }
      if (e.target.closest("[data-vp-card-next]")) {
        s.cardIdx = Math.min(flashcards.length - 1, s.cardIdx + 1);
        s.flipped = false;
        draw();
        return;
      }

      if (e.target.closest("[data-vp-match-reset]")) {
        s.selectedWord = null;
        s.matchedWords = new Set();
        s.matchFeedback = "";
        draw();
        return;
      }
      const mWord = e.target.closest("[data-vp-match-word]");
      if (mWord) {
        s.selectedWord = mWord.dataset.vpMatchWord;
        s.matchFeedback = `Selected "${s.selectedWord}". Choose its matching definition.`;
        draw();
        return;
      }
      const mDef = e.target.closest("[data-vp-match-def]");
      if (mDef) {
        if (!s.selectedWord) {
          s.matchFeedback = "Select a term on the left first.";
        } else if (mDef.dataset.vpMatchDef === s.selectedWord) {
          s.matchedWords.add(s.selectedWord);
          s.matchFeedback = `Matched "${s.selectedWord}" accurately!`;
          s.selectedWord = null;
        } else {
          s.matchFeedback = `Not a match for "${s.selectedWord}". Try another definition.`;
        }
        draw();
        return;
      }

      const clozeBtn = e.target.closest("[data-vp-cloze-idx]");
      if (clozeBtn) {
        s.clozeAnswers[Number(clozeBtn.dataset.vpClozeIdx)] = clozeBtn.dataset.vpClozeVal;
        draw();
        return;
      }

      const cogBtn = e.target.closest("[data-vp-cog-idx]");
      if (cogBtn) {
        s.cognateAnswers[Number(cogBtn.dataset.vpCogIdx)] = cogBtn.dataset.vpCogVal;
        draw();
        return;
      }

      if (e.target.closest("[data-vp-print-sheet]")) {
        openPrintableVocabSheet(unit, terms, {
          wida,
          draftNotice: DRAFT_NOTICE,
          provenanceState: provState,
        });
        onTelemetry?.("vocab_print");
      }
    });
  }

  draw();
}
