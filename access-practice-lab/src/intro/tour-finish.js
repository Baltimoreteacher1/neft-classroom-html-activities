// Part 4 of the teacher tour: take the chosen activity into the classroom. One card with the activity, its lesson-use
// idea, the student link and (when the link fits) a QR code; ONE recommended action picked by the teacher's goal and
// at most two quieter ones; then "You're ready to use this with students." and "Start using the lab".
// Show to the class is a native modal dialog (Escape closes it, focus returns); Print prints only the card.
import { MAX_BYTES, qrSvg } from "../../../shared/qr/qr-code.mjs";
import { BASE, html, icon, raw } from "../util.js";
import { absUrl } from "./data.js";
import { pickName } from "./band.js";
import { withReturn } from "./return-bar.js";
import { activityRoute } from "./tour-data.js";
import { copyWithNote } from "./ui.js";

/** The site's QR encoder stops at version 5 (106 bytes); a longer link is shown without a code. */
export const qrFits = (url) => new TextEncoder().encode(url).length <= MAX_BYTES;

/** The student link: the activity in the teacher's grades, on the public host. */
export const studentUrl = (a) => absUrl(activityRoute(a));

/** Which action leads for each goal, and the two that follow it. Ids are ACTIONS keys. */
export const ACTION_ORDER = {
  show: ["open", "copy", "qr"],
  find: ["open", "copy", "qr"],
  share: ["copy", "qr", "print"],
  understand: ["passport", "open", "copy"],
};

function actionHTML(id, a, primary) {
  const cls = primary ? "btn btn-primary btn-big" : "btn";
  const open = withReturn(`${BASE}${activityRoute(a)}`, "tour");
  switch (id) {
    case "open":
      return html`<a class="${cls}" href="${open}">${icon("play")}Open the student activity</a>`;
    case "copy":
      return html`<button type="button" class="${cls}" data-gt-copy>
        ${icon("copy")}Copy student link
      </button>`;
    case "qr":
      return qrFits(studentUrl(a))
        ? html`<button type="button" class="${cls}" data-gt-show>
            ${icon("classroom")}Show the QR code to the class
          </button>`
        : html`<button type="button" class="${cls}" data-gt-print>
            ${icon("print")}Print this card
          </button>`;
    case "print":
      return html`<button type="button" class="${cls}" data-gt-print>
        ${icon("print")}Print this card
      </button>`;
    case "passport":
      return html`<a class="${cls}" href="${BASE}/passport?grades=${a.pick}"
        >${icon("passport")}See where student work is saved</a
      >`;
    default:
      return "";
  }
}

const UNDERSTAND = html`<p class="gt-note">
  ${icon("info")}<span
    >Each student’s finished work, the help they opened and how sure they felt are saved in
    <strong>My Passport</strong> on the device they used. Students can print it or share a code with
    you. Practice shows effort and growth, not mastery, and it is not an ACCESS score.</span
  >
</p>`;

function showDialogHTML(a, url) {
  if (!qrFits(url)) return "";
  return html`<dialog class="gt-show" data-gt-show-dialog aria-labelledby="gtShowTitle">
    <h2 id="gtShowTitle">${a.title}</h2>
    <p>Scan with a tablet or phone camera, or type the link.</p>
    ${raw(qrSvg(url, { px: 420, label: `QR code for the student link to ${a.title}` }))}
    <p class="gt-show-url">${url.replace(/^https:\/\//, "")}</p>
    <button type="button" class="btn btn-primary" data-gt-show-close>${icon("close")}Close</button>
  </dialog>`;
}

export function classroomHTML(s, a) {
  if (!a)
    return html`<section class="gt-part" aria-labelledby="gtTitle">
      <h1 id="gtTitle" tabindex="-1">Take it into your classroom</h1>
      <p class="gt-note is-alert" role="alert">
        ${icon("alert")}<span
          >The activity list did not load. Check the connection and
          <a href="${BASE}/start/tour">try again</a>, or
          <a href="${BASE}/explore/practice">browse all activities</a>.</span
        >
      </p>
    </section>`;
  const url = studentUrl(a);
  const [lead, ...more] = ACTION_ORDER[s.goal] || ACTION_ORDER.show;
  return html`<section class="gt-part gt-part-classroom" aria-labelledby="gtTitle">
    <h1 id="gtTitle" tabindex="-1">Take it into your classroom</h1>
    <p class="gt-lead">Here is everything you need for this activity.</p>
    <article class="gt-class-card ${a.domain.cls}" aria-labelledby="gtCardTitle" data-gt-card>
      <header class="gt-class-head">
        <span class="gt-skill-ic" aria-hidden="true">${icon(a.domain.icon)}</span>
        <div>
          <h2 id="gtCardTitle">${a.title}</h2>
          <p>${a.domain.name} · ${a.support} · ${pickName(a.pick)} · about ${a.minutes} min</p>
        </div>
      </header>
      <p class="gt-use"><strong>Try it like this:</strong> ${a.use}</p>
      <div class="gt-link">
        ${qrFits(url) ? raw(qrSvg(url, { px: 128, label: `QR code for the student link to ${a.title}` })) : ""}
        <div class="gt-link-text">
          <label for="gtLink">Student link</label>
          <input
            id="gtLink"
            class="gt-link-input"
            type="text"
            readonly
            value="${url}"
            data-gt-link
          />
          <p class="fine">
            Students open it on any device. No accounts. Their work saves on that device.
          </p>
        </div>
      </div>
      ${s.goal === "understand" ? UNDERSTAND : ""}
      <div class="gt-actions gt-class-actions">
        ${actionHTML(lead, a, true)}
        <span class="gt-secondary">${more.map((id) => actionHTML(id, a, false))}</span>
      </div>
      <p class="fine gt-copy-note" data-gt-copy-note aria-live="polite"></p>
    </article>
    <section class="gt-ready" aria-labelledby="gtReady">
      <span class="gt-ready-mark" aria-hidden="true">${icon("check")}</span>
      <div>
        <h2 id="gtReady">You’re ready to use this with students.</h2>
        <p>Every activity works the way you just tried it: try, get guidance, revise.</p>
      </div>
      <a class="btn btn-big gt-ready-go" href="${BASE}/explore/practice?grades=${a.pick}"
        >Start using the lab${icon("arrow-right")}</a
      >
    </section>
    ${showDialogHTML(a, url)}
  </section>`;
}

let opener = null;

/** Copy, Show the QR code, Close, Print. Returns true when it handled the click. */
export function onClassroomClick(e, view) {
  const t = e.target;
  const a = view?.activity;
  if (t.closest?.("[data-gt-copy]") && a) {
    const field = document.querySelector("[data-gt-link]");
    copyWithNote(studentUrl(a), document.querySelector("[data-gt-copy-note]")).then((ok) => {
      if (!ok) field?.select();
    });
    return true;
  }
  const dialog = document.querySelector("[data-gt-show-dialog]");
  if (t.closest?.("[data-gt-show]") && dialog) {
    opener = t.closest("[data-gt-show]");
    dialog.addEventListener("close", () => opener?.focus(), { once: true });
    dialog.showModal();
    dialog.querySelector("[data-gt-show-close]")?.focus();
    return true;
  }
  if (t.closest?.("[data-gt-show-close]") && dialog) {
    dialog.close();
    return true;
  }
  if (t.closest?.("[data-gt-print]")) {
    const root = document.documentElement;
    root.classList.add("gt-print-card");
    window.addEventListener("afterprint", () => root.classList.remove("gt-print-card"), {
      once: true,
    });
    window.print();
    return true;
  }
  return false;
}
