// Section builders for the unit view. Each returns a node and reads only what the view hands it.
import { h } from "../../core/dom.js";
import { playUrl } from "../../core/library.js";
import { ENGINES } from "../../data/taxonomy.js";
import { chip, section } from "../lens-ui.js";

const ENGINE_LABEL = Object.fromEntries(ENGINES.map((e) => [e.id, e.label]));
const humanize = (id) => String(id).replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const link = (href, text, cls = "st-ll-link") => h("a", { class: cls, href }, text);
const cardList = (items) => h("ul", { class: "st-un-cards" }, items.map((i) => h("li", { class: "st-un-card" }, i)));

export function standardsSection(standards) {
  return section(
    "Standards the district seed lists",
    standards.length
      ? h(
          "dl",
          { class: "st-ll-kv st-un-std" },
          standards.flatMap((s) => [h("dt", {}, h("code", {}, s.code)), h("dd", {}, s.text || "No Studio summary for this code yet.")]),
        )
      : h("p", { class: "st-ll-muted" }, "The seed lists no standards for this unit."),
  );
}

export function lessonsSection(lessons, finder) {
  const body = lessons.length
    ? cardList(
        lessons.map((p) => [
          h("h3", {}, link(`#/lesson/${encodeURIComponent(p.id)}`, p.title)),
          h("p", { class: "st-ll-muted" }, [p.duration ? `${p.duration} minutes` : "", "Teacher review recommended"].filter(Boolean).join(" | ")),
          p.contentObjective ? h("p", {}, p.contentObjective) : null,
        ]),
      )
    : h(
        "div",
        { class: "st-un-empty", "data-testid": "no-lessons" },
        h("p", {}, "No Studio lesson is written for this unit yet. The district seed details below still apply."),
        link(finder, "Find other Studio materials", "st-ll-btn"),
      );
  return section("Studio lessons for this unit", body);
}

export function vocabSection(collections, seedTerms) {
  const kids = [];
  if (collections.length)
    kids.push(
      cardList(
        collections.map((c) => [
          h("h3", {}, link(`#/vocab/${encodeURIComponent(c.id)}`, c.title || humanize(c.id))),
          h("p", { class: "st-ll-muted" }, `${(c.entries || []).length} words with pictures and sentences`),
        ]),
      ),
    );
  else kids.push(h("p", { class: "st-ll-muted" }, "No Studio vocabulary collection is attached to this unit yet."));
  if (seedTerms.length)
    kids.push(
      h("h3", {}, "Key terms the district seed names"),
      h("div", { class: "st-ll-chips" }, seedTerms.map((t) => chip(t.term, { title: t.def || "" }))),
    );
  return section("Vocabulary", ...kids);
}

export function activitiesSection(studio, seedActivities) {
  const kids = [];
  if (studio.length)
    kids.push(
      cardList(
        studio.map((a) => [
          h("h3", {}, a.title || humanize(a.id)),
          h("p", { class: "st-ll-muted" }, [ENGINE_LABEL[a.engine] || a.engine, a.minutes ? `${a.minutes} minutes` : "", `from "${a.lessonTitle}"`].filter(Boolean).join(" | ")),
          h(
            "div",
            { class: "st-ll-row" },
            h("a", { class: "st-ll-btn st-ll-btn-primary", href: playUrl(a.id, { lessonId: a.lessonId }), target: "_blank", rel: "noopener", "aria-label": `Play ${a.title || humanize(a.id)} (opens the student player)` }, "Play"),
            h("a", { class: "st-ll-btn", href: playUrl(a.id, { lessonId: a.lessonId, projector: true }), target: "_blank", rel: "noopener", "aria-label": `Project ${a.title || humanize(a.id)}` }, "Project"),
          ),
        ]),
      ),
    );
  else kids.push(h("p", { class: "st-ll-muted" }, "No interactive Studio activity is attached to this unit yet."));
  if (seedActivities.length)
    kids.push(
      h("h3", {}, "Classroom activity ideas in the district seed"),
      h(
        "ul",
        { class: "st-ll-list" },
        seedActivities.map((a) => {
          const bits = [a.activity_type, a.duration_minutes ? `${a.duration_minutes} minutes` : ""].filter(Boolean).join(", ");
          return h("li", {}, bits ? `${a.title} (${bits})` : a.title);
        }),
      ),
    );
  return section("Activities", ...kids);
}

export function lensSection(connection, lensHref) {
  const c = connection || {};
  const pairs = [
    ["Key language use", c.wida_klu],
    ["Language move", c.move_name],
    ["Sentence pattern", c.syntax_pattern],
    ["Example frame", c.unit_example_frame],
  ].filter(([, v]) => v);
  return section(
    "Language Lens",
    pairs.length
      ? h("dl", { class: "st-ll-kv" }, pairs.flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v)]))
      : h("p", { class: "st-ll-muted" }, "The seed lists no language move for this unit."),
    h("p", {}, "Paste a passage or word problem from this unit and the Language Lens will point out the words and sentence patterns students may need help with."),
    link(lensHref, "Open the Language Lens", "st-ll-btn st-ll-btn-primary"),
  );
}
