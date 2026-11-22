// Interactive Worksheet Mode (/play?sheet=1 or ?sheet=custom#sheet=...)
// Publisher-grade interactive worksheet with 4 item types:
// 1. Fill-in-the-Blank (typing + clickable word bank)
// 2. Drag-and-Drop / Tap-to-Place (real HTML5 DnD + tap-to-place + keyboard Enter/Space)
// 3. Image-to-Word Matching (layered inline SVGs + bilingual clues)
// 4. Text Highlighting (multi-sentence academic passage)
// Includes completion progress bar, explanatory EN/ES feedback, Reset, Print, Teacher-only Key, and 1-Click Assignment.

import { readAudience } from "../audience.js";
import { standardsForActivity } from "../content/standards-crosswalk.js";
import { i18nFor } from "../i18n.js";
import { announce, html, icon, raw, safeJson, storage } from "../util.js";

const SHEET_KEY = "accessPracticeLab:v1:interactiveSheet";
const PENDING_ASSIGN_KEY = "accessTeacher:v1:pendingAssign";

const SVG_ICONS = {
  book: `<svg viewBox="0 0 64 64" width="60" height="60" aria-hidden="true"><rect x="8" y="10" width="48" height="44" rx="8" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5"/><path d="M16 18h14v28H16z" fill="#1fa6a2" opacity="0.25"/><path d="M34 18h14v28H34z" fill="#f2c15b" opacity="0.3"/><path d="M16 18h14v28H16zM34 18h14v28H34z" fill="none" stroke="#17324d" stroke-width="2"/><path d="M20 25h6M20 31h6M38 25h6M38 31h6" stroke="#17324d" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  sun: `<svg viewBox="0 0 64 64" width="60" height="60" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="#fff8e6"/><circle cx="32" cy="32" r="13" fill="#f2c15b" stroke="#17324d" stroke-width="2.5"/><path d="M32 7v7M32 50v7M7 32h7M50 32h7M14 14l5 5M45 45l5 5M50 14l-5 5M19 45l-5 5" stroke="#17324d" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  chat: `<svg viewBox="0 0 64 64" width="60" height="60" aria-hidden="true"><rect x="8" y="12" width="48" height="32" rx="10" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5"/><path d="M20 44l-6 10 14-10" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5" stroke-linejoin="round"/><circle cx="23" cy="28" r="3.5" fill="#075568"/><circle cx="32" cy="28" r="3.5" fill="#1fa6a2"/><circle cx="41" cy="28" r="3.5" fill="#17324d"/></svg>`,
  pencil: `<svg viewBox="0 0 64 64" width="60" height="60" aria-hidden="true"><rect x="10" y="48" width="44" height="6" rx="3" fill="#eaf4f4"/><path d="M16 46l4-14L42 10l10 10L30 42z" fill="#f2c15b" stroke="#17324d" stroke-width="2.5" stroke-linejoin="round"/><path d="M38 14l10 10" stroke="#17324d" stroke-width="2.5"/><path d="M16 46l5-2-3-3z" fill="#17324d"/></svg>`,
  globe: `<svg viewBox="0 0 64 64" width="60" height="60" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5"/><ellipse cx="32" cy="32" rx="10" ry="22" fill="#1fa6a2" fill-opacity="0.18" stroke="#075568" stroke-width="2"/><path d="M10 32h44M14 21h36M14 43h36" stroke="#17324d" stroke-width="1.8"/></svg>`,
  star: `<svg viewBox="0 0 64 64" width="60" height="60" aria-hidden="true"><circle cx="32" cy="32" r="24" fill="#eaf4f4"/><polygon points="32,10 39,24 54,26 43,37 46,52 32,45 18,52 21,37 10,26 25,24" fill="#f2c15b" stroke="#17324d" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
};

const ICON_KEYS = Object.keys(SVG_ICONS);

let selectedTile = "";
let graded = false;
let showKey = false;
let dndWired = false;

export function decodeCustomSheetFromHash(hash = typeof location !== "undefined" ? location.hash : "") {
  const m = String(hash || "").match(/sheet=([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try {
    const b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(""),
    );
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.words) || !parsed.words.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadAllState() {
  return safeJson(storage.get(SHEET_KEY), {}) || {};
}

function saveSheetState(sheetId, state) {
  const all = loadAllState();
  all[sheetId] = state;
  storage.set(SHEET_KEY, JSON.stringify(all));
}

function defaultState() {
  return { fib: {}, dnd: {}, match: {}, hl: [] };
}

function getSheetState(sheetId) {
  const all = loadAllState();
  return { ...defaultState(), ...(all[sheetId] || {}) };
}

function ensureDndListeners(ctx) {
  if (dndWired || typeof document === "undefined") return;
  dndWired = true;
  document.addEventListener("dragstart", (e) => {
    const tile = e.target?.closest?.("[data-dnd-tile]");
    if (!tile || !e.dataTransfer) return;
    e.dataTransfer.setData("text/plain", tile.dataset.dndTile || "");
    e.dataTransfer.effectAllowed = "move";
  });
  document.addEventListener("dragover", (e) => {
    const zone = e.target?.closest?.("[data-dnd-zone]");
    if (!zone) return;
    e.preventDefault();
    zone.classList.add("is-over");
  });
  document.addEventListener("dragleave", (e) => {
    const zone = e.target?.closest?.("[data-dnd-zone]");
    if (zone) zone.classList.remove("is-over");
  });
  document.addEventListener("drop", (e) => {
    const zone = e.target?.closest?.("[data-dnd-zone]");
    if (!zone) return;
    e.preventDefault();
    zone.classList.remove("is-over");
    const word = e.dataTransfer?.getData("text/plain");
    const sheetEl = zone.closest("[data-sheet-id]");
    if (!word || !sheetEl) return;
    const sheetId = sheetEl.dataset.sheetId;
    const state = getSheetState(sheetId);
    state.dnd[zone.dataset.dndZone] = word;
    saveSheetState(sheetId, state);
    ctx?.rerender?.();
  });
}

export function buildSheetSpec(activity, customSheet = null) {
  if (customSheet) {
    const words = customSheet.words.slice(0, 6);
    const w0 = words[0] || { en: "evidence", es: "evidencia", clue: "facts that support an idea" };
    const w1 = words[1] || { en: "explain", es: "explicar", clue: "tell how or why something happens" };
    const w2 = words[2] || { en: "compare", es: "comparar", clue: "find what is alike and different" };
    const w3 = words[3] || w0;
    return {
      id: `custom:${customSheet.title || "sheet"}`,
      title: customSheet.title || "Custom Vocabulary Sheet",
      domain: "Reading",
      skill: "Vocabulary & Comprehension",
      words,
      fib: words.slice(0, 4).map((w, i) => ({
        id: `fib-${i}`,
        before: w.clue ? `Meaning: "${w.clue}" →` : `Spanish: "${w.es || w.en}" →`,
        after: "",
        answer: w.en,
        whyEn: `"${w.en}" (${w.es}) matches: ${w.clue}.`,
        whyEs: `"${w.en}" (${w.es}) corresponde a: ${w.clue}.`, // ES-REVIEW
      })),
      dnd: words.slice(0, 4).map((w, i) => ({
        id: `dnd-${i}`,
        prompt: w.clue || w.es || `Match ${w.en}`,
        answer: w.en,
        whyEn: `Place "${w.en}" with its clue.`,
        whyEs: `Coloca "${w.en}" con su pista.`, // ES-REVIEW
      })),
      match: words.slice(0, 4).map((w, i) => ({
        id: `m-${i}`,
        word: w.en,
        clue: w.es ? `${w.es}${w.clue ? ` — ${w.clue}` : ""}` : w.clue || w.en,
        svgKey: ICON_KEYS[i % ICON_KEYS.length],
      })),
      hl: {
        promptEn: "Tap the key academic words in the paragraph below.",
        promptEs: "Toca las palabras académicas clave en el párrafo de abajo.", // ES-REVIEW
        tokens: [
          "During", "our", "investigation,", "students", "used", w0.en, "to", w1.en, "their", "findings.",
          "Next,", "they", "worked", "together", "to", w2.en, "two", "models", "and", "note", w3.en, "in", "writing.",
        ],
        targets: [w0.en, w1.en, w2.en, w3.en].map((x) => x.toLowerCase()),
      },
    };
  }

  const title = activity?.title || "Language Practice Sheet";
  const vocab = Array.isArray(activity?.vocab) && activity.vocab.length
    ? activity.vocab.map((v) => ({
        en: v.en || v.word || v[0] || "evidence",
        es: v.es || v[1] || "evidencia",
        clue: v.def || v.meaning || v.en || "key term",
      }))
    : [
        { en: "evidence", es: "evidencia", clue: "facts or details from a text" },
        { en: "explain", es: "explicar", clue: "tell how or why something happens" },
        { en: "detail", es: "detalle", clue: "a small piece of information" },
        { en: "claim", es: "afirmación", clue: "a main point you want to prove" },
      ];

  const items = Array.isArray(activity?.items) ? activity.items : [];
  const fib = vocab.slice(0, 4).map((v, i) => ({
    id: `fib-${i}`,
    before: `${v.clue} (${v.es}):`,
    after: "",
    answer: v.en,
    whyEn: `"${v.en}" means ${v.clue}.`,
    whyEs: `"${v.en}" (${v.es}) significa ${v.clue}.`, // ES-REVIEW
  }));

  const dnd = items.slice(0, 4).length
    ? items.slice(0, 4).map((it, i) => {
        const ans = Array.isArray(it.options) && typeof it.answer === "number"
          ? String(it.options[it.answer] || vocab[i % vocab.length].en)
          : String(it.answer || vocab[i % vocab.length].en);
        return {
          id: `dnd-${i}`,
          prompt: it.prompt || it.stem || `Item ${i + 1}`,
          answer: ans,
          whyEn: `The best fit is "${ans}".`,
          whyEs: `La mejor opción es "${ans}".`, // ES-REVIEW
        };
      })
    : vocab.slice(0, 4).map((v, i) => ({
        id: `dnd-${i}`,
        prompt: v.clue,
        answer: v.en,
        whyEn: `"${v.en}" matches this clue.`,
        whyEs: `"${v.en}" coincide con esta pista.`, // ES-REVIEW
      }));

  const match = vocab.slice(0, 4).map((v, i) => ({
    id: `m-${i}`,
    word: v.en,
    clue: v.es ? `${v.es} — ${v.clue}` : v.clue,
    svgKey: ICON_KEYS[i % ICON_KEYS.length],
  }));

  const passageText = activity?.passage || activity?.prompt ||
    `Strong readers use ${vocab[0].en} to ${vocab[1]?.en || "explain"} each ${vocab[2]?.en || "detail"} clearly. When writers support a ${vocab[3]?.en || "claim"}, their ideas are easier to understand.`;
  const tokens = String(passageText).split(/\s+/).filter(Boolean).slice(0, 40);
  const targets = vocab.map((v) => v.en.toLowerCase());

  return {
    id: activity?.id || "sheet",
    title,
    domain: activity?.domain || "Reading",
    skill: activity?.skill || "Academic Language",
    words: vocab,
    fib,
    dnd,
    match,
    hl: {
      promptEn: "Tap the key vocabulary or evidence words in the passage.",
      promptEs: "Toca el vocabulario clave o las palabras de evidencia en el texto.", // ES-REVIEW
      tokens,
      targets,
    },
  };
}

export function renderInteractiveSheet(ctx, activity, customSheet = null) {
  ensureDndListeners(ctx);
  const I = i18nFor(ctx);
  const spec = buildSheetSpec(activity, customSheet);
  const state = getSheetState(spec.id);
  const stds = standardsForActivity({ domain: spec.domain, skill: spec.skill, title: spec.title });
  const isTeacher = readAudience() === "teacher";

  const fibBank = [...new Set(spec.fib.map((f) => f.answer))];
  const dndBank = [...new Set(spec.dnd.map((d) => d.answer))];
  const matchWords = [...new Set(spec.match.map((m) => m.word))];

  const answeredCount =
    spec.fib.filter((f) => (state.fib[f.id] || "").trim()).length +
    spec.dnd.filter((d) => (state.dnd[d.id] || "").trim()).length +
    spec.match.filter((m) => (state.match[m.id] || "").trim()).length +
    (state.hl.length > 0 ? 1 : 0);
  const totalTasks = spec.fib.length + spec.dnd.length + spec.match.length + 1;
  const pct = Math.round((answeredCount / Math.max(1, totalTasks)) * 100);

  const fibScore = spec.fib.filter((f) => (state.fib[f.id] || "").trim().toLowerCase() === f.answer.toLowerCase()).length;
  const dndScore = spec.dnd.filter((d) => (state.dnd[d.id] || "").trim().toLowerCase() === d.answer.toLowerCase()).length;
  const matchScore = spec.match.filter((m) => (state.match[m.id] || "").trim().toLowerCase() === m.word.toLowerCase()).length;
  const hlHits = spec.hl.tokens.filter((tok, idx) => {
    const clean = tok.replace(/[.,!?;:()"']/g, "").toLowerCase();
    return state.hl.includes(idx) && spec.hl.targets.includes(clean);
  }).length;
  const hlPossible = Math.max(1, spec.hl.tokens.filter((tok) => spec.hl.targets.includes(tok.replace(/[.,!?;:()"']/g, "").toLowerCase())).length);
  const totalPossible = spec.fib.length + spec.dnd.length + spec.match.length + hlPossible;
  const totalCorrect = fibScore + dndScore + matchScore + hlHits;

  return html`<section class="is-sheet" data-sheet-id="${spec.id}" aria-labelledby="isTitle">
    <header class="is-sheet-head">
      <div>
        <p class="eyebrow">${I.T("Interactive Worksheet", "Hoja de trabajo interactiva")} · ${spec.domain}</p> <!-- ES-REVIEW -->
        <h1 id="isTitle" tabindex="-1">${spec.title}</h1>
        <div class="is-std-pills" aria-label="${I.S("Aligned standards", "Estándares alineados")}">
          <span class="is-std-pill">WIDA 2020: ${stds.wida}</span>
          <span class="is-std-pill">CCSS: ${stds.ccss}</span>
          <span class="is-std-pill">TEKS: ${stds.teks}</span>
        </div>
      </div>
      <div class="no-print" style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;">
        <span class="is-std-pill">${answeredCount}/${totalTasks} ${I.T("completed", "completados")} (${pct}%)</span>
        <button type="button" class="btn small" data-sheet-print>${icon("print")} ${I.T("Print Sheet", "Imprimir hoja")}</button>
        ${isTeacher && activity?.id ? html`<button type="button" class="btn small" data-sheet-assign="${activity.id}">${icon("bookmark")} ${I.T("1-Click Add to Class Assignment", "Agregar a tarea de clase")}</button>` : ""}
      </div>
    </header>

    <div class="bar no-print" style="margin-bottom:1.25rem;" aria-hidden="true"><i style="width:${pct}%"></i></div>

    <div class="is-section" aria-labelledby="isFibH">
      <h2 id="isFibH">1. ${I.T("Fill in the Blank", "Completa el espacio")}</h2>
      <p class="fine">${I.T("Type the word or tap a word from the bank to fill the next empty line.", "Escribe la palabra o toca una del banco para llenar el siguiente espacio.")}</p>
      <div class="is-word-bank" role="group" aria-label="${I.S("Word bank", "Banco de palabras")}">
        ${fibBank.map((w) => html`<button type="button" class="is-bank-chip" data-fib-bank="${w}">${w}</button>`)}
      </div>
      ${spec.fib.map((f, idx) => {
        const val = state.fib[f.id] || "";
        const ok = val.trim().toLowerCase() === f.answer.toLowerCase();
        return html`<div class="is-fib-row">
          <label for="${f.id}"><strong>${idx + 1}.</strong> ${f.before}</label>
          <input id="${f.id}" type="text" class="is-fib-input" data-fib-input="${f.id}" value="${val}" autocomplete="off" />
          ${f.after ? html`<span>${f.after}</span>` : ""}
          ${graded ? html`<span class="is-item-fb ${ok ? "is-ok" : "is-try"}">${ok ? I.T(f.whyEn, f.whyEs) : I.T("Check the clue and try another word from the bank.", "Revisa la pista y prueba otra palabra del banco.")}</span>` : ""}
        </div>`;
      })}
    </div>

    <div class="is-section" aria-labelledby="isDndH">
      <h2 id="isDndH">2. ${I.T("Drag & Drop / Tap-to-Place", "Arrastra o toca para colocar")}</h2>
      <p class="fine">${I.T("Drag a word tile into a box, or tap a tile and tap a box to place it.", "Arrastra una ficha a una casilla, o tócala y luego toca una casilla.")}</p>
      <div class="is-word-bank" role="group" aria-label="${I.S("Draggable word tiles", "Fichas de palabras")}">
        ${dndBank.map((w) => html`<button type="button" class="is-bank-chip" draggable="true" data-dnd-tile="${w}" aria-pressed="${selectedTile === w}">${w}</button>`)}
      </div>
      <div class="is-dnd-zones">
        ${spec.dnd.map((d) => {
          const placed = state.dnd[d.id] || "";
          const ok = placed.trim().toLowerCase() === d.answer.toLowerCase();
          return html`<div class="is-drop-zone" data-dnd-zone="${d.id}" tabindex="0" role="button" aria-label="${I.S(`Drop zone for ${d.prompt}`, `Zona para ${d.prompt}`)}">
            <span>${d.prompt}</span>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:.4rem;">
              <strong>${placed || I.T("Tap or drop here", "Toca o suelta aquí")}</strong>
              ${placed ? html`<button type="button" class="ghost small no-print" data-dnd-clear="${d.id}" aria-label="Clear">${icon("x")}</button>` : ""}
            </div>
            ${graded ? html`<span class="is-item-fb ${ok ? "is-ok" : "is-try"}">${ok ? I.T(d.whyEn, d.whyEs) : I.T("Check the clue and try again.", "Revisa la pista e inténtalo de nuevo.")}</span>` : ""}
          </div>`;
        })}
      </div>
    </div>

    <div class="is-section" aria-labelledby="isMatchH">
      <h2 id="isMatchH">3. ${I.T("Image-to-Word Matching", "Relaciona la imagen con la palabra")}</h2>
      <div class="is-match-grid">
        ${spec.match.map((m, idx) => {
          const val = state.match[m.id] || "";
          const ok = val.trim().toLowerCase() === m.word.toLowerCase();
          return html`<div class="is-match-card">
            ${raw(SVG_ICONS[m.svgKey] || SVG_ICONS.book)}
            <p class="fine" style="text-align:center;margin:0;">${m.clue}</p>
            <label class="sr-only" for="${m.id}">${I.T(`Choose word for picture ${idx + 1}`, `Elige la palabra para la imagen ${idx + 1}`)}</label>
            <select id="${m.id}" class="is-match-select" data-match-select="${m.id}">
              <option value="">${I.T("Choose a word…", "Elige una palabra…")}</option>
              ${matchWords.map((w) => html`<option value="${w}" ${val === w ? raw("selected") : ""}>${w}</option>`)}
            </select>
            ${graded ? html`<span class="is-item-fb ${ok ? "is-ok" : "is-try"}">${ok ? I.T("Matched!", "¡Correcto!") : I.T("Keep looking!", "¡Sigue intentando!")}</span>` : ""}
          </div>`;
        })}
      </div>
    </div>

    <div class="is-section" aria-labelledby="isHlH">
      <h2 id="isHlH">4. ${I.T("Text Highlighting", "Subraya el texto")}</h2>
      <p class="fine">${I.T(spec.hl.promptEn, spec.hl.promptEs)}</p>
      <div class="is-hl-passage" role="group" aria-label="${I.S("Highlightable text", "Texto para subrayar")}">
        ${spec.hl.tokens.map((tok, idx) => {
          const on = state.hl.includes(idx);
          return html`<button type="button" class="is-hl-token" data-hl-idx="${idx}" aria-pressed="${on}">${tok}</button> `;
        })}
      </div>
      ${graded ? html`<p class="is-item-fb is-ok">${I.T(`Highlighted ${hlHits} of ${hlPossible} key word(s).`, `Subrayaste ${hlHits} de ${hlPossible} palabra(s) clave.`)}</p>` : ""}
    </div>

    ${graded ? html`<div class="feedback is-right" role="status" aria-live="polite">
      <p class="fb-title">${icon("check")} ${I.T(`Checked ${totalCorrect} of ${totalPossible} items!`, `¡Revisaste ${totalCorrect} de ${totalPossible} elementos!`)}</p>
      <p>${I.T("Great effort! Adjust any item above and check again, or reset the sheet for a fresh try.", "¡Buen esfuerzo! Ajusta cualquier respuesta y revisa otra vez, o reinicia la hoja.")}</p>
    </div>` : ""}

    <div class="is-actions no-print">
      <button type="button" class="btn btn-primary" data-sheet-check>${icon("check")} ${I.T("Check My Sheet", "Revisar mi hoja")}</button>
      <button type="button" class="btn" data-sheet-reset>${icon("retry")} ${I.T("Reset Sheet", "Reiniciar hoja")}</button>
      ${isTeacher ? html`<button type="button" class="btn ghost" data-sheet-toggle-key aria-expanded="${showKey}">${icon("lock")} ${showKey ? I.T("Hide Answer Key", "Ocultar clave") : I.T("View Answer Key", "Ver clave de respuestas")}</button>` : ""}
    </div>

    ${isTeacher && showKey ? html`<div class="is-key-box" aria-label="${I.S("Teacher Answer Key", "Clave de respuestas docente")}">
      <h3>${I.T("Teacher Answer Key", "Clave de respuestas")}</h3>
      <ul>
        <li><strong>Fill-in-the-Blank:</strong> ${spec.fib.map((f) => f.answer).join(", ")}</li>
        <li><strong>Drag &amp; Drop:</strong> ${spec.dnd.map((d) => d.answer).join(", ")}</li>
        <li><strong>Matching:</strong> ${spec.match.map((m) => m.word).join(", ")}</li>
        <li><strong>Highlighting:</strong> ${spec.hl.targets.join(", ")}</li>
      </ul>
    </div>` : ""}
  </section>`;
}

export function onInteractiveSheetClick(e, ctx, activity, customSheet = null) {
  const target = e.target;
  const spec = buildSheetSpec(activity, customSheet);
  const state = getSheetState(spec.id);
  const I = i18nFor(ctx);

  const fibBankBtn = target.closest("[data-fib-bank]");
  if (fibBankBtn) {
    const word = fibBankBtn.dataset.fibBank;
    const empty = spec.fib.find((f) => !(state.fib[f.id] || "").trim()) || spec.fib[0];
    if (empty) {
      state.fib[empty.id] = word;
      saveSheetState(spec.id, state);
      ctx.rerender();
    }
    return true;
  }

  const clearDnd = target.closest("[data-dnd-clear]");
  if (clearDnd) {
    delete state.dnd[clearDnd.dataset.dndClear];
    saveSheetState(spec.id, state);
    ctx.rerender();
    return true;
  }

  const tileBtn = target.closest("[data-dnd-tile]");
  if (tileBtn) {
    selectedTile = selectedTile === tileBtn.dataset.dndTile ? "" : tileBtn.dataset.dndTile;
    ctx.rerender();
    return true;
  }

  const zoneBtn = target.closest("[data-dnd-zone]");
  if (zoneBtn && selectedTile) {
    state.dnd[zoneBtn.dataset.dndZone] = selectedTile;
    selectedTile = "";
    saveSheetState(spec.id, state);
    ctx.rerender();
    return true;
  }

  const hlBtn = target.closest("[data-hl-idx]");
  if (hlBtn) {
    const idx = Number(hlBtn.dataset.hlIdx);
    const set = new Set(state.hl);
    if (set.has(idx)) set.delete(idx);
    else set.add(idx);
    state.hl = [...set];
    saveSheetState(spec.id, state);
    ctx.rerender();
    return true;
  }

  if (target.closest("[data-sheet-check]")) {
    graded = true;
    announce(I.S("Sheet checked.", "Hoja revisada."));
    ctx.rerender();
    return true;
  }

  if (target.closest("[data-sheet-reset]")) {
    graded = false;
    selectedTile = "";
    saveSheetState(spec.id, defaultState());
    announce(I.S("Sheet reset.", "Hoja reiniciada."));
    ctx.rerender();
    return true;
  }

  if (target.closest("[data-sheet-toggle-key]")) {
    showKey = !showKey;
    ctx.rerender();
    return true;
  }

  if (target.closest("[data-sheet-print]")) {
    window.print();
    return true;
  }

  const assignBtn = target.closest("[data-sheet-assign]");
  if (assignBtn) {
    const id = assignBtn.dataset.sheetAssign;
    const pending = safeJson(storage.get(PENDING_ASSIGN_KEY), []) || [];
    if (!pending.includes(id)) pending.push(id);
    storage.set(PENDING_ASSIGN_KEY, JSON.stringify(pending));
    const url = `/access-teacher/?assignIds=${encodeURIComponent(pending.join(","))}#assign`;
    announce(I.S("Added to Class Assignment.", "Agregado a la tarea de clase."));
    window.open(url, "_blank", "noopener");
    return true;
  }

  return false;
}

export function onInteractiveSheetInput(e, ctx, activity, customSheet = null) {
  const spec = buildSheetSpec(activity, customSheet);
  const state = getSheetState(spec.id);
  const fibInput = e.target.closest("[data-fib-input]");
  if (fibInput) {
    state.fib[fibInput.dataset.fibInput] = fibInput.value;
    saveSheetState(spec.id, state);
    return true;
  }
  const matchSel = e.target.closest("[data-match-select]");
  if (matchSel) {
    state.match[matchSel.dataset.matchSelect] = matchSel.value;
    saveSheetState(spec.id, state);
    ctx.rerender();
    return true;
  }
  return false;
}
