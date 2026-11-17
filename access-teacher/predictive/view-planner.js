// Instructional Planner: score findings -> evidence to gather -> what to teach -> Language Page resources ->
// an assignment built in the Teacher Hub's own format and saved to its saved-assignments list. The teacher
// accepts, edits or sets aside every finding; nothing is assigned automatically. Practice-evidence findings
// (the Language Bottleneck Detector) follow below.
import { openStorage } from "../../access-practice-lab/src/acc/storage/access-db.js";
import { h } from "./dom.js";
import { buildAssignment, findingsFor, resourceLink, RESOURCES } from "./planner.js";
import { recordsOf } from "./records.js";
import { ASSESSMENTS } from "./rules.js";
import { renderBottlenecks } from "./view-bottleneck.js";
import { assessmentLabel, emptyState, explain, heading, studentPicker } from "./view-common.js";

let bankIndex = null;
async function loadBank() {
  bankIndex ||= await (await fetch("/access-practice-lab/content/bank/index.json")).json();
  return bankIndex;
}

function assignBox(ws, f, grade) {
  const out = h("div", { class: "pi-assign", "aria-live": "polite" });
  const make = async () => {
    out.textContent = "Building…";
    try {
      const a = buildAssignment(await loadBank(), {
        domain: f.domain,
        grade,
        title: `${f.domain}: ${ws.student().name}`,
      });
      if (!a.link) {
        out.textContent = "No bank items match this domain and grade band.";
        return;
      }
      const link = new URL(a.link, location.origin).href;
      const save = h(
        "button",
        {
          type: "button",
          class: "btn small",
          on: {
            click: async () => {
              const store = await openStorage();
              const saved = (await store.settings.get("assignments", [])) || [];
              await store.settings.set(
                "assignments",
                [
                  {
                    id: Date.now().toString(36),
                    title: a.spec.title,
                    link: a.link,
                    count: a.picks.length,
                    savedAt: Date.now(),
                  },
                  ...saved,
                ].slice(0, 30),
              );
              ws.announce("Saved to the Teacher Hub's assignments.");
              save.textContent = "Saved to Teacher Hub";
              save.disabled = true;
            },
          },
        },
        "Save to Teacher Hub assignments",
      );
      out.replaceChildren(
        h(
          "p",
          {},
          `${a.picks.length} ${f.domain} items, Learning mode. Open it on a student's device, or share the link the way you share other hub assignments.`,
        ),
        h("p", {}, h("a", { href: a.link, "data-assignment-link": "" }, "Preview the assignment")),
        h(
          "div",
          { class: "pi-row" },
          h(
            "button",
            {
              type: "button",
              class: "btn small ghost",
              on: {
                click: () =>
                  navigator.clipboard?.writeText(link).then(() => ws.announce("Link copied.")),
              },
            },
            "Copy link",
          ),
          save,
        ),
      );
    } catch {
      out.textContent = "The item bank could not be loaded.";
    }
  };
  return h(
    "div",
    {},
    h(
      "button",
      { type: "button", class: "btn small", "data-make-assignment": f.domain, on: { click: make } },
      `Create a ${f.domain} assignment`,
    ),
    out,
  );
}

function findingCard(ws, f, grade) {
  const decision = ws.state.plans[f.id] || {};
  const set = (patch) => {
    ws.state.plans[f.id] = { ...decision, ...patch, at: new Date().toISOString() };
    ws.save();
    ws.rerender();
  };
  const note = h("textarea", {
    rows: 2,
    maxlength: "400",
    "aria-label": `Your plan for ${f.domain}`,
    placeholder: "Edit the plan: what you will actually do, and when.",
  });
  note.value = decision.note || "";
  return h(
    "article",
    {
      class: `pi-finding${decision.status === "rejected" ? " is-set-aside" : ""}`,
      "data-finding": f.domain,
    },
    h(
      "h3",
      {},
      `${f.domain} (${f.basis})`,
      decision.status
        ? h(
            "span",
            { class: "pi-chip" },
            decision.status === "accepted" ? "In my plan" : "Set aside",
          )
        : null,
    ),
    h(
      "dl",
      { class: "pi-steps" },
      h("dt", {}, "What the data suggests"),
      h("dd", {}, f.suggests),
      h("dt", {}, "What evidence to gather"),
      h("dd", {}, f.gather),
      h("dt", {}, "What to teach or practice next"),
      h(
        "dd",
        {},
        h(
          "ol",
          {},
          f.teach.map((t) => h("li", {}, t)),
        ),
      ),
      h("dt", {}, "Language Page activities for this level and grade"),
      h(
        "dd",
        {},
        h("ul", { class: "pi-actlist" }, f.activities.map((a) => h("li", {}, h("a", { href: a.href, class: "pi-res", "data-activity": a.id }, a.title), h("span", { class: "fine" }, ` ${a.why}`)))),
      ),
    ),
    h("label", { class: "pi-field" }, h("span", {}, "My plan"), note),
    h(
      "div",
      { class: "pi-row" },
      h(
        "button",
        {
          type: "button",
          class: "btn small",
          on: { click: () => set({ status: "accepted", note: note.value.trim() }) },
        },
        "Add to my plan",
      ),
      h(
        "button",
        {
          type: "button",
          class: "btn small ghost",
          on: { click: () => set({ status: "rejected", note: note.value.trim() }) },
        },
        "Set aside",
      ),
    ),
    assignBox(ws, f, grade),
  );
}

export function renderPlanner(ws) {
  if (!ws.students.length) return emptyState(ws);
  const st = ws.student();
  const rec = recordsOf(st).at(-1);
  const g = rec?.grade;
  const grade =
    g === "K" ? "K" : g == null ? "6-8" : g <= 1 ? "1" : g <= 3 ? "2-3" : g <= 5 ? "3-5" : "6-8";
  const findings = findingsFor(rec);
  return h(
    "div",
    { class: "pi-stack" },
    studentPicker(ws),
    rec
      ? explain({
          summary: `Starting points from ${assessmentLabel(rec, ASSESSMENTS)}. A score suggests where to look; classroom evidence decides what to teach. Accept, edit or set aside each one.`,
          how: h(
            "p",
            {},
            "The two lowest reported domains become findings. The wording and suggested tasks come from the level band of each domain. Resources are existing Language Page activities for that domain; the assignment uses the same item bank and link format as the Teacher Hub's assignment builder.",
          ),
        })
      : h("p", { class: "pi-note" }, "No results on file yet. Teacher resources are below."),
    ...findings.map((f) => findingCard(ws, f, grade)),
    heading(3, "Planning tools"),
    h(
      "p",
      { class: "pi-res-list" },
      RESOURCES.Teacher.map((id) => resourceLink(id))
        .filter(Boolean)
        .flatMap((a) => [a, " "]),
    ),
    heading(3, "From practice evidence"),
    renderBottlenecks(ws),
  );
}
