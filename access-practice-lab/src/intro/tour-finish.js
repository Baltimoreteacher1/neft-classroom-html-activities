// Part 3 of the Teacher Tour, "Use it with your class": the support choice, the class card (student link, QR code,
// one main action: Copy student link), "Start tomorrow in three steps", "You're ready to use this with students." and
// a map of where students can go next. Show the QR is a native modal dialog (Escape closes it, focus returns); Print
// prints only the card.
import { MAX_BYTES, qrSvg } from "../../../shared/qr/qr-code.mjs";
import { BASE, html, icon, raw } from "../util.js";
import { absUrl } from "./data.js";
import { pickName } from "./band.js";
import { withReturn } from "./return-bar.js";
import { activityRoute } from "./tour-data.js";
import { printFiles } from "./quick-guide-files.js";
import { copyWithNote } from "./ui.js";

/** The site's QR encoder stops at version 5 (106 bytes); a longer link is shown without a code. */
export const qrFits = (url) => new TextEncoder().encode(url).length <= MAX_BYTES;

/** The student link: the activity in the teacher's grades, on the public host. */
export const studentUrl = (a) => absUrl(activityRoute(a));

const SUPPORT_LINE = {
  A: "The most help: pictures, read-aloud, sentence starters.",
  B: "Some help, there when students ask for it.",
  C: "Less help: longer texts, more open answers.",
};

/** The support choice as three buttons; the card below follows it. */
function supportHTML(s, options) {
  return html`<div class="gt-support-row" role="group" aria-labelledby="gtSupportLabel">
    <p class="gt-support-label" id="gtSupportLabel">How much help do your students need?</p>
    <div class="gt-support-grid">
      ${options.map(
        (o) =>
          html`<button type="button" class="gt-support" data-gt-support="${o.level}" aria-pressed="${String(o.level === s.support)}">
            <strong>${o.name}</strong><span>${SUPPORT_LINE[o.level] || ""}</span>
          </button>`,
      )}
    </div>
    <p class="fine gt-support-note">Classroom support choices, not WIDA levels or scores. Change them any time.</p>
  </div>`;
}

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

/** "Start tomorrow in three steps": the whole classroom routine, short enough to remember. */
function startGuideHTML(a) {
  const files = printFiles(a.pick);
  return html`<section class="gt-start" aria-labelledby="gtStartTitle">
    <h2 id="gtStartTitle">Start tomorrow in three steps</h2>
    <ol class="gt-start-steps">
      <li>
        <span class="gt-start-n" aria-hidden="true">1</span>
        <strong>Share the link</strong>
        <span>Paste it in your class page, or show the QR code. No student accounts, any device.</span>
      </li>
      <li>
        <span class="gt-start-n" aria-hidden="true">2</span>
        <strong>Students practice 10 minutes</strong>
        <span>${a.use}</span>
      </li>
      <li>
        <span class="gt-start-n" aria-hidden="true">3</span>
        <strong>Look at the work together</strong>
        <span>Each student’s work, the help they used and how sure they felt are in <strong>My Passport</strong> on their device. They can show you or print it.</span>
      </li>
    </ol>
    <p class="gt-start-print">
      <a href="${files.quickGuide.pdf}" target="_blank" rel="noopener">${icon("print")}Print the one-page quick guide (PDF)</a>
    </p>
  </section>`;
}

/** Where students can go next: the site as a short map of avenues, one tap each. */
const AVENUES = [
  { icon: "library", route: "/explore/practice", name: "Practice by skill", text: "Listening, speaking, reading and writing activities at every support level." },
  { icon: "road", route: "/journey", name: "Learning Journey", text: "Twelve short missions, one step at a time." },
  { icon: "worlds", route: "/explore/play", name: "Games & Worlds", text: "Language games and story worlds that use the same skills." },
  { icon: "reading", route: "/reading-room", name: "Reading Room", text: "Short leveled reads with read-aloud and word help." },
  { icon: "tests", route: "/access-prep", name: "ACCESS Prep", text: "Practice tests and what test day looks like. Not an official score." },
  { icon: "passport", route: "/passport", name: "My Passport", text: "Each student’s finished work, to show you or a family." },
  { icon: "families", route: "/practice-together", name: "Families", text: "A guided English and Spanish page for practice at home." },
];

function mapHTML(pick) {
  return html`<section class="gt-map" aria-labelledby="gtMapTitle">
    <h2 id="gtMapTitle">Where students can go next</h2>
    <p class="gt-map-lead">The site at a glance. Each stop opens in your students’ grades.</p>
    <ol class="gt-map-stops">
      ${AVENUES.map(
        (v) =>
          html`<li>
            <a href="${BASE}${v.route}?grades=${pick}">
              <span class="gt-map-ic" aria-hidden="true">${icon(v.icon)}</span>
              <span><strong>${v.name}</strong><span>${v.text}</span></span>
            </a>
          </li>`,
      )}
    </ol>
    <p class="gt-map-more">
      <a href="${BASE}/site-guide?for=teacher&grades=${pick}">${icon("help")}Open the full Site Guide</a>
    </p>
  </section>`;
}

/** Part 3 of the tour: support, the class card with one main action, the three-step start, ready, and the map. */
export function classroomHTML(s, a, options = []) {
  const url = studentUrl(a);
  const open = withReturn(`${BASE}${activityRoute(a)}`, "tour");
  return html`${supportHTML(s, options)}
    <article class="gt-class-card ${a.domain.cls}" aria-labelledby="gtCardTitle" data-gt-card>
      <header class="gt-class-head">
        <span class="gt-skill-ic" aria-hidden="true">${icon(a.domain.icon)}</span>
        <div>
          <h2 id="gtCardTitle">${a.title}</h2>
          <p>${a.domain.name} · ${a.support} · ${pickName(a.pick)} · about ${a.minutes} min</p>
        </div>
      </header>
      <div class="gt-link">
        ${qrFits(url) ? raw(qrSvg(url, { px: 128, label: `QR code for the student link to ${a.title}` })) : ""}
        <div class="gt-link-text">
          <label for="gtLink">Student link</label>
          <input id="gtLink" class="gt-link-input" type="text" readonly value="${url}" data-gt-link />
        </div>
      </div>
      <div class="gt-actions gt-class-actions">
        <button type="button" class="btn btn-primary btn-big" data-gt-copy>${icon("copy")}Copy student link</button>
        <span class="gt-secondary">
          <a class="btn" href="${open}">${icon("play")}Open it</a>
          ${qrFits(url) ? html`<button type="button" class="btn" data-gt-show>${icon("classroom")}Show QR to the class</button>` : ""}
          <button type="button" class="btn ghost" data-gt-print>${icon("print")}Print this card</button>
        </span>
      </div>
      <p class="fine gt-copy-note" data-gt-copy-note aria-live="polite"></p>
    </article>
    ${startGuideHTML(a)}
    <section class="gt-ready" aria-labelledby="gtReady">
      <span class="gt-ready-mark" aria-hidden="true">${icon("check")}</span>
      <div>
        <h2 id="gtReady">You’re ready to use this with students.</h2>
        <p>Every activity works the way you just tried it: try, get guidance, revise.</p>
      </div>
      <a class="btn btn-big gt-ready-go" href="${BASE}/explore/practice?grades=${a.pick}">Start using the lab${icon("arrow-right")}</a>
    </section>
    ${mapHTML(a.pick)}
    ${showDialogHTML(a, url)}`;
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
