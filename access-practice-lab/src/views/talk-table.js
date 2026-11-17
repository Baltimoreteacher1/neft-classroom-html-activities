// Talk Table (/talk-table, /talk-table/<narrate|inform|explain|argue>): one bilingual conversation card at a time
// for a family table, a car ride or a five-minute class opener. English and Spanish always show side by side, because
// the grown-up and the child may read different languages; home language first is welcome. The card stays the same
// all day; "We talked about it" saves that on this device and moves on. No timer, no score, no streak to protect.
// Rules: src/lang/boards.js. Content: content/talk-table.json.
import { bandLabel, bandLabelEs } from "../bands.js";
import { crumbsHTML } from "../components.js";
import { loadTalkTable } from "../content.js";
import { award } from "../engagement.js";
import { i18nFor } from "../i18n.js";
import {
  KEY_LANGUAGE_USES,
  KLU_KIDS,
  TALK_KEY,
  cardFor,
  cleanTalk,
  deckFor,
  kluFromSlug,
  talkDaysThisWeek,
} from "../lang/boards.js";
import { printSheet } from "../print-sheet.js";
import { BASE, announce, html, icon, safeJson, storage, todayISO } from "../util.js";

const KLU_ES = { Narrate: "Narrar", Inform: "Informar", Explain: "Explicar", Argue: "Argumentar" };
const ui = { key: "", skip: 0, follow: false, pin: "" };
// The card on screen: a card just marked "talked" stays pinned until "Another card", so it never swaps under a tap.
const currentCard = (deck, talked, today) => (ui.pin && deck.find((c) => c.id === ui.pin)) || cardFor(deck, talked, today, ui.skip);

const readTalk = () => cleanTalk(safeJson(storage.get(TALK_KEY), {}));
const pairT = (I, p) => I.T(p[0], p[1]);
const deckHref = (band, klu = "") =>
  `${BASE}/talk-table${klu ? `/${KLU_KIDS[klu].slug}` : ""}?grades=${band}`;

function chips(I, band, klu) {
  const chip = (label, href, on) =>
    html`<a class="cat-chip" href="${href}" aria-current="${on ? "true" : "false"}">${label}</a>`;
  return html`<nav
    class="tt-decks row-actions"
    aria-label="${I.S("Choose a kind of talk", "Elige un tipo de conversación")}"
  >
    ${chip(I.T("All cards", "Todas las tarjetas"), deckHref(band), !klu)}
    ${KEY_LANGUAGE_USES.map((k) => chip(pairT(I, KLU_KIDS[k].name), deckHref(band, k), k === klu))}
  </nav>`;
}

function cardHTML(I, card, talkedToday) {
  const k = KLU_KIDS[card.klu];
  return html`<article class="tt-card tone-${k.tone}" aria-labelledby="ttQ">
    <p class="tt-kind">
      ${icon(k.icon)} ${pairT(I, k.name)}
      <span class="fine">· ${I.T(`WIDA: ${card.klu}`, `WIDA: ${KLU_ES[card.klu]}`)}</span>
    </p>
    <div class="tt-sides">
      <div class="tt-side" lang="en">
        <p class="tt-lang">English</p>
        <h2 id="ttQ" class="tt-q" tabindex="-1">${card.q[0]}</h2>
        <button type="button" class="btn small" data-say="${card.q[0]}">
          ${icon("volume")} Hear it
        </button>
      </div>
      <div class="tt-side" lang="es">
        <p class="tt-lang">Español</p>
        <p class="tt-q">${card.q[1]}</p>
        <button type="button" class="btn small" data-say-es="${card.q[1]}">
          ${icon("volume")} Escuchar
        </button>
      </div>
    </div>
    <div class="tt-help">
      <p class="cb-label">${I.T("Start your answer", "Empieza tu respuesta")}</p>
      <p class="tt-starter" lang="en">${card.starter[0]}</p>
      <p class="tt-starter-es fine" lang="es">${card.starter[1]}</p>
      <ul class="tt-words" aria-label="${I.S("Useful words", "Palabras útiles")}">
        ${card.words.map((w) => html`<li><span lang="en">${w.en}</span> <span class="fine" lang="es">${w.es}</span></li>`)}
      </ul>
    </div>
    ${
      ui.follow
        ? html`<div class="tt-follow" id="ttFollow">
            <p class="cb-label">${I.T("Ask next", "Pregunta después")}</p>
            <p lang="en">${card.followUp[0]}</p>
            <p class="fine" lang="es">${card.followUp[1]}</p>
          </div>`
        : html`<button
            type="button"
            class="btn ghost"
            data-tt-follow
            aria-controls="ttFollow"
            aria-expanded="false"
          >
            ${icon("conversation")} ${I.T("Ask a follow-up question", "Hacer una pregunta más")}
          </button>`
    }
    <div class="row-actions tt-actions">
      <button
        type="button"
        class="btn btn-primary btn-big"
        data-tt-talked
        ${talkedToday ? "disabled" : ""}
      >
        ${icon("check")}
        ${talkedToday ? I.T("Saved: we talked about it", "Guardado: ya conversamos") : I.T("We talked about it", "Ya conversamos")}
      </button>
      <button type="button" class="btn" data-tt-next>
        ${icon("arrow-right")} ${I.T("Another card", "Otra tarjeta")}
      </button>
    </div>
  </article>`;
}

function printHTML(band, deck) {
  return html`<article class="tt-print">
    <h1>Talk Table · Mesa de conversación · ${bandLabel(band)}</h1>
    <p>
      Cut out the cards. Pick one at dinner or in the car. Answer in any language first, then try it
      in English. / Recorten las tarjetas. Escojan una en la cena o en el carro. Respondan primero
      en cualquier idioma y luego intenten en inglés.
    </p>
    <ul class="tt-print-cards">
      ${deck.map(
        (c) =>
          html`<li>
            <p class="tt-print-kind">${KLU_KIDS[c.klu].name[0]} · ${KLU_KIDS[c.klu].name[1]}</p>
            <p lang="en"><strong>${c.q[0]}</strong></p>
            <p lang="es">${c.q[1]}</p>
            <p lang="en"><em>${c.starter[0]}</em></p>
            <p lang="en">Ask next: ${c.followUp[0]} <span lang="es">/ ${c.followUp[1]}</span></p>
          </li>`,
      )}
    </ul>
  </article>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  const klu = kluFromSlug(ctx.route.id);
  const key = `${band}:${klu}`;
  if (ui.key !== key) Object.assign(ui, { key, skip: 0, follow: false, pin: "" });
  const data = await loadTalkTable();
  const deck = deckFor(data, band, klu);
  const { talked } = readTalk();
  const today = todayISO();
  const card = currentCard(deck, talked, today);
  const fresh = deck.filter((c) => !talked[c.id]).length;
  const days = talkDaysThisWeek(talked, today);
  const title = I.S("Talk Table", "Mesa de conversación");
  return {
    title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [title, null],
      ])}
      <div class="cb tt">
        <header class="cb-hero">
          <p class="eyebrow">${icon("families")} ${I.S(bandLabel(band), bandLabelEs(band))}</p>
          <h1 tabindex="-1">${I.T("Talk Table", "Mesa de conversación")}</h1>
          <p class="lead">
            ${I.T("One question, two languages, five minutes together. Answer in any language first, then try it in English.", "Una pregunta, dos idiomas, cinco minutos juntos. Respondan primero en cualquier idioma y luego intenten en inglés.")}
          </p>
        </header>
        ${chips(I, band, klu)}
        ${card ? cardHTML(I, card, Boolean(talked[card.id] === today)) : html`<p class="panel">${I.T("No cards for this grade band yet.", "Todavía no hay tarjetas para este nivel.")}</p>`}
        <p class="fine tt-count" role="status">
          ${days ? I.T(`You talked on ${days} ${days === 1 ? "day" : "days"} this week.`, `Conversaron ${days} ${days === 1 ? "día" : "días"} esta semana.`) : I.T("Any night is a good night to start.", "Cualquier noche es buena para empezar.")}
          ${I.T(`${fresh} of ${deck.length} cards still new.`, `${fresh} de ${deck.length} tarjetas todavía nuevas.`)}
        </p>
        <section class="panel cb-guide" data-fold aria-labelledby="ttHow">
          <h2 id="ttHow">${icon("help")} ${I.T("How to use it at home", "Cómo usarla en casa")}</h2>
          <ol>
            <li>
              ${I.T("Read the question out loud, in English, Spanish or both.", "Lean la pregunta en voz alta, en inglés, en español o en los dos.")}
            </li>
            <li>
              ${I.T("Let your child answer first. Use the sentence start if they get stuck.", "Deje que su hijo o hija responda primero. Usen el inicio de oración si se atora.")}
            </li>
            <li>
              ${I.T("Ask the follow-up question. Then share your own answer.", "Hagan la pregunta de seguimiento. Luego comparta su propia respuesta.")}
            </li>
          </ol>
          <p class="fine">
            ${I.T("Nothing is sent anywhere. Which cards you talked about stays on this device.", "No se envía nada. Las tarjetas que conversaron se quedan en este dispositivo.")}
          </p>
        </section>
        <section class="panel cb-guide" data-fold aria-labelledby="ttClass">
          <h2 id="ttClass">
            ${icon("teacher")}
            ${I.T("In class: a five-minute opener", "En clase: un inicio de cinco minutos")}
          </h2>
          <p>
            ${I.T("Project the card. Partners take turns: one answers with the sentence start, the other asks the follow-up, then switch. Listen for the useful words. Cards are grouped by WIDA Key Language Use, so you can match tonight's card to today's lesson.", "Proyecte la tarjeta. Las parejas se turnan: uno responde con el inicio de oración, el otro hace la pregunta de seguimiento, y luego cambian. Escuche las palabras útiles. Las tarjetas están agrupadas por uso clave del lenguaje WIDA, para que la tarjeta de esta noche coincida con la lección de hoy.")}
          </p>
        </section>
        <div class="row-actions cb-actions">
          <button type="button" class="btn" data-tt-print>
            ${icon("print")} ${I.T("Print cards to cut out", "Imprimir tarjetas para recortar")}
          </button>
          <a class="btn ghost" href="${BASE}/choice-boards?grades=${band}"
            >${icon("grid")} ${I.T("Language Choice Boards", "Tableros de opciones de lenguaje")}</a
          >
        </div>
      </div>`,
  };
}

export async function onClick(e, ctx) {
  const I = i18nFor(ctx);
  const t = e.target.closest("button");
  if (!t) return false;
  const band = ctx.band;
  const klu = kluFromSlug(ctx.route.id);
  if (t.matches("[data-tt-follow]")) {
    ui.follow = true;
    await ctx.rerender();
    document.getElementById("ttFollow")?.setAttribute("tabindex", "-1");
    document.getElementById("ttFollow")?.focus();
    return true;
  }
  if (t.matches("[data-tt-next]")) {
    Object.assign(ui, { skip: ui.pin ? ui.skip : ui.skip + 1, follow: false, pin: "" });
    await ctx.rerender();
    document.getElementById("ttQ")?.focus();
    return true;
  }
  if (t.matches("[data-tt-talked]")) {
    const data = await loadTalkTable();
    const deck = deckFor(data, band, klu);
    const state = readTalk();
    const today = todayISO();
    const card = currentCard(deck, state.talked, today);
    if (card) {
      state.talked[card.id] = today;
      storage.set(TALK_KEY, JSON.stringify(state));
      award(ctx, `talk:${card.id}`, 3, "Talk Table");
      announce(
        I.S(
          "Saved. Nice talking! Come back for a new card anytime.",
          "Guardado. ¡Qué buena conversación! Vuelvan por otra tarjeta cuando quieran.",
        ),
      );
    }
    ui.pin = card?.id || "";
    await ctx.rerender();
    return true;
  }
  if (t.matches("[data-tt-print]")) {
    const data = await loadTalkTable();
    printSheet(printHTML(band, deckFor(data, band, klu)));
    return true;
  }
  return false;
}
