// Speaking task renderers: speak-describe, speak-explain, speak-compare, speak-argue.
// Never scored, never transcribed. Optional local recording. Self-check against the success criteria.
import { h } from "../../core/dom.js";
import { speak } from "../../core/speech.js";
import { createRecorder } from "./recorder.js";
import { figure, radioGroup, supportsBlock, uid } from "./ui.js";

function planning(task, env, r) {
  r.plan = r.plan || {};
  const p = task.planning;
  const box = h("section", { class: "st-wida-plan", "aria-label": "Planning" }, h("h4", {}, "Plan what you will say"), h("p", { class: "st-wida-quiet" }, p?.prompt || "Take the time you need. There is no timer."));
  for (const row of p?.organizer?.rows || []) {
    const id = uid("plan");
    const input = h("input", { type: "text", id, class: "st-wida-input", value: r.plan[row.id] || "", placeholder: row.placeholder || "A few words are enough", maxlength: "160", autocomplete: "off" });
    input.addEventListener("input", () => {
      r.plan[row.id] = input.value;
      env.set(r);
    });
    box.append(h("div", { class: "st-wida-noterow" }, h("label", { for: id }, row.label), input));
  }
  return box;
}

const prompts = {
  "speak-describe": (t) => [t.visual ? figure(t.visual) : null],
  "speak-explain": (t) => [
    t.visual ? figure(t.visual) : null,
    t.steps?.length ? h("div", { class: "st-wida-cover" }, h("h4", {}, "Cover these ideas"), h("ol", {}, t.steps.map((s) => h("li", {}, s.text)))) : null,
  ],
  "speak-compare": (t) => [
    h("div", { class: "st-wida-compare" }, t.items.map((it) => figure(it.visual, it.label))),
    h("p", {}, h("strong", {}, "Compare on: "), t.compareOn.join(", ")),
  ],
  "speak-argue": (t, env, r) => [
    h("p", { class: "st-wida-question" }, t.question),
    radioGroup({ legend: "My position", name: uid("pos"), options: t.positions, value: r.position, onPick: (v) => { r.position = v; env.set(r); } }),
    h("div", { class: "st-wida-cover" }, h("h4", {}, "Evidence you can use"), h("ul", {}, t.evidence.map((e) => h("li", {}, e.text)))),
    t.counter ? h("p", { class: "st-wida-quiet" }, h("strong", {}, "Another view: "), t.counter) : null,
  ],
};

export function build(task, env) {
  const r = structuredClone(env.response || {});
  r.checks = r.checks || {};
  const rec = createRecorder({ onChange: (has) => { r.hasRec = has; env.set(r); } });
  const words = task.wordsToUse?.length
    ? h("div", { class: "st-wida-words" }, h("strong", {}, "Words to try: "), h("ul", { class: "st-wordbank", "aria-label": "Words to try" }, task.wordsToUse.map((w) => h("li", {}, h("button", { type: "button", class: "st-chip", onclick: () => speak(w) }, w)))))
    : null;

  const modelBtn = h("button", { type: "button", class: "st-btn" }, "Hear a model answer");
  const modelText = h("p", { class: "st-wida-modeltext", hidden: true });
  const modelWrap = h("div", { class: "st-wida-model" }, modelBtn, modelText);
  modelBtn.addEventListener("click", () => {
    const m = task.modelResponse[env.tier()];
    modelText.hidden = false;
    modelText.replaceChildren(h("strong", {}, "A model, not the only right answer: "), m);
    r.heardModel = true;
    env.set(r);
    speak(m);
  });
  const modelRefresh = () => {
    const open = env.supportsOpen();
    const said = !!r.said || env.preview;
    modelWrap.hidden = !open;
    modelBtn.disabled = !said;
    modelBtn.title = said ? "" : "Say your answer first, then listen to a model.";
    if (!said && open) modelBtn.setAttribute("aria-describedby", "st-wida-model-hint");
  };
  env.addRefresh(modelRefresh);

  const checks = h("fieldset", { class: "st-wida-checks" }, h("legend", {}, "Check my talk"));
  const items = [{ id: "__said", text: "I said my answer out loud." }, ...task.selfCheck];
  for (const c of items) {
    const id = uid("chk");
    const input = h("input", { type: "checkbox", id });
    input.checked = c.id === "__said" ? !!r.said : !!r.checks[c.id];
    input.addEventListener("change", () => {
      if (c.id === "__said") r.said = input.checked;
      else r.checks[c.id] = input.checked;
      env.set(r);
      modelRefresh();
    });
    checks.append(h("div", { class: "st-wida-option" }, input, h("label", { for: id }, c.text)));
  }
  const el = h(
    "div",
    { class: "st-wida-task", "data-type": task.type },
    ...prompts[task.type](task, env, r),
    planning(task, env, r),
    supportsBlock(task, env),
    words,
    h("p", { class: "st-wida-quiet", id: "st-wida-model-hint" }, "Say your answer out loud to a partner or into the optional recorder. Nothing here listens to or scores your speaking."),
    rec.el,
    checks,
    modelWrap,
  );
  modelRefresh();
  return { el, mark() {}, destroy: () => rec.destroy() };
}
