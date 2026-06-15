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

  setHTML(
    "#cardDeck",
    charactersCard + eventsCard + importantCard + vocabularyCard,
  );

  bindInteractions();
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
