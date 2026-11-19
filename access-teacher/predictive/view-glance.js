// Class at a glance (default section): a sortable, filterable class heat map of the latest reported levels with
// real-change markers and data-quality flags, the few students to look at first, what is new since the last
// visit, three class next steps, and class-level selection (save a group, build a practice assignment).
// Clicking any student name opens the spotlight drawer (drawer.js). Every number comes from existing logic.
import { openStorage } from "../../access-practice-lab/src/acc/storage/access-db.js";
import { h } from "./dom.js";
import { levelStyle, openStudentDrawer, trendMark } from "./drawer.js";
import {
  attentionWeight,
  classNextSteps,
  GLANCE_KEYS,
  glanceRow,
  groupFocus,
  needsAttention,
  needsLook,
} from "./glance-model.js";
import { comparableSteps, LEVEL_NAMES } from "./interpret.js";
import { buildAssignment } from "./planner.js";
import { bandForGrade } from "./practice.js";
import { recordsOf } from "./records.js";
import { ASSESSMENTS } from "./rules.js";
import { explain, heading } from "./view-common.js";

const COLS = [
  { key: "name", label: "Student" },
  { key: "grade", label: "Grade" },
  ...GLANCE_KEYS.map((k) => ({ key: k, label: k })),
  { key: "result", label: "Result" },
  { key: "flags", label: "Data notes" },
];

function opts(ws) {
  ws.sub.glance ||= { sort: "attention", dir: "desc", grade: "", attention: false, sel: new Set() };
  const o = ws.sub.glance;
  const ids = new Set(ws.students.map((s) => s.id));
  for (const id of o.sel) if (!ids.has(id)) o.sel.delete(id); // never carry a selection across classes
  return o;
}

const nameBtn = (ws, st) =>
  h(
    "button",
    {
      type: "button",
      class: "linkish pi-gl-name",
      "data-spotlight": st.id,
      on: { click: () => openStudentDrawer(ws, st.id) },
    },
    st.name,
  );

function sortValue(r, key) {
  if (key === "name") return r.st.name.toLowerCase();
  if (key === "grade") return r.grade === "K" ? 0 : (r.grade ?? null);
  if (key === "result") return r.rec ? `${r.rec.academicYear}|${r.version}` : null;
  if (key === "flags") return r.flags.length;
  if (key === "attention") return attentionWeight(r);
  return r.levels[key] ?? null;
}
function sorted(rows, { sort, dir }) {
  const m = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = sortValue(a, sort);
    const y = sortValue(b, sort);
    if (x == null && y == null) return a.st.name.localeCompare(b.st.name);
    if (x == null) return 1; // missing values always last
    if (y == null) return -1;
    return (x < y ? -1 : x > y ? 1 : 0) * m || a.st.name.localeCompare(b.st.name);
  });
}

function filters(ws, o, rows) {
  const grades = [...new Set(rows.map((r) => r.grade).filter((g) => g != null))].sort((a, b) =>
    a === "K" ? -1 : b === "K" ? 1 : a - b,
  );
  const grade = h(
    "select",
    {
      id: "piGlGrade",
      "data-glance-grade": "",
      on: {
        change: (e) => (
          (o.grade = e.target.value),
          ws.rerender(),
          document.getElementById("piGlGrade")?.focus()
        ),
      },
    },
    h("option", { value: "" }, "All grades"),
    grades.map((g) =>
      h(
        "option",
        { value: String(g), selected: String(g) === o.grade },
        g === "K" ? "Kindergarten" : `Grade ${g}`,
      ),
    ),
  );
  const att = h("input", {
    type: "checkbox",
    id: "piGlAtt",
    checked: o.attention,
    "data-glance-attention": "",
    on: {
      change: (e) => (
        (o.attention = e.target.checked),
        ws.rerender(),
        document.getElementById("piGlAtt")?.focus()
      ),
    },
  });
  return h(
    "div",
    { class: "pi-gl-filters", role: "group", "aria-label": "Filter the class table" },
    h("label", { class: "pi-field", for: "piGlGrade" }, h("span", {}, "Grade"), grade),
    h("label", { class: "pi-check pi-gl-att", for: "piGlAtt" }, att, " Needs attention only"),
  );
}

function headerCell(ws, o, col) {
  const on = o.sort === col.key;
  const btn = h(
    "button",
    {
      type: "button",
      class: "pi-gl-sort",
      id: `pi-gl-sort-${col.key}`,
      on: {
        click: () => {
          o.dir = on
            ? o.dir === "asc"
              ? "desc"
              : "asc"
            : col.key === "name" || col.key === "result"
              ? "asc"
              : "desc";
          o.sort = col.key;
          ws.rerender();
          document.getElementById(`pi-gl-sort-${col.key}`)?.focus();
        },
      },
    },
    col.label,
    h(
      "span",
      { class: "pi-gl-sort-ico", "aria-hidden": "true" },
      on ? (o.dir === "asc" ? "↑" : "↓") : "↕",
    ),
  );
  return h(
    "th",
    {
      scope: "col",
      "aria-sort": on ? (o.dir === "asc" ? "ascending" : "descending") : "none",
      "data-col": col.key,
    },
    btn,
  );
}

function levelCell(r, k) {
  const lv = r.levels[k];
  const sc = r.rec && (k === "Overall" ? r.rec.composites.Overall : r.rec.domains[k]);
  const text = !r.rec
    ? "—"
    : sc.status === "not-assessed"
      ? "N/A"
      : lv == null
        ? "—"
        : lv.toFixed(1);
  return h(
    "td",
    {
      class: `pi-gl-lv${lv == null ? " is-empty" : ""}`,
      style: levelStyle(lv),
      "data-key": k,
      "data-level": lv ?? "",
    },
    h("span", { class: "pi-gl-num" }, text),
    lv != null
      ? h("span", { class: "visually-hidden" }, ` ${LEVEL_NAMES[Math.floor(lv)] || ""}`)
      : null,
    r.rec ? trendMark(r.trends[k]) : null,
  );
}

function heatTable(ws, o, rows, onSel) {
  const all = h("input", {
    type: "checkbox",
    "aria-label": "Select every student shown",
    "data-glance-all": "",
  });
  const boxes = [];
  const sync = () => {
    const n = boxes.filter((b) => b.checked).length;
    all.checked = n > 0 && n === boxes.length;
    all.indeterminate = n > 0 && n < boxes.length;
    onSel();
  };
  all.addEventListener("change", () => {
    for (const b of boxes) {
      b.checked = all.checked;
      if (all.checked) o.sel.add(b.value);
      else o.sel.delete(b.value);
    }
    sync();
  });
  const body = rows.map((r) => {
    const box = h("input", {
      type: "checkbox",
      value: r.st.id,
      checked: o.sel.has(r.st.id),
      "aria-label": `Select ${r.st.name}`,
    });
    box.addEventListener(
      "change",
      () => (box.checked ? o.sel.add(r.st.id) : o.sel.delete(r.st.id), sync()),
    );
    boxes.push(box);
    return h(
      "tr",
      { "data-student-row": r.st.id },
      h("td", { class: "pi-gl-sel" }, box),
      h("th", { scope: "row" }, nameBtn(ws, r.st)),
      h("td", {}, r.grade == null ? "—" : String(r.grade)),
      GLANCE_KEYS.map((k) => levelCell(r, k)),
      h("td", { class: "pi-gl-res" }, r.version || "—"),
      h(
        "td",
        {},
        r.flags.length
          ? r.flags.map((f) => h("span", { class: `pi-chip pi-gl-flag is-${f.kind}` }, f.text))
          : h("span", { class: "fine" }, "None"),
      ),
    );
  });
  queueMicrotask(sync);
  return h(
    "div",
    { class: "pi-gl-wrap", role: "region", "aria-labelledby": "piGlCap", tabindex: "0" },
    h(
      "table",
      { class: "pi-table pi-gl-table" },
      h(
        "caption",
        { id: "piGlCap" },
        `Latest reported levels, ${rows.length} student${rows.length === 1 ? "" : "s"}`,
      ),
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          h("th", { scope: "col", class: "pi-gl-sel" }, all),
          COLS.map((c) => headerCell(ws, o, c)),
        ),
      ),
      h("tbody", {}, body),
    ),
  );
}

function legend(versions) {
  return h(
    "div",
    { class: "pi-gl-legend" },
    h(
      "ul",
      { class: "pi-gl-bands", "aria-label": "Level colours" },
      [1, 2, 3, 4, 5, 6].map((lv) =>
        h(
          "li",
          {},
          h(
            "span",
            {
              class: "pi-gl-swatch",
              style: levelStyle(lv),
            },
            String(lv),
          ),
          ` ${LEVEL_NAMES[lv]}`,
        ),
      ),
    ),
    h(
      "p",
      { class: "fine" },
      "▲ up or ▼ down: a change larger than the reported measurement error since the last comparable result. = within the error. – no comparable result or no error on file.",
    ),
    versions > 1
      ? h(
          "p",
          { class: "fine", "data-glance-versions": String(versions) },
          `Rows come from ${versions} different results (see the Result column). Levels from different assessments, years or cut scores are not the same measure: compare rows within one result.`,
        )
      : null,
  );
}

function attentionPanel(ws, rows) {
  const list = needsAttention(rows);
  return h(
    "section",
    { class: "pi-card pi-gl-attn", "aria-labelledby": "piGlAttT" },
    h("h3", { id: "piGlAttT" }, "Look at first"),
    list.length
      ? h(
          "ol",
          { class: "pi-gl-attn-list" },
          list.map((r) =>
            h(
              "li",
              { "data-attention": r.st.id },
              nameBtn(ws, r.st),
              h(
                "ul",
                {},
                [...r.reasons]
                  .sort((a, b) => b.w - a.w)
                  .slice(0, 2)
                  .map((x) => h("li", {}, x.text)),
              ),
            ),
          ),
        )
      : h(
          "p",
          {},
          "Nothing in the data stands out. Every student has a checked, complete, current result.",
        ),
    h(
      "p",
      { class: "fine" },
      "Reasons come from the data only (missing, unchecked or older results, real drops, lowest domains). They say where to look, not what a student can do.",
    ),
  );
}

/** Results added since the teacher last marked them seen; same state.seen list the Overview uses. */
function newSince(ws) {
  const all = ws.students.flatMap((st) => recordsOf(st).map((r) => ({ st, r })));
  if (!ws.state.seen) {
    ws.state.seen = all.map((x) => x.r.assessmentId);
    ws.save();
    return null;
  }
  const seen = new Set(ws.state.seen);
  const fresh = all.filter((x) => !seen.has(x.r.assessmentId));
  if (!fresh.length) return null;
  return h(
    "section",
    {
      class: "pi-card pi-new",
      "aria-labelledby": "piGlNewT",
      "data-new-since": String(fresh.length),
    },
    h(
      "h3",
      { id: "piGlNewT" },
      `New since your last visit: ${fresh.length} result${fresh.length === 1 ? "" : "s"}`,
    ),
    h(
      "ul",
      {},
      fresh.slice(0, 5).map(({ st, r }) => {
        const step = comparableSteps(st).find((x) => x.to.assessmentId === r.assessmentId);
        const ov = step?.rows.find((x) => x.key === "Overall");
        const real = ov?.beyondError
          ? ov.scaleChange > 0
            ? ", Overall up beyond measurement error"
            : ", Overall down beyond measurement error"
          : "";
        return h(
          "li",
          {},
          nameBtn(ws, st),
          `: ${ASSESSMENTS[r.assessmentType].short} ${r.academicYear}${real}`,
        );
      }),
    ),
    fresh.length > 5 ? h("p", { class: "fine" }, `and ${fresh.length - 5} more.`) : null,
    h(
      "button",
      {
        type: "button",
        class: "btn small",
        "data-new-seen": "",
        on: {
          click: () => (
            (ws.state.seen = all.map((x) => x.r.assessmentId)),
            ws.save(),
            ws.rerender()
          ),
        },
      },
      "Got it",
    ),
  );
}

function runStep(ws, a, rows) {
  if (a.kind === "planner") {
    // Open the planner on the student with the lowest level in that domain; P3's planner may also read the domain.
    const low = rows
      .filter((r) => r.levels[a.domain] != null)
      .sort((x, y) => x.levels[a.domain] - y.levels[a.domain])[0];
    if (low) ws.selected = low.st.id;
    ws.sub.plannerDomain = a.domain;
    ws.announce(
      `Instructional Planner: ${a.domain}${low ? `, starting with ${low.st.name}` : ""}.`,
    );
  }
  ws.go(a.kind);
}

function nextSteps(ws, rows) {
  const steps = classNextSteps(ws.students, rows);
  if (!steps.length) return null;
  return h(
    "section",
    { class: "pi-card pi-gl-steps", "aria-labelledby": "piGlStepsT" },
    h("h3", { id: "piGlStepsT" }, "Suggested next steps"),
    h(
      "ol",
      { class: "pi-gl-steps-list" },
      steps.map((s) =>
        h(
          "li",
          { "data-step": s.id },
          h("p", {}, s.text),
          h(
            "button",
            {
              type: "button",
              class: "btn small",
              on: { click: () => runStep(ws, s.action, rows) },
            },
            s.label,
          ),
        ),
      ),
    ),
  );
}

let bankIndex = null;
async function assignSelected(ws, picked, out) {
  const f = groupFocus(picked);
  if (!f) return (out.textContent = "The selected students have no domain levels to plan from.");
  out.textContent = "Building…";
  try {
    bankIndex ||= await (await fetch("/access-practice-lab/content/bank/index.json")).json();
    const title = `${f.domain}: group of ${picked.length}`;
    const a = buildAssignment(bankIndex, { domain: f.domain, grade: bandForGrade(f.grade), title });
    if (!a.link) return (out.textContent = "No bank items match this domain and grade band.");
    const preview = h("a", { href: a.link, "data-assignment-link": "" }, "Preview the assignment");
    if (ws.mode === "demo") {
      out.replaceChildren(
        h(
          "p",
          {},
          `${a.picks.length} ${f.domain} items (the most common lowest domain). Sample class: not saved. `,
          preview,
        ),
      );
      return ws.announce("Sample class: the assignment was built but not saved.");
    }
    const store = await openStorage();
    const saved = (await store.settings.get("assignments", [])) || [];
    await store.settings.set(
      "assignments",
      [
        {
          id: Date.now().toString(36),
          title,
          link: a.link,
          count: a.picks.length,
          savedAt: Date.now(),
        },
        ...saved,
      ].slice(0, 30),
    );
    out.replaceChildren(
      h(
        "p",
        {},
        `Saved to the Teacher Hub's assignments: ${a.picks.length} ${f.domain} items. Share the link with these students. `,
        preview,
      ),
    );
    ws.announce("Saved to the Teacher Hub's assignments.");
  } catch {
    out.textContent = "The practice bank could not be loaded. Try again.";
  }
}

function selectionBar(ws, o, rows) {
  const count = h("p", { class: "pi-gl-count", "aria-live": "polite" });
  const name = h("input", {
    type: "text",
    maxlength: "80",
    "aria-label": "Name for the new group",
    placeholder: "Group name",
    "data-glance-group-name": "",
  });
  const out = h("div", { class: "pi-assign", "aria-live": "polite" });
  const picked = () => rows.filter((r) => o.sel.has(r.st.id));
  const make = h(
    "button",
    {
      type: "button",
      class: "btn small",
      "data-glance-group": "",
      on: {
        click: () => {
          const p = picked();
          const label =
            name.value.trim() ||
            `Group of ${p.length} (${new Date(ws.today).toISOString().slice(0, 10)})`;
          ws.state.groups = {
            ...(ws.state.groups || {}),
            [`g-sel-${Date.now().toString(36)}`]: {
              name: label,
              members: p.map((r) => r.st.id),
              approvedAt: new Date().toISOString(),
              source: "glance",
            },
          };
          ws.save();
          name.value = "";
          out.textContent = `Saved "${label}" with ${p.length} student${p.length === 1 ? "" : "s"}. It appears in Reports with your other groups.`;
          ws.announce(`Group "${label}" saved on this device.`);
        },
      },
    },
    "Make a group from selected",
  );
  const assign = h(
    "button",
    {
      type: "button",
      class: "btn small ghost",
      "data-glance-assign": "",
      on: { click: () => assignSelected(ws, picked(), out) },
    },
    "Assign practice to selected",
  );
  const update = () => {
    const n = picked().length;
    count.textContent = n
      ? `${n} selected`
      : "Select students in the table to group them or assign practice.";
    make.disabled = !n;
    assign.disabled = !n;
  };
  update();
  return {
    node: h(
      "div",
      { class: "pi-gl-selbar no-print" },
      count,
      h("div", { class: "pi-row" }, name, make, assign),
      out,
    ),
    update,
  };
}

export function renderGlance(ws) {
  if (!ws.students.length)
    return h(
      "div",
      { class: "pi-empty" },
      h("h2", {}, "No students yet"),
      h("p", {}, "Bring in your students' ACCESS or MODEL scores to see the class at a glance."),
      h(
        "button",
        { type: "button", class: "btn", on: { click: () => ws.go("data") } },
        "Import scores",
      ),
    );
  const o = opts(ws);
  const all = ws.students.map((st) => glanceRow(st, ws.today));
  if (!all.some((r) => r.rec))
    return h(
      "div",
      { class: "pi-empty" },
      h("h2", {}, "No results yet"),
      h(
        "p",
        {},
        `${all.length} student${all.length === 1 ? " is" : "s are"} on your roster, but no scores are on file.`,
      ),
      h(
        "button",
        { type: "button", class: "btn", on: { click: () => ws.go("data") } },
        "Import scores",
      ),
    );
  const shown = sorted(
    all.filter(
      (r) => (!o.grade || String(r.grade) === o.grade) && (!o.attention || needsLook(r)),
    ),
    o,
  );
  const bar = selectionBar(ws, o, all);
  const versions = new Set(all.filter((r) => r.rec).map((r) => r.versionKey)).size;
  return h(
    "div",
    { class: "pi-stack pi-glance" },
    heading(2, "Class at a glance"),
    h(
      "p",
      { class: "pi-note" },
      "These are official results. For what students did in practice, strengths and the next thing to teach, open ",
      h("a", { href: "/access-teacher/?task=analyze" }, "Class intelligence in the Teacher Hub"),
      ". To tell a family what their child practiced and how to talk about it at home, use ",
      h("a", { href: "/access-teacher/?task=analyze&share=families" }, "Share with families"),
      ".",
    ),
    newSince(ws),
    h("div", { class: "pi-gl-top" }, attentionPanel(ws, all), nextSteps(ws, all)),
    h(
      "section",
      { class: "pi-card", "aria-labelledby": "piGlHeatT" },
      h("h3", { id: "piGlHeatT" }, "Class heat map"),
      filters(ws, o, all),
      shown.length
        ? heatTable(ws, o, shown, bar.update)
        : h("p", { class: "pi-note" }, "No students match these filters."),
      legend(versions),
      bar.node,
    ),
    explain({
      summary:
        "Each row is a student's latest reported result. Darker cells are higher levels; the number is always printed. Select a name for a quick spotlight.",
      uncertain:
        "One test is one sample of language on one day. Arrows appear only when a change is larger than the reported measurement error.",
      act: "Start with the students listed under Look at first, then use the next steps for the whole class.",
    }),
  );
}

