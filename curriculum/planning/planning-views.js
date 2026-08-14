/* planning-views.js — rendering for the Live Pacing Planner.
 *
 * Every view is a pure function of (resolved year, curriculum index, ui state)
 * returning a DocumentFragment. No view reads storage or the network, and none
 * mutates the year — the caller re-renders after a change rather than patching
 * the DOM in place, which is what keeps five views from disagreeing about what
 * day it is.
 *
 * ACCESSIBILITY RULES HELD HERE
 *   - status is always a WORD, never only a colour or a dot;
 *   - every action is a real <button>, so it is reachable and announced;
 *   - the month grid is a real table with scope'd headers;
 *   - below 720px the grid views become an agenda list, because a five-column
 *     calendar at 390px is a picture of a calendar, not a usable one.
 */

import { ACTUAL_LABELS, flexCapacity, pacingPosition, unitSummary } from "/shared/pacing/engine.js";
import { detailFor, resourcesFor, titleFor, unitNumberOf } from "./planning-resources.js";

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function longDate(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export const shortDate = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${d.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short" })} ${d.getUTCDate()}`;
};

/* Ranges need the month; the week and month grids do not, because their caption
 * already says which month it is. "Mon 24 – Tue 8" is ambiguous the moment a
 * unit crosses a month boundary, which nine of eleven units do. */
export const rangeDate = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" });
};

/** The Monday of the school week containing `iso`. */
export function weekStart(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  const shift = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - shift);
  return d.toISOString().slice(0, 10);
}

export function addDays(iso, n) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The status word for a day. Colour is decoration; this is the meaning. */
export function statusWord(day) {
  if (day.schoolStatus !== "school") return day.statusLabel;
  if (day.actual?.status) return ACTUAL_LABELS[day.actual.status] || day.actual.status;
  return "Not yet taught";
}

function shifted(day) {
  return day.plan.dayType !== day.original.dayType || day.plan.lessonId !== day.original.lessonId;
}

/* ── Small shared pieces ───────────────────────────────────────────────────── */

function dayChips(day) {
  const wrap = el("p", "pp-chips");
  wrap.appendChild(el("span", `pp-chip pp-chip-type`, day.plan.dayType));
  if (day.earlyRelease) wrap.appendChild(el("span", "pp-chip pp-chip-short", "Half day"));
  if (day.locked) wrap.appendChild(el("span", "pp-chip pp-chip-lock", "Locked"));
  if (day.mcapWindow) wrap.appendChild(el("span", "pp-chip pp-chip-mcap", "MCAP window"));
  if (shifted(day)) wrap.appendChild(el("span", "pp-chip pp-chip-shift", "Shifted"));
  return wrap;
}

function linkList(links, className) {
  const ul = el("ul", `pp-links ${className || ""}`.trim());
  for (const l of links) {
    const li = el("li");
    const a = el("a", `pp-link pp-link-${l.kind}`, l.label);
    a.href = l.href;
    li.appendChild(a);
    ul.appendChild(li);
  }
  return ul;
}

function actionButton(label, action, date, extra = {}) {
  const b = el("button", "pp-btn pp-btn-quiet", label);
  b.type = "button";
  b.dataset.action = action;
  b.dataset.date = date;
  for (const [k, v] of Object.entries(extra)) b.dataset[k] = String(v);
  return b;
}

/** The action row every instructional day gets — buttons, never drag-only. */
export function dayActions(day) {
  const row = el("div", "pp-actions");
  if (day.schoolStatus !== "school") return row;
  row.appendChild(actionButton("Mark taught", "mark-taught", day.date));
  row.appendChild(actionButton("Continue tomorrow", "continue", day.date));
  row.appendChild(actionButton("Move later", "move-later", day.date));
  row.appendChild(actionButton("Move earlier", "move-earlier", day.date));
  row.appendChild(actionButton("Edit day", "edit", day.date));
  return row;
}

/* ── Today ─────────────────────────────────────────────────────────────────── */

export function renderToday(days, index, ui) {
  const frag = document.createDocumentFragment();
  const day = days.find((d) => d.date === ui.focusDate) || days[0];
  if (!day) return frag;

  const card = el("section", "pp-today");
  card.appendChild(el("h2", "pp-today-date", longDate(day.date)));

  if (day.schoolStatus !== "school") {
    card.appendChild(el("p", "pp-today-closed", day.calendarNote || day.statusLabel));
    card.appendChild(el("p", "pp-muted", "No instruction is scheduled. Nothing to record."));
    frag.appendChild(card);
    frag.appendChild(renderPacingSummary(days, ui));
    return frag;
  }

  const unit = unitNumberOf(index, day);
  if (unit) card.appendChild(el("p", "pp-today-unit", unitLabel(ui.baseline, day, unit)));
  card.appendChild(el("h3", "pp-today-lesson", titleFor(index, day)));

  const detail = detailFor(index, day);
  if (detail) {
    const meta = el("p", "pp-today-meta");
    meta.append(el("span", "pp-id", detail.id));
    if (detail.standard) meta.append(el("span", "pp-std", detail.standard));
    if (detail.timeEstimate) meta.append(el("span", "pp-time", detail.timeEstimate));
    card.appendChild(meta);
    if (detail.objective) card.appendChild(el("p", "pp-objective", detail.objective));
  }
  card.appendChild(dayChips(day));

  const res = resourcesFor(index, day);
  if (res.whole.length) card.appendChild(linkList(res.whole, "pp-links-primary"));
  if (res.smallGroup.length) {
    card.appendChild(el("h4", "pp-sub", "Small group"));
    card.appendChild(linkList(res.smallGroup));
  }
  if (res.student.length) {
    card.appendChild(el("h4", "pp-sub", "Student materials"));
    card.appendChild(linkList(res.student));
  }
  card.appendChild(el("h4", "pp-sub", "Planning"));
  card.appendChild(linkList(res.teacher));

  const record = el("section", "pp-record");
  record.appendChild(el("h4", "pp-sub", "Today"));
  record.appendChild(el("p", null, `Planned: ${titleFor(index, day)}`));
  record.appendChild(el("p", null, `Actual: ${statusWord(day)}`));
  if (day.note) record.appendChild(el("p", "pp-note", day.note));
  record.appendChild(dayActions(day));
  card.appendChild(record);

  frag.appendChild(card);
  frag.appendChild(renderPacingSummary(days, ui));
  return frag;
}

function unitLabel(baseline, day, unitNumber) {
  const u = (baseline.units || []).find((x) => x.key === day.plan.unitKey);
  return u ? u.districtLabel : `Unit ${unitNumber}`;
}

function renderPacingSummary(days, ui) {
  const p = pacingPosition(days, ui.today);
  const cap = flexCapacity(days, ui.today);
  const box = el("aside", "pp-summary");
  box.appendChild(el("h3", "pp-sub", "Where the year stands"));
  const list = el("dl", "pp-dl");
  const row = (k, v) => {
    list.appendChild(el("dt", null, k));
    list.appendChild(el("dd", null, v));
  };
  /* The drift figure is only appended when there IS one. "not started (no
   * drift)" reads like a hedge; "not started" is the whole fact. */
  const drift =
    p.drift === 0 ? "" : ` · ${Math.abs(p.drift)} day${Math.abs(p.drift) === 1 ? "" : "s"}`;
  row("Position", `${p.label}${drift}`);
  row("Instructional days so far", String(p.instructionalDaysElapsed));
  row("Days recorded", String(p.daysRecorded));
  row("Flex days remaining", String(cap.flex));
  row("Catch-up days remaining", String(cap.catchUp));
  box.appendChild(list);
  return box;
}

/* ── Week ──────────────────────────────────────────────────────────────────── */

export function renderWeek(days, index, ui) {
  const frag = document.createDocumentFragment();
  const start = weekStart(ui.focusDate);
  const week = days.filter((d) => d.date >= start && d.date <= addDays(start, 4));
  if (!week.length) {
    frag.appendChild(el("p", "pp-empty", "That week falls outside the school year."));
    return frag;
  }

  const table = el("table", "pp-week");
  const caption = el("caption", "pp-sr", `Week of ${longDate(start)}`);
  table.appendChild(caption);
  const thead = el("thead");
  const hr = el("tr");
  for (const h of ["Day", "Planned", "Actual", "Status", "Resources"]) {
    const th = el("th", null, h);
    th.scope = "col";
    hr.appendChild(th);
  }
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = el("tbody");
  for (const day of week) {
    const tr = el("tr", day.schoolStatus === "school" ? "" : "pp-row-closed");
    tr.dataset.date = day.date;

    const th = el("th", "pp-week-day");
    th.scope = "row";
    th.appendChild(el("span", "pp-week-name", shortDate(day.date)));
    if (day.calendarNote) th.appendChild(el("span", "pp-week-note", day.calendarNote));
    tr.appendChild(th);

    const planned = el("td");
    planned.appendChild(el("span", "pp-week-title", titleFor(index, day)));
    if (shifted(day)) {
      planned.appendChild(
        el("span", "pp-week-was", `Originally ${day.original.lessonId || day.original.dayType}`),
      );
    }
    tr.appendChild(planned);

    tr.appendChild(el("td", null, day.actual?.lessonId || (day.actual ? "—" : "")));
    tr.appendChild(el("td", "pp-week-status", statusWord(day)));

    const resCell = el("td");
    if (day.schoolStatus === "school") {
      const details = el("details", "pp-week-more");
      details.appendChild(el("summary", null, "Open resources"));
      const res = resourcesFor(index, day);
      for (const [heading, links] of [
        ["Whole group", res.whole],
        ["Small group", res.smallGroup],
        ["Students", res.student],
        ["Planning", res.teacher],
      ]) {
        if (!links.length) continue;
        details.appendChild(el("h4", "pp-sub", heading));
        details.appendChild(linkList(links));
      }
      details.appendChild(dayActions(day));
      resCell.appendChild(details);
    }
    tr.appendChild(resCell);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  frag.appendChild(table);
  frag.appendChild(renderAgenda(week, index));
  return frag;
}

/** The mobile presentation. Rendered always; CSS shows one or the other. */
function renderAgenda(week, index) {
  const list = el("ol", "pp-agenda");
  for (const day of week) {
    const li = el("li", day.schoolStatus === "school" ? "" : "pp-agenda-closed");
    li.appendChild(el("h3", "pp-agenda-day", shortDate(day.date)));
    li.appendChild(el("p", "pp-agenda-title", titleFor(index, day)));
    li.appendChild(el("p", "pp-agenda-status", statusWord(day)));
    if (day.schoolStatus === "school") li.appendChild(dayActions(day));
    list.appendChild(li);
  }
  return list;
}

/* ── Month ─────────────────────────────────────────────────────────────────── */

export function renderMonth(days, index, ui) {
  const frag = document.createDocumentFragment();
  const [year, month] = ui.focusDate.split("-").map(Number);
  const inMonth = days.filter((d) =>
    d.date.startsWith(`${year}-${String(month).padStart(2, "0")}`),
  );
  if (!inMonth.length) {
    frag.appendChild(el("p", "pp-empty", `${MONTHS[month - 1]} ${year} has no school days.`));
    return frag;
  }

  const table = el("table", "pp-month");
  table.appendChild(el("caption", "pp-month-caption", `${MONTHS[month - 1]} ${year}`));
  const thead = el("thead");
  const hr = el("tr");
  for (const h of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]) {
    const th = el("th", null, h);
    th.scope = "col";
    hr.appendChild(th);
  }
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = el("tbody");
  let row = el("tr");
  const firstCol = (new Date(`${inMonth[0].date}T12:00:00Z`).getUTCDay() + 6) % 7;
  for (let i = 0; i < firstCol; i++) row.appendChild(el("td", "pp-cell-empty"));
  let col = firstCol;

  for (const day of inMonth) {
    const td = el("td", `pp-cell ${day.schoolStatus === "school" ? "" : "pp-cell-closed"}`.trim());
    td.dataset.date = day.date;
    const btn = el("button", "pp-cell-btn");
    btn.type = "button";
    btn.dataset.action = "open-day";
    btn.dataset.date = day.date;
    btn.appendChild(el("span", "pp-cell-date", String(Number(day.date.slice(8)))));
    if (day.calendarNote) btn.appendChild(el("span", "pp-cell-event", day.calendarNote));
    if (day.schoolStatus === "school") {
      const unit = unitNumberOf(index, day);
      if (unit) btn.appendChild(el("span", "pp-cell-unit", `Unit ${unit}`));
      if (day.plan.lessonId) btn.appendChild(el("span", "pp-cell-id", day.plan.lessonId));
      btn.appendChild(el("span", "pp-cell-title", titleFor(index, day)));
      btn.appendChild(el("span", "pp-cell-status", statusWord(day)));
    }
    td.appendChild(btn);
    row.appendChild(td);
    col++;
    if (col === 5) {
      tbody.appendChild(row);
      row = el("tr");
      col = 0;
    }
  }
  if (col > 0) {
    for (let i = col; i < 5; i++) row.appendChild(el("td", "pp-cell-empty"));
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  frag.appendChild(table);
  frag.appendChild(renderAgenda(inMonth, index));
  return frag;
}

/* ── Units ─────────────────────────────────────────────────────────────────── */

export function renderUnits(days, index, ui) {
  const frag = document.createDocumentFragment();
  const list = el("div", "pp-units");
  for (const unit of ui.baseline.units) {
    const s = unitSummary(days, unit.key);
    if (!s.days) continue;
    const card = el("section", "pp-unit");
    card.appendChild(el("h3", "pp-unit-title", unit.districtLabel));
    const dl = el("dl", "pp-dl");
    const row = (k, v) => {
      dl.appendChild(el("dt", null, k));
      dl.appendChild(el("dd", null, v));
    };
    row("Planned", `${shortDate(s.plannedStart)} – ${shortDate(s.plannedEnd)}`);
    row("Now", `${shortDate(s.currentStart)} – ${shortDate(s.currentEnd)}`);
    row("Lessons", String(s.lessons));
    row("Assessment days", String(s.assessments));
    row("Project days", String(s.projectDays));
    row("Flex / catch-up", String(s.flexDays));
    row("Recorded", `${s.completed} of ${s.days} days`);
    card.appendChild(dl);

    const jump = el("button", "pp-btn pp-btn-quiet", "Open this unit's first day");
    jump.type = "button";
    jump.dataset.action = "goto";
    jump.dataset.date = s.currentStart;
    card.appendChild(jump);
    list.appendChild(card);
  }
  frag.appendChild(list);
  return frag;
}

/* ── Year ──────────────────────────────────────────────────────────────────── */

export function renderYear(days, index, ui) {
  const frag = document.createDocumentFragment();
  frag.appendChild(renderPacingSummary(days, ui));

  const table = el("table", "pp-year");
  table.appendChild(el("caption", "pp-sr", "Unit pacing across the year"));
  const thead = el("thead");
  const hr = el("tr");
  for (const h of [
    "Unit",
    "Quarter",
    "Dates",
    "Days",
    "Assessments",
    "Projects",
    "Flex",
    "Recorded",
  ]) {
    const th = el("th", null, h);
    th.scope = "col";
    hr.appendChild(th);
  }
  thead.appendChild(hr);
  table.appendChild(thead);
  const tbody = el("tbody");
  for (const unit of ui.baseline.units) {
    const s = unitSummary(days, unit.key);
    if (!s.days) continue;
    const tr = el("tr");
    const th = el("th", null, unit.districtLabel);
    th.scope = "row";
    tr.appendChild(th);
    const q = days.find((d) => d.date === s.currentStart)?.quarter || "";
    tr.appendChild(el("td", null, q));
    tr.appendChild(el("td", null, `${rangeDate(s.currentStart)} – ${rangeDate(s.currentEnd)}`));
    tr.appendChild(el("td", null, String(s.days)));
    tr.appendChild(el("td", null, String(s.assessments)));
    tr.appendChild(el("td", null, String(s.projectDays)));
    tr.appendChild(el("td", null, String(s.flexDays)));
    tr.appendChild(el("td", null, `${s.completed}/${s.days}`));
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  frag.appendChild(table);

  const events = el("section", "pp-year-events");
  events.appendChild(el("h3", "pp-sub", "Fixed calendar events"));
  const ul = el("ul", "pp-event-list");
  for (const d of days) {
    if (d.schoolStatus === "school" && !d.earlyRelease && !d.calendarNote) continue;
    if (d.schoolStatus === "school" && !d.earlyRelease) continue;
    const li = el("li");
    li.appendChild(el("span", "pp-event-date", rangeDate(d.date)));
    li.appendChild(el("span", "pp-event-name", d.calendarNote || d.statusLabel));
    ul.appendChild(li);
  }
  events.appendChild(ul);
  events.appendChild(
    el(
      "p",
      "pp-muted",
      `MCAP window: ${longDate(ui.baseline.mcapWindow.start)} – ${longDate(ui.baseline.mcapWindow.end)}. In-building testing dates are not set here; add them as locked days when you have them.`,
    ),
  );
  frag.appendChild(events);
  return frag;
}

/* ── Search ────────────────────────────────────────────────────────────────── */

export function renderSearch(days, index, ui, matches) {
  const frag = document.createDocumentFragment();
  frag.appendChild(
    el("p", "pp-result-count", `${matches.length} day${matches.length === 1 ? "" : "s"} match.`),
  );
  const list = el("ol", "pp-agenda");
  for (const day of matches.slice(0, 200)) {
    const li = el("li");
    const head = el("h3", "pp-agenda-day");
    const jump = el("button", "pp-linkish", longDate(day.date));
    jump.type = "button";
    jump.dataset.action = "goto";
    jump.dataset.date = day.date;
    head.appendChild(jump);
    li.appendChild(head);
    li.appendChild(el("p", "pp-agenda-title", titleFor(index, day)));
    const detail = detailFor(index, day);
    if (detail?.standard) li.appendChild(el("p", "pp-agenda-std", detail.standard));
    li.appendChild(el("p", "pp-agenda-status", statusWord(day)));
    list.appendChild(li);
  }
  frag.appendChild(list);
  return frag;
}

export { el, shifted };
