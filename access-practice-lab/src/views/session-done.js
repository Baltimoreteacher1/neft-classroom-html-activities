// The end of a practice session (/session-done/<id>): "You finished!" with the four next steps a student needs —
// try another activity, practice this skill again, view my progress, return to the Student Hub. The finish itself is
// unchanged: it counts only activities saved after the session started, awards the session's Passport XP once
// (finishSession), and survives a reload without awarding again. Nothing here erases or rewrites a saved attempt.
import { findActivity } from "../content.js";
import { finishSession, getEngagement, sessionHref } from "../engagement.js";
import { i18nFor } from "../i18n.js";
import { jumpSetAttrs, pickSet, practicePool } from "../quick-start.js";
import { loadRecord, needsReview } from "../store.js";
import { ART, BASE, DOMAIN_META, html, icon } from "../util.js";
import { studentHubHref, transferHTML } from "./students.js";

function sessionFor(ctx) {
  const engagement = getEngagement(ctx.prefs);
  const id = ctx.route.sessionId;
  const session =
    engagement.activeSession?.id === id
      ? engagement.activeSession
      : engagement.lastSession?.id === id
        ? engagement.lastSession
        : null;
  return { engagement, session: session && session.id === id ? session : null };
}

/** The four next steps. New sets come from the same pool as Jump in, at the level the learner just practiced. */
async function nextStepsHTML(I, ctx, session, practiced) {
  const band = session.band;
  const counts = new Map();
  for (const item of practiced) counts.set(item.domain, (counts.get(item.domain) || 0) + 1);
  const domain = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  const pool = await practicePool({ band, prefs: ctx.prefs }, { level: practiced[0]?.level });
  const just = new Set(session.ids);
  const fresh = pool.atLevel.filter((r) => !just.has(r.id));
  const another = pickSet(fresh, pool.isDone);
  const again = domain ? pickSet(pool.atLevel, pool.isDone, { domain }) : [];
  const hub = studentHubHref(band);
  const meta = DOMAIN_META[domain];
  const step = (cls, attrs, iconName, label) =>
    html`<a class="btn ${cls} done-step" ${attrs}>${icon(iconName)} <span>${label}</span></a>`;
  return html`<nav class="done-steps" aria-label="${I.S("What next?", "¿Qué sigue?")}">
    ${another.length ? step("btn-primary", jumpSetAttrs(band, another, I.S("Quick practice · all four skills", "Práctica rápida · las cuatro destrezas")), "sparkle", I.T("Try another activity", "Probar otra actividad")) : step("btn-primary", html`href="${hub}"`, "sparkle", I.T("Try another activity", "Probar otra actividad"))}
    ${again.length && meta ? step("", jumpSetAttrs(band, again, I.S(`Quick practice · ${meta.name}`, `Práctica rápida · ${meta.es}`)), meta.icon, I.T(`Practice ${meta.name.toLowerCase()} again`, `Practicar ${meta.es.toLowerCase()} otra vez`)) : ""}
    ${step("", html`href="${BASE}/passport?grades=${band}"`, "passport", I.T("View my progress", "Ver mi progreso"))}
    ${step("", html`href="${hub}" data-done-hub`, "arrow-left", I.T("Return to Student Hub", "Volver a la página de estudiantes"))}
  </nav>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const { engagement, session } = sessionFor(ctx);
  if (!session)
    return {
      title: I.S("Practice", "Práctica"),
      html: html`<section class="session-finish panel done-page">
        <h1 tabindex="-1">
          ${I.T("This practice session is closed", "Esta sesión de práctica está cerrada")}
        </h1>
        <p>
          <a class="btn btn-primary" href="${studentHubHref(ctx.band)}"
            >${I.T("Return to Student Hub", "Volver a la página de estudiantes")}</a
          >
        </p>
      </section>`,
    };
  const items = (
    await Promise.all(session.ids.map((id) => findActivity(id).catch(() => null)))
  ).filter(Boolean);
  const practiced = items.filter((item) => {
    const result = loadRecord(item.band, item.domain, item.level).results?.[item.activity.id];
    return (
      result?.date && Date.parse(result.date) >= Date.parse(session.started) && !needsReview(result)
    );
  });
  if (!practiced.length)
    return {
      title: I.S("Mission", "Misión"),
      html: html`<section class="session-finish panel done-page">
        <h1 tabindex="-1">${I.T("Ready when you are", "Cuando estés listo")}</h1>
        <p>
          ${I.T("Try at least one activity in this session before finishing. Your place is saved.", "Haz al menos una actividad de esta sesión antes de terminar. Tu lugar está guardado.")}
        </p>
        <a class="btn btn-primary" href="${sessionHref(session)}"
          >${I.T("Resume this mission", "Retomar esta misión")}${icon("arrow-right")}</a
        >
      </section>`,
    };
  const earned =
    engagement.activeSession?.id === session.id ? finishSession(ctx, session.id, true).earned : 0;
  const domains = [...new Set(practiced.map((item) => item.domain))];
  const domainNames = domains.map((d) => I.T(DOMAIN_META[d]?.name || d, DOMAIN_META[d]?.es || d));
  return {
    title: I.S("You finished!", "¡Terminaste!"),
    html: html`<section class="session-finish panel done-page" aria-labelledby="finishTitle">
      <div class="done-hero">
        <img src="${ART}/complete.svg" width="480" height="300" alt="" />
        <div>
          <p class="eyebrow">${I.T("Mission complete", "Misión completa")}</p>
          <h1 id="finishTitle" tabindex="-1">${I.T("You finished!", "¡Terminaste!")}</h1>
          <p class="lead">
            ${I.T(`You practiced ${practiced.length} ${practiced.length === 1 ? "activity" : "activities"}: `, `Practicaste ${practiced.length} ${practiced.length === 1 ? "actividad" : "actividades"}: `)}${domainNames.map((n, i) => html`${i ? ", " : ""}<strong>${n}</strong>`)}.
            ${I.T("There was no timer.", "No hubo cronómetro.")}
          </p>
          ${earned ? html`<p class="reward-chip" role="status">+${earned} ${I.T("Passport XP for completing this session", "XP del pasaporte por terminar esta sesión")}</p>` : html`<p class="fine" role="status">${I.T("Today’s session reward was already earned. Your practice is saved.", "Ya ganaste el premio de hoy. Tu práctica está guardada.")}</p>`}
        </div>
      </div>
      ${await nextStepsHTML(I, ctx, session, practiced)}
      ${transferHTML(I, practiced.at(-1)?.domain, practiced.at(-1)?.activity.title)}
      <details class="done-list">
        <summary>${I.T("What you practiced", "Lo que practicaste")}</summary>
        <ul>
          ${practiced.map((item) => html`<li><span lang="en">${item.activity.title}</span> · ${I.T(DOMAIN_META[item.domain]?.name || item.domain, DOMAIN_META[item.domain]?.es || item.domain)}</li>`)}
        </ul>
        <p>
          ${I.T("Try this strategy next: name the evidence, explain your choice, then use that move on a new task.", "Prueba esta estrategia: nombra la evidencia, explica tu elección y usa ese paso en una tarea nueva.")}
        </p>
      </details>
      <p class="fine">
        ${I.T("XP celebrates participation and learning habits. It is not a proficiency score or placement.", "Los XP celebran la participación y los hábitos de aprendizaje. No son un puntaje de dominio ni una ubicación.")}
      </p>
    </section>`,
  };
}
