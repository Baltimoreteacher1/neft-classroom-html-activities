// Site Guide top summary: what the site is, the grade picker and the four domain cards for the chosen grade (shared
// with /start and the tour through band.js and tour-bands.js), plus a way into the printable resources. Shown to the
// general reader and to teachers; families have Practice at Home and students go straight to the activities.
import { BASE, html, icon } from "../util.js";
import { bandPickerHTML, domainCardsHTML, pickName } from "./band.js";
import { ROUTES } from "./data.js";
import { GUIDE } from "./site-guide-data.js";
import { linkHTML } from "./site-guide-cards.js";
import { withReturn } from "./return-bar.js";
import { DOMAIN_STOP, tourHref } from "./start-overview.js";
import { tourRoute } from "./tour-bands.js";

const actions = (pick) => (a) =>
  html`<p class="ov-card-actions">
    <a class="btn small btn-primary" href="${withReturn(`${BASE}${tourRoute(a)}`, "siteguide")}"
      >Open the activity<span class="visually-hidden">: ${a.title}</span>${icon("arrow-right")}</a
    >
    <a class="btn small ghost" href="${tourHref(pick, DOMAIN_STOP[a.domain.id])}"
      >Try it in the tour<span class="visually-hidden">: ${a.domain.name}</span></a
    >
  </p>`;

export function overviewSection(I, pick) {
  return html`<section class="sg-overview no-print" aria-labelledby="sgOverviewH">
    <div class="sg-ov-text">
      <h2 id="sgOverviewH">
        ${I.T("The Language Page at a glance", "The Language Page de un vistazo")}
      </h2>
      <p>${I.TO(GUIDE.overview)}</p>
      <p class="sg-ov-links">
        ${linkHTML(`${ROUTES.start}#ov-resources`, html`${icon("download")} ${I.T("Printable guides and resources", "Guías y recursos para imprimir")}`, "btn small")}
        ${linkHTML(ROUTES.together, html`${icon("families")} ${I.T("The family page", "La página para familias")}`, "btn small ghost")}
      </p>
    </div>
    <div class="sg-ov-band" lang="en">
      ${bandPickerHTML(pick, {
        label: "Choose grades to see one activity in each domain",
        hint: `Showing ${pickName(pick)}.`,
      })}
      ${domainCardsHTML(pick, actions(pick))}
    </div>
  </section>`;
}
