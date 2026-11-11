// Step 6 of the Guided Tour (/start/tour): one activity, one class, one time. The plan card carries the student link,
// a QR code for it (shared/qr/qr-code.mjs, decoder-checked in tools/access-intro-tour.test.mjs), a full-screen "Show to
// the class" view, the Launch Studio hand-off, Print (only the plan card prints) and Email (a mailto: with no address).
import { MAX_BYTES, qrSvg } from "../../../shared/qr/qr-code.mjs";
import { BASE, html, icon, raw } from "../util.js";
import { DOWNLOADS, FEATURED_LESSON, ROUTES, TOUR_STOPS, absUrl } from "./data.js";
import { pickName } from "./band.js";
import { guideHTML } from "./guide.js";
import { tourActivities, tourActivity, tourRoute } from "./tour-bands.js";
import { labHref } from "./ui.js";
import { withReturn } from "./return-bar.js";

const PLAN_TITLE = "My plan from The Language Page tour";

/**
 * The site's encoder stops at QR version 5 (106 bytes). Two student links (the Language Upgrade Lab items, 107 and 109
 * bytes) are longer, so they get no code: the link is shown instead. Every other tour link has one.
 */
export const qrFits = (url) => new TextEncoder().encode(url).length <= MAX_BYTES;

const qrFor = (url, title, px) =>
  qrFits(url) ? raw(qrSvg(url, { px, label: `QR code for the student link to ${title}` })) : "";
const LAST = TOUR_STOPS.length - 1;

/** The plan as plain text: what Copy my plan copies and what Email it to myself puts in the body. */
export function planText(pick, notes) {
  const a = tourActivity(pick, notes.pick);
  return [
    PLAN_TITLE,
    `Grades: ${pickName(pick)}`,
    a ? `Activity: ${a.title} (${a.domain.name}, about ${a.minutes} min)` : "",
    a ? `Student link: ${absUrl(tourRoute(a))}` : "",
    notes.group ? `Class or group: ${notes.group}` : "",
    notes.when ? `When: ${notes.when}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** mailto: with a subject and the plan as the body; the teacher types their own address. */
export const planMailto = (pick, notes) =>
  `mailto:?subject=${encodeURIComponent(PLAN_TITLE)}&body=${encodeURIComponent(planText(pick, notes))}`;

/** "Class or group: … · When: …" for the card (empty when neither is filled in). */
export const planForText = (notes) =>
  [notes.group ? `Class or group: ${notes.group}` : "", notes.when ? `When: ${notes.when}` : ""]
    .filter(Boolean)
    .join(" · ");

/** Activities the Launch Studio lists: the lab's leveled activities (/<Domain>/<Level>/<id>). */
export const inLaunchStudio = (a) =>
  /^\/(Listening|Speaking|Reading|Writing)\/[A-Z]+\//.test(a.route);

function assignHTML(a, pick) {
  if (!inLaunchStudio(a))
    return html`<p class="fine tr-assign">
      The Launch Studio lists the lab’s leveled activities, and this one is not among them. Share
      the student link or the QR code instead.
    </p>`;
  return html`<p class="tr-assign">
    <a class="btn" href="${BASE}/launch-studio?grades=${encodeURIComponent(pick)}" data-tr-assign
      >${icon("launch")}Assign to my class</a
    ><span class="fine"
      >In the Launch Studio, choose ${a.domain.name} under “Language domain”, then “${a.title}”
      under “Activity”.</span
    >
  </p>`;
}

/** The full-screen view: a large QR and the link, for a projector. A native modal dialog (Escape closes it). */
function showHTML(a, url) {
  return html`<dialog class="tr-show" data-tr-show-dialog aria-labelledby="trShowTitle">
    <h2 id="trShowTitle">${a.title}</h2>
    <p class="tr-show-lead">
      ${qrFits(url) ? "Scan the code with a tablet or phone camera, or type the link." : "Type this link, or open it from your class page."}
    </p>
    ${qrFor(url, a.title, 480)}
    <p class="tr-show-url">${url.replace(/^https:\/\//, "")}</p>
    <button type="button" class="btn btn-primary" data-tr-show-close>${icon("close")}Close</button>
  </dialog>`;
}

function chosenHTML(pick, a, notes) {
  const url = absUrl(tourRoute(a));
  return html`<p class="tr-plan-act">
      <span class="in-ic" aria-hidden="true">${icon(a.domain.icon)}</span
      ><span
        ><strong>${a.title}</strong
        ><small>${a.domain.name} · ${pickName(pick)} · about ${a.minutes} min</small></span
      >
    </p>
    <p class="tr-plan-for" data-tr-plan-for>${planForText(notes)}</p>
    <p>${a.use}</p>
    <div class="tr-plan-link">
      ${qrFor(url, a.title, 144)}
      <div class="tr-plan-link-text">
        <p class="tr-plan-label">Student link</p>
        <p class="tr-plan-url">${url}</p>
        ${qrFits(url) ? "" : html`<p class="fine">This link is too long for a QR code. Copy it or show it to the class.</p>`}
        <button type="button" class="btn small" data-tr-show>
          ${icon("classroom")}Show to the class
        </button>
      </div>
    </div>
    <p class="in-actions tr-plan-actions">
      <a class="btn btn-primary" href="${withReturn(`${BASE}${tourRoute(a)}`, "tour")}"
        >Open it${icon("arrow-right")}</a
      >
      <button type="button" class="btn" data-tr-copy="link" data-copy="${url}">
        ${icon("copy")}Copy student link
      </button>
      <button type="button" class="btn ghost" data-tr-copy="plan">
        ${icon("copy")}Copy my plan
      </button>
      <button type="button" class="btn ghost" data-tr-print>${icon("print")}Print my plan</button>
      <a class="btn ghost" data-tr-email href="${planMailto(pick, notes)}"
        >${icon("mail")}Email it to myself</a
      >
    </p>
    <p class="fine" data-tr-copy-note aria-live="polite"></p>
    ${assignHTML(a, pick)} ${showHTML(a, url)}`;
}

function nextHTML(pick) {
  const item = (href, ic, title, sub) =>
    html`<li>
      <a href="${href}"
        >${icon(ic)}<span><strong>${title}</strong><small>${sub}</small></span></a
      >
    </li>`;
  return html`<section class="tr-card tr-next" aria-labelledby="trNextTitle">
    <h2 id="trNextTitle">Keep going</h2>
    <ul class="tr-next-list">
      ${item(labHref(ROUTES.guide), "print", "Quick Guide", "Two pages to print or keep")}
      ${item(labHref(ROUTES.activities), "library", "Activity Guide", "Every step of each activity")}
      ${item(`${labHref(ROUTES.siteGuide)}?for=teacher`, "help", "Site Guide", "The whole site, with search")}
      ${item(
        `${labHref(ROUTES.together)}?grades=${pick}`,
        "families",
        "Family page",
        "Send families one link, English and Spanish",
      )}
      ${
        pick === "6-8"
          ? item(
              labHref(ROUTES.lesson),
              "conversation",
              FEATURED_LESSON.title,
              "A 10-minute speak-then-write lesson",
            )
          : ""
      }
      ${item(DOWNLOADS.activityGuide.pdf, "download", "Activity Guide (PDF)", "One activity per page")}
    </ul>
  </section>`;
}

/** Step 6: one activity, one class, one time, and where to go next. */
export function planHTML(pick, tour) {
  const notes = tour.notes || {};
  const chosen = tourActivity(pick, notes.pick);
  return html`<div class="tr-plan">
    <section class="tr-card" aria-labelledby="trPlanTitle">
      <h2 id="trPlanTitle">${icon("calendar")}Plan one class</h2>
      <fieldset class="in-field tr-plan-pick">
        <legend>The activity I will use first</legend>
        ${tourActivities(pick).map(
          (a) =>
            html`<label class="in-opt ${a.domain.cls}"
              ><input
                type="radio"
                name="tour-pick"
                value="${a.domain.id}"
                data-tour-field="pick"
                data-tr-rerender
                ${notes.pick === a.domain.id ? "checked" : ""}
              /><span
                ><strong>${a.title}</strong><small>${a.domain.name} · ${a.minutes} min</small></span
              ></label
            >`,
        )}
      </fieldset>
      <div class="tr-plan-fields">
        <div class="in-field">
          <label for="tour-group">My class or group</label
          ><input
            id="tour-group"
            type="text"
            data-tour-field="group"
            value="${notes.group || ""}"
          />
        </div>
        <div class="in-field">
          <label for="tour-when">When I will try it</label
          ><input id="tour-when" type="text" data-tour-field="when" value="${notes.when || ""}" />
        </div>
      </div>
    </section>
    <section
      class="tr-card tr-plan-card ${chosen ? chosen.domain.cls : ""}"
      aria-labelledby="trPlanCard"
    >
      <h2 id="trPlanCard">Your plan</h2>
      ${
        chosen
          ? chosenHTML(pick, chosen, notes)
          : html`<p class="fine">
              Choose an activity to see your plan, a student link, a QR code and a copy button.
            </p>`
      }
    </section>
    ${nextHTML(pick)}
    ${guideHTML({
      say: "Start small: one activity, one class, one support. Copy the student link into your class page, and send families the family page so they can practice at home.",
      chips: ["share", "families", "language", "saved"],
      context: { page: "tour", step: TOUR_STOPS[LAST].name, pick },
    })}
  </div>`;
}

/** Keep the card's class/time line and the email body in step with the fields as the teacher types. */
export function refreshPlanCard(pick, notes) {
  const forLine = document.querySelector("[data-tr-plan-for]");
  if (forLine) forLine.textContent = planForText(notes);
  const mail = document.querySelector("[data-tr-email]");
  if (mail) mail.href = planMailto(pick, notes);
}

let opener = null;

/** Plan-card buttons: Show to the class, Close, Print my plan. Returns true when it handled the click. */
export function onPlanClick(e) {
  const dialog = document.querySelector("[data-tr-show-dialog]");
  if (e.target.closest?.("[data-tr-show]") && dialog) {
    opener = e.target.closest("[data-tr-show]");
    dialog.addEventListener("close", () => opener?.focus(), { once: true });
    dialog.showModal();
    dialog.querySelector("[data-tr-show-close]")?.focus();
    return true;
  }
  if (e.target.closest?.("[data-tr-show-close]") && dialog) {
    dialog.close();
    return true;
  }
  if (e.target.closest?.("[data-tr-print]")) {
    const root = document.documentElement;
    root.classList.add("tr-print-plan");
    window.addEventListener("afterprint", () => root.classList.remove("tr-print-plan"), {
      once: true,
    });
    window.print();
    return true;
  }
  return false;
}
