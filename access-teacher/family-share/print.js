// Print the approved family cards: one page per student, in the language the teacher chose for the family. Each card is
// the same page a family sees (family/story/render.js) plus a QR code to its short link. The page being printed is
// built here and removed after printing; nothing leaves the browser.
import { qrSvg } from "../../shared/qr/qr-code.mjs";
import { makeI18n } from "../../access-practice-lab/src/i18n.js";
import { fitsQr, storyUrl } from "../../access-practice-lab/src/family/story/link.js";
import { compose } from "../../access-practice-lab/src/family/story/model.js";
import { storyHTML } from "../../access-practice-lab/src/family/story/render.js";
import { toHtml } from "../../access-practice-lab/src/util.js";

const NO_TRIES = { ticks: {}, how: "tried", both: false };

/** @param {{alias:string, story:object}[]} cards  @param {object} c  copy(S) */
export function printApproved(cards, c) {
  if (!cards.length) return;
  const root = document.createElement("div");
  root.className = "fls-print";
  root.setAttribute("aria-hidden", "true");
  for (const { alias, story } of cards) {
    const url = storyUrl(story, { origin: location.origin, short: true });
    const page = document.createElement("section");
    page.className = `fls-page${story.l === "bi" ? " is-both" : ""}`;
    page.lang = story.l === "es" ? "es" : "en";
    page.innerHTML = toHtml(
      storyHTML(makeI18n(story.l, "en"), compose(story), NO_TRIES, { preview: true, qr: fitsQr(url) ? qrSvg(url, { px: 120 }) : "" }),
    );
    if (!story.n) {
      const who = document.createElement("p");
      who.className = "fls-for";
      who.textContent = c.forAlias(alias);
      page.prepend(who);
    }
    root.append(page);
  }
  document.body.append(root);
  document.body.dataset.printing = "fam-story";
  const done = () => {
    root.remove();
    delete document.body.dataset.printing;
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}
