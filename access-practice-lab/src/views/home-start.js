// The top of the lab home: one screen that answers "where do I start?".
//   One primary action (Continue unfinished work, or Start today's mission), an "I am a… Student / Teacher / Family"
//   switch, and the grade ruler. The language choice lives once, in the header. The four skills and everything else
//   sit below in "More ways to practice" (home.js); cards outside these panels come from home-registry.js.
import { GRADE_PICKS, bandName, pickerState, resolvePick } from "../grade-bands.js";
import { activeGradeFocus, inGradeFocus } from "../grade-focus.js";
import { gradeFocusHTML } from "../grade-focus-ui.js";
import { MISSIONS, stepInfo } from "../journey/curriculum.js";
import { ctaLabel, headline } from "../journey/ui/pages-hero.js";
import { stepHref, tx } from "../journey/ui/pages-shared.js";
import { sessionHref } from "../engagement.js";
import { loadRecord } from "../store.js";
import { loadIntro } from "../intro/state.js";
import { tourStatus } from "../intro/tour/model.js";
import { familyTourHost } from "../family-tour-host.js";
import { BASE, CORE_DOMAINS, DOMAIN_META, html, icon, raw } from "../util.js";

const SKILL_ES = {
  Listening: "Escuchar",
  Reading: "Leer",
  Speaking: "Hablar",
  Writing: "Escribir",
};

/** A registry card's href: lab routes get the band; site paths are used as written. */
export const cardHref = (card, band) => {
  if (card.href.startsWith("/")) return card.href;
  const [path, hash] = card.href.split("#");
  return `${BASE}/${path}${path.includes("?") ? "&" : "?"}grades=${band}${hash ? `#${hash}` : ""}`;
};

/** The most recently practiced skill room on this device for the band, with its next unfinished activity, or null. */
export function recentRoom(band, domains, focus = "") {
  let best = null;
  for (const d of CORE_DOMAINS) {
    for (const level of Object.keys(domains[d]?.levels || {})) {
      for (const r of Object.values(loadRecord(band, d, level).results || {})) {
        const t = Date.parse(r?.date || "");
        if (t && (!best || t > best.t)) best = { t, domain: d, level };
      }
    }
  }
  if (!best) return null;
  const rows = (domains[best.domain].levels[best.level]?.activities || []).filter((r) => inGradeFocus(r[5], focus));
  const done = new Set(loadRecord(band, best.domain, best.level).complete);
  return { domain: best.domain, level: best.level, next: rows.find((r) => !done.has(r[0])), t: best.t };
}

/**
 * What "Continue" means: resume an unfinished session, then return to the most recently saved unfinished work
 * across the learning systems; otherwise use the skill room or first journey step.
 */
export function continueTarget(I, { band, resume, openMission, journey, recent, moduleResume }) {
  if (resume)
    return {
      kind: "session",
      title: I.T("Today’s mission is waiting", "La misión de hoy te espera"),
      why: I.T(
        "You started a practice session. Your place is saved.",
        "Empezaste una sesión de práctica. Tu lugar está guardado.",
      ),
      cta: I.T("Resume today’s mission", "Retomar la misión de hoy"),
      href: sessionHref(resume),
      minutes: resume.minutes,
    };
  const rec = journey?.recommendation;
  const mission = typeof openMission === "string" ? { id: openMission } : openMission;
  const activeChoices = [];
  if (mission?.id)
    activeChoices.push({
      kind: "mission",
      time: Date.parse(mission.updatedAt || mission.started || "") || 0,
      rank: 4,
      target: {
        kind: "mission",
        title: I.T("Continue your mission", "Continúa tu misión"),
        why: I.T("Pick up the studio mission you started.", "Sigue con la misión del estudio que empezaste."),
        cta: I.T("Continue the mission", "Continuar la misión"),
        href: `${BASE}/missions/${mission.id}?grades=${band}`,
      },
    });
  if (rec && MISSIONS[rec.mission] && rec.kind !== "start")
    activeChoices.push({
      kind: "journey",
      time: Date.parse(journey?.updatedAt || "") || 0,
      rank: 3,
      target: {
        kind: "journey",
        title: headline(I, rec),
        why: tx(I, rec.reason),
        cta: ctaLabel(I, rec),
        href: stepHref(band, rec.mission, rec.step),
        minutes: stepInfo(rec.step).minutes,
      },
    });
  if (moduleResume?.href)
    activeChoices.push({
      kind: "resume",
      time: Date.parse(moduleResume.updatedAt || "") || 0,
      rank: 2,
      target: {
        kind: "resume",
        title: I.T(
          ({ phonics: "Continue your decoding lesson", vocabulary: "Continue your vocabulary lesson", "subject-reading": "Continue your reading investigation", "reading-room": "Continue your reading", writing: "Continue your writing", speaking: "Continue your speaking practice" })[moduleResume.system] || "Continue learning",
          ({ phonics: "Continúa tu lección de decodificación", vocabulary: "Continúa tu lección de vocabulario", "subject-reading": "Continúa tu investigación de lectura", "reading-room": "Continúa tu lectura", writing: "Continúa tu escritura", speaking: "Continúa tu práctica oral" })[moduleResume.system] || "Continúa aprendiendo",
        ),
        why: I.T("Your place is saved on this device.", "Tu lugar está guardado en este dispositivo."),
        cta: I.T("Continue", "Continuar"),
        href: moduleResume.href,
      },
    });
  if (recent?.domain)
    activeChoices.push({ kind: "room", time: recent.t || 0, rank: 1, target: null });
  activeChoices.sort((a, b) => (b.time - a.time) || (b.rank - a.rank));
  const best = activeChoices[0];
  if (best && best.kind !== "room") return best.target;
  if (best?.kind === "room") {
    const meta = DOMAIN_META[recent.domain];
    const roomHref = `${BASE}/${recent.domain}/${recent.level}?grades=${band}`;
    return {
      kind: "room",
      title: I.T(`Keep going with ${meta.name}`, `Sigue con ${SKILL_ES[recent.domain] || meta.es}`),
      why: recent.next
        ? html`${I.T("Next:", "Siguiente:")} <span lang="en">${recent.next[1]}</span>`
        : I.T("You finished this level. Choose another one.", "Terminaste este nivel. Elige otro."),
      cta: recent.next ? I.T("Continue", "Continuar") : I.T("Choose a level", "Elegir una destreza"),
      href: recent.next
        ? `${BASE}/${recent.domain}/${recent.level}/${recent.next[0]}?grades=${band}`
        : roomHref,
      minutes: recent.next?.[4] || 0,
    };
  }
  if (rec && MISSIONS[rec.mission])
    return {
      kind: "start",
      title: headline(I, rec),
      why: I.T(
        "Twelve short missions. You choose your help, and nothing here is a score.",
        "Doce misiones cortas. Tú eliges tu ayuda y nada aquí es un puntaje.",
      ),
      cta: ctaLabel(I, rec),
      href: stepHref(band, rec.mission, rec.step),
      minutes: stepInfo(rec.step).minutes,
    };
  return {
    kind: "start",
    title: I.T("Start practicing", "Empieza a practicar"),
    why: I.T("Choose a skill below.", "Elige una destreza abajo."),
    cta: I.T("Choose a skill", "Elegir una destreza"),
    href: "#skills",
  };
}

function rulerHTML(I, ctx, band, available, focusCounts) {
  const picks = pickerState(band, ctx.prefs.gradePick, available);
  const chosen = picks.find((p) => p.chosen);
  const own = chosen && chosen.serves === band && chosen.ready && chosen.content[0] === band;
  let note = "";
  if (chosen && !chosen.ready)
    note = I.T(
      `${chosen.name[0]} practice is still being written. Showing ${bandName(band)[0]}, the closest grades with practice.`,
      `La práctica de ${chosen.name[1]} todavía se está escribiendo. Mostramos ${bandName(band)[1].toLowerCase()}, los grados más cercanos con práctica.`,
    );
  else if (chosen && !own)
    note = I.T(
      `Showing ${bandName(band)[0]} practice.`,
      `Mostrando la práctica de ${bandName(band)[1].toLowerCase()}.`,
    );
  return html`<div class="lph-setting">
    <p class="lph-label" id="lphGradeLabel">${I.T("My grade", "Mi grado")}</p>
    <div class="lph-ruler" role="group" aria-labelledby="lphGradeLabel">
      ${picks.map(
        (p) =>
          html`<button
            type="button"
            class="lph-step${p.ready ? "" : " is-soon"}"
            style="--span:${p.span}"
            data-grade-pick="${p.id}"
            aria-pressed="${p.chosen}"
            aria-label="${I.S(p.name[0], p.name[1])}${p.ready ? "" : I.S(" (coming soon)", " (próximamente)")}"
          >
            <span class="lph-step-n" aria-hidden="true">${p.short[0]}</span
            >${p.ready ? "" : html`<span class="lph-step-soon" aria-hidden="true">${I.T("soon", "pronto")}</span>`}
          </button>`,
      )}
    </div>
    <p class="lph-note fine" aria-live="polite">${note}</p>
    ${band === "6-8" ? gradeFocusHTML(I, activeGradeFocus(ctx.prefs, band), { labelId: "lphGradeFocus", counts: focusCounts }) : ""}
  </div>`;
}

function skillsHTML(I, band, domains, tierFor) {
  return html`<ul class="lph-skills" aria-labelledby="lphSkillsTitle">
    ${CORE_DOMAINS.filter((d) => domains[d]).map((d) => {
      const tier = tierFor(d, domains[d].levels);
      return html`<li>
        <a class="lph-skill d-${d.toLowerCase()}" href="${BASE}/${d}/${tier}?grades=${band}"
          >${icon(DOMAIN_META[d].icon || d.toLowerCase())}<span>${I.T(d, SKILL_ES[d])}</span></a
        >
      </li>`;
    })}
  </ul>`;
}

/** The four skills, one tap each. Rendered in "More ways to practice" (home.js) under #start-learning. */
export function skillPickHTML(I, band, domains, tierFor) {
  return html`<div class="lph-pick" id="start-learning">
    <h2 class="lph-label" id="lphSkillsTitle">${I.T("Choose a skill to begin", "Elige una destreza para empezar")}</h2>
    ${skillsHTML(I, band, domains, tierFor)}
  </div>`;
}

/** The 5 / 10 / 15-minute mission buttons. `primary` makes the 10-minute one the page's main action. */
function missionButtonsHTML(I, missions, { primary, resume }) {
  const label = resume
    ? I.T("Start a new session", "Empezar una sesión nueva")
    : I.T("Start today’s mission", "Empezar la misión de hoy");
  const btn = (m) => {
    const main = primary && m.minutes === 10;
    const minutes = I.L("common.minutes", { n: m.minutes });
    return html`<button
      type="button"
      class="${main ? "btn btn-primary btn-big lph-go" : "lph-chip"}"
      ${main ? raw("data-continue") : ""}
      data-start-mission="${m.minutes}"
      data-session-ids="${m.ids.join(",")}"
      data-session-review-ids="${m.reviewIds.join(",")}"
    >
      ${main ? html`${label} <span class="lph-go-min">· ${minutes}</span>` : html`<span class="visually-hidden">${label} · </span>${minutes}`}
    </button>`;
  };
  const main = primary ? missions.find((m) => m.minutes === 10) : null;
  const chips = missions.filter((m) => m !== main).sort((a, b) => a.minutes - b.minutes);
  return html`${main ? btn(main) : ""}
    <div class="lph-chips" role="group" aria-labelledby="lphChipsLabel">
      <span class="lph-chips-label" id="lphChipsLabel"
        >${primary ? I.T("Or choose a length:", "O elige la duración:") : resume ? I.T("Or start a new session:", "O empieza una sesión nueva:") : I.T("Or start today’s mission:", "O empieza la misión de hoy:")}</span
      >${chips.map(btn)}
    </div>`;
}

/**
 * The one primary action. Unfinished work (a session, a mission, the journey, a saved lesson, the last skill room)
 * means "Continue"; otherwise "Start today’s mission" (10 minutes) with 5 and 15 as small chips. With no mission
 * possible (nothing matches the plan), the Continue target's first step is the action.
 */
export function frontDoorHTML(I, { target, missions = [], resume = null, dueCount = 0 }) {
  const continuing = target.kind !== "start";
  const mission = !continuing && missions.length > 0;
  const journeyStart = !continuing && target.href !== "#skills" ? target : null;
  return html`<section class="lph-continue lph-front" id="lphFront" data-focus-first tabindex="-1" aria-labelledby="lphContinueTitle" data-continue-kind="${mission ? "mission" : target.kind}">
    <p class="lph-label">
      ${continuing ? I.T("Continue learning", "Continuar aprendiendo") : I.T("Start here", "Empieza aquí")}
    </p>
    <h2 id="lphContinueTitle">${mission ? I.T("Today’s mission", "La misión de hoy") : target.title}</h2>
    <p class="lph-why">
      ${mission ? (dueCount ? I.T("Short practice picked for you. Review that is due comes first. No timer.", "Práctica corta elegida para ti. Primero va el repaso pendiente. Sin cronómetro.") : I.T("Short practice picked for you. Unfinished work comes first. No timer.", "Práctica corta elegida para ti. Primero va lo que no has terminado. Sin cronómetro.")) : target.why}
    </p>
    <div class="session-heading lph-actions">
      ${mission ? "" : html`<a class="btn btn-primary btn-big lph-go" data-continue href="${target.href}">${target.cta}${icon("arrow-right")}</a>`}
      ${missions.length ? missionButtonsHTML(I, missions, { primary: mission, resume: continuing && resume }) : ""}
    </div>
    ${!mission && target.minutes ? html`<p class="fine lph-time">${I.T(`About ${target.minutes} minutes · no timer`, `Unos ${target.minutes} minutos · sin cronómetro`)}</p>` : ""}
    ${journeyStart && mission ? html`<p class="fine lph-time"><a data-continue-journey href="${journeyStart.href}">${I.T("New here? Begin the Learning Journey", "¿Eres nuevo? Empieza el recorrido de aprendizaje")}</a></p>` : ""}
  </section>`;
}

/** "I am a… Student / Teacher / Family": Teacher follows the tour on this device; Family opens Practice Together. */
function rolesHTML(I, band) {
  const tourState = tourStatus(loadIntro()).state;
  const going = tourState === "continue";
  const teacherHint = { continue: I.S("Continue the Teacher Tour", "Continuar el recorrido para docentes"), again: I.S("Take the Teacher Tour again", "Repetir el recorrido para docentes"), start: I.S("Start the Teacher Tour", "Empezar el recorrido para docentes") }[tourState];
  return html`<nav class="lph-roles" aria-labelledby="lphRolesLabel">
    <span class="lph-roles-label" id="lphRolesLabel">${I.T("I am a…", "Soy…")}</span>
    <a class="lph-role is-student" href="#lphFront" aria-current="true">${icon("reading")}<span>${I.T("Student", "Estudiante")}</span></a>
    <a class="lph-role is-teacher" data-tour="${tourState}" title="${teacherHint}" href="${going ? `${BASE}/start/tour` : `${BASE}/start/tour?part=1&grades=${band}`}">${icon("teacher")}<span>${I.T("Teacher", "Docente")}</span></a>
    <a class="lph-role is-family" title="${I.S("Practice English Together", "Practicar inglés juntos")}" href="${BASE}/${familyTourHost() ? "family-tour/" : "practice-together"}?grades=${band}">${icon("families")}<span>${I.T("Family", "Familia")}</span></a>
  </nav>`;
}

/**
 * The start screen: who you are, the title, ONE primary action, and the grade. Everything else on the home sits
 * below it behind "More ways to practice" (home.js). `data` carries what home.js already loaded.
 */
export function startHTML(I, ctx, data) {
  const { band, available, focusCounts, target, missions, resume, dueCount } = data;
  return html`<section class="lph" aria-labelledby="homeTitle">
    ${rolesHTML(I, band)}
    <div class="lph-intro">
      <h1 id="homeTitle" tabindex="-1">
        ${I.T("Practice English for school, one step at a time", "Practica inglés para la escuela, paso a paso")}
      </h1>
      <p class="lph-lead">
        ${I.T("Listening, reading, speaking and writing for multilingual learners. No timers. Your work saves on this device.", "Escuchar, leer, hablar y escribir para estudiantes multilingües. Sin cronómetros. Tu trabajo se guarda en este dispositivo.")}
      </p>
    </div>
    <div class="lph-student">${frontDoorHTML(I, { target, missions, resume, dueCount })}</div>
    <div class="lph-grade">${rulerHTML(I, ctx, band, available, focusCounts)}</div>
  </section>`;
}

/** Home click for a grade pick; returns the content band to show, or "" when nothing changes. */
export function pickBand(pickId, available) {
  if (!GRADE_PICKS.some((p) => p.id === pickId)) return "";
  return resolvePick(pickId, available).band;
}
