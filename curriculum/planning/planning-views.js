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

  /* CLASS AND DATE TOGETHER. The scope banner above says which class, but Today
   * is the view a teacher reads at 7:40am without looking anywhere else, so it
   * repeats it rather than relying on chrome further up the page. */
  const head = el("p", "pp-today-scope");
  head.append(
    el("span", "pp-today-class", ui.section ? `Class ${ui.section}` : "Shared plan"),
    el("span", "pp-today-date", longDate(day.date)),
  );
  card.appendChild(head);

  if (day.schoolStatus !== "school") {
    card.appendChild(el("p", "pp-today-closed", day.calendarNote || day.statusLabel));
    card.appendChild(el("p", "pp-muted", "No instruction is scheduled. Nothing to record."));
    frag.appendChild(card);
    frag.appendChild(renderPacingSummary(days, ui));
    return frag;
  }

  /* PLANNED VERSUS ACTUAL, FIRST AND SIDE BY SIDE.
   *
   * These used to be two plain sentences at the bottom of the card, below four
   * lists of links. They are the two facts the whole view exists to deliver —
   * "what was I going to teach" and "where did this class actually get to" — and
   * when they disagree that difference is the single most important thing on the
   * screen. Neither is labelled "Current": that word was doing double duty and
   * meant whichever of the two the reader already had in mind. */
  const pair = el("div", "pp-pa");
  const planned = el("div", "pp-pa-cell");
  planned.append(el("span", "pp-pa-label", "Planned"), el("strong", "pp-pa-value", titleFor(index, day)));
  const actual = el("div", "pp-pa-cell");
  actual.append(el("span", "pp-pa-label", "Actual"), el("strong", "pp-pa-value", statusWord(day)));
  if (day.actual && day.actual.status && day.actual.status !== "not-yet-taught") {
    actual.classList.add("pp-pa-recorded");
  }
  pair.append(planned, actual);
  card.appendChild(pair);

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

  /* THE THREE DIRECT ACTIONS. The planner must not be a dead-end calendar, and
   * these are the three places a teacher actually goes from it. They are lifted
   * out of the general resource lists — which remain below, collapsed — because
   * being one of nine links is not the same as being the thing you came for. */
  const res = resourcesFor(index, day);
  const go = el("div", "pp-go");
  const primary = res.whole[0];
  if (primary) {
    const a = el("a", "pp-btn pp-btn-primary", "Open Whole Group");
    a.href = primary.href;
    go.appendChild(a);
  }
  if (res.smallGroup.length) {
    const a = el("a", "pp-btn", "Small Groups");
    a.href = res.smallGroup[0].href;
    go.appendChild(a);
  }
  if (detail?.id) {
    const a = el("a", "pp-btn", "Student Supports");
    /* The class travels with the link, so Supports opens on the same class the
     * planner is showing rather than whatever it last remembered. */
    a.href = `/curriculum/student-supports/?lesson=${encodeURIComponent(detail.id)}${
      ui.section ? `&section=${encodeURIComponent(ui.section)}` : ""
    }`;
    go.appendChild(a);
  }
  if (go.childNodes.length) card.appendChild(go);

  /* SUPPORT STATUS — a restrained count, never the editor itself. */
  const supports = detail?.id ? supportStatus(detail.id, ui.section) : null;
  if (supports) {
    card.appendChild(
      el(
        "p",
        "pp-today-supports",
        supports.count > 0
          ? `Supports · ${supports.count} active${ui.section ? ` for Class ${ui.section}` : ""}`
          : "No supports configured for this class and lesson",
      ),
    );
  }

  /* ROUTINE PLANNING ACTIONS, in reach without opening an editor. */
  const record = el("section", "pp-record");
  record.appendChild(el("h4", "pp-sub", "Record and adjust"));
  if (day.note) record.appendChild(el("p", "pp-note", day.note));
  record.appendChild(dayActions(day));
  card.appendChild(record);

  /* Everything else the day offers, collapsed. It is genuinely useful and
   * genuinely secondary, and open-by-default it pushed the actions above out of
   * the first screen. */
  const more = el("details", "pp-more");
  more.appendChild(el("summary", null, "All resources for this lesson"));
  if (res.whole.length) more.appendChild(linkList(res.whole, "pp-links-primary"));
  if (res.smallGroup.length) {
    more.appendChild(el("h4", "pp-sub", "Small group"));
    more.appendChild(linkList(res.smallGroup));
  }
  if (res.student.length) {
    more.appendChild(el("h4", "pp-sub", "Student materials"));
    more.appendChild(linkList(res.student));
  }
  more.appendChild(el("h4", "pp-sub", "Planning"));
  more.appendChild(linkList(res.teacher));
  card.appendChild(more);

  frag.appendChild(card);
  frag.appendChild(renderPacingSummary(days, ui));
  return frag;
}

/* ── Class-aware status helpers ────────────────────────────────────────────────
 * These answer questions the engine already has the data for but no view was
 * asking. Each is deliberately conservative: where the data cannot support a
 * statement, they return null and the view renders nothing rather than a
 * confident-looking guess. */

const ABSORBERS = new Set(["Flex", "Catch-Up", "Review"]);

/**
 * Core-lesson progress for a unit.
 *
 * "Core lesson" means a Core Lesson day, NOT every instructional day: counting
 * the review, the assessment and the catch-up as lessons inflates every unit and
 * makes "8 of 12" meaningless. Continued Lesson days are excluded from the
 * denominator too — a lesson split across two days is one lesson, and counting
 * the continuation would make finishing a unit look like falling behind.
 */
export function coreProgress(days, unitKey) {
  const core = days.filter(
    (d) =>
      d.plan.unitKey === unitKey &&
      d.plan.dayType === "Core Lesson" &&
      d.schoolStatus === "school",
  );
  if (!core.length) return null;
  const taught = core.filter((d) => d.actual && d.actual.status !== "not-yet-taught").length;
  return { taught, total: core.length };
}

/**
 * How far a unit has drifted from the district plan, in instructional days.
 *
 * Measured at the unit's START, not its end: the start is where the drift was
 * inherited from everything before it, and the end also moves for reasons
 * internal to the unit. Returns null when either date is missing, which happens
 * for units the current plan no longer schedules.
 */
export function unitVariance(days, summary) {
  if (!summary.plannedStart || !summary.currentStart) return null;
  if (summary.plannedStart === summary.currentStart) return 0;
  const [a, b] =
    summary.currentStart > summary.plannedStart
      ? [summary.plannedStart, summary.currentStart]
      : [summary.currentStart, summary.plannedStart];
  const between = days.filter(
    (d) => d.date >= a && d.date < b && d.schoolStatus === "school",
  ).length;
  return summary.currentStart > summary.plannedStart ? between : -between;
}

/** The next day that can absorb a ripple, on or after `fromDate`. Null when the
 *  rest of the year has none — which is the answer a teacher most needs. */
export function nextAbsorber(days, fromDate) {
  const hit = days.find(
    (d) => d.date >= fromDate && d.schoolStatus === "school" && ABSORBERS.has(d.plan.dayType),
  );
  return hit ? { date: hit.date, dayType: hit.plan.dayType } : null;
}

/**
 * How many supports this CLASS has configured for this lesson.
 *
 * Reads the support store directly rather than duplicating its resolution: the
 * store already flattens all-class configuration under a per-class override, so
 * asking it is the only way to get the number the Supports page would show.
 * Returns null when the support layer is not loaded, so the planner degrades to
 * saying nothing instead of claiming zero.
 */
export function supportStatus(lessonId, section) {
  if (!lessonId) return null;
  const LS = typeof window !== "undefined" ? window.EWLLessonSupports : null;
  if (!LS || typeof LS.loadProfile !== "function") return null;
  try {
    const profile = LS.loadProfile(lessonId, section);
    /* A profile stores its supports in `keys`, an ARRAY — not as boolean
     * properties on the profile object. Counting truthy own-properties (the
     * first version of this) counted `schemaVersion` and `lessonId` and missed
     * every actual support, so the planner reported "No supports configured" for
     * a lesson that had five. */
    const keys = Array.isArray(profile?.keys) ? profile.keys : [];
    return { count: keys.length, preset: profile?.preset ?? null };
  } catch {
    return null;
  }
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
    /* The unit rides under the day name rather than in a sixth column. A week
     * table that a teacher scans in two seconds is worth more than one that
     * tabulates everything, and the unit is context for the row, not a value
     * being compared down the column. */
    const weekUnit = day.schoolStatus === "school" ? unitNumberOf(index, day) : null;
    if (weekUnit) th.appendChild(el("span", "pp-week-unit", `Unit ${weekUnit}`));
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

    /* Status plus the day's exceptional states, as WORDS. Locked and Shifted
     * were only visible after opening the row's details, so a week with three
     * locked days looked identical to a week with none. */
    const statusCell = el("td", "pp-week-status");
    statusCell.appendChild(el("span", null, statusWord(day)));
    if (day.schoolStatus === "school") {
      const flags = [];
      if (day.locked) flags.push(["lock", "Locked"]);
      if (shifted(day)) flags.push(["shift", "Changed"]);
      if (day.earlyRelease) flags.push(["short", "Half day"]);
      if (flags.length) {
        const wrap = el("span", "pp-week-flags");
        for (const [kind, label] of flags) {
          wrap.appendChild(el("span", `pp-chip pp-chip-${kind}`, label));
        }
        statusCell.appendChild(wrap);
      }
    }
    tr.appendChild(statusCell);

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

/**
 * A one-or-two word marker for a day type that is not an ordinary lesson.
 * Assessment, Review, Catch-Up, Flex and Project are the days a teacher scans a
 * month FOR — they are where the give is and where the deadlines are — so they
 * get a word of their own rather than being inferred from a missing lesson id.
 */
const MONTH_MARKER = {
  Assessment: "Assessment",
  Review: "Review",
  "Catch-Up": "Catch-up",
  Flex: "Flex",
  Project: "Project",
  "MCAP / Testing": "MCAP",
  "Lost Day": "Lost day",
  "Continued Lesson": "Continued",
};

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
    const isToday = day.date === ui.today;
    const classes = ["pp-cell"];
    if (day.schoolStatus !== "school") classes.push("pp-cell-closed");
    if (isToday) classes.push("pp-cell-today");
    const td = el("td", classes.join(" "));
    td.dataset.date = day.date;

    const btn = el("button", "pp-cell-btn");
    btn.type = "button";
    btn.dataset.action = "open-day";
    btn.dataset.date = day.date;

    const dateLine = el("span", "pp-cell-date");
    dateLine.append(String(Number(day.date.slice(8))));
    /* "Today" as a word, not only a coloured border — the border is the glance,
     * the word is what a screen reader and a colour-blind reader get. */
    if (isToday) dateLine.appendChild(el("span", "pp-cell-today-tag", "Today"));
    btn.appendChild(dateLine);

    if (day.calendarNote) btn.appendChild(el("span", "pp-cell-event", day.calendarNote));

    if (day.schoolStatus === "school") {
      /* SHORTHAND, NOT THE TITLE. The full lesson title used to go in this cell;
       * at a month's column width it wrapped to four lines, pushed every row
       * taller than the screen, and still could not be read at a glance. The
       * lesson id is the shorthand a teacher already thinks in, and the full
       * title is one click away in the day drawer. */
      const unit = unitNumberOf(index, day);
      const marker = MONTH_MARKER[day.plan.dayType];
      if (day.plan.lessonId) {
        btn.appendChild(el("span", "pp-cell-id", day.plan.lessonId));
      } else if (marker) {
        btn.appendChild(el("span", "pp-cell-marker", marker));
      }
      /* A lesson day that is ALSO a marked type (a continued lesson) says both. */
      if (day.plan.lessonId && marker) {
        btn.appendChild(el("span", "pp-cell-marker", marker));
      }
      if (unit) {
        /* Unit identity is carried by a single left edge colour, keyed by unit
         * number, plus the unit as text. One accent per cell — not a rainbow. */
        td.classList.add(`pp-unit-${unit}`);
        btn.appendChild(el("span", "pp-cell-unit", `Unit ${unit}`));
      }
      if (day.locked) btn.appendChild(el("span", "pp-cell-flag", "Locked"));
      else if (shifted(day)) btn.appendChild(el("span", "pp-cell-flag", "Changed"));

      /* The accessible name carries everything the cell shows plus the title the
       * cell deliberately omits, so the drill-in target is never just a number. */
      btn.setAttribute(
        "aria-label",
        [
          longDate(day.date),
          unit ? `Unit ${unit}` : null,
          titleFor(index, day),
          statusWord(day),
          day.locked ? "Locked" : shifted(day) ? "Changed from the district plan" : null,
          isToday ? "Today" : null,
        ]
          .filter(Boolean)
          .join(" · "),
      );
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
  frag.appendChild(renderMonthAgenda(inMonth, index, ui));
  return frag;
}

/**
 * The month's mobile presentation: grouped BY WEEK, not one flat list of
 * twenty-odd days.
 *
 * Month used to reuse the week agenda, which rendered every day of the month as
 * a card with a full action row — a 390px scroll of roughly two thousand pixels
 * with no structure to orient in. Weeks are the unit a teacher navigates a month
 * in, so they are the grouping, and the day rows are one line each with the
 * drill-in button doing the work.
 */
function renderMonthAgenda(inMonth, index, ui) {
  const wrap = el("div", "pp-month-agenda");
  let current = null;
  let list = null;
  for (const day of inMonth) {
    const start = weekStart(day.date);
    if (start !== current) {
      current = start;
      const section = el("section", "pp-month-week");
      section.appendChild(el("h3", "pp-month-week-title", `Week of ${rangeDate(start)}`));
      list = el("ol", "pp-month-days");
      section.appendChild(list);
      wrap.appendChild(section);
    }
    const li = el("li", day.schoolStatus === "school" ? "" : "pp-agenda-closed");
    const btn = el("button", "pp-month-day");
    btn.type = "button";
    btn.dataset.action = "open-day";
    btn.dataset.date = day.date;
    btn.appendChild(el("span", "pp-month-day-date", shortDate(day.date)));
    btn.appendChild(
      el(
        "span",
        "pp-month-day-what",
        day.schoolStatus === "school"
          ? titleFor(index, day)
          : day.calendarNote || day.statusLabel,
      ),
    );
    if (day.date === ui.today) btn.appendChild(el("span", "pp-cell-today-tag", "Today"));
    li.appendChild(btn);
    list.appendChild(li);
  }
  return wrap;
}

/* ── Units ─────────────────────────────────────────────────────────────────── */

export function renderUnits(days, index, ui) {
  const frag = document.createDocumentFragment();

  /* The Units view answers one question the other four cannot: "are we on pace,
   * and where is the give?" So it leads with progress and drift, and the raw
   * day-type counts move below them — they are the evidence, not the answer.
   *
   * Order is the DISTRICT sequence, because ui.baseline.units is generated from
   * the pacing plan. Never re-sorted here; validate:pacing-unit-order fails if
   * it ever is. */
  const list = el("div", "pp-units");
  for (const unit of ui.baseline.units) {
    const s = unitSummary(days, unit.key);
    if (!s.days) continue;

    const card = el("section", "pp-unit");
    card.appendChild(el("h3", "pp-unit-title", unit.districtLabel));

    /* PROGRESS, in core lessons. */
    const progress = coreProgress(days, unit.key);
    if (progress) {
      const line = el("p", "pp-unit-progress");
      line.append(
        el("strong", null, `${progress.taught} of ${progress.total}`),
        ` core lesson${progress.total === 1 ? "" : "s"} recorded`,
      );
      card.appendChild(line);
      /* A meter, not a bare bar: it carries its own value and range to a screen
       * reader, and the sentence above says the same thing in words. */
      const meter = el("div", "pp-meter");
      meter.setAttribute("role", "meter");
      meter.setAttribute("aria-valuenow", String(progress.taught));
      meter.setAttribute("aria-valuemin", "0");
      meter.setAttribute("aria-valuemax", String(progress.total));
      meter.setAttribute(
        "aria-label",
        `${unit.districtLabel}: ${progress.taught} of ${progress.total} core lessons recorded`,
      );
      const fill = el("span", "pp-meter-fill");
      fill.style.width = `${Math.round((progress.taught / progress.total) * 100)}%`;
      meter.appendChild(fill);
      card.appendChild(meter);
    }

    /* VARIANCE against the district plan, in words. A moved unit is normal, so
     * this is stated flatly and never styled as an error. */
    const variance = unitVariance(days, s);
    if (variance !== null) {
      const word =
        variance === 0
          ? "Starts on the district date"
          : variance > 0
            ? `Starts ${variance} instructional day${variance === 1 ? "" : "s"} later than the district plan`
            : `Starts ${-variance} instructional day${variance === -1 ? "" : "s"} earlier than the district plan`;
      card.appendChild(el("p", "pp-unit-variance", word));
    }

    /* WHERE THE GIVE IS. The absorber is what decides whether the next
     * "continue tomorrow" is free or expensive, so it belongs here rather than
     * only inside a preview the teacher has to open to see. */
    const absorber = s.currentStart ? nextAbsorber(days, s.currentStart) : null;
    card.appendChild(
      el(
        "p",
        "pp-unit-slack",
        absorber
          ? `Next absorber: ${absorber.dayType} on ${rangeDate(absorber.date)}`
          : "No flex, catch-up or review day left in this unit's span",
      ),
    );

    const dl = el("dl", "pp-dl");
    const row = (k, v) => {
      dl.appendChild(el("dt", null, k));
      dl.appendChild(el("dd", null, v));
    };
    /* rangeDate, not shortDate: a unit span crosses a month boundary in nine of
     * eleven units, and "Mon 24 – Tue 8" does not say which months. The same
     * applies to a standalone absorber date. */
    row("District plan", `${rangeDate(s.plannedStart)} – ${rangeDate(s.plannedEnd)}`);
    row("Current plan", `${rangeDate(s.currentStart)} – ${rangeDate(s.currentEnd)}`);
    row("Assessment days", String(s.assessments));
    row("Project days", String(s.projectDays));
    row("Flex / catch-up", String(s.flexDays));
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

export function renderYear(days, index, ui) {
  const frag = document.createDocumentFragment();
  frag.appendChild(renderPacingSummary(days, ui));

  /* WHERE ARE WE. The year view's first job is to answer that, and it could not:
   * it listed every unit identically, so finding the current one meant reading
   * eleven date ranges against today's date. */
  const todayDay = days.find((d) => d.date === ui.today);
  const currentUnitKey = todayDay?.plan?.unitKey ?? null;

  const table = el("table", "pp-year");
  table.appendChild(el("caption", "pp-sr", "Unit pacing across the year"));
  const thead = el("thead");
  const hr = el("tr");
  /* Seven headers for seven cells. The last column holds the drill-in button;
     its header is visually hidden but present, because a data cell with no
     column header is exactly what a screen-reader table walk trips over. */
  for (const h of [
    "Unit",
    "Quarter",
    "District plan",
    "Current plan",
    "Core lessons",
    "Change",
    "Open",
  ]) {
    const th = el("th", h === "Open" ? "pp-sr" : null, h);
    th.scope = "col";
    hr.appendChild(th);
  }
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = el("tbody");
  for (const unit of ui.baseline.units) {
    const s = unitSummary(days, unit.key);
    if (!s.days) continue;
    const isCurrent = unit.key === currentUnitKey;
    const tr = el("tr", isCurrent ? "pp-year-current" : "");

    const th = el("th", null);
    th.scope = "row";
    th.appendChild(el("span", "pp-year-unit", unit.districtLabel));
    /* The current unit says so in a word. Row shading alone is a colour-only
     * signal, and this table is read at a glance by exactly the person who most
     * needs to find this row. */
    if (isCurrent) th.appendChild(el("span", "pp-year-now", "Teaching now"));
    tr.appendChild(th);

    const q = days.find((d) => d.date === s.currentStart)?.quarter || "";
    tr.appendChild(el("td", null, q));

    /* Both spans, side by side. The district plan was not shown at all, so a
     * unit that had moved three weeks looked exactly like one that had not. */
    tr.appendChild(
      el("td", null, `${rangeDate(s.plannedStart)} – ${rangeDate(s.plannedEnd)}`),
    );
    tr.appendChild(el("td", null, `${rangeDate(s.currentStart)} – ${rangeDate(s.currentEnd)}`));

    /* Core lessons, not days: the old column read "completed/days", which counted
     * the review, the assessment and the flex day as things to complete. */
    const progress = coreProgress(days, unit.key);
    tr.appendChild(
      el("td", null, progress ? `${progress.taught} of ${progress.total}` : "—"),
    );

    const variance = unitVariance(days, s);
    tr.appendChild(
      el(
        "td",
        "pp-year-variance",
        variance === null
          ? "—"
          : variance === 0
            ? "On the district date"
            : variance > 0
              ? `${variance} day${variance === 1 ? "" : "s"} later`
              : `${-variance} day${variance === -1 ? "" : "s"} earlier`,
      ),
    );

    /* Year → Unit → date, without navigating back through Units first. */
    const openCell = el("td", "pp-year-open");
    const jump = el("button", "pp-btn pp-btn-quiet", "Open");
    jump.type = "button";
    jump.dataset.action = "goto";
    jump.dataset.date = s.currentStart;
    jump.setAttribute("aria-label", `Open ${unit.districtLabel} at ${rangeDate(s.currentStart)}`);
    openCell.appendChild(jump);
    tr.appendChild(openCell);

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
