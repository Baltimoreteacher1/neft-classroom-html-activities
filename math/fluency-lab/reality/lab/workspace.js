// The Math Reality workspace: one mission at a time over one live model. This file wires the model store, the journey
// reducer, the view, the coach panel and persistence together; the mathematics lives in models/ and journey.js.
import { getLang, setLang } from "../../i18n.js";
import { experienceForSkill } from "./catalog.js";
import {
  currentStep,
  evidenceOf,
  newSession,
  reduce as journey,
  sanitizeSession,
  stepDone,
  transferProblem,
} from "./journey.js";
import { L, createStore, say } from "./kernel.js";
import { modelById } from "./models/index.js";
import { renderDone, renderPanel } from "./panel.js";
import { loadLab, nextSupport, recordSkillEvidence, writeLab } from "./store.js";
import { btn, group, h } from "./views/common.js";
import { VIEWS } from "./views/index.js";

export const bandOf = (grade) => (grade <= 2 ? "early" : grade <= 5 ? "design" : "analyze");

const UI = {
  back: L("Fluency Lab", "Laboratorio de fluidez"),
  all: L("All experiences", "Todas las experiencias"),
  focus: L("Focus mode", "Modo de enfoque"),
  undo: L("Undo", "Deshacer"),
  redo: L("Redo", "Rehacer"),
  replay: L("Replay", "Repetir"),
  stop: L("Stop replay", "Detener"),
  reset: L("Reset", "Reiniciar"),
  xray: L("X-Ray", "Rayos X"),
  grade: L("Grade", "Grado"),
  step: L("Step", "Paso"),
  of: L("of", "de"),
  saved: L(
    "Welcome back. Your work is saved.",
    "Qué bueno verte de nuevo. Tu trabajo está guardado.",
  ),
  saveFail: L(
    "This browser could not save your work. Your work still works until you close the page.",
    "Este navegador no pudo guardar tu trabajo. Sigue funcionando hasta que cierres la página.",
  ),
  noMoves: L("Make a move first, then replay it.", "Haz un movimiento primero y luego repítelo."),
  restart: L("Start this experience again", "Empezar esta experiencia otra vez"),
  hub: L("Try another experience", "Probar otra experiencia"),
  bar: L("Bar", "Barra"),
  line: L("Number line", "Recta numérica"),
  symbols: L("Symbols", "Símbolos"),
  views: L("Representation", "Representación"),
  tools: L("Tools", "Herramientas"),
  readout: L("Connected values", "Valores conectados"),
  mission: L("Mission", "Misión"),
  steps: L("Steps", "Pasos"),
  tabs: {
    predict: L("Predict", "Predecir"),
    notice: L("Notice", "Observar"),
    build: L("Build", "Construir"),
    explain: L("Explain", "Explicar"),
    prove: L("Prove it", "Demuéstralo"),
    look: L("Look", "Mirar"),
  },
  notQuite: L(
    "Not yet. Look at what the model shows and try again.",
    "Todavía no. Mira lo que muestra el modelo e inténtalo otra vez.",
  ),
  seen: L("What I can see", "Lo que puedo ver"),
  guess: L("What I can only guess", "Lo que solo puedo suponer"),
};
const RO = {
  fraction: L("Fraction", "Fracción"),
  decimal: L("Decimal", "Decimal"),
  percent: L("Percent", "Porcentaje"),
  sizes: L("Pieces", "Piezas"),
  sum: L("Sum", "Suma"),
  groups: L("Groups counted", "Grupos contados"),
  answer: L("Answer", "Respuesta"),
  equation: L("Equation", "Ecuación"),
  scale: L("Scale", "Balanza"),
  x: L("Solution", "Solución"),
  area: L("Area", "Área"),
  perimeter: L("Perimeter", "Perímetro"),
  slope: L("Slope", "Pendiente"),
  prop: L("Type", "Tipo"),
  total: L("Total", "Total"),
  expanded: L("In words", "En palabras"),
  regrouped: L("Regrouped", "Reagrupado"),
  value: L("Value", "Valor"),
  pairs: L("Zero pairs", "Pares cero"),
  toTen: L("To the next ten", "Hasta la siguiente decena"),
  position: L("You are at", "Estás en"),
  hops: L("Hops", "Saltos"),
  servings: L("Servings", "Porciones"),
  factor: L("Factor", "Factor"),
  rate: L("Rate", "Tasa"),
  built: L("Built", "Construidos"),
  constant: L("Constant", "Constante"),
  rows: L("Rows", "Filas"),
};
const kindTab = (step) =>
  step.kind === "ask"
    ? step.graded === false
      ? UI.tabs.predict
      : UI.tabs.notice
    : step.kind === "task"
      ? UI.tabs.build
      : step.kind === "explain"
        ? UI.tabs.explain
        : step.kind === "transfer"
          ? UI.tabs.prove
          : UI.tabs.look;

export function mountWorkspace(
  root,
  { exp, grade, input = null, restart = false, skillKey = null, hubHref },
) {
  let lab = loadLab();
  let lang = getLang();
  let focusMode = false;
  let xray = false;
  let rep = "bar";
  let store = null;
  let storeKey = "";
  let taskResult = null;
  let transferFeedback = null;
  let feedback = null;
  let replayState = null;
  let replayTimer = null;
  let saveFailed = false;
  let timer = null;
  let evidenceLogged = false;
  const ui = {
    set: (patch, rerender = true) => {
      Object.assign(ui, patch);
      if (rerender) render();
    },
  };
  const tx = (text, vars) => say(text, lang, vars);
  const live = h("p", { class: "mr-live", role: "status", "aria-live": "polite" });
  const announce = (text) => {
    live.textContent = text;
  };

  // ---- session ---------------------------------------------------------------------------------------------------
  const saved =
    !restart && lab.sessions[exp.id] ? sanitizeSession(exp, lab.sessions[exp.id]) : null;
  let session =
    saved && !saved.done
      ? saved
      : newSession(exp, {
          seed: (Date.now() & 0x7fffffff) | 1,
          support: lab.support,
          input: input && exp.detect ? { a: input.a, b: input.b, response: input.response } : null,
        });
  if (input && exp.detect && !saved) session = journey(exp, session, { type: "input", ...input });
  const resumed = Boolean(
    saved && !saved.done && (saved.step > 0 || Object.keys(saved.tasks).length),
  );
  if (resumed) feedback = { kind: "info", text: tx(UI.saved) };

  function persist(now = false) {
    const write = () => {
      lab.sessions[exp.id] = session;
      lab.trails[exp.id] = { step: session.step, actions: store?.actions ?? [] };
      lab.last = exp.id;
      saveFailed = !writeLab(lab);
    };
    clearTimeout(timer);
    if (now) write();
    else timer = setTimeout(write, 200);
  }
  addEventListener("pagehide", () => persist(true));
  document.addEventListener(
    "visibilitychange",
    () => document.visibilityState === "hidden" && persist(true),
  );

  // ---- the live model ------------------------------------------------------------------------------------------------
  function paramsFor(step) {
    if (step.kind === "task" && step.params)
      return typeof step.params === "function" ? step.params(session, grade) : step.params;
    if (step.kind === "transfer") {
      const p = transferProblem(step, session, grade);
      return p.kind === "build" ? p.params : null;
    }
    return undefined;
  }
  function ensureStore(fromTrail) {
    const step = currentStep(exp, session);
    const params = paramsFor(step);
    const key =
      params === undefined
        ? storeKey || "base"
        : params === null
          ? storeKey
          : `${step.id}:${session.transfer[step.id]?.round ?? 0}`;
    if (store && key === storeKey) return;
    storeKey = key;
    store = createStore(
      modelById(exp.model),
      params === undefined || params === null ? exp.params : params,
    );
    store.subscribe(onChange);
    const trail = lab.trails[exp.id];
    if (fromTrail && trail && trail.step === session.step)
      for (const a of trail.actions) store.dispatch(a);
  }
  function evaluateTask() {
    const step = currentStep(exp, session);
    if (step.kind !== "task" || !store) return;
    const result = step.check(store.state, store.derive(), session);
    taskResult = result;
    if (result.done && !session.tasks[step.id]?.done) {
      session = journey(
        exp,
        session,
        { type: "task", id: step.id },
        { state: store.state, derived: store.derive() },
      );
      announce(tx(result.note ?? ""));
    }
  }
  function onChange() {
    feedback = null;
    transferFeedback = null;
    evaluateTask();
    persist();
    announce(store.describe(lang));
    render();
  }
  const act = (action) => {
    if (replayState) return { ok: false };
    const res = store.dispatch(action);
    if (!res.ok) {
      feedback = { kind: "warn", text: tx(res.reason) };
      announce(feedback.text);
      render();
    }
    return res;
  };

  // ---- journey actions ----------------------------------------------------------------------------------------------------
  function enterStep() {
    ui.picks = undefined;
    ui.text = undefined;
    ui.response = undefined;
    taskResult = null;
    transferFeedback = null;
    const step = currentStep(exp, session);
    if (step.rep) rep = step.rep;
    else if (rep !== "bar" && step.kind === "task") rep = "bar";
    ensureStore(false);
    announce(`${tx(UI.step)} ${session.step + 1} ${tx(UI.of)} ${exp.steps.length}`);
    feedback = null;
  }
  const app = {
    exp,
    get session() {
      return session;
    },
    grade,
    get lang() {
      return lang;
    },
    ui,
    tx,
    get taskResult() {
      return taskResult;
    },
    get transferFeedback() {
      return transferFeedback;
    },
    reduce(action) {
      const before = session;
      const step = currentStep(exp, session);
      session = journey(exp, session, action, {
        state: store?.state,
        derived: store?.derive(),
        grade,
      });
      if (action.type === "input") {
        ensureStore(false);
        store.reset();
      }
      if (session !== before) persist();
      render();
      return step;
    },
    next() {
      if (!stepDone(exp, session)) return;
      const last = session.step >= exp.steps.length - 1;
      session = journey(exp, session, { type: "next" });
      if (session.done && last) finish();
      else enterStep();
      persist(true);
      render(true);
    },
    goBack() {
      session = journey(exp, session, { type: "back" });
      enterStep();
      persist(true);
      render(true);
    },
    submitTransfer() {
      const step = currentStep(exp, session);
      const problem = transferProblem(step, session, grade);
      session = journey(
        exp,
        session,
        { type: "transferTry", id: step.id, response: ui.response },
        { state: store?.state, derived: store?.derive(), grade },
      );
      const rec = session.transfer[step.id];
      transferFeedback = null;
      if (rec.ok) {
        recordSkillEvidence(skillKey ?? exp.skills[0], {
          ok: true,
          supported: !rec.independent,
          tag: session.errors[0],
        });
        announce(
          tx(
            rec.independent
              ? L("Correct, on your own.", "Correcto, tú solo.")
              : L("Correct, with some help.", "Correcto, con algo de ayuda."),
          ),
        );
      } else {
        const detected = problem.detect?.(ui.response);
        const box = h("div", { class: "mr-fb is-warn" }, h("p", {}, tx(UI.notQuite)));
        if (detected && !detected.correct) {
          if (detected.confirmed?.length)
            box.append(
              h(
                "p",
                {},
                h("b", {}, `${tx(UI.seen)}: `),
                detected.confirmed.map((c) => tx(c.text)).join(" "),
              ),
            );
          if (detected.hypotheses?.length)
            box.append(
              h(
                "p",
                {},
                h("b", {}, `${tx(UI.guess)}: `),
                detected.hypotheses.map((c) => tx(c.text)).join(" "),
              ),
            );
        }
        transferFeedback = box;
        recordSkillEvidence(skillKey ?? exp.skills[0], {
          ok: false,
          supported: false,
          tag: detected?.tag,
        });
        announce(tx(UI.notQuite));
      }
      persist(true);
      render();
    },
  };
  function finish() {
    if (evidenceLogged) return;
    evidenceLogged = true;
    const ev = evidenceOf(exp, session);
    const upd = nextSupport(lab, ev.explained);
    lab.support = upd.support;
    lab.streak = upd.streak;
  }

  // ---- toolbar actions ------------------------------------------------------------------------------------------------------
  function stopReplay() {
    clearInterval(replayTimer);
    replayTimer = null;
    replayState = null;
  }
  function replay() {
    if (replayTimer) {
      stopReplay();
      render();
      return;
    }
    const frames = store.frames();
    if (frames.length < 2) {
      feedback = { kind: "info", text: tx(UI.noMoves) };
      render();
      return;
    }
    let i = 0;
    replayState = frames[0];
    render();
    replayTimer = setInterval(
      () => {
        i += 1;
        if (i >= frames.length) {
          stopReplay();
          render();
          return;
        }
        replayState = frames[i];
        render();
      },
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 1400 : 900,
    );
  }
  const toggleXray = () => {
    if (exp.model === "fracdiv") store.dispatch({ type: "xray", on: !store.state.xray });
    else {
      xray = !xray;
      render();
    }
  };

  // ---- drawing ------------------------------------------------------------------------------------------------------------------
  function captureFocus() {
    const a = document.activeElement;
    const key = a?.getAttribute?.("data-key");
    if (!key || !root.contains(a)) return () => {};
    const sel = a.selectionStart == null ? null : [a.selectionStart, a.selectionEnd];
    return () => {
      const el = root.querySelector(`[data-key="${CSS.escape(key)}"]`);
      if (!el) return;
      el.focus({ preventScroll: true });
      if (sel && el.setSelectionRange)
        try {
          el.setSelectionRange(sel[0], sel[1]);
        } catch {
          /* not a text control */
        }
    };
  }

  function topBar() {
    return h(
      "header",
      { class: "mr-top" },
      h("a", { class: "mr-back", href: "../../" }, `← ${tx(UI.back)}`),
      h(
        "div",
        { class: "mr-title" },
        h("p", { class: "mr-eyebrow" }, `${tx(UI.grade)} ${grade === 0 ? "K" : grade}`),
        h("h1", {}, tx(exp.title)),
      ),
      h(
        "div",
        { class: "mr-top-tools" },
        h("a", { class: "mr-btn is-quiet", href: hubHref }, tx(UI.all)),
        btn(
          tx(UI.focus),
          () => {
            focusMode = !focusMode;
            render();
          },
          { pressed: focusMode, key: "focus", cls: "is-quiet" },
        ),
        btn(
          lang === "es" ? "English" : "Español",
          () => {
            lang = lang === "es" ? "en" : "es";
            setLang(lang);
            document.documentElement.lang = lang;
            render();
          },
          {
            key: "lang",
            cls: "is-quiet",
            aria: lang === "es" ? "Cambiar a inglés" : "Cambiar a español",
          },
        ),
      ),
    );
  }

  function rail() {
    return h(
      "nav",
      { class: "mr-rail", "aria-label": tx(UI.steps) },
      h(
        "ol",
        {},
        ...exp.steps.map((s, i) =>
          h(
            "li",
            {
              class: `${i === session.step ? "is-current" : ""} ${stepDone(exp, session, s) ? "is-done" : ""}`,
              "aria-current": i === session.step ? "step" : null,
            },
            h("span", { class: "mr-dot-n" }, stepDone(exp, session, s) ? "✓" : String(i + 1)),
            h("span", { class: "mr-rail-t" }, tx(kindTab(s))),
          ),
        ),
      ),
    );
  }

  function missionText(step) {
    if (step.kind === "task")
      return typeof step.goal === "function" ? step.goal(session) : step.goal;
    if (step.kind === "transfer") return transferProblem(step, session, grade).prompt;
    return step.prompt;
  }

  function canvas(step, ctx) {
    const view = VIEWS[exp.model];
    const wrap = h("section", { class: "mr-canvas", "aria-label": tx(L("Model", "Modelo")) });
    const tabs = [];
    if (exp.model === "fraction")
      tabs.push(
        group(
          tx(UI.views),
          ...[
            ["bar", UI.bar],
            ["line", UI.line],
            ["symbols", UI.symbols],
          ].map(([id, label]) =>
            btn(
              tx(label),
              () => {
                rep = id;
                render();
              },
              { pressed: rep === id, key: `rep-${id}`, cls: "mr-tab" },
            ),
          ),
        ),
      );
    wrap.append(
      h(
        "div",
        { class: "mr-canvas-bar" },
        ...tabs,
        btn(`${tx(UI.xray)}`, toggleXray, {
          pressed: ctx.xray,
          key: "xray",
          cls: `mr-xray-btn ${exp.xray ? "is-primary" : ""}`,
        }),
      ),
    );
    wrap.append(view.render(ctx));
    return wrap;
  }

  function tools(ctx) {
    const view = VIEWS[exp.model];
    const bar = h(
      "div",
      { class: "mr-toolbar", role: "toolbar", "aria-label": tx(UI.tools) },
      btn(`↶ ${tx(UI.undo)}`, () => store.undo(), {
        disabled: !store.canUndo || Boolean(replayState),
        key: "undo",
      }),
      btn(`↷ ${tx(UI.redo)}`, () => store.redo(), {
        disabled: !store.canRedo || Boolean(replayState),
        key: "redo",
      }),
      btn(replayState ? tx(UI.stop) : `▶ ${tx(UI.replay)}`, replay, { key: "replay" }),
      btn(
        `⟲ ${tx(UI.reset)}`,
        () => {
          stopReplay();
          store.reset();
        },
        { disabled: Boolean(replayState), key: "reset" },
      ),
    );
    return h("section", { class: "mr-tools", "aria-label": tx(UI.tools) }, bar, view.controls(ctx));
  }

  function side(ctx, step) {
    const view = VIEWS[exp.model];
    const items = view.readout(ctx);
    const ro = h(
      "section",
      { class: "mr-readout", "aria-label": tx(UI.readout) },
      ...items.map(([k, node]) =>
        h(
          "div",
          { class: "mr-ro-row" },
          h("span", { class: "mr-ro-label" }, tx(RO[k] ?? L(k, k))),
          node,
        ),
      ),
    );
    return h("aside", { class: "mr-side" }, ro, renderPanel(app));
  }

  function stage() {
    const step = currentStep(exp, session);
    const problem = step.kind === "transfer" ? transferProblem(step, session, grade) : null;
    const answerOnly = problem?.kind === "answer";
    const state = replayState ?? store.state;
    const model = modelById(exp.model);
    const ctx = {
      state,
      d: model.derive(state),
      act,
      xray: exp.model === "fracdiv" ? state.xray : xray,
      rep,
      lang,
      band: bandOf(grade),
      ui,
      describe: () => model.describe(state, lang),
      save: Boolean(exp.saves),
    };
    const main = h(
      "div",
      { class: "mr-main" },
      h(
        "section",
        { class: "mr-mission", "aria-labelledby": "mr-mission-h" },
        h(
          "p",
          { class: "mr-kicker" },
          `${tx(UI.mission)} · ${tx(UI.step)} ${session.step + 1} ${tx(UI.of)} ${exp.steps.length}`,
        ),
        h("h2", { id: "mr-mission-h", tabindex: "-1" }, tx(missionText(step))),
        feedback ? h("p", { class: `mr-fb is-${feedback.kind}` }, feedback.text) : null,
        saveFailed ? h("p", { class: "mr-fb is-warn" }, tx(UI.saveFail)) : null,
      ),
      answerOnly ? null : canvas(step, ctx),
      answerOnly ? null : tools(ctx),
    );
    return h("div", { class: "mr-stage" }, rail(), main, side(ctx, step));
  }

  function doneScreen() {
    const ev = evidenceOf(exp, session);
    return h(
      "div",
      { class: "mr-stage mr-stage-done" },
      h(
        "div",
        { class: "mr-main" },
        renderDone(app),
        h(
          "div",
          { class: "mr-nav" },
          btn(
            tx(UI.restart),
            () => {
              session = newSession(exp, {
                seed: (Date.now() & 0x7fffffff) | 1,
                support: lab.support,
                input: null,
              });
              evidenceLogged = false;
              storeKey = "";
              ensureStore(false);
              persist(true);
              render(true);
            },
            { key: "restart" },
          ),
          h("a", { class: "mr-btn is-primary", href: hubHref }, tx(UI.hub)),
        ),
      ),
      h("span", { hidden: true }, ev.label),
    );
  }

  function render(moveFocus = false) {
    const restore = captureFocus();
    document.documentElement.dataset.band = bandOf(grade);
    root.className = `mr-app ${focusMode ? "is-focus" : ""}`;
    root.dataset.band = bandOf(grade);
    root.dataset.model = exp.model;
    root.replaceChildren(topBar(), session.done ? doneScreen() : stage(), live);
    restore();
    if (moveFocus) root.querySelector("#mr-mission-h")?.focus({ preventScroll: false });
  }

  addEventListener("keydown", (e) => {
    if (e.target.matches?.("input, textarea, select")) return;
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      store.undo();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) {
      e.preventDefault();
      store.redo();
    }
    if (e.key === "Escape" && replayTimer) {
      stopReplay();
      render();
    }
  });

  document.documentElement.lang = lang;
  ensureStore(true);
  evaluateTask();
  if (!resumed) taskResult = null;
  render(false);
  return {
    app,
    get session() {
      return session;
    },
    get store() {
      return store;
    },
    act,
    render,
  };
}

export { experienceForSkill };
