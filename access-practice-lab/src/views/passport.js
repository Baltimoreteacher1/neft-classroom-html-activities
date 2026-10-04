// My Passport: stamps per skill, practice streak, badges, a printable report,
// and a portable progress code (move progress to another device, no account).
import { crumbsHTML, domainGlyph, ringHTML } from "../components.js";
import { isActivityComplete } from "../attempts.js";
import { evidenceLabel } from "../learning.js";
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
  BASE,
  CORE_DOMAINS,
  DOMAIN_META,
  LEVEL_KEYS,
  TIERS,
  announce,
  bandLabel,
  formatDate,
  html,
  raw,
} from "../util.js";

const IGN = raw("data-nsr-ignore");

function badges(stats, streak, days) {
  const total = stats.reduce((n, s) => n + s.done, 0);
  const all4 = stats.every((s) => s.done > 0);
  return [
    { on: total >= 1, icon: "🌱", name: "First stamp", how: "Finish any activity." },
    { on: all4, icon: "🧭", name: "All four skills", how: "Finish one activity in every skill." },
    { on: total >= 10, icon: "🔟", name: "Ten stamps", how: "Finish 10 activities." },
    { on: total >= 30, icon: "🚀", name: "Thirty stamps", how: "Finish 30 activities." },
    {
      on: streak >= 3,
      icon: "🔥",
      name: "Three-week streak",
      how: "Practice three weeks in a row.",
    },
    {
      on: stats.find((s) => s.domain === "Speaking")?.done >= 5,
      icon: "🎤",
      name: "Brave speaker",
      how: "Finish 5 speaking activities.",
    },
    {
      on: stats.find((s) => s.domain === "Writing")?.done >= 5,
      icon: "✍️",
      name: "Strong writer",
      how: "Finish 5 writing activities.",
    },
    {
      on: days.length >= 10,
      icon: "📅",
      name: "Ten practice days",
      how: "Practice on 10 different days.",
    },
  ];
}

export async function render(ctx) {
  const band = ctx.band;
  const rows = await bandRows(band);
  const saved = rows.map((row) => ({ ...row, record: loadRecord(band, row.domain, row.level) }));
  if (new URLSearchParams(location.search).has("portfolio")) {
    const work = saved.filter((row) => row.record.results[row.id] || row.record.notes[row.id] || row.record.reflections[row.id] || row.record.attemptHistory?.[row.id]?.length);
    return {
      title: "My practice portfolio",
      html: html`<section class="practice-portfolio">
        <div class="row-actions no-print"><a class="btn" href="${BASE}/passport?grades=${band}">Back to Passport</a><button type="button" class="btn btn-primary" data-print>Print my portfolio</button></div>
        <p class="eyebrow">${bandLabel(band)} · ${getStudentName() || "My practice"}</p><h1 tabindex="-1">My practice portfolio</h1>
        <p>Compare your drafts and describe what you changed. This is a record of practice, not a proficiency score. Audio is not included. Keep your printed work private.</p>
        ${work.length ? work.map((row) => {
          const id = row.id, record = row.record;
          return html`<article class="portfolio-entry"><h2>${row.title}</h2><p>${row.domain} · ${TIERS[row.level].name}</p>
            <p><strong>Current evidence:</strong> ${record.results[id] ? evidenceLabel(record.results[id]) : "Draft saved · not yet reviewed"}</p>
            ${record.results[id]?.date ? html`<p>Last review: ${formatDate(String(record.results[id].date).slice(0, 10))}</p>` : ""}
            ${record.drafts[id]?.first ? html`<h3>First draft</h3><p class="portfolio-response">${record.drafts[id].first}</p>` : ""}
            ${record.notes[id] ? html`<h3>${row.domain === "Speaking" ? "Planning notes" : "Current draft"}</h3><p class="portfolio-response">${record.notes[id]}</p>` : ""}
            ${record.reflections[id] ? html`<h3>What I improved or checked</h3><p class="portfolio-response">${record.reflections[id]}</p>` : ""}
            ${record.attemptHistory?.[id]?.length ? html`<h3>Earlier attempts</h3><p class="fine">Up to five recent attempt summaries are kept.</p><ul>${record.attemptHistory[id].map((attempt) => html`<li>${formatDate(String(attempt.date).slice(0, 10))} · ${evidenceLabel(attempt.result)}</li>`)}</ul>` : ""}
            <p class="no-print"><a href="${BASE}/${row.domain}/${row.level}/${id}?grades=${band}">Review this activity</a></p>
          </article>`;
        }) : html`<p>Your saved practice will appear here. Start an activity, then return to print your work.</p>`}
      </section>`,
    };
  }
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
  const evidence = (await bandRows(band)).map((row) => ({ ...row, result: loadRecord(band, row.domain, row.level).results[row.id] })).filter((row) => row.result?.date && row.result.meaningful !== false && row.result.words !== 0 && row.result.practiced !== false).sort((a,b) => b.result.date.localeCompare(a.result.date));
  const days = practiceDays();
  const streak = weekStreak(days);
  const list = badges(stats, streak, days);
  const name = getStudentName();
  return {
    title: "My Passport",
    html: html`${crumbsHTML([
        ["Lab", `${BASE}/`],
        ["My Passport", null],
      ])}
      <section class="passport">
        <header class="passport-head">
          <div>
            <p class="eyebrow">ACCESS Practice Passport · ${bandLabel(band)}</p>
            <h1 tabindex="-1">🛂 ${name ? `${name}'s` : "My"} Passport</h1>
            <label class="field inline"
              ><span>My name or initials</span
              ><input
                type="text"
                data-name
                value="${name}"
                maxlength="40"
                autocomplete="off"
                ${IGN}
            /></label>
          </div>
          <dl class="pp-stats">
            <div>
              <dt>Stamps</dt>
              <dd>${stats.reduce((n, s) => n + s.done, 0)}</dd>
            </div>
            <div>
              <dt>Week streak</dt>
              <dd>${streak}</dd>
            </div>
            <div>
              <dt>Practice days</dt>
              <dd>${days.length}</dd>
            </div>
          </dl>
        </header>
        <div class="pp-grid">
          ${stats.map(
            (s) =>
              html`<article class="pp-card" style="--room:${s.color}">
                <h2>
                  <span aria-hidden="true">${domainGlyph(s.domain)}</span>
                  ${DOMAIN_META[s.domain].room}
                </h2>
                ${ringHTML(s.done, s.total, { size: 72, label: `${s.done} of ${s.total}` })}
                <ul class="pp-levels">
                  ${s.byLevel.map(
                    (l) =>
                      html`<li>
                        <span>${TIERS[l.level].name}</span
                        ><span class="stamps" aria-label="${l.n} of ${l.of} stamps"
                          >${"●".repeat(l.n)}<span class="empty"
                            >${"○".repeat(Math.max(0, l.of - l.n))}</span
                          ></span
                        >
                      </li>`,
                  )}
                </ul>
              </article>`,
          )}
        </div>
        <section class="panel"><h2>What my practice shows</h2><p>Stamps show completed practice, not mastery or an ACCESS score. A correct answer after help, a reviewed draft, spoken practice, and a worksheet are different kinds of evidence. Older records may not include support details.</p>
          ${evidence.length ? html`<ul class="evidence-list">${evidence.slice(0,20).map((r) => html`<li><a href="${BASE}/${r.domain}/${r.level}/${r.id}?grades=${band}">${r.title}</a><span>${evidenceLabel(r.result)}</span></li>`)}</ul><p class="fine">Showing ${Math.min(20,evidence.length)} most recent practice records. Open an activity to review your work.</p>` : html`<p>Complete a meaningful attempt to begin your practice record.</p>`}</section>
        <h2 class="section-title">Badges</h2>
        <ul class="badges">
          ${list.map((b) => html`<li class="${b.on ? "is-on" : ""}"><span class="badge-icon" aria-hidden="true">${b.icon}</span><strong>${b.name}</strong><span>${b.on ? "Earned!" : b.how}</span></li>`)}
        </ul>
        ${days.length ? html`<p class="fine">Last practice: ${formatDate(days[0], { weekday: "long", month: "long", day: "numeric" })}</p>` : ""}
        <div class="row-actions no-print">
          <button type="button" class="btn btn-primary" data-print>🖨️ Print my passport</button>
          <a class="btn" href="${BASE}/passport?grades=${band}&portfolio=1">Review and print my portfolio</a>
        </div>
      </section>
      <section class="panel no-print">
        <h2>Use another computer</h2>
        <p>
          Your written answers, planning notes, checklists, first drafts, revision reflections and practice records are saved in this browser. Clearing browser data can remove them. Audio recordings are not included.
          Copy the full ACCESS1 progress code, then paste it here on another device. It contains your work, so keep it private. No name is required to practice.
          On a shared device, export your own work before using the clear option; do not clear another student’s work.
          Site Save/Resume short codes are a separate system; for a portable lab backup use this full progress code.
        </p>
        <p>Loading a backup keeps work already on this device and adds missing activities. It also keeps existing test attempts and settings. To use a different version of an activity, open the backup in a separate browser profile.</p>
        <div class="row-actions">
          <button type="button" class="btn" data-export>Copy my progress code</button>
        </div>
        <label class="field"
          ><span>Paste a progress code</span
          ><textarea rows="2" data-import-text placeholder="ACCESS1.…" ${IGN}></textarea>
        </label>
        <div class="row-actions">
          <button type="button" class="btn" data-import>Load progress</button
          ><button type="button" class="ghost danger" data-clear>
            Clear my progress on this device
          </button>
        </div>
      </section>`,
  };
}

export function onInput(e) {
  if (e.target.matches("[data-name]")) setStudentName(e.target.value.trim());
}

export async function onClick(e, ctx) {
  const t = e.target;
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
    announce("Progress cleared.");
    ctx.rerender();
  }
}
