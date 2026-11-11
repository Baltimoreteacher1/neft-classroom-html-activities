// Practice Together (/practice-together): the family starting page. Two choices (Let's Talk, Let's Write), each with
// one short description, three steps, one labeled example and a large Start button, then quick answers, a language
// note, and two closed sections (Need help?, More practice). All copy lives in family-data.js as { en, es } pairs.
// The page is fully localized (docLang "es" in Español), so English names and examples carry lang="en".
import { i18nFor, langSwitchHTML } from "../i18n.js";
import { disclosure, trackDisclosures } from "../studio-ui.js";
import { BASE, html, icon } from "../util.js";
import { FAMILY, FAMILY_BANDS, FAMILY_GRADE, FAMILY_MORE, familyActivitiesFor } from "./family-data.js";
import { loadIntro, updateIntro } from "./state.js";
import { withReturn } from "./return-bar.js";

const en = (text) => html`<span lang="en">${text}</span>`;
const startHref = (route, band) =>
  withReturn(`${BASE}${route}${route.includes("?") ? "&" : "?"}grades=${band}`, "together");

/** The grade the family chose on this device, else the lab's current band (K–3 bands map to K–2). */
function chosenBand(ctx) {
  const saved = loadIntro().family?.band;
  if (FAMILY_BANDS.some((b) => b.id === saved)) return saved;
  if (ctx.band === "3-5" || ctx.band === "6-8") return ctx.band;
  return ["K", "1", "2-3"].includes(ctx.band) ? "k-2" : "6-8";
}

function bandHTML(I, band) {
  return html`<div class="tg-band">
    <p class="tg-label" id="tgBandLabel">${I.TO(FAMILY_GRADE.heading)}</p>
    <div class="tg-band-btns" role="group" aria-labelledby="tgBandLabel">
      ${FAMILY_BANDS.map((b) => html`<button type="button" class="in-seg" data-tg-band="${b.id}" aria-pressed="${b.id === band}">${I.TO(b.label)}</button>`)}
    </div>
  </div>`;
}

function earlyHTML(I) {
  const e = FAMILY_GRADE.early;
  return html`<article class="tg-card is-early" aria-labelledby="tgEarly">
    <header class="tg-card-head"><span class="tg-ic" aria-hidden="true">${icon("reading")}</span><div><h3 id="tgEarly">${I.TO(e.title)}</h3></div></header>
    <p class="tg-desc">${I.TO(e.text)}</p>
    <a class="btn btn-primary tg-start" href="${withReturn(`${BASE}${e.route}`, "together")}">${I.TO(e.cta)}${icon("arrow-right")}</a>
  </article>`;
}

function exampleHTML(I, a) {
  const ex = a.example;
  if (ex.plain) {
    return html`<div class="tg-example" role="group" aria-labelledby="tgEx-${a.id}">
      <p class="tg-label" id="tgEx-${a.id}">${I.TO(ex.label)}</p>
      <dl class="tg-pair">
        <dt>${I.TO(ex.plainLabel)}</dt>
        <dd lang="en">${ex.plain}</dd>
        <dt>${I.TO(ex.betterLabel)}</dt>
        <dd lang="en" class="is-better">${ex.better}</dd>
      </dl>
    </div>`;
  }
  return html`<div class="tg-example" role="group" aria-labelledby="tgEx-${a.id}">
    <p class="tg-label" id="tgEx-${a.id}">${I.TO(ex.label)}</p>
    <p class="tg-quote" lang="en">“${ex.text}”</p>
  </div>`;
}

function cardHTML(I, a, band) {
  return html`<article class="tg-card is-${a.id}" aria-labelledby="tgCard-${a.id}">
    <header class="tg-card-head">
      <span class="tg-ic" aria-hidden="true">${icon(a.icon)}</span>
      <div>
        <h3 id="tgCard-${a.id}">${I.TO(a.title)}</h3>
        <p class="tg-activity">${en(a.activityName)}</p>
      </div>
    </header>
    <p class="tg-desc">${I.TO(a.description)}</p>
    <ol class="tg-steps">
      ${a.steps.map(
        (s) => html`<li><strong>${I.TO(s.head)}</strong><span>${I.TO(s.body)}</span></li>`,
      )}
    </ol>
    ${exampleHTML(I, a)}
    <p class="fine tg-note">${I.TO(a.note)}</p>
    <a class="btn btn-primary tg-start" href="${startHref(a.route, band)}"
      >${I.TO(FAMILY.start)}<span class="visually-hidden">: ${I.TO(a.title)}</span>
      ${icon("arrow-right")}</a
    >
  </article>`;
}

function answersHTML(I) {
  return html`<section class="tg-answers" aria-labelledby="tgAnswers">
    <h2 id="tgAnswers">${I.TO(FAMILY.answersHeading)}</h2>
    <dl>
      ${FAMILY.answers.map(
        (x) =>
          html`<div>
            <dt>${I.TO(x.q)}</dt>
            <dd>${I.TO(x.a)}</dd>
          </div>`,
      )}
    </dl>
  </section>`;
}

function helpHTML(I) {
  const body = html`<dl class="tg-help">
    ${FAMILY.help.items.map(
      (x) =>
        html`<div>
          <dt>${I.TO(x.q)}</dt>
          <dd>
            ${I.TO(x.a)}
            ${x.link ? html` <a href="${BASE}${x.link.route}">${I.TO(x.link.label)}</a>` : ""}
          </dd>
        </div>`,
    )}
  </dl>`;
  return disclosure("tg-help", html`${icon("help")} ${I.TO(FAMILY.help.heading)}`, body, {
    cls: "tg-details",
  });
}

function moreHTML(I) {
  const body = html`<p class="fine">${I.TO(FAMILY.more.lead)}</p>
    <ul class="tg-more">
      ${FAMILY_MORE.map(
        (m) =>
          html`<li>
            <span class="tg-ic small" aria-hidden="true">${icon(m.icon)}</span>
            <div>
              <p>
                <strong>${en(m.name)}</strong>
                <span class="fine">${en(m.where)} · ${en(m.time)}</span>
              </p>
              <p>${I.TO(m.description)}</p>
            </div>
            <a class="btn" href="${startHref(m.route)}"
              >${I.TO(FAMILY.more.open)}<span class="visually-hidden">: ${en(m.name)}</span></a
            >
          </li>`,
      )}
    </ul>`;
  return disclosure("tg-more", html`${icon("reading")} ${I.TO(FAMILY.more.heading)}`, body, {
    cls: "tg-details",
  });
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = chosenBand(ctx);
  const title = I.S(FAMILY.title.en, FAMILY.title.es);
  return {
    title,
    html: html`<article class="tg-page" aria-labelledby="tgTitle">
      <header class="tg-hero">
        <p class="eyebrow">${I.TO(FAMILY.eyebrow)}</p>
        <h1 id="tgTitle" tabindex="-1">${I.TO(FAMILY.title)}</h1>
        <p class="lead">${I.TO(FAMILY.lead)}</p>
        <div class="tg-lang">${langSwitchHTML(I.mode, { large: true, idPrefix: "tgLang" })}</div>
        <p class="tg-welcome">${I.TO(FAMILY.welcome)}</p>
      </header>
      <section class="tg-choices" aria-labelledby="tgChoose">
        <h2 id="tgChoose">${I.TO(FAMILY.chooseHeading)}</h2>
        ${bandHTML(I, band)}
        <div class="tg-cards${band === "k-2" ? " is-single" : ""}">${band === "k-2" ? earlyHTML(I) : familyActivitiesFor(band).map((a) => cardHTML(I, a, band))}</div>
      </section>
      ${answersHTML(I)}
      <section class="tg-language" aria-labelledby="tgLangHead">
        <h2 id="tgLangHead">${I.TO(FAMILY.languageHeading)}</h2>
        <p>${I.TO(FAMILY.languageNote)}</p>
        ${I.mode === "en" ? "" : html`<p class="fine">${I.TO(FAMILY.spanishNote)}</p>`}
      </section>
      <section class="tg-extras">${helpHTML(I)}${moreHTML(I)}</section>
      <footer class="tg-foot">
        <p class="fine">${I.TO(FAMILY.privacy)}</p>
        <p class="tg-links">
          <a href="${BASE}${FAMILY.links.siteGuide.route}">${I.TO(FAMILY.links.siteGuide.label)}</a>
          <a href="${BASE}${FAMILY.links.familyCorner.route}"
            >${I.TO(FAMILY.links.familyCorner.label)}</a
          >
        </p>
      </footer>
    </article>`,
  };
}

export function onClick(e, ctx) {
  const b = e.target.closest?.("[data-tg-band]");
  if (!b) return false;
  updateIntro("family", (f) => ({ ...f, band: b.dataset.tgBand }));
  ctx.rerender();
  return true;
}

export const mount = (root) => trackDisclosures(root);
export const unmount = () => {};
