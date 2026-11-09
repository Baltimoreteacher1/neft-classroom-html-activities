// Model Lab (Enterprise 8): the learner-facing screen for the MathVisualEngine, the Show Me Why lessons and the
// Guided Solver. Everything on screen is derived from one engine state; every control is a real <button>, and the
// pictures also take pointer and (for many models) arrow-key input. Nothing here is timed.
import { boardUrl, movesFromEngine, replayMoves } from "../board-link.js"; // fl-teacher: shareable boards
import { getLang } from "../i18n.js";
import { MathVisualEngine, bi, esc, seeded } from "./engine-core.js";
import { THREE_MODEL_IDS } from "./three/registry.js";
import {
  GuidedSolver,
  buildPlan,
  nextScaffold,
  parallelQuestion,
} from "./guided-solver.js";
import { ALL_SKILLS, generateProblem, seededRandom } from "../problem-bank.js";
import { LESSONS, ShowMeWhy, lessonsForGrade } from "./show-me-why.js";
import { modelsForGrade, listModels } from "./models.js";
import { DOMAINS } from "./tokens.js";

const pick = (obj) =>
  obj && typeof obj === "object" ? obj[getLang() === "es" ? "es" : "en"] : obj;
const L = (en, es) => (getLang() === "es" ? es : en);

const reduceMotion = () =>
  Boolean(
    globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  ) || document.body?.dataset.reducedMotion === "true";

function tableHtml(numeric) {
  if (!numeric || !numeric.rows.length) return "";
  return `<table class="e8ml-table"><thead><tr>${numeric.headers.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${numeric.rows.map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

// ---------------------------------------------------------------- the model workspace (free play and lesson stages)
export class Workspace {
  constructor(host, { onEvent } = {}) {
    this.host = host;
    this.onEvent = onEvent || (() => {});
    this.engine = null;
    this.focusId = null;
    this.locked = false;
    this.three = null;
    this.threeModelId = "";
    this.threeLoading = false;
    this.threeToken = 0;
    this.threeLang = "";
    this.handleClick = (event) => this.click(event);
    this.handleKey = (event) => this.key(event);
    host.addEventListener("click", this.handleClick);
    host.addEventListener("keydown", this.handleKey);
  }

  destroy() {
    this.destroyThree();
    this.host.removeEventListener("click", this.handleClick);
    this.host.removeEventListener("keydown", this.handleKey);
    this.host.replaceChildren();
  }

  show(engine) {
    this.engine = engine;
    if (!engine) this.destroyThree();
    this.paint();
  }

  destroyThree() {
    this.threeToken += 1;
    this.threeLoading = false;
    this.three?.destroy?.();
    this.three = null;
    this.threeModelId = "";
    this.threeLang = "";
  }

  syncThree() {
    const slot = this.host.querySelector(".e8ml-three-shell");
    if (!slot || !this.engine) {
      this.destroyThree();
      return;
    }
    const modelId = slot.dataset.e8Three;
    const language = getLang() === "es" ? "es" : "en";
    const update = () => {
      const engine = this.engine;
      if (!engine || !this.three) return;
      const description = engine.model.describe?.(engine.state, engine.params);
      this.three.update({
        state: engine.state,
        params: engine.params,
        derived: engine.model.derive(engine.state, engine.params),
        description: pick(description),
      });
    };
    if (this.three && this.threeModelId === modelId && this.threeLang === language) {
      this.three.attach(slot);
      update();
      return;
    }
    if (this.threeModelId !== modelId || this.threeLang !== language) this.destroyThree();
    if (this.threeLoading) return;
    this.threeLoading = true;
    this.threeModelId = modelId;
    this.threeLang = language;
    const token = ++this.threeToken;
    import("./three/registry.js")
      .then(({ mountThreeModel }) =>
        mountThreeModel(modelId, slot, {
          lang: language,
          state: this.engine?.state,
          params: this.engine?.params,
          onAction: (action) => {
            if (this.locked) {
              this.afterMove({
                ok: false,
                reason: pick(
                  bi(
                    "This model is paused for this lesson step. Continue to the build step to make a change.",
                    "Este modelo está en pausa durante este paso. Continúa al paso de construcción para cambiarlo.",
                  ),
                ),
              });
              return;
            }
            this.act(action);
          },
        }),
      )
      .then((view) => {
        this.threeLoading = false;
        if (token !== this.threeToken || this.threeModelId !== modelId) {
          view?.destroy?.();
          return;
        }
        if (!view) return this.fallbackThree(slot);
        this.three = view;
        const latestSlot = this.host.querySelector(".e8ml-three-shell");
        if (latestSlot) this.three.attach(latestSlot);
        update();
      })
      .catch(() => {
        this.threeLoading = false;
        if (token === this.threeToken) this.fallbackThree(this.host.querySelector(".e8ml-three-shell"));
      });
  }

  fallbackThree(slot) {
    if (!slot) return;
    slot.dataset.renderer = "fallback";
    slot.setAttribute("role", "status");
    slot.textContent = pick(
      bi(
        "The 3D view is unavailable in this browser. Open the accessible 2D model below and keep working.",
        "La vista 3D no está disponible en este navegador. Abre el modelo 2D accesible y continúa.",
      ),
    );
    const fallback = slot.parentElement?.querySelector(".e8ml-2d-fallback");
    if (fallback) fallback.open = true;
  }

  click(event) {
    const button = event.target.closest("[data-e8-control]");
    if (button && !button.disabled) {
      this.focusId = button.dataset.e8Control;
      const action = JSON.parse(button.dataset.e8Action);
      this.act(action);
      return;
    }
    const tool = event.target.closest("[data-e8-tool]");
    if (tool && !tool.disabled) {
      this.focusId = `tool-${tool.dataset.e8Tool}`;
      this.engine[tool.dataset.e8Tool]();
      this.paint();
      this.onEvent({ type: tool.dataset.e8Tool });
      return;
    }
    const svg = event.target.closest(".e8ml-visual svg");
    if (svg && this.engine?.model.pointer) {
      const box = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const hit = {
        x: ((event.clientX - box.left) / box.width) * vb.width,
        y: ((event.clientY - box.top) / box.height) * vb.height,
        dataset: event.target.dataset || {},
      };
      const result = this.engine.pointer(hit);
      this.afterMove(result);
    }
  }

  key(event) {
    if (!this.engine) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      event.shiftKey ? this.engine.redo() : this.engine.undo();
      this.paint();
      return;
    }
    const inVisual = event.target.closest(".e8ml-visual");
    if (!inVisual) return;
    const action = this.engine.keyMap()[event.key];
    if (action) {
      event.preventDefault();
      this.act(action);
    }
  }

  act(action) {
    this.afterMove(this.engine.dispatch(action));
  }

  afterMove(result) {
    this.paint();
    const note = this.host.querySelector(".e8ml-note");
    if (note) note.textContent = result.ok ? "" : pick(result.reason) || "";
    this.onEvent({ type: "move", ok: result.ok });
  }

  paint() {
    const e = this.engine;
    if (!e) {
      this.destroyThree();
      this.host.innerHTML = "";
      return;
    }
    const views = e.views();
    const active = document.activeElement;
    const visualHadFocus = Boolean(active?.classList?.contains("e8ml-visual") && this.host.contains(active));
    const lang = getLang() === "es" ? "es" : "en";
    const variants = Object.values(views.variants).join("");
    const threeEnabled = THREE_MODEL_IDS.includes(e.model.id);
    const visual = threeEnabled
      ? `<div class="e8ml-three-shell" data-e8-three="${esc(e.model.id)}"></div><details class="e8ml-2d-fallback"><summary>${esc(L("Use the accessible 2D model", "Usar el modelo 2D accesible"))}</summary><div class="e8ml-2d-model">${views.visual}${variants}</div></details>`
      : `${views.visual}${variants}`;
    const controls = e
      .controls()
      .map(
        (c) =>
          `<button type="button" class="e8ml-btn" data-e8-control="${esc(c.id)}" data-e8-action='${esc(JSON.stringify(c.action))}' ${c.disabled || this.locked ? "disabled" : ""}>${esc(c.label[lang])}</button>`,
      )
      .join("");
    const problems = e.verify();
    this.host.innerHTML = `
      <div class="e8ml-visual" data-model="${esc(e.model.id)}" tabindex="0" role="group" aria-label="${esc(pick(e.model.title))}. ${esc(pick(views.concrete))}">${visual}</div>
      <div class="e8ml-linked" aria-label="${esc(L("Linked views", "Vistas conectadas"))}">
        <p class="e8ml-words"><span class="e8ml-tag">${esc(L("In words", "En palabras"))}</span> ${esc(pick(views.verbal))}</p>
        <p class="e8ml-symbols"><span class="e8ml-tag">${esc(L("In symbols", "En símbolos"))}</span> <span class="e8ml-eq">${esc(views.symbolic)}</span></p>
        ${views.numeric && views.numeric.rows.length ? `<div class="e8ml-numbers"><span class="e8ml-tag">${esc(L("In numbers", "En números"))}</span>${tableHtml(views.numeric)}</div>` : ""}
        ${problems.length ? `<p class="e8ml-alert" role="alert">${esc(problems.join("; "))}</p>` : ""}
      </div>
      <div class="e8ml-controls" role="group" aria-label="${esc(L("Change the model", "Cambiar el modelo"))}">${controls}</div>
      <div class="e8ml-toolbar">
        <button type="button" class="e8ml-btn e8ml-quiet" data-e8-tool="undo" ${e.past.length && !this.locked ? "" : "disabled"}>${esc(L("Undo", "Deshacer"))}</button>
        <button type="button" class="e8ml-btn e8ml-quiet" data-e8-tool="redo" ${e.future.length && !this.locked ? "" : "disabled"}>${esc(L("Redo", "Rehacer"))}</button>
        <button type="button" class="e8ml-btn e8ml-quiet" data-e8-tool="reset" ${e.past.length && !this.locked ? "" : "disabled"}>${esc(L("Reset model", "Reiniciar modelo"))}</button>
      </div>
      <p class="e8ml-note" role="status" aria-live="polite"></p>`;
    if (visualHadFocus) this.host.querySelector(".e8ml-visual")?.focus({ preventScroll: true });
    const target = this.focusId
      ? this.host.querySelector(
          `[data-e8-control="${this.focusId}"], [data-e8-tool="${String(this.focusId).replace("tool-", "")}"]`,
        )
      : null;
    if (target && !target.disabled) target.focus({ preventScroll: true });
    this.syncThree();
  }
}

// ---------------------------------------------------------------- Show Me Why panel
function lessonStepHtml(run) {
  const kinds = ["predict", "build", "watch", "explain", "try"];
  const names = {
    predict: L("Predict", "Predecir"),
    build: L("Build", "Construir"),
    watch: L("Watch", "Observar"),
    explain: L("Explain", "Explicar"),
    try: L("Try one yourself", "Prueba una tú"),
  };
  const dots = `<ol class="e8ml-steps" aria-label="${esc(L("Lesson steps", "Pasos de la lección"))}">${kinds.map((k, i) => `<li ${i === run.index ? 'aria-current="step"' : ""} class="${i < run.index ? "done" : ""}">${esc(names[k])}</li>`).join("")}</ol>`;
  if (run.done) {
    const ev = run.evidence();
    return `${dots}<div class="e8ml-done"><h3>${esc(L("Nicely done!", "¡Bien hecho!"))}</h3><p>${esc(ev.independent ? L("You solved the last problem on your own, with no hints.", "Resolviste el último problema tú solo, sin pistas.") : L("You finished with some help. Try another lesson later and solve the last one on your own.", "Terminaste con ayuda. Haz otra lección después y resuelve el último tú solo."))}</p><button type="button" class="e8ml-btn" data-e8-lesson-again>${esc(L("Try a different problem", "Probar otro problema"))}</button></div>`;
  }
  const def = run.def;
  switch (run.kind) {
    case "predict":
      return `${dots}<div class="e8ml-lesson-body"><p class="e8ml-q">${esc(pick(def.predict.q))}</p><div class="e8ml-choices">${run
        .predictChoices()
        .map(
          (c) =>
            `<button type="button" class="e8ml-btn" data-e8-predict="${c.index}" ${run.record.predict ? "disabled" : ""}>${esc(pick(c.text))}</button>`,
        )
        .join(
          "",
        )}</div>${run.record.predict ? `<p class="e8ml-why" role="status">${esc(pick(def.predict.why))}</p><button type="button" class="e8ml-btn e8ml-primary" data-e8-next>${esc(L("Build it", "Constrúyelo"))}</button>` : ""}</div>`;
    case "build":
      return `${dots}<div class="e8ml-lesson-body"><p class="e8ml-q">${esc(pick(def.build.goal))}</p><div class="e8ml-row"><button type="button" class="e8ml-btn e8ml-primary" data-e8-check-build>${esc(L("Check my build", "Revisar mi construcción"))}</button><button type="button" class="e8ml-btn e8ml-quiet" data-e8-build-hint>${esc(L("Give me a hint", "Dame una pista"))}</button></div><p class="e8ml-why" role="status" data-e8-lesson-note></p></div>`;
    case "watch": {
      const total = def.watch.actions.length;
      const caption = run.watchFrame
        ? pick(def.watch.captions[run.watchFrame - 1])
        : L(
            "Press Next to see the first move.",
            "Presiona Siguiente para ver el primer movimiento.",
          );
      return `${dots}<div class="e8ml-lesson-body"><p class="e8ml-q" aria-live="polite">${esc(caption)}</p><div class="e8ml-row"><button type="button" class="e8ml-btn" data-e8-watch="-1" ${run.watchFrame ? "" : "disabled"}>${esc(L("Previous", "Anterior"))}</button>${run.canAutoplay ? `<button type="button" class="e8ml-btn" data-e8-play>${esc(L("Play", "Reproducir"))}</button>` : ""}<button type="button" class="e8ml-btn" data-e8-watch="1" ${run.watchFrame >= total ? "disabled" : ""}>${esc(L("Next", "Siguiente"))}</button><button type="button" class="e8ml-btn e8ml-quiet" data-e8-watch="reset">${esc(L("Replay", "Repetir"))}</button></div><p class="e8ml-count">${esc(L(`Move ${run.watchFrame} of ${total}`, `Movimiento ${run.watchFrame} de ${total}`))}</p>${run.canAutoplay ? "" : `<p class="e8ml-count">${esc(L("Reduced motion is on, so nothing plays by itself. Use Next.", "El movimiento reducido está activado, así que nada se mueve solo. Usa Siguiente."))}</p>`}${run.canAdvance() ? `<button type="button" class="e8ml-btn e8ml-primary" data-e8-next>${esc(L("Explain it", "Explícalo"))}</button>` : ""}</div>`;
    }
    case "explain":
      return `${dots}<div class="e8ml-lesson-body"><p class="e8ml-q">${esc(pick(def.explain.prompt))}</p><details class="e8ml-frames"><summary>${esc(L("Sentence frames", "Marcos de oraciones"))}</summary>${def.explain.frames.map((f, i) => `<button type="button" class="e8ml-btn e8ml-quiet" data-e8-frame="${i}">${esc(pick(f))}</button>`).join("")}</details><label class="e8ml-label" for="e8ml-explain">${esc(L("Your explanation", "Tu explicación"))}</label><textarea id="e8ml-explain" rows="3" class="e8ml-text"></textarea><button type="button" class="e8ml-btn e8ml-primary" data-e8-explain>${esc(L("Save my explanation", "Guardar mi explicación"))}</button><p class="e8ml-why" role="status" data-e8-lesson-note></p>${run.record.explain ? `<button type="button" class="e8ml-btn e8ml-primary" data-e8-next>${esc(L("Try one yourself", "Prueba una tú"))}</button>` : ""}</div>`;
    case "try":
      return `${dots}<div class="e8ml-lesson-body"><p class="e8ml-q">${esc(pick(run.tryQuestion.prompt))}</p><label class="e8ml-label" for="e8ml-try">${esc(L("Your answer", "Tu respuesta"))}</label><div class="e8ml-row"><input id="e8ml-try" class="e8ml-text e8ml-short" inputmode="text" autocomplete="off"><button type="button" class="e8ml-btn e8ml-primary" data-e8-try>${esc(L("Check", "Comprobar"))}</button><button type="button" class="e8ml-btn e8ml-quiet" data-e8-try-hint>${esc(L("Hint", "Pista"))}</button></div><p class="e8ml-why" role="status" data-e8-lesson-note></p>${run.record.try?.correct ? `<button type="button" class="e8ml-btn e8ml-primary" data-e8-next>${esc(L("Finish", "Terminar"))}</button>` : ""}</div>`;
    default:
      return dots;
  }
}

// ---------------------------------------------------------------- the lab
export function mountModelLab(
  container,
  { grade = 3, onEvidence = () => {}, initialModel = null, initialBoard = null } = {},
) {
  const lang = () => (getLang() === "es" ? "es" : "en");
  const state = {
    grade: Number(grade) || 3,
    modelId: null,
    run: null,
    timer: null,
    seed: 1,
    board: null,
  };
  const ids = () => {
    const forGrade = modelsForGrade(state.grade);
    return forGrade.length ? forGrade : listModels();
  };

  container.innerHTML = `
    <section class="e8ml" aria-labelledby="e8ml-title">
      <header class="e8ml-head"><h2 id="e8ml-title">${esc(L("Model Lab", "Laboratorio de modelos"))}</h2><p>${esc(L("Change a model and watch the picture, the words, the symbols and the numbers change together.", "Cambia un modelo y mira cómo la imagen, las palabras, los símbolos y los números cambian juntos."))}</p></header>
      <div class="e8ml-picker" role="group" aria-label="${esc(L("Choose a model", "Elige un modelo"))}"></div>
      <div class="e8ml-lessonbar"></div>
      <div class="e8ml-workspace"></div>
      <div class="e8ml-share"><button type="button" class="e8ml-btn" data-board-share>${esc(L("Share this board", "Compartir este tablero"))}</button><input class="e8ml-text" readonly hidden data-board-link aria-label="${esc(L("Link to this board", "Enlace a este tablero"))}"><span class="e8ml-note" role="status" data-board-status></span></div>
      <section class="e8ml-lesson" aria-label="${esc(L("Show me why", "Muéstrame por qué"))}" hidden></section>
      <section class="e8ml-solver" aria-label="${esc(L("Guided solver", "Solucionador guiado"))}"></section>
    </section>`;
  const picker = container.querySelector(".e8ml-picker");
  const lessonbar = container.querySelector(".e8ml-lessonbar");
  const lessonPanel = container.querySelector(".e8ml-lesson");
  const workspace = new Workspace(container.querySelector(".e8ml-workspace"));

  function select(id) {
    stopTimer();
    state.modelId = id;
    state.run = null;
    const model = listModels().find((m) => m.id === id);
    const params = model.generate(
      seeded(state.seed * 31 + id.length),
      state.grade,
    );
    workspace.locked = false;
    const engine = new MathVisualEngine(id, params);
    state.board = { engine, model: id, seed: state.seed, grade: state.grade };
    workspace.show(engine);
    lessonPanel.hidden = true;
    paintPicker();
    paintLessonBar();
  }

  function paintPicker() {
    picker.innerHTML = ids()
      .map(
        (m) =>
          `<button type="button" class="e8ml-chip e8ml-domain-${m.domain}" data-e8-model="${m.id}" aria-pressed="${m.id === state.modelId}">${esc(pick(m.title))}</button>`,
      )
      .join("");
  }

  function paintLessonBar() {
    const lessons = lessonsForGrade(state.grade).filter(
      (id) => LESSONS[id]().model === state.modelId,
    );
    lessonbar.innerHTML = lessons.length
      ? lessons
          .map(
            (id) =>
              `<button type="button" class="e8ml-btn e8ml-primary" data-e8-lesson="${id}">${esc(L("Show me why: ", "Muéstrame por qué: "))}${esc(pick(LESSONS[id]().title))}</button>`,
          )
          .join("")
      : `<p class="e8ml-count">${esc(L("Try the controls, then use Undo and Start over as often as you like.", "Prueba los controles y usa Deshacer y Empezar de nuevo las veces que quieras."))}</p>`;
  }

  function stopTimer() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }

  function startLesson(id) {
    stopTimer();
    state.seed += 1;
    state.run = new ShowMeWhy(id, {
      seed: state.seed,
      reducedMotion: reduceMotion(),
    });
    lessonPanel.hidden = false;
    paintLesson();
  }

  function paintLesson() {
    const run = state.run;
    if (!run) return;
    lessonPanel.innerHTML = `<h3 class="e8ml-lesson-title">${esc(pick(run.def.title))}</h3>${lessonStepHtml(run)}`;
    const engine =
      run.kind === "try" && run.tryEngine ? run.tryEngine : run.engine;
    // Predict and explain show the model at rest; build lets the learner move it; try gives a fresh one.
    workspace.locked = run.kind === "predict" || run.kind === "watch";
    workspace.show(engine);
    if (run.done && !run.reported) {
      run.reported = true;
      onEvidence(run.evidence());
    }
  }

  const note = (text) => {
    const el = lessonPanel.querySelector("[data-e8-lesson-note]");
    if (el) el.textContent = text || "";
  };

  container.__e8Handler && container.removeEventListener("click", container.__e8Handler);
  container.__e8Handler = (event) => {
    const t = event.target.closest("button");
    if (!t) return;
    const run = state.run;
    if (t.dataset.e8Model) return select(t.dataset.e8Model);
    if (t.dataset.e8Lesson) return startLesson(t.dataset.e8Lesson);
    if (t.hasAttribute("data-e8-lesson-again")) return startLesson(run.id);
    if (!run) return;
    if (t.dataset.e8Predict !== undefined) {
      run.answerPredict(Number(t.dataset.e8Predict));
      return paintLesson();
    }
    if (t.hasAttribute("data-e8-next")) {
      run.next();
      return paintLesson();
    }
    if (t.hasAttribute("data-e8-check-build")) {
      const result = run.checkBuild();
      if (result.ok) {
        run.next();
        return paintLesson();
      }
      return note(pick(result.hint));
    }
    if (t.hasAttribute("data-e8-build-hint"))
      return note(pick(run.buildHint()));
    if (t.dataset.e8Watch !== undefined) {
      stopTimer();
      const v = t.dataset.e8Watch;
      run.watchTo(v === "reset" ? 0 : run.watchFrame + Number(v));
      return paintLesson();
    }
    if (t.hasAttribute("data-e8-play")) {
      stopTimer();
      run.watchTo(0);
      paintLesson();
      state.timer = setInterval(() => {
        if (run.watchFrame >= run.def.watch.actions.length) return stopTimer();
        run.watchTo(run.watchFrame + 1);
        paintLesson();
      }, 1800);
      return;
    }
    if (t.dataset.e8Frame !== undefined) {
      const area = lessonPanel.querySelector("#e8ml-explain");
      area.value = `${area.value}${area.value ? " " : ""}${pick(run.def.explain.frames[Number(t.dataset.e8Frame)])}`;
      return area.focus();
    }
    if (t.hasAttribute("data-e8-explain")) {
      const area = lessonPanel.querySelector("#e8ml-explain");
      const result = run.submitExplain(
        area.value,
        /___/.test(area.value) ? 0 : null,
      );
      if (!result.ok) return note(pick(result.feedback));
      paintLesson();
      return;
    }
    if (t.hasAttribute("data-e8-try")) {
      const input = lessonPanel.querySelector("#e8ml-try");
      const result = run.answerTry(input.value);
      if (result.ok) return paintLesson();
      return note(pick(result.feedback));
    }
    if (t.hasAttribute("data-e8-try-hint")) return note(pick(run.tryHint()));
  };
  container.addEventListener("click", container.__e8Handler);

  // The guided solver sits under the lab: pick a problem the solver understands for this grade.
  const solverHost = container.querySelector(".e8ml-solver");
  mountSolver(solverHost, { grade: state.grade, onEvidence });

  const shareBoard = async () => {
    const status = container.querySelector("[data-board-status]");
    const field = container.querySelector("[data-board-link]");
    const board = state.board;
    const moves = board && workspace.engine === board.engine ? movesFromEngine(board.engine) : null;
    const href = moves && boardUrl({ model: board.model, seed: board.seed, grade: board.grade, moves });
    if (!href) {
      status.textContent = L(
        "This board is too long to share, or a lesson step is open. Start over or close the lesson step.",
        "Este tablero es demasiado largo para compartir, o hay un paso de lección abierto. Empieza de nuevo o cierra el paso de la lección.",
      );
      return;
    }
    field.value = href;
    field.hidden = false;
    try {
      await navigator.clipboard.writeText(href);
      status.textContent = L("Link copied.", "Enlace copiado.");
    } catch {
      field.select();
      status.textContent = L("Select the link and copy it.", "Selecciona el enlace y cópialo.");
    }
  };
  container.__boardHandler && container.removeEventListener("click", container.__boardHandler);
  container.__boardHandler = (event) => {
    if (event.target.closest("[data-board-share]")) shareBoard();
  };
  container.addEventListener("click", container.__boardHandler);

  const homeGrade = state.grade;
  if (initialBoard) state.grade = initialBoard.grade;
  const wanted = initialBoard && ids().some((m) => m.id === initialBoard.model) ? initialBoard : null;
  if (wanted) state.seed = wanted.seed;
  else state.grade = homeGrade;
  select(
    wanted
      ? wanted.model
      : initialModel && ids().some((m) => m.id === initialModel)
        ? initialModel
        : ids()[0].id,
  );
  if (wanted) {
    replayMoves(workspace.engine, wanted.moves);
    workspace.show(workspace.engine);
  }
  return {
    setGrade(g) {
      state.grade = Number(g) || state.grade;
      select(ids()[0].id);
      mountSolver(solverHost, { grade: state.grade, onEvidence });
    },
    destroy() {
      stopTimer();
      workspace.destroy();
      container.innerHTML = "";
    },
  };
}

// ---------------------------------------------------------------- guided solver UI
export function mountSolver(
  host,
  { grade = 6, onEvidence = () => {}, scaffold = 3 } = {},
) {
  const S = {
    solver: null,
    question: null,
    scaffold,
    history: [],
    seed: 1,
    skill: null,
  };

  function pickProblem() {
    const skills = ALL_SKILLS.filter((s) => s.grade === Number(grade));
    for (let tries = 0; tries < 200; tries += 1) {
      const skill = skills[(S.seed + tries) % skills.length];
      const p = generateProblem(skill, seededRandom(S.seed * 53 + tries), 1);
      if (buildPlan(p.question)) return { skill, question: p.question };
    }
    return null;
  }

  function begin(question, skill) {
    S.question = question;
    S.skill = skill;
    S.solver = new GuidedSolver(question, { scaffold: S.scaffold });
    paint();
  }

  function paint(message = "") {
    const sv = S.solver;
    if (!sv) {
      host.innerHTML = `<h3>${esc(L("Guided solver", "Solucionador guiado"))}</h3><p>${esc(L("There is no guided problem for this grade yet.", "Todavía no hay un problema guiado para este grado."))}</p>`;
      return;
    }
    const step = sv.current();
    const lang = getLang() === "es" ? "es" : "en";
    const head = `<h3>${esc(L("Guided solver", "Solucionador guiado"))}</h3><p class="e8ml-q">${esc(S.question)}</p><p class="e8ml-count">${esc(pick(sv.plan.objective))} · ${esc(L(`Support level ${S.scaffold} of 3`, `Nivel de apoyo ${S.scaffold} de 3`))}</p>`;
    if (!step) {
      const sum = sv.summary();
      host.innerHTML = `${head}<div class="e8ml-done"><p>${esc(sum.independent ? L("You solved it on your own. That counts as independent work.", "Lo resolviste tú solo. Cuenta como trabajo independiente.") : L("You solved it with support, so it is saved as supported practice. Now try a fresh one with less help.", "Lo resolviste con apoyo, así que se guarda como práctica con apoyo. Ahora prueba uno nuevo con menos ayuda."))}</p><button type="button" class="e8ml-btn e8ml-primary" data-e8-fresh>${esc(L("A fresh problem", "Un problema nuevo"))}</button></div>`;
      return;
    }
    const choices =
      step.kind === "choice"
        ? `<div class="e8ml-choices">${step.choices.map((c, i) => `<button type="button" class="e8ml-btn" data-e8-choice="${i}">${esc(c.text[lang])}</button>`).join("")}</div>`
        : `<div class="e8ml-row"><label class="e8ml-label" for="e8ml-sv">${esc(L("Your answer", "Tu respuesta"))}</label><input id="e8ml-sv" class="e8ml-text e8ml-short" autocomplete="off" inputmode="text"><button type="button" class="e8ml-btn e8ml-primary" data-e8-sv-check>${esc(L("Check", "Comprobar"))}</button></div>`;
    host.innerHTML = `${head}<p class="e8ml-q" id="e8ml-sv-prompt">${esc(pick(step.prompt))}</p>${choices}<div class="e8ml-row"><button type="button" class="e8ml-btn e8ml-quiet" data-e8-sv-hint>${esc(L("Give me a hint", "Dame una pista"))}</button><button type="button" class="e8ml-btn e8ml-quiet" data-e8-sv-reveal>${esc(L("Show me this step", "Muéstrame este paso"))}</button></div><p class="e8ml-why" role="status" aria-live="polite">${esc(message)}</p>`;
    host.querySelector("#e8ml-sv")?.focus();
  }

  function finishIfDone() {
    if (S.solver.current()) return;
    const sum = S.solver.summary();
    S.history.push({ independent: sum.independent, correct: sum.correct });
    onEvidence({
      source: "guided-solver",
      skill: S.skill,
      question: S.question,
      ...sum,
    });
  }

  host.__e8Handler && host.removeEventListener("click", host.__e8Handler);
  host.__e8Handler = (event) => {
    const t = event.target.closest("button");
    if (!t || !S.solver) return;
    if (t.hasAttribute("data-e8-fresh")) {
      S.seed += 1;
      S.scaffold = nextScaffold(S.scaffold, S.history);
      const q =
        parallelQuestion(S.question, seeded(S.seed * 17)) ||
        pickProblem()?.question;
      return q ? begin(q, S.skill) : paint();
    }
    if (t.dataset.e8Choice !== undefined) {
      const r = S.solver.submit(t.dataset.e8Choice);
      finishIfDone();
      return paint(r.ok ? "" : pick(r.feedback));
    }
    if (t.hasAttribute("data-e8-sv-check")) {
      const r = S.solver.submit(host.querySelector("#e8ml-sv").value);
      finishIfDone();
      return paint(r.ok ? "" : pick(r.feedback));
    }
    if (t.hasAttribute("data-e8-sv-hint"))
      return paint(pick(S.solver.hint().text));
    if (t.hasAttribute("data-e8-sv-reveal")) {
      const r = S.solver.reveal();
      finishIfDone();
      return paint(
        `${L("The answer to that step is: ", "La respuesta de ese paso es: ")}${pick(r.shown)}`,
      );
    }
  };
  host.addEventListener("click", host.__e8Handler);

  const first = pickProblem();
  if (first) begin(first.question, first.skill);
  else paint();
}
