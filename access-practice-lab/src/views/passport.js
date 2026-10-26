// My Passport: stamps per skill, practice streak, milestones, a printable report,
// and a portable progress code (move progress to another device, no account).
// Everything shown here comes from saved records on this device. Stamps count finished activities;
// they are never a proficiency level, a mastery claim or an ACCESS score.
import { crumbsHTML, domainGlyph } from "../components.js";
import { isActivityComplete } from "../attempts.js";
import { evidenceLabel } from "../learning.js";
import { activityStatus } from "../practice-plan.js";
import * as audioStore from "../audio-store.js";
import { buildShare, encodeShare } from "../lang/share.js";
import { loadLedger } from "../lang/ledger.js";
import { loadStudio } from "../lang/studio.js";
import { downloadText } from "../studio-ui.js";
import { bandDomains, bandRows } from "../content.js";
import {
  clearAll,
  exportCode,
  getStudentName,
  importCode,
  loadRecord,
  practiceDays,
  setStudentName,
  weekStreak,
} from "../store.js";
import {
  ART,
  BASE,
  CORE_DOMAINS,
  DOMAIN_META,
  LEVEL_KEYS,
  TIERS,
  announce,
  bandLabel,
  formatDate,
  html,
  icon,
  raw,
  todayISO,
} from "../util.js";

const IGN = raw("data-nsr-ignore");
const RECENT_SHOWN = 6;
const CALENDAR_DAYS = 28;
const STATUS_WORD = { draft: "In progress", retry: "Try again" };

function badges(stats, streak, days, extra) {
  const total = stats.reduce((n, s) => n + s.done, 0);
  const all4 = stats.every((s) => s.done > 0);
  const doneIn = (d) => stats.find((s) => s.domain === d)?.done || 0;
  return [
    {
      on: total >= 1,
      icon: "star",
      name: "First stamp",
      how: "Finish any activity.",
    },
    {
      on: all4,
      icon: "grid",
      name: "All four skills",
      how: "Finish one activity in every skill.",
    },
    {
      on: total >= 10,
      icon: "medal",
      name: "Ten stamps",
      how: "Finish 10 activities.",
    },
    {
      on: total >= 30,
      icon: "launch",
      name: "Thirty stamps",
      how: "Finish 30 activities.",
    },
    {
      on: streak >= 3,
      icon: "calendar",
      name: "Three-week streak",
      how: "Practice three weeks in a row.",
    },
    {
      on: extra.recordings >= 3,
      icon: "record",
      name: "Brave speaker",
      how: "Record yourself speaking and check your language in 3 Speaking Studio tries.",
    },
    {
      on: extra.revised,
      icon: "retry",
      name: "Reviser",
      how: "Get feedback on a draft, change it, and ask again.",
    },
    {
      on: extra.independentWriting,
      icon: "flag",
      name: "On my own",
      how: "Write or speak a first attempt with no frames, word bank or model.",
    },
    {
      on: extra.sourceUse,
      icon: "bookmark",
      name: "Evidence user",
      how: "Use at least two pieces of evidence from a source in your own writing.",
    },
    {
      on: extra.patternClosed,
      icon: "detective",
      name: "Case closed",
      how: "Fix a pattern, then use it correctly in new writing.",
    },
    {
      on: extra.missionDone,
      icon: "mission",
      name: "Mission complete",
      how: "Finish all phases of an academic mission.",
    },
    {
      on: doneIn("Writing") >= 5,
      icon: "writing",
      name: "Strong writer",
      how: "Finish 5 writing activities.",
    },
    {
      on: days.length >= 10,
      icon: "clock",
      name: "Ten practice days",
      how: "Practice on 10 different days.",
    },
    {
      on: total >= 15,
      icon: "road",
      name: "Language Navigator",
      how: "Finish 15 activities.",
    },
    {
      on: doneIn("Reading") >= 5,
      icon: "reading",
      name: "Active Reader",
      how: "Finish 5 reading activities.",
    },
  ];
}

const domainClass = (d) => `d-${String(d).toLowerCase()}`;
const pctOf = (n, of) => (of ? Math.round((n / of) * 100) : 0);

function portfolioHTML(band, saved) {
  const work = saved.filter(
    (row) =>
      row.record.results[row.id] ||
      row.record.notes[row.id] ||
      row.record.reflections[row.id] ||
      row.record.attemptHistory?.[row.id]?.length,
  );
  return html`<section class="pass-portfolio">
    <div class="row-actions no-print">
      <a class="btn" href="${BASE}/passport?grades=${band}"
        >${icon("arrow-left")} Back to Passport</a
      ><button type="button" class="btn btn-primary" data-print>
        ${icon("print")} Print my portfolio
      </button>
    </div>
    <header class="pass-portfolio-head">
      <p class="eyebrow">
        ${bandLabel(band)} · ${getStudentName() || "My practice"}
      </p>
      <h1 tabindex="-1">My practice portfolio</h1>
      <p class="lead">
        Compare your drafts and describe what you changed. This is a record of
        practice, not a proficiency score. Audio is not included. Keep your
        printed work private.
      </p>
    </header>
    ${
      work.length
        ? work.map((row) => {
            const id = row.id,
              record = row.record;
            return html`<article
              class="pass-portfolio-entry ${domainClass(row.domain)}"
            >
              <h2>${row.title}</h2>
              <p class="pass-portfolio-meta">
                <span class="pass-pill"
                  >${domainGlyph(row.domain)} ${row.domain}</span
                >
                <span class="pass-pill">${TIERS[row.level].name}</span>
              </p>
              <p>
                <strong>Current evidence:</strong>
                ${record.results[id] ? evidenceLabel(record.results[id]) : "Draft saved · not yet reviewed"}
              </p>
              ${record.results[id]?.date ? html`<p>Last review: ${formatDate(String(record.results[id].date).slice(0, 10))}</p>` : ""}
              ${
                record.drafts[id]?.first
                  ? html`<h3>First draft</h3>
                      <p class="pass-portfolio-response">
                        ${record.drafts[id].first}
                      </p>`
                  : ""
              }
              ${
                record.notes[id]
                  ? html`<h3>
                        ${row.domain === "Speaking" ? "Planning notes" : "Current draft"}
                      </h3>
                      <p class="pass-portfolio-response">${record.notes[id]}</p>`
                  : ""
              }
              ${
                record.reflections[id]
                  ? html`<h3>What I improved or checked</h3>
                      <p class="pass-portfolio-response">
                        ${record.reflections[id]}
                      </p>`
                  : ""
              }
              ${
                record.attemptHistory?.[id]?.length
                  ? html`<h3>Earlier attempts</h3>
                      <p class="fine">
                        Up to five recent attempt summaries are kept.
                      </p>
                      <ul>
                        ${record.attemptHistory[id].map((attempt) => html`<li>${formatDate(String(attempt.date).slice(0, 10))} · ${evidenceLabel(attempt.result)}</li>`)}
                      </ul>`
                  : ""
              }
              <p class="no-print">
                <a
                  href="${BASE}/${row.domain}/${row.level}/${id}?grades=${band}"
                  >Review this activity</a
                >
              </p>
            </article>`;
          })
        : html`<div class="empty-state">
            <img src="${ART}/empty.svg" alt="" width="320" height="240" />
            <h2>No saved work yet</h2>
            <p>
              Your saved practice will appear here. Start an activity, then
              return to print your work.
            </p>
            <a class="btn btn-primary" href="${BASE}/?grades=${band}"
              >Choose an activity ${icon("arrow-right")}</a
            >
          </div>`
    }
  </section>`;
}

function domainCard(s, band) {
  const next = s.byLevel.find((l) => l.n < l.of);
  const target = next || s.byLevel[0];
  const name = DOMAIN_META[s.domain].room;
  return html`<article
    class="pass-domain ${domainClass(s.domain)}"
    aria-labelledby="pass-${s.domain}"
  >
    <header>
      <span class="pass-tile">${domainGlyph(s.domain)}</span>
      <div>
        <h2 id="pass-${s.domain}">${name}</h2>
        <p class="pass-count">
          <strong>${s.done}</strong> of ${s.total} activities finished
        </p>
      </div>
    </header>
    <div class="bar" aria-hidden="true">
      <i style="width:${pctOf(s.done, s.total)}%"></i>
    </div>
    <ul class="pass-levels">
      ${s.byLevel.map(
        (l) =>
          html`<li>
            <span class="pass-level-name">${TIERS[l.level].name}</span
            ><span class="bar mini" aria-hidden="true"
              ><i style="width:${pctOf(l.n, l.of)}%"></i></span
            ><span class="pass-level-n"
              >${l.n} of ${l.of}<span class="visually-hidden">
                stamps</span
              ></span
            >
          </li>`,
      )}
    </ul>
    ${target ? html`<a class="btn small pass-go" href="${BASE}/${s.domain}/${target.level}?grades=${band}">${next ? (s.done ? "Continue" : "Start") : "Review"} ${s.domain} ${icon("arrow-right")}</a>` : ""}
  </article>`;
}

function calendarHTML(days) {
  const marked = new Set(days);
  const cells = [];
  for (let i = CALENDAR_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = todayISO(d);
    cells.push({ iso, on: marked.has(iso), n: d.getDate(), today: i === 0 });
  }
  const count = cells.filter((c) => c.on).length;
  return html`<section class="pass-card" aria-labelledby="passCal">
    <h2 id="passCal">${icon("calendar")} Practice calendar</h2>
    <p class="fine">
      ${count ? `You practiced on ${count} of the last ${CALENDAR_DAYS} days.` : `No practice recorded in the last ${CALENDAR_DAYS} days.`}
      Each square is one day, oldest first.
    </p>
    <ol class="pass-cal">
      ${cells.map((c) => html`<li class="${c.on ? "is-on" : ""} ${c.today ? "is-today" : ""}"><span class="visually-hidden">${formatDate(c.iso, { weekday: "long", month: "long", day: "numeric" })}${c.today ? " (today)" : ""}: ${c.on ? "practiced" : "no practice"}</span><span aria-hidden="true">${c.n}</span></li>`)}
    </ol>
    ${days.length ? html`<p class="fine">Last practice: ${formatDate(days[0], { weekday: "long", month: "long", day: "numeric" })}</p>` : ""}
  </section>`;
}

function continueHTML(saved, band) {
  const open = saved
    .map((row) => ({ row, status: activityStatus(row.record, row.id) }))
    .filter((x) => x.status === "draft" || x.status === "retry")
    .slice(0, 4);
  return html`<section class="pass-card" aria-labelledby="passContinue">
    <h2 id="passContinue">${icon("play")} Pick up where you left off</h2>
    ${
      open.length
        ? html`<ul class="pass-open">
            ${open.map(
              ({ row, status }) =>
                html`<li class="${domainClass(row.domain)}">
                  <span class="pass-tile sm">${domainGlyph(row.domain)}</span
                  ><span
                    ><a href="${activityLink(row, band)}">${row.title}</a
                    ><span class="fine"
                      >${row.domain} · ${STATUS_WORD[status]}</span
                    ></span
                  >
                </li>`,
            )}
          </ul>`
        : html`<p class="fine">
              Nothing is waiting. Choose a skill room to start something new.
            </p>
            <a class="btn small" href="${BASE}/?grades=${band}"
              >Choose a skill ${icon("arrow-right")}</a
            >`
    }
  </section>`;
}

const activityLink = (row, band) =>
  `${BASE}/${row.domain}/${row.level}/${row.id}?grades=${band}`;

function recentHTML(evidence, band) {
  if (!evidence.length)
    return html`<div class="empty-state pass-empty">
      <img src="${ART}/empty.svg" alt="" width="320" height="240" />
      <h3>Your practice record starts here</h3>
      <p>Complete a meaningful attempt to begin your practice record.</p>
      <a class="btn btn-primary" href="${BASE}/?grades=${band}"
        >Start practicing ${icon("arrow-right")}</a
      >
    </div>`;
  const row = (r) =>
    html`<li class="pass-ev ${domainClass(r.domain)}">
      <span class="pass-tile sm">${domainGlyph(r.domain)}</span
      ><span class="pass-ev-body"
        ><a href="${activityLink(r, band)}">${r.title}</a
        ><span class="fine"
          >${r.domain} · ${TIERS[r.level].name} ·
          ${evidenceLabel(r.result)}</span
        ></span
      ><time
        class="pass-ev-date"
        datetime="${String(r.result.date).slice(0, 10)}"
        >${formatDate(String(r.result.date).slice(0, 10))}</time
      >
    </li>`;
  const shown = evidence.slice(0, 20);
  return html`<ul class="pass-evlist">
      ${shown.slice(0, RECENT_SHOWN).map(row)}
    </ul>
    ${
      shown.length > RECENT_SHOWN
        ? html`<details class="pass-more">
            <summary>Show ${shown.length - RECENT_SHOWN} more</summary>
            <ul class="pass-evlist">
              ${shown.slice(RECENT_SHOWN).map(row)}
            </ul>
          </details>`
        : ""
    }
    <p class="fine">
      Showing ${shown.length} most recent practice records. Open an activity to
      review your work.
    </p>`;
}

export async function render(ctx) {
  const band = ctx.band;
  const rows = await bandRows(band);
  const saved = rows.map((row) => ({
    ...row,
    record: loadRecord(band, row.domain, row.level),
  }));
  if (new URLSearchParams(location.search).has("portfolio"))
    return { title: "My practice portfolio", html: portfolioHTML(band, saved) };
  const domains = await bandDomains(band);
  const stats = CORE_DOMAINS.filter((d) => domains[d]).map((d) => {
    let done = 0;
    let total = 0;
    const byLevel = LEVEL_KEYS.filter((k) => domains[d].levels[k]).map((k) => {
      const ids = new Set(domains[d].levels[k].activities.map((r) => r[0]));
      const record = loadRecord(band, d, k);
      const n = [...ids].filter((id) => isActivityComplete(record, id)).length;
      done += n;
      total += ids.size;
      return { level: k, n, of: ids.size };
    });
    return { domain: d, done, total, byLevel, color: domains[d].color };
  });
  const evidence = saved
    .map((row) => ({ ...row, result: row.record.results[row.id] }))
    .filter(
      (row) =>
        row.result?.date &&
        row.result.meaningful !== false &&
        row.result.words !== 0 &&
        row.result.practiced !== false,
    )
    .sort((a, b) => b.result.date.localeCompare(a.result.date));
  const days = practiceDays();
  const streak = weekStreak(days);
  const ledger = loadLedger();
  const studio = loadStudio();
  const mine = ledger.entries.filter((e) => e.band === band);
  const extra = {
    recordings: mine.filter((e) => e.src === "speaking").length,
    revised: mine.some((e) => e.kind === "revision"),
    independentWriting: mine.some(
      (e) =>
        e.kind === "first" &&
        e.stage === "independent" &&
        ["writing", "speaking"].includes(e.src),
    ),
    sourceUse: mine.some((e) => (e.m?.cites || 0) >= 2),
    patternClosed: mine.some(
      (e) => e.src === "detective" && e.kind === "transfer" && e.m?.ok,
    ),
    missionDone: Object.values(studio.missions).some((m) => m.done),
  };
  const revisions = mine.filter((e) => e.kind === "revision").length;
  const retried = saved.filter(
    (row) => row.record.attemptHistory?.[row.id]?.length,
  ).length;
  const kept = await audioStore.list();
  const list = badges(stats, streak, days, extra);
  const earned = list.filter((b) => b.on).length;
  const name = getStudentName();
  const stamps = stats.reduce((n, s) => n + s.done, 0);
  const totalActs = stats.reduce((n, s) => n + s.total, 0);
  return {
    title: "My Passport",
    html: html`${crumbsHTML([
        ["Lab", `${BASE}/`],
        ["My Passport", null],
      ])}
      <section class="pass-page">
        <header class="pass-hero">
          <div class="pass-hero-copy">
            <p class="eyebrow">ACCESS Practice Passport · ${bandLabel(band)}</p>
            <h1 tabindex="-1">${name ? `${name}'s` : "My"} Passport</h1>
            <p class="lead">
              Your finished practice, saved on this device. Stamps show how much
              you practiced. They are not an ACCESS score or a language level.
            </p>
            <label class="field pass-name"
              ><span>My nickname or initials (not my full name)</span
              ><input
                type="text"
                data-name
                value="${name}"
                maxlength="40"
                autocomplete="off"
                ${IGN}
            /></label>
          </div>
          <img class="pass-art" src="${ART}/progress-passport.svg" alt="" width="360" height="270" />
          <ul class="pass-stats">
            <li><span class="pass-stat-ico">${icon("check")}</span><span class="pass-stat-label">Stamps</span><strong class="pass-stat-value">${stamps}</strong><span class="pass-stat-note">of ${totalActs} activities</span></li>
            <li><span class="pass-stat-ico">${icon("calendar")}</span><span class="pass-stat-label">Week streak</span><strong class="pass-stat-value">${streak}</strong><span class="pass-stat-note">${streak === 1 ? "week" : "weeks"} in a row</span></li>
            <li><span class="pass-stat-ico">${icon("clock")}</span><span class="pass-stat-label">Practice days</span><strong class="pass-stat-value">${days.length}</strong><span class="pass-stat-note">${days.length ? `last ${formatDate(days[0])}` : "none yet"}</span></li>
          </ul>
        </header>

        <section aria-labelledby="passSkills">
          <h2 id="passSkills" class="pass-heading">Practice by skill</h2>
          <div class="pass-domains">
            ${stats.map((s) => domainCard(s, band))}
          </div>
        </section>

        <div class="pass-split">
          <section class="panel pass-evidence" aria-labelledby="passShows">
            <h2 id="passShows">What my practice shows</h2>
            <p class="pass-note">
              Stamps show completed practice, not mastery or an ACCESS score. A
              correct answer after help, a reviewed draft, spoken practice, and
              a worksheet are different kinds of evidence. Older records may not
              include support details.
            </p>
            ${recentHTML(evidence, band)}
          </section>
          <div class="pass-side">
            ${calendarHTML(days)} ${continueHTML(saved, band)}
            <section class="pass-card" aria-labelledby="passRevise">
              <h2 id="passRevise">
                ${icon("retry")} Revisions and earlier tries
              </h2>
              <dl class="pass-mini">
                <div>
                  <dt>Revisions after feedback</dt>
                  <dd>${revisions}</dd>
                </div>
                <div>
                  <dt>Activities with earlier tries kept</dt>
                  <dd>${retried}</dd>
                </div>
              </dl>
              <a
                class="btn small no-print"
                href="${BASE}/passport?grades=${band}&portfolio=1"
                >${icon("list")} Review my portfolio</a
              >
            </section>
          </div>
        </div>

        <section aria-labelledby="passMiles">
          <div class="pass-heading-row">
            <h2 id="passMiles" class="pass-heading">Milestones</h2>
            <p class="fine">
              ${earned} of ${list.length} earned. Milestones mark practice
              habits, not language level.
            </p>
          </div>
          <ul class="pass-badges">
            ${list.map((b) => html`<li class="${b.on ? "is-on" : ""}"><span class="pass-badge-icon">${icon(b.on ? b.icon : b.icon)}</span><strong>${b.name}</strong><span class="pass-badge-how">${b.on ? html`${icon("check")} Earned` : b.how}</span></li>`)}
          </ul>
        </section>

        <div class="row-actions no-print pass-actions">
          <a class="btn btn-secondary" href="${BASE}/growth?grades=${band}"
            >${icon("growth")} View Language Growth Map</a
          >
          <button type="button" class="btn btn-primary" data-print>
            ${icon("print")} Print my passport
          </button>
          <a class="btn" href="${BASE}/passport?grades=${band}&portfolio=1"
            >${icon("list")} Review and print my portfolio</a
          >
        </div>
      </section>

      <div class="pass-split pass-split-even no-print">
        <section class="panel pass-share" aria-labelledby="shareTitle">
          <h2 id="shareTitle">${icon("mail")} Send my work to my teacher</h2>
          <p>
            Choose what to share. The code may contain your writing, speaking
            transcripts, mission and detective results, and reading/listening
            practice results. It has no email, school ID or recordings. Only
            your alias is included. Keep the code private and give it only to
            your teacher.
          </p>
          <label class="field"
            ><span
              >My alias for my teacher (initials or a class nickname, not my
              full name)</span
            ><input
              type="text"
              data-share-alias
              value="${name}"
              maxlength="40"
              autocomplete="off"
              ${IGN}
          /></label>
          <fieldset class="pass-options">
            <legend>What to include</legend>
            ${[
              ["writing", "Writing drafts and reflections"],
              ["speaking", "Speaking transcripts and reviews"],
              ["missions", "Mission results"],
              ["detective", "Error Detective results"],
              ["readingListening", "Reading and listening practice results"],
            ].map(
              ([k, l]) =>
                html`<label class="pass-check"
                  ><input
                    type="checkbox"
                    data-share-opt="${k}"
                    checked
                    ${IGN}
                  /><span>${l}</span></label
                >`,
            )}
          </fieldset>
          <div class="row-actions">
            <button type="button" class="btn btn-primary" data-share-copy>
              ${icon("copy")} Copy share code</button
            ><button type="button" class="btn" data-share-file>
              ${icon("download")} Download share file
            </button>
          </div>
          <p class="fine" data-share-status role="status"></p>
          <h3>Recordings kept on this device</h3>
          ${
            kept.length
              ? html`<ul class="pass-rec">
                    ${kept.map((k) => html`<li><span>${k.task} · ${k.seconds}s · ${String(k.t).slice(0, 10)}</span><button type="button" class="ghost danger small" data-del-audio="${k.id}">Delete</button></li>`)}
                  </ul>
                  <button
                    type="button"
                    class="ghost danger small"
                    data-del-audio-all
                  >
                    Delete all recordings
                  </button>`
              : html`<p class="fine">
                  None. Recordings are only kept if you press “Keep for my
                  teacher” in the Speaking Studio. You can always download a
                  recording instead.
                </p>`
          }
        </section>

        <section class="panel pass-backup" aria-labelledby="backupTitle">
          <h2 id="backupTitle">${icon("save")} Use another computer</h2>
          <p>
            Your written answers, planning notes, checklists, first drafts,
            revision reflections and practice records are saved in this browser.
            Clearing browser data can remove them. Audio recordings are not
            included. Copy the full ACCESS1 progress code, then paste it here on
            another device. It contains your work, so keep it private. No name
            is required to practice. On a shared device, export your own work
            before using the clear option; do not clear another student’s work.
            Site Save/Resume short codes are a separate system; for a portable
            lab backup use this full progress code.
          </p>
          <p>
            Loading a backup keeps work already on this device and adds missing
            activities. It also keeps existing test attempts and settings. To
            use a different version of an activity, open the backup in a
            separate browser profile.
          </p>
          <ol class="pass-steps">
            <li>
              <span class="pass-step-n">1</span>
              <div>
                <strong>On the old device</strong>
                <div class="row-actions">
                  <button type="button" class="btn" data-export>
                    ${icon("copy")} Copy my progress code
                  </button>
                </div>
              </div>
            </li>
            <li>
              <span class="pass-step-n">2</span>
              <div>
                <strong>On the new device</strong>
                <label class="field"
                  ><span>Paste a progress code</span
                  ><textarea
                    rows="3"
                    data-import-text
                    placeholder="ACCESS1.…"
                    ${IGN}
                  ></textarea>
                </label>
                <div class="row-actions">
                  <button type="button" class="btn btn-primary" data-import>
                    ${icon("download")} Load progress
                  </button>
                </div>
              </div>
            </li>
          </ol>
          <div class="pass-danger">
            <p class="fine">
              Starting over on a shared device? This removes saved progress from
              this browser and cannot be undone.
            </p>
            <button type="button" class="ghost danger" data-clear>
              Clear my progress on this device
            </button>
          </div>
        </section>
      </div>`,
  };
}
export function onInput(e) {
  if (e.target.matches("[data-name]")) setStudentName(e.target.value.trim());
}

function shareBundle(ctx) {
  const alias = document.querySelector("[data-share-alias]")?.value || "";
  const include = Object.fromEntries([...document.querySelectorAll("[data-share-opt]")].map((el) => [el.dataset.shareOpt, el.checked]));
  return buildShare({ alias, band: ctx.band, include });
}

export async function onClick(e, ctx) {
  const t = e.target;
  const status = document.querySelector("[data-share-status]");
  if (t.closest("[data-share-copy]")) {
    const code = encodeShare(shareBundle(ctx));
    try {
      await navigator.clipboard.writeText(code);
      if (status) status.textContent = `Share code copied (${Math.ceil(code.length / 1000)} KB). Paste it into your teacher's dashboard or message.`;
    } catch {
      if (status) status.textContent = "Copy failed. Use “Download share file” instead.";
    }
    return true;
  }
  if (t.closest("[data-share-file]")) {
    {
      const b = shareBundle(ctx);
      downloadText(`access-${b.alias.replace(/[^A-Za-z0-9_-]+/g, "-").slice(0, 24)}-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(b), "application/json");
    }
    if (status) status.textContent = "File downloaded. Give it to your teacher.";
    return true;
  }
  const del = t.closest("[data-del-audio]");
  if (del) {
    await audioStore.remove(del.dataset.delAudio);
    announce("Recording deleted.");
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-del-audio-all]")) {
    await audioStore.clearAll();
    announce("All kept recordings deleted.");
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-export]")) {
    const code = exportCode();
    try {
      await navigator.clipboard.writeText(code);
      announce("Progress code copied. Paste it on your other device.");
    } catch {
      const box = document.querySelector("[data-import-text]");
      if (box) {
        box.value = code;
        box.select();
      }
      announce("Copy the code from the box.");
    }
    return;
  }
  if (t.closest("[data-import]")) {
    try {
      const n = importCode(document.querySelector("[data-import-text]")?.value);
      announce(`Backup checked (${n} records loaded). Work already on this device was kept; missing activities were added.`);
      ctx.rerender();
    } catch (err) {
      announce(err.message || "That code did not work.");
    }
    return;
  }
  if (t.closest("[data-clear]")) {
    if (
      !window.confirm(
        "Clear all ACCESS Practice Lab progress on this device? This cannot be undone.",
      )
    )
      return;
    clearAll();
    await audioStore.clearAll();
    announce("Progress cleared.");
    ctx.rerender();
  }
}
