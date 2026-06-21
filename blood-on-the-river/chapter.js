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

// Slow, clear read-aloud for ESOL support.
window.speakText = function (text, lang = "en") {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "es" ? "es-ES" : "en-US";
  u.rate = 0.78;
  u.pitch = 1.05;
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
      <div class="card-head"><span class="card-icon">📖</span><h2>Vocabulary</h2></div>
      <p class="card-note">Words to know. Tap 🔊 to hear each one.</p>
      <ul class="vocab">${vocab}</ul>
    </section>`
    : "";

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
    charactersCard + eventsCard + importantCard + vocabularyCard + scenesCard,
  );

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
          Directions: Read Chapter ${data.chapter}. Write definitions for vocabulary words, then answer the questions for each scene below.
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

  bindInteractions();
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
      <img class="scene-img" src="${imgPath}" onerror="this.src='/blood-on-the-river/images/fallback.svg'; this.onerror=null;" alt="${esc(imgCaption)}" loading="lazy">
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

function bindInteractions() {
  const $ = (s) => document.querySelector(s);
  const status = $("#status");

  function show(msg) {
    if (!status) return;
    status.textContent = msg;
    status.classList.add("show");
    clearTimeout(show.t);
    show.t = setTimeout(() => status.classList.remove("show"), 1400);
  }

  // Read-aloud (character names + vocabulary).
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".speak");
    if (b) {
      e.preventDefault();
      window.speakText(b.dataset.text, "en");
    }
  });

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
