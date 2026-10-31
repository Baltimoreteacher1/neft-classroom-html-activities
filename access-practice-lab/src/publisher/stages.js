// Publisher demo: the four domain stages. Each returns markup from (journey, state, I, mode).
// Supports (frames, glosses, replay by part, transcript, model) render only in "support" mode, and a
// model answer or transcript never appears before the learner has answered or spoken.
import { icon, html, raw } from "../util.js";
import { listenPlayerHTML, recorderHTML } from "../components.js";
import { isRecording } from "../recorder.js";
import { describeSpeech } from "../lang/audio.js";
import { analyzeResponse, compareDrafts } from "../lang/analyze.js";
import { sentences } from "../lang/text.js";
import { defaultOrder, stageOf, writingOptions } from "./evidence.js";

export const badge = (I, mode) => mode === "independent"
  ? html`<p class="pd-badge is-independent">${icon("lock")} <strong>${I.T("Independent attempt", "Intento independiente")}</strong> · ${I.T("No frames, models, glosses or transcript. Feedback comes after you answer.", "Sin marcos, modelos, glosarios ni transcripción. La retroalimentación llega después de responder.")}</p>`
  : html`<p class="pd-badge is-supported">${icon("bulb")} <strong>${I.T("Learning with support", "Aprendiendo con apoyo")}</strong> · ${I.T("Help is on. This is saved as supported practice, not independent evidence.", "La ayuda está activada. Se guarda como práctica con apoyo, no como evidencia independiente.")}</p>`;

const vocabHTML = (J, I) => html`<details class="helpers pd-vocab"><summary>${icon("words")} ${I.T("Word help (English and Spanish)", "Ayuda con palabras (inglés y español)")}</summary><dl class="pd-dl">${J.vocabulary.map((v) => html`<dt>${v.term}${v.cognate ? html` <span class="chip">${I.T("cognate", "cognado")}</span>` : ""}</dt><dd>${v.def}<br><span lang="es">${v.es}</span></dd>`)}</dl></details>`;

function optionsHTML(domain, task, answer, locked) {
  return html`<fieldset class="pd-options" ${locked ? raw("disabled") : ""}><legend>${task.prompt}</legend>${task.options.map((o) => html`<label class="pd-opt"><input type="radio" name="${domain}-${task.id}" data-pd-answer="${domain}:${task.id}" value="${o.id}" ${answer === o.id ? raw("checked") : ""}> <span>${o.text}</span></label>`)}</fieldset>`;
}

function orderHTML(task, order, locked) {
  const byId = Object.fromEntries(task.items.map((i) => [i.id, i]));
  return html`<fieldset class="pd-order" ${locked ? raw("disabled") : ""}><legend>${task.prompt}</legend><ol>${order.map((id, n) => html`<li><span>${byId[id].text}</span>
    <button type="button" class="ghost small" data-pd-move="${id}:-1" ${n === 0 ? raw("disabled") : ""} aria-label="Move up: ${byId[id].text}">Up</button>
    <button type="button" class="ghost small" data-pd-move="${id}:1" ${n === order.length - 1 ? raw("disabled") : ""} aria-label="Move down: ${byId[id].text}">Down</button></li>`)}</ol></fieldset>`;
}

/** Feedback for one task: right/wrong plus why the chosen distractor was tempting. Independent mode waits. */
function feedbackFor(task, result, answer, mode, I, reveal) {
  if (!result) return "";
  if (mode === "independent" && !reveal) return html`<p class="pd-saved" role="status">${icon("check")} ${I.T("Answer saved. Feedback appears when you finish this part.", "Respuesta guardada. La retroalimentación aparece cuando termines esta parte.")}</p>`;
  const note = !result.ok && task.distractors?.[answer] ? html`<p class="fine">${I.T("Why that choice is tempting:", "Por qué esa opción tienta:")} ${task.distractors[answer]}.</p>` : "";
  return html`<div class="feedback ${result.ok ? "is-right" : "is-hint"}" role="status"><p class="fb-title">${icon(result.ok ? "check" : "retry")} ${result.ok ? I.T("Right", "Correcto") : I.T("Not yet", "Todavía no")}</p><p>${result.ok ? task.feedback.right : task.feedback.wrong}</p>${note}</div>`;
}

function taskBlock({ domain, task, s, I, mode, body, reveal }) {
  const result = s[domain].results[task.id];
  const answer = s[domain].answers[task.id] ?? (task.type === "order" ? s.listen.order : undefined);
  const locked = Boolean(result) && (mode === "independent" || result.ok);
  const ready = task.type === "order" ? true : task.type === "evidence" ? Boolean(s.read.pinned) : answer !== undefined && answer !== "";
  return html`<section class="pd-task" aria-labelledby="t-${task.id}"><h3 id="t-${task.id}" class="pd-task-h">${task.skill || task.prompt.split(".")[0]}</h3>${body(answer, locked)}
    ${locked ? "" : html`<button type="button" class="btn btn-primary" data-pd-check="${domain}:${task.id}" ${ready ? "" : raw("disabled")}>${I.T("Check my answer", "Revisar mi respuesta")}</button>`}
    ${result && !result.ok && mode === "supported" ? html`<button type="button" class="btn" data-pd-retry="${domain}:${task.id}">${I.T("Try again", "Intentar de nuevo")}</button>` : ""}
    ${feedbackFor(task, result, answer, mode, I, reveal)}</section>`;
}

const allDone = (J, s, domain, key) => J[key].tasks.every((t) => s[domain].results[t.id]);

export function listenStage(J, s, I, mode) {
  const L = J.listening;
  const played = s.listen.plays;
  const done = allDone(J, s, "listen", "listening");
  const limited = mode === "independent";
  return html`<section aria-labelledby="pd-h"><h2 id="pd-h">${I.T("Listening", "Escuchar")}: ${L.title}</h2>${badge(I, mode)}
    <p>${L.context}</p><p><strong>${I.T("Your purpose:", "Tu propósito:")}</strong> ${L.purpose}</p>
    ${limited ? html`<p class="fine">${I.T("Test-like conditions: you can play the recording twice. Take notes while you listen.", "Condiciones tipo prueba: puedes reproducir la grabación dos veces. Toma notas mientras escuchas.")}</p>` : ""}
    ${listenPlayerHTML("pd-listen", L.script, limited ? { maxPlays: L.maxPlays, played: Math.min(played, L.maxPlays), i18n: I, test: true } : { i18n: I })}
    ${mode === "supported" && played ? html`<div class="speed" role="group" aria-label="${I.S("Replay one part", "Repite una parte")}">${L.script.map((_, i) => html`<button type="button" class="speed-btn" data-pd-part="${i}">${icon("play")} ${I.T("Part", "Parte")} ${i + 1}</button>`)}</div>` : ""}
    <fieldset class="pd-notes"><legend>${I.T("My listening notes", "Mis notas de escucha")}</legend>${L.noteFields.map((f) => html`<label class="field"><span>${f}</span><textarea rows="2" data-pd-note="${f}">${s.listen.notes[f] || ""}</textarea></label>`)}</fieldset>
    ${mode === "supported" ? vocabHTML(J, I) : ""}
    ${played || Object.keys(s.listen.results).length ? L.tasks.map((t) => taskBlock({ domain: "listen", task: t, s, I, mode, reveal: done, body: (a, locked) => t.type === "order" ? orderHTML(t, s.listen.order || defaultOrder(t), locked) : optionsHTML("listen", t, a, locked) })) : html`<p class="fine" role="note">${I.T("Press Play to hear the talk. The questions appear after you listen.", "Pulsa Reproducir para escuchar. Las preguntas aparecen después de escuchar.")}</p>`}
    ${done ? html`<details class="transcript" open><summary>${icon("list")} ${I.T("Transcript (shown after you answered everything)", "Transcripción (se muestra al terminar)")}</summary><div class="transcript-body">${L.script.map((p) => html`<p>${p}</p>`)}</div></details>` : ""}</section>`;
}

function passageHTML(R, s, I, mode, pinning) {
  return R.passage.map((p, pi) => html`<p class="pd-para" data-para="${pi}"><span class="pd-pn" aria-hidden="true">${pi + 1}</span> ${sentences(p).map((sn) => pinning
    ? html`<button type="button" class="pd-sent" data-pd-pin="${sn.text}" aria-pressed="${String(s.read.pinned === sn.text)}">${sn.text}</button> `
    : html`<span>${sn.text} </span>`)}${mode === "supported" ? html`<button type="button" class="ghost small" data-say="${p}" aria-label="${I.S("Read paragraph aloud", "Leer el párrafo en voz alta")} ${pi + 1}">${icon("volume")}</button>` : ""}</p>`);
}

export function readStage(J, s, I, mode) {
  const R = J.reading;
  const done = allDone(J, s, "read", "reading");
  return html`<section aria-labelledby="pd-h"><h2 id="pd-h">${I.T("Reading", "Leer")}: ${R.title}</h2>${badge(I, mode)}
    <figure class="pd-figure"><img src="${R.visual.src}" alt="${R.visual.alt}" width="720" height="360"><figcaption>${R.visual.caption}</figcaption></figure>
    <article class="passage pd-passage" aria-label="${R.title}">${passageHTML(R, s, I, mode, true)}</article>
    <p class="fine">${I.T("To answer the evidence question, select the sentence that proves it. Selecting a sentence pins it.", "Para la pregunta de evidencia, selecciona la oración que lo demuestra. Al seleccionarla, queda fijada.")}</p>
    <table class="pd-table"><caption>${R.table.caption}</caption><thead><tr>${R.table.head.map((h) => html`<th scope="col">${h}</th>`)}</tr></thead><tbody>${R.table.rows.map((r) => html`<tr><th scope="row">${r[0]}</th>${r.slice(1).map((c) => html`<td>${c}</td>`)}</tr>`)}</tbody></table>
    <aside class="pd-pair panel" aria-label="${R.pair.title}"><h3>${R.pair.title}</h3><p>${R.pair.text}</p></aside>
    ${mode === "supported" ? vocabHTML(J, I) : ""}
    ${R.tasks.map((t) => taskBlock({ domain: "read", task: t, s, I, mode, reveal: done, body: (a, locked) => t.type === "evidence"
      ? html`<fieldset class="pd-evidence" ${locked ? raw("disabled") : ""}><legend>${t.prompt}</legend><p class="pd-pinned">${s.read.pinned ? html`${icon("pin")} ${s.read.pinned}` : I.T("No sentence pinned yet.", "Todavía no has fijado una oración.")}</p></fieldset>`
      : optionsHTML("read", t, a, locked) }))}
    ${mode === "supported" && Object.values(s.read.results).some((r) => r && !r.ok) ? html`<p class="fine">${icon("info")} ${I.T("Hint: look back at paragraph 2 and the table.", "Pista: vuelve al párrafo 2 y a la tabla.")}</p>` : ""}</section>`;
}

export function speakStage(J, s, I, mode, ctxPrefs) {
  const S = J.speaking;
  const sp = s.speak;
  const took = sp.measures.length;
  const stage = stageOf(sp);
  return html`<section aria-labelledby="pd-h"><h2 id="pd-h">${I.T("Speaking", "Hablar")}: ${S.title}</h2>${badge(I, mode)}
    <p class="pd-callout">${icon("speaking")} ${I.T("Speaking is shown by speaking. There is no multiple-choice step here: you record your own words.", "Hablar se demuestra hablando. Aquí no hay opción múltiple: grabas tus propias palabras.")}</p>
    <figure class="pd-figure"><img src="${J.reading.visual.src}" alt="${J.reading.visual.alt}" width="720" height="360"><figcaption>${J.reading.visual.caption}</figcaption></figure>
    <p class="prompt-text">${S.prompt} <button type="button" class="ghost small" data-say="${S.prompt}">${icon("volume")} ${I.T("Hear task", "Escuchar la tarea")}</button></p>
    <section aria-labelledby="pd-plan"><h3 id="pd-plan">${I.T("Plan (preparation time)", "Planear (tiempo de preparación)")}</h3><ul>${S.planning.map((q) => html`<li>${q}</li>`)}</ul></section>
    ${mode === "supported" ? html`<section aria-labelledby="pd-frames"><h3 id="pd-frames">${I.T("Sentence frames", "Marcos de oraciones")}</h3><ul>${S.frames.map((f) => html`<li>${f}</li>`)}</ul></section>${vocabHTML(J, I)}` : ""}
    ${recorderHTML("pd-speak", { prompt: S.prompt, activity: { prepSeconds: S.prepSeconds, maxSeconds: S.maxSeconds }, recording: isRecording("pd-speak"), i18n: I })}
    ${sp.measures.length ? html`<section aria-labelledby="pd-meas"><h3 id="pd-meas">${I.T("What the recording shows", "Lo que muestra la grabación")}</h3><p class="fine">${I.T("Measured on this device from loudness only. It does not hear your words and gives no score.", "Medido en este dispositivo solo por volumen. No oye tus palabras y no da puntaje.")}</p>${sp.measures.map((m, i) => html`<div class="pd-take"><strong>${I.T("Try", "Intento")} ${i + 1}</strong><ul>${describeSpeech(m, [20, S.maxSeconds]).map((d) => html`<li>${d.text}</li>`)}</ul></div>`)}</section>` : ""}
    ${took ? html`<section aria-labelledby="pd-say"><h3 id="pd-say">${I.T("Type what you said (optional)", "Escribe lo que dijiste (opcional)")}</h3><p class="fine">${I.T("The lab cannot hear words. If you type them, you get feedback on your explanation. Your teacher or partner can listen to the recording.", "El laboratorio no oye palabras. Si las escribes, recibes retroalimentación sobre tu explicación. Tu docente o compañero puede escuchar la grabación.")}</p>
      ${[0, 1].filter((i) => i < Math.max(took, 1) + (sp.transcripts[1] ? 1 : 0)).map((i) => html`<label class="field"><span>${I.T("Try", "Intento")} ${i + 1}</span><textarea rows="3" data-pd-transcript="${i}">${sp.transcripts[i]}</textarea></label>`)}
      ${speakFeedback(J, s, I, stage)}</section>` : ""}
    ${took ? html`<fieldset class="pd-checks"><legend>${I.T("Self-check", "Autoevaluación")}</legend>${S.checks.map((c) => html`<label class="pd-opt"><input type="checkbox" data-pd-speakcheck="${c.id}" ${sp.checks[c.id] ? raw("checked") : ""}> <span>${c.text}</span></label>`)}<p class="fine">${S.selfCheckNote}</p></fieldset>` : ""}
    ${mode === "supported" && took ? html`<section class="pd-model" aria-labelledby="pd-model"><h3 id="pd-model">${I.T("Model answer (after your try)", "Respuesta modelo (después de tu intento)")}</h3><p>${S.model}</p><button type="button" class="btn small" data-say="${S.model}">${icon("volume")} ${I.T("Hear the model", "Escuchar el modelo")}</button><p class="fine">${I.T("Record again and add one detail you noticed in the model.", "Graba otra vez y añade un detalle que notaste en el modelo.")}</p></section>` : ""}
    <details class="helpers"><summary>${icon("teacher")} ${I.T("For a teacher or partner: practice rating sheet", "Para docente o compañero: hoja de valoración de práctica")}</summary>${teacherSheet(I)}</details></section>`;
}

function speakFeedback(J, s, I, stage) {
  const text = s.speak.transcripts.filter(Boolean).at(-1);
  if (!text) return "";
  const a = analyzeResponse(text, { keyUse: "Explain", modality: "speaking", stage, sourceTerms: J.writing.sourceTerms });
  const strengths = a.strengths.slice(0, 2);
  return html`<div class="feedback is-right"><p class="fb-title">${icon("check")} ${I.T("What your explanation does", "Lo que hace tu explicación")}</p><ul>${strengths.length ? strengths.map((x) => html`<li>${x.text}</li>`) : html`<li>${I.T("Say a little more to see what your explanation does.", "Di un poco más para ver lo que hace tu explicación.")}</li>`}</ul></div>
    ${a.nextMoves.slice(0, 1).map((m) => html`<div class="feedback is-hint"><p class="fb-title">${icon("retry")} ${m.title}</p><p>${m.why}</p><p><strong>${I.T("Try:", "Prueba:")}</strong> ${m.ask}</p>${stage === "supported" && m.frame ? html`<p class="fine">${m.frame}</p>` : ""}</div>`)}`;
}

const teacherSheet = (I) => html`<table class="pd-table"><caption>${I.T("Practice descriptors (EduWonderLab's own, organized by WIDA language dimension; not WIDA's rubric)", "Descriptores de práctica (propios de EduWonderLab, organizados por dimensión de lenguaje de WIDA; no son la rúbrica de WIDA)")}</caption><thead><tr><th scope="col">${I.T("Dimension", "Dimensión")}</th><th scope="col">${I.T("Not yet seen", "Aún no se ve")}</th><th scope="col">${I.T("Beginning to show", "Empieza a mostrarse")}</th><th scope="col">${I.T("Shown clearly", "Se muestra con claridad")}</th></tr></thead><tbody>
  <tr><th scope="row">Discourse</th><td>Ideas not connected to the picture</td><td>Names the cause or the solution</td><td>Cause, steps and result in order</td></tr>
  <tr><th scope="row">Sentence</th><td>Single words or fragments</td><td>Some full sentences</td><td>Links ideas with because, so, then</td></tr>
  <tr><th scope="row">Word/Phrase</th><td>General words only</td><td>Some topic words</td><td>Precise words: runoff, absorb, filter</td></tr></tbody></table>`;

export function writeStage(J, s, I, mode) {
  const W = J.writing;
  const w = s.write;
  const stage = stageOf(w);
  const opts = writingOptions(J, stage);
  const fb1 = w.gotFeedback && w.draft1.trim() ? analyzeResponse(w.draft1, opts) : null;
  const cmp = w.draft2.trim() && w.draft1.trim() ? compareDrafts(w.draft1, w.draft2, opts) : null;
  return html`<section aria-labelledby="pd-h"><h2 id="pd-h">${I.T("Writing", "Escribir")}: ${W.title}</h2>${badge(I, mode)}
    <p class="prompt-text">${W.prompt}</p>
    ${mode === "supported" ? html`<section><h3>${I.T("Sentence frames", "Marcos de oraciones")}</h3><ul>${W.frames.map((f) => html`<li>${f}</li>`)}</ul><p class="fine">${I.T("Word bank:", "Banco de palabras:")} ${W.wordBank.join(", ")}</p></section>${vocabHTML(J, I)}` : ""}
    <label class="field"><span><strong>${I.T("First draft", "Primer borrador")}</strong></span><textarea rows="7" data-pd-draft="1" ${w.gotFeedback ? raw("readonly") : ""}>${w.draft1}</textarea></label>
    ${w.gotFeedback ? "" : html`<button type="button" class="btn btn-primary" data-pd-feedback ${w.draft1.trim().split(/\s+/).filter(Boolean).length >= 5 ? "" : raw("disabled")}>${I.T("Get feedback on my draft", "Obtener comentarios sobre mi borrador")}</button><p class="fine">${I.T("Feedback is rule-based, runs on this device, and points to your own words. It does not grade you and may miss things.", "Los comentarios se basan en reglas, se calculan en este dispositivo y señalan tus propias palabras. No te califican y pueden pasar cosas por alto.")}</p>`}
    ${fb1 ? draftFeedback(fb1, I, stage) : ""}
    ${fb1 && mode === "supported" ? html`<details class="helpers"><summary>${icon("bulb")} ${I.T("Model argument", "Argumento modelo")}</summary><p>${W.modelDraft}</p></details>` : ""}
    ${fb1 ? html`<label class="field"><span><strong>${I.T("Revised draft", "Borrador revisado")}</strong> ${I.T("(change at least one thing the feedback pointed to)", "(cambia al menos algo que señalaron los comentarios)")}</span><textarea rows="7" data-pd-draft="2">${w.draft2 || w.draft1}</textarea></label>` : ""}
    ${cmp ? compareHTML(cmp, I) : ""}
    ${cmp ? html`<label class="field"><span><strong>${I.T("Reflection", "Reflexión")}</strong>: ${I.T("What did you change, and why?", "¿Qué cambiaste y por qué?")}</span><textarea rows="3" data-pd-reflection>${w.reflection}</textarea></label>` : ""}</section>`;
}

function draftFeedback(a, I, stage) {
  const high = a.errors.filter((e) => e.confidence === "high").slice(0, 2);
  return html`<section aria-labelledby="pd-fb"><h3 id="pd-fb">${I.T("Feedback on your first draft", "Comentarios sobre tu primer borrador")}</h3>
    ${a.strengths.length ? html`<div class="feedback is-right"><p class="fb-title">${icon("check")} ${I.T("Already working", "Ya funciona")}</p><ul>${a.strengths.slice(0, 3).map((x) => html`<li><strong>${x.dimension}.</strong> ${x.text}</li>`)}</ul></div>` : ""}
    ${a.nextMoves.map((m) => html`<div class="feedback is-hint"><p class="fb-title">${icon("retry")} <strong>${m.dimension}.</strong> ${m.title}</p><p>${m.why}</p><p><strong>${I.T("Try:", "Prueba:")}</strong> ${m.ask}</p>${stage === "supported" && m.frame ? html`<p class="fine">${I.T("Frame:", "Marco:")} ${m.frame}</p>` : ""}</div>`)}
    ${high.length ? html`<div class="feedback is-hint"><p class="fb-title">${icon("alert")} ${I.T("Language pattern to check", "Patrón del lenguaje para revisar")}</p><ul>${high.map((e) => html`<li><strong>${e.name}.</strong> “${e.text}”</li>`)}</ul></div>` : ""}</section>`;
}

function compareHTML(c, I) {
  return html`<section class="pd-compare" aria-labelledby="pd-cmp"><h3 id="pd-cmp">${I.T("First draft and revision", "Primer borrador y revisión")}</h3>
    ${c.changes.length || c.gainedMoves.length || c.errorsFixed.length ? html`<ul>${c.changes.map((x) => html`<li>${x.label}: ${x.from} → ${x.to} ${x.unit}</li>`)}${c.gainedMoves.map((m) => html`<li>${I.T("Now:", "Ahora:")} ${m}</li>`)}${c.errorsFixed.map((e) => html`<li>${I.T("Pattern fixed:", "Patrón corregido:")} ${e}</li>`)}</ul>` : html`<p>${I.T("No measurable change yet. Try one move from the feedback.", "Todavía no hay cambios medibles. Prueba un paso de los comentarios.")}</p>`}
    ${c.lostMoves.length || c.errorsNew.length ? html`<p class="fine">${I.T("Check:", "Revisa:")} ${[...c.lostMoves, ...c.errorsNew].join("; ")}</p>` : ""}
    <p class="fine">${I.T("A revision after feedback is saved as a revision, never as a first attempt.", "Una revisión posterior a los comentarios se guarda como revisión, nunca como primer intento.")}</p></section>`;
}
