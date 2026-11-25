// #/review/<blockId> — one block: its state per check, the content side by side with what was last approved,
// and the form a human uses to record a decision. The server recomputes the hash; this page sends none.
import { h } from "../../core/dom.js";
import { api, explain, setKey } from "./api.js";
import { badge } from "./badges.js";
import { changedCount, diffLines, linesOf } from "./diff.js";
import { gatePanel, reviewerPayload, signedIn } from "./gate.js";

const DIM_NAME = {
  pedagogy: "Pedagogy",
  language_qa: "Language",
  accessibility: "Accessibility",
  bias_sensitivity: "Bias and sensitivity",
  math_science_accuracy: "Math and science accuracy",
  translation: "Translation",
};
const STATE_NAME = { draft: "Draft", in_review: "In review", reviewed: "Reviewed", needs_changes: "Needs changes", retired: "Retired" };
const MOVES = [["in_review", "Mark in review"], ["reviewed", "Approve"], ["needs_changes", "Needs changes"], ["retired", "Retire"]];

function diffView(last, now) {
  if (!last) return h("p", { class: "st-rv-hint" }, "No approved version yet, so there is nothing to compare. The current content is below.");
  const rows = diffLines(linesOf(last.snapshot), linesOf(now));
  const changed = changedCount(rows);
  const cells = rows.flatMap((r) => [
    h("pre", { "data-kind": r.kind === "added" ? "same" : r.kind }, r.left ?? ""),
    h("pre", { "data-kind": r.kind === "removed" ? "same" : r.kind }, r.right ?? ""),
  ]);
  return h(
    "section",
    { "aria-labelledby": "st-rv-diff-h" },
    h("h2", { id: "st-rv-diff-h" }, "Compare with the last approved version"),
    h("p", { role: "status" }, changed ? `${changed} line${changed === 1 ? "" : "s"} changed since ${last.reviewer_name} approved it on ${last.reviewer_date}.` : "The content is the same as the last approved version."),
    h("div", { class: "st-rv-diff", role: "group", "aria-label": "Side-by-side comparison" }, h("div", { class: "st-rv-diff-head" }, "Last approved"), h("div", { class: "st-rv-diff-head" }, "Now"), cells),
  );
}

function decisionForm(detail, reload) {
  const dims = Object.keys(detail.states).flatMap((d) => (d === "translation" ? Object.keys(detail.states.translation).map((l) => [`translation|${l}`, `Translation (${l})`]) : [[d, DIM_NAME[d] || d]]));
  const dim = h("select", { id: "st-rv-dim" }, dims.map(([v, t]) => h("option", { value: v }, t)));
  const comment = h("textarea", { id: "st-rv-comment", rows: "3", maxlength: "500" });
  const note = h("p", { role: "status", class: "st-rv-hint" });
  const send = async (state) => {
    const [dimension, lang] = dim.value.split("|");
    const body = { blockId: detail.block.id, dimension, ...(lang ? { lang } : {}), state, reviewer: reviewerPayload(), ...(comment.value.trim() ? { comment: comment.value.trim() } : {}) };
    const res = await api("/api/review/decide", { method: "POST", body });
    if (res.status === 401) {
      setKey("");
      return reload();
    }
    if (!res.ok) return note.replaceChildren(h("span", { class: "st-rv-fail", role: "alert" }, explain(res)));
    note.replaceChildren(`Recorded: ${STATE_NAME[res.data.event.to]}.`);
    reload();
  };
  const buttons = MOVES.map(([state, text]) => {
    const b = h("button", { class: "st-btn", type: "button" }, text);
    b.addEventListener("click", () => send(state));
    return b;
  });
  return h(
    "section",
    { class: "st-rv-panel st-rv-form", "aria-labelledby": "st-rv-decide-h" },
    h("h2", { id: "st-rv-decide-h" }, "Record a decision"),
    h("div", { class: "st-field" }, h("label", { for: "st-rv-dim" }, "Check"), dim),
    h("div", { class: "st-field" }, h("label", { for: "st-rv-comment" }, "Note (required for needs changes and retire; no student or family details)"), comment),
    h("div", { class: "st-rv-actions" }, buttons),
    note,
  );
}

export async function renderDetail({ root, id, shell }) {
  const body = h("div", { class: "st-rv" });
  root.replaceChildren(h("p", {}, h("a", { href: "#/review" }, "Back to the queue")), h("h1", {}, "Review a block"), body);
  async function load() {
    if (!signedIn()) return body.replaceChildren(gatePanel(load));
    const res = await api(`/api/review/block/${encodeURIComponent(id)}`);
    if (res.status === 401) {
      setKey("");
      return body.replaceChildren(h("div", { class: "st-rv-error", role: "alert" }, explain(res)), gatePanel(load));
    }
    if (!res.ok) return body.replaceChildren(h("div", { class: "st-rv-error", role: "alert" }, explain(res)));
    const d = res.data;
    const title = d.block.content.title || d.block.content.unit_title || d.block.id;
    shell?.setTitle?.(`Review: ${title}`);
    // Who and when, from the block's own review record (empty until a human has decided). Never filled in here.
    const who = (dim) => {
      const r = dim?.reviewers?.at(-1);
      return r ? ` · ${r.name} (${r.role}), ${r.date}` : " · no reviewer yet";
    };
    const states = Object.entries(d.states).flatMap(([k, v]) =>
      k === "translation"
        ? Object.entries(v).map(([l, s]) => [`Translation (${l})`, s, who(d.block.review.translation?.[l])])
        : [[DIM_NAME[k] || k, v, who(d.block.review[k])]],
    );
    body.replaceChildren(
      h("p", { class: "st-meta" }, badge(d.badge), ` ${d.block.id} · grade ${d.block.grade} · ${d.block.subject} · ${d.block.provenance.origin}, version ${d.block.provenance.version}`),
      h("ul", { class: "st-rv-dims" }, states.map(([n, s, by]) => h("li", {}, `${n}: ${STATE_NAME[s] || s}${by}`))),
      decisionForm(d, load),
      diffView(d.lastReviewed, d.block.content),
      h("section", {}, h("h2", {}, "Current content"), h("pre", { class: "st-rv-panel", tabindex: "0", "aria-label": "Current content as data" }, linesOf(d.block.content).join("\n"))),
      h("section", {}, h("h2", {}, "Recent decisions"), d.history.length ? h("ul", {}, d.history.map((e) => h("li", {}, `${e.reviewer_date}: ${e.reviewer_name} (${e.reviewer_role}) moved ${DIM_NAME[e.dimension] || e.dimension} from ${e.from_state} to ${e.to_state}${e.comment ? `: ${e.comment}` : ""}`))) : h("p", {}, "No decisions recorded yet.")),
    );
  }
  await load();
  return undefined;
}
