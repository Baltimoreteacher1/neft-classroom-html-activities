// Task Words: describe, explain, compare, sequence, argue, summarize. For three prompts the learner finds the word
// that says what to do, checks what a complete answer needs, then picks the answer that actually does the task
// (the others answer a different task). Answering the question that was asked is the first thing raters look for.
import { html, icon, raw } from "../util.js";
import { checkBoxes, seededOrder, TASK_WORDS } from "./model.js";
import { PREP_SKILLS } from "./registry.js";
import { checkBtn, choicesHTML, hearBtn, resultHTML } from "./ui.js";

export const skill = PREP_SKILLS["task-words"];
export const finishesOnLastStep = true;

const TASK_ES = {
  Describe: "Describir",
  Explain: "Explicar",
  Compare: "Comparar",
  Sequence: "Ordenar",
  Argue: "Argumentar",
  Summarize: "Resumir",
};

function tableHTML(I) {
  return html`<div class="prep-org-reference">
    <p class="prep-org-label">${icon("reading")} ${I.T("Task Word Graphic Organizer", "Organizador gráfico de palabras de tarea")}</p>
    <dl class="prep-taskwords">
      ${Object.entries(TASK_WORDS).map(
        ([w, d]) =>
          html`<div class="prep-taskword">
            <dt>
              <span class="prep-taskword-verb">${w}</span>
              <span class="prep-es" lang="es">${TASK_ES[w]}</span>
            </dt>
            <dd>${I.T(d[0], d[1])}</dd>
          </div>`,
      )}
    </dl>
  </div>`;
}

const optionsFrom = (list, seed) =>
  seededOrder(
    list.map((t, k) => ({ id: String(k), text: t })),
    seed,
  );

function promptHTML(I, set, i, st) {
  const p = set.prompts[i];
  const word = st.checked?.[`w${i}`];
  const needs = st.checked?.[`n${i}`];
  const ans = st.checked?.[`a${i}`];
  const wordOpts = optionsFrom(p.choices, `${set.id}:w${i}`);
  const rightWord = wordOpts.find((o) => o.text === p.taskText).id;
  const picked = new Set(st.answers?.[`n${i}`] || []);
  return html`<div class="prep-org-prompt">
      <div class="prep-org-prompt-bar">
        <span class="prep-org-kicker">${icon("reading")} ${I.T(`Prompt ${i + 1}`, `Consigna ${i + 1}`)}</span>
        ${hearBtn(I, p.prompt, I.T("Hear the prompt", "Escuchar la consigna"))}
      </div>
      <blockquote class="prep-prompt"><p>${p.prompt}</p></blockquote>
    </div>

    <div class="prep-org-flow">
      <div class="prep-org-stage ${word?.ok ? "is-done" : "is-active"}">
        <div class="prep-org-stage-head">
          <span class="prep-org-num" aria-hidden="true">${word?.ok ? icon("check") : "1"}</span>
          <span class="prep-org-stage-title">${I.T("Spot the Action Word", "Identifica la palabra de acción")}</span>
        </div>
        ${choicesHTML(I, { name: `w${i}`, label: I.T("1. Which word tells you what to do?", "1. ¿Qué palabra te dice qué hacer?"), options: wordOpts, picked: st.answers?.[`w${i}`], answer: rightWord, checked: word ? "mark" : null })}
        ${word?.ok ? "" : checkBtn(I, `check-w-${i}`, Boolean(st.answers?.[`w${i}`]))}
        ${
          word
            ? resultHTML(I, {
                ok: word.ok,
                lead: word.ok
                  ? html`<strong>${p.taskText}</strong>:
                      ${I.T(TASK_WORDS[p.taskWord][0], TASK_WORDS[p.taskWord][1])}`
                  : I.T(
                      "That word names the topic. Find the word that tells you what to DO.",
                      "Esa palabra nombra el tema. Busca la palabra que te dice qué HACER.",
                    ),
              })
            : ""
        }
      </div>
    ${
      word?.ok
        ? html`<div class="prep-org-stage ${needs?.ok ? "is-done" : "is-active"}">
              <div class="prep-org-stage-head">
                <span class="prep-org-num" aria-hidden="true">${needs?.ok ? icon("check") : "2"}</span>
                <span class="prep-org-stage-title">${I.T("Build the Answer Checklist", "Arma la lista de partes necesarias")}</span>
              </div>
              <fieldset class="prep-q">
                <legend>
                  ${I.T("2. What must a complete answer include? Check every one.", "2. ¿Qué debe incluir una respuesta completa? Marca cada una.")}
                </legend>
                <div class="choices">
                  ${p.needs.map((n) => {
                    const on = picked.has(n.id);
                    const state = needs && on ? (n.right ? "is-right" : "is-wrong") : "";
                    return html`<label class="choice ${on ? "is-on" : ""} ${state}">
                      <input
                        type="checkbox"
                        value="${n.id}"
                        data-prep-box="n${i}"
                        ${on ? raw("checked") : ""}
                        ${needs?.ok ? raw("disabled") : ""}
                        data-nsr-ignore
                      />
                      <span class="opt-text">${n.text}</span>
                    </label>`;
                  })}
                </div>
              </fieldset>
              ${needs?.ok ? "" : checkBtn(I, `check-n-${i}`, picked.size > 0)}
              ${
                needs
                  ? resultHTML(I, {
                      ok: needs.ok,
                      lead: needs.ok
                        ? I.T(
                            "Those are the parts this task needs.",
                            "Esas son las partes que necesita esta tarea.",
                          )
                        : [
                            needs.wrong.length
                              ? I.T(
                                  `${needs.wrong.length === 1 ? "One choice belongs" : `${needs.wrong.length} choices belong`} to a different task word.`,
                                  `${needs.wrong.length === 1 ? "Una opción pertenece" : `${needs.wrong.length} opciones pertenecen`} a otra palabra de tarea.`,
                                )
                              : "",
                            needs.missed.length
                              ? I.T(
                                  `${needs.missed.length === 1 ? "One more part is" : `${needs.missed.length} more parts are`} still unchecked.`,
                                  `${needs.missed.length === 1 ? "Falta marcar una parte" : `Faltan ${needs.missed.length} partes`}.`,
                                )
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" "),
                    })
                  : ""
              }
            </div>`
        : ""
    }
    ${
      needs?.ok
        ? html`<div class="prep-org-stage ${ans?.ok ? "is-done" : "is-active"}">
            <div class="prep-org-stage-head">
              <span class="prep-org-num" aria-hidden="true">${ans?.ok ? icon("check") : "3"}</span>
              <span class="prep-org-stage-title">${I.T("Choose the Complete Response", "Elige la respuesta completa")}</span>
            </div>
            ${choicesHTML(I, { name: `a${i}`, label: I.T("3. Which answer does the task?", "3. ¿Qué respuesta cumple la tarea?"), options: p.answers, picked: st.answers?.[`a${i}`], answer: p.answer, checked: ans ? "mark" : null })}
            ${ans?.ok ? "" : checkBtn(I, `check-a-${i}`, Boolean(st.answers?.[`a${i}`]))}
            ${
              ans
                ? resultHTML(I, {
                    ok: ans.ok,
                    lead: ans.ok
                      ? p.why
                      : I.T(
                          "That answer does a different task. Which one does what the task word asks?",
                          "Esa respuesta hace otra tarea. ¿Cuál hace lo que pide la palabra de tarea?",
                        ),
                  })
                : ""
            }
          </div>`
        : ""
    }
    </div>`;
}

export function body(I, set, st, step) {
  if (step === 0)
    return html`<p class="prep-lede">
        ${I.T("Every prompt has a task word. It tells you what kind of answer to give.", "Cada consigna tiene una palabra de tarea. Te dice qué tipo de respuesta dar.")}
      </p>
      ${tableHTML(I)}`;
  if (step <= 3) return promptHTML(I, set, step - 1, st);
  return html`<div class="feedback is-right" role="status">
      <p class="fb-title">${icon("check")} ${I.T("Set complete", "Conjunto completo")}</p>
      <p class="fb-lead">
        ${I.T("You found the task word and chose the answer that does the task, three times.", "Encontraste la palabra de tarea y elegiste la respuesta que cumple la tarea, tres veces.")}
      </p>
    </div>
    <ul class="prep-review">
      ${set.prompts.map((p) => html`<li><strong>${p.taskText}</strong>: ${I.T(TASK_WORDS[p.taskWord][0], TASK_WORDS[p.taskWord][1])}</li>`)}
    </ul>
    <p class="fine">
      ${I.T("On any test, circle the task word first. Then check your answer does that job.", "En cualquier examen, encierra primero la palabra de tarea. Luego revisa que tu respuesta haga ese trabajo.")}
    </p>
    <p>
      <button type="button" class="btn" data-prep-act="restart">
        ${icon("replay")} ${I.T("Do this set again", "Hacer este conjunto otra vez")}
      </button>
    </p>`;
}

export function ready(set, st, step) {
  if (step >= 1 && step <= 3) return Boolean(st.checked?.[`a${step - 1}`]?.ok);
  return true;
}

export function notReady(I, set, st, step) {
  if (step >= 1 && step <= 3)
    return I.S(
      "Finish all three parts of this prompt first.",
      "Primero termina las tres partes de esta consigna.",
    );
  return "";
}

export function act(name, el, set, st) {
  st.checked ||= {};
  const m = /^check-([wna])-(\d)$/.exec(name);
  if (!m) return false;
  const [, part, n] = m;
  const i = Number(n);
  const p = set.prompts[i];
  if (part === "w") {
    const opt = optionsFrom(p.choices, `${set.id}:w${i}`).find(
      (o) => o.id === st.answers?.[`w${i}`],
    );
    st.checked[`w${i}`] = { ok: opt?.text === p.taskText };
  } else if (part === "n") st.checked[`n${i}`] = checkBoxes(p.needs, st.answers?.[`n${i}`] || []);
  else st.checked[`a${i}`] = { ok: st.answers?.[`a${i}`] === p.answer };
  return { focus: ".prep-step .feedback:last" };
}
