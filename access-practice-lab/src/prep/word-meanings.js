// Two Meanings: school words with an everyday meaning and a content-area meaning (table, volume, product, mass…).
// Meet four words, decide which meaning each sentence uses, answer test-style questions, then write a sentence that
// uses one word the school way. ACCESS items lean on exactly these words.
import { html, icon, raw } from "../util.js";
import { checkChoice, wordSentenceCheck } from "./model.js";
import { PREP_SKILLS } from "./registry.js";
import { checkBtn, choicesHTML, hearBtn, resultHTML } from "./ui.js";

export const skill = PREP_SKILLS["word-meanings"];

const subjectEs = {
  Math: "Matemáticas",
  Science: "Ciencias",
  "Social Studies": "Estudios sociales",
  "Language Arts": "Lengua",
};
const schoolLabel = (I, set) =>
  I.T(`${set.area} meaning`, `Significado de ${subjectEs[set.area] || set.area}`);
const everydayLabel = (I) => I.T("Everyday meaning", "Significado de todos los días");

function wordCardsHTML(I, set) {
  return html`<ul class="prep-wordcards">
    ${set.words.map(
      (w) =>
        html`<li class="prep-wordcard">
          <p class="prep-wordcard-w"><strong>${w.w}</strong> ${hearBtn(I, w.w)}</p>
          <div class="prep-meaning is-everyday">
            <p class="prep-meaning-h">
              ${everydayLabel(I)} <span class="prep-es" lang="es">(${w.es.everyday})</span>
            </p>
            <p>${w.everyday.def}</p>
            <p class="prep-ex">${w.everyday.ex}</p>
          </div>
          <div class="prep-meaning is-school">
            <p class="prep-meaning-h">
              ${schoolLabel(I, set)} <span class="prep-es" lang="es">(${w.es.school})</span>
            </p>
            <p>${w.school.def}</p>
            <p class="prep-ex">${w.school.ex}</p>
          </div>
        </li>`,
    )}
  </ul>`;
}

/** Bold the target word inside a sentence (any simple form), escaped. */
function markWord(sentence, word) {
  const esc = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const stem = word.slice(0, Math.max(3, word.length - 1)).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return raw(esc(sentence).replace(new RegExp(`\\b(${stem}[a-z]*)`, "i"), "<strong>$1</strong>"));
}

function sortHTML(I, set, st) {
  const res = st.checked?.sort;
  return html`<p class="prep-lede">
      ${I.T("Read each sentence. Which meaning of the bold word does it use?", "Lee cada oración. ¿Qué significado de la palabra en negrita usa?")}
    </p>
    ${set.sort.map((x, i) => {
      const r = res?.[i];
      return html`<fieldset class="prep-q prep-sort ${r ? (r.ok ? "is-right" : "is-wrong") : ""}">
        <legend>
          <span class="prep-qn">${i + 1}.</span> ${markWord(x.s, x.word)}
          ${r ? icon(r.ok ? "check" : "x") : ""}
        </legend>
        <div class="prep-toggle" role="radiogroup">
          ${["everyday", "school"].map((m) => {
            const on = st.answers?.[`s${i}`] === m;
            return html`<label class="${on ? "is-on" : ""}">
              <input
                type="radio"
                name="s${i}"
                value="${m}"
                data-prep-pick="s${i}"
                ${on ? raw("checked") : ""}
                ${r?.ok ? raw("disabled") : ""}
                data-nsr-ignore
              />
              ${m === "school" ? schoolLabel(I, set) : everydayLabel(I)}
            </label>`;
          })}
        </div>
      </fieldset>`;
    })}
    ${
      res?.every((r) => r.ok)
        ? ""
        : checkBtn(
            I,
            "check-sort",
            set.sort.every((_, i) => st.answers?.[`s${i}`]),
            I.T("Check my answers", "Revisar mis respuestas"),
          )
    }
    ${
      res
        ? resultHTML(I, {
            ok: res.every((r) => r.ok),
            lead: res.every((r) => r.ok)
              ? I.T(
                  "You read the clues around each word.",
                  "Leíste las pistas alrededor de cada palabra.",
                )
              : I.T(
                  `${res.filter((r) => r.ok).length} of ${res.length} are right. Look at the words around the bold word: are they about ${set.area.toLowerCase()} or everyday life?`,
                  `${res.filter((r) => r.ok).length} de ${res.length} están bien. Mira las palabras alrededor de la palabra en negrita: ¿son de ${(subjectEs[set.area] || set.area).toLowerCase()} o de la vida diaria?`,
                ),
          })
        : ""
    }`;
}

function questionsHTML(I, set, st) {
  const res = st.checked?.questions;
  return html`${set.questions.map((q, i) => {
    const r = res?.[i];
    return html`<div class="prep-qwrap">
      ${choicesHTML(I, { name: `q${i}`, label: html`<span class="prep-qn">${i + 1}.</span> ${q.q}`, options: q.options, picked: st.answers?.[`q${i}`], answer: q.answer, checked: r ? "mark" : null })}
      ${r ? html`<p class="prep-qres ${r.ok ? "is-right" : "is-wrong"}">${icon(r.ok ? "check" : "retry")} ${r.ok ? r.why : I.T("Not yet. Find the clue words in the sentence, then choose again.", "Todavía no. Busca las palabras pista en la oración y elige otra vez.")}</p>` : ""}
    </div>`;
  })}
  ${checkBtn(
    I,
    "check-questions",
    set.questions.every((_, i) => st.answers?.[`q${i}`]),
    I.T("Check my answers", "Revisar mis respuestas"),
  )}`;
}

function writeHTML(I, set, st) {
  const w = set.words.find((x) => x.w === set.write.word);
  const text = st.answers?.mine || "";
  const c = wordSentenceCheck(w.w, text);
  return html`<div class="prep-meaning is-school">
      <p class="prep-meaning-h"><strong>${w.w}</strong> · ${schoolLabel(I, set)}</p>
      <p>${w.school.def}</p>
    </div>
    <label class="prep-write" for="prepMine"><strong>${set.write.prompt}</strong></label>
    <textarea
      id="prepMine"
      class="prep-textarea"
      rows="3"
      data-prep-text="mine"
      data-nsr-ignore
      aria-describedby="prepCheckH"
    >
${text}</textarea>
    <h3 id="prepCheckH" class="prep-sub">${I.T("Your sentence", "Tu oración")}</h3>
    <ul id="prepChecklist" class="prep-checklist" aria-live="polite">
      ${checkRow(I, c.word, `Uses the word ${w.w}`, `Usa la palabra ${w.w}`)}
      ${checkRow(I, c.sentence, "Is a full sentence (6 words or more)", "Es una oración completa (6 palabras o más)")}
    </ul>
    ${set.write.clues?.length ? html`<p class="fine">${I.T("Words that can help:", "Palabras que pueden ayudar:")} ${set.write.clues.join(", ")}</p>` : ""}
    <details class="fb-more">
      <summary>
        ${I.T("See and hear a model sentence", "Ver y escuchar una oración modelo")}
      </summary>
      <p class="prep-model">${set.write.model} ${hearBtn(I, set.write.model)}</p>
    </details>
    <p>
      <button
        type="button"
        class="btn btn-primary"
        data-prep-act="finish"
        ${c.word && c.sentence ? "" : raw("disabled")}
      >
        ${icon("check")} ${I.T("I'm done", "Terminé")}
      </button>
      ${st.done ? html`<span class="prep-set-done">${icon("check")} ${I.T("Saved on this device", "Guardado en este dispositivo")}</span>` : ""}
    </p>`;
}

const checkRow = (I, ok, en, es) =>
  html`<li class="${ok ? "is-met" : ""}">
    ${icon(ok ? "check" : "x")} <span>${I.T(en, es)}</span
    ><span class="visually-hidden"
      >${ok ? I.T(" — done", " — listo") : I.T(" — not yet", " — todavía no")}</span
    >
  </li>`;

export function body(I, set, st, step) {
  if (step === 0)
    return html`<p class="prep-lede">
        ${I.T("Each word has two meanings. Read both and listen to the word.", "Cada palabra tiene dos significados. Lee los dos y escucha la palabra.")}
      </p>
      ${wordCardsHTML(I, set)}`;
  if (step === 1) return sortHTML(I, set, st);
  if (step === 2) return questionsHTML(I, set, st);
  return writeHTML(I, set, st);
}

export function ready(set, st, step) {
  if (step === 1) return Boolean(st.checked?.sort?.every((r) => r.ok));
  if (step === 2) return Boolean(st.checked?.questions?.every((r) => r?.ok));
  return true;
}

export function notReady(I, set, st, step) {
  if (step === 1)
    return I.S("Get every sentence right first.", "Primero responde bien cada oración.");
  if (step === 2)
    return I.S("Get every question right first.", "Primero responde bien cada pregunta.");
  return "";
}

/** Typing updates the two checklist rows and the Done button in place. */
export function onText(key, set, st) {
  const list = key === "mine" && document.getElementById("prepChecklist");
  if (!list) return;
  const c = wordSentenceCheck(set.write.word, st.answers.mine);
  const es = document.documentElement.lang === "es";
  [c.word, c.sentence].forEach((ok, i) => {
    const li = list.children[i];
    if (!li) return;
    li.classList.toggle("is-met", ok);
    const use = li.querySelector("use");
    use?.setAttribute(
      "href",
      use.getAttribute("href").replace(/#(check|x)$/, `#${ok ? "check" : "x"}`),
    );
    const sr = li.querySelector(".visually-hidden");
    if (sr)
      sr.textContent = ok ? (es ? " — listo" : " — done") : es ? " — todavía no" : " — not yet";
  });
  const done = document.querySelector("[data-prep-act=finish]");
  if (done) done.disabled = !(c.word && c.sentence);
}

export function act(name, el, set, st) {
  st.checked ||= {};
  if (name === "check-sort") {
    st.checked.sort = set.sort.map((x, i) => ({ ok: st.answers?.[`s${i}`] === x.meaning }));
    const wrong = st.checked.sort.findIndex((r) => !r.ok);
    return { focus: wrong >= 0 ? `input[name=s${wrong}]` : ".prep-step .feedback" };
  }
  if (name === "check-questions") {
    st.checked.questions = set.questions.map((q, i) => checkChoice(q, st.answers?.[`q${i}`]));
    const wrong = st.checked.questions.findIndex((r) => !r?.ok);
    return { focus: wrong >= 0 ? `input[name=q${wrong}]` : "[data-prep-act=next]" };
  }
  if (name === "finish") return { finish: true, focus: "[data-prep-act=finish]" };
  return false;
}
