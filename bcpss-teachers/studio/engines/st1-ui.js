// UI pieces shared by the engines-1 activities (visual-match, language-detective, early-sort).
// Plain DOM, no state beyond what each function returns.
import { h } from "../core/dom.js";
import { renderVisual } from "../core/visuals.js";
import { reflectionBlock } from "./engine-core.js";
export { blankOut, wordRegex } from "./st1-text.js";

/** A rendered visual spec as an element. The SVG carries role=img + title/desc. */
export function visualEl(spec, cls = "") {
  const el = h("div", { class: `st-visual ${cls}`.trim() });
  try {
    el.innerHTML = renderVisual(spec);
  } catch (err) {
    el.textContent = spec?.alt || "";
    el.dataset.error = String(err?.message || err);
  }
  return el;
}

/** Speaker button. The label text is the transcript; aria-label says what will be read. */
export function speakBtn(ctx, text, { label, lang = "en-US", iconOnly = false, cls = "" } = {}) {
  const b = h(
    "button",
    {
      type: "button",
      class: `st-speak ${iconOnly ? "st-icon-only" : ""} ${cls}`.trim(),
      "aria-label": label || `Hear: ${text}`,
    },
    iconOnly ? null : label || "Hear it",
  );
  b.addEventListener("click", async () => {
    b.dataset.speaking = "true";
    await ctx.speak(text, { lang });
    delete b.dataset.speaking;
  });
  return b;
}

export function muteButton(ctx) {
  if (ctx.root.closest("[data-host-mute]")) return null;
  const b = h(
    "button",
    { type: "button", class: "st-btn st-mute", "aria-pressed": String(ctx.isMuted()) },
    "Sound off",
  );
  const paint = () => {
    b.setAttribute("aria-pressed", String(ctx.isMuted()));
    b.textContent = ctx.isMuted() ? "Sound is off" : "Sound off";
    b.setAttribute("aria-label", ctx.isMuted() ? "Turn sound on" : "Mute sound");
  };
  b.addEventListener("click", () => {
    ctx.setMuted(!ctx.isMuted());
    paint();
  });
  paint();
  return b;
}

/** Progress: a bar with a text count (visual-match, detective) or big dots (early-sort). */
export function progress({ total, dots = false, noun = "done" }) {
  const wrap = h("div", { class: "st-progress" });
  if (dots) {
    const row = h("div", { class: "st-dots", role: "img", "aria-label": `0 of ${total} ${noun}` });
    for (let i = 0; i < total; i++)
      row.append(h("span", { class: "st-dot", "data-state": "todo" }));
    wrap.append(row);
    return {
      el: wrap,
      set(done) {
        [...row.children].forEach((d, i) => {
          d.dataset.state = i < done ? "done" : i === done ? "now" : "todo";
        });
        row.setAttribute("aria-label", `${done} of ${total} ${noun}`);
      },
    };
  }
  const fill = h("span", { style: "width:0%" });
  const bar = h(
    "div",
    {
      class: "st-progress-bar",
      role: "progressbar",
      "aria-valuemin": "0",
      "aria-valuemax": String(total),
      "aria-valuenow": "0",
    },
    fill,
  );
  const label = h("span", {}, `0 of ${total} ${noun}`);
  wrap.append(bar, label);
  return {
    el: wrap,
    set(done, text) {
      fill.style.width = `${Math.round((done / total) * 100)}%`;
      bar.setAttribute("aria-valuenow", String(done));
      label.textContent = text || `${done} of ${total} ${noun}`;
    },
  };
}

/** Standard stage: tools row + progress + body. Returns {el, body, tools, progress}. */
export function stage(ctx, { engine, total, dots = false, noun, extraTools = [] }) {
  ctx.root.textContent = "";
  const prog = progress({ total, dots, noun });
  const tools = h("div", { class: "st-tools" }, [muteButton(ctx), ...extraTools].filter(Boolean));
  const head = h("header", { class: "st-head" }, tools, prog.el);
  const body = h("div", { class: "st-body" });
  const el = h(
    "section",
    {
      class: "st-stage",
      "data-engine": engine,
      "data-projector": String(ctx.mode === "projector"),
    },
    head,
    body,
  );
  ctx.root.append(el);
  return { el, body, tools, progress: prog };
}

/**
 * A short multiple-choice transfer item shown after repeated misses.
 * transfer = {prompt, options:[{id,text?,visual?,word?}], answer, explain}. Calls onDone() after a right answer.
 */
export function transferCard(ctx, transfer, onDone) {
  const fb = ctx.feedback();
  const list = h("div", { class: "st-row", role: "group", "aria-label": transfer.prompt });
  for (const o of transfer.options) {
    const label = o.text || o.word || "";
    const b = h(
      "button",
      {
        type: "button",
        class: "st-btn st-transfer-opt",
        "data-opt": o.id,
        "aria-label": label || o.visual?.alt,
      },
      o.visual ? visualEl(o.visual, "st-mini") : null,
      label ? h("span", {}, label) : null,
    );
    b.addEventListener("click", () => {
      if (o.id === transfer.answer) {
        fb.show("right", transfer.explain || "That works.");
        for (const x of list.querySelectorAll("button")) x.disabled = true;
        go.hidden = false;
        go.focus();
      } else {
        fb.show("retry", "Not that one. Look at the choices again.");
      }
    });
    list.append(b);
  }
  const go = h(
    "button",
    { type: "button", class: "st-btn st-primary", hidden: true, onclick: () => onDone?.() },
    "Back to the activity",
  );
  return h(
    "section",
    { class: "st-card st-transfer", "aria-label": "Try a related one" },
    h("h3", {}, "Try a related one"),
    h("p", { class: "st-prompt" }, transfer.prompt),
    list,
    fb.el,
    go,
  );
}

/** Final reflection step. `onFinish(text)` receives the learner's reflection (may be empty). */
export function reflectionStep(ctx, { cta = "Finish", oral = false, write = true } = {}) {
  const block = reflectionBlock(ctx);
  const el = h("div", { class: "st-card st-reflection" });
  const done = h("button", { type: "button", class: "st-btn st-primary" }, cta);
  if (oral) {
    const { prompt } = ctx.activity.reflection || {};
    const frames = (ctx.activity.reflection?.frames || {})[ctx.tier] || [];
    el.append(
      h("h3", {}, "Tell someone"),
      h("p", { class: "st-prompt" }, prompt || "Tell a grown-up one thing you did."),
      speakBtn(ctx, prompt || "Tell a grown-up one thing you did.", { label: "Hear it" }),
      frames.length
        ? h(
            "ul",
            { class: "st-frames", "aria-label": "Sentence starters" },
            frames.map((f) => h("li", {}, f)),
          )
        : null,
    );
    if (write) el.append(block.el);
  } else el.append(block.el);
  el.append(h("div", { class: "st-row" }, done));
  return { el, button: done, value: () => (oral && !write ? "" : block.value()) };
}

export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
export const sample = (list, n) => list.slice(0, n);
