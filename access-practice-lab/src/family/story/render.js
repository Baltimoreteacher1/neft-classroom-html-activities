// The family-facing page of a Family Language Story, as markup. One renderer for the family's phone (page.js), the
// teacher's live preview and the printed fridge card, so what a teacher approves is exactly what a family sees.
// Every sentence comes from wording.js through `compose`; `I` (src/i18n.js) decides English, Español or both.
import { html, icon, raw } from "../../util.js";
import { DOMAIN_IDS, DOMAIN_WORD, FROM_LINK } from "./wording.js";
import { starterSpeech, weekDate } from "./model.js";

const DOMAIN_ICON = { L: "listening", R: "reading", S: "speaking", W: "writing" };

/** "Week of November 16" / "Semana del 16 de noviembre" (English for English and bilingual modes). */
export function weekLabel(I, k) {
  const iso = weekDate(k);
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  const en = d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const es = d.toLocaleDateString("es-US", { month: "long", day: "numeric" });
  return I.S(`Week of ${en}`, `Semana del ${es}`);
}


/** Listen buttons for one block: English, Spanish or both, following the language mode. Uses the lab's shared handlers. */
function listen(I, en, es, label) {
  const mk = (attr, text, lang) =>
    html`<button
      type="button"
      class="ghost small"
      ${raw(attr)}="${text}"
      ${lang ? raw(`lang="${lang}"`) : ""}
    >
      ${icon("volume")} ${lang === "es" ? "Escuchar" : "Listen"}<span class="visually-hidden">
        ${label}</span
      >
    </button>`;
  return html`<span class="fls-say no-print"
    >${!I.spanish ? mk("data-say", en, "") : ""}${I.spanish || I.bilingual ? mk("data-say-es", es, "es") : ""}</span
  >`;
}

function skillsHTML(I, c) {
  if (!c.week.skills.length) return html`<p class="fls-quiet">${I.TO(c.week.none)}</p>`;
  return html`<p class="fls-label">${I.TO(c.week.lead)}</p>
    <ul class="fls-skills">
      ${c.week.skills.map(
        (s) =>
          html`<li class="d-${DOMAIN_IDS[s.id].toLowerCase()}">
            <span class="fls-tile">${icon(DOMAIN_ICON[s.id])}</span><strong>${I.TO(s)}</strong>
          </li>`,
      )}
    </ul>`;
}

function celebrateHTML(I, c) {
  const q = c.celebrate.quote;
  return html`<section class="fls-card fls-celebrate" aria-labelledby="flsCelebrate">
    <h2 id="flsCelebrate">
      <span aria-hidden="true">⭐</span> ${I.T("Something to celebrate", "Algo para celebrar")}
    </h2>
    <p class="fls-big">${I.TO(c.celebrate.text)}</p>
    ${listen(I, c.celebrate.text.en, c.celebrate.text.es, I.S("Something to celebrate", "Algo para celebrar"))}
    ${
      q
        ? html`<figure class="fls-quote">
            <figcaption>${I.TO(q.lead)}</figcaption>
            <blockquote lang="en"><p>“${q.text}”</p></blockquote>
            <span class="fls-say no-print"><button type="button" class="ghost small" data-say="${q.text}">${icon("volume")} ${I.S("Hear it", "Escucharlo")}</button></span>
          </figure>`
        : ""
    }
  </section>`;
}

function starterHTML(I, c, s, { featured, tried, preview }) {
  const domain = DOMAIN_IDS[s.domain];
  return html`<article
    class="fls-talk-card d-${domain.toLowerCase()}${featured ? " is-featured" : ""}"
    data-fls-starter="${s.id}"
  >
    <p class="fls-skill-tag">
      <span class="fls-tile">${icon(DOMAIN_ICON[s.domain])}</span>${I.TO(DOMAIN_WORD[s.domain])}
    </p>
    <p class="fls-ask">${I.TO(s.ask)}</p>
    <p class="fls-label">${I.T("Sentence starter", "Inicio de oración")}</p>
    <p class="fls-frame">${I.TO(s.frame)}</p>
    <p class="fls-either">${I.TO(c.either)}</p>
    <div class="fls-actions no-print">
      ${listen(I, starterSpeech(s, "en"), starterSpeech(s, "es"), I.S("this talk", "esta conversación"))}
      <button
        type="button"
        class="btn ${tried ? "" : featured ? "btn-primary" : ""} fls-try"
        data-fls-try="${s.id}"
        aria-pressed="${String(tried)}"
        ${preview ? "disabled" : ""}
      >
        ${icon("check")} ${I.T("We tried it", "Lo intentamos")}
      </button>
    </div>
  </article>`;
}

function talkHTML(I, c, tries, preview) {
  const [first, ...rest] = c.starters;
  const card = (s, featured) =>
    starterHTML(I, c, s, { featured, tried: Boolean(tries.ticks[s.id]), preview });
  return html`<section class="fls-card fls-talk" aria-labelledby="flsTalk">
      <h2 id="flsTalk">
        <span aria-hidden="true">💬</span> ${I.T("Tonight’s talk", "La conversación de hoy")}
      </h2>
      ${card(first, true)}
    </section>
    ${
      rest.length
        ? html`<section class="fls-card fls-more" aria-labelledby="flsMore">
            <h2 id="flsMore">
              ${I.T("More ways to talk this week", "Más formas de conversar esta semana")}
            </h2>
            <div class="fls-more-grid">${rest.map((s) => card(s, false))}</div>
          </section>`
        : ""
    }`;
}

/** The note to the teacher: shown once the family has marked a talk. `message` is the text the buttons send. */
export function replyHTML(I, tries, message, { canShare }) {
  const how = (id, en, es) =>
    html`<button type="button" class="chip" data-fls-how="${id}" aria-pressed="${String(tries.how === id)}">
      ${I.T(en, es)}
    </button>`;
  return html`<section class="fls-card fls-reply no-print" aria-labelledby="flsReply" data-fls-reply>
    <h2 id="flsReply">
      <span aria-hidden="true">✉️</span>
      ${I.T("Tell your teacher", "Cuéntenle a su maestro o maestra")}
    </h2>
    <p>
      ${I.T("A quick note helps your teacher. You choose how to send it.", "Una nota corta ayuda a su maestro o maestra. Ustedes deciden cómo enviarla.")}
    </p>
    <div class="fls-chips" role="group" aria-label="${I.S("How did it go?", "¿Cómo les fue?")}">
      ${how("tried", "We tried it", "Lo intentamos")}${how("easy", "It went well", "Nos fue bien")}${how("hard", "It was hard", "Nos costó")}${how("help", "We need help", "Necesitamos ayuda")}
    </div>
    <label class="fls-check"
      ><input type="checkbox" data-fls-both ${tries.both ? "checked" : ""} />
      <span>${I.T("We used English and Spanish", "Usamos inglés y español")}</span></label
    >
    <p class="fls-label">${I.T("Your note", "Su nota")}</p>
    <p class="fls-message" data-fls-message>${message}</p>
    <div class="fls-actions">
      ${canShare ? html`<button type="button" class="btn btn-primary" data-fls-send>${icon("mail")} ${I.T("Send with my phone", "Enviar con mi teléfono")}</button>` : ""}
      <button type="button" class="btn ${canShare ? "" : "btn-primary"}" data-fls-copy>
        ${icon("copy")} ${I.T("Copy the note", "Copiar la nota")}
      </button>
    </div>
    <p class="fine">
      ${I.T("Paste it in the way you already talk with your teacher: a text, an email or the class app. Nothing is sent from this page.", "Péguenla en la forma en que ya hablan con su maestro o maestra: un mensaje, un correo o la aplicación de la clase. Esta página no envía nada.")}
    </p>
    <p class="visually-hidden" role="status" aria-live="polite" data-fls-status></p>
  </section>`;
}

/**
 * @param {object} I          makeI18n(...) for the language shown
 * @param {object} c          compose(story)
 * @param {{ticks:object,how:string,both:boolean}} tries
 * @param {{preview?:boolean, qr?:string, fromLink?:boolean, reply?:string}} opts
 *        `qr` is an SVG string (shared/qr/qr-code.mjs) shown only in print; `reply` is replyHTML markup.
 */
export function storyHTML(
  I,
  c,
  tries,
  { preview = false, qr = "", fromLink = false, reply = "" } = {},
) {
  const week = weekLabel(I, c.story.k);
  return html`<article class="fls" data-family-story aria-labelledby="flsTitle">
    <header class="fls-hero">
      <p class="fls-eyebrow">
        ${I.T("A note from your child’s teacher", "Una nota del maestro o la maestra de su hijo o hija")}
      </p>
      <h1 id="flsTitle" tabindex="-1">${I.TO(c.title)}</h1>
      ${week ? html`<p class="fls-weeklabel">${week}</p>` : ""}
      <div class="fls-top no-print">
        <button
          type="button"
          class="btn btn-primary btn-big"
          data-fls-listen
        >
          ${icon("volume")} ${I.T("Listen to this page", "Escuchar esta página")}
        </button>
        <button type="button" class="btn" data-stop-audio>
          ${icon("stop")} ${I.T("Stop", "Detener")}
        </button>
      </div>
    </header>
    <section class="fls-card fls-week" aria-labelledby="flsWeek">
      <h2 id="flsWeek"><span aria-hidden="true">📅</span> ${I.T("This week", "Esta semana")}</h2>
      <p class="fls-line">${I.TO(c.week.line)}</p>
      ${skillsHTML(I, c)}
    </section>
    ${celebrateHTML(I, c)} ${talkHTML(I, c, tries, preview)}
    ${
      c.note
        ? html`<section class="fls-card fls-note" aria-labelledby="flsNote">
            <h2 id="flsNote">${I.TO(c.note.lead)}</h2>
            <p lang="${c.note.lang}">${c.note.text}</p>
          </section>`
        : ""
    }
    ${reply}
    <div class="fls-foot">
      ${
        qr
          ? html`<div class="fls-qr">
              <div aria-hidden="true">${raw(qr)}</div>
              <p>
                ${I.T("Scan with a phone to listen and read in Spanish or English.", "Escaneen con un teléfono para escuchar y leer en español o inglés.")}
              </p>
            </div>`
          : ""
      }
      <p class="fine">${I.TO(c.fine)}</p>
      ${fromLink && !preview ? html`<p class="fine no-print">${I.TO(FROM_LINK)}</p>` : ""}
    </div>
  </article>`;
}
