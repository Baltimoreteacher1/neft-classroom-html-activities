// The K–2 family handout: one Letter page, English and Spanish, that sends a family of a younger child to Practice
// Together with the one family QR (qr-family.svg; one QR code per audience, tools/access-intro-guide.test.mjs), tells
// them to choose Grades K–2, explains audio first, picture answers and the grown-up's role, then the one routine for
// tonight. Copy from family-k2-data.js; facts from family-data.js FAMILY.help
// (which reads data.js FACTS). Printed with intro-family-handout.css (.fh-*); the Word file reuses
// intro-family-docx.mjs through the same model shape.
import { FAMILY, HANDOUT_COPY } from "../../access-practice-lab/src/intro/family-data.js";
import { HANDOUT_K2_COPY } from "../../access-practice-lab/src/intro/family-k2-data.js";
import { esc, html, icon, raw } from "../../access-practice-lab/src/util.js";
import { FAMILY_SHORT, FAMILY_URL, QR_FAMILY_SRC } from "./intro-family-handout.mjs";

const help = (id) => FAMILY.help.items.find((i) => i.id === id).a;
const STEP_ICONS = ["volume", "speaking", "star"];

/** Everything the K–2 page says, in one language. */
export function familyK2HandoutModel(lang = "en") {
  const t = (o) => o[lang];
  return {
    lang,
    kind: "k2",
    siteName: "The Language Page",
    title: t(HANDOUT_K2_COPY.title),
    what: t(HANDOUT_K2_COPY.what),
    scan: t(HANDOUT_COPY.scan),
    url: FAMILY_URL,
    short: FAMILY_SHORT,
    qrAlt:
      lang === "es" ? `Código QR que abre ${FAMILY_SHORT}` : `QR code that opens ${FAMILY_SHORT}`,
    grade: t(HANDOUT_K2_COPY.grade),
    howHeading: t(HANDOUT_K2_COPY.howHeading),
    how: HANDOUT_K2_COPY.how.map((h) => ({
      id: h.id,
      icon: h.icon,
      head: t(h.head),
      body: t(h.body),
    })),
    stepsHeading: t(HANDOUT_K2_COPY.tonightHeading),
    steps: HANDOUT_K2_COPY.tonight.map((s, i) => ({
      icon: STEP_ICONS[i],
      head: t(s.head),
      body: t(s.body),
    })),
    factsHeading: t(HANDOUT_COPY.factsHeading),
    facts: [t(help("account")), t(help("mic")), t(HANDOUT_COPY.home)],
    teacher: t(HANDOUT_COPY.teacher),
  };
}

/**
 * The printed link may wrap after a slash, never inside a part: "practice-together?grades=K" breaking at its hyphen
 * reads back (and copies) as "practicetogether". Print-only markup, so the no-wrap is an inline style.
 */
const breakable = (short) =>
  raw(
    short
      .split("/")
      .map((part) => `<span style="white-space:nowrap">${esc(part)}</span>`)
      .join("/<wbr>"),
  );

/** Print markup for the K–2 page. */
export function familyK2HandoutBody(m) {
  return html`<article class="fh" aria-labelledby="fh-h1">
    <header class="fh-head">
      <p class="fh-site">${m.siteName}</p>
      <h1 id="fh-h1">${m.title}</h1>
    </header>
    <section class="fh-top" aria-label="${m.title}">
      <div class="fh-what">
        <p class="fh-lead">${m.what}</p>
        <p class="fh-link">${m.scan} <a href="${m.url}">${breakable(m.short)}</a></p>
        <p>${m.grade}</p>
      </div>
      <figure class="fh-qr">
        <img src="${QR_FAMILY_SRC}" alt="${m.qrAlt}" width="144" height="144" />
      </figure>
    </section>
    <section class="fh-choices" aria-labelledby="fh-how-h">
      <h2 id="fh-how-h">${m.howHeading}</h2>
      <ul>
        ${m.how.map(
          (h) =>
            html`<li class="fh-talk"><span class="fh-ic" aria-hidden="true">${icon(h.icon)}</span><p><strong>${h.head}.</strong> ${h.body}</p></li>`,
        )}
      </ul>
    </section>
    <section class="fh-steps" aria-labelledby="fh-steps-h">
      <h2 id="fh-steps-h">${m.stepsHeading}</h2>
      <ol>
        ${m.steps.map(
          (s) =>
            html`<li><span class="fh-ic" aria-hidden="true">${icon(s.icon)}</span><strong>${s.head}</strong><span>${s.body}</span></li>`,
        )}
      </ol>
    </section>
    <section class="fh-facts" aria-labelledby="fh-facts-h">
      <h2 id="fh-facts-h">${m.factsHeading}</h2>
      <ul>
        ${m.facts.map((f) => html`<li><span class="fh-ok" aria-hidden="true">${icon("check")}</span>${f}</li>`)}
      </ul>
    </section>
    <footer class="fh-teacher">
      <p><strong>${m.teacher}</strong><span class="fh-rule"></span></p>
    </footer>
  </article>`;
}
