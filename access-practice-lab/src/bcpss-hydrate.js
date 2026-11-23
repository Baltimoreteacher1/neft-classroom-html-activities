// Live Neon Lab Hydration for BCPSS K–8 Curriculum & Language Bridge.
// Zero side effects unless ?bcpssUnit=<unitId> is present in the URL query string.

const unitCache = new Map();

const WIDA_LABELS = {
  "1_2": "WIDA Levels 1–2",
  "3_4": "WIDA Levels 3–4",
  "5_6": "WIDA Levels 5–6",
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

function extractScaffold(scaffoldsRaw, wida) {
  const parsed = safeParseJson(scaffoldsRaw, {}) || {};
  const tier = parsed[`level_${wida}`] || parsed[wida] || parsed[`levels_${wida}`] || {};
  const frames = Array.isArray(tier.frames)
    ? tier.frames
    : Array.isArray(tier.sentence_frames)
      ? tier.sentence_frames
      : Array.isArray(tier)
        ? tier
        : [];
  const wordBank = Array.isArray(tier.word_bank)
    ? tier.word_bank
    : Array.isArray(tier.wordBank)
      ? tier.wordBank
      : Array.isArray(parsed.word_bank)
        ? parsed.word_bank
        : [];
  return { frames, wordBank };
}

function normalizeVocab(raw) {
  const parsed = safeParseJson(raw, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (typeof item === "string") return { word: item, hint: "" };
      if (!item || typeof item !== "object") return null;
      return {
        word: item.word || item.term || "",
        hint: item.cognate_hint || item.cognate || item.es_cognate || "",
      };
    })
    .filter((v) => v && v.word);
}

function ensureStyles() {
  if (document.getElementById("bcpss-hydrate-styles")) return;
  const style = document.createElement("style");
  style.id = "bcpss-hydrate-styles";
  style.textContent = `
    .bcpss-hydrate-wrap {
      margin: 0 0 1.5rem;
      display: grid;
      gap: 0.9rem;
    }
    .bcpss-align-banner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.65rem 1rem;
      padding: 0.7rem 1rem;
      border: 1.5px solid var(--ocean-900, #075568);
      border-left: 6px solid var(--ocean-900, #075568);
      border-radius: 6px;
      background: #eaf5f3;
      color: var(--ink, #161614);
      font-size: 0.95rem;
    }
    .bcpss-align-banner strong {
      color: var(--ocean-900, #075568);
    }
    .bcpss-exit-btn {
      min-height: 2.75rem;
      padding: 0.35rem 0.85rem;
      border: 1.5px solid var(--ink, #161614);
      border-radius: 6px;
      background: var(--surface, #ffffff);
      color: var(--ink, #161614);
      font: 700 0.875rem var(--font, system-ui, sans-serif);
      cursor: pointer;
    }
    .bcpss-exit-btn:hover {
      background: var(--surface-2, #e5e3dd);
    }
    .bcpss-practice-panel {
      border: 1.5px solid var(--ink, #161614);
      border-radius: 8px;
      background: var(--surface, #ffffff);
      padding: 1.15rem 1.25rem;
      box-shadow: -5px 5px 0 0 var(--sage-200, #d0e3cd), -5px 5px 0 1.5px var(--ink, #161614);
      display: grid;
      gap: 0.95rem;
    }
    .bcpss-panel-head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.5rem 1rem;
    }
    .bcpss-panel-head h2 {
      margin: 0;
      font: 600 1.3rem/1.2 var(--font-display, Georgia, serif);
      color: var(--ink, #161614);
    }
    .bcpss-wida-pill {
      display: inline-block;
      padding: 0.18rem 0.6rem;
      border-radius: 999px;
      background: var(--ocean-900, #075568);
      color: #ffffff;
      font-size: 0.8rem;
      font-weight: 700;
    }
    .bcpss-prompt-box {
      padding: 0.8rem 1rem;
      border-left: 4px solid var(--ocean-900, #075568);
      background: #f5f9f8;
      border-radius: 4px;
      font-size: 1.02rem;
    }
    .bcpss-chips-group {
      display: grid;
      gap: 0.45rem;
    }
    .bcpss-chips-label {
      margin: 0;
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--ink-3, #575650);
    }
    .bcpss-chips-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
    }
    .bcpss-insert-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      min-height: 2.75rem;
      padding: 0.35rem 0.8rem;
      border: 1.5px solid var(--ink, #161614);
      border-radius: 999px;
      background: var(--surface, #ffffff);
      color: var(--ink, #161614);
      font: 700 0.9rem/1.25 var(--font, system-ui, sans-serif);
      text-align: left;
      cursor: pointer;
    }
    .bcpss-insert-chip:hover {
      background: #e0eef0;
      border-color: var(--ocean-900, #075568);
    }
    .bcpss-insert-chip.is-word {
      background: #f6faf7;
      border-color: var(--sage-900, #264e48);
      color: var(--sage-900, #264e48);
    }
    .bcpss-insert-chip.is-word:hover {
      background: var(--sage-200, #d0e3cd);
    }
    .bcpss-cognate-hint {
      font-weight: 400;
      font-size: 0.82rem;
      color: var(--ink-2, #3a3a36);
    }
    .bcpss-response-box {
      width: 100%;
      min-height: 6.5rem;
      padding: 0.7rem 0.85rem;
      border: 1.5px solid var(--ink, #161614);
      border-radius: 6px;
      font: 400 1.02rem/1.5 var(--font, system-ui, sans-serif);
      color: var(--ink, #161614);
      background: var(--surface, #ffffff);
      resize: vertical;
    }
    .bcpss-actions-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
      align-items: center;
    }
    .bcpss-action-btn {
      min-height: 2.75rem;
      padding: 0.45rem 0.95rem;
      border: 1.5px solid var(--ink, #161614);
      border-radius: 6px;
      background: var(--surface, #ffffff);
      color: var(--ink, #161614);
      font: 700 0.9rem var(--font, system-ui, sans-serif);
      cursor: pointer;
    }
    .bcpss-action-btn.is-primary {
      background: var(--ocean-900, #075568);
      color: #ffffff;
    }
    .bcpss-feedback {
      margin: 0;
      padding: 0.65rem 0.85rem;
      border-radius: 6px;
      border: 1px solid var(--sage-900, #264e48);
      background: #edf7ef;
      color: var(--sage-900, #264e48);
      font-size: 0.94rem;
      font-weight: 700;
    }
    .bcpss-hydrate-wrap :focus-visible {
      outline: 3px solid var(--focus, #0f766e);
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(style);
}

async function fetchUnitDetail(unitId) {
  if (unitCache.has(unitId)) return unitCache.get(unitId);
  const res = await fetch(`/api/bcpss/units/${encodeURIComponent(unitId)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  unitCache.set(unitId, data);
  return data;
}

function insertAtCursor(textarea, snippet) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  const needsSpace = before.length > 0 && !/\s$/.test(before);
  const text = (needsSpace ? " " : "") + snippet;
  textarea.value = before + text + after;
  const nextPos = start + text.length;
  textarea.focus();
  textarea.setSelectionRange(nextPos, nextPos);
}

export async function maybeHydrateBcpssLab(rootEl) {
  if (!rootEl) return;
  const params = new URLSearchParams(window.location.search);
  const bcpssUnit = params.get("bcpssUnit");
  if (!bcpssUnit) return;

  const activityId = params.get("activity") || "";
  const widaParam = params.get("wida") || "3_4";
  const wida = WIDA_LABELS[widaParam] ? widaParam : "3_4";

  // Remove any stale hydration wrapper before re-injecting
  rootEl.querySelector(".bcpss-hydrate-wrap")?.remove();

  let detail;
  try {
    detail = await fetchUnitDetail(bcpssUnit);
  } catch {
    return;
  }
  if (!detail?.unit || !rootEl.isConnected) return;

  // Verify the URL still has the same bcpssUnit after async fetch
  if (new URLSearchParams(window.location.search).get("bcpssUnit") !== bcpssUnit) return;

  ensureStyles();

  const u = detail.unit;
  const conn = detail.connections?.[0] || {};
  const bp = conn.blueprint || {};
  const activities = Array.isArray(detail.activities) ? detail.activities : [];
  const selectedActivity =
    activities.find((a) => String(a.id) === String(activityId)) || activities[0] || null;
  const scaffold = extractScaffold(bp.scaffolds_json, wida);
  const vocab = normalizeVocab(conn.tier2_tier3_vocab);
  const frameStarters = scaffold.frames.length
    ? scaffold.frames
    : conn.unit_example_frame
      ? [conn.unit_example_frame]
      : [];

  // Merge word bank and vocab hints without duplicates
  const seenWords = new Set();
  const wordChips = [];
  for (const v of vocab) {
    const key = v.word.toLowerCase();
    if (!seenWords.has(key)) {
      seenWords.add(key);
      wordChips.push(v);
    }
  }
  for (const w of scaffold.wordBank) {
    const key = String(w).toLowerCase();
    if (!seenWords.has(key)) {
      seenWords.add(key);
      wordChips.push({ word: String(w), hint: "" });
    }
  }

  const gradeText = String(u.grade) === "K" ? "Kindergarten" : `Grade ${u.grade}`;
  const wrap = document.createElement("section");
  wrap.className = "bcpss-hydrate-wrap";
  wrap.setAttribute("aria-label", "BCPSS Aligned Practice");

  wrap.innerHTML = `
    <div class="bcpss-align-banner" role="region" aria-label="BCPSS curriculum alignment">
      <div>
        <strong>Aligned to BCPSS ${esc(gradeText)} ${esc(u.curriculum_name || u.subject)}</strong>
        — Unit ${esc(u.unit_number)}: ${esc(u.unit_title)}
      </div>
      <button type="button" class="bcpss-exit-btn" data-bcpss-exit>Exit BCPSS View</button>
    </div>

    <div class="bcpss-practice-panel">
      <div class="bcpss-panel-head">
        <h2>${esc(selectedActivity ? selectedActivity.title : `Unit ${u.unit_number} Language Practice`)}</h2>
        <span class="bcpss-wida-pill">${esc(WIDA_LABELS[wida])}</span>
      </div>

      ${
        selectedActivity?.student_prompt
          ? `<div class="bcpss-prompt-box" data-bcpss-prompt>${esc(selectedActivity.student_prompt)}</div>`
          : ""
      }

      ${
        frameStarters.length
          ? `<div class="bcpss-chips-group">
              <p class="bcpss-chips-label">Sentence Frame Starters (click to insert)</p>
              <div class="bcpss-chips-row">
                ${frameStarters
                  .map(
                    (frame) =>
                      `<button type="button" class="bcpss-insert-chip" data-bcpss-insert="${esc(frame)}">${esc(frame)}</button>`,
                  )
                  .join("")}
              </div>
            </div>`
          : ""
      }

      ${
        wordChips.length
          ? `<div class="bcpss-chips-group">
              <p class="bcpss-chips-label">Academic Word Bank &amp; Cognates (click to insert)</p>
              <div class="bcpss-chips-row">
                ${wordChips
                  .map(
                    (w) =>
                      `<button type="button" class="bcpss-insert-chip is-word" data-bcpss-insert="${esc(w.word)}">
                        <span>${esc(w.word)}</span>
                        ${w.hint ? `<span class="bcpss-cognate-hint">(${esc(w.hint)})</span>` : ""}
                      </button>`,
                  )
                  .join("")}
              </div>
            </div>`
          : ""
      }

      <div class="bcpss-chips-group">
        <label class="bcpss-chips-label" for="bcpssStudentResponse">Your Response</label>
        <textarea
          id="bcpssStudentResponse"
          class="bcpss-response-box"
          placeholder="Click a sentence frame or word chip above, or type your own response here…"
        ></textarea>
      </div>

      <div class="bcpss-actions-row">
        <button type="button" class="bcpss-action-btn" data-bcpss-read-aloud>Read Aloud</button>
        <button type="button" class="bcpss-action-btn is-primary" data-bcpss-check>Check Response</button>
        <button type="button" class="bcpss-action-btn" data-bcpss-copy>Copy Response</button>
      </div>
      <p class="bcpss-feedback" data-bcpss-feedback role="status" hidden></p>
    </div>
  `;

  rootEl.prepend(wrap);

  const textarea = wrap.querySelector("#bcpssStudentResponse");
  const feedbackEl = wrap.querySelector("[data-bcpss-feedback]");

  wrap.addEventListener("click", async (e) => {
    if (e.target.closest("[data-bcpss-exit]")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("bcpssUnit");
      url.searchParams.delete("activity");
      url.searchParams.delete("wida");
      history.replaceState(history.state, "", url.pathname + url.search + url.hash);
      wrap.remove();
      return;
    }

    const chip = e.target.closest("[data-bcpss-insert]");
    if (chip && textarea) {
      insertAtCursor(textarea, chip.dataset.bcpssInsert || "");
      return;
    }

    if (e.target.closest("[data-bcpss-read-aloud]")) {
      const promptText = selectedActivity?.student_prompt || "";
      const studentText = textarea?.value.trim() || "";
      const toSpeak = studentText || promptText;
      if (toSpeak && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(toSpeak);
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
      }
      return;
    }

    if (e.target.closest("[data-bcpss-check]") && textarea && feedbackEl) {
      const text = textarea.value.trim();
      if (!text) {
        feedbackEl.hidden = false;
        feedbackEl.textContent = "Try clicking a sentence frame starter above to begin your response.";
        return;
      }
      const lower = text.toLowerCase();
      const usedWords = wordChips.filter((w) => lower.includes(w.word.toLowerCase())).map((w) => w.word);
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      feedbackEl.hidden = false;
      if (usedWords.length) {
        feedbackEl.textContent = `Great academic language! You wrote ${wordCount} words and included: ${usedWords.join(", ")}.`;
      } else {
        feedbackEl.textContent = `Good start (${wordCount} words). Try adding 1–2 academic words from the word bank above to strengthen your explanation.`;
      }
      return;
    }

    const copyBtn = e.target.closest("[data-bcpss-copy]");
    if (copyBtn && textarea) {
      const text = textarea.value.trim();
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        const prev = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = prev;
        }, 1500);
      } catch {
        textarea.select();
        document.execCommand("copy");
      }
    }
  });
}
