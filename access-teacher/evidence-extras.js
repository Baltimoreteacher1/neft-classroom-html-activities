// Teacher Hub: supports and independence, gradual release, goals, official results, check-in
// reminders. Everything here sits beside the practice evidence and never changes it. Goals and official
// results are typed by the teacher and live in this browser only (see evidence.js `persist`).
import { calibration } from "/access-practice-lab/src/lang/calibration.js";
import { checkinCalendar, checkinDates } from "/access-practice-lab/src/lang/checkin-calendar.js";
import { STAGE_LABEL, fadeSentence, fadeTrajectory } from "/access-practice-lab/src/lang/fade.js";
import {
  GOAL_DOMAINS,
  GOAL_STATUS,
  goalContext,
  goalEvidence,
} from "/access-practice-lab/src/lang/goals.js";
import {
  OFFICIAL_DOMAINS,
  OFFICIAL_NOTE,
  growth,
  makeResult,
  upsertResult,
} from "/access-practice-lab/src/lang/official-scores.js";
import { readingLogSummary } from "/access-practice-lab/src/reading-state.js";
import { supportsReport } from "/access-practice-lab/src/lang/supports-report.js";
import { html, raw } from "/access-practice-lab/src/util.js";

const MAX_STEPS = 8;
const level = (v) => (v == null ? "—" : v.toFixed(1));
const signed = (c) => (c === null ? "—" : c > 0 ? `+${c.toFixed(1)}` : c.toFixed(1));

export function createExtras(T, { persist, note, draw, download }) {
  const assigned = (id) => T.goals[id] || [];
  const goalById = (id) => T.goalBank.goals.find((g) => g.id === id);

  function supportsBlock(student) {
    const report = supportsReport({
      entries: student.ledger?.entries || [],
      records: student.records || {},
    });
    return html`<h4>Supports and independence</h4>
      ${
        report.enough || report.lines.length
          ? html`<ul class="evidence-list">
              ${report.lines.map((l) => html`<li><span>${l.en}</span></li>`)}
            </ul>`
          : html`<p class="fine">Not enough evidence yet (${report.n} of 3 first attempts).</p>`
      }`;
  }

  function fadeBlock(student) {
    const rows = fadeTrajectory(student.ledger?.entries || []);
    if (!rows.length) return "";
    return html`<h4>Gradual release by purpose</h4>
      <ul class="evidence-list ev-fade">
        ${rows.map(
          (row) =>
            html`<li>
              <span
                ><strong>${row.use}</strong>
                <span class="fine"
                  >(${row.n} first ${row.n === 1 ? "attempt" : "attempts"})</span
                ></span
              >
              <span
                class="fade-steps"
                aria-label="Oldest to newest: ${row.sequence
                  .slice(-MAX_STEPS)
                  .map((s) => STAGE_LABEL[s].en)
                  .join(", ")}"
              >
                ${row.sequence.slice(-MAX_STEPS).map((s) => html`<span class="fade-step is-${s}" title="${STAGE_LABEL[s].en}">${STAGE_LABEL[s].en[0]}</span>`)}
              </span>
              <span class="fine">${fadeSentence(row).en}</span>
            </li>`,
        )}
      </ul>`;
  }

  function readingLogBlock(student) {
    const log = student.readingLog || [];
    if (!log.length) return "";
    const week = readingLogSummary(log);
    const month = readingLogSummary(log, new Date(), 28);
    return html`<h4>Independent reading log</h4>
      <p class="fine">Last 7 days: ${week.texts} ${week.texts === 1 ? "text" : "texts"} on ${week.days} ${week.days === 1 ? "day" : "days"}${week.minutes ? `, ${week.minutes} minutes` : ""}. Last 4 weeks: ${month.texts} ${month.texts === 1 ? "text" : "texts"}.</p>
      <ul class="evidence-list">
        ${log.slice(-4).reverse().map((r) => html`<li><span>${r.title}${r.note ? html` <em class="fine">— ${r.note}</em>` : ""}</span><span class="fine">${r.t.slice(0, 10)}</span></li>`)}
      </ul>`;
  }

  function calibrationBlock(student) {
    const c = calibration(student.records || {});
    if (!c.rated) return "";
    if (!c.enough)
      return html`<h4>Confidence ratings</h4>
        <p class="fine">${c.rated} rated so far (5 needed before any pattern is shown).</p>`;
    const k = c.cells;
    return html`<h4>Confidence ratings</h4>
      <ul class="evidence-list">
        <li><span>Sure and right</span><span>${k.sureRight}</span></li>
        <li>
          <span>Sure but wrong <em class="fine">(a belief to revisit first)</em></span
          ><span>${k.sureWrong}</span>
        </li>
        <li>
          <span>Guessing but right <em class="fine">(returns for spaced review)</em></span
          ><span>${k.guessRight}</span>
        </li>
        <li><span>Guessing and wrong</span><span>${k.guessWrong}</span></li>
      </ul>`;
  }

  function goalsBlock(student, { editable }) {
    const ctx = goalContext(student);
    const mine = assigned(student.id)
      .map((a) => ({ a, goal: goalById(a.goalId) }))
      .filter((x) => x.goal);
    const taken = new Set(mine.map((x) => x.goal.id));
    return html`<h4>Goals</h4>
      ${
        mine.length
          ? html`<ul class="ev-goals">
              ${mine.map(({ goal }) => {
                const ev = goalEvidence(goal, ctx);
                return html`<li class="ev-goal">
                  <p>
                    <strong>${goal.en}</strong><br /><span lang="es" class="fine">${goal.es}</span>
                  </p>
                  <p class="fine">
                    <span class="badge is-${ev.status}">${GOAL_STATUS[ev.status].en}</span> ${ev.en}
                  </p>
                  ${ev.status !== "on-own" && goal.tryTomorrow ? html`<p class="fine"><strong>Try tomorrow (3–5 min):</strong> ${goal.tryTomorrow}</p>` : ""}
                  ${editable ? html`<button type="button" class="ghost small no-print" data-goal-remove="${goal.id}" data-sid="${student.id}">Remove goal</button>` : ""}
                </li>`;
              })}
            </ul>`
          : html`<p class="fine">No goals chosen yet.</p>`
      }
      ${mine.length > 3 ? html`<p class="fine">Most students work best with one to three goals at a time.</p>` : ""}
      ${
        editable
          ? html`<div class="row-actions no-print">
              <label class="field inline"
                ><span>Add a goal</span>
                <select data-goal-pick="${student.id}">
                  <option value="">Choose…</option>
                  ${GOAL_DOMAINS.map((d) => {
                    const options = T.goalBank.goals.filter(
                      (g) => g.domains[0] === d && !taken.has(g.id),
                    );
                    return options.length
                      ? html`<optgroup label="${d}">
                          ${options.map((g) => html`<option value="${g.id}">${g.en}</option>`)}
                        </optgroup>`
                      : "";
                  })}
                </select></label
              >
              <button type="button" class="btn" data-goal-add="${student.id}">Add goal</button>
            </div>`
          : ""
      }`;
  }

  function officialBlock(student, { editable }) {
    const list = T.official[student.id] || [];
    const pairs = growth(list);
    return html`<h4>Official ACCESS results <span class="fine">(entered by you)</span></h4>
      ${
        list.length
          ? html`<div
              class="lab-table-wrap"
              tabindex="0"
              role="region"
              aria-label="Official results"
            >
              <table class="hub-table">
                <thead>
                  <tr>
                    <th scope="col">Year</th>
                    ${OFFICIAL_DOMAINS.map((d) => html`<th scope="col">${d}</th>`)}
                    <th scope="col">Overall</th>
                    ${editable ? html`<th scope="col" class="no-print"><span class="visually-hidden">Remove</span></th>` : ""}
                  </tr>
                </thead>
                <tbody>
                  ${list.map(
                    (r) =>
                      html`<tr>
                        <th scope="row">${r.year}</th>
                        ${OFFICIAL_DOMAINS.map((d) => html`<td>${level(r.levels[d])}</td>`)}
                        <td>${level(r.overall)}</td>
                        ${editable ? html`<td class="no-print"><button type="button" class="ghost small" data-official-remove="${r.year}" data-sid="${student.id}">Remove</button></td>` : ""}
                      </tr>`,
                  )}
                </tbody>
              </table>
            </div>`
          : html`<p class="fine">No official results entered.</p>`
      }
      ${pairs.map(
        (p) =>
          html`<p class="fine">
            <strong>${p.from} to ${p.to}:</strong>
            ${OFFICIAL_DOMAINS.map((d) => `${d} ${signed(p.domains[d].change)}`).join(" · ")} ·
            Overall ${signed(p.overall.change)}
          </p>`,
      )}
      <p class="fine">${OFFICIAL_NOTE.en}</p>
      ${
        editable
          ? html`<div
              class="row-actions no-print"
              role="group"
              aria-label="Enter official results"
              data-official-form="${student.id}"
            >
              <label class="field inline"
                ><span>School year</span
                ><input type="text" data-official-year placeholder="2025-26" size="8"
              /></label>
              ${OFFICIAL_DOMAINS.map((d) => html`<label class="field inline"><span>${d}</span><input type="text" inputmode="decimal" data-official-level="${d}" placeholder="1.0–6.0" size="5" /></label>`)}
              <label class="field inline"
                ><span>Overall</span
                ><input
                  type="text"
                  inputmode="decimal"
                  data-official-overall
                  placeholder="1.0–6.0"
                  size="5"
              /></label>
              <button type="button" class="btn" data-official-save="${student.id}">
                Save year
              </button>
            </div>`
          : ""
      }`;
  }

  /** Everything the student panel shows beyond the practice evidence itself. */
  const studentSections = (student) =>
    student
      ? html`${supportsBlock(student)}${fadeBlock(student)}${calibrationBlock(student)}${readingLogBlock(student)}${goalsBlock(student, { editable: true })}${officialBlock(student, { editable: true })}`
      : "";

  /** The same sections, read-only and with the learner's own reflection lines, for the printed conference sheet. */
  const sheetSections = (student) =>
    student
      ? html`${supportsBlock(student)}${fadeBlock(student)}${calibrationBlock(student)}${readingLogBlock(student)}${goalsBlock(student, { editable: false })}${officialBlock(student, { editable: false })}
          <h3>My reflection</h3>
          <p class="ev-lines">One thing I did well: ____________________________________________</p>
          <p class="ev-lines">One thing I want to work on: ____________________________________</p>
          <p class="ev-lines">
            A support I will try, or stop using: ______________________________
          </p>`
      : "";

  function checkinsTab() {
    const c = T.checkin;
    const dates = checkinDates({
      start: c.start,
      everyDays: Number(c.everyDays),
      count: Number(c.count),
    });
    return html`<p class="fine">
        Download a calendar file with reminders to review evidence and update goals. The file holds
        a title, dates and generic instructions only — no student names or results.
      </p>
      <div class="row-actions" data-checkin-form>
        <label class="field inline"
          ><span>First check-in</span><input type="date" data-checkin="start" value="${c.start}"
        /></label>
        <label class="field inline"
          ><span>Repeat every</span>
          <select data-checkin="everyDays">
            ${[14, 21, 28, 42].map((n) => html`<option value="${n}" ${String(c.everyDays) === String(n) ? raw("selected") : ""}>${n / 7} weeks</option>`)}
          </select></label
        >
        <label class="field inline"
          ><span>How many</span>
          <select data-checkin="count">
            ${[3, 4, 6, 8, 10].map((n) => html`<option value="${n}" ${String(c.count) === String(n) ? raw("selected") : ""}>${n}</option>`)}
          </select></label
        >
        <label class="field inline"
          ><span>Class or section (optional)</span
          ><input type="text" data-checkin="label" value="${c.label}" maxlength="60"
        /></label>
      </div>
      ${dates ? html`<p class="fine">Dates: ${dates.join(", ")} (weekends move to Monday).</p>` : html`<p class="fine">Choose a first date to see the schedule.</p>`}
      <div class="row-actions">
        <button
          type="button"
          class="btn btn-primary"
          data-checkin-download
          ${dates ? "" : raw("disabled")}
        >
          Download calendar file (.ics)
        </button>
      </div>`;
  }

  function click(t) {
    const add = t.closest("[data-goal-add]");
    if (add) {
      const sid = add.dataset.goalAdd;
      const pick = add.parentElement.querySelector("[data-goal-pick]");
      if (!pick?.value) return (note("Choose a goal first."), draw(), true);
      T.goals[sid] = [...assigned(sid), { goalId: pick.value, addedAt: new Date().toISOString() }];
      persist();
      note(
        "Goal added. Evidence for it is read from the student's work and updates when you add new codes.",
      );
      return (draw(), true);
    }
    const rmGoal = t.closest("[data-goal-remove]");
    if (rmGoal) {
      const sid = rmGoal.dataset.sid;
      T.goals[sid] = assigned(sid).filter((a) => a.goalId !== rmGoal.dataset.goalRemove);
      persist();
      return (draw(), true);
    }
    const save = t.closest("[data-official-save]");
    if (save) {
      const sid = save.dataset.officialSave;
      const form = save.closest("[data-official-form]");
      const levels = Object.fromEntries(
        OFFICIAL_DOMAINS.map((d) => [
          d,
          form.querySelector(`[data-official-level="${d}"]`).value.trim(),
        ]),
      );
      const res = makeResult({
        year: form.querySelector("[data-official-year]").value,
        levels,
        overall: form.querySelector("[data-official-overall]").value.trim(),
      });
      if (!res.ok) return (note(res.errors.join(" ")), draw(), true);
      T.official[sid] = upsertResult(T.official[sid] || [], res.value);
      persist();
      note(`Saved ${res.value.year}. Kept in this browser only.`);
      return (draw(), true);
    }
    const rmYear = t.closest("[data-official-remove]");
    if (rmYear) {
      const sid = rmYear.dataset.sid;
      T.official[sid] = (T.official[sid] || []).filter(
        (r) => r.year !== rmYear.dataset.officialRemove,
      );
      persist();
      return (draw(), true);
    }
    if (t.closest("[data-checkin-download]")) {
      const c = T.checkin;
      const ics = checkinCalendar({
        start: c.start,
        everyDays: Number(c.everyDays),
        count: Number(c.count),
        label: c.label,
      });
      if (ics) download("access-checkins.ics", ics, "text/calendar;charset=utf-8");
      return true;
    }
    return false;
  }

  function change(t) {
    const field = t.closest("[data-checkin]");
    if (!field) return false;
    T.checkin[field.dataset.checkin] = field.value;
    draw();
    return true;
  }

  /** Remove everything saved about one student (or everyone when no id is given). */
  function forget(id) {
    if (id) {
      delete T.goals[id];
      delete T.official[id];
    } else {
      T.goals = {};
      T.official = {};
    }
  }

  return { studentSections, sheetSections, checkinsTab, click, change, forget };
}
