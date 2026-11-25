// #/unit/<seedUnitId>: one K-8 BCPSS seed unit, with the Studio lessons, vocabulary and activities that reference it,
// a Language Lens hand-off and a printable family card. District-referenced only; nothing here claims district adoption.
import { favoriteButton } from "../core/actions.js";
import { announce, h } from "../core/dom.js";
import { gradeLabel } from "../core/ui.js";
import { SUBJECT_PROFILE } from "../data/taxonomy.js";
import { chip, ensureCss, getCatalog, idFrom } from "./lens-ui.js";
import { badge, loadUnitSummary } from "./review/badges.js";
import { describeStandards, familyModel, isUnknownUnit, studioFor, subjectIdOf } from "./unit/data.js";
import { familyCard } from "./unit/family.js";
import { activitiesSection, lensSection, lessonsSection, standardsSection, vocabSection } from "./unit/sections.js";

let cssLoaded = false;
function ensureUnitCss() {
  ensureCss();
  if (cssLoaded || typeof document === "undefined") return;
  cssLoaded = true;
  if (!document.querySelector("link[data-st-un-css]")) document.head.append(h("link", { rel: "stylesheet", href: new URL("./unit/unit.css", import.meta.url).href, "data-st-un-css": "1" }));
}

const qs = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v)).toString();

function stateView({ title, message, role = "status", actions = [] }) {
  return h("section", { class: "st-ll st-ll-state st-un", role }, h("h1", {}, title), h("p", {}, message), h("p", { class: "st-ll-row" }, actions));
}

const linkBtn = (href, text, primary = false) => h("a", { class: `st-ll-btn${primary ? " st-ll-btn-primary" : ""}`, href }, text);

/** Review badge for the unit and its lessons, filled in when the summary arrives. Absent if it cannot be loaded. */
function reviewBadgeSlot(unitId) {
  const slot = h("span", { class: "st-rv-slot" });
  loadUnitSummary(unitId).then((s) => {
    if (!s) return;
    const { reviewed, draft, in_review: inReview } = s.counts;
    slot.append(badge(s.state, { detail: `${reviewed} of ${s.blocks.length} parts reviewed (${inReview} in review, ${draft} draft).` }));
  });
  return slot;
}

function header(unit, ctx, shell) {
  const reviewSlot = reviewBadgeSlot(unit.id);
  const ref = { kind: "unit", id: unit.id, title: `Unit ${unit.unit_number}: ${unit.unit_title}`, grade: unit.grade };
  return h(
    "header",
    { class: "st-un-head" },
    h("p", { class: "st-ll-crumbs" }, h("a", { href: ctx.finder }, "Find my lesson"), " / ", `${ctx.gradeText} ${ctx.subjectText}`),
    h("h1", {}, ref.title),
    h(
      "div",
      { class: "st-ll-chips" },
      chip(ctx.gradeText),
      chip(ctx.subjectText),
      chip(`District-referenced${unit.curriculum_name ? `: ${unit.curriculum_name}` : ""}`, { title: "Listed in the BCPSS seed the Studio references. This is not a statement of district adoption." }),
      chip("Teacher review recommended", { tone: "review", title: "Checked by automated tests only. A teacher has not yet reviewed this page." }),
      reviewSlot,
    ),
    unit.unit_summary ? h("p", {}, unit.unit_summary) : null,
    unit.essential_question ? h("p", {}, h("strong", {}, "Essential question: "), unit.essential_question) : null,
    h("p", { class: "st-ll-muted" }, "This unit comes from the BCPSS seed list the Studio references. The Studio does not say which units a school has adopted or in what order they are taught."),
    shell?.library ? favoriteButton(ref, shell) : null,
  );
}

export async function render({ root, params = {}, shell }) {
  ensureUnitCss();
  const id = idFrom(params);
  const catalog = await getCatalog(shell);
  const retry = () => render({ root, params, shell });
  const say = (text) => (shell?.announce ? shell.announce(text) : announce(text));
  root.replaceChildren(h("p", { class: "st-ll st-loading", role: "status" }, "Loading unit"));

  let detail;
  try {
    detail = await catalog.seedUnit(id);
  } catch (err) {
    const unknown = isUnknownUnit(err);
    const tryAgain = h("button", { class: "st-ll-btn st-ll-btn-primary", type: "button" }, "Try again");
    tryAgain.addEventListener("click", retry);
    root.replaceChildren(
      unknown
        ? stateView({ title: "We could not find that unit", message: `There is no district seed unit called "${id}". It may have been mistyped, or it is not in the K-8 ELA, math, science and social studies seed.`, actions: [linkBtn("#/find", "Find my lesson", true), linkBtn("#/", "Go to the home page")] })
        : stateView({ title: "This unit did not load", message: "The district unit could not be loaded. Check your connection and try again.", role: "alert", actions: [tryAgain, linkBtn("#/find", "Find my lesson")] }),
    );
    shell?.setTitle?.(unknown ? "Unit not found" : "Unit did not load");
    say(unknown ? "We could not find that unit." : "The unit did not load.");
    return undefined;
  }

  const unit = detail?.unit;
  if (!unit) {
    root.replaceChildren(stateView({ title: "We could not find that unit", message: `There is no district seed unit called "${id}".`, actions: [linkBtn("#/find", "Find my lesson", true)] }));
    return undefined;
  }
  const subjectId = subjectIdOf(unit.subject);
  const gradeText = gradeLabel(unit.grade);
  const subjectText = SUBJECT_PROFILE[subjectId]?.short || unit.subject;
  const ctx = {
    gradeText,
    subjectText,
    finder: `#/find?${qs({ grade: unit.grade, subject: subjectId })}`,
    lens: `#/lens?${qs({ grade: unit.grade, subject: subjectId })}`,
    create: `#/create?${qs({ grade: unit.grade, subject: subjectId, source: "topic", title: unit.unit_title })}`,
  };
  shell?.setTitle?.(`Unit ${unit.unit_number}: ${unit.unit_title}`);

  // The unit page is useful on its own; Studio links and the standards registry are best effort.
  const [registry, studio] = await Promise.all([
    Promise.resolve(catalog.standards?.()).catch(() => []),
    studioFor(catalog, unit).catch(() => ({ lessons: [], collections: [], activities: [] })),
  ]);
  const standards = describeStandards(unit.core_standards, registry);
  const conn = detail.connections?.[0];
  const seedTerms = (conn?.tier2_tier3_vocab || []).map((t) => ({ term: t.term, def: t.student_friendly_def || t.kid_def || "" })).filter((t) => t.term);

  root.replaceChildren(
    h(
      "div",
      { class: "st-ll st-un" },
      header(unit, ctx, shell),
      standardsSection(standards),
      lessonsSection(studio.lessons, ctx.finder),
      vocabSection(studio.collections, seedTerms),
      activitiesSection(studio.activities, detail.activities || []),
      lensSection(conn, ctx.lens),
      familyCard({ unit, model: familyModel(unit, standards, studio.lessons), gradeText, subjectText, createHandoff: ctx.create }),
    ),
  );
  say(`Unit loaded: ${unit.unit_title}. ${studio.lessons.length} Studio ${studio.lessons.length === 1 ? "lesson" : "lessons"}.`);
  return undefined;
}
