// Road to ACCESS: a 12-week plan, one stop a week (a playlist of one activity
// per skill + a family talk prompt). The current week is picked from today's date.
import { bandSwitchHTML, crumbsHTML, domainGlyph } from "../components.js";
import { bandRows, loadRoad } from "../content.js";
import { loadRecord } from "../store.js";
import { i18nFor } from "../i18n.js";
import { BASE, DOMAIN_META, bandLabel, formatDate, html, icon, todayISO } from "../util.js";
import { activityHref } from "./room.js";

const bandEs = (band) => `Grados ${band.replace("-", "–")}`;

export function currentWeek(plan) {
  const weeks = plan?.weeks || [];
  if (!weeks.length) return null;
  const today = todayISO();
  let pick = weeks[0];
  for (const w of weeks) if (w.start <= today) pick = w;
  return pick;
}

const playHref = (w, band, I) =>
  `${BASE}/play?ids=${w.activities.join(",")}&t=${encodeURIComponent(I.S(`Road to ACCESS · Week ${w.n}`, `Camino a ACCESS · Semana ${w.n}`))}&grades=${band}`;

const minutesOf = (a) => Number(a.minutes) || parseInt(a.time, 10) || 8;

export async function render(ctx) {
  const band = ctx.band;
  const I = i18nFor(ctx);
  const { T, S } = I;
  const dom = (d) => T(d, DOMAIN_META[d]?.es);
  const [road, rows] = await Promise.all([loadRoad(), bandRows(band)]);
  const plan = road?.[band];
  if (!plan?.weeks?.length)
    return {
      title: S("Road to ACCESS", "Camino a ACCESS"),
      html: html`<section class="panel">
        <h1 tabindex="-1">${T("Road to ACCESS", "Camino a ACCESS")}</h1>
        <p>${T(`The weekly plan for ${bandLabel(band)} is coming soon.`, `El plan semanal para ${bandEs(band).toLowerCase()} llegará pronto.`)}</p>
      </section>`,
    };
  const byId = new Map(rows.map((r) => [r.id, r]));
  const now = currentWeek(plan);
  const focus = plan.weeks.find((w) => w.n === ctx.route.week) || now;
  const isDone = (id) => {
    const r = byId.get(id);
    return r ? loadRecord(band, r.domain, r.level).complete.includes(id) : false;
  };
  const weekActs = (w) => w.activities.map((id) => byId.get(id)).filter(Boolean);
  const weekDone = (w) => {
    const acts = weekActs(w);
    return acts.length > 0 && acts.every((a) => isDone(a.id));
  };
  const weeksDone = plan.weeks.filter(weekDone).length;
  const stop = (w) => {
    const done = weekDone(w);
    const isNow = w.n === now?.n;
    return html`<li class="rd-stop ${isNow ? "is-now" : ""} ${w.n === focus.n ? "is-open" : ""} ${done ? "is-done" : ""}">
      <a
        class="rd-stop-link"
        href="${BASE}/road/${w.n}?grades=${band}"
        aria-current="${w.n === focus.n ? "step" : "false"}"
      >
        <span class="rd-node">${done ? icon("check") : w.n}</span>
        <span class="rd-label">
          <strong>${T(`Week ${w.n}`, `Semana ${w.n}`)}${done ? html`<span class="visually-hidden"> · ${T("all activities finished", "todas las actividades terminadas")}</span>` : ""}</strong>
          <span class="rd-type">${w.taskType}</span>
          <span class="rd-theme">${w.theme}</span>
          <span class="rd-date">${formatDate(w.start)}</span>
        </span>
        ${isNow ? html`<span class="rd-here">${T("This week", "Esta semana")}</span>` : ""}
      </a>
    </li>`;
  };
  const acts = weekActs(focus);
  const minutes = acts.reduce((sum, a) => sum + minutesOf(a), 0);
  const prev = plan.weeks.find((w) => w.n === focus.n - 1);
  const next = plan.weeks.find((w) => w.n === focus.n + 1);
  return {
    title: S(`Road to ACCESS · Week ${focus.n}`, `Camino a ACCESS · Semana ${focus.n}`),
    html: html`${crumbsHTML([
        [S("Lab", "Laboratorio"), `${BASE}/`],
        [S("Road to ACCESS", "Camino a ACCESS"), null],
      ])}
      <section class="prog-hero rd-hero">
        <div class="prog-hero-copy">
          <p class="eyebrow">${icon("road")} ${T(`${bandLabel(band)} · 12-week classroom practice plan`, `${bandEs(band)} · plan de práctica de 12 semanas para el aula`)}</p>
          <h1 tabindex="-1">${T("Road to ACCESS", "Camino a ACCESS")}</h1>
          <p class="lead">
            ${T(
              "A weekly playlist with a language goal and something to talk about at home. Family week has two activities. Some weeks include a supported stretch or a familiar review.",
              "Una lista semanal con una meta de lenguaje y un tema para conversar en casa. La semana de la familia tiene dos actividades. Algunas semanas incluyen un reto con apoyo o un repaso de algo conocido.",
            )}
          </p>
          ${bandSwitchHTML(band, ctx.bands)}
        </div>
        <div class="rd-summary" role="group" aria-label="${S("Plan progress", "Progreso del plan")}">
          <p class="rd-summary-n">${I.mode === "en" ? html`<strong>${weeksDone}</strong> of ${plan.weeks.length} weeks finished` : T(`${weeksDone} of ${plan.weeks.length} weeks finished`, `${weeksDone} de ${plan.weeks.length} semanas terminadas`)}</p>
          <div class="bar" aria-hidden="true"><i style="width:${Math.round((weeksDone / plan.weeks.length) * 100)}%"></i></div>
          <p class="fine">${T("A week is finished when all of its activities are done on this device. This counts practice, not language level.", "Una semana está terminada cuando todas sus actividades están hechas en este dispositivo. Esto cuenta la práctica, no el nivel de idioma.")}</p>
          ${now ? html`<a class="btn btn-primary" href="${BASE}/road/${now.n}?grades=${band}">${T(`Go to this week (Week ${now.n})`, `Ir a esta semana (Semana ${now.n})`)} ${icon("arrow-right")}</a>` : ""}
        </div>
      </section>
      <h2 class="prog-heading">${T("The 12-week plan", "El plan de 12 semanas")}</h2>
      <ol class="rd-map">
        ${plan.weeks.map(stop)}
      </ol>
      <div class="rd-detail">
        <section class="panel rd-week" aria-labelledby="weekTitle">
          <p class="eyebrow">
            ${T(`Week ${focus.n} · starts`, `Semana ${focus.n} · empieza`)}
            ${formatDate(focus.start, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h2 id="weekTitle">${focus.taskType}: ${focus.theme}</h2>
          <p>${focus.focus}</p>
          <p class="fine">${T(`About ${minutes} minutes for ${acts.length} activities, plus family conversation. Take breaks as needed.`, `Unos ${minutes} minutos para ${acts.length} actividades, más una conversación en familia. Haz pausas cuando las necesites.`)}</p>
          <ol class="rd-acts">
            ${acts.map(
              (a) =>
                html`<li class="d-${a.domain.toLowerCase()} ${isDone(a.id) ? "is-done" : ""}">
                  <a href="${activityHref(a.domain, a.level, a.id)}?grades=${band}">
                    <span class="prog-tile">${domainGlyph(a.domain)}</span>
                    <span class="rd-act-body"><strong>${a.title}</strong><span class="rd-act-meta">${dom(a.domain)} · ${minutesOf(a)} min</span><span class="fine">${focus.activityRationale?.[a.id] || a.skill}</span></span>
                    <span class="rd-tick ${isDone(a.id) ? "is-on" : ""}">${isDone(a.id) ? html`${icon("check")} ${T("Done", "Hecho")}` : T("Not yet", "Aún no")}</span>
                  </a>
                </li>`,
            )}
          </ol>
          <nav class="rd-step" aria-label="${S("Move between weeks", "Moverse entre semanas")}">
            ${prev ? html`<a class="btn small" href="${BASE}/road/${prev.n}?grades=${band}">${icon("arrow-left")} ${T(`Week ${prev.n}`, `Semana ${prev.n}`)}</a>` : html`<span></span>`}
            ${next ? html`<a class="btn small" href="${BASE}/road/${next.n}?grades=${band}">${T(`Week ${next.n}`, `Semana ${next.n}`)} ${icon("arrow-right")}</a>` : ""}
          </nav>
        </section>
        <aside class="rd-aside" aria-label="${S("This week's tools", "Herramientas de esta semana")}">
          <section class="rd-card">
            <h3>${icon("play")} ${T("Start the week", "Empieza la semana")}</h3>
            <a class="btn btn-primary" href="${playHref(focus, band, I)}">${icon("play")} ${T("Play this week in order", "Haz esta semana en orden")}</a>
            <button type="button" class="btn small" data-copy="${BASE}/road/${focus.n}?grades=${band}">
              ${icon("copy")} ${T("Copy this week's link", "Copiar el enlace de esta semana")}
            </button>
          </section>
          <section class="rd-card rd-family">
            <h3>${icon("families")} ${I.mode === "es" ? T("Talk at home", "Para hablar en casa") : html`Talk at home <span lang="es">· Para hablar en casa</span>`}</h3>
            <p>${focus.family.en}</p>
            <p lang="es">${focus.family.es}</p>
          </section>
        </aside>
      </div>`,
  };
}
