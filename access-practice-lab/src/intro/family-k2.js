// Practice Together, grades K–2: one routine to do tonight right on the page ("Let’s Talk About a Picture"), built from
// the Kindergarten, Grade 1 or Grades 2–3 Speaking activity of the tour (tour-bands.js), with three steps, the model
// student's answer as the example, the grown-up's role, a Start button to the real activity and a quiet link to the
// whole early-learner page. Copy lives in family-k2-data.js.
import { ART, BASE, html, icon } from "../util.js";
import { EARLY_CARD, EARLY_PICKS, earlyPickFrom, earlyRoutine } from "./family-k2-data.js";
import { readButtonHTML } from "./family-read.js";
import { withReturn } from "./return-bar.js";
import { loadIntro } from "./state.js";
import { tourRoute } from "./tour-bands.js";

/**
 * The early pick for this render: the link's ?grades=, then the family's own choice, then the lab's grade when it is
 * K–3, then the grade a teacher chose on this device, else K.
 */
export const earlyPick = (ctx) => {
  const intro = loadIntro();
  const own = EARLY_PICKS.includes(intro.family?.early) ? intro.family.early : "";
  const lab = EARLY_PICKS.includes(ctx.band) ? ctx.band : "";
  return earlyPickFrom(ctx.route?.grades, own || lab || intro.band?.pick);
};

/** The K–2 card. `tag` is the domain word on the picture (FAMILY_WELCOME.tags.talk). */
export function earlyCardHTML(I, ctx, { tag, start }) {
  const r = earlyRoutine(earlyPick(ctx));
  const a = r.activity;
  return html`<article class="tg-card is-early d-speaking" aria-labelledby="tgCard-early">
    <div class="tg-art">
      <img
        src="${ART}/domain-speaking.svg"
        alt=""
        width="480"
        height="360"
        loading="lazy"
        decoding="async"
      />
      <span class="tg-tag">${icon("speaking")}${I.TO(tag)}</span>
    </div>
    <header class="tg-card-head">
      <span class="tg-ic" aria-hidden="true">${icon("speaking")}</span>
      <div>
        <h3 id="tgCard-early">${I.TO(EARLY_CARD.title)}</h3>
        <p class="tg-activity"><span lang="en">${a.title}</span></p>
      </div>
    </header>
    <p class="tg-desc">${I.TO(EARLY_CARD.description)}</p>
    ${readButtonHTML(I, "early", EARLY_CARD.title)}
    <ol class="tg-steps">
      ${r.steps.map((s) => html`<li><strong>${I.TO(s.head)}</strong><span>${I.TO(s.body)}</span></li>`)}
    </ol>
    <div class="tg-example" role="group" aria-labelledby="tgEx-early">
      <p class="tg-label" id="tgEx-early">${I.TO(EARLY_CARD.exampleLabel)}</p>
      <p class="tg-quote"><span lang="en">${r.model.label}: “${r.model.text}”</span></p>
    </div>
    <p class="fine tg-note">${I.TO(EARLY_CARD.role)}</p>
    <a class="btn btn-primary tg-start" href="${withReturn(`${BASE}${tourRoute(a)}`, "together")}"
      >${I.TO(start)}<span class="visually-hidden">: ${I.TO(EARLY_CARD.title)}</span
      >${icon("arrow-right")}</a
    >
    <p class="tg-early-more">
      ${I.TO(EARLY_CARD.moreText)}
      <a href="${withReturn(`${BASE}/early?grades=${r.pick}`, "together")}"
        >${I.TO(EARLY_CARD.more)}</a
      >
    </p>
  </article>`;
}

/** The routine's steps for the read-aloud button. */
export const earlySteps = (ctx) => earlyRoutine(earlyPick(ctx)).steps;
