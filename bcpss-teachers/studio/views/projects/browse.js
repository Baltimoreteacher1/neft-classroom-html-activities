// #/projects: browse projects by grade band, subject and length. Cards show the driving question and the final product.
import { favoriteButton } from "../../core/actions.js";
import { h } from "../../core/dom.js";
import { BANDS } from "../../data/taxonomy.js";
import { gradeLabel, plural, subjectChip } from "../../core/ui.js";
import {
  BAND_LABEL,
  DURATIONS,
  FRAMING,
  facetCounts,
  filterProjects,
  readFilters,
  subjectName,
  subjectsIn,
} from "./data.js";

function pillGroup(label, onPick) {
  const group = h("div", { class: "st-pj-pills", role: "group", "aria-label": label });
  const paint = (options, value) => {
    group.replaceChildren(
      ...options.map((o) => {
        const b = h(
          "button",
          {
            class: "st-btn st-pj-pill",
            type: "button",
            "aria-pressed": String(o.id === value),
            "data-id": o.id,
          },
          o.label,
          o.count != null ? h("span", { class: "st-pj-count" }, o.count) : null,
        );
        b.addEventListener("click", () => onPick(o.id === value ? "" : o.id));
        return b;
      }),
    );
  };
  return { group, paint };
}

function card(p, shell) {
  const meta = [
    subjectChip(p.subject),
    p.grade ? h("span", { class: "st-chip st-chip-plain" }, gradeLabel(p.grade)) : null,
    p.sessions
      ? h("span", { class: "st-chip st-chip-plain" }, plural(p.sessions, "session"))
      : null,
  ];
  return h(
    "li",
    { class: "st-card st-pj-card", "data-band": p.band },
    h(
      "h3",
      { class: "st-card-title" },
      h("a", { class: "st-card-link", href: `#/project/${encodeURIComponent(p.id)}` }, p.title),
    ),
    h("p", { class: "st-meta" }, meta),
    h("p", { class: "st-pj-label" }, "Driving question"),
    h("p", { class: "st-pj-dq" }, p.drivingQuestion),
    p.finalProduct
      ? [
          h("p", { class: "st-pj-label" }, "Students make"),
          h("p", { class: "st-pj-fp" }, p.finalProduct),
        ]
      : null,
    p.standards.length
      ? h(
          "p",
          { class: "st-standards" },
          p.standards.slice(0, 4).map((s) => h("code", {}, s)),
        )
      : null,
    favoriteButton(
      { kind: "project", id: p.id, title: p.title, grade: p.grade, subject: p.subject },
      shell,
    ),
  );
}

export function renderBrowse({ root, params, shell, data }) {
  const f = readFilters(params);
  const subjects = subjectsIn(data.items);

  const sync = () => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v) q.set(k, v);
    shell.replaceHash?.(`#/projects${q.size ? `?${q}` : ""}`);
  };

  const bandPills = pillGroup("Grade band", (v) => set({ band: v }));
  const durationPills = pillGroup("Length", (v) => set({ duration: v }));
  const subject = h(
    "select",
    { id: "st-pj-subject" },
    h("option", { value: "" }, "All subjects"),
    subjects.map((s) => h("option", { value: s }, subjectName(s))),
  );
  subject.addEventListener("change", () => set({ subject: subject.value }));
  const search = h("input", {
    id: "st-pj-q",
    type: "search",
    placeholder: "Title, question or standard",
    autocomplete: "off",
  });
  search.addEventListener("input", () => {
    f.q = search.value.slice(0, 80);
    paintResults();
    sync();
  });

  const results = h("ul", { class: "st-results st-pj-results", "aria-label": "Projects" });
  const status = h("p", { class: "st-pj-status", role: "status", "aria-live": "polite" });

  function paintFilters() {
    const counts = facetCounts(data.items, f);
    bandPills.paint(
      [
        { id: "", label: "All" },
        ...BANDS.map((b) => ({ id: b.id, label: BAND_LABEL[b.id], count: counts.bands[b.id] })),
      ],
      f.band,
    );
    durationPills.paint(
      [
        { id: "", label: "Any length" },
        ...DURATIONS.map((d) => ({ id: d.id, label: d.label, count: counts.durations[d.id] })),
      ],
      f.duration,
    );
    subject.value = f.subject;
    search.value = f.q;
  }

  function paintResults() {
    const list = filterProjects(data.items, f);
    status.textContent = list.length
      ? `${plural(list.length, "project")} shown.`
      : "No projects match these filters.";
    if (list.length) results.replaceChildren(...list.map((p) => card(p, shell)));
    else {
      const reset = h("button", { class: "st-btn", type: "button" }, "Show all projects");
      reset.addEventListener("click", () => {
        Object.assign(f, { band: "", subject: "", duration: "", q: "" });
        paintFilters();
        paintResults();
        sync();
      });
      results.replaceChildren(
        h(
          "li",
          { class: "st-empty" },
          h("h3", {}, "Nothing matches yet"),
          h("p", {}, "Try another grade band, subject or length."),
          h("p", { class: "st-row" }, reset),
        ),
      );
    }
    shell.announce(status.textContent);
  }

  function set(patch) {
    Object.assign(f, patch);
    paintFilters();
    paintResults();
    sync();
  }

  const filters = h(
    "section",
    { class: "st-pj-filters", "aria-label": "Filter projects" },
    h(
      "div",
      { class: "st-field" },
      h("span", { class: "st-legend" }, "Grade band"),
      bandPills.group,
    ),
    h(
      "div",
      { class: "st-field" },
      h("span", { class: "st-legend" }, "Length"),
      durationPills.group,
    ),
    h(
      "div",
      { class: "st-pj-row2" },
      h("div", { class: "st-field" }, h("label", { for: "st-pj-subject" }, "Subject"), subject),
      h("div", { class: "st-field" }, h("label", { for: "st-pj-q" }, "Search"), search),
    ),
  );

  root.append(
    h("h1", {}, "Projects"),
    h(
      "p",
      { class: "st-lede" },
      "Multi-session projects with a driving question, checkpoints, a rubric and supports at four language levels. Pick a grade band, then open a project to plan it.",
    ),
    h("p", { class: "st-pj-framing", role: "note" }, FRAMING),
    filters,
    status,
    results,
  );
  paintFilters();
  paintResults();
}
