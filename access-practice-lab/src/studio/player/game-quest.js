// Challenge Quest: a path of missions. Finishing a mission moves the traveler on; every third mission is a
// camp with a recap; a missed mission can be tried again at the end. Hints stay available, nothing runs out.

import { renderBlocks } from "./blocks.js";
import { buildSteps } from "./flow.js";
import { icon } from "./icons.js";
import { mountQuestion } from "./question.js";
import { h, plainText } from "./util.js";

const CAMP_EVERY = 3;

export function mountQuest(area, ctx, { onFinish }) {
  const steps = buildSteps(ctx.activity).filter((s) => s.question);
  if (!steps.length) {
    onFinish();
    return {};
  }
  const st = (ctx.state.game.quest ||= { at: 0, camp: -1 });
  const first = steps.findIndex((s) => !ctx.session.isDone(s.question));
  st.at = first < 0 ? steps.length : first;
  const good = (rec) => rec.final === "correct" || rec.final === "review";
  const missed = () =>
    steps.map((_, i) => i).filter((i) => ctx.session.isDone(steps[i].question) && !good(ctx.session.get(steps[i].question)));
  const path = h("ol", { class: "sp-path", "aria-label": ctx.t("questMap") });
  const stageEl = h("div", { class: "sp-mission" });
  area.replaceChildren(path, stageEl);

  const stateOf = (i) => {
    if (missed().includes(i)) return "retry";
    if (i < st.at || (i === st.at && st.camp === i)) return "done";
    return i === st.at ? "here" : "ahead";
  };
  const wordFor = { done: "questDone", here: "questHere", ahead: "questAhead", retry: "questRetry" };

  function paintPath() {
    path.replaceChildren();
    steps.forEach((_, i) => {
      const state = stateOf(i);
      const camp = (i + 1) % CAMP_EVERY === 0 || i === steps.length - 1;
      const node = h(
        "li",
        { class: `sp-node is-${state}${camp ? " is-camp" : ""}`, "aria-current": state === "here" ? "step" : null },
        h("span", { class: "sp-node-dot", "aria-hidden": "true" }, state === "done" ? icon("check", 18) : camp ? icon("flag", 18) : String(i + 1)),
        h("span", { class: "sp-node-word" }, ctx.t("missionN", { n: i + 1 }), h("span", { class: "sp-sr" }, ", "), h("small", null, ctx.t(wordFor[state]))),
      );
      if (state === "here") node.prepend(h("span", { class: "sp-hero", "aria-hidden": "true" }, icon("home", 16)));
      path.append(node);
    });
  }

  function mission(i, { retrying = false } = {}) {
    paintPath();
    const step = steps[i];
    stageEl.replaceChildren();
    if (step.content.length) stageEl.append(h("div", { class: "sp-content" }, renderBlocks(step.content, ctx)));
    const q = mountQuestion(stageEl, step.question, ctx, {
      index: i,
      total: steps.length,
      last: i === steps.length - 1 && !retrying,
      onNext: () => (retrying ? end() : advance(i)),
    });
    q.focus();
  }

  function advance(i) {
    if (i === steps.length - 1) return end();
    const camp = (i + 1) % CAMP_EVERY === 0;
    st.at = i + 1;
    if (camp) return campScreen(i);
    mission(st.at);
  }

  function campScreen(i) {
    st.camp = i;
    paintPath();
    const recap = steps.slice(Math.max(0, i - CAMP_EVERY + 1), i + 1).filter((s) => s.question.explanation);
    const next = h("button", { type: "button", class: "sp-btn sp-btn-primary" }, ctx.msg("keepGoing"), icon("arrow", 18));
    next.addEventListener("click", () => {
      st.camp = -1;
      mission(st.at);
    });
    const title = h("h2", { class: "sp-camp-title", tabindex: "-1" }, icon("flag", 22), ctx.t("campTitle"));
    stageEl.replaceChildren(
      h(
        "section",
        { class: "sp-camp" },
        title,
        h("p", null, ctx.t("campBody")),
        recap.length ? h("ul", { class: "sp-recap" }, ...recap.map((s) => h("li", null, plainText(s.question.explanation)))) : null,
        next,
      ),
    );
    ctx.focus(title);
  }

  function end() {
    st.at = steps.length;
    paintPath();
    const redo = missed();
    const done = h("button", { type: "button", class: "sp-btn sp-btn-primary" }, ctx.msg("finish"));
    done.addEventListener("click", onFinish);
    const title = h("h2", { class: "sp-camp-title", tabindex: "-1" }, icon("star", 22), ctx.t("questComplete"));
    const section = h("section", { class: "sp-camp" }, title, h("p", null, ctx.t(redo.length ? "questRetryBody" : "questWinBody")));
    if (redo.length) {
      const list = h("ul", { class: "sp-retry" });
      for (const i of redo) {
        const b = h("button", { type: "button", class: "sp-btn sp-btn-quiet" }, icon("undo", 16), ctx.t("retryMission", { n: i + 1 }));
        b.addEventListener("click", () => mission(i, { retrying: true }));
        list.append(h("li", null, b));
      }
      section.append(list);
    }
    section.append(done);
    stageEl.replaceChildren(section);
    ctx.focus(title);
  }

  if (st.at >= steps.length) end();
  else mission(st.at);
  return {
    goto(id) {
      const i = steps.findIndex((s) => s.question.id === id || s.content.some((b) => b.id === id));
      if (i < 0) return false;
      st.at = i;
      mission(i);
      return true;
    },
  };
}
