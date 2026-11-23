// Games & Practice hub (/vocabulary-academy/practice). Pick words (a unit, "my review words", or an assigned set with
// ?set=<wordIds>), pick an activity group, and run the activity engine's runner. Links to the Arcade and Word Study.
// Query: unit=<unitId> | set=<ids> | review=1, group=<id>, type=<activityId>|mixed, grade=<G>.
import { BASE, html } from "../../util.js";
import { SHIPPED_GRADES, bandOfGrade } from "../contract.js";
import { ACTIVITY_TYPES, buildMixed, buildItems, mountRunner } from "../activities/index.js";
import { buildReviewSession } from "../session.js";
import { getIndex, getUnit, getUnitsOfGrade, getWords, groupId, groupLessons, lessonHref, vaHref } from "../data.js";
import { recordResult } from "../model.js";
import { crumbs, gradeName, rootCrumb } from "../ui.js";
import { ensureLessonCss } from "../lessons/ui.js";

const GROUPS = {
  meaning: ["Meanings", "Significados"],
  deeper: ["Deeper meaning", "Significado más profundo"],
  morphology: ["Word parts", "Partes de palabras"],
  reading: ["Words in reading", "Palabras al leer"],
  productive: ["Using the words", "Usar las palabras"],
  listening: ["Listening and speaking", "Escuchar y hablar"],
};
let run = null; // { items, ctx, indexWords, grade }

const href = (q) => {
  const p = new URLSearchParams(Object.entries(q).filter(([, v]) => v));
  const s = p.toString();
  return vaHref("practice") + (s ? `?${s}` : "");
};

/** Resolve the words to practice from the query: { unit?, label, grade } or { error }. */
async function source(q, va, index) {
  if (q.unit) {
    const full = await getUnit(q.unit);
    if (!full) return { error: "unit" };
    // A differentiated assignment can name a smaller word set (?w=1.3.5): practice only those words.
    const supports = await import("../supports.js").catch(() => null);
    const variant = supports?.activeVariant?.() || null;
    const unit = variant?.words?.length ? { ...full, words: supports.variantWords(full.words, variant) } : full;
    const label = unit.group ? `${va.I.S("Unit", "Unidad")} ${unit.n}` : unit.title;
    return unit.words.length ? { unit, label, grade: String(unit.grade) } : { error: "unit" };
  }
  if (q.set) {
    const ids = String(q.set).split(",").map((x) => x.trim()).filter(Boolean).slice(0, 30);
    const words = await getWords(ids);
    if (!words.length) return { error: "set" };
    const grade = String(index.words?.[words[0].id]?.grade || va.progress.grade || "2");
    return { unit: { id: "assigned-set", grade, n: 0, title: "Assigned words", words, passage: null, review: [] }, label: va.I.S("Assigned words", "Palabras asignadas"), grade, set: true };
  }
  if (q.review) return { review: true, label: va.I.S("My review words", "Mis palabras de repaso"), grade: va.progress.grade || "" };
  return null;
}

export async function render(ctx, va) {
  const { I, progress } = va;
  const q = va.route.q || {};
  await ensureLessonCss(BASE);
  const index = await getIndex();
  const src = await source(q, va, index);
  const gradeList = SHIPPED_GRADES.filter((g) => (index.grades?.[g]?.unitCount || 0) > 0);
  const grade = String(q.grade || src?.grade || progress.grade || gradeList[0] || "2");
  const units = gradeList.includes(grade) ? await getUnitsOfGrade(grade) : [];
  const trail = crumbs(I, [rootCrumb(I), [I.S("Games & Practice", "Juegos y práctica"), ""]]);
  run = null;

  let types = [];
  if (src?.unit) {
    const c = { grade: src.grade, band: bandOfGrade(src.grade), supports: {}, I };
    types = ACTIVITY_TYPES.filter((t) => buildItems(t.id, src.unit, { ...c, limit: 1 }).length > 0);
  }
  const group = GROUPS[q.group] ? q.group : "";
  const inGroup = types.filter((t) => t.group === group);
  const chosen = q.type === "mixed" ? "mixed" : types.find((t) => t.id === q.type)?.id || "";

  if (src && !src.error && chosen && (chosen === "mixed" || group)) {
    const supports = va.supports(chosen === "mixed" ? "reading" : ACTIVITY_TYPES.find((t) => t.id === chosen)?.domain || "reading");
    const c = { grade: src.grade, band: bandOfGrade(src.grade), supports, I, unit: src.unit, pool: src.unit.words };
    const items = chosen === "mixed" ? buildMixed(src.unit, c, (group ? inGroup : types).map((t) => t.id), 2) : buildItems(chosen, src.unit, { ...c, limit: 8 });
    run = { items, ctx: c, grade: src.grade, set: Boolean(src.set), index };
  } else if (src?.review) {
    const supports = va.supports("reading");
    const items = await buildReviewSession(progress, { grade: progress.grade || undefined, limit: 8, ctx: { supports, I } });
    run = { items, ctx: { grade: progress.grade || "2", band: bandOfGrade(progress.grade || "2"), supports, I, pool: [] }, grade: progress.grade || "", review: true, index };
  }

  const tile = (link, title, text, on) =>
    html`<a class="val-tile ${on ? "is-on" : ""}" href="${link}" ${on ? html`aria-current="true"` : ""}><strong>${title}</strong>${text ? html`<span class="val-note">${text}</span>` : ""}</a>`;

  const body = html`${trail}
    <div class="val val-hub" data-val-hub>
      <header class="val-head"><h1 id="vaTitle" tabindex="-1">${I.T("Games & Practice", "Juegos y práctica")}</h1>
        <p class="val-goal">${I.T("Choose some words, choose how to practice them, and go. Wrong answers get a hint and another try.", "Elige unas palabras, elige cómo practicarlas y empieza. Las respuestas incorrectas reciben una pista y otra oportunidad.")}</p></header>
      <div class="val-hub-grid">
        <a class="val-tile" href="${vaHref("games")}"><strong>${I.T("Vocabulary Arcade", "Arcade de vocabulario")}</strong><span class="val-note">${I.T("Ten word games.", "Diez juegos de palabras.")}</span></a>
        <a class="val-tile" href="${vaHref("word-study")}"><strong>${I.T("Word Study Lab", "Laboratorio de partes de palabras")}</strong><span class="val-note">${I.T("Prefixes, suffixes and roots.", "Prefijos, sufijos y raíces.")}</span></a>
      </div>
      <section class="val-panel" aria-labelledby="val-p1"><h2 id="val-p1">1. ${I.T("Choose words", "Elige palabras")}</h2>
        ${q.set ? html`<p class="val-note">${I.T("Your teacher chose these words.", "Tu docente eligió estas palabras.")}</p>` : ""}
        <div class="val-hub-grid">${tile(href({ review: 1, type: "" }), I.T("My review words", "Mis palabras de repaso"), I.T("Words that are due or need another look.", "Palabras pendientes o que necesitan otro vistazo."), Boolean(q.review))}</div>
        <p class="val-note">${I.T("Or pick a lesson or a lesson. Grade", "O elige una lección o una lección. Grado")}:</p>
        <p class="val-actions">${gradeList.map((g) => html`<a class="btn val-btn ${g === grade ? "btn-primary" : ""}" href="${href({ grade: g })}" ${g === grade ? html`aria-current="true"` : ""}>${gradeName(I, g)}</a>`)}</p>
        <h3>${I.T("Whole units", "Unidades completas")}</h3>
        <div class="val-hub-grid">${groupLessons(units).map((gr) => tile(href({ unit: groupId(grade, gr.u) }), `${I.T("Unit", "Unidad")} ${gr.u}`, `${I.T("Lessons", "Lecciones")} ${gr.first}–${gr.last} · ${gr.lessons.reduce((n, u) => n + u.wordIds.length, 0)} ${I.T("words", "palabras")}`, q.unit === groupId(grade, gr.u)))}</div>
        <h3>${I.T("One lesson", "Una lección")}</h3>
        <div class="val-hub-grid">${units.map((u) => tile(href({ unit: u.id }), `${I.T("Lesson", "Lección")} ${u.n}: ${u.title}`, `${u.wordIds.length} ${I.T("words", "palabras")}`, q.unit === u.id))}</div>
        ${src?.error ? html`<p class="val-feedback is-wrong" role="alert">${I.T("Those words are not available. Pick a lesson instead.", "Esas palabras no están disponibles. Elige una lección.")}</p>` : ""}</section>
      ${src?.unit ? html`<section class="val-panel" aria-labelledby="val-p2"><h2 id="val-p2">2. ${I.T("Choose how to practice", "Elige cómo practicar")}: <span lang="en">${src.label}</span></h2>
        <div class="val-hub-grid">${Object.keys(GROUPS).filter((g) => types.some((t) => t.group === g)).map((g) => tile(href({ ...pass(q), group: g, type: "" }), I.T(...GROUPS[g]), `${types.filter((t) => t.group === g).length} ${I.T("activities", "actividades")}`, group === g))}
          ${tile(href({ ...pass(q), group: "", type: "mixed" }), I.T("A mix of everything", "Una mezcla de todo"), I.T("Two of each kind.", "Dos de cada tipo."), chosen === "mixed" && !group)}</div>
        ${group ? html`<h3>${I.T(...GROUPS[group])}</h3><div class="val-hub-grid">${inGroup.map((t) => tile(href({ ...pass(q), group, type: t.id }), I.T(t.label, t.labelEs), "", chosen === t.id))}
          ${tile(href({ ...pass(q), group, type: "mixed" }), I.T("Mix of this group", "Mezcla de este grupo"), "", chosen === "mixed" && Boolean(group))}</div>` : ""}</section>` : ""}
      ${run ? html`<section class="val-panel" aria-labelledby="val-run-h"><h2 id="val-run-h" tabindex="-1">${run.review ? I.T("Review words", "Palabras de repaso") : I.T("Practice", "Práctica")}: <span lang="en">${src.label}</span></h2>
        ${run.items.length ? html`<div class="val-runner-host" data-val-runner-host></div>` : html`<p>${run.review ? I.T("Nothing is due right now. Check back tomorrow, or pick a lesson above.", "No hay nada pendiente ahora. Vuelve mañana o elige una lección arriba.") : I.T("This activity has no questions for these words. Try another one.", "Esta actividad no tiene preguntas para estas palabras. Prueba otra.")}</p>`}</section>` : ""}
      ${src?.unit && !chosen ? html`<p class="val-note">${I.T("Choose an activity group to start.", "Elige un grupo de actividades para empezar.")} <a href="${lessonHref(src.grade, src.unit.n || 1)}">${src.unit.n ? I.T("Back to the lesson", "Volver a la lección") : ""}</a></p>` : ""}
    </div>`;
  return { title: I.S("Games & Practice", "Juegos y práctica"), html: body };
}

const pass = (q) => ({ unit: q.unit, set: q.set, grade: q.grade });

export function mount(root, ctx, va) {
  const host = root.querySelector("[data-val-runner-host]");
  if (!host || !run?.items.length) return;
  const { index } = run;
  mountRunner(host, {
    items: run.items,
    ctx: { ...run.ctx, I: va.I },
    onResult: (r) => {
      if (!r.wordId) return;
      try {
        if (r.review && r.response) {
          const list = Array.isArray(va.progress.drafts) ? va.progress.drafts : [];
          va.progress.drafts = [...list.filter((x) => x.id !== `practice:${r.itemId}`), { id: `practice:${r.itemId}`, kind: "writing", prompt: "", text: String(r.response).slice(0, 2000), wordIds: [r.wordId], at: new Date().toISOString() }].slice(-40);
        }
        recordResult(va.progress, { wordId: r.wordId, dim: r.dim, ok: r.ok, sup: r.sup || [], type: r.type, unit: index.words?.[r.wordId]?.unit, grade: index.words?.[r.wordId]?.grade });
      } catch (error) {
        console.warn("[vocab-academy] could not record practice evidence", error);
      }
      va.save();
    },
    onDone: () => va.save(),
  });
}

export const unmount = () => {
  run = null;
};
export const onClick = () => false;
export const onChange = () => false;
export const onInput = () => false;
