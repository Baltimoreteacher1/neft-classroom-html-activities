// Dedicated Bilingual Family Route (/family/bcpss/{unitId})

const LANGS = {
  en: {
    dir: "ltr",
    kickerPrefix: "What We Are Learning",
    questionsHeading: "Talk Together at Home",
    wordsHeading: "Key Words to Practice",
    tip: "Tip: Ask these questions in the language your family feels most comfortable speaking.",
  },
  es: {
    dir: "ltr",
    kickerPrefix: "Lo que estamos aprendiendo",
    questionsHeading: "Preguntas para conversar en casa",
    wordsHeading: "Palabras clave de la unidad",
    tip: "Consejo: Haga estas preguntas en el idioma en que su familia se sienta más cómoda.",
  },
};

const state = {
  unitId: "",
  lang: "en",
  data: null,
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

function parseUnitId() {
  const m = window.location.pathname.match(/^\/family\/bcpss\/([^/]+)\/?$/);
  if (m) return decodeURIComponent(m[1]);
  const q = new URLSearchParams(window.location.search);
  return q.get("unit") || q.get("unitId") || "";
}

function applyLangChrome() {
  const meta = LANGS[state.lang] || LANGS.en;
  document.documentElement.lang = state.lang;
  document.documentElement.dir = meta.dir;
  for (const btn of document.querySelectorAll("[data-lang]")) {
    btn.setAttribute("aria-pressed", btn.dataset.lang === state.lang ? "true" : "false");
  }
  const url = new URL(window.location.href);
  url.searchParams.set("lang", state.lang);
  history.replaceState(null, "", url.pathname + url.search);
}

function extractEntry(data, lang) {
  const unit = data?.unit || {};
  const bridge =
    safeParseJson(
      data?.family_bridge || data?.family || data?.translations || unit.family_bridge_json,
      {},
    ) || {};
  const entry = bridge[lang] || bridge.en || {};
  const fallbackVocab = safeParseJson(
    data?.key_words || data?.vocab || data?.connections?.[0]?.tier2_tier3_vocab,
    [],
  );
  const questions = Array.isArray(entry.dinner_questions)
    ? entry.dinner_questions
    : Array.isArray(entry.questions)
      ? entry.questions
      : Array.isArray(entry.conversation_starters)
        ? entry.conversation_starters
        : [
            `Ask your child what they learned today in Unit ${unit.unit_number || ""}: ${unit.unit_title || ""}.`,
            "Ask your child to give an example from everyday life using one of the key words below.",
          ];
  const rawWords = Array.isArray(entry.key_words)
    ? entry.key_words
    : Array.isArray(entry.words)
      ? entry.words
      : Array.isArray(entry.vocabulary)
        ? entry.vocabulary
        : Array.isArray(fallbackVocab)
          ? fallbackVocab
          : [];
  const words = rawWords
    .map((w) => {
      if (typeof w === "string") return { word: w, translation: "" };
      if (!w || typeof w !== "object") return null;
      return {
        word: w.word || w.term || w.en || "",
        translation: w.translation || w.home_language || w.equivalent || w.cognate_hint || w.cognate || w.hint || "",
      };
    })
    .filter((w) => w && w.word);

  return {
    unit,
    title: entry.title || `Unit ${unit.unit_number || ""}: ${unit.unit_title || "Family Guide"}`,
    summary:
      entry.summary ||
      unit.unit_summary ||
      "Support your child's school learning with quick, everyday conversations at home.",
    questions,
    words,
  };
}

function render() {
  const root = document.getElementById("familyCardRoot");
  if (!state.data) return;
  const meta = LANGS[state.lang] || LANGS.en;
  const { unit, title, summary, questions, words } = extractEntry(state.data, state.lang);
  const gradeText = String(unit.grade) === "K" ? "Kindergarten" : `Grade ${unit.grade || ""}`;

  root.innerHTML = `
    <article class="fb-card">
      <div>
        <span class="fb-kicker">${esc(meta.kickerPrefix)} · ${esc(gradeText)} ${esc(unit.curriculum_name || unit.subject || "")}</span>
        <h1>${esc(title)}</h1>
        <p class="fb-summary">${esc(summary)}</p>
      </div>

      <section class="fb-section">
        <h2>${esc(meta.questionsHeading)}</h2>
        <ul class="fb-question-list">
          ${questions.map((q) => `<li>${esc(q)}</li>`).join("")}
        </ul>
        <p style="margin:0.75rem 0 0;font-size:0.9rem;color:var(--ink-3)">${esc(meta.tip)}</p>
      </section>

      ${
        words.length
          ? `<section class="fb-section">
              <h2>${esc(meta.wordsHeading)}</h2>
              <div class="fb-word-grid">
                ${words
                  .map(
                    (w) => `
                      <div class="fb-word-card">
                        <span class="fb-word-en">${esc(w.word)}</span>
                        ${w.translation ? `<span class="fb-word-tr">${esc(w.translation)}</span>` : ""}
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            </section>`
          : ""
      }
    </article>
  `;
}

async function init() {
  state.unitId = parseUnitId();
  const qLang = new URLSearchParams(window.location.search).get("lang");
  if (qLang && LANGS[qLang]) state.lang = qLang;

  document.querySelector(".fb-lang-bar")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang]");
    if (!btn) return;
    const next = btn.dataset.lang;
    if (LANGS[next] && next !== state.lang) {
      state.lang = next;
      applyLangChrome();
      render();
    }
  });

  applyLangChrome();

  const root = document.getElementById("familyCardRoot");
  if (!state.unitId) {
    root.innerHTML = `<div class="fb-status fb-error" role="alert">No BCPSS unit was specified in this link. Ask your child's teacher for the unit QR code or family link.</div>`;
    return;
  }

  try {
    const res = await fetch(`/api/bcpss/family/${encodeURIComponent(state.unitId)}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Unable to load family guide (${res.status})`);
    state.data = await res.json();
    render();
  } catch (err) {
    root.innerHTML = `<div class="fb-status fb-error" role="alert">${esc(err.message)}</div>`;
  }
}

init();
