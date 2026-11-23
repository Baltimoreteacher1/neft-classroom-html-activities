// WIDA Practice Studio engine: original multimodal Listening, Speaking, Reading and Writing practice.
// Two modes, kept visibly apart: instructional (supports on, hints, retries) and simulated independent practice
// (supports hidden until asked, answers checked once on submit). Untimed. Objective items are reported only as
// instructional indicators; nothing here is a WIDA or ACCESS score or prediction.
import { announce, h } from "../core/dom.js";
import { GRADE_LABEL } from "../data/taxonomy.js";
import { loadCss } from "./engine-core.js";
import { OBJECTIVE_TYPES, answerText, indicatorLine, isAnswered, isScored, scoreTask } from "./wida/check.js";
import { renderResults, renderReview } from "./wida/results.js";
import { createSession } from "./wida/session.js";
import { disclaimer, taskHead } from "./wida/ui.js";

const MODULES = {
  Listening: () => import("./wida/listening.js"),
  Speaking: () => import("./wida/speaking.js"),
  Reading: () => import("./wida/reading.js"),
  Writing: () => import("./wida/writing.js"),
};
const DEFAULT_RETRY = "Look again at the model, then try once more.";
const RETRY = {
  Listening: "Play the audio again, or read the captions, and check the parts marked Not yet.",
  Reading: "Go back to the text and find the words that decide the answer.",
};
const HINT = {
  Listening: "Play the audio again. Listen for the words that answer the question.",
  Reading: "Go back to the text. Find the sentence that answers the question.",
};
const MODES = [
  ["instructional", "Practice with supports"],
  ["independent", "Independent practice"],
];

export default {
  id: "wida-studio",
  async mount(ctx) {
    const c = ctx.activity;
    loadCss("engines-base.css");
    loadCss("wida-studio.css");
    const mod = await MODULES[c.domain]();
    const hashParams = new URLSearchParams((location.hash || "").replace(/^#/, ""));
    const S = createSession(ctx, c, { independent: hashParams.get("p") === "independent" });
    const loops = new Map();
    const n = c.tasks.length;
    let current = null;
    let attempt = null;
    let submitted = false;

    const stage = h("div", { class: "st-wida-stage", id: "st-wida-stage" });
    const bar = h("div", { class: "st-wida-modebar" });
    const banner = h("p", { class: "st-wida-banner", "data-mode": S.st.mode });
    const tierSlot = h("div", { class: "st-wida-tierslot" });
    const head = h(
      "header",
      { class: "st-head st-wida-head" },
      h("h2", {}, c.title),
      h("p", { class: "st-meta" }, h("span", { class: "st-chip" }, c.domain), h("span", { class: "st-chip" }, c.grade === "K" ? GRADE_LABEL.K : GRADE_LABEL[c.grade] || `Grade ${c.grade}`), c.klus.map((k) => h("span", { class: "st-chip" }, k))),
      ctx.mode === "preview" ? h("p", { class: "st-wida-previewnote" }, "Teacher preview. Transcripts and answers appear in the teacher boxes. Nothing is recorded.") : null,
    );

    const drawTier = () => {
      const picker = ctx.tierPicker("Language support");
      tierSlot.replaceChildren(h("span", { class: "st-wida-barlabel", id: "st-wida-tier-l" }, "Language support"), picker);
    };
    ctx.onTier(() => {
      drawTier();
      current?.env.runRefresh();
      tierSlot.querySelector('[aria-pressed="true"]')?.focus();
    });
    drawTier();

    const drawMode = () => {
      bar.replaceChildren(
        h("div", { class: "st-wida-modegroup", role: "group", "aria-label": "Practice mode" }, MODES.map(([id, label]) => h("button", { type: "button", class: "st-pill", "aria-pressed": String(S.st.mode === id), onclick: () => setMode(id) }, label))),
        tierSlot,
      );
      banner.dataset.mode = S.st.mode;
      banner.textContent =
        S.st.mode === "independent"
          ? "Independent practice (simulated). Supports stay hidden until you ask for them, and answers are checked when you submit. This is practice, not a test. There is no timer."
          : "Practice with supports. Supports are on, hints are available and you can try again. There is no timer.";
    };
    const setMode = (m) => {
      if (m === S.st.mode) return;
      S.st.mode = m;
      S.saveSoon();
      drawMode();
      announce(m === "independent" ? "Independent practice. Supports are hidden until you ask." : "Practice with supports. Supports are on.");
      if (!submitted && current) showTask(S.st.index, { focus: false });
      bar.querySelector('[aria-pressed="true"]')?.focus();
    };

    const focusHeading = (id) => document.getElementById(id)?.focus({ preventScroll: false });
    const stopCurrent = () => {
      current?.tv.destroy?.();
      current = null;
    };

    function audioFor(t) {
      let a = t.audio;
      const seen = new Set();
      while (a?.ref && !seen.has(a.ref)) {
        seen.add(a.ref);
        a = S.taskById(a.ref)?.audio;
      }
      return a;
    }
    const textFor = (id) => c.texts.find((x) => x.id === id);

    function makeEnv(task) {
      const refreshers = [];
      const env = {
        collection: c,
        ctx,
        preview: ctx.mode === "preview",
        mode: () => S.st.mode,
        tier: () => ctx.tier,
        response: S.answer(task.id),
        set(r) {
          S.setAnswer(task.id, r);
          current?.tv.mark?.(null);
          current?.fb?.hide();
        },
        addRefresh: (fn) => refreshers.push(fn),
        runRefresh: () => refreshers.forEach((fn) => fn()),
        requestSupports() {
          S.requestSupports(task.id);
          env.runRefresh();
        },
        supportsRequested: () => S.supportsRequested(task.id),
        supportsOpen: () => S.st.mode !== "independent" || S.supportsRequested(task.id),
        captionsOn: () => S.st.captions,
        setCaptions(on) {
          S.st.captions = on;
          S.saveSoon();
        },
        notePlay() {
          S.st.plays[task.id] = (S.st.plays[task.id] || 0) + 1;
          S.saveSoon();
        },
        audioFor,
        textFor,
        textOf: (id) => S.answer(id).rev?.draft2 || S.answer(id).text || "",
      };
      return env;
    }

    const loopFor = (task) => {
      if (!loops.has(task.id)) loops.set(task.id, ctx.loop({ id: task.id, hints: task.hints, misconceptions: task.misconceptions, explain: task.explain }));
      return loops.get(task.id);
    };

    function controls(task, env, tv) {
      if (!OBJECTIVE_TYPES.has(task.type) || !isScored(task)) {
        const msg = OBJECTIVE_TYPES.has(task.type) ? "These notes are for you. There is nothing to check automatically." : task.type.startsWith("speak") ? "There is no right or wrong answer here, and nothing is scored. Your teacher can use the feedback sheet at the end." : "There is no right or wrong answer here, and nothing is scored. Your writing is saved on this device.";
        return h("p", { class: "st-wida-quiet" }, msg);
      }
      if (S.st.mode === "independent") return h("p", { class: "st-wida-quiet" }, "Your answer is saved. You will see how it matches after you submit.");
      const fb = ctx.feedback();
      current.fb = fb;
      const checkBtn = h("button", { type: "button", class: "st-btn st-primary" }, "Check my answer");
      const hintBtn = h("button", { type: "button", class: "st-btn" }, "Give me a hint");
      checkBtn.addEventListener("click", () => {
        const r = S.answer(task.id);
        if (!isAnswered(task, r)) return fb.show("hint", "Choose or write an answer first, then press Check.");
        const sc = scoreTask(task, r);
        S.addTry(task.id);
        const res = loopFor(task).submit({ ok: sc.ok, pick: r.pick || r.picks?.[0], tag: `${task.type}-miss` });
        tv.mark?.(sc.detail);
        const line = indicatorLine(sc);
        if (res.ok) fb.show("right", `${line}. ${task.explain}`);
        else if (res.kind === "model") fb.show("model", `${line}. The answer is: ${answerText(task)} ${task.explain}`);
        else fb.show("retry", `${line}. ${res.text === DEFAULT_RETRY ? RETRY[c.domain] || res.text : res.text}`);
        announce(line);
      });
      hintBtn.addEventListener("click", () => {
        S.addHint(task.id);
        fb.show("hint", loopFor(task).nextHint() || HINT[c.domain]);
      });
      return h("div", { class: "st-wida-checkrow" }, h("div", { class: "st-row" }, checkBtn, hintBtn), fb.el);
    }

    function nav(i) {
      const flag = h("button", { type: "button", class: "st-btn", "aria-pressed": String(!!S.st.flags[c.tasks[i].id]) }, "Flag for later");
      flag.addEventListener("click", () => {
        const id = c.tasks[i].id;
        S.st.flags[id] = !S.st.flags[id];
        flag.setAttribute("aria-pressed", String(!!S.st.flags[id]));
        S.saveSoon();
        announce(S.st.flags[id] ? "Flagged for later." : "Flag removed.");
      });
      return h(
        "nav",
        { class: "st-wida-nav", "aria-label": "Task navigation" },
        h("button", { type: "button", class: "st-btn", disabled: i === 0, onclick: () => showTask(i - 1) }, "Back"),
        flag,
        h("button", { type: "button", class: "st-btn", onclick: () => goReview() }, "Review all tasks"),
        i === n - 1 ? h("button", { type: "button", class: "st-btn st-primary", onclick: () => goReview() }, "Review and submit") : h("button", { type: "button", class: "st-btn st-primary", onclick: () => showTask(i + 1) }, "Next"),
      );
    }

    function showTask(i, { focus = true } = {}) {
      stopCurrent();
      S.st.index = i;
      S.saveSoon();
      const task = c.tasks[i];
      const env = makeEnv(task);
      const tv = mod.build(task, env);
      current = { task, tv, env, fb: null };
      const ctl = controls(task, env, tv);
      stage.replaceChildren(taskHead(task, i, n), tv.el, ctl, nav(i));
      if (focus) focusHeading("st-wida-task-heading");
    }

    const app = {
      collection: c,
      S,
      ctx,
      stage,
      focusHeading,
      goTask: (i) => showTask(i),
      goReview,
      firstUnanswered: () => {
        const i = c.tasks.findIndex((t) => S.status(t) !== "done");
        return i < 0 ? null : i;
      },
      submit,
      practiceAgain,
    };

    function goReview() {
      stopCurrent();
      renderReview({ ...app, submit: submitted ? () => renderResults(app, attempt) : submit });
    }
    function submit() {
      stopCurrent();
      if (!submitted) {
        ctx.items.clear();
        for (const it of S.evidenceItems(loops)) ctx.items.set(it.id, it);
        attempt = ctx.finish();
        S.close();
        submitted = true;
      }
      renderResults(app, attempt);
    }
    function practiceAgain() {
      loops.clear();
      ctx.items.clear();
      S.reopen();
      S.reset();
      submitted = false;
      attempt = null;
      showTask(0);
      announce("Starting again with clean answers.");
    }
    addEventListener("pagehide", () => current?.tv.destroy?.());

    drawMode();
    const root = h("div", { class: "st-stage st-wida", "data-domain": c.domain, "data-projector": String(ctx.mode === "projector") }, head, bar, banner, stage, disclaimer());
    ctx.root.replaceChildren(root);
    showTask(S.st.index, { focus: false });
    if (Object.keys(S.st.answers).length) announce("Welcome back. Your answers were saved on this device.");
  },
};

