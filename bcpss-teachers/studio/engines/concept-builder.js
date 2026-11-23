// Concept Builder engine: manipulate a representation, check it against data-defined targets, then explain what changed.
// Data shape: concept-builder.schema.md. Kinds live in concept-kinds/*.js (pure state + DOM mount per kind).
import { h } from "../core/dom.js";
import { loadCss, reflectionBlock } from "./engine-core.js";
import { evaluate } from "./concept-kinds/checks.js";
import { loadKind } from "./concept-kinds/index.js";
import { clone, sentence } from "./concept-kinds/shared.js";
import { explainStep, justifyStep } from "./concept-steps.js";

const modelFor = (a, t) => ({ ...a.model, ...(t.setup || {}) });
const fresh = () => ({ i: 0, phase: "work", states: {}, starts: {}, loops: {}, why: {}, explain: {}, ticked: {}, modelShown: {}, reflection: "" });

export default {
  id: "concept-builder",

  async mount(ctx) {
    loadCss("engines-base.css");
    loadCss("concept-builder.css");
    const a = ctx.activity;
    const kind = await loadKind(a.kind);
    const root = ctx.root;
    root.replaceChildren();
    root.classList.add("st-cb-root");
    root.classList.toggle("is-projector", ctx.mode === "projector");

    let S = fresh();
    const saved = ctx.resume();
    if (saved?.state?.v === a.version && saved.state.s?.i < a.tasks.length + 2) {
      S = { ...fresh(), ...saved.state.s };
      for (const r of saved.state.records || []) ctx.items.set(r.id, r);
      if (saved.tier && saved.tier !== ctx.tier) ctx.setTier(saved.tier);
    }
    let cur = null; // {t, model, loop, widget, state, fb, stepHost, ...}
    let disposers = [];

    const persist = () => {
      if (cur) S.loops[cur.t.id] = clone(cur.loop.state);
      ctx.save({ v: a.version, s: S, records: [...ctx.items.values()] });
    };
    const onTier = ctx.onTier(() => {
      const hd = root.querySelector(".st-cb-head");
      if (hd) {
        const keep = hd.contains(document.activeElement);
        hd.replaceWith(header());
        if (keep) root.querySelector('.st-tierpick [aria-pressed="true"]')?.focus();
      }
      if (!cur) return;
      rebuildSupport();
      if (S.phase === "explain") showStep();
    });

    const header = () => {
      const total = a.tasks.length;
      const inReflect = S.i >= total;
      const reset = h("span", { class: "st-cb-reset" });
      const askReset = () => {
        reset.replaceChildren(
          h("span", {}, "This clears your work on this device. "),
          h("button", { type: "button", class: "st-cb-btn", onclick: restart }, "Yes, start over"),
          h("button", { type: "button", class: "st-cb-btn st-cb-quiet", onclick: () => reset.replaceChildren(startBtn) }, "Cancel"),
        );
        reset.querySelector("button").focus();
      };
      const startBtn = h("button", { type: "button", class: "st-cb-btn st-cb-quiet", onclick: askReset }, "Start over");
      reset.append(startBtn);
      return h(
        "header",
        { class: "st-cb-head" },
        h("div", {}, h("h2", { class: "st-cb-title" }, a.title), h("p", { class: "st-cb-progress" }, inReflect ? "Reflect" : `Task ${S.i + 1} of ${total}`)),
        h("div", { class: "st-cb-head-tools" }, ctx.tierPicker("Support"), reset),
      );
    };

    function restart() {
      ctx.clearProgress();
      ctx.items.clear();
      S = fresh();
      cur = null;
      render(true);
    }

    function cleanup() {
      cur?.widget?.destroy?.();
      disposers.forEach((d) => d());
      disposers = [];
    }

    async function render(focus = false) {
      cleanup();
      root.replaceChildren(header());
      if (S.phase === "done") return renderDone();
      if (S.i >= a.tasks.length) return renderReflect();
      await renderTask(focus);
    }

    function rebuildSupport() {
      const item = { supports: cur.t.supports };
      const sp = ctx.supportPanel(item);
      cur.supportHost.replaceChildren(sp.el);
    }

    async function renderTask(focus) {
      const t = a.tasks[S.i];
      const model = modelFor(a, t);
      const loop = ctx.loop({ id: t.id, hints: t.hints, misconceptions: t.misconceptions || [], model: t.model, right: t.right || "That works." });
      Object.assign(loop.state, S.loops[t.id] || {});
      const state = clone(S.states[t.id] ?? t.start ?? kind.initialState(model));
      S.starts[t.id] ??= clone(state);
      S.states[t.id] = state;
      const fb = ctx.feedback();
      const supportHost = h("div", {});
      const widgetHost = h("div", { class: "st-cb-widget" });
      const stepHost = h("div", { class: "st-cb-steps" });
      cur = { t, model, loop, state, fb, supportHost, stepHost, widget: null };

      const checkBtn = h("button", { type: "button", class: "st-cb-btn st-cb-primary", onclick: onCheck }, "Check");
      const hintBtn = h("button", { type: "button", class: "st-cb-btn", onclick: onHint }, "Hint");
      const modelBtn = h("button", { type: "button", class: "st-cb-btn", hidden: true, onclick: showModel }, "Show the model on the screen");
      const title = h("h3", { class: "st-cb-prompt", tabindex: "-1" }, t.prompt);
      const intro = S.i === 0 && !Object.keys(S.loops).length ? h("p", { class: "st-cb-intro" }, a.intro) : null;
      root.append(
        h("section", { class: "st-cb-task", "aria-label": `Task ${S.i + 1}` }, intro, title, t.goal ? h("p", { class: "st-cb-goal" }, h("strong", {}, "Goal: "), t.goal) : null, supportHost, widgetHost, h("div", { class: "st-cb-actions" }, checkBtn, hintBtn, modelBtn), fb.el),
        stepHost,
      );
      rebuildSupport();

      cur.widget = await kind.mount(widgetHost, {
        model,
        state: clone(state),
        tier: ctx.tier,
        announce: ctx.announce,
        onChange(next) {
          cur.state = next;
          S.states[t.id] = next;
          if (S.phase !== "work") {
            S.phase = "work";
            stepHost.replaceChildren();
            fb.show("retry", "You changed the model, so check it again.");
          }
          persist();
        },
      });
      if (loop.state.ok || S.modelShown[t.id]) cur.widget.reveal?.(true);
      if (S.phase !== "work") {
        if (loop.state.ok) fb.show("right", `${t.right || "That works."} ${sentence(kind.describe(model, cur.state))}`);
        showStep();
      }
      if (loop.state.tries >= 3 && !loop.state.ok) modelBtn.hidden = false;
      if (focus) title.focus();

      function onHint() {
        const text = loop.nextHint();
        fb.show("hint", loop.state.hints > t.hints.length ? `${text} That was the last hint. Try Check and read the feedback.` : text || "Look at the model and try once more.");
        persist();
      }

      function onCheck() {
        const v = kind.value(model, cur.state);
        const ok = evaluate(t.check, v);
        const tag = ok ? undefined : (t.misconceptions || []).find((m) => m.when && evaluate(m.when, v))?.match;
        let r = loop.submit({ ok, tag });
        if (r.kind === "retry" && !tag) {
          const hnt = loop.nextHint();
          if (hnt) r = { ...r, text: hnt };
        }
        if (r.kind === "right") {
          fb.show("right", `${r.text} ${sentence(kind.describe(model, cur.state))}`);
          cur.widget.reveal?.(true);
          S.phase = t.justify ? "justify" : "explain";
          showStep(true);
        } else {
          cur.widget.mark?.(v);
          fb.show(r.kind === "model" ? "model" : "retry", r.text);
          if (r.kind === "model") {
            modelBtn.hidden = false;
            ctx.announce("Here is a model. Press Show the model on the screen to see it.");
          }
        }
        persist();
      }

      function showModel() {
        cur.state = clone(t.target);
        S.states[t.id] = cur.state;
        S.modelShown[t.id] = true;
        cur.widget.setState(clone(cur.state));
        cur.widget.reveal?.(true);
        fb.show("model", `${t.model} The model is now on the screen: ${sentence(kind.describe(model, cur.state))}`);
        S.phase = t.justify ? "justify" : "explain";
        showStep(true);
        persist();
      }
    }

    function showStep(focus = false) {
      const { t, model, stepHost, loop } = cur;
      stepHost.replaceChildren();
      if (S.phase === "justify") {
        const step = justifyStep(
          t,
          ctx,
          ({ loop: wl }) => {
            ctx.settle(wl);
            S.why[t.id] = { loop: clone(wl.state), picked: step.picked(), done: true };
            S.phase = "explain";
            persist();
            showStep(true);
          },
          S.why[t.id],
        );
        stepHost.append(step.el);
        if (focus) step.el.querySelector("h3").focus();
        return;
      }
      if (S.phase !== "explain") return;
      const summary = [
        ["Start", kind.describe(model, S.starts[t.id])],
        ["Now", kind.describe(model, cur.state)],
      ];
      if (S.modelShown[t.id] && !loop.state.ok) summary.push(["Note", "You looked at the model, so this is the model's answer. Explain what it shows."]);
      const step = explainStep(t, ctx, {
        summary,
        text: S.explain[t.id] || "",
        ticked: S.ticked[t.id] || [],
        onInput(text, ticked) {
          S.explain[t.id] = text;
          S.ticked[t.id] = ticked;
          persist();
        },
        onContinue(text, ticked) {
          S.explain[t.id] = text;
          S.ticked[t.id] = ticked;
          ctx.settle(loop);
          S.i += 1;
          S.phase = "work";
          cur = null;
          persist();
          render(true);
        },
      });
      stepHost.append(step.el);
      if (focus) step.el.querySelector("h3").focus();
    }

    function renderReflect() {
      cur = null;
      const rb = reflectionBlock(ctx, a.reflection);
      const msg = h("p", { class: "st-cb-msg", role: "status" });
      const ta = rb.el.querySelector("textarea");
      ta.value = S.reflection || "";
      ta.addEventListener("input", () => {
        S.reflection = ta.value;
        persist();
      });
      root.append(
        h("section", { class: "st-cb-step" }, rb.el, h("div", { class: "st-cb-actions" }, h("button", { type: "button", class: "st-cb-btn st-cb-primary", onclick: () => {
          if (rb.value().split(/\s+/).filter(Boolean).length < 3) return (msg.textContent = "Write a sentence about what helped you or what you would try next.");
          ctx.finish(rb.value());
          S.phase = "done";
          S.reflection = rb.value();
          render(true);
        } }, "Finish")), msg),
      );
    }

    function renderDone() {
      const rows = a.tasks.map((t) => {
        const r = ctx.items.get(t.id);
        const w = ctx.items.get(`${t.id}-why`);
        return h("tr", {}, h("th", { scope: "row" }, t.prompt), h("td", {}, r ? (r.ok ? "Correct" : "Needed the model") : "Not recorded"), h("td", {}, String(r?.tries ?? 0)), h("td", {}, String(r?.hints ?? 0)), h("td", {}, w ? (w.ok ? "Evidence correct" : "Needed the model") : "None"));
      });
      root.append(
        h(
          "section",
          { class: "st-cb-step st-cb-done", "aria-label": "Finished" },
          h("h3", { tabindex: "-1", id: "st-cb-done-h" }, "You finished this activity"),
          h("p", {}, ctx.mode === "student" ? "Your work is saved on this device only. Nothing was sent anywhere." : "Preview mode: nothing was recorded."),
          h("div", { class: "st-cb-scroll" }, h("table", { class: "st-cb-table" }, h("caption", {}, "How each task went"), h("thead", {}, h("tr", {}, ["Task", "Result", "Tries", "Hints", "Evidence step"].map((x) => h("th", { scope: "col" }, x)))), h("tbody", {}, rows))),
          h("p", { class: "st-cb-quiet-text" }, `Your reflection: ${S.reflection}`),
        ),
      );
      root.querySelector("#st-cb-done-h")?.focus();
    }

    await render(false);
    ctx.destroy = () => {
      onTier();
      cleanup();
    };
  },
};
