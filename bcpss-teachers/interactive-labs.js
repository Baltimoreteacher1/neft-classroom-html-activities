// BCPSS K–8 Curriculum & Language Bridge — Interactive Language Studio
// 3-Mode Student & Classroom Projection Labs:
//   1. Sentence Architect Studio
//   2. Vocabulary & Cloze Mastery Lab
//   3. Oral Discourse & Partner Talk Studio

import { keepView } from "./keep-view.js";

const WIDA_TIERS = [
  { key: "1_2", label: "Levels 1–2", short: "Entering / Emerging" },
  { key: "3_4", label: "Levels 3–4", short: "Developing / Expanding" },
  { key: "5_6", label: "Levels 5–6", short: "Bridging / Reaching" },
];

const STUDIO_LABS = [
  { key: "architect", label: "1. Academic Language Lab", short: "Build & test sentences" },
  { key: "explorer", label: "2. Visual Concept Explorer", short: "Interactive subject model" },
  { key: "discourse", label: "3. Discourse Studio", short: "Partner exchange & talk" },
  { key: "detective", label: "4. Misconception Detective", short: "Spot & revise error" },
  { key: "quest", label: "5. Learning Quest", short: "Evidence-gated challenge" },
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
  { label: "Cite Evidence", stem: "In the text/problem, I noticed ___ which shows ___." },
  { label: "Paraphrase", stem: "So if I understand you correctly, you are saying ___." },
];

const containerStateMap = new WeakMap();

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

function widaMeta(tierKey) {
  return WIDA_TIERS.find((t) => t.key === tierKey) || WIDA_TIERS[1];
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

function normalizeClozeItems(raw, vocab, connection) {
  const parsed = safeParseJson(raw, []);
  if (Array.isArray(parsed) && parsed.length) {
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const sentence = String(item.sentence_with_blank || item.sentence || "").trim();
        const answer = String(item.answer || "").trim();
        if (!sentence || !answer) return null;
        const hint = String(item.hint || "Re-read the sentence and check which academic term matches the meaning.").trim();
        const distractors = Array.isArray(item.distractor_pool)
          ? item.distractor_pool.map((d) => String(d || "").trim()).filter(Boolean)
          : [];
        const optionsSet = new Set([answer, ...distractors]);
        for (const v of vocab) {
          if (optionsSet.size >= 4) break;
          if (v.word) optionsSet.add(v.word);
        }
        const options = deterministicShuffle(Array.from(optionsSet), sentence);
        return { sentence, answer, hint, options };
      })
      .filter(Boolean);
  }

  // Graceful fallback built from unit vocabulary so Lab 2 is always interactive
  const usable = vocab.filter((v) => v.word && v.definition).slice(0, 3);
  if (usable.length) {
    return usable.map((v) => {
      const distractors = vocab
        .filter((other) => other.word.toLowerCase() !== v.word.toLowerCase())
        .slice(0, 3)
        .map((other) => other.word);
      const options = deterministicShuffle([v.word, ...distractors], v.word + v.definition);
      return {
        sentence: `In this unit, the term _____ means: ${v.definition}`,
        answer: v.word,
        hint: v.cognate || `Look for the ${v.tier} term that matches this definition.`,
        options,
      };
    });
  }

  if (connection?.unit_example_frame) {
    return [];
  }
  return [];
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

function normalizePartnerTalk(raw, unit, connection) {
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
      role_b_title: String(parsed.role_b_title || "Partner B · Questioner & Builder").trim(),
      role_b_prompt: String(parsed.role_b_prompt || "").trim(),
      talk_moves: moves,
    };
  }

  const unitLabel = unit ? `Unit ${unit.unit_number}: ${unit.unit_title}` : "this unit";
  const frame = connection?.unit_example_frame || "Use a key sentence frame from this unit.";
  return {
    protocol_name: "Stronger & Clearer Each Time",
    role_a_title: "Partner A · Idea Builder",
    role_a_prompt: `Explain a key concept from ${unitLabel} using one unit vocabulary term and the target frame: "${frame}"`,
    role_b_title: "Partner B · Active Listener & Clarifier",
    role_b_prompt: "Listen for one academic word and one piece of evidence. Ask a clarifying question, then paraphrase what Partner A explained.",
    talk_moves: DEFAULT_TALK_MOVES,
  };
}

function speakText(text, onStatus) {
  const clean = String(text || "").trim();
  if (!clean) {
    onStatus?.("Type or select a sentence first to hear it read aloud.");
    return false;
  }
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onStatus?.("Read Aloud is not supported in this browser. Read the sentence aloud with your partner.");
    return false;
  }
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = "en-US";
    utter.rate = 0.92;
    utter.onend = () => onStatus?.("");
    utter.onerror = () => onStatus?.("Audio playback was interrupted. Try again or read aloud together.");
    window.speechSynthesis.speak(utter);
    onStatus?.("Reading aloud…");
    return true;
  } catch {
    onStatus?.("Read Aloud is unavailable right now. Try reading aloud with a partner.");
    return false;
  }
}

async function copyText(text, btn, doneLabel = "Copied!") {
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
      setTimeout(() => {
        btn.textContent = prev;
      }, 1400);
    }
    return true;
  } catch {
    return false;
  }
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
      if (words.length >= 2) {
        anchors.add(words.slice(0, 4).join(" "));
      } else if (words.length === 1 && words[0].length >= 5) {
        anchors.add(words[0]);
      }
    }
  }
  return Array.from(anchors);
}

function analyzeAcademicSentence(text, { frames, exampleFrame, vocabTerms }) {
  const trimmed = String(text || "").trim();
  const lower = trimmed.toLowerCase();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  // 1. Target WIDA connector / frame structure
  const frameAnchors = extractFrameAnchors(frames, exampleFrame);
  const matchedAnchors = frameAnchors.filter((a) => lower.includes(a));
  const matchedConnectors = COMMON_ACADEMIC_CONNECTORS.filter((c) => {
    const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(trimmed);
  });
  const matchedStructures = Array.from(new Set([...matchedAnchors, ...matchedConnectors])).slice(0, 4);
  const hasStructure = matchedStructures.length > 0;

  // 2. Tier 2/3 academic vocabulary integrated
  const matchedVocab = [];
  const seenLower = new Set();
  for (const term of vocabTerms) {
    const clean = String(term || "").trim();
    const key = clean.toLowerCase();
    if (!clean || seenLower.has(key)) continue;
    seenLower.add(key);
    const stem = key.length > 5 && key.endsWith("s") ? key.slice(0, -1) : key;
    const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}[a-z]*\\b`, "i").test(trimmed)) {
      matchedVocab.push(clean);
    }
  }
  const hasVocab = matchedVocab.length > 0;

  // 3. Complete academic sentence mechanics
  const startsWithCap = /^[A-Z0-9"“']/.test(trimmed);
  const endsWithPunct = /[.!?]["”']?$/.test(trimmed);
  const hasUnfilledBlank = /_{2,}|\[[^\]]+\]/.test(trimmed);
  const hasEnoughWords = wordCount >= 6;
  const mechanicsReady = startsWithCap && endsWithPunct && hasEnoughWords && !hasUnfilledBlank;

  const mechanicsNotes = [];
  if (!startsWithCap) mechanicsNotes.push("Start with a capital letter.");
  if (!endsWithPunct) mechanicsNotes.push("Add ending punctuation (. ! or ?).");
  if (hasUnfilledBlank) mechanicsNotes.push("Replace any ___ blanks with your own ideas.");
  if (!hasEnoughWords) mechanicsNotes.push("Expand your idea to at least 6 words for a complete academic thought.");

  return {
    wordCount,
    hasStructure,
    matchedStructures,
    hasVocab,
    matchedVocab,
    mechanicsReady,
    mechanicsNotes,
  };
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function stopRecorderResources(studioState) {
  if (!studioState) return;
  if (studioState.recordInterval) {
    clearInterval(studioState.recordInterval);
    studioState.recordInterval = null;
  }
  if (studioState.mediaRecorder && studioState.mediaRecorder.state !== "inactive") {
    try {
      studioState.mediaRecorder.stop();
    } catch {
      // Ignore already-stopped recorder
    }
  }
  if (studioState.mediaStream) {
    for (const track of studioState.mediaStream.getTracks()) {
      track.stop();
    }
    studioState.mediaStream = null;
  }
  if (studioState.audioUrl) {
    URL.revokeObjectURL(studioState.audioUrl);
    studioState.audioUrl = "";
  }
}

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

export function renderInteractiveStudio(
  container,
  { unit, connection, blueprint, wida = "3_4", onTelemetry, onWidaChange } = {},
) {
  if (!container) return;

  // Clean up any previous recorder/audio resources before re-rendering
  const prevState = containerStateMap.get(container);
  const sameUnit = prevState && prevState.unitId === unit?.id;
  if (prevState && !sameUnit) {
    stopRecorderResources(prevState);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }

  if (!unit || !connection) {
    container.innerHTML = `<div class="bh-empty">Select a BCPSS unit above to launch the Interactive Language Studio.</div>`;
    return;
  }

  const bp = blueprint?.scaffolds_json ? blueprint : blueprintOf(connection);
  const scaffold = extractScaffoldForTier(bp.scaffolds_json, wida);
  const vocab = normalizeVocab(connection.tier2_tier3_vocab);
  const clozeItems = normalizeClozeItems(connection.interactive_cloze_items, vocab, connection);
  const partnerTalk = normalizePartnerTalk(connection.partner_talk_protocol, unit, connection);
  const tierInfo = widaMeta(wida);

  // Merge word bank + unit vocab for Sentence Architect chips
  const chipMap = new Map();
  for (const v of vocab) {
    chipMap.set(v.word.toLowerCase(), {
      word: v.word,
      tier: v.tier,
      cognate: v.cognate,
    });
  }
  for (const wb of scaffold.wordBank) {
    if (!chipMap.has(wb.toLowerCase())) {
      chipMap.set(wb.toLowerCase(), { word: wb, tier: "Word Bank", cognate: "" });
    }
  }
  const architectChips = Array.from(chipMap.values());
  const allVocabTerms = architectChips.map((c) => c.word);

  const frames = scaffold.frames.length
    ? scaffold.frames
    : connection.unit_example_frame
      ? [connection.unit_example_frame]
      : ["In this unit, ___ shows that ___ because ___."];

  const studioState = sameUnit
    ? prevState
    : {
        unitId: unit.id,
        activeLab: prevState?.activeLab || "architect",
        sentenceText: "",
        lastCheck: null,
        flippedCards: new Set(),
        clozeSelections: {},
        clozeChecked: false,
        activeSpeaker: "A",
        checkedMoves: new Set(),
        recorderStatus: "idle", // idle | recording | recorded | error
        recorderMessage: "",
        recordSeconds: 0,
        recordInterval: null,
        mediaRecorder: null,
        mediaStream: null,
        audioUrl: "",
        explorerScale: 2,
        explorerLens: 0,
        detectiveChoice: "",
        detectiveRevision: "",
        detectiveFeedback: "",
        questStep: 1,
        questVocabPick: "",
        questReasonPick: "",
        questFinalText: "",
        questFeedback: "",
      };

  containerStateMap.set(container, studioState);

  // Every lab click redraws the whole studio; keepView holds scroll position and keyboard focus.
  function render() {
    keepView(container, drawStudio);
  }

  function drawStudio() {
    const activeLab = studioState.activeLab;

    container.innerHTML = `
      <div class="studio-shell">
        <div class="studio-header">
          <div class="studio-header-copy">
            <span class="studio-kicker">Interactive Language Studio · Unit ${esc(unit.unit_number)}</span>
            <h3>${esc(unit.unit_title)}</h3>
            <p class="studio-subtitle">
              Hands-on academic language practice aligned to <strong>${esc(bp.move_name || "WIDA Academic Language Move")}</strong> · <strong>WIDA ${esc(tierInfo.label)}</strong> (${esc(tierInfo.short)})
            </p>
          </div>
          ${
            typeof onWidaChange === "function"
              ? `<div class="bh-wida-toggle studio-wida-toggle" role="group" aria-label="Studio WIDA Proficiency Level">
                  ${WIDA_TIERS.map(
                    (t) => `
                      <button
                        type="button"
                        class="bh-wida-btn"
                        data-studio-wida="${t.key}"
                        aria-pressed="${wida === t.key ? "true" : "false"}"
                      >
                        ${esc(t.label)}
                      </button>
                    `,
                  ).join("")}
                </div>`
              : ""
          }
        </div>

        <div class="studio-subtabs" role="tablist" aria-label="Interactive Studio Labs">
          ${STUDIO_LABS.map(
            (lab) => `
              <button
                type="button"
                role="tab"
                id="studio-tab-${lab.key}"
                class="studio-subtab"
                data-studio-lab="${lab.key}"
                aria-selected="${activeLab === lab.key ? "true" : "false"}"
                aria-controls="studio-panel-${lab.key}"
                tabindex="${activeLab === lab.key ? "0" : "-1"}"
              >
                <span class="studio-subtab-title">${esc(lab.label)}</span>
                <span class="studio-subtab-sub">${esc(lab.short)}</span>
              </button>
            `,
          ).join("")}
        </div>

        <!-- Lab 1: Academic Language Laboratory -->
        <section
          id="studio-panel-architect"
          class="studio-panel"
          role="tabpanel"
          aria-labelledby="studio-tab-architect"
          ${activeLab === "architect" ? "" : "hidden"}
        >
          ${renderArchitectLab()}
        </section>

        <!-- Lab 2: Visual Concept Explorer -->
        <section
          id="studio-panel-explorer"
          class="studio-panel"
          role="tabpanel"
          aria-labelledby="studio-tab-explorer"
          ${activeLab === "explorer" ? "" : "hidden"}
        >
          ${renderExplorerLab()}
        </section>

        <!-- Lab 3: Discourse Studio -->
        <section
          id="studio-panel-discourse"
          class="studio-panel"
          role="tabpanel"
          aria-labelledby="studio-tab-discourse"
          ${activeLab === "discourse" ? "" : "hidden"}
        >
          ${renderDiscourseLab()}
        </section>

        <!-- Lab 4: Misconception Detective -->
        <section
          id="studio-panel-detective"
          class="studio-panel"
          role="tabpanel"
          aria-labelledby="studio-tab-detective"
          ${activeLab === "detective" ? "" : "hidden"}
        >
          ${renderDetectiveLab()}
        </section>

        <!-- Lab 5: Interactive Learning Quest -->
        <section
          id="studio-panel-quest"
          class="studio-panel"
          role="tabpanel"
          aria-labelledby="studio-tab-quest"
          ${activeLab === "quest" ? "" : "hidden"}
        >
          ${renderQuestLab()}
        </section>
      </div>
    `;

    // Restore textarea value safely without double-escaping
    const composer = container.querySelector("#studioComposer");
    if (composer) {
      composer.value = studioState.sentenceText;
    }
  }

  function renderArchitectLab() {
    const wordCount = studioState.sentenceText.trim()
      ? studioState.sentenceText.trim().split(/\s+/).length
      : 0;
    const check = studioState.lastCheck;

    return `
      <div class="studio-architect-grid">
        <div class="studio-card">
          <div class="studio-card-head">
            <h4>Step 1 · Click a WIDA ${esc(tierInfo.label)} Sentence Frame</h4>
            <span class="bh-muted">Tap a starter to insert it into your composer</span>
          </div>
          <div class="studio-pill-list">
            ${frames
              .map(
                (frame, idx) => `
                  <button
                    type="button"
                    class="studio-frame-pill"
                    data-insert-frame="${idx}"
                  >
                    <span class="studio-pill-plus" aria-hidden="true">+</span>
                    <span>${esc(frame)}</span>
                  </button>
                `,
              )
              .join("")}
          </div>

          <div class="studio-card-head" style="margin-top:1.1rem">
            <h4>Step 2 · Insert Tier 2 / Tier 3 Vocabulary &amp; Cognates</h4>
            <span class="bh-muted">Tap any academic term to place it at your cursor</span>
          </div>
          <div class="studio-word-chips">
            ${
              architectChips.length
                ? architectChips
                    .map(
                      (chip) => `
                        <button
                          type="button"
                          class="studio-vocab-chip"
                          data-insert-word="${esc(chip.word)}"
                          title="${esc(chip.cognate || chip.tier)}"
                        >
                          <span class="studio-vocab-chip-word">${esc(chip.word)}</span>
                          ${chip.cognate ? `<span class="studio-vocab-chip-cog">${esc(chip.cognate)}</span>` : ""}
                        </button>
                      `,
                    )
                    .join("")
                : `<p class="bh-muted">No vocabulary chips listed for this unit.</p>`
            }
          </div>
        </div>

        <div class="studio-card studio-composer-card">
          <div class="studio-card-head">
            <h4>Step 3 · Compose Your Academic Sentence</h4>
            <span id="studioWordCount" class="bh-char-counter">${wordCount} word${wordCount === 1 ? "" : "s"}</span>
          </div>

          <label for="studioComposer" class="visually-hidden">Academic sentence composer</label>
          <textarea
            id="studioComposer"
            class="studio-composer"
            rows="5"
            placeholder="Click a WIDA sentence frame on the left, then replace the blanks with your ideas and academic vocabulary…"
          ></textarea>

          <div class="studio-composer-actions">
            <button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-check-sentence>
              Instant Academic Language Check
            </button>
            <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-read-sentence>
              Read Aloud
            </button>
            <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-copy-sentence>
              Copy Response
            </button>
            <button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-clear-sentence>
              Clear
            </button>
          </div>
          <p id="studioSpeechStatus" class="studio-status-line" role="status" aria-live="polite"></p>

          ${
            check
              ? `
                <div class="studio-check-panel" aria-live="polite">
                  <h5 class="studio-check-title">Formative Language Check</h5>
                  <div class="studio-indicators">
                    <div class="studio-indicator ${check.hasStructure ? "is-strong" : "is-grow"}">
                      <span class="studio-ind-badge">${check.hasStructure ? "Ready" : "Next Step"}</span>
                      <div>
                        <strong>1. Target WIDA Connector / Frame Structure</strong>
                        <p>
                          ${
                            check.hasStructure
                              ? `Nice academic structure! Detected: ${check.matchedStructures.map((s) => `<em>“${esc(s)}”</em>`).join(", ")}.`
                              : `Try starting with one of the WIDA ${esc(tierInfo.label)} frames or adding a connector such as <em>because</em>, <em>therefore</em>, or <em>for example</em>.`
                          }
                        </p>
                      </div>
                    </div>

                    <div class="studio-indicator ${check.hasVocab ? "is-strong" : "is-grow"}">
                      <span class="studio-ind-badge">${check.hasVocab ? "Ready" : "Next Step"}</span>
                      <div>
                        <strong>2. Tier 2 / Tier 3 Academic Vocabulary Integrated</strong>
                        <p>
                          ${
                            check.hasVocab
                              ? `Strong word choice! You integrated: ${check.matchedVocab.map((w) => `<span class="studio-matched-term">${esc(w)}</span>`).join(" ")}`
                              : `Tap 1–2 terms from the Word Bank above (such as ${allVocabTerms.slice(0, 3).map((w) => `<strong>${esc(w)}</strong>`).join(", ")}) to make your response more precise.`
                          }
                        </p>
                      </div>
                    </div>

                    <div class="studio-indicator ${check.mechanicsReady ? "is-strong" : "is-grow"}">
                      <span class="studio-ind-badge">${check.mechanicsReady ? "Ready" : "Next Step"}</span>
                      <div>
                        <strong>3. Complete Academic Sentence Mechanics</strong>
                        <p>
                          ${
                            check.mechanicsReady
                              ? `Complete academic sentence (${check.wordCount} words, capitalized start, ending punctuation).`
                              : esc(check.mechanicsNotes.join(" "))
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              `
              : ""
          }
        </div>
      </div>
    `;
  }

  function renderVocabLab() {
    const allFlipped = vocab.length > 0 && studioState.flippedCards.size === vocab.length;
    return `
      <div class="studio-vocab-lab">
        <section class="studio-card" aria-label="Part A: Interactive Academic Flashcards">
          <div class="studio-card-head">
            <div>
              <h4>Part A · Interactive Academic Flashcards</h4>
              <p class="bh-muted" style="margin:0.15rem 0 0">Click any card or press Enter / Space to flip between term and student-friendly meaning + cognate bridge.</p>
            </div>
            ${
              vocab.length
                ? `<button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-flip-all>
                    ${allFlipped ? "Show All Terms" : "Flip All Cards"}
                  </button>`
                : ""
            }
          </div>

          ${
            vocab.length
              ? `<div class="studio-flashcard-grid">
                  ${vocab
                    .map((v, idx) => {
                      const flipped = studioState.flippedCards.has(idx);
                      return `
                        <div
                          class="studio-flashcard ${flipped ? "is-flipped" : ""}"
                          data-flashcard-idx="${idx}"
                          role="button"
                          tabindex="0"
                          aria-pressed="${flipped ? "true" : "false"}"
                          aria-label="${esc(v.word)} flashcard. ${flipped ? "Showing definition and cognate bridge." : "Press Enter or Space to reveal definition."}"
                        >
                          <div class="studio-flashcard-top">
                            <span class="bh-tier-badge">${esc(v.tier)}</span>
                            <button
                              type="button"
                              class="studio-speak-btn"
                              data-speak-term="${esc(v.word)}"
                              aria-label="Read ${esc(v.word)} aloud"
                              title="Read aloud"
                            >
                              🔊 Read
                            </button>
                          </div>

                          ${
                            !flipped
                              ? `<div class="studio-flashcard-face studio-flashcard-front">
                                  <span class="studio-flashcard-term">${esc(v.word)}</span>
                                  <span class="studio-flashcard-cue">Click or press Space to flip ↻</span>
                                </div>`
                              : `<div class="studio-flashcard-face studio-flashcard-back">
                                  <span class="studio-flashcard-mini-term">${esc(v.word)}</span>
                                  <p class="studio-flashcard-def">${esc(v.definition || "Use this academic term to explain ideas precisely in this unit.")}</p>
                                  ${
                                    v.cognate
                                      ? `<p class="studio-flashcard-cog">${esc(v.cognate)}</p>`
                                      : `<p class="studio-flashcard-cog">Home-Language Bridge: Connect this term to a familiar word or example in your home language.</p>`
                                  }
                                </div>`
                          }
                        </div>
                      `;
                    })
                    .join("")}
                </div>`
              : `<p class="bh-muted">No vocabulary cards recorded for this unit yet.</p>`
          }
        </section>

        <section class="studio-card" aria-label="Part B: Context Cloze Challenge">
          <div class="studio-card-head">
            <div>
              <h4>Part B · Context Cloze Challenge</h4>
              <p class="bh-muted" style="margin:0.15rem 0 0">Choose the academic term that best completes each sentence using the dropdown or word chips.</p>
            </div>
            <div class="studio-cloze-head-actions">
              <button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-check-cloze ${clozeItems.length ? "" : "disabled"}>
                Check Answers
              </button>
              <button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-reset-cloze ${clozeItems.length ? "" : "disabled"}>
                Reset
              </button>
            </div>
          </div>

          ${
            clozeItems.length
              ? `<div class="studio-cloze-list">
                  ${clozeItems
                    .map((item, idx) => {
                      const selected = studioState.clozeSelections[idx] || "";
                      const isCorrect =
                        studioState.clozeChecked &&
                        selected.toLowerCase() === item.answer.toLowerCase();
                      const isWrong = studioState.clozeChecked && !isCorrect;
                      const parts = item.sentence.split(/_{2,}/);
                      const selectHtml = `
                        <select
                          class="studio-cloze-select ${isCorrect ? "is-correct" : isWrong ? "is-incorrect" : ""}"
                          data-cloze-select="${idx}"
                          aria-label="Blank for sentence ${idx + 1}"
                        >
                          <option value="">— choose term —</option>
                          ${item.options
                            .map(
                              (opt) =>
                                `<option value="${esc(opt)}" ${selected === opt ? "selected" : ""}>${esc(opt)}</option>`,
                            )
                            .join("")}
                        </select>
                      `;
                      const renderedSentence =
                        parts.length > 1
                          ? `${esc(parts[0])}${selectHtml}${esc(parts.slice(1).join("_____"))}`
                          : `${esc(item.sentence)} ${selectHtml}`;

                      return `
                        <article class="studio-cloze-item ${isCorrect ? "is-correct" : isWrong ? "is-incorrect" : ""}">
                          <div class="studio-cloze-num">Item ${idx + 1}</div>
                          <p class="studio-cloze-sentence">${renderedSentence}</p>
                          <div class="studio-cloze-chips" role="group" aria-label="Word choices for item ${idx + 1}">
                            ${item.options
                              .map(
                                (opt) => `
                                  <button
                                    type="button"
                                    class="studio-cloze-chip"
                                    data-cloze-chip="${idx}"
                                    data-cloze-value="${esc(opt)}"
                                    aria-pressed="${selected === opt ? "true" : "false"}"
                                  >
                                    ${esc(opt)}
                                  </button>
                                `,
                              )
                              .join("")}
                          </div>
                          ${
                            studioState.clozeChecked
                              ? isCorrect
                                ? `<p class="studio-cloze-feedback is-correct">✓ Strong fit! <strong>${esc(item.answer)}</strong> completes this academic idea.</p>`
                                : `<p class="studio-cloze-feedback is-hint"><strong>Keep going · Hint:</strong> ${esc(item.hint)}</p>`
                              : ""
                          }
                        </article>
                      `;
                    })
                    .join("")}
                </div>`
              : `<p class="bh-muted">No context cloze items available for this unit yet.</p>`
          }
        </section>
      </div>
    `;
  }

  function renderDiscourseLab() {
    const activeA = studioState.activeSpeaker === "A";
    const moves = partnerTalk.talk_moves;
    const practicedCount = studioState.checkedMoves.size;

    return `
      <div class="studio-discourse-grid">
        <section class="studio-card" aria-label="Partner Talk Protocol">
          <div class="studio-card-head">
            <div>
              <span class="bh-klu-pill bh-klu-inform">${esc(partnerTalk.protocol_name)}</span>
              <h4 style="margin-top:0.45rem">Partner Talk Roles</h4>
            </div>
            <div class="studio-speaker-toggle" role="group" aria-label="Highlight active speaker">
              <button
                type="button"
                class="bh-wida-btn"
                data-speaker-role="A"
                aria-pressed="${activeA ? "true" : "false"}"
              >
                Partner A Speaking
              </button>
              <button
                type="button"
                class="bh-wida-btn"
                data-speaker-role="B"
                aria-pressed="${!activeA ? "true" : "false"}"
              >
                Partner B Speaking
              </button>
            </div>
          </div>

          <div class="studio-roles-grid">
            <article class="studio-role-card ${activeA ? "is-active-speaker" : ""}">
              <div class="studio-role-top">
                <span class="studio-role-tag">Role A</span>
                ${activeA ? `<span class="studio-speaking-pill">Active Speaker</span>` : ""}
              </div>
              <h5>${esc(partnerTalk.role_a_title)}</h5>
              <p>${esc(partnerTalk.role_a_prompt)}</p>
            </article>

            <article class="studio-role-card ${!activeA ? "is-active-speaker" : ""}">
              <div class="studio-role-top">
                <span class="studio-role-tag">Role B</span>
                ${!activeA ? `<span class="studio-speaking-pill">Active Speaker</span>` : ""}
              </div>
              <h5>${esc(partnerTalk.role_b_title)}</h5>
              <p>${esc(partnerTalk.role_b_prompt)}</p>
            </article>
          </div>
        </section>

        <div class="bh-two-col">
          <section class="studio-card" aria-label="Academic Talk Moves Checklist">
            <div class="studio-card-head">
              <div>
                <h4>Academic Talk Moves Checklist</h4>
                <span class="bh-muted">${practicedCount} of ${moves.length} moves checked off in conversation</span>
              </div>
              ${
                practicedCount > 0
                  ? `<button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-reset-moves>Reset</button>`
                  : ""
              }
            </div>
            <div class="studio-moves-list">
              ${moves
                .map((m, idx) => {
                  const checked = studioState.checkedMoves.has(idx);
                  return `
                    <label class="studio-move-item ${checked ? "is-checked" : ""}">
                      <input
                        type="checkbox"
                        data-talk-move="${idx}"
                        ${checked ? "checked" : ""}
                      />
                      <span class="studio-move-body">
                        <strong>${esc(m.label)}</strong>
                        <span>${esc(m.stem)}</span>
                      </span>
                    </label>
                  `;
                })
                .join("")}
            </div>
          </section>

          <section class="studio-card" aria-label="Local Voice Rehearsal Recorder">
            <div class="studio-card-head">
              <div>
                <h4>Local Voice Rehearsal Recorder</h4>
                <span class="bh-muted">100% private on this device — zero audio uploaded</span>
              </div>
            </div>

            <p class="studio-recorder-copy">
              Rehearse your Partner A or Partner B response for 30–60 seconds, then listen back to check your clarity and academic vocabulary.
            </p>

            <div class="studio-recorder-controls">
              ${
                studioState.recorderStatus === "recording"
                  ? `
                    <button type="button" class="bh-btn bh-btn-primary bh-btn-sm studio-stop-btn" data-record-stop>
                      ■ Stop Rehearsal (${esc(formatDuration(studioState.recordSeconds))} / 1:00)
                    </button>
                  `
                  : `
                    <button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-record-start>
                      ● ${studioState.audioUrl ? "Record New Rehearsal" : "Start Voice Rehearsal"}
                    </button>
                  `
              }
              ${
                studioState.audioUrl
                  ? `<button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-record-discard>
                      Discard Recording
                    </button>`
                  : ""
              }
            </div>

            ${
              studioState.recorderMessage
                ? `<p class="studio-recorder-status ${studioState.recorderStatus === "error" ? "is-error" : ""}" role="status">${esc(studioState.recorderMessage)}</p>`
                : ""
            }

            ${
              studioState.audioUrl
                ? `<div class="studio-audio-wrap">
                    <audio controls src="${esc(studioState.audioUrl)}" class="studio-audio-player"></audio>
                  </div>`
                : ""
            }
          </section>
        </div>
      </div>
    `;
  }

  function renderExplorerLab() {
    const subj = String(unit.subject || "ELA").toLowerCase();
    const scale = Number(studioState.explorerScale) || 2;
    const lens = Number(studioState.explorerLens) || 0;
    const keyTerms = vocab.slice(0, 3).map((v) => v.word);

    if (subj.includes("math")) {
      const a = 3 * scale;
      const b = 2 * scale;
      return `
        <div class="studio-explorer-grid">
          <div class="studio-card">
            <div class="studio-card-head">
              <h4>Visual Concept Explorer · Math Interactive Model</h4>
              <span class="bh-muted">${esc(unit.unit_title)} · Scale quantities and describe the invariant relationship</span>
            </div>
            <div class="studio-explorer-controls">
              <label for="explorerScaleRange"><strong>Scale Factor:</strong> <span class="wida-code">${scale}x</span></label>
              <input id="explorerScaleRange" type="range" min="1" max="5" step="1" value="${scale}" data-explorer-scale />
              <span class="bh-standard-chip">Part A = ${a}</span>
              <span class="bh-standard-chip">Part B = ${b}</span>
              <span class="bh-standard-chip">Ratio = ${a} : ${b} (equivalent to 3 : 2)</span>
            </div>
            <div class="vs-svg-frame" style="margin-top:0.75rem">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 140" width="460" height="140" role="img" style="background:#ffffff">
                <title>Interactive Math ratio tape diagram scaled by ${scale}</title>
                <rect x="0" y="0" width="460" height="140" fill="#ffffff"/>
                <text x="16" y="24" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="12" font-weight="700" fill="#1e3a5f">SCALED RATIO MODEL (${scale}x) · ${esc(unit.unit_title)}</text>
                <text x="16" y="58" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="#475467">Qty A (${a})</text>
                <rect x="96" y="40" width="90" height="28" rx="4" fill="#e8eef6" stroke="#1e3a5f" stroke-width="1.5"/>
                <rect x="192" y="40" width="90" height="28" rx="4" fill="#e8eef6" stroke="#1e3a5f" stroke-width="1.5"/>
                <rect x="288" y="40" width="90" height="28" rx="4" fill="#e8eef6" stroke="#1e3a5f" stroke-width="1.5"/>
                <text x="141" y="58" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#1e3a5f">${scale}</text>
                <text x="237" y="58" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#1e3a5f">${scale}</text>
                <text x="333" y="58" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#1e3a5f">${scale}</text>
                <text x="16" y="102" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="#475467">Qty B (${b})</text>
                <rect x="96" y="84" width="90" height="28" rx="4" fill="#e1f2ef" stroke="#0f766e" stroke-width="1.5"/>
                <rect x="192" y="84" width="90" height="28" rx="4" fill="#e1f2ef" stroke="#0f766e" stroke-width="1.5"/>
                <text x="141" y="102" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#0f766e">${scale}</text>
                <text x="237" y="102" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#0f766e">${scale}</text>
                <text x="415" y="78" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700" fill="#b45309">${a}:${b}</text>
              </svg>
            </div>
            <p class="bh-muted" style="margin:0.75rem 0 0"><strong>Language Prompt (${esc(tierInfo.label)}):</strong> "When both quantities are multiplied by ${scale}, the ratio ${a} to ${b} stays equivalent to 3 to 2 because each unit part represents ${scale}."</p>
          </div>
        </div>
      `;
    }

    const lenses = subj.includes("science")
      ? [
          { label: "1. Input / Cause", title: "System Input", desc: `Identify the energy, matter, or change entering the ${unit.unit_title} system.` },
          { label: "2. Mechanism / Process", title: "Causal Interaction", desc: `Use key terms (${keyTerms.join(", ") || "system vocabulary"}) to explain what happens inside the system.` },
          { label: "3. Observable Effect", title: "Evidence & Outcome", desc: "Describe the measurable result observed in the investigation and link it back to the cause." },
        ]
      : subj.includes("social")
        ? [
            { label: "1. Historical Context", title: "Before & Conditions", desc: `Examine what conditions shaped ${unit.unit_title} before the turning point.` },
            { label: "2. Multiple Perspectives", title: "Who Spoke & Why", desc: `Compare how different groups experienced ${unit.unit_title} using primary sources.` },
            { label: "3. Continuity & Change", title: "Lasting Impact", desc: "Explain what changed and what stayed the same over time with source evidence." },
          ]
        : [
            { label: "1. Text Evidence", title: "Exact Quote or Detail", desc: `Locate specific words from the ${unit.unit_title} text that anchor your thinking.` },
            { label: "2. Author Craft", title: "Structure & Word Choice", desc: `Notice how key terms (${keyTerms.join(", ") || "unit vocabulary"}) signal tone or structure.` },
            { label: "3. Academic Claim", title: "Supported Inference", desc: "Connect the quote to a complete claim using a WIDA connector." },
          ];
    const activeLens = lenses[lens] || lenses[0];

    return `
      <div class="studio-explorer-grid">
        <div class="studio-card">
          <div class="studio-card-head">
            <h4>Visual Concept Explorer · ${esc(unit.subject)} Interactive Model</h4>
            <span class="bh-muted">Toggle each lens to examine how ${esc(unit.unit_title)} builds academic meaning</span>
          </div>
          <div class="studio-explorer-controls" role="group" aria-label="Concept model lenses">
            ${lenses
              .map(
                (item, idx) => `
                  <button type="button" class="vs-pill" data-explorer-lens="${idx}" aria-pressed="${idx === lens}">
                    ${esc(item.label)}
                  </button>
                `,
              )
              .join("")}
          </div>
          <div class="vs-svg-frame" style="margin-top:0.75rem">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 120" width="460" height="120" role="img" style="background:#ffffff">
              <title>${esc(unit.subject)} interactive concept model — ${esc(activeLens.title)}</title>
              <rect x="0" y="0" width="460" height="120" fill="#ffffff"/>
              ${lenses
                .map((item, idx) => {
                  const x = 16 + idx * 148;
                  const active = idx === lens;
                  return `
                    <rect x="${x}" y="28" width="132" height="64" rx="8" fill="${active ? "#1e3a5f" : "#f2efe9"}" stroke="${active ? "#1e3a5f" : "#cbd5e1"}" stroke-width="1.5"/>
                    <text x="${x + 66}" y="55" text-anchor="middle" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="11" font-weight="700" fill="${active ? "#ffffff" : "#182230"}">${esc(item.title)}</text>
                    <text x="${x + 66}" y="73" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="${active ? "#e8eef6" : "#475467"}">Stage ${idx + 1}</text>
                  `;
                })
                .join("")}
            </svg>
          </div>
          <div class="cs-item-card" style="margin-top:0.75rem">
            <strong>${esc(activeLens.label)} — ${esc(activeLens.title)}</strong>
            <p style="margin:0">${esc(activeLens.desc)}</p>
            <p class="bh-muted" style="margin:0"><strong>Target Frame:</strong> ${esc(connection?.unit_example_frame || frames[0] || "Connect your claim to evidence.")}</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderDetectiveLab() {
    const rawMisc = safeParseJson(connection?.common_language_misconception, null);
    const pattern =
      (rawMisc && typeof rawMisc === "object" ? rawMisc.misconception_pattern : "") ||
      `Students state an answer for ${unit.unit_title} without connecting key terms or explaining why.`;
    const redirect =
      (rawMisc && typeof rawMisc === "object" ? rawMisc.teacher_redirect : "") ||
      "Prompt students to name the exact relationship using a WIDA connector and unit vocabulary.";
    const keyWord = vocab[0]?.word || unit.subject;

    const options = [
      {
        id: "thinking",
        label: "It misses the academic relationship or leaves out why the evidence supports the idea.",
        correct: true,
      },
      {
        id: "spelling",
        label: "The only issue is minor capitalization or punctuation.",
        correct: false,
      },
      {
        id: "length",
        label: "It is completely correct and needs no academic language revision.",
        correct: false,
      },
    ];

    return `
      <div class="studio-detective-grid">
        <div class="studio-card">
          <div class="studio-card-head">
            <h4>Misconception Detective · Analyze &amp; Revise Student Thinking</h4>
            <span class="bh-muted">Grounded in this unit's verified common language misconception</span>
          </div>
          <div class="studio-sample-error">
            <strong>Sample Student Response to Inspect:</strong> “It just changes because that is what happened in ${esc(unit.unit_title)}.”
          </div>
          <p class="bh-muted" style="margin:0.65rem 0 0"><strong>Verified Misconception Pattern:</strong> ${esc(pattern)}</p>

          <div style="margin-top:0.85rem;display:grid;gap:0.5rem">
            <strong>Step 1 · Identify the thinking or language error:</strong>
            ${options
              .map(
                (opt) => `
                  <button type="button" class="vs-match-btn ${studioState.detectiveChoice === opt.id ? "is-selected" : ""}" data-detective-choice="${opt.id}">
                    ${esc(opt.label)}
                  </button>
                `,
              )
              .join("")}
          </div>

          ${
            studioState.detectiveChoice
              ? `<div class="vs-feedback ${studioState.detectiveChoice === "thinking" ? "is-good" : "is-warn"}" role="status" style="margin-top:0.65rem">
                  ${
                    studioState.detectiveChoice === "thinking"
                      ? `Spot on! Teacher redirect: ${esc(redirect)}`
                      : "Look deeper at the reasoning — what academic relationship or evidence is missing?"
                  }
                </div>`
              : ""
          }

          <div style="margin-top:0.85rem;display:grid;gap:0.5rem">
            <label for="detectiveRevisionInput"><strong>Step 2 · Rewrite a stronger response using "${esc(keyWord)}" and a connector (because / therefore / shows that):</strong></label>
            <textarea id="detectiveRevisionInput" class="bh-seq-input" rows="3" placeholder="Write the revised academic response here…">${esc(studioState.detectiveRevision)}</textarea>
            <div>
              <button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-detective-check>Check Revision</button>
            </div>
            ${studioState.detectiveFeedback ? `<div class="vs-feedback ${studioState.detectiveFeedback.startsWith("Great") ? "is-good" : "is-warn"}" role="status">${esc(studioState.detectiveFeedback)}</div>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  function renderQuestLab() {
    const step = studioState.questStep || 1;
    const targetVocab = vocab[0] || { word: unit.subject, definition: `Key idea in ${unit.unit_title}` };
    const distractors = vocab.slice(1, 3).map((v) => v.word);
    const vocabChoices = [targetVocab.word, ...distractors];
    if (vocabChoices.length < 3) vocabChoices.push("Unrelated detail", "Personal opinion");

    return `
      <div class="studio-quest-grid">
        <div class="studio-card">
          <div class="studio-card-head">
            <h4>Interactive Learning Quest · Evidence-Gated 3-Step Challenge</h4>
            <span class="bh-muted">Complete each checkpoint to unlock the final ${esc(bp.wida_klu || "Academic")} transfer task</span>
          </div>

          <div class="studio-quest-steps">
            <div class="studio-quest-step-pill ${step === 1 ? "is-active" : step > 1 ? "is-done" : ""}">
              Step 1 · Vocabulary Gate ${step > 1 ? "✓" : ""}
            </div>
            <div class="studio-quest-step-pill ${step === 2 ? "is-active" : step > 2 ? "is-done" : ""}">
              Step 2 · Concept Reasoning ${step > 2 ? "✓" : ""}
            </div>
            <div class="studio-quest-step-pill ${step === 3 ? "is-active" : step > 3 ? "is-done" : ""}">
              Step 3 · Academic Explanation ${step > 3 ? "✓" : ""}
            </div>
          </div>

          ${
            step === 1
              ? `
                <div class="cs-item-card" style="margin-top:0.85rem">
                  <strong>Checkpoint 1 · Match the Key Term</strong>
                  <p style="margin:0">Which term matches this meaning: <em>“${esc(targetVocab.definition || unit.essential_question || unit.unit_title)}”</em>?</p>
                  <div class="vs-mode-tabs">
                    ${vocabChoices
                      .map(
                        (choice) => `
                          <button type="button" class="vs-pill" data-quest-vocab="${esc(choice)}" aria-pressed="${studioState.questVocabPick === choice}">
                            ${esc(choice)}
                          </button>
                        `,
                      )
                      .join("")}
                  </div>
                </div>
              `
              : ""
          }

          ${
            step === 2
              ? `
                <div class="cs-item-card" style="margin-top:0.85rem">
                  <strong>Checkpoint 2 · Choose the Strongest Evidence Move</strong>
                  <p style="margin:0">To ${esc(bp.wida_klu || "Explain")} in ${esc(unit.unit_title)}, which move makes an explanation strongest?</p>
                  <div style="display:grid;gap:0.45rem">
                    <button type="button" class="vs-match-btn" data-quest-reason="strong">
                      Connect "${esc(targetVocab.word)}" to specific lesson evidence using a connector like "because" or "therefore".
                    </button>
                    <button type="button" class="vs-match-btn" data-quest-reason="weak">
                      Write one word without explaining how the evidence connects to the question.
                    </button>
                  </div>
                </div>
              `
              : ""
          }

          ${
            step >= 3
              ? `
                <div class="cs-item-card" style="margin-top:0.85rem">
                  <strong>Checkpoint 3 · Final Academic Explanation (${esc(bp.wida_klu || "Explain")})</strong>
                  <p style="margin:0">${esc(unit.essential_question || `Explain a key concept from ${unit.unit_title}.`)}</p>
                  <p class="bh-muted" style="margin:0"><strong>Frame (${esc(tierInfo.label)}):</strong> ${esc(frames[0] || connection?.unit_example_frame || "Because ___, we can conclude ___.")}</p>
                  <label for="questFinalInput" class="visually-hidden">Final Quest explanation</label>
                  <textarea id="questFinalInput" class="bh-seq-input" rows="3" placeholder="Write your complete explanation using ${esc(targetVocab.word)}…">${esc(studioState.questFinalText)}</textarea>
                  <div class="cs-action-bar">
                    <button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-quest-submit>Complete Quest</button>
                    <button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-quest-reset>Restart Quest</button>
                  </div>
                </div>
              `
              : ""
          }

          ${studioState.questFeedback ? `<div class="vs-feedback ${studioState.questFeedback.includes("Unlocked") || studioState.questFeedback.includes("Quest Complete") ? "is-good" : "is-warn"}" role="status" style="margin-top:0.75rem">${esc(studioState.questFeedback)}</div>` : ""}
        </div>
      </div>
    `;
  }

  function insertIntoComposer(snippet, { isFrame = false } = {}) {
    const composer = container.querySelector("#studioComposer");
    if (!composer) return;
    const current = composer.value;
    const start = typeof composer.selectionStart === "number" ? composer.selectionStart : current.length;
    const end = typeof composer.selectionEnd === "number" ? composer.selectionEnd : current.length;

    let nextValue = "";
    let nextCursor = 0;

    if (isFrame && !current.trim()) {
      nextValue = snippet;
      const blankIdx = nextValue.indexOf("___");
      nextCursor = blankIdx >= 0 ? blankIdx : nextValue.length;
    } else {
      const before = current.slice(0, start);
      const after = current.slice(end);
      const needsLeadingSpace = before.length > 0 && !/\s$/.test(before);
      const needsTrailingSpace = after.length > 0 && !/^\s/.test(after);
      const inserted = `${needsLeadingSpace ? " " : ""}${snippet}${needsTrailingSpace ? " " : ""}`;
      nextValue = before + inserted + after;
      nextCursor = before.length + inserted.length;
    }

    studioState.sentenceText = nextValue;
    composer.value = nextValue;
    composer.focus();
    try {
      composer.setSelectionRange(nextCursor, nextCursor);
    } catch {
      // Ignore selection errors on detached inputs
    }
    const countEl = container.querySelector("#studioWordCount");
    if (countEl) {
      const wc = nextValue.trim() ? nextValue.trim().split(/\s+/).length : 0;
      countEl.textContent = `${wc} word${wc === 1 ? "" : "s"}`;
    }
  }

  async function startRecording() {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      studioState.recorderStatus = "error";
      studioState.recorderMessage =
        "Microphone recording is not available in this browser. Practice your response aloud directly with your partner!";
      render();
      return;
    }

    stopRecorderResources(studioState);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const recorder = new MediaRecorder(stream);

      studioState.mediaStream = stream;
      studioState.mediaRecorder = recorder;
      studioState.recordSeconds = 0;
      studioState.recorderStatus = "recording";
      studioState.recorderMessage = "Recording locally… Speak clearly using your target frame and vocabulary.";

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };

      recorder.onstop = () => {
        if (studioState.recordInterval) {
          clearInterval(studioState.recordInterval);
          studioState.recordInterval = null;
        }
        if (studioState.mediaStream) {
          for (const t of studioState.mediaStream.getTracks()) t.stop();
          studioState.mediaStream = null;
        }
        if (chunks.length) {
          const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
          studioState.audioUrl = URL.createObjectURL(blob);
          studioState.recorderStatus = "recorded";
          studioState.recorderMessage = `Rehearsal saved locally (${formatDuration(studioState.recordSeconds)}). Play it back below to self-assess.`;
        } else {
          studioState.recorderStatus = "idle";
          studioState.recorderMessage = "";
        }
        render();
      };

      recorder.start();
      studioState.recordInterval = setInterval(() => {
        studioState.recordSeconds += 1;
        if (studioState.recordSeconds >= 60) {
          if (studioState.mediaRecorder && studioState.mediaRecorder.state !== "inactive") {
            studioState.mediaRecorder.stop();
          }
          return;
        }
        const stopBtn = container.querySelector("[data-record-stop]");
        if (stopBtn) {
          stopBtn.textContent = `■ Stop Rehearsal (${formatDuration(studioState.recordSeconds)} / 1:00)`;
        }
      }, 1000);

      onTelemetry?.("studio_voice_rehearsal");
      render();
    } catch {
      studioState.recorderStatus = "error";
      studioState.recorderMessage =
        "Microphone access was declined or no microphone was found. No problem — rehearse aloud with your partner using the Talk Moves checklist!";
      render();
    }
  }

  // Bind delegated listeners once per container
  if (!container.dataset.studioBound) {
    container.dataset.studioBound = "1";

    container.addEventListener("input", (e) => {
      const active = container._studioCtx;
      if (!active) return;
      if (e.target.id === "studioComposer") {
        active.studioState.sentenceText = e.target.value;
        const countEl = container.querySelector("#studioWordCount");
        if (countEl) {
          const wc = e.target.value.trim() ? e.target.value.trim().split(/\s+/).length : 0;
          countEl.textContent = `${wc} word${wc === 1 ? "" : "s"}`;
        }
      } else if (e.target.id === "explorerScaleRange") {
        active.studioState.explorerScale = Number(e.target.value) || 2;
        active.render();
      } else if (e.target.id === "detectiveRevisionInput") {
        active.studioState.detectiveRevision = e.target.value;
      } else if (e.target.id === "questFinalInput") {
        active.studioState.questFinalText = e.target.value;
      }
    });

    container.addEventListener("change", (e) => {
      const active = container._studioCtx;
      if (!active) return;

      const clozeSelect = e.target.closest("[data-cloze-select]");
      if (clozeSelect) {
        const idx = Number(clozeSelect.dataset.clozeSelect);
        active.studioState.clozeSelections[idx] = clozeSelect.value;
        active.studioState.clozeChecked = false;
        active.render();
        return;
      }

      const moveBox = e.target.closest("[data-talk-move]");
      if (moveBox) {
        const idx = Number(moveBox.dataset.talkMove);
        if (moveBox.checked) active.studioState.checkedMoves.add(idx);
        else active.studioState.checkedMoves.delete(idx);
        active.render();
      }
    });

    container.addEventListener("click", (e) => {
      const active = container._studioCtx;
      if (!active) return;

      const widaBtn = e.target.closest("[data-studio-wida]");
      if (widaBtn) {
        active.onWidaChange?.(widaBtn.dataset.studioWida);
        return;
      }

      const labTab = e.target.closest("[data-studio-lab]");
      if (labTab) {
        const nextLab = labTab.dataset.studioLab;
        if (nextLab && nextLab !== active.studioState.activeLab) {
          active.studioState.activeLab = nextLab;
          active.render();
        }
        return;
      }

      const frameBtn = e.target.closest("[data-insert-frame]");
      if (frameBtn) {
        const frame = active.frames[Number(frameBtn.dataset.insertFrame)];
        if (frame) active.insertIntoComposer(frame, { isFrame: true });
        return;
      }

      const wordBtn = e.target.closest("[data-insert-word]");
      if (wordBtn) {
        active.insertIntoComposer(wordBtn.dataset.insertWord || "", { isFrame: false });
        return;
      }

      if (e.target.closest("[data-check-sentence]")) {
        active.studioState.lastCheck = analyzeAcademicSentence(active.studioState.sentenceText, {
          frames: active.frames,
          exampleFrame: active.connection?.unit_example_frame || "",
          vocabTerms: active.allVocabTerms,
        });
        active.onTelemetry?.("studio_sentence_check");
        active.render();
        return;
      }

      if (e.target.closest("[data-read-sentence]")) {
        const statusEl = container.querySelector("#studioSpeechStatus");
        speakText(active.studioState.sentenceText, (msg) => {
          if (statusEl) statusEl.textContent = msg;
        });
        return;
      }

      const copyBtn = e.target.closest("[data-copy-sentence]");
      if (copyBtn) {
        copyText(active.studioState.sentenceText, copyBtn, "Copied!");
        return;
      }

      if (e.target.closest("[data-clear-sentence]")) {
        active.studioState.sentenceText = "";
        active.studioState.lastCheck = null;
        active.render();
        container.querySelector("#studioComposer")?.focus({ preventScroll: true });
        return;
      }

      const speakBtn = e.target.closest("[data-speak-term]");
      if (speakBtn) {
        e.stopPropagation();
        speakText(speakBtn.dataset.speakTerm || "");
        return;
      }

      const cardEl = e.target.closest("[data-flashcard-idx]");
      if (cardEl) {
        const idx = Number(cardEl.dataset.flashcardIdx);
        if (active.studioState.flippedCards.has(idx)) active.studioState.flippedCards.delete(idx);
        else active.studioState.flippedCards.add(idx);
        active.render();
        return;
      }

      if (e.target.closest("[data-flip-all]")) {
        if (active.studioState.flippedCards.size === active.vocab.length) {
          active.studioState.flippedCards.clear();
        } else {
          for (let i = 0; i < active.vocab.length; i++) {
            active.studioState.flippedCards.add(i);
          }
        }
        active.render();
        return;
      }

      const clozeChip = e.target.closest("[data-cloze-chip]");
      if (clozeChip) {
        const idx = Number(clozeChip.dataset.clozeChip);
        active.studioState.clozeSelections[idx] = clozeChip.dataset.clozeValue || "";
        active.studioState.clozeChecked = false;
        active.render();
        return;
      }

      if (e.target.closest("[data-check-cloze]")) {
        active.studioState.clozeChecked = true;
        active.onTelemetry?.("studio_cloze_check");
        active.render();
        return;
      }

      if (e.target.closest("[data-reset-cloze]")) {
        active.studioState.clozeSelections = {};
        active.studioState.clozeChecked = false;
        active.render();
        return;
      }

      const speakerBtn = e.target.closest("[data-speaker-role]");
      if (speakerBtn) {
        active.studioState.activeSpeaker = speakerBtn.dataset.speakerRole === "B" ? "B" : "A";
        active.render();
        return;
      }

      if (e.target.closest("[data-reset-moves]")) {
        active.studioState.checkedMoves.clear();
        active.render();
        return;
      }

      if (e.target.closest("[data-record-start]")) {
        active.startRecording();
        return;
      }

      if (e.target.closest("[data-record-stop]")) {
        if (active.studioState.mediaRecorder && active.studioState.mediaRecorder.state !== "inactive") {
          active.studioState.mediaRecorder.stop();
        }
        return;
      }

      if (e.target.closest("[data-record-discard]")) {
        stopRecorderResources(active.studioState);
        active.studioState.recorderStatus = "idle";
        active.studioState.recorderMessage = "";
        active.render();
        return;
      }

      const lensBtn = e.target.closest("[data-explorer-lens]");
      if (lensBtn) {
        active.studioState.explorerLens = Number(lensBtn.dataset.explorerLens) || 0;
        active.render();
        return;
      }

      const detBtn = e.target.closest("[data-detective-choice]");
      if (detBtn) {
        active.studioState.detectiveChoice = detBtn.dataset.detectiveChoice;
        active.render();
        return;
      }

      if (e.target.closest("[data-detective-check]")) {
        const rev = (active.studioState.detectiveRevision || "").trim();
        const hasConn = /\b(because|therefore|shows that|since|however|as a result|so)\b/i.test(rev);
        if (rev.split(/\s+/).length >= 6 && hasConn) {
          active.studioState.detectiveFeedback = "Great revision! You replaced vague wording with an academic connector and clear reasoning.";
        } else {
          active.studioState.detectiveFeedback = "Try adding a connector (because, therefore, shows that) and at least 6 words to make the reasoning explicit.";
        }
        active.onTelemetry?.("lab_launch");
        active.render();
        return;
      }

      const qVocab = e.target.closest("[data-quest-vocab]");
      if (qVocab) {
        const pick = qVocab.dataset.questVocab;
        active.studioState.questVocabPick = pick;
        const target = active.vocab[0]?.word || unit.subject;
        if (pick.toLowerCase() === target.toLowerCase()) {
          active.studioState.questStep = 2;
          active.studioState.questFeedback = `Unlocked Checkpoint 2! "${target}" is the exact academic term.`;
        } else {
          active.studioState.questFeedback = `Not quite — re-read the definition and try another term.`;
        }
        active.render();
        return;
      }

      const qReason = e.target.closest("[data-quest-reason]");
      if (qReason) {
        active.studioState.questReasonPick = qReason.dataset.questReason;
        if (qReason.dataset.questReason === "strong") {
          active.studioState.questStep = 3;
          active.studioState.questFeedback = "Unlocked Checkpoint 3! Now write your complete academic explanation.";
        } else {
          active.studioState.questFeedback = "A single word doesn't show your reasoning. Choose the move that connects evidence with a connector.";
        }
        active.render();
        return;
      }

      if (e.target.closest("[data-quest-submit]")) {
        const txt = (active.studioState.questFinalText || "").trim();
        if (txt.split(/\s+/).length >= 6) {
          active.studioState.questStep = 4;
          active.studioState.questFeedback = "Quest Complete! You verified vocabulary, selected an evidence move, and authored an academic explanation.";
          active.onTelemetry?.("lab_launch");
        } else {
          active.studioState.questFeedback = "Write at least 6 words connecting the unit concept and evidence to complete the quest.";
        }
        active.render();
        return;
      }

      if (e.target.closest("[data-quest-reset]")) {
        active.studioState.questStep = 1;
        active.studioState.questVocabPick = "";
        active.studioState.questReasonPick = "";
        active.studioState.questFinalText = "";
        active.studioState.questFeedback = "";
        active.render();
      }
    });

    container.addEventListener("keydown", (e) => {
      const active = container._studioCtx;
      if (!active) return;

      // Arrow navigation on studio sub-tabs
      const subtab = e.target.closest("[data-studio-lab]");
      if (subtab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const keys = STUDIO_LABS.map((l) => l.key);
        const idx = keys.indexOf(active.studioState.activeLab);
        let next = idx;
        if (e.key === "ArrowRight") next = (idx + 1) % keys.length;
        if (e.key === "ArrowLeft") next = (idx - 1 + keys.length) % keys.length;
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = keys.length - 1;
        active.studioState.activeLab = keys[next];
        active.render();
        container.querySelector(`#studio-tab-${keys[next]}`)?.focus({ preventScroll: true });
        return;
      }

      // Enter / Space to flip flashcards
      if (e.key === "Enter" || e.key === " ") {
        const cardEl = e.target.closest("[data-flashcard-idx]");
        if (!cardEl || e.target.closest("[data-speak-term]")) return;
        e.preventDefault();
        const idx = Number(cardEl.dataset.flashcardIdx);
        if (active.studioState.flippedCards.has(idx)) active.studioState.flippedCards.delete(idx);
        else active.studioState.flippedCards.add(idx);
        active.render();
        container.querySelector(`[data-flashcard-idx="${idx}"]`)?.focus({ preventScroll: true });
      }
    });
  }

  container._studioCtx = {
    studioState,
    frames,
    vocab,
    connection,
    allVocabTerms,
    onTelemetry,
    onWidaChange,
    render,
    insertIntoComposer,
    startRecording,
  };

  render();
}
