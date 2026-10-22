// The Fluency Lab language layer's screens: "words for this problem", the Spanish peek, and the explain card
// that opens after an answer. Everything a learner writes or says stays on this device in the math journal.
// Frames and word banks come from language-frames.js and language-terms.js; this file only draws and wires them.
import { getLang, t } from "./i18n.js";
import {
  LEVELS,
  blanks,
  connectors,
  framesFor,
  functionsFor,
  levelById,
  promptFor,
  startingFunction,
} from "./language-frames.js";
import {
  addEntry,
  analyze,
  languageEvidence,
  loadJournal,
  removeEntry,
  summarize,
} from "./language-journal.js";
import { getLevel, readJson, setLevel, writeJson } from "./language-settings.js";
import { checkMoves, doneMoves, languageProfile, termById, termsInText } from "./language-terms.js";
import { choicesEs, questionEs } from "./question-es.js";
import { speak } from "./speech.js";

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const LOOKUP_KEY = "ewl-language-lookups-v1";
export const MOVE_LABELS = {
  term: "a math word",
  reason: "a reason",
  sequence: "a first-then order",
  check: "a way to check",
};

export const STAT_LABELS = [
  ["term", "wrote a math word"],
  ["reason", "gave a reason"],
  ["sequence", "used first-then order"],
  ["check", "explained a check"],
];

const registry = new Map();
let serial = 0;
let recognition = null;

export const lookupCount = () => readJson(LOOKUP_KEY, []).length;
const noteLookup = (id) => {
  const seen = readJson(LOOKUP_KEY, []);
  if (id && !seen.includes(id)) writeJson(LOOKUP_KEY, [...seen, id].slice(-200));
};

// "Words for this problem": a few bilingual word cards. Level 1 and 2 learners see them open.
export function wordStripHtml(
  skill,
  { heading = t("Words for this problem"), open = getLevel() <= 3 } = {},
) {
  const { terms } = languageProfile(skill);
  const both = getLevel() <= 2;
  const es = getLang() === "es";
  const cards = terms
    .map(
      (
        term,
      ) => `<li class="lang-term"><div class="lang-term-head"><strong lang="en">${esc(term.en)}</strong> <span lang="es" class="lang-es">${esc(term.es)}</span>${term.cognate ? `<span class="lang-cognate" title="${esc(t("These words look alike in English and Spanish."))}">🔗 ${esc(t("looks alike"))}</span>` : ""}</div>
      <p class="lang-def">${esc(es ? term.defEs : term.defEn)}</p>${both ? `<p class="lang-def lang-def-other" lang="${es ? "en" : "es"}">${esc(es ? term.defEn : term.defEs)}</p>` : ""}
      <div class="lang-term-actions"><button type="button" class="lang-mini" data-lang-term="${term.id}" data-lang-voice="en">🔊 English</button><button type="button" class="lang-mini" data-lang-term="${term.id}" data-lang-voice="es">🔊 Español</button></div></li>`,
    )
    .join("");
  return `<details class="lang-words"${open ? " open" : ""}><summary>${esc(heading)}</summary><ul class="lang-term-list">${cards}</ul></details>`;
}

// The Spanish peek for a problem: the English stays the learner's practice; this is a bridge, never the question.
export function spanishPeekHtml(item) {
  const text = questionEs(item);
  if (!text) return "";
  const options = choicesEs(item);
  return `<details class="lang-peek"><summary>🌐 ${esc(t("See it in Spanish"))} <span lang="es">· Ver en español</span></summary>
    <p class="lang-peek-text" lang="es">${esc(text)}</p>${options ? `<p class="lang-peek-text" lang="es">${esc(options.join(" · "))}</p>` : ""}
    <button type="button" class="lang-mini" data-lang-speak-es="${esc(text)}">🔊 Escuchar</button></details>`;
}

// During practice the words stay closed (the problem comes first) unless the learner chose Starter.
export const problemSupportHtml = (skill, item) =>
  `${spanishPeekHtml(item)}${wordStripHtml(skill, { open: getLevel() === 1 })}`;

const checklistHtml = (read, level) =>
  `<ul class="lang-checklist" data-lang-checklist aria-label="${esc(t("Ideas in your writing"))}">${Object.entries(
    MOVE_LABELS,
  )
    .filter(([move]) => level > 1 || move === "term" || move === "reason")
    .map(
      ([move, label]) =>
        `<li data-move="${move}" class="${read?.moves?.[move] ? "got" : ""}"><span aria-hidden="true">${read?.moves?.[move] ? "✓" : "○"}</span> ${esc(t(label))}</li>`,
    )
    .join("")}</ul>`;

function cardInner(ctx) {
  const level = getLevel();
  const levelInfo = levelById(level);
  const { family, terms } = languageProfile(ctx.skill);
  const writing = ctx.writing;
  const fns = functionsFor(level);
  const frames = framesFor(level >= 4 ? 3 : level, ctx.fn);
  const prompt = promptFor(ctx.fn);
  const pick = (pair) => esc(writing === "es" ? pair.es : pair.en);
  const frameButtons = frames
    .map(
      (frame, index) =>
        `<button type="button" class="lang-frame" data-lang-frame="${index}">${pick(frame)}</button>`,
    )
    .join("");
  const bank = terms
    .map(
      (term) =>
        `<button type="button" class="lang-chip" data-lang-chip="fill" data-text="${esc(writing === "es" ? term.es : term.en)}">${esc(writing === "es" ? term.es : term.en)} <small>${esc(writing === "es" ? term.en : term.es)}</small></button>`,
    )
    .join("");
  const did =
    level <= 3 && ctx.fn !== "notice" && ctx.fn !== "check"
      ? doneMoves(family)
          .map(
            (move) =>
              `<button type="button" class="lang-chip" data-lang-chip="fill" data-text="${esc(writing === "es" ? move.es : move.en)}">${esc(writing === "es" ? move.es : move.en)}</button>`,
          )
          .join("")
      : "";
  const checks =
    ctx.fn === "check" && level <= 3
      ? checkMoves(family)
          .map(
            (move) =>
              `<button type="button" class="lang-chip" data-lang-chip="add" data-text="${esc(writing === "es" ? move.es : move.en)}">${esc(writing === "es" ? move.es : move.en)}</button>`,
          )
          .join("")
      : "";
  const joins =
    level >= 2
      ? connectors()
          .map(
            (word) =>
              `<button type="button" class="lang-chip lang-join" data-lang-chip="word" data-text="${esc(writing === "es" ? word.es : word.en)}">${esc(writing === "es" ? word.es : word.en)}</button>`,
          )
          .join("")
      : "";
  const starters =
    level >= 4
      ? `<details class="lang-starters"><summary>${esc(t("Need a starter?"))}</summary><div class="lang-frames">${frameButtons}</div></details>`
      : `<div class="lang-frames">${frameButtons}</div>`;
  return `<div class="lang-body">
    <div class="lang-row" role="group" aria-label="${esc(t("Talk & write help"))}"><span class="lang-label">${esc(t("Talk & write help"))}</span>${LEVELS.map((entry) => `<button type="button" class="lang-tab" data-lang-level="${entry.id}" aria-pressed="${entry.id === level}">${esc(t(entry.name))}</button>`).join("")}</div>
    <p class="lang-note">${esc(t(levelInfo.blurb))}</p>
    <div class="lang-row" role="group" aria-label="${esc(t("What to say"))}"><span class="lang-label">${esc(t("What to say"))}</span>${fns.map((fn) => `<button type="button" class="lang-tab" data-lang-fn="${fn.id}" aria-pressed="${fn.id === ctx.fn}">${esc(t(fn.en))}</button>`).join("")}
      <span class="lang-spacer"></span><button type="button" class="lang-tab" data-lang-write="en" aria-pressed="${writing === "en"}" lang="en">English</button><button type="button" class="lang-tab" data-lang-write="es" aria-pressed="${writing === "es"}" lang="es">Español</button></div>
    ${level >= 4 ? `<p class="lang-prompt">${pick(prompt)}</p>` : ""}${starters}
    <p class="lang-label">${esc(t("Math words"))}</p><div class="lang-chips">${bank}</div>
    ${did ? `<p class="lang-label">${esc(t("What I did"))}</p><div class="lang-chips">${did}</div>` : ""}${checks ? `<p class="lang-label">${esc(t("Ways to check"))}</p><div class="lang-chips">${checks}</div>` : ""}
    ${joins ? `<p class="lang-label">${esc(t("Joining words"))}</p><div class="lang-chips">${joins}</div>` : ""}
    <label class="lang-label" for="${ctx.id}-text">${esc(t("Your words"))}</label>
    <textarea id="${ctx.id}-text" class="lang-text" rows="3" maxlength="400" data-lang-text placeholder="${esc(t("Tap a sentence above, say it with the microphone, or type."))}"></textarea>
    <div class="lang-row"><button type="button" class="lang-mini" data-lang-mic>🎙️ ${esc(t("Say it"))}</button><button type="button" class="lang-mini" data-lang-hear>🔊 ${esc(t("Hear it"))}</button><span class="lang-status" data-lang-status role="status" aria-live="polite"></span></div>
    ${checklistHtml(null, level)}
    <div class="lang-row"><button type="button" class="primary-action lang-save" data-lang-save>${esc(t("Save to my math journal"))}</button><span class="lang-note">${esc(t("Saved on this device only. You can skip this and go on."))}</span></div>
  </div>`;
}

// Learners at Starter and Building are invited to explain on every second correct answer, Growing on every
// third; "On my own" opens the card only when asked. A miss never opens it by itself.
const inviteOpen = (count) => {
  const level = getLevel();
  return level <= 2 ? count % 2 === 0 : level === 3 ? count % 3 === 0 : false;
};

// The explain card. `correct` picks the opening move ("fix it" after a slip); `count` rotates the move after a hit.
export function explainCardHtml({
  skill,
  skillKey = "",
  grade = 0,
  correct = true,
  count = 0,
  day = "",
  open,
}) {
  const id = `lc${++serial}`;
  const opens = open ?? (correct && inviteOpen(count));
  const ctx = {
    id,
    skill,
    skillKey,
    grade: grade || skill?.grade || 0,
    day,
    correct,
    fn: startingFunction({ correct, count }),
    writing: getLang(),
  };
  registry.set(id, ctx);
  if (registry.size > 40) registry.delete(registry.keys().next().value);
  const title = correct ? t("Say how you know") : t("Talk about the slip");
  return `<details class="lang-card" data-lang-card="${id}"${opens ? " open" : ""}><summary><span aria-hidden="true">🗣️</span> ${esc(title)} <span class="lang-pill">${esc(t(levelById(getLevel()).name))}</span></summary><div data-lang-host>${cardInner(ctx)}</div></details>`;
}

const updateChecklist = (card) => {
  const area = card.querySelector("[data-lang-text]");
  const read = analyze(area?.value || "");
  const list = card.querySelector("[data-lang-checklist]");
  if (!list) return read;
  for (const item of list.querySelectorAll("[data-move]")) {
    const got = Boolean(read.moves[item.dataset.move]);
    item.classList.toggle("got", got);
    item.firstElementChild.textContent = got ? "✓" : "○";
  }
  return read;
};

function insertText(area, text, mode) {
  const value = area.value;
  if (mode === "fill" && value.includes("___")) area.value = value.replace("___", text);
  else area.value = value ? `${value}${/[\s]$/.test(value) ? "" : " "}${text}` : text;
  area.focus();
}

function setStatus(card, message) {
  const status = card.querySelector("[data-lang-status]");
  if (status) status.textContent = message;
}

function rerender(card, ctx) {
  const area = card.querySelector("[data-lang-text]");
  const keep = area?.value || "";
  card.querySelector("[data-lang-host]").innerHTML = cardInner(ctx);
  const next = card.querySelector("[data-lang-text]");
  if (next && keep && !keep.includes("___")) next.value = keep;
  const pill = card.querySelector(".lang-pill");
  if (pill) pill.textContent = t(levelById(getLevel()).name);
  updateChecklist(card);
}

function toggleMic(card, ctx) {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const area = card.querySelector("[data-lang-text]");
  if (!Rec) return setStatus(card, t("This browser cannot listen. You can type instead."));
  if (recognition) {
    try {
      recognition.stop();
    } catch {
      /* already stopped */
    }
    recognition = null;
    return setStatus(card, "");
  }
  try {
    const rec = new Rec();
    rec.lang = ctx.writing === "es" ? "es-ES" : "en-US";
    rec.interimResults = false;
    rec.onstart = () => setStatus(card, t("Listening… say your idea."));
    rec.onresult = (event) => {
      const heard = Array.from(event.results)
        .map((result) => result[0]?.transcript)
        .filter(Boolean)
        .join(" ");
      if (heard) insertText(area, heard, "add");
      updateChecklist(card);
    };
    rec.onerror = () =>
      setStatus(card, t("The microphone is not available. You can type instead."));
    rec.onend = () => {
      recognition = null;
      setStatus(card, t("Got it. Check your words, then save."));
    };
    recognition = rec;
    rec.start();
  } catch {
    recognition = null;
    setStatus(card, t("The microphone is not available. You can type instead."));
  }
}

function save(card, ctx) {
  const area = card.querySelector("[data-lang-text]");
  const read = analyze(area.value);
  if (read.unfilled) return setStatus(card, t("Fill in the blanks (___) first."));
  const entry = addEntry({
    text: area.value,
    skill: ctx.skillKey,
    grade: ctx.grade,
    fn: ctx.fn,
    level: getLevel(),
    day: ctx.day,
  });
  if (!entry) return setStatus(card, t("Write a little more: a short sentence is enough."));
  area.value = "";
  const got = Object.entries(entry.moves)
    .filter(([, on]) => on)
    .map(([move]) => t(MOVE_LABELS[move]));
  setStatus(
    card,
    got.length
      ? t("Saved. Your writing has {ideas}.", { ideas: got.join(", ") })
      : t("Saved. Next time, try adding a math word or a reason."),
  );
  updateChecklist(card);
  window.dispatchEvent(new CustomEvent("fluency-language-saved"));
}

// One set of listeners for every card and word strip on the page.
export function initLanguage() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    const voice = target.closest("[data-lang-voice]");
    if (voice) {
      const term = termById(voice.dataset.langTerm);
      if (term) {
        noteLookup(term.id);
        if (voice.dataset.langVoice === "es") speak(`${term.es}. ${term.defEs}`, "es");
        else speak(`${term.en}. ${term.defEn}`, "en");
      }
      return;
    }
    const peek = target.closest("[data-lang-speak-es]");
    if (peek) return speak(peek.dataset.langSpeakEs, "es");
    const card = target.closest("[data-lang-card]");
    const ctx = card && registry.get(card.dataset.langCard);
    if (card && ctx) {
      const level = target.closest("[data-lang-level]");
      if (level) {
        setLevel(Number(level.dataset.langLevel));
        return rerender(card, ctx);
      }
      const fn = target.closest("[data-lang-fn]");
      if (fn) {
        ctx.fn = fn.dataset.langFn;
        return rerender(card, ctx);
      }
      const write = target.closest("[data-lang-write]");
      if (write) {
        ctx.writing = write.dataset.langWrite;
        return rerender(card, ctx);
      }
      const frame = target.closest("[data-lang-frame]");
      if (frame) {
        card.querySelector("[data-lang-text]").value = frame.textContent;
        card.querySelector("[data-lang-text]").focus();
        return updateChecklist(card);
      }
      const chip = target.closest("[data-lang-chip]");
      if (chip) {
        const area = card.querySelector("[data-lang-text]");
        insertText(area, chip.dataset.text, chip.dataset.langChip);
        for (const id of termsInText(chip.dataset.text)) noteLookup(id);
        return updateChecklist(card);
      }
      if (target.closest("[data-lang-mic]")) return toggleMic(card, ctx);
      if (target.closest("[data-lang-hear]")) {
        const text = card.querySelector("[data-lang-text]").value.trim();
        return text
          ? speak(text, ctx.writing)
          : setStatus(card, t("Choose or write a sentence first."));
      }
      if (target.closest("[data-lang-save]")) return save(card, ctx);
    }
    const pick = target.closest("[data-lang-set-level]");
    if (pick) {
      setLevel(Number(pick.dataset.langSetLevel));
      for (const button of pick.parentElement.querySelectorAll("[data-lang-set-level]"))
        button.setAttribute("aria-pressed", String(button === pick));
      return;
    }
    if (target.closest("[data-lang-print-journal]")) return window.dispatchEvent(new CustomEvent("fluency-language-print"));
    const del = target.closest("[data-lang-delete]");
    if (del) {
      removeEntry(del.dataset.langDelete);
      del.closest(".lang-entry")?.remove();
    }
  });
  document.addEventListener("input", (event) => {
    const card = event.target.closest?.("[data-lang-card]");
    if (card && event.target.matches("[data-lang-text]")) updateChecklist(card);
  });
}

// "My math talk" on the progress page: what the learner has written, with counts that show growth, not grades.
export function journalHtml() {
  const entries = loadJournal();
  const sum = summarize(entries);
  const stats = STAT_LABELS    .map(
      ([move, label]) =>
        `<div><strong>${sum.moves[move]}</strong><span>${esc(t(label))}</span></div>`,
    )
    .join("");
  const rows = entries
    .slice(0, 12)
    .map(
      (entry) =>
        `<li class="lang-entry"><p>${esc(entry.text)}</p><small>${esc(entry.day || "")} · ${esc(t(MOVE_FN[entry.fn] || "Explain"))}</small><button type="button" class="lang-mini" data-lang-delete="${esc(entry.id)}" aria-label="${esc(t("Delete this entry"))}">✕</button></li>`,
    )
    .join("");
  return `<section class="lang-journal" aria-labelledby="lang-journal-title"><h3 id="lang-journal-title">${esc(t("My math talk"))}</h3>
    <p class="lang-note">${esc(t("Your explanations stay on this device. Counts show what your writing already does."))}</p>
    <div class="lang-row" role="group" aria-label="${esc(t("Talk & write help"))}"><span class="lang-label">${esc(t("Talk & write help"))}</span>${LEVELS.map((entry) => `<button type="button" class="lang-tab" data-lang-set-level="${entry.id}" aria-pressed="${entry.id === getLevel()}">${esc(t(entry.name))}</button>`).join("")}</div>
    ${entries.length ? `<div class="lang-stats"><div><strong>${sum.total}</strong><span>${esc(t("explanations saved"))}</span></div><div><strong>${sum.wordsUsed}</strong><span>${esc(t("different math words"))}</span></div>${stats}</div><ul class="lang-entries">${rows}</ul><button type="button" class="outline-action" data-lang-print-journal>${esc(t("Print my math journal"))}</button>` : `<p>${esc(t("Nothing saved yet. After a problem, open “Say how you know”."))}</p>`}</section>`;
}

export const MOVE_FN = {
  notice: "Notice",
  explain: "Explain",
  compare: "Compare",
  check: "Check",
  fix: "Fix it",
};

export function journalPrintHtml({ name, grade }) {
  const entries = loadJournal();
  const rows = entries
    .map(
      (entry) =>
        `<li><p>${esc(entry.text)}</p><small>${esc(entry.day || "")} · ${esc(t(MOVE_FN[entry.fn] || "Explain"))}</small></li>`,
    )
    .join("");
  return `<article class="family-print"><h1>${esc(t("{name}’s Math Journal", { name }))}</h1><p>${esc(t("Grade {n}", { n: grade }))} · ${new Date().toLocaleDateString()}</p><ol class="lang-print-list">${rows || `<li>${esc(t("Nothing saved yet."))}</li>`}</ol></article>`;
}

export const languageScore = () => languageEvidence(loadJournal(), lookupCount());
