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
  testingWindowPhase,
  raw,
} from "../util.js";
import { estimateMinutes } from "../learning.js";
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
  const windowPhase = testingWindowPhase(win);

  const tiles = CORE_DOMAINS.filter((d) => domains[d]).map((d) => {
    const meta = DOMAIN_META[d];
    const levels = domains[d].levels;
    const tier = tierFor(ctx, d, levels);
    const { done, total, next } = nextActivity(band, d, tier, levels[tier].activities);
    const href = next ? `${BASE}/${d}/${tier}/${next[0]}?grades=${band}` : `${BASE}/${d}/${tier}?grades=${band}`;
    return html`<article class="room-tile" style="--room:${domains[d].color}">
      <a class="room-head" href="${BASE}/${d}/${tier}?grades=${band}">
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
          : html`<a class="btn btn-room" href="${BASE}/${d}/${tier}?grades=${band}"
              >⭐ Level complete — choose another</a
            >`
      }
    </article>`;
  });

  return {
    title: "",
    html: html`<section class="hero home-hero">
        <div class="hero-text">
          <p class="eyebrow">WIDA ACCESS practice · ${bandLabel(band)}</p>
          <h1 tabindex="-1">ACCESS Practice Lab</h1>
          <p class="lead">
            Listen, read, speak, and write. Start a short session with useful supports and time to try again.
          </p>
          ${bandSwitchHTML(band, ctx.bands)}
        </div>
        ${
          windowPhase
            ? html`<aside class="window-card" aria-label="ACCESS testing window">
                <span class="window-kicker">${win.state} ACCESS testing</span>
                <strong>${formatDate(win.start, { month: "short", day: "numeric", year: "numeric" })} – ${formatDate(win.end, { month: "short", day: "numeric", year: "numeric" })}</strong>
                <span
                  >${windowPhase.phase === "upcoming" ? `${windowPhase.daysAway} days away` : windowPhase.phase === "starting" ? "Starts today" : "Testing is happening now"}</span
                >
                <span>Your school chooses your testing days.</span>
                <a href="${win.source || "https://wida.wisc.edu/about/consortium/md"}">Official testing window</a>
              </aside>`
            : ""
        }
      </section>

      <section class="session-plan panel" aria-labelledby="sessionTitle">
        <div class="session-heading">
          <div><p class="eyebrow">A little practice, every day</p>
            <h2 id="sessionTitle">Your next practice</h2>
            <p class="session-summary" aria-live="polite">${plan.length} activities · about ${estimateMinutes(plan)} minutes${focus === "balanced" ? "" : ` · ${focus}`}</p>
          </div>
          ${plan.length ? html`<a class="btn btn-primary" href="${playlist}">${plan[0].status === "draft" ? "Continue my practice" : "Start today’s practice"} →</a>` : html`<p>No activities match. Change your plan below.</p>`}
        </div>
        <details id="planOptions" class="session-options"><summary>Change my plan or see activities</summary>
        <div class="session-controls">
          <label class="field"><span>Skill focus</span><select id="planFocus" data-plan="focus" data-nsr-ignore>
            ${option("balanced", "Any skill · unfinished work first", focus)}
            ${CORE_DOMAINS.map((d) => option(d, d, focus))}
          </select></label>
          <label class="field"><span>Support choice</span><select id="planLevel" data-plan="level" data-nsr-ignore>
            ${option("preferred", "My chosen room supports", level)}
            ${option("A", "Starting · words and short sentences", level)}
            ${option("B", "Growing · connected ideas", level)}
            ${option("C", "Expanding · details and explanations", level)}
          </select></label>
          <label class="field"><span>Session length</span><select id="planCount" data-plan="count" data-nsr-ignore>
            ${[2, 4, 6].map((n) => option(String(n), `${n} activities`, String(count)))}
          </select></label>
        </div>
        <p class="fine">Starting: name and describe with words or short sentences. Growing: connect ideas. Expanding: explain with details. These choices change tasks and scaffolds; they are not WIDA scores. Change support any time.</p>
        <p class="fine">This browser’s saved practice puts unfinished work first, then retries, then new activities. On a shared device, check that the saved work is yours.</p>
        <ol class="session-list">
          ${plan.map(
            (r) => html`<li>
            <span class="session-domain">${r.domain} · ${TIERS[r.level].name}</span>
            <a href="${BASE}/${r.domain}/${r.level}/${r.id}?grades=${band}">${r.title}</a>
            <span class="fine">${r.reason} · about ${estimateMinutes([r])} minutes</span>
          </li>`,
          )}
        </ol>
        </details>
        <div class="row-actions"><a href="${BASE}/passport?grades=${band}">See my saved progress</a><a href="${BASE}/library?grades=${band}">Explore all activities</a></div>
      </section>

      <section aria-labelledby="roomsTitle">
        <h2 id="roomsTitle" class="section-title">Choose a skill</h2>
        <div class="room-grid">${tiles}</div>
      </section>

      ${
        week
          ? html`<section class="road-strip" aria-labelledby="roadStripTitle">
              <div>
                <p class="eyebrow">Road to ACCESS · Week ${week.n} of 12</p>
                <h2 id="roadStripTitle">${week.taskType}: ${week.theme}</h2>
                <p>${week.focus}</p>
              </div>
              <a class="btn btn-primary" href="${BASE}/road/${week.n}?grades=${band}">Open this week →</a>
            </section>`
          : ""
      }

      <section class="door-grid" aria-label="More">
        <a class="door" href="${BASE}/tests?grades=${band}"
          ><span aria-hidden="true">🧪</span><strong>Practice tests</strong
          ><span>Full tests and short minis, with practice tools.</span></a
        >
        <a class="door" href="${BASE}/passport?grades=${band}"
          ><span aria-hidden="true">🛂</span><strong>My Passport</strong
          ><span
            >${stamps}
            stamp${stamps === 1 ? "" : "s"}${streak ? ` · ${streak}-week streak` : ""}</span
          ></a
        >
        <a class="door" href="${BASE}/road?grades=${band}"
          ><span aria-hidden="true">🗺️</span><strong>Road to ACCESS</strong
          ><span>A 12-week plan, one short stop a week.</span></a
        >
        <a class="door" href="${BASE}/family?grades=${band}"
          ><span aria-hidden="true">🏠</span><strong>Families · Familias</strong
          ><span>How to help at home, in English and Spanish.</span></a
        >
        <a class="door" href="${BASE}/tools?grades=${band}"
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
  const id = e.target.id;
  const open = document.getElementById("planOptions")?.open;
  ctx.rerender().then(() => {
    const disclosure = document.getElementById("planOptions");
    if (disclosure) disclosure.open = open;
    document.getElementById(id)?.focus({ preventScroll: true });
  });
}
