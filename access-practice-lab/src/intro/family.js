// Practice Together (/practice-together): the family walkthrough, in three steps, in the family's language.
//   1. Get started        "Let's practice English together": what this is, the directions language, the child's grade,
//                         and one action. A three-picture "how it works" strip shows the routine before it starts.
//   2. Practice together  one short, real activity in a frame with the coach (coach/coach.js) speaking to the adult:
//                         hear the directions, let the child answer in English, check, read the message, try again.
//   3. What to do next    one action, "Start practicing" (the next real activity for this grade), how to keep going,
//                         and answers about sharing a device and saving, shown only on this step.
// The step is in the address (?step=) and the family's grade on this device (state.js "family"), so a reload, Back or a
// teacher's ?grades= link lands in the right place. Words live in family-guide-data.js as { en, es } pairs; the English
// practice itself is never translated.
import { normalizeBand } from "../bands.js";
import { activityFrame, createCoach } from "../coach/coach.js";
import { loopSteps } from "../coach/activity-steps.js";
import { i18nFor, langSwitchHTML } from "../i18n.js";
import { BASE, html, icon } from "../util.js";
import {
  FAMILY_BANDS,
  FAMILY_HANDOUT,
  familyActivitiesFor,
  familyBandFromGrades,
} from "./family-data.js";
import { EARLY_PICKS, FAMILY_HANDOUT_K2 } from "./family-k2-data.js";
import {
  COACH_COPY,
  FAMILY_HELP,
  FAMILY_SAY,
  PAGE,
  STEPS,
  resolveLang,
} from "./family-guide-data.js";
import { withReturn } from "./return-bar.js";
import { loadIntro, updateIntro } from "./state.js";
import { BAND_TOUR, DOMAIN_BY_ID } from "./tour-bands.js";
import { helpHTML } from "./tour-help.js";
import { bindGuide, guideBubbleHTML } from "./guide.js";
import { guideArtSVG } from "./guide-art.js";

let coach = null;
let view = null;

/** The language the guide speaks: Spanish in Español and in English + Español (the page itself shows both). */
const guideLang = (I) => (I.mode === "en" ? "en" : "es");

/**
 * The grade band to show: a teacher's shared link (?grades=) first, then the family's own choice on this device. With
 * neither, step 1 shows no choice yet (a parent who taps Start is asked for the grade, never handed another grade's
 * work); steps 2 and 3 fall back to the lab's current grade.
 */
function chosenBand(ctx, { allowNone = false } = {}) {
  const linked = familyBandFromGrades(ctx.route?.grades);
  if (linked) return linked;
  const saved = loadIntro().family?.band;
  if (FAMILY_BANDS.some((b) => b.id === saved)) return saved;
  if (allowNone) return "";
  if (ctx.band === "3-5" || ctx.band === "6-8") return ctx.band;
  return ["K", "1", "2-3"].includes(ctx.band) ? "k-2" : "6-8";
}

/** The exact grade inside the band: the link's grade, then the family's own choice, then the lab's grade, else the
 * band's usual one (Kindergarten, Grade 4). Returns a PAGE.exact entry, or null for Grades 6–8. */
function exactGrade(ctx, band) {
  const list = PAGE.exact[band];
  if (!list) return null;
  const linked = String(ctx.route?.grades || "").toUpperCase();
  const intro = loadIntro();
  const byPick = (p) => list.find((x) => x.pick === (p === "3-5" ? "4-5" : p));
  return (
    (linked && byPick(linked)) ||
    list.find((x) => x.id === intro.family?.exact) ||
    byPick(intro.family?.early) ||
    byPick(ctx.band) ||
    byPick(intro.band?.pick) ||
    list.find((x) => x.id === (band === "k-2" ? "K" : "4"))
  );
}

/** The lab grade pick for a band and its exact grade. */
const pickFor = (band, exact) => exact?.pick || (band === "3-5" ? "4-5" : band === "k-2" ? "K" : "6-8");

/** Make the family's grade the lab's grade too, so the menu, the directory and every activity agree with it. */
function syncLabBand(ctx, plan) {
  const band = normalizeBand(plan.pick);
  if (ctx.bands?.includes(band)) ctx.setBand(band);
}

/** K–2's next activity is a picture-talk page; its words for the family (the steps match early/player.js). */
const K2_TALK = {
  description: {
    en: "Look at a picture together. Your child says what they see, out loud, in English.",
    es: "Miren juntos una imagen. Su hijo o hija dice en voz alta, en inglés, lo que ve.",
  },
  steps: [
    { en: "Listen to the model answer first.", es: "Primero escuchen la respuesta modelo." },
    { en: "Your child says their own sentence out loud.", es: "Su hijo o hija dice su propia oración en voz alta." },
    { en: "Press the button that says the answer was said. Recording is never needed.", es: "Toquen el botón que dice que ya respondió. Nunca hace falta grabar." },
  ],
};

/** The practice activity (step 2) and the next ones (step 3) for a family grade. */
export function familyPlan(band, pick = band === "k-2" ? "K" : "") {
  if (band === "k-2" || EARLY_PICKS.includes(pick)) {
    const t = BAND_TOUR[pick];
    return {
      pick,
      practice: { ...t.listening, pick, domain: DOMAIN_BY_ID.listening },
      next: { route: t.speaking.route, name: t.speaking.title, pick, description: K2_TALK.description, steps: K2_TALK.steps },
      more: [{ route: t.reading.route, name: t.reading.title, icon: "reading" }],
    };
  }
  const pick35 = band === "3-5" ? "4-5" : "6-8";
  const [talk, write] = familyActivitiesFor(band);
  return {
    pick: pick35,
    practice: { ...BAND_TOUR[pick35].reading, pick: pick35, domain: DOMAIN_BY_ID.reading },
    next: {
      route: talk.route,
      name: talk.activityName,
      pick: pick35,
      title: talk.title,
      description: talk.description,
      steps: talk.steps.map((x) => x.body),
    },
    more: [{ route: write.route, name: write.activityName, title: write.title, icon: "writing" }],
  };
}

const withGrades = (route, pick, extra = "") =>
  `${BASE}${route}${route.includes("?") ? "&" : "?"}grades=${encodeURIComponent(pick)}${extra}`;
/** A step's address. `grades` carries the plan's grade pick, which also names the family grade (K–2, 3–5, 6–8). */
const stepHref = (n, plan) => `${BASE}/practice-together?step=${n}&grades=${encodeURIComponent(plan?.pick || "6-8")}`;

function readStep(ctx) {
  const n = Number.parseInt(ctx.route?.step || "1", 10);
  return [1, 2, 3].includes(n) ? n : 1;
}

/* ── Shared frame ── */
function topHTML(I, n, plan) {
  return html`<header class="gt-top ft-top">
    <p class="gt-eyebrow">
      ${icon("families")}${I.TO(PAGE.eyebrow)} · ${I.TO(PAGE.stepOf)} ${n} ${I.TO(PAGE.of)} 3
    </p>
    <a
      class="gt-exit"
      href="${BASE}/?grades=${plan.pick}"
      >${icon("close")}${I.TO(PAGE.exit)}</a
    >
    <nav class="gt-progress" aria-label="${I.S(PAGE.progressLabel.en, PAGE.progressLabel.es)}">
      <ol class="is-three">
        ${STEPS.map((s) => {
          const label = html`<span class="gt-progress-n" aria-hidden="true"
              >${s.n < n ? icon("check") : s.n}</span
            ><span class="gt-progress-name">${I.TO(s.name)}</span>`;
          return html`<li
            class="${s.n < n ? "is-done" : s.n === n ? "is-now" : ""}"
            ${s.n === n ? html`aria-current="step"` : ""}
          >
            ${s.n < n ? html`<a href="${stepHref(s.n, plan)}">${label}</a>` : html`<span>${label}</span>`}
          </li>`;
        })}
      </ol>
    </nav>
  </header>`;
}

function bandHTML(I, band, exact) {
  const list = PAGE.exact[band];
  return html`<div class="ft-field">
    <p class="ft-label" id="ftBandLabel">${I.TO(PAGE.gradeLabel)}</p>
    <div class="ft-bands" role="group" aria-labelledby="ftBandLabel">
      ${FAMILY_BANDS.map(
        (b) =>
          html`<button type="button" class="ft-band" data-ft-band="${b.id}" aria-pressed="${String(b.id === band)}">
            ${I.TO(b.label)}
          </button>`,
      )}
    </div>
    ${
      list
        ? html`<p class="ft-label ft-label-sub" id="ftExactLabel">${I.TO(PAGE.early)}</p>
            <div class="ft-bands is-sub" role="group" aria-labelledby="ftExactLabel">
              ${list.map(
                (x) =>
                  html`<button type="button" class="ft-band" data-ft-exact="${x.id}" aria-pressed="${String(x.id === exact?.id)}">
                    ${I.TO(x.label)}
                  </button>`,
              )}
            </div>`
        : ""
    }
    <p class="ft-need" data-ft-need-note aria-live="polite"></p>
  </div>`;
}

function printHTML(I, band) {
  const langs = I.mode === "bi" ? ["en", "es"] : [I.mode === "es" ? "es" : "en"];
  const files = band === "k-2" ? FAMILY_HANDOUT_K2 : FAMILY_HANDOUT;
  return html`<p class="ft-print">
    ${langs.map(
      (l) =>
        html`<a href="${files[l].pdf}" target="_blank" rel="noopener" lang="${l}"
          >${icon("print")}${PAGE.print[l]} (PDF)</a
        >`,
    )}
  </p>`;
}

/** Mr. Neft opens each family step in the family's language, with the family questions behind "Ask". */
const neftFamily = (I, line, plan) =>
  guideBubbleHTML({
    say: I.mode === "en" ? line.en : line.es,
    role: I.mode === "en" ? "Your guide" : "Su guía",
    chips: ["what", "account", "mic", "saved", "sound", "language"],
    context: { page: "family", pick: plan.pick },
    lang: I.mode === "en" ? "en" : "es",
  });

/* ── Step 1 ── */
function startHTML(I, band, plan, exact) {
  return html`<section class="gt-part ft-start" aria-labelledby="ftTitle">
    <h1 id="ftTitle" tabindex="-1">${I.TO(PAGE.title)}</h1>
    <p class="gt-lead">${I.TO(PAGE.lead)}</p>
    <div class="ft-card">
      ${bandHTML(I, band, exact)}
      ${
        band
          ? html`<a class="btn btn-primary btn-big ft-go" href="${stepHref(2, plan)}"
              >${I.TO(PAGE.start)}${icon("arrow-right")}</a
            >`
          : html`<button type="button" class="btn btn-primary btn-big ft-go" data-ft-need>
              ${I.TO(PAGE.start)}${icon("arrow-right")}
            </button>`
      }
      <div class="ft-field ft-lang">
        <p class="ft-label" id="ftLangLabel">${I.TO(PAGE.langLabel)}</p>
        ${langSwitchHTML(I.mode, { idPrefix: "ftLang" })}
        <p class="fine">${I.TO(PAGE.langNote)}</p>
      </div>
    </div>
    ${neftFamily(I, PAGE.welcome, plan)}
    <p class="ft-reassure">${icon("families")}<span>${I.TO(PAGE.noEnglish)}</span></p>
    <section class="ft-how" aria-labelledby="ftHow">
      <h2 id="ftHow">${I.TO(PAGE.how)}</h2>
      <ol>
        ${PAGE.howSteps.map(
          (s, i) =>
            html`<li>
              <span class="ft-how-ic" aria-hidden="true">${icon(s.icon)}<b>${i + 1}</b></span>
              <strong>${I.TO(s.head)}</strong><span>${I.TO(s.body)}</span>
            </li>`,
        )}
      </ol>
    </section>
    <p class="ft-quiet">
      <a href="${withReturn(withGrades(plan.next.route, plan.next.pick), "together")}"
        >${I.TO(PAGE.skip)}${icon("arrow-right")}</a
      >
    </p>
    ${printHTML(I, band)}
  </section>`;
}

/* ── Step 2 ── */
function practiceHTML(I, band, plan) {
  const a = plan.practice;
  const path = a.route.split("?")[0];
  return html`<section class="gt-part ft-practice" aria-labelledby="ftTitle">
    <h1 id="ftTitle" tabindex="-1">${I.TO(PAGE.practiceTitle)}</h1>
    <p class="gt-lead">${I.TO(PAGE.practiceLead)}</p>
    <p class="gt-activity-line">${icon(a.domain.icon)}<strong lang="en">${a.title}</strong></p>
    <div
      class="gt-stage"
      data-gt-stage
      data-src="${withGrades(a.route, a.pick, "&frame=1")}"
      data-path="${BASE}${path}"
      data-title="${a.title}"
    >
      <div class="gt-coach" data-coach-slot></div>
      <div class="gt-frame-slot" data-gt-frame>
        <p class="gt-loading" role="status">
          ${icon("clock")}${I.S("Opening the activity…", "Abriendo la actividad…")}
        </p>
      </div>
    </div>
    <nav class="gt-nav" aria-label="${I.S("Steps", "Pasos")}">
      <a class="btn ghost" href="${stepHref(1, plan)}">${icon("arrow-left")}${I.TO(PAGE.back)}</a>
      <a class="btn" href="${stepHref(3, plan)}">${I.TO(PAGE.skipToNext)}${icon("arrow-right")}</a>
    </nav>
  </section>`;
}

/* ── Step 3 ── */
function nextHTML(I, band, plan) {
  const disclosure = (x) =>
    html`<details class="ft-q">
      <summary>${I.TO(x.q)}</summary>
      <p>${I.TO(x.a)}</p>
    </details>`;
  return html`<section class="gt-part ft-next" aria-labelledby="ftTitle">
    ${neftFamily(I, PAGE.nextNeft, plan)}
    <div class="gt-ready ft-ready">
      <span class="gt-ready-mark" aria-hidden="true">${icon("check")}</span>
      <div>
        <h1 id="ftTitle" tabindex="-1">${I.TO(PAGE.nextTitle)}</h1>
        <p>${I.TO(PAGE.nextLead)}</p>
      </div>
    </div>
    <div class="ft-card ft-next-card">
      <p class="ft-next-name">${icon("speaking")}<strong lang="en">${plan.next.name}</strong></p>
      <p class="ft-next-desc">${I.TO(plan.next.description)}</p>
      <ol class="ft-next-steps">
        ${plan.next.steps.map((x) => html`<li>${I.TO(x)}</li>`)}
      </ol>
      <a
        class="btn btn-primary btn-big"
        href="${withReturn(withGrades(plan.next.route, plan.next.pick), "together")}"
        >${I.TO(PAGE.startPracticing)}${icon("arrow-right")}</a
      >
      <a class="ft-again" href="${stepHref(2, plan)}">${icon("retry")}${I.TO(PAGE.again)}</a>
    </div>
    <section class="ft-keep" aria-labelledby="ftKeep">
      <h2 id="ftKeep">${I.TO(PAGE.keepGoing)}</h2>
      <ul>
        ${PAGE.keep.map((k) => html`<li>${icon("check")}<span>${I.TO(k)}</span></li>`)}
      </ul>
    </section>
    <section class="ft-more" aria-labelledby="ftMore">
      <h2 id="ftMore">${I.TO(PAGE.moreTitle)}</h2>
      <ul>
        ${plan.more.map(
          (m) =>
            html`<li>
              <a href="${withReturn(withGrades(m.route, plan.pick), "together")}"
                >${icon(m.icon)}<span
                  >${m.title ? I.TO(m.title) : ""}<strong lang="en">${m.name}</strong></span
                ></a
              >
            </li>`,
        )}
      </ul>
    </section>
    <div class="ft-qs">${disclosure(PAGE.sharing)}${disclosure(PAGE.saving)}</div>
    ${printHTML(I, band)}
  </section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const n = readStep(ctx);
  const band = chosenBand(ctx, { allowNone: n === 1 });
  const exact = exactGrade(ctx, band);
  // With no grade chosen yet, the page's other links (the handout, "go straight to practice") use Grades 6–8.
  const plan = familyPlan(band || "6-8", pickFor(band || "6-8", exact));
  view = { n, band, plan, lang: guideLang(I), mode: I.mode };
  updateIntro("family", (f) => ({ ...f, step: n }));
  const lang = guideLang(I);
  const help = resolveLang(FAMILY_HELP, lang);
  const body =
    n === 1
      ? startHTML(I, band, plan, exact)
      : n === 2
        ? practiceHTML(I, band, plan)
        : nextHTML(I, band, plan);
  return {
    title: I.S(STEPS[n - 1].name.en, STEPS[n - 1].name.es),
    html: html`<article class="gt-page ft-page" aria-labelledby="ftTitle">
      ${topHTML(I, n, plan)} ${body}
      ${helpHTML({
        say: {
          ...help,
          links: [
            {
              href: `${BASE}/family?grades=${plan.pick}`,
              label: I.S("More family help", "Más ayuda para familias"),
            },
          ],
        },
        restart: true,
        restartAttr: "data-ft-restart",
        lang,
      })}
      <footer class="ft-foot">
        <p class="fine">${I.TO(PAGE.privacy)}</p>
        ${I.mode === "en" ? "" : html`<p class="fine">${I.TO(PAGE.machine)}</p>`}
      </footer>
    </article>`,
  };
}

export function mount(root, ctx) {
  bindGuide();
  coach?.destroy();
  coach = null;
  const stage = document.querySelector("[data-gt-stage]");
  if (!stage || !view) return;
  const lang = view.lang;
  const frame = activityFrame(stage.dataset.src, stage.dataset.title);
  const slot = stage.querySelector("[data-gt-frame]");
  frame.addEventListener("load", () => slot.querySelector(".gt-loading")?.remove(), { once: true });
  slot.append(frame);
  const path = stage.dataset.path;
  const copy = resolveLang(COACH_COPY, lang);
  copy.stepOf = (a, b) => (lang === "es" ? `Paso ${a} de ${b}` : `Step ${a} of ${b}`);
  copy.lang = lang === "es" ? "es-US" : "en-US";
  copy.guide = { name: "Mr. Neft", role: lang === "es" ? "Su guía" : "Your guide", avatar: guideArtSVG() };
  coach = createCoach({
    stage,
    frame,
    // In Español the directions already show in Spanish, so the "directions in Spanish" step is left out.
    steps: loopSteps({ ...resolveLang(FAMILY_SAY, lang), ...(view.mode === "es" ? { spanish: null } : {}) }),
    copy,
    isHome: (win) => {
      try {
        return win.location.pathname === path || win.location.href === "about:blank";
      } catch {
        return true;
      }
    },
    onFinish: () => ctx.navigate(stepHref(3, view.plan)),
  });
}

export function unmount() {
  coach?.destroy();
  coach = null;
}

export function onClick(e, ctx) {
  if (e.target.closest?.("[data-ft-restart]")) {
    updateIntro("family", (f) => ({ ...f, step: 1 }));
    ctx.navigate(stepHref(1, view?.plan));
    return true;
  }
  if (e.target.closest?.("[data-ft-need]")) {
    // Start before a grade is chosen: say so where the grade buttons are, and put focus on the first one.
    const note = document.querySelector("[data-ft-need-note]");
    if (note) note.textContent = i18nFor(ctx).S(PAGE.needGrade.en, PAGE.needGrade.es);
    document.querySelector("[data-ft-band]")?.focus();
    return true;
  }
  const exact = e.target.closest?.("[data-ft-exact]");
  if (exact) {
    const id = exact.dataset.ftExact;
    const band = Object.keys(PAGE.exact).find((k) => PAGE.exact[k].some((x) => x.id === id));
    updateIntro("family", (f) => ({ ...f, band, exact: id }));
    return chooseGrade(ctx, band, `[data-ft-exact="${id}"]`);
  }
  const b = e.target.closest?.("[data-ft-band]");
  if (!b) return false;
  const id = b.dataset.ftBand;
  updateIntro("family", (f) => ({ ...f, band: id }));
  return chooseGrade(ctx, id, `[data-ft-band="${id}"]`);
}

/** After a grade choice: a teacher link's ?grades= leaves the address (the family's choice now wins), the lab takes
 * the same grade, and the page re-renders with focus kept on the pressed button. */
function chooseGrade(ctx, band, focus) {
  const url = new URL(location.href);
  url.searchParams.delete("grades");
  history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  const exact = exactGrade({ ...ctx, route: { ...ctx.route, grades: "" } }, band);
  syncLabBand(ctx, familyPlan(band, pickFor(band, exact)));
  Promise.resolve(ctx.rerender()).then(() => document.querySelector(focus)?.focus({ preventScroll: true }));
  return true;
}
