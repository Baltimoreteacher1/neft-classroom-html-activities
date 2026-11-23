// Home: three primary actions that work with no setup, a pick-up strip when data exists, quiet browse selectors.
import { hrefFor } from "../core/catalog.js";
import { h } from "../core/dom.js";
import { startTour } from "../core/tour.js";
import { icon, subjectChip } from "../core/ui.js";
import { BANDS, GRADE_LABEL, SUBJECTS } from "../data/taxonomy.js";

const PRIMARY = [
  { href: "#/find", tone: "find", icon: "search", title: "Find my lesson", body: "Choose a grade and subject, or search by title, standard, vocabulary word or language objective." },
  { href: "#/prepare", tone: "prepare", icon: "layers", title: "Prepare my class", body: "Pick a lesson and the studio assembles vocabulary, a language objective, an activity, prompts, a printable and an exit ticket." },
  { href: "#/find?kind=activity", tone: "launch", icon: "play", title: "Launch an activity", body: "Open a student activity, copy a student link, or put it on the projector." },
];

const SECONDARY = [
  ["#/vocab", "Vocabulary"],
  ["#/wida", "WIDA Practice"],
  ["#/create", "Resource Studio"],
  ["#/projects", "Projects"],
  ["#/lens", "Language Lens"],
  ["#/classes", "Classes"],
];

function primaryCard(p) {
  return h(
    "a",
    { class: "st-action-card", href: p.href, "data-tone": p.tone },
    icon(p.icon, 26),
    h("h2", {}, p.title),
    h("p", {}, p.body),
    h("span", { class: "st-go" }, "Start", icon("arrow", 18)),
  );
}

function pickUpStrip(shell) {
  const lib = shell.library;
  const items = [];
  for (const r of lib.recents().slice(0, 4)) {
    const href = r.kind === "part" ? "#/library" : hrefFor(r.kind, r.id);
    items.push(h("li", {}, h("a", { href, target: r.kind === "activity" ? "_blank" : null, rel: r.kind === "activity" ? "noopener" : null }, r.title, h("small", {}, r.kind))));
  }
  for (const b of lib.bundles().slice(0, 3)) {
    items.push(h("li", {}, h("a", { href: "#/library" }, b.name, h("small", {}, `bundle, ${b.items.length}`))));
  }
  for (const aid of lib.inProgress().slice(0, 3)) {
    const open = h("button", { class: "st-pick", type: "button" }, `Resume ${aid.replace(/[-_]/g, " ")}`);
    open.addEventListener("click", () => shell.openActivity(aid));
    items.push(h("li", {}, open));
  }
  if (!items.length) return null;
  return h("section", { class: "st-strip", "aria-labelledby": "st-pickup" }, h("h2", { id: "st-pickup" }, "Pick up where you left off"), h("ul", {}, items));
}

function gradeBrowser(prefs) {
  return h(
    "section",
    { "aria-labelledby": "st-browse-grade" },
    h("h2", { id: "st-browse-grade" }, "Browse by grade"),
    BANDS.map((b) =>
      h(
        "div",
        { class: "st-band", role: "group", "aria-label": `Grades ${b.label}` },
        h("h3", {}, `Grades ${b.label}`),
        h(
          "ul",
          { class: "st-pills" },
          b.grades.map((g) =>
            h("li", {}, h("a", { class: "st-pick", href: `#/find?grade=${g}`, "aria-current": prefs.grade === g ? "true" : null }, GRADE_LABEL[g])),
          ),
        ),
      ),
    ),
  );
}

function subjectBrowser(prefs) {
  return h(
    "section",
    { "aria-labelledby": "st-browse-subject" },
    h("h2", { id: "st-browse-subject" }, "Browse by subject"),
    h(
      "ul",
      { class: "st-pills" },
      SUBJECTS.map((s) => {
        const q = prefs.grade ? `?grade=${prefs.grade}&subject=${s.id}` : `?subject=${s.id}`;
        return h("li", {}, h("a", { class: "st-pick", "data-subject": s.id, href: `#/find${q}`, "aria-current": prefs.subject === s.id ? "true" : null }, s.label));
      }),
    ),
  );
}

function contextLine(shell, prefs) {
  const has = prefs.grade || prefs.subject;
  if (has) {
    return h(
      "p",
      { class: "st-tip" },
      "Working in",
      prefs.grade ? h("span", { class: "st-chip st-chip-context" }, GRADE_LABEL[prefs.grade]) : null,
      prefs.subject ? subjectChip(prefs.subject) : null,
      h("a", { href: "#/find?change=1" }, "change"),
    );
  }
  const tour = h("button", { class: "st-btn st-btn-quiet", type: "button" }, "Take the 3-step tour");
  tour.addEventListener("click", () => startTour({ opener: tour, onDone: shell.prefs.setTourDone }));
  return h(
    "p",
    { class: "st-tip" },
    "Tip: start with Find my lesson. You can search a standard code such as 6.RP.A.3 or a word such as ratio.",
    shell.prefs.tourDone() ? null : tour,
  );
}

export async function render({ root, shell }) {
  const prefs = shell.prefs.getPrefs();
  shell.setTitle("Home");
  const strip = pickUpStrip(shell);
  root.append(
    h(
      "section",
      { class: "st-hero" },
      h("h1", {}, "What are you teaching today?"),
      h("p", { class: "st-lede" }, "Lessons, vocabulary, activities and class supports for Baltimore City teachers, kindergarten through grade 8, in every subject."),
      contextLine(shell, prefs),
    ),
    h("section", { class: "st-primary", "aria-label": "Start here" }, PRIMARY.map(primaryCard)),
    ...(strip ? [strip] : []),
    gradeBrowser(prefs),
    subjectBrowser(prefs),
    h("ul", { class: "st-secondary", "aria-label": "More tools" }, SECONDARY.map(([href, label]) => h("li", {}, h("a", { href }, label)))),
  );
}
