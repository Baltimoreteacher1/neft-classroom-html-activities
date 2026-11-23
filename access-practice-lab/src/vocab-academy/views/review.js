// Review & Assess (/vocabulary-academy/review): due words, per-word states with text labels, unit assessments A then B
// with a growth comparison, and written work saved for a teacher to read. Honest copy: practice, never an official score.
import { BASE, formatDate, html } from "../../util.js";
import { DIM_LABEL, STATE_LABEL, STATES } from "../contract.js";
import { compareAttempts } from "../assessment.js";
import { mountRunner } from "../activities/index.js";
import { buildReviewSession } from "../session.js";
import { getIndex, getUnitsOfGrade, parseUnitId, lessonHref, vaHref, wordHref } from "../data.js";
import { dueWords, recordResult, wordEntry } from "../model.js";
import { crumbs, rootCrumb } from "../ui.js";
import { ensureLessonCss } from "../lessons/ui.js";
import { bandOfGrade } from "../contract.js";

const ICON = { new: "○", learning: "◔", developing: "◑", applying: "◕", secure: "●", "review-needed": "↻" };
const KIND = { constructed: ["Written response (lesson review)", "Respuesta escrita (repaso de la lección)"], writing: ["Writing", "Escritura"], revision: ["Revision", "Revisión"] };
let ctxNow = null;

const stateTag = (I, s) => html`<span class="val-state" data-state="${s}"><span aria-hidden="true">${ICON[s]}</span> ${I.T(...STATE_LABEL[s])}</span>`;

function assessSection(I, progress, titles) {
  const rows = Object.entries(progress.units || {})
    .map(([id, u]) => ({ id, u, parsed: parseUnitId(id) }))
    .filter((x) => x.parsed && (x.u.assess?.A || x.u.assess?.B));
  if (!rows.length)
    return html`<p>${I.T("No lesson check taken yet. The Lesson Review of every lesson has form A and form B. They use the same words with different sentences, so you can see how the words went.", "Todavía no hay comprobación de lección. El Repaso de cada lección tiene la forma A y la forma B. Usan las mismas palabras con oraciones distintas, para que veas cómo fueron las palabras.")}</p>`;
  return html`<ul class="val-lines">${rows.map(({ id, u, parsed }) => {
    const A = u.assess.A;
    const B = u.assess.B;
    const cmp = A && B ? compareAttempts({ perWord: A.perWord }, { perWord: B.perWord }) : null;
    const title = titles.get(id) || id;
    return html`<li><strong lang="en">${I.T("Lesson", "Lección")} ${parsed.n}: ${title}</strong>
      ${A ? html`<br />${I.T("Form A", "Forma A")}: ${A.score} ${I.T("of", "de")} ${A.total} (${formatDate(A.at)})` : html`<br />${I.T("Form A not taken yet.", "La forma A aún no se ha hecho.")}`}
      ${B ? html`<br />${I.T("Form B", "Forma B")}: ${B.score} ${I.T("of", "de")} ${B.total} (${formatDate(B.at)})` : A ? html`<br />${I.T("Form B is next: same words, new sentences.", "La forma B sigue: las mismas palabras, oraciones nuevas.")}` : ""}
      ${cmp ? html`<br />${I.T(`Words gained: ${cmp.counts.gained}. Kept: ${cmp.counts.kept}. Still building: ${cmp.counts.building}. Worth another look: ${cmp.counts.revisit}.`, `Palabras ganadas: ${cmp.counts.gained}. Mantenidas: ${cmp.counts.kept}. En construcción: ${cmp.counts.building}. Vale otro vistazo: ${cmp.counts.revisit}.`)}` : ""}
      <br /><a href="${lessonHref(parsed.grade, parsed.n, "h")}">${A && B ? I.T("Open the Lesson Review to see each word", "Abrir el Repaso de la lección para ver cada palabra") : I.T("Open the Lesson Review", "Abrir el Repaso de la lección")}</a></li>`;
  })}</ul>`;
}

export async function render(ctx, va) {
  const { I, progress } = va;
  await ensureLessonCss(BASE);
  const index = await getIndex();
  const titles = new Map();
  for (const g of Object.keys(index.grades || {})) for (const u of index.grades[g].units || []) titles.set(u.id, u.title);
  const due = dueWords(progress, { limit: 50, grade: progress.grade || undefined, gradeOf: (id) => index.words?.[id]?.grade });
  const wordRows = Object.keys(progress.words || {}).map((id) => ({ id, hw: index.words?.[id]?.hw || id.split(".")[1] || id, state: wordEntry(progress, id).state }));
  const by = Object.fromEntries(STATES.map((s) => [s, wordRows.filter((w) => w.state === s)]));
  const drafts = (Array.isArray(progress.drafts) ? progress.drafts : []).slice().reverse();
  const trail = crumbs(I, [rootCrumb(I), [I.S("Review & Assess", "Repaso y evaluación"), ""]]);
  return {
    title: I.S("Review & Assess", "Repaso y evaluación"),
    html: html`${trail}
      <div class="val val-hub" data-val-review>
        <header class="val-head"><h1 id="vaTitle" tabindex="-1">${I.T("Review & Assess", "Repaso y evaluación")}</h1>
          <p class="val-goal">${I.T("Bring words back at the right time, check what you know, and see how words are growing. This is practice for your learning, not an official score.", "Trae las palabras de vuelta en el momento justo, comprueba lo que sabes y mira cómo crecen. Es práctica para tu aprendizaje, no un puntaje oficial.")}</p></header>
        <section class="val-panel" aria-labelledby="val-r1"><h2 id="val-r1">${I.T("Words to review", "Palabras para repasar")}</h2>
          ${due.length ? html`<p>${I.T(`${due.length} word${due.length === 1 ? " is" : "s are"} ready to come back.`, `${due.length} palabra(s) lista(s) para volver.`)}</p>` : html`<p>${wordRows.length ? I.T("Nothing is due right now. Words come back here when it is time to see them again.", "No hay nada pendiente ahora. Las palabras vuelven aquí cuando es hora de verlas otra vez.") : I.T("You have not met any words yet. Start a lesson, then they show up here.", "Todavía no has conocido palabras. Empieza una lección y aparecerán aquí.")}</p>`}
          <p class="val-actions"><button type="button" class="btn btn-primary val-btn" data-val-start-review ${wordRows.length ? "" : "disabled"}>${I.T("Start review", "Empezar repaso")}</button>
            <a class="btn val-btn" href="${vaHref("practice")}">${I.T("Choose a practice set", "Elegir un conjunto de práctica")}</a></p>
          <div class="val-runner-host" data-val-review-host></div></section>
        <section class="val-panel" aria-labelledby="val-r2"><h2 id="val-r2">${I.T("Where each word is", "Dónde está cada palabra")}</h2>
          <p class="val-note">${I.T("A word moves forward from several kinds of evidence over time, not from one answer.", "Una palabra avanza con varios tipos de evidencia a lo largo del tiempo, no con una sola respuesta.")}</p>
          ${wordRows.length ? STATES.filter((s) => by[s].length).map((s) => html`<details class="val-steps-menu"><summary>${stateTag(I, s)} ${by[s].length}</summary>
            <ul class="val-words-list">${by[s].map((w) => html`<li><a href="${wordHref(w.id)}" lang="en">${w.hw}</a></li>`)}</ul></details>`) : ""}</section>
        <section class="val-panel" aria-labelledby="val-r3"><h2 id="val-r3">${I.T("Lesson checks: form A, then form B", "Comprobaciones de unidad: forma A y luego B")}</h2>${assessSection(I, progress, titles)}</section>
        <section class="val-panel" aria-labelledby="val-r4"><h2 id="val-r4">${I.T("Written work saved on this device", "Trabajo escrito guardado en este dispositivo")}</h2>
          ${drafts.length ? html`<p class="val-note">${I.T("Your teacher can read your written work when you share it: print it, or export your Passport code. Written responses are read by a person and are not scored here.", "Tu docente puede leer tu trabajo escrito cuando lo compartas: imprímelo o exporta tu código de Pasaporte. Una persona lee las respuestas escritas y aquí no se califican.")}</p>
            ${drafts.slice(0, 12).map((d) => html`<article class="val-draft"><p><strong>${KIND[d.kind] ? I.T(...KIND[d.kind]) : I.T("Writing", "Escritura")}</strong> · ${formatDate(d.at)} ${d.awaiting === "teacher" ? html`· <span class="val-state" data-state="learning"><span aria-hidden="true">◔</span> ${I.T("Waiting for a teacher to read it", "Esperando que un docente la lea")}</span>` : ""}</p>
              ${d.prompt ? html`<p class="val-note" lang="en">${d.prompt}</p>` : ""}<blockquote lang="en">${d.text}</blockquote>
              <button type="button" class="btn val-btn-ghost" data-val-draft-del="${d.id}">${I.T("Remove from this device", "Quitar de este dispositivo")}</button></article>`)}`
            : html`<p>${I.T("Nothing yet. Writing from Exercise F (Using the Words) and the written response in the Lesson Review will be listed here.", "Nada todavía. La escritura del Ejercicio F (Usar las palabras) y la respuesta escrita del Repaso de la lección aparecerán aquí.")}</p>`}</section>
      </div>`,
  };
}

export function mount(root, ctx, va) {
  const host = root.querySelector("[data-val-review-host]");
  const onClick = async (e) => {
    const del = e.target.closest("[data-val-draft-del]");
    if (del) {
      va.progress.drafts = (va.progress.drafts || []).filter((d) => d.id !== del.dataset.valDraftDel);
      va.save();
      ctx.rerender?.();
      return;
    }
    if (!e.target.closest("[data-val-start-review]") || !host) return;
    const btn = e.target.closest("[data-val-start-review]");
    btn.disabled = true;
    const index = await getIndex();
    const supports = va.supports("reading");
    const items = await buildReviewSession(va.progress, { grade: va.progress.grade || undefined, limit: 8, ctx: { supports, I: va.I } });
    btn.disabled = false;
    if (!items.length) {
      host.innerHTML = `<p class="val-note" role="status">${va.I.S("No words are due or need another look right now. Come back tomorrow, or practice a lesson.", "Ninguna palabra está pendiente ni necesita otro vistazo ahora. Vuelve mañana o practica una lección.")}</p>`;
      return;
    }
    mountRunner(host, {
      items,
      ctx: { grade: va.progress.grade || "2", band: bandOfGrade(va.progress.grade || "2"), supports, I: va.I, pool: [] },
      onResult: (r) => {
        if (!r.wordId) return;
        try {
          recordResult(va.progress, { wordId: r.wordId, dim: r.dim, ok: r.ok, sup: r.sup || [], type: "review", unit: index.words?.[r.wordId]?.unit, grade: index.words?.[r.wordId]?.grade });
        } catch (error) {
          console.warn("[vocab-academy] could not record review evidence", error);
        }
        va.save();
      },
      onDone: () => va.save(),
    });
    host.querySelector(".vaa-runner")?.scrollIntoView?.({ block: "nearest" });
  };
  root.addEventListener("click", onClick);
  ctxNow = { off: () => root.removeEventListener("click", onClick) };
}

export const unmount = () => {
  ctxNow?.off?.();
  ctxNow = null;
};
export const onClick = () => false;
export const onChange = () => false;
export const onInput = () => false;
