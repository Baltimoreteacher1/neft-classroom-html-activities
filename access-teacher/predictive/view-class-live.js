// Live class: connect a Language Page class (created in the Teacher Hub) and see each student's practice as their
// devices report it, with one-click assignments. In the Sample class this view uses sample numbers and never
// calls the class service.
import { assignToClass, doneCount, loadClass, memberFor, teacherClasses } from "./classlink.js";
import { h, table } from "./dom.js";
import { bandForGrade } from "./practice.js";
import { recordsOf } from "./records.js";

const DAY = 864e5;

/** Sample class connection built from the sample practice entries (no network). */
function sampleClass(ws) {
  return {
    ok: true,
    sample: true,
    assignments: [{ id: "sample-1" }, { id: "sample-2" }, { id: "sample-3" }],
    students: ws.students.map((st, i) => {
      const domains = {};
      for (const e of st.entries || [])
        domains[e.domain.toLowerCase()] = (domains[e.domain.toLowerCase()] || 0) + 1;
      return {
        studentId: st.id,
        alias: st.name,
        lastSeen: Date.now() - (i % 4) * DAY,
        summary: {
          domains,
          weekEvidence: 3 + (i % 5) * 2,
          weekDays: 1 + (i % 5),
          assignmentsDone: ["sample-1", "sample-2", "sample-3"].slice(0, i % 4),
        },
      };
    }),
  };
}

/** Load (once) the connected class into ws.live; re-render when it arrives. */
export function ensureLive(ws, { force = false } = {}) {
  if (ws.mode === "demo") {
    ws.live = { code: "SAMPLE", status: "ok", data: sampleClass(ws) };
    return ws.live;
  }
  const code = ws.state.classCode;
  const cls = teacherClasses().find((c) => c.code === code);
  if (!cls) return (ws.live = { code: null, status: "none" });
  if (!force && ws.live?.code === code && ws.live.status !== "error") return ws.live;
  ws.live = { code, status: "loading" };
  loadClass(cls).then((data) => {
    ws.live = { code, status: data.ok ? "ok" : "error", data };
    ws.rerender();
  });
  return ws.live;
}

const ago = (t) => {
  if (!t) return "not yet";
  const d = Math.floor((Date.now() - t) / DAY);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
};

/** The class connection card for Classroom Insights. */
export function classLivePanel(ws) {
  const classes = teacherClasses();
  const live = ensureLive(ws);
  const pick =
    ws.mode === "demo"
      ? h(
          "p",
          { class: "fine" },
          "Sample class: these numbers are made up so you can see how a connected class looks.",
        )
      : classes.length
        ? h(
            "label",
            { class: "pi-field" },
            h("span", {}, "Your Language Page class"),
            h(
              "select",
              {
                "data-class-pick": "",
                on: {
                  change: (e) => {
                    ws.state.classCode = e.target.value || null;
                    ws.save();
                    ensureLive(ws, { force: true });
                    ws.rerender();
                  },
                },
              },
              h("option", { value: "" }, "Choose a class"),
              classes.map((c) =>
                h(
                  "option",
                  { value: c.code, selected: c.code === ws.state.classCode },
                  `${c.title || "My class"} (${c.code})`,
                ),
              ),
            ),
          )
        : h(
            "p",
            {},
            "Create a class in the Teacher Hub (Class panel) and share the code with students. It will appear here, with their practice.",
            " ",
            h("a", { href: "/access-teacher/" }, "Open the Teacher Hub"),
          );
  let body = null;
  if (live.status === "loading") body = h("p", { role: "status" }, "Loading your class…");
  if (live.status === "error")
    body = h(
      "p",
      { class: "pi-note", role: "alert" },
      `The class could not be loaded (${live.data?.error || "offline"}). `,
      h(
        "button",
        {
          type: "button",
          class: "linkish",
          on: { click: () => (ensureLive(ws, { force: true }), ws.rerender()) },
        },
        "Try again",
      ),
    );
  if (live.status === "ok") {
    const { students, assignments } = live.data;
    const rows = students.map((m) => {
      const studio = ws.students.find((st) => memberFor([m], st.name));
      const d = doneCount(m, assignments);
      return [
        m.alias,
        studio ? studio.name : "Not matched",
        ago(m.lastSeen),
        String(m.summary.weekEvidence ?? 0),
        String(m.summary.weekDays ?? 0),
        d.total ? `${d.done} of ${d.total}` : "—",
      ];
    });
    body = h(
      "div",
      {},
      h(
        "div",
        { class: "pi-kpis" },
        h(
          "div",
          { class: "pi-kpi" },
          h("span", { class: "pi-kpi-label" }, "Joined"),
          h("strong", { class: "pi-kpi-value" }, String(students.length)),
        ),
        h(
          "div",
          { class: "pi-kpi" },
          h("span", { class: "pi-kpi-label" }, "Practiced this week"),
          h(
            "strong",
            { class: "pi-kpi-value" },
            String(students.filter((m) => (m.summary.weekEvidence || 0) > 0).length),
          ),
        ),
        h(
          "div",
          { class: "pi-kpi" },
          h("span", { class: "pi-kpi-label" }, "Assignments"),
          h("strong", { class: "pi-kpi-value" }, String(assignments.length)),
        ),
      ),
      students.length
        ? table(
            "Class practice (from students' devices)",
            ["Student", "In the studio", "Last practice", "This week", "Days", "Assignments done"],
            rows,
          )
        : h(
            "p",
            { class: "fine" },
            "No students have joined yet. Share the class code from the Teacher Hub.",
          ),
    );
  }
  return h(
    "section",
    { class: "pi-card", "aria-labelledby": "piLiveT", "data-class-live": live.status },
    h("h3", { id: "piLiveT" }, "Live class practice"),
    pick,
    body,
  );
}

/** "Assign to my class" for one domain, matched to a level and grade. Hidden when no class is connected. */
export function assignButton(ws, { domain, level, grade, label }) {
  const live = ws.live || ensureLive(ws);
  if (!["ok"].includes(live.status)) return null;
  if (!["Listening", "Speaking", "Reading", "Writing"].includes(domain)) return null;
  const btn = h(
    "button",
    {
      type: "button",
      class: "btn small",
      "data-assign-class": domain,
      on: {
        click: async () => {
          if (ws.mode === "demo")
            return ws.announce(
              "Sample class: nothing is sent. In My class, this adds two matching activities to your class.",
            );
          btn.disabled = true;
          const cls = teacherClasses().find((c) => c.code === ws.state.classCode);
          const res = await assignToClass(cls, { band: bandForGrade(grade), domain, level });
          btn.disabled = false;
          ws.announce(
            res.ok
              ? `Assigned to your class: ${res.added.join(", ")}.`
              : res.error === "nothing-new"
                ? "Every matching activity is already assigned."
                : `Could not assign (${res.error}).`,
          );
          if (res.ok) ensureLive(ws, { force: true });
        },
      },
    },
    label || `Assign ${domain.toLowerCase()} to my class`,
  );
  return btn;
}

/** Live numbers for one studio student, or null. */
export function liveFor(ws, st) {
  const live = ws.live || ensureLive(ws);
  if (live.status !== "ok") return null;
  const m = memberFor(live.data.students, st.name);
  if (!m) return null;
  return { member: m, ...doneCount(m, live.data.assignments), lastSeen: ago(m.lastSeen) };
}

export const latestGrade = (st) => recordsOf(st).at(-1)?.grade ?? null;
