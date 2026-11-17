// Teacher tour, Part 2: a guided walk through the WIDA Data Studio with Mr. Neft, opened from the end of the
// teacher tour (Part 1, /start/tour) with `?demo=1&tour=1`. It always runs on the synthetic demo class, moves the
// workspace to the section it talks about, and never blocks the page: the coach card is a non-modal region
// with Back, Next and End, and the workspace stays usable under it.
import { h } from "./dom.js";

const KEY = "accessTeacher:v1:predictive:tour2";

export const TOUR2 = Object.freeze([
  {
    tab: "overview",
    sub: ["overview", "student"],
    title: "Teacher tour, Part 2: your WIDA data",
    body: "Welcome back! In Part 1 you built a lesson. Now let’s read WIDA scores together. These students are fictional sample data, so explore freely; nothing here touches a real class.",
  },
  {
    tab: "data",
    title: "Bring in your scores",
    body: "Import data is always in the top bar. Type scores in, paste cells from a spreadsheet, or open a CSV, Excel or digital PDF score report. You review and correct every value before anything is saved, and it stays on this device.",
  },
  {
    tab: "overview",
    sub: ["overview", "student"],
    title: "The first answer, with no settings",
    body: "Overview shows the latest result, the four domains, the composites and one next action. Scores are labelled Reported, Calculated or Missing, so you always know where a number came from.",
  },
  {
    tab: "students",
    title: "One student’s language profile",
    body: "Switch between proficiency levels and scale scores; they never share one axis. Below are starting points for what to teach, and goals you can write in student-friendly words.",
  },
  {
    tab: "growth",
    student: 2,
    title: "What changed, and is it real?",
    body: "Growth compares only results that can be compared. Student C has a 2025-26 result: ACCESS reset its scale that year, so the studio keeps the two eras apart instead of drawing one misleading line.",
  },
  {
    tab: "forecasts",
    sub: ["forecasts", "forecast"],
    student: 0,
    title: "Forecasts only when they are earned",
    body: "A forecast range appears only when a model passes testing on students it never saw. Otherwise you see why no number is shown. A range is not an exit decision.",
  },
  {
    tab: "forecasts",
    sub: ["forecasts", "scenarios"],
    title: "Explore “what if” safely",
    body: "The Scenario Studio lets you move each domain and see how the composites respond. It is always labelled Hypothetical: a planning tool, never a prediction.",
  },
  {
    tab: "classroom",
    sub: ["classroom", "patterns"],
    title: "Patterns across your class",
    body: "Classroom Insights groups students by assessment version, shows medians instead of fragile averages, and suggests temporary groups. You approve and edit every group.",
  },
  {
    tab: "planner",
    title: "From data to teaching",
    body: "Each finding says what the data suggests, what evidence to gather, what to teach next, and which Language Page activities help. Create an assignment and save it to your Teacher Hub.",
  },
  {
    tab: "reports",
    sub: ["report", "family"],
    title: "Share it well",
    body: "Reports print or save as PDF. The family summary uses plain words, in English or Spanish. That’s the tour! Switch to My class whenever you are ready to use your own scores.",
    final: true,
  },
]);

const save = (v) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* private mode: progress is simply not remembered */
  }
};

/** Move the workspace to step `i` (section, sub-view and, when the step names one, a demo student). */
export function showStep(ws, i) {
  const st = TOUR2[i];
  ws.tour = { step: i };
  if (st.sub) ws.sub[st.sub[0]] = st.sub[1];
  if (st.student != null && ws.students[st.student]) ws.selected = ws.students[st.student].id;
  save({ step: i, done: false });
  ws.go(st.tab);
}

/** The coach card for the current step, or null when no tour is running. */
export function tourCard(ws) {
  if (!ws.tour) return null;
  const i = ws.tour.step;
  const st = TOUR2[i];
  const end = (done) => {
    ws.tour = null;
    save({ step: i, done });
    ws.rerender();
    ws.announce(done ? "Tour finished." : "Tour closed.");
  };
  return h(
    "aside",
    {
      class: "pi-tour no-print",
      id: "piTour",
      role: "region",
      "aria-label": "Teacher tour, Part 2",
      "aria-live": "polite",
    },
    h("p", { class: "pi-tour-step" }, `Part 2 · Step ${i + 1} of ${TOUR2.length}`),
    h(
      "p",
      { class: "pi-tour-who" },
      h("strong", {}, "Mr. Neft: "),
      h("span", { class: "pi-tour-title" }, st.title),
    ),
    h("p", { class: "pi-tour-body" }, st.body),
    h(
      "div",
      { class: "pi-row" },
      i > 0
        ? h(
            "button",
            {
              type: "button",
              class: "btn small ghost",
              "data-tour": "back",
              on: { click: () => showStep(ws, i - 1) },
            },
            "Back",
          )
        : null,
      st.final
        ? h(
            "button",
            {
              type: "button",
              class: "btn small",
              "data-tour": "finish",
              on: { click: () => end(true) },
            },
            "Finish the tour",
          )
        : h(
            "button",
            {
              type: "button",
              class: "btn small",
              "data-tour": "next",
              on: { click: () => showStep(ws, i + 1) },
            },
            "Next",
          ),
      h(
        "button",
        {
          type: "button",
          class: "btn small ghost",
          "data-tour": "end",
          on: { click: () => end(false) },
        },
        "End tour",
      ),
      st.final
        ? h("a", { class: "btn small ghost", href: "/access-teacher/" }, "Back to the Teacher Hub")
        : null,
    ),
  );
}
