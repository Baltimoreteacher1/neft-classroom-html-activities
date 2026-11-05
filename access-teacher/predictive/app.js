// Predictive Intelligence workspace controller: mode (real / synthetic demo), Quick / Advanced view,
// keyboard-accessible tabs, and the shared context every view reads.
import { domainEvidence } from "./bottleneck.js";
import { demoClass, demoTrainingCohort } from "./demo.js";
import { clear, h } from "./dom.js";
import { forecastFor, transitionsByKey, validateAll } from "./forecast.js";
import { KEYS, loadRealStudents, loadState, read, saveState, write } from "./store.js";
import { renderAnalyst } from "./view-analyst.js";
import { renderClassroom } from "./view-classroom.js";
import { renderData } from "./view-data.js";
import { renderGrowth } from "./view-growth.js";
import { renderOverview } from "./view-overview.js";
import { renderProbability } from "./view-probability.js";
import { renderSimulator } from "./view-simulator.js";
import { renderValidation } from "./view-validation.js";

const TABS = [
  { id: "overview", label: "Forecast Overview", render: renderOverview },
  { id: "growth", label: "Domain Growth Lab", render: renderGrowth },
  { id: "probability", label: "ACCESS Probability Center", render: renderProbability },
  { id: "simulator", label: "Intervention Simulator", render: renderSimulator },
  { id: "classroom", label: "Classroom Intelligence", render: renderClassroom },
  { id: "analyst", label: "Research Analyst", render: renderAnalyst },
  { id: "validation", label: "Validation Center", render: renderValidation },
  { id: "data", label: "Data and import", render: renderData },
];
const DEMO_TODAY = new Date("2024-05-15T12:00:00Z");
let demoCache = null;

const root = document.getElementById("piApp");
const live = document.getElementById("piLive");

const ws = {
  mode: read(KEYS.mode, "real") === "demo" ? "demo" : "real",
  view: sessionGet("pi:view") === "advanced" ? "advanced" : "quick",
  tab: TABS.some((t) => t.id === sessionGet("pi:tab")) ? sessionGet("pi:tab") : "overview",
  selected: null,
  analystQuestion: "",
  announce(msg) {
    live.textContent = "";
    setTimeout(() => (live.textContent = msg), 30);
  },
  save() {
    if (!saveState(ws.mode, ws.state))
      ws.announce("This browser could not save the change (storage may be full).");
  },
  rerender: () => render(),
  reload: () => load(),
};

function sessionGet(k) {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
}
function sessionSet(k, v) {
  try {
    sessionStorage.setItem(k, v);
  } catch {
    /* private mode: the choice simply is not remembered */
  }
}

function load() {
  if (ws.mode === "demo") {
    demoCache ||= (() => {
      const byKey = transitionsByKey(demoTrainingCohort());
      return {
        byKey,
        validations: validateAll(byKey, { asOf: DEMO_TODAY.toISOString().slice(0, 10) }),
        students: demoClass(),
      };
    })();
    Object.assign(ws, demoCache, { today: DEMO_TODAY });
  } else {
    const students = loadRealStudents();
    const byKey = transitionsByKey(students);
    Object.assign(ws, { students, byKey, validations: validateAll(byKey), today: new Date() });
  }
  ws.state = loadState(ws.mode);
  if (!ws.students.some((s) => s.id === ws.selected)) ws.selected = ws.students[0]?.id || null;
  const fc = new Map();
  const ev = new Map();
  ws.forecast = (student, key, threshold = null) => {
    const k = `${student.id}|${key}|${threshold}`;
    if (!fc.has(k))
      fc.set(
        k,
        forecastFor({
          student,
          key,
          validations: ws.validations,
          byKey: ws.byKey,
          threshold,
          today: ws.today,
        }),
      );
    return fc.get(k);
  };
  ws.evidence = (student) => {
    if (!ev.has(student.id))
      ev.set(student.id, domainEvidence(student, { now: ws.today.getTime() }));
    return ev.get(student.id);
  };
  ws.student = () => ws.students.find((s) => s.id === ws.selected) || null;
  render();
}

function header() {
  const modeBtn = (mode, label) =>
    h(
      "button",
      {
        type: "button",
        class: `btn small${ws.mode === mode ? " is-on" : ""}`,
        "aria-pressed": String(ws.mode === mode),
        on: {
          click: () => {
            if (ws.mode === mode) return;
            ws.mode = mode;
            write(KEYS.mode, mode);
            load();
            ws.announce(
              mode === "demo"
                ? "Synthetic demonstration mode. No real student data is shown."
                : "Real mode: your class data on this device.",
            );
          },
        },
      },
      label,
    );
  const viewBtn = (view, label) =>
    h(
      "button",
      {
        type: "button",
        class: `btn small${ws.view === view ? " is-on" : ""}`,
        "aria-pressed": String(ws.view === view),
        on: {
          click: () => {
            ws.view = view;
            sessionSet("pi:view", view);
            render();
          },
        },
      },
      label,
    );
  return h(
    "div",
    { class: "pi-controls" },
    h(
      "div",
      { class: "pi-seg", role: "group", "aria-label": "Data source" },
      modeBtn("real", "My class (real)"),
      modeBtn("demo", "Synthetic demo"),
    ),
    h(
      "div",
      { class: "pi-seg", role: "group", "aria-label": "Detail level" },
      viewBtn("quick", "Quick view"),
      viewBtn("advanced", "Advanced view"),
    ),
  );
}

function banner() {
  if (ws.mode === "demo")
    return h(
      "div",
      { class: "pi-banner is-demo", role: "note", id: "piDemoBanner" },
      h("strong", {}, "SYNTHETIC DEMONSTRATION. "),
      "Every student and result on this screen is generated by a documented synthetic process. The numbers show how the workflow behaves when a model passes validation; they say nothing about real students. Demo settings are stored separately and never mixed with your class.",
    );
  return h(
    "div",
    { class: "pi-banner", role: "note" },
    h("strong", {}, "Your class, on this device. "),
    `${ws.students.length} student${ws.students.length === 1 ? "" : "s"} from your Teacher Hub roster and official results. Nothing is uploaded. Forecast numbers appear only when a model passes held-out validation for the year being forecast.`,
  );
}

function tabs() {
  const list = h("div", { class: "pi-tabs", role: "tablist", "aria-label": "Workspace views" });
  const select = (id, focus) => {
    ws.tab = id;
    sessionSet("pi:tab", id);
    render();
    if (focus) document.getElementById(`pi-tab-${id}`)?.focus();
  };
  TABS.forEach((t, i) =>
    list.append(
      h(
        "button",
        {
          type: "button",
          role: "tab",
          id: `pi-tab-${t.id}`,
          "aria-selected": String(ws.tab === t.id),
          "aria-controls": "pi-panel",
          tabindex: ws.tab === t.id ? "0" : "-1",
          on: {
            click: () => select(t.id, false),
            keydown: (e) => {
              const n = TABS.length;
              const to = {
                ArrowRight: (i + 1) % n,
                ArrowLeft: (i - 1 + n) % n,
                Home: 0,
                End: n - 1,
              }[e.key];
              if (to === undefined) return;
              e.preventDefault();
              select(TABS[to].id, true);
            },
          },
        },
        t.label,
      ),
    ),
  );
  return list;
}

function render() {
  document.body.dataset.view = ws.view;
  document.body.dataset.mode = ws.mode;
  const tab = TABS.find((t) => t.id === ws.tab);
  let panel;
  try {
    panel = tab.render(ws);
  } catch (e) {
    panel = h(
      "p",
      { class: "pi-error", role: "alert" },
      `This view could not be built: ${e.message}`,
    );
  }
  clear(root).append(
    header(),
    banner(),
    tabs(),
    h(
      "section",
      {
        id: "pi-panel",
        role: "tabpanel",
        "aria-labelledby": `pi-tab-${tab.id}`,
        tabindex: "0",
        class: "pi-panel",
      },
      panel,
    ),
  );
}

load();
