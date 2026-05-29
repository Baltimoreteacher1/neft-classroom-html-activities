// vocab-explore-tasks.js — Active sense-making micro-loops for the vocab
// "Explore" experience. Pure vanilla JS, no dependencies. Used by
// vocab-explore.js to build a multi-step, do-something-and-get-feedback loop
// for each term (instead of a passive flip card).
//
// Also exports the bilingual (English + Spanish) helpers shared across the
// explorer: escapeHtml, bilingualTerm/Definition rendering, and a guarded
// speechSynthesis "Say it" control that speaks en-US and es-ES separately.
//
// Bilingual fields consumed from each term (all optional):
//   termEs        — Spanish translation of the word
//   definitionEs  — Spanish plain-language definition
// If a Spanish field is absent we gracefully show English only. We NEVER
// machine-translate; Spanish is rendered verbatim from config.

// ── Escaping (XSS guard) ────────────────────────────────────────────────────
export function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Speech (guarded) ────────────────────────────────────────────────────────
export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text, lang) {
  if (!speechSupported() || !text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = lang || "en-US";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch (_) {
    /* no-op if speech fails */
  }
}

// Build the EN / ES "Say it" row. Spanish button only appears when a Spanish
// string is provided. Returns the row element.
export function buildSayItRow({ en, enLang = "en-US", es, esLang = "es-ES" }) {
  const row = document.createElement("div");
  row.style.cssText =
    "display:flex; gap:var(--sp-2); flex-wrap:wrap; align-items:center;";
  const supported = speechSupported();

  const mk = (label, ariaWord, text, lang, klass) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = klass;
    b.style.cssText = "min-height:44px;";
    b.textContent = label;
    if (supported && text) {
      b.setAttribute("aria-label", ariaWord);
      b.addEventListener("click", () => speak(text, lang));
    } else {
      b.disabled = true;
      b.title = "Audio is not available in this browser.";
      b.setAttribute("aria-label", `${ariaWord} — audio not available`);
    }
    return b;
  };

  row.append(
    mk(
      `🔊 Say it (EN)`,
      `Hear "${en}" in English`,
      en,
      enLang,
      "btn btn-amber",
    ),
  );
  if (es) {
    row.append(
      mk(
        `🔊 Dilo (ES)`,
        `Hear "${es}" in Spanish`,
        es,
        esLang,
        "btn btn-secondary",
      ),
    );
  }
  return row;
}

// ── Bilingual term / definition blocks ──────────────────────────────────────
// Renders English prominently with Spanish beneath in a muted style. We chose
// the "stacked EN over muted ES" layout (rather than a toggle) so newcomers
// see both languages at once without an extra click — better for scaffolding.
export function bilingualTermEl(term) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "text-align:center;";
  const en = document.createElement("div");
  en.style.cssText =
    "font-family:var(--font-display); font-weight:800; font-size:1.5rem; color:var(--navy); line-height:1.2;";
  en.textContent = term.term;
  wrap.append(en);
  if (term.termEs) {
    const es = document.createElement("div");
    es.lang = "es";
    es.style.cssText =
      "font-style:italic; font-weight:600; font-size:1.05rem; color:var(--teal); margin-top:2px;";
    es.textContent = term.termEs;
    wrap.append(es);
  }
  return wrap;
}

export function bilingualDefinitionEl(term) {
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "font-size:0.95rem; line-height:1.6; color:var(--ink); text-align:left;";
  const en = document.createElement("p");
  en.style.cssText = "margin:0;";
  en.textContent = term.definition;
  wrap.append(en);
  if (term.definitionEs) {
    const es = document.createElement("p");
    es.lang = "es";
    es.style.cssText =
      "margin:6px 0 0; font-style:italic; color:var(--muted); border-left:3px solid var(--teal-light); padding-left:8px;";
    es.textContent = term.definitionEs;
    wrap.append(es);
  }
  return wrap;
}

// ── Step scaffolding ─────────────────────────────────────────────────────────
// Each "step" is a card with a heading. Helpers below build the 3 generic
// sense-making steps. They call onAdvance() when the student finishes the step
// so the orchestrator can reveal/scroll to the next one.

function stepCard(heading, badge) {
  const card = document.createElement("section");
  card.className = "vocab-explore-step";
  card.style.cssText = `
    padding:var(--sp-4); border:1px solid var(--line); border-radius:var(--radius-md);
    background:#fff; display:flex; flex-direction:column; gap:var(--sp-3);
    animation:phaseIn 0.3s var(--ease-out) both;`;
  const h = document.createElement("h4");
  h.style.cssText = `
    margin:0; display:flex; align-items:center; gap:var(--sp-2);
    font-family:var(--font-display); font-weight:800; font-size:1rem; color:var(--navy);`;
  h.innerHTML = `<span aria-hidden="true">${escapeHtml(badge)}</span><span>${escapeHtml(heading)}</span>`;
  card.append(h);
  return card;
}

function feedbackLine() {
  const p = document.createElement("p");
  p.setAttribute("role", "status");
  p.setAttribute("aria-live", "polite");
  p.style.cssText =
    "margin:0; min-height:1.4em; font-size:0.92rem; font-weight:600; line-height:1.45;";
  return p;
}

function setFeedback(el, ok, msg) {
  el.style.color = ok ? "var(--teal)" : "var(--coral, #d9795d)";
  el.textContent = (ok ? "✅ " : "🤔 ") + msg;
}

// ── Step 1: Predict → Reveal ─────────────────────────────────────────────────
// Show image + "What do you think this means?" with plausible choices. After a
// guess (right or wrong) we reveal the real plain-language definition.
export function buildPredictReveal(term, { imageEl, onAdvance }) {
  const card = stepCard("What do you think this means?", "1");

  if (imageEl) {
    imageEl.style.cssText +=
      ";display:block; width:160px; max-width:100%; aspect-ratio:4/3; object-fit:contain; margin:0 auto; border-radius:var(--radius-sm); border:1px solid var(--line); background:var(--card);";
    card.append(imageEl);
  }

  const fb = feedbackLine();
  const reveal = document.createElement("div");
  reveal.hidden = true;
  reveal.style.cssText = `
    padding:var(--sp-3); background:var(--teal-light); border-radius:var(--radius-md);`;

  const choices = buildPredictChoices(term);
  if (choices.length) {
    const list = document.createElement("div");
    list.setAttribute("role", "group");
    list.setAttribute("aria-label", `What do you think "${term.term}" means?`);
    list.style.cssText =
      "display:flex; flex-direction:column; gap:var(--sp-2);";
    let answered = false;
    choices.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-secondary";
      b.style.cssText =
        "text-align:left; min-height:44px; line-height:1.4; white-space:normal;";
      b.textContent = c.text;
      b.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        list.querySelectorAll("button").forEach((x) => (x.disabled = true));
        if (c.correct) {
          b.style.borderColor = "var(--teal)";
          b.style.background = "var(--teal-light)";
          setFeedback(fb, true, "Nice prediction! Here's the meaning:");
        } else {
          b.style.borderColor = "var(--coral, #d9795d)";
          setFeedback(fb, false, "Good guess — here's what it really means:");
        }
        revealDefinition();
      });
      list.append(b);
    });
    card.append(list, fb, reveal);
  } else {
    // No distractors available — fall back to a simple reveal button.
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-teal";
    btn.style.cssText = "align-self:flex-start; min-height:44px;";
    btn.textContent = "Reveal the meaning";
    btn.addEventListener("click", () => {
      btn.disabled = true;
      setFeedback(fb, true, "Here's the meaning:");
      revealDefinition();
    });
    card.append(btn, fb, reveal);
  }

  function revealDefinition() {
    reveal.append(bilingualDefinitionEl(term));
    reveal.hidden = false;
    if (onAdvance) onAdvance();
  }

  return card;
}

// Plausible distractors: pull definitions from sibling terms if provided via
// term.__siblings (set by the orchestrator); otherwise use a couple of generic
// math-y distractors. We never invent a *Spanish* translation — distractors are
// English only and used purely to activate prior knowledge.
function buildPredictChoices(term) {
  const correct = String(term.definition || "").trim();
  if (!correct) return [];
  const pool = [];
  const sibs = Array.isArray(term.__siblings) ? term.__siblings : [];
  for (const s of sibs) {
    const d = String(s.definition || "").trim();
    if (d && d !== correct && pool.length < 2) pool.push(d);
  }
  while (pool.length < 2) {
    const generic =
      GENERIC_DISTRACTORS[pool.length % GENERIC_DISTRACTORS.length];
    if (!pool.includes(generic) && generic !== correct) pool.push(generic);
    else break;
  }
  const choices = [{ text: shorten(correct), correct: true }];
  for (const d of pool) choices.push({ text: shorten(d), correct: false });
  return shuffle(choices);
}

const GENERIC_DISTRACTORS = [
  "A tool used only for measuring temperature",
  "A type of money used in another country",
  "The name of a famous mathematician",
];

function shorten(s, n = 90) {
  s = String(s || "");
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

// ── Step 2: Example vs Non-example ───────────────────────────────────────────
// "Is this a ___? yes/no" with instant feedback + one-line why. Items come from
// term.examples (config-provided) or a graceful generic fallback.
export function buildExampleSort(term, { onAdvance }) {
  const items = buildExampleItems(term);
  if (!items.length) return null;

  const card = stepCard(`Is this a "${term.term}"?`, "2");
  const intro = document.createElement("p");
  intro.style.cssText = "margin:0; font-size:0.9rem; color:var(--muted);";
  intro.textContent = "Tap Yes or No. We'll tell you why.";
  card.append(intro);

  const fb = feedbackLine();
  let done = 0;

  items.forEach((it) => {
    const row = document.createElement("div");
    row.style.cssText = `
      display:flex; flex-wrap:wrap; align-items:center; gap:var(--sp-2);
      padding:var(--sp-2) var(--sp-3); border:1px solid var(--line);
      border-radius:var(--radius-md); background:var(--cream);`;
    const text = document.createElement("span");
    text.style.cssText = "flex:1 1 160px; font-size:0.92rem; color:var(--ink);";
    text.textContent = it.text;

    const why = document.createElement("span");
    why.style.cssText = "flex-basis:100%; font-size:0.85rem; line-height:1.4;";
    why.hidden = true;

    let answered = false;
    const answer = (saidYes) => {
      if (answered) return;
      answered = true;
      yes.disabled = true;
      no.disabled = true;
      const ok = saidYes === it.isExample;
      (saidYes ? yes : no).style.borderColor = ok
        ? "var(--teal)"
        : "var(--coral, #d9795d)";
      why.hidden = false;
      why.style.color = ok ? "var(--teal)" : "var(--coral, #d9795d)";
      why.textContent = `${ok ? "✅" : "❌"} ${it.why}`;
      done += 1;
      if (done === items.length) {
        setFeedback(fb, true, "You sorted every one — you've got the idea!");
        if (onAdvance) onAdvance();
      }
    };

    const yes = mkYesNo(
      "Yes",
      () => answer(true),
      `Yes, this is a ${term.term}`,
    );
    const no = mkYesNo(
      "No",
      () => answer(false),
      `No, this is not a ${term.term}`,
    );
    row.append(text, yes, no, why);
    card.append(row);
  });

  card.append(fb);
  return card;
}

function mkYesNo(label, onClick, aria) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "btn btn-secondary";
  b.style.cssText = "min-height:40px; padding:6px 16px;";
  b.textContent = label;
  b.setAttribute("aria-label", aria);
  b.addEventListener("click", onClick);
  return b;
}

// term.examples: [{ text, isExample, why }] preferred. Graceful fallback uses a
// single "yes" item built from the definition so the step is never empty when
// at least a definition exists. Returns [] if nothing usable.
function buildExampleItems(term) {
  if (Array.isArray(term.examples) && term.examples.length) {
    return term.examples
      .filter((e) => e && typeof e.text === "string")
      .map((e) => ({
        text: e.text,
        isExample: !!e.isExample,
        why: String(
          e.why ||
            (e.isExample
              ? "Yes — this fits the meaning."
              : "No — this does not fit the meaning."),
        ),
      }));
  }
  return [];
}

// ── Step 3: Use-in-context cloze ─────────────────────────────────────────────
// Pick the sentence that uses the word correctly (config: term.sentences:
// [{ text, correct }]). Falls back to a single tap-to-fill cloze from
// term.cloze ("A ___ is ...") when sentences aren't provided.
export function buildUseInContext(term, { onAdvance }) {
  const sentences = Array.isArray(term.sentences) ? term.sentences : [];
  const usable = sentences.filter((s) => s && typeof s.text === "string");

  if (usable.length >= 2) {
    const card = stepCard("Which sentence uses it correctly?", "3");
    const fb = feedbackLine();
    const list = document.createElement("div");
    list.setAttribute("role", "group");
    list.setAttribute(
      "aria-label",
      `Pick the sentence that uses "${term.term}" correctly`,
    );
    list.style.cssText =
      "display:flex; flex-direction:column; gap:var(--sp-2);";
    let answered = false;
    shuffle(usable.slice()).forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-secondary";
      b.style.cssText =
        "text-align:left; min-height:44px; line-height:1.4; white-space:normal;";
      b.textContent = s.text;
      b.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        list.querySelectorAll("button").forEach((x) => (x.disabled = true));
        if (s.correct) {
          b.style.borderColor = "var(--teal)";
          b.style.background = "var(--teal-light)";
          setFeedback(fb, true, "That's the right way to use it!");
        } else {
          b.style.borderColor = "var(--coral, #d9795d)";
          setFeedback(
            fb,
            false,
            "Not quite — that one doesn't use it correctly.",
          );
        }
        if (onAdvance) onAdvance();
      });
      list.append(b);
    });
    card.append(list, fb);
    return card;
  }

  // Cloze fallback: tap the word chip into the blank in a real sentence.
  const clozeText = typeof term.cloze === "string" ? term.cloze : "";
  if (clozeText.includes("___")) {
    return buildClozeFill(term, clozeText, onAdvance);
  }
  return null;
}

function buildClozeFill(term, clozeText, onAdvance) {
  const card = stepCard("Put the word in the sentence", "3");
  const fb = feedbackLine();
  const [before, after = ""] = clozeText.split("___");

  const sentence = document.createElement("p");
  sentence.style.cssText =
    "margin:0; font-size:1rem; line-height:1.7; color:var(--ink);";
  sentence.append(document.createTextNode(before));
  const blank = document.createElement("span");
  blank.setAttribute("role", "button");
  blank.tabIndex = 0;
  blank.setAttribute(
    "aria-label",
    "Empty blank. Tap the word below to fill it.",
  );
  blank.style.cssText = `
    display:inline-block; min-width:70px; padding:2px 10px; margin:0 2px;
    border-bottom:2px dashed var(--teal); color:var(--muted); text-align:center;`;
  blank.textContent = "______";
  sentence.append(blank);
  sentence.append(document.createTextNode(after));

  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "btn btn-amber";
  chip.style.cssText = "min-height:40px; align-self:flex-start;";
  chip.textContent = term.term;
  chip.setAttribute(
    "aria-label",
    `Place the word ${term.term} into the sentence`,
  );

  let filled = false;
  const fill = () => {
    if (filled) return;
    filled = true;
    blank.textContent = term.term;
    blank.style.color = "var(--navy)";
    blank.style.fontWeight = "800";
    blank.style.borderBottomStyle = "solid";
    blank.setAttribute("aria-label", `Blank filled with ${term.term}`);
    chip.disabled = true;
    setFeedback(fb, true, "You used it in a real sentence!");
    if (onAdvance) onAdvance();
  };
  chip.addEventListener("click", fill);
  blank.addEventListener("click", fill);
  blank.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fill();
    }
  });

  card.append(sentence, chip, fb);
  return card;
}

// ── "You explored" confirmation ──────────────────────────────────────────────
export function buildConfirmation(term) {
  const box = document.createElement("div");
  box.setAttribute("role", "status");
  box.style.cssText = `
    padding:var(--sp-4); border-radius:var(--radius-md); text-align:center;
    background:linear-gradient(135deg, var(--teal-light), #fff);
    border:2px solid var(--teal); animation:phaseIn 0.3s var(--ease-out) both;`;
  const en = document.createElement("div");
  en.style.cssText =
    "font-family:var(--font-display); font-weight:800; font-size:1.1rem; color:var(--navy);";
  en.textContent = `🎉 You explored: ${term.term}!`;
  box.append(en);
  if (term.termEs) {
    const es = document.createElement("div");
    es.lang = "es";
    es.style.cssText =
      "font-style:italic; color:var(--teal); font-weight:600; margin-top:2px;";
    es.textContent = `¡Exploraste: ${term.termEs}!`;
    box.append(es);
  }
  const sub = document.createElement("div");
  sub.style.cssText = "font-size:0.85rem; color:var(--muted); margin-top:6px;";
  sub.textContent = "Great thinking. You're ready to practice this word.";
  box.append(sub);
  return box;
}

// ── utils ────────────────────────────────────────────────────────────────────
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
