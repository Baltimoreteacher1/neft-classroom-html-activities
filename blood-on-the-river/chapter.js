// Blood on the River — simplified chapter renderer.
// Three cards only: Characters, Main Events, and Important Things.
// All content is derived from the chapter data already embedded in each page,
// so chapters stay a single source of truth (no per-chapter re-authoring).

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[m],
  );
}

// Speech speed configuration
window.speakRate = parseFloat(localStorage.getItem("neft_bor_speak_rate") || "0.78");

// Slow, clear read-aloud with visual highlighting.
window.speakText = function (text, highlightEl, speakBtn) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  // Clear any existing active highlights
  document.querySelectorAll(".audio-highlight").forEach((el) => el.classList.remove("audio-highlight"));
  document.querySelectorAll(".speak.playing").forEach((el) => el.classList.remove("playing"));

  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = window.speakRate;
  u.pitch = 1.05;

  if (highlightEl && speakBtn) {
    highlightEl.classList.add("audio-highlight");
    speakBtn.classList.add("playing");

    const cleanup = () => {
      highlightEl.classList.remove("audio-highlight");
      speakBtn.classList.remove("playing");
    };
    u.onend = cleanup;
    u.onerror = cleanup;
  }

  window.speechSynthesis.speak(u);
};

// Canonical cast of Blood on the River. Each character is shown on a chapter
// card only when one of its name forms appears in that chapter's text, so the
// card reflects who actually shows up in the chapter. Matching is
// case-sensitive and whole-word to avoid false hits on common words.
const CAST = [
  {
    emoji: "🧒",
    name: "Samuel Collier",
    role: "The narrator — a poor London orphan who becomes a page in Virginia.",
    match: ["Samuel"],
    always: true,
  },
  {
    emoji: "⚔️",
    name: "Captain John Smith",
    role: "A bold soldier and leader, and Samuel's master.",
    match: ["Captain Smith", "John Smith", "Smith"],
  },
  {
    emoji: "✝️",
    name: "Reverend Hunt",
    role: "The kind, peace-making minister of the colony.",
    match: ["Reverend Hunt", "Reverend Robert Hunt"],
  },
  {
    emoji: "🔨",
    name: "James Read",
    role: "The blacksmith who becomes Samuel's protector and friend.",
    match: ["James Read"],
  },
  {
    emoji: "⛵",
    name: "Captain Newport",
    role: "Commander of the ships sailing between England and Virginia.",
    match: ["Newport"],
  },
  {
    emoji: "🎩",
    name: "Edward Wingfield",
    role: "The colony's first president.",
    match: ["Wingfield"],
  },
  {
    emoji: "🗝️",
    name: "John Ratcliffe",
    role: "A later, harsher president of the colony.",
    match: ["Ratcliffe"],
  },
  {
    emoji: "👑",
    name: "Chief Powhatan",
    role: "The powerful leader of many Native nations.",
    match: ["Powhatan"],
  },
  {
    emoji: "🌽",
    name: "Pocahontas",
    role: "Powhatan's lively daughter, who befriends the colonists.",
    match: ["Pocahontas", "Amocis", "Matoaka"],
  },
  {
    emoji: "🏹",
    name: "Namontack",
    role: "A Powhatan boy who trades places and becomes Samuel's friend.",
    match: ["Namontack"],
  },
  {
    emoji: "🧑",
    name: "Nathaniel Peacock",
    role: "One of the boys on the voyage and Samuel's companion.",
    match: ["Nathaniel", "Peacock"],
  },
  {
    emoji: "🧑",
    name: "Richard Mutton",
    role: "Another of the colony's boys.",
    match: ["Richard Mutton", "Richard"],
  },
  {
    emoji: "🍞",
    name: "Henry",
    role: "A colonist Samuel catches hoarding food.",
    match: ["Henry"],
  },
];

// Build one searchable text blob from everything in the chapter data.
function chapterText(data) {
  const parts = [data.heroCopy || "", data.notice || ""];
  (data.snapshot || []).forEach((s) => parts.push(s[0], s[1]));
  (data.structure || []).forEach((x) => parts.push(x));
  (data.scenes || []).forEach((s) => {
    parts.push(s.title, s.quote, s.summary, s.explain, s.label);
    (s.details || []).forEach((d) => parts.push(d));
  });
  return parts.join("  ");
}

function charactersInChapter(data) {
  const text = chapterText(data);
  return CAST.filter((c) => {
    if (c.always) return true;
    return c.match.some((m) => {
      const re = new RegExp(`(^|[^A-Za-z])${m}([^A-Za-z]|$)`);
      return re.test(text);
    });
  });
}

function renderChapter(data) {
  const $ = (s) => document.querySelector(s);
  const setText = (s, v) => {
    const el = $(s);
    if (el) el.textContent = v;
  };
  const setHTML = (s, v) => {
    const el = $(s);
    if (el) el.innerHTML = v;
  };

  document.title = `Blood on the River — Chapter ${data.chapter}`;
  setText("[data-chapter-title]", `Chapter ${data.chapter}`);
  setText("[data-hero-kicker]", `Chapter ${data.chapter}`);
  setText("[data-hero-copy]", data.heroCopy || "");
  setText("[data-brand]", `Chapter ${data.chapter}`);

  // --- Card 1: Characters ---
  const cast = charactersInChapter(data);
  const charactersCard = `
    <section class="card" id="card-characters">
      <div class="card-head"><span class="card-icon">👥</span><h2>Characters</h2></div>
      <p class="card-note">Who you meet in this chapter.</p>
      <ul class="people">
        ${cast
          .map(
            (c) => `<li class="person">
            <span class="person-emoji" aria-hidden="true">${c.emoji}</span>
            <span class="person-text">
              <span class="person-name">${esc(c.name)}
                <button class="speak" type="button" data-text="${esc(c.name)}. ${esc(c.role)}" title="Read aloud" aria-label="Read ${esc(c.name)} aloud">🔊</button>
              </span>
              <span class="person-role">${esc(c.role)}</span>
            </span>
          </li>`,
          )
          .join("")}
      </ul>
    </section>`;

  // --- Card 2: Main Events ---
  const events =
    (data.structure && data.structure.length
      ? data.structure
      : (data.scenes || []).map((s) => s.title)) || [];
  const eventsCard = `
    <section class="card" id="card-events">
      <div class="card-head"><span class="card-icon">📌</span><h2>Main Events</h2></div>
      <p class="card-note">What happens, in order.</p>
      <ol class="events">
        ${events.map((x) => `<li>${esc(x)}</li>`).join("")}
      </ol>
    </section>`;

  // --- Card 3: Important Things (setting + key ideas + vocabulary) ---
  const facts = (data.snapshot || [])
    .map(
      (s) =>
        `<li><span class="fk">${esc(s[0])}</span><span class="fv">${esc(s[1])}</span></li>`,
    )
    .join("");
  const vocab = (data.vocab || [])
    .map(
      (v) => `<li class="vrow">
        <span class="vword">${esc(v[0])}
          <button class="speak" type="button" data-text="${esc(v[0])}: ${esc(v[1])}" title="Read aloud" aria-label="Read ${esc(v[0])} aloud">🔊</button>
        </span>
        <span class="vdef">${esc(v[1])}</span>
      </li>`,
    )
    .join("");
  const importantCard = `
    <section class="card" id="card-important">
      <div class="card-head"><span class="card-icon">⭐</span><h2>Important Things</h2></div>
      <p class="card-note">Setting and the big ideas to watch for.</p>
      <ul class="facts">${facts}</ul>
    </section>`;

  // --- Card 4: Vocabulary ---
  const vocabularyCard = vocab
    ? `
    <section class="card" id="card-vocabulary">
      <div class="card-head">
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="card-icon">📖</span>
          <h2>Vocabulary</h2>
        </div>
        <button id="toggleVocabModeBtn" class="vocab-toggle-btn" type="button">Study Cards</button>
      </div>
      <p class="card-note" id="vocabCardNote">Words to know. Tap 🔊 to hear each one.</p>
      <div id="vocabContainer">
        <ul class="vocab">${vocab}</ul>
      </div>
    </section>`
    : "";

  // --- Card 4.5: Samuel's Journal Studio ---
  const journalCard = `
    <section class="card" id="card-journal">
      <div class="card-head"><span class="card-icon">📓</span><h2>Samuel's Journal</h2></div>
      <p class="card-note">Write a diary entry from Samuel's perspective, or record your reflections. Your work auto-saves locally.</p>
      <div class="journal-textarea-wrapper">
        <textarea id="journalTextarea" placeholder="Start writing here... (e.g., Today we arrived at the docks...)" aria-label="Journal entry text area"></textarea>
      </div>
      <div class="journal-status" id="journalStatus">Saved locally</div>
    </section>
  `;

  // --- Card 4.7: Exit Ticket Quiz ---
  let quizCard = "";
  if (data.quick) {
    const quizChoiceKey = `neft_bor_quiz_ch${data.chapter}`;
    const savedAnswer = localStorage.getItem(quizChoiceKey);
    const choicesHtml = data.quick.choices.map((choice, idx) => {
      let stateClass = "";
      let disabledAttr = "";
      if (savedAnswer !== null) {
        const ansIdx = parseInt(savedAnswer, 10);
        if (idx === data.quick.correct) {
          stateClass = " correct";
        } else if (idx === ansIdx) {
          stateClass = " incorrect";
        }
        disabledAttr = " disabled";
      }
      return `<button class="quiz-choice-btn${stateClass}" type="button" data-choice-idx="${idx}"${disabledAttr}>${esc(choice)}</button>`;
    }).join("");

    const feedbackHtml = savedAnswer !== null ? `
      <div class="quiz-feedback correct">
        ✓ ${esc(data.quick.feedback || "Correct!")}
      </div>
    ` : "";

    quizCard = `
      <section class="card" id="card-quiz">
        <div class="card-head"><span class="card-icon">📝</span><h2>Chapter Exit Ticket</h2></div>
        <p class="card-note">Quick Check: Test your understanding of the chapter.</p>
        <div class="quiz-question">${esc(data.quick.question)}</div>
        <div class="quiz-choices">${choicesHtml}</div>
        <div id="quizFeedbackContainer">${feedbackHtml}</div>
      </section>
    `;
  }

  // --- Card 5: Illustrated Storyboard ---
  let scenesCard = "";
  if (data.scenes && data.scenes.length) {
    scenesCard = `
    <section class="card" id="card-scenes">
      <div class="card-head"><span class="card-icon">🎬</span><h2>Illustrated Storyboard</h2></div>
      <p class="card-note">Walk through the key moments of the chapter. Select a scene to see details, quotes, and questions.</p>
      <div class="storyboard-container">
        <nav class="scene-nav" aria-label="Scene selection">
          ${data.scenes
            .map(
              (s, idx) => `
            <button class="scene-tab-btn${idx === 0 ? " active" : ""}" type="button" data-scene-idx="${idx}" aria-controls="activeScenePanel">
              <span class="scene-tab-num">${s.n}</span>
              <span class="scene-tab-label">${esc(s.title)}</span>
            </button>`,
            )
            .join("")}
        </nav>
        <div class="scene-panel" id="activeScenePanel" aria-live="polite">
          <!-- Rendered dynamically -->
        </div>
      </div>
    </section>`;
  }

  setHTML(
    "#cardDeck",
    `
    <div class="layout-overview">
      ${charactersCard}
      ${eventsCard}
      ${importantCard}
    </div>
    <div class="layout-interactive">
      <div class="layout-main">
        ${scenesCard}
        ${journalCard}
      </div>
      <div class="layout-side">
        ${vocabularyCard}
        ${quizCard}
      </div>
    </div>
    `
  );

  // --- Storyboard Display Panel Logic ---
  if (data.scenes && data.scenes.length) {
    const activePanel = document.getElementById("activeScenePanel");
    if (activePanel) {
      activePanel.innerHTML = renderActiveScene(data.scenes[0], data.chapter);
    }

    const tabs = document.querySelectorAll(".scene-tab-btn");
    tabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        const btn = e.currentTarget;
        const idx = parseInt(btn.dataset.sceneIdx, 10);

        tabs.forEach((t) => t.classList.remove("active"));
        btn.classList.add("active");

        const panel = document.getElementById("activeScenePanel");
        if (panel) {
          panel.style.opacity = 0;
          setTimeout(() => {
            panel.innerHTML = renderActiveScene(data.scenes[idx], data.chapter);
            panel.style.opacity = 1;
          }, 150);
        }
      });
    });
  }

  // --- Journal Studio Hookup ---
  const textarea = document.getElementById("journalTextarea");
  const journalStatus = document.getElementById("journalStatus");
  if (textarea && journalStatus) {
    const journalKey = `neft_bor_journal_ch${data.chapter}`;
    textarea.value = localStorage.getItem(journalKey) || "";
    
    // Update print-only text initially
    const printJournal = document.getElementById("printJournalContent");
    if (printJournal) {
      printJournal.textContent = textarea.value || "(No journal entry written yet.)";
    }
    
    let saveTimeout;
    textarea.addEventListener("input", () => {
      journalStatus.textContent = "Saving...";
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        localStorage.setItem(journalKey, textarea.value);
        journalStatus.textContent = "Saved locally";
        if (printJournal) {
          printJournal.textContent = textarea.value || "(No journal entry written yet.)";
        }
      }, 500);
    });
  }

  // --- Flashcards Mode Hookup ---
  const toggleVocabBtn = document.getElementById("toggleVocabModeBtn");
  const vocabContainer = document.getElementById("vocabContainer");
  const vocabNote = document.getElementById("vocabCardNote");
  if (toggleVocabBtn && vocabContainer && vocabNote) {
    let cardMode = false;
    let activeCardIdx = 0;
    
    // Build flashcards HTML
    const cardsHtml = `
      <div class="vocab-flashcard-deck">
        ${(data.vocab || []).map((v, idx) => `
          <div class="vocab-card-wrapper${idx === 0 ? ' active' : ''}" data-card-idx="${idx}">
            <div class="vocab-card-inner">
              <div class="vocab-card-front">
                <span class="vocab-card-emoji">${v[2] || '📖'}</span>
                <div class="vocab-card-word">${esc(v[0])}</div>
                <p class="vocab-card-hint">Click to reveal definition</p>
                <button class="speak" type="button" data-text="${esc(v[0])}" title="Read aloud" style="position:absolute; bottom:12px; right:12px;">🔊</button>
              </div>
              <div class="vocab-card-back">
                <div class="vocab-card-word-mini">${esc(v[0])}</div>
                <p class="vocab-card-def">${esc(v[1])}</p>
                <button class="speak" type="button" data-text="${esc(v[0])}: ${esc(v[1])}" title="Read aloud" style="position:absolute; bottom:12px; right:12px;">🔊</button>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
      <div class="vocab-card-controls">
        <button id="prevVocabCardBtn" type="button">◀ Previous</button>
        <span id="vocabCardCounter">1 of ${data.vocab.length}</span>
        <button id="nextVocabCardBtn" type="button">Next ▶</button>
      </div>
    `;
    
    toggleVocabBtn.addEventListener("click", () => {
      cardMode = !cardMode;
      if (cardMode) {
        toggleVocabBtn.textContent = "List View";
        toggleVocabBtn.classList.add("active-mode");
        vocabNote.textContent = "Click a card to flip it over. Use controls to navigate.";
        vocabContainer.innerHTML = cardsHtml;
        activeCardIdx = 0;
        setupFlashcardListeners();
      } else {
        toggleVocabBtn.textContent = "Study Cards";
        toggleVocabBtn.classList.remove("active-mode");
        vocabNote.textContent = "Words to know. Tap 🔊 to hear each one.";
        vocabContainer.innerHTML = `<ul class="vocab">${vocab}</ul>`;
      }
    });
    
    function setupFlashcardListeners() {
      const wrappers = document.querySelectorAll(".vocab-card-wrapper");
      wrappers.forEach(wrap => {
        wrap.addEventListener("click", (e) => {
          if (e.target.closest(".speak")) return;
          wrap.classList.toggle("flipped");
        });
      });
      
      const prevBtn = document.getElementById("prevVocabCardBtn");
      const nextBtn = document.getElementById("nextVocabCardBtn");
      const counter = document.getElementById("vocabCardCounter");
      
      const updateCardNav = () => {
        wrappers.forEach((w, i) => {
          w.classList.remove("active", "flipped");
          if (i === activeCardIdx) w.classList.add("active");
        });
        counter.textContent = `${activeCardIdx + 1} of ${wrappers.length}`;
      };
      
      if (prevBtn) {
        prevBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          activeCardIdx = (activeCardIdx - 1 + wrappers.length) % wrappers.length;
          updateCardNav();
        });
      }
      
      if (nextBtn) {
        nextBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          activeCardIdx = (activeCardIdx + 1) % wrappers.length;
          updateCardNav();
        });
      }
    }
  }

  // --- Dynamic Completion Button ---
  const heroActions = document.querySelector(".hero-actions");
  if (heroActions) {
    if (!document.getElementById("completeBtn")) {
      const isCompleted = completedSet().has(data.chapter);
      const completeBtn = document.createElement("button");
      completeBtn.id = "completeBtn";
      completeBtn.type = "button";
      completeBtn.className = isCompleted ? "btn gold completed" : "btn clear";
      completeBtn.innerHTML = isCompleted ? "✓ Completed" : "Mark Completed";
      completeBtn.style.transition = "all 0.2s";
      heroActions.appendChild(completeBtn);
      
      completeBtn.addEventListener("click", () => {
        const done = completedSet();
        const num = data.chapter;
        let nowDone = false;
        
        if (done.has(num)) {
          done.delete(num);
          completeBtn.className = "btn clear";
          completeBtn.innerHTML = "Mark Completed";
        } else {
          done.add(num);
          completeBtn.className = "btn gold completed";
          completeBtn.innerHTML = "✓ Completed";
          nowDone = true;
          triggerConfetti();
        }
        
        localStorage.setItem("neft_chapters_completed", JSON.stringify([...done]));
        
        const status = document.getElementById("status");
        if (status) {
          status.textContent = nowDone ? "Chapter marked complete!" : "Chapter incomplete";
          status.classList.add("show");
          setTimeout(() => status.classList.remove("show"), 1400);
        }
      });
    }
  }

  // --- Printable Student Worksheet Builder ---
  let printWorksheetHtml = "";
  if (data.scenes && data.scenes.length) {
    printWorksheetHtml = `
      <div class="print-only">
        <h2 style="text-align:center; border-bottom:3px double #000; padding-bottom:10px; margin-bottom:30px; font-family:'Outfit', sans-serif;">
          Blood on the River — Chapter ${data.chapter} Student Worksheet
        </h2>
        <div style="margin-bottom:20px; font-weight:700;">
          Name: ___________________________ &nbsp;&nbsp;&nbsp;&nbsp; Date: ___________________________
        </div>
        <p style="font-style:italic; margin-bottom:30px;">
          Directions: Read Chapter ${data.chapter}. Write definitions for vocabulary words, write your journal reflection, then answer the questions for each scene below.
        </p>
        
        <h3 style="border-bottom:2px solid #000; margin-top:20px; font-family:'Outfit', sans-serif;">Vocabulary Study</h3>
        <table style="width:100%; border-collapse:collapse; margin-bottom:40px;">
          <thead>
            <tr style="border-bottom:1px solid #000;">
              <th style="text-align:left; width:25%; padding:8px 0;">Word</th>
              <th style="text-align:left; padding:8px 0;">Definition &amp; Notes</th>
            </tr>
          </thead>
          <tbody>
            ${(data.vocab || []).map(v => `
              <tr style="border-bottom:1px dashed #aaa;">
                <td style="padding:12px 0; font-weight:700;">${esc(v[0])} ${v[2] || ''}</td>
                <td style="padding:12px 0; color:#666;">____________________________________________________________________</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <h3 style="border-bottom:2px solid #000; margin-top:20px; font-family:'Outfit', sans-serif; page-break-inside:avoid; break-inside:avoid;">Student Reflections Journal</h3>
        <div style="border:1px solid #999; padding:15px; min-height:220px; font-family:'Plus Jakarta Sans', sans-serif; white-space:pre-wrap; font-size:0.95rem; line-height:24px; background:repeating-linear-gradient(transparent, transparent 23px, #e6eef5 23px, #e6eef5 24px); padding-left:45px; border-left:3px double red; margin-bottom:40px;" id="printJournalContent">
          (No journal entry written yet.)
        </div>
        
        <h3 style="border-bottom:2px solid #000; page-break-before:always; break-before:always; font-family:'Outfit', sans-serif;">Scene-by-Scene Reading Questions</h3>
        ${data.scenes.map(s => {
          const checkQuestions = (s.check || []).map(q => `
            <div class="print-question-item">
              <div class="print-question-text">❓ ${esc(q)}</div>
              <div class="print-writing-lines"></div>
              <div class="print-writing-lines"></div>
              <div class="print-writing-lines"></div>
            </div>
          `).join("");
          
          return `
            <div class="print-scene-item">
              <div class="print-scene-header">Scene ${esc(s.n)}: ${esc(s.title)} (PDF Page ${esc(s.page || 'N/A')})</div>
              <div class="print-scene-quote">Key Quote: "${esc(s.quote)}"</div>
              <div class="print-scene-summary"><strong>Summary:</strong> ${esc(s.summary)}</div>
              <div class="print-scene-check-title">Comprehension &amp; Reflection Questions:</div>
              ${checkQuestions}
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  let printContainer = document.getElementById("printWorksheetContainer");
  if (!printContainer) {
    printContainer = document.createElement("div");
    printContainer.id = "printWorksheetContainer";
    document.body.appendChild(printContainer);
  }
  printContainer.innerHTML = printWorksheetHtml;

  bindInteractions(data);
}

function renderActiveScene(s, chapterNum) {
  const quoteHtml = s.quote
    ? `
    <blockquote class="scene-quote">
      <p>${esc(s.quote)}</p>
      <button class="speak" type="button" data-text="${esc(s.quote)}" title="Read aloud" aria-label="Read quote aloud">🔊</button>
    </blockquote>`
    : "";
  const explainHtml = s.explain
    ? `
    <div class="scene-explain">
      <strong>Why this matters:</strong>
      <p>${esc(s.explain)}</p>
      <button class="speak" type="button" data-text="Why this matters: ${esc(s.explain)}" title="Read aloud" aria-label="Read explanation aloud">🔊</button>
    </div>`
    : "";
  const detailsHtml =
    s.details && s.details.length
      ? `
    <ul class="scene-details">
      ${s.details.map((d) => `<li>${esc(d)}</li>`).join("")}
    </ul>`
      : "";
  const checkHtml =
    s.check && s.check.length
      ? `
    <details class="scene-check">
      <summary>❓ Check for Understanding</summary>
      <div class="scene-check-content">
        <ul>
          ${s.check.map((c) => `<li>${esc(c)}</li>`).join("")}
        </ul>
      </div>
    </details>`
      : "";
  const imgCaption = s.label || s.title || `Scene ${s.n}`;
  const pageRef = s.page ? ` · ${esc(s.page)}` : "";
  const imgPath = `/blood-on-the-river/images/chapter-${chapterNum}.png`;

  return `
    <div class="scene-illustration-container">
      <button class="scene-img-btn" type="button" aria-label="Zoom illustration">
        <img class="scene-img" src="${imgPath}" onerror="this.src='/blood-on-the-river/images/fallback.svg'; this.onerror=null;" alt="${esc(imgCaption)}" loading="lazy">
      </button>
      <div class="scene-img-caption">${esc(imgCaption)}</div>
    </div>
    <div class="scene-info">
      <div class="scene-meta">Scene ${esc(s.n)}${pageRef}</div>
      <h3>${esc(s.title)}</h3>
      ${quoteHtml}
      <p class="scene-summary">${esc(s.summary)}</p>
      ${detailsHtml}
      ${explainHtml}
      ${checkHtml}
    </div>`;
}

function bindInteractions(data) {
  const $ = (s) => document.querySelector(s);
  const status = $("#status");

  function show(msg) {
    if (!status) return;
    status.textContent = msg;
    status.classList.add("show");
    clearTimeout(show.t);
    show.t = setTimeout(() => status.classList.remove("show"), 1400);
  }

  // Inject Speech Speed Selector Dynamically
  const toolsEl = document.querySelector(".tools");
  if (toolsEl && !document.getElementById("speakRateSelector")) {
    const rateContainer = document.createElement("div");
    rateContainer.className = "tools-speed-container";
    rateContainer.innerHTML = `
      <label for="speakRateSelector" class="tools-speed-label">Speech Speed</label>
      <select id="speakRateSelector" aria-label="Speech read aloud speed">
        <option value="0.58" ${window.speakRate === 0.58 ? 'selected' : ''}>Slower (0.6x)</option>
        <option value="0.78" ${window.speakRate === 0.78 ? 'selected' : ''}>Standard (0.8x)</option>
        <option value="1.0" ${window.speakRate === 1.0 ? 'selected' : ''}>Normal (1.0x)</option>
      </select>
    `;
    toolsEl.insertBefore(rateContainer, toolsEl.firstChild);

    const rateSelector = document.getElementById("speakRateSelector");
    if (rateSelector) {
      rateSelector.addEventListener("change", (e) => {
        window.speakRate = parseFloat(e.target.value);
        localStorage.setItem("neft_bor_speak_rate", e.target.value);
      });
    }
  }

  // Event Delegation for clicks on page
  document.addEventListener("click", (e) => {
    // Speak button handler
    const b = e.target.closest(".speak");
    if (b) {
      e.preventDefault();
      const container = b.closest(".vrow, .person, .scene-quote, .scene-explain");
      window.speakText(b.dataset.text, container, b);
      return;
    }

    // Lightbox image click handler
    const btn = e.target.closest(".scene-img-btn");
    if (btn) {
      const img = btn.querySelector(".scene-img");
      if (img) {
        openLightbox(img.src, img.alt, btn);
      }
    }
  });

  // Exit Ticket Quiz Interactivity
  if (data.quick) {
    const quizCardEl = document.getElementById("card-quiz");
    if (quizCardEl) {
      const choicesBtns = quizCardEl.querySelectorAll(".quiz-choice-btn");
      const feedbackContainer = document.getElementById("quizFeedbackContainer");
      const correctIdx = data.quick.correct;

      choicesBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          const selectedIdx = parseInt(btn.dataset.choiceIdx, 10);
          const quizChoiceKey = `neft_bor_quiz_ch${data.chapter}`;

          if (selectedIdx === correctIdx) {
            localStorage.setItem(quizChoiceKey, selectedIdx);
            choicesBtns.forEach(b => {
              b.disabled = true;
              b.classList.remove("incorrect");
              if (parseInt(b.dataset.choiceIdx, 10) === correctIdx) {
                b.classList.add("correct");
              }
            });
            feedbackContainer.innerHTML = `<div class="quiz-feedback correct">✓ ${esc(data.quick.feedback || "Correct!")}</div>`;
            triggerConfetti();
          } else {
            btn.classList.add("incorrect");
            btn.disabled = true;
            feedbackContainer.innerHTML = `<div class="quiz-feedback incorrect">✗ Not quite. Try another choice!</div>`;
          }
        });
      });
    }
  }

  const printBtn = $("#printBtn");
  if (printBtn) printBtn.addEventListener("click", () => window.print());
  const topBtn = $("#topBtn");
  if (topBtn)
    topBtn.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );
  const largeBtn = $("#largeTextBtn");
  if (largeBtn)
    largeBtn.addEventListener("click", () => {
      document.body.classList.toggle("large-text");
      show(
        document.body.classList.contains("large-text")
          ? "Large text on"
          : "Large text off",
      );
    });
  const contrastBtn = $("#contrastBtn");
  if (contrastBtn)
    contrastBtn.addEventListener("click", () => {
      document.body.classList.toggle("high-contrast");
      show(
        document.body.classList.contains("high-contrast")
          ? "High contrast on"
          : "High contrast off",
      );
    });
}

function completedSet() {
  try {
    return new Set(
      JSON.parse(
        localStorage.getItem("neft_chapters_completed") || "[]",
      ).map(Number),
    );
  } catch (e) {
    return new Set();
  }
}

function triggerConfetti() {
  const colors = ["#d6a84f", "#1d6f73", "#132238", "#9f3434", "#fffaf0"];
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100vw";
  container.style.height = "100vh";
  container.style.pointerEvents = "none";
  container.style.zIndex = "9999";
  document.body.appendChild(container);
  
  for (let i = 0; i < 50; i++) {
    const p = document.createElement("div");
    p.style.position = "absolute";
    p.style.width = Math.random() * 8 + 6 + "px";
    p.style.height = Math.random() * 8 + 6 + "px";
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    p.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    p.style.left = "50%";
    p.style.bottom = "10%";
    p.style.opacity = "1";
    
    const angle = Math.random() * Math.PI - Math.PI; // upwards
    const speed = Math.random() * 15 + 12;
    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.9;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    let opacity = 1;
    
    container.appendChild(p);
    
    function update() {
      x += vx;
      y += vy;
      vy += 0.45; // gravity
      vx *= 0.98; // drag
      opacity -= 0.015;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.opacity = opacity;
      p.style.transform = `rotate(${y}deg)`;
      
      if (opacity > 0) {
        requestAnimationFrame(update);
      } else {
        p.remove();
      }
    }
    requestAnimationFrame(update);
  }
  
  setTimeout(() => container.remove(), 3000);
}

let activeTriggerElement = null;

function openLightbox(src, alt, triggerEl) {
  activeTriggerElement = triggerEl;
  let lightbox = document.getElementById("lightboxModal");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "lightboxModal";
    lightbox.className = "lightbox-modal";
    lightbox.innerHTML = `
      <button class="lightbox-close" type="button" aria-label="Close image view">&times;</button>
      <div class="lightbox-content">
        <img class="lightbox-img" src="" alt="">
        <div class="lightbox-caption"></div>
      </div>
    `;
    document.body.appendChild(lightbox);

    // Close handlers
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox || e.target.closest(".lightbox-close")) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("open")) {
        closeLightbox();
      }
    });
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    if (activeTriggerElement) {
      activeTriggerElement.focus();
      activeTriggerElement = null;
    }
  }

  const lightboxImg = lightbox.querySelector(".lightbox-img");
  const lightboxCaption = lightbox.querySelector(".lightbox-caption");
  lightboxImg.src = src;
  lightboxImg.alt = alt;
  lightboxCaption.textContent = alt;

  lightbox.classList.add("open");
  const closeBtn = lightbox.querySelector(".lightbox-close");
  if (closeBtn) {
    requestAnimationFrame(() => {
      closeBtn.focus();
    });
  }
}
