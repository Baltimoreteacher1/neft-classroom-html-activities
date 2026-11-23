// Activity Studio (/activity-studio, /activity-studio/new, /activity-studio/mine, /activity-studio/<id>): a teacher
// builds an interactive activity, worksheet, learning game or quick check from one shared content model.
// Choose what to make -> add what students should learn -> preview, adjust and share. Everything else is automatic.
// The screens are built by src/studio/ (plain DOM, no innerHTML) and mounted after the shell renders; the lab only
// supplies the route, the page frame, the language and the breadcrumb. Drafts live on this device and, if the teacher
// saves to a class, in that class (src/studio/drafts.js).
import { crumbsHTML } from "../components.js";
import { i18nFor, langMode } from "../i18n.js";
import { vocabSample } from "../studio/core/fixtures.js";
import { SUBJECTS } from "../studio/core/curriculum.js";
import { ID_RE, getLocal, knownClasses, newActivityId, saveLocal, siteKey } from "../studio/drafts.js";
import { KIND_IDS, chooseScreen, contentScreen } from "../studio/editor/create.js";
import { mountEditor } from "../studio/editor/shell.js";
import { say } from "../studio/editor/ui.js";
import { mountLibrary } from "../studio/library.js";
import { BASE, html, storage } from "../util.js";

const HOME = `${BASE}/activity-studio`;
const GOTO = { mine: `${HOME}/mine`, new: `${HOME}/new`, edit: (id) => `${HOME}/${id}` };
const WELCOME_KEY = "accessPracticeLab:v1:studio-welcome";

let current = null; // { destroy }
let wizard = null; // create-flow state, kept while the teacher moves between steps

const freshWizard = (q = {}) => ({
  kind: KIND_IDS.includes(q.kind) ? q.kind : "",
  mode: q.unit ? "lesson" : "content",
  text: "",
  context: {
    grade: q.grade || "",
    subject: SUBJECTS.includes(q.subject) ? q.subject : "",
    unitId: q.unit || "",
  },
  units: null,
  detail: null,
  needs: [],
});

async function aiAvailable(fetchImpl = (...a) => fetch(...a)) {
  try {
    const res = await fetchImpl("/api/studio/ai");
    return res.ok && (await res.json()).available === true;
  } catch {
    return false;
  }
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const title = I.S("Activity Studio", "Estudio de actividades");
  const { id } = ctx.route;
  return {
    title,
    html: html`${crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/`], [title, id ? HOME : null], ...(id === "mine" ? [[I.S("My activities", "Mis actividades"), null]] : [])])}
      <div
        class="st-root"
        id="st-root"
        data-studio="${id === "mine" || ID_RE.test(id) ? id : "create"}"
      >
        <p class="st-loading" role="status">${I.S("Loading…", "Cargando…")}</p>
      </div>`,
  };
}

export async function mount(rootEl, ctx) {
  const host = rootEl.querySelector("#st-root");
  if (!host) return;
  const I = i18nFor(ctx);
  const S = I.S;
  const lang = langMode(ctx.prefs);
  const { id, q = {} } = ctx.route;
  current?.destroy?.();
  current = null;
  const nav = (path) => ctx.navigate(path);

  if (ID_RE.test(id)) {
    const entry = getLocal(id);
    if (!entry) {
      host.replaceChildren(
        Object.assign(document.createElement("p"), {
          className: "st-empty",
          textContent: S(
            "That activity is not on this device. Open My activities to find it.",
            "Esa actividad no está en este dispositivo. Abra Mis actividades para encontrarla.",
          ),
        }),
      );
      return;
    }
    current = mountEditor(host, { activity: entry.activity, S, lang, goTo: GOTO });
    return;
  }
  if (id === "mine") {
    current = {
      destroy() {},
      ...mountLibrary(host, {
        S,
        goTo: GOTO,
        onNew: () => nav(GOTO.new),
        onOpen: (aid) => nav(GOTO.edit(aid)),
        onPreview: (aid) => nav(GOTO.edit(aid)),
        onShare: (aid) => nav(GOTO.edit(aid)),
      }),
    };
    return;
  }
  if (id === "sample") {
    const sample = { ...vocabSample(), id: newActivityId(), rev: 0 };
    saveLocal(sample, null);
    nav(GOTO.edit(sample.id));
    return;
  }

  // Create flow. A lesson page can open it with ?kind=&grade=&subject=&unit= and the choices are already made.
  const sig = JSON.stringify([id, q.kind, q.unit, q.grade, q.subject]);
  if (!wizard || wizard.sig !== sig) wizard = { ...freshWizard(q), sig };
  wizard.ai = (await aiAvailable()) ? aiCall : null;
  const available = Boolean(wizard.ai);

  const redraw = () => {
    host.replaceChildren(
      wizard.kind
        ? contentScreen({
            S,
            state: wizard,
            redraw,
            aiAvailable: available,
            onBack: () => ((wizard.kind = ""), (wizard.needs = []), redraw()),
            onCreate,
          })
        : chooseScreen({
            S,
            onPick: (k) => (
              (wizard.kind = k),
              (wizard.needs = []),
              redraw(),
              host.querySelector("h1")?.focus()
            ),
            onSample: () => nav(`${HOME}/sample`),
            welcome: storage.get(WELCOME_KEY) !== "1",
            onDismissWelcome: () => (storage.set(WELCOME_KEY, "1"), redraw()),
          }),
    );
  };
  function onCreate(res) {
    const activity = {
      ...res.activity,
      id: newActivityId(),
      rev: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveLocal(activity, null);
    wizard = null;
    say(
      S(
        "Your activity is ready. Review it, change anything, then share.",
        "Su actividad está lista. Revísela, cambie lo que quiera y luego comparta.",
      ),
    );
    nav(GOTO.edit(activity.id));
  }
  redraw();
}

export function unmount() {
  current?.destroy?.();
  current = null;
}

/** The optional drafting helper: used only when the server reports a model is configured. */
async function aiCall({ prompt, kind, context }) {
  const klass = knownClasses()[0];
  if (!klass && !siteKey()) return { ok: false, error: "unauthorized" };
  const headers = { "content-type": "application/json", ...(siteKey() ? { "x-teacher-key": siteKey() } : {}), ...(klass?.passcode ? { "x-class-teacher": klass.passcode } : {}) };
  const ctx = { grade: context.grade, subject: context.subject, unitTitle: context.unitTitle, objective: context.objective };
  const res = await fetch("/api/studio/ai", { method: "POST", headers, body: JSON.stringify({ code: klass?.code, mode: "draft", prompt, kind, context: ctx }) });
  return res.json().catch(() => ({ ok: false, error: "failed" }));
}
