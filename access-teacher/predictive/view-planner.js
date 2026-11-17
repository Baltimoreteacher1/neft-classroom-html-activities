// Instructional Planner: score findings -> evidence to gather -> what to teach -> Language Page resources ->
// an assignment built in the Teacher Hub's own format and saved to its saved-assignments list. The teacher
// accepts, edits or sets aside every finding; nothing is assigned automatically. Each finding is a compact card
// (what the data suggests, top 3 activities, Use this plan, Assign) with the detail behind one disclosure; a
// My plan strip at the top lists what the teacher accepted. Plan entries keep their shape
// { status, note, at } and may add { steps } (the teacher's edited steps). Practice-evidence findings (the
// Language Bottleneck Detector) follow below.
import { openStorage } from "../../access-practice-lab/src/acc/storage/access-db.js";
import { detectBottlenecks } from "./bottleneck.js";
import { h } from "./dom.js";
import {
  buildAssignment,
  classFindings,
  findingsFor,
  planSteps,
  RESOURCES,
  resourceLink,
} from "./planner.js";
import { recordsOf } from "./records.js";
import { ASSESSMENTS } from "./rules.js";
import { renderBottlenecks } from "./view-bottleneck.js";
import { assignButton } from "./view-class-live.js";
import {
  assessmentLabel,
  emptyState,
  explain,
  sectionHead,
  studentPicker,
  subnav,
} from "./view-common.js";

let bankIndex = null;
async function loadBank() {
  bankIndex ||= await (await fetch("/access-practice-lab/content/bank/index.json")).json();
  return bankIndex;
}

const gradeBand = (g) =>
  g === "K" ? "K" : g == null ? "6-8" : g <= 1 ? "1" : g <= 3 ? "2-3" : g <= 5 ? "3-5" : "6-8";
const firstSentence = (t) => String(t || "").split(/(?<=[.!?])\s+/)[0];
const btn = (label, onClick, cls = "btn small", attrs = {}) =>
  h("button", { type: "button", class: cls, ...attrs, on: { click: onClick } }, label);

function decide(ws, id, patch) {
  ws.state.plans[id] = { ...(ws.state.plans[id] || {}), ...patch, at: new Date().toISOString() };
  ws.save();
}

/** "Assign": builds the hub-format assignment for this domain and grade band, then offers save and copy. */
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
      const save = btn("Save to Teacher Hub assignments", async () => {
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
      });
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
          btn(
            "Copy link",
            () => navigator.clipboard?.writeText(link).then(() => ws.announce("Link copied.")),
            "btn small ghost",
          ),
          save,
        ),
      );
    } catch {
      out.textContent = "The item bank could not be loaded.";
    }
  };
  const trigger = btn("Assign", make, "btn small ghost", {
    "data-make-assignment": f.domain,
    "aria-label": `Assign: create a ${f.domain} assignment`,
  });
  return { trigger, out };
}

const activityItem = (a) =>
  h(
    "li",
    {},
    h("a", { href: a.href, class: "pi-res", "data-activity": a.id }, a.title),
    h("span", { class: "fine" }, ` ${a.why}`),
  );

/** The disclosure: evidence, teaching steps (editable once in the plan), every activity, notes. */
function findingDetails(ws, f, decision) {
  const accepted = decision.status === "accepted";
  const steps = h("textarea", {
    rows: 5,
    maxlength: "1200",
    id: `pi-steps-${f.domain}`,
    "data-plan-steps": f.domain,
  });
  steps.value = planSteps(decision, f).join("\n");
  const note = h("textarea", {
    rows: 2,
    maxlength: "400",
    id: `pi-note-${f.domain}`,
    placeholder: "Edit the plan: what you will actually do, and when.",
  });
  note.value = decision.note || "";
  const readSteps = () =>
    steps.value
      .split(/\n+/)
      .map((x) => x.trim().slice(0, 300))
      .filter(Boolean)
      .slice(0, 8);
  const commit = (patch, msg) => {
    decide(ws, f.id, { note: note.value.trim(), ...patch });
    ws.sub.plannerOpen = f.id;
    ws.announce(msg);
    ws.rerender();
    document.querySelector(`#pi-finding-${f.domain} .pi-fdetail summary`)?.focus();
  };
  return h(
    "details",
    { class: "pi-more pi-fdetail", open: ws.sub.plannerOpen === f.id },
    h(
      "summary",
      {},
      accepted
        ? "Edit my plan, evidence and all activities"
        : "Evidence, teaching steps, all activities and notes",
    ),
    h(
      "dl",
      { class: "pi-steps" },
      h("dt", {}, "What the data suggests"),
      h("dd", {}, f.suggests),
      h("dt", {}, "Evidence to gather"),
      h("dd", {}, f.gather),
      h("dt", {}, accepted ? "My teaching steps (one per line)" : "Teaching steps"),
      h(
        "dd",
        {},
        accepted
          ? h(
              "label",
              { class: "pi-field", for: steps.id },
              h("span", { class: "visually-hidden" }, `Teaching steps for ${f.domain}`),
              steps,
            )
          : h(
              "ol",
              {},
              f.teach.map((t) => h("li", {}, t)),
            ),
      ),
      h("dt", {}, "Language Page activities for this level and grade"),
      h("dd", {}, h("ul", { class: "pi-actlist" }, f.activities.map(activityItem))),
    ),
    h("label", { class: "pi-field", for: note.id }, h("span", {}, `Notes for ${f.domain}`), note),
    h(
      "div",
      { class: "pi-row" },
      accepted
        ? btn("Save my plan", () => commit({ steps: readSteps() }, "Plan saved."), "btn small", {
            "data-save-plan": f.domain,
          })
        : btn("Save notes", () => commit({}, "Notes saved."), "btn small", { "data-save-plan": f.domain }),
      accepted
        ? btn(
            "Remove from my plan",
            () => commit({ status: null }, "Removed from My plan."),
            "btn small ghost",
          )
        : decision.status === "rejected"
          ? btn("Bring back", () => commit({ status: null }, "Finding brought back."), "btn small ghost")
          : btn("Set aside", () => commit({ status: "rejected" }, "Set aside."), "btn small ghost"),
    ),
    assignButton(ws, {
      domain: f.domain,
      level: f.level,
      grade: f.grade,
      label: `Assign ${f.domain.toLowerCase()} to my class`,
    }),
  );
}

function findingCard(ws, f, grade) {
  const decision = ws.state.plans[f.id] || {};
  const accepted = decision.status === "accepted";
  const { trigger, out } = assignBox(ws, f, grade);
  const use = accepted
    ? btn(
        "In my plan",
        () => {
          ws.sub.plannerOpen = f.id;
          ws.rerender();
        },
        "btn small is-done",
        { "aria-label": `${f.domain} is in my plan. Edit it` },
      )
    : btn(
        "Use this plan",
        () => {
          decide(ws, f.id, { status: "accepted", steps: planSteps(decision, f) });
          ws.sub.plannerOpen = f.id;
          ws.announce(`${f.domain} added to My plan. Edit the steps below.`);
          ws.rerender();
          document.querySelector(`[data-plan-steps="${f.domain}"]`)?.focus();
        },
        "btn small",
        { "data-use-plan": f.domain },
      );
  return h(
    "article",
    {
      class: `pi-finding pi-fcard${decision.status === "rejected" ? " is-set-aside" : ""}`,
      "data-finding": f.domain,
      id: `pi-finding-${f.domain}`,
    },
    h(
      "h3",
      {},
      f.domain,
      h("span", { class: "pi-chip" }, f.basis),
      decision.status
        ? h("span", { class: "pi-chip is-new" }, accepted ? "In my plan" : "Set aside")
        : null,
    ),
    h("p", { class: "pi-fcard-line" }, firstSentence(f.suggests)),
    h(
      "ul",
      { class: "pi-top3", "aria-label": `Top activities for ${f.domain}` },
      f.activities
        .slice(0, 3)
        .map((a) =>
          h("li", {}, h("a", { href: a.href, class: "pi-res", "data-activity": a.id }, a.title)),
        ),
    ),
    h("div", { class: "pi-row pi-fcard-actions" }, use, trigger),
    out,
    findingDetails(ws, f, decision),
  );
}

/** Every finding id the class can produce -> { student, finding } (all results, so older plans still name). */
function planIndex(ws) {
  const idx = new Map();
  for (const st of ws.students)
    for (const rec of recordsOf(st)) for (const f of findingsFor(rec)) idx.set(f.id, { st, f });
  return idx;
}

function myPlan(ws) {
  const idx = planIndex(ws);
  const items = Object.entries(ws.state.plans)
    .filter(([id, d]) => d?.status === "accepted" && idx.has(id))
    .map(([id, d]) => ({ id, d, ...idx.get(id) }));
  const practice = ws.students
    .flatMap((s) => detectBottlenecks(s, { evidence: ws.evidence(s) }).map((f) => ({ s, f })))
    .filter(({ f }) => ws.state.plans[f.id]?.objective);
  const total = items.length + practice.length;
  const open = (st, id) => {
    ws.selected = st.id;
    ws.sub.planner = "student";
    ws.sub.plannerOpen = id;
    ws.rerender();
    document
      .getElementById(`pi-finding-${idx.get(id)?.f.domain}`)
      ?.scrollIntoView({ block: "start" });
  };
  const printPlan = () => {
    document.body.dataset.print = "plan";
    const done = () => {
      delete document.body.dataset.print;
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };
  return h(
    "section",
    { class: "pi-myplan", "aria-labelledby": "piMyPlanT", "data-my-plan": String(total) },
    h(
      "div",
      { class: "pi-myplan-head" },
      h(
        "h3",
        { id: "piMyPlanT" },
        `My plan`,
        h("span", { class: "pi-chip" }, `${total} item${total === 1 ? "" : "s"}`),
      ),
      total ? btn("Print plan", printPlan, "btn small ghost", { "data-print-plan": "" }) : null,
    ),
    total
      ? h(
          "ul",
          { class: "pi-myplan-list" },
          items.map(({ id, d, st, f }) =>
            h(
              "li",
              { "data-plan-item": id },
              h(
                "span",
                { class: "pi-myplan-what" },
                h("strong", {}, `${st.name} · ${f.domain}`),
                h("span", { class: "fine" }, planSteps(d, f)[0] || ""),
              ),
              h(
                "span",
                { class: "pi-row" },
                btn("Edit", () => open(st, id), "btn small ghost", {
                  "aria-label": `Edit ${st.name} ${f.domain} plan`,
                }),
                btn(
                  "Remove",
                  () => {
                    decide(ws, id, { status: null });
                    ws.announce("Removed from My plan.");
                    ws.rerender();
                    document.getElementById("piMyPlanT")?.focus();
                  },
                  "btn small ghost",
                  { "aria-label": `Remove ${st.name} ${f.domain} from my plan` },
                ),
              ),
            ),
          ),
          practice.map(({ s, f }) =>
            h(
              "li",
              { "data-plan-item": f.id },
              h(
                "span",
                { class: "pi-myplan-what" },
                h("strong", {}, `${s.name} · learning plan`),
                h("span", { class: "fine" }, ws.state.plans[f.id].objective),
              ),
              btn(
                "Edit",
                () => {
                  ws.selected = s.id;
                  ws.sub.planner = "student";
                  ws.rerender();
                  document.getElementById("piBottleTitle")?.scrollIntoView({ block: "start" });
                },
                "btn small ghost",
                { "aria-label": `Edit ${s.name} learning plan` },
              ),
            ),
          ),
        )
      : h(
          "p",
          { class: "fine" },
          "Nothing yet. Choose Use this plan on a finding below; you can edit the steps after.",
        ),
    h(
      "div",
      { class: "pi-plan-print", "aria-hidden": "true" },
      h("h2", {}, "My instructional plan"),
      items.map(({ d, st, f }) =>
        h(
          "section",
          {},
          h("h3", {}, `${st.name}: ${f.domain}`),
          h("p", {}, f.suggests),
          h("p", {}, h("strong", {}, "Evidence to gather: "), f.gather),
          h(
            "ol",
            {},
            planSteps(d, f).map((t) => h("li", {}, t)),
          ),
          d.note ? h("p", {}, h("strong", {}, "Notes: "), d.note) : null,
        ),
      ),
      practice.map(({ s, f }) => {
        const p = ws.state.plans[f.id];
        return h(
          "section",
          {},
          h("h3", {}, `${s.name}: learning plan`),
          h("p", {}, p.objective),
          p.practice ? h("p", {}, p.practice) : null,
          p.checkpoint ? h("p", {}, `Checkpoint: ${p.checkpoint}`) : null,
        );
      }),
    ),
  );
}

function studentMode(ws) {
  const st = ws.student();
  const rec = recordsOf(st).at(-1);
  const grade = gradeBand(rec?.grade);
  const findings = findingsFor(rec);
  return [
    studentPicker(ws),
    rec
      ? explain({
          summary: `Starting points from ${assessmentLabel(rec, ASSESSMENTS)}. A score suggests where to look; classroom evidence decides what to teach.`,
          how: h(
            "p",
            {},
            "The two lowest reported domains become findings. The wording and suggested tasks come from the level band of each domain. Resources are existing Language Page activities for that domain; the assignment uses the same item bank and link format as the Teacher Hub's assignment builder.",
          ),
        })
      : h("p", { class: "pi-note" }, "No results on file yet. Teacher resources are below."),
    findings.length
      ? h(
          "div",
          { class: "pi-fcards" },
          findings.map((f) => findingCard(ws, f, grade)),
        )
      : null,
    renderBottlenecks(ws, { studentId: st.id }),
  ];
}

function classMode(ws) {
  const groups = classFindings(ws.students);
  const pick = (st) => {
    ws.selected = st.id;
    ws.sub.planner = "student";
    ws.rerender();
  };
  return [
    groups.length
      ? h(
          "div",
          { class: "pi-fcards" },
          groups.map(({ domain, items }) => {
            const levels = items.map((x) => x.finding.level).sort((a, b) => a - b);
            const inPlan = items.filter(
              (x) => ws.state.plans[x.finding.id]?.status === "accepted",
            ).length;
            return h(
              "article",
              { class: "pi-finding pi-fcard", "data-class-finding": domain },
              h(
                "h3",
                {},
                domain,
                h(
                  "span",
                  { class: "pi-chip" },
                  `${items.length} student${items.length === 1 ? "" : "s"}`,
                ),
                inPlan ? h("span", { class: "pi-chip is-new" }, `${inPlan} in my plan`) : null,
              ),
              h(
                "p",
                { class: "pi-fcard-line" },
                `One of the two lower reported domains for these students. Open a student to plan.`,
              ),
              h(
                "div",
                { class: "pi-chips pi-group-students" },
                items.map(({ student, finding }) =>
                  btn(
                    `${student.name} · ${finding.level.toFixed(1)}`,
                    () => pick(student),
                    "btn small ghost",
                    { "data-plan-student": student.id },
                  ),
                ),
              ),
              assignButton(ws, {
                domain,
                level: levels[Math.floor(levels.length / 2)],
                grade: items[0].finding.grade,
                label: `Assign ${domain.toLowerCase()} to my class`,
              }),
            );
          }),
        )
      : h("p", { class: "pi-note" }, "No results on file yet."),
    h(
      "details",
      { class: "pi-more" },
      h("summary", {}, "From practice evidence: every student"),
      renderBottlenecks(ws),
    ),
  ];
}

export function renderPlanner(ws) {
  if (!ws.students.length) return emptyState(ws);
  const mode = ws.sub.planner === "class" ? "class" : "student";
  // A next step elsewhere (Class at a glance) can ask to open on one domain's finding, once.
  const jump = ws.sub.plannerDomain;
  if (jump) {
    ws.sub.plannerDomain = "";
    requestAnimationFrame(() => {
      const card = document.getElementById(`pi-finding-${jump}`);
      if (!card) return;
      card.scrollIntoView({ block: "start" });
      card.querySelector("h3, h4, button")?.focus({ preventScroll: true });
    });
  }
  return h(
    "div",
    { class: "pi-stack pi-planner" },
    sectionHead(
      "Instructional Planner",
      "What the scores suggest teaching next, as plans you accept, edit or set aside.",
    ),
    myPlan(ws),
    subnav(
      ws,
      "planner",
      [
        ["student", "One student"],
        ["class", "Whole class"],
      ],
      mode,
    ),
    ...(mode === "class" ? classMode(ws) : studentMode(ws)),
    h("h3", { class: "pi-h" }, "Planning tools"),
    h(
      "p",
      { class: "pi-res-list" },
      RESOURCES.Teacher.map((id) => resourceLink(id))
        .filter(Boolean)
        .flatMap((a) => [a, " "]),
    ),
  );
}
