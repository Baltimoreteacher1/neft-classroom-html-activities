// Reading Room learner supports: tiered feedback, evidence highlighting, inline word glosses and the
// write-check-revise loop for open responses. String builders only; reading-room.js owns events and state.
import {
  evidenceParagraphs,
  hintFor,
  paragraphPreview,
  partialCount,
  responseEvidence,
  splitSentences,
} from "../reading-room-check.js";

/** Escape a plain string for HTML text/attributes. */
const esc = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const paraNo = (id) => String(id).replace(/^p/, "");

/** Which paragraphs to outline in the passage: evidence for every activity the learner got right or opened. */
export function evidenceParagraphSet(lesson, progress) {
  const set = new Set();
  for (const a of lesson.activities || []) {
    const ans = progress.answers?.[a.id];
    if (ans?.checked && (ans.correct || ans.revealed))
      for (const id of evidenceParagraphs(a, lesson)) set.add(id);
  }
  return set;
}

/** Sentences the learner chose as evidence for their written answers: Set of "p2:1". */
export function chosenEvidence(progress) {
  return new Set(Object.values(progress.evidence || {}).flat());
}

const termPattern = (term) =>
  new RegExp(`\\b${String(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:s|es|ed|d|ing)?\\b`, "i");

/**
 * Passage text as HTML: every sentence is a span (so evidence can be highlighted), and the first use of each
 * vocabulary word in the lesson becomes a button that opens its gloss. `used` carries glossed terms across paragraphs.
 */
export function paragraphTextHTML(p, lesson, { glossary, chosen, used }) {
  return splitSentences(p.text)
    .map((sentence, si) => {
      let html = "";
      let rest = sentence;
      if (glossary)
        for (const v of lesson.vocabulary || []) {
          if (used.has(v.term)) continue;
          const m = termPattern(v.term).exec(rest);
          if (!m) continue;
          used.add(v.term);
          const attrs = `data-rr-gloss="${esc(v.term)}" data-def="${esc(v.definition)}" data-ex="${esc(v.example)}" data-es="${esc(v.spanish || "")}"`;
          html += `${esc(rest.slice(0, m.index))}<button type="button" class="rr-gloss" ${attrs} aria-expanded="false">${esc(m[0])}</button>`;
          rest = rest.slice(m.index + m[0].length);
        }
      html += esc(rest);
      const marked = chosen.has(`${p.id}:${si}`);
      return marked ? `<mark class="rr-evidence-mark">${html}</mark>` : `<span>${html}</span>`;
    })
    .join(" ");
}

/** One status box for every closed-response activity. Stages: correct, hint (first miss), explained (second miss or asked). */
export function feedbackHTML({ a, ans, lesson, T, ic, note = "", okText, tryText }) {
  if (!ans?.checked) return "";
  const ev = evidenceParagraphs(a, lesson);
  const evLine = ev.length
    ? `<p class="rr-evidence-line"><b>${T("Evidence:", "Evidencia:")}</b> ${T(`paragraph ${ev.map(paraNo).join(", ")}`, `párrafo ${ev.map(paraNo).join(", ")}`)}</p>`
    : "";
  if (ans.correct)
    return `<div role="status" class="feedback is-right"><p class="fb-title">${ic("check")} ${okText}</p><p>${esc(a.rationale)}</p>${evLine}${ans.attempts > 1 ? `<p class="rr-revised">${T("You rechecked the text and revised your answer.", "Volviste al texto y corregiste tu respuesta.")}</p>` : ""}</div>`;
  if (!ans.revealed) {
    const part = partialCount(a, ans);
    const count =
      part.total > 1
        ? `<p>${T(`${part.right} of ${part.total} parts match the text.`, `${part.right} de ${part.total} partes coinciden con el texto.`)}${part.picked != null && part.picked !== part.total ? " " + T(`You chose ${part.picked}; the question needs ${part.total}.`, `Elegiste ${part.picked}; la pregunta necesita ${part.total}.`) : ""}</p>`
        : "";
    const hint = hintFor(a, lesson);
    return `<div role="status" class="feedback is-hint"><p class="fb-title">${ic("bulb")} ${tryText}</p>${note ? `<p class="rr-why"><b>${T("Why that choice does not fit:", "Por qué esa opción no encaja:")}</b> ${esc(note)}</p>` : ""}${count}${hint.text ? `<p class="rr-hint"><b>${T("Hint:", "Pista:")}</b> ${esc(hint.text)}</p>` : ""}<p class="rr-fine">${T("Change your answer and check again, or open the explanation.", "Cambia tu respuesta y revisa otra vez, o abre la explicación.")}</p><button type="button" class="btn small" data-rr-reveal="${esc(a.id)}">${T("Show the explanation", "Mostrar la explicación")}</button></div>`;
  }
  return `<div role="status" class="feedback is-hint"><p class="fb-title">${ic("bulb")} ${T("Here is how the text supports the answer.", "Así apoya el texto la respuesta.")}</p>${note ? `<p class="rr-why"><b>${T("Why that choice does not fit:", "Por qué esa opción no encaja:")}</b> ${esc(note)}</p>` : ""}<p>${esc(a.rationale)}</p>${evLine}</div>`;
}

/** Evidence-choice option text: paragraph number plus its opening words, so the learner need not scroll back. */
export const evidenceOptionText = (lesson, pid, T) => {
  const p = lesson.paragraphs.find((x) => x.id === pid);
  return `<b>${T(`Paragraph ${paraNo(pid)}`, `Párrafo ${paraNo(pid)}`)}</b> <span class="rr-preview">${esc(paragraphPreview(p?.text))}</span>`;
};

/** Sentence picker + checklist + revision history under an open response. */
export function responseSupportHTML({ a, ans = {}, lesson, progress, T, A }) {
  const picked = new Set(progress.evidence?.[a.id] || []);
  const sentences = lesson.paragraphs.map((p) =>
    splitSentences(p.text).map((s, si) => ({ key: `${p.id}:${si}`, p: p.id, s })),
  );
  const chips = [...picked]
    .map((k) => sentences.flat().find((x) => x.key === k))
    .filter(Boolean)
    .map(
      (x) =>
        `<li><q>${esc(x.s)}</q> <span class="rr-fine">${T(`paragraph ${paraNo(x.p)}`, `párrafo ${paraNo(x.p)}`)}</span> <button type="button" class="btn small" data-rr-quote="${esc(a.id)}" data-key="${esc(x.key)}">${T("Add to my answer", "Agregar a mi respuesta")}</button></li>`,
    )
    .join("");
  const picker = `<details class="rr-find-evidence" data-rr-find-box="${esc(a.id)}" ${ans.findOpen ? "open" : ""}><summary>${T("Find evidence in the text", "Busca evidencia en el texto")}</summary><p class="rr-fine">${T("Choose the sentences that support your answer. They are highlighted in the passage.", "Elige las oraciones que apoyan tu respuesta. Se resaltan en el pasaje.")}</p>${sentences
    .map(
      (list, i) =>
        `<fieldset><legend>${T(`Paragraph ${i + 1}`, `Párrafo ${i + 1}`)}</legend>${list.map((x) => `<label class="rr-option"><input type="checkbox" data-rr-find="${esc(a.id)}" value="${esc(x.key)}" ${picked.has(x.key) ? "checked" : ""}><span class="rr-option-text">${esc(x.s)}</span></label>`).join("")}</fieldset>`,
    )
    .join(
      "",
    )}</details>${chips ? `<ul class="rr-evidence-chips" aria-label="${A("Evidence you chose", "Evidencia que elegiste")}">${chips}</ul>` : ""}`;

  const criteria = a.lookFor || a.rubric || [];
  let check = `<button type="button" class="btn small" data-rr-selfcheck="${esc(a.id)}">${T("Check my response", "Revisar mi respuesta")}</button>`;
  if (ans.selfChecked) {
    const r = responseEvidence(lesson, a.prompt, ans.text);
    const words = r.used.length
      ? T(
          `Words from the text in your response: ${esc(r.used.slice(0, 6).join(", "))}.`,
          `Palabras del texto en tu respuesta: ${esc(r.used.slice(0, 6).join(", "))}.`,
        )
      : T(
          "No words from the text yet. Add one detail from the passage.",
          "Todavía no hay palabras del texto. Agrega un detalle del pasaje.",
        );
    const revised =
      ans.firstDraft != null && ans.firstDraft.trim() !== String(ans.text || "").trim();
    check += `<div role="status" class="feedback is-hint rr-selfcheck"><p class="fb-title">${T("Check against the criteria", "Revisa con los criterios")}</p><p>${words} ${T(`${r.wordCount} words.`, `${r.wordCount} palabras.`)}</p><fieldset><legend>${T("My response…", "Mi respuesta…")}</legend>${criteria
      .map(
        (c, i) =>
          `<label class="rr-option"><input type="checkbox" data-rr-criterion="${esc(a.id)}" value="${i}" ${ans.criteria?.[i] ? "checked" : ""}><span class="rr-option-text">${esc(c)}</span></label>`,
      )
      .join(
        "",
      )}</fieldset><p class="rr-fine">${T("This check looks for words from the passage and lists what a strong answer includes. It does not score your writing.", "Esta revisión busca palabras del pasaje y enumera lo que incluye una buena respuesta. No califica tu escritura.")}</p><p><b>${T("Next:", "Siguiente:")}</b> ${T("Change one thing, then check again.", "Cambia una cosa y revisa otra vez.")}</p>${revised ? `<details><summary>${T("Your first draft", "Tu primer borrador")}</summary><p class="rr-first-draft">${esc(ans.firstDraft)}</p></details><p class="rr-revised">${T("You revised your response.", "Revisaste tu respuesta.")}</p>` : ""}</div>`;
  }
  return `<div class="rr-response-support">${picker}${check}</div>`;
}
