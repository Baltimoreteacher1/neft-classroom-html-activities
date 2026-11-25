// "My Week" plan display and export buttons. Student-facing text: none. Texts go in as text nodes.
import { announce, h } from "../../core/dom.js";
import { SOURCE_LABELS } from "../../../../shared/planner/constants.js";
import { copyWithNotice } from "../lens-ui.js";
import { apiUrl, dayHeading, linkFor, summaryLine } from "./model.js";

const itemRow = (it) =>
  h("li", { class: "st-wk-item" }, h("span", { class: "st-wk-min" }, `${it.minutes} min`), h("span", { class: "st-wk-title" }, it.title), h("span", { class: "st-wk-type" }, `${SOURCE_LABELS[it.source]}, ${it.domain}`));

function daySection(day) {
  return h(
    "section",
    { class: "st-wk-day", "aria-labelledby": `wk-day-${day.day}` },
    h("h3", { id: `wk-day-${day.day}` }, dayHeading(day)),
    day.items.length ? h("ul", { class: "st-wk-list" }, day.items.map(itemRow)) : h("p", { class: "st-hint" }, "Nothing fits this day."),
  );
}

function droppedSection(dropped) {
  if (!dropped.length) return h("p", { class: "st-hint" }, "Nothing was dropped.");
  return h(
    "details",
    { class: "st-wk-dropped", open: "" },
    h("summary", {}, `Dropped: ${dropped.length} ${dropped.length === 1 ? "item" : "items"}`),
    h("ul", { class: "st-wk-list" }, dropped.map((it) => h("li", { class: "st-wk-item" }, h("span", { class: "st-wk-min" }, `${it.minutes} min`), h("span", { class: "st-wk-title" }, it.title), h("span", { class: "st-wk-type" }, it.reason)))),
  );
}

function exportButtons(plan) {
  const { params } = plan;
  const link = (format, label, extra = {}) => h("a", { class: "st-btn", href: apiUrl(params, format), target: "_blank", rel: "noopener", ...extra }, label);
  const copy = h("button", { class: "st-btn", type: "button" }, "Copy link");
  copy.addEventListener("click", () => copyWithNotice(linkFor(params, location.origin, location.pathname), "Link"));
  const ics = params.start
    ? link("ics", ".ics calendar", { download: "" })
    : h("span", { class: "st-hint" }, "Pick a first day and rebuild to get a calendar file.");
  return h("p", { class: "st-row st-wk-actions" }, link("pdf", "Print"), link("docx", "DOCX", { download: "" }), copy, ics);
}

/** renderPlan(container, plan): replaces the container's children. */
export function renderPlan(container, plan) {
  container.replaceChildren(
    h("h2", { id: "wk-result" }, "Your week"),
    h("p", { class: "st-wk-summary" }, summaryLine(plan)),
    h("p", { class: "st-hint" }, `Materials: ${plan.materials}`),
    exportButtons(plan),
    ...plan.days.map(daySection),
    h("h3", {}, "What was left out"),
    droppedSection(plan.dropped),
    h("p", { class: "st-hint" }, plan.note),
  );
  announce(`Your week is ready. ${summaryLine(plan)}`);
}
