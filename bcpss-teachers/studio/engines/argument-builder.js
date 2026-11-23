// Argument Builder engine. Schema: engines/argument-builder.schema.md
// Question and sources -> claim -> evidence -> reasoning -> counterclaim (tiers that need it) -> assemble and revise -> finish.
// The learner reasons from sources; code checks the claim, the cards and the shape of the reasoning. Untimed.
import { h } from "../core/dom.js";
import { loadCss } from "./engine-core.js";
import { btn, focusHeading, loadVisuals, stepList } from "./e4-kit.js";
import { claimOf, counterMode, evaluateChecks, labelsFor } from "./argument/argument-logic.js";
import { validateArgument } from "./argument/argument-validate.js";
import { claimStep, evidenceStep, sourcesStep } from "./argument/argument-steps.js";
import {
  assembleStep,
  counterStep,
  outputStep,
  reasoningStep,
} from "./argument/argument-steps2.js";

export const STEPS = ["sources", "claim", "evidence", "reasoning", "counter", "assemble", "output"];
const VIEWS = {
  sources: sourcesStep,
  claim: claimStep,
  evidence: evidenceStep,
  reasoning: reasoningStep,
  counter: counterStep,
  assemble: assembleStep,
  output: outputStep,
};

/** Which step may open. Gates mirror the schema: nothing opens before the step before it passed. */
export function allowedStep(want, st, mode) {
  const order = STEPS.filter((s) => s !== "counter" || mode !== "none");
  const reachedAssemble =
    !!st.reasoningDone &&
    !!st.evidenceDone &&
    (mode === "none" || !!st.counterOk || (mode === "optional" && !!st.counterSkipped));
  const open = {
    sources: true,
    claim: true,
    evidence: !!st.claimDone,
    reasoning: !!st.claimDone && !!st.evidenceDone,
    counter: !!st.claimDone && !!st.evidenceDone && !!st.reasoningDone,
    assemble: reachedAssemble,
    output: reachedAssemble,
  };
  let i = order.indexOf(want);
  if (i < 0) i = want === "counter" ? order.indexOf("assemble") : 0;
  while (i > 0 && !open[order[i]]) i -= 1;
  return order[i];
}

async function mount(ctx) {
  loadCss("engines-base.css");
  loadCss("engines3-common.css");
  loadCss("e4-common.css");
  loadCss("argument-builder.css");
  await loadVisuals();
  const a = ctx.activity;
  const problems = validateArgument(a);
  if (problems.length) {
    console.error("argument-builder: invalid activity", problems);
    ctx.root.replaceChildren(
      h(
        "p",
        { class: "st-arg-msg", role: "alert" },
        "This activity could not be opened because its data is incomplete. Tell your teacher.",
      ),
    );
    return;
  }
  const L = labelsFor(a);
  const saved = ctx.resume()?.state || {};
  const st = {
    step: "sources",
    claimId: null,
    claimDone: false,
    evidenceIds: [],
    evidenceDone: false,
    reasoning: {},
    reasoningOk: {},
    reasoningDone: false,
    counter: { acknowledge: "", rebut: "" },
    counterOk: false,
    counterSkipped: false,
    selfChecks: {},
    draft: 1,
    view: "labeled",
    ...saved,
  };
  const loops = {};
  const savedLoops = saved.loops || {};
  let current = null;

  const env = {
    ctx,
    activity: a,
    st,
    aid: ctx.aid,
    claim: () => claimOf(a, st.claimId),
    supportEl: () => ctx.supportPanel({ id: "arg-support", supports: a.supports }).el,
    loopFor(id, item) {
      if (!loops[id]) {
        loops[id] = ctx.loop(
          {
            id,
            hints: item.hints || [],
            model: item.model || "",
            misconceptions: item.misconceptions || [],
          },
          { maxTries: 3 },
        );
        if (savedLoops[id]) Object.assign(loops[id].state, savedLoops[id]);
      }
      return loops[id];
    },
    settle: (id) => loops[id] && ctx.settle(loops[id]),
    settleRevision(res) {
      const rows = res || evaluateChecks(a, st, ctx.tier);
      const unmet = rows.filter((r) => !r.met);
      ctx.items.set("revision", {
        id: "revision",
        tries: st.draft,
        hints: 0,
        ok: !unmet.some((r) => r.required && !r.challenge),
        tags: unmet.map((r) => `unmet-${r.id}`),
      });
    },
    save() {
      ctx.save({
        ...st,
        loops: Object.fromEntries(Object.entries(loops).map(([k, v]) => [k, { ...v.state }])),
      });
    },
    resetFrom(from) {
      if (from !== "claim") return;
      Object.assign(st, {
        evidenceIds: [],
        evidenceDone: false,
        reasoning: {},
        reasoningOk: {},
        reasoningDone: false,
        counter: { acknowledge: "", rebut: "" },
        counterOk: false,
        counterSkipped: false,
        selfChecks: {},
        draft: 1,
      });
      for (const k of ["evidence", "reasoning", "counter", "revision"])
        (ctx.items.delete(k), delete loops[k], delete savedLoops[k]);
    },
    go,
    finish(text) {
      env.settleRevision();
      ctx.finish(text);
      const done = h(
        "section",
        { class: "st-arg-card", "aria-label": "Saved" },
        h("h2", { class: "st-arg-h", "data-focus": "" }, "Saved"),
        h(
          "p",
          {},
          "Your results are saved on this device without your name. Your argument is saved here too. You can close this page.",
        ),
        h(
          "div",
          { class: "st-arg-actions" },
          btn("Print my argument", "", () => window.print()),
        ),
      );
      view({ el: done, focus: () => focusHeading(done) }, "Saved.");
    },
  };

  const root = h("div", { class: "st-arg", "data-mode": ctx.mode });
  const main = h("div", { class: "st-arg-main" });
  const stepHost = h("div");
  root.append(h("h1", {}, a.title), stepHost, main);
  ctx.root.replaceChildren(root);
  let steps;

  function drawSteps(active) {
    const mode = counterMode(a, ctx.tier);
    const ids = STEPS.filter((s) => s !== "counter" || mode !== "none");
    const labels = {
      sources: "Sources",
      claim: L.claim,
      evidence: L.evidence,
      reasoning: L.reasoning,
      counter: L.counter,
      assemble: "Assemble and revise",
      output: "Finish",
    };
    steps = stepList(
      ids.map((s) => labels[s]),
      "Argument steps",
    );
    stepHost.replaceChildren(steps.el);
    steps.set(ids.indexOf(active));
  }

  function view(v, text) {
    current?.cleanup?.();
    current = v;
    main.replaceChildren(v.el);
    if (text) ctx.announce(text);
    v.focus?.();
  }

  function go(step, { quiet = false } = {}) {
    const mode = counterMode(a, ctx.tier);
    const to = allowedStep(step, st, mode);
    st.step = to;
    drawSteps(to);
    view(
      VIEWS[to](env),
      quiet
        ? null
        : `${to === "output" ? "Finish" : to === "assemble" ? "Assemble and revise" : L[to] || "Sources"}.`,
    );
    env.save();
  }

  ctx.onTier(() => go(st.step, { quiet: true }));
  go(saved.step || "sources");
}

export default { id: "argument-builder", mount };
