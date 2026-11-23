// Vocabulary Academy — the routed view (view id "vocab-academy", /access-practice-lab/vocabulary-academy/…).
// Core-owned (SPEC §2, §10). Same interface as every lab view: render(ctx) → { title, html }, mount, unmount, and the
// event hooks. It resolves the path with router.js, loads the sub-view module lazily, hands it `va`, wraps it in the
// shared page chrome (band attribute, save status, disclaimer) and forwards events to the active sub-view.
//
//   va = { route:{path,q}, params, I, progress, supports(domain), save(p?), go(href), teacher, band, ctx }
import { BASE, html, raw, storage } from "../util.js";
import { i18nFor } from "../i18n.js";
import { DISCLAIMER, emptySupports } from "./contract.js";
import { SUBVIEW_LOADERS, CHROMELESS_VIEWS, resolve } from "./router.js";
import { vaHref } from "./data.js";
import { getSaveState, isTeacherMode, loadProgress, onSaveState, saveProgress } from "./store.js";
import { bandFor } from "./ui.js";

let active = null; // { name, mod, va, band }
let offSave = null; // the save-state subscription of the mounted page
let renderSeq = 0;
let supportsModule; // undefined = not tried yet, null = not published, else the module

async function ensureSupports() {
  if (supportsModule !== undefined) return supportsModule;
  try {
    supportsModule = await import("./supports.js");
  } catch {
    supportsModule = null;
  }
  return supportsModule;
}

// Stylesheets load on first use (the same approach as Book Studio): the shared tokens and the Core sheet always, then the
// sheet of the sub-view's owner. render() waits for them so the first paint is already styled. A sheet that does not
// exist yet (another owner has not published it) fails quietly after one request and the page uses the base styles.
const CORE_STYLES = ["vocab-academy-tokens.css", "vocab-academy-core.css"];
const VIEW_STYLES = {
  word: ["vocab-academy-activities.css"], // art.js pictures (vaa-*) are styled there
  grade: ["vocab-academy-units.css"],
  "lesson-home": ["vocab-academy-units.css", "vocab-academy-premium.css"],
  unit: ["vocab-academy-units.css", "vocab-academy-premium.css"],
  "unit-activity": ["vocab-academy-units.css", "vocab-academy-activities.css", "vocab-academy-games.css", "vocab-academy-premium.css"],
  lesson: ["vocab-academy-activities.css"],
  practice: ["vocab-academy-activities.css"],
  review: ["vocab-academy-activities.css"],
  games: ["vocab-academy-games.css", "vocab-academy-premium.css"],
  "word-study": ["vocab-academy-wordstudy.css"],
  teacher: ["vocab-academy-educator.css"],
  custom: ["vocab-academy-educator.css"],
  present: ["vocab-academy-educator.css"],
  print: ["vocab-academy-print.css"],
};
const sheets = new Map();
function ensureSheet(file) {
  if (sheets.has(file)) return sheets.get(file);
  const href = `${BASE}/${file}`;
  const existing = typeof document !== "undefined" && document.querySelector(`link[rel="stylesheet"][href^="${href}"]`);
  const ready = existing
    ? Promise.resolve()
    : new Promise((resolve) => {
        if (typeof document === "undefined") return resolve();
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.dataset.vaStyle = file;
        link.addEventListener("load", resolve, { once: true });
        link.addEventListener("error", resolve, { once: true });
        setTimeout(resolve, 3000);
        document.head.append(link);
      });
  sheets.set(file, ready);
  return ready;
}
const ensureStyles = (name) => Promise.all([...CORE_STYLES, ...(VIEW_STYLES[name] || [])].map(ensureSheet));

async function loadSub(name) {
  const loader = SUBVIEW_LOADERS[name];
  if (!loader) return null;
  try {
    return await loader();
  } catch (error) {
    // A module another agent has not published yet (or one that failed to load): show the "being built" panel.
    console.warn(`[vocab-academy] could not load the "${name}" view`, error);
    return null;
  }
}

export const saveText = (I, state) =>
  state === "saving"
    ? I.S("Saving…", "Guardando…")
    : state === "error-recoverable"
      ? I.S(
          "This device could not save your latest work. It is kept only in this tab. Export a Passport code before you close it.",
          "Este dispositivo no pudo guardar tu trabajo más reciente. Solo está en esta pestaña. Exporta un código de Pasaporte antes de cerrarla.",
        )
      : I.S("Your work is saved on this device.", "Tu trabajo se guarda en este dispositivo.");

const currentSaveState = () => (storage.isVolatile ? "error-recoverable" : getSaveState().state);

function messagePanel(I, { title, text, tone = "" }) {
  return html`<section class="va-panel va-empty ${tone}" aria-labelledby="vaMsgTitle">
    <h1 id="vaMsgTitle" tabindex="-1">${title}</h1>
    <p>${text}</p>
    <p>
      <a class="btn btn-primary va-btn" href="${vaHref()}"
        >${I.T("Go to My Vocabulary", "Ir a Mi vocabulario")}</a
      >
    </p>
  </section>`;
}

const builtPanel = (I, label) =>
  messagePanel(I, {
    title: I.S(`${label} is being built`, `${label} está en construcción`),
    text: I.T(
      "This part of Vocabulary Academy is not ready yet. Your words and progress are safe. Try another part of the Academy for now.",
      "Esta parte de la Academia de Vocabulario todavía no está lista. Tus palabras y tu progreso están a salvo. Prueba otra parte de la Academia por ahora.",
    ),
  });

const teacherPanel = (I) =>
  html`<section class="va-panel va-empty" aria-labelledby="vaMsgTitle">
    <h1 id="vaMsgTitle" tabindex="-1">
      ${I.T("This page is for teachers", "Esta página es para docentes")}
    </h1>
    <p>
      ${I.T("Open the Teacher Hub to use teacher tools. Students can keep learning from My Vocabulary.", "Abre el Centro docente para usar las herramientas para docentes. Los estudiantes pueden seguir aprendiendo desde Mi vocabulario.")}
    </p>
    <p class="va-actions">
      <a class="btn btn-primary va-btn" href="/access-teacher/"
        >${I.T("Open the Teacher Hub", "Abrir el Centro docente")}</a
      >
      <a class="btn va-btn" href="${vaHref()}"
        >${I.T("Go to My Vocabulary", "Ir a Mi vocabulario")}</a
      >
    </p>
  </section>`;

const VIEW_LABEL = {
  lesson: ["Lessons", "Lecciones"],
  practice: ["Games & Practice", "Juegos y práctica"],
  review: ["Review & Assess", "Repaso y evaluación"],
  games: ["Vocabulary Arcade", "Arcade de vocabulario"],
  "word-study": ["Word Study Lab", "Laboratorio de partes de palabras"],
  teacher: ["The teacher dashboard", "El panel docente"],
  custom: ["The custom lesson builder", "El creador de lecciones"],
  present: ["Presentation mode", "Modo de presentación"],
  print: ["Printable pages", "Páginas para imprimir"],
  family: ["The family view", "La vista para la familia"],
};

function makeVa(ctx, I, route, target, progress, supports) {
  const q = route.q || {};
  return {
    route: { path: route.path, q },
    params: target.params,
    I,
    progress,
    ctx,
    teacher: isTeacherMode(),
    supports: (domain = "reading") => {
      try {
        return supports?.getSupportFlags ? supports.getSupportFlags(domain) : emptySupports();
      } catch {
        return emptySupports();
      }
    },
    save: (p) => saveProgress(p || progress),
    go: (href) => ctx.navigate(href),
  };
}

export async function render(ctx) {
  const mine = ++renderSeq;
  const I = i18nFor(ctx);
  const route = {
    path: Array.isArray(ctx.route?.path) ? ctx.route.path : [],
    q: ctx.route?.q || {},
  };
  const target = resolve(route.path);
  const progress = loadProgress();
  const [supports] = await Promise.all([ensureSupports(), ensureStyles(target.name)]);
  const va = makeVa(ctx, I, route, target, progress, supports);
  const band = bandFor(target.params.grade || progress.grade, ctx.band);

  let mod = null;
  let out;
  if (target.name === "notfound") {
    out = {
      title: I.S("Page not found", "Página no encontrada"),
      html: messagePanel(I, {
        title: I.T("We could not find that page", "No pudimos encontrar esa página"),
        text: I.T(
          "Check the link, or start from My Vocabulary.",
          "Revisa el enlace o empieza desde Mi vocabulario.",
        ),
      }),
    };
  } else if (target.teacherOnly && !va.teacher) {
    out = { title: I.S("For teachers", "Para docentes"), html: teacherPanel(I) };
  } else {
    mod = await loadSub(target.name);
    if (mod?.render) {
      try {
        out = await mod.render(ctx, va);
      } catch (error) {
        console.error(`[vocab-academy] the "${target.name}" view failed`, error);
        mod = null;
      }
    }
    if (!out) {
      const label = I.S(...(VIEW_LABEL[target.name] || ["This page", "Esta página"]));
      out = { title: label, html: builtPanel(I, label) };
    }
  }

  const chrome = !CHROMELESS_VIEWS.has(target.name) && target.name !== "notfound";
  const state = currentSaveState();
  const page = html`<div
    class="va"
    data-va-view="${target.name}"
    ${band ? raw(`data-va-band="${band}"`) : ""}
  >
    ${out.html}
    ${
      chrome
        ? html`<footer class="va-foot">
            <p class="va-save" id="vaSave" role="status" aria-live="polite" data-state="${state}">
              ${saveText(I, state)}
            </p>
            <p class="va-disclaimer fine">${I.T(DISCLAIMER.en, DISCLAIMER.es)}</p>
          </footer>`
        : ""
    }
  </div>`;
  if (mine === renderSeq) active = { name: target.name, mod, va, band };
  return { title: out.title, html: page };
}

function setSaveStatus(I, state) {
  const node = document.getElementById("vaSave");
  if (!node) return;
  node.dataset.state = state;
  node.textContent = saveText(I, state);
}

export function mount(root, ctx) {
  const view = active;
  if (!view) return;
  offSave?.();
  const host = document.getElementById("app");
  if (host && view.band) host.dataset.vaBand = view.band;
  else host?.removeAttribute("data-va-band");
  offSave = onSaveState(({ state }) =>
    setSaveStatus(view.va.I, storage.isVolatile ? "error-recoverable" : state),
  );
  view.mod?.mount?.(root, ctx, view.va);
}

export function unmount() {
  const view = active;
  active = null;
  offSave?.();
  offSave = null;
  try {
    view?.mod?.unmount?.(view.va);
  } finally {
    document.getElementById("app")?.removeAttribute("data-va-band");
  }
}

// Events: main.js calls these synchronously on every click/change/input/key; the active sub-view decides.
export const onClick = (e, ctx) => active?.mod?.onClick?.(e, ctx, active.va);
export const onChange = (e, ctx) => active?.mod?.onChange?.(e, ctx, active.va);
export const onInput = (e, ctx) => active?.mod?.onInput?.(e, ctx, active.va);
export const onKey = (e, ctx) => active?.mod?.onKey?.(e, ctx, active.va);
