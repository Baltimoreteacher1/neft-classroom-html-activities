// Practice Together (/practice-together): the family starting page. First screen: a warm welcome from Mr. Neft (the
// guide panel), the language switch, the grade choice (a teacher's ?grades= link opens the right grade; the family's
// own choice is remembered on this device) and ONE next action, "Let's begin". Then the tonight flow (choose, practice
// 5–10 minutes, celebrate), the two choices (Let's Talk = Speaking, Let's Write = Writing, each with three steps, one
// labeled example and a large Start button), quick answers, a language note, two closed sections and a quiet link to
// the printable one-page guide. Grades K–2 get one picture-talk routine instead (family-k2.js) and the K–2 handout.
// Each card has a "Hear the steps" button (family-read.js). All copy lives in family-data.js and family-k2-data.js
// as { en, es } pairs. The page is fully localized (docLang "es" in Español), so English names and examples carry
// lang="en".
import { i18nFor, langSwitchHTML } from "../i18n.js";
import { disclosure, trackDisclosures } from "../studio-ui.js";
import { ART, BASE, html, icon } from "../util.js";
import {
  FAMILY,
  FAMILY_BANDS,
  FAMILY_GRADE,
  FAMILY_HANDOUT,
  FAMILY_MORE,
  FAMILY_WELCOME,
  TONIGHT,
  familyActivitiesFor,
  familyBandFromGrades,
} from "./family-data.js";
import { earlyCardHTML, earlySteps } from "./family-k2.js";
import { EARLY_CARD, FAMILY_HANDOUT_K2 } from "./family-k2-data.js";
import { mountRead, onReadClick, readButtonHTML, unmountRead } from "./family-read.js";
import { bindGuide, guideHTML } from "./guide.js";
import { withReturn } from "./return-bar.js";
import { loadIntro, updateIntro } from "./state.js";
import { audienceMapHTML } from "../sitemap-ui.js";

const GUIDE_CHIPS = ["what", "account", "mic", "saved", "sound", "language"];
/** Domain colour and studio picture for each card: Let's Talk is Speaking, Let's Write is Writing. */
const DOMAIN = {
  talk: { cls: "d-speaking", art: "domain-speaking.svg", icon: "speaking" },
  write: { cls: "d-writing", art: "domain-writing.svg", icon: "writing" },
};

const en = (text) => html`<span lang="en">${text}</span>`;
const startHref = (route, band) =>
  withReturn(`${BASE}${route}${route.includes("?") ? "&" : "?"}grades=${band}`, "together");

/**
 * The grade to show: a teacher's shared link (?grades=) first, then the family's own choice on this device, else the
 * lab's current band (K–3 bands map to K–2).
 */
function chosenBand(ctx) {
  const linked = familyBandFromGrades(ctx.route?.grades);
  if (linked) return linked;
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

/** The studio picture with the domain word on it (colour is never the only signal). */
function artHTML(I, id) {
  const d = DOMAIN[id];
  return html`<div class="tg-art">
    <img src="${ART}/${d.art}" alt="" width="480" height="360" loading="lazy" decoding="async" />
    <span class="tg-tag">${icon(d.icon)}${I.TO(FAMILY_WELCOME.tags[id])}</span>
  </div>`;
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
  return html`<article class="tg-card is-${a.id} ${DOMAIN[a.id].cls}" aria-labelledby="tgCard-${a.id}">
    ${artHTML(I, a.id)}
    <header class="tg-card-head">
      <span class="tg-ic" aria-hidden="true">${icon(a.icon)}</span>
      <div>
        <h3 id="tgCard-${a.id}">${I.TO(a.title)}</h3>
        <p class="tg-activity">${en(a.activityName)}</p>
      </div>
    </header>
    <p class="tg-desc">${I.TO(a.description)}</p>
    ${readButtonHTML(I, a.id, a.title)}
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

function tonightHTML(I) {
  return html`<section class="tg-tonight" aria-labelledby="tgTonight">
    <h2 id="tgTonight">${I.TO(FAMILY_WELCOME.tonightHeading)}</h2>
    <ol class="tg-flow">
      ${TONIGHT.map(
        (t) =>
          html`<li class="tg-flow-${t.id}">
            <span class="tg-flow-ic" aria-hidden="true">${icon(t.icon)}</span>
            <strong>${I.TO(t.head)}</strong><span>${I.TO(t.body)}</span>
          </li>`,
      )}
    </ol>
  </section>`;
}

/** Mr. Neft welcomes the family; Spanish mode gets the Spanish panel, English and both-languages the English one. */
function guidePanel(I, band) {
  const lang = I.mode === "es" ? "es" : "en";
  const pick = (o) => (lang === "es" ? o.es : o.en);
  return guideHTML({
    say: `${pick(FAMILY_WELCOME.hello)} ${pick(FAMILY.welcome)}`,
    chips: GUIDE_CHIPS,
    context: { page: "family", pick: band },
    lang,
  });
}

/**
 * "Print a one-page guide": the file in the page's language; both files in English + Español. Grades K–2 get the
 * K–2 handout.
 */
function printHTML(I, band) {
  const langs = I.mode === "bi" ? ["en", "es"] : [I.mode === "es" ? "es" : "en"];
  const files = band === "k-2" ? FAMILY_HANDOUT_K2 : FAMILY_HANDOUT;
  return html`<p class="tg-print">
    ${langs.map((l) => {
      const f = files[l];
      const label = FAMILY_WELCOME.print[l];
      const word = FAMILY_WELCOME.printWord[l];
      return html`<span lang="${l}">
        <a href="${f.pdf}" target="_blank" rel="noopener">${icon("print")}${label} (PDF)</a>
        <a href="${f.docx}" download>${word}</a>
      </span>`;
    })}
  </p>`;
}

/** Quick answers; with K–2 chosen, "Where do we start?" names the one routine instead of the two choices. */
function answersHTML(I, band) {
  return html`<section class="tg-answers" aria-labelledby="tgAnswers">
    <h2 id="tgAnswers">${I.TO(FAMILY.answersHeading)}</h2>
    <dl>
      ${FAMILY.answers.map(
        (x) =>
          html`<div>
            <dt>${I.TO(x.q)}</dt>
            <dd>${I.TO(band === "k-2" && x.id === "where" ? EARLY_CARD.where : x.a)}</dd>
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
        <div class="tg-hero-main">
          <p class="eyebrow">${I.TO(FAMILY.eyebrow)}</p>
          <h1 id="tgTitle" tabindex="-1">${I.TO(FAMILY.title)}</h1>
          <p class="lead">${I.TO(FAMILY.lead)}</p>
          <div class="tg-lang">${langSwitchHTML(I.mode, { large: true, idPrefix: "tgLang" })}</div>
          ${bandHTML(I, band)}
          <button type="button" class="btn btn-primary btn-big tg-go" data-tg-go>
            ${I.TO(FAMILY_WELCOME.go)}${icon("chevron-down")}
          </button>
        </div>
        <div class="tg-hero-guide">${guidePanel(I, band)}</div>
      </header>
      ${tonightHTML(I)}
      <section class="tg-choices" aria-labelledby="tgChoose">
        <h2 id="tgChoose" tabindex="-1">${I.TO(FAMILY.chooseHeading)}</h2>
        <div class="tg-cards${band === "k-2" ? " is-single" : ""}">${band === "k-2" ? earlyCardHTML(I, ctx, { tag: FAMILY_WELCOME.tags.talk, start: FAMILY.start }) : familyActivitiesFor(band).map((a) => cardHTML(I, a, band))}</div>
      </section>
      ${answersHTML(I, band)}
      <section class="tg-language" aria-labelledby="tgLangHead">
        <h2 id="tgLangHead">${I.TO(FAMILY.languageHeading)}</h2>
        <p>${I.TO(FAMILY.languageNote)}</p>
        ${I.mode === "en" ? "" : html`<p class="fine">${I.TO(FAMILY.spanishNote)}</p>`}
      </section>
      <section class="tg-extras">${helpHTML(I)}${moreHTML(I)}</section>
      ${audienceMapHTML(I, ctx.band, "family", {
        id: "familyMap",
        limit: 4,
        title: ["Everything for families", "Todo para las familias"],
        lead: ["Every part of the site you can use at home, grouped the same way as the menu at the top.", "Cada parte del sitio que pueden usar en casa, agrupada igual que el menú de arriba."],
      })}
      <footer class="tg-foot">
        <p class="fine">${I.TO(FAMILY.privacy)}</p>
        ${printHTML(I, band)}
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

/** "Let's begin": bring the two choices into view and put focus on their heading. */
function goToChoices() {
  const target = document.getElementById("tgChoose");
  if (!target) return;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
  target.focus({ preventScroll: true });
}

/** The three steps a "Hear the steps" button reads: the K–2 routine, or Let's Talk / Let's Write for the grade. */
function stepsFor(ctx, id) {
  if (id === "early") return earlySteps(ctx);
  return familyActivitiesFor(chosenBand(ctx)).find((a) => a.id === id)?.steps || [];
}

export function onClick(e, ctx) {
  if (onReadClick(e, i18nFor(ctx).mode, (id) => stepsFor(ctx, id))) return true;
  if (e.target.closest?.("[data-tg-go]")) {
    goToChoices();
    return true;
  }
  const b = e.target.closest?.("[data-tg-band]");
  if (!b) return false;
  updateIntro("family", (f) => ({ ...f, band: b.dataset.tgBand }));
  // The family's own choice now wins over a teacher's link, so the link's ?grades= leaves the address.
  const url = new URL(location.href);
  if (url.searchParams.has("grades")) {
    url.searchParams.delete("grades");
    history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  }
  ctx.rerender();
  return true;
}

export function mount(root) {
  trackDisclosures(root);
  bindGuide();
  mountRead(root);
}
export const unmount = () => unmountRead();
