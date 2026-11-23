// The revision cycle: draft -> targeted feedback checklist -> revise -> compare drafts.
// Used by every Writing task (checks = language targets) and by write-revise (checks = task.checks).
import { announce, h } from "../../core/dom.js";
import { diffWords, wordCount } from "./check.js";
import { uid } from "./ui.js";

/**
 * createRevision({ getDraft, checks, state, onChange, fixedDraft?, intro? }) -> { el, refresh() }
 *  checks: [{id, label|question, tip?}]    state: the task response's `rev` object (mutated in place)
 *  fixedDraft: start at the checklist with this draft (write-revise); otherwise a "Check my draft" button starts it.
 */
export function createRevision({ getDraft, checks, state, onChange, fixedDraft, intro }) {
  state.marks = state.marks || {};
  if (fixedDraft && state.draft1 == null) {
    state.draft1 = fixedDraft;
    state.stage = state.stage || 1;
  }
  const root = h("section", { class: "st-wida-revision", "aria-label": "Revise my writing" });
  const save = () => onChange?.(state);
  const go = (stage) => {
    state.stage = stage;
    save();
    draw(true);
  };

  const start = () => {
    const btn = h("button", { type: "button", class: "st-btn", disabled: !wordCount(getDraft()) }, "Check my draft");
    btn.addEventListener("click", () => {
      state.draft1 = getDraft();
      state.marks = {};
      state.draft2 = undefined;
      go(1);
    });
    return [h("h4", {}, "Check and revise"), h("p", { class: "st-wida-quiet" }, intro || "When you have a draft, check it against the targets, then improve it and compare."), btn];
  };

  const stage1 = () => [
    h("h4", { tabindex: "-1", class: "st-wida-stagehead" }, "Step 1. Check the draft"),
    h("div", { class: "st-wida-draftbox", "aria-label": "Draft 1" }, h("p", { class: "st-wida-kicker" }, "Draft 1"), h("p", {}, state.draft1)),
    ...checks.map((c) => {
      const name = uid("rv");
      const fs = h("fieldset", { class: "st-wida-check" }, h("legend", {}, c.question || c.label));
      const tip = h("p", { class: "st-wida-tip", hidden: state.marks[c.id] !== "no" }, h("strong", {}, "Try this: "), c.tip || "Add this to your next draft.");
      for (const [v, text] of [["yes", "Yes"], ["no", "Not yet"]]) {
        const id = uid("rvo");
        const input = h("input", { type: "radio", name, id, value: v });
        input.checked = state.marks[c.id] === v;
        input.addEventListener("change", () => {
          state.marks[c.id] = v;
          tip.hidden = v !== "no";
          save();
        });
        fs.append(h("span", { class: "st-wida-radio" }, input, h("label", { for: id }, text)));
      }
      fs.append(tip);
      return fs;
    }),
    h("div", { class: "st-row" }, h("button", { type: "button", class: "st-btn st-primary", onclick: () => go(2) }, "Revise my draft")),
  ];

  const stage2 = () => {
    if (state.draft2 == null) state.draft2 = state.draft1;
    const id = uid("rev");
    const ta = h("textarea", { id, class: "st-textarea", rows: "5", "aria-label": "Draft 2", spellcheck: "true" });
    ta.value = state.draft2;
    const count = h("p", { class: "st-wida-count", "aria-live": "off" }, `${wordCount(ta.value)} words`);
    ta.addEventListener("input", () => {
      state.draft2 = ta.value;
      count.textContent = `${wordCount(ta.value)} words`;
      save();
    });
    const notYet = checks.filter((c) => state.marks[c.id] === "no");
    return [
      h("h4", { tabindex: "-1", class: "st-wida-stagehead" }, "Step 2. Revise"),
      notYet.length ? h("ul", { class: "st-wida-tips" }, notYet.map((c) => h("li", {}, c.tip || c.label || c.question))) : h("p", { class: "st-wida-quiet" }, "Everything was marked Yes. Look for one more way to make the writing clearer."),
      h("label", { for: id }, "Draft 2"),
      ta,
      count,
      h("div", { class: "st-row" }, h("button", { type: "button", class: "st-btn", onclick: () => go(1) }, "Back to the checklist"), h("button", { type: "button", class: "st-btn st-primary", onclick: () => go(3) }, "Compare my drafts")),
    ];
  };

  const stage3 = () => {
    const spans = (t) => diffWords(state.draft1, t).map((p) => (p.added ? h("mark", { class: "st-wida-added" }, p.text) : p.text));
    return [
      h("h4", { tabindex: "-1", class: "st-wida-stagehead" }, "Step 3. Compare"),
      h("p", { class: "st-wida-quiet" }, "Words that are new in Draft 2 are highlighted. Word counts are shown for information only."),
      h("div", { class: "st-wida-compare-drafts" }, h("div", { class: "st-wida-draftbox" }, h("p", { class: "st-wida-kicker" }, `Draft 1 (${wordCount(state.draft1)} words)`), h("p", {}, state.draft1)), h("div", { class: "st-wida-draftbox" }, h("p", { class: "st-wida-kicker" }, `Draft 2 (${wordCount(state.draft2)} words)`), h("p", {}, ...spans(state.draft2 || "")))),
      h("p", {}, "Which change helps the reader most? Tell a partner."),
      h("div", { class: "st-row" }, h("button", { type: "button", class: "st-btn", onclick: () => go(2) }, "Keep revising"), h("button", { type: "button", class: "st-btn", onclick: () => go(1) }, "Check again")),
    ];
  };

  function draw(focus) {
    const stage = state.stage || 0;
    root.replaceChildren(...[start, stage1, stage2, stage3][stage]());
    if (focus) {
      root.querySelector(".st-wida-stagehead")?.focus();
      announce(["", "Step 1. Check the draft.", "Step 2. Revise.", "Step 3. Compare drafts."][stage]);
    }
  }
  draw(false);
  return { el: root, refresh: () => !state.stage && draw(false) };
}
