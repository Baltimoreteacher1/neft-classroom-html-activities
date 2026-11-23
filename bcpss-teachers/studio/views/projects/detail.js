// #/project/<id>: one project as a teacher plan. Header, jump links, then sections (see detail-plan.js and detail-assess.js).
import { renderActionBar } from "../../core/actions.js";
import { h } from "../../core/dom.js";
import { ELD_STANDARDS } from "../../data/taxonomy.js";
import { gradeLabel, icon } from "../../core/ui.js";
import {
  handoffSection,
  languageSection,
  reflectionSection,
  rubricSection,
  supportsSection,
} from "./detail-assess.js";
import {
  checkpointsSection,
  directionsSection,
  facilitationSection,
  overviewSection,
  sourcesSection,
  visualsSection,
} from "./detail-plan.js";
import { readTier, subjectName } from "./data.js";
import { chip } from "./parts.js";

const curriculumText = (c = {}) =>
  c.status === "district-referenced"
    ? `District-referenced${c.program ? `: ${c.program}` : ""}`
    : "Standards-aligned, not tied to a district unit";

/** Resolve the project's vocabulary into entries a teacher can read, or fall back to the bare ids. */
async function vocabFor(p, shell) {
  const v = p.vocab || {};
  if (v.entries?.length) return { entries: v.entries, ids: [], href: "" };
  if (v.collection) {
    try {
      const col = await shell.catalog.vocab(v.collection);
      const entries = (col.entries || []).filter((e) => !v.ids?.length || v.ids.includes(e.id));
      if (entries.length)
        return {
          entries: entries.map((e) => ({ word: e.word, def: e.def, example: e.context })),
          ids: [],
          href: `#/vocab/${encodeURIComponent(v.collection)}`,
        };
    } catch {
      /* the set is optional: fall back to the word list */
    }
  }
  return { entries: [], ids: v.ids || [], href: "" };
}

async function registryFor(shell) {
  try {
    return new Map((await shell.catalog.standards()).map((s) => [s.code, s]));
  } catch {
    return new Map();
  }
}

async function activityIds(shell) {
  try {
    return new Set((await shell.catalog.byKind("activity")).map((e) => e.id));
  } catch {
    return new Set();
  }
}

function header(p) {
  const review = p.review?.status !== "approved";
  const subjects = [...new Set([p.subject, ...(p.subjects || [])].filter(Boolean))];
  const mins =
    p.sessionMinutes && p.sessions ? `${p.sessions} sessions of ${p.sessionMinutes} minutes` : "";
  const wida = p.wida || {};
  return h(
    "header",
    { class: "st-pj-head" },
    h(
      "p",
      { class: "st-pj-crumbs" },
      h("a", { href: "#/projects" }, "Projects"),
      " / ",
      subjects.map(subjectName).join(", "),
    ),
    h("h1", {}, p.title),
    p.subtitle ? h("p", { class: "st-lede" }, p.subtitle) : null,
    h(
      "p",
      { class: "st-meta" },
      chip(p.grades?.length > 1 ? `Grades ${p.grades.join(" and ")}` : gradeLabel(p.grade)),
      subjects.map((s) => chip(subjectName(s))),
      mins ? chip(mins) : null,
      chip(curriculumText(p.curriculum), { tone: "curriculum", title: p.curriculum?.note }),
      review
        ? chip("Teacher review recommended", {
            tone: "review",
            title: "Checked by automated tests only. A teacher has not yet reviewed this resource.",
          })
        : chip("Reviewed", { tone: "ok" }),
      (wida.klus || []).map((k) => chip(k, { title: "WIDA Key Language Use" })),
      (wida.eld || []).map((e) => chip(e, { title: ELD_STANDARDS[e] || e })),
    ),
    p.curriculum?.note ? h("p", { class: "st-pj-note" }, p.curriculum.note) : null,
    h(
      "div",
      { class: "st-pj-dq-box" },
      h("p", { class: "st-pj-label" }, "Driving question"),
      h("p", { class: "st-pj-dq-big" }, p.drivingQuestion),
      p.studentQuestion
        ? [
            h("p", { class: "st-pj-label" }, "In student words"),
            h("p", { class: "st-pj-text" }, p.studentQuestion),
          ]
        : null,
    ),
  );
}

function jumpNav(sections) {
  const nav = h("nav", { class: "st-pj-jump", "aria-label": "Sections of this project" });
  for (const s of sections) {
    const b = h(
      "button",
      { class: "st-btn st-btn-quiet", type: "button" },
      s.querySelector("h2").textContent,
    );
    b.addEventListener("click", () => {
      const reduce =
        typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
      s.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "start" });
      s.querySelector("h2").focus({ preventScroll: true });
    });
    nav.append(b);
  }
  return nav;
}

/** The shared action bar prints through Resource Studio by lesson id, which a project is not: point it at our hand-off. */
function actionBar(p, shell, handoff) {
  const bar = renderActionBar(
    { kind: "project", id: p.id, title: p.title, grade: p.grade, subject: p.subject },
    shell,
  );
  const old = bar.querySelector('a[href^="#/create"]');
  if (old) {
    const b = h("button", { class: "st-btn", type: "button" }, icon("print"), "Print or export");
    b.addEventListener("click", () => {
      handoff.scrollIntoView?.({ block: "start" });
      handoff.querySelector("h2").focus({ preventScroll: true });
    });
    old.replaceWith(b);
  }
  const link = [...bar.querySelectorAll("button")].find((b) => /student link/i.test(b.textContent));
  link?.remove();
  return bar;
}

export async function renderDetail({ root, params, shell, project: p }) {
  const [standards, known, vocab] = await Promise.all([
    registryFor(shell),
    activityIds(shell),
    vocabFor(p, shell),
  ]);
  const ctx = { shell, tier: readTier(params.tier), known, standards };
  const handoff = await handoffSection(p, ctx);
  const sections = [
    overviewSection(p, ctx),
    sourcesSection(p),
    visualsSection(p),
    checkpointsSection(p, ctx),
    facilitationSection(p),
    directionsSection(p),
    rubricSection(p),
    supportsSection(p, ctx),
    languageSection(p, vocab),
    reflectionSection(p),
    handoff,
  ].filter(Boolean);

  root.replaceChildren(
    h(
      "div",
      { class: "st-pj-detail" },
      header(p),
      actionBar(p, shell, handoff),
      jumpNav(sections),
      ...sections,
    ),
  );

  // Open every session before printing so the printed plan is complete, then restore what the teacher had open.
  let opened = [];
  const before = () => {
    opened = [...root.querySelectorAll("details:not([open])")];
    for (const d of opened) d.open = true;
  };
  const after = () => {
    for (const d of opened) d.open = false;
    opened = [];
  };
  window.addEventListener("beforeprint", before);
  window.addEventListener("afterprint", after);
  return () => {
    window.removeEventListener("beforeprint", before);
    window.removeEventListener("afterprint", after);
  };
}

