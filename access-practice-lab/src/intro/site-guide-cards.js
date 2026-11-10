// Site Guide markup, part 1: links, the activity card, and the Speaking, Writing, Other-skills and Classroom sections.
// Every fact on a card comes from data.js (see site-guide-data.js); this file only arranges it. Links that open an
// activity carry ?intro=siteguide (return-bar.js) so the activity shows a visible "Back to Guide" bar.
import { BASE, html, icon } from "../util.js";
import { DOWNLOADS, FEATURED_LESSON, ROUTES, SITE } from "./data.js";
import { previewHTML } from "./preview.js";
import { withReturn } from "./return-bar.js";
import { cardFor, LABELS, SPEAKING_IDS, WRITING_IDS } from "./site-guide-data.js";
import { GROUPINGS, OTHER_AREAS, PD_LINKS, ROUTINES, SHARING } from "./site-guide-more.js";

export const en = (text) => html`<span lang="en">${text}</span>`;

/** A lab route as an href (the Teacher Hub lives outside the lab). */
export const hrefFor = (route) => (route.startsWith("/access-teacher") ? route : `${BASE}${route}`);
/** The printed form of a link: thelanguagepage.com/access-practice-lab/... */
export const printUrl = (route) =>
  `${SITE.host.replace(/^https:\/\//, "")}${route.startsWith("/access-teacher") ? "" : SITE.base}${route}`;

/** An ordinary link (guide pages, rooms). `data-url` is what Print Guide shows after the link. */
export const linkHTML = (route, label, cls = "") =>
  html`<a class="${cls}" href="${hrefFor(route)}" data-url="${printUrl(route)}">${label}</a>`;

/** A link that opens an ACTIVITY: carries the return hint so the activity can lead back to the guide. */
export const activityLink = (route, label, cls = "btn") =>
  html`<a
    class="${cls}"
    href="${withReturn(hrefFor(route), "siteguide")}"
    data-url="${printUrl(route)}"
    >${label}</a
  >`;

const list = (items) =>
  html`<ul>
    ${items.map((s) => html`<li>${s}</li>`)}
  </ul>`;

/** "See an Example" for Scenarios and Newsroom (their previews live in site-guide-data.js). Same markup as preview.js. */
function extraPreview(c) {
  const p = c.preview;
  return html`<details class="in-preview">
    <summary>See an Example<span class="visually-hidden">: ${c.name}</span></summary>
    <dl>
      <dt>The task</dt>
      <dd>${p.task}</dd>
      <dt>${p.source}</dt>
      <dd class="in-sample">${p.sample}</dd>
      <dt>What students do next</dt>
      <dd>${p.next}</dd>
    </dl>
  </details>`;
}
export const exampleFor = (c) => (c.preview?.source ? extraPreview(c) : previewHTML(c));

function supportHTML(I, c, audience) {
  const es = I.spanish;
  const built = es
    ? html`<p>${I.TO(c.text.support)}</p>`
    : html`<p class="sg-sub">${I.TO(LABELS.builtIn)}</p>
        ${list(c.builtIn)}`;
  const moves =
    audience === "teacher" && !es
      ? html`<p class="sg-sub">${I.TO(LABELS.moves)}</p>
          ${list(c.moves)}`
      : "";
  const help =
    audience === "family"
      ? html`<p class="sg-sub">${I.TO(LABELS.help)}</p>
          <p>${I.TO(c.text.help)}</p>`
      : "";
  return html`${built}${moves}${help}
    <p class="fine">${en(c.limits)}</p>`;
}

/** One activity card: What it is / What you'll do / Try it / Get support / Next step. */
export function cardHTML(I, id, audience) {
  const c = cardFor(id);
  const teacher = audience === "teacher";
  const doText = teacher ? (I.spanish ? I.TO(c.text.you) : c.does) : I.TO(c.text.you);
  return html`<article
    class="sg-card pw-${c.pathway}"
    id="sg-card-${id}"
    aria-labelledby="sg-card-${id}-h"
  >
    <h3 id="sg-card-${id}-h">
      <span class="sg-ic" aria-hidden="true">${icon(c.icon)}</span>${en(c.name)}
    </h3>
    <p class="sg-meta">${en(c.where)} · ${I.TO(LABELS.time)} ${en(c.time)}</p>
    <dl class="sg-fields">
      <dt>${I.TO(LABELS.what)}</dt>
      <dd>${I.TO(c.level)}</dd>
      <dt>${I.TO(LABELS.do)}</dt>
      <dd>${doText}</dd>
      <dt>${I.TO(LABELS.try)}</dt>
      <dd>${I.T(c.tryNow, c.text.try.es)}</dd>
      <dt>${I.TO(LABELS.support)}</dt>
      <dd>${supportHTML(I, c, audience)}</dd>
    </dl>
    ${exampleFor(c)}
    <p class="sg-next">
      <span class="sg-sub">${I.TO(LABELS.next)}</span>
      ${activityLink(c.route, html`${I.TO(LABELS.open)} ${en(c.name)} ${icon("arrow-right")}`, "btn btn-primary")}
    </p>
  </article>`;
}

const LEADS = {
  speaking: {
    default: [
      "Speaking practice helps you say ideas out loud in clear sentences.",
      "Practicar hablar ayuda a decir ideas en voz alta con oraciones claras.",
    ],
    teacher: [
      "Students say ideas aloud with a model, a sentence frame and an optional recording. Choose by how much talk time you have.",
      "Los estudiantes dicen ideas en voz alta con un modelo, una estructura de oración y una grabación opcional. Elijan según el tiempo que tengan.",
    ],
    family: [
      "Your child practices saying ideas out loud. You can listen and ask questions in any language.",
      "Su hijo o hija practica decir ideas en voz alta. Ustedes pueden escuchar y hacer preguntas en cualquier idioma.",
    ],
  },
  writing: {
    default: [
      "Writing practice helps you write a sentence or a paragraph, check it and make it clearer.",
      "Practicar escribir ayuda a escribir una oración o un párrafo, revisarlo y hacerlo más claro.",
    ],
    teacher: [
      "Students write, get a rule-based check, and revise. Start with one sentence before a full paragraph.",
      "Los estudiantes escriben, reciben una revisión basada en reglas y corrigen. Empiecen con una oración antes de un párrafo completo.",
    ],
    family: [
      "Your child writes one sentence or paragraph and makes it better. You can read it together and ask what they added.",
      "Su hijo o hija escribe una oración o un párrafo y lo mejora. Pueden leerlo juntos y preguntar qué agregó.",
    ],
  },
};
const leadFor = (I, key, audience) => {
  const [e, s] = LEADS[key][audience] || LEADS[key].default;
  return I.T(e, s);
};

export function speakingSection(I, audience) {
  return html`<p class="lead">${leadFor(I, "speaking", audience)}</p>
    <div class="sg-cards">${SPEAKING_IDS.map((id) => cardHTML(I, id, audience))}</div>
    <p class="sg-all">
      ${linkHTML("/Speaking", html`${I.T("See All Speaking Activities", "Ver todas las actividades de hablar")} ${icon("arrow-right")}`, "btn")}
    </p>`;
}

export function writingSection(I, audience) {
  const s = FEATURED_LESSON.sample;
  return html`<p class="lead">${leadFor(I, "writing", audience)}</p>
    <div class="sg-cards">${WRITING_IDS.map((id) => cardHTML(I, id, audience))}</div>
    <figure class="sg-worked" aria-labelledby="sg-worked-h">
      <h3 id="sg-worked-h">
        ${I.T("A worked example: from first try to clearer", "Un ejemplo: del primer intento a algo más claro")}
      </h3>
      <dl>
        <dt>${I.T("First try", "Primer intento")}</dt>
        <dd lang="en">${s.first}</dd>
        <dt>${I.T("Clearer", "Más claro")}</dt>
        <dd lang="en" class="is-better">${s.improved}</dd>
      </dl>
      <figcaption>
        ${I.T(s.explanation, "La respuesta mejorada agrega un cambio claro, una razón y un ejemplo.")}
        ${linkHTML(ROUTES.lesson, I.T("See the Featured Lesson", "Ver la lección destacada"))}
      </figcaption>
    </figure>
    <p class="sg-all">
      ${linkHTML("/Writing", html`${I.T("See All Writing Activities", "Ver todas las actividades de escribir")} ${icon("arrow-right")}`, "btn")}
    </p>`;
}

/** Reading, Listening, Vocabulary: visually secondary, one starting activity each. */
export function moreSection() {
  return html`<p class="lead">
      Practice that supports speaking and writing. Each area has one place to start.
    </p>
    <div class="sg-more">
      ${OTHER_AREAS.map(
        (a) =>
          html`<article class="sg-mini" aria-labelledby="sg-more-${a.id}">
            <h3 id="sg-more-${a.id}">
              <span class="sg-ic" aria-hidden="true">${icon(a.icon)}</span>${a.name}
            </h3>
            <dl class="sg-fields">
              <dt>${LABELS.what.en}</dt>
              <dd>${a.helps}</dd>
              <dt>${LABELS.support.en}</dt>
              <dd>${a.supports}</dd>
              <dt>Why it helps</dt>
              <dd>${a.link}</dd>
            </dl>
            <p class="sg-next">
              ${activityLink(a.route, html`${LABELS.try.en}: ${a.start} (${a.time})`, "btn")}
              ${linkHTML(a.section.route, a.section.label, "sg-textlink")}
            </p>
          </article>`,
      )}
    </div>`;
}

const routineCard = (r) => {
  const c = cardFor(r.activity);
  return html`<article
    class="sg-routine"
    id="sg-routine-${r.id}"
    aria-labelledby="sg-routine-${r.id}-h"
  >
    <p class="sg-length">${r.length}</p>
    <h3 id="sg-routine-${r.id}-h">${r.name}</h3>
    <dl class="sg-fields">
      <dt>${LABELS.do.en}</dt>
      <dd>${r.directions}</dd>
      <dt>Students produce</dt>
      <dd>${r.produce}</dd>
      <dt>One optional support</dt>
      <dd>${r.support}</dd>
      <dt>Look and listen for</dt>
      <dd>${r.lookFor}</dd>
      <dt>Follow-up</dt>
      <dd>${r.followUp}</dd>
    </dl>
    ${exampleFor(c)}
    <p class="sg-next">
      ${activityLink(c.route, html`${LABELS.try.en}: ${c.name} ${icon("arrow-right")}`, "btn btn-primary")}
      ${r.lesson ? linkHTML(ROUTES.lesson, "Featured Lesson plan", "sg-textlink") : ""}
    </p>
  </article>`;
};

const pdfPair = (d, label) =>
  html`<li>
    ${label}: ${linkHTML(d.pdf.replace(SITE.base, ""), "PDF")} ·
    ${linkHTML(d.docx.replace(SITE.base, ""), "Word")}
  </li>`;

export function classroomSection() {
  return html`<p class="lead">
      Three routines you can run tomorrow. Each uses an activity on this site and needs one device
      per student or pair, or a projector.
    </p>
    <div class="sg-routines">${ROUTINES.map(routineCard)}</div>
    <h3>Grouping</h3>
    <ul class="sg-plain">
      ${GROUPINGS.map(
        (g) =>
          html`<li>
            <strong>${g.name}.</strong> ${g.text}
            ${g.link ? linkHTML(g.link.route, g.link.label, "sg-textlink") : ""}
          </li>`,
      )}
    </ul>
    <h3>Sharing, assigning, printing and progress</h3>
    <dl class="sg-fields sg-share">
      ${SHARING.map(
        (s) =>
          html`<dt>${s.head}</dt>
            <dd>
              ${s.text} ${linkHTML(s.route, `Open ${s.head}`, "sg-textlink")}
              ${s.second ? linkHTML(s.second.route, s.second.label, "sg-textlink") : ""}
            </dd>`,
      )}
    </dl>
    <p class="fine">
      The site does not grade work. Practice checks look for words and patterns, not meaning.
    </p>
    <h3>Learn more about the site</h3>
    <ul class="sg-plain">
      ${PD_LINKS.map((l) => html`<li>${linkHTML(l.route, l.label)}</li>`)}
      ${pdfPair(DOWNLOADS.quickGuide, "Quick Guide")}${pdfPair(DOWNLOADS.lessonBackup, "Featured Lesson backup page")}
    </ul>`;
}
