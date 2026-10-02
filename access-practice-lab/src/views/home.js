// Home: one screen — band, the four skill rooms with a "Next" button each,
// this week's Road to ACCESS stop, and doors to tests, passport and families.
import { bandSwitchHTML, ringHTML } from "../components.js";
import { bandDomains, bandRows, loadRoad, loadShared } from "../content.js";
import { allRecords, loadRecord, weekStreak } from "../store.js";
import {
  BASE,
  CORE_DOMAINS,
  DOMAIN_META,
  TIERS,
  bandLabel,
  formatDate,
  html,
  todayISO,
  raw,
} from "../util.js";
import { buildPracticePlan } from "../practice-plan.js";
import { currentWeek } from "./road.js";

export function tierFor(ctx, domain, levels) {
  const t = ctx.prefs.tiers?.[domain];
  return levels?.[t] ? t : levels?.A ? "A" : Object.keys(levels || {})[0];
}

export function nextActivity(band, domain, level, rows) {
  const done = new Set(loadRecord(band, domain, level).complete);
  const next = rows.find((r) => !done.has(r[0]));
  return { done: rows.filter((r) => done.has(r[0])).length, total: rows.length, next };
}

function daysUntil(iso) {
  const ms = new Date(`${iso}T08:00:00`) - new Date(`${todayISO()}T08:00:00`);
  return Math.round(ms / 86400000);
}

export async function render(ctx) {
  const band = ctx.band;
  const [domains, road, shared] = await Promise.all([
    bandDomains(band),
    loadRoad(),
    loadShared().catch(() => ({})),
  ]);
  const rows = await bandRows(band);
  const settings = ctx.prefs.practicePlan || {};
  const records = new Map();
  const plan = buildPracticePlan(rows, { ...settings, tiers: ctx.prefs.tiers }, (r) => {
    const key = `${r.domain}:${r.level}`;
    if (!records.has(key)) records.set(key, loadRecord(band, r.domain, r.level));
    return records.get(key);
  });
  const playlist = `${BASE}/play?${new URLSearchParams({ ids: plan.map((r) => r.id).join(","), t: "My language practice", grades: band })}`;
  const option = (value, label, selected) =>
    html`<option value="${value}" ${selected === value ? raw("selected") : ""}>${label}</option>`;
  const focus = CORE_DOMAINS.includes(settings.focus) ? settings.focus : "balanced";
  const level = ["A", "B", "C"].includes(settings.level) ? settings.level : "preferred";
  const count = [2, 4, 6].includes(Number(settings.count)) ? Number(settings.count) : 4;
  const week = currentWeek(road?.[band]);
  const stamps = allRecords()
    .filter((r) => r.band === band)
    .reduce((n, r) => n + r.record.complete.length, 0);
  const streak = weekStreak();
  const win = shared.testWindow;
  const until = win ? daysUntil(win.start) : null;

  const tiles = CORE_DOMAINS.filter((d) => domains[d]).map((d) => {
    const meta = DOMAIN_META[d];
    const levels = domains[d].levels;
    const tier = tierFor(ctx, d, levels);
    const { done, total, next } = nextActivity(band, d, tier, levels[tier].activities);
    const href = next ? `${BASE}/${d}/${tier}/${next[0]}` : `${BASE}/${d}/${tier}`;
    return html`<article class="room-tile" style="--room:${domains[d].color}">
      <a class="room-head" href="${BASE}/${d}/${tier}">
        <span class="room-glyph" aria-hidden="true">${meta.glyph}</span>
        <span class="room-name"
          ><strong>${meta.room}</strong
          ><span>${TIERS[tier]?.name || tier} · ${done}/${total} done</span></span
        >
        ${ringHTML(done, total, { size: 46, label: `${meta.room}: ${done} of ${total} done` })}
      </a>
      ${
        next
          ? html`<a class="btn btn-room" href="${href}"
              ><span class="btn-kicker">Next up</span>${next[1]}</a
            >`
          : html`<a class="btn btn-room" href="${BASE}/${d}/${tier}"
              >⭐ Level complete — choose another</a
            >`
      }
    </article>`;
  });

  return {
    title: "",
    html: html`<section class="hero">
        <div class="hero-text">
          <p class="eyebrow">WIDA ACCESS practice · ${bandLabel(band)}</p>
          <h1 tabindex="-1">ACCESS Practice Lab</h1>
          <p class="lead">
            Build your English every day: listen, read, speak, and write.
            Short activities, useful supports, and time to try again.
          </p>
          ${bandSwitchHTML(band, ctx.bands)}
        </div>
        ${
          win && until != null && until >= -50
            ? html`<aside class="window-card" aria-label="ACCESS testing window">
                <span class="window-kicker">${win.state} ACCESS testing</span>
                <strong>${formatDate(win.start)} – ${formatDate(win.end)}</strong>
                <span
                  >${until > 0 ? `${until} days away` : until === 0 ? "Starts today" : "Testing is happening now"}</span
                >
              </aside>`
            : ""
        }
      </section>

      <section class="session-plan panel" aria-labelledby="sessionTitle">
        <div class="session-heading">
          <div><p class="eyebrow">A little practice, every day</p>
            <h2 id="sessionTitle">Make a practice plan</h2>
            <p>Choose your focus. We put unfinished work first, then activities to revisit, then something new.</p>
          </div>
          <a class="btn" href="${BASE}/library">Explore all activities →</a>
        </div>
        <div class="session-controls">
          <label class="field"><span>Skill focus</span><select id="planFocus" data-plan="focus" data-nsr-ignore>
            ${option("balanced", "Any skill · unfinished work first", focus)}
            ${CORE_DOMAINS.map((d) => option(d, d, focus))}
          </select></label>
          <label class="field"><span>Practice level</span><select id="planLevel" data-plan="level" data-nsr-ignore>
            ${option("preferred", "My chosen room levels", level)}
            ${option("A", "Starting · words and short sentences", level)}
            ${option("B", "Growing · connected ideas", level)}
            ${option("C", "Expanding · details and explanations", level)}
          </select></label>
          <label class="field"><span>Session length</span><select id="planCount" data-plan="count" data-nsr-ignore>
            ${[2, 4, 6].map((n) => option(String(n), `${n} activities`, String(count)))}
          </select></label>
        </div>
        <p class="fine">You can change levels any time. This plan uses practice saved on this device; it does not measure your English level.</p>
        <div aria-live="polite" aria-atomic="true" class="session-summary">${plan.length} activities ready${focus === "balanced" ? " · unfinished work first" : ` · ${focus}`}.</div>
        <ol class="session-list">
          ${plan.map(
            (r) => html`<li>
            <span class="session-domain">${r.domain} · ${TIERS[r.level].name}</span>
            <a href="${BASE}/${r.domain}/${r.level}/${r.id}">${r.title}</a>
            <span class="fine">${r.reason}</span>
          </li>`,
          )}
        </ol>
        <div class="row-actions">
          ${plan.length ? html`<a class="btn btn-primary" href="${playlist}">${plan[0].status === "draft" ? "Continue my practice" : "Start my practice"} →</a>` : html`<p>No activities match this plan. Try another skill or level.</p>`}
          <a href="${BASE}/passport">See my saved progress</a>
        </div>
      </section>

      ${
        week
          ? html`<section class="road-strip" aria-labelledby="roadStripTitle">
              <div>
                <p class="eyebrow">Road to ACCESS · Week ${week.n} of 12</p>
                <h2 id="roadStripTitle">${week.taskType}: ${week.theme}</h2>
                <p>${week.focus}</p>
              </div>
              <a class="btn btn-primary" href="${BASE}/road/${week.n}">Open this week →</a>
            </section>`
          : ""
      }

      <section aria-labelledby="roomsTitle">
        <h2 id="roomsTitle" class="section-title">Choose a skill</h2>
        <div class="room-grid">${tiles}</div>
      </section>

      <section class="door-grid" aria-label="More">
        <a class="door" href="${BASE}/tests"
          ><span aria-hidden="true">🧪</span><strong>Practice tests</strong
          ><span>Full tests and short minis, with practice tools.</span></a
        >
        <a class="door" href="${BASE}/passport"
          ><span aria-hidden="true">🛂</span><strong>My Passport</strong
          ><span
            >${stamps}
            stamp${stamps === 1 ? "" : "s"}${streak ? ` · ${streak}-week streak` : ""}</span
          ></a
        >
        <a class="door" href="${BASE}/road"
          ><span aria-hidden="true">🗺️</span><strong>Road to ACCESS</strong
          ><span>A 12-week plan, one short stop a week.</span></a
        >
        <a class="door" href="${BASE}/family"
          ><span aria-hidden="true">🏠</span><strong>Families · Familias</strong
          ><span>How to help at home, in English and Spanish.</span></a
        >
        <a class="door" href="${BASE}/tools"
          ><span aria-hidden="true">🧰</span><strong>Test tools warm-up</strong
          ><span>Explore classroom practice tools and the official WIDA demo.</span></a
        >
      </section>
      <p class="disclaimer">
        Original classroom practice inspired by WIDA ACCESS. It is not an official WIDA test, score,
        or placement. Teachers: <a href="/access-teacher/">open the Teacher Hub</a>.
      </p>`,
  };
}

export function onChange(e, ctx) {
  const key = e.target.dataset.plan;
  if (!["focus", "level", "count"].includes(key)) return;
  ctx.setPrefs({ practicePlan: { ...ctx.prefs.practicePlan, [key]: e.target.value } });
  ctx.rerender();
}
