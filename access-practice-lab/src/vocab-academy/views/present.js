// Vocabulary Academy — presentation mode (/vocabulary-academy/present/<G>/<N>, or ?cu=<custom unit id>).
// One word at a time in large type on the projector: picture and word, then the meaning, an example with "say it together",
// then a turn-and-talk. Arrow keys, Space, PageDown/PageUp or a presenter clicker move through it; N opens the teacher notes
// (rendered only on a teacher's device, never in a student's page); F toggles full screen; Esc leaves. It runs from the
// unit file once loaded (data.js keeps it in memory) and needs no network afterwards.
import { html, toHtml } from "../../util.js";
import { getUnit, isCustomId, lessonHref, vaHref } from "../data.js";
import { loadProgress } from "../store.js";
import { posName } from "../ui.js";
import { sayButton, visualHTML } from "../art.js";

/** The flat list of steps a unit presents: title, then four reveal stages per word, then the word wall. Pure. */
export function buildSteps(unit) {
  const steps = [{ kind: "title" }];
  unit.words.forEach((_, i) => {
    for (let stage = 0; stage < 4; stage += 1) steps.push({ kind: "word", i, stage });
  });
  steps.push({ kind: "wall" });
  return steps;
}
/** Turn-and-talk prompt for word i: the unit's own prompts (teacher's on a teacher device, else the student-facing ones), else a frame. */
export function talkPrompt(unit, i, { teacher = false } = {}) {
  const list =
    (teacher && unit.teacher?.discuss?.length ? unit.teacher.discuss : unit.produce?.discuss) || [];
  if (list.length) return list[i % list.length];
  return (
    unit.words[i].frame ||
    `Turn to a partner. Use the word "${unit.words[i].hw}" in a sentence about your day.`
  );
}

const P = {
  key: "",
  step: 0,
  notes: false,
  unit: null,
  steps: [],
  exit: "",
  teacher: false,
  I: null,
};
const stepOf = (n) => Math.max(0, Math.min(P.steps.length - 1, n));

const stageHTML = (I, unit, step, teacher) => {
  if (step.kind === "title")
    return html`<div class="vat-p-title">
      <p class="vat-p-eyebrow">${unit.theme || ""}</p>
      <h1 id="vatPH" tabindex="-1">${unit.title}</h1>
      <ul class="vat-p-obj" lang="en">
        ${(unit.objectives || []).map((o) => html`<li>${o}</li>`)}
      </ul>
      <p class="vat-p-hint">
        ${I.T("Press the right arrow or Space to begin", "Presiona la flecha derecha o la barra espaciadora para empezar")}
      </p>
    </div>`;
  if (step.kind === "wall")
    return html`<div class="vat-p-wall">
      <h1 id="vatPH" tabindex="-1">${I.T("Word wall", "Muro de palabras")}</h1>
      <ul class="vat-p-grid">
        ${unit.words.map((w) => html`<li lang="en"><strong>${w.hw}</strong></li>`)}
      </ul>
      <p class="vat-p-hint">
        ${I.T("Choose a word. Say what it means and use it in a sentence.", "Elige una palabra. Di qué significa y úsala en una oración.")}
      </p>
    </div>`;
  const w = unit.words[step.i];
  const s = step.stage;
  return html`<div class="vat-p-word">
    <div class="vat-p-pic">${visualHTML(w, { size: "lg", I })}</div>
    <div class="vat-p-body">
      <h1 id="vatPH" tabindex="-1" lang="en" class="vat-p-hw">${w.hw}</h1>
      <p class="vat-p-meta">
        ${w.pron ? html`<span lang="en">${w.pron}</span> · ` : ""}${posName(I, w.pos)}
        ${sayButton(I, w.hw, w.hw)}
      </p>
      ${s >= 1 ? html`<p class="vat-p-def" lang="en"><span class="vat-sr">${I.S("Meaning", "Significado")}: </span>${w.def}</p>` : ""}
      ${
        s >= 2
          ? html`<p class="vat-p-ex" lang="en">
                <span class="vat-sr">${I.S("Example", "Ejemplo")}: </span>${w.ex}
              </p>
              <p class="vat-p-say">
                <strong>${I.T("Say it together", "Díganlo juntos")}:</strong>
                <span lang="en">${w.hw}</span> ${sayButton(I, w.ex, w.hw)}
              </p>`
          : ""
      }
      ${s >= 3 ? html`<p class="vat-p-talk"><strong>${I.T("Turn and talk", "Conversa con tu compañero")}:</strong> <span lang="en">${talkPrompt(unit, step.i, { teacher })}</span></p>` : ""}
    </div>
  </div>`;
};

const notesHTML = (I, unit, step) => {
  const t = unit.teacher || {};
  const w = step.kind === "word" ? unit.words[step.i] : null;
  const body = w ? t.notes?.[w.id] : step.kind === "title" ? t.overview : t.reviewAdvice;
  return html`<h2>${I.T("Teacher notes", "Notas docentes")}</h2>
    ${body ? html`<p lang="en">${body}</p>` : html`<p>${I.T("No note for this step.", "No hay nota para este paso.")}</p>`}
    ${
      step.kind === "title" && t.model
        ? html`<h3>${I.T("Modeling script", "Guion para modelar")}</h3>
            <p lang="en">${t.model}</p>`
        : ""
    }
    ${
      step.kind === "wall" && (t.misconceptions || []).length
        ? html`<h3>${I.T("Watch for", "Ten en cuenta")}</h3>
            <ul lang="en">
              ${t.misconceptions.map((m) => html`<li>${m}</li>`)}
            </ul>`
        : ""
    }`;
};

const label = (I, step, n, total) => {
  const where =
    step.kind === "word"
      ? `${P.unit.words[step.i].hw}, ${I.S("part", "parte")} ${step.stage + 1} ${I.S("of 4", "de 4")}`
      : step.kind === "title"
        ? I.S("Title", "Título")
        : I.S("Word wall", "Muro de palabras");
  return `${I.S("Slide", "Diapositiva")} ${n + 1} ${I.S("of", "de")} ${total}: ${where}`;
};

function draw(announceIt = true) {
  const stage = document.getElementById("vatStage");
  if (!stage || !P.unit) return;
  const I = P.I;
  const step = P.steps[P.step];
  stage.innerHTML = toHtml(stageHTML(I, P.unit, step, P.teacher));
  const count = document.getElementById("vatPCount");
  if (count) count.textContent = `${P.step + 1} / ${P.steps.length}`;
  const bar = document.getElementById("vatPBar");
  if (bar) bar.value = P.step;
  if (P.teacher) {
    const n = document.getElementById("vatNotes");
    if (n) {
      n.innerHTML = toHtml(notesHTML(I, P.unit, step));
      n.hidden = !P.notes;
    }
    document.getElementById("vatNotesBtn")?.setAttribute("aria-expanded", String(P.notes));
  }
  const live = document.getElementById("vatPLive");
  if (live && announceIt) live.textContent = label(I, step, P.step, P.steps.length);
  try {
    const u = new URL(location.href);
    u.searchParams.set("s", String(P.step));
    history.replaceState(history.state, "", u);
  } catch {
    // no history API: the slide still changes
  }
}
const go = (n) => {
  const next = stepOf(n);
  if (next === P.step) return;
  P.step = next;
  draw();
};

export async function render(ctx, va) {
  const { I } = va;
  const { grade, n } = va.params;
  // A custom unit arrives as /present/<G>/cu_<slug> (n = "cu.<slug>"); the older ?cu=<id> form still works.
  const cu = isCustomId(n) ? n : va.route.q?.cu ? String(va.route.q.cu) : "";
  const custom = cu ? loadProgress().custom?.[cu] : null;
  const unit = cu ? (custom?.custom === true ? custom : null) : await getUnit(`g${grade}-u${String(n).padStart(2, "0")}`);
  const exit = cu ? `${vaHref("teacher")}?custom=${encodeURIComponent(cu)}` : lessonHref(grade, n);
  if (!unit || !unit.words?.length)
    return {
      title: I.S("Presentation", "Presentación"),
      html: html`<section class="va-panel va-empty vat-p-missing">
        <h1 id="vatPH" tabindex="-1">
          ${I.T("This lesson is not available to present", "Esta lección no está disponible para presentar")}
        </h1>
        <p>
          ${I.T("It is not published yet, or it could not be loaded. Check your connection and try again.", "Todavía no está publicada o no se pudo cargar. Revisa tu conexión e inténtalo de nuevo.")}
        </p>
        <p>
          <a class="btn btn-primary va-btn" href="${vaHref("grade", grade)}"
            >${I.T("Back to the grade", "Volver al grado")}</a
          >
        </p>
      </section>`,
    };
  const key = `${cu || unit.id}`;
  const first = P.key !== key;
  Object.assign(P, { key, unit, I, exit, teacher: va.teacher, steps: buildSteps(unit) });
  if (first) {
    const s = Number(va.route.q?.s);
    P.step = Number.isInteger(s) ? stepOf(s) : 0;
    P.notes = false;
  }
  return {
    title: unit.title,
    html: html`<div
      class="vat-present"
      role="region"
      aria-label="${I.S("Presentation", "Presentación")}: ${unit.title}"
    >
      <div class="vat-p-bar">
        <a class="btn va-btn" href="${exit}" data-vat-exit
          >${I.T("Exit presentation", "Salir de la presentación")}</a
        >
        <span class="vat-p-count" id="vatPCount"></span>
        <progress
          id="vatPBar"
          class="vat-p-progress"
          max="${P.steps.length - 1}"
          value="0"
          aria-label="${I.S("Progress through the unit", "Avance en la unidad")}"
        ></progress>
        <button type="button" class="btn va-btn" data-vat-p="prev">${I.T("Back", "Atrás")}</button>
        <button type="button" class="btn btn-primary va-btn" data-vat-p="next">
          ${I.T("Next", "Siguiente")}
        </button>
        ${va.teacher ? html`<button type="button" class="btn va-btn" id="vatNotesBtn" data-vat-p="notes" aria-expanded="false" aria-controls="vatNotes">${I.T("Notes", "Notas")}</button>` : ""}
        <button type="button" class="btn va-btn" data-vat-p="full">
          ${I.T("Full screen", "Pantalla completa")}
        </button>
      </div>
      <div id="vatStage" class="vat-p-stage" tabindex="-1"></div>
      ${va.teacher ? html`<aside id="vatNotes" class="vat-p-notes" hidden aria-label="${I.S("Teacher notes", "Notas docentes")}"></aside>` : ""}
      <p id="vatPLive" class="vat-sr" role="status" aria-live="polite"></p>
    </div>`,
  };
}

export function mount() {
  document.body.classList.add("vat-presenting");
  draw(false);
  document.getElementById("vatStage")?.focus({ preventScroll: true });
}
export function unmount() {
  document.body.classList.remove("vat-presenting");
  P.unit = null;
  P.key = "";
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
}

const toggleFull = () => {
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  else document.documentElement.requestFullscreen?.().catch(() => {});
};

export function onClick(e) {
  const b = e.target.closest?.("[data-vat-p]");
  if (!b || !P.unit) return false;
  const act = b.dataset.vatP;
  if (act === "next") go(P.step + 1);
  else if (act === "prev") go(P.step - 1);
  else if (act === "notes" && P.teacher) {
    P.notes = !P.notes;
    draw(false);
  } else if (act === "full") toggleFull();
  else return false;
  return true;
}

const NEXT = new Set(["ArrowRight", "ArrowDown", "PageDown", ".", " ", "Enter"]);
const PREV = new Set(["ArrowLeft", "ArrowUp", "PageUp", "Backspace", ","]);
export function onKey(e, ctx, va) {
  if (!P.unit || e.ctrlKey || e.metaKey || e.altKey) return false;
  const tag = e.target?.tagName;
  const onControl = ["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA", "SUMMARY"].includes(tag);
  const key = e.key;
  if ((key === " " || key === "Enter") && onControl) return false;
  let handled = true;
  if (NEXT.has(key)) go(P.step + 1);
  else if (PREV.has(key)) go(P.step - 1);
  else if (key === "Home") go(0);
  else if (key === "End") go(P.steps.length - 1);
  else if ((key === "n" || key === "N") && P.teacher) {
    P.notes = !P.notes;
    draw(false);
  } else if (key === "f" || key === "F") toggleFull();
  else if (key === "Escape") va.go(P.exit);
  else handled = false;
  if (handled) e.preventDefault();
  return handled;
}
