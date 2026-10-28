// Home: one screen — band, the four skill rooms with a "Next" button each,
// this week's Road to ACCESS stop, and doors to tests, passport and families.
import { bandSwitchHTML } from "../components.js";
import { bandDomains, bandRows, loadRoad, loadShared } from "../content.js";
import { allRecords, loadRecord, weekStreak } from "../store.js";
import { practiceSummary } from "../practice-report.js";
import {
  ART,
  BASE,
  CORE_DOMAINS,
  DOMAIN_META,
  TIERS,
  bandLabel,
  formatDate,
  html,
  icon,
  testingWindowPhase,
  raw,
} from "../util.js";
import { estimateMinutes } from "../learning.js";
import { loadStudioIndex } from "../content.js";
import { recommendTasks } from "../lang/adapt.js";
import { filterByKeyUse, KEY_LANGUAGE_USES, KLU_DOMAINS, kluReference } from "../lang/purpose.js";
import { loadLedger } from "../lang/ledger.js";
import { loadStudio } from "../lang/studio.js";
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

const reviewHref = (item, plan, band, ctx) => {
  const row = plan.find((r) => r.review?.key === item.key);
  if (row) return `${BASE}/${row.domain}/${row.level}/${row.id}?grades=${band}`;
  if (item.kind === "pattern") return `${BASE}/detective/${item.id}?grades=${band}`;
  if (item.domain === "Speaking") return `${BASE}/speak?grades=${band}`;
  if (item.domain === "Writing") return `${BASE}/write?grades=${band}`;
  return `${BASE}/${item.domain}/${ctx.prefs.tiers?.[item.domain] || "A"}?grades=${band}`;
};

function reviewHTML(due, plan, band, ctx) {
  return html`<section class="panel review-due" aria-labelledby="reviewTitle">
    <h2 id="reviewTitle">Due for spaced review</h2>
    <p class="fine">Quick checks spaced 1, 3, 7 and 14 days apart help you keep what you practiced. Each reason comes from your saved work on this device.</p>
    <ul class="evidence-list">
      ${due.map((item) => html`<li>
        <span><a href="${reviewHref(item, plan, band, ctx)}">${item.kind === "pattern" ? `Pattern: ${item.name}` : item.name}</a> · ${item.domain}</span>
        <span class="fine"><strong>Why this is recommended:</strong> ${item.reason}</span>
      </li>`)}
    </ul>
    <p class="fine"><a href="${BASE}/growth?grades=${band}#supportChoiceTitle">Choose how much support you get</a></p>
  </section>`;
}

function kluHTML(ctx, band, rows, idx) {
  const klu = KEY_LANGUAGE_USES.includes(ctx.prefs.kluFocus) ? ctx.prefs.kluFocus : "";
  const ref = klu ? kluReference(klu, band) : null;
  const studioTasks = [...(idx?.speaking || []).map((t) => ({ ...t, domain: "Speaking" })), ...(idx?.writing || []).map((t) => ({ ...t, domain: "Writing" }))].filter((t) => !t.band || t.band === band);
  const practice = (domain) => {
    if (domain === "Speaking" || domain === "Writing")
      return filterByKeyUse(studioTasks, klu, domain).slice(0, 3).map((t) => [`${BASE}/${domain === "Speaking" ? "speak" : "write"}/${t.id}?grades=${band}`, t.title]);
    const tier = ctx.prefs.tiers?.[domain] || "A";
    return filterByKeyUse(rows.filter((r) => r.domain === domain && r.level === tier), klu, domain).slice(0, 3).map((r) => [`${BASE}/${domain}/${r.level}/${r.id}?grades=${band}`, r.title]);
  };
  const missions = klu ? filterByKeyUse((idx?.missions || []).filter((m) => !m.band || m.band === band), klu) : [];
  return html`<section class="panel klu-practice" aria-labelledby="kluTitle">
    <p class="eyebrow">Practice by Key Language Use</p>
    <h2 id="kluTitle">What do you want your language to do?</h2>
    <div class="sort-cats" role="group" aria-label="Key Language Use">
      ${KEY_LANGUAGE_USES.map((k) => html`<button type="button" class="cat-chip" id="klu-${k}" data-klu="${k}" aria-pressed="${k === klu ? "true" : "false"}">${k}</button>`)}
    </div>
    ${ref ? html`<p>${ref.purpose}</p>
      <div class="domain-grid">
        <div class="card"><h3>How it is organized</h3><ol>${ref.moves.map((m) => html`<li>${m}</li>`)}</ol></div>
        <div class="card"><h3>Language functions</h3><ul>${ref.functions.map((m) => html`<li>${m}</li>`)}</ul></div>
        <div class="card"><h3>Signal words</h3><p>${ref.signals.join(" · ")}</p></div>
      </div>
      <div class="domain-grid">
        ${KLU_DOMAINS.map((d) => {
          const links = practice(d);
          return html`<div class="card"><h3>${d}</h3><p class="fine">${ref.domains[d]}</p>${links.length ? html`<ul>${links.map(([href, title]) => html`<li><a href="${href}">${title}</a></li>`)}</ul>` : html`<p class="fine">No ${klu} activity at your ${d} support right now. <a href="${BASE}/library?grades=${band}">Find one in the library</a>.</p>`}</div>`;
        })}
      </div>
      ${missions.length ? html`<p class="fine">Missions that use ${klu}: ${missions.map((m, i) => html`${i ? " · " : ""}<a href="${BASE}/missions/${m.id}?grades=${band}">${m.title}</a>`)}</p>` : ""}
      <p class="fine">Reference for grades ${ref.band.replace("-", "–")}, in the lab's own words. Choose the same button again to close it.</p>`
    : html`<p class="fine">Choose Narrate, Inform, Explain or Argue to see how that kind of language is organized, its signal words, and practice in listening, reading, speaking and writing.</p>`}
  </section>`;
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
  const ledger = loadLedger();
  const bandRecords = allRecords().filter((r) => r.band === band);
  const review = {
    entries: ledger.entries.filter((e) => e.band === band),
    records: Object.fromEntries(bandRecords.map((r) => [`${r.domain}:${r.level}`, { domain: r.domain, results: r.record.results }])),
  };
  const plan = buildPracticePlan(rows, { ...settings, tiers: ctx.prefs.tiers, review }, (r) => {
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
  const stamps = bandRecords.reduce((n, r) => n + r.record.complete.length, 0);
  const due = plan.due || [];
  const streak = weekStreak();
  const win = shared.testWindow;
  const studio = loadStudio();
  const open = Object.entries(studio.missions).find(([, m]) => m.started && !m.done);
  const idx = await loadStudioIndex().catch(() => null);
  let next = null;
  if (open) next = { href: `${BASE}/missions/${open[0]}?grades=${band}`, title: "Continue your mission", why: "Pick up where you left off." };
  else {
    const pool = [...(idx?.speaking || []), ...(idx?.writing || [])].filter((t) => t.band === band);
    const rec = recommendTasks(pool, ledger.entries, { band, n: 1 })[0];
    if (rec) next = { href: `${BASE}/${rec.task.taskType ? "speak" : "write"}/${rec.task.id}?grades=${band}`, title: rec.task.title, why: `${rec.task.taskType ? "Speaking" : "Writing"} · ${rec.why}` };
  }
  const windowPhase = testingWindowPhase(win);

  const tiles = CORE_DOMAINS.filter((d) => domains[d]).map((d) => {
    const meta = DOMAIN_META[d];
    const levels = domains[d].levels;
    const tier = tierFor(ctx, d, levels);
    const { done, total, next } = nextActivity(band, d, tier, levels[tier].activities);
    const record = loadRecord(band, d, tier);
    const { status } = practiceSummary(record.results, done, total);
    const statusClass = status.toLowerCase().replace(/\s+/g, "-");
    const roomHref = `${BASE}/${d}/${tier}?grades=${band}`;
    const href = next ? `${BASE}/${d}/${tier}/${next[0]}?grades=${band}` : roomHref;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return html`<article class="room-tile d-${d.toLowerCase()}">
      <a class="room-art" href="${roomHref}" tabindex="-1" aria-hidden="true"
        ><img src="${ART}/domain-${d.toLowerCase()}.svg" width="480" height="360" alt="" loading="lazy" decoding="async"
      /></a>
      <div class="room-body">
        <h3 class="room-name"><a class="room-link" href="${roomHref}">${meta.name}</a></h3>
        <p class="room-blurb">${meta.blurb}</p>
          <span class="practice-status is-${statusClass}">${status}</span>
        <div class="room-progress">
          <div class="bar" role="img" aria-label="${meta.name}: ${done} of ${total} activities done"><i style="width:${pct}%"></i></div>
          <p class="fine">${done} of ${total} done · ${TIERS[tier]?.name || tier} support</p>
        </div>
        ${
          next
            ? html`<a class="btn btn-room" href="${href}">${done ? `Continue ${meta.name.toLowerCase()}` : `Start ${meta.name.toLowerCase()}`}${icon("arrow-right")}</a>
                <p class="room-next fine">Next: ${next[1]}</p>`
            : html`<a class="btn btn-room" href="${roomHref}">Level complete — choose another${icon("arrow-right")}</a>`
        }
      </div>
    </article>`;
  });

  const studioLink = (id, ic, title, text) =>
    html`<a class="studio-card" href="${BASE}/${id}?grades=${band}">${icon(ic)}<span><strong>${title}</strong><span>${text}</span></span></a>`;
  const tool = (id, ic, title, text) =>
    html`<a class="tool-row" href="${id.startsWith("/") ? id : `${BASE}/${id}?grades=${band}`}">${icon(ic)}<span><strong>${title}</strong><span>${text}</span></span></a>`;
  const worldCard = (id, title, text, color, domain) =>
    html`<a class="world-mini-card" href="${BASE}/worlds/${id}?grades=${band}" style="--world:${color}"><img src="${BASE}/pictures/worlds/${id}.svg" alt="" width="96" height="70" loading="lazy" /><span><strong>${title}</strong><span>${domain} · ${text}</span></span></a>`;

  return {
    title: "",
    html: html`<section class="home-hero" aria-labelledby="homeTitle">
        <div class="hero-copy">
          <p class="eyebrow">ACCESS Practice Lab · ${bandLabel(band)}</p>
          ${bandSwitchHTML(band, ctx.bands)}
          <h1 id="homeTitle" tabindex="-1"><span class="w-listening">Listen.</span> <span class="w-reading">Read.</span> <span class="w-speaking">Speak.</span> <span class="w-writing">Write.</span></h1>
          <p class="lead">Short practice sessions for multilingual learners, with supports you choose and time to try again.</p>
          <div class="session-heading">
            ${
              plan.length
                ? html`<a class="btn btn-primary btn-big" href="${playlist}">${plan[0].status === "draft" ? "Continue my practice" : "Start practicing"}${icon("arrow-right")}</a>
                    <a class="btn btn-big" href="#skills">Choose a skill</a>`
                : html`<a class="btn btn-big" href="#skills">Choose a skill</a>`
            }
          </div>
          <p class="session-summary" aria-live="polite">${plan.length ? `${plan.length} activities · about ${estimateMinutes(plan)} minutes${focus === "balanced" ? "" : ` · ${focus}`}` : "No activities match your plan. Change it below."}</p>
        </div>
        <div class="hero-art"><img src="${ART}/hero.svg" width="720" height="600" alt="Four tiles for listening, reading, speaking and writing, linked by a speech bubble" decoding="async" fetchpriority="high" /></div>
      </section>

      ${
        windowPhase
          ? html`<aside class="window-card" aria-label="ACCESS testing window">
              ${icon("calendar")}
              <p><strong>${win.state} ACCESS testing: ${formatDate(win.start, { month: "short", day: "numeric", year: "numeric" })} – ${formatDate(win.end, { month: "short", day: "numeric", year: "numeric" })}</strong>
              <span>${windowPhase.phase === "upcoming" ? `${windowPhase.daysAway} days away` : windowPhase.phase === "starting" ? "Starts today" : "Testing is happening now"}. Your school chooses your testing days.</span></p>
              <a href="${win.source || "https://wida.wisc.edu/about/consortium/md"}">Official testing window</a>
            </aside>`
          : ""
      }

      <div class="home-today">
        <section class="session-plan panel" aria-labelledby="sessionTitle">
          <div class="plan-head">
            <h2 id="sessionTitle">Today's practice</h2>
            <p class="fine">${plan.length ? `${plan.length} activities, about ${estimateMinutes(plan)} minutes. Unfinished work comes first.` : "Change your plan to see activities."}</p>
          </div>
          <ol class="plan-preview">
            ${plan.slice(0, 3).map((r) => html`<li><span class="plan-dot d-${r.domain.toLowerCase()}">${icon(DOMAIN_META[r.domain]?.icon || "star")}</span><span><a href="${BASE}/${r.domain}/${r.level}/${r.id}?grades=${band}">${r.title}</a><span class="fine">${r.domain} · ${r.reason}</span></span></li>`)}
          </ol>
          <details id="planOptions" class="session-options"><summary>Change my plan or see all activities</summary>
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
        </section>
        <aside class="today-side" aria-label="Your next step">
          ${next ? html`<a class="next-step" href="${next.href}"><span class="eyebrow">Your next step</span><strong>${next.title}</strong><span class="fine">${next.why}</span><span class="next-go">${icon("arrow-right")}</span></a>` : ""}
          <a class="progress-note" href="${BASE}/passport?grades=${band}">${icon("passport")}<span><strong>${stamps ? `${stamps} activit${stamps === 1 ? "y" : "ies"} finished` : "Your Passport is empty"}</strong><span class="fine">${stamps ? `${streak ? `${streak}-week practice streak. ` : ""}See your saved work.` : "Finish an activity and it is saved here, on this device."}</span></span></a>
        </aside>
      </div>

      ${due.length ? reviewHTML(due, plan, band, ctx) : ""}

      <section class="skills" id="skills" aria-labelledby="roomsTitle">
        <div class="section-head"><h2 id="roomsTitle">Choose a skill</h2><p class="fine">Each skill has three support levels. Start at Starting and move on when you are ready.</p></div>
        <div class="room-grid">${tiles}</div>
      </section>

      <section class="more-ways" aria-labelledby="moreTitle">
        <div class="section-head"><h2 id="moreTitle">More ways to practice</h2><p class="fine">Do real language tasks, get specific feedback, revise, then try it on your own.</p></div>
        <div class="studio-grid">
          ${studioLink("speak", "speaking", "Speaking Studio", "Plan, record, listen back, and say it better.")}
          ${studioLink("write", "writing", "Writing Studio", "Use sources, draft, get feedback, revise.")}
          ${studioLink("reading-room", "reading", "Reading Room", "Choose a text, annotate evidence, and keep your place.")}
          ${studioLink("missions", "mission", "Academic missions", "Listen, read, decide, speak and write in one investigation.")}
          ${studioLink("detective", "detective", "Error Detective", "Find a pattern in your work and fix it for good.")}
          ${studioLink("vocabulary", "words", "Word Builder", "Prefixes, roots, and academic words in context.")}
        </div>
        ${kluHTML(ctx, band, rows, idx)}
      </section>

      <section class="world-showcase" aria-labelledby="worldEntryTitle">
        <div class="world-copy">
          <h2 id="worldEntryTitle">Language Worlds</h2>
          <p>Step into four places where language has consequences: dispatch audio, investigate with evidence, join a dialogue, and publish your story.</p>
          <a class="btn" href="${BASE}/worlds?grades=${band}">Open Language Worlds${icon("arrow-right")}</a>
        </div>
        <div class="world-cards-grid">
          ${worldCard("signal-station", "Signal Station", "Audio dispatch", "var(--listening)", "Listening")}
          ${worldCard("evidence-city", "Evidence City", "Investigations", "var(--reading)", "Reading")}
          ${worldCard("conversation-quest", "Conversation Quest", "Dialogue", "var(--speaking)", "Speaking")}
          ${worldCard("storyworks", "StoryWorks", "Publishing", "var(--writing)", "Writing")}
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
              <a class="btn btn-primary" href="${BASE}/road/${week.n}?grades=${band}">Open this week${icon("arrow-right")}</a>
            </section>`
          : ""
      }

      <section class="tools-band" aria-labelledby="toolsTitle">
        <h2 id="toolsTitle">Plan, check and share</h2>
        <div class="tool-grid">
          ${tool("tests", "tests", "Practice tests", "Full tests and short minis.")}
          ${tool("library", "library", "Find an activity", "Search every quick-practice activity.")}
          ${tool("road", "road", "Road to ACCESS", "A 12-week plan, one stop a week.")}
          ${tool("diagnostic", "checkin", "Skill check-in", "Optional 4-minute starting point.")}
          ${tool("growth", "growth", "My growth", "Evidence from your own work.")}
          ${tool("tools", "tools", "Test tools warm-up", "Audio check and the WIDA demo.")}
          ${tool("classroom", "classroom", "Whole-Class Studio", "Projector-ready routines.")}
          ${tool("launch-studio", "launch", "Launch Studio", "QR codes and direct links for teachers.")}
        </div>
      </section>`,
  };
}

export function onClick(e, ctx) {
  const btn = e.target.closest?.("[data-klu]");
  if (!btn) return false;
  const value = KEY_LANGUAGE_USES.includes(btn.dataset.klu) && ctx.prefs.kluFocus !== btn.dataset.klu ? btn.dataset.klu : "";
  ctx.setPrefs({ kluFocus: value });
  ctx.rerender().then(() => document.getElementById(btn.id)?.focus({ preventScroll: true }));
  return true;
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
