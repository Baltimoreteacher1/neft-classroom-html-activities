// Conversation Studio engine. Schema: engines/conversation-studio.schema.md
// Purpose -> Moves -> Order -> Rehearse -> Check yourself -> Reflect, plus a projector pair view and a printable
// feedback sheet. Untimed. Recording is optional, local, and deleted on request or on leaving.
import { h } from "../core/dom.js";
import { loadCss } from "./engine-core.js";
import { focusHeading, loadVisuals, stepList, visualEl } from "./e4-kit.js";
import { btn } from "./e4-kit.js";
import { validateConversationActivity } from "./conversation-parts/validate.js";
import { orderStep, movesStep, purposeStep } from "./conversation-parts/conv-plan.js";
import { checkStep, reflectStep, rehearseStep } from "./conversation-parts/conv-talk.js";
import { pairView, sheetView } from "./conversation-parts/conv-pair.js";

export const STEPS = ["purpose", "moves", "order", "rehearse", "check", "reflect"];
const STEP_LABEL = ["Purpose", "Moves", "Order", "Rehearse", "Check yourself", "Reflect"];
const VIEWS = {
  purpose: purposeStep,
  moves: movesStep,
  order: orderStep,
  rehearse: rehearseStep,
  check: checkStep,
  reflect: reflectStep,
};

/** Which step may open given what the learner has finished. Prevents a resumed or scripted jump past a gate. */
export function allowedStep(want, st) {
  if (want === "purpose" || !st.purposeId) return "purpose";
  if (want === "moves") return "moves";
  if (!st.movesDone) return "moves";
  if (want === "order") return "order";
  if (!st.orderDone) return "order";
  return STEPS.includes(want) ? want : "purpose";
}

async function mount(ctx) {
  loadCss("engines-base.css");
  loadCss("e4-common.css");
  loadCss("conversation-studio.css");
  await loadVisuals();
  const activity = ctx.activity;
  const problems = await validateConversationActivity(activity);
  if (problems.length) {
    console.error("conversation-studio: invalid activity", problems);
    ctx.root.replaceChildren(
      h(
        "p",
        { class: "st-cv-msg", role: "alert" },
        "This activity could not be opened because its data is incomplete. Tell your teacher.",
      ),
    );
    return;
  }
  const saved = ctx.resume()?.state || {};
  const st = {
    step: "purpose",
    purposeId: null,
    picked: [],
    movesDone: false,
    order: null,
    orderDone: false,
    picks: {},
    marks: {},
    reflection: "",
    ...saved,
  };
  const loops = {};
  const savedLoops = saved.loops || {};
  const moveMap = new Map(activity.moves.map((m) => [m.id, m]));
  let current = null;
  let sideReturn = null;
  let finished = false;

  const env = {
    ctx,
    activity,
    st,
    aid: ctx.aid,
    roles: activity.roles,
    moveById: (id) => moveMap.get(id),
    purpose: () => activity.purposes.find((p) => p.id === st.purposeId),
    purposeOrFirst: () =>
      activity.purposes.find((p) => p.id === st.purposeId) || activity.purposes[0],
    visual: (spec) => (spec ? visualEl(spec) : null),
    loopFor(id, item) {
      if (!loops[id]) {
        loops[id] = ctx.loop(
          { id, hints: item.hints || [], model: item.model || "", misconceptions: [] },
          { maxTries: 3 },
        );
        if (savedLoops[id]) Object.assign(loops[id].state, savedLoops[id]);
      }
      return loops[id];
    },
    settle: (id) => loops[id] && ctx.settle(loops[id]),
    save() {
      ctx.save({
        ...st,
        loops: Object.fromEntries(Object.entries(loops).map(([k, v]) => [k, { ...v.state }])),
      });
    },
    resetFrom(from) {
      if (from === "purpose") {
        Object.assign(st, {
          picked: [],
          movesDone: false,
          order: null,
          orderDone: false,
          picks: {},
        });
        for (const k of Object.keys(loops))
          if (k !== "purpose") (ctx.items.delete(k), delete loops[k]);
        for (const k of Object.keys(savedLoops)) if (k !== "purpose") delete savedLoops[k];
      }
    },
    go,
    finish(text) {
      if (!finished) ctx.finish(text);
      finished = true;
      showSaved();
    },
  };
  function showSaved() {
    {
      const done = h(
        "section",
        { class: "st-cv-step", "aria-label": "Saved" },
        h("h2", { class: "st-cv-h", "data-focus": "" }, "Saved"),
        h(
          "p",
          {},
          "Your results are saved on this device without your name. You can close this page, or print the feedback sheet for your partner.",
        ),
        h(
          "div",
          { class: "st-e4-actions" },
          btn("Open the feedback sheet", "primary", () => sheet(true)),
        ),
      );
      view({ el: done, focus: () => focusHeading(done) }, "Saved.");
    }
  }

  const root = h("div", { class: "st-stage st-cv", "data-mode": ctx.mode });
  const steps = stepList(STEP_LABEL, "Conversation steps");
  const tools = h("div", { class: "st-cv-tools" });
  const main = h("div", { class: "st-cv-main" });
  const head = h("header", { class: "st-cv-head" }, h("h1", {}, activity.title), steps.el, tools);
  root.append(head, main);
  ctx.root.replaceChildren(root);

  function paintTools() {
    tools.replaceChildren(
      btn("Partner view", "", () => pair(true), {
        title: "Large cards for two partners at a screen",
      }),
      btn("Feedback sheet", "", () => sheet(false), {
        title: "Printable rubric and success criteria",
      }),
    );
  }

  function view(v, announceText) {
    current?.cleanup?.();
    current = v;
    main.replaceChildren(v.el);
    if (announceText) ctx.announce(announceText);
    v.focus?.();
  }

  function go(step, { quiet = false } = {}) {
    const to = allowedStep(step, st);
    st.step = to;
    steps.set(STEPS.indexOf(to));
    const v = VIEWS[to](env);
    view(
      v,
      quiet
        ? null
        : `Step ${STEPS.indexOf(to) + 1} of ${STEPS.length}: ${STEP_LABEL[STEPS.indexOf(to)]}.`,
    );
    env.save();
  }
  function back() {
    if (finished) return showSaved();
    go(sideReturn || st.step);
  }
  function pair(close) {
    sideReturn = st.step;
    const v = pairView(env, { onClose: close ? back : null });
    view(v, "Partner view.");
  }
  function sheet() {
    sideReturn = st.step === "reflect" || !STEPS.includes(st.step) ? "reflect" : st.step;
    const v = sheetView(env, { onClose: back });
    view(v, "Feedback sheet.");
  }

  ctx.onTier(() => {
    if (
      current?.el?.classList?.contains("st-cv-pair") ||
      current?.el?.classList?.contains("st-cv-sheet")
    )
      return;
    go(st.step, { quiet: true });
  });

  paintTools();
  const params = new URLSearchParams(`${location.search}&${location.hash.replace(/^#/, "")}`);
  if (ctx.mode === "projector" && params.get("view") === "pair") {
    steps.set(0);
    pair(false);
  } else go(saved.step || "purpose", { quiet: true });
}

export default { id: "conversation-studio", mount };
