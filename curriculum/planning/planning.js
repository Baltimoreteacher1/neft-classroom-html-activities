/* planning.js — the controller for /curriculum/planning/.
 *
 * Holds the UI state, wires the actions, and owns the one rule the whole tool
 * rests on: a cascade is PREVIEWED and only written when the teacher presses
 * Apply. Every re-pacing action funnels through `preview()` — there is no path
 * from a button straight to a write.
 *
 * No inline handlers anywhere: one delegated click listener reads
 * `data-action`, which is also what the generated validator checks for.
 */

import {
  continueTomorrow,
  moveEarlier,
  moveLater,
  moveToDate,
  resolveYear,
  toWrites,
} from "/shared/pacing/engine.js";
import { buildDocx, buildXlsx } from "./planning-export.js";
import { detailFor, indexCurriculum, titleFor } from "./planning-resources.js";
import { SECTIONS, SHARED } from "/shared/pacing/sections.js";
import * as store from "./planning-store.js";
import {
  addDays,
  el,
  longDate,
  renderMonth,
  renderSearch,
  renderToday,
  renderUnits,
  renderWeek,
  renderYear,
  shifted,
  statusWord,
} from "./planning-views.js";

const root = document.querySelector(".planning-wrap");

/* Scoped to the DOCUMENT, not to .planning-wrap. The three <dialog> elements are
 * siblings of the wrapper rather than children of it — a dialog nested inside a
 * transformed/overflow-clipped container is a well-known way to lose the top
 * layer — so a wrapper-scoped lookup found none of them, and a wrapper-scoped
 * click listener never heard Apply. */
const $ = (role) => document.querySelector(`[data-role="${role}"]`);
const action = (name) => document.querySelector(`[data-action="${name}"]`);

const ui = {
  view: "today",
  /* The class being planned. "" is the shared plan every class inherits.
   * Everything downstream — the resolved year, the views, the day editor, the
   * re-pacing preview, undo — reads this one value. */
  section: "",
  focusDate: null,
  today: null,
  baseline: null,
  index: null,
  overlay: {},
  search: "",
  filter: "",
  pendingOp: null,
};

/* ── Save status ───────────────────────────────────────────────────────────────
 * Four states, and "Saved" is only ever set by a successful server write. A
 * planner that says Saved because localStorage accepted the edit teaches the
 * teacher to trust a claim it cannot back. */
function setSave(state, detail) {
  const node = $("save");
  const text = {
    saving: "Saving…",
    saved: "Saved",
    pending: "Not saved yet — retrying",
    failed: "Save failed",
    "read-only": "Read-only — enter your teacher key to save",
    loading: "Loading…",
  }[state];
  node.textContent = detail ? `${text} · ${detail}` : text;
  node.dataset.state = state;
}

async function refreshUndo() {
  try {
    const state = await store.fetchState(ui.section);
    ui.overlay = state.overlay || {};
    const last = (state.operations || []).find((o) => !o.undoneAt);
    const btn = action("undo");
    btn.disabled = !last;
    btn.title = last ? `Undo: ${last.summary}` : "";
  } catch {
    /* An unreachable endpoint must not disable the planner — the cached overlay
     * is still on screen and the outbox still holds anything unsent. */
  }
}

/* ── Rendering ─────────────────────────────────────────────────────────────── */

function resolved() {
  return resolveYear(ui.baseline, ui.overlay);
}

function matchesFilter(day) {
  if (!ui.filter) return true;
  if (ui.filter.startsWith("type:")) return day.plan.dayType === ui.filter.slice(5);
  if (ui.filter.startsWith("q:")) return day.quarter === ui.filter.slice(2);
  if (ui.filter === "shifted") return shifted(day);
  if (ui.filter === "untaught") return day.schoolStatus === "school" && !day.actual;
  if (ui.filter === "mcap") return day.mcapWindow;
  return true;
}

function searchMatches(days) {
  const q = ui.search.trim().toLowerCase();
  return days.filter((day) => {
    if (!matchesFilter(day)) return false;
    if (!q) return true;
    const detail = detailFor(ui.index, day);
    const haystack = [
      day.date,
      longDate(day.date),
      day.quarter,
      day.plan.dayType,
      day.plan.lessonId,
      titleFor(ui.index, day),
      detail?.standard,
      day.calendarNote,
      day.note,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

/* The five views, keyed by the same token the toolbar buttons carry in
 * `data-view` and the one `?view=` accepts. This map is the single list of
 * valid views: `readViewParam` tests membership against it, so a URL can never
 * select a view that has no renderer. */
const RENDERERS = {
  today: renderToday,
  week: renderWeek,
  month: renderMonth,
  unit: renderUnits,
  year: renderYear,
};

/** `?view=week` → "week". Anything unrecognised (or absent) returns null and the
 * planner opens on its default Today view rather than a blank page. */
function readViewParam() {
  const requested = new URLSearchParams(location.search).get("view");
  return requested && Object.hasOwn(RENDERERS, requested) ? requested : null;
}

/** Keep the address bar on the view being shown, so a teacher can bookmark or
 * paste "the Week view". `replaceState` — switching views is not a navigation,
 * and pushing would make Back walk the toolbar instead of leaving the planner. */
function writeViewParam() {
  const url = new URL(location.href);
  if (ui.view === "today") url.searchParams.delete("view");
  else url.searchParams.set("view", ui.view);
  history.replaceState(null, "", url);
}

function render() {
  const days = resolved();
  const main = $("main");
  main.textContent = "";

  const searching = ui.search.trim() || ui.filter;
  if (searching) {
    main.appendChild(renderSearch(days, ui.index, ui, searchMatches(days)));
    $("range").textContent = "Search results";
    return;
  }

  main.appendChild(RENDERERS[ui.view](days, ui.index, ui));
  $("range").textContent = rangeLabel();

  for (const b of root.querySelectorAll(".pp-view")) {
    const active = b.dataset.view === ui.view;
    b.setAttribute("aria-current", active ? "page" : "false");
  }
}

function rangeLabel() {
  if (ui.view === "today") return longDate(ui.focusDate);
  if (ui.view === "week") return `Week of ${longDate(ui.focusDate)}`;
  if (ui.view === "month") {
    return new Date(`${ui.focusDate}T12:00:00Z`).toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "long",
      year: "numeric",
    });
  }
  return "School year 2026–27";
}

/* ── Preview and apply ─────────────────────────────────────────────────────── */

function preview(op) {
  const dialog = $("preview-dialog");
  const body = $("preview-body");
  body.textContent = "";

  /* SCOPE FIRST, always. A re-pacing preview that does not say which class it
   * is about is how a teacher moves the whole grade believing they moved one
   * period. It is the first line of the dialog, before the summary. */
  const scope = el("p", "pp-preview-scope");
  scope.textContent = ui.section
    ? `This change applies to Class ${ui.section} only.`
    : "This changes the SHARED plan — all three classes inherit it.";
  body.appendChild(scope);

  if (!op.ok) {
    body.appendChild(el("p", "pp-refusal", op.reason));
    /* Refusal, never silent truncation: the engine declines rather than
     * dropping instruction off the end of the year, and the dialog says so in
     * the teacher's terms. */
    body.appendChild(
      el(
        "p",
        "pp-preview-note",
        "Nothing was changed. Free up a flex, catch-up or review day first, or move the lesson to a specific date.",
      ),
    );
    action("preview-apply").hidden = true;
  } else {
    action("preview-apply").hidden = false;
    body.appendChild(el("p", "pp-preview-summary", op.summary));
    /* How far the ripple reaches, in days, before the day-by-day list. The list
     * answers "which days"; this answers "how big is this?", which is the
     * question a teacher actually asks before pressing Apply. */
    const moved = op.changes.length;
    body.appendChild(
      el(
        "p",
        "pp-preview-scale",
        moved === 1
          ? "This moves 1 instructional day."
          : `This moves ${moved} instructional days.`,
      ),
    );
    const list = el("ol", "pp-preview-list");
    for (const c of op.changes) {
      const li = el("li");
      li.appendChild(el("span", "pp-preview-date", longDate(c.date)));
      li.appendChild(el("span", "pp-preview-change", `${describe(c.from)} → ${describe(c.to)}`));
      list.appendChild(li);
    }
    body.appendChild(list);
    if (op.absorbedAt) {
      body.appendChild(
        el(
          "p",
          "pp-preview-note",
          `The change is absorbed by the flex day on ${longDate(op.absorbedAt)} — nothing after that date moves.`,
        ),
      );
    }
    for (const d of op.routedAround) {
      body.appendChild(
        el("p", "pp-preview-note", `${longDate(d)} is locked, so it stayed where it is.`),
      );
    }
    if (op.crossesQuarter) {
      body.appendChild(el("p", "pp-preview-note", "This change crosses a quarter boundary."));
    }
    for (const w of op.warnings) body.appendChild(el("p", "pp-preview-warn", w));
  }

  const applyBtn = action("preview-apply");
  if (applyBtn && !applyBtn.hidden) {
    applyBtn.textContent = ui.section ? `Apply to Class ${ui.section}` : "Apply to the shared plan";
  }

  ui.pendingOp = op.ok ? op : null;
  dialog.showModal();
}

/* A preview line reading "1-1 → 1-1" is technically true and useless: the two
 * days are Day 1 and Day 2 of the same lesson. The planning title is what
 * distinguishes them, so it is shown whenever there is one. */
const describe = (plan) => {
  if (!plan) return "nothing";
  if (plan.planTitle)
    return plan.lessonId ? `${plan.lessonId} · ${plan.planTitle}` : plan.planTitle;
  return plan.lessonId || plan.dayType || "nothing";
};

/* ── Actions ───────────────────────────────────────────────────────────────── */

const ACTIONS = {
  "move-later": (days, date) => preview(moveLater(days, date)),
  "move-earlier": (days, date) => preview(moveEarlier(days, date)),
  continue: (days, date) => preview(continueTomorrow(days, date)),
};

/* Recording an actual is a plain write, not a cascade — the engine has no
 * opinion about what happened, only about what is scheduled. It is still one
 * operation with an inverse, so Undo covers it like any other change. */
async function markTaught(date, status) {
  const prior = ui.overlay[date]?.actual ?? null;
  await pushRaw({
    writes: [{ date, actual: { status } }],
    inverse: [{ date, actual: prior }],
    kind: "record",
    summary: `Record "${status}" on ${date}`,
  });
}

function openDayDialog(date) {
  const days = resolved();
  const day = days.find((d) => d.date === date);
  if (!day) return;
  const dialog = $("day-dialog");
  /* The dialog title names the CLASS and the day. An editor that says only
   * "Tuesday, September 15" is one mis-click away from editing the wrong
   * class's plan, and nothing on screen would have contradicted it. */
  document.querySelector("#pp-day-title").textContent = ui.section
    ? `Class ${ui.section} · ${longDate(date)}`
    : `Shared plan · ${longDate(date)}`;
  const body = $("day-dialog-body");
  body.textContent = "";

  body.appendChild(
    el(
      "p",
      "pp-dialog-lede",
      `${day.statusLabel}${day.calendarNote ? ` · ${day.calendarNote}` : ""}`,
    ),
  );
  body.appendChild(el("p", null, `Original plan: ${describe(day.original)}`));
  body.appendChild(el("p", null, `Current plan: ${describe(day.plan)}`));
  body.appendChild(el("p", null, `Actual: ${statusWord(day)}`));

  if (day.schoolStatus === "school") {
    body.appendChild(buildDayForm(day));
  }

  const history = el("section", "pp-history");
  history.appendChild(el("h3", "pp-sub", "Change history"));
  const list = el("ol", "pp-history-list");
  history.appendChild(list);
  body.appendChild(history);
  store
    .changesFor(date)
    .then((data) => {
      if (!data.changes.length) {
        list.appendChild(el("li", "pp-muted", "No changes recorded for this date."));
        return;
      }
      for (const c of data.changes) {
        list.appendChild(
          el(
            "li",
            null,
            `${new Date(c.ts).toLocaleString()} — ${c.field}: ${JSON.stringify(c.previous)} → ${JSON.stringify(c.next)}`,
          ),
        );
      }
    })
    .catch(() => list.appendChild(el("li", "pp-muted", "History is unavailable offline.")));

  dialog.showModal();
}

/** The Edit Day form. Lesson identity is a <select> over canonical lessons —
 * never a text field — so a typo cannot become a scheduled lesson. */
function buildDayForm(day) {
  const form = el("div", "pp-dayform");

  const lessonLabel = el("label", "pp-field", "Lesson");
  const select = el("select");
  select.dataset.field = "lessonId";
  select.appendChild(new Option("— no lesson —", ""));
  for (const l of ui.index.launch.lessons) {
    select.appendChild(new Option(`Unit ${l.unit} · ${l.id} · ${l.title}`, l.id));
  }
  select.value = day.plan.lessonId && ui.index.byId.get(day.plan.lessonId) ? day.plan.lessonId : "";
  lessonLabel.appendChild(select);
  form.appendChild(lessonLabel);

  const typeLabel = el("label", "pp-field", "Day type");
  const type = el("select");
  type.dataset.field = "dayType";
  for (const t of [
    "Core Lesson",
    "Continued Lesson",
    "Catch-Up",
    "Review",
    "Assessment",
    "Project",
    "Flex",
    "MCAP / Testing",
    "Lost Day",
  ]) {
    type.appendChild(new Option(t, t));
  }
  type.value = day.plan.dayType;
  typeLabel.appendChild(type);
  form.appendChild(typeLabel);

  const noteLabel = el("label", "pp-field", "Planning note");
  const note = el("textarea");
  note.dataset.field = "note";
  note.rows = 3;
  note.value = day.note || "";
  noteLabel.appendChild(note);
  form.appendChild(noteLabel);

  const lockLabel = el("label", "pp-field pp-field-check", "");
  const lock = el("input");
  lock.type = "checkbox";
  lock.dataset.field = "locked";
  lock.checked = day.locked;
  lockLabel.prepend(lock);
  lockLabel.append(" Lock this day — pacing changes route around it");
  form.appendChild(lockLabel);

  const moveLabel = el("label", "pp-field", "Move to a specific date");
  const moveTo = el("input");
  moveTo.type = "date";
  moveTo.dataset.field = "moveTo";
  moveTo.min = ui.baseline.firstStudentDay;
  moveTo.max = ui.baseline.lastStudentDay;
  moveLabel.appendChild(moveTo);
  form.appendChild(moveLabel);

  const actions = el("div", "pp-dialog-actions");
  const save = el("button", "pp-btn pp-btn-primary", "Save day");
  save.type = "button";
  save.dataset.action = "save-day";
  save.dataset.date = day.date;
  actions.appendChild(save);

  const move = el("button", "pp-btn pp-btn-quiet", "Preview move to date");
  move.type = "button";
  move.dataset.action = "move-to";
  move.dataset.date = day.date;
  actions.appendChild(move);

  /* Never a generic "Reset". Resetting a CLASS day drops that class's override
   * and returns it to the shared plan; resetting a shared day returns it to the
   * district baseline. Those are different acts and the button says which. */
  const reset = el(
    "button",
    "pp-btn pp-btn-quiet",
    ui.section
      ? `Reset Class ${ui.section} to the shared plan`
      : "Restore the original district plan",
  );
  reset.type = "button";
  reset.dataset.action = "reset-day";
  reset.dataset.date = day.date;
  actions.appendChild(reset);
  form.appendChild(actions);
  return form;
}

async function saveDayForm(date) {
  const body = $("day-dialog-body");
  const value = (field) => body.querySelector(`[data-field="${field}"]`);
  const days = resolved();
  const day = days.find((d) => d.date === date);
  const plan = {
    ...day.plan,
    lessonId: value("lessonId").value || null,
    dayType: value("dayType").value,
  };
  /* A hand-picked lesson gets the curriculum's own title, so planTitle is
   * dropped — it only ever holds a planning decision. */
  if (plan.lessonId !== day.plan.lessonId) plan.planTitle = null;

  const prior = ui.overlay[date] || {};
  await pushRaw({
    writes: [
      {
        date,
        plan,
        note: value("note").value || null,
        locked: value("locked").checked,
      },
    ],
    inverse: [
      {
        date,
        plan: prior.plan ?? day.original,
        note: prior.note ?? null,
        locked: Boolean(prior.locked),
      },
    ],
    kind: "edit-day",
    summary: `Edit ${date}`,
  });
  $("day-dialog").close();
}

async function pushRaw(op) {
  setSave("saving");
  /* Stamped with the class at QUEUE time, not at send time — an edit made in
   * 601 while offline must replay into 601 even if the teacher has since
   * switched to 602. */
  const result = await store.enqueue(op, ui.section);
  ui.overlay = store.cachedOverlay(ui.section);
  render();
  setSave(result.status === "saved" ? "saved" : "pending", result.error);
  if (result.status === "saved") refreshUndo();
}

/* ── Navigation ────────────────────────────────────────────────────────────── */

function step(direction) {
  if (ui.view === "week") ui.focusDate = addDays(ui.focusDate, 7 * direction);
  else if (ui.view === "month") {
    const [y, m] = ui.focusDate.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1 + direction, 1));
    ui.focusDate = next.toISOString().slice(0, 10);
  } else {
    const days = resolved();
    const i = days.findIndex((d) => d.date === ui.focusDate);
    const target = days[Math.max(0, Math.min(days.length - 1, i + direction))];
    if (target) ui.focusDate = target.date;
  }
  render();
}

/** The date the planner opens on: today when the year is running, otherwise the
 * nearest school day, so it never opens on a blank August in July. */
function openingDate(baseline) {
  const today = new Date().toISOString().slice(0, 10);
  if (today < baseline.firstStudentDay) return baseline.firstStudentDay;
  if (today > baseline.lastStudentDay) return baseline.lastStudentDay;
  const exact = baseline.days.find((d) => d.date === today);
  if (exact) return today;
  return baseline.days.find((d) => d.date > today)?.date || baseline.lastStudentDay;
}

/* ── Events ────────────────────────────────────────────────────────────────── */

document.addEventListener("click", async (event) => {
  const trigger = event.target.closest("[data-action], .pp-view");
  if (!trigger) return;
  const days = resolved();
  const { action, date } = trigger.dataset;

  if (trigger.classList.contains("pp-view")) {
    ui.view = trigger.dataset.view;
    ui.search = "";
    $("search").value = "";
    writeViewParam();
    render();
    return;
  }

  event.preventDefault();
  switch (action) {
    case "prev":
      step(-1);
      break;
    case "next":
      step(1);
      break;
    case "today-jump":
      ui.focusDate = ui.today;
      render();
      break;
    case "goto":
      ui.focusDate = date;
      ui.view = "today";
      ui.search = "";
      $("search").value = "";
      writeViewParam();
      render();
      break;
    case "open-day":
    case "edit":
      openDayDialog(date);
      break;
    case "mark-taught":
      await markTaught(date, "taught-as-planned");
      break;
    case "save-day":
      await saveDayForm(date);
      break;
    case "reset-day":
      await store.resetDay(date, ui.section);
      ui.overlay = store.cachedOverlay(ui.section);
      await refreshUndo();
      render();
      $("day-dialog").close();
      break;
    case "move-to": {
      const target = $("day-dialog-body").querySelector('[data-field="moveTo"]').value;
      if (!target) break;
      $("day-dialog").close();
      preview(moveToDate(days, date, target));
      break;
    }
    case "preview-cancel":
      ui.pendingOp = null;
      $("preview-dialog").close();
      break;
    case "preview-apply": {
      const op = ui.pendingOp;
      $("preview-dialog").close();
      ui.pendingOp = null;
      if (op) {
        const { writes, inverse } = toWrites(op, Date.now());
        await pushRaw({ writes, inverse, kind: op.kind, summary: op.summary });
      }
      break;
    }
    case "undo":
      setSave("saving");
      try {
        await store.undoLast(ui.section);
        ui.overlay = store.cachedOverlay(ui.section);
        await refreshUndo();
        render();
        setSave("saved");
      } catch (err) {
        setSave("failed", err.message);
      }
      break;
    case "export-docx":
      await runExport(trigger, () => buildDocx(resolved(), ui.index, ui.baseline));
      break;
    case "export-xlsx":
      await runExport(trigger, () => buildXlsx(resolved(), ui.index, ui.baseline));
      break;
    case "print":
      window.print();
      break;
    case "assumptions":
      showAssumptions();
      break;
    default:
      if (ACTIONS[action]) ACTIONS[action](days, date);
  }
});

/* Storing the key re-runs the connect step rather than reloading: a reload would
 * throw away anything already queued in the outbox. */
document.addEventListener("submit", async (event) => {
  if (event.target.dataset.role !== "keyform") return;
  event.preventDefault();
  const field = $("key");
  if (!field.value.trim()) return;
  store.setKey(field.value);
  field.value = "";
  $("keyform").hidden = true;
  await connect();
});

document.addEventListener("input", (event) => {
  if (event.target.dataset.role === "search") {
    ui.search = event.target.value;
    render();
  }
  if (event.target.dataset.role === "filter") {
    ui.filter = event.target.value;
    render();
  }
});

function showAssumptions() {
  const body = $("info-body");
  body.textContent = "";
  body.appendChild(
    el(
      "p",
      "pp-muted",
      "Every planning decision behind the original schedule, with where it came from.",
    ),
  );
  const list = el("ul", "pp-assumptions");
  for (const a of ui.baseline.assumptions) {
    const li = el("li");
    li.appendChild(el("span", "pp-chip pp-chip-tag", a.tag));
    li.appendChild(el("span", null, ` ${a.text}`));
    list.appendChild(li);
  }
  body.appendChild(list);
  $("info-dialog").showModal();
}

/* Exports are two plain buttons rather than one that asks which format. The
 * older version used window.prompt("type 1 or 2"), which is not a choice a
 * teacher should have to read. The button reports its own progress and its own
 * failure, because the docx library is a 1.1 MB lazy load that can fail. */
async function runExport(button, run) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = "Preparing…";
  try {
    await run();
    button.textContent = label;
  } catch (err) {
    button.textContent = label;
    setSave("failed", err.message);
  } finally {
    button.disabled = false;
  }
}

/* ── Boot ──────────────────────────────────────────────────────────────────── */

async function boot() {
  setSave("loading");
  const { baseline, launch } = await store.loadReference();
  ui.baseline = baseline;
  ui.index = indexCurriculum(launch);
  ui.today = openingDate(baseline);
  ui.focusDate = ui.today;
  ui.view = readViewParam() || ui.view;
  /* The class comes from the URL first (so a bookmarked or shared planner link
   * opens on the right class), then from the shared teacher-workflow key the
   * curriculum hub already writes. Never a planner-only preference — picking 602
   * here and picking 602 on the hub have to be the same act. */
  const urlSection = new URLSearchParams(location.search).get("section");
  ui.section = urlSection ? store.setActiveSection(urlSection) : store.activeSection();
  buildScopeTabs();
  ui.overlay = store.cachedOverlay(ui.section);
  render();

  if (!store.getKey()) {
    $("keyform").hidden = false;
    setSave("read-only");
    return;
  }

  await connect();
}

/* ── Class scope ───────────────────────────────────────────────────────────── */

const scopeLabel = (section) => (section ? `Class ${section}` : "the shared plan");

/** Build the class tabs from the canonical section list — never a second
 *  hardcoded list of 601/602/603 in the planner. */
function buildScopeTabs() {
  const host = document.querySelector(".pp-scope-tabs");
  if (!host) return;
  host.textContent = "";
  for (const value of [SHARED, ...SECTIONS]) {
    const id = `pp-scope-${value || "shared"}`;
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "pp-scope";
    input.id = id;
    input.value = value;
    input.checked = value === ui.section;
    input.addEventListener("change", () => switchSection(value));
    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.textContent = value || "Shared";
    host.append(input, label);
  }
  announceScope();
}

/** Say the scope in words, for the teacher and the screen reader alike — the
 *  checked tab's colour is never the only signal. */
function announceScope() {
  const now = document.querySelector('[data-role="scope-now"]');
  if (!now) return;
  now.textContent = "";
  if (ui.section) {
    now.append(`Planning for Class ${ui.section}`);
  } else {
    const span = el("span", "pp-scope-shared");
    span.textContent = "Planning the shared plan — changes reach all three classes";
    now.append(span);
  }
}

/**
 * Switch class WITHOUT losing the teacher's place.
 *
 * The view, the focused date, the search text and the filter all survive:
 * "the same week for my next class" is the main reason this control exists, and
 * a switch that threw the teacher back to Today would defeat it. Only the plan
 * underneath changes.
 */
async function switchSection(next) {
  if (next === ui.section) return;
  ui.section = store.setActiveSection(next);
  announceScope();
  // Re-compose from cache first so the switch is instant and works offline…
  ui.overlay = store.cachedOverlay(ui.section);
  render();
  // …then reconcile with the server for the layer we have not fetched yet.
  await connect();
}

/** Fetch the live overlay, drain anything queued, and start watching the
 * network. Called on boot with a stored key, and again when one is entered. */
async function connect() {
  try {
    const state = await store.fetchState(ui.section);
    ui.overlay = state.overlay || {};
    render();
    if (store.pendingCount()) {
      const drained = await store.drain();
      setSave(drained.status === "saved" ? "saved" : "pending", drained.error);
    } else {
      setSave("saved");
    }
    await refreshUndo();
  } catch (err) {
    if (err.status === 401) {
      setSave("read-only", "That key was not accepted.");
      $("keyform").hidden = false;
      return;
    }
    setSave("pending", err.message);
  }

  store.watchConnectivity((result) => {
    ui.overlay = store.cachedOverlay(ui.section);
    render();
    setSave(result.status === "saved" ? "saved" : "pending", result.error);
  });
}

boot().catch((err) => {
  $("main").textContent = "";
  $("main").appendChild(
    el("p", "pp-refusal", `The planner could not load: ${err.message}. Reload to try again.`),
  );
  setSave("failed", err.message);
});

export { ui, render };
