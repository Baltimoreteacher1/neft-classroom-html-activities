// WIDA Data Intelligence Studio controller: mode (real / synthetic demo), Quick / Advanced view, the seven
// keyboard-accessible sections plus Import data (opened from the header), and the shared context every view
// reads. `?demo=1` opens the synthetic demo and `?tab=<id>` a section, so the Teacher Hub can link straight in.
import { domainEvidence } from "./bottleneck.js";
import { demoClass, demoTrainingCohort } from "./demo.js";
import { clear, h, s } from "./dom.js";
import { forecastFor, transitionsByKey, validateAll } from "./forecast.js";
import { KEYS, loadRealStudents, loadState, read, saveState, write } from "./store.js";
import { renderClassroom } from "./view-classroom.js";
import { renderData } from "./view-data.js";
import { renderForecasts } from "./view-forecasts.js";
import { renderGrowth } from "./view-growth.js";
import { renderOverview } from "./view-overview.js";
import { renderPlanner } from "./view-planner.js";
import { renderReports } from "./view-reports.js";
import { renderStudents } from "./view-students.js";
import { renderToolkit } from "./view-toolkit.js";
import { showStep, tourCard } from "./tour.js";

const TABS = [
  { id: "overview", label: "Overview", render: renderOverview },
  { id: "students", label: "Students", render: renderStudents },
  { id: "growth", label: "Growth", render: renderGrowth },
  { id: "forecasts", label: "Forecasts & Scenarios", render: renderForecasts },
  { id: "classroom", label: "Classroom Insights", render: renderClassroom },
  { id: "planner", label: "Instructional Planner", render: renderPlanner },
  { id: "reports", label: "Reports", render: renderReports },
  { id: "toolkit", label: "Toolkit", render: renderToolkit },
  { id: "data", label: "Import data", render: renderData, hidden: true },
];
const DEMO_TODAY = new Date("2024-05-15T12:00:00Z");
let demoCache = null;

const root = document.getElementById("piApp");
const live = document.getElementById("piLive");

const ws = {
  mode: read(KEYS.mode, null) === "real" ? "real" : read(KEYS.mode, null) === "demo" ? "demo" : null,
  view: sessionGet("pi:view") === "advanced" ? "advanced" : "quick",
  tab: TABS.some((t) => t.id === sessionGet("pi:tab")) ? sessionGet("pi:tab") : "overview",
  selected: null,
  sub: {},
  go(id) {
    ws.tab = id;
    sessionSet("pi:tab", id);
    render();
    document.getElementById("pi-panel")?.focus();
  },
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

const params = new URLSearchParams(location.search);
if (params.get("demo") === "1") ws.mode = "demo";
let startTour = params.get("tour") === "1";
if (TABS.some((t) => t.id === params.get("tab"))) ws.tab = params.get("tab");

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
  ws.live = null;
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
    // First visit with no class data: open the sample class so there is something to explore.
    if (ws.mode === null && !students.length) {
      ws.mode = "demo";
      return load();
    }
    ws.mode = "real";
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
  if (startTour && ws.mode === "demo") {
    startTour = false;
    showStep(ws, 0);
    return;
  }
  render();
}

const ICONS = {
  overview: "M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z",
  students: "M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0M12 3a4 4 0 1 1 0 8",
  growth: "M3 17l6-6 4 4 8-8M14 7h7v7",
  forecasts: "M3 3v18h18M7 14l3-3 3 3 5-6",
  classroom: "M4 6h16M4 12h16M4 18h10",
  planner: "M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9",
  reports: "M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h6",
  data: "M12 3v12M7 10l5 5 5-5M4 21h16",
  toolkit: "M14 7l3-3 3 3-3 3M3 21l8-8M9 3l2 2-6 6-2-2zM15 13l6 6-2 2-6-6",
};
export const icon = (id) =>
  s("svg", { viewBox: "0 0 24 24", class: "pi-ico", "aria-hidden": "true", focusable: "false" }, s("path", { d: ICONS[id] || ICONS.overview }));

function setMode(mode) {
  if (ws.mode === mode) return;
  ws.mode = mode;
  write(KEYS.mode, mode);
  load();
  ws.announce(mode === "demo" ? "Sample class: fictional students to practice with." : "My class: your students on this device.");
}

function topbar() {
  const modeBtn = (mode, label) =>
    h(
      "button",
      { type: "button", class: `pi-mode${ws.mode === mode ? " is-on" : ""}`, "aria-pressed": String(ws.mode === mode), "data-mode-btn": mode, on: { click: () => setMode(mode) } },
      label,
    );
  const tech = h("input", { type: "checkbox", id: "piTech", checked: ws.view === "advanced" });
  tech.addEventListener("change", () => {
    ws.view = tech.checked ? "advanced" : "quick";
    sessionSet("pi:view", ws.view);
    render();
  });
  return h(
    "div",
    { class: "pi-topbar pi-controls" },
    h("div", { class: "pi-seg pi-modes", role: "group", "aria-label": "Which class" }, modeBtn("demo", "Sample class"), modeBtn("real", "My class")),
    h("label", { class: "pi-tech", for: "piTech" }, tech, " Show technical detail"),
    h(
      "button",
      { type: "button", class: `btn pi-import${ws.tab === "data" ? " is-on" : ""}`, id: "piImportBtn", "aria-pressed": String(ws.tab === "data"), on: { click: () => ws.go("data") } },
      icon("data"),
      "Import scores",
    ),
  );
}

function banner() {
  if (ws.mode === "demo")
    return h(
      "div",
      { class: "pi-banner is-demo", role: "note", id: "piDemoBanner" },
      h("strong", {}, "Sample class. "),
      "12 fictional students with sample ACCESS and MODEL scores and sample practice activity. Practice with every tool here; nothing is real and nothing is saved to your class. ",
      h("button", { type: "button", class: "linkish", on: { click: () => setMode("real") } }, "Switch to my class"),
    );
  if (!ws.students.length) return null;
  return h(
    "div",
    { class: "pi-banner", role: "note" },
    h("strong", {}, "My class. "),
    `${ws.students.length} student${ws.students.length === 1 ? "" : "s"}, saved only in this browser. Nothing is uploaded.`,
  );
}

function welcome() {
  return h(
    "div",
    { class: "pi-welcome" },
    h("h2", {}, "Welcome! Let’s look at your WIDA scores."),
    h("p", { class: "pi-welcome-lead" }, "See what scores mean, how students are growing, and what to teach next. Start with practice data, or bring in your own."),
    h(
      "div",
      { class: "pi-welcome-cards" },
      h(
        "button",
        { type: "button", class: "pi-welcome-card", "data-welcome": "sample", on: { click: () => setMode("demo") } },
        h("span", { class: "pi-welcome-ico" }, icon("students")),
        h("strong", {}, "Practice with a sample class"),
        h("span", {}, "12 fictional students with sample scores and practice activity. Nothing to set up."),
      ),
      h(
        "button",
        { type: "button", class: "pi-welcome-card", "data-welcome": "import", on: { click: () => ws.go("data") } },
        h("span", { class: "pi-welcome-ico" }, icon("data")),
        h("strong", {}, "Bring in my students’ scores"),
        h("span", {}, "Type them in, paste from a spreadsheet, or open a CSV, Excel or PDF score report."),
      ),
      h(
        "a",
        { class: "pi-welcome-card", href: "?demo=1&tour=1", "data-welcome": "tour" },
        h("span", { class: "pi-welcome-ico" }, icon("planner")),
        h("strong", {}, "Take the 3-minute tour"),
        h("span", {}, "Mr. Neft shows each tool with the sample class."),
      ),
    ),
  );
}

function tabs() {
  const list = h("nav", { class: "pi-side", "aria-label": "Studio sections" });
  const tl = h("div", { class: "pi-tabs", role: "tablist", "aria-label": "Studio sections", "aria-orientation": "vertical" });
  const select = (id, focus) => {
    ws.tab = id;
    sessionSet("pi:tab", id);
    render();
    if (focus) document.getElementById(`pi-tab-${id}`)?.focus();
  };
  const shown = TABS.filter((t) => !t.hidden);
  shown.forEach((t, i) =>
    tl.append(
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
              const n = shown.length;
              const to = { ArrowRight: (i + 1) % n, ArrowDown: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, ArrowUp: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
              if (to === undefined) return;
              e.preventDefault();
              select(shown[to].id, true);
            },
          },
        },
        icon(t.id),
        h("span", {}, t.label),
      ),
    ),
  );
  list.append(tl);
  return list;
}

function render() {
  document.body.dataset.view = ws.view;
  document.body.dataset.mode = ws.mode;
  const tab = TABS.find((t) => t.id === ws.tab);
  let panel;
  if (!ws.students.length && ws.mode === "real" && !["data", "toolkit"].includes(tab.id)) panel = welcome();
  else
    try {
      panel = tab.render(ws);
    } catch (e) {
      panel = h("p", { class: "pi-error", role: "alert" }, `This view could not be built: ${e.message}`);
    }
  clear(root).append(
    topbar(),
    h(
      "div",
      { class: "pi-layout" },
      tabs(),
      h(
        "div",
        { class: "pi-content" },
        banner(),
        h(
          "section",
          {
            id: "pi-panel",
            role: "tabpanel",
            "aria-labelledby": tab.hidden ? null : `pi-tab-${tab.id}`,
            "aria-label": tab.hidden ? tab.label : null,
            tabindex: "-1",
            class: "pi-panel",
          },
          panel,
        ),
        tourCard(ws),
      ),
    ),
  );
}

load();
