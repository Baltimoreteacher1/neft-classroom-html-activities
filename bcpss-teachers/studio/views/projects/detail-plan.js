// Project detail, planning half: overview, final product, checkpoints, day-by-day facilitation, student directions, visuals.
import { h } from "../../core/dom.js";
import { activityButton, chip, label, ol, para, section, ul, visualFigure } from "./parts.js";

export function overviewSection(p, { standards }) {
  const fp = p.finalProduct || {};
  return section(
    "overview",
    "Overview",
    para(p.intro),
    p.hook ? h("p", { class: "st-pj-hook" }, h("strong", {}, "Launch: "), p.hook) : null,
    label("Content targets"),
    ul(p.contentTargets),
    label("Final product"),
    h(
      "div",
      { class: "st-pj-product" },
      h("h3", {}, fp.title || "Final product"),
      para(fp.description),
      fp.parts?.length ? [label("Parts"), ul(fp.parts)] : null,
      fp.successCriteria?.length ? [label("Success criteria"), ul(fp.successCriteria)] : null,
      fp.audience
        ? h("p", { class: "st-pj-text" }, h("strong", {}, "Audience: "), fp.audience)
        : null,
    ),
    label("Standards"),
    standardsList(p.standards || [], standards),
    label("Materials"),
    ul(p.materials),
    label("Before you start"),
    ul(p.prep),
  );
}

function standardsList(codes, registry) {
  if (!codes.length) return para("No standards are listed for this project.");
  return h(
    "dl",
    { class: "st-pj-standards" },
    codes.map((code) => [
      h("dt", {}, h("code", {}, code)),
      h("dd", {}, registry.get(code)?.text || "This code is not in the standards registry."),
    ]),
  );
}

export function checkpointsSection(p, ctx) {
  const cards = (p.checkpoints || []).map((c, i) =>
    h(
      "li",
      { class: "st-pj-cp", id: `st-pj-cp-${c.id}` },
      h("h3", {}, `Checkpoint ${i + 1}: ${c.title}`),
      h("p", { class: "st-meta" }, c.days ? chip(c.days) : null),
      label("Evidence to collect"),
      para(c.evidence),
      c.prompt ? [label("Student prompt"), para(c.prompt)] : null,
      c.teacherLook?.length ? [label("Look for"), ul(c.teacherLook)] : null,
      activityButton(c.tool, ctx) ? h("p", { class: "st-row" }, activityButton(c.tool, ctx)) : null,
    ),
  );
  return section("checkpoints", "Checkpoints", h("ol", { class: "st-pj-cps" }, cards));
}

export function facilitationSection(p) {
  const days = (p.facilitation || []).map((d) =>
    h(
      "details",
      { class: "st-pj-day" },
      h(
        "summary",
        {},
        `Session ${d.day}: ${d.title}`,
        d.minutes ? h("span", { class: "st-pj-min" }, `${d.minutes} minutes`) : null,
      ),
      d.checkpoint
        ? h(
            "p",
            { class: "st-meta" },
            chip(`Builds checkpoint ${checkpointNumber(p, d.checkpoint)}`),
          )
        : null,
      label("Teacher moves"),
      ul(d.teacher),
      label("Students"),
      ul(d.students),
      d.watchFor
        ? h("p", { class: "st-pj-watch" }, h("strong", {}, "Watch for: "), d.watchFor)
        : null,
    ),
  );
  return section(
    "facilitation",
    "Session by session",
    days.length ? days : para("No session plan is listed."),
  );
}

const checkpointNumber = (p, id) => (p.checkpoints || []).findIndex((c) => c.id === id) + 1 || "";

export function directionsSection(p) {
  return section(
    "directions",
    "Student directions",
    h(
      "p",
      { class: "st-pj-hint" },
      "Read these with students at the start. Each line is one step of the project.",
    ),
    ol(p.studentDirections, "st-pj-steps"),
  );
}

export function sourcesSection(p) {
  if (!p.sources?.length) return null;
  return section(
    "sources",
    "Starter sources",
    h("p", { class: "st-pj-hint" }, "Short sources for practice before students find their own."),
    h(
      "ul",
      { class: "st-pj-sources" },
      p.sources.map((s) =>
        h(
          "li",
          { class: "st-pj-source" },
          h("h3", {}, s.title),
          s.note ? h("p", { class: "st-pj-note" }, s.note) : null,
          para(s.text),
        ),
      ),
    ),
  );
}

export function visualsSection(p) {
  if (!p.visuals?.length) return null;
  return section(
    "visuals",
    "Pictures and models",
    h("div", { class: "st-pj-figs" }, p.visuals.map(visualFigure)),
  );
}
