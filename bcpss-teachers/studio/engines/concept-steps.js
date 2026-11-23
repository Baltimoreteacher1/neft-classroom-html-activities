// Steps that follow a correct concept-builder check: "why" evidence (justify) and "What changed and why?" (explain).
import { h } from "../core/dom.js";

const words = (s) => (s.trim().match(/[\p{L}\p{N}'-]+/gu) || []).length;

/** Evidence step: pick the reasons that support the answer. Calls done({ok, loop}) when the learner continues. */
export function justifyStep(task, ctx, done, saved = {}) {
  const j = task.justify;
  const min = j.min ?? j.options.filter((o) => o.ok).length;
  const loop = ctx.loop({ id: `${task.id}-why`, hints: [], misconceptions: [], model: j.model, right: j.right || "Those reasons support it." });
  if (saved.loop) Object.assign(loop.state, saved.loop);
  const fb = ctx.feedback();
  const boxes = j.options.map((o) => h("input", { type: "checkbox", value: o.id, id: `st-cb-j-${task.id}-${o.id}`, checked: saved.picked?.includes(o.id) ? true : false }));
  const list = h(
    "fieldset",
    { class: "st-cb-justify" },
    h("legend", {}, j.prompt),
    j.options.map((o, i) => h("div", { class: "st-cb-check" }, boxes[i], h("label", { for: boxes[i].id }, o.text))),
  );
  const cont = h("button", { type: "button", class: "st-cb-btn st-cb-primary", hidden: true, onclick: () => done({ ok: loop.state.ok, loop }) }, "Continue to explain");
  const pressCheck = () => {
    const picked = j.options.filter((_, i) => boxes[i].checked);
    const wrong = picked.filter((o) => !o.ok);
    const right = picked.filter((o) => o.ok);
    if (!picked.length) return fb.show("retry", "Choose at least one reason first.");
    const ok = !wrong.length && right.length >= min;
    const r = loop.submit({ ok, tag: wrong[0]?.id });
    if (r.kind === "right") fb.show("right", `${r.text}`);
    else {
      const extra = wrong.map((o) => o.hint).filter(Boolean).join(" ");
      const base = wrong.length ? extra || "One of the reasons you chose does not show the answer. Look at the clues again." : "Good so far. Look for another reason that fits.";
      fb.show(r.kind === "model" ? "model" : "retry", r.kind === "model" ? `${base} ${j.model}` : base);
    }
    if (r.kind === "right" || r.kind === "model") cont.hidden = false;
    if (r.kind === "right") cont.focus();
  };
  const el = h("section", { class: "st-cb-step", "aria-label": "Why" }, h("h3", { tabindex: "-1" }, "Show your evidence"), list, h("div", { class: "st-cb-actions" }, h("button", { type: "button", class: "st-cb-btn st-cb-primary", onclick: pressCheck }, "Check my reasons"), cont), fb.el);
  if (loop.state.ok) cont.hidden = false;
  return { el, loop, picked: () => j.options.filter((_, i) => boxes[i].checked).map((o) => o.id) };
}

/** What changed and why. summary = [[label, text]], returns {el, text(), ticked()} and calls onContinue(text, ticked). */
export function explainStep(task, ctx, { summary, text = "", ticked = [], onInput, onContinue }) {
  const e = task.explain;
  const frames = e.frames[ctx.tier] || [];
  const ta = h("textarea", { class: "st-textarea st-cb-textarea", rows: "4", maxlength: "600", id: `st-cb-ex-${task.id}`, "aria-describedby": `st-cb-ex-help-${task.id}` }, text);
  const msg = h("p", { class: "st-cb-msg", role: "status", "aria-live": "polite" });
  const criteria = e.criteria || [
    { id: "c-changed", label: "I said what changed." },
    { id: "c-why", label: "I said why it changed." },
    { id: "c-words", label: "I used key words from the word bank or frames." },
  ];
  const ticks = criteria.map((c) => h("input", { type: "checkbox", id: `st-cb-c-${task.id}-${c.id}`, value: c.id, checked: ticked.includes(c.id) ? true : false }));
  const nudge = () => {
    const t = ta.value.toLowerCase();
    const mm = e.mustMention || [];
    if (!mm.length) return "";
    const seen = mm.filter((m) => m.any.some((w) => t.includes(w.toLowerCase())));
    const missing = mm.filter((m) => !seen.includes(m));
    return missing.length ? `I can see ${seen.length ? seen.map((m) => m.label).join(", ") : "none of the key ideas yet"}. Add ${missing.map((m) => m.label).join(" and ")}.` : `I can see every key idea: ${mm.map((m) => m.label).join(", ")}.`;
  };
  ta.addEventListener("input", () => onInput?.(ta.value, ticks.filter((x) => x.checked).map((x) => x.value)));
  for (const t of ticks) t.addEventListener("change", () => onInput?.(ta.value, ticks.filter((x) => x.checked).map((x) => x.value)));
  const el = h(
    "section",
    { class: "st-cb-step st-cb-explain", "aria-label": "What changed and why" },
    h("h3", { tabindex: "-1" }, "What changed and why?"),
    h("dl", { class: "st-cb-summary" }, summary.flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v)])),
    h("label", { for: ta.id, class: "st-cb-prompt" }, e.prompt),
    frames.length ? h("ul", { class: "st-frames", id: `st-cb-ex-help-${task.id}`, "aria-label": "Sentence frames" }, frames.map((f) => h("li", {}, f))) : h("span", { id: `st-cb-ex-help-${task.id}`, class: "st-sr-only" }, "Write in your own words."),
    ta,
    h("fieldset", { class: "st-cb-selfcheck" }, h("legend", {}, "Check yourself"), criteria.map((c, i) => h("div", { class: "st-cb-check" }, ticks[i], h("label", { for: ticks[i].id }, c.label)))),
    h(
      "div",
      { class: "st-cb-actions" },
      h("button", { type: "button", class: "st-cb-btn", onclick: () => (msg.textContent = nudge() || "Read your explanation aloud. Does it say what changed and why?") }, "Check my explanation"),
      h("button", { type: "button", class: "st-cb-btn st-cb-primary", onclick: () => (words(ta.value) < 4 ? (msg.textContent = "Write at least one full sentence (four words or more) about what changed and why.") : onContinue(ta.value.trim(), ticks.filter((x) => x.checked).map((x) => x.value))) }, "Continue"),
    ),
    msg,
  );
  return { el, text: () => ta.value, ticked: () => ticks.filter((x) => x.checked).map((x) => x.value), focus: () => ta.focus() };
}
