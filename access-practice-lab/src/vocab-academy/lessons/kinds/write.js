// Lessons D (task), E, G: written and spoken-then-written responses. Used for kind "write" and kind "revise".
//   - oral first for K-2 and for discuss prompts ("I said it" toggle), typing optional there
//   - frames, word bank and model sentences follow the learner's support flags; a student may always open a starter
//     or the bank on purpose, and that choice is recorded as a support use (never held against them)
//   - a model sentence appears only AFTER an attempt (or when the support flag asks for it)
//   - drafts autosave; saving a response records "prod" evidence only for target words the writing actually uses
//   - no automatic grading of quality: look-fors are a self-check, and nothing here is a score
import { html, toHtml } from "../../../util.js";
import { wordsInText } from "../items.js";
import { wc } from "../ui.js";

const slug = (s) => String(s).replace(/[^a-z0-9]+/gi, "-");

function promptCopy(S, p) {
  const { I, unit } = S;
  if (p.generic === "paragraph") {
    const n = S.early ? 1 : 2;
    return { text: I.S(`Write a short paragraph that uses at least ${n} of these words: ${unit.words.map((w) => w.hw).join(", ")}.`, `Escribe un párrafo corto que use al menos ${n} de estas palabras: ${unit.words.map((w) => w.hw).join(", ")}.`), useCount: n };
  }
  if (p.generic === "expand") {
    const first = Object.values(S.state[p.fromKey]?.texts || {}).find((t) => t && t.trim());
    return {
      text: first ? I.S("Make this sentence richer. Add who, what kind, where, when, or why.", "Enriquece esta oración. Agrega quién, cómo, dónde, cuándo o por qué.") : I.S("Write one sentence with a word from this lesson. Then make it richer: add who, what kind, where, when, or why.", "Escribe una oración con una palabra de esta lección. Luego enriquécela: agrega quién, cómo, dónde, cuándo o por qué."),
      prefill: first || "",
    };
  }
  return { text: p.prompt, useCount: p.useCount || 0 };
}

const framesFor = (S, p) => {
  const list = [p.frame, ...(S.unit.wida?.frames || [])].filter(Boolean);
  return [...new Set(list)].slice(0, 3);
};

function promptHTML(S, step, p, d) {
  const { I, unit } = S;
  const key = p.key;
  const copy = promptCopy(S, p);
  const text = d.texts?.[key] ?? copy.prefill ?? "";
  const saved = Boolean(d.saved?.[key]);
  const id = `val-ta-${slug(`${step.id}-${key}`)}`;
  const frames = p.noFrame ? [] : framesFor(S, p);
  const bank = unit.wida?.bank || [];
  const frameOn = S.supW.frames || S.supW.starters;
  const need = S.supW.anyLanguageResponse ? Math.max(1, Math.round(p.minWords / 2)) : p.minWords;
  const said = Boolean(d.said?.[key]);
  const oral = p.oral || S.early;
  const wordHint = (p.wordIds || []).length && (p.wordIds || []).length <= 12 ? p.wordIds.map((w) => S.word(w)).filter(Boolean) : [];
  return html`<section class="val-write" data-val-prompt="${key}" aria-labelledby="${id}-h">
    <h3 id="${id}-h" class="val-write-h">${p.discuss ? I.T("Talk about it", "Conversa sobre esto") : copy.text ? "" : I.T("Write", "Escribe")}${copy.text ? html`<span lang="en">${copy.text}</span>` : ""}</h3>
    ${p.given ? html`<ul class="val-given" aria-label="${I.S("Sentences to combine", "Oraciones para combinar")}" lang="en">${p.given.map((g) => html`<li>${g}</li>`)}</ul><p class="val-note">${I.T("Join these into one sentence. Use a word from this lesson if you can.", "Une estas en una sola oración. Usa una palabra de esta lección si puedes.")}</p>` : ""}
    ${wordHint.length ? html`<p class="val-note">${I.T("Words you can use", "Palabras que puedes usar")}: <span lang="en">${wordHint.map((w) => w.hw).join(", ")}</span></p>` : ""}
    ${S.supW.anyLanguageResponse ? html`<p class="val-note">${I.T("You can write in any language you know. Try to use the English word too.", "Puedes escribir en cualquier idioma que conozcas. Intenta usar también la palabra en inglés.")}</p>` : ""}
    ${oral ? html`<div class="val-oral"><p>${p.discuss ? I.T("Talk with a partner, or say your ideas out loud to yourself.", "Habla con un compañero o di tus ideas en voz alta.") : I.T("Say your answer out loud first. Then write it, or just say it.", "Di tu respuesta en voz alta primero. Luego escríbela, o solo dila.")}</p>
      <button type="button" class="btn val-toggle val-btn" data-val-said="${key}" aria-pressed="${said}">${said ? "✓ " : ""}${I.T("I said it", "Ya lo dije")}</button></div>` : ""}
    ${frames.length ? (frameOn ? html`<div class="val-frames" role="group" aria-label="${I.S("Sentence starters", "Inicios de oración")}"><p class="val-note">${I.T("Sentence starters (tap one to add it):", "Inicios de oración (toca uno para agregarlo):")}</p>${frames.map((f, i) => html`<button type="button" class="btn val-chip" data-val-frame="${i}" data-val-key="${key}" lang="en">${f}</button>`)}</div>`
      : html`<details class="val-frames"><summary>${I.T("Need a sentence starter?", "¿Necesitas un inicio de oración?")}</summary>${frames.map((f, i) => html`<button type="button" class="btn val-chip" data-val-frame="${i}" data-val-key="${key}" lang="en">${f}</button>`)}</details>`) : ""}
    ${bank.length ? html`<details class="val-bank" ${S.supW.wordBank ? "open" : ""}><summary>${I.T("Word bank", "Banco de palabras")}</summary>${bank.slice(0, 12).map((b, i) => html`<button type="button" class="btn val-chip" data-val-bank="${i}" data-val-key="${key}" lang="en">${b}</button>`)}</details>` : ""}
    ${S.supW.model && p.model && !saved ? html`<p><button type="button" class="btn val-btn-ghost" data-val-model-first="${key}">${I.T("See a model sentence first", "Ver primero una oración modelo")}</button></p><div data-val-model-host="${key}"></div>` : ""}
    <label class="val-field" for="${id}"><span>${I.T("Your answer", "Tu respuesta")}${oral && !p.discuss ? html` <span class="val-note">(${I.T("typing is optional", "escribir es opcional")})</span>` : ""}</span>
      <textarea id="${id}" data-val-text="${key}" rows="${p.minWords > 20 ? 7 : 4}" maxlength="2000" lang="en" ${saved ? "" : ""}>${text}</textarea></label>
    <p class="val-note" data-val-count="${key}">${wc(text)} ${I.T("words", "palabras")} · ${I.T("aim for about", "intenta unas")} ${need}</p>
    <p class="val-actions"><button type="button" class="btn btn-primary val-btn" data-val-save-text="${key}">${saved ? I.T("Save my changes", "Guardar mis cambios") : I.T("Save my answer", "Guardar mi respuesta")}</button></p>
    <div data-val-after="${key}" role="status" aria-live="polite">${saved ? afterHTML(S, step, p, d) : ""}</div>
  </section>`;
}

function afterHTML(S, step, p, d) {
  const { I } = S;
  const text = d.texts?.[p.key] || "";
  const found = wordsInText(S.unit, text);
  const want = (p.wordIds || []).length ? (p.wordIds || []).map((w) => S.word(w)).filter(Boolean) : [];
  const useCount = p.useCount || (p.generic === "paragraph" ? (S.early ? 1 : 2) : 0);
  const looks = step.looks || [];
  return html`<div class="val-after">
    <p class="val-feedback is-right"><span aria-hidden="true">✓</span> <strong>${I.T("Saved.", "Guardado.")}</strong> ${I.T("You can change it any time.", "Puedes cambiarlo cuando quieras.")}</p>
    ${want.length > 0 && text ? html`<p>${found.length ? html`${I.T("Words from this lesson I found in your writing", "Palabras de esta lección que encontré en tu escritura")}: <strong lang="en">${found.map((w) => w.hw).join(", ")}</strong>.` : I.T("I did not find a word from this lesson yet. Try adding one.", "Todavía no encontré una palabra de esta lección. Intenta agregar una.")}
      ${useCount && found.length < useCount ? html` ${I.T(`The goal is at least ${useCount}.`, `La meta es al menos ${useCount}.`)}` : ""}</p>` : ""}
    ${looks.length ? html`<fieldset class="val-looks"><legend>${I.T("Check your writing. Does it show this?", "Revisa tu escritura. ¿Muestra esto?")}</legend>
      ${looks.map((l, i) => html`<label class="val-check-row"><input type="checkbox" data-val-look="${p.key}|${i}" ${d.looks?.[p.key]?.[i] ? "checked" : ""} /> <span lang="en">${l}</span></label>`)}</fieldset>` : ""}
    ${p.reveal && p.model ? html`<p><button type="button" class="btn val-btn-ghost" data-val-reveal-model="${p.key}" aria-expanded="${Boolean(d.revealed?.[p.key])}">${I.T("Compare with a sample", "Comparar con un ejemplo")}</button></p>
      <div data-val-model-host="${p.key}">${d.revealed?.[p.key] ? modelHTML(S, p) : ""}</div>` : ""}
    ${step.kind === "revise" ? compareHTML(S, step, p, d) : ""}
  </div>`;
}

const modelHTML = (S, p) => html`<blockquote class="val-model" lang="en"><p class="val-note">${S.I.T("A sample answer. Yours can be different and still right.", "Una respuesta de ejemplo. La tuya puede ser distinta y también correcta.")}</p><p>${p.model}</p></blockquote>`;

function originalOf(S, step) {
  const from = S.state[step.fromKey]?.texts;
  return from ? Object.values(from).find((t) => t && t.trim()) || "" : "";
}

function compareHTML(S, step, p, d) {
  const { I } = S;
  const before = originalOf(S, step);
  const after = d.texts?.[p.key] || "";
  if (!before) return "";
  const b = wordsInText(S.unit, before).length;
  const a = wordsInText(S.unit, after).length;
  return html`<div class="val-compare"><h4>${I.T("Your first draft and your revision", "Tu primer borrador y tu revisión")}</h4>
    <div class="val-compare-cols"><div><h5>${I.T("First draft", "Primer borrador")}</h5><p lang="en">${before}</p><p class="val-note">${wc(before)} ${I.T("words", "palabras")} · ${b} ${I.T("lesson words", "palabras de la lección")}</p></div>
    <div><h5>${I.T("Revision", "Revisión")}</h5><p lang="en">${after}</p><p class="val-note">${wc(after)} ${I.T("words", "palabras")} · ${a} ${I.T("lesson words", "palabras de la lección")}</p></div></div></div>`;
}

export function htmlOf(S, step) {
  const { I } = S;
  const d = S.stepData(step.id);
  const looks = step.looks || [];
  const original = step.kind === "revise" ? originalOf(S, step) : "";
  // Revise opens with the learner's own draft in the box so they change it instead of starting over.
  if (step.kind === "revise" && original) {
    d.texts ||= {};
    if (d.texts.revise === undefined) d.texts.revise = original;
  }
  return html`<div class="val-writing">
    ${step.text ? html`<div class="val-passage-ref"><h3 lang="en">${step.text.title}</h3><div class="val-passage" lang="en">${step.text.paras.map((t) => html`<p class="val-para">${t}</p>`)}</div></div>` : ""}
    ${step.kind === "revise" ? html`<p class="val-note">${original ? I.T("Read your first draft below. Then improve it: add a detail, use a lesson word on purpose, or fix something you notice.", "Lee abajo tu primer borrador. Luego mejóralo: agrega un detalle, usa a propósito una palabra de la lección o corrige algo que notes.") : I.T("You have not written a first draft yet. Write one here, or go back one step.", "Todavía no escribes un primer borrador. Escribe uno aquí o vuelve un paso.")}</p>` : ""}
    ${looks.length && step.kind !== "revise" ? html`<details class="val-looks-preview" open><summary>${I.T("What strong writing shows", "Qué muestra una buena escritura")}</summary><ul lang="en">${looks.map((l) => html`<li>${l}</li>`)}</ul></details>` : ""}
    ${step.prompts.map((p) => promptHTML(S, step, p, d))}
    <p class="val-actions val-skip"><button type="button" class="btn val-btn-ghost" data-val-skip aria-pressed="${Boolean(d.skipped)}">${d.skipped ? I.T("Skipped for now (tap to undo)", "Omitido por ahora (toca para deshacer)") : I.T("Skip this step for now", "Omitir este paso por ahora")}</button></p>
  </div>`;
}

export function mount(S, step, el) {
  const d = S.stepData(step.id);
  d.texts ||= {};
  d.saved ||= {};
  d.said ||= {};
  d.looks ||= {};
  d.revealed ||= {};
  d.credited ||= {};
  d.nudged ||= {};
  const prompt = (key) => step.prompts.find((p) => p.key === key);
  const area = (key) => el.querySelector(`[data-val-text="${key}"]`);
  const need = (p) => (S.supW.anyLanguageResponse ? Math.max(1, Math.round(p.minWords / 2)) : p.minWords);
  const finishCheck = () => {
    if (step.prompts.every((p) => d.saved[p.key])) S.markDone(step.id);
  };
  const paintAfter = (p) => {
    const host = el.querySelector(`[data-val-after="${p.key}"]`);
    if (host) host.innerHTML = toHtml(afterHTML(S, step, p, d));
  };
  const insert = (key, text) => {
    const ta = area(key);
    if (!ta) return;
    const at = ta.selectionStart ?? ta.value.length;
    const pad = ta.value && !/\s$/.test(ta.value.slice(0, at)) ? " " : "";
    ta.setRangeText(pad + text, at, ta.selectionEnd ?? at, "end");
    ta.focus();
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  };
  S.on(el, "input", (e) => {
    const ta = e.target.closest?.("[data-val-text]");
    if (!ta) return;
    const key = ta.dataset.valText;
    d.texts[key] = ta.value;
    const p = prompt(key);
    const n = wc(ta.value);
    const out = el.querySelector(`[data-val-count="${key}"]`);
    if (out) out.textContent = `${n} ${S.I.S("words", "palabras")} · ${S.I.S("aim for about", "intenta unas")} ${need(p)}`;
    S.save();
  });
  S.on(el, "change", (e) => {
    const box = e.target.closest?.("[data-val-look]");
    if (!box) return;
    const [key, i] = box.dataset.valLook.split("|");
    (d.looks[key] ||= {})[i] = box.checked;
    S.save();
  });
  S.on(el, "click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.matches("[data-val-said]")) {
      const key = t.dataset.valSaid;
      d.said[key] = !d.said[key];
      S.useSupport("rehearsal");
      t.setAttribute("aria-pressed", String(d.said[key]));
      t.textContent = `${d.said[key] ? "✓ " : ""}${S.I.S("I said it", "Ya lo dije")}`;
      S.save();
    } else if (t.matches("[data-val-frame]")) {
      const p = prompt(t.dataset.valKey);
      S.useSupport("frames");
      insert(p.key, framesFor(S, p)[Number(t.dataset.valFrame)]);
    } else if (t.matches("[data-val-bank]")) {
      S.useSupport("wordBank");
      insert(t.dataset.valKey, (S.unit.wida?.bank || [])[Number(t.dataset.valBank)]);
    } else if (t.matches("[data-val-model-first]")) {
      const key = t.dataset.valModelFirst;
      S.useSupport("model");
      el.querySelector(`[data-val-model-host="${key}"]`).innerHTML = toHtml(modelHTML(S, prompt(key)));
    } else if (t.matches("[data-val-reveal-model]")) {
      const key = t.dataset.valRevealModel;
      d.revealed[key] = !d.revealed[key];
      t.setAttribute("aria-expanded", String(d.revealed[key]));
      el.querySelector(`[data-val-model-host="${key}"]`).innerHTML = d.revealed[key] ? toHtml(modelHTML(S, prompt(key))) : "";
      S.save();
    } else if (t.matches("[data-val-skip]")) {
      d.skipped = !d.skipped;
      t.setAttribute("aria-pressed", String(d.skipped));
      t.textContent = d.skipped ? S.I.S("Skipped for now (tap to undo)", "Omitido por ahora (toca para deshacer)") : S.I.S("Skip this step for now", "Omitir este paso por ahora");
      S.persist();
      S.announce(d.skipped ? S.I.S("Step skipped. You can come back to it.", "Paso omitido. Puedes volver a él.") : S.I.S("Skip undone.", "Omisión deshecha."));
    } else if (t.matches("[data-val-save-text]")) {
      const key = t.dataset.valSaveText;
      const p = prompt(key);
      const text = (area(key)?.value || "").trim();
      d.texts[key] = text;
      const spoken = Boolean(d.said[key]) && (p.oral || S.early || p.discuss);
      const n = wc(text);
      const host = el.querySelector(`[data-val-after="${key}"]`);
      if (!n && !spoken) {
        host.innerHTML = toHtml(html`<p class="val-feedback is-wrong"><span aria-hidden="true">↺</span> ${S.I.T("Write or say something first, then save.", "Escribe o di algo primero y luego guarda.")}</p>`);
        area(key)?.focus();
        return;
      }
      if (n < need(p) && !spoken && !d.nudged[key]) {
        d.nudged[key] = true;
        host.innerHTML = toHtml(html`<p class="val-feedback is-wrong"><span aria-hidden="true">↺</span> ${S.I.T(`Your answer has ${n} word${n === 1 ? "" : "s"}. Add a little more if you can (about ${need(p)}). Press Save again to keep it as it is.`, `Tu respuesta tiene ${n} palabra(s). Agrega un poco más si puedes (unas ${need(p)}). Presiona Guardar otra vez para dejarla como está.`)}</p>`);
        area(key)?.focus();
        return;
      }
      d.saved[key] = new Date().toISOString();
      if (text) {
        // Evidence: "prod" for each target word the writing really uses. Quality is never auto-judged here.
        const ids = new Set((p.wordIds || []).length ? p.wordIds : S.unit.words.map((w) => w.id));
        if (!d.credited[key]) {
          d.credited[key] = true;
          for (const w of wordsInText(S.unit, text)) if (ids.has(w.id)) S.evidence({ wordId: w.id, dim: "prod", ok: true, type: `write-${S.letter}` });
        }
        S.drafts({ id: `${S.unit.id}:${S.letter}:${key}`, kind: step.kind === "revise" ? "revision" : "writing", lesson: S.letter, prompt: p.prompt || step.title?.[0] || "", text });
      }
      S.persist();
      t.textContent = S.I.S("Save my changes", "Guardar mis cambios");
      paintAfter(p);
      finishCheck();
      S.announce(S.I.S("Saved on this device.", "Guardado en este dispositivo."));
    }
  });
}
