// Vocabulary Academy — the lesson player. One session per open lesson: it builds the steps (steps.js), owns the saved
// state (progress.units[lessonId].lessons[letter].{pos, steps}), draws the progress rail and Back/Next,
// and hands each step to its kind module (kinds/*.js) through the session object `S`.
//
// Saving is truthful: every step change and every finished question writes through setUnitStage + va.save, and the
// save chip shows what the store reports (saved / saving / this tab only). Back and Next are plain buttons and links:
// a keyboard or screen-reader user can always leave a step, skip it, or return to the unit.
import { announce, html, toHtml } from "../../util.js";
import { LESSONS, bandOfGrade, sectionTitle, unitId as makeUnitId } from "../contract.js";
import { crumbs, gradeName, lessonLabel, lessonTrail } from "../ui.js";
import { loadDeps } from "./deps.js";
import { GOALS, buildSteps } from "./steps.js";
import { stopSpeech, tx, txS } from "./ui.js";
import * as card from "./kinds/card.js";
import * as itemsKind from "./kinds/items.js";
import * as reader from "./kinds/reader.js";
import * as sort from "./kinds/sort.js";
import * as study from "./kinds/study.js";
import * as web from "./kinds/web.js";
import * as write from "./kinds/write.js";
import * as assess from "./kinds/assess.js";

export const KINDS = {
  card,
  items: itemsKind,
  reader,
  sort,
  study,
  web,
  write,
  revise: write,
  assess,
};
const HEAVY = new Set(["wordBank", "model", "readAloud", "chunked"]);
const SAVE_DELAY = 500;
const isoNow = () => new Date().toISOString();

/** "Exercise 6A: Finding Meanings" / "Word List" / "Lesson Review" for this lesson. */
const lessonName = (I, letter, n = "") => {
  const [en, es] = sectionTitle(letter, n);
  return en ? I.T(en, es) : "";
};

async function activeVariantFor(unit) {
  try {
    const { activeVariant } = await import("../supports.js");
    return activeVariant({
      pathname: `${globalThis.location?.pathname || ""}`.includes("/lesson/")
        ? globalThis.location.pathname
        : `/grade/${unit.grade}/lesson/${unit.n}`,
    });
  } catch {
    return null;
  }
}

/** Open a lesson: resolves deps and the unit, restores saved state. Returns { S } or { error }. */
export async function openLesson({ grade, n, letter }, va) {
  const deps = await loadDeps();
  if (!deps.ready) return { error: "deps", deps };
  const full = await deps.data.getUnit(makeUnitId(grade, n));
  if (!full || !Array.isArray(full.words) || !full.words.length) return { error: "unit", deps };
  // A differentiated assignment (educator/assign.js, supports.js encodeVariant) can name a smaller word set (?w=1.3.5).
  const variant = await activeVariantFor(full);
  const unit = variant?.words?.length
    ? { ...full, words: (await import("../supports.js")).variantWords(full.words, variant) }
    : full;
  if (!unit.words.length) return { error: "unit", deps };
  const progress = va.progress;
  const lessonCount = deps.data.getUnitsOfGrade
    ? (await deps.data.getUnitsOfGrade(grade).catch(() => [])).length
    : 0;
  const rec = progress.units?.[unit.id]?.lessons?.[letter] || {};
  const S = {
    I: va.I,
    va,
    deps,
    unit,
    letter,
    grade: String(unit.grade),
    lessonCount,
    key: unit.custom ? unit.id : unit.n,
    band: bandOfGrade(String(unit.grade)),
    early: bandOfGrade(String(unit.grade)) === "early",
    progress,
    sup: va.supports("reading"),
    supW: va.supports("writing"),
    supS: va.supports("speaking"),
    supL: va.supports("listening"),
    state: rec.steps && typeof rec.steps === "object" ? rec.steps : {},
    idx: Number.isInteger(rec.pos) ? rec.pos : 0,
    wasDone: Boolean(rec.done),
    steps: [],
    cleanups: [],
    used: new Set(),
    finished: false,
    saveTimer: 0,
    root: null,
  };
  attachMethods(S);
  S.rebuild();
  S.idx = rec.done ? 0 : Math.max(0, Math.min(S.idx, S.steps.length - 1));
  return { S };
}

function attachMethods(S) {
  const { unit, letter, deps, va } = S;
  S.entryOf = (id) => deps.model.wordEntry(S.progress, id);
  S.rebuild = () => {
    S.steps = buildSteps(letter, unit);
  };
  S.words = () => unit.words;
  S.word = (id) => S.words().find((w) => w.id === id) || null;
  S.stepData = (id) => (S.state[id] ||= {});
  S.isDone = (id) => Boolean(S.state[id]?.done || S.state[id]?.skipped);
  S.allDone = () => S.steps.every((s) => S.isDone(s.id));
  S.announce = (msg) => announce(msg, { toast: false });
  S.on = (el, type, fn) => {
    el.addEventListener(type, fn);
    S.cleanups.push(() => el.removeEventListener(type, fn));
  };
  S.useSupport = (key) => S.used.add(key);

  S.persist = () => {
    clearTimeout(S.saveTimer);
    S.saveTimer = 0;
    try {
      deps.model.setUnitStage(S.progress, unit.id, letter, {
        pos: S.idx,
        steps: S.state,
      });
    } catch (error) {
      console.warn("[vocab-academy] could not record lesson state", error);
    }
    return va.save(S.progress);
  };
  S.save = () => {
    clearTimeout(S.saveTimer);
    S.saveTimer = setTimeout(S.persist, SAVE_DELAY);
    paintSave("saving");
  };
  S.markSeen = (word) => {
    const d = S.stepData("_seen");
    if ((d.ids ||= []).includes(word.id)) return;
    d.ids.push(word.id);
    try {
      deps.model.markSeen(S.progress, word.id, { unit: unit.id, grade: S.grade });
    } catch (error) {
      console.warn("[vocab-academy] markSeen failed", error);
    }
    S.save();
  };
  /** Supports actually used on this answer that count at half weight (SPEC §4); the set clears per step. */
  S.supUsed = (extra = []) =>
    [...new Set([...S.used, ...extra])].filter(
      (k) => HEAVY.has(k) || k === "frames" || k === "starters",
    );
  S.evidence = ({ wordId, dim, ok, type, unitId: from, sup }) => {
    if (!wordId) return;
    try {
      deps.model.recordResult(S.progress, {
        wordId,
        dim,
        ok: Boolean(ok),
        sup: sup || S.supUsed(),
        type: type || `lesson-${letter}`,
        unit: from || unit.id,
        grade: S.grade,
      });
    } catch (error) {
      console.warn("[vocab-academy] could not record evidence", error);
    }
    S.save();
  };
  S.markDone = (stepId) => {
    const d = S.stepData(stepId);
    const was = Boolean(d.done);
    d.done = true;
    d.at ||= isoNow();
    S.persist();
    if (!was) paintChrome();
  };
  S.drafts = (entry) => {
    const list = Array.isArray(S.progress.drafts) ? S.progress.drafts : [];
    const rest = list.filter((x) => x.id !== entry.id);
    S.progress.drafts = [...rest, { ...entry, unitId: unit.id, at: isoNow() }].slice(-40);
  };
  S.goto = (i) => {
    if (i < 0 || i >= S.steps.length) return;
    S.finished = false;
    S.idx = i;
    paintStep(S, true);
  };
  S.next = () => {
    if (S.idx < S.steps.length - 1) S.goto(S.idx + 1);
    else finish(S);
  };
  S.back = () => S.goto(S.idx - 1);
}

// ── chrome ───────────────────────────────────────────────────────────────────────────────────────────────────
const saveWords = (I, state) =>
  state === "saving"
    ? I.T("Saving…", "Guardando…")
    : state === "error-recoverable"
      ? I.T(
          "Not saved: this device could not store your work. It stays in this tab only.",
          "No guardado: este dispositivo no pudo guardar tu trabajo. Solo queda en esta pestaña.",
        )
      : I.T("Saved on this device", "Guardado en este dispositivo");

const saveInner = (I, state) =>
  html`<span aria-hidden="true">${state === "error-recoverable" ? "⚠" : state === "saving" ? "…" : "✓"}</span> ${saveWords(I, state)}`;
const saveChipHTML = (I, state) =>
  html`<p class="val-save" data-val-save data-state="${state}" role="status" aria-live="polite">${saveInner(I, state)}</p>`;

let liveState = "saved";
function paintSave(state) {
  liveState = state;
  const node = typeof document !== "undefined" && document.querySelector("[data-val-save]");
  if (!node || !current) return;
  node.dataset.state = state;
  node.innerHTML = toHtml(saveInner(current.I, state));
}
let current = null;

function railHTML(S) {
  const { I, steps, idx } = S;
  const doneCount = steps.filter((s) => S.isDone(s.id)).length;
  return html`<div class="val-rail" data-val-rail>
    <p class="val-rail-line">
      <strong
        >${I.T("Step", "Paso")} ${S.finished ? steps.length : idx + 1} ${I.T("of", "de")}
        ${steps.length}</strong
      >
      <span class="val-rail-done">· ${doneCount} ${I.T("finished", "terminados")}</span>
    </p>
    <div
      class="val-bar"
      role="progressbar"
      aria-label="${I.S("Lesson progress", "Progreso de la lección")}"
      aria-valuemin="0"
      aria-valuemax="${steps.length}"
      aria-valuenow="${doneCount}"
    >
      <span
        style="width:${steps.length ? Math.round((doneCount / steps.length) * 100) : 0}%"
      ></span>
    </div>
    <details class="val-steps-menu" ${S.menuOpen ? "open" : ""}>
      <summary>${I.T("All steps", "Todos los pasos")}</summary>
      <ol class="val-steps-list">
        ${steps.map(
          (s, i) =>
            html`<li>
              <button
                type="button"
                class="val-step-btn"
                data-val-goto="${i}"
                ${i === idx && !S.finished ? html`aria-current="step"` : ""}
              >
                <span class="val-step-n" aria-hidden="true">${S.isDone(s.id) ? "✓" : i + 1}</span>
                <span
                  >${tx(I, s.title)}${S.isDone(s.id) ? html` <span class="val-sr">(${I.T("finished", "terminado")})</span>` : ""}</span
                >
              </button>
            </li>`,
        )}
      </ol>
    </details>
  </div>`;
}

function navHTML(S) {
  const { I, idx, steps } = S;
  const last = idx === steps.length - 1;
  return html`<div class="val-nav" data-val-nav>
    ${
      idx === 0 && !S.finished
        ? html`<a class="btn val-btn" href="${S.deps.data.lessonHref(S.grade, S.key)}"
            >${I.T("Back to the lesson", "Volver a la lección")}</a
          >`
        : html`<button type="button" class="btn val-btn" data-val-back>
            ${S.finished ? I.T("Back to the last step", "Volver al último paso") : I.T("Back", "Atrás")}
          </button>`
    }
    ${S.finished ? "" : html`<button type="button" class="btn btn-primary val-btn" data-val-next>${last ? I.T("Finish this section", "Terminar esta sección") : I.T("Next", "Siguiente")}</button>`}
  </div>`;
}

function paintChrome() {
  const S = current;
  if (!S?.root) return;
  const menu = S.root.querySelector(".val-steps-menu");
  if (menu) S.menuOpen = menu.open;
  const rail = S.root.querySelector("[data-val-rail-host]");
  const nav = S.root.querySelector("[data-val-nav-host]");
  if (rail) rail.innerHTML = toHtml(railHTML(S));
  if (nav) nav.innerHTML = toHtml(navHTML(S));
}

function clearStep(S) {
  for (const fn of S.cleanups.splice(0)) {
    try {
      fn();
    } catch {
      /* a listener that is already gone */
    }
  }
  stopSpeech();
  S.used.clear();
}

/** Draw the current step into the body and mount its kind. `focus` moves focus to the step heading. */
export function paintStep(S, focus = false) {
  const host = S.root?.querySelector("[data-val-body]");
  if (!host) return;
  clearStep(S);
  const step = S.steps[S.idx];
  const kind = KINDS[step.kind];
  const title = tx(S.I, step.title);
  host.innerHTML = toHtml(
    html`<section class="val-step" data-val-step="${step.id}" aria-labelledby="val-step-title">
      <h2 id="val-step-title" class="val-step-title" tabindex="-1">
        ${S.I.T("Step", "Paso")} ${S.idx + 1} ${S.I.T("of", "de")} ${S.steps.length}: ${title}
      </h2>
      <div data-val-kind="${step.kind}">
        ${kind ? kind.htmlOf(S, step) : html`<p>${S.I.T("This step is not available.", "Este paso no está disponible.")}</p>`}
      </div>
    </section>`,
  );
  const inner = host.querySelector("[data-val-kind]");
  try {
    kind?.mount?.(S, step, inner);
  } catch (error) {
    console.error(`[vocab-academy] step "${step.id}" failed to mount`, error);
    inner.innerHTML = toHtml(
      html`<p class="val-note" role="alert">
        ${S.I.T("This step could not start. Use Next to keep going; your place is saved.", "Este paso no pudo iniciar. Usa Siguiente para continuar; tu lugar está guardado.")}
      </p>`,
    );
  }
  S.persist();
  paintChrome();
  if (focus) {
    const h = host.querySelector("#val-step-title");
    h?.focus({ preventScroll: true });
    h?.scrollIntoView?.({ block: "start", behavior: "auto" });
    S.announce(
      `${S.I.S("Step", "Paso")} ${S.idx + 1} ${S.I.S("of", "de")} ${S.steps.length}: ${txS(S.I, step.title)}`,
    );
  }
}

function finish(S) {
  const { I } = S;
  const host = S.root.querySelector("[data-val-body]");
  const open = S.steps.map((s, i) => ({ s, i })).filter(({ s }) => !S.isDone(s.id));
  clearStep(S);
  S.finished = true;
  const nextLetter = LESSONS[LESSONS.findIndex((l) => l.id === S.letter) + 1];
  const { lessonHref } = S.deps.data;
  let doneNow = false;
  if (!open.length) {
    try {
      S.deps.model.setUnitStage(S.progress, S.unit.id, S.letter, {
        done: true,
        pos: S.idx,
        steps: S.state,
      });
    } catch (error) {
      console.warn("[vocab-academy] could not mark the lesson done", error);
    }
    S.va.save(S.progress);
    doneNow = true;
  }
  host.innerHTML = toHtml(
    doneNow
      ? html`<section class="val-step val-finish" aria-labelledby="val-step-title">
          <h2 id="val-step-title" class="val-step-title" tabindex="-1">
            ${I.T("Section finished", "Sección terminada")}
          </h2>
          <p>
            ${I.T(`You finished ${sectionTitle(S.letter, S.key)[0]}. Your work is saved. The words you practiced will come back in your review.`, `Terminaste ${sectionTitle(S.letter, S.key)[1]}. Tu trabajo está guardado. Las palabras que practicaste volverán en tu repaso.`)}
          </p>
          <p class="val-actions">
            ${nextLetter ? html`<a class="btn btn-primary val-btn" href="${lessonHref(S.grade, S.key, nextLetter.id)}">${I.T("Next", "Siguiente")}: ${lessonName(I, nextLetter.id, S.key)}</a>` : ""}
            <a class="btn val-btn" href="${lessonHref(S.grade, S.key)}"
              >${I.T("Back to the lesson", "Volver a la lección")}</a
            >
            <a class="btn val-btn" href="${S.deps.data.vaHref("review")}"
              >${I.T("Go to Review", "Ir a Repaso")}</a
            >
          </p>
        </section>`
      : html`<section class="val-step val-finish" aria-labelledby="val-step-title">
          <h2 id="val-step-title" class="val-step-title" tabindex="-1">
            ${I.T("Almost there", "Casi terminas")}
          </h2>
          <p>
            ${I.T("These steps are not finished yet. Open one to finish it, or leave and come back; your place is saved.", "Estos pasos aún no están terminados. Abre uno para terminarlo, o sal y vuelve; tu lugar está guardado.")}
          </p>
          <ul class="val-open-list">
            ${open.map(({ s, i }) => html`<li><button type="button" class="btn val-btn" data-val-goto="${i}">${i + 1}. ${tx(I, s.title)}</button></li>`)}
          </ul>
          <p>
            <a class="btn val-btn" href="${lessonHref(S.grade, S.key)}"
              >${I.T("Leave for now", "Salir por ahora")}</a
            >
          </p>
        </section>`,
  );
  paintChrome();
  const h = host.querySelector("#val-step-title");
  h?.focus({ preventScroll: true });
  S.announce(
    doneNow
      ? I.S("Lesson finished.", "Lección terminada.")
      : I.S("Some steps are not finished.", "Algunos pasos no están terminados."),
  );
}

/** Markup of the whole page (the step body is filled by mount). */
export function shellHTML(S) {
  const { I, unit, letter, deps } = S;
  const g = S.grade;
  const key = S.key;
  const trail = [...lessonTrail(I, g, key, S.lessonCount), [I.S(...sectionTitle(letter, key)), ""]];
  const goal = GOALS[letter];
  return html`${crumbs(I, trail)}
    <div class="val" data-val-lesson="${letter}" data-val-unit="${unit.id}">
      <header class="val-head">
        <p class="eyebrow">
          ${gradeName(I, g)} · ${lessonLabel(I, key)}: ${unit.title}
        </p>
        <h1 id="vaTitle" tabindex="-1">${lessonName(I, letter, key)}</h1>
        <p class="val-goal"><strong>${I.T("Goal", "Meta")}:</strong> ${goal ? tx(I, goal) : ""}</p>
        ${S.wasDone ? html`<p class="val-note">${I.T("You finished this section before. You can look back at any step or practice again.", "Ya terminaste esta sección. Puedes revisar cualquier paso o practicar otra vez.")}</p>` : ""}
        ${saveChipHTML(I, liveState)}
      </header>
      <div data-val-rail-host>${railHTML(S)}</div>
      <div class="val-body" data-val-body aria-live="off"></div>
      <div data-val-nav-host>${navHTML(S)}</div>
    </div>`;
}

/** Wire the page: the nav controls, store save-state, and the first step. */
export function mountSession(S, root) {
  current = S;
  S.root = root.querySelector("[data-val-lesson]") || root;
  liveState = "saved";
  const off = S.deps.store.onSaveState?.(({ state }) => paintSave(state));
  S.offSave = off;
  const onClick = (e) => {
    const t = e.target.closest?.("button");
    if (!t || !S.root.contains(t) || t.closest("[data-val-kind]")) return;
    if (t.matches("[data-val-next]")) S.next();
    else if (t.matches("[data-val-back]")) S.finished ? S.goto(S.steps.length - 1) : S.back();
    else if (t.matches("[data-val-goto]")) S.goto(Number(t.dataset.valGoto));
  };
  S.root.addEventListener("click", onClick);
  S.removeNav = () => S.root.removeEventListener("click", onClick);
  paintStep(S, false);
}

export function closeSession(S) {
  if (!S) return;
  if (S.saveTimer) S.persist();
  clearStep(S);
  S.offSave?.();
  S.removeNav?.();
  if (current === S) current = null;
}
