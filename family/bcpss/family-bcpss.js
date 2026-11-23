// Family Bridge (/family/bcpss and /family/bcpss/{unitId}): bilingual guide a family can act on.
//   - no unit in the link  -> a grade / subject / unit chooser (never a blank page)
//   - a unit in the link   -> the unit's own family card, a 10-minute routine, words, practice links and print sheet

import { keepView } from "/bcpss-teachers/keep-view.js";
import { renderQrSvg } from "/bcpss-teachers/qr-svg.js";
import { renderDirectory } from "./family-directory.js";
import { LANGS, esc, gradeText } from "./family-copy.js";

const state = { unitId: "", lang: "en", card: null, guide: null, dir: { grade: "", subject: "" } };

const root = () => document.getElementById("familyCardRoot");
const $ = (selector) => document.querySelector(selector);
const t = () => LANGS[state.lang] || LANGS.en;

function readUrl() {
  const q = new URLSearchParams(window.location.search);
  const m = window.location.pathname.match(/^\/family\/bcpss\/([^/]+)\/?$/);
  state.unitId = m ? decodeURIComponent(m[1]) : q.get("unit") || q.get("unitId") || "";
  if (LANGS[q.get("lang")]) state.lang = q.get("lang");
  state.dir = { grade: q.get("grade") || "", subject: q.get("subject") || "" };
}

function writeUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", state.lang);
  if (!state.unitId) {
    for (const key of ["grade", "subject"]) {
      if (state.dir[key]) url.searchParams.set(key, state.dir[key]);
      else url.searchParams.delete(key);
    }
  }
  history.replaceState(null, "", url.pathname + url.search);
}

function applyLangChrome() {
  document.documentElement.lang = state.lang;
  $("#fbSkip").textContent = t().skip;
  $("#fbFooterText").textContent = t().footer;
  for (const btn of document.querySelectorAll("[data-lang]")) {
    btn.setAttribute("aria-pressed", btn.dataset.lang === state.lang ? "true" : "false");
  }
  writeUrl();
}

/** The card the teacher hub previews: family_card.translations_json[lang], falling back to English. */
function cardEntry(lang) {
  const tr = state.card?.family_card?.translations_json || {};
  return tr[lang] || tr.en || {};
}

function questionsFor(entry) {
  const generic =
    state.lang === "es"
      ? "Pregunten: ¿Cuál es una palabra nueva de esta unidad y qué significa?"
      : "Ask: What is one new word from this unit, and what does it mean?";
  return [entry.dinner_question, generic].filter(Boolean);
}

function wordCards(words) {
  const tx = t();
  return words
    .map(
      (w) => `<div class="fb-word-card">
        <span class="fb-word-en">${esc(w.term)}</span>
        ${w.es ? `<span class="fb-word-tr" lang="es">${esc(w.es)}</span>` : ""}
        ${w.def ? `<span class="fb-word-def">${esc(tx.inEnglish)}: ${esc(w.def)}</span>` : ""}
      </div>`,
    )
    .join("");
}

/** Without the extras (guide) the card's own key words still show. */
function fallbackWords(entry) {
  return (entry.key_words || []).map((w) => ({ term: String(w), es: null, def: "" }));
}

function tryItSection(guide) {
  const tx = t();
  if (!guide?.starter) return "";
  const [say, show, find] = tx.steps;
  return `<section class="fb-section" aria-labelledby="fbTryHead">
    <h2 id="fbTryHead">${esc(tx.tryHeading)}</h2>
    <ol class="fb-steps">
      <li><strong>${esc(say.title)}.</strong> ${esc(say.text)}<p class="fb-starter" lang="en">${esc(guide.starter)}</p></li>
      <li><strong>${esc(show.title)}.</strong> ${esc(show.text)}</li>
      <li><strong>${esc(find.title)}.</strong> ${esc(find.text)}</li>
    </ol>
  </section>`;
}

function practiceSection(guide) {
  const tx = t();
  if (!guide?.labs?.length) return "";
  return `<section class="fb-section fb-no-print" aria-labelledby="fbPracticeHead">
    <h2 id="fbPracticeHead">${esc(tx.practiceHeading)}</h2>
    <p class="fb-muted">${esc(tx.practiceNote)}</p>
    <ul class="fb-lab-list">
      ${guide.labs
        .map((lab) => {
          const copy = tx.labs[lab.key];
          return copy
            ? `<li><a class="fb-lab-card" href="${esc(lab.url)}"><span class="fb-lab-name">${esc(copy.name)}</span><span class="fb-lab-text">${esc(copy.text)}</span></a></li>`
            : "";
        })
        .join("")}
    </ul>
  </section>`;
}

function neighbourLinks(guide) {
  const tx = t();
  const link = (u, label) =>
    u
      ? `<a class="fb-nav-link" href="/family/bcpss/${encodeURIComponent(u.id)}?lang=${state.lang}"><span>${esc(label)}</span><strong>${esc(tx.unitWord)} ${esc(u.unit_number)}: ${esc(u.title)}</strong></a>`
      : "";
  const unit = guide?.unit;
  const another = unit
    ? `/family/bcpss/?lang=${state.lang}&grade=${encodeURIComponent(unit.grade)}&subject=${encodeURIComponent(unit.subject)}`
    : `/family/bcpss/?lang=${state.lang}`;
  return `<nav class="fb-section fb-nav fb-no-print" aria-label="${esc(tx.another)}">
    ${link(guide?.neighbours?.prev, tx.prev)}
    ${link(guide?.neighbours?.next, tx.next)}
    <a class="fb-nav-link" href="${esc(another)}"><strong>${esc(tx.another)}</strong></a>
  </nav>`;
}

function renderUnit() {
  const tx = t();
  const unit = state.card?.unit || {};
  const entry = cardEntry(state.lang);
  const guide = state.guide;
  const words = guide?.words?.length ? guide.words : fallbackWords(entry);
  const pageUrl = `${window.location.origin}/family/bcpss/${encodeURIComponent(state.unitId)}?lang=${state.lang}`;
  const heading =
    entry.title || `${tx.unitWord} ${unit.unit_number || ""}: ${unit.unit_title || ""}`;

  root().innerHTML = `
    <article class="fb-card">
      <div>
        <span class="fb-kicker">${esc(tx.kickerPrefix)} · ${esc(gradeText(tx, String(unit.grade || "")))} ${esc(unit.curriculum_name || unit.subject || "")}</span>
        <h1>${esc(heading)}</h1>
        <p class="fb-summary">${esc(entry.summary || unit.unit_summary || "")}</p>
      </div>

      <section class="fb-section" aria-labelledby="fbTalkHead">
        <h2 id="fbTalkHead">${esc(tx.questionsHeading)}</h2>
        <ul class="fb-question-list">${questionsFor(entry)
          .map((q) => `<li>${esc(q)}</li>`)
          .join("")}</ul>
        <p class="fb-muted">${esc(tx.tip)}</p>
      </section>

      ${tryItSection(guide)}

      ${words.length ? `<section class="fb-section" aria-labelledby="fbWordsHead"><h2 id="fbWordsHead">${esc(tx.wordsHeading)}</h2><div class="fb-word-grid">${wordCards(words)}</div></section>` : ""}

      ${practiceSection(guide)}

      <div class="fb-actions fb-no-print">
        <button type="button" class="fb-btn is-primary" data-print>${esc(tx.print)}</button>
        <button type="button" class="fb-btn" data-copy-link>${esc(tx.copy)}</button>
      </div>

      <div class="fb-print-only fb-qr">
        ${renderQrSvg(pageUrl, { sizePx: 120, label: tx.scanToOpen })}
        <span>${esc(tx.scanToOpen)}<br />${esc(pageUrl)}</span>
      </div>
    </article>
    ${neighbourLinks(guide)}`;
  document.title = `${heading} · ${document.title.split("·").pop().trim()}`;
}

function showDirectory() {
  renderDirectory({
    root: root(),
    t: t(),
    lang: state.lang,
    sel: state.dir,
    onSelect: (next) => {
      state.dir = next;
      writeUrl();
      keepView(root(), showDirectory);
    },
  });
}

function draw() {
  if (!state.unitId) return showDirectory();
  if (state.card) renderUnit();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

async function loadUnit() {
  const id = encodeURIComponent(state.unitId);
  // The extras are a bonus: if they fail the family still gets the card.
  const [card, guide] = await Promise.allSettled([
    fetchJson(`/api/bcpss/family/${id}`),
    fetchJson(`/api/bcpss/family-guide/${id}`),
  ]);
  if (card.status !== "fulfilled") throw new Error("card");
  state.card = card.value;
  state.guide = guide.status === "fulfilled" ? guide.value : null;
  renderUnit();
}

function bindEvents() {
  document.querySelector(".fb-lang-bar")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang]");
    if (!btn || !LANGS[btn.dataset.lang] || btn.dataset.lang === state.lang) return;
    state.lang = btn.dataset.lang;
    applyLangChrome();
    draw();
  });
  root().addEventListener("click", async (e) => {
    if (e.target.closest("[data-print]")) window.print();
    const copy = e.target.closest("[data-copy-link]");
    if (!copy) return;
    const label = copy.textContent;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/family/bcpss/${encodeURIComponent(state.unitId)}?lang=${state.lang}`,
      );
      copy.textContent = t().copied;
      setTimeout(() => {
        copy.textContent = label;
      }, 1500);
    } catch {
      /* clipboard unavailable: the address bar still holds the link */
    }
  });
}

async function init() {
  readUrl();
  bindEvents();
  applyLangChrome();
  if (!state.unitId) return showDirectory();
  try {
    await loadUnit();
  } catch {
    root().innerHTML = `<div class="fb-status fb-error" role="alert">${esc(t().noUnit)} <a href="/family/bcpss/?lang=${state.lang}">${esc(t().another)}</a></div>`;
  }
}

init();
