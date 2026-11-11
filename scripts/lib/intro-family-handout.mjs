// The family handout: one Letter page that sends a family to Practice Together (/practice-together), in English and
// in Spanish. One model per language, built from family-data.js (copy, the tonight steps, the help answers that read
// data.js FACTS) and data.js (the route and its public URL). The print markup is styled by intro-family-handout.css (.fh-*);
// the Word file (intro-family-docx.mjs) reads the same model.
import { absUrl, ROUTES, shortUrl } from "../../access-practice-lab/src/intro/data.js";
import {
  FAMILY,
  FAMILY_ACTIVITIES,
  HANDOUT_COPY,
  TONIGHT,
} from "../../access-practice-lab/src/intro/family-data.js";
import { esc, html, icon, raw } from "../../access-practice-lab/src/util.js";

export const HANDOUT_LANGS = ["en", "es"];
export const HANDOUT_DOC_LANG = { en: "en-US", es: "es-US" };
export const FAMILY_URL = absUrl(ROUTES.together);
export const FAMILY_SHORT = shortUrl(ROUTES.together);
export const QR_FAMILY_SRC = "/access-practice-lab/guides/qr-family.svg";

const help = (id) => FAMILY.help.items.find((i) => i.id === id).a;

/** Everything the page says, in one language. */
export function familyHandoutModel(lang = "en") {
  const t = (o) => o[lang];
  const [talk, write] = FAMILY_ACTIVITIES;
  return {
    lang,
    siteName: "The Language Page",
    title: t(HANDOUT_COPY.title),
    what: t(HANDOUT_COPY.what),
    scan: t(HANDOUT_COPY.scan),
    url: FAMILY_URL,
    short: FAMILY_SHORT,
    qrAlt:
      lang === "es" ? `Código QR que abre ${FAMILY_SHORT}` : `QR code that opens ${FAMILY_SHORT}`,
    grade: t(HANDOUT_COPY.grade),
    stepsHeading: t(HANDOUT_COPY.stepsHeading),
    steps: TONIGHT.map((s) => ({ id: s.id, icon: s.icon, head: t(s.head), body: t(s.body) })),
    choicesHeading: t(HANDOUT_COPY.choicesHeading),
    choices: [
      { id: "talk", icon: "speaking", name: t(talk.title), line: t(HANDOUT_COPY.talk) },
      { id: "write", icon: "writing", name: t(write.title), line: t(HANDOUT_COPY.write) },
    ],
    early: t(HANDOUT_COPY.early),
    factsHeading: t(HANDOUT_COPY.factsHeading),
    facts: [t(help("account")), t(help("mic")), t(HANDOUT_COPY.home)],
    teacher: t(HANDOUT_COPY.teacher),
  };
}

/** The printed link may wrap after a slash, never inside a word. */
const breakable = (short) => raw(short.split("/").map(esc).join("/<wbr>"));

/** Print markup for one handout page. */
export function familyHandoutBody(m) {
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
    <section class="fh-steps" aria-labelledby="fh-steps-h">
      <h2 id="fh-steps-h">${m.stepsHeading}</h2>
      <ol>
        ${m.steps.map(
          (s) =>
            html`<li><span class="fh-ic" aria-hidden="true">${icon(s.icon)}</span><strong>${s.head}</strong><span>${s.body}</span></li>`,
        )}
      </ol>
    </section>
    <section class="fh-choices" aria-labelledby="fh-choices-h">
      <h2 id="fh-choices-h">${m.choicesHeading}</h2>
      <ul>
        ${m.choices.map(
          (c) =>
            html`<li class="fh-${c.id}"><span class="fh-ic" aria-hidden="true">${icon(c.icon)}</span><p><strong>${c.name}.</strong> ${c.line}</p></li>`,
        )}
      </ul>
      <p class="fh-early">${m.early}</p>
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
