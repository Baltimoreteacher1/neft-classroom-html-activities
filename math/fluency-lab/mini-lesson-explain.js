// Mini-lesson step 4: Explain It. Sentence frames that fade as the support level rises, a word bank, English or
// Español, and a checklist of which ideas the writing already has (never a mark). Saved to the math journal.
import { t } from "./i18n.js";
import { esc, pick } from "./lesson-4/dom.js";
import { MOVE_LABELS } from "./language-card.js";
import { addEntry, analyze } from "./language-journal.js";
import { localDay } from "./tutor-engine.js";

const CHECK_ICON = '<svg viewBox="0 0 16 16" width="16" height="16" focusable="false" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const OPEN_ICON = '<svg viewBox="0 0 16 16" width="16" height="16" focusable="false" aria-hidden="true"><circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';

const chip = (text, other, writing, mode) =>
  `<button type="button" class="ml-chip" lang="${writing}" data-insert="${esc(text)}" data-mode="${mode}">${esc(text)}${other ? ` <small lang="${writing === "es" ? "en" : "es"}">${esc(other)}</small>` : ""}</button>`;

function checklist(read, model) {
  return model.checklist
    .map((move) => {
      const got = Boolean(read.moves[move]);
      return `<li class="${got ? "got" : ""}" data-move="${move}">${got ? CHECK_ICON : OPEN_ICON}<span>${esc(t(MOVE_LABELS[move]))}</span><span class="ml-check-state">${esc(got ? t("in your writing") : t("not yet"))}</span></li>`;
    })
    .join("");
}

export function renderExplain(ctx) {
  const { stage, step, skill, lang, level } = ctx;
  const model = step.model;
  const s = (ctx.state.explain ||= { fn: model.start, writing: lang, text: "", startersOpen: model.byFunction[model.start]?.framesOpen ?? true, saved: false });
  if (!model.byFunction[s.fn]) s.fn = model.start;
  const entry = model.byFunction[s.fn];
  const writing = s.writing;
  const fnLabel = (fn) => (lang === "es" ? fn.es : fn.en);

  const startersHtml = () =>
    entry.framesOpen || s.startersOpen
      ? `<div class="ml-frames">${entry.frames.map((frame, i) => `<button type="button" class="ml-frame-btn" lang="${writing}" data-frame="${i}">${esc(writing === "es" ? frame.es : frame.en)}</button>`).join("")}</div>`
      : `<button type="button" class="ml-btn ml-btn-quiet" data-starters aria-expanded="false">${esc(t("Need a starter?"))}</button>`;

  stage.innerHTML = `<div class="ml-explain">
    <h4 class="ml-idea" id="ml-stage-title" tabindex="-1">${esc(t("Explain your thinking"))}</h4>
    <div class="ml-card">
      <p class="ml-prompt" lang="${lang}">${esc(pick(entry.prompt, lang))}</p>
      <p class="ml-support-note">${esc(level === 1 ? t("You can point, draw, or start in your home language. Pick words and finish the sentence.") : level === 2 ? t("Finish the sentences. Use joining words to connect your ideas.") : level === 3 ? t("Start from a sentence beginning and add your own ideas.") : t("Answer in your own words. Starters are there if you want one."))}</p>
      <div class="ml-seg" role="group" aria-label="${esc(t("What to write about"))}">${model.functions.map((fn) => `<button type="button" class="ml-seg-btn" data-fn="${fn.id}" aria-pressed="${fn.id === s.fn}">${esc(fnLabel(fn))}</button>`).join("")}</div>
      <div class="ml-seg" role="group" aria-label="${esc(t("Write in"))}"><button type="button" class="ml-seg-btn" lang="en" data-writing="en" aria-pressed="${writing === "en"}">English</button><button type="button" class="ml-seg-btn" lang="es" data-writing="es" aria-pressed="${writing === "es"}">Español</button></div>
      <div class="ml-starters">${startersHtml()}</div>
      <label class="ml-label" for="ml-explain-text">${esc(t("Your explanation"))}</label>
      <textarea id="ml-explain-text" class="ml-text" rows="4" lang="${writing}" maxlength="400"></textarea>
      <div class="ml-bank"><p class="ml-label">${esc(t("Word bank"))}</p><div class="ml-chips">${model.words.map((word) => chip(writing === "es" ? word.es : word.en, writing === "es" ? word.en : word.es, writing, "add")).join("")}</div>
        ${model.connectors.length ? `<p class="ml-label">${esc(t("Joining words"))}</p><div class="ml-chips">${model.connectors.map((c) => chip(writing === "es" ? c.es : c.en, "", writing, "add")).join("")}</div>` : ""}
        ${(s.fn === "check" ? model.check : s.fn === "explain" || s.fn === "fix" ? model.did : []).length ? `<p class="ml-label">${esc(s.fn === "check" ? t("Ways to check") : t("What I did"))}</p><div class="ml-chips">${(s.fn === "check" ? model.check : model.did).map((m) => chip(writing === "es" ? m.es : m.en, "", writing, "add")).join("")}</div>` : ""}
      </div>
    </div>
    <section class="ml-card ml-checks" aria-labelledby="ml-check-label"><p class="ml-label" id="ml-check-label">${esc(t("Ideas in your writing"))}</p><p class="ml-support-note">${esc(t("This shows which ideas are there. It is not a grade."))}</p><ul class="ml-checklist" aria-live="polite"></ul></section>
    <div class="ml-row"><button type="button" class="ml-btn ml-btn-primary" data-save>${esc(t("Save to my math journal"))}</button><p class="ml-save-status" role="status" aria-live="polite"></p></div>
  </div>`;
  const area = stage.querySelector("#ml-explain-text");
  const list = stage.querySelector(".ml-checklist");
  const status = stage.querySelector(".ml-save-status");
  area.value = s.text;
  const refresh = () => {
    s.text = area.value;
    list.innerHTML = checklist(analyze(area.value), model);
  };
  refresh();
  const rerender = (focus) => {
    s.text = area.value;
    ctx.rerender(focus);
  };
  const onInput = (event) => {
    if (event.target === area) {
      s.saved = false;
      refresh();
    }
  };
  const onClick = (event) => {
    const fn = event.target.closest("[data-fn]");
    const lang2 = event.target.closest("[data-writing]");
    const frame = event.target.closest("[data-frame]");
    const insert = event.target.closest("[data-insert]");
    if (fn) {
      s.fn = fn.dataset.fn;
      s.startersOpen = model.byFunction[s.fn].framesOpen;
      if (!area.value.trim() || entry.frames.some((f) => f.en === area.value || f.es === area.value)) s.text = "";
      return rerender(`[data-fn="${s.fn}"]`);
    }
    if (lang2) {
      s.writing = lang2.dataset.writing;
      if (entry.frames.some((f) => f.en === area.value || f.es === area.value)) area.value = "";
      return rerender(`[data-writing="${s.writing}"]`);
    }
    if (event.target.closest("[data-starters]")) {
      s.startersOpen = true;
      return rerender(".ml-frame-btn");
    }
    if (frame) {
      const picked = entry.frames[Number(frame.dataset.frame)];
      area.value = writing === "es" ? picked.es : picked.en;
      area.focus();
      return refresh();
    }
    if (insert) {
      // A chip fills the next blank, or adds to the end.
      const text = insert.dataset.insert;
      area.value = area.value.includes("___") ? area.value.replace("___", text) : `${area.value}${area.value && !/\s$/.test(area.value) ? " " : ""}${text}`;
      area.focus();
      return refresh();
    }
    if (event.target.closest("[data-save]")) {
      const text = area.value.trim();
      if (text.includes("___")) status.textContent = t("Fill in the blanks first, then save.");
      else {
        const saved = addEntry({ text, skill: ctx.key, grade: skill.grade, fn: s.fn, level, day: localDay() });
        status.textContent = saved ? t("Saved to your math journal.") : t("Write at least a short sentence to save it.");
        if (saved) {
          s.saved = true;
          ctx.onExplained();
        }
      }
    }
  };
  stage.addEventListener("input", onInput);
  stage.addEventListener("click", onClick);
  return () => {
    stage.removeEventListener("input", onInput);
    stage.removeEventListener("click", onClick);
  };
}
