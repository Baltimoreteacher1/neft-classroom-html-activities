// Language Construction (Journey BUILD step): the UI shell for the `build` engine.
// env.pack.build is an ARRAY of modules; the learner walks them in order and each runs
// Explore (supports) -> Try -> Accepted -> Transfer (a new item with NO supports at all, whatever env.support says;
// env.independent forces the same). All resumable state lives in env.data.build; every interaction goes through
// env.update so a reload resumes mid-sentence. Pure logic: ../engines/construct.js. Contract: JOURNEY.md.
import { html, icon, raw } from "../../util.js";
import * as E from "../engines/construct.js";
import { MODULE_BODIES, moduleHandle } from "./construct-ui-modules.js";
import { autoShown, sentenceBody, sentenceHandle, textPatch } from "./construct-ui-sentence.js";
import { MODULE_LABEL, PHASE_LABEL, finalize, tt, ts } from "./construct-ui-shared.js";

const tasksOf = (task, env) =>
  Array.isArray(task) ? task : task?.kind === "build" ? [task] : env.pack?.build || [];

/** Everything a render or handler needs, derived from env on every call (env.data is a snapshot). */
export function makeApi(env, task) {
  const tasks = E.validateTasks(tasksOf(task, env));
  const state = E.loadBuild(tasks, env.data?.build);
  const i = state.index;
  const stored = state.modules[i];
  const phase = env.independent && stored.phase === "explore" ? "try" : stored.phase;
  const supportsOn = !env.independent && (phase === "explore" || phase === "try");
  return { env, tasks, state, i, rec: { ...stored, phase }, phase, task: tasks[i], supportsOn };
}

// ── view ─────────────────────────────────────────────────────────────────────
function header(api) {
  const { env, tasks, state, i, phase } = api;
  const phases = ["explore", "try", "accepted", "transfer"];
  const at = phase === "done" ? 4 : phases.indexOf(phase);
  return html`<header class="cn-head">
    <p class="eyebrow">${icon("construction")} ${tt(env, ["Build", "Construye"])}</p>
    <h2 id="cn-title" tabindex="-1" data-k="mod-title" lang="en">${api.task.title}</h2>
    <ol class="cn-steps" aria-label="${env.I.S("Build modules", "Módulos de construcción")}">
      ${tasks.map((t, k) => {
        const done = state.modules[k].accepted && state.modules[k].transferOk;
        return html`<li
          class="${done ? "is-done" : ""} ${k === i ? "is-here" : ""}"
          ${k === i ? raw('aria-current="step"') : ""}
        >
          <span class="cn-step-n">${done ? icon("check") : k + 1}</span
          ><span>${tt(env, MODULE_LABEL[t.module])}</span>
        </li>`;
      })}
    </ol>
    <ol class="cn-phases" aria-label="${env.I.S("Parts of this module", "Partes de este módulo")}">
      ${phases.map((p, k) => html`<li class="${k < at ? "is-done" : ""} ${k === at ? "is-here" : ""}" ${k === at ? raw('aria-current="step"') : ""}>${tt(env, PHASE_LABEL[p])}</li>`)}
    </ol>
  </header>`;
}

function notice(api) {
  const { env, phase } = api;
  if (phase === "transfer")
    return html`<p class="cn-notice is-transfer" role="note">
      ${icon("flag")}
      ${tt(env, ["A new one, on your own. No help this time.", "Uno nuevo, por tu cuenta. Sin ayuda esta vez."])}
    </p>`;
  if (env.independent && phase !== "done" && phase !== "accepted")
    return html`<p class="cn-notice" role="note">
      ${tt(env, ["On my own: no help here.", "Por mi cuenta: aquí no hay ayuda."])}
    </p>`;
  return "";
}

function actions(api) {
  const { env, phase, i, tasks } = api;
  const btn = (act, label, cls = "btn-primary") =>
    html`<button type="button" class="btn ${cls}" data-cn="${act}" data-k="act-${act}">
      ${tt(env, label)} ${icon("arrow-right")}
    </button>`;
  if (phase === "explore") return btn("start", ["Start", "Empezar"]);
  if (phase === "try" || phase === "transfer") return btn("check", ["Check", "Comprobar"]);
  if (phase === "accepted")
    return btn("to-transfer", ["Try a new one on my own", "Probar uno nuevo por mi cuenta"]);
  if (i < tasks.length - 1) return btn("next", ["Next module", "Siguiente módulo"]);
  return "";
}

function finished(api) {
  const { env, tasks, state } = api;
  return html`<section class="cn-finished" aria-labelledby="cn-title">
    <h2 id="cn-title" tabindex="-1" data-k="mod-title">
      ${icon("check")} ${tt(env, ["Build step complete", "Paso de construcción completo"])}
    </h2>
    <ul class="cn-steps cn-steps-done">
      ${tasks.map((t, k) => html`<li class="is-done"><span class="cn-step-n">${icon("check")}</span><span>${tt(env, MODULE_LABEL[t.module])}</span> <span class="cn-tries">${tt(env, [`${state.modules[k].attempts} tries, then a new item on my own`, `${state.modules[k].attempts} intentos y luego uno nuevo por mi cuenta`])}</span></li>`)}
    </ul>
  </section>`;
}

/** render(task, env) -> html. `task` may be the build array (env.pack.build) or one build task. */
export function render(task, env) {
  let api;
  try {
    api = makeApi(env, task);
  } catch (err) {
    console.error(err);
    return finalize(
      html`<section class="cn d-writing">
        <div class="feedback is-hint" role="alert">
          <p class="fb-title">
            ${icon("bulb")}
            ${env.I.T("This Build step could not load.", "Este paso de construcción no pudo cargarse.")}
          </p>
        </div>
      </section>`,
    );
  }
  if (
    api.state.finished &&
    api.i === api.tasks.length - 1 &&
    api.state.modules[api.i].phase === "done" &&
    !env.reviewing
  ) {
    return finalize(
      html`<section class="cn d-writing" data-cn-root data-band="${env.band}">
        ${finished(api)}
      </section>`,
    );
  }
  const body = E.SENTENCE_MODULES.includes(api.task.module)
    ? sentenceBody(api)
    : MODULE_BODIES[api.task.module](api);
  return finalize(
    html`<section
      class="cn d-writing"
      data-cn-root
      data-band="${env.band}"
      data-module="${api.task.module}"
      data-phase="${api.phase}"
      aria-labelledby="cn-title"
    >
      ${header(api)} ${notice(api)}
      <div class="cn-body">${body}</div>
      <div class="cn-actions">${actions(api)}</div>
    </section>`,
  );
}

// ── actions ──────────────────────────────────────────────────────────────────
function check(api, root) {
  const { env, tasks, task, i } = api;
  let state = api.state;
  const dk = api.phase === "transfer" ? "tdraft" : "draft";
  if (E.SENTENCE_MODULES.includes(task.module)) {
    const typed = root.querySelector('[data-k="tray"]')?.value;
    if (typed != null)
      state = E.setRecord(state, i, { [dk]: { ...state.modules[i][dk], text: typed } });
  }
  const before = state.modules[i];
  const { state: next, result, kind } = E.submit(task, state, i);
  const supports = kind === "transfer" ? [] : before.supports;
  const entry = E.ledgerEntry({
    module: task.module,
    text: result.text,
    missionId: env.missionId,
    band: env.band,
    klu: env.mission?.klu || "Explain",
    kind,
    supports,
    independent: Boolean(env.independent) || kind === "transfer",
    wordBank: (env.pack?.vocab || []).map((v) => v[0]),
  });
  if (entry) env.ledger?.(entry);
  env.announce?.(ts(env, result.summary));
  const wasDone = next.finished;
  const out = !wasDone && E.doneCriteria(tasks, next).done ? { ...next, finished: true } : next;
  return {
    state: out,
    focus: "fb",
    after: out.finished && !wasDone ? () => env.done?.(E.doneResult(tasks, out)) : null,
  };
}

const SHELL = {
  start: (api) => ({ state: E.setRecord(api.state, api.i, { phase: "try" }), focus: "tray" }),
  "to-transfer": (api) => ({
    state: E.setRecord(api.state, api.i, { phase: "transfer" }),
    focus: "mod-title",
  }),
  next: (api) => ({
    state: { ...api.state, index: Math.min(api.tasks.length - 1, api.i + 1) },
    focus: "mod-title",
  }),
  help: (api, el) => {
    const id = el.dataset.v;
    api.env.help?.(`build.${api.task.module}.${id}`);
    return { state: E.noteSupport(api.state, api.i, id), focus: `sup-${id}` };
  },
};

// ── mount ────────────────────────────────────────────────────────────────────
let pendingFocus = null;

function commit(root, out) {
  const env = root.__cnEnv;
  pendingFocus = out.focus ? { key: out.focus } : null;
  env.update({ build: out.state });
  out.after?.();
}

function onClick(root, e) {
  const el = e.target.closest?.("[data-cn]");
  if (!el || !root.contains(el) || el.disabled) return;
  e.preventDefault();
  clearTimeout(root.__cnTimer);
  let api;
  try {
    api = makeApi(root.__cnEnv, root.__cnTask);
  } catch {
    return;
  }
  const act = el.dataset.cn;
  const sentence = E.SENTENCE_MODULES.includes(api.task.module);
  const out =
    act === "check"
      ? check(api, root)
      : SHELL[act]
        ? SHELL[act](api, el)
        : (sentence ? sentenceHandle : moduleHandle)(api, act, el, root);
  if (out) commit(root, out);
}

/** Persist typing after a pause (never on blur: a rerender between mousedown and click would swallow the tap). */
function onInput(root, e) {
  const el = e.target;
  if (!el?.matches?.("[data-cn-text]")) return;
  clearTimeout(root.__cnTimer);
  root.__cnTimer = setTimeout(() => {
    let api;
    try {
      api = makeApi(root.__cnEnv, root.__cnTask);
    } catch {
      return;
    }
    const live = root.querySelector(`[data-k="${el.dataset.k}"]`) || el;
    const out = textPatch(api, live);
    pendingFocus = { key: out.focus, start: live.selectionStart, end: live.selectionEnd };
    root.__cnEnv.update({ build: out.state });
  }, 450);
}

function restoreFocus(root) {
  const want = pendingFocus;
  pendingFocus = null;
  if (!want) return;
  const el = root.querySelector(`[data-k="${want.key}"]`);
  if (!el) return;
  el.focus();
  if (want.start != null && typeof el.setSelectionRange === "function")
    el.setSelectionRange(want.start, want.end ?? want.start);
}

/** Supports that are on screen by default for this support level count as opened. */
function noteVisibleSupports(root, env) {
  let api;
  try {
    api = makeApi(env, root.__cnTask);
  } catch {
    return;
  }
  const todo = autoShown(api).filter(
    (id) => !api.rec.supports.includes(id) && !root.__cnNoted?.has(`${api.i}:${id}`),
  );
  if (!todo.length) return;
  root.__cnNoted = root.__cnNoted || new Set();
  let state = api.state;
  for (const id of todo) {
    root.__cnNoted.add(`${api.i}:${id}`);
    env.help?.(`build.${api.task.module}.${id}`);
    state = E.noteSupport(state, api.i, id);
  }
  env.update({ build: state });
}

export function mount(root, env) {
  root.__cnEnv = env;
  root.__cnTask = env.pack?.build || [];
  if (!root.__cnBound) {
    root.__cnBound = true;
    root.addEventListener("click", (e) => onClick(root, e));
    root.addEventListener("input", (e) => onInput(root, e));
  }
  restoreFocus(root);
  noteVisibleSupports(root, env);
}
