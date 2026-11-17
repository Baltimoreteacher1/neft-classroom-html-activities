// Goal-setting form (Toolkit): pick a grade, a skill and a goal from drop-downs, tick the steps and supports, and get a
// finished sheet to print, save as PDF, download as Word or copy. One sheet in the student's words, one teacher record
// (measurable goal), or both. English, Spanish or both. For one student or the whole class. Saving a goal writes it
// to the student's record in the studio, so the Students panel and the conference sheet show it too.
// The goal bank, the sheet and the Word writer are shared with the lab (access-practice-lab/src/goals/).
import {
  CELEBRATIONS,
  CHECKINS,
  FAMILY_SUPPORTS,
  LANGS,
  LEVELS,
  MEASURES,
  REFLECTIONS,
  SHEET_STYLES,
  TEACHER_SUPPORTS,
  TIMEFRAMES,
} from "/access-practice-lab/src/goals/options.js";
import {
  DOMAIN_NAME,
  GOAL_DOMAINS,
  GRADES,
  bandOfGrade,
  inRange,
  levelOption,
  lowestDomain,
  suggestGoal,
} from "/access-practice-lab/src/goals/model.js";
import {
  MAX_GOALS,
  buildSheet,
  emptyForm,
  emptyGoal,
  sheetHTML,
  sheetText,
} from "/access-practice-lab/src/goals/sheet.js";
import { sheetDocx, DOCX_MIME } from "/access-practice-lab/src/goals/docx.js";
import {
  clearForm,
  download,
  fileName,
  loadBank,
  loadForm,
  printSheets,
  saveForm,
} from "/access-practice-lab/src/goals/store.js";
import { h } from "./dom.js";
import { recordsOf } from "./records.js";

const lang = (f) => (f.lang === "es" ? 1 : 0);
const T = (f, pair) => pair[lang(f)] ?? pair[0];
const STUDIO_DOMAIN = {
  listening: "Listening",
  speaking: "Speaking",
  reading: "Reading",
  writing: "Writing",
  habits: "Habits",
};

/** What the studio knows about a student: grade, overall level, each skill's level. */
function profileOf(st) {
  const rec = st ? recordsOf(st).at(-1) : null;
  if (!rec) return { grade: "", level: "", domains: {} };
  const domains = {};
  for (const d of ["Listening", "Speaking", "Reading", "Writing"])
    domains[d.toLowerCase()] = rec.domains?.[d]?.level ?? null;
  return {
    grade: rec.grade == null ? "" : String(rec.grade),
    level: levelOption(rec.composites?.Overall?.level),
    domains,
  };
}

function field(label, control, { sm = false } = {}) {
  const id = control.id || `gf-${Math.random().toString(36).slice(2, 8)}`;
  control.id = id;
  return h(
    "div",
    { class: `pi-field${sm ? " pi-field-sm" : ""}` },
    h("label", { for: id }, label),
    control,
  );
}
const select = (value, options, onChange, attrs = {}) =>
  h(
    "select",
    { ...attrs, on: { change: (e) => onChange(e.target.value) } },
    options.map(([v, text]) => h("option", { value: v, selected: v === value }, text)),
  );
const input = (value, onInput, attrs = {}) =>
  h("input", {
    type: "text",
    value,
    maxlength: "120",
    ...attrs,
    on: { input: (e) => onInput(e.target.value) },
  });
const textarea = (value, onInput, attrs = {}) =>
  h(
    "textarea",
    { rows: "2", maxlength: "240", ...attrs, on: { input: (e) => onInput(e.target.value) } },
    value,
  );

function checklist(f, items, chosen, onToggle, name) {
  return h(
    "ul",
    { class: "gf-checks" },
    items.map(({ id, text }) =>
      h(
        "li",
        {},
        h(
          "label",
          { class: "pi-check" },
          h("input", {
            type: "checkbox",
            name,
            value: id,
            checked: chosen.includes(id),
            on: { change: (e) => onToggle(id, e.target.checked) },
          }),
          h("span", {}, text),
        ),
      ),
    ),
  );
}
const toggle = (arr, id, on) =>
  on ? (arr.includes(id) ? arr : [...arr, id]) : arr.filter((x) => x !== id);

export function renderGoalForm(ws) {
  const form = (ws.goalForm ||= loadForm());
  const ui = (ws.goalUi ||= {
    pane: "build",
    bank: null,
    bankBand: "",
    loading: "",
    saved: "",
    failed: "",
  });
  const band = bandOfGrade(form.grade);
  if (ui.bankBand !== band && ui.loading !== band) {
    ui.loading = band;
    loadBank(band)
      .then((bank) => ((ui.bank = bank), (ui.bankBand = band), (ui.failed = "")))
      .catch(() => ((ui.bank = null), (ui.bankBand = band), (ui.failed = band)))
      .finally(() => ((ui.loading = ""), ws.rerender()));
  }
  const bank = ui.bankBand === band ? ui.bank : null;
  const st = ws.students.find((s) => s.id === form.studentId) || null;

  let previewEl;
  const persist = () => saveForm(form);
  const sheet = () => buildSheet(form, bank);
  const refresh = () => {
    persist();
    ui.saved = "";
    if (previewEl)
      previewEl.replaceChildren(
        ...new DOMParser().parseFromString(sheetHTML(sheet()), "text/html").body.childNodes,
      );
  };
  const redraw = () => (persist(), ws.rerender());

  // ── 1 · who ────────────────────────────────────────────────────────────
  const pickStudent = async (id) => {
    form.studentId = id || "";
    const s = ws.students.find((x) => x.id === id);
    if (!s) return redraw();
    const p = profileOf(s);
    form.student = s.name;
    if (p.grade) form.grade = p.grade === "0" ? "K" : p.grade;
    form.level = p.level;
    // The suggestion reads the new grade band's bank, which may not be loaded yet.
    const target = bandOfGrade(form.grade);
    const b = await loadBank(target).catch(() => null);
    if (b) Object.assign(ui, { bank: b, bankBand: target, failed: "" });
    applySuggestion(form.goals[0], p, b);
    redraw();
  };
  function applySuggestion(goal, p, b) {
    goal.domain = lowestDomain(p.domains) || goal.domain;
    const g = suggestGoal(b, goal.domain, p.domains[goal.domain] ?? p.level ?? form.level);
    if (g) chooseGoal(goal, g.id, b);
  }
  function chooseGoal(goal, id, b = bank) {
    goal.goalId = id;
    goal.studentText = "";
    goal.teacherText = "";
    const D = b?.domains?.[goal.domain];
    if (D && id) {
      goal.steps = D.steps.slice(0, 3).map((s) => s.id);
      goal.evidence = ["0", "1"];
    }
  }

  const who = h(
    "details",
    { class: "gf-step", open: "" },
    h("summary", {}, h("span", { class: "gf-n" }, "1"), "Who is this for?"),
    ws.students.length
      ? field(
          "Student from your class",
          select(
            form.studentId || "",
            [["", "Type a name instead"], ...ws.students.map((s) => [s.id, s.name])],
            pickStudent,
          ),
        )
      : null,
    h(
      "div",
      { class: "gf-grid" },
      field(
        "Student name",
        input(form.student, (v) => ((form.student = v), refresh()), { autocomplete: "off" }),
      ),
      field(
        "Grade",
        select(
          form.grade,
          GRADES.map((g) => [g, g === "K" ? "Kindergarten" : `Grade ${g}`]),
          (v) => (
            (form.grade = v),
            form.goals.forEach((g) => ((g.goalId = ""), (g.steps = []), (g.evidence = []))),
            redraw()
          ),
        ),
      ),
      field(
        "Current WIDA level",
        select(
          form.level,
          LEVELS.map((l) => [l, l || "Not sure / skip"]),
          (v) => ((form.level = v), redraw()),
        ),
      ),
      field(
        "Teacher",
        input(form.teacher, (v) => ((form.teacher = v), refresh())),
      ),
      field(
        "School",
        input(form.school, (v) => ((form.school = v), refresh())),
      ),
    ),
    h(
      "div",
      { class: "gf-grid" },
      field(
        "Sheet language",
        select(
          form.lang,
          LANGS.map((l) => [l.id, l.label[0]]),
          (v) => ((form.lang = v), refresh()),
        ),
      ),
      field(
        "Sheet style",
        select(
          form.style,
          SHEET_STYLES.map((l) => [l.id, l.label[0]]),
          (v) => ((form.style = v), refresh()),
        ),
      ),
      field(
        "Goal time frame",
        select(
          form.timeframe,
          TIMEFRAMES.map((t) => [t.id, t.label[0]]),
          (v) => ((form.timeframe = v), refresh()),
        ),
      ),
      field(
        "Check-ins",
        select(
          form.checkin,
          CHECKINS.map((c) => [c.id, c.label[0]]),
          (v) => ((form.checkin = v), refresh()),
        ),
      ),
      field(
        "Start date",
        h("input", {
          type: "date",
          value: form.start,
          on: { change: (e) => ((form.start = e.target.value || form.start), refresh()) },
        }),
      ),
    ),
  );

  // ── 2 · goals ──────────────────────────────────────────────────────────
  const lv = form.level === "" ? null : Number(form.level);
  const goalCard = (goal, i) => {
    const D = bank?.domains?.[goal.domain];
    const matching = (D?.goals || []).filter((g) => inRange(g, lv));
    const others = (D?.goals || []).filter((g) => !inRange(g, lv));
    const optLabel = (g) => (form.lang === "es" ? g.es : g.en);
    const goalSelect = h(
      "select",
      {
        "aria-label": `Goal ${i + 1}`,
        on: { change: (e) => (chooseGoal(goal, e.target.value), redraw()) },
      },
      h("option", { value: "", selected: !goal.goalId }, bank ? "Pick a goal…" : "Loading goals…"),
      matching.length
        ? h(
            "optgroup",
            { label: lv == null ? "All goals for this skill" : `Matches level ${form.level}` },
            matching.map((g) =>
              h("option", { value: g.id, selected: g.id === goal.goalId }, optLabel(g)),
            ),
          )
        : null,
      lv != null && others.length
        ? h(
            "optgroup",
            { label: "Other levels" },
            others.map((g) =>
              h("option", { value: g.id, selected: g.id === goal.goalId }, optLabel(g)),
            ),
          )
        : null,
    );
    return h(
      "section",
      { class: "gf-goalcard", "data-goal-card": String(i + 1) },
      h(
        "h3",
        {},
        `Goal ${i + 1}`,
        form.goals.length > 1
          ? h(
              "button",
              {
                type: "button",
                class: "ghost small",
                on: { click: () => (form.goals.splice(i, 1), redraw()) },
              },
              "Remove",
            )
          : null,
      ),
      h(
        "div",
        { class: "gf-grid" },
        field(
          "Skill",
          select(
            goal.domain,
            GOAL_DOMAINS.map((d) => [d, DOMAIN_NAME[d][0]]),
            (v) => (
              (goal.domain = v),
              (goal.goalId = ""),
              (goal.steps = []),
              (goal.evidence = []),
              redraw()
            ),
          ),
        ),
        field(
          "How I will know",
          select(
            goal.measure,
            MEASURES.map((m) => [m.id, T(form, m.student)]),
            (v) => ((goal.measure = v), refresh()),
          ),
        ),
      ),
      field("Goal", goalSelect),
      field(
        "Or write it in my words",
        textarea(goal.studentText, (v) => ((goal.studentText = v), refresh()), {
          placeholder: "I can…",
        }),
      ),
      D
        ? h(
            "div",
            {},
            h("p", { class: "gf-hint" }, h("strong", {}, "Steps"), " — tick the ones to practice."),
            checklist(
              form,
              D.steps.map((s) => ({ id: s.id, text: T(form, [s.en, s.es]) })),
              goal.steps,
              (id, on) => ((goal.steps = toggle(goal.steps, id, on)), refresh()),
              `step-${i}`,
            ),
            field(
              "Add my own step",
              input(goal.extraStep, (v) => ((goal.extraStep = v), refresh())),
            ),
            h("p", { class: "gf-hint" }, h("strong", {}, "I will show my progress with")),
            checklist(
              form,
              D.evidence.map((e, k) => ({ id: String(k), text: T(form, [e.en, e.es]) })),
              goal.evidence,
              (id, on) => ((goal.evidence = toggle(goal.evidence, id, on)), refresh()),
              `ev-${i}`,
            ),
            h(
              "details",
              {},
              h("summary", { class: "linkish" }, "Teacher wording (measurable goal)"),
              field(
                "Student will…",
                textarea(goal.teacherText, (v) => ((goal.teacherText = v), refresh()), {
                  placeholder: goal.goalId
                    ? D.goals.find((g) => g.id === goal.goalId)?.teacher
                    : "Student will…",
                }),
              ),
            ),
          )
        : null,
    );
  };
  const goalsStep = h(
    "details",
    { class: "gf-step", open: "" },
    h("summary", {}, h("span", { class: "gf-n" }, "2"), "Goals"),
    ui.failed
      ? h(
          "p",
          { class: "pi-note", role: "alert" },
          "The goal bank could not load. Check your connection and reload.",
        )
      : null,
    form.goals.map(goalCard),
    form.goals.length < MAX_GOALS
      ? h(
          "button",
          {
            type: "button",
            class: "btn small",
            "data-add-goal": "",
            on: {
              click: () => (
                form.goals.push({
                  ...emptyGoal(),
                  domain: form.goals.at(-1)?.domain === "speaking" ? "writing" : "speaking",
                }),
                redraw()
              ),
            },
          },
          "+ Add another goal",
        )
      : null,
  );

  // ── 3 · supports, reflection ───────────────────────────────────────────
  const supports = h(
    "details",
    { class: "gf-step" },
    h("summary", {}, h("span", { class: "gf-n" }, "3"), "Supports and check-ins"),
    h("p", { class: "gf-hint" }, h("strong", {}, "How the teacher will help")),
    checklist(
      form,
      TEACHER_SUPPORTS.map((s) => ({ id: s.id, text: T(form, s.label) })),
      form.teacherSupports,
      (id, on) => ((form.teacherSupports = toggle(form.teacherSupports, id, on)), refresh()),
      "tsup",
    ),
    h("p", { class: "gf-hint" }, h("strong", {}, "How the family can help")),
    checklist(
      form,
      FAMILY_SUPPORTS.map((s) => ({ id: s.id, text: T(form, s.label) })),
      form.familySupports,
      (id, on) => ((form.familySupports = toggle(form.familySupports, id, on)), refresh()),
      "fsup",
    ),
    h("p", { class: "gf-hint" }, h("strong", {}, "Reflection lines on the sheet")),
    checklist(
      form,
      REFLECTIONS.map((s) => ({ id: s.id, text: T(form, s.label) })),
      form.reflections,
      (id, on) => ((form.reflections = toggle(form.reflections, id, on)), refresh()),
      "refl",
    ),
    h("p", { class: "gf-hint" }, h("strong", {}, "When I reach my goal")),
    checklist(
      form,
      CELEBRATIONS.map((s) => ({ id: s.id, text: T(form, s.label) })),
      form.celebrations,
      (id, on) => ((form.celebrations = toggle(form.celebrations, id, on)), refresh()),
      "cele",
    ),
  );

  // ── actions ────────────────────────────────────────────────────────────
  const classSheets = async () => {
    const out = [];
    for (const s of ws.students) {
      const p = profileOf(s);
      const f = {
        ...JSON.parse(JSON.stringify(form)),
        student: s.name,
        studentId: s.id,
        grade: p.grade ? (p.grade === "0" ? "K" : p.grade) : form.grade,
        level: p.level,
      };
      const b = bandOfGrade(f.grade);
      const bk = await loadBank(b).catch(() => null);
      f.goals = f.goals.slice(0, 1).map((g) => ({ ...g }));
      const g0 = f.goals[0];
      g0.domain = lowestDomain(p.domains) || g0.domain;
      const pick = suggestGoal(bk, g0.domain, p.domains[g0.domain] ?? p.level);
      if (pick) {
        g0.goalId = pick.id;
        g0.steps = bk.domains[g0.domain].steps.slice(0, 3).map((x) => x.id);
        g0.evidence = ["0", "1"];
      }
      out.push(buildSheet(f, bk));
    }
    return out;
  };
  const saveToStudent = () => {
    if (!st) return ws.announce("Pick a student from your class first.");
    const s = sheet();
    const list = ws.state.goals[st.id] || [];
    ws.state.goals[st.id] = [
      ...list,
      ...s.goals.map((g, i) => ({
        id: `${Date.now().toString(36)}${i}`,
        domain: STUDIO_DOMAIN[form.goals[i].domain] || "Speaking",
        teacher: `${g.teacher[0]} ${g.measureTeacher[0]}`.trim(),
        student: g.student[0],
        at: new Date().toISOString(),
      })),
    ];
    ws.save();
    ui.saved = `Saved ${s.goals.length} goal${s.goals.length === 1 ? "" : "s"} to ${st.name}'s record on this device.`;
    ws.announce(ui.saved);
    ws.rerender();
  };
  const say = (msg) => ws.announce(msg);
  const actions = h(
    "div",
    { class: "gf-actions no-print", role: "group", "aria-label": "Save or share this sheet" },
    h(
      "button",
      {
        type: "button",
        class: "btn btn-primary",
        "data-act": "print",
        on: { click: () => printSheets([sheetHTML(sheet())]) },
      },
      "Print or Save as PDF",
    ),
    h(
      "button",
      {
        type: "button",
        class: "btn",
        "data-act": "docx",
        on: {
          click: () => (
            download(fileName(form, "docx"), sheetDocx(sheet()), DOCX_MIME),
            say("Word file downloaded.")
          ),
        },
      },
      "Download Word",
    ),
    h(
      "button",
      {
        type: "button",
        class: "btn",
        "data-act": "copy",
        on: {
          click: () =>
            navigator.clipboard?.writeText(sheetText(sheet())).then(
              () => say("Copied as text."),
              () => say("Copy is blocked in this browser."),
            ),
        },
      },
      "Copy as text",
    ),
    st
      ? h(
          "button",
          { type: "button", class: "btn", "data-act": "save", on: { click: saveToStudent } },
          "Save to student record",
        )
      : null,
    ws.students.length > 1
      ? h(
          "button",
          {
            type: "button",
            class: "btn",
            "data-act": "class-print",
            on: { click: async () => printSheets((await classSheets()).map(sheetHTML)) },
          },
          `Print for the whole class (${ws.students.length})`,
        )
      : null,
    ws.students.length > 1
      ? h(
          "button",
          {
            type: "button",
            class: "btn",
            "data-act": "class-docx",
            on: {
              click: async () => (
                download("Language-Goals-Class.docx", sheetDocx(await classSheets()), DOCX_MIME),
                say("Class Word file downloaded.")
              ),
            },
          },
          "Word file for the whole class",
        )
      : null,
    h("a", { class: "btn ghost", href: "/access-practice-lab/goals" }, "Student version"),
    h(
      "button",
      {
        type: "button",
        class: "btn ghost",
        "data-act": "reset",
        on: { click: () => (clearForm(), (ws.goalForm = emptyForm()), ws.rerender()) },
      },
      "Start over",
    ),
  );

  previewEl = h("div", {
    class: "gf-preview",
    "aria-label": "Preview of the finished sheet",
    role: "region",
    tabindex: "0",
  });
  previewEl.replaceChildren(
    ...new DOMParser().parseFromString(sheetHTML(sheet()), "text/html").body.childNodes,
  );

  return h(
    "div",
    { class: "gf", "data-pane": ui.pane },
    h(
      "div",
      { class: "gf-tabs no-print", role: "group", "aria-label": "Form or preview" },
      ["build", "preview"].map((p) =>
        h(
          "button",
          {
            type: "button",
            class: `btn small${ui.pane === p ? " is-on" : ""}`,
            "aria-pressed": String(ui.pane === p),
            on: { click: () => ((ui.pane = p), ws.rerender()) },
          },
          p === "build" ? "Build" : "Preview",
        ),
      ),
    ),
    h("div", { class: "gf-controls no-print" }, who, goalsStep, supports),
    h(
      "div",
      { class: "gf-preview-wrap" },
      actions,
      ui.saved ? h("p", { class: "gf-saved", role: "status" }, ui.saved) : null,
      previewEl,
    ),
  );
}
