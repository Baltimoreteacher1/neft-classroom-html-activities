// conversation-studio steps 4-6: rehearse a partner talk, check yourself against the success criteria, reflect.
import { h } from "../../core/dom.js";
import { reflectionBlock } from "../engine-core.js";
import { btn, choiceGroup } from "../e4-kit.js";
import { moveSupportItem, speechOpts, turnHints } from "./conv-logic.js";
import { recorderWidget } from "./recorder.js";

const heading = (text) => h("h2", { class: "st-cv-h", "data-focus": "" }, text);
const FIT_LABEL = { strong: "Strong response", partial: "Partly there", off: "Not the move yet" };

/** Step 4. Partner turns are heard; learner turns are chosen, optionally recorded, and explained by a note. */
export function rehearseStep(env) {
  const { ctx, st } = env;
  const purpose = env.purpose();
  const turns = purpose.rehearsal.turns;
  const learnerIdx = turns.map((t, i) => (t.speaker === "you" ? i : -1)).filter((i) => i >= 0);
  st.picks = st.picks || {};
  const doneTurn = (t) => !!st.picks[t.id]?.done;
  const currentIndex = () => learnerIdx.find((i) => !doneTurn(turns[i])) ?? -1;
  const widgets = [];
  const head = heading("Rehearse the talk");
  const list = h("ol", { class: "st-cv-turns" });
  const after = h("div", { class: "st-e4-actions", hidden: true });

  function partnerCard(t) {
    return h(
      "li",
      { class: "st-cv-turn", "data-who": "partner" },
      h("h3", {}, "Your partner says"),
      h("p", { class: "st-cv-say" }, t.say),
      h(
        "div",
        { class: "st-e4-actions" },
        btn("Listen", "st-btn-quiet", () => ctx.speak(t.say, speechOpts(ctx.activity, t)), {
          "aria-label": "Listen to your partner",
        }),
      ),
    );
  }

  function learnerCard(t, active) {
    const move = env.moveById(t.moveId);
    const saved = st.picks[t.id] || { tries: 0 };
    const loop = env.loopFor(`turn-${t.id}`, { hints: turnHints(move), model: "" });
    const fb = ctx.feedback();
    const panel = ctx.supportPanel(moveSupportItem(move));
    const group = choiceGroup({
      legend: t.prompt,
      options: t.options.map((o) => o.text),
      onChange: () => (use.disabled = false),
    });
    const use = btn("Use this response", "primary", onUse);
    use.disabled = true;
    const hintBtn = btn("Hint", "", () => {
      const text = loop.nextHint();
      if (text) {
        fb.show("hint", text);
        ctx.announce(text);
      }
      env.settle(`turn-${t.id}`);
      env.save();
    });
    const example = btn(
      "Hear an example",
      "st-btn-quiet",
      () => {
        loop.state.hints += 1;
        ctx.speak(move.example, speechOpts(ctx.activity, move));
        env.settle(`turn-${t.id}`);
        env.save();
      },
      { "aria-label": `Hear an example of ${move.label}` },
    );
    const cont = btn("Continue", "primary", () => finishTurn(t, true));
    const skip = btn("Move on without a strong response", "st-btn-quiet", () =>
      finishTurn(t, false),
    );
    cont.hidden = skip.hidden = true;
    const rec = recorderWidget({ announce: ctx.announce });
    widgets.push(rec);

    function lockIf() {
      if (st.picks[t.id]?.done) {
        group.lock(true);
        use.hidden = hintBtn.hidden = example.hidden = true;
        cont.hidden = skip.hidden = true;
      }
    }
    function onUse() {
      const i = group.value();
      if (i == null) return;
      const o = t.options[i];
      const strong = o.fit === "strong";
      const r = loop.submit({ ok: strong, pick: o.id, tag: `fit-${o.fit}` });
      st.picks[t.id] = { ...(st.picks[t.id] || {}), last: o.id, tries: loop.state.tries };
      env.settle(`turn-${t.id}`);
      group.mark(i, FIT_LABEL[o.fit]);
      const model =
        !strong && r.kind === "model"
          ? ` A response that fits: ${t.options.find((x) => x.fit === "strong").text}`
          : "";
      fb.show(
        strong ? "right" : o.fit === "partial" ? "retry" : "retry",
        `${FIT_LABEL[o.fit]}. ${o.note}${model}`,
      );
      ctx.announce(`${FIT_LABEL[o.fit]}. ${o.note}`);
      if (strong) {
        st.picks[t.id].strong = true;
        use.hidden = true;
        cont.hidden = false;
        cont.focus();
      } else {
        group.reset();
        use.disabled = true;
        if (loop.state.tries >= 2) skip.hidden = false;
      }
      env.save();
    }
    function finishTurn(turn, ok) {
      st.picks[turn.id] = { ...(st.picks[turn.id] || {}), done: true, strong: ok };
      env.settle(`turn-${turn.id}`);
      env.save();
      draw(true);
    }
    const card = h(
      "li",
      { class: "st-cv-turn", "data-who": "you", "data-active": String(active) },
      h("h3", {}, `${env.roles[0].label} (you)`),
      h("p", { class: "st-prompt" }, t.prompt),
      panel.el,
      group.el,
      fb.el,
      h("div", { class: "st-e4-actions" }, use, hintBtn, example, cont, skip),
      active ? rec.el : null,
    );
    if (saved.done) {
      group.set(t.options.findIndex((o) => o.id === saved.last));
      const o = t.options.find((x) => x.id === saved.last);
      if (o) fb.show(o.fit === "strong" ? "right" : "retry", `${FIT_LABEL[o.fit]}. ${o.note}`);
      lockIf();
    }
    return card;
  }

  function draw(focusNew) {
    widgets.splice(0).forEach((w) => w.destroy());
    const cur = currentIndex();
    const last = cur < 0 ? turns.length - 1 : cur;
    const shown = turns.slice(0, last + 1);
    list.replaceChildren(
      ...shown.map((t, i) =>
        t.speaker === "partner" ? partnerCard(t) : learnerCard(t, i === cur),
      ),
    );
    after.hidden = cur >= 0;
    if (cur < 0 && !after.children.length)
      after.append(btn("Go to Check yourself", "primary", () => env.go("check")));
    if (cur < 0) ctx.announce("Rehearsal finished.");
    if (focusNew) {
      const target = list.querySelector('[data-active="true"] h3') || after.querySelector("button");
      target?.setAttribute("tabindex", "-1");
      target?.focus();
    }
  }
  draw(false);
  const el = h(
    "section",
    { class: "st-cv-step", "aria-label": "Rehearse" },
    head,
    h("p", { class: "st-intro" }, purpose.rehearsal.intro || ""),
    list,
    after,
    h(
      "div",
      { class: "st-e4-actions" },
      btn("Back", "st-btn-quiet", () => env.go("order")),
    ),
  );
  return {
    el,
    focus: () => head.focus(),
    cleanup: () => widgets.splice(0).forEach((w) => w.destroy()),
  };
}

/** Step 5. Self-check against the success criteria. */
export function checkStep(env) {
  const { activity, st } = env;
  st.marks = st.marks || {};
  const head = heading("Check yourself");
  const sum = h("p", { class: "st-cv-count", role: "status", "aria-live": "polite" });
  const paint = () => {
    const yes = Object.values(st.marks).filter((v) => v === "yes").length;
    const answered = Object.keys(st.marks).length;
    sum.textContent = `You marked ${yes} of ${activity.successCriteria.length} as "I did this". ${activity.successCriteria.length - answered} not answered yet.`;
  };
  const groups = activity.successCriteria.map((c) => {
    const g = choiceGroup({
      legend: c.label,
      options: ["I did this", "Not yet"],
      onChange: (i) => {
        st.marks[c.id] = i === 0 ? "yes" : "no";
        paint();
        env.save();
      },
    });
    if (st.marks[c.id]) g.set(st.marks[c.id] === "yes" ? 0 : 1);
    return g;
  });
  paint();
  const el = h(
    "section",
    { class: "st-cv-step", "aria-label": "Check yourself" },
    head,
    h(
      "p",
      { class: "st-intro" },
      "Be honest. This is only for you and your partner. Choose one answer for each statement.",
    ),
    groups.map((g) => g.el),
    sum,
    h(
      "div",
      { class: "st-e4-actions" },
      btn("Go to Reflect", "primary", () => env.go("reflect")),
      btn("Back", "st-btn-quiet", () => env.go("rehearse")),
    ),
  );
  return { el, focus: () => head.focus() };
}

/** Step 6. Reflection; finishing records the evidence. */
export function reflectStep(env) {
  const { ctx, st } = env;
  const head = heading("Reflect");
  const block = reflectionBlock(ctx, env.activity.reflection);
  const ta = block.el.querySelector("textarea");
  ta.value = st.reflection || "";
  ta.addEventListener("input", () => {
    st.reflection = ta.value;
    env.save();
  });
  block.el.querySelector("h3")?.remove();
  const el = h(
    "section",
    { class: "st-cv-step", "aria-label": "Reflect" },
    head,
    block.el,
    h(
      "div",
      { class: "st-e4-actions" },
      btn("Save and finish", "primary", () => env.finish(block.value())),
      btn("Open the feedback sheet", "", () => env.go("sheet")),
      btn("Back", "st-btn-quiet", () => env.go("check")),
    ),
  );
  return { el, focus: () => head.focus() };
}
