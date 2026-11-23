// Practice path for one class: a seven-, six- or five-step sequence from core/wida-path.js, adapted by pasted class
// evidence only where a domain has enough attempts. Supports move; the content demand never does.
import { classEvidence } from "../../core/evidence.js";
import { h } from "../../core/dom.js";
import { PATH_LENGTHS, buildPathway, classNeeds, normalizeProfile } from "../../core/wida-path.js";
import { emptyState, gradeLabel, plural } from "../../core/ui.js";
import { FRAMING, playLink, tierShort } from "./data.js";

function resourceActions(step, shell) {
  const r = step.resource;
  if (!r) return null;
  if (r.kind === "vocab") return h("a", { class: "st-btn", href: r.href }, "Open vocabulary");
  if (r.kind === "wida") {
    const independent = r.mode === "independent";
    const start = h(
      "button",
      { class: "st-btn st-btn-primary", type: "button" },
      independent ? "Start independent practice" : "Start practice",
      h("span", { class: "st-sr-only" }, `: ${r.title}`),
    );
    start.addEventListener("click", () =>
      window.open(playLink(shell, r.id, { tier: r.tier, independent }), "_blank", "noopener"),
    );
    return h(
      "div",
      { class: "st-row" },
      start,
      h(
        "a",
        { class: "st-btn", href: `#/wida/${encodeURIComponent(r.id)}?tier=${r.tier}` },
        "Teacher page",
      ),
    );
  }
  const open = h(
    "button",
    { class: "st-btn st-btn-primary", type: "button" },
    "Start activity",
    h("span", { class: "st-sr-only" }, `: ${r.title}`),
  );
  open.addEventListener("click", () =>
    window.open(shell.library.playUrl(r.id, { tier: r.tier }), "_blank", "noopener"),
  );
  return open;
}

function stepCard(step, shell) {
  const r = step.resource;
  return h(
    "li",
    {
      class: "st-card st-wida-step",
      "data-gap": String(Boolean(step.gap)),
      "data-domain": step.domain,
    },
    h("h3", {}, h("span", { class: "st-wida-stepn" }, `Step ${step.n}`), ` ${step.title}`),
    h(
      "p",
      { class: "st-meta" },
      h("span", { class: "st-chip st-wida-domain-chip", "data-domain": step.domain }, step.domain),
      step.klu ? h("span", { class: "st-chip st-chip-plain" }, step.klu) : null,
      step.tier
        ? h("span", { class: "st-chip st-chip-plain" }, `Supports: ${tierShort(step.tier)}`)
        : null,
      step.mode === "independent"
        ? h("span", { class: "st-chip st-chip-plain" }, "Independent practice")
        : null,
      step.adapted
        ? h("span", { class: "st-chip st-wida-adapted" }, "Adapted from class evidence")
        : null,
    ),
    h("p", {}, step.purpose),
    r ? h("p", {}, h("strong", {}, "Use: "), r.title) : null,
    step.gap
      ? h(
          "p",
          { class: "st-wida-gap" },
          h("strong", {}, "No matching resource yet. "),
          step.teacherMove ||
            "Run this step with a short teacher-made task for the same language use.",
        )
      : null,
    step.extra ? h("p", {}, h("strong", {}, "Teacher move: "), step.extra) : null,
    h("p", { class: "st-hint" }, step.why),
    resourceActions(step, shell),
  );
}

function planTable(path) {
  return h(
    "table",
    { class: "st-wida-plan" },
    h("caption", {}, "Where each domain starts"),
    h(
      "thead",
      {},
      h(
        "tr",
        {},
        ["Domain", "Class profile", "This path uses", "Evidence"].map((t) =>
          h("th", { scope: "col" }, t),
        ),
      ),
    ),
    h(
      "tbody",
      {},
      Object.values(path.plan).map((p) =>
        h(
          "tr",
          {},
          h("th", { scope: "row" }, p.domain),
          h("td", {}, tierShort(p.baseTier)),
          h("td", {}, tierShort(p.tier)),
          h("td", {}, p.statement),
        ),
      ),
    ),
  );
}

function needsList(needs) {
  return h(
    "div",
    { class: "st-wida-needs" },
    needs.map((n) =>
      h(
        "article",
        { class: "st-card", "data-domain": n.domain },
        h("h3", {}, n.domain),
        h("p", { class: "st-wida-signal" }, n.headline),
        h("p", { class: "st-hint" }, n.statement),
        h(
          "ul",
          { class: "st-plain-list" },
          n.actions.map((a) => h("li", {}, a.href ? h("a", { href: a.href }, a.label) : a.label)),
        ),
      ),
    ),
  );
}

export function renderPath({ root, params, shell, data }) {
  const classes = shell.classes.listClasses();
  root.append(
    h("h1", {}, "WIDA practice path"),
    h(
      "p",
      { class: "st-lede" },
      "A short sequence for one class: key words, listening, partner talk, guided writing, independent writing and transfer. The grade-level task stays the same; supports adapt to the class.",
    ),
    h("p", { class: "st-wida-framing", role: "note" }, FRAMING),
  );
  if (!classes.length) {
    root.append(
      emptyState({
        title: "Add a class first",
        body: "A path starts from a class profile: grade and rough language-proficiency counts. A class holds a nickname only, never student names.",
        actions: [
          h("a", { class: "st-btn st-btn-primary", href: "#/classes?new=1" }, "Create a class"),
          h("a", { class: "st-btn", href: "#/wida" }, "Browse WIDA practice"),
        ],
      }),
    );
    return;
  }
  const chosen = classes.find((c) => c.id === params.class) || classes[0];
  const out = h("div", { class: "st-wida-pathout", "aria-live": "polite" });
  const sel = h(
    "select",
    { id: "st-wida-class", name: "class" },
    classes.map((c) =>
      h(
        "option",
        { value: c.id, selected: c.id === chosen.id },
        `${c.nickname} (${gradeLabel(c.grade)})`,
      ),
    ),
  );
  const len = h(
    "select",
    { id: "st-wida-len", name: "length" },
    PATH_LENGTHS.map((n) =>
      h(
        "option",
        { value: String(n), selected: String(n) === (params.length || "7") },
        `${n} steps`,
      ),
    ),
  );
  const print = h("button", { class: "st-btn", type: "button" }, "Print this path");
  print.addEventListener("click", () => window.print());

  const paint = () => {
    const cls = classes.find((c) => c.id === sel.value) || chosen;
    shell.replaceHash(`#/wida/path?class=${encodeURIComponent(cls.id)}&length=${len.value}`);
    const profile = normalizeProfile(cls);
    const evidence = classEvidence(cls.id);
    out.replaceChildren();
    if (!profile.grade) {
      out.append(
        h(
          "p",
          { class: "st-error", role: "alert" },
          "This class has no grade. Edit the class and choose one.",
        ),
      );
      return;
    }
    const path = buildPathway({ profile, index: data.index, evidence, length: Number(len.value) });
    const needs = classNeeds({ profile, index: data.index, evidence });
    out.append(
      h(
        "p",
        { class: "st-wida-total", role: "status" },
        `${cls.nickname}: ${plural(path.length, "step")}. ${plural(evidence.filter((e) => e.eng === "wida-studio").length, "WIDA practice attempt")} on this device.`,
      ),
      h(
        "ul",
        { class: "st-plain-list" },
        path.notes.map((n) => h("li", {}, n)),
      ),
      planTable(path),
      h(
        "ol",
        { class: "st-wida-steps" },
        path.steps.map((s) => stepCard(s, shell)),
      ),
      h("h2", {}, "What this class needs by domain"),
      needsList(needs),
      h(
        "p",
        { class: "st-row" },
        h(
          "a",
          { class: "st-btn", href: `#/class/${encodeURIComponent(cls.id)}` },
          "Paste evidence on the class page",
        ),
        h("a", { class: "st-btn", href: `#/wida` }, "Read class results on the WIDA hub"),
      ),
      h(
        "p",
        { class: "st-wida-disclaimer" },
        "Suggestions come from your class profile and practice evidence you pasted. They are not scores, levels or ACCESS predictions.",
      ),
    );
    shell.announce(`Path built for ${cls.nickname}.`);
  };
  sel.addEventListener("change", paint);
  len.addEventListener("change", paint);
  root.append(
    h(
      "div",
      { class: "st-wida-pathform" },
      h("div", { class: "st-field" }, h("label", { for: "st-wida-class" }, "Class"), sel),
      h("div", { class: "st-field" }, h("label", { for: "st-wida-len" }, "Path length"), len),
      print,
    ),
    out,
  );
  paint();
}
