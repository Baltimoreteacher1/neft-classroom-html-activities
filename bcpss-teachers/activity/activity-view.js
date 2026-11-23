// BCPSS Dedicated Activity Runner / Viewer
// Distraction-free, WCAG 2.1 AA student & teacher runner for 3- and 5-activity units.

import { keepView } from "../keep-view.js";

const WIDA_TIERS = [
  { key: "1_2", label: "Levels 1–2", short: "Entering / Emerging" },
  { key: "3_4", label: "Levels 3–4", short: "Developing / Expanding" },
  { key: "5_6", label: "Levels 5–6", short: "Bridging / Reaching" },
];

const COMMON_ACADEMIC_CONNECTORS = [
  "because",
  "therefore",
  "however",
  "although",
  "while",
  "since",
  "for example",
  "for instance",
  "as a result",
  "in addition",
  "according to",
  "in contrast",
  "similarly",
  "consequently",
  "furthermore",
  "first",
  "next",
  "finally",
  "shows that",
  "proves that",
  "explains why",
  "causes",
  "leads to",
  "compared to",
  "whereas",
  "evidence",
  "claim",
  "reason",
  "strategy",
  "pattern",
];

const DEFAULT_TALK_MOVES = [
  { label: "Build On", stem: "I want to add onto your idea about ___ because ___." },
  { label: "Clarify", stem: "Could you explain what you mean when you say ___?" },
  { label: "Cite Evidence", stem: "In the text or model, I noticed ___ which shows ___." },
  { label: "Paraphrase", stem: "So if I understand you correctly, you are saying ___." },
];

const unitCache = new Map();

const state = {
  unitId: "",
  activityId: "",
  wida: "3_4",
  mode: "student",
  detail: null,
  largeText: false,
  highContrast: false,
  // Interactive workspace state (per activity session)
  responseText: "",
  flashcardIndex: 0,
  flashcardFlipped: false,
  clozeSelections: {},
  checkedMoves: {},
  recorder: {
    mediaRecorder: null,
    stream: null,
    chunks: [],
    audioUrl: "",
    isRecording: false,
    status: "",
  },
};

/** The API returns blueprint fields flat on each connection (no nested `blueprint`). */
function blueprintOf(conn) {
  if (!conn) return {};
  if (conn.blueprint && typeof conn.blueprint === "object" && conn.blueprint.scaffolds_json) return conn.blueprint;
  return {
    ...(conn.blueprint || {}),
    id: conn.blueprint_id,
    wida_klu: conn.wida_klu,
    move_name: conn.move_name,
    syntax_pattern: conn.syntax_pattern,
    scaffolds_json: conn.scaffolds_json,
  };
}

function $(sel, root = document) {
  return root.querySelector(sel);
}

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

function announce(msg) {
  const el = $("#avLiveAnnouncer");
  if (!el) return;
  el.textContent = "";
  window.setTimeout(() => {
    el.textContent = msg;
  }, 30);
}

function gradeLabel(grade) {
  return String(grade) === "K" ? "Kindergarten" : `Grade ${grade}`;
}

function widaLabel(tier) {
  return WIDA_TIERS.find((t) => t.key === tier)?.label || "Levels 3–4";
}

function resolveLabRoute(route) {
  const raw = String(route || "/sentences").trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/access-practice-lab/")) return raw;
  if (raw.startsWith("/")) return `/access-practice-lab${raw}`;
  return `/access-practice-lab/${raw}`;
}

function readComfortPrefs() {
  try {
    state.largeText = window.localStorage.getItem("av_large_text") === "1";
    state.highContrast = window.localStorage.getItem("av_high_contrast") === "1";
  } catch {
    state.largeText = false;
    state.highContrast = false;
  }
}

function applyComfortPrefs() {
  document.documentElement.classList.toggle("is-large-text", state.largeText);
  document.documentElement.classList.toggle("is-high-contrast", state.highContrast);
  const ltBtn = $("#largeTextBtn");
  const hcBtn = $("#highContrastBtn");
  if (ltBtn) ltBtn.setAttribute("aria-pressed", String(state.largeText));
  if (hcBtn) hcBtn.setAttribute("aria-pressed", String(state.highContrast));
}

function readUrlState() {
  const params = new URLSearchParams(window.location.search);
  const unit = (params.get("unit") || params.get("unitId") || "").trim();
  const activity = (params.get("activity") || "").trim();
  const widaRaw = (params.get("wida") || "3_4").trim();
  const modeRaw = (params.get("mode") || "student").trim().toLowerCase();

  state.unitId = unit;
  state.activityId = activity;
  state.wida = WIDA_TIERS.some((t) => t.key === widaRaw) ? widaRaw : "3_4";
  state.mode = modeRaw === "teacher" ? "teacher" : "student";
}

function syncUrl(replace = false) {
  const url = new URL(window.location.href);
  if (state.unitId) url.searchParams.set("unit", state.unitId);
  if (state.activityId) url.searchParams.set("activity", state.activityId);
  else url.searchParams.delete("activity");
  url.searchParams.set("wida", state.wida);
  url.searchParams.set("mode", state.mode);
  const next = url.pathname + url.search + url.hash;
  if (replace) {
    window.history.replaceState(null, "", next);
  } else {
    window.history.pushState(null, "", next);
  }
}

function syncTopBarControls() {
  for (const btn of document.querySelectorAll("[data-mode-btn]")) {
    const active = btn.dataset.modeBtn === state.mode;
    btn.setAttribute("aria-pressed", String(active));
  }
  for (const btn of document.querySelectorAll("[data-wida-btn]")) {
    const active = btn.dataset.widaBtn === state.wida;
    btn.setAttribute("aria-pressed", String(active));
  }

  const backLink = $("#backToUnitLink");
  const u = state.detail?.unit;
  if (backLink) {
    if (u) {
      const params = new URLSearchParams({
        grade: String(u.grade ?? ""),
        subject: String(u.subject ?? ""),
        unitId: String(u.id ?? state.unitId),
        wida: state.wida,
        tab: "activities",
      });
      backLink.href = `/bcpss-teachers?${params.toString()}`;
    } else {
      backLink.href = `/bcpss-teachers?unitId=${encodeURIComponent(state.unitId)}&wida=${encodeURIComponent(state.wida)}&tab=activities`;
    }
  }
}

async function fetchUnitDetail(unitId) {
  if (unitCache.has(unitId)) return unitCache.get(unitId);
  const res = await fetch(`/api/bcpss/units/${encodeURIComponent(unitId)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Could not load unit "${unitId}" (HTTP ${res.status}).`);
  }
  const data = await res.json();
  unitCache.set(unitId, data);
  return data;
}

function extractScaffoldForTier(scaffoldsRaw, tierKey) {
  const parsed = safeParseJson(scaffoldsRaw, {}) || {};
  const tierObj =
    parsed[`level_${tierKey}`] ||
    parsed[tierKey] ||
    parsed[`levels_${tierKey}`] ||
    parsed[`L${tierKey}`] ||
    {};
  const frames = Array.isArray(tierObj.frames)
    ? tierObj.frames
    : Array.isArray(tierObj.sentence_frames)
      ? tierObj.sentence_frames
      : Array.isArray(tierObj)
        ? tierObj
        : [];
  const wordBank = Array.isArray(tierObj.word_bank)
    ? tierObj.word_bank
    : Array.isArray(tierObj.wordBank)
      ? tierObj.wordBank
      : Array.isArray(parsed.word_bank)
        ? parsed.word_bank
        : [];
  return {
    frames: frames.map((f) => String(f || "").trim()).filter(Boolean),
    wordBank: wordBank.map((w) => String(w || "").trim()).filter(Boolean),
  };
}

function normalizeVocab(raw) {
  const parsed = safeParseJson(raw, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (typeof item === "string") {
        return { word: item.trim(), tier: "Tier 2", definition: "", cognate: "" };
      }
      if (!item || typeof item !== "object") return null;
      const word = String(item.word || item.term || "").trim();
      const definition = String(
        item.student_friendly_def || item.kid_def || item.definition || item.note || "",
      ).trim();
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
      return { word, tier, definition, cognate };
    })
    .filter((v) => v?.word);
}

function deterministicShuffle(list, seedStr) {
  const arr = [...list];
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  for (let i = arr.length - 1; i > 0; i--) {
    hash ^= hash << 13;
    hash ^= hash >>> 17;
    hash ^= hash << 5;
    const j = Math.abs(hash) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeClozeItems(raw, vocab) {
  const parsed = safeParseJson(raw, []);
  if (Array.isArray(parsed) && parsed.length) {
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const sentence = String(item.sentence_with_blank || item.sentence || "").trim();
        const answer = String(item.answer || "").trim();
        if (!sentence || !answer) return null;
        const hint = String(
          item.hint || "Re-read the sentence and look for the academic word that fits the meaning.",
        ).trim();
        const distractors = Array.isArray(item.distractor_pool)
          ? item.distractor_pool.map((d) => String(d || "").trim()).filter(Boolean)
          : [];
        const optionsSet = new Set([answer, ...distractors]);
        for (const v of vocab) {
          if (optionsSet.size >= 4) break;
          if (v.word) optionsSet.add(v.word);
        }
        return {
          sentence,
          answer,
          hint,
          options: deterministicShuffle(Array.from(optionsSet), sentence),
        };
      })
      .filter(Boolean);
  }

  const usable = vocab.filter((v) => v.word && v.definition).slice(0, 3);
  if (usable.length) {
    return usable.map((v) => {
      const distractors = vocab
        .filter((other) => other.word.toLowerCase() !== v.word.toLowerCase())
        .slice(0, 3)
        .map((other) => other.word);
      return {
        sentence: `In this unit, the academic term _____ means: ${v.definition}`,
        answer: v.word,
        hint: v.cognate || `Look for the ${v.tier} term that matches this definition.`,
        options: deterministicShuffle([v.word, ...distractors], v.word + v.definition),
      };
    });
  }
  return [];
}

function normalizePartnerTalk(raw, unit, connection, activity) {
  const parsed = safeParseJson(raw, null);
  if (parsed && typeof parsed === "object" && (parsed.role_a_prompt || parsed.role_b_prompt)) {
    const moves =
      Array.isArray(parsed.talk_moves) && parsed.talk_moves.length
        ? parsed.talk_moves
            .map((m) => ({
              label: String(m?.label || "Talk Move").trim(),
              stem: String(m?.stem || "").trim(),
            }))
            .filter((m) => m.stem)
        : DEFAULT_TALK_MOVES;
    return {
      protocol_name: String(parsed.protocol_name || "Structured Partner Talk").trim(),
      role_a_title: String(parsed.role_a_title || "Partner A · Explainer").trim(),
      role_a_prompt: String(parsed.role_a_prompt || "").trim(),
      role_b_title: String(parsed.role_b_title || "Partner B · Active Listener & Builder").trim(),
      role_b_prompt: String(parsed.role_b_prompt || "").trim(),
      talk_moves: moves,
    };
  }

  const unitLabel = unit ? `Unit ${unit.unit_number}: ${unit.unit_title}` : "this unit";
  const frame = connection?.unit_example_frame || "Use a key sentence frame from this unit.";
  return {
    protocol_name: activity?.title || "Structured Partner Talk",
    role_a_title: "Partner A · Explainer",
    role_a_prompt:
      activity?.student_prompt ||
      `Explain a key idea from ${unitLabel} using one academic vocabulary word and this starter: "${frame}"`,
    role_b_title: "Partner B · Active Listener & Clarifier",
    role_b_prompt:
      "Listen for one academic word and one piece of evidence. Ask a clarifying question, then paraphrase what Partner A explained.",
    talk_moves: DEFAULT_TALK_MOVES,
  };
}

function resolveWorkspaceKind(activity) {
  const domain = String(activity?.domain || "").toLowerCase();
  const type = String(activity?.activity_type || "").toLowerCase();
  const title = String(activity?.title || "").toLowerCase();
  const combined = `${domain} ${type} ${title}`;

  if (
    domain.includes("vocab") ||
    type.includes("vocab") ||
    type.includes("cognate") ||
    type.includes("cloze")
  ) {
    return "vocab";
  }
  if (
    domain.includes("speak") ||
    domain.includes("listen") ||
    domain.includes("oral") ||
    type.includes("partner talk") ||
    type.includes("discourse") ||
    type.includes("speaking") ||
    combined.includes("partner talk")
  ) {
    return "speaking";
  }
  return "writing";
}

function speakText(text, onStatus) {
  const clean = String(text || "").trim();
  if (!clean) {
    onStatus?.("Nothing to read yet. Add or select text first.");
    return;
  }
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onStatus?.("Read Aloud is not available in this browser. Read aloud with a partner or teacher.");
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = "en-US";
    utter.rate = 0.92;
    utter.onend = () => onStatus?.("");
    utter.onerror = () => onStatus?.("Read Aloud stopped. Click Read Aloud to try again.");
    window.speechSynthesis.speak(utter);
    onStatus?.("Reading aloud…");
  } catch {
    onStatus?.("Read Aloud is unavailable right now.");
  }
}

async function copyToClipboard(text, btn, doneLabel = "Copied!") {
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    if (btn) {
      const prev = btn.textContent;
      btn.textContent = doneLabel;
      window.setTimeout(() => {
        btn.textContent = prev;
      }, 1500);
    }
    announce(doneLabel);
    return true;
  } catch {
    return false;
  }
}

function insertAtCursor(textarea, snippet) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  const needsSpace = before.length > 0 && !/\s$/.test(before);
  const text = (needsSpace ? " " : "") + snippet;
  textarea.value = before + text + after;
  state.responseText = textarea.value;
  const nextPos = start + text.length;
  textarea.focus();
  textarea.setSelectionRange(nextPos, nextPos);
}

function extractFrameAnchors(frames, exampleFrame) {
  const anchors = new Set();
  const sources = [...frames, exampleFrame].filter(Boolean);
  for (const raw of sources) {
    const parts = String(raw)
      .split(/_{2,}|\[\.\.\.\]|\[[^\]]+\]|\.\.\./g)
      .map((p) => p.replace(/[^a-zA-Z\s'-]/g, " ").replace(/\s+/g, " ").trim().toLowerCase())
      .filter((p) => p.length >= 4);
    for (const p of parts) {
      const words = p.split(" ").filter(Boolean);
      if (words.length >= 2) anchors.add(words.slice(0, 4).join(" "));
      else if (words.length === 1 && words[0].length >= 5) anchors.add(words[0]);
    }
  }
  return Array.from(anchors);
}

function analyzeAcademicLanguage(text, { frames, exampleFrame, vocabTerms }) {
  const trimmed = String(text || "").trim();
  const lower = trimmed.toLowerCase();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const frameAnchors = extractFrameAnchors(frames, exampleFrame);
  const matchedAnchors = frameAnchors.filter((a) => lower.includes(a));
  const matchedConnectors = COMMON_ACADEMIC_CONNECTORS.filter((c) => {
    const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(trimmed);
  });
  const matchedStructures = Array.from(new Set([...matchedAnchors, ...matchedConnectors])).slice(0, 4);

  const matchedVocab = [];
  const seenLower = new Set();
  for (const term of vocabTerms) {
    const clean = String(term || "").trim();
    const key = clean.toLowerCase();
    if (!clean || seenLower.has(key)) continue;
    seenLower.add(key);
    const stem = key.length > 5 && key.endsWith("s") ? key.slice(0, -1) : key;
    if (lower.includes(key) || (stem.length >= 4 && lower.includes(stem))) {
      matchedVocab.push(clean);
    }
  }

  const startsCapital = /^[A-Z0-9"'(]/.test(trimmed);
  const endsPunct = /[.!?]["')]*$/.test(trimmed);
  const hasCompleteLength = wordCount >= 6;
  const mechanicsOk = startsCapital && endsPunct && hasCompleteLength;

  return {
    wordCount,
    hasStructure: matchedStructures.length > 0,
    matchedStructures,
    hasVocab: matchedVocab.length > 0,
    matchedVocab,
    mechanicsOk,
    startsCapital,
    endsPunct,
    hasCompleteLength,
  };
}

function parseTeacherSteps(raw) {
  const text = String(raw || "").trim();
  if (!text) return [];
  const numbered = text
    .split(/\s*(?=(?:^|\n|\s)(?:Step\s*)?[1-5][.):]\s+)/i)
    .map((s) => s.replace(/^(?:Step\s*)?[1-5][.):]\s*/i, "").trim())
    .filter(Boolean);
  if (numbered.length >= 2) return numbered;
  const lines = text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return lines.length ? lines : [text];
}

function parseMaterials(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((m) => String(m || "").trim()).filter(Boolean);
  const parsed = safeParseJson(raw, null);
  if (Array.isArray(parsed)) return parsed.map((m) => String(m || "").trim()).filter(Boolean);
  return String(raw)
    .split(/[,;•\n]+/)
    .map((m) => m.trim())
    .filter(Boolean);
}

function cleanupRecorder() {
  const rec = state.recorder;
  if (rec.mediaRecorder && rec.mediaRecorder.state !== "inactive") {
    try {
      rec.mediaRecorder.stop();
    } catch {
      // ignore
    }
  }
  if (rec.stream) {
    for (const track of rec.stream.getTracks()) {
      track.stop();
    }
  }
  if (rec.audioUrl) {
    URL.revokeObjectURL(rec.audioUrl);
  }
  state.recorder = {
    mediaRecorder: null,
    stream: null,
    chunks: [],
    audioUrl: "",
    isRecording: false,
    status: "",
  };
}

function resetActivitySessionState() {
  cleanupRecorder();
  if ("speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  state.responseText = "";
  state.flashcardIndex = 0;
  state.flashcardFlipped = false;
  state.clozeSelections = {};
  state.checkedMoves = {};
}

function getSelectedActivity(activities) {
  if (!activities.length) return { activity: null, index: -1 };
  const idx = activities.findIndex((a) => String(a.id) === String(state.activityId));
  if (idx >= 0) return { activity: activities[idx], index: idx };
  return { activity: activities[0], index: 0 };
}

function buildStudentShareUrl(unitId, activityId, wida) {
  const url = new URL("/bcpss-teachers/activity/", window.location.origin);
  url.searchParams.set("unit", unitId);
  if (activityId) url.searchParams.set("activity", activityId);
  url.searchParams.set("wida", wida);
  url.searchParams.set("mode", "student");
  return url.toString();
}

function renderWritingWorkspace({ frameStarters, wordChips }) {
  return `
    <section class="av-workspace" aria-label="Interactive writing workspace">
      <div class="av-workspace-head">
        <h2 class="av-workspace-title">Build Your Academic Response</h2>
        <span class="av-pill">${esc(widaLabel(state.wida))} Support</span>
      </div>

      ${
        frameStarters.length
          ? `<div class="av-chips-group">
              <p class="av-section-label">WIDA Sentence Frame Starters (click to add)</p>
              <div class="av-chips-row">
                ${frameStarters
                  .map(
                    (frame) =>
                      `<button type="button" class="av-chip" data-insert-text="${esc(frame)}">${esc(frame)}</button>`,
                  )
                  .join("")}
              </div>
            </div>`
          : ""
      }

      ${
        wordChips.length
          ? `<div class="av-chips-group">
              <p class="av-section-label">Academic Word Bank &amp; Spanish Cognates (click to add)</p>
              <div class="av-chips-row">
                ${wordChips
                  .map(
                    (w) =>
                      `<button type="button" class="av-chip is-word" data-insert-text="${esc(w.word)}">
                        <span>${esc(w.word)}</span>
                        ${w.cognate ? `<span class="av-chip-cognate">(${esc(w.cognate)})</span>` : ""}
                      </button>`,
                  )
                  .join("")}
              </div>
            </div>`
          : ""
      }

      <div class="av-chips-group">
        <label class="av-section-label" for="avResponseBox">Your Response</label>
        <textarea
          id="avResponseBox"
          class="av-textarea"
          placeholder="Click a sentence frame or word above to begin, or write your own response here…"
        >${esc(state.responseText)}</textarea>
        <div class="av-print-lines" aria-hidden="true">
          <div class="av-print-line"></div>
          <div class="av-print-line"></div>
          <div class="av-print-line"></div>
          <div class="av-print-line"></div>
          <div class="av-print-line"></div>
        </div>
      </div>

      <div class="av-actions-row no-print">
        <button type="button" class="av-btn is-primary" data-check-language>
          Check Academic Language
        </button>
        <button type="button" class="av-btn" data-read-response>
          Read My Response
        </button>
        <button type="button" class="av-btn" data-copy-response>
          Copy Response
        </button>
        <button type="button" class="av-btn" data-clear-response>
          Clear
        </button>
      </div>

      <div id="avCheckOutput" class="av-check-panel no-print" role="status" aria-live="polite" hidden></div>
    </section>
  `;
}

function renderVocabWorkspace({ vocab, clozeItems }) {
  const safeIndex = vocab.length ? Math.min(state.flashcardIndex, vocab.length - 1) : 0;
  const card = vocab[safeIndex] || null;
  const flipped = state.flashcardFlipped;

  const flashcardHtml = card
    ? `
      <div class="av-flashcard-stage">
        <div class="av-workspace-head">
          <h2 class="av-workspace-title">Vocabulary &amp; Spanish Cognate Flashcards</h2>
          <span class="av-pill">Card ${safeIndex + 1} of ${vocab.length}</span>
        </div>

        <button
          type="button"
          class="av-flashcard ${flipped ? "is-flipped" : ""}"
          data-fc-flip
          aria-pressed="${flipped ? "true" : "false"}"
        >
          <div class="av-fc-top">
            <span>${esc(card.tier || "Academic Word")}</span>
            <span>${flipped ? "Definition &amp; Cognate · Click to see term" : "Term · Click to flip"}</span>
          </div>
          ${
            flipped
              ? `
                <p class="av-fc-def">${esc(card.definition || "Use this key academic term to explain ideas in this unit.")}</p>
                ${
                  card.cognate
                    ? `<span class="av-fc-cognate">Spanish Cognate Bridge: ${esc(card.cognate)}</span>`
                    : `<span class="av-fc-cognate">Tip: Say the word aloud and connect it to today's topic.</span>`
                }
              `
              : `<p class="av-fc-term">${esc(card.word)}</p>`
          }
        </button>

        <div class="av-fc-controls no-print">
          <div class="av-actions-row">
            <button type="button" class="av-btn" data-fc-prev ${vocab.length <= 1 ? "disabled" : ""}>
              ← Previous Card
            </button>
            <button type="button" class="av-btn is-primary" data-fc-flip>
              ${flipped ? "Show Term" : "Flip for Meaning"}
            </button>
            <button type="button" class="av-btn" data-fc-next ${vocab.length <= 1 ? "disabled" : ""}>
              Next Card →
            </button>
          </div>
          <button
            type="button"
            class="av-btn is-sage"
            data-read-text="${esc(flipped ? `${card.word}. ${card.definition}` : card.word)}"
          >
            Read Word Aloud
          </button>
        </div>
      </div>
    `
    : `<p class="av-model-note">Use the unit academic vocabulary from your class word wall for this activity.</p>`;

  const clozeHtml = clozeItems.length
    ? `
      <div class="av-chips-group">
        <h3 class="av-workspace-title">Context Cloze Challenge</h3>
        <p class="av-model-note">Choose the academic word that completes each sentence.</p>
        <div class="av-cloze-list">
          ${clozeItems
            .map((item, idx) => {
              const chosen = state.clozeSelections[idx] || "";
              const isCorrect = chosen && chosen.toLowerCase() === item.answer.toLowerCase();
              const blankDisplay = chosen ? esc(chosen) : "________";
              const formattedSentence = esc(item.sentence).replace(
                /_{3,}|\[blank\]/gi,
                `<span class="av-cloze-blank">${blankDisplay}</span>`,
              );
              return `
                <div class="av-cloze-card">
                  <p class="av-cloze-sentence"><strong>${idx + 1}.</strong> ${formattedSentence}</p>
                  <div class="av-cloze-options no-print">
                    ${item.options
                      .map((opt) => {
                        const isPicked = chosen === opt;
                        const cls = isPicked ? (isCorrect ? "is-correct" : "is-try-again") : "";
                        return `<button type="button" class="av-cloze-opt ${cls}" data-cloze-idx="${idx}" data-cloze-opt="${esc(opt)}">${esc(opt)}</button>`;
                      })
                      .join("")}
                  </div>
                  ${
                    chosen
                      ? `<p class="av-cloze-feedback ${isCorrect ? "is-correct" : "is-try-again"}" role="status">
                          ${
                            isCorrect
                              ? `Nice work! "${esc(item.answer)}" fits the meaning of this sentence.`
                              : `Not quite yet—try another word or open the hint below.`
                          }
                        </p>`
                      : ""
                  }
                  <details class="av-hint-details no-print">
                    <summary>Need a hint?</summary>
                    <p style="margin:0.35rem 0 0">${esc(item.hint)}</p>
                  </details>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `
    : "";

  return `
    <section class="av-workspace av-vocab-grid" aria-label="Vocabulary and Cloze workspace">
      ${flashcardHtml}
      ${clozeHtml}
    </section>
  `;
}

function renderSpeakingWorkspace({ partnerTalk, frameStarters }) {
  const rec = state.recorder;
  const supportsRecorder =
    typeof window !== "undefined" &&
    "MediaRecorder" in window &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  return `
    <section class="av-workspace" aria-label="Speaking and Listening workspace">
      <div class="av-workspace-head">
        <h2 class="av-workspace-title">${esc(partnerTalk.protocol_name)}</h2>
        <span class="av-pill">${esc(widaLabel(state.wida))} Partner Support</span>
      </div>

      <div class="av-roles-grid">
        <article class="av-role-card is-role-a">
          <div class="av-prompt-head">
            <h3 class="av-role-title">${esc(partnerTalk.role_a_title)}</h3>
            <button type="button" class="av-btn no-print" data-read-text="${esc(partnerTalk.role_a_prompt)}">
              Read Aloud
            </button>
          </div>
          <p style="margin:0">${esc(partnerTalk.role_a_prompt)}</p>
        </article>

        <article class="av-role-card is-role-b">
          <div class="av-prompt-head">
            <h3 class="av-role-title">${esc(partnerTalk.role_b_title)}</h3>
            <button type="button" class="av-btn no-print" data-read-text="${esc(partnerTalk.role_b_prompt)}">
              Read Aloud
            </button>
          </div>
          <p style="margin:0">${esc(partnerTalk.role_b_prompt)}</p>
        </article>
      </div>

      ${
        frameStarters.length
          ? `<div class="av-chips-group">
              <p class="av-section-label">Helpful Sentence Starters for Your Conversation</p>
              <div class="av-chips-row">
                ${frameStarters
                  .map(
                    (f) =>
                      `<button type="button" class="av-chip" data-read-text="${esc(f)}" title="Click to hear this starter read aloud">${esc(f)}</button>`,
                  )
                  .join("")}
              </div>
            </div>`
          : ""
      }

      <div class="av-chips-group">
        <p class="av-section-label">Academic Talk Moves Checklist (check each move you try)</p>
        <div class="av-moves-list">
          ${partnerTalk.talk_moves
            .map((move, idx) => {
              const checked = Boolean(state.checkedMoves[idx]);
              return `
                <label class="av-move-check">
                  <input type="checkbox" data-talk-move="${idx}" ${checked ? "checked" : ""} />
                  <span>
                    <strong>${esc(move.label)}:</strong> “${esc(move.stem)}”
                  </span>
                </label>
              `;
            })
            .join("")}
        </div>
      </div>

      <div class="av-recorder-box no-print" aria-label="Local voice rehearsal recorder">
        <p class="av-section-label">Private Voice Rehearsal (stays 100% on your device)</p>
        ${
          supportsRecorder
            ? `
              <p class="av-recorder-note">
                Practice saying your answer aloud, listen back, and revise before sharing with your partner. Nothing is uploaded or saved.
              </p>
              <div class="av-actions-row">
                <button
                  type="button"
                  class="av-btn ${rec.isRecording ? "is-recording" : "is-primary"}"
                  data-rec-toggle
                >
                  ${rec.isRecording ? "Stop Recording" : rec.audioUrl ? "Record Again" : "Start Voice Rehearsal"}
                </button>
                ${
                  rec.audioUrl
                    ? `<button type="button" class="av-btn" data-rec-clear>Clear Recording</button>`
                    : ""
                }
              </div>
              ${rec.status ? `<p class="av-audio-status" role="status">${esc(rec.status)}</p>` : ""}
              ${
                rec.audioUrl
                  ? `<audio class="av-audio-player" controls src="${esc(rec.audioUrl)}"></audio>`
                  : ""
              }
            `
            : `<p class="av-recorder-note">Voice recording is not available in this browser. Practice reading your sentence starter aloud twice with your partner!</p>`
        }
      </div>
    </section>
  `;
}

function renderTeacherPanel({ unit, conn, activity, bp }) {
  if (state.mode !== "teacher") return "";

  const steps = parseTeacherSteps(activity.teacher_instructions);
  const materials = parseMaterials(activity.materials);
  const diffRaw = safeParseJson(activity.differentiated_targets, null);
  const exitTicket = safeParseJson(conn?.language_exit_ticket_json, null);

  const targets = WIDA_TIERS.map((tier) => {
    const direct = diffRaw && typeof diffRaw === "object" ? diffRaw[`level_${tier.key}`] || diffRaw[tier.key] : "";
    const scaffold = extractScaffoldForTier(bp?.scaffolds_json, tier.key);
    const fallbackText = scaffold.frames.length
      ? `Target frame: “${scaffold.frames[0]}”`
      : `Support students at ${tier.label} (${tier.short}) with modeling and unit vocabulary.`;
    return {
      key: tier.key,
      label: `${tier.label} · ${tier.short}`,
      text: String(direct || fallbackText).trim(),
    };
  });

  const cfu =
    String(activity.check_for_understanding || "").trim() ||
    (Array.isArray(exitTicket?.look_fors) && exitTicket.look_fors.length
      ? exitTicket.look_fors.join(" · ")
      : typeof exitTicket?.quick_rubric === "string"
        ? exitTicket.quick_rubric
        : "Listen for students using the target connector and at least one Tier 2/3 academic vocabulary word accurately.");

  const labBase = resolveLabRoute(activity.target_lab_route);
  const labUrl = `${labBase}?bcpssUnit=${encodeURIComponent(unit.id)}&activity=${encodeURIComponent(activity.id)}&wida=${encodeURIComponent(state.wida)}`;

  return `
    <section class="av-teacher-panel no-print" aria-label="Teacher Facilitation Panel">
      <div class="av-teacher-head">
        <h2>Teacher Facilitation Guide</h2>
        <div class="av-actions-row">
          <button type="button" class="av-btn is-primary" data-copy-student-link>
            Copy Student Link
          </button>
          <a class="av-btn" href="${esc(labUrl)}">
            Open in Practice Lab ↗
          </a>
        </div>
      </div>

      <div class="av-teacher-grid">
        ${
          steps.length
            ? `<div class="av-teacher-block">
                <p class="av-section-label">3-Step Teacher Script</p>
                <ol class="av-script-list">
                  ${steps.map((s) => `<li>${esc(s)}</li>`).join("")}
                </ol>
              </div>`
            : ""
        }

        <div class="av-teacher-block">
          <p class="av-section-label">Materials &amp; Grouping</p>
          <div class="av-materials-row">
            ${activity.grouping ? `<span class="av-pill is-domain">Grouping: ${esc(activity.grouping)}</span>` : ""}
            ${
              activity.duration_minutes
                ? `<span class="av-pill">Duration: ${esc(activity.duration_minutes)} min</span>`
                : ""
            }
            ${
              activity.prep_time_minutes != null
                ? `<span class="av-pill">Prep: ${esc(activity.prep_time_minutes)} min</span>`
                : ""
            }
            ${
              materials.length
                ? materials.map((m) => `<span class="av-pill">${esc(m)}</span>`).join("")
                : `<span class="av-pill">Student device or printed handout</span>`
            }
          </div>
        </div>

        <div class="av-teacher-block">
          <p class="av-section-label">Differentiated WIDA Targets</p>
          <div class="av-targets-grid">
            ${targets
              .map(
                (t) => `
                  <div class="av-target-card ${t.key === state.wida ? "is-active" : ""}">
                    <span class="av-target-label">${esc(t.label)}</span>
                    <p style="margin:0;font-size:0.93rem">${esc(t.text)}</p>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>

        <div class="av-teacher-block">
          <p class="av-section-label">Check for Understanding Look-For</p>
          <div class="av-cfu-box">${esc(cfu)}</div>
        </div>
      </div>
    </section>
  `;
}

function renderStepper(activities, activeIndex) {
  const nav = $("#activityStepper");
  if (!nav) return;
  if (!activities.length) {
    nav.hidden = true;
    nav.innerHTML = "";
    return;
  }

  nav.hidden = false;
  const prevAct = activeIndex > 0 ? activities[activeIndex - 1] : null;
  const nextAct = activeIndex < activities.length - 1 ? activities[activeIndex + 1] : null;

  nav.innerHTML = `
    <div class="av-stepper-inner">
      <button
        type="button"
        class="av-btn"
        data-goto-activity="${prevAct ? esc(prevAct.id) : ""}"
        ${prevAct ? "" : "disabled"}
      >
        ← Previous Day
      </button>

      <div class="av-stepper-pills" role="group" aria-label="Activities in this unit">
        ${activities
          .map((act, idx) => {
            const label = String(act.day_label || `Day ${act.activity_order || idx + 1}`).trim();
            const isCurrent = idx === activeIndex;
            return `
              <button
                type="button"
                class="av-day-pill"
                data-goto-activity="${esc(act.id)}"
                ${isCurrent ? 'aria-current="step"' : ""}
                title="${esc(act.title || label)}"
              >
                ${esc(label)}
              </button>
            `;
          })
          .join("")}
      </div>

      <button
        type="button"
        class="av-btn"
        data-goto-activity="${nextAct ? esc(nextAct.id) : ""}"
        ${nextAct ? "" : "disabled"}
      >
        Next Day →
      </button>
    </div>
  `;
}

// Flashcard, cloze, mode and level clicks redraw the page in place; keepView holds the reader's place.
function renderActivityPage() {
  keepView($("#activityMain"), drawActivityPage);
}

function drawActivityPage() {
  const main = $("#activityMain");
  const detail = state.detail;
  const unit = detail?.unit;

  syncTopBarControls();

  if (!unit) {
    main.innerHTML = `<div class="av-error" role="alert">Unit not found. Return to the BCPSS Teachers hub to choose a unit.</div>`;
    renderStepper([], -1);
    return;
  }

  const conn = detail.connections?.[0] || {};
  const bp = blueprintOf(conn);
  const activities = Array.isArray(detail.activities) ? detail.activities : [];
  const { activity, index: activeIndex } = getSelectedActivity(activities);

  if (!activity) {
    main.innerHTML = `<div class="av-error" role="alert">No activities are available for this unit yet.</div>`;
    renderStepper([], -1);
    return;
  }

  // Keep state.activityId synchronized if it defaulted to first activity
  if (String(state.activityId) !== String(activity.id)) {
    state.activityId = String(activity.id);
    syncUrl(true);
  }

  const scaffold = extractScaffoldForTier(bp.scaffolds_json, state.wida);
  const vocab = normalizeVocab(conn.tier2_tier3_vocab);
  const frameStarters = scaffold.frames.length
    ? scaffold.frames
    : conn.unit_example_frame
      ? [conn.unit_example_frame]
      : [];

  // Merge vocab + scaffold word bank without duplicates
  const seen = new Set();
  const wordChips = [];
  for (const v of vocab) {
    const key = v.word.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      wordChips.push(v);
    }
  }
  for (const w of scaffold.wordBank) {
    const key = w.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      wordChips.push({ word: w, tier: "Tier 2", definition: "", cognate: "" });
    }
  }

  const dayLabel = String(activity.day_label || `Day ${activity.activity_order || activeIndex + 1}`).trim();
  const domainLabel = String(activity.domain || activity.activity_type || "Academic Language").trim();
  const durationText = activity.duration_minutes ? `${activity.duration_minutes} min` : "";
  const groupingText = String(activity.grouping || "").trim();
  const kluText = String(bp.wida_klu || conn.wida_klu || "").trim();
  const modelExample = String(
    activity.worked_example || activity.mentor_sentence || conn.mentor_sentence || "",
  ).trim();
  const studentPrompt = String(
    activity.student_prompt || `Use today's language frames to explain your thinking for ${unit.unit_title}.`,
  ).trim();

  const kind = resolveWorkspaceKind(activity);
  let workspaceHtml = "";
  if (kind === "vocab") {
    const clozeItems = normalizeClozeItems(conn.interactive_cloze_items, vocab);
    workspaceHtml = renderVocabWorkspace({ vocab, clozeItems });
  } else if (kind === "speaking") {
    const partnerTalk = normalizePartnerTalk(conn.partner_talk_protocol, unit, conn, activity);
    workspaceHtml = renderSpeakingWorkspace({ partnerTalk, frameStarters });
  } else {
    workspaceHtml = renderWritingWorkspace({ frameStarters, wordChips });
  }

  document.title = `${activity.title} · ${gradeLabel(unit.grade)} ${unit.curriculum_name || unit.subject} — EduWonderLab`;
  document.body.dataset.mode = state.mode;
  document.body.dataset.wida = state.wida;

  const tierTargets = safeParseJson(activity.differentiated_targets, null);
  const tierTarget = String(
    (tierTargets && typeof tierTargets === "object" && (tierTargets[`level_${state.wida}`] || tierTargets[state.wida])) || "",
  ).trim();
  const isTeacher = state.mode === "teacher";
  const modeBanner = `
    <div class="av-mode-banner ${isTeacher ? "is-teacher" : "is-student"} no-print" role="status">
      <strong>${isTeacher ? "Teacher View" : "Student View"}</strong>
      <span>${
        isTeacher
          ? `Facilitation guide first, then a preview of exactly what students see at ${esc(widaLabel(state.wida))}.`
          : `Showing the ${esc(widaLabel(state.wida))} version of this activity.`
      }</span>
    </div>`;
  const teacherPanelHtml = renderTeacherPanel({ unit, conn, activity, bp });

  main.innerHTML = `
    ${modeBanner}
    ${isTeacher ? teacherPanelHtml : ""}
    ${isTeacher ? `<p class="av-preview-label no-print">Student preview · ${esc(widaLabel(state.wida))}</p>` : ""}
    <article class="av-card" aria-label="Unit Activity">
      <div class="av-print-student-header print-only">
        <span>Name: __________________________________</span>
        <span>Date: _________________</span>
      </div>

      <header class="av-masthead">
        <p class="av-kicker">
          ${esc(gradeLabel(unit.grade))} · ${esc(unit.curriculum_name || unit.subject)} · Unit ${esc(unit.unit_number)}: ${esc(unit.unit_title)}
        </p>
        <h1 class="av-title">${esc(activity.title)}</h1>
        <div class="av-meta-row">
          <span class="av-pill is-day">${esc(dayLabel)}</span>
          <span class="av-pill is-domain">${esc(domainLabel)}</span>
          ${durationText ? `<span class="av-pill">${esc(durationText)}</span>` : ""}
          ${groupingText ? `<span class="av-pill">${esc(groupingText)}</span>` : ""}
          ${kluText ? `<span class="av-pill is-klu">WIDA: ${esc(kluText)}</span>` : ""}
        </div>
      </header>

      <section class="av-prompt-card" aria-label="Student Prompt">
        <div class="av-prompt-head">
          <p class="av-section-label">Your Task</p>
          <button type="button" class="av-read-btn no-print" data-read-prompt>
            <span aria-hidden="true">🔊</span>
            <span>Read Aloud</span>
          </button>
        </div>
        <p class="av-prompt-text">${esc(studentPrompt)}</p>
        ${
          tierTarget
            ? `<div class="av-tier-target" data-tier="${esc(state.wida)}"><span class="av-tier-target-label">At your support level · ${esc(widaLabel(state.wida))}</span><p>${esc(tierTarget)}</p></div>`
            : ""
        }
        <p id="avPromptAudioStatus" class="av-audio-status no-print" role="status" hidden></p>
      </section>

      ${
        modelExample
          ? `
            <details class="av-model-details">
              <summary>See a Model Example</summary>
              <div class="av-model-body">
                <p class="av-model-note">Notice how this model uses academic language—then write your own ideas in your response.</p>
                <blockquote class="av-model-quote">${esc(modelExample)}</blockquote>
              </div>
            </details>
          `
          : ""
      }

      ${workspaceHtml}
    </article>

  `;

  renderStepper(activities, activeIndex);
  wireWorkspaceEvents({
    unit,
    conn,
    activity,
    frameStarters,
    wordChips,
    vocab,
    studentPrompt,
  });
}

function wireWorkspaceEvents({ unit, conn, activity, frameStarters, wordChips, vocab, studentPrompt }) {
  const main = $("#activityMain");
  const textarea = $("#avResponseBox", main);
  const checkOut = $("#avCheckOutput", main);
  const promptStatus = $("#avPromptAudioStatus", main);

  if (textarea) {
    textarea.addEventListener("input", () => {
      state.responseText = textarea.value;
    });
  }

  main.onclick = async (e) => {
    const readPromptBtn = e.target.closest("[data-read-prompt]");
    if (readPromptBtn) {
      speakText(studentPrompt, (msg) => {
        if (!promptStatus) return;
        promptStatus.hidden = !msg;
        promptStatus.textContent = msg;
      });
      return;
    }

    const readTextBtn = e.target.closest("[data-read-text]");
    if (readTextBtn) {
      speakText(readTextBtn.dataset.readText || "", (msg) => {
        if (msg) announce(msg);
      });
      return;
    }

    const insertBtn = e.target.closest("[data-insert-text]");
    if (insertBtn && textarea) {
      insertAtCursor(textarea, insertBtn.dataset.insertText || "");
      return;
    }

    if (e.target.closest("[data-read-response]") && textarea) {
      const txt = textarea.value.trim();
      speakText(txt || studentPrompt, (msg) => {
        if (msg) announce(msg);
      });
      return;
    }

    const copyRespBtn = e.target.closest("[data-copy-response]");
    if (copyRespBtn && textarea) {
      const txt = textarea.value.trim();
      if (!txt) {
        announce("Write a response first before copying.");
        return;
      }
      await copyToClipboard(txt, copyRespBtn, "Response Copied!");
      return;
    }

    if (e.target.closest("[data-clear-response]") && textarea) {
      textarea.value = "";
      state.responseText = "";
      if (checkOut) {
        checkOut.hidden = true;
        checkOut.innerHTML = "";
      }
      textarea.focus();
      announce("Cleared response box.");
      return;
    }

    if (e.target.closest("[data-check-language]") && textarea && checkOut) {
      const text = textarea.value.trim();
      checkOut.hidden = false;
      if (!text) {
        checkOut.innerHTML = `<p class="av-check-summary">Click a sentence frame starter above or type your first idea to check your academic language.</p>`;
        return;
      }
      const res = analyzeAcademicLanguage(text, {
        frames: frameStarters,
        exampleFrame: conn?.unit_example_frame || "",
        vocabTerms: wordChips.map((w) => w.word),
      });
      const metCount = [res.hasStructure, res.hasVocab, res.mechanicsOk].filter(Boolean).length;
      const summary =
        metCount === 3
          ? `Strong academic language! You wrote ${res.wordCount} words with clear structure, unit vocabulary, and complete sentence mechanics.`
          : `Nice progress (${res.wordCount} words)! Check the tips below to make your academic language even stronger.`;

      checkOut.innerHTML = `
        <p class="av-check-summary">${esc(summary)}</p>
        <ul class="av-check-list">
          <li class="av-check-item ${res.hasStructure ? "is-met" : "is-grow"}">
            <span class="av-check-badge" aria-hidden="true">${res.hasStructure ? "✓" : "+"}</span>
            <span>
              <strong>Target Connector / Frame:</strong>
              ${
                res.hasStructure
                  ? `Used ${esc(res.matchedStructures.join(", "))}.`
                  : "Try adding a connector or sentence starter from the chips above (like because, therefore, or shows that)."
              }
            </span>
          </li>
          <li class="av-check-item ${res.hasVocab ? "is-met" : "is-grow"}">
            <span class="av-check-badge" aria-hidden="true">${res.hasVocab ? "✓" : "+"}</span>
            <span>
              <strong>Academic Vocabulary:</strong>
              ${
                res.hasVocab
                  ? `Included ${esc(res.matchedVocab.join(", "))}.`
                  : "Try adding 1–2 academic words from the Word Bank above."
              }
            </span>
          </li>
          <li class="av-check-item ${res.mechanicsOk ? "is-met" : "is-grow"}">
            <span class="av-check-badge" aria-hidden="true">${res.mechanicsOk ? "✓" : "+"}</span>
            <span>
              <strong>Sentence Mechanics:</strong>
              ${
                res.mechanicsOk
                  ? "Starts with a capital letter, ends with punctuation, and forms a complete thought."
                  : [
                      !res.startsCapital ? "start with a capital letter" : "",
                      !res.endsPunct ? "add ending punctuation (. ! ?)" : "",
                      !res.hasCompleteLength ? "expand into a full sentence" : "",
                    ]
                      .filter(Boolean)
                      .join(", ")
                      .replace(/^./, (c) => `Next step: ${c}.`)
              }
            </span>
          </li>
        </ul>
      `;
      return;
    }

    // Flashcard controls
    if (e.target.closest("[data-fc-flip]")) {
      state.flashcardFlipped = !state.flashcardFlipped;
      renderActivityPage();
      return;
    }
    if (e.target.closest("[data-fc-prev]") && vocab.length > 1) {
      state.flashcardIndex = (state.flashcardIndex - 1 + vocab.length) % vocab.length;
      state.flashcardFlipped = false;
      renderActivityPage();
      return;
    }
    if (e.target.closest("[data-fc-next]") && vocab.length > 1) {
      state.flashcardIndex = (state.flashcardIndex + 1) % vocab.length;
      state.flashcardFlipped = false;
      renderActivityPage();
      return;
    }

    // Cloze selection
    const clozeBtn = e.target.closest("[data-cloze-opt]");
    if (clozeBtn) {
      const idx = Number(clozeBtn.dataset.clozeIdx);
      state.clozeSelections[idx] = clozeBtn.dataset.clozeOpt || "";
      renderActivityPage();
      return;
    }

    // Voice rehearsal recorder
    if (e.target.closest("[data-rec-toggle]")) {
      await toggleVoiceRecorder();
      return;
    }
    if (e.target.closest("[data-rec-clear]")) {
      cleanupRecorder();
      renderActivityPage();
      return;
    }

    // Teacher panel: copy student link
    const copyLinkBtn = e.target.closest("[data-copy-student-link]");
    if (copyLinkBtn) {
      const url = buildStudentShareUrl(unit.id, activity.id, state.wida);
      await copyToClipboard(url, copyLinkBtn, "Student Link Copied!");
    }
  };

  main.onchange = (e) => {
    const moveBox = e.target.closest("[data-talk-move]");
    if (moveBox) {
      state.checkedMoves[Number(moveBox.dataset.talkMove)] = moveBox.checked;
    }
  };
}

async function toggleVoiceRecorder() {
  const rec = state.recorder;
  if (rec.isRecording && rec.mediaRecorder) {
    rec.isRecording = false;
    rec.status = "Finishing recording…";
    try {
      rec.mediaRecorder.stop();
    } catch {
      cleanupRecorder();
      renderActivityPage();
    }
    return;
  }

  try {
    cleanupRecorder();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    state.recorder = {
      mediaRecorder,
      stream,
      chunks,
      audioUrl: "",
      isRecording: true,
      status: "Recording locally… Speak clearly, then click Stop Recording.",
    };

    mediaRecorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };

    mediaRecorder.onstop = () => {
      for (const track of stream.getTracks()) track.stop();
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" });
      const audioUrl = URL.createObjectURL(blob);
      state.recorder = {
        mediaRecorder: null,
        stream: null,
        chunks: [],
        audioUrl,
        isRecording: false,
        status: "Recording ready! Press play below to listen back.",
      };
      renderActivityPage();
    };

    mediaRecorder.start();
    renderActivityPage();
  } catch {
    state.recorder.isRecording = false;
    state.recorder.status =
      "Microphone permission was not granted. You can still rehearse aloud with your partner!";
    renderActivityPage();
  }
}

async function loadAndRender() {
  const main = $("#activityMain");
  main.innerHTML = `<div class="av-loading" role="status">Loading unit activity…</div>`;
  syncTopBarControls();

  // No unit in the link: never guess one. Send the teacher back to choose a grade and content area.
  if (!state.unitId) {
    state.detail = null;
    main.innerHTML = `<div class="av-error" role="status">Choose a unit first. <a href="/bcpss-teachers">Open the BCPSS Teachers hub</a>, pick a grade and content area, then open an activity.</div>`;
    renderStepper([], -1);
    return;
  }

  try {
    state.detail = await fetchUnitDetail(state.unitId);
    renderActivityPage();
  } catch (err) {
    main.innerHTML = `<div class="av-error" role="alert">${esc(err.message)}</div>`;
    renderStepper([], -1);
  }
}

function wireGlobalControls() {
  document.addEventListener("click", (e) => {
    const modeBtn = e.target.closest("[data-mode-btn]");
    if (modeBtn) {
      const nextMode = modeBtn.dataset.modeBtn === "teacher" ? "teacher" : "student";
      if (nextMode !== state.mode) {
        state.mode = nextMode;
        syncUrl();
        renderActivityPage();
        announce(`Switched to ${nextMode === "teacher" ? "Teacher View" : "Student View"}.`);
      }
      return;
    }

    const widaBtn = e.target.closest("[data-wida-btn]");
    if (widaBtn) {
      const nextWida = widaBtn.dataset.widaBtn;
      if (WIDA_TIERS.some((t) => t.key === nextWida) && nextWida !== state.wida) {
        state.wida = nextWida;
        syncUrl();
        renderActivityPage();
        announce(`Switched to WIDA ${widaLabel(nextWida)} supports.`);
      }
      return;
    }

    const gotoBtn = e.target.closest("[data-goto-activity]");
    if (gotoBtn && !gotoBtn.disabled) {
      const nextActId = gotoBtn.dataset.gotoActivity;
      if (nextActId && String(nextActId) !== String(state.activityId)) {
        state.activityId = nextActId;
        resetActivitySessionState();
        syncUrl();
        renderActivityPage();
        $("#activityMain")?.focus({ preventScroll: false });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  });

  $("#largeTextBtn")?.addEventListener("click", () => {
    state.largeText = !state.largeText;
    try {
      window.localStorage.setItem("av_large_text", state.largeText ? "1" : "0");
    } catch {
      // ignore
    }
    applyComfortPrefs();
    announce(state.largeText ? "Larger text enabled." : "Standard text size restored.");
  });

  $("#highContrastBtn")?.addEventListener("click", () => {
    state.highContrast = !state.highContrast;
    try {
      window.localStorage.setItem("av_high_contrast", state.highContrast ? "1" : "0");
    } catch {
      // ignore
    }
    applyComfortPrefs();
    announce(state.highContrast ? "High contrast mode enabled." : "Standard contrast restored.");
  });

  $("#printActivityBtn")?.addEventListener("click", () => {
    window.print();
  });

  window.addEventListener("popstate", () => {
    const prevUnit = state.unitId;
    const prevActivity = state.activityId;
    readUrlState();
    if (state.activityId !== prevActivity) {
      resetActivitySessionState();
    }
    if (state.unitId !== prevUnit) {
      loadAndRender();
    } else {
      renderActivityPage();
    }
  });

  window.addEventListener("beforeunload", () => {
    cleanupRecorder();
  });
}

readComfortPrefs();
applyComfortPrefs();
readUrlState();
wireGlobalControls();
loadAndRender();
