// Speaking Studio 2.0 (/quest/speaking): picture-description tasks that follow the same five steps as every mission
// speak item: Observe, Prepare, Speak, Review, Improve. The learner sees a scene with its words, can watch a response grow
// one step at a time, then records (the lab's recorder, never uploaded) or rehearses by typing, which is labelled as typed
// rehearsal. Nothing here listens to or rates speech.
import { BASE, html, icon, raw } from "../util.js";
import { portraitSVG, sceneSVG } from "../quest/art.js";
import { characterOf, loadSpeaking, pseudoMission, speakItemOf } from "../quest/content.js";
import { diffWords } from "../quest/engine.js";
import * as B from "../quest/kinds-b.js";
import { moreSupport } from "../quest/pathway.js";
import { loadQuest, saveQuest } from "../quest/state.js";
import { bi, bs, coachHTML, say, syncUi, ui } from "../quest/ui.js";

const href = (p = "", band = "") => `${BASE}/quest/speaking${p ? `/${p}` : ""}${band ? `?grades=${band}` : ""}`;
let cur = null;

function envFor() {
  const { task, qs, run, character, I, ctx } = cur;
  let timer = 0;
  return {
    ctx, I, mission: pseudoMission(task), run, qs, character, demo: false,
    item: (id) => (run.items[id] ||= {}),
    save: () => saveQuest(qs),
    saveSoon: () => {
      clearTimeout(timer);
      timer = setTimeout(() => saveQuest(qs), 450);
    },
    rerender: () => ctx.rerender(),
  };
}

function listHTML(ctx, I, data, qs, h) {
  const band = ctx.band === "3-5" ? "3-5" : "6-8";
  const mine = data.tasks.filter((t) => t.band === band);
  const other = data.tasks.filter((t) => t.band !== band);
  const card = (t) => html`<a class="card q-mcard" href="${href(t.id, t.band)}"><div class="q-mthumb" aria-hidden="true">${raw(sceneSVG(t.theme, { objects: t.objects }))}</div><strong class="task-title">${bi(I, t.title)}</strong><span class="task-desc">${t.prompt}</span>${qs.runs[`speaking-${t.id}`]?.completed ? html`<span class="q-chip is-independent">${icon("check")} ${I.T("Saved", "Guardado")}</span>` : ""}</a>`;
  return html`${h.crumbs(I, band, I.S("Speaking Studio", "Estudio de expresión oral"))}
    <header class="panel"><h1 tabindex="-1">${I.T("Speaking Studio", "Estudio de expresión oral")}</h1>
      <p class="lead">${I.T("Look at a picture, learn the words, watch how a response can grow, then say your own. Observe, prepare, speak, review, improve. Recording stays on this device. Typing a rehearsal is practice, not a recording of your speaking.", "Mira una imagen, aprende las palabras, observa cómo puede crecer una respuesta y luego di la tuya. Observa, prepárate, habla, revisa, mejora. La grabación se queda en este dispositivo. Escribir un ensayo es práctica, no una grabación de tu voz.")}</p></header>
    <section class="panel"><h2>${I.T(`Pictures for grades ${band.replace("-", "–")}`, `Imágenes para los grados ${band.replace("-", "–")}`)}</h2><div class="q-grid">${mine.map(card)}</div>
      ${other.length ? html`<h3>${I.T(`Pictures for grades ${other[0].band.replace("-", "–")}`, `Imágenes para los grados ${other[0].band.replace("-", "–")}`)}</h3><div class="q-grid">${other.map(card)}</div>` : ""}</section>`;
}

function taskHTML(ctx, I, t, qs, run, character, h) {
  const band = t.band;
  const env = envFor();
  const shown = Math.max(1, ui.pick[`exp:${t.id}`] ?? run.items.expand?.shown ?? 1);
  const levels = t.expansion;
  const cur_ = levels[Math.min(shown, levels.length) - 1];
  const prev = shown > 1 ? levels[shown - 2].text : "";
  const d = prev ? diffWords(prev, cur_.text) : null;
  return html`${h.crumbs(I, band, bs(I, t.title), I.S("Speaking Studio", "Estudio de expresión oral"))}
    <header class="q-player-head"><h1 tabindex="-1">${bi(I, t.title)}</h1></header>
    <div class="q-layout"><div class="q-main">
      <section class="card q-item"><h3>${I.T("1. Observe", "1. Observa")}</h3>
        <div class="q-world-art q-small">${raw(sceneSVG(t.theme, { objects: t.objects, alt: t.alt }))}</div>
        <p class="q-prompt">${t.prompt}</p><button type="button" class="btn small" data-say="${t.prompt}">${icon("volume")} ${I.T("Hear the task", "Escuchar la tarea")}</button>
        <h4>${I.T("Words you can use", "Palabras que puedes usar")}</h4>
        <dl class="q-vocab-inline">${t.vocab.map((v) => html`<dt>${v.term} <button type="button" class="ghost small" data-say="${v.term}. ${v.def}" aria-label="${I.S("Hear ", "Escuchar ")}${v.term}">${icon("volume")}</button></dt><dd>${v.def}</dd>`)}</dl></section>
      <section class="card q-item"><h3>${I.T("See how a response can grow", "Mira cómo puede crecer una respuesta")}</h3>
        <p class="fine">${I.T("Each step adds something. Words that are new are marked.", "Cada paso agrega algo. Las palabras nuevas están marcadas.")}</p>
        <p class="q-quote" aria-live="polite"><strong>${cur_.label}:</strong> ${d ? d.right.map((x) => (x.c ? html`<mark>${x.w}</mark> ` : `${x.w} `)) : cur_.text}</p>
        <div class="q-actions"><button type="button" class="btn" data-q-act="exp-next" ${shown >= levels.length ? html`disabled` : ""}>${I.T("Add to the response", "Agregar a la respuesta")}</button><button type="button" class="btn small" data-say="${cur_.text}">${icon("volume")} ${I.T("Hear it", "Escuchar")}</button>${shown > 1 ? html`<button type="button" class="btn small" data-q-act="exp-reset">${I.T("Start over", "Empezar de nuevo")}</button>` : ""}</div>
        <p class="fine">${I.T("This is a model. Your own words matter most. Say what you see, in your own way.", "Esto es un modelo. Tus propias palabras son lo más importante. Di lo que ves a tu manera.")}</p></section>
      <div data-q-item-wrap>${B.speak.render(env, speakItemOf(t))}</div>
      <p class="q-nav"><a class="btn" href="${href("", band)}">${icon("arrow-left")} ${I.T("More pictures", "Más imágenes")}</a><a class="btn" href="${BASE}/quest/portfolio?grades=${band}">${icon("bookmark")} ${I.T("My portfolio", "Mi portafolio")}</a></p>
    </div><div class="q-side">${coachHTML({ I, character })}</div></div>`;
}

export async function render(ctx, I, cat, qs, sub, h) {
  const data = await loadSpeaking();
  const t = data.tasks.find((x) => x.id === sub);
  if (!t) return { title: I.S("Speaking Studio", "Estudio de expresión oral"), html: listHTML(ctx, I, data, qs, h) };
  syncUi(`speaking-${t.id}`);
  const key = `speaking-${t.id}`;
  const run = (qs.runs[key] ||= { started: new Date().toISOString(), stage: 0, rung: "frame", startRung: "frame", items: {}, flags: [], helpUsed: false, hints: 0, completed: "" });
  run.startRung ||= run.rung;
  cur = { task: t, qs, run, character: characterOf(cat, t.character), I, ctx };
  return { title: bs(I, t.title), html: taskHTML(ctx, I, t, qs, run, cur.character, h) };
}

export function onClick(e, ctx) {
  const el = e.target.closest("[data-q-act]");
  if (!el || !cur) return false;
  const { task, qs, run } = cur;
  const act = el.dataset.qAct;
  const save = () => saveQuest(qs);
  if (act === "exp-next" || act === "exp-reset") {
    const st = (run.items.expand ||= { shown: 1 });
    st.shown = act === "exp-reset" ? 1 : Math.min(task.expansion.length, (st.shown || 1) + 1);
    ui.pick[`exp:${task.id}`] = st.shown;
    save();
    return (ctx.rerender(), true);
  }
  if (act === "rung") {
    run.rung = el.dataset.rung;
    if (["model", "frame", "partial", "cue", "independent"].indexOf(run.rung) < ["model", "frame", "partial", "cue", "independent"].indexOf(run.startRung)) run.helpUsed = true;
    save();
    return (ctx.rerender(), true);
  }
  if (act === "more-help") {
    run.rung = moreSupport(run.rung);
    run.helpUsed = true;
    save();
    return (ctx.rerender(), true);
  }
  if (act === "hint") {
    run.hints = (run.hints || 0) + 1;
    say(envFor(), "hint", task.ladder.cue);
    save();
    return (ctx.rerender(), true);
  }
  const handled = B.speak.click(el, envFor(), speakItemOf(task));
  if (handled && run.items.speak?.done && !run.completed) {
    run.completed = new Date().toISOString();
    run.ending = "done";
    save();
  }
  return handled;
}
export function onChange(e) {
  const el = e.target.closest("[data-q-act]");
  if (!el || !cur) return false;
  return B.speak.change(el, envFor(), speakItemOf(cur.task)) || false;
}
export function onRecorded(key) {
  if (!cur || key !== `quest:speaking-${cur.task.id}:speak`) return;
  (cur.run.items.speak ||= {}).took = true;
  saveQuest(cur.qs);
}
export const unmount = () => {
  cur = null;
};
