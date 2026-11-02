// Word cards and partner talk (/flashcards). The words come from the activities themselves; the learner
// flips a card, says it aloud, and rates it. Review follows the 1 → 3 → 7 → 14 day ladder, on this device.
import { crumbsHTML, setComponentsI18n } from "../components.js";
import { bandDomains, loadDomain, ordered } from "../content.js";
import { i18nFor } from "../i18n.js";
import { buildDeck, nextCard, pairTalk, rate } from "../lang/flashcards.js";
import { speak } from "../speech.js";
import { BASE, announce, html, icon, safeJson, storage } from "../util.js";

const KEY = "accessPracticeLab:v1:flashcards";
const SKILLS = ["Listening", "Reading", "Speaking", "Writing"];
const today = () => Math.floor(Date.now() / 864e5);
const norm = (t) => String(t).trim().toLowerCase();
const read = () => {
  const raw = safeJson(storage.get(KEY), {});
  return raw && typeof raw === "object" ? raw : {};
};

let flipped = false;
let pairAt = 0;
let deckCache = null; // { key, cards } — the current deck, so a flip does not refetch

function selection(ctx) {
  const q = new URLSearchParams(location.search);
  const domain = SKILLS.includes(q.get("domain")) ? q.get("domain") : "Reading";
  return { band: ctx.band, domain, level: q.get("level") || "A", cat: q.get("cat") || "" };
}
const deckKey = (s) => `${s.band}:${s.domain}:${s.level}:${s.cat}`;

async function loadDeck(s) {
  if (deckCache?.key === deckKey(s)) return deckCache;
  const data = await loadDomain(s.band, s.domain);
  const levels = Object.keys(data.levels || {});
  const level = data.levels?.[s.level] ? s.level : levels[0];
  const levelData = data.levels[level];
  deckCache = { key: deckKey(s), level, levels, categories: levelData.categories || [], cards: buildDeck({ ...levelData, activities: ordered(levelData) }, s.cat) };
  return deckCache;
}

const hrefFor = (s, patch) => {
  const q = new URLSearchParams({ grades: s.band, domain: s.domain, level: s.level, ...(s.cat ? { cat: s.cat } : {}), ...patch });
  if (patch.cat === "") q.delete("cat");
  return `${BASE}/flashcards?${q}`;
};

export async function render(ctx) {
  const I = i18nFor(ctx);
  setComponentsI18n(I);
  const s = selection(ctx);
  await bandDomains(s.band);
  const deck = await loadDeck(s);
  const state = read()[deckKey({ ...s, level: deck.level })] || {};
  const pick = nextCard(deck.cards, state, today());
  const known = deck.cards.filter((c) => state[norm(c.term)]?.box >= 1).length;
  const talk = pairTalk(deck.cards, { count: 1, offset: pairAt })[0];
  const chip = (label, href, on) => html`<a class="cat-chip" href="${href}" aria-current="${on ? "true" : "false"}">${label}</a>`;
  const card = pick.card;
  return {
    title: I.S("Word cards", "Tarjetas de palabras"),
    html: html`${crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${s.band}`], [I.S("Word cards", "Tarjetas de palabras"), null]])}
      <section class="fc-page">
        <header class="fc-head">
          <h1>${I.T("Word cards", "Tarjetas de palabras")}</h1>
          <p>${I.T("Flip a card, say the word aloud, then tell yourself if you know it. Cards you miss come back tomorrow.", "Voltea una tarjeta, di la palabra en voz alta y decide si la sabes. Las tarjetas que fallas vuelven mañana.")}</p>
        </header>
        <nav class="fc-pick" aria-label="${I.S("Choose a deck", "Elige un mazo")}">
          <div class="row-actions">${SKILLS.map((d) => chip(d, hrefFor({ ...s, cat: "" }, { domain: d, level: "A" }), d === s.domain))}</div>
          <div class="row-actions">${deck.levels.map((l) => chip(`${I.T("Level", "Nivel")} ${l}`, hrefFor({ ...s, cat: "" }, { level: l }), l === deck.level))}</div>
          ${deck.categories.length ? html`<div class="row-actions">${chip(I.T("All words", "Todas las palabras"), hrefFor(s, { level: deck.level, cat: "" }), !s.cat)}${deck.categories.map((c) => chip(c.title, hrefFor(s, { level: deck.level, cat: c.id }), s.cat === c.id))}</div>` : ""}
        </nav>
        ${
          card
            ? html`<article class="fc-card ${flipped ? "is-flipped" : ""}" aria-live="polite">
                <p class="fc-count">${I.T(`${deck.cards.length} words in this deck · ${known} you know`, `${deck.cards.length} palabras en este mazo · ${known} que sabes`)}</p>
                <h2 class="fc-term" lang="en">${card.term}</h2>
                <div class="row-actions">
                  <button type="button" class="ghost" data-fc-say="${card.term}">${icon("volume")} ${I.T("Hear it", "Escucharla")}</button>
                  <button type="button" class="btn" data-fc-flip aria-expanded="${flipped}">${flipped ? I.T("Hide meaning", "Ocultar significado") : I.T("Show meaning", "Mostrar significado")}</button>
                </div>
                ${
                  flipped
                    ? html`<p class="fc-def" lang="en">${card.def}</p>
                        ${card.es ? html`<p class="fc-es" lang="es">${icon("language")} ${card.es}</p>` : ""}
                        <div class="row-actions fc-rate">
                          <button type="button" class="btn btn-primary" data-fc-know="1">${icon("check")} ${I.T("I know it", "La sé")}</button>
                          <button type="button" class="btn" data-fc-know="0">${icon("retry")} ${I.T("Not yet", "Todavía no")}</button>
                        </div>`
                    : html`<p class="fine">${I.T("Try to say what it means before you look.", "Intenta decir qué significa antes de mirar.")}</p>`
                }
              </article>`
            : html`<article class="fc-card" role="status">
                <h2>${deck.cards.length ? I.T("You are caught up.", "Estás al día.") : I.T("No words in this deck yet.", "Todavía no hay palabras en este mazo.")}</h2>
                ${deck.cards.length ? html`<p>${I.T(`The next card comes back in ${pick.waiting} ${pick.waiting === 1 ? "day" : "days"}. Try partner talk below, or choose another deck.`, `La próxima tarjeta vuelve en ${pick.waiting} ${pick.waiting === 1 ? "día" : "días"}. Prueba la conversación en pareja o elige otro mazo.`)}</p>` : ""}
              </article>`
        }
        ${
          talk
            ? html`<section class="fc-pair" aria-labelledby="fcPair">
                <h2 id="fcPair">${icon("conversation")} ${I.T("Partner talk (5 minutes)", "Conversación en pareja (5 minutos)")}</h2>
                <p class="fine">${I.T("Work with a classmate, a family member or a friend. Any language is welcome first; then say it in English.", "Trabaja con un compañero, un familiar o un amigo. Primero puedes usar cualquier idioma; luego dilo en inglés.")}</p>
                <p class="fc-word" lang="en">${talk.word}</p>
                <dl class="fc-roles">
                  <div><dt>${I.T(talk.swap ? "Partner B" : "Partner A", talk.swap ? "Persona B" : "Persona A")}</dt><dd>${I.T(talk.speaker.en, talk.speaker.es)}</dd></div>
                  <div><dt>${I.T(talk.swap ? "Partner A" : "Partner B", talk.swap ? "Persona A" : "Persona B")}</dt><dd>${I.T(talk.listener.en, talk.listener.es)}</dd></div>
                </dl>
                <button type="button" class="btn" data-fc-pair-next>${I.T("Next word", "Siguiente palabra")}</button>
              </section>`
            : ""
        }
        <p class="fine fc-note">${I.T("Word cards are practice. They are not a test and do not estimate an ACCESS result.", "Las tarjetas son práctica. No son una prueba ni estiman un resultado de ACCESS.")}</p>
      </section>`,
  };
}

export async function onClick(e, ctx) {
  const I = i18nFor(ctx);
  const t = e.target;
  if (t.closest("[data-fc-flip]")) {
    flipped = !flipped;
    ctx.rerender({ keepFocus: true });
    return true;
  }
  const say = t.closest("[data-fc-say]");
  if (say) {
    speak(say.dataset.fcSay, { rate: ctx.prefs.rate || 0.9 });
    return true;
  }
  if (t.closest("[data-fc-pair-next]")) {
    pairAt += 1;
    ctx.rerender({ keepFocus: true });
    return true;
  }
  const know = t.closest("[data-fc-know]");
  if (know) {
    const s = selection(ctx);
    const deck = await loadDeck(s);
    const all = read();
    const key = deckKey({ ...s, level: deck.level });
    const state = all[key] || {};
    const { card } = nextCard(deck.cards, state, today());
    if (card) {
      state[norm(card.term)] = rate(state[norm(card.term)], know.dataset.fcKnow === "1", today());
      all[key] = state;
      storage.set(KEY, JSON.stringify(all));
      announce(know.dataset.fcKnow === "1" ? I.S("Saved. It will come back later.", "Guardado. Volverá más tarde.") : I.S("Saved. It comes back tomorrow.", "Guardado. Vuelve mañana."));
    }
    flipped = false;
    ctx.rerender();
    return true;
  }
  return false;
}
