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

function getSceneSvgDataUri(s, chapterNum) {
  const kind = (s.kind || "default").toLowerCase();
  const title = s.title || `Scene ${s.n}`;
  const label = s.label || `Scene ${s.n}`;
  const escTitle = esc(title);
  const escLabel = esc(label);
  const chText = `CHAPTER ${chapterNum}`;
  const scText = `SCENE ${s.n}`;

  // Theme configuration based on scene kind
  let bgStart = "#132238";
  let bgEnd = "#25465d";
  let themeColor = "#d6a84f"; // gold
  let secondaryColor = "#1d6f73"; // teal

  if (["prophecy", "locket", "trust"].includes(kind)) {
    // Mystical/warm golden
    bgStart = "#1e0f35";
    bgEnd = "#132238";
    themeColor = "#d6a84f";
    secondaryColor = "#8b5cf6";
  } else if (["street", "docks", "deck", "poorhouse", "jail", "bridge"].includes(kind)) {
    // Cold London nights / stone / dark docks
    bgStart = "#0f172a";
    bgEnd = "#1e293b";
    themeColor = "#d6a84f";
    secondaryColor = "#475569";
  } else if (["threat", "wire", "capture", "fight", "attack", "conflict"].includes(kind)) {
    // High danger / violence / crimson
    bgStart = "#450a0a";
    bgEnd = "#180202";
    themeColor = "#ef4444";
    secondaryColor = "#d6a84f";
  } else if (["forest", "native", "camp", "fort", "island", "work"].includes(kind)) {
    // Wilderness / earthy greens / brown
    bgStart = "#064e3b";
    bgEnd = "#132238";
    themeColor = "#d6a84f";
    secondaryColor = "#10b981";
  } else if (["sea", "ships", "ship", "river", "journey"].includes(kind)) {
    // Ocean / water / horizon
    bgStart = "#1e3a8a";
    bgEnd = "#0f172a";
    themeColor = "#3b82f6";
    secondaryColor = "#d6a84f";
  } else if (["smith", "power", "leaders", "gentlemen"].includes(kind)) {
    // Royal gold / fire / power
    bgStart = "#2e1065";
    bgEnd = "#0f172a";
    themeColor = "#d6a84f";
    secondaryColor = "#f59e0b";
  }

  // Define unique paths for each kind
  let pathContent = "";
  switch (kind) {
    case "prophecy":
      pathContent = `
        <circle cx="250" cy="230" r="70" fill="url(#glowGrad)" filter="url(#glowFilter)" opacity="0.15" />
        <path d="M160,160 L340,160 C360,160 360,180 340,180 L160,180 C140,180 140,160 160,160 Z M160,180 L160,300 C160,310 180,310 180,300 L180,180 Z M340,180 L340,280 C340,290 320,290 320,280 L320,180 Z M180,190 L320,190 L320,270 L180,270 Z" fill="#fffaf0" />
        <polygon points="250,200 255,215 270,215 258,225 262,240 250,230 238,240 242,225 230,215 245,215" fill="#d6a84f" />
        <circle cx="150" cy="120" r="2" fill="#fff" />
        <circle cx="350" cy="110" r="3" fill="#fff" />
        <circle cx="200" cy="140" r="1.5" fill="#fff" />
        <circle cx="310" cy="130" r="2" fill="#fff" />
      `;
      break;
    case "street":
      pathContent = `
        <path d="M220,150 L280,150 L265,220 L235,220 Z M250,110 L250,150" fill="none" stroke="#d6a84f" stroke-width="4" stroke-linecap="round" />
        <path d="M225,220 L275,220 L250,250 Z" fill="#d6a84f" />
        <circle cx="250" cy="180" r="25" fill="#ffd043" filter="url(#glowFilter)" opacity="0.6" />
        <path d="M100,320 C150,300 200,340 250,310 C300,330 350,300 400,320" fill="none" stroke="#475569" stroke-width="6" stroke-linecap="round" />
        <path d="M80,345 C140,320 220,350 280,330 C340,350 420,330 440,345" fill="none" stroke="#334155" stroke-width="6" stroke-linecap="round" />
      `;
      break;
    case "locket":
      pathContent = `
        <path d="M150,120 Q250,220 350,120" fill="none" stroke="#a1a1aa" stroke-width="3" stroke-dasharray="10,6" />
        <path d="M250,210 C220,165 160,175 180,235 C200,285 250,325 250,325 C250,325 300,285 320,235 C340,175 280,165 250,210 Z" fill="url(#goldGrad)" stroke="#d6a84f" stroke-width="4" />
        <path d="M250,210 L250,325" stroke="#78350f" stroke-width="2" opacity="0.4" />
        <polygon points="210,210 213,218 221,221 213,224 210,232 207,224 199,221 207,218" fill="#fff" />
      `;
      break;
    case "wire":
      pathContent = `
        <path d="M80,230 Q250,180 420,230" fill="none" stroke="#ef4444" stroke-width="5" />
        <path d="M160,205 L175,225 M175,205 L160,225" stroke="#ef4444" stroke-width="4" />
        <path d="M240,195 L255,215 M255,195 L240,215" stroke="#ef4444" stroke-width="4" />
        <path d="M320,205 L335,225 M335,205 L320,225" stroke="#ef4444" stroke-width="4" />
        <path d="M250,220 C250,220 238,245 238,255 C238,262 243,268 250,268 C257,268 262,262 262,255 C262,245 250,220 250,220 Z" fill="#ef4444" />
      `;
      break;
    case "docks":
      pathContent = `
        <rect x="160" y="220" width="35" height="150" fill="#334155" rx="3" />
        <rect x="200" y="190" width="45" height="180" fill="#1e293b" rx="3" />
        <rect x="310" y="210" width="30" height="160" fill="#475569" rx="3" />
        <path d="M185,250 C210,250 230,235 240,225" fill="none" stroke="#d6a84f" stroke-width="4" />
        <path d="M185,270 C210,270 235,255 245,245" fill="none" stroke="#d6a84f" stroke-width="4" />
        <path d="M120,130 Q140,110 160,130 Q180,110 200,130" fill="none" stroke="#475569" stroke-width="3" stroke-linecap="round" />
      `;
      break;
    case "poorhouse":
      pathContent = `
        <path d="M100,150 L400,150 M100,270 L400,270 M250,150 L250,270 M160,270 L160,350 M340,270 L340,350" stroke="#334155" stroke-width="3" opacity="0.3" />
        <rect x="170" y="160" width="160" height="150" fill="#090d16" stroke="#475569" stroke-width="8" rx="6" />
        <line x1="210" y1="160" x2="210" y2="310" stroke="#475569" stroke-width="6" />
        <line x1="250" y1="160" x2="250" y2="310" stroke="#475569" stroke-width="6" />
        <line x1="290" y1="160" x2="290" y2="310" stroke="#475569" stroke-width="6" />
        <path d="M210,330 C210,330 210,350 250,350 C290,350 290,330 290,330 Z" fill="#334155" />
      `;
      break;
    case "bridge":
      pathContent = `
        <path d="M50,290 L450,290 L450,250 L410,250 C395,250 395,275 375,275 C355,275 355,250 335,250 C315,250 315,275 295,275 C275,275 275,250 255,250 C235,250 235,275 215,275 C195,275 195,250 175,250 L50,250 Z" fill="#334155" />
        <line x1="250" y1="150" x2="250" y2="250" stroke="#7f1d1d" stroke-width="3" />
        <circle cx="250" cy="140" r="14" fill="#7f1d1d" />
        <path d="M100,310 H400 M130,330 H370" stroke="#1e293b" stroke-width="3" stroke-linecap="round" />
      `;
      break;
    case "capture":
      pathContent = `
        <rect x="210" y="210" width="80" height="70" fill="url(#goldGrad)" stroke="#b45309" stroke-width="3" rx="6" />
        <path d="M225,210 L225,170 C225,140 275,140 275,170 L275,210" fill="none" stroke="#a1a1aa" stroke-width="8" stroke-linecap="round" />
        <circle cx="250" cy="240" r="8" fill="#180202" />
        <path d="M250,248 L250,262" stroke="#180202" stroke-width="4" stroke-linecap="round" />
        <path d="M100,150 Q160,250 100,350 M400,150 Q340,250 400,350" fill="none" stroke="#7f1d1d" stroke-width="5" stroke-dasharray="12,8" opacity="0.6" />
      `;
      break;
    case "threat":
      pathContent = `
        <path d="M160,340 L160,130 L300,130 L300,180" fill="none" stroke="#180202" stroke-width="14" stroke-linecap="square" />
        <path d="M160,170 L200,130" stroke="#180202" stroke-width="10" />
        <path d="M300,180 L300,210" fill="none" stroke="#ffd043" stroke-width="4" />
        <path d="M300,210 C290,212 280,230 280,245 C280,265 300,275 300,275 C300,275 320,265 320,245 C320,230 310,212 300,210 Z" fill="none" stroke="#ffd043" stroke-width="5" stroke-linejoin="round" />
        <polygon points="360,70 310,150 350,150 300,250 380,130 340,130" fill="#ffd043" opacity="0.15" />
      `;
      break;
    case "jail":
      pathContent = `
        <rect x="150" y="140" width="200" height="200" fill="#090d16" stroke="#475569" stroke-width="6" />
        <line x1="190" y1="140" x2="190" y2="340" stroke="#64748b" stroke-width="8" />
        <line x1="230" y1="140" x2="230" y2="340" stroke="#64748b" stroke-width="8" />
        <line x1="270" y1="140" x2="270" y2="340" stroke="#64748b" stroke-width="8" />
        <line x1="310" y1="140" x2="310" y2="340" stroke="#64748b" stroke-width="8" />
        <circle cx="250" cy="300" r="16" fill="none" stroke="#ffd043" stroke-width="4" opacity="0.7" />
        <path d="M262,310 L285,335 M275,325 L285,315" stroke="#ffd043" stroke-width="4" stroke-linecap="round" opacity="0.7" />
      `;
      break;
    case "orphanage":
      pathContent = `
        <polygon points="250,130 140,220 360,220" fill="#1d6f73" />
        <rect x="170" y="220" width="160" height="110" fill="#fffaf0" stroke="#132238" stroke-width="4" />
        <rect x="230" y="260" width="40" height="70" fill="#b45309" />
        <line x1="250" y1="270" x2="250" y2="290" stroke="#ffd043" stroke-width="2" />
        <line x1="240" y1="280" x2="260" y2="280" stroke="#ffd043" stroke-width="2" />
        <path d="M250,105 C250,105 240,92 240,84 C240,77 245,72 250,72 C255,72 260,77 260,84 C260,92 250,105 250,105 Z" fill="#ef4444" />
      `;
      break;
    case "hunt":
      pathContent = `
        <polygon points="250,90 100,350 400,350" fill="url(#goldGrad)" opacity="0.12" />
        <path d="M250,100 L250,260 M200,150 L300,150" fill="none" stroke="#d6a84f" stroke-width="14" stroke-linecap="round" />
        <path d="M140,280 C170,260 240,260 250,280 C260,260 330,260 360,280 L360,335 C330,315 260,315 250,335 C240,315 170,315 140,335 Z" fill="#fffaf0" stroke="#132238" stroke-width="3" />
        <line x1="250" y1="285" x2="250" y2="332" stroke="#475569" stroke-width="2" />
      `;
      break;
    case "fight":
      pathContent = `
        <g stroke="#e2e8f0" stroke-width="8" stroke-linecap="round">
          <line x1="130" y1="320" x2="350" y2="130" />
          <line x1="370" y1="320" x2="150" y2="130" />
        </g>
        <path d="M145,305 L115,335 M135,325 L125,315" stroke="#d6a84f" stroke-width="12" stroke-linecap="round" />
        <path d="M355,305 L385,335 M365,325 L375,315" stroke="#d6a84f" stroke-width="12" stroke-linecap="round" />
        <path d="M250,200 L256,218 L274,221 L256,224 L250,242 L244,224 L226,221 L244,218 Z" fill="#ef4444" />
        <polygon points="250,180 252,192 265,192 255,200 258,212 250,202 242,212 245,200 235,192 248,192" fill="#ffd043" />
      `;
      break;
    case "journey":
      pathContent = `
        <circle cx="250" cy="230" r="90" fill="none" stroke="#d6a84f" stroke-width="5" />
        <circle cx="250" cy="230" r="98" fill="none" stroke="#d6a84f" stroke-width="1" stroke-dasharray="8,4" />
        <polygon points="250,135 260,230 240,230" fill="#ef4444" />
        <polygon points="250,325 260,230 240,230" fill="#e2e8f0" />
        <polygon points="340,230 250,240 250,220" fill="#e2e8f0" />
        <polygon points="160,230 250,240 250,220" fill="#e2e8f0" />
        <circle cx="250" cy="230" r="10" fill="#132238" stroke="#d6a84f" stroke-width="3" />
      `;
      break;
    case "ships":
    case "ship":
      pathContent = `
        <path d="M50,300 C150,270 200,330 350,300 C420,285 450,310 450,300 L450,360 L50,360 Z" fill="#0f172a" />
        <path d="M120,280 L350,280 L380,220 L150,220 Z" fill="url(#goldGrad)" stroke="#132238" stroke-width="3" />
        <line x1="200" y1="220" x2="200" y2="100" stroke="#132238" stroke-width="5" />
        <line x1="300" y1="220" x2="300" y2="110" stroke="#132238" stroke-width="5" />
        <path d="M200,110 C160,130 160,190 200,210 Z" fill="#fffaf0" opacity="0.9" />
        <path d="M300,120 C270,140 270,190 300,210 Z" fill="#fffaf0" opacity="0.9" />
        <path d="M200,100 L220,105 L200,110 Z" fill="#ef4444" />
      `;
      break;
    case "smith":
      pathContent = `
        <path d="M140,280 L360,280 L340,200 L280,200 L290,160 L190,160 L200,200 L140,200 Z" fill="#334155" stroke="#475569" stroke-width="4" stroke-linejoin="round" />
        <circle cx="200" cy="130" r="4" fill="#ffd043" filter="url(#glowFilter)" />
        <circle cx="280" cy="120" r="5" fill="#f97316" filter="url(#glowFilter)" />
        <circle cx="250" cy="90" r="3" fill="#ffd043" />
        <circle cx="310" cy="140" r="4" fill="#f97316" />
        <g transform="rotate(30 250 150)">
          <rect x="230" y="80" width="40" height="25" fill="#475569" rx="2" />
          <rect x="245" y="105" width="10" height="70" fill="#b45309" rx="2" />
        </g>
      `;
      break;
    case "gentlemen":
      pathContent = `
        <path d="M150,220 L350,220" stroke="#132238" stroke-width="12" stroke-linecap="round" />
        <path d="M180,220 Q250,150 320,220 Z" fill="#132238" />
        <path d="M300,210 Q360,140 310,110 C290,130 290,170 300,210 Z" fill="#d6a84f" opacity="0.9" />
        <circle cx="210" cy="270" r="16" fill="url(#goldGrad)" stroke="#b45309" stroke-width="2" />
        <circle cx="245" cy="285" r="16" fill="url(#goldGrad)" stroke="#b45309" stroke-width="2" />
        <circle cx="280" cy="270" r="16" fill="url(#goldGrad)" stroke="#b45309" stroke-width="2" />
      `;
      break;
    case "boys":
      pathContent = `
        <circle cx="190" cy="180" r="30" fill="#fffaf0" />
        <path d="M130,300 C130,240 250,240 250,300 Z" fill="#1d6f73" />
        <circle cx="310" cy="190" r="26" fill="#fffaf0" />
        <path d="M260,300 C260,245 360,245 360,300 Z" fill="#b45309" />
        <polygon points="250,150 253,158 261,161 253,164 250,172 247,164 239,161 247,158" fill="#d6a84f" />
        <polygon points="250,110 252,116 258,118 252,120 250,126 248,120 242,118 248,120" fill="#d6a84f" />
      `;
      break;
    case "crowded":
      pathContent = `
        <circle cx="180" cy="160" r="24" fill="#a1a1aa" />
        <circle cx="250" cy="150" r="26" fill="#d4d4d8" />
        <circle cx="320" cy="170" r="22" fill="#71717a" />
        <circle cx="220" cy="200" r="28" fill="#fffaf0" />
        <circle cx="290" cy="210" r="25" fill="#e4e4e7" />
        <path d="M120,310 C120,250 220,250 220,310 Z" fill="#3f3f46" />
        <path d="M280,310 C280,255 380,255 380,310 Z" fill="#27272a" />
        <path d="M160,320 C160,260 280,260 280,320 Z" fill="#1e293b" />
        <path d="M230,320 C230,265 350,265 350,320 Z" fill="#475569" />
      `;
      break;
    case "deck":
      pathContent = `
        <rect x="50" y="80" width="400" height="40" fill="#451a03" />
        <rect x="50" y="110" width="400" height="15" fill="#78350f" opacity="0.6" />
        <rect x="50" y="310" width="400" height="40" fill="#451a03" />
        <line x1="250" y1="120" x2="230" y2="190" stroke="#d6a84f" stroke-width="4" />
        <circle cx="230" cy="205" r="20" fill="#ffd043" filter="url(#glowFilter)" />
        <path d="M215,190 H245 L240,225 H220 Z" fill="none" stroke="#d6a84f" stroke-width="3" />
      `;
      break;
    case "sick":
      pathContent = `
        <path d="M80,210 Q250,320 420,210" fill="none" stroke="#fffaf0" stroke-width="5" stroke-linecap="round" />
        <path d="M210,140 C210,140 205,148 205,152 C205,156 208,159 211,159 C214,159 217,156 217,152 C217,148 210,140 210,140 Z" fill="#38bdf8" />
        <path d="M290,150 C290,150 285,158 285,162 C285,166 288,169 291,169 C294,169 297,166 297,162 C297,158 290,150 290,150 Z" fill="#38bdf8" />
        <path d="M250,110 L250,170 M220,140 L280,140" fill="none" stroke="#ef4444" stroke-width="8" stroke-linecap="round" />
      `;
      break;
    case "storm":
      pathContent = `
        <path d="M50,290 Q150,180 230,270 T450,240 L450,360 L50,360 Z" fill="#1e3a8a" />
        <path d="M50,320 Q120,220 280,310 T450,280 L450,360 L50,360 Z" fill="#0f172a" opacity="0.8" />
        <polygon points="270,70 210,170 255,170 200,270 300,140 255,140" fill="#fff" filter="url(#glowFilter)" />
        <polygon points="270,70 210,170 255,170 200,270 300,140 255,140" fill="#fff" />
      `;
      break;
    case "sea":
      pathContent = `
        <circle cx="250" cy="220" r="70" fill="#f97316" filter="url(#glowFilter)" opacity="0.8" />
        <circle cx="250" cy="220" r="60" fill="#ffd043" />
        <path d="M50,250 Q150,235 250,250 T450,250 L450,360 L50,360 Z" fill="#1d4ed8" />
        <path d="M50,280 Q150,265 250,280 T450,280 L450,360 L50,360 Z" fill="#1e3a8a" opacity="0.6" />
        <path d="M50,315 Q150,300 250,315 T450,315 L450,360 L50,360 Z" fill="#0f172a" opacity="0.8" />
      `;
      break;
    case "conflict":
      pathContent = `
        <path d="M170,140 L330,140 L330,220 C330,300 250,340 250,340 C250,340 170,300 170,220 Z" fill="none" stroke="#ef4444" stroke-width="8" />
        <path d="M250,140 L240,210 L265,260 L245,335" fill="none" stroke="#ef4444" stroke-width="5" stroke-linecap="round" />
        <polygon points="150,200 160,205 155,215" fill="#ef4444" />
        <polygon points="350,200 340,205 345,215" fill="#ef4444" />
      `;
      break;
    case "leaders":
      pathContent = `
        <path d="M150,240 L180,160 L220,195 L250,150 L280,195 L320,160 L350,240 Z" fill="url(#goldGrad)" stroke="#b45309" stroke-width="3" />
        <circle cx="250" cy="210" r="8" fill="#ef4444" />
        <circle cx="200" cy="220" r="6" fill="#3b82f6" />
        <circle cx="300" cy="220" r="6" fill="#10b981" />
        <path d="M180,310 H320 M250,260 V330" fill="none" stroke="#d6a84f" stroke-width="8" stroke-linecap="round" />
      `;
      break;
    case "power":
      pathContent = `
        <circle cx="250" cy="220" r="90" fill="url(#glowGrad)" filter="url(#glowFilter)" opacity="0.1" />
        <path d="M140,250 L170,150 L215,200 L250,140 L285,200 L330,150 L360,250 Z" fill="url(#goldGrad)" stroke="#d6a84f" stroke-width="4" stroke-linejoin="round" />
        <rect x="140" y="240" width="220" height="15" fill="#78350f" rx="2" />
        <circle cx="250" cy="140" r="8" fill="#fff" filter="url(#glowFilter)" />
        <circle cx="250" cy="140" r="5" fill="#fff" />
      `;
      break;
    case "native":
      pathContent = `
        <path d="M160,270 Q250,120 340,270" fill="none" stroke="#d6a84f" stroke-width="6" stroke-linecap="round" />
        <line x1="175" y1="210" x2="145" y2="170" stroke="#ffd043" stroke-width="8" stroke-linecap="round" />
        <line x1="210" y1="175" x2="185" y2="120" stroke="#9f3434" stroke-width="8" stroke-linecap="round" />
        <line x1="250" y1="165" x2="250" y2="100" stroke="#1d6f73" stroke-width="8" stroke-linecap="round" />
        <line x1="290" y1="175" x2="315" y2="120" stroke="#9f3434" stroke-width="8" stroke-linecap="round" />
        <line x1="325" y1="210" x2="355" y2="170" stroke="#ffd043" stroke-width="8" stroke-linecap="round" />
        <line x1="130" y1="310" x2="370" y2="310" stroke="#fffaf0" stroke-width="4" />
        <polygon points="370,310 355,300 355,320" fill="#fffaf0" />
        <path d="M130,300 L145,310 L130,320" fill="none" stroke="#ffd043" stroke-width="3" />
      `;
      break;
    case "paper":
      pathContent = `
        <path d="M150,140 H330 C350,140 350,165 330,165 H170 C150,165 150,190 170,190 H350" fill="none" stroke="#fffaf0" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
        <line x1="190" y1="230" x2="310" y2="230" stroke="#d6a84f" stroke-width="3" opacity="0.6" />
        <line x1="190" y1="260" x2="280" y2="260" stroke="#d6a84f" stroke-width="3" opacity="0.6" />
        <line x1="190" y1="290" x2="300" y2="290" stroke="#d6a84f" stroke-width="3" opacity="0.6" />
        <path d="M330,140 Q250,220 180,310" fill="none" stroke="#ffd043" stroke-width="4" stroke-linecap="round" />
      `;
      break;
    case "river":
      pathContent = `
        <path d="M250,120 Q160,200 340,260 T200,380" fill="none" stroke="#1d6f73" stroke-width="36" stroke-linecap="round" />
        <path d="M250,120 Q160,200 340,260 T200,380" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" opacity="0.5" />
        <polygon points="120,160 100,210 140,210" fill="#064e3b" />
        <polygon points="380,220 360,270 400,270" fill="#064e3b" />
        <polygon points="110,290 90,340 130,340" fill="#064e3b" />
      `;
      break;
    case "camp":
      pathContent = `
        <rect x="180" y="280" width="140" height="20" fill="#78350f" rx="3" transform="rotate(20 250 290)" />
        <rect x="180" y="280" width="140" height="20" fill="#78350f" rx="3" transform="rotate(-20 250 290)" />
        <path d="M250,140 C210,210 220,270 250,285 C280,270 290,210 250,140 Z" fill="#ea580c" filter="url(#glowFilter)" opacity="0.8" />
        <path d="M250,140 C210,210 220,270 250,285 C280,270 290,210 250,140 Z" fill="#f97316" />
        <path d="M250,190 C225,230 230,270 250,285 C270,270 275,230 250,190 Z" fill="#ffd043" />
      `;
      break;
    case "forest":
      pathContent = `
        <polygon points="250,100 200,180 300,180" fill="#065f46" />
        <polygon points="250,150 180,250 320,250" fill="#047857" />
        <polygon points="250,210 150,320 350,320" fill="#064e3b" />
        <rect x="235" y="320" width="30" height="40" fill="#78350f" />
      `;
      break;
    case "fort":
      pathContent = `
        <path d="M120,330 V190 L140,160 L160,190 V330 M160,330 V170 L180,140 L200,170 V330 M200,330 V200 L220,170 L240,200 V330 M240,330 V180 L260,150 L280,180 V330 M280,330 V190 L300,160 L320,190 V330 M320,330 V170 L340,140 L360,170 V330" fill="none" stroke="#b45309" stroke-width="4" stroke-linejoin="round" />
        <rect x="100" y="270" width="280" height="20" fill="#78350f" opacity="0.8" />
      `;
      break;
    case "island":
      pathContent = `
        <ellipse cx="250" cy="300" rx="150" ry="35" fill="#fef08a" />
        <rect x="242" y="220" width="16" height="85" fill="#78350f" />
        <polygon points="250,130 210,220 290,220" fill="#064e3b" />
        <polygon points="250,170 190,260 310,260" fill="#047857" />
        <path d="M50,335 C150,325 200,345 350,335 C400,330 450,340 450,335" fill="none" stroke="#1d6f73" stroke-width="4" />
      `;
      break;
    case "trade":
      pathContent = `
        <g stroke="#fffaf0" stroke-width="6" stroke-linecap="round" fill="none">
          <path d="M120,240 H180 L220,260" />
          <path d="M380,240 H320 L280,260" />
          <path d="M220,260 C240,240 260,240 280,260" />
          <path d="M230,270 C245,255 255,255 270,270" stroke-width="4" />
        </g>
        <circle cx="250" cy="180" r="16" fill="url(#goldGrad)" stroke="#b45309" stroke-width="2" />
        <polygon points="250,140 254,148 262,151 254,154 250,162 246,154 238,151 246,148" fill="#ffd043" />
      `;
      break;
    case "trial":
      pathContent = `
        <line x1="160" y1="190" x2="340" y2="190" stroke="#d6a84f" stroke-width="6" stroke-linecap="round" />
        <line x1="250" y1="130" x2="250" y2="310" stroke="#d6a84f" stroke-width="8" />
        <rect x="210" y="310" width="80" height="15" fill="#d6a84f" rx="3" />
        <path d="M160,190 V250 C160,270 190,270 190,250 Z" fill="none" stroke="#d6a84f" stroke-width="3" />
        <path d="M340,190 V250 C340,270 310,270 310,250 Z" fill="none" stroke="#d6a84f" stroke-width="3" />
      `;
      break;
    case "trust":
      pathContent = `
        <circle cx="250" cy="220" r="85" fill="url(#glowGrad)" filter="url(#glowFilter)" opacity="0.15" />
        <path d="M170,150 L330,150 L330,230 C330,310 250,350 250,350 C250,350 170,310 170,230 Z" fill="none" stroke="#d6a84f" stroke-width="6" stroke-linejoin="round" />
        <path d="M250,225 C250,225 235,210 235,200 C235,190 243,182 250,182 C257,182 265,190 265,200 C265,210 250,225 250,225 Z" fill="#d6a84f" />
        <circle cx="250" cy="265" r="12" fill="none" stroke="#d6a84f" stroke-width="3" />
        <line x1="250" y1="277" x2="250" y2="295" stroke="#d6a84f" stroke-width="3" />
        <line x1="250" y1="285" x2="260" y2="285" stroke="#d6a84f" stroke-width="3" />
      `;
      break;
    case "virginia":
      pathContent = `
        <path d="M110,130 Q160,180 230,170 T310,240 T390,320" fill="none" stroke="#d6a84f" stroke-width="4" stroke-linecap="round" />
        <path d="M110,130 Q160,180 230,170 T310,240 T390,320 L390,350 L110,350 Z" fill="#1d6f73" opacity="0.2" />
        <g transform="translate(320 140)">
          <circle cx="0" cy="0" r="25" fill="none" stroke="#fffaf0" stroke-width="2" />
          <line x1="0" y1="-35" x2="0" y2="35" stroke="#fffaf0" stroke-width="2" />
          <line x1="-35" y1="0" x2="35" y2="0" stroke="#fffaf0" stroke-width="2" />
          <polygon points="0,-35 4,-10 -4,-10" fill="#ef4444" />
        </g>
      `;
      break;
    case "wingfield":
      pathContent = `
        <rect x="150" y="210" width="200" height="120" fill="#451a03" stroke="#d6a84f" stroke-width="4" rx="4" />
        <rect x="150" y="250" width="200" height="10" fill="#78350f" opacity="0.6" />
        <rect x="190" y="210" width="15" height="120" fill="#475569" />
        <rect x="295" y="210" width="15" height="120" fill="#475569" />
        <rect x="235" y="245" width="30" height="40" fill="#d6a84f" rx="3" />
        <circle cx="250" cy="260" r="5" fill="#111827" />
        <line x1="250" y1="265" x2="250" y2="280" stroke="#111827" stroke-width="3" />
      `;
      break;
    case "work":
      pathContent = `
        <g stroke="#e2e8f0" stroke-width="6" stroke-linecap="round" fill="none">
          <line x1="140" y1="320" x2="340" y2="120" />
          <line x1="360" y1="320" x2="160" y2="120" />
        </g>
        <path d="M330,110 L355,135 L335,155 L310,130 Z" fill="#64748b" stroke="#334155" stroke-width="2" />
        <path d="M135,145 Q165,115 195,145" fill="none" stroke="#475569" stroke-width="8" stroke-linecap="round" />
        <circle cx="140" cy="320" r="6" fill="#b45309" />
        <circle cx="360" cy="320" r="6" fill="#b45309" />
      `;
      break;
    case "attack":
      pathContent = `
        <line x1="140" y1="320" x2="330" y2="130" stroke="#fffaf0" stroke-width="4" stroke-linecap="round" />
        <polygon points="330,130 310,145 320,155" fill="#fffaf0" />
        <path d="M140,320 L125,335 M150,330 L135,345" stroke="#ef4444" stroke-width="4" />
        <path d="M330,130 C340,110 360,115 365,120 C370,125 365,145 345,155 C335,160 325,145 330,130 Z" fill="#ea580c" filter="url(#glowFilter)" opacity="0.8" />
        <path d="M330,130 C340,110 360,115 365,120 C370,125 365,145 345,155 C335,160 325,145 330,130 Z" fill="#ffd043" />
      `;
      break;
    default:
      pathContent = `
        <path d="M150,300 C150,310 180,330 250,330 C320,330 350,310 350,300 L370,260 C320,270 250,270 130,260 Z" fill="#d6a84f" opacity="0.8"/>
        <path d="M250,120 L250,300 M190,160 L190,280 M310,180 L310,280" stroke="#d6a84f" stroke-width="3" stroke-linecap="round"/>
        <path d="M250,130 C220,140 210,180 250,200 C220,210 210,260 250,280 Z" fill="#fff" opacity="0.15"/>
        <path d="M250,130 C280,140 290,180 250,200 C280,210 290,260 250,280 Z" fill="#fff" opacity="0.15"/>
        <path d="M190,170 C170,180 160,210 190,220 C170,225 160,255 190,270 Z" fill="#fff" opacity="0.15"/>
        <path d="M310,190 C330,200 340,225 310,235 C330,240 340,265 310,275 Z" fill="#fff" opacity="0.15"/>
        <path d="M80,360 Q125,340 170,360 T260,360 T350,360 T430,360" fill="none" stroke="#1d6f73" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
      `;
      break;
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%" style="background: ${bgStart}; background: linear-gradient(135deg, ${bgStart}, ${bgEnd}); border-radius: 12px; font-family: 'Outfit', sans-serif;">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#d6a84f" />
      <stop offset="100%" stop-color="#854d0e" />
    </linearGradient>
    
    <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffd043" stop-opacity="1" />
      <stop offset="100%" stop-color="#ffd043" stop-opacity="0" />
    </radialGradient>
    
    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect x="15" y="15" width="470" height="470" fill="none" stroke="${themeColor}" stroke-width="3" rx="8" />
  <rect x="22" y="22" width="456" height="456" fill="none" stroke="${themeColor}" stroke-width="1" rx="6" opacity="0.4" />
  
  <path d="M15,35 L35,15 M465,15 L485,35 M485,465 L465,485 M35,485 L15,465" stroke="${themeColor}" stroke-width="2" />
  
  <g id="illustration-graphic">
    ${pathContent}
  </g>

  <text x="250" y="55" text-anchor="middle" fill="${themeColor}" font-size="14" font-weight="900" letter-spacing="4">BLOOD ON THE RIVER</text>
  
  <g>
    <rect x="70" y="405" width="360" height="48" fill="#132238" stroke="${themeColor}" stroke-width="2" rx="6" />
    <text x="250" y="426" text-anchor="middle" fill="#fffaf0" font-size="12" font-weight="700" letter-spacing="1.5">${chText} · ${scText}</text>
    <text x="250" y="442" text-anchor="middle" fill="${themeColor}" font-size="10" font-weight="800" opacity="0.8" letter-spacing="1">${escLabel.toUpperCase()}</text>
  </g>
</svg>
  `.trim();

  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
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
  
  // Look for a scene-specific image file first (e.g. /blood-on-the-river/images/chapter-1/scene-01.png)
  const sceneImgName = `scene-${s.n}.png`;
  const imgPath = `/blood-on-the-river/images/chapter-${chapterNum}/${sceneImgName}`;
  const svgDataUri = getSceneSvgDataUri(s, chapterNum);

  return `
    <div class="scene-illustration-container">
      <button class="scene-img-btn" type="button" aria-label="Zoom illustration">
        <img class="scene-img" src="${imgPath}" onerror="this.src='${svgDataUri}'; this.onerror=null;" alt="${esc(imgCaption)}" loading="lazy">
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
