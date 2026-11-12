// "Need help?" under the teacher tour and the family walkthrough: a compact quick reference with answers to the
// problems people actually hit (no sound, a blocked microphone, a lost guide, a copy that failed, where work is
// saved) and the way to start the walkthrough again. One closed disclosure, so it never competes with the task.
// `say` lets the family walkthrough pass its own words in the family's language; the teacher text is the default.
import { BASE, html, icon } from "../util.js";
import { ROUTES } from "./data.js";

export const TEACHER_HELP = {
  heading: "Need help?",
  items: [
    {
      q: "The guide disappeared",
      a: "Press “Show me how” beside the activity to bring it back. Press “Try it myself” to hide it again.",
    },
    {
      q: "The activity went to another page",
      a: "Press “Bring the example back” on the guide. Your place in the tour is saved on this device.",
    },
    {
      q: "I can’t hear anything",
      a: "Turn up the device volume and check that the browser tab is not muted. Students can read the text instead; nothing is timed.",
    },
    {
      q: "The microphone is blocked",
      a: "Recording is optional. Students can say the answer to a partner and keep going. To allow it, use the lock or settings icon beside the web address.",
    },
    {
      q: "Copying the link didn’t work",
      a: "The link box is selected for you. Copy it with your keyboard (Ctrl+C, or Command+C on a Mac).",
    },
  ],
  restart: "Start the teacher tour again",
  links: [
    { href: `${BASE}${ROUTES.guide}`, label: "Quick reference guide (print)" },
    { href: `${BASE}${ROUTES.siteGuide}?for=teacher`, label: "Site Guide" },
    { href: `${BASE}${ROUTES.start}`, label: "All teacher resources" },
  ],
};

/** The quick reference. `restart` shows the restart button ([data-gt-restart] / [data-ft-restart]). */
export function helpHTML({
  say = TEACHER_HELP,
  restart = false,
  restartAttr = "data-gt-restart",
  lang,
} = {}) {
  return html`<details class="gt-help" ${lang ? html`lang="${lang}"` : ""}>
    <summary>${icon("help")}<span>${say.heading}</span></summary>
    <dl>
      ${say.items.map(
        (x) =>
          html`<div>
            <dt>${x.q}</dt>
            <dd>${x.a}</dd>
          </div>`,
      )}
    </dl>
    <p class="gt-help-links">
      ${restart ? html`<button type="button" class="btn small" ${restartAttr === "data-ft-restart" ? html`data-ft-restart` : html`data-gt-restart`}>${icon("retry")}${say.restart}</button>` : ""}
      ${say.links.map((l) => html`<a href="${l.href}">${l.label}</a>`)}
    </p>
  </details>`;
}
