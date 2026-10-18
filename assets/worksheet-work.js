/* Extend the existing paper worksheet with local, saveable reasoning controls. */
(() => {
  "use strict";
  if (
    document.documentElement.dataset.supportAudience === "teacher" ||
    !document.querySelector(".ws-page") ||
    document.querySelector("[data-worksheet-work]")
  )
    return;
  const node = (tag, text, cls) => {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  };
  const hash = (text) => {
    let n = 2166136261;
    for (const char of text) n = Math.imul(n ^ char.charCodeAt(0), 16777619);
    return (n >>> 0).toString(36);
  };
  const fields = [];
  const selections = [];
  const occurrences = new Map();
  function field(host, prompt, suffix = "reasoning") {
    const scope = host.closest(".ws-page");
    const context = [
      scope?.querySelector(".ws-edition")?.textContent,
      host.querySelector(".ws-stem, .ws-example-problem, .ws-block-title")?.textContent,
      suffix,
    ].join("|");
    const key = hash(context);
    const count = occurrences.get(key) || 0;
    occurrences.set(key, count + 1);
    const id = `ws-work-${key}-${count}`;
    const box = node("div", null, "ws-digital-work");
    const label = node("label", prompt);
    label.htmlFor = id;
    const input = node("textarea");
    input.id = id;
    input.name = id;
    input.rows = 3;
    input.maxLength = 12000;
    input.setAttribute("aria-describedby", "ws-work-status");
    box.append(label, input);
    host.append(box);
    fields.push({
      input,
      context:
        host.querySelector(".ws-stem, .ws-example-problem, .ws-block-title")?.textContent || prompt,
      edition: scope?.querySelector(".ws-edition")?.textContent || "",
    });
    return box;
  }
  const toolbar = node("section", null, "ws-work-tools");
  toolbar.dataset.worksheetWork = "";
  toolbar.setAttribute("aria-label", "Work on this worksheet");
  toolbar.append(node("h2", "Think • represent • explain"));
  const status = node(
    "p",
    "Write or sketch on paper, or type your reasoning here. Use Save / Resume to keep a backup or resume code. Drafts and self-checks are not automatically graded.",
  );
  status.id = "ws-work-status";
  toolbar.append(status);
  const download = node("button", "Download my reasoning");
  download.type = "button";
  download.addEventListener("click", () => {
    const lines = [
      document.title,
      "Student reasoning — draft for review; not an automatic grade.",
      "",
    ];
    for (const { input, context, edition } of fields)
      if (input.value.trim()) lines.push(edition, context, input.value, "");
    for (const { group, context } of selections) {
      const checked = group.querySelector("input:checked");
      if (checked)
        lines.push(context, `Selected option: ${checked.closest("label").textContent}`, "");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = node("a");
    a.href = url;
    a.download = `${document.documentElement.dataset.ewlSupportsLesson || "worksheet"}-reasoning.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  toolbar.append(download);
  const models = node("a", "Open Math Workbench in another tab to build a model");
  models.href = "/curriculum/math-workbench/";
  models.target = "_blank";
  models.rel = "noopener";
  toolbar.appendChild(node("p")).append(models);
  document.querySelector("main, .sheet")?.prepend(toolbar);
  document.querySelectorAll(".ws-problem-card").forEach((card) => {
    const number = card.querySelector(".ws-pnum")?.textContent || "";
    const opts = card.querySelectorAll(".ws-opt");
    if (opts.length) {
      const group = node("fieldset", null, "ws-digital-choice");
      group.append(node("legend", `Problem ${number}: choose after showing your reasoning`));
      const name = `ws-choice-${hash(card.textContent)}-${fields.length}`;
      opts.forEach((opt, i) => {
        const label = node("label");
        const input = node("input");
        input.type = "radio";
        input.name = name;
        input.id = `${name}-${i}`;
        input.value = String(i);
        label.append(input, document.createTextNode(opt.textContent.trim()));
        group.append(label);
      });
      card.append(group);
      selections.push({
        group,
        context: card.querySelector(".ws-stem")?.textContent || `Problem ${number}`,
      });
      card.querySelector(".ws-opts")?.classList.add("ws-screen-concealed");
    }
    field(
      card,
      `Problem ${number}: show a model, calculation, or evidence. Explain how it supports your answer.`,
    );
    const hint = card.querySelector(".ws-hint");
    if (hint) {
      const toggle = node("button", "Show task hint", "ws-hint-toggle");
      toggle.type = "button";
      hint.classList.add("ws-screen-concealed");
      hint.id ||= `ws-hint-${fields.length}`;
      toggle.setAttribute("aria-controls", hint.id);
      toggle.setAttribute("aria-expanded", "false");
      toggle.addEventListener("click", () => {
        const hidden = hint.classList.toggle("ws-screen-concealed");
        toggle.setAttribute("aria-expanded", String(!hidden));
        toggle.textContent = hidden ? "Show task hint" : "Hide task hint";
      });
      hint.before(toggle);
    }
  });
  document.querySelectorAll(".ws-block-example").forEach((example, index) => {
    const steps = [...example.querySelectorAll(".ws-example-steps > li, .ws-example-answer")];
    if (!steps.length) return;
    field(example, "Predict the first step. Explain why it fits this problem.", "prediction");
    let shown = 0;
    const button = node("button", "Reveal one worked step", "ws-example-reveal");
    button.type = "button";
    const feedback = node("p", "Predict first, then compare one step at a time.", "ws-step-status");
    feedback.setAttribute("role", "status");
    steps.forEach((step, i) => {
      step.classList.add("ws-screen-concealed");
      step.id ||= `ws-example-${index}-${i}`;
    });
    button.setAttribute("aria-controls", steps.map((s) => s.id).join(" "));
    button.addEventListener("click", () => {
      if (shown === steps.length) {
        steps.forEach((step) => step.classList.add("ws-screen-concealed"));
        shown = 0;
      } else steps[shown++].classList.remove("ws-screen-concealed");
      feedback.textContent = `${shown} of ${steps.length} worked steps shown. Compare with your prediction; revise your reasoning if needed.`;
      button.textContent =
        shown === steps.length ? "Reconstruct with steps hidden" : "Reveal one worked step";
    });
    example.append(button, feedback);
  });
  document
    .querySelectorAll(".ws-block-explain, .ws-block-author")
    .forEach((box) =>
      field(
        box,
        "Make your mathematical evidence visible. Numbers, labels, and a concise explanation are welcome.",
      ),
    );
})();
