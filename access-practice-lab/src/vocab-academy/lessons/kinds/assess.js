// Lesson H: Review and Assess. Five steps: form A, what the evidence shows, explain-and-practice, parallel form B, growth.
// Forms come from assessment.js (pure). Nothing here is a standardized score or a proficiency claim: results describe
// how specific WORDS went on one short form. Answers and explanations are never in the markup before submitting, and the
// written response is teacher-reviewed, never auto-scored.
import { html, toHtml } from "../../../util.js";
import { DIM_LABEL, STATE_LABEL } from "../../contract.js";
import { buildAssessment, compareAttempts, evidenceRows, feedbackPlan, scoreAssessment, summarizeResult } from "../../assessment.js";
import { assessListHTML, listenText, mountItems } from "../item-ui.js";
import { passageHTML, sayButton, say } from "../ui.js";
import { vaHref } from "../../data.js";

const KEY = "h-assess";
const form = (S, f) => (S.forms ||= {})[f] ||= buildAssessment(S.unit, f, { seed: 0 });
const rec = (S, f) => ((S.stepData(KEY)[f] ||= { answers: {}, text: "", summary: null }));
const stepIndex = (S, id) => S.steps.findIndex((s) => s.id === id);
const dimName = (I, d) => (DIM_LABEL[d] ? I.T(...DIM_LABEL[d]) : d);
const stateName = (I, s) => (STATE_LABEL[s] ? I.T(...STATE_LABEL[s]) : s);
const stateIcon = (s) => ({ new: "○", learning: "◔", developing: "◑", applying: "◕", secure: "●", "review-needed": "↻" })[s] || "○";

const missing = (S, text, goId) => {
  const { I } = S;
  return html`<div class="val-empty"><p>${text}</p><button type="button" class="btn btn-primary val-btn" data-val-go="${goId}">${I.T("Go there", "Ir allí")}</button></div>`;
};

// ── forms A and B ───────────────────────────────────────────────────────────────────────────────────────────
function formHTML(S, step) {
  const { I, unit } = S;
  const f = step.part;
  const r = rec(S, f);
  const fm = form(S, f);
  if (r.summary)
    return html`<div class="val-assess-done"><p class="val-feedback is-right"><span aria-hidden="true">✓</span> <strong>${I.T(`Form ${f} is finished.`, `La forma ${f} está terminada.`)}</strong>
        ${I.T(`You answered ${r.summary.score} of ${r.summary.total} questions correctly. This is practice on these words, not an official score.`, `Respondiste correctamente ${r.summary.score} de ${r.summary.total} preguntas. Esto es práctica con estas palabras, no un puntaje oficial.`)}</p>
      ${r.text ? html`<p class="val-note">${I.T("Your written response is saved for your teacher to read. It is not scored here.", "Tu respuesta escrita está guardada para que tu docente la lea. Aquí no se califica.")}</p>` : ""}
      <p class="val-actions"><button type="button" class="btn val-btn" data-val-retake="${f}">${I.T(`Take form ${f} again`, `Hacer la forma ${f} otra vez`)}</button>
        <button type="button" class="btn btn-primary val-btn" data-val-next-step>${I.T("Continue", "Continuar")}</button></p></div>`;
  const hasPassage = fm.items.some((i) => i.type === "passage") && unit.passage?.paras?.length;
  const c = fm.constructed[0];
  return html`<div class="val-assess">
    <p class="val-note">${f === "A" ? I.T("This is a short check of these words. Choose one answer for each question. You will see how it went after you submit, with help for any word that needs it.", "Esta es una comprobación corta de estas palabras. Elige una respuesta para cada pregunta. Verás cómo te fue después de enviar, con ayuda para las palabras que la necesiten.") : I.T("Same words, different sentences. Choose one answer for each question. After you submit, you can see how the words went since form A.", "Las mismas palabras, otras oraciones. Elige una respuesta para cada pregunta. Después de enviar, verás cómo fueron las palabras desde la forma A.")}</p>
    ${fm.items.length < 10 ? html`<p class="val-note">${I.T(`This short unit has ${fm.items.length} questions on this form.`, `Esta unidad corta tiene ${fm.items.length} preguntas en esta forma.`)}</p>` : ""}
    ${hasPassage ? html`<details class="val-passage-ref" open><summary>${I.T("Passage for the questions", "Lectura para las preguntas")}: <span lang="en">${unit.passage.title}</span></summary><div class="val-passage" lang="en">${passageHTML(unit, { tappable: false })}</div></details>` : ""}
    <div data-val-aform role="group" aria-label="${I.S(`Form ${f} questions`, `Preguntas de la forma ${f}`)}">
      ${assessListHTML(I, fm.items, r.answers, { passage: hasPassage, audio: S.sup.audio || S.early })}
      ${c ? html`<section class="val-constructed" aria-labelledby="val-cons-h"><h3 id="val-cons-h">${I.T("Written response", "Respuesta escrita")}</h3>
        <p lang="en">${c.prompt}</p>
        ${c.look.length ? html`<details open><summary>${I.T("What a strong answer shows", "Qué muestra una buena respuesta")}</summary><ul lang="en">${c.look.map((l) => html`<li>${l}</li>`)}</ul></details>` : ""}
        <label class="val-field"><span>${I.T("Your answer", "Tu respuesta")} <span class="val-note">(${I.T("your teacher reads this; it is not scored here", "tu docente la lee; aquí no se califica")})</span></span>
        <textarea data-val-cons rows="5" maxlength="2000" lang="en">${r.text}</textarea></label></section>` : ""}
      <p class="val-feedback" data-val-assess-msg role="status" aria-live="polite" tabindex="-1"></p>
      <p class="val-actions"><button type="button" class="btn btn-primary val-btn" data-val-submit="${f}">${I.T(`Submit form ${f}`, `Enviar la forma ${f}`)}</button></p>
    </div></div>`;
}

function submitForm(S, step, el, confirmed) {
  const { I, unit } = S;
  const f = step.part;
  const fm = form(S, f);
  const r = rec(S, f);
  el.querySelectorAll("input[data-val-aid]:checked").forEach((x) => {
    r.answers[x.dataset.valAid] = Number(x.value);
  });
  const text = (el.querySelector("[data-val-cons]")?.value || "").trim();
  r.text = text;
  const blank = fm.items.filter((i) => !Number.isInteger(r.answers[i.id]));
  const msg = el.querySelector("[data-val-assess-msg]");
  if (blank.length && !confirmed.v) {
    confirmed.v = true;
    msg.className = "val-feedback is-wrong";
    msg.textContent = I.S(`${blank.length} question${blank.length === 1 ? " has" : "s have"} no answer. Answer ${blank.length === 1 ? "it" : "them"}, or press Submit again to finish anyway.`, `${blank.length} pregunta(s) sin respuesta. Respóndela(s) o presiona Enviar otra vez para terminar así.`);
    msg.focus({ preventScroll: true });
    el.querySelector(`[data-val-aid="${blank[0].id}"]`)?.focus();
    return false;
  }
  const result = { ...scoreAssessment(fm.items, r.answers), form: f };
  const now = new Date().toISOString();
  r.summary = summarizeResult(result, f, now);
  for (const row of evidenceRows(fm.items, result)) S.evidence({ wordId: row.wordId, dim: row.dim, ok: row.ok, type: row.type, sup: [] });
  try {
    S.deps.model.recordAssessment(S.progress, unit.id, f, { score: result.score, total: result.total, perWord: result.perWord });
  } catch (error) {
    console.warn("[vocab-academy] could not record the assessment", error);
  }
  const c = fm.constructed[0];
  if (c && text) S.drafts({ id: `${unit.id}:H:${f}:${c.id}`, kind: "constructed", lesson: "h", form: f, prompt: c.prompt, wordIds: c.wordIds, text, awaiting: "teacher" });
  S.markDone(step.id);
  S.persist();
  return true;
}

// ── evidence ────────────────────────────────────────────────────────────────────────────────────────────────
function evidenceHTML(S) {
  const { I, unit } = S;
  const a = rec(S, "A").summary;
  if (!a) return missing(S, I.T("Take form A first. Then this page shows how each word went.", "Haz primero la forma A. Luego esta página muestra cómo fue cada palabra."), "h-form-a");
  const plan = feedbackPlan({ ...a, form: "A" }, unit);
  const byId = new Map(unit.words.map((w) => [w.id, w]));
  return html`<div class="val-evidence">
    <p>${I.T(`On form A you answered ${a.score} of ${a.total} questions correctly. That is practice on these words. It is not an official WIDA or ACCESS score, and it does not predict one.`, `En la forma A respondiste correctamente ${a.score} de ${a.total} preguntas. Es práctica con estas palabras. No es un puntaje oficial de WIDA ni de ACCESS y no lo predice.`)}</p>
    <table class="val-table"><caption>${I.T("How each word went on form A", "Cómo fue cada palabra en la forma A")}</caption>
      <thead><tr><th scope="col">${I.T("Word", "Palabra")}</th><th scope="col">${I.T("Questions right", "Preguntas correctas")}</th><th scope="col">${I.T("Next step", "Siguiente paso")}</th></tr></thead>
      <tbody>${Object.entries(a.perWord).map(([id, v]) => html`<tr><th scope="row" lang="en">${byId.get(id)?.hw || id}</th><td>${v.c} ${I.T("of", "de")} ${v.n}</td><td>${v.ok ? html`<span aria-hidden="true">✓</span> ${I.T("Going well", "Va bien")}` : html`<span aria-hidden="true">↻</span> ${I.T("Needs practice", "Necesita práctica")}`}</td></tr>`)}</tbody></table>
    <h3>${I.T("By kind of question", "Por tipo de pregunta")}</h3>
    <ul class="val-dims">${Object.entries(a.byDim).map(([d, v]) => html`<li>${dimName(I, d)}: ${v.c} ${I.T("of", "de")} ${v.n}</li>`)}</ul>
    ${plan.needs.length ? html`<p>${I.T(`${plan.needs.length} word${plan.needs.length === 1 ? "" : "s"} will get an explanation and practice in the next step.`, `${plan.needs.length} palabra(s) tendrán una explicación y práctica en el siguiente paso.`)}</p>` : html`<p>${I.T("Every word was answered correctly on this form. Keep them fresh in Review.", "Todas las palabras se respondieron bien en esta forma. Mantenlas frescas en Repaso.")}</p>`}
    ${rec(S, "A").text ? html`<p class="val-note">${I.T("Your written response is saved for your teacher. It is read by a person, not scored here.", "Tu respuesta escrita está guardada para tu docente. La lee una persona; aquí no se califica.")}</p>` : ""}
  </div>`;
}

// ── explain and practice ────────────────────────────────────────────────────────────────────────────────────
function practiceHTML(S) {
  const { I, unit } = S;
  const a = rec(S, "A").summary;
  if (!a) return missing(S, I.T("Take form A first. Then you get an explanation and practice for the words that need it.", "Haz primero la forma A. Luego recibes explicación y práctica para las palabras que la necesiten."), "h-form-a");
  const plan = feedbackPlan({ ...a, form: "A" }, unit);
  if (!plan.needs.length) return html`<p class="val-feedback is-right"><span aria-hidden="true">✓</span> ${I.T("No word needs extra practice from form A. Go on to form B, or finish for now.", "Ninguna palabra necesita práctica extra de la forma A. Sigue con la forma B o termina por ahora.")}</p>`;
  return html`<div class="val-practice">
    <h3>${I.T("Look at these words again", "Mira estas palabras otra vez")}</h3>
    ${plan.explanations.map((e) => html`<article class="val-explain" aria-label="${e.hw}"><h4 lang="en">${e.hw} <span class="val-pron">${e.pron}</span> ${sayButton(I, e.hw, I.T("Hear it", "Escúchala"))}</h4>
      <p><strong>${I.T("Meaning", "Significado")}:</strong> <span lang="en">${e.def}</span></p>
      <p><strong>${I.T("Example", "Ejemplo")}:</strong> <span lang="en">${e.ex}</span></p>
      ${e.nonExample ? html`<p><strong>${I.T("Not an example", "No es un ejemplo")}:</strong> <span lang="en">${e.nonExample}</span></p>` : ""}
      ${e.note ? html`<p lang="en">${e.note}</p>` : ""}
      ${e.es && (S.sup.glossaryEs || I.mode !== "en") ? html`<p><strong>Español:</strong> <span lang="es">${e.es}</span></p>` : ""}</article>`)}
    <h3>${I.T("Practice", "Práctica")}</h3>
    <p class="val-note">${I.T("These questions match what each word needed. The sentences are new.", "Estas preguntas coinciden con lo que necesitaba cada palabra. Las oraciones son nuevas.")}</p>
    <div data-val-runner></div></div>`;
}

function mountPractice(S, step, el) {
  const a = rec(S, "A").summary;
  if (!a) return;
  const plan = feedbackPlan({ ...a, form: "A" }, S.unit);
  if (!plan.needs.length) {
    S.markDone(step.id);
    return;
  }
  const d = S.stepData(step.id);
  const run = mountItems(el.querySelector("[data-val-runner]"), {
    items: plan.practice,
    I: S.I,
    audio: S.sup.audio || S.early,
    saved: d.results || {},
    onResult: (item, r) => S.evidence({ wordId: item.wordId, dim: item.dim, ok: r.ok, type: "assess-practice", sup: [] }),
    onResolved: (item, r) => {
      d.results = { ...(d.results || {}), [item.id]: { ok: r.ok, tries: r.tries, revealed: Boolean(r.revealed) } };
      S.save();
    },
    onDone: () => S.markDone(step.id),
  });
  S.cleanups.push(() => run.destroy());
}

// ── growth ──────────────────────────────────────────────────────────────────────────────────────────────────
const KIND = {
  gained: ["Gained", "Ganada", "↑"],
  kept: ["Kept", "Mantenida", "✓"],
  building: ["Still building", "Aún en construcción", "◔"],
  revisit: ["Worth another look", "Vale otro vistazo", "↻"],
  noData: ["Not on both forms", "No está en ambas formas", "–"],
};
const LINE = {
  gained: (n, I) => I.T(`${n} word${n === 1 ? "" : "s"} you missed on form A, you got right on form B.`, `${n} palabra(s) que fallaste en la forma A, las acertaste en la forma B.`),
  kept: (n, I) => I.T(`${n} word${n === 1 ? "" : "s"} went well on both forms.`, `${n} palabra(s) salieron bien en ambas formas.`),
  building: (n, I) => I.T(`${n} word${n === 1 ? " is" : "s are"} still being built. They will come back in Review.`, `${n} palabra(s) siguen en construcción. Volverán en el Repaso.`),
  revisit: (n, I) => I.T(`${n} word${n === 1 ? "" : "s"} were right on form A and missed on form B. That happens. Look at them again.`, `${n} palabra(s) estuvieron bien en la forma A y fallaron en la B. Pasa. Míralas otra vez.`),
};

function growthHTML(S) {
  const { I, unit } = S;
  const a = rec(S, "A").summary;
  const b = rec(S, "B").summary;
  if (!a) return missing(S, I.T("Take form A first.", "Haz primero la forma A."), "h-form-a");
  if (!b) return missing(S, I.T("Take form B (same words, different sentences) to see how the words went.", "Haz la forma B (las mismas palabras, otras oraciones) para ver cómo fueron las palabras."), "h-form-b");
  const cmp = compareAttempts(a, b);
  const byId = new Map(unit.words.map((w) => [w.id, w]));
  return html`<div class="val-growth">
    <p>${I.T(`Form A: ${a.score} of ${a.total} questions. Form B: ${b.score} of ${b.total} questions. These are practice forms on the same words, not an official score.`, `Forma A: ${a.score} de ${a.total} preguntas. Forma B: ${b.score} de ${b.total} preguntas. Son formas de práctica con las mismas palabras, no un puntaje oficial.`)}</p>
    <ul class="val-lines">${cmp.lines.map((l) => html`<li>${LINE[l.key](l.n, I)}</li>`)}</ul>
    <table class="val-table"><caption>${I.T("Each word, form A to form B", "Cada palabra, de la forma A a la B")}</caption>
      <thead><tr><th scope="col">${I.T("Word", "Palabra")}</th><th scope="col">${I.T("A", "A")}</th><th scope="col">${I.T("B", "B")}</th><th scope="col">${I.T("What it shows", "Qué muestra")}</th><th scope="col">${I.T("Word status now", "Estado actual")}</th></tr></thead>
      <tbody>${cmp.perWord.map((w) => {
        const st = S.deps.model.wordEntry(S.progress, w.wordId).state;
        return html`<tr><th scope="row" lang="en">${byId.get(w.wordId)?.hw || w.wordId}</th><td>${w.from == null ? "–" : w.from ? I.T("right", "bien") : I.T("missed", "fallada")}</td><td>${w.to == null ? "–" : w.to ? I.T("right", "bien") : I.T("missed", "fallada")}</td>
          <td><span aria-hidden="true">${KIND[w.kind][2]}</span> ${I.T(KIND[w.kind][0], KIND[w.kind][1])}</td><td><span aria-hidden="true">${stateIcon(st)}</span> ${stateName(I, st)}</td></tr>`;
      })}</tbody></table>
    <h3>${I.T("By kind of question", "Por tipo de pregunta")}</h3>
    <ul class="val-dims">${Object.entries(cmp.byDim).map(([d, v]) => html`<li>${dimName(I, d)}: A ${v.from ? `${v.from.c}/${v.from.n}` : "–"} → B ${v.to ? `${v.to.c}/${v.to.n}` : "–"}</li>`)}</ul>
    <p class="val-actions"><a class="btn val-btn" href="${vaHref("review")}">${I.T("Go to Review", "Ir a Repaso")}</a> <a class="btn val-btn" href="${vaHref("practice")}">${I.T("Practice these words", "Practicar estas palabras")}</a></p>
  </div>`;
}

// ── kind interface ──────────────────────────────────────────────────────────────────────────────────────────────
export function htmlOf(S, step) {
  if (step.part === "A" || step.part === "B") return formHTML(S, step);
  if (step.part === "evidence") return evidenceHTML(S);
  if (step.part === "practice") return practiceHTML(S);
  return growthHTML(S);
}

export function mount(S, step, el) {
  const part = step.part;
  const repaint = () => {
    el.innerHTML = toHtml(htmlOf(S, step));
  };
  S.on(el, "click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.matches("[data-val-go]")) S.goto(stepIndex(S, t.dataset.valGo));
    else if (t.matches("[data-val-next-step]")) S.next();
    else if (t.matches("[data-val-retake]")) {
      const f = t.dataset.valRetake;
      const r = rec(S, f);
      r.answers = {};
      r.summary = null;
      delete S.stepData(step.id).done;
      S.persist();
      repaint();
      mountForm();
      el.querySelector("input")?.focus();
    } else if (t.matches("[data-val-listen-item]")) {
      const item = form(S, part).items.find((i) => i.id === t.dataset.valListenItem);
      if (item) say(listenText(item));
    }
  });
  const confirmed = { v: false };
  function mountForm() {
    const f = part;
    const r = rec(S, f);
    if (r.summary) return;
    const root = el.querySelector("[data-val-aform]");
    if (!root) return;
    S.on(root, "change", (e) => {
      const x = e.target;
      if (x.matches?.("input[data-val-aid]")) {
        r.answers[x.dataset.valAid] = Number(x.value);
        confirmed.v = false;
        S.save();
      }
    });
    S.on(root, "input", (e) => {
      if (e.target.matches?.("[data-val-cons]")) {
        r.text = e.target.value;
        S.save();
      }
    });
    S.on(root, "click", (e) => {
      const b = e.target.closest("[data-val-submit]");
      if (!b) return;
      if (submitForm(S, step, root, confirmed)) {
        repaint();
        el.querySelector(".val-assess-done")?.setAttribute("tabindex", "-1");
        el.querySelector(".val-assess-done")?.focus({ preventScroll: false });
        S.announce(S.I.S(`Form ${f} submitted. Your work is saved.`, `Forma ${f} enviada. Tu trabajo está guardado.`));
      }
    });
  }
  if (part === "A" || part === "B") mountForm();
  else if (part === "practice") mountPractice(S, step, el);
  else if (part === "evidence") {
    if (rec(S, "A").summary) S.markDone(step.id);
  } else if (rec(S, "A").summary && rec(S, "B").summary) S.markDone(step.id);
}
