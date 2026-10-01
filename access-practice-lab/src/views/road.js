// Road to ACCESS: a 12-week plan, one stop a week (a playlist of one activity
// per skill + a family talk prompt). The current week is picked from today's date.
import { bandSwitchHTML, crumbsHTML, domainGlyph } from "../components.js";
import { bandRows, loadRoad } from "../content.js";
import { loadRecord } from "../store.js";
import { BASE, bandLabel, formatDate, html, todayISO } from "../util.js";
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
  const stop = (w) => {
    const acts = w.activities.map((id) => byId.get(id)).filter(Boolean);
    const n = acts.filter((a) => isDone(a.id)).length;
    return html`<li
      class="stop ${w.n === now?.n ? "is-now" : ""} ${w.n === focus.n ? "is-open" : ""} ${n === acts.length && acts.length ? "is-done" : ""}"
    >
      <a
        class="stop-head"
        href="${BASE}/road/${w.n}"
        aria-current="${w.n === focus.n ? "step" : "false"}"
      >
        <span class="stop-n">${n === acts.length && acts.length ? "✓" : w.n}</span>
        <span
          ><strong>Week ${w.n} · ${w.taskType}</strong
          ><span>${w.theme} · ${formatDate(w.start)}</span></span
        >
      </a>
    </li>`;
  };
  const acts = focus.activities.map((id) => byId.get(id)).filter(Boolean);
  return {
    title: `Road to ACCESS · Week ${focus.n}`,
    html: html`${crumbsHTML([
        ["Lab", `${BASE}/`],
        ["Road to ACCESS", null],
      ])}
      <section class="room-hero">
        <div>
          <p class="eyebrow">${bandLabel(band)} · 12 weeks to test day</p>
          <h1 tabindex="-1">🗺️ Road to ACCESS</h1>
          <p class="lead">
            One stop a week: one activity in each skill, plus something to talk about at home. About
            30 minutes.
          </p>
          ${bandSwitchHTML(band, ctx.bands)}
        </div>
      </section>
      <div class="road-layout">
        <ol class="road">
          ${plan.weeks.map(stop)}
        </ol>
        <section class="panel week-panel" aria-labelledby="weekTitle">
          <p class="eyebrow">
            Week ${focus.n} · starts
            ${formatDate(focus.start, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h2 id="weekTitle">${focus.taskType}: ${focus.theme}</h2>
          <p>${focus.focus}</p>
          <ol class="week-acts">
            ${acts.map(
              (a) =>
                html`<li class="${isDone(a.id) ? "is-done" : ""}">
                  <a href="${activityHref(a.domain, a.level, a.id)}"
                    ><span aria-hidden="true">${domainGlyph(a.domain)}</span
                    ><span><strong>${a.title}</strong><span>${a.domain}</span></span
                    ><span class="tick">${isDone(a.id) ? "✓" : ""}</span></a
                  >
                </li>`,
            )}
          </ol>
          <a class="btn btn-primary" href="${playHref(focus, band)}">▶ Play this week in order</a>
          <div class="family-box">
            <h3>🏠 Talk at home <span lang="es">· Para hablar en casa</span></h3>
            <p>${focus.family.en}</p>
            <p lang="es">${focus.family.es}</p>
          </div>
          <button
            type="button"
            class="ghost small"
            data-copy="${BASE}/road/${focus.n}?grades=${band}"
          >
            🔗 Copy this week's link
          </button>
        </section>
      </div>`,
  };
}
