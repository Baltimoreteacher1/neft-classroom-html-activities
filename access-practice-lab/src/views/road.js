// Road to ACCESS: a 12-week plan, one stop a week (a playlist of one activity
// per skill + a family talk prompt). The current week is picked from today's date.
import { bandSwitchHTML, crumbsHTML, domainGlyph } from "../components.js";
import { bandRows, loadRoad } from "../content.js";
import { loadRecord } from "../store.js";
import { BASE, bandLabel, formatDate, html, icon, todayISO } from "../util.js";
import { activityHref } from "./room.js";

export function currentWeek(plan) {
  const weeks = plan?.weeks || [];
  if (!weeks.length) return null;
  const today = todayISO();
  let pick = weeks[0];
  for (const w of weeks) if (w.start <= today) pick = w;
  return pick;
}

const playHref = (w, band) =>
  `${BASE}/play?ids=${w.activities.join(",")}&t=${encodeURIComponent(`Road to ACCESS · Week ${w.n}`)}&grades=${band}`;

const minutesOf = (a) => Number(a.minutes) || parseInt(a.time, 10) || 8;

export async function render(ctx) {
  const band = ctx.band;
  const [road, rows] = await Promise.all([loadRoad(), bandRows(band)]);
  const plan = road?.[band];
  if (!plan?.weeks?.length)
    return {
      title: "Road to ACCESS",
      html: html`<section class="panel">
        <h1 tabindex="-1">Road to ACCESS</h1>
        <p>The weekly plan for ${bandLabel(band)} is coming soon.</p>
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
          <strong>Week ${w.n}${done ? html`<span class="visually-hidden"> · all activities finished</span>` : ""}</strong>
          <span class="rd-type">${w.taskType}</span>
          <span class="rd-theme">${w.theme}</span>
          <span class="rd-date">${formatDate(w.start)}</span>
        </span>
        ${isNow ? html`<span class="rd-here">This week</span>` : ""}
      </a>
    </li>`;
  };
  const acts = weekActs(focus);
  const minutes = acts.reduce((sum, a) => sum + minutesOf(a), 0);
  const prev = plan.weeks.find((w) => w.n === focus.n - 1);
  const next = plan.weeks.find((w) => w.n === focus.n + 1);
  return {
    title: `Road to ACCESS · Week ${focus.n}`,
    html: html`${crumbsHTML([
        ["Lab", `${BASE}/`],
        ["Road to ACCESS", null],
      ])}
      <section class="prog-hero rd-hero">
        <div class="prog-hero-copy">
          <p class="eyebrow">${icon("road")} ${bandLabel(band)} · 12-week classroom practice plan</p>
          <h1 tabindex="-1">Road to ACCESS</h1>
          <p class="lead">
            A weekly playlist with a language goal and something to talk about at home.
            Family week has two activities. Some weeks include a supported stretch or a familiar review.
          </p>
          ${bandSwitchHTML(band, ctx.bands)}
        </div>
        <div class="rd-summary" role="group" aria-label="Plan progress">
          <p class="rd-summary-n"><strong>${weeksDone}</strong> of ${plan.weeks.length} weeks finished</p>
          <div class="bar" aria-hidden="true"><i style="width:${Math.round((weeksDone / plan.weeks.length) * 100)}%"></i></div>
          <p class="fine">A week is finished when all of its activities are done on this device. This counts practice, not language level.</p>
          ${now ? html`<a class="btn btn-primary" href="${BASE}/road/${now.n}?grades=${band}">Go to this week (Week ${now.n}) ${icon("arrow-right")}</a>` : ""}
        </div>
      </section>
      <h2 class="prog-heading">The 12-week plan</h2>
      <ol class="rd-map">
        ${plan.weeks.map(stop)}
      </ol>
      <div class="rd-detail">
        <section class="panel rd-week" aria-labelledby="weekTitle">
          <p class="eyebrow">
            Week ${focus.n} · starts
            ${formatDate(focus.start, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h2 id="weekTitle">${focus.taskType}: ${focus.theme}</h2>
          <p>${focus.focus}</p>
          <p class="fine">About ${minutes} minutes for ${acts.length} activities, plus family conversation. Take breaks as needed.</p>
          <ol class="rd-acts">
            ${acts.map(
              (a) =>
                html`<li class="d-${a.domain.toLowerCase()} ${isDone(a.id) ? "is-done" : ""}">
                  <a href="${activityHref(a.domain, a.level, a.id)}?grades=${band}">
                    <span class="prog-tile">${domainGlyph(a.domain)}</span>
                    <span class="rd-act-body"><strong>${a.title}</strong><span class="rd-act-meta">${a.domain} · ${minutesOf(a)} min</span><span class="fine">${focus.activityRationale?.[a.id] || a.skill}</span></span>
                    <span class="rd-tick ${isDone(a.id) ? "is-on" : ""}">${isDone(a.id) ? html`${icon("check")} Done` : "Not yet"}</span>
                  </a>
                </li>`,
            )}
          </ol>
          <nav class="rd-step" aria-label="Move between weeks">
            ${prev ? html`<a class="btn small" href="${BASE}/road/${prev.n}?grades=${band}">${icon("arrow-left")} Week ${prev.n}</a>` : html`<span></span>`}
            ${next ? html`<a class="btn small" href="${BASE}/road/${next.n}?grades=${band}">Week ${next.n} ${icon("arrow-right")}</a>` : ""}
          </nav>
        </section>
        <aside class="rd-aside" aria-label="This week's tools">
          <section class="rd-card">
            <h3>${icon("play")} Start the week</h3>
            <a class="btn btn-primary" href="${playHref(focus, band)}">${icon("play")} Play this week in order</a>
            <button type="button" class="btn small" data-copy="${BASE}/road/${focus.n}?grades=${band}">
              ${icon("copy")} Copy this week's link
            </button>
          </section>
          <section class="rd-card rd-family">
            <h3>${icon("families")} Talk at home <span lang="es">· Para hablar en casa</span></h3>
            <p>${focus.family.en}</p>
            <p lang="es">${focus.family.es}</p>
          </section>
        </aside>
      </div>`,
  };
}
