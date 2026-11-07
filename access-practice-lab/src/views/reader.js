// Immersive Reader Studio (/reader)
// A research-backed reading accelerator designed for multilingual learners:
//   - Word-by-word karaoke highlighting synchronized with speech synthesis.
//   - Acoustic & chunking scaffolds: adjustable speed (0.7x, 0.9x, 1.05x), sentence spotlight, clause chunking.
//   - Click-to-lookup dictionary: 755-word academic word bank with English/Spanish definitions, cognate tags, syllables.
//   - Interactive Read-Aloud practice: browser STT analyzes learner pronunciation, highlighting matched words in real time.
//   - Spaced Repetition Word Bank: Leitner box ladder (1 -> 3 -> 7 -> 14 days) with flashcard rehearsal.
// Honest by design: no arbitrary levels or scores, works completely offline on this device.
import { crumbsHTML } from "../components.js";
import { READER_SAMPLES } from "../content/reader-samples.js";
import { WORDS } from "../content/wordlab-words.js";
import { i18nFor } from "../i18n.js";
import * as R from "../lang/reader.js";
import { canSpeak, isSpeaking, speak, stop as stopSpeech } from "../speech.js";
import { canDictate, startDictation } from "../stt.js";
import { BASE, announce, copyText, esc, html, icon, raw, safeJson, storage } from "../util.js";

const STORAGE_KEY = "accessPracticeLab:v1:reader";

// Module-level interactive state
let state = R.emptyState();
let currentText = READER_SAMPLES[0].body;
let currentTitle = READER_SAMPLES[0].title[0];
let parsed = R.parseText(currentText);
let activeTab = "read"; // "read" | "bank" | "insights"
let activeSentence = -1;
let activeWord = -1;
let selectedWordEntry = null; // for the word inspector modal/panel
let dictationSession = null;
let dictationResult = null; // { states, read, retry, total, practice }
let speechBoundaryTimer = null;
let flashcardAt = 0;
let flashcardFlipped = false;

function loadState() {
  try {
    const raw = safeJson(storage.get(STORAGE_KEY), null);
    state = R.cleanState(raw);
  } catch {
    state = R.emptyState();
  }
}

function saveState() {
  try {
    storage.set(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

loadState();

function updateText(body, title = "") {
  currentText = R.cleanText(body);
  parsed = R.parseText(currentText);
  currentTitle = title || R.titleFrom(currentText);
  activeSentence = -1;
  activeWord = -1;
  dictationResult = null;
}

function wordLookup(wordText) {
  const norm = R.norm(wordText);
  const found = R.lookupWord(WORDS, norm);
  const saved = state.bank[norm];
  return {
    word: norm,
    rawText: wordText,
    def: found?.d || (saved?.def || ""),
    esDef: found?.de || (saved?.es || ""),
    pos: found?.pos || "",
    cognate: found?.c || "none",
    cognateNote: found?.n || "",
    esWord: found?.e || "",
    syl: R.syllables(norm),
    isSaved: Boolean(saved),
    savedEntry: saved,
  };
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const T = I.S;
  const isEs = I.spanish;
  const title = T("Immersive Reader", "Lector inmersivo");
  const facts = R.textFacts(parsed);
  const due = R.dueWords(state, Math.floor(Date.now() / 864e5));
  const bankCount = Object.keys(state.bank).length;

  return {
    title,
    html: html`${crumbsHTML([
      [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`],
      [title, null],
    ])}
    <article class="reader-studio" aria-labelledby="readerStudioTitle">
      <header class="reader-header">
        <div class="reader-title-wrap">
          <p class="reader-kicker">${I.T("Reading Studio · Language Tools", "Estudio de lectura · Herramientas de lenguaje")}</p>
          <h1 id="readerStudioTitle" tabindex="-1">${title}</h1>
          <p class="reader-lead">${I.T(
            "Word-by-word guided read-aloud, spoken reading practice, and personal vocabulary builder.",
            "Lectura guiada palabra por palabra, práctica oral en voz alta y constructor personal de vocabulario."
          )}</p>
        </div>

        <nav class="reader-tabs" aria-label="${I.S("Reader sections", "Secciones del lector")}">
          <button type="button" class="reader-tab ${activeTab === "read" ? "active" : ""}" data-reader-tab="read">
            ${icon("reading")}<span>${I.T("Reader", "Lectura")}</span>
          </button>
          <button type="button" class="reader-tab ${activeTab === "bank" ? "active" : ""}" data-reader-tab="bank">
            ${icon("words")}<span>${I.T("My Word Bank", "Mi banco de palabras")}</span>
            ${bankCount > 0 ? html`<span class="badge ${due.length > 0 ? "badge-due" : ""}">${due.length > 0 ? due.length : bankCount}</span>` : ""}
          </button>
          <button type="button" class="reader-tab ${activeTab === "insights" ? "active" : ""}" data-reader-tab="insights">
            ${icon("bulb")}<span>${I.T("About this text", "Sobre este texto")}</span>
          </button>
        </nav>
      </header>

      ${activeTab === "read" ? renderReaderTab(I, ctx) : activeTab === "bank" ? renderBankTab(I, ctx, due) : renderInsightsTab(I, ctx, facts)}

      ${selectedWordEntry ? renderWordInspector(I, selectedWordEntry) : ""}
    </article>`,
  };
}

function renderReaderTab(I, ctx) {
  const T = I.S;
  const isReadingAloud = Boolean(dictationSession);
  const chunks = R.chunkStarts(parsed);

  return html`
    <section class="reader-workspace" aria-label="${I.S("Reading canvas", "Lienzo de lectura")}">
      <div class="reader-toolbar" role="toolbar" aria-label="${I.S("Playback and reading options", "Opciones de lectura y reproducción")}">
        <div class="toolbar-group playback-controls">
          <button type="button" class="btn primary playback-btn" data-reader-play aria-label="${isSpeaking() ? T("Stop listening", "Detener escucha") : T("Listen to text", "Escuchar texto")}">
            ${icon(isSpeaking() ? "stop" : "play")}
            <span>${isSpeaking() ? I.T("Stop", "Detener") : I.T("Listen", "Escuchar")}</span>
          </button>

          <button type="button" class="btn secondary rehearse-btn ${isReadingAloud ? "active-rehearse" : ""}" data-reader-dictate>
            ${icon("record")}
            <span>${isReadingAloud ? I.T("Done reading", "Terminar lectura") : I.T("Practice reading aloud", "Practicar en voz alta")}</span>
          </button>
        </div>

        <div class="toolbar-group speed-controls">
          <span class="toolbar-label">${I.T("Speed:", "Velocidad:")}</span>
          ${R.RATES.map(
            (r) => html`
              <button type="button" class="btn chip ${state.prefs.rate === r ? "active-chip" : ""}" data-reader-rate="${r}">
                ${r}x
              </button>`
          )}
        </div>

        <div class="toolbar-group scaffold-toggles">
          <label class="toggle-pill ${state.prefs.spotlight ? "active-toggle" : ""}">
            <input type="checkbox" data-reader-toggle="spotlight" ${state.prefs.spotlight ? "checked" : ""} />
            <span>${I.T("Sentence Spotlight", "Enfoque de oración")}</span>
          </label>
          <label class="toggle-pill ${state.prefs.chunks ? "active-toggle" : ""}">
            <input type="checkbox" data-reader-toggle="chunks" ${state.prefs.chunks ? "checked" : ""} />
            <span>${I.T("Phrasing Chunks", "Fragmentos de frase")}</span>
          </label>
        </div>

        <div class="toolbar-group sample-picker">
          <button type="button" class="btn ghost small" data-reader-paste-toggle>
            ${icon("copy")}<span>${I.T("Paste custom text", "Pegar texto propio")}</span>
          </button>
        </div>
      </div>

      <div class="reader-sample-bar">
        <span class="sample-prompt">${I.T("Try a sample:", "Prueba un ejemplo:")}</span>
        ${READER_SAMPLES.map(
          (s) => html`
            <button type="button" class="sample-chip ${currentTitle === (I.spanish ? s.title[1] : s.title[0]) ? "current-sample" : ""}" data-reader-sample="${s.id}">
              ${I.spanish ? s.title[1] : s.title[0]}
            </button>`
        )}
      </div>

      <div class="reader-paste-drawer" id="readerPasteDrawer" hidden>
        <label for="readerCustomInput"><strong>${I.T("Paste or type any text (up to 6,000 characters):", "Pega o escribe cualquier texto (hasta 6,000 caracteres):")}</strong></label>
        <textarea id="readerCustomInput" rows="5" placeholder="${I.S("Paste a story, article, or homework reading here...", "Pega aquí un cuento, artículo o lectura de tarea...")}"></textarea>
        <div class="drawer-actions">
          <button type="button" class="btn primary small" data-reader-submit-text>${I.T("Load text into Reader", "Cargar texto en el Lector")}</button>
          <button type="button" class="btn small" data-reader-cancel-paste>${I.T("Cancel", "Cancelar")}</button>
        </div>
      </div>

      ${dictationResult ? renderDictationSummary(I, dictationResult) : ""}

      <div class="reader-surface ${state.prefs.spotlight && activeSentence >= 0 ? "has-spotlight" : ""} ${state.prefs.chunks ? "has-chunks" : ""}" id="readerSurface">
        ${renderParsedText(parsed, chunks, I)}
      </div>
    </section>
  `;
}

function renderParsedText(parsed, chunks, I) {
  if (!parsed.paragraphs.length) {
    return html`<p class="empty-text-note">${I.T("No text loaded. Choose a sample or paste a reading above.", "No hay texto cargado. Elige un ejemplo o pega una lectura arriba.")}</p>`;
  }

  return parsed.paragraphs.map((p) => {
    const sents = parsed.sentences.slice(p.from, p.to);
    return html`<div class="reader-paragraph">
      ${sents.map((s) => {
        const isCurrentSentence = activeSentence === s.s;
        const words = parsed.words.slice(s.from, s.to);
        return html`<span class="reader-sentence ${isCurrentSentence ? "is-focused-sentence" : ""}" data-sentence-index="${s.s}">
          ${words.map((w) => {
            const isCurrentWord = activeWord === w.i;
            const isChunkStart = chunks.has(w.i);
            const dictState = dictationResult?.states?.[w.i] || "";
            return html`${isChunkStart ? html`<span class="chunk-divider" aria-hidden="true">/</span>` : ""}
              <button type="button" class="reader-word ${isCurrentWord ? "is-spoken-word" : ""} ${dictState ? `spoken-${dictState}` : ""}" data-word-index="${w.i}" title="${I.S("Click for pronunciation & meaning", "Toca para pronunciación y significado")}">
                ${w.text}
              </button> `;
          })}
        </span>`;
      })}
    </div>`;
  });
}

function renderDictationSummary(I, result) {
  const T = I.S;
  const pct = Math.round((result.read / (result.total || 1)) * 100);

  return html`
    <div class="dictation-banner" role="status" aria-live="polite">
      <div class="dictation-stats">
        <strong>${icon("check")} ${I.T(`You read aloud ${result.read} of ${result.total} words (${pct}%)`, `Leíste en voz alta ${result.read} de ${result.total} palabras (${pct}%)`)}</strong>
        <p class="dictation-hint">${I.T(
          "Great effort! Tap any highlighted word below to hear it spoken and rehearse.",
          "¡Gran esfuerzo! Toca cualquier palabra resaltada abajo para escucharla y ensayar."
        )}</p>
      </div>
      ${result.practice.length > 0 ? html`
        <div class="dictation-practice-words">
          <span>${I.T("Words to rehearse:", "Palabras para ensayar:")}</span>
          ${result.practice.slice(0, 6).map((idx) => {
            const w = parsed.words[idx];
            return html`<button type="button" class="chip retry-chip" data-speak-word="${w.text}">${icon("play")} ${w.text}</button>`;
          })}
        </div>` : ""}
    </div>
  `;
}

function renderWordInspector(I, entry) {
  const T = I.S;
  const parts = entry.word.split(/([aeiouy]+)/i).filter(Boolean);

  return html`
    <div class="word-inspector-overlay" role="dialog" aria-modal="true" aria-labelledby="inspectorWordTitle">
      <div class="word-inspector-card">
        <header class="inspector-header">
          <div class="inspector-word-group">
            <h2 id="inspectorWordTitle">${entry.rawText}</h2>
            ${entry.pos ? html`<span class="part-of-speech">${entry.pos}</span>` : ""}
          </div>
          <button type="button" class="btn-close-inspector" data-close-inspector aria-label="${I.S("Close word inspector", "Cerrar inspector de palabras")}">
            ${icon("close")}
          </button>
        </header>

        <div class="inspector-pronounce">
          <button type="button" class="btn primary small" data-speak-word="${entry.word}">
            ${icon("volume")} <span>${I.T("Hear word", "Escuchar palabra")}</span>
          </button>
          <span class="syllables-count">${I.T(`${entry.syl} syllable${entry.syl > 1 ? "s" : ""}`, `${entry.syl} sílaba${entry.syl > 1 ? "s" : ""}`)}</span>
        </div>

        <div class="inspector-definitions">
          ${entry.def ? html`<div class="def-block"><strong class="def-label">${I.T("Meaning:", "Significado:")}</strong><p>${entry.def}</p></div>` : ""}
          ${entry.esDef ? html`<div class="def-block"><strong class="def-label">${I.T("En español:", "En español:")}</strong><p lang="es">${entry.esDef}</p></div>` : ""}
          ${entry.esWord && entry.esWord !== entry.word ? html`<div class="def-block"><strong class="def-label">${I.T("Spanish translation:", "Traducción al español:")}</strong><p lang="es">${entry.esWord}</p></div>` : ""}
          ${entry.cognate === "cog" ? html`<div class="cognate-badge cog-true"><span>${icon("check")} ${I.T("Cognate: similar in English and Spanish", "Cognado: similar en inglés y español")}</span></div>` : ""}
          ${entry.cognate === "false" ? html`<div class="cognate-badge cog-false"><span>${icon("alert")} ${I.T("False Friend: looks similar, different meaning!", "Falso amigo: se parece, ¡pero significa otra cosa!")}</span></div>` : ""}
        </div>

        <footer class="inspector-actions">
          <button type="button" class="btn ${entry.isSaved ? "secondary" : "primary"}" data-toggle-save-word="${entry.word}">
            ${icon(entry.isSaved ? "check" : "words")}
            <span>${entry.isSaved ? I.T("Saved in My Word Bank", "Guardada en Mi banco") : I.T("Save to My Word Bank", "Guardar en Mi banco")}</span>
          </button>
        </footer>
      </div>
    </div>
  `;
}

function renderBankTab(I, ctx, due) {
  const T = I.S;
  const allWords = Object.values(state.bank);

  if (!allWords.length) {
    return html`
      <section class="wordbank-empty panel">
        <h2>${I.T("Your Word Bank is empty", "Tu banco de palabras está vacío")}</h2>
        <p>${I.T(
          "When reading any text in the Reader tab, click any word to see its meaning and save it here.",
          "Al leer cualquier texto en la pestaña Lectura, toca cualquier palabra para ver su significado y guardarla aquí."
        )}</p>
        <button type="button" class="btn primary" data-reader-tab="read">${I.T("Return to Reader", "Volver al Lector")}</button>
      </section>
    `;
  }

  const currentDueCard = due[flashcardAt % due.length];

  return html`
    <section class="wordbank-section">
      <div class="wordbank-header">
        <div>
          <h2>${I.T("My Saved Words", "Mis palabras guardadas")}</h2>
          <p class="lead">${I.T(
            `${allWords.length} words saved. ${due.length} ready for review today on your 1-3-7-14 day ladder.`,
            `${allWords.length} palabras guardadas. ${due.length} listas para repasar hoy en tu escalera de 1-3-7-14 días.`
          )}</p>
        </div>
      </div>

      ${due.length > 0 && currentDueCard ? html`
        <div class="flashcard-arena">
          <p class="flashcard-kicker">${I.T(`Review card ${flashcardAt + 1} of ${due.length}`, `Tarjeta de repaso ${flashcardAt + 1} de ${due.length}`)}</p>
          <div class="flashcard-card ${flashcardFlipped ? "flipped" : ""}" data-flip-card>
            <div class="flashcard-front">
              <span class="flashcard-box-tag">${I.T(`Box ${currentDueCard.box + 1}`, `Caja ${currentDueCard.box + 1}`)}</span>
              <h3 class="flashcard-word">${currentDueCard.word}</h3>
              <p class="flashcard-hint">${I.T("Tap to reveal meaning & sentence", "Toca para ver el significado y la oración")}</p>
              <button type="button" class="btn chip small" data-speak-word="${currentDueCard.word}">${icon("volume")} ${I.T("Listen", "Escuchar")}</button>
            </div>
            <div class="flashcard-back">
              ${currentDueCard.def ? html`<p class="fc-def"><strong>${I.T("Meaning:", "Significado:")}</strong> ${currentDueCard.def}</p>` : ""}
              ${currentDueCard.es ? html`<p class="fc-es"><strong>${I.T("En español:", "En español:")}</strong> ${currentDueCard.es}</p>` : ""}
              ${currentDueCard.ctx ? html`<p class="fc-ctx"><em>“${currentDueCard.ctx}”</em></p>` : ""}
            </div>
          </div>

          <div class="flashcard-controls">
            <button type="button" class="btn secondary" data-rate-card="not-yet" data-card-word="${currentDueCard.word}">
              ${I.T("Not yet (returns tomorrow)", "Aún no (vuelve mañana)")}
            </button>
            <button type="button" class="btn primary" data-rate-card="know-it" data-card-word="${currentDueCard.word}">
              ${I.T("I know it! (advances ladder)", "¡Me la sé! (avanza de nivel)")}
            </button>
          </div>
        </div>
      ` : html`
        <div class="flashcard-caughtup panel">
          <p><strong>${icon("check")} ${I.T("You are all caught up on reviews for today!", "¡Estás al día con todos tus repasos de hoy!")}</strong></p>
          <p class="fine">${I.T(`Next review in ${R.daysUntilNext(state, Math.floor(Date.now() / 864e5))} days.`, `Próximo repaso en ${R.daysUntilNext(state, Math.floor(Date.now() / 864e5))} días.`)}</p>
        </div>
      `}

      <div class="saved-words-table-wrap">
        <h3>${I.T("All Saved Words", "Todas las palabras guardadas")}</h3>
        <ul class="saved-words-list">
          ${allWords.map((w) => html`
            <li class="saved-word-row">
              <div class="sw-main">
                <strong>${w.word}</strong>
                ${w.es ? html`<span class="sw-es" lang="es">(${w.es})</span>` : ""}
                ${w.def ? html`<span class="sw-def">— ${w.def}</span>` : ""}
              </div>
              <div class="sw-meta">
                <span class="box-badge">${I.T(`Stage ${Math.max(1, w.box + 1)}`, `Etapa ${Math.max(1, w.box + 1)}`)}</span>
                <button type="button" class="btn-icon" data-speak-word="${w.word}" title="${I.S("Hear word", "Escuchar palabra")}">
                  ${icon("volume")}
                </button>
                <button type="button" class="btn-icon delete-word" data-delete-word="${w.word}" title="${I.S("Remove from bank", "Eliminar del banco")}">
                  ${icon("close")}
                </button>
              </div>
            </li>
          `)}
        </ul>
      </div>
    </section>
  `;
}

function renderInsightsTab(I, ctx, facts) {
  const T = I.S;
  const academicTerms = parsed.words.filter((w) => R.lookupWord(WORDS, w.norm));
  const uniqueAcademic = [...new Map(academicTerms.map((w) => [w.norm, w])).values()];

  return html`
    <section class="reader-insights-section">
      <h2>${I.T("Text Insights & Vocabulary", "Análisis del texto y vocabulario")}</h2>
      <p class="lead">${I.T(
        "A clear look at length, sentence structures, and academic terms in this text.",
        "Una vista clara de longitud, estructuras de oraciones y términos académicos en este texto."
      )}</p>

      <div class="insights-grid">
        <div class="stat-card">
          <span class="stat-num">${facts.words}</span>
          <span class="stat-label">${I.T("Total words", "Palabras totales")}</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${facts.sentences}</span>
          <span class="stat-label">${I.T("Sentences", "Oraciones")}</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${facts.longWords}</span>
          <span class="stat-label">${I.T("Multi-syllable words (4+)", "Palabras polisilábicas (4+)")}</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${facts.longest}</span>
          <span class="stat-label">${I.T("Longest sentence (words)", "Oración más larga (palabras)")}</span>
        </div>
      </div>

      ${uniqueAcademic.length > 0 ? html`
        <div class="insights-academic-card panel">
          <h3>${I.T("Key Academic Vocabulary Found in Text", "Vocabulario académico clave encontrado en el texto")}</h3>
          <p class="fine">${I.T("Tap any word to inspect meaning, cognates, and add to your bank:", "Toca cualquier palabra para ver significado, cognados y añadirla a tu banco:")}</p>
          <div class="academic-tag-cloud">
            ${uniqueAcademic.map((w) => html`
              <button type="button" class="chip academic-chip" data-word-index="${w.i}">
                <strong>${w.text}</strong>
                ${R.lookupWord(WORDS, w.norm)?.e ? html`<small lang="es">${R.lookupWord(WORDS, w.norm).e}</small>` : ""}
              </button>
            `)}
          </div>
        </div>
      ` : ""}
    </section>
  `;
}

// ── Interactive event handlers ──────────────────────────────────────────────
export async function onClick(e, ctx) {
  const I = i18nFor(ctx);
  const t = e.target;

  // Tabs
  const tabBtn = t.closest("[data-reader-tab]");
  if (tabBtn) {
    activeTab = tabBtn.dataset.readerTab;
    ctx.rerender();
    return true;
  }

  // Sample picker
  const sampleBtn = t.closest("[data-reader-sample]");
  if (sampleBtn) {
    const s = READER_SAMPLES.find((item) => item.id === sampleBtn.dataset.readerSample);
    if (s) {
      stopSpeech();
      updateText(s.body, I.spanish ? s.title[1] : s.title[0]);
      ctx.rerender();
    }
    return true;
  }

  // Paste drawer toggling
  if (t.closest("[data-reader-paste-toggle]")) {
    const drawer = document.getElementById("readerPasteDrawer");
    if (drawer) drawer.hidden = !drawer.hidden;
    return true;
  }
  if (t.closest("[data-reader-cancel-paste]")) {
    const drawer = document.getElementById("readerPasteDrawer");
    if (drawer) drawer.hidden = true;
    return true;
  }
  if (t.closest("[data-reader-submit-text]")) {
    const input = document.getElementById("readerCustomInput");
    if (input && input.value.trim()) {
      stopSpeech();
      updateText(input.value);
      const drawer = document.getElementById("readerPasteDrawer");
      if (drawer) drawer.hidden = true;
      announce(I.S("Text loaded into reader.", "Texto cargado en el lector."));
      ctx.rerender();
    }
    return true;
  }

  // Play / Stop karaoke reading
  if (t.closest("[data-reader-play]")) {
    if (isSpeaking()) {
      stopSpeech();
      activeSentence = -1;
      activeWord = -1;
      ctx.rerender();
    } else {
      startKaraokeReading(ctx);
    }
    return true;
  }

  // Speech rate chip
  const rateBtn = t.closest("[data-reader-rate]");
  if (rateBtn) {
    const r = Number(rateBtn.dataset.readerRate);
    state.prefs.rate = r;
    saveState();
    ctx.rerender();
    return true;
  }

  // Word click -> Word Inspector
  const wordBtn = t.closest("[data-word-index]");
  if (wordBtn) {
    const idx = Number(wordBtn.dataset.wordIndex);
    const w = parsed.words[idx];
    if (w) {
      selectedWordEntry = wordLookup(w.text);
      ctx.rerender();
    }
    return true;
  }

  // Close inspector
  if (t.closest("[data-close-inspector]") || t.classList.contains("word-inspector-overlay")) {
    selectedWordEntry = null;
    ctx.rerender();
    return true;
  }

  // Speak single word
  const speakWordBtn = t.closest("[data-speak-word]");
  if (speakWordBtn) {
    const word = speakWordBtn.dataset.speakWord;
    speak(word, { rate: 0.85 });
    return true;
  }

  // Toggle save word
  const saveWordBtn = t.closest("[data-toggle-save-word]");
  if (saveWordBtn) {
    const word = saveWordBtn.dataset.toggleSaveWord;
    const today = Math.floor(Date.now() / 864e5);
    if (R.isSaved(state, word)) {
      state = R.removeWord(state, word);
      announce(I.S("Word removed from Word Bank", "Palabra eliminada del banco de palabras"));
    } else {
      const sentence = parsed.words.find((w) => R.norm(w.text) === R.norm(word));
      const sText = sentence ? parsed.sentences[sentence.s]?.text : "";
      state = R.addWord(state, {
        word,
        ctx: sText,
        def: selectedWordEntry?.def || "",
        es: selectedWordEntry?.esDef || selectedWordEntry?.esWord || "",
      }, today);
      announce(I.S("Word saved to Word Bank!", "¡Palabra guardada en tu banco de palabras!"));
    }
    saveState();
    if (selectedWordEntry) selectedWordEntry = wordLookup(word);
    ctx.rerender();
    return true;
  }

  // Flashcard flip
  if (t.closest("[data-flip-card]")) {
    flashcardFlipped = !flashcardFlipped;
    ctx.rerender();
    return true;
  }

  // Rate flashcard
  const rateCardBtn = t.closest("[data-rate-card]");
  if (rateCardBtn) {
    const word = rateCardBtn.dataset.cardWord;
    const knew = rateCardBtn.dataset.rateCard === "know-it";
    const today = Math.floor(Date.now() / 864e5);
    state = R.reviewWord(state, word, knew, today);
    saveState();
    flashcardFlipped = false;
    flashcardAt++;
    announce(knew ? I.S("Marked as known! Advanced on ladder.", "¡Marcada como conocida! Avanzó de nivel.") : I.S("Will review again tomorrow.", "Se repasará de nuevo mañana."));
    ctx.rerender();
    return true;
  }

  // Delete word from bank
  const delWordBtn = t.closest("[data-delete-word]");
  if (delWordBtn) {
    const word = delWordBtn.dataset.deleteWord;
    state = R.removeWord(state, word);
    saveState();
    announce(I.S("Word deleted", "Palabra eliminada"));
    ctx.rerender();
    return true;
  }

  // Dictate / Practice reading aloud
  if (t.closest("[data-reader-dictate]")) {
    if (dictationSession) {
      stopDictationPractice(ctx);
    } else {
      startDictationPractice(ctx);
    }
    return true;
  }

  return false;
}

export function onChange(e, ctx) {
  const t = e.target;
  const toggle = t.closest("[data-reader-toggle]");
  if (toggle) {
    const key = toggle.dataset.readerToggle;
    state.prefs[key] = toggle.checked;
    saveState();
    ctx.rerender();
  }
}

// ── Karaoke speech synthesizer reading ─────────────────────────────────────
function startKaraokeReading(ctx) {
  if (!canSpeak()) return;
  stopSpeech();
  clearTimeout(speechBoundaryTimer);

  const sentencesList = parsed.sentences.map((s) => s.text);
  activeSentence = 0;
  activeWord = parsed.sentences[0]?.from ?? -1;
  ctx.rerender();

  speak(sentencesList, {
    rate: state.prefs.rate || 0.9,
    onSegment: (sentenceIndex) => {
      activeSentence = sentenceIndex;
      activeWord = parsed.sentences[sentenceIndex]?.from ?? -1;
      ctx.rerender();
      scrollIntoReaderView(activeSentence);
    },
    onBoundary: ({ index, charIndex }) => {
      const wIdx = R.wordAtChar(parsed, index, charIndex);
      if (wIdx >= 0) {
        activeWord = wIdx;
        const el = document.querySelector(`[data-word-index="${wIdx}"]`);
        if (el) {
          document.querySelectorAll(".is-spoken-word").forEach((w) => w.classList.remove("is-spoken-word"));
          el.classList.add("is-spoken-word");
        }
      }
    },
  }).then(() => {
    activeSentence = -1;
    activeWord = -1;
    ctx.rerender();
  });
}

function scrollIntoReaderView(sentenceIndex) {
  const el = document.querySelector(`[data-sentence-index="${sentenceIndex}"]`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

// ── Read-Aloud Dictation practice ──────────────────────────────────────────
async function startDictationPractice(ctx) {
  if (!canDictate()) {
    announce("Speech recognition is not available in this browser. Try Chrome or Safari.");
    return;
  }
  stopSpeech();
  activeSentence = -1;
  activeWord = -1;
  dictationResult = null;

  try {
    dictationSession = await startDictation({
      lang: "en-US",
      onText: (latest) => {
        const aligned = R.align(parsed.words, latest.text);
        dictationResult = aligned;
        updateDictationHighlighting(aligned);
      },
      onError: () => {
        stopDictationPractice(ctx);
      },
      onEnd: (latest) => {
        const aligned = R.align(parsed.words, latest.text);
        dictationResult = aligned;
        dictationSession = null;
        ctx.rerender();
      },
    });
    ctx.rerender();
  } catch {
    dictationSession = null;
    ctx.rerender();
  }
}

function stopDictationPractice(ctx) {
  if (dictationSession) {
    const s = dictationSession;
    dictationSession = null;
    s.stop().then((finalText) => {
      dictationResult = R.align(parsed.words, finalText);
      ctx.rerender();
    });
  }
}

function updateDictationHighlighting(aligned) {
  aligned.states.forEach((state, i) => {
    const el = document.querySelector(`[data-word-index="${i}"]`);
    if (el) {
      el.classList.remove("spoken-read", "spoken-retry");
      if (state === "read") el.classList.add("spoken-read");
      else if (state === "retry") el.classList.add("spoken-retry");
    }
  });
}

export function unmount() {
  stopSpeech();
  if (dictationSession) {
    dictationSession.stop();
    dictationSession = null;
  }
  clearTimeout(speechBoundaryTimer);
  activeSentence = -1;
  activeWord = -1;
}
