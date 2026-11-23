// Markup for one activity item and its feedback. Pure string output (util.js `html`): no DOM, no events. The runner
// (runner.js) owns interaction. Rules honoured here: feedback is text plus an icon (never colour alone), a wrong
// answer never prints the answer, every choice group is a native radio group (arrow keys work), every drag-like
// task is tap-based, K-2 gets big targets, a Listen button and picture-forward choices.
import { esc, html, raw } from "../../util.js";
import { makeI18n } from "../../i18n.js";
import { sayButton, visualHTML } from "../art.js";
import { answerText, escRe } from "./core.js";

const L = (n) => String.fromCharCode(65 + n);
export const uid = (item, s = "") => `vaa-${String(item.id).replace(/[^a-zA-Z0-9]+/g, "-")}${s ? `-${s}` : ""}`;
const ctxI = (ctx) => ctx?.I || makeI18n("en");
const bandOf = (item, ctx) => item.band || ctx?.band || "middle";
export const lookupWord = (ctx, id) => ctx?.lookup?.(id) || (ctx?.unit?.words || []).find((w) => w.id === id) || null;

/** Stem text with the blank and highlighted words marked up (text is escaped). */
export function stemHTML(text, hl = []) {
  const terms = (hl || []).filter(Boolean).map(escRe);
  const re = new RegExp(`(___)${terms.length ? `|\\b(${terms.join("|")})\\w*` : ""}`, "gi");
  const t = String(text ?? "");
  let out = "";
  let last = 0;
  for (const m of t.matchAll(re)) {
    out += esc(t.slice(last, m.index));
    out += m[1] ? `<span class="vaa-blank"><span class="vaa-sr">blank</span></span>` : `<mark class="vaa-hl">${esc(m[0])}</mark>`;
    last = m.index + m[0].length;
  }
  return raw(out + esc(t.slice(last)));
}

const markHTML = (I, kind) =>
  kind === "ok"
    ? html`<span class="vaa-mark vaa-mark-ok"><span aria-hidden="true">✓</span> ${I.T("Correct", "Correcto")}</span>`
    : kind === "no"
      ? html`<span class="vaa-mark vaa-mark-no"><span aria-hidden="true">✗</span> ${I.T("Not quite", "Todavía no")}</span>`
      : kind === "ans"
        ? html`<span class="vaa-mark vaa-mark-ok"><span aria-hidden="true">✓</span> ${I.T("The answer", "La respuesta")}</span>`
        : "";

// ── pieces ──────────────────────────────────────────────────────────────────
function passageHTML(item, I, st) {
  const p = item.passage;
  if (!p) return "";
  const text = (p.paras || []).map((x) => html`<p lang="en">${x}</p>`);
  if (p.listenOnly)
    return html`<div class="vaa-passage vaa-listen-box"><p class="vaa-passage-title" lang="en">${p.title}</p>${sayButton(I, (p.paras || []).join(" "), p.title, "vaa-say-lg")}
      <button type="button" class="vaa-textbtn" data-vaa-showtext aria-expanded="${st.checked || st.showText ? "true" : "false"}" aria-controls="${uid(item, "ptext")}">${I.T("Show the words", "Mostrar las palabras")}</button>
      <div class="vaa-listen-text${st.checked || st.showText ? "" : " vaa-collapsed"}" id="${uid(item, "ptext")}">${text}</div></div>`;
  return html`<details class="vaa-passage" open><summary lang="en">${p.title}</summary><div class="vaa-passage-body">${text}</div></details>`;
}

function stemBlock(item, I, st, ctx) {
  const sup = ctx.supports || {};
  const early = bandOf(item, ctx) === "early";
  const w = item.focus ? lookupWord(ctx, item.focus) : null;
  const say = item.speak && (early || sup.readAloud || sup.audio || item.listenOnly) ? sayButton(I, item.speak, "", item.listenOnly ? "vaa-say-lg" : "") : "";
  const stem = item.stem
    ? item.listenOnly
      ? html`<div class="vaa-listen-box">${say}
          <button type="button" class="vaa-textbtn" data-vaa-showtext aria-expanded="${st.checked || st.showText ? "true" : "false"}" aria-controls="${uid(item, "stem")}">${I.T("Show the words", "Mostrar las palabras")}</button>
          <p class="vaa-stem vaa-listen-text${st.checked || st.showText ? "" : " vaa-collapsed"}" id="${uid(item, "stem")}" lang="en">${stemHTML(item.stem, item.hl)}</p></div>`
      : html`<div class="vaa-stem-row"><p class="vaa-stem" id="${uid(item, "stem")}" lang="en">${stemHTML(item.stem, item.hl)}</p>${say}</div>`
    : "";
  const pic = item.visual && w && !item.choiceWords ? html`<div class="vaa-item-pic">${visualHTML(w, { size: early ? "lg" : "md", I })}</div>` : "";
  const gloss = sup.glossaryEs && item.es ? html`<p class="vaa-gloss"><span lang="en">${item.es.hw}</span> = <span lang="es">${item.es.gloss}</span></p>` : "";
  return html`${passageHTML(item, I, st)}${pic}${stem}${gloss}`;
}

function choiceGroup({ item, I, ctx, name, choices, answer, chosen, locked, ok, revealed, choiceWords, lead }) {
  const early = bandOf(item, ctx) === "early";
  const sup = ctx.supports || {};
  return html`<fieldset class="vaa-choices${early ? " vaa-choices-early" : ""}${choiceWords ? " vaa-choices-pics" : ""}" ${locked ? raw("disabled") : ""}>
    <legend class="${lead ? "vaa-lead" : "vaa-sr"}">${lead || I.T("Choose one answer", "Elige una respuesta")}</legend>
    ${choices.map((c, i) => {
      const sel = Number(chosen) === i && chosen != null && chosen !== "";
      const mark = revealed && i === answer ? "ans" : locked && sel ? (ok ? "ok" : "no") : "";
      const word = choiceWords ? lookupWord(ctx, choiceWords[i]) : null;
      const body = word ? visualHTML(word, { size: "md", I }) : html`<span class="vaa-choice-text" lang="en">${c}</span>`;
      return html`<div class="vaa-choice-row"><label class="vaa-choice${sel ? " vaa-sel" : ""}${mark === "no" ? " vaa-wrong" : mark ? " vaa-right" : ""}"><input type="radio" name="${name}" value="${i}" ${sel ? raw("checked") : ""}><span class="vaa-letter" aria-hidden="true">${L(i)}</span><span class="vaa-choice-body">${body}</span>${markHTML(I, mark)}</label>${early && !word && !choiceWords ? sayButton(I, c, `${I.S("choice", "opción")} ${L(i)}`, "vaa-say-sm") : ""}</div>`;
    })}
  </fieldset>`;
}

/** Index of the tile used for each response entry, so duplicate tiles stay distinct. */
function tileState(tiles, response) {
  const used = new Set();
  for (const r of response || []) {
    const i = tiles.findIndex((t, k) => t === r && !used.has(k));
    if (i >= 0) used.add(i);
  }
  return used;
}

function buildArea(item, I, st, locked) {
  const tiles = item.choices || [];
  const resp = st.response || [];
  const used = tileState(tiles, resp);
  const total = item.mode === "order" ? item.answer.length : Math.max(item.answer.length, resp.length);
  return html`<div class="vaa-build">
    ${item.ends ? html`<p class="vaa-ends"><span>${item.ends[0]}</span> <span aria-hidden="true">→</span> <span>${item.ends[1]}</span></p>` : ""}
    <p class="vaa-lead" id="${uid(item, "built-l")}">${item.mode === "order" ? I.T("Your order", "Tu orden") : I.T("Your word", "Tu palabra")}</p>
    <ol class="vaa-built" aria-labelledby="${uid(item, "built-l")}">
      ${resp.map((t, i) => {
        const right = locked && item.answer[i] === t;
        const wrong = locked && item.answer[i] !== t;
        return html`<li><button type="button" class="vaa-tile vaa-tile-placed${right ? " vaa-right" : ""}${wrong ? " vaa-wrong" : ""}" data-vaa-untile="${i}" data-vaa-focus="u${i}" ${locked ? raw("disabled") : ""} aria-label="${I.S("Position", "Posición")} ${i + 1}: ${t}. ${locked ? "" : I.S("Tap to take it out.", "Toca para quitarla.")}">${right ? raw('<span aria-hidden="true">✓ </span>') : wrong ? raw('<span aria-hidden="true">✗ </span>') : ""}${t}</button></li>`;
      })}
      ${Array.from({ length: Math.max(0, total - resp.length) }, (_, k) => html`<li class="vaa-slot" aria-label="${I.S("Empty spot", "Espacio vacío")} ${resp.length + k + 1}"><span aria-hidden="true">${resp.length + k + 1}</span></li>`)}
    </ol>
    <p class="vaa-lead">${I.T("Tap the parts", "Toca las partes")}</p>
    <ul class="vaa-tiles">
      ${tiles.map((t, i) => (used.has(i) ? "" : html`<li><button type="button" class="vaa-tile" data-vaa-tile="${i}" data-vaa-focus="t${i}" ${locked ? raw("disabled") : ""}>${t}</button></li>`))}
    </ul>
    ${locked ? "" : html`<p class="vaa-tools"><button type="button" class="vaa-textbtn" data-vaa-undo ${resp.length ? "" : raw("disabled")}>${I.T("Undo", "Deshacer")}</button> <button type="button" class="vaa-textbtn" data-vaa-clear ${resp.length ? "" : raw("disabled")}>${I.T("Start over", "Empezar de nuevo")}</button></p>`}
  </div>`;
}

function radioRows(item, I, st, locked, kind) {
  const rows = item.items;
  const opts = kind === "sort" ? item.choices : item.choices;
  const resp = st.response || {};
  const res = st.result || {};
  const flags = kind === "sort" ? res.rowOk : res.rowOk;
  return html`
    ${kind === "match" ? html`<p class="vaa-lead" id="${uid(item, "meanings")}">${I.T("Meanings", "Significados")}</p><ol class="vaa-meanings" type="A" aria-labelledby="${uid(item, "meanings")}">${opts.map((o) => html`<li lang="en"><span class="vaa-letter" aria-hidden="true">${L(opts.indexOf(o))}</span> ${o}</li>`)}</ol>` : ""}
    <ul class="vaa-rows">${rows.map((r, i) => {
      const chosen = resp[i];
      const m = locked && flags ? (flags[i] ? "ok" : "no") : "";
      return html`<li class="vaa-row${m === "no" ? " vaa-wrong" : m ? " vaa-right" : ""}">
        <fieldset class="vaa-rowset" ${locked ? raw("disabled") : ""}><legend class="vaa-row-word" lang="en">${r.t} ${markHTML(I, m)}</legend>
          <div class="vaa-pills">${opts.map((o, k) => html`<label class="vaa-pill${Number(chosen) === k && chosen != null ? " vaa-sel" : ""}"><input type="radio" name="vaa-r${i}" value="${k}" ${Number(chosen) === k && chosen != null ? raw("checked") : ""} aria-label="${kind === "match" ? `${I.S("Meaning", "Significado")} ${L(k)}` : o}"><span lang="en">${kind === "match" ? L(k) : o}</span></label>`)}</div>
        </fieldset></li>`;
    })}</ul>`;
}

function typedArea(item, I, st, ctx, locked) {
  const early = bandOf(item, ctx) === "early";
  const sup = ctx.supports || {};
  const val = typeof st.response === "string" ? st.response : "";
  const ok = locked && st.result?.ok;
  if (early && item.bank?.length)
    return html`<fieldset class="vaa-choices vaa-choices-early vaa-bank" ${locked ? raw("disabled") : ""}><legend class="vaa-lead">${I.T("Tap the word that fits", "Toca la palabra que encaja")}</legend>
      ${item.bank.map((b, i) => html`<div class="vaa-choice-row"><label class="vaa-choice${val === b ? " vaa-sel" : ""}${locked && val === b ? (ok ? " vaa-right" : " vaa-wrong") : ""}"><input type="radio" name="vaa-bank" value="${b}" ${val === b ? raw("checked") : ""}><span class="vaa-letter" aria-hidden="true">${L(i)}</span><span class="vaa-choice-body" lang="en">${b}</span>${locked && val === b ? markHTML(I, ok ? "ok" : "no") : ""}</label>${sayButton(I, b, "", "vaa-say-sm")}</div>`)}</fieldset>`;
  return html`<div class="vaa-typed">
    <label class="vaa-lead" for="${uid(item, "in")}">${I.T("Type the missing word", "Escribe la palabra que falta")}</label>
    <input class="vaa-input${locked ? (ok ? " vaa-right" : " vaa-wrong") : ""}" id="${uid(item, "in")}" data-vaa-typed type="text" value="${val}" autocomplete="off" autocapitalize="none" spellcheck="false" ${locked ? raw("readonly") : ""} lang="en">
    ${locked ? markHTML(I, ok ? "ok" : "no") : ""}
    ${sup.wordBank && item.bank?.length && !locked ? html`<p class="vaa-lead">${I.T("Word bank", "Banco de palabras")}</p><ul class="vaa-tiles">${item.bank.map((b) => html`<li><button type="button" class="vaa-tile" data-vaa-bank="${b}" lang="en">${b}</button></li>`)}</ul>` : ""}
  </div>`;
}

function supportBlocks(item, I, st, ctx, locked) {
  const sup = ctx.supports || {};
  const frames = (item.frames || []).filter(Boolean);
  const out = [];
  if (sup.frames && frames.length)
    out.push(html`<div class="vaa-support"><p class="vaa-lead">${I.T("Sentence frames", "Marcos de oraciones")}</p><ul class="vaa-frames">${frames.map((f) => html`<li><span lang="en">${f}</span> ${locked ? "" : html`<button type="button" class="vaa-textbtn" data-vaa-insert="${f}" data-vaa-sup="frames">${I.T("Use", "Usar")}</button>`}</li>`)}</ul></div>`);
  if (sup.starters && (item.starters || []).length)
    out.push(html`<div class="vaa-support"><p class="vaa-lead">${I.T("Sentence starters", "Inicios de oraciones")}</p><ul class="vaa-tiles">${item.starters.map((s) => html`<li><button type="button" class="vaa-tile" data-vaa-insert="${s} " data-vaa-sup="starters" lang="en">${s}…</button></li>`)}</ul></div>`);
  if (sup.wordBank && (item.bank || []).length && item.mode !== "typed")
    out.push(html`<div class="vaa-support"><p class="vaa-lead">${I.T("Word bank", "Banco de palabras")}</p><ul class="vaa-tiles">${item.bank.map((b) => html`<li><button type="button" class="vaa-tile" data-vaa-insert="${b} " data-vaa-sup="wordBank" lang="en">${b}</button></li>`)}</ul></div>`);
  if (sup.organizer && (item.organizer || []).length)
    out.push(html`<div class="vaa-support"><p class="vaa-lead">${I.T("Plan first (only you see this)", "Planea primero (solo tú lo ves)")}</p><div class="vaa-organizer">${item.organizer.map((o, i) => html`<label for="${uid(item, `org${i}`)}">${o}</label><textarea id="${uid(item, `org${i}`)}" rows="2" data-vaa-org="${i}" data-vaa-sup="organizer"></textarea>`)}</div></div>`);
  if (sup.model && item.model && item.modelSafe !== false && !locked)
    out.push(html`<details class="vaa-support vaa-model" data-vaa-model><summary>${I.T("See a model", "Ver un modelo")}</summary><p lang="en"><strong>${item.modelLabel || I.S("Model", "Modelo")}:</strong> ${item.model}</p></details>`);
  if (sup.rehearsal)
    out.push(html`<label class="vaa-check"><input type="checkbox" data-vaa-rehearsed data-vaa-sup="rehearsal"> ${I.T("I said my answer out loud first.", "Primero dije mi respuesta en voz alta.")}</label>`);
  if (sup.anyLanguageResponse)
    out.push(html`<p class="vaa-note">${I.T("You can answer in any language you know. Try to use the lesson words too.", "Puedes responder en cualquier idioma que sepas. Intenta usar también las palabras de la lección.")}</p>`);
  return html`${out}`;
}

function writeArea(item, I, st, ctx, locked) {
  const text = typeof st.response === "string" ? st.response : "";
  return html`<div class="vaa-write">
    ${(item.directions || []).length ? html`<ol class="vaa-directions">${item.directions.map((d) => html`<li>${d}</li>`)}</ol>` : ""}
    ${item.askMore ? html`<p class="vaa-note">${I.T("Questions to answer:", "Preguntas para responder:")} ${item.askMore.join(" ")}</p>` : ""}
    ${supportBlocks(item, I, st, ctx, locked)}
    <label class="vaa-lead" for="${uid(item, "text")}">${I.T("Your response", "Tu respuesta")}</label>
    <textarea class="vaa-textarea" id="${uid(item, "text")}" data-vaa-text rows="${bandOf(item, ctx) === "middle" ? 6 : 4}" ${locked ? raw("readonly") : ""} lang="en">${text}</textarea>
    <p class="vaa-count" data-vaa-count aria-live="off">${I.T("Words", "Palabras")}: <span data-vaa-n>${(text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length}</span>${item.spec?.minWords > 1 ? ` / ${item.spec.minWords}` : ""}</p>
  </div>`;
}

function speakArea(item, I, st, ctx, locked) {
  const r = st.response || {};
  const checked = new Set(r.checked || []);
  const text = r.text || "";
  return html`<div class="vaa-speak">
    ${(item.directions || []).length ? html`<ol class="vaa-directions">${item.directions.map((d) => html`<li>${d}</li>`)}</ol>` : ""}
    ${supportBlocks(item, I, st, ctx, locked)}
    ${item.partner ? "" : html`<div class="vaa-rec" data-vaa-rec-panel>
      <button type="button" class="vaa-btn" data-vaa-rec ${locked ? raw("disabled") : ""}><span aria-hidden="true">🎙</span> ${I.T("Record", "Grabar")}</button>
      <button type="button" class="vaa-btn" data-vaa-stoprec hidden><span aria-hidden="true">⏹</span> ${I.T("Stop", "Detener")}</button>
      <span class="vaa-recstate" data-vaa-recstate role="status"></span>
      <div class="vaa-takes" data-vaa-takes></div>
    </div>
    <label class="vaa-check"><input type="checkbox" data-vaa-said ${r.said ? raw("checked") : ""} ${locked ? raw("disabled") : ""}> ${I.T("I said my answer out loud (to a partner, my teacher, or myself).", "Dije mi respuesta en voz alta (a un compañero, a mi maestro o a mí mismo).")}</label>
    ${bandOf(item, ctx) === "early" ? "" : html`<label class="vaa-lead" for="${uid(item, "text")}">${I.T("Or type a short answer", "O escribe una respuesta corta")}</label><textarea class="vaa-textarea" id="${uid(item, "text")}" data-vaa-text rows="3" ${locked ? raw("readonly") : ""} lang="en">${text}</textarea>`}`}
    <fieldset class="vaa-checklist" ${locked ? raw("disabled") : ""}><legend class="vaa-lead">${I.T("Tick what you did", "Marca lo que hiciste")}</legend>
      ${item.checklist.map((c, i) => html`<label class="vaa-check"><input type="checkbox" data-vaa-check="${i}" ${checked.has(i) ? raw("checked") : ""}> <span lang="en">${c}</span></label>`)}
    </fieldset>
  </div>`;
}

/** One item, ready for the stage. `state`: { response, checked, result, revealed }. */
export function renderItem(item, ctx = {}, state = {}) {
  const I = ctxI(ctx);
  const c = { ...ctx, I };
  const st = state || {};
  const done = Boolean(st.done);
  const res = st.result || {};
  const band = bandOf(item, c);
  const review = item.mode === "write" || item.mode === "speak";
  const wrong = Boolean(st.result && !res.ok && !res.empty);
  const lockedNow = done || (wrong && !review);
  let area = "";
  switch (item.mode) {
    case "choice":
      area = choiceGroup({ item, I, ctx: c, name: uid(item, "c"), choices: item.choices, answer: item.answer, chosen: st.response, locked: lockedNow, ok: res.ok, revealed: st.revealed, choiceWords: item.choiceWords });
      break;
    case "steps":
      area = html`${item.steps.map((s, i) => {
        const shown = i === 0 || (st.response || [])[i - 1] != null;
        return html`<div class="vaa-step" data-vaa-step="${i}" ${shown ? "" : raw("hidden")}>${choiceGroup({ item, I, ctx: c, name: uid(item, `s${i}`), choices: s.choices, answer: s.answer, chosen: (st.response || [])[i], locked: lockedNow, ok: res.stepOk?.[i], revealed: st.revealed, lead: s.prompt })}</div>`;
      })}`;
      break;
    case "typed":
      area = typedArea(item, I, st, c, lockedNow);
      break;
    case "order":
    case "build":
      area = buildArea(item, I, st, lockedNow);
      break;
    case "sort":
    case "match":
      area = radioRows(item, I, st, lockedNow, item.mode);
      break;
    case "write":
      area = writeArea(item, I, st, c, done);
      break;
    case "speak":
      area = speakArea(item, I, st, c, done);
      break;
    default:
      throw new Error(`renderItem: unknown mode "${item.mode}"`);
  }
  return html`<section class="vaa-item vaa-mode-${item.mode} vaa-band-${band}" data-vaa-item="${item.id}" aria-labelledby="${uid(item, "q")}">
    <p class="vaa-prompt" id="${uid(item, "q")}" tabindex="-1" lang="en">${item.prompt}</p>
    ${stemBlock(item, I, st, c)}
    ${area}
  </section>`;
}

// ── feedback and actions ────────────────────────────────────────────────────
const ICON = { ok: "✓", no: "✗", info: "ℹ" };
const line = (kind, text) => html`<li class="vaa-fb-line vaa-fb-${kind}"><span class="vaa-fb-icon" aria-hidden="true">${ICON[kind] || ICON.info}</span> <span>${text}</span></li>`;

/** The feedback region content: text plus icon, hint on request, explanation only once it is safe to show. */
export function feedbackHTML(item, ctx = {}, state = {}) {
  const I = ctxI(ctx);
  const res = state.result;
  const rows = [];
  if (!res) return state.hint ? html`<ul class="vaa-fb">${line("info", html`<strong>${I.T("Hint", "Pista")}:</strong> ${item.hint}`)}</ul>` : "";
  const review = res.review;
  if (res.empty) rows.push(line("info", res.feedback[0].text));
  else if (review) {
    rows.push(line(res.ok ? "ok" : "info", res.ok ? I.T("Your response has everything these checks look for.", "Tu respuesta tiene todo lo que buscan estas revisiones.") : I.T("Not finished yet. Here is what is missing.", "Todavía no está terminado. Esto es lo que falta.")));
    for (const f of res.feedback) rows.push(line(f.ok === true ? "ok" : f.ok === false ? "no" : "info", f.text));
    rows.push(line("info", item.mode === "write" ? I.T("These checks count words and look for the lesson words. They cannot tell whether your meaning is right. Your response is saved for your teacher to read.", "Estas revisiones cuentan palabras y buscan las palabras de la lección. No pueden decir si tu significado es correcto. Tu respuesta se guarda para que tu maestro la lea.") : I.T("You checked this yourself. Your teacher can see what you ticked.", "Lo revisaste tú mismo. Tu maestro puede ver lo que marcaste.")));
  } else if (res.ok) {
    rows.push(line("ok", state.attempt > 1 ? I.T("Correct. You got it on a try.", "Correcto. Lo lograste en otro intento.") : I.T("Correct.", "Correcto.")));
    for (const f of res.feedback || []) rows.push(line("info", f.text));
  } else {
    rows.push(line("no", res.partial ? I.T(`Not quite: ${res.partial.right} of ${res.partial.total} are right.`, `Todavía no: ${res.partial.right} de ${res.partial.total} están bien.`) : I.T("Not quite. Try again.", "Todavía no. Inténtalo de nuevo.")));
    for (const f of res.feedback || []) rows.push(line("info", f.text));
  }
  if (state.hint && !state.done) rows.push(line("info", html`<strong>${I.T("Hint", "Pista")}:</strong> ${item.hint}`));
  const safe = Boolean(state.done);
  if (safe && state.revealed && !review) {
    const a = answerText(item);
    if (a) rows.push(line("info", html`<strong>${I.T("The answer", "La respuesta")}:</strong> <span lang="en">${a}</span>`));
  }
  if (safe && item.explain) rows.push(line("info", html`<span lang="en">${item.explain}</span>`));
  if (safe && review && item.model) rows.push(line("info", html`<strong>${item.modelLabel || I.S("Model", "Modelo")}:</strong> <span lang="en">${item.model}</span>`));
  if (safe && review && item.selfCheck?.length) rows.push(line("info", html`<strong>${I.T("A strong answer shows", "Una respuesta fuerte muestra")}:</strong> <span lang="en">${item.selfCheck.join("; ")}.</span>`));
  return html`<ul class="vaa-fb">${rows}</ul>`;
}

/** Buttons for the current phase: answering, wrong (retry), or done. */
export function actionsHTML(item, ctx = {}, state = {}, { last = false } = {}) {
  const I = ctxI(ctx);
  const btn = (attr, label, cls = "") => html`<button type="button" class="vaa-btn ${cls}" ${raw(attr)}>${label}</button>`;
  const review = item.mode === "write" || item.mode === "speak";
  if (state.done) return html`${btn("data-vaa-next", last ? I.T("See results", "Ver resultados") : I.T("Next", "Siguiente"), "vaa-primary")}`;
  const hint = item.hint ? btn("data-vaa-hint", state.hint ? I.T("Hide hint", "Ocultar pista") : I.T("Hint", "Pista")) : "";
  if (state.result && !state.result.ok && !state.result.empty)
    return html`${btn("data-vaa-retry", review ? I.T("Revise", "Revisar") : I.T("Try again", "Intentar de nuevo"), "vaa-primary")}${hint}${state.attempt >= 2 || review ? btn("data-vaa-reveal", review ? I.T("Move on", "Continuar") : I.T("Show the answer", "Mostrar la respuesta")) : ""}`;
  if (state.result?.ok && review) return html`${btn("data-vaa-finish", I.T("Save and continue", "Guardar y continuar"), "vaa-primary")}${btn("data-vaa-retry", I.T("Revise", "Revisar"))}`;
  return html`${btn("data-vaa-check", I.T("Check", "Comprobar"), "vaa-primary")}${hint}`;
}
