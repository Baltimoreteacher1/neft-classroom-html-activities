// #/review — the reviewer queue: blocks waiting for a human, filters, and bulk moves with the sample check.
// #/review/<blockId> opens one block (detail.js). Teacher gate: the site teacher key (see api.js).
import { h } from "../../core/dom.js";
import { api, apiText, explain, setKey } from "./api.js";
import { badge, ensureReviewCss } from "./badges.js";
import { gatePanel, reviewerPayload, signedIn } from "./gate.js";

const DIMS = [
  ["", "Any check"],
  ["pedagogy", "Pedagogy"],
  ["language_qa", "Language"],
  ["accessibility", "Accessibility"],
  ["bias_sensitivity", "Bias and sensitivity"],
  ["math_science_accuracy", "Math and science accuracy"],
];
const DIM_NAME = Object.fromEntries(DIMS);
const STATES = [["", "Any state"], ["draft", "Draft"], ["in_review", "In review"], ["reviewed", "Reviewed"], ["needs_changes", "Needs changes"]];
const GRADES = ["", "K", "1", "2", "3", "4", "5", "6", "7", "8"];
const SUBJECTS = [["", "Any subject"], ["ela", "ELA"], ["math", "Math"], ["science", "Science"], ["social studies", "Social studies"]];
const AGES = [["", "Any age"], ["7", "Older than 7 days"], ["30", "Older than 30 days"], ["90", "Older than 90 days"]];

const select = (id, label, options, value) =>
  h(
    "div",
    { class: "st-field" },
    h("label", { for: id }, label),
    h("select", { id }, options.map((o) => { const [v, t] = Array.isArray(o) ? o : [o, o || "Any grade"]; return h("option", { value: v, selected: v === value }, t); })),
  );

const stateText = (s) => ({ draft: "draft", in_review: "in review", reviewed: "reviewed", needs_changes: "needs changes", retired: "retired" })[s] || s;

function itemRow(item, picked, onPick) {
  const box = h("input", { type: "checkbox", id: `st-rv-pick-${item.id}`, "aria-label": `Select ${item.title}` });
  box.checked = picked.has(item.id);
  box.addEventListener("change", () => onPick(item.id, box.checked));
  const dims = Object.entries(item.states)
    .filter(([d]) => d !== "translation")
    .map(([d, s]) => h("li", {}, `${DIM_NAME[d] || d}: ${stateText(s)}`));
  const fails = item.verifierFailureTotal ? h("li", { class: "st-rv-fail" }, `${item.verifierFailureTotal} verifier finding${item.verifierFailureTotal === 1 ? "" : "s"}`) : null;
  const age = item.age_days === null ? "never reviewed" : item.age_days === 0 ? "touched today" : `last touched ${item.age_days} days ago`;
  return h(
    "li",
    { class: "st-rv-item" },
    box,
    h(
      "div",
      {},
      h("h3", {}, h("a", { href: `#/review/${encodeURIComponent(item.id)}` }, item.title)),
      h("p", { class: "st-meta" }, badge(item.badge), ` ${item.unitId} · ${item.kind === "lesson" ? "lesson" : "unit studio"} · ${age}`),
      h("ul", { class: "st-rv-dims" }, dims, fails),
    ),
  );
}

export async function render({ root, params = {}, shell }) {
  ensureReviewCss();
  if (params.id) return (await import("./detail.js")).renderDetail({ root, id: params.id, shell });
  const st = { grade: params.grade || "", subject: params.subject || "", dimension: params.dimension || "pedagogy", state: params.state || "in_review", olderThanDays: params.olderThanDays || "", offset: 0 };
  const picked = new Set();
  let sample = null;
  const out = h("div", { class: "st-rv" });
  root.replaceChildren(h("h1", {}, "Reviewer queue"), out);

  const paint = (...nodes) => out.replaceChildren(...nodes);

  async function load() {
    if (!signedIn()) return paint(gatePanel(load));
    paint(h("p", { class: "st-loading", role: "status" }, "Loading the queue"));
    const q = new URLSearchParams({ limit: "50", offset: String(st.offset) });
    for (const k of ["grade", "subject", "dimension", "state", "olderThanDays"]) if (st[k]) q.set(k, st[k]);
    const res = await api(`/api/review/queue?${q}`);
    if (res.status === 401) {
      setKey("");
      return paint(h("div", { class: "st-rv-error", role: "alert" }, explain(res)), gatePanel(load));
    }
    if (!res.ok) return paint(h("div", { class: "st-rv-error", role: "alert" }, explain(res), " ", retryButton()));
    paint(filters(), summaryLine(res.data), bulkBar(res.data), list(res.data), pager(res.data), logLink());
  }

  function logLink() {
    const b = h("button", { class: "st-btn", type: "button" }, "Download the review log (CSV)");
    const note = h("span", { role: "status" });
    b.addEventListener("click", async () => {
      const res = await apiText("/api/review/log.csv");
      if (!res.ok) return note.replaceChildren(explain(res));
      const url = URL.createObjectURL(new Blob([res.text], { type: "text/csv;charset=utf-8" }));
      const a = h("a", { href: url, download: "review-log.csv" });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      note.replaceChildren("Downloaded.");
    });
    return h("p", { class: "st-rv-actions" }, b, note);
  }

  const retryButton = () => {
    const b = h("button", { class: "st-btn", type: "button" }, "Try again");
    b.addEventListener("click", load);
    return b;
  };

  function filters() {
    const form = h(
      "form",
      { class: "st-rv-panel st-rv-filters", "aria-label": "Queue filters" },
      select("st-rv-f-grade", "Grade", GRADES, st.grade),
      select("st-rv-f-subject", "Subject", SUBJECTS, st.subject),
      select("st-rv-f-dimension", "Check", DIMS, st.dimension),
      select("st-rv-f-state", "State", STATES, st.state),
      select("st-rv-f-age", "Waiting", AGES, st.olderThanDays),
      h("button", { class: "st-btn st-btn-primary", type: "submit" }, "Show"),
    );
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = (id) => form.querySelector(id).value;
      Object.assign(st, { grade: val("#st-rv-f-grade"), subject: val("#st-rv-f-subject"), dimension: val("#st-rv-f-dimension"), state: val("#st-rv-f-state"), olderThanDays: val("#st-rv-f-age"), offset: 0 });
      picked.clear();
      sample = null;
      load();
    });
    return form;
  }

  const summaryLine = (data) => h("p", { role: "status" }, `${data.total} block${data.total === 1 ? "" : "s"} match. Oldest activity first; never-reviewed blocks last.`);

  function bulkBar(data) {
    const note = h("p", { class: "st-rv-hint", role: "status" }, st.dimension ? `Bulk moves apply to the "${DIM_NAME[st.dimension]}" check on the blocks you tick.` : "Pick one check in the filter to move blocks in bulk.");
    const say = (text, isError = false) => note.replaceChildren(isError ? h("span", { class: "st-rv-fail", role: "alert" }, text) : text);
    const items = () => [...picked].map((blockId) => ({ blockId, dimension: st.dimension }));
    const move = async (state) => {
      if (!st.dimension) return say("Choose a single check in the filter first.", true);
      if (!picked.size) return say("Tick at least one block.", true);
      const reviewer = reviewerPayload();
      if (state === "reviewed" && picked.size > 10 && !sample) {
        const s = await api("/api/review/bulk/sample", { method: "POST", body: { items: items(), reviewer } });
        if (!s.ok) return say(explain(s), true);
        sample = s.data;
        return paint(filters(), samplePanel(), bulkBar(data), list(data), pager(data));
      }
      const body = { items: items(), state, reviewer, ...(sample ? { sample: { token: sample.token, reviewed: sample.sample.map((i) => `${i.blockId}|${i.dimension}|${i.lang || ""}`) } } : {}) };
      const res = await api("/api/review/bulk", { method: "POST", body });
      if (!res.ok) return say(explain(res), true);
      picked.clear();
      sample = null;
      shell?.announce?.(`${res.data.count} moved, ${res.data.skipped} already there.`);
      load();
    };
    const mk = (text, state) => {
      const b = h("button", { class: "st-btn", type: "button" }, text);
      b.addEventListener("click", () => move(state));
      return b;
    };
    return h("div", { class: "st-rv-panel" }, h("div", { class: "st-rv-actions" }, mk("Start review on ticked", "in_review"), mk("Approve ticked", "reviewed")), note);
  }

  function samplePanel() {
    return h(
      "section",
      { class: "st-rv-panel", "aria-labelledby": "st-rv-sample-h" },
      h("h2", { id: "st-rv-sample-h" }, "Read three of these first"),
      h("p", {}, `You are approving ${picked.size} blocks. The site picked three at random. Open each one, read it and approve it on its own page, then come back and press Approve ticked again.`),
      h("ul", {}, sample.sample.map((i) => h("li", {}, h("a", { href: `#/review/${encodeURIComponent(i.blockId)}` }, i.blockId)))),
    );
  }

  function list(data) {
    if (!data.items.length) return h("p", { class: "st-empty" }, "Nothing matches these filters.");
    const onPick = (id, on) => (on ? picked.add(id) : picked.delete(id));
    return h("ul", { class: "st-rv-list" }, data.items.map((i) => itemRow(i, picked, onPick)));
  }

  function pager(data) {
    if (data.total <= data.limit) return h("span");
    const go = (offset) => () => {
      st.offset = offset;
      load();
    };
    const prev = h("button", { class: "st-btn", type: "button", disabled: st.offset === 0 }, "Previous");
    const next = h("button", { class: "st-btn", type: "button", disabled: st.offset + data.limit >= data.total }, "Next");
    prev.addEventListener("click", go(Math.max(0, st.offset - data.limit)));
    next.addEventListener("click", go(st.offset + data.limit));
    return h("p", { class: "st-rv-actions" }, prev, next, `${st.offset + 1} to ${Math.min(data.total, st.offset + data.limit)} of ${data.total}`);
  }

  await load();
  return undefined;
}
